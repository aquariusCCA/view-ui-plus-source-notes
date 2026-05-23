# Divider Props、Slot 與 DOM 結構：從輸入條件到畫面骨架

## 0. 原始筆記問題分析

這份原始筆記已經掌握了 `Divider` 的主要閱讀方向：它的核心不在事件處理，而在於 `props`、default slot、computed class 與 DOM 結構之間的對應關係。原始內容也已經指出 `Divider` 是一個低互動、偏結構型的元件，這個判斷是正確的。

不過，如果要把它整理成適合長期複習的教材型筆記，還可以再補強幾個面向。

第一，原始筆記雖然列出 `type`、`orientation`、`dashed`、`size`、`plain` 的功能，但仍偏向 API 說明。對第一次閱讀元件原始碼的人來說，更重要的是理解這些 props 如何進入 computed，最後如何變成 `ivu-divider-*` class。

第二，default slot 的影響需要被放大說明。`Divider` 是否有 default slot，並不只是「有沒有文字」的差別，而是會直接改變 template 是否產生內層 `span`，也會改變根節點是否出現 `with-text` 相關 class。這是本章最重要的 runtime 分岔點。

第三，`orientation` 容易被誤解成控制水平或垂直方向。實際上，水平或垂直由 `type` 控制；`orientation` 控制的是「帶文字分隔線」中文字相對於線條的位置。因此，`orientation` 必須放在 slot 情境下理解。

第四，原始筆記已經提到 `types/divider.d.ts` 與 runtime validator 對 `size` 的差異，但可以再補充它對閱讀元件庫的啟發：閱讀元件時不能只看型別宣告，也不能只看 runtime source；兩者需要交叉驗證，才能確認真正的 public API 邊界。

因此，本章會將原始內容重構成一條更清楚的閱讀線：

```txt
public props
  -> default slot 判斷
  -> computed class
  -> template output
  -> DOM 結構情境
  -> style source 的下一步閱讀
```

---

## 1. 筆記類型與本章定位

本章屬於 **原始碼閱讀筆記**，主題是 `View UI Plus` 的 `Divider` 分隔線元件。它聚焦在 `src/components/divider/divider.vue` 的 runtime 實作，目標不是逐行分析 Less 樣式，而是先建立 `Divider` 的「結構輸出模型」。

讀完本章後，你應該能回答以下問題：

1. `Divider` 有哪些 public props？
2. `type` 和 `orientation` 的責任差異是什麼？
3. default slot 如何影響 DOM 結構？
4. `hasSlot` 為什麼是 `Divider` 的關鍵分岔點？
5. `classes` 如何把 props 與 slot 狀態轉成 `ivu-divider-*` class？
6. 為什麼 `Divider` 的 runtime source 很短，但仍然不能只用「一條線」理解？
7. 下一步閱讀 `divider.less` 時，應該追蹤哪些 class？

本章暫時不深入說明 `divider.less` 的每一條 CSS 規則。樣式細節應放到下一篇 `03-class-and-style.md` 中，專門分析水平線、垂直線、帶文字線、虛線與 `plain` 樣式如何實作。

---

## 2. 學習前先建立的基本觀念

### 2.1 `Divider` 是低互動結構型元件

`Divider` 和 `Button`、`Input`、`Select` 這類元件不同。它沒有複雜的使用者互動，也不需要維護輸入狀態，更不需要處理 `click`、`focus`、`blur`、`change` 這類事件流程。

它的任務比較單純：根據使用者傳入的 props 和 slot，輸出一組正確的 DOM 結構與 class，最後把視覺呈現交給 CSS。

因此，閱讀 `Divider` 時，不應該先找 methods 或事件，而應該先看：

```txt
props 是什麼？
slot 有沒有存在？
computed class 怎麼組？
template 最後輸出什麼？
```

這種元件很適合拿來練習「從 public API 推回 runtime 結構」的閱讀方式。

### 2.2 低互動元件的常見閱讀模型

很多低互動元件都可以用以下流程理解：

```txt
使用者輸入
  -> props / slot
  -> computed 狀態
  -> class binding
  -> template output
  -> CSS 視覺效果
```

套到 `Divider` 上，就是：

```txt
<Divider dashed orientation="left">Text</Divider>
  -> dashed = true，orientation = left，有 default slot
  -> hasSlot = true
  -> classes 加上 ivu-divider-dashed、ivu-divider-with-text-left
  -> template 渲染根 div 與內層 span
  -> divider.less 根據 class 畫出帶文字的虛線分隔線
```

這條線可以幫你避免只記 API，而是理解 API 如何落到畫面。

### 2.3 哪些輸入影響結構？哪些輸入只影響樣式？

閱讀元件時，最好先分辨「結構控制」和「樣式控制」。

| 類型 | 來源 | 影響 |
| --- | --- | --- |
| 結構控制 | default slot | 決定是否渲染內層 `span`。 |
| 方向控制 | `type` | 決定根節點是水平分隔線還是垂直分隔線。 |
| 文字位置控制 | `orientation` | 在有 slot 時，決定文字靠左、置中或靠右。 |
| 視覺修飾控制 | `dashed`、`size`、`plain` | 加上修飾 class，實際效果交給 Less。 |

這張表的重點是：不是每個 prop 都會改變 DOM 結構。多數 props 只是改變 class，再由樣式層決定畫面。

---

## 3. Runtime Overview：`divider.vue` 的整體形狀

`Divider` 的 template 很短：

```vue
<div :class="classes">
    <span v-if="hasSlot" :class="slotClasses">
        <slot></slot>
    </span>
</div>
```

這段 template 可以拆成三個觀察重點。

### 3.1 根節點永遠存在

不論是水平線、垂直線、虛線、帶文字分隔線，`Divider` 都會先輸出一個根 `div`。這個根 `div` 的實際外觀不是寫死在 template 裡，而是由 `classes` computed 決定。

換句話說，template 負責提供「骨架」，computed class 負責描述「狀態」，Less 負責產生「視覺」。

### 3.2 內層 `span` 只在有 default slot 時存在

內層 `span` 有 `v-if="hasSlot"`。這代表它不是固定 DOM，而是條件式渲染。

當你寫：

```vue
<Divider />
```

就只會有根節點。

當你寫：

```vue
<Divider>iView</Divider>
```

才會多出內層 `span`，並由 `<slot></slot>` 接收 `iView` 這段文字。

這裡要注意：`Divider` 沒有 `text` prop，也沒有命名 slot。文字內容來自 default slot。

### 3.3 `slotClasses` 專門服務內層文字

內層 `span` 的 class 由 `slotClasses` 提供。從 DOM 情境可以看出，它會對應到文字容器 class，例如：

```html
<span class="ivu-divider-inner-text">iView</span>
```

這個內層 class 的角色是讓樣式層可以控制文字區塊，例如文字的 padding、顯示方式，以及和左右線段之間的間距。真正的細節仍要回到 `divider.less` 中確認。

---

## 4. Props Contract：五個 public props 的責任分工

`Divider` 的 runtime props 可以整理如下：

| Prop | Runtime Type | Default | Validator | 主要責任 |
| --- | --- | --- | --- | --- |
| `type` | `String` | `horizontal` | `horizontal` / `vertical` | 決定水平或垂直分隔線。 |
| `orientation` | `String` | `center` | `left` / `right` / `center` | 決定帶文字分隔線的文字位置。 |
| `dashed` | `Boolean` | `false` | 無 | 是否啟用虛線樣式。 |
| `size` | 未明確宣告 type | `default` | `small` / `default` | 決定尺寸相關樣式，主要用於帶文字情境。 |
| `plain` | `Boolean` | `false` | 無 | 讓帶文字分隔線的文字呈現較普通的正文樣式。 |

這五個 props 可以分成三組理解。

### 4.1 `type`：控制分隔線方向

`type` 是最基本的方向控制，它決定根節點會得到哪一種方向 class：

```txt
type = horizontal -> ivu-divider-horizontal
type = vertical   -> ivu-divider-vertical
```

`horizontal` 通常用在區塊和區塊之間，例如文章段落、區塊標題、表單區段。

`vertical` 通常用在行內元素之間，例如文字連結或操作按鈕之間的分隔。

這裡容易混淆的是：`type` 才是控制水平 / 垂直的 prop；`orientation` 不是。

### 4.2 `orientation`：控制帶文字分隔線的文字位置

`orientation` 的預設值是 `center`，可選值是 `left`、`right`、`center`。它的作用不是改變分隔線方向，而是決定「當分隔線有文字時，文字位於線條的哪一側」。

例如：

```vue
<Divider orientation="left">Title</Divider>
```

這表示文字靠左，而不是分隔線變成左側線。

更精確地說，`orientation` 需要搭配 default slot 才有主要視覺意義。沒有 slot 時，`Divider` 不會渲染內層文字節點，自然也沒有文字位置可以調整。

### 4.3 `dashed`、`size`、`plain`：視覺修飾 props

`dashed`、`size`、`plain` 都比較偏向樣式修飾。

| Prop | 修飾方向 | 閱讀重點 |
| --- | --- | --- |
| `dashed` | 線條樣式 | 會加上 `ivu-divider-dashed`，通常讓實線變成虛線。 |
| `size` | 尺寸樣式 | 會加上 `ivu-divider-small` 或 `ivu-divider-default`。 |
| `plain` | 文字樣式 | 會加上 `ivu-divider-plain`，主要影響帶文字分隔線中的文字呈現。 |

這些 props 在 runtime 層通常只負責產生 class，不直接處理 CSS 細節。要理解最終效果，需要進一步閱讀 `divider.less`。

---

## 5. Slot 判斷：`hasSlot` 是 runtime 的關鍵分岔點

`Divider` 的 slot 判斷非常短：

```js
hasSlot() {
    return !!this.$slots.default;
}
```

這段邏輯看起來簡單，但它是整個 `Divider` runtime 的核心分岔點。

### 5.1 `hasSlot` 決定是否渲染內層文字節點

template 中使用：

```vue
<span v-if="hasSlot" :class="slotClasses">
    <slot></slot>
</span>
```

所以：

```txt
hasSlot = false -> 不渲染 span，只剩根 div
hasSlot = true  -> 渲染 span，並把 default slot 內容放進去
```

這代表 default slot 不只是「內容」而已，它也改變了 DOM 結構。

### 5.2 `hasSlot` 決定是否加入文字分隔線 class

`classes` 中也會使用 `hasSlot`：

```js
{
    [`${prefixCls}-with-text`]: this.hasSlot && this.orientation === 'center',
    [`${prefixCls}-with-text-${this.orientation}`]: this.hasSlot
}
```

這裡可以看出，只要有 default slot，就會加上：

```txt
ivu-divider-with-text-left
ivu-divider-with-text-right
ivu-divider-with-text-center
```

其中哪一個會出現，取決於 `orientation`。

如果 `orientation === 'center'`，還會額外出現：

```txt
ivu-divider-with-text
```

因此，`hasSlot` 同時影響：

1. DOM 是否多出內層 `span`。
2. root class 是否多出 `with-text` 系列 class。

這也是為什麼閱讀 `Divider` 時要特別盯住 `hasSlot`，它是從「普通線條」切換到「帶文字分隔線」的關鍵。

---

## 6. Class 映射規則：props 與 slot 如何轉成 `ivu-divider-*`

`Divider` 的 class prefix 固定是：

```js
const prefixCls = 'ivu-divider';
```

`classes` computed 回傳 Vue class binding 支援的陣列：

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

這段程式碼的閱讀重點是：它不是把所有 class 都寫死，而是根據 props 與 slot 狀態組合 class。

### 6.1 固定 class

不論任何情境，都會有：

```txt
ivu-divider
```

這是元件的基礎 class，通常用來承接元件的共用樣式。

### 6.2 方向 class

方向 class 由 `type` 決定：

```txt
ivu-divider-horizontal
ivu-divider-vertical
```

這一層會讓樣式知道它要畫水平線還是垂直線。

### 6.3 尺寸 class

尺寸 class 由 `size` 決定：

```txt
ivu-divider-default
ivu-divider-small
```

雖然 `size` 是尺寸控制，但具體影響哪些 CSS 屬性，需要到 `divider.less` 中確認。根據原始筆記脈絡，`small` 主要體現在帶文字分隔線的字級與 margin。

### 6.4 文字 class

文字 class 由 `hasSlot` 與 `orientation` 共同決定：

```txt
hasSlot = true, orientation = center
  -> ivu-divider-with-text
  -> ivu-divider-with-text-center

hasSlot = true, orientation = left
  -> ivu-divider-with-text-left

hasSlot = true, orientation = right
  -> ivu-divider-with-text-right
```

這裡有一個非常重要的細節：`ivu-divider-with-text` 只在 `orientation === 'center'` 時出現，但 `ivu-divider-with-text-center` 只要有 slot 且 orientation 是 `center` 也會出現。

換句話說，center 情境會同時出現兩個文字相關 class。閱讀 Less 時不能只找其中一個，否則容易漏掉樣式來源。

### 6.5 修飾 class

修飾 class 由布林 props 決定：

```txt
dashed = true -> ivu-divider-dashed
plain = true  -> ivu-divider-plain
```

它們不改變 DOM 結構，而是讓樣式層切換視覺呈現。

---

## 7. `slotClasses`：內層文字節點的 class

`slotClasses` 對應的是內層 `span` 的 class。概念上，它會讓 DOM 形成：

```html
<span class="ivu-divider-inner-text">Text</span>
```

這個 class 的責任和 root class 不同。

root class 用來描述整個 `Divider` 的狀態，例如方向、是否虛線、文字位置。

內層文字 class 則專門描述 slot 文字本身，例如：

1. 文字如何排版。
2. 文字與左右線段之間是否有間距。
3. 帶文字分隔線中，文字區塊如何和 pseudo-elements 配合。

由於這些效果主要由樣式實作，所以這裡只需要先建立角色分工：`slotClasses` 不是控制整條線，而是控制 slot 文字容器。

---

## 8. DOM 輸出情境：從寫法推導實際結構

這一節用幾個常見寫法，推導 `Divider` 會產生哪些主要 class 與 DOM 結構。這裡的 HTML 是概念化輸出，用來輔助理解，不一定等同於瀏覽器中完整的渲染結果。

### 8.1 普通水平分隔線

使用方式：

```vue
<Divider />
```

概念輸出：

```html
<div class="ivu-divider ivu-divider-horizontal ivu-divider-default"></div>
```

這是最基本的分隔線。因為沒有 default slot，所以不會渲染內層 `span`，也不會出現 `with-text` 相關 class。

這種情境可以理解成：`Divider` 只提供一條純線條，所有視覺效果都由根節點 class 對應的 Less 規則決定。

### 8.2 帶文字的置中分隔線

使用方式：

```vue
<Divider>iView</Divider>
```

概念輸出：

```html
<div class="ivu-divider ivu-divider-horizontal ivu-divider-default ivu-divider-with-text ivu-divider-with-text-center">
    <span class="ivu-divider-inner-text">iView</span>
</div>
```

這個情境最能看出 default slot 的影響。

首先，`hasSlot` 變成 true，所以 template 會渲染內層 `span`。

其次，因為 `orientation` 預設是 `center`，所以 root class 會同時加上：

```txt
ivu-divider-with-text
ivu-divider-with-text-center
```

最後，`divider.less` 會根據這些 class 畫出文字左右兩側的線段。根據原始筆記脈絡，帶文字線通常會透過 pseudo-elements，例如 `:before` 與 `:after`，處理左右線段。

### 8.3 帶文字且文字靠左

使用方式：

```vue
<Divider orientation="left">iView</Divider>
```

概念輸出：

```html
<div class="ivu-divider ivu-divider-horizontal ivu-divider-default ivu-divider-with-text-left">
    <span class="ivu-divider-inner-text">iView</span>
</div>
```

這個情境要注意：它不會出現 `ivu-divider-with-text`，因為 `ivu-divider-with-text` 只在 `orientation === 'center'` 時加上。

靠左文字主要由：

```txt
ivu-divider-with-text-left
```

交給 Less 處理。

### 8.4 帶文字且文字靠右

使用方式：

```vue
<Divider orientation="right">iView</Divider>
```

概念輸出：

```html
<div class="ivu-divider ivu-divider-horizontal ivu-divider-default ivu-divider-with-text-right">
    <span class="ivu-divider-inner-text">iView</span>
</div>
```

這和靠左情境類似，差別只是 `orientation` 變成 `right`，因此 class 變成 `ivu-divider-with-text-right`。

### 8.5 虛線分隔線

使用方式：

```vue
<Divider dashed />
```

概念輸出：

```html
<div class="ivu-divider ivu-divider-horizontal ivu-divider-default ivu-divider-dashed"></div>
```

`dashed` 不會新增 DOM，只會新增 `ivu-divider-dashed` class。實際上如何把實線改成虛線，需要到 Less 中看對應規則。

如果搭配文字：

```vue
<Divider dashed>iView</Divider>
```

概念上會同時出現文字相關 class 與虛線 class：

```html
<div class="ivu-divider ivu-divider-horizontal ivu-divider-default ivu-divider-with-text ivu-divider-with-text-center ivu-divider-dashed">
    <span class="ivu-divider-inner-text">iView</span>
</div>
```

這說明 `Divider` 的 class 是可以疊加的：方向、尺寸、文字、虛線、plain 都是不同維度的狀態。

### 8.6 `plain` 帶文字分隔線

使用方式：

```vue
<Divider plain>iView</Divider>
```

概念輸出：

```html
<div class="ivu-divider ivu-divider-horizontal ivu-divider-default ivu-divider-with-text ivu-divider-with-text-center ivu-divider-plain">
    <span class="ivu-divider-inner-text">iView</span>
</div>
```

`plain` 的命名容易讓人以為它是另一種線條模式，但從 runtime 來看，它只是加上 `ivu-divider-plain` class。根據原始筆記說明，它主要讓帶文字分隔線的文字變成普通正文樣式。

### 8.7 垂直分隔線

使用方式：

```vue
<Divider type="vertical" />
```

概念輸出：

```html
<div class="ivu-divider ivu-divider-vertical ivu-divider-default"></div>
```

垂直分隔線的定位不是「把頁面切成上下兩段」，而是常用於行內文字、連結或操作項目之間。例如：

```vue
<span>新增</span>
<Divider type="vertical" />
<span>刪除</span>
```

這種情境下，`Divider` 的視覺目標是產生一條短的直線，作為行內項目之間的間隔。

---

## 9. `type` 與 `orientation` 的差異整理

`type` 和 `orientation` 是最容易混淆的兩個 props，可以用下面的表格區分。

| Prop | 控制對象 | 可選值 | 是否需要 slot 才有主要意義 | 說明 |
| --- | --- | --- | --- | --- |
| `type` | 分隔線方向 | `horizontal` / `vertical` | 不需要 | 決定整個分隔線是水平還是垂直。 |
| `orientation` | 文字位置 | `left` / `center` / `right` | 需要 | 決定帶文字分隔線中文字靠左、置中或靠右。 |

一句話記法：

```txt
type 決定線的方向；orientation 決定文字在水平線上的位置。
```

這個區分非常重要，因為很多初學者看到 `orientation` 會直覺以為它是方向控制。但在 `Divider` 裡，真正的水平 / 垂直方向是由 `type` 控制。

---

## 10. Runtime 與 Type Declaration 的交叉閱讀

原始筆記中提到一個很值得注意的地方：`types/divider.d.ts` 中 `size` 的型別是：

```ts
size?: string;
```

但 runtime validator 實際只接受：

```js
oneOf(value, ['small', 'default'])
```

這代表型別宣告比 runtime 約束更寬。

### 10.1 這個差異代表什麼？

從 TypeScript 使用者角度看，`size?: string` 表示任何字串都可能通過型別檢查。

但從 runtime 角度看，`size` 實際上只接受：

```txt
small
default
```

因此，如果使用者寫：

```vue
<Divider size="large">Title</Divider>
```

TypeScript 型別可能不一定阻擋，但 runtime validator 會依元件內部邏輯判斷它不是合法值。

### 10.2 閱讀元件庫時的啟發

這個差異提醒我們：閱讀元件庫時，不要只看單一來源。

| 來源 | 可以確認什麼 | 盲點 |
| --- | --- | --- |
| `types/divider.d.ts` | 對外型別宣告 | 可能比 runtime 寬或不夠精準。 |
| `divider.vue` | runtime 真實限制 | 不一定完整呈現文件想表達的 public API。 |
| 官方範例 | 作者推薦用法 | 不一定覆蓋所有合法組合。 |
| Less 樣式 | 實際視覺效果 | 無法單獨看出 props validator。 |

完整理解一個元件，通常需要把 type、runtime、example、style 互相對照。

---

## 11. 建議閱讀路線

如果你是第一次讀 `Divider` 的 runtime source，可以照以下順序：

### 11.1 第一輪：建立骨架

1. 先看 `props`，確認 public API 有哪些。
2. 再看 template，知道根節點與內層 `span` 的結構。
3. 接著看 `hasSlot`，理解 slot 如何決定內層文字是否出現。
4. 最後看 `classes`，把 props 與 slot 對應到 class。

這一輪的目標不是記住所有 class，而是理解 `Divider` 的 runtime 不處理複雜互動，只負責把輸入轉成結構與 class。

### 11.2 第二輪：追蹤 class

第二輪可以開始追蹤 class：

```txt
ivu-divider
ivu-divider-horizontal
ivu-divider-vertical
ivu-divider-default
ivu-divider-small
ivu-divider-with-text
ivu-divider-with-text-center
ivu-divider-with-text-left
ivu-divider-with-text-right
ivu-divider-dashed
ivu-divider-plain
ivu-divider-inner-text
```

把這些 class 分成幾組：

| 分組 | Class |
| --- | --- |
| 基礎 | `ivu-divider` |
| 方向 | `ivu-divider-horizontal`、`ivu-divider-vertical` |
| 尺寸 | `ivu-divider-default`、`ivu-divider-small` |
| 帶文字 | `ivu-divider-with-text`、`ivu-divider-with-text-center`、`ivu-divider-with-text-left`、`ivu-divider-with-text-right` |
| 修飾 | `ivu-divider-dashed`、`ivu-divider-plain` |
| 文字容器 | `ivu-divider-inner-text` |

這樣進入 `divider.less` 時，就不是盲目找 CSS，而是知道每個 class 的來源和意義。

### 11.3 第三輪：對照官方範例

最後再回到官方範例，觀察不同寫法會觸發哪些 class。這能幫助你把「原始碼閱讀」和「實際使用」接起來。

例如：

```vue
<Divider />
<Divider>iView</Divider>
<Divider dashed />
<Divider orientation="left">iView</Divider>
<Divider orientation="right">iView</Divider>
<Divider type="vertical" />
```

你可以自己練習推導每種寫法最後會出現哪些 class。這是訓練元件庫閱讀能力很有效的方法。

---

## 12. 常見誤區與修正

| 誤區 | 為什麼容易誤解 | 正確理解 |
| --- | --- | --- |
| 以為 `orientation` 控制水平或垂直 | orientation 直譯是方向 | 水平 / 垂直由 `type` 控制；`orientation` 控制帶文字分隔線的文字位置。 |
| 以為有 `orientation` 就一定有文字位置效果 | prop 本身看起來像獨立功能 | 必須有 default slot，才會渲染文字節點與 `with-text-*` class。 |
| 以為 `Divider` 的 DOM 永遠相同 | template 看起來很短 | 有 slot 時會多出內層 `span`，沒有 slot 時只有根 `div`。 |
| 以為 `dashed`、`plain` 會改變結構 | 名稱看起來像模式切換 | 它們主要只是加 class，視覺效果由 Less 決定。 |
| 以為只看 `divider.vue` 就讀完了 | runtime source 很短 | 真正線條如何畫出來，要繼續看 `divider.less`。 |
| 以為 TypeScript 型別就是完整限制 | `size?: string` 看起來很寬 | runtime validator 實際只接受 `small` 和 `default`。 |
| 以為垂直分隔線也適合放文字 | runtime 不一定完全阻擋 slot | 官方範例和樣式主線主要把文字分隔線放在水平情境理解。 |

---

## 13. 資訊不足與後續確認點

根據目前筆記內容，可以確認 `Divider` 的 props、slot 判斷、class 映射與幾種主要 DOM 情境。不過以下細節需要在後續閱讀 `divider.less` 或完整原始碼時繼續確認：

1. `ivu-divider-small` 在 Less 中具體影響哪些 CSS 屬性。
2. `ivu-divider-plain` 是否只影響文字，還是也會影響其他細節。
3. `ivu-divider-with-text` 和 `ivu-divider-with-text-center` 在 Less 中如何分工。
4. `dashed` 在普通水平線、帶文字分隔線與垂直線中的效果是否完全一致。
5. 垂直分隔線搭配 default slot 時，樣式層是否有特別支援或只是自然套用 class。

這些內容不應在本章直接下定論，因為本章主要根據 runtime source 建立結構模型。樣式層的結論應該在 `03-class-and-style.md` 中用 Less 原始碼確認。

---

## 14. 本章總結

`Divider` 是一個很適合練習元件庫原始碼閱讀的低互動元件。它沒有複雜的事件流程，也沒有內部狀態管理，核心邏輯集中在 props、default slot、computed class 與 template output。

本章最重要的理解是：`Divider` 不是單純「畫一條線」而已。它會根據 `type` 決定水平或垂直，根據 default slot 決定是否進入帶文字結構，根據 `orientation` 決定文字位置，並透過 `dashed`、`size`、`plain` 加上不同的視覺修飾 class。

可以用一句話整理它的 runtime 流程：

```txt
Divider 將 props 與 default slot 轉換成 DOM 結構與 ivu-divider-* class，真正的線條樣式再交給 divider.less 實作。
```

理解這一層之後，下一步閱讀 `03-class-and-style.md` 時，就可以帶著明確問題去看 Less：

1. 哪些 class 負責水平線？
2. 哪些 class 負責垂直線？
3. 帶文字分隔線如何用 pseudo-elements 畫出左右線？
4. `dashed`、`plain`、`small` 分別改了哪些樣式？

---

## 15. 自我檢查問題

1. `Divider` 的五個 public props 分別是什麼？各自負責什麼？
2. 為什麼說 `Divider` 是低互動結構型元件？
3. `hasSlot` 的判斷邏輯是什麼？它會影響哪些輸出？
4. 沒有 default slot 時，`Divider` 的 DOM 結構是什麼？
5. 有 default slot 時，`Divider` 會多出哪個節點？這個節點的用途是什麼？
6. `type` 和 `orientation` 的差異是什麼？
7. 為什麼 `orientation="left"` 必須搭配 default slot 才有主要視覺效果？
8. `ivu-divider-with-text` 和 `ivu-divider-with-text-left` 的出現條件有什麼不同？
9. `dashed` 和 `plain` 主要是改變 DOM 結構，還是新增 class 交給樣式處理？
10. `types/divider.d.ts` 與 runtime validator 對 `size` 的描述有什麼差異？這對閱讀元件庫有什麼啟發？

---

## 16. 後續延伸方向

這篇筆記完成的是 `Divider` 的 runtime 結構理解。後續可以拆成以下幾篇更深入的筆記：

1. **`03-class-and-style.md`：Divider class 與 Less 樣式解析**  
   專門分析 `ivu-divider-horizontal`、`ivu-divider-vertical`、`with-text`、`dashed`、`plain` 等 class 在 Less 中如何實作。

2. **`04-api-and-examples.md`：Divider API 與官方範例對照**  
   將官方範例和 props contract 對照，整理使用情境與最佳閱讀方式。

3. **`05-component-design-notes.md`：從 Divider 看低互動元件設計**  
   把 `Divider` 抽象成一種設計模式：props + slot + computed class + CSS，並和其他低互動元件比較。

4. **`06-type-runtime-consistency.md`：型別宣告與 runtime validator 的一致性檢查**  
   以 `size?: string` 和 `oneOf(value, ['small', 'default'])` 為例，分析元件庫中 type 與 runtime 約束可能不一致的情況。

---

## 17. 速查表：本章核心對應關係

| 輸入 | Runtime 判斷 | 主要 class / 結構 | 主要效果 |
| --- | --- | --- | --- |
| `<Divider />` | 無 default slot | 根 `div` | 普通水平分隔線。 |
| `<Divider>Text</Divider>` | `hasSlot = true` | `span.ivu-divider-inner-text` + `with-text` class | 帶文字分隔線。 |
| `type="vertical"` | `this.type === 'vertical'` | `ivu-divider-vertical` | 垂直分隔線。 |
| `orientation="left"` | 有 slot 且 orientation 為 left | `ivu-divider-with-text-left` | 文字靠左。 |
| `orientation="right"` | 有 slot 且 orientation 為 right | `ivu-divider-with-text-right` | 文字靠右。 |
| `dashed` | `!!this.dashed` | `ivu-divider-dashed` | 虛線樣式。 |
| `plain` | `this.plain` | `ivu-divider-plain` | 普通文字樣式。 |
| `size="small"` | validator 通過 small | `ivu-divider-small` | 小尺寸樣式。 |
