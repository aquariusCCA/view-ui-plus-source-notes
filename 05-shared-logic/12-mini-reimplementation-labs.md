# Mini Reimplementation Labs：共用邏輯仿作練習

## 1. 本章定位

本篇提供 `05-shared-logic/` 的小型仿作練習。

這些練習不是要完整重寫 View UI Plus，而是用最小程式驗證你是否理解：

```txt
mixin 如何注入能力
Form 欄位如何回報事件
Link mixin 如何接管跳轉
元件樹查找如何運作
DOM guard 為什麼必要
浮層 counter 如何支撐 z-index
textarea autosize 為什麼需要 DOM 量測
```

每個 lab 都可以獨立做。

---

## Lab 1：重寫 `oneOf()` prop validator

### 目標

理解 View UI Plus 為什麼大量用 `oneOf()` 檢查 props 合法值。

### 任務

實作：

```js
function oneOf(value, validList) {
    return validList.includes(value);
}
```

然後用在一個元件 prop：

```js
props: {
    size: {
        validator(value) {
            return oneOf(value, ['small', 'default', 'large']);
        },
        default: 'default'
    }
}
```

### 觀察

1. validator 失敗時 Vue 會如何警告？
2. `oneOf()` 集中後，比每個元件自己寫陣列判斷好在哪？
3. 如果合法值未來要改，維護成本在哪裡？

---

## Lab 2：簡化版 Form mixin

### 目標

理解欄位元件如何用 mixin 接入 `FormItem`。

### 任務

建立簡化 mixin：

```js
export default {
    inject: {
        FormItemInstance: {
            default: null
        }
    },
    methods: {
        notifyFormItem(type, value) {
            if (!this.FormItemInstance) return;
            if (type === 'blur') this.FormItemInstance.onFieldBlur(value);
            if (type === 'change') this.FormItemInstance.onFieldChange(value);
        }
    }
};
```

再建立：

```txt
MiniFormItem
  provide FormItemInstance

MiniInput
  mixins: [formMixin]
  input 時 notifyFormItem('change', value)
  blur 時 notifyFormItem('blur', value)
```

### 觀察

1. `MiniInput` 是否需要知道驗證細節？
2. `MiniFormItem` 改方法名稱時，mixin 是否也必須改？
3. 這種契約的好處與風險是什麼？

---

## Lab 3：簡化版 Link mixin

### 目標

理解 `link.js` 如何讓多種元件共享跳轉行為。

### 任務

實作：

```js
export default {
    props: {
        to: [String, Object],
        replace: Boolean,
        target: {
            type: String,
            default: '_self'
        }
    },
    computed: {
        linkUrl() {
            if (typeof this.to !== 'string') return null;
            if (this.to.includes('//')) return this.to;
            if (this.$router) return this.$router.resolve(this.to).href;
            return this.to;
        }
    },
    methods: {
        handleLinkClick(event) {
            if (!this.to) return;
            if (this.target === '_blank') return;
            event.preventDefault();
            if (this.$router && typeof this.to !== 'string') {
                this.replace ? this.$router.replace(this.to) : this.$router.push(this.to);
            } else {
                window.location.href = this.linkUrl || this.to;
            }
        }
    }
};
```

建立 `MiniButton` 使用它，當有 `to` 時渲染 `<a>`。

### 觀察

1. `to` 是字串與 object 時有什麼差異？
2. 有 router 與沒有 router 時行為如何不同？
3. 為什麼要 `event.preventDefault()`？

---

## Lab 4：元件樹向上查找

### 目標

理解 `findComponentUpward()` 的工作方式。

### 任務

實作：

```js
function findComponentUpward(context, componentNames) {
    const names = Array.isArray(componentNames) ? componentNames : [componentNames];
    let parent = context.$parent;
    while (parent) {
        const name = parent.$options.name;
        if (names.includes(name)) return parent;
        parent = parent.$parent;
    }
    return null;
}
```

建立：

```txt
MiniPicker
  -> MiniInput
```

讓 `MiniInput` 判斷自己是否在 `MiniPicker` 裡。

### 觀察

1. 如果 parent component 沒有 `name`，會發生什麼？
2. 如果元件被多層 wrapper 包住，還找得到嗎？
3. 這種方法和 `provide/inject` 相比差在哪？

---

## Lab 5：DOM event utility

### 目標

理解為什麼 UI library 會包 `on()` / `off()`。

### 任務

實作：

```js
export const isClient = typeof window !== 'undefined';

export function on(element, event, handler) {
    if (!isClient) return;
    if (element && event && handler) {
        element.addEventListener(event, handler);
    }
}

export function off(element, event, handler) {
    if (!isClient) return;
    if (element && event && handler) {
        element.removeEventListener(event, handler);
    }
}
```

在一個元件中於 `mounted()` 綁定 `window.resize`，在 `beforeUnmount()` 解除。

### 觀察

1. 如果忘記 `off()`，會有什麼問題？
2. SSR 中直接讀 `window` 會發生什麼？
3. 為什麼全域事件應該集中清理？

---

## Lab 6：浮層 z-index counter

### 目標

理解 `transfer-queue.js` 的 module-level counter。

### 任務

建立：

```js
let index = 0;

export function nextIndex() {
    index += 1;
    return index;
}
```

建立 `MiniPopover`：

```js
data() {
    return {
        zIndex: 1000
    };
},
methods: {
    open() {
        this.zIndex = 1000 + nextIndex();
        this.visible = true;
    }
}
```

### 觀察

1. 後開的浮層是否會蓋在前面？
2. index 只增不減有什麼影響？
3. 如果多個 app instance 共用同一份 module，counter 是否共享？

---

## Lab 7：簡化版 textarea autosize

### 目標

理解 textarea 高度為什麼要用 hidden textarea 量測。

### 任務

實作簡化版：

```js
let hiddenTextarea;

function calcTextareaHeight(textarea) {
    if (!hiddenTextarea) {
        hiddenTextarea = document.createElement('textarea');
        hiddenTextarea.style.position = 'absolute';
        hiddenTextarea.style.visibility = 'hidden';
        hiddenTextarea.style.height = '0';
        document.body.appendChild(hiddenTextarea);
    }

    const style = window.getComputedStyle(textarea);
    hiddenTextarea.style.width = style.width;
    hiddenTextarea.style.fontSize = style.fontSize;
    hiddenTextarea.style.lineHeight = style.lineHeight;
    hiddenTextarea.style.padding = style.padding;
    hiddenTextarea.value = textarea.value || textarea.placeholder || '';

    return {
        height: `${hiddenTextarea.scrollHeight}px`,
        overflowY: 'hidden'
    };
}
```

### 觀察

1. 改變 width 後，高度是否會變？
2. 沒有複製 line-height 時結果是否準確？
3. padding / border / box-sizing 會如何影響高度？

---

## 8. 練習總結

完成這些 lab 後，你應該能把 View UI Plus 的 shared logic 看成幾種模式：

```txt
共用 props / methods
  -> mixin

跨元件上下文
  -> provide/inject 或 component tree lookup

DOM 副作用
  -> utility + lifecycle cleanup

浮層排序
  -> module-level counter

資料格式
  -> pure utility

真實 layout 依賴
  -> hidden DOM measurement
```

後續讀具體元件時，可以拿這些 lab 當縮小版心智模型，避免一開始就被大型元件的細節淹沒。
