export * from './types'
export { simulate } from './battle'
export { createRng } from './rng'
export type { Rng } from './rng'
export { SKILLS } from './data/skills'
export { STATUS_DEFS } from './data/statuses'
export { PRESETS, TEAMS, makeTeam } from './data/presets'

import type { BattleConfig } from './types'

// §10 튜닝 값. 10명이 싸우므로 100은 인당 10회에 불과해 교착전이 무승부로 잘렸다 (훈련장 관찰).
export const DEFAULT_CONFIG: BattleConfig = {
  maxActions: 300,
  extendActions: 30,
  maxExtends: 5,
  statusReportInterval: 10,
}
