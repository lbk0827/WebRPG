// 출전 명단 — 전투·모험 화면 맨 위 (단장 지시 2026-09-12, 제로식 전투 화면의 Party/Teams 자리).
//
// 제로식은 전투 화면에서 보유 캐릭터를 **체크박스**로 골라 바로 출전한다. 캐릭터 화면으로 나갈 일이 없다.
// 우리도 그 편함을 가져오되 체크박스는 안 쓴다 — 우리는 **칸이 열(전열/후열)을 정하기** 때문에
// "누가 가나"와 "어디 서나"가 같은 동작이다. 그래서 편성 탭과 **같은 판**을 여기 올린다.
//
// 나누는 기준: 여기서는 **빠른 교체**(프리셋 불러오기 · 한 명 바꾸기), 편성 탭에서는 **관리**(프리셋 저장·이름·삭제).
// 판이 두 곳에 있어도 같은 판·같은 데이터라 "어느 쪽이 진짜인지" 문제가 없다.
import { useState } from 'react'
import { UnitPortrait } from './UnitPortrait'
import { PARTY_MAX, PARTY_PRESET_SLOTS, cellRow, type GameSave } from '../game/save'
import { benchMembers, clearCell, memberById, partyMembers, partySummary, placeMember, setGrid, swapCells } from '../game/members'
import { jobName } from '../lib/labels'
import { Board } from './Board'

interface Props {
  save: GameSave
  onSave: (next: GameSave) => void
  onGoFormation: () => void
}

export function PartyBar({ save, onSave, onGoFormation }: Props) {
  const [sel, setSel] = useState<number | null>(null)
  const [moveFrom, setMoveFrom] = useState<number | null>(null)
  const party = partyMembers(save)
  const bench = benchMembers(save)
  const us = partySummary(save)
  const member = sel !== null ? memberById(save, save.party[sel]) : undefined
  const full = party.length >= PARTY_MAX
  const current = JSON.stringify(save.party)

  const onCell = (cell: number) => {
    if (moveFrom !== null) {
      onSave(swapCells(save, moveFrom, cell))
      setSel(cell)
      setMoveFrom(null)
      return
    }
    setSel(sel === cell ? null : cell)
  }

  const saveTo = (i: number) => {
    const name = window.prompt('이 편성의 이름', `편성 ${i + 1}`)
    if (!name || !name.trim()) return
    const presets = save.partyPresets.slice()
    presets[i] = { name: name.trim().slice(0, 12), party: [...save.party] }
    onSave({ ...save, partyPresets: presets })
  }

  return (
    <div className="party-bar">
      <h3>
        출전 명단
        <small>{party.length}/{PARTY_MAX}명 · Lv 합 {us.levelSum} · HP 합 {us.hpSum}</small>
        <button className="link" onClick={onGoFormation}>편성 탭에서 자세히 →</button>
      </h3>

      <div className="party-bar-body">
        <Board save={save} compact selected={sel} moveFrom={moveFrom} onCell={onCell} />

        <div className="party-bar-side">
          {/* 프리셋 — 눌러서 통째로 교체. 저장·이름·삭제는 편성 탭에서 */}
          <div className="preset-row">
            <span className="lbl">프리셋</span>
            {Array.from({ length: PARTY_PRESET_SLOTS }, (_, i) => {
              const p = save.partyPresets[i]
              if (!p) {
                return (
                  <button key={i} className="chip empty" title="지금 편성을 여기 저장" onClick={() => saveTo(i)}>
                    + 저장
                  </button>
                )
              }
              const names = p.party.map((id) => memberById(save, id)?.name).filter(Boolean)
              const on = JSON.stringify(p.party) === current
              return (
                <button
                  key={i}
                  className={`chip ${on ? 'on' : ''}`}
                  disabled={on}
                  title={on ? '지금 쓰는 편성' : `불러오기 — ${names.join(' · ') || '비어 있음'}`}
                  onClick={() => onSave(setGrid(save, p.party))}
                >
                  {p.name}
                </button>
              )
            })}
          </div>

          {sel === null && (
            <p className="hint">
              칸을 누르면 그 자리를 바꿉니다. 프리셋을 누르면 판을 통째로 갈아 끼웁니다.
            </p>
          )}

          {sel !== null && member && (
            <div className="cell-edit">
              <b>{member.name}</b>{' '}
              <small>{jobName(member.job)} Lv {member.level} · {cellRow(sel) === 'front' ? '전열' : '후열'}</small>
              <div className="run-bar">
                <button className={moveFrom === sel ? 'on' : ''} onClick={() => setMoveFrom(moveFrom === sel ? null : sel)}>
                  {moveFrom === sel ? '이동 취소' : '이동·교체'}
                </button>
                <button onClick={() => { onSave(clearCell(save, sel)); setSel(null) }}>대기로</button>
              </div>
              {moveFrom === sel && <small className="warn-line">옮길 칸을 누르세요. 누가 있으면 자리를 바꿉니다.</small>}
            </div>
          )}

          {sel !== null && !member && (
            <div className="cell-edit">
              <b>{cellRow(sel) === 'front' ? '전열' : '후열'} 빈 칸</b>{' '}
              <small>{full ? `출전은 ${PARTY_MAX}명까지 — 누군가를 빼야 합니다` : '누굴 세울까'}</small>
              {bench.length === 0 ? (
                <p className="hint">대기 중인 단원이 없습니다. 마을 용병소에서 고용하세요.</p>
              ) : (
                <ul className="bench-row">
                  {bench.map((m) => (
                    <li key={m.id}>
                      <button disabled={full} onClick={() => { onSave(placeMember(save, sel, m.id)); setSel(null) }} title={`${jobName(m.job)} Lv ${m.level}`}>
                        <UnitPortrait icon={m.job} size="xs" />
                        <span className="nm">{m.name}</span>
                        <small>Lv {m.level}</small>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
