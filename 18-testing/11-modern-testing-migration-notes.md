# 現代測試遷移筆記

## 學習目標

這篇從 View UI Plus 舊測試出發，整理如果要遷移到 Vue 3、Vitest、Vue Test Utils 或 Playwright，應該保留哪些測試意圖、替換哪些工具層，以及哪些歷史寫法不應照搬。

## 對照源碼

- `01-origin/source/view-ui-plus-v1.3.20/test/unit/index.js`
- `01-origin/source/view-ui-plus-v1.3.20/test/unit/util.js`
- `01-origin/source/view-ui-plus-v1.3.20/test/unit/karma.conf.js`
- `01-origin/source/view-ui-plus-v1.3.20/package.json`

## 遷移不是翻譯語法

把 Karma 改成 Vitest，不代表測試就現代化了。真正要遷移的是測試模型：

- 如何掛載元件。
- 如何安裝插件。
- 如何觸發事件。
- 如何等待 DOM。
- 如何測全域服務。
- 如何清理 Teleport / body DOM。
- 如何處理 fake timers。
- 如何保留回歸案例。

工具可以換，測試意圖不能丟。

## 舊寫法與新寫法對照

| View UI Plus 舊測試 | 現代 Vue 3 常見寫法 |
| --- | --- |
| `new Vue()` | `mount()` 或 `createApp()` |
| `Vue.use(ViewUIPlus)` | `global.plugins: [ViewUIPlus]` |
| `vm.$nextTick()` | `await nextTick()` |
| callback `done` | async / await |
| `waitForIt()` | `flushPromises()`、`waitFor`、自訂 async helper |
| Karma | Vitest |
| ChromeHeadless | jsdom、happy-dom、Playwright |
| Chai expect | Vitest expect |
| lolex | fake timers |

遷移後的測試應該更線性、更容易清理，也更容易在 CI 上跑。

## createVue 的替代

`createVue()` 可以拆成幾種現代 helper：

- `mountWithPlugin(templateOrComponent, options)`：預設安裝 View UI Plus。
- `mountToBody(component)`：需要真實 DOM 或 Teleport 時掛到 body。
- `destroyWrapper(wrapper)`：unmount 並清 body。
- `trigger(el, event)`：包裝 DOM event 或使用 wrapper.trigger。

Vue Test Utils 的 `mount()` 能取代大部分 `createVue()`，但要注意：

- 有些全域服務仍需要真實 app instance。
- Teleport 到 body 的節點需要額外清理。
- 不要過度使用 shallow mount，否則元件庫的子元件協作測不到。

## 非同步遷移

舊測試常用：

- `done`
- `vm.$nextTick(() => {})`
- `waitForIt(condition, callback)`
- Promise then chain

現代寫法可以改成：

```js
it('updates selected value', async () => {
  const wrapper = mount(...);
  await wrapper.find('.ivu-select-item').trigger('click');
  await nextTick();
  expect(wrapper.vm.value).toBe('beijing');
});
```

重點是讓測試流程線性化：

1. arrange。
2. act。
3. await。
4. assert。

這比多層 callback 更容易定位失敗。

## 全域服務測試遷移

Message、Notice、Modal.confirm 這類 API 在現代測試中仍要看 `document.body`。

可以建立 helper：

- 呼叫服務前清空相關 container。
- 呼叫服務。
- `await waitFor(() => document.querySelector(selector))`。
- 驗證文字和 class。
- 呼叫 destroy 或推進 timer。
- 驗證 DOM 移除。

如果使用 fake timers，要記得：

- 測試開始前 `vi.useFakeTimers()`。
- 操作後 `vi.advanceTimersByTime(ms)`。
- 測試結束 `vi.useRealTimers()`。

## 哪些測試意圖必須保留

遷移時最容易丟的是邊界案例。以下意圖必須保留：

- Button 的 tag 與 attribute 語意。
- Message 的多 type class 與 DOM 建立。
- Select 的 placeholder / value 優先順序。
- Select 的特殊字元 label。
- Select 的多 instance 隔離。
- Select 的公開方法行為。
- DatePicker 的 event payload shape。
- DatePicker 的 reset 後再次操作。
- DatePicker 的 locale label。
- Table 的 CSV 特殊資料輸出。

如果遷移後只剩簡單 render 測試，等於失去了原測試最有價值的部分。

## 什麼時候需要 Playwright

不是所有測試都適合 jsdom。以下情境可考慮 Playwright：

- Popper 定位。
- scroll 行為。
- focus trap。
- drag resize。
- 真實鍵盤導航。
- 視覺回歸。
- fixed column 對齊。
- z-index 與 overlay stacking。

元件庫可以採混合策略：Vitest 負責大多數單元與互動測試，Playwright 負責瀏覽器真實行為。

## 設計啟發

遷移測試時，不要以「檔案一比一改寫」作為目標。更好的流程是：

1. 列出舊測試守住的契約。
2. 刪掉只測內部細節且價值低的斷言。
3. 用新工具重建掛載、等待、清理 helper。
4. 先搬高價值回歸案例。
5. 再補舊測試缺少的 Form、Overlay、Keyboard、A11y 案例。

現代化的目標是讓測試更貼近使用者契約，而不是只把語法換新。

## 複習題

1. 為什麼測試遷移不能只做語法翻譯？
2. `createVue` 在 Vue Test Utils 中可以拆成哪些 helper？
3. 全域服務測試遷移後為什麼仍然要查 `document.body`？
4. 哪些 View UI Plus 舊測試意圖最值得保留？
5. 什麼情況下應該用 Playwright，而不是只用 Vitest？
