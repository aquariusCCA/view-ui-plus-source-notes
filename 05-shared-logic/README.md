# Shared Logic

View UI Plus 原始碼沒有獨立的 `src/composables/` 或 hooks 分層。

本區不是對應一個實際源碼目錄，而是用來整理散落在 `src/mixins/`、`src/utils/`，以及部分元件內部的共用邏輯，例如：

- Vue Options API mixins 的復用方式。
- 跨元件 utilities 的抽象邊界。
- 元件內部狀態、事件與 DOM 行為的共用模式。

## Source Baseline

| 項目 | 內容 |
| --- | --- |
| Package | `view-ui-plus` |
| Version | `1.3.20` |
| Source root | `01-origin/source/view-ui-plus-v1.3.20/` |
| Mixin source | `01-origin/source/view-ui-plus-v1.3.20/src/mixins/` |
| Utility source | `01-origin/source/view-ui-plus-v1.3.20/src/utils/` |

## 筆記索引

| 筆記 | 主題 |
| --- | --- |
| `01-shared-logic-map.md` | 建立 `mixins`、`utils`、元件內部 mixin 的共用邏輯地圖。 |
| `02-options-api-mixin-reuse-model.md` | 理解 Options API mixin 在 View UI Plus 中如何承載復用能力。 |
| `03-form-mixin-and-field-contract.md` | 分析 `form.js` 如何串起 `Form`、`FormItem` 與欄位元件。 |
| `04-locale-and-global-config-mixins.md` | 分析 locale mixin 與 `$VIEWUI` 全域設定讀取方式。 |
| `05-link-navigation-mixin.md` | 分析 `link.js` 如何讓多種元件共用可跳轉能力。 |
| `06-component-tree-lookup-and-event-bridge.md` | 整理元件樹查找、父子事件橋接與 `provide/inject` 的關係。 |
| `07-dom-utils-and-client-boundary.md` | 分析 DOM 事件、class、client guard、browser feature detection。 |
| `08-overlay-shared-state-and-scroll-lock.md` | 整理浮層共用 z-index 狀態、body scroll lock 與 Esc 關閉。 |
| `09-data-format-and-keyboard-utils.md` | 分析 date、csv、keyCode、random string 這類資料與輸入工具。 |
| `10-measurement-utils-textarea-scrollbar-style.md` | 分析 textarea autosize、scrollbar size、style 讀取等量測型工具。 |
| `11-shared-logic-design-boundaries.md` | 總結 mixin、utility、component-local logic 的設計邊界。 |
| `12-mini-reimplementation-labs.md` | 用小型仿作練習驗證對共用邏輯的理解。 |
