// 정수 산술 헬퍼. 엔진 내부에서 부동소수점을 쓰지 않기 위한 도구.

/** 게이지 만충 값. 이 값에 도달하면 행동한다. */
export const GAUGE_MAX = 1000

/** 정수 제곱근 (floor). Newton 법. */
export function isqrt(n: number): number {
  if (n <= 0) return 0
  if (n < 4) return 1
  let x = n
  let y = (x + 1) >> 1
  while (y < x) {
    x = y
    y = (x + Math.floor(n / x)) >> 1
  }
  return x
}

/** floor(value * pct / 100) */
export function pctOf(value: number, pct: number): number {
  return Math.floor((value * pct) / 100)
}

export function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v
}

/** 0으로 나누기 방지된 백분율 (floor) */
export function ratioPct(part: number, whole: number): number {
  if (whole <= 0) return 0
  return Math.floor((part * 100) / whole)
}
