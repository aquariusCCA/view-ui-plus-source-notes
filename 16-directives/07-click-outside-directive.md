# 基礎 clickoutside 指令

## 學習目標

這篇分析基礎版 `clickoutside.js`。它是浮層元件最常見的 DOM 行為：點擊元素外部時觸發關閉。

讀完後，要能理解為什麼要監聽 document、如何判斷外部點擊、為什麼要做 SSR guard，以及卸載時如何避免事件殘留。

## 對照源碼

- `01-origin/source/view-ui-plus-v1.3.20/src/directives/clickoutside.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/dropdown/dropdown.vue`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/poptip/poptip.vue`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/cascader/cascader.vue`

## 核心實作

```js
import { isClient } from '../utils/index';

export default {
    beforeMount (el, binding, vnode) {
        function documentHandler (e) {
            if (el.contains(e.target)) {
                return false;
            }
            binding.value(e);
        }
        el.__vueClickOutside__ = documentHandler;
        isClient && document.addEventListener('click', documentHandler);
    },
    unmounted (el, binding) {
        isClient && document.removeEventListener('click', el.__vueClickOutside__);
        delete el.__vueClickOutside__;
    }
};
```

使用方式通常在元件內：

```vue
<div v-click-outside="handleClose">
    ...
</div>
```

## 為什麼監聽 document

外部點擊不是元素自身能完整知道的事情。當使用者點擊頁面其他地方時，事件不一定會經過該元素。

所以指令在 document 上監聽 click，再判斷事件目標是否位於元素內：

```js
if (el.contains(e.target)) {
    return false;
}
binding.value(e);
```

判斷邏輯是：

- 點擊元素內部：不處理。
- 點擊元素外部：呼叫 callback。

## 為什麼適合做成 directive

click outside 的核心不是 UI 結構，而是「某個元素外部發生點擊」。把它做成 directive 有幾個好處：

- 模板語意直接。
- 可以貼在 Dropdown、Poptip、Cascader 等不同元件根節點。
- 不需要額外 wrapper component。
- 事件註冊與清理封裝在同一處。

它是典型的單元素 DOM 行為。

## SSR guard

原始碼使用 `isClient`：

```js
isClient && document.addEventListener('click', documentHandler);
```

這是為了避免在 SSR 或無瀏覽器環境中存取 `document`。directive 常常會碰 DOM，所以每次存取 `window`、`document`、`Node` 前都要確認執行環境。

## handler 保存與清理

註冊事件時建立的 `documentHandler` 必須保存：

```js
el.__vueClickOutside__ = documentHandler;
```

卸載時才能用同一個函式參考移除：

```js
document.removeEventListener('click', el.__vueClickOutside__);
delete el.__vueClickOutside__;
```

如果不移除，元件消失後 callback 仍可能被觸發，造成 memory leak 或操作已不存在的元件狀態。

## 使用場景

View UI Plus 裡常見使用者：

- Dropdown：點外部收合選單。
- Poptip：點外部關閉氣泡。
- Cascader：點外部關閉級聯面板。

這些元件都共享同一種互動語意：浮層打開後，外部點擊代表退出或關閉。

## 基礎版限制

基礎 `clickoutside.js` 很簡潔，也有明顯限制：

- 只監聽 `click`。
- 不支援 `mousedown` 或 `touchstart`。
- 不支援 capture。
- 不支援 `stop`、`prevent`。
- 沒有檢查 `binding.value` 是否為函式。
- 每個元素都會註冊一個 document listener。

這些限制就是進階 `v-click-outside-x.js` 要解決的問題。

## 最小模仿

```js
const clickOutside = {
    beforeMount(el, binding) {
        if (typeof binding.value !== 'function') return;

        const handler = (event) => {
            if (!el.contains(event.target)) {
                binding.value(event);
            }
        };

        el.__clickOutside__ = handler;
        document.addEventListener('click', handler);
    },
    unmounted(el) {
        document.removeEventListener('click', el.__clickOutside__);
        delete el.__clickOutside__;
    }
};
```

實務上還要加上 `isClient` 或等價的環境判斷。

## 複習題

1. click outside 為什麼要監聽 document？
2. `el.contains(e.target)` 在這裡扮演什麼角色？
3. 為什麼要把 handler 存在元素上？
4. SSR guard 對 directive 有什麼意義？
5. 基礎版 clickoutside 和進階版 click-outside-x 的差異是什麼？
