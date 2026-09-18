// 전투 런타임 상태. 외부에 노출되지 않는 내부 구조.
import type {
  BattleConfig,
  Row,
  TraitEffect,
  BattleEvent,
  CharRef,
  CharSetup,
  CharSnapshot,
  SkillBook,
  SkillId,
  StatusId,
  TeamSnapshot,
} from './types'
import type { Rng } from './rng'
import { clamp, isqrt, pctOf } from './fixed'
import { STATUS_DEFS } from './data/statuses'
import { TRAITS } from './data/traits'

export interface StatusInstance {
  id: StatusId
  /** 보유자 자신의 차례 기준 남은 횟수 */
  remaining: number
  magnitude: number
}

export interface PendingCast {
  skillId: SkillId
  /** 예약 시점에 확정된 대상과 대상별 타수. multi 는 대상당 1타이므로 hits 를 보존해야 한다. */
  targets: { ref: CharRef; hits: number }[]
}

export interface CharState {
  ref: CharRef
  setup: CharSetup
  hp: number
  sp: number
  alive: boolean
  /** 현재 열. 전투 중 moveRow 로 바뀔 수 있다 (초기값 = setup.row) */
  row: Row
  gauge: number
  actionCount: number
  pending?: PendingCast
  statuses: StatusInstance[]
  ruleUses: number[]
  /** 스킬별 사용 횟수 (perBattle) */
  skillUses: Record<string, number>
  /** 스킬별 재사용 가능 시점 (자신의 actionCount 기준) */
  cooldownUntil: Record<string, number>
  /** 트리거 특성별 발동 횟수 (perBattle). key = traitId:index */
  traitUses: Record<string, number>
  /** 이번 전투에서 받은 게이지 지연 누적 (딜밀기 상한용) */
  delayTaken: number
}

/** 한 전투에서 한 단원이 받을 수 있는 게이지 지연 총량 — 제로식 "딜밀기" 붕괴 사례 대응 */
export const DELAY_TAKEN_CAP = 1500

export interface BattleState {
  rng: Rng
  /**
   * 더블 크리티컬 전용 난수. 본 rng 와 따로 둔다 — 크리티컬 굴림이 타깃 선택·확률 조건의 순서를 밀지 않게.
   * 크리티컬이 한 번도 안 터진 전투는 크리티컬이 없던 때와 똑같이 흘러간다.
   */
  critRng: Rng
  teams: [CharState[], CharState[]]
  skills: SkillBook
  config: BattleConfig
  events: BattleEvent[]
  actionCount: number
  actionLimit: number
  extendsUsed: number
}

// ───────────────────────────── 게이지 충전 상수 (§10 미결정 — 훈련장으로 튜닝)

/** 충전 속도 = isqrt(SPD*100) + CHARGE_BASE  ( = sqrt(SPD)*10 + BASE ) */
export const CHARGE_BASE = 20

// 버프 상한 (§6.4)
const ATK_MOD_MIN = -75
const ATK_MOD_MAX = 300
const DEF_MOD_MIN = -75
const DEF_MOD_MAX = 90
const SPD_MOD_MIN = -75
const SPD_MOD_MAX = 300

export function createCharState(setup: CharSetup, ref: CharRef): CharState {
  const c: CharState = {
    ref,
    setup,
    hp: setup.stats.maxHp,
    sp: setup.stats.maxSp,
    alive: true,
    row: setup.row,
    gauge: 0,
    actionCount: 0,
    statuses: [],
    ruleUses: setup.rules.rows.map(() => 0),
    skillUses: {},
    cooldownUntil: {},
    traitUses: {},
    delayTaken: 0,
  }
  c.gauge = Math.min(900, sumTrait(c, 'startGauge'))
  return c
}

// ───────────────────────────── 특성 (M2-0)

export function traitEffects(c: CharState): TraitEffect[] {
  const out: TraitEffect[] = []
  for (const id of c.setup.traits ?? []) {
    const t = TRAITS[id]
    if (t) out.push(...t.effects)
  }
  return out
}

function sumTrait(
  c: CharState,
  kind:
    | 'castTimePct'
    | 'coverDamagePct'
    | 'startGauge'
    | 'ruleRows'
    | 'resistPct'
    | 'statusPowerPct'
    | 'damageVsDebuffedPct'
    | 'gaugeDamagePct'
    | 'recoilPowerPct',
): number {
  let n = 0
  for (const e of traitEffects(c)) {
    if (e.kind !== kind) continue
    n += e.kind === 'startGauge' ? e.amount : e.kind === 'ruleRows' ? e.add : e.pct
  }
  return n
}

export const castTimePct = (c: CharState): number => sumTrait(c, 'castTimePct')
export const coverDamagePct = (c: CharState): number => sumTrait(c, 'coverDamagePct')
export const traitRuleRows = (c: CharState): number => sumTrait(c, 'ruleRows')
/** 수칙 훅 (M2-5b). 전부 "특정 조건을 쓸 때만" 값이 나오는 것들이다 */
export const statusPowerPct = (c: CharState): number => sumTrait(c, 'statusPowerPct')
export const damageVsDebuffedPct = (c: CharState): number => sumTrait(c, 'damageVsDebuffedPct')
export const gaugeDamagePct = (c: CharState): number => sumTrait(c, 'gaugeDamagePct')
/** 자기 HP 를 태우는 기술의 피해 보정 % (광전사) */
export const recoilPowerPct = (c: CharState): number => sumTrait(c, 'recoilPowerPct')
export function damageVsRowPct(c: CharState, row: Row): number {
  let n = 0
  for (const e of traitEffects(c)) if (e.kind === 'damageVsRowPct' && e.row === row) n += e.pct
  return n
}

export function getChar(st: BattleState, ref: CharRef): CharState {
  return st.teams[ref.team][ref.index]
}

export function teamOf(st: BattleState, c: CharState): CharState[] {
  return st.teams[c.ref.team]
}

export function enemiesOf(st: BattleState, c: CharState): CharState[] {
  return st.teams[c.ref.team === 0 ? 1 : 0]
}

export function hasStatus(c: CharState, id: StatusId): boolean {
  return c.statuses.some((s) => s.id === id)
}

export function findStatus(c: CharState, id: StatusId): StatusInstance | undefined {
  return c.statuses.find((s) => s.id === id)
}

export function isCasting(c: CharState): boolean {
  return c.alive && c.pending !== undefined
}

export function hasDebuff(c: CharState): boolean {
  return c.statuses.some((s) => STATUS_DEFS[s.id].category === 'debuff')
}

function sumMagnitude(c: CharState, up: StatusId, down: StatusId): number {
  let total = 0
  for (const s of c.statuses) {
    if (s.id === up) total += s.magnitude
    else if (s.id === down) total -= s.magnitude
  }
  return total
}

/** 공격력 보정 % (버프 상한 적용) */
export function atkModPct(c: CharState): number {
  return clamp(sumMagnitude(c, 'atkUp', 'atkDown'), ATK_MOD_MIN, ATK_MOD_MAX)
}

/** 방어 비율 보정 % (버프 상한 적용). 양수면 피해 감소 */
export function defModPct(c: CharState): number {
  return clamp(sumMagnitude(c, 'defUp', 'defDown'), DEF_MOD_MIN, DEF_MOD_MAX)
}

export function effectiveSpd(c: CharState): number {
  const mod = clamp(sumMagnitude(c, 'spdUp', 'spdDown'), SPD_MOD_MIN, SPD_MOD_MAX)
  return Math.max(1, pctOf(c.setup.stats.spd, 100 + mod))
}

/** 상태이상 저항 %. (대상 LUK − 시전자 LUK) / 4, 0~30. 디버프에만 적용. */
export function resistPct(target: CharState, source: CharState): number {
  const fromLuk = clamp(Math.floor((target.setup.stats.luk - source.setup.stats.luk) / 4), 0, 30)
  return clamp(fromLuk + sumTrait(target, 'resistPct'), 0, 50)
}

// ───────────────────────────── 더블 크리티컬 (2026-09-14 단장 지시 — 제로식 "Luk 능력치에 따라 크리티컬")

/**
 * 이 운까지는 크리티컬이 없다 — 직업이 갖고 태어나는 운(10~25)으로는 터지지 않는다.
 * 모두에게 붙이면 모든 전투에 운이 섞여 수칙의 값이 묽어진다 (2026-09-14 실측: 운/5 를 모두에게 줬더니
 * "잘 짠 수칙 > 기본 수칙" 과 훈련 과제 정답이 깨졌다, docs/18 §18). **포인트·장비로 올린 운**만 크리티컬을 산다
 */
export const CRIT_LUK_FREE = 25
/**
 * 넘친 운 N 당 크리티컬 확률 1%. 3·2 는 너무 약해 운 투자가 여전히 손해였고, 1 에서 비로소
 * "20% 섞으면 후반에 이득, 40% 는 과하다"가 됐다 (docs/18 §18 표)
 */
export const CRIT_LUK_PER_PCT = 1
/** 크리티컬 확률 상한 % */
export const CRIT_MAX_PCT = 30
/** 크리티컬 피해 배율 % — "더블" */
export const CRIT_MULT_PCT = 200

/** 피해 한 타가 더블 크리티컬이 될 확률 %. 운 25 를 넘은 1 당 1%, 0~30. 몬스터도 같은 식이다 */
export function critPct(luk: number): number {
  return Math.min(CRIT_MAX_PCT, Math.floor(Math.max(0, luk - CRIT_LUK_FREE) / CRIT_LUK_PER_PCT))
}

/** DEX 에 의한 시전(선딜) 단축 %. dex/4, 최대 25 — dex 100 에서 상한. */
export function chargeReductionPct(c: CharState): number {
  return Math.min(25, Math.floor(c.setup.stats.dex / 4))
}

/** 스킬의 실제 선딜. DEX 와 특성(castTimePct)으로 단축된다. 하한 30% */
export function effectiveCharge(charge: number, c: CharState): number {
  return pctOf(charge, clamp(100 - chargeReductionPct(c) + castTimePct(c), 30, 200))
}

/** 한 틱당 게이지 충전량. 제곱근이므로 속도 투자에 수확 체감. */
export function chargeRate(c: CharState): number {
  return isqrt(effectiveSpd(c) * 100) + CHARGE_BASE
}

export function hpPct(c: CharState): number {
  return Math.floor((c.hp * 100) / c.setup.stats.maxHp)
}

export function spPct(c: CharState): number {
  if (c.setup.stats.maxSp <= 0) return 0
  return Math.floor((c.sp * 100) / c.setup.stats.maxSp)
}

export function snapshotChar(c: CharState): CharSnapshot {
  return {
    id: c.setup.id,
    name: c.setup.name,
    ...(c.setup.level !== undefined ? { level: c.setup.level } : {}),
    hp: c.hp,
    maxHp: c.setup.stats.maxHp,
    sp: c.sp,
    maxSp: c.setup.stats.maxSp,
    alive: c.alive,
    row: c.row,
    gauge: c.gauge,
    casting: c.pending?.skillId,
    statuses: c.statuses.map((s) => ({ id: s.id, remaining: s.remaining })),
  }
}

export function snapshotTeams(st: BattleState): [TeamSnapshot, TeamSnapshot] {
  return [st.teams[0].map(snapshotChar), st.teams[1].map(snapshotChar)]
}

export function emit(st: BattleState, ev: BattleEvent): void {
  st.events.push(ev)
}
