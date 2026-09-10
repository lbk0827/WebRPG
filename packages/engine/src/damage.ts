// 데미지 / 회복 공식 (§4.3 + M2-0 장비 항·특성·연타 점감·열 조건부 위력). 전부 정수.
import { isqrt, pctOf } from './fixed'
import type { Row } from './types'
import type { CharState } from './state'
import { atkModPct, coverDamagePct, damageVsRowPct, defModPct } from './state'

export interface DamageOpts {
  school: 'phys' | 'magic'
  power: number
  pierce?: boolean
  scaleBy?: 'str' | 'dex'
  /** 연타 점감 (%p / 타) */
  falloff?: number
  /** 이번 타가 몇 번째인가 (0부터) */
  hitIndex?: number
  rowBonus?: { selfRow?: Row; targetRow?: Row; power: number }
  /** 엄호로 대신 맞는 중인가 (특성 coverDamagePct 적용) */
  viaCover?: boolean
}

/**
 * 기본치   = isqrt(주스탯 * 100) + 장비 공격 가산          ( = sqrt(주스탯) * 10 )
 * 위력     = power (열 조건부면 rowBonus.power) × 연타 점감
 * 위력적용 = 기본치 * 위력 / 100 * (100 + 공격보정) / 100 * (100 + 열 대상 특성) / 100 * (엄호 특성)
 * 최소보장 = 위력적용 / 10 (최소 1)
 * 방어적용 = 위력적용 * (100 - 비율방어 - 장비 비율) / 100 - (고정방어 + 장비 고정)
 * 최종     = max(방어적용, 최소보장)
 */
export function calcDamage(o: DamageOpts, attacker: CharState, target: CharState): number {
  const s = attacker.setup.stats
  const stat = o.school === 'magic' ? s.int : o.scaleBy === 'dex' ? s.dex : s.str
  const bonusAtk = attacker.setup.bonus?.atk?.[o.school === 'phys' ? 0 : 1] ?? 0
  const base = isqrt(stat * 100) + bonusAtk

  let power = o.power
  if (
    o.rowBonus &&
    (o.rowBonus.selfRow === undefined || o.rowBonus.selfRow === attacker.row) &&
    (o.rowBonus.targetRow === undefined || o.rowBonus.targetRow === target.row)
  ) {
    power = o.rowBonus.power
  }
  if (o.falloff && o.hitIndex) power = pctOf(power, Math.max(10, 100 - o.falloff * o.hitIndex))

  let raw = pctOf(base, power)
  raw = pctOf(raw, 100 + atkModPct(attacker))
  raw = pctOf(raw, 100 + damageVsRowPct(attacker, target.row))
  if (o.viaCover) raw = pctOf(raw, 100 + coverDamagePct(target))

  const floor = Math.max(1, Math.floor(raw / 10))
  if (o.pierce) return Math.max(raw, floor)

  const d = target.setup.bonus?.def
  const pct = defModPct(target) + (o.school === 'phys' ? (d?.[0] ?? 0) : (d?.[2] ?? 0))
  const flat = o.school === 'phys' ? target.setup.stats.def + (d?.[1] ?? 0) : target.setup.stats.mdef + (d?.[3] ?? 0)
  const reduced = pctOf(raw, 100 - pct) - flat
  return Math.max(reduced, floor)
}

export function calcHeal(power: number, caster: CharState): number {
  const base = isqrt(caster.setup.stats.int * 100) + (caster.setup.bonus?.atk?.[1] ?? 0)
  return Math.max(1, pctOf(base, power))
}

export function calcSpRestore(power: number, caster: CharState): number {
  const base = isqrt(caster.setup.stats.int * 100)
  return Math.max(1, pctOf(base, power))
}

/** SP 피해: 마법 기본치 × power. 방어 없음 */
export function calcSpDamage(power: number, attacker: CharState): number {
  const base = isqrt(attacker.setup.stats.int * 100) + (attacker.setup.bonus?.atk?.[1] ?? 0)
  return Math.max(1, pctOf(base, power))
}
