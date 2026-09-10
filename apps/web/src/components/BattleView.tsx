import { useMemo, useState } from 'react'
import type { BattleResult, TeamSetup } from '@webrpg/engine'
import { DEFAULT_CONFIG, SKILLS, simulate } from '@webrpg/engine'
import { jobOf, type Names } from '../lib/labels'
import { Replay } from './Replay'

interface Props {
  player: TeamSetup
  enemy: TeamSetup
  seed: number
  onSeed: (s: number) => void
}

export function BattleView({ player, enemy, seed, onSeed }: Props) {
  const [result, setResult] = useState<BattleResult | null>(null)
  const names: Names = useMemo(() => [player.members.map((m) => m.name), enemy.members.map((m) => m.name)], [player, enemy])
  const jobs = useMemo((): [string[], string[]] => [player.members.map((m) => jobOf(m.id)), enemy.members.map((m) => jobOf(m.id))], [player, enemy])

  const run = () => setResult(simulate({ seed, teams: [player, enemy], config: DEFAULT_CONFIG, skills: SKILLS }))

  return (
    <section className="battle">
      <div className="run-bar">
        <label>시드 <input type="number" inputMode="numeric" value={seed} onChange={(e) => onSeed(Math.max(0, Math.floor(Number(e.target.value) || 0)))} /></label>
        <button className="primary" onClick={run}>전투 실행</button>
        {result && <button onClick={() => onSeed(seed + 1)} title="다른 시드로">시드 +1</button>}
      </div>
      {result ? <Replay result={result} names={names} jobs={jobs} /> : <p className="hint">편성과 수칙을 정한 뒤 <b>전투 실행</b>을 누르세요. 같은 시드는 항상 같은 결과를 냅니다.</p>}
    </section>
  )
}
