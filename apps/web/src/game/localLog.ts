// 최근 전투 기록은 서버에 올리지 않고 이 브라우저에만 계정별로 둔다 (docs/26 §5.1).
// 저장 크기의 약 65% 가 기록이라서다. 기록은 본부 "최근 전투" 목록 · 다시보기에만 쓰이고 진행(해금 · 승수 · 보상)과는 무관하다.
import { LOG_MAX, type BattleRecord, type GameSave } from './save'

const keyFor = (userId: string) => `webrpg.battlelog.v1.${userId}`

export function loadLocalLog(userId: string): BattleRecord[] {
  try {
    const raw = localStorage.getItem(keyFor(userId))
    const list = raw ? (JSON.parse(raw) as BattleRecord[]) : []
    return Array.isArray(list) ? list.filter((r) => r && typeof r.seed === 'number' && r.player && r.enemy).slice(0, LOG_MAX) : []
  } catch {
    return []
  }
}

export function saveLocalLog(userId: string, log: BattleRecord[]): void {
  try {
    localStorage.setItem(keyFor(userId), JSON.stringify(log.slice(0, LOG_MAX)))
  } catch {
    /* 용량 초과 등 — 기록은 없어도 진행에는 지장이 없다 */
  }
}

/** 서버로 보낼 사본 — 기록을 뺀다 */
export const serverCopy = (g: GameSave): GameSave => ({ ...g, log: [] })

/**
 * 서버에서 불러온 저장에 이 브라우저의 기록을 붙인다.
 * 서버에 아직 기록이 남아 있는 옛 저장(docs/26 이전)이면, 이 브라우저에 기록이 없을 때만 그것을 쓴다.
 */
export function attachLocalLog(userId: string, g: GameSave): GameSave {
  const local = loadLocalLog(userId)
  return { ...g, log: local.length ? local : g.log }
}
