# transfer-dom 指令

## 學習目標

這篇分析 `transfer-dom.js`。它展示一種在 Teleport 普及前常見的浮層技巧：把某個元素從原本位置搬到指定 DOM 容器，通常是 `document.body`。

讀完後，要能理解 DOM 搬移為什麼需要 placeholder comment、如何切換 target，以及為什麼在 Vue 3 專案中要優先考慮 Teleport。

## 對照源碼

- `01-origin/source/view-ui-plus-v1.3.20/src/directives/transfer-dom.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/utils/index.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/utils/transfer-queue.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/modal/`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/tooltip/`

## 核心目的

浮層元件常遇到這些問題：

- 被父層 `overflow: hidden` 裁切。
- 被父層 stacking context 影響 z-index。
- 定位需要脫離目前 DOM 層級。

transfer DOM 的策略是：模板仍寫在原本元件裡，但實際 DOM 被搬到目標容器。

```txt
component tree
  -> original parent
      -> placeholder comment

document.body
  -> moved popup element
```

## getTarget

源碼提供 `getTarget`：

```js
function getTarget (node) {
    if (!isClient) return;
    if (node === void 0) {
        node = document.body
    }
    if (node === true) { return document.body }
    return node instanceof window.Node ? node : document.querySelector(node)
}
```

value 可以是：

- `undefined`：預設 `document.body`。
- `true`：使用 `document.body`。
- DOM Node：直接作為 target。
- selector string：用 `document.querySelector` 找 target。
- `false`：不搬移或搬回。

## placeholder comment

掛載時會建立 comment：

```js
const home = document.createComment('');
```

當元素被搬走時，用 comment 留在原位置：

```js
parentNode.replaceChild(home, el);
getTarget(value).appendChild(el);
```

這個 comment 是「回家座標」。當 value 變成 `false` 或卸載時，指令知道元素原本應該回到哪裡。

## 暫存資料

源碼把狀態存在元素上：

```js
el.__transferDomData = {
    parentNode: parentNode,
    home: home,
    target: getTarget(value),
    hasMovedOut: hasMovedOut
}
```

這些資料支援後續更新：

- 原始父節點是誰。
- placeholder 在哪裡。
- 目前 target 是誰。
- 是否已搬出。

DOM 搬移不是單次動作，後續 value 改變時還要能正確切換。

## 更新策略

更新時分三種情境：

```txt
not moved + value truthy
  -> replace element with home
  -> append element to target

moved + value === false
  -> replace home with element

moved + value truthy
  -> append element to new target
```

這讓同一個指令可以支援打開 transfer、關閉 transfer、換 target。

## 卸載清理

卸載時：

- 移除 `v-transfer-dom` class。
- 如果元素已搬出，將它 append 回原父節點。
- 清空 `__transferDomData`。

這可以降低殘留 DOM 的風險。不過 DOM 搬移本身仍然很敏感，尤其在巢狀浮層和條件渲染中，需要大量測試。

## Vue 2 hook 名稱

`transfer-dom.js` 使用：

- `inserted`
- `componentUpdated`
- `unbind`

這是 Vue 2 風格。Vue 3 中應改成：

- `mounted`
- `updated`
- `unmounted`

閱讀這個檔案時，重點是學 DOM 搬移模型，不是照抄 hook 名稱。

## 和 Teleport 的關係

Vue 3 提供 Teleport 後，很多 transfer DOM 場景可以改成：

```vue
<Teleport to="body">
    <div class="popup">...</div>
</Teleport>
```

Teleport 的好處是：

- 是 Vue 官方能力。
- 和虛擬 DOM、生命週期更一致。
- 可讀性比手動 replaceChild 更好。

但理解 `transfer-dom.js` 仍然有價值，因為它揭示了浮層元件為什麼需要脫離原 DOM 層級。

## 設計啟發

DOM 搬移指令要特別檢查：

- 是否有 SSR guard。
- target 不存在時怎麼處理。
- 原位置是否有 placeholder。
- 搬出、搬回、換 target 是否都能工作。
- 卸載時是否能清理。
- 是否會破壞 Vue 對 DOM 的預期。

如果可以使用 Teleport，優先使用 Teleport。只有在需要兼容舊架構或封裝歷史行為時，才保留 transfer DOM 指令。

## 最小模仿

```js
const transfer = {
    mounted(el, binding) {
        if (binding.value === false) return;

        const parent = el.parentNode;
        const home = document.createComment('');
        parent.replaceChild(home, el);
        document.body.appendChild(el);

        el.__transfer__ = { parent, home };
    },
    unmounted(el) {
        const data = el.__transfer__;
        if (data?.home?.parentNode) {
            data.home.parentNode.replaceChild(el, data.home);
        }
        delete el.__transfer__;
    }
};
```

這只是概念示範。完整版本還要處理 target selector、value 更新、SSR 和 target 不存在。

## 複習題

1. transfer DOM 主要解決浮層的哪幾類問題？
2. 為什麼搬走元素前要建立 comment placeholder？
3. `__transferDomData` 需要保存哪些資訊？
4. Vue 3 中為什麼通常優先使用 Teleport？
5. 如果 target selector 找不到，指令應該如何設計失敗行為？
