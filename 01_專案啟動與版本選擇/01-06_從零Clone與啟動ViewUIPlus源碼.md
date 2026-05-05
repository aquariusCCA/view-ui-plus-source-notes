# 01-06_從零 Clone 與啟動 View UI Plus 源碼

> 所屬章節：`01_專案啟動與版本選擇`  
> 筆記定位：View UI Plus 源碼 clone、版本鎖定、依賴安裝、啟動與驗收 SOP  
> 適用目標：第一次把 View UI Plus 本體源碼拉到本地，並建立可回溯的讀碼環境  
> 建立日期：2026-05-04  
> 建議前置筆記：  
> - `01-01_ViewUIPlus專案定位與學習目標.md`  
> - `01-02_版本選擇策略_讀源碼要選哪個版本.md`  
> - `01-03_官方倉庫_npm_文檔站_資源入口整理.md`  
> - `01-04_本地開發環境準備_Node_pnpm_Vue版本.md`  
> - `01-05_Vue專案TypeScript設定與型別宣告前置知識.md`

---

## 1. 本篇要解決的問題

前面幾篇已經處理了：

```text
View UI Plus 是什麼
要讀哪個版本
官方資源入口在哪裡
本地環境要如何準備
```

本篇開始進入實際操作：

> **從零 clone View UI Plus 源碼，切換版本，安裝依賴，啟動專案，並把整個過程記錄成可回溯的讀碼基準。**

這篇不是單純教你輸入幾行指令，而是要建立一套「日後讀其他開源專案也能套用」的啟動流程。

---

## 2. 本篇結論先講

View UI Plus 本體目前 `package.json` 中可以看到：

```json
{
  "name": "view-ui-plus",
  "version": "1.3.24",
  "main": "dist/viewuiplus.min.js",
  "typings": "types/index.d.ts",
  "scripts": {
    "dev": "vue-cli-service serve",
    "dev2": "vite --config vite.config.dev.js",
    "build": "npm run build:prod && npm run build:style && npm run build:lang",
    "build:style": "gulp --gulpfile build/build-style.js",
    "build:prod": "vite build",
    "build:lang": "vite build --config build/vite.lang.config.js",
    "lint": "vue-cli-service lint --fix"
  }
}
```

所以第一輪啟動建議採用：

```text
Node：16.20.x 優先
package manager：npm 優先
第一啟動指令：npm run dev2
第二驗證指令：npm run dev
打包驗證：npm run build
```

為什麼 `dev2` 優先？

因為 `dev2` 使用的是：

```bash
vite --config vite.config.dev.js
```

通常比舊的 Vue CLI / Webpack 工具鏈更適合作為第一輪快速啟動入口。

但因為 `package.json` 同時保留了：

```bash
npm run dev
```

所以完整筆記仍要記錄兩條啟動路線：

```text
dev  ：Vue CLI 啟動路線
dev2 ：Vite 啟動路線
```

---

## 3. 本篇操作總覽

完整流程如下：

```text
Step 1：建立本地學習資料夾
Step 2：clone View UI Plus 官方倉庫
Step 3：確認遠端來源
Step 4：確認 branch / tag / commit
Step 5：確認 package.json 版本與 scripts
Step 6：切換 Node 版本
Step 7：安裝依賴
Step 8：啟動 dev2
Step 9：啟動 dev
Step 10：執行 build 驗證
Step 11：記錄環境與錯誤
Step 12：建立讀碼基準
```

---

## 4. 操作前檢查清單

開始前先確認你已經準備好以下工具。

| 工具 | 檢查指令 | 建議 |
|---|---|---|
| Git | `git --version` | 必備 |
| Node | `node -v` | 本體源碼建議 Node 16.20.x |
| npm | `npm -v` | 第一輪建議用 npm |
| nvm | `nvm list` | 建議使用版本管理工具 |
| VS Code | 手動確認 | 建議安裝 Vue - Official |
| Shell | PowerShell / Git Bash / zsh | Windows 建議備用 Git Bash |

---

## 5. 建議本地資料夾位置

不要把專案放在太深、含中文、含空白的路徑。

不建議：

```text
C:\Users\你的名字\Desktop\前端學習\View UI Plus 源碼讀碼專案
```

建議：

```text
D:\code\view-ui-plus-study
```

或：

```text
C:\code\view-ui-plus-study
```

macOS / Linux 可用：

```text
~/code/view-ui-plus-study
```

---

## 6. 建立學習目錄

### 6.1 Windows PowerShell

```powershell
mkdir D:\code\view-ui-plus-study
cd D:\code\view-ui-plus-study

mkdir source
mkdir examples
mkdir experiments
mkdir notes
mkdir logs
```

---

### 6.2 macOS / Linux / Git Bash

```bash
mkdir -p ~/code/view-ui-plus-study
cd ~/code/view-ui-plus-study

mkdir -p source examples experiments notes logs
```

---

### 6.3 建議目錄結構

```text
view-ui-plus-study/
├── source/
│   └── ViewUIPlus/
├── examples/
├── experiments/
├── notes/
└── logs/
    ├── env-record.md
    ├── install-log.md
    ├── run-log.md
    └── error-log.md
```

各資料夾用途：

| 資料夾 | 用途 |
|---|---|
| `source` | 放 View UI Plus 本體源碼 |
| `examples` | 放官方範例專案 |
| `experiments` | 放自己的測試專案 |
| `notes` | 放讀碼筆記 |
| `logs` | 放環境、安裝、啟動、錯誤紀錄 |

---

## 7. Clone View UI Plus 官方倉庫

進入 `source`：

```bash
cd view-ui-plus-study/source
```

clone：

```bash
git clone https://github.com/view-design/ViewUIPlus.git
```

進入專案：

```bash
cd ViewUIPlus
```

確認目前狀態：

```bash
git status
git remote -v
git branch --show-current
git rev-parse HEAD
```

你應該把結果記錄到：

```text
logs/env-record.md
```

---

## 8. 版本確認

### 8.1 確認 package.json version

在 ViewUIPlus 根目錄執行：

```bash
node -p "require('./package.json').version"
```

預期目前可能看到：

```text
1.3.24
```

也可以直接查看：

```bash
cat package.json
```

Windows PowerShell：

```powershell
Get-Content package.json
```

---

### 8.2 確認 package name

```bash
node -p "require('./package.json').name"
```

預期：

```text
view-ui-plus
```

---

### 8.3 確認 main 與 typings

```bash
node -p "require('./package.json').main"
node -p "require('./package.json').typings"
```

預期類似：

```text
dist/viewuiplus.min.js
types/index.d.ts
```

這代表：

```text
main：npm 使用者引入的主要打包入口
typings：TypeScript 型別入口
```

後續會在這兩章深入：

```text
05_dist_打包產物分析
24_types_型別宣告
```

---

## 9. 確認 Git tag

查看所有 tag：

```bash
git tag -l
```

查特定版本：

```bash
git tag -l "v1.3.24"
git tag -l "1.3.24"
```

目前 GitHub tags 頁面可見的較新 tag 包含 `v1.3.20`，但 npm 與 master `package.json` 顯示版本為 `1.3.24`。  
因此正式操作時要以你本地的 `git tag -l` 結果為準。

---

### 9.1 如果存在 `v1.3.24`

可以切到對應 tag：

```bash
git checkout tags/v1.3.24 -b study/view-ui-plus-1.3.24
```

---

### 9.2 如果不存在 `v1.3.24`

那就不要硬猜。

先使用目前 clone 下來的分支，並記錄 commit hash：

```bash
git branch --show-current
git rev-parse HEAD
```

然後建立讀碼分支：

```bash
git checkout -b study/view-ui-plus-1.3.24
```

筆記中要記錄：

```text
version：1.3.24
tag：未確認 / 未找到
commit hash：實際填入
```

---

## 10. 建立讀碼分支

不要直接在 `master` 上加註解或做實驗。

建議：

```bash
git checkout -b study/view-ui-plus-source
```

如果你想把版本放進分支名：

```bash
git checkout -b study/view-ui-plus-1.3.24
```

讀碼分支用途：

```text
加 console
加註解
暫時修改元件
測試 build
測試樣式
測試元件行為
```

但要記住：

> **讀碼分支是你的實驗區，不是官方版本本身。**

---

## 11. 切換 Node 版本

### 11.1 建議使用 Node 16.20.x

View UI Plus 本體包含較舊的工程依賴，例如：

```text
@vue/cli-service ~4.5.0
vite ^2.6.4
gulp ^4.0.2
less ^2.7.3
less-loader ^4.1.0
typescript ^3.3.4000
```

因此第一輪啟動建議：

```bash
nvm use 16.20.2
```

如果沒有安裝：

```bash
nvm install 16.20.2
nvm use 16.20.2
```

確認：

```bash
node -v
npm -v
```

---

### 11.2 建議建立 `.nvmrc`

在 ViewUIPlus 根目錄建立：

```bash
echo "16.20.2" > .nvmrc
```

之後可以直接：

```bash
nvm use
```

注意：

```text
如果你不想修改官方源碼工作區，可以不要提交 .nvmrc。
也可以只把 .nvmrc 當成本地讀碼輔助檔。
```

---

## 12. 安裝依賴前的檢查

在安裝前先看根目錄有哪些 lockfile：

```bash
ls
```

或：

```bash
find . -maxdepth 1 -name "*lock*"
```

Windows PowerShell：

```powershell
Get-ChildItem *lock*
```

你要確認是否存在：

```text
package-lock.json
pnpm-lock.yaml
yarn.lock
```

第一輪原則：

```text
如果官方有 package-lock.json：優先 npm ci
如果沒有 package-lock.json：使用 npm install
不要一開始就用 pnpm 重建依賴
不要混用 lockfile
```

---

## 13. 安裝依賴

### 13.1 推薦第一輪

```bash
npm install
```

如果有 `package-lock.json` 且你想完全依照 lockfile：

```bash
npm ci
```

---

### 13.2 安裝後檢查

```bash
npm list --depth=0
```

或只查幾個重點依賴：

```bash
npm list vue
npm list vite
npm list @vue/cli-service
npm list gulp
npm list less
npm list typescript
```

這些結果建議記錄到：

```text
logs/install-log.md
```

---

### 13.3 如果安裝時出現 peer dependency 錯誤

不要立刻升級所有依賴。

可以先嘗試：

```bash
npm install --legacy-peer-deps
```

但要在筆記中記錄：

```text
本次安裝使用 npm install --legacy-peer-deps
原因：填入錯誤訊息摘要
```

---

## 14. 查看 scripts

安裝完依賴前後，都可以查看 scripts。

```bash
npm run
```

或：

```bash
node -p "require('./package.json').scripts"
```

目前 View UI Plus 本體的 scripts 重點如下：

| script | 指令 | 用途判斷 |
|---|---|---|
| `dev` | `vue-cli-service serve` | Vue CLI / Webpack 開發啟動 |
| `dev2` | `vite --config vite.config.dev.js` | Vite 開發啟動 |
| `build` | `npm run build:prod && npm run build:style && npm run build:lang` | 完整打包 |
| `build:prod` | `vite build` | JS / 元件庫主要打包 |
| `build:style` | `gulp --gulpfile build/build-style.js` | 樣式打包 |
| `build:lang` | `vite build --config build/vite.lang.config.js` | 語言包打包 |
| `lint` | `vue-cli-service lint --fix` | ESLint 修復 |

---

## 15. 第一啟動路線：`npm run dev2`

### 15.1 為什麼先試 dev2？

`dev2` 使用：

```bash
vite --config vite.config.dev.js
```

它比較適合第一輪快速驗證：

```text
依賴是否正常
Vite 是否能啟動
examples 或 dev config 是否能跑
元件庫是否能在瀏覽器中被展示
```

---

### 15.2 執行

```bash
npm run dev2
```

如果啟動成功，終端通常會顯示本地網址，例如：

```text
http://localhost:xxxx/
```

具體 port 以終端輸出為準。

---

### 15.3 啟動後檢查

打開瀏覽器後，檢查：

```text
頁面是否能開啟
是否有 View UI Plus 元件展示
CSS 是否正常
瀏覽器 console 是否有紅色錯誤
修改源碼是否有 hot reload
terminal 是否持續正常
```

---

### 15.4 記錄 run-log

在 `logs/run-log.md` 記錄：

```md
## npm run dev2

| 項目 | 內容 |
|---|---|
| 日期 | 2026-05-04 |
| Node | 16.20.2 |
| npm | 待填 |
| 指令 | npm run dev2 |
| 是否成功 | 是 / 否 |
| local url | 待填 |
| 錯誤摘要 | 無 / 待填 |
| 備註 | 待填 |
```

---

## 16. 第二啟動路線：`npm run dev`

### 16.1 這條路線代表什麼？

`dev` 使用：

```bash
vue-cli-service serve
```

這代表它走的是 Vue CLI / Webpack 開發路線。

這條路線對你後續理解專案很重要，因為：

```text
package.json 中同時存在 Vue CLI 與 Vite
這代表專案可能有歷史包袱或過渡期工具鏈
讀碼時不能只用現代 Vite 專案思維判斷它
```

---

### 16.2 執行

```bash
npm run dev
```

---

### 16.3 啟動後檢查

同樣確認：

```text
terminal 是否成功
local url 是否出現
瀏覽器是否能開
CSS 是否正常
console 是否有 runtime error
修改元件是否能更新
```

---

### 16.4 dev 與 dev2 都要記錄

你後續要建立這張表：

| 指令 | 是否成功 | local url | 啟動工具 | 備註 |
|---|---|---|---|---|
| `npm run dev2` | 待填 | 待填 | Vite | 第一輪優先 |
| `npm run dev` | 待填 | 待填 | Vue CLI | 對照路線 |

---

## 17. 打包驗證：`npm run build`

### 17.1 為什麼需要 build？

只啟動 dev server 不代表專案真的能發布。

元件庫專案至少要驗證：

```text
JS 打包是否成功
CSS 樣式是否成功
語言包是否成功
dist 是否產生
types 是否存在
```

View UI Plus 的完整 build 是：

```bash
npm run build
```

它會依序執行：

```bash
npm run build:prod
npm run build:style
npm run build:lang
```

---

### 17.2 先分段測試

如果完整 build 失敗，建議分段執行：

```bash
npm run build:prod
npm run build:style
npm run build:lang
```

這樣可以知道失敗點是在：

```text
Vite JS 打包
Gulp style 打包
語言包打包
```

---

### 17.3 Build 後檢查

檢查是否有：

```text
dist/
dist/viewuiplus.min.js
dist/styles/
dist/styles/viewuiplus.css
types/
```

可用：

```bash
ls dist
ls dist/styles
ls types
```

Windows PowerShell：

```powershell
Get-ChildItem dist
Get-ChildItem dist/styles
Get-ChildItem types
```

---

### 17.4 Build 紀錄模板

```md
## npm run build

| 項目 | 內容 |
|---|---|
| 日期 | 2026-05-04 |
| Node | 待填 |
| npm | 待填 |
| 指令 | npm run build |
| 是否成功 | 是 / 否 |
| build:prod | 是 / 否 |
| build:style | 是 / 否 |
| build:lang | 是 / 否 |
| dist 是否產生 | 是 / 否 |
| 錯誤摘要 | 待填 |
```

---

## 18. 啟動成功的驗收標準

啟動成功不是只有 terminal 沒報錯。

至少要符合以下條件：

| 驗收項目 | 標準 |
|---|---|
| 依賴安裝 | `npm install` 成功完成 |
| scripts 可讀 | `npm run` 能列出 scripts |
| dev2 | `npm run dev2` 可啟動或錯誤可定位 |
| dev | `npm run dev` 可啟動或錯誤可定位 |
| browser | 瀏覽器可開啟 local url |
| console | 無大量 blocking runtime error |
| CSS | 元件樣式正常載入 |
| hot reload | 修改簡單文字或元件後可更新 |
| build | `npm run build` 可完成，或可分段定位失敗 |
| version record | commit / Node / npm / script 已記錄 |

---

## 19. 啟動失敗時的處理順序

當啟動失敗時，請依照這個順序處理：

```text
1. 先複製完整錯誤訊息
2. 確認目前 Node 版本
3. 確認目前 npm 版本
4. 確認是否混用 lockfile
5. 確認 node_modules 是否殘留舊依賴
6. 刪除 node_modules 後重裝
7. 嘗試 npm install --legacy-peer-deps
8. 嘗試切換 Node 16.20.x
9. 分別測試 dev2 / dev
10. 把錯誤寫入 error-log.md
```

---

## 20. 不要一開始就做的事

遇到錯誤時，不要立刻：

```bash
npm update
npm audit fix --force
npm install vue@latest
npm install vite@latest
npm install typescript@latest
npm install less-loader@latest
rm package.json
```

也不要立刻把 npm 改成 pnpm。

因為你目前的目標是：

```text
還原官方專案原本的開發環境
```

不是：

```text
升級整個工程到最新版工具鏈
```

---

## 21. 清理重裝 SOP

### 21.1 macOS / Linux / Git Bash

```bash
rm -rf node_modules
rm -f package-lock.json
npm cache verify
npm install
```

如果你想保留 lockfile，不要刪 `package-lock.json`。

---

### 21.2 Windows PowerShell

```powershell
Remove-Item -Recurse -Force node_modules
Remove-Item -Force package-lock.json
npm cache verify
npm install
```

如果 `package-lock.json` 不存在，PowerShell 可能會報找不到檔案，這不一定是問題。

---

### 21.3 更保守的重裝方式

如果你不確定要不要刪 lockfile，建議先只刪：

```bash
rm -rf node_modules
npm install
```

Windows：

```powershell
Remove-Item -Recurse -Force node_modules
npm install
```

---

## 22. 常見錯誤與判斷方向

### 22.1 `ERESOLVE unable to resolve dependency tree`

可能原因：

```text
npm 版本較新，peer dependency 檢查較嚴
舊依賴版本與新解析規則衝突
```

可嘗試：

```bash
npm install --legacy-peer-deps
```

記錄：

```text
是否使用 --legacy-peer-deps
出現衝突的 package
Node / npm 版本
```

---

### 22.2 `ERR_OSSL_EVP_UNSUPPORTED`

可能原因：

```text
新 Node + 舊 Webpack / loader / crypto 行為相容問題
```

建議：

```bash
nvm use 16.20.2
npm install
npm run dev
```

不要一開始就加一堆環境變數繞過。

---

### 22.3 `Cannot find module`

可能原因：

```text
依賴沒安裝完整
node_modules 損壞
使用 pnpm 導致舊工具找不到隱式依賴
某個 package 沒被正確宣告
```

建議：

```bash
rm -rf node_modules
npm install
```

第一輪不要用 pnpm 跑本體。

---

### 22.4 `less-loader` 相關錯誤

可能原因：

```text
less / less-loader / webpack 版本相容性
Node 版本太新
依賴被升級
```

建議：

```text
確認 package.json 中 less 與 less-loader 版本
切回 Node 16
不要自行升級 less-loader
```

---

### 22.5 `vue-template-compiler` / compiler mismatch

可能原因：

```text
Vue 2 編譯器與 Vue 3 編譯器混在工具鏈中
舊 Vue CLI 依賴仍保留 vue-template-compiler
某個 loader 需要舊編譯器
```

建議：

```text
先不要自行刪除 vue-template-compiler
照 package.json 還原依賴
記錄錯誤後再分析工具鏈歷史原因
```

---

## 23. 啟動後先看哪些畫面？

啟動成功後，不要急著逐行讀源碼。  
先從畫面確認幾件事：

```text
首頁或 demo 頁是否能正常載入
左側選單或元件分類是否存在
基礎元件是否能展示
表單元件是否能互動
彈層元件是否能觸發
樣式是否完整
語言是否正常
```

建議先看：

```text
Button
Input
Form
Table
Modal
Message
Select
DatePicker
```

原因是這幾類元件會連到後續很多章節：

```text
基礎元件
表單與輸入
表單驗證
資料展示
彈層與命令式 API
樣式系統
```

---

## 24. 啟動後先改哪裡測試？

為了確認你真的跑的是本地源碼，而不是瀏覽器快取或 npm 套件，可以做一個安全測試。

### 24.1 找一個展示文字

例如找 examples 或 demo 中的某段文字，改成：

```text
View UI Plus Local Test
```

然後看瀏覽器是否更新。

---

### 24.2 找一個簡單元件加 console

例如在某個 Button 元件生命週期或 setup 中暫時加：

```js
console.log('[study] Button loaded')
```

檢查瀏覽器 console 是否看到。

注意：

```text
這只是本地讀碼測試
不要提交到正式分支
```

---

### 24.3 測試後還原

測完後：

```bash
git diff
git checkout -- path/to/changed-file
```

或全部還原：

```bash
git checkout -- .
```

如果你已經建立讀碼分支，也可以保留實驗，但要在 commit message 中清楚標註。

---

## 25. 建立 env-record.md

在 `logs/env-record.md` 中記錄：

```md
# View UI Plus 本體源碼環境紀錄

## 1. 基本資訊

| 項目 | 內容 |
|---|---|
| 日期 | 2026-05-04 |
| OS | Windows 11 / macOS / Linux |
| Shell | PowerShell / Git Bash / zsh |
| Git version | 待填 |
| Node version | 待填 |
| npm version | 待填 |
| package manager | npm |

## 2. 專案資訊

| 項目 | 內容 |
|---|---|
| repository | https://github.com/view-design/ViewUIPlus |
| branch | 待填 |
| tag | 待填 |
| commit hash | 待填 |
| package name | view-ui-plus |
| package version | 待填 |
| main | 待填 |
| typings | 待填 |

## 3. 安裝資訊

| 項目 | 內容 |
|---|---|
| install command | npm install |
| 是否使用 legacy-peer-deps | 是 / 否 |
| install result | 成功 / 失敗 |
| 錯誤摘要 | 無 / 待填 |

## 4. 啟動資訊

| script | command | result | local url | note |
|---|---|---|---|---|
| dev2 | npm run dev2 | 待填 | 待填 | Vite |
| dev | npm run dev | 待填 | 待填 | Vue CLI |
| build | npm run build | 待填 | - | 完整打包 |
```

---

## 26. 建立 install-log.md

```md
# View UI Plus install log

## 1. 安裝指令

```bash
npm install
```

## 2. 安裝時間

```text
2026-05-04
```

## 3. Node / npm

```bash
node -v
npm -v
```

## 4. 重要依賴版本

```bash
npm list vue
npm list vite
npm list @vue/cli-service
npm list gulp
npm list less
npm list typescript
```

## 5. 安裝結果

```text
成功 / 失敗
```

## 6. 錯誤摘要

```text
如果失敗，貼上錯誤重點。
```
```

---

## 27. 建立 run-log.md

```md
# View UI Plus run log

## npm run dev2

| 項目 | 內容 |
|---|---|
| command | npm run dev2 |
| tool | Vite |
| config | vite.config.dev.js |
| result | 成功 / 失敗 |
| url | 待填 |
| browser console | 正常 / 有錯 |
| note | 待填 |

## npm run dev

| 項目 | 內容 |
|---|---|
| command | npm run dev |
| tool | Vue CLI |
| result | 成功 / 失敗 |
| url | 待填 |
| browser console | 正常 / 有錯 |
| note | 待填 |

## npm run build

| 項目 | 內容 |
|---|---|
| command | npm run build |
| result | 成功 / 失敗 |
| dist | 有 / 無 |
| style | 成功 / 失敗 |
| lang | 成功 / 失敗 |
| note | 待填 |
```

---

## 28. 建立 error-log.md

```md
# View UI Plus error log

## 錯誤 1

| 項目 | 內容 |
|---|---|
| 日期 | 2026-05-04 |
| 指令 | npm install / npm run dev2 / npm run dev |
| Node | 待填 |
| npm | 待填 |
| 錯誤類型 | 依賴 / Node / Vite / Vue CLI / Less / 其他 |
| 錯誤摘要 | 待填 |
| 完整錯誤 | 貼上重點 |
| 嘗試解法 | 待填 |
| 結果 | 已解 / 未解 |
| 備註 | 待填 |
```

錯誤紀錄的目標不是保存所有雜訊，而是讓你日後可以回答：

```text
當初為什麼選 Node 16？
當初為什麼用 npm 而不是 pnpm？
當初 dev2 和 dev 哪個能跑？
當初 build 失敗在哪一步？
```

---

## 29. 本篇建議最小成功標準

如果你時間有限，至少要做到：

```text
1. clone 成功
2. 確認 package version
3. 記錄 commit hash
4. npm install 成功
5. npm run dev2 成功
6. 瀏覽器能打開頁面
7. env-record.md 有紀錄
```

這樣就可以進入後續章節：

```text
02_根目錄與工程設定
03_package與依賴分析
```

---

## 30. 本篇建議完整成功標準

完整標準是：

```text
1. clone 成功
2. branch / tag / commit 記錄完成
3. Node / npm 記錄完成
4. npm install 成功
5. npm run dev2 成功
6. npm run dev 成功或明確記錄失敗原因
7. npm run build 成功或可分段定位失敗原因
8. dist / styles / types 有對照觀察
9. run-log.md 完成
10. error-log.md 完成
11. 可確認瀏覽器畫面使用的是本地源碼
```

---

## 31. 和後續章節的銜接

本篇完成後，後續章節可以直接使用本地源碼。

| 後續章節 | 本篇提供的基礎 |
|---|---|
| `02_根目錄與工程設定` | 已 clone，可以觀察根目錄 |
| `03_package與依賴分析` | 已確認 package.json |
| `04_build_打包腳本與建置流程` | 已知道 dev / dev2 / build scripts |
| `05_dist_打包產物分析` | 若 build 成功，可看 dist |
| `06_src_入口與插件機制` | 可以從 src 入口開始讀 |
| `25_examples_範例與Demo` | dev / dev2 啟動後可看 examples |
| `26_test_測試` | 可確認是否有測試相關工具與腳本 |
| `36_仿寫與重構` | 可以在本地分支做實驗 |
| `37_迷你元件庫實作` | 可以參考本體啟動與 build 流程 |

---

## 32. 本篇不要深入的內容

本篇只負責：

```text
clone
切版本
安裝依賴
啟動
build 驗證
紀錄環境
```

不要在本篇深入：

```text
package.json 每個依賴的用途
Vite config 詳解
Vue CLI config 詳解
Gulp style build 詳解
dist 產物結構
src/index 入口設計
install 機制
元件註冊
globalProperties
```

這些會放到後續章節。

---

## 33. 完整指令速查

### 33.1 clone 與版本

```bash
cd D:/code/view-ui-plus-study/source
git clone https://github.com/view-design/ViewUIPlus.git
cd ViewUIPlus

git status
git remote -v
git branch --show-current
git rev-parse HEAD
git tag -l
```

---

### 33.2 package 資訊

```bash
node -p "require('./package.json').name"
node -p "require('./package.json').version"
node -p "require('./package.json').main"
node -p "require('./package.json').typings"
node -p "require('./package.json').scripts"
```

---

### 33.3 Node 與 npm

```bash
nvm install 16.20.2
nvm use 16.20.2
node -v
npm -v
```

---

### 33.4 安裝與啟動

```bash
npm install
npm run dev2
npm run dev
npm run build
```

---

### 33.5 分段 build

```bash
npm run build:prod
npm run build:style
npm run build:lang
```

---

### 33.6 依賴檢查

```bash
npm list vue
npm list vite
npm list @vue/cli-service
npm list gulp
npm list less
npm list typescript
```

---

### 33.7 清理重裝

```bash
rm -rf node_modules
npm cache verify
npm install
```

Windows PowerShell：

```powershell
Remove-Item -Recurse -Force node_modules
npm cache verify
npm install
```

---

## 34. 本篇檢核表

完成本篇後，請確認：

- [ ] 我已建立 `view-ui-plus-study` 本地資料夾。
- [ ] 我已 clone `https://github.com/view-design/ViewUIPlus.git`。
- [ ] 我已確認 `git remote -v`。
- [ ] 我已確認目前 branch。
- [ ] 我已記錄 commit hash。
- [ ] 我已確認 `package.json` 的 `name` 是 `view-ui-plus`。
- [ ] 我已確認 `package.json` 的 `version`。
- [ ] 我已查看 `package.json` 的 scripts。
- [ ] 我知道 `dev` 是 Vue CLI 路線。
- [ ] 我知道 `dev2` 是 Vite 路線。
- [ ] 我已切換到合適 Node 版本。
- [ ] 我已記錄 Node / npm 版本。
- [ ] 我已使用 npm 安裝依賴。
- [ ] 我已嘗試 `npm run dev2`。
- [ ] 我已嘗試 `npm run dev`。
- [ ] 我已嘗試 `npm run build` 或至少知道分段 build 方式。
- [ ] 我已確認瀏覽器能打開本地頁面。
- [ ] 我已確認 CSS 是否正常載入。
- [ ] 我已建立 `env-record.md`。
- [ ] 我已建立 `install-log.md`。
- [ ] 我已建立 `run-log.md`。
- [ ] 我已建立 `error-log.md`。
- [ ] 我知道下一章要進入根目錄與工程設定。

---

## 35. 推薦下一步

完成本篇後，下一篇建議進入：

```text
01-07_啟動失敗排查清單.md
```

原因是：

```text
即使你這次啟動成功，之後換電腦、換 Node、換 npm、重裝依賴時仍可能出錯。
```

如果你已經啟動成功，也可以同步開始：

```text
02_根目錄與工程設定
03_package與依賴分析
```

但在正式讀根目錄前，請先確認：

```text
commit hash 已記錄
Node / npm 已記錄
dev2 / dev / build 結果已記錄
```

---

## 36. 參考資料

| 類型 | 資源 |
|---|---|
| View UI Plus GitHub | https://github.com/view-design/ViewUIPlus |
| View UI Plus package.json | https://github.com/view-design/ViewUIPlus/blob/master/package.json |
| View UI Plus npm | https://www.npmjs.com/package/view-ui-plus |
| View UI Plus 官方安裝頁 | https://www.iviewui.com/view-ui-plus/guide/install |
| GitHub Tags | https://github.com/view-design/ViewUIPlus/tags |
| 官方 TypeScript + Vite 範例 | https://github.com/view-design/view-ui-project-ts |

---

## 37. 本篇一句話總結

> Clone View UI Plus 源碼不是只要 `git clone` 和 `npm install`；真正重要的是固定版本、記錄 commit、選對 Node、分清 `dev` 與 `dev2` 啟動路線，並把安裝、啟動、錯誤與 build 結果全部記錄成可回溯的讀碼基準。
