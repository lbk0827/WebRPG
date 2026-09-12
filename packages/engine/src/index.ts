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
export { JOB_ADVANCES, JOB_ADVANCE, ADVANCE_RESET_GOLD, advancesFor, advanceLevel, canAdvance } from './data/jobs'
export type { JobAdvanceDef, HookKind } from './data/jobs'
export { HIRE, MEMBER_MAX, RENAME_GOLD, DISMISS_REFUND_PCT, HIRE_LEVEL_STEP, hireLevel, hirePrice, rollQuirk, applyQuirk } from './data/recruit'
export type { HireDef, Quirk } from './data/recruit'
export { ITEMS, ITEM_LIST, JOB_WEAPONS, WEAPON_TYPE_LABEL, SLOT_LABEL, SELL_PCT, sellPrice, canEquip, summarizeGear, applyGearStats, refinedNumbers } from './data/items'
export {
  MATERIALS, REFINE_MAX, REFINE_RATE, REFINE_PCT_PER_LEVEL, REFINE_MATERIAL, refineCost, refineRate, tryRefine, refineMult,
  RECIPES, RECIPE_BY_ID, CRAFT_TRAIT_PCT, CRAFT_TRAIT_POOL, rollCraftTrait, canCraft,
} from './data/crafting'
export type { MaterialDef, RefineCost, Recipe } from './data/crafting'
export type { GearSlot, ItemDef, ItemInstance, GearSummary } from './data/items'
export type { DerivedStats } from './derived'
export { MONSTERS, MONSTER_LIST, MONSTER_ICONS, ARCHETYPE_LABEL, isMonsterIcon, monsterSetup } from './data/monsters'
export type { MonsterDef, MonsterIcon, Archetype } from './data/monsters'
export { REGIONS, REGION_BY_ID, isRegionUnlocked, rollEncounter, battleRewards } from './data/regions'
export type { RegionDef, Rewards } from './data/regions'
export { ADVENTURES, ADVENTURE_BY_ID, WEEKDAY_LABEL, adventureTeam, adventureRewards } from './data/adventures'
export type { AdventureDef } from './data/adventures'
export type { Analysis, TeamAnalysis } from './analysis'

import type { BattleConfig } from './types'

// §10 튜닝 값. 10명이 싸우므로 100은 인당 10회에 불과해 교착전이 무승부로 잘렸다 (훈련장 관찰).
export const DEFAULT_CONFIG: BattleConfig = {
  maxActions: 300,
  extendActions: 30,
  maxExtends: 5,
  statusReportInterval: 10,
}
