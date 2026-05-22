# Table and Form as Type Case Studies：複雜資料型元件的型別取捨

## 1. 本章定位

本章用 `Table` 與 `Form` 作為型別案例。

這兩個元件很適合學 View UI Plus 的型別設計，因為它們都不是單純的 visual component：

- `Table` 牽涉 row data、columns、render function、sort、filter、selection、tree、summary。
- `Form` 牽涉 model、rules、FormItem prop、async-validator、欄位驗證事件。

也因為複雜，它們最能看出 v1.3.20 型別系統的取捨：很多地方為了彈性使用 `any`、`Function`、`object`，但也因此缺少泛型精準度。

---

## 2. Table 的 Type Surface

`types/table.d.ts` 中主要有：

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

這裡可以看到兩種型別風格：

| 區塊 | 風格 |
| --- | --- |
| Table props | 多數資料結構使用 `any[]`、`Function` |
| TableColumnConfig | 對部分選項有 literal union，但 row/render/filter 仍寬鬆 |

---

## 3. Table 的強契約與弱契約

Table 中型別較強的地方：

```ts
align?: 'left' | 'right' | 'center';
fixed?: 'left' | 'right';
type?: 'index' | 'selection' | 'expand' | 'html';
sortable?: boolean | 'custom';
sortType?: 'asc' | 'desc';
```

這些欄位適合用 union，因為可用值固定。

型別較弱的地方：

```ts
data?: any[];
columns?: any[];
render?: Function;
filterMethod?: Function;
summaryMethod?: Function;
children?: any[];
```

這些欄位沒有把 row shape、column shape、render context、filter value 精準表達出來。結果是：

1. column `key` 不會被限制為 row 的合法欄位。
2. `render(h, params)` 的 `params.row` 沒有 row 型別。
3. `filterMethod(value, row)` 的 `row` 沒有型別。
4. `on-row-click` payload 不知道是 row、index 還是 event。

---

## 4. Table 可以如何泛型化

如果用現代 TypeScript 改良，可以設計：

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

這不是 v1.3.20 目前型別，而是改良方向。它的價值是讓 row data 和 columns 建立關聯。

---

## 5. Form 的 Type Surface

`types/form.d.ts` 中主要有：

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

Form 的型別比 Table 更能看出「runtime 彈性」與「type 精準度」之間的落差。

---

## 6. Form 的弱契約

`Form` 主要資料型別是：

```ts
model?: object;
rules?: object;
```

`FormItem` 用：

```ts
prop?: string;
rules?: object | any[];
```

這表示 TypeScript 無法確認：

1. `FormItem.prop` 是否是 `model` 的合法 key。
2. `rules` 是否和 `model` 欄位對齊。
3. rule item 是否符合 async-validator 的 `RuleItem` shape。
4. validate callback payload 是什麼。

這種寬鬆設計讓使用者能傳入各種 model 與 rules，但 IDE 保護有限。

---

## 7. Form 可以如何泛型化

如果用現代 TypeScript 改良，可以設計：

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

這種設計能讓 `prop` 和 `model` 建立關聯，但也會帶來複雜度，尤其是巢狀 path、array field、async-validator 的完整 rule schema。

---

## 8. Table 與 Form 的共同問題

Table 和 Form 都有一個共通點：它們的 runtime API 是資料驅動的，但目前 declaration 沒有把資料 shape 泛型化。

| 元件 | 核心資料 | 目前 type | 可改良方向 |
| --- | --- | --- | --- |
| Table | row data | `any[]` | `Table<TRecord>` |
| Table column | column config | `TableColumnConfig` 無 row 泛型 | `TableColumn<TRecord>` |
| Form | model | `object` | `Form<TModel>` |
| Form rules | validation rules | `object` | `FormRules<TModel>` |
| FormItem | prop path | `string` | `FieldPath<TModel>` |

這是 UI library 型別設計中最常見的難題：泛型能提高精準度，但也會提高 API 和 declaration 維護成本。

---

## 9. 讀複雜元件型別時的重點

讀 Table / Form 這種元件時，不要只數 props。更重要的是看資料關係：

1. `data` 和 `columns` 是否有型別關聯？
2. event payload 是否帶出 row / selection / field？
3. callback function 是否有參數型別？
4. slot props 是否有型別？
5. config object 是否 export 成 public type？
6. declaration 是否有泛型，或只用 `any` / `object`？

---

## 10. 本章結論

`Table` 和 `Form` 展示了 View UI Plus v1.3.20 型別系統的典型取捨。簡單 props 常有不錯的 literal union，但資料型 props、callback、render、rules 則多使用 `any`、`Function`、`object`。

這讓型別檔容易維護，也保留了使用彈性；代價是 TypeScript 無法把 row data、column config、form model、field rules 精準連起來。

因此這兩個元件最適合作為後續泛型設計練習的起點。

---

## 11. 自我檢查問題

1. `TableColumnConfig.key` 為什麼目前無法限制成 row data 的合法欄位？
2. `render?: Function` 會失去哪些資訊？
3. `FormItem.prop?: string` 為什麼無法保證對應到 `model`？
4. `rules?: object` 的好處和代價分別是什麼？
5. 為什麼 Table / Form 是泛型改良的最佳案例？

