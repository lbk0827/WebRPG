// 훈련 과제 진행 상태: 완료 여부, 과제별 작업 중인 수칙, 시도 횟수. localStorage 보존.
import type { SlotOverride } from '@webrpg/engine'

export interface MissionProgress {
  cleared: Record<string, true>
  work: Record<string, Record<number, SlotOverride>>
  attempts: Record<string, number>
}

const KEY = 'webrpg.m1.missions.v1'

export function loadProgress(): MissionProgress {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const p = JSON.parse(raw) as MissionProgress
      return { cleared: p.cleared ?? {}, work: p.work ?? {}, attempts: p.attempts ?? {} }
    }
  } catch {
    /* ignore */
  }
  return { cleared: {}, work: {}, attempts: {} }
}

export function saveProgress(p: MissionProgress): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(p))
  } catch {
    /* ignore */
  }
}
