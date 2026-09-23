// INT → 최대 패턴 수 (스탯 정의 확정, 2026-09-10)
import { describe, expect, it } from 'vitest'
import { DEFAULT_CONFIG, MISSIONS, PRESETS, SKILLS, maxRuleRows, missionChar, simulate, solutionOverrides } from '../src'
import type { CharSetup, Condition } from '../src'

const always: Condition = { op: 'always' }

describe('INT → 최대 패턴 수', () => {
  it('기본 4, INT 10/20/35/50/70 마다 +1', () => {
    const st = (int: number) => ({ maxHp: 1, maxSp: 1, str: 1, int, dex: 1, spd: 1, luk: 1, def: 0, mdef: 0 })
    expect(maxRuleRows(st(5))).toBe(4)
    expect(maxRuleRows(st(10))).toBe(5)
    expect(maxRuleRows(st(34))).toBe(6)
    expect(maxRuleRows(st(62))).toBe(8)
    expect(maxRuleRows(st(99))).toBe(9)
  })

  it('한도를 넘는 패턴은 전투에서 평가되지 않는다', () => {
    const c: CharSetup = {
      id: 'c', name: 'c', row: 'front', guard: { mode: 'never' },
      stats: { maxHp: 9999, maxSp: 999, str: 30, int: 5, dex: 10, spd: 40, luk: 10, def: 0, mdef: 0 },
      skills: ['strike', 'warCry'],
      // 4개는 절대 참, 5번째(한도 밖)는 항상 → warCry. 앞 4개가 거짓이면 우물쭈물해야 한다
      rules: { rows: [
        ...[0, 1, 2, 3].map(() => ({ condition: { op: 'atom' as const, atom: { kind: 'selfHpPct' as const, cmp: 'lte' as const, value: 0 } }, skillId: 'strike' })),
        { condition: always, skillId: 'warCry' },
      ] },
    }
    const foe: CharSetup = { ...c, id: 'f', name: 'f', rules: { rows: [{ condition: always, skillId: 'strike' }] } }
    const r = simulate({ seed: 1, teams: [{ name: 'A', members: [c] }, { name: 'B', members: [foe] }], config: { ...DEFAULT_CONFIG, maxActions: 20 }, skills: SKILLS })
    expect(r.events.some((e) => e.t === 'ruleFired' && e.actor.team === 0 && e.skillId === 'warCry')).toBe(false)
    expect(r.events.some((e) => e.t === 'ruleExhausted' && e.actor.team === 0)).toBe(true)
  })

  it('프리셋 기본 수칙과 과제 정답은 전부 한도 안이다', () => {
    for (const p of Object.values(PRESETS)) expect(p.rules.rows.length, p.id).toBeLessThanOrEqual(maxRuleRows(p.stats))
    for (const m of MISSIONS) {
      const sol = solutionOverrides(m)
      m.player.forEach((mc, i) => {
        const c = missionChar(mc, i)
        const rows = sol[i]?.rules?.rows.length ?? c.rules.rows.length
        expect(rows, `${m.id} slot ${i}`).toBeLessThanOrEqual(maxRuleRows(c.stats))
      })
    }
  })
})
