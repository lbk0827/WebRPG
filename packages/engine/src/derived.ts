// 스탯에서 바로 계산되는 파생 수치 (ADR-004 §5 N). 화면에 "이 스탯이 무엇을 했는가"를 보여주기 위한 순수 함수.
// 공식은 damage.ts / state.ts 와 같아야 한다 — 여기서 바꾸면 거기도 바꾼다.
import { isqrt } from './fixed'
import { maxRuleRows } from './progression'
import { CHARGE_BASE } from './state'
import type { Stats } from './types'

export interface DerivedStats {
  /** 물리 기본치 = isqrt(STR × 100) */
  physBase: number
  /** 손재주 기술 기본치 = isqrt(DEX × 100) */
  dexBase: number
  /** 마법·회복 기본치 = isqrt(INT × 100) */
  magicBase: number
  /** 틱당 게이지 충전량 (버프 없음) */
  chargePerTick: number
  /** 시전 준비 시간 단축 % (DEX/4, 최대 25) */
  castReductionPct: number
  /** 운 0 인 상대의 상태이상을 저항할 확률 % (LUK/4, 최대 30) */
  resistMaxPct: number
  /** 패턴 칸 수 */
  ruleRows: number
}

export function derivedStats(s: Stats): DerivedStats {
  return {
    physBase: isqrt(s.str * 100),
    dexBase: isqrt(s.dex * 100),
    magicBase: isqrt(s.int * 100),
    chargePerTick: isqrt(s.spd * 100) + CHARGE_BASE,
    castReductionPct: Math.min(25, Math.floor(s.dex / 4)),
    resistMaxPct: Math.min(30, Math.floor(s.luk / 4)),
    ruleRows: maxRuleRows(s),
  }
}
