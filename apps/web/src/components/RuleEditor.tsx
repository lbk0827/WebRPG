import { useState } from 'react'
import type { RuleRow } from '@webrpg/engine'
import { PRESETS } from '@webrpg/engine'
import type { SlotState } from '../state'
import { jobIcon, jobName, skillLabel } from '../lib/labels'
import { describeCondition, fromCondition, toCondition } from '../lib/condition'
import { ConditionEditor } from './ConditionEditor'

interface Props {
  slots: SlotState[]
  onChange: (i: number, next: SlotState) => void
}

export function RuleEditor({ slots, onChange }: Props) {
  const [sel, setSel] = useState(0)
  const slot = slots[sel]
  const skills = PRESETS[slot.job].skills

  const setRows = (rows: RuleRow[]) => onChange(sel, { ...slot, rules: { rows } })
  const rows = slot.rules.rows

  const updateRow = (i: number, patch: Partial<RuleRow>) => setRows(rows.map((r, j) => (j === i ? { ...r, ...patch } : r)))
  const move = (i: number, d: -1 | 1) => {
    const j = i + d
    if (j < 0 || j >= rows.length) return
    const next = rows.slice()
    ;[next[i], next[j]] = [next[j], next[i]]
    setRows(next)
  }
  const remove = (i: number) => setRows(rows.filter((_, j) => j !== i))
  const add = () => setRows([...rows, { condition: { op: 'always' }, skillId: skills[0] }])
  const reset = () => onChange(sel, { ...slot, rules: structuredClone(PRESETS[slot.job].rules) })

  return (
    <section className="rules">
      <div className="member-tabs">
        {slots.map((s, i) => (
          <button key={i} className={i === sel ? 'on' : ''} onClick={() => setSel(i)}>
            <img src={jobIcon(s.job)} alt="" width={28} height={28} />
            <span>{jobName(s.job)}</span>
            <small>{s.rules.rows.length}조항</small>
          </button>
        ))}
      </div>

      <p className="hint">위에서부터 평가해 <b>처음 참인 조항</b>을 실행합니다. 전부 거짓이면 <b>우물쭈물</b>하며 차례를 넘깁니다.</p>

      <ol className="rows">
        {rows.map((row, i) => {
          const ec = fromCondition(row.condition)
          return (
            <li key={i} className="row">
              <header>
                <span className="idx">{i + 1}</span>
                <span className="summary">{describeCondition(row.condition)} → <b>{skillLabel(row.skillId)}</b></span>
                <span className="tools">
                  <button onClick={() => move(i, -1)} disabled={i === 0} title="위로">↑</button>
                  <button onClick={() => move(i, 1)} disabled={i === rows.length - 1} title="아래로">↓</button>
                  <button onClick={() => remove(i)} title="삭제">×</button>
                </span>
              </header>
              {ec ? (
                <ConditionEditor value={ec} onChange={(next) => updateRow(i, { condition: toCondition(next) })} />
              ) : (
                <div className="cond-readonly">이 조건은 편집기가 표현할 수 없는 형태입니다 (읽기 전용)</div>
              )}
              <div className="action">
                <span>→</span>
                <select value={row.skillId} onChange={(e) => updateRow(i, { skillId: e.target.value })}>
                  {skills.map((id) => (
                    <option key={id} value={id}>{skillLabel(id)}</option>
                  ))}
                </select>
                <label className="uses">
                  <input
                    type="number"
                    inputMode="numeric"
                    placeholder="∞"
                    min={1}
                    value={row.maxUses ?? ''}
                    onChange={(e) => {
                      const v = Math.floor(Number(e.target.value))
                      updateRow(i, { maxUses: v > 0 ? v : undefined })
                    }}
                  />
                  <span>회만</span>
                </label>
              </div>
            </li>
          )
        })}
      </ol>

      <div className="rules-foot">
        <button className="primary" onClick={add}>+ 조항 추가</button>
        <button onClick={reset}>기본 수칙으로</button>
      </div>
    </section>
  )
}
