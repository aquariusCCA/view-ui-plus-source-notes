# Cell / CellGroup 原始碼閱讀筆記

本目錄聚焦 View UI Plus 的 `Cell`、`CellItem` 與 `CellGroup`。這一組元件介於展示型元件與列表行容器之間：它可以只是顯示一行資訊，也可以作為可點擊、可導頁、可被群組收集事件的操作列。

閱讀 `Cell` 時不要只把它理解成「一個列表項」。它真正值得觀察的是這條轉換鏈：

```txt
CellGroup slot
  -> provide CellGroupInstance
  -> Cell props / slots
  -> CellItem 展示 title / label / extra / icon
  -> Cell click 回報 name 給 CellGroup
  -> link mixin 處理 router / window navigation
  -> cell.less + globalConfig 決定互動樣式與箭頭
```

這組元件的 runtime 不長，但有幾個容易誤判的地方：`CellItem` 不是 public export，而是 `Cell` 的內部展示結構；`Cell` 的 `disabled` 只產生 class，不阻止 click 或 link；`Cell` 直接 inject `CellGroupInstance`，所以實際使用上預期放在 `CellGroup` 之內。

## 1. Source Baseline

本目錄以本地保存的 View UI Plus `v1.3.20` 原始碼為閱讀基準。

| 類型 | 路徑 | 閱讀目的 |
| --- | --- | --- |
| Runtime | `01-origin/source/view-ui-plus-v1.3.20/src/components/cell/cell.vue` | 確認 `Cell` props、slots、render branch、click、link 與 arrow 行為。 |
| Runtime internal | `01-origin/source/view-ui-plus-v1.3.20/src/components/cell/cell-item.vue` | 確認 title、label、extra、icon 的內部 DOM 結構與 slot fallback。 |
| Runtime group | `01-origin/source/view-ui-plus-v1.3.20/src/components/cell/cell-group.vue` | 確認 `CellGroup` 如何 provide instance 並 emit `on-click`。 |
| Runtime entry | `01-origin/source/view-ui-plus-v1.3.20/src/components/cell/index.js` | 確認 `Cell` 的單元件入口匯出。 |
| Runtime entry | `01-origin/source/view-ui-plus-v1.3.20/src/components/cell-group/index.js` | 確認 `CellGroup` 的單元件入口匯出。 |
| Shared logic | `01-origin/source/view-ui-plus-v1.3.20/src/mixins/link.js` | 確認 `to`、`replace`、`target`、`append` 與 navigation 流程。 |
| Shared logic | `01-origin/source/view-ui-plus-v1.3.20/src/mixins/globalConfig.js` | 確認 `Cell` 如何讀取 `$VIEWUI.cell` 的 arrow 設定。 |
| Style | `01-origin/source/view-ui-plus-v1.3.20/src/styles/components/cell.less` | 對照列表行、selected、disabled、link、footer、arrow 與內容排版。 |
| Style mixin | `01-origin/source/view-ui-plus-v1.3.20/src/styles/mixins/select.less` | 確認 `.select-item()` 如何補上 hover、disabled、selected 等共用 item 樣式。 |
| Type declaration | `01-origin/source/view-ui-plus-v1.3.20/types/cell.d.ts` | 確認 `Cell` / `CellGroup` public TypeScript contract 與 slots。 |
| Global options type | `01-origin/source/view-ui-plus-v1.3.20/types/index.d.ts` | 確認 install options 中的 `cell.arrow/customArrow/arrowSize` 型別。 |
| Example | `01-origin/source/view-ui-plus-v1.3.20/examples/routers/cell.vue` | 確認官方展示的 group、selected、disabled、extra、link 與 `on-click` 場景。 |
| Registry | `01-origin/source/view-ui-plus-v1.3.20/src/components/index.js` | 確認 `Cell` / `CellGroup` 進入 component public export。 |
| Install | `01-origin/source/view-ui-plus-v1.3.20/src/index.js` | 確認全域安裝、元件註冊與 `$VIEWUI.cell` 預設值。 |

## 2. Reading Focus

閱讀這組元件時，建議把問題拆成五類。

第一，元件邊界。`CellGroup` 是容器與事件匯出口，`Cell` 是 public item，`CellItem` 是內部展示結構。`CellGroup` 不管理 selected 或 disabled 狀態，它只接收子項 click 後 emit `on-click`。

第二，public contract。`Cell` 的對外 API 由自身 props、`mixins/link.js` props、slots 與 `.d.ts` 共同構成。只看 `cell.vue` 會漏掉 `to`、`replace`、`target`、`append`。

第三，展示結構。`Cell` 不直接排 title / label / extra，而是把 props 與 slots 轉交給 `CellItem`。`CellItem` 內部固定分成 icon、main、footer 三塊。

第四，事件與導頁。點擊 `Cell` 時先呼叫 `CellGroupInstance.handleClick(this.name)`，再進入 `handleCheckClick()` 處理可能的 link navigation。group click 與 navigation 是同一次點擊中的兩段流程。

第五，樣式與箭頭。`selected`、`disabled`、`with-link` 都先變成 class，再由 `cell.less` 與 `.select-item()` mixin 決定畫面。箭頭只在 `to` 存在時出現，且可被 `#arrow` slot 或 `$VIEWUI.cell` 全域設定改變。

## 3. Notes Index

建議依照下列順序閱讀。

| 筆記 | 主題 | 建議閱讀目的 |
| --- | --- | --- |
| `01-source-map.md` | 原始碼入口與責任分工 | 先知道 runtime、style、type、example、mixin、registry、install 分別在哪裡。 |
| `02-public-contract-and-component-boundary.md` | public contract 與元件邊界 | 對照 `Cell` props / slots、`CellGroup` event、`CellItem` 內部結構與 inject 邊界。 |
| `03-click-link-and-provide-inject-flow.md` | click、link 與 provide/inject 流程 | 理解 group event、router / window navigation、ctrl/meta click 與 disabled 邊界。 |
| `04-render-style-arrow-and-global-config.md` | render、樣式、箭頭與全域設定 | 理解 `<a>` / `<div>` branch、class、less、`.select-item()`、arrow slot 與 `$VIEWUI.cell`。 |

## 4. Learning Outcome

讀完本目錄後，應該能建立以下理解。

1. `CellGroup` 只是一個提供 instance 與 emit `on-click` 的群組容器，不負責管理子項狀態。
2. `Cell` 預期放在 `CellGroup` 裡，因為 click handler 會直接使用 injected `CellGroupInstance`。
3. `CellItem` 是內部展示元件，不在 public registry 裡匯出。
4. `Cell` 的 public props 包含自身 props 與 `mixins/link.js` 帶來的 link props。
5. default、`icon`、`label`、`extra`、`arrow` slots 分別覆蓋不同展示區域。
6. `disabled` 只產生 `ivu-cell-disabled` class，不會阻止 click、`on-click` 或 navigation。
7. 有 `to` 時 `Cell` 會輸出 `<a>` 並顯示 arrow；沒有 `to` 時輸出 clickable `<div>`。
8. 箭頭預設是 `ios-arrow-forward`，但可由 `$VIEWUI.cell.arrow`、`$VIEWUI.cell.customArrow`、`$VIEWUI.cell.arrowSize` 或 `#arrow` slot 改變。
9. `cell.less` 透過 `.select-item(@cell-prefix-cls, @cell-prefix-cls)` 重用類似 Select / Dropdown item 的 hover、disabled、selected 樣式。

## 5. Self Check

1. 為什麼只看 `cell.vue` 的 props 會漏掉 `to`、`replace`、`target`、`append`？
2. `Cell` 與 `CellItem` 的責任分工是什麼？
3. 點擊 `Cell` 時，`CellGroup` 的 `on-click` 和 link navigation 哪個先發生？
4. `disabled` 為什麼不等於不可點擊？
5. 有 `to` 與沒有 `to` 時，`Cell` 的 root link wrapper 分別是什麼元素？
6. `#extra` 與 `extra` prop 最後會落在 `CellItem` 的哪個區塊？
7. `#arrow` slot 和 `$VIEWUI.cell.customArrow` 的作用層級有什麼差異？
8. 為什麼 `Cell` 的 selected / disabled hover 樣式需要同時看 `cell.less` 和 `mixins/select.less`？
