# Message 與 Notice

## 學習目標

Message 和 Notice 是全域回饋服務。它們不像 Alert 一樣由使用者放在模板裡，也不像 Modal 元件式使用時由父元件管理 `v-model`。使用者呼叫 `$Message.success()` 或 `$Notice.open()` 後，元件庫會動態建立通知容器，把每則訊息推入佇列，再依 duration、close、destroy 管理生命週期。

讀完後，要能理解全域訊息服務如何用 `createApp`、單例實例、通知陣列與計時器完成「命令式 API 到 Vue UI」的轉換。

## 對照源碼

- `01-origin/source/view-ui-plus-v1.3.20/src/components/message/index.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/notice/index.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/base/notification/index.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/base/notification/notification.vue`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/base/notification/notice.vue`
- `01-origin/source/view-ui-plus-v1.3.20/types/message.d.ts`
- `01-origin/source/view-ui-plus-v1.3.20/types/notice.d.ts`
- `01-origin/source/view-ui-plus-v1.3.20/src/styles/components/message.less`
- `01-origin/source/view-ui-plus-v1.3.20/src/styles/components/notice.less`

## Message 與 Notice 的差異

| 面向 | Message | Notice |
| --- | --- | --- |
| 視覺位置 | 頂部居中 | 右上角 |
| 預設 duration | 1.5 秒 | 4.5 秒 |
| 內容結構 | 短訊息 | title + desc |
| close API | 呼叫返回的關閉函式或 destroy | `close(name)` 或 destroy |
| 類型 | info、success、warning、error、loading | open、info、success、warning、error |
| closable | 可由 options 控制 | 每則通知預設可關閉 |
| transition | `move-up` | `move-notice` |

Message 適合短促回饋，例如「保存成功」。Notice 適合更完整的通知，例如「任務已完成，可點擊查看詳情」。

## Notification base

兩者都基於 `base/notification`：

```txt
Notification.newInstance(properties)
  -> createApp(...)
  -> document.body.appendChild(container)
  -> mount Notification component
  -> return { notice, remove, destroy }
```

`notification.vue` 內部維護：

```txt
notices: []
```

每次呼叫 `notice()` 時，會把一個 notice object push 進陣列，再用 `transition-group` 渲染多則通知。每則通知實際由 `notice.vue` 負責顯示、計時與關閉。

這裡的架構是：

```txt
Message / Notice facade
  -> Notification singleton
  -> notices array
  -> Notice item
  -> timer / close / transition
```

## Message 流程

`Message.success('ok')` 會被整理成：

```txt
Message.success(options)
  -> message('success', options)
  -> notice(content, duration, type, ...)
  -> getMessageInstance()
  -> instance.notice({...})
  -> return close function
```

Message 的 `notice()` 會建立 HTML 字串：

```txt
div.ivu-message-custom-content.ivu-message-{type}
  i.ivu-icon-{iconType}
  span content
```

如果 type 是 `loading`，icon 會加上 `ivu-load-loop` class。

Message 會回傳一個手動關閉函式：

```txt
const close = Message.loading({ content: 'Loading...', duration: 0 })
close()
```

這個設計比只提供 `destroy()` 更精準，因為它可以只移除當前那則訊息。

## Notice 流程

`Notice.success(options)` 會被整理成：

```txt
Notice.success(options)
  -> notice('success', options)
  -> getNoticeInstance()
  -> instance.notice({...})
```

Notice 的每則通知可用 `name` 指定唯一標識：

```txt
Notice.open({
  name: 'sync-task',
  title: '同步完成',
  desc: '共更新 12 筆資料'
})

Notice.close('sync-task')
```

如果不提供 `name`，Notice 會用遞增計數產生 `ivu_notice_key_{n}`。

## duration 與 close timer

單則通知在 `notice.vue` mounted 後會啟動 timer：

```txt
if duration !== 0:
  closeTimer = setTimeout(close, duration * 1000)
```

關閉時：

```txt
clearCloseTimer()
onClose()
parent.close(name)
```

`duration: 0` 表示不自動關閉。這類 API 要在文件中明確說清楚，因為 `0` 不是無效值，而是特殊語意。

## render 與 v-html

Message 和 Notice 都支援 `render`，也都會把部分字串內容透過 `v-html` 放進 DOM。閱讀這段源碼時要特別注意：

- `content`、`title`、`desc` 字串會組成 HTML 字串。
- `render` 透過 `RenderCell` 轉成 VNode。
- 如果業務側把未信任的使用者輸入當成 HTML 字串傳入，會有注入風險。

在仿寫企業內部通知服務時，通常應該優先使用純文字渲染或明確 escape，而不是默認把字串當 HTML。

## config 與 destroy

Message 的 config：

| option | 作用 |
| --- | --- |
| `top` | 距離頂部 |
| `duration` | 預設自動關閉時間 |
| `background` | 是否顯示背景色 |

Notice 的 config：

| option | 作用 |
| --- | --- |
| `top` | 距離頂部 |
| `duration` | 預設自動關閉時間 |

`destroy()` 會取出目前實例、清空單例引用，並呼叫 base notification 的 destroy。destroy 適合路由切換、登出或測試清理時使用。

## 設計啟發

仿寫全域訊息服務時，要先設計：

1. 是單例容器，還是每次呼叫都建立容器。
2. 每則訊息如何命名，是否支援手動 close。
3. `duration: 0` 是否表示常駐。
4. close button、timer、destroy 是否共用同一條清理路徑。
5. render function 與字串內容的安全邊界。
6. config 是影響未來實例，還是也會更新已存在實例。

## 複習題

1. Message 和 Notice 為什麼要共用 Notification base？
2. Message 回傳 close function 解決了什麼問題？
3. Notice 的 `name` 和 Message 的內部 key 有什麼差異？
4. `duration: 0` 在通知服務中代表什麼？
5. `v-html` 和 render function 在通知內容中分別有什麼風險與彈性？
