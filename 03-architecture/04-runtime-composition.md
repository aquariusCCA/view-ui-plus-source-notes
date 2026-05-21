# Runtime Composition（執行期組裝模型）

## 1. 本章定位

本章要解決的問題是：**View UI Plus 的 `src/index.js` 如何把內部模組組裝成使用者可以使用的 package runtime API？**

更精確地說，本章關注的是「執行期組裝模型」：components 從哪裡來、directives 從哪裡來、locale control API 從哪裡來、imperative APIs 如何掛到 Vue app instance、default export 又如何把這些能力集中暴露出去。

本章屬於「原始碼閱讀導讀」與「架構分析」筆記，不是單一功能的實作教學。讀完後，讀者應該能理解：

1. `src/index.js` 為什麼是 View UI Plus 的 runtime entry。
2. 它如何把 `src/components/index.js`、`src/directives/*`、`src/locale/index.js`、`dayjs`、`package.json` version 等來源集中起來。
3. 它如何形成 named exports、default API、plugin install、globalProperties、locale APIs 等不同形式的 public surface。
4. 為什麼 `src/index.js` 的責任是「組裝與暴露」，而不是「實作每個 component」。

本章不深入以下內容：

- `install(app, opts)` 的完整執行流程。
- 防重複安裝機制。
- 每個 options 欄位如何影響 `$VIEWUI`。
- `app.component()` 與 `app.directive()` 的實際呼叫順序。
- `Message`、`Notice`、`Modal` 等 service-style API 的內部實作。
- locale pack 如何被打包到 `dist/locale/`。

這些內容應該拆到後續筆記，例如 `04-plugin-system/`、`10-imperative-api/`、`11-directives/`、`14-build-release/` 或 `20-supplements/`。

---

## 2. 學習前先建立的基本觀念

在閱讀 `src/index.js` 之前，應先建立幾個觀念。這些觀念可以幫助你判斷某段程式碼到底是在「定義功能」、「組裝功能」還是「對外暴露功能」。

### 2.1 Runtime Entry

`runtime entry` 可以理解為 package 在執行期被使用時的入口。對一個 Vue component library 來說，使用者可能會寫：

```js
import ViewUIPlus from 'view-ui-plus';
import { Button } from 'view-ui-plus';
```

這些匯入行為最後都會連到 package 設定中的入口檔，而在原始碼層面，`src/index.js` 就扮演 runtime entry 的角色。它不是所有功能的實作來源，而是 package runtime 能力的集中組裝點。

### 2.2 Public Surface

`public surface` 指的是使用者可以直接依賴的 API 外觀。對 View UI Plus 這類套件來說，public surface 可能包含：

- `app.use(ViewUIPlus)`。
- `import { Button } from 'view-ui-plus'`。
- `ViewUIPlus.Button`。
- `ViewUIPlus.locale()`。
- component instance 裡的 `this.$Message`、`this.$Modal`。
- template 中可以直接使用的全域 component。

這些都屬於使用者看得到、會依賴的介面。因此 `src/index.js` 在設計上必須保持清楚的 API shape，否則上層使用方式會變得混亂。

### 2.3 Named Exports 與 Default Export

`named exports` 是具名匯出，例如：

```js
import { Button, Modal } from 'view-ui-plus';
```

`default export` 則是預設匯出，例如：

```js
import ViewUIPlus from 'view-ui-plus';
```

在這份筆記中，`src/index.js` 同時支援這兩種使用方式。它透過 `export * from './components'` 暴露 component named exports，又透過 `export default API` 提供包含 `install`、`version`、`locale`、`i18n`、`lang` 與 components 的 default API。

### 2.4 Vue Plugin 與 `install(app, opts)`

Vue plugin 的核心是 `install(app, options)`。當使用者呼叫：

```js
app.use(ViewUIPlus, options);
```

Vue 會尋找 plugin 物件上的 `install` 方法，然後執行安裝流程。對 View UI Plus 來說，這個流程通常會包含 component registration、directive registration、globalProperties 掛載與 locale setup。

不過本章只關注這些能力如何被集中到 `src/index.js`，不展開 `install(app, opts)` 裡每一步的細節。

### 2.5 `globalProperties`

`app.config.globalProperties` 是 Vue app instance 的全域屬性掛載點。套件可以把一些希望在 component instance 上使用的能力掛上去，例如：

```js
this.$Message.info('Hello');
this.$Modal.confirm({...});
```

這類 API 和 `import { Message } from 'view-ui-plus'` 的使用方式不同。前者是 Vue runtime instance surface，後者是 ES module import surface。理解這個差異，是閱讀 `src/index.js` 的重要前提。

---

## 3. 整體概覽

`src/index.js` 的整體模型可以用一句話理解：**它從多個內部模組收集能力，經過命名、組合、註冊準備與對外匯出，最後形成使用者可以操作的 runtime public surface。**

可整理成以下輸入與輸出關係：

```txt
src/components/index.js
src/directives/style.js
src/directives/resize.js
src/directives/line-clamp.js
src/locale/index.js
dayjs
package.json version
      -> src/index.js
        -> named component exports
        -> install(app, opts)
        -> globalProperties
        -> locale / i18n / lang APIs
        -> default API
```

這張圖的重點不在於每個模組的內部實作，而在於它們都被集中到 `src/index.js` 形成 package-level runtime API。

可以把 `src/index.js` 的工作拆成四個動作：

1. **收集**：從 components、directives、locale、dayjs、package metadata 匯入需要的能力。
2. **整理**：建立 `ViewUI` component map、directives map、locale APIs、version export。
3. **掛載準備**：讓 `install(app, opts)` 可以使用這些 map 完成 component、directive 與 globalProperties 的註冊。
4. **對外暴露**：提供 named exports 與 default API，讓使用者可以用不同方式取用套件能力。

因此，本章的核心心智模型是：`src/index.js` 不是功能的終點，而是功能的「集線器」。它把原本分散在不同目錄的 runtime 能力接到同一個 public surface 上。

---

## 4. 核心內容逐步講解

### 4.1 `src/index.js` 的角色：Runtime 組裝中心

`src/index.js` 是 View UI Plus 的 runtime entry，也是 package runtime 的組裝中心。它本身不負責實作 `Button`、`Form`、`Table`、`Modal`、`Message` 等元件或服務，而是把它們從各自的來源集中起來。

這種設計在 component library 中很常見。因為一個 UI library 通常同時需要支援多種使用方式：

- 整包安裝：`app.use(ViewUIPlus)`。
- 按需匯入：`import { Button } from 'view-ui-plus'`。
- default object 取用：`ViewUIPlus.Button`。
- instance API：`this.$Message`、`this.$Modal`。
- 語系控制：`ViewUIPlus.locale()`、`ViewUIPlus.i18n()`、`ViewUIPlus.lang()`。

這些使用方式背後不能各自散落在不同入口，否則 package 的對外介面會變得不一致。`src/index.js` 的責任就是把它們統整成同一個 runtime surface。

閱讀這個檔案時，應該用「它在組裝什麼 public API」的角度來看，而不是用「它怎麼實作某個元件」的角度來看。

### 4.2 Components 組裝：從 component map 到 public component surface

components 的來源是 `src/components/index.js`。這個檔案集中 export 各個 component，例如 `Button`、`Form`、`Table`、`Modal`、`Message`、`Notice` 等。

`src/index.js` 對 components 主要做兩件事。

第一，它透過以下方式把 component named exports 暴露給 package 使用者：

```js
export * from './components';
```

這代表使用者可以透過 named imports 使用 components：

```js
import { Button, Form, Table } from 'view-ui-plus';
```

第二，它透過以下方式取得完整 component map，供後續組裝與 plugin install 使用：

```js
import * as components from './components';
```

接著，`src/index.js` 會建立 `ViewUI` map：

```js
const ViewUI = {
    ...components,
    iButton: components.Button,
    iCircle: components.Circle,
    iCol: components.Col,
    iContent: components.Content,
    iForm: components.Form,
    iFooter: components.Footer,
    iHeader: components.Header,
    iInput: components.Input,
    iMenu: components.Menu,
    iOption: components.Option,
    iProgress: components.Progress,
    iSelect: components.Select,
    iSwitch: components.Switch,
    iTable: components.Table,
    iTime: components.Time
};
```

這段程式碼的核心意義是：`ViewUI` 不只是原始 components 的集合，也包含帶有 `i` 前綴的相容 alias。這些 alias 通常是為了延續既有使用習慣或相容舊命名而存在。

從架構角度看，`ViewUI` map 是 plugin install 時註冊全域 components 的來源。也就是說，`install()` 不需要逐一手寫每個 component 的來源，而是可以透過這個 map 統一處理。

這裡要注意：`ViewUI` map 描述的是「component public surface 如何被整理」，不是「component 內部如何運作」。若要理解 `Button` 的 props、events、slots 或 render/template，應該回到 `src/components/Button` 或相對應的 component 目錄，而不是停留在 `src/index.js`。

### 4.3 Directives 組裝：把分散的 directive source 統一成 install 可用的 map

directives 的組裝方式和 components 不完全相同。directives 不是從單一 `directives/index.js` 匯入，而是在 `src/index.js` 中手動組成 directives map。

來源包括：

- `src/directives/style.js`：提供 `display`、`width`、`height`、`margin`、`padding`、`font`、`color`、`bg-color` 等 style-related directives。
- `src/directives/resize.js`：提供 `resize` directive。
- `src/directives/line-clamp.js`：提供 `line-clamp` directive。

在 `src/index.js` 中會被整理成：

```js
const directives = {
    display: style.display,
    width: style.width,
    height: style.height,
    margin: style.margin,
    padding: style.padding,
    font: style.font,
    color: style.color,
    'bg-color': style.bgColor,
    resize,
    'line-clamp': lineClamp
};
```

這個 map 的用途是讓 plugin install flow 可以統一註冊 directives。換句話說，`src/index.js` 在這裡做的是「把 directive source 轉成 Vue plugin install 可以消費的資料結構」。

這裡不應過度展開每個 directive 的 Vue lifecycle hook，例如 `mounted`、`updated`、`beforeUnmount` 等，因為那些屬於 directive 實作細節。本文只需要理解：`src/index.js` 負責把 directive 名稱和 directive definition 對應起來，讓 install flow 可以使用。

### 4.4 Locale 組裝：把語系控制提升成 package-level API

locale 的來源是 `src/locale/index.js`。在 `src/index.js` 中，它會被以 `localeFile` 的形式匯入。這個模組提供三類能力：

- `localeFile.use`：切換或設定目前語系。
- `localeFile.i18n`：接入外部 i18n instance。
- locale module 內部的 `t`：供 components 取得文字，但不是從 `src/index.js` 直接 export。

`src/index.js` 對外暴露：

```js
export const locale = localeFile.use;
export const i18n = localeFile.i18n;
```

這代表 locale 不只是 component 內部使用的工具，而是被提升成 package-level runtime control API。使用者可以透過 package API 控制語系設定，而不必直接碰 `src/locale/index.js`。

另外，`src/index.js` 也提供 `lang(code)`。`lang(code)` 會從 `window['viewuiplus/locale'].default` 讀取已載入的語系包，再交給 `localeFile.use()`。

這裡可以看出兩種 locale 使用場景：

1. **直接設定語系**：透過 `locale()` 或 `i18n()` 控制語系或接入外部 i18n。
2. **載入語系包後切換**：透過 `lang(code)` 讀取已載入的 locale package，再切換語系。

此處需要後續補充：若要完全理解 `lang(code)` 的使用方式，應補上實際語系包載入方式、`window['viewuiplus/locale']` 的來源，以及 `dist/locale/` 的打包流程。

### 4.5 GlobalProperties 組裝：把 instance-level APIs 掛到 Vue app

`globalProperties` 是 View UI Plus runtime composition 中很重要的一部分，因為它決定使用者是否能在 component instance 裡呼叫 `$Message`、`$Modal`、`$Notice` 等 API。

View UI Plus 在 `src/index.js` 中把以下能力掛到 `app.config.globalProperties`：

- `$VIEWUI`：全域設定物件，保存 size、transfer、component icon/config、modal、tabs、space、image 等 options。
- `$Spin`、`$Loading`、`$Message`、`$Notice`、`$Modal`、`$ImagePreview`、`$Copy`、`$ScrollIntoView`、`$ScrollTop`：imperative APIs 或 service-style components。
- `$Date`：指向 `dayjs`，提供日期工具。

這裡要特別區分三種不同的 public surface。

第一種是 **module import surface**，例如：

```js
import { Message } from 'view-ui-plus';
```

第二種是 **default object surface**，例如：

```js
ViewUIPlus.Message;
```

第三種是 **Vue instance runtime surface**，例如：

```js
this.$Message;
this.$Modal;
```

`globalProperties` 處理的是第三種。它不是單純的 ES module export，而是把能力掛到 Vue app instance 上，讓元件內部可以透過 `this` 或相對應的 instance context 使用。

從架構角度看，這讓 service-style API 更符合 UI library 的使用體驗。例如訊息提示、彈窗、通知、Loading 等功能，通常不只是一個靜態 component，而是需要在任意業務元件中被命令式呼叫。因此它們適合被掛成 `$Message`、`$Modal` 這類 instance-level API。

此處需要後續補充：`$VIEWUI` 每個 options 欄位如何被設置，也沒有展開 `$Message`、`$Modal` 等服務的內部實作。這些應分別放到 plugin system 與 imperative API 相關筆記。

### 4.6 Version 與輔助 Runtime API：提供 package-level metadata 與控制能力

`src/index.js` 也從 `package.json` 讀取版本：

```js
import pkg from '../package.json';
export const version = pkg.version;
```

`version` 不屬於 component runtime behavior，也不是 directive 或 locale 實作的一部分。它的角色是提供 package-level metadata，讓使用者或除錯工具可以得知目前使用的 View UI Plus 版本。

除了 `version`，同一層還包含 `locale`、`i18n`、`lang` 這類輔助 runtime API。它們共同特徵是：不屬於單一 component，但會影響整個 package 的 runtime 行為或使用體驗。

因此可以把它們視為「package-level APIs」。它們位於 component 之上，服務整個 library，而不是服務某一個 component。

### 4.7 Default API 組裝：把 plugin、metadata、locale 與 components 放到同一個物件

最後，`src/index.js` 會建立 default export：

```js
const API = {
    version,
    locale,
    i18n,
    install,
    lang,
    ...components
};

export default API;
```

這個 `API` 物件是 View UI Plus default import 的核心。使用者寫：

```js
import ViewUIPlus from 'view-ui-plus';
```

拿到的就是這個 default API 對應的物件形狀。

這個物件同時包含幾類能力：

- `install`：讓 `app.use(ViewUIPlus)` 可以成立。
- `version`：提供 package metadata。
- `locale`、`i18n`、`lang`：提供 package-level locale control。
- `...components`：讓 components 也可以從 default object 上取得。

因此 View UI Plus 的 runtime public surface 至少有兩條主要路徑：

1. **Named exports 路徑**：`import { Button } from 'view-ui-plus'`。
2. **Default API 路徑**：`import ViewUIPlus from 'view-ui-plus'` 後使用 `ViewUIPlus.Button`、`ViewUIPlus.locale()` 或 `app.use(ViewUIPlus)`。

`src/index.js` 的設計重點，就是讓這兩條路徑都指向同一批底層能力，避免 package 對外 API 分裂。

### 4.8 組裝模型的邊界：哪些問題不該在本章解決

Runtime composition 的邊界很重要。若邊界不清楚，閱讀 `src/index.js` 時很容易把各種問題混在一起。

本章只回答：

- 哪些能力被匯入 `src/index.js`？
- 這些能力如何被整理成 map 或 API？
- 哪些能力被對外 export？
- 哪些能力會被 install flow 使用？
- 哪些能力會掛到 globalProperties？

本章不回答：

- `install(app, opts)` 裡面每一步如何執行？
- `app.component()` 實際如何註冊每個 component？
- `app.directive()` 實際如何註冊每個 directive？
- `$Message` 內部如何建立 DOM、管理 instance 或處理 queue？
- `Modal` 的 render 與 state 如何運作？
- locale package 如何被 build 到 `dist/locale/`？

這些問題都很重要，但它們不是 runtime composition 的核心，而是後續更細的專題。

---

## 5. 表格整理

### 5.1 輸入與輸出總表

| 類型 | 來源 | 在 `src/index.js` 的角色 | 對外形成的能力 | 閱讀重點 |
| --- | --- | --- | --- | --- |
| Components | `src/components/index.js` | 匯入所有 components，建立 `components` 與 `ViewUI` map | named exports、global registration、default API | 區分 component map 與單一 component 實作 |
| Directives | `src/directives/style.js`、`src/directives/resize.js`、`src/directives/line-clamp.js` | 手動組成 directives map | plugin install 時可註冊的 Vue directives | 看 directive 名稱如何對應到 definition |
| Locale | `src/locale/index.js` | 接入 `use`、`i18n` 與語系切換能力 | `locale`、`i18n`、`lang` package APIs | 區分 package-level locale API 與 component 內部 `t` |
| Global services | `components.Spin`、`Message`、`Modal` 等 | 掛到 `app.config.globalProperties` | `$Spin`、`$Message`、`$Modal` 等 instance APIs | 理解 instance-level API 和 module export 的差異 |
| Date helper | `dayjs` | 作為日期工具掛到 Vue instance | `$Date` | 它是輔助工具，不是 component |
| Version | `package.json` | 讀取 `pkg.version` | `version` export | 它是 package metadata，不是 runtime behavior |

這張表應該搭配 `src/index.js` 原始碼閱讀。讀表時不要只記住來源，而要觀察每個來源最後變成哪一種 public surface。

### 5.2 Public Surface 比較表

| Public Surface | 使用方式 | 來源組裝 | 適合場景 | 注意事項 |
| --- | --- | --- | --- | --- |
| Named exports | `import { Button } from 'view-ui-plus'` | `export * from './components'` | 按需取用單一 component 或 API | 重點是 ES module 匯出，不是 Vue instance 掛載 |
| Default API | `import ViewUIPlus from 'view-ui-plus'` | `export default API` | 整包安裝、讀取 version、使用 package-level APIs | 需要包含 `install` 才能支援 `app.use()` |
| Global components | template 中直接使用 components | `install()` 使用 `ViewUI` map 註冊 | 使用者整包安裝後直接在 template 使用 | 實際註冊流程屬於 plugin system 細節 |
| GlobalProperties | `this.$Message`、`this.$Modal` | `install()` 掛到 `app.config.globalProperties` | 命令式呼叫 message、modal、loading 等 service APIs | 不是 named import，也不是普通 component 使用方式 |
| Locale APIs | `ViewUIPlus.locale()`、`ViewUIPlus.i18n()`、`ViewUIPlus.lang()` | `localeFile.use`、`localeFile.i18n`、`lang(code)` | 控制整個 library 的語系能力 | `lang(code)` 的語系包來源需搭配後續筆記補充 |

這張表的重點是幫助讀者分清楚「同一個 package 能力」可能有不同的對外使用形式。閱讀 `src/index.js` 時，應該判斷每段程式碼是在建立哪一種 surface。

### 5.3 組裝責任表

| 區塊 | 主要責任 | 不應承擔的責任 | 後續應拆到哪裡 |
| --- | --- | --- | --- |
| `components` 匯入與 `ViewUI` map | 組合 component public map 與相容 alias | 不實作 component props、events、slots | `src/components/*` component 專題 |
| `directives` map | 組合 directive 名稱與 directive definition | 不分析 directive lifecycle hook 細節 | `11-directives/` |
| `locale`、`i18n`、`lang` | 暴露 package-level locale control API | 不分析 locale build output | `locale` 專題或 `14-build-release/` |
| `globalProperties` | 掛載 instance-level service APIs 與全域設定 | 不實作 `$Message`、`$Modal` 內部邏輯 | `10-imperative-api/` |
| `version` | 暴露 package metadata | 不決定 runtime 行為 | package metadata / build release 筆記 |
| `API` default export | 組合 plugin、components、metadata、locale API | 不應混入單一元件細節 | package entry / public API 筆記 |

---

## 6. 範例或情境說明

### 6.1 使用者整包安裝 View UI Plus

當使用者寫：

```js
import { createApp } from 'vue';
import ViewUIPlus from 'view-ui-plus';

const app = createApp(App);
app.use(ViewUIPlus);
```

這裡使用的是 `default API`。因為 `src/index.js` 的 default export 中包含 `install`，所以 `app.use(ViewUIPlus)` 才能觸發 Vue plugin 安裝流程。

在 runtime composition 的角度，`src/index.js` 需要先把 components、directives、globalProperties、locale setup 等能力集中起來，讓 `install()` 可以使用。至於 `install()` 內部如何逐項執行，應該放到 `04-plugin-system/` 進一步分析。

### 6.2 使用者按需匯入 component

當使用者寫：

```js
import { Button } from 'view-ui-plus';
```

這裡使用的是 named exports。它對應到 `src/index.js` 中的：

```js
export * from './components';
```

這代表 `Button` 的實作來源仍然在 `src/components/`，但 `src/index.js` 負責把它轉成 package 對外可 import 的 API。

### 6.3 使用者在元件中呼叫 `$Message`

當使用者在 component instance 中呼叫：

```js
this.$Message.info('操作成功');
```

這不是 named export，也不是 default object 上的普通屬性使用方式，而是透過 `app.config.globalProperties` 掛載後形成的 Vue runtime instance API。

因此閱讀 `src/index.js` 時，看到 `$Message`、`$Modal`、`$Notice` 這類名稱，應該立刻想到：這些通常是 service-style 或 imperative APIs，適合透過全域 instance API 使用。

### 6.4 使用者切換語系

當使用者需要控制 View UI Plus 的語系時，可能會使用：

```js
ViewUIPlus.locale(...);
ViewUIPlus.i18n(...);
ViewUIPlus.lang('zh-CN');
```

`locale` 與 `i18n` 來自 `localeFile.use` 與 `localeFile.i18n`，而 `lang(code)` 會讀取 `window['viewuiplus/locale'].default` 中已載入的語系包，再交給 `localeFile.use()`。

此處需要後續補充：不同語系包如何載入、`window['viewuiplus/locale']` 如何產生，以及 `dist/locale/` 的輸出方式，應放到 locale 或 build release 相關筆記。

---

## 7. 閱讀路線或學習路線

### 7.1 初次閱讀路線

第一次閱讀 `src/index.js` 時，建議不要一開始就追進每個 component 或 service 的內部實作。比較好的方式是先建立 package public surface 的輪廓。

1. **先看 import 區塊**：確認 `src/index.js` 從哪些地方收集能力，例如 `src/components/index.js`、directives、locale、dayjs、`package.json`。
2. **再看 `export * from './components'`**：理解 named exports 的來源。
3. **接著看 `ViewUI` map**：理解 components 和 `i` 前綴 alias 如何被組成全域註冊來源。
4. **再看 directives map**：理解 directive 名稱與來源檔案如何對應。
5. **接著看 locale APIs**：理解 `locale`、`i18n`、`lang` 為什麼是 package-level APIs。
6. **再看 globalProperties 掛載區塊**：理解 `$VIEWUI`、`$Message`、`$Modal`、`$Date` 等 instance APIs 的來源。
7. **最後看 default API**：確認 `version`、`install`、`locale`、`i18n`、`lang` 與 components 如何被放進 default export。

這條路線的目標是先理解「入口檔組裝了什麼」，而不是急著理解「每個功能怎麼實作」。

### 7.2 深入閱讀路線

建立 `src/index.js` 的組裝模型後，可以再往下追幾條線。

1. **追 component 線**：從 `src/components/index.js` 進入某個代表性 component，例如 `Button`、`Form`、`Table` 或 `Modal`，看 component source 如何被 export。
2. **追 plugin 線**：進入 `install(app, opts)`，看它如何使用 `ViewUI` map、directives map 與 globalProperties。
3. **追 directive 線**：進入 `src/directives/style.js`、`resize.js`、`line-clamp.js`，看每個 directive 的 lifecycle hook 與實際 DOM 行為。
4. **追 locale 線**：進入 `src/locale/index.js`，看 `use`、`i18n`、`t` 如何協作。
5. **追 service API 線**：進入 `Message`、`Notice`、`Modal`、`Spin`、`Loading`，理解 imperative API 如何產生 UI。
6. **追 build/release 線**：查看 `package.json`、`vite.config.js`、`build/` 與 `dist/`，理解 `src/index.js` 如何被打包成可發布產物。

### 7.3 可以暫時跳過的部分

如果目前目標只是理解 runtime composition，可以暫時跳過：

- 每個 component 的 props、events、slots 細節。
- 每個 directive 的 DOM 操作細節。
- `$Message`、`$Modal` 的 queue、render、instance 管理細節。
- locale pack 的 build 設定。
- CSS / Less 的樣式編譯流程。

這些內容不是不重要，而是應該在理解入口組裝模型後，再分章深入。

---

## 8. 常見誤區

| 誤區 | 為什麼容易誤解 | 正確理解 |
| --- | --- | --- |
| 把 `src/index.js` 當成 component 實作檔 | 裡面出現大量 component 名稱，容易以為它在實作 component | `src/index.js` 主要負責匯入、組裝、註冊準備與對外暴露；component 實作應回到 `src/components/*` |
| 以為 named exports 和 default API 是同一件事 | 兩者都能拿到 components，表面上看起來相似 | named exports 是 ES module 的具名匯出；default API 是一個包含 `install`、`version`、locale APIs 與 components 的物件 |
| 把 `globalProperties` 當成普通 export | `$Message`、`$Modal` 等名稱看起來像可以 import 的 API | `globalProperties` 是 Vue app runtime instance surface，讓 component instance 可以透過 `this.$Message` 等方式使用 |
| 以為 directives 一定會有 `directives/index.js` | 很多專案會集中從 index 匯出，所以容易套用既有印象 | 在 `src/index.js` 內手動組成 directives map，應以實際原始碼為準 |
| 以為 `localeFile.use` 和 component 內部 `t` 是同一層 | 它們都和語系有關，容易混在一起 | `localeFile.use` 被暴露成 package-level API；`t` 主要供 components 取得文字，並非從 `src/index.js` 直接 export |
| 以為 `version` 會影響 runtime 行為 | `version` 出現在 runtime entry 中，容易被誤認為功能設定 | `version` 是 package metadata，主要用來暴露目前套件版本 |
| 直接從 `src/index.js` 追進所有實作細節 | 入口檔連到很多模組，容易越追越散 | 第一次閱讀應先建立組裝模型，再分別拆到 plugin、component、directive、locale、service API 專題 |
| 把 runtime composition 和 install flow 混在一起 | 兩者都發生在 package runtime entry 附近 | runtime composition 關心能力如何被集中與暴露；install flow 關心 `app.use()` 後每一步如何執行 |

---

## 9. 本章總結

`src/index.js` 是 View UI Plus 的 runtime entry，也是整個 package runtime public surface 的組裝中心。它的核心責任不是實作單一 component，而是把分散在 `src/components/index.js`、`src/directives/*`、`src/locale/index.js`、`dayjs` 與 `package.json` 中的能力集中起來，整理成使用者可以依賴的 API 形狀。

從 components 的角度看，`src/index.js` 透過 `export * from './components'` 支援 named exports，同時透過 `import * as components` 取得完整 component map，再建立 `ViewUI` map 與相容 alias，供 plugin install 使用。

從 directives 的角度看，`src/index.js` 手動組成 directives map，將 style-related directives、`resize` 與 `line-clamp` 集中成 install flow 可消費的資料結構。

從 locale 的角度看，`src/index.js` 把 `localeFile.use` 與 `localeFile.i18n` 暴露成 package-level API，並提供 `lang(code)` 這類語系切換入口。這代表 locale 不只是 component 內部支撐能力，也是一部分 public runtime API。

從 globalProperties 的角度看，`src/index.js` 把 `$VIEWUI`、`$Message`、`$Modal`、`$Notice`、`$Spin`、`$Date` 等能力掛到 Vue app instance 上，形成和 named exports 不同的 instance-level runtime surface。

最後，`src/index.js` 透過 default API 把 `version`、`locale`、`i18n`、`install`、`lang` 與 components 放在同一個 object 上，使 `app.use(ViewUIPlus)`、`ViewUIPlus.version`、`ViewUIPlus.locale()`、`ViewUIPlus.Button` 等使用方式都能成立。

因此，閱讀本章時應建立的心智模型是：`src/index.js` 是 View UI Plus runtime API 的「組裝與分發中心」。它把內部能力接到 package 對外介面上，但每個能力的內部實作，仍應回到各自專題繼續拆解。

---

## 10. 自我檢查問題

1. 為什麼說 `src/index.js` 是 runtime entry，而不是單一 component 的實作檔？
2. `export * from './components'` 和 `import * as components from './components'` 在角色上有什麼不同？
3. `ViewUI` map 除了展開 `...components` 之外，為什麼還要加入 `iButton`、`iForm`、`iInput` 等 alias？
4. directives map 的來源有哪些？它在 plugin install 中大概會被用來做什麼？
5. `locale`、`i18n`、`lang` 三者在 package-level API 中分別扮演什麼角色？
6. 為什麼 `$Message`、`$Modal`、`$Notice` 這類 API 適合掛到 `app.config.globalProperties`？
7. named exports、default API、globalProperties 這三種 public surface 有什麼差異？
8. `version` 為什麼可以放在 runtime entry 中？它是否代表 component runtime behavior？
9. 本章為什麼不深入分析 `install(app, opts)` 的完整流程？這部分應該拆到哪一類筆記？
10. 如果你要繼續深入 `$Message` 的內部實作，應該從 `src/index.js` 追到哪一類模組或後續筆記？

---

## 11. 後續延伸方向

這份筆記可以延伸成以下主題：

1. **Plugin System：`install(app, opts)` 完整流程**  
   拆解 `app.use(ViewUIPlus, options)` 進入後，如何註冊 components、directives、globalProperties，以及如何設定 `$VIEWUI`。

2. **Component Export Map：`src/components/index.js` 閱讀筆記**  
   分析所有 components 如何被集中 export，哪些是普通 component，哪些是 service-style component。

3. **Directive System：`style`、`resize`、`line-clamp` 指令分析**  
   深入每個 directive 的用途、Vue lifecycle hook、DOM 操作方式與使用場景。

4. **Locale System：`src/locale/index.js` 與語系切換流程**  
   分析 `use`、`i18n`、`t`、`lang(code)`、語系包載入與 build output 的關係。

5. **Imperative API：`Message`、`Notice`、`Modal`、`Spin`、`Loading`**  
   分析這些 service-style APIs 如何從 component 或 module 轉成可以命令式呼叫的 UI 能力。

6. **Global Config：`$VIEWUI` Options 設計**  
   拆解 size、transfer、modal、tabs、space、image 等全域設定如何影響 components。

7. **Package Public API 設計**  
   比較 named exports、default export、globalProperties、types declaration 與 package entry 欄位如何共同構成 library 對外契約。

8. **Build Release：`src/index.js` 如何輸出到 `dist/`**  
   分析 `vite build`、library mode、UMD / ESM output、CSS 與 locale artifacts 的關係。
