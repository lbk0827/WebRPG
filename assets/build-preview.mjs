// assets/jobs/*.svg + assets/monsters/*.svg 를 인라인한 자기완결형 preview.html 을 생성한다.
// 사용: node assets/build-preview.mjs
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const manifest = JSON.parse(readFileSync(join(here, 'manifest.json'), 'utf8'))

const ALL = { ...manifest.jobs, ...(manifest.monsters ?? {}) }
const svg = Object.fromEntries(
  Object.entries(ALL).map(([id, j]) => [
    id,
    readFileSync(join(here, j.icon), 'utf8').replace(/<\?xml[^>]*>\s*/, '').replace(/\s+width="128"\s+height="128"/, ''),
  ]),
)

const jobCard = (id) => {
  const j = ALL[id]
  return `
    <div class="job">
      <div class="sizes">
        <span class="i96">${svg[id]}</span>
        <span class="i48">${svg[id]}</span>
        <span class="i24">${svg[id]}</span>
      </div>
      <div class="name">${j.name}</div><div class="role">${j.role ?? j.archetype}</div>
    </div>`
}

const partySlot = (id, pct) =>
  `<div class="slot"><span class="i36">${svg[id]}</span><span>${ALL[id].name}</span><div class="hp"><i style="width:${pct}%"></i></div></div>`

const party = ['warrior', 'warrior', 'elf', 'mage', 'priest']
const pcts = [92, 61, 45, 100, 78]
const foes = ['ogre', 'turtle', 'goblin', 'shaman', 'swarm']
const foePcts = [100, 84, 30, 66, 12]

const section = (cls) => `
  <section class="${cls}">
    <div class="row">${Object.keys(manifest.jobs).map(jobCard).join('')}</div>
    <div class="row" style="margin-top:20px">${Object.keys(manifest.monsters ?? {}).map(jobCard).join('')}</div>
    <div class="party">${party.map((id, i) => partySlot(id, pcts[i])).join('')}</div>
    <div class="party">${foes.map((id, i) => partySlot(id, foePcts[i])).join('')}</div>
  </section>`

const html = `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>아이콘 미리보기 — 직업 5 · 몬스터 8</title>
<style>
  body { margin: 0; font-family: system-ui, -apple-system, "Segoe UI", sans-serif; background: #f3f0ea; color: #1d1d24; }
  h1 { font-size: 18px; margin: 0; padding: 16px 20px; }
  h1.dark { background: #1d1d24; color: #e9e4d8; }
  section { padding: 12px 20px 24px; }
  section.dark { background: #1d1d24; color: #e9e4d8; }
  .row { display: flex; gap: 24px; flex-wrap: wrap; align-items: flex-end; }
  .job { display: flex; flex-direction: column; align-items: center; gap: 6px; }
  .job .name { font-weight: 600; font-size: 14px; }
  .job .role { font-size: 11px; opacity: 0.7; }
  .sizes { display: flex; gap: 12px; align-items: flex-end; }
  svg { display: block; }
  .i96 svg { width: 96px; height: 96px; }
  .i48 svg { width: 48px; height: 48px; }
  .i36 svg { width: 36px; height: 36px; }
  .i24 svg { width: 24px; height: 24px; }
  .party { display: flex; gap: 6px; margin-top: 14px; padding: 8px; border-radius: 10px; background: rgba(0,0,0,0.06); width: max-content; }
  .dark .party { background: rgba(255,255,255,0.08); }
  .slot { display: flex; flex-direction: column; align-items: center; gap: 3px; font-size: 10px; width: 52px; }
  .hp { width: 44px; height: 4px; border-radius: 2px; background: #ccc; overflow: hidden; }
  .hp i { display: block; height: 100%; background: #3e8e5a; }
  p.note { font-size: 12px; opacity: 0.7; margin: 0; padding: 0 20px 16px; }
</style>
</head>
<body>
<h1>직업 아이콘 — 밝은 배경</h1>
${section('')}
<h1 class="dark">직업 아이콘 — 어두운 배경</h1>
${section('dark')}
<p class="note">생성: node assets/build-preview.mjs · 원본: assets/jobs/*.svg · 하단 편성 슬롯은 36px 실사용 크기</p>
</body>
</html>
`

writeFileSync(join(here, 'preview.html'), html)
console.log('assets/preview.html 생성 (아이콘 %d종 인라인)', Object.keys(svg).length)
