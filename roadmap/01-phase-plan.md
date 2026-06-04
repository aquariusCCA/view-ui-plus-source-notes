# Phase Plan

本筆記整理 View UI Plus 源碼學習的三個階段。

## Phase 1：01-clone-practice

第一階段是目前主線。

目標是先仿寫一批元件，透過實作理解元件庫的基本設計。

### 核心任務

- 閱讀單一元件源碼
- 拆解 props、emits、slots
- 理解 v-model 設計
- 理解樣式 class 組裝
- 理解 disabled、size、type、loading 等狀態
- 實作簡化版元件
- 補充正式筆記到 `docs/`

### 建議元件

第一批：

- Button
- Icon
- Tag
- Alert
- Badge

第二批：

- Input
- Radio
- Checkbox
- Switch
- Select

### 第一階段順便觀察

雖然主線是元件，但可以順便觀察：

- 元件如何引入樣式
- 元件如何 export
- 元件如何 install
- props 型別如何定義
- emits 型別如何定義
- 是否依賴 directive
- 是否依賴全域配置

這些觀察可以先放到 `06-backlog.md`，不用立刻深入。

### 第一階段完成條件

建議條件：

- 至少完成 8 到 10 個元件仿寫
- 至少包含 Button、Input、Select
- 每個元件都有可執行 demo
- 每個元件都有一份基本源碼筆記
- 能說明元件的 props、emits、slots 與主要狀態

---

## Phase 2：02-refactor-practice

第二階段是重構練習。

當完成一批元件仿寫後，再回頭看哪些邏輯可以整理成共用設計。

### 核心任務

- 比較多個元件的重複邏輯
- 抽取共用 props
- 抽取 class name 組裝規則
- 抽取 composables / hooks
- 整理元件狀態規則
- 改善程式碼可維護性

### 適合重構的主題

- size
- disabled
- loading
- type
- class name
- slot fallback
- form item 關聯
- group 元件通訊
- visible 控制

### 第二階段應搭配的副線

- 樣式系統
- 公開 API 與型別系統
- 插件系統

### 第二階段產出

- `apps/02-refactor-practice/`
- 重構前後比較筆記
- 共用邏輯整理筆記

---

## Phase 3：03-enterprise-wrapper

第三階段是企業級二次封裝。

目標不是重寫 View UI Plus，而是練習如何根據公司業務場景，在既有元件基礎上封裝更好用的業務元件。

### 核心任務

- 設計業務元件 API
- 封裝常見查詢條件
- 封裝常見表單場景
- 封裝表格操作區
- 降低業務頁面重複程式碼
- 兼顧彈性與維護性

### 候選元件

- SearchForm
- QueryPanel
- DataTable
- FormDialog
- DetailDrawer
- PermissionButton
- StatusTag
- AmountInput
- DateRangeSearch

### 第三階段產出

- `apps/03-enterprise-wrapper/`
- 企業元件 API 設計筆記
- 業務場景封裝案例

---

## 總結

```text
01-clone-practice
= 先做出來，理解元件本身。

02-refactor-practice
= 做多後，抽取共用邏輯。

03-enterprise-wrapper
= 面向業務場景做二次封裝。
```
