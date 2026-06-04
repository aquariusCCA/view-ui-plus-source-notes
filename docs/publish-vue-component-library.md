# 將 Vue 元件庫發布給其他專案使用

這篇文章用 `apps/01-clone-practice` 這類 Vue 3 元件庫作為例子，說明如何把自己的元件庫打包成 npm package，讓其他專案可以這樣使用：

```js
import { createApp } from 'vue'
import MyUI from 'myui'
import 'myui/style.css'
import App from './App.vue'

createApp(App).use(MyUI).mount('#app')
```

重點是：使用者寫 `import MyUI from 'myui'` 時，並不是直接指定某一個 JS 檔案，而是由 npm package 裡的 `package.json` 告訴打包工具要載入哪個檔案。

## 使用者為什麼可以寫 `import MyUI from 'myui'`

當其他專案安裝你的套件：

```powershell
npm install myui
```

專案裡會出現：

```text
node_modules/
  myui/
    package.json
    dist/
      myui.es.js
      myui.umd.js
      styles/
        myui.css
    types/
      index.d.ts
```

使用者寫：

```js
import MyUI from 'myui'
```

Vite、Webpack、Rollup 或 Node 會先找到：

```text
node_modules/myui/package.json
```

然後根據 `package.json` 裡的入口設定，決定真正要載入哪一個檔案。

也就是說，`myui` 只是套件名稱，真正對應到哪個 JS，是由你的 `package.json` 決定。

## `myui.es.js` 和 `myui.umd.js` 的差異

元件庫通常會打包出多種格式，常見的是：

```text
dist/myui.es.js
dist/myui.umd.js
```

`myui.es.js` 是 ES Module 格式，給現代前端工具使用。

例如使用者在 Vite 專案裡寫：

```js
import MyUI from 'myui'
```

這種 `import` 通常會解析到：

```text
dist/myui.es.js
```

`myui.umd.js` 是 UMD 格式，主要給舊環境、CommonJS 或 CDN script 使用。

例如 CommonJS：

```js
const MyUI = require('myui')
```

通常會解析到：

```text
dist/myui.umd.js
```

或者使用者直接透過瀏覽器 `<script>` 載入：

```html
<script src="https://unpkg.com/vue@3"></script>
<script src="https://unpkg.com/myui/dist/myui.umd.js"></script>
```

這時候是手動指定 `myui.umd.js`。

簡單整理：

| 使用方式 | 常用入口 |
| --- | --- |
| `import MyUI from 'myui'` | `dist/myui.es.js` |
| `const MyUI = require('myui')` | `dist/myui.umd.js` |
| `<script src=".../myui.umd.js">` | `dist/myui.umd.js` |

所以一般 Vue 3 + Vite 使用者不需要知道 `myui.es.js` 的存在，只要 `package.json` 設定正確，工具會自動選。

## 建議的 `package.json`

元件庫發布前，建議整理成類似下面這樣：

```json
{
  "name": "myui",
  "version": "0.1.0",
  "type": "module",
  "main": "dist/myui.umd.js",
  "module": "dist/myui.es.js",
  "types": "types/index.d.ts",
  "style": "dist/styles/myui.css",
  "exports": {
    ".": {
      "types": "./types/index.d.ts",
      "import": "./dist/myui.es.js",
      "require": "./dist/myui.umd.js"
    },
    "./style.css": "./dist/styles/myui.css"
  },
  "files": [
    "dist",
    "types",
    "README.md"
  ],
  "peerDependencies": {
    "vue": "^3.5.0"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^6.0.6",
    "less": "^4.0.0",
    "vite": "^8.0.12",
    "vue": "^3.5.34"
  }
}
```

如果你要發布到 npm，`name` 必須是 npm 上沒有被使用過的名稱。也可以用 scoped package，例如：

```json
{
  "name": "@your-name/myui"
}
```

公開 scoped package 時，發布指令要加上 `--access public`：

```powershell
npm publish --access public
```

## 重要欄位說明

### `name`

`name` 是套件名稱，也是使用者 import 時會寫的名字。

如果你的 `package.json` 是：

```json
{
  "name": "myui"
}
```

使用者就會這樣安裝：

```powershell
npm install myui
```

並這樣引入：

```js
import MyUI from 'myui'
```

如果你的套件名稱是：

```json
{
  "name": "@your-name/myui"
}
```

使用者就會寫：

```js
import MyUI from '@your-name/myui'
```

### `version`

`version` 是版本號。

npm 不允許重複發布同一個版本，所以每次發布都要遞增版本：

```json
{
  "version": "0.1.0"
}
```

常見升版方式：

| 情境 | 範例 |
| --- | --- |
| 修 bug | `0.1.0` 到 `0.1.1` |
| 新增功能 | `0.1.0` 到 `0.2.0` |
| 有破壞性改動 | `1.0.0` 到 `2.0.0` |

### `private`

如果 `package.json` 裡有：

```json
{
  "private": true
}
```

npm 會禁止你發布這個套件。

要公開元件庫時，應該移除這個欄位，或改成：

```json
{
  "private": false
}
```

### `type`

`type` 會影響 `.js` 檔案被 Node 視為哪種模組格式。

你的專案使用 `import` / `export`，所以通常設定：

```json
{
  "type": "module"
}
```

### `main`

`main` 是傳統入口欄位，通常給 CommonJS 或比較舊的工具使用。

元件庫如果有 UMD 檔，可以這樣寫：

```json
{
  "main": "dist/myui.umd.js"
}
```

當使用者使用：

```js
const MyUI = require('myui')
```

舊工具可能會根據 `main` 找到：

```text
dist/myui.umd.js
```

### `module`

`module` 是給現代打包工具使用的 ES Module 入口。

```json
{
  "module": "dist/myui.es.js"
}
```

當使用者使用：

```js
import MyUI from 'myui'
```

Vite、Rollup、Webpack 通常會偏好使用 ES Module，也就是：

```text
dist/myui.es.js
```

### `types`

`types` 是 TypeScript 型別入口。

```json
{
  "types": "types/index.d.ts"
}
```

如果使用者的專案是 TypeScript，或使用 VS Code、Volar 這類工具，會靠這個欄位找到你的型別宣告。

### `style`

`style` 用來提示套件的主要 CSS 檔案在哪裡。

```json
{
  "style": "dist/styles/myui.css"
}
```

不是所有打包工具都會自動讀取 `style`，所以元件庫通常還是會讓使用者手動引入：

```js
import 'myui/style.css'
```

### `exports`

`exports` 是現代 npm package 最重要的入口設定。

```json
{
  "exports": {
    ".": {
      "types": "./types/index.d.ts",
      "import": "./dist/myui.es.js",
      "require": "./dist/myui.umd.js"
    },
    "./style.css": "./dist/styles/myui.css"
  }
}
```

這段代表：

```js
import MyUI from 'myui'
```

會使用：

```text
dist/myui.es.js
```

而：

```js
const MyUI = require('myui')
```

會使用：

```text
dist/myui.umd.js
```

另外：

```js
import 'myui/style.css'
```

會使用：

```text
dist/styles/myui.css
```

如果有 `exports`，現代工具通常會優先看 `exports`，再看 `module` 或 `main`。

### `files`

`files` 決定發布到 npm 時會包含哪些檔案。

元件庫使用者通常只需要打包後的檔案、型別和 README：

```json
{
  "files": [
    "dist",
    "types",
    "README.md"
  ]
}
```

不建議把這些內容發布出去：

```text
node_modules
example
.vscode
```

至於 `src` 是否要發布，看你的策略。如果使用者只會使用打包後的結果，通常不需要發布 `src`。

### `peerDependencies`

Vue 元件庫通常應該把 `vue` 放在 `peerDependencies`。

```json
{
  "peerDependencies": {
    "vue": "^3.5.0"
  }
}
```

意思是：我的元件庫需要 Vue，但 Vue 應該由使用者的專案提供。

這樣可以避免使用者專案裝到兩份 Vue。元件庫如果把 Vue 放在 `dependencies`，可能造成打包結果變大，或出現兩個 Vue instance 的問題。

### `devDependencies`

`devDependencies` 是開發元件庫時才需要的工具。

```json
{
  "devDependencies": {
    "@vitejs/plugin-vue": "^6.0.6",
    "less": "^4.0.0",
    "vite": "^8.0.12",
    "vue": "^3.5.34"
  }
}
```

雖然 `vue` 已經放在 `peerDependencies`，但元件庫本身開發、測試和 build 時也需要 Vue，所以也可以把 Vue 放在 `devDependencies`。

## 發布前檢查

在元件庫目錄執行：

```powershell
cd apps/01-clone-practice
npm run build
```

確認產生：

```text
dist/myui.es.js
dist/myui.umd.js
dist/styles/myui.css
```

接著檢查 npm 實際會打包哪些檔案：

```powershell
npm pack --dry-run
```

你應該看到類似：

```text
dist/myui.es.js
dist/myui.umd.js
dist/styles/myui.css
types/index.d.ts
README.md
package.json
```

如果 dry-run 裡出現 `node_modules`、`example` 或不必要的開發檔案，通常代表 `files` 還需要調整。

## 本機模擬安裝

正式發布前，可以先用 `npm pack` 產生本地 tarball：

```powershell
npm pack
```

會得到類似：

```text
myui-0.1.0.tgz
```

然後到另一個 Vue 專案安裝：

```powershell
npm install C:\path\to\myui-0.1.0.tgz
```

在另一個專案裡測試：

```js
import { createApp } from 'vue'
import MyUI from 'myui'
import 'myui/style.css'
import App from './App.vue'

createApp(App).use(MyUI).mount('#app')
```

如果這裡可以正常使用，就代表你的入口設定大致正確。

## 發布到 npm

先登入 npm：

```powershell
npm login
```

確認 `package.json` 沒有：

```json
{
  "private": true
}
```

然後發布：

```powershell
npm publish
```

如果你的套件名稱是 scoped package，例如：

```json
{
  "name": "@your-name/myui"
}
```

公開發布要使用：

```powershell
npm publish --access public
```

發布完成後，其他專案就可以：

```powershell
npm install myui
```

或：

```powershell
npm install @your-name/myui
```

## 最後整理

`import MyUI from 'myui'` 的解析流程可以簡化成：

```text
使用者寫 import MyUI from 'myui'
打包工具找到 node_modules/myui/package.json
優先讀取 exports["."].import
載入 dist/myui.es.js
```

而 `require('myui')` 則可以簡化成：

```text
使用者寫 const MyUI = require('myui')
工具找到 node_modules/myui/package.json
優先讀取 exports["."].require
載入 dist/myui.umd.js
```

所以使用者不需要自己判斷要用 `myui.es.js` 還是 `myui.umd.js`。你的元件庫只要在 `package.json` 裡把入口設定清楚，打包工具就會依照使用方式自動選擇。
