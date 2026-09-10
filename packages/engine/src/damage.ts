// 데미지 / 회복 공식 (§4.3). 전부 정수.
import { isqrt, pctOf } from './fixed'
import type { CharState } from './state'
import { atkModPct, defModPct } from './state'

/**
 * 기본치   = isqrt(주스탯 * 100)            ( = sqrt(주스탯) * 10 )
 * 위력적용 = 기본치 * power / 100 * (100 + 공격보정) / 100
 * 최소보장 = 위력적용 / 10 (최소 1)
 * 방어적용 = 위력적용 * (100 - 비율방어) / 100 - 고정방어
 * 최종     = max(방어적용, 최소보장)
 */
export function calcDamage(
  school: 'phys' | 'magic',
  power: number,
  pierce: boolean,
  attacker: CharState,
  target: CharState,
  scaleBy: 'str' | 'dex' = 'str',
): number {
  const s = attacker.setup.stats
  const stat = school === 'magic' ? s.int : scaleBy === 'dex' ? s.dex : s.str
  const base = isqrt(stat * 100)
  let raw = pctOf(base, power)
  raw = pctOf(raw, 100 + atkModPct(attacker))

  const floor = Math.max(1, Math.floor(raw / 10))
  if (pierce) return Math.max(raw, floor)

  const flat = school === 'phys' ? target.setup.stats.def : target.setup.stats.mdef
  const reduced = pctOf(raw, 100 - defModPct(target)) - flat
  return Math.max(reduced, floor)
}

export function calcHeal(power: number, caster: CharState): number {
  const base = isqrt(caster.setup.stats.int * 100)
  return Math.max(1, pctOf(base, power))
}

export function calcSpRestore(power: number, caster: CharState): number {
  const base = isqrt(caster.setup.stats.int * 100)
  return Math.max(1, pctOf(base, power))
}
