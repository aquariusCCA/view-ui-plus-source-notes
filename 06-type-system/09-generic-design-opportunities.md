# Generic Design Opportunities：View UI Plus 型別系統中可以泛型化的改良點

## 1. 本章定位

本章屬於 `06-type-system/` 目錄中的「型別設計改良分析」筆記。它不是單純整理 `types/*.d.ts` 的現況，也不是逐行解釋某個元件的 props，而是站在 TypeScript 型別設計的角度，觀察 `View UI Plus v1.3.20` 哪些 public type surface 最適合透過泛型進一步強化。

本章要解決的核心問題是：

> 當一個 UI 元件的 API 依賴使用者傳入的資料形狀時，如何用 TypeScript 泛型把這種資料關係串起來？

例如：

- `Table` 的 `data` 是某種 row shape，`columns.key`、`render`、`filterMethod`、`on-row-click` 就應該知道同一種 row shape。
- `Form` 的 `model` 是某種資料模型，`rules`、`FormItem.prop`、`validate` event 就應該盡量和這個模型對齊。
- `Select` 的 `option.value` 是某種值型別，`modelValue`、`on-change`、`on-select` 就應該沿用同一種值型別。
- `Upload` 的 file object 如果帶有自定義 metadata，success/error/progress callback 就應該共享同一個 file shape。
- `Tree` 的 node 是遞迴資料結構，select/check/render callback 就應該保留 node 的自定義欄位。

需要先強調：本章的程式碼範例是「改良方向」與「設計練習」，不是宣稱 `View UI Plus v1.3.20` 已經這樣設計。這些寬鬆型別降低了維護成本，也提高了使用彈性；但代價是 TypeScript 無法精準追蹤使用者資料在元件 API 中的流動。

本章不會完整實作一套可發布的新版 declaration，也不會處理所有 Vue template generic inference 的細節。這些內容適合留到後續的「泛型元件設計實作」、「Vue template 型別推導限制」與「UI library declaration 相容性策略」筆記中深入討論。

---

## 2. 學習前先建立的基本觀念

### 2.1 泛型不是為了讓型別看起來更高級

在 UI library 的型別設計中，泛型的價值不是「讓型別寫得更複雜」，而是讓 TypeScript 能記住使用者傳入的資料形狀，並把這個形狀傳遞到後續 API。

以 `Table` 為例，假設使用者的資料列是：

```ts
interface User {
  id: number;
  name: string;
  email: string;
}
```

那麼理想上：

- `columns.key` 應該只能填入 `'id'`、`'name'`、`'email'`。
- `render` callback 中的 `params.row` 應該是 `User`。
- `filterMethod(value, row)` 中的 `row` 應該是 `User`。
- `on-row-click` 拿到的 `row` 應該是 `User`。
- `on-selection-change` 拿到的 selection 應該是 `User[]`。

這種「同一份資料形狀被多個 API 共用」的情境，就是泛型最適合處理的地方。

如果沒有泛型，型別通常會退回：

```ts
data?: any[];
columns?: any[];
onOnRowClick?: (event?: any) => any;
```

這樣雖然彈性很高，但 TypeScript 無法幫使用者檢查欄位名稱、callback 參數或事件 payload 是否正確。

### 2.2 `any`、`Function`、`object` 各自失去什麼資訊

在閱讀 `View UI Plus v1.3.20` 的 declaration 時，會經常看到 `any`、`Function`、`object`。這些型別不是完全沒有意義，但它們會讓契約變得非常寬鬆。

| 寬鬆型別 | 常見位置 | 代表意義 | 失去的資訊 |
| --- | --- | --- | --- |
| `any` | event payload、row data、callback 參數 | 任何值都可以通過型別檢查 | 失去資料形狀、欄位名稱、回傳型別 |
| `Function` | `render`、`filterMethod`、`validator` | 只知道它是一個函式 | 不知道參數、回傳值、this 綁定 |
| `object` | `model`、`rules`、config object | 只知道它是物件 | 不知道 key、value、巢狀結構 |

在早期或相容性優先的 UI library 中，這種寫法很常見。它的好處是 declaration 容易維護，不容易限制使用者；但缺點是 TypeScript 幾乎無法提供有效的 IDE 提示與錯誤檢查。

### 2.3 泛型化的核心不是單一 props，而是資料流

讀資料型元件的型別時，不要只問：

> 這個 props 的型別是什麼？

更重要的是問：

> 這個 props 傳入的資料，後續會不會出現在其他 callback、event、slot、config 或 public method 裡？

如果答案是會，那就代表它可能適合泛型化。

例如 `Table` 的 `data` 不只是 `data` 本身，它還會影響：

```txt
data row shape
  -> columns.key
  -> render params.row
  -> filterMethod row
  -> sort / summary callback
  -> row click event
  -> selection change event
  -> tree children
```

`Form` 的 `model` 也不只是 `model` 本身，它會影響：

```txt
model shape
  -> FormItem.prop
  -> rules key
  -> validator value
  -> validate event prop
  -> resetFields / validateField 類型設計
```

所以本章會不斷用「資料形狀如何貫穿 API」作為判斷泛型價值的主軸。

### 2.4 `default generic = any` 是相容性策略

如果要替舊有 UI library 補強泛型，通常不適合一口氣把所有 `any` 都改成嚴格型別。比較穩健的做法是保留預設泛型：

```ts
interface TableProps<TRecord = any> {
  data?: TRecord[];
}
```

這樣有兩個好處。

第一，舊使用者不提供泛型參數時，行為仍接近原本的 `any`，比較不會破壞既有專案。

第二，進階使用者可以逐步選擇更精準的型別，例如：

```ts
type UserTableColumn = TableColumn<User>;
```

這種策略符合 UI library 的演進方式：先提供可選的型別精準度，再逐步擴大覆蓋範圍，而不是突然把 public API 變得過度嚴格。

---

## 3. 整體概覽

本章可以用一張總表理解。前四欄描述「哪一類元件適合泛型化」，最後一欄描述目前型別比較寬鬆的位置，也就是為什麼這類元件值得優先檢查。

| 類型 | 元件例子 | 主要資料形狀 | 泛型化目標 | 目前型別缺口 |
| --- | --- | --- | --- | --- |
| Data-driven component | `Table` | row data | 讓 `data`、`columns`、`render`、event 共用 `TRecord` | 目前常見 `any[]`、`Function` |
| Form-driven component | `Form`、`FormItem` | form model | 讓 `model`、`rules`、`prop`、validate event 對齊 `TModel` | 目前常見 `object`、`string` |
| Value-driven component | `Select`、`TreeSelect` | option value | 讓 `modelValue`、option、change/select event 共用 `TValue` | value 型別寬鬆 |
| File-driven component | `Upload` | file object / metadata | 讓 file list 與 callbacks 共用 `UploadFile<TMeta>` | file callback 適合共享 shape |
| Recursive data component | `Tree` | tree node | 讓 node data、children、select/check event 保留 `TNode` | node extra data 適合泛型化 |

這些元件的共通點是：它們不只是「顯示 UI」，而是接收使用者資料，並在元件內部透過 callback、event 或 slot 把資料送回使用者。只要資料會來回流動，型別就不該停留在 `any` 或 `object`，而應該盡可能保留資料形狀。

相對地，像 `Button`、`Icon`、`Divider`、`Row`、`Col` 這類元件，大多數 props 是 primitive 或固定 union，例如 `type`、`size`、`disabled`、`span`。它們比較不需要泛型，因為沒有複雜的使用者資料 shape 需要沿著 API 流動。

---

## 4. 核心內容逐步講解

### 4.1 泛型適合解決的核心問題：讓資料形狀被記住

泛型最適合解決的問題可以簡化成一句話：

> 使用者一開始傳入什麼資料形狀，後面的 API 就應該記住並沿用這個資料形狀。

例如使用者建立一個 `User` 表格：

```ts
interface User {
  id: number;
  name: string;
  email: string;
}
```

如果 `Table` 沒有泛型，`data` 只是 `any[]`，那 TypeScript 不知道 `row` 裡有 `id`、`name`、`email`。後續 `columns.key`、`render`、`filterMethod` 和 event payload 都只能變成 `any`。

如果 `Table` 能設計成 `TableColumn<TRecord>` 或 `TableProps<TRecord>`，那麼 `User` 這個資料形狀就可以被傳遞下去：

```txt
User
  -> TableProps<User>
  -> TableColumn<User>
  -> render params.row: User
  -> onRowClick row: User
  -> selection: User[]
```

這就是泛型在 UI component type design 中的主要價值。

### 4.2 `Table` 泛型：讓 row data 串起 columns、render 與 events

`Table` 目前常見的型別是：

```ts
data?: any[];
columns?: any[];
```

這種寫法代表 TypeScript 只知道 `data` 是一個陣列，但不知道陣列元素的 shape。也就是說，`Table` 沒有記住 row 是什麼。

改良方向可以設計成：

```ts
export interface TableColumn<TRecord = any> {
  type?: 'index' | 'selection' | 'expand' | 'html';
  title?: string;
  key?: keyof TRecord & string;
  width?: number;
  align?: 'left' | 'right' | 'center';
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

這段型別設計不是 `v1.3.20` 的現況，而是一種可能的改良方向。它的核心不是單純把 `any` 改掉，而是讓 `TRecord` 這個 row shape 同時出現在多個 API 中。

其中最關鍵的是：

```ts
key?: keyof TRecord & string;
```

這表示 `columns.key` 必須是 row object 的合法 key。假設：

```ts
interface User {
  id: number;
  name: string;
  email: string;
}
```

那麼 `key` 理想上只能是：

```ts
'id' | 'name' | 'email'
```

這能避免在欄位設定中寫錯 key，例如誤寫成 `userName` 或 `mail`。

另一個關鍵是 `render`：

```ts
render?: (h: unknown, params: {
  row: TRecord;
  column: TableColumn<TRecord>;
  index: number;
}) => unknown;
```

過去如果寫成 `render?: Function`，TypeScript 只知道這是一個函式，不知道它的參數是什麼。改成明確函式型別後，使用者在 `render` 裡可以得到 `params.row` 的正確提示。

這個設計的限制是：真實的 `Table` API 通常還有排序、過濾、展開列、樹狀資料、summary、slot props 等更多複雜情境。若要完整設計，可能還需要：

- `TableRenderParams<TRecord>`。
- `TableFilterMethod<TRecord>`。
- `TableSummaryMethod<TRecord>`。
- `TableTreeChildren<TRecord>`。
- `TableSelectionChange<TRecord>`。

因此比較合理的演進方式不是一次把所有型別寫到最完整，而是先從 `TRecord` 這條主線開始，逐步讓重要 callback 和 event 共用它。

### 4.3 `Form` 泛型：讓 model、rules、prop 與 validate event 對齊

`Form` 目前主要使用：

```ts
model?: object;
rules?: object;
prop?: string;
```

這種寫法可以支援各種 model 和 rules，但 TypeScript 無法知道 `FormItem.prop` 是否真的存在於 `model` 中。

例如：

```ts
interface LoginForm {
  username: string;
  password: string;
}
```

如果 `FormItem.prop` 只是 `string`，那麼以下寫法在型別層面可能都會通過：

```ts
prop="username"
prop="password"
prop="usernmae" // 拼錯也不一定會被擋下
```

改良方向可以先設計一個簡化版的 `FieldPath`：

```ts
type FieldPath<TModel> = keyof TModel & string;
```

再讓 rules 與 model key 對齊：

```ts
interface FormRule<TValue = unknown> {
  required?: boolean;
  message?: string;
  trigger?: string | string[];
  validator?: (
    rule: FormRule<TValue>,
    value: TValue,
    callback: (error?: Error) => void
  ) => void;
}

type FormRules<TModel> = Partial<{
  [K in keyof TModel & string]: FormRule<TModel[K]> | Array<FormRule<TModel[K]>>;
}>;

interface FormProps<TModel extends Record<string, any> = Record<string, any>> {
  model?: TModel;
  rules?: FormRules<TModel>;
  onOnValidate?: (prop: FieldPath<TModel>, valid: boolean, message?: string) => void;
}

interface FormItemProps<TModel extends Record<string, any> = Record<string, any>> {
  prop?: FieldPath<TModel>;
  rules?: FormRule | FormRule[];
}
```

這個設計能解決三個問題。

第一，`FormItem.prop` 可以被限制為 model 的 key。

第二，`rules` 可以依照每個欄位的型別配置 validator。例如 `username` 是 `string`，則 validator 的 `value` 理想上可以推成 `string`。

第三，`onOnValidate` 的 `prop` 也可以被限制為合法欄位名稱，而不是任意字串。

但是 `Form` 泛型比 `Table` 更容易遇到限制，因為表單常常支援巢狀路徑，例如：

```ts
'user.name'
'users.0.email'
'address.city'
```

如果只用：

```ts
type FieldPath<TModel> = keyof TModel & string;
```

就只能處理第一層 key，不能處理深層 path。要支援巢狀 path，就需要更複雜的 template literal types 與遞迴型別，甚至還要考慮 array path。這會讓型別難度和錯誤訊息大幅提高。

另外，`View UI Plus` 的表單驗證可能與 `async-validator` 的 rule schema 有關。不應手寫猜測完整 schema。比較穩健的做法是引用官方型別，或建立一個和 runtime 行為相容的 subset，而不是憑空設計一個看似完整但和實際驗證器不一致的 `FormRule`。

### 4.4 `Select` / `TreeSelect` value 泛型：讓 option value 與 modelValue 對齊

`Select`、`TreeSelect` 這類元件的核心資料不是 row，也不是 model，而是 value。

目前 Select 類型可能出現比較寬鬆的 model value，例如 `''`、`string | number | any[]` 等。這種寫法能支援很多情境，但 TypeScript 不知道 option 的 `value`、`modelValue` 和 `on-change` payload 是否一致。

可以先定義基本 value：

```ts
type SelectValue = string | number | boolean;
```

再設計 option 與 props：

```ts
interface SelectOption<TValue = SelectValue, TRaw = unknown> {
  value: TValue;
  label?: string;
  disabled?: boolean;
  raw?: TRaw;
}

interface SelectProps<TValue = SelectValue> {
  modelValue?: TValue | TValue[];
  multiple?: boolean;
  onOnChange?: (value: TValue | TValue[]) => void;
  onOnSelect?: (option: SelectOption<TValue>) => void;
}
```

這個設計能讓 option value 和事件 payload 共享 `TValue`。例如如果某個 Select 的 value 是 number：

```ts
type DepartmentId = number;
```

那麼理想上：

- `option.value` 應該是 `number`。
- `modelValue` 應該是 `number` 或 `number[]`。
- `on-change` payload 應該是 `number` 或 `number[]`。

但是 `Select` 的難點在於 `multiple`。如果 `multiple` 是 `false`，`modelValue` 通常是單值；如果 `multiple` 是 `true`，`modelValue` 通常是陣列。若要讓型別自動根據 `multiple` 切換，可以設計 conditional types，例如概念上可能是：

```ts
type SelectModelValue<TValue, TMultiple extends boolean> =
  TMultiple extends true ? TValue[] : TValue;
```

但這會讓 public API 變成：

```ts
interface SelectProps<
  TValue = SelectValue,
  TMultiple extends boolean = false
> {
  multiple?: TMultiple;
  modelValue?: SelectModelValue<TValue, TMultiple>;
}
```

這種寫法對 library 維護者和使用者都比較複雜。尤其在 Vue template 中，`multiple` 可能是動態值，型別不一定能穩定推導。因此實務上可能會先提供較保守的設計：

```ts
modelValue?: TValue | TValue[];
onOnChange?: (value: TValue | TValue[]) => void;
```

再針對更嚴格的使用場景提供 helper type。

### 4.5 `Upload` 泛型：讓 file list 與 callback 共用 metadata shape

`Upload` 的型別問題通常不是 value，而是 file object。實務上，file 物件常常不只有檔名與上傳狀態，還可能帶有後端回傳的 ID、自定義分類、業務標記或使用者補充資料。

可以設計成：

```ts
interface UploadFile<TMeta = unknown> {
  name: string;
  url?: string;
  status?: 'uploading' | 'finished' | 'error';
  percentage?: number;
  response?: unknown;
  meta?: TMeta;
}

interface UploadProps<TMeta = unknown> {
  defaultFileList?: Array<UploadFile<TMeta>>;
  onOnSuccess?: (
    response: unknown,
    file: UploadFile<TMeta>,
    fileList: Array<UploadFile<TMeta>>
  ) => void;
  onOnError?: (
    error: Error,
    file: UploadFile<TMeta>,
    fileList: Array<UploadFile<TMeta>>
  ) => void;
}
```

這個泛型的價值在於：使用者只要決定一次 `TMeta`，所有 callback 中的 file 都可以保留 metadata 型別。

例如：

```ts
interface AttachmentMeta {
  businessId: string;
  source: 'user' | 'system';
}
```

那麼 `UploadFile<AttachmentMeta>` 中的 `file.meta` 就可以被 TypeScript 正確理解。

這比在每個 callback 中自行斷言更安全：

```ts
const meta = file.meta as AttachmentMeta;
```

不過，`Upload` 的完整型別設計也要注意 runtime 來源。有些欄位可能來自瀏覽器原生 `File`，有些欄位來自 UI library 自己包裝，有些欄位來自後端 response。若沒有完整對照原始碼，不應直接假設所有欄位都存在。因此本章的 `UploadFile<TMeta>` 只能視為泛型化方向，而不是完整 declaration。

### 4.6 `Tree` 泛型：讓遞迴 node 保留自定義欄位

`Tree` 的核心資料是 node，而且 node 通常是遞迴結構：

```ts
interface TreeNode<TExtra = unknown> {
  title?: string;
  key?: string | number;
  children?: Array<TreeNode<TExtra>>;
  disabled?: boolean;
  checked?: boolean;
  expand?: boolean;
  extra?: TExtra;
}
```

Tree 適合泛型化的原因是：使用者常常會在 node 上放自定義資料。例如：

```ts
interface DepartmentExtra {
  departmentId: number;
  managerName: string;
}
```

如果 `Tree` 的 event payload 只是 `any`，那使用者在 `on-select-change` 或 `on-check-change` 裡就無法得到正確提示。

可以設計成：

```ts
interface TreeProps<TNode extends TreeNode = TreeNode> {
  data?: TNode[];
  onOnSelectChange?: (selected: TNode[], current: TNode) => void;
  onOnCheckChange?: (checked: TNode[], current: TNode) => void;
}
```

這樣只要使用者傳入某種自定義 node，select/check event 就可以保留同一種 node 型別。

但是 Tree 的泛型設計也有一個常見難點：如果 `TNode extends TreeNode`，而 `TreeNode` 裡的 `children` 寫死成 `TreeNode<TExtra>[]`，有時會讓自定義 node 在 children 中失去更精準的 shape。更完整的設計可能會需要遞迴泛型，例如讓 children 也保留 `TNode[]`。這屬於較進階設計，本章先不展開。

### 4.7 哪些元件不太需要泛型化

泛型不是越多越好。對於純視覺或 layout 類元件，泛型通常幫助有限。

例如：

| 元件類型 | 例子 | 通常不需要泛型的原因 |
| --- | --- | --- |
| 純視覺元件 | `Button`、`Icon`、`Divider` | props 多為固定字串、boolean、number |
| Layout 元件 | `Row`、`Col`、`Space` | 主要描述排版，不承載使用者資料 shape |
| Simple display | `Alert`、`Badge`、`Tag` | 資料流簡單，callback payload 通常不依賴泛型 |
| Feedback 元件 | `Spin`、`Progress` | 多數狀態可用 primitive 或 union 表達 |

這些元件更適合用 literal union、boolean、number、string 來描述。例如：

```ts
type ButtonType = 'primary' | 'dashed' | 'text' | 'info' | 'success' | 'warning' | 'error';
type ButtonSize = 'large' | 'small' | 'default';
```

這比導入泛型更直接，也更容易理解。

判斷一個元件是否需要泛型，可以問三個問題：

1. 使用者是否會傳入自定義資料 shape？
2. 這個 shape 是否會出現在 callback、event、slot 或 config 中？
3. 如果不使用泛型，使用者是否需要大量 `as` 型別斷言？

如果三個答案都是肯定，那它就值得考慮泛型化。

### 4.8 泛型設計的成本與改良策略

泛型不是免費的。它會帶來 declaration 維護成本、錯誤訊息複雜度、舊 API 相容性問題，以及 Vue template 推導限制。

可以把成本整理成幾個層面。

| 成本 | 說明 | 可能影響 |
| --- | --- | --- |
| 維護成本 | interface、callback、event 都要同步泛型 | 每次 API 調整都要更新更多型別 |
| 學習成本 | 使用者需要理解泛型參數 | 初學者可能被錯誤訊息嚇到 |
| 相容性成本 | 過度嚴格可能擋住舊有寫法 | JavaScript 使用者或寬鬆資料結構可能不適應 |
| 推導限制 | Vue template 中泛型推導未必完美 | 有時仍需手動標註或 helper |
| runtime/type 落差 | runtime 接受寬鬆資料，但 type 變嚴格 | 可能出現「能跑但型別不過」 |

因此更務實的改良策略是：

```txt
第一步：先抽出 public helper interface
第二步：保留 default generic = any
第三步：先強化資料型元件，而不是所有元件
第四步：先描述 callback/event 的主要資料 shape
第五步：再逐步處理 slot props、巢狀 path、conditional types
```

例如先提供：

```ts
export interface TableColumn<TRecord = any> {
  key?: keyof TRecord & string;
}
```

比一開始就重寫整個 `Table` declaration 更安全。

這種策略特別適合像 `View UI Plus v1.3.20` 這種已經有既有使用者的 UI library。型別改良不應只追求理論上的精準，也要考慮升級成本。

---

## 5. 表格整理

### 5.1 泛型化優先順序表

| 優先順序 | 元件 / 類型 | 泛型參數 | 最值得對齊的資料流 | 改良價值 |
| --- | --- | --- | --- | --- |
| 高 | `Table` | `TRecord` | `data`、`columns.key`、`render`、filter、selection event | 最能改善 row data 的型別保護 |
| 高 | `Form` / `FormItem` | `TModel` | `model`、`rules`、`prop`、validate event | 可減少欄位名稱拼錯與 rules/model 不一致 |
| 中高 | `Select` / `TreeSelect` | `TValue` | option value、`modelValue`、change/select event | 可避免 value 型別在事件中退化成 `any` |
| 中高 | `Tree` | `TNode` / `TExtra` | node data、children、select/check event | 可保留自定義 node 欄位 |
| 中 | `Upload` | `TMeta` | file list、success/error callback、metadata | 可減少 callback 中的型別斷言 |
| 低 | `Button` / `Icon` / `Divider` | 通常不需要 | 固定 props union | 泛型價值有限 |

這張表可以作為後續研究順序。若目標是學習 UI library 型別設計，建議先從 `Table` 和 `Form` 開始，因為它們最能代表資料型元件的泛型問題。

### 5.2 寬鬆型別與泛型改良對照表

| 現況常見寫法 | 問題 | 泛型改良方向 | 改良後可得到的能力 |
| --- | --- | --- | --- |
| `data?: any[]` | 不知道 row shape | `data?: TRecord[]` | row 型別可傳遞到其他 API |
| `columns?: any[]` | column 和 row 無關聯 | `columns?: TableColumn<TRecord>[]` | `key`、`render`、filter 可知道 row |
| `render?: Function` | 不知道參數與回傳值 | `render?: (h, params) => unknown` | IDE 可提示 `params.row` |
| `model?: object` | 不知道表單欄位 | `model?: TModel` | `rules` 與 `prop` 可對齊 |
| `prop?: string` | 欄位名稱可任意填 | `prop?: FieldPath<TModel>` | 可限制合法欄位 |
| `onOnChange?: (event?: any) => any` | 不知道事件 payload | `onOnChange?: (value: TValue) => void` | value 型別可保留 |

這張表的閱讀重點是：泛型化不是隨機把 `any` 替換掉，而是要找到同一個資料 shape 在不同 API 之間的關係。

### 5.3 何時需要泛型、何時不需要

| 判斷問題 | 如果答案是「是」 | 如果答案是「否」 |
| --- | --- | --- |
| 使用者會傳入自定義資料 shape 嗎？ | 值得考慮泛型 | 可能只需要 primitive / union |
| 這個 shape 會出現在 callback/event/slot 嗎？ | 泛型價值高 | 泛型價值低 |
| 不用泛型是否會導致大量 `any`？ | 應優先改良 | 可維持簡單型別 |
| 型別精準度是否會和 runtime 彈性衝突？ | 需要保守設計與預設 `any` | 可以較嚴格描述 |
| 元件是否屬於純視覺或 layout？ | 通常不優先泛型化 | 可用 union/boolean/number 表達 |

---

## 6. 範例或情境說明

### 6.1 情境一：`TableColumn<TRecord>` 如何避免欄位 key 寫錯

假設有一份使用者資料：

```ts
interface User {
  id: number;
  name: string;
  email: string;
}
```

若 `columns` 是 `any[]`，下面這種拼錯可能不會被型別擋下：

```ts
const columns = [
  { title: 'Name', key: 'userName' }
];
```

但如果使用：

```ts
const columns: TableColumn<User>[] = [
  { title: 'Name', key: 'name' }
];
```

那麼 `key` 就可以限制在 `User` 的 key 範圍內。這種設計讓 TypeScript 不只檢查單一變數，而是檢查 `data` 和 `columns` 之間的關係。

### 6.2 情境二：`FormRules<TModel>` 如何減少表單規則錯配

假設表單模型是：

```ts
interface LoginForm {
  username: string;
  password: string;
}
```

如果 `rules` 只是 `object`，下面的錯誤 key 可能不會被發現：

```ts
const rules = {
  usernmae: [{ required: true, message: '請輸入帳號' }]
};
```

若改成：

```ts
const rules: FormRules<LoginForm> = {
  username: [{ required: true, message: '請輸入帳號' }]
};
```

型別就可以幫助檢查 rules 是否對應到合法欄位。這對大型表單很重要，因為表單欄位一多，拼字錯誤、欄位改名後忘記同步 rules，都是常見 bug。

### 6.3 情境三：`Select<TValue>` 為什麼需要小心 `multiple`

假設部門 ID 是 number：

```ts
type DepartmentId = number;
```

單選時，value 可能是：

```ts
const departmentId: DepartmentId = 1001;
```

多選時，value 可能是：

```ts
const departmentIds: DepartmentId[] = [1001, 1002];
```

因此 `Select` 的型別不能只寫死成：

```ts
modelValue?: TValue;
```

也不能永遠寫成：

```ts
modelValue?: TValue[];
```

較保守的 library declaration 可能會先寫成：

```ts
modelValue?: TValue | TValue[];
```

這雖然沒有完全依照 `multiple` 自動切換，但比 `any` 更能保留 value 型別。若要更精準，才進一步導入 conditional types。

---

## 7. 閱讀路線或學習路線

### 7.1 初次閱讀路線

第一次閱讀本章時，建議不要先背每個 interface，而是先建立泛型設計的判斷框架。

1. 先讀「本章定位」與「基本觀念」，確認本篇是設計機會，不是 v1.3.20 現況。
2. 再讀 `Table` 與 `Form`，因為它們最能代表資料型元件的泛型問題。
3. 接著讀 `Select`、`Upload`、`Tree`，觀察不同資料形狀如何影響泛型設計。
4. 最後讀「何時不該泛型化」與「泛型設計成本」，避免把泛型當成萬用解法。

### 7.2 深入閱讀路線

若要進一步回到 `View UI Plus` 原始碼與 declaration，可以依照以下順序：

1. 先看 `types/table.d.ts`，找出 `data`、`columns`、`TableColumnConfig`、event callback 的寬鬆型別。
2. 再看 `types/form.d.ts`，找出 `model`、`rules`、`FormItem.prop`、validate event 的型別邊界。
3. 接著看 `types/select.d.ts`、`types/tree.d.ts`、`types/upload.d.ts`，觀察 value、node、file object 如何被描述。
4. 回到 runtime source，確認 declaration 是否真的對應 runtime API。
5. 最後思考：如果只允許做一個小幅相容性改良，應該先抽出哪個 public helper interface？

### 7.3 可以暫時跳過的部分

若目前目標只是理解 `View UI Plus v1.3.20` 的型別現況，可以暫時跳過 conditional types、深層 `FieldPath<T>`、遞迴 tree node 泛型等進階設計。這些內容更適合作為 TypeScript 型別體操或 library declaration 重構的後續主題。

---

## 8. 常見誤區

| 誤區 | 為什麼容易誤解 | 正確理解 |
| --- | --- | --- |
| 看到 `any` 就認為型別設計很差 | 現代 TypeScript 使用者常追求精準型別 | UI library 要兼顧 runtime 彈性、相容性與維護成本，`any` 有時是折衷 |
| 泛型越多越好 | 泛型看起來能讓型別更精準 | 泛型應用在資料 shape 會貫穿 API 的地方，純視覺元件不一定需要 |
| 把改良範例當成 v1.3.20 現況 | 筆記中有許多 interface 範例 | 本章範例是設計機會，不代表目前 source 已存在 |
| `keyof TRecord` 可以解決所有 Table 問題 | `columns.key` 是最直觀的問題 | render、filter、summary、tree、selection、slot props 也需要一起設計 |
| `FieldPath<TModel>` 很簡單 | 第一層 key 確實容易 | 巢狀 path、array path、async-validator schema 會讓 Form 型別複雜很多 |
| `multiple` 只是一個 boolean | runtime 上看起來只是切換模式 | 型別上會改變 `modelValue` 與 event payload 是單值還是陣列 |
| 可以一次把所有 `any` 改成嚴格型別 | 想快速改善型別品質 | 更安全的策略是先提供 helper interface，並保留 default generic = `any` |
| 型別越精準越符合 runtime | 型別和 runtime 常被視為一體 | 如果 runtime 接受寬鬆資料，type 過度嚴格可能反而造成使用者困擾 |

---

## 9. 本章總結

本章的核心觀念是：泛型最適合用來描述「使用者資料形狀在多個 API 之間流動」的情境。`View UI Plus v1.3.20` 的型別系統在許多簡單 props 上已經使用 literal union 描述固定值，例如 `align`、`fixed`、`sortType` 這類選項；但在資料型元件上，仍大量使用 `any`、`Function`、`object`，導致 TypeScript 無法把使用者資料和 callback、event、slot、config 串起來。

`Table` 是最典型的 data-driven component。它的 row data 應該能一路影響 `columns.key`、`render`、`filterMethod`、selection event 與 row click event。若能導入 `TRecord`，就能讓使用者在定義資料列後，於整個 Table API 中獲得一致的型別保護。

`Form` 是 form-driven component 的典型案例。它的 `model`、`rules`、`FormItem.prop`、validate event 之間應該存在型別關聯。透過 `TModel`、`FieldPath<TModel>` 和 `FormRules<TModel>`，可以減少欄位名稱拼錯、rules 和 model 不一致等問題。不過 Form 的巢狀 path 與 async-validator schema 會讓型別設計變得更複雜，因此不適合在沒有確認 runtime 行為前過度設計。

`Select`、`Upload`、`Tree` 則分別代表 value-driven、file-driven、recursive data component。它們都適合泛型化，但泛型參數不一樣：`Select` 關注 `TValue`，`Upload` 關注 `TMeta`，`Tree` 關注 `TNode` 或 `TExtra`。

最後要記住，泛型設計不是追求所有東西都最嚴格，而是把最重要的資料流保留下來。對既有 UI library 而言，較合理的策略是先提供 public helper interface，保留 `default generic = any`，再逐步強化資料型元件的 callback、event 與 slot props。這樣既能提升 TypeScript 體驗，又能降低對既有使用者的破壞性。

---

## 10. 自我檢查問題

1. 為什麼本章說「泛型適合處理資料形狀會貫穿多個 API 的情境」？
2. `Button` 為什麼通常不太需要泛型，而 `Table` 很需要？
3. `TableColumn<TRecord>` 中的 `keyof TRecord & string` 解決了哪個問題？
4. 如果 `render?: Function`，TypeScript 會失去哪些 callback 參數資訊？
5. `FormItem.prop?: string` 為什麼無法保證欄位存在於 `model` 中？
6. `FormRules<TModel>` 如何讓 rules 和 model 欄位對齊？
7. `Select` 的 `multiple` 為什麼會讓 `modelValue` 型別變得更複雜？
8. `UploadFile<TMeta>` 解決了 file callback 中哪一類型別問題？
9. `Tree` 的泛型設計為什麼會牽涉遞迴 node 結構？
10. 為什麼改良舊有 UI library 型別時，通常要保留 `default generic = any`？

---

## 11. 後續延伸方向

這篇筆記之後可以延伸成以下主題。

1. `Table<TRecord>` 泛型設計專題：深入設計 `TableColumn<TRecord>`、`TableRenderParams<TRecord>`、filter、sort、summary、selection、tree data。
2. `Form<TModel>` 泛型設計專題：深入研究 `FieldPath<T>`、巢狀 path、array path、async-validator rule schema 與 validate event。
3. `Select<TValue>` 與 conditional types：研究 `multiple`、`label-in-value`、`value` 型別與 `on-change` payload 的關係。
4. `UploadFile<TMeta>` 型別設計：區分瀏覽器原生 `File`、library file wrapper、後端 response 與自定義 metadata。
5. `Tree<TNode>` 遞迴泛型設計：研究如何讓 children 保留自定義 node shape。
6. Vue template 中的泛型推導限制：分析為什麼泛型 interface 在 template 使用時不一定能完整推導。
7. UI library declaration 相容性策略：研究如何在不破壞既有使用者的前提下，逐步從 `any` 改良到泛型 helper。
8. `View UI Plus v1.3.20` 型別現況與現代化改良對照表：把所有適合泛型化的 `.d.ts` 檔案整理成重構清單。
