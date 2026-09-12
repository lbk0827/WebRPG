// 전투 엔진 공개 타입. docs/05_M1_전투엔진_명세.md 의 스키마를 그대로 옮긴 것.
// 이 파일에 로직을 두지 않는다.

export type Side = 'ally' | 'enemy'
export type Row = 'front' | 'back'
export type Cmp = 'gte' | 'lte' | 'eq'
export type SkillId = string
export type WeaponType = 'sword' | 'dagger' | 'staff' | 'relic' | 'bow' | 'none'
export type StatKey = 'str' | 'int' | 'dex' | 'spd' | 'luk'

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
  | { kind: 'selfStat'; stat: CondStat; cmp: Cmp; value: number }
  // ── 제로식 판정 목록에서 채택 (docs/11 §5.6). 위의 *Below 둘은 아래 *Pct 의 lte 특수형 — 호환을 위해 남긴다
  /** HP 비율이 N% 이상/이하인 대상이 존재 */
  | { kind: 'teamAnyHpPct'; side: Side; cmp: Cmp; value: number }
  /** HP 절대값이 N 이상/이하인 대상이 존재 */
  | { kind: 'teamAnyHpAbs'; side: Side; cmp: Cmp; value: number }
  /** SP 비율이 N% 이상/이하인 대상이 존재 */
  | { kind: 'teamAnySpPct'; side: Side; cmp: Cmp; value: number }
  /** 평균 SP 비율 */
  | { kind: 'teamAvgSpPct'; side: Side; cmp: Cmp; value: number }
  /** 자신의 N번째 행동마다 (N, 2N, 3N …) — 주기 버프용 */
  | { kind: 'selfActionEvery'; value: number }

/** 조건에서 비교할 수 있는 능력치 — 분배 스탯 5 + 방어 2 */
export type CondStat = StatKey | 'def' | 'mdef'

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
  /** 꺼 둔 패턴 — 평가하지 않지만 칸은 차지한다 (지우지 않고 실험하기 위한 것, ADR-004 §5) */
  disabled?: boolean
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
  /** 손재주 — 도적·궁수 계열 물리 스킬의 위력 스탯, 시전 시간 단축 */
  dex: number
  spd: number
  /** 운 — 상태이상 저항 (전투 밖에서는 드롭·제작 확률, M2) */
  luk: number
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
  /** 장비·특성이 합산한 가산치 (M2-4 에서 장비가 채운다). atk: [물리, 마법] / def: [물리%, 물리 고정, 마법%, 마법 고정] */
  bonus?: { atk?: [number, number]; def?: [number, number, number, number] }
  /** 보유 특성 id (data/traits.ts) */
  traits?: string[]
  /** 장착 무기 타입. 스킬 requires.weaponType 검사용. 생략 = none */
  weapon?: WeaponType
  /** 몬스터 전용 훅 (M2-1 의뢰 보상) */
  monster?: { exp: number; gold: number; drops?: { itemId: string; permyriad: number }[] }
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
  | {
      kind: 'damage'
      school: 'phys' | 'magic'
      power: number
      pierce?: boolean
      /** 물리 위력 스탯. 기본 str */
      scaleBy?: 'str' | 'dex'
      /** 연타 점감: 2타부터 타수마다 위력 −N%p (하한 10%) */
      falloff?: number
      /** 열 조건부 위력: 조건이 맞으면 power 대신 이 위력 */
      rowBonus?: { selfRow?: Row; targetRow?: Row; power: number }
    }
  | { kind: 'moveRow'; who: 'self' | 'target'; to: Row | 'swap' }
  | { kind: 'damageSp'; power: number }
  | { kind: 'drain'; resource: 'hp' | 'sp'; pct: number }
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
  /** 재사용 대기: 사용 후 자신의 행동 N회 동안 사용 불가 */
  cooldown?: number
  /** 전투당 사용 횟수 상한 */
  perBattle?: number
  /** 사용 조건 */
  requires?: { weaponType?: WeaponType[] }
  /** 사용 시 최대 HP 의 N% 를 지불 (1 은 남긴다) */
  costHpPct?: number
  effects: Effect[]
}

// ───────────────────────────── 특성 (M2-0)

export type TraitEffect =
  | { kind: 'castTimePct'; pct: number }
  | { kind: 'coverDamagePct'; pct: number }
  | { kind: 'damageVsRowPct'; row: Row; pct: number }
  | { kind: 'startGauge'; amount: number }
  | { kind: 'ruleRows'; add: number }
  | { kind: 'resistPct'; pct: number }
  /** 내가 건 상태이상의 세기 (M2-5b 암살자). 걸 때 한 번 곱한다 */
  | { kind: 'statusPowerPct'; pct: number }
  /** 디버프에 걸린 적에게 주는 피해 (M2-5b 심문관) */
  | { kind: 'damageVsDebuffedPct'; pct: number }
  /** 내가 깎는 행동 게이지의 세기 (M2-5b 파괴공작원). 끊기 전용 */
  | { kind: 'gaugeDamagePct'; pct: number }
  | { kind: 'trigger'; on: 'turnStart' | 'damaged' | 'lowHp'; hpPct?: number; perBattle?: number; effect: Effect }

export interface TraitDef {
  id: string
  label: string
  effects: TraitEffect[]
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

export type SkillFailReason = 'noSp' | 'noRequiredTarget' | 'silenced' | 'cooldown' | 'noWeapon' | 'notLearned'

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
  | { t: 'statusResisted'; target: CharRef; status: StatusId }
  | { t: 'statusTick'; target: CharRef; status: StatusId; amount: number }
  | { t: 'statusExpire'; target: CharRef; status: StatusId }
  | { t: 'gaugeShift'; target: CharRef; delta: number }
  | { t: 'rowChange'; target: CharRef; row: Row }
  | { t: 'traitTrigger'; target: CharRef; traitId: string }
  | { t: 'death'; target: CharRef }
  | { t: 'revive'; target: CharRef; hp: number }
  | { t: 'statusReport'; actionCount: number; teams: [TeamSnapshot, TeamSnapshot] }
  | { t: 'battleEnd'; outcome: Outcome; actionCount: number }
