# Component Study Order

本筆記用來規劃 View UI Plus 元件的學習順序。

原則是：

```text
先簡單，再複雜。
先單一狀態，再多狀態。
先展示元件，再表單元件。
先局部互動，再複雜互動。
```

## 第一批：基礎展示與低互動元件

這一批適合用來熟悉元件庫基本結構。

| 順序 | 元件 | 學習重點 | 狀態 |
|---|---|---|---|
| 1 | Button | type、size、loading、disabled、icon、slot | 未開始 |
| 2 | Icon | icon class、渲染方式、樣式命名 | 未開始 |
| 3 | Tag | closable、color、事件、slot | 未開始 |
| 4 | Alert | type、show-icon、closable、slot | 未開始 |
| 5 | Badge | count、dot、overflow-count、slot 包裹 | 未開始 |

## 第二批：基礎表單元件

這一批開始接觸資料輸入、狀態同步與事件設計。

| 順序 | 元件 | 學習重點 | 狀態 |
|---|---|---|---|
| 6 | Input | v-model、clearable、prefix、suffix、textarea | 未開始 |
| 7 | Radio | checked 狀態、RadioGroup、value 同步 | 未開始 |
| 8 | Checkbox | checked、indeterminate、CheckboxGroup | 未開始 |
| 9 | Switch | true-value、false-value、loading、disabled | 未開始 |
| 10 | Select | option、dropdown、value 同步、filterable | 未開始 |

## 第三批：彈層與回饋元件

這一批開始接觸動態顯示、彈層控制與使用者回饋。

| 順序 | 元件 | 學習重點 | 狀態 |
|---|---|---|---|
| 11 | Tooltip | trigger、placement、浮層定位 | 未開始 |
| 12 | Poptip | confirm、title、content、slot | 未開始 |
| 13 | Modal | visible 控制、footer、confirm/cancel | 未開始 |
| 14 | Drawer | visible 控制、placement、slot | 未開始 |
| 15 | Message | 動態掛載、函式式呼叫、全域提示 | 未開始 |
| 16 | Notice | 動態掛載、通知管理、關閉邏輯 | 未開始 |

## 第四批：資料展示元件

這一批會開始出現資料結構與渲染規則。

| 順序 | 元件 | 學習重點 | 狀態 |
|---|---|---|---|
| 17 | Card | header、extra、slot 結構 | 未開始 |
| 18 | List | data、item、slot 渲染 | 未開始 |
| 19 | Table | columns、data、render、slot、狀態管理 | 未開始 |
| 20 | Page | current、page-size、total、事件同步 | 未開始 |

## 第五批：複雜表單與高互動元件

這一批不建議一開始就讀，適合累積基礎後再處理。

| 順序 | 元件 | 學習重點 | 狀態 |
|---|---|---|---|
| 21 | Form | FormItem、validate、rules、欄位註冊 | 未開始 |
| 22 | Upload | 檔案狀態、上傳流程、事件設計 | 未開始 |
| 23 | DatePicker | 日期狀態、面板切換、格式化 | 未開始 |
| 24 | Tree | 節點資料、展開、選取、遞迴渲染 | 未開始 |
| 25 | Menu | active、open、巢狀結構、路由場景 | 未開始 |

## 優先建議

第一階段可以先完成這 10 個：

```text
Button
Icon
Tag
Alert
Badge
Input
Radio
Checkbox
Switch
Select
```

完成這 10 個後，再考慮是否進入：

```text
Modal
Tooltip
Table
Form
```

## 不建議一開始就學的元件

以下元件較複雜，不建議第一批就深入：

- Table
- Form
- Upload
- DatePicker
- Tree
- Menu

原因：

- 狀態多
- 互動多
- 內部抽象多
- 依賴其他元件或共用邏輯
- 容易卡住學習節奏
