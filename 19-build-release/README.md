# 19-build-release

本目錄存放 View UI Plus 的建置與發布流程分析。這一章不只看「執行哪個 build 指令」，而是整理元件庫如何把 JavaScript bundle、樣式產物、語系包、型別宣告、npm 發布面與版本管理串成可交付的套件。

View UI Plus v1.3.20 的建置主線是 Vite library build、Rollup output 設定、Gulp Less 樣式編譯、獨立 locale 打包與手寫 TypeScript declarations。閱讀時要特別區分兩件事：原始碼實際做了什麼，以及現代元件庫可以如何補強，例如 `exports` map、`peerDependencies`、d.ts 自動產生與 CI 發布。

## 閱讀順序

| 順序 | 筆記 | 學習重點 |
| --- | --- | --- |
| 1 | [建置與發布總覽](./01-build-release-overview.md) | 建立 `npm run build`、Vite、Gulp、dist、types、package 發布面的整體地圖 |
| 2 | [package scripts 與 build pipeline](./02-package-scripts-and-build-pipeline.md) | 分析 `build:prod`、`build:style`、`build:lang` 的分工與交付順序 |
| 3 | [Vite library build 與 Rollup output](./03-vite-library-build-and-rollup-output.md) | 分析 `vite.config.js` 如何輸出 UMD 與 ES module 版本 |
| 4 | [Vue external 與全域 bundle 契約](./04-external-vue-and-global-build-contract.md) | 說明 `external: ['vue']`、`globals`、UMD 全域變數與使用者載入方式 |
| 5 | [入口、install 與全量匯入 bundle](./05-entry-install-and-full-import-bundle.md) | 從 `src/index.js` 追蹤全量匯出、插件安裝、指令與全域服務 |
| 6 | [Gulp、Less、CSS 與字型產物](./06-style-build-gulp-less-css-fonts.md) | 分析 `build/build-style.js` 如何編譯 Less、autoprefix、壓縮與複製 fonts |
| 7 | [語系包建置與 locale 產物](./07-locale-build-and-language-packs.md) | 分析 `build/vite.lang.config.js` 與 `src/locale/lang` 如何輸出獨立語系包 |
| 8 | [型別宣告與 d.ts 契約](./08-types-package-and-dts-contract.md) | 分析 `typings`、`types/index.d.ts`、元件 d.ts 與 Vue global properties 型別 |
| 9 | [package files、npmignore 與發布面](./09-package-files-npmignore-and-publish-surface.md) | 分析 `files`、`.npmignore`、`dist`、`src`、`types` 如何形成 npm 可見內容 |
| 10 | [dist 產物與使用者引入模式](./10-dist-artifacts-and-consumer-import-modes.md) | 整理全量 JS、ESM、CSS、fonts、locale、types 的消費方式與限制 |
| 11 | [版本管理、發布檢查與風險點](./11-versioning-release-checklist-and-risk-points.md) | 建立版本更新、build 前檢查、發布後驗證與常見破壞點清單 |
| 12 | [現代化 build/release 遷移筆記](./12-modern-build-release-migration-notes.md) | 對照現代元件庫可演進方向：`exports`、`sideEffects`、d.ts 產生、CI 發布 |

## 原始碼主線

主要對照這幾個位置：

- `01-origin/source/view-ui-plus-v1.3.20/package.json`
- `01-origin/source/view-ui-plus-v1.3.20/vite.config.js`
- `01-origin/source/view-ui-plus-v1.3.20/build/build-style.js`
- `01-origin/source/view-ui-plus-v1.3.20/build/vite.lang.config.js`
- `01-origin/source/view-ui-plus-v1.3.20/build/locale.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/index.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/index.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/locale/`
- `01-origin/source/view-ui-plus-v1.3.20/types/`
- `01-origin/source/view-ui-plus-v1.3.20/dist/`
- `01-origin/source/view-ui-plus-v1.3.20/.npmignore`

## 本章邊界

本章聚焦建置、產物與發布面，不重複分析每個元件的完整實作。

- 元件 API、props、events、slots 與 TypeScript 介面設計可回看 `06-public-api-and-type-system/`；本章只看型別檔如何被發布與消費。
- Less token、mixins、動畫與元件樣式設計可回看 `17-style-system/`；本章只看樣式如何被 Gulp 編譯成 `dist/styles/viewuiplus.css`。
- 測試環境與 coverage 可回看 `18-testing/`；本章只把 lint、test、build 放到發布檢查的脈絡中。
- 現代化建議屬於延伸設計。View UI Plus v1.3.20 原始發布面仍以 `main`、`typings`、`files`、`dist`、`src`、`types` 為主，不要誤讀成已具備完整 `exports` map 或自動 d.ts pipeline。

## 學完後要能回答

- `npm run build` 實際串起哪三段建置？
- `build:prod`、`build:style`、`build:lang` 分別產生哪些檔案？
- `vite.config.js` 為什麼要同時輸出 UMD 和 ES module？
- `external: ['vue']` 對 bundle 體積與使用者安裝有什麼影響？
- `src/index.js` 如何把元件、指令、全域服務與 locale 組成插件入口？
- 為什麼 View UI Plus 的樣式不是由 Vite JS build 直接輸出？
- 語系包為什麼需要獨立打包？
- `typings: "types/index.d.ts"` 如何成為 TypeScript 使用者的入口？
- `files`、`.npmignore` 與 `npm pack --dry-run` 各自用來檢查什麼？
- 為什麼有 ESM 檔不代表已經有完整 tree-shaking 發布策略？
- 發布前最容易漏掉哪些交付產物？
- 如果要現代化這套流程，應該先補哪些 package metadata 與 CI 檢查？
