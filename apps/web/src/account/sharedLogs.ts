// 전투 공유 링크 (docs/26 §5.2). 서버 쪽은 supabase/shared_logs.sql 의 함수 두 개.
import type { BattleRecord } from '../game/save'
import { BATTLE_DATA_VERSION } from '../lib/dataVersion'
import { supabase } from './client'

export interface SharedLog {
  teamName: string | null
  record: BattleRecord
  dataVersion: string
  createdAt: string
  expiresAt: string
}

export type ShareResult = { ok: true; url: string } | { ok: false; error: string }

/** 주소창의 ?log=… — 있으면 공유 전투 보기 화면으로 */
export function sharedLogIdFromUrl(): string | null {
  const id = new URLSearchParams(window.location.search).get('log')
  return id && /^[0-9a-f]{12}$/.test(id) ? id : null
}

export const shareUrl = (id: string): string => `${window.location.origin}${window.location.pathname}?log=${id}`

/** 주소창에서 ?log= 를 지운다 (새로고침 없이) */
export function clearSharedLogFromUrl(): void {
  const url = new URL(window.location.href)
  url.searchParams.delete('log')
  window.history.replaceState(null, '', url.toString())
}

export async function shareRecord(record: BattleRecord): Promise<ShareResult> {
  const { data, error } = await supabase.rpc('share_battle_log', { p_record: record, p_data_version: BATTLE_DATA_VERSION })
  if (error || typeof data !== 'string') {
    if (error?.code === '42501') return { ok: false, error: '로그인해야 공유할 수 있습니다' }
    return { ok: false, error: '링크를 만들지 못했습니다. 잠시 후 다시 시도하세요' }
  }
  return { ok: true, url: shareUrl(data) }
}

/** 없거나 만료되면 null. 연결 오류는 throw */
export async function fetchSharedLog(id: string): Promise<SharedLog | null> {
  const { data, error } = await supabase.rpc('get_shared_log', { p_id: id })
  if (error) throw new Error('공유된 전투를 불러오지 못했습니다. 잠시 후 다시 시도하세요')
  const row = Array.isArray(data) ? data[0] : null
  if (!row) return null
  const r = row.record as BattleRecord
  if (!r || typeof r.seed !== 'number' || !r.player || !r.enemy) return null
  return { teamName: row.team_name, record: r, dataVersion: row.data_version, createdAt: row.created_at, expiresAt: row.expires_at }
}
