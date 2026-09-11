// M2-4b 공방: 재료 · 드롭 · 강화 · 제작
import { describe, expect, it } from 'vitest'
import {
  ITEMS, MATERIALS, MONSTERS, RECIPES, REFINE_MAX, REGIONS, TRAITS, battleRewards, canCraft, createRng, refineCost, refineRate, refinedNumbers,
  rollCraftTrait, rollEncounter, summarizeGear, tryRefine,
} from '../src'

describe('재료와 드롭', () => {
  it('모든 몬스터 드롭 재료가 존재하고 만분율은 0~10000', () => {
    for (const m of Object.values(MONSTERS)) {
      for (const d of m.drops ?? []) {
        expect(MATERIALS[d.itemId], `${m.id} → ${d.itemId}`).toBeDefined()
        expect(d.permyriad).toBeGreaterThan(0)
        expect(d.permyriad).toBeLessThanOrEqual(10000)
      }
    }
  })
  it('승리하면 드롭이 나오고(시드 결정론), 패배면 없다. 몬스터당 최대 1개', () => {
    const enemy = rollEncounter(REGIONS[0], 3)
    const win = { outcome: 'team0' as const, actionCount: 1, events: [] }
    const a = battleRewards(win, enemy, 7)
    const b = battleRewards(win, enemy, 7)
    expect(a.drops).toEqual(b.drops)
    expect(a.drops.length).toBeLessThanOrEqual(enemy.members.length)
    expect(battleRewards({ ...win, outcome: 'team1' }, enemy, 7).drops).toEqual([])
    let total = 0
    for (let s = 1; s <= 40; s++) total += battleRewards(win, enemy, s).drops.length
    expect(total).toBeGreaterThan(5)
  })
})

describe('강화', () => {
  it('성공률 표는 단계별로 내려가고 최대 단계에선 0', () => {
    for (let l = 1; l < REFINE_MAX; l++) expect(refineRate(l)).toBeLessThanOrEqual(refineRate(l - 1))
    expect(refineRate(REFINE_MAX)).toBe(0)
    expect(refineRate(0)).toBe(100)
  })
  it('+0→+1 은 항상 성공, 시드가 같으면 결과가 같다', () => {
    for (let s = 1; s <= 20; s++) expect(tryRefine(0, createRng(s))).toBe(true)
    expect(tryRefine(3, createRng(11))).toBe(tryRefine(3, createRng(11)))
  })
  it('강화는 공격·방어 고정치를 +10%/단계 올리고 % 와 스탯은 그대로', () => {
    const r3 = refinedNumbers(ITEMS.armorChain, 3)
    expect(r3.def).toEqual([5, 13, 0, 3])
    const w = summarizeGear([{ uid: 'a', itemId: 'swordSteel', refine: 5 }])
    expect(w.atk[0]).toBe(27)
    const cost = refineCost(ITEMS.swordSteel, 2)
    expect(cost.gold).toBe(Math.floor(220 * 0.15) * 3)
    expect(cost.qty).toBe(3)
  })
})

describe('제작', () => {
  it('레시피의 아이템·재료가 존재한다', () => {
    for (const r of RECIPES) {
      expect(ITEMS[r.itemId], r.id).toBeDefined()
      for (const m of r.materials) expect(MATERIALS[m.id], `${r.id} → ${m.id}`).toBeDefined()
    }
  })
  it('canCraft 는 금과 재료를 모두 본다', () => {
    const r = RECIPES[0]
    const mats = Object.fromEntries(r.materials.map((m) => [m.id, m.qty]))
    expect(canCraft(r, mats, r.gold)).toBe(true)
    expect(canCraft(r, mats, r.gold - 1)).toBe(false)
    expect(canCraft(r, { ...mats, [r.materials[0].id]: r.materials[0].qty - 1 }, r.gold)).toBe(false)
  })
  it('보너스 특성은 약 30%, 존재하는 특성, 시드 결정론', () => {
    let hits = 0
    for (let s = 1; s <= 200; s++) {
      const t = rollCraftTrait('swordSteel', createRng(s))
      if (t) { hits++; expect(TRAITS[t]).toBeDefined() }
      expect(rollCraftTrait('swordSteel', createRng(s))).toBe(t)
    }
    expect(hits).toBeGreaterThan(40)
    expect(hits).toBeLessThan(80)
    // 제작 특성이 붙은 인스턴스는 합산에 들어간다
    expect(summarizeGear([{ uid: 'a', itemId: 'swordSteel', refine: 0, trait: 'eager' }]).traits).toContain('eager')
  })
})
