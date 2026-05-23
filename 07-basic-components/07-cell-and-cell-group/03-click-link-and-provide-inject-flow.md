# Cell Click Link And Provide Inject Flow：點擊、父子通訊與導頁

## 0. 原始筆記問題分析

原本筆記已經指出要整理 provide/inject 與 link 行為，但還沒有把一次 click 裡發生的兩條路徑拆清楚：

1. 回報 `name` 給 `CellGroup`，讓外部收到 `on-click`。
2. 如果 `to` 存在，再交給 `mixins/link.js` 處理 navigation。

這兩件事不是二選一。對有 `to` 的 `Cell` 來說，同一次點擊會先通知 group，再處理導頁。

## 1. 本章定位

本章是一篇事件流程筆記，專門分析 `Cell` 點擊時如何透過 provide/inject 回到 `CellGroup`，以及 link mixin 如何接手 router / window navigation。

本章不深入講 DOM 結構與 CSS positioning。那些內容請看 `04-render-style-arrow-and-global-config.md`。

## 2. Parent / Child Wiring

`CellGroup` 透過 provide 暴露自己：

```js
provide () {
    return {
        CellGroupInstance: this
    }
}
```

`Cell` 透過 inject 取得父層 instance：

```js
inject: ['CellGroupInstance']
```

因此 `Cell` 不需要透過 Vue 原生事件一路 emit 到父層，而是直接呼叫：

```js
this.CellGroupInstance.handleClick(this.name);
```

這是一種很直接的父子通訊方式：子元件知道父層提供的 API 名稱，父層負責再轉成 public event。

## 3. `CellGroup` Event Flow

`CellGroup` 的方法只有一個：

```js
handleClick (name) {
    this.$emit('on-click', name);
}
```

整理成流程：

```txt
Cell 被點擊
  -> Cell.handleClickItem(event, new_window)
  -> CellGroupInstance.handleClick(Cell.name)
  -> CellGroup emit on-click(name)
  -> 使用者的 @on-click handler 收到 name
```

這個流程裡，`CellGroup` 不知道是哪個 DOM event，也不接收整個 `Cell` instance，只接收 `name`。

## 4. `Cell` Click Binding

`Cell` template 依照 `to` 分成兩個 branch。

有 `to` 時：

```vue
<a
    v-if="to"
    :href="linkUrl"
    :target="target"
    class="ivu-cell-link"
    @click.exact="handleClickItem($event, false)"
    @click.ctrl="handleClickItem($event, true)"
    @click.meta="handleClickItem($event, true)">
```

沒有 `to` 時：

```vue
<div class="ivu-cell-link" v-else @click="handleClickItem">
```

差異整理如下。

| 條件 | Wrapper | Click binding | Navigation |
| --- | --- | --- | --- |
| 有 `to` | `<a>` | exact / ctrl / meta 三種 click 修飾 | 會進入 `handleCheckClick()`。 |
| 無 `to` | `<div>` | 一般 `@click` | `handleCheckClick()` 會因沒有 `to` 而不導頁。 |

兩個 branch 都會呼叫同一個 `handleClickItem()`，所以 group click 的流程一致。

## 5. `handleClickItem()` 時序

`Cell` 的 click handler 是：

```js
handleClickItem (event, new_window) {
    this.CellGroupInstance.handleClick(this.name);
    this.handleCheckClick(event, new_window);
}
```

時序非常重要：

```txt
1. 先通知 CellGroup：on-click(name)
2. 再處理 link navigation：handleCheckClick(event, new_window)
```

這代表即使 `Cell` 會導頁，group 的 `on-click` 仍會先被觸發。外部如果在 `on-click` 裡做 logging、埋點或選中狀態同步，會早於 navigation 執行。

## 6. `disabled` Boundary

`handleClickItem()` 沒有檢查 `disabled`：

```js
handleClickItem (event, new_window) {
    this.CellGroupInstance.handleClick(this.name);
    this.handleCheckClick(event, new_window);
}
```

所以：

| 情境 | Runtime 結果 |
| --- | --- |
| `<Cell disabled name="a" />` 被點擊 | 仍會呼叫 `CellGroupInstance.handleClick('a')`。 |
| `<Cell disabled to="/button" />` 被點擊 | 仍會進入 link navigation。 |
| `disabled` 的直接效果 | 只有 `ivu-cell-disabled` class 與樣式。 |

這是 `Cell` 最容易誤判的地方之一。`disabled` 在這裡是視覺狀態，不是行為 guard。

## 7. Link Mixin Entry

`Cell` 使用：

```js
mixins: [ mixinsLink, globalConfig ]
```

點擊時實際進入 link mixin 的方法是：

```js
handleCheckClick (event, new_window = false) {
    if (this.to) {
        if (this.target === '_blank') {
            this.handleOpenTo();
            return false;
        } else {
            event.preventDefault();
            this.handleClick(new_window);
        }
    }
}
```

規則可以整理成：

```txt
沒有 to
  -> 不做 navigation
有 to 且 target === '_blank'
  -> handleOpenTo()
有 to 且 target !== '_blank'
  -> preventDefault()
  -> handleClick(new_window)
```

## 8. `linkUrl` 與 `<a href>`

有 `to` 時，`Cell` 會把 `href` 設成 `linkUrl`：

```js
linkUrl () {
    const type = typeof this.to;
    if (type !== 'string') {
        return null;
    }
    if (this.to.includes('//')) {
        return this.to;
    }
    const router = this.$router;
    if (router) {
        const current = this.$route;
        const route = router.resolve(this.to, current, this.append);
        return route ? route.href : this.to;
    }
    return this.to;
}
```

整理成表格：

| `to` | router 是否存在 | `linkUrl` |
| --- | --- | --- |
| object | 任意 | `null`。 |
| absolute string，包含 `//` | 任意 | 原始 URL。 |
| route string | 有 router | `router.resolve(...).href` 或原始 `to`。 |
| route string | 無 router | 原始 `to`。 |

`linkUrl` 只決定 `<a href>`，真正的 click navigation 仍由 `handleCheckClick()` 接管。

## 9. Normal Click Navigation

`target !== '_blank'` 且有 `to` 時，`handleCheckClick()` 會：

```js
event.preventDefault();
this.handleClick(new_window);
```

`handleClick()` 的主要規則：

```js
if (new_window) {
    this.handleOpenTo();
} else {
    if (router) {
        if ((typeof this.to === 'string') && this.to.includes('//')) {
            window.location.href = this.to;
        } else {
            this.replace ? this.$router.replace(this.to, () => {}) : this.$router.push(this.to, () => {});
        }
    } else {
        window.location.href = this.to;
    }
}
```

整理成：

| 條件 | 結果 |
| --- | --- |
| `new_window=true` | 呼叫 `handleOpenTo()`。 |
| 有 router，且 `to` 是 absolute URL | `window.location.href = to`。 |
| 有 router，且不是 absolute URL，`replace=false` | `router.push(to)`。 |
| 有 router，且不是 absolute URL，`replace=true` | `router.replace(to)`。 |
| 無 router | `window.location.href = to`。 |

## 10. Ctrl / Meta Click

有 `to` 的 `<a>` branch 綁定：

```vue
@click.ctrl="handleClickItem($event, true)"
@click.meta="handleClickItem($event, true)"
```

所以使用者按住 Ctrl 或 Meta 點擊時，`new_window` 會是 `true`，最後交給：

```js
handleOpenTo()
```

`handleOpenTo()` 會先用 router resolve object / route string，再用：

```js
window.open(to);
```

但有一個細節：如果 `this.to` 是 string，`handleOpenTo()` 裡會提前 return，註解提到避免跳轉兩次。因此 object route 與 string route 的新視窗行為需要回到 source 逐段確認，不能只靠直覺理解 `<a>`。

## 11. `target="_blank"`

`target="_blank"` 由 `handleCheckClick()` 優先處理：

```js
if (this.target === '_blank') {
    this.handleOpenTo();
    return false;
}
```

這段不會呼叫 `event.preventDefault()`。同時 `<a>` 本身也帶著：

```vue
:target="target"
```

所以 `_blank` 的實際瀏覽器行為與 `handleOpenTo()` 可能一起影響結果。閱讀這段時要注意 source 裡的註解：

```js
if (typeof this.to === 'string') return; // 會跳轉兩次 // todo Vue3这里不跳2次，待验证
```

這說明作者知道 `<a>` 預設行為和手動 `window.open()` 之間有重複風險。

## 12. SSR / Client Boundary

`link.js` 透過：

```js
import { isClient } from '../utils/index';
```

在 navigation 方法裡先檢查：

```js
if (!isClient) return;
```

所以導頁行為只在 client environment 執行。這是 link mixin 的共用邊界，`Cell` 本身沒有另外處理 SSR。

## 13. Flow Summary

可以把一次 click 壓縮成：

```txt
點擊 Cell
  -> handleClickItem(event, new_window)
      -> CellGroupInstance.handleClick(name)
          -> CellGroup emit on-click(name)
      -> handleCheckClick(event, new_window)
          -> if no to: stop
          -> if target _blank: handleOpenTo()
          -> else: preventDefault + handleClick(new_window)
```

這條流程也說明了三個邊界：

1. `on-click` 不代表 navigation 已完成，只代表點擊已被 group 收到。
2. `disabled` 不在流程中做 guard。
3. `Cell` 的 navigation 行為和 `Button` 等使用同一個 link mixin 的元件有共通設計。

## 14. 本章總結

`Cell` 的 click flow 同時包含 group event 與 link navigation。父子通訊靠 provide/inject，對外事件由 `CellGroup` emit；導頁靠 `mixins/link.js`，依照 `to`、`target`、`replace`、`append`、router 與 ctrl/meta click 分支處理。

讀這段 source 時，最重要的是不要把 `disabled` 視為行為鎖，也不要把 `on-click` 和 navigation 視為互斥流程。

## 15. 自我檢查問題

1. `Cell` 點擊時為什麼可以直接呼叫 `CellGroupInstance.handleClick()`？
2. `handleClickItem()` 裡 group emit 和 link navigation 的順序是什麼？
3. `disabled` 被點擊時 runtime 會不會中止 `handleClickItem()`？
4. 有 `to` 時，`Cell` 為什麼同時需要 `<a href>` 和 `handleCheckClick()`？
5. `target="_blank"` 與 ctrl/meta click 分別如何影響 `new_window` 或 `handleOpenTo()`？
6. `replace` 在哪個條件下才會影響 navigation？
7. `to` 是 absolute URL 且存在 router 時，runtime 會走 router 還是 `window.location.href`？
