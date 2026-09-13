// 전투 맵 (2026-09-13 단장 지시 — 제로식 HOF 전투 화면 방식).
//
// 흐름: 전투 탭 → 지역 목록(QuestBoard) → 이 페이지. 여기서 편성하고 바로 싸운다.
// 제로식 한 페이지를 위에서 아래로 그대로 옮겼다:
//   편성 저장(모험단 LOAD·DEL / SAVE) → 싸우자! · 3번 싸우자! · 선택초기화
//   → 단원(체크박스) → 한 번 더 싸우자 → 등장 몬스터(MonsterAppearance)
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
import {
  ARCHETYPE_LABEL, DEFAULT_CONFIG, JOB_ADVANCE, MONSTERS, REGIONS, SKILLS,
  analyze, battleRewards, isRegionUnlocked, monsterSetup, rollEncounter, simulate, type RegionDef,
} from '@webrpg/engine'
import { PARTY_MAX, PARTY_PRESET_SLOTS, pushRecord, type GameSave, type Member, type PartyPreset } from '../game/save'
import {
  addMaterials, applyExp, clearParty, enlistMember, memberById, partyLuk, partyMembers, partySummary, partyTeam,
  rowHasRoom, setGrid, setMemberRow, withdrawMember,
} from '../game/members'
import { jobName, jobOf, materialLabel, outcomeText, type Names } from '../lib/labels'
import { diagnose } from '../lib/diagnose'
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

/** "Lv.32 소서리스" 의 직업 자리 — 전직했으면 2차 직업 이름 */
const jobLabel = (m: Member): string => (m.job2 ? JOB_ADVANCE[m.job2].name : jobName(m.job))

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
      {out && names && jobs && <Replay key={out.seed} result={out.result} names={names} jobs={jobs} />}

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
      <ul className="teams">
        {save.members.map((m) => (
          <TeamCard key={m.id} save={save} onSave={onSave} m={m} />
        ))}
      </ul>

      {fightBar}

      <h3 className="bar-title">
        등장 몬스터 <small>Lv {foes.lvMin}{foes.lvMax !== foes.lvMin ? `–${foes.lvMax}` : ''} · 한 판에 {region.count[0]}~{region.count[1]}명</small>
      </h3>
      <ul className="appear">
        {foes.list.map((d) => (
          <li key={d.id} className="appear-card">
            <span className="tile"><UnitPortrait icon={d.icon ?? d.job} size="xl" alt={d.name} /></span>
            <span className="nm">{d.name}</span>
            <small>Lv.{d.level} · {ARCHETYPE_LABEL[d.archetype]}</small>
            <small>HP {monsterSetup(d, 0).stats.maxHp}</small>
          </li>
        ))}
        {foes.hidden && (
          <li className="appear-card rumor">
            <span className="tile"><span className="q" aria-hidden="true">?</span></span>
            <span className="nm">소문뿐인 상대</span>
            <small>드물게 나온다</small>
          </li>
        )}
      </ul>
    </section>
  )
}

/** 편성 저장 — 제로식의 "모험단 [LOAD] [DEL] / 이름 [SAVE]" 줄 */
function PresetBox({ save, onSave, onGoFormation }: { save: GameSave; onSave: (g: GameSave) => void; onGoFormation: () => void }) {
  const current = JSON.stringify(save.party)
  const inUse = save.partyPresets.findIndex((p) => p !== null && JSON.stringify(p.party) === current)
  const filled = save.partyPresets.findIndex((p) => p !== null)
  const [slot, setSlot] = useState(inUse >= 0 ? inUse : filled >= 0 ? filled : 0)
  const [name, setName] = useState('')
  const p = save.partyPresets[slot] ?? null
  const isCurrent = p !== null && JSON.stringify(p.party) === current
  const empty = partyMembers(save).length === 0

  const put = (next: PartyPreset | null) => {
    const presets = save.partyPresets.slice()
    presets[slot] = next
    onSave({ ...save, partyPresets: presets })
  }
  const store = () => {
    if (empty) return
    if (p && !isCurrent && !window.confirm(`${slot + 1}번 "${p.name}" 을(를) 지금 편성으로 덮어씁니다.`)) return
    put({ name: (name.trim() || p?.name || `편성 ${slot + 1}`).slice(0, 12), party: [...save.party] })
    setName('')
  }
  const remove = () => {
    if (p && window.confirm(`${slot + 1}번 "${p.name}" 을(를) 지웁니다.`)) put(null)
  }
  const who = p ? p.party.map((id) => memberById(save, id)?.name).filter(Boolean).join(' · ') : ''

  return (
    <div className="party-box">
      <div className="pb-row">
        <span className="lbl">편성</span>
        <select value={slot} onChange={(e) => setSlot(Number(e.target.value))} aria-label="편성 슬롯">
          {Array.from({ length: PARTY_PRESET_SLOTS }, (_, i) => {
            const q = save.partyPresets[i]
            return (
              <option key={i} value={i}>
                {i + 1}. {q ? q.name : '(비어 있음)'}
              </option>
            )
          })}
        </select>
        <button disabled={!p || isCurrent} onClick={() => p && onSave(setGrid(save, p.party))}>불러오기</button>
        <button disabled={!p} onClick={remove}>삭제</button>
      </div>
      <div className="pb-row">
        <span className="lbl">이름</span>
        <input value={name} maxLength={12} placeholder={p?.name ?? `편성 ${slot + 1}`} onChange={(e) => setName(e.target.value)} aria-label="편성 이름" />
        <button disabled={empty} onClick={store}>이 슬롯에 저장</button>
      </div>
      <small className="pb-who">
        {p ? (isCurrent ? '지금 쓰는 편성입니다' : who || '비어 있는 편성') : '빈 슬롯 — 지금 편성을 저장할 수 있습니다'}
        {' · '}
        <button className="link" onClick={onGoFormation}>자리 세부 조정은 편성 탭 →</button>
      </small>
    </div>
  )
}

/** 단원 카드 — 제로식 Teams 의 한 칸. 도트 2배 + 받침 + 이름 · Lv 직업 + 체크박스, 체크되면 전열/후열 */
function TeamCard({ save, onSave, m }: { save: GameSave; onSave: (g: GameSave) => void; m: Member }) {
  const on = save.party.includes(m.id)
  const full = partyMembers(save).length >= PARTY_MAX
  const blocked = !on && full
  const toggle = () => onSave(on ? withdrawMember(save, m.id) : enlistMember(save, m.id))
  return (
    <li className={`team-card ${on ? 'on' : ''} ${blocked ? 'blocked' : ''}`}>
      <label title={blocked ? `출전은 ${PARTY_MAX}명까지입니다` : undefined}>
        <span className="tile"><UnitPortrait icon={m.job} size="xl" alt={m.name} /></span>
        <span className="nm">{m.name}</span>
        <small>Lv.{m.level} {jobLabel(m)}</small>
        <input type="checkbox" checked={on} disabled={blocked} onChange={toggle} />
      </label>
      {on && (
        <div className="row-toggle" role="group" aria-label={`${m.name} 서는 열`}>
          {(['front', 'back'] as const).map((r) => {
            const here = m.row === r
            const noRoom = !here && !rowHasRoom(save, r)
            return (
              <button
                key={r}
                className={here ? 'on' : ''}
                disabled={noRoom}
                title={noRoom ? `${r === 'front' ? '전열' : '후열'}이 꽉 찼습니다 (3칸)` : undefined}
                onClick={() => onSave(setMemberRow(save, m.id, r))}
              >
                {r === 'front' ? '전열' : '후열'}
              </button>
            )
          })}
        </div>
      )}
    </li>
  )
}
