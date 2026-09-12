// 편성 판 (유니콘 오버로드식 6칸). 편성 탭에서는 조작용, 본부·프리셋에서는 보기용.
// 스테이지와 같은 방향 — 후열이 왼쪽, 전열이 오른쪽, 적은 오른쪽 너머.
import { GRID_COLS, cellRow, type GameSave } from '../game/save'
import { UnitPortrait } from './UnitPortrait'
import { memberById, memberStats } from '../game/members'

interface Props {
  save: GameSave
  /** 그릴 판. 생략하면 현재 편성 (프리셋 미리보기가 넘긴다) */
  party?: (string | null)[]
  /** 선택된 칸 */
  selected?: number | null
  /** 이동 모드의 출발 칸 */
  moveFrom?: number | null
  onCell?: (cell: number) => void
  /** 본부용 작은 판 */
  compact?: boolean
  /** 프리셋 미리보기용 아주 작은 판 (아이콘만) */
  mini?: boolean
  /** 머리글(후열·전열·적) 숨김 */
  bare?: boolean
}

export function Board({ save, party, selected = null, moveFrom = null, onCell, compact, mini, bare }: Props) {
  const cells = party ?? save.party
  // 화면 행 r(0~2) × 열 [후열, 전열] → 칸 번호: 전열 r, 후열 3+r
  const rows = Array.from({ length: GRID_COLS }, (_, r) => [GRID_COLS + r, r])
  return (
    <div className={`board ${compact ? 'compact' : ''} ${mini ? 'mini' : ''} ${onCell ? 'clickable' : ''}`}>
      {!bare && !mini && (
        <div className="board-head">
          <span>후열</span>
          <span>전열</span>
          <span className="foe-mark">적 →</span>
        </div>
      )}
      <div className="board-grid">
        {rows.map((pair, r) =>
          pair.map((cell, c) => {
            const m = memberById(save, cells[cell])
            const cls = ['cell', cellRow(cell), (r + c) % 2 ? 'dark' : 'light', selected === cell ? 'sel' : '', moveFrom === cell ? 'moving' : '', m ? '' : 'empty']
              .filter(Boolean)
              .join(' ')
            const body = m ? (
              <>
                <UnitPortrait icon={m.job} alt={m.name} size={mini ? 'xs' : compact ? 'md' : 'full'} />
                {!mini && <span className="nm">{m.name}</span>}
                {!mini && !compact && <small>Lv {m.level} · 패턴 {m.rules.rows.length}</small>}
                {!mini && compact && <small>Lv {m.level}</small>}
                {!mini && !compact && <span className="bar hp"><i style={{ width: '100%' }} title={`HP ${memberStats(m).maxHp}`} /></span>}
              </>
            ) : (
              <span className="plus">{onCell && !compact && !mini ? '+' : ''}</span>
            )
            return onCell ? (
              <button key={cell} className={cls} onClick={() => onCell(cell)} title={m ? m.name : `빈 칸 (${cellRow(cell) === 'front' ? '전열' : '후열'})`}>
                {body}
              </button>
            ) : (
              <div key={cell} className={cls} title={m ? m.name : ''}>{body}</div>
            )
          }),
        )}
      </div>
    </div>
  )
}
