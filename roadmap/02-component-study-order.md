# Component Study Order

本筆記規劃 View UI Plus 元件學習順序。

原則：

```text
先簡單，再複雜。
先展示，再輸入。
先局部互動，再高互動。
先單一元件，再複合元件。
```

## 第一批：基礎展示與低互動元件

| 順序 | 元件 | 學習重點 | 可順便觀察 | 狀態 |
|---|---|---|---|---|
| 1 | Button | type、size、loading、disabled、icon、slot | class 命名、props 型別、install | 未開始 |
| 2 | Icon | class、圖示渲染、樣式命名 | 公開 API、樣式規則 | 未開始 |
| 3 | Tag | closable、color、事件、slot | emits、狀態樣式 | 未開始 |
| 4 | Alert | type、show-icon、closable、slot | slot fallback、icon 使用 | 未開始 |
| 5 | Badge | count、dot、overflow-count、slot 包裹 | 數值展示邏輯 | 未開始 |

## 第二批：基礎表單元件

| 順序 | 元件 | 學習重點 | 可順便觀察 | 狀態 |
|---|---|---|---|---|
| 6 | Input | v-model、clearable、prefix、suffix、textarea | 表單關聯、型別設計 | 未開始 |
| 7 | Radio | checked、RadioGroup、value 同步 | group 通訊 | 未開始 |
| 8 | Checkbox | checked、indeterminate、CheckboxGroup | group 通訊、狀態設計 | 未開始 |
| 9 | Switch | true-value、false-value、loading、disabled | value 映射 | 未開始 |
| 10 | Select | option、dropdown、value 同步、filterable | 下拉、指令、浮層 | 未開始 |

## 第三批：彈層與回饋元件

| 順序 | 元件 | 學習重點 | 可順便觀察 | 狀態 |
|---|---|---|---|---|
| 11 | Tooltip | trigger、placement、浮層定位 | 指令、定位、事件監聽 | 未開始 |
| 12 | Poptip | confirm、title、content、slot | confirm 流程 | 未開始 |
| 13 | Modal | visible、footer、confirm、cancel | portal、body 掛載、z-index | 未開始 |
| 14 | Drawer | visible、placement、slot | 動畫、掛載位置 | 未開始 |
| 15 | Message | 動態掛載、函式式呼叫、全域提示 | 插件、全域 API | 未開始 |
| 16 | Notice | 動態掛載、通知管理、關閉邏輯 | 插件、實例管理 | 未開始 |

## 第四批：資料展示元件

| 順序 | 元件 | 學習重點 | 可順便觀察 | 狀態 |
|---|---|---|---|---|
| 17 | Card | header、extra、slot 結構 | slot 設計 | 未開始 |
| 18 | List | data、item、slot 渲染 | 資料渲染規則 | 未開始 |
| 19 | Table | columns、data、render、slot、狀態管理 | 複雜 API、型別 | 未開始 |
| 20 | Page | current、page-size、total、事件同步 | v-model、事件設計 | 未開始 |

## 第五批：複雜表單與高互動元件

| 順序 | 元件 | 學習重點 | 可順便觀察 | 狀態 |
|---|---|---|---|---|
| 21 | Form | FormItem、validate、rules、欄位註冊 | 表單系統、型別 | 未開始 |
| 22 | Upload | 檔案狀態、上傳流程、事件設計 | 非同步流程 | 未開始 |
| 23 | DatePicker | 日期狀態、面板切換、格式化 | 複雜狀態、浮層 | 未開始 |
| 24 | Tree | 節點資料、展開、選取、遞迴渲染 | 資料結構 | 未開始 |
| 25 | Menu | active、open、巢狀結構、路由場景 | 階層狀態 | 未開始 |

## 第一階段建議完成清單

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

完成後再評估是否進入：

```text
Tooltip
Modal
Message
Table
Form
```

## 不建議一開始深入的元件

- Table
- Form
- Upload
- DatePicker
- Tree
- Menu

原因：

- 狀態多
- 互動多
- 依賴其他元件
- 抽象層較厚
- 容易讓第一階段卡住
