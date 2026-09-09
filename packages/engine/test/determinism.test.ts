// §3.1 골든 테스트: 같은 입력 → 바이트 단위로 동일한 이벤트.
import { describe, expect, it } from 'vitest'
import { DEFAULT_CONFIG, SKILLS, TEAMS, simulate } from '../src'
import type { BattleInput } from '../src'

function input(seed: number, a = 'balanced', b = 'rush'): BattleInput {
  return { seed, teams: [TEAMS[a](), TEAMS[b]()], config: DEFAULT_CONFIG, skills: SKILLS }
}

describe('determinism', () => {
  it('같은 시드로 100회 실행하면 결과가 전부 동일하다', () => {
    const first = JSON.stringify(simulate(input(42)))
    for (let i = 0; i < 100; i++) {
      expect(JSON.stringify(simulate(input(42)))).toBe(first)
    }
  })

  it('입력 객체를 변경하지 않는다', () => {
    const inp = input(7)
    const before = JSON.stringify(inp)
    simulate(inp)
    expect(JSON.stringify(inp)).toBe(before)
  })

  it('다른 시드는 (대체로) 다른 로그를 만든다', () => {
    const a = JSON.stringify(simulate(input(1)).events)
    const b = JSON.stringify(simulate(input(2)).events)
    expect(a).not.toBe(b)
  })

  it('모든 팀 조합이 무승부 아닌 결과로 끝난다 (밸런스 스모크)', () => {
    const names = Object.keys(TEAMS)
    let decided = 0
    let total = 0
    for (const a of names)
      for (const b of names)
        for (let seed = 1; seed <= 5; seed++) {
          const r = simulate(input(seed, a, b))
          total++
          if (r.outcome !== 'draw') decided++
          expect(r.events.at(-1)?.t).toBe('battleEnd')
        }
    // 절반 이상은 결착이 나야 한다. 이 수치는 튜닝 대상이며 실패하면 config/스킬 수치를 볼 것.
    expect(decided / total).toBeGreaterThan(0.5)
  })
})
