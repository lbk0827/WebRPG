// 성장 규칙 (M2-1). 전투 엔진이 직접 참조하는 것(패턴 수)과 게임 층이 쓰는 것(경험치·레벨·스탯 성장)을 한곳에.
// 전부 정수. 부동소수점 없음 — 경험치 표는 미리 계산해 박아둔다.
import type { StatKey, Stats } from './types'

// ───────────────────────────── 패턴 수 (INT)

/** 기본 패턴 수 */
export const RULE_ROWS_BASE = 4
/** INT 가 이 값에 도달할 때마다 패턴 +1 */
export const RULE_ROWS_INT_STEPS = [10, 20, 35, 50, 70]

/**
 * 레벨이 이 값에 도달할 때마다 패턴 +1 (만렙 50 확장, docs/22 §3).
 * HOF 는 Lv30 에 칸을 하나 준다 — 후반에도 수칙 설계가 값을 갖게 하는 이정표다. 20레벨이 늘었으니 45 에도 둔다
 */
export const RULE_ROWS_LEVEL_STEPS = [30, 45]

/** 이 스탯(과 레벨)으로 쓸 수 있는 최대 패턴 수. 엔진은 이 수를 넘는 패턴을 평가하지 않는다. level 생략 = 레벨 문턱 없음 */
export function maxRuleRows(stats: Stats, level = 0): number {
  return RULE_ROWS_BASE + RULE_ROWS_INT_STEPS.filter((t) => stats.int >= t).length + RULE_ROWS_LEVEL_STEPS.filter((l) => level >= l).length
}

/** 다음 패턴을 얻기까지 필요한 INT (없으면 null) */
export function nextRuleRowInt(stats: Stats): number | null {
  return RULE_ROWS_INT_STEPS.find((t) => stats.int < t) ?? null
}

// ───────────────────────────── 레벨 · 경험치

/** 만렙. 2026-09-14 단장 결정으로 30 → 50 (HOF 와 같다). 30~50 구간 콘텐츠는 docs/22 */
export const MAX_LEVEL = 50
export const STAT_POINTS_PER_LEVEL = 5
/** M2-2: 1 — 직업 목록 총액 9~13 이라 Lv 10~14 에 다 배운다. 2차 목록이 열리면 모자라기 시작한다 */
export const SKILL_POINTS_PER_LEVEL = 1
/**
 * 분배 스탯 개별 상한. 150 → **250** (만렙 50 과 함께, HOF 와 같다).
 * Lv50 이면 분배 포인트가 245 라 150 에서는 주 스탯이 Lv20 대에 막혀 남는 포인트가 쓸모없어졌다
 */
export const STAT_CAP = 250
/** Lv30 까지의 상한 — 150 을 그대로 둔다 */
export const STAT_CAP_BASE = 150

/**
 * 레벨 L 의 분배 스탯 상한. Lv30 까지 150, 그 뒤 레벨당 +5 (분배 포인트와 같은 속도), Lv50 에 250.
 * 한 번에 250 으로 풀면 Lv20 대 +5 레벨 편성이 상한에서 풀려나 **레벨이 설계를 앞선다** —
 * 무너진 성채 수칙폭/레벨폭이 1.00 → 0.72 로 떨어졌다 (docs/22 §3). 30 이후에만 푸는 이유다
 */
export function statCapFor(level: number): number {
  return Math.min(STAT_CAP, STAT_CAP_BASE + STAT_POINTS_PER_LEVEL * Math.max(0, level - 30))
}

/**
 * EXP_TABLE[L] = 레벨 L 에서 L+1 로 가는 데 필요한 경험치. floor(40 × L^1.6) 을 미리 계산. 단일 연속 곡선 — 급증 구간 없음.
 * 30 → 50 은 약 29만으로 1 → 30(약 10만)의 2.8 배다 — 후반 지역의 보상이 그만큼 커야 한다 (docs/22)
 */
export const EXP_TABLE: readonly number[] = [
  0, 40, 121, 231, 367, 525, 703, 899, 1114, 1345, 1592, 1854, 2131, 2423, 2728, 3046, 3377, 3722, 4078, 4446, 4827, 5219,
  5622, 6037, 6462, 6898, 7345, 7802, 8270, 8747,
  9235, 9732, 10240, 10756, 11283, 11818, 12363, 12917, 13480, 14052, 14633, 15223, 15821, 16428, 17044, 17668, 18300, 18941, 19590, 20247,
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
  const cap = (v: number) => Math.min(statCapFor(level), v)
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
