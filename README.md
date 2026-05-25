# View UI Plus Learning Notes

本專案是我用來系統性學習 `View UI Plus` 的筆記包。

學習目標不是單純「會使用元件」，而是透過閱讀 View UI Plus 的原始碼，理解一套 Vue 3 元件庫在實務工程中的設計方式，包括：

- 元件 API 如何設計
- Props、Emits、Slots 如何組織
- TypeScript 型別如何支援使用者體驗
- 元件庫如何進行全域註冊與按需引入
- 共用邏輯如何抽象成 hooks / composables / utils
- 樣式系統如何管理變數、主題與元件樣式
- 複雜元件如何拆分、組合與維護
- 企業後台如何基於元件庫進行二次封裝

---

## 1. 學習定位

這份筆記包不是 View UI Plus 的使用手冊，而是一套 **源碼閱讀 + 元件設計 + 工程實作 + 企業封裝** 的學習系統。

我希望透過這份筆記，逐步培養以下能力：

| 能力 | 說明 |
| --- | --- |
| Vue 元件設計能力 | 理解元件如何拆分、組合、傳遞狀態與暴露 API。 |
| TypeScript 型別設計能力 | 理解元件庫如何設計 Props、Emits、Instance、型別導出。 |
| 前端工程化能力 | 理解元件庫的目錄結構、打包流程、按需引入與發布流程。 |
| 源碼閱讀能力 | 能夠從入口、註冊、渲染、事件、樣式一路追蹤元件實作。 |
| 企業封裝能力 | 能夠基於 View UI Plus 封裝 SearchForm、CrudTable、BusinessModal 等業務元件。 |
| 重構與抽象能力 | 能夠從重複邏輯中抽出 composable、工具函數與通用元件模式。 |

---

## 2. 目錄結構

```text
view-ui-plus-learning/
  00-roadmap/

  01-origin/
    source/
    docs/
    assets/

  02-notes/
    vue-core/
    typescript/
    engineering/
    source-reading/

  03-architecture/
  04-plugin-system/
  05-shared-logic/
  06-public-api-and-type-system/

  07-basic-components/
  08-layout-and-containers/
  09-navigation-components/
  10-form-and-input-components/
  11-data-display-components/
  12-feedback-and-overlays/
  13-pro-and-business-components/
  14-typography-and-text/
  15-utility-components-and-global-services/

  16-directives/
  17-style-system/
  18-testing/
  19-build-release/

  20-imitation/
  21-enterprise-wrappers/
  22-review-and-practice/
    quizzes/
    flashcards/
    interview-questions/
    source-tracing-exercises/
    refactor-exercises/

  99-prompts/
    system/
    workflows/
    formats/
    requests/
```

---

## 3. 目錄說明

| 目錄                                                 | 作用                                                                                            |
| -------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `00-roadmap/`                                      | 存放整體學習路線、閱讀順序、階段目標與學習進度規劃，是整份筆記包的入口。                                                          |
| `01-origin/`                                       | 存放原始學習材料，包括 View UI Plus 原始碼、官方文件、截圖、範例與外部參考資料。                                               |
| `01-origin/source/`                                | 存放 View UI Plus 原始碼副本或關鍵原始碼片段，方便後續進行源碼閱讀與註解。                                                  |
| `01-origin/docs/`                                  | 存放官方文件、API 文件、元件使用說明或整理後的文件材料。                                                                |
| `01-origin/assets/`                                | 存放圖片、截圖、流程圖、架構圖、元件效果圖等輔助學習資源。                                                                 |
| `02-notes/`                                        | 存放學習過程中需要補強的基礎知識，例如 Vue、TypeScript、工程化與源碼閱讀方法；不直接存放具體元件分析。                                    |
| `02-notes/vue-core/`                               | 存放 Vue 核心知識筆記，例如元件、插槽、`provide/inject`、`h` 函數、響應式、Composition API 等。                          |
| `03-architecture/`                                 | 存放 View UI Plus 整體架構分析，包括專案結構、模組分層、元件分類、入口設計與核心設計思想。                                          |
| `04-plugin-system/`                                | 存放插件系統分析，例如 `install` 機制、全域註冊、按需引入、全域方法與 Vue 插件設計。                                            |
| `05-shared-logic/`                                 | 存放共用邏輯分析，例如工具函數、hooks、composables、共用狀態、DOM 操作與跨元件邏輯抽象。                                        |
| `06-public-api-and-type-system/`                   | 存放公開 API 與型別系統分析，例如 Props、Emits、Slots、Instance 方法、型別導出與使用者側型別體驗。                              |
| `07-basic-components/`                             | 存放基礎元件分析，例如 Button、Icon、Divider 等低複雜度且高復用性的元件。                                                |
| `08-layout-and-containers/`                        | 存放版面與容器類元件分析，例如 Grid、Layout、Card、Collapse、Space 等負責結構排列與內容承載的元件。                              |
| `09-navigation-components/`                        | 存放導航類元件分析，例如 Menu、Tabs、Breadcrumb、Page、Anchor、Dropdown 等負責頁面切換與路徑導引的元件。                       |
| `10-form-and-input-components/`                    | 存放表單與輸入類元件分析，例如 Form、Input、Select、Checkbox、Radio、DatePicker、Upload 等與使用者輸入高度相關的元件。            |
| `11-data-display-components/`                      | 存放資料展示類元件分析，例如 Table、Tree、List、Timeline、Avatar、Badge、Tag 等負責呈現資料與狀態的元件。                       |
| `12-feedback-and-overlays/`                        | 存放回饋與浮層類元件分析，例如 Modal、Drawer、Tooltip、Poptip、Message、Notice、Spin 等負責提示、確認與覆蓋層互動的元件。            |
| `13-pro-and-business-components/`                  | 存放進階或業務型元件分析，例如複合表單、複雜查詢區、進階表格封裝、業務彈窗與企業後台常見封裝模式。                                             |
| `14-typography-and-text/`                          | 存放文字與排版類內容分析，例如 Typography、文字省略、標題、段落、字體層級與內容可讀性設計。                                           |
| `15-utility-components-and-global-services/`       | 存放工具型元件與全域服務分析，例如全域 Message、Notice、Loading、配置提供器、工具方法與跨頁面服務。                                  |
| `16-directives/`                                   | 存放指令系統分析，例如自訂 directive 的設計、生命週期、DOM 操作、點擊外部偵測與權限/行為控制。                                       |
| `17-style-system/`                                 | 存放樣式系統分析，例如 SCSS 結構、變數、主題、BEM 命名、樣式覆蓋策略、暗色模式與設計 token。                                        |
| `18-testing/`                                      | 存放測試相關筆記，例如單元測試、元件測試、測試案例設計、邊界條件與回歸測試策略。                                                      |
| `19-build-release/`                                | 存放建置與發布流程分析，例如 Vite/Rollup 打包、型別產物、按需引入產物、版本管理與 npm 發布流程。                                     |
| `20-imitation/`                                    | 存放仿寫練習，將 View UI Plus 的設計拆成小型可實作案例，用於訓練元件設計與工程實作能力。                                           |
| `21-enterprise-wrappers/`                          | 存放企業級二次封裝練習，例如基於 View UI Plus 封裝 SearchForm、CrudTable、BusinessModal、PermissionButton 等後台常用元件。 |
| `22-review-and-practice/`                          | 存放複習與練習材料，用來將源碼閱讀結果轉化為題目、卡片、面試題與重構訓練。                                                         |
| `22-review-and-practice/quizzes/`                  | 存放選擇題、判斷題、簡答題等測驗，用於檢查 Vue、TypeScript、元件設計與源碼理解程度。                                             |
| `22-review-and-practice/flashcards/`               | 存放記憶卡片，例如核心概念、API 用法、元件設計模式與常見實作技巧。                                                           |
| `22-review-and-practice/interview-questions/`      | 存放面試題整理，例如元件庫設計、Vue 原理、TypeScript 型別設計、工程化與企業封裝問題。                                            |
| `22-review-and-practice/source-tracing-exercises/` | 存放源碼追蹤練習，例如從元件入口追到渲染邏輯、事件處理、共用 hook 與樣式來源。                                                    |
| `22-review-and-practice/refactor-exercises/`       | 存放重構練習，例如將重複邏輯抽成 composable、優化 Props 設計、拆分元件與改善型別安全。                                          |
| `99-prompts/`                                      | 存放 AI 輔助學習提示詞，用於規範筆記重構、源碼分析、題目生成、格式輸出與學習流程。                                                   |
| `99-prompts/system/`                               | 存放系統級提示詞，例如角色設定、筆記風格、教學要求與整體輸出規範。                                                             |
| `99-prompts/workflows/`                            | 存放流程型提示詞，例如源碼閱讀流程、元件分析流程、筆記重構流程與複習流程。                                                         |
| `99-prompts/formats/`                              | 存放格式型提示詞，例如 README 格式、元件分析模板、API 表格模板、練習題模板與總結模板。                                             |
| `99-prompts/requests/`                             | 存放實際請求型提示詞，例如針對某個元件、某篇筆記、某段源碼所使用的具體 AI 請求。                                                    |

---