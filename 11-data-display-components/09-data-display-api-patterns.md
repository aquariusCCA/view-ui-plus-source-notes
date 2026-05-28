# 資料展示元件 API 模式

## 學習目標

這篇把本章元件抽象成可重複使用的 API 閱讀框架。讀完後，要能看到一個新資料展示元件時，快速拆出資料來源、派生資料、展示狀態、互動事件、slots、render function、DOM 依賴與型別漂移。

## 資料來源模式

| 模式 | 元件 | 說明 |
| --- | --- | --- |
| `data + columns` | Table | 結構化資料與欄位設定分離 |
| nested `data` | Tree | 巢狀資料驅動遞迴節點 |
| default slot item | List、Timeline | 使用者掌握資料迭代與內容結構 |
| media source | Image | `src`、`previewList`、lazy container |
| status value | Progress、Circle、Result | 百分比、狀態類型、結果文字 |
| small marker props | Avatar、Badge、Tag | 圖片、數量、顏色、標籤文字 |

先判斷資料是由 prop 提供、slot 提供，還是由單一狀態值提供。不同來源會決定元件需不需要派生資料。

## 派生資料模式

| 派生資料 | 元件 | 用途 |
| --- | --- | --- |
| `rebuildData` | Table | sort/filter 後實際渲染資料 |
| `objData` | Table | 保存 row 的 hover、checked、expanded、highlight |
| `cloneColumns` | Table | 保存欄寬、排序、篩選與固定欄狀態 |
| `columnRows` | Table | 多級表頭 |
| `flatState` | Tree | parent/children 關係、select/check 查找 |
| `imageStyles`、`fitStyle` | Image | 尺寸與 object-fit |
| `rowsCount`、`rowWidth` | Skeleton | 骨架行數與寬度 |
| `pathString`、`pathStyle` | Circle | SVG 進度路徑 |

資料展示元件常見設計原則：不要直接在原始資料上混入所有 UI 狀態。必要時建立派生資料或狀態索引。

## 展示狀態模式

| 狀態 | 元件 | 說明 |
| --- | --- | --- |
| selected/checked/indeterminate | Tree、Table | 選中與半選 |
| expanded/showChildren | Tree、Table | 展開節點或列 |
| hover/highlight | Table | 滑過與目前列 |
| loading/error | Image、List、Skeleton | 載入與錯誤 |
| pending | Timeline | 待完成節點 |
| success/wrong/warning | Progress、Result | 結果狀態 |
| dot/count/color | Badge、Tag | 小型資料標記 |

狀態應該能回答兩件事：

```txt
這個狀態是外部控制，還是內部互動產生？
這個狀態要不要 emit 給外部？
```

## 事件模式

| 事件 | 元件 | payload |
| --- | --- | --- |
| `on-row-click` | Table | row、index 或 rowKey 對應資料 |
| `on-selection-change` | Table | selection |
| `on-sort-change` | Table | `{ column, key, order }` |
| `on-filter-change` | Table | column |
| `on-expand-tree` | Table | rowKey、status |
| `on-select-change` | Tree | selectedNodes、node |
| `on-check-change` | Tree | checkedNodes、node |
| `on-toggle-expand` | Tree | node |
| `on-contextmenu` | Table、Tree | data、event、position |
| `on-load`、`on-error` | Image | loading result |
| `on-switch`、`on-close` | ImagePreview | preview state |

資料展示事件要避免只回傳 DOM event。使用者通常需要知道是哪筆資料、哪個欄位、哪個節點或哪個狀態改變。

## Slot 與 Render 模式

| 模式 | 元件 | 說明 |
| --- | --- | --- |
| default children | List、Timeline、TreeNode content | 使用者掌握內容結構 |
| named region slot | Table header/footer/loading/contextMenu、List header/footer、Result actions | 覆蓋固定區域 |
| cell slot | Table | 根據 column.slot 渲染 cell |
| render function | Table column render、Tree render | 高彈性自訂節點或 cell |
| fallback slot | Image placeholder/error/preview、ListItemMeta avatar/title/description | slot 優先，prop 次之 |
| visual marker slot | Timeline dot、Progress default、Circle default | 覆蓋狀態內容 |

slot 一旦影響資料呈現，就要進入型別和文件。Table 的 `column.slot` 是很好的反例：runtime 支援，但型別未完整描述。

## DOM 與瀏覽器依賴

| 依賴 | 元件 | 用途 |
| --- | --- | --- |
| `offsetWidth`、`offsetHeight` | Table、Avatar | 欄寬、body 高度、文字縮放 |
| scroll sync | Table | body/header/fixed/summary 同步 |
| window resize | Table | 重新計算欄寬 |
| element resize detector | Table | 容器尺寸變化 |
| document mousemove/mouseup | TableHead | 欄寬拖曳 |
| IntersectionObserver | Image | lazy loading |
| SVG path | Circle | 環形進度 |

只要使用 DOM API，就要檢查 mounted 時機、SSR 防護與 beforeUnmount cleanup。

## Props 設計模式

| 類型 | 建議 |
| --- | --- |
| 資料來源 | `data`、`columns`、`src`、`previewList` 要清楚 |
| 顯示變體 | `size`、`border`、`split`、`fit`、`status` 使用 validator |
| 狀態開關 | `loading`、`preview`、`pending`、`showSummary` 使用 Boolean |
| 自訂函式 | `rowClassName`、`summaryMethod`、`loadData`、`render` 明確 payload |
| 空狀態 | `emptyText`、`noDataText`、`noFilteredDataText` 要可被 locale 或 prop 控制 |
| DOM 行為 | `height`、`maxHeight`、`scrollContainer`、`transfer` 要描述限制 |

## Class 與 Style 模式

常見 class 語意：

```txt
ivu-*-selected
ivu-*-checked
ivu-*-indeterminate
ivu-*-expanded
ivu-*-loading
ivu-*-error
ivu-*-success
ivu-*-warning
ivu-*-disabled
ivu-*-small / large / default
```

inline style 通常承載：

```txt
寬高
百分比
自訂顏色
DOM 測量結果
SVG dash
浮層位置
```

## 型別對照重點

本章值得特別追蹤的漂移：

| 元件 | 差異 |
| --- | --- |
| Table | runtime 支援 `column.slot`，`TableColumnConfig` 未列出 |
| Table | runtime 有 `exportCsv` instance method，型別沒有清楚暴露 |
| Table | 多數事件 payload 很具體，型別多為 `any` |
| Tree | runtime 有 `getSelectedNodes`、`getCheckedNodes` 等方法，型別沒有清楚暴露 |
| Tree | render params 具體包含 root/node/data，型別只寫 `Function` |
| List | runtime loading slot 名稱是 `spin`，型別寫 `loading` |
| List | `itemLayout`、`size` runtime 有 validator，型別寫 string |
| Image | `renameImage` runtime 有 prop，型別未列 |
| Image | `scrollContainer` runtime prop type 和型別不完全一致 |
| Progress | runtime emit `on-status-change`，型別未列 |

## 複習題

1. 資料展示元件常見的派生資料有哪些？
2. 為什麼 Table 適合 `data + columns`，List 適合 slot first？
3. 事件 payload 為什麼應該包含原始資料或節點資料？
4. 哪些資料展示元件需要 DOM cleanup？
5. 本章有哪些 runtime/type 漂移會直接影響使用者開發體驗？
