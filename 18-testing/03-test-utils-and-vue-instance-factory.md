# 測試工具與 Vue instance factory

## 學習目標

這篇分析 `test/unit/util.js`。重點是理解一套元件庫為什麼要先建立測試工具層，而不是在每個 spec 裡重複寫掛載、銷毀、事件觸發和等待邏輯。

## 對照源碼

- `01-origin/source/view-ui-plus-v1.3.20/test/unit/util.js`
- `01-origin/source/view-ui-plus-v1.3.20/test/unit/specs/button.spec.js`
- `01-origin/source/view-ui-plus-v1.3.20/test/unit/specs/select.spec.js`
- `01-origin/source/view-ui-plus-v1.3.20/test/unit/specs/date-picker.spec.js`

## util.js 解決什麼問題

測試工具層的責任是讓每個 spec 專注在行為，而不是掛載細節。

`util.js` 主要提供：

- 建立 DOM 容器：`createElm()`
- 建立任意 Vue instance：`createVue()`
- 建立單一元件 instance：`createTest()`
- 回收測試 instance：`destroyVM()`
- 日期字串轉換工具：`stringToDate()`、`dateToString()`、`dateToTimeString()`
- 事件觸發：`triggerEvent()`
- 等待非同步條件：`waitForIt()`
- Promise 版 nextTick：`promissedTick()`

這些工具讓測試能用同一套語言描述「掛載、操作、等待、斷言、清理」。

## createVue

`createVue(Compo, mounted = false)` 適合建立一個測試用 Vue instance。

它支援兩種輸入：

- 字串 template：快速測簡單渲染。
- 元件選項 object：需要 data、methods、mounted、render 時使用。

例如 Button 測試用字串 template 驗證：

- 有 `to` 時根節點是 `<a>`。
- 沒有 `to` 時根節點是 `<button>`。
- `htmlType` 只應該落在 button 上。

Select、DatePicker 則常用 object，因為需要 `data()`、`methods` 或生命週期。

## createTest

`createTest(Compo, propsData = {}, mounted = false)` 更像 Vue Test Utils 的 shallow mount 思路：傳入元件物件和 propsData，回傳元件 instance。

它適合測單一元件的 props 和公開狀態。不過 View UI Plus 現有 spec 更常使用 `createVue()`，因為很多元件需要透過全域插件註冊、slot、子元件和 template 一起測。

選擇方式可以這樣判斷：

| 需求 | 優先工具 |
| --- | --- |
| 測整段 template 和全域註冊 | `createVue` |
| 測單一元件 props | `createTest` |
| 需要 parent data / methods | `createVue` |
| 需要直接拿 component instance | 兩者都可，依測試形狀選 |

## destroyVM

`destroyVM(vm)` 會把 `vm.$el` 從 parentNode 移除。

這個清理很重要，因為元件測試會不斷把節點塞進 `document.body`。如果不清理，就會造成：

- 後一個測試查到前一個測試留下的 DOM。
- 全域服務殘留通知節點。
- 下拉、浮層、日期面板影響彼此。
- 測試在單跑時通過，整包跑時失敗。

所以現有 spec 通常寫：

```js
let vm;
afterEach(() => {
  destroyVM(vm);
});
```

這不是樣板噪音，而是測試隔離的基礎。

## triggerEvent

`triggerEvent(elm, name, ...opts)` 依事件名稱建立不同 event：

- mouse / click：`MouseEvents`
- key：`KeyboardEvent`
- 其他：`HTMLEvents`

然後用 `dispatchEvent()` 觸發。

這個工具讓測試不要直接呼叫元件 method，而是盡量從使用者事件進入。但 View UI Plus 的現有測試也會在必要時直接呼叫 `handleFocus()`、`toggleMenu()`、`clearSingleSelect()`，這通常是因為元件的互動狀態較複雜，直接走 DOM 事件成本太高。

## waitForIt

`waitForIt(condition, callback)` 每 50ms 檢查一次條件，條件成立後呼叫 callback。

它常用在：

- Select options 延遲渲染。
- Message 動態插入 DOM。
- 多 instance 都完成 menu 渲染。

這是一種簡單輪詢。優點是直觀；缺點是如果條件永遠不成立，測試會等到 framework timeout，而且錯誤訊息不夠明確。

現代寫法通常會偏向：

- `await nextTick()`
- `await flushPromises()`
- Testing Library 的 `findBy...`
- 明確 timeout 與錯誤訊息的 wait helper

但測試意圖相同：不要在 DOM 還沒更新時急著斷言。

## promissedTick

`promissedTick(component)` 把 `component.$nextTick()` 包成 Promise，讓 Select 測試可以串接：

```js
optionsA[0].click();
return promissedTick(SelectA);
```

這讓多步互動比巢狀 callback 更容易讀。雖然函式名稱有拼字問題，但它表達的設計方向是對的：非同步測試應該能線性描述。

## 設計啟發

寫元件庫測試工具時，可以保留幾個原則：

- 掛載工具要支援簡單 template 和完整 component option。
- 清理工具要成為每個 spec 的預設習慣。
- 事件工具要盡量接近使用者操作。
- 等待工具要能處理 DOM 延遲、timer、服務式 API。
- 日期、字串、資料格式工具要讓測試斷言更清楚。

測試工具不是越多越好。只有當同一種測試動作在多個 spec 中反覆出現，才值得抽出來。

## 複習題

1. `createVue` 和 `createTest` 的使用場景有什麼差異？
2. 為什麼每個 spec 都應該在 `afterEach` 清理 VM？
3. `triggerEvent` 比直接呼叫元件 method 更接近哪種測試思路？
4. `waitForIt` 解決了什麼非同步問題，又有什麼缺點？
5. 如果用 Vue Test Utils 重寫，這些 util 分別會對應到哪些能力？
