// 주인공 전용 무기의 무기 스킬 (docs/31). 무기가 쥐여 주는 스킬이라 배우는 것이 아니라 **드는** 것이다.
//
// 여기서 지키는 것은 docs/31 §7 의 기준이다:
//   · 무기 스킬을 **수칙에 넣으면** 안 넣은 것보다 낫다 (넣을 이유가 있다)
//   · 무기 스킬을 **아무 데나** 넣으면 낫지 않다 (자동으로 붙는 힘 도약이 아니다)
import { describe, expect, it } from 'vitest'
import {
  DEFAULT_CONFIG, EMPTY_ALLOC, HERO_JOB, ITEMS, JOB_ADVANCE, MONSTERS, PRESETS, REGIONS, SKILLS,
  STAT_POINTS_PER_LEVEL, growthStats, monsterSetup, rollEncounter, simulate, summarizeGear,
} from '../src'
import type { CharSetup, RuleSet, Stats, TeamSetup } from '../src'

const at = (a: unknown) => ({ op: 'atom' as const, atom: a as never })
const and = (...nodes: unknown[]) => ({ op: 'and' as const, nodes: nodes as never })
const always = { op: 'always' as const }
const r = (condition: unknown, skillId: string, maxUses?: number) =>
  ({ condition: condition as never, skillId, ...(maxUses ? { maxUses } : {}) })
const sp = (v: number) => at({ kind: 'selfSpAbs', cmp: 'gte', value: v })
const rs = (...rows: ReturnType<typeof r>[]): RuleSet => ({ rows })

const WEAPON_SKILLS = ['headKnock', 'rally', 'wedge', 'plunge', 'breakingEdge', 'darkRelease'] as const
const HERO_WEAPONS = ['woodenClub', 'egoSword', 'egoBlade', 'braveSword', 'darkBlade'] as const

/** 주인공 한 명 — 무기를 든 채로. job2 가 있으면 전직 사슬의 보정·특성이 붙는다 */
function hero(level: number, itemId: string, rules: RuleSet, job2?: string): CharSetup {
  const p = PRESETS[HERO_JOB]
  const g = summarizeGear([{ uid: 'w', itemId, refine: 0 }])
  const alloc = { ...EMPTY_ALLOC, str: (level - 1) * STAT_POINTS_PER_LEVEL }
  let stats: Stats = growthStats(p.stats, level, alloc)
  for (const a of job2 ? [JOB_ADVANCE[job2]] : []) {
    for (const [k, v] of Object.entries(a.bonus)) stats[k as keyof Stats] = (stats[k as keyof Stats] ?? 0) + (v ?? 0)
  }
  stats = { ...stats, ...Object.fromEntries(Object.entries(g.stats).map(([k, v]) => [k, (stats[k as keyof Stats] ?? 0) + (v ?? 0)])) }
  return {
    id: `${HERO_JOB}#0`,
    name: '모험가',
    level,
    row: 'front',
    guard: structuredClone(p.guard),
    stats,
    skills: [...new Set([...p.skills, 'warCry', ...g.skills])],
    rules: structuredClone(rules),
    bonus: { atk: g.atk, def: g.def },
    traits: [...g.traits, ...(job2 ? JOB_ADVANCE[job2].traits : [])],
    weapon: g.weapon,
    monster: undefined,
  }
}

/** 주인공 + 동료 넷 (프리셋 기본 수칙, 장비 없음) */
function party(level: number, h: CharSetup): TeamSetup {
  const mates = ['warrior', 'priest', 'elf', 'mage'].map((j, i) => {
    const p = structuredClone(PRESETS[j])
    const key: keyof Stats = j === 'mage' || j === 'priest' ? 'int' : j === 'elf' ? 'dex' : 'str'
    return { ...p, id: `${j}#${i + 1}`, stats: growthStats(p.stats, level, { ...EMPTY_ALLOC, [key]: (level - 1) * STAT_POINTS_PER_LEVEL }) }
  })
  return { name: '우리', members: [h, ...mates] }
}

function winPct(level: number, regionIdx: number, h: CharSetup, n = 60): number {
  let w = 0
  for (let s = 1; s <= n; s++) {
    const enemy = rollEncounter(REGIONS[regionIdx], s)
    const us = party(level, structuredClone(h))
    if (simulate({ seed: s, teams: [us, enemy], config: DEFAULT_CONFIG, skills: SKILLS }).outcome === 'team0') w++
  }
  return Math.round((w / n) * 100)
}

/** 고정 상대 — 엘리트 조합처럼 조합이 고정이라 신호가 깨끗하다 */
function winVs(foes: string[], h: CharSetup, level: number, n = 40): number {
  let w = 0
  for (let s = 1; s <= n; s++) {
    const enemy: TeamSetup = { name: 'e', members: foes.map((id, i) => monsterSetup(MONSTERS[id], i)) }
    const us = party(level, structuredClone(h))
    if (simulate({ seed: s, teams: [us, enemy], config: DEFAULT_CONFIG, skills: SKILLS }).outcome === 'team0') w++
  }
  return Math.round((w / n) * 100)
}

// 기본 수칙 — 무기 스킬 없음
const PLAIN = rs(r(sp(8), 'heavyBlow'), r(always, 'strike'))

describe('주인공 무기 — 정의', () => {
  it('무기 스킬 6종이 있고 전부 주인공 전용 무기를 요구한다', () => {
    for (const id of WEAPON_SKILLS) {
      const s = SKILLS[id]
      expect(s, id).toBeDefined()
      expect(s.requires?.weaponType, id).toEqual(['ego'])
    }
  })

  it('무기가 스킬을 쥐여 주고, 진화해도 앞 단계 것을 잃지 않는다 (에고의 기억)', () => {
    for (const id of HERO_WEAPONS) {
      const skills = ITEMS[id].skills ?? []
      expect(skills.length, id).toBeGreaterThan(0)
      for (const k of skills) expect(SKILLS[k], `${id} → ${k}`).toBeDefined()
    }
    const club = ITEMS.woodenClub.skills ?? []
    for (const next of ['egoSword', 'egoBlade'] as const) {
      for (const k of club) expect(ITEMS[next].skills, next).toContain(k)
    }
    for (const [from, to] of [['egoSword', 'braveSword'], ['egoBlade', 'darkBlade']] as const) {
      for (const k of ITEMS[from].skills ?? []) expect(ITEMS[to].skills, to).toContain(k)
    }
  })

  it('요약이 무기 스킬을 모은다', () => {
    const g = summarizeGear([{ uid: 'w', itemId: 'braveSword', refine: 0 }])
    expect(g.skills).toEqual(['headKnock', 'rally', 'wedge', 'breakingEdge'])
    expect(g.traits).toContain('bulwark')
  })
})

describe('주인공 무기 — 수칙에 넣을 값이 있나 (docs/31 §7)', () => {
  // 승률이 90% 를 넘는 자리에서는 무엇을 해도 차이가 안 난다 (포화 — docs/18).
  // 그래서 기준 편성이 30~65% 인 자리에서 잰다: 거미 숲 Lv18 · 심연의 굴 Lv28
  it('머리 치기: 뒤에서 되돌리는 적(돌의 창자)이 있는 곳에서 값이 난다', () => {
    // 무너진 성채 — 돌의 창자가 치유 주문(준비 150)을 왼다. 늦추면 그만큼 덜 되돌린다
    const plain = winPct(20, 6, hero(20, 'egoSword', PLAIN))
    const used = winPct(20, 6, hero(20, 'egoSword', rs(
      r(at({ kind: 'teamCastingCount', side: 'enemy', cmp: 'gte', value: 1 }), 'headKnock'),
      r(sp(8), 'heavyBlow'),
      r(always, 'strike'),
    )))
    console.log(`머리 치기 — 안 넣음 ${plain}% → 넣음 ${used}%`)
    expect(used - plain).toBeGreaterThanOrEqual(3)
  })

  it('쐐기: 마무리 줄을 넣으면 낫다', () => {
    const plain = winPct(16, 5, hero(16, 'egoSword', PLAIN))
    const used = winPct(16, 5, hero(16, 'egoSword', rs(
      r(at({ kind: 'teamAnyHpPct', side: 'enemy', cmp: 'lte', value: 40 }), 'wedge'),
      r(sp(8), 'heavyBlow'),
      r(always, 'strike'),
    )))
    console.log(`쐐기 — 안 넣음 ${plain}% → 넣음 ${used}%`)
    expect(used - plain).toBeGreaterThanOrEqual(5)
  })

  it('꺾는 검: 스스로를 강화하는 적(오우거의 전의 고양)에게 값이 난다', () => {
    const h = (rules: RuleSet) => hero(28, 'braveSword', rules, 'brave')
    const plain = winPct(28, 7, h(PLAIN))
    const used = winPct(28, 7, h(rs(
      r(at({ kind: 'teamStatusCount', side: 'enemy', status: 'atkUp', cmp: 'gte', value: 1 }), 'breakingEdge'),
      r(sp(8), 'heavyBlow'),
      r(always, 'strike'),
    )))
    console.log(`꺾는 검 — 안 넣음 ${plain}% → 넣음 ${used}%`)
    expect(used - plain).toBeGreaterThanOrEqual(3)
  })

  it('어둠 해방: 멈출 선을 그은 수칙이 무조건 태우는 수칙보다 낫다', () => {
    const h = (rules: RuleSet) => hero(28, 'darkBlade', rules, 'fallenHero')
    const burn = winPct(28, 7, h(rs(r(sp(18), 'darkRelease'), r(always, 'strike'))))
    const lined = winPct(28, 7, h(rs(
      r(and(sp(18), at({ kind: 'selfHpPct', cmp: 'gte', value: 50 }), at({ kind: 'teamAliveCount', side: 'enemy', cmp: 'gte', value: 3 })), 'darkRelease'),
      r(sp(8), 'heavyBlow'),
      r(always, 'strike'),
    )))
    console.log(`어둠 해방 — 무조건 ${burn}% vs 멈출 선 ${lined}%`)
    expect(lined).toBeGreaterThanOrEqual(burn)
  })

  it('무기 스킬을 아무 데나 넣으면 값이 없다 — 힘 도약이 아니다 (docs/18 §12)', () => {
    const plain = winPct(16, 5, hero(16, 'egoSword', PLAIN))
    const dumped = winPct(16, 5, hero(16, 'egoSword', rs(r(always, 'rally'), r(always, 'strike'))))
    console.log(`구령을 아무 데나 — 기본 ${plain}% vs 항상 구령 ${dumped}%`)
    expect(dumped).toBeLessThanOrEqual(plain)
  })
})
