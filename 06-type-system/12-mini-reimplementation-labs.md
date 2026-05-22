# Mini Reimplementation Labs：用小型仿作練習型別設計

## 1. 本章定位

本章提供小型練習，用來把前面讀到的型別設計轉成可實作能力。

這些 lab 不要求重寫 View UI Plus，而是用縮小版 API 練習：

1. component props declaration
2. emits listener props
3. global plugin augmentation
4. imperative service API
5. data-driven generic types

每個 lab 都應先寫 runtime API 形狀，再寫 `.d.ts` 或 TypeScript interface，最後檢查使用者體驗。

---

## 2. Lab 1：MiniButton Props

目標：仿寫 Button 的 props contract。

Runtime API：

```ts
type MiniButtonType = 'default' | 'primary' | 'success' | 'warning' | 'error';
type MiniButtonSize = 'small' | 'default' | 'large';
```

Declaration 練習：

```ts
import type { DefineComponent } from 'vue';

export declare const MiniButton: DefineComponent<{
  type?: MiniButtonType;
  size?: MiniButtonSize;
  disabled?: boolean;
  loading?: boolean;
  'html-type'?: 'button' | 'submit' | 'reset';
  onClick?: (event: MouseEvent) => void;
}>
```

檢查點：

1. runtime 若是 `htmlType`，public type 是否用 `'html-type'`？
2. `click` event 是否是 `onClick`，不是 `onOnClick`？
3. validator 可選值是否和 union 對齊？

---

## 3. Lab 2：MiniInput v-model 與 Emits

目標：練習 `modelValue`、`update:modelValue`、`on-change` 的型別。

Runtime 行為：

```txt
prop: modelValue: string | number
emit: update:modelValue(value)
emit: on-change(event)
emit: on-clear()
```

Declaration 練習：

```ts
export declare const MiniInput: DefineComponent<{
  'model-value'?: string | number;
  clearable?: boolean;
  onOnChange?: (event: Event) => void;
  onOnClear?: () => void;
  'onUpdate:modelValue'?: (value: string | number) => void;
}>
```

檢查點：

1. `on-change` 是否變成 `onOnChange`？
2. `on-clear` 沒 payload 時，是否應寫成 `() => void`？
3. `update:modelValue` 是否需要補 `'onUpdate:modelValue'`？

---

## 4. Lab 3：MiniPlugin Global Properties

目標：練習 Vue plugin 的 `ComponentCustomProperties`。

Runtime 行為：

```ts
app.config.globalProperties.$MiniMessage = MiniMessage;
app.config.globalProperties.$MINI = options;
```

Type 練習：

```ts
import type { App } from 'vue';

interface MiniGlobalOptions {
  size?: 'small' | 'default' | 'large';
  transfer?: boolean;
}

interface MiniInstallOptions extends MiniGlobalOptions {
  locale?: unknown;
}

interface MiniMessageApi {
  success(content: string): () => void;
  error(content: string): () => void;
  destroy(): void;
}

declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $MINI: MiniGlobalOptions;
    $MiniMessage: MiniMessageApi;
  }
}

export declare const install: (app: App, options?: MiniInstallOptions) => void;
```

檢查點：

1. `$MiniMessage` 是否避免寫成 `any`？
2. install options 和 global options 是否分清楚？
3. runtime 掛了什麼，module augmentation 是否同步？

---

## 5. Lab 4：MiniMessage Service API

目標：把命令式 API 從 component props 中分離出來。

Runtime API：

```txt
MiniMessage.success(options)
MiniMessage.error(options)
MiniMessage.config(options)
MiniMessage.destroy()
```

Type 練習：

```ts
interface MiniMessageOptions {
  content?: string;
  duration?: number;
  closable?: boolean;
  onClose?: () => void;
}

interface MiniMessageConfig {
  top?: number;
  duration?: number;
}

type MiniMessageClose = () => void;

interface MiniMessageApi {
  success(options: string | MiniMessageOptions): MiniMessageClose;
  error(options: string | MiniMessageOptions): MiniMessageClose;
  config(options: MiniMessageConfig): void;
  destroy(): void;
}
```

檢查點：

1. string shortcut 是否有型別？
2. close function 是否有回傳型別？
3. `config()` 和 `success()` 的 options 是否分開？

---

## 6. Lab 5：MiniTable 泛型

目標：練習 Table row data 與 column config 關聯。

Type 練習：

```ts
interface MiniTableColumn<TRecord = any> {
  title?: string;
  key?: keyof TRecord & string;
  width?: number;
  align?: 'left' | 'right' | 'center';
  render?: (params: {
    row: TRecord;
    column: MiniTableColumn<TRecord>;
    index: number;
  }) => unknown;
}

interface MiniTableProps<TRecord = any> {
  data?: TRecord[];
  columns?: MiniTableColumn<TRecord>[];
  onOnRowClick?: (row: TRecord, index: number) => void;
}
```

使用測試：

```ts
interface User {
  id: number;
  name: string;
}

const columns: MiniTableColumn<User>[] = [
  { title: 'Name', key: 'name' }
];
```

檢查點：

1. `key: 'email'` 是否會在 `User` 沒有 email 時報錯？
2. `render.params.row.name` 是否能被推導成 string？
3. default generic 是否保留 `any` 以兼容舊用法？

---

## 7. Lab 6：MiniForm 泛型

目標：練習 model、rules、prop 的型別關聯。

Type 練習：

```ts
type FieldPath<TModel> = keyof TModel & string;

interface MiniFormRule<TValue = unknown> {
  required?: boolean;
  message?: string;
  validator?: (value: TValue) => boolean | Promise<boolean>;
}

type MiniFormRules<TModel> = Partial<{
  [K in keyof TModel & string]: MiniFormRule<TModel[K]> | Array<MiniFormRule<TModel[K]>>;
}>;

interface MiniFormProps<TModel extends Record<string, any> = Record<string, any>> {
  model?: TModel;
  rules?: MiniFormRules<TModel>;
  onOnValidate?: (prop: FieldPath<TModel>, valid: boolean) => void;
}

interface MiniFormItemProps<TModel extends Record<string, any> = Record<string, any>> {
  prop?: FieldPath<TModel>;
}
```

檢查點：

1. `prop` 是否限制為 model key？
2. rule validator 的 `value` 是否跟欄位型別對齊？
3. 巢狀 path 是否暫時不支援？要明確標記。

---

## 8. Lab 7：Runtime / Type Alignment Checklist

目標：建立一次修改要同步檢查的習慣。

假設你新增一個 `MiniDrawer`：

```txt
src/components/mini-drawer/mini-drawer.vue
src/components/index.js
types/mini-drawer.d.ts
types/viewuiplus.components.d.ts
types/index.d.ts
```

檢查：

1. runtime 是否 export？
2. type registry 是否 export？
3. props 是否 camelCase / kebab-case 對齊？
4. emits 是否有 listener props？
5. `v-model` 是否有 model prop 和 update listener？
6. 若 install 掛 global property，是否補 module augmentation？

---

## 9. 本章結論

這些 lab 的目的不是追求完整重寫，而是把 View UI Plus 的型別設計拆成幾種可練習的小能力：

```txt
props union
event listener props
v-model update
global plugin augmentation
imperative service API
data-driven generics
runtime/type registry synchronization
```

能完成這些練習，就能更準確地閱讀 View UI Plus 原始碼，也能在自己的 component library 中設計更清楚的 TypeScript public contract。

---

## 10. 自我檢查問題

1. `click` 和 `on-change` 的 listener prop 為什麼不同？
2. 為什麼 service API 不應只寫成 `DefineComponent`？
3. `MiniTableColumn<TRecord>` 的核心價值是什麼？
4. `MiniFormRules<TModel>` 的核心價值是什麼？
5. 新增 component 時，runtime registry 和 type registry 為什麼都要改？

