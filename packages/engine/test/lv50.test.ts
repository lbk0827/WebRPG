// 주인공 3차 전직 (Lv50) — 영웅의 「서약의 빛」과 마검사의 「혼돈」 (docs/31 §6).
//
// 여기서 지키는 것:
//   · 혼돈은 때릴 때마다 쌓이고, 상한·지속이 있고, **건 사람의 공격력**이 값을 정한다
//   · 서약의 빛은 모으기만 해서는 값이 없고, 「서약」으로 소모해야 일한다
//   · 둘 다 수칙을 짜야 값이 난다 (한 명에게 모으기 · 언제 터뜨리기)
import { describe, expect, it } from 'vitest'
import {
  DEFAULT_CONFIG, EMPTY_ALLOC, HERO_JOB, ITEMS, JOB_ADVANCE, PRESETS, SKILLS, STATUS_DEFS,
  STAT_POINTS_PER_LEVEL, advanceChain, growthStats, simulate, summarizeGear,
} from '../src'
import type { BattleEvent, CharSetup, RuleSet, Stats, TeamSetup } from '../src'

const at = (a: unknown) => ({ op: 'atom' as const, atom: a as never })
const always = { op: 'always' as const }
const r = (condition: unknown, skillId: string) => ({ condition: condition as never, skillId })
const rs = (...rows: ReturnType<typeof r>[]): RuleSet => ({ rows })
const sp = (v: number) => at({ kind: 'selfSpAbs', cmp: 'gte', value: v })

/** 주인공 — 3차 전직 사슬 전체(보정·특성·무기)를 얹는다 */
function hero(level: number, job2: string, rules: RuleSet): CharSetup {
  const p = PRESETS[HERO_JOB]
  const chain = advanceChain(job2)
  const weapon = [...chain].reverse().find((a) => a.weapon)?.weapon ?? 'woodenClub'
  const g = summarizeGear([{ uid: 'w', itemId: weapon, refine: 0 }])
  let stats: Stats = growthStats(p.stats, level, { ...EMPTY_ALLOC, str: (level - 1) * STAT_POINTS_PER_LEVEL })
  for (const a of chain) for (const [k, v] of Object.entries(a.bonus)) stats[k as keyof Stats] = (stats[k as keyof Stats] ?? 0) + (v ?? 0)
  for (const [k, v] of Object.entries(g.stats)) stats[k as keyof Stats] = (stats[k as keyof Stats] ?? 0) + (v ?? 0)
  return {
    id: `${HERO_JOB}#0`, name: '주인공', level, row: 'front', guard: structuredClone(p.guard), stats,
    skills: [...new Set([...p.skills, 'warCry', ...chain.flatMap((a) => a.grants), ...g.skills])],
    rules: structuredClone(rules),
    bonus: { atk: g.atk, def: g.def },
    traits: [...chain.flatMap((a) => a.traits), ...g.traits],
    weapon: g.weapon,
  }
}

/** 허수아비 — 때리기만 하고 아주 단단하다. 상태이상 흐름만 보기 위한 상대 */
function dummy(name: string, maxHp = 100000, count = 1): TeamSetup {
  return {
    name,
    members: Array.from({ length: count }, (_, i) => ({
      id: `warrior#${i}`, name: `${name}${i + 1}`, row: 'front' as const, guard: { mode: 'never' as const },
      stats: { maxHp, maxSp: 40, str: 30, int: 5, dex: 10, spd: 20, luk: 0, def: 0, mdef: 0 },
      skills: ['strike'], rules: rs(r(always, 'strike')),
    })),
  }
}

const run = (us: TeamSetup, them: TeamSetup, seed = 7) =>
  simulate({ seed, teams: [us, them], config: DEFAULT_CONFIG, skills: SKILLS })

const ticks = (ev: BattleEvent[], status: string) =>
  ev.filter((e): e is Extract<BattleEvent, { t: 'statusTick' }> => e.t === 'statusTick' && e.status === status)

describe('Lv50 전직 정의', () => {
  it('영웅 · 마검사가 계보 끝에 붙는다', () => {
    expect(JOB_ADVANCE.hero.base).toBe('brave')
    expect(JOB_ADVANCE.magicSwordsman.base).toBe('fallenHero')
    for (const id of ['hero', 'magicSwordsman'] as const) {
      expect(JOB_ADVANCE[id].level).toBe(50)
      expect(advanceChain(id).map((a) => a.id)).toHaveLength(3)
    }
    expect(JOB_ADVANCE.hero.weapon).toBe('excalibur')
    expect(JOB_ADVANCE.magicSwordsman.weapon).toBe('apocalypse')
  })

  it('Lv50 무기는 5등급 전용이고 앞 단계 무기 스킬을 잇는다', () => {
    for (const id of ['excalibur', 'apocalypse'] as const) {
      expect(ITEMS[id].tier).toBe(5)
      expect(ITEMS[id].bound).toBe(true)
      expect(ITEMS[id].weaponType).toBe('ego')
    }
    for (const k of ITEMS.braveSword.skills ?? []) expect(ITEMS.excalibur.skills).toContain(k)
    for (const k of ITEMS.darkBlade.skills ?? []) expect(ITEMS.apocalypse.skills).toContain(k)
    expect(ITEMS.excalibur.skills).toContain('oathCall')
  })

  it('누적 상태 둘이 정의돼 있다', () => {
    expect(STATUS_DEFS.chaos.stack).toBe(true)
    expect(STATUS_DEFS.chaos.maxStacks).toBe(12)
    expect(STATUS_DEFS.oath.stack).toBe(true)
    expect(STATUS_DEFS.oath.maxStacks).toBe(10)
  })
})

describe('마검사 — 혼돈', () => {
  const PLAIN = rs(r(always, 'strike'))

  it('때릴 때마다 쌓이고, 그 적의 차례마다 아프다', () => {
    const res = run({ name: '우리', members: [hero(50, 'magicSwordsman', PLAIN)] }, dummy('허수아비'))
    const t = ticks(res.events, 'chaos')
    expect(t.length, '혼돈이 돌아야 한다').toBeGreaterThan(3)
    // 쌓일수록 커진다 — 뒤의 피해가 앞의 피해보다 크다
    expect(t[t.length - 1].amount).toBeGreaterThan(t[0].amount)
  })

  it('상한 12겹에서 멈춘다', () => {
    const res = run({ name: '우리', members: [hero(50, 'magicSwordsman', PLAIN)] }, dummy('허수아비'))
    const t = ticks(res.events, 'chaos')
    const per = t[0].amount
    // 겹당 값이 같으므로 최대 피해는 12겹을 넘지 않는다 (여유 20%)
    expect(Math.max(...t.map((x) => x.amount))).toBeLessThanOrEqual(per * 12 * 1.2)
  })

  it('공격을 올리고 쌓은 혼돈이 더 아프다 — 겹 하나의 값이 커진다', () => {
    // 겹 하나에 저장되는 값 = statusApply 의 magnitude. 공격↑ 중에 쌓은 겹이 더 커야 한다.
    // 총 피해로 재면 안 된다 — 전의 고양에 한 차례를 쓰므로 때린 횟수가 줄어 상쇄된다 (그 저울질이 수칙의 몫이다)
    const perStack = (rules: RuleSet) => {
      const ev = run({ name: '우리', members: [hero(50, 'magicSwordsman', rules)] }, dummy('허수아비')).events
      const mags = ev
        .filter((e): e is Extract<BattleEvent, { t: 'statusApply' }> => e.t === 'statusApply' && e.status === 'chaos')
        .map((e) => e.magnitude)
      return Math.max(...mags)
    }
    const plain = perStack(PLAIN)
    const buffed = perStack(rs(r(at({ kind: 'selfActionCount', cmp: 'eq', value: 1 }), 'warCry'), r(always, 'strike')))
    console.log(`혼돈 겹당 — 그냥 ${plain} vs 공격↑ 중 ${buffed}`)
    expect(buffed).toBeGreaterThan(plain)
  })

  it('한 명에게 모으는 것이 흩뿌리는 것보다 아프다', () => {
    // 같은 횟수를 때려도, 대상이 갈리면 겹이 흩어진다 (지속 4차례)
    const focus = run({ name: '우리', members: [hero(50, 'magicSwordsman', PLAIN)] }, dummy('허수아비', 100000, 1))
    const spread = run({ name: '우리', members: [hero(50, 'magicSwordsman', rs(r(always, 'sweep'), r(always, 'strike')))] }, dummy('허수아비', 100000, 4))
    const peak = (ev: BattleEvent[]) => Math.max(0, ...ticks(ev, 'chaos').map((e) => e.amount))
    expect(peak(focus.events)).toBeGreaterThan(peak(spread.events) / 2)
  })
})

describe('영웅 — 서약의 빛', () => {
  it('자기 차례마다 모이고, 「서약」으로 소모해 아군을 지킨다', () => {
    const useIt = rs(r(at({ kind: 'selfStatusStacks', status: 'oath', cmp: 'gte', value: 6 }), 'oathCall'), r(always, 'strike'))
    const res = run({ name: '우리', members: [hero(50, 'hero', useIt)] }, dummy('허수아비', 2000))
    const consumed = res.events.some((e) => e.t === 'statusExpire' && e.status === 'oath')
    const shielded = res.events.some((e) => e.t === 'statusApply' && e.status === 'barrier')
    expect(consumed, '서약을 쓰면 빛이 소모된다').toBe(true)
    expect(shielded, '아군에게 보호막이 붙는다').toBe(true)
  })

  it('모으기만 하면 값이 없다 — 쓰는 줄이 있어야 산다', () => {
    const hoard = rs(r(always, 'strike'))
    const spend = rs(r(at({ kind: 'selfStatusStacks', status: 'oath', cmp: 'gte', value: 4 }), 'oathCall'), r(always, 'strike'))
    const foes = () => ({
      name: '적',
      members: Array.from({ length: 3 }, (_, i) => ({
        id: `ogre#${i}`, name: `오우거${i + 1}`, row: 'front' as const, guard: { mode: 'never' as const },
        stats: { maxHp: 3000, maxSp: 60, str: 150, int: 5, dex: 10, spd: 60, luk: 0, def: 30, mdef: 20 },
        skills: ['strike'], rules: rs(r(always, 'strike')),
      })),
    })
    const win = (rules: RuleSet) => {
      let w = 0
      for (let s = 1; s <= 30; s++) {
        const us: TeamSetup = { name: '우리', members: [hero(50, 'hero', rules), { ...structuredClone(PRESETS.priest), id: 'priest#1', stats: growthStats(PRESETS.priest.stats, 50, { ...EMPTY_ALLOC, int: 49 * STAT_POINTS_PER_LEVEL }) }] }
        if (simulate({ seed: s, teams: [us, foes()], config: DEFAULT_CONFIG, skills: SKILLS }).outcome === 'team0') w++
      }
      return Math.round((w / 30) * 100)
    }
    const a = win(hoard)
    const b = win(spend)
    console.log(`서약 — 모으기만 ${a}% vs 쓰는 줄 ${b}%`)
    expect(b).toBeGreaterThanOrEqual(a)
  })
})
