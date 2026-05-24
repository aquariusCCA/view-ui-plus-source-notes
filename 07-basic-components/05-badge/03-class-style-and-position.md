# Badge Class、Style 與 Position：從 runtime class 到 less 視覺系統

## 1. 本章定位

本章是一篇 `Badge` 的 **runtime class 與 style source 對照筆記**。它的目標不是重新解釋所有 props 的 public API，也不是完整展開每個 Less selector，而是聚焦在一條主線：

> `badge.vue` 如何根據 props 與 slots 產生 class / style，然後由 `badge.less` 把這些 class / style 轉成實際畫面。

在 `Badge` 中，畫面不是單純由 template 決定。template 只決定 DOM 形狀與 class 名稱，真正的定位、尺寸、顏色、圓角、陰影、動畫，大多都藏在 `badge.less`。因此閱讀時不能只看 `badge.vue`，也不能只看 `badge.less`，而是要把兩者放在一起對照。

本章會重點分析四種視覺路徑：

| 視覺模式 | Runtime 主要 class | Less 定位模型 | 核心特徵 |
| --- | --- | --- | --- |
| 一般 count | `ivu-badge-count` | absolute | 右上角數字角標。 |
| 自訂 count | `ivu-badge-count ivu-badge-count-custom` | absolute | 保留定位，但取消預設背景、陰影與框線。 |
| dot | `ivu-badge-dot` | absolute | 右上角小紅點，不顯示文字。 |
| status / color | `ivu-badge-status-dot`、`ivu-badge-status-*` | inline-block | 行內狀態點，不是右上角角標。 |

本章會避免重複展開 `Badge` 的 public contract 與顯示優先序。那部分應放在 `02-public-contract-and-display-rules.md`。本章要回答的是：當某個 branch 被選中後，class 與 style 如何讓它變成你看到的畫面。

---

## 2. Source Baseline 與閱讀對象

本章主要對照兩個來源：

| 類型 | 路徑 | 閱讀重點 |
| --- | --- | --- |
| Runtime source | `src/components/badge/badge.vue` | template branch、computed class、computed style、slot 狀態。 |
| Style source | `src/styles/components/badge.less` | `ivu-badge` wrapper、count、custom count、dot、status、color、processing animation。 |

閱讀這類元件時，可以用一個固定問題來引導：

> 這個畫面效果是由 Vue runtime 決定，還是由 Less 決定？

在 `Badge` 裡，兩邊的責任可以先粗略分成：

| 層次 | 負責內容 |
| --- | --- |
| `badge.vue` | 決定走哪個 branch、產生哪些 class、是否套用 inline style、是否顯示角標。 |
| `badge.less` | 決定 class 對應的定位、尺寸、顏色、陰影、動畫與 layout model。 |

這個分工很重要。因為你在 runtime 中看到 `countClasses`，只知道會產生 `ivu-badge-count`；但你必須回到 less，才知道這個 class 會變成 absolute positioning、右上角偏移、紅底白字、圓角與白色外框陰影。

---

## 3. 先建立三種 DOM 形狀

閱讀 `Badge` 樣式前，應先把 template 產生的 DOM 形狀看懂。`Badge` 不是永遠產生同一種結構，而是依照模式產生不同分支。

### 3.1 Dot branch

dot branch 的概念結構如下：

```vue
<span class="ivu-badge">
    <slot></slot>
    <sup class="ivu-badge-dot"></sup>
</span>
```

這個模式會保留 default slot，然後在 wrapper 裡面加上一個 `sup` 小紅點。這個 `sup` 不是普通 inline 內容，而是透過 less 變成 absolute 定位的小點。

dot branch 的畫面重點是：

1. default slot 仍然存在。
2. 小紅點掛在 wrapper 右上方。
3. 不顯示 `count` 文字。
4. 是否顯示 dot 還會受到 `badge` computed 與 `count=0` 影響。

### 3.2 Status branch

status branch 的概念結構如下：

```vue
<span class="ivu-badge ivu-badge-status">
    <span class="ivu-badge-status-dot ivu-badge-status-success"></span>
    <span class="ivu-badge-status-text">Success</span>
</span>
```

這個模式最容易被誤解。它不是「把狀態點掛在某個元素右上角」，而是輸出一個 inline 狀態顯示區塊。status branch 不渲染 default slot，因此它比較像是「狀態標示文字」，不是「附著型角標」。

status branch 的畫面重點是：

1. root 有 `ivu-badge`，也有靜態 class `ivu-badge-status`。
2. 狀態點是 `span`，不是 `sup`。
3. 狀態點是 inline-block，不走右上角 absolute 定位。
4. `processing` 動畫完全由 less 的 pseudo-element 實作。
5. `text` 或 `#text` 會顯示在狀態點右側。

### 3.3 Count branch

一般 count branch 的概念結構如下：

```vue
<span class="ivu-badge">
    <slot></slot>
    <sup class="ivu-badge-count">5</sup>
</span>
```

這是最典型的 badge 用法：包住一個按鈕、連結或方塊，再把數字角標定位到右上角。

count branch 的畫面重點是：

1. default slot 作為被附著的內容。
2. `sup` 是真正的數字角標本體。
3. `ivu-badge-count` 決定定位、尺寸、背景色、文字色與陰影。
4. `type`、`className`、`offset`、`alone` 都主要影響這條路徑。
5. 若使用 `#count`，會改走 custom count 樣式。

---

## 4. Root Wrapper：`ivu-badge` 為什麼重要？

`badge.less` 的根節點樣式是：

```less
.ivu-badge {
    position: relative;
    display: inline-block;
}
```

這兩行看起來很普通，但它們是一般 count 與 dot 可以正常定位的基礎。

### 4.1 `position: relative`

`position: relative` 的目的，是讓內部的 absolute 元素可以以 root wrapper 作為定位參考。一般 count 使用 `position: absolute`，dot 也使用 `position: absolute`。如果 root wrapper 沒有建立定位上下文，這些角標可能會往更外層的 positioned ancestor 尋找定位基準，導致位置失控。

因此，`ivu-badge` 本身不是角標，而是角標的定位容器。

### 4.2 `display: inline-block`

`display: inline-block` 的目的，是讓 wrapper 尺寸貼近被包裹內容。這讓 `Badge` 可以包住按鈕、連結、icon、方塊等 inline 或 inline-block 場景，同時又能保留可計算的寬高範圍，讓右上角角標有明確的附著對象。

可以把它理解成：

```txt
default slot 提供內容尺寸
ivu-badge wrapper 負責包住內容
內部 sup 根據 wrapper 做右上角定位
```

### 4.3 Status branch 也有 `ivu-badge`，但意義不同

status branch 也會使用 `ivu-badge`，但它不依賴 `position: relative` 來定位狀態點。status dot 是 inline-block，會跟 status text 一起參與普通文流。

這也是為什麼閱讀 class 時不能只看 root。即使 root 都叫 `ivu-badge`，內部節點不同，layout model 也會完全不同。

---

## 5. 一般 Count：從 `countClasses` 到 `ivu-badge-count`

一般 count branch 使用 `countClasses` 產生 class：

```js
countClasses () {
    return [
        `${prefixCls}-count`,
        {
            [`${this.className}`]: !!this.className,
            [`${prefixCls}-count-alone`]: this.alone,
            [`${prefixCls}-count-${this.type}`]: !!this.type
        }
    ];
}
```

這段 computed 的重點不是計算數字，而是組裝角標本體的 class。它把不同條件轉成不同 class，再交給 less 決定視覺效果。

| 條件 | 產生 class | 責任 |
| --- | --- | --- |
| 永遠存在 | `ivu-badge-count` | 一般數字角標的基礎樣式。 |
| `className` 有值 | 使用者自訂 class | 讓使用者補充或覆蓋 count `sup` 樣式。 |
| 沒有 default slot | `ivu-badge-count-alone` | 讓 count 從附著型角標改成獨立顯示。 |
| `type` 有值 | `ivu-badge-count-{type}` | 套用一般 count badge 的語意色。 |

### 5.1 `ivu-badge-count` 的定位模型

`ivu-badge-count` 的主要 less 樣式如下：

```less
position: absolute;
transform: translateX(50%);
top: -10px;
right: 0;
height: 20px;
border-radius: 10px;
min-width: 20px;
background: @error-color;
color: #fff;
line-height: 18px;
padding: 0 6px;
font-size: 12px;
white-space: nowrap;
z-index: 10;
box-shadow: 0 0 0 1px #fff;
```

這段樣式同時處理了三類事情。

第一類是定位：

```less
position: absolute;
top: -10px;
right: 0;
transform: translateX(50%);
```

這讓 count 從 wrapper 的右上方開始定位，並透過 `translateX(50%)` 往右推出半個自身寬度。這是常見的 badge 右上角視覺效果：角標中心大約落在被包裹元素右上角邊界附近，而不是完全塞在元素內部。

第二類是外觀：

```less
height: 20px;
border-radius: 10px;
min-width: 20px;
background: @error-color;
color: #fff;
line-height: 18px;
padding: 0 6px;
font-size: 12px;
box-shadow: 0 0 0 1px #fff;
```

這些規則讓 count badge 形成紅底白字的膠囊形狀。`min-width: 20px` 搭配 `border-radius: 10px`，可以讓一位數時看起來像圓形，多位數時自然變成膠囊。

第三類是文字保護：

```less
white-space: nowrap;
```

這避免 `99+` 或文字型 count 被換行，確保角標維持單行。

### 5.2 Runtime 與 Less 的分工

從這裡可以看到一個重要原則：

```txt
badge.vue 只說：「這是一個 count badge」
badge.less 才說：「count badge 長什麼樣、放在哪裡」
```

所以原始碼閱讀時，不要只停在 `countClasses`。`countClasses` 的價值是告訴你會有哪些 class，但真正的視覺語意要回到 `badge.less`。

---

## 6. `alone`：沒有 default slot 時，count 如何獨立顯示？

`alone` computed 的判斷很直接：

```js
alone () {
    return this.$slots.default === undefined;
}
```

當 `Badge` 沒有 default slot 時，`countClasses` 會額外產生：

```txt
ivu-badge-count-alone
```

less 中的對應規則是：

```less
&-alone {
    top: auto;
    display: block;
    position: relative;
    transform: translateX(0);
}
```

這個 class 的意義是：把原本附著在右上角的 absolute badge，改成可以獨立存在的 badge。

### 6.1 有 default slot：附著型角標

例如：

```vue
<Badge :count="5">
    <Button>消息</Button>
</Badge>
```

概念上會形成：

```txt
ivu-badge wrapper
  ├─ Button
  └─ sup.ivu-badge-count
```

這時 `sup` 透過 absolute 定位附著在 Button 右上角。

### 6.2 沒有 default slot：獨立角標

例如：

```vue
<Badge :count="5" />
```

這時沒有被附著的內容。如果仍然使用 absolute 定位，角標會缺乏自然的版面位置。因此 less 用 `ivu-badge-count-alone` 把它改成：

```less
position: relative;
display: block;
top: auto;
transform: translateX(0);
```

也就是讓 count badge 自己成為普通可見區塊。

### 6.3 閱讀重點

`alone` 並不是一個 public prop，而是 runtime 根據 slot 狀態推導出的內部顯示狀態。這是一個很典型的展示型元件設計：元件會根據「有沒有被包裹內容」自動調整布局模式，讓同一個 API 支援不同使用情境。

---

## 7. Custom Count：`#count` 不是只改文字，而是改整個角標內容

如果使用 `#count` slot，runtime 不會使用 `countClasses`，而是改用 `customCountClasses`：

```js
customCountClasses () {
    return [
        `${prefixCls}-count`,
        `${prefixCls}-count-custom`,
        {
            [`${this.className}`]: !!this.className,
        }
    ];
}
```

它保留了 `ivu-badge-count`，所以仍然具有一般 count 的定位能力；但它額外加上 `ivu-badge-count-custom`，讓 less 取消預設外觀。

對應 less：

```less
&-custom {
    background: transparent;
    color: inherit;
    border-color: transparent;
    box-shadow: none;
}
```

這代表 `#count` 適合放 icon、圖片、小型自訂節點，或任何你希望自己決定外觀的內容。

### 7.1 `#count` 和 `#text` 的本質差異

這裡要特別區分 `#count` 與 `#text`。

| Slot | 改變範圍 | 是否保留預設角標外觀 | 適合用途 |
| --- | --- | --- | --- |
| `#count` | 替換整個角標內容 | 不完全保留，會取消背景與陰影 | 放 icon、自訂圖形、自訂節點。 |
| `#text` | 替換角標內文字 | 保留 `ivu-badge-count` 外觀 | 改成 `new`、`hot` 或其他文字。 |

所以 `#count` 不是「把 count 數字改成別的文字」，而是「接管角標內容本身」。這也是為什麼它會搭配 `ivu-badge-count-custom`。

### 7.2 Custom count 的邊界

有一個重要觀察：`customCountClasses` 不會加上 `ivu-badge-count-alone`。

也就是說，如果沒有 default slot，但使用 `#count`，它仍然保留一般 `ivu-badge-count` 的 absolute positioning。這種組合不是官方範例主線，閱讀時應標註為「需要實際畫面確認」或「非主要使用情境」。不要直接推論它一定會形成理想的獨立顯示效果。

---

## 8. `type`：只屬於一般 count badge 的語意色

`type` 只出現在 `countClasses`：

```txt
ivu-badge-count-{type}
```

runtime validator 允許的值包含：

```txt
success / primary / normal / error / warning / info
```

less 對應的語意色規則如下：

```less
&-primary { background: @primary-color; }
&-success { background: @success-color; }
&-error { background: @error-color; }
&-warning { background: @warning-color; }
&-info { background: @info-color; }
&-normal {
    background: @normal-color;
    color: @subsidiary-color;
}
```

這裡最重要的不是背顏色，而是理解作用範圍：

> `type` 只影響一般 count badge，不影響 dot，也不影響 status dot。

因此：

```vue
<Badge :count="5" type="primary" />
```

會產生一般 count badge 的 primary 色。

但：

```vue
<Badge dot type="primary" />
```

不會讓 dot 變成 primary 色，因為 dot branch 使用的是 `dotClasses`，不會讀取 `type`。

同樣地：

```vue
<Badge status="success" type="primary" />
```

status branch 也不會使用 `type`。status 模式有自己的 `statusClasses` 與 `color` 路徑。

---

## 9. `offset`：inline style 如何微調角標位置？

`offset` 由 `styles` computed 處理：

```js
styles () {
    const style = {};
    if (this.offset && this.offset.length === 2) {
        style['margin-top'] = `${this.offset[0]}px`;
        style['margin-right'] = `${this.offset[1]}px`;
    }
    return style;
}
```

這個 computed 會回傳 inline style，並被綁定到角標本體上：

```vue
<sup :style="styles" ...></sup>
```

### 9.1 `offset` 實際改的是 margin

`offset` 的兩個值分別轉成：

| `offset` 位置 | CSS property | 說明 |
| --- | --- | --- |
| `offset[0]` | `margin-top` | 垂直方向微調。 |
| `offset[1]` | `margin-right` | 水平方向微調。 |

例如：

```vue
<Badge :count="10" :offset="[-5, -5]">
    <a href="//iviewui.com">我是一个链接</a>
</Badge>
```

概念上會形成：

```html
<sup class="ivu-badge-count" style="margin-top: -5px; margin-right: -5px;">10</sup>
```

### 9.2 `offset` 不改哪些東西？

這是理解 `offset` 最重要的地方。

`offset` 不會改：

1. root wrapper 的位置。
2. default slot 的位置。
3. `top` / `right` 的值。
4. `transform` 的值。
5. status text 的位置。

它只把 margin 加到角標本體。

### 9.3 `offset` 作用於哪些模式？

`styles` 會被綁到：

| 模式 | 是否套用 `styles` |
| --- | --- |
| 一般 count | 會。 |
| custom count | 會。 |
| dot | 會。 |
| status | 不套用在 status text；status dot 使用的是 `statusStyles`。 |

所以 `offset` 主要是給「右上角附著型角標」使用。status branch 的 layout 是 inline 狀態點，不是右上角角標，因此不走同一條 offset 路徑。

---

## 10. Dot：`ivu-badge-dot` 是小紅點，不是縮小版 count

dot branch 使用的 computed 很簡單：

```js
dotClasses () {
    return `${prefixCls}-dot`;
}
```

對應 class：

```txt
ivu-badge-dot
```

less 主要樣式：

```less
position: absolute;
transform: translateX(-50%);
transform-origin: 0 center;
top: -4px;
right: -8px;
height: 8px;
width: 8px;
border-radius: 100%;
background: @error-color;
z-index: 10;
box-shadow: 0 0 0 1px #fff;
```

dot 和 count 都是 absolute，都掛在 wrapper 上，但它們不是同一套樣式縮放出來的結果。dot 有自己的尺寸、定位與 transform。

### 10.1 Dot 的定位特徵

dot 的定位規則是：

```less
top: -4px;
right: -8px;
transform: translateX(-50%);
```

和 count 的：

```less
top: -10px;
right: 0;
transform: translateX(50%);
```

不同。這表示 dot 的位置不是 count badge 縮小後自然得到的，而是獨立設計的一套位置。

### 10.2 Dot 的顯示控制

dot 的可見性由 `badge` computed 控制。

| 輸入 | dot 是否顯示 | 原因 |
| --- | --- | --- |
| `dot` | 顯示 | dot branch 會讓 `badge` 為 true。 |
| `dot :count="0"` | 隱藏 | dot 分支中若 `count` 為 0，會把狀態改成 false。 |
| `dot showZero :count="0"` | 顯示 | 最後回傳 `status || showZero`，因此 `showZero` 會讓它顯示。 |

這裡可以看出一件事：`dot` 雖然不顯示數字，但它仍然會讀取 `count` 來判斷是否隱藏。這是 View UI Plus 在 API 行為上的一個設計：需要隱藏 dot 時，可以把 `count` 設為 0。

### 10.3 Dot 不讀 `type` 與 `color`

dot branch 的 class 是固定的 `ivu-badge-dot`。因此：

1. `type` 不會改 dot 顏色。
2. `color` 也不會改 dot 顏色，因為只要 `dot` 為 true，就會優先進入 dot branch，不會進入 `status || color` branch。
3. dot 的預設顏色來自 less 中的 `@error-color`。

---

## 11. Status 與 Color：inline 狀態點的樣式系統

status branch 使用的是另一套 class 系統。它不是 `sup`，而是兩個 `span`：

```vue
<span class="ivu-badge ivu-badge-status">
    <span :class="statusClasses" :style="statusStyles"></span>
    <span class="ivu-badge-status-text"><slot name="text">{{ text }}</slot></span>
</span>
```

其中狀態點的 class 由 `statusClasses` 產生：

```js
statusClasses () {
    return [
        `${prefixCls}-status-dot`,
        {
            [`${prefixCls}-status-${this.status}`]: !!this.status,
            [`${prefixCls}-status-${this.color}`]: !!this.color && oneOf(this.color, initColorList)
        }
    ];
}
```

基礎 class 是：

```txt
ivu-badge-status-dot
```

less 的基礎樣式是：

```less
width: 6px;
height: 6px;
display: inline-block;
border-radius: 50%;
vertical-align: middle;
position: relative;
top: -1px;
```

### 11.1 Status dot 是 inline-block

這裡要注意：`ivu-badge-status-dot` 沒有使用 absolute positioning。它是 inline-block，會跟 status text 一起排在同一行。

這代表 status branch 的 layout model 是：

```txt
inline status dot + inline status text
```

不是：

```txt
default slot + right-top badge
```

所以 status branch 不適合拿來包一個按鈕並在右上角顯示狀態點。它的用途更像是：

```vue
<Badge status="success" text="成功" />
```

或：

```vue
<Badge color="blue" text="進行中" />
```

### 11.2 `status` 對應狀態色

常見 `status` 對應如下：

| `status` | class | 視覺語意 |
| --- | --- | --- |
| `success` | `ivu-badge-status-success` | 成功。 |
| `processing` | `ivu-badge-status-processing` | 處理中，附帶動畫。 |
| `default` | `ivu-badge-status-default` | 預設或一般狀態。 |
| `error` | `ivu-badge-status-error` | 錯誤。 |
| `warning` | `ivu-badge-status-warning` | 警告。 |

這些狀態色不是透過 `type` 決定，而是透過 `statusClasses` 產生對應 class，再由 less 定義背景色。

### 11.3 `processing` 動畫為什麼一定要看 less？

`processing` 的動畫不是 runtime computed 出來的，也不是 Vue transition，而是 less 裡的 pseudo-element：

```less
&-processing {
    background-color: @processing-color;
    position: relative;

    &:after {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        border-radius: 50%;
        border: 1px solid @processing-color;
        content: '';
        animation: aniStatusProcessing 1.2s infinite ease-in-out;
    }
}
```

這段代表：

1. 狀態點本身有 `background-color`。
2. `:after` 產生一個覆蓋在點上的圓形邊框。
3. 動畫名稱是 `aniStatusProcessing`。
4. 動畫用來製造處理中狀態的擴散效果。

因此，如果只看 `badge.vue`，你只會看到 `ivu-badge-status-processing` 這個 class；但你看不到任何動畫細節。這就是 runtime / style 對照閱讀的重要性。

### 11.4 `color`：內建色走 class，自訂色走 inline style

runtime 中有一份內建 color 清單：

```js
const initColorList = [
    'blue',
    'green',
    'red',
    'yellow',
    'pink',
    'magenta',
    'volcano',
    'orange',
    'gold',
    'lime',
    'cyan',
    'geekblue',
    'purple'
];
```

如果 `color` 在這份清單中，`statusClasses` 會產生：

```txt
ivu-badge-status-{color}
```

less 透過 `.make-color-classes()` 產生對應色階 class：

```less
@colors: pink, magenta, red, volcano, orange, yellow, gold, cyan, lime, green, blue, geekblue, purple;
```

如果 `color` 不在內建清單中，則由 `statusStyles` 回傳 inline style：

```js
{ backgroundColor: this.color }
```

概念上會變成：

```html
<span class="ivu-badge-status-dot" style="background-color: #2db7f5;"></span>
```

這條設計可以整理成：

| `color` 類型 | Runtime 結果 | Style 來源 |
| --- | --- | --- |
| 內建色，例如 `blue` | `ivu-badge-status-blue` | less class。 |
| 自訂色，例如 `#2db7f5` | `style="background-color: #2db7f5"` | inline style。 |

這和許多 UI 元件庫的色彩設計一致：常用語意色或預設色走 class，方便主題化；任意色值走 inline style，提供彈性。

### 11.5 Status text

status 文字使用固定 class：

```txt
ivu-badge-status-text
```

less 設定：

```less
display: inline-block;
color: @text-color;
font-size: @font-size-base;
margin-left: 6px;
```

這代表 status text 是跟在 status dot 後方的普通 inline-block 文本。它不會被定位到右上角，也不受一般 count 的 `offset` 影響。

文字來源是：

```vue
<slot name="text">{{ text }}</slot>
```

因此 `#text` 的優先序高於 `text` prop。這一點和一般 count branch 相同：`#text` 可以接管文字內容，但不接管整個 status dot 結構。

---

## 12. Class / Style 責任對照總表

以下表格可以作為日後回查使用。

| Runtime 來源 | 產生結果 | Less / style 責任 | 適用模式 |
| --- | --- | --- | --- |
| `classes` | `ivu-badge` | 建立 wrapper、relative 定位上下文、inline-block 尺寸 | 所有模式 |
| `countClasses` | `ivu-badge-count` | 一般數字角標的定位、尺寸、背景、文字、陰影 | 一般 count |
| `countClasses` + `alone` | `ivu-badge-count-alone` | 取消右上角 absolute 模型，改成獨立顯示 | 無 default slot 的一般 count |
| `customCountClasses` | `ivu-badge-count ivu-badge-count-custom` | 保留定位，取消背景、陰影、邊框 | `#count` |
| `dotClasses` | `ivu-badge-dot` | 右上角小紅點的尺寸、定位與顏色 | dot |
| `statusClasses` | `ivu-badge-status-dot` | inline 狀態點基礎樣式 | status / color |
| `statusClasses` + `status` | `ivu-badge-status-{status}` | success、processing、default、error、warning 狀態色與動畫 | status |
| `statusClasses` + 內建 `color` | `ivu-badge-status-{color}` | 內建色階 class | color |
| `statusStyles` | `backgroundColor` inline style | 自訂色值 | 非內建 color |
| `styles` | `margin-top` / `margin-right` | 微調角標本體位置 | count、custom count、dot |

這張表可以看出：`Badge` 的視覺不是單一路徑，而是多條 class / style 管線共同形成。

---

## 13. 建議閱讀順序

第一次閱讀 `Badge` 的 class、style 與 position 時，建議不要直接從整份 `badge.less` 從頭看到尾，因為 Less selector 很容易讓人迷失。更好的方式是先從 runtime 問題出發。

建議順序如下：

1. 先看 `badge.vue` 的三個 template branch，確認目前分析的是 dot、status 還是 count。
2. 在對應 branch 中找到實際綁定的 class computed，例如 `dotClasses`、`countClasses`、`customCountClasses`、`statusClasses`。
3. 回到 computed，看它在什麼條件下額外產生 class，例如 `alone`、`type`、`className`、內建 `color`。
4. 再打開 `badge.less`，搜尋該 class 的 selector，理解定位、顏色與尺寸。
5. 最後看 inline style computed，例如 `styles` 與 `statusStyles`，確認哪些效果不是由 class 決定，而是由 runtime 寫入 style。

這種閱讀方式的好處是可以避免「從 CSS 反推元件行為」時過度猜測。先看 runtime 決定有哪些 class，再看 less 解釋 class 的視覺效果，會更穩定。

---

## 14. 常見誤區

| 誤區 | 正確理解 |
| --- | --- |
| `ivu-badge` 本身就是角標 | `ivu-badge` 是 wrapper，真正的角標是內部的 `sup` 或 status dot `span`。 |
| count、dot、status 只是不同顏色 | 它們是不同 layout model：count / dot 是 absolute，status 是 inline-block。 |
| `offset` 會改變 `top` / `right` | `offset` 實際寫入 `margin-top` 與 `margin-right`。 |
| `className` 會加到 root wrapper | `className` 加到 count `sup` 或 custom count `sup`，不是 root。 |
| `type` 可以改 dot 或 status dot 顏色 | `type` 只作用於一般 count badge。 |
| `color` 可以改 count badge 顏色 | `color` 會啟用 status branch，作用在 status dot。 |
| `#count` 只是改角標文字 | `#count` 會接管整個角標內容，並使用 custom count 樣式。 |
| status branch 會包住 default slot | status branch 不渲染 default slot，只輸出 status dot 與 status text。 |
| `processing` 動畫可以從 Vue runtime 看出來 | `processing` 動畫定義在 less 的 pseudo-element 與 keyframes 中。 |

---

## 15. 本章總結

`Badge` 的 class、style 與 position 系統可以用一句話理解：

> runtime 決定「使用哪一種視覺模式與哪些 class」，less 決定「這些 class 實際長什麼樣」。

在一般 count 模式中，`ivu-badge-count` 是核心 class，負責右上角數字角標的 absolute 定位與預設外觀。當沒有 default slot 時，`ivu-badge-count-alone` 會把角標改成獨立顯示。當使用 `#count` 時，`ivu-badge-count-custom` 會保留定位能力，但取消背景、陰影與邊框，讓使用者能自訂角標內容。

在 dot 模式中，`ivu-badge-dot` 是一套獨立的小紅點樣式。它不是縮小版的 count badge，而是有自己的尺寸、定位與 transform。dot 雖然不顯示數字，但仍可透過 `count=0` 影響顯示狀態。

在 status / color 模式中，`Badge` 不再是右上角附著型角標，而是 inline 狀態點與文字。`status` 透過 `ivu-badge-status-{status}` 取得語意色，`processing` 動畫由 less pseudo-element 定義；`color` 則分成內建色 class 與自訂色 inline style 兩條路徑。

最值得記住的是三個 class 邊界：

```txt
ivu-badge-count       -> 數字角標，absolute right-top
ivu-badge-dot         -> 小紅點，absolute right-top
ivu-badge-status-dot  -> 狀態點，inline-block
```

只要先分清楚這三者，就能避免把 `Badge` 的樣式行為混在一起。

---

## 16. 自我檢查問題

1. `ivu-badge` root wrapper 為什麼需要 `position: relative`？
2. `display: inline-block` 對 `Badge` wrapper 有什麼作用？
3. `ivu-badge-count` 為什麼可以定位到 default slot 的右上角？
4. `ivu-badge-count-alone` 改變了哪些定位屬性？
5. `alone` 是 public prop 嗎？它由什麼條件推導？
6. `#count` 為什麼會取消背景與陰影？
7. `#count` 和 `#text` 在樣式層面的差異是什麼？
8. `type` 只作用在哪一種 badge 模式？
9. `offset` 實際寫入哪兩個 CSS property？
10. dot branch 的 `top`、`right`、`transform` 和 count branch 有什麼不同？
11. `dot :count="0"` 為什麼會隱藏小紅點？
12. status branch 為什麼不是右上角角標？
13. `processing` 狀態的動畫在哪裡定義？
14. 內建 `color` 和自訂 `color` 的樣式路徑有什麼差異？
15. `className` 會加到 root wrapper 嗎？如果不是，它加到哪裡？

---

## 17. 後續延伸方向

這份筆記後續可以拆成幾個更深入的主題。

### 17.1 `Badge` 的 Less selector 詳解

本章只整理了主要 class 與視覺路徑，後續可以獨立整理 `badge.less` 的完整 selector，包括巢狀寫法、變數來源、狀態色生成、動畫 keyframes 與 theme token 的關係。

### 17.2 View UI Plus 展示型元件的 class 命名規則

`Badge` 使用 `ivu-badge-count`、`ivu-badge-dot`、`ivu-badge-status-dot` 這類 BEM-like 的命名方式。後續可以和 `Tag`、`Avatar`、`Button` 等元件比較，看 View UI Plus 如何在不同元件中維持 class 命名一致性。

### 17.3 Runtime class computed 的設計模式

`countClasses`、`customCountClasses`、`statusClasses` 都是典型的 Vue class binding computed。後續可以整理 View UI Plus 中常見的 class computed 寫法，例如：

```js
return [
    baseClass,
    {
        [conditionalClass]: condition
    }
];
```

這對閱讀元件庫原始碼很有幫助。

### 17.4 `offset` 類 API 的設計取捨

`Badge` 的 `offset` 使用 `margin-top` 與 `margin-right`，而不是直接改 `top/right`。後續可以深入比較這種設計的優缺點，例如與 absolute 定位、transform、RTL、不同尺寸內容之間的關係。

### 17.5 Status 類元件的 inline layout 設計

`Badge` 的 status branch 比較接近狀態標籤，而不是角標。後續可以延伸比較 `Badge status`、`Tag`、`Alert`、`Timeline` 等元件如何表達狀態、語意色與文字說明。
