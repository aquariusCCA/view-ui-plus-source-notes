# 09-navigation-components

本目錄存放 View UI Plus 的導航類元件分析。這裡的元件負責處理「目前在哪裡」、「可以去哪裡」與「切換時狀態如何同步」，包括層級選單、頁籤、麵包屑、分頁、錨點、下拉命令選單、流程步驟與頁頭導航。

建議在讀完基礎元件與容器元件後進入本章，因為導航元件會把 props、emits、slots、父子通訊、link mixin、浮層、DOM 測量與型別宣告放進更完整的互動場景。

## 閱讀順序

| 順序 | 筆記 | 學習重點 |
| --- | --- | --- |
| 1 | [導航類元件總覽](./01-navigation-components-overview.md) | 建立本章元件分類、狀態模型與源碼閱讀方法 |
| 2 | [Menu、Submenu 與 MenuItem](./02-menu-submenu-menu-item.md) | 分析層級選單、active/open 狀態、父子註冊、手風琴與水平浮層 |
| 3 | [Tabs 與 TabPane](./03-tabs-and-tab-pane.md) | 拆解 pane 註冊、`v-model`、ink bar、可關閉 tab、鍵盤、右鍵選單與拖曳 |
| 4 | [Breadcrumb 與 BreadcrumbItem](./04-breadcrumb-and-breadcrumb-item.md) | 分析 separator、link mixin、slot 覆蓋與路徑提示語意 |
| 5 | [Page 分頁](./05-page-pagination.md) | 分析 current、page size、total、快速跳頁、每頁筆數與事件同步 |
| 6 | [Anchor 與 AnchorLink](./06-anchor-and-anchor-link.md) | 分析 hash、scroll container、active link、ink 位置與 listener 清理 |
| 7 | [Dropdown、DropdownMenu 與 DropdownItem](./07-dropdown-dropdown-menu-item.md) | 分析 trigger、浮層、click outside、巢狀下拉與 item click payload |
| 8 | [Steps 與 Step](./08-steps-and-step.md) | 分析流程步驟註冊、current/status 推導、icon/title/content fallback |
| 9 | [PageHeader 頁面頭部](./09-page-header.md) | 分析 Breadcrumb、返回、Tabs、title/action/content/extra 的複合組合 |
| 10 | [導航元件 API 模式](./10-navigation-api-patterns.md) | 整理 active state、父子協作、link/trigger、events、slots 與型別漂移 |
| 11 | [導航元件設計檢查清單](./11-navigation-component-design-checklist.md) | 整理仿寫導航元件時可重複使用的設計檢查流程 |

## 原始碼主線

主要對照這幾個位置：

- `01-origin/source/view-ui-plus-v1.3.20/src/components/menu/`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/tabs/`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/breadcrumb/`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/page/`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/anchor/`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/dropdown/`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/steps/`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/page-header/`
- `01-origin/source/view-ui-plus-v1.3.20/types/`
- `01-origin/source/view-ui-plus-v1.3.20/src/styles/components/`

## 本章邊界

本章只分析負責頁面位置、路徑導引、切換入口與流程導航的元件。

- Row、Col、Layout、Card、Collapse、Space 放在 `08-layout-and-containers/`。
- Input、Select、Checkbox、Radio、Upload 放在 `10-form-and-input-components/`。
- Table、Tree、List、Timeline 放在 `11-data-display-components/`。
- Modal、Drawer、Tooltip、Poptip、Message、Notice 放在 `12-feedback-and-overlays/`。
- Dropdown 在本章分析其導航與命令選單語意；若要深挖浮層定位，可在回饋與浮層章節交叉整理。

## 學完後要能回答

- `Menu` 為什麼要維護 `submenuList` 和 `menuItemList`？
- `Menu` 的 `activeName` 和 `openNames` 狀態流有什麼差異？
- `Tabs` 如何從 `TabPane` 註冊資料產生 nav header？
- `Tabs` 為什麼需要 DOM 測量、resize detector 與 hidden parent 監聽？
- `BreadcrumbItem` 的 link props 從哪裡來，separator slot 如何覆蓋父層設定？
- `Page` 如何讓 `currentPage`、`currentPageSize`、`total` 和 `allPages` 保持一致？
- `Anchor` 如何根據 scroll position 計算目前 active link？
- `Dropdown` 在 hover、click、contextMenu、custom 四種 trigger 下有什麼差異？
- `Steps` 如何根據父層 `current` 推導每個 `Step` 的狀態？
- `PageHeader` 如何組合 Breadcrumb、Tabs、返回與各種內容 slot？
- 如何從 runtime、`.d.ts`、less class 一起判斷導航元件的公開契約？
