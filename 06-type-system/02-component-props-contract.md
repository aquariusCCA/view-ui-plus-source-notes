# Component Props Contract：從 Runtime Props 到 `DefineComponent`

## 1. 本章定位

本章聚焦 View UI Plus 的 component props 型別。

View UI Plus v1.3.20 的 component 多數在 runtime 使用 Options API：

```js
export default {
  props: {
    type: { validator(...) { ... }, default: 'default' },
    disabled: Boolean
  }
}
```

而 TypeScript 對外則在 `types/*.d.ts` 中用 `DefineComponent<{ ... }>` 描述：

```ts
export declare const Button: DefineComponent<{
  type?: '' | 'default' | 'primary';
  disabled?: boolean;
}>
```

本章要學的是：**如何把 runtime props 和 declaration props 放在一起看，判斷型別契約是否精準、是否有落差。**

---

## 2. 基本形狀

以 `types/button.d.ts` 為例：

```ts
import type { DefineComponent } from 'vue';

export declare const Button: DefineComponent<{
    type?: '' | 'default' | 'primary' | 'dashed' | 'text' | 'info' | 'success' | 'warning' | 'error';
    ghost?: boolean;
    size?: '' | 'large' | 'small' | 'default';
    shape?: string;
    long?: boolean;
    'html-type'?: 'button' | 'submit' | 'reset';
    disabled?: boolean;
    loading?: boolean;
    icon?: string;
    'custom-icon'?: string;
    to?: string | object;
    replace?: boolean;
    target?: '_blank' | '_self' | '_parent' | '_top';
    append?: boolean;
    onClick?: (event?: any) => any;
}>
```

這份 declaration 把 component 使用者會接觸到的 props 集中在一個 object type 裡。這個 object 同時也包含事件 listener，例如 `onClick`。本章先只看 props，events 留到下一篇。

---

## 3. Runtime 與 Type 對照：Button

`src/components/button/button.vue` 的 runtime props 包含：

| Runtime prop | Runtime 寫法 | Type declaration | 對齊觀察 |
| --- | --- | --- | --- |
| `type` | validator: default/primary/dashed/text/info/success/warning/error | `'' | 'default' | ...` | type 補了空字串，並用 union 表達可選值 |
| `shape` | validator: circle/circle-outline | `string` | declaration 較寬，沒有反映 validator |
| `size` | validator: small/large/default，default 讀 `$VIEWUI.size` | `'' | 'large' | 'small' | 'default'` | type 表達可選值，但不描述 global fallback |
| `loading` | `Boolean` | `boolean` | 對齊 |
| `disabled` | `Boolean` | `boolean` | 對齊 |
| `htmlType` | validator: button/submit/reset | `'html-type'?: 'button' | 'submit' | 'reset'` | runtime camelCase，public type 用 kebab-case |
| `customIcon` | `String` | `'custom-icon'?: string` | runtime camelCase，public type 用 kebab-case |
| `to`、`replace`、`target`、`append` | 來自 `mixins/link.js` | 出現在 Button type | type surface 合併了 mixin props |

這個例子很適合建立 props 型別閱讀規則：

1. runtime 可能使用 camelCase，type surface 常用 kebab-case。
2. declaration 可能比 runtime validator 更寬，例如 `shape?: string`。
3. mixin 注入的 props 也會出現在 component `.d.ts` 裡。
4. runtime default 與 global fallback 不一定完整出現在 type 裡。

---

## 4. Kebab-case Public Props

Vue template 使用 props 時常寫成 kebab-case：

```vue
<Button html-type="submit" custom-icon="my-icon" />
```

但 runtime component 內部 props 是 camelCase：

```js
props: {
  htmlType: { ... },
  customIcon: { ... }
}
```

View UI Plus 的 declaration file 多數採用 public template 視角：

```ts
'html-type'?: 'button' | 'submit' | 'reset';
'custom-icon'?: string;
```

這對使用者很直覺，因為 IDE 補全會貼近 template 寫法。不過閱讀 source 時要知道：

```txt
template / public type: html-type
runtime prop name: htmlType
instance access: this.htmlType
```

---

## 5. Validator 與 Literal Union

props validator 可以轉成 TypeScript literal union，但 View UI Plus 並不是每個地方都轉得一樣精準。

精準例子：

```ts
'html-type'?: 'button' | 'submit' | 'reset';
target?: '_blank' | '_self' | '_parent' | '_top';
```

較寬鬆例子：

```ts
shape?: string;
```

`Button` runtime 的 `shape` validator 只接受 `circle`、`circle-outline`，但 `.d.ts` 寫成 `string`。這代表 TypeScript 使用者可以傳任何字串而不報錯：

```ts
// type surface 可能允許，但 runtime validator 不一定接受
<Button shape="square" />
```

因此閱讀 props contract 時，要把 validator 與 declaration 放在一起看：

| 對照結果 | 意義 |
| --- | --- |
| validator 與 union 一致 | 型別可以提前攔截非法值 |
| declaration 比 validator 寬 | TS 放過，runtime 可能警告或走 fallback |
| declaration 比 runtime 窄 | TS 可能阻止 runtime 實際支援的值 |
| runtime 沒 validator，declaration 有 union | 型別比 runtime 更嚴格，需確認是否符合文件承諾 |

---

## 6. Default Value 不是 Type Contract 的全部

`Button.size` runtime default 會讀全域設定：

```js
default () {
    const global = getCurrentInstance().appContext.config.globalProperties;
    return !global.$VIEWUI || global.$VIEWUI.size === '' ? 'default' : global.$VIEWUI.size;
}
```

但 `.d.ts` 只描述：

```ts
size?: '' | 'large' | 'small' | 'default';
```

這是合理的，因為 type contract 主要描述「使用者可以傳什麼」，不負責完整描述「沒傳時 runtime 如何算出預設值」。

讀型別時要區分：

| 類型 | 回答的問題 |
| --- | --- |
| prop type | 使用者可以傳什麼值 |
| default | 使用者沒傳時 runtime 用什麼值 |
| validator | runtime 接受哪些值 |
| global fallback | plugin install 後如何影響預設行為 |

---

## 7. Mixin Props 也屬於 Public Props

`Button` runtime 使用：

```js
mixins: [ mixinsLink, mixinsForm ]
```

因此 `to`、`replace`、`target`、`append` 這類 props 不一定直接寫在 `button.vue`，而是來自 `mixins/link.js`。但對使用者來說，這些仍然是 `Button` 的 public props。

這也是 `.d.ts` 需要把 mixin props 展開到 component declaration 的原因：

```ts
to?: string | object;
replace?: boolean;
target?: '_blank' | '_self' | '_parent' | '_top';
append?: boolean;
```

閱讀時不能只在 component 檔案中搜尋 `props:`。如果 component 有 mixins，型別契約可能還要對照 mixin source。

---

## 8. 弱型別 Props

在大型 UI library 中，某些 props 很難用簡單型別精準描述，View UI Plus 常用以下型別放寬：

| 寫法 | 例子 | 問題 |
| --- | --- | --- |
| `object` | `styles?: object`、`model?: object` | 不知道物件有哪些欄位 |
| `any[]` | `data?: any[]`、`columns?: any[]` | 不知道陣列元素 shape |
| `Function` | `render?: Function`、`before-close?: Function` | 不知道參數與回傳值 |
| `string` | 某些實際有枚舉語意的 prop | TS 無法限制合法值 |

這不是單純的錯誤，而是維護取捨。它降低 declaration 維護成本，也避免過度約束使用者，但代價是 IDE 與 type checker 的保護變少。

---

## 9. Props 閱讀流程

讀一個元件的 props 時，建議照這個順序：

1. 先看 `types/<component>.d.ts`，找出 public props。
2. 回到 `src/components/<component>/**`，對照 runtime `props`。
3. 檢查 props 是否來自 mixins。
4. 檢查 camelCase / kebab-case 對應。
5. 檢查 validator 是否被轉成 literal union。
6. 檢查 `any`、`object`、`Function` 是否代表未精準化。
7. 如果 props 會被 global config 影響，再對照 `$VIEWUI`。

---

## 10. 本章結論

View UI Plus 的 props 型別主要透過 `DefineComponent<{ ... }>` 暴露。這套 declaration 對 template 使用者友善，會把 `htmlType`、`customIcon` 這類 runtime camelCase prop 表達成 `'html-type'`、`'custom-icon'`。

但 declaration 不一定完整反映 runtime validator、default、mixin 來源與 global fallback。讀 props 型別時，最重要的是對照 `types/*.d.ts` 與 `src/components/**`，判斷哪裡是精準 contract，哪裡只是寬鬆提示。

---

## 11. 自我檢查問題

1. 為什麼 `.d.ts` 裡會出現 `'html-type'`，但 runtime source 是 `htmlType`？
2. `Button.shape` 的 runtime validator 和 type declaration 有什麼落差？
3. 為什麼 mixin props 也必須出現在 component 的 public type contract？
4. `default` value 和 prop type contract 有什麼差別？
5. `Function`、`object`、`any[]` 分別會失去哪些型別資訊？

