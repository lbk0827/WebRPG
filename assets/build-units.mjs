// 도트 스프라이트 빌드: assets/units/*.px (문자 격자) → assets/units/*.svg
// 사용: node assets/build-units.mjs
//
// 왜 문자 격자인가:
//  · 사람도 에이전트도 픽셀을 한 칸씩 눈으로 보며 쓸 수 있다
//  · git diff 에 "어느 픽셀이 바뀌었는지" 가 그대로 보인다
//  · 색을 팔레트 한 줄만 고치면 전부 바뀐다
// SVG 로 굽는 이유: 확대해도 깨지지 않고(shape-rendering=crispEdges), CSS 가 부위를 움직일 수 있다.
import { readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { dirname, join, basename } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const dir = join(here, 'units')

/** 레이어 이름 → SVG 구조. 이 구조는 고정이다 (styles.css 가 이 클래스를 찾는다) */
// 두 가지 방식을 모두 받는다:
//  (가) 부위 분리  — 손으로 그릴 때. arm0/1/2 만 갈아 끼우고 몸통은 하나다
//  (나) 전신 포즈  — 이미지 생성 AI 에게 맡길 때. 포즈마다 전신을 한 장씩 받는다
//                   (AI 에게 부위를 나눠 그리게 하면 정렬이 안 맞는다. docs/16 참조)
const LAYERS = ['shadow', 'arm-back', 'body', 'head', 'arm0', 'arm1', 'arm2', 'pose0', 'pose1', 'pose2']

function parse(text) {
  const palette = new Map()
  const layers = new Map()
  let mode = null
  let cur = null
  let width = 0
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.replace(/\s+$/, '')
    if (!line || line.startsWith('#')) continue
    if (line.startsWith('@palette')) { mode = 'palette'; continue }
    if (line.startsWith('@layer')) {
      const name = line.slice(6).trim()
      if (!LAYERS.includes(name)) throw new Error(`알 수 없는 레이어: ${name} (${LAYERS.join(', ')} 중 하나여야 한다)`)
      mode = 'layer'
      cur = []
      layers.set(name, cur)
      continue
    }
    if (mode === 'palette') {
      const ch = line[0]
      const color = line.slice(1).trim()
      palette.set(ch, color === 'none' || color === '-' ? null : color)
      continue
    }
    if (mode === 'layer') {
      cur.push(line)
      width = Math.max(width, line.length)
    }
  }
  return { palette, layers, width }
}

/** 격자 → rect 목록. 가로로 이어 붙이고, 같은 줄이 세로로 반복되면 다시 합친다 */
function toRects(rows, palette) {
  const runs = [] // {x, y, w, color}
  rows.forEach((row, y) => {
    let x = 0
    while (x < row.length) {
      const ch = row[x]
      const color = palette.has(ch) ? palette.get(ch) : null
      if (!color) { x++; continue }
      let w = 1
      while (x + w < row.length && row[x + w] === ch) w++
      runs.push({ x, y, w, color })
      x += w
    }
  })
  // 세로 병합
  const out = []
  const used = new Set()
  for (let i = 0; i < runs.length; i++) {
    if (used.has(i)) continue
    const r = { ...runs[i], h: 1 }
    for (let j = i + 1; j < runs.length; j++) {
      if (used.has(j)) continue
      const s = runs[j]
      if (s.y === r.y + r.h && s.x === r.x && s.w === r.w && s.color === r.color) {
        r.h++
        used.add(j)
      }
    }
    out.push(r)
  }
  return out
}

const rectsXml = (rects, indent) =>
  rects
    .map((r) => `${indent}<rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" fill="${r.color}"/>`)
    .join('\n')

function build(file) {
  const src = readFileSync(join(dir, file), 'utf8')
  const { palette, layers, width } = parse(src)
  const title = (src.match(/^#\s*(.+)$/m) || [, basename(file, '.px')])[1].trim()
  const height = Math.max(...[...layers.values()].map((r) => r.length))
  const R = (name, indent) => (layers.has(name) ? rectsXml(toRects(layers.get(name), palette), indent) : '')

  const head = R('head', '      ')
  const parts = []
  if (layers.has('shadow')) parts.push(`  <g class="p-shadow">\n${R('shadow', '    ')}\n  </g>`)
  if (layers.has('arm-back')) parts.push(`  <g class="p-arm-back">\n${R('arm-back', '    ')}\n  </g>`)
  if (layers.has('body') || head) {
    parts.push(
      `  <g class="p-torso">\n${R('body', '    ')}` +
        (head ? `\n    <g class="p-head">\n${head}\n    </g>` : '') +
        `\n  </g>`,
    )
  }
  const poses = ['arm0', 'arm1', 'arm2'].filter((n) => layers.has(n))
  if (poses.length) {
    const inner = poses
      .map((n, i) => `    <g class="f f${i}">\n${R(n, '      ')}\n    </g>`)
      .join('\n')
    parts.push(`  <g class="p-arm-front">\n${inner}\n  </g>`)
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" shape-rendering="crispEdges">
  <title>${title}</title>
  <!-- assets/units/${file} 에서 생성됨. 이 파일을 직접 고치지 말 것 — .px 를 고치고 node assets/build-units.mjs -->
${parts.join('\n')}
</svg>
`
  const outName = basename(file, '.px') + '.svg'
  writeFileSync(join(dir, outName), svg, 'utf8')
  const rectCount = (svg.match(/<rect/g) || []).length
  return `${outName}  ${width}×${height}  rect ${rectCount}  ${(svg.length / 1024).toFixed(1)}KB`
}

const files = readdirSync(dir).filter((f) => f.endsWith('.px'))
if (files.length === 0) {
  console.log('assets/units/*.px 가 없다')
} else {
  for (const f of files) console.log(build(f))
}
