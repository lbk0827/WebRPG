// M2-2 스킬 습득 (제로식 방식): 데이터 정합성 + 미습득 스킬 실패 + 밸런스 불변.
import { describe, expect, it } from 'vitest'
import {
  COMMON_LEARNABLE, DEFAULT_CONFIG, LEARNABLE, PRESETS, REGIONS, SKILLS, SKILL_POINTS_PER_LEVEL, STARTER_SKILLS,
  learnableFor, rollEncounter, simulate,
} from '../src'
import type { BattleEvent, CharSetup } from '../src'

const JOBS = Object.keys(PRESETS)

describe('습득 데이터', () => {
  it('모든 직업에 시작 스킬과 목록이 있고, 스킬 id 가 전부 존재한다', () => {
    for (const job of JOBS) {
      expect(STARTER_SKILLS[job], job).toBeDefined()
      expect(LEARNABLE[job], job).toBeDefined()
      for (const id of STARTER_SKILLS[job]) expect(SKILLS[id], `${job} starter ${id}`).toBeDefined()
      for (const l of learnableFor(job)) expect(SKILLS[l.skillId], `${job} learn ${l.skillId}`).toBeDefined()
    }
    for (const c of COMMON_LEARNABLE) expect(c.cost).toBe(0)
  })

  it('기본 수칙이 쓰는 스킬은 전부 시작 스킬이다 — 새 단원은 프리셋과 똑같이 싸운다', () => {
    for (const job of JOBS) {
      for (const r of PRESETS[job].rules.rows) expect(STARTER_SKILLS[job], `${job} 수칙 → ${r.skillId}`).toContain(r.skillId)
    }
  })

  it('시작 스킬과 습득 목록은 겹치지 않고, 프리셋 스킬은 둘 중 하나에 있다', () => {
    for (const job of JOBS) {
      const starter = new Set(STARTER_SKILLS[job])
      const learn = learnableFor(job).map((l) => l.skillId)
      for (const id of learn) expect(starter.has(id), `${job} ${id} 겹침`).toBe(false)
      expect(new Set(learn).size).toBe(learn.length)
      for (const id of PRESETS[job].skills) expect(starter.has(id) || learn.includes(id), `${job} 프리셋 ${id}`).toBe(true)
    }
  })

  it('값은 1~4, 직업 목록 총액은 Lv 20 포인트 안에 든다 (1차는 다 배울 수 있게, 2차에서 모자라게)', () => {
    for (const job of JOBS) {
      const list = LEARNABLE[job]
      for (const l of list) expect(l.cost, `${job} ${l.skillId}`).toBeGreaterThanOrEqual(1)
      for (const l of list) expect(l.cost).toBeLessThanOrEqual(4)
      const total = list.reduce((s, l) => s + l.cost, 0)
      expect(total, job).toBeLessThanOrEqual(19 * SKILL_POINTS_PER_LEVEL)
      expect(total, job).toBeGreaterThanOrEqual(8)
    }
  })
})

describe('미습득 스킬', () => {
  it('수칙에 있어도 배우지 않은 스킬은 notLearned 로 실패하고 다음 패턴으로 넘어간다', () => {
    const me: CharSetup = {
      ...structuredClone(PRESETS.warrior),
      id: 'warrior#0',
      skills: ['strike'],
      rules: { rows: [{ condition: { op: 'always' }, skillId: 'heavyBlow' }, { condition: { op: 'always' }, skillId: 'strike' }] },
    }
    const foe: CharSetup = { ...structuredClone(PRESETS.warrior), id: 'warrior#1' }
    const ev = simulate({ seed: 1, teams: [{ name: 'a', members: [me] }, { name: 'b', members: [foe] }], config: DEFAULT_CONFIG, skills: SKILLS }).events
    const failed = ev.filter((e): e is Extract<BattleEvent, { t: 'skillFailed' }> => e.t === 'skillFailed' && e.actor.team === 0)
    expect(failed.length).toBeGreaterThan(0)
    expect(failed.every((e) => e.reason === 'notLearned' && e.skillId === 'heavyBlow')).toBe(true)
    const fired = ev.filter((e): e is Extract<BattleEvent, { t: 'ruleFired' }> => e.t === 'ruleFired' && e.actor.team === 0)
    expect(fired.every((e) => e.skillId === 'strike')).toBe(true)
  })

  it('시작 스킬만 든 새 편성은 프리셋 편성과 같은 결과를 낸다 (마을 외곽 20판)', () => {
    const jobs = ['warrior', 'rogue', 'mage', 'priest', 'elf']
    const preset = { name: 'p', members: jobs.map((j, i) => ({ ...structuredClone(PRESETS[j]), id: `${j}#${i}` })) }
    const starter = { name: 's', members: jobs.map((j, i) => ({ ...structuredClone(PRESETS[j]), id: `${j}#${i}`, skills: [...STARTER_SKILLS[j]] })) }
    for (let seed = 1; seed <= 20; seed++) {
      const enemy = rollEncounter(REGIONS[0], seed)
      const a = simulate({ seed, teams: [preset, enemy], config: DEFAULT_CONFIG, skills: SKILLS })
      const b = simulate({ seed, teams: [starter, enemy], config: DEFAULT_CONFIG, skills: SKILLS })
      expect(b.outcome).toBe(a.outcome)
      expect(b.actionCount).toBe(a.actionCount)
    }
  })
})
