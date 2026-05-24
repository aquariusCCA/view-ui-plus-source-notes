# Card / Grid / GridItem Less、Examples、Type Gaps 與自我檢查

## 1. 本章定位

本篇用 Less、官方 example、type declaration 回扣 `Card` / `Grid` / `GridItem` 的主要行為，並整理 runtime source 與 type declaration 之間需要注意的差異。

主要來源：

```txt
01-origin/source/view-ui-plus-v1.3.20/src/styles/components/card.less
01-origin/source/view-ui-plus-v1.3.20/src/styles/components/grid.less
01-origin/source/view-ui-plus-v1.3.20/examples/routers/card.vue
01-origin/source/view-ui-plus-v1.3.20/examples/routers/grid-component.vue
01-origin/source/view-ui-plus-v1.3.20/types/card.d.ts
01-origin/source/view-ui-plus-v1.3.20/types/grid.d.ts
01-origin/source/view-ui-plus-v1.3.20/src/components/card/card.vue
01-origin/source/view-ui-plus-v1.3.20/src/components/grid/*.vue
```

---

## 2. `Card` Less 規則總覽

`card.less` 的主結構圍繞：

```txt
@card-prefix-cls: ivu-card
```

主要 class 可以整理成：

| class | Runtime 來源 | Less 責任 |
| --- | --- | --- |
| `ivu-card` | `Card.classes` 永遠存在。 | block、白色背景、border radius、字級、position、transition。 |
| `ivu-card-bordered` | `bordered && !shadow`。 | border 與 border-color。 |
| `ivu-card-shadow` | `shadow`。 | 固定 card shadow。 |
| `ivu-card-dis-hover` | `disHover || shadow`。 | hover 時不要套一般 shadow。 |
| `ivu-card-head` | head 區塊。 | 套用 `.content-header`。 |
| `ivu-card-extra` | extra 區塊。 | 絕對定位到右上角。 |
| `ivu-card-body` | body 區塊。 | 預設 `padding: 16px`。 |

`Card.padding` 若不是 16，runtime 會在 body 上輸出 inline padding，覆蓋 Less 預設值。

---

## 3. `Card` hover / shadow 細節

`card.less` 的 hover 基礎規則是：

```txt
ivu-card:hover
  -> box-shadow: shadow-base
  -> border-color: #eee
```

但狀態 class 會覆蓋它：

| 狀態 | Less 結果 |
| --- | --- |
| `ivu-card-dis-hover:hover` | hover shadow 變成 none，border-color 變 transparent。 |
| `ivu-card-dis-hover.ivu-card-bordered:hover` | bordered 卡片 hover 時保留 split border color。 |
| `ivu-card-shadow:hover` | hover 時仍保持 `shadow-card`。 |

因此 `shadow` 的語意是「固定陰影」而不是「hover 時更強」。runtime 加上 `ivu-card-shadow` 和 `ivu-card-dis-hover`，Less 則確保 hover 不把固定陰影改掉。

---

## 4. `Grid` Less 規則總覽

`grid.less` 的主結構圍繞：

```txt
ivu-grid
```

主要 class 可以整理成：

| class | Runtime 來源 | Less 責任 |
| --- | --- | --- |
| `ivu-grid` | `Grid` root。 | clearfix，清除浮動。 |
| `ivu-grid-item` | `GridItem` outer div。 | `float: left`、box sizing、transition。 |
| `ivu-grid-item-main` | `GridItem` inner div。 | 預設 padding。 |
| `ivu-grid-border` | `Grid.border`。 | 用 box-shadow 模擬格線。 |
| `ivu-grid-hover` | `Grid.hover`。 | item hover 時加 shadow 並提高 z-index。 |
| `ivu-grid-center` | `Grid.center`。 | 讓 item main 絕對定位垂直置中。 |

`Grid` 不是 CSS Grid，也不是 flex layout。它使用 float 排列，並靠 root clearfix 收尾。

---

## 5. Runtime style 與 Less style 分工

`Grid` / `GridItem` 的尺寸行為由 runtime 和 Less 一起完成：

| 行為 | Runtime 責任 | Less 責任 |
| --- | --- | --- |
| item 寬度 | `GridItem.styles` 輸出 `width: 100 / col %`。 | `.ivu-grid-item` 有預設 `width: 33.33%` fallback。 |
| square 高度 | `GridItem` 讀 DOM width 後輸出 `height`。 | 提供 item 基礎定位與 box sizing。 |
| item padding | `GridItem.mainStyles` 輸出父層 `padding`。 | `.ivu-grid-item-main` 有預設 `padding: 24px`。 |
| border | `Grid.classes` 輸出 `ivu-grid-border`。 | box-shadow 畫線。 |
| hover | `Grid.classes` 輸出 `ivu-grid-hover`。 | hover shadow。 |
| center | `Grid.classes` 輸出 `ivu-grid-center`。 | main 絕對定位垂直置中。 |

這裡的重點是：`col`、`square`、`padding` 偏 runtime inline style；`border`、`hover`、`center` 偏 Less state class。

---

## 6. 官方 examples 覆蓋的主線場景

### 6.1 `card.vue`

`examples/routers/card.vue` 覆蓋：

| 場景 | Example 特徵 | 對應 source 重點 |
| --- | --- | --- |
| 可點擊卡片 | `<Card style="width:350px" to="/button">` | link mode、root tag、`tagProps`、click handling。 |
| 自訂 title | `#title` slot | `showHead`、slot fallback。 |
| 自訂 extra | `#extra` slot | `showExtra`、右上角操作區。 |
| body content | default slot 放 list | `ivu-card-body`。 |

example 沒有完整展示 `shadow`、`dis-hover`、`bordered`、`padding`，所以這些行為要回到 runtime 和 Less。

### 6.2 `grid-component.vue`

`examples/routers/grid-component.vue` 覆蓋：

| 場景 | Example 特徵 | 對應 source 重點 |
| --- | --- | --- |
| border toggle | `:border="border"` | `ivu-grid-border` class。 |
| hover toggle | `:hover="hover"` | `ivu-grid-hover` class。 |
| 多個 item | 9 個 `GridItem` | `GridItem` 注入父層 `col = 3`，每個寬度約三分之一。 |

example 沒有展示 `square`、`padding`、`center`、動態 `col`，所以這些分支仍要以 source 為準。

---

## 7. Runtime 與 type declaration 差異

### 7.1 `Card.disHover`

Runtime prop 名稱是：

```txt
disHover
```

`.d.ts` 以 template 使用形式描述：

```txt
'dis-hover'?: boolean
```

這是 camelCase / kebab-case 的差異，不是兩個不同 prop。

### 7.2 `Card` link props

`Card` runtime source 本身沒有直接宣告 `to`、`replace`、`target`、`append`，但它混入 `mixins/link.js`。`types/card.d.ts` 有把這些 props 列出來。

筆記中應寫成：

```txt
link props 來自 mixin，type declaration 已把它們納入 Card public contract。
```

### 7.3 `Grid.padding`

Runtime 與 `.d.ts` 都描述 `padding` 為 string。和 `Card.padding` 的 number 不同，`Grid.padding` 會被直接放到 inline style。

### 7.4 `GridItem` parent dependency

`types/grid.d.ts` 只描述 `GridItem` 的 default slot，沒有描述它依賴 `GridInstance`。這是 type surface 與 runtime 協作關係的差異：

```txt
type tells what user passes
runtime shows what child requires
```

讀 `GridItem` 時不能只看 `.d.ts`。

---

## 8. Unit test 狀態

在：

```txt
01-origin/source/view-ui-plus-v1.3.20/test/unit/specs/
```

目前未看到直接命中的：

```txt
card
grid
grid-item
```

因此本組筆記的行為證據主要來自：

1. runtime source。
2. component Less。
3. type declaration。
4. official examples。

若後續要補測試，可以優先覆蓋 `Card` 的 link / slot / padding，以及 `Grid` / `GridItem` 的 col、square、resizeCount 行為。

---

## 9. 自我檢查

讀完本組筆記後，可以用下面問題檢查理解是否完整：

1. `Card` 的 root tag 為什麼不是永遠都是 `div`？
2. `Card` 的 `to`、`replace`、`target`、`append` props 從哪裡來？
3. `Card` 什麼情況下會顯示 head？
4. `Card` 的 `icon` prop 在使用 `title` slot 時還會自動插入嗎？
5. `Card.padding` 為什麼只影響 body？
6. `shadow` 為什麼會同時產生 `ivu-card-shadow` 和 `ivu-card-dis-hover`？
7. `Grid` 為什麼要 provide `GridInstance`？
8. `GridItem` 的 width 是怎麼從 `Grid.col` 推出來的？
9. `Grid.square` 為什麼需要讀 DOM width？
10. `Grid.resizeCount` 不直接渲染畫面，為什麼仍然重要？
11. `Grid.center` 是 `GridItem` computed style，還是 Less class 行為？
12. `GridItem` 離開 `Grid` 單獨使用會缺少什麼？

---

## 10. 本篇小結

`Card` / `Grid` / `GridItem` 的完整行為不能只看 template：

```txt
Card:
  runtime DOM / classes
  + link mixin
  + card.less
  + card.d.ts
  + official example

Grid / GridItem:
  provide / inject
  + resize detector
  + inline styles
  + grid.less
  + grid.d.ts
  + official example
```

這組元件的共同閱讀重點是「容器表面看起來薄，但真正的行為分散在父子關係、mixin、Less 與 DOM 尺寸計算裡」。
