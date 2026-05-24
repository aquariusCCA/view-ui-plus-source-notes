# GridItem Runtime：Column、Square Height 與 Padding

## 1. 本章定位

本篇聚焦 `GridItem` runtime source：

```txt
01-origin/source/view-ui-plus-v1.3.20/src/components/grid/grid-item.vue
```

`GridItem` 是 `Grid` 的子項。它沒有自己的 props，主要透過 inject 讀取父層 `GridInstance`，再把父層資料轉成 item 的 inline style。

---

## 2. Template 結構

`GridItem` template 是：

```txt
div.ivu-grid-item
  -> div.ivu-grid-item-main
       -> default slot
```

對應綁定：

| DOM | 綁定 | 用途 |
| --- | --- | --- |
| outer `div` | `:style="styles"`、`ref="col"` | 控制 item width / height，並提供 DOM width 讀取目標。 |
| inner `div` | `:style="mainStyles"` | 控制內容 padding。 |
| default slot | 無額外包裝邏輯 | 放置使用者內容。 |

這個雙層結構是為了把「外層尺寸」和「內層內容 padding / center」分開。

---

## 3. Inject：父層依賴

`GridItem` 宣告：

```txt
inject: ['GridInstance']
```

它的 computed 直接讀父層：

```txt
col() {
  return this.GridInstance.col;
}

square() {
  return this.GridInstance.square;
}
```

這代表 `GridItem` 的核心行為不是由自身 props 控制，而是由父層 `Grid` 控制。正常閱讀時應該把 `GridItem` 視為 `Grid` 的子系統。

---

## 4. Width 計算

`styles` computed 會先建立：

```txt
{
  width: `${100 / col}%`
}
```

對照例子：

| `Grid.col` | `GridItem` width |
| --- | --- |
| `3` | `33.333333333333336%` |
| `4` | `25%` |
| `5` | `20%` |

source 沒有對 `col` 做大於 0 的 runtime validator。筆記中應記錄實際 source 行為，不要自行假設有防呆。

---

## 5. Square height 計算

`GridItem` data：

```txt
height: 0
```

`styles` computed 只有在兩個條件同時成立時才寫入 height：

```txt
if (height && square) {
  style.height = `${height}px`;
}
```

高度來源是 `handleChangeHeight()`：

```txt
if (square) {
  const $col = this.$refs.col;
  this.height = parseFloat(getStyle($col, 'width'));
}
```

也就是：

```txt
outer item width
  -> getStyle(..., 'width')
  -> parseFloat
  -> height
  -> style.height
```

這讓 `square` 模式下的 item 高度跟目前 DOM 寬度一致。

---

## 6. Padding 計算

inner main 的 style 來自：

```txt
mainStyles () {
  return {
    padding: this.GridInstance.padding
  };
}
```

因此 `Grid.padding` 是 string：

```txt
padding="24px"
padding="12px 16px"
```

runtime 會直接傳到 inline style，不會自動補 `px`。這點和 `Card.padding` 不同：

| 元件 | padding prop type | runtime 行為 |
| --- | --- | --- |
| `Card` | Number | 轉成 `${padding}px`，只作用於 body。 |
| `Grid` | String | 直接傳給 `GridItem` main padding。 |

---

## 7. Watch 流程

`GridItem` watch 三個來源：

| Watch target | 觸發後行為 | 用途 |
| --- | --- | --- |
| `col` | `nextTick(() => handleChangeHeight())` | 欄數改變後，等 DOM 寬度更新再重算高度。 |
| `square` | `handleChangeHeight()` | 開關 square 時更新高度。 |
| `GridInstance.resizeCount` | `handleChangeHeight()` | 父容器 resize 後更新高度。 |

`col` watcher 使用 `nextTick()` 是合理的，因為 width style 會因 `col` 改變而更新，需要等 DOM 套用後再讀 width。

---

## 8. Mounted 初始化

mounted 時會呼叫：

```txt
handleChangeHeight()
```

如果 `square` 為 `true`，初次掛載後會讀取 item width 並寫入 height。若 `square` 為 `false`，方法內部不做任何事。

---

## 9. 與 Less 的關係

`grid.less` 定義 `.ivu-grid-item` 的基礎樣式：

```txt
position: relative
float: left
width: 33.33%
box-sizing: border-box
border: 0
border-radius: 0
transition: box-shadow ...
```

但 runtime 會在 outer item 上輸出 inline width：

```txt
width: `${100 / col}%`
```

所以實際寬度由 runtime inline style 覆蓋 Less 的預設 `33.33%`。Less 的 `33.33%` 可以理解成預設樣式 fallback，而正常 `GridItem` runtime 會依父層 `col` 寫入更明確的寬度。

---

## 10. Center 模式與 inner main

`GridItem` 自己不讀 `GridInstance.center`。center 行為由父層 class 和 Less 完成：

```txt
Grid.center
  -> ivu-grid-center on root
  -> .ivu-grid-center .ivu-grid-item-main
       position: absolute
       top: 50%
       transform: translate(0, -50%)
       text-align: center
```

這表示 center 是父層樣式狀態，不是 `GridItem` 的 computed style。

---

## 11. 本篇小結

`GridItem` runtime 可以用下面這條鏈記住：

```txt
inject GridInstance
  -> col decides width
  -> square decides whether to read width as height
  -> padding decides inner main padding
  -> resizeCount / col / square watchers recalculate height
```

讀 `GridItem` 時，最重要的是看到它和父層 `Grid` 的資料流。它的 public surface 很薄，但內部高度計算依賴 DOM width、父層 resize 訊號和 Vue 更新時機。
