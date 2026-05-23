# Badge Public Contract And Display Rules：從 props 到顯示優先序

## 0. 原始筆記問題分析

原本筆記已經指出要整理 `count`、`dot`、`status` 與 slot override，但還沒有把 runtime props、`.d.ts`、template branch 與 computed 顯示條件放在同一張圖裡。

`Badge` 是很適合練習展示規則對照的元件，因為它同時包含：

1. 數字型角標：`count`、`overflowCount`、`showZero`。
2. 文字型覆蓋：`text`、`#text`。
3. 自訂角標內容：`#count`。
4. 互斥模式：`dot`、`status || color`、一般 count。
5. 樣式修飾：`type`、`className`、`offset`。

## 1. 本章定位

本章是一篇 public API 與顯示規則對照筆記，專門分析 `Badge` 對外可以接收哪些 props / slots，以及這些輸入如何決定畫面內容。

本章不深入講 CSS 定位與狀態色實作。class、style、less 對照會放到 `03-class-style-and-position.md`。

## 2. Runtime Props 對照表

`badge.vue` 自身宣告的 props 如下。

| Runtime prop | Runtime 限制 / default | Type declaration | 閱讀重點 |
| --- | --- | --- | --- |
| `count` | `Number` | `count?: number` | 一般數字角標內容；0 預設隱藏。 |
| `dot` | `Boolean`，預設 `false` | `dot?: boolean` | 啟用 dot branch，不顯示數字。 |
| `overflowCount` | `Number` 或 `String`，預設 `99` | `'overflow-count'?: number \| string` | `count >= overflowCount` 時顯示 `${overflowCount}+`。 |
| `className` | `String` | `'class-name'?: string` | 只會加到一般 count / custom count 的 `sup`，dot 模式下無效。 |
| `showZero` | `Boolean`，預設 `false` | `'show-zero'?: boolean` | 讓 `count=0` 時仍可顯示角標。 |
| `text` | `String`，預設 `''` | `text?: string` | 一般模式覆蓋 `finalCount`；status 模式作為狀態文字。 |
| `status` | `success`、`processing`、`default`、`error`、`warning` | status union | 啟用 status branch，顯示 inline 狀態點。 |
| `type` | `success`、`primary`、`normal`、`error`、`warning`、`info` | type union | 只影響一般 count badge 的 `ivu-badge-count-{type}`。 |
| `offset` | `Array` | `offset?: any[]` | 長度為 2 時轉成 `margin-top` / `margin-right`。 |
| `color` | `String` | `color?: string` | 啟用 status branch；內建色走 class，自訂色走 inline style。 |

這張表最重要的是：`Badge` 的 props 都是展示輸入，沒有任何 prop 會建立互動狀態或 emit 事件。

## 3. Props 分組理解

`Badge` 的 props 可以分成四組。

| 分組 | Props | 責任 |
| --- | --- | --- |
| 模式選擇 | `dot`、`status`、`color` | 決定 template branch。 |
| 內容輸入 | `count`、`overflowCount`、`showZero`、`text` | 決定一般 count 或 status text 的內容與可見性。 |
| 樣式修飾 | `type`、`className`、`offset` | 修飾一般 count badge 或角標位置。 |
| slot override | `#count`、`#text`、default slot | 覆蓋角標內容，或提供被角標附著的內容。 |

這個分組比照 props 順序背誦更有用。閱讀 template 時，應先判斷模式，再判斷內容，最後才判斷樣式。

## 4. Template Branch 優先序

`Badge` 的 template 是三段互斥分支：

```vue
<span v-if="dot" :class="classes" ref="badge">
    <slot></slot>
    <sup :class="dotClasses" :style="styles" v-show="badge"></sup>
</span>
<span v-else-if="status || color" :class="classes" class="ivu-badge-status" ref="badge">
    <span :class="statusClasses" :style="statusStyles"></span>
    <span class="ivu-badge-status-text"><slot name="text">{{ text }}</slot></span>
</span>
<span v-else :class="classes" ref="badge">
    <slot></slot>
    <sup v-if="$slots.count" :style="styles" :class="customCountClasses"><slot name="count"></slot></sup>
    <sup v-else-if="hasCount" :style="styles" :class="countClasses" v-show="badge"><slot name="text">{{ finalCount }}</slot></sup>
</span>
```

優先序可以整理成：

```txt
dot === true
  -> dot branch
else if status || color
  -> status branch
else
  -> count branch
```

因此幾個組合要特別注意：

| 組合 | 實際結果 |
| --- | --- |
| `dot status="success"` | 進入 dot branch，status 不會使用。 |
| `dot color="blue"` | 進入 dot branch，color 不會使用。 |
| `color="blue"` 且無 `status` | 進入 status branch。 |
| `status="success"` 且有 default slot | status branch 不渲染 default slot。 |
| 沒有 `dot/status/color` | 才會進入一般 count branch。 |

這是閱讀 `Badge` 最重要的規則：很多 prop 不是疊加效果，而是被 template branch 擋掉。

## 5. Count Branch 的顯示規則

一般 count branch 內還有一層 slot 優先序：

```txt
有 #count
  -> 渲染 custom count sup，數值 count 無效
沒有 #count，但 hasCount
  -> 渲染一般 count sup，內容可由 #text 覆蓋
其他
  -> 不渲染角標 sup
```

`#count` 和 `#text` 的差異如下。

| Slot | 覆蓋層次 | 樣式結果 |
| --- | --- | --- |
| `#count` | 覆蓋整個角標內容 | 使用 `ivu-badge-count ivu-badge-count-custom`，背景、邊框、陰影會被取消。 |
| `#text` | 只覆蓋一般 count 的文字內容 | 仍使用 `ivu-badge-count` 背景與定位。 |

官方範例中：

```vue
<Badge>
    <template #count>
        <Icon type="md-time" size="16" color="#ff6600" />
    </template>
    <a href="#" class="demo-badge"></a>
</Badge>
```

這會走 custom count，不會使用 numeric `count`。

另一個範例：

```vue
<Badge :count="count">
    <a href="#" class="demo-badge"></a>
    <template #text>
        <span>hhh</span>
    </template>
</Badge>
```

這仍然渲染一般 `ivu-badge-count`，只是裡面的文字由 `#text` 接管。

## 6. `finalCount` 規則

`finalCount` computed 先看 `text`，再看 `count` 是否封頂：

```js
finalCount () {
    if (this.text !== '') return this.text;
    return parseInt(this.count) >= parseInt(this.overflowCount) ? `${this.overflowCount}+` : this.count;
}
```

整理成表格：

| 輸入 | `finalCount` |
| --- | --- |
| `text="new"` | `new` |
| `count=5`、`overflowCount=99` | `5` |
| `count=99`、`overflowCount=99` | `99+` |
| `count=100`、`overflowCount=99` | `99+` |

這裡要注意 source 使用的是 `>=`，所以等於 `overflowCount` 時已經會顯示加號。

## 7. `badge` 與 `hasCount`

`badge` computed 決定角標是否透過 `v-show` 顯示：

```js
badge () {
    let status = false;

    if (this.count) {
        status = !(parseInt(this.count) === 0);
    }

    if (this.dot) {
        status = true;
        if (this.count !== null) {
            if (parseInt(this.count) === 0) {
                status = false;
            }
        }
    }

    if (this.text !== '') status = true;

    return status || this.showZero;
}
```

`hasCount` computed 決定一般 count branch 是否渲染 `sup`：

```js
hasCount () {
    if (this.count || this.text !== '') return true;
    if (this.showZero && parseInt(this.count) === 0) return true;
    else return false;
}
```

兩者分工如下。

| Computed | 責任 |
| --- | --- |
| `hasCount` | 決定一般 count branch 是否建立 `sup` 節點。 |
| `badge` | 決定已建立的角標是否顯示。 |

常見情境：

| 輸入 | `hasCount` | `badge` | 畫面 |
| --- | --- | --- | --- |
| 無 `count`、無 `text` | `false` | `false` | 不渲染 count `sup`。 |
| `count=0` | `false` | `false` | 不渲染 count `sup`。 |
| `count=0 showZero` | `true` | `true` | 顯示 `0`。 |
| `count=5` | `true` | `true` | 顯示 `5`。 |
| `text="hot"` | `true` | `true` | 顯示 `hot`。 |
| `dot` 無 `count` | 不使用 | `true` | 顯示 dot。 |
| `dot :count="0"` | 不使用 | `false` | dot 節點存在但被 `v-show` 隱藏。 |

`dot` 的註解說「如需隱藏 dot，需要設置 `count` 為 0」，對應的就是 `badge` 裡的 dot 分支。

## 8. Status Branch 的內容規則

status branch 由 `status || color` 啟用：

```vue
<span :class="classes" class="ivu-badge-status" ref="badge">
    <span :class="statusClasses" :style="statusStyles"></span>
    <span class="ivu-badge-status-text"><slot name="text">{{ text }}</slot></span>
</span>
```

它和一般 count branch 有三個差異。

第一，status branch 不渲染 default slot。`Badge status="success"` 是一個 inline 狀態點，不是包住內容的右上角角標。

第二，文字只來自 `#text` 或 `text`。如果兩者都沒有，仍然會渲染 status dot，只是後面的 text span 內容為空。

第三，`color` 不是一般角標背景色，而是 status dot 的顏色來源。

`statusClasses` 會在兩種情況下產生 class：

```txt
status -> ivu-badge-status-{status}
內建 color -> ivu-badge-status-{color}
```

非內建 `color` 則由 `statusStyles` 寫入：

```js
{ backgroundColor: this.color }
```

## 9. Public Contract 常見誤區

| 誤區 | 正確理解 |
| --- | --- |
| `Badge` 是互動元件 | `Badge` 沒有 emits，也沒有 click handler；它只展示。 |
| `dot` 可以和 `status` 疊加 | `dot` 是第一個 template branch，會擋掉 status branch。 |
| `color` 是 count badge 的背景色 | `color` 會啟用 status branch，設定 status dot 顏色。 |
| `type` 能影響 status dot | `type` 只用在一般 count badge 的 `countClasses`。 |
| `text` 只是 status 文案 | `text` 在一般 count branch 也會覆蓋數字。 |
| `#count` 只是改文字 | `#count` 會覆蓋整個角標內容並使用 custom count 樣式。 |
| `overflowCount=99` 時 count 只有大於 99 才加號 | source 使用 `>=`，所以 `count=99` 也會顯示 `99+`。 |

## 10. 本章總結

`Badge` 的 public contract 要同時看 props、slots、template branch 與 computed。最核心的閱讀順序是先判斷模式，再判斷 slot override，最後判斷 count 是否存在與是否顯示。

最值得記住的是三個優先序：`dot` 優先於 `status/color`，`status/color` 優先於一般 count，`#count` 優先於 numeric `count`。

## 11. 自我檢查問題

1. `Badge` 的 props 可以分成哪四組？
2. `dot` 和 `status` 同時存在時，哪一個生效？
3. `color="blue"` 為什麼會進入 status branch？
4. `#count` 和 `#text` 在一般 count branch 的差異是什麼？
5. `count=99`、`overflowCount=99` 時，`finalCount` 是什麼？
6. `count=0 showZero` 為什麼能渲染並顯示角標？
