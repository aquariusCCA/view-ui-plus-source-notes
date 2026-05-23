# Tag Render Class And Color System：從 props 到 DOM 與樣式

## 0. 原始筆記問題分析

原本筆記已經指出 `closable`、`checkable`、自定義 `color` 會影響 class、style 與渲染分支，但還沒有把 template、computed class、inline style 與 less 對起來。

`Tag` 的樣式系統容易誤讀，原因是它不是單一路徑：

```txt
內建色 -> class -> tag.less
自定義色 -> computed inline style -> DOM style
```

再加上 `type="border"`、`type="dot"`、`checked=false`、`closable=true` 都會改變視覺，所以本章會把 render structure 與 color path 拆開看。

## 1. 本章定位

本章是一篇 runtime render 與 style 對照筆記，專門分析 `src/components/tag/tag.vue` 如何把 props、slot 與 `isChecked` 轉成 DOM、class 與 inline style。

本章不深入講 `on-change` / `on-close` 的事件邊界，事件流程會放到 `04-state-events-and-control-boundary.md`。

## 2. Template 的基本形狀

`Tag` 的 template 如下：

```vue
<div :class="classes" @click.stop="check" :style="wraperStyles">
    <span :class="dotClasses" v-if="showDot" :style="bgColorStyle"></span>
    <span :class="textClasses" :style="textColorStyle"><slot></slot></span>
    <Icon v-if="closable" :class="iconClass" :color="lineColor" type="ios-close" @click.stop="close"></Icon>
</div>
```

這個結構可以拆成四個節點。

| 節點 | 出現條件 | 責任 |
| --- | --- | --- |
| root `div` | 永遠存在 | 承載主要 class、click handler、自定義色 wrapper style。 |
| dot `span` | `type === 'dot'` | 顯示 dot type 左側圓點。 |
| text `span` | 永遠存在 | 承載 default slot 文字與文字顏色 class/style。 |
| close `Icon` | `closable === true` | 顯示 `ios-close`，點擊 emit `on-close`。 |

因此 `Tag` 的內容文字不是 prop，而是 default slot。`name` 不會被渲染成文字。

## 3. Root Class 映射規則

`classes` computed 回傳：

```js
[
    `${prefixCls}`,
    `${prefixCls}-size-${this.size}`,
    {
        [`${prefixCls}-${this.color}`]: !!this.color && oneOf(this.color, initColorList),
        [`${prefixCls}-${this.type}`]: !!this.type,
        [`${prefixCls}-closable`]: this.closable,
        [`${prefixCls}-checked`]: this.isChecked,
        [`${prefixCls}-checkable`]: this.checkable
    }
]
```

其中 `prefixCls` 固定是：

```js
const prefixCls = 'ivu-tag';
```

可以整理成下表。

| 條件 | 產生 class | 作用 |
| --- | --- | --- |
| 永遠存在 | `ivu-tag` | Tag 基礎樣式。 |
| `size="default"` | `ivu-tag-size-default` | default size 標記，實際主要樣式仍來自基礎 `.ivu-tag`。 |
| `size="medium"` | `ivu-tag-size-medium` | 中尺寸高度、line-height、padding。 |
| `size="large"` | `ivu-tag-size-large` | 大尺寸高度、line-height、padding。 |
| 內建 `color="primary"` | `ivu-tag-primary` | 內建色 class，由 less 決定背景與文字。 |
| `type="border"` | `ivu-tag-border` | border type 視覺。 |
| `type="dot"` | `ivu-tag-dot` | dot type 視覺。 |
| `closable` | `ivu-tag-closable` | 關閉圖示相關位置與 border type 分隔線。 |
| `isChecked` | `ivu-tag-checked` | 表示目前選中，影響未選中樣式分支。 |
| `checkable` | `ivu-tag-checkable` | 加上 pointer cursor。 |

需要注意的是，`color` 只有在屬於 `initColorList` 時才會產生 `ivu-tag-{color}`。自定義色不會產生對應 class。

## 4. Text 與 Dot Class

文字節點的 class 由 `textClasses` 決定：

```txt
ivu-tag-text
ivu-tag-color-{color}
ivu-tag-color-white
```

它主要處理兩類情境。

第一，`type="border"` 且使用內建色時，文字需要走 `ivu-tag-color-{color}`，讓 border type 的文字和邊框顏色一致。

第二，普通 type 搭配部分內建色且選中時，文字需要白色，runtime 會加上 `ivu-tag-color-white`。但最終顏色仍可能被後面更具體的 generated color class 覆蓋，因此判斷視覺結果時要回到 `tag.less` 的順序一起看。

dot 節點的 class 比較單純：

```js
dotClasses () {
    return `${prefixCls}-dot-inner`;
}
```

也就是：

```txt
ivu-tag-dot-inner
```

dot 的顏色如果是內建色，主要由 less selector 處理；如果是自定義色，則由 `bgColorStyle` 寫入 inline background。

## 5. DOM 輸出情境

### 5.1 普通 Tag

輸入：

```vue
<Tag>Label</Tag>
```

概念輸出：

```html
<div class="ivu-tag ivu-tag-size-default ivu-tag-default ivu-tag-checked">
    <span class="ivu-tag-text">Label</span>
</div>
```

重點是 `checked` 預設為 `true`，所以即使沒有 `checkable`，仍會有 `ivu-tag-checked`。

### 5.2 可關閉 Tag

輸入：

```vue
<Tag closable>Label</Tag>
```

概念輸出：

```html
<div class="ivu-tag ivu-tag-size-default ivu-tag-default ivu-tag-closable ivu-tag-checked">
    <span class="ivu-tag-text">Label</span>
    <i class="ivu-icon ivu-icon-ios-close"></i>
</div>
```

`closable` 只讓 close icon 出現。點擊 icon 後是否移除 DOM，要由外部收到 `on-close` 後處理。

### 5.3 Border Tag

輸入：

```vue
<Tag type="border" color="primary" closable>Label</Tag>
```

概念輸出：

```html
<div class="ivu-tag ivu-tag-size-default ivu-tag-primary ivu-tag-border ivu-tag-closable ivu-tag-checked">
    <span class="ivu-tag-text ivu-tag-color-primary">Label</span>
    <i class="ivu-icon ivu-icon-ios-close ivu-tag-color-primary"></i>
</div>
```

`border` type 的外框、文字顏色、close icon 顏色和右側分隔線都要回到 `tag.less` 看。

### 5.4 Dot Tag

輸入：

```vue
<Tag type="dot" color="success">Label</Tag>
```

概念輸出：

```html
<div class="ivu-tag ivu-tag-size-default ivu-tag-success ivu-tag-dot ivu-tag-checked">
    <span class="ivu-tag-dot-inner"></span>
    <span class="ivu-tag-text">Label</span>
</div>
```

`dot` type 的根節點會被 less 改成白底、固定高度，真正的顏色主要在 `ivu-tag-dot-inner` 上。

## 6. 內建色路徑

內建色的判斷基準是 `initColorList`：

```txt
default
primary / success / warning / error
blue / green / red / yellow
pink / magenta / volcano / orange / gold / lime / cyan / geekblue / purple
```

只要 `color` 在這份清單裡，root class 就會出現：

```txt
ivu-tag-{color}
```

接著交給 `tag.less` 處理。less 裡主要有三類內建色。

| 類型 | 代表 | 視覺策略 |
| --- | --- | --- |
| default | `default` | 使用基礎灰底與灰邊框。 |
| 語意色 | `primary`、`success`、`warning`、`error` | 大多使用實色背景與白字。 |
| 色階色 | `pink`、`magenta`、`red`、`volcano`、`orange`、`yellow`、`gold`、`cyan`、`lime`、`green`、`blue`、`geekblue`、`purple` | 使用 light background、light border、dark text。 |

`tag.less` 中的 `.make-color-classes()` 會批次產生色階色 class。這也是為什麼只看 `tag.vue` 看不到每一個顏色的具體 CSS。

## 7. 自定義色路徑

如果 `color` 不在 `initColorList`，例如：

```vue
<Tag color="#EF6AFF">Label</Tag>
```

runtime 不會產生 `ivu-tag-#EF6AFF` 這種 class，而是改走 inline style。

`wraperStyles` 會處理 root：

```txt
background
borderWidth
borderStyle
borderColor
color
```

`textColorStyle` 會處理文字：

```txt
普通 type 且 checked -> 通常讓文字變白
border type -> 使用自定義色
dot type -> 文字維持預設，圓點另外處理
```

`bgColorStyle` 會處理 dot：

```txt
background: custom color
```

所以自定義色的完整結果必須看三個 computed：

```txt
wraperStyles
textColorStyle
bgColorStyle
```

不能只在 less 裡找對應 class。

## 8. 未選中樣式

`checked` 影響 root 是否有：

```txt
ivu-tag-checked
```

`tag.less` 有一段重要規則：

```less
&:not(&-border):not(&-dot):not(&-checked) {
    background: transparent;
    border-color: transparent;
    color: @text-color;
}
```

這代表普通 type 的 Tag 如果未選中，會變成透明背景、透明邊框與普通文字色。

注意這段排除了：

```txt
border type
dot type
checked state
```

因此 `checked=false` 對不同 type 的視覺影響不完全相同。理解這一點，才能看懂 `checkable` Tag 點擊後為什麼像是被淡出，而不是完全消失。

## 9. Close Icon 樣式

close icon 是內部 `Icon` component：

```vue
<Icon v-if="closable" :class="iconClass" :color="lineColor" type="ios-close" @click.stop="close"></Icon>
```

它同時受三個來源影響：

| 來源 | 責任 |
| --- | --- |
| `closable` | 決定 icon 是否渲染。 |
| `iconClass` | 在 border type 內建色時加上 `ivu-tag-color-{color}`。 |
| `lineColor` | 透過 `Icon` 的 `color` prop 直接指定顏色。 |
| `tag.less` | 定義 `.ivu-icon-ios-close` 的大小、margin、opacity、hover、border type 位置。 |

close icon 點擊使用 `@click.stop`，所以在 `closable + checkable` 同時存在時，點 close 不會順便觸發 root 的 `check()`。

## 10. 本章總結

`Tag` 的 render output 很小，但 class 與顏色路徑不簡單。普通文字、dot、close icon 都是固定 template 的不同分支；內建色交給 less，自定義色交給 inline style；`checked` 則透過 `ivu-tag-checked` 影響未選中視覺。

閱讀這類元件時，不要只問「這個 prop 產生哪個 class」。更精準的問題是：這個 prop 是改 DOM 結構、class、inline style，還是交給 less selector 做最後處理。

## 11. 自我檢查問題

1. `Tag` template 中哪些節點永遠存在？哪些節點按條件出現？
2. 自定義 color 為什麼不會產生 `ivu-tag-{color}` class？
3. `type="dot"` 的圓點顏色由哪些來源決定？
4. `checked=false` 為什麼主要影響普通 type，而不是所有 type 都同樣變化？
5. close icon 的顏色與位置分別可能由哪些來源控制？
6. 為什麼判斷內建色最終顏色時，不能只看 `textClasses`？
