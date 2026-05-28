# 元件庫測試設計檢查清單

## 學習目標

這篇把前面所有測試筆記整理成可重複使用的檢查清單。當你仿寫 View UI Plus、維護既有元件或為 bugfix 補測試時，可以用這份清單確認測試是否真的守住元件庫契約。

## 對照源碼

- `01-origin/source/view-ui-plus-v1.3.20/test/unit/`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/`
- `01-origin/source/view-ui-plus-v1.3.20/types/`

## 1. 測試目標

- 這個測試守住的是 props、event、slot、DOM、class、公開方法還是全域服務？
- 測試名稱是否清楚描述使用者情境？
- 測試失敗時，是否能快速知道哪個契約壞了？
- 是否避免只測「不報錯」？
- 是否至少有一個斷言落在使用者可觀察結果上？

## 2. 掛載與清理

- 是否使用統一 helper 掛載元件？
- 需要全域插件時，是否在測試環境中安裝？
- 需要真實 DOM 時，是否掛到 `document.body`？
- 每個測試後是否 unmount / destroy？
- Teleport、Message、Notice、Modal 類 body DOM 是否清理？
- timer、event listener、mock 是否 restore？

## 3. Props 與渲染

- 是否測預設渲染？
- 主要 props 是否有正向斷言？
- props 組合是否有優先順序測試？
- disabled、loading、error、selected 等狀態 class 是否被覆蓋？
- 不該出現的 attribute 或 DOM 是否有反向斷言？
- slot 是否測到預設內容和自訂內容？

## 4. 事件與 v-model

- 使用者操作是否能觸發事件？
- 事件 payload shape 是否明確斷言？
- v-model 對應的父層資料是否更新？
- 清除、重置、取消等反向操作是否測到？
- 多 instance 是否互相隔離？
- 直接呼叫 method 時，斷言是否仍落在公開結果？

## 5. 非同步與 timer

- 是否在 DOM 更新後才斷言？
- 使用 `nextTick`、Promise、wait helper 或 fake timer 是否符合非同步來源？
- 等待條件是否明確，而不是只 sleep 固定時間？
- duration、delay、auto close 是否可控？
- 非同步測試失敗時，錯誤訊息是否容易定位？

## 6. 表單與輸入

- 初始 value / modelValue 是否正確顯示？
- DOM input 是否能更新元件狀態？
- 顯示值和提交值是否正確轉換？
- 空字串、`null`、`undefined`、`0`、false 是否有必要覆蓋？
- 特殊字元是否保留原樣？
- validation rule、trigger、錯誤訊息、callback 是否一致？
- reset 後是否能再次正常輸入？

## 7. 複雜元件

- 是否先測最穩定的公開契約，而不是整棵 DOM？
- 資料轉換、排序、篩選、匯出、選取是否拆成獨立案例？
- 大量資料是否有合理效能邊界？
- 延遲資料是否能被元件接住？
- 子元件註冊和父子狀態同步是否被覆蓋？
- fixture 是否清楚說明測試目的？

## 8. 邊界與回歸

- 這個 bugfix 是否有最小重現測試？
- 測試資料是否包含真實會出錯的值？
- 重置後再操作是否覆蓋？
- props 動態切換是否覆蓋？
- 多 locale 是否用資料表驅動測試？
- 多 instance 和全域狀態是否隔離？

## 9. 覆蓋率與維護

- coverage 缺口是否對應到高風險元件？
- 測試是否避免過度綁定 private DOM 層級？
- 重複測試資料是否抽成 fixture 或 factory？
- 測試 helper 是否只抽真正重複的行為？
- 測試名稱是否保留 bug 情境，而不是被抽象到看不懂？
- CI 中測試速度是否可接受？

## 10. 現代化遷移

- 舊測試的契約是否先列出，再遷移工具？
- Vue 3 下是否使用正確的 mount 和 plugin 安裝方式？
- 全域服務、Teleport、body DOM 是否有專門 helper？
- fake timers 是否在每個測試後 restore？
- 需要真瀏覽器的行為是否交給 Playwright 或等價工具？

## 最小測試組合

一個新的 View UI Plus 風格元件，至少應該有：

- 預設渲染測試。
- 主要 props 測試。
- 主要事件或 v-model 測試。
- 一個邊界值測試。
- 一個清除或重置測試。
- 如果有全域副作用，必須有清理測試。
- 如果有公開方法，必須測方法的輸入和對外結果。

## 複習題

1. 寫測試前，為什麼要先說清楚它守住哪個契約？
2. 全域服務和 Teleport 測試為什麼特別需要清理？
3. 事件測試為什麼不能只測有沒有被呼叫？
4. 複雜元件應該先測 DOM 結構還是公開行為？
5. bugfix 測試要怎麼避免變成過大的整合測試？
