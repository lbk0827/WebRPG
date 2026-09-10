import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages 는 https://<user>.github.io/<repo>/ 하위 경로에 뜬다. CI 가 BASE_PATH=/WebRPG/ 를 넣는다.
const base = process.env.BASE_PATH ?? '/'

export default defineConfig({
  base,
  plugins: [react()],
  // assets/ 를 그대로 정적 서빙한다. /jobs/warrior.svg, /manifest.json
  publicDir: '../../assets',
  server: { port: 5173, strictPort: true },
})
