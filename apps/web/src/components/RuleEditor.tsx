import { useState } from 'react'
import type { MissionLimits, RuleRow } from '@webrpg/engine'
import { PRESETS, maxRuleRows, nextRuleRowInt } from '@webrpg/engine'
import type { SlotState } from '../state'
import { jobIcon, jobName, skillLabel } from '../lib/labels'
import { describeCondition, fromCondition, toCondition } from '../lib/condition'
import { GUARDS, guardByKey, guardKey } from '../lib/guards'
import { ConditionEditor } from './ConditionEditor'

interface Props {
  slots: SlotState[]
  onChange: (i: number, next: SlotState) => void
  /** 편집 가능한 슬롯. 생략 시 전부 */
  editable?: number[]
  limits?: MissionLimits
  /** 처음 선택할 슬롯 */
  initial?: number
  /** 단원 이름 표시 덮어쓰기 (과제용) */
  names?: string[]
}

export function RuleEditor({ slots, onChange, editable, limits, initial = 0, names }: Props) {
  const [sel, setSel] = useState(initial)
  const [open, setOpen] = useState<Record<number, boolean>>({})
  const slot = slots[sel]
  const canEdit = !editable || editable.includes(sel)
  const reorderOnly = limits?.reorderOnly === true
  const guardOnly = limits?.guardOnly === true
  const rowsLocked = !canEdit || guardOnly
  const skills = PRESETS[slot.job].skills
  const rows = slot.rules.rows

  const setRows = (next: RuleRow[]) => onChange(sel, { ...slot, rules: { rows: next } })
  const updateRow = (i: number, patch: Partial<RuleRow>) => setRows(rows.map((r, j) => (j === i ? { ...r, ...patch } : r)))
  const move = (i: number, d: -1 | 1) => {
    const j = i + d
    if (j < 0 || j >= rows.length) return
    const next = rows.slice()
    ;[next[i], next[j]] = [next[j], next[i]]
    setRows(next)
  }
  const remove = (i: number) => setRows(rows.filter((_, j) => j !== i))
  const add = () => {
    setRows([...rows, { condition: { op: 'always' }, skillId: skills[0] }])
    setOpen((o) => ({ ...o, [rows.length]: true }))
  }
  const reset = () => onChange(sel, { ...slot, rules: structuredClone(PRESETS[slot.job].rules) })
  const statCap = maxRuleRows(PRESETS[slot.job].stats)
  const cap = Math.min(statCap, limits?.maxRows ?? statCap)
  const atMax = rows.length >= cap
  const nextInt = nextRuleRowInt(PRESETS[slot.job].stats)

  return (
    <section className="rules">
      {slots.length > 1 && (
        <div className="member-tabs">
          {slots.map((s, i) => {
            const locked = editable && !editable.includes(i)
            return (
              <button key={i} className={`${i === sel ? 'on' : ''} ${locked ? 'locked' : ''}`} onClick={() => setSel(i)}>
                <img src={jobIcon(s.job)} alt="" width={28} height={28} />
                <span>{names?.[i] ?? jobName(s.job)}</span>
                <small>{locked ? '고정' : `${s.rules.rows.length}조항`}</small>
              </button>
            )
          })}
        </div>
      )}

      {canEdit && !reorderOnly && (
        <div className="slot-controls">
          {!guardOnly && (
            <span className="seg">
              <button className={slot.row === 'front' ? 'on' : ''} onClick={() => onChange(sel, { ...slot, row: 'front' })}>전열</button>
              <button className={slot.row === 'back' ? 'on' : ''} onClick={() => onChange(sel, { ...slot, row: 'back' })}>후열</button>
            </span>
          )}
          <label>엄호
            <select value={guardKey(slot.guard)} onChange={(e) => onChange(sel, { ...slot, guard: guardByKey(e.target.value) })}>
              {GUARDS.map((g) => (
                <option key={g.key} value={g.key}>{g.label}</option>
              ))}
            </select>
          </label>
        </div>
      )}

      {!canEdit && <p className="hint">이 단원의 수칙은 이 과제에서 고정입니다.</p>}
      {canEdit && guardOnly && <p className="hint">이 과제에서는 <b>엄호 방침만</b> 바꿀 수 있습니다.</p>}
      {canEdit && reorderOnly && <p className="hint">이 과제에서는 <b>조항의 순서만</b> 바꿀 수 있습니다. ↑↓ 로 옮기세요.</p>}
      {canEdit && !reorderOnly && !guardOnly && (
        <p className="hint">위에서부터 평가해 <b>처음 참인 조항</b>을 실행합니다. 전부 거짓이면 <b>우물쭈물</b>하며 차례를 넘깁니다. 조항을 누르면 펼쳐집니다.
          {' '}조항 <b>{rows.length}/{cap}</b>{nextInt !== null && ` · 지능 ${nextInt}에서 +1`}</p>
      )}

      <ol className="rows">
        {rows.map((row, i) => {
          const ec = fromCondition(row.condition)
          const expanded = !rowsLocked && !reorderOnly && open[i] === true
          return (
            <li key={i} className={`row ${expanded ? 'open' : ''}`}>
              <header onClick={() => !rowsLocked && !reorderOnly && setOpen((o) => ({ ...o, [i]: !o[i] }))}>
                <span className="idx">{i + 1}</span>
                <span className="summary">
                  {describeCondition(row.condition)} → <b>{skillLabel(row.skillId)}</b>
                  {row.maxUses !== undefined && <small> · {row.maxUses}회만</small>}
                </span>
                {!rowsLocked && (
                  <span className="tools" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => move(i, -1)} disabled={i === 0} title="위로">↑</button>
                    <button onClick={() => move(i, 1)} disabled={i === rows.length - 1} title="아래로">↓</button>
                    {!reorderOnly && <button onClick={() => remove(i)} title="삭제">×</button>}
                  </span>
                )}
              </header>
              {expanded && (
                <>
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
                </>
              )}
            </li>
          )
        })}
      </ol>

      {!rowsLocked && !reorderOnly && (
        <div className="rules-foot">
          <button className="primary" onClick={add} disabled={atMax}>{atMax ? `조항 ${cap}개까지 (지능)` : '+ 조항 추가'}</button>
          {!editable && <button onClick={reset}>기본 수칙으로</button>}
        </div>
      )}
    </section>
  )
}
