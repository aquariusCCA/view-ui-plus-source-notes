# Source System Map

本筆記用來建立 `View UI Plus` 的完整源碼系統地圖。

目的不是一開始全部深入，而是先知道整套元件庫除了元件之外，還有哪些重要系統。

## 一、元件系統

元件系統是目前學習主線。

### 核心關注

- 元件目錄結構
- props 設計
- emits 設計
- slots 設計
- v-model 設計
- 內部狀態
- class name 組裝
- 樣式狀態
- 事件處理
- 與其他元件的關聯

### 代表元件

```text
Button
Input
Select
Modal
Form
Table
Upload
DatePicker
Tree
Menu
```

## 二、樣式系統

樣式系統決定元件庫的視覺一致性與可維護性。

### 核心關注

- CSS / SCSS 目錄結構
- 變數設計
- mixins
- class 命名規則
- size / type / disabled / active 樣式
- theme 設計
- 樣式如何被打包與引入

### 適合搭配

```text
Button
Icon
Tag
Input
Alert
Modal
```

## 三、指令系統

指令系統通常用來處理 DOM 行為、事件監聽與元件外部互動。

### 核心關注

- directive 定義方式
- directive 註冊方式
- mounted / updated / unmounted
- click outside
- resize / scroll 監聽
- transfer / portal 類邏輯
- DOM 操作與 Vue 狀態的邊界

### 適合搭配

```text
Select
Dropdown
Tooltip
Poptip
Modal
Drawer
```

## 四、插件系統

插件系統決定使用者如何透過 `app.use()` 使用整套元件庫。

### 核心關注

- install 方法
- app.use()
- 全域元件註冊
- 全域方法掛載
- 全域配置
- Message / Notice 函式式 API
- locale / size / zIndex 等全域設定

### 適合搭配

```text
Button install
Message
Notice
Modal
全域配置
```

## 五、公開 API 與型別系統

公開 API 與型別系統決定一套元件庫是否容易被使用、維護與擴充。

### 核心關注

- 元件 export
- props type
- emits type
- slot type
- public instance methods
- composable type
- declaration files
- API 文件與型別是否一致

### 適合搭配

```text
Button
Input
Select
Form
Table
```

## 六、建置與發布流程

建置與發布流程決定元件庫如何從源碼變成可被 npm 安裝的套件。

### 核心關注

- package scripts
- build tools
- bundle output
- ESM / CJS / UMD 產物
- CSS 產物
- type declaration 產物
- tree-shaking
- package.json exports
- peerDependencies
- npm publish 流程
- changelog / version 管理

## 七、文件與示例系統

文件與示例系統可以幫助理解元件對外 API 與使用情境。

### 核心關注

- 官方文件如何組織
- demo 如何撰寫
- API 表格如何維護
- 文件與源碼是否一致
- 文件如何被建置
- 示例如何驗證元件功能

## 八、測試系統

測試系統用來驗證元件行為是否穩定。

### 核心關注

- 單元測試
- 元件測試
- 互動測試
- 邊界條件
- 表單驗證測試
- DOM 行為測試

## 總體地圖

```text
View UI Plus
├─ 元件系統
├─ 樣式系統
├─ 指令系統
├─ 插件系統
├─ 公開 API 與型別系統
├─ 建置與發布流程
├─ 文件與示例系統
└─ 測試系統
```

## 學習優先級

| 系統 | 優先級 | 理由 |
|---|---|---|
| 元件系統 | 高 | 目前主線，最容易實作驗證 |
| 樣式系統 | 高 | 幾乎所有元件都會碰到 |
| 公開 API 與型別系統 | 高 | 直接影響元件設計能力 |
| 插件系統 | 中 | 理解元件庫如何被使用 |
| 指令系統 | 中 | 浮層、下拉、彈窗會用到 |
| 建置與發布流程 | 中低 | 重要但不適合太早深入 |
| 文件與示例系統 | 中低 | 輔助理解使用情境 |
| 測試系統 | 低 | 等仿寫穩定後再補 |
