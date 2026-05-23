# ButtonGroup And Style System：群組容器如何透過樣式影響子按鈕

## 0. 原始筆記問題分析

原本筆記已經指出 `ButtonGroup` 會影響子按鈕排列、邊框與圓角，但還沒有說清楚「影響」發生在哪一層。

`ButtonGroup` 很容易被誤解成會主動管理子 `Button`，例如把 `size` 傳給子元件、改寫子元件 props，或透過 provide/inject 協調狀態。實際上，這個版本的 `ButtonGroup` runtime 很薄，它主要只是輸出父層 class，讓 less selector 對子按鈕生效。

## 1. 本章定位

本章是一篇 group 與 style 對照筆記，專門分析 `ButtonGroup` 如何和 `button.less`、`styles/mixins/button.less` 協作。

讀完後，應該能回答：

1. `ButtonGroup` runtime 做了什麼，沒做什麼。
2. `size`、`shape`、`vertical` 如何轉成 group class。
3. group 樣式如何影響子 `Button` 的尺寸、排列、邊框與圓角。
4. 為什麼要把 `ButtonGroup` 和 `Button` 放在同一組筆記中。

## 2. ButtonGroup runtime 很薄

`button-group.vue` 的 template 是：

```vue
<div :class="classes">
    <slot></slot>
</div>
```

它沒有 methods、沒有 emits，也沒有 provide/inject。這代表它不主動理解 slot 裡到底有幾個 `Button`，也不改寫子元件狀態。

它的核心 computed 是：

```js
classes () {
    return [
        'ivu-btn-group',
        {
            [`ivu-btn-group-${this.size}`]: !!this.size,
            [`ivu-btn-group-${this.shape}`]: !!this.shape,
            'ivu-btn-group-vertical': this.vertical
        }
    ];
}
```

所以 `ButtonGroup` 的 runtime 責任只有一件事：根據 props 產生 group class。

## 3. Props 到 class 的映射

| 使用方式 | 主要 class | 說明 |
| --- | --- | --- |
| `<ButtonGroup>` | `ivu-btn-group ivu-btn-group-default` | default size 也會輸出 group default class。 |
| `<ButtonGroup size="small">` | `ivu-btn-group-small` | 讓 group 內按鈕使用小尺寸樣式。 |
| `<ButtonGroup size="large">` | `ivu-btn-group-large` | 讓 group 內按鈕使用大尺寸樣式。 |
| `<ButtonGroup shape="circle">` | `ivu-btn-group-circle` | 讓 group 內按鈕使用 group circle 規則。 |
| `<ButtonGroup vertical>` | `ivu-btn-group-vertical` | 切換成縱向排列。 |

這裡和 `Button` 本身有一個差異：`Button` 在 `size === 'default'` 時不輸出 `ivu-btn-default` 作為尺寸 class；但 `ButtonGroup` 只要 `size` 有值就會輸出 `ivu-btn-group-${size}`，而 default function 會讓 `size` 通常有值。

## 4. Group 不傳 props，樣式接手

`ButtonGroup` 的 `size` 不會在 runtime 中傳給子 `Button`。例如：

```vue
<ButtonGroup size="large">
    <Button>Large</Button>
    <Button>Large</Button>
</ButtonGroup>
```

`ButtonGroup` 只會輸出：

```html
<div class="ivu-btn-group ivu-btn-group-large">
    ...
</div>
```

真正讓子按鈕變大的，是 `styles/mixins/button.less` 中類似這樣的規則：

```less
&-large {
    & > .@{btnClassName} {
        .button-size(@btn-height-large; @btn-padding-large; @btn-font-size-large; @btn-border-radius);
    }
}
```

也就是：

```txt
ButtonGroup prop
  -> group class
  -> less parent > child selector
  -> child button visual size
```

這是樣式層面的繼承，不是 runtime props 傳遞。

## 5. 橫向 group 的排列與邊框

橫向 group 的核心樣式來自 `.btn-group(@btnClassName)`。

它先套用 `.button-group-base()`，讓 group 成為 inline-block，並讓子 `.ivu-btn` float left：

```less
> .@{btnClassName} {
    position: relative;
    float: left;
}
```

接著用負 margin 合併相鄰按鈕邊框：

```less
.@{btnClassName} + .@{btnClassName} {
    margin-left: -1px;
}
```

再處理中間按鈕與首尾按鈕的圓角：

```txt
中間按鈕
  -> border-radius: 0

第一個按鈕且不是最後一個
  -> 右上 / 右下圓角歸零

最後一個按鈕且不是第一個
  -> 左上 / 左下圓角歸零
```

這些規則讓一組按鈕看起來像連成一體，而不是多個獨立按鈕排在一起。

## 6. Vertical group 的排列與邊框

`vertical` 會產生：

```txt
ivu-btn-group-vertical
```

`button.less` 中會套用：

```less
&-group-vertical {
    .btn-group-vertical(@btn-prefix-cls);
}
```

縱向 group 的核心差異是子按鈕不再 float left，而是 block 排列：

```less
> .@{btnClassName} {
    display: block;
    width: 100%;
    max-width: 100%;
    float: none;
}
```

相鄰按鈕使用：

```less
margin-top: -1px;
margin-left: 0px;
```

圓角也從左右關係改成上下關係：

```txt
第一個按鈕
  -> 底部圓角歸零

最後一個按鈕
  -> 頂部圓角歸零
```

所以 `vertical` 不是簡單改成 `flex-direction: column`，而是一整組針對垂直邊框合併與圓角的樣式規則。

## 7. Primary button 在 group 中的特殊邊框

`button.less` 對 `ivu-btn-primary` 在 group 裡有額外處理。

橫向 group 中，primary button 的相鄰邊框會使用：

```less
@btn-group-border
```

並且 disabled 時回到：

```less
@btn-default-border
```

縱向 group 也有對應的 top / bottom border 處理。

這是為了避免多個 primary button 連在一起時，邊框顏色和背景色混在一起造成視覺斷裂。閱讀 group 樣式時，不只要看一般 button，也要看 type-specific selector，例如 `&-primary` 內部針對 group 的規則。

## 8. Button style 補充規則

除了 group，本章也建議順手觀察幾個 `Button` 樣式規則。

| 規則 | 來源 | 重點 |
| --- | --- | --- |
| `& > .ivu-icon + span` / `& > span + .ivu-icon` | `button.less` | 控制 icon 和文字之間的 4px 間距。 |
| `&&-loading` | `button.less` | loading button 加上 overlay 與 `pointer-events: none`。 |
| `&-long` | `button.less` | 寬度變成 `100%`。 |
| `&-ghost` | `button.less` | 新版 ghost 透明背景與不同 type 的 hover 規則。 |
| `a.ivu-btn` | `button.less` | anchor button 需要不同 line-height 微調。 |
| `.btn()` | `styles/mixins/button.less` | button base、disabled、size、icon-only 的共用規則。 |
| `.btn-circle()` | `styles/mixins/button.less` | circle 與 icon-only circle 的尺寸規則。 |

這些規則說明 `Button` 的視覺不是由單一 class 完成，而是由 base class、type class、state class、group parent class 多層疊加。

## 9. 官方 example 對照

`examples/routers/button.vue` 中的 group 場景可以分成幾類。

| 場景 | 觀察重點 |
| --- | --- |
| 基本 group | 多個 button 連成一組，邊框合併。 |
| disabled group | disabled button 在 group 中仍要維持邊框一致。 |
| icon group | icon-only button 在 group 中的方形尺寸與間距。 |
| `shape="circle"` | group circle class 如何影響首尾按鈕圓角。 |
| `size="large"` / `size="small"` | group size class 如何影響子按鈕視覺尺寸。 |
| `vertical` | 子按鈕由橫向連接改成縱向堆疊。 |

官方範例中也出現 `ButtonGroup :size="buttonSize"` 搭配子 `Button :size="buttonSize"` 的寫法。閱讀時要分清楚：子按鈕自己的 `size` 會產生自己的 class；group size 則透過父層 selector 影響子按鈕樣式。兩者可以同時存在。

## 10. 常見誤區

| 誤區 | 正確理解 |
| --- | --- |
| `ButtonGroup` 會把 size prop 傳給子 `Button` | runtime 沒有傳 props，主要由 group class 和 less selector 生效。 |
| `ButtonGroup` 需要知道有幾個子按鈕 | runtime 不計算子按鈕數量，首尾與中間狀態由 CSS selector 判斷。 |
| `vertical` 只是改排列方向 | vertical 也改 margin、width、float、上下圓角與邊框合併。 |
| group 樣式只在 `button-group.vue` 裡 | group 的主要邏輯在 `button.less` 與 `styles/mixins/button.less`。 |
| 只看 `.ivu-btn-group` 就足夠 | 還要看 `.ivu-btn-primary` 內對 group 的特殊邊框規則。 |

## 11. 本章總結

`ButtonGroup` 是一個典型的「runtime 很薄、style 很重」的群組元件。它本身只包住 slot 並輸出 group class；真正的排列、尺寸、邊框合併、圓角處理，都在 less 中透過父子 selector 完成。

這也是為什麼 `ButtonGroup` 必須和 `Button` 一起讀。`ButtonGroup` 的意義不是提供一個新的互動模型，而是讓一組 `Button` 在視覺上成為同一個控制組。

## 12. 自我檢查問題

1. `ButtonGroup` runtime 做了哪些事？
2. `ButtonGroup` 有沒有 provide/inject？
3. `ButtonGroup.size` 如何影響子按鈕視覺？
4. 橫向 group 為什麼需要 `margin-left: -1px`？
5. vertical group 的子按鈕為什麼要 `display: block`？
6. group 中第一個與最後一個按鈕的圓角如何處理？
7. primary button 在 group 裡為什麼需要特殊邊框規則？
8. 為什麼說 `ButtonGroup` 是 runtime 薄、style 重的元件？
