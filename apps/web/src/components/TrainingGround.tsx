// 훈련장: 행동력 없이 아무 상대와 반복 대전. 한 판 보기(재생) + N회 승률.
// 2026-09-12: 다른 화면과 같은 구역 형식(`▌제목 ?`)으로 맞췄다.
import { useMemo, useState } from 'react'
import type { GameSave } from '../game/save'
import { partyTeam } from '../game/members'
import { ENEMY_OPTIONS, enemyTeam } from '../state'
import { BattleView } from './BattleView'
import { Trainer } from './Trainer'
import { Section } from './Section'

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

      <Section
        title="상대 고르기"
        help="훈련 팀은 프리셋 수칙을 그대로 쓰는 다섯 명이다. 실제 몬스터가 아니므로 지역 공략이 아니라 수칙 자체를 시험하는 용도다."
      >
        <div className="run-bar">
          <label>상대
            <select value={enemyKey} onChange={(e) => setEnemyKey(e.target.value)}>
              {ENEMY_OPTIONS.map((o) => (
                <option key={o.key} value={o.key}>{o.label}</option>
              ))}
            </select>
          </label>
        </div>
      </Section>

      {player.members.length === 0 ? (
        <p className="hint">편성 탭에서 단원을 먼저 세우세요.</p>
      ) : (
        <>
          <Section
            title="한 판 보기"
            help="같은 시드는 항상 같은 결과를 냅니다. 수칙을 고친 뒤 같은 시드로 다시 돌리면 무엇이 달라졌는지 정확히 비교할 수 있습니다."
          >
            <BattleView player={player} enemy={enemy} seed={seed} onSeed={setSeed} />
          </Section>
          <Section
            title="반복 훈련"
            help="한 판은 운이 섞입니다. 30~300회를 돌려 승률로 보세요. 사망 빈도와 우물쭈물 횟수가 어느 단원의 수칙이 비었는지 알려 줍니다."
          >
            <Trainer player={player} enemy={enemy} seed={seed} />
          </Section>
        </>
      )}
    </section>
  )
}
