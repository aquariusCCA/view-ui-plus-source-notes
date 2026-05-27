# DatePicker、TimePicker 與 Calendar

## 學習目標

這篇分析日期時間類元件如何在顯示文字、`Date` 物件、字串、range array 與面板暫存值之間轉換。重點是 picker 外殼、panel 狀態、format/parser、range、confirm、shortcuts 與 Calendar 的月份/年份視圖。

## 對照源碼

- `01-origin/source/view-ui-plus-v1.3.20/src/components/date-picker/picker.vue`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/date-picker/util.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/date-picker/panel/Date/`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/date-picker/panel/Time/`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/time-picker/index.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/calendar/`
- `01-origin/source/view-ui-plus-v1.3.20/types/date-picker.d.ts`
- `01-origin/source/view-ui-plus-v1.3.20/types/time-picker.d.ts`
- `01-origin/source/view-ui-plus-v1.3.20/types/calendar.d.ts`

## Picker 外殼

`DatePicker` 和 `TimePicker` 共享大量 picker 邏輯。外層元件負責：

| 職責 | 說明 |
| --- | --- |
| input 顯示 | 把內部日期值格式化成文字 |
| dropdown | 控制 panel 顯示、click outside、transfer |
| clear | 清空值並觸發 `on-clear`、`on-change` |
| confirm | datetime、range、multiple 或 `confirm` 模式下延後提交 |
| icon | 根據日期/時間與 clear 狀態切換圖示 |
| form | 值提交後觸發 FormItem change |

外層要分清楚「正在面板中選」和「已經對外提交」。

## 值轉換

| 層級 | 狀態 |
| --- | --- |
| 外部值 | `modelValue`，可為 `Date`、字串或 array |
| 內部值 | `internalValue`，盡量轉成 Date 或 Date array |
| 顯示值 | `visualValue`，依 `format` 轉成 input text |
| 提交值 | `publicVModelValue`，依 type 決定字串、Date 或 array |
| 面板值 | panel 中的 `dates`、`rangeState`、`currentView` |

`util.js` 的 `DATE_FORMATTER`、`DATE_PARSER`、`RANGE_FORMATTER`、`RANGE_PARSER` 是讀 picker 的入口。

## Type 與 Panel

| type | 主要 panel | 特徵 |
| --- | --- | --- |
| `date` | Date panel | 選單日 |
| `daterange` | Range date panel | 左右兩個月份、rangeState |
| `datetime` | Date + Time panel | 需要 confirm |
| `datetimerange` | Range date + time | range 與時間一起提交 |
| `year` / `month` | Year/Month table | selectionMode 不同 |
| `time` | Time panel | spinner 選時分秒 |
| `timerange` | Range time panel | 起訖時間 |

Panel 只負責選擇過程，真正的對外同步仍由 picker 外層統一處理。

## Calendar

`Calendar` 比 DatePicker 更像資料展示與選擇混合元件：

- `modelValue` 轉成 `currentValue`。
- `type` 控制 month/year 模式。
- prev、next、today 會改變目前日期並 emit 事件。
- cell click/contextmenu 由 month/year 子元件往外拋。
- slot 可自訂日期或月份格內容。

Calendar 的重點不是 dropdown，而是可見日曆狀態和 slot payload。

## 設計啟發

日期時間元件一定要把格式化邏輯集中，否則 input 顯示、panel 選擇、外部值和 range 都會各自產生分支。建議先畫：

```txt
modelValue
  -> parseDate
  -> internal Date state
  -> panel state
  -> formatDate
  -> visual input text
  -> public emit value
```

## 複習題

1. DatePicker 為什麼需要同時維護顯示值與內部 Date 值？
2. `datetime` 和 `date` 在提交時機上有什麼差異？
3. range 選擇中的 `rangeState` 要記錄哪些資訊？
4. TimeSpinner 為什麼要在 mounted/updated 後調整 scrollTop？
5. Calendar 和 DatePicker 的元件定位有什麼不同？
