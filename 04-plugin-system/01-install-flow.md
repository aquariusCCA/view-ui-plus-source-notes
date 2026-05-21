# View UI Plus Plugin 安裝流程：從 `app.use()` 到全域能力注入

## 1. 本章定位

本篇筆記屬於 **原始碼閱讀筆記 + Vue Plugin 架構分析筆記**。

它放在 `04-plugin-system/` 目錄下是合理的，因為本篇討論的主題不是單一元件如何實作，而是 `View UI Plus` 如何透過 Vue plugin 機制，把整套 UI library 接入使用者的 Vue App。

本章主要解決三個問題：

1. 使用者呼叫 `app.use(ViewUIPlus, options)` 之後，實際會進入哪個原始碼入口。
2. `install(app, opts)` 在安裝過程中做了哪些事情。
3. 安裝完成後，Vue App 會得到哪些全域能力。

本章不深入解決以下問題：

1. 不詳細分析每個 component 的內部實作。
2. 不詳細分析每個 directive 的邏輯。
3. 不展開 `$Message`、`$Modal`、`$Notice` 等 service API 的內部機制。
4. 不完整分析 `$VIEWUI` 每個設定項目的語意。
5. 不詳細分析 TypeScript 宣告檔如何描述這些 runtime API。

這些內容會分散到後續筆記中，例如：

* `04-plugin-system/02-component-registration.md`
* `04-plugin-system/03-directive-registration.md`
* `04-plugin-system/04-global-options-and-viewui-config.md`
* `04-plugin-system/05-global-properties.md`
* `04-plugin-system/06-locale-plugin-contract.md`
* `04-plugin-system/07-runtime-type-contract.md`

---

## 2. 學習前先建立的基本觀念

在閱讀 `View UI Plus` 的 plugin 安裝流程之前，需要先理解 Vue plugin 的基本角色。

在 Vue 3 中，`app.use(plugin, options)` 是一種把外部功能安裝到 Vue App 的標準方式。對 UI library 來說，plugin 通常負責把元件、指令、全域設定、命令式 API 等能力一次性掛到 app 上，讓使用者不需要逐一手動註冊。

以使用者角度來看，通常只會寫：

```js
import ViewUIPlus from 'view-ui-plus';

app.use(ViewUIPlus, options);
```

但從 library 原始碼角度來看，這行程式的意義是：

```txt
把 View UI Plus 這個 plugin 交給 Vue App，
由 Vue App 呼叫 plugin 裡的 install 方法，
讓 View UI Plus 有機會對 app 做全局註冊與能力注入。
```

所以，閱讀本篇時不能只把 `install()` 理解成「註冊元件的地方」。它更像是整個 UI library 的 **安裝總控層**。

它會負責協調：

1. 哪些 component 要全局註冊。
2. 哪些 directive 要全局註冊。
3. 哪些 service API 要掛到 component instance 上。
4. 哪些全域設定要寫入 `$VIEWUI`。
5. locale / i18n 這類跨元件能力要如何初始化。
6. dayjs 這類工具要如何暴露給使用者。

因此，本篇的閱讀重點不是某個元件的細節，而是整個 library 如何把「分散在各模組的能力」集中安裝到 Vue App。

---

## 3. 整體概覽

本篇追蹤的核心 source 是：

```txt
01-origin/source/view-ui-plus-v1.3.20/src/index.js
```

特別是其中的：

```js
install(app, opts)
```

`View UI Plus` 的 default export 是一個 `API` object，裡面包含：

```txt
version
locale
i18n
install
lang
...components
```

因此，當使用者呼叫：

```js
app.use(ViewUIPlus, options);
```

Vue 會將 `ViewUIPlus` 視為 plugin，並呼叫它提供的 `install` 方法。換句話說，runtime 的主要呼叫關係可以理解成：

```txt
使用者 main.js / main.ts
  -> app.use(ViewUIPlus, options)
    -> ViewUIPlus.install(app, options)
      -> 執行 View UI Plus 的全局安裝流程
```

`install(app, opts = {})` 的流程可以整理成六個階段：

```txt
install(app, opts)
  -> 防重複安裝檢查
  -> 套用 locale / i18n options
  -> 註冊全局 components
  -> 註冊全局 directives
  -> 寫入 $VIEWUI 全域設定
  -> 寫入命令式 service APIs 與 $Date
```

這六個階段可以視為 View UI Plus plugin system 的主幹。後續其他筆記，例如 component registration、directive registration、global options、global properties，其實都是從這條主幹拆出去的細節章節。

---

## 4. 核心內容逐步講解

### 4.1 `app.use(ViewUIPlus, options)` 是安裝流程的使用者入口

從使用者角度來看，安裝 View UI Plus 通常只需要在 Vue App 建立後呼叫：

```js
import ViewUIPlus from 'view-ui-plus';

app.use(ViewUIPlus, options);
```

這段程式碼看起來很簡單，但它是整個 plugin system 的外部入口。使用者不需要知道 View UI Plus 內部有哪些 component、directive 或 service API，只要把整個 plugin 傳給 Vue App。

Vue App 接收到 plugin 後，會根據 plugin 形式決定如何安裝。以這份筆記追蹤的情況來看，`ViewUIPlus` 的 default export 是一個 `API` object，而這個 object 裡面包含 `install` 方法。因此，`app.use(ViewUIPlus, options)` 最終會導向：

```js
API.install(app, options);
```

這裡的 `app` 是 Vue App instance，`options` 則是使用者傳入的 plugin options。也就是說，`install(app, opts)` 具備兩個重要資訊：

| 參數     | 角色               | 說明                                                                                       |
| ------ | ---------------- | ---------------------------------------------------------------------------------------- |
| `app`  | Vue App instance | View UI Plus 透過它呼叫 `app.component()`、`app.directive()`，並寫入 `app.config.globalProperties` |
| `opts` | 安裝選項             | 使用者傳入的全域設定，例如 locale、i18n、size、transfer、capture 等                                        |

這也是為什麼 `install()` 是閱讀 View UI Plus plugin system 時的第一個入口：它拿到了 Vue App，也拿到了使用者設定，因此可以把整個 library 的全域能力接到 Vue App 上。

---

### 4.2 `API` object 是 View UI Plus 對外輸出的 plugin 物件

runtime 裡的 default export 是 `API` object，內含：

```txt
version
locale
i18n
install
lang
...components
```

這表示 `ViewUIPlus` 不只是單純輸出一個 `install` 函式，而是把多種對外能力包裝成同一個 object。

可以把它理解成 View UI Plus 的「對外門面」：

| 對外屬性            | 可能角色            | 閱讀重點                           |
| --------------- | --------------- | ------------------------------ |
| `version`       | 版本資訊            | 用於標記目前 library 版本              |
| `locale`        | 語系相關 API        | 與 locale 初始化、切換或語系資料有關         |
| `i18n`          | 翻譯函式整合          | 與外部 i18n 函式注入有關                |
| `install`       | Vue plugin 安裝入口 | `app.use()` 最終會呼叫的核心方法         |
| `lang`          | 語言包或語系資料入口      | 需要搭配 locale 模組進一步確認            |
| `...components` | 元件匯出            | 讓使用者除了全局安裝外，也可能能個別引用 component |

這裡要注意的是：`API` object 同時服務兩種使用方式。

第一種是整包安裝：

```js
app.use(ViewUIPlus, options);
```

第二種是可能的個別能力取用，例如透過 export 出來的 component 或 API。具體可用形式需要再搭配 package export 與文件確認，本篇只根據目前筆記保留這個結構，不過度推論。

---

### 4.3 `install()` 第一階段：防重複安裝檢查

`install()` 一開始有類似以下檢查：

```js
if (install.installed) return;
```

這段程式碼的目的通常是避免同一個 plugin 被重複安裝。因為如果同一個 UI library 被重複註冊，可能造成：

1. component 重複註冊。
2. directive 重複註冊。
3. globalProperties 被重複覆蓋。
4. service API 被重複掛載。
5. 某些全域副作用被重複初始化。

目前只看到 `install.installed` 被讀取，沒有看到 `install.installed = true` 的賦值。

因此，在這份筆記中應謹慎描述成：

```txt
這裡存在「防重複安裝檢查」的程式碼意圖，
但不能直接假設目前版本已經完整阻止重複安裝。
```

這是原始碼閱讀時非常重要的態度。看到類似 guard 的程式碼，不代表 guard 一定完整生效；還要確認狀態是否真的被設定。

---

### 4.4 `install()` 第二階段：套用 `locale` 與 `i18n` options

在安裝流程中，`opts.locale` 與 `opts.i18n` 會優先被處理。


| Option        | Source behavior                  |
| ------------- | -------------------------------- |
| `opts.locale` | 呼叫 `localeFile.use(opts.locale)` |
| `opts.i18n`   | 呼叫 `localeFile.i18n(opts.i18n)`  |

這代表 View UI Plus 在安裝階段會先處理語系與翻譯函式，原因是 UI library 的許多元件都可能需要文字內容，例如：

1. 日期選擇器的月份與星期。
2. 表格的空資料提示。
3. 分頁器的文字。
4. Modal、Message、Notice 等回饋元件的預設文案。
5. 表單驗證提示。

如果語系設定沒有在全局安裝階段先初始化，後續元件在渲染時就可能無法取得正確語言資料。

所以，`locale` / `i18n` 的位置很前面是合理的：它們屬於跨元件的基礎能力，不應該等到某個 component 被使用時才臨時處理。

不過，本篇只追蹤安裝流程，不深入展開 `localeFile.use()` 與 `localeFile.i18n()` 的內部實作。這部分可以放到：

```txt
04-plugin-system/06-locale-plugin-contract.md
```

---

### 4.5 `install()` 第三階段：註冊全局 components

component registration 的核心行為是：

```js
Object.keys(ViewUI).forEach(key => app.component(key, ViewUI[key]));
```

這段程式的意思是：View UI Plus 先從 `ViewUI` 這個 component collection 中取出所有 key，然後逐一呼叫 Vue App 的 `app.component()` 進行全局註冊。

註冊後，使用者就可以在 template 中直接使用這些元件，例如：

```vue
<template>
  <Button>送出</Button>
  <Table :columns="columns" :data="data" />
</template>
```

從 plugin 設計角度來看，這是 UI library 最核心的安裝效果之一。因為使用者安裝 UI library，最直覺的需求就是「我可以直接在 template 裡使用它提供的元件」。

不過，這裡要注意一件事：`install()` 本身不負責實作 `Button`、`Table` 或其他元件。它只是把已經從其他模組匯出的 component 註冊到 Vue App 上。

因此，這一段閱讀時要分清楚兩個層次：

| 層次                       | 負責內容                       | 對應閱讀方向                                    |
| ------------------------ | -------------------------- | ----------------------------------------- |
| Component implementation | 元件本身怎麼渲染、props 如何設計、事件如何觸發 | 去讀各 component 原始碼                         |
| Component registration   | 元件如何被集中註冊到 Vue App         | 讀 `install()` 與 `src/components/index.js` |

本篇只處理第二層：component 如何被 plugin 安裝。

---

### 4.6 `install()` 第四階段：註冊全局 directives

directive registration 的核心行為是：

```js
Object.keys(directives).forEach(key => app.directive(key, directives[key]));
```

這表示 View UI Plus 會把 `directives` collection 中的指令逐一註冊到 Vue App 上。

directive 使用形式包括：

```txt
v-resize
v-line-clamp
v-color
```

directive 與 component 不同。component 通常是 UI 結構的封裝，而 directive 比較像是直接操作 DOM 或補強 DOM 行為的機制。

例如：

| 類型        | 使用方式                      | 主要用途           |
| --------- | ------------------------- | -------------- |
| Component | `<Button />`、`<Table />`  | 建立可重用 UI 區塊    |
| Directive | `v-resize`、`v-line-clamp` | 對 DOM 元素附加特殊行為 |

所以，View UI Plus 的 plugin install 不只處理 component，也處理 directive。這代表它安裝的是一整套 UI framework 能力，而不是單純的元件列表。

同樣要注意，`install()` 不負責 directive 的內部邏輯。它只負責把 directive 的 public registration name 註冊到 Vue App。directive 具體如何監聽、如何處理 DOM、如何清理副作用，應放到後續筆記分析。

---

### 4.7 `install()` 第五階段：寫入 `$VIEWUI` 全域設定

`install()` 會把全域設定寫入：

```js
app.config.globalProperties.$VIEWUI
```

`$VIEWUI` 可以理解成 View UI Plus 在 component instance 層級提供的全域設定物件。它通常用來保存 plugin options 中和 UI 行為有關的設定。

將 `opts` 影響的行為分成三類：

| Option group                  | Effect                                                               |
| ----------------------------- | -------------------------------------------------------------------- |
| `locale`, `i18n`              | 初始化語系與翻譯函式                                                           |
| `size`, `transfer`, `capture` | 寫入 `$VIEWUI` 的全域行為設定                                                 |
| component-specific options    | 寫入 `$VIEWUI.cell`、`$VIEWUI.menu`、`$VIEWUI.select` 等 component config |

這裡要建立一個重要觀念：`$VIEWUI` 不是給 template 直接渲染的元件，也不是 directive，而是提供給 View UI Plus 內部元件或使用者 component instance 查詢的全域設定入口。

例如，當某些元件需要知道預設尺寸、彈層是否 transfer 到 body、事件 capture 行為，或者某些 component-specific config 時，就可能透過 `$VIEWUI` 找到全域設定。

不過，`$VIEWUI` 的詳細結構不在本篇展開。將完整內容指向：

```txt
04-plugin-system/04-global-options-and-viewui-config.md
```

所以，本篇只需要掌握：

```txt
install() 會把 opts 中與全域行為有關的設定整理後，寫入 app.config.globalProperties.$VIEWUI。
```

---

### 4.8 `install()` 第六階段：寫入 service APIs 與 `$Date`

除了 components、directives、`$VIEWUI` 之外， `install()` 還會把多個命令式 service APIs 寫到 Vue instance 上，例如：

```txt
$Spin
$Loading
$Message
$Notice
$Modal
```

這類 API 和一般 component 不一樣。一般 component 是透過 template 宣告：

```vue
<Button>送出</Button>
```

但 service API 通常是透過 JavaScript 命令式呼叫：

```js
this.$Message.success('操作成功');
this.$Modal.confirm({
  title: '確認',
  content: '確定要刪除嗎？'
});
```

這種設計常見於 UI library，因為 Message、Notice、Modal、Loading 這類功能很多時候不是頁面固定結構，而是由某個事件觸發後臨時顯示。

因此，View UI Plus 會將這些 service object 掛到：

```js
app.config.globalProperties
```

讓 component instance 可以透過 `this.$Message`、`this.$Modal` 等方式使用。

另外， `install()` 會寫入：

```js
$Date = dayjs
```

這表示 View UI Plus 會將 `dayjs` 作為日期工具暴露到 instance properties 上。這可能是為了讓使用者或內部邏輯能統一使用 View UI Plus 所依賴的日期工具。

---

## 5. 表格整理

### 5.1 Install Flow 流程表

| 步驟 | 發生位置                    | 主要動作            | 輸入                  | 輸出                                               | 注意事項                                            |
| -- | ----------------------- | --------------- | ------------------- | ------------------------------------------------ | ----------------------------------------------- |
| 1  | `install(app, opts)` 開頭 | 防重複安裝檢查         | `install.installed` | 若已安裝則 return                                     | 目前筆記只看到讀取，未看到 `install.installed = true`，不可過度推論 |
| 2  | `install(app, opts)`    | 套用 locale       | `opts.locale`       | 呼叫 `localeFile.use(opts.locale)`                 | 語系屬於跨元件基礎能力                                     |
| 3  | `install(app, opts)`    | 套用 i18n         | `opts.i18n`         | 呼叫 `localeFile.i18n(opts.i18n)`                  | 翻譯函式注入細節留到 locale 筆記                            |
| 4  | `install(app, opts)`    | 註冊 components   | `ViewUI`            | `app.component(key, ViewUI[key])`                | 只負責註冊，不負責 component 實作                          |
| 5  | `install(app, opts)`    | 註冊 directives   | `directives`        | `app.directive(key, directives[key])`            | 只負責 public name registration                    |
| 6  | `install(app, opts)`    | 寫入 `$VIEWUI`    | `opts`              | `app.config.globalProperties.$VIEWUI`            | 詳細設定結構留到 `$VIEWUI` 筆記                           |
| 7  | `install(app, opts)`    | 寫入 service APIs | service objects     | `$Spin`、`$Loading`、`$Message`、`$Notice`、`$Modal` | 提供命令式 API                                       |
| 8  | `install(app, opts)`    | 寫入日期工具          | `dayjs`             | `$Date = dayjs`                                  | 具體使用場景需後續確認                                     |

這張表要從「Vue App 被擴充了什麼能力」的角度閱讀，而不是只看函式呼叫順序。`install()` 的每一步都對應到 Vue App 的某一種 public surface：template 可用的 component、template 可用的 directive、instance 可用的 `$xxx` API，以及全域設定物件 `$VIEWUI`。

---

### 5.2 Public Surface 整理表

| Public Surface        | Access Pattern                                         | Installed By                           | 使用者感知                                          | 閱讀重點                                       |
| --------------------- | ------------------------------------------------------ | -------------------------------------- | ---------------------------------------------- | ------------------------------------------ |
| Global components     | template 使用 `Button`、`Table`、`iButton` 等               | `app.component`                        | 使用者可直接在 template 寫 UI 元件                       | 追 `ViewUI` 來源與 component naming            |
| Global directives     | template 使用 `v-resize`、`v-line-clamp`、`v-color` 等      | `app.directive`                        | 使用者可在 DOM 或 component 上套用指令行為                  | 追 `directives` collection 與 directive name |
| Instance properties   | component instance 使用 `this.$Message`、`this.$VIEWUI` 等 | `app.config.globalProperties`          | 使用者可在 Options API 或 instance context 使用 `$xxx` | 追 globalProperties 被掛了哪些屬性                 |
| Locale / i18n adapter | 透過 plugin options 注入                                   | `localeFile.use()`、`localeFile.i18n()` | 使用者可設定語系或翻譯函式                                  | 追 locale module contract                   |
| Date helper           | `this.$Date`                                           | `$Date = dayjs`                        | 使用者可取得日期工具                                     | 需要後續確認實際使用場景                               |

這裡可以看出，`View UI Plus` 的 install flow 不只是「元件註冊流程」，而是一個完整的 plugin public surface 建立流程。

---

### 5.3 原始碼模組閱讀表

| 模組 / 檔案                   | 原始碼位置 / 線索                                                                                     | 負責職責                                                  | 與其他模組的關係                                                | 初次閱讀重點                                   |
| ------------------------- | ---------------------------------------------------------------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------- | ---------------------------------------- |
| `src/index.js`            | `01-origin/source/view-ui-plus-v1.3.20/src/index.js`                                             | View UI Plus runtime 入口與 plugin install orchestration | 匯入 components、directives、locale、service APIs，並集中安裝到 app | 先讀 `API` object 與 `install(app, opts)`   |
| `src/components/index.js` | `01-origin/source/view-ui-plus-v1.3.20/src/components/index.js`                                  | 匯出 components collection                              | 被 `install()` 透過 `Object.keys(ViewUI)` 註冊               | 確認 component export key 與註冊名稱            |
| `directives`              | 由 `src/index.js` 匯入的 `lineClamp`、`resize`、`style` 組成，來源在 `src/directives/`                         | 匯出 directives collection                              | 被 `install()` 透過 `Object.keys(directives)` 註冊           | 確認 directive registration name           |
| `localeFile`              | `01-origin/source/view-ui-plus-v1.3.20/src/locale/index.js`                                      | 處理 locale 與 i18n                                      | 被 `install()` 在安裝前段呼叫                                   | 確認 `use()` 與 `i18n()` contract           |
| service APIs              | 由 `components.Spin`、`components.LoadingBar`、`components.Message`、`components.Notice`、`components.Modal` 等提供 | 提供命令式 UI API                                          | 被掛到 `app.config.globalProperties`                       | 區分 service API 與 component 的差異           |
| `types/index.d.ts`        | `01-origin/source/view-ui-plus-v1.3.20/types/index.d.ts`，必要時再追 `types/*.d.ts`                         | TypeScript 型別契約                                       | 描述 runtime 暴露的型別 surface                                | 確認 `$Message`、`$Modal`、`$VIEWUI` 等型別是否一致 |

---

## 6. 範例或情境說明

假設使用者在專案入口這樣安裝 View UI Plus：

```js
import { createApp } from 'vue';
import App from './App.vue';
import ViewUIPlus from 'view-ui-plus';

const app = createApp(App);

app.use(ViewUIPlus, {
  size: 'default',
  transfer: true,
  capture: false
});

app.mount('#app');
```

從使用者角度來看，這只是「安裝 UI library」。

但從原始碼角度來看，這段程式會觸發以下過程：

```txt
app.use(ViewUIPlus, options)
  -> 找到 ViewUIPlus.install
  -> 呼叫 install(app, options)
  -> 根據 options 初始化 locale / i18n
  -> 把 ViewUI 裡的 components 全部 app.component()
  -> 把 directives 裡的 directives 全部 app.directive()
  -> 把 size / transfer / capture 等設定寫入 $VIEWUI
  -> 把 $Message / $Modal / $Notice 等 service APIs 寫入 globalProperties
  -> 把 $Date 指向 dayjs
```

安裝完成後，使用者在 component 中可能會同時使用三種能力：

```vue
<template>
  <Button @click="handleSave">儲存</Button>

  <div v-resize="handleResize">
    需要監聽尺寸變化的區塊
  </div>
</template>

<script>
export default {
  methods: {
    handleSave() {
      this.$Message.success('儲存成功');
    },
    handleResize() {
      console.log('resized');
    }
  }
};
</script>
```

這個範例可以幫助建立完整心智模型：

```txt
<Button>
  來自 app.component()

v-resize
  來自 app.directive()

this.$Message
  來自 app.config.globalProperties

this.$VIEWUI
  也是來自 app.config.globalProperties
```

所以，`install()` 的價值在於它把這些能力一次性接到 Vue App，使使用者在開發時感覺它們都是 View UI Plus 的自然能力。

---

## 7. 閱讀路線或學習路線

### 7.1 初次閱讀路線

第一次閱讀本章相關原始碼時，建議先從 `src/index.js` 開始，不要一開始就跳進每個 component 的內部實作。

建議順序如下：

1. 先讀 `API` object
   目的是確認 View UI Plus 對外 export 了哪些能力，例如 `version`、`locale`、`i18n`、`install`、`lang`、`...components`。

2. 再讀 `install(app, opts)` 的整體流程
   先不要深追每個 service API 的實作，只要掌握 install flow 的順序與職責。

3. 接著追 `ViewUI` 的來源
   確認 components 是從哪裡集中匯出，以及 key 如何變成全局註冊名稱。

4. 再追 `directives` 的來源
   觀察 directive collection 的結構，以及 public directive name 如何形成。

5. 最後看 `app.config.globalProperties` 寫入了哪些屬性
   將 `$VIEWUI`、`$Message`、`$Modal`、`$Date` 等 instance properties 整理成清單。

---

### 7.2 深入閱讀路線

當你已經理解 install flow 後，可以拆成幾個方向深入：

1. Component registration
   追 `src/components/index.js`，確認 View UI Plus 如何組織 components export。

2. Directive registration
   追 directives collection，分析 directive name、hook、DOM 行為與清理邏輯。

3. Global options
   追 `$VIEWUI` 的完整結構，理解 `size`、`transfer`、`capture` 與 component-specific config 如何影響元件行為。

4. Service APIs
   追 `$Message`、`$Notice`、`$Modal` 等 service object 的建立方式，理解命令式 API 如何顯示 UI。

5. Runtime type contract
   對照 `types/index.d.ts`，確認 runtime 實際掛載的 API 是否都有型別宣告。

---

### 7.3 可以暫時跳過的部分

如果目標只是先理解 plugin system，以下內容可以暫時跳過：

1. 每個 component 的 template / render 細節。
2. 每個 component 的 props、emits、slots 設計。
3. `$Message`、`$Modal` 的完整 DOM 建立流程。
4. dayjs 的所有使用場景。
5. TypeScript declaration 的細部型別設計。

這些都很重要，但不是理解 `install()` 主流程的第一優先。

---

## 8. 常見誤區

| 誤區                                                | 為什麼容易誤解                                         | 正確理解                                                                                     |
| ------------------------------------------------- | ----------------------------------------------- | ---------------------------------------------------------------------------------------- |
| 以為 `install()` 只是註冊元件                             | 很多 UI library 的安裝看起來都是為了讓 template 能用 component | `install()` 同時處理 components、directives、global config、service APIs、locale/i18n 與 `$Date`  |
| 看到 `if (install.installed) return` 就認為防重複安裝一定完整生效 | guard pattern 很常見，容易直覺推論它已完成                    | 目前筆記只看到讀取，沒有看到 `install.installed = true`，應描述為「防重複安裝檢查」，不要直接斷言完整有效                       |
| 把 `$Message`、`$Modal` 當成普通 component              | 它們也會顯示 UI，所以容易和 component 混在一起                  | `$Message`、`$Modal` 是命令式 service API，使用方式通常是 `this.$Message.xxx()` 或 `this.$Modal.xxx()` |
| 把 `$VIEWUI` 理解成畫面元件                               | 名稱中有 ViewUI，容易以為它是某種 UI object                  | `$VIEWUI` 是全域設定物件，用於保存 View UI Plus 的全域行為設定                                              |
| 讀 `install()` 時一直追進每個 component 實作                | component 數量多，容易失焦                              | 本章重點是 plugin orchestration，component 內部實作應拆成其他章節                                         |
| 以為 directive 和 component 是同一類註冊                   | 兩者都能在 template 出現                               | component 用 `app.component()`，directive 用 `app.directive()`，角色與使用方式不同                    |
| 忽略 `types/index.d.ts`                             | 只讀 runtime source 時容易忽略型別契約                     | 若要理解完整 public API，需對照 TypeScript declaration，確認 runtime 與型別是否一致                          |

---

## 9. 本章總結

本章的核心觀念是：`View UI Plus` 的 `install(app, opts)` 是整個 plugin system 的安裝總控層。

使用者表面上只呼叫：

```js
app.use(ViewUIPlus, options);
```

但這行程式背後會進入 `API.install(app, options)`，並由 `install()` 負責把 View UI Plus 的全域能力接到 Vue App 上。

這些能力至少包含五大類：

第一類是 global components，讓使用者可以在 template 中直接使用 `Button`、`Table`、`iButton` 等元件。

第二類是 global directives，讓使用者可以在 template 中使用 `v-resize`、`v-line-clamp`、`v-color` 等指令。

第三類是 global config，也就是 `$VIEWUI`，用來承載 `size`、`transfer`、`capture` 與 component-specific options 等全域設定。

第四類是 imperative service APIs，例如 `$Spin`、`$Loading`、`$Message`、`$Notice`、`$Modal`，讓使用者可以透過 JavaScript 命令式呼叫 UI feedback。

第五類是輔助工具與跨元件能力，例如 locale / i18n adapter，以及 `$Date = dayjs`。

因此，閱讀 `install()` 時，不應只把它看成元件註冊函式，而要把它理解成 View UI Plus 對 Vue App 的「全域能力注入入口」。它不負責實作每個能力，但負責把這些能力集中安裝、命名並暴露出去。

---

## 10. 自我檢查問題

1. 為什麼 `app.use(ViewUIPlus, options)` 最終會呼叫 `API.install(app, options)`？
2. `install(app, opts)` 中的 `app` 和 `opts` 分別代表什麼？
3. 為什麼不能把 `install()` 只理解成 component registration？
4. `app.component()`、`app.directive()`、`app.config.globalProperties` 分別對應哪一種 public surface？
5. `$VIEWUI` 的角色是什麼？它和 `$Message`、`$Modal` 有什麼不同？
6. 為什麼 locale / i18n 會在 install flow 的前段處理？
7. `$Message`、`$Notice`、`$Modal` 這類 service API 為什麼通常會設計成命令式呼叫？
8. 為什麼要特別提醒 `install.installed` 只有讀取，不能直接假設它完整阻止重複安裝？
9. 如果要深入分析 component registration，下一步應該閱讀哪一類檔案？
10. 如果要確認 runtime 暴露的 `$Message`、`$VIEWUI` 是否有完整型別支援，應該對照哪個方向的檔案？

---

## 11. 後續延伸方向

本篇是 `04-plugin-system/` 的第一篇，主要建立 View UI Plus plugin 安裝流程的整體地圖。後續可以拆成以下主題：

1. `04-plugin-system/02-component-registration.md`
   分析 `ViewUI` components collection 如何形成，以及 `app.component()` 的註冊名稱如何決定。

2. `04-plugin-system/03-directive-registration.md`
   分析 View UI Plus 的 directive collection、directive public name、directive hook 與 DOM 行為。

3. `04-plugin-system/04-global-options-and-viewui-config.md`
   詳細分析 `$VIEWUI` 的結構，包括 `size`、`transfer`、`capture`、`cell`、`menu`、`select` 等設定。

4. `04-plugin-system/05-global-properties.md`
   整理 `app.config.globalProperties` 上掛載了哪些 `$xxx` 屬性，以及它們如何被 component instance 使用。

5. `04-plugin-system/06-locale-plugin-contract.md`
   分析 `localeFile.use()`、`localeFile.i18n()` 與語系資料之間的關係。

6. `04-plugin-system/07-runtime-type-contract.md`
   對照 `src/index.js` 的 runtime 行為與 `types/index.d.ts` 的型別宣告，確認 public API contract 是否一致。

7. `04-plugin-system/08-plugin-design-pattern.md`
   從設計模式角度整理 View UI Plus 的 plugin orchestration、public surface 設計與全域能力注入策略。
