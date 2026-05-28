# Vue external 與全域 bundle 契約

## 學習目標

這篇分析 View UI Plus 為什麼把 Vue 從 bundle 中排除，以及這個決策如何影響 UMD、ESM、npm metadata 與使用者安裝方式。讀完後，要能說明 external 不是單純減少體積，而是在定義元件庫和宿主應用之間的依賴契約。

## 對照源碼

- `01-origin/source/view-ui-plus-v1.3.20/vite.config.js`
- `01-origin/source/view-ui-plus-v1.3.20/package.json`
- `01-origin/source/view-ui-plus-v1.3.20/src/index.js`
- `01-origin/source/view-ui-plus-v1.3.20/README-CN.md`

## external 的設定

`vite.config.js` 中的關鍵設定是：

```js
rollupOptions: {
    external: ['vue'],
    output: [
        {
            format: 'umd',
            globals: { vue: 'Vue' }
        },
        {
            format: 'es',
            globals: { vue: 'Vue' }
        }
    ]
}
```

`external: ['vue']` 表示打包 View UI Plus 時，不把 Vue runtime 包進產物。bundle 中遇到 `import { ... } from 'vue'` 時，會保留成外部依賴。

## 為什麼 Vue 要 external

UI 元件庫通常不應該內建自己的 Vue runtime，原因有三個：

- 避免使用者專案出現兩份 Vue。
- 降低 bundle 體積。
- 讓元件庫和宿主應用共用同一個 Vue app context、reactivity 與 runtime。

如果元件庫把 Vue 打進去，使用者專案可能同時有 app 自己的 Vue 和元件庫內部 Vue，導致 provide/inject、plugin install、component instance 或 reactivity 行為不一致。

## UMD 的全域契約

UMD 產物需要知道外部 Vue 在瀏覽器全域上叫什麼名字，所以設定：

```js
globals: { vue: 'Vue' }
```

這代表使用 `<script>` 載入 UMD 版本時，使用者必須先載入 Vue，並讓全域存在 `Vue`。接著再載入 `viewuiplus.min.js`，才能取得 `ViewUIPlus`。

這和 README 中的全域引用方式相呼應：

```html
<script type="text/javascript" src="viewuiplus.min.js"></script>
<link rel="stylesheet" href="dist/styles/viewuiplus.css">
```

閱讀時要補上隱含條件：Vue 也必須由宿主環境提供。

## package metadata 的缺口

雖然 bundle 設定把 Vue external，`package.json` 中卻沒有看到 `peerDependencies` 宣告 Vue。`vue` 出現在 `devDependencies`，代表本地開發和建置可以使用 Vue，但 npm 安裝時不會用 peer dependency 的方式提醒使用者提供相容版本。

現代元件庫通常會採用類似策略：

```json
{
    "peerDependencies": {
        "vue": "^3.0.0"
    },
    "devDependencies": {
        "vue": "^3.2.47"
    }
}
```

這樣可以同時滿足兩件事：發布產物不包 Vue，本地開發仍能安裝 Vue。

## ESM 的 external 契約

ES module 產物同樣不內建 Vue。對 bundler 使用者來說，這通常是好事，因為應用程式 bundler 會把 `vue` resolve 到使用者專案安裝的版本。

但這也代表使用者專案必須明確安裝 Vue，並且版本要符合元件庫期待。若 package 沒有 peer dependency，錯誤可能延後到執行期或 bundler resolve 階段才出現。

## 設計啟發

external 設定應該和 package metadata 一起設計：

- build config 決定哪些依賴不打進 bundle。
- `peerDependencies` 告訴使用者必須提供哪些依賴。
- `devDependencies` 提供元件庫本地開發所需依賴。
- README 告訴 CDN 或 script tag 使用者載入順序。

如果只做 external，卻沒有 metadata 和文件補上契約，使用者仍可能踩到安裝與載入問題。

## 複習題

1. `external: ['vue']` 解決了什麼問題？
2. UMD build 中 `globals: { vue: 'Vue' }` 代表什麼使用者責任？
3. 為什麼 UI 元件庫通常不應該把 Vue runtime 包進 bundle？
4. `devDependencies` 中有 Vue，為什麼仍可能需要 `peerDependencies`？
5. external 設定、README 安裝方式與 package metadata 應該如何互相對齊？
