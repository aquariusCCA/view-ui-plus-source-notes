# Phase Plan

本筆記用來整理 `View UI Plus` 源碼學習的三個階段。

## Phase 1：01-clone-practice

第一階段是目前最重要的階段。

目標是先仿寫一批 View UI Plus 元件，透過實作理解元件設計。

### 核心目標

- 理解元件基本結構
- 理解 props 設計
- 理解 events / emits 設計
- 理解 slots 設計
- 理解 class name 與樣式規則
- 理解 disabled、size、type、loading 等常見狀態
- 能做出簡化版元件

### 適合元件

初期可以從以下元件開始：

- Button
- Icon
- Tag
- Alert
- Input
- Radio
- Checkbox
- Switch
- Select
- Modal

### 產出

- `apps/01-clone-practice/` 中有可執行元件
- `docs/` 中有對應學習筆記
- `roadmap/03-progress-tracker.md` 有進度紀錄

### 暫時不要做

- 不急著重構
- 不急著抽取大型共用邏輯
- 不急著做企業級封裝
- 不急著看完整套 View UI Plus

---

## Phase 2：02-refactor-practice

第二階段是在完成一批元件仿寫後，回頭整理重複邏輯並練習重構。

### 進入條件

建議至少完成 8 到 10 個元件仿寫後，再進入此階段。

### 核心目標

- 找出多個元件之間的重複邏輯
- 抽取共用 hooks / composables
- 抽取共用 props 設計
- 抽取共用 class name 組裝邏輯
- 改善元件可維護性
- 練習更清楚的元件內部結構

### 可能重構方向

- size 狀態共用
- disabled 狀態共用
- loading 狀態共用
- class name 組裝
- form item 關聯邏輯
- controlled / uncontrolled 狀態設計
- emits 設計規則

### 產出

- `apps/02-refactor-practice/` 中有重構後版本
- `docs/` 中有重構前後比較筆記

---

## Phase 3：03-enterprise-wrapper

第三階段是企業級二次封裝。

這個階段不是重新做一套元件庫，而是練習如何根據公司業務場景，在既有元件基礎上設計更好用的業務元件。

### 進入條件

建議已經完成：

- 一批元件仿寫
- 一批重構練習
- 對常見元件 API 設計有基本理解

### 核心目標

- 練習業務元件 API 設計
- 練習封裝常見表單場景
- 練習封裝查詢條件區
- 練習封裝表格操作區
- 練習降低業務頁面的重複程式碼
- 練習兼顧可用性、彈性與維護性

### 可能封裝方向

- EnterpriseButton
- SearchForm
- QueryPanel
- DataTable
- FormDialog
- DetailDrawer
- PermissionButton
- StatusTag

### 產出

- `apps/03-enterprise-wrapper/` 中有業務封裝元件
- `docs/` 中有 API 設計與封裝思路筆記

---

## 階段總結

```text
01-clone-practice
= 先做出來，理解元件怎麼設計。

02-refactor-practice
= 做多了之後，整理重複邏輯，改善維護性。

03-enterprise-wrapper
= 面向業務場景，設計更好用的二次封裝元件。
```
