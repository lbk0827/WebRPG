// 스킬 습득 (M2-2, 제로식 방식 — 단장 결정 2026-09-10). 직업마다 평면 목록 + 값 차등. 순서 제약 없음.
// 시작 스킬은 기본 수칙이 쓰는 것만 — 그래서 새 게임의 단원은 프리셋과 똑같이 싸운다 (밸런스 불변).
// 공용 0포인트 스킬은 제로식의 Guard/Stay 에서 착안: 공짜지만 수칙에 넣어야 쓰이니 "패턴에 넣는다"를 가르친다.
import { PRESETS } from './presets'
import { JOB_ADVANCE } from './jobs'

export interface Learnable {
  skillId: string
  cost: number
}

/** 새 단원이 들고 시작하는 스킬. 각 직업 기본 수칙이 참조하는 스킬을 전부 포함해야 한다 (테스트로 고정) */
export const STARTER_SKILLS: Record<string, string[]> = {
  warrior: ['strike', 'heavyBlow', 'sweep', 'warCry'],
  rogue: ['strike', 'venom', 'hush'],
  mage: ['strike', 'bolt', 'inferno', 'meditate'],
  priest: ['strike', 'mend', 'resurrect'],
  elf: ['strike', 'pierceShot'],
}

/** 누구나 0포인트로 배우는 기본 동작 */
export const COMMON_LEARNABLE: Learnable[] = [
  { skillId: 'guardStance', cost: 0 },
  { skillId: 'catchBreath', cost: 0 },
]

/** 직업별 배울 수 있는 스킬 (시작 스킬 제외). 값은 1~4 */
export const LEARNABLE: Record<string, Learnable[]> = {
  warrior: [
    { skillId: 'sunder', cost: 3 },
    { skillId: 'ironSkin', cost: 2 },
    { skillId: 'shieldBash', cost: 4 },
  ],
  rogue: [
    { skillId: 'flurry', cost: 2 },
    { skillId: 'stagger', cost: 3 },
    { skillId: 'backstep', cost: 2 },
    { skillId: 'ambush', cost: 4 },
  ],
  mage: [
    { skillId: 'frostbind', cost: 3 },
    { skillId: 'manaBurn', cost: 3 },
    { skillId: 'fireball', cost: 4 },
  ],
  priest: [
    { skillId: 'cleanse', cost: 2 },
    { skillId: 'bless', cost: 2 },
    { skillId: 'prayer', cost: 3 },
    { skillId: 'ward', cost: 3 },
    { skillId: 'smite', cost: 3 },
  ],
  elf: [
    { skillId: 'flurry', cost: 2 },
    { skillId: 'venom', cost: 2 },
    { skillId: 'poisonArrow', cost: 3 },
    { skillId: 'snipe', cost: 4 },
  ],
}

/** 이 직업이 배울 수 있는 전체 목록 (공용 먼저). 전직했으면 2차 목록이 뒤에 붙는다 */
export function learnableFor(job: string, job2?: string): Learnable[] {
  const adv = job2 ? JOB_ADVANCE[job2] : undefined
  return [...COMMON_LEARNABLE, ...(LEARNABLE[job] ?? []), ...(adv?.learnable ?? [])]
}

export function learnCost(job: string, skillId: string, job2?: string): number | null {
  const e = learnableFor(job, job2).find((l) => l.skillId === skillId)
  return e ? e.cost : null
}

/** 직업이 어떤 형태로든 가질 수 있는 스킬 (도감·라벨용) */
export function jobSkillPool(job: string, job2?: string): string[] {
  const starter = STARTER_SKILLS[job] ?? PRESETS[job]?.skills ?? []
  const adv = job2 ? JOB_ADVANCE[job2] : undefined
  return [...starter, ...(adv?.grants ?? []), ...learnableFor(job, job2).map((l) => l.skillId)]
}

/** 스킬 초기화 비용 (금). 잘못 배운 걸 되돌리되 공짜는 아니게 */
export const SKILL_RESET_GOLD = 60
