import { useEffect, useMemo, useState } from 'react'
import { MISSIONS, MISSION_BY_ID, PRESETS } from '@webrpg/engine'
import type { SlotState } from './state'
import { loadGame, saveGame, type GameSave } from './game/save'
import { memberStats, partyMembers, updateMember } from './game/members'
import { loadProgress, saveProgress, type MissionProgress } from './missionState'
import { RuleEditor } from './components/RuleEditor'
import { MissionList } from './components/MissionList'
import { MissionPlay } from './components/MissionPlay'
import { QuestBoard } from './components/QuestBoard'
import { RosterPanel } from './components/RosterPanel'
import { TrainingGround } from './components/TrainingGround'

type Tab = 'missions' | 'quest' | 'roster' | 'rules' | 'train'

const TABS: { key: Tab; label: string }[] = [
  { key: 'missions', label: '과제' },
  { key: 'quest', label: '의뢰' },
  { key: 'roster', label: '단원' },
  { key: 'rules', label: '수칙' },
  { key: 'train', label: '훈련장' },
]

export function App() {
  const [save, setSave] = useState<GameSave>(loadGame)
  const [progress, setProgress] = useState<MissionProgress>(loadProgress)
  const [tab, setTab] = useState<Tab>('missions')
  const [missionId, setMissionId] = useState<string | null>(null)

  useEffect(() => saveGame(save), [save])
  useEffect(() => saveProgress(progress), [progress])

  const party = useMemo(() => partyMembers(save), [save])
  const slots: SlotState[] = useMemo(
    () => party.map((m) => ({ job: m.job, row: m.row, guard: m.guard, rules: m.rules, stats: memberStats(m), skills: PRESETS[m.job].skills })),
    [party],
  )
  const setSlot = (i: number, next: SlotState) => {
    const m = party[i]
    if (!m) return
    setSave((s) => updateMember(s, { ...m, row: next.row, guard: next.guard, rules: next.rules }))
  }

  const mission = missionId ? MISSION_BY_ID[missionId] : null
  const nextMission = mission ? MISSIONS[mission.no] : undefined

  const nav = (
    <>
      {TABS.map((t) => (
        <button key={t.key} className={tab === t.key ? 'on' : ''} onClick={() => { setTab(t.key); if (t.key !== 'missions') setMissionId(null) }}>
          {t.label}
        </button>
      ))}
    </>
  )

  return (
    <div className="app">
      <header className="top">
        <h1>교전 수칙 훈련장 <small>M2</small></h1>
        <nav className="tabs desktop">{nav}</nav>
      </header>

      <main>
        {tab === 'missions' && !mission && (
          <MissionList progress={progress} onOpen={(id) => { setMissionId(id); window.scrollTo(0, 0) }} onFree={() => { setTab('quest'); window.scrollTo(0, 0) }} />
        )}
        {tab === 'missions' && mission && (
          <MissionPlay
            key={mission.id}
            mission={mission}
            progress={progress}
            onProgress={setProgress}
            onBack={() => setMissionId(null)}
            onNext={nextMission ? () => { setMissionId(nextMission.id); window.scrollTo(0, 0) } : null}
          />
        )}
        {tab === 'quest' && <QuestBoard save={save} onSave={setSave} />}
        {tab === 'roster' && <RosterPanel save={save} onSave={setSave} />}
        {tab === 'rules' && (slots.length ? <RuleEditor slots={slots} onChange={setSlot} names={party.map((m) => m.name)} /> : <p className="hint">단원 탭에서 편성을 먼저 하세요.</p>)}
        {tab === 'train' && <TrainingGround save={save} />}
      </main>

      <nav className="tabs mobile">{nav}</nav>
    </div>
  )
}
