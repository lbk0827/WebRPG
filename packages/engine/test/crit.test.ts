// 더블 크리티컬 (2026-09-14 단장 지시, docs/18 §18). 운 25 를 넘은 1 당 1%, 최대 30%, 피해 2배.
import { describe, expect, it } from 'vitest'
import { CRIT_MAX_PCT, DEFAULT_CONFIG, PRESETS, SKILLS, critPct, derivedStats, simulate } from '../src'
import type { BattleEvent, TeamSetup } from '../src'

type DamageEvent = Extract<BattleEvent, { t: 'damage' }>

const team = (luk: number, name: string): TeamSetup => ({
  name,
  members: [0, 1, 2].map((i) => {
    const p = structuredClone(PRESETS.warrior)
    return { ...p, id: `warrior#${i}`, stats: { ...p.stats, luk } }
  }),
})

const run = (seed: number, lukA: number, lukB: number) =>
  simulate({ seed, teams: [team(lukA, 'A'), team(lukB, 'B')], config: DEFAULT_CONFIG, skills: SKILLS }).events

const crits = (events: BattleEvent[]): DamageEvent[] => events.filter((e): e is DamageEvent => e.t === 'damage' && !!e.crit)

describe('더블 크리티컬', () => {
  it('운 25 까지는 없고, 넘은 1 당 1%, 상한 30%', () => {
    expect(critPct(0)).toBe(0)
    expect(critPct(25)).toBe(0)
    expect(critPct(26)).toBe(1)
    expect(critPct(40)).toBe(15)
    expect(critPct(150)).toBe(CRIT_MAX_PCT)
    expect(derivedStats(PRESETS.priest.stats).critPct).toBe(0)
  })

  it('직업이 갖고 태어나는 운으로는 터지지 않는다 — 운을 안 넣은 전투에 운이 섞이지 않는다', () => {
    for (let s = 1; s <= 20; s++) expect(crits(run(s, 25, 25))).toEqual([])
  })

  it('크리티컬이 한 번도 안 터지면 전투는 운이 없던 때와 똑같다 (따로 둔 난수 흐름)', () => {
    // 운 10 과 25 는 둘 다 문턱 아래라 크리티컬이 없다 — 저항 계산만 다르므로 디버프가 없는 전사끼리는 같은 전투여야 한다
    for (let s = 1; s <= 10; s++) expect(run(s, 10, 10)).toEqual(run(s, 25, 25))
  })

  it('운을 넣으면 터지고, 넣은 쪽만 터진다 · 시드가 같으면 같다', () => {
    let n = 0
    for (let s = 1; s <= 20; s++) {
      const c = crits(run(s, 55, 25))
      n += c.length
      expect(c.every((e) => e.source.team === 0)).toBe(true)
    }
    expect(n).toBeGreaterThan(0)
    expect(run(7, 55, 55)).toEqual(run(7, 55, 55))
  })
})
