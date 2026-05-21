# Overlay Shared State and Scroll Lock：浮層共用狀態與捲動鎖定

## 1. 本章定位

本篇整理浮層類元件共用的狀態與 DOM 副作用。

主要來源：

```txt
src/utils/transfer-queue.js
src/components/modal/mixins-scrollbar.js
src/components/modal/modal.vue
src/components/tooltip/tooltip.vue
src/components/poptip/poptip.vue
src/components/select/dropdown.vue
src/components/spin/spin.js
```

這篇是 `08-overlay-system/` 的前置筆記，只先看「共用邏輯」，不完整分析每個 overlay 元件。

---

## 2. `transfer-queue.js`：module-level counter

`src/utils/transfer-queue.js`：

```js
let transferIndex = 0;
let lastVisibleIndex = 0;

function transferIncrease() {
    transferIndex++;
}

function lastVisibleIncrease() {
    lastVisibleIndex++;
}

export { transferIndex, transferIncrease, lastVisibleIndex, lastVisibleIncrease };
```

這個檔案沒有 Vue reactive state，也沒有 class。它只是用 module-level variable 保存 counter。

用途是讓多個浮層實例取得遞增的 index，用於 z-index 或判斷最後可見浮層。

---

## 3. Tooltip 的 z-index 模型

`Tooltip` 使用：

```js
import { transferIndex, transferIncrease } from '../../utils/transfer-queue';
```

建立時：

```js
data () {
    return {
        tIndex: this.handleGetIndex()
    };
}
```

顯示時：

```js
handleShowPopper() {
    this.visible = true;
    this.tIndex = this.handleGetIndex();
}
```

計算 style：

```js
dropStyles () {
    let styles = {};
    if (this.transfer) styles['z-index'] = 1060 + this.tIndex;
    return styles;
}
```

這表示每次顯示 Tooltip，都會取得更高的 index，避免後開的浮層被前面的浮層蓋住。

---

## 4. Modal 的 z-index 與 top modal

`Modal` 使用：

```js
import {
    transferIndex as modalIndex,
    transferIncrease as modalIncrease,
    lastVisibleIndex,
    lastVisibleIncrease
} from '../../utils/transfer-queue';
```

它的 z-index 來自：

```js
wrapStyles () {
    return {
        zIndex: this.modalIndex + this.zIndex
    };
}
```

每次顯示時，會增加 modal index：

```js
this.modalIndex = this.handleGetModalIndex();
lastVisibleIncrease();
```

這讓多個 Modal 疊加時，後開或後點擊的 Modal 可以浮到上層。

---

## 5. Esc 關閉最上層 Modal

Modal 在 `mounted()` 中：

```js
this.addModal();
isClient && document.addEventListener('keydown', this.EscClose);
```

`addModal()` 會把 modal instance 存到 root：

```js
const root = this.$root;
if (!root.modalList) root.modalList = [];
root.modalList.push({
    id: this.id,
    modal: this
});
```

按 Esc 時，會從 `this.$root.modalList` 找出目前可見且可關閉的 Modal，按 `modalIndex` 排序後關閉最上層。

這是一種全域協調：

```txt
每個 Modal instance 自己註冊到 root list
  -> keydown 時找出 top modal
  -> 只關閉最上層
```

---

## 6. Scroll lock mixin

`components/modal/mixins-scrollbar.js` 用於 Modal、Spin、Drawer 等需要鎖 body scroll 的場景。

它提供：

```txt
checkScrollBar()
setScrollBar()
resetScrollBar()
addScrollEffect()
removeScrollEffect()
```

核心邏輯：

1. 判斷 body 是否因內容超出而有 scrollbar。
2. 如果有 scrollbar，計算 scrollbar width。
3. 鎖定 `document.body.style.overflow = 'hidden'`。
4. 用 `paddingRight` 補償 scrollbar 消失造成的畫面位移。
5. 關閉時還原 body style。

---

## 7. 為什麼需要 scrollbar width 補償？

當 Modal 打開時，如果直接設定：

```js
document.body.style.overflow = 'hidden';
```

瀏覽器原本的垂直 scrollbar 會消失。頁面可視寬度會變寬，內容可能產生水平跳動。

所以 mixin 會先用 `getScrollBarSize()` 算出 scrollbar 寬度，再設定：

```js
document.body.style.paddingRight = `${this.scrollBarWidth}px`;
```

這樣 scrollbar 消失後，body 右側仍保留一樣寬度，畫面比較穩定。

---

## 8. 關閉時不能直接還原的原因

`removeScrollEffect()` 不是每次關閉都直接還原 body overflow，而是先檢查：

```js
checkMaskInVisible()
```

原因是可能同時有多個 Modal / Drawer / Spin 之類的浮層。當其中一個關閉時，如果還有其他 mask 存在，就不應該解除 body scroll lock。

這是浮層系統常見問題：

```txt
單一元件的生命週期
  !=
全域 overlay 狀態
```

---

## 9. 讀碼提醒

浮層 shared logic 通常有兩種副作用：

| 副作用 | 需要檢查 |
| --- | --- |
| module-level counter | 是否只遞增不重置？是否影響長時間頁面？ |
| body/document 操作 | 是否在 unmount 時清理？多個浮層同時存在時是否正確？ |

讀 overlay 元件時，要特別追：

```txt
z-index 從哪裡來
visible 改變時做了什麼
是否 teleport 到 body
是否鎖 body scroll
keydown / mousemove 事件在哪裡解除
```

---

## 10. 本章結論

View UI Plus 的 overlay shared logic 不是集中在一個完整 manager 裡，而是分散在：

```txt
transfer-queue.js
modal root list
scrollbar mixin
各 overlay 元件自己的 visible watcher
```

它的設計偏務實：用 module-level counter 與 body style 操作快速支撐常見浮層需求。閱讀時要用「全域副作用」的角度看，而不是只看單一元件 template。
