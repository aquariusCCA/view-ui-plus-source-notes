# 服務生命週期與單例模式

## 學習目標

這篇整理全域服務背後的生命週期與單例模式。命令式服務最容易出問題的地方，不是「顯示出來」，而是重複呼叫、動畫關閉、timer 清理、DOM 移除和 instance 失效後再次使用。

讀完後，要能追蹤一個服務從第一次呼叫到 destroy 的完整路徑。

## 對照源碼

- `01-origin/source/view-ui-plus-v1.3.20/src/components/base/notification/index.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/base/notification/notification.vue`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/message/index.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/notice/index.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/loading-bar/index.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/loading-bar/loading-bar.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/spin/spin.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/modal/index.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/modal/confirm.js`

## 單例建立

View UI Plus 全域服務常見寫法是：

```txt
let serviceInstance

function getServiceInstance() {
  serviceInstance = serviceInstance || Service.newInstance(options)
  return serviceInstance
}
```

Message、Notice、LoadingBar、Spin、Modal confirm、ImagePreview 都有類似概念。這樣做的目的有三個：

- 避免每次呼叫都建立新的 Vue app 和 DOM container。
- 讓多次呼叫可以共享 queue 或狀態。
- 讓 destroy 時有明確的 instance 可操作。

但單例不是萬能。當服務關閉後，必須把外層變數設回 `null`，否則下一次會拿到已 unmount 的舊 instance。

## Vue 子 app

Notification、LoadingBar、Spin、Modal confirm 都用 `createApp` 建立子應用：

```txt
createApp(...)
  -> document.createElement('div')
  -> document.body.appendChild(container)
  -> Instance.mount(container)
  -> 透過 ref 取得內部 component
```

這種模式讓服務脫離當前頁面模板，也意味著服務要自己處理：

- container 建立位置。
- mount 後如何取得 ref。
- update/show/remove 方法如何轉發到內部 component。
- unmount 後如何移除 container。

如果其中任一段漏掉，服務就可能留下孤兒 DOM 或失效引用。

## Queue 模式

Message 和 Notice 共用 Notification base。Notification component 內部維護：

```txt
notices: []
```

服務呼叫 `notice()` 時，把一筆資料推進 queue；關閉時用 `name` 找到並 splice。這適合多筆提示同時存在的服務。

Queue 模式要特別注意：

- 每筆項目需要穩定 key。
- close(name) 找不到時要安全返回。
- closeAll() 要能一次清空。
- z-index 要在新增項目時更新，避免被其他浮層蓋住。

## Timer 模式

LoadingBar 的 timer 是另一種生命週期：

```txt
start()
  -> if (timer) return
  -> setInterval 增加 percent

finish() / error() / update()
  -> clearTimer()
```

這裡的重點是所有離開自動進度的路徑都要清 timer。否則 timer 會繼續更新已隱藏或已銷毀的元件。

Message 和 Notice 的自動關閉也牽涉 timer，但 timer 通常在 Notice item 內部管理；LoadingBar 的 timer 則在服務層管理。

## Animation Delay

Spin 和 Modal confirm 都不是立即刪 DOM：

- Spin `remove()` 先把 `visible` 設為 false，等 500ms 後 unmount。
- Modal confirm `remove()` 先把 `closing` 設為 true，等 300ms 後 destroy。

這是為了讓離場動畫有時間播放，也避免關閉期間重複點擊。

服務設計時要明確區分：

```txt
hide visible
  -> wait transition
  -> unmount
  -> remove container
  -> clear outer instance
```

如果把這些步驟混在一起，常會出現動畫被切斷、callback 太早執行或下一次打開狀態錯亂。

## Destroy 語意

不同服務的 destroy 語意不一樣：

- Message/Notice destroy：清空 notification 並移除對應 DOM。
- LoadingBar destroy：清 timer、unmount loading bar、移除 container。
- Spin hide：移除全螢幕 spin instance。
- Modal remove：關閉目前 confirm，動畫後 destroy。

命名要反映使用者的控制權。`hide()` 通常表示暫時關閉；`destroy()` 表示釋放資源；`remove()` 在命令式浮層裡常表示移除當前任務。

## 複習題

1. 單例服務關閉後為什麼要把外層 instance 設回 `null`？
2. Queue 模式適合哪些服務，不適合哪些服務？
3. LoadingBar 的 timer 應該在哪些方法中清理？
4. 為什麼 Spin 和 Modal 不應該在使用者點關閉時立刻移除 DOM？
5. `hide`、`remove`、`destroy` 的語意應該如何區分？
