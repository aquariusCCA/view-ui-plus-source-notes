# resize 指令

## 學習目標

這篇分析 `v-resize`。它把元素尺寸監聽封裝成 directive，讓使用者可以在模板上把 callback 綁到某個元素，而不是手動建立 resize detector。

讀完後，要能理解 handler 保存、observer 建立與清理的必要性，也能判斷 resize 類能力什麼時候適合 directive，什麼時候適合 composable。

## 對照源碼

- `01-origin/source/view-ui-plus-v1.3.20/src/directives/resize.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/index.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/typography/base.vue`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/grid/grid.vue`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/table/table.vue`

## 核心實作

```js
import elementResizeDetectorMaker from 'element-resize-detector';

export default {
    mounted (el, binding) {
        function resizeHandler (e) {
            binding.value(e);
        }
        el.__resizeHandler__ = resizeHandler;
        el.__observer__ = elementResizeDetectorMaker();
        el.__observer__.listenTo(el, resizeHandler);
    },
    updated () {

    },
    unmounted (el, binding) {
        el.__observer__.removeListener(el, el.__resizeHandler__);
        delete el.__resizeHandler__;
        delete el.__observer__;
    }
}
```

使用方式：

```vue
<div v-resize="handleResize" />
```

## 為什麼不是 window resize

`window.resize` 只能告訴你視窗大小變了，不代表某個元素尺寸變了。元件庫裡常見的需求是：

- 表格容器寬度改變後重新計算欄位。
- Grid 容器寬度改變後重新排版。
- Typography 寬度改變後重新計算省略。

這些都是元素尺寸問題，所以使用 `element-resize-detector`。

## handler 為什麼要保存

`removeListener` 需要同一個 handler 參考。掛載時建立的 `resizeHandler` 如果不保存，卸載時就無法移除。

因此實作把它放在元素上：

```js
el.__resizeHandler__ = resizeHandler;
```

同理，observer 也要保存：

```js
el.__observer__ = elementResizeDetectorMaker();
```

這樣 `unmounted` 才能找到它並清理。

## 清理流程

卸載時要做三件事：

```txt
removeListener
  -> delete handler reference
  -> delete observer reference
```

如果漏掉 listener，callback 可能在元素消失後仍被呼叫。如果漏掉暫存欄位，元素物件上會留下無用資料。

## value 的期待

`v-resize` 的 `binding.value` 應該是函式：

```vue
<div v-resize="onResize" />
```

目前實作沒有檢查型別。如果傳入非函式，resize 發生時才會報錯。更嚴謹的版本可以在 `mounted` 檢查：

```js
if (typeof binding.value !== 'function') {
    throw new TypeError('v-resize expects a function');
}
```

## updated 為什麼是空的

原始碼裡 `updated` 是空函式，代表它沒有處理 callback 更新。如果父元件在更新後換了新的 callback 函式，原本的 `resizeHandler` 閉包仍可能持有舊的 binding。

仿寫時可以選擇兩種策略：

- 在 handler 執行時讀取最新 callback reference。
- 在 `updated` 發現 value 改變時重新綁定 listener。

簡單指令可以接受限制，但公共 API 最好把這個行為講清楚。

## directive 或 composable

`v-resize` 適合使用者想在模板上直接宣告元素監聽：

```vue
<section v-resize="layout" />
```

如果 resize 結果會進入 setup 中的狀態計算，或需要多個元素共用邏輯，composable 可能更清楚：

```js
const { width, height } = useElementResize(targetRef);
```

選擇標準是：模板宣告優先用 directive，狀態組合優先用 composable。

## 最小模仿

```js
const resize = {
    mounted(el, binding) {
        if (typeof binding.value !== 'function') return;

        const observer = new ResizeObserver((entries) => {
            binding.value(entries[0]);
        });

        el.__resizeObserver__ = observer;
        observer.observe(el);
    },
    unmounted(el) {
        el.__resizeObserver__?.disconnect();
        delete el.__resizeObserver__;
    }
};
```

現代瀏覽器可考慮使用 `ResizeObserver`。如果要支援舊環境，再評估 polyfill 或第三方套件。

## 複習題

1. 為什麼元素 resize 不能只靠 `window.resize`？
2. `el.__resizeHandler__` 解決了什麼問題？
3. 如果 `binding.value` 不是函式，目前實作會有什麼風險？
4. 空的 `updated` 對 callback 更新有什麼影響？
5. 什麼情況下你會把 resize 能力寫成 composable？
