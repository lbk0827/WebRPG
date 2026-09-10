// M2-1: 지역·몬스터·조우·보상·성장 검증
import { describe, expect, it } from 'vitest'
import {
  DEFAULT_CONFIG, EXP_TABLE, MAX_LEVEL, MONSTERS, PRESETS, REGIONS, SKILLS, battleRewards, expToNext, grantExp, growthStats,
  isRegionUnlocked, maxRuleRows, monsterSetup, rollEncounter, simulate, EMPTY_ALLOC,
} from '../src'

describe('몬스터 데이터', () => {
  it('직업·스킬·수칙이 유효하다', () => {
    for (const m of Object.values(MONSTERS)) {
      expect(PRESETS[m.job], m.id).toBeDefined()
      const setup = monsterSetup(m, 0)
      for (const s of setup.skills) expect(SKILLS[s], `${m.id} → ${s}`).toBeDefined()
      for (const r of setup.rules.rows) expect(setup.skills, `${m.id} 수칙 → ${r.skillId}`).toContain(r.skillId)
      expect(setup.rules.rows.length, m.id).toBeLessThanOrEqual(maxRuleRows(setup.stats))
      expect(setup.monster?.exp, m.id).toBeGreaterThan(0)
    }
  })
  it('레벨 성장이 HP 와 분배 스탯에 반영된다', () => {
    const lv1 = monsterSetup({ ...MONSTERS.rivalWarrior, level: 1 }, 0).stats
    const lv8 = monsterSetup(MONSTERS.rivalWarrior, 0).stats
    expect(lv8.maxHp).toBeGreaterThan(lv1.maxHp)
    expect(lv8.str).toBe(lv1.str + 3 * 7)
  })
})

describe('지역과 조우', () => {
  it('번호가 연속이고 테이블의 몬스터가 전부 존재한다', () => {
    REGIONS.forEach((r, i) => expect(r.no).toBe(i + 1))
    for (const r of REGIONS) for (const t of r.table) expect(MONSTERS[t.monsterId], `${r.id} → ${t.monsterId}`).toBeDefined()
  })
  it('같은 시드면 같은 조우, 인원은 범위 안', () => {
    for (const r of REGIONS) {
      for (let seed = 1; seed <= 20; seed++) {
        const a = rollEncounter(r, seed)
        const b = rollEncounter(r, seed)
        expect(JSON.stringify(a)).toBe(JSON.stringify(b))
        expect(a.members.length).toBeGreaterThanOrEqual(r.count[0])
        expect(a.members.length).toBeLessThanOrEqual(r.count[1])
        expect(new Set(a.members.map((m) => m.name)).size).toBe(a.members.length)
      }
    }
  })
  it('해금 조건', () => {
    const [a, b] = REGIONS
    expect(isRegionUnlocked(a, {})).toBe(true)
    expect(isRegionUnlocked(b, {})).toBe(false)
    expect(isRegionUnlocked(b, { outskirts: 3 })).toBe(true)
  })
  it('레벨 1 기본 편성이 마을 외곽에서 대체로 이긴다 (첫 의뢰 난이도)', () => {
    const party = { name: 'p', members: ['warrior', 'rogue', 'mage', 'priest', 'elf'].map((j, i) => ({ ...structuredClone(PRESETS[j]), id: `${j}#${i}` })) }
    let wins = 0
    for (let seed = 1; seed <= 20; seed++) {
      const enemy = rollEncounter(REGIONS[0], seed)
      if (simulate({ seed, teams: [party, enemy], config: DEFAULT_CONFIG, skills: SKILLS }).outcome === 'team0') wins++
    }
    expect(wins).toBeGreaterThanOrEqual(16)
  })
  it('레벨 1 기본 편성은 폐허 요새에서 대체로 진다 (권장 레벨의 의미)', () => {
    const party = { name: 'p', members: ['warrior', 'rogue', 'mage', 'priest', 'elf'].map((j, i) => ({ ...structuredClone(PRESETS[j]), id: `${j}#${i}` })) }
    let wins = 0
    for (let seed = 1; seed <= 20; seed++) {
      const enemy = rollEncounter(REGIONS[2], seed)
      if (simulate({ seed, teams: [party, enemy], config: DEFAULT_CONFIG, skills: SKILLS }).outcome === 'team0') wins++
    }
    expect(wins).toBeLessThanOrEqual(6)
  })
  it('보상: 승리 전액, 패배 30%/금 0', () => {
    const enemy = rollEncounter(REGIONS[0], 1)
    const total = enemy.members.reduce((s, m) => s + (m.monster?.exp ?? 0), 0)
    const win = battleRewards({ outcome: 'team0', actionCount: 1, events: [] }, enemy)
    const lose = battleRewards({ outcome: 'team1', actionCount: 1, events: [] }, enemy)
    expect(win.exp).toBe(total)
    expect(lose.exp).toBe(Math.floor(total * 0.3))
    expect(lose.gold).toBe(0)
  })
})

describe('경험치와 성장', () => {
  it('경험치 표는 단조 증가, 만렙 30', () => {
    for (let l = 2; l < MAX_LEVEL; l++) expect(EXP_TABLE[l]).toBeGreaterThan(EXP_TABLE[l - 1])
    expect(expToNext(MAX_LEVEL)).toBeNull()
    expect(expToNext(1)).toBe(40)
  })
  it('grantExp 는 여러 레벨을 한 번에 올리고 잔여를 이월한다', () => {
    const r = grantExp(1, 0, 40 + 121 + 10)
    expect(r.level).toBe(3)
    expect(r.exp).toBe(10)
    expect(r.levelsGained).toBe(2)
    expect(grantExp(MAX_LEVEL, 0, 99999).level).toBe(MAX_LEVEL)
  })
  it('growthStats: HP 레벨 스케일, INT 분배는 SP 상한도 올린다, 상한 150', () => {
    const base = PRESETS.mage.stats
    const s = growthStats(base, 10, { ...EMPTY_ALLOC, int: 20 })
    expect(s.maxHp).toBe(Math.floor((base.maxHp * 145) / 100))
    expect(s.maxSp).toBe(Math.floor((base.maxSp * 127) / 100) + 40)
    expect(s.int).toBe(base.int + 20)
    expect(growthStats(base, 1, { ...EMPTY_ALLOC, int: 999 }).int).toBe(150)
  })
})
