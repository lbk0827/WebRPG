// 스킬 습득 (M2-2, 제로식 방식). 보유 목록 + 배울 수 있는 목록(값) + 초기화. 편성 패널과 단원 카드가 같이 쓴다.
import { SKILL_RESET_GOLD, STARTER_SKILLS } from '@webrpg/engine'
import type { Member } from '../game/save'
import { unlearned } from '../game/members'
import { skillBrief, skillLabel } from '../lib/labels'

interface Props {
  member: Member
  gold: number
  onLearn: (skillId: string) => void
  onReset: () => void
}

export function SkillLearn({ member: m, gold, onLearn, onReset }: Props) {
  const starter = STARTER_SKILLS[m.job] ?? []
  const list = unlearned(m)
  const learnedExtra = m.skills.filter((id) => !starter.includes(id))
  const canReset = learnedExtra.length > 0 && gold >= SKILL_RESET_GOLD

  return (
    <div className="learn">
      <h4>보유 <small>{m.skills.length}종 — 수칙에 넣어야 쓰인다</small></h4>
      <ul className="skill-list">
        {m.skills.map((id) => (
          <li key={id}>
            <b>{skillLabel(id)}</b>{!starter.includes(id) && <span className="tag">습득</span>} <small>{skillBrief(id)}</small>
          </li>
        ))}
      </ul>

      <h4>배울 수 있는 스킬 <small>포인트 {m.skillPoints} · 레벨업마다 +1</small></h4>
      {list.length === 0 ? (
        <p className="hint">이 직업의 목록은 다 배웠다. 다음 목록은 전직(M2-5)에서 열린다.</p>
      ) : (
        <ul className="learn-list">
          {list.map((l) => {
            const ok = l.cost <= m.skillPoints
            return (
              <li key={l.skillId} className={ok ? '' : 'far'}>
                <div className="body">
                  <b>{skillLabel(l.skillId)}</b> <span className={`cost ${l.cost === 0 ? 'free' : ''}`}>{l.cost === 0 ? '공짜' : `${l.cost}pt`}</span>
                  <small>{skillBrief(l.skillId)}</small>
                </div>
                <button className={ok ? 'primary' : ''} disabled={!ok} onClick={() => onLearn(l.skillId)} title={ok ? '' : `포인트 ${l.cost - m.skillPoints} 더 필요`}>
                  배우기
                </button>
              </li>
            )
          })}
        </ul>
      )}

      <div className="run-bar reset">
        <button disabled={!canReset} onClick={() => { if (window.confirm(`스킬을 시작 상태로 되돌리고 포인트 ${m.spentSkillPoints} 을 돌려받습니다. 금 ${SKILL_RESET_GOLD} 이 듭니다. 지운 스킬을 쓰던 패턴도 함께 지워집니다.`)) onReset() }}>
          스킬 초기화 (금 {SKILL_RESET_GOLD})
        </button>
        {learnedExtra.length > 0 && gold < SKILL_RESET_GOLD && <small>금이 모자랍니다 ({gold}).</small>}
      </div>
    </div>
  )
}
