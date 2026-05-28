# Drawer 抽屜

## 學習目標

Drawer 和 Modal 同屬覆蓋層，但它的互動語意更偏「不中斷上下文的側邊工作區」。它需要遮罩、transfer、滾動鎖定和關閉控制，也需要處理方向、寬高、inner 模式、拖拽調寬與多抽屜共存。

讀完後，要能比較 Drawer 和 Modal 的共用模式與分化點，並理解為什麼抽屜元件的核心不是「右側彈出」，而是「從某個邊界打開一個可管理尺寸的工作面板」。

## 對照源碼

- `01-origin/source/view-ui-plus-v1.3.20/src/components/drawer/drawer.vue`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/drawer/index.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/modal/mixins-scrollbar.js`
- `01-origin/source/view-ui-plus-v1.3.20/types/drawer.d.ts`
- `01-origin/source/view-ui-plus-v1.3.20/src/styles/components/drawer.less`

## 和 Modal 的差異

| 面向 | Modal | Drawer |
| --- | --- | --- |
| 空間語意 | 居中對話框 | 從邊界滑出的面板 |
| 尺寸 | `width` 為主，全螢幕可選 | 左右用 `width`，上下用 `height` |
| 方向 | 固定居中 | `left`、`right`、`top`、`bottom` |
| footer | 內建確定/取消區 | 不內建 footer，交給內容自行組合 |
| Esc | 支援最上層 Modal 關閉 | 源碼中不處理 Esc |
| 拖拽 | 拖動整個 Modal 位置 | 左右方向拖拽調整寬度 |
| inner | 無 | 支援在父容器內打開 |

這些差異來自使用場景：Modal 用於確認或短流程，Drawer 更常承載表單、詳情、篩選、設定等較長內容。

## 公開 API

| API | 作用 |
| --- | --- |
| `modelValue` | 控制顯示狀態 |
| `title` / `header` slot | 標題區 |
| `width` / `height` | 左右方向使用寬度，上下方向使用高度 |
| `placement` | 抽屜方向 |
| `closable` | 是否顯示右上角關閉 |
| `mask` / `maskClosable` / `maskStyle` | 遮罩顯示、點擊關閉與樣式 |
| `scrollable` / `lockScroll` | 是否允許頁面繼續滾動 |
| `transfer` | 是否 teleport 到 body |
| `inner` | 是否在某個元素內打開 |
| `draggable` | 是否允許拖拽調整寬度 |
| `beforeClose` | 關閉前攔截 |
| `on-close` / `on-visible-change` / `on-resize-width` / `on-drag` | 關閉、可見變化、調寬與拖拽事件 |

## 狀態模型

Drawer 的核心狀態：

| 狀態 | 用途 |
| --- | --- |
| `visible` | 控制 mask 和 drawer 是否顯示 |
| `wrapShow` | 保留外層 wrap 供動畫使用 |
| `showHead` | 根據 title 或 header slot 判斷是否有標題 |
| `canMove` | 是否正在拖拽調寬 |
| `dragWidth` / `dragHeight` | 實際渲染尺寸 |
| `wrapperWidth` / `wrapperLeft` | 拖拽時用來計算寬度 |
| `tableList` / `sliderList` | 通知子元件可見性改變 |

可見流程和 Modal 類似：

```txt
modelValue
  -> visible
  -> wrapShow
  -> transition
  -> scroll lock
  -> on-visible-change
```

關閉時會延遲 300ms 再把 `wrapShow` 設回 `false`，以保留離場動畫。

## placement 與尺寸

Drawer 的 `mainStyles` 會根據方向決定使用寬度或高度：

```txt
left/right
  -> width = dragWidth

top/bottom
  -> height = dragHeight
```

和 Modal 一樣，當數值不大於 100 時視為百分比，大於 100 時視為 px。這個設計讓同一個 prop 可以支援固定像素與相對尺寸，但也要求文件和型別說清楚判斷規則。

`transitionName` 也由 `placement` 推導：

| placement | transition |
| --- | --- |
| `left` | `move-left` |
| `right` | `move-right` |
| `top` | `move-up` |
| `bottom` | `move-down` |

## inner 與 transfer

`inner` 代表 Drawer 在某個容器內打開，而不是覆蓋整個頁面。開啟 `inner` 時，通常要關閉 `transfer`，讓 Drawer 保持在當前 DOM 層級中。

相關 class：

- `ivu-drawer-wrap-inner`
- `ivu-drawer-mask-inner`
- `ivu-drawer-inner`

這裡的教學重點是：浮層不一定永遠要掛到 `body`。當浮層語意只屬於某個局部容器時，`inner` 模式可以讓遮罩、定位與滾動範圍更符合使用者預期。

## 拖拽調寬

Drawer 的 `draggable` 只支援 `left` 和 `right`。流程是：

```txt
mousedown trigger
  -> canMove = true
  -> emit on-drag('start')

document mousemove
  -> 計算 wrapperWidth 和 wrapperLeft
  -> 依 placement 算出新 width
  -> 限制 minWidth
  -> 更新 dragWidth
  -> emit on-resize-width(width)
  -> emit on-drag('dragging', width)

document mouseup
  -> canMove = false
  -> emit on-drag('end')
```

拖拽用 document 事件，而不是只綁在 trigger 上，因為使用者拖動時滑鼠很容易離開 trigger 範圍。`beforeUnmount` 必須移除事件，避免全域事件殘留。

## 多抽屜與滾動鎖定

Drawer 會把自己加入 `$root.drawerList`。關閉時，它不是直接解除 body scroll，而是先檢查父層是否還有其他可見且 `scrollable` 為 `false` 的 Drawer：

```txt
visible = false
  -> wait 300ms
  -> find other drawers
  -> if no visible non-scrollable drawer
       removeScrollEffect()
```

這比單個浮層更細緻，因為多個 Drawer 疊加時，關閉其中一個不代表頁面應該恢復滾動。

## 設計啟發

仿寫 Drawer 時，可以把問題拆成：

1. 方向決定動畫與尺寸軸線。
2. 可見狀態和動畫保留狀態要分開。
3. 局部容器模式和 body transfer 模式要分清楚。
4. 拖拽調寬要在 document 上追蹤 mousemove/mouseup。
5. 多個抽屜共存時，滾動鎖定不能只看當前實例。

## 複習題

1. Drawer 為什麼不內建 footer？
2. `placement` 如何影響尺寸、動畫與拖拽能力？
3. `inner` 和 `transfer` 為什麼通常不能同時作為預設開啟？
4. 多個 Drawer 疊加時，關閉一個為什麼不能直接解除 body scroll？
5. `on-resize-width` 和 `on-drag` 的事件語意有什麼差異？
