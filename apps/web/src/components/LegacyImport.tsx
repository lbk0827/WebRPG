// 예전 브라우저 저장 옮기기 (docs/25 §6). 계정이 생기기 전의 진행이 이 브라우저에 있으면, 첫 로그인 때 한 번 묻는다.
import { useState } from 'react'
import type { GameSave } from '../game/save'
import { DEFAULT_NAME } from '../game/save'
import { TEAM_NAME_MAX, checkTeamName } from '../account/rules'
import { FrontShell } from './Title'

interface Props {
  loginId: string
  legacy: GameSave
  onImport: (teamName: string) => Promise<string | null>
  onSkip: () => void
  onLogout: () => void
}

export function LegacyImport({ loginId, legacy, onImport, onSkip, onLogout }: Props) {
  const [teamName, setTeamName] = useState(legacy.name === DEFAULT_NAME ? '' : [...legacy.name].slice(0, TEAM_NAME_MAX).join(''))
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const teamErr = checkTeamName(teamName)
  const hero = legacy.members.find((m) => m.hero) ?? legacy.members[0]
  const topLevel = Math.max(0, ...legacy.members.map((m) => m.level))

  const accept = async () => {
    if (teamErr || busy) return
    setBusy(true)
    const err = await onImport(teamName)
    setBusy(false)
    if (err) setError(err)
  }

  return (
    <FrontShell>
      <section className="new-game-card">
        <h2>예전 진행 가져오기 <small className="auth-who">{loginId} · <button className="link" onClick={onLogout}>로그아웃</button></small></h2>
        <p className="hint">계정이 생기기 전에 이 브라우저에서 하던 진행이 있습니다. 이 계정으로 가져올까요? 가져오면 이 브라우저의 예전 저장은 계정으로 옮겨집니다.</p>
        <ul className="legacy-summary">
          {hero && <li>주인공 <b>{hero.name}</b></li>}
          <li>단원 <b>{legacy.members.length}명</b> · 최고 Lv <b>{topLevel}</b></li>
          <li>금 <b>{legacy.gold}</b> · <b>{legacy.battles}전 {legacy.wins}승</b></li>
        </ul>

        <h3 className="bar-title">용병단 이름 <small>1~{TEAM_NAME_MAX}자 · 다른 용병단과 겹칠 수 없습니다</small></h3>
        <label className="hero-name">
          <input value={teamName} maxLength={TEAM_NAME_MAX} placeholder="예) 붉은 늑대" onChange={(e) => { setTeamName(e.target.value); setError(null) }} />
        </label>

        {error && <p className="auth-error" role="alert">{error}</p>}
        <div className="run-bar">
          <button className="primary big" disabled={!!teamErr || busy} onClick={() => void accept()}>{busy ? '옮기는 중…' : '가져오기'}</button>
          <button onClick={onSkip}>가져오지 않고 새로 시작</button>
        </div>
      </section>
    </FrontShell>
  )
}
