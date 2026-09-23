// 훈련 과제 진행 상태: 완료 여부, 과제별 작업 중인 수칙, 시도 횟수. localStorage 보존.
// 계정제(docs/25)부터 계정마다 따로 둔다. 서버 연결(B 단계) 때 게임 저장과 함께 옮길 대상.
import type { SlotOverride } from '@webrpg/engine'

export interface MissionProgress {
  cleared: Record<string, true>
  work: Record<string, Record<number, SlotOverride>>
  attempts: Record<string, number>
}

/** 계정제 이전의 브라우저 공용 키 */
const LEGACY_KEY = 'webrpg.m1.missions.v1'
const keyFor = (userId: string) => `${LEGACY_KEY}.${userId}`

export function loadProgress(userId: string): MissionProgress {
  try {
    const raw = localStorage.getItem(keyFor(userId))
    if (raw) {
      const p = JSON.parse(raw) as MissionProgress
      return { cleared: p.cleared ?? {}, work: p.work ?? {}, attempts: p.attempts ?? {} }
    }
  } catch {
    /* ignore */
  }
  return { cleared: {}, work: {}, attempts: {} }
}

export function saveProgress(userId: string, p: MissionProgress): void {
  try {
    localStorage.setItem(keyFor(userId), JSON.stringify(p))
  } catch {
    /* ignore */
  }
}

/** 예전 진행을 가져올 때 훈련 과제 진행도 같이 옮긴다 */
export function adoptLegacyProgress(userId: string): void {
  try {
    const raw = localStorage.getItem(LEGACY_KEY)
    if (raw && !localStorage.getItem(keyFor(userId))) localStorage.setItem(keyFor(userId), raw)
    localStorage.removeItem(LEGACY_KEY)
  } catch {
    /* ignore */
  }
}
