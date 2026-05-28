# 事件、v-model 與使用者互動測試

## 學習目標

這篇分析元件互動測試。重點是理解使用者事件、元件內部狀態、`v-model`、自訂事件和公開方法之間的關係，並學會判斷什麼時候應該從 DOM 觸發，什麼時候可以直接呼叫元件方法。

## 對照源碼

- `01-origin/source/view-ui-plus-v1.3.20/test/unit/specs/button.spec.js`
- `01-origin/source/view-ui-plus-v1.3.20/test/unit/specs/select.spec.js`
- `01-origin/source/view-ui-plus-v1.3.20/test/unit/specs/date-picker.spec.js`
- `01-origin/source/view-ui-plus-v1.3.20/test/unit/util.js`

## 互動測試測什麼

互動測試不是只測「click 後 class 變了」。完整互動通常有幾個觀察點：

- 使用者做了什麼：click、focus、input、keyboard、clear。
- 元件內部狀態如何變化：visible、value、query、selectionMode。
- DOM 如何變化：dropdown 出現、tag 增加、input 清空。
- 對外事件是否觸發：`on-change`、`on-clear`、`update:modelValue`。
- 父層資料是否同步：`v-model` 對應的 data 是否更新。

一個互動越重要，越應該同時驗證內外兩側：畫面有變，事件也對。

## Button loading 案例

Button 測試用 click 觸發父層方法：

```js
<Button :loading="loading" @click="fetch">Think in FE</Button>
```

`fetch()` 把 `loading` 改成 `true`，下一個 tick 後斷言 loading class 和 icon。

這個測試的價值在於它沒有直接設定 Button 內部狀態，而是從使用者 click 走到父層 data，再回到 props，最後落成 DOM。這就是元件庫互動測試最常見的資料流：

1. 使用者操作。
2. 元件 emit 或觸發 handler。
3. 父層狀態改變。
4. props 回灌元件。
5. DOM 更新。

## Select v-model 案例

Select 測試涵蓋多種互動契約：

- 單選 click option 後，`v-model` 更新為 option value。
- `label-in-value` 模式下，`on-change` 回傳 `{ value, label }`。
- 多選模式中，兩個 Select instance 不應互相污染。
- `setQuery()` 可以更新 filterable input，並篩選 options。
- `clearSingleSelect()` 可以清空 public value。

這些測試不是單純測 DOM，而是在測 Select 的狀態機：

- menu 是否開啟。
- options 是否已經註冊。
- value 和 label 是否對齊。
- 多 instance 的內部 store 是否隔離。
- 公開方法是否維持預期語意。

複雜元件要優先測這些狀態轉移，而不是只測某個 wrapper 是否存在。

## DatePicker 事件案例

DatePicker 測試檢查 `on-change` 參數：

- `type="date"` 回傳日期字串。
- `type="daterange"` 回傳字串陣列。
- `type="time"` 回傳時間字串。
- `type="timerange"` 回傳時間字串陣列。

這個案例重點是事件 payload 的 shape。對使用者來說，事件參數就是 API。只要 payload shape 改掉，就會破壞所有使用者程式碼。

DatePicker 也測：

- focus 後開啟面板。
- click 兩個日期後形成 range。
- reset 後再次操作仍有相同行為。
- type 動態改變時，selectionMode 也跟著更新。

這些都是互動元件最容易回歸的地方。

## 從 DOM 觸發或直接呼叫 method

理想情況下，互動測試應該從 DOM 觸發，因為那最接近使用者行為。

但 View UI Plus 現有測試有時直接呼叫：

- `Select.toggleMenu(null, true)`
- `Select.setQuery('i')`
- `Select.clearSingleSelect()`
- `picker.handleFocus({ type: 'focus' })`
- `picker.handleInputChange({ target: { value } })`
- `picker.handleClear()`

這不一定是壞事。判斷標準是：這個 method 是否本身就是公開或半公開行為，或它是否能降低測試建立成本而不扭曲測試意圖。

如果直接呼叫 private method 只是為了跳過很難模擬的前置狀態，可以接受，但要讓斷言仍然落在公開結果上，例如 DOM、事件、v-model 或顯示值。

## 事件測試常見陷阱

- 只驗證 method 被呼叫，沒有驗證畫面或資料真的改變。
- 只驗證 DOM 改變，沒有驗證 emit payload。
- 沒等待 `nextTick()` 就斷言。
- 多 instance 測試沒有確認彼此獨立。
- 直接改元件內部狀態，導致測試繞過真正的使用者路徑。
- 測試事件名稱，卻不測 payload shape。

元件庫最常破壞使用者的不是「事件有沒有發」，而是「事件發出的值變了」。

## 設計啟發

寫互動測試時，可以用這個模板：

1. 建立含父層 data 和 handler 的測試元件。
2. 讓使用者事件或公開方法觸發狀態改變。
3. 等待 DOM 更新。
4. 驗證 DOM、instance 狀態、父層 data、emit payload。
5. 再測一次重置或反向操作。

對 Select、DatePicker、Upload、Tree 這類元件，最好至少有一個測試覆蓋「操作後重置，再操作一次」，因為很多 bug 只會出現在第二輪。

## 複習題

1. Button loading 測試展示了哪條資料流？
2. Select 的 `label-in-value` 為什麼必須測事件 payload？
3. DatePicker 的不同 type 為什麼要分別測 `on-change` 參數？
4. 什麼情況下可以直接呼叫元件 method？
5. 互動測試為什麼應該同時看 DOM 和對外事件？
