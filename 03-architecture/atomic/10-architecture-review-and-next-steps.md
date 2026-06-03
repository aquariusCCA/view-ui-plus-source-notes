# 架構章節總結、複習問題與後續閱讀路線

> 來源：03-architecture/origin/08-architecture-summary.md / # 架構總結

## 學習目標

這篇筆記回顧 `03-architecture/` 的主線，幫助你在進入插件系統、共用邏輯、型別系統與具體元件前，先形成完整的架構圖。

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

- `src/index.js` 是整套元件庫的總入口，也是 Vue 插件安裝入口。
- `src/components/index.js` 是公開元件清單，決定哪些元件能被集中匯出。
- `install(app, opts)` 是全域註冊主線，負責元件、指令、全域配置與全域服務。
- `src/components/` 中同時存在普通元件、複合元件、命令式服務與內部基礎能力。
- `src/styles/index.less` 是樣式系統入口，不應只從 `.vue` 檔看樣式。
- `types/index.d.ts` 是 TypeScript 使用者理解全域 API 的入口。
- `dist/` 是發布產物，不是主要閱讀源碼，但能幫助理解使用者最終消費的結果。

## 後續閱讀路線

完成本章後，建議接著閱讀：

1. `04-plugin-system/`：深入 `install`、全域註冊、按需引入與全域服務。
2. `05-shared-logic/`：整理 `utils/`、`mixins/`、跨元件共用邏輯。
3. `06-public-api-and-type-system/`：分析 Props、Emits、Slots、Instance 與型別宣告。
4. `07-basic-components/`：從 `Icon`、`Button`、`Divider` 建立單一元件閱讀能力。
5. `17-style-system/`：回頭深入 Less、變數、mixins、BEM 與樣式覆蓋策略。

## 複習問題

1. 使用者執行 `app.use(ViewUIPlus)` 時，從入口到註冊的完整流程是什麼？
2. 如果要新增一個元件，至少需要考慮哪些入口、樣式、型別與範例位置？
3. 普通元件、複合元件、命令式服務的閱讀方式有什麼差異？
4. 為什麼元件庫的架構分析必須同時看 JS、Less、types、dist？
5. 哪些內容應該留在 `03-architecture/`，哪些內容應該移到後續章節？

## 本章完成標準

讀完本章後，你應該能做到：

- 不打開複雜元件，也能說明 View UI Plus 的工程骨架。
- 能從 `package.json` 追到 `src/index.js`、`src/components/index.js` 與單一元件入口。
- 能解釋 `install` 中元件註冊、指令註冊、全域配置、全域服務的分工。
- 能判斷某個元件應該歸到哪一類，並知道下一步該讀哪個章節。
- 能使用同一套流程追蹤後續任一元件。
