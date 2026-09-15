// 지금 쓰는 인증 서비스 하나. B 단계(서버 연결)에서는 이 줄만 서버 구현으로 바꾼다 (docs/25 §7).
import { createLocalAuth } from './localAuth'

export const auth = createLocalAuth(window.localStorage)
export type { AuthService, AuthResult, Session } from './auth'

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
