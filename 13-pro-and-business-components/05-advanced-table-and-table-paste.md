# 進階表格與 TablePaste

## 學習目標

這篇從 `TablePaste` 切入，延伸到企業後台常見的 `CrudTable`、`ActionColumn`、`BatchToolbar`、`ColumnSetting` 與匯入/貼上資料流程。重點是理解 Table 的能力邊界，以及哪些行為適合包到業務層。

## 對照源碼

- `01-origin/source/view-ui-plus-v1.3.20/src/components/table-paste/table-paste.vue`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/table/table.vue`
- `01-origin/source/view-ui-plus-v1.3.20/types/table-paste.d.ts`
- `11-data-display-components/02-table.md`
- `11-data-display-components/09-data-display-api-patterns.md`

## TablePaste 流程

`TablePaste` 的資料流很清楚：

```txt
textarea content
  -> trim
  -> split rows by newline
  -> split columns by tab
  -> 檢查每列欄位數
  -> 第一列生成 columns
  -> 其餘列生成 data
  -> emit on-error 或 on-success
```

這是一個典型的「非結構化輸入 -> 結構化資料 -> 預覽表格」封裝。

## 進階表格封裝

企業後台常見 `CrudTable` 不應該重寫 Table，而是包裝幾條業務線：

| 能力 | 建議放置 |
| --- | --- |
| columns 渲染、排序、篩選、選取 | 交給 View UI Plus Table |
| 查詢參數與列表 API | 業務 service 或 page composable |
| 分頁與 loading | CrudTable 或 useTable |
| row action | ActionColumn slot/render |
| 批量操作 | BatchToolbar + selection |
| 欄位顯示設定 | ColumnSetting |
| 匯入/貼上 | TablePaste 或 ImportPanel |

## ActionColumn 設計

行操作欄常見問題：

- 權限控制：是否和 `Auth` 組合？
- 操作過多：是否折疊成 Dropdown？
- 危險操作：是否需要 Confirm？
- 非同步操作：是否需要 row 級 loading？
- 操作完成：是否回刷列表、局部更新 row，還是 emit 給外部？

ActionColumn 的事件 payload 應該包含 row、index、action key，而不是只傳 click event。

## 批量操作

批量操作依賴 selection 狀態，設計時要明確：

```txt
selectedRows
selectedKeys
disabled when empty
跨頁是否保留 selection
操作後是否清空 selection
失敗時是否保留 selection
```

這些行為如果不先定義，後台表格會很快變成頁面層各自修補。

## 複習題

1. TablePaste 為什麼用第一列作為 columns？
2. TablePaste 的 `on-error` 應該回傳哪些資訊才方便使用者修正？
3. CrudTable 哪些能力應該復用 Table，哪些能力可以由業務封裝提供？
4. 行操作欄如何同時處理權限、確認、loading 與回刷？
5. 批量操作跨頁保留 selection 會帶來哪些資料一致性問題？
