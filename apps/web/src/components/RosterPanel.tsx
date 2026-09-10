// 단원 (M2-1, ADR-004). 편성 5슬롯 + 편성 프리셋 3 + 단원 성장(레벨·경험치·스탯 분배 미리보기→확정·파생 수치) + 용병단 이름 + 저장 관리.
import { useState } from 'react'
import type { Alloc, StatKey } from '@webrpg/engine'
import { EMPTY_ALLOC, PRESETS, STAT_CAP, derivedStats, expToNext, maxRuleRows, nextRuleRowInt } from '@webrpg/engine'
import type { GameSave, Member, PartyPreset } from '../game/save'
import { DEFAULT_NAME, PARTY_PRESET_SLOTS, exportGame, importGame, newGame } from '../game/save'
import { allocateMany, memberById, memberStats, updateMember } from '../game/members'
import { STAT_HELP, jobIcon, jobName, skillLabel } from '../lib/labels'
import { GUARDS, guardByKey, guardKey } from '../lib/guards'
import { STAT_LABEL } from '../lib/condition'

interface Props {
  save: GameSave
  onSave: (next: GameSave) => void
  /** 편성 순번의 단원 수칙 편집으로 이동 */
  onEditRules: (partyIndex: number) => void
}

const STAT_KEYS: StatKey[] = ['str', 'int', 'dex', 'spd', 'luk']
const sumAlloc = (a: Alloc): number => STAT_KEYS.reduce((s, k) => s + a[k], 0)

export function RosterPanel({ save, onSave, onEditRules }: Props) {
  const [io, setIo] = useState('')
  const [msg, setMsg] = useState('')
  /** 단원별 미확정 분배 (ADR-004 §5 O) */
  const [pending, setPending] = useState<Record<string, Alloc>>({})

  const setParty = (slot: number, id: string | null) => {
    const party = save.party.map((p, i) => (i === slot ? id : p === id ? null : p))
    onSave({ ...save, party })
  }
  const setMember = (m: Member) => onSave(updateMember(save, m))
  const partyIndexOf = (id: string): number => save.party.indexOf(id)

  const pendingOf = (m: Member): Alloc => pending[m.id] ?? EMPTY_ALLOC
  const bump = (m: Member, k: StatKey, d: 1 | -1) => {
    const p = pendingOf(m)
    const next = { ...p, [k]: Math.max(0, p[k] + d) }
    if (d > 0 && sumAlloc(next) > m.statPoints) return
    setPending((all) => ({ ...all, [m.id]: next }))
  }
  const confirm = (m: Member) => {
    setMember(allocateMany(m, pendingOf(m)))
    setPending((all) => { const n = { ...all }; delete n[m.id]; return n })
  }
  const revert = (m: Member) => setPending((all) => { const n = { ...all }; delete n[m.id]; return n })

  const savePartyPreset = (i: number) => {
    const name = window.prompt('이 편성의 이름', save.partyPresets[i]?.name ?? `편성 ${i + 1}`)
    if (!name || !name.trim()) return
    const presets = save.partyPresets.slice()
    presets[i] = { name: name.trim().slice(0, 12), party: [...save.party] }
    onSave({ ...save, partyPresets: presets })
  }
  const loadPartyPreset = (p: PartyPreset) => {
    const party = p.party.map((id) => (id && save.members.some((m) => m.id === id) ? id : null))
    onSave({ ...save, party: [...party, ...Array(Math.max(0, 5 - party.length)).fill(null)].slice(0, 5) })
  }
  const clearPartyPreset = (i: number) => {
    const presets = save.partyPresets.slice()
    presets[i] = null
    onSave({ ...save, partyPresets: presets })
  }

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

      <h2>편성 <small>5명까지. 전열/후열과 엄호는 여기서</small></h2>
      <ol className="slots">
        {save.party.map((id, i) => {
          const m = memberById(save, id)
          return (
            <li key={i} className={`slot ${m ? m.row : 'empty'}`}>
              {m ? (
                <button className="avatar" title="단원 교체" onClick={() => setParty(i, null)}>
                  <img src={jobIcon(m.job)} alt="" width={44} height={44} />
                </button>
              ) : (
                <span className="avatar empty">{i + 1}</span>
              )}
              <div className="info">
                <select value={id ?? ''} onChange={(e) => setParty(i, e.target.value || null)}>
                  <option value="">— 비움 —</option>
                  {save.members.map((x) => (
                    <option key={x.id} value={x.id}>{x.name} · {jobName(x.job)} Lv {x.level}</option>
                  ))}
                </select>
                {m && (
                  <div className="controls">
                    <span className="seg">
                      <button className={m.row === 'front' ? 'on' : ''} onClick={() => setMember({ ...m, row: 'front' })}>전열</button>
                      <button className={m.row === 'back' ? 'on' : ''} onClick={() => setMember({ ...m, row: 'back' })}>후열</button>
                    </span>
                    <select value={guardKey(m.guard)} onChange={(e) => setMember({ ...m, guard: guardByKey(e.target.value) })}>
                      {GUARDS.map((g) => (
                        <option key={g.key} value={g.key}>{g.label}</option>
                      ))}
                    </select>
                    <button className="link" onClick={() => onEditRules(i)}>수칙 →</button>
                  </div>
                )}
              </div>
            </li>
          )
        })}
      </ol>

      <div className="party-presets">
        <span className="label">편성 저장</span>
        {Array.from({ length: PARTY_PRESET_SLOTS }, (_, i) => {
          const p = save.partyPresets[i]
          return (
            <span key={i} className={`pp ${p ? '' : 'empty'}`}>
              {p ? (
                <>
                  <button onClick={() => loadPartyPreset(p)} title={`불러오기: ${p.party.map((id) => memberById(save, id)?.name ?? '—').join(' · ')}`}>{p.name}</button>
                  <button className="mini" onClick={() => savePartyPreset(i)} title="현재 편성으로 덮어쓰기">↻</button>
                  <button className="mini" onClick={() => clearPartyPreset(i)} title="비우기">×</button>
                </>
              ) : (
                <button onClick={() => savePartyPreset(i)}>빈 슬롯 {i + 1} — 저장</button>
              )}
            </span>
          )
        })}
      </div>

      <h2>단원 <small>{save.members.length}명 · 금 {save.gold}</small></h2>
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
          const pend = pendingOf(m)
          const used = sumAlloc(pend)
          const previewMember: Member = used > 0 ? { ...m, alloc: { ...m.alloc, ...Object.fromEntries(STAT_KEYS.map((k) => [k, m.alloc[k] + pend[k]])) } } : m
          const s = memberStats(previewMember)
          const base = memberStats(m)
          const d = derivedStats(s)
          const next = expToNext(m.level)
          const p = PRESETS[m.job]
          const pi = partyIndexOf(m.id)
          const left = m.statPoints - used
          return (
            <li key={m.id} className={`member ${used > 0 ? 'previewing' : ''}`}>
              <header>
                <img src={jobIcon(m.job)} alt="" width={40} height={40} />
                <div>
                  <div className="name">{m.name} <small>{jobName(m.job)} · Lv {m.level}{pi >= 0 ? ` · 편성 ${pi + 1}번` : ' · 대기'}</small></div>
                  <div className="bar exp"><i style={{ width: next ? `${Math.min(100, (m.exp / next) * 100)}%` : '100%' }} /></div>
                  <small>{next ? `경험치 ${m.exp}/${next}` : '만렙'} · HP {s.maxHp} · SP {s.maxSp} · 패턴 {m.rules.rows.length}/{maxRuleRows(s)}{nextRuleRowInt(s) !== null ? ` (지능 ${nextRuleRowInt(s)}에서 +1)` : ''}</small>
                </div>
                {m.statPoints > 0 && <span className="badge">포인트 {left}{used > 0 ? `/${m.statPoints}` : ''}</span>}
              </header>
              <div className="stats">
                {STAT_KEYS.map((k) => (
                  <span key={k} className={`stat ${pend[k] > 0 ? 'pend' : ''}`} title={STAT_HELP[k]}>
                    <b>{STAT_LABEL[k]}</b> {s[k]}
                    {pend[k] > 0 ? <small className="delta">(+{pend[k]})</small> : m.alloc[k] > 0 ? <small>(+{m.alloc[k]})</small> : null}
                    {m.statPoints > 0 && (
                      <span className="pm">
                        <button disabled={pend[k] <= 0} onClick={() => bump(m, k, -1)} title="되돌리기">−</button>
                        <button disabled={left <= 0 || base[k] + pend[k] >= STAT_CAP} onClick={() => bump(m, k, 1)} title={`${STAT_LABEL[k]} +1 — ${STAT_HELP[k]}`}>+</button>
                      </span>
                    )}
                  </span>
                ))}
              </div>
              <div className="derived">
                <span title="힘 기술의 기본 위력">물리 {d.physBase}</span>
                <span title="손재주 기술의 기본 위력">손재주 {d.dexBase}</span>
                <span title="마법·회복의 기본 위력">마법 {d.magicBase}</span>
                <span title="틱당 행동 게이지 충전량 (1000 이면 행동)">충전 {d.chargePerTick}/틱</span>
                <span title="시전 준비 시간 단축">선딜 −{d.castReductionPct}%</span>
                <span title="운 0 인 상대의 상태이상을 막을 확률">저항 ≤{d.resistMaxPct}%</span>
              </div>
              {used > 0 && (
                <div className="run-bar confirm">
                  <button className="primary" onClick={() => confirm(m)}>확정 ({used}포인트)</button>
                  <button onClick={() => revert(m)}>되돌리기</button>
                  <small>확정 전엔 저장되지 않습니다.</small>
                </div>
              )}
              <div className="skills">
                {p.skills.map(skillLabel).join(' · ')}{m.skillPoints > 0 && <small> · 스킬 포인트 {m.skillPoints} (스킬트리는 M2-2)</small>}
                {pi >= 0 && <button className="link" onClick={() => onEditRules(pi)}>수칙 편집 →</button>}
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
