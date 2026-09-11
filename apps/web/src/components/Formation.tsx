// 편성 (유니콘 오버로드 "유닛 상세" 구조). 왼쪽 판 6칸, 오른쪽은 고른 단원의 교전 수칙.
// 스탯·스킬·장비는 캐릭터 탭으로 갈라졌다 (탭 개편 2026-09-11) — 여기는 "누가 어디 서서 무엇을 하는가"만 다룬다.
import { useEffect, useState } from 'react'
import { PRESETS } from '@webrpg/engine'
import type { GameSave, Member, RulePreset } from '../game/save'
import { PARTY_MAX, RULE_PRESET_MAX, cellRow } from '../game/save'
import { benchMembers, clearCell, memberById, memberStats, partyMembers, placeMember, swapCells, updateMember } from '../game/members'
import type { SlotState } from '../state'
import { jobIcon, jobName, skillLabel } from '../lib/labels'
import { Board } from './Board'
import { PartyPresets } from './PartyPresets'
import { RuleEditor, type PresetHooks } from './RuleEditor'
import { RuleTest } from './RuleTest'

interface Props {
  save: GameSave
  onSave: (next: GameSave) => void
  /** 다른 화면에서 들어올 때 미리 고를 칸 */
  initialCell?: number | null
  onGoCharacters: () => void
}

export function Formation({ save, onSave, initialCell = null, onGoCharacters }: Props) {
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

  // 수칙 편집 — 선택 단원 한 명짜리 슬롯
  const slot: SlotState | null = member
    ? { job: member.job, row: member.row, guard: member.guard, rules: member.rules, stats: memberStats(member), skills: member.skills }
    : null
  const setSlot = (_: number, next: SlotState) => {
    if (!member) return
    onSave(updateMember(save, { ...member, guard: next.guard, rules: next.rules }))
  }
  const presetHooks: PresetHooks | undefined = member
    ? {
        list: save.rulePresets,
        onSave: (name) => {
          if (save.rulePresets.length >= RULE_PRESET_MAX) return
          const p: RulePreset = { id: `rp${Date.now()}`, name, job: member.job, rules: structuredClone(member.rules), row: member.row, guard: structuredClone(member.guard) }
          onSave({ ...save, rulePresets: [...save.rulePresets, p] })
        },
        onLoad: (p) => {
          if (p.job !== member.job) return
          onSave(updateMember(save, { ...member, rules: structuredClone(p.rules), guard: structuredClone(p.guard) }))
        },
        onDelete: (id) => onSave({ ...save, rulePresets: save.rulePresets.filter((p) => p.id !== id) }),
      }
    : undefined

  return (
    <section className="formation">
      <div className="formation-grid">
        <div className="left">
          <h2>편성 <small>{party.length}/{PARTY_MAX}명 · 칸을 누르면 오른쪽에서 수칙을 고칩니다</small></h2>
          <Board save={save} selected={sel} moveFrom={moveFrom} onCell={onCell} />
          {moveFrom !== null && <p className="hint move-hint">옮길 칸을 누르세요 — 누가 있으면 자리를 바꿉니다. <button className="link" onClick={() => setMoveFrom(null)}>취소</button></p>}

          {sel !== null && !member && (
            <div className="bench">
              <h3>{cellRow(sel) === 'front' ? '전열' : '후열'} 빈 칸 <small>{full ? `출전 인원은 ${PARTY_MAX}명까지 — 누군가를 빼야 합니다` : '누굴 세울까'}</small></h3>
              {bench.length === 0 ? (
                <p className="hint">대기 중인 단원이 없습니다. <button className="link" onClick={onGoCharacters}>캐릭터 →</button></p>
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
          {member && slot ? (
            <div className="unit-panel">
              <header>
                <img src={jobIcon(member.job)} alt="" width={40} height={40} />
                <div>
                  <div className="name">{member.name} <small>{jobName(member.job)} · Lv {member.level} · {member.row === 'front' ? '전열' : '후열'}</small></div>
                  <small>{member.skills.map(skillLabel).join(' · ')}</small>
                </div>
                <button className="mini" onClick={onGoCharacters} title="스탯 · 스킬 · 장비는 캐릭터 탭에서">캐릭터 →</button>
              </header>
              <RuleEditor key={member.id} slots={[slot]} onChange={setSlot} presets={presetHooks} noRow />
            </div>
          ) : (
            <div className="unit-panel empty">
              <p className="hint">
                {sel === null ? '판에서 단원을 누르면 여기서 교전 수칙을 고칩니다.' : '빈 칸입니다. 대기 목록에서 단원을 세우세요.'}
                {' '}스탯·스킬·장비는 <button className="link" onClick={onGoCharacters}>캐릭터 탭</button>에서.
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
