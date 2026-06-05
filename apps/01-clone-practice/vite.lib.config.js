// 打包元件庫 JS，樣式由 vite.style.config.js 另外輸出
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'node:path'

export default defineConfig({
  plugins: [vue()],
  publicDir: false,

  build: {
    outDir: 'dist',
    emptyOutDir: true,

    lib: {
      entry: resolve(__dirname, 'src/index.js'),
      name: 'MyUI',
      formats: ['es', 'umd'],
      fileName: (format) => {
        if (format === 'es') return 'myui.es.js'
        return 'myui.umd.cjs'
      },
    },

    rollupOptions: {
      external: ['vue'],
      output: {
        exports: 'named',
        globals: {
          vue: 'Vue',
        },
        assetFileNames: 'assets/[name][extname]',
      },
    },
  },
})
