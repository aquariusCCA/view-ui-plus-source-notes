# 05-shared-logic

本目錄存放 View UI Plus 的共用邏輯分析。重點不是背每一個工具函數，而是看懂一套元件庫如何把重複的判斷、DOM 操作、跨層通信、表單接入、全域設定與浮層狀態抽出來，讓元件實作保持一致。

## 閱讀順序

| 順序 | 筆記 | 學習重點 |
| --- | --- | --- |
| 1 | [共用邏輯總覽](./01-shared-logic-overview.md) | 建立 `utils`、`mixins`、directives、元件內部 util 的分工地圖 |
| 2 | [assist 工具集合](./02-assist-utils.md) | 分析 `oneOf`、`deepCopy`、元件查找、class 操作、滾動與下載工具 |
| 3 | [DOM 與瀏覽器環境封裝](./03-dom-and-browser-env.md) | 理解 `isClient`、DOM 事件、樣式能力偵測與 SSR guard |
| 4 | [元件樹通信與查找](./04-component-tree-communication.md) | 分析 `$parent`、`$children`、`dispatch`、`broadcast` 的跨層通信模式 |
| 5 | [表單共用邏輯](./05-form-shared-logic.md) | 拆解輸入類元件如何接入 Form / FormItem 的 disabled 與驗證流程 |
| 6 | [語系與全域設定](./06-locale-and-global-config.md) | 分析 `Locale`、`globalConfig` 與 `$VIEWUI` 的讀取方式 |
| 7 | [連結行為共用](./07-link-behavior.md) | 看懂 Button、Cell、BreadcrumbItem 等元件如何共用路由與跳轉行為 |
| 8 | [浮層層級與 transfer queue](./08-overlay-zindex-and-transfer-queue.md) | 分析 Modal、Tooltip、Poptip、Select、ImagePreview 的 z-index 遞增策略 |
| 9 | [專用工具函數整理](./09-date-keyboard-csv-random-utils.md) | 整理日期、鍵盤碼、CSV、隨機字串等低層工具的設計邊界 |
| 10 | [共用邏輯重構模式](./10-shared-logic-refactor-patterns.md) | 總結工具函數、mixin、directive、composable 的取捨與練習方向 |

## 原始碼主線

主要對照這幾個位置：

- `01-origin/source/view-ui-plus-v1.3.20/src/utils/`
- `01-origin/source/view-ui-plus-v1.3.20/src/mixins/`
- `01-origin/source/view-ui-plus-v1.3.20/src/directives/`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/form/`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/modal/`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/select/`

## 學完後要能回答

- 為什麼 `oneOf` 這類小工具會出現在大量元件的 prop validator 裡？
- 元件庫為什麼要封裝 `on/off`，而不是讓每個元件直接呼叫 `addEventListener`？
- `mixins/form.js` 如何讓 Input、Select、Checkbox、Slider 等元件接入 Form 驗證？
- `findComponentUpward`、`provide/inject`、`dispatch/broadcast` 解決的問題有什麼差異？
- Modal、Tooltip、Poptip、Select Dropdown 這類浮層如何避免 z-index 混亂？
- 如果用現代 Vue 3 重構，哪些 mixin 適合改成 composable？
