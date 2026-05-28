# 複合表單與查詢表單

## 學習目標

這篇設計企業後台常見的 `SearchForm`、`FilterPanel`、`AdvancedQuery`。它們不是 View UI Plus 的單一內建元件，而是基於 Form、Input、Select、DatePicker、TreeSelect、Upload 等表單元件做出的業務組合。

## 對照章節

- `10-form-and-input-components/02-form-and-form-item.md`
- `10-form-and-input-components/03-input-and-input-number.md`
- `10-form-and-input-components/04-select-option-option-group.md`
- `10-form-and-input-components/06-date-time-picker.md`
- `10-form-and-input-components/08-cascader-tree-select-transfer.md`
- `10-form-and-input-components/11-form-input-api-patterns.md`

## 查詢表單核心問題

查詢表單和普通表單不同，它通常不以「提交建立資料」為目標，而是以「產生查詢條件」為目標。

| 問題 | 設計重點 |
| --- | --- |
| 欄位很多 | 支援收合、更多條件、欄位分組 |
| 預設值 | 區分初始化值、重置值、目前值 |
| 遠端選項 | 支援 loading、依賴欄位、快取與重新載入 |
| 日期範圍 | 統一轉換成後端需要的 start/end 欄位 |
| 空值處理 | 清理 `undefined`、空字串、空陣列 |
| 提交語意 | `search`、`reset`、`change`、`submit` 要清楚 |

## Schema 設計

常見 schema 可以先拆成：

```ts
type QueryField = {
  key: string
  label: string
  component: string
  props?: Record<string, unknown>
  options?: unknown[] | (() => Promise<unknown[]>)
  defaultValue?: unknown
  transform?: (value: unknown, values: Record<string, unknown>) => Record<string, unknown>
  hidden?: boolean | ((values: Record<string, unknown>) => boolean)
}
```

實作時不一定要一次做到完整泛型，但筆記要能回答每個欄位如何渲染、如何收集值、如何轉 payload。

## 收合與版面

查詢區常見版面策略：

- 固定顯示前 N 個欄位，其餘點「展開」後顯示。
- 使用 grid 或 row/col 控制欄位寬度。
- 按鈕區固定在右側或最後一格。
- 小螢幕時改成一欄或兩欄。
- 長標籤欄位要避免擠壓輸入框。

這裡可以回看 `08-layout-and-containers/` 的 Row、Col、Space、Card，但查詢表單不應變成過度裝飾的卡片堆疊。

## 事件契約

查詢表單至少要定義：

| 事件 | payload |
| --- | --- |
| `search` | 清理與轉換後的查詢條件 |
| `reset` | 重置後的查詢條件 |
| `change` | 原始 values、changed key、changed value |
| `collapse-change` | 是否展開 |

如果有遠端選項，也要決定錯誤是由表單 emit，還是由欄位內顯示。

## 複習題

1. 查詢表單和資料建立表單的核心差異是什麼？
2. reset 應該回到空值、初始化值，還是上一次成功查詢值？
3. 日期範圍欄位應該在表單內轉換，還是在 service 層轉換？
4. schema 型表單如何保留自訂 slot 的能力？
5. 遠端下拉選項如果依賴另一個欄位，狀態要如何清理？
