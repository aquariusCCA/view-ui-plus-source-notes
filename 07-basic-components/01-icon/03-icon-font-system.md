# View UI Plus Icon 圖標元件：Icon Font System 教材型筆記

> 本筆記聚焦於 View UI Plus v1.3.20 的 `Icon` 圖標樣式系統，說明 Ionicons、`.ivu-icon`、`.ivu-icon-${type}:before`、字體檔與 `Icon` component 之間如何協作。
>
> 本章不逐一列出所有圖標名稱，也不深入比較每個圖標的視覺差異。重點是建立一條可長期複習的閱讀主線：**HTML class 如何透過 CSS 與 icon font 變成畫面上的圖標**。

---

## 0. 原始筆記類型與問題分析

### 0.1 筆記類型判斷

這份原始筆記主要屬於「樣式系統閱讀筆記」，同時帶有一點「原始碼閱讀筆記」與「架構分析筆記」的性質。

原因是它不是在講 `Icon` component 的完整 runtime 邏輯，而是聚焦在：

- View UI Plus 如何匯入 icon font 相關樣式。
- `.ivu-icon` 基礎 class 負責什麼。
- `.ivu-icon-${type}:before` 如何透過 `content` 指定具體圖標字形。
- `Icon` component 的 `type`、`custom`、`size`、`color` 為什麼能和樣式系統接上。

也就是說，本章真正要理解的不是「Vue 元件怎麼寫」，而是「元件產生的 class 如何進入 CSS icon font 系統，最後變成圖標」。

### 0.2 原始筆記目前的優點

原始筆記已經抓到 `Icon` 圖標系統中最關鍵的幾個節點：

| 已有內容 | 價值 |
| --- | --- |
| `src/styles/index.less` 到 `iconfont/ionicons.less` 的匯入流程 | 可以幫助讀者找到樣式入口，不會只停留在 `icon.vue`。 |
| `_ionicons-variables.less`、`_ionicons-font.less`、`_ionicons-icons.less` 的責任分工 | 能建立 icon font 系統的模組地圖。 |
| `.ivu-icon` 與 `.ivu-icon-${type}:before` 的關係 | 抓到「基礎樣式」與「具體字形」的分工。 |
| `custom` 需要外部 CSS 支援 | 能避免誤以為 View UI Plus 會自動支援所有第三方 icon。 |
| `size` / `color` 與 icon font 的關係 | 說明為什麼圖標可以像文字一樣調整大小與顏色。 |

### 0.3 需要補強的地方

原始筆記已經有清楚的結論，但若要成為長期學習用的教材，還可以補強以下部分：

| 需要補強的方向 | 補強原因 |
| --- | --- |
| 更明確地說明 icon font 的基本模型 | 初學者可能知道 `class`，但不一定理解 glyph、code point、`font-family`、`:before` 的關係。 |
| 將 Less 檔案拆成「命名基準、字體載入、圖標清單」三層理解 | 有助於未來閱讀其他元件庫或 icon font 系統。 |
| 補上從 `<Icon type="ios-add" />` 到畫面顯示的完整鏈路 | 讓讀者能把 runtime 與 CSS 串起來，而不是只記住單一檔案。 |
| 補充 `custom` 的責任邊界 | 避免把 `custom` 誤解成「幫我載入第三方 icon」。 |
| 加入排錯路線 | 實務中圖標不顯示時，通常不是 Vue 壞掉，而是 class、CSS、font path 或建置資源有問題。 |
| 標註版本與資訊邊界 | 本章基於 View UI Plus v1.3.20 的筆記內容；不同版本的路徑、字體或建置結果需要重新確認。 |

---

## 1. 本章定位

在閱讀 `Icon` 元件時，很多人會先打開 `src/components/icon/icon.vue`，看到它只輸出一個 `<i>` 標籤，就以為這個元件很簡單，甚至覺得沒有什麼值得研究。

但這種理解只看到了 runtime 的一半。

`Icon` 的 runtime 的確很短，它主要只是根據 props 產生 class 與 inline style。然而，真正讓圖標出現在畫面上的關鍵，並不在 Vue component 裡，而在樣式系統：

```txt
Icon component
  -> 產生 class
  -> Less / CSS 定義 class 行為
  -> @font-face 載入 Ionicons 字體
  -> :before content 指向字體 glyph
  -> 瀏覽器顯示圖標
```

因此，本章的定位是：**從樣式系統角度理解 View UI Plus 的 `Icon`。**

讀完本章後，你應該能回答：

1. `.ivu-icon` 基礎 class 提供哪些字體與排版規則。
2. `.ivu-icon-${type}:before` 如何決定具體圖標字形。
3. `Icon` component 的 `type` prop 為什麼必須和 style class 命名一致。
4. `custom` 為什麼只負責追加 class，而不負責載入第三方 icon font。
5. 當圖標不顯示時，應該從哪些層次排查問題。

---

## 2. 學習前先建立的基本觀念

### 2.1 icon font 是什麼

icon font 可以先理解成「把圖標放進字體檔」。

一般文字字體會把字母、數字、符號放進 font file，例如 `A`、`B`、`1`、`2`。icon font 則是把搜尋、加號、關閉、箭頭等圖標做成字體中的 glyph。

在這種模型下，圖標不是圖片，也不是 SVG path，而是某個字體中的一個字形。瀏覽器顯示它時，流程大致如下：

```txt
HTML 元素套用某個 class
  -> CSS 指定 :before content
  -> CSS 指定 font-family
  -> content 的 code point 對應到字體中的 glyph
  -> 瀏覽器把 glyph 畫成圖標
```

舉例來說：

```less
.ivu-icon-ios-add:before {
    content: "\f102";
}
```

這裡的 `\f102` 可以理解成一個 code point。它本身不是圖標圖片，而是一個指向字體中某個 glyph 的代碼。只有當元素同時套用了正確的 `font-family`，瀏覽器才知道應該用哪一套字體去解讀這個 code point。

### 2.2 `Icon` component 在 icon font 流程中的位置

`Icon` component 本身不保存圖標圖片，也不保存 SVG path。它主要負責把使用者傳入的 props 轉成 class 與 style。

以內建圖標為例：

```vue
<Icon type="ios-add" />
```

概念上會得到：

```html
<i class="ivu-icon ivu-icon-ios-add"></i>
```

後續能不能顯示圖標，取決於樣式系統是否提供：

```less
.ivu-icon {
    font-family: "Ionicons";
}

.ivu-icon-ios-add:before {
    content: "\f102";
}
```

所以 `Icon` component 是「入口」，但不是「圖標資料庫」。真正的圖標字形來源是 icon font 樣式與字體檔。

### 2.3 閱讀時要分清楚三種責任

閱讀 `Icon` 時，建議把責任分成三層：

| 層次 | 負責內容 | 對應檔案或概念 |
| --- | --- | --- |
| Vue component 層 | 接收 `type`、`custom`、`size`、`color`，產生 class 與 style | `src/components/icon/icon.vue` |
| CSS / Less 層 | 定義 `.ivu-icon`、`.ivu-icon-${type}:before` 等 class 規則 | `src/styles/common/iconfont/` |
| Font asset 層 | 提供實際 glyph 字形資料 | `ionicons.woff2`、`ionicons.woff`、`ionicons.ttf` 等 |

如果只看 Vue component，你會知道 class 怎麼產生，但不知道 class 為什麼能顯示圖標。  
如果只看 CSS，你會知道 glyph 怎麼對應，但不知道使用者如何透過 `type` prop 產生 class。  
兩者合起來，才是完整的 `Icon` 圖標系統。

---

## 3. 樣式匯入流程：Icon Font 是如何進入 View UI Plus 的

### 3.1 主樣式入口

View UI Plus 的主樣式入口是：

```txt
src/styles/index.less
```

原始筆記指出，這個入口會匯入 common 樣式：

```less
@import "./common/index";
```

接著 `common/index.less` 會匯入 icon font 系統：

```less
@import "iconfont/ionicons";
```

最後 `iconfont/ionicons.less` 又會拆成三個檔案：

```less
@import "_ionicons-variables";
@import "_ionicons-font";
@import "_ionicons-icons";
```

這條路徑可以整理成：

```txt
src/styles/index.less
  -> ./common/index.less
    -> iconfont/ionicons.less
      -> _ionicons-variables.less
      -> _ionicons-font.less
      -> _ionicons-icons.less
```

這表示 `Icon` 的樣式不是放在一個獨立的 `components/icon.less` 裡，而是被納入 common iconfont 系統。這點非常重要，因為初學者很容易用「元件名稱找樣式檔」的方式找檔案，結果找不到 `icon.less` 就以為 `Icon` 沒有樣式。

### 3.2 三個 Less 檔案的責任分工

`ionicons.less` 匯入的三個檔案，各自負責不同層次：

| 檔案 | 責任 | 閱讀重點 |
| --- | --- | --- |
| `_ionicons-variables.less` | 定義 icon font 的命名與資源基準 | 字體路徑、字體名稱、版本、class prefix。 |
| `_ionicons-font.less` | 定義 `@font-face` 與 `.ivu-icon` 基礎樣式 | 字體檔如何載入、`.ivu-icon` 如何像 inline icon 一樣排版。 |
| `_ionicons-icons.less` | 定義每個具體 icon class 的 `:before content` | `.ivu-icon-ios-add:before` 對應到哪個 code point。 |

可以把這三個檔案想成一個 icon font 系統的三層架構：

```txt
variables：先定義共用命名與資源位置
font：再定義字體如何載入，以及 icon 基礎 class 怎麼排版
icons：最後定義每個 icon 名稱對應到哪個 glyph
```

這種拆分方式可以降低維護成本。因為字體路徑、基礎樣式、圖標清單是三種不同變動頻率的內容，不適合全部塞在同一個檔案中。

---

## 4. Variables：圖標系統的命名基準

### 4.1 核心變數

原始筆記列出的 `_ionicons-variables.less` 核心變數如下：

```less
@ionicons-font-path: "./fonts";
@ionicons-font-family: "Ionicons";
@ionicons-version: "3.0.0";
@ionicons-prefix: ivu-icon-;
```

這些變數看似只是設定值，但它們其實定義了整套 icon font 系統的「共同語言」。

| 變數 | 角色 | 說明 |
| --- | --- | --- |
| `@ionicons-font-path` | 字體檔路徑 | 告訴 CSS 要從哪裡載入 `woff2`、`woff`、`ttf`、`svg` 等字體檔。 |
| `@ionicons-font-family` | 字體名稱 | 對應到 `@font-face` 的 `font-family`，也是 `.ivu-icon` 會套用的字體名稱。 |
| `@ionicons-version` | 字體版本 | 通常用於字體檔 URL 的 query string，協助快取與版本控制。 |
| `@ionicons-prefix` | icon class prefix | 定義內建 icon class 的前綴，也就是 `ivu-icon-`。 |

### 4.2 `@ionicons-font-family` 的意義

`@ionicons-font-family: "Ionicons"` 的重點在於：它不是單純給開發者看的名稱，而是瀏覽器真正用來套用字體的 `font-family`。

假設 `.ivu-icon` 沒有套用 `font-family: "Ionicons"`，那麼即使 `.ivu-icon-ios-add:before` 產生了 `\f102`，瀏覽器也可能用一般文字字體去解讀它。這時畫面可能出現方框、亂碼，或完全不是預期中的圖標。

因此，`content` 和 `font-family` 必須一起看：

```txt
content 決定「要顯示哪個 code point」
font-family 決定「用哪套字體去解讀這個 code point」
```

兩者缺一不可。

### 4.3 `@ionicons-prefix` 與 `Icon` 的命名契約

`@ionicons-prefix` 是：

```less
@ionicons-prefix: ivu-icon-;
```

而 `Icon` component 的 `prefixCls` 是：

```js
const prefixCls = 'ivu-icon';
```

當使用者寫：

```vue
<Icon type="ios-add" />
```

`Icon` component 會產生：

```html
<i class="ivu-icon ivu-icon-ios-add"></i>
```

這裡有一個重要契約：

```txt
Vue component：產生 ivu-icon-${type}
Less icons：定義 .ivu-icon-${name}:before
```

也就是說，`type` prop 不是任意字串。它必須剛好對上 `_ionicons-icons.less` 中存在的 class 名稱。  
如果你傳入不存在的 `type`，例如：

```vue
<Icon type="not-exist" />
```

概念上仍然會產生：

```html
<i class="ivu-icon ivu-icon-not-exist"></i>
```

但如果樣式裡沒有：

```less
.ivu-icon-not-exist:before {
    content: "...";
}
```

那就不會顯示對應的內建圖標。

---

## 5. Font：`.ivu-icon` 的基礎樣式

### 5.1 `@font-face`：把 Ionicons 字體註冊給瀏覽器

原始筆記列出的 `_ionicons-font.less` 會先定義 `@font-face`：

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

這段的作用是告訴瀏覽器：

```txt
當 CSS 使用 font-family: "Ionicons" 時，
請從這些字體檔載入對應的 glyph 資料。
```

這裡同時提供多種格式，例如 `woff2`、`woff`、`ttf`、`svg`。通常這是為了支援不同瀏覽器或不同建置環境。實務上現代瀏覽器多半會優先使用較新的格式，例如 `woff2`；但具體載入哪一個，仍取決於瀏覽器支援與 CSS 解析結果。

> 注意：本章只根據原始筆記提供的 v1.3.20 路徑與檔案內容說明。若使用的 View UI Plus 版本不同，字體檔格式、路徑或匯入方式需要重新確認。

### 5.2 `.ivu-icon()` mixin 與 `.ivu-icon`

原始筆記指出，`_ionicons-font.less` 會定義 `.ivu-icon()` mixin，並套用到 `.ivu-icon`：

```less
.ivu-icon {
    .ivu-icon();
}
```

`.ivu-icon()` 的工作可以理解成：建立所有 icon 共同需要的基礎樣式。這類基礎樣式通常包含：

- `display: inline-block`
- `font-family: "Ionicons"`
- `font-style: normal`
- `font-weight: normal`
- `line-height: 1`
- 字體平滑設定
- 垂直對齊設定

原始筆記沒有完整列出 mixin 每一行，因此這裡不把每一條 CSS 規則視為絕對完整清單。更重要的是理解它的角色：**`.ivu-icon` 讓一個普通的 `<i>` 元素具備 icon font 的基礎顯示能力。**

### 5.3 為什麼 `.ivu-icon` 必須存在

假設只產生具體圖標 class：

```html
<i class="ivu-icon-ios-add"></i>
```

理論上它可能套到：

```less
.ivu-icon-ios-add:before {
    content: "\f102";
}
```

但如果缺少 `.ivu-icon`，就可能缺少以下能力：

1. 沒有指定 `font-family: "Ionicons"`。
2. 沒有基礎的 inline 排版行為。
3. 沒有一致的字體平滑、行高或垂直對齊設定。

因此，`Icon` component 固定加入 `ivu-icon` 是合理的。`ivu-icon` 是「基礎能力」，`ivu-icon-ios-add` 這類 class 是「具體圖標」。

可以用這句話記住：

```txt
.ivu-icon 負責「怎麼顯示成 icon」
.ivu-icon-ios-add 負責「顯示哪一個 icon」
```

---

## 6. Icons：`type` 如何變成具體字形

### 6.1 `_ionicons-icons.less` 的核心規則

`_ionicons-icons.less` 中會有大量類似規則：

```less
.ivu-icon-ios-add:before {
    content: "\f102";
}
```

這種規則做了兩件事：

1. 選中具有 `.ivu-icon-ios-add` class 的元素。
2. 在該元素的 `:before` pseudo-element 中插入一個 code point。

也就是說，真正顯示在畫面上的內容不是 `<i>` 裡面的文字，而是 CSS 產生的 pseudo-element。

### 6.2 從 `<Icon type="ios-add" />` 到畫面圖標

完整流程可以拆成以下步驟：

#### 第一步：使用者傳入 `type`

```vue
<Icon type="ios-add" />
```

這裡的 `ios-add` 是內建圖標名稱，不需要加上 `ivu-icon-` 前綴。

#### 第二步：`Icon` component 產生 class

概念上的 DOM 輸出是：

```html
<i class="ivu-icon ivu-icon-ios-add"></i>
```

其中：

- `ivu-icon`：提供 icon font 的基礎顯示樣式。
- `ivu-icon-ios-add`：對應具體圖標名稱。

#### 第三步：CSS 套用具體 icon 規則

```less
.ivu-icon-ios-add:before {
    content: "\f102";
}
```

這會讓 `<i>` 的 `:before` 產生 `\f102`。

#### 第四步：`.ivu-icon` 指定 Ionicons 字體

```less
.ivu-icon {
    font-family: "Ionicons";
}
```

因為元素有 `.ivu-icon`，所以 `\f102` 會用 Ionicons 字體來解讀。

#### 第五步：瀏覽器顯示 glyph

最後，瀏覽器會在 Ionicons 字體中找到 `\f102` 對應的 glyph，並把它畫成加號圖標。

整理成一條鏈路就是：

```txt
<Icon type="ios-add" />
  -> <i class="ivu-icon ivu-icon-ios-add"></i>
  -> .ivu-icon-ios-add:before { content: "\f102"; }
  -> .ivu-icon { font-family: "Ionicons"; }
  -> Ionicons font glyph
  -> 畫面顯示 add 圖標
```

### 6.3 為什麼不需要逐一背 icon 清單

`_ionicons-icons.less` 可能包含大量圖標規則。閱讀這類檔案時，不建議逐一背誦每個 icon 名稱與 code point。

更有效的閱讀方式是確認三件事：

1. 命名規則是否是 `.ivu-icon-${name}:before`。
2. 每個 icon class 是否都有對應的 `content`。
3. `Icon` 的 `type` prop 是否能對應到這個 `${name}`。

只要掌握這個模型，就能在需要查某個圖標時再回到清單中搜尋，而不是把完整清單當作必背知識。

---

## 7. `custom` 與自訂 icon font

### 7.1 `custom` 的定位

`custom` 不走內建的 `ivu-icon-${type}` 命名規則，而是把使用者提供的 class 原樣加入 `<i>`。

例如：

```vue
<Icon custom="i-icon i-icon-search" />
```

概念上會輸出：

```html
<i class="ivu-icon i-icon i-icon-search"></i>
```

這代表 `custom` 的定位是：**讓使用者把自己的 icon class 接到 `Icon` 元件上。**

它不是替你產生字體，也不是替你定義 `:before content`，更不是替你載入第三方 CSS。

### 7.2 `custom` 之外還需要什麼

如果要讓自訂 icon font 正常顯示，除了傳入 `custom`，專案通常還需要準備：

| 需要準備的項目 | 說明 |
| --- | --- |
| 自訂 icon font 的字體檔 | 例如 `.woff2`、`.woff`、`.ttf` 等。 |
| `@font-face` | 讓瀏覽器知道自訂字體名稱與字體檔位置。 |
| 基礎 icon class | 例如 `.i-icon`，負責指定 `font-family`、`display`、`line-height` 等。 |
| 具體 icon class | 例如 `.i-icon-search:before`，負責指定 `content`。 |
| 正確的資源載入與建置配置 | 確保字體檔打包後路徑正確，瀏覽器能成功下載。 |

也就是說，`custom` 只是提供 class 注入點。自訂 icon font 的完整系統仍然要由使用者或專案本身建立。

### 7.3 `custom` 為什麼仍保留 `.ivu-icon`

即使使用 `custom`，`Icon` 還是會保留 `ivu-icon`：

```html
<i class="ivu-icon i-icon i-icon-search"></i>
```

這樣做的好處是：`Icon` 仍然保留元件庫原本的 inline icon 基礎行為，例如排版上的一致性。

但這也可能帶來一個需要注意的地方：如果 `.ivu-icon` 和自訂 `.i-icon` 都設定了 `font-family`，最終使用哪個字體，會受到 CSS cascade、選擇器權重與載入順序影響。  
因此在接入自訂 icon font 時，應該確認自訂 class 的樣式是否能正確覆蓋或配合 `.ivu-icon`。

---

## 8. `size` / `color` 與 icon font 的關係

### 8.1 為什麼 icon 可以用 `font-size` 控制大小

因為 icon font 的本質是字體，所以它可以像文字一樣透過 `font-size` 控制大小。

`Icon` component 的 `size` prop 會對應到 inline style：

```txt
size -> font-size
```

例如：

```vue
<Icon type="ios-add" :size="24" />
```

概念上會輸出：

```html
<i class="ivu-icon ivu-icon-ios-add" style="font-size: 24px;"></i>
```

這也是 icon font 模型的一個優點：多數圖標不需要分別設定 `width`、`height`，而是由 `font-size` 統一控制。

### 8.2 為什麼 icon 可以用 `color` 控制顏色

同樣因為 icon font 是字體，所以可以透過 CSS `color` 控制顏色。

例如：

```vue
<Icon type="ios-add" color="#2d8cf0" />
```

概念上會輸出：

```html
<i class="ivu-icon ivu-icon-ios-add" style="color: #2d8cf0;"></i>
```

瀏覽器在繪製字體 glyph 時，會使用當前元素的 `color`。因此，`Icon` 不需要針對每個圖標設定 `fill` 或 `stroke`。

### 8.3 icon font 模型的限制

使用 `font-size` 和 `color` 控制 icon 很方便，但 icon font 也有一些限制：

| 限制 | 說明 |
| --- | --- |
| 依賴整套字體檔 | 圖標不是獨立 SVG component，通常需要載入整個 icon font。 |
| 不容易做到單一圖標 tree-shaking | 即使用到一個圖標，也可能載入整套字體資源。 |
| 多色圖標支援有限 | 傳統 icon font 通常更適合單色圖標。 |
| 路徑或字體載入失敗會直接影響顯示 | CSS class 存在不代表 glyph 一定能顯示。 |

這些限制不是說 icon font 一定不好，而是說閱讀 View UI Plus 的 `Icon` 時，要理解它採用的是 icon font 模型，而不是 SVG icon component 模型。

---

## 9. `Icon` Runtime 與樣式系統的整體關係

### 9.1 Runtime 負責產生 class，樣式系統負責顯示

`Icon` 的 runtime 可以簡化成：

```txt
type/custom -> class
size/color -> style
```

而本章討論的樣式系統則負責：

```txt
class -> :before content -> font glyph -> visual icon
```

合起來就是：

```txt
props
  -> computed class / style
  -> DOM <i>
  -> CSS selector
  -> icon font glyph
  -> browser rendering
```

這也是閱讀基礎元件時很重要的一種思維：不要只看 component source，也要看它依賴的樣式、資源與建置產物。

### 9.2 `type` 與 icon font 的耦合

`type` prop 和 `_ionicons-icons.less` 之間存在明確耦合：

```txt
type="ios-add"
  -> ivu-icon-ios-add
  -> .ivu-icon-ios-add:before
```

因此，如果未來要更換 icon font 或調整 prefix，就不能只改 Vue component，也要同步調整 Less 中的命名規則。

這也是為什麼元件庫中的 class naming convention 很重要。它不是單純命名風格問題，而是 component API 與 CSS 系統之間的契約。

### 9.3 `custom` 是 escape hatch

`custom` 則是另一種設計思路：它不強迫使用者只能使用 View UI Plus 內建 icon，而是提供一個 escape hatch，讓使用者接入自己的 class。

可以比較如下：

| 使用方式 | 依賴對象 | View UI Plus 負責什麼 | 使用者負責什麼 |
| --- | --- | --- | --- |
| `type` | View UI Plus 內建 Ionicons class | 產生 `ivu-icon-${type}`，並提供對應 CSS / font | 傳入正確圖標名稱。 |
| `custom` | 使用者自己的 icon class | 把 custom class 掛到 `<i>` 上 | 提供 CSS、`@font-face`、`:before content` 與字體檔。 |

---

## 10. 圖標不顯示時的排錯路線

當 `<Icon />` 沒有顯示圖標時，建議不要一開始就懷疑 Vue component，而是沿著整條鏈路逐層檢查。

### 10.1 先檢查 DOM class 是否正確

例如：

```vue
<Icon type="ios-add" />
```

瀏覽器 devtools 中應該能看到類似：

```html
<i class="ivu-icon ivu-icon-ios-add"></i>
```

如果沒有 `ivu-icon-ios-add`，代表 runtime class 產生或 props 傳入可能有問題。  
如果有 class，則應該往 CSS 與字體資源繼續查。

### 10.2 檢查 `.ivu-icon-${type}:before` 是否存在

搜尋編譯後 CSS 或原始 Less，確認是否存在：

```less
.ivu-icon-ios-add:before {
    content: "...";
}
```

如果不存在，可能是：

- `type` 傳錯。
- 該圖標名稱在目前版本不存在。
- icon font 樣式沒有被正確匯入或打包。

### 10.3 檢查 `.ivu-icon` 是否有正確的 `font-family`

在 devtools 的 computed style 中，確認該 `<i>` 是否套用了 Ionicons 相關字體：

```css
font-family: "Ionicons";
```

如果沒有，代表 `.ivu-icon` 基礎樣式可能沒有載入，或被其他樣式覆蓋。

### 10.4 檢查字體檔是否載入成功

即使 CSS 存在，如果字體檔路徑錯誤，也可能導致圖標不顯示。

可以在 Network 面板檢查是否成功載入：

```txt
ionicons.woff2
ionicons.woff
ionicons.ttf
ionicons.svg
```

若出現 404、MIME type 錯誤或跨域問題，就需要檢查建置後的資源路徑與部署配置。

### 10.5 檢查 `custom` 的自訂 CSS 是否完整

如果使用的是：

```vue
<Icon custom="i-icon i-icon-search" />
```

需要確認專案是否真的有定義：

```less
.i-icon {
    font-family: "YourIconFont";
}

.i-icon-search:before {
    content: "...";
}
```

如果只有傳 `custom`，但沒有提供自訂 icon font 的 CSS 與字體檔，圖標不會自動出現。

### 10.6 排錯總表

| 問題現象 | 可能原因 | 檢查方向 |
| --- | --- | --- |
| DOM 沒有 `ivu-icon-${type}` | `type` 沒有正確傳入或 class computed 異常 | 檢查 props 與 DOM class。 |
| DOM 有 class，但沒有圖標 | 缺少 `:before content` 或樣式未載入 | 檢查 `_ionicons-icons.less` 或編譯後 CSS。 |
| 出現方框或亂碼 | `font-family` 或字體檔載入失敗 | 檢查 `.ivu-icon` 與 Network 字體檔。 |
| 內建 icon 正常，自訂 icon 不正常 | 自訂 CSS / font 未載入 | 檢查 `.i-icon`、`.i-icon-search:before`、`@font-face`。 |
| 開發環境正常，部署後失敗 | 字體檔路徑或靜態資源部署問題 | 檢查 build output、public path、Network。 |

---

## 11. 常見誤區

| 誤區 | 為什麼容易誤解 | 正確理解 |
| --- | --- | --- |
| `Icon` component 裡面有每個 icon 的圖片 | 開發者在 Vue 中使用 `<Icon />`，容易以為圖標由元件本身提供 | 具體字形來自 icon font glyph 與 `:before content`。 |
| `type` 可以任意填字串 | `type` 是 `string`，表面上看似沒有約束 | 必須有對應 `.ivu-icon-${type}:before` 規則才會顯示內建圖標。 |
| `custom` 會自動支援任意第三方 icon | `custom` 能傳 class，容易誤以為只要 class 名稱就夠 | `custom` 只追加 class，第三方 CSS、`@font-face`、字體檔都要自行準備。 |
| `Icon` 一定有 `components/icon.less` | 很多元件都有自己的樣式檔 | v1.3.20 中 `Icon` 樣式屬於 common iconfont 系統。 |
| 圖標大小應該用 `width` / `height` 控制 | 圖片或 SVG 常用寬高控制 | icon font 模型下主要透過 `font-size` 控制。 |
| `content: "\f102"` 本身就是圖標 | 看起來像是一個特殊符號 | 它只是 code point，必須搭配正確 `font-family` 才能顯示成對應 glyph。 |
| CSS class 存在就一定會顯示圖標 | DOM 和 CSS 都看得到 class | 還需要字體檔成功載入，且 `font-family` 正確套用。 |

---

## 12. 閱讀路線建議

### 12.1 初次閱讀路線

如果你是第一次系統性閱讀 View UI Plus 的 `Icon`，建議按照以下順序：

1. 先看 `src/components/icon/icon.vue`，理解 `type`、`custom` 如何變成 class。
2. 再看 `src/styles/index.less` 與 `src/styles/common/index.less`，確認 icon font 樣式從哪裡被匯入。
3. 接著看 `src/styles/common/iconfont/ionicons.less`，理解它如何拆成 variables、font、icons。
4. 再看 `_ionicons-variables.less`，確認 font path、font family、prefix。
5. 接著看 `_ionicons-font.less`，理解 `@font-face` 與 `.ivu-icon` 基礎樣式。
6. 最後抽查 `_ionicons-icons.less` 中幾個 icon class，例如 `.ivu-icon-ios-add:before`。

這條路線的重點不是把所有圖標背起來，而是建立「props → class → CSS → font glyph」的完整模型。

### 12.2 深入閱讀路線

如果已經理解基本流程，可以再深入看：

| 深入方向 | 可以研究的問題 |
| --- | --- |
| 建置後資源 | Less 編譯後字體檔如何被搬到 dist？URL 是否會改寫？ |
| CSS cascade | `custom` class 和 `.ivu-icon` 同時存在時，`font-family` 誰生效？ |
| 與其他元件整合 | `Button`、`Tabs`、`Tree` 如何使用 `Icon`？ |
| icon font 與 SVG icon 比較 | 為什麼有些現代元件庫改用 SVG icon？兩者取捨是什麼？ |
| 主題與樣式覆蓋 | `Icon` 的大小、顏色如何被外部 CSS 或 props 控制？ |

---

## 13. 本章總結

`Icon` 的圖標字形不在 Vue component 裡，而在 icon font 樣式系統裡。

`Icon` component 負責產生：

```html
<i class="ivu-icon ivu-icon-${type}"></i>
```

樣式系統負責讓這些 class 變成可見圖標：

```txt
.ivu-icon
  -> 指定 Ionicons font-family 與基礎排版

.ivu-icon-${type}:before
  -> 指定具體 code point

Ionicons font file
  -> 提供 code point 對應的 glyph
```

因此，`Icon` 不是圖標資料庫，而是一個把 public props 接到 icon font class 系統的轉接層。它的價值在於用很小的 runtime API，把元件庫的圖標命名、CSS selector、字體資源與瀏覽器渲染串成一套穩定模型。

---

## 14. 自我檢查問題

1. `Icon` component 和 `src/styles/common/iconfont/` 各自負責什麼？
2. 為什麼 `.ivu-icon` 基礎 class 需要設定 `font-family`？
3. `.ivu-icon-ios-add:before` 的 `content` 有什麼作用？
4. `content: "\f102"` 為什麼不能單獨理解成圖標？
5. `<Icon type="ios-add" />` 從 props 到畫面顯示，完整流程是什麼？
6. 如果新增一套自訂 icon font，除了使用 `custom` prop，還需要準備哪些 CSS 與資源？
7. 為什麼 icon font 可以用 `font-size` 控制大小？
8. 為什麼 icon font 可以用 `color` 控制顏色？
9. 如果 DOM 中有 `ivu-icon-ios-add` class，但畫面沒有圖標，你會依序檢查哪些地方？
10. 為什麼 View UI Plus v1.3.20 中不一定能用 `components/icon.less` 找到 `Icon` 的樣式來源？

---

## 15. 後續延伸方向

本章之後，可以拆成以下幾篇更深入的筆記：

1. **`Icon` Runtime Source 閱讀**
   - 專門分析 `icon.vue` 中 props、computed class、computed style 與 template 輸出。

2. **View UI Plus 樣式入口與 Less 架構**
   - 從 `src/styles/index.less` 開始，整理 common、components、themes 之間的關係。

3. **Icon Font 與 SVG Icon 的架構比較**
   - 比較 icon font 和 SVG component 在效能、tree-shaking、多色圖標、可維護性上的差異。

4. **自訂 Icon Font 接入實作**
   - 實作一套自訂 `i-icon`，包含 `@font-face`、class prefix、`:before content` 與在 `Icon custom` 中使用。

5. **圖標不顯示的實務排錯案例**
   - 針對字體檔 404、public path 錯誤、CSS 未載入、class 名稱錯誤等情境建立排錯筆記。

---

## 16. 版本與資訊邊界

本章基於原始筆記中提供的 View UI Plus v1.3.20 檔案路徑與內容進行整理。以下資訊需要在實際專案中視版本重新確認：

- `src/styles/index.less`、`common/index.less`、`iconfont/ionicons.less` 的實際路徑。
- `_ionicons-variables.less` 中的字體路徑與版本。
- `_ionicons-font.less` 中 `.ivu-icon()` mixin 的完整 CSS 規則。
- `_ionicons-icons.less` 中實際存在的 icon class 清單。
- 建置後字體檔在 dist 或部署環境中的實際位置。

如果未來閱讀的是其他版本的 View UI Plus，請先確認這些檔案是否仍存在，以及命名規則是否保持一致。
