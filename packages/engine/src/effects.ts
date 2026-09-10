// 효과 프리미티브 적용 (§6.3). 스킬 = 이 프리미티브의 배열.
import type { Effect, Skill } from './types'
import { GAUGE_MAX, pctOf } from './fixed'
import type { BattleState, CharState } from './state'
import { emit, findStatus, resistPct } from './state'
import { STATUS_DEFS } from './data/statuses'
import { calcDamage, calcHeal, calcSpRestore } from './damage'

export function applyEffect(
  effect: Effect,
  actor: CharState,
  target: CharState,
  skill: Skill,
  st: BattleState,
): void {
  switch (effect.kind) {
    case 'damage': {
      if (!target.alive) return
      const barrier = findStatus(target, 'barrier')
      if (barrier) {
        barrier.magnitude -= 1
        if (barrier.magnitude <= 0) {
          target.statuses = target.statuses.filter((s) => s !== barrier)
          emit(st, { t: 'statusExpire', target: target.ref, status: 'barrier' })
        }
        emit(st, {
          t: 'damage',
          source: actor.ref,
          target: target.ref,
          amount: 0,
          school: effect.school,
          nullified: true,
        })
        return
      }
      const amount = calcDamage(effect.school, effect.power, effect.pierce === true, actor, target, effect.scaleBy)
      target.hp = Math.max(0, target.hp - amount)
      emit(st, { t: 'damage', source: actor.ref, target: target.ref, amount, school: effect.school })
      if (target.hp === 0) kill(target, st)
      return
    }

    case 'heal': {
      if (!target.alive) return
      const amount = Math.min(calcHeal(effect.power, actor), target.setup.stats.maxHp - target.hp)
      target.hp += amount
      emit(st, { t: 'heal', source: actor.ref, target: target.ref, amount })
      return
    }

    case 'restoreSp': {
      if (!target.alive) return
      const amount = Math.min(calcSpRestore(effect.power, actor), target.setup.stats.maxSp - target.sp)
      if (amount <= 0) return
      target.sp += amount
      emit(st, { t: 'spChange', target: target.ref, delta: amount })
      return
    }

    case 'applyStatus': {
      if (!target.alive) return
      // 디버프는 LUK 로 저항할 수 있다 (자신/아군 버프는 저항하지 않음)
      if (STATUS_DEFS[effect.status].category === 'debuff' && target.ref.team !== actor.ref.team) {
        const r = resistPct(target, actor)
        if (r > 0 && st.rng.pct() < r) {
          emit(st, { t: 'statusResisted', target: target.ref, status: effect.status })
          return
        }
      }
      const magnitude = effect.magnitude ?? STATUS_DEFS[effect.status].defaultMagnitude
      const existing = findStatus(target, effect.status)
      if (existing) {
        existing.remaining = Math.max(existing.remaining, effect.duration)
        existing.magnitude = magnitude
      } else {
        target.statuses.push({ id: effect.status, remaining: effect.duration, magnitude })
      }
      emit(st, { t: 'statusApply', target: target.ref, status: effect.status, duration: effect.duration })
      // 침묵은 진행 중인 시전을 끊는다 (끊기의 "취소" 계열)
      if (effect.status === 'silence' && target.pending) {
        emit(st, { t: 'castInterrupted', target: target.ref, skillId: target.pending.skillId })
        target.pending = undefined
      }
      return
    }

    case 'removeStatus': {
      if (!target.alive) return
      const keep: typeof target.statuses = []
      for (const s of target.statuses) {
        if (STATUS_DEFS[s.id].category === effect.category) {
          emit(st, { t: 'statusExpire', target: target.ref, status: s.id })
        } else keep.push(s)
      }
      target.statuses = keep
      return
    }

    case 'modifyGauge': {
      if (!target.alive) return
      target.gauge += effect.delta
      if (target.gauge > GAUGE_MAX) target.gauge = GAUGE_MAX
      emit(st, { t: 'gaugeShift', target: target.ref, delta: effect.delta })
      return
    }

    case 'revive': {
      if (target.alive) return
      target.alive = true
      target.hp = Math.max(1, pctOf(target.setup.stats.maxHp, effect.hpPct))
      target.gauge = 0
      emit(st, { t: 'revive', target: target.ref, hp: target.hp })
      return
    }

    case 'shield': {
      if (!target.alive) return
      const existing = findStatus(target, 'barrier')
      if (existing) existing.magnitude = Math.max(existing.magnitude, effect.hits)
      else target.statuses.push({ id: 'barrier', remaining: 99, magnitude: effect.hits })
      emit(st, { t: 'statusApply', target: target.ref, status: 'barrier', duration: 99 })
      return
    }
  }
}

export function kill(c: CharState, st: BattleState): void {
  c.alive = false
  c.hp = 0
  c.pending = undefined
  c.statuses = []
  c.gauge = 0
  emit(st, { t: 'death', target: c.ref })
}
