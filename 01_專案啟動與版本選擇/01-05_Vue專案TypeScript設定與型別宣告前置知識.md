# 01-05_Vue 專案 TypeScript 設定與型別宣告前置知識

> 所屬章節：`01_專案啟動與版本選擇`  
> 筆記定位：Vue 專案 TypeScript 設定、型別入口與宣告檔的前置知識  
> 適用目標：在閱讀 View UI Plus 的 package、types、typings 與 Vue + TS 範例前，先理解 TS 型別系統周邊設定  
> 建立日期：2026-05-05

---

## 一、核心總結

在 Vue 專案中，TypeScript 相關設定常見有幾個重要角色：

| 名稱 | 主要作用 |
|---|---|
| `typescript` 套件 | 提供 TypeScript 編譯器與型別分析能力 |
| `tsc` | TypeScript 官方命令列編譯器 |
| `vue-tsc` | 專門用來檢查 Vue SFC，也就是 `.vue` 檔案中的 TypeScript |
| `tsconfig.json` | TypeScript 專案設定檔，決定型別檢查規則、路徑解析、檔案範圍等 |
| `package.json` | 記錄套件、指令、依賴與套件入口資訊 |
| `package.json` 的 `types` / `typings` | 告訴 TypeScript：這個 npm 套件的型別宣告入口在哪裡 |
| `*.d.ts` | TypeScript 型別宣告檔，只描述型別，不放真正執行邏輯 |
| 編輯器 TypeScript Language Service | 在開發過程中即時讀取設定並顯示 TS 錯誤、提示、跳轉、補全 |

最重要的觀念：

```text
tsconfig.json 不是 package.json 自己讀的，
而是 TypeScript 相關工具讀的。

這些工具可能是：
1. 你手動執行的 tsc / vue-tsc
2. VS Code / WebStorm 背景啟動的 TypeScript 語言服務
3. Vue 官方插件背後整合的 Vue + TS 型別分析服務
```

---

## 二、`tsconfig.json` 是什麼？

`tsconfig.json` 是 TypeScript 專案的設定檔。

它負責告訴 TypeScript：

> 這個專案的 TypeScript 程式碼要怎麼被理解、檢查與解析。

在 Vue 專案中，它會影響：

- `.ts` 檔案的型別檢查
- `.vue` 檔案中的 `<script setup lang="ts">`
- 路徑別名，例如 `@/components/Button.vue`
- 是否開啟嚴格模式
- 可使用哪些 JavaScript / DOM API
- 哪些檔案要被納入型別檢查
- 是否跳過第三方套件型別檢查
- 是否支援 JSON import
- 是否使用 Node / Vite / Vue 提供的全域型別

---

## 三、常見 `tsconfig.json` 設定

### 1. `compilerOptions.strict`

```json
{
  "compilerOptions": {
    "strict": true
  }
}
```

`strict` 代表是否開啟 TypeScript 嚴格模式。

開啟後，TypeScript 會更嚴格地檢查型別，例如：

```ts
let name: string = null
```

在嚴格模式下，這通常會報錯，因為 `null` 不能直接賦值給 `string`。

---

### 2. `target`

```json
{
  "compilerOptions": {
    "target": "ES2020"
  }
}
```

`target` 代表 TypeScript 輸出或理解的 JavaScript 版本目標。

例如：

```json
"target": "ES2020"
```

代表專案可以使用較新的 JavaScript 語法特性。

---

### 3. `lib`

```json
{
  "compilerOptions": {
    "lib": ["ES2020", "DOM"]
  }
}
```

`lib` 用來告訴 TypeScript 目前環境有哪些內建 API。

例如 Vue 前端專案通常需要：

```json
"DOM"
```

這樣 TypeScript 才認得：

```ts
document.querySelector()
window.addEventListener()
HTMLElement
MouseEvent
```

如果沒有 `DOM`，TypeScript 可能會不認得瀏覽器相關 API。

---

### 4. `baseUrl` 與 `paths`

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

這是路徑別名設定。

有了這個設定後，TypeScript 可以理解：

```ts
import UserCard from '@/components/UserCard.vue'
```

等同於：

```ts
import UserCard from './src/components/UserCard.vue'
```

不過要注意：

> `tsconfig.json` 的 `paths` 只是讓 TypeScript 看得懂路徑別名。  
> 真正讓 Vite 開發與打包時也能解析 `@`，通常還要在 `vite.config.ts` 設定 alias。

例如：

```ts
// vite.config.ts
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})
```

因此可以這樣理解：

```text
tsconfig.json 的 paths：
讓 TypeScript / 編輯器知道 @ 是什麼。

vite.config.ts 的 resolve.alias：
讓 Vite 開發伺服器與打包工具知道 @ 是什麼。
```

---

### 5. `include` 與 `exclude`

```json
{
  "include": ["env.d.ts", "src/**/*", "src/**/*.vue"],
  "exclude": ["node_modules", "dist"]
}
```

`include` 代表哪些檔案要被 TypeScript 納入專案分析。

`exclude` 代表哪些檔案不要被納入。

常見設定：

```json
"include": ["src/**/*.ts", "src/**/*.vue"]
```

代表檢查 `src` 底下的 `.ts` 與 `.vue` 檔案。

---

## 四、`package.json` 和 `tsconfig.json` 的關係

安裝 TypeScript：

```bash
npm install -D typescript
```

之後 `package.json` 可能會出現：

```json
{
  "devDependencies": {
    "typescript": "^5.x.x"
  }
}
```

這代表專案安裝了 TypeScript 這個開發工具。

但要注意：

> 不是 `package.json` 的 `devDependencies` 去識別 `tsconfig.json`。  
> 而是 `typescript` 套件提供的 `tsc`，或其他 TypeScript 工具，去讀取 `tsconfig.json`。

流程可以理解為：

```text
package.json
  ↓
記錄專案安裝了 typescript
  ↓
node_modules 裡有 typescript 套件
  ↓
typescript 提供 tsc 指令
  ↓
執行 tsc / vue-tsc / 編輯器型別服務
  ↓
讀取 tsconfig.json
  ↓
根據 tsconfig.json 檢查 .ts / .vue 檔案
```

所以正確說法是：

```text
typescript / tsc / vue-tsc / 編輯器 TS 服務會讀取 tsconfig.json
```

不是：

```text
package.json 的 devDependencies 會讀取 tsconfig.json
```

---

## 五、Vue 專案為什麼常用 `vue-tsc`？

Vue 的 `.vue` 檔案不是純 TypeScript 檔案。

例如：

```vue
<script setup lang="ts">
import { ref } from 'vue'

const count = ref<number>(0)
</script>

<template>
  <button>{{ count }}</button>
</template>
```

TypeScript 官方的 `tsc` 原生主要理解 `.ts`、`.tsx`、`.js`、`.jsx`。

但 Vue SFC 是 `.vue`，裡面同時包含：

- `<template>`
- `<script>`
- `<script setup>`
- `<style>`

所以 Vue 專案通常會使用：

```bash
vue-tsc
```

它的用途是：

> 讓 TypeScript 能檢查 `.vue` 檔案中的 TypeScript 型別。

例如：

```json
{
  "scripts": {
    "type-check": "vue-tsc --noEmit",
    "build": "vue-tsc -b && vite build"
  }
}
```

這代表：

```text
vue-tsc --noEmit
  → 只做型別檢查，不輸出 JS 檔案。

vue-tsc -b && vite build
  → 先做 Vue + TS 型別檢查，通過後再讓 Vite 打包。
```

---

## 六、`package.json` 裡的 `types` / `typings` 是什麼？

在某些 npm 套件的 `package.json` 中，會看到：

```json
{
  "name": "my-utils",
  "main": "dist/index.js",
  "types": "dist/index.d.ts"
}
```

這裡的 `types` 是在告訴 TypeScript：

> 這個套件的型別宣告檔入口在 `dist/index.d.ts`。

也就是說：

```text
main / module
  → JavaScript 實際執行或打包入口

types / typings
  → TypeScript 型別宣告入口
```

例如別人使用這個套件：

```ts
import { formatDate } from 'my-utils'
```

TypeScript 會去找：

```json
"types": "dist/index.d.ts"
```

來理解 `formatDate` 的型別。

---

### `types`、`typings` 的差異

常見且標準的欄位是：

```json
"types": "dist/index.d.ts"
```

或舊一點的寫法：

```json
"typings": "dist/index.d.ts"
```

這兩者基本上用途相同。

---

## 七、`package.json` 的 `types` 和 `tsconfig.json` 的 `types` 不一樣

這兩個很容易混淆。

### 1. `package.json` 的 `types`

```json
{
  "types": "dist/index.d.ts"
}
```

意思是：

> 如果我是 npm 套件，我要告訴使用我的人，我的型別入口在哪裡。

這是「對外」提供型別。

---

### 2. `tsconfig.json` 的 `types`

```json
{
  "compilerOptions": {
    "types": ["node", "vite/client"]
  }
}
```

意思是：

> 目前這個專案要載入哪些全域型別套件。

例如：

```json
"types": ["node"]
```

會讓 TypeScript 認得：

```ts
process.env.NODE_ENV
```

例如：

```json
"types": ["vite/client"]
```

會讓 TypeScript 認得 Vite 的一些型別。

---

## 八、`*.d.ts` 檔案是什麼？

`*.d.ts` 是 TypeScript 的型別宣告檔。

你可以把它理解成：

> `.d.ts` 是只給 TypeScript 看的一份型別說明書，通常不會真的被瀏覽器執行。

最重要的區分：

```text
.ts
  = 實作邏輯 + 型別

.d.ts
  = 只有型別宣告，沒有實作邏輯
```

---

## 九、`.ts` 和 `.d.ts` 的差異

### 1. 一般 `.ts` 檔案

```ts
// money.ts
export function formatMoney(amount: number): string {
  return `$${amount.toFixed(2)}`
}
```

這個檔案包含：

```text
1. 真正執行邏輯
2. TypeScript 型別資訊
```

例如：

```ts
amount: number
```

和：

```ts
: string
```

都是型別資訊。

---

### 2. `.d.ts` 檔案

```ts
// money.d.ts
export function formatMoney(amount: number): string
```

這個檔案只是在宣告：

> 有一個 `formatMoney` 函式，它接收 `number`，回傳 `string`。

但它沒有真正實作：

```ts
return `$${amount.toFixed(2)}`
```

因此：

```text
money.ts
  → 真正的功能與型別

money.d.ts
  → 只描述功能的型別，不提供功能本身
```

---

## 十、`.d.ts` 不會提供真正功能

這點很重要。

假設你只有：

```ts
// math.d.ts
export function add(a: number, b: number): number
```

然後你寫：

```ts
import { add } from './math'

console.log(add(1, 2))
```

這不代表 `add` 真正存在。

`.d.ts` 只是告訴 TypeScript：

> 你可以相信有一個 `add` 函式，它的型別長這樣。

但執行時仍然需要真正的 JavaScript 或 TypeScript 實作，例如：

```js
// math.js
export function add(a, b) {
  return a + b
}
```

或：

```ts
// math.ts
export function add(a: number, b: number): number {
  return a + b
}
```

所以要記住：

```text
.d.ts 只管型別
.js / .ts / .vue 才管真正執行邏輯
```

---

## 十一、為什麼需要 `.d.ts`？

因為 TypeScript 有時候會遇到它原本不認識的東西。

常見情境：

```text
1. 使用 JavaScript 寫的套件，但沒有 TypeScript 型別
2. import 非 JS / TS 檔案，例如 .vue、.png、.svg、.css
3. 使用全域變數，例如 window.APP_CONFIG
4. 使用框架或建構工具提供的特殊物件，例如 import.meta.env
5. 開發 npm 套件，要把型別提供給其他人使用
```

---

## 十二、Vue 專案中的 `.d.ts` 常見用途

### 1. 宣告 Vite 型別

Vite 專案常見：

```ts
// env.d.ts
/// <reference types="vite/client" />
```

這代表：

> 載入 Vite 提供的型別。

有了它，TypeScript 才比較能理解：

```ts
import.meta.env
import.meta.env.VITE_API_URL
```

---

### 2. 宣告 `.vue` 模組

有些 Vue 專案會看到：

```ts
// shims-vue.d.ts
declare module '*.vue' {
  import type { DefineComponent } from 'vue'

  const component: DefineComponent<{}, {}, any>
  export default component
}
```

意思是：

> 以後只要 TypeScript 看到 `import Xxx from './Xxx.vue'`，就把它視為一個 Vue component。

例如：

```ts
import App from './App.vue'
```

TypeScript 原生不一定知道 `.vue` 是什麼檔案，因此需要透過宣告檔補充。

不過在較新的 Vue + Vite 專案中，`vue-tsc`、Vue 官方插件、Vite 型別等工具已經處理很多情境，所以不一定每個新專案都會看到完整的 `shims-vue.d.ts`。

---

### 3. 宣告圖片模組

例如：

```ts
import logo from '@/assets/logo.png'
```

TypeScript 可能會問：

```text
.png 是什麼模組？
import 進來的 logo 是什麼型別？
```

這時可以用 `.d.ts` 宣告：

```ts
declare module '*.png' {
  const src: string
  export default src
}
```

意思是：

> 以後 import `.png` 檔案時，把它當成 `string`，通常是圖片路徑。

---

### 4. 宣告 SVG 模組

```ts
declare module '*.svg' {
  const src: string
  export default src
}
```

這樣 TypeScript 才知道：

```ts
import icon from '@/assets/icon.svg'
```

`icon` 是一個字串路徑。

---

### 5. 宣告全域變數

例如舊系統或後端模板在 HTML 裡放了：

```html
<script>
  window.APP_CONFIG = {
    apiBaseUrl: '/api'
  }
</script>
```

在 TypeScript 中直接使用：

```ts
window.APP_CONFIG.apiBaseUrl
```

可能會報錯，因為 TypeScript 原本不知道 `window` 上有 `APP_CONFIG`。

可以建立：

```ts
// global.d.ts
declare global {
  interface Window {
    APP_CONFIG: {
      apiBaseUrl: string
    }
  }
}

export {}
```

這樣 TypeScript 就知道：

```ts
window.APP_CONFIG.apiBaseUrl
```

是合法的。

---

## 十三、如果自己使用 TypeScript 開發，還需要 `.d.ts` 嗎？

答案是：

> 自己寫的普通 TypeScript 業務程式，通常不需要額外寫 `.d.ts`。  
> 但只要 TypeScript 遇到它原本不認得的東西，就可能需要 `.d.ts`。

例如你自己寫：

```ts
// math.ts
export function add(a: number, b: number): number {
  return a + b
}
```

這裡已經有型別：

```ts
a: number
b: number
: number
```

所以不需要再寫：

```ts
// math.d.ts
export function add(a: number, b: number): number
```

這樣反而多餘。

---

### 比較精準的判斷方式

如果你的專案是：

```text
Vue + TypeScript
全部程式都自己寫
不使用任何第三方套件
不 import 圖片 / SVG / CSS module
不使用全域變數
不需要宣告 import.meta.env
```

那你幾乎不需要自己額外寫 `.d.ts`。

但實務上的 Vue 專案通常會用到：

```text
.vue
.png
.svg
import.meta.env
Vite 型別
第三方套件
全域設定
```

所以仍然常常會看到一些 `.d.ts`。

---

## 十四、第三方套件和 `.d.ts`

很多 npm 套件本身是 JavaScript 寫的，但 TypeScript 需要知道它們的型別。

有三種常見情況。

---

### 1. 套件自己內建型別

例如某些套件的 `package.json` 有：

```json
{
  "types": "dist/index.d.ts"
}
```

那 TypeScript 就知道去哪裡找型別。

---

### 2. 套件沒有內建型別，但有 `@types/xxx`

例如：

```bash
npm install lodash
npm install -D @types/lodash
```

`@types/lodash` 裡面主要就是 `.d.ts` 檔案。

它讓 TypeScript 知道 lodash 的 API 型別。

---

### 3. 套件完全沒有型別，需要自己宣告

例如：

```ts
import legacyPlugin from 'legacy-plugin'
```

如果 TypeScript 報錯：

```text
Could not find a declaration file for module 'legacy-plugin'
```

可以先建立：

```ts
declare module 'legacy-plugin'
```

這代表先告訴 TypeScript：

> 這個模組存在，先不要報找不到型別的錯。

但這種寫法型別很粗糙，通常等同於 `any`。

比較完整可以寫：

```ts
declare module 'legacy-plugin' {
  export function init(options: { debug: boolean }): void
}
```

這樣才有比較明確的型別檢查。

---

## 十五、為什麼沒有執行 `tsc`，寫程式時也會看到 TS 錯誤？

這是因為編輯器本身會在背景啟動 TypeScript 語言服務。

例如 VS Code 會啟動：

```text
tsserver
```

它會負責：

```text
1. 讀取 tsconfig.json
2. 分析目前專案的 .ts / .vue 檔案
3. 提供型別提示
4. 顯示紅線錯誤
5. 提供自動補全
6. 提供跳轉定義
7. 提供重新命名符號
```

所以即使你沒有手動執行：

```bash
npx tsc
npx vue-tsc
```

你還是會在編輯器中看到 TS 錯誤。

因為那些錯誤是編輯器背景分析出來的。

---

## 十六、開發時檢查 vs 命令列檢查

可以分成兩種情況。

### 1. 開發時：編輯器背景檢查

```text
VS Code / WebStorm
  ↓
TypeScript Language Service
  ↓
讀取 tsconfig.json
  ↓
顯示紅線、補全、跳轉、提示
```

這是在你寫程式時即時發生的。

---

### 2. 建置或檢查時：命令列工具檢查

```bash
npx tsc
npx vue-tsc
npm run type-check
npm run build
```

這些通常是你手動執行，或 CI/CD 流程執行。

流程是：

```text
tsc / vue-tsc
  ↓
讀取 tsconfig.json
  ↓
正式做型別檢查
  ↓
決定是否通過
```

---

## 十七、為什麼 VS Code 報錯，但 `npm run dev` 還能跑？

這在 Vue + Vite 專案中很常見。

因為 Vite 開發伺服器重點是快。

通常：

```bash
npm run dev
```

背後執行的是：

```bash
vite
```

Vite 會負責：

```text
1. 啟動開發伺服器
2. 轉換 .vue / .ts
3. 提供 HMR
4. 快速更新畫面
```

但 Vite 通常不做完整 TypeScript 型別檢查。

它使用 esbuild 轉譯 TypeScript 時，主要是把 TypeScript 型別移除，快速轉成 JavaScript。

所以可能出現：

```text
VS Code 有 TS 紅線
但 npm run dev 還是可以跑
```

這不代表型別錯誤不存在，而是開發伺服器不一定會因為型別錯誤停止。

---

## 十八、`vite build` 和 `vue-tsc` 的差異

### 1. 只執行 Vite build

```json
{
  "scripts": {
    "build": "vite build"
  }
}
```

這種 build 主要是打包。

它不一定會做完整 TypeScript 型別檢查。

---

### 2. 先執行 `vue-tsc`，再執行 Vite build

```json
{
  "scripts": {
    "build": "vue-tsc -b && vite build"
  }
}
```

這種比較嚴謹。

流程是：

```text
vue-tsc -b
  ↓
檢查 .ts / .vue 型別

如果通過：
  ↓
vite build
  ↓
打包專案

如果不通過：
  ↓
停止 build
```

所以企業專案或正式部署通常會希望 build script 包含型別檢查。

---

## 十九、整體關係圖

```text
package.json
  ├─ devDependencies
  │    ├─ typescript
  │    ├─ vue-tsc
  │    └─ vite
  │
  ├─ scripts
  │    ├─ dev: vite
  │    ├─ type-check: vue-tsc --noEmit
  │    └─ build: vue-tsc -b && vite build
  │
  └─ types / typings
       └─ 如果這個專案是 npm 套件，指定對外型別入口

tsconfig.json
  ├─ strict
  ├─ target
  ├─ lib
  ├─ baseUrl
  ├─ paths
  ├─ include
  ├─ exclude
  └─ types

*.d.ts
  ├─ 宣告 .vue 模組
  ├─ 宣告圖片 / SVG / CSS module
  ├─ 宣告 import.meta.env
  ├─ 宣告 window 全域變數
  └─ 宣告第三方 JS 套件型別

VS Code / Vue Official Extension / tsserver
  └─ 開發時讀取 tsconfig.json，顯示紅線與提示

tsc / vue-tsc
  └─ 命令列執行時讀取 tsconfig.json，做正式型別檢查
```

---

## 二十、用一句話重新理解每個角色

### `typescript`

> TypeScript 工具本體，提供型別系統、編譯器、語言服務能力。

---

### `tsconfig.json`

> TypeScript 在這個專案中的規則表。

---

### `tsc`

> TypeScript 官方命令列工具，主要檢查或編譯 `.ts` 檔案。

---

### `vue-tsc`

> Vue 專案專用的型別檢查工具，可以檢查 `.vue` 檔案中的 TypeScript。

---

### `package.json`

> 專案套件、指令、依賴、入口設定的總表。

---

### `package.json` 的 `types`

> 如果這是一個 npm 套件，告訴使用者：我的型別宣告入口在哪裡。

---

### `*.d.ts`

> TypeScript 型別宣告檔，只描述型別，不提供真正執行邏輯。

---

### 編輯器 TS 錯誤

> 不是因為你手動執行了 `tsc`，而是編輯器背景的 TypeScript 語言服務正在即時分析你的專案。

---

## 二十一、實務判斷：什麼時候該看哪個檔案？

### 1. import `@/xxx` 報錯

優先檢查：

```text
tsconfig.json 的 compilerOptions.paths
vite.config.ts 的 resolve.alias
```

因為可能是 TypeScript 認得，但 Vite 不認得；或 Vite 認得，但 TypeScript 不認得。

---

### 2. `import.meta.env` 報錯

優先檢查：

```text
env.d.ts
vite/client 型別
tsconfig.json include 是否包含 env.d.ts
```

常見宣告：

```ts
/// <reference types="vite/client" />
```

---

### 3. import `.vue` 報錯

優先檢查：

```text
Vue 官方插件
vue-tsc
shims-vue.d.ts
tsconfig.json include
```

---

### 4. import `.png` / `.svg` 報錯

可以檢查是否有：

```ts
declare module '*.png'
declare module '*.svg'
```

---

### 5. 第三方套件沒有型別

優先順序：

```text
1. 看套件本身有沒有內建 types
2. 看有沒有 @types/套件名
3. 自己寫 declare module
```

---

### 6. VS Code 有紅線，但專案仍能跑

檢查：

```text
1. 這是型別錯誤還是執行錯誤？
2. npm run dev 是否只是 vite？
3. build script 是否有 vue-tsc？
4. npm run type-check 是否會失敗？
```

---

## 二十二、常見誤解整理

### 誤解一：`package.json` 的 `devDependencies` 會識別 `tsconfig.json`

不精準。

正確是：

```text
devDependencies 只是記錄安裝了 typescript。
真正讀取 tsconfig.json 的是 tsc、vue-tsc、編輯器 TypeScript 服務等工具。
```

---

### 誤解二：只有執行 `npx tsc` 才會有 TS 錯誤

不正確。

正確是：

```text
編輯器在背景也會啟動 TypeScript Language Service，
所以你寫程式時就會看到 TS 錯誤。
```

---

### 誤解三：Vue + TS 專案就不需要 `.d.ts`

不完全正確。

正確是：

```text
自己寫的 TS 業務程式通常不需要額外 .d.ts。
但 Vue / Vite / 圖片 / SVG / 環境變數 / 全域物件 / 第三方套件仍可能需要 .d.ts。
```

---

### 誤解四：`.d.ts` 裡寫了函式，函式就真的存在

錯。

正確是：

```text
.d.ts 只提供型別宣告，不提供執行邏輯。
真正邏輯必須存在於 .js / .ts / .vue 等檔案中。
```

---

### 誤解五：Vite build 一定會檢查 TS 型別

不一定。

正確是：

```text
Vite 主要負責轉譯與打包。
完整 TS 型別檢查通常要靠 tsc / vue-tsc。
```

---

## 二十三、推薦你在 Vue 專案中的檢查習慣

閱讀一個 Vue + TS 專案時，可以照這個順序看：

```text
1. package.json
   - 看 scripts
   - 看 typescript / vue-tsc / vite 版本
   - 看 build 是否有 vue-tsc

2. tsconfig.json
   - 看 strict
   - 看 target / lib
   - 看 baseUrl / paths
   - 看 include / exclude
   - 看 types

3. vite.config.ts
   - 看 resolve.alias
   - 看 plugins
   - 看 define / env 相關設定

4. env.d.ts / shims-vue.d.ts / global.d.ts
   - 看專案補了哪些型別
   - 看有沒有宣告 .vue / .svg / .png / window.xxx

5. 實際 .vue / .ts 程式碼
   - 看型別錯誤是否與上述設定有關
```

---

## 二十四、最終心法

可以把整個系統想成這樣：

```text
TypeScript 是檢查員。

tsconfig.json 是檢查規則。

package.json 告訴你專案裝了哪些工具、可以執行哪些指令。

tsc / vue-tsc 是正式檢查工具。

VS Code / WebStorm 是開發時即時檢查工具。

*.d.ts 是補充說明書，用來告訴 TypeScript：
那些它原本不認識的東西，到底是什麼型別。
```

最精準的總結：

```text
如果是你自己用 TypeScript 寫的普通程式，型別通常已經寫在 .ts 裡，不需要額外 .d.ts。

如果 TypeScript 遇到它原本不認得的東西，例如 .vue、.png、import.meta.env、window.xxx、沒有型別的 JS 套件，就可能需要 .d.ts。

而 tsconfig.json 會被 tsc、vue-tsc、編輯器 TypeScript 服務讀取，不是只有手動執行指令時才會生效。
```

---

## 二十五、推薦下一步

完成本篇後，下一篇建議進入：

```text
01-06_從零Clone與啟動ViewUIPlus源碼.md
```

下一篇會開始實際 clone View UI Plus 本體源碼，並把本篇建立的 TypeScript / types / typings 觀念帶入 `package.json`、`types` 目錄與後續使用者專案檢查。
