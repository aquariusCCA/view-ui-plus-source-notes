# AvatarList Aggregation Tooltip And Excess：列表聚合、提示與超出項

## 0. 原始筆記問題分析

原本筆記已經指出要看 `AvatarList` 的列表聚合與 Tooltip 關係，但還沒有拆清楚三件事：

1. `AvatarList` 的資料 contract 是什麼。
2. `max`、`currentList`、`extra`、`excess` 如何共同決定畫面。
3. Tooltip 是列表項的可選包裹層，還是列表契約的一部分。

另外，`types/avatar-list.d.ts` 和 runtime source 有明顯不一致，這也需要在筆記中明確標出。

## 1. 本章定位

本章專門分析 `AvatarList`。它不是單一 `Avatar` 的變體，而是一個聚合型元件：接收陣列資料，產生多個 `Avatar`，必要時包 `Tooltip`，並在列表尾端顯示額外頭像。

本章不重複展開單一 `Avatar` 的內容 branch 與文字縮放。那些內容請先讀：

```txt
02-avatar-public-contract-and-content-priority.md
03-avatar-size-style-and-text-scaling.md
```

## 2. Runtime Props 對照表

`avatar-list.vue` 自身宣告的 props 如下。

| Runtime prop | Runtime 限制 / default | Type declaration | 閱讀重點 |
| --- | --- | --- | --- |
| `list` | `Array`，預設 `[]` | 未描述 | 資料來源；每個 item runtime 使用 `src` 與 `tip`。 |
| `shape` | `circle`、`square`，預設 `circle` | `shape?: 'circle' \| 'square'` | 傳給每個子 `Avatar`。 |
| `size` | `small`、`large`、`default`，預設 `default` | `size?: 'large' \| 'small' \| 'default'` | 傳給子 `Avatar`，也產生列表根 class。 |
| `excessStyle` | `Object`，預設 `{}` | 未描述 | 傳給 extra / excess avatar 的 inline style。 |
| `max` | `Number` | 未描述 | 控制最多顯示多少個 list item。 |
| `tooltip` | `Boolean`，預設 `true` | 未描述 | 控制是否在有 `tip` 時包 `Tooltip`。 |
| `placement` | Tooltip placement union，預設 `top` | 未描述 | 傳給 `Tooltip`。 |
| `transfer` | `Boolean`，預設讀 `$VIEWUI.transfer` 或 `false` | 未描述 | 傳給 `Tooltip`。 |

這張表最重要的是：`AvatarList` 的主要 runtime contract 是 `list` 和列表展示控制，但 `.d.ts` 沒有描述這些 props。

## 3. List Item Contract

template 中每個列表項使用：

```vue
<Tooltip :content="item.tip" v-if="tooltip && item.tip" :placement="placement" :transfer="transfer">
    <Avatar :src="item.src" :size="size" :shape="shape"></Avatar>
</Tooltip>
<Avatar v-else :src="item.src" :size="size" :shape="shape"></Avatar>
```

所以 runtime 實際使用的 item 欄位是：

| item 欄位 | 用途 |
| --- | --- |
| `src` | 傳給子 `Avatar` 的圖片來源。 |
| `tip` | 當 `tooltip` 為 true 時，作為 `Tooltip` 的 content。 |

`AvatarList` 不會從 item 讀取 `icon`、`customIcon`、`shape`、`size` 或 slot。所有子頭像共用 `AvatarList` 自己的 `shape` 與 `size`。

官方 example 的資料也符合這個 contract：

```js
{
    src: '.../avatar',
    tip: '史蒂夫·乔布斯'
}
```

## 4. `currentList` 與 `max`

列表項渲染資料來自 `currentList` computed：

```js
currentList () {
    const len = this.list.length;
    const max = this.max;
    if (len <= max) {
        return [...this.list];
    } else {
        return [...this.list].slice(0, max);
    }
}
```

整理成規則：

| 輸入 | `currentList` | excess 顯示 |
| --- | --- | --- |
| `list.length <= max` | 完整 list copy | 不顯示預設 excess。 |
| `list.length > max` | `list.slice(0, max)` | 顯示 `+${list.length - max}`。 |
| 未傳 `max` | 實際會得到完整 list copy | 不顯示預設 excess。 |
| `max=0` | 空陣列 | 如果 list 有資料，顯示 `+list.length`。 |

未傳 `max` 的情況需要稍微理解 JS 行為：`len <= undefined` 會是 false，但 `slice(0, undefined)` 會回傳完整陣列；同時 `list.length > undefined` 也會是 false，所以沒有 excess。

## 5. Tooltip 包裹規則

`Tooltip` 的出現條件是：

```txt
tooltip && item.tip
```

這代表：

| 條件 | 渲染結果 |
| --- | --- |
| `tooltip=true` 且 `item.tip` 有值 | `Tooltip` 包住 `Avatar`。 |
| `tooltip=false` | 直接渲染 `Avatar`。 |
| `item.tip` 空值 | 直接渲染 `Avatar`。 |

`Tooltip` 接收：

```txt
content = item.tip
placement = placement prop
transfer = transfer prop
```

`transfer` 的 default 讀全域設定：

```js
const global = getCurrentInstance().appContext.config.globalProperties;
return !global.$VIEWUI || global.$VIEWUI.transfer === '' ? false : global.$VIEWUI.transfer;
```

所以 Tooltip 是 `AvatarList` 的可選展示輔助，不是每個列表項都一定存在的 DOM 結構。

## 6. `extra` 與 `excess` Slot 優先序

列表尾端有兩段互斥分支：

```vue
<div class="ivu-avatar-list-item ivu-avatar-list-item-excess" v-if="$slots.extra">
    <Avatar :size="size" :shape="shape" :style="excessStyle"><slot name="extra"></slot></Avatar>
</div>
<div class="ivu-avatar-list-item ivu-avatar-list-item-excess" v-else-if="list.length > max">
    <Avatar :size="size" :shape="shape" :style="excessStyle"><slot name="excess">+{{ list.length - max }}</slot></Avatar>
</div>
```

優先序可以整理成：

```txt
有 #extra
  -> 顯示 extra avatar
else if list.length > max
  -> 顯示 excess avatar
else
  -> 不顯示額外 avatar
```

兩個 slot 的差異：

| Slot | 觸發條件 | 預設內容 | 用途 |
| --- | --- | --- | --- |
| `extra` | 只要 slot 存在就顯示 | 無 | 自訂固定額外頭像，且會讓 `excess` 失效。 |
| `excess` | 沒有 `extra` 且超過 `max` | `+{{ list.length - max }}` | 自訂超出數量的顯示內容。 |

`excessStyle` 同時套用在 `extra` 與 `excess` avatar 上。

## 7. Style 與重疊排列

`avatar-list.less` 負責列表的排列方式。

根容器：

```less
.ivu-avatar-list{
    display: inline-block;
}
```

列表項：

```less
&-item{
    display: inline-block;
    margin-left: -8px;
    cursor: pointer;
    &:first-child{
        margin-left: 0;
    }
    .ivu-avatar{
        border: 1px solid #fff;
    }
    &-excess{
        cursor: auto;
    }
}
```

這裡有三個重點。

第一，重疊效果來自每個 item 的負 `margin-left`，不是 transform 或 absolute positioning。

第二，第一個 item 的 margin-left 會重設為 0，避免整組列表往左偏。

第三，每個子 `Avatar` 加白色邊框，讓頭像重疊時仍能看出分隔。

## 8. Size 對列表間距的影響

`AvatarList` 根節點會產生：

```vue
<div class="ivu-avatar-list" :class="'ivu-avatar-list-' + size">
```

不同尺寸對 margin 的影響：

| size | class | margin-left |
| --- | --- | --- |
| `small` | `ivu-avatar-list-small` | 使用 base `-8px`。 |
| `default` | `ivu-avatar-list-default` | 覆蓋為 `-12px`。 |
| `large` | `ivu-avatar-list-large` | 覆蓋為 `-16px`。 |

`large` 還會讓 excess item 使用較大的字體：

```less
.ivu-avatar-list-large{
    .ivu-avatar-list-item-excess{
        font-size: @font-size-large;
    }
}
```

這裡的設計是：頭像越大，重疊距離越大，維持相近的視覺密度。

## 9. Type Declaration 落差

`types/avatar-list.d.ts` 實際內容和 runtime 差異很大。

它有描述：

```txt
shape
size
src
icon
custom-icon
v-slots.excess
v-slots.extra
```

但 runtime 的 `AvatarList` 並沒有宣告 `src`、`icon`、`customIcon` props；這些是子 `Avatar` 的 props。相反地，runtime 真正重要的 props 沒有被 `.d.ts` 描述：

```txt
list
excessStyle
max
tooltip
placement
transfer
```

這代表讀 `AvatarList` 時不能只看型別檔。對學習者來說，這是一個很好的案例：type declaration 是 public surface 的一部分，但不是永遠和 runtime source 完全一致。

## 10. Public Contract 常見誤區

| 誤區 | 正確理解 |
| --- | --- |
| `AvatarList` 是任意 children 容器 | 它根據 `list` 主動產生子 `Avatar`，不是渲染 default slot。 |
| list item 可以控制每個頭像的 shape / size | runtime 只讀 `item.src` 與 `item.tip`；shape / size 由 `AvatarList` props 統一傳下去。 |
| 每個 item 都一定有 Tooltip | 只有 `tooltip && item.tip` 時才包 `Tooltip`。 |
| `extra` 只在超出 `max` 時顯示 | 只要提供 `#extra` 就會顯示，且優先於 `excess`。 |
| `.d.ts` 已完整描述 AvatarList | `.d.ts` 漏掉主要 runtime props，且包含不存在的 props。 |

## 11. 本章總結

`AvatarList` 是一個小型聚合元件。它的核心不是複雜狀態，而是把 `list` 轉成固定的子 `Avatar` 結構，並在必要時加上 Tooltip 和超出提示。

理解這個元件的關鍵，是把它看成「資料驅動的頭像列表」，而不是「包住任意 Avatar children 的 layout 容器」。它的資料 contract、slot 優先序和 type declaration 落差，都是閱讀時最值得記下來的地方。

## 12. 自我檢查問題

1. `AvatarList` 的 runtime props 有哪些？`.d.ts` 漏掉了哪些？
2. list item 實際會被讀取哪些欄位？
3. `currentList` 如何根據 `max` 產生？
4. 未傳 `max` 時，列表和 excess 會如何表現？
5. `Tooltip` 的出現條件是什麼？
6. `extra` 和 `excess` 的優先序是什麼？
7. `avatar-list.less` 如何實作頭像重疊？
8. `small`、`default`、`large` 的重疊距離有什麼不同？
