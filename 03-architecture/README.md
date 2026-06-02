# 03-architecture

本章用來建立 View UI Plus 的整體架構視角。

在閱讀任何單一元件之前，先理解這套元件庫如何組織專案、拆分模組、集中匯出、註冊到 Vue App、提供全域服務、串接樣式與型別。這樣後面閱讀 Button、Form、Table、Modal、Message 等元件時，才知道每個檔案在整個系統中的位置。

## 閱讀目標

- 看懂 View UI Plus 的專案目錄與各資料夾責任。
- 理解元件庫的入口設計與模組匯出方式。
- 理解 `app.use(ViewUIPlus)` 背後的全域註冊流程。
- 建立元件分類地圖，知道不同元件應該到哪一章繼續深入。
- 形成一套可重複使用的源碼追蹤方法。

## 原始資料列表

以下資料目前存放在 `origin/`，作為後續整理 atomic 與正式筆記的來源：

1. [專案結構總覽](./origin/01-project-structure.md)
2. [模組分層分析](./origin/02-module-layers.md)
3. [元件分類地圖](./origin/03-component-taxonomy.md)
4. [入口設計分析](./origin/04-entry-design.md)
5. [全域註冊流程](./origin/05-registration-flow.md)
6. [源碼閱讀地圖](./origin/06-source-reading-map.md)
7. [核心設計思想](./origin/07-core-design-principles.md)
8. [架構總結](./origin/08-architecture-summary.md)

正式筆記會在 `atomic/` 完成切分與 review 後，再生成到本章根目錄。

## 源碼基準

本章預設閱讀來源：

- 版本：View UI Plus `v1.3.20`
- 本地路徑：`01-origin/source/view-ui-plus-v1.3.20/`
- 來源紀錄：`01-origin/source-record.md`

## 本章邊界

本章只處理「整體架構」問題，不提前深入單一元件的全部細節。

- 插件系統細節放在 `04-plugin-system/`。
- 共用工具、mixins、composables 放在 `05-shared-logic/`。
- Props、Emits、Slots、型別導出放在 `06-public-api-and-type-system/`。
- 具體元件實作分散在 `07-*` 到 `15-*`。
- 樣式系統放在 `17-style-system/`。
- 測試與建置放在 `18-testing/`、`19-build-release/`。
