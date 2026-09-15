// 타이틀 · 로그인 (docs/25 §4 ①). 로그인 상자 → 게임 소개 → 샘플 전투.
import { useMemo, useState, type ReactNode } from 'react'
import { DEFAULT_CONFIG, REGIONS, SKILLS, TEAMS, simulate } from '@webrpg/engine'
import { auth, rememberedId } from '../account'
import { jobOf, type Names } from '../lib/labels'
import { GameIntro } from './GameIntro'
import { Replay } from './Replay'

/** 로그인 전 화면들의 공통 틀 — 제목 줄 + 가운데 좁은 칸 + 로컬 모드 안내 */
export function FrontShell({ children, wide }: { children: ReactNode; wide?: boolean }) {
  return (
    <div className={`app front ${wide ? 'wide' : ''}`}>
      <header className="top">
        <div className="brand">
          <h1>오더 앤 블레이드</h1>
        </div>
      </header>
      <main>
        {children}
        {auth.mode === 'local' && (
          <p className="hint local-mode-note">
            <b>로컬 모드</b> — 아직 서버가 없어 계정과 진행이 <b>이 브라우저에만</b> 저장됩니다. 다른 기기나 다른 브라우저에서는 보이지 않습니다.
          </p>
        )}
      </main>
    </div>
  )
}

interface Props {
  onSignIn: (loginId: string, password: string, remember: boolean) => Promise<string | null>
  onSignUp: () => void
}

/** 샘플 전투 — 훈련 팀끼리. 엔진이 결정론이라 시드 하나로 항상 같은 판이 나온다 (단장 결정 §8-8) */
const SAMPLE_SEED = 7

export function Title({ onSignIn, onSignUp }: Props) {
  const remembered = rememberedId()
  const [loginId, setLoginId] = useState(remembered)
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(!!remembered)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const sample = useMemo(() => {
    const teams = [TEAMS.balanced(), TEAMS.rush()] as const
    const result = simulate({ seed: SAMPLE_SEED, teams: [teams[0], teams[1]], config: DEFAULT_CONFIG, skills: SKILLS })
    const names: Names = [teams[0].members.map((m) => m.name), teams[1].members.map((m) => m.name)]
    const jobs: [string[], string[]] = [teams[0].members.map((m) => jobOf(m.id)), teams[1].members.map((m) => jobOf(m.id))]
    return { result, names, jobs }
  }, [])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (busy) return
    if (!loginId.trim() || !password) {
      setError('ID와 비밀번호를 입력하세요')
      return
    }
    setBusy(true)
    const err = await onSignIn(loginId, password, remember)
    setBusy(false)
    if (err) {
      setError(err)
      setPassword('')
    }
  }

  return (
    <FrontShell wide>
      <p className="front-tagline">규칙을 짜고, 용병단이 싸운다</p>
      <div className="front-grid">
        <form className="auth-card" onSubmit={submit}>
          <h2>로그인</h2>
          <label className="auth-field">
            <span>ID</span>
            <input value={loginId} autoComplete="username" autoCapitalize="none" spellCheck={false} onChange={(e) => { setLoginId(e.target.value); setError(null) }} />
          </label>
          <label className="auth-field">
            <span>비밀번호</span>
            <input type="password" value={password} autoComplete="current-password" onChange={(e) => { setPassword(e.target.value); setError(null) }} />
          </label>
          <label className="auth-check">
            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
            ID 기억하기
          </label>
          {error && <p className="auth-error" role="alert">{error}</p>}
          <button type="submit" className="primary big auth-submit" disabled={busy}>{busy ? '확인 중…' : '로그인'}</button>
          <p className="auth-switch">
            처음이신가요? <button type="button" className="link" onClick={onSignUp}>새 계정 만들기 →</button>
          </p>
        </form>

        <GameIntro />
      </div>

      <section className="front-sample">
        <h3 className="bar-title">전투 미리보기 <small>훈련 팀 「균형」 대 「돌격」 — 누구도 조작하지 않는다. 수칙대로 싸울 뿐</small></h3>
        <Replay result={sample.result} names={sample.names} jobs={sample.jobs} backdrop={REGIONS[0].id} />
      </section>
    </FrontShell>
  )
}
