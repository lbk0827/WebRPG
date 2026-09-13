// 전투 맵 · 모험 맵이 함께 쓰는 편성 부품 (2026-09-13).
//
// 두 화면 모두 제로식 흐름을 따른다 — 편성 저장 → 싸우자/도전 → 단원(체크박스) → 상대.
// 같은 부품을 두 벌 두면 한쪽만 고치는 일이 생기므로 여기 모았다 (docs/11 §5.16 · §5.17).
import { useState } from 'react'
import { ARCHETYPE_LABEL, JOB_ADVANCE, MONSTERS, monsterSetup } from '@webrpg/engine'
import { PARTY_MAX, PARTY_PRESET_SLOTS, type GameSave, type Member, type PartyPreset } from '../game/save'
import { enlistMember, memberById, partyMembers, rowHasRoom, setGrid, setMemberRow, withdrawMember } from '../game/members'
import { jobName } from '../lib/labels'
import { UnitPortrait } from './UnitPortrait'

type MonsterDef = (typeof MONSTERS)[string]

/** "Lv.32 소서리스" 의 직업 자리 — 전직했으면 2차 직업 이름 */
const jobLabel = (m: Member): string => (m.job2 ? JOB_ADVANCE[m.job2].name : jobName(m.job))

/** 편성 저장 — 제로식의 "모험단 [LOAD] [DEL] / 이름 [SAVE]" 줄 */
export function PresetBox({ save, onSave, onGoFormation }: { save: GameSave; onSave: (g: GameSave) => void; onGoFormation: () => void }) {
  const current = JSON.stringify(save.party)
  const inUse = save.partyPresets.findIndex((p) => p !== null && JSON.stringify(p.party) === current)
  const filled = save.partyPresets.findIndex((p) => p !== null)
  const [slot, setSlot] = useState(inUse >= 0 ? inUse : filled >= 0 ? filled : 0)
  const [name, setName] = useState('')
  const p = save.partyPresets[slot] ?? null
  const isCurrent = p !== null && JSON.stringify(p.party) === current
  const empty = partyMembers(save).length === 0

  const put = (next: PartyPreset | null) => {
    const presets = save.partyPresets.slice()
    presets[slot] = next
    onSave({ ...save, partyPresets: presets })
  }
  const store = () => {
    if (empty) return
    if (p && !isCurrent && !window.confirm(`${slot + 1}번 "${p.name}" 을(를) 지금 편성으로 덮어씁니다.`)) return
    put({ name: (name.trim() || p?.name || `편성 ${slot + 1}`).slice(0, 12), party: [...save.party] })
    setName('')
  }
  const remove = () => {
    if (p && window.confirm(`${slot + 1}번 "${p.name}" 을(를) 지웁니다.`)) put(null)
  }
  const who = p ? p.party.map((id) => memberById(save, id)?.name).filter(Boolean).join(' · ') : ''

  return (
    <div className="party-box">
      <div className="pb-row">
        <span className="lbl">편성</span>
        <select value={slot} onChange={(e) => setSlot(Number(e.target.value))} aria-label="편성 슬롯">
          {Array.from({ length: PARTY_PRESET_SLOTS }, (_, i) => {
            const q = save.partyPresets[i]
            return (
              <option key={i} value={i}>
                {i + 1}. {q ? q.name : '(비어 있음)'}
              </option>
            )
          })}
        </select>
        <button disabled={!p || isCurrent} onClick={() => p && onSave(setGrid(save, p.party))}>불러오기</button>
        <button disabled={!p} onClick={remove}>삭제</button>
      </div>
      <div className="pb-row">
        <span className="lbl">이름</span>
        <input value={name} maxLength={12} placeholder={p?.name ?? `편성 ${slot + 1}`} onChange={(e) => setName(e.target.value)} aria-label="편성 이름" />
        <button disabled={empty} onClick={store}>이 슬롯에 저장</button>
      </div>
      <small className="pb-who">
        {p ? (isCurrent ? '지금 쓰는 편성입니다' : who || '비어 있는 편성') : '빈 슬롯 — 지금 편성을 저장할 수 있습니다'}
        {' · '}
        <button className="link" onClick={onGoFormation}>자리 세부 조정은 편성 탭 →</button>
      </small>
    </div>
  )
}

/** 단원 격자 — 제로식 Teams. 전 단원을 한 칸씩 */
export function TeamGrid({ save, onSave }: { save: GameSave; onSave: (g: GameSave) => void }) {
  return (
    <ul className="teams">
      {save.members.map((m) => (
        <TeamCard key={m.id} save={save} onSave={onSave} m={m} />
      ))}
    </ul>
  )
}

/** 단원 카드 — 도트 2배 + 받침 + 이름 · Lv 직업 + 체크박스, 체크되면 전열/후열 */
function TeamCard({ save, onSave, m }: { save: GameSave; onSave: (g: GameSave) => void; m: Member }) {
  const on = save.party.includes(m.id)
  const full = partyMembers(save).length >= PARTY_MAX
  const blocked = !on && full
  const toggle = () => onSave(on ? withdrawMember(save, m.id) : enlistMember(save, m.id))
  return (
    <li className={`team-card ${on ? 'on' : ''} ${blocked ? 'blocked' : ''}`}>
      <label title={blocked ? `출전은 ${PARTY_MAX}명까지입니다` : undefined}>
        <span className="tile"><UnitPortrait icon={m.job} size="xl" alt={m.name} /></span>
        <span className="nm">{m.name}</span>
        <small>Lv.{m.level} {jobLabel(m)}</small>
        <input type="checkbox" checked={on} disabled={blocked} onChange={toggle} />
      </label>
      {on && (
        <div className="row-toggle" role="group" aria-label={`${m.name} 서는 열`}>
          {(['front', 'back'] as const).map((r) => {
            const here = m.row === r
            const noRoom = !here && !rowHasRoom(save, r)
            return (
              <button
                key={r}
                className={here ? 'on' : ''}
                disabled={noRoom}
                title={noRoom ? `${r === 'front' ? '전열' : '후열'}이 꽉 찼습니다 (3칸)` : undefined}
                onClick={() => onSave(setMemberRow(save, m.id, r))}
              >
                {r === 'front' ? '전열' : '후열'}
              </button>
            )
          })}
        </div>
      )}
    </li>
  )
}

/** 상대 카드 — 제로식 MonsterAppearance 의 한 칸. 우리 쪽을 보게 좌우 반전된다. name 은 "고블린 투사 2" 처럼 번호 붙은 이름 */
export function MonsterCard({ def, name }: { def: MonsterDef; name?: string }) {
  return (
    <li className="appear-card">
      <span className="tile"><UnitPortrait icon={def.icon ?? def.job} size="xl" alt={name ?? def.name} /></span>
      <span className="nm">{name ?? def.name}</span>
      <small>Lv.{def.level} · {ARCHETYPE_LABEL[def.archetype]}</small>
      <small>HP {monsterSetup(def, 0).stats.maxHp}</small>
    </li>
  )
}

/** 숨김 조우 — 모르고 만나는 것이 그 설계의 요점이라 정체를 보이지 않는다 */
export function RumorCard() {
  return (
    <li className="appear-card rumor">
      <span className="tile"><span className="q" aria-hidden="true">?</span></span>
      <span className="nm">소문뿐인 상대</span>
      <small>드물게 나온다</small>
    </li>
  )
}
