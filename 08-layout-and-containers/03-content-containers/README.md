# Card / Grid / GridItem Content Containers 原始碼閱讀總覽

## 1. 本目錄定位

`08-layout-and-containers/03-content-containers/` 用來閱讀 View UI Plus 的內容容器元件：

```txt
Card / Grid / GridItem
```

這組元件都在處理「內容如何被包裝、分隔、排列與裝飾」，但它們的責任並不相同：

| 元件 | 核心角色 | 閱讀重點 |
| --- | --- | --- |
| `Card` | 獨立內容卡片 | title / extra / body 結構、hover / shadow / border、padding、link mixin。 |
| `Grid` | 宮格父容器 | provide `GridInstance`、col / square / padding / center / border / hover、resize 監聽。 |
| `GridItem` | 宮格子項 | inject `GridInstance`、寬度百分比、square 高度、padding。 |

本目錄以 View UI Plus `v1.3.20` 作為 Source Baseline：

```txt
01-origin/source/view-ui-plus-v1.3.20/
```

---

## 2. 核心心智模型

這組內容容器可以分成兩條線理解：

```txt
Card props / slots / link mixin
  -> root tag div or a
  -> head / extra / body DOM
  -> ivu-card-* classes and body padding style
  -> card.less

Grid props
  -> provide GridInstance
  -> GridItem inject col / square / padding / resizeCount
  -> item width / square height / main padding
  -> grid.less
```

`Card` 是相對獨立的容器；`Grid` / `GridItem` 則必須一起看，因為 `GridItem` 的寬度、padding 與 square 高度都依賴父層 `GridInstance`。

---

## 3. Notes Index

建議依照下列順序閱讀。

| 順序 | 筆記 | 主題 | 閱讀目的 |
| --- | --- | --- | --- |
| 1 | `01-source-map.md` | 原始碼入口地圖 | 先知道 runtime、style、type、example、registry 分別在哪裡。 |
| 2 | `02-public-contract-slots-and-export-boundary.md` | public contract、slots 與匯出邊界 | 建立 `Card` / `Grid` / `GridItem` 對外 API、slot 與 install/export 關係。 |
| 3 | `03-card-title-extra-body-link-and-padding.md` | `Card` runtime | 理解 head / extra / body、連結模式、padding、border / hover / shadow class。 |
| 4 | `04-grid-parent-context-border-hover-and-resize.md` | `Grid` runtime | 理解父層如何 provide 狀態、輸出 class，並用 resize detector 通知子項。 |
| 5 | `05-griditem-column-square-height-and-padding.md` | `GridItem` runtime | 理解子項如何依賴父層 col、square、padding 與 resizeCount。 |
| 6 | `06-less-examples-type-gaps-and-self-check.md` | Less、examples、type gap、自我檢查 | 用樣式與官方範例回扣行為，並整理 runtime / `.d.ts` 差異。 |

---

## 4. 三條閱讀主線

### 4.1 `Card`：卡片容器與可點擊入口

`Card` 的 template 比一般 wrapper 多一層語意：

```txt
root component
  -> optional head
  -> optional extra
  -> body
```

它同時混入 `mixins/link.js`，所以當 `to` 存在時，root 會從 `div` 變成 `a`，並透過 `handleCheckClick()` 處理 router / window location 行為。讀 `Card` 時不要只看 `card.vue` 的 props，也要把 link mixin 一起納入。

### 4.2 `Grid`：宮格父容器

`Grid` 本身不直接計算每個 item 的 DOM 尺寸。它負責提供父層上下文：

```txt
Grid provide GridInstance
  -> col / square / padding / center / border / hover
  -> resizeCount
```

其中 `border`、`hover`、`center` 主要轉成 class 交給 Less；`col`、`square`、`padding` 則由 `GridItem` 注入後轉成 inline style。

### 4.3 `GridItem`：依賴父層的子項

`GridItem` 的核心不是 public props，而是注入 `GridInstance`：

```txt
GridInstance.col
  -> width: 100 / col %

GridInstance.square
  -> item height = item width

GridInstance.padding
  -> item main padding
```

當父層 resize、`col` 改變或 `square` 改變時，`GridItem` 會重新計算高度。這也是 `Grid` 需要 element resize detector 的原因。

---

## 5. 建議三輪閱讀法

### 5.1 第一輪：建立地圖

先讀：

```txt
README.md
01-source-map.md
02-public-contract-slots-and-export-boundary.md
```

這一輪只需要知道三個元件的 source path、public API、slot 與 export/install 邊界。

### 5.2 第二輪：追 runtime 流程

再讀：

```txt
03-card-title-extra-body-link-and-padding.md
04-grid-parent-context-border-hover-and-resize.md
05-griditem-column-square-height-and-padding.md
```

這一輪要能說明 props / slots 如何變成 DOM、class、inline style，以及 `Grid` / `GridItem` 的父子資料流。

### 5.3 第三輪：回到 Less 與 examples

最後讀：

```txt
06-less-examples-type-gaps-and-self-check.md
```

這一輪要確認 runtime 產生的 class 如何被 Less 接住，並用官方 example 檢查理解是否完整。

---

## 6. 完整學習成果

讀完本目錄後，應該能回答：

1. `Card` 什麼時候會渲染成 `a`，什麼時候是 `div`？
2. `Card` 的 head、extra、body 分別由哪些 props / slots 決定？
3. `Card.padding` 為什麼只影響 body，而不是整張卡片？
4. `bordered`、`disHover`、`shadow` 三者如何共同決定 class？
5. `Grid` 為什麼需要 provide `GridInstance`？
6. `GridItem` 為什麼正常語境下不應單獨閱讀？
7. `Grid.col` 如何決定每個 `GridItem` 的寬度？
8. `Grid.square` 如何讓 item 高度等於寬度？
9. `Grid.resizeCount` 的用途是什麼？
10. `center`、`border`、`hover` 在 runtime 和 Less 中分別負責什麼？
11. runtime source 與 `types/card.d.ts`、`types/grid.d.ts` 有哪些值得注意的差異？
12. 官方 `card.vue`、`grid-component.vue` examples 覆蓋了哪些主線場景？
