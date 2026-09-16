// 전투 데이터 버전 (docs/26 §5.2). 공유 링크는 시드로 전투를 다시 계산하므로, 스킬 · 상태 · 특성 · 전투 설정이 바뀌면 결과가 달라질 수 있다.
// 손으로 올리는 번호 대신 그 데이터의 해시를 쓴다 — 밸런스를 고치면 저절로 바뀐다.
// 한계: 엔진 코드(계산 방식)만 바뀌고 데이터는 그대로면 잡지 못한다.
import { DEFAULT_CONFIG, SKILLS, STATUS_DEFS, TRAITS } from '@webrpg/engine'

/** FNV-1a 32비트 — 보안용이 아니라 "같은가"만 본다 */
function fnv1a(text: string): string {
  let h = 0x811c9dc5
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return (h >>> 0).toString(16).padStart(8, '0')
}

export const BATTLE_DATA_VERSION = fnv1a(JSON.stringify([DEFAULT_CONFIG, SKILLS, STATUS_DEFS, TRAITS]))
