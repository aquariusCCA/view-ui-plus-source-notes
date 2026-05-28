# Table 表格

## 學習目標

這篇分析 `Table` 如何把 `columns` 和 `data` 轉成可排序、可篩選、可選取、可展開、可固定欄、可樹形展示、可合計與可匯出的表格。Table 是本章最高複雜度元件，閱讀重點是資料派生、欄位派生、行狀態、DOM 測量與事件契約。

## 對照源碼

- `01-origin/source/view-ui-plus-v1.3.20/src/components/table/table.vue`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/table/table-head.vue`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/table/table-body.vue`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/table/table-tr.vue`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/table/cell.vue`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/table/summary.vue`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/table/util.js`
- `01-origin/source/view-ui-plus-v1.3.20/types/table.d.ts`

## 元件定位

| 模組 | 角色 |
| --- | --- |
| `Table` | 根元件，管理資料、欄位、狀態、捲動、固定欄、事件與公開方法 |
| `TableHead` | 渲染表頭、排序、篩選、全選、欄寬拖曳 |
| `TableBody` | 渲染資料列、展開列、樹形子列、rowspan/colspan |
| `TableCell` | 判斷 cell 類型，渲染 index、selection、html、expand、render、slot、tree icon |
| `TableSummary` | 根據 columns 和 summary data 渲染合計列 |
| `util.js` | 處理多級表頭、葉子欄位、固定欄排序與欄位 id |

`Table` 透過 `provide` 暴露 `TableInstance`，讓 `TableCell` 和 `TableSlot` 能取得根表格狀態與 slots。

## 核心資料

| 狀態 | 來源 | 用途 |
| --- | --- | --- |
| `data` | prop | 使用者傳入的原始資料 |
| `cloneData` | deep copy of `data` | row click、expand、匯出等場景取得穩定資料 |
| `rebuildData` | sort/filter 後資料 | 實際渲染的資料 |
| `objData` | 由 `data` 建出的狀態表 | 保存 `_isChecked`、`_isExpanded`、`_isHighlight`、`_isHover`、`_isShowChildren` |
| `columns` | prop | 使用者傳入欄位設定 |
| `cloneColumns` | 派生欄位 | 加入 `_index`、`_width`、`_sortType`、`_filterChecked` 等內部欄位 |
| `allColumns` | 葉子欄位 | 用於 body、summary、匯出和固定欄計算 |
| `columnRows` | 多級表頭列 | 用於 grouped header 的 rowspan/colspan |

Table 的第一個閱讀重點是：資料值和 UI 狀態完全分開。`data` 描述業務資料，`objData` 描述列的互動狀態。

## Columns 派生

`makeColumnsId()` 會替每個 column 加上 `__id`，讓多級表頭與固定欄能用 id 回到原欄位。

`getAllColumns()` 會把有 `children` 的欄位展平成葉子欄位。`convertToRows()` 則把巢狀欄位轉成表頭列，計算：

| 欄位 | 用途 |
| --- | --- |
| `level` | 欄位所在層級 |
| `colSpan` | group header 橫向覆蓋幾個葉子欄位 |
| `rowSpan` | 葉子欄位需要補幾層高度 |

`makeColumns()` 會把固定左欄、普通欄、固定右欄重新排序，並初始化排序、篩選與寬度狀態。

## Row 狀態

`makeObjBaseData()` 會從 row 上的保留欄位建立互動狀態：

| 原始欄位 | 內部狀態 | 用途 |
| --- | --- | --- |
| `_disabled` | `_isDisabled` | selection 是否禁用 |
| `_checked` | `_isChecked` | selection 預設選中 |
| `_expanded` | `_isExpanded` | expand column 預設展開 |
| `_highlight` | `_isHighlight` | highlight-row 預設高亮 |
| `_showChildren` | `_isShowChildren` | tree data 預設展開子節點 |

這種設計讓使用者可以在資料中提供初始狀態，但元件互動後不必直接污染所有原始資料欄位。

## Cell 類型

`TableCell` 根據 column 設定決定 `renderType`：

| 類型 | 條件 | 輸出 |
| --- | --- | --- |
| `index` | `column.type === 'index'` | 自動序號或 `indexMethod` |
| `selection` | `column.type === 'selection'` | checkbox |
| `html` | `column.type === 'html'` | `v-html` |
| `expand` | `column.type === 'expand'` | 展開圖示 |
| `render` | `column.render` | render function |
| `slot` | `column.slot` | 呼叫 `TableInstance.$slots[column.slot]` |
| `normal` | fallback | 顯示 `row[column.key]`，可配 tooltip |

Table 同時支援 render function 和 slot，是因為表格 cell 常需要高度自訂。這兩種 API 都要被視為公開契約。

## 排序與篩選

排序由 `TableHead` 觸發，最後回到根元件 `handleSort()`。

| 設定 | 行為 |
| --- | --- |
| `sortable: true` | 本地排序，使用 `sortMethod` 或預設比較 |
| `sortable: 'custom'` | 不改 `rebuildData`，只 emit `on-sort-change` |
| `sortType` | 初始化排序狀態 |

篩選由 column 的 `filters`、`filterMethod`、`filterMultiple`、`filteredValue` 與 `filterRemote` 組成。若存在 `filterRemote`，本地 `filterData()` 會放行，並讓遠端方法處理資料。

事件 payload：

```txt
on-sort-change -> { column, key, order }
on-filter-change -> column
```

## 選取與高亮

多選狀態放在 `objData._isChecked`。單列切換會 emit：

```txt
on-select / on-select-cancel -> (selection, row)
on-selection-change -> selection
```

全選會跳過 disabled row，並同步樹形子資料：

```txt
on-select-all / on-select-all-cancel -> selection
on-selection-change -> selection
```

`highlightRow` 則是另一條狀態線，透過 `_isHighlight` 標記目前列，並 emit：

```txt
on-current-change -> (newData, oldData)
```

## 展開與樹形資料

Table 支援兩種展開：

| 類型 | 入口 | 狀態 | 事件 |
| --- | --- | --- | --- |
| expand column | `column.type === 'expand'` | `_isExpanded` | `on-expand(row, status)` |
| tree data | `column.tree` + `row.children` | `_isShowChildren` | `on-expand-tree(rowKey, status)` |

樹形資料依賴 `rowKey`。`toggleTree()` 會根據 `_loading` 和 `loadData` 處理非同步子節點載入。`updateShowChildren` 開啟時，元件會把 `_isShowChildren` 同步回原資料的 `_showChildren`，避免 data 更新後展開狀態消失。

## DOM 測量與固定欄

Table 大量依賴 DOM 測量：

| 方法 | 負責內容 |
| --- | --- |
| `handleResize()` | 計算欄寬、表格寬度、固定欄寬度 |
| `fixedHeader()` | 根據 header/footer/summary 計算 body 高度 |
| `fixedBody()` | 判斷水平與垂直 scrollbar |
| `handleBodyScroll()` | 同步 header、fixed body、summary 的 scrollLeft/scrollTop |

元件在 mounted 時監聽 window resize，並使用 `element-resize-detector` 監聽自身尺寸。beforeUnmount 會移除 listener 和 observer。

固定欄不是 CSS sticky 的單一路徑，而是渲染左固定表格、主表格、右固定表格三份結構，再用捲動同步維持視覺一致。

## 右鍵選單與浮層依賴

`contextMenu` 會阻止原生右鍵選單。`showContextMenu` 搭配 `contextMenu` slot，使用 `Dropdown trigger="custom"` 顯示右鍵選單。

右鍵事件 payload：

```txt
on-contextmenu -> (row, event, position)
```

`position` 是相對 table wrapper 的座標，供選單定位使用。

## Summary 與 CSV

`showSummary` 開啟後，`summaryData` 會根據 `summaryMethod` 或預設數字加總產生每欄合計值。第一欄顯示 `sumText` 或 locale 的 sum text。

`exportCsv(params)` 是 Table 的 instance method。若沒有提供 `columns` 和 `data`，會使用 `allColumns` 以及 `data` 或 `rebuildData`。這類公開方法也應該進入 API 對照筆記。

## Runtime 與型別對照

| 項目 | 觀察 |
| --- | --- |
| `column.slot` | runtime 支援 slot cell，但 `TableColumnConfig` 沒有列出 `slot` 欄位，只留下 `display` 說明 |
| `exportCsv` | runtime 有 instance method，型別主要描述 props/events，沒有清楚暴露 instance 方法 |
| events payload | runtime 多數事件有多參數 payload，型別大多寫成 `any` |
| `rowKey` | runtime 支援 `boolean | string`，型別有對上，但 string 模式才適合穩定樹形資料 |
| `context` | runtime 有 `context` prop 供 render context 使用，型別沒有明顯描述 |

## 設計啟發

Table 的設計重點是把複雜度拆成幾層：

```txt
columns 派生
data 派生
row 互動狀態
cell 渲染策略
DOM 尺寸與捲動同步
events 與公開方法
```

仿寫表格時，不要一開始就把所有功能塞進 template。先定義資料層與欄位層，再設計 body/head/summary/fixed 的渲染分工，最後補排序、篩選、選取、展開與測量。

## 複習題

1. `data`、`cloneData`、`rebuildData` 和 `objData` 分別解決什麼問題？
2. 多級表頭為什麼需要 `colSpan`、`rowSpan` 和 `__id`？
3. `sortable: 'custom'` 和 `sortable: true` 的差異是什麼？
4. Table tree data 為什麼強烈依賴穩定 `rowKey`？
5. 固定欄為什麼會帶來 scroll sync 和欄寬測量的複雜度？
