# Avatar、Badge 與 Tag 的資料狀態展示

## 學習目標

這篇從資料展示角度重新整理 `Avatar`、`Badge`、`Tag`。它們在 `07-basic-components/05-tag-badge-avatar.md` 已經分析過基礎 API，本篇不重複細節，而是聚焦它們如何在 Table、List、Tree、Timeline 和業務看板中呈現身份、數量、分類、狀態與輕量互動。

## 對照源碼

- `01-origin/source/view-ui-plus-v1.3.20/src/components/avatar/avatar.vue`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/badge/badge.vue`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/tag/tag.vue`
- `01-origin/source/view-ui-plus-v1.3.20/types/avatar.d.ts`
- `01-origin/source/view-ui-plus-v1.3.20/types/badge.d.ts`
- `01-origin/source/view-ui-plus-v1.3.20/types/tag.d.ts`

## 三種資料語意

| 元件 | 資料語意 | 常見場景 |
| --- | --- | --- |
| `Avatar` | 身份、來源、人物、物件縮圖 | 使用者列表、評論、負責人、組織成員 |
| `Badge` | 數量、提醒、狀態點 | 未讀數、待辦數、線上狀態、異常提示 |
| `Tag` | 分類、狀態、可選標籤 | 表格狀態欄、篩選標籤、文章分類、工單狀態 |

它們都很小，但在資料展示中非常關鍵：它們把原始值轉成使用者能快速掃描的視覺標記。

## Avatar 作為身份展示

Avatar 的資料來源通常有三層：

```txt
src 圖片
  -> icon/customIcon
  -> default slot 文字
```

資料展示場景中，Avatar 不應只被視為圖片元件。它代表「這筆資料屬於誰或什麼」。因此要特別注意：

| 問題 | 設計重點 |
| --- | --- |
| 圖片缺失 | fallback 要穩定，例如文字縮寫或 icon |
| 圖片錯誤 | `on-error` 交給外部切換備用資料 |
| 尺寸一致 | 列表與表格中要避免不同資料撐高行距 |
| 文字過長 | runtime 會測量文字寬度並縮放 |

Avatar 的 DOM measurement 也提醒我們：資料展示元件經常要處理不可控資料，例如姓名長度、圖片比例、載入失敗。

## Badge 作為數量與狀態展示

Badge 常見模式：

| 模式 | 適合資料 |
| --- | --- |
| `count` | 未讀數、待辦數、通知數 |
| `dot` | 是否有新狀態 |
| `status` | success、processing、default、error、warning 等狀態點 |
| `color` | 業務自訂狀態色 |
| `text` slot/prop | 狀態文字 |

Badge 最重要的是顯示規則。`count=0` 預設不顯示，`showZero` 才顯示 0；`overflowCount` 會把大數字收斂成 `99+` 這類可讀格式。

資料展示中，Badge 要避免讓數字變成噪音。它適合放在需要提醒使用者注意的資料點，不適合每個欄位都加。

## Tag 作為分類與狀態展示

Tag 的資料語意比 Badge 更偏「可讀標籤」：

| 模式 | 適合資料 |
| --- | --- |
| 一般 tag | 分類、關鍵字、角色 |
| colored tag | 狀態、優先級、風險等級 |
| closable tag | 使用者可移除的篩選條件 |
| checkable tag | 可切換的篩選或選項 |

Tag 的 `name` 對資料展示很重要。當多個 Tag 由 `v-for` 產生時，`on-close` 和 `on-change` 可以帶回 name，讓外部知道是哪個標籤被操作。

## 在複雜元件中的組合

| 父元件 | 組合方式 |
| --- | --- |
| `Table` | 在 column slot/render 中用 Tag 顯示狀態，用 Avatar 顯示負責人，用 Badge 顯示提醒 |
| `List` | 在 `ListItemMeta` 中用 Avatar，在 action/extra 中用 Tag 或 Badge |
| `Tree` | 在 custom render 中用 Tag 表示節點類型，用 Badge 表示子項數 |
| `Timeline` | 在 item content 中用 Tag 表示事件狀態，用 Avatar 表示操作者 |

這也是為什麼這些小元件同時屬於基礎元件和資料展示元件。基礎章看 API，本章看它們如何承載資料語意。

## 顏色策略

資料展示中的顏色要有固定語意：

```txt
綠色：成功、正常、完成
紅色：錯誤、失敗、危險
黃色或橙色：警告、待處理
藍色：資訊、進行中、主要狀態
灰色：停用、未知、次要狀態
```

元件庫層面通常提供預設色 class，業務層可以傳自訂色。仿寫時要避免把業務狀態寫死在元件內，應該讓資料映射層決定 `color` 或 `status`。

## 設計啟發

Avatar、Badge、Tag 的共同設計原則：

```txt
輸入是一個簡單值或少量 props
輸出是高辨識度的視覺符號
slot 提供覆蓋能力
事件只暴露必要互動
顏色與尺寸要能在密集資料中保持穩定
```

資料展示元件不一定要很大。真正好的展示元件，是能把一個資料欄位變成可掃描、可理解、可操作的 UI 單位。

## 複習題

1. Avatar 在資料展示中除了圖片，還承載什麼語意？
2. Badge 的 `count=0` 為什麼需要特別規則？
3. Tag 的 `name` 對 `v-for` 資料有什麼幫助？
4. 這三個元件放在 Table cell 中時，各自適合表示什麼資料？
5. 為什麼本章不重複基礎章的所有 API 細節？
