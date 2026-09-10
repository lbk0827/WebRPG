import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // assets/ 를 그대로 정적 서빙한다. /jobs/warrior.svg, /manifest.json
  publicDir: '../../assets',
  server: { port: 5173, strictPort: true },
})
