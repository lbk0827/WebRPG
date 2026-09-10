// 이벤트 재생기 + 타임라인 렌더러. 결과(BattleResult)만 받는다 — 자유 전투와 훈련 과제가 공유.
// M2 의 스테이지 렌더러는 이 컴포넌트의 cursor 위에 얹는다 (docs/06 §4).
import { useEffect, useMemo, useRef, useState } from 'react'
import type { BattleEvent, BattleResult } from '@webrpg/engine'
import { describeEvent, jobIcon, outcomeText, skillLabel, statusLabel, type Names } from '../lib/labels'
import { rosterAt, turnStarts, type RosterChar } from '../lib/roster'

interface Props {
  result: BattleResult
  names: Names
  jobs: [string[], string[]]
  autoPlay?: boolean
}

const SPEEDS = [
  { label: '느리게', ms: 1400 },
  { label: '보통', ms: 700 },
  { label: '빠르게', ms: 250 },
]

export function Replay({ result, names, jobs, autoPlay = true }: Props) {
  const [cursor, setCursor] = useState(1)
  const [playing, setPlaying] = useState(autoPlay)
  const [speed, setSpeed] = useState(1)
  const logRef = useRef<HTMLDivElement>(null)
  const starts = useMemo(() => turnStarts(result.events), [result])

  // 새 결과가 오면 처음부터
  useEffect(() => {
    setCursor(1)
    setPlaying(autoPlay)
  }, [result, autoPlay])

  useEffect(() => {
    if (!playing) return
    const id = window.setInterval(() => {
      setCursor((c) => {
        const next = starts.find((s) => s > c)
        if (next === undefined) {
          setPlaying(false)
          return result.events.length
        }
        return next + 1
      })
    }, SPEEDS[speed].ms)
    return () => window.clearInterval(id)
  }, [playing, speed, result, starts])

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight })
  }, [cursor])

  const roster = useMemo(() => rosterAt(result.events, cursor), [result, cursor])
  if (!roster) return null

  const step = (d: -1 | 1) => {
    setPlaying(false)
    if (d === 1) {
      const next = starts.find((s) => s > cursor - 1)
      setCursor(next === undefined ? result.events.length : next + 1)
    } else {
      const prev = [...starts].reverse().find((s) => s < cursor - 1)
      setCursor(prev === undefined ? 1 : prev + 1)
    }
  }
  const turnNo = starts.filter((s) => s < cursor).length
  const finished = cursor >= result.events.length

  return (
    <div className="replay">
      <div className="stage">
        <Team side={0} chars={roster[0]} jobs={jobs[0]} />
        <div className="vs">
          <div className="turn">{finished ? outcomeText(result.outcome) : `${turnNo}번째 행동`}</div>
          {finished && <div className="sub">총 {result.actionCount}회 행동</div>}
        </div>
        <Team side={1} chars={roster[1]} jobs={jobs[1]} />
      </div>

      <div className="player-bar">
        <button onClick={() => { setPlaying(false); setCursor(1) }} title="처음으로">|◀</button>
        <button onClick={() => step(-1)} title="이전 턴">◀</button>
        <button className="primary" onClick={() => setPlaying((p) => !p)} disabled={finished}>{playing ? '일시정지' : '재생'}</button>
        <button onClick={() => step(1)} title="다음 턴">▶</button>
        <button onClick={() => { setPlaying(false); setCursor(result.events.length) }} title="끝까지">▶|</button>
        <select value={speed} onChange={(e) => setSpeed(Number(e.target.value))}>
          {SPEEDS.map((s, i) => (
            <option key={i} value={i}>{s.label}</option>
          ))}
        </select>
      </div>

      <div className="log" ref={logRef}>
        <Timeline events={result.events} cursor={cursor} names={names} />
      </div>
    </div>
  )
}

function Team({ side, chars, jobs }: { side: 0 | 1; chars: RosterChar[]; jobs: string[] }) {
  return (
    <ul className={`team t${side}`}>
      {chars.map((c, i) => (
        <li key={i} className={`${c.alive ? '' : 'dead'} ${c.row}`}>
          <img src={jobIcon(jobs[i])} alt="" width={36} height={36} />
          <div className="bars">
            <div className="name">{c.name}</div>
            <div className="bar hp"><i style={{ width: `${(c.hp / c.maxHp) * 100}%` }} /></div>
            <div className="bar sp"><i style={{ width: `${c.maxSp ? (c.sp / c.maxSp) * 100 : 0}%` }} /></div>
            <div className="tags">
              {c.casting && <span className="tag cast">{skillLabel(c.casting)} 시전중</span>}
              {c.statuses.map((s) => (
                <span key={s} className="tag">{statusLabel(s)}</span>
              ))}
            </div>
          </div>
        </li>
      ))}
    </ul>
  )
}

function Timeline({ events, cursor, names }: { events: BattleEvent[]; cursor: number; names: Names }) {
  const blocks: { actor: string; team: 0 | 1; lines: { kind: string; text: string }[] }[] = []
  for (let i = 1; i < Math.min(cursor, events.length); i++) {
    const e = events[i]
    if (e.t === 'turnBegin') {
      blocks.push({ actor: names[e.actor.team][e.actor.index], team: e.actor.team, lines: [] })
      continue
    }
    if (e.t === 'statusReport' || e.t === 'battleEnd' || e.t === 'battleStart') continue
    const line = describeEvent(e, names)
    if (line && blocks.length) blocks[blocks.length - 1].lines.push(line)
  }
  return (
    <ol className="timeline">
      {blocks.map((b, i) => (
        <li key={i} className={`t${b.team}`}>
          <div className="actor">{b.team === 1 ? '적 ' : ''}{b.actor}</div>
          <ul>
            {b.lines.map((l, j) => (
              <li key={j} className={l.kind}>{l.text}</li>
            ))}
          </ul>
        </li>
      ))}
    </ol>
  )
}
