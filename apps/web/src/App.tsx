import { useEffect, useMemo, useState } from 'react'
import { MISSIONS, MISSION_BY_ID } from '@webrpg/engine'
import { buildEnemyTeam, buildPlayerTeam, loadState, saveState, type AppState, type SlotState } from './state'
import { loadProgress, saveProgress, type MissionProgress } from './missionState'
import { PartyPanel } from './components/PartyPanel'
import { RuleEditor } from './components/RuleEditor'
import { BattleView } from './components/BattleView'
import { Trainer } from './components/Trainer'
import { MissionList } from './components/MissionList'
import { MissionPlay } from './components/MissionPlay'

type Tab = 'missions' | 'party' | 'rules' | 'battle' | 'train'

const TABS: { key: Tab; label: string }[] = [
  { key: 'missions', label: '과제' },
  { key: 'party', label: '편성' },
  { key: 'rules', label: '수칙' },
  { key: 'battle', label: '전투' },
  { key: 'train', label: '훈련장' },
]

export function App() {
  const [state, setState] = useState<AppState>(loadState)
  const [progress, setProgress] = useState<MissionProgress>(loadProgress)
  const [tab, setTab] = useState<Tab>('missions')
  const [missionId, setMissionId] = useState<string | null>(null)

  useEffect(() => saveState(state), [state])
  useEffect(() => saveProgress(progress), [progress])

  const player = useMemo(() => buildPlayerTeam(state), [state])
  const enemy = useMemo(() => buildEnemyTeam(state), [state])
  const setSlot = (i: number, next: SlotState) => setState((s) => ({ ...s, slots: s.slots.map((x, j) => (j === i ? next : x)) }))

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
        <h1>교전 수칙 훈련장 <small>M1</small></h1>
        <nav className="tabs desktop">{nav}</nav>
      </header>

      <main>
        {tab === 'missions' && !mission && <MissionList progress={progress} onOpen={(id) => { setMissionId(id); window.scrollTo(0, 0) }} />}
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
        {tab === 'party' && <PartyPanel slots={state.slots} enemy={state.enemy} onSlot={setSlot} onEnemy={(e) => setState((s) => ({ ...s, enemy: e }))} />}
        {tab === 'rules' && <RuleEditor slots={state.slots} onChange={setSlot} />}
        {tab === 'battle' && <BattleView player={player} enemy={enemy} seed={state.seed} onSeed={(seed) => setState((s) => ({ ...s, seed }))} />}
        {tab === 'train' && <Trainer player={player} enemy={enemy} seed={state.seed} />}
      </main>

      <nav className="tabs mobile">{nav}</nav>
    </div>
  )
}
