// 단원 ↔ 전투 CharSetup 변환, 성장 처리, 편성 판 조작.
import type { Alloc, CharSetup, StatKey, Stats, TeamSetup } from '@webrpg/engine'
import { PRESETS, STAT_CAP, STAT_POINTS_PER_LEVEL, SKILL_POINTS_PER_LEVEL, grantExp, growthStats } from '@webrpg/engine'
import { PARTY_MAX, cellRow, type GameSave, type Member } from './save'

export const memberStats = (m: Member): Stats => growthStats(PRESETS[m.job].stats, m.level, m.alloc)

export function memberSetup(m: Member, idx: number): CharSetup {
  const p = PRESETS[m.job]
  return {
    id: `${m.job}#${idx}`,
    name: m.name,
    row: m.row,
    guard: structuredClone(m.guard),
    stats: memberStats(m),
    skills: [...p.skills],
    rules: structuredClone(m.rules),
  }
}

export const memberById = (g: GameSave, id: string | null): Member | undefined => (id ? g.members.find((m) => m.id === id) : undefined)

/** 편성된 단원 (판 칸 순서 — 전열 0~2, 후열 3~5. 빈 칸 제외) */
export const partyMembers = (g: GameSave): Member[] => g.party.map((id) => memberById(g, id)).filter((m): m is Member => m !== undefined)

export const partyTeam = (g: GameSave): TeamSetup => ({ name: g.name, members: partyMembers(g).map(memberSetup) })

/** 편성 요약 (상태줄·비교 카드용) */
export function partySummary(g: GameSave): { count: number; avgLevel: number; levelSum: number; hpSum: number } {
  const ms = partyMembers(g)
  const levelSum = ms.reduce((s, m) => s + m.level, 0)
  const hpSum = ms.reduce((s, m) => s + memberStats(m).maxHp, 0)
  return { count: ms.length, avgLevel: ms.length ? Math.round(levelSum / ms.length) : 0, levelSum, hpSum }
}

/** 대기 중인 단원 (판에 없는) */
export const benchMembers = (g: GameSave): Member[] => g.members.filter((m) => !g.party.includes(m.id))

export const cellOf = (g: GameSave, id: string): number => g.party.indexOf(id)

// ───────────────────────────── 편성 판 조작. 단원 row 는 항상 놓인 칸을 따른다

/** 칸에 단원을 놓는다. 다른 칸에 있었으면 옮기고, 그 칸에 누가 있었으면 자리를 바꾼다. 인원 상한이면 그대로 */
export function placeMember(g: GameSave, cell: number, id: string): GameSave {
  const from = g.party.indexOf(id)
  const occupant = g.party[cell]
  if (from < 0 && occupant === null && partyMembers(g).length >= PARTY_MAX) return g
  const party = g.party.slice()
  party[cell] = id
  if (from >= 0) party[from] = occupant
  else if (occupant) {
    // 대기 단원이 자리를 차지 — 있던 단원은 대기로
    party[cell] = id
  }
  const moved = [id, occupant].filter((x): x is string => x !== null && party.includes(x))
  const members = g.members.map((m) => (moved.includes(m.id) ? { ...m, row: cellRow(party.indexOf(m.id)) } : m))
  return { ...g, party, members }
}

/** 칸을 비운다 (단원은 대기로) */
export function clearCell(g: GameSave, cell: number): GameSave {
  const party = g.party.slice()
  party[cell] = null
  return { ...g, party }
}

/** 두 칸을 맞바꾼다 (빈 칸 포함) */
export function swapCells(g: GameSave, a: number, b: number): GameSave {
  if (a === b) return g
  const party = g.party.slice()
  ;[party[a], party[b]] = [party[b], party[a]]
  const touched = [party[a], party[b]].filter((x): x is string => x !== null)
  const members = g.members.map((m) => (touched.includes(m.id) ? { ...m, row: cellRow(party.indexOf(m.id)) } : m))
  return { ...g, party, members }
}

/** 판 전체를 바꾼다 (프리셋 불러오기). 모르는 id 는 비움, 상한 초과는 잘라냄 */
export function setGrid(g: GameSave, grid: (string | null)[]): GameSave {
  const party: (string | null)[] = Array(g.party.length).fill(null)
  let count = 0
  grid.slice(0, party.length).forEach((id, i) => {
    if (id && g.members.some((m) => m.id === id) && !party.includes(id) && count < PARTY_MAX) {
      party[i] = id
      count++
    }
  })
  const members = g.members.map((m) => (party.includes(m.id) ? { ...m, row: cellRow(party.indexOf(m.id)) } : m))
  return { ...g, party, members }
}

export function allocateStat(m: Member, key: StatKey): Member {
  if (m.statPoints <= 0) return m
  if (memberStats(m)[key] >= STAT_CAP) return m
  return { ...m, statPoints: m.statPoints - 1, alloc: { ...m.alloc, [key]: m.alloc[key] + 1 } }
}

/** 여러 포인트를 한 번에 분배 (미리보기 → 확정). 포인트·상한을 넘는 요청은 무시 */
export function allocateMany(m: Member, add: Alloc): Member {
  let cur = m
  for (const k of Object.keys(add) as StatKey[]) {
    for (let i = 0; i < add[k]; i++) cur = allocateStat(cur, k)
  }
  return cur
}

export interface ExpApplied {
  member: Member
  levelsGained: number
}

export function applyExp(m: Member, gained: number): ExpApplied {
  const r = grantExp(m.level, m.exp, gained)
  return {
    member: {
      ...m,
      level: r.level,
      exp: r.exp,
      statPoints: m.statPoints + r.levelsGained * STAT_POINTS_PER_LEVEL,
      skillPoints: m.skillPoints + r.levelsGained * SKILL_POINTS_PER_LEVEL,
    },
    levelsGained: r.levelsGained,
  }
}

export function updateMember(g: GameSave, next: Member): GameSave {
  return { ...g, members: g.members.map((m) => (m.id === next.id ? next : m)) }
}
