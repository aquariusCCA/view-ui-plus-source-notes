# View UI Plus Plugin 安裝流程圖解

## 1. 本章定位

本章是一篇「原始碼閱讀筆記 + 架構分析筆記」。它不是單純介紹 View UI Plus 怎麼使用，也不是深入分析某一個元件的實作，而是專門用來理解 View UI Plus 的 plugin install 流程。

放在你的筆記目錄中，它應該屬於：

```txt
04-plugin-system/
  09-install-flow-diagram.md
```

`04-plugin-system/` 主要關注的是：

1. Vue plugin 安裝流程。
2. 全局元件註冊。
3. 全局 directive 註冊。
4. 全局配置注入。
5. instance API 掛載。
6. runtime 與 TypeScript 型別契約是否一致。
7. 套件如何透過 plugin 對外提供 public surface。

讀完本章後，你應該能回答以下問題：

- 使用者呼叫 `app.use(ViewUIPlus, options)` 後，View UI Plus 實際做了哪些事情？
- `src/index.js` 為什麼是 plugin system 的 runtime entry？
- View UI Plus 如何把 components、directives、locale、i18n、dayjs、imperative APIs 組裝成一個 plugin？
- `app.component`、`app.directive`、`app.config.globalProperties` 分別改動 Vue app 的哪一種 public surface？
- `$VIEWUI` 在 runtime 中扮演什麼角色？
- 為什麼只改 runtime 不夠，還要同步檢查 `types/index.d.ts`？

本章不深入處理以下內容：

- 單一元件的內部實作，例如 `Button`、`Table`、`Select` 的 props、render 或 style。
- directive hook 的 DOM 操作細節，例如 `v-resize`、`v-line-clamp` 的底層行為。
- `$Message.info()`、`$Modal.confirm()` 這類 imperative API 如何建立 instance、排隊、銷毀。
- locale / i18n 的完整字典載入與語言切換細節。
- build output、tree-shaking、按需引入的完整建置策略。

這些主題可以在後續章節分別處理。本章只負責建立 View UI Plus plugin 安裝流程的主幹地圖。

---

## 2. 學習前先建立的基本觀念

### 2.1 Vue plugin 是一種「安裝協議」

在 Vue 3 中，plugin 的核心概念是：使用者把某個 plugin 物件傳給 `app.use()`，Vue 會依照約定呼叫 plugin 的安裝邏輯。

使用者通常會寫：

```ts
import { createApp } from 'vue'
import ViewUIPlus from 'view-ui-plus'
import App from './App.vue'

const app = createApp(App)

app.use(ViewUIPlus, {
  size: 'large',
  transfer: true
})

app.mount('#app')
```

從使用者角度看，這只是一行 `app.use(ViewUIPlus, options)`。但從套件作者角度看，這一行代表 View UI Plus 有機會集中完成多種初始化工作，例如註冊全局元件、註冊全局指令、建立全局設定、掛載全局 instance APIs。

因此，plugin system 的本質不是「某個神秘功能」，而是一個初始化入口。套件可以把很多原本需要使用者手動設定的事情，集中收斂到 `install(app, opts)` 中完成。

### 2.2 `install(app, opts)` 是套件改動 Vue app 的集中入口

本章的核心 source 是：

```txt
01-origin/source/view-ui-plus-v1.3.20/src/index.js
```

這個檔案之所以重要，是因為它扮演 View UI Plus 的 runtime entry。它不是某個單一元件，而是把整個套件對外暴露的能力組裝起來。

在這裡，`install(app, opts)` 會接收兩個重要輸入：

| 參數 | 來源 | 角色 |
| --- | --- | --- |
| `app` | Vue 的 application instance | 代表目前要被安裝 plugin 的 Vue app |
| `opts` | 使用者呼叫 `app.use(ViewUIPlus, options)` 時傳入的 options | 代表 View UI Plus 的全局設定 |

理解 `install` 時，不要只看它呼叫了哪些方法，還要看它改動了 Vue app 的哪些公開表面。對 View UI Plus 來說，最重要的 public surface 有三類：

| Public surface | 建立方式 | 使用者看到的效果 |
| --- | --- | --- |
| Global components | `app.component(name, component)` | 可以在 template 使用 `<Button />`、`<i-button />` |
| Global directives | `app.directive(name, directive)` | 可以在 template 使用 `v-resize`、`v-line-clamp` |
| Instance properties | `app.config.globalProperties.$xxx = ...` | 可以在 Options API 中使用 `this.$Message`、`this.$VIEWUI` |

這三類 public surface 是本章的閱讀主線。

### 2.3 full install 與 named import 是不同使用模式

`src/index.js` 同時提供 named exports 與 default plugin export。

```txt
Named exports:
  export * from './components'

Default plugin export:
  export default API
```

這代表 View UI Plus 至少有兩種不同使用模式。

第一種是 named import。使用者可以從套件中明確引入某個元件：

```ts
import { Button } from 'view-ui-plus'
```

這種方式偏向「按需使用」或「局部使用」，重點是讓使用者取得某個具名輸出的元件。

第二種是 full install。使用者把整個 View UI Plus 當成 plugin 安裝：

```ts
app.use(ViewUIPlus)
```

這種方式會透過 `install` 把 View UI Plus 的 components、directives、global properties 等能力一次掛到 app 上。

所以，`export * from './components'` 和 `export default API` 不是重複設計，而是在支援不同使用情境。前者讓使用者直接拿元件，後者讓使用者安裝整個 plugin。

---

## 3. 整體概覽

### 3.1 從使用者呼叫到 Vue app 被改動

View UI Plus plugin 安裝流程可以先用一張大圖理解：

```txt
User code
  app.use(ViewUIPlus, options)
        |
        v
Vue plugin protocol
  ViewUIPlus.install(app, options)
        |
        v
View UI Plus install(app, opts)
  1. guard repeated install
  2. setup locale / i18n
  3. register global components
  4. register global directives
  5. write $VIEWUI global config
  6. write instance APIs and $Date
        |
        v
Vue app public surface
  - Global components
  - Global directives
  - Instance properties
```

這張圖要表達的是：`app.use(ViewUIPlus, options)` 本身不是最終目的，它只是觸發 View UI Plus 的 `install(app, opts)`。真正值得閱讀的是 `install` 內部如何把套件能力註冊到 Vue app。

安裝完成後，使用者可以從三個方向感受到套件能力已經被注入：

| Surface | 使用方式 | 由 `install` 哪一步建立 |
| --- | --- | --- |
| Global components | `<Button />`、`<i-button />` | `app.component` loop |
| Global directives | `v-resize`、`v-line-clamp` | `app.directive` loop |
| Instance properties | `this.$Message`、`this.$VIEWUI` | `app.config.globalProperties` |

閱讀 `src/index.js` 時，應該把它視為「public surface 的建構器」。它不只是匯出一些模組，而是在安裝階段決定使用者可以用哪些元件、哪些 directive、哪些 `$xxx` instance APIs。

### 3.2 `src/index.js` 的 runtime entry 結構

`src/index.js` 先組合出 plugin 需要的輸入資料，再定義安裝流程，最後匯出對外 API。

```txt
src/index.js
  |
  |-- export * from './components'
  |-- import * as components from './components'
  |-- import localeFile from './locale/index'
  |-- import directives
  |-- import dayjs
  |-- import package version
  |
  |-- build directives map
  |-- build ViewUI component map
  |-- define install(app, opts)
  |-- export locale / i18n / lang / version
  |-- export default API
```

這個檔案可以拆成三層理解：

| 層次 | 負責內容 | 閱讀重點 |
| --- | --- | --- |
| 輸入層 | 匯入 components、directives、locale、dayjs、version | 觀察 plugin 需要哪些材料 |
| 組裝層 | 建立 `directives` map、`ViewUI` component map、`install` function | 觀察套件如何把材料整理成可安裝結構 |
| 輸出層 | `export *`、`export locale / i18n / lang / version`、`export default API` | 觀察套件對外暴露哪些 public API |

其中最重要的是「組裝層」。因為真正的 plugin 行為不是來自單一 component，而是來自 `install` 如何統一處理所有 components、directives 和 global properties。

### 3.3 `API` object 的角色

`API` object 同時包含：

```txt
{
  version,
  locale,
  i18n,
  install,
  lang,
  ...components
}
```

這個 `API` object 是 default export 的主體。它同時具備兩種意義：

第一，它是一個 Vue plugin，因為它有 `install` 方法，可以被 `app.use(ViewUIPlus)` 使用。

第二，它也是套件 runtime API 的集合，因為它包含 `version`、`locale`、`i18n`、`lang` 與 `...components`。

因此，`API` 不是單純的設定物件，而是 View UI Plus 對外暴露能力的統一容器。閱讀時要注意它同時扮演「可安裝 plugin」與「API 集合」兩種角色。

---

## 4. 核心內容逐步講解

### 4.1 安裝流程主線：`app.use` 到 `install(app, opts)`

View UI Plus 的安裝流程可以從使用者程式碼開始看：

```ts
app.use(ViewUIPlus, {
  size: 'large',
  transfer: true
})
```

這段程式碼的重點不是 `use` 本身，而是 Vue 會把目前的 `app` instance 和使用者傳入的 options 傳給 View UI Plus 的安裝邏輯。對 View UI Plus 來說，這會進入：

```txt
ViewUIPlus.install(app, options)
```

進入 `install` 後，View UI Plus 開始集中完成套件初始化：

```txt
install(app, opts = {})
  |
  |-- if (install.installed) return
  |
  |-- if (opts.locale)
  |     localeFile.use(opts.locale)
  |
  |-- if (opts.i18n)
  |     localeFile.i18n(opts.i18n)
  |
  |-- Object.keys(ViewUI).forEach(key => {
  |     app.component(key, ViewUI[key])
  |   })
  |
  |-- Object.keys(directives).forEach(key => {
  |     app.directive(key, directives[key])
  |   })
  |
  |-- app.config.globalProperties.$VIEWUI = { ...normalized options }
  |
  |-- app.config.globalProperties.$Spin = components.Spin
  |-- app.config.globalProperties.$Loading = components.LoadingBar
  |-- app.config.globalProperties.$Message = components.Message
  |-- app.config.globalProperties.$Notice = components.Notice
  |-- app.config.globalProperties.$Modal = components.Modal
  |-- app.config.globalProperties.$ImagePreview = components.ImagePreview
  |-- app.config.globalProperties.$Copy = components.Copy
  |-- app.config.globalProperties.$ScrollIntoView = components.ScrollIntoView
  |-- app.config.globalProperties.$ScrollTop = components.ScrollTop
  |
  |-- app.config.globalProperties.$Date = dayjs
```

這段流程可以分成六個階段理解：

| 階段 | 程式行為 | 目的 |
| --- | --- | --- |
| 防重複安裝 | `if (install.installed) return` | 避免 plugin 被重複安裝 |
| 語系初始化 | `localeFile.use(opts.locale)` | 使用使用者傳入的 locale 設定 |
| i18n 初始化 | `localeFile.i18n(opts.i18n)` | 接上使用者傳入的 i18n 方法 |
| 元件註冊 | `app.component(...)` | 建立 global components |
| 指令註冊 | `app.directive(...)` | 建立 global directives |
| 全局屬性掛載 | `app.config.globalProperties.$xxx = ...` | 建立 instance properties 與 runtime config |

閱讀這段時，要特別注意「順序」。View UI Plus 先處理 locale / i18n，再註冊 components 與 directives，最後寫入 `$VIEWUI` 與 instance APIs。這代表 `install` 不是單一動作，而是一個 orchestration function，也就是負責協調多個子系統初始化的函式。

### 4.2 防重複安裝：意圖與實作需要對齊

```txt
if (install.installed) return
```

這行程式碼代表設計者有「避免重複安裝」的意圖。一般來說，plugin 如果被重複安裝，可能造成重複註冊、重複覆寫 global properties，或者產生難以追蹤的副作用。因此，很多 plugin 會用旗標記錄是否已經安裝過。

不過，目前 source 片段看到 `if (install.installed) return;`，但沒有看到 `install.installed = true`。

這是一個很重要的閱讀點。它提醒我們，閱讀原始碼時不能只看到「防重複安裝的判斷」就直接推論它真的能防重複安裝。完整判斷至少要確認兩件事：

1. 是否有讀取旗標，例如 `if (install.installed) return`。
2. 是否有在第一次安裝後寫入旗標，例如 `install.installed = true`。

如果只有第一步，沒有第二步，那麼防重複安裝的意圖存在，但實作可能不完整。這類情況應該記錄到：

```txt
04-plugin-system/07-runtime-type-contract.md
maintenance checklist
```

此處需要後續補充：需要回到完整的 `src/index.js` source，確認 `install.installed = true` 是否存在於其他位置。如果完整檔案確實沒有設定，則應記為「intent / implementation gap」。

### 4.3 Locale / i18n 初始化路線

在 component 與 directive 註冊之前，`install` 會先處理語系與 i18n：

```txt
if (opts.locale)
  localeFile.use(opts.locale)

if (opts.i18n)
  localeFile.i18n(opts.i18n)
```

這段流程的意思是：View UI Plus 允許使用者在安裝 plugin 時傳入語系或 i18n 設定，然後由 `localeFile` 統一處理。

這裡可以先建立一個簡化心智模型：

```txt
User install options
  {
    locale,
    i18n
  }
        |
        v
install(app, opts)
        |
        v
localeFile.use(locale)
localeFile.i18n(i18n)
        |
        v
View UI Plus runtime locale behavior
```

本章只需要理解「語系設定是 install 階段的一部分」。至於 `localeFile.use()` 如何切換語系、`localeFile.i18n()` 如何接上外部 i18n function，應該留到 locale / i18n 相關章節深入。

這裡要注意，locale / i18n 不屬於 Vue app public surface 的三大類之一。它不像 `app.component` 或 `app.directive` 一樣直接註冊到 Vue app，也不像 `$Message` 一樣掛到 `globalProperties`。它比較像是 View UI Plus 內部 runtime module 的初始化。

### 4.4 Component Registration Path：從 components module 到 global components

元件註冊路線是本章最重要的主線之一。

流程如下：

```txt
src/components/index.js
  export { default as Button } from './button'
  export { default as Table } from './table'
  ...
        |
        v
src/index.js
  import * as components from './components'
        |
        v
ViewUI = {
  ...components,
  iButton: components.Button,
  iTable: components.Table,
  ...
}
        |
        v
Object.keys(ViewUI).forEach(key => {
  app.component(key, ViewUI[key])
})
```

這條路線要回答三個問題。

第一，為什麼所有 named exported components 都有機會被全局註冊？

因為 `src/index.js` 使用：

```txt
import * as components from './components'
```

這會把 `src/components/index.js` 中匯出的元件集中成一個 `components` namespace object。接著 `ViewUI = { ...components, ...aliases }` 又把這些元件放進 `ViewUI` map。最後 `Object.keys(ViewUI).forEach(...)` 對每個 key 呼叫 `app.component`。

也就是說，只要某個元件被 `src/components/index.js` 匯出，並且被放入 `ViewUI` map，它就會進入全局註冊流程。

第二，為什麼 `iButton`、`iTable` 這類 alias 也會被註冊？

因為 `ViewUI` map 不只包含 `...components`，還額外加入了 alias：

```txt
ViewUI = {
  ...components,
  iButton: components.Button,
  iTable: components.Table,
  ...
}
```

這代表同一個元件可以有多個註冊名稱。例如 `Button` 和 `iButton` 可能都指向 `components.Button`。註冊後，使用者就可以用不同 tag name 取得同一個元件能力。

第三，為什麼 full install 和按需 import 是不同使用模式？

因為 full install 會走 `app.component` loop，把 `ViewUI` 裡的元件全局註冊到 app；而 named import 只是讓使用者從套件匯入某個元件，並不必然全局註冊。

簡化來看：

```txt
Named import:
  import { Button } from 'view-ui-plus'
  -> 使用者自己決定如何註冊或使用

Full install:
  app.use(ViewUIPlus)
  -> install 內部自動 app.component('Button', Button)
```

這就是 component registration path 的核心意義：它把 source module 裡的 component exports 轉成 Vue app 上可用的 global components。

### 4.5 Directive Registration Path：從 directives map 到 template 指令

directive 註冊路線與 component 註冊路線很像，只是它建立的是 template 中的 `v-xxx` 指令。

流程如下：

```txt
src/directives/*
  line-clamp
  resize
  style
        |
        v
directives = {
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
}
        |
        v
Object.keys(directives).forEach(key => {
  app.directive(key, directives[key])
})
```

這段流程的重點在於 `directives` map 的 key。key 會成為使用者在 template 中看到的 directive 名稱。

例如：

```txt
directives['line-clamp'] -> v-line-clamp
directives['bg-color']   -> v-bg-color
directives.resize        -> v-resize
```

所以，閱讀 directive registration 時，要把注意力放在兩件事：

1. `directives` map 的 key 是什麼。
2. 每個 key 對應到哪個 directive implementation。

這裡先不要急著深入 directive hook。像 `resize` 如何監聽尺寸變化、`line-clamp` 如何操作 DOM、`style.display` 如何處理樣式，這些都屬於 `11-directives/` 的內容。本章只要理解：`install` 透過 `app.directive` 把這些 directive implementation 掛到 Vue app 上，讓 template 可以使用 `v-resize`、`v-line-clamp` 等語法。

### 4.6 Global Config Path：`opts` 如何變成 `$VIEWUI`

View UI Plus 支援在安裝 plugin 時傳入全局設定：

```ts
app.use(ViewUIPlus, {
  size: 'large',
  transfer: true,
  modal: {
    maskClosable: false
  },
  select: {
    arrow: 'ios-arrow-down'
  }
})
```

這些 options 進入 `install(app, opts)` 後，會被整理到：

```txt
app.config.globalProperties.$VIEWUI = {
  size,
  transfer,
  capture,
  modal,
  select,
  ...
}
```

這裡最重要的觀念是：`$VIEWUI` 是 install options 的 runtime container。

它不是 component prop。因為使用者不是在每個元件上寫：

```vue
<Button size="large" />
```

而是在安裝階段設定：

```ts
app.use(ViewUIPlus, { size: 'large' })
```

它也不是 provide/inject。

```txt
app.config.globalProperties.$VIEWUI
```

這代表元件實例可以透過 instance property 讀取 `$VIEWUI`。用 Options API 的角度看，就是：

```txt
Component instance reads:
  this.$VIEWUI
```

因此，`$VIEWUI` 的角色可以這樣理解：

```txt
User install options
  app.use(ViewUIPlus, options)
        |
        v
install(app, opts)
        |
        v
normalize / collect options
        |
        v
app.config.globalProperties.$VIEWUI
        |
        v
View UI Plus components read global config at runtime
```

這個設計讓使用者可以用一次安裝設定影響多個元件的預設行為。例如 `size` 可能作為元件尺寸預設值，`transfer` 可能影響某些浮層類元件是否轉移掛載位置，`modal`、`select` 等物件則可能提供特定類型元件的全局預設設定。

此處需要後續補充：`$VIEWUI` 裡所有 key 的完整預設值與 normalize 邏輯。若要深入，應閱讀 `04-plugin-system/04-global-options-and-viewui-config.md` 與 `types/index.d.ts` 中的 `ViewUIPlusGlobalOptions`。

### 4.7 GlobalProperties Path：`$Message`、`$Modal`、`$Date` 如何掛到 instance 上

除了 `$VIEWUI` 之外，View UI Plus 還把一些常用的 imperative APIs 掛到 `app.config.globalProperties`：

```txt
components.Message
components.Modal
components.Notice
components.LoadingBar
dayjs
        |
        v
app.config.globalProperties
        |
        v
Options API component instance
  this.$Message
  this.$Modal
  this.$Notice
  this.$Loading
  this.$Date
```

對使用者來說，這代表在 Options API component instance 中可以寫：

```ts
this.$Message
this.$Modal
this.$Notice
this.$Loading
this.$Date
```

這種設計常見於 UI library。因為有些能力不是以 component tag 的形式使用，而是以命令式 API 的方式使用。例如訊息提示、通知、確認視窗、LoadingBar 等，通常不是在 template 裡寫一個固定元件，而是在事件發生時用程式呼叫。

本章只負責說明「這些 API 是如何被掛上去的」。至於 `$Message.info()` 內部如何建立 notice instance、如何排隊、如何銷毀，應該放到：

```txt
10-imperative-api/
```

繼續深入。

閱讀 `globalProperties` 時，要注意它會直接影響 component instance 的 public surface。也就是說，如果 `src/index.js` 裡掛了：

```txt
app.config.globalProperties.$Message = components.Message
```

那麼 TypeScript 型別也應該知道 component instance 上存在 `$Message`。這就連到下一節的 type contract。

### 4.8 Type Contract Path：runtime 有掛載，型別也要知道

plugin system 的 public surface 不只是 runtime 可用，也要讓 TypeScript 知道。

對齊路線：

```txt
runtime
  src/index.js
    app.config.globalProperties.$Message = components.Message
        |
        | should align with
        v
types
  types/index.d.ts
    interface ComponentCustomProperties {
      $Message: any
    }
```

這裡的重點是：`app.config.globalProperties` 是 runtime 行為，`types/index.d.ts` 是型別宣告。兩者要對齊。

如果 runtime 掛了 `$Message`，但是 `types/index.d.ts` 沒宣告 `$Message`，那使用者在 TypeScript 專案中使用 `this.$Message` 時可能會遇到型別錯誤。

反過來，如果 `types/index.d.ts` 宣告了 `$Message`，但 runtime 沒有實際掛上 `$Message`，那 TypeScript 會以為它存在，但執行時可能讀到 `undefined`。這種情況更危險，因為型別檢查通過，但 runtime 行為不成立。

因此，閱讀 View UI Plus plugin system 時，不能只看 `src/index.js`。至少要同步檢查：

```txt
src/index.js
types/index.d.ts
```

重點檢查項目包括：

| 檢查項目 | runtime 位置 | type 位置 | 目的 |
| --- | --- | --- | --- |
| `install(app, options)` | `src/index.js` | `types/index.d.ts` | 確認 plugin 安裝參數型別 |
| `$VIEWUI` | `app.config.globalProperties.$VIEWUI` | `ComponentCustomProperties` | 確認全局設定可被 instance 讀取 |
| `$Message` | `app.config.globalProperties.$Message` | `ComponentCustomProperties` | 確認 imperative API 存在 |
| `$Modal` | `app.config.globalProperties.$Modal` | `ComponentCustomProperties` | 確認彈窗 API 存在 |
| `$Date` | `app.config.globalProperties.$Date = dayjs` | `ComponentCustomProperties` | 確認日期工具 API 存在 |

此處需要後續補充：`ComponentCustomProperties` 目前多數 instance properties 標成 `any`。後續若要提升型別品質，可以針對 `$Message`、`$Modal`、`$Notice` 等 API 建立更精準的型別。

---

## 5. 表格整理

### 5.1 Plugin install public surface 總表

| Public surface | 建立方式 | 使用方式 | 主要用途 | 閱讀重點 |
| --- | --- | --- | --- | --- |
| Global components | `app.component(key, ViewUI[key])` | `<Button />`、`<i-button />` | 讓元件可在 template 中全局使用 | 追 `src/components/index.js`、`components`、`ViewUI` map |
| Global directives | `app.directive(key, directives[key])` | `v-resize`、`v-line-clamp`、`v-bg-color` | 讓 directive 可在 template 中全局使用 | 追 `directives` map 的 key 與 implementation |
| Global config | `app.config.globalProperties.$VIEWUI = ...` | `this.$VIEWUI` | 保存安裝時的全局 options | 檢查 options normalize 與 `ViewUIPlusGlobalOptions` |
| Imperative APIs | `app.config.globalProperties.$Message = ...` 等 | `this.$Message`、`this.$Modal`、`this.$Notice` | 提供命令式 UI API | 只先確認掛載，內部行為到 `10-imperative-api/` |
| Date utility | `app.config.globalProperties.$Date = dayjs` | `this.$Date` | 提供日期工具 | 檢查 type contract 是否與 runtime 對齊 |

這張表的閱讀方式是：先看 `install` 改動了 Vue app 的哪一種表面，再決定要追哪條 source path。不要一開始就跳進某個元件內部，否則很容易迷失在細節中。

### 5.2 Runtime entry 模組表

| 模組 / 檔案 | 所在位置 | 負責職責 | 與其他模組的關係 | 初次閱讀重點 |
| --- | --- | --- | --- | --- |
| `src/index.js` | `01-origin/source/view-ui-plus-v1.3.20/src/index.js` | View UI Plus plugin runtime entry | 組合 components、directives、locale、dayjs、version，並定義 `install` | 先掌握 `install(app, opts)` 的流程 |
| `src/components/index.js` | `src/components/index.js` | 匯出 View UI Plus components | 被 `src/index.js` 以 `import * as components` 收集 | 看哪些元件會進入 full install 註冊候選 |
| `src/directives/*` | `src/directives/` | 提供 directive implementation | 被整理成 `directives` map 後由 `app.directive` 註冊 | 看 map key 如何對應到 `v-xxx` |
| `src/locale/index` | `src/locale/index` | 提供 locale / i18n runtime module | 被 `install` 用 `localeFile.use()`、`localeFile.i18n()` 初始化 | 本章只看入口，不深入字典邏輯 |
| `types/index.d.ts` | `types/index.d.ts` | 宣告 plugin 與 instance properties 型別 | 應與 `src/index.js` 的 runtime public surface 對齊 | 檢查 `$VIEWUI`、`$Message`、`install` options |
| `package version` | package metadata | 提供 `version` | 被放入 `API` object 對外暴露 | 確認 default API 是否包含版本資訊 |

### 5.3 安裝流程表

| 步驟 | 發生位置 | 主要動作 | 輸入 | 輸出 | 注意事項 |
| --- | --- | --- | --- | --- | --- |
| 1 | `install(app, opts)` | 檢查是否已安裝 | `install.installed` | 如果已安裝則 return | 需確認是否有 `install.installed = true` |
| 2 | `install(app, opts)` | 初始化 locale | `opts.locale` | `localeFile.use(opts.locale)` | 語系細節留到 locale 章節 |
| 3 | `install(app, opts)` | 初始化 i18n | `opts.i18n` | `localeFile.i18n(opts.i18n)` | 外部 i18n function 的型別需另查 |
| 4 | `install(app, opts)` | 註冊 components | `ViewUI` map | global components | `iButton`、`iTable` alias 也會進入註冊 |
| 5 | `install(app, opts)` | 註冊 directives | `directives` map | global directives | map key 會變成 `v-xxx` 名稱 |
| 6 | `install(app, opts)` | 建立 `$VIEWUI` | normalized options | `this.$VIEWUI` | 它是 runtime config container |
| 7 | `install(app, opts)` | 掛載 imperative APIs | `components.Message` 等 | `this.$Message` 等 | 內部 API 行為另見 `10-imperative-api/` |
| 8 | `install(app, opts)` | 掛載 `$Date` | `dayjs` | `this.$Date` | 需檢查 TypeScript 宣告是否對齊 |

### 5.4 容易混淆的概念比較表

| 概念 | 說明 | 使用場景 | 常見誤解 |
| --- | --- | --- | --- |
| `export * from './components'` | 對外提供 named exports | `import { Button } from 'view-ui-plus'` | 誤以為它等同於 full install |
| `export default API` | 對外提供可被 `app.use` 安裝的 plugin object | `app.use(ViewUIPlus)` | 忽略 `API` 同時包含 `install` 與其他 runtime API |
| `app.component` | 註冊 global component | template 使用 `<Button />` | 誤以為所有 named export 都自動等於全局可用，實際要看 install 是否註冊 |
| `app.directive` | 註冊 global directive | template 使用 `v-resize` | 誤以為 directive 名稱來自檔名，實際要看 map key |
| `$VIEWUI` | 保存 install options 的 runtime container | component instance 讀取全局設定 | 誤以為它是 prop 或 provide/inject |
| `globalProperties` | Vue app 的 instance properties 掛載點 | Options API 使用 `this.$Message` | 誤以為只要 runtime 掛載就有 TypeScript 型別 |
| `types/index.d.ts` | TypeScript 型別契約 | 使用者開發時的型別提示與檢查 | 誤以為它會影響 runtime 行為 |

---

## 6. 範例或情境說明

### 6.1 情境一：使用者安裝 View UI Plus 後使用全局元件

假設使用者寫：

```ts
app.use(ViewUIPlus)
```

然後在 template 中使用：

```vue
<template>
  <Button>送出</Button>
  <i-button>取消</i-button>
</template>
```

這背後的流程不是 template 自己找到元件，而是安裝階段已經註冊過：

```txt
src/components/index.js
  export Button
        |
        v
src/index.js
  import * as components
        |
        v
ViewUI map
  Button -> components.Button
  iButton -> components.Button
        |
        v
install
  app.component('Button', components.Button)
  app.component('iButton', components.Button)
        |
        v
template
  <Button />
  <i-button />
```

這個例子可以幫助你理解：full install 的核心價值是降低使用者逐一註冊元件的成本。套件作者把全局註冊集中在 `install` 中處理，使用者只要呼叫一次 `app.use()`。

### 6.2 情境二：使用者安裝時傳入全局設定

假設使用者寫：

```ts
app.use(ViewUIPlus, {
  size: 'large',
  transfer: true,
  select: {
    arrow: 'ios-arrow-down'
  }
})
```

這些設定會進入 `install(app, opts)`，再被寫入：

```txt
app.config.globalProperties.$VIEWUI
```

當 View UI Plus 元件需要讀取全局設定時，就可以透過 component instance 的 `$VIEWUI` 取得。這讓全局預設值不需要每次都透過 prop 傳入。

簡化流程如下：

```txt
User options
  size: 'large'
        |
        v
install(app, opts)
        |
        v
$VIEWUI.size
        |
        v
Component runtime behavior
```

這個設計的好處是集中管理預設設定。缺點是它增加了一個隱性的全局依賴：元件內部如果依賴 `$VIEWUI`，閱讀單一元件時就不能只看 props，還要回頭理解 plugin install 階段如何建立 `$VIEWUI`。

### 6.3 情境三：使用者在 Options API 中呼叫 `$Message`

假設使用者在 component 中寫：

```ts
this.$Message.info('儲存成功')
```

這個 `$Message` 不是 JavaScript 原生能力，也不是 Vue component 自己宣告的 method，而是 View UI Plus 在安裝階段掛上的 instance property。

流程可以這樣看：

```txt
components.Message
        |
        v
install(app, opts)
        |
        v
app.config.globalProperties.$Message = components.Message
        |
        v
component instance
        |
        v
this.$Message.info(...)
```

本章只說明 `$Message` 如何出現在 `this` 上。至於 `.info()` 內部如何建立訊息元件、如何插入 DOM、如何自動關閉，應該在 `10-imperative-api/` 裡分析。

### 6.4 情境四：新增一個 globalProperties 時要同時改 runtime 與 types

假設未來 View UI Plus 想新增：

```txt
app.config.globalProperties.$Foo = components.Foo
```

只改 `src/index.js` 還不夠。你還需要檢查：

```ts
declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $Foo: ...
  }
}
```

這個情境可以建立一個重要維護原則：

```txt
Runtime public surface changes
        |
        v
Type contract must be checked
```

也就是說，plugin system 的維護不是只看「能不能跑」，還要看「使用者在 TypeScript 專案中能不能正確使用」。

---

## 7. 閱讀路線或學習路線

### 7.1 初次閱讀路線

第一次閱讀 View UI Plus plugin system 時，建議不要直接跳進元件內部。你可以依照以下順序閱讀：

1. 先讀 `04-plugin-system/01-install-flow.md`  
   目的：建立 `app.use(ViewUIPlus, options)` 到 `install(app, opts)` 的基本流程。

2. 再讀本章 `04-plugin-system/09-install-flow-diagram.md`  
   目的：用圖解方式把 runtime entry、component registration、directive registration、global config、globalProperties 與 type contract 串成一張地圖。

3. 接著讀 `01-origin/source/view-ui-plus-v1.3.20/src/index.js`  
   目的：對照本章圖解，確認每個流程在 source 中的實際位置。

4. 接著讀 `types/index.d.ts`  
   目的：確認 runtime 掛載的 public surface 是否都有對應型別宣告。

5. 最後讀 `04-plugin-system/07-runtime-type-contract.md`  
   目的：整理 runtime 與 type contract 的對齊關係，建立維護檢查清單。

### 7.2 深入閱讀路線

如果已經理解 install 主線，可以依照 public surface 拆開深入：

1. 元件註冊路線  
   閱讀 `04-plugin-system/02-component-registration.md`，重點是 `src/components/index.js`、`components` namespace、`ViewUI` map、alias 註冊。

2. 指令註冊路線  
   閱讀 `04-plugin-system/03-directive-registration.md`，重點是 `directives` map key 如何變成 `v-xxx`。

3. 全局設定路線  
   閱讀 `04-plugin-system/04-global-options-and-viewui-config.md`，重點是 `$VIEWUI` 的 key、預設值、normalize 邏輯與元件讀取方式。

4. globalProperties 路線  
   閱讀 `04-plugin-system/05-global-properties.md`，重點是 `$Message`、`$Modal`、`$Notice`、`$Loading`、`$Date` 如何被掛載。

5. public surface 架構路線  
   閱讀 `03-architecture/06-public-surface.md`，重點是 View UI Plus 對外提供哪些使用入口。

### 7.3 可以暫時跳過的部分

如果目前目標只是理解 plugin install 流程，可以暫時跳過以下內容：

- `Button`、`Table`、`Select` 等單一元件內部實作。
- `v-resize`、`v-line-clamp` 的 DOM 細節。
- `$Message.info()` 的 instance 建立與銷毀流程。
- locale dictionary 的完整資料結構。
- build tool 如何輸出套件產物。

這些內容不是不重要，而是它們不屬於本章的主幹。先把 install 主線讀通，再逐步展開到細節，學習成本會比較低。

---

## 8. 常見誤區

| 誤區 | 為什麼容易誤解 | 正確理解 |
| --- | --- | --- |
| 以為 `app.use(ViewUIPlus)` 只是引入套件 | 使用者程式碼只看到一行 `app.use` | `app.use` 會觸發 plugin 的 `install`，而 `install` 會改動 Vue app 的 public surface |
| 以為 named export 等同於全局註冊 | `export * from './components'` 看起來已經把元件匯出了 | named export 只是讓使用者可 import；全局註冊要看 `install` 是否呼叫 `app.component` |
| 以為 directive 名稱一定等於檔案名稱 | directive 通常存在 `src/directives/*` | template 中的 `v-xxx` 名稱要看 `directives` map 的 key |
| 以為 `$VIEWUI` 是 prop | 它會影響元件行為，容易被理解成元件參數 | `$VIEWUI` 是 install options 寫入 `globalProperties` 後形成的 runtime config container |
| 以為 `$Message` 是 component method | 使用時寫成 `this.$Message`，看起來像元件自己的 method | `$Message` 是 plugin install 階段掛到 `app.config.globalProperties` 的 instance property |
| 以為 runtime 可用就代表 TypeScript 沒問題 | JavaScript runtime 可以正常掛載屬性 | TypeScript 還需要 `types/index.d.ts` 宣告 `ComponentCustomProperties` |
| 看到 `if (install.installed) return` 就以為已經完成防重複安裝 | 判斷式看起來像完整機制 | 還要確認是否有 `install.installed = true`，否則只是有意圖但未必有效 |
| 一開始就深入 `$Message.info()` 的內部實作 | `$Message` 是常用 API，很容易想直接追下去 | 本章只處理它如何被掛上去，內部命令式 API 應放到 `10-imperative-api/` |

---

## 9. 本章總結

View UI Plus 的 plugin system 可以用一句話概括：

```txt
View UI Plus plugin system = package runtime modules -> install orchestration -> Vue app public surface
```

`src/index.js` 是這條路線的核心入口。它先收集 components、directives、locale、dayjs、version 等 runtime modules，再透過 `install(app, opts)` 把這些材料安裝到 Vue app 上。

`install` 本身是一個 orchestration function。它不是只做單一註冊，而是依序處理防重複安裝、locale / i18n 初始化、global components 註冊、global directives 註冊、`$VIEWUI` 全局設定寫入，以及 `$Message`、`$Modal`、`$Notice`、`$Loading`、`$Date` 等 instance properties 掛載。

從使用者角度看，`app.use(ViewUIPlus, options)` 是一行簡單的安裝語法。從原始碼閱讀角度看，這一行背後代表 View UI Plus 對 Vue app 做了多層 public surface 擴充。

本章最重要的心智模型是：不要把 plugin install 流程看成「引入套件」，而要把它看成「套件如何把自己的能力註冊到 Vue app」。當你之後閱讀 component registration、directive registration、global options、imperative API 或 type contract 時，都應該回到這個主軸：runtime public surface 是如何被建立、使用與維護的。

最後，plugin system 的閱讀不能只看 runtime。只要 `src/index.js` 增加、刪除或修改了 `app.config.globalProperties`，就應該同步檢查 `types/index.d.ts`。這是 UI library 維護中非常重要的 runtime/type contract 對齊問題。

---

## 10. 自我檢查問題

1. 為什麼 `app.use(ViewUIPlus, options)` 會進入 View UI Plus 的 `install(app, opts)`？
2. `src/index.js` 在 View UI Plus plugin system 中扮演什麼角色？
3. View UI Plus 安裝完成後，主要建立了哪三類 Vue app public surface？
4. `export * from './components'` 和 `export default API` 分別支援什麼使用模式？
5. 為什麼 `ViewUI = { ...components, iButton: components.Button, ... }` 會讓 alias 也被全局註冊？
6. `directives` map 的 key 為什麼會影響 template 中的 directive 名稱？
7. `$VIEWUI` 是什麼？為什麼說它不是 component prop，也不是 provide/inject？
8. `$Message`、`$Modal`、`$Notice` 這類 API 是如何出現在 `this` 上的？
9. 為什麼只修改 `src/index.js` 的 `globalProperties` 不夠，還要檢查 `types/index.d.ts`？
10. `if (install.installed) return` 這段程式碼為什麼需要搭配 `install.installed = true` 才能形成完整防重複安裝機制？

---

## 11. 後續延伸方向

後續可以把本章拆成以下更深入的主題筆記：

- `04-plugin-system/01-install-flow.md`：完整解析 `app.use(ViewUIPlus, options)` 到 `install(app, opts)` 的安裝流程。
- `04-plugin-system/02-component-registration.md`：深入分析 `components` namespace、`ViewUI` map、`app.component` loop 與 alias 註冊。
- `04-plugin-system/03-directive-registration.md`：深入分析 `directives` map、directive key、`app.directive` 與 template `v-xxx` 的對應關係。
- `04-plugin-system/04-global-options-and-viewui-config.md`：整理 `$VIEWUI` 的 options 結構、預設值、normalize 邏輯與元件讀取方式。
- `04-plugin-system/05-global-properties.md`：整理 `$Spin`、`$Loading`、`$Message`、`$Notice`、`$Modal`、`$ImagePreview`、`$Copy`、`$ScrollIntoView`、`$ScrollTop`、`$Date` 的掛載路線。
- `04-plugin-system/07-runtime-type-contract.md`：檢查 `src/index.js` runtime public surface 與 `types/index.d.ts` 型別宣告是否一致。
- `10-imperative-api/`：深入 `$Message`、`$Modal`、`$Notice` 這類命令式 API 的 instance 建立、queue、destroy 流程。
- `11-directives/`：深入 `v-resize`、`v-line-clamp`、`v-bg-color` 等 directive 的 hook 與 DOM 行為。
- `03-architecture/06-public-surface.md`：從架構角度整理 View UI Plus 對外暴露的所有使用入口。
- `maintenance-checklist/plugin-system.md`：建立 plugin system 維護檢查清單，例如 runtime/type contract、install guard、alias 對齊、options 預設值對齊。
