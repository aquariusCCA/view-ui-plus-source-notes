# Public Surface：View UI Plus 作為 Component Library 的對外暴露形狀

## 1. 本章定位

本章討論的是 View UI Plus 作為 component library 對外暴露給使用者的 API 形狀，也就是所謂的 `public surface`。

所謂 public surface，可以理解成「使用者能從 library 外部接觸、呼叫、安裝、使用或獲得型別提示的所有入口」。對一個 Vue component library 來說，public surface 不只包含 `import { Button } from 'view-ui-plus'` 這種 JavaScript module export，也包含 `app.use(ViewUIPlus)` 安裝後產生的全域 component、directive、instance properties，以及 TypeScript 使用者看到的 declaration files。

這篇筆記要解決的問題是：

1. View UI Plus 對外暴露了哪些主要入口？
2. 這些入口分別服務哪一種使用情境？
3. `src/index.js`、`src/components/index.js`、`types/index.d.ts`、`types/viewuiplus.components.d.ts` 之間有什麼關係？
4. 為什麼閱讀 public surface 時，不能只看 runtime，也不能只看 types？

本章不會深入分析單一 component 的內部實作，例如 `Button` 如何渲染、`Modal` 如何管理狀態、`Table` 如何處理資料欄位。這些內容適合放到後續的 component implementation notes。這裡的主軸是從使用者視角整理 library 的對外邊界。

---

## 2. 學習前先建立的基本觀念

### 2.1 Public Surface 是 Library 與使用者之間的契約

當一個專案只是應用程式時，很多內部模組不一定需要穩定暴露給外部使用者。但當它是一個 component library 時，對外暴露的 API 就會形成一種契約。

例如使用者可能會這樣使用 View UI Plus：

```js
import { createApp } from 'vue';
import ViewUIPlus from 'view-ui-plus';

const app = createApp(App);
app.use(ViewUIPlus);
```

也可能只按需匯入某些項目：

```js
import { Button, Modal, Message } from 'view-ui-plus';
```

也可能在安裝 plugin 後，直接在 Vue template 中使用全域 component：

```vue
<template>
  <Button>Submit</Button>
  <Modal v-model="visible" />
</template>
```

這些都是 public surface 的一部分。它們共同決定了使用者如何接觸 View UI Plus。

### 2.2 Runtime Surface 與 Type Surface 不一定完全一致

閱讀 component library 時，要特別區分兩種 surface。

第一種是 runtime surface，也就是 JavaScript 實際執行時存在的 API。對 View UI Plus 來說，主要集中在 `src/index.js`。它決定了 package 實際匯出什麼、`install(app, opts)` 實際做什麼、哪些東西會被掛到 `app.config.globalProperties`。

第二種是 type surface，也就是 TypeScript 使用者與 IDE 看到的 API contract。對 View UI Plus 來說，主要來自 `types/index.d.ts` 與 `types/viewuiplus.components.d.ts`。它決定了使用者在 TypeScript 中能獲得哪些型別提示、哪些 instance properties 會被視為合法。

這兩者應該盡量對齊，但在實務上不一定完全一致。`locale`、`i18n`、`lang` 在 runtime 有 export，但 `types/index.d.ts` 目前未明確宣告；`version` 與 default API object 在 runtime 有 export，但 types 目前未完整描述 default API shape。

這代表閱讀 public surface 時，要同時看 runtime 與 types。只看 `src/index.js`，你知道使用者實際能呼叫什麼；只看 `types/`，你知道 TypeScript 是否能正確提示與檢查。

### 2.3 Vue Plugin 的 install 是整包整合入口

Vue library 通常會提供 plugin install 入口，讓使用者透過 `app.use()` 一次安裝整套能力。

對 View UI Plus 來說，`app.use(ViewUIPlus, options)` 不只是註冊 component。它還會處理 locale、global components、global directives、globalProperties 等 runtime 能力。這使得 plugin install 成為一個「整包啟用」的入口。

因此，分析 View UI Plus public surface 時，`install(app, opts)` 是最重要的閱讀起點之一。

---

## 3. 整體概覽

View UI Plus 的 public surface 可以分成六大類：

1. plugin install：`app.use(ViewUIPlus, options)`
2. named exports：`import { Button, Modal } from 'view-ui-plus'`
3. global components：安裝 plugin 後可在 template 中直接使用 component name
4. globalProperties：`this.$Message`、`this.$Modal`、`this.$VIEWUI` 等 instance-level API
5. locale APIs：`locale`、`i18n`、`lang` 與 install options
6. types：`types/index.d.ts` 暴露的 TypeScript contract

可以先用下面的結構建立整體印象：

```txt
npm package user
  -> import ViewUIPlus from 'view-ui-plus'
      -> default API
      -> install(app, opts)

  -> import { Button, Modal, Message } from 'view-ui-plus'
      -> named component exports
      -> service-style API exports

  -> app.use(ViewUIPlus, opts)
      -> app.component(...)
      -> app.directive(...)
      -> app.config.globalProperties
      -> locale setup

  -> TypeScript / IDE
      -> types/index.d.ts
      -> types/viewuiplus.components.d.ts
```

從原始碼閱讀角度來看，`src/index.js` 是 runtime public surface 的主要集中點；`types/index.d.ts` 則是 TypeScript 使用者看到的 public type surface。兩者互相對應，但不是完全等價。

因此，本章可以用三層心智模型來理解：

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

這三層分別回答不同問題。

package import surface 回答的是：「使用者從 `view-ui-plus` 這個 package 可以 import 到什麼？」

Vue app install surface 回答的是：「使用者執行 `app.use(ViewUIPlus)` 後，Vue app 會多出哪些全域能力？」

TypeScript surface 回答的是：「TypeScript 與 IDE 知不知道這些 API 的存在？能不能提供型別提示與檢查？」

---

## 4. 核心內容逐步講解

### 4.1 Plugin Install：整包安裝入口

plugin install 是 View UI Plus 最典型的整包使用方式。使用者通常會在 Vue app 入口檔中這樣安裝：

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

這裡的 `ViewUIPlus` 是 package default API，並且具備 Vue plugin 所需的 `install(app, opts)` 能力。當使用者執行 `app.use(ViewUIPlus, options)` 時，Vue 會呼叫這個 install function，讓 library 有機會把自己的能力註冊進 Vue app。

`src/index.js` 中的 `install(app, opts)` 主要做四件事。

| install 行為 | 對外效果 | 使用者感受到的結果 |
| --- | --- | --- |
| 套用 `opts.locale` / `opts.i18n` | 讓整個 library 使用指定語系或 i18n adapter | 使用者可在安裝階段設定語系與翻譯方式 |
| `Object.keys(ViewUI).forEach(app.component)` | 把所有 components 與別名註冊成 global components | template 中可直接使用 `Button`、`Table` 等名稱 |
| `Object.keys(directives).forEach(app.directive)` | 把內建 directives 註冊到 Vue app | 使用者可在 template 中使用 library 提供的 directives |
| 寫入 `app.config.globalProperties` | 提供 `$VIEWUI`、imperative APIs 與 `$Date` | component instance 可透過 `this.$Message`、`this.$Modal` 等方式呼叫全域 API |

plugin install 的特色是「一次安裝，全域可用」。這對使用者很方便，因為不需要在每個 SFC 中重複 import component，也可以直接使用全域的 service-style API。

但從 library 設計角度來看，這也代表 install 是一個很重的入口。它同時打開 global components、global directives、globalProperties 與 locale setup。因此，如果未來要調整 View UI Plus 的 public API，就不能只看單一 export，還要確認 install 是否有同步註冊。

### 4.2 Named Exports：模組層級的匯入入口

named exports 是使用者按需取得 component 或 service-style API 的方式。`src/index.js` 透過下面這行把 `src/components/index.js` 的 exports 轉成 package-level exports：

```js
export * from './components';
```

因此，使用者可以這樣從 package 取得單一項目：

```js
import { Button, Table, Modal, Message } from 'view-ui-plus';
```

這一層 surface 的來源是 `src/components/index.js`。它大致扮演 component export registry 的角色，將各個 component 或 API 從內部路徑集中匯出：

```txt
src/components/index.js
  -> export { default as Button } from './button'
  -> export { default as Table } from './table'
  -> export { default as Modal } from './modal'
  -> export { default as Message } from './message'
  -> ...
```

named exports 和 plugin install 的差異在於它們服務不同層次。

| 使用方式 | 所屬層次 | 主要目的 |
| --- | --- | --- |
| `app.use(ViewUIPlus)` | Vue app runtime surface | 讓整套 library 進入 Vue app，啟用全域 component、directive、instance API 與 locale setup |
| `import { Button } from 'view-ui-plus'` | JavaScript module import surface | 直接取得某個 component 或 API 物件，方便按需使用或局部註冊 |

因此，named exports 不等於 plugin install。named exports 解決的是「package 可以 import 什麼」；plugin install 解決的是「安裝後 Vue app 多了什麼」。

這個差異在閱讀原始碼時很重要。當你看到 `export { default as Button } from './button'`，它代表 `Button` 會成為 package 的一個 named export。但這不必然代表它已經被全域註冊到 Vue app。全域註冊還要看 `install()` 中的 `ViewUI` map 如何組成，以及是否被 `app.component()` 處理。

### 4.3 Global Components：template-level 的使用入口

plugin install 會把 `ViewUI` map 裡的每一個 key 註冊成 global component：

```js
Object.keys(ViewUI).forEach(key => {
  app.component(key, ViewUI[key]);
});
```

這段邏輯代表：只要某個 component 被放進 `ViewUI` map，它就會在 `app.use(ViewUIPlus)` 後成為 Vue app 的全域 component。

`ViewUI` map 由兩部分組成：

```txt
ViewUI
  -> ...components
  -> iButton / iCircle / iCol / iContent / iForm
  -> iFooter / iHeader / iInput / iMenu / iOption
  -> iProgress / iSelect / iSwitch / iTable / iTime
```

這代表安裝後的 global component name 有兩種來源。

| 來源 | 範例 | 用途 | 閱讀重點 |
| --- | --- | --- | --- |
| component 原名 | `Button`、`Table`、`Modal` | 由 `src/components/index.js` 匯出的主要名稱 | 這是使用者最直覺的 component name |
| `i` 前綴別名 | `iButton`、`iTable`、`iSelect` | 相容或避免名稱衝突的別名 | 需要確認這些 alias 是否只存在於 global registration，或也有對應 named export/type declaration |

global components 是 template-level surface。也就是說，使用者不需要在每個 SFC 中手動 import component，只要 Vue app 已經安裝 plugin，就可以在 template 使用已註冊名稱。

例如：

```vue
<template>
  <Button>儲存</Button>
  <iButton>取消</iButton>
</template>
```

這種方式對開發體驗很友善，但也會帶來一個閱讀重點：你在某個 `.vue` 檔案中看到 `<Button>`，不一定能從該檔案的 `import` 找到來源，因為它可能是 plugin install 階段註冊的 global component。

因此，閱讀使用 View UI Plus 的專案時，如果 template 中出現沒有 import 的 component name，應該回頭檢查 app 入口是否有執行 `app.use(ViewUIPlus)`。

### 4.4 GlobalProperties：instance-level 的命令式 API 入口

`globalProperties` 是 Vue instance-level surface。它讓 component instance 可以透過 `this.$...` 存取全域設定與 imperative APIs。

在 Vue 3 中，`app.config.globalProperties` 可以用來掛載全域屬性。這些屬性會出現在 component instance 上，因此 Options API 中常見的呼叫方式會像這樣：

```js
this.$Message.info('儲存成功');
this.$Modal.confirm({ title: '確認刪除？' });
```

`src/index.js` 暴露的主要 global properties 如下。

| global property | 來源 | 角色 | 使用者接觸點 |
| --- | --- | --- | --- |
| `$VIEWUI` | install options | 全域設定容器，例如 size、transfer、cell/menu/modal/tabs/select 等設定 | component instance 可讀取 library 全域設定 |
| `$Spin` | `components.Spin` | imperative loading/spin API | 顯示或控制 loading spinner |
| `$Loading` | `components.LoadingBar` | loading bar API | 控制頁面或操作流程中的 loading bar |
| `$Message` | `components.Message` | message API | 顯示訊息提示 |
| `$Notice` | `components.Notice` | notice API | 顯示通知提示 |
| `$Modal` | `components.Modal` | modal / confirm API | 以命令式方式開啟對話框或確認框 |
| `$ImagePreview` | `components.ImagePreview` | image preview API | 開啟圖片預覽 |
| `$Copy` | `components.Copy` | copy API | 執行複製功能 |
| `$ScrollIntoView` | `components.ScrollIntoView` | scroll into view API | 捲動到指定元素 |
| `$ScrollTop` | `components.ScrollTop` | scroll top API | 回到頁面頂部或指定捲動位置 |
| `$Date` | `dayjs` | date helper | 提供日期處理能力 |

這一層 surface 不等同於 named exports。

named exports 是 module 層面的匯入：

```js
import { Message } from 'view-ui-plus';
```

`globalProperties` 則是 app 安裝後注入到 component instance 的 runtime 能力：

```js
this.$Message.info('Hello');
```

兩者可能指向相近或相同的底層物件，但使用者接觸方式不同，型別宣告方式也不同。named exports 通常需要在 component declaration 檔中宣告；`this.$Message` 這種 instance property 則需要透過 `declare module '@vue/runtime-core'` 補充 `ComponentCustomProperties`。

這也是為什麼 runtime surface 與 type surface 必須一起看。Runtime 有掛上 `$Message` 不代表 TypeScript 自動知道 `this.$Message` 存在；TypeScript 必須透過 module augmentation 才能正確提示。

### 4.5 Locale APIs：語系設定的雙層入口

locale 對外有三種 package-level API：

```js
export const locale = localeFile.use;
export const i18n = localeFile.i18n;
export const lang = (code) => {
  const langObject = window['viewuiplus/locale'].default;
  if (code === langObject.i.locale) localeFile.use(langObject);
  else console.log(`The ${code} language pack is not loaded.`);
};
```

這三個 API 的用途可以整理如下。

| API | 用途 | 閱讀重點 |
| --- | --- | --- |
| `locale` | 直接切換或套用 locale object | 對應 `localeFile.use`，屬於直接操作語系的入口 |
| `i18n` | 接入外部 i18n function / adapter | 對應 `localeFile.i18n`，用來整合外部翻譯機制 |
| `lang(code)` | 從已載入到 `window['viewuiplus/locale']` 的語系包切換語系 | 依賴語系包已先載入到全域 `window` |
| `install(app, { locale, i18n })` | 在 plugin install 階段套用語系設定 | 屬於 Vue app install surface 的一部分 |

locale APIs 的特殊點在於它同時存在於兩個層面。

第一個層面是 package-level API。使用者可以從 package 匯入或呼叫 `locale`、`i18n`、`lang`，直接控制語系相關行為。

第二個層面是 install option。使用者可以在 `app.use(ViewUIPlus, opts)` 時透過 options 一次設定語系：

```js
app.use(ViewUIPlus, {
  locale,
  i18n
});
```

也就是說，locale 既是獨立 API，又是 plugin install 的設定項目。

其中 `lang(code)` 特別值得注意，因為它依賴 `window['viewuiplus/locale']`。這代表它不是單純從 ES module import 語系物件，而是預期某個語系包已經被載入到瀏覽器全域環境中。這和 `build:lang` 產出的 `dist/locale/*` 有關。

因此，`lang(code)` 同時牽涉 runtime API 與 build artifact。若要深入分析，需要後續補充 `build:lang`、`dist/locale/*` 產物格式，以及語系包如何掛載到 `window['viewuiplus/locale']`。

### 4.6 Types：TypeScript 使用者看到的 API 契約

TypeScript surface 由 `package.json` 的 `typings` 指向：

```json
{
  "typings": "types/index.d.ts"
}
```

這代表 TypeScript 使用者安裝 View UI Plus 後，型別入口會從 `types/index.d.ts` 開始。

`types/index.d.ts` 主要暴露三類 contract。

| Type surface | 來源 | 角色 | 對應 runtime surface |
| --- | --- | --- | --- |
| component declarations | `export * from './viewuiplus.components'` | 讓 named exports 有對應 component 型別 | `export * from './components'` |
| install declaration | `export const install: (app: App, options?: ViewUIPlusInstallOptions) => void` | 描述 Vue plugin install signature | `install(app, opts)` |
| Vue module augmentation | `declare module '@vue/runtime-core'` | 補上 `$VIEWUI`、`$Message`、`$Modal`、`$Date` 等 instance properties | `app.config.globalProperties` |

其中 `types/viewuiplus.components.d.ts` 對應 component named exports，例如：

```txt
types/viewuiplus.components.d.ts
  -> export { Button, ButtonGroup } from './button'
  -> export { Modal, ModalInstance } from './modal'
  -> export { Message, MessageConfig } from './message'
  -> export { Table, TableColumnConfig } from './table'
  -> ...
```

這裡可以看出 type surface 的任務不是「重新實作 runtime」，而是替 runtime 提供型別契約。

例如 runtime 中有：

```js
export * from './components';
```

那 TypeScript 端就需要有對應的 component declaration，否則使用者雖然在 JavaScript runtime 可以 import，但 TypeScript 可能無法提供正確型別。

又例如 runtime 中有：

```js
app.config.globalProperties.$Message = components.Message;
```

那 TypeScript 端就需要透過 module augmentation 告訴 Vue：component instance 上存在 `$Message`，否則在 TypeScript 中寫 `this.$Message` 可能會出現型別錯誤。

### 4.7 Runtime Surface 與 Type Surface 的落差

View UI Plus 的 runtime surface 和 type surface 目前不是完全一對一。

可以整理如下。

| Runtime surface | Type surface 現況 | 閱讀意義 |
| --- | --- | --- |
| component named exports | 由 `types/viewuiplus.components.d.ts` 覆蓋 | named exports 的型別大致有對應來源 |
| `install(app, opts)` | 由 `types/index.d.ts` 覆蓋 | plugin install signature 有型別描述 |
| `globalProperties` | 由 `declare module '@vue/runtime-core'` 覆蓋 | instance-level API 透過 Vue module augmentation 補強 |
| `locale`、`i18n`、`lang` | runtime 有 export，但 `types/index.d.ts` 目前未明確宣告 | TypeScript 使用者可能無法得到完整提示，需要後續確認 |
| `version`、default API object | runtime 有 export，但 `types/index.d.ts` 目前未完整描述 default API shape | default API 的完整型別 contract 可能不足，需要後續確認 |

這個落差提醒我們：分析 public surface 時不能只看「實際有沒有 export」，也要看「型別有沒有同步描述」。

對 JavaScript 使用者來說，只要 runtime 存在，通常就可以呼叫。但對 TypeScript 使用者來說，如果 declaration file 沒有描述，開發體驗就會受影響，甚至可能出現型別錯誤。

因此，如果未來要修改或新增 public API，應該同時檢查三件事：

1. runtime 是否從 `src/index.js` 正確暴露。
2. plugin install 是否需要註冊到 Vue app。
3. `types/` 是否需要補 declaration 或 module augmentation。

---

## 5. 表格整理

### 5.1 Public Surface 總表

| Surface 類型 | 使用者接觸點 | 主要來源 | 責任 | 閱讀重點 |
| --- | --- | --- | --- | --- |
| plugin install | `app.use(ViewUIPlus, options)` | `src/index.js` | 安裝整套 library，註冊全域能力 | 檢查 `install(app, opts)` 做了哪些事情 |
| named exports | `import { Button, Modal } from 'view-ui-plus'` | `src/index.js`、`src/components/index.js` | 決定 package 可被 import 的符號 | 檢查 `export * from './components'` 與 component export registry |
| global components | template 中直接使用 `<Button />`、`<Table />` | `ViewUI` map、`app.component()` | 讓 components 成為 Vue app 全域 component | 注意 component 原名與 `i` 前綴別名 |
| global directives | template 中使用 library directives | `directives` map、`app.directive()` | 註冊全域 directives | 此處需要後續補充完整 directive 名稱 |
| globalProperties | `this.$Message`、`this.$Modal`、`this.$VIEWUI` | `app.config.globalProperties` | 提供 instance-level API 與全域設定 | 注意 runtime 掛載與 TypeScript augmentation 是否一致 |
| locale APIs | `locale`、`i18n`、`lang(code)`、install options | `src/index.js`、locale module | 提供語系切換與 i18n 整合能力 | `lang(code)` 依賴 `window['viewuiplus/locale']` |
| TypeScript types | IDE / type checker | `types/index.d.ts`、`types/viewuiplus.components.d.ts` | 描述 public API 的型別契約 | 檢查 runtime surface 與 type surface 是否一致 |

這張表的閱讀方式是：先看使用者從哪裡接觸 library，再回頭找原始碼來源。這樣可以避免只從檔案角度看程式，而忽略每個檔案對使用者 API 的意義。

### 5.2 Runtime 與 Types 對照表

| Runtime 檔案 / 行為 | Type 檔案 / 宣告 | 對應關係 | 注意事項 |
| --- | --- | --- | --- |
| `src/index.js` default API | `types/index.d.ts` | 描述 package 主入口 | default API object shape 目前可能未完整描述 |
| `install(app, opts)` | `export const install: ...` | 描述 plugin install signature | options 型別需對應實際 install 支援項目 |
| `export * from './components'` | `export * from './viewuiplus.components'` | named exports 的 runtime/type 對應 | 新增 component 時兩邊都需要檢查 |
| `app.component(key, ViewUI[key])` | component declarations | global component 與 component 型別相關 | global component name 與 type declaration 不一定完全等價 |
| `app.config.globalProperties.$Message` | `declare module '@vue/runtime-core'` | instance property 的 runtime/type 對應 | 需要透過 module augmentation 讓 `this.$Message` 合法 |
| `locale`、`i18n`、`lang` exports | 此處需要後續補充 | runtime 有，types 可能不足 | 需要確認是否應補到 `types/index.d.ts` |

這張表的重點是幫助你建立「修改 public API 時的檢查清單」。只要 runtime 新增或改動一個對外 API，就要同步檢查 TypeScript declaration 是否需要更新。

### 5.3 使用情境比較表

| 使用情境 | 使用方式 | 適合情況 | 代價或注意事項 |
| --- | --- | --- | --- |
| 整包使用 | `app.use(ViewUIPlus, options)` | 專案大量使用 View UI Plus components，希望全域可用 | 一次打開多種全域能力，需理解全域註冊來源 |
| 按需匯入 | `import { Button } from 'view-ui-plus'` | 只需要單一 component 或想局部註冊 | 需要確認 bundler 與 package build 是否支援理想的 tree-shaking，此處需要後續補充 |
| template 全域使用 | `<Button />`、`<iButton />` | 已安裝 plugin，不想在每個 SFC 重複 import | template 中看不到 import 來源，閱讀時要回查 plugin install |
| 命令式呼叫 | `this.$Message`、`this.$Modal` | 需要從程式流程中觸發訊息、通知、modal 等 service-style API | Composition API 使用方式需後續確認，不應直接假設 |
| 語系設定 | `app.use(ViewUIPlus, { locale, i18n })` 或 `lang(code)` | 需要切換或整合多語系 | `lang(code)` 依賴已載入的語系包與全域 `window` |
| TypeScript 使用 | `types/index.d.ts`、IDE 提示 | 需要型別檢查與 API 提示 | types 與 runtime 不一定完全一致，需要交叉確認 |

---

## 6. 範例或情境說明

### 6.1 情境一：使用者整包安裝 View UI Plus

假設使用者在專案入口這樣寫：

```js
import { createApp } from 'vue';
import ViewUIPlus from 'view-ui-plus';
import App from './App.vue';

const app = createApp(App);
app.use(ViewUIPlus, {
  size: 'default',
  locale
});
app.mount('#app');
```

這段程式碼背後發生的事情不是只有「引入 View UI Plus」。更精準地說，它會觸發 `install(app, opts)`，並在 Vue app 上完成一系列註冊。

首先，library 會處理 `opts.locale` 等安裝設定，使整個 library 使用指定語系。接著，`ViewUI` map 中的 components 會透過 `app.component()` 註冊成 global components。再來，內建 directives 會透過 `app.directive()` 註冊到 app。最後，`$VIEWUI`、`$Message`、`$Modal`、`$Date` 等能力會被掛到 `app.config.globalProperties`。

因此，安裝後使用者可以在 template 中直接寫：

```vue
<template>
  <Button>送出</Button>
</template>
```

也可以在 component instance 中呼叫：

```js
this.$Message.success('操作成功');
```

這就是 plugin install surface 的價值：把原本分散的 components、directives、service APIs 與設定整合到 Vue app 裡。

### 6.2 情境二：使用者只想取得某個 component

另一種情況是使用者不想整包安裝，而是只想取得某個 component：

```js
import { Button } from 'view-ui-plus';
```

這時候使用的是 named exports，也就是 package import surface。這個能力來自 `src/index.js` 對 `./components` 的 re-export，以及 `src/components/index.js` 對各 component 的集中匯出。

這種方式的重點是「取得某個 module export」，而不是「把整套 library 安裝進 Vue app」。如果使用者只 import `Button`，不代表 `$Message`、global directives 或全域 locale setup 也會自動完成。

因此，在閱讀 View UI Plus public surface 時，要明確區分：

```txt
import { Button } from 'view-ui-plus'
  -> module import surface
  -> 取得 Button 這個 export

app.use(ViewUIPlus)
  -> Vue app install surface
  -> 註冊 components / directives / globalProperties / locale setup
```

### 6.3 情境三：TypeScript 使用者呼叫 `this.$Message`

如果使用者在 TypeScript component 中寫：

```ts
this.$Message.info('Hello');
```

runtime 層面要成立，必須有：

```js
app.config.globalProperties.$Message = components.Message;
```

TypeScript 層面要成立，還必須有：

```ts
declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $Message: /* 對應型別 */
  }
}
```

這個例子說明 runtime 與 types 是兩條不同但需要對齊的線。Runtime 決定程式執行時能不能找到 `$Message`，types 決定 TypeScript 編譯與 IDE 提示時是否認得 `$Message`。

---

## 7. 閱讀路線或學習路線

### 7.1 初次閱讀路線

如果你是第一次系統性閱讀 View UI Plus 的 public surface，建議先按照「使用者入口」而不是「檔案順序」閱讀。

第一步，先讀 `src/index.js`。目標是掌握 package 主入口暴露了什麼，尤其是 default API、`install(app, opts)`、`export * from './components'`、locale APIs 與 globalProperties。

第二步，讀 `src/components/index.js`。目標是理解 named exports 的來源，觀察有哪些 component 或 service-style API 被集中匯出到 package level。

第三步，回到 `src/index.js` 的 `ViewUI` map。目標是理解 plugin install 實際會註冊哪些 global components，並注意原名與 `i` 前綴別名的差異。

第四步，讀 `app.config.globalProperties` 相關邏輯。目標是整理 `$VIEWUI`、`$Message`、`$Modal`、`$Date` 等 instance-level API 的來源與用途。

第五步，讀 `types/index.d.ts`。目標是理解 TypeScript 入口如何描述 install、components、ComponentCustomProperties 等 public contract。

第六步，讀 `types/viewuiplus.components.d.ts`。目標是對照 runtime named exports，確認 component 型別宣告是否覆蓋主要 export。

### 7.2 深入閱讀路線

初步建立心智模型後，可以再往下追幾個方向。

第一，追 locale module 與 `build:lang`。目標是理解 `locale`、`i18n`、`lang(code)` 與 `dist/locale/*` 產物之間的關係。

第二，追 directives map。目標是補齊 plugin install 註冊了哪些 global directives，以及它們如何形成 template-level public surface。

第三，追 `$VIEWUI` options 的完整 schema。目標是理解全域設定容器裡有哪些設定項，以及這些設定如何被各 component 讀取。

第四，追 service-style APIs，例如 `Message`、`Modal`、`Notice`、`LoadingBar`。目標是理解它們為什麼既可以是 named export，又可以被掛到 `globalProperties` 上。

### 7.3 可以暫時跳過的部分

如果本章目標只是理解 public surface，可以暫時跳過單一 component 的內部渲染細節。例如 `Button` 的 class 組裝、`Table` 的欄位渲染、`Modal` 的 transition 實作，這些都屬於 component implementation，不是本章重點。

也可以暫時跳過 build system 的完整流程，只保留對 `build:lang` 與 `dist/locale/*` 的問題意識。等到後續整理建置與發布筆記時，再深入處理。

---

## 8. 常見誤區

| 誤區 | 為什麼容易誤解 | 正確理解 |
| --- | --- | --- |
| 以為 `import { Button }` 和 `app.use(ViewUIPlus)` 是同一件事 | 兩者都讓使用者能使用 library，所以表面上很像 | `import { Button }` 是 module import surface；`app.use(ViewUIPlus)` 是 Vue app install surface，會註冊全域能力 |
| 以為 named exports 一定等於 global components | component 被 export 和被 `app.component()` 註冊是兩個動作 | named export 來自 `src/components/index.js`；global component 要看 `ViewUI` map 和 install 流程 |
| 以為 runtime 有 `$Message`，TypeScript 就一定認得 | JavaScript runtime 和 TypeScript declaration 是兩套系統 | runtime 要掛到 `app.config.globalProperties`；TypeScript 要透過 `declare module '@vue/runtime-core'` 補型別 |
| 只看 `types/index.d.ts` 就判斷 library 能用什麼 | Type declarations 可能沒有完整覆蓋 runtime export | 要同時看 `src/index.js` 與 `types/`，交叉確認 runtime surface 和 type surface |
| 看到 template 中 `<Button>` 沒有 import 就以為來源不明 | global component 不需要在單一 SFC 中 import | 應回查 app 入口是否執行 `app.use(ViewUIPlus)`，以及 install 是否註冊 `Button` |
| 以為 locale API 只有 install options | locale 同時有 package-level API 與 install option | `locale`、`i18n`、`lang(code)` 可作為 package-level API，`app.use(..., { locale, i18n })` 則是 install 階段設定 |
| 以為 `lang(code)` 只是一個普通切換函式 | 它依賴 `window['viewuiplus/locale']` | 它牽涉語系包是否已載入，以及 `dist/locale/*` 這類 build artifact |

---

## 9. 本章總結

View UI Plus 的 public surface 可以理解成 library 對使用者開放的所有接觸點。這些接觸點不只包含 `import` 能匯入什麼，也包含 `app.use()` 安裝後 Vue app 多了哪些能力，以及 TypeScript 使用者能看到哪些型別契約。

本章最重要的心智模型是三層分工。

第一層是 package import surface。這一層關心 `view-ui-plus` 這個 npm package 對外 export 什麼，例如 default API、`Button`、`Modal`、`Message`、`locale`、`i18n`、`lang` 等。這部分主要回到 `src/index.js` 與 `src/components/index.js` 閱讀。

第二層是 Vue app install surface。這一層關心 `app.use(ViewUIPlus, opts)` 執行後，Vue app 會被注入哪些全域能力，包括 global components、global directives、globalProperties 與 locale setup。這部分的閱讀重點是 `install(app, opts)` 做了哪些註冊與設定。

第三層是 TypeScript surface。這一層關心 TypeScript 與 IDE 是否知道這些 public API 的存在。主要閱讀 `types/index.d.ts` 與 `types/viewuiplus.components.d.ts`，並且特別注意 component declarations、install declaration 與 `ComponentCustomProperties` augmentation。

理解這三層後，就能比較準確地分析一個 component library 的對外 API 是否一致。如果 runtime 有 export，但 types 沒有宣告，TypeScript 使用者的體驗就會不完整。如果 component 有 named export，但 install 沒有註冊，使用者就不能直接在 template 中全域使用。如果 `globalProperties` 有掛載 `$Message`，但 module augmentation 沒有補型別，使用者在 TypeScript 中就可能遇到型別錯誤。

因此，修改 View UI Plus public API 時，不能只改單一檔案，而應該同時檢查 runtime、install 與 types 三條線是否一致。

---

## 10. 自我檢查問題

1. 什麼是 component library 的 public surface？它和一般內部模組有什麼差異？
2. 為什麼 `src/index.js` 可以視為 View UI Plus runtime public surface 的主要集中點？
3. `app.use(ViewUIPlus, options)` 和 `import { Button } from 'view-ui-plus'` 的差異是什麼？
4. plugin install 中的 `app.component()`、`app.directive()`、`app.config.globalProperties` 分別在建立哪一種 public surface？
5. 為什麼 global components 屬於 template-level surface？閱讀 `.vue` template 時要注意什麼？
6. `globalProperties` 和 named exports 有什麼差異？請用 `$Message` 或 `$Modal` 舉例說明。
7. `locale`、`i18n`、`lang(code)` 和 `app.use(ViewUIPlus, { locale, i18n })` 之間有什麼關係？
8. 為什麼 `lang(code)` 需要特別注意 `window['viewuiplus/locale']`？
9. `types/index.d.ts` 主要提供哪三類 TypeScript contract？
10. 如果新增一個 public API，為什麼要同時檢查 runtime export、plugin install 和 `types/` declaration？

---

## 11. 後續延伸方向

這份筆記可以作為 View UI Plus public surface 的總覽，後續可以再拆成以下主題深入整理。

1. `src/index.js` runtime composition 詳解：逐段分析 default API、install、locale APIs、globalProperties 的組成方式。
2. `src/components/index.js` component export registry：整理所有 named exports 與分類方式。
3. Global components 與 alias 策略：分析原名 component 與 `i` 前綴別名的設計目的與相容性考量。
4. GlobalProperties 與 service-style APIs：深入分析 `$Message`、`$Modal`、`$Notice`、`$Loading` 等命令式 API 的設計。
5. Locale system 與 `dist/locale/*`：追蹤 `locale`、`i18n`、`lang(code)`、`build:lang` 與語系包產物的關係。
6. TypeScript declaration surface：分析 `types/index.d.ts`、`types/viewuiplus.components.d.ts` 與 `ComponentCustomProperties` augmentation。
7. Runtime surface 與 Type surface 一致性檢查：建立新增或修改 public API 時的維護 checklist。
8. Component library API 設計原則：從 View UI Plus 延伸比較其他 Vue UI library 的 public surface 設計。
