# Button Render And Class Mapping：從 props 到 DOM 輸出

## 0. 原始筆記問題分析

這份原始筆記屬於 **原始碼閱讀筆記**，更精確地說，是針對 `Button` 元件 runtime render 邏輯的 source reading note。它的主題不是介紹 `Button` 有哪些 props，也不是說明樣式細節，而是要回答一個更底層的問題：

> 使用者在 template 裡寫下 `<Button>` 之後，`button.vue` 如何根據 props、slot 與 computed，最後產生真正的 DOM 輸出？

原始筆記已經抓到非常重要的閱讀方向：`Button` 並不是以一般 template 寫成，而是使用 render function；因此閱讀時不能只用「看 HTML 結構」的方式理解，而要把 render function 拆成幾條資料轉換線來看。

不過，原始筆記仍有幾個可以補強的地方。

### 0.1 原始筆記目前已經做得好的地方

原始筆記已經明確指出，`Button` 的 render 邏輯可以拆成三條主線：

```txt
to / htmlType
  -> tagName / tagProps

loading / icon / customIcon / slot
  -> children

type / size / shape / long / loading / icon-only / ghost
  -> classes
```

這個拆法很適合初次閱讀 `Button` 原始碼的人，因為它避免一開始就陷入 render function 的細節，而是先建立「輸入如何轉成輸出」的整體地圖。

### 0.2 需要補強的地方

原始筆記雖然已經列出 `tag`、`tagProps`、`children`、`classes` 的規則，但如果要作為長期複習用的教材型筆記，仍需要補上以下內容：

| 需要補強的面向 | 原因 |
| --- | --- |
| render function 的閱讀方式 | 初學者可能熟悉 template，但不一定熟悉 `h()` 與 vnode 組裝方式。 |
| `Button` 為什麼有時輸出 `<button>`、有時輸出 `<a>` | 這是操作按鈕與連結按鈕共用同一套 API 的核心設計。 |
| `htmlType` 與 `type` 的區別 | `type` 是 View UI Plus 的按鈕類型；`htmlType` 才是原生 `<button type="...">`。 |
| loading、icon、customIcon、slot 的優先順序 | 這會直接影響實際 DOM children 與視覺狀態。 |
| `ivu-btn-default` 的語意 | 它是 `type="default"` 產生的 class，不是 `size="default"` 產生的 class。 |
| `ButtonGroup` 在本章中的位置 | 這份原始筆記主要討論 `Button` render，`ButtonGroup` 只適合在本章作補充定位，完整 group 樣式仍需回到 style 筆記。 |

因此，本章會保留原始筆記的核心判斷，並把它改寫成更適合長期學習的教材型筆記。

---

## 1. 本章定位

本章專門分析 `src/components/button/button.vue` 中的 **render output mapping**，也就是 `Button` 如何把 props、slot 與 computed 結果轉成 DOM。

本章的重點不是「怎麼使用 `Button`」，而是「怎麼讀懂 `Button` 的原始碼」。讀完後，你應該能夠回答：

1. `Button` 為什麼有時候輸出 `<button>`，有時候輸出 `<a>`。
2. `htmlType` 最後如何變成原生 `type` attribute。
3. `loading`、`icon`、`customIcon`、default slot 如何組成 children。
4. `type`、`size`、`shape`、`long`、`loading`、`ghost` 如何映射成 `ivu-btn-*` class。
5. 為什麼 `size="default"` 不會產生 `ivu-btn-default`。
6. 為什麼理解 render mapping 後，再看 `button.less` 會更容易。

本章暫時不深入展開 `handleClickLink()` 與 `mixins/link.js` 的完整跳轉流程。這些內容更適合放在「狀態、事件與 navigation」的筆記中處理。

---

## 2. 閱讀前的核心模型：把 render 拆成三條線

閱讀 `Button` 的 render function 時，最重要的不是先記住每個細節，而是先建立「props 如何進入 DOM」的資料流模型。

可以先把 `Button` 想成一個轉換器：

```txt
使用者 template
    ↓
props + slot
    ↓
computed / methods
    ↓
render function
    ↓
DOM tag + attributes + children + class
```

在 `Button` 裡，這個轉換器主要可以拆成三條線。

```txt
第一條線：標籤與屬性
to / htmlType
  -> tagName / tagProps
  -> <button type="..."> 或 <a href="..." target="...">

第二條線：內容節點
loading / icon / customIcon / default slot
  -> slots array
  -> loading icon、普通 icon、自訂 icon、文字 span

第三條線：狀態 class
type / size / shape / long / loading / icon-only / ghost
  -> classes
  -> ivu-btn、ivu-btn-primary、ivu-btn-loading、ivu-btn-icon-only...
```

這三條線彼此獨立，但最後會在 render function 裡匯合：

```js
return h(tag, {
    class: this.classes,
    disabled: this.itemDisabled,
    onClick: this.handleClickLink,
    ...this.tagProps
}, slots);
```

這段程式可以視為本章的中心。後面的所有細節，其實都是在解釋 `tag`、`this.classes`、`this.itemDisabled`、`this.tagProps` 與 `slots` 分別從哪裡來。

---

## 3. Render function 的基本形狀

`Button` 的 render function 最後會呼叫 `h()` 建立 vnode。對於熟悉 Vue template 的人來說，可以把它理解成「用 JavaScript 寫 template」。

原始筆記整理出的核心結構如下：

```js
return h(tag, {
    class: this.classes,
    disabled: this.itemDisabled,
    onClick: this.handleClickLink,
    ...this.tagProps
}, slots);
```

這段 render output 可以拆成四個部分來理解。

| 區塊 | 來源 | 說明 |
| --- | --- | --- |
| `tag` | `this.tagName` | 決定最後輸出的是 `<button>` 還是 `<a>`。 |
| `class` | `this.classes` | 根據 `type`、`size`、`shape`、`loading` 等狀態產生 class。 |
| `disabled` | `this.itemDisabled` | 不是單純讀 `this.disabled`，而是經過 `mixins/form.js` 的表單 disabled 邏輯。 |
| `onClick` | `this.handleClickLink` | click 後會先進入 Button 的事件處理與 link navigation 流程。 |
| `...this.tagProps` | `this.tagProps` | 根據 tag 類型補上 `type` 或 `href`、`target`。 |
| `slots` | render function 內部組裝 | 放入 loading icon、普通 icon、custom icon 與 default slot。 |

### 3.1 為什麼這裡要注意 `itemDisabled`

對一般元件來說，看到 `disabled` 很容易直覺認為它只來自 `disabled` prop。但在 `Button` 裡，render function 使用的是：

```js
disabled: this.itemDisabled
```

這表示 `Button` 的 disabled 狀態不只受自己的 `disabled` prop 影響，也可能受到上層 `Form` 的 disabled 狀態影響。這部分來自 `mixins/form.js`，不是本章的主要內容，但閱讀 render output 時必須先知道這件事。

### 3.2 為什麼這裡要注意 `tagProps`

`tagProps` 是理解 `Button` 輸出差異的關鍵。因為 `<button>` 和 `<a>` 需要的 attributes 不同：

- `<button>` 需要的是原生 `type`，例如 `button`、`submit`、`reset`。
- `<a>` 需要的是 `href` 與 `target`。

`Button` 沒有在 render 裡直接寫死這些屬性，而是交給 `tagProps` computed 統一決定。

---

## 4. Tag 決策：什麼時候是 `<button>`，什麼時候是 `<a>`

`Button` 的第一個重要 render 決策是：最後要輸出哪一種原生標籤。

原始筆記指出，`Button` 會透過 `isHrefPattern` 判斷是否進入 link button 模式：

```js
isHrefPattern () {
    const { to } = this;
    return !!to;
}
```

只要 `to` 有值，就視為 link button；沒有 `to`，則視為普通 button。

| 使用方式 | `tagName` | 角色 |
| --- | --- | --- |
| `<Button>Save</Button>` | `button` | 一般操作按鈕。 |
| `<Button html-type="submit">Submit</Button>` | `button` | 表單提交按鈕。 |
| `<Button to="/home">Home</Button>` | `a` | 看起來像按鈕的連結。 |
| `<Button :to="{ path: '/home' }">Home</Button>` | `a` | 搭配 router object 的連結按鈕。 |

### 4.1 為什麼 link button 要輸出 `<a>`

元件庫常會提供「看起來像按鈕的連結」。例如：

```vue
<Button to="/dashboard">Go Dashboard</Button>
```

使用者希望它在視覺上像按鈕，但語意上又能像連結一樣導航。因此 `Button` 透過 `to` 這個 prop，把同一個元件分成兩種輸出模式：

```txt
沒有 to
  -> 操作型 Button
  -> <button>

有 to
  -> 連結型 Button
  -> <a>
```

這種設計讓 API 對使用者保持一致，但 runtime 會根據使用情境選擇更合適的原生元素。

### 4.2 閱讀提醒：`to` 不是 `button.vue` 自己宣告的 props

依前一章 public props contract 的觀念，`to` 來自 `mixins/link.js`。所以如果只看 `button.vue` 的 `props` 區塊，可能會找不到 `to`，但它仍然會影響 `Button` 的 render output。

這也是閱讀元件庫原始碼時很重要的經驗：**render function 裡用到的欄位，不一定都來自 component 自己的 props，也可能來自 mixin、inject、computed 或外部設定。**

---

## 5. Tag props：`htmlType`、`href` 與 `target` 的分流

決定 tag 之後，下一步是決定該 tag 應該帶哪些 attributes。

原始筆記整理出的 `tagProps` 邏輯如下：

```js
if (isHrefPattern) {
    const { linkUrl, target } = this;
    return { href: linkUrl, target };
} else {
    const { htmlType } = this;
    return { type: htmlType };
}
```

可以整理成下面這張表。

| 情境 | DOM tag | 輸出 props | 重點 |
| --- | --- | --- | --- |
| 沒有 `to` | `<button>` | `{ type: htmlType }` | `htmlType` 會變成原生 button 的 `type` attribute。 |
| 有 string `to` | `<a>` | `{ href: linkUrl, target }` | `linkUrl` 由 link mixin 計算。 |
| 有 object `to` | `<a>` | `{ href: null, target }` | click 時仍會交給 router 流程處理。 |

### 5.1 `type` 和 `htmlType` 不是同一件事

閱讀 `Button` 時很容易混淆兩個名稱：

| 名稱 | 層級 | 用途 |
| --- | --- | --- |
| `type` | View UI Plus 的元件 prop | 決定按鈕視覺類型，例如 `primary`、`text`、`success`。 |
| `htmlType` / `html-type` | 原生 button 屬性對應的 prop | 決定 `<button type="button">`、`submit` 或 `reset`。 |

例如：

```vue
<Button type="primary" html-type="submit">
    Submit
</Button>
```

概念上會得到：

```html
<button class="ivu-btn ivu-btn-primary" type="submit">
    <span>Submit</span>
</button>
```

這裡的 `type="primary"` 不會直接變成原生 attribute，而是轉成 class：

```txt
type="primary"
  -> ivu-btn-primary
```

真正會變成原生 `<button type="...">` 的，是 `html-type`：

```txt
html-type="submit"
  -> htmlType
  -> type="submit"
```

### 5.2 為什麼 `<a>` 不應該輸出 `htmlType`

`htmlType` 只對原生 `<button>` 有意義。當 `Button` 因為有 `to` 而輸出 `<a>` 時，就不應該再把 `htmlType` 輸出成 `type` attribute。

因此：

```vue
<Button to="/home" html-type="submit">
    Home
</Button>
```

概念上應該偏向：

```html
<a class="ivu-btn ivu-btn-default" href="/home" target="_self">
    <span>Home</span>
</a>
```

而不是：

```html
<a class="ivu-btn ivu-btn-default" href="/home" type="submit">
    <span>Home</span>
</a>
```

原始筆記也指出，`button.spec.js` 有測試這個差異：當 `Button` 是 `<button>` 時，`htmlType="reset"` 會輸出 `type="reset"`；當它因 `to` 變成 `<a>` 時，就不應該輸出原生 `type` attribute。

---

## 6. Children 組合規則：loading、icon、customIcon 與 default slot

`Button` 的 children 不是一次寫死，而是在 render function 裡逐步組裝到 `slots` 陣列中。

可以先把 children 組裝流程理解成：

```txt
建立空的 slots array
    ↓
如果 loading=true，加入 loading icon
    ↓
如果沒有 loading，且有 icon/customIcon，加入一般 Icon
    ↓
如果有 default slot，包成 span 後加入
    ↓
slots 成為 h(tag, props, slots) 的第三個參數
```

### 6.1 loading icon 優先

當 `loading` 為 `true` 時，render function 會先加入 loading icon：

```js
h(Icon, {
    class: 'ivu-load-loop',
    type: 'ios-loading'
})
```

這代表 loading 狀態不只是加上一個 class，而是會實際改變 children。畫面上會出現 `ios-loading` icon，並透過 `ivu-load-loop` 取得旋轉效果。

### 6.2 loading 會壓過普通 icon

如果同時傳入：

```vue
<Button loading icon="ios-search">
    Search
</Button>
```

`Button` 不會同時渲染 loading icon 與 search icon，而是以 loading icon 為優先。

這樣設計是合理的，因為 `loading` 代表目前按鈕正在處理某個操作。此時使用者最需要看到的是「正在處理」的狀態，而不是原本的 icon 語意。

可以理解成：

```txt
loading=true
  -> 顯示 loading spinner
  -> 暫時忽略 icon/customIcon 的視覺輸出
```

### 6.3 一般 icon 與 custom icon

如果沒有進入 loading 狀態，且使用者有傳入 `icon` 或 `customIcon`，才會加入一般 `Icon`：

```js
h(Icon, {
    type: this.icon,
    custom: this.customIcon
})
```

這裡也可以看出 `Button` 並不是自己直接產生 `<i>`，而是把 icon 類型交給內部的 `Icon` 元件處理。

| Button prop | 傳給內部 `Icon` 的 prop | 說明 |
| --- | --- | --- |
| `icon` | `type` | 使用 View UI Plus / Ionicons 類型 icon。 |
| `customIcon` | `custom` | 使用自訂 icon class。 |

### 6.4 default slot 會包成 `span`

如果使用者有寫 default slot，例如：

```vue
<Button>Save</Button>
```

render function 不會直接把 slot children 放進 button，而是包一層 `span`：

```js
h('span', {
    ref: 'slot'
}, this.$slots.default())
```

概念輸出如下：

```html
<button class="ivu-btn ivu-btn-default" type="button">
    <span>Save</span>
</button>
```

這層 `span` 很重要，因為樣式可以利用它處理 icon 與文字之間的距離，例如原始筆記提到的 less 規則：

```less
& > .ivu-icon + span,
& > span + .ivu-icon {
    margin-left: 4px;
}
```

也就是說，`span` 不只是多餘包裝，而是讓樣式 selector 可以穩定判斷「icon 和文字相鄰」的結構。

---

## 7. Class 映射規則：props 如何變成 `ivu-btn-*`

`Button` 的 class 由 `classes` computed 統一產生。原始筆記整理出的結構如下：

```js
[
    'ivu-btn',
    `ivu-btn-${this.type}`,
    {
        'ivu-btn-long': this.long,
        [`ivu-btn-${this.shape}`]: !!this.shape,
        [`ivu-btn-${this.size}`]: this.size !== 'default',
        'ivu-btn-loading': this.loading != null && this.loading,
        'ivu-btn-icon-only': !this.showSlot && (!!this.icon || !!this.customIcon || this.loading),
        'ivu-btn-ghost': this.ghost
    }
]
```

這裡使用的是 Vue 常見的 class array/object 寫法。可以分成三層來看：

```txt
基礎 class
  -> 'ivu-btn'

type class
  -> `ivu-btn-${this.type}`

狀態 class
  -> long / shape / size / loading / icon-only / ghost
```

### 7.1 基礎 class：`ivu-btn`

`ivu-btn` 永遠存在。它代表所有 Button 共用的基礎樣式，例如：

- display 行為
- border
- cursor
- padding
- transition
- 基礎字體與高度規則

概念上可以把它視為 Button 的 base class。

```txt
所有 Button
  -> 一定有 ivu-btn
```

### 7.2 type class：`ivu-btn-${this.type}`

`Button` 會永遠根據 `type` 產生一個 type class：

| `type` | 產生 class | 說明 |
| --- | --- | --- |
| `default` | `ivu-btn-default` | 預設按鈕風格。 |
| `primary` | `ivu-btn-primary` | 主要操作按鈕。 |
| `dashed` | `ivu-btn-dashed` | 虛線按鈕。 |
| `text` | `ivu-btn-text` | 文字按鈕。 |
| `info` | `ivu-btn-info` | 資訊狀態按鈕。 |
| `success` | `ivu-btn-success` | 成功狀態按鈕。 |
| `warning` | `ivu-btn-warning` | 警告狀態按鈕。 |
| `error` | `ivu-btn-error` | 錯誤狀態按鈕。 |

這裡要特別注意：

```txt
ivu-btn-default 是 type class，不是 size class。
```

也就是說：

```vue
<Button type="default">Default</Button>
```

會產生：

```txt
ivu-btn-default
```

但：

```vue
<Button size="default">Default Size</Button>
```

不會因為 `size="default"` 額外產生 `ivu-btn-default`。

### 7.3 size class：default size 不產生額外 class

`classes` 裡有這段規則：

```js
[`ivu-btn-${this.size}`]: this.size !== 'default'
```

這表示只有 `size` 不是 `default` 時，才會產生 size class。

| `size` | 是否產生 size class | 產生 class |
| --- | --- | --- |
| `default` | 否 | 無額外 size class |
| `small` | 是 | `ivu-btn-small` |
| `large` | 是 | `ivu-btn-large` |

這是 View UI Plus 裡常見的 class 策略：預設狀態不一定需要顯式 class，因為基礎樣式本身就代表 default size。

### 7.4 shape class：只有有 shape 才產生

`shape` 的規則是：

```js
[`ivu-btn-${this.shape}`]: !!this.shape
```

因此：

| `shape` | 產生 class |
| --- | --- |
| 未傳 / 空值 | 不產生 shape class |
| `circle` | `ivu-btn-circle` |
| `circle-outline` | `ivu-btn-circle-outline` |

這種寫法可以避免在沒有 shape 時產生無意義的 class，例如 `ivu-btn-undefined` 或 `ivu-btn-`。

### 7.5 loading class：不只是視覺狀態，也對 children 有影響

`loading` 會產生：

```txt
ivu-btn-loading
```

但它不只是 class 規則。前面 children 組合已經說過，`loading` 還會讓普通 icon 被 loading icon 取代。

所以 loading 至少影響兩層：

| 層級 | 影響 |
| --- | --- |
| children | 顯示 `ios-loading` icon，並加上 `ivu-load-loop`。 |
| class | 加上 `ivu-btn-loading`，讓樣式層套用 loading 狀態。 |

### 7.6 icon-only class：沒有文字時才成立

`ivu-btn-icon-only` 的條件是：

```js
!this.showSlot && (!!this.icon || !!this.customIcon || this.loading)
```

可以用白話理解為：

```txt
沒有 default slot 文字
而且有 icon / customIcon / loading 其中之一
  -> 是 icon-only button
```

因此：

```vue
<Button icon="ios-search"></Button>
```

會是 icon-only button。

但：

```vue
<Button icon="ios-search">Search</Button>
```

不是 icon-only button，因為它有 default slot 文字。

這個 class 很重要，因為 icon-only button 的寬高、padding、圓形按鈕尺寸，通常會和「有文字的 button」不同。

### 7.7 long 與 ghost

最後還有兩個常見狀態：

| prop | 產生 class | 說明 |
| --- | --- | --- |
| `long` | `ivu-btn-long` | 通常讓按鈕寬度展開到 `100%`。 |
| `ghost` | `ivu-btn-ghost` | 透明背景或幽靈按鈕風格，實際視覺由 less 決定。 |

這兩個 prop 都是典型的「runtime 只負責產生 class，真正視覺交給 style」的設計。

---

## 8. DOM 輸出情境：從使用方式反推 render 結果

這一節用幾個常見場景把前面的規則串起來。以下 HTML 都是「概念輸出」，目的是幫助理解 render mapping，不代表瀏覽器中完整、精確的最終 DOM。

### 8.1 普通按鈕

輸入：

```vue
<Button>Save</Button>
```

概念流程：

```txt
沒有 to
  -> tagName = button

沒有傳 html-type
  -> htmlType default = button
  -> type="button"

type default
  -> ivu-btn-default

有 default slot
  -> <span>Save</span>
```

概念輸出：

```html
<button class="ivu-btn ivu-btn-default" type="button">
    <span>Save</span>
</button>
```

### 8.2 primary + icon + 文字

輸入：

```vue
<Button type="primary" icon="ios-search">Search</Button>
```

概念流程：

```txt
type="primary"
  -> ivu-btn-primary

icon="ios-search"
  -> 產生 Icon

有 default slot
  -> 產生 span
  -> 不會產生 ivu-btn-icon-only
```

概念輸出：

```html
<button class="ivu-btn ivu-btn-primary" type="button">
    <i class="ivu-icon ivu-icon-ios-search"></i>
    <span>Search</span>
</button>
```

重點是：有 icon 不代表一定是 icon-only。是否 icon-only，要看有沒有 default slot。

### 8.3 icon-only circle

輸入：

```vue
<Button type="primary" shape="circle" icon="ios-search"></Button>
```

概念流程：

```txt
type="primary"
  -> ivu-btn-primary

shape="circle"
  -> ivu-btn-circle

沒有 default slot
且有 icon
  -> ivu-btn-icon-only
```

概念輸出：

```html
<button class="ivu-btn ivu-btn-primary ivu-btn-circle ivu-btn-icon-only" type="button">
    <i class="ivu-icon ivu-icon-ios-search"></i>
</button>
```

這個情境同時觸發 `type`、`shape`、`icon-only` 三種樣式，是閱讀 `button.less` 時很適合對照的案例。

### 8.4 loading button

輸入：

```vue
<Button loading>Save</Button>
```

概念流程：

```txt
loading=true
  -> ivu-btn-loading
  -> children 使用 ios-loading
  -> icon 加上 ivu-load-loop

有 default slot
  -> <span>Save</span>
```

概念輸出：

```html
<button class="ivu-btn ivu-btn-default ivu-btn-loading" type="button">
    <i class="ivu-icon ivu-icon-ios-loading ivu-load-loop"></i>
    <span>Save</span>
</button>
```

如果同時傳入 `icon` 與 `loading`，仍會以 loading icon 優先：

```vue
<Button loading icon="ios-search">Search</Button>
```

概念上會顯示 loading icon，而不是 search icon。

### 8.5 link button

輸入：

```vue
<Button to="/menu" target="_blank">Open</Button>
```

概念流程：

```txt
to 有值
  -> isHrefPattern = true
  -> tagName = a

tagProps
  -> href = linkUrl
  -> target = "_blank"

default slot
  -> <span>Open</span>
```

概念輸出：

```html
<a class="ivu-btn ivu-btn-default" href="/menu" target="_blank">
    <span>Open</span>
</a>
```

實際 `href` 可能經過 `mixins/link.js` 的 `linkUrl` 與 router resolve 流程處理。這一段屬於 navigation 筆記的範圍，本章只需要知道：`to` 會讓 `Button` 進入 link button 模式。

### 8.6 ButtonGroup 在本章中的補充定位

雖然本系列主題是 `Button` 與 `ButtonGroup`，但這份原始筆記主要聚焦在 `Button` 的 render mapping。`ButtonGroup` 在本章只適合做簡短補充。

從前面的 source map 可知，`ButtonGroup` 的 runtime 結構相對薄，主要是輸出一個包住子按鈕的 wrapper，並根據自身 props 產生 group class。它不像 `Button` 一樣有複雜的 tag 分流、children 組裝或 link 行為。

因此，本章對 `ButtonGroup` 的閱讀提醒是：

```txt
ButtonGroup 的重點不在複雜 render children，
而在父層 group class 如何被 button.less 接住。
```

也就是說，`ButtonGroup` 的完整理解需要搭配 style source：

- `button-group.vue`：確認 wrapper 與 group class。
- `button.less`：確認 group class 如何影響子按鈕邊框、圓角、排列方向。
- `styles/mixins/button.less`：確認橫向與縱向 group 的 mixin 規則。

此處原始筆記沒有提供完整 `ButtonGroup` class computed 程式碼，因此本章不主動編造細節，僅保留它在 render mapping 脈絡中的位置。

---

## 9. 常見誤區與閱讀路線

### 9.1 常見誤區

| 誤區 | 正確理解 |
| --- | --- |
| `Button` 永遠輸出 `<button>` | 有 `to` 時會輸出 `<a>`。 |
| `htmlType` 對 `<a>` 也有效 | `tagProps` 只在非 link button 時輸出 `type`。 |
| `type="primary"` 會變成原生 `type` attribute | `type` 是元件視覺類型，會變成 `ivu-btn-primary` class。 |
| `loading` 只是多一個 class | loading 也會改變 children，優先顯示 loading icon。 |
| 有 icon 就一定是 icon-only | 必須「沒有 default slot」且有 icon / customIcon / loading 才是 icon-only。 |
| `size="default"` 會產生 `ivu-btn-default` | `ivu-btn-default` 是 type class，不是 size class。 |
| `ButtonGroup` 的效果主要在 runtime | `ButtonGroup` runtime 較薄，核心效果多在 style selector。 |

### 9.2 建議閱讀路線

初次閱讀這段原始碼時，建議不要一開始就跳到 less，而是先把 runtime output 看懂。

```txt
第一步：先看 render function 最後的 h(tag, props, slots)
    ↓
第二步：追 tagName，看 Button 何時輸出 button / a
    ↓
第三步：追 tagProps，看 htmlType / href / target 如何分流
    ↓
第四步：追 slots 組裝，看 loading / icon / default slot 的順序
    ↓
第五步：追 classes，看每個 prop 產生哪些 ivu-btn-* class
    ↓
第六步：回到 button.less，對照 runtime 產生的 class 如何被樣式接住
    ↓
第七步：補讀 button.spec.js，確認哪些行為被測試保護
```

這個順序的好處是：你會先知道 runtime 到底產生了哪些 DOM 結構與 class，再去看 style source 時就不會覺得 selector 很零散。

---

## 10. 本章總結、自我檢查與延伸方向

### 10.1 本章總結

`Button` 的 render 邏輯可以用三條線理解：

```txt
to / htmlType
  -> tagName / tagProps
  -> 決定 button 或 a，以及 type / href / target

loading / icon / customIcon / default slot
  -> slots
  -> 決定 loading icon、普通 icon、文字 span

type / size / shape / long / loading / icon-only / ghost
  -> classes
  -> 決定 ivu-btn-* 狀態 class
```

這三條線最後會在 render function 裡合併：

```js
return h(tag, {
    class: this.classes,
    disabled: this.itemDisabled,
    onClick: this.handleClickLink,
    ...this.tagProps
}, slots);
```

理解這一層後，`button.less` 就不再是一堆難以記憶的 selector，而是 runtime class 的延伸：runtime 負責產生狀態，style 負責把狀態轉成視覺效果。

### 10.2 自我檢查問題

1. `Button` 用哪個條件決定輸出 `<a>`？
2. `htmlType` 最後會變成哪個原生 attribute？
3. `type="primary"` 和 `html-type="submit"` 分別影響哪一層輸出？
4. loading 狀態為什麼會壓過普通 icon？
5. default slot 為什麼要包成 `span`？
6. `ivu-btn-icon-only` 的成立條件是什麼？
7. `size="default"` 為什麼不會產生 `ivu-btn-default`？
8. `ivu-btn-default` 是由哪個 prop 產生的？
9. link button 的 `href` 由哪個 computed 或 mixin 能力提供？
10. 為什麼理解 `classes` computed 後，再讀 `button.less` 會更容易？
11. 本章為什麼不應該強行展開完整 `ButtonGroup` style 規則？
12. `disabled: this.itemDisabled` 暗示 Button 還受到哪個 mixin 或上層元件影響？

### 10.3 後續延伸方向

這份筆記之後可以繼續拆成幾個更深入的主題：

| 延伸主題 | 建議內容 |
| --- | --- |
| `04-state-events-and-navigation.md` | 深入分析 `handleClickLink()`、`mixins/link.js`、router navigation 與 click emit。 |
| `05-button-style-system.md` | 對照 `classes` 與 `button.less`，分析每個 `ivu-btn-*` class 的樣式來源。 |
| `06-button-group-style.md` | 專門分析 `ButtonGroup` 的水平 / 垂直排列、邊框合併、圓角處理。 |
| `07-button-tests.md` | 閱讀 `button.spec.js`，理解測試如何保護 tag output、`htmlType` 與 loading 行為。 |
| `08-render-function-reading-method.md` | 從 `Button` 延伸出一套閱讀 Vue render function 元件的方法。 |

