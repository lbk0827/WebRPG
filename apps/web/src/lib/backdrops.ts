// 전투 배경 (docs/23). 지역마다 한 장, 모험마다 한 장 — "JRPG 픽셀 전투 배경".
// 그림은 assets/backdrops/<키>.png (480×360 도트). 전투판 위쪽에 4:3 으로 깔고,
// 단원이 많아 판이 더 길어지면 아래를 바닥색(bottom)으로 이어 붙인다 (styles.css · docs/23 §8).
//
// 그림이 없는 키(새 지역 · 모험을 추가했을 때)는 종이색 그라디언트가 그대로 나온다.
// 없는 파일을 매번 요청하지 않도록 **도착한 키만** BACKDROP_READY 에 적는다 (tools/process-backdrop.py --check 가 파일과 맞춰 본다).
import { ADVENTURES, REGIONS } from '@webrpg/engine'

export const BACKDROP_W = 480
export const BACKDROP_H = 360

/**
 * 도착한 배경.
 * - `top` — 그림 맨 윗줄의 색. 판 둘레를 메울 때 쓴다
 * - `bottom` — 바닥 띠의 대표색. 단원이 많아 판이 그림보다 길어지면 **아래를 이 색으로 이어 붙인다**
 *
 * 둘 다 process-backdrop.py 가 변환할 때 알려 준다. 새 그림이 오면 한 줄 추가한다.
 */
export const BACKDROP_READY: Record<string, { top: string; bottom: string }> = {
  outskirts: { top: '#589fee', bottom: '#c28748' },
  highway: { top: '#e1804a', bottom: '#6b5b4f' },
  fort: { top: '#8194b3', bottom: '#484749' },
  valley: { top: '#7352a5', bottom: '#97592e' },
  goblinCamp: { top: '#424773', bottom: '#523527' },
  webwood: { top: '#878aa5', bottom: '#1b1f29' },
  citadel: { top: '#659ee9', bottom: '#5a5e6c' },
  abyss: { top: '#0b0e19', bottom: '#242f48' },
  frostgate: { top: '#677fa9', bottom: '#acbad9' },
  throne: { top: '#3a383c', bottom: '#67292a' },
  dunes: { top: '#e7bd83', bottom: '#603e2d' },
  sunkenTemple: { top: '#25b8c9', bottom: '#34493b' },
  warfield: { top: '#822d3b', bottom: '#201511' },
  fallenStar: { top: '#111947', bottom: '#131622' },
  colosseum: { top: '#554f70', bottom: '#83472c' },
  catacomb: { top: '#313033', bottom: '#47413f' },
  trial: { top: '#4d9cf7', bottom: '#667048' },
  abyssGate: { top: '#0e1827', bottom: '#262d3d' },
  sandArena: { top: '#459cf9', bottom: '#bb7837' },
  starSummit: { top: '#081c4d', bottom: '#374058' },
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

/** 바닥 이음 조각 — 판이 그림보다 길어졌을 때 아래로 반복해 깐다 (process-backdrop.py --floors 가 그림에서 잘라 만든다) */
export const backdropFloorUrl = (key: string): string => `${import.meta.env.BASE_URL}backdrops/floor/${key}.png`

/** 이 지역 · 모험에서 쓸 배경. 등록된 그림이 없으면 null(그라디언트) */
export function backdropFor(key: string): { key: string; url: string; floor: string; top: string; bottom: string } | null {
  const ready = BACKDROP_READY[key]
  return ready ? { key, url: backdropUrl(key), floor: backdropFloorUrl(key), top: ready.top, bottom: ready.bottom } : null
}
