// 게임 저장 (M2-1, v2 는 ADR-004). 서버 없음 — localStorage + JSON 내보내기/가져오기. 스키마 버전 + 마이그레이션.
import type { GuardPolicy, Outcome, Row, RuleSet, TeamSetup } from '@webrpg/engine'
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

/** 전투 기록. 결정론이라 시드 + 양 팀 편성만 있으면 그때 그 전투를 그대로 재생한다 */
export interface BattleRecord {
  at: number
  regionId: string
  seed: number
  outcome: Outcome
  exp: number
  gold: number
  actions: number
  player: TeamSetup
  enemy: TeamSetup
}

/** 저장해 둔 수칙 세트 (제로식의 "상태 저장 슬롯"에서 착안). 같은 직업 단원끼리 공유 */
export interface RulePreset {
  id: string
  name: string
  job: string
  rules: RuleSet
  row: Row
  guard: GuardPolicy
}

/** 편성 프리셋 3슬롯 */
export interface PartyPreset {
  name: string
  party: (string | null)[]
}

export const PARTY_PRESET_SLOTS = 3
export const RULE_PRESET_MAX = 20

export interface GameSave {
  version: 2
  /** 용병단 이름 */
  name: string
  rulePresets: RulePreset[]
  partyPresets: (PartyPreset | null)[]
  gold: number
  members: Member[]
  /** 편성 슬롯 5개 — 단원 id 또는 null */
  party: (string | null)[]
  /** 지역별 승리 수 (해금 판정) */
  regionWins: Record<string, number>
  battles: number
  wins: number
  /** 최근 전투 (최신이 앞) */
  log: BattleRecord[]
}

export const SAVE_KEY = 'webrpg.game.v1'
export const LOG_MAX = 12
export const DEFAULT_NAME = '이름 없는 용병단'

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
  return {
    version: 2, name: DEFAULT_NAME, rulePresets: [], partyPresets: Array(PARTY_PRESET_SLOTS).fill(null),
    gold: 200, members, party: members.map((m) => m.id), regionWins: {}, battles: 0, wins: 0, log: [],
  }
}

/** 형태 검증 + 버전 마이그레이션 (v1 → v2). 실패하면 null */
export function migrate(raw: unknown): GameSave | null {
  if (!raw || typeof raw !== 'object') return null
  const s = raw as Omit<Partial<GameSave>, 'version'> & { version?: number }
  if (s.version !== 1 && s.version !== 2) return null
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
  const regionWins = s.regionWins ?? {}
  const log = Array.isArray(s.log) ? s.log.filter((r) => r && typeof r.seed === 'number' && r.player && r.enemy).slice(0, LOG_MAX) : []
  const rulePresets = Array.isArray(s.rulePresets)
    ? s.rulePresets.filter((p) => p && typeof p.id === 'string' && PRESETS[p.job] && p.rules && Array.isArray(p.rules.rows)).slice(0, RULE_PRESET_MAX)
    : []
  const partyPresets: (PartyPreset | null)[] = Array(PARTY_PRESET_SLOTS).fill(null)
  if (Array.isArray(s.partyPresets)) {
    s.partyPresets.slice(0, PARTY_PRESET_SLOTS).forEach((p, i) => {
      if (p && typeof p.name === 'string' && Array.isArray(p.party)) partyPresets[i] = { name: p.name, party: p.party.slice(0, 5) }
    })
  }
  return {
    version: 2,
    name: typeof s.name === 'string' && s.name.trim() ? s.name.trim().slice(0, 20) : DEFAULT_NAME,
    rulePresets,
    partyPresets,
    gold: typeof s.gold === 'number' ? s.gold : 0,
    members: s.members,
    party: [...s.party.slice(0, 5), ...Array(Math.max(0, 5 - s.party.length)).fill(null)],
    regionWins,
    battles: s.battles ?? 0,
    wins: typeof s.wins === 'number' ? s.wins : Object.values(regionWins).reduce((a, b) => a + b, 0),
    log,
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

/** 기록 추가 (최신이 앞, LOG_MAX 유지) */
export const pushRecord = (g: GameSave, r: BattleRecord): GameSave => ({ ...g, log: [r, ...g.log].slice(0, LOG_MAX) })
