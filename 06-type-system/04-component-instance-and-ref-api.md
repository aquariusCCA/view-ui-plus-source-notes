# Component Instance and Ref API：Instance、Template Ref 與 Public Methods

## 1. 本章定位

本章是 `06-type-system/` 中討論 **component instance、template ref 與 public methods 型別設計** 的專章。

在前面的 props 與 emits 筆記中，我們主要關心使用者在 template 或 TSX 中「傳入什麼」與「監聽什麼」。但 component library 的 public API 不只這些。有些元件會允許使用者透過 `ref` 取得元件實例，並呼叫實例上的方法，例如：

```vue
<template>
  <Input ref="inputRef" />
</template>
```

```ts
inputRef.value?.focus();
inputRef.value?.blur();
```

這類 API 不屬於 props，也不屬於 emits，而是 **component instance API** 或 **template ref API**。

本章要回答四個問題：

1. View UI Plus runtime 中的 component methods，哪些可能成為使用者透過 `ref` 呼叫的 public API？
2. `.d.ts` 中的 `DefineComponent<{ ... }>` 是否完整描述了這些 instance methods？
3. `InstanceType<typeof Component>` 在閱讀 component instance 型別時能提供什麼，又有哪些限制？
4. `Message.info()`、`Modal.confirm()` 這類命令式 API，為什麼不應該和 component ref API 混為一談？

本章不會完整分析所有元件的 ref API，也不會展開 `Message`、`Modal` 等 overlay service 的所有型別細節；這些內容適合放到後續的 imperative API 專章中處理。

---

## 2. 學習前先建立的基本觀念

### 2.1 Component instance 是什麼

在 Vue 中，component instance 可以理解為某個元件在 runtime 建立出來的實例。使用者平常透過 template 使用元件時，多數只會接觸 props、events 與 slots；但當使用者在元件上加上 `ref`，就可能取得這個元件實例，並呼叫實例上暴露的方法。

例如：

```vue
<template>
  <Input ref="inputRef" />
</template>
```

```ts
import { ref } from 'vue';

const inputRef = ref();

function focusInput() {
  inputRef.value?.focus();
}
```

這裡的 `inputRef.value` 就不是單純的 DOM element，而是元件實例或元件暴露出的 public instance。它可能包含元件方法，例如 `focus()`、`blur()`。

### 2.2 Template ref API 和 props / emits 不同

props、emits、slots 都是 declarative API，也就是使用者主要透過 template 宣告元件使用方式：

```vue
<Input
  v-model="keyword"
  placeholder="請輸入關鍵字"
  @on-change="handleChange"
/>
```

但 ref API 屬於 imperative API，也就是使用者在程式流程中主動呼叫方法：

```ts
inputRef.value?.focus();
```

兩者的差別在於：

| API 類型 | 使用方式 | 關心重點 |
| --- | --- | --- |
| props | `<Input placeholder="..." />` | 使用者可以傳入哪些值 |
| emits / listener props | `<Input @on-change="..." />` | 元件會對外發出哪些事件 |
| slots | `<template #prepend>` | 使用者可以插入哪些內容區塊 |
| instance / ref methods | `inputRef.value?.focus()` | 使用者能否透過 ref 呼叫方法 |

因此讀 View UI Plus 型別系統時，不能只看 props 和 emits；如果元件有可被使用者依賴的 ref methods，也應該檢查 `.d.ts` 是否有描述。

### 2.3 Options API methods 沒有天然區分 public / private

View UI Plus v1.3.20 的主要實作風格是 Options API。Options API 中的 method 通常寫在 `methods` 區塊：

```js
methods: {
  handleInput(event) { ... },
  setCurrentValue(value) { ... },
  focus(option) { ... },
  blur() { ... }
}
```

問題在於，`methods` 裡的函式不一定都是 public API。像 `focus()`、`blur()` 可能是設計給使用者透過 ref 呼叫的；但 `handleInput()`、`setCurrentValue()` 更像元件內部流程需要的輔助方法。

在 Vue 3 `<script setup>` 中，可以用 `defineExpose()` 明確指定要暴露給外部 ref 的方法；但 Options API 沒有這麼清楚的分界。因此閱讀舊式或 Options API 元件時，需要額外判斷：**runtime instance 上能拿到，不代表 library 應該把它當成穩定 public API 承諾出去**。

---

## 3. 整體概覽

View UI Plus 的 instance / ref API 可以先分成三個層次來看：

```txt
runtime source
  -> src/components/**/*.vue 的 methods
  -> 決定實際執行時有哪些方法存在

component declaration
  -> types/*.d.ts 的 DefineComponent<...>
  -> 決定 TypeScript 是否知道 props、listener props、slots、instance methods

public contract
  -> 文件、使用慣例、types、測試與相容性策略
  -> 決定哪些方法應被視為穩定公開 API
```

這三個層次不一定完全同步。

例如 `Input` 的 runtime 可能有 `focus()`、`blur()`，使用者在執行時也可能呼叫成功；但如果 `types/input.d.ts` 沒有把這些方法納入 instance type，TypeScript 使用者就不一定能在 ref 上得到正確提示。

可以用以下表格建立本章的基本地圖：

| 層次 | 主要問題 | 代表來源 | 閱讀重點 |
| --- | --- | --- | --- |
| Runtime instance | 方法在執行時是否真的存在？ | `src/components/**/*.vue` 的 `methods` | 搜尋 `focus()`、`blur()`、`clear()`、`reset()` 等方法 |
| Type instance | TypeScript 是否知道這些方法？ | `types/*.d.ts`、`DefineComponent`、`InstanceType` | 檢查 declaration 是否描述 ref methods |
| Public contract | 這些方法是否應該承諾給使用者？ | 文件、範例、測試、歷史相容性 | 分辨公開能力與內部實作細節 |
| Service object | 是否是命令式服務 API？ | `src/components/message/index.js`、`modal/index.js` | 不要誤認為 component ref API |

---

## 4. 核心內容逐步講解

### 4.1 從 `Input` 看 component instance API

`Input` 是理解 component ref API 的好案例，因為輸入框元件常見需求就是讓外部程式主動聚焦或失焦。

在使用者端，可能會出現這種寫法：

```vue
<template>
  <Input ref="inputRef" />
  <Button @click="focusInput">聚焦輸入框</Button>
</template>
```

```ts
const inputRef = ref();

function focusInput() {
  inputRef.value?.focus();
}
```

這代表使用者不只是透過 props 控制 `Input`，而是希望拿到 `Input` 實例並主動呼叫 `focus()`。

`src/components/input/input.vue` 的 `methods` 中確實有 `focus()` 與 `blur()`：

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

這表示 runtime instance 上確實有這兩個方法。從執行時角度看，`Input` 可以被當成有 `focus()`、`blur()` 的元件實例來使用。

但這只回答了 runtime 層次的問題，還沒有回答 TypeScript 層次的問題：

> TypeScript 是否知道 `inputRef.value` 上有 `focus()` 與 `blur()`？

這就要回到 `types/input.d.ts` 檢查 declaration 是否有描述 instance methods。

### 4.2 `DefineComponent` 主要描述了什麼

`types/input.d.ts` 形狀大致如下：

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

這個 declaration 很明顯主要在描述三類東西：

1. props，例如 `'model-value'`、`type`。
2. listener props，例如 `onOnChange`。
3. slots，例如 `'v-slots'` 裡的 `prepend`、`append`、`prefix`、`suffix`。

但它沒有明確出現：

```ts
focus(...): ...
blur(...): ...
```

因此可以得到一個重要結論：**View UI Plus v1.3.20 的許多 component declaration，重點是 template 使用面的 props / events / slots，而不是完整刻畫 component ref instance methods。**

這並不代表 runtime 不能呼叫 `focus()`，而是代表 `.d.ts` 的 type surface 可能沒有完整承諾這個 ref API。

### 4.3 Runtime 可呼叫不等於 Type Surface 完整

閱讀 View UI Plus 型別時，要特別避免一個誤解：

> 只要 runtime method 存在，TypeScript 就應該自動知道。

事實上，TypeScript 只看 declaration。對外發佈的 `.d.ts` 沒有描述某個方法，使用者就可能無法在 IDE 或型別檢查中得到完整提示。

可以用以下表格區分三種層次：

| 層次 | 問題 | 來源 | 以 `Input.focus()` 為例 |
| --- | --- | --- | --- |
| Runtime instance | 執行時是否有這個方法？ | `src/components/input/input.vue` 的 `methods` | runtime 有 `focus()` |
| Type surface | TypeScript 是否知道這個方法？ | `types/input.d.ts` | declaration 主要描述 props / listener / slots，未明確列出 `focus()` |
| Public contract | 這是否是穩定公開 API？ | 文件、範例、測試、型別宣告 | 需要後續確認文件或官方使用方式 |

這個區分很重要。若只看 runtime，可能會把內部方法誤認成正式 API；若只看 `.d.ts`，又可能忽略 runtime 中實際可用但型別未補齊的能力。

### 4.4 Options API methods 應該如何分類

Options API 的 `methods` 容易讓初學者誤判，因為所有方法都被放在同一個區塊，但它們的角色並不相同。

以 `Input` 這類元件為例，methods 可能包含：

```js
methods: {
  handleInput(event) { ... },
  handleClear() { ... },
  setCurrentValue(value) { ... },
  resizeTextarea() { ... },
  focus(option) { ... },
  blur() { ... }
}
```

可以先用以下方式分類：

| Method 類型 | 範例 | 是否適合當 public ref API | 判斷理由 |
| --- | --- | --- | --- |
| 使用者操作型 method | `focus()`、`blur()` | 通常較適合 | 使用者常有主動聚焦、失焦需求 |
| 事件處理 method | `handleInput()`、`handleClear()` | 通常不適合 | 多半是 template event handler 或內部流程 |
| 狀態同步 method | `setCurrentValue()` | 通常不適合 | 牽涉元件內部狀態一致性，不宜外部任意呼叫 |
| Layout / DOM 更新 method | `resizeTextarea()` | 視情況而定 | 可能有使用場景，但需要文件明確承諾 |

型別設計時不能把整個 Options API instance 全部暴露出去。否則一旦使用者依賴內部 methods，未來重構這些 methods 就會變成 breaking change。

比較保守的做法是：只把文件明確承諾、使用者合理需要、且長期穩定的方法納入 `XxxInstance` 型別。

### 4.5 `InstanceType<typeof Component>` 的用途與限制

在 Vue + TypeScript 中，常見的 instance 型別取得方式是：

```ts
import { Input } from 'view-ui-plus';

type InputInstance = InstanceType<typeof Input>;
```

這個寫法的意思是：從 `Input` 這個 component constructor / component declaration 推導出它的 instance 型別。

但要注意：`InstanceType<typeof Input>` 不是魔法。它能推導出什麼，取決於 `Input` 本身的 declaration 是否足夠完整。

如果 `types/input.d.ts` 的 `DefineComponent` 只描述 props、listener props、slots，而沒有描述 public methods，那麼 `InstanceType<typeof Input>` 不一定能提供完整的 `focus()`、`blur()` 提示。

因此它的使用重點是：

1. `InstanceType<typeof Xxx>` 是讀取 component instance 型別的常見入口。
2. 它只能根據 declaration 推導，不能憑空知道 `.vue` runtime methods。
3. 如果 library 想正式承諾 ref methods，應該在 declaration 中補上更完整的 instance type。

也就是說，`InstanceType` 是使用 type surface 的工具，而不是修復 type surface 不完整的工具。

### 4.6 如何設計更清楚的 public ref API 型別

如果要改善 View UI Plus 這類元件庫的 ref API 型別，可以採取「保守公開」策略。

例如 `Input` 可以額外提供：

```ts
export interface InputInstance {
  focus(option?: FocusOptions & { cursor?: 'start' | 'end' | 'all' }): void;
  blur(): void;
}
```

或至少提供較簡化的版本：

```ts
export interface InputInstance {
  focus(option?: any): void;
  blur(): void;
}
```

前者型別較精準，能描述 `focus()` 參數；後者較寬鬆，但仍比完全沒有 ref method 型別更清楚。

不過，設計 public ref API 型別時要避免過度暴露：

```ts
// 不建議：把內部 methods 全部變成 public contract
export interface InputInstance {
  handleInput(event: Event): void;
  handleClear(): void;
  setCurrentValue(value: string | number): void;
  resizeTextarea(): void;
  focus(option?: any): void;
  blur(): void;
}
```

這樣做會把內部實作細節變成對外承諾。未來只要重構 `handleInput()` 或 `setCurrentValue()`，就可能影響使用者。

比較理想的型別設計是：

```ts
export interface InputInstance {
  focus(option?: FocusOptions & { cursor?: 'start' | 'end' | 'all' }): void;
  blur(): void;
}
```

這種設計只暴露使用者真正需要的 public methods，並避免把內部流程鎖死。

### 4.7 Slots 不是 instance API

`'v-slots'` 不是 instance API。這點很重要。

在 `.d.ts` 中可能會看到：

```ts
'v-slots'?: {
    prepend?: () => any;
    append?: () => any;
}
```

這種寫法描述的是使用者可以在 template / JSX 中提供哪些 slots，例如：

```vue
<Input>
  <template #prepend>https://</template>
  <template #append>.com</template>
</Input>
```

它不代表 `inputRef.value.prepend()` 或 `inputRef.value.append()` 這類 instance method 存在。

因此閱讀 component declaration 時，要把以下 API 分開：

| API 類型 | declaration 中可能看到的形式 | 使用方式 |
| --- | --- | --- |
| props | `'model-value'?: string | number` | `<Input v-model="value" />` |
| listener props | `onOnChange?: (event?: any) => any` | `<Input @on-change="handler" />` 或 TSX listener |
| slots | `'v-slots'?: { append?: () => any }` | `<template #append>` |
| instance methods | `focus()`、`blur()` | `inputRef.value?.focus()` |
| global instance properties | `$Message`、`$Modal` | `this.$Message.info(...)` |

把這些混在一起，會造成型別閱讀上的錯誤。例如看到 `v-slots` 時以為它是 ref 上的方法，就是典型誤判。

### 4.8 Service object contract 不是 component ref contract

`Message`、`Modal` 這類命令式 API 是另一種 public API，它們不是透過 component template ref 使用，而是透過 service object 呼叫。

`src/components/message/index.js` 可能提供：

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

使用者可能這樣使用：

```ts
import { Message } from 'view-ui-plus';

Message.success('Saved');
Message.destroy();
```

或在 plugin 安裝後透過 Vue instance 使用：

```ts
this.$Message.info('Saved');
```

這種 API 的型別設計應該看成 **service object contract**，而不是 component instance contract。

兩者差異如下：

| 類型 | 使用入口 | 範例 | 型別設計重點 |
| --- | --- | --- | --- |
| Component ref API | template ref | `inputRef.value?.focus()` | 描述元件實例上暴露的方法 |
| Service object API | named import 或 global property | `Message.info()`、`this.$Message.info()` | 描述 service 方法、options、回傳值 |
| Global instance property | plugin 掛載到 Vue app | `this.$Modal.confirm()` | 需要 module augmentation 補全 `$Modal` |

因此，本章只建立 service object 與 component instance 的邊界。`Message`、`Modal` 的 options、instance、destroy/remove 行為，應該在 overlay / imperative API 型別專章中深入整理。

---

## 5. 表格整理

### 5.1 Component instance / ref API 閱讀表

| 項目 | 位置 / 寫法 | 角色 | 閱讀重點 |
| --- | --- | --- | --- |
| Runtime methods | `src/components/**/*.vue` 的 `methods` | 決定執行時 instance 上可能有哪些方法 | 不要直接把所有 methods 視為 public API |
| Template ref | `<Input ref="inputRef" />` | 使用者取得 component instance 的入口 | 需要確認 ref 型別是否有方法提示 |
| `DefineComponent` | `types/*.d.ts` | 描述 component 的 type surface | 多數情況主要描述 props、listeners、slots |
| `InstanceType<typeof Xxx>` | `type XxxInstance = InstanceType<typeof Xxx>` | 從 component declaration 推導 instance 型別 | 取決於 declaration 是否完整描述 methods |
| `XxxInstance` interface | `export interface InputInstance { ... }` | 明確定義 public ref methods | 適合暴露穩定、文件化的方法 |
| Service object | `Message.info()`、`Modal.confirm()` | 命令式 API | 不應混為 component template ref API |

### 5.2 API 類型比較表

| API 類型 | 使用場景 | 範例 | 是否透過 ref | 是否屬於本章主題 |
| --- | --- | --- | --- | --- |
| Props | 傳入元件設定 | `<Input disabled />` | 否 | 間接相關 |
| Emits | 監聽元件事件 | `<Input @on-change="fn" />` | 否 | 間接相關 |
| Slots | 插入內容區塊 | `<template #append>` | 否 | 需要區分 |
| Ref methods | 主動呼叫元件方法 | `inputRef.value?.focus()` | 是 | 是 |
| Service methods | 命令式建立或控制服務 | `Message.success()` | 否 | 只做邊界說明 |
| Global properties | plugin 掛載到 Vue instance | `this.$Message` | 否 | 後續章節處理 |

### 5.3 Public method 判斷表

| 判斷問題 | 說明 | 對型別設計的影響 |
| --- | --- | --- |
| 文件是否有描述？ | 官方文件或範例是否鼓勵使用者呼叫 | 有描述者較適合納入 public instance type |
| 方法名稱是否像內部 handler？ | 例如 `handleInput`、`setCurrentValue` | 通常不應公開 |
| 使用者是否有合理需求？ | 例如 `focus()`、`blur()`、`clear()` | 較可能成為穩定 ref API |
| 是否牽涉內部狀態一致性？ | 外部任意呼叫可能破壞狀態 | 應避免公開或需嚴格設計 |
| 是否已有 `.d.ts` 描述？ | Type surface 是否已承諾 | 若已承諾，修改時要注意相容性 |

---

## 6. 範例或情境說明

### 6.1 使用者想控制 `Input` 聚焦

假設使用者希望點擊按鈕後，讓 `Input` 自動聚焦：

```vue
<template>
  <Input ref="inputRef" />
  <Button @click="focusInput">Focus</Button>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Input } from 'view-ui-plus';

const inputRef = ref();

function focusInput() {
  inputRef.value?.focus();
}
</script>
```

這段程式在 runtime 是否可行，要看 `Input` runtime methods 是否有 `focus()`。

但如果希望 TypeScript 也能提供提示，理想上應該讓 ref 具備明確型別：

```ts
import type { InputInstance } from 'view-ui-plus';

const inputRef = ref<InputInstance>();

function focusInput() {
  inputRef.value?.focus();
}
```

若 View UI Plus v1.3.20 沒有提供 `InputInstance`，使用者可能只能自行補型別：

```ts
interface InputRef {
  focus(option?: any): void;
  blur(): void;
}

const inputRef = ref<InputRef>();
```

這種做法可以改善專案內部的型別提示，但它是使用者端的補強，不等於 library 官方宣告。

### 6.2 Library 維護者如何決定是否補 `InputInstance`

如果站在元件庫維護者角度，要不要補 `InputInstance`，可以按照以下流程判斷：

```txt
runtime methods 中有 focus / blur
  -> 使用者是否常需要透過 ref 呼叫？
  -> 文件是否已經或應該承諾？
  -> 方法參數與回傳值是否穩定？
  -> 若穩定，補 InputInstance
  -> 若不穩定，先不要公開，或標註為內部方法
```

這種流程可以避免兩種極端：

1. 完全不描述 ref API，導致使用者失去 TypeScript 提示。
2. 把所有 methods 都公開，導致內部實作被 API 相容性綁死。

---

## 7. 閱讀路線或學習路線

閱讀 View UI Plus 的 component instance / ref API 時，建議採用以下順序。

### 7.1 初次閱讀路線

1. **先看使用場景**  
   先判斷這個元件是否有使用者主動呼叫方法的需求。例如 `Input`、`Form`、`Table`、`Modal` 這類元件，比一般展示型元件更可能需要 ref API。

2. **再看 runtime methods**  
   到 `src/components/<component>/**` 搜尋 `methods`，找出 `focus()`、`blur()`、`resetFields()`、`validate()`、`clearSelection()` 等可能被外部使用的方法。

3. **分類 methods 的角色**  
   把 methods 分成 public-like methods、internal handlers、state sync methods、layout methods。不要看到 methods 就全部視為 public API。

4. **回到 `types/*.d.ts` 檢查 declaration**  
   看 `.d.ts` 是否只描述 props / listener props / slots，還是有額外描述 instance type。

5. **嘗試用 `InstanceType<typeof Xxx>` 理解型別表面**  
   如果 declaration 足夠完整，`InstanceType` 可以幫助取得 instance type；如果 declaration 不完整，這一步也會暴露 type surface 的缺口。

### 7.2 深入閱讀路線

1. **對照官方文件或使用範例**  
   確認 runtime method 是否真的被文件當成 public API 使用。

2. **檢查全域 API 與 service API**  
   如果是 `Message`、`Modal`、`Notice` 這類命令式 API，要改從 service object contract 的角度閱讀。

3. **整理型別缺口**  
   標記哪些 runtime 可用但 `.d.ts` 未描述，哪些 `.d.ts` 有描述但 runtime 行為需要確認。

4. **提出保守改良方案**  
   優先補文件化、使用者常用、低風險的方法，例如 `focus()`、`blur()`。

### 7.3 可以暫時跳過的部分

初次閱讀時，不需要立刻分析所有內部 methods。像 `handleXxx`、`setXxx`、`updateXxx` 這些內部流程方法，可以先標記但不深入。真正要優先理解的是：哪些 methods 可能是使用者會透過 ref 呼叫的穩定能力。

---

## 8. 常見誤區

| 誤區 | 為什麼容易誤解 | 正確理解 |
| --- | --- | --- |
| Options API 的所有 `methods` 都是 public API | methods 都掛在同一個區塊，看起來都能被 instance 拿到 | runtime 可見不等於 library 應承諾給使用者 |
| runtime 有 `focus()`，TypeScript 就一定知道 | 誤以為 TS 會讀 `.vue` runtime source | TS 主要依賴 `.d.ts`，declaration 沒寫就可能提示不足 |
| `InstanceType<typeof Input>` 可以自動補齊所有 runtime methods | 誤解 `InstanceType` 是從 runtime 推導 | 它只能根據 component declaration 推導 |
| `'v-slots'` 是 instance 上的方法 | slot 名稱看起來像 object 欄位 | slots 是 template / JSX contract，不是 ref method |
| `Message.info()` 是 component ref API | 都是命令式呼叫，看起來像 instance method | `Message` 是 service object contract，不是 template ref instance |
| 應該把所有 methods 都寫進 `XxxInstance` | 想追求完整型別覆蓋 | 這會把內部實作鎖死，應只公開穩定 public methods |

---

## 9. 本章總結

View UI Plus 的型別系統不能只從 props 與 emits 角度閱讀。對於像 `Input` 這類元件，使用者可能會透過 template ref 呼叫 `focus()`、`blur()`，這代表 component instance API 也是 public API 設計的一部分。

但是，View UI Plus v1.3.20 的 `.d.ts` 多數仍以 `DefineComponent<{ ... }>` 描述 props、listener props 與 slots 為主，對 template ref instance methods 的刻畫相對有限。因此讀這類型別時，必須同時檢查 runtime source 與 declaration：runtime methods 決定執行時是否真的有方法，`.d.ts` 決定 TypeScript 是否知道這些方法，而文件與相容性策略則決定它們是否應該被視為穩定 public contract。

`InstanceType<typeof Component>` 是理解 component instance 型別的常見工具，但它不是萬能工具。它無法憑空知道 declaration 沒有描述的 runtime methods。如果元件庫想正式支援 ref methods，較好的做法是提供清楚的 `XxxInstance` 型別，並只暴露文件化、穩定、使用者真正需要的方法。

最後，service object API 也要和 component ref API 分開。`Input.focus()` 是透過 component ref 呼叫的 instance method，而 `Message.info()`、`Modal.confirm()` 是命令式 service object 的方法。兩者都屬於 public API，但型別設計位置、使用入口與維護策略都不同。

---

## 10. 自我檢查問題

1. component instance API 和 props API 的差別是什麼？
2. 為什麼 `Input` runtime 有 `focus()`，不代表 `types/input.d.ts` 一定完整描述了 `focus()`？
3. Options API 的 `methods` 為什麼不能全部視為 public API？
4. `handleInput()`、`setCurrentValue()` 和 `focus()` 在 public API 判斷上有什麼差異？
5. `InstanceType<typeof Input>` 能推導出什麼，取決於哪個來源？
6. 為什麼 `InstanceType` 不能憑空補齊 `.d.ts` 沒有描述的 runtime methods？
7. `'v-slots'` 描述的是什麼？為什麼它不是 instance API？
8. `Message.info()` 和 `inputRef.value?.focus()` 的 API 類型有什麼不同？
9. 如果你要替 `Input` 補 `InputInstance`，你會公開哪些方法？哪些方法不應公開？
10. 判斷一個 runtime method 是否該變成 public ref API 時，應該檢查哪些證據？

---

## 11. 後續延伸方向

這篇筆記之後可以延伸成以下主題：

1. **`05-global-properties-and-plugin-types.md`**  
   分析 `types/index.d.ts` 如何透過 `declare module '@vue/runtime-core'` 補充 `$Message`、`$Modal`、`$Notice` 等 global instance properties。

2. **`06-component-registry-and-named-export-types.md`**  
   分析 `types/viewuiplus.components.d.ts` 如何集中 export public components，以及這和 runtime `src/components/index.js` 的關係。

3. **`07-form-and-table-instance-api-types.md`**  
   針對 `Form`、`Table` 這類更需要 ref methods 的元件，整理 `validate()`、`resetFields()`、`clearSelection()` 等可能的 instance API。

4. **`08-overlay-and-imperative-api-types.md`**  
   深入分析 `Message`、`Modal`、`Notice` 這類命令式 service object 的 options、回傳值、destroy/remove 行為與 global property 型別。

5. **`09-public-api-boundary-design.md`**  
   從元件庫維護者角度討論 public API 邊界：哪些 runtime 能力應該進入 `.d.ts`，哪些內部實作應該保留彈性。

