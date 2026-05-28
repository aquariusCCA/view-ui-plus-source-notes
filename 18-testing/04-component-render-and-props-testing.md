# 元件渲染與 props 測試

## 學習目標

這篇整理元件的基礎渲染與 props 測試。重點是判斷哪些 props 應該落成 DOM attribute、class、文字、子元件狀態或公開值，以及怎麼避免把測試寫成對內部實作的過度綁定。

## 對照源碼

- `01-origin/source/view-ui-plus-v1.3.20/test/unit/specs/button.spec.js`
- `01-origin/source/view-ui-plus-v1.3.20/test/unit/specs/breadcrumb.spec.js`
- `01-origin/source/view-ui-plus-v1.3.20/test/unit/specs/select.spec.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/button/button.vue`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/select/select.vue`

## 渲染測試的核心問題

渲染測試不是把快照存起來就結束。對元件庫來說，渲染測試要回答：

- 這個 prop 是否改變了語意元素？
- 這個 prop 是否改變了 class 或狀態 class？
- slot 內容是否落在正確位置？
- attribute 是否只出現在合理元素上？
- 預設值是否產生預期 DOM？
- 不同 props 組合是否有優先順序？

View UI Plus 的 Button 測試就是很好的入門案例。

## Button 的 tag 與 attribute

`button.spec.js` 驗證：

- `<Button to="...">` 會渲染成 `<a>`。
- `<Button>` 會渲染成 `<button>`。
- `htmlType="reset"` 只應該在 `<button>` 上產生 `type="reset"`。
- 當 Button 渲染為 `<a>` 時，不應該帶 button 專用的 `type` attribute。

這組測試看似簡單，但其實守住了公開 API 的語意：

- `to` 不是單純 class，它改變根節點。
- `htmlType` 不是無條件 attribute，它只對 button 語意有效。
- 使用者可以依賴這些輸出做表單或連結行為。

## class 測試

class 測試適合用在 class 本身就是元件 API 邊界時。

例如 Button loading 測試會 click 後檢查：

- 根節點有 `ivu-btn-loading`。
- 存在 icon。
- icon 有 `ivu-load-loop` 和 `ivu-icon-ios-loading`。

這些 class 不只是視覺細節。它們代表 loading 狀態、旋轉動畫和 icon 類型，也是樣式系統與使用者覆蓋 CSS 的穩定邊界。

但不是所有 class 都值得測。如果測試每一層 wrapper 的 class，會讓重構 DOM 結構變得困難。比較好的判斷是：

- 狀態 class 可以測。
- 使用者可能覆蓋的 prefix class 可以測。
- 不影響 API 的內部排版 class 要少測。

## props 優先順序

Select 測試中有一個案例：

- 同時設定 `placeholder` 和 `value` 時，應該顯示選中值 label，而不是 placeholder。

這種測試比單純「placeholder 能顯示」更重要，因為它驗證 props 之間的優先順序。

元件庫常見的優先順序包括：

- value 高於 placeholder。
- disabled 高於 hover / active。
- loading 高於 click。
- error 狀態高於普通狀態。
- slot 內容高於預設內容。

這些規則如果沒有測試，後續重構很容易被打破。

## 渲染輸出應該測到哪裡

渲染測試可以分成三種深度：

| 深度 | 例子 | 適用時機 |
| --- | --- | --- |
| 黑箱 DOM | `vm.$el.tagName`、文字、attribute | 使用者可觀察的輸出 |
| 關鍵 class | `ivu-btn-loading`、`ivu-select-small` | class 是樣式 API 或狀態契約 |
| instance 狀態 | `Select.values`、`picker.internalValue` | DOM 不易表達，且狀態是公開或半公開行為 |

越靠近 DOM，越像使用者視角。越靠近 instance，越能精準測狀態，但也越容易綁住內部實作。

## slot 測試

元件庫的 slot 測試應該關注：

- slot 內容是否被渲染。
- slot 是否放在正確語意位置。
- 有 slot 時是否覆蓋預設內容。
- scoped slot 是否拿到正確資料。

View UI Plus 現有 unit specs 對 slot 覆蓋不多，但在仿寫元件庫時，slot 是重要 API。尤其 Table cell render、FormItem label、Modal footer、Select option 這類可插槽區域，都應該有測試。

## 設計啟發

寫 props / render 測試時，可以使用這個順序：

1. 測預設渲染：沒有 props 時是什麼。
2. 測主要 props：最常用 props 如何影響 DOM。
3. 測 props 組合：優先順序是否正確。
4. 測狀態 class：樣式 API 是否穩定。
5. 測 slot：使用者自訂內容是否被保留。
6. 測反例：不該出現的 attribute 或 DOM 不應出現。

好測試通常同時包含正向和反向斷言。Button 的 `htmlType` 測試就是如此：button 要有 `type`，anchor 不該有 `type`。

## 複習題

1. 為什麼 Button 的根節點 tag 屬於 API 契約？
2. 什麼 class 適合寫測試，什麼 class 不一定值得測？
3. props 優先順序測試為什麼比單一 props 測試更容易抓到回歸？
4. DOM 斷言和 instance 狀態斷言各有什麼取捨？
5. 寫一個新元件的渲染測試時，應該先測哪幾類輸出？
