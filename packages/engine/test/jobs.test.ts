// M2-5b 전직. 2차 직업이 "스탯이 좋은 직업"이 아니라 **수칙 훅**이라는 것을 고정한다 (ADR-003).
import { describe, expect, it } from 'vitest'
import {
  DEFAULT_CONFIG,
  JOB_ADVANCES,
  JOB_ADVANCE,
  PRESETS,
  SKILLS,
  TRAITS,
  advanceLevel,
  advancesFor,
  canAdvance,
  jobSkillPool,
  learnableFor,
  simulate,
} from '../src'
import type { CharSetup, TeamSetup } from '../src'

const JOBS = ['warrior', 'rogue', 'mage', 'priest', 'elf']

describe('2차 직업 정의', () => {
  it('1차 직업마다 정확히 2개', () => {
    for (const j of JOBS) expect(advancesFor(j), j).toHaveLength(2)
    expect(JOB_ADVANCES).toHaveLength(10)
  })

  it('id 가 겹치지 않고 1차 직업이 실재한다', () => {
    const ids = new Set(JOB_ADVANCES.map((j) => j.id))
    expect(ids.size).toBe(JOB_ADVANCES.length)
    for (const j of JOB_ADVANCES) expect(PRESETS[j.base], `${j.id} 의 1차 직업`).toBeDefined()
  })

  it('전직 레벨은 18~22 (docs/07 §3.3)', () => {
    for (const j of JOB_ADVANCES) {
      expect(j.level, j.id).toBeGreaterThanOrEqual(18)
      expect(j.level, j.id).toBeLessThanOrEqual(22)
    }
  })

  it('모든 특성·스킬 id 가 실재한다', () => {
    for (const j of JOB_ADVANCES) {
      for (const t of j.traits) expect(TRAITS[t], `${j.id} → 특성 ${t}`).toBeDefined()
      for (const s of j.grants) expect(SKILLS[s], `${j.id} → 스킬 ${s}`).toBeDefined()
      for (const l of j.learnable) expect(SKILLS[l.skillId], `${j.id} → 습득 ${l.skillId}`).toBeDefined()
    }
  })

  it('직업마다 훅이 하나씩 있고 문구가 비어 있지 않다', () => {
    const kinds = new Set(JOB_ADVANCES.map((j) => j.hookKind))
    expect(kinds.size, '훅이 겹치면 고를 이유가 없다').toBe(JOB_ADVANCES.length)
    for (const j of JOB_ADVANCES) {
      expect(j.traits.length, `${j.id} 는 훅 특성이 있어야 한다`).toBeGreaterThan(0)
      expect(j.hook.length, j.id).toBeGreaterThan(10)
    }
  })

  it('스탯 보정은 방향만 잡는 정도 — 한 항목이 과하지 않다', () => {
    for (const j of JOB_ADVANCES) {
      for (const [k, v] of Object.entries(j.bonus)) {
        const cap = k === 'maxHp' ? 260 : k === 'maxSp' ? 60 : 16
        expect(v ?? 0, `${j.id}.${k}`).toBeLessThanOrEqual(cap)
      }
    }
  })

  it('전직 가능 판정', () => {
    expect(canAdvance('rogue', undefined, 17)).toBe(false)
    expect(canAdvance('rogue', undefined, 18)).toBe(true)
    expect(canAdvance('warrior', undefined, 18)).toBe(false)
    expect(canAdvance('warrior', undefined, 20)).toBe(true)
    expect(canAdvance('warrior', 'guardian', 30), '이미 전직했으면 못 한다').toBe(false)
    expect(advanceLevel('rogue')).toBe(18)
    expect(advanceLevel('warrior')).toBe(20)
  })

  it('2차 스킬 목록이 1차 목록에 섞이지 않는다', () => {
    const base = learnableFor('warrior').map((l) => l.skillId)
    const adv = learnableFor('warrior', 'guardian').map((l) => l.skillId)
    expect(adv.length).toBeGreaterThan(base.length)
    for (const s of base) expect(adv).toContain(s)
    expect(jobSkillPool('warrior', 'guardian')).toContain('bulwark')
    expect(jobSkillPool('warrior')).not.toContain('bulwark')
  })
})

// ── 훅이 실제로 전투에서 작동하는가 ────────────────────────
function lone(over: Partial<CharSetup>, job = 'warrior'): CharSetup {
  const p = structuredClone(PRESETS[job])
  return { ...p, id: `${job}#0`, rules: { rows: [{ condition: { op: 'always' }, skillId: 'strike' }] }, ...over }
}
const team = (name: string, m: CharSetup[]): TeamSetup => ({ name, members: m })

/** 한 판 돌려 team0 이 준 총 피해 */
function damageDealt(attacker: CharSetup, defender: CharSetup, seed = 5): number {
  const r = simulate({ seed, teams: [team('a', [attacker]), team('b', [defender])], config: DEFAULT_CONFIG, skills: SKILLS })
  let n = 0
  for (const e of r.events) if (e.t === 'damage' && e.source.team === 0) n += e.amount
  return n
}

describe('수칙 훅이 전투에서 작동한다', () => {
  it('암살자의 독술 — 같은 독이 더 아프다', () => {
    const rules = { rows: [{ condition: { op: 'always' as const }, skillId: 'venom' }] }
    const target = () => lone({ id: 'dummy#0', stats: { ...PRESETS.warrior.stats, maxHp: 9000 } })
    const plain = simulate({
      seed: 3,
      teams: [team('a', [lone({ rules, skills: ['venom', 'strike'] }, 'rogue')]), team('b', [target()])],
      config: DEFAULT_CONFIG,
      skills: SKILLS,
    })
    const hooked = simulate({
      seed: 3,
      teams: [team('a', [lone({ rules, skills: ['venom', 'strike'], traits: ['venomcraft'] }, 'rogue')]), team('b', [target()])],
      config: DEFAULT_CONFIG,
      skills: SKILLS,
    })
    const tick = (r: typeof plain) => r.events.filter((e) => e.t === 'statusTick').reduce((s, e) => s + (e.t === 'statusTick' ? e.amount : 0), 0)
    expect(tick(hooked), '독술이 붙으면 지속 피해가 커야 한다').toBeGreaterThan(tick(plain))
  })

  it('심문관의 열의 — 디버프 걸린 적에게 더 아프다', () => {
    const target = (debuffed: boolean) =>
      lone({
        id: 'dummy#0',
        stats: { ...PRESETS.warrior.stats, maxHp: 9000 },
        rules: { rows: [{ condition: { op: 'always' }, skillId: debuffed ? 'venom' : 'strike' }] },
        skills: ['strike', 'venom'],
      })
    // 상대가 스스로 독을 뒤집어쓰지는 않으므로, 디버프는 우리가 건다
    const zealot = lone({
      rules: { rows: [{ condition: { op: 'atom', atom: { kind: 'selfActionCount', cmp: 'eq', value: 1 } }, skillId: 'venom', maxUses: 1 }, { condition: { op: 'always' }, skillId: 'strike' }] },
      skills: ['strike', 'venom'],
      traits: ['zeal'],
    })
    const plainZ = { ...zealot, traits: [] }
    expect(damageDealt(zealot, target(false)), '열의가 붙으면 더 아프다').toBeGreaterThan(damageDealt(plainZ, target(false)))
  })

  it('주교의 고전례 — 5번째·6번째 칸까지 읽는다', () => {
    // INT 5 → 기본 칸 4개. 앞 5줄은 항상 거짓, 6번째 줄(index 5)만 참.
    // 특성이 없으면 4줄까지만 읽어 우물쭈물하고, +2 가 붙으면 6번째가 발동한다.
    const never = { op: 'atom' as const, atom: { kind: 'selfHpPct' as const, cmp: 'lte' as const, value: 0 } }
    const rows = [
      ...Array.from({ length: 5 }, () => ({ condition: never, skillId: 'strike' })),
      { condition: { op: 'always' as const }, skillId: 'strike' },
    ]
    const base = lone({ rules: { rows }, stats: { ...PRESETS.priest.stats, int: 5 }, skills: ['strike'] }, 'priest')
    const bishop = { ...base, traits: ['highLiturgy'] }
    const firedRow5 = (c: CharSetup) => {
      const r = simulate({ seed: 1, teams: [team('a', [c]), team('b', [lone({ id: 'd#0' })])], config: DEFAULT_CONFIG, skills: SKILLS })
      return r.events.some((e) => e.t === 'ruleFired' && e.actor.team === 0 && e.ruleIndex === 5)
    }
    expect(firedRow5(base), '칸이 4개면 6번째 줄은 읽히지 않는다').toBe(false)
    expect(firedRow5(bishop), '고전례가 붙으면 6번째 줄이 발동한다').toBe(true)
  })

  it('전부 결정론 — 같은 훅·같은 시드면 같은 결과', () => {
    const a = () => lone({ traits: ['venomcraft', 'zeal'], skills: ['strike', 'venom'] }, 'rogue')
    const run = () => simulate({ seed: 11, teams: [team('a', [a()]), team('b', [lone({ id: 'd#0' })])], config: DEFAULT_CONFIG, skills: SKILLS })
    expect(JSON.stringify(run().events)).toBe(JSON.stringify(run().events))
  })
})

// ── 전직은 "다르게 싸우는 것"이지 힘 도약이 아니다 (ADR-003) ──
import { EMPTY_ALLOC, REGIONS, STAT_POINTS_PER_LEVEL, growthStats, rollEncounter } from '../src'
import type { StatKey, Stats } from '../src'

const PRIMARY: Record<string, StatKey> = { warrior: 'str', rogue: 'dex', mage: 'int', priest: 'int', elf: 'dex' }

/**
 * 웹의 memberStats 와 **같은 순서**로 계산한다: 레벨 배율을 먹인 뒤 전직 보정을 더한다.
 * 순서가 뒤집히면 HP +240 이 Lv23 에서 +500 이 넘어 전직이 힘 도약이 된다 (2026-09-12 실제로 그랬다).
 */
function advStats(scaled: Stats, job2?: string): Stats {
  const adv = job2 ? JOB_ADVANCE[job2] : undefined
  if (!adv) return scaled
  const out = { ...scaled }
  for (const [k, v] of Object.entries(adv.bonus)) out[k as keyof Stats] = (out[k as keyof Stats] ?? 0) + (v ?? 0)
  return out
}

function advParty(level: number, advanced: Record<string, string>): TeamSetup {
  return {
    name: '측정',
    members: JOBS.map((j, i) => {
      const p = structuredClone(PRESETS[j])
      const j2 = advanced[j]
      const adv = j2 ? JOB_ADVANCE[j2] : undefined
      const alloc = { ...EMPTY_ALLOC, [PRIMARY[j]]: (level - 1) * STAT_POINTS_PER_LEVEL }
      return {
        ...p,
        id: `${j}#${i}`,
        stats: advStats(growthStats(p.stats, level, alloc), j2),
        skills: [...new Set([...p.skills, ...(adv?.grants ?? [])])],
        traits: adv?.traits ?? [],
      }
    }),
  }
}

function winAt(level: number, regionIdx: number, t: TeamSetup, n = 80): number {
  let w = 0
  for (let s = 1; s <= n; s++) {
    const e = rollEncounter(REGIONS[regionIdx], s)
    if (simulate({ seed: s, teams: [t, e], config: DEFAULT_CONFIG, skills: SKILLS }).outcome === 'team0') w++
  }
  return Math.round((w / n) * 100)
}

describe('전직은 힘 도약이 아니다', () => {
  const REGION = 7 // 심연의 굴
  const LV = REGIONS[REGION].recommended[0]
  const base = winAt(LV, REGION, advParty(LV, {}))

  it('수칙을 그대로 둔 채 전직만 하면 값이 크게 뛰지 않는다', () => {
    for (const a of JOB_ADVANCES) {
      const got = winAt(LV, REGION, advParty(LV, { [a.base]: a.id }))
      // 위: 전직이 수칙을 대체해 버리면 안 된다. 아래: 전직이 손해여도 안 된다
      expect(got - base, `${a.name}: 기준 ${base}% → ${got}%`).toBeLessThanOrEqual(14)
      expect(got - base, `${a.name}: 기준 ${base}% → ${got}%`).toBeGreaterThanOrEqual(-6)
    }
  })

  it('전원 전직해도 마찬가지 (한 명씩의 합이 폭발하지 않는다)', () => {
    const all = { warrior: 'guardian', rogue: 'assassin', mage: 'elementalist', priest: 'bishop', elf: 'ranger' }
    const got = winAt(LV, REGION, advParty(LV, all))
    expect(got - base, `전원 전직: 기준 ${base}% → ${got}%`).toBeLessThanOrEqual(30)
    console.log(`\n전직 전 ${base}% → 전원 전직 ${got}% (수칙은 그대로)\n`)
  })
})
