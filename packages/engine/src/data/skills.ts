// M1 스킬 세트 (§6.5). 전부 데이터 — 코드 수정 없이 추가/변경 가능해야 한다.
// id 와 label 은 역할 원형의 임시 명칭이며 고유명사는 미확정 (ADR-002 §6).
import type { Skill, SkillBook } from '../types'

const list: Skill[] = [
  {
    id: 'strike',
    label: '기본 공격',
    spCost: 0,
    target: { side: 'enemy', scope: 'single', hits: 1 },
    charge: 0,
    stiff: 0,
    effects: [{ kind: 'damage', school: 'phys', power: 100 }],
  },
  {
    id: 'heavyBlow',
    label: '강타',
    spCost: 8,
    target: { side: 'enemy', scope: 'single', hits: 1 },
    charge: 250,
    stiff: 100,
    effects: [{ kind: 'damage', school: 'phys', power: 190 }],
  },
  {
    id: 'flurry',
    label: '연타',
    spCost: 10,
    target: { side: 'enemy', scope: 'single', hits: 3 },
    charge: 0,
    stiff: 50,
    effects: [{ kind: 'damage', school: 'phys', power: 55 , scaleBy: 'dex' }],
  },
  {
    id: 'sweep',
    label: '휩쓸기',
    spCost: 14,
    target: { side: 'enemy', scope: 'all', hits: 1 },
    charge: 150,
    stiff: 100,
    effects: [{ kind: 'damage', school: 'phys', power: 80 }],
  },
  {
    id: 'bolt',
    label: '마력탄',
    spCost: 6,
    target: { side: 'enemy', scope: 'single', hits: 1 },
    charge: 0,
    stiff: 0,
    effects: [{ kind: 'damage', school: 'magic', power: 115 }],
  },
  {
    id: 'inferno',
    label: '대화염',
    spCost: 22,
    target: { side: 'enemy', scope: 'multi', hits: 4 },
    charge: 600,
    stiff: 100,
    ignoreCover: true,
    effects: [{ kind: 'damage', school: 'magic', power: 110 }],
  },
  {
    id: 'pierceShot',
    label: '관통 사격',
    spCost: 12,
    target: { side: 'enemy', scope: 'single', hits: 1 },
    priority: { mode: 'prefer', by: 'backRow' },
    charge: 0,
    stiff: 50,
    ignoreCover: true,
    effects: [{ kind: 'damage', school: 'phys', power: 120 , scaleBy: 'dex' }],
  },
  {
    id: 'mend',
    label: '치유',
    spCost: 10,
    target: { side: 'ally', scope: 'single', hits: 1 },
    priority: { mode: 'prefer', by: 'lowestHpPct' },
    charge: 0,
    stiff: 0,
    isSupport: true,
    effects: [{ kind: 'heal', power: 130 }],
  },
  {
    id: 'prayer',
    label: '기원',
    spCost: 20,
    target: { side: 'ally', scope: 'all', hits: 1 },
    charge: 300,
    stiff: 50,
    isSupport: true,
    // 셋 이상이 다쳤을 때만 치유 세 번보다 낫다. 한 명만 다쳤으면 낭비다
    effects: [{ kind: 'heal', power: 95 }],
  },
  {
    id: 'resurrect',
    label: '소생',
    spCost: 30,
    target: { side: 'ally', scope: 'single', hits: 1 },
    priority: { mode: 'require', by: 'dead' },
    charge: 500,
    stiff: 100,
    isSupport: true,
    effects: [{ kind: 'revive', hpPct: 30 }],
  },
  {
    id: 'warCry',
    label: '전의 고양',
    spCost: 8,
    target: { side: 'self', scope: 'single', hits: 1 },
    charge: 0,
    stiff: 0,
    isSupport: true,
    effects: [{ kind: 'applyStatus', status: 'atkUp', duration: 3, magnitude: 35 }],
  },
  {
    id: 'sunder',
    label: '갑주 파쇄',
    spCost: 6,
    target: { side: 'enemy', scope: 'single', hits: 1 },
    priority: { mode: 'prefer', by: 'highestHpPct' },
    charge: 0,
    stiff: 0,
    // 피해가 아니라 판을 까는 기술이다. 단단한 상대에게 먼저 쓰면 뒤의 모든 타격이 값싸진다.
    // 물렁한 상대에게는 그냥 때리는 것만 못하다 — 그래서 "언제 쓰나"가 선택이 된다 (docs/18)
    effects: [
      { kind: 'damage', school: 'phys', power: 55 },
      { kind: 'applyStatus', status: 'defDown', duration: 5, magnitude: 45 },
    ],
  },
  {
    id: 'stagger',
    label: '흔들기',
    spCost: 10,
    target: { side: 'enemy', scope: 'single', hits: 1 },
    priority: { mode: 'require', by: 'casting' },
    charge: 0,
    stiff: 0,
    ignoreCover: true,
    effects: [
      { kind: 'damage', school: 'phys', power: 40 , scaleBy: 'dex' },
      { kind: 'modifyGauge', delta: -500 },
    ],
  },
  {
    id: 'hush',
    label: '침묵',
    spCost: 12,
    target: { side: 'enemy', scope: 'single', hits: 1 },
    priority: { mode: 'require', by: 'casting' },
    charge: 0,
    stiff: 50,
    ignoreCover: true,
    effects: [{ kind: 'applyStatus', status: 'silence', duration: 2 }],
  },
  {
    id: 'ward',
    label: '보호막',
    spCost: 12,
    target: { side: 'ally', scope: 'single', hits: 1 },
    priority: { mode: 'prefer', by: 'lowestHpPct' },
    charge: 0,
    stiff: 0,
    isSupport: true,
    effects: [{ kind: 'shield', hits: 2 }],
  },
  {
    id: 'cleanse',
    label: '정화',
    spCost: 8,
    target: { side: 'ally', scope: 'single', hits: 1 },
    priority: { mode: 'require', by: 'debuffed' },
    charge: 0,
    stiff: 0,
    isSupport: true,
    effects: [{ kind: 'removeStatus', category: 'debuff' }],
  },
  {
    id: 'venom',
    label: '독 바르기',
    spCost: 8,
    target: { side: 'enemy', scope: 'single', hits: 1 },
    charge: 0,
    stiff: 0,
    effects: [
      { kind: 'damage', school: 'phys', power: 60 , scaleBy: 'dex' },
      { kind: 'applyStatus', status: 'poison', duration: 4, magnitude: 5 },
    ],
  },
  {
    id: 'venomStrong',
    label: '맹독',
    spCost: 8,
    target: { side: 'enemy', scope: 'single', hits: 1 },
    charge: 0,
    stiff: 0,
    effects: [
      { kind: 'damage', school: 'phys', power: 40 , scaleBy: 'dex' },
      { kind: 'applyStatus', status: 'poison', duration: 5, magnitude: 10 },
    ],
  },
  {
    id: 'meditate',
    label: '명상',
    spCost: 0,
    target: { side: 'self', scope: 'single', hits: 1 },
    charge: 0,
    stiff: 100,
    isSupport: true,
    effects: [{ kind: 'restoreSp', power: 40 }],
  },

  // ── M2-2 습득 스킬 (docs/07 §3.8c). 공용 0포인트 둘 + 직업별 2~3
  {
    id: 'guardStance',
    label: '방어 자세',
    spCost: 0,
    target: { side: 'self', scope: 'single', hits: 1 },
    charge: 0,
    stiff: 0,
    isSupport: true,
    // 다음 내 차례까지 받는 피해 −40%
    effects: [{ kind: 'applyStatus', status: 'defUp', duration: 1, magnitude: 40 }],
  },
  {
    id: 'catchBreath',
    label: '숨 고르기',
    spCost: 0,
    target: { side: 'self', scope: 'single', hits: 1 },
    charge: 0,
    stiff: 150,
    isSupport: true,
    effects: [{ kind: 'restoreSp', power: 25 }],
  },
  {
    id: 'ironSkin',
    label: '굳히기',
    spCost: 8,
    target: { side: 'self', scope: 'single', hits: 1 },
    charge: 0,
    stiff: 0,
    isSupport: true,
    effects: [{ kind: 'applyStatus', status: 'defUp', duration: 3, magnitude: 45 }],
  },
  {
    id: 'shieldBash',
    label: '방패 밀치기',
    spCost: 10,
    target: { side: 'enemy', scope: 'single', hits: 1 },
    charge: 100,
    stiff: 50,
    effects: [
      { kind: 'damage', school: 'phys', power: 70 },
      { kind: 'moveRow', who: 'target', to: 'back' },
    ],
  },
  {
    id: 'backstep',
    label: '물러서기',
    spCost: 4,
    target: { side: 'self', scope: 'single', hits: 1 },
    charge: 0,
    stiff: 0,
    isSupport: true,
    effects: [
      { kind: 'moveRow', who: 'self', to: 'back' },
      { kind: 'applyStatus', status: 'spdUp', duration: 2, magnitude: 30 },
    ],
  },
  {
    id: 'ambush',
    label: '급습',
    spCost: 12,
    target: { side: 'enemy', scope: 'single', hits: 1 },
    charge: 150,
    stiff: 50,
    // 후열에서 쓰면 2배 넘게 — 물러서기와 짝
    effects: [{ kind: 'damage', school: 'phys', power: 90, scaleBy: 'dex', rowBonus: { selfRow: 'back', power: 200 } }],
  },
  {
    id: 'frostbind',
    label: '얼음 결박',
    spCost: 10,
    target: { side: 'enemy', scope: 'single', hits: 1 },
    charge: 0,
    stiff: 50,
    effects: [
      { kind: 'damage', school: 'magic', power: 70 },
      { kind: 'applyStatus', status: 'spdDown', duration: 3, magnitude: 40 },
    ],
  },
  {
    id: 'manaBurn',
    label: '마력 소진',
    spCost: 8,
    target: { side: 'enemy', scope: 'single', hits: 1 },
    priority: { mode: 'prefer', by: 'backRow' },
    charge: 0,
    stiff: 50,
    ignoreCover: true,
    effects: [
      { kind: 'damage', school: 'magic', power: 40 },
      { kind: 'damageSp', power: 40 },
    ],
  },
  {
    id: 'fireball',
    label: '화염구',
    spCost: 14,
    target: { side: 'enemy', scope: 'single', hits: 1 },
    charge: 250,
    stiff: 100,
    effects: [{ kind: 'damage', school: 'magic', power: 170 }],
  },
  {
    id: 'bless',
    label: '축복',
    spCost: 8,
    target: { side: 'ally', scope: 'single', hits: 1 },
    priority: { mode: 'prefer', by: 'highestHpPct' },
    charge: 0,
    stiff: 0,
    isSupport: true,
    effects: [{ kind: 'applyStatus', status: 'atkUp', duration: 3, magnitude: 30 }],
  },
  {
    id: 'smite',
    label: '응징',
    spCost: 10,
    target: { side: 'enemy', scope: 'single', hits: 1 },
    charge: 100,
    stiff: 50,
    effects: [{ kind: 'damage', school: 'magic', power: 130 }],
  },
  {
    id: 'poisonArrow',
    label: '독화살',
    spCost: 10,
    target: { side: 'enemy', scope: 'single', hits: 1 },
    priority: { mode: 'prefer', by: 'backRow' },
    charge: 0,
    stiff: 50,
    ignoreCover: true,
    effects: [
      { kind: 'damage', school: 'phys', power: 70, scaleBy: 'dex' },
      { kind: 'applyStatus', status: 'poison', duration: 4, magnitude: 6 },
    ],
  },
  // ── 주인공 전용 무기의 무기 스킬 (docs/31). `requires.weaponType: ['ego']` 이라 그 무기를 든 동안만 쓴다.
  // 직업이 "어떤 조건을 쓰면 값이 나오나"(훅)를 정하면, 무기는 그 훅을 쓸 **도구**를 준다.
  {
    // 나무 몽둥이. 끊기가 아니라 **늦추기** — 시전은 침묵으로만 끊긴다.
    // 대상이 없으면(아무도 시전 안 하면) 그 줄을 건너뛴다 → "적 시전 ≥ 1" 조건을 처음 배우는 자리
    id: 'headKnock',
    label: '머리 치기',
    spCost: 6,
    target: { side: 'enemy', scope: 'single', hits: 1 },
    priority: { mode: 'require', by: 'casting' },
    charge: 0,
    stiff: 50,
    ignoreCover: true,
    requires: { weaponType: ['ego'] },
    effects: [
      { kind: 'damage', school: 'phys', power: 110 },
      { kind: 'modifyGauge', delta: -400 },
    ],
  },
  {
    // 에고 소드 · 에고 블레이드. 동료의 차례를 당긴다 —
    // 동료가 긴 기술을 준비하는 동안 쓰면 시전이 빨리 끝나 끊길 틈이 줄어든다
    id: 'rally',
    label: '구령',
    spCost: 12,
    target: { side: 'ally', scope: 'all', hits: 1 },
    charge: 0,
    stiff: 100,
    isSupport: true,
    requires: { weaponType: ['ego'] },
    effects: [{ kind: 'modifyGauge', delta: 200 }],
  },
  {
    // 에고 소드. 동료가 깎아 놓은 쪽을 마무리한다 — 적 하나가 줄면 그쪽 차례가 통째로 사라진다
    id: 'wedge',
    label: '쐐기',
    spCost: 10,
    target: { side: 'enemy', scope: 'single', hits: 1 },
    priority: { mode: 'prefer', by: 'lowestHpPct' },
    charge: 0,
    stiff: 50,
    requires: { weaponType: ['ego'] },
    effects: [{ kind: 'damage', school: 'phys', power: 150 }],
  },
  {
    // 에고 블레이드. 후열에서 뛰어들면 두 배로 치고 **앞줄로 나온다**.
    // 물러서기(후열로)와 짝지어 "빠졌다가 뛰어드는" 순환을 수칙으로 짜게 만든다.
    // damage 가 moveRow 보다 **앞에** 있어야 한다 — 뛰어들기 전의 자리로 위력을 판정한다
    id: 'plunge',
    label: '돌입',
    spCost: 10,
    target: { side: 'enemy', scope: 'single', hits: 1 },
    charge: 0,
    stiff: 50,
    requires: { weaponType: ['ego'] },
    effects: [
      { kind: 'damage', school: 'phys', power: 80, scaleBy: 'dex', rowBonus: { selfRow: 'back', power: 160 } },
      { kind: 'moveRow', who: 'self', to: 'front' },
    ],
  },
  {
    // 용사의 검. 적을 쓰러뜨리기보다 **적의 칼을 무디게** 한다.
    // 공격↑ 이 걸린 적이 없으면 못 쓴다 — 전의 고양 · 봉화(docs/30)를 받아치는 줄이다
    id: 'breakingEdge',
    label: '꺾는 검',
    spCost: 12,
    target: { side: 'enemy', scope: 'single', hits: 1 },
    priority: { mode: 'require', by: 'hasStatus', status: 'atkUp' },
    charge: 0,
    stiff: 50,
    ignoreCover: true,
    requires: { weaponType: ['ego'] },
    effects: [
      { kind: 'damage', school: 'phys', power: 150 },
      { kind: 'applyStatus', status: 'atkDown', duration: 3, magnitude: 30 },
    ],
  },
  {
    // 다크 블레이드. **최대 HP 의 10%** 를 태우고 전원을 친다 (피의 분노와 곱해져 +110%).
    // "지금 HP" 가 아니라 최대 HP 라서 네 번 쓰면 40% 가 사라진다 — 어디서 멈추나가 수칙의 판단이다.
    // 선딜이 없으므로 끊기지 않는다. recoil 이 damage 보다 **앞에** 있어야 태운 만큼 세진다
    id: 'darkRelease',
    label: '어둠 해방',
    spCost: 18,
    target: { side: 'enemy', scope: 'all', hits: 1 },
    charge: 0,
    stiff: 150,
    cooldown: 2,
    requires: { weaponType: ['ego'] },
    effects: [
      { kind: 'recoil', pct: 10 },
      { kind: 'damage', school: 'phys', power: 110 },
    ],
  },
  {
    // 적 전용 (docs/30 봉화 조). 끊지 않으면 저쪽 전원이 세지고 빨라진다. 준비가 길어 끊을 틈이 분명하다
    id: 'signalFire',
    label: '봉화',
    spCost: 16,
    target: { side: 'ally', scope: 'all', hits: 1 },
    charge: 700,
    stiff: 100,
    isSupport: true,
    effects: [
      { kind: 'applyStatus', status: 'atkUp', duration: 3, magnitude: 70 },
      { kind: 'modifyGauge', delta: 300 },
    ],
  },
  {
    // 적 전용 대형 시전. 끊지 않으면 전열이 통째로 무너진다 (docs/18 §6 B)
    id: 'hex',
    label: '주박',
    spCost: 20,
    target: { side: 'enemy', scope: 'all', hits: 1 },
    charge: 700,
    stiff: 150,
    ignoreCover: true,
    effects: [
      { kind: 'damage', school: 'magic', power: 105 },
      { kind: 'applyStatus', status: 'poison', duration: 4, magnitude: 8 },
    ],
  },
  {
    // 적 전용 회복. 후열에 서서 계속 되돌린다 — 뒤를 치지 않으면 앞이 안 죽는다
    id: 'mendChant',
    label: '치유 주문',
    spCost: 12,
    target: { side: 'ally', scope: 'single', hits: 1 },
    priority: { mode: 'prefer', by: 'lowestHpPct' },
    charge: 150,
    stiff: 50,
    isSupport: true,
    effects: [{ kind: 'heal', power: 150 }],
  },
  {
    id: 'snipe',
    label: '저격',
    spCost: 14,
    target: { side: 'enemy', scope: 'single', hits: 1 },
    priority: { mode: 'prefer', by: 'backRow' },
    charge: 400,
    stiff: 100,
    ignoreCover: true,
    effects: [{ kind: 'damage', school: 'phys', power: 190, scaleBy: 'dex' }],
  },
  // ───────── 2차 직업 스킬 (M2-5b, data/jobs.ts). 훅을 쓸 도구다
  {
    id: 'bulwark', label: '방벽 선언', spCost: 16,
    target: { side: 'ally', scope: 'all', hits: 1 }, charge: 200, stiff: 50, isSupport: true,
    effects: [{ kind: 'shield', hits: 1 }],
  },
  {
    id: 'taunt', label: '도발', spCost: 8,
    target: { side: 'enemy', scope: 'all', hits: 1 }, charge: 0, stiff: 0, ignoreCover: true,
    effects: [{ kind: 'applyStatus', status: 'atkDown', duration: 3, magnitude: 25 }],
  },
  {
    id: 'recklessSwing', label: '무모한 일격', spCost: 10,
    target: { side: 'enemy', scope: 'single', hits: 1 }, charge: 50, stiff: 100,
    // **지금 남은 HP 의 4분의 1을 태우고** 그만큼 세게 친다 (광전사의 피의 분노).
    // 만피에서 태우면 전력, 빈사에서 태우면 헛수고다 — 그래서 "언제 태우나"가 수칙의 판단이 된다.
    // recoil 이 damage 보다 **앞에** 있어야 한다. 태운 양이 그 타격의 위력이기 때문이다
    effects: [
      { kind: 'recoil', pct: 25, gauge: 100, ofCurrent: true },
      { kind: 'damage', school: 'phys', power: 170 },
    ],
  },
  {
    id: 'bloodlust', label: '혈갈', spCost: 12,
    target: { side: 'enemy', scope: 'single', hits: 1 }, charge: 0, stiff: 50,
    effects: [{ kind: 'damage', school: 'phys', power: 130 }, { kind: 'drain', resource: 'hp', pct: 35 }],
  },
  {
    id: 'toxicBlade', label: '맹독 칼날', spCost: 14,
    target: { side: 'enemy', scope: 'single', hits: 2 }, charge: 0, stiff: 50,
    effects: [
      { kind: 'damage', school: 'phys', power: 60, scaleBy: 'dex' },
      { kind: 'applyStatus', status: 'poison', duration: 5, magnitude: 7 },
    ],
  },
  {
    id: 'markPrey', label: '표적 지정', spCost: 8,
    target: { side: 'enemy', scope: 'single', hits: 1 }, priority: { mode: 'prefer', by: 'highestHpPct' },
    charge: 0, stiff: 0, ignoreCover: true,
    effects: [{ kind: 'applyStatus', status: 'defDown', duration: 4, magnitude: 35 }],
  },
  {
    id: 'disrupt', label: '차단', spCost: 14,
    target: { side: 'enemy', scope: 'single', hits: 1 }, priority: { mode: 'require', by: 'casting' },
    charge: 0, stiff: 0, ignoreCover: true,
    effects: [
      { kind: 'damage', school: 'phys', power: 70, scaleBy: 'dex' },
      { kind: 'modifyGauge', delta: -600 },
      { kind: 'applyStatus', status: 'silence', duration: 2 },
    ],
  },
  {
    id: 'smokeBomb', label: '연막', spCost: 12,
    target: { side: 'enemy', scope: 'all', hits: 1 }, charge: 0, stiff: 50, ignoreCover: true,
    effects: [{ kind: 'modifyGauge', delta: -150 }],
  },
  {
    id: 'maelstrom', label: '난류', spCost: 26,
    target: { side: 'enemy', scope: 'all', hits: 1 }, charge: 500, stiff: 100, ignoreCover: true,
    effects: [{ kind: 'damage', school: 'magic', power: 135 }],
  },
  {
    id: 'emberfall', label: '잔불', spCost: 16,
    target: { side: 'enemy', scope: 'multi', hits: 3 }, charge: 300, stiff: 50, ignoreCover: true,
    effects: [{ kind: 'damage', school: 'magic', power: 95 }],
  },
  {
    id: 'hasten', label: '가속', spCost: 18,
    target: { side: 'ally', scope: 'all', hits: 1 }, charge: 0, stiff: 50, isSupport: true,
    // 팀 전체의 박자를 당긴다. 한 명만 밀어서는 한 턴 값을 못 한다
    effects: [{ kind: 'modifyGauge', delta: 260 }, { kind: 'applyStatus', status: 'spdUp', duration: 4, magnitude: 30 }],
  },
  {
    id: 'stasis', label: '정지', spCost: 16,
    target: { side: 'enemy', scope: 'single', hits: 1 }, charge: 150, stiff: 100, ignoreCover: true,
    effects: [{ kind: 'modifyGauge', delta: -700 }, { kind: 'applyStatus', status: 'spdDown', duration: 4, magnitude: 40 }],
  },
  {
    id: 'sanctuary', label: '성역', spCost: 22,
    target: { side: 'ally', scope: 'all', hits: 1 }, charge: 350, stiff: 50, isSupport: true,
    effects: [{ kind: 'heal', power: 60 }, { kind: 'applyStatus', status: 'defUp', duration: 3, magnitude: 30 }],
  },
  {
    id: 'benediction', label: '은사', spCost: 18,
    target: { side: 'ally', scope: 'single', hits: 1 }, priority: { mode: 'prefer', by: 'lowestHpPct' },
    charge: 0, stiff: 50, isSupport: true,
    effects: [{ kind: 'heal', power: 170 }, { kind: 'removeStatus', category: 'debuff' }],
  },
  {
    id: 'judgment', label: '심판', spCost: 12,
    target: { side: 'enemy', scope: 'single', hits: 1 }, priority: { mode: 'require', by: 'debuffed' },
    charge: 100, stiff: 50, ignoreCover: true,
    effects: [{ kind: 'damage', school: 'magic', power: 200 }],
  },
  {
    id: 'condemn', label: '단죄', spCost: 20,
    target: { side: 'enemy', scope: 'all', hits: 1 }, charge: 200, stiff: 50,
    // **적 전원**의 공격을 깎는다. 한 차례로 여러 차례의 치유를 덜어 내는 기술이다 —
    // 심문관이 주교와 겨룰 수 있는 유일한 축이다 ("예방이 치료보다 싸다", docs/18 §13).
    // 열의(세기 +20%)가 붙으면 약화가 22 → 26 이 된다
    effects: [
      { kind: 'damage', school: 'magic', power: 55 },
      { kind: 'applyStatus', status: 'atkDown', duration: 3, magnitude: 22 },
    ],
  },
  {
    id: 'volley', label: '화살비', spCost: 18,
    target: { side: 'enemy', scope: 'all', hits: 1 }, priority: { mode: 'prefer', by: 'backRow' },
    charge: 250, stiff: 100, ignoreCover: true,
    effects: [{ kind: 'damage', school: 'phys', power: 85, scaleBy: 'dex' }],
  },
  {
    id: 'entangle', label: '얽매기', spCost: 12,
    target: { side: 'enemy', scope: 'multi', hits: 2 }, charge: 0, stiff: 50, ignoreCover: true,
    // 둘을 한꺼번에 묶는다. 수호자의 훅(독술 25%)이 둔화에도 얹힌다
    effects: [
      { kind: 'damage', school: 'phys', power: 70, scaleBy: 'dex' },
      { kind: 'applyStatus', status: 'spdDown', duration: 5, magnitude: 40 },
      { kind: 'modifyGauge', delta: -300 },
    ],
  },
  {
    id: 'windArrow', label: '바람 화살', spCost: 10,
    target: { side: 'enemy', scope: 'multi', hits: 2 }, charge: 0, stiff: 50, ignoreCover: true,
    effects: [{ kind: 'damage', school: 'phys', power: 75, scaleBy: 'dex' }],
  },

  // ───────── 오의 — 2차 직업마다 하나, Lv40 부터 배운다 (만렙 50 확장, docs/22 §7)
  // HOF·제로식의 후반 기술처럼 **조건부 · 1회 제한 · 긴 준비**를 붙였다. 세지만 "언제 쓰나"를 수칙이 답해야 한다
  {
    id: 'fortress', label: '요새', spCost: 30,
    target: { side: 'ally', scope: 'all', hits: 1 }, charge: 300, stiff: 100, isSupport: true, perBattle: 1,
    // 수호기사: 전원을 두 번 막는다. 한 번뿐이라 "언제 세우나"가 수칙이다
    effects: [{ kind: 'shield', hits: 2 }, { kind: 'applyStatus', status: 'defUp', duration: 4, magnitude: 35 }],
  },
  {
    id: 'lastStand', label: '최후의 일격', spCost: 16,
    target: { side: 'enemy', scope: 'single', hits: 1 }, charge: 50, stiff: 150,
    // 광전사: 남은 HP 의 절반을 태운다. 만피에서 쓰면 피의 분노가 가장 크게 붙는다 — 빈사에서 쓰면 자멸이다
    effects: [
      { kind: 'recoil', pct: 50, gauge: 150, ofCurrent: true },
      { kind: 'damage', school: 'phys', power: 230 },
    ],
  },
  {
    id: 'plague', label: '역병', spCost: 24,
    target: { side: 'enemy', scope: 'all', hits: 1 }, charge: 250, stiff: 100, ignoreCover: true,
    // 암살자: 적 전원에 독. 독술(세기 +50%)이 전원에게 붙는다
    effects: [
      { kind: 'damage', school: 'phys', power: 40, scaleBy: 'dex' },
      { kind: 'applyStatus', status: 'poison', duration: 5, magnitude: 9 },
    ],
  },
  {
    id: 'blackout', label: '암전', spCost: 22,
    target: { side: 'enemy', scope: 'all', hits: 1 }, charge: 0, stiff: 100, ignoreCover: true, cooldown: 4,
    // 파괴공작원: 적 전원의 게이지를 깎고 한 차례 입을 막는다. 교란(깎는 세기 +80%)이 붙는다
    effects: [{ kind: 'modifyGauge', delta: -400 }, { kind: 'applyStatus', status: 'silence', duration: 1 }],
  },
  {
    id: 'starfall', label: '유성우', spCost: 40,
    target: { side: 'enemy', scope: 'all', hits: 1 }, charge: 800, stiff: 150, ignoreCover: true,
    // 원소술사: 이 게임에서 가장 긴 준비. 끊기면 아무 일도 없다 — 상대의 끊기꾼을 먼저 치울 것
    effects: [{ kind: 'damage', school: 'magic', power: 210 }],
  },
  {
    id: 'rewind', label: '되감기', spCost: 30,
    target: { side: 'ally', scope: 'all', hits: 1 }, charge: 0, stiff: 100, isSupport: true, perBattle: 1,
    // 시간술사: 아군 전원의 박자를 크게 당긴다. 한 번뿐이다
    effects: [{ kind: 'modifyGauge', delta: 500 }],
  },
  {
    id: 'miracle', label: '기적', spCost: 40,
    target: { side: 'ally', scope: 'all', hits: 1 }, charge: 400, stiff: 100, isSupport: true, perBattle: 1,
    // 주교: 전원을 크게 되돌리고 약화를 지운다. 한 번뿐이라 문턱을 잘 그어야 한다
    effects: [{ kind: 'heal', power: 150 }, { kind: 'removeStatus', category: 'debuff' }],
  },
  {
    id: 'verdict', label: '최후 심판', spCost: 24,
    target: { side: 'enemy', scope: 'single', hits: 1 }, priority: { mode: 'require', by: 'debuffed' },
    charge: 200, stiff: 100, ignoreCover: true,
    // 심문관: 약화된 적만 노린다. 열의(약화된 적 +35%)가 붙는다
    effects: [{ kind: 'damage', school: 'magic', power: 340 }],
  },
  {
    id: 'pinpoint', label: '일점 저격', spCost: 22,
    target: { side: 'enemy', scope: 'single', hits: 1 }, priority: { mode: 'prefer', by: 'backRow' },
    charge: 200, stiff: 100, ignoreCover: true,
    // 레인저: 후열을 방어 무시로 꿰뚫는다. 저격안·매의 눈이 붙는다
    effects: [{ kind: 'damage', school: 'phys', power: 260, scaleBy: 'dex', pierce: true }],
  },
  {
    id: 'rootbind', label: '대지의 속박', spCost: 24,
    target: { side: 'enemy', scope: 'all', hits: 1 }, charge: 150, stiff: 100, ignoreCover: true,
    // 수호자: 적 전원을 늦춘다. 가시 수호(세기 +25%)가 둔화에 붙는다
    effects: [
      { kind: 'damage', school: 'phys', power: 45, scaleBy: 'dex' },
      { kind: 'applyStatus', status: 'spdDown', duration: 4, magnitude: 45 },
      { kind: 'modifyGauge', delta: -250 },
    ],
  },

  // ───────── 만렙 50 확장 상대 전용 (docs/22 §5)
  {
    id: 'sandstorm', label: '모래폭풍', spCost: 18,
    target: { side: 'enemy', scope: 'all', hits: 1 }, charge: 300, stiff: 100, ignoreCover: true,
    // 모래바람 황야의 교재: 전원을 늦춘다. 정화·가속이 없으면 박자를 계속 뺏긴다
    effects: [{ kind: 'damage', school: 'magic', power: 60 }, { kind: 'applyStatus', status: 'spdDown', duration: 3, magnitude: 30 }],
  },
  {
    id: 'tidalWard', label: '조수의 장막', spCost: 20,
    target: { side: 'ally', scope: 'all', hits: 1 }, charge: 250, stiff: 50, isSupport: true,
    // 가라앉은 신전의 교재: 전원을 한 번 막고 조금 되돌린다. 연타로 보호막을 먼저 벗기거나 사제를 끊어라
    effects: [{ kind: 'shield', hits: 1 }, { kind: 'heal', power: 40 }],
  },
]

export const SKILLS: SkillBook = Object.fromEntries(list.map((s) => [s.id, s]))
