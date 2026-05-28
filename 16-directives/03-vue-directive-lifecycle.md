# Vue 指令生命週期

## 學習目標

這篇用 View UI Plus 的實作理解 Vue directive 生命週期。重點是把每個 hook 的責任分清楚：何時讀 binding、何時建立 DOM 副作用、何時更新、何時清理。

讀完後，要能檢查一個指令是否正確處理 mount、update、unmount，以及是否留下 listener、observer、style 或暫存資料。

## 對照源碼

- `01-origin/source/view-ui-plus-v1.3.20/src/directives/style.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/directives/line-clamp.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/directives/resize.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/directives/clickoutside.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/directives/v-click-outside-x.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/directives/transfer-dom.js`

## 常見 hook 分工

| hook | 適合做什麼 | View UI Plus 例子 |
| --- | --- | --- |
| `beforeMount` | 提早準備事件 handler 或檢查 binding | `clickoutside.js`、`v-click-outside-x.js` |
| `mounted` | DOM 已存在後寫 style、建立 observer | `style.js`、`line-clamp.js`、`resize.js` |
| `updated` | binding 改變後同步 DOM 狀態 | `style.js`、`line-clamp.js` |
| `unmounted` | 移除 listener、observer、class、style、暫存資料 | 多數指令都有清理 |

不是每個指令都需要所有 hook。簡單 focus 指令可能只需要 `mounted`；有副作用的指令通常至少需要 `mounted` 或 `beforeMount` 加上 `unmounted`。

## binding 是指令的輸入

directive hook 會收到 `el` 和 `binding`：

```js
mounted(el, binding) {
    el.style.width = binding.value + 'px';
}
```

`binding` 常用欄位包括：

- `value`：目前值。
- `oldValue`：更新前的值。
- `arg`：指令參數。
- `modifiers`：modifier 布林表。

如果指令只需要同步最新值，可以直接讀 `binding.value`。如果更新成本高，或需要判斷是否真的改變，就應該比較 `value` 和 `oldValue`。

## 建立副作用要能清理

`resize.js` 會在掛載時建立 observer 和 handler：

```js
el.__resizeHandler__ = resizeHandler;
el.__observer__ = elementResizeDetectorMaker();
el.__observer__.listenTo(el, resizeHandler);
```

卸載時再清掉：

```js
el.__observer__.removeListener(el, el.__resizeHandler__);
delete el.__resizeHandler__;
delete el.__observer__;
```

這是指令設計的基本模式：只要在元素上建立了外部副作用，就要留下足夠資訊讓 `unmounted` 可以反向清理。

## style 類指令的生命週期

`style.js` 的每個小指令大致是：

```js
mounted(el, binding) {
    if (binding.value) {
        el.style.width = binding.value + unit(binding.value);
    }
},
updated(el, binding) {
    if (binding.value) {
        el.style.width = binding.value + unit(binding.value);
    }
},
unmounted(el) {
    el.style.width = null;
}
```

它的責任很單純：

- 掛載時寫入。
- 更新時同步。
- 卸載時清掉。

這種指令不需要複雜狀態，但要注意 falsy value，例如 `0` 在目前寫法中不會被寫入。

## 事件類指令的生命週期

`clickoutside.js` 在 `beforeMount` 建立 document handler：

```js
function documentHandler(e) {
    if (el.contains(e.target)) {
        return false;
    }
    binding.value(e);
}
el.__vueClickOutside__ = documentHandler;
document.addEventListener('click', documentHandler);
```

`unmounted` 再移除：

```js
document.removeEventListener('click', el.__vueClickOutside__);
delete el.__vueClickOutside__;
```

事件類指令最容易出問題的地方是：註冊時和移除時的 handler 必須是同一個函式參考，所以需要把 handler 存起來。

## Vue 2 與 Vue 3 hook 名稱差異

`transfer-dom.js` 使用了 `inserted`、`componentUpdated`、`unbind` 這些 Vue 2 風格 hook。這在閱讀 View UI Plus 歷史實作時很有價值，但如果要在 Vue 3 專案重寫，應該改成：

| Vue 2 | Vue 3 |
| --- | --- |
| `inserted` | `mounted` |
| `componentUpdated` | `updated` |
| `unbind` | `unmounted` |

學習時要看它的設計意圖：掛載後搬移 DOM、更新時切換 target、卸載時搬回原位，而不是直接照抄 hook 名稱。

## 設計啟發

判斷生命週期是否合理，可以用這條線檢查：

```txt
read binding
  -> create DOM effect
  -> store cleanup reference
  -> update DOM when value changes
  -> remove DOM effect
  -> delete temporary fields
```

如果某個步驟沒有對應清理，就要警覺 memory leak 或殘留樣式。

## 最小模仿

```js
const onEscape = {
    mounted(el, binding) {
        const handler = (event) => {
            if (event.key === 'Escape') {
                binding.value(event);
            }
        };
        el.__escapeHandler__ = handler;
        document.addEventListener('keydown', handler);
    },
    unmounted(el) {
        document.removeEventListener('keydown', el.__escapeHandler__);
        delete el.__escapeHandler__;
    }
};
```

這個例子展示了事件類指令的核心：建立 handler、保存 handler、移除 handler。

## 複習題

1. `mounted` 和 `updated` 的責任差異是什麼？
2. 為什麼事件 handler 要存到元素上？
3. `binding.value` 和 `binding.modifiers` 各自適合承載什麼？
4. 為什麼 `transfer-dom.js` 的 hook 名稱不能直接當成 Vue 3 範本？
5. 設計一個會註冊 `window.resize` 的指令時，至少要清理哪些東西？
