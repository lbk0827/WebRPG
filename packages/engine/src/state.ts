// 전투 런타임 상태. 외부에 노출되지 않는 내부 구조.
import type {
  BattleConfig,
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
  gauge: number
  actionCount: number
  pending?: PendingCast
  statuses: StatusInstance[]
  ruleUses: number[]
}

export interface BattleState {
  rng: Rng
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
  return {
    ref,
    setup,
    hp: setup.stats.maxHp,
    sp: setup.stats.maxSp,
    alive: true,
    gauge: 0,
    actionCount: 0,
    statuses: [],
    ruleUses: setup.rules.rows.map(() => 0),
  }
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
    hp: c.hp,
    maxHp: c.setup.stats.maxHp,
    sp: c.sp,
    maxSp: c.setup.stats.maxSp,
    alive: c.alive,
    row: c.setup.row,
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
