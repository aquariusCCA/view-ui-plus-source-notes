# 06-public-api-and-type-system

本目錄存放 View UI Plus 的公開 API 與型別系統分析。重點不是背每個元件的 API 表，而是看懂一套 Vue 3 元件庫如何把 runtime 實作轉成使用者可以依賴的 Props、Emits、Slots、Instance 行為、全域服務與 TypeScript 型別體驗。

## 閱讀順序

| 順序 | 筆記 | 學習重點 |
| --- | --- | --- |
| 1 | [公開 API 總覽](./origin/01-public-api-overview.md) | 建立 Props、Emits、Slots、Methods、Instance、全域服務與型別導出的 API 地圖 |
| 2 | [Props 設計與 runtime 驗證](./origin/02-props-design-and-runtime-validation.md) | 分析 prop 命名、預設值、validator、全域設定覆蓋與型別宣告 |
| 3 | [事件與 v-model 契約](./origin/03-events-and-v-model-contract.md) | 拆解 `emits`、`update:modelValue`、`on-*` 事件命名與雙向綁定 |
| 4 | [Slots API 設計](./origin/04-slots-api-design.md) | 分析 default slot、具名 slot、scoped slot 與 fallback 的公開契約 |
| 5 | [Instance 方法與暴露行為](./origin/05-instance-methods-and-exposed-behavior.md) | 判斷哪些 methods 屬於公開可依賴 API，哪些只是內部實作細節 |
| 6 | [全域服務型別 API](./origin/06-global-services-type-api.md) | 分析 `$Message`、`$Modal`、`$Notice`、`$Loading` 等全域服務的 runtime 與型別宣告 |
| 7 | [元件 d.ts 設計](./origin/07-component-dts-design.md) | 閱讀 `DefineComponent`、listener prop、`v-slots` 與元件型別宣告模式 |
| 8 | [型別導出地圖](./origin/08-type-export-map.md) | 分析 `types/index.d.ts` 與 `viewuiplus.components.d.ts` 如何組織公開型別出口 |
| 9 | [Runtime API 與 Type API 漂移](./origin/09-runtime-api-vs-type-api-drift.md) | 對照 `.vue` 與 `.d.ts`，找出命名、型別寬鬆、遺漏與版本漂移問題 |
| 10 | [公開 API 設計檢查清單](./origin/10-public-api-design-checklist.md) | 總結設計新元件 API 與型別宣告時可重複使用的檢查流程 |

以上資料目前作為 `origin/` 原始資料；正式筆記會在 `atomic/` 完成切分與 review 後，再生成到本章根目錄。

## 原始碼主線

主要對照這幾個位置：

- `01-origin/source/view-ui-plus-v1.3.20/src/components/`
- `01-origin/source/view-ui-plus-v1.3.20/src/index.js`
- `01-origin/source/view-ui-plus-v1.3.20/types/`
- `01-origin/source/view-ui-plus-v1.3.20/types/index.d.ts`
- `01-origin/source/view-ui-plus-v1.3.20/types/viewuiplus.components.d.ts`

建議先用 `Button` 建立最小模型，再用 `Modal` 觀察 v-model、slots、全域設定與全域服務，最後用 `Table` 觀察複雜 props、事件與 scoped slot API。

## 學完後要能回答

- 元件的公開 API 應該從 runtime 實作、文件範例，還是 `.d.ts` 判斷？
- 為什麼 `.vue` 裡是 `htmlType`，使用者模板與 `.d.ts` 裡卻常看到 `html-type`？
- `emits: ['on-ok']` 為什麼在型別檔中會變成 `onOnOk`？
- slot 什麼時候只是版面插入點，什麼時候會形成穩定的資料契約？
- 為什麼把功能掛到 `globalProperties` 之後，TypeScript 還需要 `ComponentCustomProperties` 宣告？
- 如何檢查 runtime API 和 type API 是否發生漂移？
