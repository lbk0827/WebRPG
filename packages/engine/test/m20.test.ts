// M2-0 전투 기반 보강: 장비 항 · 특성 · 프리미티브 확장 · 지연 상한 · 능력치 조건.
import { describe, expect, it } from 'vitest'
import { DEFAULT_CONFIG, SKILLS, simulate } from '../src'
import type { BattleEvent, BattleInput, CharSetup, Condition, Skill, SkillBook } from '../src'

const always: Condition = { op: 'always' }
const base = (over: Partial<CharSetup> & { id: string }): CharSetup => ({
  name: over.id, row: 'front', guard: { mode: 'never' },
  stats: { maxHp: 2000, maxSp: 200, str: 40, int: 40, dex: 40, spd: 40, luk: 10, def: 0, mdef: 0 },
  skills: ['strike'], rules: { rows: [{ condition: always, skillId: 'strike' }] },
  ...over,
})
const wall = (id = 'wall', extra: Partial<CharSetup> = {}): CharSetup => base({ id, stats: { maxHp: 99999, maxSp: 0, str: 1, int: 1, dex: 1, spd: 5, luk: 10, def: 0, mdef: 0 }, ...extra })
const cfg = { ...DEFAULT_CONFIG, maxActions: 40 }
const sk = (s: Partial<Skill> & { id: string }): Skill => ({ label: s.id, spCost: 0, target: { side: 'enemy', scope: 'single', hits: 1 }, charge: 0, stiff: 0, effects: [], ...s })
const book = (...extra: Skill[]): SkillBook => ({ ...SKILLS, ...Object.fromEntries(extra.map((s) => [s.id, s])) })
const run = (a: CharSetup[], b: CharSetup[], skills: SkillBook = SKILLS, seed = 1): BattleEvent[] =>
  simulate({ seed, teams: [{ name: 'A', members: a }, { name: 'B', members: b }], config: cfg, skills } satisfies BattleInput).events
const dmgTo = (ev: BattleEvent[], team: 0 | 1, index = 0): number[] => ev.filter((e) => e.t === 'damage' && e.target.team === team && e.target.index === index && !e.nullified).map((e) => (e.t === 'damage' ? e.amount : 0))

describe('장비 항', () => {
  it('bonus.atk 는 기본치에 더해진다', () => {
    const a = run([base({ id: 'a' })], [wall()])
    const b = run([base({ id: 'b', bonus: { atk: [30, 0] } })], [wall()])
    expect(dmgTo(b, 1)[0]).toBe(dmgTo(a, 1)[0] + 30)
  })
  it('bonus.def 는 비율·고정으로 감소시킨다', () => {
    const a = run([base({ id: 'a' })], [wall()])
    const b = run([base({ id: 'b' })], [wall('w', { bonus: { def: [50, 5, 0, 0] } })])
    // raw 63 → 50% → 31 − 5 = 26
    expect(dmgTo(b, 1)[0]).toBe(Math.floor(dmgTo(a, 1)[0] / 2) - 5)
  })
})

describe('프리미티브 확장', () => {
  it('moveRow swap: 열이 바뀌고 rowChange 이벤트가 남는다', () => {
    const s = sk({ id: 'hitAndRun', effects: [{ kind: 'damage', school: 'phys', power: 100 }, { kind: 'moveRow', who: 'self', to: 'swap' }] })
    const c = base({ id: 'c', skills: ['hitAndRun'], rules: { rows: [{ condition: always, skillId: 'hitAndRun' }] } })
    const ev = run([c], [wall()], book(s))
    const rc = ev.filter((e) => e.t === 'rowChange' && e.target.team === 0)
    expect(rc.length).toBeGreaterThan(1)
    expect(rc[0].t === 'rowChange' && rc[0].row).toBe('back')
    expect(rc[1].t === 'rowChange' && rc[1].row).toBe('front')
  })
  it('rowBonus: 열 조건이 맞을 때만 다른 위력', () => {
    const s = sk({ id: 'backstab', effects: [{ kind: 'damage', school: 'phys', power: 100, rowBonus: { selfRow: 'back', power: 300 } }] })
    const front = base({ id: 'f', row: 'front', skills: ['backstab'], rules: { rows: [{ condition: always, skillId: 'backstab' }] } })
    const back = { ...front, id: 'b', row: 'back' as const }
    const d1 = dmgTo(run([front], [wall()], book(s)), 1)[0]
    const d2 = dmgTo(run([back], [wall()], book(s)), 1)[0]
    expect(d2).toBe(d1 * 3)
  })
  it('falloff: 연타는 타수마다 위력이 줄어든다', () => {
    const s = sk({ id: 'flurry3', target: { side: 'enemy', scope: 'single', hits: 3 }, effects: [{ kind: 'damage', school: 'phys', power: 100, falloff: 30 }] })
    const c = base({ id: 'c', skills: ['flurry3'], rules: { rows: [{ condition: always, skillId: 'flurry3' }] } })
    const d = dmgTo(run([c], [wall()], book(s)), 1).slice(0, 3)
    expect(d[1]).toBeLessThan(d[0])
    expect(d[2]).toBeLessThan(d[1])
    expect(d[1]).toBe(Math.floor((d[0] * 70) / 100))
  })
  it('stiff 음수: 다음 차례가 빨리 온다', () => {
    const fast = sk({ id: 'fast', stiff: -400, effects: [{ kind: 'damage', school: 'phys', power: 100 }] })
    const cnt = (stiff: number) => {
      const c = base({ id: 'c', skills: ['x'], rules: { rows: [{ condition: always, skillId: 'x' }] } })
      const ev = run([c], [wall()], book({ ...fast, id: 'x', stiff }))
      return ev.filter((e) => e.t === 'turnBegin' && e.actor.team === 0).length
    }
    expect(cnt(-400)).toBeGreaterThan(cnt(0))
  })
  it('cooldown / perBattle: 재사용 대기와 전투당 횟수', () => {
    const big = sk({ id: 'big', cooldown: 2, perBattle: 2, effects: [{ kind: 'damage', school: 'phys', power: 100 }] })
    const c = base({ id: 'c', skills: ['big', 'strike'], rules: { rows: [{ condition: always, skillId: 'big' }, { condition: always, skillId: 'strike' }] } })
    const ev = run([c], [wall()], book(big))
    const fired = ev.filter((e) => e.t === 'ruleFired' && e.actor.team === 0).map((e) => (e.t === 'ruleFired' ? e.skillId : ''))
    expect(fired.filter((x) => x === 'big').length).toBe(2)
    expect(fired.slice(0, 4)).toEqual(['big', 'strike', 'strike', 'big'])
    expect(ev.some((e) => e.t === 'skillFailed' && e.reason === 'cooldown')).toBe(true)
  })
  it('requires.weaponType: 무기가 안 맞으면 noWeapon 으로 다음 패턴', () => {
    const bowOnly = sk({ id: 'bowOnly', requires: { weaponType: ['bow'] }, effects: [{ kind: 'damage', school: 'phys', power: 100 }] })
    const rules = { rows: [{ condition: always, skillId: 'bowOnly' }, { condition: always, skillId: 'strike' }] }
    const noBow = run([base({ id: 'n', skills: ['bowOnly', 'strike'], rules })], [wall()], book(bowOnly))
    const withBow = run([base({ id: 'b', weapon: 'bow', skills: ['bowOnly', 'strike'], rules })], [wall()], book(bowOnly))
    expect(noBow.some((e) => e.t === 'skillFailed' && e.reason === 'noWeapon')).toBe(true)
    expect(withBow.some((e) => e.t === 'ruleFired' && e.skillId === 'bowOnly')).toBe(true)
  })
  it('damageSp 와 drain', () => {
    const s = sk({ id: 'siphon', effects: [{ kind: 'damage', school: 'phys', power: 100 }, { kind: 'drain', resource: 'hp', pct: 50 }, { kind: 'damageSp', power: 50 }] })
    const c = base({ id: 'c', stats: { maxHp: 2000, maxSp: 200, str: 40, int: 40, dex: 40, spd: 40, luk: 10, def: 0, mdef: 0 }, skills: ['siphon'], rules: { rows: [{ condition: always, skillId: 'siphon' }] } })
    const foe = base({ id: 'f', stats: { maxHp: 99999, maxSp: 100, str: 60, int: 1, dex: 1, spd: 40, luk: 10, def: 0, mdef: 0 } })
    const ev = run([c], [foe], book(s))
    expect(ev.some((e) => e.t === 'heal' && e.target.team === 0 && e.source.team === 0)).toBe(true)
    expect(ev.some((e) => e.t === 'spChange' && e.target.team === 1 && e.delta < 0)).toBe(true)
  })
  it('costHpPct: 사용 시 HP 를 지불한다 (1 은 남긴다)', () => {
    const s = sk({ id: 'blood', costHpPct: 10, effects: [{ kind: 'damage', school: 'phys', power: 100 }] })
    const c = base({ id: 'c', skills: ['blood'], rules: { rows: [{ condition: always, skillId: 'blood' }] } })
    const ev = run([c], [wall()], book(s))
    const self = ev.find((e) => e.t === 'damage' && e.source.team === 0 && e.target.team === 0)
    expect(self && self.t === 'damage' && self.amount).toBe(200)
  })
  it('게이지 지연 누적 상한: 1500 을 넘는 지연은 무시된다', () => {
    const push = sk({ id: 'push', effects: [{ kind: 'modifyGauge', delta: -500 }] })
    const c = base({ id: 'c', stats: { maxHp: 2000, maxSp: 200, str: 40, int: 40, dex: 40, spd: 90, luk: 10, def: 0, mdef: 0 }, skills: ['push'], rules: { rows: [{ condition: always, skillId: 'push' }] } })
    const ev = run([c], [wall()], book(push))
    const deltas = ev.filter((e) => e.t === 'gaugeShift' && e.target.team === 1).map((e) => (e.t === 'gaugeShift' ? e.delta : 0))
    expect(deltas.reduce((a, b) => a + b, 0)).toBe(-1500)
    expect(deltas.slice(3).every((d) => d === 0)).toBe(true)
  })
})

describe('특성', () => {
  it('quickCast: 같은 시간 안에 더 많은 시전을 끝낸다', () => {
    const resolved = (traits?: string[]) => {
      const c = base({ id: 'c', row: 'back', traits, stats: { maxHp: 99999, maxSp: 9999, str: 5, int: 60, dex: 0, spd: 40, luk: 10, def: 0, mdef: 0 }, skills: ['inferno'], rules: { rows: [{ condition: always, skillId: 'inferno' }] } })
      const foe = wall('w', { stats: { maxHp: 999999, maxSp: 0, str: 1, int: 1, dex: 1, spd: 40, luk: 10, def: 0, mdef: 0 } })
      const r = simulate({ seed: 1, teams: [{ name: 'A', members: [c] }, { name: 'B', members: [foe] }], config: { ...DEFAULT_CONFIG, maxActions: 200, maxExtends: 0 }, skills: SKILLS })
      return r.events.filter((e) => e.t === 'castResolve' && e.actor.team === 0).length
    }
    expect(resolved(['quickCast'])).toBeGreaterThan(resolved())
  })
  it('eager: 첫 행동이 먼저 온다', () => {
    const a = base({ id: 'a', traits: ['eager'] })
    const b = base({ id: 'b' })
    const ev = run([a], [b])
    const first = ev.find((e) => e.t === 'turnBegin')
    expect(first && first.t === 'turnBegin' && first.actor.team).toBe(0)
  })
  it('extraPattern: INT 5 라도 5번째 패턴이 평가된다', () => {
    const rows = [...[0, 1, 2, 3].map(() => ({ condition: { op: 'atom' as const, atom: { kind: 'selfHpPct' as const, cmp: 'lte' as const, value: 0 } }, skillId: 'strike' })), { condition: always, skillId: 'warCry' }]
    const stats = { maxHp: 2000, maxSp: 200, str: 40, int: 5, dex: 40, spd: 40, luk: 10, def: 0, mdef: 0 }
    const without = run([base({ id: 'n', stats, skills: ['strike', 'warCry'], rules: { rows } })], [wall()])
    const withT = run([base({ id: 't', stats, traits: ['extraPattern'], skills: ['strike', 'warCry'], rules: { rows } })], [wall()])
    expect(without.some((e) => e.t === 'ruleFired' && e.skillId === 'warCry')).toBe(false)
    expect(withT.some((e) => e.t === 'ruleFired' && e.skillId === 'warCry')).toBe(true)
  })
  it('secondWind: HP 30% 이하로 맞으면 전투당 1회 회복', () => {
    const c = base({ id: 'c', traits: ['secondWind'], stats: { maxHp: 300, maxSp: 0, str: 1, int: 40, dex: 1, spd: 20, luk: 10, def: 0, mdef: 0 } })
    const foe = base({ id: 'f', stats: { maxHp: 99999, maxSp: 0, str: 40, int: 1, dex: 1, spd: 60, luk: 10, def: 0, mdef: 0 } })
    const ev = run([c], [foe])
    expect(ev.filter((e) => e.t === 'traitTrigger' && e.traitId === 'secondWind').length).toBe(1)
  })
  it('regen: 매 차례 시작에 회복', () => {
    const c = base({ id: 'c', traits: ['regen'], stats: { maxHp: 2000, maxSp: 0, str: 1, int: 40, dex: 1, spd: 40, luk: 10, def: 0, mdef: 0 } })
    const foe = base({ id: 'f', stats: { maxHp: 99999, maxSp: 0, str: 30, int: 1, dex: 1, spd: 40, luk: 10, def: 0, mdef: 0 } })
    const ev = run([c], [foe])
    expect(ev.filter((e) => e.t === 'traitTrigger' && e.traitId === 'regen').length).toBeGreaterThan(3)
  })
  it('bulwark: 엄호로 대신 맞을 때만 피해가 준다', () => {
    const tank = (traits?: string[]) => base({ id: 't', traits, guard: { mode: 'always' }, stats: { maxHp: 99999, maxSp: 0, str: 1, int: 1, dex: 1, spd: 5, luk: 10, def: 0, mdef: 0 } })
    const squishy = base({ id: 's', row: 'back', stats: { maxHp: 99999, maxSp: 0, str: 1, int: 1, dex: 1, spd: 5, luk: 10, def: 0, mdef: 0 } })
    const archer = base({ id: 'a' })
    const covered = (traits?: string[]) => {
      const ev = run([archer], [tank(traits), squishy], SKILLS, 3)
      const i = ev.findIndex((e) => e.t === 'cover')
      const d = ev.slice(i).find((e) => e.t === 'damage')
      return d && d.t === 'damage' ? d.amount : -1
    }
    expect(covered(['bulwark'])).toBeLessThan(covered())
  })
})

describe('능력치 조건', () => {
  it('selfStat 은 자신의 스탯을 비교한다', () => {
    const rules = { rows: [{ condition: { op: 'atom' as const, atom: { kind: 'selfStat' as const, stat: 'str' as const, cmp: 'gte' as const, value: 50 } }, skillId: 'warCry' }, { condition: always, skillId: 'strike' }] }
    const weak = run([base({ id: 'w', skills: ['warCry', 'strike'], rules })], [wall()])
    const strong = run([base({ id: 's', stats: { maxHp: 2000, maxSp: 200, str: 60, int: 40, dex: 40, spd: 40, luk: 10, def: 0, mdef: 0 }, skills: ['warCry', 'strike'], rules })], [wall()])
    expect(weak.some((e) => e.t === 'ruleFired' && e.skillId === 'warCry')).toBe(false)
    expect(strong.some((e) => e.t === 'ruleFired' && e.skillId === 'warCry')).toBe(true)
  })
})
