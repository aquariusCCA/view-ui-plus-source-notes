# Runtime API 與 Type API 漂移

## 學習目標

這篇分析 runtime API 和 TypeScript API 的漂移問題。重點是建立一套檢查方法，能從 `.vue`、mixin、service、`.d.ts` 中找出公開 API 是否同步。

## 源碼位置

主要閱讀：

- `01-origin/source/view-ui-plus-v1.3.20/src/components/button/button.vue`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/modal/modal.vue`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/table/table.vue`
- `01-origin/source/view-ui-plus-v1.3.20/src/mixins/`
- `01-origin/source/view-ui-plus-v1.3.20/types/button.d.ts`
- `01-origin/source/view-ui-plus-v1.3.20/types/modal.d.ts`
- `01-origin/source/view-ui-plus-v1.3.20/types/table.d.ts`

## 什麼是 API 漂移

API 漂移是指 runtime 行為和型別宣告沒有同步。常見情況包括：

- runtime 有 prop，但 d.ts 沒列。
- d.ts 有 prop，但 runtime 實際不接受或來自其他 mixin。
- runtime validator 已限制合法值，但 d.ts 寫成寬鬆 `string`。
- runtime 接受 `number | string`，但 d.ts 只寫 `number`。
- runtime 事件會傳多個參數，但 d.ts 只寫 `(event?: any) => any`。
- runtime service 有方法，但全域型別宣告成 `any`。

漂移不一定立刻讓程式壞掉，但會讓使用者在 IDE、編譯、重構時得到錯誤訊號。

## 檢查流程

每個元件可以照這個順序檢查：

1. 從 `.vue` 的 `props` 列出 runtime props。
2. 加上 mixin 帶入的 props。
3. 從 `emits` 和 `$emit` 列出事件名稱與 payload。
4. 從 `<slot>`、`this.$slots`、render slot 列出 slots 與 payload。
5. 從 `.d.ts` 對照 props、events、slots、配置型別。
6. 標記型別過寬、過窄、缺漏與命名差異。

不要只對照單一檔案。mixin、service index、全域安裝入口都可能形成公開 API。

## 典型例子

| 元件 | 漂移類型 | 觀察 |
| --- | --- | --- |
| Button | 型別過寬 | runtime `shape` 有 validator，但 d.ts 寫成 `string` |
| Modal | 型別過窄 | runtime `width` 接受 `Number` 與 `String`，component d.ts 偏向 `number` |
| Modal | 事件缺漏 | runtime emits 包含 `on-hidden`，d.ts 需要確認是否有對應 listener |
| Table | payload 過寬 | 大量事件 payload 在 d.ts 中仍是 `any` |
| Message | service 型別不足 | runtime 有 service 方法，但 `$Message` 全域屬性是 `any` |

這些例子適合做練習：不是看到差異就急著判定錯，而是先確認差異是否來自 Vue 命名轉換、mixin、歷史相容或型別精準度取捨。

## 漂移的代價

| 漂移方向 | 使用者體驗 |
| --- | --- |
| runtime 有、type 無 | 程式能跑，但 TypeScript 報錯或沒有提示 |
| type 有、runtime 無 | 編譯通過，但執行或畫面不符合預期 |
| type 太寬 | 錯誤值不會被 IDE 擋下 |
| type 太窄 | 合法用法被 TypeScript 擋下 |
| payload 是 `any` | 事件處理程式缺少重構保護 |

型別不是附屬品。對元件庫使用者來說，型別就是 API 體驗的一部分。

## 修正優先級

如果要改善型別，建議優先處理：

1. 高頻元件，例如 Button、Input、Form、Table、Modal。
2. 高風險 API，例如 v-model、表單驗證、Table columns、全域服務。
3. 使用者最常寫錯的 union props，例如 size、type、placement、status。
4. 事件 payload，尤其是會驅動遠端查詢或業務狀態的事件。
5. service 方法與回傳值。

不需要一次把全庫型別完美化。先處理高頻、高風險、高收益的 API。

## 設計啟發

維護元件庫時，可以把 API 漂移檢查變成固定流程：

- 新增 prop 時同步 d.ts。
- 新增 emit 時同步 listener prop 與 payload 型別。
- 新增 slot 時同步 `v-slots`。
- 修改 validator 時同步 union type。
- 修改 service 方法時同步全域 service interface。

這比事後靠使用者回報型別問題更可靠。

## 檢查問題

1. runtime 有 API 但 d.ts 沒有，為什麼不一定會在測試中被發現？
2. 型別太寬和型別太窄，哪一種對使用者更痛？
3. 為什麼 mixin 會增加 API 漂移檢查難度？
4. Table 事件 payload 都寫成 `any`，會讓企業後台封裝少掉哪些保障？
5. 如果你只能先修三類型別，會優先選哪些？
