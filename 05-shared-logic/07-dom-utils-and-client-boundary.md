# DOM Utils and Client Boundary：DOM 工具與瀏覽器邊界

## 1. 本章定位

本篇整理 View UI Plus 中與 DOM、瀏覽器 API、client-only guard 有關的共用邏輯。

主要來源：

```txt
src/utils/index.js
src/utils/canUseDom.js
src/utils/dom.js
src/utils/assist.js
src/utils/styleCheck.js
```

UI library 會頻繁碰到 `window`、`document`、event listener、style、class、download、scroll 等瀏覽器能力。這些能力不能直接在所有環境執行，因此需要 client boundary。

---

## 2. `isClient`：最小 client 判斷

`src/utils/index.js` 只有一行：

```js
export const isClient = typeof window !== 'undefined'
```

它用於避免在非瀏覽器環境直接存取 `window`。

常見使用場景：

```txt
link.js
  -> window.open / window.location.href

modal.vue
  -> document.addEventListener

affix.vue / anchor.vue / back-top.vue
  -> window scroll / document

loading-bar.js / spin.js
  -> 命令式掛載 UI
```

---

## 3. `canUseDom()`：更完整的 DOM 判斷

`src/utils/canUseDom.js`：

```js
function canUseDom() {
    return !!(typeof window !== 'undefined' && window.document && window.document.createElement);
}
```

它比 `isClient` 更嚴格，除了 `window`，還要求：

```txt
window.document
window.document.createElement
```

這通常用於需要真正建立 DOM element 的功能，例如 `styleCheck.js`。

---

## 4. `dom.js`：事件綁定封裝

`src/utils/dom.js` 提供：

```js
on(element, event, handler, useCapture = false)
off(element, event, handler, useCapture = false)
```

它在模組初始化時根據環境決定使用：

```txt
addEventListener / removeEventListener
或
attachEvent / detachEvent
```

這是一種老派但常見的跨瀏覽器封裝。元件使用時不用每次都寫相容判斷。

常見使用者：

```txt
Modal
Drawer
Slider
Split
Affix
Anchor
BackTop
Carousel
ColorPicker
Scroll
ImagePreview
```

---

## 5. class 操作 helper

`assist.js` 內提供：

```txt
hasClass(el, cls)
addClass(el, cls)
removeClass(el, cls)
```

這些 helper 主要做：

1. 支援 `classList`。
2. fallback 到字串處理。
3. 避免 class name 包含空白。

典型使用場景是 transition 或 directive，例如 `base/collapse-transition.vue`、`directives/line-clamp.js`。

---

## 6. style 與 feature detection

`src/utils/styleCheck.js` 提供：

```txt
isStyleSupport(styleName, styleValue)
detectFlexGapSupported()
```

它用於判斷瀏覽器是否支援某個 CSS property / value，或是否支援 flex gap。

核心思路：

```txt
確認 DOM 可用
  -> 建立測試元素
  -> 設定 style
  -> 讀回 style 或量測 scrollHeight
  -> 快取結果
```

`detectFlexGapSupported()` 會建立一個 flex container，設定 `rowGap = '1px'`，再透過 `scrollHeight` 判斷 gap 是否生效。

這類工具是 UI library 常見需求，因為同一個元件在不同瀏覽器能力下可能需要不同 fallback。

---

## 7. `MutationObserver` 與 `matchMedia`

`assist.js` 也提供瀏覽器 API wrapper：

```js
export const MutationObserver = isClient
    ? window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver || false
    : false;
```

以及：

```js
export function setMatchMedia () {
    if (!isClient) return;
    const matchMediaPolyfill = mediaQuery => {
        return {
            media: mediaQuery,
            matches: false,
            on() {},
            off() {},
        };
    };
    window.matchMedia = window.matchMedia || matchMediaPolyfill;
}
```

這些都屬於「不要假設瀏覽器 API 一定存在」的防守性封裝。

---

## 8. Client boundary 的閱讀規則

看到任何操作 DOM 的程式，都應該先確認是否有 guard：

```txt
window
document
document.body
document.createElement
document.addEventListener
getComputedStyle
Blob
URL.createObjectURL
navigator
```

在這份 source 中，常見 guard 有：

```txt
isClient
canUseDom()
canUseDocElement()
```

如果沒有 guard，就要確認這段程式是否只會在 browser lifecycle 中執行，例如 `mounted()` 之後。

---

## 9. 讀碼提醒

DOM utility 的重點不是「這段程式碼多難」，而是「它把哪些環境假設集中起來」。

例如：

```js
on(window, 'mousemove', this.handleMoveMove);
```

看起來只是綁事件，但真正應該追的是：

1. 事件在哪裡解除？
2. SSR 時會不會執行？
3. component unmount 時是否清理？
4. useCapture 是否需要一致？
5. 是否會造成全域事件殘留？

---

## 10. 本章結論

View UI Plus 的 DOM 共用邏輯可以分成三層：

```txt
環境判斷
  -> isClient / canUseDom

瀏覽器 API 封裝
  -> on / off / MutationObserver / matchMedia / styleCheck

元件實際使用
  -> Modal drag / Slider drag / Affix scroll / Anchor scroll / ImagePreview keydown
```

讀 UI library 時，要把 DOM 操作視為有副作用的共享資源。任何全域事件、body style、document element、window scroll 都需要追蹤它的建立與清理。
