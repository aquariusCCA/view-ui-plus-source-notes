# Ellipsis 元件與 line-clamp 指令

## 學習目標

這篇對照獨立 `Ellipsis` 元件與 `v-line-clamp` 指令。兩者都能處理文字省略，但解法不同：`Ellipsis` 會測量與裁切文字，`v-line-clamp` 則只把 CSS line clamp 套到元素上。

讀完後，要能根據場景選擇「元件型省略」或「指令型省略」。

## 對照源碼

- `01-origin/source/view-ui-plus-v1.3.20/src/components/ellipsis/ellipsis.vue`
- `01-origin/source/view-ui-plus-v1.3.20/src/directives/line-clamp.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/utils/assist.js`
- `01-origin/source/view-ui-plus-v1.3.20/examples/routers/ellipsis.vue`
- `01-origin/source/view-ui-plus-v1.3.20/examples/routers/v-line-clamp.vue`
- `01-origin/source/view-ui-plus-v1.3.20/types/ellipsis.d.ts`

## Ellipsis API

| API | 作用 |
| --- | --- |
| `text` | 要顯示的文字 |
| `height` | 限制高度 |
| `lines` | 限制行數，會換算為高度 |
| `length` | 依指定長度裁切 |
| `fullWidthRecognition` | length 模式下全形字元算 2 |
| `disabled` | 停用省略計算 |
| `tooltip` | 是否用 Tooltip 顯示完整文字 |
| `transfer`、`theme`、`maxWidth`、`placement` | Tooltip 設定 |
| `on-show` | 完整顯示時觸發 |
| `on-hide` | 發生省略時觸發 |

slot 包含 `prefix`、`more`、`suffix`，用於組合省略前後的附加內容。

## 計算流程

`Ellipsis` 的核心流程：

```txt
mounted / props changed
  -> init()
  -> computeText()
  -> nextTick 測量 DOM
  -> 依 length 或 height/lines 裁切
  -> computedText
  -> limitShow()
  -> computedReady = true
  -> emit on-show / on-hide
```

它先用隱藏容器計算，再把計算結果顯示出來，避免使用者看到裁切過程。

## height 與 lines

如果沒有傳 `height`，但傳了 `lines`，元件會讀取元素 `lineHeight`：

```txt
height = lineHeight * lines
```

然後透過 `$el.offsetHeight > height` 判斷是否超出。

這種做法比單純 CSS 更可控，因為元件可以知道是否真的 oversize，並觸發 `on-show` 或 `on-hide`。

## length 與 fullWidthRecognition

如果傳入 `length`，元件會按字數裁切，不走高度裁切。

`fullWidthRecognition` 開啟時：

- ASCII 字元長度算 1。
- 非 ASCII 字元長度算 2。

這適合中英文混排場景，避免中文字和英文字母用同一個長度估算造成視覺差距太大。

## 裁切策略

高度裁切時，元件會逐步縮短文字：

- 如果高度超出很多，先用一半長度快速裁切。
- 接近目標高度後，逐字遞減。
- 使用 `n = 1000` 作為保護，避免無限迴圈。

這是典型的 DOM 測量型元件取捨：結果比純 CSS 更可控，但需要讀寫 DOM，成本也更高。

## v-line-clamp 指令

`v-line-clamp` 的流程很簡單：

```txt
mounted
  -> addClass(el, 'ivu-line-clamp')
  -> el.style['-webkit-line-clamp'] = binding.value

updated
  -> 更新 -webkit-line-clamp

unmounted
  -> removeClass
  -> 清掉 style
```

它不測量文字、不知道是否真的溢出、不提供 Tooltip、不觸發事件。它適合只需要快速套用多行 CSS 省略的場景。

## 選型比較

| 場景 | 建議 |
| --- | --- |
| 已使用 Typography，想和 copy/edit/type 共存 | Typography `ellipsis` |
| 需要 prefix/suffix/more slot | `Ellipsis` |
| 需要知道是否省略並觸發事件 | `Ellipsis` |
| 需要按字數或全形長度裁切 | `Ellipsis` |
| 只要簡單多行省略 | `v-line-clamp` |
| 需要 Tooltip 顯示完整文字 | Typography `ellipsis` 或 `Ellipsis` |
| 要避免 JS 測量成本 | `v-line-clamp` 或 Typography CSS line clamp |

## 設計啟發

省略能力可以分成三個層級：

```txt
CSS class / directive
  -> 快速、低成本、不可感知是否溢出

Typography ellipsis
  -> 和文字語意元件整合，可用 Tooltip

Ellipsis component
  -> 可測量、可裁切、可事件回報、可 slot 組合
```

不要把所有能力都塞進最底層指令。指令越底層，越應該保持簡單。

## 複習題

1. `Ellipsis` 和 `v-line-clamp` 最大的能力差異是什麼？
2. `lines` 為什麼需要讀取 `lineHeight`？
3. `fullWidthRecognition` 解決什麼中英文混排問題？
4. DOM 測量型省略元件有哪些效能成本？
5. 什麼場景下用指令比用元件更合理？
