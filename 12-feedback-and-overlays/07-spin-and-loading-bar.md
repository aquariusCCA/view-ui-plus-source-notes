# Spin 與 LoadingBar

## 學習目標

Spin 和 LoadingBar 都是載入回饋，但它們的語意不同。Spin 表示某個區域或整個頁面正在等待，LoadingBar 則用頁面頂部進度條表示「流程正在推進」。兩者都可以作為全域服務，也都需要處理顯示、隱藏、延遲銷毀與重複呼叫。

讀完後，要能區分局部載入、全螢幕載入與頂部進度條的狀態模型，並理解為什麼載入元件不只是加一個動畫。

## 對照源碼

- `01-origin/source/view-ui-plus-v1.3.20/src/components/spin/spin.vue`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/spin/spin.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/spin/index.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/loading-bar/loading-bar.vue`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/loading-bar/loading-bar.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/loading-bar/index.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/modal/mixins-scrollbar.js`
- `01-origin/source/view-ui-plus-v1.3.20/types/spin.d.ts`
- `01-origin/source/view-ui-plus-v1.3.20/types/loading-bar.d.ts`
- `01-origin/source/view-ui-plus-v1.3.20/src/styles/components/spin.less`
- `01-origin/source/view-ui-plus-v1.3.20/src/styles/components/loading-bar.less`

## Spin 元件

Spin 的元件式 API：

| API | 作用 |
| --- | --- |
| `show` | 控制是否顯示 |
| `size` | `small`、`default`、`large` |
| `fix` | 是否覆蓋父容器 |
| `fullscreen` | 是否全螢幕 |
| `default` slot | 自訂載入文字或內容 |

`spin.vue` 的狀態：

| 狀態 | 用途 |
| --- | --- |
| `showText` | 判斷 default slot 是否有文字 |
| `visible` | 全域 `$Spin` 控制 fullscreen 顯示 |

`fullscreenVisible` 的邏輯很關鍵：

```txt
if fullscreen:
  render only when visible is true
else:
  render when show is true
```

也就是說，普通 Spin 用 prop `show` 控制；全域 `$Spin` 用內部 `visible` 控制。

## `$Spin` 服務

`spin/index.js` 讓 Spin 擁有兩個方法：

```txt
Spin.show(props)
Spin.hide()
```

底層流程：

```txt
Spin.show({ render })
  -> getSpinInstance(render)
  -> Spin.newInstance()
  -> createApp(...)
  -> append container to body
  -> instance.show()
  -> spin.visible = true

Spin.hide()
  -> instance.remove()
  -> spin.visible = false
  -> wait 500ms
  -> unmount and remove container
```

全螢幕 Spin 會套用 `ScrollbarMixins`。當 `visible` 變成 true，body scroll 被鎖住；變成 false 時解除。

## LoadingBar 元件

`loading-bar.vue` 的狀態：

| 狀態 | 用途 |
| --- | --- |
| `percent` | 進度寬度 |
| `status` | `success` 或 `error` |
| `show` | 是否顯示 |

props 則控制外觀：

| prop | 作用 |
| --- | --- |
| `color` | 成功狀態顏色 |
| `failedColor` | 失敗狀態顏色 |
| `height` | 進度條高度 |

渲染結構很簡單：

```txt
div.ivu-loading-bar
  div.ivu-loading-bar-inner
```

內層寬度由 `percent` 轉成 inline style。

## `$LoadingBar` 服務

`loading-bar/index.js` 對外提供：

| 方法 | 行為 |
| --- | --- |
| `start()` | 從 0 開始顯示，啟動 timer 自動推進到 95 以下 |
| `update(percent)` | 手動更新進度 |
| `finish()` | 清 timer，進度到 100，狀態 success，延遲隱藏 |
| `error()` | 清 timer，進度到 100，狀態 error，延遲隱藏 |
| `config(options)` | 設定 color、failedColor、height、duration |
| `destroy()` | 清 timer，移除全域實例 |

`start()` 的進度不是實際網路進度，而是假進度：

```txt
percent = 0
show = true
timer every 200ms:
  percent += random 1..3
  if percent > 95:
    clear timer
```

這種設計的目的不是精準，而是讓使用者知道流程尚未停住。真正完成或失敗時，再由 `finish()` 或 `error()` 收束。

## 載入狀態的三種語意

| 元件/服務 | 語意 | 常見場景 |
| --- | --- | --- |
| `<Spin>` | 某個區域正在等待 | 卡片、表格、局部內容 |
| `$Spin` | 整個頁面暫時不可操作 | 首屏載入、全頁提交 |
| `$LoadingBar` | 頁面流程正在推進 | 路由切換、請求批次、檔案處理 |

不要把三者混用。局部資料載入不應該常常鎖住整頁；路由切換也不一定需要把內容區全部遮住。

## 設計細節

幾個值得記下的細節：

- `$Spin` 是單例，同一時間只保留一個全螢幕載入實例。
- `$Spin.hide()` 會延遲 500ms 移除 DOM，配合 fade 動畫。
- LoadingBar 的 `finish()` 和 `error()` 都會先把進度補到 100，再延遲隱藏。
- `config()` 修改的是模組層級變數；如果實例已經建立，外觀設定通常要 destroy 後重建才最乾淨。
- LoadingBar 必須在 `destroy()` 和 `finish()` / `error()` 時清理 timer，避免進度繼續更新已銷毀的實例。

## 設計啟發

仿寫載入服務時，要確認：

1. 載入範圍是局部、全螢幕還是頁面頂部。
2. 是否需要鎖住 body scroll。
3. 重複呼叫 show/start 時如何處理。
4. hide/finish/error 是否有動畫延遲。
5. timer 是否會在所有收束路徑中清理。
6. 進度是真實進度，還是假進度。

## 複習題

1. Spin 的 `show` 和 `$Spin` 的 `visible` 為什麼是兩條控制線？
2. `$Spin.hide()` 為什麼要延遲 unmount？
3. LoadingBar 的 `start()` 為什麼最多推進到 95 左右？
4. `finish()` 和 `error()` 為什麼都要先把 percent 設到 100？
5. 局部 Spin、全螢幕 Spin、LoadingBar 分別適合哪些使用情境？
