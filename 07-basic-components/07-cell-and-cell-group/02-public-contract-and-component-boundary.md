# Cell Public Contract And Component Boundary：props、slots 與父子邊界

## 0. 原始筆記問題分析

原本筆記已經指出要整理 `Cell`、`CellItem`、`CellGroup` 三者分工，但還沒有把 public API、內部元件邊界、slot fallback 與 `.d.ts` 放在同一張圖裡。

`Cell / CellGroup` 很容易被誤讀成一個普通列表元件，但它其實有三種不同層級：

1. `CellGroup` 是 public container 與 event output。
2. `Cell` 是 public item，承接 props、slots、click 與 link。
3. `CellItem` 是 internal layout，使用者不應直接依賴。

## 1. 本章定位

本章是一篇 public contract 與元件邊界對照筆記，專門分析 `Cell` 對外可以接收哪些 props / slots，`CellGroup` 對外輸出什麼事件，以及 `CellItem` 為什麼只是內部展示結構。

本章不深入講 router navigation 與 click 時序。那些內容請看 `03-click-link-and-provide-inject-flow.md`。

## 2. Component Boundary

三個元件的邊界可以整理成：

```txt
使用者
  -> <CellGroup @on-click>
      -> <Cell name title label extra to selected disabled>
          -> <CellItem title label extra>
```

| 元件 | 使用者是否直接使用 | 責任 |
| --- | --- | --- |
| `CellGroup` | 是 | 提供群組容器、provide instance、emit `on-click`。 |
| `Cell` | 是 | 接收 public props / slots，處理 click、link、arrow 與 class。 |
| `CellItem` | 否 | 接收 `Cell` 轉交的 title / label / extra，渲染固定展示結構。 |

這裡的關鍵是：`CellGroup` 不透過 props 注入子項狀態，`CellItem` 也不和 `CellGroup` 溝通。父子通訊只存在於 `CellGroup` 與 `Cell` 之間。

## 3. `Cell` Runtime Props

`cell.vue` 自身宣告的 props 如下。

| Runtime prop | Runtime 限制 / default | Type declaration | 閱讀重點 |
| --- | --- | --- | --- |
| `name` | `String` 或 `Number` | `name?: string \| number` | 點擊時傳給 `CellGroup on-click` 的識別值。 |
| `title` | `String`，預設 `''` | `title?: string` | 傳給 `CellItem` 的標題 fallback。 |
| `label` | `String`，預設 `''` | `label?: string` | 傳給 `CellItem` 的描述 fallback。 |
| `extra` | `String`，預設 `''` | `extra?: string` | 傳給 `CellItem` 的右側額外內容 fallback。 |
| `disabled` | `Boolean`，預設 `false` | `disabled?: boolean` | 只產生 `ivu-cell-disabled` class，不阻止 click。 |
| `selected` | `Boolean`，預設 `false` | `selected?: boolean` | 只產生 `ivu-cell-selected` class，不建立內部選取狀態。 |

這張表最重要的是：`disabled` 與 `selected` 都是視覺輸入。`Cell` 沒有內部 selected state，也沒有在 `disabled` 時 return 掉 click handler。

## 4. Link Mixin Props

`Cell` 混入 `mixins/link.js`，因此也接收 link props。

| Mixin prop | Runtime 限制 / default | Type declaration | 閱讀重點 |
| --- | --- | --- | --- |
| `to` | `Object` 或 `String` | `to?: string \| object` | 有值時切換成 link branch，顯示 arrow，點擊會導頁。 |
| `replace` | `Boolean`，預設 `false` | `replace?: boolean` | router navigation 使用 `replace` 而不是 `push`。 |
| `target` | `_blank`、`_self`、`_parent`、`_top`，預設 `_self` | target union | `_blank` 時走 `handleOpenTo()`。 |
| `append` | `Boolean`，預設 `false` | `append?: boolean` | 傳給 `router.resolve()`。 |

這些 props 沒有寫在 `cell.vue` 的 `props` 區塊，但對使用者仍是 `Cell` 的 public API。這是閱讀有 mixin 元件時最容易漏掉的部分。

## 5. `Cell` Slots

`Cell` 的 slots 都會轉發到 `CellItem`，只有 `arrow` 例外。

| Slot | 對應 fallback prop | Runtime 位置 | 閱讀重點 |
| --- | --- | --- | --- |
| default | `title` | `CellItem` 的 `.ivu-cell-title` | 覆蓋標題內容。 |
| `icon` | 無 | `CellItem` 的 `.ivu-cell-icon` | 標題左側 icon 區。空內容時 CSS 隱藏。 |
| `label` | `label` | `CellItem` 的 `.ivu-cell-label` | 覆蓋描述內容。 |
| `extra` | `extra` | `CellItem` 的 `.ivu-cell-extra` | 覆蓋右側額外內容。 |
| `arrow` | 全域 arrow / 預設 icon | `Cell` 的 `.ivu-cell-arrow` | 只在有 `to` 時渲染，覆蓋整個右側箭頭內容。 |

`Cell` 轉發 slot 的方式如下：

```vue
<CellItem :title="title" :label="label" :extra="extra">
    <template #icon><slot name="icon"></slot></template>
    <template #default><slot></slot></template>
    <template #extra><slot name="extra"></slot></template>
    <template #label><slot name="label"></slot></template>
</CellItem>
```

所以 props 與 slots 的關係是 fallback，而不是合併顯示。提供 slot 時，slot 內容會取代對應 prop 的文字位置。

## 6. `CellItem` Internal Structure

`CellItem` template 固定是：

```vue
<div class="ivu-cell-item">
    <div class="ivu-cell-icon">
        <slot name="icon"></slot>
    </div>
    <div class="ivu-cell-main">
        <div class="ivu-cell-title"><slot>{{ title }}</slot></div>
        <div class="ivu-cell-label"><slot name="label">{{ label }}</slot></div>
    </div>
    <div class="ivu-cell-footer">
        <span class="ivu-cell-extra"><slot name="extra">{{ extra }}</slot></span>
    </div>
</div>
```

整理成區塊：

| 區塊 | class | 內容來源 |
| --- | --- | --- |
| Icon | `ivu-cell-icon` | `#icon` slot。 |
| Title | `ivu-cell-title` | default slot 或 `title` prop。 |
| Label | `ivu-cell-label` | `#label` slot 或 `label` prop。 |
| Extra | `ivu-cell-footer` / `ivu-cell-extra` | `#extra` slot 或 `extra` prop。 |

`CellItem` 沒有 `emits`、沒有 computed、沒有 methods。它的作用是讓展示結構保持穩定。

## 7. `CellGroup` Public Contract

`CellGroup` 的 template 只包一層：

```vue
<div class="ivu-cell-group">
    <slot></slot>
</div>
```

runtime 宣告：

```js
emits: ['on-click']
```

對外事件：

| Event | Runtime emit | Type declaration | Payload |
| --- | --- | --- | --- |
| `on-click` | `this.$emit('on-click', name)` | `onOnClick?: (event?: any) => any` | 子 `Cell` 的 `name`。 |

這裡的 `.d.ts` 用 `event?: any` 描述 payload，沒有精準表達它實際上是 `name`。閱讀時應以 runtime 為準。

## 8. Provide / Inject Boundary

`CellGroup` provide：

```js
provide () {
    return {
        CellGroupInstance: this
    }
}
```

`Cell` inject：

```js
inject: ['CellGroupInstance']
```

這代表 `Cell` 的 click handler 會期待父層已提供 `CellGroupInstance`：

```js
handleClickItem (event, new_window) {
    this.CellGroupInstance.handleClick(this.name);
    this.handleCheckClick(event, new_window);
}
```

這裡沒有 fallback，也沒有 optional inject。從 runtime 角度看，`Cell` 預期放在 `CellGroup` 之內。若脫離 `CellGroup` 且被點擊，`this.CellGroupInstance.handleClick` 會有風險。

## 9. State Boundary

`Cell` 看起來有 `selected` 和 `disabled`，但它不是狀態管理元件。

| Prop | Runtime 行為 | 不做的事 |
| --- | --- | --- |
| `selected` | 產生 `ivu-cell-selected` class。 | 不在 click 後自動切換、不通知 group 選取變化。 |
| `disabled` | 產生 `ivu-cell-disabled` class。 | 不阻止 click、不阻止 group emit、不阻止 navigation。 |

所以使用者如果要做「目前選中哪一列」或「disabled 時不可點擊」，需要在外部資料與事件 handler 裡控制。

## 10. Public Contract Summary

可以把 `Cell / CellGroup` 的 public contract 壓縮成：

```txt
CellGroup
  props: none
  events: on-click(name)
  slots: default

Cell
  own props: name / title / label / extra / disabled / selected
  link props: to / replace / target / append
  slots: default / icon / label / extra / arrow
```

`CellItem` 不列入 public contract，因為它沒有在 `src/components/index.js` 或 `types/viewuiplus.components.d.ts` 對外匯出。

## 11. 本章總結

`Cell / CellGroup` 的重點不是 props 數量，而是邊界清楚：`CellGroup` 收事件，`Cell` 承接 public item 行為，`CellItem` 只負責內部展示。閱讀時要特別注意 mixin 帶來的 link props，以及 `disabled` / `selected` 只對樣式生效的控制邊界。

## 12. 自我檢查問題

1. `Cell` 自身 props 和 link mixin props 分別有哪些？
2. default slot 會覆蓋 `CellItem` 的哪個位置？
3. `#arrow` slot 為什麼不是轉發到 `CellItem`？
4. `CellGroup` 的 `on-click` 實際 payload 是什麼？
5. `CellItem` 為什麼不屬於 public contract？
6. `disabled` 在 runtime 中沒有做哪兩件常見但容易誤以為會做的事？
7. `Cell` 脫離 `CellGroup` 使用時，click handler 有什麼風險？
