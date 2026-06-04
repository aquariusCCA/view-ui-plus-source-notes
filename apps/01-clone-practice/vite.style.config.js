// 單獨打包樣式，仿照 View UI Plus 將 CSS 從元件庫 JS 拆開發布
import { defineConfig } from 'vite'
import { resolve } from 'node:path'

export default defineConfig({
  publicDir: false,

  build: {
    outDir: 'dist/styles',
    emptyOutDir: false,
    cssMinify: true,

    rollupOptions: {
      input: resolve(__dirname, 'src/style/index.less'),
      output: {
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith('.css')) return 'myui.css'
          return 'assets/[name][extname]'
        },
        entryFileNames: 'style-entry.js',
      },
    },
  },
})
