// 게임 저장 (M2-1). 서버 없음 — localStorage + JSON 내보내기/가져오기. 스키마 버전 + 마이그레이션.
import type { GuardPolicy, Row, RuleSet } from '@webrpg/engine'
import { EMPTY_ALLOC, PRESETS, type Alloc } from '@webrpg/engine'

export interface Member {
  id: string
  name: string
  job: string
  level: number
  exp: number
  alloc: Alloc
  statPoints: number
  skillPoints: number
  row: Row
  guard: GuardPolicy
  rules: RuleSet
}

export interface GameSave {
  version: 1
  gold: number
  members: Member[]
  /** 편성 슬롯 5개 — 단원 id 또는 null */
  party: (string | null)[]
  /** 지역별 승리 수 (해금 판정) */
  regionWins: Record<string, number>
  battles: number
}

export const SAVE_KEY = 'webrpg.game.v1'

const START_JOBS = ['warrior', 'rogue', 'mage', 'priest', 'elf']

export function newGame(): GameSave {
  const members: Member[] = START_JOBS.map((job, i) => {
    const p = PRESETS[job]
    return {
      id: `m${i + 1}`,
      name: p.name,
      job,
      level: 1,
      exp: 0,
      alloc: { ...EMPTY_ALLOC },
      statPoints: 0,
      skillPoints: 0,
      row: p.row,
      guard: structuredClone(p.guard),
      rules: structuredClone(p.rules),
    }
  })
  return { version: 1, gold: 200, members, party: members.map((m) => m.id), regionWins: {}, battles: 0 }
}

/** 형태 검증 + 버전 마이그레이션. 실패하면 null */
export function migrate(raw: unknown): GameSave | null {
  if (!raw || typeof raw !== 'object') return null
  const s = raw as Partial<GameSave>
  if (s.version !== 1) return null
  if (!Array.isArray(s.members) || !Array.isArray(s.party)) return null
  for (const m of s.members) {
    if (!PRESETS[m.job]) return null
    if (!m.rules || !Array.isArray(m.rules.rows)) return null
    m.alloc = { ...EMPTY_ALLOC, ...(m.alloc ?? {}) }
    m.statPoints ??= 0
    m.skillPoints ??= 0
    m.level ??= 1
    m.exp ??= 0
  }
  return {
    version: 1,
    gold: typeof s.gold === 'number' ? s.gold : 0,
    members: s.members,
    party: [...s.party.slice(0, 5), ...Array(Math.max(0, 5 - s.party.length)).fill(null)],
    regionWins: s.regionWins ?? {},
    battles: s.battles ?? 0,
  }
}

export function loadGame(): GameSave {
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    if (raw) {
      const g = migrate(JSON.parse(raw))
      if (g) return g
    }
  } catch {
    /* ignore */
  }
  return newGame()
}

export function saveGame(g: GameSave): void {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(g))
  } catch {
    /* ignore */
  }
}

export const exportGame = (g: GameSave): string => JSON.stringify(g)

export function importGame(text: string): GameSave | null {
  try {
    return migrate(JSON.parse(text))
  } catch {
    return null
  }
}
