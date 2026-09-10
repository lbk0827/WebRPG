import type { ConditionAtom, Row, StatKey, StatusId } from '@webrpg/engine'
import { STATUS_DEFS } from '@webrpg/engine'
import { KIND_SPECS, PICKER_GROUPS, STAT_LABEL, makeAtom, pickerKey, type EditorAtom, type EditorCondition } from '../lib/condition'

interface Props {
  value: EditorCondition
  onChange: (next: EditorCondition) => void
}

const STATUS_IDS = Object.keys(STATUS_DEFS) as StatusId[]

export function ConditionEditor({ value, onChange }: Props) {
  const update = (i: number, atom: EditorAtom) => onChange({ ...value, atoms: value.atoms.map((a, j) => (j === i ? atom : a)) })
  const remove = (i: number) => onChange({ ...value, atoms: value.atoms.filter((_, j) => j !== i) })
  const add = () => onChange({ ...value, atoms: [...value.atoms, { atom: makeAtom('selfHpPct'), not: false }] })

  return (
    <div className="cond">
      {value.atoms.length === 0 && <div className="cond-always">항상 (조건 없음)</div>}
      {value.atoms.length > 1 && (
        <div className="cond-join">
          <button className={value.join === 'and' ? 'on' : ''} onClick={() => onChange({ ...value, join: 'and' })}>모두 만족</button>
          <button className={value.join === 'or' ? 'on' : ''} onClick={() => onChange({ ...value, join: 'or' })}>하나라도</button>
        </div>
      )}
      {value.atoms.map((ea, i) => (
        <AtomRow key={i} ea={ea} onChange={(a) => update(i, a)} onRemove={() => remove(i)} />
      ))}
      <button className="link" onClick={add}>+ 조건 추가</button>
    </div>
  )
}

function AtomRow({ ea, onChange, onRemove }: { ea: EditorAtom; onChange: (a: EditorAtom) => void; onRemove: () => void }) {
  const { atom } = ea
  const spec = KIND_SPECS[atom.kind]
  const set = (patch: Partial<ConditionAtom>) => onChange({ ...ea, atom: { ...atom, ...patch } as ConditionAtom })

  const onPick = (key: string) => {
    for (const g of PICKER_GROUPS)
      for (const it of g.items)
        if (it.key === key) {
          onChange({ ...ea, atom: makeAtom(it.kind, it.side) })
          return
        }
  }

  return (
    <div className="atom">
      <button className={`not ${ea.not ? 'on' : ''}`} title="조건 반전" onClick={() => onChange({ ...ea, not: !ea.not })}>
        {ea.not ? '아닐 때' : '일 때'}
      </button>
      <select value={pickerKey(atom)} onChange={(e) => onPick(e.target.value)}>
        {PICKER_GROUPS.map((g) => (
          <optgroup key={g.group} label={g.group}>
            {g.items.map((it) => (
              <option key={it.key} value={it.key}>{it.label}</option>
            ))}
          </optgroup>
        ))}
      </select>

      {spec.fields.includes('status') && 'status' in atom && (
        <select value={atom.status} onChange={(e) => set({ status: e.target.value as StatusId })}>
          {STATUS_IDS.map((s) => (
            <option key={s} value={s}>[{STATUS_DEFS[s].label}]</option>
          ))}
        </select>
      )}
      {spec.fields.includes('stat') && 'stat' in atom && (
        <select value={atom.stat} onChange={(e) => set({ stat: e.target.value as StatKey })}>
          {(Object.keys(STAT_LABEL) as StatKey[]).map((k) => (
            <option key={k} value={k}>{STAT_LABEL[k]}</option>
          ))}
        </select>
      )}
      {spec.fields.includes('row') && 'row' in atom && (
        <select value={atom.row} onChange={(e) => set({ row: e.target.value as Row })}>
          <option value="front">전열</option>
          <option value="back">후열</option>
        </select>
      )}
      {spec.fields.includes('value') && (
        <span className="num">
          <input
            type="number"
            inputMode="numeric"
            value={'percent' in atom ? atom.percent : 'value' in atom ? atom.value : 0}
            onChange={(e) => {
              const v = Math.max(0, Math.floor(Number(e.target.value) || 0))
              'percent' in atom ? set({ percent: v } as Partial<ConditionAtom>) : set({ value: v } as Partial<ConditionAtom>)
            }}
          />
          <span className="unit">{spec.unit}</span>
        </span>
      )}
      {spec.fields.includes('cmp') && 'cmp' in atom && (
        <select value={atom.cmp} onChange={(e) => set({ cmp: e.target.value as 'gte' | 'lte' | 'eq' })}>
          <option value="gte">이상</option>
          <option value="lte">이하</option>
          <option value="eq">정확히</option>
        </select>
      )}
      <button className="x" onClick={onRemove} title="조건 삭제">×</button>
    </div>
  )
}
