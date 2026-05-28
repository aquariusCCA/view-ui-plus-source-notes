# 18-testing

本目錄存放 View UI Plus 的測試系統分析。這一章不只看「測試怎麼寫才會過」，而是整理元件庫如何用測試守住公開 API、DOM 結構、互動事件、非同步流程、全域服務、邊界條件與回歸案例。

View UI Plus v1.3.20 的測試目錄帶有明顯歷史痕跡：套件主體已經走向 Vue 3，但 `test/unit/` 中仍保留不少 Vue 2 風格的 `new Vue()`、`Vue.use()`、Karma、Mocha、Chai、sinon-chai 與 webpack 測試入口。閱讀時不要只問「這是不是今天的新寫法」，更要看它如何把元件庫測試拆成可重複的測試模型。

## 閱讀順序

| 順序 | 筆記 | 學習重點 |
| --- | --- | --- |
| 1 | [測試系統總覽](./01-testing-overview.md) | 建立元件庫測試分層、測試目標、穩定契約與原始碼閱讀路線 |
| 2 | [Karma、Mocha、Chai 測試環境](./02-test-environment-karma-mocha-chai.md) | 分析 `karma.conf.js`、`index.js`、ChromeHeadless、webpack 與 coverage |
| 3 | [測試工具與 Vue instance factory](./03-test-utils-and-vue-instance-factory.md) | 分析 `createVue`、`createTest`、`destroyVM`、`triggerEvent`、`waitForIt` |
| 4 | [元件渲染與 props 測試](./04-component-render-and-props-testing.md) | 整理 props、class、DOM、slot、狀態 class 與渲染結果的測試方式 |
| 5 | [事件、v-model 與使用者互動測試](./05-events-v-model-and-user-interaction-testing.md) | 分析 click、focus、change、keyboard、emit、`on-change` 與雙向綁定 |
| 6 | [非同步、計時器與服務式 API 測試](./06-async-timer-and-service-testing.md) | 分析 `nextTick`、輪詢等待、duration、全域 `$Message` 類服務與 DOM 清理 |
| 7 | [表單、輸入與驗證測試](./07-form-input-and-validation-testing.md) | 整理 Input、Select、DatePicker、Form 驗證與輸入邊界案例 |
| 8 | [資料展示與複雜元件測試](./08-data-display-and-complex-component-testing.md) | 分析 Table、Select、DatePicker 這類資料、狀態與子元件很多的測試策略 |
| 9 | [邊界條件、回歸與 bugfix 測試設計](./09-boundary-regression-and-bugfix-test-design.md) | 建立從 issue、bugfix、特殊資料與狀態重置反推測試案例的方法 |
| 10 | [覆蓋率與測試維護](./10-coverage-and-test-maintenance.md) | 分析 coverage 的用途、脆弱測試、清理策略與測試重構 |
| 11 | [現代測試遷移筆記](./11-modern-testing-migration-notes.md) | 從 Karma / Vue 2 風格遷移到 Vue 3、Vitest、Vue Test Utils 的設計對照 |
| 12 | [元件庫測試設計檢查清單](./12-testing-design-checklist.md) | 整理仿寫或維護 UI 元件庫測試時可重複使用的檢查流程 |

## 原始碼主線

主要對照這幾個位置：

- `01-origin/source/view-ui-plus-v1.3.20/test/unit/index.js`
- `01-origin/source/view-ui-plus-v1.3.20/test/unit/util.js`
- `01-origin/source/view-ui-plus-v1.3.20/test/unit/karma.conf.js`
- `01-origin/source/view-ui-plus-v1.3.20/test/unit/specs/`
- `01-origin/source/view-ui-plus-v1.3.20/test/unit/specs/assets/`
- `01-origin/source/view-ui-plus-v1.3.20/package.json`
- `01-origin/source/view-ui-plus-v1.3.20/build/webpack.test.config.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/`
- `01-origin/source/view-ui-plus-v1.3.20/src/utils/`
- `01-origin/source/view-ui-plus-v1.3.20/types/`

## 本章邊界

本章聚焦測試設計與測試系統，不重複分析每個元件的完整實作。

- 元件 props、events、slots 的 API 設計可回看 `06-public-api-and-type-system/`；本章只看測試如何驗證這些契約。
- Button、Select、Table、Modal、DatePicker 等元件的完整閱讀可回看各元件章節；本章只抽出它們的測試模式。
- Build 與 release 可回看 `19-build-release/`；本章只分析測試入口、coverage 與測試命令對交付流程的意義。
- 現代化測試工具屬於延伸設計。View UI Plus v1.3.20 原始測試仍以 Karma / Mocha 為主，不要誤讀成已完整採用 Vitest 或 Vue Test Utils。

## 學完後要能回答

- 元件庫測試和一般頁面業務測試最大的差異是什麼？
- `test/unit/index.js` 為什麼要用 `require.context()` 載入 spec？
- `createVue` 和 `createTest` 分別適合測什麼？
- 為什麼每個 spec 都要在 `afterEach` 呼叫 `destroyVM()`？
- 測 props 時，什麼情況可以看 class，什麼情況應該看事件或公開狀態？
- Select、DatePicker 這種複雜元件為什麼常需要 `waitForIt()` 或多次 `nextTick()`？
- Message 這類全域服務測試為什麼不能只看回傳值？
- Table 匯出 CSV 的測試為什麼屬於行為契約，而不是純 DOM 測試？
- 邊界條件測試如何從 bugfix、特殊字元、空值、重置流程與 locale 推導？
- coverage 數字可以提醒什麼，又不能保證什麼？
- 如果要把這套測試遷移到 Vitest / Vue Test Utils，哪些測試意圖必須保留？
