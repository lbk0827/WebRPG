import { useEffect, useMemo, useRef, useState } from 'react'
import type { BattleEvent, BattleResult, TeamSetup } from '@webrpg/engine'
import { DEFAULT_CONFIG, SKILLS, simulate } from '@webrpg/engine'
import { describeEvent, jobIcon, jobOf, outcomeText, skillLabel, statusLabel, type Names } from '../lib/labels'
import { rosterAt, turnStarts, type RosterChar } from '../lib/roster'

interface Props {
  player: TeamSetup
  enemy: TeamSetup
  seed: number
  onSeed: (s: number) => void
}

const SPEEDS = [
  { label: '느리게', ms: 1400 },
  { label: '보통', ms: 700 },
  { label: '빠르게', ms: 250 },
]

export function BattleView({ player, enemy, seed, onSeed }: Props) {
  const [result, setResult] = useState<BattleResult | null>(null)
  const [cursor, setCursor] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const logRef = useRef<HTMLDivElement>(null)

  const names: Names = useMemo(() => [player.members.map((m) => m.name), enemy.members.map((m) => m.name)], [player, enemy])
  const jobs = useMemo(() => [player.members.map((m) => jobOf(m.id)), enemy.members.map((m) => jobOf(m.id))], [player, enemy])
  const starts = useMemo(() => (result ? turnStarts(result.events) : []), [result])

  const run = () => {
    const r = simulate({ seed, teams: [player, enemy], config: DEFAULT_CONFIG, skills: SKILLS })
    setResult(r)
    setCursor(starts.length ? 0 : 0)
    setCursor(1)
    setPlaying(true)
  }

  // 턴 단위 자동 재생
  useEffect(() => {
    if (!playing || !result) return
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

  const roster = useMemo(() => (result ? rosterAt(result.events, cursor) : null), [result, cursor])
  const step = (d: -1 | 1) => {
    if (!result) return
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
  const finished = result !== null && cursor >= result.events.length

  return (
    <section className="battle">
      <div className="run-bar">
        <label>시드 <input type="number" inputMode="numeric" value={seed} onChange={(e) => onSeed(Math.max(0, Math.floor(Number(e.target.value) || 0)))} /></label>
        <button className="primary" onClick={run}>전투 실행</button>
        {result && <button onClick={() => onSeed(seed + 1)} title="다른 시드로">시드 +1</button>}
      </div>

      {result && roster && (
        <>
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
        </>
      )}
      {!result && <p className="hint">편성과 수칙을 정한 뒤 <b>전투 실행</b>을 누르세요. 같은 시드는 항상 같은 결과를 냅니다.</p>}
    </section>
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
