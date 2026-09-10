import { useState } from 'react'
import { PRESETS } from '@webrpg/engine'
import { ENEMY_OPTIONS, slotFromPreset, type SlotState } from '../state'
import { jobIcon, jobName, skillLabel } from '../lib/labels'
import { GUARDS, guardByKey, guardKey } from '../lib/guards'

interface Props {
  slots: SlotState[]
  enemy: string
  onSlot: (i: number, next: SlotState) => void
  onEnemy: (key: string) => void
}

const JOBS = Object.keys(PRESETS)

export function PartyPanel({ slots, enemy, onSlot, onEnemy }: Props) {
  const [picking, setPicking] = useState<number | null>(null)

  return (
    <section className="party">
      <h2>내 용병단</h2>
      <ul className="slots">
        {slots.map((s, i) => {
          const p = PRESETS[s.job]
          return (
            <li key={i} className={`slot ${s.row}`}>
              <button className="avatar" onClick={() => setPicking(picking === i ? null : i)} title="직업 바꾸기">
                <img src={jobIcon(s.job)} alt="" width={44} height={44} />
              </button>
              <div className="info">
                <div className="name">{jobName(s.job)} <small>HP {p.stats.maxHp} · SP {p.stats.maxSp} · 속도 {p.stats.spd}</small></div>
                <div className="skills">{p.skills.map(skillLabel).join(' · ')}</div>
                <div className="controls">
                  <span className="seg">
                    <button className={s.row === 'front' ? 'on' : ''} onClick={() => onSlot(i, { ...s, row: 'front' })}>전열</button>
                    <button className={s.row === 'back' ? 'on' : ''} onClick={() => onSlot(i, { ...s, row: 'back' })}>후열</button>
                  </span>
                  <select value={guardKey(s.guard)} onChange={(e) => onSlot(i, { ...s, guard: guardByKey(e.target.value) })}>
                    {GUARDS.map((g) => (
                      <option key={g.key} value={g.key}>{g.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              {picking === i && (
                <div className="picker">
                  {JOBS.map((job) => (
                    <button
                      key={job}
                      className={job === s.job ? 'on' : ''}
                      onClick={() => {
                        onSlot(i, slotFromPreset(job))
                        setPicking(null)
                      }}
                    >
                      <img src={jobIcon(job)} alt="" width={36} height={36} />
                      <span>{jobName(job)}</span>
                    </button>
                  ))}
                </div>
              )}
            </li>
          )
        })}
      </ul>

      <h2>상대</h2>
      <select className="enemy" value={enemy} onChange={(e) => onEnemy(e.target.value)}>
        {ENEMY_OPTIONS.map((o) => (
          <option key={o.key} value={o.key}>{o.label}</option>
        ))}
      </select>
      <p className="hint">상대는 기본 수칙을 그대로 씁니다. 상대의 수칙은 바꿀 수 없습니다 — 내 수칙으로 이겨야 합니다.</p>
    </section>
  )
}
