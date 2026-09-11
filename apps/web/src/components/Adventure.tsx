// 모험 (탭 개편 2026-09-11). 일반 전투와 달리 상대가 고정이고, 연속 도전이 안 되며, 보상이 크다.
import { useMemo, useState } from 'react'
import { ADVENTURES, MATERIALS, MONSTERS, WEEKDAY_LABEL, adventureRewards, adventureTeam } from '@webrpg/engine'
import type { GameSave } from '../game/save'
import { adventureGate, materialsText, partySummary, runAdventure, type AdventureRun } from '../game/members'
import { jobIcon, jobOf, materialLabel, outcomeText, type Names } from '../lib/labels'
import { diagnose } from '../lib/diagnose'
import { Replay } from './Replay'

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
  const [sel, setSel] = useState(ADVENTURES[0].id)
  const [out, setOut] = useState<AdventureRun | null>(null)
  // 대기 시간 표시를 위해 렌더 시각을 고정한다 (도전할 때 다시 읽는다)
  const now = Date.now()
  const def = ADVENTURES.find((a) => a.id === sel) ?? ADVENTURES[0]
  const gate = adventureGate(save, def, now)
  const us = partySummary(save)
  const foes = useMemo(() => adventureTeam(def), [def])
  const reward = useMemo(() => adventureRewards(def), [def])

  const go = () => {
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

      <ol className="regions">
        {ADVENTURES.map((a) => {
          const g = adventureGate(save, a, now)
          return (
            <li key={a.id} className={`region ${a.id === sel ? 'on' : ''} ${g.unlocked ? '' : 'locked'}`}>
              <button onClick={() => { setSel(a.id); setOut(null) }}>
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
              </button>
            </li>
          )
        })}
      </ol>

      <div className="region-detail">
        <p className="brief">{def.brief}</p>

        <ul className="adv-terms">
          <li><b>상대</b> 고정 {def.foes.length}명 — {def.foes.map((id) => MONSTERS[id].name).join(' · ')}</li>
          <li><b>재도전</b> 승리 후 {def.cooldownMin.win === 0 ? '없음' : waitText(def.cooldownMin.win * 60_000)} · 패배 후 {waitText(def.cooldownMin.lose * 60_000)}</li>
          {def.dailyLimit !== undefined && <li><b>하루</b> {def.dailyLimit}회까지 {gate.todayLeft !== null && `(오늘 ${gate.todayLeft}회 남음)`}</li>}
          {def.weekdays && <li><b>요일</b> {def.weekdays.map((d) => WEEKDAY_LABEL[d]).join('·')}요일</li>}
          {def.entry && (
            <li className={(save.materials[def.entry.itemId] ?? 0) >= def.entry.qty ? 'have' : 'lack'}>
              <b>입장</b> {materialLabel(def.entry.itemId)} ×{def.entry.qty} 소모 (보유 {save.materials[def.entry.itemId] ?? 0})
              <small> — {MATERIALS[def.entry.itemId]?.blurb}</small>
            </li>
          )}
          <li><b>보상</b> 경험치 {reward.exp} · 금 {reward.gold} <small>(일반 전투의 {def.rewardPct}%)</small> · 승리 시 {def.clearDrops.map((d) => `${materialLabel(d.itemId)} ×${d.qty}`).join(' · ')} 확정</li>
        </ul>

        <div className="compare">
          <div className="side us">
            <div className="who">
              {save.party.map((id, i) => {
                const m = save.members.find((x) => x.id === id)
                return m ? (
                  <span key={i} className="foe">
                    <img src={jobIcon(m.job)} alt="" width={26} height={26} />
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
            <div className="who">
              {foes.members.map((m, i) => (
                <span key={i} className="foe">
                  <img src={jobIcon(jobOf(m.id))} alt="" width={26} height={26} />
                  <small>{m.name}</small>
                </span>
              ))}
            </div>
            <div className="sum">고정 {foes.members.length}명 · HP 합 {foes.members.reduce((s, m) => s + m.stats.maxHp, 0)}</div>
          </div>
        </div>

        <div className="run-bar">
          <button className="primary big" onClick={go} disabled={!gate.ready}>도전</button>
          {!gate.ready && <small>{gate.reason === '재도전 대기 중' ? `재도전까지 ${waitText(gate.waitMs)}` : gate.reason}</small>}
          {gate.ready && us.avgLevel > 0 && us.avgLevel < def.recommended[0] && <small>권장 레벨보다 낮습니다. 입장 재료와 횟수는 져도 소모됩니다.</small>}
          <small>편성은 <button className="link" onClick={onGoFormation}>편성 탭</button>에서.</small>
        </div>
        {materialsText(save) && <p className="hint">가진 재료: {materialsText(save)}</p>}
      </div>
    </section>
  )
}
