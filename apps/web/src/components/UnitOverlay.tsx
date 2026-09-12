// 단원 상세 오버레이 (단장 지시 2026-09-12).
//
// 상세를 한 페이지로 펼친 뒤(docs/11 §5.9) 옆 칸에 두니 페이지 전체가 길어져,
// 캐릭터를 고르고 한참 스크롤해야 설정에 닿았다. 화면을 덮어 그 안에서만 스크롤하게 한다.
//   · 목록은 그대로 있고, 닫으면 보던 자리로 돌아온다
//   · 상세가 화면을 다 쓰므로 수칙을 짜며 스탯·스킬을 같이 보기 쉽다
//   · 맨 위 **이름 줄**로 닫지 않고 다른 단원으로 건너뛴다 (제로식 캐릭터 페이지의 이름 줄에서)
import { useEffect } from 'react'
import { UnitPortrait } from './UnitPortrait'
import type { GameSave, Member } from '../game/save'
import { UnitPanel, type UnitTab } from './UnitPanel'

interface Props {
  save: GameSave
  onSave: (next: GameSave) => void
  member: Member
  /** 이름 줄에 늘어놓을 단원들 (보통 보유 전원) */
  siblings: Member[]
  onPick: (id: string) => void
  onClose: () => void
  initial?: UnitTab
  onGoShop: () => void
  onGoFormation: () => void
}

export function UnitOverlay({ save, onSave, member, siblings, onPick, onClose, initial = 'rules', onGoShop, onGoFormation }: Props) {
  // Esc 로 닫고, 열려 있는 동안 뒤 페이지는 스크롤하지 않는다
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [onClose])

  // 해고 등으로 이 단원이 사라지면 닫는다
  useEffect(() => {
    if (!save.members.some((m) => m.id === member.id)) onClose()
  }, [save.members, member.id, onClose])

  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-label={`${member.name} 상세`} onClick={onClose}>
      <div className="overlay-panel" onClick={(e) => e.stopPropagation()}>
        <div className="overlay-bar">
          <ul className="who-row">
            {siblings.map((m) => (
              <li key={m.id}>
                <button className={m.id === member.id ? 'on' : ''} onClick={() => onPick(m.id)} title={`Lv ${m.level}`}>
                  <UnitPortrait icon={m.job} size="xs" />
                  <span className="nm">{m.name}</span>
                </button>
              </li>
            ))}
          </ul>
          <button className="overlay-close" onClick={onClose} aria-label="닫기 (Esc)" title="닫기 (Esc)">
            ×
          </button>
        </div>
        <div className="overlay-body">
          <UnitPanel
            key={member.id}
            save={save}
            onSave={onSave}
            member={member}
            initial={initial}
            onGoShop={onGoShop}
            onGoFormation={onGoFormation}
          />
        </div>
      </div>
    </div>
  )
}
