// 모험 (탭 개편). 고정 상대 · 보상 배수 · 데이터 정합성.
import { describe, expect, it } from 'vitest'
import { ADVENTURES, MATERIALS, MONSTERS, REGION_BY_ID, WEEKDAY_LABEL, adventureRewards, adventureTeam } from '../src'

describe('모험 데이터', () => {
  it('번호가 연속이고, 상대·입장 재료·보상 재료·해금 지역이 전부 존재한다', () => {
    ADVENTURES.forEach((a, i) => {
      expect(a.no).toBe(i + 1)
      expect(a.foes.length, a.id).toBeGreaterThan(0)
      for (const f of a.foes) expect(MONSTERS[f], `${a.id} → ${f}`).toBeDefined()
      if (a.entry) expect(MATERIALS[a.entry.itemId], `${a.id} 입장 ${a.entry.itemId}`).toBeDefined()
      for (const d of a.clearDrops) expect(MATERIALS[d.itemId], `${a.id} 보상 ${d.itemId}`).toBeDefined()
      expect(REGION_BY_ID[a.unlock.regionId], `${a.id} 해금 ${a.unlock.regionId}`).toBeDefined()
      expect(a.rewardPct).toBeGreaterThanOrEqual(100)
      for (const d of a.weekdays ?? []) expect(WEEKDAY_LABEL[d]).toBeDefined()
    })
  })

  it('권장 레벨은 해금 지역의 권장 밴드보다 낮지 않다', () => {
    for (const a of ADVENTURES) {
      const r = REGION_BY_ID[a.unlock.regionId]
      expect(a.recommended[0], `${a.name}`).toBeGreaterThanOrEqual(r.recommended[0])
    }
  })

  it('고정 편성이라 항상 같은 상대가 나오고, 겹치는 이름에는 번호가 붙는다', () => {
    for (const a of ADVENTURES) {
      const t1 = adventureTeam(a)
      const t2 = adventureTeam(a)
      expect(t1.members.map((m) => m.name)).toEqual(t2.members.map((m) => m.name))
      expect(new Set(t1.members.map((m) => m.name)).size).toBe(t1.members.length)
      expect(t1.members.length).toBe(a.foes.length)
    }
  })

  it('보상은 배수만큼 크다 — 같은 상대를 일반 전투로 잡는 것보다 이득', () => {
    for (const a of ADVENTURES) {
      const team = adventureTeam(a)
      const raw = team.members.reduce((s, m) => s + (m.monster?.exp ?? 0), 0)
      expect(adventureRewards(a).exp).toBe(Math.floor((raw * a.rewardPct) / 100))
      expect(adventureRewards(a).exp).toBeGreaterThan(raw)
    }
  })

  it('연달아 갈 수 없다 — 모든 모험에 재도전 대기나 하루 제한이 걸려 있다', () => {
    for (const a of ADVENTURES) {
      const gated = a.cooldownMin.win > 0 || a.dailyLimit !== undefined || !!a.entry || !!a.weekdays
      expect(gated, `${a.name} 에 아무 제한이 없다`).toBe(true)
      expect(a.cooldownMin.lose, `${a.name} 패배 대기`).toBeGreaterThan(0)
    }
  })
})
