import { MISSIONS } from '@webrpg/engine'
import type { MissionProgress } from '../missionState'
import { jobIcon } from '../lib/labels'

interface Props {
  progress: MissionProgress
  onOpen: (id: string) => void
  /** 자유 훈련(내 편성)으로 이동 */
  onFree: () => void
}

/** 이만큼 풀면 자유 훈련을 권한다 */
const FREE_UNLOCK = 3

export function MissionList({ progress, onOpen, onFree }: Props) {
  const clearedCount = MISSIONS.filter((m) => progress.cleared[m.id]).length
  const freeOpen = clearedCount >= FREE_UNLOCK
  return (
    <section className="missions">
      <div className="intro">
        <h2>훈련 과제</h2>
        <p>
          당신은 용병단의 <b>단장</b>입니다. 전투 중에는 지시를 내릴 수 없습니다 — 투기장 규정입니다.
          대신 출전 전에 단원마다 <b>교전 수칙</b>을 하달합니다. "이런 상황이면 이걸 해라"를 순서대로 적은 목록입니다.
        </p>
        <p>과제 하나에 개념 하나. {MISSIONS.length}개를 마치면 수칙 체계를 전부 익힌 상태가 됩니다. <small>{clearedCount}/{MISSIONS.length} 완료</small></p>
      </div>
      <ol className="mission-cards">
        {MISSIONS.map((m, i) => {
          const cleared = progress.cleared[m.id] === true
          const locked = i > 0 && !progress.cleared[MISSIONS[i - 1].id] && !cleared
          return (
            <li key={m.id} className={`mission-card ${cleared ? 'cleared' : ''} ${locked ? 'locked' : ''}`}>
              <button disabled={locked} onClick={() => onOpen(m.id)}>
                <span className="no">{cleared ? '✓' : m.no}</span>
                <span className="body">
                  <span className="title">{m.title}</span>
                  <span className="lesson">{m.lesson}</span>
                  <span className="cast">
                    {m.player.map((c, j) => (
                      <img key={j} src={jobIcon(c.job)} alt="" width={20} height={20} className={m.editable.includes(j) ? 'edit' : ''} />
                    ))}
                    <i>vs</i>
                    {m.enemy.map((c, j) => (
                      <img key={j} src={jobIcon(c.job)} alt="" width={20} height={20} />
                    ))}
                  </span>
                </span>
                {locked && <span className="lock">이전 과제를 먼저</span>}
              </button>
            </li>
          )
        })}
      </ol>

      <div className={`free-card ${freeOpen ? '' : 'locked'}`}>
        <div className="body">
          <span className="title">자유 훈련 — 내 편성으로</span>
          <span className="lesson">
            {freeOpen
              ? '직업 5종 중 5명을 골라 편성하고, 수칙을 전부 직접 짜서 상대 팀과 겨룹니다. 훈련장에서 100회 승률로 검증하세요.'
              : `과제를 ${FREE_UNLOCK}개 마치면 열립니다. (${clearedCount}/${FREE_UNLOCK})`}
          </span>
        </div>
        <button className="primary" disabled={!freeOpen} onClick={onFree}>편성하러 가기 →</button>
      </div>
    </section>
  )
}
