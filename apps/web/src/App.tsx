import { useEffect, useMemo, useState } from 'react'
import { buildEnemyTeam, buildPlayerTeam, loadState, saveState, type AppState, type SlotState } from './state'
import { PartyPanel } from './components/PartyPanel'
import { RuleEditor } from './components/RuleEditor'
import { BattleView } from './components/BattleView'
import { Trainer } from './components/Trainer'

type Tab = 'party' | 'rules' | 'battle' | 'train'

const TABS: { key: Tab; label: string }[] = [
  { key: 'party', label: '편성' },
  { key: 'rules', label: '수칙' },
  { key: 'battle', label: '전투' },
  { key: 'train', label: '훈련장' },
]

export function App() {
  const [state, setState] = useState<AppState>(loadState)
  const [tab, setTab] = useState<Tab>('rules')

  useEffect(() => saveState(state), [state])

  const player = useMemo(() => buildPlayerTeam(state), [state])
  const enemy = useMemo(() => buildEnemyTeam(state), [state])

  const setSlot = (i: number, next: SlotState) => setState((s) => ({ ...s, slots: s.slots.map((x, j) => (j === i ? next : x)) }))

  return (
    <div className="app">
      <header className="top">
        <h1>교전 수칙 훈련장 <small>M1</small></h1>
        <nav className="tabs desktop">
          {TABS.map((t) => (
            <button key={t.key} className={tab === t.key ? 'on' : ''} onClick={() => setTab(t.key)}>{t.label}</button>
          ))}
        </nav>
      </header>

      <main>
        {tab === 'party' && <PartyPanel slots={state.slots} enemy={state.enemy} onSlot={setSlot} onEnemy={(enemy) => setState((s) => ({ ...s, enemy }))} />}
        {tab === 'rules' && <RuleEditor slots={state.slots} onChange={setSlot} />}
        {tab === 'battle' && <BattleView player={player} enemy={enemy} seed={state.seed} onSeed={(seed) => setState((s) => ({ ...s, seed }))} />}
        {tab === 'train' && <Trainer player={player} enemy={enemy} seed={state.seed} />}
      </main>

      <nav className="tabs mobile">
        {TABS.map((t) => (
          <button key={t.key} className={tab === t.key ? 'on' : ''} onClick={() => setTab(t.key)}>{t.label}</button>
        ))}
      </nav>
    </div>
  )
}
