// 2차 직업 (M2-5b). ADR-003: 트리를 깊게 하지 않고 **수칙 훅**으로 넓힌다.
//
// 각 2차 직업은 "스탯이 조금 더 좋은 직업"이 아니라 **수칙을 다르게 짜게 만드는 직업**이다.
// 그래서 셋을 준다:
//   1. 훅 특성 — 특정 조건·행동을 쓸 때만 값이 나온다 (data/traits.ts)
//   2. 대표 스킬 한둘 — 그 훅을 쓸 도구
//   3. 작은 스탯 보정 — 방향만 잡아 주는 정도. 승부를 가르지 않는다
//
// docs/18 이 "행동 사이의 값 차이가 작다"를 문제로 지목했다. 훅은 그 차이를 만드는 장치다.
import type { StatKey } from '../types'

export type HookKind = 'guard' | 'lowHp' | 'dot' | 'interrupt' | 'aoe' | 'order' | 'slots' | 'smite' | 'snipe' | 'control'

export interface JobAdvanceDef {
  id: string
  name: string
  /** 1차 직업 id */
  base: string
  /** 전직 가능 레벨 (직업마다 18~22 차등 — docs/07 §3.3) */
  level: number
  /** 수칙 훅 한 줄. 화면에 그대로 보여 준다 */
  hook: string
  hookKind: HookKind
  /** 붙는 특성 (data/traits.ts) */
  traits: string[]
  /** 전직 즉시 배우는 대표 스킬 */
  grants: string[]
  /** 이 직업만 포인트로 배울 수 있는 스킬 */
  learnable: { skillId: string; cost: number }[]
  /** 전직 시 한 번 더해지는 스탯 (분배 포인트가 아니라 기본값 보정) */
  bonus: Partial<Record<StatKey | 'maxHp' | 'maxSp' | 'def' | 'mdef', number>>
  /** 도감·전직 화면의 한 줄 설명 */
  brief: string
}

export const JOB_ADVANCES: JobAdvanceDef[] = [
  // ───────── 전사 → 지킬 것인가, 무너뜨릴 것인가
  {
    id: 'guardian',
    name: '수호기사',
    base: 'warrior',
    level: 20,
    hook: '엄호로 받는 피해가 크게 줄어든다. "아군이 위험할 때" 조건을 쓸수록 강해진다',
    hookKind: 'guard',
    traits: ['aegis', 'ironWill'],
    grants: ['bulwark'],
    learnable: [{ skillId: 'taunt', cost: 3 }],
    bonus: { maxHp: 240, def: 10, mdef: 6 },
    brief: '대신 맞는 것이 일이다. 엄호 문턱을 낮게 잡을수록 값이 나온다.',
  },
  {
    id: 'berserker',
    name: '광전사',
    base: 'warrior',
    level: 20,
    hook: 'HP 가 40% 아래로 떨어지면 스스로 분노한다. "내 HP 이하" 조건이 방아쇠가 된다',
    hookKind: 'lowHp',
    traits: ['bloodRage'],
    grants: ['recklessSwing'],
    learnable: [{ skillId: 'bloodlust', cost: 3 }],
    bonus: { maxHp: 120, str: 14, spd: 6 },
    brief: '몰릴수록 세진다. 회복을 늦게 잡는 수칙과 맞물린다.',
  },

  // ───────── 도적 → 독으로 말릴 것인가, 시전을 끊을 것인가
  {
    id: 'assassin',
    name: '암살자',
    base: 'rogue',
    level: 18,
    hook: '내가 건 지속 피해가 50% 더 아프다. "적 독 수" 조건으로 관리하면 값이 커진다',
    hookKind: 'dot',
    traits: ['venomcraft'],
    grants: ['toxicBlade'],
    learnable: [{ skillId: 'markPrey', cost: 3 }],
    bonus: { dex: 12, spd: 8, maxSp: 20 },
    brief: '한 번에 죽이지 않는다. 독을 겹치고 기다린다.',
  },
  {
    id: 'saboteur',
    name: '파괴공작원',
    base: 'rogue',
    level: 18,
    hook: '시전을 끊을 때 게이지를 훨씬 크게 깎는다. "적이 시전 중" 조건이 전부다',
    hookKind: 'interrupt',
    traits: ['disruptor', 'eager'],
    grants: ['disrupt'],
    learnable: [{ skillId: 'smokeBomb', cost: 3 }],
    bonus: { dex: 8, spd: 14, maxSp: 20 },
    brief: '적이 준비 동작에 들어가는 순간이 전부다. 그 조건 하나에 수칙을 건다.',
  },

  // ───────── 마법사 → 넓게 칠 것인가, 순서를 바꿀 것인가
  {
    id: 'elementalist',
    name: '원소술사',
    base: 'mage',
    level: 20,
    hook: '시전이 20% 빨라지고 광역기가 늘어난다. "적 생존자 수" 조건으로 갈라 쓴다',
    hookKind: 'aoe',
    traits: ['quickCast'],
    grants: ['maelstrom'],
    learnable: [{ skillId: 'emberfall', cost: 3 }],
    bonus: { int: 14, maxSp: 40 },
    brief: '한 번에 여럿을 친다. 적이 적을 땐 손해라 조건이 필요하다.',
  },
  {
    id: 'chronomancer',
    name: '시간술사',
    base: 'mage',
    level: 20,
    hook: '아군의 행동 순서를 직접 민다. 누가 먼저 움직일지를 수칙으로 설계하게 된다',
    hookKind: 'order',
    traits: ['foresight'],
    grants: ['hasten'],
    learnable: [{ skillId: 'stasis', cost: 4 }],
    bonus: { int: 10, spd: 10, maxSp: 30 },
    brief: '누구를 먼저 움직이게 할 것인가. 이 게임에서 가장 어려운 수칙을 쓴다.',
  },

  // ───────── 프리스트 → 더 정교하게 지휘할 것인가, 직접 칠 것인가
  {
    id: 'bishop',
    name: '주교',
    base: 'priest',
    level: 20,
    hook: '패턴 칸이 2개 더 생긴다. 조건을 잘게 나눠 쓸 수 있다',
    hookKind: 'slots',
    traits: ['highLiturgy'],
    grants: ['sanctuary'],
    learnable: [{ skillId: 'benediction', cost: 4 }],
    bonus: { int: 10, maxSp: 40, mdef: 6 },
    brief: '가장 많은 칸을 쓴다. 정교한 지시를 감당하는 직업이다.',
  },
  {
    id: 'inquisitor',
    name: '심문관',
    base: 'priest',
    level: 20,
    hook: '상태이상에 걸린 적에게 크게 때린다. 독·침묵을 건 뒤 치는 순서를 짜게 된다',
    hookKind: 'smite',
    traits: ['zeal'],
    grants: ['judgment'],
    learnable: [{ skillId: 'condemn', cost: 3 }],
    bonus: { int: 12, str: 6, maxHp: 120 },
    brief: '치유만 하지 않는다. 걸어 놓고 친다.',
  },

  // ───────── 엘프 → 뒤를 칠 것인가, 묶을 것인가
  {
    id: 'ranger',
    name: '레인저',
    base: 'elf',
    level: 18,
    hook: '후열을 칠 때 25% 더 아프다. "적 후열 수" 조건으로 표적을 고른다',
    hookKind: 'snipe',
    traits: ['sniperEye', 'deadeye'],
    grants: ['volley'],
    learnable: [{ skillId: 'snipe', cost: 3 }],
    bonus: { dex: 14, spd: 6 },
    brief: '뒤에 선 것이 위험하다면 뒤를 친다. 치유자·시전자를 지운다.',
  },
  {
    id: 'warden',
    name: '수호자',
    base: 'elf',
    level: 18,
    hook: '묶은 적은 느려진다. 순서를 흐트러뜨려 아군이 먼저 움직이게 만든다',
    hookKind: 'control',
    traits: ['thornward'],
    grants: ['entangle'],
    learnable: [{ skillId: 'windArrow', cost: 3 }],
    bonus: { dex: 10, luk: 8, maxHp: 100 },
    brief: '적의 시계를 늦춘다. 시간술사와 반대쪽에서 같은 일을 한다.',
  },
]

export const JOB_ADVANCE: Record<string, JobAdvanceDef> = Object.fromEntries(JOB_ADVANCES.map((j) => [j.id, j]))

/** 이 1차 직업이 고를 수 있는 2차 직업 */
export const advancesFor = (baseJob: string): JobAdvanceDef[] => JOB_ADVANCES.filter((j) => j.base === baseJob)

/** 전직 가능 최소 레벨. 1차 직업마다 다르다 */
export function advanceLevel(baseJob: string): number {
  const list = advancesFor(baseJob)
  return list.length ? Math.min(...list.map((j) => j.level)) : Infinity
}

/** 전직할 수 있나 — 이미 전직했으면 못 한다 (되돌리기는 마을에서 금을 내고) */
export function canAdvance(baseJob: string, job2: string | undefined, level: number): boolean {
  return !job2 && advancesFor(baseJob).some((j) => level >= j.level)
}

/** 전직 취소 비용 (마을). 다시 고르려면 낸다 */
export const ADVANCE_RESET_GOLD = 400
