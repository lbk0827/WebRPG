// 전직 (M2-5b). ADR-003 — 2차 직업은 "스탯이 좋은 직업"이 아니라 **수칙을 다르게 짜게 만드는 직업**이다.
// 그래서 화면이 앞에 내세우는 것도 스탯이 아니라 **훅 한 줄**이다.
import { ADVANCE_RESET_GOLD, JOB_ADVANCE, SKILLS } from '@webrpg/engine'
import type { GameSave, Member } from '../game/save'
import { advanceMember, advanceOptions, memberCanAdvance, resetAdvance } from '../game/members'
import { skillLabel } from '../lib/labels'
import { STAT_LABEL } from '../lib/condition'

const BONUS_LABEL: Record<string, string> = { ...STAT_LABEL, maxHp: 'HP', maxSp: 'SP', def: '방어', mdef: '마법 방어' }

export function AdvancePanel({ save, onSave, member }: { save: GameSave; onSave: (g: GameSave) => void; member: Member }) {
  const options = advanceOptions(member)
  const chosen = member.job2 ? JOB_ADVANCE[member.job2] : undefined

  if (chosen) {
    return (
      <div className="advance">
        <div className="advance-current">
          <h3>{chosen.name}</h3>
          <p className="hook">{chosen.hook}</p>
          <p className="hint">{chosen.brief}</p>
          <p className="hint">
            받은 스킬 {chosen.grants.map((s) => skillLabel(s)).join(' · ')}
            {chosen.learnable.length > 0 && ` · 배울 수 있는 스킬 ${chosen.learnable.map((l) => `${skillLabel(l.skillId)}(${l.cost}pt)`).join(' · ')}`}
          </p>
        </div>
        <p className="hint">
          다른 길을 고르려면 금 {ADVANCE_RESET_GOLD} 이 든다. 2차 스킬은 잃고, 그 스킬을 쓰던 수칙 줄은 기본 공격으로 돌아간다.
        </p>
        <button
          className="danger"
          disabled={save.gold < ADVANCE_RESET_GOLD}
          onClick={() => {
            if (window.confirm(`${chosen.name} 을(를) 그만둡니다. 금 ${ADVANCE_RESET_GOLD} 이 들고 2차 스킬을 잃습니다.`)) onSave(resetAdvance(save, member.id))
          }}
        >
          전직 취소 (금 {ADVANCE_RESET_GOLD})
        </button>
      </div>
    )
  }

  const ready = memberCanAdvance(member)
  const need = options.length ? Math.min(...options.map((o) => o.level)) : 0

  return (
    <div className="advance">
      <p className="hint">
        2차 직업은 세지는 것이 아니라 <b>다르게 싸우는 것</b>이다. 각 직업에는 <b>훅</b>이 하나씩 있고,
        그 훅이 가리키는 조건을 수칙에 넣어야 값이 나온다. 스탯 보정은 방향만 잡아 주는 정도다.
      </p>
      {!ready && <p className="warn-line">Lv {need} 부터 고를 수 있다. 지금 Lv {member.level}.</p>}
      <ul className="advance-list">
        {options.map((o) => {
          const ok = member.level >= o.level
          return (
            <li key={o.id} className={ok ? '' : 'locked'}>
              <div className="adv-head">
                <b>{o.name}</b>
                <small>Lv {o.level}</small>
              </div>
              <p className="hook">{o.hook}</p>
              <p className="hint">{o.brief}</p>
              <p className="hint">
                대표 스킬 {o.grants.map((s) => `${skillLabel(s)} — ${SKILLS[s]?.spCost ?? 0}SP`).join(' · ')}
                {' · '}
                보정 {Object.entries(o.bonus).map(([k, v]) => `${BONUS_LABEL[k] ?? k} +${v}`).join(' ')}
              </p>
              <button
                className="primary"
                disabled={!ok}
                onClick={() => {
                  if (window.confirm(`${member.name} 을(를) ${o.name} 으로 전직시킵니다.\n\n${o.hook}\n\n되돌리려면 금 ${ADVANCE_RESET_GOLD} 이 듭니다.`)) {
                    onSave(advanceMember(save, member.id, o.id))
                  }
                }}
              >
                {o.name} 이 된다
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
