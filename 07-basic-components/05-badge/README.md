# Badge 原始碼閱讀筆記

本目錄聚焦 View UI Plus 的 `Badge`。它是低互動展示型元件，本身不處理 click、不宣告 emits，也沒有 mixin；真正值得讀的是它如何把 `count`、`dot`、`status`、`color`、`text` 與 slot override 收斂成幾種固定的 DOM 與樣式形態。

閱讀 `Badge` 時不要只把它理解成「右上角數字」。它真正的轉換鏈是：

```txt
props / slots
  -> template branch: dot / status-color / count
  -> badge / hasCount / finalCount / alone / styles
  -> sup / status span / wrapped default slot
  -> badge.less positioning and colors
```

`Badge` 的 runtime 很短，但顯示規則有幾個容易誤判的優先序：`dot` 會先於 `status`，`status || color` 會進入狀態點模式，`#count` 會讓數值 `count` 失效，`text` 會覆蓋一般數字內容。

## 1. Source Baseline

本目錄以本地保存的 View UI Plus `v1.3.20` 原始碼為閱讀基準。

| 類型 | 路徑 | 閱讀目的 |
| --- | --- | --- |
| Runtime | `01-origin/source/view-ui-plus-v1.3.20/src/components/badge/badge.vue` | 確認 template branch、props、computed 顯示規則與 slot override。 |
| Runtime entry | `01-origin/source/view-ui-plus-v1.3.20/src/components/badge/index.js` | 確認單元件入口匯出。 |
| Style | `01-origin/source/view-ui-plus-v1.3.20/src/styles/components/badge.less` | 對照數字角標、dot、status、定位、色彩與 processing 動畫。 |
| Style entry | `01-origin/source/view-ui-plus-v1.3.20/src/styles/components/index.less` | 確認 `badge.less` 進入元件樣式集合。 |
| Type declaration | `01-origin/source/view-ui-plus-v1.3.20/types/badge.d.ts` | 確認 public props 與 slot typing。 |
| Type export entry | `01-origin/source/view-ui-plus-v1.3.20/types/viewuiplus.components.d.ts` | 確認 `Badge` 進入 typed public exports。 |
| Example | `01-origin/source/view-ui-plus-v1.3.20/examples/routers/badge.vue` | 確認官方展示的數值、狀態、自訂內容、offset 與色彩場景。 |
| Registry | `01-origin/source/view-ui-plus-v1.3.20/src/components/index.js` | 確認 `Badge` 進入 component public export。 |
| Install | `01-origin/source/view-ui-plus-v1.3.20/src/index.js` | 確認全域安裝時透過 component map 間接註冊 `Badge`。 |

## 2. Reading Focus

閱讀這組元件時，建議把問題拆成四類。

第一，public contract。`Badge` 的 props 都是展示輸入，沒有事件輸出。`count`、`overflowCount`、`showZero`、`text` 負責內容，`dot`、`status`、`color` 負責模式，`type`、`className`、`offset` 負責一般角標樣式修飾。

第二，template branch。`badge.vue` 不是單一 template，而是三段互斥分支：先判斷 `dot`，再判斷 `status || color`，最後才是一般 `count`。這個順序比單個 prop 的語意更重要。

第三，顯示條件。`badge` computed 決定角標是否可見，`hasCount` 決定一般模式是否渲染數字 `sup`，`finalCount` 決定顯示 `text`、原始數字或封頂數字。

第四，style source。一般數字角標與 dot 都是相對 wrapper 的 absolute positioning；沒有 default slot 時會加上 `ivu-badge-count-alone`，改成相對定位的獨立角標。status 模式則是 inline status dot 加文字，不是附著在右上角。

## 3. Notes Index

建議依照下列順序閱讀。

| 筆記 | 主題 | 建議閱讀目的 |
| --- | --- | --- |
| `01-source-map.md` | 原始碼入口與責任分工 | 先知道 runtime、style、type、example、registry、install 分別在哪裡。 |
| `02-public-contract-and-display-rules.md` | public contract 與顯示規則 | 對照 props、slots、三段 template branch、`badge` / `hasCount` / `finalCount`。 |
| `03-class-style-and-position.md` | class、style 與定位系統 | 理解一般 count、custom count、dot、status、offset、alone 與 less 的分工。 |

## 4. Learning Outcome

讀完本目錄後，應該能建立以下理解。

1. `Badge` 是低互動展示元件，沒有 emits，也不主動處理使用者互動。
2. `dot`、`status/color`、一般 `count` 是三種互斥 template 模式，且有固定優先序。
3. `text` 會覆蓋一般數字顯示；`#count` 會覆蓋整個數字角標內容。
4. `color` 會讓元件進入 status layout，不是一般數字角標的顏色設定。
5. `type` 只作用在一般 count badge 的 `ivu-badge-count-{type}` class。
6. `offset` 寫入角標本體的 margin，不改變 wrapper 的布局模型。
7. 想完整理解 `Badge`，必須同時看 runtime computed、template branch、type declaration、example 與 `badge.less`。

## 5. Self Check

1. `Badge` 的三段 template branch 優先序是什麼？
2. `count=0`、`showZero=false` 時，`hasCount` 和 `badge` 分別會導致什麼結果？
3. 為什麼 `text="new"` 會讓數字 `count` 不出現在畫面上？
4. `#count` 和 `#text` 在一般 count 模式下分別覆蓋哪一層內容？
5. 為什麼 `color="blue"` 不是用來改變一般數字角標的背景色？
6. `alone` 如何影響 `ivu-badge-count` 的定位方式？
