# Avatar Size Style And Text Scaling：尺寸、樣式與文字縮放

## 0. 原始筆記問題分析

原本筆記只說要看 `avatar.less`，但 `Avatar` 的尺寸行為不能只靠 less 理解。它同時有三條路徑：

1. 預設尺寸：`small`、`default`、`large` 走 class 與 `avatar.less` mixin。
2. 自訂尺寸：數字或非預設字串走 inline style。
3. 文字頭像：default slot 渲染後，再用 DOM measurement 決定是否縮放。

這三條路徑混在一起，容易讓人誤以為 `size` 只是單純 class 名稱，或誤以為文字縮放是純 CSS 完成。

## 1. 本章定位

本章專門分析 `Avatar` 的視覺系統：`classes`、`styles`、`childrenStyle`、`setScale()` 與 `avatar.less` 如何合作。

本章不重複展開 `src`、`icon`、slot 的內容優先序。內容 branch 請先讀 `02-avatar-public-contract-and-content-priority.md`。

## 2. 尺寸來源總覽

`Avatar` 的尺寸輸入只有一個 prop：`size`。

runtime 支援：

```txt
small / default / large
自訂 String
自訂 Number
```

但它會分成兩條樣式路徑：

```txt
size in ['small', 'large', 'default']
  -> ivu-avatar-{size} class
  -> avatar.less

其他 size
  -> inline style width / height / lineHeight / fontSize
```

這裡的判斷由同一份 `sizeList` 控制：

```js
const sizeList = ['small', 'large', 'default'];
```

## 3. 預設尺寸 class 路徑

`classes` computed 會在 `size` 是預設值時加上尺寸 class：

```js
[`ivu-avatar-${this.size}`]: oneOf(this.size, sizeList)
```

`avatar.less` 則定義預設尺寸：

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

`default` 沒有單獨的 less 區塊，因為 `.ivu-avatar` 根樣式已經套用了 base size。`ivu-avatar-default` class 仍會產生，但主要尺寸來自根層 mixin。

## 4. 自訂尺寸 inline style 路徑

當 `size` 不在 `sizeList` 中時，`styles` computed 會直接寫 inline style：

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

整理成表格：

| 輸入 | class | inline style |
| --- | --- | --- |
| `size="large"` | `ivu-avatar-large` | 無自訂尺寸 style。 |
| `size="default"` | `ivu-avatar-default` | 無自訂尺寸 style。 |
| `size="small"` | `ivu-avatar-small` | 無自訂尺寸 style。 |
| `size="64"` | 不產生 `ivu-avatar-64` | width / height / lineHeight 為 `64px`，fontSize 為 `32px`。 |
| `:size="42"` | 不產生 `ivu-avatar-42` | width / height / lineHeight 為 `42px`，fontSize 為 `21px`。 |

這也解釋了為什麼官方 example 可以使用：

```vue
<Avatar src="..." size="64" shape="square" />
<Avatar size="42">U</Avatar>
```

雖然 `.d.ts` 沒有描述數字尺寸，runtime 仍然支援。

## 5. 形狀樣式

`shape` 會產生：

```txt
ivu-avatar-circle
ivu-avatar-square
```

`avatar.less` 中真正改變形狀的是兩個地方。

第一，`.avatar-size()` mixin 預設給所有尺寸 `border-radius: 50%`：

```less
.avatar-size(@size, @font-size) {
    width: @size;
    height: @size;
    line-height: @size;
    border-radius: 50%;
}
```

第二，`square` class 覆蓋成小圓角：

```less
&-square {
    border-radius: @avatar-border-radius;
}
```

因此 `circle` 的效果主要來自 base size mixin，不是來自一段獨立的 `.ivu-avatar-circle` selector。`square` 則需要 class override。

## 6. 圖片與 icon 樣式

圖片模式會產生 `ivu-avatar-image`：

```less
&-image{
    background: transparent;
}
```

圖片本身填滿容器：

```less
& > img {
    width: 100%;
    height: 100%;
}
```

這裡沒有看到 `object-fit`，所以圖片如何裁切或變形主要取決於原圖比例與瀏覽器對寬高拉伸的處理。

icon 模式會產生 `ivu-avatar-icon`，並由 size mixin 控制 icon 字體大小：

```less
&.@{avatar-prefix-cls}-icon {
    font-size: @font-size;
}
```

此外，`avatar.less` 對 `.ivu-icon` 做了細微的垂直位置調整：

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

所以 icon 的最終呈現同時由 `Avatar` 根 class、`avatar.less` 和 `Icon` 元件自己的 class system 共同決定。

## 7. 文字縮放資料流

文字頭像是 default slot branch：

```vue
<span ref="children" :class="[prefixCls + '-string']" :style="childrenStyle" v-else><slot></slot></span>
```

它的縮放資料流是：

```txt
mounted / updated / size watcher
  -> setScale()
  -> measure children width and avatar width
  -> update childrenWidth and scale
  -> childrenStyle writes transform and left
```

`setScale()` 的核心邏輯：

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

整理成規則：

| 條件 | `scale` |
| --- | --- |
| slot 文字寬度小於等於 `avatarWidth - 8` | `1` |
| slot 文字寬度大於 `avatarWidth - 8` | `(avatarWidth - 8) / childrenWidth` |

source 註解說這裡保留左右各 4px 的空間，避免文字貼邊。

## 8. `childrenStyle` 如何置中縮放文字

當 `isSlotShow` 為 true 時，`childrenStyle` 會寫入：

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

這裡有兩個重點。

第一，縮放是透過 transform 完成，不是改 font-size。這樣可以保留原本尺寸系統，只在文字內容太寬時做比例縮放。

第二，水平置中不是靠 flex，而是把文字設成 absolute，再用 `left: calc(50% - childrenWidth / 2)` 讓文字中心對齊 avatar 中心。

## 9. 重新計算時機

`Avatar` 會在三個時機重新計算文字縮放：

| 時機 | source | 用途 |
| --- | --- | --- |
| 掛載後 | `mounted() { this.setScale(); }` | 初次取得 DOM 寬度。 |
| `size` 改變 | `watch: { size (...) { this.setScale(); } }` | 頭像尺寸變更後重新縮放文字。 |
| 元件更新後 | `updated()` | default slot 內容變更時重新縮放文字。 |

這也說明為什麼文字縮放不能只從 template 或 less 看懂。它依賴實際 DOM 寬度，必須等 mounted / updated 之後才能計算。

## 10. 細節邊界

有幾個細節閱讀時要分清楚。

| 細節 | 正確理解 |
| --- | --- |
| `isSlotShow = !this.src && !this.icon` | source 沒有把 `customIcon` 放進判斷，但 custom icon branch 不會渲染 `children` ref，所以不會實際套到文字節點。 |
| `ivu-avatar-default` | runtime 會產生，但 base 尺寸主要來自 `.ivu-avatar` 根樣式。 |
| 自訂尺寸 | runtime 會把 `size` 直接拼成 px；傳入非數字字串會產生不合理的 CSS 值。 |
| 圖片樣式 | 圖片寬高 100%，但 source 沒有額外 object-fit 邏輯。 |
| 文字縮放 | 只處理 default slot branch，不處理圖片或 icon branch。 |

## 11. 本章總結

`Avatar` 的視覺系統可以拆成兩層：預設尺寸與形狀主要由 class + less 完成，自訂尺寸與文字縮放則由 runtime computed style 完成。文字頭像是這個元件最值得讀的部分，因為它需要等 DOM 渲染後測量寬度，再把結果回寫到 style。

這類模式在元件庫中很常見：CSS 負責穩定規格，runtime 負責需要動態測量或由使用者輸入決定的例外情境。

## 12. 自我檢查問題

1. `size="large"` 和 `size="64"` 分別走哪一條樣式路徑？
2. 為什麼 `default` 尺寸即使產生 `ivu-avatar-default`，主要尺寸仍來自根樣式？
3. `shape="square"` 是如何覆蓋預設圓形的？
4. slot 文字太寬時，`scale` 的計算公式是什麼？
5. `childrenStyle` 如何把縮放後的文字水平置中？
6. 哪些 lifecycle / watcher 會觸發 `setScale()`？
