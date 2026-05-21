# View UI Plus Plugin Design Patterns：從 `src/index.js` 抽象出的 Vue Library 設計模式

## 1. 本章定位

本章是一篇「架構分析型 + 設計模式整理型」筆記，目標是把 View UI Plus plugin system 背後的設計方式抽象出來，變成之後閱讀其他 Vue UI library，或設計自己 plugin 時可以重複使用的心智模型。

本章要解決的問題是：

> View UI Plus 為什麼可以透過一個 `src/index.js`，同時支援 `app.use(ViewUIPlus)`、全局 component、全局 directive、`this.$Message`、`this.$VIEWUI`、locale API 與 TypeScript declaration？

讀完後，你應該能理解以下幾件事：

1. View UI Plus 的 default export 為什麼是一個包含 `install` 的 `API` object。
2. named export 與 global registration 為什麼是兩條不同的使用路線。
3. component map 與 directive map 如何成為全局註冊的 source of truth。
4. `$VIEWUI` 為什麼是 library-level global config container。
5. `$Message`、`$Modal`、`$Notice` 這類 API 為什麼適合掛到 `app.config.globalProperties`。
6. runtime public surface 為什麼必須和 `types/index.d.ts` 對齊。
7. plugin system 應該負責「組裝與暴露能力」，而不是負責所有 component、directive、service 的內部實作。

本章不深入解決以下問題：

- component props、events、slots 如何設計。
- `$Message` 如何建立 DOM instance、管理 queue、執行 destroy。
- directive hook 內部如何操作 DOM。
- locale bundle 如何 build 與載入。
- CSS theme token、樣式打包、ESM / UMD build output 如何產生。
- 每個 component 的完整 TypeScript declaration。

這些內容會留到後續對應章節，例如 `07-components/`、`10-imperative-api/`、`11-directives/`、`12-style-system/`、`14-build-release/` 與 `06-type-system/`。

---

## 2. 學習前先建立的基本觀念

在整理 View UI Plus 的 plugin design patterns 前，需要先把幾個底層概念分清楚。這些概念會貫穿整個 `04-plugin-system/` 目錄。

### 2.1 Vue plugin protocol

Vue 3 的 plugin 使用方式通常是：

```js
app.use(plugin, options);
```

對 Vue 來說，只要 `plugin` 是一個有 `install(app, options)` 方法的物件，或本身就是一個 install function，就可以被 `app.use()` 安裝。View UI Plus 採用的是第一種形式：default export 是一個 `API` object，這個 object 內部包含 `install` 方法。

這代表 View UI Plus 的 plugin system 本質上是在實作一個符合 Vue plugin protocol 的入口。使用者呼叫：

```js
app.use(ViewUIPlus, options);
```

實際上就是讓 Vue 呼叫：

```js
ViewUIPlus.install(app, options);
```

因此，分析 plugin system 時，第一個要追的不是某個 component，而是 `src/index.js` 如何定義與輸出 `install`。

### 2.2 Public surface

Public surface 指的是 library 對外暴露給使用者的能力。View UI Plus 的 public surface 不只一種，它至少包含以下幾類：

| Public surface | 使用方式 | 來源 |
| --- | --- | --- |
| Default plugin | `app.use(ViewUIPlus)` | default export 的 `API.install` |
| Named exports | `import { Button } from 'view-ui-plus'` | `export * from './components'` |
| Global components | `<Button />`、`<i-button />` | `app.component(...)` |
| Global directives | `v-resize`、`v-line-clamp` | `app.directive(...)` |
| Instance properties | `this.$Message`、`this.$Modal`、`this.$VIEWUI` | `app.config.globalProperties` |
| Locale APIs | `locale()`、`i18n()`、`lang()` | package-level runtime API |
| TypeScript surface | `ViewUIPlusInstallOptions`、`ComponentCustomProperties` | `types/index.d.ts` |

這些 surface 雖然都從 package 對外提供，但它們不是同一條路線產生的。這是閱讀 UI library 入口檔時最容易混淆的地方。

### 2.3 Install side effect

`install(app, opts)` 做的事情大多不是回傳值，而是「改動 Vue app」。例如：

```js
app.component(key, ViewUI[key]);
app.directive(key, directives[key]);
app.config.globalProperties.$Message = components.Message;
app.config.globalProperties.$VIEWUI = { ... };
```

這些都是 install side effect。它們會改變 app 的 public surface，讓使用者可以在 template 或 component instance 裡使用能力。

因此，plugin design pattern 的核心問題不是「這段程式碼回傳什麼」，而是：

> `install` 對 Vue app 做了哪些註冊、注入與 public API 建立？

### 2.4 Runtime surface 與 type surface

Runtime surface 是執行時真的存在的東西，例如：

```js
app.config.globalProperties.$Message = components.Message;
```

Type surface 是 TypeScript 編譯與 IDE 提示知道的東西，例如：

```ts
declare module '@vue/runtime-core' {
    interface ComponentCustomProperties {
        $Message: any;
    }
}
```

兩者必須同步。只改 runtime 不改 types，使用者可能能跑但沒有提示；只改 types 不改 runtime，使用者可能編譯通過但執行時是 `undefined`。這就是 UI library 維護時很重要的 runtime/type contract。

---

## 3. 整體概覽

View UI Plus plugin system 可以整理成一條由內到外的組裝路線：

```txt
Source modules
  components / directives / locale / dayjs / version
        |
        v
Plugin entry
  src/index.js
        |
        v
Runtime orchestration
  install(app, opts)
        |
        v
Vue app public surface
  app.component
  app.directive
  app.config.globalProperties
        |
        v
Consumer usage
  <Button />
  v-resize
  this.$Message
  this.$VIEWUI
        |
        v
TypeScript contract
  types/index.d.ts
```

本章會把這條路線拆成幾種設計模式來看。這些模式不是彼此獨立的技巧，而是一起形成 View UI Plus 的 plugin architecture。

| Pattern | 解決的問題 | 對外效果 |
| --- | --- | --- |
| Default Plugin Export Pattern | 讓 package 可以直接被 `app.use()` 安裝 | `app.use(ViewUIPlus)` |
| Named Export + Global Registration Pattern | 同時支援按需 import 與全量安裝 | `import { Button }` 與 `<Button />` |
| Component Map Registration Pattern | 用 map 集中管理全局 component 註冊 | `app.component(key, component)` |
| Directive Map Registration Pattern | 用 map 集中管理 directive public name | `v-resize`、`v-line-clamp` |
| Global Config Container Pattern | 將 install options 整理成全局配置容器 | `this.$VIEWUI` |
| GlobalProperties Service Pattern | 將命令式 API 掛到 component instance | `this.$Message.info()` |
| Locale Adapter Pattern | 將跨 component 的語系能力提升到 plugin 層 | `locale()`、`i18n()`、`lang()` |
| Runtime / Type Contract Pattern | 保持執行時 API 與 TypeScript 宣告一致 | `types/index.d.ts` |
| Boundary Pattern | 避免入口檔承擔過多內部實作 | plugin 負責組裝，不負責所有細節 |

---

## 4. 核心內容逐步講解

### 4.1 Default Plugin Export Pattern

View UI Plus 的 default export 是一個 `API` object，而不是單純只輸出 `install` function。

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

這個 pattern 的核心是：把「可被 Vue 安裝的 plugin」與「package-level runtime APIs」聚合到同一個 default object 中。

使用者可以這樣安裝整個 UI library：

```js
import ViewUIPlus from 'view-ui-plus';

app.use(ViewUIPlus);
```

也可以透過 default object 取得一些 package-level 能力：

```js
ViewUIPlus.version;
ViewUIPlus.locale;
ViewUIPlus.lang;
```

這種設計適合 UI library，因為 UI library 通常不只是提供 component，也會提供 locale、version、imperative API、安裝函式與其他工具。透過 default object 聚合後，使用者只要記得一個主要入口，就可以完成全量安裝與查詢部分 runtime API。

不過，這個 pattern 也有成本。default object 會變大，public surface 會變得比較複雜，而且使用者可能會混淆「default object 上的東西」和「named export 出來的東西」。因此，library 作者必須清楚維護哪些 API 是 default plugin surface，哪些是 named export surface。

可以用下表理解它的取捨：

| Benefit | Cost |
| --- | --- |
| 使用者只要 default import 就能全量安裝 | default object 會變大 |
| plugin install 和 package metadata 放在同一入口 | 需要維護清楚 public surface |
| 可以兼容 Vue plugin protocol | 容易和 named exports 混淆 |
| 對 UI library 使用者友善 | tree-shaking 與按需使用需要另外設計 |

閱讀這段時要抓住一個重點：`API` object 不是單純的資料物件，它同時是 Vue plugin 的載體，也是 View UI Plus 對外展示 package 能力的入口。

---

### 4.2 Named Export + Global Registration Pattern

View UI Plus 同時支援 named export 與 global registration。這兩種方式看起來都能使用 component，但背後的路線完全不同。

```js
export * from './components';
```

這支援使用者寫：

```js
import { Button } from 'view-ui-plus';
```

這條路線是 module export surface。它不依賴 `app.use(ViewUIPlus)`，而是直接從 package export 出 component，讓使用者自己決定如何使用。

另一條路線是 global registration。當使用者呼叫：

```js
app.use(ViewUIPlus);
```

`install()` 內部會透過 `app.component(...)` 把 component 註冊到 Vue app 上。註冊完成後，使用者可以在 template 中直接寫：

```vue
<Button />
```

這兩條路線要分開理解：

| Pattern | Consumer style | Dependency | 本質 |
| --- | --- | --- | --- |
| Named export | `import { Button }` | package module export | 使用者手動 import |
| Global registration | `<Button />` after `app.use()` | Vue app install side effect | plugin 幫使用者註冊 |

這種設計非常適合 UI library，因為使用者通常有兩種需求：

第一種是快速開發。使用者希望一次 `app.use(ViewUIPlus)` 後，就可以在 template 中直接使用大量 component。這時 global registration 很方便。

第二種是控制載入範圍。使用者可能只想使用少數 component，或希望配合 bundler 做 tree-shaking。這時 named export 比較適合。

因此，named export 與 global registration 並不是互相取代，而是同一個 UI library 為不同使用情境提供的兩種入口。

---

### 4.3 Component Map Registration Pattern

View UI Plus 使用 component map 集中管理全局 component 註冊。

```js
const ViewUI = {
    ...components,
    iButton: components.Button,
    iTable: components.Table
};

Object.keys(ViewUI).forEach(key => {
    app.component(key, ViewUI[key]);
});
```

這個 pattern 的核心是「registration source of truth」。也就是說，哪些 component 會被全局註冊，不是散落在很多行 `app.component()` 裡，而是集中收斂到一個 map 中。

這樣設計有幾個好處。

第一，新增 component 的流程比較可預測。只要 component 被 `src/components/index.js` export，並被 `components` 收集，就有機會被放進 `ViewUI` map 中註冊。

第二，支援 alias 會比較簡單。View UI Plus 可以在 `ViewUI` map 中額外加入：

```js
iButton: components.Button;
iTable: components.Table;
```

這代表同一個 component 可以被註冊成不同名稱。這對舊版 API 相容、命名風格轉換或歷史包袱處理都很有用。

第三，入口檔更像 orchestration layer。它不需要知道每個 component 的內部實作，只要知道「有哪些 component 要被註冊」。

可以用下表整理：

| Design point | Meaning |
| --- | --- |
| `components` | 從 component export layer 收集所有 components |
| `ViewUI` | plugin-level registration map |
| alias entries | 額外支援舊命名或相容命名 |
| registration loop | 避免每個 component 手寫 `app.component` |

使用這個 pattern 時要注意：map 的 key 就是使用者能在 template 中使用的 public component name。修改 key 不是單純的內部重構，而可能是 breaking change。

例如：

```js
app.component('iButton', Button);
```

通常代表使用者可以在 template 中使用：

```vue
<i-button />
```

因此，component map 不只是技術實作，它也是 UI library public API 的一部分。

---

### 4.4 Directive Map Registration Pattern

directive 也使用類似的 map registration pattern。

```js
const directives = {
    display: style.display,
    resize,
    'line-clamp': lineClamp
};

Object.keys(directives).forEach(key => {
    app.directive(key, directives[key]);
});
```

這個 pattern 的重點是：把 directive 的「實作來源」和「template 使用名稱」分開。

例如：

| Source key | Template usage |
| --- | --- |
| `resize` | `v-resize` |
| `'line-clamp'` | `v-line-clamp` |
| `'bg-color'` | `v-bg-color` |

在 Vue 中，`app.directive('resize', directive)` 會讓使用者可以在 template 中寫 `v-resize`。因此，`directives` object 的 key 不是隨便的內部名稱，而是使用者會看到的 public directive API。

這個設計很適合 UI library，因為 directive 可能分散在不同檔案、不同資料夾，甚至有些 directive 來自 style helper，有些來自 DOM behavior helper。入口檔不需要展開所有細節，只需要在 plugin 安裝時，把它們整理成一張 directive registration map。

不過，directive map 的維護風險也很明顯：如果你修改了 key，例如把 `'line-clamp'` 改成 `lineClamp`，template 使用方式就會從 `v-line-clamp` 改變。這對使用者來說是破壞性變更。

因此，directive registration name 應該被視為 public API，而不是 implementation detail。

---

### 4.5 Global Config Container Pattern

View UI Plus 將 install options 整理成 `$VIEWUI`：

```js
app.config.globalProperties.$VIEWUI = {
    size: opts.size || '',
    transfer: 'transfer' in opts ? opts.transfer : '',
    modal: {
        maskClosable: opts.modal ? 'maskClosable' in opts.modal ? opts.modal.maskClosable : '' : ''
    },
    select: {
        arrow: opts.select ? opts.select.arrow ? opts.select.arrow : '' : ''
    }
};
```

這是一種 library-level config container pattern。它解決的問題是：有些配置不是單一 component instance 的局部設定，而是整個 UI library 的預設行為。

例如，使用者可能希望全站預設 component size 是 `large`，或希望所有 overlay 類 component 預設使用 `transfer`。如果每個 component 都要手動傳 prop，會非常重複。因此，UI library 會允許使用者在安裝時集中設定：

```js
app.use(ViewUIPlus, {
    size: 'large',
    transfer: true,
    modal: {
        maskClosable: false
    }
});
```

安裝後，這些設定被整理到：

```js
this.$VIEWUI;
```

component 內部再視需要讀取 `$VIEWUI` 裡的值。

這裡要分清楚三件事：

| 概念 | 說明 |
| --- | --- |
| `opts` | 使用者傳給 `app.use(ViewUIPlus, opts)` 的原始 options |
| `$VIEWUI` | View UI Plus 在 install 階段整理後掛到 `globalProperties` 的 config container |
| component consumption | component 實際讀取 `$VIEWUI` 某個 key 並改變行為 |

`$VIEWUI` 不是 component prop，也不是 Vue 的 `provide/inject`。它是掛在 `app.config.globalProperties` 上的 instance property，所以在 Options API component 中通常可以透過 `this.$VIEWUI` 取得。

使用這個 pattern 時，最需要注意的是 fallback 寫法。

一種是 key-existence check：

```js
transfer: 'transfer' in opts ? opts.transfer : '';
```

這種寫法可以保留 `false`，因為它檢查的是 key 是否存在，而不是 value 是否 truthy。

另一種是 truthy fallback：

```js
arrow: opts.select ? opts.select.arrow ? opts.select.arrow : '' : '';
```

這種寫法會把 falsy value 轉成預設值。這在處理 `false`、`0`、空字串時可能造成預期落差。

因此，global config container pattern 不只是「把 options 放進 `$VIEWUI`」，更重要的是定義 library-wide default behavior 的 contract。這個 contract 一旦暴露給使用者，就要和 `types/index.d.ts` 對齊。

---

### 4.6 GlobalProperties Service Pattern

View UI Plus 將 service-like APIs 掛到 component instance：

```js
app.config.globalProperties.$Message = components.Message;
app.config.globalProperties.$Notice = components.Notice;
app.config.globalProperties.$Modal = components.Modal;
app.config.globalProperties.$Date = dayjs;
```

這個 pattern 適合命令式 API。使用者不一定想在 template 中宣告一個 `<Message />` component，而是希望在某個事件發生時直接呼叫：

```js
this.$Message.info('Saved');
this.$Modal.confirm({ title: 'Confirm' });
this.$Date().format('YYYY-MM-DD');
```

這和 component registration 是不同的設計。

| Template component | GlobalProperties service |
| --- | --- |
| 宣告式使用 | 命令式呼叫 |
| `<Modal />` | `this.$Modal.confirm()` |
| 主要透過 props/events | 主要透過 method options |
| registration via `app.component` | injection via `globalProperties` |
| 適合畫面結構 | 適合通知、確認框、loading、工具函式 |

`$Message`、`$Notice`、`$Modal` 這類 API 通常背後仍然會建立 DOM、管理 instance、處理 queue 或 destroy，但這些不是 plugin system 的責任。plugin system 在這裡只做一件事：把 service API 掛到 Vue app 的 instance surface 上。

這個 pattern 的限制也很重要。它比較偏向 Options API 的 `this` 使用方式。在 Composition API 中，如果不使用 component instance 的 `this`，通常會改用直接 import、封裝 composable，或透過其他注入方式取得 service。這一點可以在後續筆記中補充，但本章只需要理解 View UI Plus 的 runtime public surface 是如何建立的。

另外，因為 `$Message` 是掛到 `globalProperties` 上的 instance property，所以 TypeScript 需要透過 module augmentation 告訴 Vue component instance：

```ts
declare module '@vue/runtime-core' {
    interface ComponentCustomProperties {
        $Message: any;
    }
}
```

否則 runtime 可用，IDE 卻不一定知道它存在。

---

### 4.7 Locale Adapter Pattern

View UI Plus 把 locale 能力提升到 plugin level：

```js
if (opts.locale) {
    localeFile.use(opts.locale);
}

if (opts.i18n) {
    localeFile.i18n(opts.i18n);
}

export const locale = localeFile.use;
export const i18n = localeFile.i18n;
```

這個 pattern 的核心是：語系不是單一 component 的局部問題，而是跨 component 的全局 concern。因此，它適合由 plugin system 建立 contract，再由各 component 透過統一方式讀取文案。

這個 pattern 有兩層：

| Layer | Responsibility |
| --- | --- |
| install options | 初始安裝時指定 locale / i18n adapter |
| named runtime APIs | 安裝後仍可透過 `locale`、`i18n`、`lang` 控制語系 |

在 UI library 裡，locale adapter pattern 很常見，原因是使用者的應用可能已經有自己的 i18n 系統。library 不能假設所有文案都由自己管理，也不能讓每個 component 各自處理翻譯來源。因此，plugin layer 會提供一個 adapter，讓 View UI Plus 的 locale system 可以接入使用者的 i18n 機制。

這裡要注意邊界：plugin system 只負責建立 locale contract，例如 `localeFile.use(opts.locale)` 與 `localeFile.i18n(opts.i18n)`。至於語言包如何打包、如何掛到 window、如何被 build release 產出，則屬於 `14-build-release/` 或 locale 專章，不應在本章過度展開。

---

### 4.8 Runtime / Type Contract Pattern

View UI Plus 的 plugin surface 同時存在於 runtime 和 types。

```txt
Runtime:
  src/index.js
    install(app, opts)
    app.config.globalProperties.$VIEWUI
    app.config.globalProperties.$Message

Types:
  types/index.d.ts
    ViewUIPlusInstallOptions
    ViewUIPlusGlobalOptions
    ComponentCustomProperties
```

這個 pattern 是 library 設計中非常重要的一層。因為對 TypeScript 使用者來說，public API 不只是「執行時能不能呼叫」，還包含「IDE 能不能提示」、「型別檢查能不能通過」、「錯誤能不能提前被發現」。

可以用以下表格記住維護規則：

| Runtime change | Type change |
| --- | --- |
| 新增 install option | 更新 `ViewUIPlusInstallOptions` |
| 新增 `$VIEWUI` key | 更新 `ViewUIPlusGlobalOptions` |
| 新增 global property | 更新 `ComponentCustomProperties` |
| 刪除 runtime API | 移除或 deprecated type declaration |
| 調整 service method shape | 更新對應 service API 型別 |
| 新增 named export | 更新 export declaration |

如果只改 runtime 而沒有改 types，就會出現「功能能跑，但 TypeScript 不知道」的問題。如果只改 types 而沒有改 runtime，就會出現「TypeScript 看起來合法，但執行時不存在」的問題。

因此，在閱讀 View UI Plus plugin system 時，不能只看 `src/index.js`。只要看到 `app.config.globalProperties`、install options、named exports、locale APIs，就應該同時回頭檢查 `types/index.d.ts`。

---

### 4.9 Boundary Pattern

View UI Plus 的 plugin system 應該被理解成 orchestration layer，而不是所有功能的實作層。

| Plugin system owns | Other chapters own |
| --- | --- |
| install sequence | component render / behavior |
| component registration | component props/events/slots |
| directive registration | directive hook internals |
| global config injection | component-specific config consumption |
| service API injection | service DOM / queue / destroy logic |
| locale contract | locale bundle build |
| runtime/type alignment | full component declaration tables |

這個 boundary pattern 很重要，因為大型 UI library 很容易讓入口檔變成「什麼都管」。如果 `src/index.js` 既負責註冊 component，又負責 component 行為，又負責 message DOM queue，又負責 theme token，又負責 build output，那入口檔會變得很難維護。

View UI Plus 的入口檔主要承擔的是「把已經存在的能力組裝起來，並暴露到 Vue app 或 package public surface」。它不應該負責每個 component 的細節，也不應該承擔所有 feature internals。

你可以把 plugin system 想成一個總開關與接線板：

```txt
components 已經存在
directives 已經存在
localeFile 已經存在
Message / Modal service 已經存在
dayjs 已經存在
        |
        v
src/index.js 負責把它們接到 Vue app 或 package API 上
```

這樣理解後，你在讀 source 時就比較不會把所有問題都塞回 `src/index.js`，而是能判斷問題應該往哪個目錄繼續追。

---

### 4.10 Design Checklist Pattern for Your Own Plugin

如果你要設計自己的 Vue UI library plugin，可以依序問：

| Question | View UI Plus reference | 設計意義 |
| --- | --- | --- |
| default export 是否能被 `app.use()`？ | `API.install` | 是否符合 Vue plugin protocol |
| 是否需要 named exports？ | `export * from './components'` | 是否支援按需 import |
| 是否需要全域 component registration？ | `ViewUI` map | 是否支援快速全量安裝 |
| 是否需要 component aliases？ | `iButton`、`iTable` | 是否需要相容舊命名或多命名風格 |
| 是否有 global directives？ | `directives` map | 是否提供 template-level behavior |
| 是否有 install options？ | `$VIEWUI` | 是否需要 library-wide default config |
| 是否有 command-style APIs？ | `$Message`、`$Modal` | 是否需要命令式服務入口 |
| 是否要接 i18n？ | `localeFile.use`、`localeFile.i18n` | 是否有跨 component 文案需求 |
| runtime surface 是否有 type declaration？ | `types/index.d.ts` | 是否支援 TypeScript 使用者 |
| 是否清楚區分 plugin orchestration 和 feature internals？ | `08-plugin-system-boundaries.md` | 是否避免入口檔過度膨脹 |

這張表的價值不只是幫你檢查 View UI Plus，也可以用來審視其他 UI library。例如 Element Plus、Naive UI、Ant Design Vue 這類 library，也都會遇到類似的 public surface 設計問題。

---

## 5. 表格整理

### 5.1 Plugin Design Pattern 總表

| Pattern | Source 觀察位置 | 建立的 public surface | 核心職責 | 維護風險 |
| --- | --- | --- | --- | --- |
| Default Plugin Export Pattern | `src/index.js` 的 `API` object | `app.use(ViewUIPlus)`、`ViewUIPlus.version` | 聚合 plugin install 與 package runtime API | default object 過大、public surface 混淆 |
| Named Export + Global Registration Pattern | `export * from './components'` 與 `install()` | `import { Button }`、`<Button />` | 同時支援按需 import 與全量安裝 | 使用者誤以為兩者是同一路線 |
| Component Map Registration Pattern | `ViewUI` map | 全域 components | 集中管理 component 註冊與 alias | 修改 key 可能是 breaking change |
| Directive Map Registration Pattern | `directives` map | 全域 directives | 集中管理 directive public name | key 改動會破壞 template |
| Global Config Container Pattern | `$VIEWUI` object | `this.$VIEWUI` | 儲存 library-wide options | fallback 寫法可能吞掉 falsy value |
| GlobalProperties Service Pattern | `app.config.globalProperties` | `this.$Message`、`this.$Modal` | 暴露命令式 service API | runtime/types 容易不同步 |
| Locale Adapter Pattern | `localeFile.use`、`localeFile.i18n` | `locale()`、`i18n()`、`lang()` | 管理跨 component 語系 contract | 容易和語言包 build 混在一起 |
| Runtime / Type Contract Pattern | `types/index.d.ts` | TypeScript declarations | 讓 runtime API 被 type checker 認得 | stale declaration 或 runtime undefined |
| Boundary Pattern | `src/index.js` 與其他章節邊界 | plugin orchestration layer | 控制入口檔責任範圍 | 入口檔過度膨脹 |

這張表的閱讀方式是：先看 pattern 建立了哪一種 public surface，再回到 source 觀察它是由哪個結構產生的。這樣可以避免只背「這裡有 app.component loop」，而能理解它背後是在建立 global component public API。

### 5.2 使用者能力與背後 pattern 對照表

| 使用者看到的能力 | 背後 pattern | Source 追蹤方向 | 後續筆記 |
| --- | --- | --- | --- |
| `app.use(ViewUIPlus)` | Default Plugin Export Pattern | `API.install` | `01-install-flow.md` |
| `<Button />` | Component Map Registration Pattern | `ViewUI` map + `app.component` | `02-component-registration.md` |
| `<i-button />` | Component Alias Pattern | `iButton: components.Button` | `02-component-registration.md` |
| `v-resize` | Directive Map Registration Pattern | `directives.resize` + `app.directive` | `03-directive-registration.md` |
| `this.$VIEWUI` | Global Config Container Pattern | `$VIEWUI` object | `04-global-options-and-viewui-config.md` |
| `this.$Message.info()` | GlobalProperties Service Pattern | `$Message = components.Message` | `05-global-properties.md`、`10-imperative-api/` |
| `locale()` / `i18n()` | Locale Adapter Pattern | `localeFile.use`、`localeFile.i18n` | `06-locale-plugin-contract.md` |
| TypeScript 知道 `$Modal` | Runtime / Type Contract Pattern | `ComponentCustomProperties` | `07-runtime-type-contract.md` |
| 判斷該往哪裡追 source | Boundary Pattern | plugin system vs feature internals | `08-plugin-system-boundaries.md` |

---

## 6. 範例或情境說明

### 6.1 情境一：新增一個 component

假設你要在自己的 mini UI library 中新增 `MiniTag`，可以用 View UI Plus 的 component map registration pattern 思考。

你需要做的不是到 `install()` 裡手寫一行：

```js
app.component('MiniTag', MiniTag);
```

更可維護的方式是讓它進入 component export layer，再由 component map 統一註冊：

```js
export { default as MiniTag } from './tag';
```

接著在 plugin entry 收集：

```js
import * as components from './components';

const MiniUI = {
    ...components
};

Object.keys(MiniUI).forEach((key) => {
    app.component(key, MiniUI[key]);
});
```

這樣新增 component 的流程就能保持一致。你也可以額外加入 alias：

```js
const MiniUI = {
    ...components,
    MTag: components.MiniTag
};
```

但一旦 alias 對外公開，就要把它當成 public API 維護。

### 6.2 情境二：新增一個 `$Confirm` service

如果你要新增一個命令式確認框 API，例如：

```js
this.$Confirm.open({ title: 'Delete?' });
```

你需要檢查兩層。

第一層是 runtime：

```js
app.config.globalProperties.$Confirm = Confirm;
```

第二層是 type surface：

```ts
declare module '@vue/runtime-core' {
    interface ComponentCustomProperties {
        $Confirm: {
            open(options: { title: string }): void;
        };
    }
}
```

如果只做第一層，功能可能能跑，但 TypeScript 不知道 `$Confirm`。如果只做第二層，IDE 可能有提示，但執行時 `this.$Confirm` 是 `undefined`。這就是 runtime/type contract pattern 的實際價值。

### 6.3 情境三：新增一個全局設定

假設你要新增 button 預設圓角設定：

```js
app.use(MiniUI, {
    button: {
        rounded: true
    }
});
```

你需要先決定 `$VIEWUI` 的 shape：

```js
app.config.globalProperties.$VIEWUI = {
    button: {
        rounded: opts.button && 'rounded' in opts.button
            ? opts.button.rounded
            : false
    }
};
```

接著要讓對應 component 讀取：

```js
this.$VIEWUI.button.rounded;
```

最後還要補型別：

```ts
interface MiniUIOptions {
    button?: {
        rounded?: boolean;
    };
}
```

這個例子說明：global config container pattern 不是只在 install 中多放一個 key，而是會牽涉 options、runtime container、component consumption 與 type declaration 四個地方。

---

## 7. 閱讀路線或學習路線

### 7.1 初次閱讀路線

第一次閱讀本主題時，建議不要一開始就跳到每個 component 的 source。你應該先建立 plugin system 的外框。

1. 先讀 `src/index.js` 的 import 區域，觀察它收集了哪些能力，例如 components、directives、locale、dayjs、version。
2. 再讀 `API` object，理解 default export 為什麼可以同時作為 plugin 與 package-level API container。
3. 接著讀 `install(app, opts)`，只看它對 Vue app 做了哪些 side effects。
4. 然後讀 component map 與 directive map，理解全局註冊的 source of truth。
5. 再讀 `$VIEWUI` 與 `globalProperties`，理解 config container 與 service API injection。
6. 最後讀 `types/index.d.ts`，確認 runtime surface 在 TypeScript 中如何被描述。

### 7.2 深入閱讀路線

建立基本心智模型後，可以依你想深入的方向拆分閱讀。

1. 若要研究全局 component registration，讀 `04-plugin-system/02-component-registration.md`。
2. 若要研究 directive 名稱與 hook 行為，先讀 `04-plugin-system/03-directive-registration.md`，再跳到 `11-directives/`。
3. 若要研究 `$VIEWUI` options 如何被 component 使用，讀 `04-plugin-system/04-global-options-and-viewui-config.md`，再追對應 component source。
4. 若要研究 `$Message`、`$Modal` 的內部實作，先讀 `04-plugin-system/05-global-properties.md`，再跳到 `10-imperative-api/`。
5. 若要研究 TypeScript declaration，讀 `04-plugin-system/07-runtime-type-contract.md`，再延伸到 `06-type-system/`。

### 7.3 可以暫時跳過的部分

如果目前目標只是理解 plugin design patterns，可以先暫時跳過：

- component render function 或 template 細節。
- `$Message` DOM instance 建立細節。
- directive hook 中具體 DOM 操作。
- locale bundle build output。
- CSS theme token 與樣式編譯流程。
- bundler 產物格式與發版流程。

這些內容都很重要，但它們不是本章的主軸。本章要建立的是 plugin orchestration 的設計骨架。

---

## 8. 常見誤區

| 誤區 | 為什麼容易誤解 | 正確理解 |
| --- | --- | --- |
| `import { Button }` 成功，所以 `<Button />` 一定也能用 | 兩者看起來都是使用 Button | named export 與 global registration 是不同路線；`<Button />` 依賴 `app.use()` 後的 `app.component` 註冊 |
| default export 只是單純匯出 component 集合 | `API` object 內有 `...components` | default export 同時是 Vue plugin 載體，關鍵在於它包含 `install` |
| component alias 是 Vue 自動產生的 | Vue template 會自動處理 kebab-case | `iButton` 這類 alias 需要明確存在於 registration map 中 |
| directive key 只是內部命名 | directive map 看起來像普通 object | directive key 會決定 `v-xxx` 的 public API 名稱 |
| `$VIEWUI` 是 props 或 provide/inject | component 可以透過 `this.$VIEWUI` 讀到 | `$VIEWUI` 是掛在 `app.config.globalProperties` 上的 instance property |
| `globalProperties` 適合放所有工具 | 掛上去很方便 | 只適合真正需要 instance-level access 的 service 或全局設定；過度使用會污染 instance surface |
| TypeScript declaration 會創造 runtime API | 宣告後 IDE 有提示 | declaration 只告訴 TypeScript 有這個屬性，不會真的在 runtime 建立它 |
| runtime 可用就不需要 types | JavaScript 使用者可能不受影響 | 對 TypeScript 使用者來說，types 是 public API 的一部分 |
| plugin system 應該負責所有功能細節 | 所有能力都從 `app.use()` 進來 | plugin system 主要負責組裝與暴露能力，feature internals 應由各自模組負責 |
| locale 是每個 component 自己管理即可 | 文案出現在 component 裡 | UI library 的 locale 是跨 component concern，適合由 plugin-level adapter 建立統一 contract |

---

## 9. 本章總結

View UI Plus 的 plugin system 可以理解成一個 library public surface 的組裝層。它透過 default `API` object 滿足 Vue plugin protocol，讓使用者可以呼叫 `app.use(ViewUIPlus)`；透過 named exports 支援按需 import；透過 component map 與 directive map 建立全局 template 能力；透過 `$VIEWUI` 承接 install options 並形成 library-wide config container；透過 `app.config.globalProperties` 暴露 `$Message`、`$Modal`、`$Notice`、`$Date` 等命令式 API；透過 locale adapter 處理跨 component 的語系需求；最後透過 `types/index.d.ts` 讓 runtime public surface 能被 TypeScript 正確認得。

這些設計不是零散技巧，而是一組互相配合的 Vue library design patterns。它們共同回答一個問題：大型 UI library 如何把分散在不同模組的能力，整理成使用者容易理解、容易安裝、容易使用、也容易被 TypeScript 支援的 public API。

閱讀這類 source 時，最重要的是不要把所有問題都塞進 `src/index.js`。`src/index.js` 的主要責任是 orchestration，也就是「收集、註冊、注入、暴露」。至於 component 如何 render、directive 如何操作 DOM、service 如何管理 instance、locale bundle 如何 build，應該回到各自的模組與章節處理。

對你之後學習 View UI Plus、FormKit、PPTist 或其他前端開源專案來說，這種「先看入口如何組裝 public surface，再追各功能內部實作」的閱讀方式，會比直接鑽進細節更穩定，也更容易建立架構感。

---

## 10. 自我檢查問題

1. 為什麼 View UI Plus 的 default export 要是一個包含 `install` 的 `API` object，而不是只 export 一個 function？
2. `import { Button } from 'view-ui-plus'` 和 `<Button />` 在使用路線上有什麼差異？
3. `ViewUI` component map 在 plugin system 中扮演什麼角色？為什麼它可以被視為 registration source of truth？
4. 為什麼 `iButton`、`iTable` 這類 alias 不是 Vue 自動產生的？
5. directive map 的 key 為什麼要被視為 public API？
6. `$VIEWUI` 解決了什麼問題？它和 component props 有什麼差異？
7. `this.$Message` 這類 service API 為什麼適合掛在 `app.config.globalProperties`？
8. 為什麼新增一個 `$Confirm` runtime API 時，也要同步修改 `types/index.d.ts`？
9. locale adapter pattern 為什麼適合放在 plugin level，而不是每個 component 自己處理？
10. plugin system 的 boundary 是什麼？哪些問題不應該在 `src/index.js` 中深入解決？

---

## 11. 後續延伸方向

這份筆記之後可以延伸成以下主題：

1. `04-plugin-system/01-install-flow.md`：完整追蹤 `app.use(ViewUIPlus, options)` 到 `install(app, opts)` 的流程。
2. `04-plugin-system/02-component-registration.md`：深入整理 `components`、`ViewUI` map、alias 與 `app.component` 的關係。
3. `04-plugin-system/03-directive-registration.md`：整理 directive map、template usage name 與 directive hook 邊界。
4. `04-plugin-system/04-global-options-and-viewui-config.md`：深入分析 `$VIEWUI` 的 option shape、fallback 規則與 component consumption。
5. `04-plugin-system/05-global-properties.md`：整理 `$Message`、`$Notice`、`$Modal`、`$Date` 等 instance API 的註冊方式。
6. `04-plugin-system/06-locale-plugin-contract.md`：分析 locale / i18n adapter 在 plugin system 中的 contract。
7. `04-plugin-system/07-runtime-type-contract.md`：對照 `src/index.js` 與 `types/index.d.ts`，整理 runtime/type 對齊規則。
8. `04-plugin-system/08-plugin-system-boundaries.md`：專門整理 plugin orchestration layer 與 feature internals 的邊界。
9. `04-plugin-system/10-build-a-mini-plugin.md`：用 mini plugin 實作本章提到的 pattern，從實作角度驗證理解。
10. `10-imperative-api/`：深入 `$Message`、`$Modal` 這類命令式 API 的 DOM rendering、queue 與 destroy 機制。
