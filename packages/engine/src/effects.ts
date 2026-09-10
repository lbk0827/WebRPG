// 효과 프리미티브 적용 (§6.3 + M2-0 확장). 스킬 = 이 프리미티브의 배열.
import type { Effect, Row } from './types'
import { GAUGE_MAX, pctOf } from './fixed'
import type { BattleState, CharState } from './state'
import { DELAY_TAKEN_CAP, emit, findStatus, hpPct, resistPct } from './state'
import { STATUS_DEFS } from './data/statuses'
import { TRAITS } from './data/traits'
import { calcDamage, calcHeal, calcSpDamage, calcSpRestore } from './damage'

/** 한 번의 효과 적용에 따라붙는 문맥 */
export interface EffectCtx {
  /** 이번 대상에 대한 몇 번째 타인가 (0부터) */
  hitIndex: number
  /** 엄호로 대신 맞는 중 */
  viaCover: boolean
  /** 직전 damage 효과가 준 피해 (drain 용) */
  lastDamage: number
}

export const freshCtx = (): EffectCtx => ({ hitIndex: 0, viaCover: false, lastDamage: 0 })

export function applyEffect(effect: Effect, actor: CharState, target: CharState, st: BattleState, ctx: EffectCtx): void {
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
        emit(st, { t: 'damage', source: actor.ref, target: target.ref, amount: 0, school: effect.school, nullified: true })
        ctx.lastDamage = 0
        return
      }
      const amount = calcDamage(
        {
          school: effect.school,
          power: effect.power,
          pierce: effect.pierce,
          scaleBy: effect.scaleBy,
          falloff: effect.falloff,
          hitIndex: ctx.hitIndex,
          rowBonus: effect.rowBonus,
          viaCover: ctx.viaCover,
        },
        actor,
        target,
      )
      target.hp = Math.max(0, target.hp - amount)
      ctx.lastDamage = amount
      emit(st, { t: 'damage', source: actor.ref, target: target.ref, amount, school: effect.school })
      if (target.hp === 0) kill(target, st)
      else runTriggers(target, 'damaged', st)
      return
    }

    case 'heal': {
      if (!target.alive) return
      const amount = Math.min(calcHeal(effect.power, actor), target.setup.stats.maxHp - target.hp)
      if (amount <= 0) return
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

    case 'damageSp': {
      if (!target.alive) return
      const amount = Math.min(calcSpDamage(effect.power, actor), target.sp)
      if (amount <= 0) return
      target.sp -= amount
      emit(st, { t: 'spChange', target: target.ref, delta: -amount })
      return
    }

    case 'drain': {
      // 직전 피해량의 pct 만큼 시전자가 회복
      const amount = pctOf(ctx.lastDamage, effect.pct)
      if (amount <= 0 || !actor.alive) return
      if (effect.resource === 'hp') {
        const got = Math.min(amount, actor.setup.stats.maxHp - actor.hp)
        if (got <= 0) return
        actor.hp += got
        emit(st, { t: 'heal', source: actor.ref, target: actor.ref, amount: got })
      } else {
        const got = Math.min(amount, actor.setup.stats.maxSp - actor.sp)
        if (got <= 0) return
        actor.sp += got
        emit(st, { t: 'spChange', target: actor.ref, delta: got })
      }
      return
    }

    case 'applyStatus': {
      if (!target.alive) return
      // 디버프는 LUK·특성으로 저항할 수 있다 (자신/아군 버프는 저항하지 않음)
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
        if (STATUS_DEFS[s.id].category === effect.category) emit(st, { t: 'statusExpire', target: target.ref, status: s.id })
        else keep.push(s)
      }
      target.statuses = keep
      return
    }

    case 'modifyGauge': {
      if (!target.alive) return
      let delta = effect.delta
      if (delta < 0) {
        // 딜밀기 상한: 한 전투에서 받을 수 있는 지연 총량
        const allowed = Math.max(0, DELAY_TAKEN_CAP - target.delayTaken)
        delta = Math.max(delta, -allowed)
        target.delayTaken += -delta
      }
      target.gauge += delta
      if (target.gauge > GAUGE_MAX) target.gauge = GAUGE_MAX
      emit(st, { t: 'gaugeShift', target: target.ref, delta })
      return
    }

    case 'moveRow': {
      const who = effect.who === 'self' ? actor : target
      if (!who.alive) return
      const to: Row = effect.to === 'swap' ? (who.row === 'front' ? 'back' : 'front') : effect.to
      if (who.row === to) return
      who.row = to
      emit(st, { t: 'rowChange', target: who.ref, row: to })
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

/**
 * 트리거 특성 발동. 효과는 자신에게 적용된다.
 * - turnStart: 자기 차례 시작 시
 * - damaged: 피해를 받고 살아남았을 때 (lowHp 트리거는 HP 조건이 맞을 때 함께 검사)
 */
export function runTriggers(c: CharState, on: 'turnStart' | 'damaged', st: BattleState): void {
  if (!c.alive) return
  for (const id of c.setup.traits ?? []) {
    const defs = TRAITS[id]?.effects ?? []
    for (let i = 0; i < defs.length; i++) {
      const e = defs[i]
      if (e.kind !== 'trigger') continue
      const fires =
        (on === 'turnStart' && e.on === 'turnStart') ||
        (on === 'damaged' && e.on === 'damaged') ||
        (on === 'damaged' && e.on === 'lowHp' && hpPct(c) <= (e.hpPct ?? 30))
      if (!fires) continue
      const key = `${id}:${i}`
      const used = c.traitUses[key] ?? 0
      if (e.perBattle !== undefined && used >= e.perBattle) continue
      c.traitUses[key] = used + 1
      emit(st, { t: 'traitTrigger', target: c.ref, traitId: id })
      applyEffect(e.effect, c, c, st, freshCtx())
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
