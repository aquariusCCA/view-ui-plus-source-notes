# Icon Font System：Ionicons、`.ivu-icon` 與圖標字形

## 0. 原始筆記問題分析

原本筆記提到要理解 icon font / class 系統，但尚未展開樣式檔之間的關係。對 `Icon` 來說，這一層非常重要，因為 Vue component 只負責產生 class，真正讓圖標可見的是 Less、字體檔與 `:before content`。

這篇筆記補上 `src/styles/common/iconfont/` 的閱讀方式，讓 `Icon` 的 runtime 和樣式系統接起來。

---

## 1. 本章定位

本章是 `Icon` 的樣式系統閱讀筆記。它不逐一列出所有圖標名稱，而是說明 View UI Plus v1.3.20 如何透過 Ionicons icon font 顯示圖標。

讀完後，應該能理解：

1. `.ivu-icon` 基礎 class 提供哪些字體與排版規則。
2. `.ivu-icon-${type}:before` 如何決定具體圖標字形。
3. `Icon` component 的 `type` prop 為什麼必須和 style class 命名一致。
4. 自訂 icon font 為什麼需要外部 CSS 支援。

---

## 2. 學習前先建立的基本觀念

icon font 的工作方式可以簡化成：

```txt
HTML class
  -> CSS :before content
  -> icon font glyph
  -> browser displays icon
```

也就是說，圖標不是圖片，也不是 SVG path，而是字體中的某個 glyph。CSS 透過 `content: "\f102"` 這類 Unicode code point 指到字體中的字形，瀏覽器再用指定的 `font-family` 把它畫出來。

`Icon` component 在這條流程中只負責第一步：產生 HTML class。後面的 `:before content`、`font-family`、字體檔路徑，都在 Less 與建置產物中。

---

## 3. Style Import Flow

View UI Plus 的主樣式入口是：

```txt
src/styles/index.less
```

其中會匯入：

```less
@import "./common/index";
```

`common/index.less` 再匯入：

```less
@import "iconfont/ionicons";
```

`iconfont/ionicons.less` 最後拆成三個檔案：

```less
@import "_ionicons-variables";
@import "_ionicons-font";
@import "_ionicons-icons";
```

可以把它理解成三層責任。

| 檔案 | 責任 |
| --- | --- |
| `_ionicons-variables.less` | 定義 icon font 路徑、字體名稱、版本與 class prefix。 |
| `_ionicons-font.less` | 定義 `@font-face` 與 `.ivu-icon` 基礎樣式。 |
| `_ionicons-icons.less` | 定義每個 `.ivu-icon-xxx:before` 對應的 `content`。 |

這也是為什麼閱讀 `Icon` 不能只看 `src/styles/components/`。`Icon` 沒有獨立的 `components/icon.less`，它的樣式屬於 common iconfont 系統。

---

## 4. Variables：圖標系統的命名基準

`_ionicons-variables.less` 中的核心變數包括：

```less
@ionicons-font-path: "./fonts";
@ionicons-font-family: "Ionicons";
@ionicons-version: "3.0.0";
@ionicons-prefix: ivu-icon-;
```

這裡要注意兩個重點。

第一，`@ionicons-font-family` 是瀏覽器實際套用的字體名稱。`.ivu-icon` 會使用這個 font family，因此 `:before content` 才能對應到 Ionicons 字形。

第二，`@ionicons-prefix` 是 `ivu-icon-`。這和 `Icon` component 裡的 `prefixCls = 'ivu-icon'` 對得上。component 會產生 `ivu-icon-${type}`，Less 會定義 `.ivu-icon-${name}:before`。兩邊透過相同命名規則連接。

---

## 5. Font：`.ivu-icon` 的基礎樣式

`_ionicons-font.less` 先定義 `@font-face`：

```less
@font-face {
    font-family: @ionicons-font-family;
    src: url("@{ionicons-font-path}/ionicons.woff2?v=@{ionicons-version}") format("woff2"),
         url("@{ionicons-font-path}/ionicons.woff?v=@{ionicons-version}") format("woff"),
         url("@{ionicons-font-path}/ionicons.ttf?v=@{ionicons-version}") format("truetype"),
         url("@{ionicons-font-path}/ionicons.svg?v=@{ionicons-version}#Ionicons") format("svg");
    font-weight: normal;
    font-style: normal;
}
```

這段負責告訴瀏覽器：`Ionicons` 這個 font family 要從哪些字體檔載入。對應字體檔可以在 dist styles fonts 目錄中看到，例如 `ionicons.woff2`、`ionicons.woff`、`ionicons.ttf`。

接著它定義 `.ivu-icon()` mixin，再套用到 `.ivu-icon`：

```less
.ivu-icon {
    .ivu-icon();
}
```

`.ivu-icon()` 會設定 `display: inline-block`、`font-family: Ionicons`、`font-style: normal`、`line-height: 1`、字體平滑與垂直對齊等。這些規則讓 icon 像文字一樣排版，但又能穩定作為 UI 圖標顯示。

---

## 6. Icons：`type` 如何變成具體字形

`_ionicons-icons.less` 中會看到大量類似規則：

```less
.ivu-icon-ios-add:before {
    content: "\f102";
}
```

當使用者寫：

```vue
<Icon type="ios-add" />
```

runtime 會產生：

```html
<i class="ivu-icon ivu-icon-ios-add"></i>
```

瀏覽器套用 `.ivu-icon-ios-add:before` 後，會在 `<i>` 的 `:before` pseudo-element 裡放入 `\f102`。因為 `<i>` 同時有 `.ivu-icon`，所以它的 font family 是 `Ionicons`，最後瀏覽器顯示的是 Ionicons 字體中 `\f102` 對應的圖標。

整條流程可以整理成：

```txt
type="ios-add"
  -> class="ivu-icon ivu-icon-ios-add"
  -> .ivu-icon-ios-add:before { content: "\f102"; }
  -> font-family: "Ionicons"
  -> 顯示 add 圖標
```

---

## 7. `custom` 與自訂 icon font

`custom` 不走 `ivu-icon-${type}` 這條內建命名規則，而是把使用者提供的 class 原樣加入 `<i>`。

例如：

```vue
<Icon custom="i-icon i-icon-search" />
```

會產生：

```html
<i class="ivu-icon i-icon i-icon-search"></i>
```

這裡有一個容易忽略的邊界：`Icon` 不負責定義 `.i-icon` 或 `.i-icon-search`。如果專案沒有載入對應 CSS 與字體檔，這個自訂圖標不會正確顯示。

因此 `custom` 的設計比較像「開一個 class escape hatch」。View UI Plus 保留 `.ivu-icon` 的基礎 inline icon 行為，但允許使用者再掛上自己的 icon font class。

---

## 8. 與 `size` / `color` 的關係

icon font 的好處是它本質上像文字，因此 `Icon` 可以用 `font-size` 控制大小，用 `color` 控制顏色。

這也是 `styles` computed 只需要做兩件事的原因：

```txt
size -> font-size
color -> color
```

不需要根據每個圖標改 width、height 或 SVG fill。只要圖標來自同一套 font family，就能用文字樣式統一控制外觀。

但這也表示 `Icon` 的視覺效果高度依賴字體檔與 CSS 載入。如果樣式沒有載入，`font-size` 和 `color` 仍然存在，圖標字形卻不會如預期顯示。

---

## 9. 常見誤區

| 誤區 | 正確理解 |
| --- | --- |
| `Icon` 裡面有每個 icon 的圖片 | 每個圖標由 icon font glyph 與 `:before content` 決定。 |
| `type` 可以任意填字串 | 必須有對應 `.ivu-icon-${type}:before` 樣式才會顯示內建圖標。 |
| `custom` 會自動支援任意第三方 icon | `custom` 只追加 class，第三方 CSS / font 需要自行載入。 |
| `Icon` 有自己的 component less 檔 | v1.3.20 中 `Icon` 的樣式在 common iconfont 系統裡。 |
| 圖標大小應該用 width / height 控制 | icon font 模型下主要用 `font-size` 控制。 |

---

## 10. 本章總結

`Icon` 的圖標字形不在 Vue component 裡，而在 icon font 樣式系統裡。`Icon` 產生 `ivu-icon` 與 `ivu-icon-${type}`，`.ivu-icon` 指定 Ionicons 字體與基礎排版，`.ivu-icon-${type}:before` 指定具體 glyph。

理解這個模型後，`Icon` 的 runtime 就變得很清楚：它不是圖標資料庫，而是一個把 public props 接到 icon font class 系統的轉接層。

---

## 11. 自我檢查問題

1. `Icon` component 和 `src/styles/common/iconfont/` 各自負責什麼？
2. `.ivu-icon` 基礎 class 為什麼需要設定 `font-family`？
3. `.ivu-icon-ios-add:before` 的 `content` 有什麼作用？
4. 如果新增一套自訂 icon font，`custom` prop 之外還需要準備什麼？
5. 為什麼 icon font 可以用 `color` 控制圖標顏色？
6. `Icon` 沒有 `components/icon.less` 時，應該去哪裡找它的樣式來源？
