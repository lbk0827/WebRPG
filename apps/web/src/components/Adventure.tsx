// 모험 (탭 개편 2026-09-11 · 2026-09-12 의뢰소와 같은 접이식으로).
// 일반 전투와 달리 상대가 고정이고, 연속 도전이 안 되며, 보상이 크다.
// 상대가 고정이라 **그 상대에 맞춰 수칙을 짜는 것**이 이 콘텐츠의 본체다 —
// 그래서 전투보다 상대를 더 자세히 (이름 · Lv · 원형 · HP) 보여 준다.
import { useState } from 'react'
import { UnitPortrait } from './UnitPortrait'
import { ADVENTURES, ARCHETYPE_LABEL, MATERIALS, MONSTERS, WEEKDAY_LABEL, adventureRewards, adventureTeam } from '@webrpg/engine'
import type { AdventureDef } from '@webrpg/engine'
import type { GameSave } from '../game/save'
import { adventureGate, materialsText, partySummary, runAdventure, type AdventureRun } from '../game/members'
import { jobOf, materialLabel, outcomeText, type Names } from '../lib/labels'
import { diagnose } from '../lib/diagnose'
import { Replay } from './Replay'
import { PartyBar } from './PartyBar'

interface Props {
  save: GameSave
  onSave: (next: GameSave) => void
  onGoBattle: () => void
  onGoFormation: () => void
}

/** "2시간 14분" / "3시간" / "3분" */
function waitText(ms: number): string {
  const min = Math.ceil(ms / 60_000)
  if (min < 60) return `${min}분`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m === 0 ? `${h}시간` : `${h}시간 ${m}분`
}

export function Adventure({ save, onSave, onGoBattle, onGoFormation }: Props) {
  const [sel, setSel] = useState<string>(ADVENTURES[0].id)
  const [out, setOut] = useState<AdventureRun | null>(null)
  // 대기 시간 표시를 위해 렌더 시각을 고정한다 (도전할 때 다시 읽는다)
  const now = Date.now()
  const us = partySummary(save)

  // 펼친 블록이 넘겨 준다. 접힌 상태(sel === '')에서 엉뚱한 모험이 돌지 않게
  const go = (def: AdventureDef) => {
    const r = runAdventure(save, def, Date.now())
    if (!r) return
    onSave(r.save)
    setOut(r)
    window.scrollTo(0, 0)
  }

  const names: Names | null = out ? [out.player.members.map((m) => m.name), out.enemy.members.map((m) => m.name)] : null
  const jobs: [string[], string[]] | null = out ? [out.player.members.map((m) => jobOf(m.id)), out.enemy.members.map((m) => jobOf(m.id))] : null

  return (
    <section className="adventure">
      {out && names && jobs && (
        <>
          <div className={`verdict ${out.result.outcome === 'team0' ? 'ok' : 'fail'}`}>
            <b>{out.def.name} — {outcomeText(out.result.outcome)}</b> · 경험치 +{out.exp} · 금 +{out.gold}
            {out.drops.length > 0 && ` · 확정 보상 ${out.drops.map((d) => `${materialLabel(d.itemId)} ×${d.qty}`).join(' · ')}`}
            {out.levelUps.length > 0 && (
              <ul>
                {out.levelUps.map((l, i) => (
                  <li key={i}>🎉 {l.name} 레벨 {l.level}!</li>
                ))}
              </ul>
            )}
            {out.result.outcome !== 'team0' && (
              <ul>
                {diagnose(out.analysis, names[0]).map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
              </ul>
            )}
            <small>시드 {out.seed} · 총 {out.result.actionCount}회 행동 · 본부의 최근 전투에 기록됨</small>
          </div>
          <Replay key={out.seed} result={out.result} names={names} jobs={jobs} />
        </>
      )}

      <h2>모험 <small>상대가 정해져 있다. 대신 연달아 갈 수 없고, 보상이 크다</small></h2>
      <p className="hint">
        일반 <button className="link" onClick={onGoBattle}>전투</button>는 같은 지역을 몇 번이든 돌 수 있습니다.
        모험은 <b>재도전 대기</b>·<b>하루 횟수</b>·<b>열쇠 재료</b>·<b>요일</b>이 걸리는 대신 상대가 고정이라 그 상대에 맞춰 수칙을 짤 수 있습니다.
      </p>

      <PartyBar save={save} onSave={onSave} onGoFormation={onGoFormation} />

      <ol className="regions">
        {ADVENTURES.map((a) => {
          const g = adventureGate(save, a, now)
          const open = a.id === sel
          const foeTeam = adventureTeam(a)
          const rw = adventureRewards(a)
          const lowLevel = us.avgLevel > 0 && us.avgLevel < a.recommended[0]
          return (
            <li key={a.id} className={`region ${open ? 'open' : ''} ${g.unlocked ? '' : 'locked'}`}>
              <button
                className="region-head"
                aria-expanded={open}
                onClick={() => {
                  setSel(open ? '' : a.id)
                  setOut(null)
                }}
              >
                <span className="no">{a.no}</span>
                <span className="body">
                  <span className="title">
                    {a.name} <small>권장 Lv {a.recommended[0]}–{a.recommended[1]}</small>
                    {g.cleared && <span className="badge">클리어</span>}
                  </span>
                  <span className="lesson">
                    {g.ready ? '지금 갈 수 있다' : g.reason === '재도전 대기 중' ? `재도전까지 ${waitText(g.waitMs)}` : g.reason}
                  </span>
                </span>
                <span className="caret" aria-hidden="true">{open ? '▾' : '▸'}</span>
              </button>

              {open && (
                <div className="region-body">
                  <p className="brief">{a.brief}</p>

                  {/* 상대가 고정이라 전투보다 더 자세히 보여 준다 — 그 상대에 맞춰 수칙을 짜라고 있는 콘텐츠다 */}
                  <h4 className="foe-title">고정 상대 <small>{foeTeam.members.length}명 · HP 합 {foeTeam.members.reduce((s, m) => s + m.stats.maxHp, 0)}</small></h4>
                  <ul className="foe-table">
                    {a.foes.map((id, i) => {
                      const d = MONSTERS[id]
                      const setup = foeTeam.members[i]
                      return (
                        <li key={i}>
                          <UnitPortrait icon={d.icon ?? d.job} size="sm" />
                          <span className="nm">{d.name}</span>
                          <small className="lv">Lv {d.level}</small>
                          <small className="arch">{ARCHETYPE_LABEL[d.archetype]}</small>
                          <small className="hp">HP {setup?.stats.maxHp ?? 0}</small>
                        </li>
                      )
                    })}
                  </ul>

                  <h4 className="foe-title">조건과 보상</h4>
                  <ul className="adv-terms">
                    <li><b>재도전</b> 승리 후 {a.cooldownMin.win === 0 ? '없음' : waitText(a.cooldownMin.win * 60_000)} · 패배 후 {waitText(a.cooldownMin.lose * 60_000)}</li>
                    {a.dailyLimit !== undefined && <li><b>하루</b> {a.dailyLimit}회까지 {g.todayLeft !== null && `(오늘 ${g.todayLeft}회 남음)`}</li>}
                    {a.weekdays && <li><b>요일</b> {a.weekdays.map((d) => WEEKDAY_LABEL[d]).join('·')}요일</li>}
                    {a.entry && (
                      <li className={(save.materials[a.entry.itemId] ?? 0) >= a.entry.qty ? 'have' : 'lack'}>
                        <b>입장</b> {materialLabel(a.entry.itemId)} ×{a.entry.qty} 소모 (보유 {save.materials[a.entry.itemId] ?? 0})
                        <small> — {MATERIALS[a.entry.itemId]?.blurb}</small>
                      </li>
                    )}
                    <li>
                      <b>보상</b> 경험치 {rw.exp} · 금 {rw.gold} <small>(일반 전투의 {a.rewardPct}%)</small> · 승리 시{' '}
                      {a.clearDrops.map((d) => `${materialLabel(d.itemId)} ×${d.qty}`).join(' · ')} 확정
                    </li>
                  </ul>

                  <div className="compare">
                    <div className="side us">
                      <div className="who">
                        {save.party.map((id, i) => {
                          const m = save.members.find((x) => x.id === id)
                          return m ? (
                            <span key={i} className="foe">
                              <UnitPortrait icon={m.job} size="sm" />
                              <small>Lv {m.level}</small>
                            </span>
                          ) : null
                        })}
                        {us.count === 0 && <small>편성 없음</small>}
                      </div>
                      <div className="sum"><b>{save.name}</b> · {us.count}명 · Lv 합 {us.levelSum} · HP 합 {us.hpSum}</div>
                    </div>
                    <div className="vs">vs</div>
                    <div className="side them">
                      <div className="sum">고정 {foeTeam.members.length}명 · HP 합 {foeTeam.members.reduce((s, m) => s + m.stats.maxHp, 0)}</div>
                    </div>
                  </div>

                  <div className="run-bar">
                    <button className="primary big" onClick={() => go(a)} disabled={!g.ready}>도전</button>
                    {!g.ready && <small>{g.reason === '재도전 대기 중' ? `재도전까지 ${waitText(g.waitMs)}` : g.reason}</small>}
                    {g.ready && lowLevel && <small>권장 레벨보다 낮습니다. 입장 재료와 횟수는 져도 소모됩니다.</small>}
                    
                  </div>
                </div>
              )}
            </li>
          )
        })}
      </ol>
      {materialsText(save) && <p className="hint">가진 재료: {materialsText(save)}</p>}
    </section>
  )
}
