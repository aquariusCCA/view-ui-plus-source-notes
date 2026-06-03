# 架構章節複習與後續路線

## 學習目標

這篇筆記回顧 `03-architecture/` 的主線，幫助你在進入插件系統、共用邏輯、型別系統、基礎元件與樣式系統前，先確認自己已經建立完整架構圖。

讀完後，你應該能：

1. 不打開複雜元件，也能說明 View UI Plus 的工程骨架。
2. 從 `package.json` 追到 `src/index.js`、`src/components/index.js` 與單一元件入口。
3. 解釋 `install` 中元件註冊、指令註冊、全域配置與全域服務的分工。
4. 判斷不同元件型態應該用哪種閱讀模式。
5. 知道哪些問題應該留到後續章節深入。

## 來源與對照

主要 atomic：

- `03-architecture/atomic/10-architecture-review-and-next-steps.md`

origin 對照：

- `03-architecture/origin/08-architecture-summary.md`

回查正式筆記：

- `03-architecture/01-project-structure-and-layer-map.md`
- `03-architecture/02-component-taxonomy-and-learning-path.md`
- `03-architecture/03-package-entry-and-export-chain.md`
- `03-architecture/04-global-registration-config-and-services.md`
- `03-architecture/05-shared-style-type-and-build-surfaces.md`
- `03-architecture/06-source-reading-workflow-and-component-patterns.md`
- `03-architecture/07-core-design-principles.md`

對照源碼索引：

- `01-origin/source/view-ui-plus-v1.3.20/package.json`
- `01-origin/source/view-ui-plus-v1.3.20/src/index.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/index.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/`
- `01-origin/source/view-ui-plus-v1.3.20/src/directives/`
- `01-origin/source/view-ui-plus-v1.3.20/src/locale/`
- `01-origin/source/view-ui-plus-v1.3.20/src/mixins/`
- `01-origin/source/view-ui-plus-v1.3.20/src/utils/`
- `01-origin/source/view-ui-plus-v1.3.20/src/styles/index.less`
- `01-origin/source/view-ui-plus-v1.3.20/types/index.d.ts`
- `01-origin/source/view-ui-plus-v1.3.20/dist/`

## 一張圖看架構

完成本章後，可以用這張圖回顧 View UI Plus 的主要結構：

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

這張圖不是用來取代源碼，而是用來幫你定位：目前看到的檔案屬於入口、元件、共用能力、樣式、型別還是建置產物。

## 本章關鍵結論

第一，`src/index.js` 是整套元件庫的總入口，也是 Vue 插件安裝入口。它同時服務具名匯入、整包安裝、全域配置、指令與服務掛載。

第二，`src/components/index.js` 是公開元件清單。它不是普通內部檔案，而是對外 API 面的一部分。

第三，`install(app, opts)` 是全域註冊主線。它負責元件、別名、指令、locale/i18n、`$VIEWUI` 與多個全域服務。

第四，`src/components/` 中同時存在普通元件、複合元件、命令式服務與內部基礎能力。閱讀前要先判斷元件型態。

第五，`src/styles/index.less` 是樣式系統入口。元件樣式不能只從 `.vue` 檔判斷。

第六，`types/index.d.ts` 是 TypeScript 使用者理解全域 API 的入口。runtime 掛載與 type 擴充要分開對照。

第七，`dist/` 是發布產物，不是主要閱讀源碼，但能幫助理解使用者最終消費結果。

## 章節邊界

`03-architecture/` 只處理整體架構，不提前深入單一元件全部細節。

應留在本章的內容：

1. 專案目錄與責任分區。
2. 模組分層。
3. 元件分類與學習順序。
4. 套件入口與匯出鏈路。
5. 全域註冊、配置與服務掛載的總體流程。
6. 共用能力、樣式、型別與建置表面的定位。
7. 通用源碼閱讀流程。
8. 元件庫核心設計原則。

應移到後續章節深入的內容：

| 內容 | 後續章節 |
| --- | --- |
| `install`、全域註冊、按需引入與全域服務細節 | `04-plugin-system/` |
| `utils/`、`mixins/`、跨元件共用邏輯 | `05-shared-logic/` |
| Props、Emits、Slots、Instance、型別宣告 | `06-public-api-and-type-system/` |
| `Icon`、`Button`、`Divider` 等基礎元件 | `07-basic-components/` |
| 容器與版面元件 | `08-layout-and-containers/` |
| 表單、資料展示、浮層等高複雜元件 | `10-*`、`11-*`、`12-*` |
| Less、變數、mixins、BEM 與樣式覆蓋策略 | `17-style-system/` |
| 測試與建置發布細節 | `18-testing/`、`19-build-release/` |

這個邊界很重要。架構章節要讓你知道該往哪裡查，而不是把後續章節的所有細節提前塞進來。

## 完成標準

完成 `03-architecture/` 後，你至少應該能做到以下幾件事。

第一，不打開複雜元件，也能說明 View UI Plus 的工程骨架。這裡要分清楚兩條線：套件消費線先看 `package.json` 指向的 `dist` 與 `types`，源碼閱讀線再從 `src/index.js` 往內追。

```txt
package.json
  -> main: dist/viewuiplus.min.js
  -> typings: types/index.d.ts

vite.config.js
  -> build.lib.entry: src/index.js

src/index.js
  -> src/components/index.js
  -> src/components/*

src/styles/index.less
  -> dist/styles/viewuiplus.css

types/index.d.ts
  -> TypeScript 使用者型別入口

build scripts
  -> dist/
```

第二，能從 source entry 追到單一元件：

```txt
src/index.js
  -> src/components/index.js
  -> src/components/button/index.js
  -> src/components/button/button.vue
```

第三，能解釋 `install` 的分工：

- locale / i18n 初始化。
- 元件與別名註冊。
- 指令註冊。
- `$VIEWUI` 全域配置。
- `$Message`、`$Modal` 等全域服務。
- TypeScript 全域屬性補充。

第四，能根據元件型態決定閱讀方式：

- 普通元件看 props、slot、event、class、style、type。
- 複合元件看父子狀態。
- 命令式服務看實例生命週期與全域掛載。
- 浮層元件看定位、轉移、關閉與層級管理。

第五，能分清 runtime、style、type、build surface：

- runtime：`src/index.js`、`src/components/*`
- style：`src/styles/`
- type：`types/`
- build：`package.json`、`vite.config.js`、`dist/`

## 後續閱讀路線

完成本章後，建議依以下順序繼續：

1. `04-plugin-system/`：深入 `install`、全域註冊、按需引入與全域服務。
2. `05-shared-logic/`：整理 `utils/`、`mixins/` 與跨元件共用邏輯。
3. `06-public-api-and-type-system/`：分析 Props、Emits、Slots、Instance 與型別宣告。
4. `07-basic-components/`：從 `Icon`、`Button`、`Divider` 建立單一元件閱讀能力。
5. `17-style-system/`：回頭深入 Less、變數、mixins、BEM 與樣式覆蓋策略。

這個順序的目的，是先把入口、共用邏輯與型別系統打穩，再讀具體元件，最後回到樣式系統做橫向整理。

## Runtime / Type / 樣式 / 文件落差

架構章節本身不應新增未經具體元件支持的 runtime 行為判斷。它只建立檢查框架：

1. 任何 runtime 結論都要能回到 `src/index.js`、`src/components/*` 或共用邏輯檔。
2. 任何型別結論都要能回到 `types/`。
3. 任何樣式結論都要能回到 `src/styles/`。
4. 任何建置或發布結論都要能回到 `package.json`、`vite.config.js` 或 `dist/`。
5. 如果後續發現 atomic 內容有來源不足或技術錯誤，應回到 atomic review，不要在正式筆記中自行補成來源事實。

## 設計啟發

架構章節最重要的遷移價值，是提供一套讀元件庫與設計元件庫的檢查表：

1. 是否有穩定公開入口？
2. 是否有集中公開元件清單？
3. 單一元件是否有穩定入口與可拆分內部結構？
4. 全域配置與全域服務是否清楚？
5. 共用能力是否有集中位置？
6. 樣式入口是否統一？
7. 型別入口是否能補足 runtime API？
8. 建置產物是否和使用者消費路徑一致？

這些問題可以直接轉成後續仿寫、企業封裝與 review 的檢查題。

## 複習題

1. 使用者執行 `app.use(ViewUIPlus)` 時，從入口到註冊的完整流程是什麼？
2. 如果要新增一個元件，至少需要考慮哪些入口、樣式、型別與範例位置？
3. 普通元件、複合元件、命令式服務的閱讀方式有什麼差異？
4. 為什麼元件庫的架構分析必須同時看 JS、Less、types、dist？
5. 哪些內容應該留在 `03-architecture/`，哪些內容應該移到後續章節？
