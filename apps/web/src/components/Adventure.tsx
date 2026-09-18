// 모험 — 목록 (탭 개편 2026-09-11 · 2026-09-12 접이식 · 2026-09-13 전투와 같은 제로식 흐름, 단장 지시).
//
// 전투와 같은 두 단계: 모험 목록 → 모험을 누르면 모험 맵(AdventureMap)으로 넘어가 거기서 편성하고 도전한다.
// 목록 한 줄에는 **지금 갈 수 있는가**를 먼저 적는다 — 모험은 재도전 대기 · 요일 · 횟수 · 입장 재료가 걸려 있어
// 들어가 보기 전에 그걸 알아야 헛걸음을 안 한다 (docs/11 §5.17).
import { useState } from 'react'
import { ADVENTURES, MONSTERS, type AdventureDef } from '@webrpg/engine'
import type { GameSave } from '../game/save'
import { adventureGate, materialsText } from '../game/members'
import { materialLabel, waitText } from '../lib/labels'
import { AdventureMap } from './AdventureMap'
import { UnitPortrait } from './UnitPortrait'

interface Props {
  save: GameSave
  onSave: (next: GameSave) => void
  onGoBattle: () => void
  onGoFormation: () => void
}

/** 목록·제목에 쓰는 얼굴 — 고정 상대의 첫 번째 */
const adventureIcon = (a: AdventureDef): string => {
  const d = MONSTERS[a.foes[0]]
  return d ? d.icon ?? d.job : 'warrior'
}

export function Adventure({ save, onSave, onGoBattle, onGoFormation }: Props) {
  const [sel, setSel] = useState<string | null>(null)

  const def = sel ? ADVENTURES.find((a) => a.id === sel) : undefined
  if (def) {
    return (
      <AdventureMap
        key={def.id}
        save={save}
        onSave={onSave}
        def={def}
        icon={adventureIcon(def)}
        onBack={() => {
          setSel(null)
          window.scrollTo(0, 0)
        }}
        onGoFormation={onGoFormation}
      />
    )
  }

  const now = Date.now()
  const lo = Math.min(...ADVENTURES.map((a) => a.recommended[0]))
  const hi = Math.max(...ADVENTURES.map((a) => a.recommended[1]))
  const enter = (id: string) => {
    setSel(id)
    window.scrollTo(0, 0)
  }

  return (
    <section className="adventure">
      <h2>모험 <small>상대가 정해져 있다. 대신 연달아 갈 수 없고, 보상이 크다</small></h2>
      <p className="hint">
        일반 <button className="link" onClick={onGoBattle}>전투</button>는 같은 지역을 몇 번이든 돌 수 있습니다.
        모험은 <b>재도전 대기</b>·<b>하루 횟수</b>·<b>열쇠 재료</b>·<b>요일</b>이 걸리는 대신 상대가 고정이라 그 상대에 맞춰 수칙을 짤 수 있습니다.
      </p>

      <h3 className="bar-title">모험 목록 <small>누르면 그 모험으로 이동합니다. 편성과 도전은 모험 안에서</small></h3>
      <ol className="map-groups">
        <li className="map-group">
          <h3>
            <UnitPortrait icon={adventureIcon(ADVENTURES[0])} size="xs" inline />
            모험 <small>(적정 레벨 {lo}–{hi}) ( {ADVENTURES.length} )</small>
          </h3>
          <ul className="map-list">
            {ADVENTURES.map((a) => {
              const g = adventureGate(save, a, now)
              // 편성이 비어 있는 것은 들어가서 고칠 수 있으므로 "못 간다"로 치지 않는다
              const open = g.ready || g.reason === '편성이 비어 있습니다'
              const meta = !g.unlocked
                ? `🔒 ${g.reason ?? ''}`
                : open
                  ? `권장 Lv ${a.recommended[0]}–${a.recommended[1]}${a.entry ? ` · 입장 ${materialLabel(a.entry.itemId)} ×${a.entry.qty}` : ''}`
                  : g.reason === '재도전 대기 중'
                    ? `재도전까지 ${waitText(g.waitMs)}`
                    : g.reason ?? ''
              return (
                <li key={a.id} className={`map-entry ${g.unlocked ? '' : 'locked'} ${open ? 'ready' : ''}`}>
                  <button onClick={() => enter(a.id)}>
                    <UnitPortrait icon={adventureIcon(a)} size="xs" />
                    <span className="nm">{a.name}</span>
                    <span className="tags">
                      {open && <small className="ready-badge">지금 가능</small>}
                      {g.cleared && <small className="clear-badge">클리어</small>}
                    </span>
                    <small className="meta">{meta}</small>
                  </button>
                </li>
              )
            })}
          </ul>
        </li>
      </ol>
      {materialsText(save) && <p className="hint">가진 재료: {materialsText(save)}</p>}
    </section>
  )
}
