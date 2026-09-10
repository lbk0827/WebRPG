// 앱 상태: 플레이어 편성(5슬롯 + 슬롯별 수칙) · 적 팀 프리셋 · 시드. localStorage 에 보존.
import type { CharSetup, GuardPolicy, Row, RuleSet, TeamSetup } from '@webrpg/engine'
import { PRESETS, TEAMS } from '@webrpg/engine'

export interface SlotState {
  job: string
  row: Row
  guard: GuardPolicy
  rules: RuleSet
}

export interface AppState {
  slots: SlotState[]
  enemy: string
  seed: number
}

const STORAGE_KEY = 'webrpg.m1.v1'

export function slotFromPreset(job: string): SlotState {
  const p = PRESETS[job]
  return { job, row: p.row, guard: structuredClone(p.guard), rules: structuredClone(p.rules) }
}

export function defaultState(): AppState {
  return {
    slots: ['warrior', 'warrior', 'elf', 'mage', 'priest'].map(slotFromPreset),
    enemy: 'rush',
    seed: 1,
  }
}

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultState()
    const parsed = JSON.parse(raw) as AppState
    if (!Array.isArray(parsed.slots) || parsed.slots.length !== 5) return defaultState()
    if (!TEAMS[parsed.enemy]) parsed.enemy = 'rush'
    for (const s of parsed.slots) if (!PRESETS[s.job]) return defaultState()
    return parsed
  } catch {
    return defaultState()
  }
}

export function saveState(s: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s))
  } catch {
    /* 저장 실패는 무시 — 편의 기능일 뿐 */
  }
}

export function buildPlayerTeam(s: AppState): TeamSetup {
  return {
    name: '내 용병단',
    members: s.slots.map((slot, i): CharSetup => {
      const p = PRESETS[slot.job]
      return {
        ...structuredClone(p),
        id: `${p.id}#${i}`,
        row: slot.row,
        guard: structuredClone(slot.guard),
        rules: structuredClone(slot.rules),
      }
    }),
  }
}

export function buildEnemyTeam(s: AppState): TeamSetup {
  return TEAMS[s.enemy]()
}

export const ENEMY_OPTIONS: { key: string; label: string }[] = Object.keys(TEAMS).map((key) => ({
  key,
  label: `${TEAMS[key]().name} (${TEAMS[key]()
    .members.map((m) => m.name)
    .join('·')})`,
}))
