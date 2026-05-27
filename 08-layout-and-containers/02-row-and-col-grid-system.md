# Row 與 Col 格線系統

## 學習目標

這篇分析 `Row` 與 `Col` 如何組成 View UI Plus 的 24 欄格線系統。重點不是只記 `span`、`offset` 這些 props，而是看懂父層 `Row` 如何透過 `provide` 把 `gutter` 交給子層 `Col`，再由 class 和 inline style 一起完成排版。

讀完後，要能描述一個 `Col` 從 props 到 class、padding、flex style 的完整流程。

## 對照源碼

- `01-origin/source/view-ui-plus-v1.3.20/src/components/row/row.vue`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/row/index.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/col/col.vue`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/col/index.js`
- `01-origin/source/view-ui-plus-v1.3.20/types/row.d.ts`
- `01-origin/source/view-ui-plus-v1.3.20/src/styles/components/grid.less`

## 結構定位

`Row` 是格線容器，負責提供橫向排列環境與欄間距。`Col` 是格線項目，負責把欄寬、排序、偏移、推拉與響應式設定映射成 class。

這組元件的核心資料流是：

```txt
Row props.gutter
  -> provide RowInstance
  -> Col inject RowInstance
  -> Col computed.gutter
  -> Col paddingLeft / paddingRight
```

`Row` 自己用負 margin 抵消第一個與最後一個 `Col` 的 padding，`Col` 則用左右 padding 製造欄間距。這是格線系統常見的 gutter 實作。

## Row 的 API 與 class

`Row` 的主要 props：

| Prop | 說明 |
| --- | --- |
| `gutter` | 欄間距，單位是 px，預設 `0` |
| `align` | 垂直對齊：`top`、`middle`、`bottom` |
| `justify` | 水平排列：`start`、`end`、`center`、`space-around`、`space-between` |
| `className` | 額外 class，型別中對應 `'class-name'` |
| `wrap` | 是否換行，預設 `true` |
| `type` | runtime 仍保留 `flex` validator，但註解標示 4.5.0 後已強制 flex |

`classes` 會輸出 `ivu-row`，並依照 `align`、`justify`、`wrap` 加上狀態 class。特別要注意，原始碼同時保留舊式的 `ivu-row-flex-*` class 和不帶 `type` 的 class，這是相容舊 API 的痕跡。

`styles` 只處理 `gutter`：

```txt
gutter !== 0
  -> Row marginLeft / marginRight = gutter / -2
```

## Col 的欄寬與位移

`Col` 的基礎 props：

| Prop | 說明 |
| --- | --- |
| `span` | 佔用欄數 |
| `order` | flex 排序 |
| `offset` | 左側空出欄數 |
| `push` | 向右推欄數 |
| `pull` | 向左拉欄數 |
| `className` | 額外 class |
| `flex` | 直接設定 flex style |

這些 props 會映射成 class：

```txt
span  -> ivu-col-span-{span}
order -> ivu-col-order-{order}
offset -> ivu-col-offset-{offset}
push -> ivu-col-push-{push}
pull -> ivu-col-pull-{pull}
```

這代表格線的固定欄寬、排序與位移都交給 less 預先產生的 class，而不是在 runtime 計算百分比。

## 響應式 props

`Col` 支援 `xs`、`sm`、`md`、`lg`、`xl`、`xxl`。每個值可以是數字，也可以是物件。

當值是數字：

```txt
xs={12}
  -> ivu-col-span-xs-12
```

當值是物件：

```txt
md={{ span: 8, offset: 2 }}
  -> ivu-col-span-md-8
  -> ivu-col-md-offset-2
```

這裡的設計重點是：runtime 不需要知道 media query 細節，它只負責產生語意 class，真正的斷點規則交給 less。

## gutter 與 flex style

`Col` 的 `styles` 有兩種來源：

| 來源 | style |
| --- | --- |
| 父層 `Row.gutter` | `paddingLeft`、`paddingRight` |
| 自身 `flex` prop | `flex` |

`flex` 會先經過 `parseFlex`：

| 傳入值 | 輸出 |
| --- | --- |
| `1` | `1 1 auto` |
| `'120px'` | `0 0 120px` |
| `'30%'` | `0 0 30%` |
| `'auto'` 或其他合法 CSS | 原樣輸出 |

這個設計讓固定尺寸與彈性比例可以共用同一個 prop。固定欄寬用 class，任意 flex 值則用 inline style。

## Runtime 與 Type 對照

`types/row.d.ts` 同時宣告 `Row` 和 `Col`，沒有獨立的 `types/col.d.ts`。閱讀型別時要注意幾個差異：

| 項目 | runtime | type |
| --- | --- | --- |
| `Row.type` | 仍存在，validator 只允許 `flex` | 未宣告 |
| `Col.xs` 等響應式 props | `Number` 或 `Object` | 寫成 `string | object` |
| `Col.flex` | `Number` 或 `String` | `number | string` |
| `className` | camelCase prop | 型別中是 `'class-name'` |

這些差異適合記錄為「型別與 runtime 漂移」案例。對使用者而言，`.d.ts` 影響 IDE 體驗；對源碼閱讀者而言，runtime 才能說明真正支援的值。

## 設計啟發

`Row` / `Col` 的好設計在於分工清楚：

- 父層管理橫向容器與欄間距。
- 子層管理欄寬、排序、位移與響應式 class。
- class 負責有限且可預先產生的排版狀態。
- inline style 負責 `gutter`、`flex` 這類動態值。
- `provide/inject` 讓使用者不用在每個 `Col` 重複傳 `gutter`。

仿寫格線系統時，先決定哪些狀態要成為設計系統 class，哪些狀態要保留為 runtime style，會比直接堆 props 更重要。

## 複習題

1. `Row` 為什麼使用負 margin，而 `Col` 使用左右 padding？
2. `Col` 的 `span`、`offset`、`push`、`pull` 分別映射到哪些 class？
3. 響應式 props 傳數字和傳物件時，class 產生規則有什麼差異？
4. 為什麼 `flex` 適合用 inline style，而不是全部做成 class？
5. `types/row.d.ts` 和 runtime 有哪些值得注意的差異？
