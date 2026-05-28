# 非同步、計時器與服務式 API 測試

## 學習目標

這篇分析元件測試中的非同步等待、timer 和全域服務式 API。重點是理解為什麼 `nextTick()` 有時不夠，為什麼 Message 這類服務不能只看回傳值，以及測試完成後如何避免 DOM 殘留。

## 對照源碼

- `01-origin/source/view-ui-plus-v1.3.20/test/unit/specs/message.spec.js`
- `01-origin/source/view-ui-plus-v1.3.20/test/unit/specs/select.spec.js`
- `01-origin/source/view-ui-plus-v1.3.20/test/unit/specs/date-picker.spec.js`
- `01-origin/source/view-ui-plus-v1.3.20/test/unit/util.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/message/`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/base/notification/`

## 非同步來源

View UI Plus 測試中的非同步來源很多：

- Vue DOM 更新：需要 `vm.$nextTick()`。
- 子元件註冊：Option、Select、FormItem 可能需要等待 child 狀態同步。
- 延遲資料：Select 測試中 mounted 後才設定 options。
- 動畫或浮層建立：Message 會動態建立通知節點。
- 計時器：Message duration、LoadingBar、Spin、Notice 都可能依賴 timer。
- 使用者連續操作：DatePicker range 選取需要多次 click 和多次 tick。

測試失敗常不是邏輯錯，而是斷言太早。

## nextTick 的邊界

`nextTick()` 等的是 Vue 已排程的 DOM 更新。它適合：

- props 改變後檢查 class。
- click 後檢查同一個元件內的 DOM。
- data 改變後檢查文字。

但 `nextTick()` 不一定等得到：

- setTimeout。
- 外部 promise。
- 動態建立的新 Vue instance。
- 多層子元件註冊。
- 第三方 library 的 callback。

因此 Select 和 Message 測試會使用 `waitForIt()` 輪詢 DOM 或內部狀態。

## Message 測試

Message 測試建立空 VM 後呼叫：

```js
vm.$Message.info({
  content: testMessage,
  duration: 200
});
```

然後用 selector 查：

```js
.ivu-message-notice-content-text .ivu-message-info
```

並用 `waitForIt()` 等到 DOM 出現後斷言文字。

這個測試說明服務式 API 的重點：

- API 呼叫不一定回傳可測物件。
- 真正的結果是 document 中多了一個服務節點。
- duration 會影響節點生命週期。
- 測完需要清理動態 DOM。

全域服務測試的觀察點通常在 `document.body`，不是 `vm.$el`。

## 多個訊息類型

Message 另一個測試一次呼叫：

- `info`
- `success`
- `warning`
- `error`
- `loading`

再等待 `.ivu-message-custom-content` 數量等於測試案例數，逐一驗證 class。

這種 table-driven 測試很適合測一組同形 API：

- 輸入 type。
- 預期文字。
- 預期 class。

它比為每個 type 寫一段幾乎相同的測試更好維護。

## timer 測試策略

Message 測試把 duration 設得很短或可控，是為了降低等待成本。但 timer 測試要小心：

- duration 太短，DOM 可能還沒斷言就消失。
- duration 太長，測試變慢。
- 沒有 fake timer，測試容易受環境速度影響。

現代測試中可以用 fake timers：

- 建立 message。
- 斷言 message 出現。
- 推進時間。
- 斷言 message 關閉。

View UI Plus 的 devDependencies 有 `lolex`，但現有 Message spec 沒充分使用。這可以視為後續測試改善點。

## 非同步測試清理

非同步測試更容易留下殘留：

- Message DOM 還在 document。
- setTimeout 還沒跑完。
- event listener 還掛在 document。
- transfer 到 body 的浮層沒有移除。

測試應該在完成後清理：

- `destroyVM(vm)`
- 移除服務 DOM。
- 清掉 timer 或使用 fake timer restore。
- 對全域服務呼叫 destroy / remove 類 API。

如果服務本身沒有良好清理 API，測試就會暴露出元件庫設計上的缺口。

## 設計啟發

測非同步和服務 API 時，可以依序確認：

1. 呼叫 API 前，document 中沒有目標節點。
2. 呼叫 API 後，等待目標節點出現。
3. 驗證內容、類型、數量、順序。
4. 觸發關閉或推進 timer。
5. 驗證節點被移除。
6. 清理殘留，避免影響下一個測試。

這比只檢查「呼叫時不報錯」可靠得多。

## 複習題

1. `nextTick()` 可以等待哪些更新，不能等待哪些更新？
2. Message 服務為什麼要查 `document` 而不是只查 `vm.$el`？
3. `waitForIt()` 在 Message 和 Select 測試中分別解決什麼問題？
4. timer 測試為什麼適合使用 fake timers？
5. 全域服務測試如果不清理，可能造成哪些後續測試問題？
