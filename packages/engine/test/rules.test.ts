// 수칙 평가 · 끊기 · 우물쭈물 · 한정형 우선순위 동작 검증.
import { describe, expect, it } from 'vitest'
import { DEFAULT_CONFIG, SKILLS, makeTeam, simulate } from '../src'
import type { BattleEvent, BattleInput, CharSetup, Condition } from '../src'

const always: Condition = { op: 'always' }

function dummy(over: Partial<CharSetup> & { id: string }): CharSetup {
  return {
    name: over.id,
    row: 'front',
    guard: { mode: 'never' },
    stats: { maxHp: 400, maxSp: 50, str: 40, int: 40, dex: 30, spd: 40, luk: 10, def: 5, mdef: 5 },
    skills: ['strike'],
    rules: { rows: [{ condition: always, skillId: 'strike' }] },
    ...over,
  }
}

function run(a: CharSetup[], b: CharSetup[], seed = 1): BattleEvent[] {
  const inp: BattleInput = {
    seed,
    teams: [
      { name: 'A', members: a },
      { name: 'B', members: b },
    ],
    config: DEFAULT_CONFIG,
    skills: SKILLS,
  }
  return simulate(inp).events
}

describe('수칙 평가', () => {
  it('꺼 둔 패턴(disabled)은 평가하지 않는다 — 다음 패턴으로 넘어간다', () => {
    const c = dummy({
      id: 'c',
      skills: ['strike', 'heavyBlow'],
      rules: { rows: [{ condition: always, skillId: 'heavyBlow', disabled: true }, { condition: always, skillId: 'strike' }] },
    })
    const ev = run([c], [dummy({ id: 'foe' })])
    const fired = ev.filter((e): e is Extract<BattleEvent, { t: 'ruleFired' }> => e.t === 'ruleFired' && e.actor.team === 0)
    expect(fired.length).toBeGreaterThan(0)
    expect(fired.every((e) => e.ruleIndex === 1 && e.skillId === 'strike')).toBe(true)
  })

  it('조건이 전부 거짓이면 ruleExhausted 가 발생하고 아무것도 하지 않는다', () => {
    const idle = dummy({
      id: 'idle',
      rules: { rows: [{ condition: { op: 'atom', atom: { kind: 'selfHpPct', cmp: 'lte', value: 0 } }, skillId: 'strike' }] },
    })
    const ev = run([idle], [dummy({ id: 'foe' })])
    expect(ev.some((e) => e.t === 'ruleExhausted' && e.actor.team === 0)).toBe(true)
    expect(ev.some((e) => e.t === 'damage' && e.source.team === 0)).toBe(false)
  })

  it('SP 가 부족하면 skillFailed(noSp) 후 다음 행으로 넘어간다', () => {
    const c = dummy({
      id: 'c',
      stats: { maxHp: 400, maxSp: 5, str: 40, int: 40, dex: 30, spd: 40, luk: 10, def: 5, mdef: 5 },
      rules: {
        rows: [
          { condition: always, skillId: 'heavyBlow' },
          { condition: always, skillId: 'strike' },
        ],
      },
    })
    const ev = run([c], [dummy({ id: 'foe' })])
    const fail = ev.find((e) => e.t === 'skillFailed' && e.actor.team === 0)
    expect(fail && fail.t === 'skillFailed' && fail.reason).toBe('noSp')
    const fired = ev.find((e) => e.t === 'ruleFired' && e.actor.team === 0)
    expect(fired && fired.t === 'ruleFired' && fired.ruleIndex).toBe(1)
  })

  it('maxUses 는 전투당 발동 횟수를 제한한다', () => {
    const c = dummy({
      id: 'c',
      rules: {
        rows: [
          { condition: always, skillId: 'warCry', maxUses: 1 },
          { condition: always, skillId: 'strike' },
        ],
      },
    })
    const ev = run([c], [dummy({ id: 'foe', stats: { maxHp: 2000, maxSp: 0, str: 1, int: 1, dex: 30, spd: 40, luk: 10, def: 0, mdef: 0 } })])
    const cries = ev.filter((e) => e.t === 'ruleFired' && e.actor.team === 0 && e.skillId === 'warCry')
    expect(cries.length).toBe(1)
  })
})

describe('시전과 끊기 (§4.4 — 시그니처 메커니즘)', () => {
  it('선딜 스킬은 castStart 후 다음 차례에 castResolve 된다', () => {
    const caster = dummy({ id: 'caster', row: 'back', stats: { maxHp: 400, maxSp: 100, str: 5, int: 60, dex: 30, spd: 40, luk: 10, def: 5, mdef: 5 }, rules: { rows: [{ condition: always, skillId: 'inferno' }] } })
    const ev = run([caster], [dummy({ id: 'foe', stats: { maxHp: 5000, maxSp: 0, str: 1, int: 1, dex: 30, spd: 10, luk: 10, def: 0, mdef: 0 } })])
    const start = ev.findIndex((e) => e.t === 'castStart' && e.actor.team === 0)
    const resolve = ev.findIndex((e) => e.t === 'castResolve' && e.actor.team === 0)
    expect(start).toBeGreaterThan(-1)
    expect(resolve).toBeGreaterThan(start)
  })

  it('require:casting 스킬은 시전 중인 적이 없으면 noRequiredTarget 으로 실패한다', () => {
    const d = dummy({ id: 'd', rules: { rows: [{ condition: always, skillId: 'hush' }, { condition: always, skillId: 'strike' }] } })
    const ev = run([d], [dummy({ id: 'foe' })])
    const fail = ev.find((e) => e.t === 'skillFailed' && e.actor.team === 0)
    expect(fail && fail.t === 'skillFailed' && fail.reason).toBe('noRequiredTarget')
  })

  it('침묵을 걸면 진행 중인 시전이 castInterrupted 로 취소된다', () => {
    const caster = dummy({ id: 'caster', row: 'back', stats: { maxHp: 400, maxSp: 200, str: 5, int: 60, dex: 30, spd: 30, luk: 10, def: 5, mdef: 5 }, rules: { rows: [{ condition: always, skillId: 'inferno' }] } })
    const wall = dummy({ id: 'wall', stats: { maxHp: 3000, maxSp: 0, str: 1, int: 1, dex: 30, spd: 10, luk: 10, def: 0, mdef: 0 } })
    const husher = dummy({
      id: 'husher',
      stats: { maxHp: 400, maxSp: 200, str: 20, int: 20, dex: 30, spd: 90, luk: 10, def: 5, mdef: 5 },
      rules: { rows: [{ condition: { op: 'atom', atom: { kind: 'teamCastingCount', side: 'enemy', cmp: 'gte', value: 1 } }, skillId: 'hush' }, { condition: always, skillId: 'strike' }] },
    })
    const ev = run([husher], [wall, caster])
    expect(ev.some((e) => e.t === 'castInterrupted' && e.target.team === 1)).toBe(true)
  })
})

describe('타수 (§6.1)', () => {
  it('선딜이 있는 multi 스킬도 발동 시 정확히 hits 번만 때린다', () => {
    const caster = dummy({ id: 'caster', row: 'back', stats: { maxHp: 400, maxSp: 22, str: 5, int: 60, dex: 30, spd: 40, luk: 10, def: 5, mdef: 5 }, rules: { rows: [{ condition: always, skillId: 'inferno' }, { condition: always, skillId: 'strike' }] } })
    const foes = [0, 1, 2, 3, 4].map((i) => dummy({ id: `foe${i}`, stats: { maxHp: 99999, maxSp: 0, str: 1, int: 1, dex: 30, spd: 5, luk: 10, def: 0, mdef: 0 } }))
    const ev = run([caster], foes)
    const resolveIdx = ev.findIndex((e) => e.t === 'castResolve' && e.actor.team === 0)
    const nextTurn = ev.findIndex((e, i) => i > resolveIdx && e.t === 'turnBegin')
    const hits = ev.slice(resolveIdx, nextTurn).filter((e) => e.t === 'damage' && e.source.team === 0)
    expect(hits.length).toBe(SKILLS.inferno.target.hits)
  })

  it('all 스코프는 생존한 적 전원을 각각 hits 번 때린다', () => {
    const sweeper = dummy({ id: 'sweeper', stats: { maxHp: 400, maxSp: 14, str: 40, int: 5, dex: 30, spd: 40, luk: 10, def: 5, mdef: 5 }, rules: { rows: [{ condition: always, skillId: 'sweep' }, { condition: always, skillId: 'strike' }] } })
    const foes = [0, 1, 2].map((i) => dummy({ id: `foe${i}`, row: i === 0 ? 'front' : 'back', guard: { mode: 'always' }, stats: { maxHp: 99999, maxSp: 0, str: 1, int: 1, dex: 30, spd: 5, luk: 10, def: 0, mdef: 0 } }))
    const ev = run([sweeper], foes)
    const resolveIdx = ev.findIndex((e) => e.t === 'castResolve' && e.actor.team === 0)
    const nextTurn = ev.findIndex((e, i) => i > resolveIdx && e.t === 'turnBegin')
    const slice = ev.slice(resolveIdx, nextTurn)
    const targetsHit = new Set(slice.filter((e) => e.t === 'damage').map((e) => (e.t === 'damage' ? e.target.index : -1)))
    expect(targetsHit.size).toBe(3)
    // 광역기는 엄호로 흡수되지 않는다
    expect(slice.some((e) => e.t === 'cover')).toBe(false)
  })
})

describe('진형과 엄호 (§4.2)', () => {
  it('always 엄호 방침의 전열은 후열을 대신 맞는다', () => {
    // 전투가 연장전까지 가도 방벽이 죽지 않도록 HP 를 충분히 크게 둔다
    const tank = dummy({ id: 'tank', guard: { mode: 'always' }, stats: { maxHp: 999999, maxSp: 0, str: 1, int: 1, dex: 30, spd: 5, luk: 10, def: 0, mdef: 0 } })
    const squishy = dummy({ id: 'squishy', row: 'back', stats: { maxHp: 3000, maxSp: 0, str: 1, int: 1, dex: 30, spd: 5, luk: 10, def: 0, mdef: 0 } })
    const archer = dummy({ id: 'archer', rules: { rows: [{ condition: always, skillId: 'strike' }] } })
    // 공격자는 임의 대상을 고르므로 후열이 뽑히는 경우가 있어야 한다
    const ev = run([archer], [tank, squishy], 3)
    expect(ev.some((e) => e.t === 'cover' && e.defender.index === 0)).toBe(true)
    expect(ev.some((e) => e.t === 'damage' && e.target.index === 1 && e.amount > 0)).toBe(false)
  })

  it('ignoreCover 스킬은 엄호를 뚫는다', () => {
    const tank = dummy({ id: 'tank', guard: { mode: 'always' }, stats: { maxHp: 3000, maxSp: 0, str: 1, int: 1, dex: 30, spd: 5, luk: 10, def: 0, mdef: 0 } })
    const squishy = dummy({ id: 'squishy', row: 'back', stats: { maxHp: 3000, maxSp: 0, str: 1, int: 1, dex: 30, spd: 5, luk: 10, def: 0, mdef: 0 } })
    const sniper = dummy({ id: 'sniper', stats: { maxHp: 400, maxSp: 500, str: 40, int: 40, dex: 30, spd: 40, luk: 10, def: 5, mdef: 5 }, rules: { rows: [{ condition: always, skillId: 'pierceShot' }] } })
    const ev = run([sniper], [tank, squishy], 3)
    expect(ev.some((e) => e.t === 'cover')).toBe(false)
    expect(ev.some((e) => e.t === 'damage' && e.target.index === 1 && e.amount > 0)).toBe(true)
  })
})
