# Global Plugin Types：`install`、`$VIEWUI` 與 `ComponentCustomProperties`

## 1. 本章定位

本章是 `06-type-system/` 中的 plugin 層級型別筆記，主題是 View UI Plus 如何把 runtime plugin 行為轉成 TypeScript 可以理解的 declaration contract。

前面幾章已經從單一元件角度討論 props、emits、`v-model`、template ref 與 instance methods。本章要把視角拉高到 package / plugin 層級。也就是說，本章不只關心某一個 component 的 `DefineComponent<{ ... }>`，而是關心使用者執行：

```ts
app.use(ViewUIPlus, options);
```

之後，整個 Vue app 多出哪些可用能力，以及 TypeScript 是否知道這些能力存在。

本章主要解決四個問題。

第一，`types/index.d.ts` 在 View UI Plus 型別系統中扮演什麼角色。它不是單一元件的 declaration，而是 package type entry，負責把 component exports、plugin install signature、global instance properties 串起來。

第二，`src/index.js` 的 runtime `install` 做了哪些事。它不只註冊元件，也會註冊 directives，並把 `$VIEWUI`、`$Message`、`$Modal`、`$Date` 等屬性掛到 `app.config.globalProperties`。

第三，`ViewUIPlusGlobalOptions`、`ViewUIPlusInstallOptions` 與 `$VIEWUI` 之間有什麼差異。這三者都和 plugin options 有關，但分別回答不同問題。

第四，`ComponentCustomProperties` 為什麼重要。沒有 module augmentation 的話，Vue runtime 上雖然有 `this.$Message`，但 TypeScript 不一定知道它存在。

本章不會完整展開 `$Message`、`$Modal`、`$Notice` 這類命令式 API 的所有 method options。這些 service object 的細節可以拆到後續的 overlay / imperative API 型別專章中處理。

---

## 2. 學習前先建立的基本觀念

### 2.1 Vue plugin 的 runtime 角色

在 Vue 3 中，plugin 通常透過 `app.use()` 安裝。對 component library 來說，plugin 常見任務包含：

1. 全域註冊 components。
2. 全域註冊 directives。
3. 設定語系、主題或全域預設值。
4. 把命令式 API 掛到 `app.config.globalProperties`。

View UI Plus 也符合這個模式。使用者安裝後，可以在 template 中使用全域 components，也可以透過 `this.$Message`、`this.$Modal` 這類 global instance properties 呼叫命令式 API。

因此 plugin 型別不是單純描述一個函式而已。它要描述的是「安裝這個套件後，Vue app 多了哪些全域能力」。

### 2.2 `app.config.globalProperties` 是什麼

`app.config.globalProperties` 是 Vue 3 用來掛載全域 instance properties 的位置。當 plugin 寫入：

```js
app.config.globalProperties.$Message = components.Message;
```

Options API component 內部就可能透過：

```ts
this.$Message.success('Saved');
```

取得這個能力。

但是 runtime 有這個屬性，不代表 TypeScript 自動知道 `this.$Message`。TypeScript 的 component instance 型別需要額外擴充，這就會用到 `declare module '@vue/runtime-core'` 與 `ComponentCustomProperties`。

### 2.3 Module Augmentation 是什麼

Module augmentation 可以理解成「替既有模組補充型別」。Vue 的 component instance 型別定義在 `@vue/runtime-core` 中，所以如果 library 想讓使用者的 `this.$Message` 被 TypeScript 承認，就要擴充 `ComponentCustomProperties`：

```ts
declare module '@vue/runtime-core' {
    interface ComponentCustomProperties {
        $Message: any;
    }
}
```

這段 declaration 不會真的在 runtime 建立 `$Message`。它只是在 type surface 告訴 TypeScript：「Vue component instance 上有 `$Message` 這個屬性」。runtime 建立 `$Message` 的工作仍然發生在 `src/index.js` 的 `install` 函式中。

### 2.4 Runtime Surface 與 Type Surface 的分工

閱讀 plugin 型別時，一定要分清楚兩個層次。

| 層次 | 來源 | 回答的問題 |
| --- | --- | --- |
| runtime surface | `src/index.js` | `app.use()` 實際做了什麼、掛了什麼、export 了什麼 |
| type surface | `types/index.d.ts` | TypeScript 是否知道這些 API、知道到多精準 |

當 runtime surface 與 type surface 不一致時，就會出現 type gap。例如 runtime 掛了 `$Message`，但 declaration 沒補 `ComponentCustomProperties`，使用者在 TypeScript 裡寫 `this.$Message` 就可能報錯。反過來，如果 declaration 宣告了某個屬性，但 runtime 沒有真的掛上去，程式執行時就可能出錯。

---

## 3. 整體概覽

本章可以用「一個入口、兩個來源、三類契約」理解。

一個入口是 `types/index.d.ts`。這是 View UI Plus package 層級的 type entry，負責讓 TypeScript 從這裡開始認識整個套件。

兩個來源是：

```txt
runtime source: src/index.js
type declaration: types/index.d.ts
```

三類契約則是：

| 契約類型 | 代表內容 | 主要檔案 |
| --- | --- | --- |
| package export contract | component named exports、`install`、可能的 default API | `types/index.d.ts`、`types/viewuiplus.components.d.ts` |
| install options contract | `ViewUIPlusInstallOptions`、`ViewUIPlusGlobalOptions` | `types/index.d.ts` |
| global instance property contract | `$VIEWUI`、`$Message`、`$Modal`、`$Date` 等 | `ComponentCustomProperties` augmentation |

可以用下列流程圖理解：

```txt
使用者程式
  app.use(ViewUIPlus, options)
        │
        ▼
src/index.js runtime install
  ├─ 處理 opts.locale / opts.i18n
  ├─ app.component(...) 註冊全域元件
  ├─ app.directive(...) 註冊全域指令
  └─ app.config.globalProperties.$Xxx = ...
        │
        ▼
Vue runtime component instance
  this.$VIEWUI
  this.$Message
  this.$Modal
  this.$Date

TypeScript 端
  package.json typings
        │
        ▼
types/index.d.ts
  ├─ export * from './viewuiplus.components'
  ├─ ViewUIPlusGlobalOptions
  ├─ ViewUIPlusInstallOptions
  ├─ declare module '@vue/runtime-core'
  └─ export const install
```

這張圖的重點是：`src/index.js` 決定 runtime 真的發生什麼，`types/index.d.ts` 則決定 TypeScript 使用者能不能安全地使用這些能力。

---

## 4. 核心內容逐步講解

### 4.1 `types/index.d.ts` 是 package type entry

`types/index.d.ts` 是 View UI Plus 型別系統的入口檔。使用者安裝套件後，TypeScript 會從 package 指定的型別入口開始理解這個 package 對外提供什麼。

`types/index.d.ts` 大致包含下列結構：

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

這段 declaration 可以拆成三個責任。

| 區塊 | 角色 | 閱讀重點 |
| --- | --- | --- |
| `export * from './viewuiplus.components'` | 接上 component named exports | 讓 `Button`、`Input`、`Table` 等元件型別能從 package entry 匯出 |
| `ViewUIPlusGlobalOptions` / `ViewUIPlusInstallOptions` | 描述 plugin options | 區分全域顯示設定與安裝階段專用設定 |
| `ComponentCustomProperties` | 擴充 Vue component instance | 讓 `this.$Message`、`this.$Modal` 等屬性在 TypeScript 中合法 |

這表示 `types/index.d.ts` 不只是「宣告 install 函式」而已，它是 package type surface 的總入口。前面章節讀到的 component props、emits、slots，大多會透過 `viewuiplus.components.d.ts` 接到這裡；而本章關注的 plugin options 與 global properties，也在這裡集中處理。

### 4.2 Runtime `install` 實際做了什麼

`src/index.js` 的 `install` 是 runtime 行為的核心。

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

這段流程可以拆成四個階段。

| 階段 | Runtime 行為 | Type 對應 |
| --- | --- | --- |
| 處理語系 | 讀取 `opts.locale`、`opts.i18n` | `ViewUIPlusInstallOptions` 需要包含 `locale`、`i18n` |
| 註冊元件 | `app.component(key, ViewUI[key])` | component exports 由 `viewuiplus.components.d.ts` 描述 |
| 註冊指令 | `app.directive(key, directives[key])` | 指令型別是否完整需要後續確認 |
| 掛載全域屬性 | `app.config.globalProperties.$Xxx = ...` | `ComponentCustomProperties` 需要同步擴充 `$Xxx` |

TypeScript 對 `install` 的描述則是：

```ts
export const install: (app: App, options?: ViewUIPlusInstallOptions) => void;
```

這個 signature 描述了三件事：第一個參數是 Vue `App`，第二個參數是可選的 install options，回傳值是 `void`。它能讓 TypeScript 知道 `install` 是一個 Vue plugin 風格的安裝函式，但它不會完整描述 install 內部掛載了哪些元件與 properties。這些細節要靠其他 declaration 區塊補上。

### 4.3 `ViewUIPlusGlobalOptions` 與 `$VIEWUI`

`ViewUIPlusGlobalOptions` 描述的是全域設定物件的形狀。

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

這些設定通常不是單一元件自己的 props，而是 plugin 安裝後存在 `$VIEWUI` 裡，供多個元件讀取的全域 display config。例如 `size` 可能影響元件預設尺寸，`transfer` 可能影響浮層是否轉移到 body 或其他容器，`modal.maskClosable` 可能影響 Modal 預設行為。

runtime install 會把 options 整理到：

```js
app.config.globalProperties.$VIEWUI = {
    size: opts.size || '',
    capture: 'capture' in opts ? opts.capture : true,
    transfer: 'transfer' in opts ? opts.transfer : '',
    // ...
}
```

這裡要注意：`ViewUIPlusGlobalOptions` 只描述 type surface 中 `$VIEWUI` 或 install options 的可見型別；runtime fallback 則描述「沒有傳入 option 時實際會補什麼值」。這兩者不能混為一談。

| 層次 | 代表問題 | 例子 |
| --- | --- | --- |
| install input type | 使用者可以傳入什麼設定 | `size?: string`、`transfer?: boolean | string` |
| runtime stored value | plugin 實際存進 `$VIEWUI` 的值 | `size: opts.size || ''` |
| runtime default / fallback | 沒傳時如何補值 | `capture` 預設為 `true` |
| component read behavior | 元件如何讀取全域設定 | 例如 Button `size` default 讀 `$VIEWUI.size` |

這裡需要後續確認：應回到完整 `types/index.d.ts` 檢查 `ViewUIPlusGlobalOptions` 是否真的完全沒有 `capture`；也要回到 `src/index.js` 確認 `$VIEWUI.capture` 的完整使用場景。

### 4.4 `ViewUIPlusInstallOptions` 是安裝階段的 options contract

`ViewUIPlusInstallOptions` 繼承 `ViewUIPlusGlobalOptions`，並加入 install 階段專用能力：

```ts
interface ViewUIPlusInstallOptions extends ViewUIPlusGlobalOptions {
    locale?: any;
    i18n?: any;
}
```

runtime 對應邏輯是：

```js
if (opts.locale) localeFile.use(opts.locale);
if (opts.i18n) localeFile.i18n(opts.i18n);
```

這表示 `locale` 與 `i18n` 的角色和 `size`、`transfer` 不完全相同。

`size`、`transfer` 這類設定通常會被整理進 `$VIEWUI`，之後由 component 讀取。`locale`、`i18n` 則是在 install 階段觸發語系系統或翻譯 adapter 的設定，未必會原樣成為 `$VIEWUI` 的欄位。

| 類型 | 範例 | 主要用途 | 是否通常屬於 `$VIEWUI` display config |
| --- | --- | --- | --- |
| install-only option | `locale`、`i18n` | 安裝時設定語系或翻譯函式 | 不一定 |
| global display option | `size`、`transfer`、`modal.maskClosable` | 給 components 讀取的全域預設行為 | 是 |
| runtime fallback | `opts.size || ''`、`capture` default `true` | 沒傳 option 時建立實際值 | 是 runtime 行為，不等於型別本身 |

這個區分非常重要。閱讀 plugin 型別時，不要看到 options interface 就以為所有欄位都會被存入 `$VIEWUI`；也不要看到 `$VIEWUI` 有某個 runtime 欄位，就以為 install options type 一定有同步描述。

### 4.5 `ComponentCustomProperties` 讓 `this.$Xxx` 被 TypeScript 承認

如果 plugin 寫入：

```js
app.config.globalProperties.$Message = components.Message;
```

Vue runtime component instance 上就可以取得 `$Message`。但 TypeScript 不會自動知道這件事。因此 `types/index.d.ts` 需要透過 module augmentation 補上：

```ts
declare module '@vue/runtime-core' {
    interface ComponentCustomProperties {
        $Message: any;
    }
}
```

View UI Plus 在 `ComponentCustomProperties` 中補了多個 `$...` properties：

| Property | Runtime 來源 | Type 現況 | 閱讀重點 |
| --- | --- | --- | --- |
| `$VIEWUI` | install 整理出的全域設定 | `ViewUIPlusGlobalOptions` | 有基本 options shape |
| `$Spin` | `components.Spin` | `any` | 只知道存在，method contract 不精準 |
| `$Loading` | `components.LoadingBar` | `any` | 只知道存在，method contract 不精準 |
| `$Message` | `components.Message` | `any` | 只知道存在，method contract 不精準 |
| `$Notice` | `components.Notice` | `any` | 只知道存在，method contract 不精準 |
| `$Modal` | `components.Modal` | `any` | 只知道存在，method contract 不精準 |
| `$ImagePreview` | `components.ImagePreview` | `any` | 只知道存在，method contract 不精準 |
| `$Copy` | 需要回到 runtime 確認 | `any` | 需要後續確認實際 API shape |
| `$ScrollIntoView` | 需要回到 runtime 確認 | `any` | 需要後續確認實際 API shape |
| `$ScrollTop` | 需要回到 runtime 確認 | `any` | 需要後續確認實際 API shape |
| `$Date` | `dayjs` | `any` | 只知道存在，不知道 dayjs method typing 是否保留 |

這裡可以建立一個判斷原則：`ComponentCustomProperties` 解決的是「component instance 上是否有這個 property」的問題；property 本身的 method 是否精準，取決於它被宣告成具體 interface，還是被宣告成 `any`。

### 4.6 `$Message: any` 是「存在性契約」，不是「精準 API 契約」

`$Message` 說明 `any` 的弱契約問題，這是很好的案例。

```ts
$Message: any;
```

這樣可以讓 TypeScript 接受：

```ts
this.$Message.success('Saved');
```

但也會讓 TypeScript 放過：

```ts
this.$Message.notExistMethod('Saved');
```

原因是 `any` 幾乎關閉了型別檢查。TypeScript 只知道 `$Message` 這個 property 可以被存取，卻不會檢查它有哪些 method、method 接受什麼參數、回傳什麼值。

因此 `$Message: any` 的效果可以拆成兩層理解。

| 契約層次 | `$Message: any` 是否做到 | 說明 |
| --- | --- | --- |
| property 存在性 | 有 | `this.$Message` 不會被視為不存在 |
| method 名稱檢查 | 沒有 | `notExistMethod()` 也會通過 |
| options 形狀檢查 | 沒有 | 傳錯 options 欄位通常不會被攔截 |
| payload / return type | 沒有 | 不知道 method 回傳值是否可呼叫或可銷毀 |

更精準的設計可以抽出 service API interface，例如：

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

然後把 `$Message` 宣告成：

```ts
$Message: MessageApi;
```

實際要改良時，還需要回到 `src/components/message/index.js` 與 `types/message.d.ts` 確認完整 options、回傳值與方法行為。

### 4.7 Service Object 與 Component Instance 要分開看

`$Message`、`$Modal`、`$Notice` 這類 API 容易和 component instance methods 混在一起，但它們其實是不同類型的 public API。

component instance API 是使用者透過 template ref 拿到單一元件 instance 後呼叫的方法，例如：

```ts
inputRef.value?.focus();
```

service object API 則是透過 import 或 global property 取得一個命令式物件，例如：

```ts
this.$Message.success('Saved');
```

或：

```ts
import { Message } from 'view-ui-plus';

Message.success('Saved');
```

兩者的型別設計方向不同。

| API 類型 | 取得方式 | 代表例子 | 型別重點 |
| --- | --- | --- | --- |
| component instance API | template ref | `Input.focus()`、`Input.blur()` | 是否暴露 public ref methods |
| service object API | named import 或 `this.$Xxx` | `Message.success()`、`Modal.confirm()` | 是否描述 method、options、return value |
| global config API | `this.$VIEWUI` | `$VIEWUI.size`、`$VIEWUI.transfer` | 是否描述全域設定欄位 |

因此 `$Message` 不應該用前一章的 component ref API 思維來讀。它不是某個 `<Message ref="..." />` 的 instance methods，而是 plugin 掛到全域的 service object contract。

### 4.8 Named Export Gap：runtime export 不一定有完整 declaration

`src/index.js` runtime 也可能 export：

```js
export const version = pkg.version;
export const locale = localeFile.use;
export const i18n = localeFile.i18n;
export const lang = (code) => { ... };
export default API;
```

這就是 package-level type contract 常見的維護風險：runtime export 已經存在，但 declaration 沒有同步補上，導致 TypeScript 使用者 import 時可能缺少型別提示或直接報錯。

可以先用下表記錄目前觀察：

| Runtime export / ability | Type coverage 觀察 | 風險 |
| --- | --- | --- |
| `install` | 有 `export const install` | 基本覆蓋 |
| component exports | 透過 `export * from './viewuiplus.components'` | 需確認 registry 是否完整 |
| `$...` instance properties | 透過 `ComponentCustomProperties` | 多數是 `any`，只做到弱契約 |
| `version` | 從提供片段看未明確宣告 | 使用者 import 時可能缺型別 |
| `locale` / `i18n` / `lang` | 從提供片段看未明確宣告 | 語系相關 API 可能缺型別 |
| default API object | 完整 shape 從提供片段看不明確 | `app.use(default)`、default import API 提示可能不完整 |

這裡要保持謹慎：本文只能根據目前提供的筆記片段說「從單檔片段看不夠明確」，不能直接斷言完整專案完全沒有這些型別。真正檢查時應該搜尋整個 `types/` 目錄，確認是否有其他 declaration 補足。

### 4.9 Plugin type contract 的維護規則

plugin 層級的型別維護，不能只看某一個 interface。它需要建立一套同步檢查規則。

當 `src/index.js` 有變動時，至少要檢查以下幾件事。

| Runtime 變更 | Type declaration 檢查點 | 原因 |
| --- | --- | --- |
| 新增 named export | `types/index.d.ts` 是否 export 對應型別 | 避免 TypeScript 使用者 import 不到或沒有提示 |
| 新增 component export | `viewuiplus.components.d.ts` 是否同步 | 避免 runtime 有元件，但 type registry 沒有 |
| 新增 install option | `ViewUIPlusInstallOptions` 是否新增欄位 | 避免 `app.use(ViewUIPlus, options)` 傳入時報錯 |
| 新增 `$VIEWUI` 欄位 | `ViewUIPlusGlobalOptions` 是否同步 | 避免 component 可讀，但 type 不承認 |
| 新增 `app.config.globalProperties.$Xxx` | `ComponentCustomProperties` 是否新增 `$Xxx` | 避免 `this.$Xxx` 被 TypeScript 視為不存在 |
| service object method 改動 | 對應 service API interface 是否同步 | 避免 method name、options、return type 不一致 |

這套檢查規則可以作為後續閱讀 View UI Plus plugin 型別、或自己設計 component library 型別時的維護 checklist。

---

## 5. 表格整理

### 5.1 核心檔案與責任

| 模組 / 檔案 | 所在位置 | 負責職責 | 與其他模組的關係 | 初次閱讀重點 |
| --- | --- | --- | --- | --- |
| Runtime plugin entry | `src/index.js` | 實作 `install`、註冊 components / directives、掛載 global properties | 對應 `types/index.d.ts` 的 plugin type surface | 觀察 `app.use()` 後 runtime 實際改變什麼 |
| Type entry | `types/index.d.ts` | 宣告 package exports、install options、global instance properties | 連接 `viewuiplus.components.d.ts` 與 Vue `ComponentCustomProperties` | 觀察 package 層級 type contract |
| Component registry | `types/viewuiplus.components.d.ts` | 匯出各 component declaration | 被 `types/index.d.ts` 重新 export | 檢查 component named exports 是否完整 |
| Vue runtime core augmentation | `declare module '@vue/runtime-core'` | 擴充 Vue component instance 型別 | 讓 `this.$Message`、`this.$Modal` 在 TypeScript 中合法 | 檢查 `$Xxx` 是否與 runtime globalProperties 對齊 |

這張表的閱讀方式是：先從 `src/index.js` 看 runtime，確認 plugin 實際提供了哪些能力；再回到 `types/index.d.ts` 看 TypeScript 是否把這些能力描述出來。若某個 runtime 能力沒有對應 declaration，就可能是 type gap。

### 5.2 Plugin API 分類表

| API 類型 | 範例 | Runtime 來源 | Type 來源 | 閱讀重點 |
| --- | --- | --- | --- | --- |
| install function | `install(app, options)` | `src/index.js` | `export const install` | signature 是否符合 Vue plugin 使用方式 |
| install-only options | `locale`、`i18n` | `opts.locale`、`opts.i18n` | `ViewUIPlusInstallOptions` | 是否只在安裝階段使用 |
| global display options | `size`、`transfer`、`modal.maskClosable` | `$VIEWUI` | `ViewUIPlusGlobalOptions` | 是否和 component default / fallback 對齊 |
| global service object | `$Message`、`$Modal`、`$Notice` | `app.config.globalProperties.$Xxx` | `ComponentCustomProperties` | 是否只是 `any`，或有精準 method contract |
| package named export | `version`、`locale`、`i18n`、`lang` | `src/index.js` exports | 需要檢查 `types/index.d.ts` | runtime export 是否同步宣告 |

這張表可以幫助你避免把不同型別層次混在一起。`locale` 是 install option，`$Message` 是 global service object，`version` 是 package named export，三者都在 plugin 層級，但檢查方式不同。

### 5.3 Runtime / Type Gap 檢查表

| 觀察項目 | 可能 gap | 檢查方式 | 影響 |
| --- | --- | --- | --- |
| `$VIEWUI.capture` | runtime 有欄位，但 options interface 可能缺欄位 | 比對 `src/index.js` 與 `ViewUIPlusGlobalOptions` | 使用者傳入或讀取時可能缺型別支援 |
| `$Message: any` | TypeScript 只知道存在，不知道 method shape | 比對 `components.Message` 與 declaration | 錯誤 method 或錯誤 options 不會被攔截 |
| `version` export | runtime export 可能缺 declaration | 搜尋 `types/index.d.ts` 是否 export | 使用者 import 時可能缺型別 |
| `locale` / `i18n` / `lang` export | runtime 語系 API 可能缺 declaration | 搜尋 `types/` 是否有相關宣告 | 使用者無法獲得精準提示 |
| component registry | runtime component 有新增，但 type registry 未同步 | 比對 `src/components/index.js` 與 `types/viewuiplus.components.d.ts` | named import component 型別可能缺失 |

這張表不是斷言所有 gap 都一定存在，而是提供檢查方向。真正確認時，需要回到完整 source 與完整 `types/` 目錄逐項比對。

---

## 6. 範例或情境說明

### 6.1 使用 `app.use()` 時，TypeScript 看到什麼

假設使用者在 Vue app 中寫：

```ts
import { createApp } from 'vue';
import ViewUIPlus from 'view-ui-plus';

const app = createApp(App);

app.use(ViewUIPlus, {
  size: 'small',
  transfer: true,
  locale: zhTW
});
```

這段程式的 runtime 行為大致是：

1. Vue 呼叫 View UI Plus 的 `install(app, options)`。
2. `install` 讀取 `locale`，設定語系。
3. `install` 讀取 `size`、`transfer` 等選項，整理出 `$VIEWUI`。
4. `install` 註冊全域 components 與 directives。
5. `install` 掛載 `$Message`、`$Modal` 等 global properties。

TypeScript 端則依賴 `ViewUIPlusInstallOptions` 判斷第二個參數可傳什麼。若 `ViewUIPlusInstallOptions` 沒有某個欄位，即使 runtime 支援，TypeScript 使用者也可能看不到提示或被型別擋住。

### 6.2 在 Options API 中使用 `$Message`

假設 component 內寫：

```ts
export default {
  methods: {
    save() {
      this.$Message.success('Saved');
    }
  }
}
```

這段程式能否在 runtime 執行，取決於 `install` 是否真的掛了：

```js
app.config.globalProperties.$Message = components.Message;
```

這段程式能否通過 TypeScript，取決於 `types/index.d.ts` 是否擴充了：

```ts
declare module '@vue/runtime-core' {
    interface ComponentCustomProperties {
        $Message: any;
    }
}
```

這裡的 `$Message: any` 讓 TypeScript 承認 `$Message` 存在，但不會檢查 `success()` 的參數是否正確，也不會檢查 `notExistMethod()` 是否不存在。

### 6.3 新增 `$Dialog` 時應如何同步型別

假設某天 View UI Plus runtime 新增：

```js
app.config.globalProperties.$Dialog = components.Dialog;
```

那型別維護至少要檢查三個地方。

第一，`types/index.d.ts` 的 `ComponentCustomProperties` 是否新增：

```ts
declare module '@vue/runtime-core' {
    interface ComponentCustomProperties {
        $Dialog: DialogApi;
    }
}
```

第二，是否需要提供 `DialogApi` interface，而不是直接使用 `any`。

第三，如果 `Dialog` 同時支援 named import：

```ts
import { Dialog } from 'view-ui-plus';
```

就要確認 `types/viewuiplus.components.d.ts` 或其他 package export declaration 是否也有同步。

這個情境說明 plugin type contract 的核心：runtime 每新增一種全域能力，type surface 就應該同步補上對應契約。

---

## 7. 閱讀路線或學習路線

### 7.1 初次閱讀路線

第一次讀 View UI Plus plugin 型別時，建議先從 `types/index.d.ts` 開始。不要一開始就跳進 `$Message` 或 `$Modal` 的細節，因為你需要先建立 package type entry 的整體地圖。

建議順序如下：

1. 先讀 `types/index.d.ts` 的 import / export 區塊，理解它如何接上 `viewuiplus.components.d.ts`。
2. 接著讀 `ViewUIPlusGlobalOptions`，看 `$VIEWUI` 理論上有哪些全域設定。
3. 再讀 `ViewUIPlusInstallOptions`，理解 install 階段多了哪些 options，例如 `locale`、`i18n`。
4. 再讀 `declare module '@vue/runtime-core'`，確認 Vue instance 上被補了哪些 `$Xxx` properties。
5. 最後讀 `export const install`，理解 TypeScript 如何描述 plugin install signature。

這條路線的目標是先知道 `types/index.d.ts` 的結構，不急著判斷每一個 service API 是否精準。

### 7.2 Runtime 對照路線

讀完 type entry 後，回到 `src/index.js` 對照 runtime。

1. 搜尋 `export const install` 或 `install = function`。
2. 看 `opts.locale`、`opts.i18n` 等 options 如何被使用。
3. 看 `app.component()` 註冊了哪些 components。
4. 看 `app.directive()` 註冊了哪些 directives。
5. 看 `app.config.globalProperties.$Xxx` 掛載了哪些 properties。
6. 將這些 `$Xxx` 逐一對照 `ComponentCustomProperties`。

這條路線的目標是確認 runtime surface 與 type surface 是否同步。

### 7.3 深入閱讀路線

如果要進一步研究型別精準度，可以沿著 global service object 深入：

1. 選一個 service，例如 `Message`。
2. 讀 `src/components/message/index.js`，整理它真正提供哪些 method。
3. 讀 `types/message.d.ts`，看是否有對應 `MessageConfig`、options interface 或 instance 型別。
4. 回到 `types/index.d.ts`，看 `$Message` 是否只是 `any`，還是有使用具體 interface。
5. 評估是否能提出更精準的 `MessageApi` 型別設計。

這條路線適合後續拆成 `08-overlay-and-imperative-api-types.md` 或 service API 型別改良筆記。

### 7.4 可以暫時跳過的部分

初次閱讀時，可以先暫時跳過每個 service object 的完整 options shape。原因是 `$Message`、`$Modal`、`$Notice`、`$Spin` 各自都有大量細節，如果一開始全部展開，會讓 plugin 型別主線失焦。

本章應先掌握：`install` 做什麼、`types/index.d.ts` 描述什麼、`ComponentCustomProperties` 解決什麼、`any` 留下什麼弱契約。

---

## 8. 常見誤區

| 誤區 | 為什麼容易誤解 | 正確理解 |
| --- | --- | --- |
| `install` 有型別就代表 plugin 型別完整 | `install` signature 只描述函式參數與回傳值 | plugin 型別還包含 component exports、install options、global properties |
| `$Message: any` 代表 `$Message` 型別已完整 | `any` 會讓任何 method 都通過 | 它只解決 property 存在性，不解決 method-level contract |
| runtime 掛了 `$Xxx`，TypeScript 就會自動知道 | Vue runtime 和 TypeScript declaration 是不同層次 | 需要透過 `ComponentCustomProperties` 擴充 instance 型別 |
| `ViewUIPlusGlobalOptions` 和 `ViewUIPlusInstallOptions` 是同一件事 | 兩者都和 plugin options 有關，所以容易混淆 | `InstallOptions` 是傳給 `app.use()` 的入口；`GlobalOptions` 偏向 `$VIEWUI` 全域設定形狀 |
| 所有 install options 都會進 `$VIEWUI` | 有些 options 只在 install 階段使用 | `locale`、`i18n` 主要是語系初始化，不一定是 component display config |
| `types/index.d.ts` 不需要對照 `src/index.js` | type entry 看起來已經列出很多內容 | 必須對照 runtime install，才能發現 missing export、missing global property 或弱契約 |
| `default API object` 不重要 | 使用者可能使用 default import 或 `app.use(ViewUIPlus)` | default API object 的 shape 若不清楚，IDE 與 type checker 的幫助會有限 |

---

## 9. 本章總結

本章的核心是理解 View UI Plus 的 plugin 型別不是單一 `install` 函式，而是一組 package-level contract。

在 runtime 層，`src/index.js` 的 `install` 會處理 `locale`、`i18n`，註冊全域 components 與 directives，並把 `$VIEWUI`、`$Message`、`$Modal`、`$Date` 等 properties 掛到 `app.config.globalProperties`。這些行為決定使用者在執行時可以使用哪些全域能力。

在 type 層，`types/index.d.ts` 則負責把這些能力描述給 TypeScript。它透過 `export * from './viewuiplus.components'` 連接 component named exports，透過 `ViewUIPlusGlobalOptions` 與 `ViewUIPlusInstallOptions` 描述 plugin options，透過 `ComponentCustomProperties` 讓 `this.$Message`、`this.$Modal` 等 instance properties 在 TypeScript 中合法。

不過，合法不等於精準。`$Message: any`、`$Modal: any` 這類 declaration 可以讓使用者不被 TypeScript 擋住，但也會讓不存在的方法、錯誤的 options 形狀、錯誤的回傳值使用方式都被放過。這種型別屬於弱契約，適合維持相容性與降低維護成本，但型別保護能力有限。

閱讀 plugin 型別時，最重要的方法是把 `src/index.js` 和 `types/index.d.ts` 並排對照。每看到 runtime 新增 export、install option、`$VIEWUI` 欄位或 global property，都要回到 declaration 檢查是否同步。只有 runtime surface 與 type surface 對齊，才代表 plugin API 對 TypeScript 使用者來說是完整且可信的。

---

## 10. 自我檢查問題

1. 為什麼 `types/index.d.ts` 可以視為 View UI Plus package type entry？
2. `src/index.js` 的 `install` 通常負責哪些 runtime 工作？
3. `ViewUIPlusGlobalOptions` 和 `ViewUIPlusInstallOptions` 的差異是什麼？
4. 為什麼 `locale`、`i18n` 比較像 install-only options，而不是一般 `$VIEWUI` display config？
5. 為什麼 Vue plugin 掛了 `app.config.globalProperties.$Message` 之後，還需要在 `ComponentCustomProperties` 中宣告 `$Message`？
6. `$Message: any` 解決了什麼問題？又留下什麼型別安全問題？
7. 如果 runtime `$VIEWUI` 有 `capture`，但 `ViewUIPlusGlobalOptions` 沒有 `capture`，可能造成什麼維護風險？
8. 為什麼 service object API 和 component instance API 不應混在一起理解？
9. 如果 `src/index.js` 新增 `export const lang = ...`，`types/index.d.ts` 應該檢查什麼？
10. 新增一個 `app.config.globalProperties.$Dialog` 時，至少要同步修改哪些型別區塊？

---

## 11. 後續延伸方向

本章建立的是 plugin 層級型別閱讀框架，後續可以延伸成以下主題。

### 11.1 `$Message` / `$Notice` Service API 型別分析

可以針對 `src/components/message/index.js`、`src/components/notice/index.js` 與對應 `types/*.d.ts` 做深入整理，確認 `info()`、`success()`、`warning()`、`error()`、`loading()`、`config()`、`destroy()` 等 method 的 options、return value 是否有精準型別。

### 11.2 `$Modal` Imperative API 型別分析

`Modal.confirm()`、`Modal.info()`、`Modal.remove()` 這類命令式 API 通常有較複雜的 options，例如 title、content、render、onOk、onCancel。可以獨立分析 runtime options 與 declaration 的差異。

### 11.3 `ViewUIPlusGlobalOptions` 完整欄位對照

可以完整比對 `src/index.js` 寫入 `$VIEWUI` 的所有欄位，以及 `types/index.d.ts` 中 `ViewUIPlusGlobalOptions` 的所有欄位，整理出同步、缺漏、過寬、過窄的地方。

### 11.4 `types/viewuiplus.components.d.ts` Component Registry 維護

可以把 runtime component exports 與 type component exports 做完整對照，檢查哪些元件、service、輔助型別有沒有被正確 export。

### 11.5 Plugin 型別改良提案

後續可以設計更精準的 interface，例如 `MessageApi`、`ModalApi`、`LoadingBarApi`、`ViewUIPlusGlobalProperties`，並評估是否能在不破壞相容性的前提下逐步取代 `any`。
