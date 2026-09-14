// 테스트용 디버그 스위치 (2026-09-14 단장 요청).
// 배포판에서도 쓰므로 빌드 모드가 아니라 **주소**로 켠다:
//   …/WebRPG/?debug    켜기 — 이 브라우저에 기억된다
//   …/WebRPG/?debug=0  끄기
// 일반 플레이어는 주소에 붙이지 않는 한 볼 일이 없다.
const KEY = 'webrpg.debug'

function readDebug(): boolean {
  try {
    const q = new URLSearchParams(window.location.search)
    if (q.has('debug')) {
      if (q.get('debug') === '0') localStorage.removeItem(KEY)
      else localStorage.setItem(KEY, '1')
    }
    return localStorage.getItem(KEY) === '1'
  } catch {
    return false
  }
}

export const DEBUG = readDebug()
