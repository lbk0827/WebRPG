// 48×64 길드원(여) 머리 · 얼굴 손픽셀 보정.
// separate-hair-guildmember-female.py → png-to-px.mjs 뒤에만 실행한다. 좌표를 직접 지정하므로 재실행해도 동일하다.
//
// 2026-09-14: 금발과 피부를 원본에서 떼어 낸 변환(hairsep)에 맞춰 다시 짰다.
// 이전 좌표(Codex 1 · 2차)는 머리와 얼굴이 한 덩어리였던 변환 기준이라 눈이 머리칼 위에 찍혔다.
import { readFileSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const path = join(root, 'assets', 'units', 'guildMember-female.px')
const lines = readFileSync(path, 'utf8').split(/\r?\n/)
const layers = new Map()
let current = null
for (let i = 0; i < lines.length; i++) {
  if (lines[i].startsWith('@layer ')) current = lines[i].slice(7)
  else if (current && /^[.A-Za-z]+$/.test(lines[i])) {
    if (!layers.has(current)) layers.set(current, [])
    layers.get(current).push(i)
  }
}

const get = (layer, x, y) => lines[layers.get(layer)[y]]?.[x] ?? '.'
function set(layer, x, y, value) {
  const i = layers.get(layer)[y]
  const row = [...lines[i]]
  row[x] = value
  lines[i] = row.join('')
}

const HAIR = 'hmH'
const HEAD_ROWS = [8, 34] // 머리가 있는 줄. 갑옷 · 칼의 흰색은 이 밖이거나 머리색 이웃이 없다

// 1. 금발 안의 고립점 — 네 이웃 중 셋 이상이 머리색인 칸만 고친다 (외곽선 · 눈은 이웃이 머리색이 아니다)
//    검정 → 머리 중간색 m (결의 그림자로 남는다), 흰색 · 은색 → 머리 밝은색 H (하이라이트가 흰색으로 스냅된 것)
let specks = 0
for (const layer of layers.keys()) {
  const fixes = []
  for (let y = HEAD_ROWS[0]; y < HEAD_ROWS[1]; y++) {
    for (let x = 0; x < lines[layers.get(layer)[y]].length; x++) {
      const c = get(layer, x, y)
      if (!'kws'.includes(c)) continue
      const hair = [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]].filter(([nx, ny]) => HAIR.includes(get(layer, nx, ny))).length
      if (hair >= 3) fixes.push([x, y, c === 'k' ? 'm' : 'H'])
    }
  }
  for (const [x, y, c] of fixes) set(layer, x, y, c)
  specks += fixes.length
}

// 2. 눈: 2×2 (왼쪽 위 반사 w + 검정 셋), 입: 눈 오른쪽 아래 그림자 한 칸
const EYES = [
  ['pose0', 31, 24],
  ['pose2', 31, 28],
  // pose1 은 변환 그대로 눈이 읽힌다
]
for (const [layer, x, y] of EYES) {
  set(layer, x, y, 'w')
  set(layer, x + 1, y, 'k')
  set(layer, x, y + 1, 'k')
  set(layer, x + 1, y + 1, 'k')
  set(layer, x + 1, y + 3, 'F')
}
// pose0: 이마에 가로로 번진 검은 띠(선글라스처럼 보였다)를 살로 되돌리고, 먼 쪽 눈은 한 칸
set('pose0', 29, 24, 'f')
set('pose0', 30, 24, 'f')
set('pose0', 28, 25, 'k')

writeFileSync(path, `${lines.join('\n')}\n`, 'utf8')
console.log(`guildMember-female.px 보정 — 머리 고립점 ${specks}칸, 눈 ${EYES.length + 1}곳`)
