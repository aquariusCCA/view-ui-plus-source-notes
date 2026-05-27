# Grid 與 GridItem 宮格容器

## 學習目標

這篇分析 `Grid` 與 `GridItem`。它們和 `Row` / `Col` 都處理排列，但目標不同：`Row` / `Col` 是 24 欄格線，`Grid` / `GridItem` 是等分宮格容器，常用於功能入口、統計卡片或固定欄數內容區。

讀完後，要能說明 `GridItem` 如何從父層取得欄數、padding、正方形設定，並在容器尺寸變化時重新計算高度。

## 對照源碼

- `01-origin/source/view-ui-plus-v1.3.20/src/components/grid/grid.vue`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/grid/grid-item.vue`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/grid/index.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/grid-item/index.js`
- `01-origin/source/view-ui-plus-v1.3.20/types/grid.d.ts`
- `01-origin/source/view-ui-plus-v1.3.20/src/styles/components/grid.less`

## 結構定位

`Grid` 是父容器，負責提供整體欄數、邊框、hover、置中與 padding 設定。`GridItem` 是子項目，負責依照父層欄數計算寬度，並在 `square` 開啟時讓高度等於寬度。

核心資料流是：

```txt
Grid props
  -> provide GridInstance
  -> GridItem inject GridInstance
  -> width / padding / height
```

`GridItem` 本身沒有公開 props，所有排列設定都由 `Grid` 控制。這使得宮格容器的 API 比 `Row` / `Col` 更集中。

## Grid 的 API

`Grid` 的主要 props：

| Prop | 預設值 | 說明 |
| --- | --- | --- |
| `col` | `3` | 最大欄數，每個 `GridItem` 寬度為 `100 / col %` |
| `square` | `false` | 是否讓 item 寬高一致 |
| `padding` | `'24px'` | item 內容內距 |
| `center` | `false` | 是否加上置中 class |
| `border` | `true` | 是否顯示邊框 |
| `hover` | `false` | 是否啟用 hover 效果 |

`classes` 只輸出三個布林狀態：

```txt
center -> ivu-grid-center
border -> ivu-grid-border
hover -> ivu-grid-hover
```

欄數與 padding 不做成 class，因為它們是動態值，會交給子層 inline style。

## GridItem 的寬度與 padding

`GridItem.styles` 會根據父層 `col` 計算寬度：

```txt
width = `${100 / GridInstance.col}%`
```

內容層 `mainStyles` 則讀父層 `padding`：

```txt
padding = GridInstance.padding
```

這裡有兩層 DOM：

| DOM | class | 角色 |
| --- | --- | --- |
| 外層 | `ivu-grid-item` | 控制寬度、高度與邊框排列 |
| 內層 | `ivu-grid-item-main` | 控制內容 padding 與置中樣式 |

兩層分開後，邊框、等高與內容內距比較不會互相干擾。

## square 與 resize 偵測

`square` 開啟時，`GridItem` 需要讓高度等於實際寬度。這不能只靠 props 推算，因為父容器寬度會隨視窗或外層 layout 改變。

原始碼流程：

```txt
Grid mounted
  -> 建立 element-resize-detector
  -> listenTo grid DOM
  -> resize 時 throttle onResize
  -> resizeCount++

GridItem watch GridInstance.resizeCount
  -> handleChangeHeight()
  -> getStyle($refs.col, 'width')
  -> height = width
```

`GridItem` 還會監聽 `col` 和 `square`：

| 監聽來源 | 行為 |
| --- | --- |
| `col` | 下一個 tick 後重新量寬 |
| `square` | 立即重新計算高度 |
| `GridInstance.resizeCount` | 父容器 resize 後重新計算高度 |

這是本章第一個明顯依賴 DOM 測量的元件。

## 生命週期與清理

`Grid` 在 `mounted` 建立 resize detector，並在 `beforeUnmount` 移除 listener。這種元件要特別檢查兩件事：

- listener 是否只在 DOM 存在後註冊。
- unmount 時是否清理外部資源。

如果仿寫類似元件，清理流程應該和註冊流程放在同一組生命週期中檢查，避免元件離開頁面後仍持續監聽。

## Runtime 與 Type 對照

`types/grid.d.ts` 宣告 `Grid` 的 props，`GridItem` 只宣告 default slot。這和 runtime 基本一致：`GridItem` 的公開 API 主要是承載內容，不直接接收排列 props。

值得注意的是 `padding`：

| 項目 | 設計 |
| --- | --- |
| runtime type | `String` |
| type | `string` |
| 預設值 | `'24px'` |

這表示使用者應傳完整 CSS 長度，而不是數字。和 `Card.padding` 使用 number 不同，這是兩個容器 API 的設計差異。

## 設計啟發

`Grid` / `GridItem` 展示了一種「集中式父層配置」：

- 使用者只設定父層 `Grid`。
- 子層 `GridItem` 只負責渲染內容。
- 欄數、padding、square 都由父層統一控制。
- 實際 DOM 尺寸由子層量測，父層只提供 resize 訊號。

這種設計適合所有 item 規格一致的容器。如果每個子項目都需要不同欄寬，則 `Row` / `Col` 會是更合適的 API。

## 複習題

1. `Grid` / `GridItem` 和 `Row` / `Col` 的 API 分工有什麼不同？
2. 為什麼 `GridItem` 的寬度要用 inline style？
3. `square` 為什麼需要 DOM 測量，而不是只靠 CSS class？
4. `resizeCount` 在父子通訊中扮演什麼角色？
5. `GridItem` 沒有公開 props，這對使用者 API 有什麼好處和限制？
