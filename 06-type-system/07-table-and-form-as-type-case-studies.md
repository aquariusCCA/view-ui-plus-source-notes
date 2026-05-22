# Table and Form as Type Case Studies：複雜資料型元件的型別取捨

## 1. 本章定位

本章位於 `06-type-system/` 目錄，主題是 View UI Plus 的 TypeScript 型別設計。這個目錄主要用來整理 props、emits、instance、public API 與泛型等型別層面的設計，而本章選擇 `Table` 與 `Form` 作為案例，是因為它們最能暴露 UI library 型別設計的核心難題。

本章要解決的問題是：

- 如何閱讀 `types/table.d.ts` 與 `types/form.d.ts` 這類複雜元件的 public type surface。
- 如何判斷一個元件的型別宣告是「強契約」還是「弱契約」。
- 如何理解 `any[]`、`Function`、`object` 在 library 型別設計中的彈性與代價。
- 如何用泛型思維分析 `Table` 的 row data / columns / render callback，以及 `Form` 的 model / rules / FormItem.prop。
- 如何把這些觀察轉化成後續閱讀原始碼與重構型別的方向。

本章不會完整分析 `Table` 或 `Form` 的 runtime 實作，也不會逐行追蹤元件內部如何排序、篩選、驗證或渲染。這些內容可以留到後續的元件實作分析筆記中處理。

---

## 2. 學習前先建立的基本觀念

### 2.1 Type Surface：使用者看得到的型別邊界

在閱讀 UI library 的 `.d.ts` 檔案時，第一個要建立的觀念是 **type surface**。它可以理解成「套件暴露給 TypeScript 使用者的型別邊界」。

對使用者來說，當他寫出：

```ts
import { Table, Form } from 'view-ui-plus'
```

TypeScript 能不能知道 `Table` 有哪些 props、事件、slot、config 物件，以及 callback 參數是什麼，取決於套件提供的 declaration files。也就是說，runtime 真的能不能跑是一回事，TypeScript 能不能提供正確提示和檢查是另一回事。

因此，`types/table.d.ts` 與 `types/form.d.ts` 的價值不是告訴你元件內部怎麼實作，而是告訴你 View UI Plus 對外承諾了哪些型別資訊。

---

### 2.2 資料驅動元件比純視覺元件更難定型別

像 `Button`、`Icon`、`Divider` 這類元件，很多 props 都是固定選項，例如 size、type、disabled。這類元件的型別通常比較容易用 literal union 表達。

但 `Table` 與 `Form` 不一樣。它們不是只接收幾個固定 props 的 visual component，而是高度資料驅動的元件：

| 元件 | 核心資料 | 相關設定 | 互動結果 |
| --- | --- | --- | --- |
| `Table` | row data | columns、render、filters、sort、selection | row click、selection change、filter、sort |
| `Form` | model | rules、FormItem.prop、validator | validate、reset、field error |

這類元件的型別難點在於：**資料本身的 shape 是使用者決定的，但元件的 columns、rules、callback、event 又必須依賴這個 shape。**

例如使用者的 row data 長這樣：

```ts
interface UserRow {
  id: number
  name: string
  age: number
}
```

理想上，Table 的 `columns.key` 應該只能是 `'id' | 'name' | 'age'`，`render` callback 的 `params.row` 也應該是 `UserRow`。但如果 declaration 只寫 `data?: any[]`、`columns?: any[]`、`render?: Function`，TypeScript 就無法建立這些關聯。

---

### 2.3 強契約與弱契約

本章會用「強契約」與「弱契約」來描述型別宣告的精準程度。

**強契約** 指的是型別能明確限制可用值，讓 TypeScript 幫你排除錯誤。例如：

```ts
align?: 'left' | 'right' | 'center'
fixed?: 'left' | 'right'
sortType?: 'asc' | 'desc'
```

這些欄位的可用值是固定的，因此很適合使用 literal union。使用者如果寫錯成 `'middle'` 或 `'ascending'`，TypeScript 就能提示錯誤。

**弱契約** 指的是型別只告訴你「大概可以傳什麼」，但沒有把結構與參數說清楚。例如：

```ts
data?: any[]
columns?: any[]
render?: Function
model?: object
rules?: object
```

這種宣告的好處是彈性高、相容性好，也比較容易維護；代價是 TypeScript 幾乎無法幫你推導資料結構、callback 參數或欄位名稱是否正確。

---

### 2.4 泛型的價值：把使用者資料 shape 傳進元件型別

泛型的核心價值，是讓元件型別可以接收使用者自己的資料結構，並把這個資料結構傳遞到其他相關型別中。

以 `Table` 為例，理想設計可能是：

```ts
interface TableProps<TRecord> {
  data?: TRecord[]
  columns?: TableColumn<TRecord>[]
}
```

這裡的 `TRecord` 就是 row data 的型別。只要 `data` 是 `UserRow[]`，`columns`、`render`、`filterMethod`、selection event 都有機會共享同一個 row 型別。

以 `Form` 為例，理想設計可能是：

```ts
interface FormProps<TModel> {
  model?: TModel
  rules?: FormRules<TModel>
}
```

這樣 `rules` 就可以和 `model` 的欄位建立對應關係，`FormItem.prop` 也可以被限制在合法欄位名稱內。

---

## 3. 整體概覽

本章觀察的主要型別檔是：

```txt
types/table.d.ts
types/form.d.ts
```

它們和前一篇 `types/viewuiplus.components.d.ts` 的關係可以這樣理解：

```txt
types/index.d.ts
  -> export * from './viewuiplus.components'

types/viewuiplus.components.d.ts
  -> export { Table, TableColumnConfig } from './table'
  -> export { Form, FormItem } from './form'

types/table.d.ts
  -> declare Table 的 props / events / slots
  -> declare TableColumnConfig 的 column option shape

types/form.d.ts
  -> declare Form 的 props / events / slots
  -> declare FormItem 的 props / slots
```

如果把 `types/viewuiplus.components.d.ts` 視為「public type registry」，那麼 `types/table.d.ts` 與 `types/form.d.ts` 就是具體的元件型別表面。前者回答「哪些東西可以被 import」，後者回答「這些東西對 TypeScript 使用者長什麼樣子」。

在本章中，可以先用下面這張表建立整體視角：

| 元件 | 型別檔 | 核心資料 | 主要難點 | 原始宣告風格 |
| --- | --- | --- | --- | --- |
| `Table` | `types/table.d.ts` | row data、columns | row shape 與 column/render/event 沒有連動 | `any[]`、`Function`、部分 literal union |
| `Form` | `types/form.d.ts` | model、rules、FormItem.prop | model 欄位與 rules/prop 沒有連動 | `object`、`any[]`、`string`、部分 literal union |

這兩個案例可以幫助你理解一個重要原則：複雜元件的型別設計，不只是列出 props，而是要設計「資料之間的關係」。

---

## 4. 核心內容逐步講解

### 4.1 為什麼選 `Table` 與 `Form` 當型別案例

`Table` 與 `Form` 是 UI library 中最適合拿來研究型別設計的兩類元件，因為它們都不是單純把畫面畫出來，而是把使用者提供的資料、設定、callback 與事件串成一個小型系統。

`Table` 的資料中心是 row data。使用者傳入 `data`，再透過 `columns` 描述每個欄位如何顯示、是否排序、是否篩選、是否有自訂 render。Table 的事件又會把 row、index、selection 等資訊回傳給使用者。因此，Table 的型別設計應該盡量讓 row data 影響 columns、render callback 與 event payload。

`Form` 的資料中心是 model。使用者傳入 `model`，再透過 `rules` 描述每個欄位如何驗證，並用 `FormItem.prop` 指定這個表單項目對應 model 的哪個欄位。因此，Form 的型別設計應該盡量讓 model 影響 rules 與 FormItem.prop。

這就是本章的主軸：不是單純問「`Table` 有哪些 props」，而是問「`Table` 的 props 之間有沒有型別關係」；不是單純問「`Form` 有哪些 props」，而是問「`Form` 的 model、rules、prop 有沒有被型別系統連起來」。

---

### 4.2 `Table` 的 Type Surface

`types/table.d.ts` 主要包含 `Table` 與 `TableColumnConfig` 兩個部分：

```ts
export declare const Table: DefineComponent<{
    data?: any[];
    columns?: any[];
    stripe?: boolean;
    border?: boolean;
    'row-class-name'?: Function;
    'span-method'?: Function;
    'summary-method'?: Function;
    'load-data'?: Function;
    onOnRowClick?: (event?: any) => any;
    onOnSelectionChange?: (event?: any) => any;
    'v-slots'?: {
        header?: () => any;
        footer?: () => any;
        loading?: () => any;
        contextMenu?: () => any;
    };
}>
```

這段宣告可以分成幾類來看：

| 類別 | 範例 | 型別風格 | 閱讀重點 |
| --- | --- | --- | --- |
| 資料型 props | `data`、`columns` | `any[]` | 沒有表達 row 與 column 的結構 |
| 外觀 props | `stripe`、`border` | `boolean` | 型別簡單且明確 |
| callback props | `row-class-name`、`span-method`、`summary-method`、`load-data` | `Function` | 沒有表達參數與回傳值 |
| event handler | `onOnRowClick`、`onOnSelectionChange` | `(event?: any) => any` | payload 被簡化成 `any` |
| slots | `header`、`footer`、`loading`、`contextMenu` | `() => any` | 沒有 slot props 型別 |

這裡最值得注意的是：`Table` 的 runtime 功能很複雜，但 declaration 給 TypeScript 的資訊相對寬鬆。它讓使用者可以自由傳入各種資料與 callback，但也代表 IDE 不知道 callback 會收到什麼參數。

---

### 4.3 `TableColumnConfig` 的角色與限制

`TableColumnConfig` 如下：

```ts
export declare const TableColumnConfig: {
    type?: 'index' | 'selection' | 'expand' | 'html';
    title?: string;
    key?: string;
    width?: number;
    align?: 'left' | 'right' | 'center';
    fixed?: 'left' | 'right';
    render?: Function;
    renderHeader?: Function;
    sortable?: boolean | 'custom';
    sortType?: 'asc' | 'desc';
    filters?: any[];
    filterMethod?: Function;
    children?: any[];
}
```

這個 declaration 很適合拿來觀察「同一個 config 物件中，哪些地方有強型別，哪些地方仍然寬鬆」。

例如下面這些欄位有固定可用值，因此使用 literal union 是合理的：

```ts
type?: 'index' | 'selection' | 'expand' | 'html'
align?: 'left' | 'right' | 'center'
fixed?: 'left' | 'right'
sortable?: boolean | 'custom'
sortType?: 'asc' | 'desc'
```

這些欄位是 `TableColumnConfig` 中比較強的契約。它們能明確告訴使用者：`align` 只能是三種方向，`fixed` 只能固定在左或右，`sortType` 只能是升冪或降冪。

但是下面這些欄位就比較弱：

```ts
key?: string
render?: Function
renderHeader?: Function
filters?: any[]
filterMethod?: Function
children?: any[]
```

其中最關鍵的是 `key?: string`。在理想情況下，`key` 應該和 row data 的欄位名稱有關。例如 row 是：

```ts
interface UserRow {
  id: number
  name: string
  age: number
}
```

那麼 column key 最好只能寫：

```ts
'id' | 'name' | 'age'
```

但目前宣告是 `string`，所以使用者寫成 `'nage'`、`'username'` 或其他不存在的欄位，TypeScript 仍然不會報錯。

---

### 4.4 `Table` 的強契約：固定選項適合 literal union

`Table` 裡型別較強的地方，多半是固定選項：

```ts
align?: 'left' | 'right' | 'center'
fixed?: 'left' | 'right'
type?: 'index' | 'selection' | 'expand' | 'html'
sortable?: boolean | 'custom'
sortType?: 'asc' | 'desc'
```

這些欄位有一個共同特徵：它們不是由使用者資料決定，而是由元件本身定義可用值。因此 library 作者可以很安全地把它們寫成 literal union。

這類型別對使用者很有幫助，因為它同時提供三種能力：

1. **IDE autocomplete**  
   使用者輸入 `align` 時，可以看到 `'left'`、`'right'`、`'center'`。

2. **錯誤檢查**  
   如果寫成 `align: 'middle'`，TypeScript 可以直接提示錯誤。

3. **文件化效果**  
   型別本身就是 API 文件的一部分。讀者不用翻 runtime source，也能知道這個欄位支援哪些值。

因此，在閱讀 UI library 型別檔時，可以先找 literal union。這些地方通常是 declaration 中最穩定、最有參考價值的 API 邊界。

---

### 4.5 `Table` 的弱契約：資料、render、filter 與 event 沒有被連起來

`Table` 型別較弱的地方，集中在資料 shape 與 callback：

```ts
data?: any[]
columns?: any[]
render?: Function
filterMethod?: Function
summaryMethod?: Function
children?: any[]
```

這種宣告的問題不只是「不夠嚴格」，而是 TypeScript 無法知道資料關係。

以 `render` 為例，Table 的 render function 通常會接收類似 `h` 與 `params` 的參數，而 `params` 裡通常會有 row、column、index 等資訊。理想上，`params.row` 應該是 row data 的型別，`params.column` 應該是 column config 的型別。

但如果宣告只寫：

```ts
render?: Function
```

那 TypeScript 不知道這個 function 的參數，也不知道回傳值。因此使用者在 `render` 裡寫：

```ts
render(h, params) {
  return params.row.name
}
```

`params` 可能被推成 `any`，IDE 就無法幫你檢查 `row.name` 是否真的存在。

同樣地，`filterMethod` 也有類似問題。它通常會依據 filter value 與 row 判斷是否保留資料，但 declaration 只寫 `Function`，所以 row 的型別沒有被帶進來。

event handler 也有一樣的問題：

```ts
onOnRowClick?: (event?: any) => any
onOnSelectionChange?: (event?: any) => any
```

從名稱上可以推測這些 handler 對應 row click 與 selection change，但 payload 被宣告成 `any`，所以 TypeScript 使用者無法明確知道會收到 row、index、selection 還是原生 event。這部分如果要確認，需要回到 runtime 元件的事件觸發邏輯或 emits 定義。

---

### 4.6 `Table` 的泛型化思路：讓 row data 成為型別中心

如果用現代 TypeScript 重新設計 `Table` 的型別，可以讓 row data 成為整個型別系統的中心。

```ts
export interface TableColumn<TRecord = any> {
  type?: 'index' | 'selection' | 'expand' | 'html';
  title?: string;
  key?: keyof TRecord & string;
  width?: number;
  align?: 'left' | 'right' | 'center';
  fixed?: 'left' | 'right';
  render?: (h: unknown, params: {
    row: TRecord;
    column: TableColumn<TRecord>;
    index: number;
  }) => unknown;
  filterMethod?: (value: unknown, row: TRecord) => boolean;
  children?: TableColumn<TRecord>[];
}

export interface TableProps<TRecord = any> {
  data?: TRecord[];
  columns?: TableColumn<TRecord>[];
  onOnRowClick?: (row: TRecord, index: number) => void;
  onOnSelectionChange?: (selection: TRecord[]) => void;
}
```

這個設計的核心不是把 `any` 全部換掉，而是建立一條型別傳遞鏈：

```txt
TRecord
  -> data: TRecord[]
  -> columns: TableColumn<TRecord>[]
  -> column.key: keyof TRecord
  -> render.params.row: TRecord
  -> filterMethod.row: TRecord
  -> selection event: TRecord[]
```

這樣一來，使用者只要指定或讓 TypeScript 推導出 row data 的型別，後續 columns、render、filter、selection 就能共享同一套資料結構。

不過，這裡要再次強調：這不是 View UI Plus v1.3.20 目前的實際型別宣告，而是學習型別設計時的改良方向。若真的要在 library 中落地，還要處理更多細節，例如：

- column 的 `key` 是否支援巢狀路徑。
- render function 的 `h` 要使用什麼型別。
- expand column、selection column 是否需要特殊 column 型別。
- tree table 的 `children` 是否要和 row data 的 children 欄位建立關係。
- summary、span、load-data 的 callback 參數與回傳值如何設計。

---

### 4.7 `Form` 的 Type Surface

`types/form.d.ts` 主要包含 `Form` 與 `FormItem`：

```ts
export declare const Form: DefineComponent<{
    model?: object;
    rules?: object;
    inline?: boolean;
    'label-position'?: 'left' | 'right' | 'top';
    'label-width'?: number;
    'show-message'?: boolean;
    disabled?: boolean;
    onOnValidate?: (event?: any) => any;
}>
```

`Form` 的 props 可以分成兩類：

| 類別 | 範例 | 型別風格 | 閱讀重點 |
| --- | --- | --- | --- |
| 資料與規則 | `model`、`rules` | `object` | 沒有表達 model 欄位與 rules 的對應關係 |
| 外觀與行為 | `inline`、`label-position`、`label-width`、`show-message`、`disabled` | `boolean`、`number`、literal union | 這些欄位較容易精準定型別 |
| 驗證事件 | `onOnValidate` | `(event?: any) => any` | validate payload 沒有清楚表達 |

`FormItem` 則是：

```ts
export declare const FormItem: DefineComponent<{
    prop?: string;
    label?: string;
    'label-width'?: number;
    'label-for'?: string;
    required?: boolean;
    rules?: object | any[];
    error?: string;
    'show-message'?: boolean;
    'v-slots'?: {
        default?: () => any;
        label?: () => any;
    };
}>
```

`FormItem` 最重要的是 `prop` 與 `rules`。`prop` 用來描述這個表單項目對應到 `model` 的哪個欄位，`rules` 則描述該欄位的驗證規則。

---

### 4.8 `Form` 的弱契約：`model`、`rules`、`prop` 沒有被連起來

`Form` 的型別問題比 `Table` 更容易理解，因為它的資料關係非常明確：

```txt
Form.model
  -> Form.rules
  -> FormItem.prop
  -> FormItem.rules
  -> validate event
```

理想上，這些東西應該圍繞同一個 model 型別建立關聯。

例如：

```ts
interface LoginForm {
  username: string
  password: string
}
```

理想情況下：

- `Form.model` 應該是 `LoginForm`。
- `Form.rules` 的 key 應該只能是 `username` 或 `password`。
- `FormItem.prop` 也應該只能是 `username` 或 `password`。
- `onValidate` 回傳的 prop 也應該是 `username` 或 `password`。

但原始宣告是：

```ts
model?: object
rules?: object
prop?: string
rules?: object | any[]
onOnValidate?: (event?: any) => any
```

這代表 TypeScript 無法確認：

1. `FormItem.prop` 是否真的是 `model` 的合法 key。
2. `rules` 是否與 `model` 欄位對齊。
3. rule item 是否符合 `async-validator` 的規則格式。
4. validate event 的 payload 到底是欄位名稱、驗證結果、錯誤訊息，還是其他資料。
5. 巢狀欄位與陣列欄位的路徑格式是否正確。

這種設計的優點是相容性強。因為表單資料可能非常自由，有些專案使用簡單物件，有些使用巢狀物件，有些用 array path，有些用 async custom validator。若 declaration 寫得太嚴格，反而可能讓既有使用者升級困難。

但代價是 IDE 保護有限。使用者即使把 `prop` 寫錯，TypeScript 也不會幫忙擋下來。

---

### 4.9 `Form` 的泛型化思路：讓 model 成為型別中心

Form 改良方向如下：

```ts
type FieldPath<TModel> = keyof TModel & string;

interface FormRule {
  required?: boolean;
  message?: string;
  trigger?: string | string[];
  validator?: (rule: unknown, value: unknown, callback: (error?: Error) => void) => void;
}

interface FormProps<TModel extends Record<string, any> = Record<string, any>> {
  model?: TModel;
  rules?: Partial<Record<FieldPath<TModel>, FormRule | FormRule[]>>;
  onOnValidate?: (prop: FieldPath<TModel>, valid: boolean, message?: string) => void;
}

interface FormItemProps<TModel extends Record<string, any> = Record<string, any>> {
  prop?: FieldPath<TModel>;
  rules?: FormRule | FormRule[];
}
```

這個設計的核心是建立以下型別鏈：

```txt
TModel
  -> model: TModel
  -> FieldPath<TModel>
  -> rules: Partial<Record<FieldPath<TModel>, ...>>
  -> FormItem.prop: FieldPath<TModel>
  -> onValidate.prop: FieldPath<TModel>
```

這樣一來，如果 model 是：

```ts
interface LoginForm {
  username: string
  password: string
}
```

那麼 `prop` 就可以被限制成：

```ts
'username' | 'password'
```

這會讓表單欄位與驗證規則更安全。

但這種設計也有實務難點。表單欄位未必只有第一層 key，很多真實場景會有：

```ts
interface UserForm {
  profile: {
    name: string
    email: string
  }
  addresses: Array<{
    city: string
    zipCode: string
  }>
}
```

這時候 `FieldPath<TModel>` 如果只寫成 `keyof TModel & string`，就只能得到 `'profile' | 'addresses'`，無法得到 `'profile.name'`、`'profile.email'` 或 `'addresses.0.city'` 這種路徑。

因此，Form 的型別設計通常會面臨一個取捨：

| 設計方向 | 優點 | 代價 |
| --- | --- | --- |
| `prop?: string` | 彈性最高，容易相容既有用法 | 無法檢查欄位是否存在 |
| `prop?: keyof TModel` | 可檢查第一層欄位 | 不支援巢狀 path |
| `prop?: FieldPath<TModel>` | 可支援巢狀欄位 | 型別實作複雜，編譯效能與維護成本較高 |
| 完整接入 `async-validator` rule schema | 驗證規則更精準 | 相依套件型別、版本與 runtime 實作都要同步 |

---

### 4.10 `Table` 與 `Form` 的共同問題：資料 shape 沒有成為型別中心

`Table` 與 `Form` 看似功能不同，但在型別設計上有相同問題：它們都是資料驅動元件，但目前 declaration 沒有把資料 shape 泛型化。

`Table` 的資料中心是 row record：

```txt
row data
  -> column key
  -> render params.row
  -> filter row
  -> selection row[]
  -> row click payload
```

`Form` 的資料中心是 model：

```txt
model
  -> rules key
  -> FormItem.prop
  -> field validate payload
  -> reset / validate methods
```

如果 declaration 沒有把 row record 或 model 抽成泛型，TypeScript 就無法讓後續相關 API 共享同一個資料型別。

這也是 UI library 型別設計中最常見的難題：  
**越精準的型別越能幫使用者抓錯，但也越容易增加 declaration 複雜度、相容性風險與維護成本。**

---

## 5. 表格整理

### 5.1 Table 型別契約整理

| 區塊 | 代表欄位 | 目前宣告 | 契約強度 | 閱讀重點 |
| --- | --- | --- | --- | --- |
| 基礎資料 | `data` | `any[]` | 弱 | 無法知道 row data 的欄位結構 |
| 欄位設定 | `columns` | `any[]` | 弱 | 無法和 `TableColumnConfig` 或 row shape 建立關聯 |
| 欄位 key | `TableColumnConfig.key` | `string` | 中弱 | 可表示欄位名稱，但不限制為 row 的合法 key |
| 固定選項 | `align`、`fixed`、`type`、`sortType` | literal union | 強 | 可用值固定，適合精準宣告 |
| render callback | `render`、`renderHeader` | `Function` | 弱 | 缺少參數與回傳型別 |
| filter callback | `filterMethod` | `Function` | 弱 | 無法知道 value 與 row 型別 |
| tree / nested columns | `children` | `any[]` | 弱 | 沒有遞迴 column 型別 |
| event handler | `onOnRowClick`、`onOnSelectionChange` | `(event?: any) => any` | 弱 | payload 結構不明，需要回 runtime 確認 |
| slots | `header`、`footer`、`loading`、`contextMenu` | `() => any` | 中弱 | 有列出 slot 名稱，但沒有 slot props |

這張表的重點是：`Table` 並不是完全沒有型別。固定選項其實有不錯的 literal union，但一旦牽涉到使用者資料、callback、event payload，就明顯轉向寬鬆宣告。

---

### 5.2 Form 型別契約整理

| 區塊 | 代表欄位 | 目前宣告 | 契約強度 | 閱讀重點 |
| --- | --- | --- | --- | --- |
| 表單資料 | `model` | `object` | 弱 | 無法知道表單欄位結構 |
| 驗證規則 | `rules` | `object` | 弱 | 無法和 model 欄位對齊 |
| 表單項目欄位 | `FormItem.prop` | `string` | 中弱 | 可表示欄位路徑，但不保證合法 |
| 單項 rules | `FormItem.rules` | `object \| any[]` | 弱 | 無法確認是否符合 async-validator schema |
| label 位置 | `label-position` | `'left' \| 'right' \| 'top'` | 強 | 固定選項，型別精準 |
| 顯示控制 | `inline`、`show-message`、`disabled` | `boolean` | 中 | 基礎型別清楚，但不涉及資料關係 |
| validate event | `onOnValidate` | `(event?: any) => any` | 弱 | payload 不清楚，需要對照 runtime emit |

這張表的重點是：`Form` 的問題不是外觀 props，而是表單資料與驗證規則沒有透過泛型建立關聯。

---

### 5.3 Table 與 Form 的泛型化比較

| 元件 | 型別中心 | 目前型別 | 理想泛型方向 | 可以改善的能力 |
| --- | --- | --- | --- | --- |
| `Table` | row data | `data?: any[]` | `TableProps<TRecord>` | 讓 columns、render、filter、selection 共享 row 型別 |
| `TableColumnConfig` | column config | `key?: string`、`render?: Function` | `TableColumn<TRecord>` | 讓 `key` 限制為 `keyof TRecord`，讓 `render.params.row` 有型別 |
| `Form` | form model | `model?: object` | `FormProps<TModel>` | 讓 rules 和 model 欄位對齊 |
| `FormItem` | field path | `prop?: string` | `FormItemProps<TModel>` | 讓 prop 限制在合法欄位或欄位路徑 |
| validate event | field validation result | `(event?: any) => any` | `(prop: FieldPath<TModel>, valid: boolean, message?: string) => void` | 讓事件 payload 可預測 |

這張表可以當作後續設計練習的起點。你可以嘗試自己重寫一份 `Table<TRecord>` 或 `Form<TModel>` declaration，訓練如何把 runtime API 轉成 type API。

---

## 6. 範例或情境說明

### 6.1 Table：目前寬鬆型別下可能漏掉的錯誤

假設使用者資料是：

```ts
interface UserRow {
  id: number
  name: string
  age: number
}

const data: UserRow[] = [
  { id: 1, name: 'Alex', age: 20 }
]
```

如果 columns 寫成：

```ts
const columns = [
  {
    title: '姓名',
    key: 'username'
  }
]
```

在理想泛型設計中，`key: 'username'` 應該報錯，因為 `UserRow` 沒有 `username` 欄位。

但如果 `columns` 只是 `any[]`，`key` 只是 `string`，TypeScript 就不會知道這是錯的。錯誤會延後到 runtime 才暴露，可能表現為欄位沒有資料、render 讀不到值，或使用者誤以為資料來源有問題。

---

### 6.2 Table：泛型化後的閱讀方式

如果改成泛型設計：

```ts
interface TableColumn<TRecord> {
  title?: string
  key?: keyof TRecord & string
  render?: (h: unknown, params: {
    row: TRecord
    index: number
  }) => unknown
}

interface TableProps<TRecord> {
  data?: TRecord[]
  columns?: TableColumn<TRecord>[]
}
```

那麼 `UserRow` 可以被傳入整個 Table type chain：

```ts
const columns: TableColumn<UserRow>[] = [
  {
    title: '姓名',
    key: 'name',
    render(h, params) {
      return params.row.name
    }
  }
]
```

這樣 TypeScript 就知道：

- `key` 可以是 `id`、`name`、`age`。
- `params.row` 是 `UserRow`。
- `params.row.name` 是 `string`。
- `params.row.notExist` 應該報錯。

這就是泛型對複雜資料型元件最大的價值：不是讓型別看起來更高級，而是讓資料在不同 API 之間保持一致。

---

### 6.3 Form：目前寬鬆型別下可能漏掉的錯誤

假設表單資料是：

```ts
interface LoginForm {
  username: string
  password: string
}

const model: LoginForm = {
  username: '',
  password: ''
}
```

如果 `FormItem` 寫成：

```vue
<FormItem prop="usernmae">
  ...
</FormItem>
```

`usernmae` 是 `username` 的拼字錯誤。理想上，TypeScript 應該能發現這個欄位不存在。

但目前 `prop?: string` 只能表示「這裡需要字串」，不能表示「這個字串必須是 model 的合法欄位」。因此錯誤通常會延後到驗證時才發現：rules 對不上欄位、錯誤訊息不顯示，或 validate 沒有作用。

---

### 6.4 Form：泛型化後的閱讀方式

如果改成泛型設計：

```ts
type FieldPath<TModel> = keyof TModel & string

interface FormRules<TModel> {
  [key: string]: unknown
}

interface FormItemProps<TModel> {
  prop?: FieldPath<TModel>
}
```

對簡單 model 來說，`FormItem.prop` 就可以被限制成：

```ts
'username' | 'password'
```

這會讓 Form 的欄位綁定更安全。

不過實務上要注意，這個簡化版 `FieldPath<TModel>` 只適合第一層欄位。若要支援巢狀欄位，例如 `profile.name`，就需要更複雜的 type-level path 工具。這部分可以拆成後續獨立筆記。

---

## 7. 閱讀路線或學習路線

### 7.1 初次閱讀路線

第一次閱讀這類型別檔時，不建議一開始就追每個 callback 的 runtime 實作。可以先用下面順序建立全局理解：

1. **先讀 `types/viewuiplus.components.d.ts`**  
   先確認 `Table`、`TableColumnConfig`、`Form`、`FormItem` 是如何被 public type registry 匯出。

2. **再讀 `types/table.d.ts` 與 `types/form.d.ts`**  
   先看它們暴露了哪些 props、events、slots 與 config，不要急著判斷好壞。

3. **標記強契約與弱契約**  
   把 literal union、boolean、number 這些簡單明確的型別標出來，再把 `any`、`Function`、`object` 標出來。

4. **畫出資料關係**  
   對 `Table` 畫出 `data -> columns -> render -> event`；對 `Form` 畫出 `model -> rules -> prop -> validate`。

5. **最後思考泛型化方向**  
   問自己：如果我要讓這個元件型別更精準，哪一個資料 shape 應該成為泛型參數？

---

### 7.2 深入閱讀路線

當你已經理解 declaration 表面後，可以進一步追 runtime：

1. **追 `Table` 的 columns 如何被解析**  
   找出 runtime 中 columns 被標準化、渲染、排序、篩選的流程。

2. **追 `Table` 的事件 payload**  
   確認 row click、selection change、sort、filter 等事件實際 emit 的參數。

3. **追 `Form` 與 `FormItem` 的關係**  
   看 `FormItem` 如何註冊到 `Form`，`prop` 如何對應 `model` 欄位。

4. **追 `async-validator` 的接入點**  
   找出 View UI Plus 如何組裝 rules、如何呼叫 validator，以及錯誤訊息如何回到 `FormItem`。

5. **對照 runtime 與 declaration 是否一致**  
   最後回到 `.d.ts`，檢查 declaration 是否充分表達 runtime 實際支援的 API。

---

### 7.3 可以暫時跳過的部分

初學者第一次讀這章時，可以暫時不深挖以下內容：

- `Table` 的虛擬滾動或複雜渲染優化。
- `Table` 的 tree data 與 expand row 完整實作。
- `async-validator` 的所有 rule schema。
- 巢狀 `FieldPath<T>` 的完整型別實作。
- Vue `DefineComponent` 泛型參數的完整展開。

這些主題都很重要，但不適合在第一次建立型別設計觀念時全部展開。

---

## 8. 常見誤區

| 誤區 | 為什麼容易誤解 | 正確理解 |
| --- | --- | --- |
| 看到 `Table` 有 `.d.ts` 就以為型別很完整 | `.d.ts` 存在只代表有宣告，不代表宣告足夠精準 | 要看資料、callback、event、slot 是否有完整參數型別 |
| 看到 `any` 就認為設計很差 | library 需要照顧大量既有用法與 runtime 彈性 | `any` 是彈性與安全之間的取捨，要看場景判斷 |
| 只數 props 數量，不看 props 之間的關係 | 初學者容易把型別檔當成 API 清單 | 複雜元件的重點是資料 shape 是否能在多個 API 間流動 |
| 以為 `key?: string` 已經足夠 | `string` 只能代表任意字串，不能保證是 row 的合法欄位 | 若要檢查欄位合法性，需要 `keyof TRecord` 或更完整的 path 型別 |
| 以為 `FormItem.prop?: string` 能保證對應 model | `string` 不知道 model 有哪些欄位 | 需要泛型 `TModel` 與 `FieldPath<TModel>` 才能建立關聯 |
| 看到泛型化範例就以為是 View UI Plus 實際型別 | 筆記中的泛型範例是改良方向 | 要區分「目前宣告」與「重構設計提案」 |
| 只想把所有 `Function` 換成具名 callback | callback 型別需要對照 runtime 實際傳參 | 應先追元件 emit / callback 呼叫點，再設計型別 |
| 認為型別越嚴格越好 | 太嚴格可能破壞既有使用者的彈性用法 | library 型別要在精準度、相容性、維護成本之間平衡 |

---

## 9. 本章總結

`Table` 與 `Form` 是 View UI Plus v1.3.20 型別系統中非常適合研究的兩個案例，因為它們都屬於複雜資料型元件。它們的重點不是外觀 props，而是使用者資料如何流入設定物件、callback、event 與驗證流程。

從 `Table` 可以看到，View UI Plus 在固定選項上有不錯的 literal union，例如 `align`、`fixed`、`type`、`sortType`。這些欄位因為可用值固定，所以很適合做強型別。但在 `data`、`columns`、`render`、`filterMethod`、event payload 這些和 row data 有關的地方，則多使用 `any[]`、`Function`、`any`，導致 TypeScript 無法把 row shape 傳遞到 column、render 與 event 中。

從 `Form` 可以看到類似問題。`label-position` 這種固定選項可以被精準宣告，但 `model`、`rules`、`FormItem.prop` 仍然是 `object` 或 `string`。這表示 TypeScript 無法確認表單欄位是否真的存在於 model，也無法確認 rules 是否和 model 欄位對齊。

因此，本章最重要的心智模型是：  
**複雜資料型元件的型別設計，不只是宣告 props，而是設計資料 shape 如何在 props、config、callback、event、slot 之間流動。**

View UI Plus v1.3.20 的宣告偏向保守與寬鬆，這讓型別檔容易維護，也保留了 runtime API 的彈性；但代價是 TypeScript 的推導與錯誤檢查能力有限。若要進一步提升型別精準度，`Table<TRecord>` 與 `Form<TModel>` 是最自然的改良方向。

---

## 10. 自我檢查問題

1. 為什麼 `Table` 與 `Form` 比 `Button`、`Icon` 更適合拿來研究型別設計？
2. 什麼是 type surface？它和 runtime implementation 有什麼不同？
3. `TableColumnConfig.align` 適合使用 literal union 的原因是什麼？
4. 為什麼 `TableColumnConfig.key?: string` 無法保證欄位一定存在於 row data？
5. `render?: Function` 會讓 TypeScript 失去哪些資訊？
6. 如果設計 `TableColumn<TRecord>`，`TRecord` 應該被傳遞到哪些欄位或 callback 中？
7. `Form.model?: object` 與 `FormItem.prop?: string` 之間缺少什麼型別關係？
8. 為什麼簡單的 `FieldPath<TModel> = keyof TModel & string` 不足以支援巢狀表單？
9. 使用 `any`、`Function`、`object` 的好處與代價分別是什麼？
10. 如果要改善 View UI Plus 的 `Table` / `Form` 型別，你會先從哪個最小範圍開始？為什麼？

---

## 11. 後續延伸方向

這篇筆記可以延伸成以下主題：

1. **`Table` runtime 實作分析**  
   追蹤 `data`、`columns`、sort、filter、selection、tree、summary 的實際處理流程，確認 declaration 中的 callback 應該如何定義參數。

2. **`Table<TRecord>` 泛型重構練習**  
   嘗試設計一份現代化的 `TableProps<TRecord>`、`TableColumn<TRecord>`、`TableEvents<TRecord>`，並處理 selection、expand、tree children 等特殊情境。

3. **`Form` 與 `FormItem` runtime 關係分析**  
   追蹤 `FormItem` 如何註冊到 `Form`、`prop` 如何對應 `model`、驗證結果如何更新錯誤訊息。

4. **`Form<TModel>` 與 `FieldPath<TModel>` 設計練習**  
   從第一層 key 開始，再逐步擴充到巢狀 path、array path 與 async-validator rules。

5. **Vue `DefineComponent` 型別展開筆記**  
   分析 `DefineComponent<...>` 在 props、emits、slots、public instance 上如何表達元件型別。

6. **View UI Plus emits typing 筆記**  
   專門整理 `onOnRowClick`、`onOnSelectionChange`、`onOnValidate` 這類事件 handler 命名與 payload 型別如何從 runtime 對應到 declaration。

7. **UI library 型別設計取捨筆記**  
   系統整理 `any`、`unknown`、`Function`、泛型、literal union、overload、type helper 在元件庫中的使用策略。

8. **Public API 與 declaration 同步檢查清單**  
   延續前一章 public registry 的概念，設計一份新增或修改複雜元件時，需要同步檢查 runtime export、type registry、component declaration、global install、plugin alias 的清單。
