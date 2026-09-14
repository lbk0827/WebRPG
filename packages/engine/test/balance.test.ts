// M2-5a 지역 난이도 곡선. "권장 레벨" 이 실제로 의미가 있는지 고정한다.
// 기준 편성은 장비 없음 + 직업 기본 수칙 + 주 스탯 몰빵 — 실제 플레이어는 장비와 수칙으로 이보다 낫다.
// 임계값은 여유 있게 잡는다 (튜닝할 때마다 깨지면 안 된다). 실측값은 docs/07 §3.8g 표 참조.
import { describe, expect, it } from 'vitest'
import { DEFAULT_CONFIG, EMPTY_ALLOC, HERO_JOB, HERO_START_WEAPON, JOB_ADVANCE, MONSTERS, PRESETS, REGIONS, SKILLS, STAT_POINTS_PER_LEVEL, growthStats, rollEncounter, simulate, summarizeGear } from '../src'
import type { RuleSet, Stats } from '../src'
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


// ───────────────────────────── 전직 편성 (M2-7 의 'advanced' 지역 기준)
//
// 만렙이 30 이라 레벨로는 지역을 더 어렵게 만들 수 없다. 그래서 후반 지역은 문턱을 **설계**로 옮겼다:
// 기준 편성은 지고, **전직 + 훅 수칙 + 속도 혼합**이면 해볼 만하다 (docs/18 §17).
// 여기도 장비는 없다 — 실제 플레이어는 장비로 이보다 낫다.

const at = (a: unknown) => ({ op: 'atom' as const, atom: a as never })
const alwaysCond = { op: 'always' as const }
const r = (condition: unknown, skillId: string, maxUses?: number) => ({ condition: condition as never, skillId, ...(maxUses ? { maxUses } : {}) })

/** 각 2차 직업의 훅을 실제로 쓰는 수칙 (docs/18 §12·§13 에서 측정에 쓴 것) */
const HOOK_RULES: Record<string, RuleSet> = {
  guardian: { rows: [
    r(at({ kind: 'selfActionCount', cmp: 'eq', value: 1 }), 'bulwark', 1),
    r(at({ kind: 'teamAnyHpPct', side: 'ally', cmp: 'lte', value: 55 }), 'taunt'),
    r(at({ kind: 'teamAnyHpPct', side: 'enemy', cmp: 'gte', value: 70 }), 'sunder'),
    r(at({ kind: 'selfSpAbs', cmp: 'gte', value: 8 }), 'heavyBlow'),
    r(alwaysCond, 'strike'),
  ] },
  assassin: { rows: [
    r(at({ kind: 'selfActionCount', cmp: 'eq', value: 1 }), 'markPrey', 1),
    r(at({ kind: 'teamStatusCount', side: 'enemy', status: 'poison', cmp: 'lte', value: 1 }), 'toxicBlade'),
    r(at({ kind: 'selfSpAbs', cmp: 'gte', value: 8 }), 'venom'),
    r(alwaysCond, 'backstab'),
  ] },
  elementalist: { rows: [
    r(at({ kind: 'teamAliveCount', side: 'enemy', cmp: 'gte', value: 4 }), 'maelstrom'),
    r(at({ kind: 'teamAliveCount', side: 'enemy', cmp: 'gte', value: 3 }), 'emberfall'),
    r(at({ kind: 'selfSpAbs', cmp: 'gte', value: 10 }), 'fireball'),
    r(alwaysCond, 'bolt'),
  ] },
  bishop: { rows: [
    r(at({ kind: 'teamDeadCount', side: 'ally', cmp: 'gte', value: 1 }), 'resurrect'),
    r(at({ kind: 'teamAnyHpPct', side: 'ally', cmp: 'lte', value: 30 }), 'benediction'),
    r(at({ kind: 'teamAvgHpPct', side: 'ally', cmp: 'lte', value: 60 }), 'sanctuary'),
    r(at({ kind: 'teamAnyHpPct', side: 'ally', cmp: 'lte', value: 55 }), 'mend'),
    r(at({ kind: 'teamStatusCount', side: 'ally', status: 'poison', cmp: 'gte', value: 1 }), 'cleanse'),
    r(at({ kind: 'selfActionCount', cmp: 'eq', value: 1 }), 'ward', 1),
    r(alwaysCond, 'strike'),
  ] },
  ranger: { rows: [
    r(at({ kind: 'teamRowCount', side: 'enemy', row: 'back', cmp: 'gte', value: 2 }), 'snipe'),
    r(at({ kind: 'teamAliveCount', side: 'enemy', cmp: 'gte', value: 4 }), 'volley'),
    r(at({ kind: 'selfSpAbs', cmp: 'gte', value: 12 }), 'pierceShot'),
    r(alwaysCond, 'strike'),
  ] },
}

const ADVANCED: Record<string, string> = {
  warrior: 'guardian', rogue: 'assassin', mage: 'elementalist', priest: 'bishop', elf: 'ranger',
}

/** 전직 보정은 레벨 배율 **뒤에** 더한다 (docs/18 §10 의 결함 2) */
function withAdvance(scaled: Stats, job2: string): Stats {
  const out = { ...scaled }
  for (const [k, v] of Object.entries(JOB_ADVANCE[job2].bonus)) out[k as keyof Stats] = (out[k as keyof Stats] ?? 0) + (v ?? 0)
  return out
}

/** 레벨 L 의 전직 편성 — 장비 없음, 훅 수칙, 속도 30% 혼합, 나머지는 주 스탯 */
export function advancedParty(level: number): TeamSetup {
  const jobs = ['warrior', 'rogue', 'mage', 'priest', 'elf']
  const pool = (level - 1) * STAT_POINTS_PER_LEVEL
  const spd = Math.floor((pool * 30) / 100)
  return {
    name: '전직 편성',
    members: jobs.map((j, i) => {
      const p = structuredClone(PRESETS[j])
      const j2 = ADVANCED[j]
      const adv = JOB_ADVANCE[j2]
      const alloc = { ...EMPTY_ALLOC, [PRIMARY[j]]: pool - spd, spd }
      return {
        ...p,
        id: `${j}#${i}`,
        stats: withAdvance(growthStats(p.stats, level, alloc), j2),
        skills: [...new Set([...p.skills, ...adv.grants, ...adv.learnable.map((l) => l.skillId)])],
        traits: [...adv.traits],
        rules: HOOK_RULES[j2] ?? p.rules,
      }
    }),
  }
}

function advWinPct(level: number, regionIdx: number, n = 30): number {
  const party = advancedParty(level)
  let w = 0
  for (let s = 1; s <= n; s++) {
    const enemy = rollEncounter(REGIONS[regionIdx], s)
    if (simulate({ seed: s, teams: [party, enemy], config: DEFAULT_CONFIG, skills: SKILLS }).outcome === 'team0') w++
  }
  return Math.round((w / n) * 100)
}

describe('지역 난이도 곡선', () => {
  it('기준 편성 지역: 권장 하한에서 해볼 만하고(≥40%), 상한에서는 대체로 이긴다(≥60%)', () => {
    REGIONS.forEach((r, i) => {
      if (r.expects === 'advanced') return
      const lo = winPct(r.recommended[0], i)
      const hi = winPct(r.recommended[1], i)
      expect(lo, `${r.name} 권장 하한 Lv${r.recommended[0]}`).toBeGreaterThanOrEqual(40)
      expect(hi, `${r.name} 권장 상한 Lv${r.recommended[1]}`).toBeGreaterThanOrEqual(60)
      expect(hi, `${r.name} 레벨을 올리면 쉬워져야 한다`).toBeGreaterThanOrEqual(lo - 10)
    })
  })

  it("전직 지역('advanced'): 기준 편성은 지고, 전직 편성이면 해볼 만하다", () => {
    const adv = REGIONS.map((r, i) => [r, i] as const).filter(([r]) => r.expects === 'advanced')
    expect(adv.length, "expects:'advanced' 지역이 있어야 한다").toBeGreaterThan(0)
    for (const [r, i] of adv) {
      const base = winPct(r.recommended[1], i) // 기준 편성은 **상한 레벨**에서도 진다
      const lo = advWinPct(r.recommended[0], i)
      const hi = advWinPct(r.recommended[1], i)
      console.log(`\n${r.name} — 기준 편성 Lv${r.recommended[1]} ${base}% / 전직 편성 Lv${r.recommended[0]} ${lo}% → Lv${r.recommended[1]} ${hi}%`)
      // 문턱이 레벨이 아니라 설계라는 것
      expect(base, `${r.name}: 기준 편성이 ${base}% 로 이긴다 — 전직이 전제가 아니게 된다`).toBeLessThanOrEqual(30)
      expect(lo, `${r.name} 전직 편성 Lv${r.recommended[0]}`).toBeGreaterThanOrEqual(40)
      // 상한 기준을 55 가 아니라 50 으로 둔다. 이 기준 편성에는 **장비가 없다** —
      // 장비를 갖춘 실제 플레이어는 여기서 70% 대다. 최종 지역이 맨몸으로도 편해지면 갈 곳이 없어진다
      expect(hi, `${r.name} 전직 편성 Lv${r.recommended[1]}`).toBeGreaterThanOrEqual(50)
    }
  })

  it('주인공(모험가)은 혼자 마을 외곽을 넘는다 — 새 게임은 한 명으로 시작한다 (docs/20)', () => {
    const solo = (level: number): number => {
      const p = structuredClone(PRESETS[HERO_JOB])
      // 새 게임과 같게 — 나무 몽둥이를 든다
      const club = summarizeGear([{ uid: 'w', itemId: HERO_START_WEAPON, refine: 0 }])
      const hero: TeamSetup = {
        name: '주인공',
        members: [{
          ...p,
          id: `${HERO_JOB}#0`,
          stats: growthStats(p.stats, level, { ...EMPTY_ALLOC, str: (level - 1) * STAT_POINTS_PER_LEVEL }),
          bonus: { atk: club.atk, def: club.def },
          weapon: club.weapon,
        }],
      }
      let w = 0
      for (let s = 1; s <= 30; s++) {
        const enemy = rollEncounter(REGIONS[0], s)
        if (simulate({ seed: s, teams: [hero, enemy], config: DEFAULT_CONFIG, skills: SKILLS }).outcome === 'team0') w++
      }
      return Math.round((w / 30) * 100)
    }
    expect(solo(1), '혼자 Lv1').toBeGreaterThanOrEqual(60)
    expect(solo(2), '혼자 Lv2').toBeGreaterThanOrEqual(85)
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
        if (m.hidden) continue // 숨김(보스)은 권장 상한을 넘어도 된다 — 그게 위협이다
        if (r.expects === 'advanced') {
          // 전직 지역은 **상대가 나보다 세다**. 만렙이 30 이니 레벨로는 못 넘는다 — 설계로 넘는 것이다.
          // 그게 이 지역의 문장이다 (docs/18 §17)
          expect(m.level, `${r.name} → ${m.name}: 전직 지역은 상대가 더 높아야 한다`).toBeGreaterThan(r.recommended[1])
          expect(m.level, `${r.name} → ${m.name}: 그래도 한계는 있다`).toBeLessThanOrEqual(r.recommended[1] + 8)
        } else {
          expect(m.level, `${r.name} → ${m.name}`).toBeLessThanOrEqual(r.recommended[1] + 2)
        }
      }
    }
  })
})
