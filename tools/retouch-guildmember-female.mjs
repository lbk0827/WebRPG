// 48×64 길드원(여) 얼굴/머리 경계 손픽셀 보정.
// 자동 변환 뒤에만 실행한다. 좌표를 직접 지정하므로 재실행해도 동일하다.
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

function pixel(layer, x, y, value) {
  const lineIndex = layers.get(layer)[y]
  const row = [...lines[lineIndex]]
  row[x] = value
  lines[lineIndex] = row.join('')
}

// 눈은 2×2 덩어리+한 칸 반사, 입은 피부 그림자 한 칸으로 통일한다.
const faces = [
  ['pose0', 36, 22],
  ['pose1', 39, 23],
  ['pose2', 38, 24],
]
for (const [layer, x, y] of faces) {
  pixel(layer, x, y, 'w')
  pixel(layer, x + 1, y, 'k')
  pixel(layer, x, y + 1, 'k')
  pixel(layer, x + 1, y + 1, 'k')
  pixel(layer, x + 1, y + 3, 'F')
}

// 얼굴과 금발 사이 경계를 한 줄로 되살리고, 관자놀이에는 밝은 머리 한 칸.
for (const [layer, x, y] of [['pose0', 34, 20], ['pose1', 37, 21], ['pose2', 36, 22]]) {
  pixel(layer, x, y, 'k')
  pixel(layer, x - 1, y, 'H')
  pixel(layer, x, y + 1, 'F')
}

writeFileSync(path, `${lines.join('\n')}\n`, 'utf8')
console.log('guildMember-female.px 얼굴·머리 경계 손픽셀 보정 완료')
