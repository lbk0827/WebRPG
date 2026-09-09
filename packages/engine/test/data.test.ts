// 데이터 무결성: 프리셋이 참조하는 스킬이 전부 존재하고, 수칙이 보유 스킬만 쓰는지.
import { describe, expect, it } from 'vitest'
import { PRESETS, SKILLS, STATUS_DEFS } from '../src'

describe('데이터 무결성', () => {
  it('모든 프리셋의 보유 스킬이 SKILLS 에 존재한다', () => {
    for (const p of Object.values(PRESETS))
      for (const id of p.skills) expect(SKILLS[id], `${p.id} → ${id}`).toBeDefined()
  })

  it('수칙은 보유 스킬만 참조한다', () => {
    for (const p of Object.values(PRESETS))
      for (const r of p.rules.rows) expect(p.skills, `${p.id} 수칙 → ${r.skillId}`).toContain(r.skillId)
  })

  it('모든 단원은 fallback(always) 행을 마지막에 가진다', () => {
    for (const p of Object.values(PRESETS)) expect(p.rules.rows.at(-1)?.condition.op, p.id).toBe('always')
  })

  it('스킬의 applyStatus 가 참조하는 상태가 정의되어 있다', () => {
    for (const s of Object.values(SKILLS))
      for (const e of s.effects)
        if (e.kind === 'applyStatus') expect(STATUS_DEFS[e.status], `${s.id} → ${e.status}`).toBeDefined()
  })

  it('스킬 수는 15종 이상이다 (§6.5)', () => {
    expect(Object.keys(SKILLS).length).toBeGreaterThanOrEqual(15)
  })
})
