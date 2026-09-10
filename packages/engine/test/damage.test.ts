import { describe, expect, it } from 'vitest'
import { calcDamage } from '../src/damage'
import { createCharState } from '../src/state'
import { isqrt } from '../src/fixed'
import type { CharSetup } from '../src'

function ch(stats: Partial<CharSetup['stats']>): ReturnType<typeof createCharState> {
  const setup: CharSetup = {
    id: 'x',
    name: 'x',
    row: 'front',
    guard: { mode: 'never' },
    stats: { maxHp: 100, maxSp: 0, str: 0, int: 0, dex: 30, spd: 10, luk: 10, def: 0, mdef: 0, ...stats },
    skills: [],
    rules: { rows: [] },
  }
  return createCharState(setup, { team: 0, index: 0 })
}

describe('isqrt', () => {
  it('완전제곱수와 그 사이 값을 바르게 내림한다', () => {
    expect(isqrt(0)).toBe(0)
    expect(isqrt(1)).toBe(1)
    expect(isqrt(15)).toBe(3)
    expect(isqrt(16)).toBe(4)
    expect(isqrt(4900)).toBe(70)
    expect(isqrt(4999)).toBe(70)
  })
})

describe('데미지 공식 (§4.3)', () => {
  it('sqrt 기반 — STR 4배가 데미지 2배', () => {
    const t = ch({})
    const d1 = calcDamage('phys', 100, false, ch({ str: 25 }), t)
    const d2 = calcDamage('phys', 100, false, ch({ str: 100 }), t)
    expect(d2).toBe(d1 * 2)
  })

  it('최소 보장: 방어가 아무리 높아도 위력의 1/10 은 들어간다', () => {
    const atk = ch({ str: 100 }) // base 100
    const wall = ch({ def: 9999 })
    expect(calcDamage('phys', 100, false, atk, wall)).toBe(10)
  })

  it('pierce 는 방어를 무시한다', () => {
    const atk = ch({ str: 100 })
    const wall = ch({ def: 9999 })
    expect(calcDamage('phys', 100, true, atk, wall)).toBe(100)
  })

  it('고정 방어는 그대로 차감된다', () => {
    const atk = ch({ str: 100 })
    expect(calcDamage('phys', 100, false, atk, ch({ def: 30 }))).toBe(70)
  })
})
