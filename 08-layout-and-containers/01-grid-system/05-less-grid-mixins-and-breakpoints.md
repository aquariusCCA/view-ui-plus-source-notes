# Less Grid Mixins：24 欄 class 與 breakpoint 如何生成

## 1. 本章定位

本篇補上 `Row` / `Col` runtime 看不到的部分：grid system 的 CSS 生成。

核心來源是：

```txt
01-origin/source/view-ui-plus-v1.3.20/src/styles/common/layout.less
01-origin/source/view-ui-plus-v1.3.20/src/styles/mixins/layout.less
```

`Row` / `Col` 的 `.vue` 檔只負責產生 class 名稱，真正讓 `ivu-col-span-6` 變成 25% 寬度的是 Less。

---

## 2. 為什麼 grid style 放在 common

多數元件樣式位於：

```txt
src/styles/components/
```

但 `Row` / `Col` 的 grid system 位於：

```txt
src/styles/common/layout.less
```

原因可以從責任上理解：grid 是基礎布局能力，不是某個複雜 component 的局部樣式。它提供整個元件庫都可依賴的欄格與布局基礎。

common style entry 會匯入它：

```txt
src/styles/common/index.less
  @import "layout";
```

---

## 3. Row 基礎樣式

`layout.less` 中的 row 基礎樣式包括：

| Class | 效果 |
| --- | --- |
| `.ivu-row` | `display: flex; flex-flow: row wrap;` |
| `.ivu-row::before` / `.ivu-row::after` | `display: flex;` |
| `.ivu-row-no-wrap` | `flex-wrap: nowrap;` |

這代表在此版本中，即使不寫 `type="flex"`，`.ivu-row` 也已經是 flex row。

---

## 4. Row 對齊樣式

`Row.align` 與 `Row.justify` 產生的 class 在 `layout.less` 中被接住。

| Runtime class | CSS |
| --- | --- |
| `.ivu-row-start` | `justify-content: flex-start;` |
| `.ivu-row-center` | `justify-content: center;` |
| `.ivu-row-end` | `justify-content: flex-end;` |
| `.ivu-row-space-between` | `justify-content: space-between;` |
| `.ivu-row-space-around` | `justify-content: space-around;` |
| `.ivu-row-top` | `align-items: flex-start;` |
| `.ivu-row-middle` | `align-items: center;` |
| `.ivu-row-bottom` | `align-items: flex-end;` |

這些 class 是 runtime 和 style 的交會點：`row.vue` 產生 class，`layout.less` 定義效果。

---

## 5. Col 基礎樣式

`layout.less` 先定義 `.ivu-col` 基礎樣式：

| CSS | 目的 |
| --- | --- |
| `position: relative;` | 讓 push / pull 的 left / right 位移可生效。 |
| `max-width: 100%;` | 避免欄位超出容器最大寬度。 |
| `min-height: 1px;` | 避免空欄位 collapse。 |

真正的 span、offset、push、pull、order class 則由 mixin 產生。

---

## 6. `.make-grid()`：生成欄格 class 的入口

`layout.less` 呼叫：

```less
.make-grid();
.make-grid(-xs);

@media (min-width: @screen-sm-min) {
    .make-grid(-sm);
}
```

後續還包含 `md`、`lg`、`xl`、`xxl`。

`.make-grid()` 定義在：

```txt
src/styles/mixins/layout.less
```

概念上它會從 `@grid-columns` 往下迴圈，產生每一欄對應的 class。

---

## 7. `span` class 如何生成

`.loop-grid-columns(@index, @class)` 在 `@index > 0` 時產生：

```less
.@{col-prefix-cls}-span@{class}-@{index} {
    display: block;
    flex: 0 0 percentage((@index / @grid-columns));
    max-width: percentage((@index / @grid-columns));
}
```

如果 `@grid-columns = 24`：

| Class | 計算 | 效果 |
| --- | --- | --- |
| `ivu-col-span-6` | `6 / 24` | `25%` |
| `ivu-col-span-8` | `8 / 24` | `33.333333%` |
| `ivu-col-span-12` | `12 / 24` | `50%` |
| `ivu-col-span-24` | `24 / 24` | `100%` |

這說明欄格寬度不是 runtime inline style，而是 Less 預先生成 class。

---

## 8. `span-0` 的特殊規則

當 `@index = 0` 時，mixin 產生：

```less
.@{col-prefix-cls}-span@{class}-@{index} {
    display: none;
}
```

也就是：

```txt
ivu-col-span-0
  -> display: none
```

這點應該寫進筆記，因為它不是「寬度為 0%」而是直接不顯示。

---

## 9. offset / push / pull / order class

在 `@index > 0` 時，mixin 還會產生：

| Class pattern | CSS | 用途 |
| --- | --- | --- |
| `.ivu-col-push-{n}` | `left: percentage(n / 24);` | 向右位移。 |
| `.ivu-col-pull-{n}` | `right: percentage(n / 24);` | 向左位移。 |
| `.ivu-col-offset-{n}` | `margin-left: percentage(n / 24);` | 左側間隔。 |
| `.ivu-col-order-{n}` | `order: n;` | flex 排序。 |

在 `@index = 0` 時，push / pull / offset / order 會有歸零規則，例如 left / right 回到 `auto`，offset 回到 `0`，order 回到 `0`。

---

## 10. responsive class 與 breakpoint

responsive grid 不是 runtime 偵測 viewport，而是 CSS media query。

`layout.less` 的 breakpoint 入口如下：

| 呼叫 | breakpoint |
| --- | --- |
| `.make-grid(-xs)` | 無 media query，對應 extra small。 |
| `.make-grid(-sm)` | `@media (min-width: @screen-sm-min)` |
| `.make-grid(-md)` | `@media (min-width: @screen-md-min)` |
| `.make-grid(-lg)` | `@media (min-width: @screen-lg-min)` |
| `.make-grid(-xl)` | `@media (min-width: @screen-xl-min)` |
| `.make-grid(-xxl)` | `@media (min-width: @screen-xxl-min)` |

因此：

```txt
<Col :md="6" />
  -> runtime class: ivu-col-span-md-6
  -> CSS 在 min-width: @screen-md-min 時生效
```

---

## 11. Runtime class 與 Less class pattern 對照

| Runtime 來源 | Runtime class | Less 來源 |
| --- | --- | --- |
| `span="6"` | `ivu-col-span-6` | `.make-grid()` |
| `offset="6"` | `ivu-col-offset-6` | `.make-grid()` |
| `push="6"` | `ivu-col-push-6` | `.make-grid()` |
| `pull="6"` | `ivu-col-pull-6` | `.make-grid()` |
| `order="6"` | `ivu-col-order-6` | `.make-grid()` |
| `:xs="6"` | `ivu-col-span-xs-6` | `.make-grid(-xs)` |
| `:md="{ offset: 2 }"` | `ivu-col-md-offset-2` | `.make-grid(-md)` inside media query |

這張表是讀 grid system 的核心：runtime 和 Less 必須一起看。

---

## 12. 本篇小結

`Row` / `Col` 的 grid system 不是靠 JavaScript 即時計算所有欄寬，而是靠穩定 class naming 加上 Less 批次生成。

可以概括為：

```txt
Col props
  -> ivu-col-* class
  -> layout.less calls make-grid
  -> mixins/layout.less loops 0..24
  -> CSS handles width / offset / movement / order
```

這種設計讓 runtime 保持簡單，也讓 grid class 可以在 CSS 層被瀏覽器直接套用 responsive 規則。

