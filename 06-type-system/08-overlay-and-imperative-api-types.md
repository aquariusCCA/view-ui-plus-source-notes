# Overlay and Imperative API Types：`Modal`、`Message`、`Notice` 的命令式契約

## 1. 本章定位

本章存放於 `06-type-system/` 目錄，屬於 View UI Plus TypeScript 型別設計筆記的一部分。這個目錄主要整理 `props`、`emits`、`instance`、`public API` 與泛型等型別設計議題。

本章聚焦的是 **Overlay 與 Imperative API Types**，也就是浮層類元件與命令式 API 的型別契約。代表案例包含：

```ts
Message.success('Saved');
Modal.confirm({ title: 'Confirm' });
this.$Message.info('Hello');
this.$Modal.remove();
```

這些 API 和一般 template component 不同。一般元件常見的使用方式是：

```vue
<Button type="primary" @click="handleClick">
  Save
</Button>
```

這種情況下，型別重點通常是：

1. `props` 接受哪些欄位。
2. `emits` 會拋出哪些事件。
3. `slots` 有哪些插槽與 slot props。
4. `ref` 能拿到哪些 instance methods。

但是 `Message`、`Modal`、`Notice` 這類 API 的使用方式經常是「直接呼叫一個方法」，例如：

```ts
Message.success('Saved');
Modal.confirm({
  title: 'Delete',
  content: 'Are you sure?',
  onOk() {}
});
```

這時型別要描述的就不只是 component props，而是 service object 的 method contract。也就是說，這篇筆記要解決的問題是：

> 當一個 UI library 同時提供 template component 與命令式 service API 時，TypeScript 型別應該如何分層描述？

本章不會完整分析 `Message`、`Modal`、`Notice` 的 runtime 實作細節，也不會深入浮層的 DOM 掛載、動畫、z-index、queue 管理或 instance lifecycle。這些可以留到後續的元件實作分析或 overlay runtime 架構筆記處理。本章的重點是從 `.d.ts` 型別設計角度理解它們的 public API 契約。

---

## 2. 學習前先建立的基本觀念

### 2.1 Template Component 與 Imperative Service 是不同使用模型

在 UI library 中，一個功能可能用兩種方式提供給使用者。

第一種是 template component，也就是透過模板宣告 UI：

```vue
<Modal v-model="visible" title="Edit" />
```

這種使用方式的型別核心是 `props`、`emits` 與 `slots`。使用者把資料傳給元件，元件透過事件通知外部狀態變化。

第二種是 imperative service，也就是透過 JavaScript 函式呼叫立即建立或控制某個 UI：

```ts
Modal.confirm({
  title: 'Confirm',
  content: 'Delete this row?',
  onOk() {}
});
```

這種使用方式的型別核心是 service object。它通常需要描述：

1. 有哪些方法，例如 `info`、`success`、`warning`、`error`、`confirm`、`remove`。
2. 每個方法接受什麼 options object。
3. 是否支援 string shortcut，例如 `Message.success('Saved')`。
4. callback 的參數與回傳值是什麼。
5. 方法本身回傳什麼，例如 close function 或 `void`。

如果把兩種模型混在一起，型別會變得不清楚。使用者也會分不清楚某個欄位到底是 template prop，還是命令式 options。

---

### 2.2 `DefineComponent` 適合描述元件，不一定適合描述 service object

`DefineComponent` 是 Vue 3 型別系統中用來描述元件的型別。它適合用來表示：

```ts
export declare const Modal: DefineComponent<{
  'model-value'?: boolean;
  title?: string;
}>
```

這表示 `Modal` 可以當作 Vue component 使用，並且它接收某些 props。

但是如果 runtime 上的 `Message` 是這樣的 service object：

```js
export default {
    info(options) {},
    success(options) {},
    warning(options) {},
    error(options) {},
    loading(options) {},
    config(options) {},
    destroy() {}
}
```

那它的型別就不應該只用 `DefineComponent<{ ... }>` 描述。因為 `DefineComponent` 會讓讀者以為 `Message` 的主要形狀是一個 Vue component，而不是一個包含多個 method 的 service object。

這不是說 service object 絕對不能和 component 有關，而是型別上必須明確分出：

```txt
component props
  -> 描述 template 怎麼用

service options
  -> 描述 method 接受什麼參數

service api interface
  -> 描述 service object 有哪些方法
```

---

### 2.3 `globalProperties` 是 Vue plugin 的全域注入入口

View UI Plus 安裝成 Vue plugin 後，會把一些能力掛到 `app.config.globalProperties` 上。這樣 Options API component 就可以透過 `this.$Message`、`this.$Modal` 使用命令式 API。

概念上類似：

```js
app.config.globalProperties.$Message = components.Message;
app.config.globalProperties.$Notice = components.Notice;
app.config.globalProperties.$Modal = components.Modal;
```

在 TypeScript 中，如果要讓 `this.$Message` 有型別，就需要擴充 Vue 的 `ComponentCustomProperties`。如果只寫成：

```ts
$Message: any;
$Notice: any;
$Modal: any;
```

那 TypeScript 只知道這些 property 存在，卻不知道它們有哪些 method，也不知道 method 的參數與回傳值。

因此，`globalProperties` 的型別不是單純讓 property 通過編譯而已。更完整的設計應該讓：

```ts
import { Message } from 'view-ui-plus';

this.$Message
```

兩者盡可能共享同一個 `MessageApi` interface，避免 named import 與 plugin global property 出現兩套不同的型別契約。

---

## 3. 整體概覽

這篇筆記可以用四層來看 View UI Plus 浮層命令式 API 的型別問題。

```txt
第一層：Runtime Service Object
  -> src/components/message/index.js
  -> src/components/modal/index.js
  -> src/components/notice/index.js

第二層：Component / Options Declaration
  -> types/message.d.ts
  -> types/modal.d.ts
  -> types/notice.d.ts

第三層：Package Public Export
  -> src/components/index.js
  -> types/viewuiplus.components.d.ts
  -> types/index.d.ts

第四層：Plugin GlobalProperties
  -> app.config.globalProperties.$Message
  -> app.config.globalProperties.$Notice
  -> app.config.globalProperties.$Modal
  -> types/index.d.ts 中的 ComponentCustomProperties 擴充
```

這四層之間應該保持一致。runtime 上有 `Message.success()`，型別就應該描述 `success()`。runtime 上 `Message.success()` 回傳 close function，型別就應該把回傳值描述出來。plugin 裝上 `$Message` 後，`this.$Message.success()` 也應該擁有相同的型別提示。

如果這四層不同步，就會形成以下問題：

| 層級 | 可能問題 | 使用者感受到的結果 |
| --- | --- | --- |
| Runtime service object | 實際有 method，但 `.d.ts` 沒描述 | JavaScript 可以跑，但 TypeScript 沒提示或報錯 |
| Type declaration | 宣告成 `DefineComponent`，但 runtime 是 service object | 型別形狀和實際使用方式不一致 |
| Public export registry | named export 與 type export 不同步 | `import { Message }` 的型別或 runtime 可能不一致 |
| GlobalProperties | `$Message`、`$Modal` 寫成 `any` | 能呼叫但沒有 IDE 保護與錯誤檢查 |

因此，本章閱讀重點不是只看某個 `.d.ts` 檔案有哪些欄位，而是要檢查「runtime 形狀是否被型別完整表達」。

---

## 4. 核心內容逐步講解

### 4.1 為什麼 Overlay API 容易產生命令式契約？

`Message`、`Notice`、`Modal` 這類 UI 能力通常具有「臨時建立、短暫顯示、用完銷毀」的特性。它們不像 `Button`、`Input`、`Table` 那樣一定要放在 template 裡面成為頁面結構的一部分。

例如訊息提示常見使用方式是：

```ts
Message.success('Saved');
```

使用者不需要先在 template 寫：

```vue
<Message />
```

再控制它顯示。UI library 會在內部建立 instance、插入 DOM、顯示動畫，並在時間到或使用者關閉時移除。

這種設計讓使用者使用上很方便，但也讓型別設計變複雜。因為這時 public API 的重點不再只是「元件有哪些 props」，而是「這個 service object 提供哪些命令」。

因此，對 Overlay API 來說，型別設計至少要回答：

1. `Message.success()` 接受字串還是物件？
2. `Message.loading()` 是否也回傳 close function？
3. `Message.config()` 可設定哪些全域選項？
4. `Modal.confirm()` 的 `onOk`、`onCancel` 是什麼型別？
5. `Modal.remove()` 是否有參數？
6. `this.$Modal` 和 `import { Modal }` 是否同一個型別？

這些問題都不是一般 `DefineComponent<Props>` 可以完整描述的。

---

### 4.2 `Message` 的 runtime API：它比較像 service object

`src/components/message/index.js` 對外提供的 default export 類似以下形狀：

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

從這個結構可以看出，`Message` 對使用者暴露的主要能力不是 template props，而是一組 method。每個 method 代表一種 message 類型，例如 `success`、`warning`、`error`。

內部 `notice(...)` 最後會回傳一個手動關閉函式：

```js
return function () {
    instance.remove(`${prefixKey}${target}`);
};
```

因此 runtime 上：

```ts
const close = Message.success('Saved');
close();
```

這類使用方式是有意義的。這代表 `Message.success()` 的型別不應該只是 `void`，而應該能表達「它會回傳 close function」。

更精準的方向可以拆成兩個型別：

```ts
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

這裡的重點不是說 v1.3.20 已經這樣設計，而是這種 interface 才比較能描述 runtime 的實際 service contract。

---

### 4.3 `Message` 的 type surface：目前較像 options / props，不像完整 API

`types/message.d.ts` 片段如下：

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

這份 declaration 有描述到 `content`、`render`、`duration`、`onClose`、`closable`、`background` 等欄位，也有描述 `MessageConfig` 的 `top` 與 `duration`。這些欄位比較像 message options 或 message component props。

但它沒有完整描述以下 runtime methods：

```ts
Message.info(...)
Message.success(...)
Message.warning(...)
Message.error(...)
Message.loading(...)
Message.config(...)
Message.destroy(...)
```

也沒有明確描述：

1. method 是否接受 `string | MessageOptions`。
2. method 回傳值是否為 close function。
3. `config()` 的參數是否為 `MessageConfig`。
4. `destroy()` 是否回傳 `void`。
5. `this.$Message` 是否與 named import 的 `Message` 同型別。

這就是本章要特別注意的 runtime/type 形狀落差。`types/message.d.ts` 承認了 `Message` 這個 public 名稱，但沒有用 service object interface 描述它的 method contract。

可以把目前狀況理解成：

| 面向 | Runtime 觀察 | Type surface 觀察 | 型別落差 |
| --- | --- | --- | --- |
| `Message.success` | runtime 有 method | `DefineComponent` 中未描述 | method-level contract 不完整 |
| close function | `notice(...)` 回傳手動關閉函式 | 未明確描述為 return type | 使用者拿不到回傳值提示 |
| `Message.config` | runtime 有 method | 只有 `MessageConfig` 物件型別 | config method 與 config object 沒連起來 |
| `Message.destroy` | runtime 有 method | 未明確描述 | 無法獲得 method 提示 |
| `$Message` | plugin 掛到 globalProperties | 型別為 `any` | 可以通過但沒有保護 |

這類落差在 UI library 舊版 `.d.ts` 中很常見。原因通常不是 runtime 沒有能力，而是 declaration 沒有完整追上 runtime public API。

---

### 4.4 `Modal` 的 runtime API：同時是元件與命令式服務

`Modal` 比 `Message` 更容易混淆，因為它同時有兩種常見使用方式。

第一種是 template component：

```vue
<Modal v-model="visible" title="Edit" />
```

第二種是 imperative service：

```ts
Modal.confirm({
  title: 'Confirm',
  content: 'Delete this row?',
  onOk() {}
});
```

`src/components/modal/index.js` 會對 runtime `Modal` 加上多個方法：

```js
Modal.info = function (props = {}) { ... };
Modal.success = function (props = {}) { ... };
Modal.warning = function (props = {}) { ... };
Modal.error = function (props = {}) { ... };
Modal.confirm = function (props = {}) { ... };
Modal.remove = function () { ... };
```

這代表 `Modal` 的 runtime shape 不是單純 component，而是 component 加上 service methods。從型別設計角度，這通常需要交叉型別或額外 interface 來表達，例如：

```ts
type ModalExport = ModalComponent & ModalApi;
```

或者至少要把不同責任拆清楚：

```ts
interface ModalProps {
  modelValue?: boolean;
  title?: string;
  closable?: boolean;
  maskClosable?: boolean;
}

interface ModalOptions {
  title?: string | Element;
  content?: string | Element;
  render?: () => unknown;
  width?: number | string;
  okText?: string;
  cancelText?: string;
  loading?: boolean;
  onOk?: () => void | Promise<void>;
  onCancel?: () => void;
}

interface ModalApi {
  info(options?: ModalOptions): void;
  success(options?: ModalOptions): void;
  warning(options?: ModalOptions): void;
  error(options?: ModalOptions): void;
  confirm(options?: ModalOptions): void;
  remove(): void;
}
```

以上是改良方向，不是 v1.3.20 目前已經提供的完整型別。

這個拆法的價值在於：你可以清楚知道哪些欄位屬於 `<Modal />`，哪些欄位屬於 `Modal.confirm()`，哪些 method 屬於 service object。

---

### 4.5 `Modal` 的 type surface：`Modal` 與 `ModalInstance` 分別描述不同層次

`types/modal.d.ts` 有兩個 declaration：

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

可以先這樣理解：

```txt
Modal
  -> 比較像 <Modal /> 的 template component props

ModalInstance
  -> 比較像 Modal.confirm(options) 使用的 options 形狀之一

Modal service methods
  -> Modal.info / success / warning / error / confirm / remove
```

這裡最需要注意的是，`ModalInstance` 這個名稱看起來像「命令式 modal instance」或「命令式 options」，但它仍然被宣告成 `DefineComponent<{ ... }>`。這會讓語意有些混淆，因為 `Modal.confirm({ ... })` 接收的通常是一個 options object，而不是一個 Vue component。

如果要讓型別更清楚，可以改成概念上這種分層：

| 型別名稱 | 負責描述 | 使用場景 |
| --- | --- | --- |
| `ModalProps` | `<Modal />` 接收的 props | template 使用 |
| `ModalOptions` | `Modal.confirm(options)` 的 options object | 命令式呼叫 |
| `ModalApi` | `info`、`success`、`warning`、`error`、`confirm`、`remove` methods | service object |
| `ModalExport` | component 與 service api 的合併型別 | `import { Modal }` |

這樣命名會比把 options 寫成 `DefineComponent` 更容易理解，也更符合命令式 API 的使用方式。

---

### 4.6 `Notice` 的位置：同屬命令式浮層 API，但細節需要後續確認

```js
app.config.globalProperties.$Notice = components.Notice;
```

以及：

```ts
$Notice: any;
```

這表示 `Notice` 在整體設計上應該和 `Message`、`Modal` 一樣，屬於 plugin 全域注入的一部分，也需要被視為命令式或 service-style API 來檢查。

這裡只能先建立閱讀方向：

1. 後續應確認 `Notice` runtime 是否也提供 `info`、`success`、`warning`、`error`、`open`、`config`、`destroy` 等方法。
2. 後續應確認 `NoticeConfig` 是否只描述全域設定，還是也涉及單次 notice options。
3. 後續應確認 `Notice` method 是否回傳 close function，或只是建立通知後回傳 `void`。
4. 後續應確認 `$Notice` 是否和 named import 的 `Notice` 應該共享同一個 `NoticeApi` 型別。

因此，本章可以先把 `Notice` 放在「需要用同一套閱讀框架檢查的命令式浮層 API」中，但不展開未提供的細節。

---

### 4.7 `globalProperties` 的弱型別：`any` 只表示存在，不表示安全

`src/index.js` install 會把 `Message`、`Notice`、`Modal` 掛到 Vue app 的 `globalProperties`：

```js
app.config.globalProperties.$Message = components.Message;
app.config.globalProperties.$Notice = components.Notice;
app.config.globalProperties.$Modal = components.Modal;
```

而 `types/index.d.ts` 中則是：

```ts
$Message: any;
$Notice: any;
$Modal: any;
```

這種寫法的好處是簡單。只要宣告成 `any`，Options API 中的這些呼叫就可以通過：

```ts
this.$Modal.confirm({ title: 'Delete?' });
this.$Message.success('Saved');
```

但這種做法的代價也很明顯。因為 `any` 會讓 TypeScript 放棄檢查，所以以下錯誤都可能不會被攔截：

```ts
this.$Modal.confrim({ title: 'Delete?' }); // method 拼錯
this.$Message.success({ unknowField: true }); // options 欄位拼錯
const result: number = this.$Message.success('Saved'); // 回傳值型別亂接
```

更理想的方向是讓 `ComponentCustomProperties` 使用明確的 API interface：

```ts
declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $Message: MessageApi;
    $Notice: NoticeApi;
    $Modal: ModalApi;
  }
}
```

這樣一來，`this.$Message`、`this.$Notice`、`this.$Modal` 就不只是「存在」，而是有完整 method 提示、參數檢查與回傳值推導。

---

### 4.8 命令式 API 型別應該描述哪些資訊？

命令式 service API 的型別不應該只描述 options object，也不應該只描述 component props。完整來看，它至少應該描述以下幾個面向：

| 面向 | 要回答的問題 | 例子 |
| --- | --- | --- |
| Method names | service object 有哪些公開方法？ | `info`、`success`、`warning`、`error`、`confirm`、`remove` |
| Options object | 每個 method 接受哪些欄位？ | `title`、`content`、`duration`、`onClose` |
| Shortcut input | 是否支援簡寫？ | `Message.success('Saved')` |
| Callback | callback 參數與回傳值是什麼？ | `onOk`、`onCancel`、`onClose` |
| Return value | method 呼叫後回傳什麼？ | close function、`void` |
| Global injection | `this.$Message` 和 named import 是否同型別？ | `$Message: MessageApi` |
| Runtime/type 對齊 | `.d.ts` 是否反映 runtime 實際形狀？ | runtime 有 `success()`，type 也應有 `success()` |

以 `Message` 為例，可以整理成概念上的改良型別：

```ts
interface MessageOptions {
  content?: string;
  render?: () => unknown;
  duration?: number;
  onClose?: () => void;
  closable?: boolean;
  background?: boolean;
}

interface MessageConfig {
  top?: number;
  duration?: number;
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

這樣的型別可以同時支援簡寫、options object、close function、config method 與 destroy method，比單純的 `DefineComponent<{ ... }>` 更接近 runtime service object。

---

## 5. 表格整理

### 5.1 三種契約分層

| 契約層 | 代表使用方式 | 型別應描述什麼 | 本章觀察 |
| --- | --- | --- | --- |
| Component Props | `<Modal v-model="visible" />` | template props、events、slots | `Modal` 比較有這層宣告 |
| Service Options | `Modal.confirm({ title, content })` | 單次命令式呼叫的 options object | `ModalInstance` 比較像 options，但命名與 `DefineComponent` 用法容易混淆 |
| Service API Interface | `Message.success()`、`Modal.remove()` | method names、參數、callback、return value | v1.3.20 型別描述不足 |
| GlobalProperties | `this.$Message.success()` | plugin 注入後的 instance property 型別 | `$Message`、`$Notice`、`$Modal` 為 `any` |

這張表是閱讀本章的核心。只要看到浮層 API，就要先問它屬於哪一層，而不是直接把所有欄位都塞進同一個 declaration。

---

### 5.2 `Message` 型別現況與改良方向

`Message` 的型別落差可以用一句話理解：runtime 暴露的是一組 service methods，但目前 declaration 比較像在描述單次 message 的 options / props。

因此閱讀時不要先問「`Message` 有哪些 props」，而是先拆成四個問題：

1. `Message` 這個物件有哪些公開方法？
2. 這些方法接受字串簡寫，還是接受 options object？
3. 顯示 message 之後，方法是否會回傳手動關閉函式？
4. plugin 注入後的 `this.$Message` 是否和 named import 的 `Message` 共用同一套 API 型別？

| 項目 | Runtime 觀察 | 目前 type surface | 改良方向 |
| --- | --- | --- | --- |
| `Message.success` 等顯示方法 | `info`、`success`、`warning`、`error`、`loading` 都是 service method | `Message` 主要被宣告成 `DefineComponent`，沒有完整列出 method contract | 抽出 `MessageApi`，描述每個 method |
| method 參數 | 單次呼叫可傳入 message options，也可能支援字串簡寫 | `content`、`render`、`duration`、`onClose` 等欄位有被描述，但沒有和 method 參數明確連起來 | 抽成 `MessageOptions`，再用 `string | MessageOptions` 作為 method 參數 |
| `Message.config` | 用來調整全域 message 設定 | 有 `MessageConfig`，但沒有清楚表達它是 `config()` 的參數 | `config(options: MessageConfig): void` |
| `Message.destroy` | 用來清除 message instance | 未明確描述 method | `destroy(): void` |
| return value | 顯示方法會回傳手動關閉函式 | 未明確描述 return type | `type MessageClose = () => void` |
| `$Message` | plugin 會掛到 `globalProperties` | `ComponentCustomProperties` 中是 `any` | `$Message: MessageApi` |

換句話說，`MessageOptions`、`MessageConfig`、`MessageClose` 和 `MessageApi` 不應該混成同一個型別。它們分別負責「單次訊息內容」、「全域設定」、「呼叫後的控制能力」與「整個 service object 的方法集合」。這樣讀者才看得出目前型別缺口在哪裡，也看得出改良方向不是單純補幾個欄位，而是補完整的 service API contract。

---

### 5.3 `Modal` 型別現況與改良方向

| 項目 | Runtime / Type 觀察 | 問題 | 改良方向 |
| --- | --- | --- | --- |
| `Modal` component | `DefineComponent` 描述 `model-value`、`title` 等 | 適合 template props | 抽成 `ModalProps` |
| `ModalInstance` | 描述 `title`、`content`、`onOk`、`onCancel` 等 | 比較像 options，卻使用 `DefineComponent` | 抽成 `ModalOptions` |
| `Modal.confirm` | runtime method | type surface 未明確描述 method contract | `confirm(options?: ModalOptions): void` |
| `Modal.remove` | runtime method | type surface 未明確描述 | `remove(): void` |
| `$Modal` | plugin global property | 型別為 `any` | `$Modal: ModalApi` |

---

### 5.4 閱讀檔案與觀察重點

| 檔案 / 位置 | 角色 | 閱讀重點 |
| --- | --- | --- |
| `src/components/message/index.js` | `Message` runtime service object | 檢查 method names、options 處理、return value |
| `types/message.d.ts` | `Message` type surface | 檢查是否描述 service methods，而不只是 options / props |
| `src/components/modal/index.js` | `Modal` runtime component + service methods | 檢查 `Modal.info`、`Modal.confirm`、`Modal.remove` 如何掛上去 |
| `types/modal.d.ts` | `Modal` 與 `ModalInstance` declaration | 區分 component props 與 imperative options |
| `src/components/notice/index.js` | `Notice` runtime service object | 此處需要後續確認 runtime methods |
| `types/notice.d.ts` | `Notice` type surface | 此處需要後續確認 options、config、api 是否完整 |
| `src/index.js` | plugin install 與 globalProperties 注入 | 檢查 `$Message`、`$Notice`、`$Modal` 來源 |
| `types/index.d.ts` | package entry 與 Vue 型別擴充 | 檢查 `ComponentCustomProperties` 是否用 `any` |

---

## 6. 範例或情境說明

### 6.1 情境一：`Message.success()` 的型別應該保護什麼？

使用者可能會這樣寫：

```ts
const close = Message.success('Saved');

setTimeout(() => {
  close();
}, 1000);
```

如果型別正確，`close` 應該被推導成：

```ts
() => void
```

這樣使用者就知道 `Message.success()` 不是單純顯示訊息後結束，而是會回傳一個可以手動關閉 message 的函式。

如果 declaration 只把 `Message` 寫成 `DefineComponent`，TypeScript 就無法從 `Message.success()` 推導出這種使用方式。這會讓 runtime 的能力沒有被 type system 暴露出來。

---

### 6.2 情境二：`Modal.confirm()` 的 options 不等於 `<Modal />` 的 props

`<Modal />` 的使用方式是：

```vue
<Modal
  v-model="visible"
  title="Edit User"
  :mask-closable="false"
/>
```

這裡的重點是狀態控制與 template rendering。使用者透過 `v-model` 控制顯示與隱藏。

`Modal.confirm()` 則是：

```ts
Modal.confirm({
  title: 'Delete User',
  content: 'Are you sure you want to delete this user?',
  onOk() {
    // delete user
  },
  onCancel() {
    // cancel
  }
});
```

這裡的重點是一次性的命令式呼叫。使用者給一個 options object，library 內部負責建立 modal instance、顯示、處理按鈕 callback，並在適當時機關閉。

兩者都可能有 `title`，但它們不是同一個契約。`title` 在 component props 中是 template 狀態的一部分，在 service options 中是建立臨時 modal instance 的參數之一。這就是為什麼型別上最好拆成 `ModalProps` 與 `ModalOptions`。

---

### 6.3 情境三：`$Modal: any` 讓舊專案可以跑，但不利於長期維護

在 Options API 中，使用者可能寫：

```ts
export default {
  methods: {
    removeUser() {
      this.$Modal.confirm({
        title: 'Delete',
        content: 'Are you sure?',
        onOk: () => {
          this.deleteUser();
        }
      });
    }
  }
};
```

如果 `$Modal` 是 `any`，上面這段程式碼可以通過 TypeScript。但是下面的錯誤也可能通過：

```ts
this.$Modal.confrim({
  titel: 'Delete'
});
```

`confrim` 和 `titel` 都是拼錯，但因為 `$Modal` 是 `any`，TypeScript 不會攔截。這種設計在型別檔維護成本上很低，但對使用者的保護也很低。

對 UI library 來說，完整的 `ModalApi` 不只是增加型別漂亮程度，而是能降低使用者在業務程式中寫錯 API 名稱、options 欄位或 callback 型別的機率。

---

## 7. 閱讀路線或學習路線

### 7.1 初次閱讀路線

第一次讀這類命令式 API 時，不建議一開始就看 `.d.ts`。因為 `.d.ts` 可能不完整，甚至可能和 runtime shape 有落差。建議先從 runtime 看起。

1. 先看 `src/components/message/index.js`，確認 `Message` 實際 export 出來的是 component 還是 service object。
2. 接著看 `Message.info`、`Message.success`、`Message.warning`、`Message.error`、`Message.loading` 是否都走同一個內部方法。
3. 觀察 `notice(...)` 或 instance 建立流程，確認 method 呼叫後會回傳什麼。
4. 再看 `types/message.d.ts`，檢查 declaration 是否完整描述剛剛看到的 runtime methods。
5. 最後看 `types/index.d.ts`，確認 `$Message` 是否有具體型別，還是只是 `any`。

這樣可以避免只看 `.d.ts` 而誤以為 `Message` 是單純 component。

---

### 7.2 深入閱讀路線

對 `Modal` 可以採取類似路線，但要多注意它的雙重角色。

1. 先看 `src/components/modal/index.js`，確認 `Modal.info`、`Modal.success`、`Modal.warning`、`Modal.error`、`Modal.confirm`、`Modal.remove` 如何掛到 `Modal` 上。
2. 再看 `Modal` 原本作為 component 時的 props 與事件。
3. 接著看命令式 modal 建立 instance 的方式，例如是否有 `newInstance` 或類似工廠方法。
4. 回頭看 `types/modal.d.ts`，將 `Modal` 與 `ModalInstance` 分別對應到 component props 與 service options。
5. 檢查是否缺少 `ModalApi` interface。
6. 最後檢查 plugin install 的 `$Modal` 是否和 named import `Modal` 有一致型別。

---

### 7.3 可以暫時跳過的部分

初次閱讀時，可以暫時跳過浮層 DOM 掛載細節、動畫細節、z-index 管理、transition、樣式 class 組裝與 queue 管理。這些對理解 overlay runtime 很重要，但不是本章 TypeScript public API 的主軸。

本章的首要目標是建立一個判斷框架：

```txt
它是 component props？
還是 service options？
還是 service api methods？
還是 plugin global property？
```

只要能分清這四層，就能有效閱讀命令式 API 的 `.d.ts` 設計。

---

## 8. 常見誤區

| 誤區 | 為什麼容易誤解 | 正確理解 |
| --- | --- | --- |
| 看到 `DefineComponent` 就以為它完整描述了 API | Vue 元件型別很常用，容易把所有 export 都當成 component | `DefineComponent` 適合描述元件，但 service object 應該有自己的 API interface |
| 以為 `MessageConfig` 就是完整 `MessageApi` | `Config` 名稱看起來像 public type | `MessageConfig` 只描述 config options，不等於 `success`、`destroy` 等 methods |
| 把 `<Modal />` props 和 `Modal.confirm()` options 混在一起 | 兩者都有 `title` 等重疊欄位 | 欄位名稱重疊不代表契約相同，應拆成 `ModalProps` 與 `ModalOptions` |
| 以為 `$Modal: any` 代表型別支援完整 | `any` 可以讓程式通過編譯 | `any` 只代表不檢查，不代表 TypeScript 知道 API |
| 只看 `types/*.d.ts` 不看 runtime | 型別檔比較短，容易先看 | 對 public API 來說，要先知道 runtime 真正 export 什麼，再檢查 type 是否對齊 |
| 以為 named import 和 `this.$Message` 一定同型別 | 兩者都是同一個功能入口 | 需要 declaration 明確讓它們共享同一個 interface，否則可能一邊有型別一邊是 `any` |
| 看到 `ModalInstance` 就以為它是執行後回傳的 instance | 名稱含有 `Instance` | 從原始片段看，它比較像命令式 modal options declaration；實際語意仍需對照 runtime 確認 |

---

## 9. 本章總結

`Message`、`Notice`、`Modal` 這類浮層 API 是理解 View UI Plus 型別系統的重要案例，因為它們不像 `Button` 或 `Input` 那樣只透過 template component 使用。它們經常以 service-style method 的形式出現，例如 `Message.success()`、`Modal.confirm()`、`this.$Message.info()`、`this.$Modal.remove()`。

這類 API 的型別設計不能只停留在 `DefineComponent<Props>`。`DefineComponent` 可以描述 template component，但無法完整表達 service object 的 method names、options object、callbacks、return value 與 plugin global property。

`Modal` 則展示另一個典型問題：它同時是 template component 與 imperative service。`<Modal v-model="visible" />` 使用的是 component props；`Modal.confirm({ ... })` 使用的是 service options；`Modal.info`、`Modal.success`、`Modal.remove` 則屬於 service api methods。這三層如果混在一起，型別文件會難以維護，使用者也容易誤解 API。

最後，`globalProperties` 的 `$Message`、`$Notice`、`$Modal` 若宣告成 `any`，雖然可以讓 Options API 呼叫通過編譯，但 TypeScript 無法提供 method 提示、參數檢查與回傳值保護。更理想的方向是把 named import 與 plugin global property 都連到同一套 `MessageApi`、`NoticeApi`、`ModalApi` interface。

本章最重要的心智模型是：

```txt
component props
  -> template 使用

service options
  -> 命令式 method 的參數物件

service api interface
  -> service object 的 methods 與 return value

globalProperties type
  -> this.$Service 的型別入口
```

閱讀 View UI Plus 或其他 UI library 的命令式 API 時，只要能穩定套用這四層，就能更精準地判斷 `.d.ts` 是否完整、runtime/type 是否對齊，以及未來若要重構型別應該從哪裡下手。

---

## 10. 自我檢查問題

1. 為什麼 `Message`、`Notice`、`Modal` 這類浮層 API 不能只用一般 component props 的角度理解？
2. `Message.success()` runtime 回傳什麼？這個回傳值在型別上應該如何描述？
3. `MessageConfig` 和完整的 `MessageApi` 有什麼差別？
4. 為什麼 `types/message.d.ts` 中的 `Message: DefineComponent<{ ... }>` 無法完整描述 runtime 上的 `Message.success()`、`Message.config()`、`Message.destroy()`？
5. `Modal` 為什麼同時具有 component 與 imperative service 的角色？
6. `<Modal v-model="visible" />` 使用的 `ModalProps` 和 `Modal.confirm({ ... })` 使用的 `ModalOptions` 差在哪裡？
7. `ModalInstance` 為什麼容易讓讀者困惑？它比較像 instance、options，還是 component declaration？
8. `$Message: any`、`$Notice: any`、`$Modal: any` 讓 TypeScript 知道什麼？又讓 TypeScript 放棄檢查什麼？
9. 如果要為 `Message` 補上更完整型別，你會如何拆分 `MessageOptions`、`MessageConfig`、`MessageClose` 與 `MessageApi`？
10. 閱讀命令式 API 時，為什麼應該先看 runtime source，再回頭檢查 `.d.ts`？

---

## 11. 後續延伸方向

1. **`Message` runtime 實作分析**：深入閱讀 `src/components/message/index.js`、instance 建立流程、`notice(...)`、queue 管理與 close function 的生成方式。
2. **`Notice` 型別與 runtime 對照分析**：補齊 `src/components/notice/index.js` 與 `types/notice.d.ts` 的完整閱讀，確認它和 `Message` 的差異。
3. **`Modal` 命令式 instance 建立流程**：分析 `Modal.confirm()` 如何建立臨時 modal instance，以及 `remove()` 如何關閉。
4. **Vue plugin `globalProperties` 型別擴充**：整理 `ComponentCustomProperties` 如何正確補上 `$Message`、`$Notice`、`$Modal`。
5. **Public API runtime/type 同步檢查表**：建立一份檢查清單，用於確認 `src/components/index.js`、`types/viewuiplus.components.d.ts`、`types/index.d.ts` 是否一致。
6. **Service API 型別重構練習**：嘗試設計 `MessageApi`、`NoticeApi`、`ModalApi`，並比較使用 `any`、`Function`、明確 interface 的差異。
7. **Overlay 類元件的架構分析**：從型別延伸到 runtime，分析浮層元件如何處理掛載、銷毀、動畫、層級與全域設定。
