# 表單、輸入與驗證測試

## 學習目標

這篇整理表單輸入類元件的測試策略。重點是看輸入值如何從 DOM 進入元件，再透過 v-model、校驗、格式化和事件回到使用者程式碼。

## 對照源碼

- `01-origin/source/view-ui-plus-v1.3.20/test/unit/specs/select.spec.js`
- `01-origin/source/view-ui-plus-v1.3.20/test/unit/specs/date-picker.spec.js`
- `01-origin/source/view-ui-plus-v1.3.20/test/unit/specs/time-spinner.spec.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/form/`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/input/`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/select/`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/date-picker/`

## 輸入類元件的測試模型

表單與輸入元件通常有一條完整資料流：

1. DOM 事件輸入原始值。
2. 元件解析或轉換值。
3. 元件更新內部狀態。
4. 元件 emit 給父層。
5. 父層 v-model 更新。
6. 元件重新接收 props。
7. 顯示值同步。

測試應該挑幾個關鍵節點斷言，而不是只看其中一端。

## Select 輸入測試

Select 測試覆蓋幾個重要輸入場景：

- placeholder 顯示。
- 初始 value 對應到 option label。
- option label 包含 `<`、`>` 這類特殊字元時，顯示不應被破壞。
- filterable 模式下，input value 應顯示選中 label。
- options 延遲設定後，元件能重新註冊選項。
- 200 個 options 的渲染不能超過測試設定的時間上限。

這些測試說明 Select 不是普通 input，它同時處理：

- 顯示值和提交值分離。
- option 子元件註冊。
- filter query。
- dropdown DOM。
- 多選 tag。
- 大量資料效能。

## DatePicker 輸入測試

DatePicker 測試更重視格式和型別：

- `type="date"` 輸入後回傳日期字串。
- `type="daterange"` 輸入 `"start - end"` 後回傳陣列。
- `type="datetime"` 可以把字串轉成 Date。
- `type="datetimerange"` 可以把字串陣列轉成 Date 陣列。
- 空字串作為 v-model value 時不能報錯。
- reset 後 display value 要清空，且 `on-change` 要觸發。

日期元件測試要特別小心：

- timezone。
- 今天日期。
- 月份從 0 開始。
- range 順序。
- 字串格式。
- locale label。

View UI Plus 的測試用 `dateToString()`、`dateToTimeString()`、`stringToDate()` 降低這些細節造成的雜訊。

## Form 驗證測試應該補什麼

現有 unit specs 對 Form 驗證覆蓋較少。若要完整測 Form / FormItem，應該補：

- required rule。
- async-validator 回傳錯誤。
- trigger 為 blur / change 的差異。
- validate callback 參數。
- resetFields 是否回到初始值。
- clearValidate 是否只清錯誤，不改 value。
- nested prop path。
- 動態新增 / 移除 FormItem。

表單驗證測試要把「值」和「錯誤狀態」分開看。錯誤訊息出現只是結果，真正要守住的是 validation rule、trigger 和資料路徑。

## 輸入邊界案例

表單輸入類元件最常出問題的是邊界值：

- 空字串。
- `null`、`undefined`。
- `0` 和 false。
- 特殊符號，例如 `< 100$`。
- 非法日期。
- 開始日期晚於結束日期。
- options 後到。
- value 存在但 option 尚未載入。
- disabled / readonly 狀態下的互動。

每個輸入元件至少要選幾個和自身語意最相關的邊界測。

## 設計啟發

設計輸入測試時，可以用這張檢查表：

| 類型 | 要測的問題 |
| --- | --- |
| 初始值 | value / modelValue 是否能正確顯示 |
| 使用者輸入 | DOM input 是否能改變內部值 |
| 對外事件 | change / input / update 是否發出正確 payload |
| 格式化 | 顯示值和提交值是否正確轉換 |
| 驗證 | rule、trigger、錯誤訊息和 callback 是否一致 |
| 重置 | clear / reset 後能否再次正常操作 |
| 邊界 | 空值、特殊字元、延遲資料、大量資料 |

元件庫的輸入測試應該偏向行為與資料形狀，不要只看 input 裡有沒有文字。

## 複習題

1. 輸入類元件的完整資料流有哪些步驟？
2. Select 為什麼要分別測 value、label、placeholder 和 options 註冊？
3. DatePicker 測試為什麼需要日期轉換工具？
4. Form 驗證測試除了錯誤訊息，還應該測哪些契約？
5. 輸入元件最常見的邊界值有哪些？
