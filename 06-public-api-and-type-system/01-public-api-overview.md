# 公開 API 總覽

## 學習目標

這篇先建立 `06-public-api-and-type-system` 的閱讀地圖。閱讀元件庫時，公開 API 不是只出現在文件表格裡，而是同時散落在 `.vue` 實作、入口匯出、全域安裝邏輯與 `types/*.d.ts` 型別宣告中。

讀完後，要能判斷一個能力是「使用者可以依賴的公開 API」，還是「目前剛好存在的內部實作細節」。

## 源碼位置

主要閱讀：

- `01-origin/source/view-ui-plus-v1.3.20/src/components/`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/index.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/index.js`
- `01-origin/source/view-ui-plus-v1.3.20/types/`
- `01-origin/source/view-ui-plus-v1.3.20/types/index.d.ts`
- `01-origin/source/view-ui-plus-v1.3.20/types/viewuiplus.components.d.ts`

## API 地圖

| API 類型 | runtime 來源 | 型別來源 | 使用者感知 |
| --- | --- | --- | --- |
| Props | 元件 `props`、mixin props | `DefineComponent<{ ... }>` | 模板屬性、JSX props、IDE 提示 |
| Emits | 元件 `emits` 與 `$emit` 呼叫 | `onXxx?: (...) => any` | `@on-ok`、`@click`、`@update:model-value` |
| v-model | `modelValue` + `update:modelValue` | prop 與 listener 宣告 | 雙向綁定契約 |
| Slots | `<slot>`、`this.$slots`、render slot | `v-slots` | 自訂內容與 scoped slot 參數 |
| Instance 行為 | methods、ref、全域 service object | 多半缺少完整宣告 | 命令式呼叫、表單重置、Modal service |
| 全域服務 | `app.config.globalProperties` | `ComponentCustomProperties` | `this.$Message`、`this.$Modal` |
| 型別導出 | runtime export chain | `types/index.d.ts`、`viewuiplus.components.d.ts` | `import { Button } from 'view-ui-plus'` 的型別 |

這張表的核心是：公開 API 要同時看 runtime 和 type。runtime 決定「程式跑起來能不能用」，type 決定「使用者寫程式時是否得到正確約束與提示」。

## 三層判斷法

判斷 API 是否公開，可以用三層檢查：

1. runtime 是否提供：元件是否有 prop、emit、slot、method 或 service 方法。
2. 對外入口是否暴露：使用者是否能從套件入口或模板語法接觸到。
3. 型別是否承認：`.d.ts` 是否描述這個能力。

三層都成立，通常就是穩定公開 API。只出現在 runtime methods 裡，但文件和型別都沒有描述的行為，應先當作內部細節。

## 閱讀切入點

建議用三個元件建立模型：

| 元件 | 適合觀察 |
| --- | --- |
| `Button` | 最小 props、validator、default slot、click emit、link mixin |
| `Modal` | `v-model`、具名 slots、全域設定、事件、命令式 Modal service |
| `Table` | 複雜 columns、事件 payload、scoped slot、`TableColumnConfig` |

閱讀時不要一開始就掃全庫。先把一個簡單元件的 runtime API 與 d.ts 對齊，再把同樣方法套到複雜元件。

## Runtime 與 Type 的落差

View UI Plus 的型別宣告能提供基本補全，但不少地方偏寬鬆，例如：

- 事件 payload 常寫成 `(event?: any) => any`。
- 複雜配置常寫成 `Function`、`object`、`any[]`。
- 一些 runtime validator 可推導成 union type，但 d.ts 沒有完全收窄。

這不是單純錯誤，而是元件庫維護成本與型別精準度的取捨。學這章時，要同時看懂現況，也要知道如果自己設計元件庫，可以在哪些地方做得更精準。

## 設計啟發

公開 API 的設計重點是穩定，而不是把所有內部能力都暴露出去。好的公開 API 應該符合：

- 名稱可預期，例如 `modelValue`、`update:modelValue`、`on-visible-change`。
- 型別能表達主要約束，例如尺寸、狀態、回呼參數。
- slot 與事件 payload 有穩定資料形狀。
- runtime 預設值、全域設定與型別宣告互相對齊。
- 入口匯出不讓使用者依賴元件內部檔案路徑。

## 檢查問題

1. 一個 prop 出現在 `.vue` 裡，但沒有出現在 `.d.ts`，使用者會遇到什麼問題？
2. 一個 method 可以透過 template ref 呼叫，是否代表它就是公開 API？
3. 為什麼全域服務要同時看 `src/index.js` 和 `types/index.d.ts`？
4. `Button`、`Modal`、`Table` 分別適合用來觀察哪些 API 類型？
5. 你會如何判斷一個 API 是否足夠穩定，可以寫進文件？
