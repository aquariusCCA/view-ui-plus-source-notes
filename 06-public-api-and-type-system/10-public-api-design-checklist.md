# 公開 API 設計檢查清單

## 學習目標

這篇把本章內容整理成可重複使用的檢查清單。之後閱讀 View UI Plus 的單一元件，或自己設計企業內部元件庫時，都可以用這份清單檢查公開 API 與型別體驗。

## 1. 先定義 API 邊界

設計或分析元件前，先回答：

- 使用者會透過模板、JSX、service 還是 ref 使用它？
- 哪些 props 是穩定公開能力？
- 哪些 methods 只是內部實作？
- 是否需要全域安裝或按需匯入？
- 是否需要在 d.ts 中導出配置型別？

API 邊界不清楚時，後面很容易把內部細節誤當公開能力。

## 2. Props 檢查

| 檢查項 | 問題 |
| --- | --- |
| 命名 | camelCase 與 kebab-case 是否能清楚對應？ |
| 類型 | runtime `type` 是否和 TypeScript 型別一致？ |
| 合法值 | validator 是否能轉成 union type？ |
| 預設值 | default 是否依賴全域設定或其他 prop？ |
| 引用值 | object / array default 是否用 factory function？ |
| mixin | 是否有 props 來自 mixin 或 shared logic？ |
| 破壞性 | 修改 prop 名稱、預設值、合法值是否會影響使用者？ |

Props 是元件 API 的主體。只要 props 不清楚，文件、測試與型別都會跟著混亂。

## 3. Events 與 v-model 檢查

| 檢查項 | 問題 |
| --- | --- |
| 名稱 | 事件名稱是否符合既有命名風格？ |
| 時機 | 事件在什麼操作或生命週期節點觸發？ |
| payload | 參數數量、順序、資料形狀是否穩定？ |
| v-model | 是否同時提供 value prop 與 update event？ |
| 型別 | listener prop 是否描述 payload，而不是全部 `any`？ |
| 相容 | 是否需要保留歷史事件名稱？ |

事件 API 一旦被業務流程依賴，修改成本很高。設計時要比 props 更重視 payload 穩定性。

## 4. Slots 檢查

| 檢查項 | 問題 |
| --- | --- |
| 名稱 | slot 名稱是否短且語意明確？ |
| fallback | 沒傳 slot 時是否有合理預設內容？ |
| 優先級 | slot 和 prop 同時存在時誰優先？ |
| scoped payload | 傳給 slot 的資料是否穩定？ |
| 型別 | `v-slots` 是否描述 slot 名稱與 payload？ |
| DOM 依賴 | 使用者是否會被迫依賴內部 DOM 結構？ |

slot 是元件庫最重要的擴展點之一。複雜元件最好把 slot payload 當成正式資料契約。

## 5. Instance 與全域服務檢查

| 檢查項 | 問題 |
| --- | --- |
| ref methods | 是否真的要讓使用者透過 ref 呼叫？ |
| service methods | 方法名稱、options、回傳值是否穩定？ |
| globalProperties | runtime 是否正確掛到 Vue app？ |
| ComponentCustomProperties | TypeScript 是否知道全域屬性存在？ |
| any 風險 | 全域服務是否被宣告成 `any` 而失去提示？ |

命令式 API 最容易被濫用。要暴露就完整暴露，不暴露就避免讓使用者依賴內部 method。

## 6. 型別出口檢查

| 檢查項 | 問題 |
| --- | --- |
| 單一 d.ts | 每個元件是否有對應宣告？ |
| 集中出口 | `viewuiplus.components.d.ts` 是否同步匯出？ |
| 總入口 | `types/index.d.ts` 是否匯出元件與 install？ |
| 輔助型別 | columns、options、config 是否可單獨匯入？ |
| runtime 對齊 | type export map 是否和 runtime export map 一致？ |

型別出口就是使用者側的穩定邊界。不要讓使用者為了型別去 import 內部路徑。

## 7. 最小驗收

完成一個元件 API 後，至少做這幾個驗收：

- 模板中使用 props、events、slots 能正常執行。
- TypeScript 能提示 props 合法值。
- 錯誤 props 值能被 TypeScript 或 runtime validator 擋住。
- v-model 能正確同步外部資料。
- 事件 payload 在 IDE 中能看出形狀。
- 全域服務能在 Options API 的 `this` 中被識別。
- 按需匯入和完整安裝都能對應到同一組型別。

## 練習方式

建議用三輪練習：

1. 用 `Button` 做最小 API 對照。
2. 用 `Modal` 加入 v-model、slots、全域設定與 service。
3. 用 `Table` 檢查複雜配置、事件 payload 與 scoped slot。

每輪都輸出一張表：runtime API、type API、是否漂移、改善建議。

## 檢查問題

1. 為什麼公開 API 設計要先定義邊界？
2. 哪些 prop 修改會被視為破壞性變更？
3. 事件 payload 為什麼應該有獨立型別？
4. scoped slot 的 payload 為什麼比 slot 名稱更容易漂移？
5. 你會如何把這份清單用在企業內部的 SearchForm 或 CrudTable 封裝？
