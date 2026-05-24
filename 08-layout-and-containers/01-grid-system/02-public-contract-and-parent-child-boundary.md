# Row / Col Public Contract 與父子邊界

## 1. 本章定位

本篇先從使用者能看到的 public contract 切入，再回到 `Row` / `Col` 的父子關係。

`Row` / `Col` 沒有複雜事件、沒有 v-model，也沒有內部狀態機。它們的 public surface 主要由三件事組成：

```txt
props
  -> default slot
  -> class / inline style output
```

其中真正需要一起理解的是父子邊界：`Row` 提供 `RowInstance`，`Col` 注入它並讀取 `gutter`。

---

## 2. `Row` public contract

`Row` 的 runtime props 來自：

```txt
src/components/row/row.vue
```

| Prop | Runtime type / validator | 預設值 | 用途 |
| --- | --- | --- | --- |
| `type` | validator: `flex` | 無 | 歷史相容用，會產生 `ivu-row-flex` 相關 class。 |
| `align` | `top` / `middle` / `bottom` | 無 | 控制交叉軸對齊 class。 |
| `justify` | `start` / `end` / `center` / `space-around` / `space-between` | 無 | 控制主軸排列 class。 |
| `gutter` | `Number` | `0` | 控制欄格間距，父層負 margin、子層 padding。 |
| `className` | `String` | 無 | 追加自訂 class。 |
| `wrap` | `Boolean` | `true` | 控制是否允許 flex wrap。 |

`Row` 的 slot 很單純：

| Slot | 用途 |
| --- | --- |
| default | 放置 `Col` 或其他內容。 |

`Row` 沒有對外 emits，也沒有 v-model。

---

## 3. `Col` public contract

`Col` 的 runtime props 來自：

```txt
src/components/col/col.vue
```

| Prop | Runtime type | 用途 |
| --- | --- | --- |
| `span` | `Number` / `String` | 欄位占位格數，轉成 `ivu-col-span-*`。 |
| `order` | `Number` / `String` | flex order，轉成 `ivu-col-order-*`。 |
| `offset` | `Number` / `String` | 左側間隔，轉成 `ivu-col-offset-*`。 |
| `push` | `Number` / `String` | 向右位移，轉成 `ivu-col-push-*`。 |
| `pull` | `Number` / `String` | 向左位移，轉成 `ivu-col-pull-*`。 |
| `className` | `String` | 追加自訂 class。 |
| `xs` | `Number` / `Object` | `<576px` responsive 欄格設定。 |
| `sm` | `Number` / `Object` | `>=576px` responsive 欄格設定。 |
| `md` | `Number` / `Object` | `>=768px` responsive 欄格設定。 |
| `lg` | `Number` / `Object` | `>=992px` responsive 欄格設定。 |
| `xl` | `Number` / `Object` | `>=1200px` responsive 欄格設定。 |
| `xxl` | `Number` / `Object` | `>=1600px` responsive 欄格設定。 |
| `flex` | `Number` / `String` | 產生 inline `flex` style。 |

`Col` 的 slot 同樣只有 default slot，用來承載欄位內容。

`Col` 沒有 emits，也沒有 v-model。

---

## 4. 父子關係：`RowInstance`

`Row` 透過 `provide()` 暴露自身 instance：

```txt
Row
  -> provide RowInstance: this
```

`Col` 透過 inject 取得父層：

```txt
Col
  -> inject RowInstance
  -> gutter = RowInstance.gutter
```

這個關係只用來處理 `gutter`。也就是說，`Row` 不會主動遍歷子 `Col`，也不會把 `span`、`offset`、responsive 設定傳給子層。`Col` 自己根據 props 產生 class，只是從 `Row` 讀取 gutter。

概念流程如下：

```txt
<Row :gutter="16">
  <Col span="6" />
</Row>

Row.styles
  -> marginLeft: -8px
  -> marginRight: -8px

Col.styles
  -> paddingLeft: 8px
  -> paddingRight: 8px
```

---

## 5. 父子邊界不要誤讀

讀 `Row` / `Col` 時，要避免三個誤判。

第一，不要以為 `Row` 會管理子 `Col` 的 span。`span` 是 `Col` 自己的 prop，`Row` 只提供 gutter。

第二，不要把 `Col` 當成完全獨立元件。它的 `gutter` computed 直接讀 `RowInstance.gutter`，所以正常使用語境是放在 `Row` 裡。

第三，不要把 `gutter` 理解成單純加在 `Col` 上的 padding。它同時需要 `Row` 的負 margin 才能抵消外側多出的半個 gutter。

---

## 6. Type declaration 對照

TypeScript public contract 來自：

```txt
types/row.d.ts
```

`Row` 和 `Col` 被放在同一個 type file 中：

```txt
export declare const Row: DefineComponent<...>
export declare const Col: DefineComponent<...>
```

需要注意的差異：

| 項目 | Runtime | `.d.ts` | 筆記結論 |
| --- | --- | --- | --- |
| `Row.type` | 存在，validator 只允許 `flex`。 | 未列出。 | 筆記中應標成 runtime 支援但 type 未描述。 |
| `Col.xs` 到 `xxl` | `Number` / `Object`。 | `string | object`。 | runtime 與 type 有寬窄差異，應回到 source 確認。 |
| `className` | runtime prop 名稱是 `className`。 | template contract 寫成 `'class-name'`。 | Vue template 使用 kebab-case，source 使用 camelCase。 |

---

## 7. Public export 與 install

`Row` / `Col` 在 runtime public export 中存在：

```txt
src/components/index.js
  export { default as Col } from './col';
  export { default as Row } from './row';
```

在 plugin install 的 component map 中，`Col` 還有一個 alias：

```txt
iCol: components.Col
```

也就是說，全量安裝時，除了 `Col`，也會註冊 `iCol`。這類 alias 通常是為了避免和原生或其他語境中的名稱衝突，筆記中只需要記錄現象，不要擴展成未被 source 證明的設計意圖。

Type export 也存在：

```txt
types/viewuiplus.components.d.ts
  export { Row, Col } from './row'
```

---

## 8. 本篇小結

`Row` / `Col` 的 public contract 很薄，但父子邊界很關鍵。

可以把它們分工整理成：

| 元件 | 責任 |
| --- | --- |
| `Row` | 建立 flex row、控制 align / justify / wrap、透過負 margin 處理 gutter、提供 `RowInstance`。 |
| `Col` | 根據 span / offset / push / pull / order / responsive props 產生 class，根據 gutter / flex 產生 inline style。 |
| Less | 把 runtime 產生的 class 轉成真正的欄寬、位移、排序與 responsive CSS。 |

