# Emits and v-model Types：事件、`update:modelValue` 與 Listener Props

## 1. 本章定位

本章聚焦 View UI Plus 的 emits 與 `v-model` 型別。

View UI Plus v1.3.20 的 runtime component 多數會在 Options API 中宣告：

```js
emits: ['update:modelValue', 'on-change', 'on-focus']
```

而 `.d.ts` 中通常不是用 Vue 3 的 emits generic 精準描述 payload，而是把事件監聽器表達成 component props：

```ts
onOnChange?: (event?: any) => any;
onOnFocus?: (event?: any) => any;
```

這篇要理解兩件事：

1. runtime emit name 如何對應到 declaration 中的 listener prop name。
2. `v-model` 的 `modelValue` / `update:modelValue` 在 View UI Plus type surface 中描述到什麼程度。

---

## 2. Runtime Emits 的形狀

以 `Input` 為例，runtime 宣告：

```js
emits: [
    'on-enter',
    'on-search',
    'on-keydown',
    'on-keypress',
    'on-keyup',
    'on-click',
    'on-focus',
    'on-blur',
    'on-change',
    'on-input-change',
    'on-clear',
    'update:modelValue'
]
```

在 methods 中會呼叫：

```js
this.$emit('update:modelValue', value);
this.$emit('on-change', event);
this.$emit('on-search', this.currentValue);
this.$emit('on-clear');
```

這代表 runtime 上有兩類事件：

| 類型 | 範例 | 用途 |
| --- | --- | --- |
| Vue 3 model update | `update:modelValue` | 支援 `v-model` |
| View UI Plus 事件命名 | `on-change`、`on-search`、`on-clear` | 相容 iView / View UI 風格事件 |

---

## 3. Declaration 中的 Listener Props

`types/input.d.ts` 中對應的事件 declaration 形狀是：

```ts
onOnEnter?: (event?: any) => any;
onOnClick?: (event?: any) => any;
onOnChange?: (event?: any) => any;
onOnFocus?: (event?: any) => any;
onOnBlur?: (event?: any) => any;
onOnSearch?: (event?: any) => any;
onOnClear?: (event?: any) => any;
```

為什麼是 `onOnChange`？

因為 Vue / JSX / TSX 的 listener prop 命名通常會把 event name 轉成 `onXxx`。而 View UI Plus 的事件名本身就叫 `on-change`。

```txt
runtime emit name: on-change
listener prop: on + OnChange
declaration: onOnChange
```

同理：

| Runtime emit | Declaration listener |
| --- | --- |
| `click` | `onClick` |
| `on-change` | `onOnChange` |
| `on-visible-change` | `onOnVisibleChange` |
| `on-open-change` | `onOnOpenChange` |
| `on-page-size-change` | `onOnPageSizeChange` |
| `on-clickoutside` | `onOnClickoutside` |

這是 View UI Plus 型別閱讀中最容易困惑的地方之一：`onOnChange` 不是打字重複，而是由事件命名策略導致的結果。

---

## 4. `v-model` 的 Type Surface

Vue 3 的 `v-model` 預設對應：

```txt
prop: modelValue
event: update:modelValue
```

View UI Plus runtime 多數也使用這個模式，例如 `Input`：

```js
props: {
  modelValue: {
    type: [String, Number],
    default: ''
  }
}

this.$emit('update:modelValue', value);
```

`.d.ts` 中則通常看到：

```ts
'model-value'?: string | number;
```

這表示 type surface 描述了可傳入的 `model-value` prop，但從目前 `types/*.d.ts` 的觀察，並沒有普遍看到對 `update:modelValue` listener 的精準宣告，例如：

```ts
// 這類形狀在目前 View UI Plus declaration 中不是主流
'onUpdate:modelValue'?: (value: string | number) => void;
```

因此要分清楚：

| 能力 | Type surface 現況 |
| --- | --- |
| 傳入 `model-value` | 多數 component 有 prop type |
| `v-model` runtime 更新 | runtime 透過 `update:modelValue` 實作 |
| `update:modelValue` listener payload type | declaration 中未普遍精準化 |
| `on-change` 這類業務事件 | 多數以 `onOnChange?: (event?: any) => any` 呈現 |

---

## 5. Event Payload 的精準度

`Input` runtime 中不同事件 payload 其實不同：

| Runtime emit | Payload |
| --- | --- |
| `on-keydown` | KeyboardEvent |
| `on-focus` | FocusEvent |
| `on-change` | event 或清空時的 `{ target: { value: '' } }` |
| `on-search` | `currentValue` |
| `on-clear` | 無 payload |
| `update:modelValue` | string 或 number |

但 declaration 多數寫成：

```ts
onOnSearch?: (event?: any) => any;
onOnClear?: (event?: any) => any;
```

這表示型別只傳達「有這個 listener」，沒有精準傳達 payload。

精準化後理論上可以是：

```ts
onOnSearch?: (value: string | number) => void;
onOnClear?: () => void;
'onUpdate:modelValue'?: (value: string | number) => void;
```

但這屬於改良方向，不是 v1.3.20 目前 declaration 的主要風格。

---

## 6. Modal 的事件對照

`Modal` runtime 宣告：

```js
emits: [
  'on-cancel',
  'on-ok',
  'on-hidden',
  'on-visible-change',
  'update:modelValue'
]
```

`types/modal.d.ts` 中有：

```ts
onOnOk?: (event?: any) => any;
onOnCancel?: (event?: any) => any;
onOnVisibleChange?: (event?: any) => any;
```

可以看到：

1. `on-ok` -> `onOnOk`
2. `on-cancel` -> `onOnCancel`
3. `on-visible-change` -> `onOnVisibleChange`
4. `model-value` prop 有宣告
5. `update:modelValue` listener 沒有在這份 declaration 中以精準形式表達
6. runtime 的 `on-hidden` 是否有 type listener，需要回到 declaration 逐項確認；如果沒有，就是 runtime/type gap

---

## 7. 為什麼 View UI Plus 使用 `on-change` 這種事件名

從歷史風格來看，iView / View UI 系列常用 `@on-change`、`@on-visible-change` 這種事件命名：

```vue
<Input @on-change="handleChange" />
<Modal @on-ok="handleOk" />
```

Vue 3 原生習慣也許更偏向：

```vue
<Input @change="handleChange" />
<Modal @ok="handleOk" />
```

View UI Plus 保留 `on-*` 風格會提高使用者遷移相容性，但在 TypeScript listener prop 中會產生 `onOnXxx` 這種看起來重複的名稱。

這是 API 相容性與型別美觀之間的取捨。

---

## 8. 閱讀 Emits 的流程

讀一個元件 emits 時，建議照這個順序：

1. 在 runtime component 找 `emits: [...]`。
2. 搜尋 `$emit(...)`，確認實際 payload。
3. 到 `types/<component>.d.ts` 找 `onXxx` / `onOnXxx`。
4. 檢查是否有 `model-value` prop。
5. 檢查是否有 `update:modelValue` listener type。
6. 標記 payload 是否為 `any`，是否有改良空間。
7. 對照文件事件表，確認 runtime/type/docs 是否一致。

---

## 9. 常見誤區

| 誤區 | 正確理解 |
| --- | --- |
| `onOnChange` 是重複命名錯誤 | 它是 `on-change` event 被轉成 listener prop 後的結果 |
| 有 `'model-value'` 就代表 `v-model` 型別完整 | 只代表 model prop 有型別，update listener payload 仍可能未描述 |
| `(event?: any) => any` 表示 payload 被精準定義 | `any` 代表 payload 幾乎沒有型別保護 |
| runtime `emits` 有列出，`.d.ts` 一定都有 | 需要逐項對照，可能有缺漏 |
| event payload 一定是 DOM Event | 很多事件會傳 value、option、row、selection 或無 payload |

---

## 10. 本章結論

View UI Plus 的 emits 型別主要用 listener props 表達。由於它保留 `on-change` 這類歷史事件命名，所以 declaration 中常看到 `onOnChange`、`onOnVisibleChange`。

`v-model` 方面，runtime 大量使用 `modelValue` / `update:modelValue`，而 declaration 通常至少描述 `'model-value'` prop；但 `update:modelValue` listener 與事件 payload 在 v1.3.20 型別中沒有普遍精準化。

因此讀 emits type 時要同時看三件事：

```txt
runtime emits list
  + actual $emit payload
  + types/*.d.ts listener props
```

只有三者對齊，才算完整理解事件型別契約。

---

## 11. 自我檢查問題

1. 為什麼 `on-change` 會在 `.d.ts` 中變成 `onOnChange`？
2. `click` 和 `on-click` 對應的 listener prop 分別是什麼？
3. `modelValue`、`model-value`、`update:modelValue` 分別位於哪個層次？
4. 為什麼 `onOnSearch?: (event?: any) => any` 不算精準 payload 型別？
5. 讀 emits 時，為什麼不能只看 `emits: [...]`？

