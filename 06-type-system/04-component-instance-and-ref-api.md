# Component Instance and Ref API：Instance、Template Ref 與 Public Methods

## 1. 本章定位

本章討論 component instance 與 template ref 的型別邊界。

對 Vue component library 來說，public API 不只有 props 和 emits。有些元件也會讓使用者透過 `ref` 呼叫方法，例如 `Input` 的 `focus()`、`blur()`，或命令式 service 的 `remove()`、`destroy()`。

View UI Plus v1.3.20 的主要實作是 Options API，元件 methods 寫在 runtime source 中，但 `.d.ts` 的 `DefineComponent<{ ... }>` 多數只描述 props、listener props、slots。這代表：

> 使用者能在 runtime 呼叫某些 instance methods，不代表 declaration 已經完整描述 template ref 可見的方法。

---

## 2. Instance API 是什麼

component instance API 是使用者透過 component ref 拿到的公開能力。

例如：

```vue
<template>
  <Input ref="inputRef" />
</template>
```

使用者可能想在程式中呼叫：

```ts
inputRef.value?.focus();
inputRef.value?.blur();
```

runtime 是否可行，要看 `src/components/input/input.vue` 是否有 methods：

```js
methods: {
    focus (option) {
        const $el = this.type === 'textarea' ? this.$refs.textarea : this.$refs.input;
        $el.focus(option);
        // ...
    },
    blur () {
        if (this.type === 'textarea') {
            this.$refs.textarea.blur();
        } else {
            this.$refs.input.blur();
        }
    }
}
```

這表示 runtime instance 上確實有 `focus()` 和 `blur()`。

---

## 3. `DefineComponent` 描述到哪裡

`types/input.d.ts` 的主要形狀是：

```ts
export declare const Input: DefineComponent<{
    'model-value'?: string | number;
    type?: 'text' | 'password' | 'textarea' | 'url' | 'email' | 'date' | 'number' | 'tel';
    onOnChange?: (event?: any) => any;
    'v-slots'?: {
        prepend?: () => any;
        append?: () => any;
        prefix?: () => any;
        suffix?: () => any;
    };
}>
```

這裡沒有明確把 `focus()`、`blur()` 放進 public instance type。

在現代 Vue + TypeScript 中，如果要精準描述 template ref，通常會需要額外的 instance 型別，例如：

```ts
export type InputInstance = InstanceType<typeof Input>;
```

或手動宣告：

```ts
export interface InputRef {
  focus(option?: FocusOptions & { cursor?: 'start' | 'end' | 'all' }): void;
  blur(): void;
}
```

但 v1.3.20 的 declaration 主要不是這種風格。

---

## 4. Runtime 可呼叫不等於 Type Surface 完整

這裡要建立一個重要區分：

| 層次 | 問題 | 來源 |
| --- | --- | --- |
| runtime instance | `this.focus()` 或 `ref.focus()` 是否真的存在？ | `src/components/**/*.vue` 的 methods |
| type instance | TypeScript 是否知道 ref 上有 `focus()`？ | `.d.ts` 的 component instance 型別 |
| public contract | 這個 method 是否應該承諾給使用者？ | 文件、types、測試與相容性策略 |

一個 method 可能只是元件內部實作需要，不應被使用者依賴。也可能雖然沒在 `.d.ts` 中描述，但文件已經鼓勵使用者透過 ref 呼叫，這時就代表 type surface 不完整。

---

## 5. Options API Methods 的可見性

View UI Plus 的 Options API methods 沒有像 Vue 3 `<script setup>` 的 `defineExpose()` 那樣清楚分隔 private / public。

Options API 中寫在 `methods` 的函式，實務上可能被 component instance 拿到：

```js
methods: {
  handleInput(event) { ... },
  setCurrentValue(value) { ... },
  resizeTextarea() { ... },
  focus(option) { ... },
  blur() { ... }
}
```

但不是每個 method 都應視為 public API。

| Method | 可能角色 |
| --- | --- |
| `focus()`、`blur()` | 比較像 public ref API |
| `handleInput()`、`handleClear()` | 內部事件處理 |
| `setCurrentValue()` | 內部狀態同步 |
| `resizeTextarea()` | 內部 layout 更新，可能可用但不一定承諾 |

型別設計時不能把所有 methods 都暴露出去，否則會讓內部實作變成相容性包袱。

---

## 6. InstanceType 的使用方式

對使用者來說，如果 component declaration 足夠完整，理論上可以這樣取得 instance 型別：

```ts
import { Input } from 'view-ui-plus';

type InputInstance = InstanceType<typeof Input>;
```

但 `InstanceType<typeof Input>` 能拿到什麼，取決於 `Input` 的 declaration 是否描述了 methods。若 `.d.ts` 只描述 props，則 ref method 的提示可能不完整。

因此在 View UI Plus v1.3.20 中，`InstanceType<typeof Xxx>` 的學習重點是：

1. 它是 Vue component instance 型別的常見入口。
2. 它不能憑空推導 declaration 沒描述的 public methods。
3. 如果 library 希望承諾 ref methods，應該補對應 instance type 或更完整的 `DefineComponent` generic。

---

## 7. Slots 也不是 Instance API

有些 `.d.ts` 會用特殊欄位描述 slots：

```ts
'v-slots'?: {
    prepend?: () => any;
    append?: () => any;
}
```

這是 template / JSX 使用者看到的 slot contract，不是 component instance method。

不要把以下幾種 API 混在一起：

| API 類型 | 範例 |
| --- | --- |
| props | `'model-value'?: string | number` |
| listener props | `onOnChange?: ...` |
| slots | `'v-slots'?: { append?: () => any }` |
| instance methods | `focus()`、`blur()` |
| global instance properties | `this.$Message`、`this.$Modal` |

---

## 8. Service Object 和 Component Instance 不同

`Message`、`Modal` 這類命令式 API 不是單純的 component ref。

例如 `src/components/message/index.js` 對外提供：

```js
export default {
    info(options) { ... },
    success(options) { ... },
    warning(options) { ... },
    error(options) { ... },
    loading(options) { ... },
    config(options) { ... },
    destroy() { ... }
}
```

這種 API 的型別應該被看成 service object contract，而不是 component instance contract。它可能被 named import：

```ts
import { Message } from 'view-ui-plus';
```

也可能被 plugin 掛到：

```ts
this.$Message.info('Saved');
```

這類內容會在 `08-overlay-and-imperative-api-types.md` 更完整整理。

---

## 9. Public Method 型別設計建議

如果要改善 View UI Plus 的 ref API 型別，可以採取保守策略：

1. 只暴露文件明確承諾的 public methods。
2. 不暴露 `handleXxx`、`setXxx` 這類內部方法。
3. 為常用元件提供 `XxxInstance` 型別。
4. 對 ref methods 補參數與回傳值。
5. 避免把整個 Options API instance 都視為穩定 public API。

例如：

```ts
export interface InputInstance {
  focus(option?: FocusOptions & { cursor?: 'start' | 'end' | 'all' }): void;
  blur(): void;
}
```

這樣的 declaration 比單純依賴 `any` 更能幫助使用者，但又不會把內部 methods 全部公開。

---

## 10. 本章結論

View UI Plus 的 `.d.ts` 主要描述 props、listener props 與部分 slots，對 template ref instance methods 的描述相對有限。讀 component instance API 時，必須回到 runtime methods 檢查哪些方法真的存在，再判斷它是否應視為 public API。

`Input.focus()`、`Input.blur()` 是很好的案例：runtime 上存在，但 type surface 是否完整承諾，需要檢查 declaration。這提醒我們，component library 的型別系統不應只關心 props，也應關心 ref API 與 service object API。

---

## 11. 自我檢查問題

1. component instance API 和 props API 有什麼差別？
2. 為什麼 Options API 的所有 methods 不應全部視為 public API？
3. `InstanceType<typeof Input>` 能不能保證取得 `focus()` 型別？取決於什麼？
4. `v-slots` 是 instance API 嗎？
5. 為什麼 `Message.info()` 應視為 service object contract，而不是 component ref contract？

