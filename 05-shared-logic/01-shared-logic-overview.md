# 共用邏輯總覽

## 學習目標

這篇先建立 `05-shared-logic` 的閱讀地圖。閱讀元件庫時，不能只看單一 `.vue` 檔，因為很多行為其實藏在 `utils`、`mixins`、directives 和元件內部的工具模組裡。

讀完後，要能判斷一段邏輯應該放在元件內，還是抽成共用工具、mixin、directive 或 composable。

## 源碼位置

主要閱讀：

- `01-origin/source/view-ui-plus-v1.3.20/src/utils/`
- `01-origin/source/view-ui-plus-v1.3.20/src/mixins/`
- `01-origin/source/view-ui-plus-v1.3.20/src/directives/`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/*/util.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/*/utils.js`

## 共用邏輯地圖

| 類型 | 代表檔案 | 解決的問題 |
| --- | --- | --- |
| 通用工具 | `utils/assist.js` | 型別判斷、prop 驗證、class 操作、元件查找、滾動、下載 |
| 瀏覽器工具 | `utils/dom.js`、`utils/canUseDom.js`、`utils/styleCheck.js` | DOM 事件、SSR guard、樣式能力偵測 |
| 專用工具 | `utils/date.js`、`utils/csv.js`、`utils/keyCode.js` | 日期格式化、表格匯出、鍵盤互動 |
| Options API mixin | `mixins/form.js`、`mixins/link.js`、`mixins/locale.js` | 把跨元件的 props、computed、methods 合併進元件 |
| 全域讀取 | `mixins/globalConfig.js` | 從 `app.config.globalProperties.$VIEWUI` 讀取全域設定 |
| DOM directive | `directives/clickoutside.js`、`directives/resize.js`、`directives/transfer-dom.js` | 把 DOM 行為封裝成模板可使用的指令 |
| 元件內部 util | `components/select/utils.js`、`components/table/util.js` | 只服務某一組高複雜元件的局部工具 |

這個分層說明 View UI Plus 的共用邏輯不是單一目錄承擔，而是依照「使用範圍」與「使用方式」分散在不同位置。

## 閱讀切入點

閱讀共用邏輯時，可以用三個問題來拆：

1. 這段邏輯被哪些元件重複使用？
2. 它依賴 Vue instance、DOM、全域設定，還是純資料？
3. 它的抽象方式會不會增加隱性耦合？

例如 `oneOf` 是純函數，放在 `utils/assist.js` 很合理；`mixins/form.js` 依賴 `inject` 與元件 instance，所以更適合以 mixin 形式接入 Options API 元件。

## 共用邏輯的層級

可以把 View UI Plus 的共用邏輯分成四層：

| 層級 | 特徵 | 例子 |
| --- | --- | --- |
| 純函數 | 不依賴 Vue instance，也不依賴 DOM | `oneOf`、`typeOf`、`deepCopy` |
| 瀏覽器封裝 | 依賴 `window`、`document` 或 CSSOM | `on/off`、`getStyle`、`detectFlexGapSupported` |
| 元件協作 | 需要 `$parent`、`$children`、`inject` 或全域設定 | `findComponentUpward`、`mixins/form.js`、`globalConfig.js` |
| 行為抽象 | 把完整互動行為抽出，讓多個元件共用 | `mixins/link.js`、`transfer-queue.js`、directives |

層級越高，越能節省重複程式碼，但也越容易產生隱性依賴。閱讀時要特別注意這些工具依賴了哪些元件命名、全域屬性或 DOM 環境。

## 設計啟發

元件庫的共用邏輯不是越集中越好。好的抽象要符合三個條件：

- 有明確的重複來源，例如多個輸入類元件都需要表單驗證接入。
- 有穩定的使用契約，例如 `handleFormItemChange('change', value)`。
- 不讓呼叫者猜內部狀態，例如 `transferIncrease()` 只處理層級遞增，不暴露浮層細節。

View UI Plus 的源碼同時保留了成熟設計與歷史痕跡。像 `mixins`、`$parent`、`$children` 是 Options API 時代常見寫法；用 Vue 3 重構時，很多地方可以轉成 composable 或更明確的 `provide/inject`。

## 檢查問題

1. `src/utils/` 和 `src/mixins/` 的責任差異是什麼？
2. 為什麼元件內部仍然會有自己的 `util.js`，而不是全部放到全域 `utils/`？
3. 哪些共用邏輯是純函數？哪些會依賴 Vue instance？
4. 為什麼 DOM 操作需要先判斷 `isClient`？
5. 如果你要新增一個跨元件共用行為，會如何判斷它該放在哪一層？
