# DOM 與瀏覽器環境封裝

## 學習目標

這篇分析 View UI Plus 如何處理瀏覽器環境、DOM 事件、樣式能力偵測與 SSR guard。

元件庫不是只跑在瀏覽器互動階段。它可能被 Vite、SSR、測試環境或文件工具載入，所以任何直接讀取 `window`、`document` 的程式都要先確認執行環境。

## 對照源碼

- `01-origin/source/view-ui-plus-v1.3.20/src/utils/index.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/utils/canUseDom.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/utils/dom.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/utils/styleCheck.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/utils/calcTextareaHeight.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/affix/affix.vue`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/back-top/back-top.vue`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/layout/sider.vue`

這幾個元件不是完整使用清單，而是代表不同類型的瀏覽器環境與 DOM 操作場景：`affix.vue` 用來看元件如何讀取 scroll、resize 與元素位置；`back-top.vue` 用來看回到頂部功能如何使用 `isClient`、`on/off` 與 `scrollTop`；`sider.vue` 用來看響應式側邊欄如何使用 `matchMedia`、`dimensionMap` 與 resize 監聽。

## `isClient`

`utils/index.js` 只有一個核心常數：

```js
export const isClient = typeof window !== 'undefined'
```

這個判斷被大量元件使用。只要元件需要 window、document、scroll、resize、matchMedia、下載檔案，就應該先確認 `isClient`。

代表場景：

- Affix 需要監聽 scroll / resize。
- BackTop 需要讀取頁面滾動位置。
- Modal、ImagePreview、LoadingBar 需要動態建立 DOM 或操作 body。
- Select、Table、Tabs 需要在瀏覽器中測量尺寸。

## `on/off`：統一 DOM 事件註冊

`utils/dom.js` 提供 `on` 與 `off`：

```js
on(element, event, handler)
off(element, event, handler)
```

這層封裝的價值是讓元件不用重複處理事件註冊細節。Affix、Anchor、BackTop、Carousel、ColorPicker、Drawer、Modal、Scroll、Slider、Table 等元件都會使用。

閱讀時要注意兩件事：

- `on` 與 `off` 會根據瀏覽器能力選擇 `addEventListener` 或舊式 `attachEvent`。
- 元件在 mounted / activated 時註冊事件，也要在 beforeUnmount / deactivated 時移除事件，否則會留下記憶體與事件副作用。

## `canUseDom` 與 `styleCheck`

`canUseDom.js` 是更語意化的 DOM 可用性判斷。`styleCheck.js` 在它之上提供樣式能力偵測：

- `canUseDocElement()`：確認 documentElement 可用。
- `isStyleSupport(styleName, styleValue)`：偵測 CSS 屬性或屬性值是否支援。
- `detectFlexGapSupported()`：建立臨時 flex container，測量瀏覽器是否支援 flex gap。

這類能力偵測常見於元件庫，因為元件不能只依賴瀏覽器版本推測功能。實際測量比 user agent 判斷更可靠。

## `calcTextareaHeight`

`calcTextareaHeight.js` 是 Input textarea 自動高度的專用工具。它會建立或重用隱藏 textarea，把目標 textarea 的關鍵樣式同步過去，再根據內容測量高度。

這個工具說明一個元件庫設計原則：當 DOM 測量邏輯又長又容易出錯時，不應該直接塞在元件 methods 裡，而應該抽成獨立工具，讓元件只負責觸發測量與套用結果。

## SSR guard 的設計原則

只要程式有以下行為，就要先判斷瀏覽器環境：

- 讀寫 `window`。
- 讀寫 `document`。
- 建立 DOM 節點。
- 註冊全域事件。
- 讀取 layout 尺寸，例如 `offsetWidth`、`scrollHeight`。
- 呼叫 `fetch`、`URL.createObjectURL`、`window.open` 這類瀏覽器 API。

View UI Plus 的做法是把 `isClient` 當成最小 guard。元件內部如果不是瀏覽器環境，就提前 return。

## 設計啟發

DOM 封裝不只是相容性問題，也是一種邊界管理。元件越複雜，越容易到處散落 `window.addEventListener`、`document.body.appendChild`、尺寸測量與樣式判斷。

把這些邏輯集中後，可以得到三個好處：

- 更容易檢查是否有 SSR 風險。
- 更容易檢查事件是否有成對移除。
- 更容易在測試環境 mock 或隔離 DOM 行為。

現代 Vue 3 專案中，這類邏輯也可以包成 `useEventListener`、`useResizeObserver`、`useStyleSupport` 等 composable。

## 複習題

1. `isClient` 解決的是什麼問題？
2. 為什麼元件庫要封裝 `on/off`？
3. 能力偵測和 user agent 判斷有什麼差異？
4. `calcTextareaHeight` 為什麼適合抽成工具函數？
5. 哪些 DOM 行為在 SSR 或測試環境中最容易出錯？
