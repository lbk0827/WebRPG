// 단원 상세 패널 — 수칙 · 스탯 · 스킬 · 장비 · 정보.
// 편성 탭(판에서 칸 선택)과 캐릭터 탭(목록에서 선택)이 **같은 컴포넌트**를 쓴다 (단장 지시 2026-09-11).
// 두 곳의 차이는 처음 열리는 절(편성=수칙, 캐릭터=스탯)뿐이다.
import { useState } from 'react'
import { RENAME_GOLD, STARTER_SKILLS } from '@webrpg/engine'
import type { GameSave, Member, RulePreset } from '../game/save'
import { RULE_PRESET_MAX } from '../game/save'
import { cellOf, dismissMember, dismissRefund, learnSkill, memberStats, renameMember, resetSkills, updateMember } from '../game/members'
import type { SlotState } from '../state'
import { jobIcon, jobName, skillLabel } from '../lib/labels'
import { STAT_LABEL } from '../lib/condition'
import { RuleEditor, type PresetHooks } from './RuleEditor'
import { MemberGrowth } from './MemberGrowth'
import { SkillLearn } from './SkillLearn'
import { GearPanel } from './GearPanel'

export type UnitTab = 'rules' | 'stats' | 'skills' | 'gear' | 'info'

const TABS: { key: UnitTab; label: string }[] = [
  { key: 'rules', label: '수칙' },
  { key: 'stats', label: '스탯' },
  { key: 'skills', label: '스킬' },
  { key: 'gear', label: '장비' },
  { key: 'info', label: '정보' },
]

const QUIRK_LABEL: Record<string, string> = { ...STAT_LABEL, maxHp: 'HP', maxSp: 'SP' }

interface Props {
  save: GameSave
  onSave: (next: GameSave) => void
  member: Member
  /** 처음 열 절. 편성은 'rules', 캐릭터는 'stats' */
  initial?: UnitTab
  onGoShop: () => void
  onGoFormation: () => void
}

export function UnitPanel({ save, onSave, member, initial = 'stats', onGoShop, onGoFormation }: Props) {
  const [tab, setTab] = useState<UnitTab>(initial)
  const setMember = (m: Member) => onSave(updateMember(save, m))
  const cell = cellOf(save, member.id)

  // 수칙 편집기가 받는 한 명짜리 슬롯. 열은 편성 판이 정하므로 전열/후열 버튼은 숨긴다
  const slot: SlotState = {
    job: member.job,
    row: member.row,
    guard: member.guard,
    rules: member.rules,
    stats: memberStats(member),
    skills: member.skills,
  }
  const setSlot = (_: number, next: SlotState) => setMember({ ...member, guard: next.guard, rules: next.rules })

  const presetHooks: PresetHooks = {
    list: save.rulePresets,
    onSave: (name) => {
      if (save.rulePresets.length >= RULE_PRESET_MAX) return
      const p: RulePreset = { id: `rp${Date.now()}`, name, job: member.job, rules: structuredClone(member.rules), row: member.row, guard: structuredClone(member.guard) }
      onSave({ ...save, rulePresets: [...save.rulePresets, p] })
    },
    onLoad: (p) => {
      if (p.job !== member.job) return
      setMember({ ...member, rules: structuredClone(p.rules), guard: structuredClone(p.guard) })
    },
    onDelete: (id) => onSave({ ...save, rulePresets: save.rulePresets.filter((p) => p.id !== id) }),
  }

  return (
    <div className="unit-panel">
      <header>
        <img src={jobIcon(member.job)} alt="" width={40} height={40} />
        <div>
          <div className="name">
            {member.name} <small>{jobName(member.job)} · Lv {member.level} · {cell >= 0 ? (member.row === 'front' ? '전열 출전' : '후열 출전') : '대기'}</small>
          </div>
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
        {TABS.map((t) => (
          <button key={t.key} className={tab === t.key ? 'on' : ''} onClick={() => setTab(t.key)}>
            {t.label}
            {t.key === 'rules' ? ` (${member.rules.rows.length})` : ''}
            {t.key === 'stats' && member.statPoints > 0 ? ` (${member.statPoints})` : ''}
            {t.key === 'skills' && member.skillPoints > 0 ? ` (${member.skillPoints})` : ''}
          </button>
        ))}
      </nav>

      {tab === 'rules' && <RuleEditor key={member.id} slots={[slot]} onChange={setSlot} presets={presetHooks} noRow />}
      {tab === 'stats' && <MemberGrowth key={member.id} member={member} onChange={setMember} />}
      {tab === 'skills' && (
        <SkillLearn
          key={member.id}
          member={member}
          gold={save.gold}
          onLearn={(id) => setMember(learnSkill(member, id))}
          onReset={() => onSave(resetSkills(save, member))}
        />
      )}
      {tab === 'gear' && <GearPanel save={save} onSave={onSave} member={member} onGoShop={onGoShop} />}
      {tab === 'info' && (
        <div className="unit-info">
          <dl>
            <dt>편성</dt>
            <dd>
              {cell >= 0 ? `${member.row === 'front' ? '전열' : '후열'} 출전 중 (${cell < 3 ? '전열' : '후열'} ${(cell % 3) + 1}번 칸)` : '대기 중'} —{' '}
              <button className="link" onClick={onGoFormation}>편성 판 →</button>
            </dd>
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
  )
}
