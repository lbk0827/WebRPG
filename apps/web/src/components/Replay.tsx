// 이벤트 재생기 + 렌더러 2종(스테이지, 타임라인). 결과(BattleResult)만 받는다 — 자유 전투와 훈련 과제가 공유.
// cursor 는 "다음 턴의 turnBegin 인덱스" (exclusive). events[1..cursor-1] 이 완결된 턴들이다.
import { useEffect, useMemo, useRef, useState } from 'react'
import type { BattleEvent, BattleResult } from '@webrpg/engine'
import { describeEvent, outcomeText, type Names } from '../lib/labels'
import { rosterAt, turnStarts } from '../lib/roster'
import { Stage } from './Stage'

interface Props {
  result: BattleResult
  names: Names
  jobs: [string[], string[]]
  autoPlay?: boolean
}

const SPEEDS = [
  { label: '느리게', ms: 1600 },
  { label: '보통', ms: 900 },
  { label: '빠르게', ms: 350 },
]

export function Replay({ result, names, jobs, autoPlay = true }: Props) {
  const starts = useMemo(() => turnStarts(result.events), [result])
  const [cursor, setCursor] = useState(1)
  const [playing, setPlaying] = useState(autoPlay)
  const [speed, setSpeed] = useState(1)
  const [showLog, setShowLog] = useState(false)
  const logRef = useRef<HTMLDivElement>(null)
  const len = result.events.length

  const nextCursor = (c: number): number => starts.find((s) => s > c) ?? len
  const prevCursor = (c: number): number => {
    const prev = [...starts].reverse().find((s) => s < c)
    return prev === undefined ? 1 : prev
  }

  useEffect(() => {
    setCursor(1)
    setPlaying(autoPlay)
  }, [result, autoPlay])

  useEffect(() => {
    if (!playing) return
    const id = window.setInterval(() => {
      setCursor((c) => {
        if (c >= len) {
          setPlaying(false)
          return c
        }
        return nextCursor(c)
      })
    }, SPEEDS[speed].ms)
    return () => window.clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, speed, result])

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight })
  }, [cursor, showLog])

  const roster = useMemo(() => rosterAt(result.events, cursor), [result, cursor])
  if (!roster) return null

  const turnNo = starts.filter((s) => s < cursor).length
  const finished = cursor >= len
  const step = (d: -1 | 1) => {
    setPlaying(false)
    setCursor((c) => (d === 1 ? nextCursor(c) : prevCursor(c)))
  }

  return (
    <div className="replay">
      <Stage
        events={result.events}
        cursor={cursor}
        roster={roster}
        jobs={jobs}
        turnMs={SPEEDS[speed].ms}
        headline={finished ? outcomeText(result.outcome) : turnNo === 0 ? '출전' : `${turnNo}번째 행동`}
        sub={finished ? `총 ${result.actionCount}회 행동` : undefined}
      />

      <div className="player-bar">
        <button onClick={() => { setPlaying(false); setCursor(1) }} title="처음으로">|◀</button>
        <button onClick={() => step(-1)} title="이전 턴">◀</button>
        <button className="primary" onClick={() => setPlaying((p) => !p)} disabled={finished}>{playing ? '일시정지' : '재생'}</button>
        <button onClick={() => step(1)} title="다음 턴">▶</button>
        <button onClick={() => { setPlaying(false); setCursor(len) }} title="끝까지">▶|</button>
        <select value={speed} onChange={(e) => setSpeed(Number(e.target.value))}>
          {SPEEDS.map((s, i) => (
            <option key={i} value={i}>{s.label}</option>
          ))}
        </select>
        <button className={showLog ? 'on' : ''} onClick={() => setShowLog((v) => !v)} title="전황 보고서">보고서</button>
      </div>

      {showLog && (
        <div className="log" ref={logRef}>
          <Timeline events={result.events} cursor={cursor} names={names} />
        </div>
      )}
    </div>
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
