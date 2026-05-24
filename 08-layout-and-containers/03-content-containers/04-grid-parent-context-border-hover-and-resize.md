# Grid Runtime：Parent Context、Border、Hover 與 Resize

## 1. 本章定位

本篇聚焦 `Grid` runtime source：

```txt
01-origin/source/view-ui-plus-v1.3.20/src/components/grid/grid.vue
```

`Grid` 是 `GridItem` 的父容器。它自己的 template 很薄，但負責三件重要的事：

1. 提供 `GridInstance` 給子項。
2. 根據 props 產生 grid 狀態 class。
3. 監聽容器 resize，通知 square item 重新計算高度。

---

## 2. Template 結構

`Grid` template 是：

```txt
div.ivu-grid
  -> default slot
```

實際 root 還會綁定：

```txt
:class="classes"
ref="grid"
```

對應的 DOM 責任：

| 屬性 | 用途 |
| --- | --- |
| `class="ivu-grid"` | 固定 grid root class。 |
| `:class="classes"` | 加上 center / border / hover 狀態 class。 |
| `ref="grid"` | 供 element resize detector 監聽。 |
| default slot | 放置 `GridItem`。 |

---

## 3. Props 與父層狀態

`Grid` props：

| Prop | 預設值 | Runtime 用途 |
| --- | --- | --- |
| `col` | `3` | 提供給 `GridItem` 計算寬度。 |
| `square` | `false` | 提供給 `GridItem` 判斷是否要讓高度等於寬度。 |
| `padding` | `24px` | 提供給 `GridItem` 設定內層 main padding。 |
| `center` | `false` | 轉成 `ivu-grid-center` class。 |
| `border` | `true` | 轉成 `ivu-grid-border` class。 |
| `hover` | `false` | 轉成 `ivu-grid-hover` class。 |

這裡可以分成兩類：

```txt
父子資料:
  col / square / padding

樣式 class:
  center / border / hover
```

`col`、`square`、`padding` 的直接使用者主要是 `GridItem`。`center`、`border`、`hover` 則由 `Grid` 產生 class，再交給 Less。

---

## 4. Provide：`GridInstance`

`Grid` 宣告：

```txt
provide () {
  return {
    GridInstance: this
  };
}
```

這代表子層拿到的不是某個靜態 object，而是父層 component instance。`GridItem` 可以透過 inject 讀到父層目前的 props 與 data。

`GridItem` 會使用：

| 父層欄位 | 子層用途 |
| --- | --- |
| `GridInstance.col` | 計算 item width。 |
| `GridInstance.square` | 決定是否計算 item height。 |
| `GridInstance.padding` | 設定 item main padding。 |
| `GridInstance.resizeCount` | 觸發重新計算 square height。 |

這種設計讓 `GridItem` 自己不需要重複宣告 `col` 或 `padding` props，但也讓它依賴父層存在。

---

## 5. Classes computed

`classes` computed 回傳 object：

```txt
{
  'ivu-grid-center': center,
  'ivu-grid-border': border,
  'ivu-grid-hover': hover
}
```

對照行為：

| Prop | class | 主要效果 |
| --- | --- | --- |
| `center` | `ivu-grid-center` | 讓 `.ivu-grid-item-main` 絕對定位並垂直置中。 |
| `border` | `ivu-grid-border` | 讓 `.ivu-grid-item` 透過 box-shadow 模擬格線。 |
| `hover` | `ivu-grid-hover` | hover 時提升 z-index 並加 shadow。 |

這三個 prop 本身不產生 inline style。真正的視覺規則在 `grid.less`。

---

## 6. Resize detector 流程

`Grid` 引入：

```txt
element-resize-detector
lodash.throttle
```

data 初始：

```txt
resizeCount: 0
handleResize: () => {}
```

mounted 後：

```txt
handleResize = throttle(onResize, 150, { leading: false })
observer = elementResizeDetectorMaker()
observer.listenTo($refs.grid, handleResize)
```

resize 發生時：

```txt
onResize()
  -> resizeCount++
```

這個 `resizeCount` 本身不渲染任何 DOM。它的用途是讓 `GridItem` watch：

```txt
'GridInstance.resizeCount' () {
  this.handleChangeHeight();
}
```

因此 resize detector 是為了 square item 的高度同步服務。

---

## 7. Cleanup

`Grid` 在 `beforeUnmount()` 中移除 listener：

```txt
observer.removeListener($refs.grid, handleResize)
```

這代表它有處理 resize observer 的生命週期清理。讀這段時要注意，`observer` 沒有在 data 裡預先宣告，而是在 mounted 時掛到 instance 上。

---

## 8. 與 `GridItem` 的責任分工

`Grid` 不直接做這些事：

| 行為 | 實際位置 |
| --- | --- |
| 計算每個 item 的 width | `GridItem.styles`。 |
| 讀 DOM width | `GridItem.handleChangeHeight()`。 |
| 寫入 item height | `GridItem.styles`。 |
| 寫入 item main padding | `GridItem.mainStyles`。 |

`Grid` 只提供資料和 resize 訊號：

```txt
Grid owns context and resize signal
GridItem owns item styles
```

---

## 9. 與 Less 的關係

`Grid` 產生的 class 主要由 `grid.less` 接住：

| Runtime class | Less 行為 |
| --- | --- |
| `ivu-grid` | clearfix，清除 item float。 |
| `ivu-grid-border` | 對 item 加 box-shadow 格線。 |
| `ivu-grid-hover` | item hover 時加 shadow。 |
| `ivu-grid-center` | item main 絕對定位垂直置中。 |

其中 item 排列本身依賴 `.ivu-grid-item { float: left; }`，不是 flex 或 CSS grid。

---

## 10. 本篇小結

`Grid` runtime 可以用下面這條鏈記住：

```txt
Grid props
  -> provide GridInstance
  -> center / border / hover classes
  -> resize detector increments resizeCount
  -> GridItem injects parent data and updates own styles
```

讀 `Grid` 時，不要因為 template 很薄就忽略它。它真正的價值在父層 context 和 resize notification，而不是 DOM 層數。
