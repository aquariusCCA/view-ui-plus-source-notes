# Button / ButtonGroup Source Map：閱讀入口與責任分工

## 0. 原始筆記問題分析

這份原始筆記已經具備很好的 source map 雛形，能指出 `Button`、`ButtonGroup`、style、type、example、test 等重要入口，也已經提醒讀者不要只看單一 `.vue` 檔案。不過，如果要把它放進長期維護的個人知識庫，還可以再補強幾個面向。

首先，原始筆記比較像「已經讀過原始碼之後整理出的重點摘要」。它能快速告訴讀者每個檔案的角色，但對第一次閱讀 View UI Plus 原始碼的人來說，還需要更多背景說明：為什麼一個看似簡單的 `Button` 元件，會同時牽涉 runtime、mixin、Less 樣式、TypeScript 宣告、example 與 unit test。

其次，`Button` 與 `ButtonGroup` 的責任差異值得展開說明。`Button` 是一個真正承擔互動語意的元件，會處理 props、computed、render output、click 行為與 link/form 行為；`ButtonGroup` 則是非常薄的容器元件，它的主要價值不是複雜邏輯，而是透過父層 class 讓 Less selector 影響子按鈕的排列、邊框與圓角。

第三，原始筆記已經提到 `mixins/link.js` 與 `mixins/form.js`，但還可以更明確說明「mixin 會擴充元件 public API」這件事。閱讀元件庫時，如果只在 `button.vue` 裡搜尋 props，很容易漏掉由 mixin 注入的 `to`、`replace`、`target`、`append`、`itemDisabled` 等能力。

最後，原始筆記中的表格已經很有價值，但可以進一步轉化成「閱讀策略」。也就是不只列出檔案在哪裡，還要說明初學者應該先看哪個檔案、每個階段要驗證什麼問題、哪些內容應該延伸成後續獨立筆記。

> 筆記類型判斷：本篇主要屬於「原始碼閱讀筆記」，同時帶有「架構分析筆記」特徵。重構重點會放在元件來源地圖、模組責任分工、閱讀順序與常見誤解，而不是逐行解析完整原始碼。

---

## 1. 本章定位

本章是一篇針對 View UI Plus `Button` 與 `ButtonGroup` 的 source map 筆記。它的目的不是馬上深入每一個 props 的細節，也不是逐行講解 `render` function，而是先建立一張完整的閱讀地圖。

在閱讀元件庫原始碼時，最常見的錯誤是只打開元件本體，例如只看 `button.vue` 或只看 `button-group.vue`。這種讀法可以看到局部實作，但不容易看懂完整行為。因為元件庫通常會把能力拆散在不同層次中：元件本體負責 runtime，mixin 負責共用邏輯，Less 檔案負責視覺狀態，TypeScript 宣告負責 public contract，example 展示官方使用方式，test 則保護核心行為。

因此，本章要解決的核心問題是：

1. `Button` / `ButtonGroup` 的 runtime、type、style、example、test 分別在哪裡。
2. 哪些能力由 component 本身提供，哪些能力來自 mixin。
3. 為什麼 `ButtonGroup` 不能只看 `button-group.vue`，而要回到 Less 才能理解。
4. 初次閱讀這組元件時，應該按照什麼順序打開檔案。
5. 如何避免把 source map 讀成單純路徑清單，而是讀成一張元件架構圖。

讀完本章後，你應該能夠對 `Button` / `ButtonGroup` 建立完整的閱讀入口，並知道後續要如何拆成更細的 props、render、link、form、style、test 筆記。

---

## 2. Source Baseline

本章以本地保存的 View UI Plus `v1.3.20` 原始碼為準。以下路徑是本篇 source map 的核心依據。

| 類型 | 路徑 | 角色 | 閱讀重點 |
| --- | --- | --- | --- |
| `Button` runtime | `01-origin/source/view-ui-plus-v1.3.20/src/components/button/button.vue` | 定義 props、computed、methods、render output。 | 看 `Button` 如何決定輸出 `<button>` 或 `<a>`，以及如何組合 class、icon、loading 與 slot。 |
| `ButtonGroup` runtime | `01-origin/source/view-ui-plus-v1.3.20/src/components/button/button-group.vue` | 定義 group props、computed class 與 slot wrapper。 | 看 group 本身其實很薄，主要只是輸出包裹容器與 class。 |
| `Button` entry | `01-origin/source/view-ui-plus-v1.3.20/src/components/button/index.js` | 匯出 `button.vue` 作為單元件入口。 | 理解單一元件如何被封裝成可匯入模組。 |
| `ButtonGroup` entry | `01-origin/source/view-ui-plus-v1.3.20/src/components/button-group/index.js` | 從 `../button/button-group.vue` 匯出 group 元件。 | 注意 runtime 檔案與 entry 目錄不完全在同一層。 |
| Link mixin | `01-origin/source/view-ui-plus-v1.3.20/src/mixins/link.js` | 提供 `to`、`replace`、`target`、`append` 與 navigation methods。 | 補上 `Button` 作為連結或 router navigation 使用時的能力來源。 |
| Form mixin | `01-origin/source/view-ui-plus-v1.3.20/src/mixins/form.js` | 提供 `itemDisabled` 與 FormItem 事件回報能力。 | 理解 `Button` 為什麼不只受到自身 `disabled` prop 影響，也可能受上層 `Form` 狀態影響。 |
| Component style | `01-origin/source/view-ui-plus-v1.3.20/src/styles/components/button.less` | 定義 `ivu-btn-*` 與 `ivu-btn-group-*` 的具體樣式入口。 | 看 class 如何對應到不同按鈕狀態與 ButtonGroup 形態。 |
| Button style mixin | `01-origin/source/view-ui-plus-v1.3.20/src/styles/mixins/button.less` | 定義 button base、variant、size、disabled、circle、group mixins。 | 看樣式邏輯如何被抽成可重用 Less mixin。 |
| Type declaration | `01-origin/source/view-ui-plus-v1.3.20/types/button.d.ts` | 定義 `Button` / `ButtonGroup` 的 TypeScript public contract。 | 先從型別掌握對外 API，而不是一開始就陷入實作細節。 |
| Type export entry | `01-origin/source/view-ui-plus-v1.3.20/types/viewuiplus.components.d.ts` | 透過 `export { Button, ButtonGroup } from './button'` 匯出型別。 | 理解元件型別如何被集中匯出給使用者。 |
| Example | `01-origin/source/view-ui-plus-v1.3.20/examples/routers/button.vue` | 展示官方使用場景與 props 組合。 | 用官方範例反推主線 API 與常見組合。 |
| Unit test | `01-origin/source/view-ui-plus-v1.3.20/test/unit/specs/button.spec.js` | 驗證 tag output、`htmlType` 與 loading 行為。 | 看哪些行為是被測試保護的核心行為。 |
| Component registry | `01-origin/source/view-ui-plus-v1.3.20/src/components/index.js` | 對外匯出 `Button` 與 `ButtonGroup`。 | 理解元件如何進入整個 components export system。 |
| Plugin install | `01-origin/source/view-ui-plus-v1.3.20/src/index.js` | 將元件加入全域安裝流程，並提供 `iButton` alias。 | 理解元件如何被全域註冊，以及為什麼可能存在 alias。 |

這張表不能只被當成「檔案路徑速查表」。更好的讀法是把它視為一張分層圖：

- `button.vue` 與 `button-group.vue` 是 runtime 層。
- `mixins/link.js` 與 `mixins/form.js` 是共用行為層。
- `button.less` 與 `styles/mixins/button.less` 是視覺狀態層。
- `types/button.d.ts` 與 `types/viewuiplus.components.d.ts` 是 public contract 層。
- `examples/routers/button.vue` 是官方使用情境層。
- `button.spec.js` 是測試保護層。
- `src/components/index.js` 與 `src/index.js` 是元件匯出與全域安裝層。

---

## 3. 從整體架構理解 Button / ButtonGroup

`Button` / `ButtonGroup` 是元件庫中很適合拿來練習原始碼閱讀的一組元件。原因在於它們表面上看起來簡單，但實際行為橫跨多個層次。

從使用者角度來看，`Button` 只是按鈕：可以設定顏色、大小、loading、disabled、icon，也可以當作連結使用。可是從元件庫作者角度來看，這些能力背後需要拆成不同責任。

`Button` 本身要處理的是「一顆按鈕如何被渲染與互動」。它需要根據 props 決定 class，根據 link 狀態決定輸出 `<button>` 或 `<a>`，根據 loading 狀態決定是否顯示 loading icon，也需要在使用者點擊時執行正確流程。

`ButtonGroup` 則處理「多顆按鈕如何被視覺上組成一組」。它本身不需要理解每一顆子按鈕的內容，也不需要主動修改每個子按鈕的 props。它只需要在父層加上對應 class，讓樣式規則透過父子 selector 控制排列、邊框與圓角。

可以用下面的方式理解整體分工：

| 層次 | 主要檔案 | 責任 |
| --- | --- | --- |
| 元件行為層 | `button.vue` | 決定 `Button` 的 props、computed、methods、render output。 |
| 群組容器層 | `button-group.vue` | 提供 group wrapper，將 group 狀態轉成父層 class。 |
| 共用邏輯層 | `mixins/link.js`、`mixins/form.js` | 注入 link navigation 與 form disabled 相關能力。 |
| 樣式實作層 | `button.less`、`styles/mixins/button.less` | 定義按鈕狀態、尺寸、變體與 group 視覺效果。 |
| 型別契約層 | `types/button.d.ts` | 定義使用者能看到的 `Button` / `ButtonGroup` API。 |
| 範例驗證層 | `examples/routers/button.vue` | 展示官方預期使用方式。 |
| 測試保護層 | `button.spec.js` | 確認核心行為不被改壞。 |
| 對外入口層 | `src/components/index.js`、`src/index.js` | 將元件暴露給使用者與 plugin install 流程。 |

這種分層閱讀方式很重要。它能幫助你避免把所有責任都塞回 `.vue` 檔案裡理解，也能訓練你從元件庫架構角度思考：一個成熟元件的能力通常不是寫在單一檔案，而是由多個層次共同組合而成。

---

## 4. Button runtime：按鈕本體的行為入口

`button.vue` 是 `Button` 元件的主要 runtime 入口。所謂 runtime，指的是元件在執行期間真正會參與渲染、計算 class、處理事件與輸出 DOM 的部分。

根據原始筆記，`button.vue` 主要負責三件事。

第一，它宣告按鈕自己的 props，例如：

- `type`
- `shape`
- `size`
- `loading`
- `disabled`
- `htmlType`
- `icon`
- `customIcon`
- `long`
- `ghost`

這些 props 代表使用者可以直接控制的按鈕狀態。例如 `type` 通常用來決定按鈕變體，`size` 影響尺寸，`loading` 表示操作進行中，`disabled` 表示不可互動，`icon` 與 `customIcon` 則與圖示顯示有關。

第二，它透過 computed 將 props 轉換成 render 需要的資料，例如：

- `classes`
- `tagName`
- `tagProps`

這一層是閱讀 `Button` 時非常關鍵的部分。元件使用者傳入的是語意化 props，但最終渲染到 DOM 時需要變成 class、tag、attribute、事件與子節點。computed 的角色就是負責把「元件語意」轉成「渲染資料」。

第三，它在 render function 中決定實際輸出內容。根據原始筆記，`Button` 會決定輸出 `<button>` 或 `<a>`，並組合 loading icon、普通 icon 與 default slot。

這代表 `Button` 並不是固定輸出原生 `<button>`。當它帶有 link 相關能力時，可能會輸出 `<a>`。這也是為什麼後續必須閱讀 `mixins/link.js`，否則只看 `button.vue` 時會看到 `this.to`、`this.linkUrl`、`this.handleCheckClick()` 等內容，卻不知道它們真正來源。

### 4.1 `tagName` 與 `tagProps` 的閱讀重點

閱讀 `Button` runtime 時，建議特別留意 `tagName` 與 `tagProps` 這類 computed。

`tagName` 通常代表元件最後要渲染成哪一種 HTML tag。對 `Button` 來說，這個判斷會影響語意與屬性輸出。若輸出 `<button>`，它可以帶原生 button 的 `type` attribute；若輸出 `<a>`，它就更接近 link 行為，需要處理 `href`、`target` 或 router navigation。

`tagProps` 則是把不同 tag 需要的 attribute 與事件整理在一起。這種寫法可以避免 render function 裡面充滿分支判斷，也讓「渲染哪種 tag」與「該 tag 需要哪些 props」的邏輯集中管理。

### 4.2 `htmlType` 的角色

原始筆記提到 unit test 會驗證 `<button>` 搭配 `htmlType` 時，只有 button tag 才應輸出原生 `type` attribute。

這點很值得注意，因為元件層的 `type` 與原生 button 的 `type` 不是同一件事。

| 名稱 | 所屬層次 | 用途 |
| --- | --- | --- |
| `type` | View UI Plus `Button` prop | 通常用來控制按鈕視覺變體，例如 primary、dashed、text 等。 |
| `htmlType` | 原生 `<button>` 語意對應 | 對應原生 button 的 `type` attribute，例如 submit、button、reset。 |

如果元件庫直接把 `type` 同時用於視覺變體與原生屬性，就容易造成語意衝突。因此常見設計是：元件自己的 `type` 控制樣式，原生 `<button>` 的 `type` 則透過 `htmlType` 另行處理。

---

## 5. ButtonGroup runtime：薄容器與樣式驅動設計

`button-group.vue` 是 `ButtonGroup` 的 runtime 入口，但它與 `button.vue` 的複雜度完全不同。根據原始筆記，`ButtonGroup` 的輸出非常薄，核心結構如下：

```vue
<div :class="classes">
    <slot></slot>
</div>
```

這段結構說明了 `ButtonGroup` 的本質：它不是一個會主動管理子按鈕的邏輯元件，而是一個提供 group class 的容器元件。

換句話說，`ButtonGroup` 的 runtime 只做兩件事：

1. 根據自身 props 計算出父層 `classes`。
2. 透過 default slot 接收內部的 `Button` 子元素。

原始筆記特別指出，`ButtonGroup` 不會主動遍歷子按鈕，也不會把 `size` 或 `shape` 透過 provide/inject 傳給子按鈕。這點非常重要，因為它代表 `ButtonGroup` 的效果主要不是靠 JavaScript 資料傳遞完成，而是靠 Less 中的父子 selector 完成。

### 5.1 為什麼 ButtonGroup 不一定需要 provide/inject？

在 Vue 元件設計中，如果父元件要把狀態傳給深層子元件，常見方式是 props、slot props、provide/inject 或狀態管理。但不是所有場景都需要這麼做。

對 `ButtonGroup` 來說，它要處理的是一組按鈕在視覺上的排列關係，例如：

- 橫向或縱向排列。
- 相鄰按鈕之間的邊框重疊處理。
- 第一顆與最後一顆按鈕的圓角處理。
- group size 或 shape 對外觀的影響。

這些需求大多可以透過父層 class 搭配 CSS selector 處理。也就是說，只要父層出現 `ivu-btn-group`、`ivu-btn-group-vertical` 或其他狀態 class，Less 就能選到內部的 `.ivu-btn` 並套用對應樣式。

這種設計有一個好處：runtime 邏輯非常薄，元件不需要在 JavaScript 中主動修改每個子按鈕。但代價是：理解 `ButtonGroup` 時不能只看 `.vue` 檔案，必須回到 `button.less` 與 `styles/mixins/button.less`。

### 5.2 閱讀 ButtonGroup 時要避免的誤判

如果只看 `button-group.vue`，你可能會誤以為 `ButtonGroup` 沒有什麼功能，只是多包一層 `div`。但從元件庫角度來看，這層 `div` 的價值在於提供樣式作用域。

因此，閱讀 `ButtonGroup` 時要問的不是「它為什麼只有一個 wrapper」，而是：

- 這個 wrapper 會產生哪些 class？
- 這些 class 在 Less 裡對哪些子元素產生影響？
- group 的 `size`、`shape`、`vertical` 等狀態是如何轉成視覺效果的？
- 哪些效果是 runtime 做的，哪些效果是 style 做的？

---

## 6. Mixin 責任分工：Button 的隱性能力來源

原始筆記指出，`Button` 混入了兩組 mixin：

```js
mixins: [ mixinsLink, mixinsForm ]
```

這行程式碼是閱讀 `Button` 時的關鍵。它表示 `Button` 的能力不只來自 `button.vue` 自己宣告的 props、computed 與 methods，也來自 mixin 注入的內容。

| 來源 | 注入內容 | 在 `Button` 中的用途 | 閱讀時要注意什麼 |
| --- | --- | --- | --- |
| `mixins/link.js` | `to`、`replace`、`target`、`append`、`linkUrl`、`handleCheckClick()` | 讓 `Button` 可渲染成 `<a>`，並支援 router / URL navigation。 | 如果在 `button.vue` 找不到 `to` 的 props 宣告，不代表它不存在，因為它可能由 mixin 提供。 |
| `mixins/form.js` | `FormInstance`、`FormItemInstance`、`itemDisabled`、`handleFormItemChange()` | 讓 `Button` 可受到上層 `Form` disabled 狀態影響。 | `Button` 的 disabled 狀態可能不只來自自身 prop，也可能來自表單上下文。 |

### 6.1 Link mixin：讓 Button 具備連結語意

`mixins/link.js` 提供的是 navigation 相關能力。對使用者來說，這代表 `Button` 不只是普通按鈕，也可以像連結一樣使用。

根據原始筆記，link mixin 提供：

- `to`
- `replace`
- `target`
- `append`
- `linkUrl`
- `handleCheckClick()`

這些內容通常與 router navigation 或 URL navigation 有關。例如 `to` 可以用來表示目標位置，`replace` 可能對應 router replace 語意，`target` 可能對應 `<a>` 的開啟方式，`append` 則可能與路由拼接行為有關。

> 注意：本章只根據原始筆記建立 source map，不逐行展開 `mixins/link.js` 的完整實作細節。若要確認每個欄位的完整行為，應在後續獨立筆記中閱讀 `src/mixins/link.js`。

閱讀 link 行為時，要特別注意 `Button` 的 tag output。原始筆記提到 unit test 會驗證：有 `to` 時，`Button` 應渲染成 `<a>`；沒有 `to` 時，`Button` 應渲染成 `<button>`。這代表 link mixin 不只是多提供幾個 props，而是會影響最終 DOM 語意。

### 6.2 Form mixin：讓 Button 受到表單上下文影響

`mixins/form.js` 的角色是讓 `Button` 能與上層 `Form` 或 `FormItem` 互動。原始筆記指出，它提供：

- `FormInstance`
- `FormItemInstance`
- `itemDisabled`
- `handleFormItemChange()`

其中最值得注意的是 `itemDisabled`。原始筆記明確提到，`Button` 不只讀自己的 `disabled` prop，也會讀上層 `FormInstance.disabled`。

這代表 `disabled` 的語意不是單一來源，而是可能由兩個層次共同決定：

| disabled 來源 | 說明 |
| --- | --- |
| `Button` 自身的 `disabled` prop | 使用者直接在按鈕上指定不可用。 |
| 上層 `FormInstance.disabled` | 表單層級統一控制內部元件不可用。 |

這是元件庫常見設計：當表單整體處於 disabled 狀態時，內部輸入元件或操作元件應該一起呈現不可操作狀態。這樣使用者不需要在每一個子元件上重複設定 `disabled`。

---

## 7. Style 責任分工：ButtonGroup 的真正重點在 Less

`button.less` 是 `Button` / `ButtonGroup` 的樣式入口。它負責把不同 class 對應到具體視覺狀態。原始筆記列出了一批重要 class，例如：

```txt
ivu-btn
ivu-btn-primary
ivu-btn-dashed
ivu-btn-text
ivu-btn-success
ivu-btn-warning
ivu-btn-error
ivu-btn-info
ivu-btn-loading
ivu-btn-ghost
ivu-btn-group
ivu-btn-group-vertical
```

這些 class 可以分成幾類來理解。

| 類別 | 代表 class | 說明 |
| --- | --- | --- |
| 基礎按鈕 | `ivu-btn` | 所有 Button 都會依賴的基礎樣式。 |
| 視覺變體 | `ivu-btn-primary`、`ivu-btn-dashed`、`ivu-btn-text`、`ivu-btn-success`、`ivu-btn-warning`、`ivu-btn-error`、`ivu-btn-info` | 對應不同 `type` 或狀態的外觀。 |
| 狀態樣式 | `ivu-btn-loading`、`ivu-btn-ghost` | 對應 loading、ghost 等特殊狀態。 |
| 群組樣式 | `ivu-btn-group`、`ivu-btn-group-vertical` | 對應 ButtonGroup 的橫向或縱向排列效果。 |

### 7.1 `styles/mixins/button.less` 的角色

原始筆記指出，很多底層樣式規則其實在 `styles/mixins/button.less` 中。

| Style mixin | 責任 | 閱讀重點 |
| --- | --- | --- |
| `.btn()` | button 基礎 display、cursor、border、size、disabled、icon-only。 | 看一顆按鈕最基本的外觀與互動游標如何建立。 |
| `.btn-default()` / `.btn-primary()` / `.btn-color()` | 不同 type 的顏色與 hover / active 狀態。 | 看視覺變體如何被抽象成 mixin，而不是重複寫死。 |
| `.btn-circle()` | circle 與 icon-only circle 的尺寸和圓角。 | 看形狀相關樣式如何處理。 |
| `.btn-group()` | 橫向 group 的負 margin、邊框與圓角處理。 | 看多顆按鈕並排時如何避免雙邊框與圓角衝突。 |
| `.btn-group-vertical()` | 縱向 group 的 block 排列、負 margin 與上下圓角處理。 | 看縱向排列時如何改變邊框重疊與圓角方向。 |

這裡要特別理解 Less mixin 的價值。元件庫的樣式通常不會把所有規則都直接寫在 component style entry 中，而是把可重複使用的規則抽到 mixin。這樣做可以讓不同按鈕變體共用基礎邏輯，也讓樣式維護更集中。

### 7.2 為什麼 ButtonGroup 必須讀 Less？

`ButtonGroup` 的 runtime 很薄，只負責輸出 wrapper 與 class。真正讓多顆按鈕看起來像一組的，是 Less 中的群組樣式。

例如橫向 group 通常需要處理：

- 相鄰按鈕的邊框重疊。
- 第一顆按鈕的左側圓角。
- 最後一顆按鈕的右側圓角。
- 中間按鈕不要有不必要的圓角。
- hover / active 狀態下邊框層級不要互相遮擋。

縱向 group 則要改成處理上下方向：

- 相鄰按鈕的上下邊框重疊。
- 第一顆按鈕的上方圓角。
- 最後一顆按鈕的下方圓角。
- 內部按鈕呈現 block 或垂直排列。

這些細節都不是 `button-group.vue` 能直接告訴你的。因此，`ButtonGroup` 是學習「CSS-driven component behavior」的好案例：元件行為看似在 Vue 檔案中，但真正的視覺效果由樣式層完成。

---

## 8. Type declaration 與 public contract

閱讀元件庫時，建議先看 `types/button.d.ts`，原因是型別宣告通常最接近使用者視角。它會告訴你元件對外公開哪些 props、事件、方法或型別，而不會一開始就讓你陷入實作細節。

在本篇 source map 中，`types/button.d.ts` 的角色是定義 `Button` / `ButtonGroup` 的 TypeScript public contract。這個檔案可以幫你先回答幾個問題：

1. 使用者可以在 `Button` 上傳哪些 props？
2. 使用者可以在 `ButtonGroup` 上傳哪些 props？
3. `Button` 與 `ButtonGroup` 的型別是否一起定義？
4. 型別層是否有暴露 runtime 中不容易直接看出的 API？

另一個相關檔案是：

```txt
types/viewuiplus.components.d.ts
```

原始筆記指出，它會透過以下方式匯出型別：

```ts
export { Button, ButtonGroup } from './button'
```

這表示 `types/button.d.ts` 不只是孤立的型別檔，而是會被整個元件型別匯出入口重新暴露出去。從使用者角度來看，這層匯出決定了在 TypeScript 專案中使用 View UI Plus 時能否正確取得元件型別提示。

### 8.1 為什麼建議先讀 type？

如果一開始就讀 `button.vue`，你會同時看到 props、computed、methods、render、mixin、class 組合與事件處理。這些資訊很多，但不一定容易形成整體圖像。

相反地，先讀 `types/button.d.ts` 可以先建立 public API 地圖。你會先知道這個元件「對外承諾」了什麼，再回頭看 runtime 如何實現這些承諾。這種順序比較適合初次閱讀元件庫。

---

## 9. Entry、registry 與 plugin install

除了 runtime、style 與 type 之外，source map 還需要理解元件如何被匯出給使用者。

原始筆記列出了四個與入口相關的檔案：

| 檔案 | 角色 |
| --- | --- |
| `src/components/button/index.js` | 匯出 `button.vue` 作為 `Button` 單元件入口。 |
| `src/components/button-group/index.js` | 從 `../button/button-group.vue` 匯出 `ButtonGroup` 元件。 |
| `src/components/index.js` | 對外匯出 `Button` 與 `ButtonGroup`。 |
| `src/index.js` | 將元件加入全域安裝流程，並提供 `iButton` alias。 |

這些檔案的重點不是元件細節，而是「元件如何被使用者取得」。

在元件庫中，通常會有至少兩種使用方式：

1. 使用者單獨匯入某個元件。
2. 使用者透過 plugin install 一次全域註冊整個元件庫。

`src/components/button/index.js` 與 `src/components/button-group/index.js` 比較接近單元件入口；`src/components/index.js` 則是集中匯出所有元件；`src/index.js` 則通常負責整個 library 的安裝流程。

原始筆記也提到 `src/index.js` 提供 `iButton` alias。這代表在閱讀元件註冊流程時，除了標準元件名稱，也要注意是否存在相容舊命名、避免原生命名衝突或維持歷史 API 的 alias。

> 注意：本章只根據原始筆記指出 `iButton` alias 的存在，不進一步推測它的歷史原因。若要確認 alias 的完整設計背景，需要補讀 `src/index.js` 與相關 release / migration 資料。

---

## 10. Example 與 Test 的閱讀價值

`examples/routers/button.vue` 與 `test/unit/specs/button.spec.js` 分別提供兩種不同價值。

example 是「官方希望使用者怎麼用」。它通常展示主線 API、常見組合與文件中希望強調的功能。

test 是「哪些行為不能壞」。它通常不會涵蓋所有情境，但被測試保護的行為通常是元件作者認為重要、容易回歸或需要明確保證的部分。

### 10.1 Example：用官方範例反推主線能力

原始筆記指出，`examples/routers/button.vue` 展示了以下組合：

- `type`
- `disabled`
- `ghost`
- icon-only
- custom icon
- link
- router object
- `ButtonGroup size`
- `ButtonGroup shape`
- `ButtonGroup vertical`

這些範例可以幫你反推 `Button` / `ButtonGroup` 的主線能力。

例如，如果官方範例展示了 link 與 router object，就代表 `Button` 不只是視覺按鈕，也具備 navigation 使用場景。如果官方範例展示了 `ButtonGroup vertical`，就代表 group 的方向切換是公開使用情境，而不是內部偶然實作。

因此，讀 example 時不要只看畫面效果，而要反問：

1. 官方示範了哪些 props 組合？
2. 哪些組合反映出元件的核心設計目標？
3. 哪些範例需要回到 runtime 才能理解？
4. 哪些範例需要回到 style 才能理解？

### 10.2 Test：確認被保護的核心行為

原始筆記指出，`test/unit/specs/button.spec.js` 主要驗證以下行為：

| 測試情境 | 驗證重點 | 對閱讀者的意義 |
| --- | --- | --- |
| 有 `to` | `Button` 應渲染成 `<a>`。 | 說明 link 行為會影響 tag output。 |
| 沒有 `to` | `Button` 應渲染成 `<button>`。 | 說明普通狀態仍保留 button 語意。 |
| `<button>` 搭配 `htmlType` | 只有 button tag 才應輸出原生 `type` attribute。 | 說明元件 `type` 與原生 `type` 被刻意區分。 |
| loading state | click 後可以進入 `ivu-btn-loading`，並渲染 `ios-loading` icon。 | 說明 loading 是核心視覺狀態之一。 |

test 的價值不只是確認結果，也可以幫你抓閱讀優先級。當你不確定該先讀哪段行為時，可以先看 test 保護了什麼。被測試覆蓋的行為通常應該優先理解。

---

## 11. 建議閱讀順序

第一次閱讀 `Button` / `ButtonGroup` 時，建議不要從 `button.less` 開始，也不要只盯著 `button.vue`。比較穩定的順序如下。

### 11.1 第一階段：先建立 public API 地圖

先讀：

```txt
types/button.d.ts
```

這一步的目標是先知道 `Button` / `ButtonGroup` 對外提供哪些能力。你不需要在這個階段理解所有實作，只要先建立 API 名單與大致分類。

閱讀問題：

- `Button` 有哪些 props？
- `ButtonGroup` 有哪些 props？
- 哪些 props 是視覺相關？
- 哪些 props 是行為相關？
- 哪些 props 可能來自 mixin？

### 11.2 第二階段：用 example 對照使用情境

接著讀：

```txt
examples/routers/button.vue
```

這一步的目標是看官方如何實際使用這組元件。型別宣告告訴你「能用什麼」，example 告訴你「通常怎麼用」。

閱讀問題：

- 官方展示了哪些 type？
- disabled、ghost、loading、icon 是如何被組合的？
- link 與 router object 的使用方式在哪裡？
- `ButtonGroup` 的 size、shape、vertical 如何出現在範例中？

### 11.3 第三階段：回到 Button runtime

再讀：

```txt
src/components/button/button.vue
```

這一步要理解 `Button` 的核心 runtime，包括 props、computed、methods、render 與 click handler。

閱讀問題：

- `classes` 如何由 props 組合而成？
- `tagName` 如何決定輸出 `<button>` 或 `<a>`？
- `tagProps` 如何處理原生 attribute 與事件？
- loading icon 與普通 icon 如何被組合？
- click handler 如何與 link 行為連動？

### 11.4 第四階段：補讀 mixin

接著讀：

```txt
src/mixins/link.js
src/mixins/form.js
```

這一步要補上 `button.vue` 裡看得到使用、但不一定看得到宣告來源的內容。

閱讀問題：

- `to`、`replace`、`target`、`append` 從哪裡來？
- `linkUrl` 如何被計算？
- `handleCheckClick()` 做了什麼？
- `itemDisabled` 如何受 `FormInstance.disabled` 影響？
- mixin 注入的 props 是否也屬於 public API？

### 11.5 第五階段：閱讀 ButtonGroup runtime

再讀：

```txt
src/components/button/button-group.vue
```

這一步要確認 `ButtonGroup` 本身很薄。它主要負責把 group 狀態轉成 class，並用 slot 包住子按鈕。

閱讀問題：

- `ButtonGroup` 有哪些 props？
- `classes` 如何組合？
- runtime 是否有遍歷子按鈕？
- runtime 是否有 provide/inject？
- 哪些行為必須回到 Less 才能理解？

### 11.6 第六階段：閱讀 Button / ButtonGroup style

接著讀：

```txt
src/styles/components/button.less
src/styles/mixins/button.less
```

這一步要理解視覺狀態與 group 效果。

閱讀問題：

- `ivu-btn-*` class 如何對應不同 type？
- loading、ghost、disabled、circle 如何處理？
- `.btn-group()` 如何處理橫向 group？
- `.btn-group-vertical()` 如何處理縱向 group？
- `ButtonGroup` 的 `size`、`shape`、`vertical` 最終如何反映到 CSS？

### 11.7 第七階段：用 test 回頭驗證理解

最後讀：

```txt
test/unit/specs/button.spec.js
```

這一步要確認哪些行為被測試保護，並用測試反推元件作者真正關心的核心行為。

閱讀問題：

- 有 `to` 與沒有 `to` 的 tag output 是否符合預期？
- `htmlType` 是否只在 `<button>` 上輸出？
- loading 狀態是否有對應 class 與 icon？
- 是否有某些你以為重要的行為尚未被測試覆蓋？

---

## 12. 常見誤解與閱讀陷阱

### 12.1 誤解一：只看 `button.vue` 就能理解 Button

`button.vue` 確實是核心 runtime，但它不是全部。link 行為來自 `mixins/link.js`，form disabled 行為來自 `mixins/form.js`，style 變體來自 Less，public contract 則需要看 type declaration。

如果只看 `button.vue`，你可能會漏掉 `to`、`replace`、`target`、`append` 等從 mixin 注入的 props，也可能無法完整理解 `itemDisabled` 的來源。

### 12.2 誤解二：`ButtonGroup` 沒有邏輯，所以不重要

`ButtonGroup` 的 `.vue` 檔案雖然很薄，但它是樣式作用域的入口。它產生的父層 class 會讓 Less selector 影響內部按鈕。這種設計不是沒有邏輯，而是把主要責任轉移到 style layer。

### 12.3 誤解三：元件的 `type` 等於原生 button 的 `type`

在元件庫中，`type` 通常代表視覺變體；原生 `<button>` 的 `type` attribute 則可能透過 `htmlType` 處理。這兩者不能混在一起，否則會讓 API 語意混亂。

### 12.4 誤解四：mixin 只是內部工具，不影響 public API

如果 mixin 注入 props，這些 props 對使用者來說也可能是可傳入的 API。閱讀元件庫時，不能只在 component 本體裡找 props，還要追蹤 mixin。

### 12.5 誤解五：example 只是展示畫面，不值得讀

example 可以幫你確認官方推薦用法，也能反推出主線功能。尤其是當你不知道哪些 props 是核心、哪些只是補充時，example 往往比逐行讀 source 更快建立優先級。

---

## 13. 從本章延伸出的後續筆記

本章是 source map，不適合把所有細節一次塞進來。後續可以拆成以下獨立筆記：

| 後續主題 | 建議內容 |
| --- | --- |
| `Button` props 詳解 | 系統整理 `type`、`shape`、`size`、`loading`、`disabled`、`htmlType`、`icon`、`customIcon`、`long`、`ghost` 的語意與相互影響。 |
| `Button` render flow | 詳細拆解 `classes`、`tagName`、`tagProps`、icon rendering、slot rendering 與 click handler。 |
| `mixins/link.js` 閱讀 | 逐步分析 `to`、`replace`、`target`、`append`、`linkUrl`、`handleCheckClick()` 如何支援 router / URL navigation。 |
| `mixins/form.js` 閱讀 | 分析 `FormInstance.disabled` 如何影響 `Button`，以及 FormItem 事件回報能力在其他元件中的共用價值。 |
| `ButtonGroup` style 機制 | 專門分析 `.btn-group()`、`.btn-group-vertical()` 如何處理邊框、負 margin、圓角與排列方向。 |
| `Button` type declaration | 對照 `types/button.d.ts` 與 runtime props，檢查 public contract 和實作是否一致。 |
| `Button` unit test 閱讀 | 逐一閱讀 `button.spec.js`，理解測試如何保護 tag output、`htmlType`、loading 等行為。 |
| 元件註冊與 alias | 從 `src/components/index.js` 與 `src/index.js` 看 `Button`、`ButtonGroup`、`iButton` 如何被對外暴露。 |

這樣拆分可以讓筆記維持清楚邊界。本章先負責「知道要讀哪些檔案與為什麼」，後續章節再負責「深入讀每個檔案」。

---

## 14. 本章總結

`Button` / `ButtonGroup` 的完整行為不是由單一檔案決定，而是分散在 runtime、mixin、style、type、example、test 與 export/install 多個層次中。

`button.vue` 是 `Button` 的主要行為入口，負責 props、computed、methods、render output 與 click 流程。`mixins/link.js` 補上 navigation 能力，讓 `Button` 可以根據 `to` 等設定渲染成 `<a>` 並處理 router / URL 行為。`mixins/form.js` 補上 form context，讓 `Button` 的 disabled 狀態可以受到上層 `FormInstance.disabled` 影響。

`button-group.vue` 則是一個很薄的容器元件。它的重點不在於 JavaScript runtime，而在於透過父層 class 讓 `button.less` 與 `styles/mixins/button.less` 接手處理 group 視覺效果。這也是閱讀 `ButtonGroup` 時最容易誤判的地方：它不是沒有功能，而是功能主要落在 style layer。

`types/button.d.ts` 可以幫助你從 public API 角度建立地圖，`examples/routers/button.vue` 可以幫你理解官方使用情境，`button.spec.js` 則可以幫你確認哪些行為被測試保護。

因此，這組元件很適合用來學習元件庫原始碼閱讀的基本方法：不要只看 component 本體，而要把 runtime、shared logic、style、type、example、test 與 install 流程串成一張完整的 source map。

---

## 15. 自我檢查問題

1. `Button` 的主要 runtime 入口是哪一個檔案？它主要負責哪三件事？
2. `ButtonGroup` 的 runtime 為什麼可以很薄？它真正重要的效果主要在哪一層完成？
3. `Button` 的 `to`、`replace`、`target`、`append` 來自哪個檔案？為什麼只看 `button.vue` 可能找不到它們的來源？
4. `Button` 為什麼會用到 `itemDisabled`？它和 `FormInstance.disabled` 有什麼關係？
5. `type` 與 `htmlType` 分別代表什麼？為什麼元件庫需要把它們分開？
6. `button.less` 與 `styles/mixins/button.less` 的責任差異是什麼？
7. `.btn-group()` 與 `.btn-group-vertical()` 大致分別負責什麼？
8. `types/button.d.ts` 在原始碼閱讀中有什麼價值？為什麼建議先看型別宣告？
9. `examples/routers/button.vue` 可以幫助你確認哪些資訊？
10. `button.spec.js` 驗證了哪些核心行為？這些測試如何幫助你決定閱讀優先級？

---

## 16. 後續延伸方向

完成本章後，建議依照以下順序繼續深入：

1. **深入 `Button` props 與 class mapping**：整理每個 prop 如何轉成 `ivu-btn-*` class。
2. **深入 `Button` render function**：分析 `tagName`、`tagProps`、loading icon、普通 icon、default slot 的組合流程。
3. **深入 link mixin**：釐清 `to`、`replace`、`target`、`append` 與 router navigation 的完整關係。
4. **深入 form mixin**：理解 `FormInstance.disabled` 如何向下影響表單內元件。
5. **深入 ButtonGroup 樣式機制**：用 Less selector 角度分析 group 的橫向、縱向、圓角與邊框處理。
6. **對照 type 與 runtime**：檢查 `types/button.d.ts` 宣告的 public API 是否都能在 runtime 或 mixin 中找到來源。
7. **閱讀 unit test**：從測試案例反推元件作者認為不可破壞的核心行為。

這樣延伸可以把本章的 source map 逐步拆成完整的原始碼閱讀系列，避免一次筆記塞入太多細節，也能讓每一篇筆記都有清楚的學習目標。
