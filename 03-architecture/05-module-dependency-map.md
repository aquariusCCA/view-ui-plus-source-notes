# Module Dependency Map：View UI Plus 主要模組依賴方向

## 1. 本章定位

這篇筆記屬於「架構分析筆記」與「原始碼閱讀導讀筆記」的混合型筆記。它的目的不是教你實作某個 component，也不是逐行分析 View UI Plus 的 source code，而是先建立一張高層級的 module dependency map，幫助你知道閱讀原始碼時應該從哪裡切入、哪些模組是入口、哪些模組是支撐層、哪些檔案是 build 或發佈相關。

讀完本篇後，你應該能理解：

- `src/index.js` 為什麼是 package runtime entry。
- `src/index.js` 如何聚合 `components`、`directives`、`locale`、`version` 與 default API。
- `src/components/index.js` 與 `src/components/*` 的角色差異。
- Component 實作通常會向下依賴哪些共用能力。
- `package.json` 如何把 `src/`、`types/`、`build/`、`dist/` 串成 npm package 的輸出面。
- 閱讀 View UI Plus repo 時，應該如何區分 runtime source、type contract、build artifact 與 build script。

本篇不解決以下問題：

- 不列出每個 component 的完整 import graph。
- 不逐行分析 `install(app, opts)` 的執行細節。
- 不拆解 `Message`、`Modal`、`Notice` 等 imperative API 的內部實作。
- 不深入分析每個 build script 的實作內容。
- 不詳細說明每個 TypeScript declaration 的型別設計。

這些細節適合放到後續更聚焦的筆記，例如 plugin system、component source reading、imperative API、directives、build release 或 type declaration analysis。

---

## 2. 學習前先建立的基本觀念

在閱讀這份依賴地圖之前，需要先分清楚幾個容易混淆的概念。

### 2.1 Module dependency map 不等於完整 import graph

`import graph` 指的是程式碼中每一個檔案實際 import 了哪些檔案，通常可以精確到單一檔案與單一 import statement。例如 `Button` component 可能 import 某個工具函數、某個 mixin、某個子 component 或某個樣式檔。

本篇的 `Module Dependency Map` 不是這種細粒度圖，而是架構層級的依賴方向圖。它關心的是：

- 哪些模組是入口。
- 哪些模組是被入口聚合的來源。
- 哪些模組是 component 實作時共用的支撐能力。
- 哪些模組屬於 build 與 package output。
- 哪些方向是應該保持的架構邊界。

因此，本篇可以幫你建立閱讀順序與依賴心智模型，但不能取代你進入單一 component 目錄後逐步追蹤 import。

### 2.2 Runtime dependency 與 Package output dependency 不同

View UI Plus 這類 UI library 同時有兩種依賴方向：

第一種是 **Runtime dependency**，也就是 library 在執行期如何組成可用能力。例如：

```txt
src/index.js
  -> src/components/index.js
  -> src/directives/*
  -> src/locale/index.js
```

這條線回答的是：使用者執行 `app.use(ViewUIPlus)` 或 `import { Button } from 'view-ui-plus'` 時，package runtime API 是怎麼被組裝出來的。

第二種是 **Package output dependency**，也就是 package 如何被建置並發佈。例如：

```txt
package.json
  -> scripts
  -> build/
  -> dist/
  -> types/
```

這條線回答的是：npm package 對外的 `main`、`typings`、CSS、locale files、bundle artifacts 是如何被宣告或產生的。

這兩種方向都很重要，但不要混在一起。Runtime dependency 關心的是「程式執行時能力如何被組裝」，Package output dependency 關心的是「source 如何變成可發佈產物」。

### 2.3 Source of truth 要分情境判斷

在大型前端 library 中，不同目錄代表不同層面的真相來源：

| 想理解的問題 | 優先閱讀位置 | 原因 |
| --- | --- | --- |
| Runtime 行為如何發生 | `src/` | `src/` 是 component、plugin、directive、locale 的 source code。 |
| TypeScript 使用者看到什麼型別 | `types/` | `types/` 描述 public type contract。 |
| 發佈後 npm package 會包含什麼 | `package.json`、`dist/` | `package.json` 宣告 entry 與 files，`dist/` 是 build artifact。 |
| JS / CSS / locale 如何生成 | `build/`、`vite.config.js`、`package.json scripts` | 這些位置定義 build process。 |

因此，不能簡單地說某一個目錄永遠是唯一真相來源。你要先問：「我現在想理解的是 runtime、type、build，還是 publish surface？」

---

## 3. 整體概覽

總覽圖可以整理成三條主要依賴線：

```txt
package.json
  -> build/
  -> types/
  -> dist/

src/index.js
  -> src/components/index.js
  -> src/directives/*
  -> src/locale/index.js

src/components/*
  -> src/utils/
  -> src/mixins/
  -> src/locale/
  -> src/styles/
```

這三條線可以分別理解為：

1. **Package 輸出線**  
   `package.json` 描述 npm package 的 entry、types、files 與 scripts，並透過 build scripts 產生 `dist/`，同時讓 TypeScript 使用者讀取 `types/`。

2. **Runtime 聚合線**  
   `src/index.js` 是 runtime entry，負責把 components、directives、locale、version、install flow 與 default API 聚合成使用者能接觸到的 public surface。

3. **Component 實作支撐線**  
   `src/components/*` 是 UI 行為的主要實作區域，它們會依賴 `src/utils/`、`src/mixins/`、`src/locale/`、`src/styles/` 等共用能力，而不是把所有邏輯都塞在 component 內部。

若用一句話總結這張圖：**`src/index.js` 負責組裝 runtime API，`src/components/*` 負責實作 UI 能力，`package.json` 與 build scripts 負責把 source 轉成 npm package 的輸出面。**

---

## 4. 核心內容逐步講解

### 4.1 如何閱讀這張依賴地圖

閱讀這張圖時，箭頭不一定代表「唯一 import」，而是代表「主要依賴方向」或「產出方向」。

例如：

```txt
src/index.js
  -> src/components/index.js
```

這代表 `src/index.js` 需要依賴 component export map，才能對外提供 named exports、default API 與 plugin install 時的全域註冊來源。它不代表所有 component 的內部細節都在 `src/index.js` 內展開。

再例如：

```txt
package.json
  -> build/
  -> dist/
```

這不是 runtime import，而是 package 建置與發佈方向。`package.json scripts` 會觸發 build process，最後產生 `dist/` 裡的 bundle、CSS、locale files 等 artifact。

所以，這份筆記中的箭頭要分成兩種讀法：

| 箭頭類型 | 說明 | 例子 |
| --- | --- | --- |
| Runtime dependency | 某個 runtime 模組為了組成執行期能力而依賴其他 source。 | `src/index.js -> src/components/index.js` |
| Output / build direction | 某些 source 或設定經過 build process 產生發佈產物。 | `src/styles/index.less -> dist/styles/viewuiplus.css` |

這個區分很重要。若把 build 方向誤解成 runtime dependency，就可能會以為 `src/` 在執行期依賴 `dist/`；但對 library source 來說，通常應該是 source 產生 dist，而不是 source 依賴 dist。

---

### 4.2 `src/index.js`：Runtime public surface 的集中點

`src/index.js` 是 View UI Plus 的 package runtime entry。它的任務不是實作每一個 component，而是把不同來源的 runtime 能力集中起來，整理成使用者可以使用的 API。

模型如下：

```txt
src/components/index.js
src/directives/style.js
src/directives/resize.js
src/directives/line-clamp.js
src/locale/index.js
dayjs
package.json version
      -> src/index.js
        -> export * from './components'
        -> install(app, opts)
        -> app.component()
        -> app.directive()
        -> app.config.globalProperties
        -> locale / i18n / lang
        -> default API
```

這裡可以拆成幾個角色來理解。

第一，`src/index.js` 會透過 `src/components/index.js` 取得所有 component exports。這讓 package 可以支援：

```js
import { Button, Modal } from 'view-ui-plus';
```

第二，`src/index.js` 會將 components、directives、locale setup 等串入 `install(app, opts)`。這讓使用者可以透過 Vue plugin 機制一次安裝整個 UI library：

```js
app.use(ViewUIPlus);
```

第三，`src/index.js` 會把某些 service-style API 掛到 `app.config.globalProperties`，例如 `$Message`、`$Modal`、`$Notice`、`$Spin`、`$Date` 等。這類 API 和一般 component 不完全一樣，它們更像是可以在 instance 上直接呼叫的全域服務。

第四，`src/index.js` 會建立 default export，把 `version`、`locale`、`i18n`、`install`、`lang` 與 components 放在同一個 API object 中。這讓使用者可以用 default import 取得一個完整的 library object。

因此，`src/index.js` 的核心價值是「整合」。它把 components、directives、locale、version 與 global services 組合成一個 coherent public runtime surface。

---

### 4.3 `src/components/index.js`：Component export map

`src/components/index.js` 是 component 層的集中出口。它的角色和 `src/index.js` 不同：

- `src/index.js` 是整個 package 的 runtime entry。
- `src/components/index.js` 是 component collection 的 export map。
- `src/components/*` 才是各 component 的實際實作位置。

可以用下面的圖理解：

```txt
src/components/index.js
  -> src/components/affix
  -> src/components/button
  -> src/components/form
  -> src/components/modal
  -> src/components/table
  -> src/components/*
```

`src/components/index.js` 的好處是讓 package entry 不需要逐一知道每個 component 的內部檔案結構。它只需要依賴一個統一的 component export map，就可以取得所有對外 component。

這種設計常見於 component library，因為它可以把「component collection 的整理」和「package public API 的組裝」分開：

| 層級 | 負責事項 |
| --- | --- |
| `src/components/*` | 單一 component 的 props、events、slots、state、render/template、內部邏輯。 |
| `src/components/index.js` | 統一收斂並輸出 component collection。 |
| `src/index.js` | 把 component collection 接到 named exports、plugin install、default API。 |

這樣的分工可以降低入口檔的複雜度，也能讓 component 層有自己的組織邊界。

---

### 4.4 `src/components/*`：UI 行為的主要實作區

`src/components/*` 是真正實作 UI 能力的地方。像 `button`、`form`、`table`、`modal` 等 component 目錄，通常會處理以下內容：

- props 的定義與預設值。
- events 的觸發。
- slots 的設計。
- template 或 render function。
- component internal state。
- component 與子 component 的協作。
- 對工具函數、mixins、locale、styles 的依賴。

component 會向下依賴：

```txt
src/components/*
  -> src/utils/
  -> src/mixins/
  -> src/locale/
  -> src/styles/
```

這代表 component 並不是孤立實作。它會使用共用工具處理 DOM、日期、CSV、textarea height、transfer queue、keyCode 等問題；也會使用 mixins 抽取跨 component 的共同行為；需要文案時會透過 locale 系統；需要視覺呈現時則對應到 styles。

這種設計的重點是：**component 應該專注於 UI 行為本身，而不是把所有跨 component 的工具、語系、樣式與基礎行為都重複寫一遍。**

---

### 4.5 `src/utils/`：跨 component 的通用工具

`src/utils/` 可以理解為 component 層的工具箱。包括：

- DOM helper。
- assist helper。
- date。
- CSV。
- textarea height。
- transfer queue。
- keyCode。

這些工具通常不是使用者直接操作的 public API，而是 component 在內部處理共通問題時使用的 implementation detail。

例如多個 component 都可能需要判斷 DOM 狀態、處理鍵盤事件、計算高度、處理日期或輔助資料轉換。如果每個 component 都各自實作一份，會產生重複邏輯，也會讓 bug 修正變得困難。

所以，`src/utils/` 的架構角色是：

- 將跨 component 的純工具邏輯集中。
- 降低 component 實作重複。
- 讓共用邏輯可以被多個 component 使用。
- 避免 package entry 直接塞入低階工具細節。

需要注意的是，除非 library 明確把某些 utility 設計成 public API，否則不要把 `src/utils/` 當成使用者應該直接依賴的穩定 contract。對外穩定的是 package public API，不一定是內部工具檔案。

---

### 4.6 `src/mixins/`：跨 component 的共同行為抽取

`src/mixins/` 比 `src/utils/` 更接近 Vue component 行為。包括：

- `form`
- `locale`
- `globalConfig`
- `link`
- `emitter`

這些 mixins 通常不是單純的函數工具，而是會和 component instance、props、computed、methods、provide/inject、事件溝通或生命週期有關。

可以這樣區分：

| 類型 | 主要特徵 | 常見用途 |
| --- | --- | --- |
| `utils` | 偏向純工具函數或通用 helper。 | DOM 計算、格式化、資料處理、常數判斷。 |
| `mixins` | 偏向 Vue component 行為抽取。 | 表單協作、語系取得、全域設定、事件傳遞。 |

`src/mixins/` 的存在代表某些行為會被多個 component 重複使用。例如表單元件常需要和 `Form` / `FormItem` 協作，locale 相關文案可能很多 component 都需要，全域設定也可能影響多個 component 的預設行為。

不過，mixins 也有閱讀上的成本：它會把 component 行為分散到外部檔案中。閱讀單一 component 時，如果看到 mixin，需要同步追蹤 mixin 提供了哪些 props、computed、methods 或事件行為，否則可能會漏掉真正的行為來源。

---

### 4.7 `src/locale/`：語系與 i18n runtime 的支撐層

`src/locale/` 是 locale data 與 i18n runtime 的來源。它和 `src/index.js`、`src/components/*` 都有關係。

從 `src/index.js` 的角度看，locale 會形成 package-level API，例如：

- `locale`
- `i18n`
- `lang`

從 component 的角度看，locale 會支撐 component 取得顯示文字，例如某些提示文字、空狀態文字、日期或分頁相關文字。

因此，`src/locale/` 同時支援兩種使用場景：

1. **Package-level locale control**  
   讓使用者可以透過 library API 設定或切換語系。

2. **Component-level text rendering**  
   讓 component 在 runtime 中取得正確的多語系文案。

閱讀 `src/locale/` 時要注意：本篇只說明它在依賴地圖中的位置，不深入拆解 locale data 結構、語系包 build 流程或 i18n instance 接入細節。這些細節可以放到後續 locale 專題筆記。

---

### 4.8 `src/styles/`：Component 視覺系統的 source

`src/styles/` 是樣式 source 的主要位置，包含 Less source、component class 樣式、animation、common style、iconfont 與 style mixins。

它和 `src/components/*` 的關係可以理解為：

```txt
component runtime behavior
  -> DOM structure / class name / state
  -> src/styles/
  -> visual presentation
```

Component 負責決定 DOM 結構、狀態與互動；styles 負責讓這些 class 與狀態呈現出正確視覺效果。例如 disabled、active、selected、loading 等狀態，通常會同時牽涉 component runtime 判斷與 CSS class 呈現。

但是樣式層不應該承擔 runtime logic。樣式可以定義 `.disabled` 長什麼樣子，但「什麼時候 disabled」、「disabled 後事件是否應該阻止」、「disabled 狀態如何從 props 或 form context 推導」仍然應由 component runtime 處理。

在 package output 線中，`src/styles/index.less` 會透過 `build:style` 被編譯成 `dist/styles/viewuiplus.css`。因此樣式層同時參與 component 視覺實作與 package CSS artifact 的生成。

---

### 4.9 `package.json`：Package metadata 與輸出面的樞紐

`package.json` 不只是 npm package 的基本資訊，它也是 source、types、build、dist 之間的連接點。

方向如下：

```txt
package.json
  -> main: dist/viewuiplus.min.js
  -> typings: types/index.d.ts
  -> files: dist / src / types
  -> scripts
      -> build:prod -> vite.config.js -> src/index.js -> dist/viewuiplus.min.js
      -> build:style -> build/build-style.js -> src/styles/index.less -> dist/styles/viewuiplus.css
      -> build:lang -> build/vite.lang.config.js -> src/locale/lang/* -> dist/locale/*
```

這段可以拆成兩種角色：

第一，`package.json` 定義 **package public output surface**。例如 `main` 告訴 Node / bundler 主要 runtime bundle 在哪裡，`typings` 告訴 TypeScript 型別入口在哪裡，`files` 決定發佈到 npm 時哪些內容會被包含。

第二，`package.json scripts` 定義 **build command surface**。例如 `build:prod`、`build:style`、`build:lang` 分別處理 JS bundle、CSS output 與 locale output。

所以，`package.json` 是理解 package 如何對外發佈的第一站。當你想知道 npm 使用者實際吃到哪個 bundle、TypeScript 讀到哪個 declaration file、CSS 從哪裡生成，就應該回到 `package.json` 看 entry fields 與 scripts。

---

### 4.10 `types/`：Public TypeScript contract

`types/` 的責任是描述 TypeScript 使用者看到的 public contract。`typings` 會指向 `types/index.d.ts`。

這代表當使用者在 TypeScript 專案中寫：

```ts
import { Button } from 'view-ui-plus';
```

或在 Vue app 中使用 View UI Plus plugin 時，IDE 與 TypeScript compiler 會依賴 `types/` 中的 declarations 來理解 public API 的型別形狀。

不過，`types/` 不是 runtime source of truth。它描述的是 public API 應該長什麼樣子，但真正的 runtime 行為仍要回到 `src/`。如果遇到型別和 runtime 行為不一致的情況，閱讀時要分開判斷：

- 型別錯誤或 declaration 缺漏：看 `types/`。
- 實際執行行為：看 `src/`。
- 發佈後使用者是否拿到型別：看 `package.json` 的 `typings` 與 publish files。

這個區分可以避免把 type declaration 誤當成 runtime implementation。

---

### 4.11 `build/` 與 `dist/`：從 source 到 artifacts

`build/` 和 `dist/` 代表兩個不同階段：

| 目錄 | 角色 |
| --- | --- |
| `build/` | build scripts，負責定義如何把 source 轉成 output。 |
| `dist/` | build artifacts，負責保存發佈後使用者會載入的 JS、CSS、locale、fonts 等產物。 |

三條 build path：

1. `build:prod`  
   透過 `vite build`，以 `src/index.js` 作為 library entry，產生 JavaScript bundle，例如 `dist/viewuiplus.min.js` 與可能的 ES module bundle。

2. `build:style`  
   透過 `build/build-style.js`，從 `src/styles/index.less` 編譯出 `dist/styles/viewuiplus.css`，並處理 fonts 等資源。

3. `build:lang`  
   透過 `build/vite.lang.config.js`，從 `src/locale/lang/*` 產生 `dist/locale/*` 語系檔。

這裡的關鍵觀念是：**`dist/` 是結果，不是主要設計來源。**

如果你想理解 `Button` 為什麼這樣運作，應該看 `src/components/button`；如果你想理解 CSS 如何生成，應該看 `src/styles/` 與 `build/build-style.js`；如果你想知道發佈後 bundle 長什麼樣，才看 `dist/`。

---

## 5. 表格整理

### 5.1 主要模組依賴表

| 起點 | 依賴 / 指向 | 類型 | 主要意義 | 初次閱讀重點 |
| --- | --- | --- | --- | --- |
| `src/index.js` | `src/components/index.js` | Runtime dependency | 取得 component export map，支援 named exports、plugin install 與 default API。 | 看它如何 `export *`、如何 import components、如何組裝 default API。 |
| `src/index.js` | `src/directives/style.js` | Runtime dependency | 組裝 style-related directives。 | 看 directives map 如何被建立，暫時不用深入 directive lifecycle。 |
| `src/index.js` | `src/directives/resize.js` | Runtime dependency | 提供 `resize` directive。 | 確認它如何被集中註冊即可。 |
| `src/index.js` | `src/directives/line-clamp.js` | Runtime dependency | 提供 `line-clamp` directive。 | 確認它在 plugin install 中的註冊位置。 |
| `src/index.js` | `src/locale/index.js` | Runtime dependency | 提供 `locale`、`i18n`、`lang` 與 install 時 locale setup。 | 先理解 API 出口，再拆 locale 實作。 |
| `src/index.js` | `package.json` | Metadata dependency | 讀取 `version`，形成 runtime API 的版本資訊。 | 確認版本如何被 export。 |
| `src/components/index.js` | `src/components/*` | Component export dependency | 統一輸出 component collection。 | 看有哪些 component 被集中 export。 |
| `src/components/*` | `src/utils/` | Internal runtime dependency | 使用通用 helper 支撐 component 實作。 | 追蹤 component 用了哪些工具函數。 |
| `src/components/*` | `src/mixins/` | Internal runtime dependency | 使用跨 component 行為抽取。 | 注意 mixin 可能提供隱含行為。 |
| `src/components/*` | `src/locale/` | Internal runtime dependency | 取得多語系文案或 i18n 能力。 | 看 component 如何取得文字。 |
| `src/components/*` | `src/styles/` | Style dependency | 對應 component class、狀態與視覺呈現。 | 讀 component 時同步對照 class 與 styles。 |
| `package.json` | `types/index.d.ts` | Type contract direction | 宣告 TypeScript 型別入口。 | 用來理解 public type surface。 |
| `package.json` | `dist/` | Package output direction | 宣告 runtime bundle、CSS、locale 等發佈產物。 | 確認 npm 使用者實際接觸的輸出。 |
| `package.json scripts` | `build/`、`vite.config.js` | Build direction | 定義 JS、CSS、locale 如何被建置。 | 先看 scripts，再進 build 檔案。 |

---

### 5.2 Runtime 與 Build 邊界表

| 區塊 | 責任 | 不應混淆成 | 閱讀建議 |
| --- | --- | --- | --- |
| `src/` | Runtime source of truth，包含 entry、components、directives、locale、styles source。 | 不等於最終發布 bundle。 | 理解實作行為時優先閱讀。 |
| `types/` | Public TypeScript contract，描述 install options、globalProperties、component declarations。 | 不負責 runtime 行為。 | 對照 TypeScript 使用者看到的 API。 |
| `dist/` | Build artifacts，包含 JS bundle、CSS、locale output、fonts。 | 不應作為修改架構行為的 source of truth。 | 用來確認發佈後的輸出結果。 |
| `build/` | Build scripts，負責把 source 轉成 artifacts。 | 不應承載 component runtime logic。 | 理解建置流程時閱讀。 |
| `package.json` | Package metadata、entry fields、scripts 與發布檔案範圍。 | 不應承載具體 UI 行為。 | 閱讀 package 輸出面與建置入口時先看。 |

這張表的閱讀重點是：不同目錄解決不同問題。不要用 `dist/` 反推開發時應該怎麼改 component，也不要用 `types/` 推斷所有 runtime 行為。每個位置都要放回它自己的責任邊界中理解。

---

### 5.3 三條主要路線整理表

| 路線 | 起點 | 終點 | 解決的問題 |
| --- | --- | --- | --- |
| Runtime API 聚合路線 | `src/index.js` | named exports、`install(app, opts)`、`globalProperties`、default API | View UI Plus 如何在 Vue app 執行期被使用。 |
| Component 實作支撐路線 | `src/components/*` | `src/utils/`、`src/mixins/`、`src/locale/`、`src/styles/` | 單一 component 如何依靠共用能力完成 UI 行為。 |
| Package 發佈輸出路線 | `package.json scripts`、`build/` | `dist/`、`types/` | Source 如何變成 npm package 使用者看到的 bundle、CSS、locale 與型別。 |

---

## 6. 範例或情境說明

### 6.1 情境一：使用者執行 `app.use(ViewUIPlus)`

當使用者在 Vue app 中執行：

```js
app.use(ViewUIPlus);
```

可以用這張依賴地圖推導出大致路線：

```txt
使用者 Vue app
  -> default import ViewUIPlus
  -> src/index.js 的 default API
  -> install(app, opts)
  -> components map
  -> directives map
  -> locale setup
  -> app.config.globalProperties
```

這個流程的重點不是單一 component 如何渲染，而是 `src/index.js` 如何把整個 library 組裝成 Vue plugin。你在閱讀時應先確認 `install(app, opts)` 的輸入、它會註冊哪些 component / directives、它會設定哪些 `globalProperties`，再去追單一細節。

### 6.2 情境二：使用者 named import 單一 component

當使用者寫：

```js
import { Button } from 'view-ui-plus';
```

依賴路線可以簡化為：

```txt
package public API
  -> src/index.js
  -> export * from './components'
  -> src/components/index.js
  -> Button component source
```

這條路線和 `app.use()` 不完全相同。`app.use()` 走的是 plugin install 與全域註冊；named import 則是使用 module export surface 取得單一 component。

因此，閱讀時要分清楚：

- 想理解「整包如何安裝」：看 `install(app, opts)`。
- 想理解「單一 component 如何被 export」：看 `export * from './components'` 與 `src/components/index.js`。
- 想理解「單一 component 如何運作」：進入 `src/components/button` 這類具體目錄。

### 6.3 情境三：使用者載入 CSS

當使用者載入 View UI Plus 的 CSS，例如：

```js
import 'view-ui-plus/dist/styles/viewuiplus.css';
```

依賴地圖對應的是 package output 路線：

```txt
src/styles/index.less
  -> build/build-style.js
  -> dist/styles/viewuiplus.css
  -> 使用者 import CSS
```

這裡的主角不是 `src/index.js`，而是 style source 與 build script。若你想理解「樣式為什麼長這樣」，應看 `src/styles/`；若你想理解「CSS 如何被打包出來」，應看 `build/build-style.js`；若你只想確認發佈產物，才看 `dist/styles/viewuiplus.css`。

### 6.4 情境四：閱讀單一 component 的依賴

假設你要閱讀 `Table` component，可以按照以下思路：

```txt
src/components/index.js
  -> Table export
  -> src/components/table
  -> imports from utils / mixins / locale / styles
```

閱讀時不要只看 component 本身，也要同步觀察：

- 它是否使用 `src/utils/` 的工具函數。
- 它是否混入 `src/mixins/` 的共同行為。
- 它的文字是否透過 `src/locale/` 取得。
- 它的 class name 是否對應到 `src/styles/` 中的樣式。
- 它是否有 service-style API 或和 `globalProperties` 有關。

這樣讀才不會把 component 行為誤以為全部都寫在單一檔案裡。

---

## 7. 閱讀路線或學習路線

如果你要用這張依賴地圖閱讀 View UI Plus repo，可以按照以下順序。

### 7.1 初次閱讀路線：先建立 package 與 runtime 的大方向

1. **先看 `package.json`**  
   目的不是背所有欄位，而是先確認 package entry、type entry、build scripts 與 publish files。這會幫你知道使用者實際吃到哪些輸出。

2. **再看 `src/index.js`**  
   這是 runtime public surface 的集中點。你要觀察它如何匯入 components、directives、locale、version，並如何形成 named exports、install flow、globalProperties 與 default API。

3. **接著看 `src/components/index.js`**  
   這裡可以幫你建立 component collection 的輪廓，知道整個 library 對外提供哪些 component。

4. **挑一個代表性 component 進入 `src/components/*`**  
   不需要一開始就讀全部 component。建議先選一個常用且結構適中的 component，例如 Button、Form、Modal 或 Table，觀察它如何使用 utils、mixins、locale、styles。

### 7.2 深入閱讀路線：追蹤支撐層與建置流程

5. **回頭看 `src/utils/` 與 `src/mixins/`**  
   當你在 component 中看到工具函數或 mixin，再追進去看它們提供什麼共用能力。這樣能避免無目的地掃完整個 utils 目錄。

6. **對照 `src/styles/`**  
   若要理解 UI 狀態和樣式的關係，就對照 component class name 與 Less source。特別注意 active、disabled、loading、selected 等狀態。

7. **看 `types/index.d.ts`**  
   用來確認 TypeScript 使用者看到的 public contract。這一步適合在你已理解 runtime API 後再做，否則容易只看到型別但不知道它對應哪段 runtime。

8. **最後看 `build/` 與 `vite.config.js`**  
   這一步用來理解 source 如何變成 `dist/`，包含 JS bundle、CSS、locale files。不要一開始就從 build script 開始，否則容易陷入工具細節。

### 7.3 可以暫時跳過的部分

初次閱讀時，可以先暫時跳過：

- 每個 component 的所有局部 import。
- `dist/` 中已打包壓縮後的 bundle。
- 所有 locale 語系檔的內容。
- 每個 directive 的 lifecycle 細節。
- 每個 TypeScript declaration 的細節。

這些內容不是不重要，而是它們適合在你已經建立 module dependency map 後，再針對具體問題深入閱讀。

---

## 8. 常見誤區

| 誤區 | 為什麼容易誤解 | 正確理解 |
| --- | --- | --- |
| 把這張圖當成完整 import graph | 圖中有箭頭，看起來像所有 import 關係。 | 本篇是粗粒度架構地圖，只描述主要依賴方向；單一 component 的 import 要回到 component 目錄追蹤。 |
| 以為 `src/index.js` 實作了所有 component | `src/index.js` 是 package entry，會看到很多 component 名稱。 | `src/index.js` 負責聚合與暴露，真正 component 行為在 `src/components/*`。 |
| 以為 `src/components/index.js` 就是 component 實作 | 它集中 export components，看起來像 component 主要位置。 | 它是 export map，實作仍分散在各 component 目錄。 |
| 把 `dist/` 當成主要維護入口 | 使用者最終載入的是 `dist/`，所以容易以為應該看 dist。 | `dist/` 是 build result。理解實作應看 `src/`，確認輸出才看 `dist/`。 |
| 把 `types/` 當成 runtime 行為來源 | TypeScript 專案會讀到 declarations。 | `types/` 描述 public type contract，不負責 runtime implementation。 |
| 認為 `package.json` 只是不重要的 metadata | 很多初學者只把它當套件資訊。 | 對 library 來說，`package.json` 定義 entry、typings、files、scripts，是理解 package output 的重要入口。 |
| 看到 component 依賴 `utils` / `mixins` 就忽略它們 | 初學者常只讀 component 檔案本身。 | 很多實際行為可能被抽到 utils 或 mixins，閱讀 component 時要同步追蹤。 |
| 以為 styles 可以決定 runtime 行為 | CSS 會呈現 disabled、active 等狀態。 | Styles 只負責視覺呈現，狀態判斷與事件語意仍由 component runtime 負責。 |

---

## 9. 本章總結

這篇筆記的核心不是記住每一個檔案名稱，而是建立 View UI Plus repo 的主要依賴方向心智模型。

從 runtime 角度看，`src/index.js` 是 public runtime surface 的集中點。它依賴 `src/components/index.js`、`src/directives/*`、`src/locale/index.js`、`dayjs` 與 `package.json version`，再將這些能力整理成 named exports、`install(app, opts)`、`app.config.globalProperties`、locale APIs 與 default API。

從 component 實作角度看，`src/components/index.js` 是 component export map，而 `src/components/*` 才是 UI 行為的主要實作區。Component 不應孤立理解，因為它通常會依賴 `src/utils/`、`src/mixins/`、`src/locale/` 與 `src/styles/`。這些共用能力讓 component 不需要重複實作通用邏輯，也讓 library 可以維持一致的行為與視覺系統。

從 package 發佈角度看，`package.json` 是連接 source、types、build scripts 與 dist artifacts 的樞紐。`src/` 是 runtime source of truth，`types/` 是 TypeScript public contract，`build/` 定義產物生成流程，`dist/` 則是最終發佈結果。

因此，閱讀這類 UI library 時，最重要的是先判斷自己正在追的是哪一條路線：是 runtime API 如何組裝、component 如何實作，還是 package 如何被 build 和 publish。只要這三條線分清楚，後續追原始碼時就不容易迷路。

---

## 10. 自我檢查問題

1. 為什麼本篇的 `Module Dependency Map` 不等於完整的 `import graph`？
2. `Runtime dependency` 和 `Package output dependency` 的差異是什麼？請各舉一個例子。
3. `src/index.js` 在 View UI Plus 中扮演什麼角色？它為什麼不應該負責實作單一 component 的細節？
4. `src/components/index.js` 和 `src/components/*` 的責任有什麼不同？
5. 為什麼 component 實作通常會依賴 `src/utils/`、`src/mixins/`、`src/locale/`、`src/styles/`？
6. `types/` 和 `src/` 的差異是什麼？為什麼不能把 `types/` 當成 runtime source of truth？
7. `dist/` 為什麼不應該被當成主要維護入口？
8. 如果你想理解使用者執行 `app.use(ViewUIPlus)` 後發生什麼事，應該優先閱讀哪些檔案？
9. 如果你想理解 CSS 產物 `dist/styles/viewuiplus.css` 如何生成，應該追哪一條路線？
10. 閱讀單一 component 時，除了 component 自己的檔案之外，還應該注意哪些共用支撐層？

---

## 11. 後續延伸方向

這份依賴地圖適合作為後續原始碼閱讀的入口。後面可以繼續拆成以下主題筆記：

1. **`src/index.js` install flow 詳解**  
   深入分析 `install(app, opts)` 如何註冊 components、directives、設定 locale、掛載 globalProperties，以及如何避免重複安裝。此處需要後續補充實際原始碼流程。

2. **`src/components/index.js` component export map 分析**  
   整理所有 component 的 export 方式、命名規則、是否有 alias，以及哪些 component 同時具有 service-style API。

3. **單一 component 依賴分析**  
   挑選 `Button`、`Form`、`Modal`、`Table` 等代表性 component，追蹤它們依賴哪些 utils、mixins、locale 與 styles。

4. **`src/mixins/` 共同行為分析**  
   專門分析 `form`、`locale`、`globalConfig`、`link`、`emitter` 等 mixins 如何支撐多個 component。

5. **`src/directives/` 指令系統分析**  
   拆解 `style`、`resize`、`line-clamp` directives 的註冊方式與 Vue directive lifecycle。

6. **Locale 與 i18n 架構分析**  
   分析 `src/locale/index.js`、語系資料、`locale` / `i18n` / `lang` APIs 與 `dist/locale/` 的建置輸出關係。

7. **Build release 流程分析**  
   分析 `build:prod`、`build:style`、`build:lang` 如何分別生成 JS bundle、CSS 與 locale artifacts。

8. **Type declaration 與 runtime API 對照表**  
   將 `types/index.d.ts` 與 `src/index.js` 的 public API 對照，檢查 TypeScript contract 是否完整描述 runtime surface。
