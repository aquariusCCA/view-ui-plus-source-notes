# Icon Props And Render：從 props 到 DOM 輸出

## 0. 原始筆記問題分析

原本筆記已經指出 `Icon` 的閱讀重點是 props、class 與 inline style，但還沒有把四個 props 的轉換規則拆開說明。對初學者來說，`Icon` 容易被誤認為「只是顯示圖標」，而忽略它其實是一個很典型的 props-to-class 元件。

這篇筆記會聚焦 `src/components/icon/icon.vue`，用它建立一套閱讀低狀態元件的方法：先看 public props，再看 computed 如何轉換，最後看輸出的 DOM 形狀。

---

## 1. 本章定位

本章是一篇 runtime source 閱讀筆記，專門分析 `Icon` 的 props 如何變成 class 與 inline style。它不展開完整 icon font 清單，也不討論每個圖標名稱的視覺差異。

讀完後，應該能回答：

1. `type`、`custom`、`size`、`color` 分別控制什麼。
2. `Icon` 最終輸出什麼 DOM。
3. 為什麼 `Icon` 沒有 slot、methods、emits 也仍然是重要基礎元件。
4. `type` 和 `custom` 同時存在時會發生什麼。

---

## 2. 學習前先建立的基本觀念

很多基礎元件都可以用同一條線理解：

```txt
public props
  -> computed class / style
  -> template / render output
  -> CSS rule
```

`Icon` 是這條線最乾淨的例子。它沒有複雜條件分支，也沒有事件處理，所有邏輯都集中在 `classes` 和 `styles` 兩個 computed。

這種元件的閱讀重點不是「有沒有演算法」，而是「API 和樣式系統之間的映射是否穩定」。元件庫中很多元件都會依賴這種映射，例如 `Button` 透過 `icon` prop 渲染 `Icon`，`Tabs` 用 `Icon` 顯示關閉符號，`Tree` 用 `Icon` 顯示展開箭頭。

---

## 3. Runtime Overview

`Icon` 的 template 只有一行：

```vue
<i :class="classes" :style="styles"></i>
```

這個結構代表三件事。

第一，`Icon` 固定輸出 `<i>`。它不是根據 props 改成 `span`、`svg` 或其他節點。

第二，節點內容是空的。實際圖標內容不是由 slot 或文字提供，而是由 CSS `:before` 與 icon font 提供。

第三，所有變化都落在 `class` 和 `style`。所以閱讀 `Icon` 時，應該把注意力集中在 `classes` 和 `styles` computed。

---

## 4. Props Contract

`Icon` 的 runtime props 如下：

| Prop | Runtime Type | Default | 責任 |
| --- | --- | --- | --- |
| `type` | `String` | `''` | 內建圖標名稱，產生 `ivu-icon-${type}`。 |
| `size` | `[Number, String]` | 無 | 圖標大小，轉成 `font-size: ${size}px`。 |
| `color` | `String` | 無 | 圖標顏色，轉成 inline `color`。 |
| `custom` | `String` | `''` | 自訂圖標 class，原樣加入 class list。 |

這四個 props 可以分成兩組。

`type` 和 `custom` 是 class props。它們決定 `<i>` 會掛上哪些 class，進而連到內建 icon font 或使用者自訂 icon font。

`size` 和 `color` 是 style props。它們直接變成 inline style，因此優先權通常會高於外部一般 CSS class 裡的同名樣式。

---

## 5. Class 映射規則

`classes` computed 回傳一個 Vue class binding 支援的陣列：

```js
[
    `${prefixCls}`,
    {
        [`${prefixCls}-${this.type}`]: this.type !== '',
        [`${this.custom}`]: this.custom !== '',
    }
]
```

其中 `prefixCls` 固定是：

```js
const prefixCls = 'ivu-icon';
```

因此 class 會依照 props 產生下列結果。

| 使用方式 | 產生的主要 class | 說明 |
| --- | --- | --- |
| `<Icon />` | `ivu-icon` | 只有基礎 icon class，沒有指定圖標字形。 |
| `<Icon type="ios-add" />` | `ivu-icon ivu-icon-ios-add` | 使用內建 Ionicons 對應 class。 |
| `<Icon custom="i-icon i-icon-search" />` | `ivu-icon i-icon i-icon-search` | 保留 `ivu-icon` 基礎樣式，同時加入自訂 class。 |
| `<Icon type="ios-add" custom="x-icon" />` | `ivu-icon ivu-icon-ios-add x-icon` | 兩者都會加入，實務上通常擇一使用。 |

這裡最重要的是：`type` 不需要包含 `ivu-icon-` 前綴。使用者傳的是圖標名稱，元件會自己組成完整 class。

---

## 6. Style 映射規則

`styles` computed 會先建立空物件，再依照 `size` 和 `color` 補上欄位：

```js
let style = {};

if (this.size) style['font-size'] = `${this.size}px`;
if (this.color) style.color = this.color;

return style;
```

對應結果如下。

| 使用方式 | 產生 style | 說明 |
| --- | --- | --- |
| `<Icon type="ios-add" />` | `{}` | 使用 CSS 預設字體大小與顏色。 |
| `<Icon type="ios-add" size="24" />` | `{ font-size: '24px' }` | 數字字串會被補成 px。 |
| `<Icon type="ios-add" :size="24" />` | `{ font-size: '24px' }` | 數字也會被補成 px。 |
| `<Icon type="ios-add" color="#ff6600" />` | `{ color: '#ff6600' }` | 直接設定 inline color。 |

需要特別注意的是，`size` 的型別雖然接受 `string`，但 runtime 一律補上 `px`。因此 `size="1em"` 會得到 `font-size: 1empx`，這不是有效的 CSS 值。從 `types/icon.d.ts` 的註解「單位是 px」來看，這裡應該把 `size` 理解成 number 或 numeric string。

---

## 7. Render Output Examples

### 7.1 內建圖標

輸入：

```vue
<Icon type="ios-search" />
```

概念上的輸出：

```html
<i class="ivu-icon ivu-icon-ios-search"></i>
```

這個 `<i>` 是否真的顯示搜尋圖標，取決於樣式中是否存在 `.ivu-icon-ios-search:before` 與對應字體資源。

### 7.2 內建圖標加尺寸與顏色

輸入：

```vue
<Icon type="ios-search" size="24" color="#ff6600" />
```

概念上的輸出：

```html
<i class="ivu-icon ivu-icon-ios-search" style="font-size: 24px; color: #ff6600;"></i>
```

這種寫法適合在局部場景中覆蓋大小與顏色，例如按鈕內 icon、空狀態 icon 或操作區 icon。

### 7.3 自訂 icon font

輸入：

```vue
<Icon custom="i-icon i-icon-search" />
```

概念上的輸出：

```html
<i class="ivu-icon i-icon i-icon-search"></i>
```

`Icon` 不會幫你載入 `i-icon` 的字體檔，也不會定義 `i-icon-search` 的 `content`。它只負責把 class 掛上去。自訂 icon font 的 CSS 必須由使用者或專案其他地方提供。

---

## 8. 為什麼 `Icon` 沒有 slot

`Icon` 的節點內容是空的，這是 icon font 實作方式造成的。內建圖標不是透過 slot 塞入文字，也不是傳入 SVG path，而是透過 class 對應到 CSS `:before content`。

這種設計的優點是 API 非常小，圖標可以像文字一樣受 `font-size` 與 `color` 控制，也容易被放進其他元件。代價是圖標集合依賴字體檔與 CSS class，不能像 SVG component 那樣天然支援每個圖標獨立 tree-shaking。

這裡不需要把它判斷成好或壞；閱讀原始碼時，重點是理解 View UI Plus 這個版本採用的是 icon font 模型。

---

## 9. 事件邊界：不 emit，但可 fallthrough listener

`Icon` 沒有宣告 `emits`，也沒有 methods 主動處理事件。這表示它不是一個有自己互動語意的元件。

不過在 Vue 3 中，非 prop attributes 和 event listeners 會 fallthrough 到單根節點。`Icon` 的根節點正好是 `<i>`，所以父元件寫：

```vue
<Icon type="ios-close" @click.stop="handleClose" />
```

概念上會把 click listener 掛到這個 `<i>` 上。View UI Plus 原始碼中也能看到類似用法，例如標籤頁關閉、圖片預覽切換或關閉等場景。

這裡要分清楚責任：DOM listener 可以落到 `Icon` 根節點，但「點擊後要做什麼」仍然由父元件決定。`Icon` 只提供可被點擊的視覺節點，不管理狀態、不決定行為。

---

## 10. 常見誤區

| 誤區 | 正確理解 |
| --- | --- |
| `type` 要寫成 `ivu-icon-ios-add` | `type` 只寫 `ios-add`，元件會補 `ivu-icon-`。 |
| `custom` 會取代 `ivu-icon` | `custom` 是追加 class，`ivu-icon` 仍然存在。 |
| `size` 可以傳任何 CSS size | runtime 會補 `px`，應傳數字或數字字串。 |
| `color` 會改 icon font 檔案 | `color` 只是 inline CSS color。 |
| `Icon` 會管理點擊行為 | 父層 listener 可以 fallthrough 到 `<i>`，但互動語意仍由父元件處理。 |

---

## 11. 本章總結

`Icon` 是一個典型的 props-to-render 元件。`type` 與 `custom` 決定 class，`size` 與 `color` 決定 inline style，template 固定輸出一個空的 `<i>` 節點。

理解這個元件的關鍵，是不要期待它內部有複雜行為。它的價值在於建立一個穩定的映射層，讓其他元件可以用一致方式取得圖標能力。後續閱讀 `Button`、`Avatar`、`Select`、`Tree` 時，都可以看到這個小元件被反覆組合。

---

## 12. 自我檢查問題

1. `Icon` 的四個 props 可以分成哪兩類？
2. `<Icon type="md-close" />` 會產生哪些 class？
3. 為什麼 `custom` 不等於「載入自訂 icon font」？
4. `size="1em"` 在這個 runtime 中可能造成什麼問題？
5. `Icon` 為什麼不需要 slot 也能顯示圖標？
6. 如果你想讓某個父元件的 icon 可點擊，責任應該放在 `Icon` 還是父元件？
