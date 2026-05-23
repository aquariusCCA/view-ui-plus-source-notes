# Badge Class Style And Position：從 runtime class 到 less 視覺

## 0. 原始筆記問題分析

原本筆記已經指出 `Badge` 需要對照 style source，但還沒有把 runtime class、inline style 與 `badge.less` 的定位規則連起來。

`Badge` 的視覺容易誤讀，原因是它不是單一樣式路徑：

```txt
一般 count -> ivu-badge-count -> absolute top/right
自訂 #count -> ivu-badge-count-custom -> 取消背景與陰影
dot -> ivu-badge-dot -> 小紅點 absolute top/right
status/color -> ivu-badge-status-* -> inline 狀態點
```

本章會把 class、style、position 拆開看。

## 1. 本章定位

本章是一篇 runtime class 與 style source 對照筆記，專門分析 `src/components/badge/badge.vue` 如何把 props 和 slot 狀態轉成 class / style，再由 `src/styles/components/badge.less` 產生畫面。

本章不重複展開所有 props 顯示優先序。public contract 和 template branch 會放在 `02-public-contract-and-display-rules.md`。

## 2. Template 的基本形狀

`Badge` 有三種主要 DOM 形狀。

dot branch：

```vue
<span class="ivu-badge">
    <slot></slot>
    <sup class="ivu-badge-dot"></sup>
</span>
```

status branch：

```vue
<span class="ivu-badge ivu-badge-status">
    <span class="ivu-badge-status-dot ivu-badge-status-success"></span>
    <span class="ivu-badge-status-text">Success</span>
</span>
```

count branch：

```vue
<span class="ivu-badge">
    <slot></slot>
    <sup class="ivu-badge-count">5</sup>
</span>
```

根節點固定使用 `ivu-badge`，但 status branch 會額外加上靜態 class `ivu-badge-status`。

## 3. Root Wrapper 樣式

`badge.less` 的根節點是：

```less
.ivu-badge {
    position: relative;
    display: inline-block;
}
```

這兩行是一般 count 和 dot 能附著在 default slot 右上角的基礎。

| CSS | 責任 |
| --- | --- |
| `position: relative` | 讓內部 absolute 的 count / dot 以 wrapper 為定位基準。 |
| `display: inline-block` | 讓 wrapper 尺寸貼合被包裹內容，適合包按鈕、連結、方塊。 |

status branch 雖然也有 root `ivu-badge`，但它的狀態點不是 absolute，而是 inline-block。這是因為 status branch 加上了 `ivu-badge-status` 並改走 status 子 selector。

## 4. 一般 Count Class

一般 count branch 使用 `countClasses`：

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

class 映射如下。

| 條件 | 產生 class | 作用 |
| --- | --- | --- |
| 永遠存在 | `ivu-badge-count` | 一般數字角標基礎樣式。 |
| `className` 有值 | 使用者自訂 class | 允許外部補充 count `sup` 的樣式。 |
| 沒有 default slot | `ivu-badge-count-alone` | 讓 count 改成相對定位，獨立顯示。 |
| `type="primary"` 等 | `ivu-badge-count-{type}` | 套用一般 count badge 的語意色。 |

`ivu-badge-count` 的主要樣式是：

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

這代表一般 count 的定位是右上角偏移，不是參與普通文流的 inline 元素。

## 5. `alone` 與獨立角標

`alone` computed 判斷：

```js
alone () {
    return this.$slots.default === undefined;
}
```

沒有 default slot 時，count class 會加上：

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

這表示 `<Badge :count="5" />` 不會把角標掛在某個被包裹元素的右上角，而是讓 count 自己成為可見的獨立區塊。

這個設計讓 `Badge` 同時支援兩種使用方式：

| 用法 | 定位模型 |
| --- | --- |
| `<Badge :count="5"><Button /></Badge>` | `sup` absolute 貼在 wrapper 右上角。 |
| `<Badge :count="5" />` | `sup` 使用 `ivu-badge-count-alone`，相對定位獨立顯示。 |

## 6. Custom Count Class

如果使用 `#count`，runtime 改用 `customCountClasses`：

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

它保留 `ivu-badge-count` 的定位能力，但額外加上：

```txt
ivu-badge-count-custom
```

less 對 custom count 的處理是：

```less
&-custom {
    background: transparent;
    color: inherit;
    border-color: transparent;
    box-shadow: none;
}
```

所以 `#count` 適合放 icon 或其他自訂內容。它不是只替換文字，而是連角標背景、邊框與陰影都取消。

需要注意：`customCountClasses` 不會加上 `ivu-badge-count-alone`，因此如果沒有 default slot 但使用 `#count`，它仍保留一般 `ivu-badge-count` 的 absolute positioning。

## 7. Type 色彩路徑

`type` 只出現在 `countClasses`：

```txt
ivu-badge-count-{type}
```

runtime validator 允許：

```txt
success / primary / normal / error / warning / info
```

less 對應：

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

這條路徑只屬於一般 count badge。status dot 不讀 `type`，dot branch 也不讀 `type`。

## 8. Offset Inline Style

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

它會被綁到 dot、custom count、一般 count 的角標本體：

```vue
<sup :style="styles" ...></sup>
```

因此 `offset` 的效果是調整角標自己的 margin，而不是改變 wrapper 的 `top/right`、不是 transform，也不是改變 default slot 的位置。

官方範例：

```vue
<Badge :count="10" :offset="[-5, -5]">
    <a href="//iviewui.com">我是一个链接</a>
</Badge>
```

會產生概念上的 inline style：

```html
<sup class="ivu-badge-count" style="margin-top: -5px; margin-right: -5px;">10</sup>
```

## 9. Dot Class

dot branch 使用：

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

dot 是固定 8px 的小紅點，不顯示 count 文字。它仍會套用 `styles`，所以 `offset` 對 dot 也有效。

dot 的可見性由 `badge` computed 控制：

| 輸入 | dot 是否顯示 |
| --- | --- |
| `dot` | 顯示。 |
| `dot :count="0"` | 隱藏。 |
| `dot showZero :count="0"` | 顯示，因為最後回傳 `status || showZero`。 |

最後一種組合不是官方範例主線，但它是 source 的實際結果。

## 10. Status Class 與 Color

status branch 的 dot 使用 `statusClasses`：

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

它的基礎樣式是 inline dot：

```less
width: 6px;
height: 6px;
display: inline-block;
border-radius: 50%;
vertical-align: middle;
position: relative;
top: -1px;
```

status 狀態色：

| `status` | class | 視覺 |
| --- | --- | --- |
| `success` | `ivu-badge-status-success` | 成功色。 |
| `processing` | `ivu-badge-status-processing` | 處理中色，附帶擴散動畫。 |
| `default` | `ivu-badge-status-default` | 一般灰色。 |
| `error` | `ivu-badge-status-error` | 錯誤色。 |
| `warning` | `ivu-badge-status-warning` | 警告色。 |

`processing` 的動畫由 pseudo-element 產生：

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

這也是為什麼 status 模式不能只看 runtime。`processing` 的動態效果完全在 less 裡。

## 11. 內建 Color 與自訂 Color

runtime 有一份 status color 清單：

```js
const initColorList = ['blue', 'green', 'red', 'yellow', 'pink', 'magenta', 'volcano', 'orange', 'gold', 'lime', 'cyan', 'geekblue', 'purple'];
```

如果 `color` 在清單中，會產生：

```txt
ivu-badge-status-{color}
```

less 使用 `.make-color-classes()` 產生這些色階 class：

```less
@colors: pink, magenta, red, volcano, orange, yellow, gold, cyan, lime, green, blue, geekblue, purple;
```

如果 `color` 不在清單中，`statusStyles` 會回傳：

```js
{ backgroundColor: this.color }
```

也就是自訂色走 inline style：

```html
<span class="ivu-badge-status-dot" style="background-color: #2db7f5;"></span>
```

這裡和 `Tag` 的顏色系統有相似之處：內建色走 class，自訂色走 inline style。但在 `Badge` 中，這條顏色路徑只屬於 status branch。

## 12. Status Text

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

這代表 status text 是跟在 status dot 後面的普通 inline-block 文本，不會被放到右上角，也不受 `offset` 影響。

文字來源在 template 中是：

```vue
<slot name="text">{{ text }}</slot>
```

所以 `#text` 的優先序高於 `text` prop。

## 13. 常見誤區

| 誤區 | 正確理解 |
| --- | --- |
| `ivu-badge` 本身就是角標 | `ivu-badge` 是 wrapper；真正的角標是內部 `sup` 或 status dot span。 |
| `offset` 會改變 `top/right` | `offset` 實際寫入 `margin-top` / `margin-right`。 |
| `className` 會加到 root | `className` 加到 count `sup` 或 custom count `sup`，不是 root wrapper。 |
| `type` 可以改 dot 顏色 | `type` 只產生 `ivu-badge-count-{type}`。 |
| `color` 可以改 count 顏色 | `color` 會啟用 status branch，作用在 status dot。 |
| status branch 會包裹 default slot | status branch 不渲染 default slot，只輸出 dot 和 text。 |

## 14. 本章總結

`Badge` 的樣式系統要先分清楚模式。一般 count 和 dot 是附著在 wrapper 上的 absolute badge；status 是 inline 狀態點；custom count 保留定位但取消預設角標外觀。

最值得記住的是三個 class 邊界：`ivu-badge-count` 是數字角標，`ivu-badge-dot` 是右上角小點，`ivu-badge-status-dot` 是 inline 狀態點。三者看起來都像 badge，但布局模型不同。

## 15. 自我檢查問題

1. `ivu-badge` root 為什麼需要 `position: relative`？
2. `ivu-badge-count-alone` 改變了哪些定位屬性？
3. `#count` 為什麼會取消背景和陰影？
4. `offset` 實際寫入哪兩個 CSS property？
5. `type` 和 `color` 分別作用在哪一種 badge 模式？
6. `processing` 狀態的動畫在哪裡定義？
