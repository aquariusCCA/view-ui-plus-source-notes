# Vue 元件庫打包流程

這篇文章接續 `docs/vue-component-library-project-structure.md`，專門說明 `apps/01-clone-practice` 的打包流程。

架構筆記先回答：

```text
src/ 和 examples/ 如何分工？
```

這篇則回答：

```text
src/ 裡的元件庫原始碼，最後如何變成 dist/ 裡可以發布的檔案？
```

## 打包流程的目標

元件庫打包和一般 Vue app build 不一樣。

一般 Vue app build 的目標是輸出一個網站。元件庫 build 的目標是輸出一組可以被其他專案引入的檔案。

目前這個專案的目標產物是：

```text
dist/
  myui.es.js
  myui.umd.cjs
  styles/
    myui.css
```

這三個檔案分別對應：

| 產物 | 來源 | 用途 |
| --- | --- | --- |
| `dist/myui.es.js` | `src/index.js` | 給 Vite、Rollup、Webpack 這類現代工具使用 |
| `dist/myui.umd.cjs` | `src/index.js` | 給 Node CommonJS `require()` 使用 |
| `dist/styles/myui.css` | `src/style/index.less` | 給使用者獨立引入元件庫樣式 |

所以打包流程分成兩段：

```text
build:lib     # 打包 JavaScript 元件庫
build:style   # 打包 CSS 樣式
```

## `package.json` scripts 如何串起流程

目前 `package.json` 裡的 scripts 是：

```json
"scripts": {
  "dev": "vite",
  "build": "npm run build:lib && npm run build:style",
  "build:lib": "vite build --config vite.lib.config.js",
  "build:style": "vite build --config vite.style.config.js"
}
```

可以拆成三種用途：

| 指令 | 用途 |
| --- | --- |
| `npm run dev` | 啟動 `examples/` 開發展示站 |
| `npm run build:lib` | 用 `vite.lib.config.js` 打包 JS 元件庫 |
| `npm run build:style` | 用 `vite.style.config.js` 打包 CSS |

完整 build 會先打 JS，再打 CSS：

```text
npm run build
  -> npm run build:lib
  -> npm run build:style
```

這個順序很重要，因為 `vite.lib.config.js` 會清空 `dist/`，而 `vite.style.config.js` 會把 CSS 加到 `dist/styles/`。

## `vite.lib.config.js` 打包 JS 元件庫

`vite.lib.config.js` 的任務是從 `src/index.js` 輸出 JavaScript 元件庫。

核心設定是：

```js
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
    },
  },
}
```

最重要的是打包入口：

```text
src/index.js
```

不是：

```text
examples/main.js
```

這代表打包結果只包含元件庫公開 API，不會把開發展示站打進去。

`formats: ['es', 'umd']` 會產生兩種 JS 格式：

```text
dist/myui.es.js
dist/myui.umd.cjs
```

`myui.es.js` 是現代前端工具常用的 ES Module 格式。

`myui.umd.cjs` 則保留給 Node CommonJS `require()` 使用；副檔名使用 `.cjs` 是為了避免在 `"type": "module"` 的 package 裡被 Node 當成 ESM `.js` 解析。

## 為什麼要 external Vue

設定裡有一段很重要：

```js
external: ['vue']
```

這代表打包元件庫時，不把 Vue 本身打進 `dist/myui.es.js` 或 `dist/myui.umd.cjs`。

原因是 Vue 元件庫應該使用「使用者專案裡的 Vue」，而不是自己再包一份 Vue。

這也對應 `package.json` 裡的設定：

```json
"peerDependencies": {
  "vue": "^3.5.0"
}
```

可以這樣理解：

```text
external: ['vue']
  -> build 時不要把 Vue 打進產物

peerDependencies.vue
  -> 安裝時告訴使用者專案必須提供 Vue
```

如果元件庫把 Vue 一起打包進去，使用者專案可能會拿到兩份 Vue，進而造成 bundle 變大或執行期問題。

## `vite.style.config.js` 打包 CSS

`vite.style.config.js` 的任務是從樣式入口輸出獨立 CSS。

核心入口是：

```js
input: resolve(__dirname, 'src/style/index.less')
```

也就是：

```text
src/style/index.less
```

目前 `src/style/index.less` 再往下匯入：

```less
@import './base.less';
@import './components/index.less';
```

最後輸出成：

```text
dist/styles/myui.css
```

這樣使用者就可以在自己的專案裡獨立引入樣式：

```js
import '@kevinxiao0210/myui/style.css'
```

這種設計的好處是 JS 和 CSS 的入口都很明確：

```text
JS   -> @kevinxiao0210/myui
CSS  -> @kevinxiao0210/myui/style.css
```

## 為什麼 CSS 要和 JS 分開打包

元件庫通常不會只把樣式隱藏在 JS 裡，因為使用者需要清楚知道樣式從哪裡來。

分開打包有幾個好處：

- 使用者可以明確寫出 `import '@kevinxiao0210/myui/style.css'`。
- 發布時可以讓 `package.json exports` 單獨暴露 `./style.css`。
- 未來如果要支援按需樣式或主題樣式，會比較容易拆分。

目前 `vite.style.config.js` 還有一個細節：

```js
emptyOutDir: false
```

因為 `npm run build` 會先執行 `build:lib`，再執行 `build:style`。

如果打包 CSS 時清空 `dist/`，前一步產生的 `myui.es.js` 和 `myui.umd.cjs` 就會被刪掉。

所以 CSS build 必須保留既有的 JS build 產物。

## 三條流程合在一起

開發展示站不產生正式打包檔案：

```text
npm run dev
  -> vite.config.js
  -> examples/index.html
  -> examples/main.js
  -> src/index.js
  -> src/style/index.less
```

打包 JS 元件庫：

```text
npm run build:lib
  -> vite build --config vite.lib.config.js
  -> src/index.js
  -> dist/myui.es.js
  -> dist/myui.umd.cjs
```

打包 CSS：

```text
npm run build:style
  -> vite build --config vite.style.config.js
  -> src/style/index.less
  -> dist/styles/myui.css
```

總打包：

```text
npm run build
  -> npm run build:lib
  -> npm run build:style
```
