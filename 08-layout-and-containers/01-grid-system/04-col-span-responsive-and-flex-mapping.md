# Col Runtime：span、responsive 與 flex 映射

## 1. 本章定位

本篇聚焦 `Col` runtime：

```txt
01-origin/source/view-ui-plus-v1.3.20/src/components/col/col.vue
```

`Col` 的核心任務是把使用者傳入的欄格 props 轉成兩種輸出：

```txt
class
  -> span / order / offset / push / pull / responsive

inline style
  -> gutter padding / flex
```

---

## 2. Template：欄位 wrapper

`Col` 的 template 和 `Row` 一樣很薄：

```vue
<div :class="classes" :style="styles">
    <slot></slot>
</div>
```

因此，閱讀重點不是 template，而是：

1. `inject` 如何取得 `RowInstance`。
2. `classes` 如何生成欄格 class。
3. `styles` 如何生成 gutter padding 與 flex style。

---

## 3. inject：取得 `RowInstance`

`Col` 宣告：

```js
inject: ['RowInstance']
```

接著透過 computed 取得 gutter：

```js
gutter () {
    return this.RowInstance.gutter;
}
```

這代表 `Col` 的 gutter 不是自己的 prop，而是來自父層 `Row`。正常閱讀時，應把 `Col` 放在 `Row` 的語境中理解。

---

## 4. 基礎欄格 props 到 class

`Col.classes` 一開始會建立基礎 class：

```txt
ivu-col
```

再依照 props 追加 class。

| Prop | 範例 | 產生 class |
| --- | --- | --- |
| `span` | `span="6"` | `ivu-col-span-6` |
| `order` | `order="2"` | `ivu-col-order-2` |
| `offset` | `offset="4"` | `ivu-col-offset-4` |
| `push` | `push="6"` | `ivu-col-push-6` |
| `pull` | `pull="18"` | `ivu-col-pull-18` |
| `className` | `class-name="demo"` | `demo` |

這些 class 的 CSS 不是在 `col.vue` 中計算，而是由 Less mixin 生成。

---

## 5. responsive props：number 寫法

responsive props 包含：

```txt
xs / sm / md / lg / xl / xxl
```

當某個 responsive prop 是 number 時，`Col` 會產生 span class：

```vue
<Col :xs="2" :sm="4" :md="6" :lg="8" />
```

概念上產生：

```txt
ivu-col-span-xs-2
ivu-col-span-sm-4
ivu-col-span-md-6
ivu-col-span-lg-8
```

這代表 number 寫法只描述「在該 breakpoint 下占幾欄」。

---

## 6. responsive props：object 寫法

當 responsive prop 是 object 時，`Col` 會遍歷 object keys：

```vue
<Col :xs="{ span: 5, offset: 1 }" :lg="{ span: 6, offset: 2 }" />
```

概念上產生：

```txt
ivu-col-span-xs-5
ivu-col-xs-offset-1
ivu-col-span-lg-6
ivu-col-lg-offset-2
```

object 寫法可以同時描述：

| key | class pattern |
| --- | --- |
| `span` | `ivu-col-span-{size}-{value}` |
| `offset` | `ivu-col-{size}-offset-{value}` |
| `push` | `ivu-col-{size}-push-{value}` |
| `pull` | `ivu-col-{size}-pull-{value}` |
| `order` | `ivu-col-{size}-order-{value}` |

runtime 沒有特別限制 object key 只能是這些名稱。它會把 `span` 特別處理，其餘 key 直接套入 class pattern。因此筆記中應以 source 行為為準，不要把 validator 沒有做的限制寫成 runtime 保證。

---

## 7. `styles`：gutter padding

當父層 `Row.gutter !== 0` 時，`Col` 會產生左右 padding：

```txt
gutter = 16
  -> paddingLeft: 8px
  -> paddingRight: 8px
```

這和 `Row` 的負 margin 配合：

```txt
Row margin = -gutter / 2
Col padding = gutter / 2
```

所以 `gutter` 的完整效果一定要在父子兩層一起看。

---

## 8. `flex` prop 與 `parseFlex()`

`Col` 支援 `flex` prop：

```js
flex: {
    type: [Number, String],
    default: ''
}
```

如果 `flex` 有值，`styles` 會設定：

```js
style.flex = parseFlex(this.flex);
```

`parseFlex()` 有三種分支。

| 傳入值 | 輸出 | 說明 |
| --- | --- | --- |
| `2` | `2 2 auto` | number 會變成 grow / shrink 同值，basis 為 auto。 |
| `100px` | `0 0 100px` | 符合 `px` / `em` / `rem` / `%` 的尺寸字串會固定 basis。 |
| `auto` | `auto` | 其他字串原樣返回。 |
| `1 1 200px` | `1 1 200px` | 完整 flex shorthand 原樣返回。 |

官方 example 中展示：

```vue
<Col :flex="2">2 / 5</Col>
<Col flex="100px">100px</Col>
<Col flex="auto">Fill Rest</Col>
<Col flex="1 1 200px">1 1 200px</Col>
<Col flex="0 1 300px">0 1 300px</Col>
```

---

## 9. 對照 Less class 效果

`Col` runtime 只產生 class，欄格效果由 Less 接住。

| Runtime class | Less 效果 |
| --- | --- |
| `ivu-col` | `position: relative; max-width: 100%; min-height: 1px;` |
| `ivu-col-span-6` | `display: block; flex: 0 0 25%; max-width: 25%;` |
| `ivu-col-span-0` | `display: none;` |
| `ivu-col-offset-6` | `margin-left: 25%;` |
| `ivu-col-push-6` | `left: 25%;` |
| `ivu-col-pull-6` | `right: 25%;` |
| `ivu-col-order-6` | `order: 6;` |

百分比來自：

```txt
value / @grid-columns
```

在預設 24 欄系統中，`6 / 24 = 25%`。

---

## 10. 常見誤區

| 誤區 | 正確理解 |
| --- | --- |
| `Col` 自己有 `gutter` prop | `gutter` 來自 injected `RowInstance`。 |
| `span` 會直接產生 inline width | `span` 只產生 class，寬度由 Less class 定義。 |
| responsive object 由 type system 嚴格限制 | runtime 只是遍歷 object keys 並組 class。 |
| `flex="100px"` 等於原樣輸出 | 尺寸字串會被轉成 `0 0 100px`。 |
| `span=0` 只是寬度為 0 | Less 對 `span-0` 定義為 `display: none`。 |

---

## 11. 本篇小結

`Col` 是 grid system 的欄位映射層：

```txt
props
  -> classList
  -> gutter padding
  -> flex inline style
  -> Less generated grid CSS
```

讀懂 `Col` 後，下一步應該回到 `layout.less` 和 `mixins/layout.less`，確認這些 class 如何被 Less 轉成真正 CSS。

