# Topic Roadmap

本筆記用來追蹤非元件主題的學習路線。

這些主題不是第一階段主線，但它們是理解完整元件庫不可缺少的部分。

## 一、樣式系統

### 學習目標

理解 View UI Plus 如何組織樣式、命名 class、處理狀態與主題。

| 主題 | 優先級 | 狀態 | 建議搭配 |
|---|---|---|---|
| class 命名規則 | 高 | 未開始 | Button / Tag / Alert |
| size 狀態樣式 | 高 | 未開始 | Button / Input |
| type 狀態樣式 | 高 | 未開始 | Button / Alert |
| disabled 狀態樣式 | 高 | 未開始 | Button / Input / Select |
| SCSS 變數 | 中 | 未開始 | 樣式總覽 |
| mixins | 中 | 未開始 | 多元件比較 |
| theme 架構 | 低 | 未開始 | 中後期 |
| 樣式打包輸出 | 中低 | 未開始 | 建置流程 |

## 二、指令系統

### 學習目標

理解 View UI Plus 如何用指令處理 DOM 行為與元件外部互動。

| 主題 | 優先級 | 狀態 | 建議搭配 |
|---|---|---|---|
| directive 註冊方式 | 中 | 未開始 | 指令總覽 |
| click outside | 高 | 未開始 | Select / Dropdown |
| resize / scroll 監聽 | 中 | 未開始 | Tooltip / Poptip |
| transfer / portal 類邏輯 | 中 | 未開始 | Modal / Drawer |
| directive 生命週期 | 中 | 未開始 | 任一指令 |

## 三、插件系統

### 學習目標

理解元件庫如何被 `app.use()` 安裝，以及元件、全域方法、全域配置如何被註冊。

| 主題 | 優先級 | 狀態 | 建議搭配 |
|---|---|---|---|
| install 方法 | 高 | 未開始 | Button |
| app.use() 流程 | 高 | 未開始 | 全域註冊 |
| 單一元件註冊 | 高 | 未開始 | Button / Input |
| 全量元件註冊 | 中 | 未開始 | 入口檔 |
| 全域配置 | 中 | 未開始 | locale / size |
| Message / Notice 函式式 API | 中 | 未開始 | Message / Notice |

## 四、公開 API 與型別系統

### 學習目標

理解元件庫如何設計對外 API，並透過 TypeScript 提供使用者提示與約束。

| 主題 | 優先級 | 狀態 | 建議搭配 |
|---|---|---|---|
| props 型別 | 高 | 未開始 | Button / Input |
| emits 型別 | 高 | 未開始 | Tag / Input |
| v-model 型別 | 高 | 未開始 | Input / Switch |
| slot 型別 | 中 | 未開始 | Card / Table |
| public methods | 中 | 未開始 | Form / Modal |
| 元件 export | 高 | 未開始 | Button install |
| declaration 輸出 | 中低 | 未開始 | 建置流程 |
| API 文件對照 | 中 | 未開始 | docs 與 source 對比 |

## 五、建置與發布流程

### 學習目標

理解 View UI Plus 如何從源碼變成可被 npm 安裝與使用的套件。

| 主題 | 優先級 | 狀態 | 建議時機 |
|---|---|---|---|
| package scripts | 中 | 未開始 | 完成數個元件後 |
| build command | 中 | 未開始 | 中期 |
| bundle output | 中 | 未開始 | 中期 |
| style output | 中 | 未開始 | 研究樣式系統後 |
| type declaration output | 中 | 未開始 | 研究型別系統後 |
| package.json exports | 中 | 未開始 | 中後期 |
| peerDependencies | 中低 | 未開始 | 中後期 |
| npm publish 流程 | 低 | 未開始 | 後期 |
| changelog / version | 低 | 未開始 | 後期 |

## 六、文件與示例系統

### 學習目標

理解官方文件如何展示元件 API、demo 與使用場景。

| 主題 | 優先級 | 狀態 | 建議搭配 |
|---|---|---|---|
| demo 結構 | 中 | 未開始 | 任一元件 |
| API 文件格式 | 中 | 未開始 | Button / Input |
| 文件與源碼對照 | 中 | 未開始 | 元件閱讀 |
| 文件建置流程 | 低 | 未開始 | 建置流程後 |

## 七、測試系統

### 學習目標

理解元件庫如何驗證元件行為。

| 主題 | 優先級 | 狀態 | 建議時機 |
|---|---|---|---|
| 測試工具 | 低 | 未開始 | 中後期 |
| 元件渲染測試 | 低 | 未開始 | 仿寫後 |
| 事件測試 | 低 | 未開始 | Input / Button |
| 表單驗證測試 | 低 | 未開始 | Form |
| 邊界條件測試 | 低 | 未開始 | 複雜元件 |

## 推進原則

非元件主題不用一次全部學完。

建議採用：

```text
元件主線推進
  ↓
遇到相關系統時做輕量觀察
  ↓
累積到一定程度再整理成正式筆記
```

例子：

```text
學 Button
→ 順便觀察 class 命名、props 型別、install

學 Select
→ 順便觀察 click outside、dropdown、浮層

學 Message
→ 順便觀察插件系統、函式式 API、動態掛載
```
