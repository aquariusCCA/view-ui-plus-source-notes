# Tooltip 與 Poptip

## 學習目標

Tooltip 和 Poptip 是定位浮層的代表。它們不像 Modal、Drawer 那樣覆蓋整個畫面，而是依附一個 reference 元素，根據 placement、offset、視窗邊界與 trigger 顯示一個小型浮層。

讀完後，要能理解 Popper mixin 如何把定位問題抽離出來，以及 Tooltip 和 Poptip 如何在同一套定位能力上發展出不同的互動語意。

## 對照源碼

- `01-origin/source/view-ui-plus-v1.3.20/src/components/tooltip/tooltip.vue`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/poptip/poptip.vue`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/base/popper.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/directives/clickoutside.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/utils/transfer-queue.js`
- `01-origin/source/view-ui-plus-v1.3.20/types/tooltip.d.ts`
- `01-origin/source/view-ui-plus-v1.3.20/types/poptip.d.ts`
- `01-origin/source/view-ui-plus-v1.3.20/src/styles/components/tooltip.less`
- `01-origin/source/view-ui-plus-v1.3.20/src/styles/components/poptip.less`

## Tooltip 與 Poptip 的定位共性

兩者都依賴 `base/popper.js`：

| 能力 | 來源 |
| --- | --- |
| `placement` | prop |
| `offset` | prop |
| `modelValue` / `visible` | Popper mixin data 與 watch |
| `eventsEnabled` | prop |
| `options` | Popper.js 配置 |
| `updatePopper()` | 建立或更新 Popper 實例 |
| `on-popper-show` / `on-popper-hide` | visible watch emit |

Popper mixin 的流程：

```txt
visible = true
  -> updatePopper()
  -> createPopper()
  -> new Popper(reference, popper, options)
  -> emit on-popper-show

visible = false
  -> emit on-popper-hide
```

這裡的設計重點是：元件本身不計算 top/left，而是只提供 reference、popper 和 options。定位交給成熟庫處理。

## Tooltip

Tooltip 的語意是「輔助提示」。它預設使用 hover，內容較短，互動成本低。

重要 API：

| API | 作用 |
| --- | --- |
| `content` / `content` slot | 提示內容 |
| `placement` | 位置 |
| `delay` | hover 後延遲顯示 |
| `disabled` | 禁用提示 |
| `controlled` | mouseleave 時不自動關閉 |
| `always` | 永遠可見 |
| `theme` | `dark` 或 `light` |
| `maxWidth` | 最大寬度 |
| `transfer` / `transferClassName` | 是否掛到 body 與額外 class |

Tooltip 的顯示流程：

```txt
mouseenter
  -> clear old timeout
  -> wait delay
  -> visible = true
  -> tIndex = transferIndex

mouseleave
  -> if not controlled
       wait 100ms
       visible = false
```

`always` 在 mounted 時會呼叫 `updatePopper()`，確保常駐提示也能建立定位。

## Poptip

Poptip 的語意是「有內容的彈出卡片」。它可以是一般內容浮層，也可以是 confirm 小確認框。

重要 API：

| API | 作用 |
| --- | --- |
| `trigger` | `click`、`focus`、`hover` |
| `title` / `title` slot | 標題 |
| `content` / `content` slot | 內容 |
| `confirm` | 啟用確認模式 |
| `okText` / `cancelText` | confirm 按鈕文字 |
| `width` | 浮層寬度 |
| `wordWrap` | 長文字換行 |
| `padding` | 自訂內容間距 |
| `disabled` | 禁用 |
| `popperClass` / `transferClassName` | 自訂 class |

Poptip 的 trigger 行為：

| trigger | 開啟 | 關閉 |
| --- | --- | --- |
| `click` | 點擊 reference 切換 | click outside |
| `hover` | mouseenter 延遲開啟 | mouseleave 延遲關閉 |
| `focus` | input/textarea focus | blur |
| `confirm` | 點擊切換 | ok、cancel、click outside |

`confirm` 模式會覆蓋一般 trigger 語意，只保留點擊開啟，並渲染確定/取消按鈕。

## click outside 與 transfer

Poptip 使用 `v-click-outside="handleClose"` 關閉浮層。當 `transfer` 開啟時，浮層 DOM 被 teleport 到 body，不再是 reference 容器的子元素。這會產生一個問題：點擊浮層內容也可能被判定為外部點擊。

源碼用 `disableCloseUnderTransfer` 解決：

```txt
click popper
  -> if transfer:
       disableCloseUnderTransfer = true

document click outside handler
  -> if disableCloseUnderTransfer:
       reset flag
       do not close
```

這是定位浮層常見的細節：DOM 層級改變後，事件判斷也要跟著修正。

## focus trigger 的特殊處理

Poptip 如果 trigger 是 `focus`，會在 mounted 後查找 reference 裡的 `input` 或 `textarea`，並直接綁定原生 focus/blur 事件。

原因是 reference 外層 div 的 mousedown/mouseup 不等於真正的輸入框 focus。對輸入類元件，浮層要跟隨實際焦點狀態，而不是只看包裹層互動。

## z-index

Tooltip 和 Poptip 在 `transfer` 開啟時會把 z-index 設為：

```txt
1060 + tIndex
```

`tIndex` 來自 `transfer-queue` 的遞增值。這讓後開啟的定位浮層覆蓋先開啟的浮層，也避免所有 transfer 浮層固定在同一層級。

## 設計啟發

仿寫定位浮層時，不要先寫樣式。應先確定：

1. reference 和 popper 分別是哪個 DOM。
2. 是否支援 teleport 到 body。
3. trigger 是 hover、click、focus 還是受控。
4. click outside 在 transfer 模式下如何判斷。
5. visible 改變時是否要更新定位。
6. scroll、resize 事件是否需要開啟 Popper 的 `eventsEnabled`。
7. 內容是純文字、slot、render，還是確認操作。

## 複習題

1. Tooltip 和 Poptip 為什麼共用 Popper mixin？
2. `controlled` 和 `always` 的差異是什麼？
3. Poptip 的 confirm 模式為什麼要忽略一般 trigger？
4. transfer 模式下，click outside 為什麼會更難判斷？
5. focus trigger 為什麼要直接監聽 input/textarea？
