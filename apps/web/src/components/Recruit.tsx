// 모집소 (M2-3, docs/07 §3.2). 제로식 인재 알선소(직업 그림 + 가격 그리드)에서 착안. 이름은 플레이어가 짓는다.
import { useState } from 'react'
import { UnitPortrait } from './UnitPortrait'
import { HIRE, MEMBER_MAX, PRESETS } from '@webrpg/engine'
import type { GameSave } from '../game/save'
import { canHire, currentHireLevel, currentHirePrice, hireMember } from '../game/members'
import { jobName } from '../lib/labels'

interface Props {
  save: GameSave
  onSave: (next: GameSave) => void
  /** 고용 직후 (편성에 세우라고 안내) */
  onHired?: (memberId: string) => void
}

export function Recruit({ save, onSave, onHired }: Props) {
  const [job, setJob] = useState<string | null>(null)
  const [name, setName] = useState('')
  const full = save.members.length >= MEMBER_MAX
  const level = currentHireLevel(save)

  const hire = () => {
    if (!job) return
    const next = hireMember(save, job, name || jobName(job), Date.now())
    if (next === save) return
    onSave(next)
    setJob(null)
    setName('')
    onHired?.(next.members[next.members.length - 1].id)
  }

  return (
    <div className="recruit">
      <h3>모집소 <small>보유 {save.members.length}/{MEMBER_MAX} · 금 {save.gold} · 지금 고용하면 Lv {level}</small></h3>
      {full && <p className="hint">단원이 꽉 찼습니다. 누군가를 보내야 새로 받습니다.</p>}
      <ul className="hire-grid">
        {Object.keys(PRESETS).map((j) => {
          const price = currentHirePrice(save, j)
          const ok = canHire(save, j)
          return (
            <li key={j} className={`hire-card ${job === j ? 'on' : ''} ${ok ? '' : 'far'}`}>
              <button onClick={() => setJob(job === j ? null : j)} disabled={full}>
                <UnitPortrait icon={j} size="md" />
                <b>{jobName(j)}</b>
                <span className="price">금 {price}</span>
                <small>{HIRE[j].blurb}</small>
              </button>
            </li>
          )
        })}
      </ul>
      {job && (
        <div className="hire-form run-bar">
          <label>이름
            <input value={name} maxLength={12} placeholder={jobName(job)} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') hire() }} />
          </label>
          <button className="primary" onClick={hire} disabled={!canHire(save, job)}>
            {jobName(job)} 고용 — 금 {currentHirePrice(save, job)}
          </button>
          {!canHire(save, job) && !full && <small>금이 모자랍니다.</small>}
          <small>같은 직업을 몇 명이든 둘 수 있습니다. 다만 스탯이 직업 기본값에서 ±5% 안팎으로 조금씩 달라 전사 둘이 똑같지는 않습니다.</small>
        </div>
      )}
    </div>
  )
}
