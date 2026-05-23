# Divider Class And Style：從 class 組合理解 Less 視覺規則

## 0. 筆記類型判斷與原始筆記問題分析

這份筆記屬於 **原始碼閱讀筆記** 與 **樣式對照筆記** 的混合型內容，主軸是閱讀 `View UI Plus` 中 `Divider` 分隔元件的樣式來源：`src/styles/components/divider.less`。

原始筆記已經掌握到一個很重要的方向：`Divider` 不能只看 `divider.vue`，還必須對照 `divider.less`。原因是 `Divider` 的 runtime 邏輯很短，真正決定畫面長相的部分，大多藏在 `ivu-divider-*` class 與 Less selector 的組合裡。

不過，若要把這份筆記整理成適合長期複習的教材，還需要補強幾個面向：

| 問題 | 說明 | 重構方向 |
| --- | --- | --- |
| 容易停留在 selector 速查 | 原始筆記列出了不少 selector，但初學者可能還不知道為什麼它們要這樣組合 | 補上「runtime class → Less selector → CSS 視覺效果」的閱讀模型 |
| class 與視覺結果的關係還可以更清楚 | `horizontal`、`vertical`、`with-text`、`dashed`、`plain` 不是互斥關係，而是會疊加 | 用 class matrix 與情境拆解說明疊加規則 |
| 帶文字分隔線的 CSS 技術需要補背景 | `display: table`、`:before`、`:after` 對初學者不一定直覺 | 補上為什麼不用根節點背景畫線，而要改用 pseudo-elements |
| `size` 與 `plain` 的作用範圍容易被誤解 | 它們不是改變所有線條，而是主要影響帶文字分隔線的文字樣式與間距 | 明確標註 selector 命中前提 |
| 可以補出閱讀路線 | 目前內容偏重結果整理 | 加入從 runtime class 回查 Less selector 的實際閱讀方法 |

本章重構後的目標，是讓你不只是記住 `Divider` 有哪些 class，而是能理解：**元件庫如何透過 class contract，把 Vue runtime 狀態交給 Less 樣式系統處理。**

---

## 1. 本章定位

本章專門閱讀 `Divider` 的 class 與 style source，核心檔案是：

```txt
src/styles/components/divider.less
```

它承接前一篇 `02-props-slot-and-structure.md` 的 runtime 結論：

```txt
props / slot
  -> computed classes
  -> DOM class list
  -> divider.less selectors
  -> final visual style
```

也就是說，本章不再重複細講 `type`、`orientation`、`dashed`、`size`、`plain` 的 props 定義，而是進一步追問：

1. `ivu-divider-horizontal` 和 `ivu-divider-vertical` 各自如何畫線？
2. 為什麼帶文字分隔線需要 `:before` 與 `:after`？
3. 為什麼 `orientation="left"` 其實是調整左右線段比例？
4. `dashed` 在普通線與帶文字線中為什麼要用不同規則？
5. `size="small"` 與 `plain` 到底改的是線條，還是文字與間距？

讀完本章後，你應該可以從任一個 `Divider` 用法反推出它會產生哪些 class，並進一步在 `divider.less` 中找到對應的視覺規則。

---

## 2. 學習前先建立的基本觀念：class 是 runtime 與 style 的契約

在元件庫中，class 不只是為了方便寫 CSS 的字串，它更像是 **runtime 與樣式系統之間的契約**。

以 `Divider` 為例，`divider.vue` 不會直接寫：

```vue
<div style="height: 1px; background: ..."></div>
```

它會產生類似這樣的 class：

```html
<div class="ivu-divider ivu-divider-horizontal ivu-divider-default"></div>
```

然後把真正的畫線邏輯交給 `divider.less`：

```less
.@{divider-prefix-cls} {
    background: @border-color-split;

    &-horizontal {
        display: block;
        height: 1px;
        width: 100%;
        min-width: 100%;
        margin: 24px 0;
        clear: both;
    }
}
```

這種設計有幾個好處。

第一，runtime 保持簡單。Vue 元件只負責描述目前狀態，例如水平、垂直、帶文字、虛線、普通文字樣式等。

第二，視覺規則集中管理。顏色、間距、字級、線條畫法都由 Less theme variables 與 selector 控制。

第三，樣式可以透過 class 疊加形成不同情境。例如同一個 `Divider` 同時可以是：

```txt
horizontal + with-text-left + dashed + plain
```

因此閱讀 `Divider` 樣式時，不能只找單一 class，而要觀察 **多個 class 同時命中時，Less selector 如何疊加出最終畫面**。

---

## 3. Less selector 的閱讀方法

`divider.less` 使用 Less 的巢狀寫法，因此你會看到很多像這樣的 selector：

```less
&-horizontal&-with-text-left
```

假設外層是：

```less
.@{divider-prefix-cls} {
    ...
}
```

而 `@divider-prefix-cls` 對應到 `ivu-divider`，那麼：

```less
&-horizontal&-with-text-left
```

實際等價於：

```css
.ivu-divider-horizontal.ivu-divider-with-text-left
```

這裡有一個重要細節：中間沒有空格。

沒有空格代表這兩個 class 必須出現在 **同一個元素** 上，selector 才會命中。也就是說，下面這種 DOM 會命中：

```html
<div class="ivu-divider ivu-divider-horizontal ivu-divider-with-text-left"></div>
```

但如果 class 分散在父子元素上，就不會命中同一條規則。

這點對閱讀 `Divider` 很重要，因為 runtime 會把多個 class 組在根節點上，而 Less 再用這種「同元素多 class selector」判斷目前屬於哪一種視覺情境。

---

## 4. Class Matrix：從 class 判斷視覺責任

以下表格是本章最重要的地圖。它把 runtime 產生的主要 class 與 Less 責任串起來。

| 情境 | Runtime 主要 class | Less 主要責任 | 閱讀重點 |
| --- | --- | --- | --- |
| 基礎分隔線 | `ivu-divider` | 套用 reset、預設背景色 | 所有 Divider 的共通基底 |
| 普通水平線 | `ivu-divider-horizontal` | `display: block`、`height: 1px`、`width: 100%`、上下 margin | 根節點本身就是線 |
| 垂直線 | `ivu-divider-vertical` | `inline-block`、`width: 1px`、`height: 0.9em`、行內對齊 | 適合文字或連結之間 |
| 帶置中文字 | `ivu-divider-with-text`、`ivu-divider-with-text-center` | 使用 `display: table` 與 `:before` / `:after` 畫左右線 | 線不再由根節點背景產生 |
| 帶左側文字 | `ivu-divider-with-text-left` | 左線 5%、右線 95% | 不是絕對靠左，而是線段比例改變 |
| 帶右側文字 | `ivu-divider-with-text-right` | 左線 95%、右線 5% | 與 left 情境相反 |
| 小尺寸 | `ivu-divider-small` | 搭配帶文字 selector 時縮小字級與 margin | 主要影響帶文字分隔線 |
| 虛線 | `ivu-divider-dashed` | 普通線改用 dashed border，帶文字線改 pseudo-elements 的 border style | 普通線與帶文字線處理方式不同 |
| 普通文字 | `ivu-divider-plain` | 帶文字時改成普通文字色、normal weight、base font size | 主要改文字，不是改線條類型 |

這張表要和 `divider.vue` 的 class binding 一起看。`Divider` 的視覺行為不是由單一 class 決定，而是由多個 class 的組合決定。

例如：

```vue
<Divider dashed plain orientation="left">Title</Divider>
```

概念上會同時涉及：

```txt
ivu-divider
ivu-divider-horizontal
ivu-divider-default
ivu-divider-with-text-left
ivu-divider-dashed
ivu-divider-plain
```

這些 class 共同命中不同 Less selector，最後才形成「左側文字 + 虛線 + 普通文字樣式」的分隔線。

---

## 5. 基礎樣式：`ivu-divider` 的共通底層

`divider.less` 一開始會定義 prefix：

```less
@divider-prefix-cls: ~"@{css-prefix}divider";
```

在 View UI Plus 預設前綴下，這會對應到：

```txt
ivu-divider
```

接著是根 class：

```less
.@{divider-prefix-cls} {
    .reset-component;
    background: @border-color-split;
}
```

這一段可以拆成兩個責任。

第一，`.reset-component` 通常用來套用元件庫的共通 reset，例如字體、box model 或其他基礎樣式。這是元件庫常見做法，目的是讓每個元件在不同頁面環境中有一致的基準。

第二，`background: @border-color-split;` 給了 `Divider` 一個預設線條顏色。對普通水平線而言，這個背景色會搭配 `height: 1px` 形成線條。不過後面會看到，帶文字分隔線與 dashed 分隔線不一定依賴這個背景畫線。

這裡的重點是：`ivu-divider` 是共同基底，但它不是所有情境的完整答案。真正的視覺結果還要看後續是否有 `horizontal`、`vertical`、`with-text`、`dashed`、`plain` 等修飾 class。

---

## 6. 垂直分隔線：行內元素之間的 1px 視覺間隔

在 `divider.less` 中，可以看到一段與垂直線相關的規則：

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

這段規則的重點是讓分隔線能自然放在行內內容之間。

| CSS 屬性 | 作用 |
| --- | --- |
| `display: inline-block` | 讓分隔線像文字一樣參與行內排版，但仍可設定寬高 |
| `width: 1px` | 垂直線寬度 |
| `height: 0.9em` | 高度跟隨字體大小比例，而不是固定像素 |
| `margin: 0 8px` | 左右保留間距，避免貼住文字 |
| `vertical-align: middle` | 讓線條與文字中線對齊 |
| `top: -0.06em` | 微調垂直位置，讓視覺對齊更自然 |

因此，垂直線通常用於這類場景：

```vue
<span>iView</span>
<Divider type="vertical" />
<span>Components</span>
<Divider type="vertical" />
<span>Divider</span>
```

它的定位不是把頁面區塊上下切開，而是在一行文字或操作項之間做視覺分隔。

---

## 7. 普通水平分隔線：根節點背景形成線條

水平分隔線由 `ivu-divider-horizontal` 控制：

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

這種情境可以理解成：

```txt
一個 block 元素
高度 1px
寬度撐滿容器
背景色就是線條顏色
上下 margin 提供段落間距
```

對應的概念 DOM 大致是：

```html
<div class="ivu-divider ivu-divider-horizontal ivu-divider-default"></div>
```

這裡沒有內層 `span`，也沒有 `:before` / `:after` 的左右線。普通水平分隔線最簡單，根節點自己就是那條線。

需要特別注意 `margin: 24px 0`。這代表 `Divider` 不只是畫出 1px 線條，也順便建立上下內容的呼吸空間。這是元件庫中「結構型視覺元件」常見的設計：元件不只提供視覺元素，也提供預設排版節奏。

---

## 8. 帶文字分隔線：從背景線改成 pseudo-elements 畫線

當 `Divider` 有 default slot 時，runtime 會渲染內層文字節點，並在根節點加上 `with-text` 相關 class。帶文字分隔線會命中這組 selector：

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

這段規則代表帶文字分隔線與普通水平線有三個核心差異。

### 8.1 `display: table`：讓左右線與文字排在同一列

普通水平線是一整條 1px block。可是帶文字分隔線需要呈現：

```txt
────── 文字 ──────
```

也就是「左線、文字、右線」三個部分在同一列。`display: table` 搭配 `:before`、inner text、`:after`，可以讓這三段像表格儲存格一樣排版。

### 8.2 `background: transparent`：根節點不再負責畫線

普通水平線靠根節點背景色畫線，但帶文字分隔線不能直接讓根節點整條都有背景，否則線條會穿過文字區域。

所以這裡把背景改成透明：

```less
background: transparent;
```

接著把畫線責任交給 pseudo-elements。

### 8.3 `:before` 與 `:after`：左右兩段線

左右線由 pseudo-elements 產生：

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

這裡的設計可以理解為：

| 部分 | 責任 |
| --- | --- |
| `:before` | 文字左側線段 |
| `.ivu-divider-inner-text` | 中間文字 |
| `:after` | 文字右側線段 |

因此，帶文字分隔線的線不是根節點背景，而是 `:before` 與 `:after` 的 `border-top`。

這也是為什麼閱讀 `Divider` 時不能只看 `divider.vue`。runtime 只會告訴你「有一個 `span` 承載文字」，但不會告訴你左右線其實是 CSS pseudo-elements 畫出來的。

---

## 9. 文字位置：`center`、`left`、`right` 其實是調整左右線段比例

`orientation` 很容易被誤解成「把文字絕對定位到左邊或右邊」。但從 Less 來看，它的核心不是絕對定位，而是調整 `:before` 和 `:after` 的寬度比例。

### 9.1 置中情境

置中情境概念上是：

```txt
before width: 50%
inner text
after width: 50%
```

也就是左右線段平均分配。

### 9.2 左側文字

左側文字會命中：

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

視覺概念是：

```txt
短左線  文字  長右線
```

所以 `orientation="left"` 不是把文字貼齊容器最左邊，而是讓文字前方還保留一小段 5% 的線。

### 9.3 右側文字

右側文字則相反：

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

視覺概念是：

```txt
長左線  文字  短右線
```

### 9.4 inner text padding

文字本身也會有 padding。

一般 inner text：

```less
&-inner-text {
    display: inline-block;
    padding: 0 24px;
}
```

left / right 情境會覆蓋成較小 padding：

```less
&-horizontal&-with-text-left,
&-horizontal&-with-text-right {
    .@{divider-prefix-cls}-inner-text {
        display: inline-block;
        padding: 0 10px;
    }
}
```

這代表 `Divider` 對不同文字位置也有細節調整：置中情境給較寬的文字左右留白，左右偏移情境則縮小 padding，避免視覺上太鬆散。

---

## 10. `size="small"`：主要影響帶文字分隔線的字級與間距

當 runtime 加上 `ivu-divider-small` 後，Less 中主要是透過這組 selector 處理：

```less
&-horizontal&-small&-with-text-center,
&-horizontal&-small&-with-text-left,
&-horizontal&-small&-with-text-right {
    font-size: @font-size-base;
    margin: 8px 0;
}
```

這裡有一個很重要的命中條件：它同時要求元素具有：

```txt
ivu-divider-horizontal
ivu-divider-small
ivu-divider-with-text-center / left / right
```

所以 `size="small"` 的主要效果不是「所有 Divider 都變小」，而是針對 **水平帶文字分隔線** 調整：

| 項目 | 預設帶文字 | small 帶文字 |
| --- | --- | --- |
| 字級 | `@font-size-large` | `@font-size-base` |
| 上下 margin | `16px 0` | `8px 0` |

對普通不帶文字的水平線來說，原始筆記提供的 selector 不顯示 `small` 有同等明顯的尺寸效果。因此閱讀時要避免把 `size` 過度理解成全域尺寸控制。

---

## 11. `dashed`：普通線與帶文字線的虛線處理不同

`dashed` 是本章最能體現「不同情境使用不同 CSS 技術」的例子。

### 11.1 普通虛線

普通虛線由 `ivu-divider-dashed` 控制：

```less
&-dashed {
    background: none;
    border-top: 1px dashed @border-color-split;
}
```

這裡做了兩件事。

第一，取消背景：

```less
background: none;
```

第二，改用 `border-top` 畫虛線：

```less
border-top: 1px dashed @border-color-split;
```

也就是說，普通水平線原本可以靠背景色畫線，但 dashed 線必須改用 border，因為背景本身沒有 dashed 的概念。

### 11.2 帶文字虛線

帶文字分隔線則需要另一組規則：

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

原因是帶文字分隔線的左右線本來就是 `:before` 和 `:after` 的 `border-top` 畫出來的。

如果只改根節點的 `border-top`，就會變成根節點畫了一條線，但左右 pseudo-elements 還是原本的實線，容易造成視覺不一致。因此帶文字的 dashed 必須改 pseudo-elements 的 border style：

```less
border-style: dashed none none;
```

這裡可以整理成一句話：

> 普通線的 dashed 改根節點 border；帶文字線的 dashed 改 `:before` / `:after` 的 border。

---

## 12. `plain`：把帶文字分隔線的文字降回正文樣式

`plain` 對應的 Less selector 是：

```less
&-plain&-with-text,
&-plain&-with-text-left,
&-plain&-with-text-right {
    color: @text-color;
    font-weight: normal;
    font-size: @font-size-base;
}
```

這表示 `plain` 主要處理帶文字分隔線的文字樣式，而不是線條本身。

預設帶文字分隔線使用比較醒目的標題風格：

```txt
color: @title-color
font-weight: 500
font-size: @font-size-large
```

加上 `plain` 後，文字變成：

```txt
color: @text-color
font-weight: normal
font-size: @font-size-base
```

因此，`plain` 可以理解為：

> 在保留帶文字分隔線結構的前提下，把中間文字從「標題感」降回「正文感」。

它不是新的分隔線類型，也不是讓線條變淡或變細。

---

## 13. 情境推演：從 Vue 用法反推 Less 命中規則

這一節用幾個常見寫法，練習從使用方式反推 class 與樣式規則。

### 13.1 普通水平線

使用方式：

```vue
<Divider />
```

概念 class：

```txt
ivu-divider
ivu-divider-horizontal
ivu-divider-default
```

樣式重點：

- 根節點背景色來自 `@border-color-split`
- `ivu-divider-horizontal` 讓它成為 `height: 1px`、`width: 100%` 的 block
- `margin: 24px 0` 提供上下間距

### 13.2 垂直分隔線

使用方式：

```vue
Text
<Divider type="vertical" />
Link
```

概念 class：

```txt
ivu-divider
ivu-divider-vertical
ivu-divider-default
```

樣式重點：

- `inline-block` 讓它能放在行內內容中
- `width: 1px`、`height: 0.9em` 形成垂直線
- `margin: 0 8px` 讓左右文字不貼線

### 13.3 帶置中文字分隔線

使用方式：

```vue
<Divider>Title</Divider>
```

概念 class：

```txt
ivu-divider
ivu-divider-horizontal
ivu-divider-default
ivu-divider-with-text
ivu-divider-with-text-center
```

樣式重點：

- 根節點背景變成 transparent
- 使用 `display: table`
- 左右線由 `:before` / `:after` 的 `border-top` 形成
- 文字由 `.ivu-divider-inner-text` 控制 padding

### 13.4 左側文字 + 虛線

使用方式：

```vue
<Divider dashed orientation="left">Title</Divider>
```

概念 class：

```txt
ivu-divider
ivu-divider-horizontal
ivu-divider-default
ivu-divider-with-text-left
ivu-divider-dashed
```

樣式重點：

- `with-text-left` 讓左線 5%、右線 95%
- `dashed` 在帶文字情境下改 `:before` / `:after` 的 border style
- 根節點 `border-top` 會被帶文字 dashed 規則歸零，避免與 pseudo-elements 衝突

### 13.5 普通文字樣式的帶文字分隔線

使用方式：

```vue
<Divider plain>Note</Divider>
```

概念 class：

```txt
ivu-divider
ivu-divider-horizontal
ivu-divider-default
ivu-divider-with-text
ivu-divider-with-text-center
ivu-divider-plain
```

樣式重點：

- 仍然是帶文字分隔線結構
- `plain` 只把中間文字改成正文色、normal weight、base font size
- 線條的基本畫法仍由 `with-text` 的 pseudo-elements 負責

---

## 14. 閱讀 `divider.less` 的建議順序

初次閱讀 `Divider` 的樣式時，建議不要直接從頭到尾掃 Less，而是依照視覺情境閱讀。

### 14.1 第一輪：建立基礎線條模型

先看：

```txt
@divider-prefix-cls
.@{divider-prefix-cls}
&-vertical
&-horizontal
```

這一輪要搞懂普通分隔線怎麼形成，包含水平線與垂直線的差異。

### 14.2 第二輪：看帶文字分隔線

再看：

```txt
&-horizontal&-with-text-center
&-horizontal&-with-text-left
&-horizontal&-with-text-right
&:before
&:after
&-inner-text
```

這一輪的重點是建立「根節點不再畫線，改由 pseudo-elements 畫左右線」的理解。

### 14.3 第三輪：看修飾狀態

最後看：

```txt
&-small
&-dashed
&-plain
```

這一輪要看修飾 class 的命中前提，特別是它們是作用於普通線、帶文字線，還是主要作用於文字。

---

## 15. 常見誤區

| 誤區 | 為什麼容易誤解 | 正確理解 |
| --- | --- | --- |
| `Divider` 的線都是 background 畫出來的 | 普通水平線確實靠背景色與高度形成線 | 普通水平線用 background，虛線用 border，帶文字線用 `:before` / `:after` |
| `size="small"` 會改所有分隔線高度 | `size` 聽起來像全域尺寸控制 | 原始 selector 顯示 small 主要搭配水平帶文字分隔線，影響字級與 margin |
| `plain` 會讓線條變淡或變細 | plain 容易被理解成線條樣式 | plain 主要改帶文字時的 `color`、`font-weight`、`font-size` |
| `orientation="left"` 是絕對靠左 | 使用者從 API 名稱直覺理解 | 實作上是調整 `:before` 與 `:after` 的寬度比例 |
| 垂直分隔線也適合帶文字 | runtime 可能仍能渲染 slot | 樣式主線與官方範例都把文字位置設計放在水平帶文字分隔線 |
| 看到 `&-horizontal&-with-text-left` 以為是父子關係 | Less 巢狀與 `&` 容易混淆 | 編譯後是同一元素同時具有兩個 class，不是父子 selector |

---

## 16. 本章總結

`Divider` 的樣式設計重點，不在於某一條 CSS 規則，而在於 **class 組合如何對應不同視覺情境**。

普通水平分隔線由根節點背景色與 `height: 1px` 形成；垂直分隔線透過 `inline-block`、`width: 1px`、`height: 0.9em` 放入行內內容；帶文字分隔線則改用 `display: table`，並透過 `:before` 與 `:after` 畫出左右線。

`dashed`、`small`、`plain` 這些修飾狀態也不是無條件改變所有樣式，而是根據 selector 命中前提作用在不同範圍。特別是 dashed：普通線改根節點 `border-top`，帶文字線則改 pseudo-elements 的 border style。

讀懂這一章後，你就能看出 `Divider` 的 runtime 為什麼可以很短：它只要負責產生正確 class，剩下的視覺細節都由 Less 的 selector 組合完成。

---

## 17. 自我檢查問題

1. `Divider` 的 `ivu-divider` 根 class 負責哪些共通樣式？
2. 普通水平分隔線主要靠哪些 CSS 屬性形成？
3. 垂直分隔線為什麼使用 `inline-block`，而不是 `block`？
4. 帶文字分隔線為什麼要把 `background` 改成 `transparent`？
5. `:before` 與 `:after` 在帶文字分隔線中各自扮演什麼角色？
6. `orientation="left"` 對 `:before` 和 `:after` 的寬度比例有什麼影響？
7. `size="small"` 的主要作用範圍是什麼？為什麼不能理解成所有分隔線都變小？
8. 普通 dashed 線與帶文字 dashed 線的處理方式有什麼不同？
9. `plain` 主要改變線條本身，還是改變文字樣式？
10. `&-horizontal&-with-text-left` 編譯後代表父子 selector，還是同元素多 class selector？

---

## 18. 後續延伸方向

這篇筆記主要完成 `Divider` 的 class 與 Less 視覺規則對照。後續可以拆成以下延伸主題：

1. **`Divider` 的完整 props 與 type declaration 對照**  
   進一步比較 `divider.vue` runtime validator 與 `types/divider.d.ts` 的 public contract。

2. **`Divider` 的官方範例閱讀**  
   從 `examples/routers/divider.vue` 反推官方希望使用者如何組合 `type`、`orientation`、`dashed`、`plain` 與 `size`。

3. **View UI Plus 的 CSS prefix 與 Less 變數系統**  
   追蹤 `@{css-prefix}`、`@border-color-split`、`@title-color`、`@text-color`、`@font-size-large`、`@font-size-base` 的來源與主題化機制。

4. **低互動結構型元件的設計模式**  
   將 `Divider` 與 `Icon`、`Card`、`Layout` 等元件比較，整理「props 產生 class、style source 負責視覺」的元件庫設計思路。

5. **從 Less selector 反推 Vue runtime 設計**  
   練習看到 `&-horizontal&-with-text-left` 這類 selector 時，回頭推斷 runtime 需要產生哪些 class 才能讓樣式命中。
