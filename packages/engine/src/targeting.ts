// 대상 선정 (§6.1, §6.2) 과 엄호 (§4.2).
import type { Skill } from './types'
import type { BattleState, CharState } from './state'
import { emit, enemiesOf, hasDebuff, hasStatus, hpPct, isCasting, teamOf } from './state'

export interface ResolvedTarget {
  target: CharState
  hits: number
}

function pool(skill: Skill, actor: CharState, st: BattleState): CharState[] {
  switch (skill.target.side) {
    case 'self':
      return [actor]
    case 'ally':
      return teamOf(st, actor)
    case 'enemy':
      return enemiesOf(st, actor)
    case 'any':
      return [...st.teams[0], ...st.teams[1]]
  }
}

/**
 * 우선순위에 따라 후보 1명을 고른다.
 * - prefer : 조건 대상이 없으면 생존자 중 아무나 → 항상 결과가 있다
 * - require: 조건 대상이 없으면 null → 스킬 사용 실패
 */
function pickOne(candidates: CharState[], skill: Skill, st: BattleState): CharState | null {
  const living = candidates.filter((c) => c.alive)
  const p = skill.priority

  if (!p) {
    return living.length ? living[st.rng.int(living.length)] : null
  }

  if (p.mode === 'require') {
    let list: CharState[]
    switch (p.by) {
      case 'dead':
        list = candidates.filter((c) => !c.alive)
        break
      case 'casting':
        list = living.filter(isCasting)
        break
      case 'debuffed':
        list = living.filter(hasDebuff)
        break
      case 'hasStatus':
        list = living.filter((c) => hasStatus(c, p.status))
        break
    }
    return list.length ? list[st.rng.int(list.length)] : null
  }

  // prefer
  if (living.length === 0) return null
  switch (p.by) {
    case 'lowestHpPct':
    case 'highestHpPct': {
      const want = p.by === 'lowestHpPct'
      let best: CharState[] = []
      let bestVal = want ? Number.MAX_SAFE_INTEGER : -1
      for (const c of living) {
        const v = hpPct(c)
        if ((want && v < bestVal) || (!want && v > bestVal)) {
          bestVal = v
          best = [c]
        } else if (v === bestVal) best.push(c)
      }
      return best[st.rng.int(best.length)]
    }
    case 'backRow': {
      const back = living.filter((c) => c.setup.row === 'back')
      const list = back.length ? back : living
      return list[st.rng.int(list.length)]
    }
  }
}

/** null 이면 한정형 우선순위의 대상이 없어 스킬 사용 실패. */
export function selectTargets(skill: Skill, actor: CharState, st: BattleState): ResolvedTarget[] | null {
  const candidates = pool(skill, actor, st)
  const { scope, hits } = skill.target

  if (scope === 'all') {
    const isRevive = skill.priority?.mode === 'require' && skill.priority.by === 'dead'
    const list = candidates.filter((c) => (isRevive ? !c.alive : c.alive))
    if (list.length === 0) return null
    return list.map((target) => ({ target, hits }))
  }

  if (scope === 'single') {
    const t = pickOne(candidates, skill, st)
    return t ? [{ target: t, hits }] : null
  }

  // multi: hits 번 독립 선택 (중복 가능)
  const out: ResolvedTarget[] = []
  for (let i = 0; i < hits; i++) {
    const t = pickOne(candidates, skill, st)
    if (t) out.push({ target: t, hits: 1 })
  }
  return out.length ? out : null
}

/**
 * 후열 대상에 대한 엄호 판정. 엄호자가 있으면 그를 반환, 없으면 원래 대상.
 * 후보를 시드 셔플하여 특정 인원에게 몰리지 않도록 한다.
 */
export function resolveCover(target: CharState, skill: Skill, st: BattleState): CharState {
  if (skill.ignoreCover || skill.isSupport) return target
  if (target.setup.row !== 'back') return target

  const fore = teamOf(st, target).filter(
    (c) => c !== target && c.alive && c.setup.row === 'front' && c.hp > 1,
  )
  if (fore.length === 0) return target
  st.rng.shuffle(fore)

  for (const c of fore) {
    const g = c.setup.guard
    let guards = false
    switch (g.mode) {
      case 'always':
        guards = true
        break
      case 'never':
        guards = false
        break
      case 'hpAbove':
        guards = hpPct(c) > g.pct
        break
      case 'chance':
        guards = st.rng.pct() < g.pct
        break
    }
    if (guards) {
      emit(st, { t: 'cover', defender: c.ref, protectedChar: target.ref })
      return c
    }
  }
  return target
}
