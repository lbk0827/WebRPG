// 모험가 만들기 (2026-09-14 단장 결정 docs/20, 계정제 docs/25 §4 ③). 주인공(모험가) 한 명으로 시작한다 — 용병단 이름 · 성별 · 이름을 고른다.
// 성별은 외형(도트)만 바꾼다. 능력치·스킬은 같다. HOF 도 첫 로그인 때 팀 이름 + 첫 캐릭터를 정했다.
// 계정제라 취소가 없다 — 이 화면을 끝내야 게임이 시작된다.
import { useState } from 'react'
import { HERO_JOB, PRESETS } from '@webrpg/engine'
import { HERO_DEFAULT_NAME, START_GOLD, type Gender } from '../game/save'
import { TEAM_NAME_MAX, checkTeamName } from '../account/rules'
import { UnitPortrait } from './UnitPortrait'
import { FrontShell } from './Title'

const GENDERS: { key: Gender; label: string }[] = [
  { key: 'male', label: '남' },
  { key: 'female', label: '여' },
]

export interface NewGameChoice {
  teamName: string
  gender: Gender
  heroName: string
}

interface Props {
  loginId: string
  /** 실패하면 문구 (예: 이미 쓰는 용병단 이름) */
  onStart: (c: NewGameChoice) => Promise<string | null>
  onLogout: () => void
}

export function NewGame({ loginId, onStart, onLogout }: Props) {
  const [teamName, setTeamName] = useState('')
  const [gender, setGender] = useState<Gender | null>(null)
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const teamErr = checkTeamName(teamName)
  const missing = teamErr ? teamErr : !gender ? '성별을 고르세요' : null

  const start = async () => {
    if (missing || !gender || busy) return
    setBusy(true)
    const err = await onStart({ teamName, gender, heroName: name })
    setBusy(false)
    if (err) setError(err)
  }

  return (
    <FrontShell>
      <section className="new-game-card">
        <h2>새 모험 <small className="auth-who">{loginId} · <button className="link" onClick={onLogout}>로그아웃</button></small></h2>
        <p className="hint">
          당신은 막 용병단을 꾸린 <b>{PRESETS[HERO_JOB].name}</b>입니다. 처음에는 혼자입니다 — 마을 외곽에서 싸워 금을 모으고,
          마을의 용병소에서 동료를 고용하세요. 주인공은 해고할 수 없습니다.
        </p>

        <h3 className="bar-title">용병단 이름 <small>1~{TEAM_NAME_MAX}자 · 다른 용병단과 겹칠 수 없습니다 · 전투 기록과 (앞으로) 랭킹에 나옵니다</small></h3>
        <label className="hero-name">
          <input value={teamName} maxLength={TEAM_NAME_MAX} placeholder="예) 붉은 늑대" onChange={(e) => { setTeamName(e.target.value); setError(null) }} />
        </label>

        <h3 className="bar-title">주인공 성별 <small>외형만 다릅니다. 능력치와 스킬은 같습니다</small></h3>
        <div className="gender-pick" role="radiogroup" aria-label="성별">
          {GENDERS.map((g) => (
            <button key={g.key} role="radio" aria-checked={gender === g.key} className={gender === g.key ? 'on' : ''} onClick={() => setGender(g.key)}>
              <UnitPortrait icon={`${HERO_JOB}-${g.key}`} size="xl" alt={`${PRESETS[HERO_JOB].name} (${g.label})`} />
              <b>{g.label}</b>
            </button>
          ))}
        </div>

        <h3 className="bar-title">주인공 이름 <small>비워 두면 「{HERO_DEFAULT_NAME}」</small></h3>
        <label className="hero-name">
          <input value={name} maxLength={12} placeholder={HERO_DEFAULT_NAME} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') void start() }} />
        </label>

        {error && <p className="auth-error" role="alert">{error}</p>}
        <div className="run-bar">
          <button className="primary big" disabled={!!missing || busy} onClick={() => void start()}>{busy ? '준비 중…' : '모험 시작'}</button>
          {missing && teamName !== '' && <small>{missing}</small>}
          {missing && teamName === '' && <small>용병단 이름과 성별을 정하세요.</small>}
        </div>
        <p className="hint">시작 금 {START_GOLD}.</p>
      </section>
    </FrontShell>
  )
}
