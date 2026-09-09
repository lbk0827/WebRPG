// 훈련장 (§8.3). N회 반복 대전 → 승률 · 평균 행동 수 · 사망 빈도.
// 사용: npm run train -- --a balanced --b rush --n 200
import { DEFAULT_CONFIG, SKILLS, TEAMS, simulate } from '../src'
import type { BattleInput } from '../src'

const args = parseArgs(process.argv.slice(2))
const aName = args.a ?? 'balanced'
const bName = args.b ?? 'rush'
const n = Number(args.n ?? 100)
const seed0 = Number(args.seed ?? 1)

if (args.all !== undefined) {
  const names = Object.keys(TEAMS)
  console.log(`=== 전체 대진표 (각 ${n}회) — 행: ◆ / 열: ◇ / 값: ◆ 승률% (무승부 수) ===\n`)
  console.log('        ' + names.map((x) => x.padStart(11)).join(''))
  for (const a of names) {
    const cells = names.map((b) => {
      const r = runMany(a, b, n, seed0)
      const win = String(Math.round((r.win0 / n) * 100))
      const cell = r.draw > 0 ? `${win}(${r.draw})` : win
      return cell.padStart(11)
    })
    console.log(a.padEnd(8) + cells.join(''))
  }
  process.exit(0)
}

const r = runMany(aName, bName, n, seed0)
console.log(`=== 훈련장: ${aName}(◆) vs ${bName}(◇)  ${n}회  seed ${seed0}~ ===\n`)
console.log(`◆ 승 ${r.win0}  ◇ 승 ${r.win1}  무승부 ${r.draw}`)
console.log(`◆ 승률 ${((r.win0 / n) * 100).toFixed(1)}%   평균 행동 수 ${(r.totalActions / n).toFixed(1)}`)
console.log(`\n사망 빈도 (${n}회 중):`)
for (const t of [0, 1] as const) {
  const team = t === 0 ? TEAMS[aName]() : TEAMS[bName]()
  team.members.forEach((m, i) => {
    const d = r.deaths[t][i]
    console.log(`  ${t === 0 ? '◆' : '◇'} ${m.name.padEnd(4, '　')} ${'█'.repeat(Math.round((d / n) * 20)).padEnd(20)} ${d}`)
  })
}
console.log(`\n우물쭈물 총 ${r.exhausted}회  ·  시전 끊김 ${r.interrupted}회  ·  엄호 ${r.covers}회`)

function runMany(a: string, b: string, count: number, seed: number) {
  const out = {
    win0: 0,
    win1: 0,
    draw: 0,
    totalActions: 0,
    deaths: [[0, 0, 0, 0, 0], [0, 0, 0, 0, 0]] as [number[], number[]],
    exhausted: 0,
    interrupted: 0,
    covers: 0,
  }
  for (let i = 0; i < count; i++) {
    const input: BattleInput = {
      seed: seed + i,
      teams: [TEAMS[a](), TEAMS[b]()],
      config: DEFAULT_CONFIG,
      skills: SKILLS,
    }
    const res = simulate(input)
    if (res.outcome === 'team0') out.win0++
    else if (res.outcome === 'team1') out.win1++
    else out.draw++
    out.totalActions += res.actionCount
    for (const e of res.events) {
      if (e.t === 'death') out.deaths[e.target.team][e.target.index]++
      else if (e.t === 'ruleExhausted') out.exhausted++
      else if (e.t === 'castInterrupted') out.interrupted++
      else if (e.t === 'cover') out.covers++
    }
  }
  return out
}

function parseArgs(argv: string[]): Record<string, string> {
  const out: Record<string, string> = {}
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a.startsWith('--')) {
      const next = argv[i + 1]
      out[a.slice(2)] = next !== undefined && !next.startsWith('--') ? next : ''
    }
  }
  return out
}
