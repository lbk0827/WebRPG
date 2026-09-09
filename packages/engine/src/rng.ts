// 시드 기반 PRNG (mulberry32). 엔진 내 모든 난수는 반드시 이것을 거친다.
// 32비트 정수 연산만 사용하므로 플랫폼 간 결과가 동일하다.

export interface Rng {
  /** 0 이상 2^32 미만의 정수 */
  next(): number
  /** 0 이상 maxExclusive 미만의 정수 */
  int(maxExclusive: number): number
  /** 0..99 */
  pct(): number
  /** 제자리 셔플 (Fisher-Yates) */
  shuffle<T>(arr: T[]): T[]
}

export function createRng(seed: number): Rng {
  let a = seed >>> 0

  const next = (): number => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return (t ^ (t >>> 14)) >>> 0
  }

  const int = (maxExclusive: number): number => {
    if (maxExclusive <= 1) return 0
    return next() % maxExclusive
  }

  const pct = (): number => int(100)

  const shuffle = <T>(arr: T[]): T[] => {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = int(i + 1)
      const tmp = arr[i]
      arr[i] = arr[j]
      arr[j] = tmp
    }
    return arr
  }

  return { next, int, pct, shuffle }
}
