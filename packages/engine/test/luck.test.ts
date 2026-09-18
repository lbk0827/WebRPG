// LUK 상태이상 저항 (스탯 5종 확정, 2026-09-10). 시드 기반이므로 결정론은 유지된다.
import { describe, expect, it } from 'vitest'
import { DEFAULT_CONFIG, SKILLS, simulate } from '../src'
import type { CharSetup, Condition } from '../src'

const always: Condition = { op: 'always' }
const mk = (id: string, luk: number, rules: CharSetup['rules']): CharSetup => ({
  id, name: id, row: 'front', guard: { mode: 'never' },
  stats: { maxHp: 99999, maxSp: 999, str: 30, int: 30, dex: 30, spd: 40, luk, def: 0, mdef: 0 },
  skills: ['strike', 'venom'], rules,
})
const venomer = (luk: number) => mk('v', luk, { rows: [{ condition: always, skillId: 'venom' }] })
const dummy = (luk: number) => mk('d', luk, { rows: [{ condition: always, skillId: 'strike' }] })

function resistCount(attackerLuk: number, targetLuk: number, seeds = 20): number {
  let n = 0
  for (let s = 1; s <= seeds; s++) {
    const r = simulate({ seed: s, teams: [{ name: 'A', members: [venomer(attackerLuk)] }, { name: 'B', members: [dummy(targetLuk)] }], config: { ...DEFAULT_CONFIG, maxActions: 40 }, skills: SKILLS })
    n += r.events.filter((e) => e.t === 'statusResisted').length
  }
  return n
}

describe('LUK 상태이상 저항', () => {
  it('LUK 이 같거나 낮으면 절대 저항하지 않는다', () => {
    expect(resistCount(20, 20)).toBe(0)
    expect(resistCount(50, 10)).toBe(0)
  })
  it('LUK 이 높으면 일부 디버프를 저항한다 (상한 30%)', () => {
    const n = resistCount(10, 150)
    expect(n).toBeGreaterThan(0)
  })
  it('같은 시드면 저항 결과도 동일하다', () => {
    const run = () => JSON.stringify(simulate({ seed: 7, teams: [{ name: 'A', members: [venomer(10)] }, { name: 'B', members: [dummy(150)] }], config: DEFAULT_CONFIG, skills: SKILLS }).events)
    expect(run()).toBe(run())
  })
})
