# Vite library build 與 Rollup output

## 學習目標

這篇分析 View UI Plus 如何用 Vite library mode 產生主要 JavaScript bundle。讀完後，要能說明 `vite.config.js` 中 `build.lib`、`rollupOptions.external`、`output` 陣列與檔名設定如何共同定義套件的 JS 交付形式。

## 對照源碼

- `01-origin/source/view-ui-plus-v1.3.20/vite.config.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/index.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/index.js`
- `01-origin/source/view-ui-plus-v1.3.20/dist/viewuiplus.min.js`
- `01-origin/source/view-ui-plus-v1.3.20/dist/viewuiplus.min.esm.js`

## library build 入口

`vite.config.js` 的主體是：

```js
build: {
    outDir: path.resolve(__dirname, './dist'),
    lib: {
        entry: path.resolve(__dirname, './src/index.js'),
        name: 'ViewUIPlus'
    },
    rollupOptions: {
        external: ['vue'],
        output: [
            { format: 'umd', entryFileNames: 'viewuiplus.min.js' },
            { format: 'es', entryFileNames: 'viewuiplus.min.esm.js' }
        ]
    }
}
```

`lib.entry` 指向 `src/index.js`，所以整個 bundle 的對外形狀由 `src/index.js` 決定。它不是從每個元件目錄各自建置，而是從總入口匯入所有元件、指令、locale 與全域服務。

`lib.name` 是 UMD build 需要的全域名稱，讓瀏覽器全域載入時可以拿到 `ViewUIPlus`。

## 兩種 output

Rollup output 陣列定義了兩份主要產物：

| format | 檔名 | 用途 |
| --- | --- | --- |
| `umd` | `viewuiplus.min.js` | CDN、script tag、傳統 bundler 預設入口 |
| `es` | `viewuiplus.min.esm.js` | ES module 消費者或現代 bundler 可能使用 |

兩份 output 都設定：

- `exports: 'named'`
- `sourcemap: false`
- `chunkFileNames: '[name].js'`
- `assetFileNames: '[name].[ext]'`
- `inlineDynamicImports: false`
- `manualChunks: undefined`

這代表產物重視穩定檔名與 named exports，而不是輸出多 chunk 或保留 source map 的除錯體驗。

## Rollup 設定的意義

幾個容易忽略的欄位：

- `context: 'globalThis'`：避免某些模組在嚴格模式下使用錯誤的 top-level `this`。
- `preserveEntrySignatures: 'strict'`：要求 entry 對外 export 形狀更嚴格地保留。
- `namespaceToStringTag: true`：讓 namespace object 有較好的 `toStringTag` 標記。
- `globals: { vue: 'Vue' }`：UMD build 遇到外部 Vue 時，從全域 `Vue` 取得。

這些設定都在維持「這是一個可被外部環境載入的 library」，而不是一般應用程式 bundle。

## 產物名稱的閱讀陷阱

檔名叫 `viewuiplus.min.js` 和 `viewuiplus.min.esm.js`，表示它們是發布用壓縮產物。但真正要確認壓縮、格式與外部依賴，不能只看檔名，要回到 Vite build 與 Rollup output 設定。

另外，雖然產生了 ESM 檔，`package.json` 仍只有 `main` 指向 UMD 檔，沒有 `module` 或 `exports` 指向 ESM 檔。因此 ESM 產物存在，不等於 package 已經完整提供現代 module resolution 契約。

## 與應用程式 build 的差異

元件庫 build 和一般 Vue app build 最大差異在於：

- app build 目標是可部署頁面，library build 目標是可被別人 import。
- app build 可以把 Vue、router、業務依賴都打進去，library build 通常要 external Vue。
- app build 可用 hash 檔名支援快取，library build 更重視穩定檔名。
- app build 通常輸出 HTML、assets，library build 輸出 JS API 與型別、樣式契約。

所以看 `vite.config.js` 時，不要用一般前端應用程式的角度解讀。

## 設計啟發

如果仿寫元件庫 build，至少要先決定：

- 主入口是哪個檔案？
- 要輸出 UMD、ESM，還是兩者都要？
- 哪些依賴要 external？
- 檔名是否需要固定？
- package metadata 是否正確指到這些產物？

Vite library mode 解決的是「如何產生 bundle」，但「如何讓使用者正確找到 bundle」還要靠 `package.json`。

## 複習題

1. `lib.entry` 為什麼會決定整個 bundle 的對外 API？
2. UMD 和 ES module 產物各自服務哪類使用者？
3. `exports: 'named'` 對元件庫有什麼意義？
4. 為什麼不能只因為檔名有 `.esm` 就判斷 package 的 module 契約完整？
5. library build 和 app build 在 external、檔名與入口設計上有什麼差異？
