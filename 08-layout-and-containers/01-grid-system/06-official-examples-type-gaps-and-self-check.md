# Row / Col Examples、Type Gaps 與自我檢查

## 1. 本章定位

本篇用官方 example 回扣 `Row` / `Col` 的主要使用場景，並整理 runtime source 與 type declaration 之間需要注意的差異。

主要來源：

```txt
01-origin/source/view-ui-plus-v1.3.20/examples/routers/grid.vue
01-origin/source/view-ui-plus-v1.3.20/types/row.d.ts
01-origin/source/view-ui-plus-v1.3.20/src/components/row/row.vue
01-origin/source/view-ui-plus-v1.3.20/src/components/col/col.vue
```

---

## 2. 官方 example 覆蓋的主線場景

`examples/routers/grid.vue` 覆蓋了 `Row` / `Col` 的多數主線能力。

| 場景 | Example 特徵 | 對應 source 重點 |
| --- | --- | --- |
| 基本 24 欄 | `12 + 12`、`8 + 8 + 8`、`6 * 4` | `Col.span` 產生 span class。 |
| gutter | `<Row :gutter="16">` | `Row` 負 margin、`Col` padding。 |
| flex order | `<Row type="flex">` 搭配 `order` | `Col.order` class 與 Less `order`。 |
| push / pull | `span="18" push="6"`、`span="6" pull="18"` | `left` / `right` 位移 class。 |
| offset | `offset="8"`、`offset="4"` | margin-left class。 |
| justify | `start`、`end`、`center`、`space-between`、`space-around` | `Row.justify` class。 |
| align | `top`、`bottom`、`middle` | `Row.align` class。 |
| responsive number | `:xs="2" :sm="4" :md="6" :lg="8"` | responsive span class。 |
| responsive object | `:xs="{ span: 5, offset: 1 }"` | responsive span / offset class。 |
| flex fill | `:flex="2"`、`:flex="3"` | `parseFlex(number)`。 |
| fixed flex basis | `flex="100px"` | `parseFlex(size)`。 |
| raw flex shorthand | `flex="1 1 200px"` | `parseFlex()` 原樣返回。 |
| no-wrap | `<Row :wrap="false">` | `ivu-row-no-wrap`。 |

examples 的價值是反推官方主推用法，但不能取代 runtime source。若 example 沒展示某個 branch，不代表 runtime 不支援。

---

## 3. Runtime 與 type declaration 差異

`types/row.d.ts` 是 TypeScript 使用者看到的 public contract，但它不完全等於 runtime source。

### 3.1 `Row.type`

Runtime 中存在：

```txt
type
  validator only allows flex
```

但 `types/row.d.ts` 沒有列出 `type`。

筆記中應寫成：

```txt
runtime 支援 type="flex"，但 type declaration 未描述。
```

不要為了讓筆記看起來整齊而把兩者強行寫成一致。

### 3.2 responsive props 型別

`col.vue` runtime：

```txt
xs / sm / md / lg / xl / xxl: [Number, Object]
```

`types/row.d.ts`：

```txt
xs?: string | object;
sm?: string | object;
...
```

這裡有明顯差異。官方 example 使用的是 number 與 object：

```vue
<Col :xs="2" :sm="4" :md="6" :lg="8">Col</Col>
```

因此，行為判斷應以 runtime 與 example 為主要依據，並在筆記中記錄 `.d.ts` 差異。

### 3.3 `className` 與 `'class-name'`

runtime source 使用：

```txt
className
```

type declaration 使用：

```txt
'class-name'
```

這符合 Vue template 中 camelCase prop 可用 kebab-case 書寫的習慣。筆記中可以同時標記 source 名稱與 template 使用名稱。

---

## 4. 測試覆蓋狀態

在目前本地 source 的 `test/unit/specs/` 中，未看到直接針對 `Row` / `Col` 的 unit test。

這代表：

1. 不應在筆記中寫「測試保證 Row / Col 行為」。
2. 行為證據主要來自 runtime source、Less source、type declaration 與 official example。
3. 若未來要補測試，可優先覆蓋 gutter、class mapping、responsive class、flex parse。

沒有直接 unit test 不代表行為不存在，只代表筆記中不能把測試覆蓋當成證據。

---

## 5. 可補的測試思路

如果後續要為 mini implementation 或 source reading 補測試，可以從這些場景開始：

| 測試方向 | 驗證內容 |
| --- | --- |
| `Row.gutter` | `gutter=16` 時 row margin 為 `-8px`。 |
| `Col.gutter` | 注入 `RowInstance.gutter=16` 時 col padding 為 `8px`。 |
| `Row.align` / `justify` | props 能產生對應 `ivu-row-*` class。 |
| `Row.wrap=false` | 產生 `ivu-row-no-wrap`。 |
| `Col.span` | `span=6` 產生 `ivu-col-span-6`。 |
| responsive number | `md=6` 產生 `ivu-col-span-md-6`。 |
| responsive object | `{ span: 6, offset: 2 }` 產生 span 與 offset class。 |
| `Col.flex` number | `flex=2` 產生 `flex: 2 2 auto`。 |
| `Col.flex` size | `flex="100px"` 產生 `flex: 0 0 100px`。 |

這些測試不需要驗證完整瀏覽器 layout，只要驗證 runtime class / style mapping，就能保護大部分核心邏輯。

---

## 6. 自我檢查問題

讀完 `01-grid-system/` 後，應該能回答下列問題。

1. `Row` / `Col` 的 template 為什麼都很薄？
2. `Row` 的 `provide()` 提供了什麼？`Col` inject 後拿它做什麼？
3. `gutter=16` 時，`Row` 和 `Col` 分別會產生什麼 inline style？
4. `align="middle"` 與 `justify="space-between"` 分別會產生什麼 class？
5. `wrap=false` 對應哪個 class？Less 中對應什麼效果？
6. `span="6"` 如何從 prop 變成 25% 欄寬？
7. `offset`、`push`、`pull` 的 CSS 差異是什麼？
8. responsive number 寫法和 object 寫法分別產生什麼 class？
9. `:flex="2"`、`flex="100px"`、`flex="auto"`、`flex="1 1 200px"` 分別如何被 `parseFlex()` 處理？
10. `span=0` 在 Less 中是寬度 0 還是 `display: none`？
11. `Row.type` 在 runtime 和 `.d.ts` 中是否一致？
12. `Col.xs` 到 `xxl` 在 runtime 和 `.d.ts` 中是否一致？
13. 官方 example 展示了哪些 grid system 主線場景？
14. 目前本地 source 是否有直接命中的 `Row` / `Col` unit test？
15. 如果要仿作 mini grid，最小需要實作哪些 runtime mapping？

---

## 7. 本組筆記總結

`Row` / `Col` 是 layout/container 章節最適合作為起點的一組元件，因為它們狀態少，但橫跨 runtime、父子注入、inline style、Less mixin、responsive breakpoint 與 type declaration。

完整理解可以收斂成一條主線：

```txt
Row controls row-level layout and gutter
  -> Col consumes gutter and maps grid props to classes
  -> Less generates 24-column and responsive CSS
  -> examples confirm official usage patterns
  -> type declaration documents public surface with some gaps
```

掌握這條主線後，再讀 `Layout`、`Card`、`Grid`、`Collapse` 等容器元件時，就能更自然地把 runtime、style、type 與 example 分開觀察。
