# CRUD 頁面組合模式

## 學習目標

這篇把查詢表單、表格、分頁、批量操作、業務彈窗與 service 串成完整 CRUD 頁面。它不是單一元件分析，而是用 View UI Plus 的元件能力整理出企業後台頁面的穩定組合方式。

## 典型結構

```txt
Page
  -> SearchForm
  -> Toolbar
  -> CrudTable
      -> ActionColumn
      -> Pagination
  -> BusinessModal
  -> ConfirmAction
```

狀態線可以拆成：

```txt
query values
pagination
loading
dataSource
selection
current row
modal visible
modal mode
submit loading
```

## Service 邊界

CRUD 頁面至少會碰到：

- `list(params)`：查列表。
- `detail(id)`：查詳情。
- `create(payload)`：新增。
- `update(id, payload)`：更新。
- `remove(id)`：刪除。
- `batchRemove(ids)`：批量刪除。

元件不應直接假設後端欄位名稱。比較穩定的做法是透過 service adapter 或 page composable 把後端 response 轉成元件需要的資料格式。

## 查詢與分頁

查詢表單和分頁要有明確互動：

| 操作 | 建議行為 |
| --- | --- |
| search | page 回到 1，重新查列表 |
| reset | 清空或回到初始條件，page 回到 1 |
| page change | 保留目前 query，更新 page |
| page size change | page 回到 1，更新 size |
| create success | 通常回到 page 1 或保留目前頁後回刷 |
| update success | 保留目前 page，回刷或局部更新 |
| delete success | 若目前頁空了，要回退上一頁 |

## 狀態歸屬

可以用這個判斷：

| 狀態 | 建議歸屬 |
| --- | --- |
| 表單目前輸入值 | SearchForm 或 page |
| 成功查詢條件 | page composable |
| loading | page composable 或 CrudTable |
| selection | CrudTable 對外 emit，由 page 決定保留策略 |
| modal mode/current row | page |
| submit loading | BusinessModal 或 page |

核心原則是：跨多個區塊共用的狀態放 page 或 composable，純視覺或局部互動狀態放元件。

## 錯誤與回饋

CRUD 頁面不要只處理成功流程。需要設計：

- 查詢失敗時是否保留舊資料。
- 新增/編輯失敗時 modal 是否保持開啟。
- 刪除失敗時 selection 是否保留。
- 權限不足時 action 是隱藏、禁用，還是提示。
- 後端欄位錯誤是否能映射回 FormItem。

## 複習題

1. CRUD 頁面中哪些狀態必須放在 page 層？
2. search 和 page change 的查詢參數合併順序應該如何定義？
3. 刪除最後一筆資料後，分頁應該如何處理？
4. create success 和 update success 的回刷策略有什麼差異？
5. 為什麼不建議讓通用 CrudTable 直接知道後端 response 格式？
