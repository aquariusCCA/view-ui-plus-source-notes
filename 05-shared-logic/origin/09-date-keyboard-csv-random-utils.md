# 專用工具函數整理

## 學習目標

這篇整理 `utils` 中較專用的工具：日期格式化、鍵盤碼、CSV 匯出、隨機字串。這些工具不像 `oneOf` 那樣通用，但對特定元件非常關鍵。

閱讀重點是學會判斷「專用工具」的邊界：它應該抽出來，因為邏輯複雜或可被多處使用；但它不一定應該進入最大型的 `assist.js`。

## 對照源碼

- `01-origin/source/view-ui-plus-v1.3.20/src/utils/date.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/utils/keyCode.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/utils/csv.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/utils/random_str.js`

日期工具代表案例：

- `01-origin/source/view-ui-plus-v1.3.20/src/components/date-picker/`

鍵盤碼代表案例：

- `01-origin/source/view-ui-plus-v1.3.20/src/components/image/image-preview.vue`

CSV 匯出代表案例：

- `01-origin/source/view-ui-plus-v1.3.20/src/components/table/table.vue`

隨機字串代表案例：

- `01-origin/source/view-ui-plus-v1.3.20/src/components/anchor/anchor-link.vue`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/select/option.vue`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/tabs/pane.vue`

這幾個元件與目錄不是完整使用清單，而是代表不同專用工具的落點：`date-picker/` 用來看 `date.js` 如何支援日期格式化與解析；`image-preview.vue` 用來看 `keyCode.js` 如何支援鍵盤切換、縮放與關閉；`table.vue` 用來看 `csv.js` 如何支援匯出資料；`anchor-link.vue`、`option.vue`、`pane.vue` 用來看 `random_str.js` 如何為不同類型的子項產生內部識別用 id。

## `date.js`

`date.js` 提供類似 fecha 的 parse / format 能力。DatePicker 需要大量日期格式化與解析，如果把這些邏輯寫在 DatePicker 元件中，元件會非常難讀。

它的核心能力包含：

- 將 Date 或 timestamp 格式化成指定 mask。
- 解析字串成 Date。
- 支援 `yyyy`、`MM`、`dd`、`HH`、`mm`、`ss` 等 token。
- 支援 i18n 月份、星期與 am / pm。
- 對過長字串做早期返回，降低 ReDoS 風險。

這是典型的「領域工具」。它服務 DatePicker，但本身不應該依賴 DatePicker 元件。

## `keyCode.js`

`keyCode.js` 集中定義鍵盤碼，例如 `ENTER`、`ESC`、`LEFT`、`RIGHT`、`UP`、`DOWN`，並提供兩個判斷方法：

| 方法 | 作用 |
| --- | --- |
| `isTextModifyingKeyEvent(e)` | 判斷事件是否可能修改文字 |
| `isCharacterKey(keyCode)` | 判斷 keyCode 是否代表字元輸入 |

ImagePreview、Typography 等需要鍵盤互動的元件會使用它。把 keyCode 集中定義可以避免魔法數字散落在元件內。

## `csv.js`

`csv.js` 用於 Table 匯出資料。它接收 columns、datas、options，輸出 CSV 字串。

主要設計點：

- 支援自訂 separator。
- 支援 quoted 模式。
- columns 可以是字串，也可以是帶 `title` / `key` 的物件。
- 沒有 columns 時，會從資料物件中推導欄位順序。
- 可選擇不輸出 header。

這類工具的重點是「資料轉換」，不應該直接處理下載。Table 可以先用 `csv.js` 產生內容，再由其他邏輯處理檔案輸出。

## `random_str.js`

`random_str.js` 產生指定長度的隨機字串。它被 AnchorLink、CarouselItem、Cascader、Circle、Drawer、MenuItem、Modal、Notification、Select Option、Tabs Pane 等元件使用。

主要用途通常是產生內部 key、id 或唯一標記，避免元件缺少 name 時無法追蹤。

限制是它使用 `Math.random()`，所以只適合 UI 內部識別，不適合安全場景。

## 設計啟發

專用工具應該看「責任邊界」而不是「使用次數」。即使只有 DatePicker 使用日期解析，只要邏輯足夠複雜，也值得抽成獨立模組。

可以用三個問題判斷是否該抽出：

1. 這段邏輯是否能脫離元件生命週期獨立測試？
2. 它是否有清楚輸入與輸出？
3. 它是否會讓元件本體變得太長或難讀？

符合這三點，就適合抽成 util。

## 複習題

1. `date.js` 為什麼不應該直接寫在 DatePicker 元件裡？
2. `keyCode.js` 解決了哪些魔法數字問題？
3. `csv.js` 的責任邊界到哪裡？它是否應該負責下載？
4. `random_str.js` 為什麼不能用在安全敏感場景？
5. 專用工具和全域 `assist.js` 的分界應該怎麼判斷？
