# 浮層底層機制

## 學習目標

回饋與浮層元件表面上各自不同，底層卻反覆使用同幾種機制：Teleport 改變 DOM 掛載位置、Popper 處理定位、Notification 管理全域訊息佇列、Scrollbar mixin 處理 body scroll、transfer queue 處理層級遞增、clickoutside 處理外部點擊。

這篇把這些機制抽出來看，避免只記住單一元件 API，而看不出元件庫如何復用基礎能力。

## 對照源碼

- `01-origin/source/view-ui-plus-v1.3.20/src/components/base/popper.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/base/notification/`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/modal/mixins-scrollbar.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/utils/transfer-queue.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/directives/clickoutside.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/utils/dom.js`

## Teleport / transfer

多數浮層都有 `transfer`：

```txt
<teleport to="body" :disabled="!transfer">
  ...
</teleport>
```

`transfer` 的目的不是單純「放到 body」，而是解決這些問題：

- 父元素 `overflow: hidden` 裁切浮層。
- 父元素 `transform` 或 stacking context 影響 z-index。
- 浮層需要覆蓋整個頁面，而不是只在局部容器內。
- 定位層要和 reference 保持互動，但 DOM 層級不一定要相鄰。

但 transfer 也帶來成本：

- click outside 判斷變複雜。
- class scope 和樣式覆蓋要重新考慮。
- 測試時不能只查父元件 DOM。
- 多層浮層需要更明確的 z-index 規則。

## Popper mixin

`base/popper.js` 包裝了 `popper.js`：

```txt
reference + popper + placement + options
  -> new Popper(reference, popper, options)
```

它提供：

| 能力 | 說明 |
| --- | --- |
| `visible` | 從 `modelValue` 派生的內部顯示狀態 |
| `createPopper()` | 建立 Popper.js 實例 |
| `updatePopper()` | 更新定位，必要時建立實例 |
| `doDestroy()` | 關閉後銷毀 Popper |
| `created` event | Popper 建立後通知 |
| `on-popper-show` / `on-popper-hide` | visible 變化通知 |

Popper mixin 的重要取捨是：把定位能力放在共用層，把 trigger 行為留給元件。例如 Tooltip 負責 hover delay，Poptip 負責 click/focus/confirm，但兩者都不自己算定位。

## Notification base

`base/notification` 是 Message 和 Notice 的共用底座。

核心流程：

```txt
Notification.newInstance()
  -> createApp()
  -> append container to body
  -> mount notification.vue
  -> expose notice/remove/destroy
```

`notification.vue` 負責管理 `notices` 陣列：

```txt
add(notice)
  -> notices.push(notice)

close(name)
  -> find notice by name
  -> notices.splice(index, 1)

closeAll()
  -> notices = []
```

`notice.vue` 負責單則通知：

```txt
mounted
  -> if duration !== 0:
       set closeTimer

close
  -> clear timer
  -> onClose()
  -> parent.close(name)
```

這種拆分讓 Message 和 Notice 只需要決定內容樣式、預設 duration、位置和快捷方法。

## Scrollbar mixin

`modal/mixins-scrollbar.js` 被 Modal、Drawer、Spin 使用。它處理 body scroll 的副作用：

```txt
addScrollEffect()
  -> checkScrollBar()
  -> set body paddingRight
  -> body overflow = hidden

removeScrollEffect()
  -> if no visible mask
       body overflow = ''
       reset paddingRight
```

`paddingRight` 補償很重要。當頁面有垂直 scrollbar 時，直接設定 `overflow: hidden` 會讓 scrollbar 消失，內容寬度變大，頁面產生水平跳動。補上 scrollbar 寬度可以讓布局保持穩定。

要注意 `checkMaskInVisible()` 目前檢查的是 `ivu-modal-mask`。Drawer 自己另外在關閉時檢查 `$root.drawerList`，避免多 Drawer 場景過早解除 scroll lock。

## transfer queue

`utils/transfer-queue.js` 很小：

```txt
let transferIndex = 0
let lastVisibleIndex = 0

transferIncrease()
lastVisibleIncrease()
```

它的用途是提供遞增序號：

- Tooltip / Poptip transfer 後用 `1060 + tIndex`。
- Message / Notice 的 Notification 用 `1010 + tIndex`。
- Spin fullscreen 用 `2010 + tIndex`。
- Modal 用 `modalIndex + zIndex`，也用 `lastVisibleIndex` 判斷點擊後層級。

這不是完整的 z-index manager，但足以讓「後開啟的浮層」大多蓋在「先開啟的浮層」之上。

## clickoutside 指令

`clickoutside` 的核心是：

```txt
document.addEventListener('click', handler)

if el.contains(e.target):
  return
binding.value(e)
```

它適合 Poptip、Dropdown、Select 這類點外部關閉的元件。使用時要注意：

- transfer 後 popper 不在原 el 裡，可能需要額外 guard。
- nested popup 可能互相觸發外部點擊。
- unmounted 必須移除 document listener。
- 如果需要 capture，要明確設計事件階段。

## 設計啟發

這些基礎機制可以抽成一張檢查表：

| 問題 | 機制 |
| --- | --- |
| 浮層會被父層裁切嗎？ | `Teleport` / `transfer` |
| 浮層要跟著 reference 定位嗎？ | Popper |
| 是否是命令式全域服務？ | `createApp` + singleton |
| 是否需要訊息佇列？ | Notification base |
| 是否會鎖住頁面？ | Scrollbar mixin |
| 多層浮層誰在上面？ | transfer queue |
| 點外部要關閉嗎？ | clickoutside |

## 複習題

1. `transfer` 解決了哪些 CSS 層級問題，又帶來哪些事件問題？
2. Popper mixin 為什麼不處理 hover、click、focus？
3. Notification base 如何讓 Message 和 Notice 共用大部分生命週期？
4. 鎖 body scroll 時為什麼要補 `paddingRight`？
5. `transfer-queue` 為什麼是遞增序號，而不是固定 z-index？
