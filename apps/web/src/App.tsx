import { useEffect, useMemo, useState } from 'react'
import { MISSIONS, MISSION_BY_ID } from '@webrpg/engine'
import { loadGame, saveGame, type GameSave } from './game/save'
import { cellOf, partySummary } from './game/members'
import { loadProgress, saveProgress, type MissionProgress } from './missionState'
import { MissionList } from './components/MissionList'
import { MissionPlay } from './components/MissionPlay'
import { QuestBoard } from './components/QuestBoard'
import { RosterPanel } from './components/RosterPanel'
import { TrainingGround } from './components/TrainingGround'
import { Home, type Tab } from './components/Home'
import { Codex } from './components/Codex'
import { Formation } from './components/Formation'
import { Shop } from './components/Shop'
import { Workshop } from './components/Workshop'

/** 화면. 탭 5개(폰 하단 바 한계) + 탭 밖 화면(과제 목록·과제·도감·상점·공방)은 본부 탭에 속한다 (ADR-004) */
type View = Tab | 'missions' | 'codex' | 'shop' | 'workshop'

const TABS: { key: Tab; label: string }[] = [
  { key: 'home', label: '본부' },
  { key: 'quest', label: '의뢰' },
  { key: 'formation', label: '편성' },
  { key: 'roster', label: '단원' },
  { key: 'train', label: '훈련장' },
]

const tabOf = (v: View): Tab | null => (v === 'missions' || v === 'shop' || v === 'workshop' ? 'home' : v === 'codex' ? null : v)

export function App() {
  const [save, setSave] = useState<GameSave>(loadGame)
  const [progress, setProgress] = useState<MissionProgress>(loadProgress)
  const [view, setView] = useState<View>('home')
  const [missionId, setMissionId] = useState<string | null>(null)
  /** 편성 탭에 들어갈 때 미리 고를 칸 */
  const [formationCell, setFormationCell] = useState<number | null>(null)

  useEffect(() => saveGame(save), [save])
  useEffect(() => saveProgress(progress), [progress])

  const summary = useMemo(() => partySummary(save), [save])

  const go = (v: View) => {
    setView(v)
    if (v !== 'missions') setMissionId(null)
    if (v !== 'formation') setFormationCell(null)
    window.scrollTo(0, 0)
  }
  const openMission = (id: string) => {
    setMissionId(id)
    setView('missions')
    window.scrollTo(0, 0)
  }
  /** 단원 카드의 "수칙 편집 →" — 편성 탭에서 그 칸을 골라 둔다 */
  const editMember = (memberId: string) => {
    const cell = cellOf(save, memberId)
    setFormationCell(cell >= 0 ? cell : null)
    setView('formation')
    window.scrollTo(0, 0)
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
            <span>출전 {summary.count}/{save.members.length}</span>
            {summary.count > 0 && <span>평균 Lv {summary.avgLevel}</span>}
            <span>{save.battles}전 {save.wins}승</span>
          </div>
        </div>
        <nav className="tabs desktop">{nav}</nav>
        <button className={`codex-btn ${view === 'codex' ? 'on' : ''}`} onClick={() => go('codex')} title="도감">📖<span> 도감</span></button>
      </header>

      <main>
        {view === 'home' && (
          <Home save={save} progress={progress} onGo={go} onOpenMissions={() => go('missions')} onOpenMission={openMission} onOpenCodex={() => go('codex')} onOpenShop={() => go('shop')} onOpenWorkshop={() => go('workshop')} />
        )}
        {view === 'shop' && <Shop save={save} onSave={setSave} onBack={() => go('home')} onGoFormation={() => go('formation')} />}
        {view === 'workshop' && <Workshop save={save} onSave={setSave} onBack={() => go('home')} onGoQuest={() => go('quest')} />}
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
        {view === 'formation' && <Formation save={save} onSave={setSave} initialCell={formationCell} onGoRoster={() => go('roster')} onGoShop={() => go('shop')} />}
        {view === 'roster' && <RosterPanel save={save} onSave={setSave} onEditMember={editMember} onGoFormation={() => go('formation')} />}
        {view === 'train' && <TrainingGround save={save} />}
        {view === 'codex' && <Codex onBack={() => go('home')} />}
      </main>

      <nav className="tabs mobile">{nav}</nav>
    </div>
  )
}
