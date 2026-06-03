# 03-architecture

本章用來建立 View UI Plus 的整體架構視角。

在閱讀任何單一元件之前，先理解這套元件庫如何組織專案、拆分模組、集中匯出、註冊到 Vue App、提供全域服務、串接樣式與型別。這樣後面閱讀 Button、Form、Table、Modal、Message 等元件時，才知道每個檔案在整個系統中的位置。

## 閱讀目標

- 看懂 View UI Plus 的專案目錄與各資料夾責任。
- 理解元件庫的入口設計與模組匯出方式。
- 理解 `app.use(ViewUIPlus)` 背後的全域註冊流程。
- 建立元件分類地圖，知道不同元件應該到哪一章繼續深入。
- 形成一套可重複使用的源碼追蹤方法。

## 正式筆記閱讀順序

| 順序 | 筆記 | 學習重點 |
| --- | --- | --- |
| 1 | [專案結構與架構分層地圖](./01-project-structure-and-layer-map.md) | 建立專案責任分區、六層架構與入口到實作的追蹤路線 |
| 2 | [元件分類與學習路線](./02-component-taxonomy-and-learning-path.md) | 判斷元件型態，安排普通元件、複合元件、服務與浮層元件的閱讀順序 |
| 3 | [套件入口與元件匯出鏈](./03-package-entry-and-export-chain.md) | 看懂 package 入口、`src/index.js`、`components/index.js` 與型別入口的串接方式 |
| 4 | [全域註冊、全域配置與服務掛載](./04-global-registration-config-and-services.md) | 拆解 `app.use(ViewUIPlus)` 的元件註冊、指令註冊、全域配置與全域服務 |
| 5 | [共用能力、樣式、型別與建置表面](./05-shared-style-type-and-build-surfaces.md) | 對齊 runtime、style、type、build 這些支撐元件庫的非元件層 |
| 6 | [源碼閱讀流程與元件實作模式](./06-source-reading-workflow-and-component-patterns.md) | 建立可重複使用的源碼閱讀流程，分辨不同元件實作模式 |
| 7 | [元件庫核心設計原則與取捨](./07-core-design-principles.md) | 統整入口簡化、結構拆分、集中匯出、全域配置、樣式一致性、型別體驗與相容性取捨 |
| 8 | [架構複習與後續閱讀路線](./08-architecture-review-and-next-steps.md) | 複習本章架構主線，確認完成標準並銜接後續章節 |

## 來源與草稿資料

以下資料保留在 `origin/`，作為正式筆記的原始資料追溯來源：

1. [專案結構總覽](./origin/01-project-structure.md)
2. [模組分層分析](./origin/02-module-layers.md)
3. [元件分類地圖](./origin/03-component-taxonomy.md)
4. [入口設計分析](./origin/04-entry-design.md)
5. [全域註冊流程](./origin/05-registration-flow.md)
6. [源碼閱讀地圖](./origin/06-source-reading-map.md)
7. [核心設計思想](./origin/07-core-design-principles.md)
8. [架構總結](./origin/08-architecture-summary.md)

`atomic/` 則保留正式筆記生成前的切分、補強與 review 草稿，適合在需要追溯段落來源或檢查重構脈絡時回看。

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
