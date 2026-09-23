// 제로식 판정 목록에서 채택한 조건 5종 + 능력치 조건의 방어 확장 (docs/11 §5.6).
import { describe, expect, it } from 'vitest'
import { DEFAULT_CONFIG, SKILLS, simulate } from '../src'
import type { BattleEvent, CharSetup, Condition, ConditionAtom } from '../src'

const always: Condition = { op: 'always' }
const atom = (a: ConditionAtom): Condition => ({ op: 'atom', atom: a })

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

/** 조건이 참이면 마력탄(선딜 없음), 아니면 strike — 어느 쪽이 발동했는지로 조건을 검증 */
function firedSkills(cond: Condition, self: Partial<CharSetup> = {}, allies: CharSetup[] = [], foes: CharSetup[] = [dummy({ id: 'foe' })]): string[] {
  const me = dummy({
    id: 'me',
    skills: ['strike', 'bolt'],
    stats: { maxHp: 400, maxSp: 500, str: 40, int: 40, dex: 30, spd: 40, luk: 10, def: 5, mdef: 5 },
    rules: { rows: [{ condition: cond, skillId: 'bolt' }, { condition: always, skillId: 'strike' }] },
    ...self,
  })
  const ev = simulate({ seed: 3, teams: [{ name: 'A', members: [me, ...allies] }, { name: 'B', members: foes }], config: DEFAULT_CONFIG, skills: SKILLS }).events
  return ev.filter((e): e is Extract<BattleEvent, { t: 'ruleFired' }> => e.t === 'ruleFired' && e.actor.team === 0 && e.actor.index === 0).map((e) => e.skillId)
}

describe('제로식에서 채택한 조건', () => {
  it('teamAnyHpPct — 적 중 HP 100% 이상인 자가 있으면(첫 턴) 참', () => {
    const fired = firedSkills(atom({ kind: 'teamAnyHpPct', side: 'enemy', cmp: 'gte', value: 100 }))
    expect(fired[0]).toBe('bolt')
  })

  it('teamAnyHpAbs — 적 HP 절대값 조건. 400 이상은 참, 401 이상은 거짓', () => {
    expect(firedSkills(atom({ kind: 'teamAnyHpAbs', side: 'enemy', cmp: 'gte', value: 400 }))[0]).toBe('bolt')
    expect(firedSkills(atom({ kind: 'teamAnyHpAbs', side: 'enemy', cmp: 'gte', value: 401 }))[0]).toBe('strike')
  })

  it('teamAnySpPct — 아군 중 SP 100% 이하인 자(자신 포함)가 있으면 참', () => {
    expect(firedSkills(atom({ kind: 'teamAnySpPct', side: 'ally', cmp: 'lte', value: 100 }))[0]).toBe('bolt')
    expect(firedSkills(atom({ kind: 'teamAnySpPct', side: 'ally', cmp: 'lte', value: 0 }))[0]).toBe('strike')
  })

  it('teamAvgSpPct — 평균 SP 는 100% 에서 시작한다', () => {
    expect(firedSkills(atom({ kind: 'teamAvgSpPct', side: 'ally', cmp: 'gte', value: 100 }))[0]).toBe('bolt')
    expect(firedSkills(atom({ kind: 'teamAvgSpPct', side: 'enemy', cmp: 'lte', value: 99 }))[0]).toBe('strike')
  })

  it('selfActionEvery — 3회째마다: 3·6번째 행동에서만 참', () => {
    const fired = firedSkills(atom({ kind: 'selfActionEvery', value: 3 }), {}, [], [dummy({ id: 'tank', stats: { maxHp: 9000, maxSp: 50, str: 1, int: 1, dex: 1, spd: 40, luk: 10, def: 5, mdef: 5 } })])
    // 1,2 → strike / 3 → bolt / 4,5 → strike / 6 → bolt
    expect(fired.slice(0, 6)).toEqual(['strike', 'strike', 'bolt', 'strike', 'strike', 'bolt'])
  })

  it('selfActionEvery 0 은 절대 참이 아니다', () => {
    expect(firedSkills(atom({ kind: 'selfActionEvery', value: 0 })).every((s) => s === 'strike')).toBe(true)
  })

  it('selfStat 이 방어(def)·마법 방어(mdef)도 비교한다', () => {
    expect(firedSkills(atom({ kind: 'selfStat', stat: 'def', cmp: 'gte', value: 5 }))[0]).toBe('bolt')
    expect(firedSkills(atom({ kind: 'selfStat', stat: 'mdef', cmp: 'gte', value: 6 }))[0]).toBe('strike')
  })
})
