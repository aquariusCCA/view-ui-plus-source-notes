# 全域服務 API 形狀

## 學習目標

這篇整理 View UI Plus 全域服務的 API 形狀。重點不是列出每個方法，而是理解服務 API 如何讓使用者在任何元件中用一致語意發起一次操作。

讀完後，要能分辨「型別相似」和「控制權相似」的差異。例如 `$Message.success()`、`$Loading.start()`、`$Modal.confirm()` 都是全域方法，但它們背後的狀態模型完全不同。

## 對照源碼

- `01-origin/source/view-ui-plus-v1.3.20/src/index.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/message/index.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/notice/index.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/loading-bar/index.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/spin/index.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/modal/index.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/copy/index.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/scroll-top/index.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/scroll-into-view/index.js`
- `01-origin/source/view-ui-plus-v1.3.20/types/index.d.ts`

## 掛載入口

`src/index.js` 在 `install(app, opts)` 裡把服務掛到 `app.config.globalProperties`：

| 全域屬性 | 來源 | 角色 |
| --- | --- | --- |
| `$Spin` | `components.Spin` | 全螢幕載入服務與局部 Spin 元件共用出口 |
| `$Loading` | `components.LoadingBar` | 頁面頂部載入條服務 |
| `$Message` | `components.Message` | 輕量提示服務 |
| `$Notice` | `components.Notice` | 右上通知服務 |
| `$Modal` | `components.Modal` | 命令式對話框服務 |
| `$ImagePreview` | `components.ImagePreview` | 命令式圖片預覽服務 |
| `$Copy` | `components.Copy` | 複製文字工具 |
| `$ScrollIntoView` | `components.ScrollIntoView` | 讓目標元素滾入可視範圍 |
| `$ScrollTop` | `components.ScrollTop` | 容器平滑滾動到指定位置 |
| `$Date` | `dayjs` | 日期工具庫快捷入口 |

這個設計讓 Options API 元件可以用 `this.$Message`，也讓使用者不必在每個業務檔案裡重複建立提示或載入元件。

## API 形狀分類

### 語意方法

Message、Notice、Modal 都提供語意方法：

```txt
$Message.success(options)
$Notice.warning(options)
$Modal.confirm(options)
```

這類 API 的好處是呼叫端不用手動傳 `type: 'success'`。缺點是每增加一種狀態，就要維護一組方法和 icon 映射。

### 狀態機方法

LoadingBar 和 Spin 更像狀態機：

```txt
$Loading.start()
$Loading.update(percent)
$Loading.finish()
$Loading.error()
$Spin.show(options)
$Spin.hide()
```

這類 API 的重點不是「顯示一則內容」，而是「一段流程從開始到結束」。因此要特別注意 timer、重複 start、finish 後 hide、hide 後 reset。

### 一次性工具函數

Copy、ScrollTop、ScrollIntoView 更接近函數：

```txt
$Copy({ text, success, error })
$ScrollTop(el, settings, callback)
$ScrollIntoView(target, settings, callback)
```

這類 API 通常不保留 Vue 實例狀態，重點是 DOM 操作、callback、預設值和 SSR guard。

## Options 設計

全域服務的 options 通常混合三種資料：

| 類型 | 例子 | 設計風險 |
| --- | --- | --- |
| 內容 | `content`、`title`、`desc`、`render` | 字串和 render function 的優先序要清楚 |
| 行為 | `duration`、`closable`、`loading`、`lockScroll` | 預設值和特殊值如 `0` 不能被錯誤覆蓋 |
| 生命週期 | `onClose`、`onOk`、`onCancel`、`onRemove` | 回呼執行時機要和 DOM 移除時機一致 |

閱讀時要特別看 `0`、`false`、空字串這些值。Notice 的 `duration === 0` 代表不自動關閉，LoadingBar 的 `duration` 則是 hide 延遲時間。

## 回傳值

不同服務的回傳值也代表控制權差異：

- `$Message.xxx()` 回傳一個關閉函數，呼叫端可以手動移除這則 message。
- `$Notice.xxx()` 不直接回傳關閉函數，而是透過 `name` 搭配 `$Notice.close(name)`。
- `$Loading` 不回傳個別實例，而是維護全域 loading bar 狀態。
- `$Spin.show()` 不回傳實例，關閉時靠 `$Spin.hide()`。
- `$Copy()` 主要透過 `success`、`error` callback 回報結果。

這些差異都來自服務的使用場景。短提示適合回傳 close handler；通知適合命名後再關閉；載入條通常是全頁唯一流程。

## 設計啟發

設計全域 API 時，應該先選 API 型態：

- 一次性提示：`success(options)`、`error(options)`。
- 流程狀態：`start()`、`update()`、`finish()`、`error()`。
- 開關狀態：`show(options)`、`hide()`。
- 可命名項目：`open({ name })`、`close(name)`。
- DOM 工具：`service(target, settings, callback)`。

不要只因為都掛在 `$` 上，就把所有服務設計成同一種方法形狀。API 形狀要反映控制權和生命週期。

## 複習題

1. `$Message` 和 `$Notice` 都是通知，為什麼關閉方式不同？
2. `$Loading.update(percent)` 和 `$Message.loading()` 的語意差在哪裡？
3. 為什麼 `$Copy` 適合是函數，而不是 `show/hide` 服務？
4. options 裡的 `render` 會讓型別設計和安全性多出哪些問題？
5. 全域服務是否應該回傳 instance？判斷標準是什麼？
