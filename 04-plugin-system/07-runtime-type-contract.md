# Runtime Type Contract：Plugin Runtime Surface 與 TypeScript Declaration 對照

## 1. 本章定位

本章位於 `04-plugin-system/`，主題是 **View UI Plus plugin 層級的 runtime API 與 TypeScript 型別宣告之間的契約關係**。

這篇筆記要解決的問題是：當 `src/index.js` 對外提供某些 API 時，`types/index.d.ts` 是否有對應的型別宣告？如果有，宣告到什麼程度？如果沒有，可能代表什麼維護風險？

讀完本章後，你應該能理解：

1. `src/index.js` 實際暴露哪些 plugin-level runtime surface。
2. `types/index.d.ts` 提供哪些 TypeScript type surface。
3. 哪些 runtime 行為有被型別系統覆蓋，哪些只被部分覆蓋。
4. 為什麼 `any` 雖然能讓程式通過編譯，但不代表 method-level contract 被完整描述。
5. 修改 plugin runtime 時，應該同步檢查哪些型別宣告。

本章不深入每個 component 的 props、emits、slots、methods 型別。那些內容應放在 `06-type-system/` 或各 component 的原始碼閱讀筆記中。本章也不深入每個 imperative service，例如 `$Message.info()`、`$Modal.confirm()` 的詳細 method contract，這類內容更適合放到 `10-imperative-api/`。

---

## 2. 學習前先建立的基本觀念

### 2.1 Runtime surface 是什麼

`runtime surface` 指的是套件在 JavaScript 執行階段實際提供給使用者的東西。對 View UI Plus 來說，`src/index.js` 就是 plugin 層級非常重要的 runtime 入口。

例如：

```js
export const install = function(app, opts = {}) {
    // plugin install logic
};

export const version = pkg.version;
export const locale = localeFile.use;
export const i18n = localeFile.i18n;
```

這些 `export` 代表使用者在 runtime 可以從 package 中取得對應能力。也就是說，runtime surface 回答的是：

> 這個套件實際上提供了哪些東西可以被呼叫、安裝或讀取？

### 2.2 Type surface 是什麼

`type surface` 指的是 TypeScript 在編譯期看得到的型別宣告。對 View UI Plus 來說，`types/index.d.ts` 是 plugin 層級的重要型別入口。

例如：

```ts
export const install: (app: App, options?: ViewUIPlusInstallOptions) => void;
```

這代表 TypeScript 編譯器知道 `install` 是一個函式，第一個參數是 `App`，第二個參數是可選的 `ViewUIPlusInstallOptions`。

type surface 回答的是：

> TypeScript 編譯器知道這個套件有哪些 API？每個 API 的參數、回傳值與屬性型別是什麼？

### 2.3 Runtime 和 TypeScript Declaration 不一定自動一致

在 JavaScript 套件中，runtime code 和 declaration file 通常是兩套東西。`src/index.js` 實際決定套件執行時有什麼能力，而 `types/index.d.ts` 則決定 TypeScript 使用者在開發時能得到什麼型別提示。

因此可能出現以下情況：

| 情況 | 說明 | 可能影響 |
| --- | --- | --- |
| runtime 有，type 也有 | 最理想，API 與型別宣告一致 | 使用者可以正常使用，也能得到型別提示 |
| runtime 有，type 沒有 | JS 可以執行，但 TS 可能不知道這個 API | import 可能出現型別錯誤或缺少提示 |
| runtime 有，type 是 `any` | TS 知道屬性存在，但不知道細節 | method 名稱、參數、回傳值缺少保護 |
| type 有，runtime 沒有 | 型別宣告過度承諾 | 編譯通過，但執行時可能壞掉 |

本章的重點就是建立這種對照能力：不要只看 runtime，也不要只看 `.d.ts`，而是要把兩者放在一起檢查。

### 2.4 Plugin-level contract 和 Component-level contract 不同

View UI Plus 是一個 component library，但本篇不是分析每個 component 的 `props` 型別，而是分析 plugin 層級的契約。

plugin-level contract 包含：

1. `app.use(ViewUIPlus, options)` 可以傳什麼 options。
2. `install(app, opts)` 會在 runtime 做什麼。
3. 套件有哪些 named exports。
4. default export 的大致結構。
5. `app.config.globalProperties` 會掛上哪些 instance properties。
6. TypeScript 是否知道 `this.$Message`、`this.$Modal`、`this.$VIEWUI` 這類屬性。

component-level contract 則會關心：

1. `Button` 有哪些 props。
2. `Select` 的 `modelValue` 型別是什麼。
3. component emits 哪些事件。
4. slot props 的型別是什麼。

這兩者雖然都屬於型別系統，但閱讀入口與維護重點不同。

---

## 3. 整體概覽

本篇對照的核心 sources 是：

```txt
01-origin/source/view-ui-plus-v1.3.20/src/index.js
01-origin/source/view-ui-plus-v1.3.20/types/index.d.ts
```

可以把這兩個檔案想成 plugin 層級的兩面：

| 檔案 | 角色 | 回答的問題 |
| --- | --- | --- |
| `src/index.js` | runtime 入口 | 套件執行時實際 export 什麼、install 做什麼、globalProperties 掛什麼 |
| `types/index.d.ts` | TypeScript 型別入口 | TS 使用者看到哪些型別、install options 長什麼樣、component instance 上有哪些 `$...` 屬性 |

整體關係可以簡化成：

```txt
src/index.js
  ├─ export * from './components'
  ├─ export const install = function(app, opts = {})
  ├─ export const version = pkg.version
  ├─ export const locale = localeFile.use
  ├─ export const i18n = localeFile.i18n
  ├─ export const lang = (code) => { ... }
  ├─ app.config.globalProperties.$...
  └─ default export API

        對照
          ↓

types/index.d.ts
  ├─ export * from './viewuiplus.components'
  ├─ interface ViewUIPlusGlobalOptions
  ├─ interface ViewUIPlusInstallOptions
  ├─ declare module '@vue/runtime-core'
  │    └─ interface ComponentCustomProperties
  └─ export const install: (...)
```

這個對照的核心問題是：

> `src/index.js` 對外承諾的 plugin API，`types/index.d.ts` 是否有同步描述？

---

## 4. 核心內容逐步講解

### 4.1 `src/index.js` 的 Runtime Surface

`src/index.js` 是 View UI Plus plugin 層級的主要 runtime 入口。

| Runtime surface | Source |
| --- | --- |
| named component exports | `export * from './components'` |
| plugin install | `export const install = function(app, opts = {})` |
| version | `export const version = pkg.version` |
| locale API | `export const locale = localeFile.use` |
| i18n API | `export const i18n = localeFile.i18n` |
| lang API | `export const lang = (code) => { ... }` |
| default export | `API` object with `install`, locale APIs, version, and components |
| instance properties | `app.config.globalProperties.$...` inside install |

這裡可以分成三種 runtime surface 來理解。

第一種是 **module-level API**。例如 `version`、`locale`、`i18n`、`lang` 都是透過 named export 對外暴露。使用者理論上可以用這種方式取得：

```js
import { locale, i18n, lang, version } from 'view-ui-plus';
```

第二種是 **Vue plugin API**。`install(app, opts)` 讓 View UI Plus 可以透過 Vue 的 plugin 機制被安裝：

```js
app.use(ViewUIPlus, options);
```

在 install 過程中，plugin 會處理全域設定、語系設定、component 註冊、directive 註冊，以及 `globalProperties` 寫入。

第三種是 **instance-level API**。這類 API 不是透過 `import` 使用，而是掛到 Vue component instance 上，例如：

```js
this.$Message.info('Saved');
this.$Modal.confirm({ title: 'Confirm' });
```

這些能力來自 `app.config.globalProperties.$...`，屬於 plugin install 後建立的 instance surface。

### 4.2 `types/index.d.ts` 的 Type Surface

`types/index.d.ts` 是 TypeScript 使用者看到的主要型別入口。

| Type surface | Meaning |
| --- | --- |
| `export * from './viewuiplus.components'` | component named exports 的型別入口 |
| `ViewUIPlusGlobalOptions` | `$VIEWUI` 與 install options 的主要 config shape |
| `ViewUIPlusInstallOptions` | install options，繼承 global options 並加入 `locale`、`i18n` |
| `ComponentCustomProperties` augmentation | 宣告 `this.$VIEWUI`、`this.$Message`、`this.$Modal` 等 |
| `export const install` | 宣告 plugin install signature |

這些型別可以分成三個層次理解。

第一個層次是 **component named exports 的型別入口**：

```ts
export * from './viewuiplus.components';
```

這代表 component 的型別主要不是寫在 `types/index.d.ts` 本身，而是轉交給 `viewuiplus.components` 這類 declaration 檔案處理。本章只記錄它是 component type entry，不展開每個 component 型別。

第二個層次是 **install options 的型別**。`ViewUIPlusGlobalOptions` 和 `ViewUIPlusInstallOptions` 負責描述使用者在 `app.use(ViewUIPlus, options)` 時可以傳入哪些設定。`ViewUIPlusInstallOptions` 繼承 global options，並加入 `locale`、`i18n`。

第三個層次是 **component instance 的 module augmentation**。Vue 3 中如果要讓 TypeScript 知道 `this.$Message`、`this.$Modal` 這些全域 instance properties，需要透過 module augmentation 擴充 `@vue/runtime-core` 的 `ComponentCustomProperties`。

概念上會像這樣：

```ts
declare module '@vue/runtime-core' {
    interface ComponentCustomProperties {
        $VIEWUI: ViewUIPlusGlobalOptions;
        $Message: any;
        $Modal: any;
        $Date: any;
    }
}
```

這讓 Options API component 內的 `this.$Message` 在型別上被承認。不過，如果屬性型別是 `any`，TypeScript 只能知道「這個屬性存在」，無法知道它有哪些 method、method 參數是什麼、回傳值是什麼。

### 4.3 Runtime 與 Type 的對齊狀況

runtime behavior 與 type coverage 放在同一張表檢查：

| Runtime behavior | Type coverage | Note |
| --- | --- | --- |
| `install(app, opts)` | `export const install: (app: App, options?: ViewUIPlusInstallOptions) => void` | install signature 有對應 |
| `$VIEWUI` | `$VIEWUI: ViewUIPlusGlobalOptions` | config shape 有對應，但 fallback value 是 runtime detail |
| `$Spin`, `$Message`, `$Modal` 等 | declared as `any` | property 存在有對應，method-level typing 不完整 |
| `$Date = dayjs` | `$Date: any` | property 存在有對應，dayjs 型別未精確化 |
| `locale`, `i18n`, `lang` named exports | 未在 `types/index.d.ts` 明確宣告 | runtime 有 export，但 type entry 主要只宣告 install 與 components |
| `version` named export | 未在 `types/index.d.ts` 明確宣告 | runtime 有 export，type surface 可能不足 |
| default `API` object | 未在 `types/index.d.ts` 明確宣告 default shape | package default usage 依賴 JS runtime 與 Vue plugin inference |

這張表可以分成三類來閱讀。

第一類是 **對齊較完整的部分**。例如 `install(app, opts)` 在 runtime 有函式，型別中也有對應的 install signature。這代表使用者在 TypeScript 中使用 plugin install 時，至少可以得到基本參數型別提示。

第二類是 **只有 property-level 對齊，但 method-level 不完整的部分**。例如 `$Message`、`$Modal`、`$Date` 被宣告成 `any`。這表示 TypeScript 知道 component instance 上有這些 `$...` 屬性，但不知道它們內部具體提供哪些方法。這種情況下，即使你寫錯 method name，TypeScript 也未必能阻止：

```ts
this.$Message.notExistMethod(); // 若 $Message 是 any，TypeScript 可能不會報錯
```

第三類是 **runtime 有 export，但 `types/index.d.ts` 單檔沒有明確宣告的部分**。例如 `locale`、`i18n`、`lang`、`version` 與 default `API` object。這裡要注意，這個判斷是基於目前筆記對 `types/index.d.ts` 的觀察；完整 package 是否透過其他 declaration 檔案、package exports、typesVersions 或建置流程補足，仍需要後續確認。

### 4.4 為什麼 `any` 是一種「弱契約」

在這份筆記中，`any` 是一個很值得注意的訊號。

當 `ComponentCustomProperties` 中宣告：

```ts
$Message: any;
$Modal: any;
$Date: any;
```

它其實只完成了最低限度的型別契約：

> component instance 上存在這些 property。

但它沒有完成更細緻的契約：

1. `$Message` 有哪些方法？
2. `$Message.info()` 的參數可以是 string 還是 object？
3. `$Modal.confirm()` 回傳什麼？
4. `$Date` 是否應該對應到 `dayjs` 的型別？
5. service object 是否有 `destroy()`、`config()`、`open()` 等方法？

因此，`any` 在 library type design 中常常代表「先讓使用者不要被型別卡住」，但代價是失去 method-level 的型別保護。

這對原始碼閱讀的意義是：你不能只看到 `$Message: any` 就以為 `$Message` 的 contract 已經完整。真正的 service contract 還要回到 `$Message` 對應的 source module，例如 `components.Message` 的實作與相關 declaration。

### 4.5 `default export API` 的型別落差

View UI Plus 的 runtime 會組出一個 default export 的 `API` object。

1. `install`
2. locale APIs
3. `version`
4. components

這讓使用者可以用 plugin 形式安裝：

```js
import ViewUIPlus from 'view-ui-plus';

app.use(ViewUIPlus);
```

問題是，從 `types/index.d.ts` 單檔來看，default `API` object 的完整 shape 沒有被明確宣告。這代表 TypeScript 使用者對 default import 能得到多少提示，取決於 package 是否在其他地方補了 default export declaration，或是否透過 Vue plugin inference 間接滿足基本使用。

這裡需要注意兩件事：

1. **runtime 可以正常不代表型別完整**：JavaScript 執行時只要 default export 真的存在就可以用。
2. **型別不完整不一定代表使用者一定壞掉**：因為 package 可能還有其他 `.d.ts` 檔案或建置設定提供補充。

所以本篇只能下這個結論：

> 從 `types/index.d.ts` 單檔觀察，default `API` object 的完整 type shape 沒有在此處明確描述；是否由其他 declaration 補足，需要後續檢查 package type resolution。

### 4.6 `locale`、`i18n`、`lang`、`version` 的 named export gap

`src/index.js` 有以下 runtime named exports：

```js
export const version = pkg.version;
export const locale = localeFile.use;
export const i18n = localeFile.i18n;
export const lang = (code) => { ... };
```

但從 `types/index.d.ts` 單檔來看，這些 plugin-level named APIs 沒有明確宣告。這是一個重要落差。

在實務上，這可能造成幾種情況：

| 使用方式 | runtime 是否可能存在 | TypeScript 是否一定知道 | 說明 |
| --- | --- | --- | --- |
| `import { version } from 'view-ui-plus'` | runtime 有 export | 不一定 | 若 `.d.ts` 沒宣告，TS 可能提示不存在 |
| `import { locale } from 'view-ui-plus'` | runtime 有 export | 不一定 | locale function 的參數型別也可能缺失 |
| `import { i18n } from 'view-ui-plus'` | runtime 有 export | 不一定 | i18n adapter 的 function shape 未被精確描述 |
| `import { lang } from 'view-ui-plus'` | runtime 有 export | 不一定 | `code` 參數與錯誤處理契約未被型別化 |

這裡的重點不是說 View UI Plus 一定有型別錯誤，而是建立維護視角：

> 只要 runtime 新增了 named export，就應該檢查 type entry 是否同步新增對應 declaration。

### 4.7 `$VIEWUI` 的型別與 runtime fallback

`$VIEWUI` 是 View UI Plus plugin 寫入 `app.config.globalProperties` 的全域設定物件。型別上，它被宣告為：

```ts
$VIEWUI: ViewUIPlusGlobalOptions;
```

這表示 TypeScript 會把 `$VIEWUI` 視為符合 `ViewUIPlusGlobalOptions` 的物件。

`$VIEWUI` 的 fallback value 是 runtime detail。也就是說，當使用者沒有提供某些 options 時，plugin 實際如何補預設值、如何合併 options、哪些欄位存在於 runtime，這些不一定能完全從型別中看出來。

這提醒我們：

1. `ViewUIPlusGlobalOptions` 描述的是「可用設定形狀」。
2. runtime fallback 描述的是「沒有傳設定時，實際會得到什麼值」。
3. 兩者相關，但不是同一件事。

因此如果未來修改 `$VIEWUI` 的 fallback semantics，例如預設 `transfer`、`size`、`capture` 或其他全域 config 的行為，就不一定只改型別，也可能需要同步補文件與測試。

---

## 5. 表格整理

### 5.1 Runtime Surface 總表

| 項目 | 位置 / 寫法 | 角色 | 閱讀重點 |
| --- | --- | --- | --- |
| Component named exports | `export * from './components'` | 將 components 以 named export 方式暴露 | 對照 `types/index.d.ts` 是否也有 component type entry |
| Plugin install | `export const install = function(app, opts = {})` | Vue plugin 安裝入口 | 檢查 install options、component registration、directive registration、globalProperties |
| Version | `export const version = pkg.version` | 暴露套件版本 | 檢查 type entry 是否有宣告 `version` |
| Locale API | `export const locale = localeFile.use` | module-level 語系切換 API | 檢查 type entry 是否描述參數型別 |
| i18n API | `export const i18n = localeFile.i18n` | module-level 翻譯 adapter 設定 API | 檢查 i18n function shape 是否有型別 |
| Lang API | `export const lang = (code) => { ... }` | 根據已載入的 locale bundle 切換語系 | 檢查 `code` 與 window global contract 是否有描述 |
| Default API object | `export default API` | 套件預設匯出，供 `app.use(ViewUIPlus)` 使用 | 檢查 default export shape 是否有 declaration |
| Instance properties | `app.config.globalProperties.$...` | 提供 `this.$Message`、`this.$Modal` 等 instance API | 檢查 `ComponentCustomProperties` 是否同步 |

這張表的閱讀方式是：先從 runtime 看 View UI Plus 實際承諾什麼，再回到 type surface 檢查 TypeScript 是否知道這些承諾。

### 5.2 Type Surface 總表

| 項目 | 位置 / 寫法 | 角色 | 閱讀重點 |
| --- | --- | --- | --- |
| Component type export | `export * from './viewuiplus.components'` | component 型別入口 | 只代表 component types 由其他檔案承接，不代表本篇要展開 |
| Global options | `ViewUIPlusGlobalOptions` | 描述 `$VIEWUI` 與全域設定 shape | 對照 install options 與 runtime `$VIEWUI` |
| Install options | `ViewUIPlusInstallOptions` | 描述 `app.use(ViewUIPlus, options)` 可傳入的 options | 是否包含 runtime install 實際讀取的欄位 |
| Module augmentation | `ComponentCustomProperties` | 擴充 Vue component instance 的 `$...` 屬性 | 是否包含所有 globalProperties |
| Install declaration | `export const install: (...) => void` | 宣告 plugin install 函式型別 | 是否與 runtime install signature 對齊 |

這張表的閱讀方式是：把 `types/index.d.ts` 當成 TypeScript 使用者視角，檢查它是否足以描述 runtime 暴露出來的 plugin 能力。

### 5.3 Runtime / Type Alignment 表

| Runtime 行為 | Type 覆蓋程度 | 維護判斷 |
| --- | --- | --- |
| `install(app, opts)` | 有 install signature | 基本對齊，但要持續檢查 options 是否同步 |
| `$VIEWUI` | 有 `ViewUIPlusGlobalOptions` | shape 有描述，但 fallback semantics 仍是 runtime detail |
| `$Spin`、`$Message`、`$Modal` | 有 property declaration，但多為 `any` | property-level 對齊，method-level 不完整 |
| `$Date = dayjs` | 宣告為 `any` | 可以改進為 dayjs 相關型別，但需確認實際 import 型別 |
| `locale`、`i18n`、`lang` | 從單檔看未明確宣告 | 需要檢查是否由其他 declaration 補足 |
| `version` | 從單檔看未明確宣告 | 若對外建議使用，應有型別宣告 |
| default `API` object | 從單檔看未明確宣告完整 shape | 需要確認 default export declaration 與 package type resolution |

這張表是本章最重要的維護視角：plugin runtime 每新增一個出口，type surface 就應該有對應檢查；globalProperties 每新增一個 `$...`，`ComponentCustomProperties` 也應該同步更新。

---

## 6. 範例或情境說明

### 6.1 情境一：新增一個 install option

假設未來 plugin runtime 新增一個 install option：

```js
export const install = function(app, opts = {}) {
    if (opts.someNewOption) {
        // do something
    }
};
```

這時不能只改 `src/index.js`。你還應該檢查：

1. `ViewUIPlusInstallOptions` 是否新增 `someNewOption`。
2. 如果這個 option 會被存入 `$VIEWUI`，`ViewUIPlusGlobalOptions` 是否也要更新。
3. 如果 option 有預設值，文件是否說明 runtime fallback。
4. 如果 option 會影響 component 行為，是否需要補 component-level 文件或測試。

這就是 runtime/type contract 的維護核心：runtime 讀取什麼，type 就應該讓使用者知道可以傳什麼。

### 6.2 情境二：新增一個 globalProperties service

假設 install 內新增：

```js
app.config.globalProperties.$Dialog = components.Dialog;
```

那麼除了 runtime 可用之外，也應該同步更新：

```ts
declare module '@vue/runtime-core' {
    interface ComponentCustomProperties {
        $Dialog: any;
    }
}
```

如果沒有更新，Options API component 中使用 `this.$Dialog` 時，TypeScript 可能不知道這個屬性存在。

更進一步，如果希望提供良好的開發體驗，就不應只寫 `any`，而是要嘗試定義 `$Dialog` 的 method-level type，例如 `open()`、`close()`、`confirm()` 等實際方法的參數與回傳值。不過這需要回到 service module 原始碼確認，不能只從 plugin 入口推測。

### 6.3 情境三：新增 named export

假設 runtime 新增：

```js
export const createTheme = themeFile.createTheme;
```

這時要檢查 `types/index.d.ts` 是否也提供：

```ts
export const createTheme: (...args: any[]) => any;
```

更理想的做法是補上精確型別，但即使暫時用寬鬆型別，也應該讓 TypeScript 使用者知道這個 named export 存在。

否則會出現一種尷尬狀況：JavaScript 使用者可以正常 import，TypeScript 使用者卻可能在編譯期看不到。

---

## 7. 閱讀路線或學習路線

### 7.1 初次閱讀路線

第一次讀本主題時，建議不要一開始就鑽進 component 型別，而是先建立 plugin 層級的完整圖像。

1. 先讀 `src/index.js` 的 export 區塊，確認 runtime 對外暴露哪些 named exports 與 default export。
2. 再讀 `install(app, opts)`，觀察 plugin install 過程中讀取哪些 options、註冊哪些內容、寫入哪些 globalProperties。
3. 接著讀 `types/index.d.ts`，確認 TypeScript 是否知道 `install`、options、globalProperties。
4. 最後對照 runtime/type alignment 表，標出完整對齊、弱型別、缺少宣告的部分。

### 7.2 深入閱讀路線

建立基本對照後，可以往以下方向深入：

1. 讀 `ViewUIPlusGlobalOptions` 與 `$VIEWUI` runtime 設定，理解 config shape 與 fallback semantics。
2. 讀 `ViewUIPlusInstallOptions`，確認 install options 是否完整包含 runtime 使用的欄位。
3. 讀 `ComponentCustomProperties`，確認每個 `$...` global property 是否都有宣告。
4. 讀 `viewuiplus.components`，確認 component named exports 型別如何生成或維護。
5. 讀 package 的 type resolution 設定，例如 `package.json` 中的 `types`、`exports` 或其他 declaration 檔案，確認 `locale`、`i18n`、`lang`、`version` 是否可能在其他地方補足。

### 7.3 可以暫時跳過的部分

本章初讀時可以暫時跳過：

1. 每個 component 的 props 詳細型別。
2. `$Message`、`$Modal`、`$Notice` 等 service 的 method 實作。
3. locale bundle 的建置流程。
4. declaration file 的自動生成工具鏈。

這些都很重要，但不是本章的主線。本章主線是 plugin runtime surface 與 type surface 的對照。

---

## 8. 常見誤區

| 誤區 | 為什麼容易誤解 | 正確理解 |
| --- | --- | --- |
| runtime 有 export，就代表 TypeScript 一定能 import | JavaScript 執行與 TypeScript declaration 是不同層次 | runtime export 需要對應 `.d.ts` 宣告，TS 才能完整知道 |
| `.d.ts` 有宣告，就代表 runtime 一定存在 | 型別宣告可能和實作不同步 | 還是要回到 `src/index.js` 確認 runtime 是否真的提供 |
| `any` 代表型別已經完整 | `any` 會讓 TypeScript 放棄檢查細節 | `any` 只代表暫時接受任何操作，不代表 contract 精確 |
| `ComponentCustomProperties` 只和 Vue 無關 | 它是 Vue 3 擴充 component instance 型別的重要方式 | 只要 plugin 掛 `this.$...`，就應檢查這裡是否同步 |
| default export 能 `app.use()` 就代表 default shape 型別完整 | Vue plugin 推論可能只需要基本 install | default `API` object 內部還有 version、locale、components 等 shape，需要獨立檢查 |
| plugin type contract 等同 component props type | 兩者都屬於型別系統，但範圍不同 | 本篇只處理 plugin-level contract，component props 應放到 component type 筆記 |
| install options 和 `$VIEWUI` 一定完全一樣 | options 是使用者傳入，`$VIEWUI` 是 runtime 整理後提供給 components 的設定 | 兩者可能重疊，但 fallback、合併、預設值是 runtime 行為 |

---

## 9. 本章總結

本章的核心心智模型是：**View UI Plus plugin 的 contract 不能只看 `src/index.js`，也不能只看 `types/index.d.ts`，而是要把 runtime surface 和 type surface 放在一起檢查。**

`src/index.js` 告訴我們套件在執行時實際提供什麼能力，例如 component named exports、`install`、`version`、`locale`、`i18n`、`lang`、default `API` object，以及 install 過程中掛到 `app.config.globalProperties` 的 `$Message`、`$Modal`、`$Date` 等 instance properties。

`types/index.d.ts` 則告訴我們 TypeScript 使用者在開發時能看到什麼，包括 component type entry、`ViewUIPlusGlobalOptions`、`ViewUIPlusInstallOptions`、`ComponentCustomProperties` augmentation，以及 `install` 的型別宣告。

`install` 與 `$VIEWUI` 有基本型別對應；`$Message`、`$Modal`、`$Date` 等 instance properties 有 property-level declaration，但多數是 `any`，所以 method-level contract 不完整；`locale`、`i18n`、`lang`、`version` 與 default `API` object 從 `types/index.d.ts` 單檔看沒有完整宣告，需要後續檢查是否由其他 declaration 或 package type resolution 補足。

因此，未來閱讀或維護 View UI Plus plugin system 時，可以用一個簡單規則檢查：

> runtime 新增什麼，type surface 就要同步描述什麼；plugin install 掛了什麼，`ComponentCustomProperties` 就要同步承認什麼；install options 讀了什麼，`ViewUIPlusInstallOptions` 就要讓使用者知道可以傳什麼。

這個規則不只適用於 View UI Plus，也適用於你未來閱讀其他 Vue component library 或自己設計 plugin 時的型別維護。

---

## 10. 自我檢查問題

1. 什麼是 runtime surface？它和 type surface 有什麼差別？
2. 為什麼 `src/index.js` 有 named export，不代表 `types/index.d.ts` 一定有對應型別？
3. `install(app, opts)` 在 runtime/type 對照中屬於哪一種比較完整的契約？
4. `ComponentCustomProperties` 在 Vue 3 plugin 型別系統中負責解決什麼問題？
5. 為什麼 `$Message: any` 只能算 property-level contract，而不是完整 method-level contract？
6. `$VIEWUI: ViewUIPlusGlobalOptions` 能描述哪些資訊？哪些 runtime fallback 細節仍然不一定能從型別看出來？
7. 如果 plugin 新增 `app.config.globalProperties.$Dialog`，你應該同步檢查哪個型別區塊？
8. 如果 runtime 新增 `export const createTheme = ...`，你應該如何檢查 type surface 是否同步？
9. 為什麼本篇不深入每個 component 的 props type？那些內容應該放在哪一類筆記？
10. 從 `types/index.d.ts` 單檔看不到 `locale`、`i18n`、`lang` 的宣告時，為什麼不能直接斷定整個 package 一定沒有型別？

---

## 11. 後續延伸方向

後續可以從本章拆出以下主題：

1. **`ComponentCustomProperties` module augmentation 專題**：深入理解 Vue 3 如何讓 `this.$Message`、`this.$Modal` 這類 instance properties 被 TypeScript 辨識。
2. **`ViewUIPlusGlobalOptions` 與 `$VIEWUI` 型別分析**：對照 global options 的 runtime fallback、install options 與 component 使用方式。
3. **Imperative API service typing**：針對 `$Message`、`$Notice`、`$Modal`、`$Loading` 補 method-level contract。
4. **Locale / i18n type contract**：補齊 `locale`、`i18n`、`lang` 的參數型別、語系物件 shape 與 runtime global 依賴。
5. **Package type resolution 分析**：檢查 `package.json`、`types`、`exports`、`typesVersions` 與 declaration files 如何共同決定 TypeScript 入口。
6. **Component declaration 生成流程**：分析 `viewuiplus.components` 的來源、是否由建置工具生成，以及如何維護 component named exports 型別。
7. **Plugin runtime/type 維護清單**：整理成一份 checklist，用於未來閱讀或重構任何 Vue plugin。

---

## Related Notes

- `04-plugin-system/01-install-flow.md`
- `04-plugin-system/04-global-options-and-viewui-config.md`
- `04-plugin-system/05-global-properties.md`
- `04-plugin-system/06-locale-plugin-contract.md`
- `06-type-system/`
- `10-imperative-api/`
- `22-appendix/`
