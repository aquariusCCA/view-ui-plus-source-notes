# 整體學習路線

這份路線的目標不是快速學會使用 View UI Plus，而是透過源碼閱讀建立一套可遷移的元件庫設計能力。

## 第一輪：建立全局地圖

閱讀目標：

- 確認主線源碼版本與本地路徑。
- 看懂專案目錄結構、入口檔、元件分類與建置產物。
- 理解 View UI Plus 作為 Vue 3 元件庫的基本分層。

主要輸出：

- `01-origin/source-record.md`
- `03-architecture/README.md`
- 專案結構與模組分層筆記

完成標準：

- 能說明元件庫從入口到元件註冊的大致路徑。
- 能區分元件、插件、工具函數、樣式與型別所在位置。

## 第二輪：理解公共機制

閱讀目標：

- 理解 `install`、全域註冊與按需引入。
- 理解公共 hooks、utils、directive 與全域服務的角色。
- 理解 Props、Emits、Slots、Instance 與型別導出的設計方式。

主要輸出：

- `04-plugin-system/`
- `05-shared-logic/`
- `06-public-api-and-type-system/`
- `16-directives/`
- `15-utility-components-and-global-services/`

完成標準：

- 能從使用者側 API 追到內部實作。
- 能判斷一段邏輯應該放在元件內、hook、utils 還是全域服務中。

## 第三輪：閱讀基礎元件

閱讀目標：

- 從 Button、Icon、Divider 等低複雜度元件開始。
- 建立一套固定的元件閱讀模板。
- 熟悉 Props 預設值、class 組裝、slot 渲染與事件暴露。

主要輸出：

- `07-basic-components/`
- 元件分析模板
- 基礎元件 API 對照表

完成標準：

- 能不依賴教學逐步拆解一個簡單元件。
- 能說明該元件如何處理外部輸入、內部狀態、渲染輸出與樣式。

## 第四輪：閱讀複合元件

閱讀目標：

- 閱讀 Layout、Menu、Tabs、Form、Select、Table、Tree、Modal 等複合元件。
- 理解父子元件協作、狀態同步、上下文傳遞與可擴展 API。
- 比較不同類型元件的設計取捨。

主要輸出：

- `08-layout-and-containers/`
- `09-navigation-components/`
- `10-form-and-input-components/`
- `11-data-display-components/`
- `12-feedback-and-overlays/`

完成標準：

- 能畫出複合元件的子元件結構與資料流。
- 能指出複雜元件中的核心抽象與邊界條件。

## 第五輪：閱讀文字與排版元件

閱讀目標：

- 閱讀 Typography、Title、Text、Paragraph、Link 與 Ellipsis 等文字元件。
- 理解 copyable、editable、ellipsis、line clamp 等文字能力如何組合 Tooltip、Input、Copy 與 DOM 測量。
- 區分純文字排版元件、資料展示元件與業務元件的分類邊界。

主要輸出：

- `14-typography-and-text/`
- `05-shared-logic/07-link-behavior.md`
- 文字與排版元件 API 對照表

完成標準：

- 能說明 Typography 家族如何共用基底能力並分化成不同語意元件。
- 能拆解文字省略、可複製、可編輯能力的狀態來源、互動入口與外部依賴。
- 能判斷 Typography、Ellipsis、WordCount、Time、Numeral 應該放在文字排版章，而不是資料展示或業務元件章。

## 第六輪：樣式、測試、建置與發布

閱讀目標：

- 理解 SCSS 結構、變數、命名規則與主題擴展。
- 理解元件測試與回歸測試的基本策略。
- 理解打包、型別產物、按需引入與 npm 發布流程。

主要輸出：

- `17-style-system/`
- `18-testing/`
- `19-build-release/`

完成標準：

- 能追蹤一個元件 class 對應到哪份樣式。
- 能說明元件庫如何從源碼變成可被使用者安裝的套件。

## 第七輪：仿寫與企業封裝

閱讀目標：

- 把源碼閱讀結果轉化為小型仿寫。
- 基於 View UI Plus 設計企業後台常見二次封裝。
- 將 SearchForm、CrudTable、BusinessModal 等業務元件拆成可維護結構。

主要輸出：

- `13-pro-and-business-components/`
- `20-imitation/`
- `21-enterprise-wrappers/`
- `22-review-and-practice/`

完成標準：

- 能仿寫一個簡化版基礎元件。
- 能基於 View UI Plus 設計符合企業後台需求的二次封裝 API。
