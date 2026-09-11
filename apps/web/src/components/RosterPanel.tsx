// 단원 (M2-1, ADR-004). 단원 전원의 성장(레벨·경험치·스탯 분배)과 용병단 이름, 저장 관리. 편성은 편성 탭에서.
import { useState } from 'react'
import type { StatKey } from '@webrpg/engine'
import { MEMBER_MAX, RENAME_GOLD } from '@webrpg/engine'
import type { GameSave, Member } from '../game/save'
import { DEFAULT_NAME, PARTY_MAX, exportGame, importGame, newGame } from '../game/save'
import { canLearnSomething, cellOf, dismissMember, dismissRefund, learnSkill, partyMembers, renameMember, resetSkills, updateMember } from '../game/members'
import { STAT_HELP, jobIcon, jobName, skillLabel } from '../lib/labels'
import { STAT_LABEL } from '../lib/condition'
import { MemberGrowth } from './MemberGrowth'
import { SkillLearn } from './SkillLearn'
import { Recruit } from './Recruit'

const QUIRK_LABEL: Record<string, string> = { ...STAT_LABEL, maxHp: 'HP', maxSp: 'SP' }

interface Props {
  save: GameSave
  onSave: (next: GameSave) => void
  /** 편성 탭의 그 단원 칸으로 이동 */
  onEditMember: (memberId: string) => void
  onGoFormation: () => void
}

const STAT_KEYS: StatKey[] = ['str', 'int', 'dex', 'spd', 'luk']

export function RosterPanel({ save, onSave, onEditMember, onGoFormation }: Props) {
  const [io, setIo] = useState('')
  const [msg, setMsg] = useState('')
  const setMember = (m: Member) => onSave(updateMember(save, m))
  const party = partyMembers(save)

  return (
    <section className="roster">
      <label className="rename">
        <span>용병단 이름</span>
        <input
          value={save.name}
          maxLength={20}
          placeholder={DEFAULT_NAME}
          onChange={(e) => onSave({ ...save, name: e.target.value })}
          onBlur={(e) => { if (!e.target.value.trim()) onSave({ ...save, name: DEFAULT_NAME }) }}
        />
      </label>

      <Recruit save={save} onSave={onSave} />

      <h2>단원 <small>{save.members.length}/{MEMBER_MAX}명 · 출전 {party.length}/{PARTY_MAX} · 금 {save.gold}</small> <button className="link" onClick={onGoFormation}>편성 판 →</button></h2>
      <details className="stat-help">
        <summary>스탯은 무엇을 하나</summary>
        <ul>
          {STAT_KEYS.map((k) => (
            <li key={k}><b>{STAT_LABEL[k]}</b> — {STAT_HELP[k]}</li>
          ))}
        </ul>
      </details>
      <ul className="members">
        {save.members.map((m) => {
          const cell = cellOf(save, m.id)
          return (
            <li key={m.id} className="member">
              <header>
                <img src={jobIcon(m.job)} alt="" width={40} height={40} />
                <div>
                  <div className="name">{m.name} <small>{jobName(m.job)} · Lv {m.level}{cell >= 0 ? ` · ${m.row === 'front' ? '전열' : '후열'} 출전` : ' · 대기'}</small></div>
                  {m.quirk && Object.keys(m.quirk).length > 0 && (
                    <small className="quirk">특징: {Object.entries(m.quirk).map(([k, v]) => `${QUIRK_LABEL[k] ?? k} ${v > 0 ? '+' : ''}${v}`).join(' · ')}</small>
                  )}
                </div>
                <span className="member-tools">
                  {m.statPoints > 0 && <span className="badge">포인트 {m.statPoints}</span>}
                  <button className="mini" title={`이름 변경 (금 ${RENAME_GOLD})`} onClick={() => { const n = window.prompt(`새 이름 (금 ${RENAME_GOLD})`, m.name); if (n) onSave(renameMember(save, m, n)) }}>이름</button>
                  <button
                    className="mini danger"
                    disabled={save.members.length <= 1}
                    title="해고 — 되돌릴 수 없음"
                    onClick={() => { if (window.confirm(`${m.name}(Lv ${m.level}) 을(를) 보냅니다. 되돌릴 수 없고, 환급은 금 ${dismissRefund(m)} 입니다.`)) onSave(dismissMember(save, m.id)) }}
                  >
                    해고
                  </button>
                </span>
              </header>
              <MemberGrowth member={m} onChange={setMember} />
              <details className="learn-box">
                <summary>
                  스킬 {m.skills.length}종 — {m.skills.map(skillLabel).join(' · ')}
                  {m.skillPoints > 0 && <span className={`badge ${canLearnSomething(m) ? '' : 'dim'}`}>포인트 {m.skillPoints}</span>}
                </summary>
                <SkillLearn member={m} gold={save.gold} onLearn={(id) => setMember(learnSkill(m, id))} onReset={() => onSave(resetSkills(save, m))} />
              </details>
              <div className="skills">
                {cell >= 0 ? (
                  <button className="link" onClick={() => onEditMember(m.id)}>수칙 편집 →</button>
                ) : (
                  <button className="link" onClick={onGoFormation}>편성에 세우기 →</button>
                )}
              </div>
            </li>
          )
        })}
      </ul>

      <details className="saveio">
        <summary>저장 관리</summary>
        <p className="hint">진행은 이 브라우저에 저장됩니다. 다른 기기로 옮기거나 백업하려면 내보내기 → 가져오기. 최근 전투 기록 {save.log.length}건, 수칙 프리셋 {save.rulePresets.length}개도 함께 갑니다.</p>
        <div className="run-bar">
          <button onClick={() => { setIo(exportGame(save)); setMsg('아래 상자의 내용을 복사해 두세요.') }}>내보내기</button>
          <button onClick={() => { const g = importGame(io); if (g) { onSave(g); setMsg('가져왔습니다.') } else setMsg('형식이 맞지 않습니다.') }}>가져오기</button>
          <button onClick={() => { if (window.confirm('진행을 지우고 새로 시작할까요?')) { onSave(newGame()); setMsg('새 게임.') } }}>새 게임</button>
          <small>{msg}</small>
        </div>
        <textarea value={io} onChange={(e) => setIo(e.target.value)} rows={4} placeholder="내보내기를 누르거나, 저장 JSON 을 붙여넣으세요" />
      </details>
    </section>
  )
}
