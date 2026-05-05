# 01-04_本地開發環境準備：Node、pnpm、Vue 版本

> 所屬章節：`01_專案啟動與版本選擇`  
> 筆記定位：View UI Plus 讀碼前的本地開發環境準備 SOP  
> 適用目標：讓 View UI Plus 源碼、官方範例、使用者測試專案都能穩定啟動  
> 建立日期：2026-05-04  
> 建議前置筆記：  
> - `01-01_ViewUIPlus專案定位與學習目標.md`  
> - `01-02_版本選擇策略_讀源碼要選哪個版本.md`  
> - `01-03_官方倉庫_npm_文檔站_資源入口整理.md`

---

## 1. 本篇要解決的問題

讀 View UI Plus 源碼前，不能只做一件事：

```bash
npm install
npm run dev
```

原因是 View UI Plus 的環境會牽涉三種不同視角：

```text
1. View UI Plus 元件庫本體
2. 官方範例專案
3. 你自己建立的乾淨測試專案
```

這三種專案的環境需求不一定完全一樣。

以目前查核到的資訊來看：

| 專案 | 主要定位 | 版本特徵 |
|---|---|---|
| `ViewUIPlus` 本體 | 元件庫源碼 | `view-ui-plus@1.3.24`，內部同時有 Vue CLI、Vite、Gulp、Less 等較舊工程依賴 |
| `view-ui-project-ts` | 官方 TypeScript + Vite 範例 | Vue 3、View UI Plus、TypeScript、Vite，偏現代使用者專案 |
| `view-ui-project-vite` | 官方 Vite 範例 | Vue 3、View UI Plus、Vite，偏快速整合專案 |
| 自己的測試專案 | 驗證安裝與 API | 可用最新版 Vite / Vue，但要記錄版本 |

所以本篇的核心問題是：

> **如何準備一套不容易踩坑、可回溯、可長期維護的本地讀碼環境？**

---

## 2. 本篇結論先講

建議不要只裝一個 Node 版本，而是準備兩組環境：

```text
穩定讀碼環境：Node 16.20.x
現代測試環境：Node 20 LTS 或符合目前 Vite 要求的版本
```

推薦策略如下：

| 使用場景 | 建議 Node | 建議套件管理器 | 說明 |
|---|---:|---|---|
| 讀 View UI Plus 本體源碼 | Node 16.20.x | npm 優先 | 避免舊 Vue CLI / Webpack / Gulp / Less 工具鏈在新 Node 上出問題 |
| 跑官方 TypeScript + Vite 範例 | Node 20 LTS 優先 | npm 或 pnpm | 官方範例使用較新的 Vue / Vite / TypeScript |
| 建立自己的使用者測試專案 | Node 20.19+ 或 Node 22.12+ | pnpm 優先 | 若使用目前 Vite latest，需符合 Vite 當前 Node 要求 |
| 分析 npm 安裝結果 | Node 20 LTS | pnpm 或 npm | 用乾淨專案觀察 `node_modules`、dist、types |
| 第一輪筆記撰寫 | 以穩定讀碼環境為準 | 不混用 | 先求能跑、能對照、能回查 |

本篇建議原則：

```text
View UI Plus 本體：先用 npm，不要急著改 pnpm
自己的實驗專案：可以用 pnpm
Node 版本：用 nvm / fnm 管理，不要全域只裝一個版本
Vue 版本：本體依 package.json，測試專案依當前 Vue / Vite 生態
```

---

## 3. 為什麼環境準備要獨立成一篇？

因為讀開源專案時，很多時間不是花在理解架構，而是卡在：

```text
Node 版本不合
npm / pnpm 行為不同
lockfile 不一致
peerDependencies 衝突
Vue compiler 版本不一致
Vite 版本太新或太舊
Webpack / OpenSSL 問題
Less / Gulp / loader 版本問題
Windows 路徑問題
ESLint 舊版規則問題
```

如果你沒有先建立環境策略，就會把「環境錯誤」誤判成「源碼難懂」。

本篇的目標不是把所有錯誤都提前解決，而是先建立一套判斷邏輯：

```text
先判斷自己正在跑哪一種專案
再選對 Node 版本
再選對套件管理器
再決定是否允許升級依賴
最後才開始讀源碼
```

---

## 4. 三種環境要分開看

### 4.1 環境一：View UI Plus 本體源碼環境

這是你後續讀碼的主環境。

用途：

```text
看 src
看 components
看 directives
看 utils
看 styles
看 types
看 package.json
看 build scripts
嘗試啟動本體 examples / dev server
```

這個環境的第一原則是：

> **不要急著升級依賴。**

因為你的目標不是把專案改成最新，而是先理解原作者當前版本的工程結構。

---

### 4.2 環境二：官方範例專案環境

官方範例專案用來理解：

```text
使用者如何在 Vue 3 專案中引入 View UI Plus
main.ts 如何註冊
樣式如何引入
router / pinia / vite 如何搭配
.env 如何配置
```

這個環境和本體源碼不同。

例如官方 TypeScript 範例專案是：

```text
Vue 3 + Vue Router + Pinia + View UI Plus + TypeScript + Vite
```

它比較像你未來做企業後台專案時的樣板，而不是元件庫本體。

---

### 4.3 環境三：自己的乾淨測試專案

這是你自己建立的實驗環境。

用途：

```text
測試 npm install view-ui-plus
測試全量引入
測試按需引入
測試 CSS 引入
測試某個元件 API
測試自己仿寫元件
測試企業封裝元件
```

這個環境建議使用比較新的 Node / Vite / pnpm。

原因是：

```text
這是使用者視角，不是源碼讀碼視角
```

---

## 5. 最終建議環境矩陣

### 5.1 第一輪讀碼推薦環境

| 項目 | 建議 |
|---|---|
| OS | Windows 10/11、macOS、Linux 均可 |
| Shell | Windows 建議 PowerShell / Git Bash；macOS / Linux 用 zsh 或 bash |
| Git | 2.x 以上 |
| Node 管理工具 | nvm-windows / nvm / fnm |
| View UI Plus 本體 Node | `16.20.x` 優先 |
| 官方範例 Node | `20.x LTS` 優先 |
| 自建測試專案 Node | `20.19+` 或 `22.12+` |
| 本體套件管理器 | npm 優先 |
| 測試專案套件管理器 | pnpm 優先 |
| Vue 版本 | 本體依 package.json；測試專案依安裝時版本 |
| IDE | VS Code |
| Vue 外掛 | Vue - Official |
| TypeScript | 依專案 package.json，不要強行統一 |

---

### 5.2 為什麼本體建議先用 Node 16？

View UI Plus 本體目前的 `package.json` 中可以看到：

```text
@vue/cli-service ~4.5.0
vite ^2.6.4
gulp ^4.0.2
less ^2.7.3
less-loader ^4.1.0
typescript ^3.3.4000
vue ^3.2.47
```

這代表它不是一個完全用最新版 Vite / TypeScript / Vue 建立的現代專案。

因此第一輪讀碼建議：

```text
先用 Node 16.20.x 跑本體
不要一開始就用 Node 22 / Node 24
```

不是因為 Node 20 或 22 一定不能跑，而是：

```text
舊 Vue CLI / Webpack / Less / loader 工具鏈在新 Node 上更容易遇到相容性問題
```

讀碼階段的目標是：

```text
先讓專案穩定啟動
不要把時間耗在升級工具鏈
```

---

### 5.3 為什麼測試專案可以用 Node 20 或更新？

你自己建立的測試專案通常會使用目前的 Vite / Vue 生態。

如果使用目前的 Vite latest，官方文件已要求較新的 Node 版本。  
因此自建測試專案建議使用：

```text
Node 20.19+
或
Node 22.12+
```

這樣比較符合現代 Vite 專案的要求。

---

## 6. Node.js 版本管理

### 6.1 不建議只安裝單一全域 Node

不要只在電腦全域安裝一個 Node，然後所有專案都用它。

原因：

```text
舊專案可能需要 Node 16
新 Vite 專案可能需要 Node 20+
公司專案可能被鎖定 Node 14 / 16 / 18
不同工具鏈對 Node 的支援不同
```

建議一定要使用版本管理工具。

---

### 6.2 Windows 建議：nvm-windows

Windows 可以使用：

```text
nvm-windows
```

常用指令：

```bash
nvm list
nvm install 16.20.2
nvm install 20.19.0
nvm use 16.20.2
node -v
npm -v
```

如果你要跑 View UI Plus 本體：

```bash
nvm use 16.20.2
```

如果你要建立新的 Vite 測試專案：

```bash
nvm use 20.19.0
```

---

### 6.3 macOS / Linux 建議：nvm 或 fnm

macOS / Linux 可用：

```text
nvm
fnm
```

nvm 範例：

```bash
nvm install 16
nvm install 20
nvm use 16
node -v
npm -v
```

fnm 範例：

```bash
fnm install 16
fnm install 20
fnm use 16
node -v
```

---

### 6.4 建議建立 `.nvmrc`

在不同專案根目錄建立 `.nvmrc`，記錄建議 Node 版本。

View UI Plus 本體讀碼環境：

```text
16.20.2
```

自建 Vite 測試專案：

```text
20.19.0
```

之後進入專案後可以：

```bash
nvm use
```

這樣可以避免忘記切 Node 版本。

---

## 7. npm、pnpm、yarn 要怎麼選？

### 7.1 View UI Plus 本體：npm 優先

View UI Plus 官方 README 的安裝方式是：

```bash
npm install view-ui-plus --save
```

而本體 `package.json` scripts 也使用 npm 組合，例如：

```json
{
  "build": "npm run build:prod && npm run build:style && npm run build:lang"
}
```

所以第一輪讀碼建議：

```text
本體源碼先用 npm
不要一開始強制改成 pnpm
```

---

### 7.2 自己的測試專案：pnpm 優先

你的實驗專案可以用 pnpm。

原因：

```text
安裝快
磁碟佔用少
依賴結構比較嚴格
適合建立多個實驗專案
適合未來 monorepo / workspace 練習
```

例如：

```bash
pnpm create vite view-ui-plus-playground --template vue-ts
cd view-ui-plus-playground
pnpm install
pnpm add view-ui-plus
pnpm dev
```

---

### 7.3 官方範例專案：先照 README

官方 TypeScript / Vite 範例 README 都寫：

```bash
npm install
npm run serve
npm run build
```

所以第一輪建議先照官方 README 跑。

如果你想改用 pnpm，應該另開分支或另 clone 一份，不要直接污染原始範例。

---

### 7.4 不要混用 lockfile

同一個專案不要混用：

```text
package-lock.json
pnpm-lock.yaml
yarn.lock
```

建議規則：

| 專案類型 | 建議 lockfile |
|---|---|
| View UI Plus 本體 | 依官方 repo 既有 lockfile；若無，第一輪用 npm install |
| 官方範例 | 依官方 repo 既有 lockfile；若無，先 npm install |
| 自己測試專案 | pnpm-lock.yaml |
| 公司專案 | 跟團隊一致 |

如果你發現同一個專案中有多個 lockfile，要先判斷：

```text
哪個是官方實際使用的？
哪個是別人殘留的？
哪個和 package manager 對應？
```

---

## 8. pnpm 環境準備

### 8.1 安裝 pnpm

如果你使用 Node 16+，可以透過 corepack 管理 pnpm：

```bash
corepack enable
corepack prepare pnpm@latest --activate
pnpm -v
```

如果環境中沒有 corepack，也可以用 npm 安裝：

```bash
npm install -g pnpm
pnpm -v
```

---

### 8.2 建議不要全域亂升 pnpm

pnpm 版本本身也會影響 lockfile 與 node_modules 行為。

建議在自己的測試專案中記錄：

```bash
node -v
pnpm -v
```

並寫到：

```text
01-10_版本鎖定與讀碼基準紀錄.md
```

---

### 8.3 為什麼 pnpm 可能暴露更多問題？

pnpm 的依賴結構比 npm 嚴格。

有些專案在 npm 下能跑，是因為 npm 的 node_modules 結構比較寬鬆；換成 pnpm 後，可能出現：

```text
某個套件沒有明確宣告依賴
某個工具假設依賴被 hoist
某個舊 loader 找不到 peer dependency
某個 script 對 node_modules 結構有隱含假設
```

這不是 pnpm 壞，而是 pnpm 比較容易暴露依賴宣告不完整的問題。

所以：

```text
讀源碼本體：先求穩，用 npm
練現代工程：再用 pnpm
```

---

## 9. Vue 版本策略

### 9.1 View UI Plus 本體的 Vue 版本

View UI Plus 本體的 `package.json` 中，開發依賴包含：

```text
vue ^3.2.47
@vue/compiler-sfc ^3.0.0
vue-router 4.0.14
```

因此讀本體源碼時，不建議直接升級到最新 Vue。

第一輪建議：

```text
照 package.json 安裝
不要自行把 vue 升到 3.4 / 3.5 / 更高版本
```

原因是你現在要理解的是：

```text
View UI Plus 目前這個版本如何設計與運作
```

不是要先做相容性升級。

---

### 9.2 官方範例專案的 Vue 版本

官方 TypeScript / Vite 範例專案目前使用較新的依賴，例如：

```text
vue ^3.4.0
vue-router ^4.2.0
pinia ^3.0.3
vite ^6.0.0
typescript ^5.3.0
```

這代表官方範例專案更接近現代使用者專案。

所以你要分清楚：

```text
本體源碼的 Vue 版本
不一定等於
官方範例專案的 Vue 版本
```

---

### 9.3 自己測試專案的 Vue 版本

如果你使用：

```bash
pnpm create vite view-ui-plus-playground --template vue-ts
```

拿到的通常會是當前 Vite / Vue 生態推薦的版本。

這是合理的，但要記錄：

```bash
node -v
pnpm -v
pnpm list vue
pnpm list view-ui-plus
```

因為你的測試結果只代表：

```text
View UI Plus 在這個測試專案依賴組合下的行為
```

不一定等於 View UI Plus 本體開發環境的行為。

---

## 10. TypeScript 版本策略

### 10.1 本體源碼不要先升 TypeScript

View UI Plus 本體目前使用較舊的 TypeScript 版本：

```text
typescript ^3.3.4000
```

如果你一開始就升到 TypeScript 5.x，可能會遇到：

```text
型別檢查規則變嚴
舊寫法報錯
第三方型別不相容
build script 額外失敗
```

所以第一輪讀碼時：

```text
不要主動升級 TypeScript
```

---

### 10.2 範例專案可以看現代 TypeScript 寫法

官方 TypeScript 範例專案使用：

```text
typescript ^5.3.0
```

這適合用來看：

```text
Vue 3 + TS + Vite 的現代專案配置
```

但不代表 View UI Plus 本體已經全面使用 TypeScript 5 的工程設定。

---

## 11. Vite 版本策略

### 11.1 本體與範例的 Vite 版本不同

View UI Plus 本體目前 `package.json` 中有：

```text
vite ^2.6.4
@vitejs/plugin-vue ^1.9.3
```

官方 TypeScript 範例目前有：

```text
vite ^6.0.0
@vitejs/plugin-vue ^5.0.0
```

這代表：

```text
本體打包環境和範例使用環境不是同一代工具鏈
```

---

### 11.2 不要把 Vite 文件最新要求直接套回本體

目前 Vite 官方文件對 latest 版本有較新的 Node 要求。  
但 View UI Plus 本體使用的是舊版 Vite。

因此：

```text
新建測試專案：照目前 Vite latest 的 Node 要求
View UI Plus 本體：照本體 package.json 與舊工具鏈相容性處理
```

---

### 11.3 讀碼時要問的問題

後續進入 `04_build_打包腳本與建置流程.md` 時，要特別看：

```text
dev 使用 Vue CLI 還是 Vite？
dev2 為什麼存在？
build:prod 走 Vite？
build:style 為什麼走 Gulp？
build:lang 為什麼有獨立 vite config？
```

這些都和環境準備有關。

---

## 12. IDE 與編輯器準備

### 12.1 建議使用 VS Code

建議使用 VS Code，原因：

```text
Vue SFC 支援成熟
TypeScript 支援成熟
搜尋與跳轉方便
Git 整合方便
可以搭配 Markdown 筆記
```

---

### 12.2 建議安裝外掛

| 外掛 | 用途 |
|---|---|
| Vue - Official | Vue 3 / SFC / TypeScript 支援 |
| ESLint | 看 lint 問題 |
| Prettier | 格式化 Markdown / JS / TS / Vue |
| GitLens | 看 commit / blame / history |
| Markdown All in One | 寫筆記 |
| Path Intellisense | 路徑提示 |
| npm Intellisense | npm 套件提示 |
| Error Lens | 即時錯誤提示 |

---

### 12.3 VS Code 工作區建議

可以建立一個 workspace：

```text
view-ui-plus-study.code-workspace
```

包含：

```text
ViewUIPlus source
view-ui-project-ts
view-ui-project-vite
自己的 playground
notes
```

範例：

```json
{
  "folders": [
    {
      "name": "source_ViewUIPlus",
      "path": "source/ViewUIPlus"
    },
    {
      "name": "example_ts",
      "path": "examples/view-ui-project-ts"
    },
    {
      "name": "example_vite",
      "path": "examples/view-ui-project-vite"
    },
    {
      "name": "playground",
      "path": "experiments/view-ui-plus-playground"
    },
    {
      "name": "notes",
      "path": "notes"
    }
  ]
}
```

---

## 13. Git 環境準備

### 13.1 必備設定

確認 Git 是否可用：

```bash
git --version
```

建議設定：

```bash
git config --global core.autocrlf false
git config --global pull.rebase false
```

Windows 使用者如果遇到換行問題，可以視團隊習慣調整 `core.autocrlf`。

---

### 13.2 clone 後先記錄版本

clone View UI Plus 後，立刻執行：

```bash
git status
git branch --show-current
git rev-parse HEAD
git remote -v
```

記錄到：

```text
01-10_版本鎖定與讀碼基準紀錄.md
```

---

### 13.3 建立讀碼分支

不要直接在 `master` 上做實驗。

建議：

```bash
git checkout -b study/view-ui-plus-1.3.24
```

用途：

```text
加 console
加註解
臨時改元件
做 build 實驗
測試樣式變化
```

---

## 14. 建議本地資料夾結構

建議建立：

```text
view-ui-plus-study/
├── source/
│   └── ViewUIPlus/
├── examples/
│   ├── view-ui-project-ts/
│   └── view-ui-project-vite/
├── experiments/
│   ├── view-ui-plus-playground/
│   ├── component-api-test/
│   └── style-test/
├── notes/
│   ├── 00_總覽與讀碼策略/
│   ├── 01_專案啟動與版本選擇/
│   └── ...
└── logs/
    ├── install-log.md
    ├── error-log.md
    └── env-record.md
```

用途說明：

| 資料夾 | 用途 |
|---|---|
| `source` | 放 View UI Plus 本體源碼 |
| `examples` | 放官方範例專案 |
| `experiments` | 放自己的實驗專案 |
| `notes` | 放 Markdown 筆記 |
| `logs` | 放安裝、啟動、錯誤紀錄 |

---

## 15. 環境安裝 SOP：View UI Plus 本體

### 15.1 clone 專案

```bash
mkdir view-ui-plus-study
cd view-ui-plus-study

mkdir source
cd source

git clone https://github.com/view-design/ViewUIPlus.git
cd ViewUIPlus
```

---

### 15.2 切換 Node

```bash
nvm use 16.20.2
node -v
npm -v
```

如果你沒有安裝：

```bash
nvm install 16.20.2
nvm use 16.20.2
```

---

### 15.3 記錄版本

```bash
git branch --show-current
git rev-parse HEAD
node -v
npm -v
```

建議寫到：

```text
logs/env-record.md
```

---

### 15.4 安裝依賴

第一輪建議：

```bash
npm install
```

如果專案有 `package-lock.json`，也可以考慮：

```bash
npm ci
```

但如果沒有 lockfile，不要硬用 `npm ci`。

---

### 15.5 查看 scripts

```bash
npm run
```

或直接看：

```bash
cat package.json
```

你要特別注意：

```text
dev
dev2
build
build:style
build:prod
build:lang
lint
```

---

### 15.6 嘗試啟動

可能的指令：

```bash
npm run dev
```

或：

```bash
npm run dev2
```

具體要以當前 `package.json` 為準。

---

## 16. 環境安裝 SOP：官方 TypeScript + Vite 範例

### 16.1 clone 專案

```bash
cd view-ui-plus-study

mkdir examples
cd examples

git clone https://github.com/view-design/view-ui-project-ts.git
cd view-ui-project-ts
```

---

### 16.2 切換 Node

```bash
nvm use 20.19.0
node -v
npm -v
```

---

### 16.3 安裝與啟動

官方 README 提供的流程是：

```bash
npm install
npm run serve
```

Build：

```bash
npm run build
npm run build:staging
```

Preview：

```bash
npm run preview
npm run preview:staging
```

---

### 16.4 觀察重點

啟動後不要只看畫面，要觀察：

```text
main.ts 如何引入 View UI Plus？
是否全量引入？
CSS 從哪裡引入？
router 如何配置？
pinia 如何掛載？
env mode 如何切換？
vite config 如何配置？
```

---

## 17. 環境安裝 SOP：自己的 pnpm 測試專案

### 17.1 建立專案

```bash
cd view-ui-plus-study

mkdir experiments
cd experiments

pnpm create vite view-ui-plus-playground --template vue-ts
cd view-ui-plus-playground
pnpm install
```

---

### 17.2 安裝 View UI Plus

```bash
pnpm add view-ui-plus
```

---

### 17.3 引入 View UI Plus

在 `main.ts` 中：

```ts
import { createApp } from 'vue'
import ViewUIPlus from 'view-ui-plus'
import 'view-ui-plus/dist/styles/viewuiplus.css'
import App from './App.vue'

const app = createApp(App)

app.use(ViewUIPlus)
app.mount('#app')
```

---

### 17.4 寫第一個測試元件

在 `App.vue` 中先測：

```vue
<template>
  <Space direction="vertical">
    <Button type="primary">Primary Button</Button>
    <Input v-model="value" placeholder="請輸入內容" />
  </Space>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const value = ref('')
</script>
```

---

### 17.5 記錄測試專案版本

```bash
node -v
pnpm -v
pnpm list vue
pnpm list view-ui-plus
pnpm list vite
```

記錄到：

```text
logs/env-record.md
```

---

## 18. Windows 特別注意事項

### 18.1 路徑不要太深

Windows 路徑過深可能造成 node_modules 或工具鏈問題。

不建議：

```text
C:\Users\xxx\Desktop\very\long\path\many\folders\view-ui-plus-study
```

建議：

```text
D:\code\view-ui-plus-study
```

或：

```text
C:\code\view-ui-plus-study
```

---

### 18.2 路徑不要含中文與空白

雖然現代工具大多能處理，但舊工具鏈有時仍會出問題。

不建議：

```text
D:\前端學習\View UI Plus 專案
```

建議：

```text
D:\code\view-ui-plus-study
```

---

### 18.3 PowerShell 執行權限

如果執行 script 出現權限問題，可以檢查：

```powershell
Get-ExecutionPolicy
```

必要時改成：

```powershell
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
```

---

### 18.4 Git Bash 作為備用

如果 PowerShell 跑某些 script 行為怪異，可以用 Git Bash 試試。

---

## 19. 環境變數與代理設定

### 19.1 npm registry

台灣環境通常直接用官方 npm registry 即可。

查看：

```bash
npm config get registry
```

設定官方 registry：

```bash
npm config set registry https://registry.npmjs.org/
```

pnpm：

```bash
pnpm config get registry
pnpm config set registry https://registry.npmjs.org/
```

---

### 19.2 公司網路或代理

如果在公司環境遇到安裝失敗，要確認：

```text
是否有 proxy
是否有公司憑證
是否禁止 GitHub
是否禁止 npm registry
是否需要 VPN
```

可以查：

```bash
npm config get proxy
npm config get https-proxy
```

---

## 20. 本地環境紀錄模板

建議建立：

```text
logs/env-record.md
```

內容如下：

```md
# View UI Plus 本地環境紀錄

## 1. 機器資訊

| 項目 | 內容 |
|---|---|
| OS | Windows 11 |
| Shell | PowerShell / Git Bash |
| Git | 待填 |
| VS Code | 待填 |

## 2. Node 版本

| 使用場景 | Node | npm | pnpm |
|---|---:|---:|---:|
| View UI Plus 本體 | 16.20.2 | 待填 | 不使用 |
| 官方 TS 範例 | 20.19.0 | 待填 | 可選 |
| 自建測試專案 | 20.19.0 | 待填 | 待填 |

## 3. View UI Plus 本體

| 項目 | 內容 |
|---|---|
| repository | https://github.com/view-design/ViewUIPlus |
| branch | 待填 |
| tag | 待填 |
| commit hash | 待填 |
| package version | 待填 |
| install command | 待填 |
| dev command | 待填 |
| build command | 待填 |

## 4. 官方範例專案

| 專案 | Node | package manager | install | run |
|---|---:|---|---|---|
| view-ui-project-ts | 待填 | npm | npm install | npm run serve |
| view-ui-project-vite | 待填 | npm | npm install | npm run serve |

## 5. 自建測試專案

| 項目 | 內容 |
|---|---|
| template | vue-ts |
| package manager | pnpm |
| Vue version | 待填 |
| Vite version | 待填 |
| View UI Plus version | 待填 |
```

---

## 21. 啟動失敗時先不要做的事

當專案啟動失敗時，不要立刻做：

```bash
npm audit fix --force
npm update
npm install vue@latest
npm install vite@latest
npm install typescript@latest
刪掉 package.json 重新建
把 npm 改成 pnpm
```

這些操作可能讓問題更複雜。

第一輪應該先做：

```text
確認 Node 版本
確認 npm / pnpm 版本
確認是否混用 lockfile
刪除 node_modules
刪除錯誤的 lockfile
重新 install
查看完整錯誤訊息
搜尋錯誤關鍵字
記錄錯誤到 logs/error-log.md
```

---

## 22. 清理重裝流程

### 22.1 npm 專案

```bash
rm -rf node_modules
rm -f package-lock.json
npm cache verify
npm install
```

Windows PowerShell：

```powershell
Remove-Item -Recurse -Force node_modules
Remove-Item -Force package-lock.json
npm cache verify
npm install
```

如果你希望保留 lockfile，就不要刪 `package-lock.json`。

---

### 22.2 pnpm 專案

```bash
rm -rf node_modules
rm -f pnpm-lock.yaml
pnpm store prune
pnpm install
```

Windows PowerShell：

```powershell
Remove-Item -Recurse -Force node_modules
Remove-Item -Force pnpm-lock.yaml
pnpm store prune
pnpm install
```

---

## 23. 常見環境錯誤分類

### 23.1 Node 版本錯誤

可能表現：

```text
engine not compatible
ERR_OSSL_EVP_UNSUPPORTED
SyntaxError: Unexpected token
Cannot use import statement outside a module
```

處理方式：

```text
先切 Node 16 跑本體
新 Vite 專案再切 Node 20+
```

---

### 23.2 Vue compiler 版本不一致

可能表現：

```text
Vue packages version mismatch
@vue/compiler-sfc version mismatch
```

處理方式：

```bash
npm list vue
npm list @vue/compiler-sfc
```

確認版本是否被自己升級過。

---

### 23.3 Less / loader 問題

可能表現：

```text
less-loader error
Cannot find module less
this.getOptions is not a function
```

處理方式：

```text
不要先升 less-loader
確認 package.json 版本
切回相容 Node
重新安裝
```

---

### 23.4 peerDependencies 問題

可能表現：

```text
ERESOLVE unable to resolve dependency tree
peer dependency warning
```

處理方式：

```bash
npm install --legacy-peer-deps
```

但這應該作為排查手段，不是第一選項。  
使用後要記錄在環境紀錄中。

---

### 23.5 pnpm 嚴格依賴問題

可能表現：

```text
Cannot find module xxx
```

處理方式：

```text
確認是不是在本體源碼使用了 pnpm
如果是第一輪讀本體，改回 npm 試一次
```

---

## 24. 啟動成功的判斷標準

不要只看到 terminal 沒報錯就算成功。

你要確認：

```text
1. dev server 是否成功啟動
2. 瀏覽器是否能開啟頁面
3. CSS 是否正常載入
4. 元件是否能互動
5. console 是否沒有明顯 runtime error
6. hot reload 是否有效
7. 修改一個簡單元件後是否能更新
8. build 是否能完成
```

---

## 25. 建議先做的三個環境實驗

### 25.1 實驗一：本體源碼啟動

目標：

```text
確認 View UI Plus 本體能安裝依賴並啟動
```

紀錄：

```text
Node version
npm version
install command
run command
是否成功
錯誤訊息
```

---

### 25.2 實驗二：官方 TS 範例啟動

目標：

```text
確認官方 TypeScript + Vite 範例能跑
```

紀錄：

```text
main.ts 引入方式
CSS 引入方式
View UI Plus 版本
Vue 版本
Vite 版本
```

---

### 25.3 實驗三：自己的 pnpm playground

目標：

```text
確認使用者視角安裝 View UI Plus 是否正常
```

紀錄：

```text
pnpm add view-ui-plus
Button 是否顯示
Input 是否可輸入
CSS 是否正常
build 是否成功
```

---

## 26. 環境與後續章節的關係

| 後續章節 | 本篇環境準備的作用 |
|---|---|
| `01-05_Vue專案TypeScript設定與型別宣告前置知識` | 說明 Vue / Vite / TypeScript 專案設定與型別入口 |
| `01-06_從零Clone與啟動ViewUIPlus源碼` | 直接依本篇 Node / npm 策略執行 |
| `01-07_啟動失敗排查清單` | 本篇提供錯誤分類基礎 |
| `01-08_使用者視角安裝ViewUIPlus` | 自建 pnpm playground 會用到 |
| `02_根目錄與工程設定` | 需要本地 clone 後觀察目錄 |
| `03_package與依賴分析` | 需要理解 dependency / devDependency |
| `04_build_打包腳本與建置流程` | 需要理解 dev / dev2 / build script |
| `05_dist_打包產物分析` | 需要 build 或 npm package 對照 |
| `25_examples_範例與Demo` | 需要官方範例專案 |
| `36_仿寫與重構` | 需要自己的 playground |
| `38_企業後台元件封裝實戰` | 需要官方 TS 範例與自建專案 |

---

## 27. 本篇不要深入的內容

本篇只處理環境準備，不深入：

```text
package.json 每個依賴的功能
build script 的完整流程
Vite config 細節
Vue CLI config 細節
Gulp 打包樣式流程
dist 產物結構
TypeScript 型別宣告設計
```

這些會留到後續章節。

本篇只要求你做到：

```text
環境可切換
依賴可安裝
專案可啟動
版本可記錄
錯誤可回溯
```

---

## 28. 本篇學習產出

完成本篇後，你應該產出以下內容。

---

### 28.1 一份本地資料夾

```text
view-ui-plus-study/
```

內含：

```text
source
examples
experiments
notes
logs
```

---

### 28.2 一份環境紀錄

```text
logs/env-record.md
```

至少記錄：

```text
OS
Git
Node
npm
pnpm
View UI Plus commit
View UI Plus version
安裝指令
啟動指令
```

---

### 28.3 三個可執行環境

```text
View UI Plus 本體源碼
官方 TypeScript + Vite 範例
自己的 pnpm playground
```

---

## 29. 本篇檢核表

完成本篇後，請確認：

- [ ] 我知道 View UI Plus 本體、官方範例、自建測試專案是三種不同環境。
- [ ] 我知道本體源碼第一輪建議用 Node 16.20.x。
- [ ] 我知道官方範例與自建 Vite 專案可用 Node 20 LTS 或更符合當前 Vite 要求的版本。
- [ ] 我已安裝 Node 版本管理工具。
- [ ] 我可以在 Node 16 與 Node 20 之間切換。
- [ ] 我知道本體源碼第一輪建議先用 npm。
- [ ] 我知道自己的測試專案可以用 pnpm。
- [ ] 我知道不要混用 `package-lock.json`、`pnpm-lock.yaml`、`yarn.lock`。
- [ ] 我知道本體源碼的 Vue / Vite / TypeScript 版本和官方範例不同。
- [ ] 我已建立本地資料夾結構。
- [ ] 我已建立 `logs/env-record.md`。
- [ ] 我知道啟動失敗時不要先亂升級依賴。
- [ ] 我知道如何記錄 Node、npm、pnpm、Vue、Vite、View UI Plus 版本。
- [ ] 我知道下一篇要先補齊 Vue 專案 TypeScript 設定與型別宣告前置知識。

---

## 30. 推薦下一步

本篇完成後，下一篇建議進入：

```text
01-05_Vue專案TypeScript設定與型別宣告前置知識.md
```

下一篇要先釐清：

```text
tsconfig.json 如何影響型別檢查
package.json types / typings 是什麼
vue-tsc 和 tsc 的差異
.d.ts 在 Vue 專案中的角色
```

---

## 31. 參考資料

| 類型 | 資源 |
|---|---|
| View UI Plus GitHub | https://github.com/view-design/ViewUIPlus |
| View UI Plus package.json | https://github.com/view-design/ViewUIPlus/blob/master/package.json |
| View UI Plus npm | https://www.npmjs.com/package/view-ui-plus |
| View UI Plus 安裝頁 | https://www.iviewui.com/view-ui-plus/guide/install |
| TypeScript + Vite 範例 | https://github.com/view-design/view-ui-project-ts |
| Vite 範例 | https://github.com/view-design/view-ui-project-vite |
| Vite 官方文件 | https://vite.dev/guide/ |

---

## 32. 本篇一句話總結

> View UI Plus 讀碼環境不要只求「裝起來」，而是要把本體源碼、官方範例、自建測試專案分成三套環境管理；本體先求穩定可回溯，測試專案再使用較新的 Node、Vite、Vue 與 pnpm。
