# 模仿 View UI Plus Icon：props、class、style 的封裝練習

## 1. 學習背景

這個 `apps/01-clone-practice/src/components/my-icon/my-icon.vue` 組件是參考 View UI Plus 的 `Icon` 組件設計思路後，自己實作的簡化練習版本。

這裡的「模仿」不是逐行還原 View UI Plus 官方原始碼，而是借用它的封裝方向，再配合自己的 iconfont 資源做練習。

這份筆記的重點不是完整解析 View UI Plus 官方原始碼，而是透過一個小型 Icon 組件，理解 UI 組件庫常見的封裝思路：

```text
圖標資源 → Less 樣式加工 → Vue 組件封裝 → props 控制 class / style
```

也就是說：

```
View UI Plus Icon = 參考來源
MyIcon = 練習主體
學習重點 = props 如何轉換成 class 與 style
```

---

## 2. 組件目標

Icon 組件本身不直接畫圖示，而是包裝一個 `<i>` 標籤。

它的主要職責是：

1. 根據 `type` 產生內建 icon class
2. 根據 `custom` 支援第三方 icon class
3. 根據 `size` 控制 icon 大小
4. 根據 `color` 控制 icon 顏色
5. 處理 `type` 和 `custom` 同時存在時的優先順序

所以這個組件可以理解成：

```text
使用者傳入 props
↓
組件計算 class 和 style
↓
渲染成 i 標籤
```

---

## 3. 使用範例

### 3.1 使用內建 icon

```vue
<MyIcon type="check-circle" :size="24" color="#19be6b" />
```

最後會渲染成類似：

```html
<i
  class="my-icon my-icon-check-circle"
  style="font-size: 24px; color: #19be6b;"
></i>
```

### 3.2 使用第三方 icon

```vue
<MyIcon custom="iconfont icon-EURO" />
```

最後會渲染成類似：

```html
<i class="iconfont icon-EURO"></i>
```

這裡的 `iconfont icon-EURO` 不屬於內建的 `my-icon` iconfont 系統，而是外部第三方 iconfont class。`custom` 只負責把外部 class 原樣交給 `<i>`，真正能不能顯示圖標，取決於外部樣式是否已經被載入。

在目前範例頁中，這份外部樣式是由 `apps/01-clone-practice/examples/main.js` 引入：

```js
import './style/iconfont.less';
```

---

## 4. 內建 my-icon 的 Iconfont 樣式來源

這次練習中的內建 icon 圖形不是由 `my-icon.vue` 直接畫出來的，而是先從 Iconfont 下載字體圖標，再整理成本地樣式。

以下檔案負責的是內建的 `my-icon` iconfont 系統：

- `apps/01-clone-practice/src/style/common/iconfont/fonts/iconfont.ttf`
- `apps/01-clone-practice/src/style/common/iconfont/_icons.less`
- `apps/01-clone-practice/src/style/common/iconfont/_variables.less`
- `apps/01-clone-practice/src/style/common/iconfont/iconfont.less`


### 4.1 從 Iconfont 下載圖標

先到 Iconfont 選擇需要的圖標，例如：

```text
check-circle
ci
dollar
compass
close-circle
```

下載後可能會得到類似以下檔案：

```text
iconfont.css
iconfont.ttf
iconfont.woff
iconfont.woff2
```

內建的 `my-icon` 系統目前實際只使用 `iconfont.ttf`，並整理到：

```text
apps/01-clone-practice/src/style/common/iconfont/
  fonts/
    iconfont.ttf
  _icons.less
  _variables.less
  iconfont.less
```

如果之後要做得更接近正式組件庫，也可以保留 `woff`、`woff2` 等格式，讓瀏覽器有更多字體格式可以選擇。例如：

```text
src/
  style/
    common/
      iconfont/
        fonts/
          iconfont.ttf
          iconfont.woff
          iconfont.woff2
        _icons.less
        _variables.less
        iconfont.less
```

---

### 4.2 將 CSS 轉為 Less

Iconfont 下載下來通常是 `.css`，但如果專案主要使用 Less，可以將它改成：

```text
iconfont.css → iconfont.less
```

這樣之後可以和組件庫自己的樣式系統整合。

---

### 4.3 統一類名前綴

Iconfont 預設可能會產生：

```css
.iconfont {}
.icon-check-circle::before {}
```

在自己的組件庫中，為了避免和其他專案或第三方 icon class 衝突，可以改成：

```css
.my-icon {}
.my-icon-check-circle::before {}
```

這樣命名會更像組件庫自己的 icon 系統。

---

### 4.4 定義 font-family

Iconfont 的核心是透過 `@font-face` 載入字體檔，再透過 `content` 指定圖標編碼。

範例：

```less
@my-icon-font-family: "my-iconfont";

@font-face {
  font-family: @my-icon-font-family;
  src: url('./fonts/iconfont.ttf') format('truetype');
}

.my-icon {
  font-family: @my-icon-font-family !important;
  font-style: normal;
  font-weight: normal;
  line-height: 1;
  display: inline-block;
  text-rendering: auto;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.my-icon-check-circle::before {
  content: '\e77d';
}

.my-icon-ci::before {
  content: '\e77e';
}

.my-icon-dollar::before {
  content: '\e77f';
}
```

這裡真正讓 `<i>` 顯示成圖標的關鍵是：

```text
.my-icon 提供 font-family，也就是 my-iconfont 這套字體
.my-icon-check-circle::before 提供 content 編碼
```

所以：

```html
<i class="my-icon my-icon-check-circle"></i>
```

能顯示圖標，是因為它同時具備：

```text
基礎字體類名：my-icon
具體圖標類名：my-icon-check-circle
```

---

## 5. Props API 設計

| props | 型別 | 預設值 | 用途 |
|---|---|---|---|
| `type` | `String` | `''` | 使用內建 icon，例如 `check-circle` |
| `size` | `Number / String` | `''` | 設定 icon 大小 |
| `color` | `String` | `''` | 設定 icon 顏色 |
| `custom` | `String` | `''` | 使用第三方 icon class |

### 設計重點

`type` 適合使用組件庫內建 icon。

```vue
<MyIcon type="check-circle" />
```

`custom` 適合接入第三方 iconfont。

```vue
<MyIcon custom="iconfont icon-EURO" />
```

也就是：

```text
type   → 組件庫內建規則
custom → 外部自定義 class
```

---

## 6. class 封裝邏輯

```js
const classes = computed(() => {
    if (props.custom) {
        return props.custom
    }

    return [
        'my-icon',
        props.type ? `my-icon-${props.type}` : ''
    ].filter(Boolean)
})
```

這段是 Icon 組件的核心之一。

它把 `props.type` 或 `props.custom` 轉換成 `<i>` 標籤需要的 class。

---

### 6.1 custom 模式

如果傳入 `custom`：

```vue
<MyIcon custom="iconfont icon-EURO" />
```

則直接回傳：

```js
return props.custom
```

代表外部可以完全控制 icon 的 class。

這種設計可以讓組件支援第三方 iconfont 或其他 icon class。

這是這次練習版的簡化設計：只要傳了 `custom`，就不再自動加上 `my-icon` 和 `my-icon-${type}`。View UI Plus 原版的做法不同，它會保留基礎的 `ivu-icon` class，再額外加上 `custom` class。

---

### 6.2 type 模式

如果沒有傳入 `custom`，則使用內建 icon 規則：

```js
return [
    'my-icon',
    props.type ? `my-icon-${props.type}` : ''
].filter(Boolean)
```

例如：

```vue
<MyIcon type="check-circle" />
```

會產生：

```html
<i class="my-icon my-icon-check-circle"></i>
```

這代表 `type` 不需要傳完整 class，只需要傳入 icon 名稱即可。

---

### 6.3 為什麼要使用 `.filter(Boolean)`？

當 `type` 為空字串時，陣列可能會變成：

```js
['my-icon', '']
```

使用 `.filter(Boolean)` 可以移除空字串，避免產生無意義的 class。

也就是：

```js
['my-icon', ''].filter(Boolean)
// 結果：['my-icon']
```

---

## 7. style 封裝邏輯

```js
const styles = computed(() => {
    const style = {}

    if (props.size) {
        style.fontSize = typeof props.size === 'number'
            ? `${props.size}px`
            : props.size
    }

    if (props.color) {
        style.color = props.color
    }

    return style
})
```

這段是把 `size` 和 `color` 轉換成 inline style。

也就是：

```text
size  → fontSize
color → color
```

---

### 7.1 size 的處理

如果 `size` 是數字：

```vue
<MyIcon :size="24" />
```

會轉成：

```js
{
  fontSize: '24px'
}
```

如果 `size` 是字串：

```vue
<MyIcon size="2em" />
```

會保留原本單位：

```js
{
  fontSize: '2em'
}
```

這樣設計的好處是：

```text
傳 Number → 使用方便，自動補 px
傳 String → 保留彈性，可以使用 px、em、rem 等單位
```

這裡也是練習版自己的處理方式。View UI Plus 原版會直接把 `size` 組成 `${size}px`，所以如果傳入 `size="2em"`，會得到類似 `font-size: 2empx` 的結果，不會像這個版本一樣保留原本單位。

---

### 7.2 color 的處理

```vue
<MyIcon color="#19be6b" />
```

會轉成：

```js
{
  color: '#19be6b'
}
```

因為 icon 通常是透過字體或 SVG 呈現，所以可以使用 CSS 的 `color` 控制顏色。

---

## 8. type 與 custom 的優先順序

```js
watchEffect(() => {
    if (props.type && props.custom) {
        console.warn('[MyIcon] type 和 custom 不能同時使用，custom 會優先。')
    }
})
```

`type` 和 `custom` 都會影響 icon class。

但是兩者的設計目的不同：

```text
type   → 使用內建 icon
custom → 使用第三方 icon class
```

如果兩者同時存在，容易造成語意混亂。

因此這個組件設計成：

```text
custom 優先於 type
```

這裡說的是 `MyIcon` 這個練習版的規則，不是 View UI Plus 原始碼的完整規則。View UI Plus 原版會把基礎 class、`type` class 和 `custom` class 放在同一個 class 陣列中，而不是讓 `custom` 直接取代 `type`。

例如：

```vue
<MyIcon type="check-circle" custom="iconfont icon-EURO" />
```

在 `MyIcon` 目前實作中，實際上會使用：

```html
<i class="iconfont icon-EURO"></i>
```

同時透過 `console.warn` 提醒開發者不要混用。換成 View UI Plus 原版時，class 會同時包含基礎 class、`type` class 和 `custom` class。

---

## 9. 為什麼使用 computed？

`classes` 和 `styles` 都是根據 props 計算出來的結果。

只要 props 改變，class 和 style 就應該自動更新。

所以適合使用 `computed`。

```text
props 改變
↓
computed 重新計算
↓
畫面自動更新
```

這也是 Vue 組件封裝常見的寫法。

---

## 10. 和 View UI Plus Icon 的設計對照

View UI Plus Icon 給這份練習的啟發是：

1. Icon 組件本身不負責畫 icon
2. Icon 組件負責封裝 class 規則
3. 透過 props 控制 icon 類型、大小、顏色
4. 同時保留 `custom` 擴充能力

我的 `MyIcon` 是根據這個思路實作出的簡化版。

但具體實作上，我有幾個地方刻意簡化或調整：

| 對照項目 | View UI Plus 原版 | MyIcon 練習版 |
|---|---|---|
| class 前綴 | `ivu-icon` | `my-icon` |
| icon 資源 | Ionicons | Iconfont 阿里圖標庫 |
| `custom` 行為 | 保留基礎 class，並同時加入 `type` class 與 `custom` class | `custom` 優先，直接回傳外部 class |
| `size` 處理 | 直接組成 `${size}px` | Number 補 `px`，String 保留原本單位 |
| 筆記定位 | 官方源碼可參考對象 | 仿寫與封裝思路練習 |

因此這份筆記的定位不是：

```text
View UI Plus Icon 官方源碼解析
```

而是：

```text
模仿 View UI Plus Icon 的簡化練習筆記
```

也可以理解成：

```text
View UI Plus Icon = 參考來源
MyIcon = 練習主體
```

---

## 11. 設計心得

這個 Icon 組件的核心不是畫 icon，而是建立一套穩定的使用規則。

它把使用者傳入的 props：

```js
type
size
color
custom
```

轉換成 `<i>` 標籤需要的：

```js
class
style
```

所以整個組件可以理解成：

```text
props → computed → class / style → DOM
```

這也是很多 UI 組件庫的基本設計方式。

元件本身不一定要複雜，重點是要把使用方式封裝得穩定、清楚、可擴充。

---
