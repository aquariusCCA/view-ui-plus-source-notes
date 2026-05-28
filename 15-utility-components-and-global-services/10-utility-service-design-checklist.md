# 工具服務設計檢查清單

## 學習目標

這篇把本章內容整理成可重複使用的設計檢查清單。當你要仿寫 `$Permission`、`$Watermark`、`$Download`、`$Clipboard`、`$RouteLoading` 這類能力時，可以用這份清單檢查 API、狀態、生命週期、型別與測試。

讀完後，要能把 View UI Plus 的全域服務設計模式轉成自己的工程實作流程。

## 一、先判斷能力類型

設計前先選類型：

| 類型 | API 範例 | 適合場景 |
| --- | --- | --- |
| 一次性提示 | `$Message.success(options)` | 操作成功、錯誤、警告 |
| 可命名通知 | `$Notice.open({ name })`、`close(name)` | 持久通知、任務提醒 |
| 流程狀態 | `$Loading.start()`、`finish()` | 路由進度、批次流程 |
| 開關遮罩 | `$Spin.show()`、`hide()` | 全頁阻斷式等待 |
| 命令式浮層 | `$Modal.confirm(options)` | 確認、預覽、臨時表單 |
| DOM 工具 | `$Copy(options)`、`$ScrollTop(...)` | 複製、下載、滾動、聚焦 |
| 全域設定 | `$VIEWUI`、`globalConfig` | 跨元件預設偏好 |

不要先決定「掛到 `$` 上」。先判斷它的狀態模型，再決定是否需要全域服務。

## 二、API 契約

每個服務至少要定義：

- 呼叫方式：函數、語意方法、show/hide、start/finish。
- options 欄位：內容、行為、生命週期 callback 分開命名。
- 特殊值：`0`、`false`、空字串是否有有效語意。
- 回傳值：是否回傳 close function、Promise、任務 id 或不回傳。
- 錯誤處理：失敗時 callback、throw、Promise reject 還是顯示提示。
- 可配置性：是否需要 `config(options)` 修改全域預設。

API 要反映控制權。呼叫端需要手動關閉，就回傳 handler 或提供 id；呼叫端只描述流程，就提供 start/finish。

## 三、實例與生命週期

命令式服務要明確規劃：

- 是否單例。
- 是否允許多筆 queue。
- 是否每次呼叫都建立新 task。
- DOM container 建在哪裡。
- 動畫關閉是否需要延遲 unmount。
- destroy 是否清理 timer、listener、queue、container。
- 關閉後外層 instance 是否設回 `null`。

可以用這條線檢查：

```txt
first call
  -> getInstance / newInstance
  -> mount / create task
  -> update / show
  -> close / hide / finish
  -> transition delay
  -> unmount / remove DOM
  -> clear refs / timers / callbacks
```

## 四、環境與依賴

如果服務會碰瀏覽器能力，要檢查：

- 是否用 `isClient` 保護 `window`、`document`。
- 是否會在 SSR import 階段就操作 DOM。
- 是否建立 listener，並在 unmount 前移除。
- 是否使用 `requestAnimationFrame`，沒有時是否有 fallback。
- 是否依賴其他服務，例如 `$Copy` 依賴 `$Message`。
- 是否和 z-index、transfer、scroll lock、locale 有關。

服務之間可以互相依賴，但要避免循環依賴和隱藏副作用。Copy 顯示 Message 是合理的；低層 csv 工具直接呼叫 Message 就不合理。

## 五、型別與文件

每個服務應該有三層型別對齊：

- 具名匯出型別：`MessageService`、`LoadingService`。
- 全域屬性型別：`ComponentCustomProperties['$Message']`。
- options 型別：`MessageOptions`、`NoticeConfig`。

文件與範例要描述：

- 字串 shorthand 是否支援。
- `duration: 0`、`top: 0` 等特殊值。
- `render` 和字串內容的優先序。
- callback 執行時機。
- destroy/remove/hide 的差異。

型別不能只讓屬性存在，還要讓使用者知道能呼叫什麼。

## 六、測試情境

工具服務的測試不一定只看畫面，還要看副作用：

- 多次呼叫是否重用 instance。
- destroy 後再次呼叫是否能重建。
- timer 是否在 finish/error/update/destroy 後清理。
- close(name) 找不到項目時是否安全。
- `duration: 0` 是否不自動關閉。
- DOM container 是否在 unmount 後移除。
- SSR 或無 window 環境是否安全返回。
- callback 是否在預期時機執行。
- TypeScript 是否能辨識 `$X` 和 options。

如果是視覺服務，再補上 z-index、動畫、滾動鎖定與多浮層疊加測試。

## 仿寫練習方向

可以用以下小題練習：

1. 仿寫 `$Toast`：支援 `success/error/loading`、duration、回傳 close function。
2. 仿寫 `$RouteLoading`：支援 `start/update/finish/error`，確保 timer 清理。
3. 仿寫 `$Clipboard`：支援文字複製、成功失敗 callback、可選提示。
4. 仿寫 `$DownloadCsv`：使用純 `csv` 工具產生內容，再封裝下載流程。
5. 仿寫 `$Watermark`：建立全域 DOM 節點，支援 update 和 destroy。

每個練習都要先寫 API 契約，再寫生命週期，再補型別。

## 複習題

1. 設計全域服務時，為什麼要先判斷狀態模型？
2. 哪些服務適合 queue，哪些服務適合 singleton state？
3. 什麼情況下要回傳 close function，而不是只提供 destroy？
4. 為什麼 SSR guard 是工具服務的基本要求？
5. 一個全域服務的型別要對齊哪三個位置？
