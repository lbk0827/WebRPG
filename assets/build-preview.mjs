// manifest 의 모든 아이콘을 96/48/24px, 밝은/어두운 바탕으로 미리 본다.
// 사용: node assets/build-preview.mjs
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const manifest = JSON.parse(readFileSync(join(here, 'manifest.json'), 'utf8'))
const groups = [
  ['jobs', '직업'],
  ['monsters', '몬스터'],
  ['skills', '스킬'],
  ['items', '장비 · 재료'],
  ['status', '상태이상'],
  ['traits', '특성'],
]

const loadSvg = (entry) =>
  readFileSync(join(here, entry.icon), 'utf8')
    .replace(/<\?xml[^>]*>\s*/, '')
    .replace(/\s+width="\d+"\s+height="\d+"/, '')

const card = ([id, entry]) => `
  <div class="card">
    <div class="sizes">
      <span class="i96">${loadSvg(entry)}</span>
      <span class="i48">${loadSvg(entry)}</span>
      <span class="i24">${loadSvg(entry)}</span>
    </div>
    <div class="name">${entry.name}</div><div class="id">${id}</div>
  </div>`

const content = (theme) => groups.map(([key, title]) => {
  const entries = Object.entries(manifest[key] ?? {})
  if (!entries.length) return ''
  return `<section class="${theme}"><h2>${title} <small>${entries.length}</small></h2><div class="row">${entries.map(card).join('')}</div></section>`
}).join('')

const html = `<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>WebRPG 리소스 미리보기</title><style>
*{box-sizing:border-box}body{margin:0;font-family:system-ui,"Segoe UI",sans-serif;background:#f3f0ea;color:#1d1d24}
header{position:sticky;top:0;z-index:2;padding:14px 20px;background:#f3f0eae8;backdrop-filter:blur(8px);border-bottom:1px solid #c9c0ad}
h1{font-size:18px;margin:0}section{padding:16px 20px 26px}section.dark{background:#1d1d24;color:#e9e4d8}h2{font-size:16px;margin:0 0 12px}h2 small{opacity:.55}
.row{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:12px}.card{border:1px solid #c9c0ad;border-radius:10px;padding:10px;min-width:0}.dark .card{border-color:#454550}
.sizes{height:100px;display:flex;align-items:flex-end;gap:10px}.sizes svg{display:block}.i96 svg{width:96px;height:96px}.i48 svg{width:48px;height:48px}.i24 svg{width:24px;height:24px}
.name{font-size:13px;font-weight:700;margin-top:7px}.id{font:11px ui-monospace,monospace;opacity:.6;overflow:hidden;text-overflow:ellipsis}
</style></head><body><header><h1>리소스 100종 · 96/48/24px · 밝은/어두운 배경</h1></header>${content('')}${content('dark')}</body></html>`

writeFileSync(join(here, 'preview.html'), html)
const count = groups.reduce((sum, [key]) => sum + Object.keys(manifest[key] ?? {}).length, 0)
console.log(`assets/preview.html 생성 (아이콘 ${count}종 인라인)`)
