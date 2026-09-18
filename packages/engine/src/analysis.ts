// 전투 결과 분석 — "왜 졌는가"를 한 줄로 말하기 위한 재료. 문장은 클라이언트가 만든다.
import type { BattleResult } from './types'

export interface TeamAnalysis {
  /** 가장 먼저 쓰러진 단원 인덱스 (없으면 -1) */
  firstDeath: number
  deaths: number[]
  exhausted: number[]
  noSp: number[]
  noTarget: number[]
  silenced: number[]
  interruptedCasts: number
  /** 이 팀이 상대 시전을 끊은 횟수 */
  interruptsMade: number
}

export interface Analysis {
  outcome: BattleResult['outcome']
  actionCount: number
  teams: [TeamAnalysis, TeamAnalysis]
}

export function analyze(result: BattleResult, sizes: [number, number]): Analysis {
  const mk = (n: number): TeamAnalysis => ({
    firstDeath: -1,
    deaths: Array(n).fill(0),
    exhausted: Array(n).fill(0),
    noSp: Array(n).fill(0),
    noTarget: Array(n).fill(0),
    silenced: Array(n).fill(0),
    interruptedCasts: 0,
    interruptsMade: 0,
  })
  const teams: [TeamAnalysis, TeamAnalysis] = [mk(sizes[0]), mk(sizes[1])]

  for (const e of result.events) {
    switch (e.t) {
      case 'death': {
        const t = teams[e.target.team]
        t.deaths[e.target.index]++
        if (t.firstDeath === -1) t.firstDeath = e.target.index
        break
      }
      case 'ruleExhausted':
        teams[e.actor.team].exhausted[e.actor.index]++
        break
      case 'skillFailed': {
        const t = teams[e.actor.team]
        if (e.reason === 'noSp') t.noSp[e.actor.index]++
        else if (e.reason === 'noRequiredTarget') t.noTarget[e.actor.index]++
        else if (e.reason === 'silenced') t.silenced[e.actor.index]++
        break
      }
      case 'castInterrupted':
        teams[e.target.team].interruptedCasts++
        teams[e.target.team === 0 ? 1 : 0].interruptsMade++
        break
      default:
        break
    }
  }
  return { outcome: result.outcome, actionCount: result.actionCount, teams }
}
