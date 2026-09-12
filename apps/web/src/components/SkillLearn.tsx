// 스킬 습득 (M2-2, 제로식 방식). 보유 목록 + 배울 수 있는 목록(값) + 초기화. 편성 패널과 단원 카드가 같이 쓴다.
import { JOB_ADVANCE, SKILL_RESET_GOLD, STARTER_SKILLS } from '@webrpg/engine'
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
  const granted = m.job2 ? JOB_ADVANCE[m.job2].grants : []
  const list = unlearned(m)
  const learnedExtra = m.skills.filter((id) => !starter.includes(id) && !granted.includes(id))
  const canReset = learnedExtra.length > 0 && gold >= SKILL_RESET_GOLD
  // 제로식처럼 출처별로 나눈다 — "이건 어디서 온 스킬인가"가 바로 보여야 한다
  const groups: { title: string; ids: string[] }[] = [
    { title: '기본', ids: m.skills.filter((id) => starter.includes(id)) },
    { title: '전직', ids: m.skills.filter((id) => granted.includes(id)) },
    { title: '습득', ids: learnedExtra },
  ].filter((g) => g.ids.length > 0)

  return (
    <div className="learn">
      <h4>보유 <small>{m.skills.length}종 — 수칙에 넣어야 쓰인다</small></h4>
      {groups.map((g) => (
        <div key={g.title} className="skill-group">
          <h5>{g.title} <small>{g.ids.length}</small></h5>
          <ul className="skill-list">
            {g.ids.map((id) => (
              <li key={id}>
                <b>{skillLabel(id)}</b> <small>{skillBrief(id)}</small>
              </li>
            ))}
          </ul>
        </div>
      ))}

      <h4>배울 수 있는 스킬 <small>포인트 {m.skillPoints} · 레벨업마다 +1</small></h4>
      {list.length === 0 ? (
        <p className="hint">
          {m.job2 ? '이 직업의 목록은 다 배웠다.' : '1차 직업의 목록은 다 배웠다. 다음 목록은 전직에서 열린다 — 위의 전직 구역을 볼 것.'}
        </p>
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
