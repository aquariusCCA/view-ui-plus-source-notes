# View UI Plus Repository Structure：倉庫結構與 package 生命週期導讀

## 1. 本章定位

這篇筆記是一份 **repository architecture overview**，也就是「倉庫架構總覽」。它的目標不是讓你立刻理解每一個 component 怎麼寫，而是先理解 View UI Plus 作為一個 Vue 3 UI library，整個 repo 如何支撐一個 npm package 從開發、型別宣告、建置，到最後被使用者安裝與使用。

---

### 1.1 這篇筆記要解決什麼問題

讀完這篇後，你應該能回答以下問題：

1. 為什麼 View UI Plus repo 不是只有 `src/`？
2. `src/`、`types/`、`build/`、`dist/`、`examples/` 分別負責什麼？
3. `source code`、`type contract`、`build artifact` 有什麼不同？
4. 讀 View UI Plus 原始碼時，應該先看哪些目錄，哪些目錄可以暫時跳過？
5. 為什麼 `examples/` 可以幫助理解使用方式，但不能直接當成 public API contract？

---

### 1.2 這篇筆記不解決什麼問題

這篇只處理 repository 的責任邊界，不深入以下細節：

- 不逐一分析每個 component 的 `props`、`events`、`slots`。
- 不深入 `src/index.js` 的完整 plugin install 細節。
- 不完整追蹤 `vite.config.js` 或 `build/` 中每個 build script 的實作。
- 不分析 `types/` 中每個 TypeScript declaration 的型別設計。
- 不分析 `dist/` 產物的 bundle 內容。
- 不把 `examples/` 中每個 demo route 都拆開閱讀。

這些內容應該分流到後續筆記，例如 component map、plugin install flow、type system、style build、release build 等主題。

---

## 2. 學習前先建立的基本觀念

在閱讀 View UI Plus 的 repository structure 前，先建立幾個基本觀念。否則容易把不同層級的檔案混在一起，造成閱讀方向錯亂。

---

### 2.1 Component library 不只是 component 原始碼

View UI Plus 是一個 Vue 3 `component library`，也就是提供給其他 Vue app 安裝與使用的元件函式庫。

對使用者來說，它可能只是這樣被使用：

```js
import ViewUIPlus from 'view-ui-plus'
import 'view-ui-plus/dist/styles/viewuiplus.css'

app.use(ViewUIPlus)
```

但對 library 作者來說，repo 需要維護的不只是 component 本身，還包含：

| 需要維護的部分 | 解決的問題 |
| --- | --- |
| Runtime source | 元件、指令、locale、工具函式實際怎麼運作 |
| Type declarations | TypeScript 使用者與 IDE 如何知道 API 型別 |
| Build scripts | 如何把原始碼轉成 npm package 可交付的形式 |
| Distribution artifacts | 使用者最後安裝或載入時會拿到什麼檔案 |
| Examples | 維護者如何模擬使用者情境並驗證功能 |

所以，component library repo 的結構通常不是「所有程式都放在 `src/` 就好」，而是會沿著 package 的生命週期拆成多個責任區。

---

### 2.2 Source、Contract、Artifact 是三種不同層級

閱讀 UI library repo 時，最重要的心智模型之一是：

```txt
Source      -> 作者維護的實作來源
Contract    -> 對使用者承諾的 API / 型別形狀
Artifact    -> build 後交付給使用者的成品
```

放到 View UI Plus 中，可以先對應成：

| 層級 | 對應目錄 | 白話理解 |
| --- | --- | --- |
| Source | `src/` | 元件和功能「怎麼寫」 |
| Contract | `types/` | 使用者「可以怎麼用」，TypeScript 看到什麼 |
| Artifact | `dist/` | package 最後「交出去的是什麼」 |

這三層可能描述同一個功能，但它們的角色不同。

以 `Button` component 為例：

- 它的實作可能位於 `src/components/` 底下。
- 它的型別宣告可能位於 `types/` 底下。
- 它被打包後的 JavaScript 與 CSS 會出現在 `dist/` 產物中。

如果你想理解 `Button` 的行為，應看 `src/`；如果你想確認 TypeScript 使用者能拿到什麼型別，應看 `types/`；如果你想確認 package 最終發佈了哪些檔案，才看 `dist/`。

---

### 2.3 `build/` 和 `dist/` 的差別：規則與結果

`build/` 和 `dist/` 很容易被混淆。

可以先用一句話區分：

> `build/` 是「怎麼產生 package」的規則；`dist/` 是「已經產生出來」的結果。

| 目錄 | 性質 | 比喻 |
| --- | --- | --- |
| `build/` | build strategy / build orchestration | 食譜、工廠流程、打包規則 |
| `dist/` | distribution artifact | 成品、包裝好的商品、交付物 |

所以當你想知道「為什麼 CSS 會被輸出到某個位置」、「locale 檔案怎麼被打包」、「字型檔怎麼複製」，應該看 `build/`。當你想知道「npm package 最後真的包含什麼」，才看 `dist/`。

---

### 2.4 `examples/` 是回饋迴路，不是發佈主流程

`examples/` 的作用不是產出 npm package，而是模擬使用者怎麼使用 library。

它在 repo 中比較像一個「驗證環境」：

```txt
examples/
  -> 模擬使用者 app
  -> 使用 View UI Plus
  -> 觀察 component 行為、樣式、locale、plugin install 是否正常
  -> 回頭修正 src/、types/、styles/、build/
```

因此，`examples/` 很適合用來理解「API 實際怎麼被用」，但不適合單獨拿來判斷「library 對外承諾了什麼」。真正的 public runtime surface 要回到 `src/index.js`、`src/components/index.js`；真正的 public type contract 要回到 `types/`。

---

## 3. 整體概覽

View UI Plus 的 repository 可以用 package 生命週期來理解：

```txt
作者維護原始碼與型別
        │
        v
┌────────────────┐
│ src/            │
│ runtime source  │
└───────┬────────┘
        │
        │
┌───────v────────┐
│ types/          │
│ public contract │
└───────┬────────┘
        │
        v
┌────────────────┐
│ build/          │
│ build rules     │
└───────┬────────┘
        │
        v
┌────────────────┐
│ dist/           │
│ artifacts       │
└───────┬────────┘
        │
        v
npm / browser / bundler consumers
```

同時，開發過程會有一條回饋迴路：

```txt
┌────────────────┐
│ examples/       │
│ consumer app    │
└───────┬────────┘
        │ 驗證使用情境、互動、樣式、locale
        v
┌────────────────┐       ┌────────────────┐
│ src/            │       │ types/          │
│ runtime source  │       │ type contract   │
└────────────────┘       └────────────────┘
```

這兩張圖要一起看。第一張圖說明 package 如何從 source 走向發佈產物；第二張圖說明 maintainers 如何透過 example app 反向驗證 library 是否好用、是否正確。

---

## 4. 核心內容逐步講解

### 4.1 為什麼 repo 要按照 package 生命週期拆分

如果只是寫一個普通 Vue app，目錄通常會以功能或頁面拆分，例如 `views/`、`components/`、`router/`、`store/`。但 View UI Plus 是 library，不是單一業務系統，因此它的 repository 必須回答更多問題。

一個 Vue UI library 至少要處理以下幾類責任：

1. **如何實作元件行為**：component 如何 render、如何處理 props、events、slots。
2. **如何被 Vue app 安裝**：使用者能否透過 `app.use()` 安裝整個 library。
3. **如何提供型別提示**：TypeScript 使用者是否能正確取得 component、plugin options、globalProperties 的型別。
4. **如何產生可發佈檔案**：source 如何被打包成 UMD、ESM、CSS、locale、fonts。
5. **如何模擬使用者使用情境**：maintainer 如何在開發階段測試互動、樣式與整合狀態。

所以，repo 的目錄拆分其實是在反映這些責任邊界：

```txt
src/       -> 實作 runtime
parts      -> 示意專案會有其他層
types/     -> 描述 public type contract
build/     -> 定義 build strategy
dist/      -> 保存 distribution artifacts
examples/  -> 模擬 consumer usage
```

注意：上面的 `parts` 只是示意不同專案可能會有其他層。因此閱讀本 repo 時，仍應以原始碼實際目錄為準。

---

### 4.2 `src/`：Runtime implementation layer

`src/` 是 View UI Plus 的 runtime source，也就是 library 實際執行行為的來源。`src/index.js` 是 library 的 runtime entry，負責組合 components、directives、locale、global config 和 imperative APIs。

這代表 `src/` 不是單純的「元件資料夾」，而是整個 library 執行期能力的集合。

---

#### 4.2.1 `src/` 主要回答什麼問題

閱讀 `src/` 時，可以用以下問題作為導向：

| 問題 | 對應閱讀方向 |
| --- | --- |
| 使用者 `app.use(ViewUIPlus)` 後發生什麼事？ | 看 `src/index.js` 的 plugin install flow |
| components 如何集中 export？ | 看 `src/components/index.js` |
| 單一 component 如何實作？ | 看 `src/components/*` |
| directives 如何接入 Vue app？ | 看 `src/directives/*` 與 install flow |
| locale / i18n 如何被整合？ | 看 `src/locale/*` |
| 共用邏輯在哪裡？ | 看 `src/utils/*`、`src/mixins/*` |
| 樣式 source 如何管理？ | 看 `src/styles/*` |

---

#### 4.2.2 `src/index.js` 的架構意義

在 UI library 中，`src/index.js` 往往是非常重要的入口檔。它不一定包含複雜的 UI 邏輯，但它決定 library 對外如何被使用。

`src/index.js` 主要負責：

- 組合 components。
- 組合 directives。
- 接入 locale。
- 寫入 global config。
- 提供 imperative APIs。
- 成為 package runtime 的對外入口。

因此，閱讀 View UI Plus 時，`src/index.js` 應該優先閱讀。它可以幫你先看到 library 的公開執行期介面，也就是 `public runtime surface`。

---

#### 4.2.3 閱讀 `src/` 時要避免的誤解

不要一開始就直接跳進某個 component 的內部實作。對初次閱讀者來說，比較好的順序是：

```txt
src/index.js
  -> src/components/index.js
    -> src/components/某個具體 component
      -> src/utils/、src/mixins/、src/locale/、src/styles/
```

也就是先看 library 怎麼對外組裝，再看某個 component 在內部如何支撐這個對外介面。

---

### 4.3 `types/`：Public type contract layer

`types/` 放的是 TypeScript declaration files，也就是 `.d.ts` 宣告檔。`package.json` 的 `typings` 指向 `types/index.d.ts`，表示 TypeScript 使用者和 IDE 會把這裡視為 package 的型別入口。

這個目錄的核心概念是：

> `src/` 決定 runtime 實際怎麼跑，`types/` 決定 TypeScript 使用者看到什麼型別承諾。

---

#### 4.3.1 為什麼需要獨立的 `types/`

View UI Plus 是一個 JavaScript / Vue UI library，但使用者很可能在 TypeScript 專案中使用它。這時候 library 必須提供清楚的型別資訊，讓 IDE 和 TypeScript compiler 能理解：

- 可以從 package import 哪些 components？
- `app.use(ViewUIPlus, options)` 的 options 長什麼樣子？
- `this.$Message`、`this.$Modal`、`this.$Notice` 等 globalProperties 是否有型別？
- component props、instance、plugin options 是否能被推導或提示？

這些問題不是由 `dist/` 解決，而是由 `types/` 提供 public type contract。

---

#### 4.3.2 `types/` 和 `src/` 的同步成本

將 runtime implementation 與 public type contract 分開處理有好處，也有代價。

好處是：

- TypeScript 使用者有明確入口。
- package 的 public API shape 比較清楚。
- 不一定需要從每個 Vue SFC 自動推導完整型別。

代價是：

- `src/` 改了 runtime API，`types/` 也要跟著更新。
- 如果 declarations 沒同步，可能發生「實際能用，但型別不允許」或「型別允許，但 runtime 不存在」的問題。
- 對維護者而言，type contract 是額外的維護責任。

所以閱讀 `types/` 時，不要只把它當成補充檔案。它是 TypeScript 使用者實際依賴的 public contract。

---

### 4.4 `build/`：Build orchestration layer

`build/` 是 build strategy 的集中區。它不是 runtime source，而是定義如何把 source 轉成可發佈 artifacts 的規則。

目前可辨識出幾條 build responsibility：

| Build 線路 | 來源 | 輸出 |
| --- | --- | --- |
| JavaScript library build | root `vite.config.js` 以 `src/index.js` 作為 library entry | `dist/viewuiplus.min.js`、`dist/viewuiplus.min.esm.js` |
| Style build | `build/build-style.js` 從 `src/styles/index.less` 處理 | `dist/styles/viewuiplus.css` 與 iconfont fonts |
| Locale build | `build/vite.lang.config.js` 掃描 `src/locale/lang/` | `dist/locale/` |

這些資訊需要在後續閱讀實際 `package.json`、`vite.config.js` 和 `build/*` 時再逐項確認。此處先作為 repository architecture 的總覽理解。

---

#### 4.4.1 為什麼 build scripts 不應該污染 runtime source

良好的 library repo 會盡量讓 runtime implementation 與 build orchestration 分離。

原因是：

- `src/` 應該專注於 library 在執行期的行為。
- `build/` 應該專注於如何產生 package artifacts。
- 如果 build 邏輯散落在 runtime source 中，會讓 component 實作變得難以閱讀。
- 如果 runtime 行為依賴 build script 的隱含副作用，後續維護會更困難。

所以當你要理解「某個 component 怎麼運作」，不要一開始就看 `build/`；當你要理解「package 怎麼被打包出來」，才進入 `build/`。

---

### 4.5 `dist/`：Distribution artifact layer

`dist/` 是 build output，也就是 build 完後產生、準備交付給 npm 或 browser / CDN consumers 的 artifacts。

`dist/` 可能包含：

- `dist/viewuiplus.min.js`：UMD bundle。
- `dist/viewuiplus.min.esm.js`：ES module bundle。
- `dist/styles/`：編譯後 CSS 與 fonts。
- `dist/locale/`：個別語系的可載入 output。

這些檔案對使用者很重要，因為使用者最後安裝或載入 package 時，通常不會直接使用 `src/` 中的原始碼，而是透過 package entry 指向已打包好的結果。

---

#### 4.5.1 為什麼不要從 `dist/` 開始讀設計

`dist/` 是 build 結果，不是設計來源。

如果你從 `dist/` 開始讀，會遇到幾個問題：

- bundle 內容可能被壓縮或轉換，不容易看出原始模組邊界。
- CSS 可能已經被編譯，Less 變數與 mixins 的來源關係不明顯。
- locale 或 component 可能被拆分或合併，難以看出原始設計。
- build output 只告訴你最後交付什麼，不一定告訴你為什麼這樣設計。

因此，架構閱讀應該優先看 `src/`、`types/`、`build/`，最後才用 `dist/` 驗證產物。

---

### 4.6 `examples/`：Consumer simulation layer

`examples/` 是從使用者視角回頭驗證 library 的地方。它通常是一個 example app，會載入 View UI Plus，展示 components、routes、demo pages 或互動案例。

`examples/` 提供 routes、demo components、入口 `main.js` 和 `app.vue`，用接近使用者的方式載入並操作 View UI Plus。

---

#### 4.6.1 `examples/` 的價值

`examples/` 的價值在於它可以幫你觀察：

| 觀察方向 | 說明 |
| --- | --- |
| Plugin install | example app 如何安裝 View UI Plus |
| Global components | component 是否能在 template 中直接使用 |
| Style loading | CSS 是否正確載入，元件樣式是否正常 |
| Locale usage | 語系功能是否能在實際 app 中運作 |
| Component interaction | 元件互動狀態是否符合預期 |
| Integration issue | 在真實 Vue app 中是否暴露整合問題 |

對原始碼閱讀者來說，`examples/` 很適合搭配 `src/` 閱讀。你可以先在 example 中觀察使用方式，再回到 `src/` 找到對應實作。

---

#### 4.6.2 為什麼 `examples/` 不是 public API contract

雖然 `examples/` 很有用，但要避免一個常見誤解：

> demo 中出現的寫法，不一定等於完整、正式、穩定的 public API contract。

原因是：

- demo 可能只是展示某個使用情境。
- demo 不一定覆蓋所有參數與邊界情況。
- demo 寫法可能是方便展示，而不是唯一推薦寫法。
- 真正的 runtime contract 應回到 `src/index.js`、`src/components/index.js`。
- 真正的 TypeScript contract 應回到 `types/`。

因此，`examples/` 的定位應該是「使用情境觀察站」，而不是「API 權威來源」。

---

### 4.7 `package.json`：連接各層的 package manifest

`package.json` 在 repository architecture 中也非常重要。

它像是整個 package 的 manifest，負責把不同層連接起來：

| 欄位或資訊 | 架構意義 |
| --- | --- |
| `main` | 指向 package 的主要 runtime artifact |
| `module` / ESM 入口 | 若存在，通常指向 ESM bundle |
| `typings` / `types` | 指向 TypeScript declaration entry |
| `files` | 決定 npm publish 時包含哪些檔案 |
| `scripts` | 定義 build、dev、test、release 等命令 |
| `dependencies` / `peerDependencies` | 說明 runtime 或 peer runtime 依賴 |

`package.json` 的 `typings` 指向 `types/index.d.ts`，`main` 與 `dist/` 有關。這些都是理解 repo 分層時非常關鍵的線索。

後續如果要做更深入的 build / release 筆記，應該直接閱讀完整 `package.json`，確認 `main`、`typings`、`files`、build scripts 與依賴宣告。

---

## 5. 表格整理

### 5.1 主要目錄責任表

| 目錄 | 架構角色 | 主要輸入 | 主要輸出 | 主要消費者 | 初次閱讀重點 |
| --- | --- | --- | --- | --- | --- |
| `src/` | `runtime implementation layer`，執行期實作層 | component、directive、locale、style、utils source | library 的 runtime 行為 | build process、原始碼閱讀者 | 先看 `src/index.js`，再看 `src/components/index.js` |
| `types/` | `public type contract layer`，公開型別契約層 | 手寫 `.d.ts` declarations | `typings` 入口與 component 型別 | TypeScript users、IDE | 看 `types/index.d.ts` 如何描述 plugin、globalProperties、named exports |
| `build/` | `build orchestration layer`，建置流程編排層 | `src/styles/`、`src/locale/lang/`、root build config 等 source | CSS、fonts、locale、bundle artifacts | package scripts、maintainers | 看 source 如何被轉成 `dist/` |
| `dist/` | `distribution artifact layer`，發佈產物層 | Vite / Gulp 等 build output | UMD bundle、ESM bundle、CSS、locale files | npm consumers、browser / CDN users | 用來確認交付結果，不建議作為設計閱讀起點 |
| `examples/` | `consumer simulation layer`，使用者情境模擬層 | example app、demo routes、demo components | 可互動的開發驗證場景 | library maintainers、demo readers | 觀察使用情境，再回到 `src/` 和 `types/` 驗證 |

---

### 5.2 Source、Contract、Artifact 比較表

| 概念 | 對應目錄 | 回答的問題 | 適合閱讀時機 | 常見誤解 |
| --- | --- | --- | --- | --- |
| Source | `src/` | library 怎麼實作？ | 想理解 runtime 行為、component 實作、plugin 安裝時 | 把 `src/` 只看成 component 資料夾 |
| Contract | `types/` | 使用者能依賴什麼型別？ | 想理解 TypeScript 使用者看到的 API shape 時 | 以為型別只是輔助，不影響 public API 理解 |
| Build strategy | `build/` | package 怎麼被產生？ | 想理解 CSS、locale、bundle 如何輸出時 | 把 build script 當成 runtime logic |
| Artifact | `dist/` | package 最後交付什麼？ | 想確認 npm / browser 使用者實際取得的檔案時 | 從壓縮後產物反推原始設計 |
| Consumer simulation | `examples/` | 使用者會怎麼使用 library？ | 想觀察 demo、互動、integration 情境時 | 把 demo 寫法當成完整 public contract |

---

### 5.3 Build 線路整理表

| Build 線路 | 來源 | 產物 | 目的 | 後續確認事項 |
| --- | --- | --- | --- | --- |
| JavaScript bundle | root `vite.config.js`、`src/index.js` | `dist/viewuiplus.min.js`、`dist/viewuiplus.min.esm.js` | 產出 UMD / ESM runtime bundle | 需要後續確認 `vite.config.js` 的完整 library mode 設定 |
| Style build | `build/build-style.js`、`src/styles/index.less` | `dist/styles/viewuiplus.css`、fonts | 產出使用者可載入的 CSS 與 iconfont | 需要後續確認 Less 編譯、壓縮、font copy 流程 |
| Locale build | `build/vite.lang.config.js`、`src/locale/lang/` | `dist/locale/` | 產出各語系可載入檔案 | 需要後續確認語系檔如何被掃描與打包 |
| Type declarations | `types/`、`package.json` 的 `typings` | `types/index.d.ts` 等 declaration entry | 提供 TypeScript public contract | 需要後續確認 declarations 是否手寫、生成或混合維護 |

---

### 5.4 和其他筆記的分工表

| 筆記 | 主要回答 | 本篇是否深入 |
| --- | --- | --- |
| `00-roadmap/01-source-map.md` | 東西在哪裡？入口與閱讀路線在哪裡？ | 不重複 source map，只承接其定位 |
| `03-architecture/01-overview.md` | runtime architecture 如何組裝？plugin install、public API shape、dependency direction 是什麼？ | 只引用概念，不深入 install flow |
| 本篇 `02-repository-structure.md` | repo 為什麼分成這些責任區？source、contract、artifact 如何區分？ | 是本篇主軸 |
| `14-build-release/01-build-map.md` | build / release 如何運作？產物如何生成？ | 本篇只點出方向，細節留給 build 筆記 |
| `06-type-system/01-type-entry-map.md` | TypeScript declaration 如何設計？ | 本篇只說明 `types/` 的角色 |
| `07-components/01-components-map.md` | components 如何組織與實作？ | 本篇只說明 `src/components/` 的 repository 位置 |

---

## 6. 範例或情境說明

### 6.1 情境一：你想知道使用者安裝後實際執行什麼

如果你的問題是：

> 使用者呼叫 `app.use(ViewUIPlus)` 後，到底發生什麼？

你應該優先看：

```txt
package.json
  -> runtime entry 指向哪裡
src/index.js
  -> install(app, options)
src/components/index.js
  -> components 如何集中 export
src/directives/*
src/locale/*
```

這種問題屬於 runtime architecture，不應該先從 `dist/` 或 `examples/` 開始。

---

### 6.2 情境二：你想知道 TypeScript 為什麼有提示

如果你的問題是：

> 為什麼我在 TypeScript 專案中使用 View UI Plus 時，IDE 會知道 component 或 global API 的型別？

你應該優先看：

```txt
package.json
  -> typings / types 欄位
types/index.d.ts
types/viewuiplus.components.d.ts
```

接著再回到 `src/index.js` 對照 runtime 是否與 type declaration 一致。

這個閱讀方向可以幫你訓練一個重要能力：**同時比對 runtime API 和 type contract 是否同步**。

---

### 6.3 情境三：你想知道 CSS 怎麼被交付給使用者

如果你的問題是：

> View UI Plus 的 Less source 如何變成使用者可以 import 的 CSS？

你應該看：

```txt
src/styles/index.less
build/build-style.js
dist/styles/viewuiplus.css
package.json scripts / files
```

這裡要注意：

- `src/styles/` 是 style source。
- `build/build-style.js` 是 build rule。
- `dist/styles/viewuiplus.css` 是 build result。

三者不是同一層。

---

### 6.4 情境四：你想用 demo 觀察 component 行為

如果你的問題是：

> 某個 component 實際使用起來長什麼樣？有哪些互動狀態？

可以先看：

```txt
examples/
  -> 找到對應 demo route 或 demo component
```

然後回到：

```txt
src/components/對應 component
types/對應 declarations
src/styles/對應樣式
```

這樣可以避免只看 demo 造成片面理解。demo 能幫你找到入口，但真正的實作與 contract 仍要回到 `src/` 和 `types/`。

---

## 7. 閱讀路線或學習路線

### 7.1 初次閱讀路線

如果你是第一次系統性閱讀 View UI Plus repository，建議照以下順序：

#### 第一步：先看 `package.json`

目的：建立 package 的外部入口概念。

重點觀察：

- `main` 指向哪個 runtime artifact。
- `typings` 或 `types` 指向哪個 declaration entry。
- `files` 決定哪些目錄會被 publish。
- `scripts` 中有哪些 build、dev、release 命令。

這一步不是要你背所有欄位，而是先知道 package 對外怎麼宣告自己。

---

#### 第二步：看 `src/index.js`

目的：理解 library runtime entry。

重點觀察：

- components 如何被 import / export。
- `install(app, opts)` 做了哪些事。
- directives、locale、globalProperties 如何接入。
- default export 的 API shape 是什麼。

這一步可以連到 `03-architecture/01-overview.md` 的 runtime architecture。

---

#### 第三步：看 `src/components/index.js`

目的：理解 component export layer。

重點觀察：

- components 如何集中匯出。
- named imports 的來源是否在這裡。
- component 實作和 export 之間如何連接。

完成這一步後，再選一個簡單 component 進入 `src/components/*`，不要一開始就把所有 component 展開。

---

#### 第四步：看 `types/index.d.ts`

目的：理解 TypeScript 使用者看到的 public contract。

重點觀察：

- plugin install options 是否有型別。
- named exports 是否有型別。
- globalProperties 是否被補充宣告。
- component declarations 是否集中或拆分。

這一步要和 `src/index.js` 對照，確認 runtime 與 type contract 的關係。

---

#### 第五步：看 `build/` 和 root build config

目的：理解 package 如何被打包。

重點觀察：

- JavaScript bundle 如何產生。
- CSS 如何從 Less source 編譯出來。
- locale 如何被分別輸出。
- fonts 或其他 assets 如何被複製。

這一步可以先看總覽，不必一次讀懂每個 build script 的所有細節。

---

#### 第六步：看 `dist/`

目的：確認最後交付 artifacts。

重點觀察：

- UMD bundle 是否存在。
- ESM bundle 是否存在。
- CSS 與 fonts 是否存在。
- locale output 是否存在。

這一步是驗證，不是主要設計閱讀來源。

---

#### 第七步：用 `examples/` 回頭驗證

目的：從 consumer side 觀察實際使用情境。

重點觀察：

- example app 如何安裝 View UI Plus。
- component 如何被使用。
- style、locale、global API 是否有展示情境。
- demo 使用方式是否能對應回 `src/` 與 `types/`。

---

### 7.2 深入閱讀路線

當你已經掌握 repository structure 後，可以分流成幾條深入路線：

| 深入方向 | 建議閱讀順序 | 目標 |
| --- | --- | --- |
| Plugin system | `src/index.js` -> directives -> locale -> globalProperties | 理解 `app.use()` 背後的 install flow |
| Component system | `src/components/index.js` -> 單一 component -> shared utils / mixins | 理解 component export 與實作關係 |
| Type system | `types/index.d.ts` -> component declarations -> Vue module augmentation | 理解 TypeScript public contract |
| Style system | `src/styles/index.less` -> component Less -> `build/build-style.js` -> `dist/styles/` | 理解樣式 source 到 CSS artifact 的流程 |
| Build release | `package.json scripts` -> `vite.config.js` -> `build/*` -> `dist/` | 理解 package 產物如何被生成 |
| Examples reading | `examples/main.js` -> routes / demos -> 對應 component source | 用 consumer usage 反向定位實作 |

---

### 7.3 初學者可以暫時跳過的部分

第一次閱讀時，可以暫時跳過以下內容：

- `dist/` 中壓縮後的 bundle 細節。
- 每一個 component 的完整 props / events / slots。
- 每一個 Less 變數與 mixin。
- 每個 locale 檔案的語系內容。
- build script 中較細的檔案操作與 edge cases。

原因不是這些內容不重要，而是它們屬於第二層或第三層細節。初次閱讀應先建立「repo 分層與責任邊界」，再逐步深入。

---

## 8. 常見誤區

| 誤區 | 為什麼容易誤解 | 正確理解 |
| --- | --- | --- |
| 以為 `src/` 就等於整個 library | 因為一般專案主要邏輯都放在 `src/` | 對 component library 來說，`src/` 是 runtime source，但還需要 `types/`、`build/`、`dist/` 才構成完整 package |
| 以為 `types/` 只是附屬文件 | `.d.ts` 看起來不像 runtime code | `types/` 是 TypeScript 使用者依賴的 public type contract，會影響 IDE 提示與編譯檢查 |
| 從 `dist/` 開始研究設計 | `dist/` 是 package 使用者實際拿到的東西 | `dist/` 是 build output，不是設計來源；理解設計應回到 `src/`、`types/`、`build/` |
| 把 `build/` 和 `dist/` 當成同一層 | 兩者都和打包有關 | `build/` 是產生規則，`dist/` 是產生結果 |
| 把 `examples/` 當成 API contract | demo 看起來很像正式用法 | `examples/` 是使用情境驗證，真正 contract 要看 `src/index.js`、`src/components/index.js`、`types/` |
| 一開始就深入所有 components | component library 的元件很多，很容易陷入細節 | 應先看 entry、export、install、types，再選代表性 component 深入 |
| 忽略 `package.json` | 覺得它只是 npm 設定檔 | `package.json` 連接 runtime entry、type entry、build scripts、publish files，是理解 package 的關鍵 |
| 只看 source，不看 type contract | 對 JavaScript 使用者來說 source 已經足夠 | 對現代 Vue / TypeScript library，runtime 和 declaration 是否同步是重要維護品質指標 |

---

## 9. 本章總結

View UI Plus 的 repository structure 應該從 **package 生命週期** 來理解，而不是只從「檔案種類」來理解。

`src/` 是 runtime implementation layer，負責 View UI Plus 在 Vue app 中實際能做什麼；`types/` 是 public type contract layer，負責 TypeScript 使用者與 IDE 看到什麼 API 型別；`build/` 是 build orchestration layer，負責把 source、styles、locale 等內容轉換成可交付 artifacts；`dist/` 是 distribution artifact layer，代表 package 最後交付給 npm、browser 或 bundler consumers 的結果；`examples/` 則是 consumer simulation layer，讓維護者能從使用者視角驗證 component 行為、樣式、locale 與整合狀態。

這些目錄共同構成一個 component library 的完整生命週期：作者在 `src/` 和 `types/` 中維護實作與契約，透過 `build/` 產生 `dist/`，最後讓 npm 或 browser 使用者消費；同時透過 `examples/` 回頭驗證實際使用情境。

閱讀這類 repo 時，最重要的是先確認自己正在看哪一層：是 source、contract、build rule、artifact，還是 consumer simulation。只要層級分清楚，就不容易把 generated output 誤當設計來源，也不會把 demo 用法誤當完整 API contract。

---

## 10. 自我檢查問題

1. 為什麼 View UI Plus 這類 Vue component library 的 repo 不能只用 `src/` 來理解？
2. `src/`、`types/`、`build/`、`dist/`、`examples/` 分別代表 package 生命週期中的哪一層責任？
3. `source`、`contract`、`artifact` 三者有什麼差異？請用一個 component 作為例子說明。
4. 為什麼 `types/` 可以被視為 public type contract，而不只是輔助文件？
5. `build/` 和 `dist/` 的差別是什麼？如果你想知道 CSS 如何被產生，應該看哪裡？
6. 為什麼不建議從 `dist/` 開始閱讀 library 的設計？
7. `examples/` 對原始碼閱讀有什麼幫助？它又為什麼不能被當成唯一的 API contract？
8. 如果你要理解 `app.use(ViewUIPlus)` 背後發生什麼，建議的閱讀路線是什麼？
9. 如果你要檢查 TypeScript declarations 是否和 runtime API 同步，應該比對哪些檔案或目錄？
10. `package.json` 在 repository architecture 中扮演什麼角色？為什麼它不只是普通設定檔？

---

## 11. 後續延伸方向

這篇筆記只建立 repository structure 的總覽。後續可以拆成以下更深入的主題筆記：

### 11.1 `package.json` package manifest 分析

可延伸內容：

- `main`、`module`、`typings`、`files` 的意義。
- build scripts 如何串接 `vite.config.js`、`build/*`。
- `dependencies`、`devDependencies`、`peerDependencies` 的分工。
- npm package publish 邊界。

---

### 11.2 `src/index.js` plugin install flow

可延伸內容：

- `install(app, opts)` 的完整流程。
- components 如何全量註冊。
- directives 如何註冊。
- locale / i18n 如何接入。
- `$VIEWUI`、`$Message`、`$Modal`、`$Notice` 等 globalProperties 如何掛載。

---

### 11.3 `types/` type system entry map

可延伸內容：

- `types/index.d.ts` 的職責。
- `types/viewuiplus.components.d.ts` 的職責。
- plugin options 型別。
- component declarations。
- Vue module augmentation。
- runtime API 與 type declarations 的同步檢查。

---

### 11.4 `build/` build map

可延伸內容：

- root `vite.config.js` 的 library mode。
- `build/build-style.js` 如何處理 Less、CSS、fonts。
- `build/vite.lang.config.js` 如何處理 locale。
- build scripts 與 `package.json scripts` 的關係。
- `dist/` 產物如何被產生。

---

### 11.5 `examples/` consumer simulation map

可延伸內容：

- example app 的入口。
- demo routes 如何組織。
- component demo 如何對應到 source。
- 如何透過 examples 觀察樣式、互動、locale 與 global APIs。
- demo usage 與 public API contract 的差異。

---

### 11.6 Component reading map

可延伸內容：

- `src/components/index.js` 如何集中 export。
- 單一 component 的典型目錄結構。
- component 與 styles、utils、mixins、locale 的依賴關係。
- component source、type declaration、example demo 三者如何對照閱讀。
