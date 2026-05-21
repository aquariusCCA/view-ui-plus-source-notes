# View UI Plus Architecture Overview 整體架構總覽

## 1. 本章定位

這篇筆記是一篇「View UI Plus 原始碼架構總覽筆記」，不是 component 實作分析，也不是完整 build 流程分析。

它承接 `00-roadmap/01-source-map.md`，但不重複做完整閱讀路線。本章的重點是建立 View UI Plus 作為 Vue 3 UI library 的整體心智模型，尤其是理解以下四件事：

1. View UI Plus 的 package entry 如何連到 runtime entry。
2. `src/index.js` 如何把 components、directives、locale、global config 與 imperative APIs 組裝成 library API。
3. `install(app, opts)` 如何讓使用者透過 `app.use(ViewUIPlus, options)` 安裝整套 UI library。
4. 各層程式碼應該如何分流到後續筆記，例如 components、style、types、directives、build 等主題。

讀完本章後，你應該能回答三個問題。

第一，View UI Plus 如何被 Vue app 安裝？

第二，`src/index.js` 在整個 library 中為什麼是 runtime composition 的核心？

第三，當你看到 `src/components/*`、`src/directives/*`、`src/locale/*`、`src/styles/*`、`types/*`、`build/*` 時，應該把它們分別放到哪一種閱讀脈絡中理解？

本章不深入處理以下內容：

- 不逐一分析每個 component 的 `props`、`events`、`slots`。
- 不深入分析單一 component 的 template、render function 或組件內部狀態。
- 不完整整理 service API 的內部實作，例如 `$Message`、`$Modal` 的具體渲染流程。
- 不追蹤 Less 變數、class 命名、theme token 與 style build output。
- 不完整分析 TypeScript declarations 的生成方式。
- 不分析完整 build、release、publish 流程。

這些內容會分流到後續主題筆記。

---

## 2. 學習前先建立的基本觀念

### 2.1 UI library 不只是 components 集合

初學 UI library 原始碼時，很容易以為一套 UI library 只是很多 components 的集合，例如 `Button`、`Input`、`Table`、`Modal`。但從 View UI Plus 這類 Vue UI library 的角度來看，它至少包含幾種不同層次的能力：

| 能力 | 說明 |
| --- | --- |
| Components | 可在 template 中使用的 UI 元件，例如按鈕、表單、表格、彈窗等 |
| Plugin install | 讓使用者透過 `app.use()` 一次安裝 library |
| Global registration | 將多個 component 全域註冊到 Vue app |
| Directives | 提供 Vue directive，例如尺寸、樣式、resize、line-clamp 等功能 |
| Global config | 保存全域設定，例如 size、transfer 與部分 component 的預設設定 |
| Imperative APIs | 透過 `this.$Message`、`this.$Modal` 等方式命令式呼叫 UI 服務 |
| Locale / i18n | 支援語系切換與國際化整合 |
| Styles | 提供 Less style system 與最終樣式輸出 |
| Types | 提供 TypeScript declarations，讓使用者在 TS 專案中取得型別提示 |
| Build / release | 把原始碼打包成 npm package 可消費的產物 |

因此，本篇看的是「UI library 如何被組裝成一個可安裝、可匯入、可呼叫、可型別提示、可打包發布的套件」。

---

### 2.2 Package entry 與 runtime entry 的差異

在閱讀 View UI Plus 這類 library 時，要先分清楚兩種入口。

第一種是 package entry，也就是 `package.json` 中宣告給 npm、bundler 或 TypeScript 使用的入口。它通常會告訴外部工具：

- runtime bundle 從哪裡進入。
- TypeScript declarations 從哪裡進入。
- build scripts 如何執行。
- package 的 dependencies、peer dependencies、files、exports 等資訊。

第二種是 runtime entry，也就是 View UI Plus 原始碼中真正負責組裝 library runtime API 的入口。在這份筆記中，這個角色主要由 `src/index.js` 承擔。

簡單說：

```txt
package.json
  負責告訴外部工具：「這個套件的入口在哪裡」。

src/index.js
  負責在執行期組裝：「這個套件對 Vue app 暴露什麼能力」。
```

如果把 library 想成一間公司，`package.json` 像是公司對外登記資料，告訴外界入口、地址與發佈資訊；`src/index.js` 則像是公司內部櫃台，真正把各部門能力整合後提供給使用者。

---

### 2.3 Vue plugin install 是 UI library 的安裝入口

在 Vue 3 中，library 常透過 plugin 形式安裝：

```js
app.use(ViewUIPlus, options)
```

這段程式碼背後的核心是：Vue 會呼叫 ViewUIPlus 物件上的 `install(app, options)` 方法。

因此，只要你看到：

```js
app.use(ViewUIPlus, options)
```

就要把它理解成：

```txt
Vue app
  -> 呼叫 ViewUIPlus.install(app, options)
  -> library 在 install() 中註冊 components、directives、globalProperties
```

這也是為什麼 `install(app, opts)` 是閱讀 View UI Plus runtime 組裝流程的關鍵入口。

---

### 2.4 Named imports 與 global registration 是兩種不同使用模式

View UI Plus 對外可能同時支援兩種使用方式。

第一種是 named imports：

```js
import { Button } from 'view-ui-plus'
```

這種方式讓使用者明確匯入需要的 component 或 API。

第二種是 global registration：

```js
app.use(ViewUIPlus)
```

這種方式會在 plugin 安裝階段把 components 全域註冊到 Vue app，使使用者可以在 template 中直接使用已註冊的 component。

這兩種方式不是同一件事。named imports 偏向「模組匯出層」；global registration 偏向「Vue app 執行期註冊層」。`src/index.js` 同時支援這兩種對外 API 形狀，所以它才會既有：

```js
export * from './components'
```

也有：

```js
install(app, opts)
```

---

### 2.5 Imperative APIs 是命令式服務，不是一般 template component

像 `$Message`、`$Notice`、`$Modal`、`$Spin`、`$Loading` 這類 API，通常不是讓你在 template 中直接寫成一般 component，而是讓你在程式邏輯中直接呼叫：

```js
this.$Message.info('操作成功')
```

這種 API 稱為 imperative API，也就是命令式 API。

它的特點是：使用者不是透過 template 宣告 UI，而是透過方法呼叫觸發 UI 效果。這類功能常用於訊息提示、通知、確認框、全域 loading 等場景。

因此在閱讀 `src/index.js` 時，要把 components registration 與 imperative APIs 注入分開理解。

---

## 3. 整體概覽

View UI Plus 的主要組裝路線可以先理解成以下流程：

```txt
package.json
  -> src/index.js
    -> src/components/index.js
    -> src/directives/*
    -> src/locale/*
    -> dayjs
    -> package version
    -> install(app, opts)
      -> Vue app runtime
```

這條路線說明：

1. `package.json` 宣告套件入口與建置資訊。
2. 外部使用者匯入 `view-ui-plus` 時，最終會進入 runtime entry。
3. `src/index.js` 是 runtime composition 的核心。
4. `src/index.js` 會收斂 components、directives、locale、version、dayjs 與 imperative APIs。
5. 使用者呼叫 `app.use(ViewUIPlus, options)` 時，會進入 `install(app, opts)`。
6. `install()` 會把 View UI Plus 的能力掛到 Vue app runtime 中。

如果用分層方式看，可以整理成：

```txt
使用者層
  -> Package entry layer
    -> Runtime entry layer
      -> Component export layer
        -> Component implementation layer
          -> Shared utility layer
            -> Directive / Locale / Style layer
              -> Type declaration layer
                -> Build / release layer
```

這個分層不是表示程式碼一定單向排列在資料夾中，而是一種閱讀心智模型。它幫助你分清楚：現在看到的檔案是在處理「對外入口」、「執行期組裝」、「元件實作」、「共用支撐」、「樣式」、「型別」還是「建置發布」。

---

## 4. 核心內容逐步講解

### 4.1 `package.json`：套件對外入口與工程資訊

`package.json` 是 package layer 的核心檔案。它本身不負責實作 component，也不負責在 Vue app 中註冊任何東西。它的角色是告訴 npm、bundler、TypeScript 與開發者：這個套件應該如何被解析、建置與使用。

在 View UI Plus 的架構脈絡中，`package.json` 至少可以從幾個角度閱讀：

| 角度 | 閱讀重點 |
| --- | --- |
| Runtime entry | 套件被 `import` 時會進入哪個 bundle 或入口 |
| Type entry | TypeScript 型別宣告從哪裡進入 |
| Build scripts | 專案如何 build、打包 style、處理語系或發布 |
| Dependencies | library 執行期或建置期依賴哪些套件 |
| Package metadata | 套件名稱、版本、發佈檔案與其他 npm 資訊 |

`package.json` 會定義 runtime bundle、TypeScript 型別入口與 build scripts。這裡需要注意：本篇不展開實際欄位值，例如 `main`、`module`、`exports`、`typings` 等，這些應留到 `14-build-release/01-build-map.md` 或 package entry 專題筆記中確認。

此處需要後續補充：`package.json` 中實際的 runtime entry、type entry、exports 設定與 build scripts 對應關係。

---

### 4.2 `src/index.js`：runtime composition 的核心入口

`src/index.js` 是 View UI Plus 的 runtime entry。它不是某個單一 component 的實作檔，而是整個 library 在執行期的組裝層。

它的責任可以分成六類：

1. 對外轉出 components。
2. 匯入全部 components 並組成可註冊集合。
3. 匯入 locale、directives、dayjs 與 package version。
4. 建立 `ViewUI` 物件，作為 components 全量註冊來源。
5. 定義 `install(app, opts)`，處理 Vue plugin 安裝流程。
6. 組成 default `API`，對外提供 `install`、`version`、`locale`、`i18n`、`lang` 與所有 components。

```js
export * from './components'
```

這表示 `src/index.js` 會把 `src/components/index.js` 匯出的內容再往外轉出。這對 named imports 很重要，因為使用者才能透過類似以下形式取得 component：

```js
import { Button } from 'view-ui-plus'
```

```js
import * as components from './components'
```

這代表 `src/index.js` 會把 components 收斂成一個物件。這個物件後續可以被展開到 `ViewUI` 中，供 `install()` 全量註冊使用。

所以 `src/index.js` 同時支援兩種用途：

```txt
export * from './components'
  -> 支援 named imports

import * as components from './components'
  -> 支援 install() 全量註冊
```

這是理解 View UI Plus 對外 API 形狀的關鍵。

---

### 4.3 `src/components/index.js`：component export layer

`src/components/index.js` 是 component export layer。它的主要責任不是實作每個 component，而是集中匯出 components。

可以把它想成 components 的總目錄。

```txt
src/components/index.js
  -> 匯出 Button
  -> 匯出 Form
  -> 匯出 Input
  -> 匯出 Table
  -> 匯出其他 components
```

這一層很重要，因為它會被 `src/index.js` 使用：

```txt
src/index.js
  -> export * from './components'
  -> import * as components from './components'
```

也就是說，`src/components/index.js` 同時影響：

1. 使用者能否 named import 某個 component。
2. `install()` 全量註冊時能否取得該 component。
3. default `API` 是否能展開所有 components。

閱讀這個檔案時，不應一開始就跳進每個 component 的內部實作，而是先確認：

- 它匯出了哪些 component。
- 匯出名稱是否和使用者看到的 API 名稱一致。
- 是否有 service 類型的 component 或特殊匯出。
- 是否有部分 component 需要額外 alias 或相容處理。

---

### 4.4 `ViewUI` 物件：全量註冊 components 的來源

`src/index.js` 會建立 `ViewUI` 物件，並且除了展開 `components` 之外，也會額外建立部分 `i` 前綴 alias，例如：

- `iButton`
- `iForm`
- `iInput`
- `iTable`

這代表在全量註冊時，同一個 component 可能會有標準名稱與相容名稱。

例如概念上可以理解成：

```txt
ViewUI
  -> Button
  -> Form
  -> Input
  -> Table
  -> iButton
  -> iForm
  -> iInput
  -> iTable
```

這類 alias 通常和歷史相容、命名習慣或舊版本遷移有關。不過，本篇不推測 View UI Plus 實際設計原因，只先保留結論：`ViewUI` 不只是單純展開 `components`，它也可能包含額外對外註冊名稱。

閱讀這段時要注意：如果你在 template 中看到不同命名形式的 component，可能不是兩個不同實作，而是同一個 component 被註冊成不同名稱。

此處需要後續補充：完整確認 `ViewUI` 中有哪些 alias，以及這些 alias 是否主要為了相容舊版 iView / View UI 命名習慣。

---

### 4.5 `install(app, opts)`：Vue plugin 安裝流程

`install(app, opts)` 是 View UI Plus plugin layer 的核心。當使用者寫：

```js
app.use(ViewUIPlus, options)
```

Vue 會呼叫 ViewUIPlus 的 `install(app, options)`。

install flow 可以展開成以下流程：

```txt
app.use(ViewUIPlus, options)
  -> install(app, opts)
    -> 檢查是否已安裝
    -> 設定 locale
    -> 設定 i18n
    -> 全量註冊 components
    -> 註冊 directives
    -> 注入 $VIEWUI
    -> 注入 imperative APIs
    -> 注入 $Date = dayjs
```

這個流程表示 View UI Plus 的 `install()` 同時做三大類事情。

第一類是註冊 UI 能力：

- components
- directives

第二類是設定全域環境：

- locale
- i18n
- `$VIEWUI`
- `$Date`

第三類是注入命令式服務：

- `$Spin`
- `$Loading`
- `$Message`
- `$Notice`
- `$Modal`

因此，不要把 `install()` 狹義理解成「只是在註冊 components」。對 UI library 來說，`install()` 通常是整套 library 進入 Vue app runtime 的總入口。

---

### 4.6 防止重複安裝：`install.installed`

install flow 的第一步是防止重複安裝：

| 階段 | 行為 |
| --- | --- |
| 防止重複安裝 | 若 `install.installed` 已存在，直接 return |

這表示 `install()` 內部會用某種旗標記錄 library 是否已經安裝過。

它的目的通常是避免以下問題：

- components 被重複註冊。
- directives 被重複註冊。
- globalProperties 被重複覆寫。
- service API 被重複初始化。

對閱讀者來說，這段不是 business logic，而是 plugin 安裝時的保護機制。看到它時，不需要過度深入，先知道它是為了避免 `app.use()` 重複執行即可。

---

### 4.7 Locale 與 i18n setup：語系與國際化整合

`install(app, opts)` 中會檢查使用者是否傳入語系或 i18n 設定。

| 設定 | 行為 |
| --- | --- |
| `opts.locale` | 呼叫 `localeFile.use(opts.locale)` |
| `opts.i18n` | 呼叫 `localeFile.i18n(opts.i18n)` |

這表示 View UI Plus 的語系能力不是孤立存在的，而是會在 plugin 安裝階段被接上 Vue app 的使用情境。

可以這樣理解：

```txt
使用者傳入 options
  -> install(app, opts)
    -> 如果有 opts.locale，切換 View UI Plus 內部語系
    -> 如果有 opts.i18n，整合外部 i18n 方法
```

這裡要注意：本篇只說明 locale/i18n 在 install flow 中的位置，不展開 `src/locale/*` 內部如何保存語系資料、如何取詞、如何與 component 文案互動。這些應該放到後續 locale 專題筆記。

---

### 4.8 Component registration：全量註冊 components

`install(app, opts)` 會遍歷 `ViewUI`，並使用：

```js
app.component(key, ViewUI[key])
```

將 components 全量註冊到 Vue app。

這段是 View UI Plus 能支援全域 component 使用的核心。

概念流程如下：

```txt
ViewUI 物件
  -> Button
  -> Input
  -> Table
  -> Modal
  -> ...

install()
  -> Object.keys(ViewUI)
  -> app.component(key, ViewUI[key])
```

註冊完成後，使用者在 Vue template 中就可以使用被註冊的 component。

不過，要注意一件事：全量註冊方便，但可能會影響 tree-shaking 或 bundle size。是否支援按需載入、如何搭配 build output 或 resolver，是另一個主題，不在本篇展開。

此處需要後續補充：View UI Plus 在實際使用中是否建議全量引入、按需引入，及其與 bundler tree-shaking 的關係。

---

### 4.9 Directive registration：註冊 Vue directives

除了 components， `install()` 會遍歷 directives，並使用：

```js
app.directive(key, directives[key])
```

註冊 Vue directives。

Directives 與 components 不同。component 是一個 UI 單位；directive 則是附加在 DOM 或 component 上的行為指令。

例如 directives 可能包含尺寸、樣式、resize、line-clamp 等能力。這代表 View UI Plus 不只提供元件，也可能提供一些較底層的 DOM 行為或視覺輔助功能。

閱讀 directives 時應注意：

- directive 的名稱如何被註冊。
- directive 作用在哪些 DOM 或 component 場景。
- directive 是否依賴瀏覽器 API，例如 resize observer 或 DOM measurement。
- directive 是否和 styles 或 components 有耦合。

本篇只確認 directives 屬於 install flow 的一部分，不深入每個 directive 實作。

---

### 4.10 Global config：`$VIEWUI`

`install()` 會寫入：

```js
app.config.globalProperties.$VIEWUI
```

`$VIEWUI` 用來保存全域設定，例如：

- `size`
- `transfer`
- 各 component 的 icon/config

可以把 `$VIEWUI` 理解成 View UI Plus 在 Vue app instance 上掛載的一份「全域設定物件」。

它的用途通常是讓 component 在執行期可以讀到 library 層級的設定。例如某些 component 可能需要知道預設尺寸、是否將彈層轉移到 body、預設 icon 設定等。

閱讀 `$VIEWUI` 時要把握兩點。

第一，它不是一般使用者資料狀態，而是 UI library 的全域設定容器。

第二，它放在 `app.config.globalProperties` 上，代表 component instance 或使用者程式可以透過 Vue instance 的全域屬性存取它。

此處需要後續補充：實際有哪些 component 會讀取 `$VIEWUI`，以及它們讀取的是哪些設定欄位。

---

### 4.11 Imperative APIs：`$Message`、`$Notice`、`$Modal` 等服務能力

View UI Plus 會注入多個 imperative APIs：

- `$Message`
- `$Notice`
- `$Modal`
- `$Spin`
- `$Loading`

這些 API 的定位與普通 component 不同。它們通常用於「程式觸發 UI」的場景。

例如：

```js
this.$Message.success('儲存成功')
this.$Modal.confirm({
  title: '確認刪除',
  content: '刪除後將無法復原'
})
```

這類 API 不要求你在 template 中先宣告 `<Message />` 或 `<Modal />`，而是透過 JavaScript 方法直接產生 UI 效果。

這對 UI library 來說很重要，因為很多互動場景不是靜態 template 可以完全描述的。例如：

- API 請求成功後顯示提示。
- 表單送出前跳出確認框。
- 全頁 loading 開始與結束。
- 系統通知從任何頁面觸發。

閱讀這類 API 時，後續可以再追三個方向：

1. 它們如何被掛到 `app.config.globalProperties`。
2. 它們背後是否仍然依賴某些 component。
3. 它們如何在 DOM 中建立、更新與銷毀 UI。

本篇只處理 imperative APIs 在 architecture overview 中的位置，不展開其內部實作。

---

### 4.12 `$Date = dayjs`：日期工具的全域注入

`install()` 會寫入：

```js
$Date = dayjs
```

這代表 View UI Plus 會把 `dayjs` 作為日期輔助能力掛到 Vue instance 的 globalProperties 上。

這樣做的效果是，使用者或內部 component 可以透過全域屬性取得日期處理工具。

不過，本篇不推測 View UI Plus 為什麼選擇這樣暴露，也不分析哪些 component 使用 `$Date`。這應在後續閱讀日期相關 component，例如 DatePicker 或 TimePicker 時再確認。

---

### 4.13 Styles、Types 與 Build：不是 runtime install 的同一層

`src/index.js` 和 `install()` 解決的是 runtime API 組裝問題。

`src/styles/*` 解決的是視覺樣式如何被組織、編譯與輸出。

`types/*` 解決的是 TypeScript 使用者如何取得型別宣告。

`build/*` 解決的是原始碼如何被打包成可發布、可安裝、可被 bundler 消費的產物。

可以整理成：

```txt
runtime entry
  -> 解決執行期如何安裝與呼叫

style system
  -> 解決樣式如何組織與輸出

type system
  -> 解決型別如何提供給使用者

build system
  -> 解決套件如何建置與發布
```

這些層彼此相關，但不應混成同一篇細節筆記。這也是本篇需要維持「overview」定位的原因。

---

## 5. 表格整理

### 5.1 Layer Map 分層地圖

| Layer | Path | 主要責任 | 初次閱讀重點 | 後續分流 |
| --- | --- | --- | --- | --- |
| Package layer | `package.json` | 宣告 npm package 入口、型別入口、建置命令與套件資訊 | 先確認 runtime entry、types entry、build scripts 的方向，不急著細讀每個 script | `14-build-release/01-build-map.md` |
| Runtime entry layer | `src/index.js` | 組裝並對外暴露 View UI Plus 的 runtime API | 觀察 components、directives、locale、globalProperties 與 install flow 如何被組合 | `04-plugin-system/01-install-flow.md` |
| Component export layer | `src/components/index.js` | 集中 export 所有 components | 確認有哪些 named exports，以及它們如何被 `src/index.js` 收斂 | `07-components/01-components-map.md` |
| Component implementation layer | `src/components/*` | 實作各 component 與 service API | 不要一次深入全部 component，先依系統分類閱讀，例如 form、overlay、data display | `07-components/`, `08-overlay-system/`, `09-form-system/`, `10-imperative-api/` |
| Directive layer | `src/directives/*` | 實作 Vue directives | 觀察 directive 的註冊名稱、生命週期與 DOM 行為 | `11-directives/01-directives-map.md` |
| Locale layer | `src/locale/*` | 處理 locale 與 i18n | 觀察 `localeFile.use()`、`localeFile.i18n()` 與 component 文案如何互動 | 後續可獨立成 locale 筆記 |
| Shared layer | `src/mixins/*`, `src/utils/*` | 提供共用 mixins 與 utilities | 優先關注被多個 components 共用的工具，而不是孤立函式 | `05-composables/` 或 architecture 補充 |
| Style layer | `src/styles/*` | 管理 Less 樣式入口與樣式模組 | 觀察樣式入口、common、mixins、components style 的依賴方向 | `12-style-system/01-style-entry-map.md` |
| Type layer | `types/*` | 提供 TypeScript declarations | 觀察 plugin、component props、instance globalProperties 的型別如何對外暴露 | `06-type-system/01-type-entry-map.md` |
| Build layer | `build/*` | 定義 build、style、lang 相關流程 | 觀察 source 如何轉成 dist、types、style artifacts | `14-build-release/01-build-map.md` |

---

### 5.2 Runtime Composition 組裝表

| 組裝項目 | 位置 / 寫法 | 角色 | 閱讀重點 |
| --- | --- | --- | --- |
| Component named exports | `export * from './components'` | 將 components 轉出給外部使用者 named import | 確認 `src/components/index.js` 匯出的 API 是否就是使用者可 import 的名稱 |
| Component collection | `import * as components from './components'` | 將 components 收斂成物件，供 `ViewUI` 與 `install()` 使用 | 理解它和 named exports 的用途不同 |
| `ViewUI` object | `ViewUI = { ...components, ...aliases }` | 作為全量註冊 components 的來源 | 觀察是否有標準名稱與 `i` 前綴 alias |
| Locale setup | `localeFile.use(opts.locale)` | 設定 View UI Plus 語系 | 不在本篇展開 locale 內部資料結構 |
| i18n setup | `localeFile.i18n(opts.i18n)` | 整合外部 i18n 能力 | 後續需確認 i18n function 如何被 component 使用 |
| Component registration | `app.component(key, ViewUI[key])` | 將 components 全域註冊到 Vue app | 理解全量註冊與 named import 的差異 |
| Directive registration | `app.directive(key, directives[key])` | 將 directives 註冊到 Vue app | 後續閱讀 directive 生命週期與 DOM 行為 |
| Global config | `app.config.globalProperties.$VIEWUI` | 注入 View UI Plus 全域設定 | 後續確認哪些 component 會讀取它 |
| Imperative APIs | `$Message`, `$Notice`, `$Modal`, `$Spin`, `$Loading` | 提供命令式 UI 服務 | 後續追蹤 service API 如何建立與銷毀 UI |
| Date helper | `$Date = dayjs` | 提供全域日期工具 | 後續可在日期相關 component 中確認使用情境 |

---

### 5.3 Plugin Install Flow 流程表

| 步驟 | 發生位置 | 主要動作 | 輸入 | 輸出 / 影響 | 注意事項 |
| --- | --- | --- | --- | --- | --- |
| 1 | `install(app, opts)` | 檢查是否已安裝 | `install.installed` | 若已安裝則直接 return | 避免重複註冊與重複注入 |
| 2 | `install(app, opts)` | 設定 locale | `opts.locale` | 呼叫 `localeFile.use(opts.locale)` | 只處理安裝階段的語系設定 |
| 3 | `install(app, opts)` | 設定 i18n | `opts.i18n` | 呼叫 `localeFile.i18n(opts.i18n)` | 內部整合細節留到 locale 筆記 |
| 4 | `install(app, opts)` | 全量註冊 components | `ViewUI` | `app.component(key, ViewUI[key])` | 這是 global components 的來源 |
| 5 | `install(app, opts)` | 註冊 directives | `directives` | `app.directive(key, directives[key])` | directive 和 component 是不同機制 |
| 6 | `install(app, opts)` | 注入 global config | options / defaults | `$VIEWUI` | 保存 UI library 全域設定 |
| 7 | `install(app, opts)` | 注入 service APIs | service modules | `$Message`、`$Notice`、`$Modal` 等 | 這些屬於 imperative APIs |
| 8 | `install(app, opts)` | 注入日期工具 | `dayjs` | `$Date` | 實際使用場景需後續追蹤 |

---

### 5.4 Public API Shape 對外 API 形狀

| API 類型 | 使用形式 | 來源 | 使用情境 | 閱讀重點 |
| --- | --- | --- | --- | --- |
| Vue plugin install | `app.use(ViewUIPlus, options)` | default export 的 `install` | 全量安裝 UI library | 從 `src/index.js` 的 `install(app, opts)` 開始讀 |
| Named imports | `import { Button } from 'view-ui-plus'` | `export * from './components'` | 單獨匯入 component 或 API | 追到 `src/components/index.js` |
| Global components | template 中直接使用已註冊 component | `install()` 全量註冊 | 使用者不想每個 component 都手動 import | 觀察 `ViewUI` 被如何遍歷 |
| Global config | `this.$VIEWUI` 或 instance globalProperties | `app.config.globalProperties.$VIEWUI` | component 或使用者讀取全域設定 | 後續追蹤設定欄位與讀取位置 |
| Imperative APIs | `this.$Message`、`this.$Modal`、`this.$Notice` | `app.config.globalProperties` | 訊息提示、通知、彈窗、loading 等命令式 UI | 後續追 service API 實作 |
| Locale APIs | `locale`、`i18n`、`lang` | `src/index.js` named exports | 語系切換與 i18n 整合 | 後續讀 `src/locale/*` |
| Type declarations | component props、instance、plugin options 型別 | `types/index.d.ts`、`types/viewuiplus.components.d.ts` | TypeScript 專案取得型別提示 | 後續讀 type entry map |

---

### 5.5 Dependency Direction 依賴方向

| 起點 | 依賴方向 | 說明 | 閱讀意義 |
| --- | --- | --- | --- |
| `src/index.js` | `src/components/` | 收斂 components 並對外轉出 | 這是 named exports 與全量註冊的共同來源 |
| `src/index.js` | `src/directives/` | 收斂 directives 並在 install 中註冊 | 說明 directives 是 plugin install 的一部分 |
| `src/index.js` | `src/locale/` | 設定 locale 與 i18n | 說明語系能力在 runtime entry 被接入 |
| `src/index.js` | `package.json version` | 取得 package version | 說明 runtime API 可能暴露版本資訊 |
| `src/components/` | `src/utils/`、`src/mixins/` | components 使用共用工具與 mixins | 後續分析 component 時要追共用支撐層 |
| `src/components/` | `src/locale/` | components 可能讀取語系文案 | 後續可從 component 追到 locale |
| `src/components/` | `src/styles/` | component 與 style system 對應 | 樣式分析要另外分流 |
| `src/styles/` | `animation/`、`common/`、`components/`、`mixins/` | Less 樣式內部分層 | 適合放到 style system 筆記 |
| `package.json` | `build scripts`、`dependencies`、`main`、`typings` | 定義 package 工程與輸出入口 | 適合放到 build/release 筆記 |

---

## 6. 範例或情境說明

### 6.1 使用者全量安裝 View UI Plus

使用者在 Vue 3 專案中可能會寫：

```js
import { createApp } from 'vue'
import ViewUIPlus from 'view-ui-plus'
import App from './App.vue'

const app = createApp(App)

app.use(ViewUIPlus, {
  // options，例如 locale 或 i18n
})

app.mount('#app')
```

從架構角度看，這段程式會觸發：

```txt
app.use(ViewUIPlus, options)
  -> ViewUIPlus.install(app, options)
  -> 註冊 components
  -> 註冊 directives
  -> 設定 locale / i18n
  -> 注入 $VIEWUI
  -> 注入 $Message / $Modal / $Notice / $Spin / $Loading
  -> 注入 $Date
```

所以，當使用者只寫一行 `app.use(ViewUIPlus)` 時，背後其實完成了多層 runtime 組裝。

---

### 6.2 使用者透過 named import 使用 component

使用者也可能寫：

```js
import { Button } from 'view-ui-plus'
```

這時你要回到 `src/index.js` 的：

```js
export * from './components'
```

再追到：

```txt
src/components/index.js
  -> Button 的匯出位置
  -> Button 的實作資料夾
```

這條路線適合用來理解「某個 component 是如何被對外匯出的」。

---

### 6.3 使用者呼叫 imperative API

使用者在 component instance 中可能會寫：

```js
this.$Message.success('儲存成功')
```

這時不要把 `$Message` 當成普通 component 來讀。它是透過 `app.config.globalProperties` 注入的 imperative API。

閱讀路線應該是：

```txt
src/index.js
  -> install(app, opts)
    -> app.config.globalProperties.$Message = ...
      -> 追蹤 $Message 來源
        -> 追 service API 如何建立 UI
```

這類 API 後續適合整理成 `10-imperative-api/` 主題筆記。

---

## 7. 閱讀路線或學習路線

### 7.1 初次閱讀路線

第一次讀 View UI Plus 架構時，不建議一開始就跳進 `Button`、`Table`、`Form` 等 component 的細節。比較好的順序是先掌握 library 如何被組裝。

建議路線如下：

1. 先讀 `package.json`  
   目的不是細讀每個 script，而是確認這個套件的 package entry、type entry、build scripts 與發佈資訊大致在哪裡。

2. 再讀 `src/index.js`  
   這是最重要的 runtime entry。要特別觀察 `export * from './components'`、`import * as components from './components'`、`ViewUI`、`install(app, opts)`、default `API`。

3. 接著讀 `src/components/index.js`  
   確認 components 如何被集中 export，哪些名稱會成為對外 API，哪些 component 可能有特殊處理。

4. 再回到 `install(app, opts)`  
   逐步確認 components、directives、locale、global config、imperative APIs、`$Date` 是如何被註冊或注入的。

5. 最後讀 layer map 對應的資料夾  
   例如 `src/directives/*`、`src/locale/*`、`src/styles/*`、`types/*`、`build/*`，先建立地圖，不急著深入。

---

### 7.2 深入閱讀路線

當整體架構熟悉後，可以依主題拆分深入。

| 深入主題 | 建議入口 | 閱讀目標 |
| --- | --- | --- |
| Plugin system | `src/index.js`、`install(app, opts)` | 完整理解 View UI Plus 如何安裝到 Vue app |
| Component system | `src/components/index.js`、`src/components/*` | 理解 component 匯出、註冊與實作分類 |
| Overlay system | Modal、Message、Notice、Loading 相關實作 | 理解彈窗、提示、通知、loading 的建立與銷毀 |
| Form system | Form、Input、Select、Checkbox 等 | 理解表單元件如何處理 value、validation、layout |
| Directive system | `src/directives/*` | 理解 directive 的註冊與 DOM 行為 |
| Locale system | `src/locale/*` | 理解語系、i18n 與 component 文案關係 |
| Style system | `src/styles/*` | 理解 Less 樣式入口、變數、mixins 與 component style |
| Type system | `types/*` | 理解 component props、plugin options、globalProperties 的 TS 型別 |
| Build system | `build/*`、`package.json` | 理解 source 如何變成 npm package output |

---

### 7.3 可以暫時跳過的部分

在 overview 階段，可以暫時跳過以下內容：

- 每個 component 的完整 props、events、slots。
- 每個 Less 變數與 class 命名規則。
- 每個 service API 的 DOM 建立細節。
- build script 中每個參數的具體含義。
- TypeScript declaration 的所有細節。
- 單一 directive 的所有 edge cases。

原因是這些內容都屬於「深入主題」，如果在架構總覽階段一次展開，筆記會變成雜亂的細節清單，反而失去 overview 的定位。

---

## 8. 常見誤區

| 誤區 | 為什麼容易誤解 | 正確理解 |
| --- | --- | --- |
| 以為 `src/index.js` 是某個 component 的實作檔 | 檔名叫 `index.js`，容易被當成一般模組入口 | `src/index.js` 是整個 library 的 runtime composition layer，負責組裝 API 與 install flow |
| 以為 `app.use(ViewUIPlus)` 只是註冊 components | 很多教學只簡化成「安裝 UI library」 | `install()` 同時可能註冊 components、directives，注入 global config、imperative APIs、日期工具與 locale/i18n |
| 混淆 named imports 與 global registration | 兩者都能讓使用者使用 component | named imports 來自 `export * from './components'`；global registration 來自 `install()` 中的 `app.component()` |
| 把 `$Message`、`$Modal` 當成一般 component | 它們也會產生 UI，所以容易被歸類成 component | 它們是 imperative APIs，重點在於透過方法呼叫觸發 UI |
| 以為 `$VIEWUI` 是業務資料狀態 | 名稱像全域變數，容易和 app state 混淆 | `$VIEWUI` 是 View UI Plus 的 global config 容器，用於保存 UI library 設定 |
| 在 overview 階段深入每個 component | component 很多，容易被細節吸走 | overview 階段應先建立 layer map，再把 component 細節分流到專題筆記 |
| 把 styles、types、build 都放進 install flow | 它們都屬於 library 架構，所以容易混在一起 | `install()` 是 runtime 安裝流程；styles、types、build 是樣式、型別與工程輸出層 |
| 看到 `iButton`、`iForm` 就以為是不同 component | alias 名稱看起來像不同元件 | 需要確認它是否只是同一 component 的相容註冊名稱 |

---

## 9. 本章總結

View UI Plus 作為 Vue 3 UI library，不只是多個 components 的集合。它是一套由 package entry、runtime entry、component exports、plugin install flow、directives、locale、global config、imperative APIs、styles、types 與 build system 組成的完整 library 架構。

在這個架構中，`package.json` 負責對外宣告套件入口、型別入口與建置資訊；`src/index.js` 則是執行期的組裝核心。`src/index.js` 一方面透過 `export * from './components'` 支援 named imports，另一方面透過 `import * as components from './components'` 收斂所有 components，建立 `ViewUI` 物件，並在 `install(app, opts)` 中把 components、directives、global config 與 imperative APIs 掛入 Vue app。

`install(app, opts)` 是理解 View UI Plus plugin system 的關鍵。它不是單純註冊 components，而是整套 library 進入 Vue app runtime 的安裝入口。它處理防止重複安裝、locale/i18n setup、component registration、directive registration、`$VIEWUI`、`$Message`、`$Notice`、`$Modal`、`$Spin`、`$Loading` 與 `$Date` 等能力。

閱讀這份原始碼時，最重要的是先建立分層心智模型。`src/components/*` 是 UI 與 service API 的主體；`src/utils/*`、`src/mixins/*`、`src/directives/*`、`src/locale/*` 是共用支撐；`src/styles/*` 管理樣式系統；`types/*` 提供 TypeScript declarations；`build/*` 與 `package.json` 則處理建置與發布。

因此，本篇筆記的核心結論是：View UI Plus 以 `src/index.js` 作為安裝與 API 組裝入口，向下收斂 components、directives、locale、styles 與 shared utilities，向外透過 plugin、named exports、globalProperties、types 與 build artifacts 提供 Vue 3 UI library 的完整使用介面。

---

## 10. 自我檢查問題

1. 為什麼說 `src/index.js` 是 View UI Plus 的 runtime composition layer，而不是單一 component 實作檔？

2. `package.json` 和 `src/index.js` 都可以被稱為「入口」，但它們分別解決什麼問題？

3. `export * from './components'` 和 `import * as components from './components'` 在用途上有什麼差異？

4. 使用者呼叫 `app.use(ViewUIPlus, options)` 時，背後大致會進入哪個流程？

5. 為什麼 `install(app, opts)` 不應該只被理解成「註冊 components」？

6. `app.component(key, ViewUI[key])` 和 `app.directive(key, directives[key])` 分別在安裝流程中負責什麼？

7. `$VIEWUI`、`$Message`、`$Modal` 這三者都掛在 `app.config.globalProperties` 上，但它們的角色有什麼不同？

8. 為什麼 `$Message`、`$Notice`、`$Modal` 這類 API 適合被歸類為 imperative APIs？

9. 如果你想追蹤 `Button` 如何被使用者 named import，應該從哪些檔案開始讀？

10. 為什麼 overview 筆記不應該深入每個 component 的 props、events、slots？

---

## 11. 後續延伸方向

這份 architecture overview 後續可以拆成以下主題筆記。

| 延伸主題 | 建議檔案 | 說明 |
| --- | --- | --- |
| Plugin install flow 詳解 | `04-plugin-system/01-install-flow.md` | 專門分析 `install(app, opts)` 的每個步驟 |
| Component export map | `07-components/01-components-map.md` | 整理 `src/components/index.js` 的匯出結構 |
| Component registration 與 alias | `07-components/02-component-registration.md` | 分析標準 component 名稱與 `i` 前綴 alias |
| Imperative API 系統 | `10-imperative-api/01-message-modal-notice-map.md` | 分析 `$Message`、`$Notice`、`$Modal` 等命令式 API |
| Overlay system | `08-overlay-system/01-overlay-map.md` | 分析 Modal、Drawer、Tooltip、Poptip 等 overlay 類元件 |
| Form system | `09-form-system/01-form-map.md` | 分析 Form、Input、Select、Checkbox 等表單系統 |
| Directive system | `11-directives/01-directives-map.md` | 整理 `src/directives/*` 的註冊與實作 |
| Locale system | `13-locale-system/01-locale-map.md` | 分析 `src/locale/*`、`locale`、`i18n`、`lang` |
| Style system | `12-style-system/01-style-entry-map.md` | 分析 Less 入口、樣式分層與 component style |
| Type system | `06-type-system/01-type-entry-map.md` | 分析 `types/index.d.ts` 與 component declarations |
| Build and release | `14-build-release/01-build-map.md` | 分析 `package.json`、`build/*` 與發佈產物 |

後續閱讀時，應維持一個原則：overview 只負責建立地圖；細節要分流到對應主題筆記。這樣才能避免架構總覽變成過度龐雜的細節集合，也能讓個人知識庫更容易長期維護。
