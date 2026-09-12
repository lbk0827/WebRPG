// 몬스터 (M2-1 사람 / M2-5a 짐승·괴물). 몬스터도 수칙으로 움직인다 — 별도 AI 없음 (docs/07 §3.9).
// 지역이 깊어질수록 수칙이 정교해진다 → 몬스터 수칙 자체가 플레이어에게 교재가 된다.
// 원형 8종: 잡몹 · 돌격 · 방벽 · 사격 · 주술(시전) · 독 · 다수 · 보스.
import type { CharSetup, Condition, GuardPolicy, Row, RuleRow, RuleSet, StatKey, Stats } from '../types'
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
    row: def.row ?? p.row,
    guard: structuredClone(def.guard ?? p.guard),
    stats,
    skills: [...(def.skills ?? p.skills)],
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
]

export const MONSTERS: Record<string, MonsterDef> = Object.fromEntries(list.map((m) => [m.id, m]))
export const MONSTER_LIST: MonsterDef[] = list
