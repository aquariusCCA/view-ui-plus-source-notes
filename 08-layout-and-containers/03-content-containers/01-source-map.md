# Card / Grid / GridItem Source Map：閱讀入口與責任分工

## 1. 本章定位

本篇是 `Card` / `Grid` / `GridItem` 的 source map。它的目的不是馬上逐行分析 `.vue`，而是先建立完整閱讀地圖。

Content containers 的行為分散在幾個層次：

```txt
runtime .vue
  -> component entry index.js
  -> component style
  -> shared mixin / utility
  -> type declaration
  -> official example
  -> registry / install
```

如果只看 `card.vue`，會漏掉 `to`、`replace`、`target`、`append` 來自 link mixin。如果只看 `grid-item.vue`，會看到 width 與 height 計算，但不知道 `col`、`square`、`padding` 和 `resizeCount` 都來自父層 `Grid`。

---

## 2. Source Baseline

本篇以 View UI Plus `v1.3.20` 為基準。

| 類型 | 路徑 | 角色 | 閱讀重點 |
| --- | --- | --- | --- |
| `Card` runtime | `01-origin/source/view-ui-plus-v1.3.20/src/components/card/card.vue` | 定義卡片 DOM、class、slot、padding 與 link root tag。 | 看 title / extra / body、`tagName`、`tagProps`、`handleClickLink()`。 |
| `Grid` runtime | `01-origin/source/view-ui-plus-v1.3.20/src/components/grid/grid.vue` | 定義宮格父容器、provide、class 與 resize detector。 | 看 `GridInstance`、`resizeCount`、`border` / `hover` / `center` class。 |
| `GridItem` runtime | `01-origin/source/view-ui-plus-v1.3.20/src/components/grid/grid-item.vue` | 定義宮格子項、inject、width / height / padding style。 | 看 `GridInstance.col`、`square`、`padding`、watch 與 `handleChangeHeight()`。 |
| `Card` entry | `01-origin/source/view-ui-plus-v1.3.20/src/components/card/index.js` | 匯出 `card.vue`。 | 確認單元件入口。 |
| `Grid` entry | `01-origin/source/view-ui-plus-v1.3.20/src/components/grid/index.js` | 匯出 `grid.vue`。 | 確認父容器入口。 |
| `GridItem` entry | `01-origin/source/view-ui-plus-v1.3.20/src/components/grid-item/index.js` | 轉接匯出 `../grid/grid-item.vue`。 | 注意 public entry 與 runtime source 不在同一個資料夾。 |
| `Card` style | `01-origin/source/view-ui-plus-v1.3.20/src/styles/components/card.less` | 定義 card border、shadow、hover、head、extra、body。 | 對照 `ivu-card-*` class。 |
| `Grid` style | `01-origin/source/view-ui-plus-v1.3.20/src/styles/components/grid.less` | 定義 grid clear float、item、border、hover、center。 | 對照 `ivu-grid-*` class 與 item float。 |
| Component style entry | `01-origin/source/view-ui-plus-v1.3.20/src/styles/components/index.less` | 匯入 component styles。 | 確認 card / grid style 會進入 component style bundle。 |
| Link mixin | `01-origin/source/view-ui-plus-v1.3.20/src/mixins/link.js` | 提供 `to`、`replace`、`target`、`append` 與 click handling。 | 補齊 `Card` 的可點擊行為。 |
| Assist utility | `01-origin/source/view-ui-plus-v1.3.20/src/utils/assist.js` | 提供 `getStyle()`、`oneOf()` 等工具。 | `GridItem` 用 `getStyle()` 讀 DOM width；link mixin 用 `oneOf()` 驗證 target。 |
| Type declaration | `01-origin/source/view-ui-plus-v1.3.20/types/card.d.ts` | 定義 `Card` TypeScript public contract。 | 對照 runtime props、slots 與 link mixin props。 |
| Type declaration | `01-origin/source/view-ui-plus-v1.3.20/types/grid.d.ts` | 定義 `Grid` / `GridItem` TypeScript public contract。 | 對照 `Grid` props 與 `GridItem` slot。 |
| Type export entry | `01-origin/source/view-ui-plus-v1.3.20/types/viewuiplus.components.d.ts` | 匯出 `Card`、`Grid`、`GridItem` 型別。 | 確認 typed public export。 |
| Official example | `01-origin/source/view-ui-plus-v1.3.20/examples/routers/card.vue` | 展示 `Card` 官方使用方式。 | 觀察 title slot、extra slot、default slot、`to`。 |
| Official example | `01-origin/source/view-ui-plus-v1.3.20/examples/routers/grid-component.vue` | 展示 `Grid` / `GridItem` 官方使用方式。 | 觀察 border / hover toggle 與 9 個 item。 |
| Component registry | `01-origin/source/view-ui-plus-v1.3.20/src/components/index.js` | 對外匯出 `Card`、`Grid`、`GridItem`。 | 確認元件是否進入 public component set。 |
| Plugin install | `01-origin/source/view-ui-plus-v1.3.20/src/index.js` | 全量安裝時註冊元件。 | 確認元件會被全量 install 流程註冊。 |
| Unit test | `01-origin/source/view-ui-plus-v1.3.20/test/unit/specs/` | 測試來源。 | 目前未看到直接命中的 `card` / `grid` / `grid-item` unit test。 |

---

## 3. 檔案責任分層

### 3.1 Runtime 層

Runtime 層負責把 props、slots 和父子上下文轉成 DOM、class 與 inline style：

| 檔案 | 主要責任 |
| --- | --- |
| `card.vue` | 組出 card root、head、extra、body，並根據 link mixin 決定 root tag。 |
| `grid.vue` | 提供 `GridInstance`、輸出 grid 狀態 class，並監聽自身 resize。 |
| `grid-item.vue` | 注入 `GridInstance`，計算寬度、square 高度與內層 padding。 |

`Card` 可以獨立閱讀；`GridItem` 則必須和 `Grid` 一起看，否則無法知道它依賴的 `GridInstance` 來源。

### 3.2 Style 層

Style 層負責讓 runtime class 產生視覺效果：

| 檔案 | 主要責任 |
| --- | --- |
| `src/styles/components/card.less` | card 背景、border、shadow、hover、head、extra、body padding。 |
| `src/styles/components/grid.less` | grid clearfix、item float、border box-shadow、hover shadow、center positioning。 |

這組元件不像 `Row` / `Col` 依賴 common grid mixin；它們主要依賴各自的 component style。

### 3.3 Type 與 public export 層

Type 與 export 層回答的是「使用者能不能用」：

| 檔案 | 主要責任 |
| --- | --- |
| `types/card.d.ts` | 描述 `Card` props、link props 與 slots。 |
| `types/grid.d.ts` | 描述 `Grid` props 與 `GridItem` default slot。 |
| `types/viewuiplus.components.d.ts` | 集中匯出 `Card`、`Grid`、`GridItem` 型別。 |
| `src/components/index.js` | runtime public export。 |
| `src/index.js` | plugin install 時的全域註冊集合。 |

閱讀時要注意，type declaration 是 public surface 的描述，但不一定和 runtime 完全一致。

---

## 4. 初次閱讀順序

建議第一次按照下面順序打開 source：

```txt
types/card.d.ts
  -> src/components/card/card.vue
  -> src/mixins/link.js
  -> src/styles/components/card.less
  -> examples/routers/card.vue
  -> types/grid.d.ts
  -> src/components/grid/grid.vue
  -> src/components/grid/grid-item.vue
  -> src/styles/components/grid.less
  -> examples/routers/grid-component.vue
  -> src/components/index.js
  -> src/index.js
```

這個順序先建立 public API，再看 runtime 如何實作，最後用 Less、example 與 install entry 補齊行為證據。

---

## 5. 閱讀時要特別標記的問題

| 問題 | 優先看哪裡 |
| --- | --- |
| `Card` 何時渲染為 `a`？ | `card.vue` 的 `isHrefPattern`、`tagName`、`tagProps`。 |
| `Card` 的 link props 從哪裡來？ | `src/mixins/link.js`。 |
| `Card` 的 head / extra 何時顯示？ | `card.vue` 的 template 與 `mounted()`。 |
| `Card.padding` 如何生效？ | `card.vue` 的 `bodyStyles` 與 `card.less` 的 `ivu-card-body`。 |
| `Grid` 如何把狀態傳給 `GridItem`？ | `grid.vue` 的 `provide()` 與 `grid-item.vue` 的 `inject`。 |
| `Grid.col` 如何決定 item 寬度？ | `grid-item.vue` 的 `styles` computed。 |
| `Grid.square` 如何決定 item 高度？ | `grid-item.vue` 的 `handleChangeHeight()` 與 `getStyle()`。 |
| 父層 resize 後子項如何更新？ | `grid.vue` 的 resize detector、`resizeCount` 與 `grid-item.vue` watcher。 |
| `border` / `hover` / `center` 如何生效？ | `grid.vue` 的 `classes` 與 `grid.less`。 |
| runtime / type 是否一致？ | `types/card.d.ts`、`types/grid.d.ts` 對照 runtime source。 |
| 官方主要展示哪些場景？ | `examples/routers/card.vue`、`examples/routers/grid-component.vue`。 |

---

## 6. 本組元件的特殊性

Content containers 有三個容易漏看的特殊性。

第一，`Card` 的可點擊能力不在 `card.vue` 內完整定義，而是由 `mixins/link.js` 補上。只看 `card.vue` 會知道 root tag 可能是 `a`，但不知道 click 後如何處理 router 或外部連結。

第二，`GridItem` 雖然有獨立 public export，但 runtime source 放在 `src/components/grid/grid-item.vue`，而且直接依賴父層注入。筆記中應把它視為 `Grid` 的子元件來讀。

第三，`Grid.square` 是 DOM 尺寸驅動的行為，不是單純 class。`Grid` 監聽 resize 後增加 `resizeCount`，再由 `GridItem` watcher 重新讀取自身 width 並寫入 height。
