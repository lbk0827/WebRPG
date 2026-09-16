// 엘리트 조우 (docs/30). 일반 전투맵에서 가끔 고정 조합이 통째로 나온다.
// 지역 난이도 곡선은 balance.test.ts 가 엘리트를 포함한 채로 지킨다. 여기서는 엘리트 자체를 고정한다.
import { describe, expect, it } from 'vitest'
import { DEFAULT_CONFIG, MONSTERS, REGIONS, REGION_BY_ID, SKILLS, monsterSetup, rollEncounter, simulate } from '../src'
import type { RuleSet, TeamSetup } from '../src'
import { leveledParty } from './balance.test'

const at = (a: unknown) => ({ op: 'atom' as const, atom: a as never })
const always = { op: 'always' as const }
const r = (condition: unknown, skillId: string) => ({ condition: condition as never, skillId })
const sp = (v: number) => at({ kind: 'selfSpAbs', cmp: 'gte', value: v })

const eliteTeam = (foes: string[]): TeamSetup => ({ name: 'e', members: foes.map((id, i) => monsterSetup(MONSTERS[id], i)) })

function winPct(level: number, foes: string[], fix: Record<string, RuleSet> = {}, n = 40): number {
  let w = 0
  for (let s = 1; s <= n; s++) {
    const party = leveledParty(level)
    for (const m of party.members) {
      const job = m.id.split('#')[0]
      if (fix[job]) m.rules = structuredClone(fix[job])
    }
    if (simulate({ seed: s, teams: [party, eliteTeam(foes)], config: DEFAULT_CONFIG, skills: SKILLS }).outcome === 'team0') w++
  }
  return Math.round((w / n) * 100)
}

const elites = REGIONS.flatMap((region) => (region.elites ?? []).map((elite) => ({ region, elite })))
const eliteOf = (regionId: string) => REGION_BY_ID[regionId].elites![0]

describe('엘리트 조우', () => {
  it('정의가 온전하다 — 몬스터가 있고, 확률 합이 100 을 넘지 않는다', () => {
    expect(elites.length).toBeGreaterThan(0)
    for (const { region, elite } of elites) {
      for (const id of elite.foes) expect(MONSTERS[id], `${elite.id} → ${id}`).toBeDefined()
      expect(elite.pct).toBeGreaterThan(0)
    }
    for (const region of REGIONS) {
      const sum = (region.elites ?? []).reduce((s, e) => s + e.pct, 0)
      expect(sum, region.id).toBeLessThanOrEqual(100)
    }
  })

  it('정해진 확률 근처로 나오고, 나오면 조합이 그대로다', () => {
    for (const { region, elite } of elites) {
      let hits = 0
      for (let s = 1; s <= 1000; s++) {
        const team = rollEncounter(region, s)
        if (team.elite !== elite.name) continue
        hits++
        expect(team.members.map((m) => m.name.replace(/ \d+$/, ''))).toEqual(elite.foes.map((id) => MONSTERS[id].name))
      }
      expect(Math.abs(hits / 10 - elite.pct), `${elite.id} ${hits / 10}%`).toBeLessThanOrEqual(4)
    }
  })

  it('엘리트가 아닌 판은 엘리트가 없던 때와 같은 적이 나온다 (기존 기록 · 시드 재생 유지)', () => {
    for (const { region } of elites) {
      const plain = { ...region, elites: undefined }
      for (let s = 1; s <= 200; s++) {
        const team = rollEncounter(region, s)
        if (team.elite) continue
        expect(team).toEqual(rollEncounter(plain, s))
      }
    }
  })

  it('권장 상한 레벨의 기준 편성이면 해볼 만하다 (≥40%)', () => {
    for (const { region, elite } of elites) {
      expect(winPct(region.recommended[1], elite.foes), `${elite.name} Lv${region.recommended[1]}`).toBeGreaterThanOrEqual(40)
    }
  })

  it('방해꾼 조: 큰 기술을 방해꾼이 쓰러진 뒤로 미루면 크게 이긴다', () => {
    const e = eliteOf('goblinCamp')
    const mage = { rows: [r(at({ kind: 'teamAliveCount', side: 'enemy', cmp: 'lte', value: 2 }), 'inferno'), r(sp(6), 'bolt'), r(always, 'meditate')] }
    const base = winPct(14, e.foes)
    const fixed = winPct(14, e.foes, { mage })
    console.log(`방해꾼 조 Lv14 — 기본 ${base}% → 대화염 미루기 ${fixed}%`)
    expect(fixed - base).toBeGreaterThanOrEqual(30)
  })

  it('방벽 조: 도적이 독에 SP 를 쓰지 않고 침묵에 아껴 두면 낫다', () => {
    const e = eliteOf('fort')
    const rogue = { rows: [r(at({ kind: 'teamCastingCount', side: 'enemy', cmp: 'gte', value: 1 }), 'hush'), r(always, 'strike')] }
    const base = winPct(10, e.foes)
    const fixed = winPct(10, e.foes, { rogue })
    console.log(`방벽 조 Lv10 — 기본 ${base}% → 침묵 아끼기 ${fixed}%`)
    expect(fixed - base).toBeGreaterThanOrEqual(5)
  })
})
