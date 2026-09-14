// 전투 배경 (docs/23). 지역마다 한 장, 모험마다 한 장 — "JRPG 픽셀 전투 배경".
// 그림은 assets/backdrops/<키>.png (480×360 도트). 폰 1배 · 데스크톱 2배, 판의 아래 가운데에 맞춘다.
//
// 그림이 도착하기 전에는 지금의 종이색 그라디언트가 그대로 나온다 — 캐릭터 도트처럼 한 장씩 갈아 끼운다.
// 없는 파일을 매번 요청하지 않도록 **도착한 키만** BACKDROP_READY 에 적는다 (tools/process-backdrop.py --check 가 파일과 맞춰 본다).
import { ADVENTURES, REGIONS } from '@webrpg/engine'

export const BACKDROP_W = 480
export const BACKDROP_H = 360

/**
 * 도착한 배경. `top` 은 그림 맨 윗줄의 색 — 판이 그림보다 키가 크면(단원이 많을 때) 위쪽을 이 색으로 채운다.
 * process-backdrop.py 가 변환할 때 알려 준다. 새 그림이 오면 한 줄 추가한다.
 */
export const BACKDROP_READY: Record<string, { top: string }> = {
  outskirts: { top: '#589fee' },
  highway: { top: '#e1804a' },
  fort: { top: '#8194b3' },
  valley: { top: '#7352a5' },
  goblinCamp: { top: '#424773' },
  webwood: { top: '#878aa5' },
  citadel: { top: '#659ee9' },
  abyss: { top: '#0b0e19' },
  frostgate: { top: '#677fa9' },
  throne: { top: '#3a383c' },
  dunes: { top: '#e7bd83' },
  sunkenTemple: { top: '#25b8c9' },
  warfield: { top: '#822d3b' },
  fallenStar: { top: '#111947' },
  colosseum: { top: '#554f70' },
  catacomb: { top: '#313033' },
  trial: { top: '#4d9cf7' },
  abyssGate: { top: '#0e1827' },
  sandArena: { top: '#459cf9' },
  starSummit: { top: '#081c4d' },
}

/** 모험은 제 그림이 오기 전까지 가까운 지역의 그림을 빌린다 */
export const ADVENTURE_BACKDROP_FALLBACK: Record<string, string> = {
  colosseum: 'goblinCamp',
  catacomb: 'abyss',
  trial: 'citadel',
  abyssGate: 'abyss',
  sandArena: 'dunes',
  starSummit: 'fallenStar',
}

export interface BackdropDef {
  key: string
  name: string
  kind: 'region' | 'adventure'
  /** 목록 표시용 번호 — 지역 번호, 모험은 모험 번호 */
  no: number
}

/** 배경 키 전부 — 지역 id 와 모험 id 를 그대로 쓴다 (둘은 겹치지 않는다) */
export const BACKDROP_KEYS: BackdropDef[] = [
  ...REGIONS.map((r) => ({ key: r.id, name: r.name, kind: 'region' as const, no: r.no })),
  ...ADVENTURES.map((a) => ({ key: a.id, name: a.name, kind: 'adventure' as const, no: a.no })),
]

export const backdropUrl = (key: string): string => `${import.meta.env.BASE_URL}backdrops/${key}.png`

/** 이 지역 · 모험에서 쓸 배경. 제 그림 → 빌린 그림 → 없음(그라디언트) */
export function backdropFor(key: string): { key: string; url: string; top: string } | null {
  for (const k of [key, ADVENTURE_BACKDROP_FALLBACK[key]]) {
    if (k && BACKDROP_READY[k]) return { key: k, url: backdropUrl(k), top: BACKDROP_READY[k].top }
  }
  return null
}
