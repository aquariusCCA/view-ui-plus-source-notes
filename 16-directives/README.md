# 16-directives

本目錄存放 View UI Plus 的指令系統分析。這一章不只看「directive 怎麼寫」，而是整理指令在元件庫裡如何承接 DOM 操作、事件監聽、樣式快捷能力、文字省略、resize 偵測、外部點擊判斷與節點搬移。

建議在讀完插件系統、共用邏輯、文字排版與回饋浮層後進入本章，因為 View UI Plus 的指令同時連到 `install(app)` 全域註冊、`isClient` SSR guard、`element-resize-detector`、ClickOutside、Transfer DOM 與 Ellipsis/Typography 的設計取捨。

## 閱讀順序

| 順序 | 筆記 | 學習重點 |
| --- | --- | --- |
| 1 | [指令系統總覽](./01-directives-overview.md) | 建立 directive 的適用場景、能力分類與和元件/composable/服務的邊界 |
| 2 | [指令註冊與 API 形狀](./02-directive-registration-and-api-shape.md) | 分析 `src/index.js` 如何整理全域指令表並呼叫 `app.directive()` |
| 3 | [Vue 指令生命週期](./03-vue-directive-lifecycle.md) | 對照 `beforeMount`、`mounted`、`updated`、`unmounted` 的責任分工 |
| 4 | [樣式快捷指令](./04-style-directives.md) | 分析 `v-width`、`v-height`、`v-margin`、`v-padding`、`v-color`、`v-bg-color` |
| 5 | [line-clamp 指令](./05-line-clamp-directive.md) | 分析 `v-line-clamp` 的 CSS class 注入、多行省略與適用邊界 |
| 6 | [resize 指令](./06-resize-directive.md) | 分析 `v-resize` 如何使用 `element-resize-detector` 監聽元素尺寸 |
| 7 | [基礎 clickoutside 指令](./07-click-outside-directive.md) | 分析 document click、外部點擊判斷、SSR guard 與事件清理 |
| 8 | [進階 click-outside-x 指令](./08-click-outside-x-directive.md) | 分析 capture、事件 modifiers、mousedown/touchstart 與多 instance 管理 |
| 9 | [transfer-dom 指令](./09-transfer-dom-directive.md) | 分析 DOM 搬移、placeholder comment、target 切換與 Teleport 的關係 |
| 10 | [指令設計檢查清單](./10-directive-design-checklist.md) | 整理仿寫 directive 時可重複使用的 API、生命週期與測試流程 |

## 原始碼主線

主要對照這幾個位置：

- `01-origin/source/view-ui-plus-v1.3.20/src/index.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/directives/style.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/directives/line-clamp.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/directives/resize.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/directives/clickoutside.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/directives/v-click-outside-x.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/directives/transfer-dom.js`

## 本章邊界

本章聚焦 directive 自身的 API、生命週期、副作用與清理，不重複分析依賴元件的完整實作。

- 全域註冊流程可回看 `04-plugin-system/04-directive-registration.md`；本章更深入看每個 directive 的形狀與設計取捨。
- `v-line-clamp` 也可回看 `14-typography-and-text/`；本章從指令角度分析，文字元件章節從省略能力角度分析。
- click outside 與 transfer DOM 也會出現在浮層元件中；完整浮層互動可回看 `12-feedback-and-overlays/`。
- `transfer-dom.js` 仍保留 Vue 2 風格生命週期名稱，閱讀時要把它當成歷史實作與設計案例，而不是直接照抄到 Vue 3 專案。

## 學完後要能回答

- 什麼情況適合寫 directive，而不是 component、composable 或全域服務？
- View UI Plus 在 `install(app)` 階段註冊了哪些全域指令？
- 指令的 `mounted`、`updated`、`unmounted` 各自應該處理什麼？
- 樣式型指令為什麼要在卸載時清理 `el.style`？
- `v-line-clamp` 和 Ellipsis、Typography ellipsis 的能力差異是什麼？
- `v-resize` 為什麼要把 handler 和 observer 存在元素上？
- click outside 為什麼要在 document 上監聽，並在 unmounted 時移除？
- 進階 click outside 如何支援 capture、不同事件類型與多個元素共用 listener？
- transfer DOM 為什麼需要 comment placeholder？
- 仿寫一個 DOM 行為指令時，應該如何檢查 API、環境、副作用與測試？
