// 로컬 모드 인증 (docs/25 §7 A 단계). 서버 없이 이 브라우저의 저장소 안에서 계정을 흉내 낸다.
// 진짜 보안 장치가 아니다 — 같은 브라우저를 쓰는 사람은 저장소를 직접 볼 수 있다. 그래도 비밀번호는 원문으로 두지 않고 해시만 둔다.
import { fail, ok, type AuthResult, type AuthService, type Session } from './auth'
import { LOGIN_ID_TAKEN, SIGN_IN_FAILED, TEAM_NAME_TAKEN, checkLoginId, checkPassword, checkTeamName, cleanTeamName, normalizeLoginId, sameTeamName } from './rules'

type KV = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

interface AccountRecord {
  userId: string
  salt: string
  hash: string
  teamName?: string
  createdAt: number
  /** 미접속 정리(docs/25 §8.1)의 기준 — 지금부터 적어 둔다 */
  lastLoginAt: number
}

const ACCOUNTS_KEY = 'webrpg.accounts.v1'
const SESSION_KEY = 'webrpg.session.v1'
const saveKey = (userId: string) => `webrpg.save.v1.${userId}`
const PBKDF2_ROUNDS = 100_000

const hex = (buf: ArrayBuffer | Uint8Array): string => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')

async function hashPassword(password: string, salt: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: new TextEncoder().encode(salt), iterations: PBKDF2_ROUNDS }, key, 256)
  return hex(bits)
}

export function createLocalAuth(store: KV): AuthService {
  const readAccounts = (): Record<string, AccountRecord> => {
    try {
      const raw = store.getItem(ACCOUNTS_KEY)
      return raw ? (JSON.parse(raw) as Record<string, AccountRecord>) : {}
    } catch {
      return {}
    }
  }
  const writeAccounts = (a: Record<string, AccountRecord>) => store.setItem(ACCOUNTS_KEY, JSON.stringify(a))

  const startSession = (loginId: string, accounts: Record<string, AccountRecord>): Session => {
    accounts[loginId].lastLoginAt = Date.now()
    writeAccounts(accounts)
    store.setItem(SESSION_KEY, loginId)
    return { userId: accounts[loginId].userId, loginId }
  }

  return {
    mode: 'local',

    async restore() {
      const loginId = store.getItem(SESSION_KEY)
      if (!loginId) return null
      const accounts = readAccounts()
      if (!accounts[loginId]) {
        store.removeItem(SESSION_KEY)
        return null
      }
      return startSession(loginId, accounts)
    },

    async signUp(rawId, password) {
      const bad = checkLoginId(rawId) ?? checkPassword(password)
      if (bad) return fail(bad)
      const loginId = normalizeLoginId(rawId)
      const accounts = readAccounts()
      if (accounts[loginId]) return fail(LOGIN_ID_TAKEN)
      const salt = hex(crypto.getRandomValues(new Uint8Array(16)))
      const now = Date.now()
      accounts[loginId] = { userId: crypto.randomUUID(), salt, hash: await hashPassword(password, salt), createdAt: now, lastLoginAt: now }
      return ok(startSession(loginId, accounts))
    },

    async signIn(rawId, password) {
      const loginId = normalizeLoginId(rawId)
      const accounts = readAccounts()
      const acc = accounts[loginId]
      // ID 가 없는지 비밀번호가 틀렸는지 구분하지 않는다 (docs/25 §5)
      if (!acc || (await hashPassword(password, acc.salt)) !== acc.hash) return fail(SIGN_IN_FAILED)
      return ok(startSession(loginId, accounts))
    },

    async signOut() {
      store.removeItem(SESSION_KEY)
    },

    async loadSave(s) {
      try {
        const raw = store.getItem(saveKey(s.userId))
        return raw ? (JSON.parse(raw) as unknown) : null
      } catch {
        return null
      }
    },

    async writeSave(s, save) {
      try {
        store.setItem(saveKey(s.userId), JSON.stringify(save))
      } catch {
        /* 용량 초과 등 — 로컬 모드에서는 조용히 넘긴다 */
      }
    },

    // 로컬 저장은 바로 쓰므로 모아 둔 것이 없다
    async flush() {},
    markSynced() {},
    onSaveStatus() {
      return () => {}
    },

    async claimTeamName(s, rawName): Promise<AuthResult<string>> {
      const bad = checkTeamName(rawName)
      if (bad) return fail(bad)
      const name = cleanTeamName(rawName)
      const accounts = readAccounts()
      const taken = Object.entries(accounts).some(([id, a]) => id !== s.loginId && a.teamName && sameTeamName(a.teamName, name))
      if (taken) return fail(TEAM_NAME_TAKEN)
      if (!accounts[s.loginId]) return fail(SIGN_IN_FAILED)
      accounts[s.loginId].teamName = name
      writeAccounts(accounts)
      return ok(name)
    },
  }
}
