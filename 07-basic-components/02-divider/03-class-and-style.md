# Divider Class And Style：從 class 組合到 less 視覺規則

## 0. 原始筆記問題分析

原本筆記已經指出需要對照 `divider.less`，但還沒有把 runtime class 與 less selector 一一接起來。對 `Divider` 來說，這一步很重要，因為線條不一定由同一種 CSS 技術畫出：普通水平線、垂直線、虛線、帶文字線各自有不同規則。

這篇筆記會聚焦 `src/styles/components/divider.less`，整理 props 產生的 class 如何被樣式系統解讀。

---

## 1. 本章定位

本章是一篇 class / style 對照筆記，專門分析 `Divider` 的 class 如何對應到 less 視覺規則。它不重複講解 props 與 slot 的 runtime 流程，那部分已經放在 `02-props-slot-and-structure.md`。

讀完後，應該能回答：

1. 水平分隔線和垂直分隔線的樣式差異。
2. 帶文字分隔線為什麼需要 `:before` 和 `:after`。
3. `dashed` 如何同時處理普通線與帶文字線。
4. `size="small"` 和 `plain` 分別改到哪些樣式。

---

## 2. 學習前先建立的基本觀念

元件庫中的 class 不是裝飾性的字串，而是 runtime 與 style source 之間的契約。`Divider` 的 runtime 不直接設定 inline style，而是產生一組 `ivu-divider-*` class，讓 less 決定真正的視覺結果。

可以用這條線閱讀：

```txt
props / slot
  -> ivu-divider-* classes
  -> divider.less selectors
  -> background / border / pseudo-elements / typography
```

這裡的重點是 selector 組合。`divider.less` 很多規則不是單一 class，而是多個 class 同時出現在同一個根節點時才生效，例如：

```less
&-horizontal&-with-text-left
```

這代表同一個元素要同時有 `ivu-divider-horizontal` 與 `ivu-divider-with-text-left`，規則才會命中。

---

## 3. Class Matrix

| 情境 | Runtime 主要 class | Less 責任 |
| --- | --- | --- |
| 普通水平線 | `ivu-divider-horizontal` | block、`height: 1px`、`width: 100%`、上下 margin。 |
| 垂直線 | `ivu-divider-vertical` | inline-block、`width: 1px`、`height: 0.9em`、行內對齊。 |
| 帶置中文字 | `ivu-divider-with-text`、`ivu-divider-with-text-center` | table 佈局，左右線使用 `:before` / `:after`。 |
| 帶左側文字 | `ivu-divider-with-text-left` | 左側線寬 5%，右側線寬 95%。 |
| 帶右側文字 | `ivu-divider-with-text-right` | 左側線寬 95%，右側線寬 5%。 |
| small | `ivu-divider-small` | 搭配帶文字 class 時縮小字級與 margin。 |
| dashed | `ivu-divider-dashed` | 普通線改用 dashed border，帶文字線改 pseudo-elements border style。 |
| plain | `ivu-divider-plain` | 帶文字時改成普通文字色、normal weight、base font size。 |

這張表應該配合 runtime class 一起看。`Divider` 的視覺不是由單一 prop 決定，而是多個 class 同時命中後疊加出來。

---

## 4. 基礎樣式與垂直線

`divider.less` 一開始定義 prefix：

```less
@divider-prefix-cls: ~"@{css-prefix}divider";
```

在 View UI Plus 預設前綴下，這會對應到 `ivu-divider`。

根 class 先套用 reset 與背景色：

```less
.@{divider-prefix-cls} {
    .reset-component;
    background: @border-color-split;
}
```

接著有一段同時命中根 class 與 vertical class：

```less
&, // for compatiable
&-vertical {
    margin: 0 8px;
    display: inline-block;
    height: 0.9em;
    width: 1px;
    vertical-align: middle;
    position: relative;
    top: -0.06em;
}
```

這表示垂直線本質上是一個行內塊狀的 1px 寬元素，適合放在文字、連結或操作項之間。官方範例也是把它放在 `iView`、`Components`、`Divider` 這類行內內容之間。

---

## 5. 普通水平線

水平線由 `ivu-divider-horizontal` 控制：

```less
&-horizontal {
    display: block;
    height: 1px;
    width: 100%;
    min-width: 100%;
    margin: 24px 0;
    clear: both;
}
```

這裡的線條主要來自根節點背景色，加上 `height: 1px`。所以普通水平分隔線可以理解成一個高度為 1px、寬度撐滿容器的 block 元素。

`margin: 24px 0` 說明普通水平線不只是畫線，也負責上下內容的視覺間距。

---

## 6. 帶文字分隔線

帶文字的水平分隔線會命中這組 selector：

```less
&-horizontal&-with-text-center,
&-horizontal&-with-text-left,
&-horizontal&-with-text-right {
    display: table;
    white-space: nowrap;
    text-align: center;
    background: transparent;
    font-weight: 500;
    color: @title-color;
    font-size: @font-size-large;
    margin: 16px 0;
}
```

這裡有幾個關鍵變化。

第一，`display` 從普通水平線的 `block` 變成 `table`。這是為了讓 `:before`、文字、`:after` 可以像表格儲存格一樣排在同一行。

第二，`background` 變成 transparent。帶文字分隔線不再依靠根節點背景畫線。

第三，文字樣式變成較醒目的 title 風格，包含較大的字級與較高的字重。

左右線由 pseudo-elements 畫出：

```less
&:before,
&:after {
    content: '';
    display: table-cell;
    top: 50%;
    width: 50%;
    border-top: 1px solid @border-color-split;
    transform: translateY(50%);
}
```

這就是帶文字分隔線的關鍵：線條不是根節點本身，而是 `:before` 與 `:after`。

---

## 7. 文字位置：center、left、right

center 情境使用預設的左右各 50%：

```txt
before width: 50%
text
after width: 50%
```

left 情境覆蓋成：

```less
&-horizontal&-with-text-left {
    &:before {
        width: 5%;
    }
    &:after {
        width: 95%;
    }
}
```

right 情境覆蓋成：

```less
&-horizontal&-with-text-right {
    &:before {
        width: 95%;
    }
    &:after {
        width: 5%;
    }
}
```

這裡要注意，`orientation="left"` 不是把文字貼到最左邊，而是讓左側線段變短、右側線段變長。`orientation="right"` 則相反。這組 selector 都以 `&-horizontal` 開頭，因此文字位置樣式的主線是水平帶文字分隔線。

另外，left / right 情境會特別設定 inner text padding：

```less
&-horizontal&-with-text-left,
&-horizontal&-with-text-right {
    .@{divider-prefix-cls}-inner-text {
        display: inline-block;
        padding: 0 10px;
    }
}
```

center 情境則使用通用 inner text padding：

```less
&-inner-text {
    display: inline-block;
    padding: 0 24px;
}
```

---

## 8. small 尺寸

`size="small"` 會讓 runtime 加上 `ivu-divider-small`。在 less 中，它主要搭配帶文字分隔線使用：

```less
&-horizontal&-small&-with-text-center,
&-horizontal&-small&-with-text-left,
&-horizontal&-small&-with-text-right {
    font-size: @font-size-base;
    margin: 8px 0;
}
```

這代表 `small` 的主要效果是縮小帶文字分隔線的字級與上下 margin。對普通不帶文字的水平線，這段 selector 不會命中，因此不應把 `size` 理解成所有情境都同等強烈的尺寸控制。

---

## 9. dashed 虛線

普通虛線由 `ivu-divider-dashed` 控制：

```less
&-dashed {
    background: none;
    border-top: 1px dashed @border-color-split;
}
```

這裡把背景拿掉，改用 `border-top` 畫 dashed 線。

帶文字虛線需要另一組規則：

```less
&-horizontal&-with-text&-dashed,
&-horizontal&-with-text-left&-dashed,
&-horizontal&-with-text-right&-dashed {
    border-top: 0;
    &:before,
    &:after {
        border-style: dashed none none;
    }
}
```

原因是帶文字線本來就是 `:before` 和 `:after` 的 border 畫出來。如果只改根節點 `border-top`，就會和文字結構不匹配。因此 dashed 在帶文字情境下必須改 pseudo-elements 的 border style。

---

## 10. plain 文字樣式

`plain` 的 less selector 是：

```less
&-plain&-with-text,
&-plain&-with-text-left,
&-plain&-with-text-right {
    color: @text-color;
    font-weight: normal;
    font-size: @font-size-base;
}
```

這說明 `plain` 主要作用在帶文字分隔線的文字樣式上。預設帶文字分隔線會使用 title 色、較大字級與 `font-weight: 500`；加上 `plain` 後，文字回到普通正文色、普通字重與 base 字級。

所以 `plain` 不應被理解成新的線條類型。它更像是帶文字分隔線的文字降級模式。

---

## 11. 常見誤區

| 誤區 | 正確理解 |
| --- | --- |
| `Divider` 的線都是 background 畫出來的 | 普通水平線用 background，虛線用 border，帶文字線用 pseudo-elements。 |
| `size="small"` 會改所有分隔線高度 | less 中 small 主要搭配帶文字 selector，影響字級與 margin。 |
| `plain` 會讓線條變淡或變細 | plain 主要改文字 color、font-weight、font-size。 |
| `orientation="left"` 是絕對靠左 | 實作上是調整 `:before` 與 `:after` 的寬度比例。 |
| 垂直分隔線的文字位置也由 `orientation` 控制 | less 的帶文字位置 selector 以 `horizontal` 為前提，官方範例也沒有垂直帶文字用法。 |

---

## 12. 本章總結

`Divider` 的樣式設計重點在於 class 組合。runtime 產生 `ivu-divider-horizontal`、`ivu-divider-with-text-left`、`ivu-divider-dashed`、`ivu-divider-plain` 等 class，less 再根據這些 class 的組合決定線條如何被畫出來。

普通水平線、垂直線、虛線、帶文字線雖然都屬於 `Divider`，但背後使用的 CSS 技術不同。讀懂這一點後，就能理解為什麼 `Divider` 的 runtime 很短，卻仍然需要完整對照 style source。

---

## 13. 自我檢查問題

1. 普通水平分隔線主要由哪個 class 和哪些 CSS 屬性形成？
2. 垂直分隔線為什麼使用 `inline-block`？
3. 帶文字分隔線為什麼要把背景改成 transparent？
4. `orientation="left"` 對 `:before` 和 `:after` 的寬度有什麼影響？
5. dashed 在普通線與帶文字線中的處理方式有什麼差異？
6. `plain` 改的是線條本身，還是文字樣式？
