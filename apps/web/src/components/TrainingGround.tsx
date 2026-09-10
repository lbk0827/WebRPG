// 훈련장: 행동력 없이 아무 상대와 반복 대전. 한 판 보기(재생) + N회 승률.
import { useMemo, useState } from 'react'
import type { GameSave } from '../game/save'
import { partyTeam } from '../game/members'
import { ENEMY_OPTIONS, enemyTeam } from '../state'
import { BattleView } from './BattleView'
import { Trainer } from './Trainer'

interface Props {
  save: GameSave
}

export function TrainingGround({ save }: Props) {
  const [enemyKey, setEnemyKey] = useState(ENEMY_OPTIONS[0]?.key ?? 'rush')
  const [seed, setSeed] = useState(1)
  const player = useMemo(() => partyTeam(save), [save])
  const enemy = useMemo(() => enemyTeam(enemyKey), [enemyKey])

  return (
    <section className="training">
      <h2>훈련장 <small>행동력 없음 · 보상 없음 · 상대는 기본 수칙의 훈련 팀</small></h2>
      <div className="run-bar">
        <label>상대
          <select value={enemyKey} onChange={(e) => setEnemyKey(e.target.value)}>
            {ENEMY_OPTIONS.map((o) => (
              <option key={o.key} value={o.key}>{o.label}</option>
            ))}
          </select>
        </label>
      </div>
      {player.members.length === 0 ? (
        <p className="hint">단원 탭에서 편성을 먼저 하세요.</p>
      ) : (
        <>
          <h3>한 판 보기</h3>
          <BattleView player={player} enemy={enemy} seed={seed} onSeed={setSeed} />
          <h3>반복 훈련</h3>
          <Trainer player={player} enemy={enemy} seed={seed} />
        </>
      )}
    </section>
  )
}
