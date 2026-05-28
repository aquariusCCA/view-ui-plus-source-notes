# 進階業務元件設計檢查清單

## 學習目標

這篇整理仿寫或二次封裝進階業務元件時的檢查流程。適用於 Login、Auth、SearchForm、CrudTable、BusinessModal、DescriptionList、FooterToolbar 等元件。

## 1. 場景是否成立

- 這個封裝是否在多個頁面重複出現？
- 它解決的是 UI 重複，還是業務流程重複？
- 是否已經能用現有 View UI Plus 元件簡單組合完成？
- 是否含有過多公司內部專屬規則？
- 是否可以先抽 composable，而不是立刻抽元件？

## 2. 狀態歸屬

- 哪些狀態由元件內部持有？
- 哪些狀態必須由父頁面控制？
- 是否支援 `v-model`？
- loading、error、empty、disabled 是否分清楚？
- 重置時要回到哪個狀態？

## 3. API 設計

- props 是否只保留穩定配置？
- schema 是否有清楚欄位定義？
- slots 是否能覆蓋特殊欄位與操作區？
- events 是否回傳足夠上下文？
- methods 是否真的需要暴露？
- 權限、loading、disabled 是否有一致命名？

## 4. 表單與提交

- rules 從哪裡來？
- validate 失敗是否阻止 submit？
- submit payload 是 raw values 還是 transformed values？
- API 失敗時是否保持表單狀態？
- 成功後是否自動 reset 或 close？
- 後端欄位錯誤是否能映射回 FormItem？

## 5. 表格與資料

- columns 是否可被 slot/render 覆蓋？
- row action 是否有 action key？
- selection 是否支援跨頁保留？
- pagination 和 query 是否同步？
- 空資料、錯誤、loading 是否有明確顯示？
- 匯入、貼上、批量操作是否有錯誤回報？

## 6. 彈窗與流程

- create/edit/detail/audit 是否共用同一套狀態模型？
- open 時如何初始化資料？
- close 是否需要 guard？
- mask click、Esc、cancel 是否行為一致？
- submit loading 是否避免重複提交？
- 成功後由誰負責回刷父頁面？

## 7. 權限與可用性

- 無權限時 hidden、disabled、prevent、fallback 哪一種最適合？
- 權限判斷是否支援 row 級上下文？
- 禁用原因是否能提示？
- 危險操作是否有二次確認？
- 操作完成是否有 Message/Notice 回饋？

## 8. 型別與測試

- schema 是否有泛型支援資料列或表單值？
- event payload 是否有明確型別？
- slot props 是否能被 IDE 推導？
- 是否有 runtime props 和 `.d.ts` 漂移？
- 是否測試 reset、submit、error、permission、close guard？

## 複習題

1. 在什麼情況下應該放棄封裝成通用業務元件？
2. 業務元件最容易缺失的事件 payload 是什麼？
3. 為什麼 close guard 要覆蓋所有關閉入口？
4. schema 型元件如何避免變成不可讀的大配置？
5. 做企業二次封裝前，至少應該先完成哪些檢查？
