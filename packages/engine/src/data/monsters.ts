// 몬스터 (M2-1). 몬스터도 수칙으로 움직인다 — 별도 AI 없음. 지역이 깊어질수록 수칙이 정교해진다 (docs/07 §3.9).
// M2-1 은 사람 상대(탈영병 · 도적단 · 경쟁 용병단)로 시작해 직업 아이콘을 재사용한다. 짐승·괴물은 M2-5.
import type { CharSetup, Condition, GuardPolicy, Row, RuleRow, RuleSet, StatKey, Stats } from '../types'
import { PRESETS } from './presets'
import { EMPTY_ALLOC, growthStats } from '../progression'

export interface MonsterDef {
  id: string
  name: string
  /** 아이콘·기본 스탯·기본 스킬을 빌려올 직업 */
  job: string
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
}

const always: Condition = { op: 'always' }
const atom = (a: Extract<Condition, { op: 'atom' }>['atom']): Condition => ({ op: 'atom', atom: a })
const row = (condition: Condition, skillId: string, maxUses?: number): RuleRow =>
  maxUses === undefined ? { condition, skillId } : { condition, skillId, maxUses }
const rules = (...rows: RuleRow[]): RuleSet => ({ rows })
const strikeOnly = rules(row(always, 'strike'))

/** 몬스터 정의 → 전투용 CharSetup. idx 는 팀 내 순번 (아이콘 규약 `${job}#${idx}`) */
export function monsterSetup(def: MonsterDef, idx: number): CharSetup {
  const p = PRESETS[def.job]
  if (!p) throw new Error(`unknown job: ${def.job}`)
  const alloc = { ...EMPTY_ALLOC }
  for (const k of Object.keys(def.growth ?? {}) as StatKey[]) alloc[k] = (def.growth?.[k] ?? 0) * (def.level - 1)
  const stats: Stats = { ...growthStats(p.stats, def.level, alloc), ...def.stats }
  return {
    id: `${p.id}#${idx}`,
    name: def.name,
    row: def.row ?? p.row,
    guard: structuredClone(def.guard ?? p.guard),
    stats,
    skills: [...(def.skills ?? p.skills)],
    rules: structuredClone(def.rules),
    monster: { exp: def.exp, gold: def.gold },
  }
}

const list: MonsterDef[] = [
  // ── 마을 외곽: 탈영병. 훈련 안 된 전사. 수칙 1줄
  { id: 'deserter', name: '탈영병', job: 'warrior', level: 1, stats: { maxHp: 320, str: 32, def: 10 }, guard: { mode: 'never' }, rules: strikeOnly, exp: 14, gold: 8 },
  { id: 'deserterArcher', name: '탈영 궁수', job: 'elf', level: 2, stats: { maxHp: 240 }, rules: rules(row(atom({ kind: 'selfSpAbs', cmp: 'gte', value: 12 }), 'pierceShot'), row(always, 'strike')), exp: 18, gold: 10 },

  // ── 가도: 도적단. 독과 저격. 수칙 2줄
  { id: 'banditKnife', name: '도적단 단검수', job: 'rogue', level: 4, growth: { dex: 2, spd: 1 }, rules: rules(row(atom({ kind: 'selfSpAbs', cmp: 'gte', value: 8 }), 'venom'), row(always, 'strike')), exp: 30, gold: 18 },
  { id: 'banditArcher', name: '도적단 궁수', job: 'elf', level: 4, growth: { dex: 2 }, rules: rules(row(atom({ kind: 'selfSpAbs', cmp: 'gte', value: 12 }), 'pierceShot'), row(always, 'strike')), exp: 30, gold: 16 },
  {
    id: 'banditBoss', name: '도적 두목', job: 'warrior', level: 6, growth: { str: 3, spd: 1 }, guard: { mode: 'always' }, hidden: true,
    rules: rules(row(atom({ kind: 'selfActionCount', cmp: 'eq', value: 1 }), 'warCry', 1), row(atom({ kind: 'selfSpAbs', cmp: 'gte', value: 8 }), 'heavyBlow'), row(always, 'strike')),
    exp: 90, gold: 60,
  },

  // ── 폐허 요새: 경쟁 용병단. 우리와 같은 직업, 제대로 된 수칙 (프리셋 기본 수칙)
  { id: 'rivalWarrior', name: '경쟁 용병 전사', job: 'warrior', level: 8, growth: { str: 3, spd: 1, luk: 1 }, rules: structuredClone(PRESETS.warrior.rules), exp: 55, gold: 30 },
  { id: 'rivalRogue', name: '경쟁 용병 도적', job: 'rogue', level: 8, growth: { dex: 3, spd: 2 }, rules: structuredClone(PRESETS.rogue.rules), exp: 55, gold: 30 },
  { id: 'rivalMage', name: '경쟁 용병 마법사', job: 'mage', level: 8, growth: { int: 4, dex: 1 }, rules: structuredClone(PRESETS.mage.rules), exp: 55, gold: 30 },
  { id: 'rivalPriest', name: '경쟁 용병 프리스트', job: 'priest', level: 8, growth: { int: 3, luk: 2 }, rules: structuredClone(PRESETS.priest.rules), exp: 55, gold: 30 },
  { id: 'rivalElf', name: '경쟁 용병 엘프', job: 'elf', level: 8, growth: { dex: 4, spd: 1 }, rules: structuredClone(PRESETS.elf.rules), exp: 55, gold: 30 },
]

export const MONSTERS: Record<string, MonsterDef> = Object.fromEntries(list.map((m) => [m.id, m]))
