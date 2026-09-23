// 계정 입력 규칙 (docs/25 §5, 단장 결정 §8). 화면과 인증 서비스가 같은 규칙을 쓴다 — 서버가 붙어도 여기서 먼저 걸러 준다.

export const LOGIN_ID_MIN = 4
export const LOGIN_ID_MAX = 20
export const PASSWORD_MIN = 8
export const PASSWORD_MAX = 64
export const TEAM_NAME_MAX = 12

/** ID 는 대소문자를 가리지 않는다 — 소문자로 저장한다 */
export const normalizeLoginId = (id: string): string => id.trim().toLowerCase()

/** 틀리면 문구, 맞으면 null */
export function checkLoginId(id: string): string | null {
  const v = id.trim()
  if (!v) return 'ID를 입력하세요'
  if (!/^[0-9a-zA-Z]+$/.test(v) || v.length < LOGIN_ID_MIN || v.length > LOGIN_ID_MAX) return `ID는 영문과 숫자 ${LOGIN_ID_MIN}~${LOGIN_ID_MAX}자입니다`
  return null
}

export function checkPassword(pw: string): string | null {
  if (pw.length < PASSWORD_MIN) return `비밀번호는 ${PASSWORD_MIN}자 이상입니다`
  if (pw.length > PASSWORD_MAX) return `비밀번호는 ${PASSWORD_MAX}자 이하입니다`
  return null
}

export const checkPasswordConfirm = (pw: string, again: string): string | null => (pw === again ? null : '두 비밀번호가 다릅니다')

export const cleanTeamName = (name: string): string => name.replace(/\s+/g, ' ').trim()

export function checkTeamName(name: string): string | null {
  const v = cleanTeamName(name)
  if (!v) return '용병단 이름을 입력하세요'
  if ([...v].length > TEAM_NAME_MAX) return `용병단 이름은 ${TEAM_NAME_MAX}자 이하입니다`
  return null
}

/** 중복 판정 — 공백 · 대소문자만 다른 이름은 같은 이름이다 */
export const sameTeamName = (a: string, b: string): boolean => cleanTeamName(a).replace(/ /g, '').toLowerCase() === cleanTeamName(b).replace(/ /g, '').toLowerCase()

export const SIGN_IN_FAILED = 'ID 또는 비밀번호가 맞지 않습니다'
export const LOGIN_ID_TAKEN = '이미 쓰는 ID입니다'
export const TEAM_NAME_TAKEN = '이미 쓰는 용병단 이름입니다'
