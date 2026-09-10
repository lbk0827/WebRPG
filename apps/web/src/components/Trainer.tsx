import { useState } from 'react'
import type { TeamSetup } from '@webrpg/engine'
import { DEFAULT_CONFIG, SKILLS, simulate } from '@webrpg/engine'

interface Props {
  player: TeamSetup
  enemy: TeamSetup
  seed: number
}

interface Report {
  n: number
  win: number
  lose: number
  draw: number
  avgActions: number
  deaths: [number[], number[]]
  exhausted: [number[], number[]]
  interrupted: number
}

export function Trainer({ player, enemy, seed }: Props) {
  const [n, setN] = useState(100)
  const [report, setReport] = useState<Report | null>(null)
  const [busy, setBusy] = useState(false)

  const run = () => {
    setBusy(true)
    // 렌더 한 프레임 양보 후 동기 실행 (100회 ≈ 0.2s)
    window.setTimeout(() => {
      const r: Report = { n, win: 0, lose: 0, draw: 0, avgActions: 0, deaths: [[0, 0, 0, 0, 0], [0, 0, 0, 0, 0]], exhausted: [[0, 0, 0, 0, 0], [0, 0, 0, 0, 0]], interrupted: 0 }
      let actions = 0
      for (let i = 0; i < n; i++) {
        const res = simulate({ seed: seed + i, teams: [player, enemy], config: DEFAULT_CONFIG, skills: SKILLS })
        if (res.outcome === 'team0') r.win++
        else if (res.outcome === 'team1') r.lose++
        else r.draw++
        actions += res.actionCount
        for (const e of res.events) {
          if (e.t === 'death') r.deaths[e.target.team][e.target.index]++
          else if (e.t === 'ruleExhausted') r.exhausted[e.actor.team][e.actor.index]++
          else if (e.t === 'castInterrupted') r.interrupted++
        }
      }
      r.avgActions = actions / n
      setReport(r)
      setBusy(false)
    }, 16)
  }

  return (
    <section className="trainer">
      <p className="hint">행동력 소모 없이 <b>{n}회</b> 연속 대전합니다. 시드 {seed}부터 {seed + n - 1}까지. 승률로 수칙을 검증하세요.</p>
      <div className="run-bar">
        <select value={n} onChange={(e) => setN(Number(e.target.value))}>
          <option value={30}>30회</option>
          <option value={100}>100회</option>
          <option value={300}>300회</option>
        </select>
        <button className="primary" onClick={run} disabled={busy}>{busy ? '훈련 중…' : '훈련 시작'}</button>
      </div>

      {report && (
        <div className="report">
          <div className="big">
            <span className="rate">{Math.round((report.win / report.n) * 100)}%</span>
            <span>승 {report.win} · 패 {report.lose} · 무 {report.draw} · 평균 {report.avgActions.toFixed(0)}회 행동</span>
          </div>
          <h3>사망 빈도 <small>({report.n}회 중)</small></h3>
          <DeathTable team={player} counts={report.deaths[0]} exhausted={report.exhausted[0]} n={report.n} />
          <h3>상대 <small>사망 빈도</small></h3>
          <DeathTable team={enemy} counts={report.deaths[1]} exhausted={report.exhausted[1]} n={report.n} />
          <p className="hint">시전 끊김 {report.interrupted}회. <b>우물쭈물</b>이 많은 단원은 fallback 패턴(항상 → 기본 공격)이 없거나 SP 게이팅이 잘못된 것입니다.</p>
        </div>
      )}
    </section>
  )
}

function DeathTable({ team, counts, exhausted, n }: { team: TeamSetup; counts: number[]; exhausted: number[]; n: number }) {
  return (
    <table className="deaths">
      <tbody>
        {team.members.map((m, i) => (
          <tr key={i}>
            <td className="nm">{m.name}</td>
            <td className="bar"><i style={{ width: `${(counts[i] / n) * 100}%` }} /></td>
            <td className="ct">{counts[i]}</td>
            <td className="ex">{exhausted[i] > 0 ? `우물쭈물 ${exhausted[i]}` : ''}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
