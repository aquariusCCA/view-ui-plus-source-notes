# Link Navigation Mixin：讓元件共用可跳轉能力

## 1. 本章定位

本篇分析 `src/mixins/link.js`。

這個 mixin 讓多種元件共享「可以像連結一樣跳轉」的能力。例如：

```txt
Button
MenuItem
Cell
Card
BreadcrumbItem
Auth
Typography props
```

它的重點不是路由系統本身，而是 UI component library 如何把「連結行為」抽成共用能力。

---

## 2. Source 位置

核心檔案：

```txt
01-origin/source/view-ui-plus-v1.3.20/src/mixins/link.js
```

典型使用檔案：

```txt
src/components/button/button.vue
src/components/menu/menu-item.vue
src/components/cell/cell.vue
src/components/breadcrumb/breadcrumb-item.vue
src/components/card/card.vue
```

---

## 3. Mixin 對外提供的 props

`link.js` 宣告：

```js
props: {
    to: {
        type: [ Object, String ]
    },
    replace: {
        type: Boolean,
        default: false
    },
    target: {
        type: String,
        validator (value) {
            return oneOf(value, ['_blank', '_self', '_parent', '_top']);
        },
        default: '_self'
    },
    append: {
        type: Boolean,
        required: false,
        default: false,
    }
}
```

這代表任何混入 `link.js` 的元件都會得到這組 public API。

| Prop | 說明 |
| --- | --- |
| `to` | 目標位置，可是字串或 route object。 |
| `replace` | 使用 router replace 而不是 push。 |
| `target` | HTML link target，只允許 `_blank`、`_self`、`_parent`、`_top`。 |
| `append` | 傳給 router resolve，用於相對路由附加。 |

這是 mixin 的一個重要特性：它不只復用內部邏輯，也會擴充元件的對外 props。

---

## 4. `linkUrl`：決定 href

`linkUrl` 是 computed：

```txt
如果 to 不是 string
  -> 回傳 null

如果 to 是 absolute URL
  -> 直接回傳 to

如果有 this.$router
  -> router.resolve(to, current, append).href

否則
  -> 回傳 to
```

這讓元件在渲染 `<a>` 時可以設定 `href`。

以 Button 為例：

```js
tagProps () {
    const { isHrefPattern } = this;
    if (isHrefPattern) {
        const { linkUrl, target } = this;
        return { href: linkUrl, target };
    } else {
        const { htmlType } = this;
        return { type: htmlType };
    }
}
```

當 Button 有 `to` 時，它會渲染成 `<a>`，並使用 mixin 計算出的 `linkUrl`。

---

## 5. Click 行為的三層處理

`link.js` 的 click 行為可以拆成三層：

```txt
handleCheckClick(event, new_window)
  -> 判斷 target / 是否 preventDefault
  -> handleClick(new_window)
    -> router push / replace
    -> window.location.href
    -> handleOpenTo()
      -> window.open()
```

### 5.1 `handleCheckClick()`

這是最常由元件 click handler 呼叫的方法。

它負責：

1. 沒有 `to` 時不處理。
2. `target === '_blank'` 時呼叫 `handleOpenTo()`。
3. 否則 `event.preventDefault()`，再交給 `handleClick()`。

### 5.2 `handleClick()`

這是實際導向邏輯。

| 條件 | 行為 |
| --- | --- |
| `new_window` 為 true | 呼叫 `handleOpenTo()`。 |
| 有 router 且 `to` 是 absolute URL | `window.location.href = to`。 |
| 有 router 且是 route location | `router.push()` 或 `router.replace()`。 |
| 沒有 router | `window.location.href = to`。 |

### 5.3 `handleOpenTo()`

這用於新視窗開啟。若有 router，會先 resolve route href，再 `window.open(to)`。

---

## 6. Client boundary

`link.js` 會先檢查：

```js
if (!isClient) return;
```

這代表跳轉行為只會在瀏覽器端執行。因為 `window.open()`、`window.location.href` 這些 API 在 SSR 或非瀏覽器環境不存在。

這也是 UI library 的共用邏輯常見模式：

```txt
computed 可以先準備資料
真正操作 window/document 時必須 guard
```

---

## 7. 以 Button 為例看使用方式

`Button` 使用：

```js
mixins: [ mixinsLink, mixinsForm ]
```

並在 click 時：

```js
handleClickLink (event) {
    this.$emit('click', event);
    const openInNewWindow = event.ctrlKey || event.metaKey;
    this.handleCheckClick(event, openInNewWindow);
}
```

這裡把 Ctrl / Cmd click 視為新視窗開啟。這是把 HTML anchor 的使用習慣搬到自定義元件上。

---

## 8. 設計意義

`link.js` 讓多種元件共享同一套 navigation API。

如果沒有這個 mixin，Button、MenuItem、Cell、BreadcrumbItem 可能都要各自實作：

```txt
to prop
target prop
router resolve
router push / replace
absolute URL 判斷
new window behavior
client guard
```

用 mixin 集中後，可以確保 API 與行為一致。

---

## 9. 讀碼提醒

讀任何元件時，只要看到：

```js
mixins: [ mixinsLink ]
```

就要補上：

```txt
這個元件可能不是純展示元件
它可能因為 to prop 變成可跳轉元件
它的 click 可能被 router 或 window.location 接管
```

同時要注意 `to` 是 mixin 加進來的 public prop，不一定會出現在元件本體的 `props` 區塊。

---

## 10. 本章結論

`link.js` 是 View UI Plus 將「元件可跳轉能力」抽成 mixin 的典型案例。

它不是單純包一個 `<router-link>`，而是同時支援：

```txt
普通 href
vue-router route resolve
router push / replace
absolute URL
target blank
Ctrl / Cmd click
client-only guard
```

理解這個 mixin 後，再讀 Button、Menu、Cell、Breadcrumb 時，就能看出它們其實共享同一套 navigation contract。
