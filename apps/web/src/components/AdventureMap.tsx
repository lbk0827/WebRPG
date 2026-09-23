// 모험 맵 (2026-09-13 단장 지시 — 전투와 같은 제로식 흐름).
//
// 흐름: 모험 탭 → 모험 목록(Adventure) → 이 페이지. 전투 맵과 같은 부품(MapParts)으로 편성하고 도전한다.
// 전투 맵과 다른 것은 모험의 성질에서 온다 (docs/11 §5.8 · §5.17):
//   · 상대가 **고정**이다 — "등장 몬스터"가 아니라 "고정 상대"이고, 편성 순서 그대로 보여 준다
//   · **연달아 갈 수 없다** — 3번 싸우자가 없다. 버튼은 도전! 하나
//   · 재도전 대기 · 하루 횟수 · 요일 · 입장 재료가 져도 소모된다 — 그래서 조건과 보상을 편성보다 먼저 보여 준다
//   · 재도전 대기는 이 페이지에 머무는 동안 30초마다 다시 센다
import { useEffect, useState } from 'react'
import { MATERIALS, MONSTERS, WEEKDAY_LABEL, adventureRewards, adventureTeam, type AdventureDef } from '@webrpg/engine'
import { PARTY_MAX, type GameSave } from '../game/save'
import { adventureGate, clearParty, partyMembers, partySummary, runAdventure, type AdventureRun } from '../game/members'
import { jobOf, materialLabel, outcomeText, waitText, type Names } from '../lib/labels'
import { diagnose } from '../lib/diagnose'
import { MonsterCard, PresetBox, TeamGrid } from './MapParts'
import { Replay } from './Replay'
import { UnitPortrait } from './UnitPortrait'

interface Props {
  save: GameSave
  onSave: (next: GameSave) => void
  def: AdventureDef
  /** 제목 옆 얼굴 */
  icon: string
  onBack: () => void
  onGoFormation: () => void
}

export function AdventureMap({ save, onSave, def, icon, onBack, onGoFormation }: Props) {
  const [out, setOut] = useState<AdventureRun | null>(null)
  const [, setTick] = useState(0)
  const now = Date.now()
  const g = adventureGate(save, def, now)
  const party = partyMembers(save)
  const us = partySummary(save)
  const foeTeam = adventureTeam(def)
  const foeHp = foeTeam.members.reduce((s, m) => s + m.stats.maxHp, 0)
  const rw = adventureRewards(def)
  const waiting = g.waitMs > 0

  // 재도전 대기가 걸려 있는 동안만 30초마다 다시 그린다 — 전에는 화면을 그린 순간의 시각으로 굳어 있었다
  useEffect(() => {
    if (!waiting) return
    const t = window.setInterval(() => setTick((x) => x + 1), 30_000)
    return () => window.clearInterval(t)
  }, [waiting])

  const go = () => {
    const r = runAdventure(save, def, Date.now())
    if (!r) return
    onSave(r.save)
    setOut(r)
    window.scrollTo(0, 0)
  }

  const note = !g.ready
    ? g.reason === '재도전 대기 중'
      ? `재도전까지 ${waitText(g.waitMs)}`
      : g.reason === '편성이 비어 있습니다'
        ? '아래에서 출전할 단원을 체크하세요.'
        : `${g.unlocked ? '' : '🔒 '}${g.reason ?? ''}`
    : us.avgLevel < def.recommended[0]
      ? '권장 레벨보다 낮습니다. 입장 재료와 횟수는 져도 소모됩니다.'
      : ''

  const fightBar = (
    <div className="fight-bar">
      <button className="primary big" disabled={!g.ready} onClick={go} title="상대가 고정이다. 연달아 갈 수는 없다">도전!</button>
      <button disabled={party.length === 0} onClick={() => onSave(clearParty(save))} title="출전 체크를 전부 푼다">선택초기화</button>
      {note && <small className="note">{note}</small>}
    </div>
  )

  const names: Names | null = out ? [out.player.members.map((m) => m.name), out.enemy.members.map((m) => m.name)] : null
  const jobs: [string[], string[]] | null = out ? [out.player.members.map((m) => jobOf(m.id)), out.enemy.members.map((m) => jobOf(m.id))] : null
  const have = def.entry ? save.materials[def.entry.itemId] ?? 0 : 0

  return (
    <section className="adventure battle-map">
      <div className="map-head">
        <button className="link" onClick={onBack}>← 모험 목록</button>
        <h2>
          <UnitPortrait icon={icon} size="xs" inline />
          모험 - {def.name}
          <small>권장 Lv {def.recommended[0]}–{def.recommended[1]} · 고정 {foeTeam.members.length}명</small>
          {g.cleared && <small className="clear-badge">클리어</small>}
        </h2>
      </div>

      {out && names && jobs && (
        <>
          <div className={`verdict ${out.result.outcome === 'team0' ? 'ok' : 'fail'}`}>
            <b>{def.name} — {outcomeText(out.result.outcome)}</b> · 경험치 +{out.exp} · 금 +{out.gold}
            {out.drops.length > 0 && ` · 확정 보상 ${out.drops.map((d) => `${materialLabel(d.itemId)} ×${d.qty}`).join(' · ')}`}
            {out.levelUps.length > 0 && (
              <ul>
                {out.levelUps.map((l, i) => (
                  <li key={i}>🎉 {l.name} 레벨 {l.level}! 캐릭터 탭에서 스탯 포인트를 분배하세요.</li>
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
          <Replay key={out.seed} result={out.result} names={names} jobs={jobs} backdrop={def.id} />
        </>
      )}

      <p className="brief">{def.brief}</p>

      <h3 className="bar-title">조건과 보상 <small>재도전 대기 · 하루 횟수 · 입장 재료는 져도 소모된다</small></h3>
      <ul className="adv-terms">
        <li>
          <b>재도전</b> 승리 후 {def.cooldownMin.win === 0 ? '없음' : waitText(def.cooldownMin.win * 60_000)} · 패배 후 {waitText(def.cooldownMin.lose * 60_000)}
          {waiting && <small> — 지금 {waitText(g.waitMs)} 남음</small>}
        </li>
        {def.dailyLimit !== undefined && (
          <li>
            <b>하루</b> {def.dailyLimit}회까지 {g.todayLeft !== null && `(오늘 ${g.todayLeft}회 남음)`}
          </li>
        )}
        {def.weekdays && (
          <li>
            <b>요일</b> {def.weekdays.map((d) => WEEKDAY_LABEL[d]).join('·')}요일
          </li>
        )}
        {def.entry && (
          <li className={have >= def.entry.qty ? 'have' : 'lack'}>
            <b>입장</b> {materialLabel(def.entry.itemId)} ×{def.entry.qty} 소모 (보유 {have})
            <small> — {MATERIALS[def.entry.itemId]?.blurb}</small>
          </li>
        )}
        <li>
          <b>보상</b> 경험치 {rw.exp} · 금 {rw.gold} <small>(일반 전투의 {def.rewardPct}%)</small> · 승리 시{' '}
          {def.clearDrops.map((d) => `${materialLabel(d.itemId)} ×${d.qty}`).join(' · ')} 확정
        </li>
      </ul>

      <h3 className="bar-title" title="이 상대에 맞춘 편성을 저장해 두고 불러온다">편성 저장</h3>
      <PresetBox save={save} onSave={onSave} onGoFormation={onGoFormation} />

      {fightBar}

      <h3 className="bar-title">
        단원 <small>체크하면 출전 · {party.length}/{PARTY_MAX}명 · Lv 합 {us.levelSum} · HP 합 {us.hpSum}</small>
      </h3>
      <TeamGrid save={save} onSave={onSave} />

      {fightBar}

      <h3 className="bar-title">
        고정 상대 <small>{foeTeam.members.length}명 · HP 합 {foeHp} · 언제 가도 이 편성이다</small>
      </h3>
      <ul className="appear">
        {def.foes.map((id, i) => (
          <MonsterCard key={i} def={MONSTERS[id]} name={foeTeam.members[i]?.name} />
        ))}
      </ul>
    </section>
  )
}
