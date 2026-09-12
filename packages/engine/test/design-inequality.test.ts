// M2-6. docs/07 §1 의 설계 제약을 계속 감시한다.
//
//   "같은 레벨에서 좋은 수칙 vs 나쁜 수칙의 승률 차" > "레벨 5 차이의 승률 차"
//
// 2026-09-12 측정·개선 (docs/18). 이 부등식은 **저레벨에서는 구조적으로 성립할 수 없다** —
// 레벨 5 는 Lv6 에서 배분 포인트를 두 배로 늘리지만 Lv19 에서는 25% 만 늘린다.
// 그래서 요구는 **중반 이후(무너진 성채 Lv19~)** 에만 건다.
//   · 지키는 것: 수칙을 아예 안 짜면 크게 진다 (참여 자체의 값)
//   · 지키는 것: 잘 짠 수칙이 기본 수칙보다 낫다 (설계에 값이 있다)
//   · 지키는 것: 중반 이후 수칙폭 / 레벨폭 ≥ 0.9
//   · 기록하는 것: 전 구간 비율. 콘솔에 표로 찍는다
import { describe, expect, it } from 'vitest'
import {
  DEFAULT_CONFIG,
  EMPTY_ALLOC,
  PRESETS,
  REGIONS,
  SKILLS,
  STAT_POINTS_PER_LEVEL,
  growthStats,
  rollEncounter,
  simulate,
} from '../src'
import type { CharSetup, Condition, RuleRow, StatKey, TeamSetup } from '../src'

const PRIMARY: Record<string, StatKey> = { warrior: 'str', rogue: 'dex', mage: 'int', priest: 'int', elf: 'dex' }
const JOBS = ['warrior', 'rogue', 'mage', 'priest', 'elf']
/** 측정 지역 — 입문(승률 100%)을 빼고 신호가 있는 곳만 */
const MEASURED = [2, 4, 5, 6, 7]
/**
 * 부등식을 요구하는 구간. 저레벨에서는 구조적으로 성립할 수 없다 (docs/18 §7).
 * 레벨 5 는 Lv6 에서 배분 포인트를 두 배로 늘리지만 Lv19 에서는 25% 만 늘린다.
 * 초반은 "레벨이 보상"인 구간이고, 설계가 이겨야 하는 곳은 중반 이후다.
 */
const INEQUALITY_FROM = 6 // REGIONS 인덱스 6 = 무너진 성채 (Lv19)
const N = 120

const always: Condition = { op: 'always' }
const atom = (a: Extract<Condition, { op: 'atom' }>['atom']): Condition => ({ op: 'atom', atom: a })
const row = (condition: Condition, skillId: string, maxUses?: number): RuleRow =>
  maxUses === undefined ? { condition, skillId } : { condition, skillId, maxUses }

type Rules = Pick<CharSetup, 'rules' | 'guard'>
const presetOf = (job: string): Rules => ({ rules: PRESETS[job].rules, guard: PRESETS[job].guard })

/** 수칙 화면을 한 번도 안 연 사람. 기본 공격만, 엄호 없음 */
const naiveOf = (): Rules => ({ rules: { rows: [row(always, 'strike')] }, guard: { mode: 'never' } })

/**
 * 지금까지 찾은 최선. 후보 탐색(docs/18 §2)에서 이긴 조합이다.
 * 더 나은 것을 찾으면 여기를 고치고 RULE_GAP_MIN 을 올린다.
 */
const BEST: Record<string, Rules> = {
  // 엄호 문턱을 30 → 15 로. 전사가 더 오래 대신 맞는다
  warrior: { rules: PRESETS.warrior.rules, guard: { mode: 'hpAbove', pct: 15 } },
  rogue: presetOf('rogue'),
  mage: presetOf('mage'),
  // 소생 → 35% 급한 치유 → 평균 75% 에서 단체회복 → 70% 치유. 기원을 일찍 쓰는 것이 값이다
  priest: {
    guard: { mode: 'never' },
    rules: {
      rows: [
        row(atom({ kind: 'teamDeadCount', side: 'ally', cmp: 'gte', value: 1 }), 'resurrect'),
        row(atom({ kind: 'teamAnyHpPctBelow', side: 'ally', value: 35 }), 'mend'),
        row(atom({ kind: 'teamAvgHpPct', side: 'ally', cmp: 'lte', value: 75 }), 'prayer'),
        row(atom({ kind: 'teamAnyHpPctBelow', side: 'ally', value: 70 }), 'mend'),
        row(always, 'strike'),
      ],
    },
  },
  elf: presetOf('elf'),
}

function party(level: number, pick: (job: string) => Rules): TeamSetup {
  return {
    name: '측정',
    members: JOBS.map((j, i) => {
      const p = structuredClone(PRESETS[j])
      const alloc = { ...EMPTY_ALLOC, [PRIMARY[j]]: (level - 1) * STAT_POINTS_PER_LEVEL }
      return { ...p, ...pick(j), id: `${j}#${i}`, stats: growthStats(p.stats, level, alloc) }
    }),
  }
}

function winPct(level: number, regionIdx: number, pick: (job: string) => Rules): number {
  const team = party(level, pick)
  let w = 0
  for (let s = 1; s <= N; s++) {
    const enemy = rollEncounter(REGIONS[regionIdx], s)
    if (simulate({ seed: s, teams: [team, enemy], config: DEFAULT_CONFIG, skills: SKILLS }).outcome === 'team0') w++
  }
  return Math.round((w / N) * 100)
}

/** 잘 짠 수칙이 기본 수칙보다 최소 이만큼은 나아야 한다 (%p). 개선하면 올린다 */
const RULE_GAP_MIN = 3
/** 수칙을 아예 안 짜면 최소 이만큼 나빠야 한다 (%p) */
const NAIVE_PENALTY_MIN = 30

describe('설계 제약 (docs/07 §1)', () => {
  const rows = MEASURED.map((i) => {
    const idx = i
    const lv = REGIONS[i].recommended[0]
    const naive = winPct(lv, i, naiveOf)
    const preset = winPct(lv, i, presetOf)
    const best = winPct(lv, i, (j) => BEST[j] ?? presetOf(j))
    const up = winPct(lv + 5, i, presetOf)
    return { idx, name: REGIONS[i].name, lv, naive, preset, best, up, ruleGap: best - preset, levelGap: up - preset }
  })

  it('수칙을 아예 안 짜면 크게 진다 — 참여 자체에 값이 있다', () => {
    for (const r of rows) {
      expect(r.preset - r.naive, `${r.name}: 기본 수칙 ${r.preset}% vs 무설정 ${r.naive}%`).toBeGreaterThanOrEqual(
        NAIVE_PENALTY_MIN,
      )
    }
  })

  it('잘 짠 수칙이 기본 수칙보다 낫다 — 설계에 값이 있다', () => {
    for (const r of rows) {
      expect(r.ruleGap, `${r.name}: 기본 ${r.preset}% → 최선 ${r.best}%`).toBeGreaterThanOrEqual(RULE_GAP_MIN)
    }
  })

  it('중반 이후에는 설계가 레벨을 거의 따라잡는다', () => {
    for (const r of rows.filter((x) => x.idx >= INEQUALITY_FROM)) {
      const ratio = r.levelGap <= 0 ? 99 : r.ruleGap / r.levelGap
      expect(ratio, `${r.name}: 수칙폭 ${r.ruleGap}%p vs 레벨폭 ${r.levelGap}%p`).toBeGreaterThanOrEqual(0.9)
    }
  })

  it('현재 비율을 표로 남긴다', () => {
    const lines = ['지역          Lv  무설정  기본  최선  +5레벨 | 수칙폭  레벨폭  비율']
    for (const r of rows) {
      const ratio = r.levelGap <= 0 ? '-' : (r.ruleGap / r.levelGap).toFixed(2)
      lines.push(
        `${r.name.padEnd(11)} ${String(r.lv).padStart(3)} ${String(r.naive).padStart(6)} ${String(r.preset).padStart(5)} ${String(r.best).padStart(5)} ${String(r.up).padStart(7)} | ${String(r.ruleGap).padStart(6)} ${String(r.levelGap).padStart(7)} ${ratio.padStart(6)}`,
      )
    }
    console.log('\n' + lines.join('\n') + '\n')
    expect(rows.length).toBe(MEASURED.length)
  })
})
