# 08-layout-and-containers

本目錄存放 View UI Plus 的版面與容器類元件分析。這裡的元件不只負責「畫一個區塊」，更常負責建立父子結構、控制內容排列、提供插槽承載區域，或把 DOM 測量與響應式狀態轉成穩定的排版能力。

建議在讀完基礎元件後進入本章，因為 Grid、Layout、Card、Collapse、Space 會把前一章看到的 props、slots、class、style 模式，放進更明顯的父子協作與頁面結構情境。

## 閱讀順序

| 順序 | 筆記 | 學習重點 |
| --- | --- | --- |
| 1 | [版面與容器元件總覽](./01-layout-and-containers-overview.md) | 建立本章元件分類與源碼閱讀方法 |
| 2 | [Row 與 Col 格線系統](./02-row-and-col-grid-system.md) | 分析 `Row` / `Col` 如何用 `provide/inject`、`gutter`、響應式 class 與 flex 組成 24 欄格線 |
| 3 | [Grid 與 GridItem 宮格容器](./03-grid-and-grid-item.md) | 拆解 `Grid` / `GridItem` 的父子設定共享、等寬等高計算與 resize 偵測 |
| 4 | [Layout 與 Sider 頁框結構](./04-layout-header-content-footer-sider.md) | 分析 `Layout`、`Header`、`Content`、`Footer`、`Sider` 的結構分工、收合與斷點行為 |
| 5 | [Card 內容容器](./05-card-container.md) | 分析卡片如何組合標題、附加操作、主內容、陰影邊框與 link 行為 |
| 6 | [Collapse 與 Panel 折疊容器](./06-collapse-and-panel.md) | 分析 active key、手風琴模式、面板索引、transition 與父子通訊 |
| 7 | [Space 間距容器](./07-space-layout.md) | 分析 render function、空節點過濾、gap、split slot 與全域預設值 |
| 8 | [版面與容器元件設計檢查清單](./08-layout-container-design-checklist.md) | 整理仿寫容器元件時可重複使用的設計檢查流程 |

## 原始碼主線

主要對照這幾個位置：

- `01-origin/source/view-ui-plus-v1.3.20/src/components/row/`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/col/`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/grid/`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/layout/`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/card/`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/collapse/`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/space/`
- `01-origin/source/view-ui-plus-v1.3.20/types/`
- `01-origin/source/view-ui-plus-v1.3.20/src/styles/components/`

## 本章邊界

本章只分析負責頁面骨架、區塊排列、內容承載與折疊展開的元件。

- Button、Icon、Divider、Tag、Badge、Avatar 放在 `07-basic-components/`。
- Menu、Tabs、Breadcrumb、Dropdown 放在 `09-navigation-components/`。
- Input、Select、Checkbox、Radio、Upload 放在 `10-form-and-input-components/`。
- Table、Tree、List、Timeline 放在 `11-data-display-components/`。
- Modal、Drawer、Tooltip、Message、Notice 放在 `12-feedback-and-overlays/`。

## 學完後要能回答

- `Row` 為什麼要把自身實例提供給 `Col`，而不是讓每個 `Col` 自己接收 `gutter`？
- `Col` 的響應式 props 如何映射成 class，`flex` 又為什麼適合用 inline style？
- `GridItem` 如何根據父層 `Grid` 的設定與自身寬度計算正方形高度？
- `Layout` 如何判斷是否包含 `Sider`，`Sider` 又如何處理 `v-model`、斷點與 trigger？
- `Card` 如何用 slot presence 決定是否渲染 head 和 extra？
- `Collapse` 為什麼要把 active key 統一轉成字串陣列？
- `Space` 為什麼需要過濾空 VNode，並用 render function 包裝每個子節點？
- 如何從 runtime、`.d.ts`、less class 一起判斷容器元件的公開契約？
