// 훈련 과제 검증: 기본 수칙으로는 완료하지 못하고, solution 으로는 완료한다.
// 이 테스트가 통과하는 과제만 플레이어에게 나간다.
import { describe, expect, it } from 'vitest'
import { DEFAULT_CONFIG, MISSIONS, SKILLS, analyze, judgeMission, missionTeams, simulate, solutionOverrides } from '../src'
import type { Mission } from '../src'

function play(m: Mission, withSolution: boolean, seed = m.seed) {
  const teams = missionTeams(m, withSolution ? solutionOverrides(m) : {})
  const r = simulate({ seed, teams, config: DEFAULT_CONFIG, skills: SKILLS })
  const v = judgeMission(m, r)
  const a = analyze(r, [teams[0].members.length, teams[1].members.length])
  return { r, v, a }
}

const detail = (p: ReturnType<typeof play>) =>
  `결과 ${p.r.outcome} (${p.r.actionCount}행동) 판정 ${JSON.stringify(p.v)} 아군 ${JSON.stringify(p.a.teams[0])}`

describe('훈련 과제', () => {
  it('번호가 1부터 연속이고 id 가 유일하다', () => {
    MISSIONS.forEach((m, i) => expect(m.no).toBe(i + 1))
    expect(new Set(MISSIONS.map((m) => m.id)).size).toBe(MISSIONS.length)
  })

  it('편집 슬롯과 정답 수가 일치하고, 편집 슬롯이 범위 안이다', () => {
    for (const m of MISSIONS) {
      expect(m.solution.length, m.id).toBe(m.editable.length)
      for (const s of m.editable) expect(s, m.id).toBeLessThan(m.player.length)
    }
  })

  for (const m of MISSIONS) {
    describe(`과제 ${m.no}. ${m.title}`, () => {
      it('기본 수칙으로는 완료하지 못한다', () => {
        const p = play(m, false)
        expect(p.v.cleared, `기본 수칙 ${detail(p)}`).toBe(false)
      })
      it('정답 수칙으로는 완료한다', () => {
        const p = play(m, true)
        expect(p.v.cleared, `정답 ${detail(p)}`).toBe(true)
      })
      it('정답은 시드가 바뀌어도 대체로 완료한다 (10개 시드 중 7 이상)', () => {
        let ok = 0
        for (let s = 1; s <= 10; s++) if (play(m, true, m.seed + s).v.cleared) ok++
        expect(ok, `정답 완료 ${ok}/10`).toBeGreaterThanOrEqual(7)
      })
      it('기본 수칙은 시드가 바뀌어도 대체로 실패한다 (10개 시드 중 7 이상)', () => {
        let fail = 0
        for (let s = 1; s <= 10; s++) if (!play(m, false, m.seed + s).v.cleared) fail++
        expect(fail, `기본 실패 ${fail}/10`).toBeGreaterThanOrEqual(7)
      })
    })
  }
})
