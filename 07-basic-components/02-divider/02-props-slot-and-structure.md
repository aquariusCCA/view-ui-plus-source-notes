# Divider Props Slot And Structure：從 props 與 slot 到 DOM 結構

## 0. 原始筆記問題分析

原本筆記已經指出 `Divider` 的重點是方向、文字位置、slot 與 class 組合，但還沒有把這些概念拆成可閱讀的 runtime 流程。對初學者來說，`Divider` 容易被看成「只有一條線」，因此忽略 default slot 其實會改變 DOM 結構與 class 組合。

這篇筆記會聚焦 `src/components/divider/divider.vue`，用它建立一套閱讀低互動結構型元件的方法：先看 public props，再看 slot 判斷，最後看輸出的 DOM 形狀。

---

## 1. 本章定位

本章是一篇 runtime source 閱讀筆記，專門分析 `Divider` 的 props 與 default slot 如何變成 DOM 結構與 class binding。它不細講每個 less 規則，樣式細節會放到 `03-class-and-style.md`。

讀完後，應該能回答：

1. `type`、`orientation`、`dashed`、`size`、`plain` 分別控制什麼。
2. `hasSlot` 如何決定是否渲染內層文字節點。
3. `Divider` 在有 slot 與沒有 slot 時的 DOM 有什麼不同。
4. 為什麼 `orientation` 需要搭配 default slot 才有主要意義。

---

## 2. 學習前先建立的基本觀念

很多低互動元件都可以用同一條線理解：

```txt
public props / slot
  -> computed class
  -> template output
  -> CSS rule
```

`Divider` 是這條線很清楚的例子。它沒有 methods，沒有 emits，也沒有內部資料狀態。所有 runtime 邏輯集中在三個 computed：

```txt
hasSlot
classes
slotClasses
```

因此閱讀 `Divider` 時，不需要尋找複雜事件流程，而是要觀察「哪些輸入會影響結構，哪些輸入只影響 class」。

---

## 3. Runtime Overview

`Divider` 的 template 如下：

```vue
<div :class="classes">
    <span v-if="hasSlot" :class="slotClasses">
        <slot></slot>
    </span>
</div>
```

這個結構代表三件事。

第一，`Divider` 固定輸出根 `div`。不論水平或垂直，根節點都由 `classes` 決定具體視覺形態。

第二，內層 `span` 不是永遠存在。只有 `hasSlot` 為 true 時，才會渲染 `ivu-divider-inner-text`。

第三，文字內容完全來自 default slot。`Divider` 沒有 `text` prop，也沒有命名 slot。

---

## 4. Props Contract

`Divider` 的 runtime props 如下：

| Prop | Runtime Type | Default | Validator | 責任 |
| --- | --- | --- | --- | --- |
| `type` | `String` | `horizontal` | `horizontal / vertical` | 決定水平或垂直分隔線。 |
| `orientation` | `String` | `center` | `left / right / center` | 決定帶文字分隔線的文字位置。 |
| `dashed` | `Boolean` | `false` | 無 | 是否使用虛線樣式。 |
| `size` | 無明確 type | `default` | `small / default` | 影響分隔線尺寸樣式，主要體現在帶文字情境。 |
| `plain` | `Boolean` | `false` | 無 | 讓帶文字分隔線文字回到普通正文樣式。 |

這五個 props 可以分成三組。

`type` 是結構方向控制。它決定根節點會出現 `ivu-divider-horizontal` 或 `ivu-divider-vertical`。官方範例中，帶文字用法都搭配水平分隔線；垂直分隔線主要用在行內文字或連結之間。

`orientation` 是 slot 位置控制。它只有在 default slot 存在時，才會透過 `with-text-*` class 對畫面產生主要影響，而且這套文字位置樣式主要對水平帶文字分隔線有意義。

`dashed`、`size`、`plain` 是視覺修飾控制。它們主要把狀態交給 less，讓樣式層決定線條與文字如何呈現。

---

## 5. Slot 判斷規則

`hasSlot` computed 很短：

```js
hasSlot() {
    return !!this.$slots.default;
}
```

它負責判斷使用者是否傳入 default slot。這個布林值會同時影響兩件事。

第一，影響 template 是否渲染 inner text：

```vue
<span v-if="hasSlot" :class="slotClasses">
    <slot></slot>
</span>
```

第二，影響 root class 是否加上文字相關 class：

```js
{
    [`${prefixCls}-with-text`]: this.hasSlot && this.orientation === 'center',
    [`${prefixCls}-with-text-${this.orientation}`]: this.hasSlot
}
```

所以 `hasSlot` 是 `Divider` 的關鍵分岔點。沒有 slot 時，它是純線條元件；有 slot 時，它變成帶文字的分隔結構。

---

## 6. Class 映射規則

`classes` computed 回傳一個 Vue class binding 支援的陣列：

```js
[
    `${prefixCls}`,
    `${prefixCls}-${this.type}`,
    `${prefixCls}-${this.size}`,
    {
        [`${prefixCls}-with-text`]: this.hasSlot && this.orientation === 'center',
        [`${prefixCls}-with-text-${this.orientation}`]: this.hasSlot,
        [`${prefixCls}-dashed`]: !!this.dashed,
        [`${prefixCls}-plain`]: this.plain
    }
]
```

其中 `prefixCls` 固定是：

```js
const prefixCls = 'ivu-divider';
```

對應結果如下。

| 使用方式 | 產生的主要 class | 說明 |
| --- | --- | --- |
| `<Divider />` | `ivu-divider ivu-divider-horizontal ivu-divider-default` | 普通水平分隔線。 |
| `<Divider type="vertical" />` | `ivu-divider ivu-divider-vertical ivu-divider-default` | 垂直分隔線。 |
| `<Divider>Text</Divider>` | `ivu-divider-with-text ivu-divider-with-text-center` | 有 slot 且置中。 |
| `<Divider orientation="left">Text</Divider>` | `ivu-divider-with-text-left` | 有 slot 且文字靠左。 |
| `<Divider dashed />` | `ivu-divider-dashed` | 加上虛線修飾。 |
| `<Divider plain>Text</Divider>` | `ivu-divider-plain` | 加上普通文字樣式修飾。 |

需要注意的是，`ivu-divider-with-text` 只會在 `orientation === 'center'` 時出現，但 `ivu-divider-with-text-center` 只要有 slot 且 orientation 是 center 就會出現。less 兩種 class 都有用到，因此閱讀時不能只看其中一個。

---

## 7. DOM 輸出情境

### 7.1 普通水平線

輸入：

```vue
<Divider />
```

概念上的輸出：

```html
<div class="ivu-divider ivu-divider-horizontal ivu-divider-default"></div>
```

這種情境沒有內層 `span`，線條視覺完全交給根節點 class 與 less。

### 7.2 帶文字水平線

輸入：

```vue
<Divider>iView</Divider>
```

概念上的輸出：

```html
<div class="ivu-divider ivu-divider-horizontal ivu-divider-default ivu-divider-with-text ivu-divider-with-text-center">
    <span class="ivu-divider-inner-text">iView</span>
</div>
```

這裡的重點是，文字不會直接放在根節點下的裸文字位置，而是被包進 `ivu-divider-inner-text`。這讓 less 可以控制文字 padding，並用根節點 pseudo-elements 畫出左右線。

### 7.3 左側文字

輸入：

```vue
<Divider orientation="left">iView</Divider>
```

概念上的輸出：

```html
<div class="ivu-divider ivu-divider-horizontal ivu-divider-default ivu-divider-with-text-left">
    <span class="ivu-divider-inner-text">iView</span>
</div>
```

這裡不會出現 `ivu-divider-with-text`，因為那個 class 只給 center 情境使用。左側位置主要由 `ivu-divider-with-text-left` 對應的 less 規則處理。

### 7.4 垂直線

輸入：

```vue
<Divider type="vertical" />
```

概念上的輸出：

```html
<div class="ivu-divider ivu-divider-vertical ivu-divider-default"></div>
```

官方範例把垂直分隔線放在行內文字與連結之間。這也說明 `vertical` 的定位不是頁面段落分隔，而是行內元素之間的視覺間隔。

---

## 8. Runtime 與 Type 的小差異

`types/divider.d.ts` 中 `size` 的型別是：

```ts
size?: string;
```

但 runtime validator 實際只接受：

```js
oneOf(value, ['small', 'default'])
```

這代表型別宣告比 runtime 寬。寫筆記時不應只停在 `string`，而要補充 runtime 的真實限制：目前可預期的值是 `small` 與 `default`。

---

## 9. 常見誤區

| 誤區 | 正確理解 |
| --- | --- |
| `orientation` 是獨立控制分隔線方向 | `orientation` 控制的是帶文字水平分隔線的文字位置，不是水平 / 垂直方向。 |
| 垂直分隔線也適合放文字 slot | runtime 會渲染 slot，但官方範例與 less 主線都把文字位置樣式放在水平分隔線情境。 |
| 有 `orientation` 就一定會渲染文字結構 | 只有 default slot 存在時才會渲染 `ivu-divider-inner-text`。 |
| `Divider` 需要事件處理 | 這個元件不主動處理互動語意，主要負責視覺分隔。 |
| `plain` 是另一種線條類型 | `plain` 主要改文字樣式，線條位置仍由其他 class 決定。 |

---

## 10. 本章總結

`Divider` 的 runtime source 很短，但它完整示範了一個低互動結構型元件的設計方式。public props 決定方向與視覺修飾，default slot 決定是否進入帶文字結構，computed class 把這些狀態轉成 `ivu-divider-*` class，最後交給 less 實作視覺效果。

理解這一層後，下一步就可以進入 `03-class-and-style.md`，對照每個 class 在 `divider.less` 中如何產生水平線、垂直線、虛線與帶文字線。

---

## 11. 自我檢查問題

1. `Divider` 有哪些 public props？它們各自控制什麼？
2. `hasSlot` 為 true 時，template 和 class 會發生哪些變化？
3. 為什麼 `orientation="left"` 必須搭配 slot 才有主要視覺效果？
4. `ivu-divider-with-text` 和 `ivu-divider-with-text-left` 的出現條件有什麼不同？
5. `types/divider.d.ts` 與 runtime validator 對 `size` 的描述有什麼差異？
