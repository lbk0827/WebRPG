// 편성 프리셋 (단장 요청 2026-09-11 — 유니콘 오버로드처럼 여러 개를 편집·저장).
// 슬롯마다 판 미리보기가 그대로 보인다. 불러오기 · 현재 편성으로 덮어쓰기 · 이름 · 비우기.
import { PARTY_PRESET_SLOTS, type GameSave, type PartyPreset } from '../game/save'
import { memberById, setGrid } from '../game/members'
import { Board } from './Board'

interface Props {
  save: GameSave
  onSave: (next: GameSave) => void
}

const memberNames = (save: GameSave, p: PartyPreset): string[] =>
  p.party.map((id) => memberById(save, id)?.name).filter((n): n is string => !!n)

export function PartyPresets({ save, onSave }: Props) {
  const put = (i: number, p: PartyPreset | null) => {
    const presets = save.partyPresets.slice()
    presets[i] = p
    onSave({ ...save, partyPresets: presets })
  }
  const store = (i: number) => {
    const name = window.prompt('이 편성의 이름', save.partyPresets[i]?.name ?? `편성 ${i + 1}`)
    if (!name || !name.trim()) return
    put(i, { name: name.trim().slice(0, 12), party: [...save.party] })
  }
  const rename = (i: number) => {
    const p = save.partyPresets[i]
    if (!p) return
    const name = window.prompt('이름 바꾸기', p.name)
    if (!name || !name.trim()) return
    put(i, { ...p, name: name.trim().slice(0, 12) })
  }

  const current = JSON.stringify(save.party)

  return (
    <div className="preset-shelf">
      <h3>편성 저장 <small>판을 짜 두고 골라 쓴다. 불러오면 지금 판을 덮어쓴다</small></h3>
      <ul className="preset-grid">
        {Array.from({ length: PARTY_PRESET_SLOTS }, (_, i) => {
          const p = save.partyPresets[i]
          if (!p) {
            return (
              <li key={i} className="preset empty">
                <button className="slot-empty" onClick={() => store(i)} title="지금 편성을 이 슬롯에 저장">
                  <span className="plus">+</span>
                  <small>빈 슬롯 {i + 1}</small>
                  <small className="sub">지금 편성 저장</small>
                </button>
              </li>
            )
          }
          const names = memberNames(save, p)
          const isCurrent = JSON.stringify(p.party) === current
          return (
            <li key={i} className={`preset ${isCurrent ? 'on' : ''}`}>
              <div className="preset-head">
                <b>{p.name}</b>
                {isCurrent && <span className="badge">사용 중</span>}
              </div>
              <button
                className="preset-board"
                onClick={() => onSave(setGrid(save, p.party))}
                title={`불러오기: ${names.join(' · ') || '비어 있음'}`}
              >
                <Board save={save} party={p.party} mini bare />
              </button>
              <small className="preset-who">{names.length ? `${names.length}명 · ${names.join(' · ')}` : '비어 있음'}</small>
              <div className="preset-tools">
                <button onClick={() => onSave(setGrid(save, p.party))} disabled={isCurrent}>불러오기</button>
                <button className="mini" onClick={() => store(i)} title="지금 편성으로 덮어쓰기">↻</button>
                <button className="mini" onClick={() => rename(i)} title="이름 바꾸기">✎</button>
                <button className="mini" onClick={() => { if (window.confirm(`"${p.name}" 슬롯을 비울까요?`)) put(i, null) }} title="비우기">×</button>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
