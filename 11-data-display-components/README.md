# 11-data-display-components

本目錄存放 View UI Plus 的資料展示類元件分析。這裡的元件負責把資料集合、階層資料、時間序列、圖片媒體、載入佔位、進度與狀態標記呈現成穩定的 UI。

建議在讀完基礎元件、容器元件、導航元件與表單輸入元件後進入本章，因為資料展示元件會同時使用 props、slots、render function、父子通訊、DOM 測量、捲動同步、非同步載入、浮層與 TypeScript 宣告。

## 閱讀順序

| 順序 | 筆記 | 學習重點 |
| --- | --- | --- |
| 1 | [資料展示類元件總覽](./01-data-display-components-overview.md) | 建立本章元件分類、資料流、顯示狀態與源碼閱讀方法 |
| 2 | [Table 表格](./02-table.md) | 分析 columns/data、排序、篩選、選取、展開、固定欄、樹形資料與 DOM 測量 |
| 3 | [Tree 樹](./03-tree.md) | 分析 flatState、選中、勾選、半選、非同步載入、自訂渲染與右鍵選單 |
| 4 | [List 與 ListItem](./04-list-and-list-item.md) | 分析列表容器、item layout、meta、loading、header/footer 與 slot 組合 |
| 5 | [Timeline 時間軸](./05-timeline.md) | 分析時間序列、pending、節點顏色、自訂 dot 與低狀態元件設計 |
| 6 | [Avatar、Badge 與 Tag 的資料狀態展示](./06-avatar-badge-tag-status-display.md) | 從資料展示角度整理身份、數量、狀態、分類與小型互動標記 |
| 7 | [Image 與 Skeleton](./07-image-and-skeleton.md) | 分析圖片載入、錯誤、懶載入、預覽、骨架屏與載入前後內容切換 |
| 8 | [Progress、Circle 與 Result](./08-progress-circle-result.md) | 分析進度、儀表、結果狀態、百分比視覺化與狀態 slot |
| 9 | [資料展示元件 API 模式](./09-data-display-api-patterns.md) | 整理資料來源、派生資料、展示狀態、events、slots、render 與型別漂移 |
| 10 | [資料展示元件設計檢查清單](./10-data-display-component-design-checklist.md) | 整理仿寫資料展示元件時可重複使用的設計檢查流程 |

## 原始碼主線

主要對照這幾個位置：

- `01-origin/source/view-ui-plus-v1.3.20/src/components/table/`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/tree/`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/list/`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/timeline/`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/avatar/`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/badge/`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/tag/`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/image/`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/skeleton/`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/progress/`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/circle/`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/result/`
- `01-origin/source/view-ui-plus-v1.3.20/types/`
- `01-origin/source/view-ui-plus-v1.3.20/src/styles/components/`

## 本章邊界

本章只分析資料如何被呈現、標記、展開、排序、篩選、載入與視覺化。

- Tag、Badge、Avatar 在 `07-basic-components/` 已從基礎小元件角度分析；本章只補「它們如何成為資料狀態標記」。
- Calendar 在 `10-form-and-input-components/` 與 DatePicker 一起分析，因為它更常作為日期值選擇與日期展示的交叉元件。
- Tooltip、Poptip、Dropdown、Spin 放在 `12-feedback-and-overlays/` 深挖；本章只在 Table、Tree、Image、List 需要時說明依賴。
- NumberInfo、Trend、Exception 這類偏中後台資料看板或業務狀態的元件，可放在 `13-pro-and-business-components/` 交叉整理。
- Typography、Ellipsis、Time、Numeral 放在 `14-typography-and-text/`，本章只關心它們被資料展示元件組合使用的場景。

## 學完後要能回答

- Table 為什麼同時維護 `data`、`cloneData`、`rebuildData` 和 `objData`？
- Table 的 columns 如何被轉成葉子列、多級表頭、固定列與 summary？
- Tree 為什麼要把巢狀資料編譯成 `flatState`？
- Tree 的 `checked`、`indeterminate`、`checkStrictly` 與 `checkDirectly` 如何影響事件語意？
- List 為什麼本身不接收 data，而是把 item 結構交給 slot？
- Timeline 這類低狀態展示元件，公開 API 應該保留到什麼程度？
- Avatar、Badge、Tag 在資料展示中分別適合表示哪些狀態？
- Image 如何管理 loading、error、lazy、preview 四條狀態線？
- Skeleton 如何把 loading 前後的 DOM 結構切開？
- Progress、Circle、Result 如何把狀態值轉成 class、style、SVG 或 slot？
- 如何從 runtime、`.d.ts` 與 less class 一起判斷資料展示元件的公開契約？
