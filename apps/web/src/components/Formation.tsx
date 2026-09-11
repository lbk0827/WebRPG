// 편성 (유니콘 오버로드 "유닛 상세" 구조). 왼쪽 판 6칸, 오른쪽은 고른 단원의 상세 패널.
// 패널은 캐릭터 탭과 **같은 컴포넌트**(UnitPanel) — 수칙·스탯·스킬·장비·정보를 여기서도 전부 다룬다.
import { useEffect, useState } from 'react'
import type { GameSave, Member } from '../game/save'
import { PARTY_MAX, cellRow } from '../game/save'
import { benchMembers, clearCell, memberById, partyMembers, placeMember, swapCells } from '../game/members'
import { jobIcon, jobName } from '../lib/labels'
import { Board } from './Board'
import { PartyPresets } from './PartyPresets'
import { UnitPanel } from './UnitPanel'
import { RuleTest } from './RuleTest'

interface Props {
  save: GameSave
  onSave: (next: GameSave) => void
  /** 다른 화면에서 들어올 때 미리 고를 칸 */
  initialCell?: number | null
  onGoShop: () => void
}

export function Formation({ save, onSave, initialCell = null, onGoShop }: Props) {
  const [sel, setSel] = useState<number | null>(initialCell)
  const [moveFrom, setMoveFrom] = useState<number | null>(null)
  useEffect(() => { if (initialCell !== null) setSel(initialCell) }, [initialCell])

  const party = partyMembers(save)
  const bench = benchMembers(save)
  const member: Member | undefined = sel !== null ? memberById(save, save.party[sel]) : undefined
  const full = party.length >= PARTY_MAX

  const onCell = (cell: number) => {
    if (moveFrom !== null) {
      onSave(swapCells(save, moveFrom, cell))
      setSel(cell)
      setMoveFrom(null)
      return
    }
    setSel(cell)
  }
  const place = (id: string) => {
    if (sel === null) return
    onSave(placeMember(save, sel, id))
  }
  const remove = () => {
    if (sel === null) return
    onSave(clearCell(save, sel))
  }

  return (
    <section className="formation">
      <div className="formation-grid">
        <div className="left">
          <h2>편성 <small>{party.length}/{PARTY_MAX}명 · 칸을 누르면 오른쪽에서 그 단원을 다룹니다</small></h2>
          <Board save={save} selected={sel} moveFrom={moveFrom} onCell={onCell} />
          {moveFrom !== null && <p className="hint move-hint">옮길 칸을 누르세요 — 누가 있으면 자리를 바꿉니다. <button className="link" onClick={() => setMoveFrom(null)}>취소</button></p>}

          {sel !== null && !member && (
            <div className="bench">
              <h3>{cellRow(sel) === 'front' ? '전열' : '후열'} 빈 칸 <small>{full ? `출전 인원은 ${PARTY_MAX}명까지 — 누군가를 빼야 합니다` : '누굴 세울까'}</small></h3>
              {bench.length === 0 ? (
                <p className="hint">대기 중인 단원이 없습니다. 마을 용병소에서 고용하세요.</p>
              ) : (
                <ul>
                  {bench.map((m) => (
                    <li key={m.id}>
                      <img src={jobIcon(m.job)} alt="" width={28} height={28} />
                      <span className="nm">{m.name}</span>
                      <small>{jobName(m.job)} Lv {m.level}</small>
                      <button className="primary" disabled={full} onClick={() => place(m.id)}>세우기</button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {member && sel !== null && (
            <div className="cell-actions run-bar">
              <button onClick={() => setMoveFrom(sel)} className={moveFrom === sel ? 'on' : ''}>이동·교체</button>
              <button onClick={remove}>대기로</button>
              {bench.length > 0 && (
                <select value="" onChange={(e) => { if (e.target.value) place(e.target.value) }} title="이 칸에 다른 단원을">
                  <option value="">다른 단원으로…</option>
                  {bench.map((m) => (
                    <option key={m.id} value={m.id}>{m.name} · {jobName(m.job)} Lv {m.level}</option>
                  ))}
                </select>
              )}
            </div>
          )}
        </div>

        <div className="right">
          {member ? (
            <UnitPanel
              save={save}
              onSave={onSave}
              member={member}
              initial="rules"
              onGoShop={onGoShop}
              onGoFormation={() => window.scrollTo(0, 0)}
            />
          ) : (
            <div className="unit-panel empty">
              <p className="hint">
                {sel === null ? '판에서 단원을 누르면 여기서 수칙 · 스탯 · 스킬 · 장비를 전부 다룹니다.' : '빈 칸입니다. 대기 목록에서 단원을 세우세요.'}
              </p>
            </div>
          )}
        </div>
      </div>

      <PartyPresets save={save} onSave={onSave} />
      <RuleTest save={save} />
    </section>
  )
}
