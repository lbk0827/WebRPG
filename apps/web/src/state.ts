// 수칙 편집기가 다루는 슬롯 형태. 훈련 과제(고정 단원)와 내 용병단(성장 단원)이 같은 편집기를 쓴다.
import type { GuardPolicy, Row, RuleSet, Stats, TeamSetup } from '@webrpg/engine'
import { PRESETS, TEAMS } from '@webrpg/engine'

export interface SlotState {
  job: string
  row: Row
  guard: GuardPolicy
  rules: RuleSet
  /** 성장 반영 스탯 (생략 시 직업 기본값) — 패턴 수 상한 계산용 */
  stats?: Stats
  /** 보유 스킬 (생략 시 직업 기본값) */
  skills?: string[]
}

export function slotFromPreset(job: string): SlotState {
  const p = PRESETS[job]
  return { job, row: p.row, guard: structuredClone(p.guard), rules: structuredClone(p.rules) }
}

export const ENEMY_OPTIONS: { key: string; label: string }[] = Object.keys(TEAMS).map((key) => ({
  key,
  label: `${TEAMS[key]().name} (${TEAMS[key]()
    .members.map((m) => m.name)
    .join('·')})`,
}))

export const enemyTeam = (key: string): TeamSetup => (TEAMS[key] ?? TEAMS.rush)()
