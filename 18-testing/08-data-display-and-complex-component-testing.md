# 資料展示與複雜元件測試

## 學習目標

這篇整理資料展示與複雜元件的測試策略。重點是學會拆解 Table、Select、DatePicker 這類元件：不要試圖一次測完所有 DOM，而是找出最穩定、最有使用者價值的行為契約。

## 對照源碼

- `01-origin/source/view-ui-plus-v1.3.20/test/unit/specs/table.spec.js`
- `01-origin/source/view-ui-plus-v1.3.20/test/unit/specs/assets/table/csvData.js`
- `01-origin/source/view-ui-plus-v1.3.20/test/unit/specs/select.spec.js`
- `01-origin/source/view-ui-plus-v1.3.20/test/unit/specs/date-picker.spec.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/table/`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/select/`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/date-picker/`

## 複雜元件的風險

複雜元件常有多個資料源和狀態：

- props data。
- 子元件註冊。
- 排序、篩選、分頁。
- 展開、選取、禁用。
- 虛擬或延遲渲染。
- slot / render function。
- 格式化與匯出。
- 內部 cache。

如果測試只盯著 DOM 結構，很容易又脆又不完整。更好的方法是按契約拆測。

## Table CSV export

Table 現有測試選擇先測 `exportCsv()`：

- simple data 匯出 CSV。
- 包含逗號和換行的資料，搭配 `separator: ';'` 和 `quoted: true` 匯出。
- 用 callback 取得輸出內容。
- 透過 `cleanCSV()` 去掉換行和縮排差異後比對 expected。

這是一個很好的複雜元件測試切入點，因為 CSV export 是穩定的功能契約：

- 使用者傳入 columns 和 data。
- 呼叫公開方法。
- 得到可預期的字串。

它不需要測整個 Table DOM，卻能守住高價值功能。

## 測資料轉換，不測 incidental DOM

Table 的 DOM 很複雜，包含 header、body、cell、fixed、summary、expand、selection 等結構。若每個 class 都寫死，重構成本會很高。

因此 Table 測試可以優先選：

- data 到 cell 文字。
- columns render / slot。
- selection 狀態。
- sort / filter 事件。
- expand row。
- fixed column 對齊。
- CSV export。

其中 CSV export 屬於純輸出契約，最不受 DOM 重構影響。

## Select 複雜狀態

Select 的複雜點在於資料不是單向渲染：

- Option 需要註冊到 Select。
- label 和 value 要建立映射。
- filter query 會影響 options 顯示。
- multiple mode 會產生 tags。
- 兩個 instance 不能共享錯誤狀態。
- options 可以晚於 Select 出現。

因此 Select 測試不只看一個 dropdown，而是要測資料註冊、選取、事件、公開方法與 instance 隔離。

## DatePicker 狀態機

DatePicker 的狀態更多：

- type：date、month、year、datetime、range。
- selectionMode。
- visible。
- internalValue。
- display value。
- panel mode。
- locale label。
- reset 狀態。

現有測試中特別重要的是「reset 後再次選取仍和 reset 前行為一致」。這類測試能抓到複雜狀態機中最常見的 bug：第一次正常，清空或切換後第二次壞掉。

## 測試資料設計

複雜元件測試資料要有目的。好的測試資料通常包含：

- 正常案例：最小可用資料。
- 特殊字元：逗號、換行、`<`、`>`。
- 多筆資料：驗證順序和批次處理。
- 空資料：沒有 options 或 rows。
- 延遲資料：mounted 後才出現。
- 邊界資料：大量 options、日期範圍、locale。

`specs/assets/table/csvData.js` 把 CSV 資料抽出，是值得保留的做法。當 expected 很長或資料需要重複使用時，放到 assets 比塞在 spec 裡更清楚。

## 設計啟發

測複雜元件時，可以先列出契約，再挑高風險項：

1. 輸入資料如何進入元件。
2. 元件如何建立內部索引或狀態。
3. 使用者能觸發哪些狀態轉移。
4. 元件對外輸出什麼事件、方法或字串。
5. 哪些狀態重置後容易壞。
6. 哪些資料格式最容易出錯。

不要讓一個巨大測試涵蓋所有行為。複雜元件更需要小而有名字的案例，讓失敗時能立刻知道是哪個契約壞了。

## 複習題

1. Table 為什麼先測 CSV export 是合理選擇？
2. 複雜元件測試為什麼不應該過度依賴完整 DOM 結構？
3. Select 的複雜性主要來自哪些狀態？
4. DatePicker 的 reset 後再操作測試能抓到哪類 bug？
5. 複雜元件測試資料應該包含哪些類型？
