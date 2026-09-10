// 의뢰소 (M2-1). 지역 선택 → 출전 → 보상·레벨업 → 재생.
import { useMemo, useState } from 'react'
import type { BattleResult, TeamSetup } from '@webrpg/engine'
import { DEFAULT_CONFIG, MONSTERS, REGIONS, SKILLS, battleRewards, isRegionUnlocked, rollEncounter, simulate, type RegionDef } from '@webrpg/engine'
import type { GameSave } from '../game/save'
import { applyExp, partyMembers, partyTeam } from '../game/members'
import { jobIcon, jobOf, outcomeText, type Names } from '../lib/labels'
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
  exp: number
  gold: number
  levelUps: { name: string; level: number }[]
}

export function QuestBoard({ save, onSave }: Props) {
  const [sel, setSel] = useState<string>(REGIONS[0].id)
  const [out, setOut] = useState<Outcome | null>(null)
  const region = REGIONS.find((r) => r.id === sel) ?? REGIONS[0]
  const unlocked = isRegionUnlocked(region, save.regionWins)
  const party = partyMembers(save)
  const avgLevel = party.length ? Math.round(party.reduce((s, m) => s + m.level, 0) / party.length) : 0

  const preview = useMemo(
    () => region.table.filter((t) => !MONSTERS[t.monsterId].hidden).map((t) => MONSTERS[t.monsterId]),
    [region],
  )

  const depart = () => {
    if (!unlocked || party.length === 0) return
    const seed = (Date.now() % 1_000_000_007) + save.battles
    const enemy = rollEncounter(region, seed)
    const player = partyTeam(save)
    const result = simulate({ seed, teams: [player, enemy], config: DEFAULT_CONFIG, skills: SKILLS })
    const { exp, gold } = battleRewards(result, enemy)

    const levelUps: { name: string; level: number }[] = []
    const members = save.members.map((m) => {
      if (!save.party.includes(m.id)) return m
      const r = applyExp(m, exp)
      if (r.levelsGained > 0) levelUps.push({ name: m.name, level: r.member.level })
      return r.member
    })
    const win = result.outcome === 'team0'
    onSave({
      ...save,
      members,
      gold: save.gold + gold,
      battles: save.battles + 1,
      regionWins: win ? { ...save.regionWins, [region.id]: (save.regionWins[region.id] ?? 0) + 1 } : save.regionWins,
    })
    setOut({ region, seed, enemy, player, result, exp, gold, levelUps })
    window.scrollTo(0, 0)
  }

  const names: Names | null = out ? [out.player.members.map((m) => m.name), out.enemy.members.map((m) => m.name)] : null
  const jobs: [string[], string[]] | null = out ? [out.player.members.map((m) => jobOf(m.id)), out.enemy.members.map((m) => jobOf(m.id))] : null

  return (
    <section className="quest">
      {out && names && jobs && (
        <div className={`verdict ${out.result.outcome === 'team0' ? 'ok' : 'fail'}`}>
          <b>{out.region.name} — {outcomeText(out.result.outcome)}</b> · 경험치 +{out.exp} · 금 +{out.gold}
          {out.levelUps.length > 0 && (
            <ul>
              {out.levelUps.map((l, i) => (
                <li key={i}>🎉 {l.name} 레벨 {l.level}! 단원 탭에서 스탯 포인트를 분배하세요.</li>
              ))}
            </ul>
          )}
          <small>시드 {out.seed} · 총 {out.result.actionCount}회 행동</small>
        </div>
      )}
      {out && names && jobs && <Replay result={out.result} names={names} jobs={jobs} />}

      <h2>의뢰소 <small>금 {save.gold} · 편성 {party.length}명 · 평균 레벨 {avgLevel}</small></h2>
      <ol className="regions">
        {REGIONS.map((r) => {
          const open = isRegionUnlocked(r, save.regionWins)
          const wins = save.regionWins[r.id] ?? 0
          return (
            <li key={r.id} className={`region ${r.id === sel ? 'on' : ''} ${open ? '' : 'locked'}`}>
              <button onClick={() => setSel(r.id)}>
                <span className="no">{r.no}</span>
                <span className="body">
                  <span className="title">{r.name} <small>권장 Lv {r.recommended[0]}–{r.recommended[1]}</small></span>
                  <span className="lesson">{open ? `${wins}승` : `${r.unlock ? REGIONS.find((x) => x.id === r.unlock!.regionId)?.name : ''}에서 ${r.unlock?.wins}승 하면 열림`}</span>
                </span>
              </button>
            </li>
          )
        })}
      </ol>

      <div className="region-detail">
        <p className="brief">{region.brief}</p>
        <div className="mission-enemy">
          <span className="label">출현</span>
          {preview.map((m) => (
            <span key={m.id} className="foe">
              <img src={jobIcon(m.job)} alt="" width={28} height={28} />
              <span>{m.name}<small> Lv {m.level}</small></span>
            </span>
          ))}
          {region.table.some((t) => MONSTERS[t.monsterId].hidden) && <span className="foe"><small>+ 소문뿐인 상대</small></span>}
        </div>
        <div className="run-bar">
          <button className="primary big" onClick={depart} disabled={!unlocked || party.length === 0}>출전</button>
          {party.length === 0 && <small>단원 탭에서 편성을 먼저 하세요.</small>}
          {avgLevel > 0 && avgLevel < region.recommended[0] && unlocked && <small>권장 레벨보다 낮습니다. 질 수 있습니다 — 그것도 경험치 30%.</small>}
        </div>
      </div>
    </section>
  )
}
