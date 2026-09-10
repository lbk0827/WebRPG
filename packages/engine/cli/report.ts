// 전황 보고서 렌더러 (콘솔). 이벤트 로그가 UI 없이도 읽히는지 검증하는 도구.
// 사용: npm run report -- --a balanced --b rush --seed 7
import { DEFAULT_CONFIG, SKILLS, TEAMS, simulate } from '../src'
import type { BattleEvent, BattleInput, CharRef, TeamSnapshot } from '../src'

const args = parseArgs(process.argv.slice(2))
const aName = args.a ?? 'balanced'
const bName = args.b ?? 'rush'
const seed = Number(args.seed ?? 1)

const input: BattleInput = {
  seed,
  teams: [TEAMS[aName](), TEAMS[bName]()],
  config: DEFAULT_CONFIG,
  skills: SKILLS,
}
const result = simulate(input)

const names: [string[], string[]] = [
  input.teams[0].members.map((m) => m.name),
  input.teams[1].members.map((m) => m.name),
]
const who = (r: CharRef): string => `${r.team === 0 ? '◆' : '◇'}${names[r.team][r.index]}`
const sk = (id: string): string => SKILLS[id]?.label ?? id

console.log(`=== ${input.teams[0].name}(◆) vs ${input.teams[1].name}(◇)  seed=${seed} ===\n`)

let step = 0
for (const e of result.events) console.log(render(e))

console.log(`\n=== 결과: ${outcomeText(result.outcome)} (총 ${result.actionCount}회 행동) ===`)

function render(e: BattleEvent): string {
  switch (e.t) {
    case 'battleStart':
      return roster(e.teams)
    case 'turnBegin':
      step++
      return `\n[${String(step).padStart(3)}] ${who(e.actor)} 의 차례`
    case 'ruleFired':
      return `      ${e.ruleIndex + 1}번 조항 발동 → ${sk(e.skillId)}`
    case 'ruleExhausted':
      return `      ✗ 수칙에 없는 상황이라 우물쭈물했다`
    case 'skillFailed':
      return `      · ${e.ruleIndex + 1}번 조항 ${sk(e.skillId)} 불가 (${failText(e.reason)})`
    case 'castStart':
      return `      ${sk(e.skillId)} 시전 시작…`
    case 'castResolve':
      return `      ${sk(e.skillId)} 발동!`
    case 'castInterrupted':
      return `      ‼ ${who(e.target)} 의 ${sk(e.skillId)} 시전이 끊겼다`
    case 'cover':
      return `      ${who(e.defender)} 가 ${who(e.protectedChar)} 를 엄호`
    case 'damage':
      return e.nullified
        ? `      ${who(e.target)} 의 보호막이 공격을 막았다`
        : `      → ${who(e.target)} 에게 ${e.amount} 피해`
    case 'heal':
      return `      → ${who(e.target)} HP +${e.amount}`
    case 'spChange':
      return e.delta > 0 ? `      → ${who(e.target)} SP +${e.delta}` : ''
    case 'statusApply':
      return `      → ${who(e.target)} [${e.status}] ${e.duration}턴`
    case 'statusResisted':
      return `      ${who(e.target)} 이(가) [${e.status}] 을 저항했다`
    case 'statusTick':
      return `      ${who(e.target)} [${e.status}] ${e.amount} 피해`
    case 'statusExpire':
      return `      ${who(e.target)} [${e.status}] 해제`
    case 'gaugeShift':
      return `      → ${who(e.target)} 행동 게이지 ${e.delta > 0 ? '+' : ''}${e.delta}`
    case 'death':
      return `      ☠ ${who(e.target)} 쓰러짐`
    case 'revive':
      return `      ✚ ${who(e.target)} 소생 (HP ${e.hp})`
    case 'statusReport':
      return `\n----- ${e.actionCount}회 행동 시점 전황 -----\n${roster(e.teams)}`
    case 'battleEnd':
      return ''
  }
}

function roster(teams: [TeamSnapshot, TeamSnapshot]): string {
  const line = (t: TeamSnapshot, mark: string): string =>
    t
      .map((c) => {
        const tag = c.alive ? `${c.hp}/${c.maxHp} SP${c.sp}` : '☠'
        const cast = c.casting ? ` (${sk(c.casting)} 시전중)` : ''
        const stat = c.statuses.length ? ` {${c.statuses.map((s) => s.id).join(',')}}` : ''
        return `  ${mark}${c.name.padEnd(4, '　')} ${c.row === 'front' ? '전' : '후'} ${tag}${cast}${stat}`
      })
      .join('\n')
  return `${line(teams[0], '◆')}\n${line(teams[1], '◇')}`
}

function failText(r: 'noSp' | 'noRequiredTarget' | 'silenced'): string {
  return r === 'noSp' ? 'SP 부족' : r === 'noRequiredTarget' ? '대상 없음' : '침묵 상태'
}

function outcomeText(o: string): string {
  return o === 'team0' ? '◆ 승리' : o === 'team1' ? '◇ 승리' : '무승부'
}

function parseArgs(argv: string[]): Record<string, string> {
  const out: Record<string, string> = {}
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a.startsWith('--')) out[a.slice(2)] = argv[i + 1] ?? ''
  }
  return out
}
