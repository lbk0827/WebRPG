// 전투 엔진 공개 타입. docs/05_M1_전투엔진_명세.md 의 스키마를 그대로 옮긴 것.
// 이 파일에 로직을 두지 않는다.

export type Side = 'ally' | 'enemy'
export type Row = 'front' | 'back'
export type Cmp = 'gte' | 'lte' | 'eq'
export type SkillId = string

export type StatusId =
  | 'poison'
  | 'atkUp'
  | 'atkDown'
  | 'defUp'
  | 'defDown'
  | 'spdUp'
  | 'spdDown'
  | 'silence'
  | 'barrier'

// ───────────────────────────── 조건 (§5)

export type ConditionAtom =
  | { kind: 'selfHpPct'; cmp: Cmp; value: number }
  | { kind: 'selfHpAbs'; cmp: Cmp; value: number }
  | { kind: 'selfSpPct'; cmp: Cmp; value: number }
  | { kind: 'selfSpAbs'; cmp: Cmp; value: number }
  | { kind: 'selfRow'; row: Row }
  | { kind: 'selfHasStatus'; status: StatusId }
  | { kind: 'selfActionCount'; cmp: Cmp; value: number }
  | { kind: 'teamAliveCount'; side: Side; cmp: Cmp; value: number }
  | { kind: 'teamDeadCount'; side: Side; cmp: Cmp; value: number }
  | { kind: 'teamAnyHpPctBelow'; side: Side; value: number }
  | { kind: 'teamAvgHpPct'; side: Side; cmp: Cmp; value: number }
  | { kind: 'teamCastingCount'; side: Side; cmp: Cmp; value: number }
  | { kind: 'teamStatusCount'; side: Side; status: StatusId; cmp: Cmp; value: number }
  | { kind: 'teamRowCount'; side: Side; row: Row; cmp: Cmp; value: number }
  | { kind: 'teamSpPctBelow'; side: Side; value: number }
  | { kind: 'chance'; percent: number }

export type Condition =
  | { op: 'always' }
  | { op: 'atom'; atom: ConditionAtom }
  | { op: 'and'; nodes: Condition[] }
  | { op: 'or'; nodes: Condition[] }
  | { op: 'not'; node: Condition }

export interface RuleRow {
  condition: Condition
  skillId: SkillId
  /** 전투당 발동 횟수 상한 ("N회만") */
  maxUses?: number
}

export interface RuleSet {
  rows: RuleRow[]
}

// ───────────────────────────── 단원 (§4.2, §8.1)

export type GuardPolicy =
  | { mode: 'always' }
  | { mode: 'never' }
  | { mode: 'hpAbove'; pct: number }
  | { mode: 'chance'; pct: number }

export interface Stats {
  maxHp: number
  maxSp: number
  str: number
  int: number
  spd: number
  /** 물리 고정 방어 */
  def: number
  /** 마법 고정 방어 */
  mdef: number
}

export interface CharSetup {
  id: string
  name: string
  row: Row
  guard: GuardPolicy
  stats: Stats
  skills: SkillId[]
  rules: RuleSet
}

export interface TeamSetup {
  name: string
  members: CharSetup[]
}

// ───────────────────────────── 스킬 (§6)

export interface TargetSpec {
  side: 'ally' | 'enemy' | 'any' | 'self'
  scope: 'single' | 'multi' | 'all'
  hits: number
}

export type TargetPriority =
  | { mode: 'prefer'; by: 'lowestHpPct' | 'highestHpPct' | 'backRow' }
  | { mode: 'require'; by: 'dead' | 'casting' | 'debuffed' }
  | { mode: 'require'; by: 'hasStatus'; status: StatusId }

export type Effect =
  | { kind: 'damage'; school: 'phys' | 'magic'; power: number; pierce?: boolean }
  | { kind: 'heal'; power: number }
  | { kind: 'restoreSp'; power: number }
  | { kind: 'applyStatus'; status: StatusId; duration: number; magnitude?: number }
  | { kind: 'removeStatus'; category: 'debuff' | 'buff' }
  | { kind: 'modifyGauge'; delta: number }
  | { kind: 'revive'; hpPct: number }
  | { kind: 'shield'; hits: number }

export interface Skill {
  id: SkillId
  /** 표시용. 고유명사 미확정이므로 역할 원형 이름을 임시로 쓴다 */
  label: string
  spCost: number
  target: TargetSpec
  priority?: TargetPriority
  /** 선딜. 게이지 단위 (1000 = 한 사이클) */
  charge: number
  /** 후딜. 게이지 단위 */
  stiff: number
  ignoreCover?: boolean
  isSupport?: boolean
  effects: Effect[]
}

export type SkillBook = Record<SkillId, Skill>

// ───────────────────────────── 입출력 (§3)

export interface BattleConfig {
  maxActions: number
  extendActions: number
  maxExtends: number
  statusReportInterval: number
}

export interface BattleInput {
  seed: number
  teams: [TeamSetup, TeamSetup]
  config: BattleConfig
  skills: SkillBook
}

export type Outcome = 'team0' | 'team1' | 'draw'

export interface BattleResult {
  outcome: Outcome
  actionCount: number
  events: BattleEvent[]
}

// ───────────────────────────── 이벤트 (§7)

export interface CharRef {
  team: 0 | 1
  index: number
}

export interface CharSnapshot {
  id: string
  name: string
  hp: number
  maxHp: number
  sp: number
  maxSp: number
  alive: boolean
  row: Row
  gauge: number
  casting?: SkillId
  statuses: { id: StatusId; remaining: number }[]
}

export type TeamSnapshot = CharSnapshot[]

export type SkillFailReason = 'noSp' | 'noRequiredTarget' | 'silenced'

export type BattleEvent =
  | { t: 'battleStart'; teams: [TeamSnapshot, TeamSnapshot] }
  | { t: 'turnBegin'; actor: CharRef }
  | { t: 'ruleFired'; actor: CharRef; ruleIndex: number; skillId: SkillId }
  | { t: 'ruleExhausted'; actor: CharRef }
  | { t: 'skillFailed'; actor: CharRef; ruleIndex: number; skillId: SkillId; reason: SkillFailReason }
  | { t: 'castStart'; actor: CharRef; skillId: SkillId }
  | { t: 'castResolve'; actor: CharRef; skillId: SkillId }
  | { t: 'castInterrupted'; target: CharRef; skillId: SkillId }
  | { t: 'cover'; defender: CharRef; protectedChar: CharRef }
  | { t: 'damage'; source: CharRef; target: CharRef; amount: number; school: 'phys' | 'magic'; nullified?: boolean }
  | { t: 'heal'; source: CharRef; target: CharRef; amount: number }
  | { t: 'spChange'; target: CharRef; delta: number }
  | { t: 'statusApply'; target: CharRef; status: StatusId; duration: number }
  | { t: 'statusTick'; target: CharRef; status: StatusId; amount: number }
  | { t: 'statusExpire'; target: CharRef; status: StatusId }
  | { t: 'gaugeShift'; target: CharRef; delta: number }
  | { t: 'death'; target: CharRef }
  | { t: 'revive'; target: CharRef; hp: number }
  | { t: 'statusReport'; actionCount: number; teams: [TeamSnapshot, TeamSnapshot] }
  | { t: 'battleEnd'; outcome: Outcome; actionCount: number }
