// 계정 규칙과 로컬 인증 (docs/25). 화면 없이 흐름을 고정한다.
import { describe, expect, it } from 'vitest'
import { createLocalAuth } from '../src/account/localAuth'
import { SIGN_IN_FAILED, LOGIN_ID_TAKEN, TEAM_NAME_TAKEN, checkLoginId, checkPassword, checkTeamName, sameTeamName } from '../src/account/rules'

class MemStore {
  private m = new Map<string, string>()
  getItem(k: string) { return this.m.get(k) ?? null }
  setItem(k: string, v: string) { this.m.set(k, v) }
  removeItem(k: string) { this.m.delete(k) }
  dump() { return [...this.m.values()].join('\n') }
}

describe('입력 규칙', () => {
  it('ID 는 영문·숫자 4~20자', () => {
    expect(checkLoginId('abc')).not.toBeNull()
    expect(checkLoginId('abcd')).toBeNull()
    expect(checkLoginId('a'.repeat(20))).toBeNull()
    expect(checkLoginId('a'.repeat(21))).not.toBeNull()
    expect(checkLoginId('한글아이디')).not.toBeNull()
    expect(checkLoginId('ab_cd')).not.toBeNull()
  })
  it('비밀번호 8자 이상', () => {
    expect(checkPassword('1234567')).not.toBeNull()
    expect(checkPassword('12345678')).toBeNull()
  })
  it('용병단 이름 1~12자, 공백·대소문자만 다르면 같은 이름', () => {
    expect(checkTeamName('  ')).not.toBeNull()
    expect(checkTeamName('가'.repeat(12))).toBeNull()
    expect(checkTeamName('가'.repeat(13))).not.toBeNull()
    expect(sameTeamName('붉은 늑대', '붉은늑대')).toBe(true)
    expect(sameTeamName('Red Wolf', 'redwolf')).toBe(true)
  })
})

describe('로컬 인증', () => {
  it('가입 → 로그아웃 → 로그인 → 로그인 유지', async () => {
    const store = new MemStore()
    const auth = createLocalAuth(store)
    const up = await auth.signUp('Hero01', 'password1')
    expect(up.ok).toBe(true)
    if (!up.ok) return
    expect(up.value.loginId).toBe('hero01')
    expect(await auth.restore()).toEqual(up.value)

    await auth.signOut()
    expect(await auth.restore()).toBeNull()

    const bad = await auth.signIn('hero01', 'wrongpass')
    expect(bad).toEqual({ ok: false, error: SIGN_IN_FAILED })
    const none = await auth.signIn('nobody', 'password1')
    expect(none).toEqual({ ok: false, error: SIGN_IN_FAILED })

    const inAgain = await auth.signIn('HERO01', 'password1')
    expect(inAgain.ok && inAgain.value.userId).toBe(up.value.userId)
  })

  it('같은 ID 는 두 번 가입할 수 없다 (대소문자 무시)', async () => {
    const auth = createLocalAuth(new MemStore())
    await auth.signUp('hero01', 'password1')
    expect(await auth.signUp('HERO01', 'password2')).toEqual({ ok: false, error: LOGIN_ID_TAKEN })
  })

  it('비밀번호 원문은 저장소에 남지 않는다', async () => {
    const store = new MemStore()
    await createLocalAuth(store).signUp('hero01', 'supersecret99')
    expect(store.dump()).not.toContain('supersecret99')
  })

  it('저장은 계정마다 따로', async () => {
    const auth = createLocalAuth(new MemStore())
    const a = await auth.signUp('alpha1', 'password1')
    const b = await auth.signUp('bravo1', 'password1')
    if (!a.ok || !b.ok) throw new Error('signup')
    await auth.writeSave(a.value, { gold: 1 })
    expect(await auth.loadSave(a.value)).toEqual({ gold: 1 })
    expect(await auth.loadSave(b.value)).toBeNull()
  })

  it('용병단 이름은 다른 계정과 겹칠 수 없고, 자기 이름은 다시 잡을 수 있다', async () => {
    const auth = createLocalAuth(new MemStore())
    const a = await auth.signUp('alpha1', 'password1')
    const b = await auth.signUp('bravo1', 'password1')
    if (!a.ok || !b.ok) throw new Error('signup')
    expect(await auth.claimTeamName(a.value, '붉은 늑대')).toEqual({ ok: true, value: '붉은 늑대' })
    expect(await auth.claimTeamName(a.value, '붉은 늑대')).toEqual({ ok: true, value: '붉은 늑대' })
    expect(await auth.claimTeamName(b.value, '붉은늑대')).toEqual({ ok: false, error: TEAM_NAME_TAKEN })
    // a 가 이름을 바꾸면 옛 이름이 풀린다
    await auth.claimTeamName(a.value, '푸른 매')
    expect((await auth.claimTeamName(b.value, '붉은 늑대')).ok).toBe(true)
  })
})
