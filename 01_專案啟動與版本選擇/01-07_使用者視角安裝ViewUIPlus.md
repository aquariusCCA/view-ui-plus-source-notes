# 01-07_使用者視角安裝 View UI Plus

> 所屬章節：`01_專案啟動與版本選擇`  
> 筆記定位：從「一般使用者」角度安裝、引入、使用 View UI Plus，並反推後續源碼閱讀方向  
> 適用目標：在正式深入 `src`、`install`、`dist`、`types` 前，先建立使用者端的操作基準  
> 建立日期：2026-05-04  
> 建議前置筆記：  
> - `01-01_ViewUIPlus專案定位與學習目標.md`  
> - `01-02_版本選擇策略_讀源碼要選哪個版本.md`  
> - `01-03_官方倉庫_npm_文檔站_資源入口整理.md`  
> - `01-04_本地開發環境準備_Node_pnpm_Vue版本.md`  
> - `01-05_從零Clone與啟動ViewUIPlus源碼.md`  
> - `01-06_啟動失敗排查清單.md`

---

## 1. 本篇要解決的問題

前面幾篇主要是從「讀源碼的人」角度出發：

```text
我要讀哪個版本？
我要 clone 哪個 repo？
我要用哪個 Node？
我要怎麼啟動 View UI Plus 本體？
啟動失敗要怎麼排查？
```

但元件庫不是只給維護者看的，它最終是給一般開發者使用的。

因此，在正式深入 View UI Plus 的源碼前，你必須先從使用者視角回答幾個問題：

```text
一般 Vue 3 專案如何安裝 View UI Plus？
如何在 main.ts 中引入？
是否需要引入 CSS？
第一個 Button / Input / Space 元件怎麼用？
使用者看到的 API 和源碼內部設計有什麼對應關係？
```

本篇的核心目標是：

> **建立一個乾淨的 Vue 3 測試專案，從使用者角度安裝與使用 View UI Plus，並把使用者 API 轉成後續讀源碼的問題清單。**

---

## 2. 本篇結論先講

官方 README 與官方安裝頁提供的安裝方式是：

```bash
npm install view-ui-plus --save
```

官方 README 也明確示範樣式引入：

```ts
import 'view-ui-plus/dist/styles/viewuiplus.css'
```

所以使用者視角下，最小使用流程是：

```text
Step 1：建立一個乾淨 Vue 3 專案
Step 2：安裝 view-ui-plus
Step 3：在 main.ts 引入 ViewUIPlus
Step 4：引入 viewuiplus.css
Step 5：app.use(ViewUIPlus)
Step 6：在 App.vue 使用 Button / Input / Space 等元件
Step 7：確認畫面、樣式、互動與打包是否正常
```

本篇建議建立的測試專案名稱：

```text
view-ui-plus-user-playground
```

推薦使用：

```text
Node：20.19+ 或 22.12+
package manager：pnpm
template：vue-ts
```

原因是這個專案是「現代使用者專案」，不是 View UI Plus 本體源碼。  
如果使用目前 Vite latest，應該依照 Vite 官方目前的 Node 要求處理。

---

## 3. 為什麼要先做使用者視角？

讀元件庫源碼時，如果你直接從 `src/components` 開始，很容易陷入：

```text
這個 props 是誰用的？
這個 install 是給誰調的？
這個 dist CSS 是誰引入的？
這個 types/index.d.ts 是在哪裡生效的？
為什麼要有 main？
為什麼 package.json 要寫 typings？
為什麼樣式要放在 dist/styles/viewuiplus.css？
```

使用者視角可以幫你先建立一條完整鏈路：

```text
npm install
    ↓
import ViewUIPlus from 'view-ui-plus'
    ↓
import 'view-ui-plus/dist/styles/viewuiplus.css'
    ↓
app.use(ViewUIPlus)
    ↓
template 使用 <Button />
    ↓
瀏覽器顯示有樣式的元件
```

這條鏈路會對應後續源碼章節：

```text
npm install        → 03_package與依賴分析
view-ui-plus       → 05_dist_打包產物分析
app.use            → 06_src_入口與插件機制
全域元件可用       → 07_元件註冊機制
viewuiplus.css     → 23_src-styles_樣式系統
TypeScript 提示    → 24_types_型別宣告
Button / Input API → 28_高階專題_元件API設計
```

---

## 4. 使用者視角與源碼視角的差異

### 4.1 使用者視角關心什麼？

使用者視角主要關心：

```text
怎麼安裝？
怎麼引入？
怎麼註冊？
怎麼使用元件？
樣式是否正常？
TypeScript 有沒有提示？
打包會不會成功？
是否能和 Vue Router / Pinia / Vite 搭配？
```

---

### 4.2 源碼視角關心什麼？

源碼視角主要關心：

```text
套件入口怎麼設計？
install 方法怎麼設計？
components 如何批次註冊？
樣式如何被編譯到 dist？
types 如何輸出？
props / emits / slots 如何定義？
globalProperties 是否有掛載？
命令式 API 如何暴露？
```

---

### 4.3 本篇只做使用者視角

本篇暫時不深入：

```text
View UI Plus 本體 source
install 原始碼
元件註冊細節
build script
dist 產物來源
types 生成方式
```

這些留到後面章節。

本篇只要求：

```text
你能像一般前端工程師一樣，在乾淨 Vue 3 專案中成功使用 View UI Plus。
```

---

## 5. 官方資訊確認

目前官方與公開資訊可確認：

| 項目 | 資訊 |
|---|---|
| 專案定位 | 基於 Vue.js 3 的企業級 UI 元件庫與前端解決方案 |
| npm package | `view-ui-plus` |
| 目前 package.json version | `1.3.24` |
| main | `dist/viewuiplus.min.js` |
| typings | `types/index.d.ts` |
| 官方安裝指令 | `npm install view-ui-plus --save` |
| 官方 CSS 引入 | `import 'view-ui-plus/dist/styles/viewuiplus.css'` |
| 官方 TS + Vite 範例 | `view-ui-project-ts` |
| 官方 Vite 範例 | `view-ui-project-vite` |

---

## 6. 建議測試目標

本篇的測試不是做一個完整系統，而是驗證使用者端鏈路。

你要完成：

```text
1. 建立 Vue 3 + TypeScript + Vite 專案
2. 安裝 view-ui-plus
3. 全量引入 View UI Plus
4. 引入 View UI Plus CSS
5. 使用 Button
6. 使用 Input
7. 使用 Space
8. 使用 Message 或 Modal 這類命令式 / 回饋元件
9. 確認 TypeScript 不報錯
10. 確認 pnpm build 成功
```

---

## 7. 建立乾淨測試專案

### 7.1 建議資料夾

建議放在：

```text
view-ui-plus-study/
└── experiments/
    └── view-ui-plus-user-playground/
```

---

### 7.2 切換到現代 Node 版本

如果你使用目前 Vite latest，請切到符合 Vite 要求的 Node 版本。

例如：

```bash
nvm use 20.19.0
```

確認：

```bash
node -v
pnpm -v
```

如果沒有 pnpm：

```bash
corepack enable
corepack prepare pnpm@latest --activate
pnpm -v
```

---

### 7.3 使用 pnpm 建立 Vue TS 專案

```bash
cd view-ui-plus-study/experiments

pnpm create vite view-ui-plus-user-playground --template vue-ts
cd view-ui-plus-user-playground
pnpm install
```

---

### 7.4 啟動初始專案

```bash
pnpm dev
```

打開終端提供的 local url，確認原始 Vue 頁面能正常打開。

這一步的意義是：

```text
先確認乾淨 Vue 專案本身能跑
再安裝 View UI Plus
```

如果乾淨專案都跑不起來，問題不在 View UI Plus，而在 Node、pnpm、Vite 或本機環境。

---

## 8. 安裝 View UI Plus

### 8.1 pnpm 安裝

```bash
pnpm add view-ui-plus
```

### 8.2 npm 安裝

如果你使用 npm：

```bash
npm install view-ui-plus --save
```

### 8.3 yarn 安裝

如果你使用 yarn：

```bash
yarn add view-ui-plus
```

本篇範例以 pnpm 為主，因為這是你自己的測試專案，不是 View UI Plus 本體源碼。

---

## 9. 確認安裝版本

安裝後執行：

```bash
pnpm list view-ui-plus
```

或：

```bash
npm list view-ui-plus
```

也可以看 `package.json`：

```json
{
  "dependencies": {
    "view-ui-plus": "^1.3.24"
  }
}
```

注意：

```text
^1.3.24 代表允許安裝相容範圍內的新 patch/minor 版本。
如果要完全固定版本，可以改成 1.3.24。
```

例如：

```bash
pnpm add view-ui-plus@1.3.24
```

或在 `package.json` 中改成：

```json
{
  "dependencies": {
    "view-ui-plus": "1.3.24"
  }
}
```

---

## 10. main.ts 全量引入

打開：

```text
src/main.ts
```

改成：

```ts
import { createApp } from 'vue'
import ViewUIPlus from 'view-ui-plus'
import 'view-ui-plus/dist/styles/viewuiplus.css'
import './style.css'
import App from './App.vue'

const app = createApp(App)

app.use(ViewUIPlus)

app.mount('#app')
```

這段程式碼中最重要的是：

```ts
import ViewUIPlus from 'view-ui-plus'
```

以及：

```ts
import 'view-ui-plus/dist/styles/viewuiplus.css'
```

---

## 11. 為什麼一定要引入 CSS？

View UI Plus 是元件庫，但元件的視覺樣式不會只靠 JavaScript 自動完成。

如果你只寫：

```ts
import ViewUIPlus from 'view-ui-plus'

app.use(ViewUIPlus)
```

但沒有：

```ts
import 'view-ui-plus/dist/styles/viewuiplus.css'
```

那你可能會看到：

```text
元件可以渲染
互動可能有效
但外觀看起來像原生 HTML
Button 沒有樣式
Input 沒有樣式
彈層位置或遮罩異常
```

所以使用者視角要記住：

```text
元件功能靠 JS
元件樣式靠 CSS
兩者都要引入
```

---

## 12. App.vue 第一版：最小驗證

把 `src/App.vue` 改成：

```vue
<template>
  <div class="page">
    <h1>View UI Plus 使用者視角測試</h1>

    <Space direction="vertical" size="large">
      <Button type="primary">Primary Button</Button>

      <Input
        v-model="keyword"
        placeholder="請輸入關鍵字"
        clearable
        style="width: 280px"
      />

      <p>目前輸入：{{ keyword || '尚未輸入' }}</p>
    </Space>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const keyword = ref('')
</script>

<style scoped>
.page {
  padding: 32px;
}

h1 {
  margin-bottom: 24px;
}
</style>
```

啟動：

```bash
pnpm dev
```

確認：

```text
Button 有 View UI Plus 樣式
Input 可以輸入
clearable 有效果
Space 有產生間距
沒有 TypeScript 錯誤
瀏覽器 console 沒有明顯錯誤
```

---

## 13. App.vue 第二版：加入 Message 測試

View UI Plus 除了 template 元件，也會有一些回饋型能力。

可以測試 `Message`：

```vue
<template>
  <div class="page">
    <h1>View UI Plus Message 測試</h1>

    <Space>
      <Button type="primary" @click="showSuccess">成功提示</Button>
      <Button @click="showInfo">一般提示</Button>
    </Space>
  </div>
</template>

<script setup lang="ts">
import { Message } from 'view-ui-plus'

const showSuccess = () => {
  Message.success('操作成功')
}

const showInfo = () => {
  Message.info('這是一個提示')
}
</script>

<style scoped>
.page {
  padding: 32px;
}
</style>
```

這裡要觀察：

```text
Message 是否能從 view-ui-plus named import
Message 是否能正常顯示
樣式是否正常
是否有 TypeScript 提示
```

這會對應後續：

```text
17_回饋_彈層_命令式元件
31_高階專題_命令式API設計
```

---

## 14. App.vue 第三版：表單基礎測試

表單系統是元件庫核心能力之一。  
先做一個最小表單測試：

```vue
<template>
  <div class="page">
    <h1>View UI Plus Form 測試</h1>

    <Form :model="form" :label-width="80">
      <FormItem label="姓名">
        <Input v-model="form.name" placeholder="請輸入姓名" />
      </FormItem>

      <FormItem label="城市">
        <Select v-model="form.city" placeholder="請選擇城市" style="width: 240px">
          <Option value="taipei">台北</Option>
          <Option value="taichung">台中</Option>
          <Option value="kaohsiung">高雄</Option>
        </Select>
      </FormItem>

      <FormItem>
        <Button type="primary" @click="submit">送出</Button>
      </FormItem>
    </Form>

    <pre>{{ form }}</pre>
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import { Message } from 'view-ui-plus'

const form = reactive({
  name: '',
  city: ''
})

const submit = () => {
  Message.success(`送出：${form.name || '未填姓名'}`)
}
</script>

<style scoped>
.page {
  padding: 32px;
}

pre {
  margin-top: 24px;
}
</style>
```

觀察：

```text
Form 是否正常排版
Input 是否可輸入
Select 是否可展開
Option 是否可選取
Button 是否可觸發 Message
```

這會對應後續：

```text
13_表單與輸入元件
14_表單驗證系統專題
32_高階專題_表單架構設計
```

---

## 15. 全量引入的意義

使用：

```ts
app.use(ViewUIPlus)
```

代表你把 View UI Plus 當成 Vue plugin 安裝。

使用者視角下，你只知道：

```text
app.use 後，很多元件可以直接在 template 中使用
```

但源碼視角下，你要問：

```text
ViewUIPlus 這個 default export 是什麼？
它是否有 install 方法？
install 方法做了什麼？
components 是怎麼被批次註冊的？
是否有 directives？
是否有 globalProperties？
是否註冊了 Message / Modal 這類命令式 API？
```

這會連到：

```text
06_src_入口與插件機制
07_元件註冊機制
08_全域配置與globalProperties
```

---

## 16. 全量引入的優點與缺點

### 16.1 優點

```text
最簡單
最適合第一次驗證
不用逐一 import 元件
不容易漏掉元件註冊
適合快速建立 demo
```

### 16.2 缺點

```text
可能引入較多元件
不利於最小 bundle
不適合對 bundle size 非常敏感的場景
不容易看出單元件依賴關係
```

第一輪使用者測試建議先全量引入。

等理解源碼後，再研究：

```text
按需引入
tree-shaking
babel-plugin-import
unplugin-vue-components
```

---

## 17. 使用者視角下的 package.json 觀察

安裝後，你的測試專案 `package.json` 可能類似：

```json
{
  "dependencies": {
    "@vitejs/plugin-vue": "xxx",
    "typescript": "xxx",
    "vite": "xxx",
    "vue": "xxx",
    "view-ui-plus": "^1.3.24"
  }
}
```

這裡要觀察：

```text
view-ui-plus 是 dependencies，不是 devDependencies
因為它是 runtime 會用到的元件庫
```

後續可以反推：

```text
為什麼元件庫本體 package.json 要提供 main？
為什麼要提供 typings？
為什麼要把 dist / src / types 放進 files？
```

---

## 18. 檢查 node_modules 中的 View UI Plus

安裝後可以查看：

```bash
ls node_modules/view-ui-plus
```

Windows PowerShell：

```powershell
Get-ChildItem node_modules/view-ui-plus
```

你可能會看到：

```text
dist
src
types
package.json
README.md
LICENSE
```

這和 View UI Plus 本體 `package.json` 中的 `files` 欄位有關：

```json
"files": [
  "dist",
  "src",
  "types"
]
```

這會對應：

```text
03_package與依賴分析
05_dist_打包產物分析
24_types_型別宣告
```

---

## 19. 檢查 dist 入口

可以查看：

```bash
ls node_modules/view-ui-plus/dist
ls node_modules/view-ui-plus/dist/styles
```

你要確認：

```text
dist/viewuiplus.min.js 是否存在
dist/styles/viewuiplus.css 是否存在
```

因為使用者端的 CSS 引入就是：

```ts
import 'view-ui-plus/dist/styles/viewuiplus.css'
```

這會連到後續問題：

```text
這個 CSS 是怎麼從 Less 產生的？
為什麼輸出到 dist/styles？
build:style 做了什麼？
```

---

## 20. 檢查 TypeScript 型別

可以查看：

```bash
ls node_modules/view-ui-plus/types
```

以及：

```bash
cat node_modules/view-ui-plus/package.json
```

注意其中：

```json
"typings": "types/index.d.ts"
```

這代表 TypeScript 會從這個入口找型別宣告。

使用者視角下，你可以觀察：

```text
import { Message } from 'view-ui-plus' 是否有提示？
Button / Input 在 template 中是否有提示？
TS 是否能識別 view-ui-plus module？
```

這會連到：

```text
24_types_型別宣告
28_高階專題_元件API設計
```

---

## 21. 測試 build

使用者專案不能只測 dev server，也要測 build。

```bash
pnpm build
```

如果成功，代表：

```text
Vite 能正確打包 View UI Plus
TypeScript 沒有阻塞
CSS import 能被處理
生產環境 bundle 可以產出
```

如果失敗，要記錄：

```text
錯在 TypeScript？
錯在 CSS？
錯在 module resolution？
錯在 Vite？
錯在 View UI Plus？
```

---

## 22. 測試 preview

build 後可以：

```bash
pnpm preview
```

打開 preview 網址，確認：

```text
Button 正常
Input 正常
Message 正常
CSS 正常
沒有 production-only 錯誤
```

這一步可以幫你確認：

```text
dev 正常不代表 production build 一定正常
```

---

## 23. 使用者視角的驗收標準

本篇完成後，至少要符合以下標準：

| 項目 | 標準 |
|---|---|
| 專案建立 | Vue 3 + TypeScript + Vite 專案建立成功 |
| 安裝 | `view-ui-plus` 安裝成功 |
| main.ts | `app.use(ViewUIPlus)` 正常 |
| CSS | `viewuiplus.css` 正常載入 |
| Button | 可正常顯示 |
| Input | 可正常輸入 |
| Space | 可正常排版 |
| Message | 可正常觸發 |
| Form | 可正常顯示與操作 |
| dev | `pnpm dev` 成功 |
| build | `pnpm build` 成功 |
| preview | `pnpm preview` 成功或至少可執行 |
| TypeScript | 沒有阻塞性型別錯誤 |
| Console | 無明顯 runtime error |

---

## 24. 使用者視角錯誤排查

### 24.1 元件有出現，但沒有樣式

優先檢查：

```ts
import 'view-ui-plus/dist/styles/viewuiplus.css'
```

如果沒有引入，補上。

---

### 24.2 `Failed to resolve component: Button`

可能原因：

```text
沒有 app.use(ViewUIPlus)
main.ts 沒有正確掛載
App.vue 中元件名稱錯誤
dev server 沒重啟
```

檢查：

```ts
app.use(ViewUIPlus)
```

---

### 24.3 `Cannot find module 'view-ui-plus'`

可能原因：

```text
沒有安裝成功
node_modules 損壞
pnpm install 沒跑
目前不在正確專案
```

處理：

```bash
pnpm install
pnpm add view-ui-plus
```

---

### 24.4 TypeScript 找不到型別

先檢查：

```text
node_modules/view-ui-plus/types/index.d.ts
```

再檢查：

```text
node_modules/view-ui-plus/package.json 的 typings
```

如果 still 有問題，重啟 VS Code TS Server：

```text
Command Palette → TypeScript: Restart TS Server
```

---

### 24.5 Message 沒有顯示

檢查：

```ts
import { Message } from 'view-ui-plus'
```

以及：

```text
CSS 是否載入
瀏覽器 console 是否報錯
是否點擊事件有觸發
```

可以先加：

```ts
console.log('clicked')
```

確認事件有執行。

---

### 24.6 build 失敗

先確認：

```bash
node -v
pnpm -v
pnpm list vite
pnpm list vue
pnpm list view-ui-plus
```

如果是現代 Vite 專案，Node 版本要符合 Vite 目前要求。

---

## 25. 使用者測試紀錄模板

建議建立：

```text
logs/user-playground-record.md
```

內容如下：

```md
# View UI Plus 使用者視角測試紀錄

## 1. 專案資訊

| 項目 | 內容 |
|---|---|
| 專案名稱 | view-ui-plus-user-playground |
| 建立方式 | pnpm create vite --template vue-ts |
| Node | 待填 |
| pnpm | 待填 |
| Vue | 待填 |
| Vite | 待填 |
| TypeScript | 待填 |
| View UI Plus | 待填 |

## 2. 安裝指令

```bash
pnpm add view-ui-plus
```

## 3. main.ts 引入方式

```ts
import ViewUIPlus from 'view-ui-plus'
import 'view-ui-plus/dist/styles/viewuiplus.css'

app.use(ViewUIPlus)
```

## 4. 測試元件

| 元件 | 是否成功 | 備註 |
|---|---|---|
| Button | 待填 |  |
| Input | 待填 |  |
| Space | 待填 |  |
| Message | 待填 |  |
| Form | 待填 |  |
| Select | 待填 |  |

## 5. 指令結果

| 指令 | 是否成功 | 備註 |
|---|---|---|
| pnpm dev | 待填 |  |
| pnpm build | 待填 |  |
| pnpm preview | 待填 |  |

## 6. 問題紀錄

| 問題 | 原因 | 解法 |
|---|---|---|
| 待填 | 待填 | 待填 |
```

---

## 26. 從使用者 API 反推源碼問題

使用者視角測完後，要把每個使用行為轉成源碼問題。

### 26.1 `import ViewUIPlus from 'view-ui-plus'`

反推問題：

```text
package.json 的 main 指向哪裡？
default export 是什麼？
ViewUIPlus 是否是一個 plugin object？
是否有 install 方法？
```

對應章節：

```text
03_package與依賴分析
05_dist_打包產物分析
06_src_入口與插件機制
```

---

### 26.2 `app.use(ViewUIPlus)`

反推問題：

```text
install(app) 做了什麼？
components 如何被註冊？
directives 是否被註冊？
全域配置是否被掛載？
命令式 API 是否被掛到 app.config.globalProperties？
```

對應章節：

```text
06_src_入口與插件機制
07_元件註冊機制
08_全域配置與globalProperties
31_高階專題_命令式API設計
```

---

### 26.3 `<Button type="primary" />`

反推問題：

```text
Button 元件在哪個目錄？
type prop 如何定義？
primary 對應哪些 class？
樣式在哪裡？
是否有 TypeScript 型別限制？
```

對應章節：

```text
11_基礎通用元件
23_src-styles_樣式系統
24_types_型別宣告
28_高階專題_元件API設計
```

---

### 26.4 `<Input v-model="keyword" />`

反推問題：

```text
Input 如何實作 v-model？
modelValue / update:modelValue 是否存在？
clearable 如何設計？
focus / blur / input 事件如何處理？
```

對應章節：

```text
13_表單與輸入元件
29_高階專題_受控與非受控狀態
```

---

### 26.5 `<Form :model="form" />`

反推問題：

```text
Form 如何收集 FormItem？
model 如何向下傳遞？
rules 如何設計？
驗證器如何整合？
FormItem 如何知道自己的 prop？
```

對應章節：

```text
14_表單驗證系統專題
32_高階專題_表單架構設計
```

---

### 26.6 `Message.success(...)`

反推問題：

```text
Message 是元件還是函式？
它如何動態建立實例？
是否使用 createVNode / render？
是否有單例或佇列管理？
CSS 如何掛載？
```

對應章節：

```text
17_回饋_彈層_命令式元件
31_高階專題_命令式API設計
```

---

## 27. 不要在本篇做的事

本篇不要深入：

```text
逐行分析 src/index
逐行分析 Button
逐行分析 Form
研究 build script
改 View UI Plus 本體源碼
研究 dist 壓縮檔
研究所有元件 API
做企業級二次封裝
```

這些都不是本篇目標。

本篇只做：

```text
使用者安裝
使用者引入
使用者驗證
使用者 API 觀察
源碼問題反推
```

---

## 28. 本篇和其他章節的關係

| 後續章節 | 本篇提供的基礎 |
|---|---|
| `03_package與依賴分析` | 使用者安裝後可對照 package.json |
| `05_dist_打包產物分析` | 使用者 import 會對應 dist 入口 |
| `06_src_入口與插件機制` | `app.use(ViewUIPlus)` 會反推 install |
| `07_元件註冊機制` | template 可直接用元件，代表全域註冊成功 |
| `08_全域配置與globalProperties` | 命令式 API 與全域配置需要後續追 |
| `11_基礎通用元件` | Button 是第一個觀察點 |
| `13_表單與輸入元件` | Input / Select / Form 是後續重點 |
| `14_表單驗證系統專題` | Form 測試會引出驗證設計 |
| `17_回饋_彈層_命令式元件` | Message 測試會引出命令式 API |
| `23_src-styles_樣式系統` | CSS import 會引出樣式打包 |
| `24_types_型別宣告` | TS 使用體驗會引出 typings |
| `28_高階專題_元件API設計` | 使用者 API 是設計反推基礎 |

---

## 29. 本篇學習產出

完成本篇後，你應該產出：

```text
1. 一個乾淨 Vue 3 + TypeScript + Vite 測試專案
2. 一份 user-playground-record.md
3. 一份 main.ts 引入範例
4. 一份 App.vue 測試範例
5. 一張使用者 API → 源碼問題 對照表
```

---

## 30. 本篇檢核表

完成本篇後，請確認：

- [ ] 我知道本篇是使用者視角，不是源碼本體視角。
- [ ] 我已建立乾淨 Vue 3 + TypeScript + Vite 專案。
- [ ] 我已使用 pnpm 或 npm 安裝 `view-ui-plus`。
- [ ] 我知道官方安裝指令是 `npm install view-ui-plus --save`。
- [ ] 我已在 `main.ts` 中引入 `ViewUIPlus`。
- [ ] 我已在 `main.ts` 中引入 `view-ui-plus/dist/styles/viewuiplus.css`。
- [ ] 我知道不引入 CSS 會導致元件樣式不完整。
- [ ] 我已使用 `app.use(ViewUIPlus)`。
- [ ] 我已成功顯示 `Button`。
- [ ] 我已成功使用 `Input v-model`。
- [ ] 我已成功使用 `Space`。
- [ ] 我已測試 `Message.success`。
- [ ] 我已測試基本 `Form / FormItem / Select`。
- [ ] 我已執行 `pnpm dev`。
- [ ] 我已執行 `pnpm build`。
- [ ] 我已確認瀏覽器 console 沒有明顯錯誤。
- [ ] 我已查看 `node_modules/view-ui-plus/dist`。
- [ ] 我已查看 `node_modules/view-ui-plus/types`。
- [ ] 我知道 `app.use(ViewUIPlus)` 後續要對應 `install` 機制。
- [ ] 我知道 `viewuiplus.css` 後續要對應樣式系統與 build:style。
- [ ] 我知道 `Message` 後續要對應命令式 API。
- [ ] 我已完成使用者 API → 源碼問題對照。

---

## 31. 推薦下一步

完成本篇後，下一篇建議進入：

```text
01-08_源碼讀碼視角與使用者視角的差異.md
```

原因是本篇已經建立「使用者怎麼用」；下一篇要正式整理：

```text
使用者看到的 API
和
源碼作者設計的結構
到底如何對應
```

這樣進入：

```text
02_根目錄與工程設定
03_package與依賴分析
06_src_入口與插件機制
```

時，會更有方向。

---

## 32. 參考資料

| 類型 | 資源 |
|---|---|
| View UI Plus GitHub | https://github.com/view-design/ViewUIPlus |
| View UI Plus package.json | https://github.com/view-design/ViewUIPlus/blob/master/package.json |
| View UI Plus npm | https://www.npmjs.com/package/view-ui-plus |
| 官方安裝頁 | https://www.iviewui.com/view-ui-plus/guide/install |
| 官方文檔首頁 | https://www.iviewui.com |
| 官方 TypeScript + Vite 範例 | https://github.com/view-design/view-ui-project-ts |
| 官方 Vite 範例 | https://github.com/view-design/view-ui-project-vite |
| Vite Getting Started | https://vite.dev/guide/ |

---

## 33. 本篇一句話總結

> 在讀 View UI Plus 源碼前，先像一般 Vue 3 使用者一樣建立乾淨專案、安裝 `view-ui-plus`、引入 `viewuiplus.css`、使用 `app.use(ViewUIPlus)`，再把 Button、Input、Form、Message 的使用行為反推成後續源碼閱讀問題。
