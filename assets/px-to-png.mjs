// assets/units/<키>.px → PNG 시트 (포즈를 가로로 나란히)
//
// 사용:
//   node assets/px-to-png.mjs <키> [배율=10]
//   예: node assets/px-to-png.mjs warrior 10
//
// 쓰는 데:
//   · 이미지 생성 AI 에게 "이 화풍에 맞춰 달라"고 올리는 레퍼런스 (docs/16 §0)
//     — 이 그림은 우리가 그린 것이므로 올려도 저작권 문제가 없다
//   · 주문할 시트 구성(가로 3칸)을 그대로 보여 준다
//   · 눈으로 크게 확대해 보며 다듬을 때
//
// 외부 라이브러리를 쓰지 않는다. node:zlib 로 PNG 를 직접 굽는다.
import { readFileSync, writeFileSync } from 'node:fs'
import { deflateSync } from 'node:zlib'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))

/** 겹쳐 그릴 순서. 앞의 것이 뒤에 깔린다 */
const BASE = ['shadow', 'arm-back', 'body', 'head']
const POSE_SETS = [
  ['arm0', 'arm1', 'arm2'],
  ['pose0', 'pose1', 'pose2'],
]

function parse(text) {
  const palette = new Map([['.', null]])
  const layers = new Map()
  let mode = null
  let cur = null
  let width = 0
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.replace(/\s+$/, '')
    if (!line || line.startsWith('#')) continue
    if (line.startsWith('@palette')) {
      mode = 'palette'
      continue
    }
    if (line.startsWith('@layer')) {
      mode = 'layer'
      cur = []
      layers.set(line.slice(6).trim(), cur)
      continue
    }
    if (mode === 'palette') {
      const color = line.slice(1).trim()
      palette.set(line[0], color === 'none' || color === '-' ? null : color)
    } else if (mode === 'layer') {
      cur.push(line)
      width = Math.max(width, line.length)
    }
  }
  const height = Math.max(...[...layers.values()].map((r) => r.length))
  return { palette, layers, width, height }
}

const hex = (c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16))

function crc(buf) {
  const tbl = []
  for (let n = 0; n < 256; n++) {
    let v = n
    for (let k = 0; k < 8; k++) v = v & 1 ? 0xedb88320 ^ (v >>> 1) : v >>> 1
    tbl[n] = v >>> 0
  }
  let c = ~0
  for (const b of buf) c = tbl[(c ^ b) & 0xff] ^ (c >>> 8)
  return (~c) >>> 0
}

function chunk(type, data) {
  const out = Buffer.alloc(12 + data.length)
  out.writeUInt32BE(data.length, 0)
  out.write(type, 4, 'ascii')
  data.copy(out, 8)
  out.writeUInt32BE(crc(out.subarray(4, 8 + data.length)), 8 + data.length)
  return out
}

function encodePng(width, height, rgba) {
  const raw = Buffer.alloc(height * (width * 4 + 1))
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0
    rgba.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4)
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8
  ihdr[9] = 6
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

const [key, scaleArg] = process.argv.slice(2)
if (!key) {
  console.log('사용: node assets/px-to-png.mjs <키> [배율=10]')
  process.exit(1)
}
const scale = Number(scaleArg || 10)
const src = parse(readFileSync(join(here, 'units', `${key}.px`), 'utf8'))
const poses = POSE_SETS.find((set) => src.layers.has(set[0]))
if (!poses) throw new Error('arm0 도 pose0 도 없다 — 포즈 레이어가 있어야 시트를 만든다')

const cells = poses.filter((n) => src.layers.has(n))
const gap = 4
const cw = src.width + gap
const W = cw * cells.length - gap
const H = src.height
const flat = Array.from({ length: H }, () => Array(W).fill(null))

cells.forEach((pose, i) => {
  const ox = i * cw
  for (const name of [...BASE, pose]) {
    const rows = src.layers.get(name)
    if (!rows) continue
    rows.forEach((row, y) => {
      for (let x = 0; x < row.length; x++) {
        const color = src.palette.get(row[x])
        if (color) flat[y][ox + x] = color
      }
    })
  }
})

const rgba = Buffer.alloc(W * scale * H * scale * 4)
for (let y = 0; y < H * scale; y++) {
  for (let x = 0; x < W * scale; x++) {
    const color = flat[(y / scale) | 0][(x / scale) | 0]
    if (!color) continue
    const [r, g, b] = hex(color)
    const o = (y * W * scale + x) * 4
    rgba[o] = r
    rgba[o + 1] = g
    rgba[o + 2] = b
    rgba[o + 3] = 255
  }
}

const out = join(here, 'units', `${key}-sheet.png`)
writeFileSync(out, encodePng(W * scale, H * scale, rgba))
console.log(`${out}  ${W * scale}×${H * scale}  칸 ${cells.length}개 (배율 ${scale})`)
