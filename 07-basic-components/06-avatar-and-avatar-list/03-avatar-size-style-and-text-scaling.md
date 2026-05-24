# View UI Plus `Avatar`：尺寸、樣式與文字縮放原始碼閱讀筆記

## 0. 原始筆記問題分析

這份原始筆記已經掌握了 `Avatar` 視覺系統的核心：`size` 並不是單純轉成一個 CSS class，而是同時牽涉 `classes`、`styles`、`childrenStyle`、`setScale()`、生命週期與 `avatar.less`。也就是說，`Avatar` 的尺寸與樣式不是只靠 CSS，也不是只靠 JavaScript，而是由 runtime 與 Less 樣式共同完成。

原始筆記中最有價值的觀察，是把尺寸行為拆成三條路徑：

1. `small`、`default`、`large` 這類預設尺寸，走 class 與 `avatar.less`。
2. 數字尺寸或非預設尺寸，走 runtime inline style。
3. default slot 文字頭像，需要在 DOM 渲染後測量寬度，再決定是否縮放。

這三條路徑如果沒有先拆開，很容易誤解為「`size` 只是 class 名稱」或「文字縮放是純 CSS 完成」。實際上，`Avatar` 這個元件很適合用來學習元件庫中的典型設計：**穩定規格交給 CSS token 與 Less mixin，動態輸入與 DOM 測量交給 runtime computed style 與 lifecycle**。

本次重構會將原始筆記整理成一篇教材型 source reading 筆記。重點不是背 API，而是理解 `Avatar` 的視覺系統如何從 props、computed、template、Less、DOM measurement 串起來。

---

## 1. 本章定位

本章是一篇「原始碼閱讀 + 視覺系統分析」筆記，主題是 `View UI Plus` 的 `Avatar` 元件如何處理尺寸、形狀、圖片、icon 與文字縮放。

本章主要解決以下問題：

1. `size` 為什麼有時候會產生 class，有時候會產生 inline style？
2. `small`、`default`、`large` 這三種預設尺寸和 `avatar.less` 的關係是什麼？
3. `shape="circle"` 與 `shape="square"` 實際如何影響樣式？
4. 圖片模式與 icon 模式分別有哪些樣式狀態？
5. default slot 文字太長時，`Avatar` 如何透過 DOM measurement 進行縮放？
6. 為什麼文字縮放不能只靠 template 或 Less 理解？

本章不重複分析 `src`、`icon`、`customIcon`、default slot 的內容優先序。這部分應該放在前一篇 `02-avatar-public-contract-and-content-priority.md` 中理解。本章預設你已經知道：`Avatar` 的內容 branch 是 `src` 優先，其次是 `icon/customIcon`，最後才是 default slot。

---

## 2. 學習前先建立的基本觀念

在閱讀這份筆記前，需要先建立幾個前端元件庫常見觀念。

第一，元件庫通常不會把所有樣式都寫在 runtime。像 `large`、`small` 這種穩定、可預期的設計規格，通常會交給 Less / Sass / CSS token 處理。這樣做的好處是樣式集中、容易主題化，也方便整個元件庫維持一致的尺寸系統。

第二，當使用者輸入的是動態值，例如 `size="64"` 或 `:size="42"`，這種值不可能事先為每個數字都產生一個 CSS class。因此 runtime 會更適合處理這類情境，直接把使用者輸入轉成 inline style。

第三，文字縮放和一般尺寸設定不同。文字縮放取決於「文字實際渲染後的寬度」和「頭像容器的實際寬度」。這些資訊在 template render 前無法知道，必須等 DOM 出現後才能透過 `offsetWidth`、`getBoundingClientRect()` 等方式測量。

第四，Vue 的 `computed`、`watch`、`mounted`、`updated` 在這裡各自扮演不同角色。`computed` 負責把狀態轉成 class 或 style；`mounted` / `updated` 負責在 DOM 可讀時重新測量；`watch` 則負責在尺寸 prop 改變後觸發重新計算。

---

## 3. 整體概覽

`Avatar` 的視覺系統可以先用一張流程圖理解：

```txt
size prop
  ├─ small / default / large
  │    ├─ classes 產生 ivu-avatar-{size}
  │    └─ avatar.less 套用預設尺寸 token
  │
  └─ 其他值，例如 64、42
       └─ styles computed 產生 inline width / height / lineHeight / fontSize

shape prop
  ├─ circle
  │    └─ 預設由 avatar-size mixin 的 border-radius: 50% 支撐
  └─ square
       └─ ivu-avatar-square 覆蓋 border-radius

內容狀態
  ├─ src
  │    └─ ivu-avatar-image + img width/height 100%
  ├─ icon / customIcon
  │    └─ ivu-avatar-icon + Icon 元件樣式
  └─ default slot
       └─ mounted / updated / size watcher 觸發 setScale()
            └─ childrenStyle 寫入 transform 與 left
```

這個概覽最重要的觀念是：`Avatar` 的視覺結果不是單一來源決定的。它是由三層共同形成：

| 層次 | 負責內容 | 對應 source |
| --- | --- | --- |
| Runtime state | 根據 props 判斷 class、inline style、文字縮放比例 | `classes`、`styles`、`childrenStyle`、`setScale()` |
| Style system | 預設尺寸、形狀、圖片與 icon 樣式 | `avatar.less` |
| DOM measurement | 讀取文字寬度與頭像寬度，決定是否縮放 | `offsetWidth`、`getBoundingClientRect()` |

初學者閱讀這類元件時，不能只看 template，也不能只看 Less。比較好的方式是從 prop 進入，追到 computed，再對照 Less，最後看是否有 lifecycle 或 watcher 介入。

---

## 4. 核心內容逐步講解

### 4.1 `size` 的兩條樣式路徑

`Avatar` 的尺寸輸入集中在 `size` 這個 prop。runtime 支援的概念上可以分成兩類：

```txt
預設尺寸：small / default / large
自訂尺寸：自訂 String / 自訂 Number
```

source 中用一個固定陣列決定哪些值屬於預設尺寸：

```js
const sizeList = ['small', 'large', 'default'];
```

之後 `classes` 與 `styles` 會使用這個陣列做分流。

當 `size` 落在 `sizeList` 裡，元件會走「class + Less」路徑。也就是產生像 `ivu-avatar-large`、`ivu-avatar-small`、`ivu-avatar-default` 這樣的 class，並由 `avatar.less` 決定具體尺寸。

當 `size` 不在 `sizeList` 裡，元件會走「inline style」路徑。這時不會產生 `ivu-avatar-64` 這種 class，而是由 `styles` computed 直接寫入 `width`、`height`、`lineHeight`、`fontSize`。

這個分流是本章的核心。它說明元件庫如何同時支援設計系統中的標準尺寸，以及使用者臨時指定的客製尺寸。

---

### 4.2 預設尺寸：`classes` 與 `avatar.less`

`classes` computed 會根據 `size` 是否屬於預設尺寸產生尺寸 class：

```js
[`ivu-avatar-${this.size}`]: oneOf(this.size, sizeList)
```

這表示：

| `size` 輸入 | 是否屬於 `sizeList` | 產生的尺寸 class |
| --- | --- | --- |
| `small` | 是 | `ivu-avatar-small` |
| `default` | 是 | `ivu-avatar-default` |
| `large` | 是 | `ivu-avatar-large` |
| `64` | 否 | 不產生 `ivu-avatar-64` |
| `42` | 否 | 不產生 `ivu-avatar-42` |

預設尺寸的具體視覺效果主要由 `avatar.less` 決定：

```less
.ivu-avatar {
    .avatar-size(@avatar-size-base, @avatar-font-size-base);

    &-large {
        .avatar-size(@avatar-size-lg, @avatar-font-size-lg);
    }

    &-small {
        .avatar-size(@avatar-size-sm, @avatar-font-size-sm);
    }
}
```

尺寸 token 來自 `custom.less`：

```txt
@avatar-size-base: 32px
@avatar-size-lg: 40px
@avatar-size-sm: 24px
@avatar-font-size-base: 18px
@avatar-font-size-lg: 24px
@avatar-font-size-sm: 14px
```

這裡要特別注意 `default`。runtime 會產生 `ivu-avatar-default` class，但 `avatar.less` 中沒有看到獨立的 `&-default` 區塊。原因是 `.ivu-avatar` 根樣式本身已經先套用 base size：

```less
.avatar-size(@avatar-size-base, @avatar-font-size-base);
```

所以 `default` 的主要尺寸來源不是 `ivu-avatar-default` selector，而是 `.ivu-avatar` 根層的 base mixin。`ivu-avatar-default` 比較像是 runtime 狀態上保留的 class，而不是主要尺寸實作入口。

---

### 4.3 自訂尺寸：`styles` computed 與 inline style

當 `size` 不在 `sizeList` 中時，`styles` computed 會直接產生 inline style：

```js
styles () {
    let style = {};
    if (this.size && !oneOf(this.size, sizeList)) {
        style.width = `${this.size}px`;
        style.height = `${this.size}px`;
        style.lineHeight = `${this.size}px`;
        style.fontSize = `${this.size/2}px`;
    }
    return style;
}
```

這段邏輯有幾個重點。

第一，自訂尺寸會同時設定寬、高與行高，讓 avatar 容器維持正方形，並讓文字或 icon 可以依靠 line-height 接近垂直置中。

第二，`fontSize` 會被設定成 `size / 2`。例如 `size` 是 `64`，`fontSize` 就是 `32px`；`size` 是 `42`，`fontSize` 就是 `21px`。

第三，runtime 是直接使用 `${this.size}px` 組 CSS 值。這代表它預期 `size` 最好是可以轉成合理數值的內容。若傳入非數字字串，可能會產生不合理的 CSS 值。這是閱讀原始碼時應該記住的邊界，不應假設它內部有完整格式驗證。

整理如下：

| 輸入 | class 路徑 | inline style 路徑 | 實際意義 |
| --- | --- | --- | --- |
| `size="large"` | 產生 `ivu-avatar-large` | 無自訂尺寸 style | 使用設計系統的大尺寸。 |
| `size="default"` | 產生 `ivu-avatar-default` | 無自訂尺寸 style | 使用 `.ivu-avatar` 根層 base size。 |
| `size="small"` | 產生 `ivu-avatar-small` | 無自訂尺寸 style | 使用設計系統的小尺寸。 |
| `size="64"` | 不產生 `ivu-avatar-64` | `64px` 寬高與 `32px` 字體 | 使用自訂尺寸。 |
| `:size="42"` | 不產生 `ivu-avatar-42` | `42px` 寬高與 `21px` 字體 | 使用自訂數字尺寸。 |

這也解釋了為什麼官方 example 可以寫出類似以下使用方式：

```vue
<Avatar src="..." size="64" shape="square" />
<Avatar size="42">U</Avatar>
```

雖然 TypeScript declaration 可能只描述 `large`、`small`、`default`，但 runtime 實際可以處理數字尺寸或可轉成數字概念的字串尺寸。

---

### 4.4 形狀樣式：`circle` 與 `square`

`shape` 會產生以下 class：

```txt
ivu-avatar-circle
ivu-avatar-square
```

但實際閱讀 Less 時，要注意「圓形」與「方形」不是對稱實作。

`.avatar-size()` mixin 預設會給 avatar 圓形外觀：

```less
.avatar-size(@size, @font-size) {
    width: @size;
    height: @size;
    line-height: @size;
    border-radius: 50%;
}
```

這代表 `circle` 的效果主要來自所有尺寸共用的 mixin，也就是 `border-radius: 50%`。換句話說，圓形是預設行為。

`square` 則是透過 class 覆蓋圓形：

```less
&-square {
    border-radius: @avatar-border-radius;
}
```

因此可以把形狀理解成：

| `shape` | class | 實際效果來源 | 閱讀重點 |
| --- | --- | --- | --- |
| `circle` | `ivu-avatar-circle` | `.avatar-size()` 預設 `border-radius: 50%` | 圓形是 base 行為。 |
| `square` | `ivu-avatar-square` | `&-square` 覆蓋 `border-radius` | 方形是覆蓋行為。 |

這種設計在元件庫中很常見：預設樣式放在 base mixin，特殊變體透過 class override。

---

### 4.5 圖片與 icon 狀態樣式

當 `src` 有值時，`Avatar` 會進入圖片模式，同時 `classes` 會產生：

```js
'ivu-avatar-image': !!this.src
```

對應 Less：

```less
&-image{
    background: transparent;
}
```

圖片元素本身則填滿 avatar 容器：

```less
& > img {
    width: 100%;
    height: 100%;
}
```

這裡沒有看到 `object-fit` 類型的處理。因此根據目前筆記中的 source 片段，圖片如何裁切或變形主要取決於原圖比例與瀏覽器對 `width: 100%; height: 100%;` 的拉伸行為。閱讀時不要自行推測它一定會維持比例裁切，除非後續原始碼或 CSS 另有補充。

當 `icon` 或 `customIcon` 有值時，`classes` 會產生：

```js
'ivu-avatar-icon': !!this.icon || !!this.customIcon
```

icon 模式下，`Avatar` 不自己產生 icon DOM，而是組合內部 `Icon` 元件。`avatar.less` 主要負責讓 avatar 根節點在 icon 狀態下有合適字體大小：

```less
&.@{avatar-prefix-cls}-icon {
    font-size: @font-size;
}
```

此外，Less 對 `.ivu-icon` 做了微調：

```less
.ivu-icon{
    position: relative;
    top: -1px;
}

&-large {
    .ivu-icon{
        position: relative;
        top: -2px;
    }
}
```

這表示 icon 的最終視覺不是只由 `Icon` 元件決定，也不是只由 `Avatar` 決定，而是兩者組合後再由 `avatar.less` 做局部修正。

---

### 4.6 文字頭像：為什麼需要 DOM measurement

default slot 文字頭像的 template 大致如下：

```vue
<span
    ref="children"
    :class="[prefixCls + '-string']"
    :style="childrenStyle"
    v-else
>
    <slot></slot>
</span>
```

文字頭像的問題在於：使用者可能傳入一個字，也可能傳入多個字。頭像容器通常是固定寬度，如果文字太長，就會超出容器。單靠 CSS 雖然可以使用 `overflow: hidden` 或縮小字體，但這樣無法根據實際文字寬度精準調整比例。

因此 `Avatar` 使用 DOM measurement。流程可以理解成：

```txt
mounted / updated / size watcher
  -> setScale()
  -> 讀取 children.offsetWidth
  -> 讀取 avatar.getBoundingClientRect().width
  -> 比較文字寬度與容器可用寬度
  -> 更新 scale
  -> childrenStyle 寫入 transform: scale(...)
```

`setScale()` 的核心邏輯如下：

```js
setScale () {
    this.isSlotShow = !this.src && !this.icon;
    if (this.$refs.children) {
        this.childrenWidth = this.$refs.children.offsetWidth;
        const avatarWidth = this.$el.getBoundingClientRect().width;
        if (avatarWidth - 8 < this.childrenWidth) {
            this.scale = (avatarWidth - 8) / this.childrenWidth;
        } else {
            this.scale = 1;
        }
    }
}
```

這裡的 `avatarWidth - 8` 代表保留左右空間。原始筆記指出 source 註解有提到左右各保留 `4px`，避免文字貼邊。

整理成公式：

```txt
如果 childrenWidth <= avatarWidth - 8
  scale = 1

如果 childrenWidth > avatarWidth - 8
  scale = (avatarWidth - 8) / childrenWidth
```

這種設計的重點是：只有文字真的超過可用寬度時才縮放，否則維持原本比例。

---

### 4.7 `childrenStyle`：縮放與水平置中

計算出 `scale` 後，`childrenStyle` 會把結果轉成 style：

```js
{
    msTransform: `scale(${this.scale})`,
    WebkitTransform: `scale(${this.scale})`,
    transform: `scale(${this.scale})`,
    position: 'absolute',
    display: 'inline-block',
    left: `calc(50% - ${Math.round(this.childrenWidth / 2)}px)`
}
```

這裡有兩個重要細節。

第一，縮放使用的是 `transform: scale(...)`，不是直接修改 `font-size`。這代表文字的基礎字體大小仍然由 avatar 尺寸系統決定，runtime 只在文字過寬時做視覺比例縮放。

第二，水平置中不是靠 flex，也不是靠 `text-align`。它採用 absolute positioning，並使用：

```css
left: calc(50% - childrenWidth / 2)
```

概念上就是：

```txt
avatar 中心點 = 50%
文字左邊位置 = avatar 中心點 - 文字寬度的一半
```

如此可以讓文字的中心與 avatar 的中心對齊。因為 `childrenWidth` 是 runtime 測量出來的，所以這個位置也必須由 runtime style 寫入。

---

### 4.8 重新計算時機

`Avatar` 會在三個時機重新計算文字縮放。

| 時機 | source 行為 | 為什麼需要 |
| --- | --- | --- |
| 掛載後 | `mounted() { this.setScale(); }` | 初次 DOM 已經存在，可以測量文字與容器寬度。 |
| `size` 改變 | `watch: { size (...) { this.setScale(); } }` | avatar 寬度改變，原本的縮放比例可能不再適用。 |
| 元件更新後 | `updated()` | slot 內容或其他狀態更新後，文字寬度可能改變。 |

這個設計說明一件事：`childrenStyle` 雖然是 computed style，但它依賴的 `childrenWidth` 與 `scale` 是由 DOM 測量後更新的資料。也就是說，完整資料流不是「computed 自己算完」，而是：

```txt
DOM render
  -> lifecycle / watcher
  -> setScale() 測量 DOM
  -> 更新 scale / childrenWidth
  -> childrenStyle 根據資料輸出 style
```

這也是為什麼閱讀這段原始碼時，必須同時看 `template`、`data`、`computed`、`methods`、`watch`、`mounted`、`updated`。

---

## 5. 表格整理

### 5.1 視覺相關 runtime 成員表

| 成員 | 類型 | 負責職責 | 閱讀重點 |
| --- | --- | --- | --- |
| `size` | prop | 接收預設尺寸或自訂尺寸 | 是否屬於 `sizeList` 決定走 class 或 inline style。 |
| `shape` | prop | 決定圓形或方形 | `circle` 主要是 base mixin，`square` 是 override。 |
| `classes` | computed | 產生根節點 class | 同時處理 shape、image、icon、預設 size。 |
| `styles` | computed | 產生自訂尺寸 inline style | 只在 `size` 不屬於 `sizeList` 時生效。 |
| `childrenStyle` | computed | 產生文字縮放與置中 style | 依賴 `scale` 與 `childrenWidth`。 |
| `setScale()` | method | 測量文字與 avatar 寬度並更新縮放比例 | 需要 DOM 存在後才能正確執行。 |
| `mounted()` | lifecycle | 初次測量 | 首次渲染後計算文字縮放。 |
| `updated()` | lifecycle | 更新後重新測量 | 處理 slot 文字或狀態更新。 |
| `size` watcher | watcher | 尺寸變更時重新測量 | 頭像寬度改變後需要重算 `scale`。 |

### 5.2 Less selector / mixin 責任表

| Less 區塊 | 負責職責 | 閱讀重點 |
| --- | --- | --- |
| `.ivu-avatar` | 根節點基礎樣式與 base size | `default` 尺寸主要來自這裡。 |
| `.avatar-size(@size, @font-size)` | 寬、高、行高、圓形、icon 字體大小 | 預設尺寸的核心 mixin。 |
| `.ivu-avatar-large` | 大尺寸樣式 | 使用 `@avatar-size-lg` 與 `@avatar-font-size-lg`。 |
| `.ivu-avatar-small` | 小尺寸樣式 | 使用 `@avatar-size-sm` 與 `@avatar-font-size-sm`。 |
| `.ivu-avatar-square` | 方形外觀 | 覆蓋 base 圓形的 `border-radius`。 |
| `.ivu-avatar-image` | 圖片模式背景 | 將背景改為 transparent。 |
| `.ivu-avatar > img` | 圖片尺寸 | 圖片寬高填滿 avatar 容器。 |
| `.ivu-avatar .ivu-icon` | icon 垂直位置 | 對 icon 做小幅度 top 微調。 |

### 5.3 尺寸輸入結果對照表

| 寫法 | 分流結果 | 主要樣式來源 | 最終效果 |
| --- | --- | --- | --- |
| `<Avatar size="large" />` | 預設尺寸 | `ivu-avatar-large` + `avatar.less` | 大尺寸頭像。 |
| `<Avatar size="default" />` | 預設尺寸 | `.ivu-avatar` base mixin | 預設尺寸頭像。 |
| `<Avatar size="small" />` | 預設尺寸 | `ivu-avatar-small` + `avatar.less` | 小尺寸頭像。 |
| `<Avatar size="64" />` | 自訂尺寸 | `styles` inline style | `64px` 寬高，`32px` 字體。 |
| `<Avatar :size="42" />` | 自訂尺寸 | `styles` inline style | `42px` 寬高，`21px` 字體。 |

表格中的關鍵關係是：**預設尺寸是設計系統路徑，自訂尺寸是 runtime 路徑**。這兩條路徑都由同一個 `size` prop 觸發，但落到不同的實作層。

---

## 6. 範例或情境說明

### 6.1 預設尺寸情境

當使用者寫：

```vue
<Avatar size="large" icon="ios-person" />
```

閱讀流程應該是：

```txt
size = large
  -> oneOf(size, sizeList) 為 true
  -> classes 產生 ivu-avatar-large
  -> styles 不產生自訂尺寸
  -> avatar.less 的 &-large 套用大尺寸 token
```

這個情境代表使用者選擇元件庫預設設計規格。

---

### 6.2 自訂尺寸情境

當使用者寫：

```vue
<Avatar :size="42">U</Avatar>
```

閱讀流程應該是：

```txt
size = 42
  -> oneOf(size, sizeList) 為 false
  -> classes 不產生 ivu-avatar-42
  -> styles 寫入 width / height / lineHeight = 42px
  -> styles 寫入 fontSize = 21px
  -> 如果 slot 文字太寬，setScale() 再進一步縮放
```

這個情境代表使用者跳出設計系統預設尺寸，要求一個臨時尺寸。元件用 inline style 支援這種彈性。

---

### 6.3 文字太長情境

假設使用者寫：

```vue
<Avatar>USER</Avatar>
```

如果頭像寬度是 `32px`，而文字 `USER` 實際寬度超過 `24px`，也就是 `avatarWidth - 8`，那麼 `setScale()` 會讓：

```txt
scale = 24 / childrenWidth
```

接著 `childrenStyle` 會輸出：

```css
transform: scale(...);
position: absolute;
left: calc(50% - ...px);
```

所以文字不會直接溢出，而是被縮放到保留左右邊距的範圍內。

---

## 7. 閱讀路線或學習路線

第一次閱讀 `Avatar` 視覺系統時，建議不要直接從 `avatar.less` 開始，也不要只看 template。比較好的路線如下。

1. 先看 `size` prop 與 `sizeList`，確認 runtime 如何判斷預設尺寸與自訂尺寸。
2. 再看 `classes`，理解哪些狀態會被轉成 class，例如 `shape`、`src`、`icon`、預設 `size`。
3. 接著看 `styles`，理解自訂尺寸如何被轉成 inline style。
4. 然後對照 `avatar.less`，確認 `ivu-avatar`、`ivu-avatar-large`、`ivu-avatar-small`、`ivu-avatar-square`、`ivu-avatar-image` 的樣式責任。
5. 接著看 default slot branch，找到 `ref="children"` 與 `childrenStyle`。
6. 最後讀 `setScale()`、`mounted()`、`updated()` 與 `size` watcher，串起文字縮放的完整資料流。

如果只是想快速知道 API 怎麼用，可以先看 example；但如果目標是學元件庫設計，應該把 runtime 與 style system 對照閱讀。

---

## 8. 常見誤區

| 誤區 | 為什麼容易誤解 | 正確理解 |
| --- | --- | --- |
| `size` 只是產生 CSS class | 預設尺寸確實會產生 class | 只有 `small/default/large` 走 class；自訂尺寸走 inline style。 |
| `default` 尺寸靠 `ivu-avatar-default` 實作 | runtime 會產生這個 class | 主要尺寸來自 `.ivu-avatar` 根層 base mixin。 |
| `circle` 一定有獨立 selector 控制圓形 | runtime 會產生 `ivu-avatar-circle` | 圓形效果主要來自 `.avatar-size()` 的 `border-radius: 50%`。 |
| 文字縮放是純 CSS | 最後確實是由 `transform` 呈現 | 縮放比例需要 `setScale()` 測量 DOM 後計算。 |
| `childrenStyle` 可以在 render 前完全算出來 | 它是 computed style | 它依賴 `childrenWidth`，而 `childrenWidth` 需要 DOM 測量。 |
| 圖片一定會等比例裁切 | 圖片寬高都是 100% | 目前筆記中的 source 沒有看到 `object-fit`，不能自行推測裁切策略。 |
| 自訂尺寸一定安全 | runtime 支援非預設尺寸 | 若傳入非數字字串，可能產生不合理 CSS 值。 |
| icon 完全由 `Icon` 元件決定 | template 使用 `Icon` 元件 | `avatar.less` 仍會透過 `ivu-avatar-icon` 與 `.ivu-icon` 做外層樣式調整。 |

---

## 9. 本章總結

`Avatar` 的視覺系統可以用「規格路徑」與「動態路徑」兩個角度理解。

規格路徑指的是 `small`、`default`、`large` 這類元件庫預設尺寸。這些值會由 `classes` 轉成 class，再交給 `avatar.less` 的 mixin 和 token 產生穩定樣式。這是設計系統最常見的做法，因為它能讓所有元件維持一致的尺寸規範。

動態路徑指的是自訂 `size` 與文字縮放。自訂 `size` 無法事先在 CSS 中窮舉，因此交給 `styles` computed 產生 inline style。文字縮放則更進一步依賴 DOM measurement，必須在 mounted、updated 或 size 改變後測量實際寬度，才能決定 `scale`。

因此，閱讀 `Avatar` 時要避免只看單一檔案。`Avatar` 的完整視覺行為同時分散在 runtime computed、methods、lifecycle、watcher 與 Less 樣式中。這正是元件庫原始碼閱讀的關鍵能力：不是只找某個 API，而是把 props、class、style、DOM 與 CSS token 串成一條完整資料流。

---

## 10. 自我檢查問題

1. `size="large"` 和 `size="64"` 分別會走哪一條樣式路徑？
2. `sizeList` 在 `Avatar` 的尺寸系統中扮演什麼角色？
3. 為什麼 `default` 尺寸即使產生 `ivu-avatar-default`，主要尺寸仍來自 `.ivu-avatar` 根樣式？
4. `styles` computed 在自訂尺寸時會寫入哪些 inline style？
5. `shape="square"` 是如何覆蓋預設圓形外觀的？
6. 圖片模式下，`ivu-avatar-image` 與 `img { width: 100%; height: 100%; }` 分別負責什麼？
7. icon 模式下，`Avatar` 和 `Icon` 元件各自負責什麼？
8. default slot 文字太寬時，`scale` 的計算公式是什麼？
9. `childrenStyle` 為什麼需要同時設定 `transform`、`position` 與 `left`？
10. 哪些 lifecycle 或 watcher 會觸發 `setScale()`？

---

## 11. 後續延伸方向

這篇筆記後續可以拆成幾個更深入的主題：

1. `Avatar` 的 public contract 與 TypeScript declaration 落差分析。
2. `Avatar` 的 template branch 與圖片錯誤 fallback 邊界。
3. `AvatarList` 的列表聚合、Tooltip 包裹與 excess avatar 規則。
4. `Avatar` 與 `Icon` 元件的組合關係。
5. `View UI Plus` 的 Less token、mixin 與主題化機制。
6. 元件庫中 runtime inline style 與 CSS class 的設計取捨。
7. 需要 DOM measurement 的元件設計模式，例如文字縮放、彈出層定位、虛擬列表尺寸測量。
8. TypeScript declaration 如何更完整描述 runtime 支援的自訂尺寸。
