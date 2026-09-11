// 편성 (단장 요청, 유니콘 오버로드 "유닛 상세" 구조). 왼쪽 판 6칸, 오른쪽 선택 단원의 수칙 · 스탯 · 장비 · 정보.
// 수칙 탭은 이 안으로 들어왔다 — 편성과 수칙은 한 화면에서 오가야 한다.
import { useEffect, useState } from 'react'
import { PRESETS } from '@webrpg/engine'
import type { GameSave, Member, PartyPreset, RulePreset } from '../game/save'
import { PARTY_MAX, PARTY_PRESET_SLOTS, RULE_PRESET_MAX, cellRow } from '../game/save'
import type { GearSlot } from '@webrpg/engine'
import { ITEMS, SLOT_LABEL } from '@webrpg/engine'
import { benchMembers, clearCell, equipItem, equippableFor, learnSkill, memberById, memberStats, partyMembers, placeMember, resetSkills, setGrid, swapCells, unequipItem, updateMember } from '../game/members'
import type { SlotState } from '../state'
import { itemBrief, itemName, jobIcon, jobName, skillLabel } from '../lib/labels'
import { GUARDS, guardByKey, guardKey } from '../lib/guards'
import { Board } from './Board'
import { RuleEditor, type PresetHooks } from './RuleEditor'
import { MemberGrowth } from './MemberGrowth'
import { RuleTest } from './RuleTest'
import { SkillLearn } from './SkillLearn'

interface Props {
  save: GameSave
  onSave: (next: GameSave) => void
  /** 처음 선택할 칸 (다른 화면에서 "수칙 →" 로 들어올 때) */
  initialCell?: number | null
  onGoRoster: () => void
  onGoShop: () => void
}

const GEAR_SLOTS: GearSlot[] = ['weapon', 'armor', 'trinket']

type Panel = 'rules' | 'stats' | 'skills' | 'gear' | 'info'
const PANELS: { key: Panel; label: string }[] = [
  { key: 'rules', label: '수칙' },
  { key: 'stats', label: '스탯' },
  { key: 'skills', label: '스킬' },
  { key: 'gear', label: '장비' },
  { key: 'info', label: '정보' },
]

export function Formation({ save, onSave, initialCell = null, onGoRoster, onGoShop }: Props) {
  const [sel, setSel] = useState<number | null>(initialCell)
  const [moveFrom, setMoveFrom] = useState<number | null>(null)
  const [panel, setPanel] = useState<Panel>('rules')
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

  // 편성 프리셋
  const savePreset = (i: number) => {
    const name = window.prompt('이 편성의 이름', save.partyPresets[i]?.name ?? `편성 ${i + 1}`)
    if (!name || !name.trim()) return
    const presets = save.partyPresets.slice()
    presets[i] = { name: name.trim().slice(0, 12), party: [...save.party] }
    onSave({ ...save, partyPresets: presets })
  }
  const loadPreset = (p: PartyPreset) => onSave(setGrid(save, p.party))
  const clearPreset = (i: number) => {
    const presets = save.partyPresets.slice()
    presets[i] = null
    onSave({ ...save, partyPresets: presets })
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
          <h2>편성 <small>{party.length}/{PARTY_MAX}명 · 칸을 누르면 오른쪽에서 고칩니다</small></h2>
          <Board save={save} selected={sel} moveFrom={moveFrom} onCell={onCell} />
          {moveFrom !== null && <p className="hint move-hint">옮길 칸을 누르세요 — 누가 있으면 자리를 바꿉니다. <button className="link" onClick={() => setMoveFrom(null)}>취소</button></p>}

          {sel !== null && !member && (
            <div className="bench">
              <h3>{cellRow(sel) === 'front' ? '전열' : '후열'} 빈 칸 <small>{full ? `출전 인원은 ${PARTY_MAX}명까지 — 누군가를 빼야 합니다` : '누굴 세울까'}</small></h3>
              {bench.length === 0 ? (
                <p className="hint">대기 중인 단원이 없습니다. <button className="link" onClick={onGoRoster}>단원 →</button></p>
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

          <div className="party-presets">
            <span className="label">편성 저장</span>
            {Array.from({ length: PARTY_PRESET_SLOTS }, (_, i) => {
              const p = save.partyPresets[i]
              return (
                <span key={i} className={`pp ${p ? '' : 'empty'}`}>
                  {p ? (
                    <>
                      <button onClick={() => loadPreset(p)} title={`불러오기: ${p.party.map((id) => memberById(save, id)?.name ?? '—').join(' · ')}`}>{p.name}</button>
                      <button className="mini" onClick={() => savePreset(i)} title="현재 편성으로 덮어쓰기">↻</button>
                      <button className="mini" onClick={() => clearPreset(i)} title="비우기">×</button>
                    </>
                  ) : (
                    <button onClick={() => savePreset(i)}>빈 슬롯 {i + 1} — 저장</button>
                  )}
                </span>
              )
            })}
          </div>
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
              </header>
              <nav className="subnav">
                {PANELS.map((p) => (
                  <button key={p.key} className={panel === p.key ? 'on' : ''} onClick={() => setPanel(p.key)}>
                    {p.label}
                    {p.key === 'stats' && member.statPoints > 0 ? ` (${member.statPoints})` : ''}
                    {p.key === 'skills' && member.skillPoints > 0 ? ` (${member.skillPoints})` : ''}
                  </button>
                ))}
              </nav>
              {panel === 'skills' && (
                <SkillLearn
                  member={member}
                  gold={save.gold}
                  onLearn={(id) => onSave(updateMember(save, learnSkill(member, id)))}
                  onReset={() => onSave(resetSkills(save, member))}
                />
              )}

              {panel === 'rules' && (
                <RuleEditor key={member.id} slots={[slot]} onChange={setSlot} presets={presetHooks} noRow />
              )}
              {panel === 'stats' && <MemberGrowth key={member.id} member={member} onChange={(m) => onSave(updateMember(save, m))} />}
{panel === 'gear' && (
                <div className="gear">
                  <ul className="gear-slots">
                    {GEAR_SLOTS.map((slot) => {
                      const it = member.gear[slot]
                      const d = it ? ITEMS[it.itemId] : undefined
                      const options = equippableFor(save, member, slot)
                      return (
                        <li key={slot}>
                          <b>{SLOT_LABEL[slot]}</b>
                          {d && it ? (
                            <span className="worn">
                              <span className="nm">{itemName(it)}</span>
                              <small>{itemBrief(d, it)}</small>
                            </span>
                          ) : (
                            <span className="empty">— 비어 있음</span>
                          )}
                          <span className="gear-tools">
                            {options.length > 0 && (
                              <select value="" onChange={(e) => { if (e.target.value) onSave(equipItem(save, member.id, e.target.value)) }}>
                                <option value="">{d ? '바꾸기…' : '착용…'}</option>
                                {options.map((o) => (
                                  <option key={o.uid} value={o.uid}>{itemName(o)} — {itemBrief(ITEMS[o.itemId], o)}</option>
                                ))}
                              </select>
                            )}
                            {d && <button className="mini" onClick={() => onSave(unequipItem(save, member.id, slot))}>해제</button>}
                          </span>
                        </li>
                      )
                    })}
                  </ul>
                  <p className="hint">
                    무기는 직업에 맞는 종류만. 창고에 낄 게 없으면 <button className="link" onClick={onGoShop}>상점 →</button>
                    {save.inventory.length > 0 && ` (창고 ${save.inventory.length}개)`}
                  </p>
                </div>
              )}
              {panel === 'info' && (
                <div className="unit-info">
                  <dl>
                    <dt>위치</dt><dd>{member.row === 'front' ? '전열' : '후열'} — 판에서 칸을 옮기면 바뀝니다</dd>
                    <dt>엄호</dt>
                    <dd>
                      <select value={guardKey(member.guard)} onChange={(e) => onSave(updateMember(save, { ...member, guard: guardByKey(e.target.value) }))}>
                        {GUARDS.map((g) => (
                          <option key={g.key} value={g.key}>{g.label}</option>
                        ))}
                      </select>
                    </dd>
                    <dt>보유 스킬</dt>
                    <dd>{member.skills.map(skillLabel).join(' · ')} — <button className="link" onClick={() => setPanel('skills')}>스킬 탭에서 배우기</button></dd>
                  </dl>
                </div>
              )}
            </div>
          ) : (
            <div className="unit-panel empty">
              <p className="hint">{sel === null ? '판에서 단원을 누르면 여기서 수칙·스탯·장비를 고칩니다.' : '빈 칸입니다. 대기 목록에서 단원을 세우세요.'}</p>
            </div>
          )}
        </div>
      </div>

      <RuleTest save={save} />
    </section>
  )
}
