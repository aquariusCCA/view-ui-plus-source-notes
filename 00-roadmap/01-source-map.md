# View UI Plus 原始碼地圖：從套件入口到閱讀路線

> 本章是一份「原始碼地圖筆記」，目的不是深入拆解某一個元件，而是先幫讀者建立全局視角：  
> **View UI Plus 這個套件從哪裡進入、對外暴露哪些 API、內部目錄大致負責什麼，以及後續應該照什麼順序閱讀。**

---

## 0. 本章定位：為什麼要先做 Source Map？

閱讀 UI component library 的原始碼時，最容易犯的錯誤是：

一開始就打開某個元件，例如 `button`、`select`、`modal`，然後直接追進 props、events、slots、render、樣式、工具函式與型別宣告。  
這樣雖然看起來很認真，但很快會遇到一個問題：

> 你看得懂單一檔案的一部分，卻不知道它在整個套件裡扮演什麼角色。

因此，在正式分析元件之前，應該先建立一張「原始碼地圖」。

這張地圖要回答幾個基本問題：

1. 這個 npm package 對外提供哪些入口？
2. 使用者在專案中 `app.use(ViewUIPlus)` 時，實際會觸發哪段程式？
3. 全量安裝、單獨匯入、全域 API、指令、語系、型別宣告分別從哪裡開始讀？
4. 哪些目錄是核心 runtime？哪些目錄是樣式、型別、建置或測試？
5. 後續如果要深入讀元件，應該照什麼順序前進？

本章只負責建立地圖，不深入評論架構優缺點，也不拆解單一 component 的完整實作。

---

## 1. 讀者需要先知道的基本觀念

在讀這份 source map 前，建議先理解三個觀念。

### 1.1 UI component library 是什麼？

View UI Plus 是一套 Vue 3 UI component library。

也就是說，它不是單一頁面專案，而是一個「提供給其他 Vue 專案使用的元件庫」。  
使用者通常會用兩種方式使用它。

第一種是全量安裝：

```js
import { createApp } from 'vue'
import ViewUIPlus from 'view-ui-plus'
import App from './App.vue'

createApp(App)
  .use(ViewUIPlus)
  .mount('#app')
```

第二種是單獨匯入某些元件：

```js
import { Button, Table } from 'view-ui-plus'
```

所以讀這類原始碼時，不能只看元件本身。  
你還要看：

- 這個套件如何被 npm package 對外暴露
- 使用者 import 時會進入哪個檔案
- `app.use()` 背後呼叫的 `install()` 做了什麼
- components、directives、locale、styles、types 如何被組織起來

---

### 1.2 Runtime、Types、Styles 是三條不同的線

讀 View UI Plus 時，可以先把整個套件拆成三條線：

| 線路 | 代表內容 | 主要關心點 |
| --- | --- | --- |
| Runtime | JavaScript / Vue 元件執行期程式 | 元件如何被註冊、API 如何被掛載、功能如何運作 |
| Types | TypeScript declarations | 使用者 import 時 IDE 如何取得型別提示 |
| Styles | Less / CSS 樣式系統 | 元件的視覺樣式如何被組織與建置 |

這三條線會彼此配合，但閱讀時不要混在一起。  
初學者最適合先讀 runtime，因為 runtime 直接對應到元件如何被使用與執行。

---

### 1.3 Source Map 不等於元件分析

本章只回答：

> 「要從哪裡開始讀？」  
> 「哪個目錄大概負責什麼？」  
> 「對外 API 的邊界在哪裡？」

本章不回答：

- `Button` 的 props 如何設計
- `Select` 如何處理選項狀態
- `Form` 如何做表單驗證
- `Modal` 如何管理彈窗層級
- 樣式系統為什麼這樣拆
- build 設定是否合理

這些問題應該放到後續專題筆記，避免 source map 變成大型雜記。

---

## 2. Source Baseline：本次閱讀的來源基準

讀原始碼筆記一定要先固定版本。  
因為 UI library 的目錄、入口、build 設定與型別宣告可能會隨版本改動。

| 項目 | 內容 |
| --- | --- |
| Package | `view-ui-plus` |
| Version | `1.3.20` |
| Source path | `01-origin/source/view-ui-plus-v1.3.20/` |
| Package manifest | `01-origin/source/view-ui-plus-v1.3.20/package.json` |
| Runtime entry | `01-origin/source/view-ui-plus-v1.3.20/src/index.js` |
| Type entry | `01-origin/source/view-ui-plus-v1.3.20/types/index.d.ts` |

本章所有觀察都以 `view-ui-plus@1.3.20` 為基準。

---

## 3. 從使用者角度理解套件入口

讀原始碼前，先想像一個問題：

> 使用者安裝 View UI Plus 後，會怎麼碰到這個套件？

大致有三種主要接觸方式。

---

### 3.1 使用者全量安裝

```js
import ViewUIPlus from 'view-ui-plus'

app.use(ViewUIPlus)
```

這代表 View UI Plus 必須提供一個 default export。  
這個 default export 通常會是一個物件，裡面包含 `install()` 方法。

Vue plugin 的核心規則是：

> 當你執行 `app.use(plugin)` 時，Vue 會呼叫 plugin 的 `install(app, options)`。

所以只要看懂 `src/index.js` 中的 `install()`，就能掌握全量安裝流程。

---

### 3.2 使用者單獨匯入元件

```js
import { Button } from 'view-ui-plus'
```

這代表套件除了 default export 外，也要提供 named exports。  
這些 named exports 的來源通常會集中在 components 的總入口，例如：

```text
src/components/index.js
```

這類檔案常被稱為 barrel file。  
它的主要任務不是實作元件，而是把很多元件集中匯出，讓使用者可以從同一個入口 import。

---

### 3.3 使用者取得 TypeScript 型別提示

```ts
import { Button } from 'view-ui-plus'
```

如果使用者的專案是 TypeScript，IDE 需要知道：

- `Button` 是什麼型別
- 套件有哪些可匯出的 API
- 全域屬性例如 `$Message`、`$Modal` 是否有型別宣告

這條線會從 `package.json` 的 `typings` 欄位進到：

```text
types/index.d.ts
```

所以 runtime 入口與 type 入口要分開看：

| 類型 | 入口 |
| --- | --- |
| Runtime entry | `src/index.js` |
| Type entry | `types/index.d.ts` |

---

## 4. Package Entry Points：package.json 對外暴露什麼？

`package.json` 是 npm package 的對外說明書。  
它告訴使用者與工具：這個套件的 runtime、型別與發布內容在哪裡。

---

### 4.1 主要欄位

| 欄位 | 值 | 說明 |
| --- | --- | --- |
| `main` | `dist/viewuiplus.min.js` | 發布後的 runtime bundle，使用者 import 套件時主要會接觸到的建置產物 |
| `typings` | `types/index.d.ts` | TypeScript 型別入口，提供 IDE 與 TS compiler 使用 |
| `files` | `dist`, `src`, `types` | 發布到 npm package 時會包含的主要內容 |

這裡可以建立一個重要觀念：

> 使用者實際安裝套件時，主要消費的是 `dist/` 與 `types/`；  
> 但我們閱讀原始碼時，應該回到 `src/` 理解 runtime 實作。

也就是說：

```text
使用者使用套件：dist/ + types/
讀者理解原始碼：src/ + types/ + build/
```

---

### 4.2 scripts 告訴我們建置流程

`package.json` 裡的 scripts 可以幫助我們理解：  
這個專案如何從原始碼變成發布產物。

| Script | Command | 用途 |
| --- | --- | --- |
| `dev` | `vue-cli-service serve` | 啟動開發或範例環境 |
| `build` | `npm run build:prod && npm run build:style && npm run build:lang` | 完整 build 流程 |
| `build:prod` | `vite build` | 建置 JavaScript runtime bundle |
| `build:style` | `gulp --gulpfile build/build-style.js` | 建置樣式檔 |
| `build:lang` | `vite build --config build/vite.lang.config.js` | 建置語系包 |
| `lint` | `vue-cli-service lint --fix` | 執行 lint 並自動修正 |

從這裡可以看出，View UI Plus 的建置至少包含三個部分：

1. JavaScript bundle
2. Style bundle
3. Language / locale bundle

不過 build 細節不是本章重點。  
本章只要先知道：建置相關入口主要分散在：

```text
package.json
vite.config.js
vue.config.js
build/
```

深入分析應放到後續的 build/release 筆記。

---

## 5. Runtime Entry Map：src/index.js 做了什麼？

如果只能先讀一個 runtime 檔案，應該先讀：

```text
src/index.js
```

因為它是 View UI Plus 全量安裝與對外 runtime API 的核心入口。

---

### 5.1 src/index.js 的核心角色

`src/index.js` 可以理解成「套件 runtime 的總開關」。

它主要負責：

1. 匯入所有 components
2. 匯入 directives
3. 匯入 locale / i18n 相關功能
4. 匯入 dayjs
5. 取得 package version
6. 定義 `install(app, opts)`
7. 在 `install()` 中註冊 components 與 directives
8. 在 `app.config.globalProperties` 上掛載全域設定與命令式 API
9. 對外匯出 default API 與部分 named API

這個檔案不一定包含所有細節實作。  
它更像是總入口，把不同模組組裝起來。

---

### 5.2 install(app, opts) 的閱讀重點

`install(app, opts)` 是全量安裝流程的核心。

可以把它拆成五個步驟理解。

---

#### Step 1：處理 locale 與 i18n

`opts.locale` 會交給 locale 相關方法處理。  
`opts.i18n` 也會交給 locale 相關方法處理。

這代表使用者在安裝時可以傳入語系或 i18n 設定，例如：

```js
app.use(ViewUIPlus, {
  locale: someLocale,
  i18n: someI18nHandler
})
```

對讀者來說，這裡先不用深入 locale 的實作。  
先記住：

> locale 是安裝階段就會被初始化的全域能力。

後續如果要深入語系系統，再去讀：

```text
src/locale/
```

---

#### Step 2：註冊所有 components

全量安裝時，`install()` 會把 View UI Plus 裡的 components 註冊到 Vue app。

概念上類似：

```js
Object.keys(ViewUI).forEach(key => {
  app.component(key, ViewUI[key])
})
```

這表示只要使用者執行：

```js
app.use(ViewUIPlus)
```

之後就可以在 template 中使用元件，而不需要每個元件都手動 import 與註冊。

例如：

```vue
<template>
  <Button>Submit</Button>
</template>
```

這一段是理解 component library 的核心。  
因為它回答了：

> 為什麼 `app.use(ViewUIPlus)` 之後，template 裡就能直接使用 View UI Plus 的元件？

---

#### Step 3：註冊 directives

除了 components，View UI Plus 也提供 directives。

在 `install()` 中會註冊類似以下 directives：

| Directive | 大致用途 |
| --- | --- |
| `display` | 控制或觀察顯示相關行為 |
| `width` | 寬度相關處理 |
| `height` | 高度相關處理 |
| `resize` | 尺寸變化監聽 |
| `line-clamp` | 文字行數截斷相關處理 |

本章只標示它們的入口。  
如果要深入 directive 的生命週期、DOM 操作與使用場景，應分流到：

```text
11-directives/
```

---

#### Step 4：建立全域設定 `$VIEWUI`

`install()` 也會在 Vue app 的 global properties 上掛載 `$VIEWUI`。

`$VIEWUI` 可以理解成 View UI Plus 的全域設定容器。  
它可能保存：

- 全域 `size`
- 全域 `transfer`
- component icon 設定
- component config 設定

對讀者來說，這裡要建立一個觀念：

> 有些元件的預設行為不只來自 props，也可能來自全域設定。

所以後續如果在某個元件看到它讀取全域設定，不要覺得突兀。  
那條線很可能就是從 `src/index.js` 的 `$VIEWUI` 來的。

---

#### Step 5：掛載命令式 API

UI library 不只提供 template 元件，也常提供命令式 API。

例如：

```js
this.$Message.info('Saved successfully')
this.$Modal.confirm({ title: 'Confirm' })
this.$Loading.start()
```

這些 API 的特點是：

> 使用者不需要先在 template 寫一個 component，而是直接用方法呼叫 UI 行為。

View UI Plus 在 `install()` 中會掛載類似：

| API | 類型 |
| --- | --- |
| `$Spin` | loading / spin 相關命令式 API |
| `$Loading` | 頁面載入狀態 API |
| `$Message` | 訊息提示 API |
| `$Notice` | 通知 API |
| `$Modal` | 彈窗 API |
| `$Date` | dayjs 日期工具 |

這類 API 的實作通常比一般 Button 更複雜，因為它可能涉及：

- 動態建立 Vue component instance
- 掛載到 DOM
- 管理關閉與銷毀
- 管理多個 message / notice / modal 的佇列或層級

因此本章只標記入口，細節建議分流到：

```text
10-imperative-api/
08-overlay-system/
```

---

### 5.3 src/index.js 的一段話總結

可以把 `src/index.js` 理解成：

> View UI Plus runtime 的總入口。  
> 它把 components、directives、locale、global config、imperative APIs 組裝成一個 Vue plugin，讓使用者可以透過 `app.use(ViewUIPlus)` 一次啟用整個元件庫。

---

## 6. Source Directory Map：原始碼目錄怎麼分工？

理解入口之後，下一步是建立目錄地圖。

以下表格不是要你一次讀完所有目錄，而是讓你知道：

> 當你遇到某種問題時，應該去哪個目錄找答案。

| 路徑 | 角色 | 初次閱讀時的重點 | 後續筆記 |
| --- | --- | --- | --- |
| `src/components/` | components 與 service API 主體 | 元件與命令式 API 的核心來源 | `07-components/`, `08-overlay-system/`, `09-form-system/`, `10-imperative-api/` |
| `src/directives/` | Vue directives | directive 如何定義與被 install 註冊 | `11-directives/` |
| `src/locale/` | 語系與 i18n | locale 如何初始化與對外提供 API | `03-architecture/`, `20-supplements/` |
| `src/mixins/` | 共用 mixins | 多個元件共用的 Vue Options API 邏輯 | `03-architecture/`, `05-composables/` |
| `src/styles/` | Less style system | 樣式變數、元件樣式與樣式入口 | `12-style-system/` |
| `src/utils/` | 共用 utilities | 跨元件使用的工具函式 | `03-architecture/`, `05-composables/` |
| `types/` | TypeScript declarations | 對外 API 的型別邊界 | `06-type-system/` |
| `build/` | build scripts | 樣式、語系、bundle 的建置流程 | `14-build-release/` |
| `dist/` | 發布後產物 | 給使用者安裝後消費的 JS、CSS、locale 產物 | `14-build-release/` |
| `examples/` | 文件與範例入口 | 查看元件實際使用方式 | `17-demos/` |
| `test/` | 測試 | 查看行為驗證與測試案例 | `13-testing/` |

---

### 6.1 初學者應該先關心哪些目錄？

如果你是第一次讀 View UI Plus，建議先關心：

```text
package.json
src/index.js
src/components/index.js
src/components/
types/index.d.ts
src/styles/
```

原因如下：

| 目錄或檔案 | 為什麼先看 |
| --- | --- |
| `package.json` | 知道套件對外入口與 build scripts |
| `src/index.js` | 知道 `app.use()` 背後做了什麼 |
| `src/components/index.js` | 知道元件如何集中匯出 |
| `src/components/` | 找到實際元件實作 |
| `types/index.d.ts` | 知道 TypeScript 對外型別入口 |
| `src/styles/` | 理解元件樣式從哪裡來 |

---

### 6.2 初學者暫時可以晚點看的目錄

以下目錄不是不重要，而是可以晚點再深入：

| 目錄 | 為什麼可以晚點 |
| --- | --- |
| `build/` | 需要先理解 runtime 後，讀 build 才有意義 |
| `dist/` | 多數是建置後產物，不適合作為主要閱讀對象 |
| `test/` | 適合在理解元件行為後，再回來驗證設計 |
| `examples/` | 適合搭配元件分析時查看使用情境 |

---

## 7. Public Surface Map：使用者能碰到哪些 API？

public surface 指的是：

> 套件使用者可以直接接觸到的 API 邊界。

讀原始碼時，public surface 很重要，因為它可以幫你分辨：

- 哪些是對外承諾的 API
- 哪些只是內部實作細節
- 哪些檔案負責把內部實作包裝成使用者能用的形式

---

### 7.1 對外 API 總表

| 對外入口 | 使用者看到的形式 | 原始碼起點 | 讀碼重點 |
| --- | --- | --- | --- |
| Vue plugin install | `app.use(ViewUIPlus, options)` | `src/index.js` | 全量安裝流程如何啟動，包括註冊元件、指令、全域設定與服務 API |
| Named component exports | `import { Button } from 'view-ui-plus'` | `src/components/index.js` | 哪些元件支援單獨匯入，以及匯出名稱如何對應 component |
| Global components | 安裝後可在 template 使用元件 | `install()` in `src/index.js` | `install()` 如何把所有元件註冊到 Vue app |
| Global config | `$VIEWUI` | `src/index.js` | 全域 `size`、`transfer` 與各 component 預設選項如何保存 |
| Imperative APIs | `$Message`、`$Notice`、`$Modal`、`$Spin`、`$Loading` | `src/index.js` 與 `src/components/` | 不透過 template，直接用方法觸發 UI 行為 |
| Directives | `display`、`width`、`height`、`resize`、`line-clamp` | `src/directives/` 與 `src/index.js` | directive 從哪裡定義，並如何在 install 時註冊 |
| Type declarations | TypeScript import 與 IDE 型別提示 | `types/index.d.ts` | 對外 API 的型別入口 |
| Locale APIs | `locale`、`i18n`、`lang` | `src/index.js` 與 `src/locale/` | 語系與 i18n API 如何被匯出與初始化 |

---

### 7.2 如何用 public surface 反推閱讀順序？

如果你看到使用者這樣用：

```js
app.use(ViewUIPlus)
```

就回到：

```text
src/index.js
```

如果你看到使用者這樣用：

```js
import { Button } from 'view-ui-plus'
```

就回到：

```text
src/components/index.js
```

如果你看到使用者這樣用：

```js
this.$Message.success('OK')
```

就從：

```text
src/index.js
src/components/
```

開始找 `$Message` 是在哪裡被掛載，以及實際 Message API 從哪個 component 或 service 模組來。

如果你看到 TypeScript 型別提示問題，就回到：

```text
types/index.d.ts
types/viewuiplus.components.d.ts
```

這就是 source map 的價值：  
它讓你看到一個用法時，知道應該回到哪個原始碼入口追。

---

## 8. Suggested Reading Route：建議閱讀路線

以下是一條適合初學者的閱讀路線。  
原則是：

> 先看入口，再看匯出，再看簡單元件，最後才看複雜系統。

---

### Stage 1：先建立套件地圖

第一階段先不要進入任何 component 的細節。

閱讀順序：

1. `package.json`
2. `src/index.js`
3. `src/components/index.js`

閱讀目標：

- 知道 npm package 的 runtime entry 與 type entry
- 知道 `app.use(ViewUIPlus)` 會進入 `install()`
- 知道 components 如何被集中匯出
- 知道全量註冊與 named exports 的差異

完成這階段後，你應該能回答：

1. `main`、`typings`、`files` 分別代表什麼？
2. `src/index.js` 為什麼是 runtime 入口？
3. `install(app, opts)` 大致做了哪幾件事？
4. `src/components/index.js` 的角色是什麼？

---

### Stage 2：選一個簡單 component 讀

第二階段可以選一個簡單元件，例如：

```text
button
```

閱讀目標不是把所有細節背起來，而是理解一個元件通常由哪些部分構成：

- component 入口
- props
- emits / events
- slots
- render 或 template
- class name 組裝
- style 對應
- 是否被 `components/index.js` 匯出
- 是否有對應型別宣告

完成這階段後，你應該能回答：

1. 一個 component 是如何被匯出給使用者的？
2. 使用者 template 裡寫的元件名稱，如何對應到原始碼？
3. 元件樣式是從哪裡來的？
4. TypeScript 型別宣告是否有對應到這個元件？

---

### Stage 3：再讀一個複合 component

第三階段再選一個較複雜的元件，例如：

```text
input
select
form
table
modal
```

這些元件通常會涉及更多狀態管理與跨模組協作。

閱讀目標：

- props 與內部狀態如何對應
- event 如何向外通知使用者
- 子元件如何拆分
- 是否使用 mixins 或 utils
- 是否與全域 config 有關
- 是否與 overlay、form validation、keyboard interaction 有關

這階段不要貪多。  
一次只選一個複合元件，並畫出它的依賴關係。

---

### Stage 4：讀跨元件系統

當你已經讀過一個簡單元件與一個複合元件後，再讀跨元件系統。

建議順序：

1. `src/utils/`
2. `src/mixins/`
3. `src/directives/`
4. `src/locale/`
5. `src/styles/`
6. `types/`

這一階段的重點是理解：

> View UI Plus 如何把共用能力抽出來，讓多個元件共用。

例如：

- 工具函式如何避免重複邏輯
- mixins 如何提供共用行為
- directives 如何補足 component 之外的 DOM 行為
- locale 如何讓多個元件共用語系文字
- styles 如何維持整套 UI 的一致性
- types 如何描述對外 API

---

### Stage 5：最後再讀 build / release

最後再回頭讀：

```text
build/
vite.config.js
vue.config.js
package.json scripts
dist/
```

這時你已經知道 runtime 與 styles 的來源，讀 build 才會有意義。

閱讀目標：

- JavaScript bundle 如何產生
- CSS / Less 如何建置
- locale 包如何建置
- `dist/` 裡的產物如何對應到 `package.json`
- 發布到 npm 時包含哪些檔案

---

## 9. 常見閱讀誤區

### 誤區一：一開始就讀最複雜的元件

例如一開始就讀 `table`、`select`、`modal`。  
這些元件牽涉狀態、子元件、彈層、事件、鍵盤操作、樣式與型別，容易讓初學者迷路。

比較好的做法是：

```text
package.json
→ src/index.js
→ src/components/index.js
→ button
→ input/select/form/modal
```

---

### 誤區二：把 dist 當成主要閱讀對象

`dist/` 是發布後產物，通常經過打包、壓縮或轉換。  
它適合用來確認套件最後輸出的樣子，但不適合作為主要學習入口。

主要閱讀對象應該是：

```text
src/
types/
build/
```

---

### 誤區三：沒有區分 public API 與 internal implementation

public API 是使用者直接依賴的東西。  
internal implementation 是套件內部為了實現功能而存在的細節。

例如：

| 類型 | 例子 |
| --- | --- |
| Public API | `app.use(ViewUIPlus)`、`import { Button }`、`this.$Message` |
| Internal implementation | 某個 utils function、某個內部子元件、某段 class name 組裝邏輯 |

讀原始碼時應該先掌握 public API，再追 internal implementation。

---

### 誤區四：source map 寫太細

source map 的目的不是把全部細節都塞進來。  
如果這份筆記開始記錄每個 component 的 props、events、slots，就會失去地圖的功能。

正確做法是：

- source map 只記入口與分流方向
- component 細節放到 component 專題
- directive 細節放到 directive 專題
- style 細節放到 style system 專題
- build 細節放到 build/release 專題

---

## 10. 本章總結

View UI Plus 的原始碼可以先拆成幾個大面向：

1. npm package 對外入口
2. Vue plugin install 流程
3. components 匯出與註冊
4. directives 註冊
5. locale / i18n 初始化
6. global config
7. imperative APIs
8. TypeScript declarations
9. Less style system
10. build / release 產物

其中，第一次閱讀最重要的是：

```text
package.json
src/index.js
src/components/index.js
```

因為它們回答了三個核心問題：

1. 這個套件如何對外暴露？
2. `app.use(ViewUIPlus)` 背後做了什麼？
3. 元件如何被集中匯出並提供給使用者？

只要先建立這張地圖，後續讀單一 component、directive、style system、type system 或 build system，都會更有方向。

---

## 11. 後續筆記分流建議

這份 source map 建議作為整個 View UI Plus 原始碼筆記的第一章。  
後續可以依照主題拆成以下筆記：

| 筆記主題 | 建議內容 |
| --- | --- |
| `02-package-entry/` | 詳細分析 `package.json`、exports、files、scripts |
| `03-architecture/` | 整體架構、模組依賴、runtime 組裝方式 |
| `06-type-system/` | `types/index.d.ts` 與 component declarations |
| `07-components/` | 一般 component 的閱讀模板與案例 |
| `08-overlay-system/` | Modal、Message、Notice、Loading 等彈層系統 |
| `09-form-system/` | Form、FormItem、Input、Select 等表單系統 |
| `10-imperative-api/` | `$Message`、`$Notice`、`$Modal` 等命令式 API |
| `11-directives/` | directives 的定義、註冊與 DOM 行為 |
| `12-style-system/` | Less 變數、樣式入口、元件樣式組織 |
| `13-testing/` | 測試案例與行為驗證 |
| `14-build-release/` | Vite、Gulp、style build、locale build、dist 產物 |
| `17-demos/` | examples 與實際使用案例 |
| `20-supplements/` | 補充概念，例如 Vue plugin、i18n、dayjs、barrel file |

---

## 12. 自我檢查問題

讀完本章後，可以用以下問題檢查自己是否真的理解 source map。

1. 為什麼讀 View UI Plus 不應該一開始就讀 `table` 或 `modal`？
2. `package.json` 的 `main`、`typings`、`files` 分別代表什麼？
3. 為什麼 `src/index.js` 是 runtime entry？
4. `install(app, opts)` 大致做了哪五件事？
5. 全量安裝與 named component export 有什麼不同？
6. `$Message`、`$Notice`、`$Modal` 為什麼屬於 imperative APIs？
7. `types/index.d.ts` 解決的是什麼問題？
8. `src/styles/` 與 `dist/` 的角色有什麼不同？
9. 什麼是 public surface？
10. 如果你看到 `import { Button } from 'view-ui-plus'`，應該從哪個原始碼入口開始追？

---

## 13. 本章閱讀成果

完成本章後，你應該具備以下能力：

- 能說明 View UI Plus 的主要原始碼入口
- 能分辨 runtime、types、styles、build 的不同角色
- 能理解 `app.use(ViewUIPlus)` 與 `install()` 的關係
- 能知道 components、directives、locale、imperative APIs 從哪裡開始追
- 能為後續 component 深入分析建立清楚的閱讀路線

這就是 source map 的目的：  
**不是一次讀懂所有細節，而是讓你之後讀任何細節時，都知道自己在地圖上的哪個位置。**
