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

  // ───────── 2차 직업의 수칙 훅 (M2-5b, data/jobs.ts). 전부 "특정 조건을 써야" 값이 나온다
  { id: 'aegis', label: '수호', effects: [{ kind: 'coverDamagePct', pct: -30 }] },
  {
    id: 'bloodRage',
    label: '피의 분노',
    effects: [{ kind: 'trigger', on: 'lowHp', hpPct: 40, perBattle: 1, effect: { kind: 'applyStatus', status: 'atkUp', duration: 99, magnitude: 55 } }],
  },
  { id: 'venomcraft', label: '독술', effects: [{ kind: 'statusPowerPct', pct: 50 }] },
  { id: 'disruptor', label: '교란', effects: [{ kind: 'gaugeDamagePct', pct: 80 }] },
  { id: 'foresight', label: '예지', effects: [{ kind: 'startGauge', amount: 200 }, { kind: 'castTimePct', pct: -10 }] },
  { id: 'highLiturgy', label: '고전례', effects: [{ kind: 'ruleRows', add: 2 }] },
  { id: 'zeal', label: '열의', effects: [{ kind: 'damageVsDebuffedPct', pct: 35 }] },
  { id: 'deadeye', label: '매의 눈', effects: [{ kind: 'damageVsRowPct', row: 'back', pct: 15 }] },
  { id: 'thornward', label: '가시 수호', effects: [{ kind: 'statusPowerPct', pct: 25 }, { kind: 'resistPct', pct: 10 }] },
]

export const TRAITS: Record<string, TraitDef> = Object.fromEntries(list.map((t) => [t.id, t]))
