# Overlay and Imperative API Types：Modal、Message、Notice 的命令式契約

## 1. 本章定位

本章分析浮層與命令式 API 的型別。

View UI Plus 中有些能力不是只透過 component template 使用，而是透過函式呼叫：

```ts
Message.success('Saved');
Modal.confirm({ title: 'Confirm' });
this.$Message.info('Hello');
this.$Modal.remove();
```

這類 API 的型別設計和普通 component props/emits 不同。它們需要描述的是 service object 的 methods、options object、回傳值，以及 plugin globalProperties 的型別。

---

## 2. Message Runtime API

`src/components/message/index.js` 對外提供：

```js
export default {
    name: 'Message',
    info (options) { return this.message('info', options); },
    success (options) { return this.message('success', options); },
    warning (options) { return this.message('warning', options); },
    error (options) { return this.message('error', options); },
    loading (options) { return this.message('loading', options); },
    message(type, options) { ... },
    config (options) { ... },
    destroy () { ... }
};
```

`notice(...)` 內部會回傳一個手動關閉函式：

```js
return function () {
    instance.remove(`${prefixKey}${target}`);
};
```

所以 runtime 上 `Message.success(...)` 的回傳值是 close function。

---

## 3. Message Type Surface

`types/message.d.ts` 中有：

```ts
export declare const Message: DefineComponent<{
    content?: string;
    render?: Function;
    duration?: number;
    onClose?: Function;
    closable?: boolean;
    background?: boolean;
}>

export declare const MessageConfig: {
    top?: number;
    duration?: number;
}
```

這份 declaration 比較像在描述 message notice options / component props，而不是完整 service object methods。

也就是說，runtime 有：

```ts
Message.success(...)
Message.config(...)
Message.destroy()
```

但 type surface 中從單檔觀察，沒有精準的：

```ts
interface MessageApi {
  success(options: string | MessageOptions): () => void;
  config(options: MessageConfig): void;
  destroy(): void;
}
```

更精確地說，`src/components/index.js` 將 `Message` 從 `./message` default export 轉出，而 `./message/index.js` 的 default export 是一個 service object。`types/message.d.ts` 卻把 `Message` 宣告成 `DefineComponent<{ ... }>`。這是一個很典型的 runtime/type 形狀落差：type surface 承認了 `Message` 這個 public 名稱，但沒有用 service object interface 描述它的實際 method contract。

---

## 4. Modal Runtime API

`src/components/modal/index.js` 對 runtime `Modal` 加上多個方法：

```js
Modal.info = function (props = {}) { ... };
Modal.success = function (props = {}) { ... };
Modal.warning = function (props = {}) { ... };
Modal.error = function (props = {}) { ... };
Modal.confirm = function (props = {}) { ... };
Modal.remove = function () { ... };
```

這讓 `Modal` 同時有兩種角色：

| 角色 | 使用方式 |
| --- | --- |
| component | `<Modal v-model="visible" />` |
| imperative service | `Modal.confirm({ title, content })` |

這種雙重角色是 UI library 常見設計，但型別要描述完整並不簡單。

---

## 5. Modal Type Surface

`types/modal.d.ts` 中有兩個 declaration：

```ts
export declare const Modal: DefineComponent<{
    'model-value'?: boolean;
    title?: string;
    closable?: boolean;
    'mask-closable'?: boolean;
    onOnOk?: (event?: any) => any;
    onOnCancel?: (event?: any) => any;
}>

export declare const ModalInstance: DefineComponent<{
    title?: string | Element;
    content?: string | Element;
    render?: Function;
    width?: number | string;
    okText?: string;
    cancelText?: string;
    loading?: boolean;
    onOk?: Function;
    onCancel?: Function;
}>
```

`Modal` 描述 template component props。`ModalInstance` 描述命令式 modal options 的一部分，但它仍被寫成 `DefineComponent<{ ... }>`，而不是明確的 options interface 或 service api interface。

這會讓讀者困惑：

```txt
Modal component props
  -> <Modal />

ModalInstance options
  -> Modal.confirm({ ... })

Modal service methods
  -> Modal.info / success / warning / error / confirm / remove
```

這三者應分開思考。

---

## 6. Plugin GlobalProperties 的弱型別

`src/index.js` install 會掛：

```js
app.config.globalProperties.$Message = components.Message;
app.config.globalProperties.$Notice = components.Notice;
app.config.globalProperties.$Modal = components.Modal;
```

`types/index.d.ts` 中則是：

```ts
$Message: any;
$Notice: any;
$Modal: any;
```

這能讓 Options API component 中的呼叫通過：

```ts
this.$Modal.confirm({ title: 'Delete?' });
```

但因為是 `any`，TypeScript 不知道：

1. `$Modal.confirm` 是否存在。
2. `confirm` 接受哪些 options。
3. `onOk` 是否可以回傳 Promise。
4. `$Message.success` 回傳 close function。
5. `$Notice.config` 接受哪些欄位。

---

## 7. 命令式 API 應該描述什麼

命令式 service type 至少應描述：

| 面向 | 例子 |
| --- | --- |
| method names | `info`、`success`、`warning`、`error`、`confirm`、`remove` |
| options object | `title`、`content`、`duration`、`onClose` |
| string shortcut | `Message.success('Saved')` |
| callbacks | `onOk`、`onCancel`、`onClose` |
| return value | close function、void、false |
| global injection | `this.$Message` 和 named import 是否同型別 |

例如 Message 可以更精準設計成：

```ts
interface MessageOptions {
  content?: string;
  render?: () => unknown;
  duration?: number;
  onClose?: () => void;
  closable?: boolean;
  background?: boolean;
}

type MessageClose = () => void;

interface MessageApi {
  info(options: string | MessageOptions): MessageClose;
  success(options: string | MessageOptions): MessageClose;
  warning(options: string | MessageOptions): MessageClose;
  error(options: string | MessageOptions): MessageClose;
  loading(options: string | MessageOptions): MessageClose;
  config(options: MessageConfig): void;
  destroy(): void;
}
```

這是改良方向，不是目前 v1.3.20 的型別現況。

---

## 8. Component Props 和 Service Options 不要混在一起

`Modal` 最容易混淆：

```vue
<Modal v-model="visible" title="Edit" />
```

這裡使用的是 component props，例如：

```ts
'model-value'?: boolean;
title?: string;
'mask-closable'?: boolean;
```

命令式 API 則是：

```ts
Modal.confirm({
  title: 'Confirm',
  content: 'Delete this row?',
  onOk() {}
});
```

這裡使用的是 options object，例如：

```ts
title?: string | Element;
content?: string | Element;
onOk?: Function;
onCancel?: Function;
```

兩者有重疊欄位，但不是同一個 contract。型別上最好分成 `ModalProps`、`ModalOptions`、`ModalApi`。

---

## 9. 閱讀命令式 API 的流程

讀 Message / Notice / Modal 時，建議照這個順序：

1. 看 `src/components/<service>/index.js`，確認 runtime methods。
2. 看 service 建立 instance 的方式，例如 `Notification.newInstance` 或 `Modal.newInstance`。
3. 看 method 接受 string shortcut 還是 object options。
4. 看 method 回傳值。
5. 看 `types/<service>.d.ts` 是否描述 component props、options、service methods。
6. 看 `types/index.d.ts` 的 `$Service` 是否只是 `any`。
7. 判斷 named import 與 `this.$Service` 是否需要同一個 interface。

---

## 10. 本章結論

View UI Plus 的命令式 API 在 runtime 上很完整，`Message`、`Modal` 等都提供 service-style methods。但 v1.3.20 的型別多數只描述部分 props/options，`globalProperties` 更是以 `any` 承認 property 存在，沒有完整 method-level contract。

閱讀這類 API 時，要分清楚三件事：

```txt
component props
  -> template 使用

service options
  -> Message.success(options) / Modal.confirm(options)

service api interface
  -> info / success / confirm / remove / config / destroy
```

這三層若混在一起，型別文件會很難維護，也容易讓使用者誤解 API。

---

## 11. 自我檢查問題

1. `Message.success()` runtime 回傳什麼？
2. `MessageConfig` 是否等於完整 `MessageApi`？為什麼？
3. `Modal` 為什麼同時是 component 和 imperative service？
4. `$Modal: any` 讓 TypeScript 知道什麼？又不知道什麼？
5. 為什麼 `ModalProps`、`ModalOptions`、`ModalApi` 應該分開設計？
