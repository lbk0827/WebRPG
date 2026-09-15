// Supabase 인증 · 저장 (docs/25 B 단계). 테이블과 보안 규칙은 supabase/schema.sql.
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { fail, ok, type AuthResult, type AuthService, type SaveStatus, type Session } from './auth'
import { LOGIN_EMAIL_DOMAIN, SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from './config'
import { LOGIN_ID_TAKEN, SIGN_IN_FAILED, TEAM_NAME_TAKEN, checkLoginId, checkPassword, checkTeamName, cleanTeamName, normalizeLoginId } from './rules'

/** 바뀐 저장을 모아 보내는 간격 — 버튼 누를 때마다 서버에 쓰지 않는다 (docs/25 §6) */
const SAVE_DELAY_MS = 2000
/** 저장 실패 뒤 다시 시도 */
const RETRY_MS = 10_000

const emailOf = (loginId: string) => `${loginId}@${LOGIN_EMAIL_DOMAIN}`
const loginIdOf = (email: string | undefined) => (email ?? '').split('@')[0]

const OFFLINE = '서버에 연결할 수 없습니다. 잠시 후 다시 시도하세요'
const TOO_MANY = '시도가 너무 많습니다. 잠시 후 다시 시도하세요'

/** 오류를 사람 말로. 네트워크 · 한도 오류는 "틀렸다"가 아니라 "나중에"로 알린다 */
function describe(e: { status?: number; code?: string } | null, fallback: string): string {
  if (!e) return fallback
  if (e.status === 429 || e.code?.includes('rate_limit')) return TOO_MANY
  if (!e.status || e.status >= 500) return OFFLINE
  return fallback
}

export function createSupabaseAuth(client: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, storageKey: 'webrpg.supabase.auth' },
})): AuthService {
  let pending: { s: Session; save: unknown } | null = null
  let timer: ReturnType<typeof setTimeout> | undefined
  let chain: Promise<void> = Promise.resolve()
  const listeners = new Set<(s: SaveStatus) => void>()
  const setStatus = (st: SaveStatus) => listeners.forEach((l) => l(st))

  const sendPending = async () => {
    if (timer !== undefined) {
      clearTimeout(timer)
      timer = undefined
    }
    const job = pending
    if (!job) return
    pending = null
    setStatus('saving')
    const { error } = await client.from('saves').upsert({ user_id: job.s.userId, data: job.save })
    if (error) {
      // 그 사이 더 새 저장이 들어왔으면 그것을 보낸다. 아니면 실패한 것을 다시
      pending ??= job
      setStatus('error')
      timer = setTimeout(() => void flush(), RETRY_MS)
    } else if (!pending) {
      setStatus('saved')
    }
  }
  /** 보내는 중에 또 부르면 앞의 것이 끝난 뒤 이어서 — 순서가 뒤바뀌지 않는다 */
  const flush = (): Promise<void> => (chain = chain.then(sendPending))

  if (typeof document !== 'undefined') {
    // 탭을 닫거나 다른 앱으로 넘어갈 때 모아 둔 저장을 바로 보낸다
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') void flush()
    })
  }

  const touchLogin = (userId: string) => {
    void client.from('profiles').update({ last_login_at: new Date().toISOString() }).eq('user_id', userId).then(() => undefined)
  }

  return {
    mode: 'server',

    async restore() {
      const { data } = await client.auth.getSession()
      const user = data.session?.user
      if (!user) return null
      touchLogin(user.id)
      return { userId: user.id, loginId: loginIdOf(user.email) }
    },

    async signUp(rawId, password) {
      const bad = checkLoginId(rawId) ?? checkPassword(password)
      if (bad) return fail(bad)
      const loginId = normalizeLoginId(rawId)
      const { data, error } = await client.auth.signUp({ email: emailOf(loginId), password })
      if (error) return fail(error.code === 'user_already_exists' ? LOGIN_ID_TAKEN : describe(error, `가입하지 못했습니다 (${error.code ?? error.message})`))
      if (!data.session || !data.user) return fail('가입은 됐지만 바로 로그인되지 않았습니다. 운영자에게 알려 주세요 (이메일 확인 설정)')
      return ok({ userId: data.user.id, loginId })
    },

    async signIn(rawId, password) {
      const loginId = normalizeLoginId(rawId)
      if (checkLoginId(loginId)) return fail(SIGN_IN_FAILED)
      const { data, error } = await client.auth.signInWithPassword({ email: emailOf(loginId), password })
      // ID 가 없는지 비밀번호가 틀렸는지 구분하지 않는다 (docs/25 §5)
      if (error || !data.user) return fail(describe(error, SIGN_IN_FAILED))
      touchLogin(data.user.id)
      return ok({ userId: data.user.id, loginId })
    },

    async signOut() {
      await flush()
      await client.auth.signOut()
    },

    async loadSave(s) {
      const { data, error } = await client.from('saves').select('data').eq('user_id', s.userId).maybeSingle()
      // 못 읽었는데 "저장 없음"으로 넘기면 새 게임이 기존 진행을 덮는다 — 반드시 오류로 올린다
      if (error) throw new Error(describe(error, `저장을 불러오지 못했습니다 (${error.code})`))
      return data?.data ?? null
    },

    async writeSave(s, save) {
      pending = { s, save }
      if (timer !== undefined) clearTimeout(timer)
      timer = setTimeout(() => void flush(), SAVE_DELAY_MS)
    },

    flush,

    onSaveStatus(cb) {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },

    async claimTeamName(s, rawName): Promise<AuthResult<string>> {
      const bad = checkTeamName(rawName)
      if (bad) return fail(bad)
      const name = cleanTeamName(rawName)
      const { data, error } = await client.from('profiles').update({ team_name: name }).eq('user_id', s.userId).select('team_name').maybeSingle()
      if (error) return fail(error.code === '23505' ? TEAM_NAME_TAKEN : describe(error, `이름을 정하지 못했습니다 (${error.code})`))
      if (!data) return fail('계정 정보를 찾을 수 없습니다. 운영자에게 알려 주세요 (profiles)')
      return ok(name)
    },
  }
}
