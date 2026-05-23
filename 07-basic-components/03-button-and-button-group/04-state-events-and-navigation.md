# Button State Events And Navigation：loading、disabled、click 與跳轉流程

## 0. 原始筆記問題分析

原本筆記已經把 click、disabled、loading、link/navigation 列為閱讀重點，但還沒有把它們的流程串起來。`Button` 的事件行為不只在 `button.vue` 裡，也依賴 `mixins/link.js` 與 `mixins/form.js`。

本章會把狀態與事件分成四條線：

```txt
loading
disabled / Form disabled
click emit
to / router / target navigation
```

## 1. 本章定位

本章是一篇互動行為筆記，專門分析 `Button` 如何處理 loading、disabled、click 與 link navigation。

本章不重複整理所有 props，也不深入 group 樣式。props contract 請看 `02-public-props-contract.md`，group 與 less 請看 `05-button-group-and-style-system.md`。

## 2. Loading 狀態

`loading` 是 `Boolean` prop。它同時影響三件事。

第一，class 會加上：

```txt
ivu-btn-loading
```

第二，children 會優先渲染 loading icon：

```js
h(Icon, {
    class: 'ivu-load-loop',
    type: 'ios-loading'
})
```

第三，樣式層會讓 loading button 進入特殊 pointer 狀態。`button.less` 中：

```less
&&-loading {
    pointer-events: none;
    position: relative;

    &:before {
        display: block;
    }
}
```

`&:before` 是一層半透明 overlay，`pointer-events: none` 則避免 loading 狀態下繼續觸發互動。

`button.spec.js` 中也驗證了 loading 行為：click 後外部把 `loading` 改成 true，下一個 tick 中應該出現 `ivu-btn-loading`，並且只渲染一個 `ios-loading` icon。

## 3. Disabled 狀態與 Form disabled

`Button` render 時不是直接使用 `this.disabled`，而是使用：

```js
disabled: this.itemDisabled
```

`itemDisabled` 來自 `mixins/form.js`：

```js
itemDisabled () {
    let state = this.disabled;
    if (!state && this.FormInstance) state = this.FormInstance.disabled;
    return state ? true : null;
}
```

它的判斷順序是：

```txt
Button disabled prop
  -> 若自己不是 disabled，再看 FormInstance.disabled
  -> true 或 null
```

回傳 `null` 的目的，是避免在 DOM 上產生 `disabled="false"` 這種 attribute。對 HTML attribute 來說，很多布林屬性的「存在」本身就有語意，因此這裡不回傳 false。

需要注意的是，`<button disabled>` 有原生禁用語意，但 `<a disabled>` 不是標準 HTML anchor 禁用能力。View UI Plus 仍會把 `disabled` attribute 與 disabled 樣式套到 `<a class="ivu-btn">` 上，但閱讀時不要把它完全等同於原生 button 的 disabled 行為。runtime 的 click handler 本身沒有再做 `if (this.itemDisabled) return` 這種分支。

## 4. Click handler 的順序

`Button` 的 click handler 是：

```js
handleClickLink (event) {
    this.$emit('click', event);
    const openInNewWindow = event.ctrlKey || event.metaKey;

    this.handleCheckClick(event, openInNewWindow);
}
```

這裡的順序很重要。

```txt
DOM click
  -> emit click 給使用者
  -> 判斷 Ctrl / Cmd click
  -> 交給 link mixin 檢查是否需要 navigation
```

也就是說，`Button` 會先把 click event 交給外部使用者，再處理 `to` 造成的跳轉。這讓使用者即使在 link button 上也能收到 click event。

`openInNewWindow` 來自：

```js
event.ctrlKey || event.metaKey
```

這是模擬瀏覽器中 Ctrl / Cmd + click 開新視窗的習慣。

## 5. Link navigation 的來源

`Button` 自己不完整實作 navigation，而是呼叫 `mixins/link.js` 的：

```js
this.handleCheckClick(event, openInNewWindow);
```

`handleCheckClick()` 的核心流程是：

```txt
如果沒有 to
  -> 不處理 navigation

如果 target 是 _blank
  -> handleOpenTo()
  -> return false

其他情況
  -> event.preventDefault()
  -> handleClick(new_window)
```

因此 `to` 是 navigation 是否啟動的關鍵。

## 6. `linkUrl` 與 `href`

`linkUrl` 來自 `mixins/link.js`，負責計算 `<a>` 的 `href`。

規則可以整理成：

```txt
to 不是 string
  -> linkUrl = null

to 是 absolute URL，包含 //
  -> linkUrl = to

有 router
  -> router.resolve(to, current, append).href

沒有 router
  -> linkUrl = to
```

所以對 route object 來說，`Button` 仍會渲染成 `<a>`，但 `href` 可能是 `null`；真正跳轉會在 click 時交給 `handleClick()` / router。

## 7. `handleClick()` 的跳轉策略

`mixins/link.js` 中的 `handleClick(new_window)` 負責實際跳轉。

| 條件 | 行為 |
| --- | --- |
| 非瀏覽器環境 | `isClient` guard，直接 return。 |
| `new_window` 為 true | 呼叫 `handleOpenTo()`。 |
| 有 router 且 `to` 是 absolute URL | `window.location.href = this.to`。 |
| 有 router 且 `to` 是 route location | `router.replace()` 或 `router.push()`。 |
| 沒有 router | `window.location.href = this.to`。 |

`replace` prop 只在 router navigation 時有主要意義。它決定使用 `router.replace()` 還是 `router.push()`。

## 8. `target="_blank"` 與 Ctrl / Cmd click

有兩種情境會走新視窗邏輯。

第一，使用者傳入：

```vue
<Button to="/icon" target="_blank">Open</Button>
```

`handleCheckClick()` 會因 `target === '_blank'` 呼叫 `handleOpenTo()`。

第二，使用者在 link button 上 Ctrl / Cmd + click。

```txt
event.ctrlKey || event.metaKey
  -> openInNewWindow = true
  -> handleClick(true)
  -> handleOpenTo()
```

這讓自定義 `Button` 的互動更接近原生 `<a>` 的使用習慣。

## 9. 官方測試對應

`button.spec.js` 驗證了幾個與本章直接相關的行為。

| 測試 | 對應理解 |
| --- | --- |
| `should render as <a>` | 只要有 `to`，`Button` 應輸出 anchor。 |
| `should render as <button>` | 沒有 `to` 時，`Button` 應輸出 button。 |
| `handle with type attribute` | `htmlType` 只應用在 `<button>`，link button 不輸出 type attribute。 |
| `should change loading state` | click 可以觸發外部 handler 改變 loading，render 應切換到 loading class 與 loading icon。 |

測試沒有完整覆蓋所有 navigation 分支，例如 router object、`target="_blank"`、Ctrl / Cmd click，但它保護了最核心的 tag 與 loading 行為。

## 10. 常見誤區

| 誤區 | 正確理解 |
| --- | --- |
| `loading` 只是 disabled 的另一種寫法 | loading 有自己的 class、icon 與 overlay，不等於 disabled。 |
| `disabled` 只看 `Button` 自己的 prop | `itemDisabled` 也會看上層 `FormInstance.disabled`。 |
| `Button` click 只負責 emit | click 會先 emit，再處理 link navigation。 |
| 有 `to` 時仍是原生 button | 有 `to` 時會渲染成 `<a>`。 |
| route object 一定會直接生成 href | `linkUrl` 對非 string `to` 會回傳 null，click 時再走 router。 |
| `target="_blank"` 和 Ctrl / Cmd click 完全無關 | 兩者都可能導向 `handleOpenTo()`。 |

## 11. 本章總結

`Button` 的互動行為由自身 runtime 和兩個 mixin 共同完成。`button.vue` 負責 emit click、判斷 Ctrl / Cmd click，並把 navigation 交給 `handleCheckClick()`；`mixins/link.js` 負責 `to`、`target`、router、window navigation；`mixins/form.js` 負責把自身 disabled 與 Form disabled 合併成 `itemDisabled`。

理解這一章後，`Button` 就不再只是「有很多樣式的按鈕」，而是一個把操作、連結、表單上下文與視覺狀態整合起來的基礎元件。

## 12. 自我檢查問題

1. `loading` 會同時改變哪些輸出？
2. `itemDisabled` 的判斷順序是什麼？
3. `handleClickLink()` 為什麼要先 emit click？
4. Ctrl / Cmd click 在 `Button` 中如何被處理？
5. `target="_blank"` 會導向哪個方法？
6. `linkUrl` 對 route object 為什麼可能是 null？
7. `replace` prop 在什麼情境下有主要作用？
8. 為什麼不能把 `<a disabled>` 完全等同於 `<button disabled>`？
