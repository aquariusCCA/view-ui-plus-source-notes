# Row Runtime：gutter、alignment 與 wrap

## 1. 本章定位

本篇聚焦 `Row` runtime：

```txt
01-origin/source/view-ui-plus-v1.3.20/src/components/row/row.vue
```

`Row` 的 template 很薄，真正值得讀的是：

1. props 如何定義。
2. `provide()` 如何讓 `Col` 取得父層。
3. `classes` 如何把 align / justify / wrap 轉成 class。
4. `styles` 如何把 gutter 轉成負 margin。

---

## 2. Template：一個薄 wrapper

`Row` 的 template 是一個 wrapper：

```vue
<div :class="classes" :style="styles">
    <slot></slot>
</div>
```

這代表 `Row` 本身不處理子節點內容。它只提供一個布局容器，讓 slot 內的 `Col` 或其他內容被包在 row class 與 row style 裡。

---

## 3. `provide()`：把父層暴露給 `Col`

`Row` 的父子協作入口是：

```js
provide () {
    return {
        RowInstance: this
    }
}
```

`Col` 會 inject `RowInstance`，再讀取 `RowInstance.gutter`。這是 `Row` 與 `Col` 之間唯一明顯的 runtime 資料通道。

這種設計有一個特點：`Row` 不需要知道底下有幾個 `Col`，也不需要直接操作子元件。只要子層能拿到 `RowInstance.gutter`，就能自己計算 padding。

---

## 4. Props：Row 能控制什麼

| Prop | Runtime 定義 | 閱讀重點 |
| --- | --- | --- |
| `type` | validator 只允許 `flex` | source comment 標示 `4.5.0` 後已無效、強制 flex；但 class mapping 仍保留。 |
| `align` | `top` / `middle` / `bottom` | 控制交叉軸對齊 class。 |
| `justify` | `start` / `end` / `center` / `space-around` / `space-between` | 控制主軸排列 class。 |
| `gutter` | `Number`，預設 `0` | 控制欄格間距。 |
| `className` | `String` | 追加自訂 class。 |
| `wrap` | `Boolean`，預設 `true` | `false` 時產生 no-wrap class。 |

`Row` 沒有 data、watch、methods 或 emits。它是純 props 到 class / style 的布局容器。

---

## 5. `classes`：props 到 row class

`Row` 的 class 基礎一定包含：

```txt
ivu-row
```

其他 class 根據 props 追加。

| 條件 | 產生 class | 說明 |
| --- | --- | --- |
| `type="flex"` | `ivu-row-flex` | 歷史相容 class。 |
| `type="flex" align="middle"` | `ivu-row-flex-middle` | 仍會依 `type` 產生組合 class。 |
| `type="flex" justify="center"` | `ivu-row-flex-center` | 仍會依 `type` 產生組合 class。 |
| `align="top"` | `ivu-row-top` | 對應 `align-items: flex-start`。 |
| `align="middle"` | `ivu-row-middle` | 對應 `align-items: center`。 |
| `align="bottom"` | `ivu-row-bottom` | 對應 `align-items: flex-end`。 |
| `justify="start"` | `ivu-row-start` | 對應 `justify-content: flex-start`。 |
| `justify="end"` | `ivu-row-end` | 對應 `justify-content: flex-end`。 |
| `justify="center"` | `ivu-row-center` | 對應 `justify-content: center`。 |
| `justify="space-between"` | `ivu-row-space-between` | 對應 `justify-content: space-between`。 |
| `justify="space-around"` | `ivu-row-space-around` | 對應 `justify-content: space-around`。 |
| `className` 有值 | 自訂 class | 直接追加。 |
| `wrap=false` | `ivu-row-no-wrap` | 對應 `flex-wrap: nowrap`。 |

需要注意的是，`type` 相關 class 仍會被產生，但真正基礎 flex 樣式來自 `layout.less` 的 `.ivu-row { display: flex; flex-flow: row wrap; }`。

---

## 6. `styles`：gutter 到負 margin

`Row.styles` 只處理一件事：當 `gutter !== 0` 時，加上左右負 margin。

概念如下：

```txt
gutter = 16
  -> marginLeft: -8px
  -> marginRight: -8px
```

原因是 `Col` 會加左右 padding：

```txt
Col paddingLeft: 8px
Col paddingRight: 8px
```

如果只有 `Col` padding，整個 row 的左右外側也會多出半個 gutter。`Row` 的負 margin 會把外側多出的半個 gutter 抵消掉，讓整列仍然貼齊外部容器。

---

## 7. gutter 資料流

完整資料流可以整理成：

```txt
<Row :gutter="16">
  <Col span="6" />
</Row>

Row.props.gutter = 16
  -> Row.styles.marginLeft = -8px
  -> Row.styles.marginRight = -8px
  -> Row.provide RowInstance

Col.inject RowInstance
  -> Col.gutter = RowInstance.gutter
  -> Col.styles.paddingLeft = 8px
  -> Col.styles.paddingRight = 8px
```

這也是為什麼 `Row` / `Col` 應該一起讀。只看 `Row` 會看到負 margin，但不知道它要和誰配合；只看 `Col` 會看到 padding，但不知道 gutter 從哪裡來。

---

## 8. 對照 Less

`Row` 產生的 class 由 `src/styles/common/layout.less` 接住。

| Runtime class | Less 效果 |
| --- | --- |
| `ivu-row` | `display: flex; flex-flow: row wrap;` |
| `ivu-row-no-wrap` | `flex-wrap: nowrap;` |
| `ivu-row-start` | `justify-content: flex-start;` |
| `ivu-row-center` | `justify-content: center;` |
| `ivu-row-end` | `justify-content: flex-end;` |
| `ivu-row-space-between` | `justify-content: space-between;` |
| `ivu-row-space-around` | `justify-content: space-around;` |
| `ivu-row-top` | `align-items: flex-start;` |
| `ivu-row-middle` | `align-items: center;` |
| `ivu-row-bottom` | `align-items: flex-end;` |

閱讀時要把 runtime class 與 Less rule 配對，否則只知道 class 名稱，不知道實際布局效果。

---

## 9. 官方範例中的 Row 場景

`examples/routers/grid.vue` 中主要展示了這些 `Row` 場景：

| 場景 | 範例特徵 |
| --- | --- |
| 基本 row | 多個 `Col` 加起來等於 24。 |
| gutter | `<Row :gutter="16">`。 |
| flex order | `<Row type="flex">` 搭配 `Col order`。 |
| justify | `start`、`end`、`center`、`space-between`、`space-around`。 |
| align | `top`、`bottom`、`middle`。 |
| no-wrap | `<Row :wrap="false">` 搭配 `Col flex`。 |

---

## 10. 本篇小結

`Row` 的核心不是複雜邏輯，而是布局容器的穩定映射：

```txt
props
  -> classes
  -> styles
  -> provide RowInstance
  -> Less flex rules
```

讀懂 `Row` 後，再讀 `Col` 時就能理解為什麼 `Col` 需要 inject 父層，以及 gutter 為什麼必須在父子兩側同時處理。

