// 가입 (docs/25 §4 ②). 입력하는 동안 규칙 충족을 바로 보여 준다 — 누른 뒤에야 틀렸다고 알리지 않는다.
import { useState } from 'react'
import { LOGIN_ID_MAX, LOGIN_ID_MIN, PASSWORD_MIN, checkLoginId, checkPassword, checkPasswordConfirm } from '../account/rules'
import { FrontShell } from './Title'

interface Props {
  onSubmit: (loginId: string, password: string) => Promise<string | null>
  onBack: () => void
}

function Rule({ show, error, okText }: { show: boolean; error: string | null; okText: string }) {
  if (!show) return <small className="auth-rule">{okText}</small>
  return <small className={`auth-rule ${error ? 'bad' : 'good'}`}>{error ? `✕ ${error}` : `✓ ${okText}`}</small>
}

export function SignUp({ onSubmit, onBack }: Props) {
  const [loginId, setLoginId] = useState('')
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const idErr = checkLoginId(loginId)
  const pwErr = checkPassword(pw)
  const pw2Err = pw2 ? checkPasswordConfirm(pw, pw2) : '비밀번호를 한 번 더 입력하세요'
  const ready = !idErr && !pwErr && !pw2Err && agreed

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!ready || busy) return
    setBusy(true)
    const err = await onSubmit(loginId, pw)
    setBusy(false)
    if (err) setError(err)
  }

  return (
    <FrontShell>
      <form className="auth-card" onSubmit={submit}>
        <h2>새 계정 만들기</h2>
        <label className="auth-field">
          <span>ID</span>
          <input value={loginId} maxLength={LOGIN_ID_MAX} autoComplete="username" autoCapitalize="none" spellCheck={false} onChange={(e) => { setLoginId(e.target.value); setError(null) }} />
          <Rule show={!!loginId} error={idErr} okText={`영문·숫자 ${LOGIN_ID_MIN}~${LOGIN_ID_MAX}자`} />
        </label>
        <label className="auth-field">
          <span>비밀번호</span>
          <input type="password" value={pw} autoComplete="new-password" onChange={(e) => setPw(e.target.value)} />
          <Rule show={!!pw} error={pwErr} okText={`${PASSWORD_MIN}자 이상`} />
        </label>
        <label className="auth-field">
          <span>비밀번호 확인</span>
          <input type="password" value={pw2} autoComplete="new-password" onChange={(e) => setPw2(e.target.value)} />
          <Rule show={!!pw2} error={pw2Err} okText="두 비밀번호가 같습니다" />
        </label>

        <div className="auth-warn">
          <b>⚠ 비밀번호를 잊으면 스스로 찾을 수 없습니다.</b> 이메일을 받지 않기 때문입니다. 꼭 기억해 두세요.
        </div>
        <label className="auth-check">
          <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
          위 안내를 확인했습니다
        </label>

        {error && <p className="auth-error" role="alert">{error}</p>}
        <div className="run-bar">
          <button type="submit" className="primary big" disabled={!ready || busy}>{busy ? '만드는 중…' : '계정 만들기'}</button>
          <button type="button" onClick={onBack}>돌아가기</button>
        </div>
      </form>
    </FrontShell>
  )
}
