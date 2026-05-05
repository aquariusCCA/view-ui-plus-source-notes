# 02_根目錄與工程設定｜README

> 專案：View UI Plus 讀碼筆記  
> 章節：`02_根目錄與工程設定`  
> 檔案定位：本資料夾的章節入口、閱讀導覽與學習地圖  
> 適合閱讀時機：開始閱讀 `02-01` ～ `02-10` 之前，或完成本章後回來總複習  
> 版本基準：依 View UI Plus `master` 分支目前可見根目錄與設定檔整理  

---

## 0. 本章一句話總結

`02_根目錄與工程設定` 這一章的任務是：

> **先看懂 View UI Plus 的工程邊界，再進入 package、build、src、components、types、examples 等細節。**

你可以把這一章理解成整份 View UI Plus 讀碼筆記的「工程地圖」。

如果沒有先看這章，後面很容易發生幾個問題：

1. 看到 `src/components` 就直接開始讀元件，卻不知道它如何被開發、展示、打包、發布；
2. 看到 `package.json` 就只會看 dependencies，卻忽略 scripts、files、main、typings 的工程意義；
3. 看到 `vite.config.js` 就以為整個專案都是純 Vite 架構，卻沒注意到 Vue CLI、Gulp、Travis、TSLint 等歷史痕跡；
4. 看到 `dist` 就以為它只是打包結果，卻不清楚它和 `main`、`module`、CSS、npm 發布邊界的關係；
5. 看到 `.travis.yml`、`tslint.json` 這類檔案時，不知道要判斷它是主線設定還是歷史遺留。

本章的價值不在於背下每個設定，而是建立一種能力：

> **看到一個開源前端元件庫的根目錄時，可以快速判斷它的開發入口、打包入口、發布邊界、型別來源、規範工具與歷史演進痕跡。**

---

## 1. 為什麼需要這一章？

View UI Plus 不是一般的 Vue 業務系統，而是一個 Vue 3 元件庫工程。

一般後台專案的根目錄，通常圍繞「把一個 App 跑起來」：

```text
src/views
src/router
src/store
src/api
vite.config.ts
.env
package.json
```

但元件庫專案的根目錄，除了要讓開發者本地開發，也要處理：

```text
元件源碼開發
範例站 / Demo 預覽
元件庫打包
CSS / Less 樣式打包
語言包打包
TypeScript 型別宣告
npm 發布邊界
lint / test / CI / preview
GitHub issue / PR 協作入口
```

所以你讀 View UI Plus 時，不能只問：

> 這個元件怎麼寫？

你還要問：

> 這個元件在整個工程裡怎麼被開發、引用、打包、發布、型別化、規範化？

`02_根目錄與工程設定` 就是幫你建立這套問題意識。

---

## 2. 本章在整份筆記中的位置

你的整份 View UI Plus 讀碼筆記大致可以分成幾個層級：

```text
00 ～ 02：讀碼準備與工程地圖
03 ～ 09：package、build、dist、src 入口、註冊、全域配置、整體設計
10 ～ 23：components、directives、utils、mixins、locale、styles 等源碼主體
24 ～ 27：types、examples、test、assets 等輔助系統
28 ～ 35：高階專題
36 ～ 39：仿寫、重構、實戰與設計模式總結
99：總結
```

其中本章 `02_根目錄與工程設定` 的定位是：

> **看懂「專案外層工程骨架」，但不深入每個子系統。**

換句話說，本章不是要你一次讀懂 View UI Plus，而是讓你先知道：

- 哪些東西是源碼？
- 哪些東西是 Demo？
- 哪些東西是打包產物？
- 哪些東西是工程設定？
- 哪些設定現在還在主線使用？
- 哪些設定可能是歷史遺留？
- 後面要深入哪一章？

---

## 3. 本章不要做什麼？

這一章最怕「失焦」。

根目錄設定很多，如果每個檔案都逐行深入，很容易把後面章節提前講完，導致整份筆記重複。

所以本章有明確邊界。

### 3.1 本章會做的事

| 本章會做 | 說明 |
|---|---|
| 建立根目錄鳥瞰圖 | 先知道一級資料夾與一級設定檔的責任 |
| 區分工程邊界 | 分清楚源碼、範例、建置、發布、型別、規範、CI |
| 分類設定檔 | 把設定檔分成開發、打包、型別、規範、發布、協作幾類 |
| 判斷主線與遺留 | 練習判斷某些設定是否仍在主線流程中使用 |
| 建立後續章節入口 | 知道每個細節應該去哪一章深入 |
| 形成通用讀碼方法 | 之後可以套用到 FormKit、PPTist、Element Plus、Naive UI 等專案 |

### 3.2 本章不會做的事

| 本章不深入 | 留到後續章節 |
|---|---|
| `package.json` dependencies 的完整分析 | `03_package與依賴分析` |
| build script、gulp、語言包、樣式建置完整流程 | `04_build_打包腳本與建置流程` |
| `dist` 裡每個產物的內容與用途 | `05_dist_打包產物分析` |
| `src/index.js` 插件入口與 install 機制 | `06_src_入口與插件機制` |
| 元件註冊流程與全域註冊策略 | `07_元件註冊機制` |
| `app.config.globalProperties` 等全域配置 | `08_全域配置與globalProperties` |
| 元件庫設計模式 | `09_元件庫整體設計模式` |
| 具體元件實作 | `10_src-components_元件總覽` 之後 |
| TypeScript 宣告檔細節 | `24_types_型別宣告` |
| examples demo 寫法 | `25_examples_範例與Demo` |
| 測試策略與測試案例 | `26_test_測試` |

本章的標準是：

> **知道它在哪裡、做什麼、和誰有關；但不要急著分析它全部怎麼實作。**

---

## 4. 先抓住 View UI Plus 的根目錄特徵

從 View UI Plus 根目錄可以看到，它同時包含以下一級資料夾：

```text
.github/
assets/
build/
dist/
examples/
src/
test/
types/
```

以及以下典型根目錄設定檔：

```text
.editorconfig
.eslintignore
.eslintrc.js
.gitattributes
.gitignore
.inscode
.npmignore
.travis.yml
LICENSE
README-CN.md
README.md
SECURITY.md
package.json
preview.yml
tsconfig.json
tslint.json
vite.config.dev.js
vite.config.js
vue.config.js
```

這些檔案可以分成幾個大類：

| 分類 | 代表檔案 / 資料夾 | 讀碼時要問的問題 |
|---|---|---|
| 專案說明 | `README.md`、`README-CN.md`、`LICENSE`、`SECURITY.md` | 這個專案對外如何定位？授權與安全政策是什麼？ |
| 源碼主體 | `src/` | 元件庫核心源碼在哪裡？ |
| 範例展示 | `examples/` | 本地開發與 Demo 預覽如何啟動？ |
| 建置流程 | `build/`、`vite.config.js`、`vite.config.dev.js`、`vue.config.js` | 開發與打包分別走哪套工具？ |
| 打包產物 | `dist/` | npm 使用者實際載入的 JS / CSS 產物在哪裡？ |
| 型別宣告 | `types/`、`tsconfig.json`、`package.json.typings` | TypeScript 使用者如何取得型別？ |
| 規範工具 | `.editorconfig`、`.eslintrc.js`、`.eslintignore`、`tslint.json` | 格式、Lint、歷史規範如何配置？ |
| 發布邊界 | `package.json.files`、`.npmignore` | npm 套件會包含哪些內容？ |
| Git / CI / Preview | `.gitignore`、`.gitattributes`、`.github/`、`.travis.yml`、`.inscode`、`preview.yml` | 協作、自動化、線上預覽如何設定？ |
| 測試 | `test/` | 測試相關程式與工具在哪裡？ |
| 靜態資源 | `assets/` | 專案展示與文件相關資源在哪裡？ |

這一章的每篇筆記都會圍繞上述分類展開。

---

## 5. 本章完整筆記清單

本章建議包含以下 11 個檔案。

| 順序 | 檔案 | 定位 |
|---|---|---|
| 0 | `README.md` | 本章導讀、閱讀順序、學習目標、章節邊界 |
| 1 | `02-01_根目錄總覽_先看懂專案邊界.md` | 建立根目錄鳥瞰圖與工程邊界 |
| 2 | `02-02_根目錄資料夾責任分工.md` | 釐清一級資料夾各自負責什麼 |
| 3 | `02-03_根目錄設定檔分類地圖.md` | 把根目錄設定檔分成開發、打包、型別、規範、發布、CI 等類別 |
| 4 | `02-04_開發模式設定_Vite與VueCLI.md` | 理解 Vue CLI dev 與 Vite dev2 的本地開發分工 |
| 5 | `02-05_打包入口設定_vite-config.md` | 理解正式打包入口、library build 與輸出格式 |
| 6 | `02-06_TypeScript設定_tsconfig.md` | 理解 tsconfig、types、typings 的型別入口關係 |
| 7 | `02-07_程式碼規範_ESLint_TSLint_EditorConfig.md` | 理解 ESLint、TSLint、EditorConfig 的規範分工與歷史痕跡 |
| 8 | `02-08_發布邊界_npmignore_package-files.md` | 理解 npm 發布時會包含什麼、排除什麼 |
| 9 | `02-09_Git_CI_線上預覽設定.md` | 理解 Git、CI、GitHub、線上預覽相關設定 |
| 10 | `02-10_根目錄讀碼檢核表.md` | 把本章能力整理成 checklist，方便總複習與套用到其他專案 |

---

## 6. 建議閱讀順序

建議不要照著檔名機械閱讀，而是依照「從宏觀到流程，再到檢核」的順序。

### 第一輪：建立工程地圖

先讀：

```text
README.md
02-01_根目錄總覽_先看懂專案邊界.md
02-02_根目錄資料夾責任分工.md
02-03_根目錄設定檔分類地圖.md
```

這一輪的目標是回答：

```text
這個專案根目錄有哪些東西？
每個資料夾負責什麼？
每個設定檔屬於哪一類？
我後面要去哪一章深入？
```

讀完這一輪，你應該能把 View UI Plus 根目錄畫成一張簡單工程地圖。

---

### 第二輪：理解開發與打包主線

接著讀：

```text
02-04_開發模式設定_Vite與VueCLI.md
02-05_打包入口設定_vite-config.md
```

這一輪的目標是回答：

```text
本地開發怎麼跑？
Vue CLI 和 Vite 在這個專案中分別負責什麼？
範例站如何引用 src 原始碼？
正式打包入口是哪個檔案？
打包輸出有哪些格式？
Vue 為什麼要 external？
```

這一輪會讓你明白：

> View UI Plus 不是純 Vite 專案，而是一個帶有 Vue CLI、Vite、Gulp 等混合工具痕跡的元件庫工程。

---

### 第三輪：理解輔助工程設定

再讀：

```text
02-06_TypeScript設定_tsconfig.md
02-07_程式碼規範_ESLint_TSLint_EditorConfig.md
02-08_發布邊界_npmignore_package-files.md
02-09_Git_CI_線上預覽設定.md
```

這一輪的目標是回答：

```text
tsconfig 是不是檢查整個 src？
TypeScript 型別入口從哪裡來？
npm run lint 實際呼叫什麼？
TSLint 是否仍是主線工具？
npm 發布時哪些檔案會被包含？
.travis.yml 是否仍可信？
preview 設定實際啟動哪個 script？
```

這一輪的重點不是背設定，而是培養判斷能力：

> **看到設定檔時，要判斷它是主線流程、輔助流程，還是歷史遺留。**

---

### 第四輪：總複習與遷移

最後讀：

```text
02-10_根目錄讀碼檢核表.md
```

這一輪的目標是：

```text
不看筆記，自己能否回答根目錄相關問題？
能否把同一套方法套用到其他元件庫？
能否自己仿寫一個迷你元件庫的根目錄？
```

如果你可以完成 `02-10` 裡的大多數 checklist，代表本章已經掌握。

---

## 7. 每篇筆記的詳細定位

### 7.1 `02-01_根目錄總覽_先看懂專案邊界.md`

這篇是本章第一篇正式筆記。

它的任務是讓你第一次打開 View UI Plus 根目錄時，不會迷失在一堆資料夾與設定檔裡。

你讀完後應該能回答：

```text
View UI Plus 是一般 Vue App，還是元件庫工程？
根目錄可以分成哪些責任區？
哪些地方是源碼？
哪些地方是範例？
哪些地方是產物？
哪些地方是設定？
為什麼不能一開始就只看 src/components？
```

這篇的核心產出是：

> **根目錄工程邊界圖。**

---

### 7.2 `02-02_根目錄資料夾責任分工.md`

這篇聚焦一級資料夾。

它不處理所有設定檔，而是專門整理：

```text
.github/
assets/
build/
dist/
examples/
src/
test/
types/
```

你讀完後應該能回答：

```text
src 和 examples 有什麼差別？
build 和 dist 有什麼差別？
types 和 tsconfig 有什麼關係？
assets 是產品核心還是展示輔助？
.github 和 .travis.yml 的責任是否相同？
```

這篇的核心產出是：

> **資料夾責任分工表。**

---

### 7.3 `02-03_根目錄設定檔分類地圖.md`

這篇聚焦根目錄設定檔。

它的重點不是逐行看設定，而是先分類：

```text
開發設定
打包設定
型別設定
規範設定
發布設定
Git / CI / Preview 設定
專案說明設定
```

你讀完後應該能回答：

```text
package.json 同時負責哪些事情？
vite.config.dev.js 和 vite.config.js 差在哪？
vue.config.js 為什麼還存在？
.editorconfig、.eslintrc.js、tslint.json 分別在管什麼？
.npmignore 和 package.json.files 誰更重要？
```

這篇的核心產出是：

> **設定檔分類地圖。**

---

### 7.4 `02-04_開發模式設定_Vite與VueCLI.md`

這篇聚焦本地開發模式。

View UI Plus 的 `package.json` 同時存在：

```json
{
  "dev": "vue-cli-service serve",
  "dev2": "vite --config vite.config.dev.js"
}
```

因此這篇要釐清：

```text
npm run dev 走 Vue CLI
npm run dev2 走 Vite
vite.config.dev.js 把 root 指向 examples
examples 可以透過 alias 引用 src 原始碼
vue.config.js 則服務 Vue CLI 開發流程
```

你讀完後應該能回答：

```text
為什麼元件庫需要 examples？
開發時為什麼不是直接打包 dist？
examples 如何直接測試 src 原始碼？
Vue CLI 和 Vite 同時存在代表什麼？
```

這篇的核心產出是：

> **本地開發流程圖。**

---

### 7.5 `02-05_打包入口設定_vite-config.md`

這篇聚焦正式打包入口。

它要讓你先看懂 `vite.config.js` 的角色：

```text
entry: src/index.js
outDir: dist
format: umd / es
external: vue
entryFileNames: viewuiplus.min.js / viewuiplus.min.esm.js
```

你讀完後應該能回答：

```text
正式打包入口為什麼是 src/index.js？
UMD 和 ES module 代表什麼使用場景？
Vue 為什麼不能被打包進元件庫？
vite.config.js 和 build:style / build:lang 的分工是什麼？
```

這篇的核心產出是：

> **library build 入口地圖。**

---

### 7.6 `02-06_TypeScript設定_tsconfig.md`

這篇聚焦 TypeScript 設定。

這篇尤其重要，因為 View UI Plus 不是一個完整 TypeScript 重構後的全 TS 專案。

你要特別注意：

```json
{
  "include": [
    "types/*.ts"
  ]
}
```

這代表本章對 `tsconfig.json` 的初步判斷是：

> 它比較像服務型別宣告與編輯器解析的設定，而不是對整個 `src` 做完整 TypeScript 嚴格檢查的設定。

你讀完後應該能回答：

```text
package.json 的 typings 指向哪裡？
tsconfig include 了哪些檔案？
@/* alias 在 tsconfig 裡如何設定？
為什麼不能看到 tsconfig strict true 就以為整個 src 都被嚴格檢查？
```

這篇的核心產出是：

> **型別入口與檢查範圍判斷。**

---

### 7.7 `02-07_程式碼規範_ESLint_TSLint_EditorConfig.md`

這篇聚焦程式碼規範工具鏈。

它要釐清三類工具的責任：

| 工具 | 責任 |
|---|---|
| EditorConfig | 編輯器層級格式一致性 |
| ESLint | JavaScript / Vue 程式碼規範與自動修復 |
| TSLint | 舊式 TypeScript lint 規則，可能偏歷史遺留 |

你讀完後應該能回答：

```text
npm run lint 實際跑什麼？
.eslintrc.js 是否複雜？
.eslintignore 排除了哪些路徑？
tslint.json 是否有被 package.json script 直接呼叫？
為什麼新專案通常不再選 TSLint？
```

這篇的核心產出是：

> **規範工具鏈責任圖。**

---

### 7.8 `02-08_發布邊界_npmignore_package-files.md`

這篇聚焦 npm 發布邊界。

View UI Plus 的 `package.json` 目前明確指定：

```json
{
  "files": [
    "dist",
    "src",
    "types"
  ]
}
```

同時 `.npmignore` 又排除了：

```text
.*
*.md
*.yml
build/
node_modules/
test/
gulpfile.js
```

這篇要讓你理解：

```text
package.json.files 是白名單邊界
.npmignore 是排除規則
main / typings 告訴使用者安裝後會從哪裡載入 JS 與型別
README / LICENSE 等可能具有 npm 特殊保留規則
```

你讀完後應該能回答：

```text
npm install view-ui-plus 後，使用者大致會拿到哪些核心內容？
dist、src、types 為什麼會被包含？
build、test 為什麼不該被發布？
main 和 typings 是否必須指向會被發布的路徑？
```

這篇的核心產出是：

> **npm 發布白名單與入口關係圖。**

---

### 7.9 `02-09_Git_CI_線上預覽設定.md`

這篇聚焦 Git、CI、Preview。

它要讓你看懂：

```text
.gitignore 控制哪些檔案不進 Git
.gitattributes 控制 Git 層級文字 / diff / 語言統計等行為
.github 控制 GitHub issue / PR 協作模板
.travis.yml 是 Travis CI 設定
.inscode / preview.yml 和線上預覽環境有關
```

這篇也會提醒你一個重要判斷：

> `.travis.yml` 指向 Node.js 8 與 `npm run test`，但目前 `package.json` 並沒有明確定義 `test` script，因此它可能是歷史遺留或未同步維護的 CI 設定。

你讀完後應該能回答：

```text
哪些設定是 Git 本身的？
哪些設定是 GitHub 協作的？
哪些設定是 CI 的？
哪些設定是線上預覽的？
preview 設定實際啟動哪個 script？
如何判斷 CI 設定是否仍可信？
```

這篇的核心產出是：

> **協作與自動化設定判斷表。**

---

### 7.10 `02-10_根目錄讀碼檢核表.md`

這篇是本章收尾。

它不是新增知識點，而是把前面 9 篇的能力整理成 checklist。

你讀完後應該能檢查自己是否具備以下能力：

```text
看到 src，知道它是元件庫核心源碼
看到 examples，知道它是本地開發與展示環境
看到 build，知道它是建置輔助腳本
看到 dist，知道它是打包產物
看到 types，知道它是對外型別宣告
看到 package.json，知道要同時看 scripts、files、main、typings
看到 vite.config.dev.js，知道它服務本地 Vite 開發
看到 vite.config.js，知道它服務正式 library build
看到 .npmignore，知道要和 files 一起看
看到 .travis.yml，知道不能無條件相信它仍是主線
```

這篇的核心產出是：

> **根目錄讀碼能力檢核表。**

---

## 8. 本章的核心工程地圖

本章可以濃縮成下面這張工程地圖。

```text
ViewUIPlus/
│
├─ src/                      # 元件庫核心源碼
│  └─ index.js               # 元件庫統一入口，後續 06 / 07 章深入
│
├─ examples/                 # 本地開發、展示、Demo
│  └─ main.js                # 開發時掛載元件庫與範例頁面
│
├─ build/                    # 建置輔助腳本
│  ├─ build-style.js          # 樣式建置
│  └─ vite.lang.config.js     # 語言包建置
│
├─ dist/                     # 打包輸出產物
│  ├─ viewuiplus.min.js       # UMD 產物
│  ├─ viewuiplus.min.esm.js   # ES module 產物
│  └─ styles/                 # CSS / Less 編譯後產物
│
├─ types/                    # TypeScript 型別宣告
│  └─ index.d.ts              # package.json.typings 指向這裡
│
├─ test/                     # 測試相關內容
│
├─ assets/                   # 專案展示或文件資源
│
├─ .github/                  # GitHub issue / PR 協作模板
│
├─ package.json              # scripts、入口、依賴、發布白名單
├─ vite.config.dev.js         # Vite 本地開發設定
├─ vite.config.js             # Vite library build 設定
├─ vue.config.js              # Vue CLI 開發設定
├─ tsconfig.json              # TypeScript / 型別解析設定
├─ .eslintrc.js               # ESLint 設定
├─ tslint.json                # 舊式 TypeScript lint 設定
├─ .editorconfig              # 編輯器格式統一
├─ .npmignore                 # npm 發布排除規則
├─ .travis.yml                # Travis CI 設定
├─ .inscode                   # 線上環境相關設定
└─ preview.yml                # 線上預覽設定
```

這張圖不是要你背，而是用來建立「看到路徑就知道責任」的直覺。

---

## 9. 本章最重要的 6 條主線

### 9.1 主線一：根目錄邊界

先問：

```text
這個專案有哪些一級資料夾？
這些資料夾分別服務開發、打包、發布、型別、測試、展示中的哪一段？
```

對應筆記：

```text
02-01
02-02
```

---

### 9.2 主線二：設定檔分類

再問：

```text
這個設定檔是給人看的？
是給開發伺服器用的？
是給打包工具用的？
是給 TypeScript 用的？
是給 npm 發布用的？
是給 CI / Preview 用的？
```

對應筆記：

```text
02-03
```

---

### 9.3 主線三：開發模式

再問：

```text
本地開發用哪個 script？
開發伺服器的 root 在哪裡？
範例站怎麼引用元件庫源碼？
Vue CLI 和 Vite 哪一個是現在最主要的開發路線？
```

對應筆記：

```text
02-04
```

---

### 9.4 主線四：打包入口

再問：

```text
正式 build 從哪個 entry 開始？
輸出到哪個資料夾？
輸出哪些格式？
哪些依賴被 external？
JS、CSS、語言包是不是同一個流程產出？
```

對應筆記：

```text
02-05
```

---

### 9.5 主線五：型別與規範

再問：

```text
TypeScript 型別入口從哪裡來？
tsconfig 檢查範圍是什麼？
ESLint 如何啟動？
TSLint 是否仍是主線？
EditorConfig 和 ESLint 有什麼不同？
```

對應筆記：

```text
02-06
02-07
```

---

### 9.6 主線六：發布、協作、自動化

最後問：

```text
npm 發布會包含哪些內容？
使用者真正會載入哪個 JS 與型別檔？
GitHub 協作入口在哪？
CI 是否仍有效？
線上預覽實際跑哪個命令？
```

對應筆記：

```text
02-08
02-09
02-10
```

---

## 10. 本章最容易搞混的概念

### 10.1 `src/` vs `examples/`

| 路徑 | 角色 |
|---|---|
| `src/` | 元件庫核心源碼 |
| `examples/` | 開發展示與 Demo 環境 |

不要把 `examples` 當成產品核心源碼。它主要是為了讓開發者測試與展示元件。

---

### 10.2 `build/` vs `dist/`

| 路徑 | 角色 |
|---|---|
| `build/` | 建置腳本、建置配置、建置輔助流程 |
| `dist/` | 建置後輸出的產物 |

簡單說：

```text
build 是生產線
/dist 是成品倉庫
```

---

### 10.3 `vite.config.dev.js` vs `vite.config.js`

| 檔案 | 角色 |
|---|---|
| `vite.config.dev.js` | 本地開發，root 指向 `examples` |
| `vite.config.js` | 正式 library build，entry 指向 `src/index.js` |

不要看到 Vite 就混在一起。

開發模式與打包模式的設定目標完全不同。

---

### 10.4 `package.json.files` vs `.npmignore`

| 設定 | 角色 |
|---|---|
| `package.json.files` | npm 發布白名單 |
| `.npmignore` | npm 發布排除規則 |

當兩者同時存在時，要優先理解：

> `files` 先決定大致會包含什麼，再搭配 npm 內建規則與 `.npmignore` 理解實際發布邊界。

---

### 10.5 `typings` vs `tsconfig.json`

| 設定 | 角色 |
|---|---|
| `package.json.typings` | 告訴外部使用者型別入口在哪裡 |
| `tsconfig.json` | 告訴 TypeScript / 編輯器如何解析與檢查型別 |

`typings` 是對外入口，`tsconfig` 是工程內部解析設定。

---

### 10.6 `.eslintrc.js` vs `tslint.json`

| 設定 | 角色 |
|---|---|
| `.eslintrc.js` | 目前 `npm run lint` 相關主線規範 |
| `tslint.json` | 舊式 TypeScript lint 規則，需判斷是否仍在用 |

讀碼時不能只看檔案存在，還要看：

```text
package.json scripts 是否有呼叫它？
CI 是否有呼叫它？
文件是否有提到它？
```

---

### 10.7 `.travis.yml` 是否可信？

`.travis.yml` 存在不代表 CI 還有效。

判斷方式：

```text
1. 看它呼叫哪個 script
2. 回到 package.json 檢查該 script 是否存在
3. 看 Node.js 版本是否過舊
4. 看 GitHub Actions 或其他 CI 是否取代它
5. 看最近 commit 是否仍維護該檔案
```

在 View UI Plus 中，`.travis.yml` 指向 `npm run test`，但目前 `package.json` 沒有明確定義 `test` script，因此要把它視為需要保留懷疑的設定。

---

## 11. 本章的讀碼方法

建議你每看一個根目錄檔案，都照下面 5 個問題讀。

### 11.1 第一問：它服務誰？

```text
服務開發者？
服務使用者？
服務打包工具？
服務 npm？
服務 CI？
服務 GitHub？
服務編輯器？
```

例如：

```text
vite.config.dev.js 服務開發者
vite.config.js 服務打包工具
package.json.files 服務 npm 發布
.editorconfig 服務編輯器
```

---

### 11.2 第二問：它在什麼時機被使用？

```text
npm install 時？
npm run dev 時？
npm run dev2 時？
npm run build 時？
npm publish 時？
IDE 開啟專案時？
Git commit / push 時？
CI 執行時？
```

這個問題可以幫你避免把所有設定檔混在一起。

---

### 11.3 第三問：它和哪個 script 有關？

對工程設定來說，`package.json scripts` 是非常重要的索引。

例如：

```text
npm run dev      → vue-cli-service serve
npm run dev2     → vite --config vite.config.dev.js
npm run build    → build:prod + build:style + build:lang
npm run build:prod  → vite build
npm run build:style → gulp --gulpfile build/build-style.js
npm run build:lang  → vite build --config build/vite.lang.config.js
npm run lint     → vue-cli-service lint --fix
```

看到設定檔時，要先問：

> 哪個 script 會用到它？

如果找不到 script，就要進一步判斷它是否是歷史遺留、工具自動讀取，或某個外部平台使用。

---

### 11.4 第四問：它的輸入與輸出是什麼？

例如：

| 設定 / 路徑 | 輸入 | 輸出 |
|---|---|---|
| `vite.config.js` | `src/index.js` | `dist/viewuiplus.min.js`、`dist/viewuiplus.min.esm.js` |
| `build/build-style.js` | Less / style 原始碼 | `dist/styles/...` |
| `build/vite.lang.config.js` | 語言包原始碼 | 語言包打包產物 |
| `tsconfig.json` | `types/*.ts` | TypeScript 解析 / 檢查結果 |
| `package.json.files` | 專案資料夾 | npm 發布包內容 |

用「輸入 → 輸出」的角度讀設定，比單純背欄位有效很多。

---

### 11.5 第五問：它是主線還是遺留？

判斷主線與遺留，至少看 4 件事：

```text
1. package.json scripts 是否呼叫它
2. 目前主要開發流程是否依賴它
3. CI / Preview 是否呼叫它
4. 相關工具版本是否明顯過舊
```

不要因為檔案存在，就直接假設它仍是主線。

大型開源專案常常有歷史演進留下的設定檔。

---

## 12. 9.5 分版本的學習標準

這份 README 將本章定位為 9.5 分版本，不是因為內容最多，而是因為它要達到以下標準。

### 12.1 不是只列檔案，而是建立工程分類

低分筆記會這樣寫：

```text
src 是源碼
examples 是範例
build 是打包
```

9.5 分筆記應該這樣寫：

```text
src 是元件庫源碼主體，會透過 src/index.js 匯出，
開發時被 examples 引用，
打包時被 vite.config.js 作為 library entry，
發布時又透過 package.json.files 被包含到 npm 套件中。
```

也就是說，要能說出它和其他工程環節的關係。

---

### 12.2 不是只看設定值，而是看使用時機

低分筆記會這樣寫：

```text
vite.config.dev.js 有 root: examples
```

9.5 分筆記應該這樣寫：

```text
vite.config.dev.js 是 npm run dev2 使用的開發設定，
它把 root 指向 examples，
代表 Vite 開發伺服器不是直接以專案根目錄作為 App root，
而是以範例站作為本地開發入口，
再透過 alias 回到 src 測試元件庫源碼。
```

---

### 12.3 不是只相信檔案存在，而是判斷是否仍在主線

低分筆記會這樣寫：

```text
.travis.yml 是 CI 設定
```

9.5 分筆記應該這樣寫：

```text
.travis.yml 是 Travis CI 設定，
但它指定 Node.js 8 且呼叫 npm run test，
目前 package.json 沒有明確 test script，
所以讀碼時應該把它視為可能的歷史遺留設定，而不是直接認定它是目前有效 CI 主線。
```

---

### 12.4 不是只看 View UI Plus，而是練成可遷移方法

本章最後要讓你能套用到其他專案。

例如看 PPTist、FormKit、Element Plus、Naive UI 時，你也可以問：

```text
它的根目錄如何分層？
它的 docs / examples / playground 在哪裡？
它的 package 入口在哪裡？
它的 build 工具是 Vite、Rollup、tsup、unbuild 還是 webpack？
它的型別如何產生？
它的 npm 發布邊界如何控制？
它的 CI 是否仍有效？
```

這才是本章真正的價值。

---

## 13. 本章學完後，你應該具備的能力

學完本章後，你應該能不看答案，回答以下問題。

### 13.1 根目錄邊界能力

- [ ] 我能說出 View UI Plus 是元件庫工程，而不是一般 Vue App。
- [ ] 我能說出根目錄有哪些一級資料夾。
- [ ] 我能把資料夾分成源碼、範例、建置、產物、型別、測試、資源、協作幾類。
- [ ] 我知道 `src`、`examples`、`build`、`dist` 的核心差異。

### 13.2 設定檔分類能力

- [ ] 我能把根目錄設定檔分成開發、打包、型別、規範、發布、Git / CI / Preview 幾類。
- [ ] 我知道 `package.json` 不只是依賴清單，還是 scripts、入口、發布邊界的總控制檔。
- [ ] 我知道 `vite.config.dev.js` 和 `vite.config.js` 不應混在一起看。
- [ ] 我知道 `vue.config.js` 的存在代表專案保留 Vue CLI 流程。

### 13.3 開發模式能力

- [ ] 我知道 `npm run dev` 走 Vue CLI。
- [ ] 我知道 `npm run dev2` 走 Vite。
- [ ] 我知道 Vite 開發模式 root 指向 `examples`。
- [ ] 我知道 examples 透過 alias 引用 `src` 原始碼。

### 13.4 打包入口能力

- [ ] 我知道正式 Vite build 的 entry 是 `src/index.js`。
- [ ] 我知道正式 build 輸出到 `dist`。
- [ ] 我知道輸出格式包含 UMD 與 ES module。
- [ ] 我知道 `vue` 被 external，避免把 Vue 打包進元件庫。
- [ ] 我知道 JS 打包、樣式打包、語言包打包不是完全同一條流程。

### 13.5 TypeScript 與規範能力

- [ ] 我知道 `package.json.typings` 指向 `types/index.d.ts`。
- [ ] 我知道 `tsconfig.json` 的 include 主要包含 `types/*.ts`。
- [ ] 我不會誤以為整個 `src` 都被 TypeScript 嚴格檢查。
- [ ] 我知道 ESLint、TSLint、EditorConfig 的責任差異。
- [ ] 我知道 TSLint 在現代 TypeScript 專案中通常屬於舊式工具。

### 13.6 發布與 CI 判斷能力

- [ ] 我知道 `package.json.files` 是 npm 發布白名單的重要依據。
- [ ] 我知道 `.npmignore` 要搭配 `files` 一起看。
- [ ] 我知道 `dist`、`src`、`types` 是 View UI Plus 發布邊界的核心資料夾。
- [ ] 我知道 `.travis.yml` 不能因為存在就直接視為有效主線。
- [ ] 我知道要透過 scripts、Node 版本、平台設定判斷 CI 是否仍可信。

---

## 14. 本章與後續章節的銜接方式

讀完本章後，不要急著把所有工程設定一次補完。

建議依照以下方式銜接。

### 14.1 接到 `03_package與依賴分析`

本章只說：

```text
package.json 是 scripts、入口、依賴、發布邊界的總控制檔。
```

到了 `03_package與依賴分析` 才深入：

```text
dependencies 和 devDependencies 怎麼分？
哪些依賴服務元件功能？
哪些依賴服務工程建置？
哪些依賴可能是歷史包袱？
Vue、Popper、async-validator、dayjs、lodash 等在元件庫裡扮演什麼角色？
```

---

### 14.2 接到 `04_build_打包腳本與建置流程`

本章只說：

```text
build 包含 build:prod、build:style、build:lang。
```

到了 `04_build` 才深入：

```text
npm run build 的完整流程是什麼？
build:prod 如何打 JS？
build:style 如何處理 Less / CSS？
build:lang 如何打語言包？
Gulp 和 Vite 如何分工？
```

---

### 14.3 接到 `05_dist_打包產物分析`

本章只說：

```text
dist 是打包產物資料夾。
```

到了 `05_dist` 才深入：

```text
dist 裡有哪些 JS？
CSS 產物在哪裡？
UMD / ESM 各自如何被使用？
package.json main / module 是否指向 dist？
使用者 import 時實際載入哪個檔案？
```

---

### 14.4 接到 `06_src_入口與插件機制`

本章只說：

```text
vite.config.js 的 entry 是 src/index.js。
```

到了 `06_src` 才深入：

```text
src/index.js 如何 import 元件？
install(app) 如何註冊元件？
插件機制如何設計？
全域方法與全域配置如何掛上？
```

---

### 14.5 接到 `24_types_型別宣告`

本章只說：

```text
package.json.typings 指向 types/index.d.ts。
tsconfig include 主要是 types/*.ts。
```

到了 `24_types` 才深入：

```text
types/index.d.ts 如何宣告元件？
全域 ComponentCustomProperties 如何擴充？
元件 props / emits / instance type 如何描述？
View UI Plus 的型別宣告有什麼限制？
```

---

### 14.6 接到 `25_examples_範例與Demo`

本章只說：

```text
examples 是本地開發與展示入口。
```

到了 `25_examples` 才深入：

```text
examples/main.js 如何掛載 Vue App？
範例路由如何組織？
Demo 如何引用元件？
文件與範例如何支撐元件開發？
```

---

## 15. 建議的實作練習

這章不要只看 View UI Plus，也建議你做一個迷你元件庫工程骨架。

### 15.1 練習目標

建立一個最小化元件庫專案，練習根目錄責任分工。

```text
mini-ui-plus/
│
├─ src/
│  ├─ index.js
│  └─ components/
│     └─ Button/
│        ├─ index.js
│        └─ Button.vue
│
├─ examples/
│  ├─ main.js
│  └─ App.vue
│
├─ dist/
│
├─ types/
│  └─ index.d.ts
│
├─ build/
│
├─ package.json
├─ vite.config.dev.js
├─ vite.config.js
├─ tsconfig.json
├─ .eslintrc.js
├─ .editorconfig
├─ .npmignore
└─ README.md
```

### 15.2 練習要求

你不用一次做完整元件庫，只要完成工程骨架。

最低要求：

```text
1. npm run dev 可以啟動 examples
2. examples 可以引用 src 裡的 Button
3. npm run build 可以把 src/index.js 打包到 dist
4. package.json.files 只發布 dist、src、types
5. typings 指向 types/index.d.ts
6. README 能說明根目錄每個資料夾的責任
```

這個練習可以讓你把本章知識從「看懂」轉成「會設計」。

---

## 16. 本章常見錯誤讀法

### 錯誤 1：一開始就直接看元件實作

這會讓你知道 Button、Input、Table 怎麼寫，但不知道：

```text
它們如何被統一匯出？
如何被 examples 測試？
如何被打包？
如何進入 npm？
如何被 TypeScript 使用者取得型別？
```

正確做法：

> 先看根目錄工程地圖，再進入元件實作。

---

### 錯誤 2：把 View UI Plus 當成純 Vite 專案

View UI Plus 同時存在：

```text
Vue CLI
Vite
Gulp
TSLint
Travis
```

所以你要看的是「工程演進痕跡」，不是只用現代 Vite 專案模板的視角套上去。

---

### 錯誤 3：看到 tsconfig 就以為 src 全部是 TypeScript

`tsconfig.json` 的存在不代表整個專案都是 TypeScript。

要看：

```text
include 包含哪些檔案？
src 裡實際是 .js 還是 .ts？
package.json.typings 指向哪裡？
```

---

### 錯誤 4：看到 .travis.yml 就以為 CI 正常

大型專案常常保留舊 CI 設定。

要檢查：

```text
CI 呼叫的 script 是否存在？
Node 版本是否過舊？
GitHub Actions 是否取代它？
最近是否仍有人維護？
```

---

### 錯誤 5：只背檔案用途，不看檔案之間的連線

真正重要的是連線。

例如：

```text
package.json scripts
  ├─ dev  → vue.config.js / Vue CLI
  ├─ dev2 → vite.config.dev.js → examples → src
  └─ build:prod → vite.config.js → src/index.js → dist

package.json files
  └─ dist / src / types → npm 發布內容

package.json typings
  └─ types/index.d.ts → TypeScript 使用者入口
```

你要練的是「工程關係圖」，不是孤立的設定說明。

---

## 17. 讀完本章後，如何判斷可以進下一章？

當你可以不看筆記回答以下問題，就可以進入 `03_package與依賴分析`。

```text
1. View UI Plus 根目錄有哪些一級資料夾？
2. src、examples、build、dist、types 分別負責什麼？
3. package.json 裡 scripts、main、typings、files 各自代表什麼？
4. dev 和 dev2 有什麼差異？
5. vite.config.dev.js 和 vite.config.js 差在哪？
6. 正式打包入口是哪個檔案？
7. npm 發布時核心會包含哪些資料夾？
8. tsconfig 是否檢查整個 src？
9. ESLint、TSLint、EditorConfig 分別負責什麼？
10. .travis.yml 為什麼需要懷疑它是否仍有效？
```

如果其中有 3 題以上答不出來，建議先回去讀 `02-10_根目錄讀碼檢核表.md`。

---

## 18. 最終學習目標

本章不是為了讓你成為 View UI Plus 設定檔專家。

本章真正目標是讓你變成：

> **可以快速進入一個陌生前端開源專案、看懂根目錄工程邊界、判斷主線流程與歷史遺留，並知道下一步要深入哪個子系統的讀碼者。**

如果你能做到這一點，後面讀 `package.json`、`build`、`src/index.js`、components、types、examples 時，就不會再是零散地看檔案，而是會知道每個檔案在整個工程系統裡的位置。

---

## 19. 本章資料來源與核對檔案

本章內容依據 View UI Plus 目前公開倉庫與以下檔案整理：

| 類型 | 檔案 / 來源 |
|---|---|
| 專案根目錄 | `https://github.com/view-design/ViewUIPlus` |
| package 設定 | `https://github.com/view-design/ViewUIPlus/blob/master/package.json` |
| Vite 正式打包設定 | `https://github.com/view-design/ViewUIPlus/blob/master/vite.config.js` |
| Vite 開發模式設定 | `https://github.com/view-design/ViewUIPlus/blob/master/vite.config.dev.js` |
| TypeScript 設定 | `https://github.com/view-design/ViewUIPlus/blob/master/tsconfig.json` |
| npm 發布排除規則 | `https://github.com/view-design/ViewUIPlus/blob/master/.npmignore` |
| Travis CI 設定 | `https://github.com/view-design/ViewUIPlus/blob/master/.travis.yml` |

> 注意：開源專案會持續變動。之後重新閱讀時，建議先回到 GitHub 根目錄確認檔案是否已變更，再更新本章筆記。

---

## 20. 一頁版總結

最後用一頁濃縮本章。

```text
02_根目錄與工程設定
│
├─ 先看專案定位
│  └─ View UI Plus 是 Vue 3 元件庫，不是一般 Vue App
│
├─ 再看一級資料夾
│  ├─ src       → 元件庫核心源碼
│  ├─ examples  → 本地開發與 Demo
│  ├─ build     → 建置輔助腳本
│  ├─ dist      → 打包產物
│  ├─ types     → 型別宣告
│  ├─ test      → 測試
│  ├─ assets    → 靜態資源
│  └─ .github   → GitHub 協作
│
├─ 再看設定檔分類
│  ├─ package.json       → scripts / main / typings / files / dependencies
│  ├─ vite.config.dev.js → Vite 開發模式
│  ├─ vite.config.js     → Vite library build
│  ├─ vue.config.js      → Vue CLI 開發模式
│  ├─ tsconfig.json      → TypeScript 型別解析
│  ├─ ESLint / TSLint    → 程式碼規範
│  ├─ .npmignore         → npm 排除規則
│  └─ .travis.yml        → CI 設定，需判斷是否仍有效
│
├─ 再看兩條主線
│  ├─ 開發主線：dev / dev2 → examples → src
│  └─ 打包主線：build → src/index.js → dist
│
├─ 再看發布邊界
│  └─ files: dist / src / types
│
└─ 最後用 checklist 驗收
   └─ 02-10_根目錄讀碼檢核表.md
```

本章讀完後，請記住一句話：

> **根目錄不是檔案清單，而是整個元件庫工程的系統地圖。**
