// Supabase 연결 하나 — 인증 · 저장(supabaseAuth)과 공유 링크(sharedLogs)가 같이 쓴다. 로그인 상태도 이 연결이 들고 있다.
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from './config'

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, storageKey: 'webrpg.supabase.auth' },
})
