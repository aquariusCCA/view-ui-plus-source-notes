# View UI Plus Plugin Debugging Checklist：插件系統除錯路線

## 1. 本章定位

本章的目標是建立一套 View UI Plus plugin system 的除錯路線。它不是要深入分析某一個元件、某一個 directive、或某一個 service API 的內部實作，而是要協助讀者在 plugin system 出問題時，能夠快速判斷問題發生在哪一層，並知道第一個該看的檔案是哪裡。

這篇筆記主要解決以下問題：

1. `app.use(ViewUIPlus, options)` 看起來沒有生效時，要怎麼排查？
2. 全域 component，例如 `<Button />` 或 `<i-button />` 找不到時，要怎麼判斷是註冊問題還是使用方式問題？
3. directive，例如 `v-resize`、`v-line-clamp`、`v-bg-color` 找不到時，要怎麼追？
4. `this.$Message`、`this.$Modal`、`this.$Notice` 等 instance properties 找不到時，要怎麼確認 runtime 掛載？
5. `$VIEWUI` 設定沒有被元件正確讀取時，要怎麼檢查 options、fallback 與 component source？
6. locale 沒有切換時，要怎麼判斷是 plugin contract 問題，還是語言包載入問題？
7. TypeScript 有提示但 runtime 不能用，或 runtime 可用但 TypeScript 沒提示時，要怎麼判斷 runtime/type contract mismatch？

本章不深入處理以下內容：

- `$Message`、`$Modal`、`$Notice` 的 DOM rendering、queue、destroy 等 service 內部流程。
- `v-resize`、`v-line-clamp` 等 directive 的 DOM hook 細節。
- 單一 component 的 props、events、slots 設計。
- CSS 打包、theme token、樣式變數與 build output。
- 語言包如何被打包成獨立產物，以及如何掛到瀏覽器全域物件。

這些內容會留到 `10-imperative-api/`、`11-directives/`、`07-components/`、`12-style-system/`、`14-build-release/` 等後續主題筆記。

---

## 2. 學習前先建立的基本觀念

在閱讀這份 debugging checklist 前，需要先建立一個核心觀念：View UI Plus plugin system 的工作，不是直接讓每個功能「自然存在」，而是透過 `install(app, opts)` 對 Vue app 施加一系列 side effects。這些 side effects 包含全域註冊 component、全域註冊 directive、寫入 `app.config.globalProperties`、建立 `$VIEWUI` 全域設定容器，以及建立 locale/i18n 相關 contract。

換句話說，當你遇到 View UI Plus 的能力不能使用時，不應該只問「這個功能壞了嗎？」而是要先問：

```txt
這個能力是透過哪一條 public surface 暴露給使用者的？
```

View UI Plus plugin system 常見的 public surface 可以分成幾類。

| Public surface | 使用方式 | 背後依賴 |
| --- | --- | --- |
| Default plugin export | `app.use(ViewUIPlus, options)` | default export 的 `API.install` |
| Global components | `<Button />`、`<i-button />` | `install()` 中的 `app.component()` loop |
| Global directives | `v-resize`、`v-line-clamp` | `install()` 中的 `app.directive()` loop |
| Instance properties | `this.$Message`、`this.$Modal`、`this.$VIEWUI` | `app.config.globalProperties` |
| Named exports | `import { Button } from 'view-ui-plus'` | package/module export surface |
| TypeScript surface | `this.$Message` 有提示、`app.use` options 有型別 | `types/index.d.ts` |

這幾個 surface 很容易被混在一起，但它們其實是不同的入口。例如，`import { Button } from 'view-ui-plus'` 成功，只代表 package 有輸出 `Button` 這個 named export；它不代表 `<Button />` 已經被註冊到某個 Vue app 上。全域使用 `<Button />` 需要 `app.use(ViewUIPlus)` 真的執行，並且 `install()` 內部真的呼叫 `app.component('Button', Button)` 或等價邏輯。

同理，TypeScript 裡 `this.$Message` 有提示，也不代表 runtime 一定存在 `$Message`。TypeScript declaration 只是開發期的型別描述；真正能不能在 component instance 上存取到 `$Message`，要看 `src/index.js` 的 `install()` 是否真的把 `components.Message` 掛到 `app.config.globalProperties.$Message`。

因此，本章的除錯思路可以濃縮成一句話：

```txt
先判斷使用方式，再追 runtime source，接著確認 install side effect，最後確認 consumer access path 和 type declaration。
```

---

## 3. 整體概覽

這份 debugging checklist 主要圍繞四個 source 檔案展開：

| 檔案 | 在 plugin system 中的角色 | 除錯時主要看什麼 |
| --- | --- | --- |
| `01-origin/source/view-ui-plus-v1.3.20/src/index.js` | plugin runtime entry | `install(app, opts)`、component/directive registration、`globalProperties`、`$VIEWUI`、locale 呼叫 |
| `01-origin/source/view-ui-plus-v1.3.20/types/index.d.ts` | TypeScript public contract | `ViewUIPlusInstallOptions`、`ComponentCustomProperties`、全域 instance properties 宣告 |
| `01-origin/source/view-ui-plus-v1.3.20/src/components/index.js` | component named export 入口 | `Button`、`Table`、`Input` 等是否被 export |
| `01-origin/source/view-ui-plus-v1.3.20/src/locale/index.js` | locale runtime contract | `localeFile.use()`、`localeFile.i18n()` 是否接收到正確參數 |

除錯時，不應該一開始就鑽進某個 component 的內部實作。比較好的流程是先確認錯誤屬於哪一種 surface。

```txt
使用者程式碼
  |
  |-- app.use(ViewUIPlus, options)
  |     |
  |     v
  |   src/index.js
  |     |
  |     |-- install(app, opts)
  |     |-- app.component(...)
  |     |-- app.directive(...)
  |     |-- app.config.globalProperties.$VIEWUI = ...
  |     |-- app.config.globalProperties.$Message = ...
  |     |-- localeFile.use(...)
  |
  |-- import { Button } from 'view-ui-plus'
  |     |
  |     v
  |   src/components/index.js / package export surface
  |
  |-- TypeScript 提示
        |
        v
      types/index.d.ts
```

這個概覽可以幫你把問題先分類：

| 問題類型 | 優先檢查 |
| --- | --- |
| plugin 沒裝起來 | `app.use(ViewUIPlus, options)`、default import、`install()` |
| component 全域不能用 | `src/components/index.js`、`ViewUI` map、`app.component()` loop |
| component alias 不能用 | `ViewUI` map 是否明確加入 alias |
| directive 不能用 | `directives` map、`app.directive()` loop、template directive name |
| instance property 不能用 | `app.config.globalProperties` |
| `$VIEWUI` 設定怪怪的 | options 是否傳入、`$VIEWUI` object 是否建立、fallback 寫法 |
| locale 沒生效 | `opts.locale`、`opts.i18n`、`localeFile.use()`、`localeFile.i18n()` |
| TypeScript 沒提示或提示錯 | `types/index.d.ts` |

---

## 4. 核心內容逐步講解

### 4.1 第一個問題：這個能力是透過哪種方式使用的？

遇到 plugin system 問題時，第一個問題不是「哪個檔案壞了」，而是「使用者原本想透過哪一種方式取得能力」。

```txt
這個能力是透過 app.use(ViewUIPlus) 安裝出來的，
還是透過 named import 直接使用的？
```

這個問題可以避免你把不同 surface 混在一起。例如：

```js
import { Button } from 'view-ui-plus';
```

這條路線走的是 module export surface。它的重點是 package 是否有把 `Button` 匯出，和 Vue app 有沒有安裝 plugin 不一定直接相關。

但是：

```vue
<template>
  <Button>Save</Button>
</template>
```

如果你沒有在任何地方寫：

```js
app.use(ViewUIPlus);
```

那 `<Button />` 就未必能作為全域 component 使用，因為全域 component 依賴的是 `install()` 中的 `app.component()` 註冊流程。

同理：

```js
this.$Message.info('Saved');
```

這不是 named import，而是 Vue component instance 的 property。它依賴 `app.config.globalProperties.$Message = components.Message` 這類 runtime side effect。

所以，排查時可以先用下表分類：

| 使用方式 | 代表問題可能在哪裡 | 第一個檢查點 |
| --- | --- | --- |
| `app.use(ViewUIPlus)` | plugin install 沒執行或提前 return | application entry、default import、`install()` |
| `<Button />` | 全域 component registration | `ViewUI` map、`app.component()` |
| `<i-button />` | alias registration | `ViewUI` map 中是否有 `iButton` |
| `v-resize` | directive registration | `directives` map、`app.directive()` |
| `this.$Message` | instance globalProperties | `app.config.globalProperties.$Message` |
| `this.$VIEWUI` | 全域設定容器 | `app.config.globalProperties.$VIEWUI` |
| `import { Button }` | named export | `src/components/index.js` |
| TypeScript 提示 | declaration contract | `types/index.d.ts` |

這個分類是整份筆記的核心。只有先分類正確，後續才不會在錯誤的檔案中浪費時間。

---

### 4.2 `app.use(ViewUIPlus)` 沒有效果

如果 `app.use(ViewUIPlus, options)` 看起來沒有產生效果，通常要先確認 plugin 是否真的被 Vue app 安裝。Vue plugin 的協議是：當你呼叫 `app.use(plugin, options)` 時，Vue 會尋找 plugin 上的 `install` 方法，並呼叫它。

因此，第一層要檢查的是使用者端入口，例如 `main.js` 或 `main.ts`：

```js
import { createApp } from 'vue';
import ViewUIPlus from 'view-ui-plus';
import App from './App.vue';

const app = createApp(App);

app.use(ViewUIPlus, {
  size: 'large',
  transfer: true
});

app.mount('#app');
```

接著要檢查 default import 是否正確。對全量安裝來說，應該是：

```js
import ViewUIPlus from 'view-ui-plus';
```

而不是只 import 某個 named export：

```js
import { Button } from 'view-ui-plus';
```

因為 named import 並不會自動對 Vue app 執行 `install()`。

第三層是檢查 plugin object 是否真的有 `install` 方法。View UI Plus 的 plugin entry 對應 `src/index.js` 中的 default `API`，這個 `API` object 應該包含 `install`。

```js
if (install.installed) return;
```

這代表 source 有防止重複安裝的意圖。目前 source 片段沒有看到 `install.installed = true`。這表示 guard 的意圖存在，但如果沒有真正設值，它就不會產生實際防重複效果。這類現象很適合記錄到 `07-runtime-type-contract.md` 或 maintenance checklist，因為它反映的是「設計意圖」與「實際實作」之間的差異。

另外，如果專案裡有多個 Vue app instance，也要注意每個 app 都要個別 install。`app.use(ViewUIPlus)` 是對特定 app instance 生效，不是對整個瀏覽器環境或所有 Vue app 全域生效。

---

### 4.3 全域 Component 不能用

當你在 template 中看到類似錯誤：

```txt
Failed to resolve component: Button
```

這通常代表 Vue 在目前 app 的 component registry 裡找不到 `Button`。對 View UI Plus 的全量 plugin 安裝來說，要讓 `<Button />` 可用，需要通過以下路線：

```txt
src/components/index.js
  export { default as Button } from './button'
        |
        v
src/index.js
  import * as components from './components'
        |
        v
ViewUI map
  {
    ...components,
    iButton: components.Button,
    ...
  }
        |
        v
install(app, opts)
  Object.keys(ViewUI).forEach(key => {
    app.component(key, ViewUI[key])
  })
```

這條路線中，只要任一環節出問題，template 裡的 `<Button />` 都可能找不到。

第一個要看的是 `src/components/index.js` 是否有 export 該 component。例如：

```js
export { default as Button } from './button';
```

如果這裡沒有 export，`src/index.js` 的 `import * as components from './components'` 就拿不到 `Button`。

第二個要看的是 `src/index.js` 是否真的把 `components` 收斂到 `ViewUI` map 裡。View UI Plus 不是只單純使用 `components`，而是會建立包含 aliases 的 `ViewUI` map。

第三個要看的是 `install()` 是否真的執行 `app.component()` loop：

```js
Object.keys(ViewUI).forEach((key) => {
  app.component(key, ViewUI[key]);
});
```

第四個要看的是 template 使用名稱是否和註冊 key 能對上。例如 `Button` 註冊後，template 中通常可用 `<Button />` 或 kebab-case 形式；而 `iButton` 註冊後，template 中通常可用 `<i-button />`。

這裡最常見的誤解是：

```txt
import { Button } 成功，不代表 <Button /> 一定能全域使用。
```

`import { Button }` 只是 module-level named export；全域 `<Button />` 則依賴 `app.use(ViewUIPlus)` 以及 `app.component()` 註冊流程。

---

### 4.4 Component Alias 不能用

View UI Plus 額外提供了一些 component alias，例如：

```js
iButton: components.Button,
iTable: components.Table,
iInput: components.Input
```

這種 alias 的重點在於：它不是自動從 component name 推導出來的，而是 `ViewUI` map 中明確寫進去的 key。

因此，如果 `<i-button />` 不能用，要檢查三件事。

第一，`ViewUI` map 裡是否真的存在 `iButton`。如果 `ViewUI` 只有 `Button`，那 `<Button />` 可能可用，但 `<i-button />` 不一定可用。

第二，template casing 是否正確。一般來說，Vue template 會把 kebab-case 對應到 PascalCase/camelCase 註冊名稱，所以 `iButton` 註冊後，template 常見使用形式是 `<i-button />`。

第三，是否只是使用 named import。假設你只寫：

```js
import { Button } from 'view-ui-plus';
```

這不會自動註冊 `iButton` alias。alias 是全量 plugin installation 過程中透過 `app.component()` 掛上去的 runtime surface。

所以，alias 問題本質上不是 component source 問題，而是 registration map 問題。除錯時應優先回到 `src/index.js` 看 `ViewUI` map，而不是直接跳到 `button` component 內部。

---

### 4.5 Directive 不能用

當你看到類似錯誤：

```txt
Failed to resolve directive: resize
```

代表 Vue 在目前 app 的 directive registry 裡找不到 `resize` 這個 directive。

View UI Plus 的 directive 註冊路線大致如下：

```txt
src/directives/*
        |
        v
src/index.js
  directives = {
    resize,
    'line-clamp': lineClamp,
    'bg-color': style.bgColor,
    ...
  }
        |
        v
install(app, opts)
  Object.keys(directives).forEach(key => {
    app.directive(key, directives[key])
  })
        |
        v
template
  v-resize
  v-line-clamp
  v-bg-color
```

directive 除錯時最重要的觀念是：

```txt
template 裡的 directive 名稱，來自 directives object 的 key，不一定等於檔名。
```

例如：

```txt
directives['line-clamp'] -> v-line-clamp
directives['bg-color']   -> v-bg-color
directives.resize        -> v-resize
```

因此，排查 directive 不能用時，不要只看 `src/directives/` 裡有沒有某個檔案，還要看 `src/index.js` 是否有 import 該 directive，是否把它放入 `directives` map，以及 map 的 key 是什麼。

如果 directive 已經註冊成功，但 DOM 行為不符合預期，例如 resize 偵測沒有觸發、line clamp 沒有套用，這時就超出 plugin system 的範圍，應該跳到 `11-directives/` 追 directive hook 與 DOM 操作邏輯。

---

### 4.6 `$Message` / `$Modal` 找不到

當你看到：

```txt
this.$Message is undefined
this.$Modal is undefined
```

通常代表 Vue component instance 上沒有對應的 global property。這類問題和 component 全域註冊不同，它走的是 `app.config.globalProperties`。

View UI Plus 的路線可以理解為：

```txt
components.Message
components.Modal
components.Notice
        |
        v
install(app, opts)
  app.config.globalProperties.$Message = components.Message
  app.config.globalProperties.$Modal = components.Modal
  app.config.globalProperties.$Notice = components.Notice
        |
        v
Options API component instance
  this.$Message
  this.$Modal
  this.$Notice
```

排查時要先確認是否真的呼叫了：

```js
app.use(ViewUIPlus);
```

如果沒有執行 `install()`，就不會有 `app.config.globalProperties` 的掛載動作。

第二，要確認使用位置是不是 Vue component instance。`this.$Message` 是 instance surface，主要對 Options API component instance 友善。如果你在普通 JavaScript module、setup 外部、或其他非 component instance 的位置直接使用 `this.$Message`，就不能期待它自然存在。

第三，要看 `src/index.js` 是否有掛對 key，例如：

```js
app.config.globalProperties.$Message = components.Message;
app.config.globalProperties.$Modal = components.Modal;
app.config.globalProperties.$Notice = components.Notice;
```

第四，要看 runtime value 是否來自正確來源。例如 `$Message` 是否對應 `components.Message`，而不是拼錯或漏掉 import。

這裡也要分清楚兩種寫法：

```js
import { Message } from 'view-ui-plus';
```

和：

```js
this.$Message.info('Saved');
```

前者是 module-level named export；後者是 Vue app install 後的 instance property。兩者可能指向同一個 service object，但它們的取得路線不同，除錯方向也不同。

---

### 4.7 `$VIEWUI` 設定沒生效

`$VIEWUI` 是 View UI Plus plugin system 用來存放 install options 的 runtime container。它不是 component prop，也不是 provide/inject，而是被寫到：

```js
app.config.globalProperties.$VIEWUI
```

使用者可能會這樣安裝：

```js
app.use(ViewUIPlus, {
  size: 'large',
  transfer: true,
  modal: {
    maskClosable: false
  },
  select: {
    arrow: 'ios-arrow-down'
  }
});
```

接著 plugin 會在 `install(app, opts)` 裡整理 options，建立 `$VIEWUI`：

```txt
install(app, opts)
        |
        v
app.config.globalProperties.$VIEWUI = {
  size,
  transfer,
  capture,
  modal,
  select,
  ...
}
        |
        v
component instance reads:
  this.$VIEWUI
```

如果 `$VIEWUI` 設定沒有生效，排查時要分幾層。

第一，options 是否真的作為 `app.use()` 的第二個參數傳入：

```js
app.use(ViewUIPlus, options);
```

第二，`src/index.js` 的 `$VIEWUI` object 是否有對應 key。假設你傳了 `select.arrow`，但 `$VIEWUI` 根本沒有整理 `select`，那 component 當然讀不到。

第三，fallback 寫法是否吞掉合法的 falsy value。

第一種是 key-existence check：

```js
capture: 'capture' in opts ? opts.capture : true
transfer: 'transfer' in opts ? opts.transfer : ''
```

這種寫法的好處是可以保留 `false`。例如使用者明確傳入：

```js
app.use(ViewUIPlus, {
  capture: false
});
```

因為 `'capture' in opts` 為 true，所以最後會保留 `false`。

第二種是 truthy fallback：

```js
arrow: opts.select ? opts.select.arrow ? opts.select.arrow : '' : ''
```

這種寫法會把 falsy value，例如 `''`、`0`、`false`，轉成 fallback 值。這不一定是 bug，要看該 option 是否允許 falsy value；但如果你在追 config bug，就必須看清楚 source 使用的是 key-existence check 還是 truthy fallback。

第四，component 是否真的讀 `$VIEWUI` 的該 key。Plugin system 只負責把 options 整理到 `$VIEWUI`；至於某個 component 是否有讀 `$VIEWUI.modal.maskClosable`，就要跳到該 component source 追。

第五，TypeScript 是否允許該 option。`ViewUIPlusGlobalOptions` 只是型別描述；如果 runtime 有 key 但 type 沒寫，使用 TypeScript 時可能會報錯。相反，如果 type 有寫但 runtime 沒處理，則會出現 stale declaration 問題。

---

### 4.8 Locale 沒切換

locale 問題需要先區分兩件事：plugin system 負責建立 locale contract，但語言包如何 build、如何載入，屬於另一個主題。

在 plugin system 層，主要看 `install(app, opts)` 是否處理：

```txt
opts.locale -> localeFile.use(opts.locale)
opts.i18n   -> localeFile.i18n(opts.i18n)
```

如果 locale 沒切換，第一步要確認使用者是否真的傳入：

```js
app.use(ViewUIPlus, {
  locale: zhTW
});
```

或：

```js
app.use(ViewUIPlus, {
  i18n: someI18nAdapter
});
```

第二步看 `src/index.js` 是否有在 `install()` 裡呼叫 `localeFile.use(opts.locale)` 或 `localeFile.i18n(opts.i18n)`。

第三步看 `src/locale/index.js` 的 `localeFile.use()` 是否收到正確的 language object。

第四步才是檢查 component 是否透過 locale mixin 或 `t` 函式讀取文案。這一步通常要跳到 `src/mixins/locale.js` 或對應 component source。

第五步，如果使用 `lang(code)` 類型的載入方式，還要確認語言包是否已掛到：

```txt
window['viewuiplus/locale']
```

這裡要注意，本章不深入處理語言包 build 和載入機制。若問題是語言包檔案本身沒有被正確產出、沒有被打包、或沒有被瀏覽器載入，就應該跳到 `14-build-release/`。

---

### 4.9 TypeScript 有問題

TypeScript 問題通常不是 runtime 真的不能用，而是 type surface 和 runtime surface 沒有對齊。

常見情境如下：

| 症狀 | 可能問題層 |
| --- | --- |
| `app.use(ViewUIPlus, { ... })` options 報錯 | `ViewUIPlusInstallOptions` 或相關 options 型別 |
| `this.$Message` 沒提示 | `ComponentCustomProperties` 沒宣告 |
| runtime 有 `$Copy` 但 types 沒有 | runtime/type contract mismatch |
| types 有 key 但 runtime 沒掛 | stale declaration |
| component named import 沒型別 | component declarations / export declarations |

plugin system 的 TypeScript 檢查重點是：

```txt
types/index.d.ts
```

特別是兩個部分：

1. `install(app, options)` 接受什麼 options。
2. `declare module '@vue/runtime-core'` 裡的 `ComponentCustomProperties` 是否宣告 `$VIEWUI`、`$Message`、`$Modal` 等 instance properties。

需要注意的是，TypeScript declaration 是「承諾」，不是 runtime 行為本身。如果 declaration 寫了：

```ts
declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $Message: any;
  }
}
```

但 `src/index.js` 沒有寫：

```js
app.config.globalProperties.$Message = components.Message;
```

那 TypeScript 會讓你寫 `this.$Message`，但 runtime 仍然可能是 `undefined`。

反過來，如果 `src/index.js` 有掛：

```js
app.config.globalProperties.$Copy = components.Copy;
```

但 `types/index.d.ts` 沒有宣告 `$Copy`，那 runtime 可以用，但 TypeScript 可能沒有提示或報錯。

所以當你新增、刪除或調整 `globalProperties` 時，不能只改 `src/index.js`，也要同步檢查 `types/index.d.ts`。

---

### 4.10 固定 Debug Route

```txt
1. Confirm usage style
   app.use / named import / instance property / directive

2. Confirm runtime source
   src/index.js / src/components/index.js / src/locale/index.js

3. Confirm install side effect
   app.component / app.directive / globalProperties / localeFile.use

4. Confirm consumer access path
   template / this.$... / import / TypeScript

5. Confirm boundary
   plugin system or component/service/directive internals
```

這條路線的價值在於它能避免一開始就鑽進錯誤層級。很多 plugin system 的問題並不是元件本身壞掉，而是使用者沒有透過正確 surface 取得能力。

例如，`<Button />` 找不到，不代表 `Button` component source 有 bug；它可能只是 `app.use(ViewUIPlus)` 沒有執行，或 `ViewUI` map 沒有包含 `Button`。`this.$Message` 是 `undefined`，也不代表 message service 內部壞掉；它可能只是 `globalProperties` 沒掛上去。

因此，這條 route 最適合當作你閱讀 View UI Plus plugin system 時的除錯總綱。

---

## 5. 表格整理

### 5.1 Plugin system 分層排查表

| 層級 | 代表問題 | 第一個檢查點 | 常見誤判 |
| --- | --- | --- | --- |
| 使用者安裝層 | `app.use(ViewUIPlus)` 沒有效果 | `main.js` / `main.ts` 是否呼叫 `app.use` | 以為 named import 會自動安裝 plugin |
| Plugin entry 層 | plugin object 沒有正確進入 `install()` | `src/index.js` default `API` 是否包含 `install` | 只看 component source，不看 plugin entry |
| Component registration 層 | `<Button />` 找不到 | `src/components/index.js`、`ViewUI` map、`app.component()` loop | 以為 `import { Button }` 成功就等於全域註冊成功 |
| Alias registration 層 | `<i-button />` 找不到 | `ViewUI` map 是否明確有 `iButton` | 以為 alias 會自動由 component name 產生 |
| Directive registration 層 | `v-resize` 找不到 | `directives` map、`app.directive()` loop | 以為 directive 名稱一定等於檔名 |
| Instance property 層 | `this.$Message` 是 `undefined` | `app.config.globalProperties.$Message` | 把 module named export 和 instance property 混在一起 |
| Global config 層 | `$VIEWUI` 設定沒生效 | `app.use` 第二參數、`$VIEWUI` object、fallback 寫法 | 忽略 falsy value 被 fallback 吞掉 |
| Locale contract 層 | 語系沒切換 | `opts.locale`、`opts.i18n`、`localeFile.use()` | 把 plugin contract 問題和語言包 build 問題混在一起 |
| Type surface 層 | TypeScript 沒提示或提示錯 | `types/index.d.ts` | 以為 type declaration 一定代表 runtime 存在 |

這張表的閱讀方式是：先從「症狀」判斷層級，再找第一個檔案或流程，而不是一開始就進入最深層實作。plugin system 的很多 bug 都是 public surface 對不上，而不是內部邏輯壞掉。

---

### 5.2 快速症狀表

| 症狀 | 第一個要檢查的檔案 / 位置 | 下一篇筆記 |
| --- | --- | --- |
| `<Button />` not found | `src/index.js` + `src/components/index.js` | `04-plugin-system/02-component-registration.md` |
| `<i-button />` not found | `src/index.js` 的 `ViewUI` alias map | `04-plugin-system/02-component-registration.md` |
| `v-resize` not found | `src/index.js` 的 `directives` map | `04-plugin-system/03-directive-registration.md` |
| `this.$Message` undefined | `src/index.js` 的 `globalProperties` | `04-plugin-system/05-global-properties.md` |
| `$VIEWUI` value unexpected | `src/index.js` 的 `$VIEWUI` object | `04-plugin-system/04-global-options-and-viewui-config.md` |
| locale text not changed | `src/index.js` + `src/locale/index.js` | `04-plugin-system/06-locale-plugin-contract.md` |
| TypeScript does not know `$Modal` | `types/index.d.ts` | `04-plugin-system/07-runtime-type-contract.md` |
| runtime 可用但 TS 沒提示 | `types/index.d.ts` 是否漏宣告 | `04-plugin-system/07-runtime-type-contract.md` |
| TS 有提示但 runtime undefined | `src/index.js` 是否真的掛載 | `04-plugin-system/07-runtime-type-contract.md` |

---

### 5.3 Runtime surface 與 Type surface 對照表

| Runtime 行為 | TypeScript 對應 | 若不同步會發生什麼 |
| --- | --- | --- |
| `app.config.globalProperties.$VIEWUI = ...` | `ComponentCustomProperties.$VIEWUI` | runtime 可用但 TS 不知道，或 TS 以為存在但 runtime 沒有 |
| `app.config.globalProperties.$Message = components.Message` | `ComponentCustomProperties.$Message` | `this.$Message` 可能沒提示，或 runtime `undefined` |
| `app.config.globalProperties.$Modal = components.Modal` | `ComponentCustomProperties.$Modal` | 使用 modal instance API 時型別與 runtime 可能不一致 |
| `install(app, opts)` 接收 options | `ViewUIPlusInstallOptions` | `app.use(ViewUIPlus, options)` 可能型別報錯 |
| `export * from './components'` | component declaration / export declaration | named import 可能 runtime 有但 type 缺失 |

這張表用來提醒：plugin system 的 public surface 不只是一段 JavaScript runtime code，也包含 TypeScript declaration。成熟的 UI library 需要同時維護 runtime 行為與 type contract。

---

## 6. 範例或情境說明

### 6.1 情境一：`Failed to resolve component: Button`

假設你在 template 中寫：

```vue
<template>
  <Button>Save</Button>
</template>
```

但 console 出現：

```txt
Failed to resolve component: Button
```

第一步不要直接打開 `button` component source，而是先問：你期待 `<Button />` 是全域 component 嗎？

如果是，就檢查 application entry 是否有：

```js
app.use(ViewUIPlus);
```

如果沒有，那 `<Button />` 不能全域使用是合理的。你可以改成全量安裝，或在局部 component 中手動註冊 named import 的 `Button`。

如果有呼叫 `app.use(ViewUIPlus)`，下一步檢查 `src/index.js` 的 `ViewUI` map 是否包含 `Button`，以及 `install()` 是否有執行：

```js
Object.keys(ViewUI).forEach((key) => {
  app.component(key, ViewUI[key]);
});
```

再往前追，檢查 `src/components/index.js` 是否有：

```js
export { default as Button } from './button';
```

這樣就能把問題從使用者入口一路追到 package export 和 plugin registration。

---

### 6.2 情境二：`this.$Message is undefined`

假設你在 Options API component 中寫：

```js
export default {
  mounted() {
    this.$Message.info('Saved');
  }
};
```

但 runtime 出現：

```txt
this.$Message is undefined
```

這時第一步要確認是否有安裝 plugin：

```js
app.use(ViewUIPlus);
```

第二步要確認程式碼是否真的在 Vue component instance 裡執行。`this.$Message` 是 instance property，不是普通 JavaScript module 裡的全域變數。

第三步打開 `src/index.js`，檢查 `install()` 是否有：

```js
app.config.globalProperties.$Message = components.Message;
```

第四步檢查 `components.Message` 是否真的存在。如果 runtime 有 `$Message`，但 TypeScript 沒提示，才去看 `types/index.d.ts` 的 `ComponentCustomProperties` 是否漏掉 `$Message`。

這個例子也再次說明：

```js
import { Message } from 'view-ui-plus';
```

和：

```js
this.$Message
```

是兩條不同的取得路線，不能混為一談。

---

### 6.3 情境三：`$VIEWUI` 設定傳了但元件沒反應

假設你寫：

```js
app.use(ViewUIPlus, {
  transfer: false
});
```

但某個 component 行為看起來不像你預期。排查時要分三層。

第一層是 `opts` 是否傳進 `install(app, opts)`。這通常從 application entry 和 debugger 可以確認。

第二層是 `$VIEWUI` 是否保留了這個值。如果 source 使用：

```js
transfer: 'transfer' in opts ? opts.transfer : ''
```

那 `false` 會被保留。這是 key-existence check。

但如果 source 使用類似：

```js
someValue: opts.someValue ? opts.someValue : defaultValue
```

那 `false`、`0`、`''` 這些 falsy value 可能會被 fallback 吞掉。

第三層是 component 是否真的讀 `$VIEWUI.transfer`。Plugin system 只能保證把設定放進 `$VIEWUI`；如果 component 沒有讀它，或讀的是另一個 key，就要進入 component source 追。

這類問題的重點不是只看「有沒有傳 options」，而是要一路追到：

```txt
options -> $VIEWUI object -> component reads $VIEWUI key -> component behavior
```

---

### 6.4 情境四：TypeScript 有提示但 runtime 不能用

假設 TypeScript 允許你寫：

```js
this.$Copy(...)
```

但 runtime 卻出現：

```txt
this.$Copy is not a function
```

這時不要只相信 `types/index.d.ts`，因為 type declaration 只是型別承諾。你應該回到 `src/index.js` 檢查是否真的有：

```js
app.config.globalProperties.$Copy = components.Copy;
```

如果 type 有宣告但 runtime 沒掛，這就是 stale declaration。反過來，如果 runtime 有掛但 type 沒宣告，則是 runtime/type contract mismatch 的另一個方向。

---

## 7. 閱讀路線或學習路線

### 7.1 初次閱讀路線

第一次讀這份筆記時，建議不要從所有症狀表開始背，而是先建立 plugin system 的整體模型。

1. 先讀 `04-plugin-system/01-install-flow.md`，理解 `app.use(ViewUIPlus, options)` 如何進入 `install(app, opts)`。
2. 再讀 `04-plugin-system/09-install-flow-diagram.md`，用圖像方式建立 runtime path：components、directives、`$VIEWUI`、`globalProperties`、type contract。
3. 接著讀本篇 `04-plugin-system/11-plugin-debugging-checklist.md`，把前兩篇建立的流程轉成除錯路線。
4. 最後讀 `04-plugin-system/07-runtime-type-contract.md`，理解 runtime surface 與 type surface 為什麼要同步。

這條路線的目標是讓你先理解「安裝流程」，再學會「壞掉時怎麼追」。

### 7.2 深入閱讀路線

如果你已經能理解 plugin system 的主流程，可以開始針對不同 public surface 深入閱讀。

1. Component 找不到時，讀 `04-plugin-system/02-component-registration.md`。
2. Directive 找不到時，讀 `04-plugin-system/03-directive-registration.md`，再視需要跳到 `11-directives/`。
3. `$VIEWUI` 設定問題，讀 `04-plugin-system/04-global-options-and-viewui-config.md`。
4. `$Message`、`$Modal`、`$Notice` 掛載問題，讀 `04-plugin-system/05-global-properties.md`。
5. locale 問題，讀 `04-plugin-system/06-locale-plugin-contract.md`。
6. TypeScript 問題，讀 `04-plugin-system/07-runtime-type-contract.md`。

### 7.3 可以暫時跳過的部分

如果目前的目標只是理解 View UI Plus plugin system，不需要立刻深入：

- `$Message` 的 DOM rendering、queue、destroy。
- directive 的實際 DOM 操作細節。
- CSS theme token 和打包策略。
- 語言包產物如何被 build 成 browser global。
- 單一 component 的 props/events/slots 型別細節。

這些都是後續深化主題，不是本章的重點。

---

## 8. 常見誤區

| 誤區 | 為什麼容易誤解 | 正確理解 |
| --- | --- | --- |
| `import { Button }` 成功，就代表 `<Button />` 可以全域使用 | named import 和 global registration 都能取得 component，容易被混在一起 | named import 是 module export；全域 `<Button />` 依賴 `app.use(ViewUIPlus)` 和 `app.component()` |
| `<i-button />` 應該自動由 `Button` 生成 | Vue template 支援 casing 轉換，容易讓人以為 alias 也會自動生成 | `iButton` 必須明確存在於 `ViewUI` map，才會被註冊 |
| directive 名稱等於檔名 | 很多專案會用檔名對應 directive name | View UI Plus 的 directive name 來自 `directives` object 的 key，例如 `'line-clamp'` |
| `this.$Message` 可以在任何 JS 檔案中使用 | `$Message` 看起來像全域工具 | `this.$Message` 是 Vue component instance property，依賴 `globalProperties` |
| TypeScript 有提示就代表 runtime 一定存在 | 型別系統會讓 API 看起來「已存在」 | `types/index.d.ts` 只是宣告，runtime 是否存在要看 `src/index.js` |
| runtime 可用就代表 type 一定正確 | JavaScript 可執行不代表 TypeScript declaration 完整 | 新增 `globalProperties` 時要同步更新 `ComponentCustomProperties` |
| `$VIEWUI` 設定沒效一定是 component bug | component 行為沒變時容易直接怪 component | 要先確認 options 是否傳入、`$VIEWUI` 是否建立、fallback 是否保留值、component 是否讀該 key |
| locale 沒切換一定是語言包壞了 | 語系問題牽涉 plugin、locale module、build output 多層 | 先確認 `opts.locale` / `opts.i18n` 是否進入 `localeFile.use()` / `localeFile.i18n()` |
| `install.installed` guard 一定有防重複效果 | 看到 `if (install.installed) return` 容易以為功能完整 | 如果 source 沒有設定 `install.installed = true`，guard 只是意圖，不一定有實際效果 |
| plugin system 可以解釋所有錯誤 | plugin entry 是很多能力的入口 | 一旦 install side effect 已成立，後續問題可能屬於 component/service/directive internals |

---

## 9. 本章總結

View UI Plus 的 plugin system 除錯重點，不是背下每個錯誤對應哪個檔案，而是先建立分層判斷能力。當某個能力不能使用時，應先判斷它是透過 `app.use(ViewUIPlus)`、named import、template global component、directive、instance property，還是 TypeScript declaration 取得的。不同取得方式背後對應不同的 source 與 side effect。

`src/index.js` 是 plugin runtime 的核心入口，負責把 components 註冊到 `app.component()`、把 directives 註冊到 `app.directive()`、把 `$VIEWUI` 與 service API 寫入 `app.config.globalProperties`，並透過 `localeFile.use()` / `localeFile.i18n()` 建立 locale contract。只要問題牽涉全域安裝、全域註冊或 instance property，都應該優先回到 `src/index.js` 建立 runtime path。

不過，plugin system 不是所有問題的終點。它只負責建立 public surface。如果 `<Button />` 已經成功註冊，但按鈕行為不對，那可能是 component internals；如果 `v-resize` 已經成功註冊，但 DOM 行為不對，那可能是 directive hook；如果 `$Message` 已經掛到 `globalProperties`，但 queue 或 destroy 行為異常，那就應該跳到 imperative API 的內部流程。

最後，View UI Plus 這類 UI library 還要同時維護 runtime surface 與 type surface。`src/index.js` 決定 runtime 是否真的存在 `$Message`、`$Modal`、`$VIEWUI`；`types/index.d.ts` 則決定 TypeScript 是否知道這些 property。除錯時必須同時關注兩者是否對齊，否則就會出現「runtime 可用但 TS 沒提示」或「TS 有提示但 runtime undefined」的 mismatch。

---

## 10. 自我檢查問題

1. 當你看到 `Failed to resolve component: Button` 時，為什麼不應該第一時間就去看 `button` component 的內部實作？
2. `import { Button } from 'view-ui-plus'` 和 `<Button />` 全域使用，背後分別依賴哪兩種不同的 public surface？
3. 為什麼 `<i-button />` 不能用時，要優先檢查 `ViewUI` map，而不是只檢查 `Button` component 是否存在？
4. directive 的 template 名稱為什麼要看 `directives` object 的 key，而不是只看檔案名稱？
5. `this.$Message` 為什麼依賴 `app.config.globalProperties`？它和 `import { Message }` 有什麼不同？
6. `$VIEWUI` 是什麼？它和 component prop、provide/inject 有什麼差異？
7. 為什麼 `capture: 'capture' in opts ? opts.capture : true` 可以保留 `false`，但 truthy fallback 可能吞掉 falsy value？
8. locale 沒切換時，哪些問題屬於 plugin system，哪些問題可能屬於 build/release？
9. TypeScript 有 `$Modal` 提示，但 runtime 是 `undefined`，這通常代表什麼問題？
10. 如果你新增一個 `$Confirm` instance API，為什麼不能只改 `src/index.js`，還要檢查 `types/index.d.ts`？

---

## 11. 後續延伸方向

這份筆記後續可以拆成以下更深入的主題：

1. `04-plugin-system/02-component-registration.md`  
   深入分析 `src/components/index.js`、`import * as components`、`ViewUI` map、component alias 與 `app.component()` loop。

2. `04-plugin-system/03-directive-registration.md`  
   深入分析 `directives` map 的建立方式、directive name 與 template 使用方式的關係。

3. `04-plugin-system/04-global-options-and-viewui-config.md`  
   深入分析 `app.use(ViewUIPlus, options)` 如何被整理成 `$VIEWUI`，以及各種 fallback 寫法的影響。

4. `04-plugin-system/05-global-properties.md`  
   深入分析 `$Message`、`$Modal`、`$Notice`、`$Loading`、`$Date` 等 instance properties 如何被掛載。

5. `04-plugin-system/06-locale-plugin-contract.md`  
   深入分析 `opts.locale`、`opts.i18n`、`localeFile.use()`、`localeFile.i18n()` 的 plugin contract。

6. `04-plugin-system/07-runtime-type-contract.md`  
   深入分析 `src/index.js` runtime surface 和 `types/index.d.ts` TypeScript declaration 如何同步。

7. `10-imperative-api/`  
   研究 `$Message.info()`、`$Modal.confirm()`、`$Notice.open()` 等 service API 的內部建立、queue、destroy 流程。

8. `11-directives/`  
   研究 `v-resize`、`v-line-clamp`、`v-bg-color` 等 directive 的 hook、DOM 操作與生命週期。

9. `14-build-release/`  
   研究語言包、ESM/UMD 產物、CSS 與主套件如何被 build 與發布。

---

## 附錄：本章一行心智模型

```txt
View UI Plus plugin debugging = 先分類 public surface -> 追 runtime source -> 檢查 install side effect -> 對齊 consumer access path 與 TypeScript declaration
```
