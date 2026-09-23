// 수칙 편집기 바로 아래의 "한 판 시험" (ADR-004 §5 K — 제로식 Set & Test 에서 착안).
// 보상·기록 없음. 상대는 훈련 팀 또는 지역의 예상 조우. 같은 시드는 같은 결과.
import { useMemo, useState } from 'react'
import type { BattleResult, TeamSetup } from '@webrpg/engine'
import { DEFAULT_CONFIG, REGIONS, SKILLS, analyze, rollEncounter, simulate } from '@webrpg/engine'
import type { GameSave } from '../game/save'
import { partyTeam } from '../game/members'
import { ENEMY_OPTIONS, enemyTeam } from '../state'
import { jobOf, outcomeText, type Names } from '../lib/labels'
import { diagnose } from '../lib/diagnose'
import { Replay } from './Replay'

interface Props {
  save: GameSave
}

export function RuleTest({ save }: Props) {
  const [enemyKey, setEnemyKey] = useState<string>(`region:${REGIONS[0].id}`)
  const [seed, setSeed] = useState(1)
  const [result, setResult] = useState<{ r: BattleResult; player: TeamSetup; enemy: TeamSetup } | null>(null)

  const player = useMemo(() => partyTeam(save), [save])
  const enemy = useMemo((): TeamSetup => {
    if (enemyKey.startsWith('region:')) {
      const region = REGIONS.find((x) => x.id === enemyKey.slice(7)) ?? REGIONS[0]
      return rollEncounter(region, seed)
    }
    return enemyTeam(enemyKey)
  }, [enemyKey, seed])

  const run = () => {
    const r = simulate({ seed, teams: [player, enemy], config: DEFAULT_CONFIG, skills: SKILLS })
    setResult({ r, player, enemy })
  }

  const names: Names | null = result ? [result.player.members.map((m) => m.name), result.enemy.members.map((m) => m.name)] : null
  const jobs: [string[], string[]] | null = result ? [result.player.members.map((m) => jobOf(m.id)), result.enemy.members.map((m) => jobOf(m.id))] : null
  const analysis = result ? analyze(result.r, [result.player.members.length, result.enemy.members.length]) : null

  return (
    <section className="rule-test">
      <h3>한 판 시험 <small>보상·기록 없음. 지금 수칙 그대로 붙어 본다</small></h3>
      <div className="run-bar">
        <label>상대
          <select value={enemyKey} onChange={(e) => { setEnemyKey(e.target.value); setResult(null) }}>
            <optgroup label="지역 (예상 조우)">
              {REGIONS.map((r) => (
                <option key={r.id} value={`region:${r.id}`}>{r.name} · Lv {r.recommended[0]}–{r.recommended[1]}</option>
              ))}
            </optgroup>
            <optgroup label="훈련 팀">
              {ENEMY_OPTIONS.map((o) => (
                <option key={o.key} value={o.key}>{o.label}</option>
              ))}
            </optgroup>
          </select>
        </label>
        <label>시드 <input type="number" inputMode="numeric" value={seed} onChange={(e) => { setSeed(Math.max(0, Math.floor(Number(e.target.value) || 0))); setResult(null) }} /></label>
        <button className="primary" onClick={run} disabled={player.members.length === 0}>한 판</button>
        {result && <button onClick={() => { setSeed(seed + 1); setResult(null) }} title="다른 시드로">시드 +1</button>}
      </div>
      {result && names && jobs && analysis && (
        <>
          <div className={`verdict ${result.r.outcome === 'team0' ? 'ok' : 'fail'}`}>
            <b>{outcomeText(result.r.outcome)}</b> · 상대 {result.enemy.members.map((m) => m.name).join(' · ')} · {result.r.actionCount}회 행동
            {result.r.outcome !== 'team0' && (
              <ul>
                {diagnose(analysis, names[0]).map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
              </ul>
            )}
          </div>
          <Replay result={result.r} names={names} jobs={jobs} autoPlay={false} />
        </>
      )}
    </section>
  )
}
