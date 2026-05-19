# Runtime Composition（執行期組裝模型）

這篇說明 `src/index.js` 如何把 View UI Plus 的 runtime 能力組裝成對外可使用的 public surface。重點是「組裝模型」：components、directives、locale、globalProperties、default API 各自從哪裡來，又如何被集中到 package runtime entry。

這篇不深入拆解 `install(app, opts)` 的逐步流程，例如防重複安裝、每個 options 欄位的細節、實際 `app.component()` 與 `app.directive()` 的執行順序。那些細節應放到 `04-plugin-system/`。

## 1. `src/index.js` 的角色

`src/index.js` 是 View UI Plus 的 runtime entry，也是 package runtime 的組裝中心。它本身不是單一 component 實作，而是把多個內部模組整理成使用者能接觸到的 API shape。

它的輸入與輸出可以看成：

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

所以 `src/index.js` 的架構責任是：把 component library 內部的能力整理成 Vue app 可以安裝、可以全域使用、可以 named import、也可以透過 default export 存取的 runtime public surface。

## 2. 輸入與輸出概覽

| 類型 | 來源 | 在 `src/index.js` 的用途 | 對外形成的能力 |
| --- | --- | --- | --- |
| Components | `src/components/index.js` | 匯入所有 components，建立 `ViewUI` map | named exports、global registration、default API |
| Directives | `style`、`resize`、`line-clamp` | 組成 directives map | plugin install 時的 Vue directives |
| Locale | `src/locale/index.js` | 接入 `use`、`i18n`、語系切換能力 | `locale`、`i18n`、`lang` APIs |
| Global services | `components.Spin`、`Message`、`Modal` 等 | 掛到 `app.config.globalProperties` | `$Spin`、`$Message`、`$Modal` 等 instance APIs |
| Date helper | `dayjs` | 作為日期工具掛到 Vue instance | `$Date` |
| Version | `package.json` | 讀取 `pkg.version` | `version` export |

這張表可以幫助理解：`src/index.js` 不創造大部分能力，而是把能力集中、命名、註冊、再暴露出去。

## 3. Components 組裝

components 的來源是 `src/components/index.js`。這個檔案集中 export 各個 component，例如 `Button`、`Form`、`Table`、`Modal`、`Message`、`Notice` 等。

`src/index.js` 對 components 做兩件事：

1. 透過 `export * from './components'` 把 component named exports 直接暴露給 package 使用者。
2. 透過 `import * as components from './components'` 取得完整 component map，供後續組裝使用。

接著它建立 `ViewUI`：

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

這裡的重點不是單一 component 如何實作，而是 component public surface 被整理成兩種形態：原始 component 名稱，以及帶 `i` 前綴的相容 alias。`install()` 會以 `ViewUI` 作為全域 component registration 的來源。

## 4. Directives 組裝

directives 不是從單一 `directives/index.js` 匯入，而是在 `src/index.js` 內手動組成 directives map。

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

這個 map 是 plugin install 時註冊 directives 的來源。本文只說它是如何被組裝出來；至於如何逐項呼叫 `app.directive()`，屬於 install flow 細節。

## 5. Locale 組裝

locale 的來源是 `src/locale/index.js`，在 `src/index.js` 中以 `localeFile` 匯入。這個模組提供三類能力：

- `localeFile.use`：切換或設定目前語系。
- `localeFile.i18n`：接入外部 i18n instance。
- locale module 內部的 `t`：供 components 取得文字，但不是從 `src/index.js` 直接 export。

`src/index.js` 對外暴露：

```js
export const locale = localeFile.use;
export const i18n = localeFile.i18n;
```

另外也提供 `lang(code)`，它從 `window['viewuiplus/locale'].default` 讀取已載入的語系包，再交給 `localeFile.use()`。這代表 runtime entry 不只提供 install 時的 locale setup，也提供使用者可直接呼叫的 locale control APIs。

## 6. GlobalProperties 組裝

`globalProperties` 是 Vue app instance 上的全域能力掛載點。View UI Plus 在 `src/index.js` 中把兩類東西掛到 `app.config.globalProperties`：

- `$VIEWUI`：全域設定物件，保存 size、transfer、component icon/config、modal、tabs、space、image 等 options。
- `$Spin`、`$Loading`、`$Message`、`$Notice`、`$Modal`、`$ImagePreview`、`$Copy`、`$ScrollIntoView`、`$ScrollTop`：imperative APIs 或 service-style components。
- `$Date`：指向 `dayjs`，提供日期工具。

從組裝模型看，`globalProperties` 是把「需要在 component instance 上被呼叫的能力」集中掛載起來。這和 named exports 不同：named exports 是 module import surface，`globalProperties` 則是 Vue app runtime surface。

## 7. Version 與輔助 Runtime API

`src/index.js` 從 `package.json` 讀取版本：

```js
import pkg from '../package.json';
export const version = pkg.version;
```

這讓 package runtime 可以直接對外提供目前版本。它不是 component 能力，也不是 plugin install 的必要步驟，而是 default API 和 named export 都可以使用的 package metadata。

同一層還包含 `locale`、`i18n`、`lang` 這類輔助 API。這些 API 不屬於單一 component，而是 package-level runtime control。

## 8. Default API 組裝

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

這個 `API` 物件把 package-level APIs 和所有 components 放在同一個 default export 上。對使用者而言，它支援：

- `app.use(ViewUIPlus)`：因為 default API 帶有 `install`。
- `ViewUIPlus.version`：讀取版本。
- `ViewUIPlus.locale()`、`ViewUIPlus.i18n()`、`ViewUIPlus.lang()`：操作語系能力。
- `ViewUIPlus.Button`、`ViewUIPlus.Modal` 等：從 default object 取得 components。

因此 View UI Plus 的 runtime public surface 有兩條並行路徑：named exports 和 default API。`src/index.js` 的工作就是讓這兩條路徑都能指向同一批底層能力。

## 9. 組裝模型的邊界

這篇只描述 `src/index.js` 如何把能力拼起來，不深入以下主題：

- `install(app, opts)` 的完整流程與執行順序。
- options 每個欄位如何影響 `$VIEWUI`。
- components 被全域註冊後如何在 template 中解析。
- directives 的 Vue lifecycle hook 細節。
- locale pack 如何被 build 成 `dist/locale/`。
- `Message`、`Notice`、`Modal` 等 imperative APIs 的內部實作。

這些主題應拆到更具體的後續筆記，例如 `04-plugin-system/`、`10-imperative-api/`、`11-directives/`、`20-supplements/` 或 `14-build-release/`。

## 10. 和其他 Architecture Notes 的分工

- `03-architecture/01-overview.md`：說明 View UI Plus 作為 Vue 3 UI library 的整體 runtime overview。
- `03-architecture/03-layer-model.md`：說明使用者層、入口安裝層、組件層、共用能力層等 layer responsibility。
- 本篇：聚焦 `src/index.js` 的 runtime composition，說明它如何組裝 components、directives、locale、globalProperties 和 default API。
- `04-plugin-system/`：保留給 install flow 的細節說明，例如 `app.use()` 進入後如何逐步註冊與掛載。

