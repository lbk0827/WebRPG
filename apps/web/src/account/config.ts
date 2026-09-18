// Supabase 연결 값 (docs/25 B 단계).
// 둘 다 **공개 값**이다 — 웹페이지 코드에 들어가 누구나 볼 수 있고, 실제 보호는 DB 의 권한 · 행 보안(supabase/schema.sql)이 한다.
// secret key(sb_secret_…) · service_role 키 · DB 비밀번호는 절대 여기에 두지 않는다.
export const SUPABASE_URL = 'https://tquraztwqospjuaiukfn.supabase.co'
export const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_ycetvUpsb1QvRcAwjDoT5g_Y_k8OsvQ'

/**
 * ID → 로그인용 이메일. 우리는 이메일을 받지 않고 메일도 보내지 않는다 (대시보드에서 Confirm email 끔).
 * example.com 은 실제 메일이 갈 수 없는 예약 도메인이라, 혹시 메일이 나가도 남에게 닿지 않는다.
 * (.invalid · .local 은 Supabase 가 형식 오류로 거절한다 — 2026-09-16 확인)
 * 바꾸면 기존 계정이 로그인할 수 없다.
 */
export const LOGIN_EMAIL_DOMAIN = 'example.com'
