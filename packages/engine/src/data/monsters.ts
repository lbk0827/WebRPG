// 몬스터 (M2-1 사람 / M2-5a 짐승·괴물). 몬스터도 수칙으로 움직인다 — 별도 AI 없음 (docs/07 §3.9).
// 지역이 깊어질수록 수칙이 정교해진다 → 몬스터 수칙 자체가 플레이어에게 교재가 된다.
// 원형 8종: 잡몹 · 돌격 · 방벽 · 사격 · 주술(시전) · 독 · 다수 · 보스.
import type { CharSetup, Condition, GuardPolicy, Row, RuleRow, RuleSet, StatKey, Stats, StatusId } from '../types'
import { PRESETS } from './presets'
import { EMPTY_ALLOC, growthStats } from '../progression'

/** 몬스터 전용 아이콘 (assets/monsters/*.svg). 없으면 job 의 직업 아이콘을 쓴다 */
export const MONSTER_ICONS = ['goblin', 'beast', 'turtle', 'harpy', 'shaman', 'spider', 'swarm', 'ogre'] as const
export type MonsterIcon = (typeof MONSTER_ICONS)[number]
const ICON_SET: ReadonlySet<string> = new Set(MONSTER_ICONS)
export const isMonsterIcon = (key: string): boolean => ICON_SET.has(key)

/** 원형 — 도감 표시용 분류 (docs/07 §3.9) */
export type Archetype = 'mob' | 'rush' | 'wall' | 'shooter' | 'caster' | 'venom' | 'horde' | 'boss'
export const ARCHETYPE_LABEL: Record<Archetype, string> = {
  mob: '잡몹', rush: '돌격', wall: '방벽', shooter: '사격', caster: '주술', venom: '독', horde: '다수', boss: '보스',
}

export interface MonsterDef {
  id: string
  name: string
  /** 기본 스탯·기본 스킬을 빌려올 직업 */
  job: string
  /** 표시 아이콘. 생략 시 job 의 직업 아이콘 (사람 상대) */
  icon?: MonsterIcon
  archetype: Archetype
  level: number
  /** 레벨당 성장 (분배 스탯 환산). 생략 시 HP/SP 만 레벨 스케일 */
  growth?: Partial<Record<StatKey, number>>
  /** 성장 적용 후 덮어쓸 스탯 */
  stats?: Partial<Stats>
  skills?: string[]
  /**
   * 특성 (data/traits.ts). M2-7 의 후반 지역용 — **저쪽도 전직했다**.
   * 훅 특성을 그대로 쓰므로, 플레이어가 자기 훅을 배우는 교재가 된다.
   */
  traits?: string[]
  rules: RuleSet
  row?: Row
  guard?: GuardPolicy
  exp: number
  gold: number
  /** 지역 목록에 표시하지 않는 희귀 조우 (S12 채택) */
  hidden?: boolean
  /** 드롭 테이블 (만분율). 한 몬스터당 최대 1개 — 위에서부터 굴려 처음 당첨된 것 (S12 채택) */
  drops?: { itemId: string; permyriad: number }[]
}

const always: Condition = { op: 'always' }
const atom = (a: Extract<Condition, { op: 'atom' }>['atom']): Condition => ({ op: 'atom', atom: a })
const and = (...nodes: Condition[]): Condition => ({ op: 'and', nodes })
const row = (condition: Condition, skillId: string, maxUses?: number): RuleRow =>
  maxUses === undefined ? { condition, skillId } : { condition, skillId, maxUses }
const rules = (...rows: RuleRow[]): RuleSet => ({ rows })
const strikeOnly = rules(row(always, 'strike'))
const sp = (v: number) => atom({ kind: 'selfSpAbs', cmp: 'gte', value: v })
const hpBelow = (v: number) => atom({ kind: 'selfHpPct', cmp: 'lte', value: v })
const firstAction = atom({ kind: 'selfActionCount', cmp: 'eq', value: 1 })
// 만렙 50 확장 상대(docs/22 §5)의 수칙이 길어져서 자주 쓰는 조건에 이름을 붙였다
const foesAlive = (n: number) => atom({ kind: 'teamAliveCount', side: 'enemy', cmp: 'gte', value: n })
const foesCasting = atom({ kind: 'teamCastingCount', side: 'enemy', cmp: 'gte', value: 1 })
const foesFresh = (v: number) => atom({ kind: 'teamAnyHpPct', side: 'enemy', cmp: 'gte', value: v })
const foeStatusAtMost = (status: StatusId, v: number) => atom({ kind: 'teamStatusCount', side: 'enemy', status, cmp: 'lte', value: v })
const foeBackRow = (n: number) => atom({ kind: 'teamRowCount', side: 'enemy', row: 'back', cmp: 'gte', value: n })
const allyHurt = (v: number) => atom({ kind: 'teamAnyHpPct', side: 'ally', cmp: 'lte', value: v })
const allyAvgBelow = (v: number) => atom({ kind: 'teamAvgHpPct', side: 'ally', cmp: 'lte', value: v })
const allyAliveAtMost = (n: number) => atom({ kind: 'teamAliveCount', side: 'ally', cmp: 'lte', value: n })
const allyDead = atom({ kind: 'teamDeadCount', side: 'ally', cmp: 'gte', value: 1 })
const selfHpAbove = (v: number) => atom({ kind: 'selfHpPct', cmp: 'gte', value: v })

/** 몬스터 정의 → 전투용 CharSetup. idx 는 팀 내 순번. id 앞부분이 아이콘 키가 된다 */
export function monsterSetup(def: MonsterDef, idx: number): CharSetup {
  const p = PRESETS[def.job]
  if (!p) throw new Error(`unknown job: ${def.job}`)
  const alloc = { ...EMPTY_ALLOC }
  for (const k of Object.keys(def.growth ?? {}) as StatKey[]) alloc[k] = (def.growth?.[k] ?? 0) * (def.level - 1)
  const stats: Stats = { ...growthStats(p.stats, def.level, alloc), ...def.stats }
  return {
    id: `${def.icon ?? p.id}#${idx}`,
    name: def.name,
    level: def.level,
    row: def.row ?? p.row,
    guard: structuredClone(def.guard ?? p.guard),
    stats,
    skills: [...(def.skills ?? p.skills)],
    ...(def.traits ? { traits: [...def.traits] } : {}),
    rules: structuredClone(def.rules),
    monster: { exp: def.exp, gold: def.gold, drops: def.drops ? def.drops.map((d) => ({ ...d })) : undefined },
  }
}

const list: MonsterDef[] = [
  // ───────── 마을 외곽: 탈영병. 훈련 안 된 전사. 수칙 1줄
  {
    id: 'deserter', name: '탈영병', job: 'warrior', archetype: 'mob', level: 1,
    stats: { maxHp: 320, str: 32, def: 10 }, guard: { mode: 'never' }, rules: strikeOnly,
    drops: [{ itemId: 'ironScrap', permyriad: 3000 }, { itemId: 'leather', permyriad: 2000 }], exp: 14, gold: 8,
  },
  {
    id: 'deserterArcher', name: '탈영 궁수', job: 'elf', archetype: 'shooter', level: 2,
    stats: { maxHp: 240 }, rules: rules(row(sp(12), 'pierceShot'), row(always, 'strike')),
    drops: [{ itemId: 'feather', permyriad: 3500 }, { itemId: 'leather', permyriad: 1500 }], exp: 18, gold: 10,
  },

  // ───────── 가도: 도적단. 독과 저격. 수칙 2줄
  {
    id: 'banditKnife', name: '도적단 단검수', job: 'rogue', archetype: 'venom', level: 4, growth: { dex: 2, spd: 1 },
    rules: rules(row(sp(8), 'venom'), row(always, 'strike')),
    drops: [{ itemId: 'leather', permyriad: 3500 }, { itemId: 'ironScrap', permyriad: 2000 }], exp: 30, gold: 18,
  },
  {
    id: 'banditArcher', name: '도적단 궁수', job: 'elf', archetype: 'shooter', level: 4, growth: { dex: 2 },
    rules: rules(row(sp(12), 'pierceShot'), row(always, 'strike')),
    drops: [{ itemId: 'feather', permyriad: 4000 }, { itemId: 'leather', permyriad: 1500 }], exp: 30, gold: 16,
  },
  {
    id: 'banditBoss', name: '도적 두목', job: 'warrior', archetype: 'boss', level: 6, growth: { str: 3, spd: 1 },
    guard: { mode: 'always' }, hidden: true,
    rules: rules(row(firstAction, 'warCry', 1), row(sp(8), 'heavyBlow'), row(always, 'strike')),
    drops: [{ itemId: 'bossSeal', permyriad: 10000 }], exp: 90, gold: 60,
  },

  // ───────── 폐허 요새: 경쟁 용병단. 우리와 같은 직업, 제대로 된 수칙 (프리셋 기본 수칙)
  {
    id: 'rivalWarrior', name: '경쟁 용병 전사', job: 'warrior', archetype: 'mob', level: 8, growth: { str: 3, spd: 1, luk: 1 },
    rules: structuredClone(PRESETS.warrior.rules),
    drops: [{ itemId: 'ironScrap', permyriad: 4500 }, { itemId: 'leather', permyriad: 2000 }], exp: 55, gold: 30,
  },
  {
    id: 'rivalRogue', name: '경쟁 용병 도적', job: 'rogue', archetype: 'venom', level: 8, growth: { dex: 3, spd: 2 },
    rules: structuredClone(PRESETS.rogue.rules),
    drops: [{ itemId: 'leather', permyriad: 4500 }, { itemId: 'ironScrap', permyriad: 2000 }], exp: 55, gold: 30,
  },
  {
    id: 'rivalMage', name: '경쟁 용병 마법사', job: 'mage', archetype: 'caster', level: 8, growth: { int: 4, dex: 1 },
    rules: structuredClone(PRESETS.mage.rules),
    drops: [{ itemId: 'manaCrystal', permyriad: 4500 }], exp: 55, gold: 30,
  },
  {
    id: 'rivalPriest', name: '경쟁 용병 프리스트', job: 'priest', archetype: 'caster', level: 8, growth: { int: 3, luk: 2 },
    row: 'back', skills: ['strike', 'mendChant', 'mend', 'resurrect'],
    // 교재: 후열에서 계속 되돌린다. 앞만 때리면 끝나지 않는다 — 뒤를 치거나 시전을 끊어라 (docs/18 §6 B)
    rules: rules(
      row(atom({ kind: 'teamDeadCount', side: 'ally', cmp: 'gte', value: 1 }), 'resurrect'),
      row(and(sp(12), atom({ kind: 'teamAnyHpPctBelow', side: 'ally', value: 70 })), 'mendChant'),
      row(and(sp(10), atom({ kind: 'teamAnyHpPctBelow', side: 'ally', value: 45 })), 'mend'),
      row(always, 'strike'),
    ),
    drops: [{ itemId: 'holyWater', permyriad: 4500 }, { itemId: 'manaCrystal', permyriad: 1500 }], exp: 55, gold: 30,
  },
  {
    id: 'rivalElf', name: '경쟁 용병 엘프', job: 'elf', archetype: 'shooter', level: 8, growth: { dex: 4, spd: 1 },
    rules: structuredClone(PRESETS.elf.rules),
    drops: [{ itemId: 'feather', permyriad: 4500 }, { itemId: 'leather', permyriad: 2000 }], exp: 55, gold: 30,
  },

  // ───────── 늑대 골짜기: 첫 짐승. 다수형과 돌격형 — "빠른 것이 먼저 때린다"
  {
    id: 'batSwarm', name: '박쥐 떼', job: 'elf', icon: 'swarm', archetype: 'horde', level: 9, growth: { spd: 3, str: 2 },
    stats: { maxHp: 620, str: 66, def: 10, mdef: 10 }, row: 'front', guard: { mode: 'never' },
    skills: ['strike'], rules: strikeOnly,
    drops: [{ itemId: 'beastFang', permyriad: 2500 }], exp: 50, gold: 22,
  },
  {
    id: 'wildDog', name: '들개', job: 'rogue', icon: 'beast', archetype: 'rush', level: 10, growth: { str: 7, spd: 3 },
    stats: { maxHp: 1150, def: 18 }, row: 'front', guard: { mode: 'never' },
    skills: ['strike', 'flurry'],
    rules: rules(row(sp(10), 'flurry'), row(always, 'strike')),
    drops: [{ itemId: 'beastFang', permyriad: 4000 }, { itemId: 'leather', permyriad: 2500 }], exp: 70, gold: 35,
  },
  {
    id: 'starvingDog', name: '굶주린 들개', job: 'rogue', icon: 'beast', archetype: 'rush', level: 12, growth: { str: 8, spd: 3 },
    stats: { maxHp: 1320, def: 20 }, row: 'front', guard: { mode: 'never' },
    skills: ['strike', 'flurry', 'warCry'],
    // 교재: 궁지에 몰리면 더 사나워진다 — HP 가 깎일수록 위험하다
    rules: rules(row(and(hpBelow(50), sp(8)), 'warCry', 1), row(sp(10), 'flurry'), row(always, 'strike')),
    drops: [{ itemId: 'beastFang', permyriad: 4500 }, { itemId: 'leather', permyriad: 2500 }], exp: 85, gold: 42,
  },

  // ───────── 고블린 부락: 잡몹 + 주술. "시전을 끊어라"
  {
    id: 'goblin', name: '고블린', job: 'warrior', icon: 'goblin', archetype: 'mob', level: 13,
    stats: { maxHp: 1150, str: 96, def: 22 }, guard: { mode: 'never' },
    skills: ['strike'], rules: strikeOnly,
    drops: [{ itemId: 'ironScrap', permyriad: 3500 }, { itemId: 'leather', permyriad: 2000 }], exp: 85, gold: 45,
  },
  {
    id: 'goblinFighter', name: '고블린 전사', job: 'warrior', icon: 'goblin', archetype: 'mob', level: 14, growth: { str: 7 },
    stats: { maxHp: 1200, def: 26 }, guard: { mode: 'hpAbove', pct: 40 },
    skills: ['strike', 'heavyBlow'],
    rules: rules(row(sp(8), 'heavyBlow'), row(always, 'strike')),
    drops: [{ itemId: 'ironScrap', permyriad: 4500 }], exp: 100, gold: 55,
  },
  {
    id: 'goblinShaman', name: '고블린 주술사', job: 'mage', icon: 'shaman', archetype: 'caster', level: 15, growth: { int: 5 },
    stats: { maxHp: 720 }, row: 'back', skills: ['strike', 'bolt', 'fireball', 'mendChant', 'meditate'],
    // 교재: 준비가 긴 기술을 쓴다 — 끊으면 아무것도 못 한다. 놔두면 동료를 되돌리기까지 한다
    rules: rules(
      row(and(sp(12), atom({ kind: 'teamAnyHpPctBelow', side: 'ally', value: 55 })), 'mendChant'),
      row(sp(14), 'fireball'),
      row(sp(6), 'bolt'),
      row(always, 'meditate'),
    ),
    drops: [{ itemId: 'manaCrystal', permyriad: 4500 }], exp: 110, gold: 60,
  },
  {
    id: 'goblinChief', name: '고블린 족장', job: 'warrior', icon: 'goblin', archetype: 'boss', level: 17, growth: { str: 3, spd: 1 },
    stats: { maxHp: 2400, def: 32 }, guard: { mode: 'always' }, hidden: true,
    skills: ['strike', 'heavyBlow', 'sweep', 'warCry'],
    rules: rules(row(firstAction, 'warCry', 1), row(atom({ kind: 'teamAliveCount', side: 'enemy', cmp: 'gte', value: 4 }), 'sweep'), row(sp(8), 'heavyBlow'), row(always, 'strike')),
    drops: [{ itemId: 'bossSeal', permyriad: 10000 }], exp: 260, gold: 150,
  },

  // ───────── 거미 숲: 독과 사격. "정화를 준비해라"
  {
    id: 'spider', name: '독거미', job: 'rogue', icon: 'spider', archetype: 'venom', level: 16, growth: { dex: 5, str: 3 },
    stats: { maxHp: 1300, def: 24 }, guard: { mode: 'never' },
    skills: ['strike', 'venom'],
    rules: rules(row(and(sp(8), atom({ kind: 'teamStatusCount', side: 'enemy', status: 'poison', cmp: 'lte', value: 2 })), 'venom'), row(always, 'strike')),
    drops: [{ itemId: 'venomSac', permyriad: 4000 }], exp: 120, gold: 62,
  },
  {
    id: 'greatSpider', name: '큰 독거미', job: 'rogue', icon: 'spider', archetype: 'venom', level: 18, growth: { dex: 4, str: 2 },
    stats: { maxHp: 1650, def: 30 }, guard: { mode: 'never' },
    skills: ['strike', 'venomStrong', 'poisonArrow'],
    rules: rules(row(sp(10), 'poisonArrow'), row(sp(8), 'venomStrong'), row(always, 'strike')),
    drops: [{ itemId: 'venomSac', permyriad: 5000 }, { itemId: 'beastFang', permyriad: 5500 }], exp: 145, gold: 75,
  },
  {
    id: 'broodMother', name: '거미 어미', job: 'mage', icon: 'spider', archetype: 'caster', level: 18, growth: { int: 5 },
    stats: { maxHp: 1150, def: 18, mdef: 22 }, row: 'back', skills: ['strike', 'hex', 'bolt', 'meditate'],
    // 교재: 준비가 아주 긴 광역기. 끊으면 아무 일도 없고, 놔두면 전원이 독까지 뒤집어쓴다
    rules: rules(row(sp(20), 'hex'), row(sp(6), 'bolt'), row(always, 'meditate')),
    drops: [{ itemId: 'venomSac', permyriad: 5500 }, { itemId: 'beastFang', permyriad: 5000 }, { itemId: 'manaCrystal', permyriad: 2500 }], exp: 150, gold: 80,
  },
  {
    id: 'harpy', name: '하피', job: 'elf', icon: 'harpy', archetype: 'shooter', level: 17, growth: { dex: 4, spd: 2 },
    stats: { maxHp: 950, def: 14 }, row: 'back',
    skills: ['strike', 'pierceShot'],
    rules: rules(row(sp(12), 'pierceShot'), row(always, 'strike')),
    drops: [{ itemId: 'feather', permyriad: 5000 }], exp: 130, gold: 68,
  },

  // ───────── 무너진 성채: 방벽과 저격. "엄호를 뚫거나, 뒤를 쳐라"
  {
    id: 'rockTurtle', name: '바위 거북', job: 'warrior', icon: 'turtle', archetype: 'wall', level: 20, growth: { str: 1 },
    stats: { maxHp: 1250, def: 30, mdef: 20, spd: 18 }, guard: { mode: 'always' },
    skills: ['strike', 'ironSkin'],
    // 교재: 엄호 + 방어 강화. 전열을 때려서는 답이 없다 — 엄호 무시 기술이나 후열 저격이 필요하다
    rules: rules(row(atom({ kind: 'selfHasStatus', status: 'defUp' }), 'strike'), row(sp(8), 'ironSkin', 2), row(always, 'strike')),
    drops: [{ itemId: 'ironScrap', permyriad: 5000 }], exp: 165, gold: 85,
  },
  {
    id: 'stoneChanter', name: '돌의 창자', job: 'priest', icon: 'shaman', archetype: 'caster', level: 21, growth: { int: 4, luk: 1 },
    stats: { maxHp: 1050, def: 16, mdef: 24 }, row: 'back', guard: { mode: 'never' },
    skills: ['strike', 'mendChant', 'bolt'],
    // 교재: 후열에서 계속 되돌린다. 엄호를 무시하는 기술이나 후열 저격이 없으면 전열이 죽지 않는다
    rules: rules(row(and(sp(12), atom({ kind: 'teamAnyHpPctBelow', side: 'ally', value: 75 })), 'mendChant'), row(sp(6), 'bolt'), row(always, 'strike')),
    drops: [{ itemId: 'holyWater', permyriad: 5000 }, { itemId: 'manaCrystal', permyriad: 2000 }], exp: 175, gold: 90,
  },
  {
    id: 'harpyFlock', name: '하피 무리', job: 'elf', icon: 'harpy', archetype: 'shooter', level: 21, growth: { dex: 1, spd: 1 },
    stats: { maxHp: 880, def: 12 }, row: 'back',
    skills: ['strike', 'pierceShot', 'snipe'],
    rules: rules(row(sp(14), 'snipe'), row(sp(12), 'pierceShot'), row(always, 'strike')),
    drops: [{ itemId: 'feather', permyriad: 5500 }], exp: 175, gold: 90,
  },
  {
    id: 'ogreVanguard', name: '오우거 전위', job: 'warrior', icon: 'ogre', archetype: 'rush', level: 22, growth: { str: 1, spd: 1 },
    stats: { maxHp: 1350, def: 20 }, guard: { mode: 'hpAbove', pct: 50 },
    skills: ['strike', 'sweep', 'heavyBlow'],
    rules: rules(row(atom({ kind: 'teamAliveCount', side: 'enemy', cmp: 'gte', value: 4 }), 'sweep'), row(sp(8), 'heavyBlow'), row(always, 'strike')),
    drops: [{ itemId: 'leather', permyriad: 3500 }, { itemId: 'beastFang', permyriad: 3500 }, { itemId: 'ironScrap', permyriad: 3000 }, { itemId: 'ogreCore', permyriad: 2000 }], exp: 190, gold: 100,
  },

  // ───────── 심연의 굴: 마지막. 보스 수칙은 우리 것과 같은 수준
  {
    id: 'ogre', name: '오우거', job: 'warrior', icon: 'ogre', archetype: 'boss', level: 26, growth: { str: 1, spd: 1 },
    // 패턴 5줄을 쓰려면 지능 10 이 필요하다 (INT → 패턴 칸. 플레이어와 같은 규칙)
    stats: { maxHp: 1850, def: 24, int: 12 }, guard: { mode: 'hpAbove', pct: 40 },
    skills: ['strike', 'sweep', 'heavyBlow', 'warCry', 'sunder'],
    rules: rules(
      row(firstAction, 'warCry', 1),
      row(atom({ kind: 'teamAliveCount', side: 'enemy', cmp: 'gte', value: 4 }), 'sweep'),
      row(and(sp(8), atom({ kind: 'teamAnyHpPct', side: 'enemy', cmp: 'gte', value: 70 })), 'sunder'),
      row(sp(8), 'heavyBlow'),
      row(always, 'strike'),
    ),
    drops: [{ itemId: 'beastFang', permyriad: 4000 }, { itemId: 'ogreCore', permyriad: 3500 }, { itemId: 'leather', permyriad: 4000 }], exp: 240, gold: 130,
  },
  {
    id: 'abyssOgre', name: '심연의 오우거', job: 'warrior', icon: 'ogre', archetype: 'boss', level: 30, growth: { str: 2, spd: 1 },
    // 6줄 → 지능 20
    stats: { maxHp: 3400, def: 32, mdef: 22, int: 22 }, guard: { mode: 'always' }, hidden: true,
    skills: ['strike', 'sweep', 'heavyBlow', 'warCry', 'sunder', 'ironSkin'],
    rules: rules(
      row(firstAction, 'warCry', 1),
      row(and(hpBelow(50), sp(8)), 'ironSkin', 2),
      row(atom({ kind: 'teamAliveCount', side: 'enemy', cmp: 'gte', value: 4 }), 'sweep'),
      row(and(sp(8), atom({ kind: 'teamAnyHpPct', side: 'enemy', cmp: 'gte', value: 60 })), 'sunder'),
      row(sp(8), 'heavyBlow'),
      row(always, 'strike'),
    ),
    drops: [{ itemId: 'bossSeal', permyriad: 4000 }, { itemId: 'ogreCore', permyriad: 10000 }], exp: 600, gold: 400,
  },

  // ═════════ M2-7 후반 지역: 상대도 전직했다 ═════════
  //
  // 여기서부터 적은 짐승이 아니라 **훈련된 용병단**이다. 2차 직업의 훅 특성과 대표 스킬을
  // 그대로 들고 나온다 (ADR-003). 그래서 두 가지 일을 한다.
  //   1. **관문** — 전직하지 않은 편성은 넘지 못한다. 레벨이 아니라 설계가 문턱이다
  //   2. **교재** — 플레이어가 고른 2차 직업이 어떻게 싸우는지 상대 쪽에서 먼저 보여 준다
  //
  // 사람이므로 아이콘은 직업 아이콘을 쓴다 (새 그림이 필요 없다).

  // ───────── 서리 관문 (Lv26~30)
  {
    id: 'gateGuardian', name: '관문 수호기사', job: 'warrior', archetype: 'wall', level: 36,
    growth: { str: 2, spd: 1 },
    // 5줄 → 지능 10 이상. 엄호 문턱을 낮게 잡은 수호기사 — 플레이어의 aegis 훅과 같은 것
    stats: { maxHp: 4420, def: 42, mdef: 28, int: 12 }, guard: { mode: 'always' },
    traits: ['aegis', 'ironWill'],
    skills: ['strike', 'bulwark', 'taunt', 'heavyBlow', 'ironSkin'],
    rules: rules(
      row(firstAction, 'bulwark', 1),
      row(and(sp(10), atom({ kind: 'teamAnyHpPct', side: 'ally', cmp: 'lte', value: 55 })), 'taunt'),
      row(and(hpBelow(55), sp(8)), 'ironSkin', 2),
      row(sp(8), 'heavyBlow'),
      row(always, 'strike'),
    ),
    drops: [{ itemId: 'ironScrap', permyriad: 5000 }, { itemId: 'leather', permyriad: 3000 }], exp: 300, gold: 170,
  },
  {
    id: 'frostBerserker', name: '서리 광전사', job: 'warrior', archetype: 'rush', level: 35,
    growth: { str: 3, spd: 2 },
    // 교재: **HP 가 넉넉할 때만 태운다.** 플레이어의 피의 분노와 같은 판단이다 (docs/18 §12)
    stats: { maxHp: 3230, def: 28, int: 12 },
    traits: ['bloodRage'],
    skills: ['strike', 'recklessSwing', 'heavyBlow', 'warCry', 'bloodlust'],
    rules: rules(
      row(firstAction, 'warCry', 1),
      row(and(hpBelow(30), sp(12)), 'bloodlust'),
      row(and(atom({ kind: 'selfHpPct', cmp: 'gte', value: 60 }), sp(10)), 'recklessSwing'),
      row(sp(8), 'heavyBlow'),
      row(always, 'strike'),
    ),
    drops: [{ itemId: 'beastFang', permyriad: 4000 }, { itemId: 'leather', permyriad: 3000 }], exp: 290, gold: 165,
  },
  {
    id: 'gateMarksman', name: '관문 사수', job: 'elf', archetype: 'shooter', level: 35,
    growth: { dex: 3, spd: 2 }, row: 'back',
    stats: { maxHp: 2125, int: 12 },
    traits: ['sniperEye', 'deadeye'],
    skills: ['strike', 'snipe', 'volley', 'pierceShot'],
    rules: rules(
      row(and(sp(14), atom({ kind: 'teamRowCount', side: 'enemy', row: 'back', cmp: 'gte', value: 2 })), 'snipe'),
      row(and(sp(16), atom({ kind: 'teamAliveCount', side: 'enemy', cmp: 'gte', value: 4 })), 'volley'),
      row(sp(12), 'pierceShot'),
      row(always, 'strike'),
    ),
    drops: [{ itemId: 'feather', permyriad: 5000 }, { itemId: 'beastFang', permyriad: 2500 }], exp: 285, gold: 160,
  },
  {
    id: 'frostChanter', name: '서리 주술사', job: 'mage', archetype: 'caster', level: 36,
    growth: { int: 3, spd: 1 }, row: 'back',
    stats: { maxHp: 1870, int: 38 },
    traits: ['foresight', 'quickCast'],
    skills: ['bolt', 'maelstrom', 'stasis', 'hex', 'emberfall'],
    // 교재: 넓게 칠 것인가 순서를 바꿀 것인가 — 원소술사와 시간술사를 한 몸에 붙였다
    rules: rules(
      row(and(sp(16), atom({ kind: 'teamAliveCount', side: 'enemy', cmp: 'gte', value: 4 })), 'maelstrom'),
      row(and(sp(16), atom({ kind: 'teamCastingCount', side: 'enemy', cmp: 'gte', value: 1 })), 'stasis'),
      row(and(sp(12), atom({ kind: 'teamStatusCount', side: 'enemy', status: 'atkDown', cmp: 'lte', value: 0 })), 'hex'),
      row(sp(10), 'emberfall'),
      row(always, 'bolt'),
    ),
    drops: [{ itemId: 'manaCrystal', permyriad: 5500 }, { itemId: 'ironScrap', permyriad: 2000 }], exp: 300, gold: 175,
  },
  {
    id: 'gateChaplain', name: '관문 사제', job: 'priest', archetype: 'caster', level: 36,
    growth: { int: 3, luk: 2 }, row: 'back',
    stats: { maxHp: 2040, int: 40 },
    traits: ['zeal', 'highLiturgy'],
    skills: ['strike', 'mendChant', 'mend', 'resurrect', 'condemn', 'judgment'],
    // 교재: 되돌리면서 걸고 친다. 뒤를 치거나 시전을 끊지 않으면 끝나지 않는다
    rules: rules(
      row(atom({ kind: 'teamDeadCount', side: 'ally', cmp: 'gte', value: 1 }), 'resurrect'),
      row(and(sp(12), atom({ kind: 'teamAnyHpPctBelow', side: 'ally', value: 55 })), 'mendChant'),
      row(and(sp(10), atom({ kind: 'teamAnyHpPctBelow', side: 'ally', value: 35 })), 'mend'),
      row(and(sp(20), atom({ kind: 'teamStatusCount', side: 'enemy', status: 'atkDown', cmp: 'lte', value: 1 })), 'condemn'),
      row(sp(12), 'judgment'),
      row(always, 'strike'),
    ),
    drops: [{ itemId: 'holyWater', permyriad: 5500 }, { itemId: 'manaCrystal', permyriad: 2000 }], exp: 305, gold: 175,
  },

  // ───────── 잊힌 왕좌 (Lv30)
  {
    id: 'throneKnight', name: '왕좌의 기사', job: 'warrior', archetype: 'wall', level: 35,
    growth: { str: 3, spd: 1 },
    stats: { maxHp: 4350, def: 43, mdef: 29, int: 22 }, guard: { mode: 'always' },
    traits: ['aegis', 'thornward'],
    skills: ['strike', 'bulwark', 'taunt', 'sunder', 'heavyBlow', 'ironSkin'],
    rules: rules(
      row(firstAction, 'bulwark', 1),
      row(and(sp(10), atom({ kind: 'teamAnyHpPct', side: 'ally', cmp: 'lte', value: 60 })), 'taunt'),
      row(and(hpBelow(60), sp(8)), 'ironSkin', 2),
      row(and(sp(6), atom({ kind: 'teamAnyHpPct', side: 'enemy', cmp: 'gte', value: 70 })), 'sunder'),
      row(sp(8), 'heavyBlow'),
      row(always, 'strike'),
    ),
    drops: [{ itemId: 'ironScrap', permyriad: 5500 }, { itemId: 'ogreCore', permyriad: 2500 }], exp: 380, gold: 220,
  },
  {
    id: 'throneShadow', name: '왕좌의 그림자', job: 'rogue', archetype: 'venom', level: 35,
    growth: { dex: 3, spd: 3 }, row: 'back',
    stats: { maxHp: 2030, int: 22 },
    traits: ['venomcraft', 'disruptor'],
    skills: ['strike', 'toxicBlade', 'disrupt', 'venomStrong', 'markPrey', 'smokeBomb'],
    // 교재: 시전을 끊고 독을 겹친다. 암살자와 파괴공작원을 한 몸에
    rules: rules(
      row(and(sp(14), atom({ kind: 'teamCastingCount', side: 'enemy', cmp: 'gte', value: 1 })), 'disrupt'),
      row(and(sp(12), firstAction), 'markPrey', 1),
      row(and(sp(10), atom({ kind: 'teamStatusCount', side: 'enemy', status: 'poison', cmp: 'lte', value: 1 })), 'toxicBlade'),
      row(and(hpBelow(35), sp(10)), 'smokeBomb', 1),
      row(sp(8), 'venomStrong'),
      row(always, 'strike'),
    ),
    drops: [{ itemId: 'venomSac', permyriad: 5500 }, { itemId: 'beastFang', permyriad: 3000 }], exp: 370, gold: 215,
  },
  {
    id: 'forgottenCaptain', name: '잊힌 단장', job: 'warrior', archetype: 'boss', level: 35,
    growth: { str: 3, spd: 2 },
    // **플레이어의 거울.** 8줄(지능 50 이상) — 이 게임에서 가장 긴 수칙을 쓴다.
    // 훅을 셋 겹쳐 들고 나온다: 엄호 경감 · 피의 분노 · 약화된 적 추가타
    stats: { maxHp: 6090, maxSp: 220, def: 41, mdef: 31, int: 52 }, guard: { mode: 'hpAbove', pct: 35 },
    traits: ['aegis', 'bloodRage', 'zeal'],
    skills: ['strike', 'warCry', 'bulwark', 'sunder', 'sweep', 'heavyBlow', 'recklessSwing', 'ironSkin'],
    rules: rules(
      row(firstAction, 'warCry', 1),
      row(and(sp(16), atom({ kind: 'teamAliveCount', side: 'ally', cmp: 'lte', value: 2 })), 'bulwark', 2),
      row(and(hpBelow(40), sp(8)), 'ironSkin', 3),
      row(and(sp(6), atom({ kind: 'teamAnyHpPct', side: 'enemy', cmp: 'gte', value: 75 })), 'sunder'),
      row(and(sp(14), atom({ kind: 'teamAliveCount', side: 'enemy', cmp: 'gte', value: 4 })), 'sweep'),
      row(and(atom({ kind: 'selfHpPct', cmp: 'gte', value: 65 }), sp(10)), 'recklessSwing'),
      row(sp(8), 'heavyBlow'),
      row(always, 'strike'),
    ),
    drops: [{ itemId: 'bossSeal', permyriad: 10000 }], exp: 900, gold: 600,
  },

  // ═════════ 만렙 50 확장 — Lv30~50 지역의 상대 (docs/22 §5) ═════════
  //
  // 지역마다 가르치는 것이 하나다. 사람이거나 기존 원형 아이콘이라 새 그림이 필요 없다.
  // 레벨은 권장 상한 + 3~6 (전직 지역 규칙). Lv30·45 가 넘으면 플레이어처럼 패턴 칸이 하나씩 는다 — 그래서 수칙이 길다.
  // 수치는 **첫 값**이다. balance.test 의 전직 지역 계약에 맞춰 조정한다.

  // ───────── 모래바람 황야 (Lv33~38): 속도 — 둔화·정지로 박자를 뺏는다
  {
    id: 'sandRaider', name: '사막 약탈자', job: 'rogue', archetype: 'rush', level: 40, growth: { dex: 2, spd: 1 },
    stats: { maxHp: 1760, def: 16, int: 22 },
    traits: ['disruptor'],
    skills: ['strike', 'flurry', 'disrupt', 'smokeBomb', 'venomStrong'],
    // 교재: 시전하면 끊긴다. 시전 전에 이 녀석부터
    rules: rules(
      row(and(sp(14), foesCasting), 'disrupt'),
      row(and(hpBelow(40), sp(12)), 'smokeBomb', 1),
      row(sp(8), 'venomStrong'),
      row(sp(10), 'flurry'),
      row(always, 'strike'),
    ),
    drops: [{ itemId: 'sunstone', permyriad: 3500 }, { itemId: 'leather', permyriad: 3000 }], exp: 430, gold: 245,
  },
  {
    id: 'duneStalker', name: '모래 전갈', job: 'rogue', icon: 'spider', archetype: 'venom', level: 41, growth: { dex: 2, str: 1 },
    stats: { maxHp: 2150, def: 34, int: 12 }, guard: { mode: 'never' },
    skills: ['strike', 'venomStrong', 'entangle'],
    // 교재: 둔화를 겹친다. 정화가 없으면 우리 차례가 점점 늦어진다
    rules: rules(row(and(sp(12), foeStatusAtMost('spdDown', 1)), 'entangle'), row(sp(8), 'venomStrong'), row(always, 'strike')),
    drops: [{ itemId: 'sunstone', permyriad: 3000 }, { itemId: 'venomSac', permyriad: 4000 }], exp: 450, gold: 250,
  },
  {
    id: 'sandHarpy', name: '모래바람 하피', job: 'elf', icon: 'harpy', archetype: 'shooter', level: 40, growth: { dex: 2, spd: 2 },
    stats: { maxHp: 1430, def: 12, int: 12 }, row: 'back',
    skills: ['strike', 'windArrow', 'volley', 'pierceShot'],
    rules: rules(row(and(sp(18), foesAlive(4)), 'volley'), row(sp(10), 'windArrow'), row(always, 'strike')),
    drops: [{ itemId: 'feather', permyriad: 5000 }, { itemId: 'sunstone', permyriad: 2500 }], exp: 420, gold: 240,
  },
  {
    id: 'sandSeer', name: '사막 점술사', job: 'mage', icon: 'shaman', archetype: 'caster', level: 42, growth: { int: 2, spd: 1 },
    stats: { maxHp: 1330, def: 8, mdef: 24 }, row: 'back',
    traits: ['foresight'],
    skills: ['bolt', 'stasis', 'hasten', 'sandstorm'],
    // 교재: 제 편은 당기고 우리 편은 늦춘다. 끊지 않으면 박자 싸움에서 진다
    rules: rules(
      row(and(sp(18), firstAction), 'hasten', 1),
      row(and(sp(16), foesCasting), 'stasis'),
      row(sp(18), 'sandstorm'),
      row(always, 'bolt'),
    ),
    drops: [{ itemId: 'sunstone', permyriad: 4000 }, { itemId: 'manaCrystal', permyriad: 3000 }], exp: 470, gold: 270,
  },
  {
    id: 'duneWarlord', name: '황야의 족장', job: 'warrior', archetype: 'boss', level: 44, growth: { str: 2, spd: 1 },
    stats: { maxHp: 4950, def: 40, mdef: 28, int: 22 }, guard: { mode: 'hpAbove', pct: 40 }, hidden: true,
    traits: ['eager', 'bloodRage'],
    skills: ['strike', 'warCry', 'sweep', 'heavyBlow', 'recklessSwing', 'sandstorm'],
    rules: rules(
      row(firstAction, 'warCry', 1),
      row(and(sp(14), foesAlive(4)), 'sweep'),
      row(and(sp(18), foeStatusAtMost('spdDown', 1)), 'sandstorm'),
      row(and(selfHpAbove(60), sp(10)), 'recklessSwing'),
      row(sp(8), 'heavyBlow'),
      row(always, 'strike'),
    ),
    drops: [{ itemId: 'kingSigil', permyriad: 4000 }, { itemId: 'sunstone', permyriad: 10000 }], exp: 1300, gold: 800,
  },

  // ───────── 가라앉은 신전 (Lv37~42): 보호막 · 재생 — 막고 되돌린다
  {
    id: 'templeWarden', name: '신전 수호상', job: 'warrior', icon: 'turtle', archetype: 'wall', level: 45, growth: { str: 2 },
    stats: { maxHp: 4340, def: 50, mdef: 34, spd: 30, int: 12 }, guard: { mode: 'always' },
    traits: ['aegis'],
    skills: ['strike', 'bulwark', 'taunt', 'ironSkin'],
    rules: rules(
      row(firstAction, 'bulwark', 1),
      row(and(sp(10), allyHurt(55)), 'taunt'),
      row(and(hpBelow(50), sp(8)), 'ironSkin', 2),
      row(always, 'strike'),
    ),
    drops: [{ itemId: 'tideScale', permyriad: 4000 }, { itemId: 'ironScrap', permyriad: 4000 }], exp: 560, gold: 300,
  },
  {
    id: 'tidePriest', name: '조수의 사제', job: 'priest', icon: 'shaman', archetype: 'caster', level: 45, growth: { int: 3, luk: 1 },
    stats: { maxHp: 1750, def: 12, mdef: 30 }, row: 'back',
    traits: ['regen', 'highLiturgy'],
    skills: ['strike', 'tidalWard', 'mendChant', 'ward', 'resurrect', 'bolt'],
    // 교재: 막고 되돌린다. 뒤를 치거나 장막 준비를 끊지 않으면 끝나지 않는다
    rules: rules(
      row(allyDead, 'resurrect'),
      row(and(sp(20), atom({ kind: 'teamAnyHpPctBelow', side: 'ally', value: 60 })), 'tidalWard'),
      row(and(sp(12), atom({ kind: 'teamAnyHpPctBelow', side: 'ally', value: 50 })), 'mendChant'),
      row(and(sp(10), firstAction), 'ward', 1),
      row(sp(6), 'bolt'),
      row(always, 'strike'),
    ),
    drops: [{ itemId: 'tideScale', permyriad: 4500 }, { itemId: 'holyWater', permyriad: 4000 }], exp: 580, gold: 310,
  },
  {
    id: 'eelSwarm', name: '물뱀 떼', job: 'rogue', icon: 'swarm', archetype: 'horde', level: 44, growth: { dex: 3, spd: 2 },
    stats: { maxHp: 1330, def: 10, int: 12 },
    skills: ['strike', 'flurry', 'venom'],
    rules: rules(row(sp(10), 'flurry'), row(sp(8), 'venom'), row(always, 'strike')),
    drops: [{ itemId: 'tideScale', permyriad: 3000 }, { itemId: 'venomSac', permyriad: 3000 }], exp: 520, gold: 280,
  },
  {
    id: 'drownedKnight', name: '익사한 기사', job: 'warrior', archetype: 'rush', level: 46, growth: { str: 3, spd: 1 },
    stats: { maxHp: 3220, def: 36, mdef: 20, int: 12 },
    traits: ['secondWind'],
    skills: ['strike', 'sunder', 'heavyBlow', 'sweep'],
    rules: rules(
      row(and(sp(6), foesFresh(70)), 'sunder'),
      row(and(sp(14), foesAlive(4)), 'sweep'),
      row(sp(8), 'heavyBlow'),
      row(always, 'strike'),
    ),
    drops: [{ itemId: 'tideScale', permyriad: 3500 }, { itemId: 'ironScrap', permyriad: 3500 }], exp: 570, gold: 300,
  },
  {
    id: 'templeColossus', name: '신전의 거상', job: 'warrior', icon: 'ogre', archetype: 'boss', level: 48, growth: { str: 3 },
    stats: { maxHp: 7700, def: 52, mdef: 36, spd: 40, int: 22 }, guard: { mode: 'always' }, hidden: true,
    traits: ['aegis', 'regen'],
    skills: ['strike', 'fortress', 'sweep', 'heavyBlow', 'ironSkin'],
    rules: rules(
      row(firstAction, 'fortress', 1),
      row(and(hpBelow(50), sp(8)), 'ironSkin', 2),
      row(and(sp(14), foesAlive(4)), 'sweep'),
      row(sp(8), 'heavyBlow'),
      row(always, 'strike'),
    ),
    drops: [{ itemId: 'kingSigil', permyriad: 5000 }, { itemId: 'tideScale', permyriad: 10000 }], exp: 1700, gold: 1000,
  },

  // ───────── 용병왕의 전장 (Lv41~46): 전원 전직 거울 — 플레이어가 고를 수 있는 2차 직업을 상대가 먼저 쓴다
  {
    id: 'kingsGuard', name: '왕의 친위대', job: 'warrior', archetype: 'wall', level: 49, growth: { str: 3, spd: 1 },
    stats: { maxHp: 2700, def: 46, mdef: 32, int: 22 }, guard: { mode: 'always' },
    traits: ['aegis', 'ironWill'],
    skills: ['strike', 'bulwark', 'taunt', 'fortress', 'heavyBlow', 'ironSkin'],
    rules: rules(
      row(firstAction, 'fortress', 1),
      row(and(sp(10), allyHurt(55)), 'taunt'),
      row(and(sp(16), allyAliveAtMost(3)), 'bulwark', 2),
      row(and(hpBelow(50), sp(8)), 'ironSkin', 2),
      row(sp(8), 'heavyBlow'),
      row(always, 'strike'),
    ),
    drops: [{ itemId: 'warBanner', permyriad: 4000 }, { itemId: 'ironScrap', permyriad: 4000 }], exp: 680, gold: 360,
  },
  {
    id: 'warBerserker', name: '전장 광전사', job: 'warrior', archetype: 'rush', level: 48, growth: { str: 3, spd: 2 },
    stats: { maxHp: 1940, def: 30, int: 12 },
    traits: ['bloodRage'],
    skills: ['strike', 'recklessSwing', 'lastStand', 'bloodlust', 'warCry'],
    // 교재: 만피일 때만 최후의 일격. 플레이어의 피의 분노와 같은 판단이다
    rules: rules(
      row(firstAction, 'warCry', 1),
      row(and(hpBelow(30), sp(12)), 'bloodlust'),
      row(and(selfHpAbove(80), sp(16)), 'lastStand', 1),
      row(and(selfHpAbove(55), sp(10)), 'recklessSwing'),
      row(always, 'strike'),
    ),
    drops: [{ itemId: 'warBanner', permyriad: 3500 }, { itemId: 'beastFang', permyriad: 3500 }], exp: 660, gold: 350,
  },
  {
    id: 'warAssassin', name: '그림자 암살자', job: 'rogue', archetype: 'venom', level: 48, growth: { dex: 3, spd: 2 },
    stats: { maxHp: 1220, def: 14, int: 22 }, row: 'back',
    traits: ['venomcraft', 'disruptor'],
    skills: ['strike', 'plague', 'toxicBlade', 'disrupt', 'markPrey'],
    rules: rules(
      row(and(sp(14), foesCasting), 'disrupt'),
      row(and(sp(24), foeStatusAtMost('poison', 1)), 'plague'),
      row(and(sp(8), firstAction), 'markPrey', 1),
      row(sp(14), 'toxicBlade'),
      row(always, 'strike'),
    ),
    drops: [{ itemId: 'warBanner', permyriad: 3500 }, { itemId: 'venomSac', permyriad: 4000 }], exp: 650, gold: 345,
  },
  {
    id: 'warElementalist', name: '전장 원소술사', job: 'mage', archetype: 'caster', level: 49, growth: { int: 3, spd: 1 },
    stats: { maxHp: 1080, def: 8, mdef: 26 }, row: 'back',
    traits: ['quickCast', 'foresight'],
    skills: ['bolt', 'maelstrom', 'starfall', 'stasis', 'emberfall'],
    // 교재: 유성우를 끊지 못하면 전원이 크게 다친다
    rules: rules(
      row(and(sp(40), foesAlive(4)), 'starfall'),
      row(and(sp(16), foesCasting), 'stasis'),
      row(and(sp(26), foesAlive(3)), 'maelstrom'),
      row(sp(16), 'emberfall'),
      row(always, 'bolt'),
    ),
    drops: [{ itemId: 'warBanner', permyriad: 4000 }, { itemId: 'manaCrystal', permyriad: 4000 }], exp: 690, gold: 365,
  },
  {
    id: 'warBishop', name: '종군 주교', job: 'priest', archetype: 'caster', level: 49, growth: { int: 3, luk: 1 },
    stats: { maxHp: 1220, def: 10, mdef: 30 }, row: 'back',
    traits: ['highLiturgy'],
    skills: ['strike', 'miracle', 'sanctuary', 'benediction', 'mend', 'resurrect', 'ward'],
    rules: rules(
      row(allyDead, 'resurrect'),
      row(and(sp(40), allyAvgBelow(45)), 'miracle', 1),
      row(and(sp(18), allyHurt(30)), 'benediction'),
      row(and(sp(22), allyAvgBelow(65)), 'sanctuary'),
      row(and(sp(10), allyHurt(55)), 'mend'),
      row(and(sp(10), firstAction), 'ward', 1),
      row(always, 'strike'),
    ),
    drops: [{ itemId: 'warBanner', permyriad: 4000 }, { itemId: 'holyWater', permyriad: 4500 }], exp: 690, gold: 365,
  },
  {
    id: 'warRanger', name: '전장 레인저', job: 'elf', archetype: 'shooter', level: 48, growth: { dex: 3, spd: 2 },
    stats: { maxHp: 1170, def: 12, int: 22 }, row: 'back',
    traits: ['sniperEye', 'deadeye'],
    skills: ['strike', 'pinpoint', 'snipe', 'volley', 'pierceShot'],
    rules: rules(
      row(and(sp(22), foeBackRow(2)), 'pinpoint'),
      row(and(sp(18), foesAlive(4)), 'volley'),
      row(sp(14), 'snipe'),
      row(always, 'strike'),
    ),
    drops: [{ itemId: 'warBanner', permyriad: 3500 }, { itemId: 'feather', permyriad: 5000 }], exp: 650, gold: 345,
  },
  {
    id: 'mercenaryKing', name: '용병왕', job: 'warrior', archetype: 'boss', level: 50, growth: { str: 3, spd: 2 },
    // 9줄(지능 50 + 레벨 문턱 둘) — 잊힌 단장보다 한 줄 길다. 훅을 넷 겹쳐 들고 나온다
    stats: { maxHp: 5850, maxSp: 300, def: 48, mdef: 36, int: 52 }, guard: { mode: 'hpAbove', pct: 35 }, hidden: true,
    traits: ['aegis', 'bloodRage', 'zeal', 'eager'],
    skills: ['strike', 'warCry', 'fortress', 'lastStand', 'recklessSwing', 'sunder', 'sweep', 'heavyBlow', 'ironSkin'],
    rules: rules(
      row(firstAction, 'warCry', 1),
      row(and(sp(30), allyAliveAtMost(3)), 'fortress', 1),
      row(and(hpBelow(40), sp(8)), 'ironSkin', 3),
      row(and(sp(6), foesFresh(75)), 'sunder'),
      row(and(sp(14), foesAlive(4)), 'sweep'),
      row(and(selfHpAbove(85), sp(16)), 'lastStand', 1),
      row(and(selfHpAbove(60), sp(10)), 'recklessSwing'),
      row(sp(8), 'heavyBlow'),
      row(always, 'strike'),
    ),
    drops: [{ itemId: 'kingSigil', permyriad: 10000 }], exp: 2400, gold: 1500,
  },

  // ───────── 별이 떨어진 탑 (Lv45~50): 대형 시전 + 보스 — 끊지 못하면 전멸
  {
    id: 'starGolem', name: '별조각 골렘', job: 'warrior', icon: 'turtle', archetype: 'wall', level: 53, growth: { str: 2 },
    stats: { maxHp: 4680, def: 56, mdef: 44, spd: 34, int: 22 }, guard: { mode: 'always' },
    traits: ['aegis', 'thornward'],
    skills: ['strike', 'bulwark', 'taunt', 'ironSkin', 'sunder'],
    rules: rules(
      row(firstAction, 'bulwark', 1),
      row(and(sp(10), allyHurt(55)), 'taunt'),
      row(and(hpBelow(50), sp(8)), 'ironSkin', 2),
      row(and(sp(6), foesFresh(70)), 'sunder'),
      row(always, 'strike'),
    ),
    drops: [{ itemId: 'starShard', permyriad: 4000 }, { itemId: 'ogreCore', permyriad: 3000 }], exp: 860, gold: 450,
  },
  {
    id: 'voidHarpy', name: '공허의 하피', job: 'elf', icon: 'harpy', archetype: 'shooter', level: 52, growth: { dex: 3, spd: 2 },
    stats: { maxHp: 1800, def: 14, int: 22 }, row: 'back',
    traits: ['deadeye'],
    skills: ['strike', 'pinpoint', 'windArrow', 'snipe'],
    rules: rules(row(and(sp(22), foeBackRow(2)), 'pinpoint'), row(sp(14), 'snipe'), row(sp(10), 'windArrow'), row(always, 'strike')),
    drops: [{ itemId: 'starShard', permyriad: 3500 }, { itemId: 'feather', permyriad: 5000 }], exp: 820, gold: 430,
  },
  {
    id: 'starChanter', name: '별의 창자', job: 'mage', icon: 'shaman', archetype: 'caster', level: 54, growth: { int: 3 },
    stats: { maxHp: 1800, def: 12, mdef: 34, spd: 40 }, row: 'back',
    traits: ['highLiturgy'],
    skills: ['bolt', 'starfall', 'hex', 'meditate'],
    // 교재: 유성우의 준비는 이 게임에서 가장 길다. 끊는 사람이 없으면 이 지역은 넘지 못한다
    rules: rules(
      row(sp(40), 'starfall'),
      row(and(sp(20), foeStatusAtMost('atkDown', 0)), 'hex'),
      row(sp(6), 'bolt'),
      row(always, 'meditate'),
    ),
    drops: [{ itemId: 'starShard', permyriad: 4500 }, { itemId: 'manaCrystal', permyriad: 4000 }], exp: 900, gold: 470,
  },
  {
    id: 'riftBeast', name: '균열의 짐승', job: 'rogue', icon: 'beast', archetype: 'rush', level: 52, growth: { str: 2, dex: 2, spd: 2 },
    stats: { maxHp: 2520, def: 26, int: 22 },
    traits: ['eager'],
    skills: ['strike', 'flurry', 'bloodlust', 'sweep'],
    rules: rules(
      row(and(sp(14), foesAlive(4)), 'sweep'),
      row(and(hpBelow(50), sp(12)), 'bloodlust'),
      row(sp(10), 'flurry'),
      row(always, 'strike'),
    ),
    drops: [{ itemId: 'starShard', permyriad: 3500 }, { itemId: 'beastFang', permyriad: 5000 }], exp: 840, gold: 440,
  },
  {
    id: 'towerMaster', name: '탑의 주인', job: 'warrior', icon: 'ogre', archetype: 'boss', level: 55, growth: { str: 3, spd: 1 },
    stats: { maxHp: 9600, maxSp: 400, def: 54, mdef: 42, int: 52 }, guard: { mode: 'hpAbove', pct: 30 }, hidden: true,
    traits: ['aegis', 'regen', 'ironWill'],
    skills: ['strike', 'warCry', 'fortress', 'starfall', 'sweep', 'sunder', 'heavyBlow', 'ironSkin'],
    rules: rules(
      row(firstAction, 'warCry', 1),
      row(and(sp(30), hpBelow(60)), 'fortress', 1),
      row(and(sp(40), foesAlive(3)), 'starfall'),
      row(and(hpBelow(35), sp(8)), 'ironSkin', 3),
      row(and(sp(6), foesFresh(75)), 'sunder'),
      row(and(sp(14), foesAlive(4)), 'sweep'),
      row(sp(8), 'heavyBlow'),
      row(always, 'strike'),
    ),
    drops: [{ itemId: 'kingSigil', permyriad: 10000 }], exp: 3000, gold: 2000,
  },
]

export const MONSTERS: Record<string, MonsterDef> = Object.fromEntries(list.map((m) => [m.id, m]))
export const MONSTER_LIST: MonsterDef[] = list
