# Cell Render Style Arrow And Global Config：結構、樣式、箭頭與全域設定

## 0. 原始筆記問題分析

原本筆記已經指出要整理 link 行為與列表行樣式，但還沒有把 render branch、class mapping、`cell.less`、`.select-item()`、arrow slot 與 `$VIEWUI.cell` 全域設定串成同一條線。

`Cell` 的畫面看起來簡單，但它的樣式來源其實有三層：

1. `cell.vue` 產生 `ivu-cell`、`ivu-cell-disabled`、`ivu-cell-selected`、`ivu-cell-with-link`。
2. `cell.less` 定義 icon、main、label、footer、arrow 的定位與 selected 規則。
3. `mixins/select.less` 的 `.select-item()` 補上 padding、hover、disabled、selected 等 item 共用規則。

## 1. 本章定位

本章是一篇 render、class、style 與 arrow 對照筆記，專門分析 `Cell` 如何從 props / slots / global config 轉成 DOM 與樣式。

本章不重複展開 click 與 router navigation。那些內容請看 `03-click-link-and-provide-inject-flow.md`。

## 2. Root Class Mapping

`Cell` 的根 class 由 computed `classes` 產生：

```js
classes () {
    return [
        `${prefixCls}`,
        {
            [`${prefixCls}-disabled`]: this.disabled,
            [`${prefixCls}-selected`]: this.selected,
            [`${prefixCls}-with-link`]: this.to
        }
    ];
}
```

整理成表格：

| 條件 | class | 作用 |
| --- | --- | --- |
| 固定 | `ivu-cell` | 根節點基礎 class。 |
| `disabled=true` | `ivu-cell-disabled` | 交給 `.select-item()` 改 disabled 視覺。 |
| `selected=true` | `ivu-cell-selected` | 改 selected 背景與 label / footer 色彩。 |
| `to` 有值 | `ivu-cell-with-link` | 右側有 arrow，footer 往左移。 |

這裡沒有 active、focused、checked 等內部狀態 class。`Cell` 的狀態完全來自 props。

## 3. Render Branch

`Cell` 以 `to` 決定中間 wrapper。

有 `to`：

```vue
<a
    v-if="to"
    :href="linkUrl"
    :target="target"
    class="ivu-cell-link">
    <CellItem ... />
</a>
```

無 `to`：

```vue
<div class="ivu-cell-link" v-else>
    <CellItem ... />
</div>
```

branch 差異如下。

| 條件 | Wrapper | 額外元素 | class |
| --- | --- | --- | --- |
| 有 `to` | `<a>` | `.ivu-cell-arrow` | 根節點有 `ivu-cell-with-link`。 |
| 無 `to` | `<div>` | 無 arrow | 根節點沒有 `ivu-cell-with-link`。 |

不論哪個 branch，內部都渲染同一個 `CellItem`。因此 title、label、extra、icon 的 DOM 結構穩定。

## 4. `CellItem` Layout

`CellItem` 固定輸出：

```txt
ivu-cell-item
  ivu-cell-icon
  ivu-cell-main
    ivu-cell-title
    ivu-cell-label
  ivu-cell-footer
    ivu-cell-extra
```

`cell.less` 對這些區塊的主要設定：

| Selector | 樣式重點 |
| --- | --- |
| `.ivu-cell-icon` | `inline-block`、右距 `4px`、空內容時 `display: none`。 |
| `.ivu-cell-main` | `inline-block`、`vertical-align: middle`。 |
| `.ivu-cell-title` | `line-height: 24px`、基礎字級。 |
| `.ivu-cell-label` | 小字級、`subsidiary-color`。 |
| `.ivu-cell-footer` | absolute 定位在右側中央，預設 `right: 16px`。 |
| `.ivu-cell-extra` | 位於 footer 內，承接 `extra` slot 或 prop。 |

這裡值得注意的是 footer 是 absolute positioning，不參與 main 內容流。若右側 extra 很長，可能覆蓋或擠壓視覺，這不是 runtime 會處理的問題。

## 5. Footer 與 Arrow Positioning

有 link 時，`Cell` 會多渲染：

```vue
<div class="ivu-cell-arrow" v-if="to">
    <slot name="arrow">
        <Icon :type="arrowType" :custom="customArrowType" :size="arrowSize" />
    </slot>
</div>
```

`cell.less` 對 footer 與 arrow 的定位：

```less
&-footer{
    display: inline-block;
    position: absolute;
    transform: translateY(-50%);
    top: 50%;
    right: 16px;
    color: @text-color;
}
&-with-link &-footer{
    right: 32px;
}
&-arrow{
    display: inline-block;
    position: absolute;
    transform: translateY(-50%);
    top: 50%;
    right: 16px;
    font-size: @font-size-base;
}
```

整理成：

| 條件 | Footer right | Arrow right |
| --- | --- | --- |
| 無 `to` | `16px` | 不渲染。 |
| 有 `to` | `32px` | `16px`。 |

這讓 extra 內容讓出 arrow 的位置。

## 6. Arrow Source Priority

箭頭內容有兩個層級。

第一層是 `#arrow` slot：

```vue
<slot name="arrow">
    <Icon :type="arrowType" :custom="customArrowType" :size="arrowSize" />
</slot>
```

只要使用者提供 `#arrow`，整個預設 `Icon` 都會被覆蓋。

第二層是預設 `Icon` 的三個 computed：

```txt
arrowType
customArrowType
arrowSize
```

所以優先序是：

```txt
有 #arrow slot
  -> 使用 slot
沒有 #arrow slot
  -> 使用 Icon(type/custom/size)
      -> 由 $VIEWUI.cell 或預設值決定
```

## 7. Global Config Source

`Cell` 混入 `globalConfig`：

```js
created () {
    const instance = getCurrentInstance();
    this.globalConfig = instance.appContext.config.globalProperties.$VIEWUI;
}
```

install 時建立 `$VIEWUI.cell`：

```js
app.config.globalProperties.$VIEWUI = {
    cell: {
        arrow: opts.cell ? opts.cell.arrow ? opts.cell.arrow : '' : '',
        customArrow: opts.cell ? opts.cell.customArrow ? opts.cell.customArrow : '' : '',
        arrowSize: opts.cell ? opts.cell.arrowSize ? opts.cell.arrowSize : '' : ''
    },
    ...
}
```

Type declaration 在 `types/index.d.ts` 也描述：

```ts
cell?: {
    arrow: string;
    customArrow: string;
    arrowSize: number | string;
};
```

這說明 arrow 設定是 install option / global property 層級的能力，不是每個 `Cell` 自身 prop。

## 8. Arrow Computed Rules

`arrowType`：

```js
arrowType () {
    const config = this.globalConfig;
    let type = 'ios-arrow-forward';

    if (config) {
        if (config.cell.customArrow) {
            type = '';
        } else if (config.cell.arrow) {
            type = config.cell.arrow;
        }
    }
    return type;
}
```

規則：

| 全域設定 | `arrowType` |
| --- | --- |
| 無設定 | `ios-arrow-forward`。 |
| `cell.arrow` 有值 | 使用 `cell.arrow`。 |
| `cell.customArrow` 有值 | `arrowType` 清空。 |

`customArrowType`：

```js
customArrowType () {
    const config = this.globalConfig;
    let type = '';

    if (config) {
        if (config.cell.customArrow) {
            type = config.cell.customArrow;
        }
    }
    return type;
}
```

`arrowSize`：

```js
arrowSize () {
    const config = this.globalConfig;
    let size = '';

    if (config) {
        if (config.cell.arrowSize) {
            size = config.cell.arrowSize;
        }
    }
    return size;
}
```

整理成一條規則：

```txt
customArrow 優先於 arrow
arrowSize 只在有全域設定時傳給 Icon
沒有全域設定時使用 Icon 預設 size
```

## 9. Link Visual Rules

`cell.less` 對 link wrapper 的規則很少：

```less
&-link, &-link:hover, &-link:active{
    color: inherit;
}
```

這表示 `<a>` 不應把文字變成瀏覽器預設 link 顏色。互動視覺主要由根 `.ivu-cell` 與 `.select-item()` 控制，而不是由 `<a>` 自己控制。

## 10. `.select-item()` Mixin

`cell.less` 最後呼叫：

```less
.select-item(@cell-prefix-cls, @cell-prefix-cls);
```

`@cell-prefix-cls` 是：

```less
@cell-prefix-cls: ~"@{css-prefix}cell";
```

因此 mixin 會針對 `.ivu-cell` 產生 item 共用規則，例如：

| Mixin 規則 | 對 Cell 的效果 |
| --- | --- |
| `padding: 7px 16px` | 每一列的內距。 |
| `cursor: pointer` | 讓 Cell 看起來可點擊。 |
| `transition: background ...` | hover 背景有過渡。 |
| `&:hover` | hover 背景。 |
| `&-disabled` | disabled 色彩與 disabled cursor。 |
| `&-selected` | selected 文字色。 |

這是為什麼 `Cell` 沒有在 `cell.less` 上半段明確寫 padding，也仍然有列表項內距。

## 11. Selected Rules

`cell.less` 對 selected 又額外補了幾條：

```less
&-selected &-label{
    color: inherit;
}

&-selected, &&-selected:hover{
    background:  ~`colorPalette("@{primary-color}", 1)`;
}

&-selected &-footer{
    color: inherit;
}

&-selected:focus{
    background: shade(@selected-color, 10%);
}
```

搭配 `.select-item()`，selected 的效果是：

1. 根節點文字色走 selected item 規則。
2. label 和 footer 改成 inherit，避免仍保留灰色。
3. 背景改成 primary color palette 的淺色。
4. focus 時背景再變深。

`selected` 不會新增 ARIA attribute，也不會影響 click 行為。

## 12. Disabled Rules

disabled 的視覺主要來自 `.select-item()`：

```less
&-disabled {
    color: @btn-disable-color;
    cursor: @cursor-disabled;

    &:hover {
        color: @btn-disable-color;
        background-color: #fff;
        cursor: @cursor-disabled;
    }
}
```

這代表：

| 層面 | 結果 |
| --- | --- |
| 視覺 | 灰色文字、disabled cursor、hover 不套一般 hover 背景。 |
| 行為 | runtime 沒有阻止 click。 |

因此 disabled 的行為邊界必須同時從 runtime 和 style 讀，不能只看畫面。

## 13. Type / Runtime Gaps

`.d.ts` 描述 `Cell` 有：

```txt
disabled?: boolean
selected?: boolean
to?: string | object
target?: '_blank' | '_self' | '_parent' | '_top'
v-slots.arrow
```

但有幾個 runtime 細節需要回 source 才看得到：

| 細節 | 為什麼 type 看不出來 |
| --- | --- |
| `disabled` 不阻止 click | type 只描述 prop，不描述 handler guard。 |
| `to` 會讓 footer 右移 | type 不描述 class / less。 |
| `customArrow` 會清空 `arrowType` | type 只描述 global option shape，不描述優先序。 |
| `CellItem` 是內部元件 | type export 只列 `Cell` / `CellGroup`。 |

這也是本組筆記要把 runtime、type、style 放在一起讀的原因。

## 14. Render / Style Summary

可以把畫面生成流程整理成：

```txt
Cell props / slots / globalConfig
  -> classes: ivu-cell + disabled/selected/with-link
  -> to branch: a or div
  -> CellItem: icon/main/title/label/footer/extra
  -> optional arrow: slot or Icon
  -> cell.less: structure positioning
  -> select.less mixin: item padding/hover/disabled/selected
```

這條線可以幫助避免兩種誤讀：

1. 以為所有樣式都在 `cell.less` 上半段，其實 padding / hover 來自 `.select-item()`。
2. 以為 arrow 是 `Cell` prop，其實它是 `#arrow` slot 或 `$VIEWUI.cell` 全域設定。

## 15. 本章總結

`Cell` 的 render 輸出由 `to` 分支決定，但展示結構固定交給 `CellItem`。根 class 把 disabled、selected、with-link 狀態交給樣式層，footer 與 arrow 透過 absolute positioning 分工。箭頭不是單一 prop，而是 `#arrow` slot、全域 `cell.arrow/customArrow/arrowSize` 與預設 `Icon` 共同決定。

讀這組樣式時，必須同時看 `cell.vue`、`cell.less`、`mixins/select.less`、`globalConfig.js` 與 `src/index.js`。

## 16. 自我檢查問題

1. `Cell` 的根 class 由哪些條件決定？
2. 有 `to` 和沒有 `to` 時，中間 wrapper 與 arrow 有什麼差異？
3. `CellItem` 的 footer 為什麼不在一般內容流裡？
4. 有 link 時，footer 的 `right` 為什麼會從 `16px` 變成 `32px`？
5. `#arrow` slot 和 `$VIEWUI.cell.arrow` 的優先序是什麼？
6. `customArrow` 為什麼會讓 `arrowType` 變成空字串？
7. `Cell` 的 padding 與 hover 背景主要來自哪個 less mixin？
8. 為什麼 disabled 需要同時看 runtime 與 style 才能理解完整邊界？
