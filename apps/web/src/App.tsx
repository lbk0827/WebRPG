import { useEffect, useMemo, useState } from 'react'
import { archiveLegacyGame, loadLegacyGame, migrate, newGame, type GameSave } from './game/save'
import { cellOf, partySummary } from './game/members'
import { adoptLegacyProgress, loadProgress, saveProgress, type MissionProgress } from './missionState'
import { auth, setRememberedId, type Session } from './account'
import { QuestBoard } from './components/QuestBoard'
import { TrainingGround } from './components/TrainingGround'
import { Home } from './components/Home'
import { Formation } from './components/Formation'
import { Characters } from './components/Characters'
import { Adventure } from './components/Adventure'
import { Town, type Facility } from './components/Town'
import { NewGame } from './components/NewGame'
import { Title } from './components/Title'
import { SignUp } from './components/SignUp'
import { LegacyImport } from './components/LegacyImport'

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

/** 접속 흐름 (docs/25 §3): 타이틀·로그인 → (가입) → 저장 있으면 본부 / 없으면 (예전 진행 가져오기) → 모험가 만들기 */
type Phase =
  | { kind: 'loading' }
  | { kind: 'title' }
  | { kind: 'signup' }
  | { kind: 'legacy'; session: Session; legacy: GameSave }
  | { kind: 'newgame'; session: Session }
  | { kind: 'game'; session: Session; save: GameSave }

export function App() {
  const [phase, setPhase] = useState<Phase>({ kind: 'loading' })

  /** 로그인된 계정으로 들어간다 — 저장이 있으면 본부, 없으면 예전 진행 확인 → 모험가 만들기 */
  const enter = async (session: Session) => {
    const raw = await auth.loadSave(session)
    const save = raw ? migrate(raw) : null
    if (save) return setPhase({ kind: 'game', session, save })
    const legacy = loadLegacyGame()
    setPhase(legacy ? { kind: 'legacy', session, legacy } : { kind: 'newgame', session })
  }

  useEffect(() => {
    void auth.restore().then((s) => (s ? enter(s) : setPhase({ kind: 'title' })))
  }, [])

  const logout = async () => {
    await auth.signOut()
    setPhase({ kind: 'title' })
    window.scrollTo(0, 0)
  }

  /** 용병단 이름을 잡고 첫 저장까지 한다. 실패하면 문구 */
  const begin = async (session: Session, teamName: string, save: GameSave): Promise<string | null> => {
    const claimed = await auth.claimTeamName(session, teamName)
    if (!claimed.ok) return claimed.error
    const named = { ...save, name: claimed.value }
    await auth.writeSave(session, named)
    setPhase({ kind: 'game', session, save: named })
    window.scrollTo(0, 0)
    return null
  }

  switch (phase.kind) {
    case 'loading':
      return <div className="app front"><main><p className="hint">불러오는 중…</p></main></div>
    case 'title':
      return (
        <Title
          onSignUp={() => setPhase({ kind: 'signup' })}
          onSignIn={async (id, pw, remember) => {
            const r = await auth.signIn(id, pw)
            if (!r.ok) return r.error
            setRememberedId(remember ? r.value.loginId : null)
            await enter(r.value)
            return null
          }}
        />
      )
    case 'signup':
      return (
        <SignUp
          onBack={() => setPhase({ kind: 'title' })}
          onSubmit={async (id, pw) => {
            const r = await auth.signUp(id, pw)
            if (!r.ok) return r.error
            await enter(r.value)
            return null
          }}
        />
      )
    case 'legacy': {
      const { session, legacy } = phase
      return (
        <LegacyImport
          loginId={session.loginId}
          legacy={legacy}
          onLogout={logout}
          onSkip={() => setPhase({ kind: 'newgame', session })}
          onImport={async (teamName) => {
            const err = await begin(session, teamName, legacy)
            if (!err) {
              adoptLegacyProgress(session.userId)
              archiveLegacyGame()
            }
            return err
          }}
        />
      )
    }
    case 'newgame': {
      const { session } = phase
      return (
        <NewGame
          loginId={session.loginId}
          onLogout={logout}
          onStart={(c) => begin(session, c.teamName, newGame({ gender: c.gender, heroName: c.heroName }))}
        />
      )
    }
    case 'game': {
      const { session, save } = phase
      return (
        <Game
          key={session.userId}
          session={session}
          save={save}
          setSave={(g) => setPhase((p) => (p.kind === 'game' ? { ...p, save: g } : p))}
          onLogout={logout}
        />
      )
    }
  }
}

interface GameProps {
  session: Session
  save: GameSave
  setSave: (g: GameSave) => void
  onLogout: () => void
}

function Game({ session, save, setSave, onLogout }: GameProps) {
  const [progress, setProgress] = useState<MissionProgress>(() => loadProgress(session.userId))
  const [tab, setTab] = useState<Tab>('home')
  /** 마을에 들어갈 때 바로 열 시설 */
  const [townAt, setTownAt] = useState<Facility>('hub')
  /** 편성 탭에 들어갈 때 미리 고를 칸 */
  const [formationCell, setFormationCell] = useState<number | null>(null)

  useEffect(() => { void auth.writeSave(session, save) }, [session, save])
  useEffect(() => saveProgress(session.userId, progress), [session, progress])

  const summary = useMemo(() => partySummary(save), [save])

  /** 용병단 이름 바꾸기 — 다른 계정과 겹치면 문구 */
  const rename = async (name: string): Promise<string | null> => {
    const r = await auth.claimTeamName(session, name)
    if (!r.ok) return r.error
    setSave({ ...save, name: r.value })
    return null
  }

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
          <h1>오더 앤 블레이드</h1>
          <div className="status">
            <b>{save.name}</b>
            <span>금 {save.gold}</span>
            <span>출전 {summary.count}/{save.members.length}</span>
            {summary.count > 0 && <span>평균 Lv {summary.avgLevel}</span>}
            <span>{save.battles}전 {save.wins}승</span>
            {auth.mode === 'local' && <span className="local-mode" title="서버 연결 전 — 계정과 진행이 이 브라우저에만 저장됩니다">로컬 모드</span>}
          </div>
        </div>
        <nav className="tabs desktop">{nav}</nav>
      </header>

      <main>
        {tab === 'home' && <Home save={save} onSave={setSave} progress={progress} onGo={go} onGoTown={goTown} loginId={session.loginId} onRename={rename} onLogout={onLogout} />}
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
        {tab === 'battle' && <QuestBoard save={save} onSave={setSave} onGoFormation={() => goFormation()} />}
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
