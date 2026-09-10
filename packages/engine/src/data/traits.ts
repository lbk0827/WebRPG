// 특성 (M2-0). 패시브 스킬과 장비 특성이 공용으로 쓰는 장치 — 전부 데이터.
// 단순 "+공격력"은 만들지 않는다 (그건 스탯이 한다). 수칙 설계와 맞물리는 것만.
import type { TraitDef } from '../types'

const list: TraitDef[] = [
  { id: 'quickCast', label: '속영창', effects: [{ kind: 'castTimePct', pct: -20 }] },
  { id: 'bulwark', label: '방벽', effects: [{ kind: 'coverDamagePct', pct: -15 }] },
  { id: 'sniperEye', label: '저격안', effects: [{ kind: 'damageVsRowPct', row: 'back', pct: 10 }] },
  { id: 'eager', label: '선봉', effects: [{ kind: 'startGauge', amount: 300 }] },
  { id: 'extraPattern', label: '암기', effects: [{ kind: 'ruleRows', add: 1 }] },
  { id: 'ironWill', label: '굳은 의지', effects: [{ kind: 'resistPct', pct: 10 }] },
  { id: 'secondWind', label: '재기', effects: [{ kind: 'trigger', on: 'lowHp', hpPct: 30, perBattle: 1, effect: { kind: 'heal', power: 80 } }] },
  { id: 'regen', label: '재생', effects: [{ kind: 'trigger', on: 'turnStart', effect: { kind: 'heal', power: 25 } }] },
]

export const TRAITS: Record<string, TraitDef> = Object.fromEntries(list.map((t) => [t.id, t]))
