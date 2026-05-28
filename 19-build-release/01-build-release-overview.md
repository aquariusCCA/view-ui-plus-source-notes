# 建置與發布總覽

## 學習目標

這篇建立 View UI Plus 建置與發布流程的閱讀框架。重點不是背下每個工具的語法，而是看一套 Vue 3 元件庫如何把原始碼轉成使用者可以安裝、匯入、載入樣式、載入語系與取得型別提示的 npm 套件。

讀完後，要能從 `package.json` 的 `build` 指令一路追到 `dist/`、`types/` 與 npm 發布面。

## 對照源碼

- `01-origin/source/view-ui-plus-v1.3.20/package.json`
- `01-origin/source/view-ui-plus-v1.3.20/vite.config.js`
- `01-origin/source/view-ui-plus-v1.3.20/build/build-style.js`
- `01-origin/source/view-ui-plus-v1.3.20/build/vite.lang.config.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/index.js`
- `01-origin/source/view-ui-plus-v1.3.20/types/index.d.ts`
- `01-origin/source/view-ui-plus-v1.3.20/dist/`

## 整體流程

View UI Plus v1.3.20 的 `npm run build` 不是單一工具完成全部事情，而是串起三段流程：

```text
npm run build
  -> npm run build:prod
  -> npm run build:style
  -> npm run build:lang
```

三段流程分別處理不同交付物：

| 指令 | 工具 | 主要輸入 | 主要輸出 |
| --- | --- | --- | --- |
| `build:prod` | Vite / Rollup | `src/index.js` | `dist/viewuiplus.min.js`、`dist/viewuiplus.min.esm.js` |
| `build:style` | Gulp / Less | `src/styles/index.less` | `dist/styles/viewuiplus.css`、`dist/styles/fonts/` |
| `build:lang` | Vite / Rollup | `src/locale/lang/*.js` | `dist/locale/*.js` |

型別宣告不在這三段 build 中產生。它們已經存在於 `types/`，再由 `package.json` 的 `typings` 指向 `types/index.d.ts`。這代表發布流程必須額外注意「實作和型別是否同步」，不能只看 build 是否成功。

## 交付物分層

可以把最後發布到 npm 的內容拆成四層：

| 層級 | 代表內容 | 使用者依賴方式 |
| --- | --- | --- |
| JavaScript | `dist/viewuiplus.min.js`、`dist/viewuiplus.min.esm.js`、`src/` | `app.use(ViewUIPlus)`、命名匯入、CDN 或 bundler |
| 樣式 | `dist/styles/viewuiplus.css`、fonts | `import 'view-ui-plus/dist/styles/viewuiplus.css'` 或 `<link>` |
| 語系 | `dist/locale/*.js` | 獨立載入語系包後切換 locale |
| 型別 | `types/*.d.ts` | TypeScript 編輯器提示與編譯檢查 |

這些交付物的來源不同，所以也有不同風險。JS build 成功不代表 CSS 存在；CSS 成功不代表語系包更新；語系包更新也不代表型別同步。

## 這套流程的特徵

View UI Plus v1.3.20 的流程很適合拿來學「傳統元件庫如何從 source 走到 npm」：

- JavaScript bundle 由 Vite library mode 負責。
- Rollup output 同時輸出 UMD 與 ES module。
- Vue 被標記成 external，不包進元件庫 bundle。
- 樣式不跟著 JS entry 打包，而是由 Gulp 從 Less 入口獨立輸出。
- locale 不是全塞進主 bundle，而是依語系檔案獨立建置。
- 型別宣告是手寫並隨 package 發布。
- `files` 明確指定 npm 發布時包含 `dist`、`src`、`types`。

這些設計讓使用者有多種引入方式，但也讓發布檢查變得更重要。

## 按需引入的閱讀角度

本章會使用「按需引入」這個詞，但要先釐清現況：View UI Plus v1.3.20 的 build script 沒有輸出一套每個元件各自編譯好的 `es/button`、`lib/button` 目錄。它主要提供：

- `src/components/index.js` 的命名匯出。
- npm package 中保留 `src/`。
- 一份全量 UMD bundle。
- 一份 ES module bundle。

因此閱讀時要把「可命名匯入」和「完整按需發布產物」分開。前者是目前可觀察到的事實，後者則是現代化時可以補強的方向。

## 設計啟發

元件庫的 build pipeline 應該從使用者需求反推：

- 使用者要能在 Vue app 中安裝插件。
- 使用者要能引入完整 CSS。
- CDN 使用者要能載入全域 bundle。
- bundler 使用者要能使用 module 入口。
- TypeScript 使用者要能拿到正確 props 與全域屬性型別。
- 多語系使用者要能控制語系包載入成本。

所以 build 不是「把程式碼壓成一個檔案」而已，而是定義套件對外交付的所有契約。

## 複習題

1. View UI Plus 的 `npm run build` 串起哪三個子指令？
2. 哪些產物在 `dist/`，哪些產物在 `types/`？
3. 為什麼 JS bundle 成功不代表發布流程完整？
4. View UI Plus v1.3.20 的按需能力和現代 `es/`、`lib/` 產物有什麼差異？
5. 從使用者角度看，一個元件庫 package 至少要交付哪些內容？
