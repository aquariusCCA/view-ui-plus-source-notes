# Locale Plugin Contract：View UI Plus 的語系插件契約

## 1. 本章定位

本篇筆記是 `View UI Plus` 的 **plugin system 原始碼閱讀筆記**，主題是 `Locale Plugin Contract`。它要說明的是：`View UI Plus` 在 Vue plugin 安裝流程中，如何接收語系設定、如何把語系控制 API 暴露給使用者，以及 `lang(code)` 這種依賴全域語系包的 API 有什麼 runtime 前提。

本篇放在 `04-plugin-system/` 目錄下是合理的，因為 locale / i18n 在這裡不是單純的翻譯內容，而是 plugin install 時建立的一種全域設定契約。也就是說，這篇不是在研究每一個元件如何顯示中文、英文或其他語言，而是在研究 plugin layer 如何把語系能力接到整個 View UI Plus runtime。

讀完本篇後，應該理解以下幾件事：

1. `src/index.js` 為什麼會引入 `localeFile`。
2. `install(app, opts)` 如何處理 `opts.locale` 與 `opts.i18n`。
3. named export 的 `locale`、`i18n` 和 install options 的差異。
4. `lang(code)` 為什麼依賴 `window['viewuiplus/locale'].default`。
5. TypeScript 型別宣告目前只給出很寬鬆的 `any` contract。
6. 哪些內容應該留到 `src/locale/`、`dist/locale/*` 或 build release 筆記中繼續分析。

本篇不深入分析以下內容：

- `src/locale/index` 內部如何保存目前語系狀態。
- 各元件如何取得翻譯文字。
- 每個語系包的實際資料結構。
- `dist/locale/*` 如何被打包產生。
- `i18n` adapter 的完整函式簽名與使用細節。

這些主題應拆到後續筆記，例如 `10-imperative-api/`、`14-build-release/`、`20-supplements/` 或專門的 `locale-system` 目錄中分析。

---

## 2. 學習前先建立的基本觀念

### 2.1 Vue plugin install 階段適合處理全域設定

Vue 3 的 plugin 通常透過 `app.use(plugin, options)` 安裝。對元件庫來說，這個階段常見的任務包括：

1. 全局註冊 components。
2. 全局註冊 directives。
3. 注入全域設定。
4. 掛載 instance-level API。
5. 初始化語系、主題或全域行為。

`View UI Plus` 的 locale 設定屬於「全域設定初始化」。它不是某一個單一 component 的私有設定，而是整個元件庫都可能需要讀取的 runtime state。因此，將 `locale` 與 `i18n` 放在 plugin install 階段處理，是一種典型的元件庫設計方式。

### 2.2 locale 和 i18n 不是同一個層次

在閱讀這段原始碼時，要先區分 `locale` 與 `i18n` 的概念。

`locale` 通常指的是「語系資料物件」，例如某個語言包可能包含按鈕、日期、分頁、表單驗證等文字。它比較像資料來源。

`i18n` 通常指的是「翻譯函式或翻譯 adapter」，用來告訴元件庫如何把某個 key 轉成顯示文字。它比較像翻譯機制或橋接器。

`View UI Plus` 並沒有在 `src/index.js` 內詳細展開 locale object 或 i18n function 的形狀，而是把它們轉交給 `localeFile.use()` 與 `localeFile.i18n()`。這代表 `src/index.js` 的責任是「接線」，不是「翻譯邏輯本體」。

### 2.3 install option 和 named export 是兩種不同入口

同一個能力可以透過不同入口暴露：

```js
app.use(ViewUIPlus, {
    locale,
    i18n
});
```

這是安裝 plugin 時一次性傳入 options。

另一種方式是：

```js
import { locale, i18n } from 'view-ui-plus';

locale(langObject);
i18n(translateFn);
```

這是透過 named export 從 module-level 直接調用。

兩者都會連到 `localeFile`，但語意不同。install options 強調「安裝時初始化」，named exports 強調「使用者可以直接取得語系控制 API」。在閱讀元件庫原始碼時，這種差異很重要，因為它代表同一個內部模組可能同時支援 plugin 設定與獨立 API 呼叫。

---

## 3. 整體概覽

從 `src/index.js` 來看，locale plugin contract 可以整理成以下結構：

```txt
src/index.js
  ├─ import localeFile from './locale/index'
  │
  ├─ install(app, opts)
  │    ├─ if (opts.locale) localeFile.use(opts.locale)
  │    ├─ if (opts.i18n) localeFile.i18n(opts.i18n)
  │    ├─ register components
  │    └─ register directives
  │
  ├─ export const locale = localeFile.use
  ├─ export const i18n = localeFile.i18n
  └─ export const lang = (code) => { ... }
```

這裡可以看到 `src/index.js` 對 locale 系統扮演三種角色。

第一，它是 **install-time adapter**。當使用者執行 `app.use(ViewUIPlus, options)` 時，`src/index.js` 會把 `options.locale` 與 `options.i18n` 轉交給 `localeFile`。

第二，它是 **module-level API surface**。使用者可以直接從 package 匯入 `locale` 或 `i18n`，這兩個 named exports 實際上對應到 `localeFile.use` 與 `localeFile.i18n`。

第三，它是 **runtime global bridge**。`lang(code)` 並不是直接接收一個語系物件，而是從 `window['viewuiplus/locale'].default` 讀取已載入的語系包，再根據 `code` 判斷是否要套用該語系。

因此，這篇筆記的核心不是「View UI Plus 有支援多語系」這種表面結論，而是要看懂：plugin layer 如何把語系系統接到 Vue app、package exports 與 runtime global 三個入口。

---

## 4. 核心內容逐步講解

### 4.1 `localeFile`：plugin layer 與 locale module 的連接點

`src/index.js` 先引入 locale 模組：

```js
import localeFile from './locale/index';
```

從這行可以看出，`src/index.js` 本身不是 locale 系統的實作核心。它沒有直接保存目前語系，也沒有直接處理翻譯 key，而是透過 `localeFile` 對外部 locale module 發出指令。

plugin layer 使用 `localeFile` 的幾種能力：

| Runtime API | Source behavior |
| --- | --- |
| install option `locale` | `localeFile.use(opts.locale)` |
| install option `i18n` | `localeFile.i18n(opts.i18n)` |
| named export `locale` | `export const locale = localeFile.use` |
| named export `i18n` | `export const i18n = localeFile.i18n` |

這張表的重點在於：`localeFile.use` 和 `localeFile.i18n` 是內部真正被重複使用的核心入口。plugin install 會用它，named export 也會暴露它。

因此，`src/index.js` 可以理解成一個「門面層」。它把內部 `localeFile` 的能力接到外部使用者看得見的入口，但它不負責定義 locale object 或 i18n function 的完整資料結構。

閱讀這段原始碼時要注意：本篇只能根據 `src/index.js` 的使用方式推論 locale contract 的外層行為。如果要知道 `localeFile.use()` 具體如何保存語系、如何通知元件、如何和 translation function 串接，必須繼續閱讀 `src/locale/index`。此處需要後續補充。

---

### 4.2 install-time locale setup：安裝 plugin 時初始化語系狀態

`install(app, opts)` 中會先處理 locale，再註冊 components 和 directives：

```js
if (opts.locale) {
    localeFile.use(opts.locale);
}
if (opts.i18n) {
    localeFile.i18n(opts.i18n);
}
```

使用者可以在安裝元件庫時傳入：

```js
app.use(ViewUIPlus, {
    locale,
    i18n
});
```

這代表 `View UI Plus` 允許使用者在 plugin 安裝時提供語系資料與翻譯 adapter。這種設計的好處是，應用程式可以在元件大量使用之前，先完成全域語系初始化。

從 plugin system 的角度來看，這段程式碼有兩個重點。

第一，`locale` 與 `i18n` 都是 optional。只有當 `opts.locale` 或 `opts.i18n` 存在時，才會呼叫對應的 `localeFile` 方法。這表示使用者可以不傳 locale options，而讓 View UI Plus 使用預設語系或內部預設行為。預設行為的細節需要看 `src/locale/`，本篇不任意推測。

第二，locale setup 發生在 component registration 前。這個順序代表 plugin 安裝流程會先處理全域語系狀態，再進入元件與指令註冊。這樣可以讓後續 component runtime 讀到已設定的 locale 狀態。不過要注意，這不等於所有 component 在註冊當下就會立即讀取 locale；更精確地說，plugin layer 先完成 locale module 的設定，讓後續元件在執行階段有機會使用該狀態。

這種設計很像元件庫常見的全域 config 初始化流程：

```txt
app.use(ViewUIPlus, options)
  ├─ 初始化全域 options
  ├─ 初始化 locale / i18n
  ├─ 註冊全域 components
  ├─ 註冊全域 directives
  └─ 使用者開始在 app 中使用元件
```

因此，`opts.locale` 與 `opts.i18n` 應該被理解成 plugin install contract 的一部分，而不是單一元件的 props。

---

### 4.3 named locale APIs：不透過 `app.use` 也能暴露控制入口

除了 install options，package 也暴露兩個 named APIs：

```js
export const locale = localeFile.use;
export const i18n = localeFile.i18n;
```

這讓使用者可以寫：

```js
import { locale, i18n } from 'view-ui-plus';

locale(langObject);
i18n(translateFn);
```

這種 API 的意義是：語系控制能力不只存在於 `app.use(ViewUIPlus, options)` 這個安裝階段，也可以透過 module-level API 被呼叫。

這裡要特別注意 `install option` 和 `named export` 的差異：

| 入口 | 寫法 | 語意 |
| --- | --- | --- |
| install option | `app.use(ViewUIPlus, { locale, i18n })` | 安裝 View UI Plus 時設定語系 |
| named export | `import { locale, i18n } from 'view-ui-plus'` | 從 package 取得語系控制函式 |
| internal implementation | `localeFile.use` / `localeFile.i18n` | 實際處理語系與 i18n adapter 的內部方法 |

這種設計讓內部邏輯可以重用同一組方法，外部則可以提供不同使用方式。

不過，是否能把 named export 當成「動態切換語系」的完整能力，不能只看 `src/index.js` 就下結論。因為動態切換是否有效，還要看元件在 render 時如何讀取 locale state、locale state 是否是 reactive、以及元件是否會隨狀態變更重新計算文字。這部分需要後續閱讀 `src/locale/` 與實際 component 使用方式，本篇先標註為「需要後續確認」。

---

### 4.4 `lang(code)`：依賴 runtime global 的語系載入契約

`lang(code)` 是另一個 named export：

```js
export const lang = (code) => {
    const langObject = window['viewuiplus/locale'].default;
    if (code === langObject.i.locale) localeFile.use(langObject);
    else console.log(`The ${code} language pack is not loaded.`);
};
```

它和前面的 `locale(langObject)` 最大差異是：`locale()` 直接接收語系物件，而 `lang(code)` 只接收一個語系代碼，然後自己去 runtime global 上找已載入的語系物件。

它依賴的 global 位置是：

```txt
window['viewuiplus/locale'].default
```

因此，`lang(code)` 的 runtime contract 可以拆成四個前提：

1. 執行環境必須有 `window`。
2. 頁面必須已經載入對應的 locale bundle。
3. locale bundle 必須把語系物件放到 `window['viewuiplus/locale'].default`。
4. 傳入的 `code` 必須等於 `langObject.i.locale`。

當 `code === langObject.i.locale` 時，才會執行：

```js
localeFile.use(langObject);
```

如果 `code` 不符合，則輸出：

```js
console.log(`The ${code} language pack is not loaded.`);
```

這裡有一個容易誤解的地方：`console.log` 只處理「有成功讀到 `langObject`，但 `code` 不匹配」的情況。從這段原始碼來看，如果 `window['viewuiplus/locale']` 根本不存在，程式在讀取 `.default` 時就可能出錯，而不一定會走到 `console.log`。

也就是說，`lang(code)` 不是一個完整防呆的 loader。它比較像是「假設語系包已經由其他方式載入，再根據 code 套用該語系包」的 runtime bridge。

因此，使用 `lang(code)` 時要建立正確心智模型：

```txt
不是：lang(code) 幫你下載語系包
而是：lang(code) 從已載入的 window global 中取出語系包並套用
```

`lang(code)` 依賴語系 bundle 在 runtime 掛載出特定的全域變數；至於這些 bundle 是如何打包出來的，應該放到 `14-build-release/` 分析。

---

### 4.5 Type surface：型別宣告只保證入口存在，不保證精確 contract

`types/index.d.ts` 的 `ViewUIPlusInstallOptions` 包含：

```ts
interface ViewUIPlusInstallOptions extends ViewUIPlusGlobalOptions {
    locale?: any;
    i18n?: any;
}
```

這代表 TypeScript 層面允許使用者在 `app.use(ViewUIPlus, options)` 中傳入 `locale` 與 `i18n`。但是因為兩者型別都是 `any`，所以目前型別系統沒有描述：

- `locale` object 必須有哪些欄位。
- `i18n` function 應該接收哪些參數。
- `i18n` function 應該回傳什麼。
- `langObject.i.locale` 的形狀是否固定。
- locale bundle 在 `window` 上的結構是否有對應型別。

這表示 `types/index.d.ts` 提供的是「入口存在」的保證，而不是「method-level contract」或「data shape contract」的保證。

對原始碼閱讀來說，這是一個很重要的觀察。因為它說明 View UI Plus 在這個版本中對 locale / i18n 的 typing 比較寬鬆，實際使用時必須依賴文件、範例或原始碼，而不能完全依靠 TypeScript 提示。

如果後續要補強型別分析，應該回到以下位置：

1. `src/locale/index`：確認 `use` 與 `i18n` 的實作。
2. locale bundle source：確認語系物件的資料結構。
3. component 中使用 locale 的地方：確認元件實際讀取哪些 key。
4. `types/index.d.ts`：確認對外型別宣告是否完整。
5. build artifact：確認 `window['viewuiplus/locale']` 的 runtime 形狀。

---

## 5. 表格整理

### 5.1 Locale plugin contract 總表

| 項目 | 位置 / 寫法 | 角色 | 閱讀重點 |
| --- | --- | --- | --- |
| `localeFile` | `import localeFile from './locale/index'` | locale module 的入口物件 | `src/index.js` 只負責接線，不是 locale 實作核心 |
| `opts.locale` | `localeFile.use(opts.locale)` | 安裝時設定語系物件 | 屬於 plugin install options，通常在 `app.use` 時傳入 |
| `opts.i18n` | `localeFile.i18n(opts.i18n)` | 安裝時設定翻譯 adapter | 型別目前是 `any`，需要從實作回推函式形狀 |
| named export `locale` | `export const locale = localeFile.use` | 暴露 module-level 語系設定 API | 和 install option 共用同一個內部方法 |
| named export `i18n` | `export const i18n = localeFile.i18n` | 暴露 module-level i18n adapter 設定 API | 是否支援動態切換效果，需要看 locale state 是否被元件 reactive 使用 |
| named export `lang` | `export const lang = (code) => { ... }` | 根據 code 套用已載入的語系 bundle | 依賴 `window['viewuiplus/locale'].default`，不是下載器 |
| type option `locale?: any` | `types/index.d.ts` | 宣告 install option 可傳 locale | 只保證欄位可傳，不描述 locale object shape |
| type option `i18n?: any` | `types/index.d.ts` | 宣告 install option 可傳 i18n | 只保證欄位可傳，不描述 function contract |

這張表可以幫助你把 locale plugin contract 拆成三個層次來讀：第一層是 `src/index.js` 的 runtime wiring，第二層是對外暴露的 install options / named exports，第三層是 TypeScript 宣告能不能完整描述 runtime 行為。

### 5.2 三種使用入口比較

| 使用入口 | 範例 | 適合情境 | 注意事項 |
| --- | --- | --- | --- |
| install options | `app.use(ViewUIPlus, { locale, i18n })` | App 初始化時設定語系與翻譯 adapter | 發生在 plugin install 階段，適合初始設定 |
| named export `locale` / `i18n` | `locale(langObject)`、`i18n(translateFn)` | 直接從 package 調用語系控制 API | 是否可用於完整動態切換，需確認 locale module 與元件使用方式 |
| named export `lang(code)` | `lang('zh-CN')` | 搭配已載入的 locale bundle，透過 code 套用語系 | 必須先有 `window['viewuiplus/locale'].default`，否則可能讀取失敗 |

這三種入口容易被混在一起理解，但它們的本質不同。install options 是 Vue plugin 安裝契約；`locale` / `i18n` 是 package API surface；`lang(code)` 則是和 runtime global 以及 build artifact 綁定的特殊入口。

### 5.3 `lang(code)` runtime contract 表

| 前提 | 說明 | 若不符合可能發生什麼事 |
| --- | --- | --- |
| 存在 `window` | `lang(code)` 直接讀取 `window` | SSR 或非瀏覽器環境可能不適用 |
| 已載入 locale bundle | bundle 需先把語系物件掛到全域 | 若 `window['viewuiplus/locale']` 不存在，讀取 `.default` 可能失敗 |
| bundle 結構符合預期 | 預期存在 `window['viewuiplus/locale'].default` | 結構不同會導致 `langObject` 取得失敗 |
| 語系物件含 `i.locale` | 程式會比較 `code === langObject.i.locale` | 若缺少 `i.locale`，比對邏輯不可靠 |
| `code` 與 bundle 內語系一致 | 只有一致時才呼叫 `localeFile.use(langObject)` | 不一致時印出 console message |

這張表的目的不是記 API 名稱，而是幫你建立 `lang(code)` 的正確使用邊界：它不是負責載入語系包，而是套用已存在於 runtime global 的語系物件。

---

## 6. 範例或情境說明

### 6.1 情境一：在安裝 View UI Plus 時設定語系

如果應用程式在初始化時就知道要使用哪個語系，可以透過 `app.use` 傳入 options：

```js
import { createApp } from 'vue';
import ViewUIPlus from 'view-ui-plus';

const app = createApp(App);

app.use(ViewUIPlus, {
    locale,
    i18n
});
```

在這個情境中，`locale` 和 `i18n` 是 plugin install options。它們會在 `install(app, opts)` 中被取出，並傳給 `localeFile.use()` 與 `localeFile.i18n()`。

這種方式適合用在「應用程式啟動時就決定語系」的場景。它的優點是設定集中，語意清楚，也符合 Vue plugin 的常見使用方式。

### 6.2 情境二：透過 named export 直接設定 locale

另一種方式是直接從 package 匯入語系控制 API：

```js
import { locale, i18n } from 'view-ui-plus';

locale(langObject);
i18n(translateFn);
```

這代表使用者不一定只能透過 `app.use(ViewUIPlus, options)` 設定語系，也可以直接呼叫 package 暴露的 API。

不過，閱讀原始碼時要保持邊界意識：`src/index.js` 只能證明 package 有暴露這兩個 API，不能單靠這段就保證所有元件都會對後續呼叫做 reactive 更新。若要確認是否適合做 runtime language switching，需要閱讀 locale module 與元件取用語系的方式。

### 6.3 情境三：使用 `lang(code)` 套用已載入的語系 bundle

`lang(code)` 的使用情境比較特殊。它不是直接傳入語系物件，而是希望語系物件已經透過某個 locale bundle 掛在全域：

```txt
window['viewuiplus/locale'].default
```

接著使用者呼叫：

```js
import { lang } from 'view-ui-plus';

lang('zh-CN');
```

`lang(code)` 會讀取全域語系物件，並檢查：

```js
code === langObject.i.locale
```

如果符合，就呼叫：

```js
localeFile.use(langObject);
```

因此，`lang(code)` 比較適合搭配預先載入的 `dist/locale/*` 語系包。它背後牽涉到 build artifact 如何把語系包掛到 `window`，這部分應該移到 `14-build-release/` 繼續分析。

---

## 7. 閱讀路線或學習路線

### 7.1 初次閱讀路線

第一次讀這個主題時，建議照以下順序：

1. 先讀 `src/index.js` 中 `localeFile` 的 import。
   - 目的：確認 plugin layer 並不是 locale 實作本體，而是透過 `localeFile` 接到 locale module。

2. 再讀 `install(app, opts)` 中的 `opts.locale` 與 `opts.i18n`。
   - 目的：理解使用者在 `app.use(ViewUIPlus, options)` 傳入語系設定時，plugin 如何處理。

3. 接著讀 `export const locale` 與 `export const i18n`。
   - 目的：理解同一組內部方法如何被暴露成 package-level named exports。

4. 最後讀 `lang(code)`。
   - 目的：理解它和前兩種入口不同，因為它依賴 `window['viewuiplus/locale'].default`。

### 7.2 深入閱讀路線

如果要深入理解 locale 系統，建議接著讀：

1. `src/locale/index`
   - 確認 `use` 和 `i18n` 實際做了什麼。
   - 確認 locale state 是否是 reactive。
   - 確認翻譯函式如何被保存與調用。

2. component 使用 locale 的地方
   - 搜尋元件中是否有使用 locale helper、translation function 或語系 key。
   - 觀察元件是 render 時取值，還是初始化時取值。

3. locale language files
   - 確認語系物件的資料結構。
   - 對照 `langObject.i.locale` 是否是固定慣例。

4. build scripts
   - 確認 `dist/locale/*` 如何輸出。
   - 確認語系 bundle 如何掛到 `window['viewuiplus/locale']`。

5. `types/index.d.ts`
   - 檢查 runtime 行為和 TypeScript 宣告之間的落差。
   - 決定是否需要在自己的筆記中補一份更精確的型別 contract。

### 7.3 可以暫時跳過的部分

如果你目前的目標是理解 `04-plugin-system/`，可以先暫時跳過：

- 每個元件內部如何顯示翻譯文字。
- 每個語系包的完整 key 列表。
- build release 的 Rollup / Vite 設定細節。
- i18n adapter 與第三方 i18n 套件的整合細節。

這些內容雖然重要，但它們已經超出 plugin install contract 的範圍。先把 `src/index.js` 的接線關係讀懂，後續再拆到 locale internals 與 build release 會更清楚。

---

## 8. 常見誤區

| 誤區 | 為什麼容易誤解 | 正確理解 |
| --- | --- | --- |
| 以為 `src/index.js` 實作了完整 i18n 系統 | 因為 locale 相關 API 都在 `src/index.js` 暴露 | `src/index.js` 主要是 plugin layer wiring，真正 locale 邏輯要看 `src/locale/index` |
| 以為 `locale` 和 `i18n` 是同一件事 | 兩者都和語系顯示有關，而且常一起出現在 options | `locale` 偏向語系資料，`i18n` 偏向翻譯 adapter 或函式入口 |
| 以為 `lang(code)` 會自動載入語系包 | API 名稱看起來像語系切換器 | `lang(code)` 依賴已存在的 `window['viewuiplus/locale'].default`，它不是 bundle loader |
| 以為 `lang(code)` 找不到語系一定只會印 console | 原始碼中有 `console.log` 訊息 | 如果 `window['viewuiplus/locale']` 根本不存在，可能在讀取 `.default` 時就失敗 |
| 以為 TypeScript 的 `any` 代表沒有 contract | `locale?: any` 和 `i18n?: any` 看起來很寬鬆 | runtime 仍然有 contract，只是型別沒有精確描述，需要從實作與語系包回推 |
| 以為 named export 的 `locale()` 一定能完整動態切換語系 | named API 可以被任意時機呼叫 | 是否能動態更新畫面，取決於 locale state 與 component 使用方式，需要後續確認 |

---

## 9. 本章總結

本篇筆記的核心是理解 `View UI Plus` 在 plugin layer 中如何建立 locale / i18n 的 runtime contract。`src/index.js` 透過 `localeFile` 連接內部 locale module，並在 `install(app, opts)` 中處理 `opts.locale` 與 `opts.i18n`。這讓使用者可以在 `app.use(ViewUIPlus, options)` 階段完成語系與翻譯 adapter 的初始化。

除了 install options，View UI Plus 也透過 named exports 暴露 `locale` 與 `i18n`。這兩個 API 實際上對應到 `localeFile.use` 與 `localeFile.i18n`，代表同一組內部能力同時支援 plugin 安裝設定與 package-level 直接呼叫。不過，是否能用它們完成動態語系切換，不能只靠 `src/index.js` 判斷，還需要檢查 locale module 與 component 的使用方式。

`lang(code)` 是本篇最需要注意的 API。它不是直接接收語系物件，而是依賴 `window['viewuiplus/locale'].default`。因此，它的前提是語系 bundle 必須已經被載入，且 bundle 必須按照 View UI Plus 預期的格式掛到全域物件上。從原始碼片段來看，`lang(code)` 對 global 不存在的情況沒有完整防呆，所以它更像是一個 runtime global bridge，而不是完整的語系載入器。

最後，`types/index.d.ts` 中 `locale?: any` 與 `i18n?: any` 說明目前型別宣告偏寬鬆。它允許使用者傳入這些 options，但沒有精確描述 locale object、i18n function 或 global locale bundle 的資料形狀。後續若要建立完整的 runtime type contract，就必須回到 `src/locale/`、語系包、元件使用處與 build artifact 進一步分析。

---

## 10. 自我檢查問題

1. `src/index.js` 中為什麼要引入 `localeFile`？它在 plugin layer 扮演什麼角色？
2. `opts.locale` 與 `opts.i18n` 分別會被傳給哪兩個方法？
3. 為什麼 locale setup 放在 component registration 前是合理的？
4. `app.use(ViewUIPlus, { locale, i18n })` 和 `import { locale, i18n } from 'view-ui-plus'` 的差異是什麼？
5. `lang(code)` 為什麼需要依賴 `window['viewuiplus/locale'].default`？
6. 如果頁面沒有先載入 locale bundle，`lang(code)` 可能會遇到什麼問題？
7. 為什麼不能只看 `export const locale = localeFile.use` 就斷定它一定支援完整動態語系切換？
8. `types/index.d.ts` 中 `locale?: any` 和 `i18n?: any` 的限制是什麼？
9. 如果要回推 `locale` object 的精確 shape，應該閱讀哪些原始碼或產物？
10. 為什麼 `lang(code)` 和 `dist/locale/*` 的 build artifact 有關，但不應該在本篇深入展開？

---

## 11. 後續延伸方向

這份筆記後續可以拆成以下主題繼續整理：

1. `src/locale/index` 原始碼分析
   - 分析 `localeFile.use`、`localeFile.i18n` 的內部實作。
   - 確認 locale state 的保存方式與是否具備 reactive 特性。

2. View UI Plus 元件如何讀取 locale
   - 搜尋 component 中使用 locale helper 的位置。
   - 分析元件如何取得翻譯文字與語系 key。

3. Locale language pack 結構分析
   - 整理語系物件有哪些欄位。
   - 確認 `langObject.i.locale` 的來源與用途。

4. `dist/locale/*` build artifact 分析
   - 放在 `14-build-release/`。
   - 分析語系包如何被打包、命名、輸出，並掛到 `window['viewuiplus/locale']`。

5. Runtime type contract 補強
   - 放在 `04-plugin-system/07-runtime-type-contract.md`。
   - 補上 `locale` object、`i18n` function、`langObject` 的推導型別。

6. 與 Vue I18n 整合方式比較
   - 分析 View UI Plus 的 `i18n` adapter 是否能接 Vue I18n。
   - 比較元件庫內建 locale 和應用層 i18n 的責任邊界。
