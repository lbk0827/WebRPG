// M2-4a 장비: 데이터 정합성 · 합산 · 전투 반영
import { describe, expect, it } from 'vitest'
import { DEFAULT_CONFIG, ITEMS, ITEM_LIST, JOB_WEAPONS, PRESETS, SKILLS, TRAITS, canEquip, sellPrice, simulate, summarizeGear } from '../src'
import type { CharSetup } from '../src'

describe('장비 데이터', () => {
  it('id 유일, 가격 양수, 특성 존재, 무기 타입은 어떤 직업에든 속한다', () => {
    const ids = new Set(ITEM_LIST.map((i) => i.id))
    expect(ids.size).toBe(ITEM_LIST.length)
    const allTypes = new Set(Object.values(JOB_WEAPONS).flat())
    for (const i of ITEM_LIST) {
      expect(i.price, i.id).toBeGreaterThan(0)
      if (i.trait) expect(TRAITS[i.trait], `${i.id} → ${i.trait}`).toBeDefined()
      if (i.slot === 'weapon') {
        expect(i.weaponType, i.id).toBeDefined()
        expect(allTypes.has(i.weaponType!), `${i.id} ${i.weaponType}`).toBe(true)
      } else expect(i.weaponType).toBeUndefined()
      expect(sellPrice(i)).toBe(Math.floor(i.price * 0.2))
    }
  })
  it('직업마다 3등급 무기가 하나씩은 있다', () => {
    for (const job of Object.keys(PRESETS)) {
      for (const tier of [1, 2, 3]) {
        expect(ITEM_LIST.some((i) => i.slot === 'weapon' && i.tier === tier && canEquip(job, i)), `${job} tier ${tier}`).toBe(true)
      }
    }
    expect(canEquip('mage', ITEMS.swordSteel)).toBe(false)
    expect(canEquip('mage', ITEMS.armorPlate)).toBe(true)
  })
  it('합산: 공격·방어·스탯·특성·무기 타입', () => {
    const g = summarizeGear([ITEMS.swordSteel, ITEMS.armorPlate, ITEMS.amuletIron])
    expect(g.atk).toEqual([18, 0])
    expect(g.def).toEqual([10, 18, 0, 5])
    expect(g.stats.luk).toBe(10)
    expect(g.traits.sort()).toEqual(['bulwark', 'ironWill'])
    expect(g.weapon).toBe('sword')
    expect(summarizeGear([undefined, undefined, undefined]).weapon).toBe('none')
  })
})

describe('장비가 전투에 반영된다', () => {
  const foe: CharSetup = { ...structuredClone(PRESETS.warrior), id: 'w#1', rules: { rows: [{ condition: { op: 'always' }, skillId: 'strike' }] } }
  const dmgOf = (bonus?: CharSetup['bonus']) => {
    const me: CharSetup = { ...structuredClone(PRESETS.warrior), id: 'w#0', rules: { rows: [{ condition: { op: 'always' }, skillId: 'strike' }] }, bonus }
    const ev = simulate({ seed: 1, teams: [{ name: 'a', members: [me] }, { name: 'b', members: [foe] }], config: DEFAULT_CONFIG, skills: SKILLS }).events
    const first = ev.find((e) => e.t === 'damage' && e.source.team === 0)
    return first && first.t === 'damage' ? first.amount : 0
  }
  it('무기 공격 가산만큼 첫 타가 세진다', () => {
    const g = summarizeGear([ITEMS.swordLong])
    expect(dmgOf({ atk: g.atk })).toBeGreaterThan(dmgOf())
  })
})
