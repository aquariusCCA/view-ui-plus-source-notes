# Vue 元件庫 npm 發布流程

這篇文章接續 `docs/vue-component-library-build-flow.md`，專門說明 `apps/01-clone-practice` 的 npm 發布流程。

前一篇打包流程回答：

```text
src/ 裡的元件庫原始碼，最後如何變成 dist/ 裡可以發布的檔案？
```

這篇則回答：

```text
dist/ 裡的檔案，如何變成其他專案可以 npm install 並 import 的套件？
```

重點是：`npm run build` 只會產生打包檔案，但還不等於發布。真正讓其他專案知道「要載入哪個 JS、哪個 CSS、哪個型別檔」的是 `package.json`。

## 發布流程的目標

目前這個元件庫的 build 產物是：

```text
dist/
  myui.es.js
  myui.umd.cjs
  styles/
    myui.css
```

另外還有 TypeScript 型別宣告：

```text
types/
  index.d.ts
  helloworld.d.ts
  myui.components.d.ts
```

npm 發布流程要做的事情，就是把這些檔案整理成一個 package，讓使用者可以這樣安裝：

```powershell
npm install @kevinxiao0210/myui
```

並在自己的 Vue 專案裡這樣使用：

```js
import { createApp } from 'vue'
import MyUI from '@kevinxiao0210/myui'
import '@kevinxiao0210/myui/style.css'
import App from './App.vue'

createApp(App).use(MyUI).mount('#app')
```

使用者不需要知道 `dist/myui.es.js` 或 `dist/myui.umd.cjs` 的實際路徑。這些對應關係都由套件裡的 `package.json` 負責。

## `package.json` 是發布契約

目前 `apps/01-clone-practice/package.json` 裡和發布最相關的欄位是：

```json
{
  "name": "@kevinxiao0210/myui",
  "version": "0.1.0",
  "type": "module",
  "main": "dist/myui.umd.cjs",
  "module": "dist/myui.es.js",
  "types": "types/index.d.ts",
  "style": "dist/styles/myui.css",
  "exports": {
    ".": {
      "types": "./types/index.d.ts",
      "import": "./dist/myui.es.js",
      "require": "./dist/myui.umd.cjs"
    },
    "./style.css": "./dist/styles/myui.css"
  },
  "files": [
    "dist",
    "types"
  ],
  "peerDependencies": {
    "vue": "^3.5.0"
  }
}
```

可以先把它理解成一份對外契約：

| 欄位 | 作用 |
| --- | --- |
| `name` | 使用者安裝和 import 時使用的套件名稱 |
| `version` | npm 上的版本號，每次發布都必須遞增 |
| `main` | CommonJS 或舊工具的 JS 入口 |
| `module` | 現代打包工具常用的 ES Module 入口 |
| `types` | TypeScript 型別入口 |
| `style` | 套件主要 CSS 檔案提示 |
| `exports` | 現代工具解析套件對外入口的主要設定，包含 JS、CSS 子路徑與型別入口 |
| `files` | 發布到 npm 時要包含哪些目錄或檔案 |
| `peerDependencies` | 告訴使用者專案必須自己提供哪些依賴 |

## JS 入口如何被解析

當使用者寫：

```js
import MyUI from '@kevinxiao0210/myui'
```

打包工具會找到：

```text
node_modules/@kevinxiao0210/myui/package.json
```

然後根據 `exports` 決定要載入哪個檔案：

```json
"exports": {
  ".": {
    "import": "./dist/myui.es.js",
    "require": "./dist/myui.umd.cjs"
  }
}
```

這段可以翻成：

```text
import '@kevinxiao0210/myui'
  -> dist/myui.es.js

require('@kevinxiao0210/myui')
  -> dist/myui.umd.cjs
```

`module` 和 `main` 仍然保留，是為了相容一些還沒有完整使用 `exports` 的工具：

```json
"main": "dist/myui.umd.cjs",
"module": "dist/myui.es.js"
```

簡單整理：

| 使用方式 | 對應產物 |
| --- | --- |
| `import MyUI from '@kevinxiao0210/myui'` | `dist/myui.es.js` |
| `const MyUI = require('@kevinxiao0210/myui')` | `dist/myui.umd.cjs` |

所以使用者寫的是套件名稱，不是檔案路徑；真正的檔案路徑由 `package.json` 對應。

## CSS 入口如何被解析

元件庫通常不會只把樣式藏在 JS 裡。這個專案選擇讓使用者明確引入 CSS：

```js
import '@kevinxiao0210/myui/style.css'
```

這個路徑會對應到 `exports` 裡的子路徑：

```json
"exports": {
  "./style.css": "./dist/styles/myui.css"
}
```

也就是：

```text
@kevinxiao0210/myui/style.css
  -> dist/styles/myui.css
```

另外 `style` 欄位也指向同一份 CSS：

```json
"style": "dist/styles/myui.css"
```

不過不是所有工具都會自動讀取 `style`。所以在教使用者使用元件庫時，最清楚的方式仍然是明確寫：

```js
import '@kevinxiao0210/myui/style.css'
```

## 型別入口如何被解析

TypeScript 和編輯器需要知道這個套件有哪些匯出。

目前套件用 `types` 指向型別入口：

```json
"types": "types/index.d.ts"
```

`exports` 裡也同步宣告：

```json
"exports": {
  ".": {
    "types": "./types/index.d.ts"
  }
}
```

這代表使用者在 TypeScript 專案或 VS Code 裡 import 元件庫時，工具可以找到：

```text
types/index.d.ts
```

如果少了這個入口，JavaScript 仍可能可以執行，但 TypeScript 型別提示、元件 props 提示或自動完成會變差。

## `files` 決定真正發布哪些檔案

`files` 是發布前最容易忽略的欄位。

目前設定是：

```json
"files": [
  "dist",
  "types"
]
```

意思是 npm package 主要只帶上：

```text
dist/
types/
package.json
```

`package.json` 會自動被 npm 包進去。常見的 README、LICENSE 等檔案即使不寫在 `files` 裡，npm 也通常會一併包含。

不應該發布的內容包含：

```text
node_modules/
examples/
vite.config.js
vite.lib.config.js
vite.style.config.js
```

原因是使用者安裝元件庫時，需要的是可用的產物和型別，不需要你的開發展示站或 build 設定。

## 為什麼 Vue 要放在 `peerDependencies`

目前設定是：

```json
"peerDependencies": {
  "vue": "^3.5.0"
}
```

這代表：

```text
我的元件庫需要 Vue，但 Vue 應該由使用者專案提供。
```

這和打包設定互相對應：

```js
external: ['vue']
```

可以這樣理解：

```text
vite.lib.config.js 的 external
  -> build 時不要把 Vue 打進 dist

package.json 的 peerDependencies
  -> install 時告訴使用者專案要自己安裝 Vue
```

如果元件庫把 Vue 自己打包進去，使用者專案可能會出現兩份 Vue，造成 bundle 變大或執行期問題。

元件庫本身開發時仍然需要 Vue，所以 `vue` 也會出現在 `devDependencies`：

```json
"devDependencies": {
  "vue": "^3.5.34"
}
```

## 發布前檢查

正式發布前，先進入元件庫目錄：

```powershell
cd apps/01-clone-practice
```

先重新打包：

```powershell
npm run build
```

確認產物存在：

```text
dist/myui.es.js
dist/myui.umd.cjs
dist/styles/myui.css
types/index.d.ts
```

接著用 dry-run 檢查 npm 實際會包哪些檔案：

```powershell
npm pack --dry-run
```

這一步不是發布，只是預覽 package 內容。

你應該確認輸出裡至少包含：

```text
package.json
dist/myui.es.js
dist/myui.umd.cjs
dist/styles/myui.css
types/index.d.ts
```

如果看到 `node_modules/`、`examples/` 或其他開發用檔案，通常代表 `files` 設定還需要調整。

## 本機模擬安裝

在真正發布前，可以先產生本機 tarball：

```powershell
npm pack
```

scoped package 產生的檔名通常會把 scope 轉成前綴，例如：

```text
kevinxiao0210-myui-0.1.0.tgz
```

接著到另一個 Vue 專案安裝這個 tarball：

```powershell
npm install C:\path\to\kevinxiao0210-myui-0.1.0.tgz
```

然後測試：

```js
import { createApp } from 'vue'
import MyUI from '@kevinxiao0210/myui'
import '@kevinxiao0210/myui/style.css'
import App from './App.vue'

createApp(App).use(MyUI).mount('#app')
```

如果這裡可以正常編譯、樣式正常載入、元件也能使用，才代表 package 的入口設定大致正確。

## 版本管理

npm 不允許重複發布同一個版本。

目前版本是：

```json
"version": "0.1.0"
```

如果已經發布過 `0.1.0`，下一次發布前必須升版。

常見版本規則可以先用這樣的簡化理解：

| 指令 | 情境 | 範例 |
| --- | --- | --- |
| `npm version patch` | 修 bug | `0.1.0` -> `0.1.1` |
| `npm version minor` | 新增功能且相容 | `0.1.0` -> `0.2.0` |
| `npm version major` | 破壞性改動 | `1.0.0` -> `2.0.0` |

這個專案的 `src/index.js` 會從 `package.json` 匯出版本：

```js
export const version = pkg.version
```

所以 `package.json` 的 `version` 不只影響 npm，也會影響使用者從套件 API 讀到的版本。

## 發布到 npm

第一次發布前需要登入：

```powershell
npm login
```

確認目前登入的帳號：

```powershell
npm whoami
```

確認 `package.json` 沒有設定：

```json
"private": true
```

因為這個套件名稱是 scoped package：

```json
"name": "@kevinxiao0210/myui"
```

如果要公開發布，指令要加上 `--access public`：

```powershell
npm publish --access public
```

發布完成後，使用者就可以在其他專案安裝：

```powershell
npm install @kevinxiao0210/myui
```

## 發布後驗證

發布後不要只看 npm 網頁顯示成功，還要用一個乾淨的 Vue 專案安裝測試。

最基本要驗證三件事：

```powershell
npm install @kevinxiao0210/myui
```

JavaScript 入口可以載入：

```js
import MyUI from '@kevinxiao0210/myui'
```

CSS 入口可以載入：

```js
import '@kevinxiao0210/myui/style.css'
```

Vue plugin 可以安裝：

```js
createApp(App).use(MyUI).mount('#app')
```

如果 JS、CSS、型別和 Vue plugin 都正常，這次 npm 發布才算完成。

## 最後整理

三篇筆記合在一起，可以形成完整流程：

```text
docs/vue-component-library-project-structure.md
  -> src/、style/、examples/ 如何分工

docs/vue-component-library-build-flow.md
  -> src/ 如何 build 成 dist/

docs/vue-component-library-npm-publish-flow.md
  -> dist/ 如何透過 package.json 發布成 npm package
```

也可以把發布流程壓成一條命令路線：

```text
cd apps/01-clone-practice
  -> npm run build
  -> npm pack --dry-run
  -> npm pack
  -> 到另一個專案安裝 tarball 測試
  -> npm login
  -> npm publish --access public
  -> 到乾淨專案 npm install 測試
```

核心觀念是：

```text
build 產生檔案
package.json 描述入口
npm publish 發布 package
使用者透過 package name 引入
```
