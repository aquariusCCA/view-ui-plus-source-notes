# Message、Notice 與 Loading 服務契約

## 學習目標

這篇從服務契約角度整理 Message、Notice、LoadingBar 與 Spin。這些能力在視覺上都屬於回饋，但在全域服務層面，它們分別代表不同的任務模型。

讀完後，要能說清楚短提示、持久通知、流程載入條與全螢幕遮罩載入在 API、狀態、關閉與銷毀上的差異。

## 對照源碼

- `01-origin/source/view-ui-plus-v1.3.20/src/components/message/index.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/notice/index.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/loading-bar/index.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/loading-bar/loading-bar.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/spin/index.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/spin/spin.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/base/notification/`
- `01-origin/source/view-ui-plus-v1.3.20/src/utils/transfer-queue.js`

## Message：短生命週期提示

Message 的核心狀態在 `message/index.js`：

```txt
defaults
messageInstance
name
iconTypes
```

`getMessageInstance()` 使用 `Notification.newInstance()` 建立單例。每次呼叫 `info`、`success`、`warning`、`error`、`loading` 都會進入 `notice()`，再把一筆 notice 推進 notification queue。

Message 的服務契約是：

- 位置預設由 `defaults.top` 控制。
- 自動關閉預設由 `defaults.duration` 控制。
- `duration: 0` 可以表示不自動關閉。
- 呼叫結果回傳一個 close function。
- `destroy()` 清空全域 instance 並移除 notification DOM。

Message 適合「某次操作的短回饋」，例如儲存成功、刪除失敗、載入中。

## Notice：可命名通知

Notice 也基於 `Notification.newInstance()`，但契約比 Message 更偏「通知中心」：

- 有 `title`、`desc`、`render`。
- 每筆通知可以有 `name`。
- 預設 closable 為 true。
- `close(name)` 可以移除指定通知。
- `destroy()` 移除整個 notice instance。

Notice 的 `duration` 判斷值得注意：

```txt
options.duration === 0 ? 0 : options.duration || defaultDuration
```

這種寫法保留了 `0` 的語意，避免被 `||` 吃掉。閱讀所有服務 options 時，都要找這類特殊值處理。

## LoadingBar：流程進度狀態

LoadingBar 不是佇列，而是一個全域流程狀態：

```txt
start()
  -> percent = 0
  -> timer 自動增加到 95 左右

update(percent)
  -> clearTimer()
  -> 精準設定進度

finish()
  -> clearTimer()
  -> percent = 100
  -> hide()

error()
  -> clearTimer()
  -> percent = 100, status = error
  -> hide()
```

`loading-bar/loading-bar.js` 透過 `createApp` 建立一個 Vue 子應用，掛到 `document.body` 下。`index.js` 則管理單例、顏色、高度、duration 與 timer。

這裡的教學重點是「服務 API 其實是一個小型狀態機」。如果只記得 `start` 和 `finish`，會漏掉 timer 清理、hide 延遲和 reset percent。

## Spin：全螢幕開關狀態

Spin 同時是局部載入元件和全域服務。全域服務由 `spin/index.js` 加上 `spin/spin.js` 完成：

- `Spin.show(props)` 取得或建立單例。
- `Spin.hide()` 移除單例。
- `Spin.newInstance()` 建立全螢幕 wrapper，使用 `transfer-queue` 提升 z-index。
- `remove()` 先把 visible 設為 false，再等動畫時間後 unmount 並移除 container。

Spin 的契約比 LoadingBar 更像開關：它不追蹤百分比，只負責顯示和隱藏一個阻斷式全螢幕載入。

## 四者差異

| 服務 | 狀態模型 | 關閉方式 | 適合場景 |
| --- | --- | --- | --- |
| Message | 多筆短提示 queue | duration、回傳 close function、destroy | 操作成功失敗提示 |
| Notice | 多筆可命名通知 queue | duration、close(name)、destroy | 系統通知、長文通知 |
| LoadingBar | 單一進度狀態 | finish、error、destroy | 路由切換、頁面流程 |
| Spin | 單一全螢幕遮罩 | hide | 全頁等待、阻斷式載入 |

這張表是仿寫服務時最重要的分類。先判斷任務模型，再決定 API。

## 設計啟發

回饋服務要避免三種常見問題：

- 重複建立 DOM：用 singleton 或 queue 管理。
- 狀態無法收束：每條 start/show 路徑都要有 finish/hide/destroy。
- 特殊值遺失：`duration: 0`、`top: 0`、`closable: false` 都要明確處理。

View UI Plus 的實作裡，Message 和 Notice 共享 Notification base，LoadingBar 和 Spin 自己建立 Vue 子 app。這反映出一個判斷：多筆提示適合 queue；單一流程狀態適合一個可更新的 instance。

## 複習題

1. Message 為什麼回傳 close function，而 Notice 使用 `close(name)`？
2. LoadingBar 的 `start()` 為什麼要防止 timer 重複建立？
3. Spin 的 `remove()` 為什麼不是立刻 unmount？
4. `duration: 0` 在提示服務中代表什麼？
5. 什麼場景應該用 LoadingBar，而不是 Message.loading？
