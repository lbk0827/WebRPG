// 게임 저장 (M2-1, v2 는 ADR-004, v3 는 편성 판). 서버 없음 — localStorage + JSON 내보내기/가져오기. 스키마 버전 + 마이그레이션.
import type { GearSlot, GuardPolicy, ItemInstance, Outcome, Quirk, Row, RuleSet, TeamSetup } from '@webrpg/engine'
import { ADVENTURE_BY_ID, EMPTY_ALLOC, ITEMS, MATERIALS, MEMBER_MAX, PRESETS, REFINE_MAX, SKILL_POINTS_PER_LEVEL, STARTER_SKILLS, TRAITS, type Alloc } from '@webrpg/engine'

export type Gear = Partial<Record<GearSlot, ItemInstance>>

const validItem = (x: unknown): x is ItemInstance => !!x && typeof x === 'object' && typeof (x as ItemInstance).uid === 'string' && !!ITEMS[(x as ItemInstance).itemId]
const fixItem = (x: ItemInstance): ItemInstance => {
  const it: ItemInstance = { uid: x.uid, itemId: x.itemId, refine: typeof x.refine === 'number' ? Math.max(0, Math.min(REFINE_MAX, Math.floor(x.refine))) : 0 }
  if (typeof x.trait === 'string' && TRAITS[x.trait]) it.trait = x.trait
  return it
}

export interface Member {
  id: string
  name: string
  job: string
  level: number
  exp: number
  alloc: Alloc
  statPoints: number
  skillPoints: number
  /** 배운 스킬 (M2-2). 시작 스킬 + 포인트로 산 것 */
  skills: string[]
  /** 지금까지 쓴 스킬 포인트 — 초기화 때 돌려준다 */
  spentSkillPoints: number
  /** 고용 시 굴린 소폭 편차 (M2-3). 초기 단원은 없음 */
  quirk?: Quirk
  /** 고용가 (해고 환급 계산용). 초기 단원은 0 */
  hiredFor?: number
  /** 착용 장비 (M2-4a). 슬롯 3 */
  gear: Gear
  /** 편성 칸에서 정해진다 (cellRow). 대기 단원은 마지막 값 유지 */
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

/** 편성 프리셋 3슬롯 — 판 6칸 그대로 */
export interface PartyPreset {
  name: string
  party: (string | null)[]
}

export const PARTY_PRESET_SLOTS = 3
export const RULE_PRESET_MAX = 20

/**
 * 편성 판 (유니콘 오버로드식, 단장 요청). 칸 0·1·2 = 전열, 3·4·5 = 후열.
 * 칸은 6개지만 출전 인원은 PARTY_MAX 까지 — 상대 몬스터 최대 5, 과제·밸런스가 5 기준이라서 (docs/07).
 * 6명으로 올리려면 PARTY_MAX 만 바꾸고 밸런스를 다시 잰다.
 */
export const GRID_CELLS = 6
export const GRID_COLS = 3
export const PARTY_MAX = 5
export const cellRow = (cell: number): Row => (cell < GRID_COLS ? 'front' : 'back')

export interface GameSave {
  version: 3
  /** 용병단 이름 */
  name: string
  rulePresets: RulePreset[]
  partyPresets: (PartyPreset | null)[]
  gold: number
  members: Member[]
  /** 편성 판 6칸 — 단원 id 또는 null */
  party: (string | null)[]
  /** 지역별 승리 수 (해금 판정) */
  regionWins: Record<string, number>
  battles: number
  wins: number
  /** 최근 전투 (최신이 앞) */
  log: BattleRecord[]
  /** 착용하지 않은 장비 (M2-4a) */
  inventory: ItemInstance[]
  /** 재료 (M2-4b) — id → 수량 */
  materials: Record<string, number>
  /** 모험 진행 (탭 개편) — 모험 id → 재도전 시각·오늘 도전 횟수 */
  adventures: Record<string, AdventureState>
}

/** 모험 한 곳의 상태. 시각은 epoch ms (웹만 다룬다 — 엔진은 시간을 모른다) */
export interface AdventureState {
  /** 이 시각 전에는 다시 못 간다 */
  nextAt: number
  /** 오늘 날짜 키 (YYYY-MM-DD, 로컬) */
  day: string
  /** 그 날 도전 횟수 */
  count: number
  /** 클리어한 적이 있는가 */
  cleared?: boolean
}

export const dayKey = (now = Date.now()): string => {
  const d = new Date(now)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export const SAVE_KEY = 'webrpg.game.v1'
export const LOG_MAX = 12
export const DEFAULT_NAME = '이름 없는 용병단'

const START_JOBS = ['warrior', 'rogue', 'mage', 'priest', 'elf']

const emptyGrid = (): (string | null)[] => Array(GRID_CELLS).fill(null)

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
      skills: [...(STARTER_SKILLS[job] ?? p.skills)],
      spentSkillPoints: 0,
      gear: {},
      row: p.row,
      guard: structuredClone(p.guard),
      rules: structuredClone(p.rules),
    }
  })
  return {
    version: 3, name: DEFAULT_NAME, rulePresets: [], partyPresets: Array(PARTY_PRESET_SLOTS).fill(null),
    gold: 200, members, party: gridFromRows(members.map((m) => m.id), members), regionWins: {}, battles: 0, wins: 0, log: [], inventory: [], materials: {}, adventures: {},
  }
}

/**
 * 순서 있는 단원 목록(v1·v2 의 party[5])을 판 6칸에 놓는다. 전열은 0~2, 후열은 3~5.
 * 한 열이 넘치면 반대 열의 빈 칸으로 — 그 단원의 row 는 놓인 칸을 따른다.
 */
export function gridFromRows(ids: (string | null)[], members: Member[]): (string | null)[] {
  const grid = emptyGrid()
  const pending: string[] = []
  const place = (id: string, row: Row): boolean => {
    const start = row === 'front' ? 0 : GRID_COLS
    for (let c = start; c < start + GRID_COLS; c++) {
      if (grid[c] === null) {
        grid[c] = id
        return true
      }
    }
    return false
  }
  for (const id of ids) {
    if (!id) continue
    const m = members.find((x) => x.id === id)
    if (!m) continue
    if (!place(id, m.row)) pending.push(id)
  }
  for (const id of pending) {
    const m = members.find((x) => x.id === id)!
    if (place(id, m.row === 'front' ? 'back' : 'front')) m.row = cellRow(grid.indexOf(id))
  }
  return grid
}

/** 판을 정리한다: 모르는 id 제거, 중복 제거, 인원 상한, 단원 row 를 칸에 맞춤 */
export function normalizeGrid(raw: unknown, members: Member[]): (string | null)[] {
  const grid = emptyGrid()
  if (!Array.isArray(raw)) return grid
  const seen = new Set<string>()
  let count = 0
  raw.slice(0, GRID_CELLS).forEach((id, i) => {
    if (typeof id !== 'string' || seen.has(id) || count >= PARTY_MAX) return
    const m = members.find((x) => x.id === id)
    if (!m) return
    seen.add(id)
    count++
    grid[i] = id
    m.row = cellRow(i)
  })
  return grid
}

/** 형태 검증 + 버전 마이그레이션 (v1 → v2 → v3). 실패하면 null */
export function migrate(raw: unknown): GameSave | null {
  if (!raw || typeof raw !== 'object') return null
  const s = raw as Omit<Partial<GameSave>, 'version'> & { version?: number }
  if (s.version !== 1 && s.version !== 2 && s.version !== 3) return null
  if (!Array.isArray(s.members) || !Array.isArray(s.party)) return null
  s.members = s.members.slice(0, MEMBER_MAX)
  for (const m of s.members) {
    if (!PRESETS[m.job]) return null
    if (!m.rules || !Array.isArray(m.rules.rows)) return null
    m.alloc = { ...EMPTY_ALLOC, ...(m.alloc ?? {}) }
    m.statPoints ??= 0
    m.skillPoints ??= 0
    m.level ??= 1
    m.exp ??= 0
    m.row ??= PRESETS[m.job].row
    // M2-2 이전 저장: 프리셋 스킬 전부를 가진 채로 승격 (빼앗지 않는다). 포인트는 새 비율(레벨당 1)로 다시 센다
    if (!Array.isArray(m.skills)) m.skills = [...PRESETS[m.job].skills]
    m.skills = m.skills.filter((id, i, arr) => typeof id === 'string' && arr.indexOf(id) === i)
    if (!m.skills.includes('strike')) m.skills.unshift('strike')
    m.spentSkillPoints = typeof m.spentSkillPoints === 'number' ? m.spentSkillPoints : 0
    m.skillPoints = Math.max(0, (m.level - 1) * SKILL_POINTS_PER_LEVEL - m.spentSkillPoints)
    const gear: Gear = {}
    if (m.gear && typeof m.gear === 'object') {
      for (const slot of ['weapon', 'armor', 'trinket'] as GearSlot[]) {
        const it = (m.gear as Gear)[slot]
        if (validItem(it) && ITEMS[it.itemId].slot === slot) gear[slot] = fixItem(it)
      }
    }
    m.gear = gear
  }
  const inventory: ItemInstance[] = Array.isArray(s.inventory) ? s.inventory.filter(validItem).map(fixItem) : []
  const materials: Record<string, number> = {}
  if (s.materials && typeof s.materials === 'object') {
    for (const [k, v] of Object.entries(s.materials)) if (MATERIALS[k] && typeof v === 'number' && v > 0) materials[k] = Math.floor(v)
  }
  const adventures: Record<string, AdventureState> = {}
  if (s.adventures && typeof s.adventures === 'object') {
    for (const [k, v] of Object.entries(s.adventures)) {
      if (!ADVENTURE_BY_ID[k] || !v || typeof v !== 'object') continue
      adventures[k] = {
        nextAt: typeof v.nextAt === 'number' ? v.nextAt : 0,
        day: typeof v.day === 'string' ? v.day : '',
        count: typeof v.count === 'number' ? Math.max(0, Math.floor(v.count)) : 0,
        cleared: v.cleared === true,
      }
    }
  }
  const members = s.members
  const regionWins = s.regionWins ?? {}
  const log = Array.isArray(s.log) ? s.log.filter((r) => r && typeof r.seed === 'number' && r.player && r.enemy).slice(0, LOG_MAX) : []
  const rulePresets = Array.isArray(s.rulePresets)
    ? s.rulePresets.filter((p) => p && typeof p.id === 'string' && PRESETS[p.job] && p.rules && Array.isArray(p.rules.rows)).slice(0, RULE_PRESET_MAX)
    : []
  // v1·v2: 순서 목록 + 단원 row → 판. v3: 판 그대로
  const party = s.version === 3 ? normalizeGrid(s.party, members) : gridFromRows(s.party, members)
  const partyPresets: (PartyPreset | null)[] = Array(PARTY_PRESET_SLOTS).fill(null)
  if (Array.isArray(s.partyPresets)) {
    s.partyPresets.slice(0, PARTY_PRESET_SLOTS).forEach((p, i) => {
      if (!p || typeof p.name !== 'string' || !Array.isArray(p.party)) return
      partyPresets[i] = { name: p.name, party: s.version === 3 ? p.party.slice(0, GRID_CELLS) : gridFromRows(p.party, members.map((m) => ({ ...m }))) }
    })
  }
  return {
    version: 3,
    name: typeof s.name === 'string' && s.name.trim() ? s.name.trim().slice(0, 20) : DEFAULT_NAME,
    rulePresets,
    partyPresets,
    gold: typeof s.gold === 'number' ? s.gold : 0,
    members,
    party,
    regionWins,
    battles: s.battles ?? 0,
    wins: typeof s.wins === 'number' ? s.wins : Object.values(regionWins).reduce((a, b) => a + b, 0),
    log,
    inventory,
    materials,
    adventures,
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
