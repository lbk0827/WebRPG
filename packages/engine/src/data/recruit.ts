// 모집소 (M2-3, docs/07 §3.2). 직업별 고용가 + 고용 시 소폭 무작위 편차("같은 전사가 둘"이 되지 않게).
// 편차는 시드 PRNG 로 굴린다 — 웹은 시각을 시드로 넘기고, 테스트는 고정 시드로 재현한다.
import type { Rng } from '../rng'
import type { StatKey, Stats } from '../types'
import { PRESETS } from './presets'

export interface HireDef {
  job: string
  /** 레벨 1 기준 고용가 */
  price: number
  /** 한 줄 소개 (모집소 카드) */
  blurb: string
}

export const HIRE: Record<string, HireDef> = {
  warrior: { job: 'warrior', price: 120, blurb: '전열의 벽. 엄호로 후열을 지키고 강타로 때린다.' },
  rogue: { job: 'rogue', price: 140, blurb: '빠르고 더럽다. 독을 바르고, 시전 중인 적의 입을 막는다.' },
  mage: { job: 'mage', price: 160, blurb: '대화염 한 방. 대신 준비가 길어 끊기기 쉽다.' },
  priest: { job: 'priest', price: 160, blurb: '치유와 소생. 이 사람이 서 있으면 전투가 길어진다.' },
  elf: { job: 'elf', price: 140, blurb: '후열 저격수. 엄호를 뚫고 뒤를 노린다.' },
}

/** 최대 보유 단원 */
export const MEMBER_MAX = 30
/** 이름 변경비 (금 소각처, §4) */
export const RENAME_GOLD = 20
/** 해고 환급 비율 % */
export const DISMISS_REFUND_PCT = 40
/** 고용 레벨당 추가 금액 */
export const HIRE_LEVEL_STEP = 20

/** 고용 레벨: 편성 평균보다 2 낮게, 최소 1 */
export const hireLevel = (avgPartyLevel: number): number => Math.max(1, Math.floor(avgPartyLevel) - 2)

export const hirePrice = (job: string, level: number): number => (HIRE[job]?.price ?? 999) + HIRE_LEVEL_STEP * (level - 1)

/** 고용 편차: 분배 스탯 5종 각각 −5%~+5% (정수, 최소 ±1 은 아님 — 0 도 나온다). HP/SP 는 ±5% */
export type Quirk = Partial<Record<StatKey | 'maxHp' | 'maxSp', number>>

export function rollQuirk(job: string, rng: Rng): Quirk {
  const base = PRESETS[job].stats
  const q: Quirk = {}
  const keys: (StatKey | 'maxHp' | 'maxSp')[] = ['str', 'int', 'dex', 'spd', 'luk', 'maxHp', 'maxSp']
  for (const k of keys) {
    const pct = rng.int(11) - 5 // −5 … +5
    const d = Math.trunc((base[k] * pct) / 100)
    if (d !== 0) q[k] = d
  }
  return q
}

export function applyQuirk(base: Stats, q: Quirk | undefined): Stats {
  if (!q) return base
  const s = { ...base }
  for (const k of Object.keys(q) as (keyof Quirk)[]) s[k] = Math.max(1, s[k] + (q[k] ?? 0))
  return s
}
