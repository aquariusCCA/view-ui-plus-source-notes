# 02-05_打包入口設定：vite.config.js

> 所屬章節：`02_根目錄與工程設定`  
> 筆記定位：理解 View UI Plus 根目錄 `vite.config.js` 在「元件庫正式 JS 打包」中的角色。  
> 適合閱讀時機：已看過 `02-01_根目錄總覽_先看懂專案邊界.md`、`02-02_根目錄資料夾責任分工.md`、`02-03_根目錄設定檔分類地圖.md`、`02-04_開發模式設定_Vite與VueCLI.md` 之後。

---

## 目錄

1. [本篇先講結論](#1-本篇先講結論)
2. [本篇要解決的核心問題](#2-本篇要解決的核心問題)
3. [`vite.config.js` 在整個工程中的位置](#3-viteconfigjs-在整個工程中的位置)
4. [從 `package.json` 看打包入口](#4-從-packagejson-看打包入口)
5. [`vite.config.js` 的整體設定骨架](#5-viteconfigjs-的整體設定骨架)
6. [`plugins: [vue()]`：讓 Vite 能處理 Vue SFC](#6-plugins-vue讓-vite-能處理-vue-sfc)
7. [`build.outDir`：JS 打包產物輸出到 `dist`](#7-buildoutdirjs-打包產物輸出到-dist)
8. [`build.lib.entry`：元件庫的正式入口是 `src/index.js`](#8-buildlibentry元件庫的正式入口是-srcindexjs)
9. [`build.lib.name`：UMD 全域變數名稱](#9-buildlibnameumd-全域變數名稱)
10. [`rollupOptions.external`：為什麼要把 Vue 排除在 bundle 外](#10-rollupoptionsexternal為什麼要把-vue-排除在-bundle-外)
11. [`rollupOptions.output`：一次產生 UMD 與 ES 兩種 JS 產物](#11-rollupoptionsoutput一次產生-umd-與-es-兩種-js-產物)
12. [輸出檔名如何對應到 `dist`](#12-輸出檔名如何對應到-dist)
13. [`globals: { vue: 'Vue' }`：UMD 場景下的外部依賴映射](#13-globals-vue-vueumd-場景下的外部依賴映射)
14. [`exports: 'named'`：為什麼和 `src/index.js` 的匯出方式有關](#14-exports-named為什麼和-srcindexjs-的匯出方式有關)
15. [`context`、`preserveEntrySignatures` 與其他 Rollup 進階選項](#15-contextpreserveentrysignatures-與其他-rollup-進階選項)
16. [`resolve.extensions`：模組解析副檔名](#16-resolveextensions模組解析副檔名)
17. [和 `vite.config.dev.js` 的差異](#17-和-viteconfigdevjs-的差異)
18. [和 `build/vite.lang.config.js`、`build/build-style.js` 的分工](#18-和-buildvitelangconfigjsbuildbuild-stylejs-的分工)
19. [從入口到產物的讀碼流程](#19-從入口到產物的讀碼流程)
20. [讀這個設定檔時真正要抓的重點](#20-讀這個設定檔時真正要抓的重點)
21. [容易誤解的地方](#21-容易誤解的地方)
22. [如果你要仿寫迷你元件庫，應該怎麼設計](#22-如果你要仿寫迷你元件庫應該怎麼設計)
23. [讀碼檢核表](#23-讀碼檢核表)
24. [本篇總結](#24-本篇總結)
25. [參考來源](#25-參考來源)

---

## 1. 本篇先講結論

View UI Plus 根目錄下的 `vite.config.js`，不是本地開發用的設定檔。

它主要負責的是：

> 把 `src/index.js` 這個元件庫總入口，打包成可發布到 `dist` 的 JavaScript library bundle。

可以先把這個檔案理解成：

```text
元件庫 JS 正式打包設定
```

而不是：

```text
本地 Demo 啟動設定
```

View UI Plus 的本地開發設定主要是：

```text
vite.config.dev.js
vue.config.js
```

View UI Plus 的正式 JS 打包設定主要是：

```text
vite.config.js
```

它在整個工程裡的位置可以簡化成：

```text
package.json
  └─ scripts.build:prod
       └─ vite build
            └─ vite.config.js
                 ├─ entry: src/index.js
                 ├─ outDir: dist
                 ├─ external: vue
                 └─ output:
                      ├─ dist/viewuiplus.min.js
                      └─ dist/viewuiplus.min.esm.js
```

這一篇要建立的核心心智模型是：

> `vite.config.js` 定義的是「元件庫入口如何被打成發布用 JS 檔案」，不是「使用者怎麼開發 View UI Plus」。

---

## 2. 本篇要解決的核心問題

讀 `vite.config.js` 時，你不應該只問：

```text
這個屬性是什麼意思？
```

你應該問的是：

```text
這個設定在元件庫發布流程裡負責哪一段？
```

本篇會幫你解決 8 個問題：

| 問題 | 本篇回答 |
|---|---|
| `vite.config.js` 是開發設定還是打包設定？ | 它是正式 JS 打包設定 |
| 哪個 npm script 會用到它？ | `build:prod` 透過 `vite build` 使用它 |
| 它的打包入口是誰？ | `src/index.js` |
| 它打包到哪裡？ | `dist` |
| 它產生哪些主要 JS 檔？ | `viewuiplus.min.js`、`viewuiplus.min.esm.js` |
| 為什麼要 external Vue？ | 避免把 Vue 打進元件庫 bundle |
| UMD 和 ES 兩種格式有什麼差異？ | UMD 偏瀏覽器全域/傳統環境，ES 偏現代模組環境 |
| 它和樣式、語言包、型別宣告有什麼關係？ | 它主要負責 JS bundle；樣式、語言包、型別有其他設定或資料夾處理 |

這一篇不會深入分析所有 build 細節，因為完整建置流程會留到：

```text
04_build_打包腳本與建置流程
```

本篇只先把 `vite.config.js` 的「入口設定」、「輸出邊界」、「角色定位」講清楚。

---

## 3. `vite.config.js` 在整個工程中的位置

View UI Plus 根目錄有兩個容易混淆的 Vite 設定檔：

```text
vite.config.dev.js
vite.config.js
```

它們的責任不同：

| 設定檔 | 主要用途 | 對應指令 | 服務階段 |
|---|---|---|---|
| `vite.config.dev.js` | 啟動 examples 開發預覽 | `npm run dev2` | 本地開發 |
| `vite.config.js` | 打包元件庫正式 JS 產物 | `npm run build:prod` | 發布前建置 |

所以讀碼時可以先分成兩條線：

```text
本地開發線：
examples Demo
  ↓
vite.config.dev.js
  ↓
瀏覽器預覽元件效果

正式打包線：
src/index.js
  ↓
vite.config.js
  ↓
dist/viewuiplus.min.js
dist/viewuiplus.min.esm.js
```

這篇筆記討論的是第二條線：

```text
正式打包線
```

---

## 4. 從 `package.json` 看打包入口

在元件庫專案中，`vite.config.js` 通常不是孤立存在的。

你要先回到 `package.json` 看它是怎麼被觸發的。

View UI Plus 的打包腳本可以簡化理解成：

```json
{
  "scripts": {
    "build": "npm run build:prod && npm run build:style && npm run build:lang",
    "build:prod": "vite build",
    "build:style": "gulp --gulpfile build/build-style.js",
    "build:lang": "vite build --config build/vite.lang.config.js"
  }
}
```

這裡有一個很重要的分工：

| 指令 | 負責內容 | 對應設定 / 腳本 |
|---|---|---|
| `build:prod` | 打包主要 JavaScript library | `vite.config.js` |
| `build:style` | 編譯 Less、壓縮 CSS、複製字型 | `build/build-style.js` |
| `build:lang` | 打包語言包 | `build/vite.lang.config.js` |
| `build` | 串接以上三件事 | `package.json` scripts |

因此，`vite.config.js` 不是完整負責整個 `dist` 的所有內容。

它比較精準的責任是：

```text
產生主要 JS library bundle
```

不是：

```text
產生 dist 裡的所有東西
```

這點很重要，因為 `dist/styles/viewuiplus.css` 並不是這個 `vite.config.js` 的主要職責，而是由 `build/build-style.js` 這條線處理。

### 4.1 `package.json` 的發布入口也要一起看

除了 `scripts`，還要看 `package.json` 裡和發布有關的欄位：

```json
{
  "main": "dist/viewuiplus.min.js",
  "typings": "types/index.d.ts",
  "files": ["dist", "src", "types"]
}
```

這代表：

| 欄位 | 意義 |
|---|---|
| `main` | Node / 打包器讀取套件主入口時，預設會指向 `dist/viewuiplus.min.js` |
| `typings` | TypeScript 型別宣告入口是 `types/index.d.ts` |
| `files` | npm 發布時主要包含 `dist`、`src`、`types` |

這裡有一個值得注意的點：

> `vite.config.js` 會產生 ES module 檔案 `viewuiplus.min.esm.js`，但目前 `package.json` 主要入口欄位是 `main`，沒有明確看到 `module` 或 `exports` 對應到這個 ESM 檔案。

所以讀碼時不要太快下結論說：

```text
打包器一定會自動吃到 viewuiplus.min.esm.js
```

更精準的說法是：

```text
專案有輸出 ESM 檔案，但是否被套件解析流程自動選用，要看 package.json 欄位、打包器規則與實際使用方式。
```

這是一個讀元件庫工程設定時很值得培養的敏感度。

---

## 5. `vite.config.js` 的整體設定骨架

`vite.config.js` 的結構可以整理成以下幾塊：

```text
vite.config.js
├─ import defineConfig
├─ import Vue plugin
├─ import path
├─ plugins
│   └─ vue()
├─ build
│   ├─ outDir
│   ├─ lib
│   │   ├─ entry
│   │   └─ name
│   └─ rollupOptions
│       ├─ context
│       ├─ preserveEntrySignatures
│       ├─ external
│       └─ output
│           ├─ UMD output
│           └─ ES output
└─ resolve
    └─ extensions
```

換成責任來看：

| 設定區塊 | 主要責任 |
|---|---|
| `plugins` | 讓 Vite 能處理 Vue 單檔元件 |
| `build.outDir` | 指定打包結果輸出位置 |
| `build.lib` | 指定元件庫模式的入口與全域名稱 |
| `rollupOptions.external` | 決定哪些依賴不要打進 bundle |
| `rollupOptions.output` | 決定輸出格式、檔名與外部依賴的全域映射 |
| `resolve.extensions` | 決定 import 時可以省略哪些副檔名 |

一句話理解：

> `build.lib` 決定「從哪裡開始打包」，`rollupOptions.output` 決定「打成什麼樣子」。

---

## 6. `plugins: [vue()]`：讓 Vite 能處理 Vue SFC

View UI Plus 是 Vue 3 元件庫。

專案裡大量元件會使用 `.vue` 單檔元件，也就是 SFC：

```text
Single File Component
```

例如：

```text
src/components/button/button.vue
src/components/modal/modal.vue
src/components/table/table.vue
```

Vite 本身需要透過 Vue plugin 才能正確處理 `.vue` 檔案。

所以 `vite.config.js` 裡會有類似這樣的設定：

```js
plugins: [vue()]
```

這個設定在打包階段的意義是：

```text
src/index.js
  ↓
引用 components
  ↓
components 裡可能引用 .vue
  ↓
@vitejs/plugin-vue 負責解析與轉換 .vue SFC
```

如果沒有這個 plugin，Vite / Rollup 在處理 `.vue` 檔案時就無法正常編譯。

### 6.1 讀碼時要注意

`plugins: [vue()]` 不是 View UI Plus 的業務邏輯。

它是工程層設定。

你讀這一段時不需要馬上深入 Vue SFC 編譯器底層，只需要知道：

> 只要元件庫源碼包含 `.vue` 檔案，Vite 打包時就需要 Vue plugin 介入。

完整的 Vue SFC 編譯細節可以留到你之後研究：

```text
Vue compiler
Vite plugin pipeline
Rollup plugin hook
```

但在本章，先掌握它的工程責任即可。

---

## 7. `build.outDir`：JS 打包產物輸出到 `dist`

`build.outDir` 指定打包後的輸出目錄。

View UI Plus 的正式 JS 打包會輸出到：

```text
dist
```

可以理解成：

```text
src/index.js
  ↓
vite build
  ↓
dist/
```

不過要特別注意：

> `dist` 是整體發布產物資料夾，但不代表 `dist` 裡所有東西都由根目錄 `vite.config.js` 產生。

`dist` 來源可以拆成三條線：

```text
JS 主 bundle
  來源：vite.config.js

CSS 樣式
  來源：build/build-style.js

語言包
  來源：build/vite.lang.config.js
```

所以你在讀 `dist` 時，不要直接把所有產物都歸因於 `vite.config.js`。

更精準的理解是：

| `dist` 內容 | 主要生成來源 |
|---|---|
| `viewuiplus.min.js` | 根目錄 `vite.config.js` |
| `viewuiplus.min.esm.js` | 根目錄 `vite.config.js` |
| `styles/viewuiplus.css` | `build/build-style.js` |
| `styles/fonts/*` | `build/build-style.js` |
| `locale/*.js` | `build/vite.lang.config.js` |

這個分工會在後續 `04_build_打包腳本與建置流程`、`05_dist_打包產物分析` 再深入。

---

## 8. `build.lib.entry`：元件庫的正式入口是 `src/index.js`

`build.lib.entry` 是這個設定檔最重要的欄位之一。

View UI Plus 的 library entry 指向：

```text
src/index.js
```

這代表正式打包時，Vite 會從 `src/index.js` 開始建立依賴圖。

可以畫成：

```text
vite.config.js
  ↓
build.lib.entry
  ↓
src/index.js
  ↓
src/components
src/directives
src/locale
package.json version
  ↓
dist bundle
```

### 8.1 為什麼元件庫需要一個總入口？

普通 Vue App 常見入口是：

```text
src/main.js
```

它通常負責：

```text
createApp(App).mount('#app')
```

但是元件庫不是 App。

元件庫的目標不是自己 mount 到頁面上，而是讓別人的 Vue App 可以安裝和使用。

所以元件庫入口通常負責：

| 責任 | 說明 |
|---|---|
| 匯出所有元件 | 讓使用者可以 `import { Button } from 'xxx'` |
| 提供 `install(app)` | 讓使用者可以 `app.use(ComponentLibrary)` |
| 註冊全域元件 | 在 `install` 裡把元件掛到 Vue app |
| 註冊自訂指令 | 例如 resize、line-clamp 等 |
| 掛載全域 API | 例如 `$Message`、`$Modal`、`$Notice` 等 |
| 提供版本資訊 | 從 `package.json` 取得版本號 |
| 提供國際化入口 | 暴露 locale / i18n 相關方法 |

View UI Plus 的 `src/index.js` 大致就是這種角色。

這代表：

> `src/index.js` 是元件庫對外公開能力的總匯出口。

因此 `vite.config.js` 選它當 entry 是合理的。

### 8.2 不要把 `src/index.js` 看成普通 App 入口

讀碼時要避免這個錯誤理解：

```text
src/index.js 是啟動頁面的入口
```

更正確的理解是：

```text
src/index.js 是打包元件庫 API 的入口
```

也就是：

```text
App 入口：負責 mount
Library 入口：負責 export / install
```

兩者的責任完全不同。

---

## 9. `build.lib.name`：UMD 全域變數名稱

`build.lib.name` 設定的是 library 在 UMD / IIFE 這類格式下的全域變數名稱。

View UI Plus 設定的是：

```text
ViewUIPlus
```

可以理解成：

```text
當使用者用 script tag 引入 UMD bundle 時，瀏覽器全域上會有一個 ViewUIPlus 物件。
```

概念上類似：

```html
<script src="vue.global.js"></script>
<script src="viewuiplus.min.js"></script>
<script>
  // 理論上可從全域取得 ViewUIPlus
</script>
```

這個名稱對 ES module 使用者比較不重要，因為 ES module 會透過 `import` 取得匯出內容。

但對 UMD bundle 很重要，因為 UMD 要在沒有標準 ESM import 的環境中暴露一個全域入口。

### 9.1 為什麼 library name 不是 package name？

`package.json` 的套件名稱是：

```text
view-ui-plus
```

但是 library global name 是：

```text
ViewUIPlus
```

這是常見做法。

| 名稱 | 用途 | 命名風格 |
|---|---|---|
| `view-ui-plus` | npm 套件名稱 | kebab-case |
| `ViewUIPlus` | UMD 全域變數名稱 | PascalCase |

所以不要把 `name` 欄位都混在一起。

你要分清楚：

```text
package.json.name 是 npm 套件名稱
build.lib.name 是 bundle 暴露到全域時的名稱
```

---

## 10. `rollupOptions.external`：為什麼要把 Vue 排除在 bundle 外

View UI Plus 的 `rollupOptions.external` 把 `vue` 設成 external。

概念是：

```js
external: ['vue']
```

意思是：

> 打包 View UI Plus 時，不要把 Vue 本身打進 View UI Plus 的 bundle 裡。

這對元件庫非常重要。

### 10.1 如果不 external Vue 可能會怎樣？

如果元件庫把 Vue 一起打進 bundle，可能會帶來幾個問題：

| 問題 | 說明 |
|---|---|
| bundle 變大 | 使用者的 App 本來就有 Vue，元件庫又包一份 Vue，體積會增加 |
| 多份 Vue 風險 | App 一份 Vue，元件庫內又一份 Vue，可能造成狀態、上下文或 runtime 行為不一致 |
| 版本管理混亂 | 使用者難以掌控 Vue 版本 |
| 不符合元件庫預期 | 元件庫通常應該依賴宿主 App 提供 Vue runtime |

所以元件庫常見策略是：

```text
Vue 是外部依賴，不打進元件庫 bundle。
```

這樣使用者的 Vue App 負責提供 Vue，View UI Plus 只提供元件庫能力。

### 10.2 external 的心智模型

可以把 external 想成：

```text
打包時遇到 import from 'vue'
不要沿著 vue 的原始碼繼續打包
而是在輸出結果裡保留「這是一個外部依賴」的關係
```

也就是：

```text
View UI Plus bundle
  ├─ 包含 View UI Plus 自己的元件邏輯
  ├─ 包含必要的內部工具邏輯
  └─ 不包含 Vue runtime
```

---

## 11. `rollupOptions.output`：一次產生 UMD 與 ES 兩種 JS 產物

View UI Plus 的 `rollupOptions.output` 是一個陣列。

這代表同一個打包入口可以輸出多種格式。

大致可整理成：

```text
output[0] → UMD
output[1] → ES module
```

對應檔案：

| 格式 | 輸出檔案 | 主要用途 |
|---|---|---|
| `umd` | `viewuiplus.min.js` | 傳統瀏覽器 script、CommonJS/AMD/全域相容場景 |
| `es` | `viewuiplus.min.esm.js` | 現代 ES module / bundler 場景 |

這是元件庫常見的多格式輸出策略。

### 11.1 UMD 是什麼？

UMD 可以粗略理解成：

```text
Universal Module Definition
```

它的目的不是追求最現代，而是追求相容。

它通常可以支援：

```text
CommonJS
AMD
Browser Global
```

所以元件庫如果想支援比較廣泛的使用方式，常會輸出 UMD 檔。

### 11.2 ES module 是什麼？

ES module 格式則更接近現代前端開發方式：

```js
import ViewUIPlus from 'view-ui-plus'
import { Button } from 'view-ui-plus'
```

ESM 對 bundler 比較友善，也比較符合現代工具鏈。

不過要注意：

> 產生 ESM 檔案，不代表 package resolver 一定會自動選中它。

還要看 `package.json` 是否提供：

```json
{
  "module": "...",
  "exports": { ... }
}
```

以目前 View UI Plus 的 `package.json` 來看，這點需要特別留意。

---

## 12. 輸出檔名如何對應到 `dist`

View UI Plus 在 Rollup output 中指定了輸出檔名。

核心對應關係如下：

| output format | entryFileNames | 實際意義 |
|---|---|---|
| `umd` | `viewuiplus.min.js` | UMD 版本主檔 |
| `es` | `viewuiplus.min.esm.js` | ESM 版本主檔 |

再加上 `build.outDir` 是 `dist`，所以最後會形成：

```text
dist/viewuiplus.min.js
dist/viewuiplus.min.esm.js
```

這也對應到 `package.json`：

```json
{
  "main": "dist/viewuiplus.min.js"
}
```

也就是說：

```text
package.json main
  ↓
dist/viewuiplus.min.js
  ↑
vite.config.js output[umd].entryFileNames
```

這種對照很重要。

讀元件庫時，不要只看 `vite.config.js`，也不要只看 `package.json`。

你要把兩者接起來：

```text
package.json 決定「外部怎麼找到套件入口」
vite.config.js 決定「這個入口檔案怎麼被產生」
```

### 12.1 chunkFileNames 與 assetFileNames

除了主入口檔名，設定中還有：

```text
chunkFileNames
assetFileNames
```

它們的用途可以簡化理解成：

| 欄位 | 負責 |
|---|---|
| `entryFileNames` | 入口 chunk 的檔名 |
| `chunkFileNames` | 非入口 chunk 的檔名 |
| `assetFileNames` | 資源檔案的檔名，例如 CSS、圖片等 |

在本篇階段，你不需要深入每種 chunk 生成規則。

你只要先知道：

> View UI Plus 對輸出檔名做了明確控制，不是完全依賴 Vite 預設檔名。

---

## 13. `globals: { vue: 'Vue' }`：UMD 場景下的外部依賴映射

前面說過，View UI Plus 把 `vue` 設成 external。

但是如果輸出格式是 UMD，瀏覽器全域環境下沒有 `import vue from 'vue'` 這種模組解析流程。

所以 Rollup 需要知道：

```text
如果程式碼裡 import 'vue'
但 vue 是 external
那在 UMD 全域環境中，應該從哪個全域變數取得 Vue？
```

答案就是：

```js
globals: {
  vue: 'Vue'
}
```

意思是：

```text
模組名稱 vue
  ↓
瀏覽器全域變數 Vue
```

也就是說，在 script tag 使用場景裡，使用者通常要先載入 Vue，讓全域上有 `Vue`，再載入 View UI Plus 的 UMD 檔。

概念上是：

```html
<script src="vue.global.js"></script>
<script src="viewuiplus.min.js"></script>
```

這樣 View UI Plus 的 UMD bundle 才能從全域 `Vue` 找到它 external 掉的 Vue runtime。

### 13.1 external 和 globals 要一起看

這兩個設定必須一起理解：

| 設定 | 問題 | 答案 |
|---|---|---|
| `external: ['vue']` | 打包時要不要把 Vue 包進來？ | 不要 |
| `globals: { vue: 'Vue' }` | UMD 執行時從哪裡拿 Vue？ | 從全域 `Vue` 拿 |

所以不要只看到 `external` 就停住。

你要接著問：

```text
既然 Vue 不被打進 bundle，那它在執行時從哪裡來？
```

這就是 `globals` 的價值。

---

## 14. `exports: 'named'`：為什麼和 `src/index.js` 的匯出方式有關

View UI Plus 的 `src/index.js` 不只 default export 一個 API 物件，也有 named exports。

例如概念上會有：

```js
export const install = ...
export const version = ...
export const locale = ...
export const i18n = ...
export * from './components'
export default API
```

這代表它的匯出形態不是單純一個 default。

所以 output 裡設定：

```text
exports: 'named'
```

可以理解成：

> 輸出 bundle 時保留具名匯出的語意。

這和元件庫對外提供 API 的方式有關。

### 14.1 元件庫常見匯出形態

元件庫通常會同時支援兩種使用方式：

```js
import ViewUIPlus from 'view-ui-plus'
app.use(ViewUIPlus)
```

以及：

```js
import { Button, Modal } from 'view-ui-plus'
```

第一種偏「整包安裝」。

第二種偏「按需引入 / 具名引用」。

所以 `src/index.js` 作為元件庫入口，通常會同時承擔：

```text
default export：整個元件庫 API
named export：個別元件或工具能力
```

`exports: 'named'` 就是和這種匯出策略相關的設定。

---

## 15. `context`、`preserveEntrySignatures` 與其他 Rollup 進階選項

`rollupOptions` 裡還有一些比較進階的設定，例如：

```text
context: 'globalThis'
preserveEntrySignatures: 'strict'
namespaceToStringTag: true
inlineDynamicImports: false
manualChunks: undefined
```

這些設定在初學階段不需要一次全部鑽到底。

你可以先用以下方式理解：

| 設定 | 初步理解 |
|---|---|
| `context: 'globalThis'` | 影響模組頂層 `this` 的上下文處理，讓打包後在不同環境中更穩定 |
| `preserveEntrySignatures: 'strict'` | 讓入口模組的匯出簽名更嚴格地被保留 |
| `namespaceToStringTag: true` | 讓 namespace object 有更明確的 `toStringTag` 行為 |
| `inlineDynamicImports: false` | 不強制把動態 import 全部 inline 進同一檔 |
| `manualChunks: undefined` | 不自訂手動分包規則 |

### 15.1 初次讀碼的優先級

第一次讀這個檔案，不建議你把時間花在這些進階選項上。

優先順序應該是：

```text
第一優先：entry 是誰
第二優先：output 到哪裡
第三優先：輸出哪些格式
第四優先：哪些依賴 external
第五優先：進階 Rollup 選項
```

原因是：

> 你讀工程設定時，最重要的是先建立「資料流」與「產物流」，不是立刻理解每個底層 option 的所有邊界行為。

### 15.2 何時需要深入這些選項？

當你遇到以下問題時，才需要深入查 Rollup 文件：

| 情境 | 需要研究的選項 |
|---|---|
| UMD 在瀏覽器全域場景異常 | `context`、`globals`、`name` |
| named exports 警告或行為不符合預期 | `exports`、`preserveEntrySignatures` |
| 動態 import 產物不如預期 | `inlineDynamicImports`、`manualChunks` |
| bundle 拆分與檔名不如預期 | `chunkFileNames`、`manualChunks` |

如果沒有遇到這些問題，本章只需要先知道它們是 Rollup 層的細節即可。

---

## 16. `resolve.extensions`：模組解析副檔名

`resolve.extensions` 指定 import 時可以自動解析哪些副檔名。

View UI Plus 設定的副檔名包含：

```text
.mjs
.js
.ts
.jsx
.tsx
.json
.vue
```

意思是，當程式碼寫：

```js
import X from './some-module'
```

工具鏈可以嘗試解析：

```text
./some-module.mjs
./some-module.js
./some-module.ts
./some-module.jsx
./some-module.tsx
./some-module.json
./some-module.vue
```

### 16.1 為什麼元件庫會需要 `.vue`？

因為 View UI Plus 是 Vue 元件庫。

很多元件會透過 `.vue` 單檔元件實作。

所以 `.vue` 必須在解析範圍內。

### 16.2 為什麼會有 `.ts`、`.tsx`？

View UI Plus 主體源碼主要仍可看到大量 JavaScript / Vue SFC 結構，但根目錄工程設定保留 `.ts`、`.tsx` 解析能力。

這代表專案工具鏈具有一定的 TypeScript 解析彈性。

不過要注意：

> 能解析 `.ts` 不代表整個專案已經是完整 TypeScript 架構。

這也是讀老牌元件庫時常見的現象：

```text
專案可能處在歷史演進過程中
有些地方是 JS
有些地方開始支援 TS
有些地方有型別宣告
但不一定是全量 TS 重構
```

---

## 17. 和 `vite.config.dev.js` 的差異

這一點非常重要。

`vite.config.js` 和 `vite.config.dev.js` 都是 Vite 設定，但它們目的不同。

| 比較項目 | `vite.config.dev.js` | `vite.config.js` |
|---|---|---|
| 服務階段 | 本地開發 | 正式打包 |
| 對應指令 | `npm run dev2` | `npm run build:prod` |
| 入口概念 | `examples` 作為開發 root | `src/index.js` 作為 library entry |
| 目標 | 啟動 Demo、預覽元件 | 產生可發布 JS bundle |
| 產物 | dev server 服務內容 | `dist` JS 檔案 |
| 主要關注 | 開發體驗、alias、瀏覽器預覽 | library 格式、external、輸出檔名 |

可以用這張圖記：

```text
vite.config.dev.js
  ↓
讓 examples 跑起來
  ↓
開發時看元件效果

vite.config.js
  ↓
把 src/index.js 打包
  ↓
發布時提供給使用者安裝
```

### 17.1 為什麼這兩個檔案不要混著看？

如果混著看，你會很容易產生錯誤理解。

例如看到 `vite.config.dev.js` 的 `root` 指向 `examples`，你可能會誤以為：

```text
View UI Plus 的正式打包入口是 examples
```

這是錯的。

`examples` 是開發展示場。

正式 library entry 是：

```text
src/index.js
```

反過來，看到 `vite.config.js` 的 `build.lib.entry`，你也不要以為：

```text
本地開發也是從 src/index.js 直接啟動一個 App
```

這也不精準。

本地開發會透過 `examples` 建立 Demo App，再去引用元件庫原始碼。

---

## 18. 和 `build/vite.lang.config.js`、`build/build-style.js` 的分工

View UI Plus 的 `build` 指令不是只跑一次 Vite。

它串接了三段：

```text
build:prod
build:style
build:lang
```

因此你要分清楚三種產物來源。

### 18.1 `vite.config.js`：主要 JS bundle

負責：

```text
src/index.js
  ↓
dist/viewuiplus.min.js
dist/viewuiplus.min.esm.js
```

這是元件庫主要入口。

### 18.2 `build/build-style.js`：樣式產物

負責：

```text
src/styles/index.less
  ↓
Less 編譯
  ↓
autoprefixer
  ↓
cleanCSS
  ↓
dist/styles/viewuiplus.css
```

以及：

```text
src/styles/common/iconfont/fonts/*
  ↓
dist/styles/fonts/*
```

這代表 View UI Plus 的樣式打包有獨立 pipeline。

不是單純靠根目錄 `vite.config.js` 全部處理。

### 18.3 `build/vite.lang.config.js`：語言包產物

負責：

```text
src/locale/lang/*.js
  ↓
dist/locale/*.js
```

它會讀取 `src/locale/lang` 下的語言檔，建立多入口打包。

這和主要 library bundle 不同。

### 18.4 三者分工總表

| 產物類型 | 來源 | 打包工具 | 設定 / 腳本 |
|---|---|---|---|
| 主要 JS library | `src/index.js` | Vite / Rollup | `vite.config.js` |
| CSS 樣式 | `src/styles/index.less` | Gulp + Less + cleanCSS | `build/build-style.js` |
| iconfont 字型 | `src/styles/common/iconfont/fonts` | Gulp copy | `build/build-style.js` |
| 語言包 | `src/locale/lang` | Vite / Rollup | `build/vite.lang.config.js` |
| 型別宣告 | `types/index.d.ts` | 手寫 / 維護型別檔 | `types` 目錄 |

這就是為什麼 `vite.config.js` 不能被理解成「整個 build 的全部」。

它只是 build pipeline 的其中一段：

```text
主要 JS bundle 段
```

---

## 19. 從入口到產物的讀碼流程

如果你要真正讀懂 `vite.config.js`，建議不要逐行硬背設定。

你應該照這條路線讀：

```text
第一步：package.json scripts
第二步：vite.config.js
第三步：src/index.js
第四步：src/components/index.js
第五步：src/components 各元件
第六步：dist 產物
第七步：package.json main / typings / files
```

### 19.1 建議讀碼順序

#### 第一步：看 `package.json scripts`

確認：

```text
build:prod = vite build
```

這一步回答：

```text
誰觸發 vite.config.js？
```

#### 第二步：看 `vite.config.js`

確認：

```text
entry = src/index.js
outDir = dist
external = vue
outputs = umd + es
```

這一步回答：

```text
vite build 打包誰？輸出什麼？
```

#### 第三步：看 `src/index.js`

確認它做了哪些事情：

```text
export components
建立 install
註冊全域元件
註冊 directives
掛 globalProperties
匯出 locale / i18n / version
匯出 default API
```

這一步回答：

```text
元件庫對外公開了什麼？
```

#### 第四步：看 `src/components/index.js`

確認所有元件如何被集中匯出。

這一步回答：

```text
元件如何進入總入口？
```

#### 第五步：看 `dist`

確認產物是否和設定對得上：

```text
viewuiplus.min.js
viewuiplus.min.esm.js
styles/viewuiplus.css
locale/*.js
```

這一步回答：

```text
設定最後生成了什麼？
```

#### 第六步：回頭看 `package.json`

確認發布欄位：

```text
main
typings
files
```

這一步回答：

```text
使用者安裝套件後，會拿到哪些入口？
```

### 19.2 完整流程圖

```text
npm run build
  ↓
npm run build:prod
  ↓
vite build
  ↓
讀取根目錄 vite.config.js
  ↓
@vitejs/plugin-vue 處理 .vue
  ↓
從 src/index.js 建立依賴圖
  ↓
把 vue 視為 external
  ↓
Rollup 產生 UMD 與 ES output
  ↓
dist/viewuiplus.min.js
dist/viewuiplus.min.esm.js
```

再接另外兩條：

```text
npm run build:style
  ↓
build/build-style.js
  ↓
dist/styles/viewuiplus.css
```

```text
npm run build:lang
  ↓
build/vite.lang.config.js
  ↓
dist/locale/*.js
```

---

## 20. 讀這個設定檔時真正要抓的重點

第一次讀 `vite.config.js`，你真正要抓的不是每個 option 的英文翻譯，而是以下 6 個結論。

### 20.1 它是 library mode，不是 app mode

普通 Vite App 的 build 通常是：

```text
index.html
  ↓
src/main.js
  ↓
dist assets
```

元件庫 build 則是：

```text
src/index.js
  ↓
library bundle
```

所以這裡的 `build.lib.entry` 很關鍵。

它明確告訴你：

```text
這是一個 library build
```

### 20.2 它用 `src/index.js` 當對外 API 總入口

`src/index.js` 是整個元件庫的 API 門面。

所以你後續讀：

```text
06_src_入口與插件機制
07_元件註冊機制
08_全域配置與globalProperties
```

都會回到這個入口。

### 20.3 它同時輸出 UMD 和 ES

這代表 View UI Plus 想同時覆蓋：

```text
傳統使用方式
現代模組使用方式
```

不過 package metadata 是否完整指向 ESM，仍要另外檢查。

### 20.4 它 external Vue

這是元件庫打包的基本功。

元件庫通常不應該把宿主框架完整包進自己的 bundle。

### 20.5 它只負責主要 JS bundle，不負責所有發布內容

不要把：

```text
JS
CSS
locale
types
```

全部塞進 `vite.config.js` 來理解。

本專案的分工是：

```text
JS → vite.config.js
CSS → build/build-style.js
locale → build/vite.lang.config.js
types → types 目錄
```

### 20.6 它反映出元件庫工程不是單一入口思維

元件庫工程通常至少有多種入口：

| 入口類型 | View UI Plus 對應 |
|---|---|
| 開發預覽入口 | `examples` |
| 正式 JS 打包入口 | `src/index.js` |
| 樣式入口 | `src/styles/index.less` |
| 語言包入口 | `src/locale/lang/*.js` |
| 型別入口 | `types/index.d.ts` |

這種「多入口、多產物」思維，是讀元件庫專案非常重要的能力。

---

## 21. 容易誤解的地方

### 21.1 誤解一：`vite.config.js` 是本地開發設定

錯。

本地 Vite 開發模式使用的是：

```text
vite.config.dev.js
```

根目錄 `vite.config.js` 主要服務：

```text
vite build
```

也就是正式打包。

---

### 21.2 誤解二：`src/index.js` 是普通 Vue App 入口

錯。

它不是用來：

```js
createApp(App).mount('#app')
```

而是用來：

```text
export 元件
提供 install
掛全域 API
提供 library default export
```

它是 library entry，不是 app entry。

---

### 21.3 誤解三：`dist` 裡所有東西都是 `vite.config.js` 生成的

不精準。

更正確是：

```text
主要 JS bundle：vite.config.js
CSS：build/build-style.js
locale：build/vite.lang.config.js
```

---

### 21.4 誤解四：有 ESM 檔案就代表套件解析一定會自動用它

不一定。

是否自動使用 ESM，還要看：

```text
package.json module
package.json exports
bundler resolution rules
使用者 import 寫法
```

目前 `package.json` 明確可見的是：

```text
main → dist/viewuiplus.min.js
typings → types/index.d.ts
```

所以你不能只看 `dist/viewuiplus.min.esm.js` 存在，就推論套件一定會自動以它作為 module entry。

---

### 21.5 誤解五：external Vue 代表使用者不需要 Vue

錯。

external 的意思是：

```text
View UI Plus bundle 不包含 Vue
```

不是：

```text
View UI Plus 不需要 Vue
```

使用 View UI Plus 的宿主專案仍然需要 Vue。

---

### 21.6 誤解六：設定中有 `.ts` 就代表專案是完整 TS 元件庫

不一定。

`resolve.extensions` 支援 `.ts`、`.tsx`，只能說明工具鏈可以解析這些副檔名。

不能直接推論：

```text
整個專案都用 TypeScript 實作
```

是否完整 TS 化，要看 `src` 實際程式碼與 `types` 維護方式。

---

### 21.7 誤解七：`target: 'es2015'` 一定有效

這點要小心。

View UI Plus 的根目錄 `vite.config.js` 裡可以看到 `target: 'es2015'` 這類設定意圖。

但在 Vite 官方設定中，常見的 build target 是：

```js
build: {
  target: 'es2015'
}
```

也就是放在 `build.target`。

所以你讀這個專案時可以先理解成：

```text
作者希望打包目標接近 es2015
```

但如果你要修改或仿寫，建議回到對應 Vite 版本文件確認正確位置。

在你自己的新專案裡，更建議寫成：

```js
export default defineConfig({
  build: {
    target: 'es2015'
  }
})
```

這是讀開源專案時很重要的態度：

> 看到設定，不只要知道作者意圖，也要確認它在當前工具版本中是否真的是有效設定。

---

## 22. 如果你要仿寫迷你元件庫，應該怎麼設計

如果你之後要做：

```text
37_迷你元件庫實作
```

可以借鑑 View UI Plus 的打包思路，但不需要一開始完全照抄。

### 22.1 最小可行版本

你的迷你元件庫可以先做成：

```text
my-ui/
├─ src/
│  ├─ index.ts
│  └─ components/
│     ├─ Button.vue
│     └─ Modal.vue
├─ examples/
│  └─ main.ts
├─ vite.config.ts
├─ vite.config.dev.ts
├─ package.json
└─ types/
```

正式打包設定可以先簡化成：

```ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'node:path'

export default defineConfig({
  plugins: [vue()],
  build: {
    target: 'es2015',
    outDir: 'dist',
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      name: 'MyUI',
      formats: ['es', 'umd'],
      fileName: (format) => format === 'es' ? 'my-ui.es.js' : 'my-ui.umd.js'
    },
    rollupOptions: {
      external: ['vue'],
      output: {
        globals: {
          vue: 'Vue'
        }
      }
    }
  }
})
```

這個版本比 View UI Plus 簡單，但核心觀念一致：

```text
entry 指向元件庫總入口
external 排除 Vue
輸出 ES / UMD
package.json 指向 dist 產物
```

### 22.2 package.json 應該補齊現代欄位

如果是你自己的新元件庫，我會建議比 View UI Plus 更明確地寫：

```json
{
  "name": "my-ui",
  "main": "./dist/my-ui.umd.js",
  "module": "./dist/my-ui.es.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/my-ui.es.js",
      "require": "./dist/my-ui.umd.js",
      "types": "./dist/index.d.ts"
    },
    "./style.css": "./dist/style.css"
  },
  "peerDependencies": {
    "vue": "^3.0.0"
  },
  "files": [
    "dist"
  ]
}
```

這樣好處是：

| 欄位 | 好處 |
|---|---|
| `main` | 給 CommonJS / 傳統解析入口 |
| `module` | 給 bundler ESM 入口 |
| `exports` | 明確控制可被 import 的路徑 |
| `types` | 指向型別宣告 |
| `peerDependencies.vue` | 明確表示 Vue 是宿主專案要提供的依賴 |
| `files` | 控制 npm 發布內容 |

### 22.3 不一定要照抄 View UI Plus 的歷史包袱

View UI Plus 是成熟且有歷史演進的元件庫。

它同時有：

```text
Vue CLI
Vite
gulp
JavaScript
TypeScript declarations
舊式 npm metadata
多種打包線
```

如果你是新做一個迷你元件庫，不需要一開始就全部複製。

你可以先抓它的核心工程思想：

```text
開發預覽入口和正式打包入口分離
JS、CSS、型別、語言包有明確產物邊界
Vue external 掉
src/index 作為對外 API 門面
```

這些才是最值得學的。

---

## 23. 讀碼檢核表

讀完本篇後，你應該可以勾選以下項目。

### 23.1 基礎理解

- [ ] 我知道 `vite.config.js` 是正式打包設定，不是本地開發設定。
- [ ] 我知道 `vite.config.dev.js` 才是 Vite 本地開發設定。
- [ ] 我知道 `npm run build:prod` 會執行 `vite build`。
- [ ] 我知道 `vite build` 預設會讀根目錄 `vite.config.js`。
- [ ] 我知道 `build` 腳本還會額外跑 `build:style` 和 `build:lang`。

### 23.2 入口與產物

- [ ] 我知道正式 JS 打包入口是 `src/index.js`。
- [ ] 我知道輸出目錄是 `dist`。
- [ ] 我知道主要 JS 產物有 `viewuiplus.min.js`。
- [ ] 我知道主要 JS 產物有 `viewuiplus.min.esm.js`。
- [ ] 我知道 `package.json main` 指向 `dist/viewuiplus.min.js`。

### 23.3 library mode 理解

- [ ] 我知道 `build.lib.entry` 是元件庫模式的入口。
- [ ] 我知道 `build.lib.name` 是 UMD 全域變數名稱。
- [ ] 我知道元件庫入口不同於 Vue App 入口。
- [ ] 我知道 `src/index.js` 主要負責 export、install、globalProperties、directives 等能力。

### 23.4 external 與 output

- [ ] 我知道為什麼 `vue` 要被設為 external。
- [ ] 我知道 external 不代表不需要 Vue。
- [ ] 我知道 `globals: { vue: 'Vue' }` 是給 UMD 全域場景使用。
- [ ] 我知道 output 陣列分別產生 UMD 和 ES 兩種格式。
- [ ] 我知道 `exports: 'named'` 和具名匯出有關。

### 23.5 工程分工

- [ ] 我知道 `vite.config.js` 不負責所有 dist 內容。
- [ ] 我知道樣式由 `build/build-style.js` 處理。
- [ ] 我知道語言包由 `build/vite.lang.config.js` 處理。
- [ ] 我知道型別宣告由 `types` 目錄提供。
- [ ] 我知道後續章節會再深入 build 流程與 dist 產物。

### 23.6 仿寫能力

- [ ] 我能為自己的迷你元件庫設計 `build.lib.entry`。
- [ ] 我能把 Vue 設為 external。
- [ ] 我能設定 UMD 與 ES 輸出格式。
- [ ] 我能讓 `package.json` 的 `main`、`module`、`types`、`exports` 對應到打包產物。
- [ ] 我知道哪些地方可以借鑑 View UI Plus，哪些地方不需要照抄。

---

## 24. 本篇總結

這篇的核心不是背 Vite 設定，而是看懂元件庫正式打包入口。

View UI Plus 的 `vite.config.js` 可以濃縮成一句話：

> 從 `src/index.js` 出發，把 View UI Plus 打包成發布用的 UMD 與 ES JavaScript bundle，輸出到 `dist`，並把 Vue 保持為外部依賴。

整體流程是：

```text
package.json
  ↓
build:prod = vite build
  ↓
vite.config.js
  ↓
build.lib.entry = src/index.js
  ↓
rollupOptions.external = vue
  ↓
rollupOptions.output = umd + es
  ↓
dist/viewuiplus.min.js
dist/viewuiplus.min.esm.js
```

但這還不是完整 build。

完整 build 還包含：

```text
build:style → dist/styles/viewuiplus.css
build:lang  → dist/locale/*.js
types       → types/index.d.ts
```

所以你要建立的最終心智模型是：

```text
View UI Plus 的發布產物不是單一入口生成
而是 JS、CSS、locale、types 多條線一起組成
```

而 `vite.config.js` 的角色是其中最核心的一條：

```text
主要 JavaScript library bundle 打包線
```

讀懂這一篇後，你後面看：

```text
04_build_打包腳本與建置流程
05_dist_打包產物分析
06_src_入口與插件機制
07_元件註冊機制
08_全域配置與globalProperties
```

會更容易把工程設定和源碼設計接起來。

---

## 25. 參考來源

> 以下來源為撰寫本筆記時對照的 View UI Plus 官方 GitHub 原始碼與相關官方文件。

1. View UI Plus GitHub Repository  
   `https://github.com/view-design/ViewUIPlus`

2. View UI Plus `package.json`  
   `https://raw.githubusercontent.com/view-design/ViewUIPlus/master/package.json`

3. View UI Plus `vite.config.js`  
   `https://raw.githubusercontent.com/view-design/ViewUIPlus/master/vite.config.js`

4. View UI Plus `vite.config.dev.js`  
   `https://raw.githubusercontent.com/view-design/ViewUIPlus/master/vite.config.dev.js`

5. View UI Plus `src/index.js`  
   `https://raw.githubusercontent.com/view-design/ViewUIPlus/master/src/index.js`

6. View UI Plus `build/vite.lang.config.js`  
   `https://raw.githubusercontent.com/view-design/ViewUIPlus/master/build/vite.lang.config.js`

7. View UI Plus `build/build-style.js`  
   `https://raw.githubusercontent.com/view-design/ViewUIPlus/master/build/build-style.js`

8. Vite v2 官方文件：Configuring Vite / Library Mode  
   `https://v2.vitejs.dev/config/`

9. Vite 官方文件：Build Options  
   `https://vite.dev/config/build-options`

10. Rollup 官方文件：Configuration Options  
    `https://rollupjs.org/configuration-options/`
