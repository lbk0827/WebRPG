// 전투 맵 (2026-09-13 단장 지시 — 제로식 HOF 전투 화면 방식).
//
// 흐름: 전투 탭 → 지역 목록(QuestBoard) → 이 페이지. 여기서 편성하고 바로 싸운다.
// 제로식 한 페이지를 위에서 아래로 그대로 옮겼다:
//   편성 저장(모험단 LOAD·DEL / SAVE) → 싸우자! · 3번 싸우자! · 선택초기화
//   → 단원(체크박스) → 한 번 더 싸우자 → 등장 몬스터(MonsterAppearance)
// 편성 부품은 모험 맵과 함께 쓴다 (MapParts).
//
// 우리와 다른 점 하나 — 우리 엔진은 **전열/후열**이 있다. 제로식처럼 체크박스로 "누가 가나"를 고르고,
// 체크된 단원 카드에 전열/후열 토글을 붙여 "어디 서나"를 정한다. 같은 열 안의 칸 순서까지 만지려면 편성 탭.
//
// 싸우자 버튼을 위아래 두 벌 둔다. 전에는 "페이지가 길어서 생긴 땜질"이라 뺐지만(docs/11 §5.9),
// 단원이 30명까지 늘면 카드 격자가 길어져 실제로 필요하다.
//
// 가져오지 않은 것: "Save this party" 체크박스. 우리는 체크하는 즉시 편성이 저장된다.
// 맵마다 다른 편성은 맨 위의 편성 저장(프리셋)으로 한다.
import { useState } from 'react'
import type { Analysis, BattleResult, TeamSetup } from '@webrpg/engine'
import { DEFAULT_CONFIG, MONSTERS, REGIONS, SKILLS, analyze, battleRewards, isRegionUnlocked, rollEncounter, simulate, type RegionDef } from '@webrpg/engine'
import { PARTY_MAX, pushRecord, type GameSave } from '../game/save'
import { addMaterials, applyExp, clearParty, partyLuk, partyMembers, partySummary, partyTeam } from '../game/members'
import { jobOf, materialLabel, outcomeText, type Names } from '../lib/labels'
import { diagnose } from '../lib/diagnose'
import { MonsterCard, PresetBox, RumorCard, TeamGrid } from './MapParts'
import { Replay } from './Replay'
import { UnitPortrait } from './UnitPortrait'

interface Props {
  save: GameSave
  onSave: (next: GameSave) => void
  region: RegionDef
  /** 목록에서 이 지역이 속한 묶음 (제목의 "묶음 - 지역") */
  group: string
  /** 제목 옆 얼굴 */
  icon: string
  onBack: () => void
  onGoFormation: () => void
}

interface Outcome {
  region: RegionDef
  seed: number
  enemy: TeamSetup
  player: TeamSetup
  result: BattleResult
  analysis: Analysis
  exp: number
  gold: number
  drops: string[]
  levelUps: { name: string; level: number }[]
}

/** "철 조각 ×2 · 가죽 ×1" */
const dropsText = (drops: string[]): string => {
  const c: Record<string, number> = {}
  for (const d of drops) c[d] = (c[d] ?? 0) + 1
  return Object.entries(c).map(([id, n]) => `${materialLabel(id)} ×${n}`).join(' · ')
}

/** 한 판 — 저장본을 받아 갱신된 저장본과 결과를 돌려준다 (연속 출전은 이걸 이어 붙인다) */
function runOne(save: GameSave, region: RegionDef, at: number): { save: GameSave; out: Outcome } {
  const seed = (at % 1_000_000_007) + save.battles
  const enemy = rollEncounter(region, seed)
  const player = partyTeam(save)
  const result = simulate({ seed, teams: [player, enemy], config: DEFAULT_CONFIG, skills: SKILLS })
  const analysis = analyze(result, [player.members.length, enemy.members.length])
  const { exp, gold, drops } = battleRewards(result, enemy, seed, partyLuk(save))

  const levelUps: { name: string; level: number }[] = []
  const members = save.members.map((m) => {
    if (!save.party.includes(m.id)) return m
    const r = applyExp(m, exp)
    if (r.levelsGained > 0) levelUps.push({ name: m.name, level: r.member.level })
    return r.member
  })
  const win = result.outcome === 'team0'
  const next: GameSave = pushRecord(
    addMaterials(
      {
        ...save,
        members,
        gold: save.gold + gold,
        battles: save.battles + 1,
        wins: save.wins + (win ? 1 : 0),
        regionWins: win ? { ...save.regionWins, [region.id]: (save.regionWins[region.id] ?? 0) + 1 } : save.regionWins,
      },
      drops,
    ),
    { at, regionId: region.id, seed, outcome: result.outcome, exp, gold, actions: result.actionCount, player, enemy },
  )
  return { save: next, out: { region, seed, enemy, player, result, analysis, exp, gold, drops, levelUps } }
}

/** 그 지역에 보이는 상대 (숨김 조우 제외), 레벨 순 — 제로식 MonsterAppearance 처럼 약한 것부터 */
function foesOf(region: RegionDef) {
  const list = region.table
    .map((t) => MONSTERS[t.monsterId])
    .filter((d) => !d.hidden)
    .sort((a, b) => a.level - b.level)
  const lv = list.map((d) => d.level)
  return { list, hidden: region.table.some((t) => MONSTERS[t.monsterId].hidden), lvMin: Math.min(...lv), lvMax: Math.max(...lv) }
}

export function BattleMap({ save, onSave, region, group, icon, onBack, onGoFormation }: Props) {
  const party = partyMembers(save)
  const us = partySummary(save)
  const unlocked = isRegionUnlocked(region, save.regionWins)
  const wins = save.regionWins[region.id] ?? 0
  const foes = foesOf(region)
  const [outs, setOuts] = useState<Outcome[]>([])
  const [view, setView] = useState(0)

  const need = region.unlock ? save.regionWins[region.unlock.regionId] ?? 0 : 0
  const gate = region.unlock
    ? `${REGIONS.find((x) => x.id === region.unlock!.regionId)?.name} ${need}/${region.unlock.wins}승 — ${region.unlock.wins - need}승 더 하면 열립니다`
    : ''
  const canFight = unlocked && party.length > 0

  const depart = (n: 1 | 3) => {
    if (!canFight) return
    let cur = save
    const list: Outcome[] = []
    const base = Date.now()
    for (let i = 0; i < n; i++) {
      const r = runOne(cur, region, base + i)
      cur = r.save
      list.push(r.out)
    }
    onSave(cur)
    setOuts(list)
    setView(list.length - 1)
    window.scrollTo(0, 0)
  }

  const note = !unlocked
    ? `🔒 ${gate}`
    : party.length === 0
      ? '아래에서 출전할 단원을 체크하세요.'
      // 인원이 난이도에 가장 크게 작용한다 (docs/07 §3.8g). 레벨 경고보다 먼저 — 혼자 가도에 가면 0% 다 (docs/20 §6)
      : party.length < region.count[0]
        ? `상대는 한 판에 ${region.count[0]}~${region.count[1]}명인데 출전 ${party.length}명입니다. 마을 용병소에서 동료를 고용하세요 — 자리가 있으면 바로 출전합니다.`
      : us.avgLevel < region.recommended[0]
        ? '권장 레벨보다 낮습니다. 질 수 있습니다 — 져도 경험치 30%.'
        : ''

  const fightBar = (
    <div className="fight-bar">
      <button className="primary big" disabled={!canFight} onClick={() => depart(1)}>싸우자!</button>
      <button className="big" disabled={!canFight} onClick={() => depart(3)} title="3판을 연달아 치르고 결과를 한꺼번에 본다">3번 싸우자!</button>
      <button disabled={party.length === 0} onClick={() => onSave(clearParty(save))} title="출전 체크를 전부 푼다">선택초기화</button>
      {note && <small className="note">{note}</small>}
    </div>
  )

  const out = outs[view]
  const names: Names | null = out ? [out.player.members.map((m) => m.name), out.enemy.members.map((m) => m.name)] : null
  const jobs: [string[], string[]] | null = out ? [out.player.members.map((m) => jobOf(m.id)), out.enemy.members.map((m) => jobOf(m.id))] : null
  const totalExp = outs.reduce((s, o) => s + o.exp, 0)
  const totalGold = outs.reduce((s, o) => s + o.gold, 0)
  const totalDrops = outs.flatMap((o) => o.drops)
  const levelUps = outs.length > 1 ? outs.flatMap((o) => o.levelUps) : out?.levelUps ?? []

  return (
    <section className="quest battle-map">
      <div className="map-head">
        <button className="link" onClick={onBack}>← 전투 지역 목록</button>
        <h2>
          <UnitPortrait icon={icon} size="xs" inline />
          {group} - {region.name}
          <small>권장 Lv {region.recommended[0]}–{region.recommended[1]} · 한 판에 {region.count[0]}~{region.count[1]}명 · {wins}승</small>
          {region.expects === 'advanced' && <small className="adv-badge">전직 전제</small>}
        </h2>
      </div>

      {outs.length > 1 && (
        <div className="verdict multi">
          <b>{region.name} — {outs.length}판 연속</b> · {outs.filter((o) => o.result.outcome === 'team0').length}승 · 경험치 +{totalExp} · 금 +{totalGold}
          {totalDrops.length > 0 && ` · 재료 ${dropsText(totalDrops)}`}
          <div className="multi-list">
            {outs.map((o, i) => (
              <button key={i} className={`${i === view ? 'on' : ''} ${o.result.outcome === 'team0' ? 'win' : 'lose'}`} onClick={() => setView(i)}>
                {i + 1}판 {outcomeText(o.result.outcome)} <small>+{o.exp}</small>
              </button>
            ))}
          </div>
        </div>
      )}
      {out && names && jobs && (
        <div className={`verdict ${out.result.outcome === 'team0' ? 'ok' : 'fail'}`}>
          <b>{region.name} — {outcomeText(out.result.outcome)}</b> · 경험치 +{out.exp} · 금 +{out.gold}
          {out.drops.length > 0 && ` · 재료 ${dropsText(out.drops)}`}
          {levelUps.length > 0 && (
            <ul>
              {levelUps.map((l, i) => (
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
      )}
      {out && names && jobs && <Replay key={out.seed} result={out.result} names={names} jobs={jobs} backdrop={region.id} />}

      <p className="brief">{region.brief}</p>
      {region.expects === 'advanced' && (
        <p className="adv-note">
          <b>여기부터는 레벨로 넘지 못합니다.</b> 상대가 우리보다 높고, 2차 직업의 훅을 그대로 들고 나옵니다.
          전직하고 그 훅을 쓰는 수칙을 짜야 해볼 만합니다 — 만렙으로 기본 수칙만 들고 오면 거의 집니다.
        </p>
      )}

      <h3 className="bar-title">편성 저장 <small>맵마다 다른 편성을 저장해 두고 불러온다</small></h3>
      <PresetBox save={save} onSave={onSave} onGoFormation={onGoFormation} />

      {fightBar}

      <h3 className="bar-title">
        단원 <small>체크하면 출전 · {party.length}/{PARTY_MAX}명 · Lv 합 {us.levelSum} · HP 합 {us.hpSum}</small>
      </h3>
      <TeamGrid save={save} onSave={onSave} />

      {fightBar}

      <h3 className="bar-title">
        등장 몬스터 <small>Lv {foes.lvMin}{foes.lvMax !== foes.lvMin ? `–${foes.lvMax}` : ''} · 한 판에 {region.count[0]}~{region.count[1]}명</small>
      </h3>
      <ul className="appear">
        {foes.list.map((d) => (
          <MonsterCard key={d.id} def={d} />
        ))}
        {foes.hidden && <RumorCard />}
      </ul>
    </section>
  )
}
