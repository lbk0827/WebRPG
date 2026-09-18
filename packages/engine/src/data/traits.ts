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
    // **태운 최대 HP 1%p 마다 그 타격이 +11%.** 가만히 있으면 아무 값도 없다 — 패시브가 아니다.
    // 무모한 일격은 "지금 남은 HP 의 25%"를 태우므로, 만피에서 태우면 25%p → +275%,
    // 20% 만 남았을 때 태우면 5%p → +55% 뿐이다. **태울 피가 있을 때만 센 것이다.**
    // 그래서 수칙이 답해야 하는 질문이 생긴다 — "어디까지 태우고 어디서 멈추나."
    //
    // 2026-09-12: 원래는 "HP 40% 아래로 떨어지면 공격 +55%" 방아쇠였다. 적이 알아서 깎아 주므로
    // **수칙을 안 짜도 붙었다** — 훅이 아니라 힘 도약이었고, 실측 훅의 값이 −2 였다 (docs/18 §12).
    effects: [{ kind: 'recoilPowerPct', pct: 11 }],
  },
  { id: 'venomcraft', label: '독술', effects: [{ kind: 'statusPowerPct', pct: 50 }] },
  { id: 'disruptor', label: '교란', effects: [{ kind: 'gaugeDamagePct', pct: 80 }] },
  { id: 'foresight', label: '예지', effects: [{ kind: 'startGauge', amount: 200 }, { kind: 'castTimePct', pct: -10 }] },
  { id: 'highLiturgy', label: '고전례', effects: [{ kind: 'ruleRows', add: 2 }] },
  {
    id: 'zeal',
    label: '열의',
    // 걸고 친다. 약화를 **더 세게** 걸고, 그렇게 약해진 적을 **더 아프게** 친다.
    // 세기 보정이 핵심이다 — 심문관의 단죄(공격 약화)가 세지면 파티가 덜 맞고,
    // 그만큼 치유에 쓸 차례가 줄어든다. 프리스트 칸에서 주교와 겨룰 수 있는 유일한 축이다
    // (2026-09-13 측정: 그냥 때리는 쪽으로는 못 겨룬다 — docs/18 §13)
    effects: [{ kind: 'statusPowerPct', pct: 20 }, { kind: 'damageVsDebuffedPct', pct: 35 }],
  },
  { id: 'deadeye', label: '매의 눈', effects: [{ kind: 'damageVsRowPct', row: 'back', pct: 15 }] },
  { id: 'thornward', label: '가시 수호', effects: [{ kind: 'statusPowerPct', pct: 25 }, { kind: 'resistPct', pct: 10 }] },
]

export const TRAITS: Record<string, TraitDef> = Object.fromEntries(list.map((t) => [t.id, t]))
