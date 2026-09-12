// 캐릭터 (탭 개편 2026-09-11 · 2026-09-12 오버레이로).
// 보유한 모든 단원이 한 화면에 깔리고, 고르면 **화면을 덮는 상세**가 열린다 (단장 지시).
// 전에는 옆 칸에 상세를 뒀는데, 상세가 한 페이지로 길어진 뒤로는 고르고 한참 스크롤해야 닿았다.
import { useEffect, useState } from 'react'
import { UnitPortrait } from './UnitPortrait'
import { MEMBER_MAX } from '@webrpg/engine'
import type { GameSave } from '../game/save'
import { PARTY_MAX } from '../game/save'
import { canLearnSomething, cellOf, memberCanAdvance, partyMembers } from '../game/members'
import { UnitOverlay } from './UnitOverlay'

interface Props {
  save: GameSave
  onSave: (next: GameSave) => void
  onGoShop: () => void
  onGoRecruit: () => void
  onGoFormation: () => void
}

export function Characters({ save, onSave, onGoShop, onGoRecruit, onGoFormation }: Props) {
  const [open, setOpen] = useState<string | null>(null)
  const member = save.members.find((m) => m.id === open) ?? null
  const party = partyMembers(save)

  // 해고 등으로 선택이 사라지면 닫는다
  useEffect(() => {
    if (open && !save.members.some((m) => m.id === open)) setOpen(null)
  }, [save.members, open])

  return (
    <section className="characters">
      <h2>
        캐릭터 <small>{save.members.length}/{MEMBER_MAX}명 · 출전 {party.length}/{PARTY_MAX} · 금 {save.gold}</small>
        <button className="link" onClick={onGoRecruit}>마을 → 용병소 →</button>
      </h2>
      <p className="hint">카드를 누르면 수칙 · 스탯 · 스킬 · 장비 · 전직을 한 화면에서 다룹니다.</p>

      <ul className="char-list">
        {save.members.map((m) => {
          const cell = cellOf(save, m.id)
          const todo = m.statPoints > 0 || canLearnSomething(m) || memberCanAdvance(m)
          // 카드에는 초상 · 이름 · 레벨만 (단장 지시). 나머지는 눌러서 본다
          return (
            <li key={m.id} className={`char-card ${cell >= 0 ? 'out' : ''}`}>
              <button onClick={() => setOpen(m.id)} title={cell >= 0 ? (m.row === 'front' ? '전열 출전' : '후열 출전') : '대기'}>
                <UnitPortrait icon={m.job} size="full" />
                <span className="nm">
                  {m.name}
                  {todo && <i className="dot" title="분배하거나 배울 것이 있습니다" />}
                </span>
                <small>Lv {m.level}</small>
              </button>
            </li>
          )
        })}
      </ul>

      {member && (
        <UnitOverlay
          save={save}
          onSave={onSave}
          member={member}
          siblings={save.members}
          onPick={setOpen}
          onClose={() => setOpen(null)}
          initial="rules"
          onGoShop={onGoShop}
          onGoFormation={onGoFormation}
        />
      )}
    </section>
  )
}
