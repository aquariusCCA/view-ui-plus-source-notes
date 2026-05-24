# Card / Grid / GridItem Public Contract、Slots 與 Export Boundary

## 1. 本章定位

本篇先從使用者能看到的 public contract 切入，再回到 `Card`、`Grid`、`GridItem` 的 slot、父子邊界與匯出關係。

這組元件可以先分成兩類：

```txt
independent container:
  Card

parent-child container:
  Grid / GridItem
```

`Card` 可以單獨使用，並且因為混入 link mixin，帶有可點擊卡片能力。`GridItem` 雖然有獨立匯出，但它的核心資料來自父層 `GridInstance`，正常閱讀時應該和 `Grid` 一起看。

---

## 2. `Card` public contract

`Card` 的 runtime source 來自：

```txt
src/components/card/card.vue
```

### 2.1 Props

`Card` 自己宣告的 props：

| Prop | Runtime type | 預設值 | 用途 |
| --- | --- | --- | --- |
| `bordered` | `Boolean` | `true` | 是否顯示 bordered class；當 `shadow` 為 `true` 時不加 bordered class。 |
| `disHover` | `Boolean` | `false` | 停用 hover shadow 效果。 |
| `shadow` | `Boolean` | `false` | 使用固定 card shadow，並同時停用一般 hover shadow。 |
| `padding` | `Number` | `16` | 自訂 body padding，單位 px。 |
| `title` | `String` | 無 | 簡單標題文字。 |
| `icon` | `String` | 無 | title 前方的 `Icon` type。 |

`Card` 也混入：

```txt
src/mixins/link.js
```

因此還會有 link props：

| Prop | Runtime type / validator | 預設值 | 用途 |
| --- | --- | --- | --- |
| `to` | `Object` / `String` | 無 | 存在時卡片 root 會進入 link 模式。 |
| `replace` | `Boolean` | `false` | router 跳轉時使用 `replace`。 |
| `target` | `_blank` / `_self` / `_parent` / `_top` | `_self` | 控制連結 target。 |
| `append` | `Boolean` | `false` | 傳給 router resolve / push 的 append 語意。 |

### 2.2 Slots

| Slot | 用途 | Runtime 行為 |
| --- | --- | --- |
| `title` | 自訂卡片頭部內容。 | `showHead` 會因為 slot 存在而顯示 head。 |
| `extra` | 右上角額外操作內容。 | `showExtra` 會因為 slot 存在而顯示 extra。 |
| default | 卡片主體內容。 | 永遠放進 `ivu-card-body`。 |

如果沒有 `title` slot，但有 `title` prop，template 會輸出預設 `<p>`，並在 `icon` 存在時渲染 `Icon`。

### 2.3 Root tag 與 click

`Card` root 不是固定 `div`：

| 條件 | Root tag | 附加屬性 |
| --- | --- | --- |
| 沒有 `to` | `div` | 無。 |
| 有 `to` | `a` | `href: linkUrl`、`target`。 |

click 事件會呼叫 `handleClickLink()`。只有 link 模式才會進一步呼叫 mixin 的 `handleCheckClick()`，處理 router、外部連結、`target="_blank"` 和 ctrl / meta click。

---

## 3. `Grid` public contract

`Grid` 的 runtime source 來自：

```txt
src/components/grid/grid.vue
```

### 3.1 Props

| Prop | Runtime type | 預設值 | 用途 |
| --- | --- | --- | --- |
| `col` | `Number` | `3` | 最大支援列數；`GridItem` 用它計算 `width: 100 / col %`。 |
| `square` | `Boolean` | `false` | 是否讓每個 `GridItem` 寬高一致。 |
| `padding` | `String` | `24px` | 傳給 `GridItem` 內層 main 的 padding。 |
| `center` | `Boolean` | `false` | 加上 `ivu-grid-center`，由 Less 做垂直置中。 |
| `border` | `Boolean` | `true` | 加上 `ivu-grid-border`，由 Less 畫格線。 |
| `hover` | `Boolean` | `false` | 加上 `ivu-grid-hover`，由 Less 做 hover shadow。 |

`Grid` 沒有 emits，也沒有 v-model。

### 3.2 Slots

| Slot | 用途 |
| --- | --- |
| default | 放置 `GridItem`。 |

runtime 沒有強制檢查 default slot 必須是 `GridItem`，但 `GridItem` 需要 inject `GridInstance`。因此從元件設計意圖看，`GridItem` 應放在 `Grid` 裡使用。

### 3.3 Provide contract

`Grid` 透過 provide 暴露：

```txt
GridInstance: this
```

`GridItem` 實際讀取的父層資料包括：

```txt
col
square
padding
resizeCount
```

這不是正式的 public prop API，而是 `Grid` / `GridItem` 之間的內部父子協作 contract。

---

## 4. `GridItem` public contract

`GridItem` 的 runtime source 來自：

```txt
src/components/grid/grid-item.vue
```

單元件入口則是：

```txt
src/components/grid-item/index.js
```

### 4.1 Props

`GridItem` runtime 沒有 props。它的寬度、square 高度與 padding 都來自父層 `GridInstance`。

### 4.2 Slots

| Slot | 用途 |
| --- | --- |
| default | 宮格項目內容。 |

### 4.3 Parent dependency

`GridItem` 宣告：

```txt
inject: ['GridInstance']
```

因此它不是完全獨立的內容容器。若脫離 `Grid` 使用，runtime 會缺少 `GridInstance`，相關 computed 無法正常取得 `col`、`square` 與 `padding`。

---

## 5. Type declaration 對照

TypeScript public contract 來自：

```txt
types/card.d.ts
types/grid.d.ts
```

### 5.1 `Card`

`types/card.d.ts` 有列出 `Card` 自身 props，也列出 link mixin 相關 props：

```txt
to / replace / target / append
```

slots 以 `'v-slots'` 描述：

| Slot | `.d.ts` 描述 |
| --- | --- |
| `title` | 自訂卡片標題。 |
| `extra` | 額外顯示內容。 |
| default | 卡片主體內容。 |

需要注意的是，runtime prop 是 `disHover`，在 template / type 使用時會以 kebab-case 寫成 `dis-hover`。

### 5.2 `Grid` / `GridItem`

`types/grid.d.ts` 描述：

| 元件 | Type public surface |
| --- | --- |
| `Grid` | `col`、`square`、`padding`、`center`、`border`、`hover`。 |
| `GridItem` | default slot。 |

`GridItem` 的 type 沒有顯示父層 inject 依賴。這個依賴要從 runtime source 補上，不能只靠 `.d.ts` 判斷。

---

## 6. Public export 與 install

三個元件都在 runtime public export 中存在：

```txt
src/components/index.js
  export { default as Card } from './card';
  export { default as Grid } from './grid';
  export { default as GridItem } from './grid-item';
```

Type export 也存在：

```txt
types/viewuiplus.components.d.ts
  export { Card } from './card'
  export { Grid, GridItem } from './grid'
```

`GridItem` 的 runtime public entry 是 `src/components/grid-item/index.js`，但 type 和 runtime source 都把它放回 `grid` 這組關係中理解。筆記中應保留這個差異，避免誤以為它和 `Card` 一樣完全獨立。

---

## 7. 本篇小結

Content containers 的 public contract 可以收斂成：

| 元件 | Public surface |
| --- | --- |
| `Card` | props、link props、title / extra / default slots、root link 行為。 |
| `Grid` | layout props、default slot、父層 provide。 |
| `GridItem` | default slot，並依賴父層 `GridInstance`。 |

讀這組元件時，不要把 `Grid` 和前一節 `Row` / `Col` 的 24 欄系統混在一起。`Grid` / `GridItem` 是內容宮格容器，靠百分比寬度、float、box-shadow 邊線與 DOM width 計算 square 高度；它不是 responsive column class 生成系統。
