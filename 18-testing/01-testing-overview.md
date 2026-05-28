# 測試系統總覽

## 學習目標

這篇建立 View UI Plus 測試系統的閱讀框架。重點不是背 Mocha 或 Chai 的語法，而是看一套 UI 元件庫如何把公開 API、渲染結果、使用者互動、非同步狀態、全域服務與回歸案例放進測試。

讀完後，要能從 `test/unit/specs/button.spec.js` 這種小案例，推導到 Select、DatePicker、Table 這類複雜元件應該測哪些契約。

## 對照源碼

- `01-origin/source/view-ui-plus-v1.3.20/test/unit/index.js`
- `01-origin/source/view-ui-plus-v1.3.20/test/unit/util.js`
- `01-origin/source/view-ui-plus-v1.3.20/test/unit/specs/`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/`
- `01-origin/source/view-ui-plus-v1.3.20/types/`

## 元件庫測試要守住什麼

元件庫測試和業務頁面測試不同。業務頁面常測某條流程是否完成，元件庫更重視「契約是否穩定」。

View UI Plus 的測試至少要守住這幾層：

- API 契約：props、events、v-model、slot、公開方法要有穩定行為。
- DOM 契約：根節點、關鍵 class、輸入框、下拉列表、浮層容器要能被使用者與樣式系統依賴。
- 互動契約：click、focus、clear、select、reset、keyboard 等操作要產生預期狀態。
- 非同步契約：`nextTick`、timer、延遲渲染、服務式 API 建立的 DOM 要可等待與清理。
- 邊界契約：空值、特殊字元、大量資料、locale、重置後再次操作要不破壞原行為。
- 回歸契約：曾經出錯的組合要被固化成測試，避免未來重構再次破壞。

測試不是為了證明實作細節都正確，而是為了讓元件庫對使用者承諾的行為不被無意間改掉。

## 測試分層

可以把 View UI Plus 的測試分成四層：

| 層級 | 代表案例 | 測試重點 |
| --- | --- | --- |
| 基礎渲染 | Button、Breadcrumb | tag、class、文字、簡單 props |
| 互動元件 | Select、DatePicker、TimePicker | v-model、focus、選取、清除、事件參數 |
| 複雜資料 | Table、CSV export | 資料轉換、欄位設定、輸出格式 |
| 全域服務 | Message | 動態建立 DOM、duration、類型 class、清理 |

這個分層有助於決定測試成本。Button 不需要複雜 harness；DatePicker 則需要多次 `nextTick()`、日期工具與 DOM 操作。

## 原始測試的歷史脈絡

View UI Plus v1.3.20 的 `package.json` 描述是 Vue 3 元件庫，但 `test/unit/` 還保留：

- `new Vue()` 建立測試 instance。
- `Vue.use(ViewUIPlus)` 全域安裝插件。
- Karma + webpack + ChromeHeadless 作為測試環境。
- Mocha 的 `describe` / `it` 和 Chai 的 `expect`。
- `require.context()` 自動載入 spec。

閱讀這些測試時，要把它們當成兩種材料：

- 歷史材料：了解早期元件庫如何搭建測試環境。
- 設計材料：抽出仍然有效的測試意圖，例如 API 契約、互動流程、邊界案例。

不要把舊 harness 原樣搬到新 Vue 3 專案；但也不要因為工具舊，就忽略測試案例本身的價值。

## 讀測試的順序

建議先讀工具，再讀案例：

1. `util.js`：理解 `createVue`、`destroyVM`、`waitForIt` 這些測試基礎設施。
2. `button.spec.js`：理解最小元件測試如何驗證 tag、attribute、loading class。
3. `message.spec.js`：理解全域服務如何建立 DOM 並等待渲染。
4. `select.spec.js`：理解 props、v-model、多 instance、公開方法與效能邊界。
5. `date-picker.spec.js`：理解日期輸入、range、重置、locale 與格式化邊界。
6. `table.spec.js`：理解複雜元件也可以先測最穩定的資料輸出契約。

這個順序能看出測試從「看一個節點」逐步走向「驗證一組狀態機」。

## 設計啟發

仿寫元件庫測試時，先不要追求每個 private method 都有測試。更好的入口是問：

- 使用者會依賴哪個行為？
- 這個行為是 props、event、slot、DOM、樣式 class 還是公開方法？
- 哪些輸入會讓狀態切換？
- 哪些歷史 bug 或邊界值最容易回歸？
- 測試失敗時，能不能清楚指出是哪個契約壞了？

測試越靠近公開契約，越能支撐重構。測試越綁死內部實作，越容易在正常重構時變成噪音。

## 複習題

1. 元件庫測試為什麼比一般業務頁面更重視 API 契約？
2. View UI Plus 的測試大致可以分成哪四層？
3. 為什麼說 Karma 測試環境雖舊，但測試意圖仍然值得學？
4. Button、Message、Select、DatePicker、Table 分別代表哪種測試模式？
5. 寫一個新元件測試前，應該先問哪幾個契約問題？
