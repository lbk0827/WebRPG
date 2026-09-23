// 상태이상 정의 (§6.4). 의미론은 effects.ts / battle.ts 가 담당하고 여기는 분류와 표시 정보만 둔다.
import type { StatusId } from '../types'

export interface StatusDef {
  id: StatusId
  label: string
  category: 'buff' | 'debuff'
  /** applyStatus 에서 magnitude 를 생략했을 때 쓰는 기본값 */
  defaultMagnitude: number
  /**
   * 누적되는가 (docs/31 §6). 참이면 같은 것을 또 걸 때 **덮어쓰지 않고 겹을 더한다** —
   * 겹 수는 `stacks`, 쌓인 값(혼돈이면 피해량)은 `magnitude` 에 더해진다.
   */
  stack?: true
  /** 겹 상한 */
  maxStacks?: number
}

export const STATUS_DEFS: Record<StatusId, StatusDef> = {
  poison: { id: 'poison', label: '중독', category: 'debuff', defaultMagnitude: 5 },
  atkUp: { id: 'atkUp', label: '공격 강화', category: 'buff', defaultMagnitude: 30 },
  atkDown: { id: 'atkDown', label: '공격 약화', category: 'debuff', defaultMagnitude: 30 },
  defUp: { id: 'defUp', label: '방어 강화', category: 'buff', defaultMagnitude: 30 },
  defDown: { id: 'defDown', label: '방어 약화', category: 'debuff', defaultMagnitude: 30 },
  spdUp: { id: 'spdUp', label: '가속', category: 'buff', defaultMagnitude: 30 },
  spdDown: { id: 'spdDown', label: '둔화', category: 'debuff', defaultMagnitude: 30 },
  silence: { id: 'silence', label: '침묵', category: 'debuff', defaultMagnitude: 0 },
  barrier: { id: 'barrier', label: '보호막', category: 'buff', defaultMagnitude: 1 },
  // 누적 상태 둘 (docs/31 §6). 중독이 "최대 HP 의 %"인 것과 달리 혼돈은 **건 사람의 공격력**으로 쌓인다
  chaos: { id: 'chaos', label: '혼돈', category: 'debuff', defaultMagnitude: 0, stack: true, maxStacks: 12 },
  oath: { id: 'oath', label: '서약의 빛', category: 'buff', defaultMagnitude: 1, stack: true, maxStacks: 10 },
}
