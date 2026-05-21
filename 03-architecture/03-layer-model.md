# Layer Model（分層模型）：View UI Plus 架構責任與依賴邊界

## 1. 本章定位

本章是一篇「架構分析 + 原始碼閱讀導讀」筆記，主題是 View UI Plus 的 layer model，也就是用分層的方式理解這個 UI library 的責任分工。

這篇筆記要解決的核心問題是：

> 閱讀 View UI Plus 原始碼時，如何判斷一段程式碼屬於哪一層、負責什麼、依賴誰，以及哪些事情不應該由它處理？

這篇筆記不只是要回答「有哪些目錄」，而是要建立一個閱讀框架。當你看到 `src/index.js`、`src/components/index.js`、`src/components/*`、`src/utils/`、`src/styles/`、`types/`、`dist/`、`build/`、`package.json` 時，你應該能判斷它們分別支撐哪一種架構責任。

讀完本章後，讀者應該能理解：

1. View UI Plus 可以被拆成哪些 layer。
2. 每一層對上層提供什麼能力。
3. 每一層向下依賴哪些內部支撐。
4. `src/`、`types/`、`dist/`、`build/` 與 `package.json` 在架構中的位置。
5. 為什麼 `dist/` 不應被當成主要 source of truth。
6. 為什麼 `types/` 是 TypeScript contract，但不是 runtime 行為本身。
7. 如何依照 layer model 安排原始碼閱讀順序。

本章不會深入分析某一個 component 的完整實作，也不會逐行解讀 `src/index.js` 或 build script。那些內容比較適合拆成後續獨立筆記，例如「Plugin install flow」、「Component export map」、「樣式建置流程」、「TypeScript declarations 設計」等主題。

---

## 2. 學習前先建立的基本觀念

### 2.1 Layer 不是目錄，而是架構責任

閱讀大型前端 library 時，很容易先從目錄結構切入。例如看到 `src/components/` 就認為它是組件層，看到 `build/` 就認為它是建置層。這種判斷大致可行，但不夠精準。

目錄是程式碼的放置位置，layer 是架構上的責任分類。兩者有關係，但不完全相同。

例如 `src/index.js` 在檔案位置上屬於 `src/`，但從架構責任來看，它同時扮演兩種角色：

1. package runtime entry，也就是 library 在 runtime 被載入時的主要入口。
2. plugin install 的集中點，也就是 Vue app 呼叫 `app.use()` 時進入的安裝邏輯。

再例如 `package.json` 不是 runtime source code，但它同時描述 npm entry、type entry 和 build scripts。也就是說，它會影響使用者如何 import library、TypeScript 如何找到型別宣告，以及開發者如何執行建置流程。

所以本章使用 layer model 時，不是單純把目錄貼上標籤，而是問一個更重要的問題：

> 這段程式碼或設定，在整個 library 中負責什麼架構角色？

### 2.2 Public API 與 Implementation Detail

理解 View UI Plus 這類 library 時，一定要區分 `public API` 和 `implementation detail`。

`public API` 是使用者可以穩定依賴的介面。例如：

- `app.use(ViewUIPlus, options)`。
- `import { Button } from 'view-ui-plus'`。
- template 中使用全域註冊後的 component。
- `this.$Message`、`this.$Modal`、`this.$Notice` 等全域服務。
- CSS 載入路徑，例如 `dist/styles/viewuiplus.css`。
- TypeScript declarations，例如 `types/index.d.ts` 所描述的型別介面。

`implementation detail` 則是 library 內部為了實作功能而存在的細節。例如某個 component 使用了哪個 utility、哪個 mixin、哪個 internal helper，這些通常不應該被使用者直接依賴。

分清楚這兩者很重要，因為 public API 一旦被使用者依賴，就會變成相對穩定的 contract；但 implementation detail 應該保留重構彈性。如果內部工具被外部使用者大量依賴，未來維護者想調整內部架構時就會受到限制。

### 2.3 Runtime Source、Type Contract 與 Build Artifact

View UI Plus 的程式碼可以用三種角度理解。

第一種是 `runtime source`，也就是實際描述 library 在執行期間如何工作的原始碼。主要位置在 `src/`，例如 `src/index.js`、`src/components/index.js`、`src/components/*`、`src/utils/`、`src/mixins/`、`src/directives/`、`src/locale/`。

第二種是 `type contract`，也就是 TypeScript 和 IDE 看到的 public type interface。主要位置在 `types/`。它描述使用者可以如何使用這個 library，但它不是 runtime 行為本身。

第三種是 `build artifact`，也就是建置流程產生的發佈產物。主要位置在 `dist/`。例如 JavaScript bundle、CSS、font、locale files。`dist/` 是給使用者安裝套件後使用的輸出結果，但它通常不是開發者理解設計的主要入口。

這三者可以用一句話區分：

> 要理解 library 如何設計與執行，看 `src/`；要理解使用者看到的 TypeScript 介面，看 `types/`；要理解最後發佈出去的產物，看 `dist/`。

### 2.4 依賴方向與邊界意識

分層模型最重要的價值，是幫助你判斷依賴方向是否合理。

一般來說，上層比較接近使用者與 public API，下層比較接近內部支撐與建置產物。上層可以透過明確的入口使用下層能力，但下層不應隨意反向依賴上層。

例如 component 可以依賴 `src/utils/` 中的工具方法，因為工具方法是為了支撐多個 component；但 `src/utils/` 不應該反過來依賴某個特定 component，否則共用工具就會被上層業務綁死。

再例如 build scripts 可以把 `src/styles/index.less` 編譯成 CSS，但 build scripts 不應該決定 `Button`、`Modal`、`Form` 的 runtime 使用語意。建置層負責輸出格式與產物轉換，不負責定義 component 行為。

---

## 3. 整體概覽

View UI Plus 可以從「使用者如何接觸 library」一路往下拆成幾個 layer：

```txt
使用者層
  -> 入口安裝層
    -> 組件層
      -> 共用能力層
      -> 樣式層
  -> 型別/發佈層
    -> 建置層
```

如果換成更接近程式碼與 package 的依賴方向，可以寫成：

```txt
npm / Vue app users
  -> package entry and public API
    -> src/index.js
      -> src/components/index.js
        -> src/components/*
          -> src/utils/
          -> src/mixins/
          -> src/directives/
          -> src/locale/
          -> src/styles/

package metadata
  -> types/
  -> dist/
  -> build scripts
```

這個模型可以分成兩條主線。

第一條是 runtime 使用主線。使用者透過 npm package、Vue plugin、named imports 或 global APIs 使用 View UI Plus。這些使用方式會對應到 package entry、`src/index.js`、`src/components/index.js` 和實際 component source。

第二條是 package 發佈主線。`package.json` 描述套件入口、型別入口與 scripts；`types/` 提供 TypeScript contract；`build/` 和 `vite.config.js` 負責將 source、style、locale 轉成 `dist/` 裡的可發佈產物。

這個模型的核心觀念是：越往上越接近使用者可依賴的 public surface；越往下越接近 library 內部實作、共用支撐、樣式系統、型別宣告或建置產物。閱讀時不要只看「檔案放在哪裡」，而要判斷「這個檔案支撐哪一種架構責任」。

---

## 4. 核心內容逐步講解

### 4.1 使用者層：Library 被如何消費

使用者層描述的是 View UI Plus 在外部 Vue app 中被使用時呈現出來的樣子。這一層不是 View UI Plus repo 裡的某個固定目錄，而是 public API 被消費後形成的使用面。

對使用者來說，View UI Plus 可能有幾種典型使用方式。第一種是整包安裝，也就是透過 `app.use(ViewUIPlus, options)` 把整個 library 當作 Vue plugin 安裝到應用程式中。第二種是 named imports，例如 `import { Button } from 'view-ui-plus'`，只取用特定 component。第三種是在 template 中直接使用全域註冊後的 components。第四種是透過 `this.$Message`、`this.$Modal`、`this.$Notice` 等 imperative APIs 呼叫全域服務。第五種是載入樣式產物，例如 `dist/styles/viewuiplus.css`。第六種是讓 TypeScript 和 IDE 透過 `types/index.d.ts` 取得 declarations。

這一層關心的是使用者體驗與 public contract。也就是說，使用者是否能穩定 import、安裝、使用 component、呼叫全域服務、載入 CSS，以及取得正確型別提示。

使用者層不應該知道每個 component 內部如何計算狀態，也不應該直接依賴 `src/utils/` 或 `src/mixins/` 這類內部支撐細節。對使用者而言，library 應該提供清楚的 public surface，而不是要求使用者理解內部實作才能使用。

閱讀這一層時，可以先從「使用者能做什麼」開始建立輪廓，而不是急著看內部原始碼。這會幫助你判斷哪些東西是 public API，哪些只是內部實作。

### 4.2 入口安裝層：Plugin 與 Public Runtime Surface

入口安裝層的核心是 `src/index.js`。這個檔案可以理解成 View UI Plus 的 runtime entry，也就是 library 在執行期間被載入時的主要入口。

這一層的責任不是實作每一個 component，而是把內部能力組裝成使用者可以看見、可以使用的 public runtime surface。換句話說，它像是 library 的門面，負責把 component、directive、locale、global config 和 imperative APIs 整合起來。

`src/index.js` 主要負責幾件事：

1. 透過 `export * from './components'` 將 component named exports 暴露出去。
2. 匯入 `src/components/index.js`，組合成 `ViewUI` component map。
3. 加上 `iButton`、`iForm`、`iInput` 等相容 alias。
4. 定義 `install(app, opts)`，讓使用者可以透過 `app.use()` 安裝。
5. 在 install flow 中註冊 components 和 directives。
6. 設定 `$VIEWUI` global config。
7. 掛載 `$Spin`、`$Loading`、`$Message`、`$Notice`、`$Modal` 等 imperative APIs 到 `app.config.globalProperties`。
8. 接入 locale 和 i18n 設定。

這一層向上服務使用者層，向下整合組件層與共用能力層。它應該處理「如何把 library 安裝到 Vue app」這件事，但不應深入處理某一個 component 的 props、events、render/template 或 internal state。

閱讀 `src/index.js` 時，不要把它當成普通工具檔看待，而要把它看成 library 的 public runtime 組裝點。你應該觀察哪些能力被 export、哪些東西被註冊到 app、哪些 globalProperties 被掛載、locale 設定如何接入，以及 install options 如何影響整體 library 行為。

此處需要後續補充：如果要精確分析 `install(app, opts)` 的流程，應另開一篇筆記對照實際 source code，逐步整理 component registration、directive registration、global config 和 locale setup 的執行順序。

### 4.3 組件層：UI 能力的主要實作

組件層是 View UI Plus 實際提供 UI 能力的主要區域。它主要由 `src/components/index.js` 和 `src/components/*` 組成。

`src/components/index.js` 可以理解成 component export map。它集中整理 library 對外提供哪些 components，並讓入口安裝層可以統一取得 component map。`src/components/*` 則是各個 component 的實際實作位置，例如 `Button`、`Form`、`Table`、`Modal` 等。

組件層負責描述 UI component 的 runtime behavior，也就是 component 在執行期間如何工作。這通常包含：

- component 的 props。
- component 對外發出的 events。
- component 支援的 slots。
- component 的 render/template 結構。
- component 的 internal state。
- component 與其他 component 或 service-style API 的關係。

部分 service-style API，例如 Message、Notice、Modal、Spin、Loading，也可能從組件層或相關 service source 延伸出來。它們雖然不一定都以一般 template component 的形式被使用，但仍屬於 UI runtime 能力的一部分。

組件層通常會向下依賴共用能力層與樣式層。例如 component 可能使用 `src/utils/` 進行 DOM、日期或資料處理；使用 `src/mixins/` 共用 locale、form、emitter、globalConfig、link 等行為；使用 `src/locale/` 取得文字與語系能力；並依賴 `src/styles/` 中的 class/style 規則完成視覺呈現。

這一層不應處理 package build 或發佈格式。component 的職責是回答「UI 行為如何運作」，不是回答「bundle 要輸出成 UMD 還是 ES module」。如果在閱讀 component 時看到建置產物或發佈格式相關邏輯，通常要特別檢查是否發生責任混淆。

閱讀組件層時，建議不要一開始就全面掃過所有 components，而是先從 `src/components/index.js` 建立對外 export map，再挑一個代表性 component 深入分析。這樣可以先知道 library 提供哪些 UI 能力，再逐步理解單一 component 如何依賴下層能力。

### 4.4 共用能力層：跨 Component 的支撐能力

共用能力層的目的，是支撐多個 components 和入口安裝層，避免每個 component 重複處理相同問題。它不是使用者主要接觸的 public surface，而是內部 runtime 的支撐基礎。

這一層主要包含：

- `src/utils/`：DOM、date、CSV、textarea height、assist 等通用工具。
- `src/mixins/`：locale、form、emitter、globalConfig、link 等跨 component 行為。
- `src/directives/`：`resize`、`line-clamp`、style-related directives 等 Vue directives。
- `src/locale/`：locale data、i18n setup、文字格式化能力。

共用能力層的核心角色是「讓多個上層模組能共用相同邏輯」。例如多個 components 需要 locale 能力，就不應各自複製語系處理邏輯；多個 components 需要 form 行為或事件傳遞能力，就可以透過 mixins 或 shared helper 統一處理。

這一層最需要注意的是邊界問題。共用工具應該保持通用性，不應反向依賴某個特定 component。否則原本應該被多個 component 共用的工具，會變成某個 component 的附屬品，進而降低重用性與可維護性。

另一個需要注意的點是：shared utility 不一定等於 public API。即使某個工具方法很好用，如果 library 沒有明確把它作為 public API 暴露給使用者，使用者就不應直接依賴它。因為一旦外部開始依賴內部工具，內部重構就會受到限制。

閱讀共用能力層時，可以問三個問題：

1. 這個工具或 mixin 被哪些 components 使用？
2. 它是否真的具有跨 component 的通用性？
3. 它是 public contract，還是只是 implementation detail？

### 4.5 樣式層：UI 呈現與視覺系統

樣式層主要位於 `src/styles/`，負責 Less source、component styles、animation、common styles、mixins、iconfont 等與 UI 呈現相關的能力。

在 UI library 中，component runtime 和 style system 通常是平行支撐關係。component 負責 DOM 結構、狀態與互動；styles 負責 class 對應的視覺規則。兩者互相配合，才能形成完整的使用者介面。

例如一個 component 可能會根據 props 或 internal state 切換 class，樣式層則定義這些 class 對應的顏色、邊框、間距、動畫或禁用狀態外觀。不過，樣式層只應定義視覺表現，不應決定 runtime 語意。

以 disabled 狀態為例，樣式可以定義 disabled 外觀，例如顏色變淡、游標樣式改變、透明度降低。但「這個 component 是否 disabled」、「disabled 後事件是否阻止觸發」、「disabled 狀態如何從 props 或 form context 推導」仍應由 component runtime 負責。

build process 會把 Less source 轉成 `dist/styles/viewuiplus.css`。這代表 `src/styles/` 是樣式 source，而 `dist/styles/` 是編譯後產物。閱讀時應該清楚區分：要理解樣式如何被維護，看 `src/styles/`；要理解使用者最後載入到頁面的 CSS output，看 `dist/styles/`。

閱讀樣式層時，可以把它看成「component runtime 的視覺對應表」。要理解互動行為，回到 `src/components/`；要理解視覺規則，看 `src/styles/`；要理解樣式如何輸出，看 `build/build-style.js`。

### 4.6 型別/發佈層：Public Contract 與 Package Artifacts

型別/發佈層把 library 的能力轉換成使用者可以依賴的 package 介面。這一層主要由 `types/`、`dist/` 和 `package.json` entry fields 組成。

`types/` 的責任是提供 public type contract。`types/index.d.ts` 是 `package.json` 的 `typings` 指向，負責描述 plugin install options、global properties 和 named exports。`types/viewuiplus.components.d.ts` 則描述 component declarations。

這裡要特別注意：型別宣告描述的是 TypeScript 使用者看到的介面，但它不等於 runtime 行為本身。也就是說，`types/` 可以幫你知道有哪些 exports、options 或 global properties，但如果你要確認實際執行邏輯，仍應回到 `src/`。

`dist/` 的責任是 distribution artifacts，也就是發佈產物。`dist/viewuiplus.min.js` 是 UMD bundle，`dist/viewuiplus.min.esm.js` 是 ES module bundle，`dist/styles/` 提供編譯後 CSS 和 fonts，`dist/locale/` 提供建置後的 locale files。

`dist/` 對使用者很重要，因為使用者安裝套件後實際使用的可能就是這些產物。但對原始碼閱讀來說，`dist/` 不應被當成主要設計來源。原因是 `dist/` 是經過建置、打包、轉譯或壓縮後的結果，通常不如 source code 容易閱讀，也不適合作為理解架構設計的起點。

閱讀這一層時，應該把 `types/` 和 `dist/` 看成 public package surface 的兩個面向：`types/` 面向 TypeScript 與 IDE，`dist/` 面向 runtime bundle、CSS 和 locale artifacts。它們都服務使用者，但都不是理解設計的唯一依據。

此處需要後續補充：如果要精確分析 package public surface，應另開一篇筆記對照 `package.json` 中的 `main`、`module`、`exports`、`typings`、`style` 或相關欄位，確認不同工具鏈如何解析 View UI Plus。

### 4.7 建置層：把 Source 轉成 Package Output

建置層負責把 source、style、locale 轉成可發佈產物。它主要由 `package.json` scripts、root `vite.config.js` 和 `build/` scripts 組成。

View UI Plus 的 build path 可以分成三條：

1. `build:prod` 執行 `vite build`，以 `src/index.js` 為 library entry，輸出 JavaScript bundles。
2. `build:style` 執行 `gulp --gulpfile build/build-style.js`，把 `src/styles/index.less` 編譯成 CSS，並複製 iconfont fonts。
3. `build:lang` 執行 `vite build --config build/vite.lang.config.js`，把 `src/locale/lang/` 的語系檔輸出成 `dist/locale/`。

這一層的核心問題不是「component 如何運作」，而是「source 如何變成 package output」。因此它關心的是 entry、bundle format、輸出位置、樣式編譯、字型複製、語系檔建置、壓縮策略與 build target。

建置層可以改變輸出格式，但不應改變 runtime API 的語意。舉例來說，建置設定可以決定是否輸出 UMD 或 ESM bundle，也可以決定 CSS 輸出到哪個目錄；但它不應改變使用者如何使用 `Button`、`Modal`、`Form`，也不應決定 `$Message` 的 runtime 行為。

閱讀建置層時，建議把它放在比較後面。原因是如果你還不理解 `src/index.js`、component export map、style source 和 locale source，就直接看 build scripts，容易只看到工具命令，卻不知道這些命令在轉換什麼東西。

---

## 5. 表格整理

### 5.1 七層責任總表

| Layer | 主要位置 | 核心責任 | 對上層提供什麼 | 向下依賴什麼 | 不應該承擔什麼 | 初次閱讀重點 |
| --- | --- | --- | --- | --- | --- | --- |
| 使用者層 | 使用者的 Vue app、npm import、CSS import | 描述 library 如何被外部使用 | 使用方式、整體體驗、public API | package entry、runtime entry、types、dist styles | 不定義內部 component 實作 | 先確認 `app.use()`、named imports、global APIs、CSS import |
| 入口安裝層 | `src/index.js` | 組裝 public runtime surface | plugin install、global registration、globalProperties、locale setup | `src/components/index.js`、directives、locale、service APIs | 不實作單一 component 細節 | 看 install flow、exports、globalProperties、locale 接入 |
| 組件層 | `src/components/index.js`、`src/components/*` | 實作 UI runtime behavior | named exports、global component source、component behavior | `src/utils/`、`src/mixins/`、`src/locale/`、`src/styles/` | 不處理 package build 或發佈格式 | 先看 component export map，再挑代表性 component 深入 |
| 共用能力層 | `src/utils/`、`src/mixins/`、`src/directives/`、`src/locale/` | 支撐多個 components 的共用邏輯 | 工具方法、跨 component 行為、directive、i18n 能力 | 更底層的 JS/Vue/browser 能力 | 不應直接變成使用者主要入口 | 看哪些 components 使用它，以及是否保持通用性 |
| 樣式層 | `src/styles/` | 定義 UI 視覺系統 | Less source、component CSS、iconfont、基礎樣式 | Less build、style mixins、class naming | 不承擔 component state 或 business logic | 對照 component class 與 style source |
| 型別/發佈層 | `types/`、`dist/`、`package.json` entry | 提供 package public contract 與 artifacts | TypeScript declarations、runtime bundles、CSS/locale artifacts | `src/` source、build output、package metadata | 不作為主要設計來源或維護入口 | 用 `types/` 看 contract，用 `dist/` 看 output，不用它們取代 source |
| 建置層 | `package.json` scripts、`vite.config.js`、`build/` | 將 source/style/locale 轉成 output | 可發佈 bundle、CSS、fonts、locale files | `src/index.js`、`src/styles/index.less`、`src/locale/lang/` | 不定義 runtime API 語意 | 看 build scripts 如何把 source 轉成 `dist/` |

這張表的閱讀方式，不是要背每一層對應哪個目錄，而是要建立「責任判斷」。當你看到一段程式碼時，應該先判斷它是在服務使用者 public API、組裝 runtime surface、實作 component、提供 shared support、定義樣式、描述型別與發佈產物，還是在執行建置轉換。

### 5.2 Runtime 使用主線表

| 步驟 | 發生位置 | 主要動作 | 輸入 | 輸出 | 注意事項 |
| --- | --- | --- | --- | --- | --- |
| 1 | 使用者 Vue app | 使用者呼叫 `app.use(ViewUIPlus, options)` 或使用 named imports | Vue app、View UI Plus package | 觸發 library public API | 這是使用者層，不應依賴內部細節 |
| 2 | package entry | 工具鏈解析 package 入口 | `import` 語句、`package.json` entry | 導向 runtime entry 或 bundle | 實際解析規則需對照 `package.json`，此處需要後續補充 |
| 3 | `src/index.js` | 組裝 public runtime surface | components、directives、locale、service APIs | plugin install、exports、globalProperties | 這是入口安裝層的核心 |
| 4 | `src/components/index.js` | 提供 component export map | 各 component source | named exports、component map | 是入口層與 component source 的橋接點 |
| 5 | `src/components/*` | 執行 component runtime behavior | props、events、slots、state、shared utilities | 實際 UI 行為 | 不處理 bundle 輸出格式 |
| 6 | `src/utils/`、`src/mixins/`、`src/locale/`、`src/styles/` | 提供共用邏輯、語系與樣式支撐 | component 需求 | 可重用支撐能力 | 應保持內部支撐定位 |

這條主線適合用來理解「使用者呼叫 library 後，內部大概如何被串起來」。它先從 public API 進入，再逐步往 runtime implementation 展開。

### 5.3 Build 輸出主線表

| Build path | 指令 / 設定 | 主要輸入 | 主要輸出 | 角色 | 注意事項 |
| --- | --- | --- | --- | --- | --- |
| JavaScript bundle | `build:prod`、`vite build` | `src/index.js` | JavaScript bundles，例如 UMD / ESM 產物 | 將 runtime entry 打包成可發佈 JS | 輸出格式不等於 component 語意 |
| Style output | `build:style`、`gulp --gulpfile build/build-style.js` | `src/styles/index.less`、iconfont fonts | `dist/styles/viewuiplus.css`、fonts | 將 Less source 編譯成 CSS 並處理字型 | 樣式 source 與 output 要分開看 |
| Locale output | `build:lang`、`vite build --config build/vite.lang.config.js` | `src/locale/lang/` | `dist/locale/` | 將語系檔建置成發佈產物 | locale runtime 使用方式需回到 `src/locale/` 對照 |

這張表用來理解建置層的責任：它把 source 轉成 artifacts，但不負責定義 public API 的語意。當你研究 build scripts 時，應該關注輸入、輸出與轉換規則，而不是把它當成 component 行為的設計來源。

---

## 6. 範例或情境說明

### 6.1 情境一：使用者安裝整個 View UI Plus

假設使用者在 Vue app 中使用類似下面的方式安裝 library：

```js
app.use(ViewUIPlus, options)
```

從 layer model 來看，這個動作會先發生在使用者層。使用者只知道自己要把 View UI Plus 作為 Vue plugin 安裝進 app，不需要知道每個 component 如何實作。

接著，這個動作會進入入口安裝層，也就是 `src/index.js` 中定義的 `install(app, opts)`。入口安裝層會負責把 components、directives、locale、global config 和 service-style APIs 組裝起來。

在 install flow 中，`src/index.js` 會依賴 `src/components/index.js` 提供的 component map，進而取得各個 component source。必要時也會註冊 directives、設定 `$VIEWUI` global config，並把 `$Spin`、`$Loading`、`$Message`、`$Notice`、`$Modal` 等能力掛載到 `app.config.globalProperties`。

此時，組件層負責提供實際 UI 行為；共用能力層提供 utils、mixins、directives、locale 等支撐；樣式層則提供 class 對應的視覺規則。不過 CSS 是否需要使用者另外 import，仍要看 library 的實際使用規範與 package 設計，此處需要後續對照官方文件或 package entry 確認。

### 6.2 情境二：使用者只 import 單一 component

假設使用者使用 named import：

```js
import { Button } from 'view-ui-plus'
```

這個情境的重點是 named exports。從架構上看，使用者層透過 package public API 取得 `Button`，而 `src/index.js` 會透過 `export * from './components'` 暴露 component named exports。

真正列出 components 的位置是 `src/components/index.js`。它像是一張 component export map，集中說明 library 對外提供哪些 component。至於 `Button` 本身的 props、events、slots、internal state 和 render/template 邏輯，則要回到 `src/components/*` 中對應的 component source 閱讀。

這個情境可以幫助你理解：named import 是 public API；component export map 是 public API 與內部 component source 之間的橋；單一 component source 才是 UI 行為的主要實作位置。

### 6.3 情境三：追蹤樣式如何變成 CSS output

假設你想理解 `dist/styles/viewuiplus.css` 是怎麼來的，就不應只看 `dist/styles/`。因為 `dist/styles/` 是輸出結果，不是主要維護來源。

比較合理的閱讀路線是先看 `src/styles/`，理解 Less source、component styles、animation、common styles、mixins、iconfont 等如何組成樣式系統。接著再看 `build/build-style.js`，理解 `build:style` 如何透過 gulp 把 `src/styles/index.less` 編譯成 CSS，並複製 iconfont fonts。最後才回到 `dist/styles/` 看實際輸出結果。

這個情境說明了 source、build process 和 artifact 的差異：

- `src/styles/` 是樣式來源。
- `build/build-style.js` 是樣式建置流程。
- `dist/styles/` 是樣式發佈產物。

如果把三者混在一起，就容易誤以為 `dist/` 是設計來源，或誤以為 build script 會決定 component runtime 行為。

---

## 7. 閱讀路線或學習路線

### 7.1 初次閱讀路線

第一次閱讀 View UI Plus 的 layer model 時，建議從 public API 往內部 implementation 展開。

第一步，先從使用者層開始。你要先確認 View UI Plus 提供哪些主要使用方式，例如 `app.use()`、named imports、global APIs、CSS import 和 TypeScript declarations。這一步的目的是建立 library 對外提供什麼能力。

第二步，看 `src/index.js`。這裡是入口安裝層的核心，重點是理解它如何把 components、directives、locale、global config 和 globalProperties 組起來。這一步可以幫你看懂 library 的 public runtime surface。

第三步，看 `src/components/index.js`。這裡是 component export map，重點是理解 library 對外提供哪些 components，以及入口安裝層如何取得 component map。

第四步，挑一個代表性 component 進入 `src/components/*`。不要一開始就讀所有 components，而是先挑一個熟悉或常用的 component，觀察它如何使用 props、events、slots、state、utils、mixins、locale 和 styles。

第五步，看 `src/styles/`。這一步的目的是把 component runtime 中看到的 class、狀態與 UI 結構，對應到實際視覺規則。

第六步，看 `types/index.d.ts`。這一步用來確認 TypeScript 使用者看到的 public contract，並對照 runtime source 是否一致。

第七步，看 `package.json` scripts、`vite.config.js` 和 `build/`。這一步用來理解 source、style、locale 如何被轉成 `dist/` 中的 package output。

### 7.2 深入閱讀路線

當你已經理解基本分層後，可以進一步拆成幾條深入路線。

第一條是 plugin install flow。重點是逐步追蹤 `app.use(ViewUIPlus, options)` 進入 `install(app, opts)` 後，components、directives、globalProperties、locale setup 和 global config 的執行順序。

第二條是 component runtime flow。重點是挑選一個 component，追蹤它的 props、events、slots、internal state、computed、watch、render/template，以及它如何依賴 `utils`、`mixins`、`locale` 和 `styles`。

第三條是 style build flow。重點是從 `src/styles/index.less` 出發，追蹤 Less source 如何被 `build/build-style.js` 編譯成 `dist/styles/viewuiplus.css`。

第四條是 type contract flow。重點是從 `types/index.d.ts` 和 `types/viewuiplus.components.d.ts` 出發，理解 TypeScript 使用者看到的 exports、global properties、component declarations 與 runtime source 的關係。

第五條是 package publishing flow。重點是看 `package.json` entry fields、scripts、`vite.config.js` 和 `dist/`，理解 package 如何提供不同形式的輸出產物。

### 7.3 可以暫時跳過的部分

如果目標是先建立原始碼閱讀能力，可以暫時跳過過度細節的 build optimization、壓縮策略、完整 UMD / ESM 打包細節，以及所有 components 的逐一實作。

更有效的方式是先掌握分層模型，再挑一兩個代表性 component 深入分析。等你能熟練判斷一段程式碼屬於哪一層、為誰服務、依賴誰、是否跨界之後，再回頭看更細的建置與發佈流程會更容易。

---

## 8. 常見誤區

| 誤區 | 為什麼容易誤解 | 正確理解 |
| --- | --- | --- |
| 把 layer 直接等同於目錄 | 大部分 layer 確實有主要目錄，因此容易用目錄代替架構責任 | 目錄是程式碼位置，layer 是責任分類；同一個檔案可能支撐多個 layer |
| 認為 `src/index.js` 只是普通入口檔 | 名稱看起來只是 index，但它承擔 plugin install 和 public runtime surface 組裝 | `src/index.js` 應視為入口安裝層核心，重點看 exports、install、globalProperties、locale setup |
| 直接從 `dist/` 讀設計 | `dist/` 是使用者實際拿到的產物，因此容易被誤認為最準確 | `dist/` 是 build result；要理解設計應回到 `src/`，要理解輸出才看 `dist/` |
| 認為 `types/` 決定 runtime 行為 | TypeScript declarations 很像正式介面，容易以為它就是執行邏輯 | `types/` 描述 type contract；runtime truth 仍要回到 `src/` |
| 把 shared utility 當成 public API | 工具方法好用，容易想直接拿來依賴 | 除非 library 明確暴露並承諾支援，否則 shared utility 通常是 implementation detail |
| 讓共用能力層依賴特定 component | 實作時為了方便，可能把 component-specific 邏輯塞進 utility | 共用能力層應保持通用性，不應反向依賴某個特定上層 component |
| 認為樣式層可以處理狀態語意 | 樣式能呈現 disabled、active、error 等狀態，容易誤以為它也負責狀態判斷 | 樣式層負責視覺表現，狀態判斷與事件語意應由 component runtime 負責 |
| 一開始就看 build scripts | build scripts 看起來能快速理解輸出結果 | 若不先理解 source、style、locale，build scripts 只會變成工具命令清單 |

---

## 9. 本章總結

View UI Plus 的 layer model 不是單純的目錄說明，而是一套用來理解架構責任與依賴邊界的閱讀框架。

從使用者角度看，library 提供的是 `app.use()`、named imports、global APIs、CSS import 和 TypeScript declarations。這些構成使用者層的 public surface。往內部看，`src/index.js` 負責把 components、directives、locale、global config 和 imperative APIs 組裝成 Vue plugin 可使用的 runtime surface。再往下，`src/components/index.js` 和 `src/components/*` 提供 UI component 的主要 runtime behavior。

組件層之下，`src/utils/`、`src/mixins/`、`src/directives/` 和 `src/locale/` 提供跨 component 的共用支撐；`src/styles/` 提供 UI 視覺系統。這些下層能力應該支撐 component，而不是反過來被特定 component 綁死。

另一方面，`types/`、`dist/` 和 `package.json` entry fields 構成 package public contract 與發佈產物相關的層次。`types/` 描述 TypeScript 使用者看到的 contract，`dist/` 是 build result，`package.json` 則連接 npm entry、type entry 和 build scripts。這些內容都很重要，但不能取代 `src/` 作為理解 runtime 設計的主要來源。

最後，建置層負責把 source、style、locale 轉成可發佈 output。它可以決定 bundle format、CSS output、locale output 和建置流程，但不應決定 component 的 runtime API 語意。

因此，閱讀這類 UI library 時最重要的不是背目錄，而是持續問：這段程式碼是 public API 還是 implementation detail？它是在描述 runtime 行為、type contract、style source、build process，還是 build artifact？只要能回答這些問題，就能更穩定地建立大型前端 library 的架構心智模型。

---

## 10. 自我檢查問題

1. 為什麼說 layer 不等於目錄？請用 `src/index.js` 或 `package.json` 舉例說明。
2. 使用者層包含哪些常見使用方式？哪些屬於 public API？
3. `src/index.js` 在 View UI Plus 中主要扮演什麼角色？為什麼不應把它當成單純入口檔？
4. `src/components/index.js` 和 `src/components/*` 的責任有什麼差異？
5. 組件層為什麼可以依賴 `src/utils/`、`src/mixins/`、`src/locale/` 和 `src/styles/`？
6. 為什麼共用能力層不應該反向依賴某個特定 component？
7. 樣式層可以處理 disabled 外觀，但為什麼不應負責 disabled 狀態的 runtime 語意？
8. `types/` 和 `src/` 的關係是什麼？為什麼 `types/` 不等於 runtime truth？
9. 為什麼 `dist/` 不應作為理解架構設計的主要入口？
10. `build:prod`、`build:style`、`build:lang` 分別大致負責什麼輸出？它們為什麼不應改變 component 使用語意？

---

## 11. 後續延伸方向

這篇筆記建立的是 View UI Plus 的分層心智模型。後續可以拆成以下主題繼續深入。

1. **`src/index.js` 與 Plugin Install Flow 分析**  
   深入追蹤 `install(app, opts)` 如何註冊 components、directives、globalProperties、locale 和 global config。

2. **`src/components/index.js` 與 Component Export Map 分析**  
   整理 View UI Plus 如何集中管理 named exports，以及 plugin install 如何取得 component map。

3. **單一 Component 原始碼閱讀筆記**  
   挑選 `Button`、`Form`、`Table` 或 `Modal` 等代表性 component，分析 props、events、slots、state、utils、mixins、locale 和 styles 的關係。

4. **Shared Utilities / Mixins 架構分析**  
   分析 `src/utils/` 和 `src/mixins/` 中哪些能力被多個 components 共用，以及哪些屬於真正的 shared support。

5. **Locale 與 i18n 設計分析**  
   從 `src/locale/` 出發，分析語系資料、文字格式化、install options 和 component 文字顯示之間的關係。

6. **Style System 與 Less Build Flow 分析**  
   從 `src/styles/`、`src/styles/index.less` 和 `build/build-style.js` 出發，整理樣式 source 如何變成 `dist/styles/viewuiplus.css`。

7. **TypeScript Declarations 與 Public Type Contract 分析**  
   分析 `types/index.d.ts` 和 `types/viewuiplus.components.d.ts` 如何描述 plugin install options、global properties、named exports 和 component declarations。

8. **Package Entry 與 Distribution Artifacts 分析**  
   對照 `package.json`、`vite.config.js`、`build/` 和 `dist/`，整理 View UI Plus 如何提供 UMD、ESM、CSS、fonts 和 locale artifacts。

9. **大型 UI Library 分層閱讀方法總結**  
   將本篇的 layer model 抽象成一套通用方法，用於閱讀其他 UI library，例如 Element Plus、Ant Design Vue 或其他 Vue component library。
