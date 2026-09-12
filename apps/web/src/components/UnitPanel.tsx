// 단원 상세 — **한 페이지에 전부 펼친다** (단장 지시 2026-09-12).
//
// 전에는 탭으로 나눠 한 번에 하나만 보였다. 단장이 제로식 캐릭터 페이지를 보고
// "설정하고 보기 편하다"고 했다. 맞는 지적이다 — 수칙을 짜면서 스탯·스킬·장비를
// 동시에 봐야 하는데 탭은 그걸 막는다.
//
// 다만 그쪽의 약점(세로 여덟 화면을 그냥 스크롤, 섹션마다 저장 버튼이 따로)은 피한다:
//   · 머리와 **구역 이동 바**가 붙어 있어 어디서든 한 번에 건너뛴다
//   · 지금 보고 있는 구역이 이동 바에 표시된다
//   · 저장 버튼이 없다. 고치는 즉시 저장된다
// 편성 탭과 캐릭터 탭이 같은 컴포넌트를 쓴다 (단장 지시 2026-09-11).
import { useEffect, useRef, useState } from 'react'
import { UnitPortrait } from './UnitPortrait'
import { JOB_ADVANCE, RENAME_GOLD, STARTER_SKILLS } from '@webrpg/engine'
import type { GameSave, Member, RulePreset } from '../game/save'
import { RULE_PRESET_MAX } from '../game/save'
import { cellOf, dismissMember, dismissRefund, learnSkill, memberCanAdvance, memberStats, renameMember, resetSkills, updateMember } from '../game/members'
import type { SlotState } from '../state'
import { jobName, skillLabel } from '../lib/labels'
import { STAT_LABEL } from '../lib/condition'
import { RuleEditor, type PresetHooks } from './RuleEditor'
import { MemberGrowth } from './MemberGrowth'
import { SkillLearn } from './SkillLearn'
import { GearPanel } from './GearPanel'
import { AdvancePanel } from './AdvancePanel'

export type UnitTab = 'rules' | 'stats' | 'skills' | 'gear' | 'advance' | 'info'

interface SectionDef {
  key: UnitTab
  label: string
  /** 물음표를 눌렀을 때 나오는 한 줄 */
  help: string
}

const SECTIONS: SectionDef[] = [
  { key: 'rules', label: '교전 수칙', help: '위에서부터 평가해 처음 참인 줄을 실행한다. 전부 거짓이면 우물쭈물하고 차례를 넘긴다. 칸 수는 지능이 정한다.' },
  { key: 'stats', label: '스탯', help: '분배는 미리보기다. 확정을 눌러야 저장된다. 지능은 패턴 칸, 손재주는 선딜 단축, 운은 저항으로 간다.' },
  { key: 'skills', label: '스킬', help: '스킬 포인트로 산다. 배우지 않은 스킬은 수칙에 넣어도 발동하지 않는다.' },
  { key: 'gear', label: '장비', help: '무기 · 방어구 · 장신구 세 칸. 무기 종류가 맞지 않으면 그 무기를 쓰는 스킬이 나가지 않는다.' },
  { key: 'advance', label: '전직', help: '2차 직업은 세지는 것이 아니라 다르게 싸우는 것이다. 훅이 가리키는 조건을 수칙에 넣어야 값이 나온다.' },
  { key: 'info', label: '정보', help: '편성 위치, 배운 스킬, 고용가.' },
]

const QUIRK_LABEL: Record<string, string> = { ...STAT_LABEL, maxHp: 'HP', maxSp: 'SP' }

interface Props {
  save: GameSave
  onSave: (next: GameSave) => void
  member: Member
  /** 열자마자 스크롤해 갈 구역. 편성은 'rules', 캐릭터는 'stats' */
  initial?: UnitTab
  onGoShop: () => void
  onGoFormation: () => void
}

export function UnitPanel({ save, onSave, member, initial = 'stats', onGoShop, onGoFormation }: Props) {
  const [here, setHere] = useState<UnitTab>(initial)
  const [helpOn, setHelpOn] = useState<UnitTab | null>(null)
  const refs = useRef<Partial<Record<UnitTab, HTMLElement | null>>>({})
  const setMember = (m: Member) => onSave(updateMember(save, m))
  const cell = cellOf(save, member.id)
  const adv = member.job2 ? JOB_ADVANCE[member.job2] : undefined

  const jump = (k: UnitTab) => {
    setHere(k)
    refs.current[k]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  // 지금 보고 있는 구역을 이동 바에 표시한다 (제로식에는 없는 것 — 거기선 어디쯤인지 모른다)
  useEffect(() => {
    const seen = new Map<UnitTab, number>()
    const ob = new IntersectionObserver(
      (entries) => {
        for (const e of entries) seen.set(e.target.getAttribute('data-sec') as UnitTab, e.intersectionRatio)
        let best: UnitTab | null = null
        let bestRatio = 0
        for (const [k, v] of seen) if (v > bestRatio) { bestRatio = v; best = k }
        if (best && bestRatio > 0) setHere(best)
      },
      { threshold: [0, 0.25, 0.6, 1] },
    )
    for (const el of Object.values(refs.current)) if (el) ob.observe(el)
    return () => ob.disconnect()
  }, [member.id])

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

  const badge = (k: UnitTab): string => {
    if (k === 'rules') return `${member.rules.rows.length}`
    if (k === 'stats') return member.statPoints > 0 ? `${member.statPoints}` : ''
    if (k === 'skills') return member.skillPoints > 0 ? `${member.skillPoints}` : ''
    if (k === 'advance') return memberCanAdvance(member) ? '!' : ''
    return ''
  }

  const body = (k: UnitTab) => {
    switch (k) {
      case 'rules':
        return <RuleEditor key={member.id} slots={[slot]} onChange={setSlot} presets={presetHooks} noRow />
      case 'stats':
        return <MemberGrowth key={member.id} member={member} onChange={setMember} />
      case 'skills':
        return (
          <SkillLearn
            key={member.id}
            member={member}
            gold={save.gold}
            onLearn={(id) => setMember(learnSkill(member, id))}
            onReset={() => onSave(resetSkills(save, member))}
          />
        )
      case 'gear':
        return <GearPanel save={save} onSave={onSave} member={member} onGoShop={onGoShop} />
      case 'advance':
        return <AdvancePanel key={member.id} save={save} onSave={onSave} member={member} />
      case 'info':
        return (
          <div className="unit-info">
            <dl>
              <dt>편성</dt>
              <dd>
                {cell >= 0 ? `${member.row === 'front' ? '전열' : '후열'} 출전 중 (${cell < 3 ? '전열' : '후열'} ${(cell % 3) + 1}번 칸)` : '대기 중'} —{' '}
                <button className="link" onClick={onGoFormation}>편성 판 →</button>
              </dd>
              <dt>시작 스킬</dt>
              <dd>{(STARTER_SKILLS[member.job] ?? []).map(skillLabel).join(' · ')}</dd>
              {adv && (
                <>
                  <dt>전직으로 받은 스킬</dt>
                  <dd>{adv.grants.map(skillLabel).join(' · ')}</dd>
                </>
              )}
              <dt>포인트로 배운 스킬</dt>
              <dd>
                {member.skills
                  .filter((id) => !(STARTER_SKILLS[member.job] ?? []).includes(id) && !(adv?.grants ?? []).includes(id))
                  .map(skillLabel)
                  .join(' · ') || '아직 없음'}
              </dd>
              <dt>고용가</dt>
              <dd>{member.hiredFor ? `금 ${member.hiredFor} (해고 시 ${dismissRefund(member)} 환급)` : '창단 단원 — 환급 없음'}</dd>
            </dl>
          </div>
        )
    }
  }

  return (
    <div className="unit-panel onepage">
      <header>
        <UnitPortrait icon={member.job} size="md" />
        <div>
          <div className="name">
            {member.name}{' '}
            <small>
              {adv ? `${adv.name} (${jobName(member.job)})` : jobName(member.job)} · Lv {member.level} ·{' '}
              {cell >= 0 ? (member.row === 'front' ? '전열 출전' : '후열 출전') : '대기'}
            </small>
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

      <nav className="jumpbar" aria-label="구역 이동">
        {SECTIONS.map((s) => {
          const b = badge(s.key)
          return (
            <button key={s.key} className={here === s.key ? 'on' : ''} onClick={() => jump(s.key)}>
              {s.label}
              {b && <i className={`tag ${b === '!' ? 'alert' : ''}`}>{b}</i>}
            </button>
          )
        })}
      </nav>

      {SECTIONS.map((s) => (
        <section
          key={s.key}
          className="unit-sec"
          data-sec={s.key}
          ref={(el) => {
            refs.current[s.key] = el
          }}
        >
          <h3>
            {s.label}
            <button className="qmark" aria-label={`${s.label} 설명`} onClick={() => setHelpOn(helpOn === s.key ? null : s.key)}>
              ?
            </button>
          </h3>
          {helpOn === s.key && <p className="sec-help">{s.help}</p>}
          {body(s.key)}
        </section>
      ))}
    </div>
  )
}
