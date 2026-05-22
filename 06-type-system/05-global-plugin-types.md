# Global Plugin Types：`install`、`$VIEWUI` 與 `ComponentCustomProperties`

## 1. 本章定位

本章聚焦 plugin 層級的型別。

View UI Plus 不只提供 components。使用者執行：

```ts
app.use(ViewUIPlus, options);
```

後，plugin 會註冊全域 components、directives，並掛載 `$VIEWUI`、`$Message`、`$Modal` 等 instance properties。這些都需要 TypeScript declaration 才能被 IDE 與編譯器辨識。

本章的核心檔案是：

```txt
src/index.js
types/index.d.ts
```

---

## 2. `types/index.d.ts` 的主要內容

`types/index.d.ts` 大致包含：

```ts
import type { App } from 'vue';
export * from './viewuiplus.components';

interface ViewUIPlusGlobalOptions { ... }

interface ViewUIPlusInstallOptions extends ViewUIPlusGlobalOptions {
    locale?: any;
    i18n?: any;
}

declare module '@vue/runtime-core' {
    interface ComponentCustomProperties {
        $VIEWUI: ViewUIPlusGlobalOptions;
        $Spin: any;
        $Loading: any;
        $Message: any;
        $Notice: any;
        $Modal: any;
        $ImagePreview: any;
        $Copy: any;
        $ScrollIntoView: any;
        $ScrollTop: any;
        $Date: any;
    }
}

export const install: (app: App, options?: ViewUIPlusInstallOptions) => void;
```

這份檔案負責三件事：

| 區塊 | 責任 |
| --- | --- |
| `export * from './viewuiplus.components'` | 將 component named exports 的型別接到 package entry |
| `ViewUIPlusGlobalOptions` / `ViewUIPlusInstallOptions` | 描述 plugin options 與 `$VIEWUI` |
| `ComponentCustomProperties` | 讓 `this.$Message`、`this.$Modal` 等 instance properties 被 TypeScript 承認 |

---

## 3. Runtime Install 對照

`src/index.js` 中的 install 會做：

```js
export const install = function(app, opts = {}) {
    if (opts.locale) localeFile.use(opts.locale);
    if (opts.i18n) localeFile.i18n(opts.i18n);

    Object.keys(ViewUI).forEach(key => {
        app.component(key, ViewUI[key]);
    });

    Object.keys(directives).forEach(key => {
        app.directive(key, directives[key]);
    });

    app.config.globalProperties.$VIEWUI = { ... };
    app.config.globalProperties.$Message = components.Message;
    app.config.globalProperties.$Modal = components.Modal;
    app.config.globalProperties.$Date = dayjs;
};
```

TypeScript 對應：

```ts
export const install: (app: App, options?: ViewUIPlusInstallOptions) => void;
```

這裡的 signature 表示：

1. 第一個參數是 Vue `App`。
2. 第二個參數是可選的 install options。
3. install 不回傳值。

---

## 4. `ViewUIPlusGlobalOptions`

`ViewUIPlusGlobalOptions` 描述 `$VIEWUI` 與 install options 中可設定的全域行為，例如：

```ts
interface ViewUIPlusGlobalOptions {
    size?: string;
    transfer?: boolean | string;
    select?: {
        arrow: string;
        customArrow: string;
        arrowSize: number | string;
    };
    modal?: {
        maskClosable: boolean | string;
    };
    typography?: {
        copyConfig: object;
        editConfig: object;
        ellipsisConfig: object;
    };
}
```

runtime install 會把 options 整理到：

```js
app.config.globalProperties.$VIEWUI = {
    size: opts.size || '',
    capture: 'capture' in opts ? opts.capture : true,
    transfer: 'transfer' in opts ? opts.transfer : '',
    // ...
}
```

這裡有一個值得注意的 gap：runtime `$VIEWUI` 裡有 `capture`，但目前 `ViewUIPlusGlobalOptions` 片段中沒有看到 `capture`。這類不一致就是 plugin type contract 的檢查重點。

---

## 5. Install Options 與 Runtime Fallback

`ViewUIPlusInstallOptions` 繼承 global options，並加入：

```ts
interface ViewUIPlusInstallOptions extends ViewUIPlusGlobalOptions {
    locale?: any;
    i18n?: any;
}
```

runtime 則會特別讀：

```js
if (opts.locale) localeFile.use(opts.locale);
if (opts.i18n) localeFile.i18n(opts.i18n);
```

這表示 `locale` 與 `i18n` 是 install 階段專用能力，而不是 `$VIEWUI` 中給各 component 讀取的 display config。

要區分：

| 類型 | 範例 | 用途 |
| --- | --- | --- |
| install-only option | `locale`、`i18n` | 安裝時設定語系或翻譯 adapter |
| global display option | `size`、`transfer`、`modal.maskClosable` | 存入 `$VIEWUI` 給 component 使用 |
| runtime fallback | `opts.size || ''`、`capture` default `true` | 沒傳 option 時的實際值 |

TypeScript interface 描述「可傳入什麼」，runtime fallback 描述「沒傳時怎麼補」。

---

## 6. `ComponentCustomProperties`

Vue 3 中，若 plugin 把屬性掛到：

```js
app.config.globalProperties.$Message = components.Message;
```

TypeScript 不會自動知道 `this.$Message` 存在。必須透過 module augmentation：

```ts
declare module '@vue/runtime-core' {
    interface ComponentCustomProperties {
        $Message: any;
    }
}
```

View UI Plus 在 `types/index.d.ts` 中補了多個 `$...`：

| Property | Runtime 來源 | Type 現況 |
| --- | --- | --- |
| `$VIEWUI` | install 整理出的全域設定 | `ViewUIPlusGlobalOptions` |
| `$Spin` | `components.Spin` | `any` |
| `$Loading` | `components.LoadingBar` | `any` |
| `$Message` | `components.Message` | `any` |
| `$Notice` | `components.Notice` | `any` |
| `$Modal` | `components.Modal` | `any` |
| `$ImagePreview` | `components.ImagePreview` | `any` |
| `$Date` | `dayjs` | `any` |

這表示 TypeScript 知道 property 存在，但多數不知道 method-level contract。

---

## 7. `any` 是弱契約

例如：

```ts
$Message: any;
```

這可以讓以下程式不被 TypeScript 擋住：

```ts
this.$Message.success('Saved');
```

但也可能讓錯誤通過：

```ts
this.$Message.notExistMethod('Saved');
```

因為 `$Message` 是 `any`，TypeScript 不會檢查 method 是否存在。

更精準的設計可以是：

```ts
interface MessageApi {
  info(options: string | MessageOptions): () => void;
  success(options: string | MessageOptions): () => void;
  warning(options: string | MessageOptions): () => void;
  error(options: string | MessageOptions): () => void;
  loading(options: string | MessageOptions): () => void;
  config(options: MessageConfig): void;
  destroy(): void;
}
```

這屬於改良方向，不是目前 v1.3.20 的主要 declaration 風格。

---

## 8. Named Export Gap

`src/index.js` runtime 也 export：

```js
export const version = pkg.version;
export const locale = localeFile.use;
export const i18n = localeFile.i18n;
export const lang = (code) => { ... };
export default API;
```

但 `types/index.d.ts` 主要宣告 `install` 與 component exports。從這個檔案本身觀察，`version`、`locale`、`i18n`、`lang`、default API object 的完整型別並沒有被明確描述。

這代表閱讀 plugin type contract 時，要標記：

| Runtime export | Type coverage |
| --- | --- |
| `install` | 有 |
| component exports | 透過 `viewuiplus.components` |
| `$...` instance properties | 透過 module augmentation |
| `version` | 從 `types/index.d.ts` 單檔看未明確宣告 |
| `locale` / `i18n` / `lang` | 從 `types/index.d.ts` 單檔看未明確宣告 |
| default API object | 完整 shape 未明確宣告 |

---

## 9. 維護檢查規則

plugin 層級 API 每次改動時，至少檢查：

1. `src/index.js` 是否新增 runtime export。
2. `types/index.d.ts` 是否新增對應 named export declaration。
3. install option 是否需要加入 `ViewUIPlusInstallOptions`。
4. 若寫入 `$VIEWUI`，是否需要加入 `ViewUIPlusGlobalOptions`。
5. 若寫入 `app.config.globalProperties.$Xxx`，是否需要擴充 `ComponentCustomProperties`。
6. 若 `$Xxx` 是 service object，是否應避免只用 `any`。

---

## 10. 本章結論

`types/index.d.ts` 是 View UI Plus plugin 型別系統的核心入口。它把 component declarations 接到 package entry，描述 install options，並用 `ComponentCustomProperties` 讓 `$VIEWUI`、`$Message`、`$Modal` 等 global instance properties 在 TypeScript 中合法。

目前這份型別有基本覆蓋，但也有明顯弱契約：多數 `$...` service 是 `any`，`locale`、`i18n`、`lang`、`version` 與 default API object 的完整 type surface 從單檔看不夠明確。這些都是後續型別改良與維護時的檢查點。

---

## 11. 自我檢查問題

1. `ViewUIPlusGlobalOptions` 和 `ViewUIPlusInstallOptions` 有什麼差別？
2. 為什麼 `this.$Message` 需要 `ComponentCustomProperties`？
3. `$Message: any` 解決了什麼問題？又留下什麼問題？
4. runtime `$VIEWUI.capture` 和 type options 不一致時，代表什麼維護風險？
5. 新增一個 `app.config.globalProperties.$Dialog` 時，要同步修改哪裡？

