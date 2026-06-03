# 架構複習與後續閱讀路線

## 學習目標

這篇筆記收束 `03-architecture/` 的主線。進入插件系統、共用邏輯、公開 API、具體元件與樣式系統之前，先確認你能用一張完整架構圖說明 View UI Plus 的公開入口、元件清單、全域註冊、共用能力、樣式、型別與建置產物。

讀完後，你應該能用本章內容做三件事：追蹤任一元件、檢查新增元件需要補哪些表面、判斷哪些問題應該留在架構章節，哪些應進入後續專題。

## 對照來源

- `03-architecture/atomic/10-architecture-review-and-next-steps.md`
- `03-architecture/origin/08-architecture-summary.md`
- `03-architecture/atomic/01-project-structure-overview.md`
- `03-architecture/atomic/02-module-layer-boundaries.md`
- `03-architecture/atomic/03-component-taxonomy-and-learning-order.md`
- `03-architecture/atomic/04-package-entry-and-export-chain.md`
- `03-architecture/atomic/05-global-registration-and-services.md`
- `03-architecture/atomic/06-shared-style-type-build-surfaces.md`
- `03-architecture/atomic/07-source-reading-workflow.md`
- `03-architecture/atomic/08-component-implementation-patterns.md`
- `03-architecture/atomic/09-core-design-principles.md`

## 一張圖看架構

```txt
View UI Plus v1.3.20

package.json
  -> main: dist/viewuiplus.min.js
  -> typings: types/index.d.ts

src/index.js
  -> export * from './components'
  -> install(app, opts)
  -> locale / i18n / lang
  -> directives
  -> globalProperties

src/components/index.js
  -> Button / Input / Table / Modal / Message / ...

src/components/*
  -> 普通元件
  -> 複合元件
  -> 命令式服務
  -> 內部基礎模組

src/utils / src/mixins / src/directives / src/locale
  -> 跨元件共用能力

src/styles/index.less
  -> custom / base / mixins / common / animation / components

types/index.d.ts
  -> 元件型別
  -> install options
  -> globalProperties 型別擴充

dist/
  -> 打包後 JS / CSS / locale 產物
```

## 本章關鍵結論

- `src/index.js` 是整套元件庫的總入口，也是 Vue plugin install 入口。
- `src/components/index.js` 是公開元件清單，決定哪些元件能被集中匯出。
- `install(app, opts)` 是全域註冊主線，負責元件、指令、全域配置與全域服務。
- `src/components/` 中同時存在普通元件、複合元件、命令式服務與內部基礎能力。
- `src/styles/index.less` 是樣式系統入口，不應只從 `.vue` 檔看樣式。
- `types/index.d.ts` 是 TypeScript 使用者理解全域 API 的入口。
- `dist/` 是發布產物，不是主要閱讀源碼，但能幫助理解使用者最終消費結果。
- 目前來源未找到 `dist/package.json`，不能把它寫成已確認消費面。

## 來源明確支持

- atomic 10 與 origin 08 明確提供架構圖、關鍵結論、後續閱讀路線、複習問題與完成標準。
- 前 9 篇 atomic 分別支持專案結構、模組分層、元件分類、入口匯出、全域註冊、共用/樣式/型別/建置表面、閱讀流程、實作模式與核心設計原則。

## 根據來源推論

- 本篇將 atomic 01-09 的架構內容與 atomic 10 的完成標準整理成一個 review checklist，是根據 atomic 10 與本次正式筆記生成提案做出的教學推論。
- 後續閱讀路線只作為章節銜接，不代表本章要提前展開插件系統、共用邏輯、型別系統或具體元件細節。

## 架構章節完成標準

讀完本章後，你應該能做到：

- 不打開複雜元件，也能說明 View UI Plus 的工程骨架。
- 能從 `package.json` 追到 `src/index.js`、`src/components/index.js` 與單一元件入口。
- 能解釋 `install` 中元件註冊、指令註冊、全域配置、全域服務的分工。
- 能判斷某個元件應該歸到哪一類，並知道下一步該讀哪個章節。
- 能使用同一套流程追蹤後續任一元件。
- 能區分 runtime、type、style、build 的來源，不把任一表面誤寫成完整能力。

## 實戰使用場景

- **新增元件檢查**：從單一元件入口開始，檢查集中匯出、install 註冊、型別、樣式、範例、測試。
- **全域服務排查**：從 `src/index.js` 的 `globalProperties` 查 runtime，再到 `types/index.d.ts` 查 `ComponentCustomProperties`。
- **樣式問題排查**：從元件 class 查 `src/styles/components/`，再確認 `src/styles/index.less` 與 `dist/styles/viewuiplus.css`。
- **PR review**：判斷改動屬於入口層、元件實作層、共用能力層、樣式層、型別與產物層中的哪一層。
- **企業封裝取捨**：判斷能力是應該留在基礎元件庫，還是放到業務封裝層。

## 實作檢查任務

1. 選一個簡單元件，從 `src/components/index.js` 追到單一元件入口、實作、樣式、型別、範例與測試。
2. 列出 `install(app, opts)` 的五類責任，並各自對應到 source 路徑。
3. 選一個全域服務，檢查 runtime 掛載與 TypeScript 型別是否同步。
4. 選一個有狀態 class 的元件，確認樣式是否經過 `src/styles/index.less`。
5. 檢查 `package.json`、`vite.config.js`、`build/build-style.js` 與 `dist/`，說明使用者最終消費哪些產物。

## 後續閱讀路線

完成架構章節後，建議接著閱讀：

1. `04-plugin-system/`：深入 `install`、全域註冊、按需引入與全域服務。
2. `05-shared-logic/`：整理 `utils/`、`mixins/`、跨元件共用邏輯。
3. `06-public-api-and-type-system/`：分析 Props、Emits、Slots、Instance 與型別宣告。
4. `07-basic-components/`：從 `Icon`、`Button`、`Divider` 建立單一元件閱讀能力。
5. `17-style-system/`：回頭深入 Less、變數、mixins、BEM 與樣式覆蓋策略。

這些後續章節不應在本章提前展開。架構章節的任務是建立地圖與檢查方法，細節應留給後續專題。

## 需要回到 atomic review 的疑點

| 疑點 | 狀態 | 建議處理 |
| --- | --- | --- |
| `dist/package.json` | 目前在來源中未找到 | 後續 atomic review 若要討論消費面，應改稱根層 `package.json`、`dist/` JS/CSS 產物，或補充新來源。 |
| 每個元件是否都有完整 style/type/example/test | 不能由架構流程直接推定 | 閱讀單一元件時逐一查證，不在架構章節寫成通用事實。 |

## 複習題

1. 使用者執行 `app.use(ViewUIPlus)` 時，從入口到註冊的完整流程是什麼？
2. 如果要新增一個元件，至少需要考慮哪些入口、樣式、型別與範例位置？
3. 普通元件、複合元件、命令式服務的閱讀方式有什麼差異？
4. 為什麼元件庫的架構分析必須同時看 JS、Less、types、dist？
5. 哪些內容應該留在 `03-architecture/`，哪些內容應該移到後續章節？
6. 為什麼 runtime 可用不代表 TypeScript 使用者側體驗完整？
7. 當 source 中找不到某個消費面，例如 `dist/package.json`，正式筆記應該如何處理？
