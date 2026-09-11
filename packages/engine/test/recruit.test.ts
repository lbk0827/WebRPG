// M2-3 모집소: 고용가 · 편차 · 재현성
import { describe, expect, it } from 'vitest'
import { HIRE, MEMBER_MAX, PRESETS, applyQuirk, createRng, hireLevel, hirePrice, rollQuirk } from '../src'

describe('모집소', () => {
  it('직업 5종 전부 고용가가 있고 양수', () => {
    for (const job of Object.keys(PRESETS)) expect(HIRE[job]?.price, job).toBeGreaterThan(0)
    expect(MEMBER_MAX).toBe(8)
  })
  it('고용 레벨은 편성 평균 −2, 최소 1. 가격은 레벨에 따라 오른다', () => {
    expect(hireLevel(1)).toBe(1)
    expect(hireLevel(2)).toBe(1)
    expect(hireLevel(7)).toBe(5)
    expect(hirePrice('warrior', 1)).toBe(120)
    expect(hirePrice('warrior', 5)).toBeGreaterThan(hirePrice('warrior', 1))
  })
  it('편차는 ±5% 안이고 같은 시드면 같다', () => {
    for (let seed = 1; seed <= 50; seed++) {
      const a = rollQuirk('mage', createRng(seed))
      const b = rollQuirk('mage', createRng(seed))
      expect(a).toEqual(b)
      const base = PRESETS.mage.stats
      for (const k of Object.keys(a) as (keyof typeof a)[]) {
        expect(Math.abs(a[k] ?? 0), `${k}`).toBeLessThanOrEqual(Math.floor((base[k] * 5) / 100))
      }
      const s = applyQuirk(base, a)
      for (const k of Object.keys(base) as (keyof typeof base)[]) expect(s[k]).toBeGreaterThanOrEqual(1)
    }
  })
  it('편차가 실제로 생긴다 (시드 50개 중 편차 없는 경우가 소수)', () => {
    let empty = 0
    for (let seed = 1; seed <= 50; seed++) if (Object.keys(rollQuirk('warrior', createRng(seed))).length === 0) empty++
    expect(empty).toBeLessThan(5)
  })
})
