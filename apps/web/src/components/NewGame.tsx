// 새 게임 (2026-09-14 단장 결정, docs/20). 주인공(모험가) 한 명으로 시작한다 — 성별과 이름을 고른다.
// 성별은 외형(도트)만 바꾼다. 능력치·스킬은 같다. HOF 도 고용 때 성별로 그림만 갈랐다.
import { useState } from 'react'
import { HERO_JOB, PRESETS } from '@webrpg/engine'
import { HERO_DEFAULT_NAME, START_GOLD, newGame, type GameSave, type Gender } from '../game/save'
import { UnitPortrait } from './UnitPortrait'

const GENDERS: { key: Gender; label: string }[] = [
  { key: 'male', label: '남' },
  { key: 'female', label: '여' },
]

interface Props {
  onStart: (g: GameSave) => void
  /** 본부의 "새 게임"으로 들어왔을 때만 — 지금 진행으로 돌아간다 */
  onCancel?: () => void
}

export function NewGame({ onStart, onCancel }: Props) {
  const [gender, setGender] = useState<Gender | null>(null)
  const [name, setName] = useState('')
  const start = () => {
    if (gender) onStart(newGame({ gender, heroName: name }))
  }

  return (
    <div className="app new-game">
      <header className="top">
        <div className="brand">
          <h1>교전 수칙</h1>
        </div>
      </header>
      <main>
        <section className="new-game-card">
          <h2>새 모험</h2>
          <p className="hint">
            당신은 막 용병단을 꾸린 <b>{PRESETS[HERO_JOB].name}</b>입니다. 처음에는 혼자입니다 — 마을 외곽에서 싸워 금을 모으고,
            마을의 용병소에서 동료를 고용하세요. 주인공은 해고할 수 없습니다.
          </p>

          <h3 className="bar-title">성별 <small>외형만 다릅니다. 능력치와 스킬은 같습니다</small></h3>
          <div className="gender-pick" role="radiogroup" aria-label="성별">
            {GENDERS.map((g) => (
              <button key={g.key} role="radio" aria-checked={gender === g.key} className={gender === g.key ? 'on' : ''} onClick={() => setGender(g.key)}>
                <UnitPortrait icon={`${HERO_JOB}-${g.key}`} size="xl" alt={`${PRESETS[HERO_JOB].name} (${g.label})`} />
                <b>{g.label}</b>
              </button>
            ))}
          </div>

          <label className="hero-name">
            <span>이름</span>
            <input value={name} maxLength={12} placeholder={HERO_DEFAULT_NAME} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') start() }} />
          </label>

          <div className="run-bar">
            <button className="primary big" disabled={!gender} onClick={start}>모험 시작</button>
            {onCancel && <button onClick={onCancel}>취소 — 지금 진행으로</button>}
            {!gender && <small>성별을 고르세요.</small>}
          </div>
          <p className="hint">시작 금 {START_GOLD}.</p>
        </section>
      </main>
    </div>
  )
}
