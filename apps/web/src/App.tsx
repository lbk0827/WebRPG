import { useEffect, useMemo, useState } from 'react'
import { MISSIONS, MISSION_BY_ID, PRESETS } from '@webrpg/engine'
import type { SlotState } from './state'
import { loadGame, saveGame, type GameSave } from './game/save'
import { memberStats, partyMembers, partySummary, updateMember } from './game/members'
import { loadProgress, saveProgress, type MissionProgress } from './missionState'
import { RuleEditor } from './components/RuleEditor'
import { MissionList } from './components/MissionList'
import { MissionPlay } from './components/MissionPlay'
import { QuestBoard } from './components/QuestBoard'
import { RosterPanel } from './components/RosterPanel'
import { TrainingGround } from './components/TrainingGround'
import { Home, type Tab } from './components/Home'
import { Codex } from './components/Codex'
import { RuleTest } from './components/RuleTest'
import type { PresetHooks } from './components/RuleEditor'
import type { RulePreset } from './game/save'
import { RULE_PRESET_MAX } from './game/save'

/** 화면. 탭 5개(폰 하단 바 한계) + 탭 밖 화면(과제 목록·과제·도감)은 본부 탭에 속한다 (ADR-004) */
type View = Tab | 'missions' | 'codex'

const TABS: { key: Tab; label: string }[] = [
  { key: 'home', label: '본부' },
  { key: 'quest', label: '의뢰' },
  { key: 'roster', label: '단원' },
  { key: 'rules', label: '수칙' },
  { key: 'train', label: '훈련장' },
]

const tabOf = (v: View): Tab | null => (v === 'missions' ? 'home' : v === 'codex' ? null : v)

export function App() {
  const [save, setSave] = useState<GameSave>(loadGame)
  const [progress, setProgress] = useState<MissionProgress>(loadProgress)
  const [view, setView] = useState<View>('home')
  const [missionId, setMissionId] = useState<string | null>(null)
  const [rulesInitial, setRulesInitial] = useState(0)

  useEffect(() => saveGame(save), [save])
  useEffect(() => saveProgress(progress), [progress])

  const party = useMemo(() => partyMembers(save), [save])
  const summary = useMemo(() => partySummary(save), [save])
  const slots: SlotState[] = useMemo(
    () => party.map((m) => ({ job: m.job, row: m.row, guard: m.guard, rules: m.rules, stats: memberStats(m), skills: PRESETS[m.job].skills })),
    [party],
  )
  const setSlot = (i: number, next: SlotState) => {
    const m = party[i]
    if (!m) return
    setSave((s) => updateMember(s, { ...m, row: next.row, guard: next.guard, rules: next.rules }))
  }

  const go = (v: View) => {
    setView(v)
    if (v !== 'missions') setMissionId(null)
    window.scrollTo(0, 0)
  }
  const openMission = (id: string) => {
    setMissionId(id)
    setView('missions')
    window.scrollTo(0, 0)
  }
  const editRules = (partyIndex: number) => {
    setRulesInitial(partyIndex)
    go('rules')
  }

  // 수칙 프리셋 — 선택된 편성 단원 기준 (ADR-004 §5 J)
  const [rulesSel, setRulesSel] = useState(0)
  const presetHooks: PresetHooks = {
    list: save.rulePresets,
    onSave: (name) => {
      const m = party[rulesSel]
      if (!m || save.rulePresets.length >= RULE_PRESET_MAX) return
      const p: RulePreset = { id: `rp${Date.now()}`, name, job: m.job, rules: structuredClone(m.rules), row: m.row, guard: structuredClone(m.guard) }
      setSave((s) => ({ ...s, rulePresets: [...s.rulePresets, p] }))
    },
    onLoad: (p) => {
      const m = party[rulesSel]
      if (!m || m.job !== p.job) return
      setSave((s) => updateMember(s, { ...m, rules: structuredClone(p.rules), row: p.row, guard: structuredClone(p.guard) }))
    },
    onDelete: (id) => setSave((s) => ({ ...s, rulePresets: s.rulePresets.filter((p) => p.id !== id) })),
  }

  const mission = view === 'missions' && missionId ? MISSION_BY_ID[missionId] : null
  const nextMission = mission ? MISSIONS[mission.no] : undefined
  const active = tabOf(view)

  const nav = (
    <>
      {TABS.map((t) => (
        <button key={t.key} className={active === t.key ? 'on' : ''} onClick={() => go(t.key)}>
          {t.label}
        </button>
      ))}
    </>
  )

  return (
    <div className="app">
      <header className="top">
        <div className="brand">
          <h1>교전 수칙</h1>
          <div className="status">
            <b>{save.name}</b>
            <span>금 {save.gold}</span>
            <span>단원 {summary.count}/{save.members.length}</span>
            {summary.count > 0 && <span>평균 Lv {summary.avgLevel}</span>}
            <span>{save.battles}전 {save.wins}승</span>
          </div>
        </div>
        <nav className="tabs desktop">{nav}</nav>
        <button className={`codex-btn ${view === 'codex' ? 'on' : ''}`} onClick={() => go('codex')} title="도감">📖<span> 도감</span></button>
      </header>

      <main>
        {view === 'home' && (
          <Home save={save} progress={progress} onGo={go} onOpenMissions={() => go('missions')} onOpenMission={openMission} onOpenCodex={() => go('codex')} />
        )}
        {view === 'missions' && !mission && (
          <MissionList progress={progress} onOpen={openMission} onFree={() => go('quest')} onBack={() => go('home')} />
        )}
        {view === 'missions' && mission && (
          <MissionPlay
            key={mission.id}
            mission={mission}
            progress={progress}
            onProgress={setProgress}
            onBack={() => { setMissionId(null); window.scrollTo(0, 0) }}
            onNext={nextMission ? () => openMission(nextMission.id) : null}
          />
        )}
        {view === 'quest' && <QuestBoard save={save} onSave={setSave} />}
        {view === 'roster' && <RosterPanel save={save} onSave={setSave} onEditRules={editRules} />}
        {view === 'rules' && (slots.length ? (
          <>
            <RuleEditor key={rulesInitial} slots={slots} onChange={setSlot} names={party.map((m) => m.name)} initial={rulesInitial} presets={presetHooks} onSelect={setRulesSel} />
            <RuleTest save={save} />
          </>
        ) : <p className="hint">단원 탭에서 편성을 먼저 하세요.</p>)}
        {view === 'train' && <TrainingGround save={save} />}
        {view === 'codex' && <Codex onBack={() => go('home')} />}
      </main>

      <nav className="tabs mobile">{nav}</nav>
    </div>
  )
}
