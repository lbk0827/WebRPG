// 성장 규칙 (M2-1). 전투 엔진이 직접 참조하는 것(패턴 수)과 게임 층이 쓰는 것(경험치·레벨·스탯 성장)을 한곳에.
// 전부 정수. 부동소수점 없음 — 경험치 표는 미리 계산해 박아둔다.
import type { StatKey, Stats } from './types'

// ───────────────────────────── 패턴 수 (INT)

/** 기본 패턴 수 */
export const RULE_ROWS_BASE = 4
/** INT 가 이 값에 도달할 때마다 패턴 +1 */
export const RULE_ROWS_INT_STEPS = [10, 20, 35, 50, 70]

/** 이 스탯으로 쓸 수 있는 최대 패턴 수. 엔진은 이 수를 넘는 패턴을 평가하지 않는다. */
export function maxRuleRows(stats: Stats): number {
  return RULE_ROWS_BASE + RULE_ROWS_INT_STEPS.filter((t) => stats.int >= t).length
}

/** 다음 패턴을 얻기까지 필요한 INT (없으면 null) */
export function nextRuleRowInt(stats: Stats): number | null {
  return RULE_ROWS_INT_STEPS.find((t) => stats.int < t) ?? null
}

// ───────────────────────────── 레벨 · 경험치

export const MAX_LEVEL = 30
export const STAT_POINTS_PER_LEVEL = 5
export const SKILL_POINTS_PER_LEVEL = 2
/** 분배 스탯 개별 상한 (M2) */
export const STAT_CAP = 150

/** EXP_TABLE[L] = 레벨 L 에서 L+1 로 가는 데 필요한 경험치. floor(40 × L^1.6) 을 미리 계산. 단일 연속 곡선 — 급증 구간 없음 */
export const EXP_TABLE: readonly number[] = [
  0, 40, 121, 231, 367, 525, 703, 899, 1114, 1345, 1592, 1854, 2131, 2423, 2728, 3046, 3377, 3722, 4078, 4446, 4827, 5219,
  5622, 6037, 6462, 6898, 7345, 7802, 8270, 8747,
]

/** 다음 레벨까지 필요한 경험치. 만렙이면 null */
export function expToNext(level: number): number | null {
  return level >= MAX_LEVEL ? null : EXP_TABLE[level]
}

export interface ExpResult {
  level: number
  exp: number
  levelsGained: number
}

/** 경험치를 더하고 레벨업을 처리한다. 만렙에서는 경험치를 버린다 */
export function grantExp(level: number, exp: number, gained: number): ExpResult {
  let l = level
  let e = exp + Math.max(0, gained)
  let g = 0
  while (l < MAX_LEVEL && e >= EXP_TABLE[l]) {
    e -= EXP_TABLE[l]
    l++
    g++
  }
  if (l >= MAX_LEVEL) e = 0
  return { level: l, exp: e, levelsGained: g }
}

// ───────────────────────────── 스탯 성장

export type Alloc = Record<StatKey, number>
export const EMPTY_ALLOC: Alloc = { str: 0, int: 0, dex: 0, spd: 0, luk: 0 }

/** floor(v × (100 + pct × (level−1)) / 100) */
export function scaleByLevel(v: number, level: number, pctPerLevel: number): number {
  return Math.floor((v * (100 + pctPerLevel * (level - 1))) / 100)
}

/**
 * 성장이 반영된 스탯.
 * - HP: 레벨당 +5%   (STR 은 HP 에 영향하지 않는다 — docs/10)
 * - SP: 레벨당 +3% + INT 분배 1당 +2  (INT → SP 상한 연동)
 * - STR/INT/DEX/SPD/LUK: 기본 + 분배 (상한 150)
 * - DEF/MDEF: 직업 기본값 (장비는 M2-4 에서 bonus 로)
 */
export function growthStats(base: Stats, level: number, alloc: Alloc): Stats {
  const cap = (v: number) => Math.min(STAT_CAP, v)
  return {
    maxHp: scaleByLevel(base.maxHp, level, 5),
    maxSp: scaleByLevel(base.maxSp, level, 3) + alloc.int * 2,
    str: cap(base.str + alloc.str),
    int: cap(base.int + alloc.int),
    dex: cap(base.dex + alloc.dex),
    spd: cap(base.spd + alloc.spd),
    luk: cap(base.luk + alloc.luk),
    def: base.def,
    mdef: base.mdef,
  }
}
