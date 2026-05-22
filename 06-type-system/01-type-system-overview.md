# Type System Overview：從 Runtime Source 到 TypeScript Declaration

## 1. 本章定位

本章是 `06-type-system/` 的入口地圖。

View UI Plus v1.3.20 的型別系統有一個明顯特徵：**runtime source 主要是 JavaScript / Vue SFC，TypeScript contract 主要是手寫或產生的 `.d.ts` declaration files**。這表示讀型別時不能只看 `src/components/**`，也不能只看 `types/**`，而要把兩邊對照起來。

本章要回答：

1. TypeScript 使用者從哪個檔案進入 View UI Plus 的型別系統？
2. component props、emits、slots、public APIs 分別在哪裡出現？
3. runtime surface 與 type surface 為什麼可能不同步？
4. 讀後續 props、emits、instance、global API、泛型設計時，應該先建立哪些基本分類？

---

## 2. Source Baseline

| 項目 | 內容 |
| --- | --- |
| Package | `view-ui-plus` |
| Version | `1.3.20` |
| Type entry | `types/index.d.ts` |
| Package pointer | `package.json` 的 `"typings": "types/index.d.ts"` |
| Component type registry | `types/viewuiplus.components.d.ts` |
| Component declaration files | `types/button.d.ts`、`types/table.d.ts`、`types/form.d.ts` 等 |
| Runtime plugin entry | `src/index.js` |
| Runtime component source | `src/components/**` |

`package.json` 中的型別入口是：

```json
{
  "typings": "types/index.d.ts"
}
```

這代表 TypeScript 使用者安裝套件後，編譯器會先從 `types/index.d.ts` 開始理解這個 package。

---

## 3. 整體地圖

View UI Plus 的 type surface 可以先分成四層：

| 層級 | 代表檔案 | 責任 |
| --- | --- | --- |
| package type entry | `types/index.d.ts` | 匯出 component declarations、宣告 install、補 Vue instance properties |
| component export registry | `types/viewuiplus.components.d.ts` | 把所有 public component type 重新 export |
| component declaration | `types/*.d.ts` | 描述單一元件的 props、events、slots、部分 service options |
| runtime source | `src/index.js`、`src/components/**` | 真正決定 JS 執行時行為 |

可以用這張圖理解：

```txt
package.json
  -> typings: types/index.d.ts

types/index.d.ts
  -> export * from './viewuiplus.components'
  -> ViewUIPlusGlobalOptions
  -> ViewUIPlusInstallOptions
  -> declare module '@vue/runtime-core'
  -> install(app, options)

types/viewuiplus.components.d.ts
  -> export { Button } from './button'
  -> export { Table, TableColumnConfig } from './table'
  -> export { Modal, ModalInstance } from './modal'
  -> ...

types/button.d.ts / input.d.ts / table.d.ts / form.d.ts
  -> DefineComponent<{ props + listener props + v-slots }>

src/components/**/*.vue / .js
  -> runtime props
  -> runtime emits
  -> methods
  -> slots
```

---

## 4. Runtime Surface 和 Type Surface

### 4.1 Runtime Surface

runtime surface 是 JavaScript 實際執行時存在的 API。對 View UI Plus 來說，典型來源包括：

| Runtime source | 代表內容 |
| --- | --- |
| `src/index.js` | `install`、default API、`version`、`locale`、`i18n`、`lang`、globalProperties |
| `src/components/index.js` | package-level named component exports |
| `src/components/button/button.vue` | `Button` 的 runtime props、emits、render、methods |
| `src/components/input/input.vue` | `Input` 的 `modelValue`、`update:modelValue`、`focus()`、`blur()` |
| `src/components/message/index.js` | `Message.info()`、`success()`、`config()`、`destroy()` |
| `src/components/modal/index.js` | `Modal.info()`、`confirm()`、`remove()` |

runtime surface 回答的是：

> 使用者在執行時真的可以 import、安裝、呼叫或透過 instance 拿到什麼？

### 4.2 Type Surface

type surface 是 TypeScript 編譯期看到的 API。對 View UI Plus 來說，典型來源包括：

| Type source | 代表內容 |
| --- | --- |
| `types/index.d.ts` | package type entry、install signature、global properties |
| `types/viewuiplus.components.d.ts` | component named export declaration registry |
| `types/button.d.ts` | `Button` / `ButtonGroup` 的 props 與 click listener |
| `types/input.d.ts` | `Input` 的 `model-value`、slots、`onOnChange` 等 |
| `types/table.d.ts` | `Table` props 與 `TableColumnConfig` |
| `types/message.d.ts` | `Message` component props 與 `MessageConfig` |
| `types/modal.d.ts` | `Modal` component props 與 `ModalInstance` options |

type surface 回答的是：

> TypeScript 與 IDE 知不知道這些 API？知道到多精準？

---

## 5. Component Declaration 的基本形狀

多數元件 declaration 長得像這樣：

```ts
import type { DefineComponent } from 'vue';

export declare const Button: DefineComponent<{
    type?: '' | 'default' | 'primary' | 'dashed' | 'text' | 'info' | 'success' | 'warning' | 'error';
    disabled?: boolean;
    loading?: boolean;
    onClick?: (event?: any) => any;
}>
```

這種寫法把幾種東西放在同一個 object 裡：

| 類型 | 範例 | 意義 |
| --- | --- | --- |
| props | `disabled?: boolean` | 使用者可以傳給 component 的 props |
| listener props | `onClick?: ...`、`onOnChange?: ...` | template / TSX 事件監聽器對應的 prop-like 型別 |
| slot hints | `'v-slots'?: { default?: () => any }` | 用特殊欄位描述可用 slots |
| weak contract | `Function`、`any`、`object` | 表示只描述大概形狀，不描述細節 |

這不是現代 Vue library 最精細的型別寫法，但它能讓使用者在 IDE 中看到 props、事件與部分 slots。

---

## 6. 讀型別時最重要的對照

以 `Input` 為例：

runtime 在 `src/components/input/input.vue` 中宣告：

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

type 在 `types/input.d.ts` 中宣告：

```ts
'model-value'?: string | number;
onOnChange?: (event?: any) => any;
onOnSearch?: (event?: any) => any;
onOnClear?: (event?: any) => any;
```

這裡有幾個閱讀重點：

1. runtime 用 camelCase `modelValue`，type surface 用 kebab-case `'model-value'`。
2. runtime event `on-change` 在 declaration 中變成 `onOnChange`。
3. runtime 有 `update:modelValue`，但目前多數 `.d.ts` 沒有明確看到 `onUpdate:modelValue` 這類 listener declaration。
4. event payload 多數被寫成 `event?: any`，所以型別只保證事件存在，不保證 payload 精準。

---

## 7. 常見型別強度

View UI Plus 的 `.d.ts` 裡可以看到幾種強度不同的型別：

| 型別寫法 | 強度 | 例子 | 閱讀判斷 |
| --- | --- | --- | --- |
| literal union | 高 | `'left' | 'right' | 'center'` | 能限制可用值 |
| primitive union | 中 | `number | string` | 能限制大類型，但不限制語意 |
| object | 低 | `styles?: object` | 只知道是物件，不知道欄位 |
| Function | 低 | `render?: Function` | 只知道可呼叫，不知道參數與回傳 |
| any / any[] | 最低 | `data?: any[]` | 幾乎放棄細節檢查 |

讀型別時要分清楚：

> declaration file 有寫型別，不代表 contract 一定精準。

---

## 8. 本章結論

`06-type-system/` 的核心不是背每個元件的 props，而是建立一套對照方法。

讀 View UI Plus 型別時，應該從 `package.json` 的 `typings` 找到 `types/index.d.ts`，再追到 `types/viewuiplus.components.d.ts` 與單一元件的 `types/*.d.ts`。接著回到 `src/index.js` 與 `src/components/**` 確認 runtime 實際行為。

這樣讀可以避免兩種誤判：

1. 只看 runtime，以為 TypeScript 一定知道所有 API。
2. 只看 `.d.ts`，以為 declaration 一定完整反映實作。

後續章節會依序拆開 props、emits、instance、plugin global API、component registry、Table/Form 案例、imperative APIs 與泛型改良機會。

---

## 9. 自我檢查問題

1. `package.json` 中哪個欄位決定 TypeScript type entry？
2. `types/index.d.ts` 和 `types/viewuiplus.components.d.ts` 分別負責什麼？
3. runtime surface 和 type surface 有什麼差別？
4. 為什麼 `DefineComponent<{ ... }>` 裡不只會出現 props，也會出現 listener props？
5. 為什麼 `any` 和 `Function` 代表弱契約？
6. 讀單一元件時，為什麼要同時看 `src/components/**` 和 `types/*.d.ts`？

