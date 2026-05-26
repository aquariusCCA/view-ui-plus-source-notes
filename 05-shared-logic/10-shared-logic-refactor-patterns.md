# 共用邏輯重構模式

## 學習目標

這篇總結從 View UI Plus 共用邏輯中可以學到的抽象模式，並把它們轉成可練習的重構方向。

View UI Plus 的源碼同時有 Options API 時代的 mixin、元件樹查找、全域工具函數，也有可以用 Vue 3 composable 重新整理的空間。學習時不要只問「它怎麼寫」，還要問「如果今天重新設計，我會怎麼抽象」。

## 對照源碼

通用工具與 DOM 封裝：

- `01-origin/source/view-ui-plus-v1.3.20/src/utils/assist.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/utils/dom.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/utils/date.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/utils/csv.js`

Options API mixin：

- `01-origin/source/view-ui-plus-v1.3.20/src/mixins/form.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/mixins/link.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/mixins/locale.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/mixins/globalConfig.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/mixins/emitter.js`

表單上下文與元件協作：

- `01-origin/source/view-ui-plus-v1.3.20/src/components/form/form.vue`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/form/form-item.vue`

浮層狀態：

- `01-origin/source/view-ui-plus-v1.3.20/src/utils/transfer-queue.js`

directive 代表案例：

- `01-origin/source/view-ui-plus-v1.3.20/src/directives/clickoutside.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/directives/resize.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/directives/transfer-dom.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/directives/line-clamp.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/directives/style.js`

這幾組檔案不是完整使用清單，而是對應後文的重構模式：`assist.js`、`dom.js`、`date.js`、`csv.js` 用來看純工具與 DOM 封裝如何保留或拆分；`form.js`、`link.js`、`locale.js`、`globalConfig.js`、`emitter.js` 用來看 Options API mixin 如何改成 composable 或更明確的上下文；`form.vue`、`form-item.vue` 用來看 `provide/inject` 的原始協作鏈路；`transfer-queue.js` 用來看浮層狀態如何抽成 z-index manager；directives 目錄下的代表檔案則用來看 DOM 行為什麼時候適合保留為 directive。

## 抽象模式對照

| 現有寫法 | 解決的問題 | 現代 Vue 3 可替代方向 |
| --- | --- | --- |
| 純工具函數 | 重複資料處理或判斷 | 保留純函數，補型別與測試 |
| `mixins/form.js` | 表單上下文接入 | `useFormItem()` |
| `mixins/link.js` | 可跳轉元件的路由行為 | `useLink(props)` |
| `mixins/locale.js` | 元件內翻譯方法 | `useLocale()` |
| `mixins/globalConfig.js` | 讀取 `$VIEWUI` | `useGlobalConfig()` |
| `utils/dom.js` | DOM 事件註冊 | `useEventListener()` |
| `transfer-queue.js` | 浮層 z-index 遞增 | `useZIndex()` 或 overlay manager |
| 元件樹查找 | 找父子兄弟元件 instance | 優先改成 `provide/inject` contract |

不是所有舊寫法都要改。重構的目的不是追新語法，而是讓依賴更明確、測試更容易、型別更可靠。

## 什麼適合保持純函數

像 `oneOf`、`typeOf`、`deepCopy`、`csv`、`date format` 這類工具，只要輸入輸出清楚，就適合保持純函數。

重構方向應該是：

- 補 TypeScript 型別。
- 拆分過大的工具檔。
- 增加單元測試。
- 明確記錄限制，例如 `deepCopy` 不支援循環引用。

不要為了 Composition API 把純函數包成 composable。沒有 reactive 狀態、生命週期或 inject 需求時，純函數更簡單。

## 什麼適合改成 composable

如果一段邏輯需要 Vue 的響應式、生命週期、注入上下文或 instance，就適合考慮 composable。

代表重構：

```txt
mixins/form.js
  -> useFormItem()
  -> 回傳 itemDisabled、handleFormItemChange

mixins/link.js
  -> useLink(props, router)
  -> 回傳 linkUrl、handleClick、handleCheckClick

mixins/globalConfig.js
  -> useGlobalConfig()
  -> 回傳 readonly config

mixins/locale.js
  -> useLocale()
  -> 回傳 t
```

這樣元件可以在 setup 中明確看到自己引入了哪些能力，而不是透過 mixin 隱式合併。

## 什麼適合 directive

如果共用邏輯的核心是「直接操作 DOM」，且使用者應該在模板層宣告它，就適合 directive。

例如：

- 點擊外部關閉。
- resize 監聽。
- transfer DOM。
- line clamp。
- 動態 style / width。

directive 的優勢是貼近模板語意；缺點是狀態流向不如 composable 明顯。設計時要控制指令的副作用，並在 unmounted 階段清理事件。

## 重構練習建議

可以依照風險從低到高練習：

1. 將 `oneOf`、`typeOf`、`deepCopy` 拆成更小的 util 模組並補測試。
2. 將 `dom.js` 改寫成帶清理函數的 `useEventListener`。
3. 將 `mixins/form.js` 改成 `useFormItem`，讓 Input 類元件在 setup 中使用。
4. 將 `mixins/link.js` 改成 `useLink`，保留原本 router / target 行為。
5. 將 `transfer-queue.js` 擴充成 overlay manager，集中管理 z-index 與浮層 stack。

每一步都要先寫出原行為，再做重構，避免只改語法但破壞使用者可見行為。

## 設計啟發

共用邏輯抽象的核心問題是「誰擁有狀態，誰暴露能力，誰清理副作用」。

View UI Plus 的實作提供了很好的閱讀材料：

- `utils` 展示純函數與 DOM 工具如何沉澱。
- `mixins` 展示 Options API 元件庫如何復用 props、computed、methods。
- `provide/inject` 展示表單這類上下文如何跨層傳遞。
- `transfer-queue` 展示全域狀態如何服務浮層協作。

學完後，應該能從一段重複程式碼中判斷它適合哪種抽象，而不是只會把它搬到 `utils`。

## 複習題

1. 哪些共用邏輯應該保持純函數，而不是改成 composable？
2. mixin 的主要問題是什麼？
3. composable 比 mixin 更清楚的地方在哪裡？
4. directive 適合處理哪些類型的共用邏輯？
5. 如果要重構 View UI Plus 的共享邏輯，你會從哪一個模組開始？為什麼？
