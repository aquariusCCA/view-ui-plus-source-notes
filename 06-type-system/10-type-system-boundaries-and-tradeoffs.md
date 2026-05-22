# Type System Boundaries and Tradeoffs：型別系統的邊界與取捨

## 1. 本章定位

本章總結 View UI Plus v1.3.20 型別系統的邊界。

讀完前面幾篇後，應該已經看到一個明顯現象：View UI Plus 有完整的 `types/` 目錄，也能提供大量 props autocomplete，但它不是一套高度泛型化、payload 精準化的現代型別系統。

這不是單純好壞問題，而是 library 發展歷史、Vue 3 遷移、JS runtime codebase、使用者相容性、維護成本共同造成的設計取捨。

---

## 2. 這套型別系統做得好的地方

### 2.1 有明確 type entry

`package.json` 指向：

```json
"typings": "types/index.d.ts"
```

這讓 TypeScript 使用者有穩定入口。

### 2.2 有 component registry

`types/viewuiplus.components.d.ts` 集中匯出 public components：

```ts
export { Button, ButtonGroup } from './button'
export { Table, TableColumnConfig } from './table'
export { Modal, ModalInstance } from './modal'
```

這讓 named import 有基礎型別支援。

### 2.3 許多 props 有 literal union

例如：

```ts
target?: '_blank' | '_self' | '_parent' | '_top';
'label-position'?: 'left' | 'right' | 'top';
align?: 'left' | 'right' | 'center';
sortable?: boolean | 'custom';
```

這些都能提供實際保護。

### 2.4 有 Vue module augmentation

`types/index.d.ts` 補了：

```ts
declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $VIEWUI: ViewUIPlusGlobalOptions;
    $Message: any;
    $Modal: any;
  }
}
```

這讓 Options API 中的 `this.$Message` 至少被承認存在。

---

## 3. 邊界一：JS Runtime 與 `.d.ts` 分離

View UI Plus v1.3.20 的 source 主要不是 TypeScript 寫成，而是 JS / SFC runtime 搭配 declaration files。

這帶來一個基本邊界：

```txt
runtime code 不會自動產生型別
.d.ts 也不會自動保證 runtime 存在
```

因此必須靠維護者同步：

| 改動 | 需要同步檢查 |
| --- | --- |
| 新增 prop | `types/<component>.d.ts` |
| 新增 emit | listener prop type |
| 新增 global property | `ComponentCustomProperties` |
| 新增 named export | `viewuiplus.components.d.ts` 或 `types/index.d.ts` |
| 新增 service method | service API type |

同步成本是這套架構的核心代價。

---

## 4. 邊界二：`any` / `Function` 是彈性也是風險

常見弱型別：

```ts
data?: any[];
columns?: any[];
render?: Function;
rules?: object;
$Message: any;
```

好處：

1. 低維護成本。
2. 不容易擋住使用者現有寫法。
3. 對複雜 callback / render / service API 可以快速覆蓋。
4. 適合由 JS codebase 過渡到 TS declaration。

代價：

1. payload 不精準。
2. callback 參數不清楚。
3. service method 打錯 TypeScript 也可能放過。
4. 資料型元件無法建立 row/model/option 關聯。
5. IDE autocomplete 只能提示到表面層。

---

## 5. 邊界三：事件命名相容性造成型別命名不美觀

View UI Plus 保留 `on-change`、`on-visible-change` 這類事件命名。

在 listener prop type 中會變成：

```ts
onOnChange?: (event?: any) => any;
onOnVisibleChange?: (event?: any) => any;
```

這是相容性取捨：

| 選擇 | 好處 | 代價 |
| --- | --- | --- |
| 保留 `@on-change` | 舊使用者遷移成本低 | TS listener prop 變成 `onOnChange` |
| 改成 `@change` | 型別命名更自然 | 破壞既有 API 習慣 |

library 維護通常會優先保留相容性。

---

## 6. 邊界四：Global API 只做到 Property-level

`$Message`、`$Modal`、`$Notice` 等在 `ComponentCustomProperties` 中是 `any`。

這表示它只完成：

```txt
this.$Message 這個 property 存在
```

沒有完成：

```txt
this.$Message.success 的參數型別
this.$Modal.confirm 的 options 型別
this.$Message.success 的回傳 close function
```

這對使用者來說是「能用但不精準」。

---

## 7. 邊界五：泛型缺席

資料型元件目前缺少泛型：

| 元件 | 目前 | 泛型可改善 |
| --- | --- | --- |
| Table | `data?: any[]` | row type |
| TableColumnConfig | `key?: string` | `keyof TRecord` |
| Form | `model?: object` | `TModel` |
| FormItem | `prop?: string` | `FieldPath<TModel>` |
| Select | value 型別寬鬆 | `TValue` |
| Tree | node 型別寬鬆 | `TNode` |

泛型缺席讓 declaration 簡單，但資料流無法被 TypeScript 保護。

---

## 8. 邊界六：Slots 型別只是提示

`.d.ts` 中有些元件用：

```ts
'v-slots'?: {
  header?: () => any;
  footer?: () => any;
}
```

這能提示 slot 名稱，但無法完整描述 scoped slot props。

如果某些 slot 實際會傳：

```txt
row
column
index
option
node
```

目前型別不一定能精準呈現。對 Table、Tree、Select 這類元件，slot props 型別也是重要改良點。

---

## 9. 改良時的優先順序

如果要逐步改善，不應一次全面重寫。建議優先順序：

1. 補 runtime/type 明顯缺口，例如 `capture`、named exports。
2. 為 `$Message`、`$Modal`、`$Notice` 補 service interface，替代 `any`。
3. 精準化高頻元件的 event payload，例如 Input、Select、Table。
4. 導出資料型元件的 helper types，例如 `TableColumn<T>`、`FormRules<T>`。
5. 最後再考慮泛型化 component declaration。

這樣可以降低破壞性，也讓改良能被驗證。

---

## 10. 本章結論

View UI Plus v1.3.20 的型別系統是一套實用的 declaration layer。它能提供大量 props autocomplete、component named exports、plugin install signature 與 Vue global properties 基礎支援。

它的主要邊界在於：runtime source 和 `.d.ts` 分離、弱型別較多、事件 payload 不精準、global service 只有 `any`、資料型元件缺少泛型。

因此閱讀這套型別時，不能用「有沒有型別」二分判斷，而要問：

```txt
這個 declaration 精準到哪一層？
是 props-level、property-level、method-level，還是 data-flow-level？
```

---

## 11. 自我檢查問題

1. 為什麼 JS runtime + `.d.ts` 分離會造成同步成本？
2. `any` 的好處和代價分別是什麼？
3. `onOnChange` 背後代表哪種相容性取捨？
4. `$Message: any` 算不算完整 service contract？
5. 為什麼改良型別時不應一開始就全面泛型化？

