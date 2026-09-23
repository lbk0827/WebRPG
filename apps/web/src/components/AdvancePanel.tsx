// 전직 (M2-5b). ADR-003 — 2차 직업은 "스탯이 좋은 직업"이 아니라 **수칙을 다르게 짜게 만드는 직업**이다.
// 그래서 화면이 앞에 내세우는 것도 스탯이 아니라 **훅 한 줄**이다.
//
// 주인공은 전직이 **이어진다** (docs/20): 모험가 →(15) 길드원 · 떠돌이 →(30) 용사 · 타락 용사.
// 그래서 "지금 직업"과 "다음에 고를 것"을 한 화면에 함께 보여 준다. 다른 직업은 2차 다음이 없어 전과 같다.
import { ADVANCE_RESET_GOLD, ITEMS, SKILLS, TRAITS, advanceChain } from '@webrpg/engine'
import type { GameSave, Member } from '../game/save'
import { advanceMember, advanceOptions, memberCanAdvance, resetAdvance } from '../game/members'
import { jobName, skillLabel, traitText } from '../lib/labels'
import { STAT_LABEL } from '../lib/condition'
import { ItemIcon, SkillIcon, TraitIcon } from './Icon'

const BONUS_LABEL: Record<string, string> = { ...STAT_LABEL, maxHp: 'HP', maxSp: 'SP', def: '방어', mdef: '마법 방어' }

/**
 * 훅이 실제로 무엇을 하는지 — 2026-09-13 까지 이 화면에 없었다.
 * 훅 문구는 "무엇을 노리라"는 말이고, 이것은 "얼마나 붙는다"는 수다. 둘 다 없으면 수칙을 못 짠다
 * (도감에만 있었으니 단원 화면에서는 보이지 않았다).
 */
function TraitLines({ ids }: { ids: string[] }) {
  const defs = ids.map((id) => TRAITS[id]).filter(Boolean)
  if (defs.length === 0) return null
  return (
    <ul className="adv-traits">
      {defs.map((t) => (
        <li key={t.id}>
          <TraitIcon id={t.id} inline />
          <b>{t.label}</b> {traitText(t)}
        </li>
      ))}
    </ul>
  )
}

/** 한글 받침 판정 — "광전사 이 된다" 가 아니라 "광전사가 된다" 로 */
function hasFinal(word: string): boolean {
  const c = word.charCodeAt(word.length - 1)
  if (c < 0xac00 || c > 0xd7a3) return true
  return (c - 0xac00) % 28 !== 0
}

/** 무기 진화 한 줄 — "나무 몽둥이 → 에고 소드" */
function WeaponLine({ from, to }: { from?: string; to?: string }) {
  if (!to || !ITEMS[to]) return null
  return (
    <p className="hint weapon-evolve">
      무기 진화 {from && ITEMS[from] && <><ItemIcon id={from} alt={ITEMS[from].label} inline /> {ITEMS[from].label} → </>}
      <ItemIcon id={to} alt={ITEMS[to].label} inline /> <b>{ITEMS[to].label}</b>
    </p>
  )
}

export function AdvancePanel({ save, onSave, member }: { save: GameSave; onSave: (g: GameSave) => void; member: Member }) {
  const options = advanceOptions(member)
  const chain = advanceChain(member.job2)
  const chosen = chain[chain.length - 1]
  const ready = memberCanAdvance(member)
  const need = options.length ? Math.min(...options.map((o) => o.level)) : 0
  const weaponNow = member.gear.weapon?.itemId

  return (
    <div className="advance">
      {chosen && (
        <>
          <div className="advance-current">
            {chain.length > 1 && (
              <p className="hint chain">{[jobName(member.job), ...chain.map((c) => c.name)].join(' → ')}</p>
            )}
            <h3>{chosen.name}</h3>
            <p className="hook">{chosen.hook}</p>
            <TraitLines ids={chosen.traits} />
            <p className="hint">{chosen.brief}</p>
            <p className="hint">
              받은 스킬 {chosen.grants.map((s) => skillLabel(s)).join(' · ')}
              {chosen.learnable.length > 0 && ` · 배울 수 있는 스킬 ${chosen.learnable.map((l) => `${skillLabel(l.skillId)}(${l.cost}pt)`).join(' · ')}`}
            </p>
          </div>
          <p className="hint">
            {chain.length > 1 ? '한 단계 되돌리려면' : '다른 길을 고르려면'} 금 {ADVANCE_RESET_GOLD} 이 든다. 이 전직에서 받은 스킬은 잃고, 그 스킬을 쓰던 수칙 줄은 기본 공격으로 돌아간다.
            {chosen.weapon && ' 전용 무기도 한 단계 전으로 돌아간다.'}
          </p>
          <button
            className="danger"
            disabled={save.gold < ADVANCE_RESET_GOLD}
            onClick={() => {
              if (window.confirm(`${chosen.name} 을(를) 그만둡니다. 금 ${ADVANCE_RESET_GOLD} 이 들고 이 전직에서 받은 스킬을 잃습니다.`)) onSave(resetAdvance(save, member.id))
            }}
          >
            전직 취소 (금 {ADVANCE_RESET_GOLD})
          </button>
        </>
      )}

      {options.length > 0 && (
        <>
          {chosen ? (
            <h4 className="next-advance">다음 전직</h4>
          ) : (
            <p className="hint">
              2차 직업은 세지는 것이 아니라 <b>다르게 싸우는 것</b>이다. 각 직업에는 <b>훅</b>이 하나씩 있고,
              그 훅이 가리키는 조건을 수칙에 넣어야 값이 나온다. 스탯 보정은 방향만 잡아 주는 정도다.
            </p>
          )}
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
                  <TraitLines ids={o.traits} />
                  <p className="hint">{o.brief}</p>
                  <WeaponLine from={weaponNow} to={o.weapon} />
                  <p className="hint">
                    대표 스킬 {o.grants.map((s) => (
                      <span key={s} className="chip"><SkillIcon id={s} alt={skillLabel(s)} size="sm" />{skillLabel(s)} — {SKILLS[s]?.spCost ?? 0}SP</span>
                    ))}
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
                    {o.name}{hasFinal(o.name) ? '이' : '가'} 된다
                  </button>
                </li>
              )
            })}
          </ul>
        </>
      )}
    </div>
  )
}
