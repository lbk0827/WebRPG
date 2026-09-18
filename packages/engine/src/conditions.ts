// 조건식 평가 (§5). 순수 함수 — 상태를 바꾸지 않는다. 단 chance 는 rng 를 소비한다.
import type { Cmp, Condition, ConditionAtom, Side } from './types'
import type { BattleState, CharState } from './state'
import { enemiesOf, hasStatus, hpPct, isCasting, spPct, teamOf } from './state'

const MAX_DEPTH = 3

function cmp(a: number, op: Cmp, b: number): boolean {
  switch (op) {
    case 'gte':
      return a >= b
    case 'lte':
      return a <= b
    case 'eq':
      return a === b
  }
}

function sideOf(st: BattleState, actor: CharState, side: Side): CharState[] {
  return side === 'ally' ? teamOf(st, actor) : enemiesOf(st, actor)
}

function alive(team: CharState[]): CharState[] {
  return team.filter((c) => c.alive)
}

function evalAtom(atom: ConditionAtom, actor: CharState, st: BattleState): boolean {
  switch (atom.kind) {
    case 'selfHpPct':
      return cmp(hpPct(actor), atom.cmp, atom.value)
    case 'selfHpAbs':
      return cmp(actor.hp, atom.cmp, atom.value)
    case 'selfSpPct':
      return cmp(spPct(actor), atom.cmp, atom.value)
    case 'selfSpAbs':
      return cmp(actor.sp, atom.cmp, atom.value)
    case 'selfRow':
      return actor.row === atom.row
    case 'selfStat':
      return cmp(actor.setup.stats[atom.stat], atom.cmp, atom.value)
    case 'selfHasStatus':
      return hasStatus(actor, atom.status)
    case 'selfActionCount':
      // 이번 행동을 포함한 횟수. "1회째 행동" = 첫 행동.
      return cmp(actor.actionCount + 1, atom.cmp, atom.value)

    case 'teamAliveCount':
      return cmp(alive(sideOf(st, actor, atom.side)).length, atom.cmp, atom.value)
    case 'teamDeadCount': {
      const team = sideOf(st, actor, atom.side)
      return cmp(team.length - alive(team).length, atom.cmp, atom.value)
    }
    case 'teamAnyHpPctBelow':
      return alive(sideOf(st, actor, atom.side)).some((c) => hpPct(c) <= atom.value)
    case 'teamAvgHpPct': {
      const list = alive(sideOf(st, actor, atom.side))
      if (list.length === 0) return cmp(0, atom.cmp, atom.value)
      const sum = list.reduce((acc, c) => acc + hpPct(c), 0)
      return cmp(Math.floor(sum / list.length), atom.cmp, atom.value)
    }
    case 'teamCastingCount':
      return cmp(sideOf(st, actor, atom.side).filter(isCasting).length, atom.cmp, atom.value)
    case 'teamStatusCount':
      return cmp(
        alive(sideOf(st, actor, atom.side)).filter((c) => hasStatus(c, atom.status)).length,
        atom.cmp,
        atom.value,
      )
    case 'teamRowCount':
      return cmp(
        alive(sideOf(st, actor, atom.side)).filter((c) => c.row === atom.row).length,
        atom.cmp,
        atom.value,
      )
    case 'teamSpPctBelow':
      return alive(sideOf(st, actor, atom.side)).some((c) => spPct(c) <= atom.value)
    case 'chance':
      return st.rng.pct() < atom.percent

    case 'teamAnyHpPct':
      return alive(sideOf(st, actor, atom.side)).some((c) => cmp(hpPct(c), atom.cmp, atom.value))
    case 'teamAnyHpAbs':
      return alive(sideOf(st, actor, atom.side)).some((c) => cmp(c.hp, atom.cmp, atom.value))
    case 'teamAnySpPct':
      return alive(sideOf(st, actor, atom.side)).some((c) => cmp(spPct(c), atom.cmp, atom.value))
    case 'teamAvgSpPct': {
      const list = alive(sideOf(st, actor, atom.side))
      if (list.length === 0) return cmp(0, atom.cmp, atom.value)
      const sum = list.reduce((acc, c) => acc + spPct(c), 0)
      return cmp(Math.floor(sum / list.length), atom.cmp, atom.value)
    }
    case 'selfActionEvery':
      // N 이 0 이하면 성립하지 않는다. 이번 행동(actionCount+1)이 N 의 배수일 때.
      return atom.value > 0 && (actor.actionCount + 1) % atom.value === 0
  }
}

export function evalCondition(cond: Condition, actor: CharState, st: BattleState, depth = 0): boolean {
  if (depth > MAX_DEPTH) return false
  switch (cond.op) {
    case 'always':
      return true
    case 'atom':
      return evalAtom(cond.atom, actor, st)
    case 'and':
      // 순서 고정, 단락 평가 없이 전부 평가하지 않는다 — chance 소비량이 달라져도 결정론은 유지된다.
      for (const n of cond.nodes) if (!evalCondition(n, actor, st, depth + 1)) return false
      return true
    case 'or':
      for (const n of cond.nodes) if (evalCondition(n, actor, st, depth + 1)) return true
      return false
    case 'not':
      return !evalCondition(cond.node, actor, st, depth + 1)
  }
}
