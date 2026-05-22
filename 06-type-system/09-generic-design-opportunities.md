# Generic Design Opportunities：可以泛型化的型別改良點

## 1. 本章定位

本章不是描述 View UI Plus v1.3.20 目前已經完成的型別，而是整理「如果要用現代 TypeScript 改良，哪些地方最值得導入泛型」。

請先記住：

> 本篇是設計機會，不是現況。

View UI Plus v1.3.20 的 `.d.ts` 大量使用 `any`、`Function`、`object`，特別是在資料型元件上。這些位置正是泛型最有價值的地方。

---

## 2. 泛型適合解決什麼問題

泛型適合處理「使用者傳入一種資料形狀，後續 props、callback、event、slot 都應該沿用同一種形狀」的場景。

典型例子：

```ts
interface User {
  id: number;
  name: string;
  email: string;
}

// 如果 Table 知道 row 是 User
// columns.key 就應該只能是 id/name/email
// on-row-click 的 row 也應該是 User
```

如果沒有泛型，只能寫：

```ts
data?: any[];
onOnRowClick?: (event?: any) => any;
```

TypeScript 就無法保護資料流。

---

## 3. Table 泛型

目前：

```ts
data?: any[];
columns?: any[];
```

可改良：

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

價值：

1. `columns.key` 和 row key 對齊。
2. render function 能拿到 typed row。
3. selection event 能回傳 typed row array。
4. filter / sort / summary callback 可精準描述。

---

## 4. Form 泛型

目前：

```ts
model?: object;
rules?: object;
prop?: string;
```

可改良：

```ts
type FieldPath<TModel> = keyof TModel & string;

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
```

價值：

1. `FormItem.prop` 可以限制為 model key。
2. rules 可以和 model 欄位型別對齊。
3. validate event payload 可以更清楚。

限制：

1. 巢狀 path 會讓型別複雜很多。
2. async-validator 的完整 schema 不應手寫猜測，最好引用官方型別或建立兼容 subset。

---

## 5. Select / TreeSelect Value 泛型

目前 Select 類型可以看到比較寬鬆的 model value，例如 `''`、`string | number | any[]` 等。

可改良：

```ts
type SelectValue = string | number | boolean;

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

價值：

1. `modelValue` 和 option value 對齊。
2. `multiple` 場景可區分單值與陣列。
3. `on-change` payload 不必是 `any`。

注意：如果要讓 `multiple` 自動切換 value 型別，需要更進階的 conditional types，可能讓 public API 複雜化。

---

## 6. Upload 泛型

Upload 常見問題是 file object 可能帶自定義欄位。

可改良：

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
  onOnSuccess?: (response: unknown, file: UploadFile<TMeta>, fileList: Array<UploadFile<TMeta>>) => void;
  onOnError?: (error: Error, file: UploadFile<TMeta>, fileList: Array<UploadFile<TMeta>>) => void;
}
```

價值：

1. file list 的自定義 metadata 有型別。
2. success/error callback 能共享同一個 file shape。
3. 使用者不必在每個 callback 裡自行斷言。

---

## 7. Tree 泛型

Tree 的資料通常是遞迴結構。

可改良：

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

interface TreeProps<TNode extends TreeNode = TreeNode> {
  data?: TNode[];
  onOnSelectChange?: (selected: TNode[], current: TNode) => void;
  onOnCheckChange?: (checked: TNode[], current: TNode) => void;
}
```

價值：

1. node extra data 能保留型別。
2. select/check event payload 可以精準。
3. render callback 可以知道 node shape。

---

## 8. 何時不該泛型化

不是所有元件都需要泛型。

不太需要泛型的元件：

| 元件類型 | 例子 | 原因 |
| --- | --- | --- |
| 純視覺元件 | Button、Icon、Divider | props 多為固定 union / primitive |
| layout 元件 | Row、Col、Space | 資料 shape 關聯少 |
| simple display | Alert、Badge、Tag | callback payload 較簡單 |

需要優先泛型化的元件：

| 元件類型 | 例子 | 原因 |
| --- | --- | --- |
| data-driven | Table、Tree、Transfer | row/node/item shape 貫穿多個 API |
| form-driven | Form、FormItem | model / rules / prop path 需要對齊 |
| value-driven | Select、Cascader、TreeSelect | model value 和 option value 應一致 |
| file-driven | Upload | file object 和 callbacks 共享 shape |

---

## 9. 泛型設計的成本

泛型不是免費的。它會帶來：

1. declaration 維護成本上升。
2. 使用者錯誤訊息可能變複雜。
3. 舊有 JavaScript 彈性可能被型別限制。
4. Vue template 裡的泛型推導不一定總是理想。
5. 過度精準可能和 runtime 寬鬆行為衝突。

所以改良策略應該是：

```txt
先對資料型元件提供泛型 helper/interface
不要一次改掉所有 public component declaration
維持 default generic = any 以保留相容性
```

---

## 10. 本章結論

View UI Plus v1.3.20 的型別系統在 props 枚舉值上已有一定描述，但在資料型元件上仍大量使用 `any`、`Function`、`object`。最值得泛型化的地方是 Table、Form、Select、Tree、Upload 這類「使用者資料 shape 會貫穿多個 API」的元件。

泛型改良的原則不是追求所有東西都最精準，而是讓最重要的資料流能被 TypeScript 串起來，同時保留預設 `any` 以降低破壞性。

---

## 11. 自我檢查問題

1. 為什麼 Button 不太需要泛型，但 Table 很需要？
2. `TableColumn<TRecord>` 解決了哪個核心問題？
3. `FormRules<TModel>` 如何讓 rules 和 model 對齊？
4. Select 的 `multiple` 為什麼會讓 value 型別變複雜？
5. 為什麼泛型改良應保留 default generic？

