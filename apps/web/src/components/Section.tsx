// 구역 머리 — `▌제목 ?`. 제로식이 섹션마다 물음표를 달아 그 자리에서 설명을 여는 방식에서 착안했다
// (그쪽은 설명이 게임 밖 매뉴얼로 나가지만, 우리는 그 자리에서 편다 — docs/11 §5.9).
// 단원 상세는 스크롤 추적 때문에 자체 구현을 쓰고, 그 밖의 화면은 이걸 쓴다.
import { useState, type ReactNode } from 'react'

export function Section({ title, help, note, children }: { title: string; help?: string; note?: ReactNode; children: ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <section className="unit-sec plain">
      <h3>
        {title}
        {note && <small className="sec-note">{note}</small>}
        {help && (
          <button className="qmark" aria-label={`${title} 설명`} aria-expanded={open} onClick={() => setOpen(!open)}>
            ?
          </button>
        )}
      </h3>
      {open && help && <p className="sec-help">{help}</p>}
      {children}
    </section>
  )
}
