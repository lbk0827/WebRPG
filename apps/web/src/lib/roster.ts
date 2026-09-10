// 이벤트 로그를 커서까지 접어 각 단원의 현재 상태를 복원한다.
// 재생기는 이 함수 하나로 "지금 이 시점의 전황"을 그린다 — 렌더러가 바뀌어도 그대로 쓴다.
import type { BattleEvent, StatusId } from '@webrpg/engine'

export interface RosterChar {
  id: string
  name: string
  hp: number
  maxHp: number
  sp: number
  maxSp: number
  alive: boolean
  row: 'front' | 'back'
  casting?: string
  statuses: StatusId[]
}

export type Roster = [RosterChar[], RosterChar[]]

export function rosterAt(events: BattleEvent[], cursor: number): Roster | null {
  const start = events[0]
  if (!start || start.t !== 'battleStart') return null

  const roster: Roster = [fromSnapshot(start.teams[0]), fromSnapshot(start.teams[1])]
  const get = (r: { team: 0 | 1; index: number }): RosterChar => roster[r.team][r.index]

  const end = Math.min(cursor, events.length)
  for (let i = 1; i < end; i++) {
    const e = events[i]
    switch (e.t) {
      case 'damage':
        get(e.target).hp = Math.max(0, get(e.target).hp - e.amount)
        break
      case 'statusTick':
        get(e.target).hp = Math.max(0, get(e.target).hp - e.amount)
        break
      case 'heal':
        get(e.target).hp = Math.min(get(e.target).maxHp, get(e.target).hp + e.amount)
        break
      case 'spChange':
        get(e.target).sp = Math.max(0, Math.min(get(e.target).maxSp, get(e.target).sp + e.delta))
        break
      case 'death': {
        const c = get(e.target)
        c.alive = false
        c.hp = 0
        c.casting = undefined
        c.statuses = []
        break
      }
      case 'revive': {
        const c = get(e.target)
        c.alive = true
        c.hp = e.hp
        break
      }
      case 'castStart':
        get(e.actor).casting = e.skillId
        break
      case 'castResolve':
        get(e.actor).casting = undefined
        break
      case 'castInterrupted':
        get(e.target).casting = undefined
        break
      case 'statusApply': {
        const c = get(e.target)
        if (!c.statuses.includes(e.status)) c.statuses.push(e.status)
        break
      }
      case 'statusExpire': {
        const c = get(e.target)
        c.statuses = c.statuses.filter((s) => s !== e.status)
        break
      }
      case 'statusReport':
        // 엔진 스냅샷으로 재동기화 — 누적 오차 방지
        roster[0] = fromSnapshot(e.teams[0])
        roster[1] = fromSnapshot(e.teams[1])
        break
      default:
        break
    }
  }
  return roster
}

function fromSnapshot(team: { id: string; name: string; hp: number; maxHp: number; sp: number; maxSp: number; alive: boolean; row: 'front' | 'back'; casting?: string; statuses: { id: StatusId }[] }[]): RosterChar[] {
  return team.map((c) => ({
    id: c.id,
    name: c.name,
    hp: c.hp,
    maxHp: c.maxHp,
    sp: c.sp,
    maxSp: c.maxSp,
    alive: c.alive,
    row: c.row,
    casting: c.casting,
    statuses: c.statuses.map((s) => s.id),
  }))
}

/** turnBegin 이벤트의 인덱스 목록 — 재생기의 "턴 단위 이동"에 쓴다 */
export function turnStarts(events: BattleEvent[]): number[] {
  const out: number[] = []
  events.forEach((e, i) => {
    if (e.t === 'turnBegin') out.push(i)
  })
  return out
}
