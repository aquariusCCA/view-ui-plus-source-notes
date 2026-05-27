# Page 分頁

## 學習目標

這篇分析 `Page` 和內部 `Options` 如何管理分頁導航。重點是 `currentPage`、`currentPageSize`、`total`、`allPages` 的關係，以及普通模式、簡潔模式、跳頁、切換每頁筆數與事件輸出。

## 對照源碼

- `src/components/page/page.vue`
- `src/components/page/options.vue`
- `types/page.d.ts`
- `src/styles/components/page.less`

## 元件定位

`Page` 是資料列表的導航元件。它不直接讀資料，只根據 `total` 和 `pageSize` 算出總頁數，讓使用者改變目前頁碼或每頁筆數。

```txt
total + currentPageSize -> allPages
modelValue -> currentPage
pageSize -> currentPageSize
使用者操作 -> changePage / onSize -> emit
```

`Options` 是內部輔助元件，負責 page size 下拉選單與 elevator 跳頁輸入。

## Props 與狀態

| props | 作用 |
| --- | --- |
| `modelValue` | 目前頁碼，預設 1 |
| `total` | 資料總數 |
| `pageSize`、`pageSizeOpts` | 每頁筆數與可選清單 |
| `simple` | 啟用簡潔版，只顯示上一頁、輸入框、下一頁 |
| `showTotal`、`showElevator`、`showSizer` | 顯示總數、快速跳頁、每頁筆數 |
| `placement`、`transfer`、`eventsEnabled` | 傳給 size select/dropdown |
| `prevText`、`nextText` | 用文字取代前後箭頭 |
| `disabled` | 禁用所有互動 |

內部狀態只有兩個核心值：`currentPage` 和 `currentPageSize`。watch `modelValue`、`pageSize`、`total` 時會同步或修正它們。

## 頁碼計算

`allPages` 由 `Math.ceil(total / currentPageSize)` 得出，若結果為 0，會回傳 1。這讓空資料時仍保留第一頁狀態。

當 `total` 變小導致目前頁碼超過最大頁時，watch `total` 會把 `currentPage` 修正到最大頁，若最大頁為 0 則回到 1。

普通模式下，模板固定渲染第一頁、最後一頁、目前頁附近頁碼，以及前後 5 頁跳轉入口。這不是用陣列迴圈產生，而是用多個條件式直接描述顯示規則。

## 事件流

| 操作 | 方法 | 事件 |
| --- | --- | --- |
| 點頁碼 | `changePage(page)` | `update:modelValue`、`on-change` |
| 上一頁 | `prev()` | `on-prev`，並透過 `changePage` 觸發 change |
| 下一頁 | `next()` | `on-next`，並透過 `changePage` 觸發 change |
| 前後 5 頁 | `fastPrev()`、`fastNext()` | 透過 `changePage` 觸發 change |
| 切每頁筆數 | `onSize(pageSize)` | `on-page-size-change`，再回到第 1 頁 |
| elevator 跳頁 | `Options.changePage()` -> `onPage(page)` | 透過 `changePage` 觸發 change |

`disabled` 會在所有入口阻止操作，包括前後頁、跳頁與切換 page size。

## 輸入處理

簡潔模式的輸入框用 `keyDown` 擋掉非數字、退格、左右方向鍵以外的按鍵。`keyUp` 支援：

| key | 行為 |
| --- | --- |
| 上方向 | 上一頁 |
| 下方向 | 下一頁 |
| Enter | 將輸入值修正到 1 到 `allPages` 之間並跳轉 |

`Options` 的 elevator 只在 Enter 時處理，使用正整數 regex 驗證，不合法時回到第 1 頁。

## Slots 與 Class

`showTotal` 開啟時，default slot 可以覆蓋總數文字。其他區塊由 props 控制。

主要 class 包括 `ivu-page`、`ivu-page-simple`、`ivu-page-item`、`ivu-page-item-active`、`ivu-page-disabled`、`ivu-page-options`、`ivu-page-options-sizer`、`ivu-page-options-elevator`。

`className` 會被加入根 class，`styles` 會直接成為根節點 inline style。

## Runtime 與型別對照

| 項目 | 觀察 |
| --- | --- |
| `placement` | runtime validator 限制 `top`、`bottom`，型別寫 string |
| `size` | runtime 限制 `small`、`default`，型別寫 string |
| `update:modelValue` | runtime emits 有宣告，型別未明確列出 |
| `eventsEnabled` | runtime 傳給內部 Select，型別有描述 |
| `Options` | 是內部元件，不在型別檔公開 |

## 設計啟發

分頁元件的 API 應該把資料狀態和 UI 狀態分清楚。`Page` 不擁有資料，只擁有頁碼和每頁筆數，並透過事件告訴外部該重新查資料。

切換 page size 後回到第 1 頁是一個重要設計決策，因為原本的頁碼在新 page size 下通常不再代表相同資料範圍。

## 複習題

1. `allPages` 為什麼在 total 為 0 時仍回傳 1？
2. `total` 變小時，`currentPage` 如何被修正？
3. `onSize` 為什麼切換 page size 後要呼叫 `changePage(1)`？
4. simple 模式和普通模式的 DOM 結構差異是什麼？
5. `Page` 的受控狀態和內部 mirror state 如何同步？
