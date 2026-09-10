// 전투 스테이지 렌더러 (docs/06 §4). 재생기의 cursor 가 가리키는 "현재 턴"의 이벤트를 연출로 바꾼다.
// 상태(HP/SP/생사)는 roster 에서, 연출(돌진·피격·팝업·말풍선)은 현재 턴의 이벤트 슬라이스에서 나온다.
import { useMemo, type CSSProperties } from 'react'
import type { BattleEvent, CharRef } from '@webrpg/engine'
import { jobIcon, skillLabel, statusLabel } from '../lib/labels'
import type { Roster, RosterChar } from '../lib/roster'

interface Props {
  events: BattleEvent[]
  cursor: number
  roster: Roster
  jobs: [string[], string[]]
  turnMs: number
  headline: string
  sub?: string
}

interface Popup {
  text: string
  kind: 'dmg' | 'heal' | 'block' | 'status' | 'interrupt' | 'revive' | 'cover' | 'sp'
}

interface Fx {
  actor?: CharRef
  lunge: boolean
  bubble?: { text: string; kind: 'fired' | 'exhausted' | 'cast' | 'resolve' | 'failed' }
  popups: Map<string, Popup[]>
  hit: Set<string>
}

const key = (r: CharRef): string => `${r.team}:${r.index}`

function currentTurnFx(events: BattleEvent[], cursor: number): Fx {
  const end = Math.min(cursor, events.length)
  let start = -1
  for (let i = end - 1; i >= 1; i--) {
    if (events[i].t === 'turnBegin') {
      start = i
      break
    }
  }
  const fx: Fx = { lunge: false, popups: new Map(), hit: new Set() }
  if (start < 0) return fx

  const push = (r: CharRef, p: Popup) => {
    const k = key(r)
    const list = fx.popups.get(k) ?? []
    list.push(p)
    fx.popups.set(k, list)
  }

  for (let i = start; i < end; i++) {
    const e = events[i]
    switch (e.t) {
      case 'turnBegin':
        fx.actor = e.actor
        break
      case 'ruleFired':
        fx.bubble = { text: `${e.ruleIndex + 1}번 조항 · ${skillLabel(e.skillId)}`, kind: 'fired' }
        break
      case 'ruleExhausted':
        fx.bubble = { text: '…우물쭈물', kind: 'exhausted' }
        break
      case 'skillFailed':
        if (!fx.bubble) fx.bubble = { text: `${skillLabel(e.skillId)} 불가`, kind: 'failed' }
        break
      case 'castStart':
        fx.bubble = { text: `${skillLabel(e.skillId)} 시전…`, kind: 'cast' }
        break
      case 'castResolve':
        fx.bubble = { text: `${skillLabel(e.skillId)} 발동!`, kind: 'resolve' }
        fx.lunge = true
        break
      case 'damage':
        fx.lunge = true
        if (e.nullified) push(e.target, { text: '막음', kind: 'block' })
        else {
          push(e.target, { text: `-${e.amount}`, kind: 'dmg' })
          fx.hit.add(key(e.target))
        }
        break
      case 'heal':
        fx.lunge = true
        push(e.target, { text: `+${e.amount}`, kind: 'heal' })
        break
      case 'spChange':
        if (e.delta > 0) {
          fx.lunge = true
          push(e.target, { text: `SP +${e.delta}`, kind: 'sp' })
        }
        break
      case 'statusTick':
        push(e.target, { text: `-${e.amount} ${statusLabel(e.status)}`, kind: 'status' })
        fx.hit.add(key(e.target))
        break
      case 'statusApply':
        fx.lunge = true
        push(e.target, { text: `[${statusLabel(e.status)}]`, kind: 'status' })
        break
      case 'castInterrupted':
        push(e.target, { text: '끊김!', kind: 'interrupt' })
        fx.hit.add(key(e.target))
        break
      case 'cover':
        push(e.defender, { text: '엄호', kind: 'cover' })
        break
      case 'gaugeShift':
        fx.lunge = true
        push(e.target, { text: e.delta < 0 ? '지연' : '가속', kind: 'status' })
        break
      case 'revive':
        fx.lunge = true
        push(e.target, { text: '소생!', kind: 'revive' })
        break
      default:
        break
    }
  }
  return fx
}

export function Stage({ events, cursor, roster, jobs, turnMs, headline, sub }: Props) {
  const fx = useMemo(() => currentTurnFx(events, cursor), [events, cursor])
  const style = { '--turn-ms': `${turnMs}ms` } as CSSProperties

  return (
    <div className="arena" style={style}>
      <Side team={0} chars={roster[0]} jobs={jobs[0]} fx={fx} cursor={cursor} />
      <div className="center">
        <div className="headline">{headline}</div>
        {sub && <div className="sub">{sub}</div>}
      </div>
      <Side team={1} chars={roster[1]} jobs={jobs[1]} fx={fx} cursor={cursor} />
    </div>
  )
}

function Side({ team, chars, jobs, fx, cursor }: { team: 0 | 1; chars: RosterChar[]; jobs: string[]; fx: Fx; cursor: number }) {
  const col = (row: 'front' | 'back') => (
    <div className={`col ${row}`}>
      {chars.map((c, i) =>
        c.row === row ? <Char key={i} team={team} index={i} c={c} job={jobs[i]} fx={fx} cursor={cursor} /> : null,
      )}
    </div>
  )
  return (
    <div className={`side t${team}`}>
      {col('back')}
      {col('front')}
    </div>
  )
}

function Char({ team, index, c, job, fx, cursor }: { team: 0 | 1; index: number; c: RosterChar; job: string; fx: Fx; cursor: number }) {
  const k = `${team}:${index}`
  const isActor = fx.actor !== undefined && fx.actor.team === team && fx.actor.index === index
  const popups = fx.popups.get(k) ?? []
  const cls = ['char', c.alive ? '' : 'dead', isActor && fx.lunge && c.alive ? 'acting' : '', fx.hit.has(k) && c.alive ? 'hit' : '', c.casting ? 'casting' : '']
    .filter(Boolean)
    .join(' ')

  return (
    <div className={cls}>
      {isActor && fx.bubble && (
        <div key={`b${cursor}`} className={`bubble ${fx.bubble.kind}`}>{fx.bubble.text}</div>
      )}
      <div className="sprite">
        <img src={jobIcon(job)} alt="" />
        {c.casting && c.alive && <span className="castmark">{skillLabel(c.casting)}</span>}
      </div>
      <div className="nm">{c.name}</div>
      <div className="bar hp"><i style={{ width: `${(c.hp / c.maxHp) * 100}%` }} /></div>
      <div className="bar sp"><i style={{ width: `${c.maxSp ? (c.sp / c.maxSp) * 100 : 0}%` }} /></div>
      {c.statuses.length > 0 && c.alive && (
        <div className="tags">{c.statuses.map((s) => <span key={s} className="tag">{statusLabel(s)}</span>)}</div>
      )}
      <div key={`p${cursor}`} className="popups">
        {popups.map((p, i) => (
          <span key={i} className={`popup ${p.kind}`} style={{ animationDelay: `${i * 140}ms` }}>{p.text}</span>
        ))}
      </div>
    </div>
  )
}
