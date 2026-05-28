# Modal 與 Confirm 服務

## 學習目標

Modal 是本章最完整的模態浮層案例。它同時處理 `v-model`、遮罩、關閉按鈕、Esc、點擊遮罩、頁面滾動鎖定、拖拽、全螢幕、slot、自訂 render、z-index 與非同步關閉。

Confirm 服務則展示另一條路線：不讓使用者在模板中寫元件，而是透過 `Modal.confirm()`、`Modal.info()` 等方法動態建立 Vue app，掛載到 `document.body`，再把按鈕回調、內容和圖示塞進同一個 Modal。

## 對照源碼

- `01-origin/source/view-ui-plus-v1.3.20/src/components/modal/modal.vue`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/modal/index.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/modal/confirm.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/modal/mixins-scrollbar.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/utils/transfer-queue.js`
- `01-origin/source/view-ui-plus-v1.3.20/types/modal.d.ts`
- `01-origin/source/view-ui-plus-v1.3.20/src/styles/components/modal.less`

## 兩種使用形態

| 形態 | 入口 | 適合場景 | 狀態來源 |
| --- | --- | --- | --- |
| 元件式 Modal | `<Modal v-model="visible">` | 表單彈窗、複雜內容、需要外部狀態控制 | 外部 `modelValue` + 內部 `visible` |
| 服務式 Confirm | `Modal.confirm(options)` | 一次性確認、資訊提示、刪除確認 | 服務實例內部 data |

元件式 API 的重點是可組合，服務式 API 的重點是快速觸發。兩者共用 `modal.vue`，但生命週期和關閉語意不同。

## Modal 狀態模型

`modal.vue` 中最重要的狀態：

| 狀態 | 用途 |
| --- | --- |
| `visible` | 真正控制 Modal 與 mask 是否顯示 |
| `wrapShow` | 控制外層 wrap 是否保留，讓關閉動畫有時間完成 |
| `buttonLoading` | 確定按鈕 loading，和 prop `loading` 分離 |
| `modalIndex` | 疊加 z-index，並支援 Esc 關閉最上層 Modal |
| `dragData` | 拖拽位置、初始座標、是否 dragging |
| `showHead` | 根據 `title` 或 `header` slot 決定是否渲染 header |
| `tableList` / `sliderList` | 通知內部 Table、Slider 可見性改變，讓它們重新計算布局 |

可以把 Modal 的可見狀態畫成：

```txt
modelValue
  -> visible
  -> wrapShow
  -> mask/content transition
  -> on-visible-change
  -> on-hidden
```

`visible` 變成 `false` 時，元件不會立刻移除 wrap，而是延遲 300ms 後把 `wrapShow` 設回 `false`，並解除 scroll lock。這是因為浮層需要保留 DOM 讓離場動畫完成。

## 關閉入口

Modal 有多個關閉入口：

| 入口 | 方法 | 是否走 `beforeClose` | 事件 |
| --- | --- | --- | --- |
| 右上角 close | `close()` | 是 | `on-cancel` |
| 取消按鈕 | `cancel()` -> `close()` | 是 | `on-cancel` |
| 點擊 mask | `handleMask()` -> `close()` | 是 | `on-cancel` |
| Esc | `EscClose()` -> top modal `close()` | 是 | `on-cancel` |
| 確定按鈕 | `ok()` | 否 | `on-ok` |

`beforeClose` 只包住取消類關閉入口。確定按鈕的非同步語意由 `loading` 與外部手動關閉處理。

## `loading` 與 `buttonLoading`

`loading` 是外部傳入的「確定按鈕是否進入非同步模式」。當使用者點擊 ok：

```txt
if loading:
  buttonLoading = true
  emit on-ok
else:
  visible = false
  emit update:modelValue(false)
  emit on-ok
```

這表示 `loading` 不是「目前正在 loading」的狀態，而是「ok 之後不要自動關閉」的模式開關。真正讓按鈕轉圈的是內部 `buttonLoading`。

這個設計讓表單提交彈窗可以這樣運作：

```txt
點擊確定
  -> buttonLoading = true
  -> 外部執行 async submit
  -> 外部把 v-model 設成 false 或 loading 設回 false
```

## 遮罩、transfer 與滾動鎖定

Modal 使用：

- `<teleport to="body" :disabled="!transfer">` 控制是否掛到 body。
- `mask` 控制是否渲染遮罩。
- `maskClosable` 控制點遮罩是否關閉。
- `ScrollbarMixins` 控制 body `overflow` 與 `paddingRight`。

`scrollable` 的命名容易誤解。當 `scrollable` 為 `false` 時，Modal 開啟會鎖住頁面滾動；當它為 `true` 時，頁面可以繼續滾動。

滾動鎖定流程：

```txt
visible = true
  -> addScrollEffect()
  -> check body 是否有 scrollbar
  -> body paddingRight = scrollbar width
  -> body overflow = hidden

visible = false
  -> removeScrollEffect()
  -> 若沒有可見 mask
  -> body overflow = ''
  -> body paddingRight = ''
```

這段邏輯的教學重點是：鎖 body scroll 不是只設 `overflow: hidden`，還要處理 scrollbar 消失造成的頁面水平跳動。

## z-index 與 Esc

Modal 從 `transfer-queue` 取得遞增的 `modalIndex`，並用 `modalIndex + zIndex` 算出 wrap 和 mask 的層級。

Esc 關閉時，Modal 不是關閉當前元件，而是：

1. 從 `$root.modalList` 找出可見且可關閉的 Modal。
2. 依 `modalIndex` 排序。
3. 關閉最上層 Modal。

這解決了多個 Modal 疊加時，按 Esc 應該只關閉最上面那個的問題。

## 拖拽設計

`draggable` 只在非 fullscreen 時生效。拖拽起點在 header：

```txt
mousedown header
  -> 記錄 content rect 和 mouse position
  -> window mousemove 更新 dragData.x/y
  -> window mouseup 停止 dragging
```

`sticky` 和 `stickyDistance` 會讓 Modal 接近視窗邊緣時吸附。`resetDragPosition` 則讓每次重新打開時重置拖拽位置。

拖拽的實作重點是全域事件要在結束時移除，否則會造成滑鼠狀態洩漏。

## Confirm 服務

`confirm.js` 透過 `createApp` 動態建立一個只有 Confirm 內容的 Vue app：

```txt
Modal.confirm(options)
  -> getModalInstance(render, lockScroll)
  -> Modal.newInstance()
  -> document.body.appendChild(container)
  -> Instance.mount(container)
  -> instance.show(options)
```

Confirm 服務有五種快捷方法：

| 方法 | icon | showCancel |
| --- | --- | --- |
| `Modal.info()` | `info` | false |
| `Modal.success()` | `success` | false |
| `Modal.warning()` | `warning` | false |
| `Modal.error()` | `error` | false |
| `Modal.confirm()` | `confirm` | true |

Confirm 的 `loading` 語意和元件式 Modal 類似：點擊確定後按鈕進入 loading，但不會自動移除，需要使用者在非同步完成後呼叫 `Modal.remove()`。

## 設計啟發

仿寫 Modal 時，要先回答這幾個問題：

1. 顯示狀態是否外部可控？如果可控，用 `v-model`。
2. 關閉能否被阻止？如果可以，提供 `beforeClose` 或 promise。
3. 確定按鈕是否需要非同步模式？如果需要，區分「模式開關」和「實際 loading 狀態」。
4. 是否會影響 body scroll？如果會，要處理 scrollbar 補償。
5. 多個浮層疊加時，誰是最上層？Esc 關閉誰？
6. 服務式 API 是否需要單例、destroy 與手動 remove？

## 複習題

1. `visible` 和 `wrapShow` 為什麼不能合併？
2. `loading` 和 `buttonLoading` 的語意差異是什麼？
3. Modal 點擊確定為什麼不走 `beforeClose`？
4. Confirm 服務為什麼要用 `createApp` 而不是直接渲染一個普通元件？
5. 多個 Modal 同時存在時，Esc 關閉最上層是如何實現的？
