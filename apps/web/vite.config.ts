import { readdirSync, rmSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages 는 https://<user>.github.io/<repo>/ 하위 경로에 뜬다. CI 가 BASE_PATH=/WebRPG/ 를 넣는다.
const base = process.env.BASE_PATH ?? '/'

/**
 * assets/ 는 폴더째 배포된다(publicDir). 그런데 게임이 쓰지 않는 파일이 섞일 수 있다.
 * - 에셋 원장(README.md)은 출처·법무 검토 기록이라 사이트에 띄울 이유가 없다.
 *   원장은 에셋 옆에 두는 것이 규칙이라 옮기지 않고, 빌드 결과에서만 뺀다.
 * - 도구(.mjs/.py)와 검수 시트(preview.html)는 tools/ 로 옮겼다(2026-09-13).
 *   다시 섞여 들어와도 배포되지 않게 같이 막는다.
 */
function stripNonGameFiles(): Plugin {
  let outDir = ''
  return {
    name: 'strip-non-game-files',
    apply: 'build',
    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir)
    },
    closeBundle() {
      for (const name of readdirSync(outDir)) {
        if (name === 'README.md' || name === 'preview.html' || name === '__pycache__' || /\.(mjs|py|pyc)$/.test(name)) {
          rmSync(join(outDir, name), { recursive: true, force: true })
        }
      }
    },
  }
}

export default defineConfig({
  base,
  plugins: [react(), stripNonGameFiles()],
  // assets/ 를 그대로 정적 서빙한다. /jobs/warrior.svg, /manifest.json
  publicDir: '../../assets',
  // 미리보기 도구가 창마다 다른 포트를 PORT 로 넘긴다. 없으면 5173.
  server: { port: Number(process.env.PORT) || 5173, strictPort: true },
})
