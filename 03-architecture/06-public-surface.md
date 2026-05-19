# Public Surface：Library 對外暴露形狀

這篇整理 View UI Plus 作為 component library 對外暴露的幾種 API 形狀。它關注的是「使用者如何接觸 library」，不是單一 component 的內部行為。

主要 public surface 可以分成六類：

1. plugin install：`app.use(ViewUIPlus, options)`
2. named exports：`import { Button, Modal } from 'view-ui-plus'`
3. global components：安裝 plugin 後可在 template 中直接使用 component name
4. globalProperties：`this.$Message`、`this.$Modal`、`this.$VIEWUI` 等 instance-level API
5. locale APIs：`locale`、`i18n`、`lang` 與 install options
6. types：`types/index.d.ts` 暴露的 TypeScript contract

## 1. Public Surface 總覽

```txt
npm package user
  -> import ViewUIPlus from 'view-ui-plus'
      -> default API
      -> install(app, opts)

  -> import { Button, Modal, Message } from 'view-ui-plus'
      -> named component exports

  -> app.use(ViewUIPlus, opts)
      -> app.component(...)
      -> app.directive(...)
      -> app.config.globalProperties
      -> locale setup

  -> TypeScript / IDE
      -> types/index.d.ts
      -> types/viewuiplus.components.d.ts
```

`src/index.js` 是 runtime public surface 的主要集中點；`types/index.d.ts` 則是 TypeScript 使用者看到的 public type surface。兩者互相對應，但不是完全等價。

## 2. Plugin Install

plugin install 是最典型的整包使用方式：

```js
import { createApp } from 'vue';
import ViewUIPlus from 'view-ui-plus';

const app = createApp(App);
app.use(ViewUIPlus, {
    size: 'default',
    locale,
    i18n
});
```

在 `src/index.js` 中，`install(app, opts)` 主要做四件事：

| install 行為 | 對外效果 |
| --- | --- |
| 套用 `opts.locale` / `opts.i18n` | 讓整個 library 使用指定語系或 i18n adapter。 |
| `Object.keys(ViewUI).forEach(app.component)` | 把所有 components 與別名註冊成 global components。 |
| `Object.keys(directives).forEach(app.directive)` | 把內建 directives 註冊到 Vue app。 |
| 寫入 `app.config.globalProperties` | 提供 `$VIEWUI`、imperative APIs 與 `$Date`。 |

這個 surface 的特點是「一次安裝、全域可用」。它適合完整引入 library 的使用者，但也代表它會同時打開 global components、global directives、globalProperties 與 locale setup。

## 3. Named Exports

named exports 是按需取得 component 或 service-style API 的方式。`src/index.js` 透過下面這行把 `src/components/index.js` 的 exports 轉成 package-level exports：

```js
export * from './components';
```

使用者可以這樣取得單一項目：

```js
import { Button, Table, Modal, Message } from 'view-ui-plus';
```

這層 surface 的來源是 `src/components/index.js`：

```txt
src/components/index.js
  -> export { default as Button } from './button'
  -> export { default as Table } from './table'
  -> export { default as Modal } from './modal'
  -> export { default as Message } from './message'
  -> ...
```

named exports 和 plugin install 的差異在於：

| 使用方式 | 主要目的 |
| --- | --- |
| `app.use(ViewUIPlus)` | 讓整套 library 進入 Vue app。 |
| `import { Button } from 'view-ui-plus'` | 直接取得某個 component 或 API 物件。 |

因此，named exports 是 module import surface；plugin install 是 Vue app runtime surface。

## 4. Global Components

plugin install 會把 `ViewUI` map 裡的每一個 key 註冊成 global component：

```js
Object.keys(ViewUI).forEach(key => {
    app.component(key, ViewUI[key]);
});
```

`ViewUI` map 由兩部分組成：

```txt
ViewUI
  -> ...components
  -> iButton / iCircle / iCol / iContent / iForm
  -> iFooter / iHeader / iInput / iMenu / iOption
  -> iProgress / iSelect / iSwitch / iTable / iTime
```

這代表安裝後有兩種 global component name 來源：

| 來源 | 範例 | 用途 |
| --- | --- | --- |
| component 原名 | `Button`、`Table`、`Modal` | 由 `src/components/index.js` 匯出的主要名稱。 |
| `i` 前綴別名 | `iButton`、`iTable`、`iSelect` | 相容或避免名稱衝突的別名。 |

global components 是 template-level surface。使用者不需要在每個 SFC 中手動 import component，只要 Vue app 已經安裝 plugin，就可以直接在 template 使用已註冊名稱。

## 5. GlobalProperties

`globalProperties` 是 Vue instance-level surface。它讓 component instance 可以透過 `this.$...` 存取全域設定與 imperative APIs。

`src/index.js` 暴露的主要項目如下：

| global property | 來源 | 角色 |
| --- | --- | --- |
| `$VIEWUI` | install options | 全域設定容器，例如 size、transfer、cell/menu/modal/tabs/select 等設定。 |
| `$Spin` | `components.Spin` | imperative loading/spin API。 |
| `$Loading` | `components.LoadingBar` | loading bar API。 |
| `$Message` | `components.Message` | message API。 |
| `$Notice` | `components.Notice` | notice API。 |
| `$Modal` | `components.Modal` | modal / confirm API。 |
| `$ImagePreview` | `components.ImagePreview` | image preview API。 |
| `$Copy` | `components.Copy` | copy API。 |
| `$ScrollIntoView` | `components.ScrollIntoView` | scroll into view API。 |
| `$ScrollTop` | `components.ScrollTop` | scroll top API。 |
| `$Date` | `dayjs` | date helper。 |

這一層 surface 不等同於 named exports。named exports 是 module 層面的匯入；`globalProperties` 是 Vue app 安裝後注入到 component instance 的 runtime 能力。

## 6. Locale APIs

locale 對外有三種入口：

```js
export const locale = localeFile.use;
export const i18n = localeFile.i18n;
export const lang = (code) => {
    const langObject = window['viewuiplus/locale'].default;
    if (code === langObject.i.locale) localeFile.use(langObject);
    else console.log(`The ${code} language pack is not loaded.`);
};
```

| API | 用途 |
| --- | --- |
| `locale` | 直接切換或套用 locale object。 |
| `i18n` | 接入外部 i18n function / adapter。 |
| `lang(code)` | 從已載入到 `window['viewuiplus/locale']` 的語系包切換語系。 |
| `install(app, { locale, i18n })` | 在 plugin install 階段套用語系設定。 |

locale APIs 的特殊點是它同時存在於兩個層面：

- package-level API：使用者可從 package API 上呼叫 `locale`、`i18n`、`lang`。
- install option：使用者可在 `app.use(ViewUIPlus, opts)` 時一次設定。

`lang(code)` 依賴語系包已經載入到 `window['viewuiplus/locale']`。這和 `build:lang` 產出的 `dist/locale/*` 有關，因此它是 runtime API，也是 build artifact 的使用入口。

## 7. Types

TypeScript surface 由 `package.json` 的 `typings` 指向：

```json
{
  "typings": "types/index.d.ts"
}
```

`types/index.d.ts` 主要暴露三類 contract：

| Type surface | 來源 | 角色 |
| --- | --- | --- |
| component declarations | `export * from './viewuiplus.components'` | 讓 named exports 有對應 component 型別。 |
| install declaration | `export const install: (app: App, options?: ViewUIPlusInstallOptions) => void` | 描述 Vue plugin install signature。 |
| Vue module augmentation | `declare module '@vue/runtime-core'` | 補上 `$VIEWUI`、`$Message`、`$Modal`、`$Date` 等 instance properties。 |

`types/viewuiplus.components.d.ts` 對應 component named exports，例如：

```txt
types/viewuiplus.components.d.ts
  -> export { Button, ButtonGroup } from './button'
  -> export { Modal, ModalInstance } from './modal'
  -> export { Message, MessageConfig } from './message'
  -> export { Table, TableColumnConfig } from './table'
  -> ...
```

需要注意的是，runtime surface 和 type surface 目前不是完全一對一：

| Runtime surface | Type surface 現況 |
| --- | --- |
| component named exports | 由 `types/viewuiplus.components.d.ts` 覆蓋。 |
| `install(app, opts)` | 由 `types/index.d.ts` 覆蓋。 |
| `globalProperties` | 由 `declare module '@vue/runtime-core'` 覆蓋。 |
| `locale`、`i18n`、`lang` | runtime 有 export，但 `types/index.d.ts` 目前未明確宣告。 |
| `version`、default API object | runtime 有 export，但 `types/index.d.ts` 目前未完整描述 default API shape。 |

這代表閱讀 public surface 時不能只看 types，也不能只看 runtime。要理解使用者真正能呼叫什麼，看 `src/index.js`；要理解 TypeScript 能提示什麼，看 `types/index.d.ts` 與 `types/viewuiplus.components.d.ts`。

## 8. Public Surface 分層心智模型

```txt
package import surface
  -> default API
  -> named exports

Vue app install surface
  -> app.use(ViewUIPlus, opts)
  -> global components
  -> global directives
  -> globalProperties
  -> locale setup

TypeScript surface
  -> component declarations
  -> install options
  -> ComponentCustomProperties augmentation
```

這三層服務的對象不同：

| Surface | 使用者接觸點 | 責任 |
| --- | --- | --- |
| package import surface | `import ... from 'view-ui-plus'` | 決定 package 可被 import 的符號。 |
| Vue app install surface | `app.use(ViewUIPlus, opts)` | 決定安裝後 Vue app 多了哪些全域能力。 |
| TypeScript surface | IDE / type checker | 決定使用者能得到哪些型別提示與檢查。 |

如果修改 public API，需要同時檢查這三層是否一致：

1. runtime 是否從 `src/index.js` 正確暴露。
2. plugin install 是否需要註冊到 app。
3. `types/` 是否需要補 declaration 或 module augmentation。

## 9. 與其他 Architecture Notes 的關係

- `03-architecture/04-runtime-composition.md`：更細地說明 `src/index.js` 如何組成 runtime。
- `03-architecture/05-module-dependency-map.md`：說明 public surface 背後的主要依賴方向。
- 本篇：從使用者視角整理 library 對外暴露的 API 形狀，包含 plugin install、named exports、global components、globalProperties、locale APIs 與 types。
