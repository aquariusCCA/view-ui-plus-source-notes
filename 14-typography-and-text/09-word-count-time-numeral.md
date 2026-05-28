# WordCount、Time 與 Numeral

## 學習目標

這篇整理三個文字輔助與格式化元件：`WordCount`、`Time`、`Numeral`。它們不負責大段排版，而是把原始值轉成更容易閱讀的文字表達。

讀完後，要能設計字數統計、相對時間與數字格式化這類小型文字元件。

## 對照源碼

- `01-origin/source/view-ui-plus-v1.3.20/src/components/word-count/word-count.vue`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/time/time.vue`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/time/time.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/numeral/numeral.vue`
- `01-origin/source/view-ui-plus-v1.3.20/types/word-count.d.ts`
- `01-origin/source/view-ui-plus-v1.3.20/types/time.d.ts`
- `01-origin/source/view-ui-plus-v1.3.20/types/numeral.d.ts`

## WordCount

`WordCount` 用來顯示目前文字長度與上限。

核心 API：

| API | 作用 |
| --- | --- |
| `value` | 要統計的內容 |
| `total` | 總字數 |
| `hideTotal` | 是否隱藏總字數 |
| `overflow` | 超出時是否顯示超出數量 |
| `circle` | 是否用圓環顯示 |
| `size` | 圓環尺寸 |

核心計算：

```txt
isOverflow = value.length > total
percent = value.length / total * 100，最高 100
strokeColor = overflow ? danger color : primary color
```

注意 runtime prop 名稱是 `value`，但 `.d.ts` 中宣告為 `model-value`。這是需要在筆記中標註的型別漂移點。

## WordCount slots

`WordCount` 提供多個 slot：

- `prefix`
- `prefix-overflow`
- `length`
- `separator`
- `total`
- `suffix`
- `suffix-overflow`

這讓使用者可以根據是否超出字數，顯示不同文案或樣式。`length` 和 `total` slot 還會提供 slot props。

設計啟發是：字數統計雖然簡單，但文字前後綴經常跟產品文案有關，用 slot 比硬編碼 prop 更合適。

## Time

`Time` 把時間值格式化為相對時間、日期或日期時間。

核心 API：

| API | 作用 |
| --- | --- |
| `time` | 必填，可為 number、Date、string |
| `type` | `relative`、`date`、`datetime` |
| `hash` | 點擊後設定 `window.location.hash` |
| `interval` | 相對時間更新間隔，`0` 表示不更新 |

時間解析規則：

- number 長度大於 10 視為毫秒，否則乘以 1000。
- Date 使用 `getTime()`。
- string 使用 `dayjs` 解析。

`relative` 會交給 `time.js` 和 locale mixin 產生可讀文案；`date` 和 `datetime` 則直接組出固定格式字串。

## Time 的生命週期

mounted 時：

```txt
setTime()
if interval !== 0:
  timer = setInterval(setTime, interval * 1000)
```

beforeUnmount 時清掉 timer。

這類元件一定要檢查清理邏輯，否則相對時間元件大量出現在列表中時，容易留下 timer。

## Numeral

`Numeral` 使用第三方 `numeral` 套件格式化數字。

核心 API：

| API | 作用 |
| --- | --- |
| `value` | 原始數字或字串 |
| `format` | numeral 格式字串 |
| `prefix` | 前綴 |
| `suffix` | 後綴 |
| `on-change` | 格式化結果改變 |

核心流程：

```txt
value / format changed
  -> Numeral(value)
  -> format ? num.format(format) : num.value()
  -> currentValue
  -> emit on-change
```

`getValue()` 方法回傳目前格式化結果。這是少數文字元件暴露實例方法的案例，閱讀 `.d.ts` 時要確認是否同步宣告。

## 三者比較

| 元件 | 原始值 | 輸出 | 狀態來源 | 特殊依賴 |
| --- | --- | --- | --- | --- |
| `WordCount` | 字串或數字 | 長度 / 總量 | computed | `Circle` |
| `Time` | 時間值 | 相對時間或日期 | data + timer | `dayjs`、locale |
| `Numeral` | 數字或字串 | 格式化數字 | data + watcher | `numeral` |

三者的共同點是：公開 API 傳入原始值，元件內部轉成可讀文字。

## 設計啟發

小型格式化元件要回答：

- 原始值允許哪些型別？
- 格式化失敗時顯示什麼？
- 是否需要定時更新？
- 是否需要回報格式化結果？
- prefix/suffix 用 prop 還是 slot？
- runtime 和 `.d.ts` 是否同步？

## 複習題

1. `WordCount` 的 `overflow` 模式顯示的是什麼？
2. `WordCount` runtime 和 `.d.ts` 有哪個明顯命名差異？
3. `Time` 為什麼需要在 `beforeUnmount` 清 timer？
4. `Numeral` 的 `format` 改變時為什麼要重新 init？
5. prefix/suffix 什麼時候用 prop，什麼時候用 slot 更合適？
