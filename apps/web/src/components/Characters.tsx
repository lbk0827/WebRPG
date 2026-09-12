// 캐릭터 (탭 개편 2026-09-11). 보유한 모든 단원이 한 화면에.
// 고르면 오른쪽 상세 패널 — 편성 탭과 **같은 컴포넌트**(UnitPanel)라 여기서도 수칙까지 고친다.
import { useEffect, useState } from 'react'
import { UnitPortrait } from './UnitPortrait'
import { MEMBER_MAX } from '@webrpg/engine'
import type { GameSave } from '../game/save'
import { PARTY_MAX } from '../game/save'
import { canLearnSomething, cellOf, gearSummary, memberStats, partyMembers } from '../game/members'
import { jobName } from '../lib/labels'
import { UnitPanel } from './UnitPanel'

interface Props {
  save: GameSave
  onSave: (next: GameSave) => void
  onGoShop: () => void
  onGoRecruit: () => void
  onGoFormation: () => void
}

export function Characters({ save, onSave, onGoShop, onGoRecruit, onGoFormation }: Props) {
  const [sel, setSel] = useState<string | null>(save.members[0]?.id ?? null)
  const member = save.members.find((m) => m.id === sel) ?? null
  const party = partyMembers(save)

  // 해고 등으로 선택이 사라지면 첫 단원으로
  useEffect(() => {
    if (sel && !save.members.some((m) => m.id === sel)) setSel(save.members[0]?.id ?? null)
  }, [save.members, sel])

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
            const wearing = Object.keys(m.gear ?? {}).length
            const todo = m.statPoints > 0 || canLearnSomething(m)
            return (
              <li key={m.id} className={`char-card ${sel === m.id ? 'on' : ''} ${cell >= 0 ? 'out' : ''}`}>
                <button onClick={() => setSel(m.id)}>
                  <UnitPortrait icon={m.job} size="md" />
                  <span className="body">
                    <span className="nm">{m.name}{todo && <i className="dot" title="분배하거나 배울 것이 있습니다" />}</span>
                    <small>{jobName(m.job)} · Lv {m.level} · {cell >= 0 ? `${m.row === 'front' ? '전열' : '후열'} 출전` : '대기'}</small>
                    <small>HP {s.maxHp} · 패턴 {m.rules.rows.length} · 장비 {wearing ? `${wearing}칸` : '없음'}{g.traits.length ? ` · 특성 ${g.traits.length}` : ''}</small>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>

        <div className="char-detail">
          {member ? (
            <UnitPanel save={save} onSave={onSave} member={member} initial="stats" onGoShop={onGoShop} onGoFormation={onGoFormation} />
          ) : (
            <div className="unit-panel empty"><p className="hint">단원이 없습니다.</p></div>
          )}
        </div>
      </div>
    </section>
  )
}
