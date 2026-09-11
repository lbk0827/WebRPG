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
const DRAW_H = 60 // y=0..59. 아래 4칸은 그림자/화면 여유

/** docs/15 공통 팔레트. r/R 은 manifest 의 캐릭터 대표색으로 뒤에서 붙인다. */
const BASE_PALETTE = [
  ['k', 0x1d, 0x1d, 0x24],
  ['w', 0xee, 0xf2, 0xf7],
  ['s', 0xcf, 0xd6, 0xe0],
  ['S', 0x8f, 0xa3, 0xb8],
  ['f', 0xe8, 0xc3, 0x9e],
  ['F', 0xc0, 0x8a, 0x5e],
  ['l', 0x8a, 0x75, 0x50],
  ['L', 0x5e, 0x4f, 0x36],
  ['d', 0xc9, 0xc0, 0xad],
]

function hexRgb(hex) {
  if (!/^#[0-9a-f]{6}$/i.test(hex)) throw new Error(`잘못된 대표색: ${hex}`)
  return [1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16))
}

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

/** 배경 안티앨리어싱이 팔레트 색으로 스냅되며 생긴 작은 고립 픽셀을 지운다. */
function removeSpecks(grid, maxSize = 16) {
  const H = grid.length
  const W = grid[0].length
  const seen = Array.from({ length: H }, () => Array(W).fill(false))
  const directions = [-1, 0, 1].flatMap((dy) => [-1, 0, 1].map((dx) => [dx, dy]))
  let removed = 0
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (seen[y][x] || grid[y][x] === '.') continue
      const component = []
      const queue = [[x, y]]
      seen[y][x] = true
      for (let i = 0; i < queue.length; i++) {
        const [qx, qy] = queue[i]
        component.push([qx, qy])
        for (const [dx, dy] of directions) {
          if (dx === 0 && dy === 0) continue
          const nx = qx + dx
          const ny = qy + dy
          if (nx < 0 || nx >= W || ny < 0 || ny >= H || seen[ny][nx] || grid[ny][nx] === '.') continue
          seen[ny][nx] = true
          queue.push([nx, ny])
        }
      }
      if (component.length <= maxSize) {
        for (const [cx, cy] of component) grid[cy][cx] = '.'
        removed += component.length
      }
    }
  }
  return removed
}

// ── 내용 마스크 ───────────────────────────────────────────
/**
 * "그림이 있는 픽셀" 마스크. 3×3 이웃이 전부 그림인 픽셀만 남긴다(침식).
 * 이미지 생성 AI 출력물은 발 아래에 얇은 잡티가 흩어져 있는데, 이게 경계 상자에
 * 들어가면 발이 y=59 위로 떠 버리고 키 예산을 잡아먹는다. 침식하면 얇은 것은 사라진다.
 * 이 마스크는 칸 나누기·경계 상자·발 위치 판정에만 쓰고, 색을 뽑을 때는 원본을 본다.
 */
function contentMask(img, bg) {
  const { width: w, height: h, data } = img
  const raw = new Uint8Array(w * h)
  for (let i = 0; i < w * h; i++) {
    const o = i * 4
    raw[i] = isBg(bg, data[o], data[o + 1], data[o + 2], data[o + 3]) ? 0 : 1
  }
  const mask = new Uint8Array(w * h)
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      let ok = 1
      for (let dy = -1; dy <= 1 && ok; dy++)
        for (let dx = -1; dx <= 1; dx++)
          if (!raw[(y + dy) * w + (x + dx)]) {
            ok = 0
            break
          }
      mask[y * w + x] = ok
    }
  }
  return mask
}

// ── 칸 나누기 ─────────────────────────────────────────────
/**
 * 가로 등분이 아니라 **비어 있는 열**에서 자른다. AI 는 포즈를 균등하게 놓지 않아서
 * 등분하면 옆 포즈의 망토·무기 끝이 이웃 칸으로 넘어온다.
 * 그림이 있는 열의 연속 구간을 찾고, 좁은 틈은 이어 붙인 뒤, 넓은 것 <cols>개를 고른다.
 */
function findCells(mask, w, h, cols) {
  const occupied = new Uint8Array(w)
  for (let x = 0; x < w; x++) {
    for (let y = 0; y < h; y++) {
      if (mask[y * w + x]) {
        occupied[x] = 1
        break
      }
    }
  }
  const runs = []
  let start = -1
  for (let x = 0; x <= w; x++) {
    const on = x < w && occupied[x]
    if (on && start < 0) start = x
    if (!on && start >= 0) {
      runs.push({ x0: start, x1: x - 1 })
      start = -1
    }
  }
  // 한 포즈 안에서 부위가 떨어져 있을 수 있다 (들어 올린 팔, 떨어진 화살촉). 틈이 좁으면 같은 포즈다
  const minGap = Math.max(4, Math.round(w * 0.015))
  const merged = []
  for (const r of runs) {
    const last = merged[merged.length - 1]
    if (last && r.x0 - last.x1 - 1 < minGap) last.x1 = r.x1
    else merged.push({ ...r })
  }
  if (merged.length < cols) {
    console.warn(`빈 열로는 칸이 ${merged.length}개만 나뉜다. 가로 ${cols}등분으로 물러선다`)
    const cw = Math.floor(w / cols)
    return Array.from({ length: cols }, (_, i) => ({ x0: i * cw, x1: (i + 1) * cw - 1 }))
  }
  if (merged.length > cols) {
    // 잡티 덩어리가 남았을 수 있다. 넓은 것부터 <cols>개
    merged.sort((a, b) => b.x1 - b.x0 - (a.x1 - a.x0))
    merged.length = cols
    merged.sort((a, b) => a.x0 - b.x0)
  }
  return merged
}

// ── 칸 하나 → 48×64 격자 ──────────────────────────────────
function cellBounds(mask, w, h, cx0, cx1) {
  let x0 = cx1
  let x1 = cx0
  let y0 = h
  let y1 = -1
  for (let y = 0; y < h; y++) {
    for (let x = cx0; x <= cx1; x++) {
      if (!mask[y * w + x]) continue
      if (x < x0) x0 = x
      if (x > x1) x1 = x
      if (y < y0) y0 = y
      if (y > y1) y1 = y
    }
  }
  if (y1 < 0) return null
  // 발 위치: 상자 아래쪽 12% 줄에 있는 픽셀들의 가로 중심. 뻗은 무기·망토는 여기 없다
  const footTop = y1 - Math.max(1, Math.round((y1 - y0 + 1) * 0.12))
  let sum = 0
  let n = 0
  for (let y = footTop; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      if (mask[y * w + x]) {
        sum += x
        n++
      }
    }
  }
  const feet = n ? sum / n : (x0 + x1) / 2
  // 침식으로 잃은 1픽셀 테두리를 되돌린다
  return { x0: x0 - 1, x1: x1 + 1, y0: y0 - 1, y1: y1 + 1, feet, sw: x1 - x0 + 3, sh: y1 - y0 + 3 }
}

function cellToGrid(img, bg, bounds, scale, origin, gridW) {
  const { x0, y0, sw, sh, feet } = bounds
  const dw = Math.max(1, Math.round(sw / scale))
  const dh = Math.max(1, Math.round(sh / scale))
  // 발의 가로 중심을 상자의 x=24 에 놓는다. 무기가 뻗어도 몸은 제자리다
  const left = origin + CENTER - Math.round((feet - x0) / scale)
  const top = FOOT - dh + 1
  const grid = Array.from({ length: H }, () => Array(gridW).fill('.'))
  for (let dy = 0; dy < dh; dy++) {
    for (let dx = 0; dx < dw; dx++) {
      const gx = left + dx
      const gy = top + dy
      if (gx < 0 || gx >= gridW || gy < 0 || gy >= H) continue
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
  removeSpecks(grid)
  return grid
}

// ── 실행 ──────────────────────────────────────────────────
const [src, key, colsArg] = process.argv.slice(2)
if (!src || !key) {
  console.log('사용: node assets/png-to-px.mjs <시트.png> <키> [칸수=3]')
  process.exit(1)
}
const cols = Number(colsArg || 3)
const manifest = JSON.parse(readFileSync(join(here, 'manifest.json'), 'utf8'))
const entry = manifest.jobs?.[key] || manifest.monsters?.[key]
if (!entry?.color) throw new Error(`manifest.json 에 ${key} 대표색이 없다`)
const representative = hexRgb(entry.color)
const representativeDark = representative.map((v) => Math.round(v * 0.68))
const PALETTE = [
  ...BASE_PALETTE,
  ['r', ...representative],
  ['R', ...representativeDark],
]
const img = decodePng(readFileSync(src))
const bg = backgroundOf(img)
const mask = contentMask(img, bg)
const cells = findCells(mask, img.width, img.height, cols)
const bounds = cells.map((c, i) => {
  const found = cellBounds(mask, img.width, img.height, c.x0, c.x1)
  if (!found) throw new Error(`${i + 1}번째 칸이 비어 있다. 칸수(${cols})가 맞는지 볼 것`)
  return found
})

// 배율은 **키로만** 정한다. 세 포즈가 같은 배율이어야 전환 때 몸이 튀지 않고,
// 캐릭터 열셋이 같은 배율이어야 나란히 섰을 때 키가 맞는다.
// 찌르기처럼 멀리 뻗는 포즈는 48칸 상자를 넘친다. 잘라 내지도, 줄이지도 않는다 —
// 격자를 넓히고 @origin 으로 "상자의 x=0 이 격자 몇 번째 칸인지"를 적어 둔다.
// 화면은 상자(48×64)로 배치하고 그림은 상자 밖까지 그린다 (CSS overflow: visible).
const scale = Math.max(...bounds.map(({ sh }) => sh / DRAW_H))
const reach = bounds.map((b) => ({
  left: Math.ceil((b.feet - b.x0) / scale),
  right: Math.ceil((b.x1 - b.feet) / scale),
}))
const overL = Math.max(0, ...reach.map((r) => r.left - CENTER)) // 상자 왼쪽으로 넘치는 칸
const overR = Math.max(0, ...reach.map((r) => r.right - (W - 1 - CENTER))) // 오른쪽으로
const origin = overL
const gridW = W + overL + overR
const grids = bounds.map((box) => cellToGrid(img, bg, box, scale, origin, gridW))
bounds.forEach((b, i) => {
  const r = reach[i]
  const spill = [r.left > CENTER ? `왼쪽 ${r.left - CENTER}` : '', r.right > W - 1 - CENTER ? `오른쪽 ${r.right - (W - 1 - CENTER)}` : '']
    .filter(Boolean)
    .join(' · ')
  console.log(
    `pose${i}: 원본 ${b.sw}×${b.sh} → 키 ${Math.round(b.sh / scale)}줄, 발에서 왼쪽 ${r.left} · 오른쪽 ${r.right}칸` +
      (spill ? `  (상자 밖으로 ${spill}칸)` : ''),
  )
})
if (gridW > W) console.log(`격자 ${gridW}×${H}, 상자 x=0 은 격자 ${origin}번 칸 (@origin ${origin})`)

const used = new Set()
for (const grid of grids) for (const row of grid) for (const ch of row) if (ch !== '.') used.add(ch)

const lines = []
lines.push(`# ${entry.name || key}`)
lines.push(`# ${src} 에서 node assets/png-to-px.mjs 로 뽑은 초안이다. 손으로 다듬을 것 (docs/16)`)
lines.push('# 48x64 상자. 3/4 반측면. 발바닥 y=59, 발 중심은 상자의 x=24')
lines.push('# pose0 대기 / pose1 치켜듦 / pose2 내리침 — 전신을 통째로 갈아 끼운다')
if (gridW > W) {
  lines.push(`# 뻗은 무기 때문에 격자가 상자보다 넓다 (${gridW}칸). 상자 밖은 화면에서 그대로 삐져나온다`)
}
lines.push('')
lines.push(`@canvas ${W}x${H}`)
lines.push(`@origin ${origin}`)
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
