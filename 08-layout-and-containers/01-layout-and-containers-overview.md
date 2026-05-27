# 版面與容器元件總覽

## 學習目標

這篇建立 `08-layout-and-containers` 的閱讀方法。版面與容器元件通常不是單純顯示一段內容，而是負責決定「內容如何被放置」、「子元件如何和父元件同步設定」、「使用者提供的 slot 如何被包裝成穩定結構」。

讀完後，要能判斷 Grid、Layout、Card、Collapse、Space 這類元件和基礎元件的差異，並用同一套流程閱讀父子協作、DOM 測量、響應式 class、slot 容器與型別宣告。

## 對照源碼

- `01-origin/source/view-ui-plus-v1.3.20/src/components/row/`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/col/`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/grid/`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/layout/`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/card/`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/collapse/`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/space/`
- `01-origin/source/view-ui-plus-v1.3.20/types/`
- `01-origin/source/view-ui-plus-v1.3.20/src/styles/components/`

## 元件分類

本章元件可以分成五類：

| 類型 | 代表元件 | 閱讀重點 |
| --- | --- | --- |
| 格線排版 | `Row`、`Col` | 父層 `gutter`、子層 padding、24 欄 class、響應式設定 |
| 宮格容器 | `Grid`、`GridItem` | 父子設定共享、等寬等高、resize 偵測 |
| 頁框結構 | `Layout`、`Header`、`Content`、`Footer`、`Sider` | 結構 class、側邊欄收合、斷點、trigger slot |
| 內容容器 | `Card` | head、extra、body、padding、shadow、link 行為 |
| 狀態容器 | `Collapse`、`Panel`、`Space` | active key、transition、VNode 過濾、split slot、gap 設定 |

這些元件的共同特徵是：它們通常會包住子內容，並把子內容放進一套固定的 DOM、class 和 style 規則中。閱讀時不能只看 props 表，還要看 slot 被如何重組。

## 閱讀順序

建議每組元件都按照同一個順序讀：

1. 看 `index.js`，確認元件如何被導出，是否有子元件別名。
2. 看父元件 `.vue`，整理 props、provide、class、style 和狀態。
3. 看子元件 `.vue`，確認 inject、slot 包裝、父層設定如何影響子層。
4. 看 `types/*.d.ts`，對照 runtime API 和使用者側型別。
5. 看 `src/styles/components/*.less`，理解 class 狀態實際控制的排版。
6. 回頭整理哪些能力是公開契約，哪些只是內部協作細節。

## 容器元件的共同模式

版面與容器元件常見的實作模式包括：

| 模式 | 說明 |
| --- | --- |
| `provide/inject` | 父元件把設定或方法交給子元件，例如 `RowInstance`、`GridInstance`、`CollapseInstance` |
| slot wrapping | 子內容不直接輸出，而是被包在固定 DOM 中，例如 `Space` 的 `ivu-space-item` |
| class + inline style 分工 | 固定變體用 class，動態尺寸、padding、flex、gap 用 inline style |
| DOM 測量 | 需要知道實際寬度或 resize 時，用 ref、工具函式或 resize detector |
| active state normalization | 把外部傳入值轉成內部穩定格式，例如 `Collapse` 的 active key 陣列 |
| type/runtime 對照 | `.d.ts` 是使用者 API 入口，但可能和 runtime 存在細節差異，需要主動核對 |

## 和其他章節的關係

本章會引用前面章節的觀念，但重點放在容器場景：

- `provide/inject` 和父子通訊可回看 `05-shared-logic/04-component-tree-communication.md`。
- `oneOf`、`dimensionMap`、`getStyle` 可回看 `05-shared-logic/02-assist-utils.md`。
- `Card` 的 link 行為可回看 `05-shared-logic/07-link-behavior.md`。
- Props、Events、Slots、`.d.ts` 的完整判讀方法放在 `06-public-api-and-type-system/`。
- class 命名、less 變數與樣式 mixin 放在 `17-style-system/`。

## 設計啟發

容器元件的 API 好壞，通常取決於它是否能把頁面結構問題壓縮成穩定語彙。例如：

- `Row` / `Col` 讓使用者不用手寫負 margin 和欄寬 class。
- `Layout` / `Sider` 讓常見後台頁框有固定結構與收合行為。
- `Card` 讓標題、右上角操作、內容間距和可點擊行為有一致外觀。
- `Collapse` 讓展開狀態能用 `v-model` 控制，也能在內部維持面板順序。
- `Space` 讓元素間距從 CSS 零散設定變成可組合的元件 API。

閱讀這些元件時，重點不是背每個 props，而是看懂「容器如何把任意子內容收斂成可預期的頁面結構」。

## 複習題

1. 版面與容器元件和基礎元件最大的差異是什麼？
2. 什麼情境適合用 `provide/inject` 傳遞父層設定？
3. 為什麼容器元件常需要包裝 slot，而不是直接輸出 slot？
4. 哪些排版狀態適合用 class，哪些適合用 inline style？
5. `.vue` 和 `.d.ts` 描述不同時，應該如何判斷真正的公開契約？
