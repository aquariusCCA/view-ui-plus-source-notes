// 開發 examples
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'node:path'

export default defineConfig({
  root: resolve(__dirname, 'examples'),
  publicDir: resolve(__dirname, 'public'),

  plugins: [vue()],

  server: {
    open: true,
  },
})
