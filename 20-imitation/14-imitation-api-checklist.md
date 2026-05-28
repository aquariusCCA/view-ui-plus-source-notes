# 仿寫元件 API 檢查清單

這份清單用來檢查每個仿寫元件是否真的像元件庫，而不只是完成了一段畫面。每做完一個 Mini 元件，都應該用這份清單快速過一輪。

## 練習目標

- 建立仿寫元件的 API 檢查流程。
- 避免只重視畫面，不檢查契約。
- 讓 props、emits、slots、expose、types、styles 對齊。
- 建立後續重構前的基準線。

## 對照源碼

每個元件都至少對照五個來源：

- 元件實作檔。
- 元件入口檔。
- 型別宣告。
- 樣式檔。
- 官方文件或 demo。

如果只看 `.vue`，通常會漏掉全域安裝、型別、樣式狀態與使用者真正會依賴的公開契約。

## 最小實作範圍

這篇不是要新增元件，而是建立一份每個仿寫案例都能重複使用的 API 審查表。完成任一 Mini 元件後，都要用這份清單檢查：

- props 是否少而準。
- emits 是否有明確觸發時機。
- slots 是否有合理 fallback。
- expose 是否真的必要。
- types 是否能支援使用者側開發體驗。
- styles 是否和 class 規則一致。

先不檢查完整 accessibility、文件站生成、打包產物與跨版本相容，這些留到更完整的元件庫實作階段處理。

## API 設計

這份清單本身的「輸入」是一個已完成的仿寫元件，「輸出」是一份修正清單。

| 輸入 | 檢查內容 | 輸出 |
| --- | --- | --- |
| 元件 props | 命名、預設值、型別、狀態映射 | 需要保留、刪除或改名的 props |
| 元件 emits | 事件名稱、payload、觸發時機 | 需要補測或修正的事件 |
| 元件 slots | default、named slots、fallback | 需要補上的 slot 行為 |
| 元件 expose | imperative methods | 需要公開或收斂的方法 |
| 元件 types | 對外型別與內部型別 | 需要導出的型別 |
| 元件 styles | prefix、狀態 class、尺寸 class | 需要統一的 class 規則 |

## Props 檢查

| 檢查項 | 問題 |
| --- | --- |
| 命名 | prop 名稱是否和 View UI Plus 語意一致？ |
| 預設值 | 是否明確定義預設值，而不是散落在 template 判斷？ |
| 型別 | TypeScript 型別是否比 runtime 更清楚？ |
| validator | 是否有需要限制的字串聯集？ |
| 狀態映射 | prop 是否能明確映射到 class、style 或行為？ |
| 過度設計 | 是否加入了這篇練習不需要的 prop？ |

好的仿寫版應該少而準。若一個 prop 沒有被驗收案例覆蓋，先不要加入。

## Emits 檢查

| 檢查項 | 問題 |
| --- | --- |
| 命名 | 事件名稱是否符合 Vue 與 View UI Plus 慣例？ |
| payload | payload 是否穩定且容易推斷？ |
| 時機 | 事件是在值變更前還是變更後觸發？ |
| 阻止條件 | disabled、loading、readonly 時是否還會 emit？ |
| `v-model` | 是否正確使用 `update:modelValue`？ |
| 重複事件 | 是否同一次互動 emit 過多語意重疊事件？ |

事件是外部使用者最容易依賴的契約。仿寫時要把觸發時機寫進驗收案例。

## Slots 檢查

| 檢查項 | 問題 |
| --- | --- |
| default slot | 是否清楚代表主要內容？ |
| named slots | 是否只為真正需要擴充的位置開 slot？ |
| slot props | slot props 是否穩定且最小？ |
| fallback | 沒有 slot 時是否有合理 fallback？ |
| slot presence | 是否需要根據 slot 是否存在改 class？ |

Divider、Input、Table 都需要特別注意 slot presence。slot 不只是內容，也會改變元件結構。

## Expose 檢查

| 檢查項 | 問題 |
| --- | --- |
| 必要性 | 外部是否真的需要 imperative method？ |
| 命名 | 方法名稱是否直覺，例如 `focus`、`blur`、`validate`？ |
| 回傳值 | Promise、boolean、void 是否明確？ |
| 錯誤處理 | 驗證失敗或 DOM 不存在時如何回應？ |

不是每個元件都需要 expose。Icon、Divider 通常不需要；Input、Form 通常需要。

## Types 檢查

| 檢查項 | 問題 |
| --- | --- |
| prop type | 是否有對外可重用型別？ |
| emit payload | payload 是否可被 TypeScript 推斷？ |
| instance type | 是否需要導出 instance 方法型別？ |
| column/rule type | 複雜資料結構是否有獨立 interface？ |
| 匯出位置 | 使用者是否能從 library 入口取得型別？ |

Table columns、Form rules、Message handle 都應該有明確型別。

## Styles 檢查

| 檢查項 | 問題 |
| --- | --- |
| prefix | 是否統一使用 `mini-`？ |
| 狀態 class | disabled、loading、focused 是否命名一致？ |
| 尺寸 class | small、default、large 是否跨元件一致？ |
| inline style | 只有動態值才用 inline style？ |
| 覆蓋能力 | 使用者能否透過 class 或變數覆蓋主要樣式？ |

樣式系統的穩定性決定元件庫能不能長期擴充。

## 驗收案例

每個元件至少要有：

- 1 個基本渲染案例。
- 1 個主要互動案例。
- 1 個 disabled、loading、empty 或 invalid 狀態案例。
- 1 個 slot 或 fallback 案例。
- 1 個 API 邊界案例。

若是 Form、Select、Table 這類複雜元件，至少要補到 5 到 8 個案例。

## 實作步驟

1. 完成一個 Mini 元件的最小實作。
2. 對照 View UI Plus 源碼與型別，列出真實 API。
3. 用本清單檢查 props、emits、slots、expose、types、styles。
4. 移除沒有驗收案例支撐的 API。
5. 補上缺少的事件時機、slot fallback 或型別。
6. 更新該元件筆記中的驗收案例與源碼反思。

## 源碼反思

View UI Plus 的 API 是長期演進出來的，不是一次設計完成。仿寫版的清單不是要求你做到同等完整，而是避免練習結果只停留在表面 UI。

完成每篇仿寫後，都應該留下兩個結論：這次保留了哪些核心契約，以及真實元件庫還多處理了哪些工程問題。
