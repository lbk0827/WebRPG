// 전황 보고서 (2026-09-12 단장 지시로 상세화).
//
// 제로식 전투 로그의 강점을 가져온다 — **숫자를 전부 남긴다**.
//   · 타격마다 한 줄. `1046 피해 → 상대 (990 → −56)` 처럼 **HP 전/후**를 같이 적는다.
//     지금까지 우리는 "112 피해"만 적어서 "얼마나 아슬아슬했나"를 알 수 없었다
//   · 라운드마다 **판세 스냅샷** — 양 팀 HP/SP 를 다시 찍는다 (엔진의 statusReport)
//   · 맨 위에 양 팀 요약 (인원 · Lv 합 · 총 HP)
//
// 그쪽에 없는 것을 더한다 (docs/11 §3 의 3번 — 그쪽은 200턴이면 세로 13,000px 에 요약도 검색도 없다):
//   · **행동 번호**와 접기
//   · **필터** — 우리만 / 피해와 사망만
//   · **단원별 합계** — 준 피해 · 받은 피해 · 우물쭈물 횟수
import { useMemo, useState } from 'react'
import type { BattleEvent, BattleResult } from '@webrpg/engine'
import { describeEvent, skillLabel, statusLabel, type Names } from '../lib/labels'

type Side = 'all' | 'us' | 'them'
type Kind = 'all' | 'hits'

interface Line {
  kind: string
  text: string
}

interface Block {
  no: number
  actor: string
  team: 0 | 1
  skill?: string
  lines: Line[]
}

interface Snap {
  at: number
  teams: [{ name: string; hp: number; maxHp: number; sp: number; maxSp: number }[], { name: string; hp: number; maxHp: number; sp: number; maxSp: number }[]]
}

type Item = { t: 'block'; b: Block } | { t: 'snap'; s: Snap }

/** 단원별 합계 — 제로식에는 없다. "누가 일했고 누가 맞았나"를 한 줄로 */
interface Tally {
  dealt: number
  taken: number
  healed: number
  idle: number
  kills: number
}

export function BattleLog({ result, names, upto }: { result: BattleResult; names: Names; upto?: number }) {
  const [side, setSide] = useState<Side>('all')
  const [kind, setKind] = useState<Kind>('all')
  const end = Math.min(upto ?? result.events.length, result.events.length)

  const { items, tally } = useMemo(() => build(result.events, names, end), [result, names, end])

  const shown = items.filter((it) => {
    if (it.t === 'snap') return kind === 'all'
    if (side === 'us' && it.b.team !== 0) return false
    if (side === 'them' && it.b.team !== 1) return false
    if (kind === 'hits') return it.b.lines.some((l) => l.kind === 'damage' || l.kind === 'death')
    return true
  })

  const start = result.events[0]
  const head = start && start.t === 'battleStart' ? start.teams : null

  return (
    <div className="blog">
      {head && (
        <div className="blog-head">
          {[0, 1].map((t) => {
            const team = head[t as 0 | 1]
            const hp = team.reduce((s, c) => s + c.maxHp, 0)
            return (
              <div key={t} className={`blog-team t${t}`}>
                <b>{t === 0 ? '우리' : '상대'}</b>
                <span>{team.length}명 · 총 HP {hp}</span>
                <small>{team.map((c) => c.name).join(' · ')}</small>
              </div>
            )
          })}
        </div>
      )}

      <div className="blog-tools">
        <span className="seg">
          {(['all', 'us', 'them'] as Side[]).map((s) => (
            <button key={s} className={side === s ? 'on' : ''} onClick={() => setSide(s)}>
              {s === 'all' ? '전체' : s === 'us' ? '우리' : '상대'}
            </button>
          ))}
        </span>
        <span className="seg">
          {(['all', 'hits'] as Kind[]).map((k) => (
            <button key={k} className={kind === k ? 'on' : ''} onClick={() => setKind(k)}>
              {k === 'all' ? '전부' : '피해·사망만'}
            </button>
          ))}
        </span>
        <small>{shown.filter((i) => i.t === 'block').length}회 행동</small>
      </div>

      <ol className="blog-list">
        {shown.map((it, i) =>
          it.t === 'snap' ? (
            <li key={`s${i}`} className="blog-snap">
              <div className="snap-title">{it.s.at}회 행동 뒤 판세</div>
              {[0, 1].map((t) => (
                <div key={t} className={`snap-row t${t}`}>
                  <b>{t === 0 ? '우리' : '상대'}</b>
                  {it.s.teams[t as 0 | 1].map((c, j) => (
                    <span key={j} className={c.hp <= 0 ? 'dead' : ''}>
                      {c.name} <i>{c.hp}/{c.maxHp}</i>
                    </span>
                  ))}
                </div>
              ))}
            </li>
          ) : (
            <li key={`b${i}`} className={`blog-block t${it.b.team}`}>
              <div className="blk-head">
                <span className="no">{it.b.no}</span>
                <b>{it.b.team === 1 ? '적 ' : ''}{it.b.actor}</b>
                {it.b.skill && <span className="skill">{skillLabel(it.b.skill)}</span>}
              </div>
              <ul>
                {it.b.lines.map((l, j) => (
                  <li key={j} className={l.kind}>{l.text}</li>
                ))}
              </ul>
            </li>
          ),
        )}
      </ol>

      <div className="blog-tally">
        <div className="snap-title">단원별 합계</div>
        <table>
          <thead>
            <tr><th>단원</th><th>준 피해</th><th>받은 피해</th><th>회복</th><th>쓰러뜨림</th><th>우물쭈물</th></tr>
          </thead>
          <tbody>
            {[0, 1].flatMap((t) =>
              names[t as 0 | 1].map((n, i) => {
                const k = `${t}:${i}`
                const v = tally[k]
                if (!v) return null
                return (
                  <tr key={k} className={`t${t}`}>
                    <td className="nm">{t === 1 ? '적 ' : ''}{n}</td>
                    <td>{v.dealt || ''}</td>
                    <td>{v.taken || ''}</td>
                    <td>{v.healed || ''}</td>
                    <td>{v.kills || ''}</td>
                    <td className={v.idle > 0 ? 'warn' : ''}>{v.idle || ''}</td>
                  </tr>
                )
              }),
            )}
          </tbody>
        </table>
        <p className="hint">우물쭈물은 수칙의 어느 줄도 참이 아니라 차례를 넘긴 횟수입니다. 많으면 마지막 줄에 "항상 → 기본 공격"이 없는 것입니다.</p>
      </div>
    </div>
  )
}

/** 이벤트를 걸어가며 HP 를 함께 추적한다 — 피해 줄에 전/후를 적기 위해 */
function build(events: BattleEvent[], names: Names, end: number): { items: Item[]; tally: Record<string, Tally> } {
  const start = events[0]
  if (!start || start.t !== 'battleStart') return { items: [], tally: {} }

  const hp: [number[], number[]] = [start.teams[0].map((c) => c.hp), start.teams[1].map((c) => c.hp)]
  const maxHp: [number[], number[]] = [start.teams[0].map((c) => c.maxHp), start.teams[1].map((c) => c.maxHp)]
  const tally: Record<string, Tally> = {}
  const key = (r: { team: 0 | 1; index: number }) => `${r.team}:${r.index}`
  const tal = (r: { team: 0 | 1; index: number }): Tally =>
    (tally[key(r)] ??= { dealt: 0, taken: 0, healed: 0, idle: 0, kills: 0 })
  const who = (r: { team: 0 | 1; index: number }) => `${r.team === 0 ? '' : '적 '}${names[r.team][r.index]}`

  const items: Item[] = []
  let cur: Block | null = null
  let no = 0
  let actor: { team: 0 | 1; index: number } | null = null

  const push = (l: Line) => {
    if (cur) cur.lines.push(l)
  }

  for (let i = 1; i < end; i++) {
    const e = events[i]
    switch (e.t) {
      case 'turnBegin':
        no += 1
        actor = e.actor
        cur = { no, actor: names[e.actor.team][e.actor.index], team: e.actor.team, lines: [] }
        items.push({ t: 'block', b: cur })
        tal(e.actor)
        break

      case 'ruleFired':
        if (cur) cur.skill = e.skillId
        push({ kind: 'fired', text: `${e.ruleIndex + 1}번 패턴` })
        break

      case 'ruleExhausted':
        if (actor) tal(actor).idle += 1
        push({ kind: 'exhausted', text: '수칙에 없는 상황이라 차례를 넘겼다' })
        break

      case 'damage': {
        const t = e.target
        const before = hp[t.team][t.index]
        if (e.nullified) {
          push({ kind: 'cover', text: `${who(t)}의 보호막이 막았다 (HP ${before}/${maxHp[t.team][t.index]})` })
          break
        }
        const after = before - e.amount
        hp[t.team][t.index] = Math.max(0, after)
        tal(t).taken += e.amount
        if (actor) tal(actor).dealt += e.amount
        push({
          kind: 'damage',
          text: `${e.amount} 피해 → ${who(t)} (${before} → ${after})`,
        })
        break
      }

      case 'statusTick': {
        const t = e.target
        const before = hp[t.team][t.index]
        hp[t.team][t.index] = Math.max(0, before - e.amount)
        tal(t).taken += e.amount
        push({ kind: 'damage', text: `[${statusLabel(e.status)}] ${e.amount} 피해 → ${who(t)} (${before} → ${before - e.amount})` })
        break
      }

      case 'heal': {
        const t = e.target
        const before = hp[t.team][t.index]
        const after = Math.min(maxHp[t.team][t.index], before + e.amount)
        hp[t.team][t.index] = after
        tal(t).healed += after - before
        push({ kind: 'heal', text: `${e.amount} 회복 → ${who(t)} (${before} → ${after})` })
        break
      }

      case 'death':
        hp[e.target.team][e.target.index] = 0
        if (actor && key(actor) !== key(e.target)) tal(actor).kills += 1
        push({ kind: 'death', text: `${who(e.target)} 쓰러졌다` })
        break

      case 'revive':
        hp[e.target.team][e.target.index] = e.hp
        push({ kind: 'revive', text: `${who(e.target)} 일어섰다 (HP ${e.hp})` })
        break

      case 'statusApply':
        push({
          kind: 'status',
          text: `${who(e.target)} [${statusLabel(e.status)}] ${e.duration}턴${e.magnitude ? ` · 세기 ${e.magnitude}` : ''}`,
        })
        break

      case 'statusReport':
        items.push({
          t: 'snap',
          at: e.actionCount,
          s: {
            at: e.actionCount,
            teams: [
              e.teams[0].map((c) => ({ name: c.name, hp: c.hp, maxHp: c.maxHp, sp: c.sp, maxSp: c.maxSp })),
              e.teams[1].map((c) => ({ name: c.name, hp: c.hp, maxHp: c.maxHp, sp: c.sp, maxSp: c.maxSp })),
            ],
          },
        } as Item)
        // 엔진 스냅샷으로 재동기화 (누적 오차 방지)
        for (const t of [0, 1] as const) e.teams[t].forEach((c, j) => (hp[t][j] = c.hp))
        cur = null
        break

      case 'battleStart':
      case 'battleEnd':
        break

      default: {
        const l = describeEvent(e, names)
        if (l) push(l)
        break
      }
    }
  }
  return { items, tally }
}
