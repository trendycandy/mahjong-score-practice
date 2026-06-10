import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

// GitHub Pages 배포 시 base 를 '/<레포명>/' 로 (워크플로에서 VITE_BASE 주입)
export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE ?? '/',
  resolve: {
    alias: {
      // riichi-ts 내부의 node 'assert' 를 브라우저 shim 으로 대체
      assert: path.resolve(__dirname, 'src/assert-shim.ts'),
    },
  },
})
