# 資料展示類元件總覽

## 學習目標

這篇建立 `11-data-display-components` 的閱讀方法。資料展示元件的核心不是「把資料印出來」，而是把資料、狀態、結構、空值、載入、錯誤、互動入口與視覺層級整理成穩定的呈現契約。

讀完後，要能用同一套流程分析 Table、Tree、List、Timeline、Image、Skeleton、Progress、Circle、Result，以及 Avatar、Badge、Tag 這類常被資料驅動的小型展示元件。

## 對照源碼

- `01-origin/source/view-ui-plus-v1.3.20/src/components/table/`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/tree/`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/list/`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/timeline/`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/image/`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/skeleton/`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/progress/`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/circle/`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/result/`
- `01-origin/source/view-ui-plus-v1.3.20/types/`

## 元件分類

| 類型 | 代表元件 | 閱讀重點 |
| --- | --- | --- |
| 結構化集合 | `Table`、`List` | data/columns 或 slot item 如何產生可掃描的資料區塊 |
| 階層資料 | `Tree`、Table tree data | parent/children、展開、選中、半選、非同步載入 |
| 時間序列 | `Timeline`、`TimelineItem` | 順序、節點狀態、pending、slot dot |
| 身份與標記 | `Avatar`、`Badge`、`Tag` | 圖片、數量、分類、狀態、顏色與少量互動 |
| 媒體展示 | `Image`、`ImagePreview` | loading/error/lazy/preview、fit、事件與浮層 |
| 載入佔位 | `Skeleton`、`SkeletonItem` | loading 前後 DOM、佔位形狀、動畫與 template slot |
| 進度與結果 | `Progress`、`Circle`、`Result` | 百分比、狀態、自訂內容、SVG path 與 class |

資料展示元件常見的共同點是：公開資料不一定等於最後渲染資料。中間通常會產生排序後、過濾後、展開後、帶狀態欄位或帶 layout 欄位的派生資料。

## 閱讀順序

建議每個元件都按照這個順序讀：

1. 看 `index.js`，確認主元件、子元件與註冊方式。
2. 找主要資料來源，例如 `data`、`columns`、`previewList`、`percent`、slot item。
3. 找派生資料，例如 `rebuildData`、`cloneColumns`、`flatState`、`summaryData`。
4. 找視覺狀態，例如 selected、checked、expanded、loading、error、pending、success。
5. 找使用者互動入口，例如 click、contextmenu、sort、filter、resize、preview。
6. 看 events payload，確認回傳原始資料、派生資料、索引、節點還是 DOM event。
7. 看 slots 和 render function，確認使用者能覆蓋哪些可見結構。
8. 看 `.d.ts`，核對 runtime API、slot 名稱、事件與支援型別是否一致。
9. 看 less，確認 class 是否承載資料狀態、互動狀態或尺寸變體。

## 資料流模型

資料展示元件可以先畫成：

```txt
原始資料 / slots / 狀態值
  -> 派生資料或內部狀態
  -> 可見 DOM、class、style、SVG 或浮層
  -> 使用者互動
  -> emit 或 callback
```

Table 是最完整的案例：

```txt
data + columns
  -> cloneData / rebuildData / objData / cloneColumns
  -> header/body/fixed/summary/context menu
  -> sort/filter/select/expand/resize/contextmenu
  -> on-* events / exportCsv
```

Tree 則是階層資料案例：

```txt
data
  -> stateTree + flatState
  -> TreeNode 遞迴渲染
  -> select/check/expand/contextmenu
  -> on-select-change / on-check-change / on-toggle-expand
```

## 和其他章節的關係

- Tag、Badge、Avatar 的基礎 API 可回看 `07-basic-components/05-tag-badge-avatar.md`。
- Table 的 columns、events、slots 與 `.d.ts` 可回看 `06-public-api-and-type-system/`。
- List、Timeline 的容器語意可回看 `08-layout-and-containers/`。
- TreeSelect 是 Tree 被包裝成表單選擇器後的版本，可回看 `10-form-and-input-components/08-cascader-tree-select-transfer.md`。
- ImagePreview、Spin、Dropdown、Poptip 屬於浮層或回饋依賴，可在 `12-feedback-and-overlays/` 交叉分析。

## 設計啟發

資料展示元件要把「資料本身」和「資料顯示狀態」分開。例如：

- Table 不直接修改 `data` 來記錄 hover、checked、expanded，而是建立 `objData`。
- Tree 把巢狀節點編譯成 `flatState`，讓父子勾選能快速追蹤。
- Image 把 `loadingImage`、`loading`、`imageError` 分開，避免圖片 DOM、佔位與錯誤狀態互相混淆。
- Skeleton 用 `loading` 決定渲染佔位還是真實內容，而不是讓使用者自己在外層寫兩套重複結構。

讀資料展示元件時，重點是分清楚：

```txt
原始資料是什麼
派生資料是什麼
互動狀態放在哪裡
空資料和載入中如何顯示
使用者能自訂哪一層 DOM
事件 payload 是否足夠回到原始資料
```

## 複習題

1. 資料展示元件和表單輸入元件最核心的狀態差異是什麼？
2. 為什麼 Table 需要派生資料，而 List 可以主要依賴 slot？
3. Tree 為什麼需要同時保存巢狀資料和扁平索引？
4. Skeleton 的 loading 設計和 Spin 的 loading 設計有什麼差異？
5. 資料展示元件的事件 payload 為什麼不能只回傳 index？
