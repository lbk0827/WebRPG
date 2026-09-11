// 이미지 생성 AI 가 준 PNG 시트 → assets/units/<키>.px (docs/16)
//
// 사용:
//   node assets/png-to-px.mjs <시트.png> <키> [칸수=3]
//   예: node assets/png-to-px.mjs ~/Downloads/rogue.png rogue 3
//
// 하는 일:
//   1. PNG 를 읽는다 (외부 라이브러리 없이. node:zlib 만 쓴다)
//   2. 가로로 <칸수> 등분해 포즈 칸을 나눈다
//   3. 각 칸에서 캐릭터만 잘라내고, 48×64 격자로 최근접 축소한다
//   4. 모든 색을 우리 팔레트 12색 중 가장 가까운 색으로 스냅한다 (안티앨리어싱 제거)
//   5. 발바닥을 y=59, 좌우 중심을 x=24 에 맞춰 세 포즈를 정렬한다
//   6. pose0 / pose1 / pose2 레이어로 .px 를 쓴다
//
// 나온 .px 는 "초안"이다. 사람이 열어서 손으로 고치는 것이 정상이다.
import { readFileSync, writeFileSync } from 'node:fs'
import { inflateSync } from 'node:zlib'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))

const W = 48
const H = 64
const FOOT = 59 // 발바닥이 놓일 줄
const CENTER = 24 // 좌우 중심

/** docs/15 팔레트. 변환기는 여기 있는 색으로만 결과를 낸다 */
const PALETTE = [
  ['k', 0x1d, 0x1d, 0x24],
  ['w', 0xee, 0xf2, 0xf7],
  ['s', 0xcf, 0xd6, 0xe0],
  ['S', 0x8f, 0xa3, 0xb8],
  ['f', 0xe8, 0xc3, 0x9e],
  ['F', 0xc0, 0x8a, 0x5e],
  ['r', 0xb2, 0x3a, 0x48],
  ['R', 0x7d, 0x26, 0x32],
  ['l', 0x8a, 0x75, 0x50],
  ['L', 0x5e, 0x4f, 0x36],
  ['d', 0xc9, 0xc0, 0xad],
]

// ── PNG 디코드 ────────────────────────────────────────────
function decodePng(buf) {
  if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error('PNG 가 아니다')
  let pos = 8
  let width = 0
  let height = 0
  let depth = 0
  let colorType = 0
  let palette = null
  let trns = null
  const idat = []
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos)
    const type = buf.toString('ascii', pos + 4, pos + 8)
    const data = buf.subarray(pos + 8, pos + 8 + len)
    if (type === 'IHDR') {
      width = data.readUInt32BE(0)
      height = data.readUInt32BE(4)
      depth = data[8]
      colorType = data[9]
      if (data[12] !== 0) throw new Error('인터레이스 PNG 는 지원하지 않는다. 다시 저장할 것')
    } else if (type === 'PLTE') palette = Buffer.from(data)
    else if (type === 'tRNS') trns = Buffer.from(data)
    else if (type === 'IDAT') idat.push(Buffer.from(data))
    else if (type === 'IEND') break
    pos += 12 + len
  }
  if (depth !== 8) throw new Error(`채널당 ${depth}비트는 지원하지 않는다. 8비트 PNG 로 다시 저장할 것`)
  const channels = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[colorType]
  if (!channels) throw new Error(`PNG 색 방식 ${colorType} 은 지원하지 않는다`)
  const raw = inflateSync(Buffer.concat(idat))
  const stride = width * channels
  const out = Buffer.alloc(width * height * 4)
  const prev = Buffer.alloc(stride)
  const cur = Buffer.alloc(stride)
  let rp = 0
  for (let y = 0; y < height; y++) {
    const filter = raw[rp++]
    raw.copy(cur, 0, rp, rp + stride)
    rp += stride
    for (let i = 0; i < stride; i++) {
      const a = i >= channels ? cur[i - channels] : 0
      const b = prev[i]
      const c = i >= channels ? prev[i - channels] : 0
      let v = cur[i]
      if (filter === 1) v += a
      else if (filter === 2) v += b
      else if (filter === 3) v += (a + b) >> 1
      else if (filter === 4) {
        const p = a + b - c
        const pa = Math.abs(p - a)
        const pb = Math.abs(p - b)
        const pc = Math.abs(p - c)
        v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c
      }
      cur[i] = v & 0xff
    }
    for (let x = 0; x < width; x++) {
      const o = (y * width + x) * 4
      const i = x * channels
      if (colorType === 0) {
        out[o] = out[o + 1] = out[o + 2] = cur[i]
        out[o + 3] = 255
      } else if (colorType === 4) {
        out[o] = out[o + 1] = out[o + 2] = cur[i]
        out[o + 3] = cur[i + 1]
      } else if (colorType === 2) {
        out[o] = cur[i]
        out[o + 1] = cur[i + 1]
        out[o + 2] = cur[i + 2]
        out[o + 3] = 255
      } else if (colorType === 6) {
        out[o] = cur[i]
        out[o + 1] = cur[i + 1]
        out[o + 2] = cur[i + 2]
        out[o + 3] = cur[i + 3]
      } else {
        const idx = cur[i]
        out[o] = palette[idx * 3]
        out[o + 1] = palette[idx * 3 + 1]
        out[o + 2] = palette[idx * 3 + 2]
        out[o + 3] = trns && idx < trns.length ? trns[idx] : 255
      }
    }
    cur.copy(prev)
  }
  return { width, height, data: out }
}

// ── 배경 판정 ─────────────────────────────────────────────
/** 알파가 없는 시트는 네 모서리 색을 배경으로 본다 (마젠타·흰색 등) */
function backgroundOf(img) {
  let opaque = 0
  for (let i = 3; i < img.data.length; i += 4) if (img.data[i] > 200) opaque++
  if (opaque < img.width * img.height * 0.98) return null // 알파가 이미 있다
  const corners = [
    [0, 0],
    [img.width - 1, 0],
    [0, img.height - 1],
    [img.width - 1, img.height - 1],
  ]
  const [x, y] = corners[0]
  const o = (y * img.width + x) * 4
  return [img.data[o], img.data[o + 1], img.data[o + 2]]
}

const isBg = (bg, r, g, b, a) => {
  if (a < 128) return true
  if (!bg) return false
  return Math.abs(r - bg[0]) + Math.abs(g - bg[1]) + Math.abs(b - bg[2]) < 60
}

function nearest(r, g, b) {
  let best = PALETTE[0]
  let bd = Infinity
  for (const p of PALETTE) {
    // 사람 눈은 초록에 민감하다. 가중 제곱거리
    const d = 2 * (r - p[1]) ** 2 + 4 * (g - p[2]) ** 2 + 3 * (b - p[3]) ** 2
    if (d < bd) {
      bd = d
      best = p
    }
  }
  return best[0]
}

// ── 칸 하나 → 48×64 격자 ──────────────────────────────────
function cellToGrid(img, bg, cx0, cx1) {
  // 1. 캐릭터가 차지한 범위를 찾는다
  let x0 = cx1
  let x1 = cx0
  let y0 = img.height
  let y1 = -1
  for (let y = 0; y < img.height; y++) {
    for (let x = cx0; x < cx1; x++) {
      const o = (y * img.width + x) * 4
      if (isBg(bg, img.data[o], img.data[o + 1], img.data[o + 2], img.data[o + 3])) continue
      if (x < x0) x0 = x
      if (x > x1) x1 = x
      if (y < y0) y0 = y
      if (y > y1) y1 = y
    }
  }
  if (y1 < 0) return null
  const sw = x1 - x0 + 1
  const sh = y1 - y0 + 1
  // 2. 세로를 기준으로 축소 배율을 정한다 — 키가 규격을 벗어나지 않게
  const target = FOOT + 1 // 발바닥까지 60줄
  const scale = Math.max(sw / W, sh / target)
  const dw = Math.max(1, Math.round(sw / scale))
  const dh = Math.max(1, Math.round(sh / scale))
  const left = CENTER - Math.round(dw / 2)
  const top = FOOT - dh + 1
  const grid = Array.from({ length: H }, () => Array(W).fill('.'))
  for (let dy = 0; dy < dh; dy++) {
    for (let dx = 0; dx < dw; dx++) {
      const gx = left + dx
      const gy = top + dy
      if (gx < 0 || gx >= W || gy < 0 || gy >= H) continue
      // 원본의 해당 블록에서 가장 많이 나온 색을 고른다 (최근접보다 덜 튄다)
      const rx = Math.floor((dx * sw) / dw)
      const ry = Math.floor((dy * sh) / dh)
      const bx0 = x0 + rx
      const bx1 = x0 + Math.max(rx + 1, Math.floor(((dx + 1) * sw) / dw))
      const by0 = y0 + ry
      const by1 = y0 + Math.max(ry + 1, Math.floor(((dy + 1) * sh) / dh))
      const tally = new Map()
      let bgCount = 0
      let total = 0
      for (let y = by0; y < by1 && y < img.height; y++) {
        for (let x = bx0; x < bx1 && x < img.width; x++) {
          const o = (y * img.width + x) * 4
          total++
          if (isBg(bg, img.data[o], img.data[o + 1], img.data[o + 2], img.data[o + 3])) {
            bgCount++
            continue
          }
          const ch = nearest(img.data[o], img.data[o + 1], img.data[o + 2])
          tally.set(ch, (tally.get(ch) || 0) + 1)
        }
      }
      if (!total || bgCount > total / 2) continue
      let best = '.'
      let bn = 0
      for (const [ch, n] of tally) if (n > bn) [best, bn] = [ch, n]
      grid[gy][gx] = best
    }
  }
  return grid
}

// ── 실행 ──────────────────────────────────────────────────
const [src, key, colsArg] = process.argv.slice(2)
if (!src || !key) {
  console.log('사용: node assets/png-to-px.mjs <시트.png> <키> [칸수=3]')
  process.exit(1)
}
const cols = Number(colsArg || 3)
const img = decodePng(readFileSync(src))
const bg = backgroundOf(img)
const cellW = Math.floor(img.width / cols)
const grids = []
for (let i = 0; i < cols; i++) {
  const grid = cellToGrid(img, bg, i * cellW, (i + 1) * cellW)
  if (!grid) throw new Error(`${i + 1}번째 칸이 비어 있다. 칸수(${cols})가 맞는지 볼 것`)
  grids.push(grid)
}

const used = new Set()
for (const grid of grids) for (const row of grid) for (const ch of row) if (ch !== '.') used.add(ch)

const lines = []
lines.push(`# ${key}`)
lines.push(`# ${src} 에서 node assets/png-to-px.mjs 로 뽑은 초안이다. 손으로 다듬을 것 (docs/16)`)
lines.push('# 48x64 도트. 3/4 반측면. 발바닥 y=59, 좌우 중심 x=24')
lines.push('# pose0 대기 / pose1 치켜듦 / pose2 내리침 — 전신을 통째로 갈아 끼운다')
lines.push('')
lines.push('@palette')
lines.push('. none')
for (const [ch, r, g, b] of PALETTE) {
  if (used.has(ch)) {
    lines.push(`${ch} #${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`)
  }
}
grids.forEach((grid, i) => {
  lines.push('')
  lines.push(`@layer pose${i}`)
  for (const row of grid) lines.push(row.join(''))
})
const out = join(here, 'units', `${key}.px`)
writeFileSync(out, lines.join('\n') + '\n', 'utf8')
console.log(`${out}  칸 ${cols}개  색 ${used.size}종`)
console.log('다음: node assets/build-units.mjs')
