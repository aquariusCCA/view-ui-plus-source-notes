// 開發 example
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'node:path'

export default defineConfig({
  root: resolve(__dirname, 'example'),
  publicDir: resolve(__dirname, 'public'),

  plugins: [vue()],

  server: {
    open: true,
  },
})
