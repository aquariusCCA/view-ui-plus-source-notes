# View UI Plus Icon 元件原始碼閱讀筆記：從 Props 到 DOM 輸出

## 0. 原始筆記類型與重構方向

### 0.1 筆記類型判斷

這份筆記主要屬於「原始碼閱讀筆記」，分析對象是 View UI Plus 的 `Icon` 圖標元件在 runtime 階段如何運作。它不是圖標清單，也不是完整 icon font 樣式解析，而是聚焦在一條非常核心的閱讀線：

```txt
props
  -> computed class / computed style
  -> template DOM
  -> CSS icon font 顯示結果
```

同時，這份筆記也帶有一點「API / 設定筆記」的性質，因為 `Icon` 對外提供的四個 props：`type`、`custom`、`size`、`color`，本質上就是使用者操作此元件的 public API。

### 0.2 原始筆記目前已經清楚的地方

原始筆記已經把 `Icon` 的 runtime 行為整理得相當明確，尤其是以下幾點：

- `Icon` 最終輸出固定是 `<i>` 節點。
- `type` 和 `custom` 主要影響 class。
- `size` 和 `color` 主要影響 inline style。
- `Icon` 沒有 slot、methods、emits，行為邊界非常清楚。
- `type` 和 `custom` 可以同時存在，但實務上通常擇一使用。
- `size` 雖然接受 `number | string`，但 runtime 會補上 `px`，因此不適合直接傳入 `1em` 這類 CSS 單位。

這些內容是後續重構時必須保留的核心資訊。

### 0.3 重構時需要補強的地方

為了讓這份筆記更適合長期學習與複習，本章會補強以下方向：

| 補強方向 | 說明 |
| --- | --- |
| 建立閱讀模型 | 不只描述程式碼結果，也先建立「props-to-render」的閱讀框架。 |
| 補上元件庫設計視角 | 說明為什麼 `Icon` 這種小元件仍然是元件庫的重要基礎元件。 |
| 拆清楚 class 與 style 的責任 | 分別說明 `type/custom` 與 `size/color` 的設計分工。 |
| 補上邊界條件 | 例如 `size="1em"`、`size={0}`、`custom` 不會自動載入字體等問題。 |
| 補上排錯路線 | 當圖標沒有顯示時，應該從 props、class、CSS、font file 哪些地方檢查。 |
| 補上複習設計 | 加入自我檢查問題與後續延伸方向，方便放進個人知識庫。 |

### 0.4 資訊不足處

這份筆記主要根據 `Icon` runtime 行為進行整理。若要進一步確認下列內容，需要後續對照 View UI Plus 專案原始碼中的實際檔案：

- `Icon` 在 `Button`、`Tabs`、`Tree`、`Image` 等元件中的完整使用路徑。
- `Icon` 是否在所有版本中都保持相同 props 行為。
- icon font 樣式檔中每一個 `.ivu-icon-xxx:before` 的實際對應內容。
- `custom` 在官方範例或實際專案中的推薦用法與限制。

本章會避免編造未提供的檔案路徑與實作細節，只根據原始筆記提供的資訊與 Vue 元件的一般閱讀方式進行教學化整理。

---

## 1. 本章定位：為什麼要讀 `Icon` 的 props 與 render？

`Icon` 是 View UI Plus 中非常小的基礎元件，但它很適合拿來練習「如何閱讀元件庫原始碼」。

很多人閱讀元件庫時，會期待一開始就看到複雜邏輯，例如事件處理、狀態管理、表單驗證、動畫流程或資料同步。但 `Icon` 正好相反，它幾乎沒有互動邏輯，也沒有複雜分支。它的價值不是演算法，而是「穩定地把 public props 映射到 DOM 與 CSS class」。

換句話說，`Icon` 是一個典型的 props-to-render 元件。使用者傳入 props，元件根據 props 產生 class 與 style，最後由 CSS icon font 決定畫面上要顯示哪個圖標。

本章要回答的核心問題是：

1. `type`、`custom`、`size`、`color` 分別控制什麼？
2. `Icon` 最終輸出什麼 DOM？
3. 為什麼 `Icon` 沒有 slot、methods、emits，仍然是重要的基礎元件？
4. `type` 和 `custom` 同時存在時會發生什麼？
5. 如果圖標沒有顯示，應該從哪幾個層次排查？

---

## 2. 前置觀念：用 props-to-render 模型閱讀元件

閱讀 `Icon` 前，建議先建立一個簡單但非常實用的元件閱讀模型：

```txt
public props
  -> computed class / computed style
  -> template / render output
  -> CSS rule
  -> browser visual result
```

這條線可以幫助你拆解很多 UI 元件。

在 `Icon` 這個元件中，這條線特別乾淨：

| 階段 | 在 `Icon` 中的對應 |
| --- | --- |
| public props | `type`、`custom`、`size`、`color` |
| computed class | `classes` |
| computed style | `styles` |
| template output | `<i :class="classes" :style="styles"></i>` |
| CSS rule | `.ivu-icon`、`.ivu-icon-xxx:before`、自訂 icon class |
| visual result | 畫面上看到的圖標、大小與顏色 |

這種元件的閱讀重點不是「程式碼有多長」，而是「API 和樣式系統之間的映射是否穩定」。元件庫中的很多元件都會依賴這種穩定映射，例如按鈕內的圖標、標籤頁的關閉圖標、樹狀結構的展開圖標、圖片預覽的操作圖標等。

因此，`Icon` 雖然小，但它是一個很好的入口：它讓你看見元件庫如何把「使用者傳入的抽象 API」轉換成「瀏覽器能渲染的 class、style 與 DOM」。

---

## 3. Runtime Overview：`Icon` 的最小元件模型

`Icon` 的 template 非常短：

```vue
<i :class="classes" :style="styles"></i>
```

這一行其實已經揭露了 `Icon` 的三個重要特徵。

### 3.1 固定輸出 `<i>` 節點

`Icon` 不會根據 props 改成 `span`、`svg`、`button` 或其他節點。它的根節點固定是 `<i>`。

這表示它的定位非常單純：它是一個視覺符號節點，而不是互動容器，也不是語意化按鈕。當父元件需要讓圖標可點擊時，通常是父元件決定互動語意，`Icon` 只負責提供視覺節點。

### 3.2 節點內容是空的

`<i>` 內部沒有文字，也沒有 slot：

```html
<i></i>
```

這代表圖標本體不是由 HTML 內容提供，而是由 CSS icon font 系統提供。更具體地說，常見流程是：

```txt
class="ivu-icon ivu-icon-ios-search"
  -> CSS 找到 .ivu-icon-ios-search:before
  -> :before 的 content 產生字形碼
  -> icon font 把字形碼渲染成圖標
```

所以，`Icon` 元件本身不是圖標資料庫，它只是 class 的映射層。

### 3.3 所有變化都集中在 class 與 style

因為 template 只綁定了 `classes` 和 `styles`，所以閱讀 runtime 時，最重要的就是看這兩個 computed：

```txt
props -> classes
props -> styles
```

這種設計讓 `Icon` 很容易被其他元件組合使用。它沒有內部狀態，也不會主動發出事件，不會干涉父層資料流，因此可以被穩定地嵌入到更複雜的元件中。

---

## 4. Props Contract：四個 props 的公開責任

`Icon` 對外主要提供四個 props：

| Prop | Runtime Type | Default | 屬性類型 | 責任 |
| --- | --- | --- | --- | --- |
| `type` | `String` | `''` | class prop | 內建圖標名稱，會產生 `ivu-icon-${type}`。 |
| `custom` | `String` | `''` | class prop | 自訂圖標 class，會原樣加入 class list。 |
| `size` | `[Number, String]` | 無 | style prop | 圖標大小，會轉成 `font-size: ${size}px`。 |
| `color` | `String` | 無 | style prop | 圖標顏色，會轉成 inline `color`。 |

這四個 props 可以分成兩組來理解。

第一組是 class props：`type` 和 `custom`。它們決定 `<i>` 上會有哪些 class，進而連接到內建 icon font 或使用者自訂的 icon font。

第二組是 style props：`size` 和 `color`。它們不負責選擇哪個圖標，而是控制圖標的視覺呈現，例如大小與顏色。

這種分工很重要，因為它可以避免 API 責任混亂。`type` 不應該控制大小，`size` 也不應該控制圖標種類。每個 prop 都只負責一件明確的事情，這也是基礎元件設計中很重要的穩定性來源。

---

## 5. Class 映射規則：`type` 與 `custom` 如何變成 class？

`Icon` 的 `classes` computed 會回傳 Vue class binding 支援的陣列格式。概念上可以整理成：

```js
[
    `${prefixCls}`,
    {
        [`${prefixCls}-${this.type}`]: this.type !== '',
        [`${this.custom}`]: this.custom !== '',
    }
]
```

其中 `prefixCls` 固定為：

```js
const prefixCls = 'ivu-icon';
```

這段程式碼可以分成三個層次理解。

### 5.1 永遠存在的基礎 class：`ivu-icon`

無論使用者有沒有傳入 `type` 或 `custom`，`Icon` 都會加上基礎 class：

```html
<i class="ivu-icon"></i>
```

`ivu-icon` 通常負責提供 icon font 的基礎樣式，例如字體家族、字體渲染方式、對齊方式等。實際細節需要對照 `src/styles/common/iconfont/` 相關樣式檔確認。

### 5.2 `type` 會產生內建圖標 class

如果使用者傳入：

```vue
<Icon type="ios-add" />
```

元件會組出：

```html
<i class="ivu-icon ivu-icon-ios-add"></i>
```

這裡要注意，使用者傳入的是 `ios-add`，不是 `ivu-icon-ios-add`。`ivu-icon-` 前綴由元件內部根據 `prefixCls` 自動補上。

這種設計可以讓 public API 比較乾淨。使用者只需要知道圖標名稱，不需要重複記住元件庫內部 class prefix。

### 5.3 `custom` 會原樣追加自訂 class

如果使用者傳入：

```vue
<Icon custom="i-icon i-icon-search" />
```

元件會輸出：

```html
<i class="ivu-icon i-icon i-icon-search"></i>
```

這裡的 `custom` 不會取代 `ivu-icon`，而是追加 class。這代表 `Icon` 仍然保留自己的基礎樣式，同時讓使用者接入外部 icon font 或自訂 class。

不過要特別注意：`custom` 只負責把 class 掛上去。它不會幫你載入字體檔，不會建立 `@font-face`，也不會定義 `.i-icon-search:before`。這些都必須由使用者或專案其他樣式檔提供。

### 5.4 class 映射結果整理

| 使用方式 | 產生的主要 class | 說明 |
| --- | --- | --- |
| `<Icon />` | `ivu-icon` | 只有基礎 icon class，沒有指定具體圖標。 |
| `<Icon type="ios-add" />` | `ivu-icon ivu-icon-ios-add` | 使用 View UI Plus 內建圖標命名。 |
| `<Icon custom="i-icon i-icon-search" />` | `ivu-icon i-icon i-icon-search` | 加上自訂 icon font class。 |
| `<Icon type="ios-add" custom="x-icon" />` | `ivu-icon ivu-icon-ios-add x-icon` | 內建 class 與自訂 class 會同時存在。 |

---

## 6. `type` 與 `custom` 的關係：內建圖標與自訂圖標的邊界

`type` 和 `custom` 都會影響 class，因此初學者很容易把它們混在一起。實際上，這兩個 props 的設計目的不同。

### 6.1 `type`：使用 View UI Plus 內建圖標

`type` 適合用在 View UI Plus 已經提供的 icon font class。它的核心規則是：

```txt
type="ios-search"
  -> ivu-icon-ios-search
```

也就是說，`type` 是一個「內建圖標名稱」。它不要求使用者知道完整 class 名稱，只需要知道圖標名稱即可。

### 6.2 `custom`：接入專案自己的圖標 class

`custom` 適合用在專案有自己的 icon font、第三方 icon font，或自行定義了一套圖標 class 的情境。它的核心規則是：

```txt
custom="i-icon i-icon-search"
  -> class="ivu-icon i-icon i-icon-search"
```

`custom` 不會幫你轉換命名，也不會自動加上 `ivu-icon-`。你傳什麼 class，它就追加什麼 class。

### 6.3 同時使用 `type` 和 `custom` 時會怎樣？

如果同時傳入：

```vue
<Icon type="ios-add" custom="x-icon" />
```

概念上的結果是：

```html
<i class="ivu-icon ivu-icon-ios-add x-icon"></i>
```

也就是說，兩者都會存在。

但從實務設計角度來看，通常會建議擇一使用。原因是 icon font 很可能都透過 `:before content` 產生圖標，如果內建 class 和自訂 class 都在操作 `:before`，就可能產生樣式覆蓋或圖標不符合預期的問題。

因此可以把規則記成：

```txt
想用 View UI Plus 內建圖標 -> 用 type
想用自己的 icon font class -> 用 custom
特殊情境需要混用 -> 必須檢查 CSS 優先權與 :before 規則
```

---

## 7. Style 映射規則：`size` 與 `color` 如何變成 inline style？

`Icon` 的 `styles` computed 會先建立一個空物件，再依照 `size` 和 `color` 補上欄位：

```js
let style = {};

if (this.size) style['font-size'] = `${this.size}px`;
if (this.color) style.color = this.color;

return style;
```

這段邏輯很短，但有幾個重要細節。

### 7.1 `size` 會被轉成 `font-size`

因為 icon font 本質上是字體，所以控制圖標大小的方式就是控制 `font-size`。

例如：

```vue
<Icon type="ios-search" :size="24" />
```

概念上的輸出是：

```html
<i class="ivu-icon ivu-icon-ios-search" style="font-size: 24px;"></i>
```

傳入數字 `24` 或字串 `"24"`，最後都會被組成 `24px`。

### 7.2 `size` 雖然接受 string，但不代表能傳任意 CSS 單位

這是閱讀 `Icon` 時最容易忽略的細節。

因為 runtime 寫法是：

```js
`${this.size}px`
```

所以如果你寫：

```vue
<Icon type="ios-search" size="1em" />
```

概念上會得到：

```css
font-size: 1empx;
```

這不是有效的 CSS 值。

因此，雖然 `size` 的 runtime type 接受 `Number` 和 `String`，但從實際行為來看，最合理的使用方式是：

```txt
size={24}
size="24"
```

也就是傳入 number 或 numeric string。它不適合直接傳入 `1em`、`2rem`、`100%` 這類已經帶單位的 CSS value。

### 7.3 `size={0}` 這類 falsy value 不會產生 style

因為條件判斷是：

```js
if (this.size)
```

所以當 `size` 是 `0` 時，條件不成立，不會輸出：

```css
font-size: 0px;
```

在一般使用情境中，圖標大小不太會設定為 `0`，所以這通常不是問題。但閱讀原始碼時要注意：它不是檢查 `size !== undefined`，而是使用 truthy / falsy 判斷。

這種小細節在閱讀元件庫時很常見。它不一定是 bug，但它會影響某些極端輸入的結果。

### 7.4 `color` 會變成 inline `color`

如果使用者傳入：

```vue
<Icon type="ios-search" color="#ff6600" />
```

概念上的輸出是：

```html
<i class="ivu-icon ivu-icon-ios-search" style="color: #ff6600;"></i>
```

這裡的 `color` 是 CSS `color`，不是修改 icon font 檔案，也不是修改圖標本身的向量資料。因為 icon font 像文字一樣渲染，所以 `color` 可以改變它的顏色。

### 7.5 inline style 的優先權提醒

`size` 和 `color` 都會產生 inline style。一般來說，inline style 的優先權會高於普通 CSS class 內定義的同名樣式。

因此，如果你同時在外部 CSS 寫：

```css
.my-icon {
  color: blue;
}
```

又在元件上寫：

```vue
<Icon type="ios-search" custom="my-icon" color="red" />
```

通常會以 inline style 的 `red` 為準。若要覆蓋 inline style，需要更特殊的方式，例如避免傳入 `color`，或使用高優先權規則，但後者通常不建議作為常規設計。

### 7.6 style 映射結果整理

| 使用方式 | 產生 style | 說明 |
| --- | --- | --- |
| `<Icon type="ios-add" />` | `{}` | 使用 CSS 預設大小與顏色。 |
| `<Icon type="ios-add" size="24" />` | `{ font-size: '24px' }` | numeric string 會被補成 `px`。 |
| `<Icon type="ios-add" :size="24" />` | `{ font-size: '24px' }` | number 也會被補成 `px`。 |
| `<Icon type="ios-add" color="#ff6600" />` | `{ color: '#ff6600' }` | 設定 inline `color`。 |
| `<Icon type="ios-add" size="1em" />` | `{ font-size: '1empx' }` | 不建議，會形成無效 CSS 值。 |
| `<Icon type="ios-add" :size="0" />` | `{}` | 因為 `0` 是 falsy，不會產生 `font-size`。 |

---

## 8. Render Output Examples：從使用方式看實際 DOM

這一節用幾個典型例子把 props、computed、template 的關係串起來。

### 8.1 內建圖標

使用方式：

```vue
<Icon type="ios-search" />
```

概念上的 DOM output：

```html
<i class="ivu-icon ivu-icon-ios-search"></i>
```

這個 `<i>` 是否真的能顯示搜尋圖標，取決於樣式系統中是否有對應的 CSS rule，例如：

```css
.ivu-icon-ios-search:before {
  content: "...";
}
```

以及 icon font 字體檔是否正確載入。

### 8.2 內建圖標加尺寸與顏色

使用方式：

```vue
<Icon type="ios-search" size="24" color="#ff6600" />
```

概念上的 DOM output：

```html
<i
  class="ivu-icon ivu-icon-ios-search"
  style="font-size: 24px; color: #ff6600;"
></i>
```

這種寫法適合在局部場景中覆蓋大小與顏色，例如操作列 icon、空狀態 icon、表單提示 icon 或按鈕內 icon。

### 8.3 自訂 icon font

使用方式：

```vue
<Icon custom="i-icon i-icon-search" />
```

概念上的 DOM output：

```html
<i class="ivu-icon i-icon i-icon-search"></i>
```

這裡 `Icon` 做的事情很少：它只把 `custom` 傳入的 class 加到 `<i>` 上。

如果畫面沒有顯示自訂圖標，不能只檢查 `Icon` 元件本身，還需要檢查：

- `i-icon` 的字體檔是否載入。
- `i-icon-search` 是否有對應的 `:before content`。
- `font-family` 是否正確。
- `custom` 傳入的 class 名稱是否拼錯。
- 外部樣式是否被 scoped CSS、CSS Modules 或打包規則影響。

### 8.4 同時傳入 `type` 和 `custom`

使用方式：

```vue
<Icon type="ios-search" custom="i-icon i-icon-search" />
```

概念上的 DOM output：

```html
<i class="ivu-icon ivu-icon-ios-search i-icon i-icon-search"></i>
```

這不是語法錯誤，但需要謹慎使用。因為兩組 class 可能都想控制 `:before content` 或 `font-family`，最終結果取決於 CSS 的載入順序與優先權。

---

## 9. 為什麼 `Icon` 沒有 slot？

`Icon` 沒有 slot，是因為它採用的是 icon font 模型。

在 icon font 模型中，圖標不是透過 HTML 子節點提供，而是透過 CSS pseudo-element 產生，例如：

```css
.ivu-icon-ios-search:before {
  content: "\fxxx";
}
```

這種模式下，`<i>` 節點本身只需要有正確的 class。class 會讓 CSS 找到對應的 `:before` 規則，再由 icon font 將指定字碼渲染成圖標。

### 9.1 這種設計的優點

| 優點 | 說明 |
| --- | --- |
| API 小 | 使用者只需要傳 `type`、`size`、`color` 等簡單 props。 |
| 容易控制大小 | 因為圖標像文字一樣，可用 `font-size` 控制。 |
| 容易控制顏色 | 因為圖標像文字一樣，可用 `color` 控制。 |
| 容易嵌入其他元件 | `Icon` 沒有狀態與複雜事件，組合成本低。 |

### 9.2 這種設計的限制

| 限制 | 說明 |
| --- | --- |
| 依賴字體檔 | 如果 font file 沒載入，class 正確也可能顯示失敗。 |
| 依賴 CSS class | 如果 icon class 或 `:before` 規則不存在，圖標不會出現。 |
| 不像 SVG component 容易 tree-shaking | icon font 常以整包字體載入，通常不會像獨立 SVG component 一樣細粒度移除未使用圖標。 |
| 單一圖標客製能力有限 | 若要針對單一圖標做複雜多色或 path 級別控制，SVG 通常更適合。 |

這裡不需要簡單判斷「icon font 比 SVG 好」或「SVG 一定更好」。閱讀原始碼時，更重要的是理解 View UI Plus 這個版本的 `Icon` 是建立在 icon font 模型上，因此它的 API 與 runtime 行為都圍繞 class 和 font style 展開。

---

## 10. 事件邊界：`Icon` 不 emit，但可以承接父層 listener

`Icon` 沒有宣告 `emits`，也沒有 methods 主動處理事件。這代表它不是一個具有互動語意的元件。

不過，在 Vue 3 的單根元件中，非 prop attributes 與事件 listener 通常會 fallthrough 到根節點。由於 `Icon` 的根節點是：

```vue
<i :class="classes" :style="styles"></i>
```

所以父元件可以寫：

```vue
<Icon type="ios-close" @click.stop="handleClose" />
```

概念上，這個 click listener 會被掛到 `<i>` 上。

### 10.1 這不代表 `Icon` 負責互動邏輯

這裡要分清楚兩件事：

| 層次 | 責任 |
| --- | --- |
| `Icon` | 提供一個可被掛 listener 的視覺節點。 |
| 父元件 | 決定點擊後要做什麼，例如關閉、刪除、切換、展開。 |

因此，`Icon` 可以被點擊，但它本身不管理點擊行為。真正的互動語意仍然應該放在父元件或更高層的業務元件中。

### 10.2 閱讀原始碼時要注意的邊界

當你看到其他元件中使用：

```vue
<Icon type="ios-close" @click="..." />
```

不要誤以為 `Icon` 內部有處理 close 行為。正確理解應該是：

```txt
Icon 只渲染關閉圖標
父元件才知道「關閉誰」、「如何關閉」、「關閉後狀態如何更新」
```

這種責任切分是元件庫設計中很重要的原則：基礎元件提供視覺能力，複合元件負責互動語意，業務元件負責業務流程。

---

## 11. `Icon` 在元件庫中的價值：小元件為什麼重要？

`Icon` 很小，但在元件庫裡它是一個高頻基礎元件。原因是很多元件都需要圖標能力，例如：

- `Button` 可能需要左側或右側 icon。
- `Tabs` 可能需要 close icon。
- `Tree` 可能需要展開或收合 icon。
- `Select` 可能需要下拉箭頭。
- `Input` 可能需要 prefix、suffix 或 clear icon。
- `Message`、`Notice`、`Alert` 可能需要狀態 icon。

如果每個元件都自己手寫 `<i class="...">`，元件庫會出現大量重複邏輯，而且 class 命名、大小控制、顏色控制也容易不一致。

透過獨立的 `Icon` 元件，View UI Plus 可以把圖標能力集中成一個穩定抽象：

```txt
其他元件
  -> 使用 Icon
  -> 傳入 type / custom / size / color
  -> 取得一致的 DOM 與 class 結構
```

這就是小元件的重要性。它不一定有複雜邏輯，但它提供了穩定、可組合、可重複使用的視覺基礎。

---

## 12. 實務排錯路線：圖標沒有顯示時怎麼查？

當你寫了：

```vue
<Icon type="ios-search" />
```

但畫面沒有顯示圖標時，不要只看 `Icon` 元件本身。可以照下面順序排查。

### 12.1 第一步：確認 DOM class 是否正確

先打開瀏覽器 DevTools，檢查實際 DOM 是否存在：

```html
<i class="ivu-icon ivu-icon-ios-search"></i>
```

如果沒有 `ivu-icon-ios-search`，代表 `type` 傳值、props 綁定或元件使用方式可能有問題。

### 12.2 第二步：確認 icon font CSS 是否載入

如果 DOM class 正確，但畫面沒有圖標，要檢查 icon font 相關 CSS 是否有被載入。

你要確認樣式裡是否存在類似：

```css
.ivu-icon-ios-search:before {
  content: "...";
}
```

如果沒有這條規則，`Icon` 產生 class 也無法顯示圖標。

### 12.3 第三步：確認 font file 是否成功載入

如果 CSS rule 存在，但圖標顯示成亂碼、方框或空白，需要檢查字體檔是否成功載入。常見問題包括：

- 字體檔路徑錯誤。
- 打包後資源路徑不正確。
- CDN 或靜態資源伺服器沒有正確提供字體檔。
- 瀏覽器因 CORS 或 MIME type 問題拒絕載入字體。

### 12.4 第四步：確認 `type` 名稱是否存在於 icon 清單中

`type="ios-search"` 能否顯示，取決於 icon font 樣式中是否有 `.ivu-icon-ios-search:before`。

如果你寫的是不存在的名稱，例如：

```vue
<Icon type="not-exist" />
```

那麼元件仍然會產生：

```html
<i class="ivu-icon ivu-icon-not-exist"></i>
```

但如果 CSS 沒有 `.ivu-icon-not-exist:before`，就不會有對應圖標。

### 12.5 第五步：如果使用 `custom`，確認自訂樣式完整

如果你使用：

```vue
<Icon custom="i-icon i-icon-search" />
```

需要檢查的重點就不是 View UI Plus 內建 icon class，而是你自己的 icon font 系統：

- `i-icon` 是否設定了正確的 `font-family`？
- `i-icon-search:before` 是否存在？
- `content` 是否正確？
- 字體檔是否載入？
- 自訂 CSS 是否被 scoped、module、打包路徑影響？

### 12.6 排錯總表

| 問題現象 | 優先檢查 | 可能原因 |
| --- | --- | --- |
| DOM 沒有 `ivu-icon-xxx` | props / template 使用方式 | `type` 沒傳、傳錯、元件未正確渲染。 |
| 有 class 但沒圖標 | icon CSS | 沒有載入 icon font 樣式，或該 icon class 不存在。 |
| 顯示方框或亂碼 | font file | 字體檔載入失敗、路徑錯誤、CORS 或 MIME type 問題。 |
| 自訂圖標沒顯示 | `custom` 對應 CSS | 自訂 class 沒定義、字體沒載入、`:before content` 不存在。 |
| 大小不符合預期 | `size` 與 CSS 優先權 | `size` 產生 inline `font-size`，可能覆蓋外部 class。 |
| 顏色不符合預期 | `color` 與 CSS 優先權 | `color` 產生 inline style，通常優先於普通 class。 |
| `size="1em"` 無效 | `size` runtime 組字串 | runtime 會變成 `1empx`，應傳數字或 numeric string。 |

---

## 13. 常見誤區整理

| 誤區 | 為什麼容易誤解 | 正確理解 |
| --- | --- | --- |
| `type` 要寫成 `ivu-icon-ios-add` | 實際 DOM class 會出現 `ivu-icon-ios-add` | `type` 只需要寫 `ios-add`，元件會自動補上 `ivu-icon-`。 |
| `custom` 會取代 `ivu-icon` | `custom` 看起來像自訂整個圖標 | `custom` 是追加 class，`ivu-icon` 仍然存在。 |
| `custom` 會自動載入自訂 icon font | 傳入 class 後期待畫面出現圖標 | `custom` 只加 class，不載入字體、不定義 `:before content`。 |
| `size` 可以傳任意 CSS size | runtime type 接受 `String` | runtime 一律補 `px`，適合傳 number 或 numeric string。 |
| `color` 會修改圖標資源 | 圖標顏色改變了 | `color` 只是 inline CSS color，不會改字體檔或圖標資源。 |
| `Icon` 會管理點擊行為 | 可以在 `Icon` 上綁 `@click` | listener 可以落到根節點，但點擊後邏輯仍由父元件負責。 |
| 沒有 slot 就不能顯示內容 | 一般元件常靠 slot 放內容 | icon font 透過 CSS `:before content` 顯示圖標，不依賴 slot。 |
| `Icon` 太簡單，不值得讀 | runtime 很短 | 它展示了元件庫中 API、class、style、CSS font 系統之間的穩定映射。 |

---

## 14. 初次閱讀路線建議

如果你是第一次系統性閱讀 `Icon`，建議按以下順序進行。

### 14.1 第一輪：只看 runtime 主線

先看 `Icon` 的四個 props：

```txt
type
custom
size
color
```

再看兩個 computed：

```txt
classes
styles
```

最後看 template：

```vue
<i :class="classes" :style="styles"></i>
```

這一輪只要理解「props 如何變成 DOM」即可。

### 14.2 第二輪：對照實際使用結果

接著用幾個例子對照 DOM：

```vue
<Icon type="ios-search" />
<Icon type="ios-search" size="24" color="#ff6600" />
<Icon custom="i-icon i-icon-search" />
```

重點不是背每一個 icon 名稱，而是觀察 class 和 style 的變化規則。

### 14.3 第三輪：補上 CSS icon font

等 runtime 看懂後，再回頭看 icon font 樣式。此時你要找的是：

```txt
.ivu-icon
.ivu-icon-xxx:before
@font-face
font-family
content
```

這樣你就能理解為什麼 `<i>` 裡面明明沒有文字，畫面上卻能看到圖標。

### 14.4 第四輪：看其他元件如何組合 `Icon`

最後再去看其他元件如何使用 `Icon`，例如按鈕、標籤頁、樹狀結構、輸入框或彈窗類元件。

此時你的閱讀重點應該是：

```txt
父元件決定使用哪個 icon
Icon 負責渲染圖標節點
父元件處理點擊或狀態變化
```

這樣你就不會把基礎元件和複合元件的責任混在一起。

---

## 15. 本章總結

`Icon` 是一個典型的 props-to-render 基礎元件。它的 runtime 並不複雜，但非常適合用來學習元件庫的底層設計方式。

本章可以整理成四句話：

1. `type` 和 `custom` 負責 class。
2. `size` 和 `color` 負責 inline style。
3. template 固定輸出一個空的 `<i>` 節點。
4. 真正的圖標顯示依賴 CSS icon font，而不是 `Icon` 元件內部存放圖形。

理解 `Icon` 時，不要只看到它很短，而要看到它在元件庫中的穩定映射責任。它把使用者傳入的簡單 API 轉換成一致的 DOM 結構，讓其他元件可以用統一方式取得圖標能力。

後續閱讀 `Button`、`Input`、`Tabs`、`Tree` 等元件時，都可以用這個思路分析：

```txt
父元件傳入 icon 需求
  -> Icon 接收 type/custom/size/color
  -> Icon 輸出 class/style/DOM
  -> CSS icon font 顯示畫面
```

---

## 16. 自我檢查問題

1. `Icon` 的四個 props 可以分成哪兩類？各自負責什麼？
2. `<Icon type="md-close" />` 概念上會產生哪些 class？
3. 為什麼 `type` 不需要寫成 `ivu-icon-md-close`？
4. `custom` 和 `type` 的差異是什麼？
5. `custom="i-icon i-icon-search"` 為什麼不代表自訂圖標一定會顯示？
6. `size="24"` 和 `:size="24"` 在這個元件中會產生什麼結果？
7. 為什麼 `size="1em"` 可能產生錯誤的 CSS？
8. `color="#ff6600"` 改變的是 icon font 檔案，還是 CSS 顯示效果？
9. `Icon` 沒有 slot，為什麼仍然能顯示圖標？
10. `Icon` 沒有 emits，為什麼父元件仍然可能在它上面綁定 click listener？
11. 如果 `<Icon type="ios-search" />` 沒有顯示圖標，你會依序檢查哪些地方？
12. 為什麼 `Icon` 這種小元件仍然值得作為元件庫原始碼閱讀入口？

---

## 17. 後續延伸方向

這份筆記聚焦在 `Icon` 的 props 與 render output。後續可以再拆成幾篇更深入的筆記。

### 17.1 Icon Font 樣式系統

可以獨立整理：

- `@font-face` 如何載入 icon font。
- `.ivu-icon` 提供哪些基礎樣式。
- `.ivu-icon-xxx:before` 如何對應 Unicode content。
- 字體檔路徑如何被打包工具處理。
- icon font 和 SVG icon component 的差異。

### 17.2 `Icon` 在其他元件中的組合方式

可以閱讀以下類型元件如何使用 `Icon`：

- `Button`：圖標與文字如何排列。
- `Input`：prefix、suffix、clear icon 如何處理。
- `Tabs`：close icon 如何搭配事件。
- `Tree`：展開、收合、節點圖標如何設計。
- `Alert` / `Message` / `Notice`：狀態 icon 如何跟語意結合。

### 17.3 基礎元件的 API 設計原則

可以從 `Icon` 延伸到基礎元件設計：

- props 是否應該保持單一責任？
- class prop 和 style prop 是否應該分清楚？
- 元件是否應該管理事件語意？
- 什麼情況下應該支援 slot？
- 如何避免元件過度設計？

### 17.4 從 icon font 過渡到 SVG icon system

如果想深入現代前端圖標系統，可以再比較：

| 圖標方案 | 特點 |
| --- | --- |
| icon font | 用字體與 CSS class 顯示圖標，容易用 `font-size` 和 `color` 控制。 |
| SVG sprite | 將多個 SVG 合成 symbol，再用 `<use>` 引用。 |
| SVG component | 每個圖標都是獨立元件，適合 tree-shaking 與細粒度控制。 |
| inline SVG | 直接把 SVG path 放進 DOM，客製能力最高但維護成本也可能較高。 |

這些延伸主題可以幫助你把 `Icon` 從單一元件閱讀，擴展成「前端圖標系統設計」的完整理解。
