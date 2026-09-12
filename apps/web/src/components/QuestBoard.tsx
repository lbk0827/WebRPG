// 의뢰소 (M2-1, ADR-004 · 2026-09-12 제로식 방식으로 개편).
//
// 전에는 "지역 목록 + 아래에 상세 하나"였다. 고르고 아래로 내려가는 왕복이 생긴다.
// 제로식 전투 화면처럼 **지역마다 접이식 블록**으로 바꾸고, 펼친 블록 안에
// 등장 상대 · 비교 · 출전 버튼을 전부 넣는다. 한 번에 하나만 펼쳐진다.
//
// 가장 큰 이득은 **등장 상대를 출전 직전 그 자리에서 보는 것**이다.
// 전에는 도감에 가야 알 수 있었다. "여기 주술사가 나온다"를 알아야 끊기 수칙을 넣는다 —
// 이 게임은 출전 전 준비가 본체인데 그 정보가 다른 화면에 있으면 안 된다.
//
// 제로식에서 안 가져온 것: 같은 버튼을 위아래 두 벌 두는 것(페이지가 길어서 생긴 땜질),
// 편성 저장 슬롯을 전투 화면에 두는 것(편성은 편성 탭에 있어야 한다 — docs/11 §5.3 17번).
import { useMemo, useState } from 'react'
import { UnitPortrait } from './UnitPortrait'
import type { Analysis, BattleResult, TeamSetup } from '@webrpg/engine'
import { ARCHETYPE_LABEL, DEFAULT_CONFIG, MONSTERS, REGIONS, SKILLS, analyze, battleRewards, isRegionUnlocked, monsterSetup, rollEncounter, simulate, type RegionDef } from '@webrpg/engine'
import type { GameSave } from '../game/save'
import { pushRecord } from '../game/save'
import { addMaterials, applyExp, partyMembers, partySummary, partyTeam } from '../game/members'
import { jobOf, materialLabel, outcomeText, type Names } from '../lib/labels'
import { diagnose } from '../lib/diagnose'
import { Replay } from './Replay'

interface Props {
  save: GameSave
  onSave: (next: GameSave) => void
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
  const { exp, gold, drops } = battleRewards(result, enemy, seed)

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

/** 그 지역에 보이는 상대 (숨김 조우 제외) 와 예상 규모 */
function foesOf(region: RegionDef) {
  const list = region.table.filter((t) => !MONSTERS[t.monsterId].hidden).map((t) => MONSTERS[t.monsterId])
  const hps = list.map((d) => monsterSetup(d, 0).stats.maxHp)
  const lv = list.map((d) => d.level)
  return {
    list,
    hidden: region.table.some((t) => MONSTERS[t.monsterId].hidden),
    lvMin: Math.min(...lv),
    lvMax: Math.max(...lv),
    hpMin: Math.min(...hps) * region.count[0],
    hpMax: Math.max(...hps) * region.count[1],
  }
}

export function QuestBoard({ save, onSave }: Props) {
  const party = partyMembers(save)
  const us = partySummary(save)
  // 펼쳐 둘 지역. 기본은 **해금된 것 중 가장 깊은 곳** — 거기가 지금 할 일이다
  const deepest = useMemo(() => {
    const open = REGIONS.filter((r) => isRegionUnlocked(r, save.regionWins))
    return (open[open.length - 1] ?? REGIONS[0]).id
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const [sel, setSel] = useState<string>(deepest)
  const [outs, setOuts] = useState<Outcome[]>([])
  const [view, setView] = useState(0)

  const depart = (region: RegionDef, n: 1 | 3) => {
    if (!isRegionUnlocked(region, save.regionWins) || party.length === 0) return
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

  const out = outs[view]
  const names: Names | null = out ? [out.player.members.map((m) => m.name), out.enemy.members.map((m) => m.name)] : null
  const jobs: [string[], string[]] | null = out ? [out.player.members.map((m) => jobOf(m.id)), out.enemy.members.map((m) => jobOf(m.id))] : null
  const totalExp = outs.reduce((s, o) => s + o.exp, 0)
  const totalGold = outs.reduce((s, o) => s + o.gold, 0)
  const totalDrops = outs.flatMap((o) => o.drops)
  const allLevelUps = outs.flatMap((o) => o.levelUps)

  return (
    <section className="quest">
      {outs.length > 1 && (
        <div className="verdict multi">
          <b>{outs[0].region.name} — {outs.length}판 연속</b> · {outs.filter((o) => o.result.outcome === 'team0').length}승 · 경험치 +{totalExp} · 금 +{totalGold}{totalDrops.length > 0 && ` · 재료 ${dropsText(totalDrops)}`}
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
          <b>{out.region.name} — {outcomeText(out.result.outcome)}</b> · 경험치 +{out.exp} · 금 +{out.gold}{out.drops.length > 0 && ` · 재료 ${dropsText(out.drops)}`}
          {(outs.length > 1 ? allLevelUps : out.levelUps).length > 0 && (
            <ul>
              {(outs.length > 1 ? allLevelUps : out.levelUps).map((l, i) => (
                <li key={i}>🎉 {l.name} 레벨 {l.level}! 단원 탭에서 스탯 포인트를 분배하세요.</li>
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
      {out && names && jobs && <Replay key={out.seed} result={out.result} names={names} jobs={jobs} />}

      <h2>의뢰소 <small>금 {save.gold} · 편성 {party.length}명 · 평균 레벨 {us.avgLevel}</small></h2>
      <ol className="regions">
        {REGIONS.map((r) => {
          const unlocked = isRegionUnlocked(r, save.regionWins)
          const open = r.id === sel
          const wins = save.regionWins[r.id] ?? 0
          const need = r.unlock ? save.regionWins[r.unlock.regionId] ?? 0 : 0
          const gate = r.unlock
            ? `${REGIONS.find((x) => x.id === r.unlock!.regionId)?.name} ${need}/${r.unlock.wins}승 — ${r.unlock.wins - need}승 더 하면 열림`
            : ''
          const foes = foesOf(r)
          const low = us.avgLevel > 0 && us.avgLevel < r.recommended[0]
          return (
            <li key={r.id} className={`region ${open ? 'open' : ''} ${unlocked ? '' : 'locked'}`}>
              <button
                className="region-head"
                aria-expanded={open}
                onClick={() => {
                  setSel(open ? '' : r.id)
                  setOuts([])
                }}
              >
                <span className="no">{r.no}</span>
                <span className="body">
                  <span className="title">
                    {r.name} <small>권장 Lv {r.recommended[0]}–{r.recommended[1]}</small>
                  </span>
                  <span className="lesson">
                    {unlocked ? `${wins}승 · 조우 ${r.count[0]}~${r.count[1]}명 · 상대 ${foes.list.length}종` : gate}
                  </span>
                </span>
                <span className="caret" aria-hidden="true">{open ? '▾' : '▸'}</span>
              </button>

              {open && (
                <div className="region-body">
                  <p className="brief">{r.brief}</p>

                  {/* 등장 상대 — 출전 직전 그 자리에서. 전에는 도감에 가야 알 수 있었다 */}
                  <h4 className="foe-title">등장 상대 <small>Lv {foes.lvMin}{foes.lvMax !== foes.lvMin ? `–${foes.lvMax}` : ''} · 한 판에 {r.count[0]}~{r.count[1]}명</small></h4>
                  <ul className="foe-table">
                    {foes.list.map((m) => (
                      <li key={m.id}>
                        <UnitPortrait icon={m.icon ?? m.job} size="sm" />
                        <span className="nm">{m.name}</span>
                        <small className="lv">Lv {m.level}</small>
                        <small className="arch">{ARCHETYPE_LABEL[m.archetype]}</small>
                        <small className="hp">HP {monsterSetup(m, 0).stats.maxHp}</small>
                      </li>
                    ))}
                    {foes.hidden && (
                      <li className="rumor">
                        <span className="nm">소문뿐인 상대</span>
                        <small className="arch">드물게 나온다</small>
                      </li>
                    )}
                  </ul>

                  <div className="compare">
                    <div className="side us">
                      <div className="who">
                        {party.map((m) => (
                          <span key={m.id} className="foe">
                            <UnitPortrait icon={m.job} size="sm" />
                            <small>Lv {m.level}</small>
                          </span>
                        ))}
                        {party.length === 0 && <small>편성 없음</small>}
                      </div>
                      <div className="sum"><b>{save.name}</b> · {us.count}명 · Lv 합 {us.levelSum} · HP 합 {us.hpSum}</div>
                    </div>
                    <div className="vs">vs</div>
                    <div className="side them">
                      <div className="sum">예상 · {r.count[0]}~{r.count[1]}명 · HP 합 {foes.hpMin}~{foes.hpMax}</div>
                    </div>
                  </div>

                  <div className="run-bar">
                    <button className="primary big" onClick={() => depart(r, 1)} disabled={!unlocked || party.length === 0}>출전</button>
                    <button className="big" onClick={() => depart(r, 3)} disabled={!unlocked || party.length === 0} title="3판을 연달아 치르고 결과를 한꺼번에 본다">3판 연속</button>
                    {!unlocked && <small>{gate}</small>}
                    {unlocked && party.length === 0 && <small>편성 탭에서 단원을 세우세요.</small>}
                    {unlocked && low && <small>권장 레벨보다 낮습니다. 질 수 있습니다 — 그것도 경험치 30%.</small>}
                  </div>
                </div>
              )}
            </li>
          )
        })}
      </ol>
    </section>
  )
}
