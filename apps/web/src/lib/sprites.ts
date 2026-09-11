// 전투용 리그 스프라이트 로더 (docs/15).
// SVG 를 **인라인**해야 CSS 가 내부 부위(.p-*)를 움직일 수 있다. <img> 로는 안 된다.
// assets/ 는 Vite publicDir 라 import 할 수 없으므로 런타임에 받아서 캐시한다.
// 아직 없는 캐릭터는 null 을 돌려주고, 화면은 기존 원형 엠블럼 아이콘으로 물러선다.
import { useEffect, useState } from 'react'

const cache = new Map<string, string | null>()
const pending = new Map<string, Promise<void>>()

function load(key: string): Promise<void> {
  const inFlight = pending.get(key)
  if (inFlight) return inFlight
  const p = fetch(`${import.meta.env.BASE_URL}units/${key}.svg`)
    .then((r) => (r.ok ? r.text() : null))
    .then((text) => {
      // 우리가 만든 파일만 들어온다. 그래도 SVG 가 아니면 버린다
      cache.set(key, text && text.includes('<svg') ? text : null)
    })
    .catch(() => {
      cache.set(key, null)
    })
    .finally(() => {
      pending.delete(key)
    })
  pending.set(key, p)
  return p
}

/** 있으면 인라인할 SVG 문자열, 없으면 null */
export function useUnitSprite(key: string): string | null {
  const [, bump] = useState(0)
  useEffect(() => {
    if (cache.has(key)) return
    let alive = true
    load(key).then(() => {
      if (alive) bump((n) => n + 1)
    })
    return () => {
      alive = false
    }
  }, [key])
  return cache.get(key) ?? null
}
