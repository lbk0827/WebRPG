// 지금 쓰는 인증 서비스 하나 (docs/25 §7). A 단계는 로컬 모드(createLocalAuth), B 단계부터 Supabase.
// 로컬 구현은 테스트(test/account.test.ts)와 서버 없이 화면을 볼 때를 위해 남겨 둔다.
import { createLocalAuth } from './localAuth'
import { createSupabaseAuth } from './supabaseAuth'
import type { Session } from './auth'

/**
 * 개발 중 로그인 건너뛰기 (단장 요청 2026-09-16).
 * `apps/web/.env.local` 에 `VITE_DEV_LOGIN=1` 을 적으면 서버 대신 **이 브라우저 안의 로컬 계정**을 쓰고,
 * 정해진 개발용 계정으로 알아서 들어간다 — 화면을 볼 때마다 로그인하지 않는다.
 *
 * `import.meta.env.DEV` 가 같이 걸려 있어 **배포 빌드에서는 어떤 값을 넣어도 켜지지 않는다**
 * (vite build 는 DEV 를 false 로 박아 넣고, 이 가지는 통째로 사라진다).
 * .env.local 은 .gitignore 에 있어 저장소에 올라가지 않는다. 예시는 .env.local.example.
 */
export const DEV_LOGIN = import.meta.env.DEV && import.meta.env.VITE_DEV_LOGIN === '1'

export const auth = DEV_LOGIN ? createLocalAuth(localStorage) : createSupabaseAuth()
export type { AuthService, AuthResult, SaveStatus, Session } from './auth'

/** 개발용 계정 — 로컬 모드라 이 브라우저 밖으로 나가지 않는다. 규칙(rules.ts)에 맞는 값이어야 한다 */
const DEV_ID = 'devplay'
const DEV_PW = 'devplay-0000'

/** 개발 중 자동 로그인. 계정이 없으면 만들고 들어간다. 꺼져 있으면 null — 평소 로그인 화면 그대로 */
export async function devSignIn(): Promise<Session | null> {
  if (!DEV_LOGIN) return null
  const signedIn = await auth.signIn(DEV_ID, DEV_PW)
  if (signedIn.ok) return signedIn.value
  const created = await auth.signUp(DEV_ID, DEV_PW)
  return created.ok ? created.value : null
}

const REMEMBER_ID_KEY = 'webrpg.rememberId'

/** "ID 기억하기" — ID 만 기억한다. 비밀번호는 브라우저 저장 기능에 맡긴다 */
export function rememberedId(): string {
  try {
    return localStorage.getItem(REMEMBER_ID_KEY) ?? ''
  } catch {
    return ''
  }
}

export function setRememberedId(id: string | null): void {
  try {
    if (id) localStorage.setItem(REMEMBER_ID_KEY, id)
    else localStorage.removeItem(REMEMBER_ID_KEY)
  } catch {
    /* ignore */
  }
}
