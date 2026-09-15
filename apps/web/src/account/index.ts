// 지금 쓰는 인증 서비스 하나 (docs/25 §7). A 단계는 로컬 모드(createLocalAuth), B 단계부터 Supabase.
// 로컬 구현은 테스트(test/account.test.ts)와 서버 없이 화면을 볼 때를 위해 남겨 둔다.
import { createSupabaseAuth } from './supabaseAuth'

export const auth = createSupabaseAuth()
export type { AuthService, AuthResult, SaveStatus, Session } from './auth'

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
