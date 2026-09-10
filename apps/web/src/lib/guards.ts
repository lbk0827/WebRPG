import type { GuardPolicy } from '@webrpg/engine'

export type GuardKey = 'always' | 'never' | 'hp30' | 'hp50' | 'hp75' | 'p25' | 'p50' | 'p75'

export const GUARDS: { key: GuardKey; label: string; policy: GuardPolicy }[] = [
  { key: 'always', label: '항상 엄호', policy: { mode: 'always' } },
  { key: 'never', label: '엄호 안 함', policy: { mode: 'never' } },
  { key: 'hp30', label: 'HP 30% 넘을 때 엄호', policy: { mode: 'hpAbove', pct: 30 } },
  { key: 'hp50', label: 'HP 50% 넘을 때 엄호', policy: { mode: 'hpAbove', pct: 50 } },
  { key: 'hp75', label: 'HP 75% 넘을 때 엄호', policy: { mode: 'hpAbove', pct: 75 } },
  { key: 'p25', label: '25% 확률로 엄호', policy: { mode: 'chance', pct: 25 } },
  { key: 'p50', label: '50% 확률로 엄호', policy: { mode: 'chance', pct: 50 } },
  { key: 'p75', label: '75% 확률로 엄호', policy: { mode: 'chance', pct: 75 } },
]

export const guardKey = (g: GuardPolicy): GuardKey =>
  g.mode === 'always' ? 'always' : g.mode === 'never' ? 'never' : g.mode === 'hpAbove' ? (`hp${g.pct}` as GuardKey) : (`p${g.pct}` as GuardKey)

export const guardLabel = (g: GuardPolicy): string => GUARDS.find((x) => x.key === guardKey(g))?.label ?? '엄호'

export const guardByKey = (k: string): GuardPolicy => GUARDS.find((g) => g.key === k)?.policy ?? { mode: 'never' }
