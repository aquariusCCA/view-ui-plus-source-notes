# Mini Table

Table 是資料展示元件的代表。第一階段不仿寫完整 Table，而是做一個能表達 columns、data、render cell、empty、loading 的最小版本。

## 練習目標

- 練習 schema-driven rendering。
- 練習 columns 與 data 的對應。
- 練習 cell render function 或 slot。
- 練習 loading、empty 狀態。
- 練習 row key 的基本設計。

## 對照源碼

主要對照：

- `src/components/table/`
- `types/table.d.ts`
- `src/styles/components/table.less`

閱讀時關注：

- columns 如何描述欄位。
- render function 如何接收 row、column、index。
- empty 與 loading 是否覆蓋 body。
- row key 如何取得。
- Table 拆成哪些子模組。

## 最小實作範圍

仿寫一個 `MiniTable`：

- 支援 `columns`。
- 支援 `data`。
- 支援 `rowKey`。
- 支援 `loading`。
- 支援 empty slot。
- 支援 column `render`。
- 支援 column `slot`，透過 named slot 自訂 cell。

先不實作：

- fixed columns。
- scroll。
- selection。
- sorting/filtering。
- expandable row。
- tree table。
- virtual scroll。

## API 設計

```ts
interface MiniTableColumn<T = any> {
  key: string
  title: string
  width?: number | string
  align?: 'left' | 'center' | 'right'
  render?: (ctx: { row: T; column: MiniTableColumn<T>; index: number }) => any
  slot?: string
}
```

| 類型 | 名稱 | 說明 |
| --- | --- | --- |
| prop | `columns: MiniTableColumn[]` | 欄位描述 |
| prop | `data: any[]` | 資料 |
| prop | `rowKey?: string \| ((row) => string)` | row key |
| prop | `loading?: boolean` | 載入中 |
| slot | `empty` | 空狀態 |
| slot | column slot | 自訂欄位內容 |

cell 顯示優先順序：

1. column `slot` 對應的 named slot。
2. column `render`。
3. `row[column.key]`。

## 實作步驟

1. 建立 `MiniTable.vue`。
2. 定義 column 型別。
3. 實作 `getRowKey(row, index)`。
4. render table header。
5. render table body。
6. 實作 cell content 優先順序。
7. data 為空時顯示 empty slot 或預設空文字。
8. loading 時顯示 loading overlay。

## 驗收案例

- 傳入 columns 與 data 時，表格能顯示對應欄位。
- column 有 `render` 時，使用 render 結果。
- column 有 `slot` 且外部提供 named slot 時，優先使用 slot。
- data 空陣列時，顯示 empty slot。
- loading 為 true 時，顯示 loading 狀態但不破壞表格結構。

## 源碼反思

View UI Plus 的 Table 是大型系統，包含 layout 計算、固定欄、滾動同步、selection、sorting、filtering、展開列、樹狀資料、合併儲存格與大量效能優化。

仿寫版只練最核心的一件事：用 columns 描述表格，再用資料驅動 DOM。這是所有複雜 Table 能力的基礎。
