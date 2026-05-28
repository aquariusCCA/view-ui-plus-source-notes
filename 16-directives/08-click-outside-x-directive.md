# 進階 click-outside-x 指令

## 學習目標

這篇分析 `v-click-outside-x.js`。它是基礎 click outside 的進階版本，支援 capture、不同事件類型、`stop`、`prevent`，並用共享 listener 管理多個元素。

讀完後，要能理解多 instance 指令如何集中管理事件，而不是每個元素各自註冊一組 document listener。

## 對照源碼

- `01-origin/source/view-ui-plus-v1.3.20/src/directives/v-click-outside-x.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/select/select.vue`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/date-picker/picker.vue`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/color-picker/color-picker.vue`

## 使用方式

在 Select、DatePicker、ColorPicker 中可以看到類似用法：

```vue
<div
    v-click-outside:[capture]="onClickOutside"
    v-click-outside:[capture].mousedown="onClickOutside"
    v-click-outside:[capture].touchstart="onClickOutside"
>
    ...
</div>
```

這裡的 API 表達了幾件事：

- value 是外部點擊 callback。
- arg 是是否使用 capture。
- modifier 可指定事件類型，例如 `mousedown`、`touchstart`。
- modifier 也可承載 `stop`、`prevent`。

## instance 容器

源碼建立兩組容器：

```js
const captureInstances = Object.create(null);
const nonCaptureInstances = Object.create(null);
const instancesList = [captureInstances, nonCaptureInstances];
```

分成 capture 和 non-capture 是必要的，因為 `addEventListener` 的第三個參數會影響事件階段。註冊和移除時必須用相同的 capture 值。

## 事件分流

指令會根據 modifiers 決定事件類型：

```js
let eventType;
const modifiers = binding.modifiers;
if (modifiers.click) eventType = 'click';
else if (modifiers.mousedown) eventType = 'mousedown';
else if (modifiers.touchstart) eventType = 'touchstart';
else eventType = CLICK;
```

如果沒有指定，預設是 click。

這讓同一個 directive 可以支援多種互動時機。Select 類元件常需要 mousedown 或 touchstart，因為 click 的觸發時機可能晚於 focus、blur 或選項點擊。

## normalisedBinding

源碼會補上預設 modifiers：

```js
const normalisedBinding = {
    ...binding,
    modifiers: {
        capture: false,
        prevent: false,
        stop: false,
        ...binding.modifiers,
    },
};
```

這樣後續 handler 可以穩定讀取 `stop` 和 `prevent`，不需要每次都判斷欄位是否存在。

## 共享 document listener

每個事件類型在某一組 instances 中第一次出現時，才註冊 document listener：

```js
if (instances[eventType].push({el, binding: normalisedBinding}) === 1) {
    document.addEventListener(
        eventType,
        getEventHandler(useCapture),
        useCapture,
    );
}
```

這比基礎版更節制。多個元素使用同一事件類型時，共用同一個 document listener，再由內部 instances 清單分發。

## commonHandler

共同 handler 會遍歷該事件類型下所有 instance：

```js
if (el !== target && !el.contains(target)) {
    const {binding} = item;

    if (binding.modifiers.stop) {
        event.stopPropagation();
    }

    if (binding.modifiers.prevent) {
        event.preventDefault();
    }

    binding.value.call(context, event);
}
```

核心仍然是外部點擊判斷：目標不是元素本身，也不在元素內部，就呼叫 callback。

## 卸載與 listener 回收

`unmounted` 會從所有 instance 容器中移除目前元素：

```js
const newInstance = instances[eventName].filter(compareElements);
```

如果某個事件類型已經沒有 instance，才移除 document listener 並刪掉 key：

```js
document.removeEventListener(
    eventName,
    getEventHandler(useCapture),
    useCapture,
);

delete instances[eventName];
```

這種做法讓 listener 的生命週期跟 instance 數量一致。

## 設計取捨

進階版比基礎版複雜很多，換來的是：

- 少量 document listener 支撐多個元素。
- 支援 capture 和非 capture。
- 支援多事件類型。
- 支援 stop/prevent。
- binding value 型別錯誤時及早丟錯。

代價是資料結構較難讀，並且需要非常小心移除 listener 的條件。

## 最小模仿

```js
const instances = [];

const handler = (event) => {
    instances.forEach(({ el, callback }) => {
        if (el !== event.target && !el.contains(event.target)) {
            callback(event);
        }
    });
};

const clickOutsideShared = {
    beforeMount(el, binding) {
        if (instances.push({ el, callback: binding.value }) === 1) {
            document.addEventListener('click', handler);
        }
    },
    unmounted(el) {
        const index = instances.findIndex((item) => item.el === el);
        if (index > -1) instances.splice(index, 1);
        if (instances.length === 0) {
            document.removeEventListener('click', handler);
        }
    }
};
```

這是共享 listener 的最小模型。View UI Plus 的版本再加上 capture、事件類型與 modifiers。

## 複習題

1. 為什麼要分成 captureInstances 和 nonCaptureInstances？
2. 事件類型為什麼適合用 modifier 表達？
3. 共享 document listener 比每個元素各自註冊有什麼好處？
4. `stop` 和 `prevent` 在外部點擊 handler 中如何生效？
5. 為什麼移除 listener 時也要帶上相同的 capture 值？
