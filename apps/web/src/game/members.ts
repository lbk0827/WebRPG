// 단원 ↔ 전투 CharSetup 변환, 성장 처리.
import type { CharSetup, StatKey, Stats, TeamSetup } from '@webrpg/engine'
import { PRESETS, STAT_CAP, STAT_POINTS_PER_LEVEL, SKILL_POINTS_PER_LEVEL, grantExp, growthStats } from '@webrpg/engine'
import type { GameSave, Member } from './save'

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

/** 편성된 단원 (슬롯 순서, 빈 슬롯 제외) */
export const partyMembers = (g: GameSave): Member[] => g.party.map((id) => memberById(g, id)).filter((m): m is Member => m !== undefined)

export const partyTeam = (g: GameSave): TeamSetup => ({ name: '내 용병단', members: partyMembers(g).map(memberSetup) })

export function allocateStat(m: Member, key: StatKey): Member {
  if (m.statPoints <= 0) return m
  if (memberStats(m)[key] >= STAT_CAP) return m
  return { ...m, statPoints: m.statPoints - 1, alloc: { ...m.alloc, [key]: m.alloc[key] + 1 } }
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
