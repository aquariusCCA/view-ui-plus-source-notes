# View UI Plus Cell / CellGroup Source Map：閱讀入口、責任分工與心智模型

## 1. 本章定位

本章是一篇 View UI Plus `Cell / CellGroup` 的原始碼閱讀地圖，也就是 Source Map 筆記。它的目標不是逐行分析每一段程式碼，而是先幫讀者建立一張完整的閱讀地圖：哪些檔案是入口、哪些檔案定義 runtime 行為、哪些檔案負責內部結構、哪些檔案補上樣式與型別契約，以及哪些範例可以作為使用情境的驗證來源。

讀完本章後，你應該能夠理解以下幾件事。

第一，`Cell`、`CellGroup` 與 `CellItem` 在 runtime 中的角色不同。`CellGroup` 是 public component，負責包住子項並收集子項 click；`Cell` 也是 public component，負責對外暴露 props、slots、link branch、click 與 arrow 行為；`CellItem` 則是 internal component，只負責內部 DOM 展示結構。

第二，`Cell` 的完整 public contract 不能只看 `cell.vue`。因為 `Cell` 自己只定義部分 props 與 template 行為，link 相關 props 與 navigation 方法來自 `mixins/link.js`，全域 arrow 設定則與 `mixins/globalConfig.js`、`src/index.js` 以及 `$VIEWUI.cell` 有關。

第三，`Cell / CellGroup` 的理解要同時橫跨 runtime、style、type、example 與 export/install。若只看 `.vue` 檔，會漏掉型別宣告與安裝入口；若只看 `.d.ts`，會誤以為型別就是實際 runtime 行為；若只看 example，則只能知道用法，無法理解行為來源。

本章不處理的內容包括：`cell.vue` click handler 的逐行分析、`mixins/link.js` 導頁邏輯的完整分支、`cell.less` 所有 selector 的逐條解析，以及 View UI Plus install 流程的完整架構。這些內容適合拆成後續獨立筆記。

---

## 2. 學習前先建立的基本觀念

### 2.1 Source Map 不是逐行閱讀，而是建立閱讀座標

閱讀元件原始碼時，最常見的問題不是「看不懂某一行」，而是「不知道該先看哪裡」。Source Map 筆記的價值就在於先把元件拆成不同層次，讓讀者知道每個檔案解決什麼問題。

以 `Cell / CellGroup` 來說，如果一開始就直接打開 `cell.vue`，你可能會看到 props、computed class、template branch、click handler、slot forwarding 等內容，但你不會立刻知道 link props 從哪裡來，也不會知道 arrow 的全域設定在哪裡建立，更不會知道 `CellItem` 是否是對外元件。因此，Source Map 的第一個任務是先回答「這個元件的完整行為散落在哪些地方」。

### 2.2 Public component 與 internal component 要分清楚

在元件庫中，不是每個 `.vue` 檔都代表使用者可以直接使用的 public component。

`Cell` 與 `CellGroup` 是 public component，因為它們有對外匯出、型別宣告、example 使用方式與全域註冊入口。使用者可以在模板中直接寫：

```vue
<CellGroup>
  <Cell title="Title" />
</CellGroup>
```

但 `CellItem` 不同。它雖然也是 `.vue` 檔，卻是 `Cell` 內部用來拆分展示結構的 internal component。它的存在是為了讓 `Cell` 的 template 不需要直接承擔 icon、title、label、footer、extra 等所有 DOM 結構。這種內部分層是元件庫常見設計：public component 對外穩定，internal component 服務於實作可讀性與可維護性。

### 2.3 Runtime、Type、Style、Example 是不同層的真相

理解元件時，不同檔案回答的是不同問題。

`cell.vue` 與 `cell-group.vue` 回答的是 runtime 問題：元件實際渲染什麼、點擊時做什麼、如何和父子元件互動。

`types/cell.d.ts` 回答的是 public contract 問題：使用者在 TypeScript 與 IDE 中能看到哪些 props、slots 與 events。

`cell.less` 與 `mixins/select.less` 回答的是視覺結果問題：class 最後如何轉換成畫面上的 hover、selected、disabled、footer、arrow 等效果。

`examples/routers/cell.vue` 回答的是使用情境問題：官方如何展示 `CellGroup`、`Cell`、`on-click`、`selected`、`disabled`、`extra`、`to` 與 `target`。

這些檔案不是互相取代，而是互相補完。閱讀 View UI Plus 這類元件庫時，應該把它們視為同一個元件契約的不同投影。

### 2.4 `provide / inject` 是父子通訊的隱性通道

`CellGroup` 與 `Cell` 之間不是靠顯式 prop 傳遞 click handler，而是透過 Vue 的 `provide / inject` 建立父子通訊。`CellGroup` 會 provide `CellGroupInstance`，讓子層 `Cell` 可以呼叫父層的 `handleClick(name)`，再由 `CellGroup` 對外 emit `on-click`。

這個設計代表 `CellGroup` 的主要責任不是控制每個 `Cell` 的 UI 狀態，而是提供一個 group-level event outlet。換句話說，`CellGroup` 是事件聚合者，不是狀態管理器。

### 2.5 Mixin 會讓元件契約分散

`cell.vue` 同時混入 `mixins/link.js` 與 `mixins/globalConfig.js`。這表示你看到的 `Cell` 行為有一部分不是直接寫在 `cell.vue` 內，而是從 mixin 注入進來。

這對原始碼閱讀很重要。若只看 `cell.vue` 的 props，你會漏掉 `to`、`replace`、`target`、`append` 這些 link props。若只看 template，你也可能不清楚 navigation 方法從哪裡來。因此，閱讀使用 mixin 的元件時，要特別建立一個習慣：看到 `mixins: [...]` 時，就要把 mixin 也納入 public contract 與 runtime 行為的分析範圍。

---

## 3. 整體概覽

### 3.1 五層心智模型

`Cell / CellGroup` 可以用五層來理解。

```text
使用者使用層
  ↓
<CellGroup> 與 <Cell> 的 public API
  ↓
Runtime 行為層
  ↓
cell-group.vue / cell.vue / cell-item.vue
  ↓
共用邏輯層
  ↓
mixins/link.js / mixins/globalConfig.js
  ↓
樣式與視覺層
  ↓
cell.less / mixins/select.less
  ↓
型別與匯出層
  ↓
types/cell.d.ts / components/index.js / src/index.js
```

這個模型的重點是：`Cell` 不是一個單檔元件，而是一組協作檔案形成的元件功能。`cell.vue` 是核心，但不是全部；`cell-group.vue` 提供 group event；`cell-item.vue` 提供展示結構；`link.js` 補上導頁；`globalConfig.js` 補上全域設定讀取；`cell.less` 與 `select.less` 決定最後視覺；`.d.ts` 與 export entry 決定使用者看到的對外契約。

### 3.2 Source Baseline

本章以本地保存的 View UI Plus `v1.3.20` 原始碼為準。以下表格整理各來源檔案的角色與初次閱讀重點。

| 類型 | 路徑 | 角色 | 初次閱讀重點 |
| --- | --- | --- | --- |
| Runtime | `01-origin/source/view-ui-plus-v1.3.20/src/components/cell/cell.vue` | 定義 `Cell` props、slots、class、click、link wrapper 與 arrow。 | 先看 `to` branch、`CellItem` slot 轉發、click handler 與 class 組成。 |
| Runtime internal | `01-origin/source/view-ui-plus-v1.3.20/src/components/cell/cell-item.vue` | 定義內部展示結構：icon、main、title、label、footer、extra。 | 確認它只負責 DOM 結構，不負責 click、inject 或 navigation。 |
| Runtime group | `01-origin/source/view-ui-plus-v1.3.20/src/components/cell/cell-group.vue` | 定義 group wrapper、provide `CellGroupInstance` 與 `on-click` emit。 | 觀察 `provide()` 與 `handleClick(name)` 如何讓子項 click 回報到 group。 |
| Runtime entry | `01-origin/source/view-ui-plus-v1.3.20/src/components/cell/index.js` | 匯出 `cell.vue` 作為 `Cell` 單元件入口。 | 確認 `Cell` 的單元件匯出來源。 |
| Runtime entry | `01-origin/source/view-ui-plus-v1.3.20/src/components/cell-group/index.js` | 從 `cell/cell-group.vue` 匯出 `CellGroup` 單元件入口。 | 確認 `CellGroup` 的單元件匯出來源。 |
| Shared logic | `01-origin/source/view-ui-plus-v1.3.20/src/mixins/link.js` | 提供 `to`、`replace`、`target`、`append` props 與 navigation 方法。 | 補上 `Cell` 本身沒有直接宣告的 link contract。 |
| Shared logic | `01-origin/source/view-ui-plus-v1.3.20/src/mixins/globalConfig.js` | 從 Vue app globalProperties 讀取 `$VIEWUI`。 | 理解全域設定如何影響 arrow 相關行為。 |
| Component style | `01-origin/source/view-ui-plus-v1.3.20/src/styles/components/cell.less` | 定義 `ivu-cell`、link、icon、main、label、footer、arrow、selected、disabled。 | 對照 template class，看每個 class 如何轉成視覺結果。 |
| Style mixin | `01-origin/source/view-ui-plus-v1.3.20/src/styles/mixins/select.less` | 透過 `.select-item()` 補上共用 item padding、hover、disabled、selected 規則。 | 不要只看 `cell.less`，selected / disabled / hover 還需要看共用 mixin。 |
| Style entry | `01-origin/source/view-ui-plus-v1.3.20/src/styles/components/index.less` | 透過 `@import "cell";` 將 cell 樣式納入元件樣式集合。 | 確認 cell 樣式如何進入整體元件樣式。 |
| Type declaration | `01-origin/source/view-ui-plus-v1.3.20/types/cell.d.ts` | 定義 `Cell` / `CellGroup` 的 public props、slots 與 event listener contract。 | 從使用者角度建立 props、slots、event 的表面契約。 |
| Global options type | `01-origin/source/view-ui-plus-v1.3.20/types/index.d.ts` | 定義 install options 裡的 `cell.arrow`、`cell.customArrow`、`cell.arrowSize`。 | 對照 `$VIEWUI.cell` 的全域 arrow 設定。 |
| Type export entry | `01-origin/source/view-ui-plus-v1.3.20/types/viewuiplus.components.d.ts` | 透過 `export { Cell, CellGroup } from './cell'` 匯出型別。 | 確認型別層如何對外提供 `Cell` 與 `CellGroup`。 |
| Example | `01-origin/source/view-ui-plus-v1.3.20/examples/routers/cell.vue` | 展示 `CellGroup`、`Cell`、`on-click`、selected、disabled、extra、to、target。 | 把 example 當成 public API 的使用樣本與驗證入口。 |
| Component registry | `01-origin/source/view-ui-plus-v1.3.20/src/components/index.js` | 對外匯出 `Cell` 與 `CellGroup`。 | 確認 runtime component map 中是否有 `Cell` 與 `CellGroup`。 |
| Plugin install | `01-origin/source/view-ui-plus-v1.3.20/src/index.js` | 註冊所有 components，並建立 `$VIEWUI.cell` 的 arrow 預設設定。 | 理解元件如何被全域註冊，以及全域預設值在哪裡建立。 |

這張表不是用來死背路徑，而是用來建立閱讀順序。初次閱讀時，應先從 type 與 example 建立「使用者看到什麼」，再回到 runtime 看「實際怎麼做」，最後看 style、mixin 與 install 補齊細節。

---

## 4. 核心內容逐步講解

### 4.1 `CellGroup`：事件聚合者，而不是狀態管理器

`CellGroup` 是 `Cell / CellGroup` 這組元件中的父層容器。從 template 來看，它的結構非常簡單，只是用一個 group wrapper 包住 slot。

```vue
<div class="ivu-cell-group">
    <slot></slot>
</div>
```

如果只看這段 template，很容易誤以為 `CellGroup` 只是排版容器。但真正重要的行為在 `provide()` 與 `handleClick()`。

```js
provide () {
    return {
        CellGroupInstance: this
    }
},
methods: {
    handleClick (name) {
        this.$emit('on-click', name);
    }
}
```

這段設計可以拆成兩層理解。

第一層，`CellGroup` 透過 `provide()` 把自己以 `CellGroupInstance` 的 key 提供給後代元件。這代表子層 `Cell` 不需要透過 prop 層層傳遞，也能取得父層 group instance。

第二層，`CellGroup` 提供 `handleClick(name)` 方法。當子項 `Cell` 被點擊時，可以把自己的 `name` 傳回父層，父層再對外 emit `on-click`。因此，使用者監聽的是 `CellGroup` 的 `on-click`，而不是每個 `Cell` 都自己對外 emit group-level event。

這裡要特別注意：`CellGroup` 不負責改變子項 props，也不管理 selected 狀態。它的核心責任是把子項 click 聚合成 group event。這個觀念非常重要，因為它能幫你分清楚「事件回報」與「狀態管理」是兩件不同的事。

### 4.2 `Cell`：public item 的主要行為入口

`Cell` 是使用者真正操作的列表項元件。它負責接收 public props / slots，決定自己是不是 link，決定是否顯示 arrow，並在點擊時同時處理 group click 與 navigation。

`Cell` 同時混入：

```js
mixins: [ mixinsLink, globalConfig ]
```

這表示 `Cell` 的 public contract 不是只由 `cell.vue` 決定，而是由三個來源共同形成。

| 來源 | 提供內容 | 閱讀意義 |
| --- | --- | --- |
| `cell.vue` | `name`、`title`、`label`、`extra`、`disabled`、`selected`。 | 這是 `Cell` 自身直接管理的 item 屬性與狀態 class 來源。 |
| `mixins/link.js` | `to`、`replace`、`target`、`append` 與 link navigation 方法。 | 這是 `Cell` 能變成可導頁項目的原因。 |
| `types/cell.d.ts` | 對外文件化 props、slots 與 `CellGroup` listener。 | 這是使用者在 TypeScript 層看到的 public contract。 |

`Cell` 的 template 以 `to` 作為重要分界。

```text
有 to
  -> 渲染 <a class="ivu-cell-link">
  -> 顯示右側 arrow
  -> 交給 link mixin 處理導頁相關行為

沒有 to
  -> 渲染 <div class="ivu-cell-link">
  -> 不顯示 arrow
  -> 保持一般 cell item 結構
```

這裡的重點不是單純記住「有 `to` 就是 link」，而是要理解 `to` 會同時影響三件事：wrapper tag、arrow 顯示，以及 navigation 行為來源。也就是說，`to` 不是單一視覺 props，而是一個會改變 runtime branch 的 props。

不過，無論有沒有 `to`，兩個 branch 都會包同一個 `CellItem`。因此，`Cell` 的導頁能力與 `CellItem` 的展示結構是分離的。這種設計讓 `Cell` 可以在不重複 DOM 結構的情況下，同時支援一般列表項與 link 列表項。

### 4.3 `CellItem`：只負責內部展示結構

`CellItem` 是 `Cell` 的內部展示子元件。它只宣告三個 props：

```text
title / label / extra
```

它的 template 固定分成三個主要 DOM 區塊。

| DOM 區塊 | 內容 | 設計意義 |
| --- | --- | --- |
| `.ivu-cell-icon` | `#icon` slot。空內容時由 CSS 隱藏。 | 提供左側圖示擴充點，但不強迫每個 cell 都有 icon。 |
| `.ivu-cell-main` | `.ivu-cell-title` 與 `.ivu-cell-label`。 | 承載主要文字內容，title 是主資訊，label 是輔助描述。 |
| `.ivu-cell-footer` | `.ivu-cell-extra`，放右側額外內容。 | 承載右側補充資訊，例如 extra、狀態、徽章或操作元件。 |

`CellItem` 沒有事件、沒有 inject、沒有 link 行為。這代表它不應該被理解成完整的互動元件，而應該被理解成 `Cell` 的純展示結構。

從元件庫設計角度看，這樣拆分有兩個好處。

第一，`Cell` 可以專注在 public props、slots、click、link 與 class branch；`CellItem` 則專注在 DOM 排版。這會降低 `cell.vue` template 的複雜度。

第二，link branch 可以共用同一個 `CellItem`。不管外層是 `<a>` 還是 `<div>`，內部展示內容都維持一致，避免 duplicated template。

### 4.4 `mixins/link.js`：讓 `Cell` 擁有導頁能力

`mixins/link.js` 提供 `to`、`replace`、`target`、`append` props 與 navigation 方法。這代表 `Cell` 的 link 行為不是全部寫在 `cell.vue` 裡，而是透過 shared mixin 取得。

這種設計通常出現在元件庫中，因為多個元件可能都需要相似的導頁能力。例如按鈕、選單項目、列表項目都可能支援 `to`、`target` 或 router navigation。把這些邏輯抽到 mixin，可以避免每個元件重複實作。

對讀者來說，這裡的閱讀重點是：當你在 `cell.vue` 裡看到 `to` branch，不能只停留在 template。你還要打開 `mixins/link.js`，確認 `to` 的型別、`replace` 的作用、`target="_blank"` 的處理方式，以及是否支援 router、append、ctrl/meta click 等分支。

本章不逐行分析 `mixins/link.js`，後續可以獨立拆成「`Cell` link navigation 流程分析」筆記。

### 4.5 `mixins/globalConfig.js` 與 `$VIEWUI.cell`：全域 arrow 設定來源

`mixins/globalConfig.js` 會從 Vue app globalProperties 讀取 `$VIEWUI`，而 `src/index.js` 會建立 `$VIEWUI.cell` 的 arrow 預設設定。型別上，`types/index.d.ts` 也定義了 install options 裡的 `cell.arrow`、`cell.customArrow` 與 `cell.arrowSize`。

這代表 `Cell` 的 arrow 行為不只受單一元件 props 影響，也可能受到全域設定影響。這類設計在元件庫中很常見：某些視覺或行為預設值可以在 plugin install 時統一配置，再由每個元件透過 global config 讀取。

閱讀這一層時，不要只問「arrow 在哪裡渲染」，還要問三個問題。

第一，預設 arrow 設定在哪裡建立？是在 `src/index.js` 建立 `$VIEWUI.cell` 的 arrow 預設設定。

第二，元件如何讀取全域設定？是透過 `mixins/globalConfig.js` 從 Vue app globalProperties 讀取 `$VIEWUI`。

第三，型別層是否有對應 install options？`types/index.d.ts` 有 `cell.arrow`、`cell.customArrow`、`cell.arrowSize`。

如果後續要做更深入分析，應該把 runtime 預設值、global config mixin、type declaration 三者對照起來，確認文件化契約與實際行為是否一致。

### 4.6 `cell.less` 與 `mixins/select.less`：視覺結果不是只看一個檔案

`Cell` 的樣式主要由 `cell.less` 定義，但 hover、disabled、selected 等 item 共用規則還會透過 `.select-item()` mixin 補上。

`cell.less` 負責 `Cell` 專屬結構，例如根節點、link 外觀、icon、main、label、footer、arrow、selected 等。

| Selector | 責任 |
| --- | --- |
| `.ivu-cell` | 根節點定位與 overflow。 |
| `.ivu-cell-link` | 繼承文字顏色，避免 link 改變視覺。 |
| `.ivu-cell-icon` | icon 區塊與空 slot 隱藏。 |
| `.ivu-cell-main` | title / label 的主要內容容器。 |
| `.ivu-cell-footer` | 右側 extra 的 absolute positioning。 |
| `.ivu-cell-with-link .ivu-cell-footer` | 有 arrow 時把 footer 往左移。 |
| `.ivu-cell-arrow` | 右側箭頭的 absolute positioning。 |
| `.ivu-cell-selected` | selected 背景與 label / footer 色彩。 |

但 hover、disabled、selected 等 item 共用規則來自：

```less
.select-item(@cell-prefix-cls, @cell-prefix-cls);
```

因此，讀樣式時不能只看 `cell.less` 上半段，也要打開 `src/styles/mixins/select.less`。否則你會看到某些 class 在 runtime 出現，卻找不到完整的 hover、disabled、selected 規則來源。

這也是原始碼閱讀中常見的樣式陷阱：template class 不一定只對應單一 component less 檔，可能還會被共用 mixin、變數檔或全域 style entry 影響。

### 4.7 Type 與 Public Export：使用者能用什麼，由型別與入口共同決定

`types/cell.d.ts` 匯出兩個 component declaration：

```ts
export declare const Cell: DefineComponent<...>
export declare const CellGroup: DefineComponent<...>
```

其中 `Cell` 的 `.d.ts` 包含以下 public contract：

```text
name / title / label / extra / disabled / selected
to / replace / target / append
v-slots: default / icon / label / extra / arrow
```

`CellGroup` 的 `.d.ts` 則包含：

```text
onOnClick?: (event?: any) => any
```

runtime public export 在 `src/components/index.js`：

```js
export { default as Cell } from './cell';
export { default as CellGroup } from './cell-group';
```

typed public export 在 `types/viewuiplus.components.d.ts`：

```ts
export { Cell, CellGroup } from './cell'
```

全域安裝則由 `src/index.js` 透過整個 component map 完成：

```js
Object.keys(ViewUI).forEach(key => {
    app.component(key, ViewUI[key]);
});
```

這裡要建立一個重要觀念：public component 不是只看 `.vue` 檔是否存在，而是要看它是否被 runtime export、是否有 type export、是否被 install 註冊、是否有 example 或文件使用。依照原始筆記，`Cell` 與 `CellGroup` 都會被全域註冊，而 `CellItem` 不會。這就是判斷 `CellItem` 是 internal component 的重要依據。

### 4.8 Example：把官方範例當成行為驗證入口

`examples/routers/cell.vue` 的價值不只是展示畫面，而是把多種使用場景放在同一個範例中，讓讀者可以回頭對照 runtime 行為。

| 範例情境 | 驗證重點 |
| --- | --- |
| `<CellGroup @on-click="handleClick">` | group 收集子項 click 並傳回 `name`。 |
| `<Cell title="..." label="..." extra="...">` | props 直接填入 `CellItem` 對應區塊。 |
| `<Cell to="/button">` | 有 link，會顯示 arrow 並走 link mixin。 |
| `<Cell selected>` | 只改變 selected class 與樣式。 |
| `<Cell disabled>` | 只改變 disabled class； example 沒有阻止 click 邏輯。 |
| `<Cell target="_blank">` | 交給 link mixin 處理新視窗開啟。 |

example 裡被註解的 `Badge`、`Icon`、`i-switch` slot 用法，也有閱讀價值。它們剛好對應 `#extra` 與 `#icon` 的擴充位置，可以幫助你理解 `CellItem` 為什麼要拆出 icon、main、footer 這些 DOM 區塊。

---

## 5. 表格整理

### 5.1 三個 runtime component 的責任分工

| 元件 | 是否 public export | 核心責任 | 不負責什麼 |
| --- | --- | --- | --- |
| `CellGroup` | 是 | 包住 slot、provide 自己、把子項 click 轉成 `on-click`。 | 不負責管理 `selected` 狀態，也不負責改變子項 props。 |
| `Cell` | 是 | 接收 public props / slots、產生 link 或 div wrapper、呼叫 group click 與 navigation。 | 不直接承擔所有 DOM 展示細節，內部結構交給 `CellItem`。 |
| `CellItem` | 否 | 單純排版，負責 icon、title、label、extra 的展示結構。 | 不負責事件、不負責 inject、不負責 link navigation。 |

這張表是理解整組元件的核心。`CellGroup` 負責群組事件出口，`Cell` 負責使用者互動與 public contract，`CellItem` 負責內部展示。三者分工清楚後，再去看 mixin、style 與 type 才不會混亂。

### 5.2 `Cell` public contract 的來源

| 契約來源 | 提供內容 | 為什麼重要 |
| --- | --- | --- |
| `cell.vue` | `name`、`title`、`label`、`extra`、`disabled`、`selected`。 | 這些是 `Cell` 自身直接控制的基本 item props。 |
| `mixins/link.js` | `to`、`replace`、`target`、`append` 與 navigation 方法。 | 這些讓 `Cell` 可以從一般 item 變成 link item。 |
| `mixins/globalConfig.js` | 讀取 `$VIEWUI` 全域設定。 | 這讓 arrow 等預設設定可以由 plugin install 注入。 |
| `types/cell.d.ts` | props、slots、`CellGroup` listener。 | 這是使用者在 TypeScript 與 IDE 中看到的 public API。 |
| `examples/routers/cell.vue` | 官方使用場景。 | 用來確認 public API 實際怎麼被組合使用。 |

這張表提醒你：public contract 不等於單一檔案。元件庫常常把實作、共用行為、型別、範例分散在不同位置，閱讀時必須把它們合併理解。

### 5.3 props / slots / class 行為對照表

| 項目 | 來源 | 影響範圍 | 閱讀重點 |
| --- | --- | --- | --- |
| `name` | `cell.vue` / `types/cell.d.ts` | click 時回報給 `CellGroup`。 | 搭配 `CellGroup` 的 `on-click` 理解。 |
| `title` | `cell.vue` / `CellItem` | 顯示在 `.ivu-cell-title`。 | 屬於主要文字內容。 |
| `label` | `cell.vue` / `CellItem` | 顯示在 `.ivu-cell-label` 或 label slot。 | 屬於輔助描述內容。 |
| `extra` | `cell.vue` / `CellItem` | 顯示在 `.ivu-cell-extra`。 | 屬於右側補充資訊。 |
| `disabled` | `cell.vue` / style mixin | 影響 disabled class 與樣式。 | example 沒有阻止 click 邏輯；後續需用 click handler 逐行確認。 |
| `selected` | `cell.vue` / `cell.less` / `select.less` | 影響 selected class 與樣式。 | 不代表 `CellGroup` 自動管理選取狀態。 |
| `to` | `mixins/link.js` / `cell.vue` branch | 改變 wrapper、arrow 與 navigation。 | 有 `to` 時渲染 link branch，並顯示 arrow。 |
| `target` | `mixins/link.js` | 影響 link 開啟方式。 | `target="_blank"` 交給 link mixin 處理。 |
| `#icon` | `CellItem` | 顯示在 `.ivu-cell-icon`。 | 空內容時由 CSS 隱藏。 |
| `#extra` | `CellItem` | 顯示在 `.ivu-cell-footer` 裡的 extra 區域。 | 可放 `Badge`、switch 等右側內容。 |
| `#arrow` | `cell.vue` / type declaration | 自訂 arrow 顯示。 | 需搭配 global config 與 arrow branch 進一步閱讀。 |

這張表適合之後回查。當你看到某個 props 或 slot 時，可以先判斷它是影響資料、視覺、導頁、事件還是內部展示結構。

### 5.4 閱讀檔案時應該問的問題

| 檔案 | 不要只看什麼 | 應該追問什麼 |
| --- | --- | --- |
| `cell.vue` | 不要只看 props。 | 哪些 props 來自 mixin？`to` 如何改變 template branch？click 如何同時處理 group 與 navigation？ |
| `cell-group.vue` | 不要只看 template。 | `provide()` 提供了什麼？`handleClick(name)` 如何轉成 `on-click`？ |
| `cell-item.vue` | 不要以為它是 public component。 | 它如何拆分 icon、main、footer？為什麼不處理事件？ |
| `link.js` | 不要只看 `to` props 名稱。 | router、target、replace、append、ctrl/meta click 分支如何處理？ |
| `globalConfig.js` | 不要只看 mixin 名稱。 | `$VIEWUI.cell` 的值從哪裡來？哪些元件設定會讀全域 config？ |
| `cell.less` | 不要只看 component less。 | 哪些狀態樣式其實來自 `.select-item()`？ |
| `types/cell.d.ts` | 不要把型別當成全部 runtime 真相。 | 型別宣告和實際 runtime 行為是否完全一致？ |
| `examples/routers/cell.vue` | 不要只看畫面。 | example 是否暴露了重要使用邊界，例如 disabled、selected、to、target？ |

---

## 6. 範例或情境說明

以下是一個概念化使用情境，用來幫助你把 `CellGroup`、`Cell`、`CellItem`、link mixin 與 group event 串起來理解。

```vue
<template>
  <CellGroup @on-click="handleClick">
    <Cell
      name="profile"
      title="個人資料"
      label="查看與修改個人基本資料"
      extra="已完成"
    />

    <Cell
      name="button"
      title="Button 元件"
      label="前往 Button 範例頁"
      to="/button"
    />

    <Cell
      name="disabled-item"
      title="停用項目"
      disabled
    />
  </CellGroup>
</template>

<script>
export default {
  methods: {
    handleClick (name) {
      console.log('clicked cell name:', name);
    }
  }
}
</script>
```

這段範例可以用三個角度閱讀。

第一，從 `CellGroup` 角度看，它包住所有 `Cell`，並監聽 `@on-click`。當子項被點擊時，`CellGroup` 對外回報 `name`。

第二，從 `Cell` 角度看，第一個 `Cell` 是一般 item，主要展示 `title`、`label`、`extra`；第二個 `Cell` 有 `to="/button"`，因此會走 link branch，顯示 arrow，並透過 link mixin 處理導頁；第三個 `Cell` 帶有 `disabled`，視覺上會套用 disabled class，但實際是否阻止 click 需要回到 `cell.vue` click handler 逐行確認。

第三，從 `CellItem` 角度看，不管是哪一個 `Cell`，內部展示結構都會回到 icon、main、footer 這種固定結構。也就是說，link 與非 link 的差別在外層 wrapper 與行為，內部展示結構仍然可以共用。

---

## 7. 閱讀路線或學習路線

### 7.1 初次閱讀路線

第一次閱讀時，建議按照以下順序。

1. 先讀 `types/cell.d.ts`，建立 public props、slots 與 group event 的表面契約。這一步的目的是先知道使用者能用什麼，而不是立刻鑽進 runtime。
2. 再讀 `examples/routers/cell.vue`，確認官方實際展示哪些組合，例如 `on-click`、`selected`、`disabled`、`extra`、`to`、`target`。
3. 回到 `cell-group.vue`，理解 `provide / emit` 的父層角色，特別是 `CellGroupInstance` 與 `handleClick(name)`。
4. 讀 `cell.vue`，先看 `to` branch 與 `CellItem` slot 轉發，再看 click handler。
5. 讀 `mixins/link.js`，補上 router、target、ctrl/meta click 的 navigation 規則。
6. 讀 `globalConfig.js` 與 `src/index.js`，確認 arrow 全域設定來源。
7. 最後讀 `cell.less` 與 `mixins/select.less`，對照 class 如何轉成畫面。

這個順序能避免一開始就陷入 link mixin 或 CSS，也能避免只看 type declaration 而漏掉 disabled 不阻止 click 這類 runtime 邊界。

### 7.2 深入閱讀路線

當你已經知道整體分工後，可以進一步做四條深入線。

第一條是 click flow。從 `Cell` 點擊事件開始，追蹤它如何呼叫 group 的 `handleClick(name)`，再追到 `CellGroup` 如何 emit `on-click`。這條線可以獨立整理成「`Cell` 點擊流程與事件回報分析」。

第二條是 link flow。從 `to` branch 開始，追蹤 `<a>` wrapper、arrow 顯示、`mixins/link.js` 的 navigation 方法、`target="_blank"` 與 router 行為。這條線可以整理成「`Cell` link 導頁流程分析」。

第三條是 style flow。從 runtime class 開始，對照 `cell.less` 與 `.select-item()`，確認 selected、disabled、hover、footer、arrow 如何形成畫面。這條線可以整理成「`Cell` 樣式系統分析」。

第四條是 public contract flow。從 `types/cell.d.ts` 開始，對照 `cell.vue`、`mixins/link.js`、`types/index.d.ts`、`src/components/index.js`、`types/viewuiplus.components.d.ts` 與 `src/index.js`，確認 runtime export、type export 與全域 install 是否一致。

### 7.3 可以暫時跳過的部分

第一次閱讀時，可以暫時跳過以下內容。

第一，`cell.less` 的所有細節 selector。你只需要先知道 style 由 `cell.less` 與 `.select-item()` 共同形成，不需要一開始逐條背 CSS。

第二，`mixins/link.js` 的所有 navigation 分支。初次閱讀先知道 link props 與 navigation 方法來自這裡即可，細節可留到 link flow 筆記。

第三，`src/index.js` 的完整 plugin install 流程。本章只需要知道它會註冊所有 components，並建立 `$VIEWUI.cell` 的 arrow 預設設定。

第四，`types/viewuiplus.components.d.ts` 的完整內容。本章只需要知道它會匯出 `Cell` 與 `CellGroup` 型別即可。

---

## 8. 常見誤區

| 誤區 | 為什麼容易誤解 | 正確理解 |
| --- | --- | --- |
| 只看 `cell.vue` 就以為看完 `Cell`。 | `cell.vue` 是核心檔案，容易讓人誤以為所有行為都在裡面。 | `Cell` 的完整行為還包含 `link.js`、`globalConfig.js`、`cell.less`、`select.less`、`.d.ts` 與 example。 |
| 把 `CellItem` 當成 public component。 | 它是 `.vue` 檔，而且名稱看起來像元件。 | `CellItem` 沒有 public export，主要服務 `Cell` 的內部展示結構。 |
| 以為 `CellGroup` 會管理 selected 狀態。 | group component 常常讓人聯想到狀態管理。 | `CellGroup` 的主要責任是 provide 自己並 emit `on-click`，不是管理 selected。 |
| 以為 `disabled` 一定會阻止 click。 | 在許多元件中 disabled 會阻止互動。 |  example 中 disabled 只改變 class，沒有阻止 click 邏輯；實際行為仍需讀 `cell.vue` click handler 確認。 |
| 以為 `to` 只是 href。 | `to` 看起來像路徑設定。 | 在 `Cell` 中，`to` 會影響 wrapper branch、arrow 顯示與 link mixin navigation。 |
| 只看 `cell.less` 就分析 selected / disabled。 | component style 通常集中在 component less 檔，容易忽略 mixin。 | hover、disabled、selected 等共用 item 規則還來自 `.select-item()`。 |
| 把 `.d.ts` 當成 runtime 真相。 | TypeScript 型別看起來很完整。 | `.d.ts` 是 public contract 宣告，實際行為仍要回到 `.vue`、mixin 與 style 確認。 |
| 只看 example 學用法，不回頭看原始碼。 | example 最容易理解，也最接近使用場景。 | example 是驗證入口，不是完整解釋；要搭配 runtime、type、style 才能建立完整理解。 |

---

## 9. 本章總結

`Cell / CellGroup` 是一組很適合學習元件庫原始碼設計的小型案例。它本身不算巨大，但已經包含了元件庫常見的幾個重要設計：public component 與 internal component 的拆分、父子元件透過 `provide / inject` 通訊、共用 mixin 注入導頁能力、全域設定影響局部元件、樣式 mixin 補上共用狀態，以及 `.d.ts` 補齊使用者看到的型別契約。

從責任分工來看，`CellGroup` 是事件聚合者，負責包住 slot、provide 自己，並把子項 click 轉成 `on-click`。`Cell` 是 public item 的主要入口，負責 props、slots、link branch、click 與 arrow。`CellItem` 是 internal display component，只負責 icon、main、title、label、footer、extra 的 DOM 結構。

從閱讀方法來看，這組元件不能只用單檔閱讀思維。你要先從 `types/cell.d.ts` 與 example 建立使用者視角，再回到 `cell-group.vue`、`cell.vue`、`cell-item.vue` 看 runtime 分工，接著補讀 `link.js`、`globalConfig.js`、`cell.less`、`select.less`，最後確認 export 與 install 如何讓 `Cell`、`CellGroup` 成為 public component。

這份 Source Map 筆記的真正價值，是幫你建立「元件完整行為由多層檔案共同成立」的閱讀習慣。當你之後閱讀其他 View UI Plus 元件，例如 `Button`、`Menu`、`Select`、`Dropdown`，也可以套用同樣方法：先找 public contract，再找 runtime component，再找 shared mixin，再找 style，再找 type 與 example。

---

## 10. 自我檢查問題

1. `CellGroup` 的主要責任是什麼？它為什麼不應該被理解成 selected 狀態管理器？
2. `CellItem` 為什麼不應被視為 public component？你會用哪些證據判斷它是 internal component？
3. `Cell` 的 public contract 為什麼不能只看 `cell.vue`？至少列出三個需要一起看的來源。
4. `Cell` 的 `to` props 會同時影響哪些層面？請從 wrapper、arrow 與 navigation 三個角度說明。
5. `CellGroup` 透過什麼 key provide 自己？子層 `Cell` 為什麼可以把自己的 `name` 回報給 group？
6. `cell.less` 與 `mixins/select.less` 分別負責哪些樣式？為什麼不能只看其中一個？
7. `types/cell.d.ts` 對理解 `Cell / CellGroup` 有什麼幫助？它和 runtime 原始碼的關係是什麼？
8. `examples/routers/cell.vue` 的閱讀價值是什麼？它如何幫助你驗證 public API？
9. disabled example 沒有阻止 click 邏輯。若要確認這件事，你下一步應該讀哪個檔案、哪一類邏輯？
10. 如果你要把這份 Source Map 延伸成下一篇筆記，你會優先寫 click flow、link flow、style flow 還是 type flow？為什麼？

---

## 11. 後續延伸方向

這份筆記是 Source Map，主要負責建立閱讀地圖。後續可以拆成以下主題，逐步深入。

### 11.1 `Cell` 點擊流程分析

可以專門追蹤 `cell.vue` 的 click handler：點擊 `Cell` 時，是否先判斷 disabled、是否呼叫 `CellGroupInstance.handleClick(name)`、是否同時處理 link navigation、事件順序如何安排。這篇筆記可以補齊本章尚未逐行分析的 runtime 行為。

### 11.2 `Cell` link navigation 流程分析

可以專門閱讀 `mixins/link.js`，分析 `to`、`replace`、`target`、`append`、router、外部連結、新視窗、ctrl/meta click 等分支。這篇筆記可以幫助你理解 View UI Plus 如何抽象共用導頁邏輯。

### 11.3 `Cell` arrow 與全域設定分析

可以把 `globalConfig.js`、`src/index.js`、`types/index.d.ts`、`cell.vue` 的 arrow branch 與 `#arrow` slot 串起來，確認 `$VIEWUI.cell.arrow`、`customArrow`、`arrowSize` 如何影響實際畫面。

### 11.4 `Cell` 樣式系統分析

可以從 class mapping 開始，逐條對照 `cell.less` 與 `mixins/select.less`，分析 root、link、icon、main、label、footer、arrow、selected、disabled、hover 的樣式來源。

### 11.5 `Cell / CellGroup` 型別契約分析

可以深入 `types/cell.d.ts`、`types/index.d.ts`、`types/viewuiplus.components.d.ts`，對照 runtime props、slots、events，確認型別宣告與實際實作是否一致。

### 11.6 從 example 反推測試案例

可以把 `examples/routers/cell.vue` 中的每個使用場景轉成測試案例，例如：一般 `Cell` 是否渲染 title、link `Cell` 是否顯示 arrow、`CellGroup` 是否 emit `on-click`、`selected` 是否套用 class、`disabled` 是否仍會觸發 click。

### 11.7 元件重構練習

可以嘗試思考：如果要把 Options API 版本改成 Composition API，`provide / inject`、mixin、global config、type declaration 與 slot forwarding 應如何重構。這類練習很適合訓練前端元件庫設計能力。

---

## 附錄 A. 品質檢查

| 檢查項目 | 結果 |
| --- | --- |
| 是否保留核心資訊 | 已保留 `Cell`、`CellItem`、`CellGroup`、mixin、style、type、example、export、install 等核心來源。 |
| 是否補上必要背景 | 已補充 Source Map、public/internal component、runtime/type/style/example、provide/inject、mixin 等基本觀念。 |
| 是否避免只做重新排版 | 已將原始路徑與責任分工補成段落式教學內容。 |
| 是否避免編造未提供的技術細節 | 對 click handler、link navigation、CSS selector 細節皆標註需後續逐行確認。 |
| 是否適合放入個人知識庫 | 已使用 Markdown、清楚標題、表格、範例、閱讀路線、常見誤區、自我檢查與延伸方向。 |
| 是否保留後續拆分空間 | 已列出 click flow、link flow、arrow config、style、type、example-to-test、重構練習等延伸主題。 |
