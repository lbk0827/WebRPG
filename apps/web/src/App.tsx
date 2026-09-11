import { useEffect, useMemo, useState } from 'react'
import { loadGame, saveGame, type GameSave } from './game/save'
import { cellOf, partySummary } from './game/members'
import { loadProgress, saveProgress, type MissionProgress } from './missionState'
import { QuestBoard } from './components/QuestBoard'
import { TrainingGround } from './components/TrainingGround'
import { Home } from './components/Home'
import { Formation } from './components/Formation'
import { Characters } from './components/Characters'
import { Adventure } from './components/Adventure'
import { Town, type Facility } from './components/Town'

/** 탭 7개 (단장 지시 2026-09-11). 시설은 탭을 늘리지 않고 전부 마을 안에 붙인다 */
type Tab = 'home' | 'formation' | 'characters' | 'battle' | 'adventure' | 'town' | 'training'

const TABS: { key: Tab; label: string }[] = [
  { key: 'home', label: '본부' },
  { key: 'formation', label: '편성' },
  { key: 'characters', label: '캐릭터' },
  { key: 'battle', label: '전투' },
  { key: 'adventure', label: '모험' },
  { key: 'town', label: '마을' },
  { key: 'training', label: '훈련장' },
]

export function App() {
  const [save, setSave] = useState<GameSave>(loadGame)
  const [progress, setProgress] = useState<MissionProgress>(loadProgress)
  const [tab, setTab] = useState<Tab>('home')
  /** 마을에 들어갈 때 바로 열 시설 */
  const [townAt, setTownAt] = useState<Facility>('hub')
  /** 편성 탭에 들어갈 때 미리 고를 칸 */
  const [formationCell, setFormationCell] = useState<number | null>(null)

  useEffect(() => saveGame(save), [save])
  useEffect(() => saveProgress(progress), [progress])

  const summary = useMemo(() => partySummary(save), [save])

  const go = (t: Tab) => {
    setTab(t)
    if (t !== 'town') setTownAt('hub')
    if (t !== 'formation') setFormationCell(null)
    window.scrollTo(0, 0)
  }
  const goTown = (f: Facility = 'hub') => {
    setTownAt(f)
    setTab('town')
    window.scrollTo(0, 0)
  }
  /** 캐릭터 탭에서 "편성 판에서 세우기" — 그 단원의 칸을 미리 고른다 */
  const goFormation = (memberId?: string) => {
    const cell = memberId ? cellOf(save, memberId) : -1
    setFormationCell(cell >= 0 ? cell : null)
    setTab('formation')
    window.scrollTo(0, 0)
  }

  const nav = (
    <>
      {TABS.map((t) => (
        <button key={t.key} className={tab === t.key ? 'on' : ''} onClick={() => go(t.key)}>
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
      </header>

      <main>
        {tab === 'home' && <Home save={save} onSave={setSave} progress={progress} onGo={go} onGoTown={goTown} />}
        {tab === 'formation' && <Formation save={save} onSave={setSave} initialCell={formationCell} onGoShop={() => goTown('shop')} />}
        {tab === 'characters' && (
          <Characters
            save={save}
            onSave={setSave}
            onGoShop={() => goTown('shop')}
            onGoRecruit={() => goTown('recruit')}
            onGoFormation={() => goFormation()}
          />
        )}
        {tab === 'battle' && <QuestBoard save={save} onSave={setSave} />}
        {tab === 'adventure' && <Adventure save={save} onSave={setSave} onGoBattle={() => go('battle')} onGoFormation={() => goFormation()} />}
        {tab === 'town' && (
          <Town
            save={save}
            onSave={setSave}
            progress={progress}
            onProgress={setProgress}
            initial={townAt}
            onGoFormation={() => goFormation()}
            onGoBattle={() => go('battle')}
          />
        )}
        {tab === 'training' && <TrainingGround save={save} />}
      </main>

      <nav className="tabs mobile">{nav}</nav>
    </div>
  )
}
