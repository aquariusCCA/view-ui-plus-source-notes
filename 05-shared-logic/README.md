# Shared Logic

View UI Plus 原始碼沒有獨立的 `src/composables/` 或 hooks 分層。

本區不是對應一個實際源碼目錄，而是用來整理散落在 `src/mixins/`、`src/utils/`，以及部分元件內部的共用邏輯，例如：

- Vue Options API mixins 的復用方式。
- 跨元件 utilities 的抽象邊界。
- 元件內部狀態、事件與 DOM 行為的共用模式。

