# 02-06_TypeScript設定：tsconfig.json

> 所屬章節：`02_根目錄與工程設定`  
> 專案：View UI Plus  
> 筆記定位：理解 View UI Plus 根目錄 `tsconfig.json` 在「型別宣告、模組解析、編輯器支援」中的角色。  
> 適合閱讀時機：已看過 `02-01_根目錄總覽_先看懂專案邊界.md`、`02-02_根目錄資料夾責任分工.md`、`02-03_根目錄設定檔分類地圖.md`、`02-04_開發模式設定_Vite與VueCLI.md`、`02-05_打包入口設定_vite-config.md` 之後。

---

## 目錄

1. [本篇先講結論](#1-本篇先講結論)
2. [本篇要解決的核心問題](#2-本篇要解決的核心問題)
3. [`tsconfig.json` 在整個工程中的位置](#3-tsconfigjson-在整個工程中的位置)
4. [View UI Plus 目前的 `tsconfig.json` 快照](#4-view-ui-plus-目前的-tsconfigjson-快照)
5. [一句話看懂這份 `tsconfig.json`](#5-一句話看懂這份-tsconfigjson)
6. [TypeScript 在 View UI Plus 的實際角色](#6-typescript-在-view-ui-plus-的實際角色)
7. [`compilerOptions` 分類地圖](#7-compileroptions-分類地圖)
8. [`target` 與 `module`：保留現代語法給打包器處理](#8-target-與-module保留現代語法給打包器處理)
9. [`strict: true`：型別宣告要嚴格，但不是整個 `src` 都被 TS 檢查](#9-strict-true型別宣告要嚴格但不是整個-src-都被-ts-檢查)
10. [`jsx: preserve`：保留 JSX 給後續工具處理](#10-jsx-preserve保留-jsx-給後續工具處理)
11. [`moduleResolution: node`：用 Node 方式解析模組](#11-moduleresolution-node用-node-方式解析模組)
12. [`esModuleInterop` 與 `allowSyntheticDefaultImports`](#12-esmoduleinterop-與-allowsyntheticdefaultimports)
13. [`experimentalDecorators`：保留裝飾器語法支援](#13-experimentaldecorators保留裝飾器語法支援)
14. [`importHelpers`：減少 helper 重複，但在本專案中不是主線](#14-importhelpers減少-helper-重複但在本專案中不是主線)
15. [`sourceMap`：TS 編譯設定與 Vite 打包 sourcemap 要分開看](#15-sourcemapts-編譯設定與-vite-打包-sourcemap-要分開看)
16. [`baseUrl` 與 `paths`：讓 TypeScript 認得 `@/*`](#16-baseurl-與-paths讓-typescript-認得-)
17. [`lib`：告訴 TypeScript 可以使用哪些環境 API](#17-lib告訴-typescript-可以使用哪些環境-api)
18. [`include`：為什麼只包含 `types/*.ts`](#18-include為什麼只包含-typests)
19. [`exclude`：排除 `node_modules`](#19-exclude排除-nodemodules)
20. [`tsconfig.json` 與 `package.json` 的關係](#20-tsconfigjson-與-packagejson-的關係)
21. [`tsconfig.json` 與 `vite.config.js` 的關係](#21-tsconfigjson-與-viteconfigjs-的關係)
22. [`tsconfig.json` 與 `types/` 的關係](#22-tsconfigjson-與-types-的關係)
23. [`tsconfig.json` 與 `src/` 的關係](#23-tsconfigjson-與-src-的關係)
24. [`tsconfig.json` 與 ESLint / TSLint 的關係](#24-tsconfigjson-與-eslint--tslint-的關係)
25. [讀碼時的正確閱讀順序](#25-讀碼時的正確閱讀順序)
26. [容易誤解的地方](#26-容易誤解的地方)
27. [如果你要仿寫迷你元件庫，應該怎麼設計](#27-如果你要仿寫迷你元件庫應該怎麼設計)
28. [讀碼檢核表](#28-讀碼檢核表)
29. [本篇總結](#29-本篇總結)
30. [參考來源](#30-參考來源)

---

## 1. 本篇先講結論

View UI Plus 的 `tsconfig.json` 不是一份「完整 TypeScript 化的 Vue 元件庫設定」。

它更像是：

> 一份用來支撐 `types/` 型別宣告、IDE 模組解析、少量 TypeScript 語法相容性的工程設定。

這點很重要。

因為你可能會直覺以為：

```text
專案有 tsconfig.json
  ↓
所以 src/components 裡的元件應該都被 TypeScript 嚴格檢查
```

但 View UI Plus 目前不是這樣。

根據目前設定：

```json
{
  "include": [
    "types/*.ts"
  ],
  "exclude": ["node_modules"]
}
```

也就是說，這份 `tsconfig.json` 的 TypeScript program 範圍主要集中在：

```text
types/*.ts
```

而 View UI Plus 的主要元件庫入口目前是：

```text
src/index.js
```

正式 JS 打包也主要由根目錄 `vite.config.js` 指向 `src/index.js`。

所以本篇要建立的核心觀念是：

> View UI Plus 的 TypeScript 設定，重點不是控制整個元件源碼，而是支撐元件庫對外型別宣告與開發工具解析。

你讀這份設定時，不要把它看成：

```text
整個專案的 TypeScript 嚴格編譯設定
```

更應該看成：

```text
元件庫型別宣告與工程解析設定
```

---

## 2. 本篇要解決的核心問題

讀 `tsconfig.json` 時，你至少要解決 8 個問題：

| 問題 | 為什麼重要 |
|---|---|
| 這份 `tsconfig.json` 控制哪些檔案？ | 決定 TypeScript 實際檢查範圍 |
| 它有沒有檢查 `src/components`？ | 避免誤以為整個元件庫都是 TS 嚴格型別 |
| `types/` 和 `package.json` 的 `typings` 有什麼關係？ | 影響 npm 使用者能否取得型別提示 |
| `baseUrl` / `paths` 和 Vite alias 有什麼差異？ | 避免以為 TS alias 會自動影響打包 |
| `strict: true` 實際嚴格到哪裡？ | 嚴格只對 TypeScript program 內的檔案有意義 |
| `sourceMap` 和 Vite build 的 sourcemap 是否同一件事？ | 避免混淆 TS 編譯設定與打包設定 |
| `importHelpers` 是否代表專案一定使用 `tslib`？ | 避免看設定看過頭 |
| 如果自己仿寫元件庫，要照抄嗎？ | View UI Plus 有歷史包袱，仿寫時要取捨 |

本篇不會逐字翻譯 TypeScript 官方文件，而是會站在「讀 View UI Plus 原始碼」的角度說明：

> 這些設定在這個專案裡真正代表什麼。

---

## 3. `tsconfig.json` 在整個工程中的位置

你可以先把 `tsconfig.json` 放到整個工程地圖裡看：

```text
ViewUIPlus/
├── package.json              # npm 腳本、依賴、發布入口、typings
├── tsconfig.json             # TypeScript 編譯與模組解析設定
├── vite.config.js            # 元件庫 JS 正式打包設定
├── vite.config.dev.js        # Vite 本地開發設定
├── vue.config.js             # Vue CLI 本地開發設定
├── tslint.json               # 舊式 TS lint 規則
├── types/                    # 對外型別宣告
└── src/                      # 元件庫主要源碼
```

這份 `tsconfig.json` 的位置在根目錄，代表它是整個 repo 的 TypeScript 設定入口。

但是「放在根目錄」不代表「所有檔案都被 TypeScript 檢查」。

真正決定檢查範圍的是：

```json
"include": [
  "types/*.ts"
]
```

所以你讀 `tsconfig.json` 時要有兩層判斷：

```text
第一層：這是根目錄 TypeScript 設定入口
第二層：它實際 include 的檔案範圍很窄
```

這正是這份設定最容易被誤解的地方。

---

## 4. View UI Plus 目前的 `tsconfig.json` 快照

目前 View UI Plus 根目錄的 `tsconfig.json` 大致如下：

```jsonc
{
  "compilerOptions": {
    "target": "esnext",
    "module": "esnext",
    "strict": true,
    "jsx": "preserve",
    "importHelpers": true,
    "moduleResolution": "node",
    "experimentalDecorators": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "sourceMap": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    },
    "lib": ["esnext", "dom", "dom.iterable", "scripthost"]
  },
  "include": [
    "types/*.ts"
  ],
  "exclude": ["node_modules"]
}
```

> 補充：實際檔案中 `include` 陣列有尾逗號，`tsconfig.json` 屬於 TypeScript 可解析的設定格式，不要用「嚴格 JSON」角度過度解讀這個細節。

這份設定可以拆成三塊：

| 區塊 | 責任 |
|---|---|
| `compilerOptions` | TypeScript 編譯器行為、語法目標、模組解析、型別環境 |
| `include` | 指定哪些檔案進入 TypeScript program |
| `exclude` | 排除不需要檢查的資料夾 |

讀 `tsconfig.json` 時，最重要的不是先背每個 option，而是先問：

> 這些設定到底套用在哪些檔案上？

在 View UI Plus 這裡，答案主要是：

```text
types/*.d.ts
```

因為 `types` 目錄底下大量檔案都是 `.d.ts`，例如：

```text
types/index.d.ts
types/button.d.ts
types/input.d.ts
types/table.d.ts
types/viewuiplus.components.d.ts
...
```

---

## 5. 一句話看懂這份 `tsconfig.json`

這份設定可以濃縮成一句話：

> 用比較現代、嚴格的 TypeScript 編譯選項，支撐 `types/` 目錄中的型別宣告，並讓工具能用 `@/*` 解析到 `src/*`。

拆開來看就是：

```text
target/module = esnext
  ↓
保留現代 JS / ESM 語法概念

strict = true
  ↓
型別宣告需要比較嚴格

baseUrl + paths
  ↓
讓 TypeScript 認得 @/* 對應 src/*

include = types/*.ts
  ↓
實際檢查範圍主要是 types 目錄
```

它不是：

```text
把 src/components 全部納入 TS 嚴格檢查
```

也不是：

```text
負責正式打包 View UI Plus 的 JS bundle
```

正式打包主線應該看：

```text
package.json
  └── scripts.build:prod
        └── vite build
              └── vite.config.js
                    └── entry: src/index.js
```

而型別宣告主線應該看：

```text
package.json
  └── typings: types/index.d.ts
        └── types/index.d.ts
              └── export * from './viewuiplus.components'
```

---

## 6. TypeScript 在 View UI Plus 的實際角色

很多開源專案會經歷一個演進過程：

```text
JavaScript 專案
  ↓
開始加入 TypeScript 型別宣告
  ↓
部分工具設定支援 TypeScript
  ↓
逐步遷移核心源碼到 TypeScript
  ↓
完整 TypeScript 專案
```

View UI Plus 目前比較接近中間狀態：

```text
主要源碼仍大量是 JS / Vue SFC
  +
對外提供 TypeScript declaration files
  +
工程設定保留 TypeScript 支援
```

你可以把 TypeScript 在本專案中的角色分成三種：

| 角色 | 在 View UI Plus 中的狀態 | 讀碼意義 |
|---|---|---|
| 寫元件源碼 | 不是主線 | 不要期待所有元件都有完整 TS 型別實作 |
| 對外提供型別 | 是重點 | npm 使用者 import 元件時要有型別提示 |
| 工具解析設定 | 是輔助 | 讓 IDE / TypeScript server 看得懂 alias、ESM、DOM API |

所以你讀這一章時要把焦點放在：

```text
View UI Plus 如何讓「使用者」取得型別提示？
```

而不是：

```text
View UI Plus 如何用 TypeScript 寫完所有元件？
```

後者不是這份 `tsconfig.json` 目前呈現出來的主要重點。

---

## 7. `compilerOptions` 分類地圖

`compilerOptions` 可以先分成 6 類：

| 類別 | 設定 | 一句話定位 |
|---|---|---|
| 語法輸出目標 | `target`、`module` | 決定 TS 轉 JS 時保留到什麼語法層級 |
| 型別嚴格度 | `strict` | 開啟嚴格型別檢查模式 |
| 語法相容 | `jsx`、`experimentalDecorators` | 支援 JSX / decorator 等語法情境 |
| 模組解析 | `moduleResolution`、`baseUrl`、`paths` | 決定 import 路徑如何被解析 |
| 模組互通 | `esModuleInterop`、`allowSyntheticDefaultImports` | 改善 ESM 與 CommonJS default import 的相容性 |
| 輔助輸出與環境 | `importHelpers`、`sourceMap`、`lib` | 控制 helper、source map、可用 API 環境 |

更精簡的讀法：

```text
compilerOptions
├── 我想輸出 / 理解哪種 JS？
│   ├── target
│   └── module
│
├── 我要多嚴格？
│   └── strict
│
├── import 怎麼找檔案？
│   ├── moduleResolution
│   ├── baseUrl
│   └── paths
│
├── ESM / CJS 怎麼相容？
│   ├── esModuleInterop
│   └── allowSyntheticDefaultImports
│
└── 其他語法與環境支援
    ├── jsx
    ├── experimentalDecorators
    ├── importHelpers
    ├── sourceMap
    └── lib
```

這樣分類後，你就不會被一長串 option 淹沒。

---

## 8. `target` 與 `module`：保留現代語法給打包器處理

View UI Plus 設定：

```json
{
  "target": "esnext",
  "module": "esnext"
}
```

### 8.1 `target` 是什麼？

`target` 主要決定 TypeScript 轉換 JavaScript 時，要把語法降到哪個版本。

例如：

```text
target: es5
  ↓
比較偏向舊瀏覽器相容

target: esnext
  ↓
盡量保留最新 ECMAScript 語法
```

View UI Plus 使用：

```json
"target": "esnext"
```

代表它不打算在 TypeScript 這層做大量降級轉譯。

### 8.2 `module` 是什麼？

`module` 決定 TypeScript 輸出模組格式。

View UI Plus 使用：

```json
"module": "esnext"
```

代表它希望保留 ESM import / export 形式。

### 8.3 在本專案中的讀碼意義

這裡要特別注意：

View UI Plus 正式 JS 打包不是靠 `tsc` 直接輸出，而是透過 Vite / Rollup 打包。

根目錄 `vite.config.js` 才是正式 library bundle 的主要設定入口：

```text
vite.config.js
  └── build.lib.entry = src/index.js
```

所以這裡的 `target: esnext`、`module: esnext` 更像是：

```text
TypeScript 工具層的現代語法設定
```

而不是：

```text
最終 npm JS 產物的唯一輸出規則
```

最終打包格式仍要看 `vite.config.js` 的 Rollup output：

```text
UMD: dist/viewuiplus.min.js
ESM: dist/viewuiplus.min.esm.js
```

### 8.4 你讀碼時要記住

| 設定 | 不要誤解成 | 正確理解 |
|---|---|---|
| `target: esnext` | npm 產物一定完全不降級 | TS 層級保留現代語法，正式 bundle 仍看 Vite / Rollup |
| `module: esnext` | 專案只輸出 ESM | TS 層保留 ESM，正式打包同時輸出 UMD / ES |

---

## 9. `strict: true`：型別宣告要嚴格，但不是整個 `src` 都被 TS 檢查

View UI Plus 設定：

```json
{
  "strict": true
}
```

`strict: true` 是 TypeScript 中很重要的設定。

它會開啟一組嚴格型別檢查規則，例如：

```text
strictNullChecks
strictFunctionTypes
strictBindCallApply
strictPropertyInitialization
noImplicitAny
...
```

你可以把它理解為：

```text
不要讓 TypeScript 太寬鬆
```

但在 View UI Plus 這裡，要特別加上一個限制：

> `strict: true` 只對被 `include` 納入 TypeScript program 的檔案有直接意義。

目前 `include` 是：

```json
"include": [
  "types/*.ts"
]
```

所以這個嚴格檢查主要影響：

```text
types/*.d.ts
```

而不是整個：

```text
src/components/**/*.vue
src/components/**/*.js
```

### 9.1 這對讀碼有什麼影響？

如果你在 `src/components` 裡看到大量 JavaScript 寫法，不要覺得奇怪。

因為目前這份 `tsconfig.json` 並沒有把 `src` 設為主檢查範圍。

更精準地說：

```text
View UI Plus 對外型別宣告希望嚴格
但內部元件源碼不一定全面 TypeScript 化
```

這是很多 UI 元件庫從 JS 過渡到 TS 的常見狀態。

### 9.2 如果你自己仿寫，應該怎麼做？

如果你要做現代迷你元件庫，我不建議完全照抄這個範圍。

更建議：

```jsonc
{
  "include": [
    "src/**/*.ts",
    "src/**/*.tsx",
    "src/**/*.vue",
    "types/**/*.d.ts"
  ]
}
```

並搭配：

```text
vue-tsc --noEmit
```

這樣才能真正檢查 Vue SFC 與 TS 源碼。

View UI Plus 的配置適合讀歷史專案，但你仿寫新專案時應該用更現代的方式。

---

## 10. `jsx: preserve`：保留 JSX 給後續工具處理

View UI Plus 設定：

```json
{
  "jsx": "preserve"
}
```

`jsx: preserve` 的意思是：

> TypeScript 不主動把 JSX 轉成 JS，而是保留 JSX，交給後續工具處理。

在元件庫或 Vue 專案中，這種設定常見於：

```text
TSX / JSX 可能由 Babel、Vue plugin、Vite、webpack loader 等工具處理
```

在 View UI Plus 中，這個設定比較像是相容性設定。

因為目前本專案的主要打包入口是 JS：

```text
src/index.js
```

而且 `tsconfig.json` 的 include 只包含：

```text
types/*.ts
```

所以你不要把 `jsx: preserve` 解讀成：

```text
View UI Plus 的核心元件大量使用 TSX
```

比較準確的理解是：

```text
如果 TypeScript program 中遇到 JSX，先保留給後續工具處理
```

---

## 11. `moduleResolution: node`：用 Node 方式解析模組

View UI Plus 設定：

```json
{
  "moduleResolution": "node"
}
```

`moduleResolution` 決定 TypeScript 遇到 import 時，如何尋找目標模組。

例如：

```ts
import type { App } from 'vue'
import Button from './button'
```

TypeScript 需要知道：

```text
'vue' 去哪裡找？
'./button' 要怎麼補副檔名？
```

`node` 模式代表 TypeScript 會用接近 Node.js / bundler 常見的方式找模組，例如：

```text
node_modules/vue
./button.ts
./button.d.ts
./button/index.d.ts
...
```

### 11.1 在本專案中的意義

View UI Plus 的型別入口 `types/index.d.ts` 有：

```ts
import type { App } from 'vue'
export * from './viewuiplus.components'
```

這類 declaration file 需要 TypeScript 能解析：

```text
vue
./viewuiplus.components
```

所以 `moduleResolution: node` 對型別宣告解析是合理的。

### 11.2 現代專案補充

如果你今天用的是比較新的 Vite + TypeScript 專案，可能會看到：

```json
"moduleResolution": "bundler"
```

但 View UI Plus 目前使用的 TypeScript 版本較舊，設定是：

```json
"moduleResolution": "node"
```

讀這種專案時，不要拿最新模板直接批判舊專案；你要先看它的歷史脈絡和依賴版本。

---

## 12. `esModuleInterop` 與 `allowSyntheticDefaultImports`

View UI Plus 設定：

```json
{
  "esModuleInterop": true,
  "allowSyntheticDefaultImports": true
}
```

這兩個設定都和「ES Module 與 CommonJS 的互通」有關。

### 12.1 背景問題

JavaScript 生態同時存在兩種常見模組系統：

```text
ES Module
  import dayjs from 'dayjs'
  export default xxx

CommonJS
  const dayjs = require('dayjs')
  module.exports = xxx
```

很多舊套件或工具仍然帶有 CommonJS 歷史。

當 TypeScript 遇到這些套件時，可能會碰到 default import 是否合理的問題。

### 12.2 `allowSyntheticDefaultImports`

這個設定主要影響型別檢查。

它允許你寫：

```ts
import foo from 'foo'
```

即使該模組不一定真的有標準 ESM default export。

### 12.3 `esModuleInterop`

這個設定會讓 TypeScript 在處理 CommonJS / AMD / UMD 與 ESM 互通時更符合實際生態需求。

簡化理解：

```text
讓 default import 在混合模組生態中比較不容易出問題
```

### 12.4 在 View UI Plus 中的意義

View UI Plus 依賴中有不少常見 JS 套件，例如：

```text
dayjs
numeral
popper.js
tinycolor2
lodash.throttle
...
```

它也在 `src/index.js` 中使用：

```js
import dayjs from 'dayjs'
```

所以這類互通設定可以視為：

```text
讓 TypeScript / IDE 對第三方套件 default import 更友善
```

不過你仍然要記住：

```text
這份 tsconfig 目前沒有把 src/index.js 納入 TS program
```

所以它更偏工具層與型別層支援，不代表所有 JS import 都由 TypeScript 編譯處理。

---

## 13. `experimentalDecorators`：保留裝飾器語法支援

View UI Plus 設定：

```json
{
  "experimentalDecorators": true
}
```

`experimentalDecorators` 允許 TypeScript 使用 decorator 語法，例如：

```ts
@Component
class DemoComponent {}
```

這種語法過去在 class-style Vue、Angular、某些 MobX 寫法中比較常見。

### 13.1 在本專案中的讀碼意義

在 View UI Plus 目前的工程裡，這個設定不一定是主線。

它比較像是：

```text
歷史相容性 / 工具相容性設定
```

你讀到它時，不需要立刻推論：

```text
專案核心架構一定大量使用 decorator
```

更合理的判斷順序是：

```text
先看 include 範圍
  ↓
再搜尋 TypeScript / TSX / decorator 使用情境
  ↓
最後判斷這個設定是否真的有大量實際用途
```

目前從 `include` 來看，它不是這份筆記的核心。

---

## 14. `importHelpers`：減少 helper 重複，但在本專案中不是主線

View UI Plus 設定：

```json
{
  "importHelpers": true
}
```

當 TypeScript 編譯某些語法時，可能會產生 helper function。

例如展開運算、繼承、async / await 等情境，編譯後可能需要輔助函式。

如果沒有 `importHelpers`，TypeScript 可能在每個檔案重複產生 helper。

如果有 `importHelpers`，TypeScript 會傾向從 `tslib` 引入 helper，讓輸出比較小。

簡化理解：

```text
importHelpers: true
  ↓
不要到處重複塞 helper，改成引用共用 helper
```

### 14.1 但在 View UI Plus 中要小心

View UI Plus 的 `package.json` scripts 目前沒有明確使用：

```text
tsc
```

來作為正式打包主線。

正式 JS 打包是：

```text
vite build
```

而且 `tsconfig.json` 的 include 主要是：

```text
types/*.ts
```

所以 `importHelpers` 在這裡比較像是 TypeScript 編譯選項的保留設定，不是你讀元件庫打包流程時的第一主線。

### 14.2 如果你自己加入 TS 源碼

如果你將來在自己的元件庫中大量使用 TypeScript，且開啟：

```json
"importHelpers": true
```

通常要確認有安裝：

```bash
npm install tslib
```

否則實際輸出引用 helper 時可能找不到 runtime helper。

但 View UI Plus 本篇重點不是改它，而是理解它在現有架構中的位置。

---

## 15. `sourceMap`：TS 編譯設定與 Vite 打包 sourcemap 要分開看

View UI Plus 的 `tsconfig.json` 設定：

```json
{
  "sourceMap": true
}
```

這代表如果 TypeScript 進行輸出，它會產生 source map。

但是 View UI Plus 的正式 library 打包設定在 `vite.config.js` 裡，Rollup output 明確有：

```js
sourcemap: false
```

而且 UMD 與 ES 兩種 output 都是：

```js
sourcemap: false
```

所以你要分清楚兩個層次：

| 層次 | 設定位置 | 意義 |
|---|---|---|
| TypeScript 編譯層 | `tsconfig.json` 的 `sourceMap: true` | 如果由 TS 編譯輸出，產生 sourcemap |
| Vite / Rollup 打包層 | `vite.config.js` 的 `sourcemap: false` | 正式 bundle 不輸出 sourcemap |

### 15.1 常見誤解

不要看到：

```json
"sourceMap": true
```

就直接說：

```text
View UI Plus 發布到 dist 的 JS 一定有 sourcemap
```

這是不精準的。

因為正式打包設定要看：

```text
vite.config.js
```

而不是只看：

```text
tsconfig.json
```

### 15.2 讀碼原則

遇到 source map 相關設定時，要問：

```text
誰負責輸出？
  ├── tsc？
  ├── Vite？
  ├── Rollup？
  └── webpack / Vue CLI？
```

在 View UI Plus 的正式打包主線中，答案主要是：

```text
Vite / Rollup
```

所以 `sourceMap` 在本篇只能理解為 TS 層設定，不能直接推論 npm 產物。

---

## 16. `baseUrl` 與 `paths`：讓 TypeScript 認得 `@/*`

View UI Plus 設定：

```json
{
  "baseUrl": ".",
  "paths": {
    "@/*": ["src/*"]
  }
}
```

這代表 TypeScript 遇到：

```ts
import xxx from '@/components/xxx'
```

時，可以理解成：

```text
src/components/xxx
```

### 16.1 `baseUrl` 的角色

`baseUrl` 設定為：

```json
"baseUrl": "."
```

代表路徑解析以專案根目錄為基準。

所以：

```json
"@/*": ["src/*"]
```

會被理解成：

```text
專案根目錄/src/*
```

### 16.2 `paths` 的角色

`paths` 是 TypeScript 的路徑映射。

它主要服務：

```text
TypeScript compiler
IDE / TS server
型別檢查
跳轉定義
自動補全
```

### 16.3 它不是打包 alias

這是非常重要的一點：

> `tsconfig.json` 的 `paths` 只告訴 TypeScript 如何理解 import，不會自動讓 Vite / Rollup 在 runtime 或 bundle 階段跟著改變解析規則。

也就是說，下面這兩件事要分開設定：

| 目的 | 設定位置 |
|---|---|
| 讓 TypeScript / IDE 認得 `@/*` | `tsconfig.json` 的 `paths` |
| 讓 Vite 開發伺服器認得 `@` | `vite.config.dev.js` 的 `resolve.alias` |

View UI Plus 的 `vite.config.dev.js` 有：

```js
resolve: {
  alias: {
    '@': path.resolve(__dirname, 'src')
  }
}
```

這和 `tsconfig.json` 的設定是同一個概念在不同工具中的對應：

```text
tsconfig.json
  └── TypeScript / IDE 看得懂 @

vite.config.dev.js
  └── Vite dev server 看得懂 @
```

### 16.4 和 `vite.config.js` 的差異

要注意：

根目錄 `vite.config.js` 目前主要有：

```js
resolve: {
  extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.vue']
}
```

但不像 `vite.config.dev.js` 一樣設定 `@` alias。

這代表正式打包主線如果要使用 `@` alias，理論上也要確認 Vite build 設定能解析。

目前 `src/index.js` 主要使用相對路徑：

```js
export * from './components'
import localeFile from './locale/index'
```

所以正式打包入口不一定依賴 `@` alias。

### 16.5 讀碼提醒

看到 `paths` 時，要問：

```text
這是給 TypeScript 看的？
還是給 Vite / webpack 看的？
```

在這裡答案是：

```text
給 TypeScript / IDE 看的
```

Vite 要另外看：

```text
vite.config.dev.js
vite.config.js
```

---

## 17. `lib`：告訴 TypeScript 可以使用哪些環境 API

View UI Plus 設定：

```json
{
  "lib": ["esnext", "dom", "dom.iterable", "scripthost"]
}
```

`lib` 不是引入 JS polyfill。

它的作用是：

> 告訴 TypeScript：目前程式可以使用哪些內建型別與環境 API。

### 17.1 `esnext`

代表可以使用較新的 ECMAScript 內建 API 型別。

例如：

```text
Promise
Map
Set
Array.prototype 新方法
...
```

具體支援範圍會依 TypeScript 版本而定。

### 17.2 `dom`

代表可以使用瀏覽器 DOM API 型別。

這對 Vue 元件庫很重要，因為元件常常會碰到：

```text
HTMLElement
MouseEvent
KeyboardEvent
Document
Window
ResizeObserver 類似瀏覽器 API
```

### 17.3 `dom.iterable`

讓某些 DOM 集合具有 iterable 型別支援。

例如：

```ts
for (const item of document.querySelectorAll('.item')) {
  // ...
}
```

這類 DOM collection 的迭代型別會受它影響。

### 17.4 `scripthost`

這是比較舊的腳本宿主環境型別，常見於歷史專案設定。

在現代 Vue 元件庫中通常不是核心，但保留也不奇怪。

### 17.5 讀碼提醒

不要把 `lib` 看成：

```text
實際幫你支援舊瀏覽器的 polyfill
```

它只是：

```text
型別層知道哪些全域 API 存在
```

真正的瀏覽器相容性、降級、polyfill，要看：

```text
Babel
Vite / Rollup
Vue CLI
瀏覽器目標設定
依賴套件
```

---

## 18. `include`：為什麼只包含 `types/*.ts`

View UI Plus 設定：

```json
{
  "include": [
    "types/*.ts"
  ]
}
```

這是整份 `tsconfig.json` 最關鍵的一行。

因為它決定了 TypeScript 實際會把哪些檔案納入 project。

### 18.1 `types/*.ts` 會涵蓋什麼？

`types` 目錄底下有大量 `.d.ts` 宣告檔，例如：

```text
index.d.ts
button.d.ts
input.d.ts
table.d.ts
viewuiplus.components.d.ts
...
```

`*.ts` 這種 glob 寫法可以匹配副檔名結尾為 `.ts` 的檔案，所以 `.d.ts` 也會被納入。

也就是說：

```text
types/*.ts
  ↓
主要會匹配 types 根目錄下一層的 .d.ts 型別宣告檔
```

### 18.2 它不會涵蓋什麼？

這份 include 不會主動涵蓋：

```text
src/**/*.js
src/**/*.vue
src/**/*.ts
examples/**/*.vue
build/**/*.js
test/**/*.js
```

除非這些檔案被 `types/*.d.ts` 間接引用到，否則不是 TypeScript program 的主範圍。

### 18.3 這代表什麼？

這代表 View UI Plus 的 TypeScript 設定重點是：

```text
型別宣告檢查 / 對外型別入口
```

而不是：

```text
內部元件源碼全面型別檢查
```

### 18.4 如果你想確認範圍

在一般 TypeScript 專案裡，你可以用：

```bash
npx tsc --noEmit --listFiles
```

或：

```bash
npx tsc --showConfig
```

來確認 TypeScript 實際納入哪些檔案。

讀開源專案時，如果你對 `include` 範圍有疑問，這兩個指令很有用。

---

## 19. `exclude`：排除 `node_modules`

View UI Plus 設定：

```json
{
  "exclude": ["node_modules"]
}
```

這是很常見的設定。

`node_modules` 裡面有大量第三方套件，如果全部納入 TypeScript 檢查，會造成：

```text
檢查很慢
錯誤很多
噪音很多
沒有必要
```

所以通常會排除。

不過要注意：

> `exclude` 不是絕對封鎖所有型別使用。

如果你 import 了某個套件，TypeScript 仍然可能讀取該套件的型別宣告，例如：

```text
node_modules/vue/dist/...
node_modules/@types/...
```

`exclude` 的重點是：

```text
不要把 node_modules 當成專案源碼主動納入檢查
```

而不是：

```text
完全不能讀取 node_modules 中的型別資訊
```

---

## 20. `tsconfig.json` 與 `package.json` 的關係

讀 View UI Plus 的 TypeScript 設定，不能只看 `tsconfig.json`，還要看 `package.json`。

`package.json` 裡有幾個關鍵欄位：

```json
{
  "main": "dist/viewuiplus.min.js",
  "typings": "types/index.d.ts",
  "files": [
    "dist",
    "src",
    "types"
  ]
}
```

這三個欄位分別代表：

| 欄位 | 意義 |
|---|---|
| `main` | npm 使用者預設載入的 JS 入口 |
| `typings` | npm 使用者取得 TypeScript 型別的入口 |
| `files` | 發布到 npm 時包含哪些資料夾 |

### 20.1 `typings` 是型別入口

View UI Plus 的型別入口是：

```text
types/index.d.ts
```

所以 TypeScript 使用者安裝 View UI Plus 後，編輯器會從這個檔案開始理解元件庫型別。

### 20.2 `files` 確保型別會被發布

`package.json` 的 `files` 包含：

```json
"types"
```

代表發布到 npm 時，`types` 目錄應該會被包含。

這很重要。

如果 `typings` 指向：

```text
types/index.d.ts
```

但 `files` 沒有包含：

```text
types
```

那 npm 使用者安裝後可能找不到型別入口。

View UI Plus 這裡的關係是合理的：

```text
package.json
├── typings: types/index.d.ts
└── files: dist, src, types
```

### 20.3 `package.json` scripts 沒有明確 tsc 主線

目前 scripts 中有：

```json
{
  "dev": "vue-cli-service serve",
  "dev2": "vite --config vite.config.dev.js",
  "build": "npm run build:prod && npm run build:style && npm run build:lang",
  "build:prod": "vite build",
  "lint": "vue-cli-service lint --fix"
}
```

你會發現沒有明確：

```text
tsc --build
tsc --noEmit
tsc --declaration
vue-tsc --noEmit
```

所以不要把 View UI Plus 的 `tsconfig.json` 解讀成完整建置主線。

它比較偏：

```text
型別宣告 + 工具設定
```

---

## 21. `tsconfig.json` 與 `vite.config.js` 的關係

`tsconfig.json` 和 `vite.config.js` 很容易被混在一起看。

但它們的責任不同。

| 設定檔 | 責任 |
|---|---|
| `tsconfig.json` | TypeScript 編譯器、型別檢查、IDE 模組解析 |
| `vite.config.js` | 正式 library JS 打包 |
| `vite.config.dev.js` | Vite 本地開發伺服器與 examples 預覽 |

### 21.1 正式打包入口不是 tsconfig

View UI Plus 正式 JS 打包入口在 `vite.config.js`：

```js
build: {
  lib: {
    entry: path.resolve(__dirname, './src/index.js'),
    name: 'ViewUIPlus'
  }
}
```

這代表正式 JS bundle 從：

```text
src/index.js
```

開始。

不是從：

```text
types/index.d.ts
```

開始。

### 21.2 TypeScript 型別入口不是 Vite build 產物

View UI Plus 對外型別入口在 `package.json`：

```json
"typings": "types/index.d.ts"
```

這代表：

```text
JS bundle 入口：dist/viewuiplus.min.js
型別宣告入口：types/index.d.ts
```

兩條線要分開看。

### 21.3 一張圖理解

```text
正式 JS 打包線
package.json scripts.build:prod
  ↓
vite build
  ↓
vite.config.js
  ↓
src/index.js
  ↓
dist/viewuiplus.min.js

型別宣告線
package.json typings
  ↓
types/index.d.ts
  ↓
types/*.d.ts
```

`tsconfig.json` 主要支撐第二條線。

---

## 22. `tsconfig.json` 與 `types/` 的關係

`types/` 是這份 `tsconfig.json` 最重要的對象。

View UI Plus 的 `types` 目錄中有大量元件型別宣告檔：

```text
affix.d.ts
alert.d.ts
anchor.d.ts
button.d.ts
form.d.ts
input.d.ts
modal.d.ts
table.d.ts
viewuiplus.components.d.ts
index.d.ts
...
```

### 22.1 `types/index.d.ts` 的角色

`types/index.d.ts` 是對外型別入口。

它會做幾件事：

```ts
import type { App } from 'vue'
export * from './viewuiplus.components'
```

並且宣告 View UI Plus 的 install function：

```ts
export const install: (app: App, options?: ViewUIPlusInstallOptions) => void
```

它還會擴充 Vue 的全域實例屬性：

```ts
declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $VIEWUI: ViewUIPlusGlobalOptions
    $Spin: any
    $Loading: any
    $Message: any
    $Notice: any
    $Modal: any
    // ...
  }
}
```

這對使用者很重要。

因為當使用者在 Vue 專案中使用：

```ts
this.$Message
this.$Modal
this.$Spin
```

或相關全域 API 時，TypeScript 才有機會知道這些屬性存在。

### 22.2 `viewuiplus.components.d.ts` 的角色

`types/viewuiplus.components.d.ts` 通常會作為元件匯出的集中宣告檔。

它讓：

```ts
import { Button, Table, Modal } from 'view-ui-plus'
```

這類用法可以獲得型別提示。

### 22.3 單一元件 `.d.ts` 的角色

例如：

```text
button.d.ts
input.d.ts
table.d.ts
form.d.ts
```

通常會描述元件本身的型別。

這些檔案對後面章節非常重要：

```text
24_types_型別宣告
28_高階專題_元件API設計
35_高階專題_測試反推元件規格
```

因為你可以從型別宣告反推：

```text
元件對外 API 長什麼樣
props / methods / events 可能有哪些
元件庫希望使用者怎麼使用
```

---

## 23. `tsconfig.json` 與 `src/` 的關係

這一節要特別小心。

View UI Plus 的主要源碼在：

```text
src/
```

正式打包入口是：

```text
src/index.js
```

但 `tsconfig.json` 的 include 是：

```json
"include": [
  "types/*.ts"
]
```

所以從目前設定來看：

```text
src 並不是 TypeScript program 的主檢查範圍
```

### 23.1 那 `paths` 為什麼指向 `src/*`？

因為：

```json
"paths": {
  "@/*": ["src/*"]
}
```

可以讓 TypeScript / IDE 理解 `@` alias。

即使目前 include 範圍較窄，保留這個 alias 仍然可能有幾種用途：

| 可能用途 | 說明 |
|---|---|
| 未來擴充 | 將來如果把 `src/**/*.ts` 納入，可直接使用 alias |
| IDE 支援 | 某些編輯器情境中可輔助跳轉 |
| 和 Vite dev alias 對齊 | `vite.config.dev.js` 也把 `@` 指向 `src` |
| 歷史保留 | 從舊工程演進而來的設定 |

### 23.2 讀 `src` 時不要期待 TS 保護

你看 `src/components` 時，仍然要靠：

```text
JavaScript / Vue 本身理解
元件 API 文件
範例 examples
型別宣告 types
測試 test
```

來判斷行為。

不要以為：

```text
strict: true 會保護 src 中所有元件邏輯
```

目前不是。

---

## 24. `tsconfig.json` 與 ESLint / TSLint 的關係

View UI Plus 根目錄同時存在：

```text
.eslintrc.js
tslint.json
tsconfig.json
```

這三者容易混淆。

| 檔案 | 責任 |
|---|---|
| `tsconfig.json` | TypeScript 編譯 / 型別檢查 / 模組解析 |
| `.eslintrc.js` | JavaScript / Vue 程式碼風格與基本 lint |
| `tslint.json` | 舊式 TypeScript lint 規則 |

### 24.1 ESLint 是目前 scripts 中比較明確的 lint 主線

`package.json` 中的 lint 指令是：

```json
"lint": "vue-cli-service lint --fix"
```

而 `.eslintrc.js` 設定：

```js
module.exports = {
  root: true,
  env: { node: true },
  extends: ['plugin:vue/vue3-essential'],
  parserOptions: {
    parser: 'babel-eslint',
    ecmaVersion: 6,
    sourceType: 'module'
  }
}
```

這代表目前你讀 lint 主線時，應該先看：

```text
package.json scripts.lint
  ↓
vue-cli-service lint --fix
  ↓
.eslintrc.js
```

### 24.2 TSLint 是歷史痕跡比較重

專案有 `tslint.json`，而且 `package.json` 也有：

```json
"tslint": "^5.14.0"
```

但 scripts 中沒有直接看到：

```text
tslint ...
```

所以你可以把它暫時理解成：

```text
保留的舊式 TypeScript lint 設定
```

讀碼優先級低於：

```text
.eslintrc.js
package.json scripts.lint
tsconfig.json include
```

### 24.3 不要把三者混成一件事

簡單分法：

```text
tsconfig.json
  問：TypeScript 怎麼理解與檢查？

.eslintrc.js
  問：程式碼風格與 Vue lint 怎麼檢查？

tslint.json
  問：舊式 TS lint 規則是否仍有使用？
```

---

## 25. 讀碼時的正確閱讀順序

讀 View UI Plus 的 `tsconfig.json`，建議不要從第一個 option 逐字背到最後。

更好的順序是：

### 第一步：先看 `include`

```json
"include": [
  "types/*.ts"
]
```

先確定範圍。

你要立刻得到結論：

```text
這份 TS 設定主要作用在 types 目錄，不是整個 src
```

### 第二步：看 `package.json` 的 `typings`

```json
"typings": "types/index.d.ts"
```

確認 `types/index.d.ts` 是對外型別入口。

### 第三步：打開 `types/index.d.ts`

看它做了什麼：

```text
import type { App } from 'vue'
export * from './viewuiplus.components'
declare module '@vue/runtime-core'
export const install
```

這會讓你理解 View UI Plus 對外提供哪些全域 API 型別。

### 第四步：再看 `compilerOptions`

這時候再看：

```text
strict
target
module
moduleResolution
baseUrl
paths
lib
```

你才知道這些設定套用在哪裡。

### 第五步：回頭對照 Vite 設定

尤其是：

```text
vite.config.js
vite.config.dev.js
```

確認：

```text
哪些 alias 是給 TS 看的
哪些 alias 是給 Vite 看的
哪些 sourceMap 是 TS 層
哪些 sourcemap 是 bundle 層
```

---

## 26. 容易誤解的地方

### 誤解 1：有 `tsconfig.json` 就代表整個專案都是 TypeScript

不一定。

View UI Plus 有 `tsconfig.json`，但 include 主要是：

```text
types/*.ts
```

所以它不是完整 TypeScript 化專案。

---

### 誤解 2：`strict: true` 代表 `src` 全部嚴格檢查

不精準。

`strict` 只對 TypeScript program 內的檔案有直接作用。

目前 `src` 不是 include 主線。

---

### 誤解 3：`paths` 會自動讓 Vite build 認得 `@`

不會。

`paths` 是 TypeScript 解析設定。

Vite 要看：

```text
resolve.alias
```

View UI Plus 的 Vite dev 設定有 alias，但正式 `vite.config.js` 目前主要只設定 extensions。

---

### 誤解 4：`sourceMap: true` 代表 dist 產物一定有 sourcemap

不精準。

`tsconfig.json` 的 `sourceMap` 和 `vite.config.js` 的 `sourcemap` 是不同層次。

View UI Plus 的正式打包 output 設定是：

```js
sourcemap: false
```

---

### 誤解 5：`importHelpers: true` 一定是 build 主線的重要設定

不一定。

本專案正式 build 主線是 Vite，且 package scripts 沒有明確 `tsc` 指令。

所以它目前比較像保留的 TS 編譯選項。

---

### 誤解 6：`types/` 是內部實作

不是。

`types/` 更偏向：

```text
對外 API 型別契約
```

你後面讀元件 API 設計時，可以從 `types` 反推元件庫對外承諾。

---

### 誤解 7：`tslint.json` 一定仍是主線 lint

不一定。

目前 scripts 中比較明確的是：

```text
vue-cli-service lint --fix
```

所以先看 `.eslintrc.js` 與 Vue CLI lint 主線。

---

## 27. 如果你要仿寫迷你元件庫，應該怎麼設計

如果你只是學 View UI Plus 的「工程思想」，可以參考它的分線方式：

```text
src/      寫元件源碼
types/    對外型別宣告
dist/     打包產物
examples/ 本地展示與測試
```

但如果你要新寫一個迷你元件庫，不建議完全照抄它的 `tsconfig.json`。

因為現代 Vue 3 + TypeScript 元件庫通常會更完整地檢查 `src`。

### 27.1 現代迷你元件庫建議版

可以考慮：

```jsonc
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "jsx": "preserve",
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    },
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "types": ["vite/client"],
    "skipLibCheck": true,
    "declaration": true,
    "declarationMap": true
  },
  "include": [
    "src/**/*.ts",
    "src/**/*.tsx",
    "src/**/*.vue",
    "types/**/*.d.ts",
    "vite.config.ts"
  ],
  "exclude": [
    "node_modules",
    "dist"
  ]
}
```

並搭配：

```jsonc
{
  "scripts": {
    "typecheck": "vue-tsc --noEmit",
    "build": "vite build && vue-tsc --declaration --emitDeclarationOnly"
  }
}
```

### 27.2 但學 View UI Plus 時不要急著改

你現在讀 View UI Plus 的目的不是立刻重構它，而是理解：

```text
一個成熟元件庫如何分出：
  JS bundle
  CSS bundle
  locale bundle
  types declaration
  examples dev app
```

所以這篇的重點不是說 View UI Plus 配得完美，而是：

> 看懂它目前這份 TypeScript 設定在整個工程裡扮演什麼角色。

---

## 28. 讀碼檢核表

讀完本篇後，你可以用下面清單確認自己是否真的看懂。

### 28.1 基礎理解

- [ ] 我知道 `tsconfig.json` 是 TypeScript 工程設定入口。
- [ ] 我知道 View UI Plus 的 `include` 主要是 `types/*.ts`。
- [ ] 我知道這不等於整個 `src` 都被 TypeScript 嚴格檢查。
- [ ] 我知道 `strict: true` 主要影響被 include 納入的檔案。
- [ ] 我知道 `exclude: ["node_modules"]` 是排除第三方套件，不是禁止讀取套件型別。

### 28.2 工程分線

- [ ] 我可以分清楚 JS bundle 入口是 `src/index.js`，型別入口是 `types/index.d.ts`。
- [ ] 我知道 `package.json` 的 `typings` 會指向對外型別入口。
- [ ] 我知道 `package.json` 的 `files` 需要包含 `types`，型別才會跟著發布。
- [ ] 我知道 `tsconfig.json` 不負責正式 library bundle 打包。
- [ ] 我知道正式打包要看 `vite.config.js`。

### 28.3 Alias 與解析

- [ ] 我知道 `baseUrl: "."` 代表以根目錄作為 TypeScript 解析基準。
- [ ] 我知道 `paths: { "@/*": ["src/*"] }` 是 TypeScript / IDE 層 alias。
- [ ] 我知道 Vite alias 要另外看 `vite.config.dev.js` 或 `vite.config.js`。
- [ ] 我知道 `paths` 不會自動改寫最終輸出的 import 路徑。

### 28.4 型別宣告

- [ ] 我知道 `types/index.d.ts` 會 export 元件宣告。
- [ ] 我知道 `types/index.d.ts` 會擴充 Vue 的 `ComponentCustomProperties`。
- [ ] 我知道 `types/*.d.ts` 可以用來反推元件庫對外 API。
- [ ] 我知道後續 `24_types_型別宣告` 章節會深入這些檔案。

### 28.5 進階判斷

- [ ] 我能分辨 `sourceMap` 與 Vite `sourcemap` 的差異。
- [ ] 我能分辨 `tsconfig.json`、`.eslintrc.js`、`tslint.json` 的責任。
- [ ] 我知道 View UI Plus 的 TypeScript 設定帶有歷史專案痕跡。
- [ ] 我知道仿寫新專案時不一定要照抄這份設定。

---

## 29. 本篇總結

View UI Plus 的 `tsconfig.json` 可以用一句話總結：

> 它不是整個元件庫源碼的完整 TypeScript 建置設定，而是支撐 `types/` 型別宣告、IDE 模組解析與部分 TypeScript 語法相容的工程設定。

你要特別記住 5 個重點：

### 重點 1：先看 `include`

```json
"include": [
  "types/*.ts"
]
```

這代表它的 TypeScript program 主範圍主要在 `types`。

---

### 重點 2：`strict: true` 不等於 `src` 全面嚴格

`strict` 很重要，但它不會自動檢查沒有被 include 納入的所有 JS / Vue 檔案。

所以你讀 `src/components` 時，不要期待每個元件都被 TypeScript 完整約束。

---

### 重點 3：JS bundle 與 typings 是兩條線

```text
JS bundle：
package.json main
  ↓
dist/viewuiplus.min.js

TypeScript typings：
package.json typings
  ↓
types/index.d.ts
```

這兩條線要分開看。

---

### 重點 4：`paths` 是給 TypeScript 看的，不是自動給 Vite 看的

```json
"paths": {
  "@/*": ["src/*"]
}
```

這是 TypeScript / IDE 層的路徑解析設定。

Vite 要另外看 `resolve.alias`。

---

### 重點 5：仿寫新專案時要現代化取捨

View UI Plus 是成熟且有歷史演進痕跡的專案。

你讀它是為了學工程分層：

```text
src
examples
build
dist
types
package.json
vite.config.js
tsconfig.json
```

但你自己新寫 Vue 3 + TypeScript 元件庫時，建議更完整地導入：

```text
src/**/*.ts
src/**/*.vue
vue-tsc
Vite library mode
自動產生 declaration
```

不要無腦照抄舊專案設定。

---

## 30. 參考來源

- View UI Plus GitHub Repository  
  `https://github.com/view-design/ViewUIPlus`

- View UI Plus `tsconfig.json`  
  `https://raw.githubusercontent.com/view-design/ViewUIPlus/master/tsconfig.json`

- View UI Plus `package.json`  
  `https://raw.githubusercontent.com/view-design/ViewUIPlus/master/package.json`

- View UI Plus `vite.config.js`  
  `https://raw.githubusercontent.com/view-design/ViewUIPlus/master/vite.config.js`

- View UI Plus `vite.config.dev.js`  
  `https://raw.githubusercontent.com/view-design/ViewUIPlus/master/vite.config.dev.js`

- View UI Plus `types/index.d.ts`  
  `https://raw.githubusercontent.com/view-design/ViewUIPlus/master/types/index.d.ts`

- View UI Plus `types/` 目錄  
  `https://github.com/view-design/ViewUIPlus/tree/master/types`

- TypeScript TSConfig Reference  
  `https://www.typescriptlang.org/tsconfig/`

---

# 附錄 A：本篇最重要的讀碼口訣

```text
先看 include，再看 compilerOptions。
先分 typings，再分 bundle。
先分 TS alias，再分 Vite alias。
先看 TypeScript 在專案中的實際角色，再決定要不要照抄。
```

# 附錄 B：一張圖總結

```text
View UI Plus TypeScript 設定主線

package.json
├── typings: types/index.d.ts
├── files: dist, src, types
└── devDependencies: typescript

        ↓

tsconfig.json
├── strict: true
├── baseUrl: .
├── paths: @/* -> src/*
├── lib: esnext + dom
└── include: types/*.ts

        ↓

types/index.d.ts
├── import type { App } from 'vue'
├── export * from './viewuiplus.components'
├── declare module '@vue/runtime-core'
└── export const install

        ↓

npm 使用者
├── import { Button } from 'view-ui-plus'
├── app.use(ViewUIPlus)
└── this.$Message / this.$Modal / this.$Spin 型別提示
```

# 附錄 C：本篇和後續章節的銜接

| 後續章節 | 本篇已建立的基礎 | 後續要深入的內容 |
|---|---|---|
| `03_package與依賴分析` | 知道 `typings`、`files`、`typescript` 的位置 | 深入依賴版本與 scripts |
| `04_build_打包腳本與建置流程` | 知道 `tsconfig` 不是正式 JS build 主線 | 深入 `vite build`、style build、locale build |
| `06_src_入口與插件機制` | 知道 JS 入口是 `src/index.js` | 深入 install、component registration、globalProperties |
| `07_元件註冊機制` | 知道 types 會對外宣告元件 | 對照實際註冊與型別 export |
| `08_全域配置與globalProperties` | 知道 `types/index.d.ts` 擴充 Vue 全域屬性 | 深入 `$Message`、`$Modal`、`$VIEWUI` 等全域 API |
| `24_types_型別宣告` | 知道 `types/` 是對外 API 契約 | 逐一拆解 declaration files |
| `28_高階專題_元件API設計` | 知道型別可反推 API | 從 `.d.ts` 反推 props、events、methods 設計 |

