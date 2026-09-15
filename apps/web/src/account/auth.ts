// 인증 서비스 (docs/25 §7). 화면은 이 인터페이스만 부른다.
// A 단계: 로컬 모드(localAuth) — 이 브라우저 안에서만 계정을 흉내 낸다.
// B 단계: 같은 인터페이스의 서버 구현으로 바꾼다. 화면은 거의 그대로다.

export interface Session {
  /** 바뀌지 않는 내부 id — 저장 데이터가 여기 묶인다 */
  userId: string
  /** 사람이 치는 ID (소문자) */
  loginId: string
}

export type AuthResult<T = Session> = { ok: true; value: T } | { ok: false; error: string }

/** 서버 저장 상태 — 상태줄에 보여 준다 (docs/25 §6) */
export type SaveStatus = 'saved' | 'saving' | 'error'

export interface AuthService {
  readonly mode: 'local' | 'server'
  /** 로그인 유지 — 창을 다시 열었을 때 이어서 */
  restore(): Promise<Session | null>
  signUp(loginId: string, password: string): Promise<AuthResult>
  signIn(loginId: string, password: string): Promise<AuthResult>
  signOut(): Promise<void>
  /** 계정의 저장 JSON. 없으면 null — 모양 검사(migrate)는 부르는 쪽이 한다. 못 읽으면 throw (null 로 넘기면 새 게임이 진행을 덮는다) */
  loadSave(s: Session): Promise<unknown | null>
  /** 서버 구현은 몇 초 모아서 보낸다. 바로 보내야 하면 flush */
  writeSave(s: Session, save: unknown): Promise<void>
  flush(): Promise<void>
  /** 저장 상태 구독. 돌려준 함수를 부르면 해제 */
  onSaveStatus(cb: (s: SaveStatus) => void): () => void
  /** 용병단 이름을 이 계정 것으로 잡는다. 다른 계정이 쓰고 있으면 실패 (단장 결정: 중복 불가) */
  claimTeamName(s: Session, name: string): Promise<AuthResult<string>>
}

export const ok = <T>(value: T): AuthResult<T> => ({ ok: true, value })
export const fail = <T = Session>(error: string): AuthResult<T> => ({ ok: false, error })
