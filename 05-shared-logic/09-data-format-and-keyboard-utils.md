# Data Format and Keyboard Utils：資料格式、鍵盤與隨機字串工具

## 1. 本章定位

本篇整理 `src/utils/` 中偏資料處理與輸入常數的工具。

主要來源：

```txt
src/utils/date.js
src/utils/csv.js
src/utils/keyCode.js
src/utils/random_str.js
src/components/table/export-csv.js
```

這些工具不像 DOM helper 那樣直接操作畫面，但它們支撐了日期元件、表格匯出、鍵盤互動與臨時 id 生成。

---

## 2. `date.js`：日期 parse / format 工具

`date.js` 是一份日期格式化與解析工具，註解中提到把格式從 `YYYY-MM-DD` 改成了 `yyyy-MM-dd`。

它提供的核心能力是：

```txt
fecha.format(date, mask, i18n)
fecha.parse(dateStr, format, i18n)
```

它支援 token，例如：

```txt
yyyy
yy
M / MM / MMM / MMMM
d / dd / ddd / dddd
H / HH
m / mm
s / ss
S / SS / SSS
a / A
ZZ
```

在 View UI Plus 中，日期工具主要被 `date-picker` 相關 util 使用。

---

## 3. 為什麼 UI library 會內建 date util？

日期選擇器需要解決兩件事：

1. 把 `Date` 顯示成使用者設定的格式。
2. 把使用者輸入的字串或 value 轉回可處理的日期資料。

如果完全依賴原生 `Date.toString()`，格式不可控，也不利於國際化。

所以 UI library 常會內建一層 date util，讓 DatePicker / TimePicker 有穩定的格式規則。

---

## 4. `csv.js`：資料轉 CSV 文字

`src/utils/csv.js` 的輸入大致是：

```js
csv(columns, datas, options, noHeader = false)
```

它會做：

1. 決定 column order。
2. 根據 columns 產生 header。
3. 將 data row 轉成陣列。
4. 用 separator 串接欄位。
5. 用 `\r\n` 串接每一列。

預設 options：

```js
const defaults = {
    separator: ',',
    quoted: false
};
```

如果 `quoted` 為 true，每個欄位會包成：

```txt
"value"
```

這支工具本身只負責產生 CSV 文字，不負責下載。

---

## 5. `table/export-csv.js`：下載 CSV

真正下載檔案的是 `components/table/export-csv.js`。

它會：

1. 加上 BOM，讓 Excel 開啟時較容易正確辨識編碼。
2. 支援 Blob + URL.createObjectURL。
3. 針對 IE / Edge 做 fallback。
4. 建立 `<a download>` 後觸發 click。

這裡可以看到一個分層：

```txt
utils/csv.js
  -> 只產生 CSV content

components/table/export-csv.js
  -> 處理 browser download

table.vue
  -> 決定何時匯出、匯出哪些資料
```

這種分工比把所有 CSV 邏輯塞在 Table 裡更清楚。

---

## 6. `keyCode.js`：鍵盤常數表

`src/utils/keyCode.js` 提供大量 keyCode 常數，例如：

```txt
ENTER: 13
ESC: 27
SPACE: 32
LEFT: 37
UP: 38
RIGHT: 39
DOWN: 40
DELETE: 46
```

常見用途是讓元件不用直接寫 magic number。

例如 ImagePreview / Typography 這類元件需要處理鍵盤操作時，可以使用具名常數：

```js
KeyCode.ESC
```

比直接寫：

```js
27
```

更容易閱讀。

---

## 7. `random_str.js`：臨時 id / key

`src/utils/random_str.js`：

```js
export default function (len = 32) {
    const $chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890';
    const maxPos = $chars.length;
    let str = '';
    for (let i = 0; i < len; i++) {
        str += $chars.charAt(Math.floor(Math.random() * maxPos));
    }
    return str;
}
```

常見使用者：

```txt
Modal
Drawer
Table
Tabs pane
Menu item
Cascader panel
Select option
Notification item
Anchor link
Steps
Circle
```

它通常不是安全用途，而是產生臨時 id / key，避免不同 instance 的識別衝突。

---

## 8. `oneOf()` 與 prop validator

雖然 `oneOf()` 放在 `assist.js`，但它也屬於資料判斷工具。

```js
export function oneOf (value, validList) {
    for (let i = 0; i < validList.length; i++) {
        if (value === validList[i]) {
            return true;
        }
    }
    return false;
}
```

它大量用於 props validator：

```js
validator (value) {
    return oneOf(value, ['small', 'large', 'default']);
}
```

這讓元件 props 的合法值集中用一致方式檢查。

---

## 9. 讀碼提醒

這類 util 的閱讀重點不是追 DOM，而是看它們如何支撐元件 public API：

| 工具 | 對應元件能力 |
| --- | --- |
| `date.js` | DatePicker / TimePicker 的 format / parse。 |
| `csv.js` | Table 匯出 CSV。 |
| `keyCode.js` | 鍵盤操作、Esc close、快捷鍵。 |
| `random_str.js` | instance id、list key、臨時識別。 |
| `oneOf()` | props validator。 |

---

## 10. 本章結論

資料與鍵盤工具看起來零散，但它們支撐的是 UI library 的「穩定輸入輸出」：

```txt
輸入限制
  -> oneOf / keyCode

資料格式
  -> date / csv

instance 識別
  -> random string
```

讀元件時看到這些工具，不要只停在函式本身，要回頭問：它是在保護哪個 public API 或使用者互動流程？
