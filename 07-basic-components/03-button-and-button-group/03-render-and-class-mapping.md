# Button Render And Class Mapping：從 props 到 DOM 輸出

## 0. 原始筆記問題分析

原本筆記已經指出要觀察 `type`、`size`、`shape`、`loading` 如何共同決定 class，但還沒有把 render function 的輸出流程拆開。

`Button` 不是 template 寫法，而是使用 render function。對初學者來說，這比 `Icon`、`Divider` 的 template 更不直覺，因此本章會把它拆成三條線：

```txt
to / htmlType
  -> tagName / tagProps

loading / icon / customIcon / slot
  -> children

type / size / shape / long / loading / icon-only / ghost
  -> classes
```

## 1. 本章定位

本章是一篇 runtime render 筆記，專門分析 `src/components/button/button.vue` 如何把 props 與 slot 轉成 DOM output。

本章不深入講 click navigation 的內部流程。`handleClickLink()` 與 `mixins/link.js` 會放到 `04-state-events-and-navigation.md`。

## 2. Render 的基本形狀

`Button` 的 render function 最後會回傳：

```js
return h(tag, {
    class: this.classes,
    disabled: this.itemDisabled,
    onClick: this.handleClickLink,
    ...this.tagProps
}, slots);
```

這行可以拆成四個重點。

第一，`tag` 不是固定的。它可能是 `button`，也可能是 `a`。

第二，class 由 `classes` computed 決定，不直接手寫在 render 裡。

第三，disabled 不是直接使用 `this.disabled`，而是使用 `this.itemDisabled`。這代表它會被 `mixins/form.js` 包一層。

第四，children 由 `slots` 陣列組成。這個陣列可能包含 loading icon、普通 icon、自訂 icon，以及 default slot 包成的 `span`。

## 3. Tag 決策：`button` 或 `a`

`Button` 用 `isHrefPattern` 判斷是否有 link 行為：

```js
isHrefPattern () {
    const { to } = this;
    return !!to;
}
```

只要 `to` 有值，`tagName` 就會回傳 `a`；否則回傳 `button`。

| 使用方式 | `tagName` | 說明 |
| --- | --- | --- |
| `<Button>Save</Button>` | `button` | 普通按鈕。 |
| `<Button html-type="submit">Submit</Button>` | `button` | 原生 button，可帶 `type="submit"`。 |
| `<Button to="/home">Home</Button>` | `a` | 有 `to`，改成 anchor button。 |
| `<Button :to="{ path: '/home' }">Home</Button>` | `a` | route object 也會讓 tag 變成 `a`。 |

這個設計讓同一個 `Button` API 同時覆蓋「操作按鈕」與「看起來像按鈕的連結」兩種場景。

## 4. Tag props：`type` 或 `href`

`tagProps` computed 依照是否是 link button 決定不同屬性。

```js
if (isHrefPattern) {
    const { linkUrl, target } = this;
    return { href: linkUrl, target };
} else {
    const { htmlType } = this;
    return { type: htmlType };
}
```

對應結果如下。

| 情境 | 輸出 props | 重點 |
| --- | --- | --- |
| 沒有 `to` | `{ type: htmlType }` | 只有 `<button>` 使用原生 `type`。 |
| 有 string `to` | `{ href: linkUrl, target }` | `linkUrl` 由 `mixins/link.js` 計算。 |
| 有 object `to` | `{ href: null, target }` | click 時仍會交給 router 處理。 |

`button.spec.js` 特別測了這個差異：當 `Button` 渲染成 `<button>` 時，`htmlType="reset"` 會輸出 `type="reset"`；當它因 `to` 渲染成 `<a>` 時，就不應輸出原生 `type` attribute。

## 5. Children 組合規則

`Button` 的 children 由 `slots` 陣列逐步 push。

### 5.1 loading icon 優先

如果 `loading` 為 true，先加入：

```js
h(Icon, {
    class: 'ivu-load-loop',
    type: 'ios-loading'
})
```

這表示 loading 狀態會強制使用 `ios-loading` icon，並加上 `ivu-load-loop` 旋轉樣式 class。

### 5.2 一般 icon 與 custom icon

如果有 `icon` 或 `customIcon`，且目前不是 loading，才加入：

```js
h(Icon, {
    type: this.icon,
    custom: this.customIcon
})
```

因此 loading 會壓過一般 icon。這符合使用者期待：按鈕進入載入狀態時，原本 icon 不再是主要訊息，loading spinner 才是主要狀態。

### 5.3 default slot 包成 `span`

如果有 default slot，會加入：

```js
h('span', {
    ref: 'slot'
}, this.$slots.default())
```

這裡不是直接把 slot children 放進 button，而是額外包一層 `span`。這讓樣式可以用：

```less
& > .ivu-icon + span,
& > span + .ivu-icon {
    margin-left: 4px;
}
```

處理 icon 和文字之間的距離。

## 6. Class 映射規則

`classes` computed 會回傳：

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

可以整理成下表。

| 條件 | 產生 class | 作用 |
| --- | --- | --- |
| 永遠存在 | `ivu-btn` | button 基礎樣式。 |
| `type="primary"` | `ivu-btn-primary` | 按鈕類型樣式。 |
| `long` | `ivu-btn-long` | 寬度 `100%`。 |
| `shape="circle"` | `ivu-btn-circle` | 圓形或圓角按鈕樣式。 |
| `size="small"` | `ivu-btn-small` | 小尺寸樣式。 |
| `size="large"` | `ivu-btn-large` | 大尺寸樣式。 |
| `loading` | `ivu-btn-loading` | loading overlay 與 pointer behavior。 |
| 沒有 slot 且有 icon / customIcon / loading | `ivu-btn-icon-only` | icon-only 按鈕尺寸。 |
| `ghost` | `ivu-btn-ghost` | 透明背景風格。 |

需要注意的是，`size="default"` 不會產生 `ivu-btn-default`。這和 `Divider` 不一樣，`Divider` 會輸出 `ivu-divider-default`。不同元件的 class 策略不一定完全相同。

## 7. DOM 輸出情境

### 7.1 普通按鈕

輸入：

```vue
<Button>Save</Button>
```

概念輸出：

```html
<button class="ivu-btn ivu-btn-default" type="button">
    <span>Save</span>
</button>
```

重點是 default slot 會被包進 `span`，並且沒有 `to` 時使用 `<button>`。

### 7.2 primary + icon + 文字

輸入：

```vue
<Button type="primary" icon="ios-search">Search</Button>
```

概念輸出：

```html
<button class="ivu-btn ivu-btn-primary" type="button">
    <i class="ivu-icon ivu-icon-ios-search"></i>
    <span>Search</span>
</button>
```

icon 與文字都存在時，不會加 `ivu-btn-icon-only`，因為 `showSlot` 為 true。

### 7.3 icon-only circle

輸入：

```vue
<Button type="primary" shape="circle" icon="ios-search"></Button>
```

概念輸出：

```html
<button class="ivu-btn ivu-btn-primary ivu-btn-circle ivu-btn-icon-only" type="button">
    <i class="ivu-icon ivu-icon-ios-search"></i>
</button>
```

這種情境會同時觸發 `shape` 與 `icon-only` 樣式，是 `button.less` 中 circle 與 square size 規則交會的地方。

### 7.4 loading button

輸入：

```vue
<Button loading>Save</Button>
```

概念輸出：

```html
<button class="ivu-btn ivu-btn-default ivu-btn-loading" type="button">
    <i class="ivu-icon ivu-icon-ios-loading ivu-load-loop"></i>
    <span>Save</span>
</button>
```

如果同時傳入 `icon` 與 `loading`，render 仍以 loading icon 優先。

### 7.5 link button

輸入：

```vue
<Button to="/menu" target="_blank">Open</Button>
```

概念輸出：

```html
<a class="ivu-btn ivu-btn-default" href="/menu" target="_blank">
    <span>Open</span>
</a>
```

實際 `href` 可能經過 router resolve。click 時也會交給 `handleClickLink()` 與 `mixins/link.js` 做進一步處理。

## 8. 常見誤區

| 誤區 | 正確理解 |
| --- | --- |
| `Button` 永遠輸出 `<button>` | 有 `to` 時會輸出 `<a>`。 |
| `htmlType` 對 `<a>` 也有效 | `tagProps` 只在非 link button 時輸出 `type`。 |
| `loading` 只是多一個 class | loading 也會替換 icon，並加上 loading overlay 相關樣式。 |
| 有 icon 就一定是 icon-only | 只有沒有 default slot 且有 icon / customIcon / loading 時才是 icon-only。 |
| `size="default"` 會產生 `ivu-btn-default` | default size 不產生 size class；`ivu-btn-default` 是 type class。 |

## 9. 本章總結

`Button` 的 render 邏輯可以拆成 tag、children、class 三層。`to` 決定 tag 是 `<button>` 還是 `<a>`；`loading`、`icon`、`customIcon` 與 slot 決定 children；`type`、`size`、`shape`、`long`、`loading`、`icon-only`、`ghost` 決定 class。

理解這一層後，再去讀 `button.less` 就會清楚很多：less 不是憑空出現一堆 selector，而是在承接 runtime 產生的狀態 class。

## 10. 自我檢查問題

1. `Button` 用哪個條件決定輸出 `<a>`？
2. `htmlType` 最後會變成哪個原生 attribute？
3. loading 狀態為什麼會壓過普通 icon？
4. default slot 為什麼要包成 `span`？
5. `ivu-btn-icon-only` 的條件是什麼？
6. `size="default"` 為什麼不會產生 `ivu-btn-default`？
7. link button 的 `href` 由哪個 computed 提供？
