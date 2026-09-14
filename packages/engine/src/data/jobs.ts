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
import { HERO_START_WEAPON } from './presets'

export type HookKind =
  | 'guard' | 'lowHp' | 'dot' | 'interrupt' | 'aoe' | 'order' | 'slots' | 'smite' | 'snipe' | 'control'
  // 주인공 계보 (docs/20) — 임시 훅. 기획이 나오면 바꾼다
  | 'guild' | 'wander' | 'brave' | 'fallen'

export interface JobAdvanceDef {
  id: string
  name: string
  /**
   * 앞 단계 — 1차 직업 id, 또는 **앞 전직 id**.
   * 다른 직업은 1차 → 2차 한 번뿐이다. 주인공은 모험가 → 길드원 → 용사처럼 **이어진다** (docs/20)
   */
  base: string
  /** 전직 가능 레벨 (1차 직업마다 18~22 차등 — docs/07 §3.3. 주인공은 15 · 30) */
  level: number
  /** 주인공 전용 무기가 이 전직에서 무엇으로 진화하나 (data/items.ts 의 bound 무기) */
  weapon?: string
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
    hook: '태운 HP 만큼 세게 친다. 만피에서 태우면 전력, 빈사에서 태우면 헛수고다. "내 HP" 조건으로 태울 구간과 멈출 선을 직접 그어야 한다',
    hookKind: 'lowHp',
    traits: ['bloodRage'],
    grants: ['recklessSwing'],
    learnable: [{ skillId: 'bloodlust', cost: 3 }],
    bonus: { maxHp: 120, str: 14, spd: 6 },
    brief: '자기 피를 태워 친다. 어디까지 태우고 어디서 멈출지가 수칙이다.',
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

  // ───────── 주인공 (2026-09-14 단장 기획, docs/20)
  // 모험가 →(Lv15) 길드원 · 떠돌이 →(Lv30) 용사 · 타락 용사 →(Lv50) 기획 중. **계보 고정** — 길드원 → 용사, 떠돌이 → 타락 용사.
  // 전직하면 전용 무기가 진화한다: 나무 몽둥이 → 에고 소드 / 에고 블레이드 → 용사의 검 / 다크 블레이드.
  // ⚠ 훅 · 스킬 · 보정은 **임시값**이다 — 기존 특성·스킬을 빌려 쓴다. 단장이 기획하면 바꾼다
  {
    id: 'guildMember',
    name: '길드원',
    base: 'adventurer',
    level: 15,
    weapon: 'egoSword',
    hook: '패턴 칸이 하나 늘어난다. 길드에서 맞춘 약속만큼 조건을 잘게 나눠 쓸 수 있다',
    hookKind: 'guild',
    traits: ['extraPattern'],
    grants: ['warCry'],
    learnable: [{ skillId: 'taunt', cost: 3 }],
    bonus: { maxHp: 100, str: 8, def: 6 },
    brief: '혼자가 아니게 된 모험가. 동료와 맞춘 수칙이 힘이다.',
  },
  {
    id: 'wanderer',
    name: '떠돌이',
    base: 'adventurer',
    level: 15,
    weapon: 'egoBlade',
    hook: '전투를 먼저 시작한다. 후열로 물러났다가 급습하는 순서를 수칙으로 짠다',
    hookKind: 'wander',
    traits: ['eager'],
    grants: ['ambush'],
    learnable: [{ skillId: 'backstep', cost: 2 }],
    bonus: { dex: 10, spd: 10, maxSp: 20 },
    brief: '어디에도 속하지 않는 모험가. 먼저 움직이고 먼저 빠진다.',
  },
  {
    id: 'brave',
    name: '용사',
    base: 'guildMember',
    level: 30,
    weapon: 'braveSword',
    hook: '엄호로 받는 피해가 크게 줄어든다. 동료가 위험할 때 앞에 서는 조건을 쓸수록 강하다',
    hookKind: 'brave',
    traits: ['aegis'],
    grants: ['bulwark'],
    learnable: [{ skillId: 'benediction', cost: 4 }],
    bonus: { maxHp: 160, str: 10, mdef: 8 },
    brief: '에고 소드가 용사의 검이 되었다. 지키는 검이다.',
  },
  {
    id: 'fallenHero',
    name: '타락 용사',
    base: 'wanderer',
    level: 30,
    weapon: 'darkBlade',
    hook: '태운 HP 만큼 세게 친다. 어디까지 태우고 어디서 멈출지를 "내 HP" 조건으로 긋는다',
    hookKind: 'fallen',
    traits: ['bloodRage'],
    grants: ['recklessSwing'],
    learnable: [{ skillId: 'bloodlust', cost: 3 }],
    bonus: { str: 14, spd: 6, maxHp: 80 },
    brief: '에고 블레이드가 어둠을 삼켰다. 힘은 피로 산다.',
  },
]

export const JOB_ADVANCE: Record<string, JobAdvanceDef> = Object.fromEntries(JOB_ADVANCES.map((j) => [j.id, j]))

/** 이 단계(1차 직업 id 또는 앞 전직 id)에서 고를 수 있는 다음 전직 */
export const advancesFor = (baseJob: string): JobAdvanceDef[] => JOB_ADVANCES.filter((j) => j.base === baseJob)

/**
 * 전직 사슬 — 가장 최근 전직 id 에서 1차 직업까지 거슬러 올라가 **앞 단계부터** 돌려준다.
 * 다른 직업은 한 칸이고, 주인공은 [길드원, 용사] 처럼 이어진다. 보정·특성·스킬은 사슬 전체가 쌓인다 (docs/20)
 */
export function advanceChain(job2?: string): JobAdvanceDef[] {
  const out: JobAdvanceDef[] = []
  for (let d = job2 ? JOB_ADVANCE[job2] : undefined; d; d = JOB_ADVANCE[d.base]) out.unshift(d)
  return out
}

/** 주인공 전용 무기 — 사슬에서 가장 최근에 진화한 것, 전직 전이면 나무 몽둥이 */
export function boundWeaponFor(job2?: string): string {
  const evolved = advanceChain(job2).flatMap((d) => (d.weapon ? [d.weapon] : []))
  return evolved.length ? evolved[evolved.length - 1] : HERO_START_WEAPON
}

/** 전직 가능 최소 레벨. 1차 직업마다 다르다 */
export function advanceLevel(baseJob: string): number {
  const list = advancesFor(baseJob)
  return list.length ? Math.min(...list.map((j) => j.level)) : Infinity
}

/**
 * 전직할 수 있나 — 지금 단계(최근 전직, 없으면 1차 직업) 다음에 고를 것이 있고 레벨이 되면.
 * 다른 직업은 2차 다음이 없으니 한 번뿐이다. 주인공은 30 에 한 번 더 (docs/20)
 */
export function canAdvance(baseJob: string, job2: string | undefined, level: number): boolean {
  return advancesFor(job2 ?? baseJob).some((j) => level >= j.level)
}

/** 전직 취소 비용 (마을). 다시 고르려면 낸다 */
export const ADVANCE_RESET_GOLD = 400
