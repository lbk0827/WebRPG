// M2-5a 지역 난이도 곡선. "권장 레벨" 이 실제로 의미가 있는지 고정한다.
// 기준 편성은 장비 없음 + 직업 기본 수칙 + 주 스탯 몰빵 — 실제 플레이어는 장비와 수칙으로 이보다 낫다.
// 임계값은 여유 있게 잡는다 (튜닝할 때마다 깨지면 안 된다). 실측값은 docs/07 §3.8g 표 참조.
import { describe, expect, it } from 'vitest'
import { DEFAULT_CONFIG, EMPTY_ALLOC, MONSTERS, PRESETS, REGIONS, SKILLS, STAT_POINTS_PER_LEVEL, growthStats, rollEncounter, simulate } from '../src'
import type { StatKey, TeamSetup } from '../src'

const PRIMARY: Record<string, StatKey> = { warrior: 'str', rogue: 'dex', mage: 'int', priest: 'int', elf: 'dex' }

/** 레벨 L 의 기준 편성 — 장비 없음, 기본 수칙, 포인트는 직업 주 스탯에 전부 */
export function leveledParty(level: number): TeamSetup {
  const jobs = ['warrior', 'rogue', 'mage', 'priest', 'elf']
  return {
    name: '기준 편성',
    members: jobs.map((j, i) => {
      const p = structuredClone(PRESETS[j])
      const alloc = { ...EMPTY_ALLOC, [PRIMARY[j]]: (level - 1) * STAT_POINTS_PER_LEVEL }
      return { ...p, id: `${j}#${i}`, stats: growthStats(p.stats, level, alloc) }
    }),
  }
}

function winPct(level: number, regionIdx: number, n = 30): number {
  const party = leveledParty(level)
  let w = 0
  for (let s = 1; s <= n; s++) {
    const enemy = rollEncounter(REGIONS[regionIdx], s)
    if (simulate({ seed: s, teams: [party, enemy], config: DEFAULT_CONFIG, skills: SKILLS }).outcome === 'team0') w++
  }
  return Math.round((w / n) * 100)
}

describe('지역 난이도 곡선', () => {
  it('권장 레벨 하한에서 해볼 만하고(≥40%), 상한에서는 대체로 이긴다(≥60%)', () => {
    REGIONS.forEach((r, i) => {
      const lo = winPct(r.recommended[0], i)
      const hi = winPct(r.recommended[1], i)
      expect(lo, `${r.name} 권장 하한 Lv${r.recommended[0]}`).toBeGreaterThanOrEqual(40)
      expect(hi, `${r.name} 권장 상한 Lv${r.recommended[1]}`).toBeGreaterThanOrEqual(60)
      expect(hi, `${r.name} 레벨을 올리면 쉬워져야 한다`).toBeGreaterThanOrEqual(lo - 10)
    })
  })

  it('입문 두 지역은 기본 수칙만으로 넘어간다 (≥85%)', () => {
    expect(winPct(REGIONS[0].recommended[0], 0)).toBeGreaterThanOrEqual(85)
    expect(winPct(REGIONS[1].recommended[0], 1)).toBeGreaterThanOrEqual(85)
  })

  it('깊은 지역은 같은 레벨에서 더 어렵다', () => {
    const lv = 20
    const fort = winPct(lv, 2)
    const citadel = winPct(lv, 6)
    const abyss = winPct(lv, 7)
    expect(citadel, '무너진 성채 < 폐허 요새').toBeLessThan(fort)
    expect(abyss, '심연의 굴 < 폐허 요새').toBeLessThan(fort)
  })

  it('권장 레벨 밴드는 지역 순서대로 올라가고, 등장 몬스터 레벨과 어긋나지 않는다', () => {
    for (let i = 1; i < REGIONS.length; i++) {
      expect(REGIONS[i].recommended[0], `${REGIONS[i].name}`).toBeGreaterThanOrEqual(REGIONS[i - 1].recommended[0])
    }
    for (const r of REGIONS) {
      for (const t of r.table) {
        const m = MONSTERS[t.monsterId]
        // 숨김(보스)은 권장 상한을 넘어도 된다 — 그게 위협이다
        if (!m.hidden) expect(m.level, `${r.name} → ${m.name}`).toBeLessThanOrEqual(r.recommended[1] + 2)
      }
    }
  })
})
