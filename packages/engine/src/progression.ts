// 성장 규칙 중 전투 엔진이 직접 참조하는 것. 지금은 "INT → 최대 패턴 수" 하나.
import type { Stats } from './types'

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
