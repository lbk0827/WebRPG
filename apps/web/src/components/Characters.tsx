// 캐릭터 (탭 개편 2026-09-11, 단장 지시). 보유한 모든 단원이 한 화면에.
// 왼쪽 목록에서 고르면 오른쪽에서 스탯 분배 · 스킬 습득 · 장비 교체 · 정보를 다룬다.
import { useEffect, useState } from 'react'
import { MEMBER_MAX, RENAME_GOLD, STARTER_SKILLS } from '@webrpg/engine'
import type { GameSave, Member } from '../game/save'
import { PARTY_MAX } from '../game/save'
import {
  canLearnSomething, cellOf, dismissMember, dismissRefund, gearSummary, learnSkill, memberStats, partyMembers, renameMember, resetSkills, updateMember,
} from '../game/members'
import { jobIcon, jobName, skillLabel } from '../lib/labels'
import { STAT_LABEL } from '../lib/condition'
import { MemberGrowth } from './MemberGrowth'
import { SkillLearn } from './SkillLearn'
import { GearPanel } from './GearPanel'

interface Props {
  save: GameSave
  onSave: (next: GameSave) => void
  onGoShop: () => void
  onGoRecruit: () => void
  onGoFormation: () => void
}

type Panel = 'stats' | 'skills' | 'gear' | 'info'
const PANELS: { key: Panel; label: string }[] = [
  { key: 'stats', label: '스탯' },
  { key: 'skills', label: '스킬' },
  { key: 'gear', label: '장비' },
  { key: 'info', label: '정보' },
]

const QUIRK_LABEL: Record<string, string> = { ...STAT_LABEL, maxHp: 'HP', maxSp: 'SP' }

export function Characters({ save, onSave, onGoShop, onGoRecruit, onGoFormation }: Props) {
  const [sel, setSel] = useState<string | null>(save.members[0]?.id ?? null)
  const [panel, setPanel] = useState<Panel>('stats')
  const member = save.members.find((m) => m.id === sel) ?? null
  const party = partyMembers(save)

  // 해고 등으로 선택이 사라지면 첫 단원으로
  useEffect(() => {
    if (sel && !save.members.some((m) => m.id === sel)) setSel(save.members[0]?.id ?? null)
  }, [save.members, sel])

  const setMember = (m: Member) => onSave(updateMember(save, m))

  return (
    <section className="characters">
      <h2>
        캐릭터 <small>{save.members.length}/{MEMBER_MAX}명 · 출전 {party.length}/{PARTY_MAX} · 금 {save.gold}</small>
        <button className="link" onClick={onGoRecruit}>마을 → 용병소 →</button>
      </h2>

      <div className="char-grid">
        <ul className="char-list">
          {save.members.map((m) => {
            const cell = cellOf(save, m.id)
            const s = memberStats(m)
            const g = gearSummary(m)
            const todo = m.statPoints > 0 || canLearnSomething(m)
            return (
              <li key={m.id} className={`char-card ${sel === m.id ? 'on' : ''} ${cell >= 0 ? 'out' : ''}`}>
                <button onClick={() => setSel(m.id)}>
                  <img src={jobIcon(m.job)} alt="" width={40} height={40} />
                  <span className="body">
                    <span className="nm">{m.name}{todo && <i className="dot" title="분배하거나 배울 것이 있습니다" />}</span>
                    <small>{jobName(m.job)} · Lv {m.level} · {cell >= 0 ? `${m.row === 'front' ? '전열' : '후열'} 출전` : '대기'}</small>
                    <small>HP {s.maxHp} · 패턴 {m.rules.rows.length} · 장비 {g.weapon !== 'none' || Object.keys(m.gear ?? {}).length ? `${Object.keys(m.gear ?? {}).length}칸` : '없음'}</small>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>

        <div className="char-detail">
          {member ? (
            <div className="unit-panel">
              <header>
                <img src={jobIcon(member.job)} alt="" width={40} height={40} />
                <div>
                  <div className="name">{member.name} <small>{jobName(member.job)} · Lv {member.level}</small></div>
                  {member.quirk && Object.keys(member.quirk).length > 0 && (
                    <small className="quirk">특징: {Object.entries(member.quirk).map(([k, v]) => `${QUIRK_LABEL[k] ?? k} ${v > 0 ? '+' : ''}${v}`).join(' · ')}</small>
                  )}
                </div>
                <span className="member-tools">
                  <button className="mini" title={`이름 변경 (금 ${RENAME_GOLD})`} onClick={() => { const n = window.prompt(`새 이름 (금 ${RENAME_GOLD})`, member.name); if (n) onSave(renameMember(save, member, n)) }}>이름</button>
                  <button
                    className="mini danger"
                    disabled={save.members.length <= 1}
                    title="해고 — 되돌릴 수 없음"
                    onClick={() => { if (window.confirm(`${member.name}(Lv ${member.level}) 을(를) 보냅니다. 되돌릴 수 없고, 환급은 금 ${dismissRefund(member)} 입니다. 장비는 창고로 돌아옵니다.`)) onSave(dismissMember(save, member.id)) }}
                  >
                    해고
                  </button>
                </span>
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

              {panel === 'stats' && <MemberGrowth key={member.id} member={member} onChange={setMember} />}
              {panel === 'skills' && (
                <SkillLearn
                  member={member}
                  gold={save.gold}
                  onLearn={(id) => setMember(learnSkill(member, id))}
                  onReset={() => onSave(resetSkills(save, member))}
                />
              )}
              {panel === 'gear' && <GearPanel save={save} onSave={onSave} member={member} onGoShop={onGoShop} />}
              {panel === 'info' && (
                <div className="unit-info">
                  <dl>
                    <dt>편성</dt>
                    <dd>
                      {cellOf(save, member.id) >= 0 ? `${member.row === 'front' ? '전열' : '후열'} 출전 중` : '대기 중'} —{' '}
                      <button className="link" onClick={onGoFormation}>편성 판에서 세우기 →</button>
                    </dd>
                    <dt>수칙</dt>
                    <dd>{member.rules.rows.length}줄 — <button className="link" onClick={onGoFormation}>편성 탭에서 편집 →</button></dd>
                    <dt>시작 스킬</dt>
                    <dd>{(STARTER_SKILLS[member.job] ?? []).map(skillLabel).join(' · ')}</dd>
                    <dt>배운 스킬</dt>
                    <dd>{member.skills.filter((id) => !(STARTER_SKILLS[member.job] ?? []).includes(id)).map(skillLabel).join(' · ') || '아직 없음'}</dd>
                    <dt>고용가</dt>
                    <dd>{member.hiredFor ? `금 ${member.hiredFor} (해고 시 ${dismissRefund(member)} 환급)` : '창단 단원 — 환급 없음'}</dd>
                  </dl>
                </div>
              )}
            </div>
          ) : (
            <div className="unit-panel empty"><p className="hint">단원이 없습니다.</p></div>
          )}
        </div>
      </div>
    </section>
  )
}
