// 단원 ↔ 전투 CharSetup 변환, 성장 처리.
import type { Alloc, CharSetup, StatKey, Stats, TeamSetup } from '@webrpg/engine'
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

export const partyTeam = (g: GameSave): TeamSetup => ({ name: g.name, members: partyMembers(g).map(memberSetup) })

/** 편성 요약 (상태줄·비교 카드용) */
export function partySummary(g: GameSave): { count: number; avgLevel: number; levelSum: number; hpSum: number } {
  const ms = partyMembers(g)
  const levelSum = ms.reduce((s, m) => s + m.level, 0)
  const hpSum = ms.reduce((s, m) => s + memberStats(m).maxHp, 0)
  return { count: ms.length, avgLevel: ms.length ? Math.round(levelSum / ms.length) : 0, levelSum, hpSum }
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
