export * from './types'
export { simulate } from './battle'
export { createRng } from './rng'
export type { Rng } from './rng'
export { SKILLS } from './data/skills'
export { STATUS_DEFS } from './data/statuses'
export { TRAITS } from './data/traits'
export { PRESETS, TEAMS, makeTeam } from './data/presets'
export { MISSIONS, MISSION_BY_ID, missionTeams, missionChar, solutionOverrides, judgeMission } from './data/missions'
export type { Mission, MissionChar, MissionLimits, MissionObjective, SlotOverride, Verdict } from './data/missions'
export { analyze } from './analysis'
export {
  maxRuleRows, nextRuleRowInt, RULE_ROWS_BASE, RULE_ROWS_INT_STEPS,
  MAX_LEVEL, STAT_POINTS_PER_LEVEL, SKILL_POINTS_PER_LEVEL, STAT_CAP, EXP_TABLE, EMPTY_ALLOC,
  expToNext, grantExp, growthStats, scaleByLevel,
} from './progression'
export type { Alloc, ExpResult } from './progression'
export { derivedStats } from './derived'
export { STARTER_SKILLS, COMMON_LEARNABLE, LEARNABLE, SKILL_RESET_GOLD, learnableFor, learnCost, jobSkillPool } from './data/learning'
export type { Learnable } from './data/learning'
export type { DerivedStats } from './derived'
export { MONSTERS, monsterSetup } from './data/monsters'
export type { MonsterDef } from './data/monsters'
export { REGIONS, REGION_BY_ID, isRegionUnlocked, rollEncounter, battleRewards } from './data/regions'
export type { RegionDef, Rewards } from './data/regions'
export type { Analysis, TeamAnalysis } from './analysis'

import type { BattleConfig } from './types'

// §10 튜닝 값. 10명이 싸우므로 100은 인당 10회에 불과해 교착전이 무승부로 잘렸다 (훈련장 관찰).
export const DEFAULT_CONFIG: BattleConfig = {
  maxActions: 300,
  extendActions: 30,
  maxExtends: 5,
  statusReportInterval: 10,
}
