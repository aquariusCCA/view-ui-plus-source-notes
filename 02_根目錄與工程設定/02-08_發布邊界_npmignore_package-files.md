# 02-08_發布邊界_npmignore_package-files

> 所屬章節：`02_根目錄與工程設定`  
> 筆記定位：理解 View UI Plus 這類元件庫「發布到 npm 時，哪些內容會被帶出去、哪些內容只留在原始碼倉庫」  
> 建議閱讀順序：`02-01` → `02-02` → `02-03` → `02-05` → 本篇 → `03_package與依賴分析` → `04_build_打包腳本與建置流程` → `05_dist_打包產物分析`

---

## 0. 本篇先給結論

這篇要回答的核心問題不是：

> `.npmignore` 裡面寫了什麼？

而是：

> View UI Plus 作為一個元件庫，發布到 npm 後，使用者實際會拿到哪些內容？  
> 這個邊界是由 `package.json`、`.npmignore`、`dist/`、`src/`、`types/` 共同決定的。

View UI Plus 的發布邊界可以先記成一句話：

> **它不是只發布 `dist/`，而是同時發布 `dist/`、`src/`、`types/`，並透過 `main` 與 `typings` 告訴使用者預設載入哪個 JS 入口與哪個型別入口。**

---

## 1. 本篇學習目標

讀完這篇，你要能回答以下問題：

1. `package.json` 裡的 `files` 是什麼？
2. `.npmignore` 和 `.gitignore` 有什麼不同？
3. View UI Plus 為什麼發布 `dist`、`src`、`types`？
4. 使用者 `npm install view-ui-plus` 後，最主要會拿到哪些資料？
5. `main`、`typings`、`files` 三者之間是什麼關係？
6. 為什麼 `README.md` 明明被 `.npmignore` 的 `*.md` 排除，npm 套件裡仍然可能看得到？
7. 為什麼「原始碼倉庫內容」不等於「npm 安裝後內容」？
8. 如果你以後自己寫元件庫，應該如何設計發布邊界？

---

## 2. 先建立一個觀念：Git 邊界、Build 邊界、npm 邊界不同

很多初學者會把三件事混在一起：

| 邊界 | 代表工具 / 檔案 | 問題 | 對應範圍 |
|---|---|---|---|
| Git 邊界 | `.gitignore` | 哪些檔案不要進 Git？ | 原始碼倉庫 |
| Build 邊界 | `vite.config.js`、`gulp`、`build/` | 哪些源碼會被打包成產物？ | 建置流程 |
| npm 發布邊界 | `package.json.files`、`.npmignore` | 哪些檔案會進入 npm tarball？ | 使用者安裝到的套件 |

這篇只處理第三種：**npm 發布邊界**。

也就是說，本篇不會深入分析：

- `build/` 腳本怎麼把 Less 打成 CSS。
- `vite.config.js` 如何完整產生 UMD / ES Module。
- `src/index.js` 如何安裝所有元件。
- `types/index.d.ts` 如何設計完整型別。

這些會放到後續章節。

---

## 3. View UI Plus 的發布邊界總圖

先用一張圖理解整體關係：

```text
ViewUIPlus 原始碼倉庫
│
├─ package.json
│  ├─ name: view-ui-plus
│  ├─ version: 1.3.24
│  ├─ main: dist/viewuiplus.min.js
│  ├─ typings: types/index.d.ts
│  └─ files:
│     ├─ dist
│     ├─ src
│     └─ types
│
├─ .npmignore
│  ├─ .*
│  ├─ *.md
│  ├─ *.yml
│  ├─ build/
│  ├─ node_modules/
│  ├─ test/
│  └─ gulpfile.js
│
├─ dist/     ← 打包後產物，使用者最常直接吃這裡
├─ src/      ← 原始元件碼，支援進階使用 / 按需引用 / 原始碼分析
├─ types/    ← TypeScript 型別宣告
│
├─ build/    ← 建置腳本，不應該是使用者主要消費對象
├─ test/     ← 測試程式，不應該發布給一般使用者
├─ examples/ ← Demo / 開發預覽，不應該發布給一般使用者
└─ .github/  ← GitHub 工作流程，不屬於 npm 使用者需要的內容
```

最重要的是這三個：

```text
dist   → 給執行期 / 打包器使用
src    → 給原始碼引用、按需引入、二次封裝、讀碼分析使用
types  → 給 TypeScript / IDE 型別提示使用
```

---

## 4. `package.json.files`：發布白名單

View UI Plus 的 `package.json` 裡有這段：

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

這段是本篇最核心的設定。

### 4.1 `files` 的真正意義

`files` 是 npm 發布白名單。

可以這樣理解：

```text
沒有 files：
  npm 預設可能把很多東西都帶出去，再靠 ignore 排除。

有 files：
  npm 優先以 files 指定的內容作為發布主體。
```

所以 View UI Plus 的意思是：

```text
我要發布：
- dist/
- src/
- types/

我不想把整個倉庫都發布出去。
```

這是一種比較乾淨的元件庫發布方式。

---

## 5. 為什麼不是只發布 `dist/`？

很多人直覺會想：

> 元件庫不是打包完就好了嗎？為什麼還要發布 `src/`？

這要從元件庫的消費方式來看。

### 5.1 只發布 `dist/` 的情境

如果只發布 `dist/`，通常代表：

```text
使用者只能吃打包後入口。
```

例如：

```js
import ViewUIPlus from 'view-ui-plus'
```

這種方式對完整引入很方便，但彈性較低。

### 5.2 同時發布 `src/` 的情境

發布 `src/` 可能有幾個目的：

1. 支援按需引用或工具轉換。
2. 讓使用者可以直接引用某些原始模組。
3. 方便二次封裝、除錯、讀碼。
4. 保留元件庫的內部模組結構。
5. 讓插件式、樣式式、語言包式的引用更有彈性。

例如你在學 View UI Plus 時，如果 npm 套件也包含 `src/`，你就能更直接對照：

```text
node_modules/view-ui-plus/src
```

這對讀碼非常有幫助。

### 5.3 同時發布 `types/` 的必要性

`types/` 是 TypeScript 使用者和 IDE 的型別入口。

它解決的是：

```text
我 import 這個元件庫時，編輯器要怎麼知道元件、插件、方法、Props、安裝函式的型別？
```

所以 `types/` 不是執行期產物，而是開發期輔助資料。

---

## 6. `main`、`typings`、`files` 的責任分工

這三個欄位很容易混淆。

| 欄位 | 值 | 責任 |
|---|---|---|
| `main` | `dist/viewuiplus.min.js` | CommonJS / Node / 部分打包器預設 JS 入口 |
| `typings` | `types/index.d.ts` | TypeScript 型別入口 |
| `files` | `["dist", "src", "types"]` | npm 發布白名單 |

你可以把它們想成三句話：

```text
files：
  我發布時要帶哪些資料夾？

main：
  使用者 import / require 套件時，預設 JS 入口在哪？

typings：
  TypeScript 和 IDE 要從哪裡讀型別？
```

### 6.1 這三者的關係

```text
npm install view-ui-plus
│
├─ npm 根據 files 決定哪些資料夾進入套件
│
├─ JavaScript 執行 / 打包時
│  └─ 根據 main 找到 dist/viewuiplus.min.js
│
└─ TypeScript / IDE 解析時
   └─ 根據 typings 找到 types/index.d.ts
```

也就是說：

```text
files 決定「有沒有被發布」
main 決定「預設 JS 從哪裡進」
typings 決定「型別從哪裡進」
```

---

## 7. View UI Plus 沒有明確設定 `module` / `exports`

這是本篇很重要的讀碼觀察。

View UI Plus 的 `vite.config.js` 會輸出：

```text
dist/viewuiplus.min.js       → UMD
dist/viewuiplus.min.esm.js   → ES Module
```

但是 `package.json` 中主要看到的是：

```json
{
  "main": "dist/viewuiplus.min.js",
  "typings": "types/index.d.ts"
}
```

沒有看到：

```json
{
  "module": "...",
  "exports": { ... }
}
```

### 7.1 這代表什麼？

這代表 View UI Plus 的發布欄位偏傳統：

```text
main     → 指向主要 JS 入口
typings  → 指向型別入口
files    → 控制發布內容
```

而不是現代套件常見的：

```json
{
  "exports": {
    ".": {
      "import": "./dist/index.esm.js",
      "require": "./dist/index.cjs"
    }
  },
  "types": "./dist/index.d.ts"
}
```

### 7.2 對讀碼的啟發

你不應該看到 `vite.config.js` 產生了 ESM 檔，就立刻推論：

> 這個 ESM 檔一定是 package.json 的主入口。

要回到 `package.json` 檢查：

```text
main / module / exports / typings / types
```

這幾個欄位才是 npm 套件的入口契約。

---

## 8. `.npmignore`：發布黑名單

View UI Plus 的 `.npmignore` 內容很短：

```gitignore
.*
*.md
*.yml
build/
node_modules/
test/
gulpfile.js
```

它表達的是：

```text
這些東西不應該進入 npm 套件。
```

### 8.1 每一行的意義

| 規則 | 大致意義 | 對元件庫發布的理由 |
|---|---|---|
| `.*` | 排除點開頭檔案 | 例如 Git、CI、Editor、Lint 設定多數不需要給使用者 |
| `*.md` | 排除 Markdown | 多數筆記 / 文檔不一定要進入套件 |
| `*.yml` | 排除 YAML | CI / preview 設定不屬於 npm 使用者 |
| `build/` | 排除建置腳本 | 使用者通常不需要套件內部建置工具 |
| `node_modules/` | 排除依賴資料夾 | npm 會處理依賴，不應打包 node_modules |
| `test/` | 排除測試 | 測試是開發者維護用，不是使用者執行期必要內容 |
| `gulpfile.js` | 排除 gulp 入口 | build:style 的工具入口不需要發布 |

### 8.2 `.npmignore` 的角色

在這個專案中，`.npmignore` 比較像：

```text
保險機制 / 輔助排除規則
```

因為真正重要的發布白名單已經在 `package.json.files` 裡面指定了：

```json
"files": [
  "dist",
  "src",
  "types"
]
```

也就是說，View UI Plus 的發布邊界不是單靠 `.npmignore` 管的，而是：

```text
package.json.files 為主
.npmignore 為輔
```

---

## 9. `.npmignore` 和 `files` 誰比較優先？

這是本篇最容易搞錯的地方。

npm 官方文件的重點可以整理成：

```text
1. package.json 的 files 是發布白名單。
2. root 層的 .npmignore 不會覆蓋 package.json.files。
3. 子資料夾裡的 .npmignore 可以影響該子資料夾內部內容。
4. 某些檔案永遠會被包含，例如 package.json、README、LICENSE、main 指向的檔案。
5. 某些檔案永遠會被排除，例如 .git、node_modules、package-lock.json 等。
```

套到 View UI Plus：

```text
files: ["dist", "src", "types"]
```

所以主體會是：

```text
dist/
src/
types/
```

`.npmignore` 裡的：

```text
build/
test/
gulpfile.js
```

本來就不在 `files` 白名單內，所以正常情況下不會被發布。

---

## 10. 為什麼 `.npmignore` 排除 `*.md`，但 README 仍可能被包含？

你可能會看到一個矛盾：

```gitignore
*.md
```

理論上會排除 Markdown。

可是 npm 套件通常仍會包含：

```text
README.md
```

原因是 npm 有一些「特殊檔案」會被保留，例如：

```text
package.json
README
LICENSE / LICENCE
main 指向的檔案
```

所以不能簡單地說：

```text
.npmignore 裡有 *.md，所以所有 md 都一定不會進 npm。
```

更精準的說法是：

```text
一般 Markdown 可能被排除，但 README 這類 npm 特殊檔案通常仍會被保留。
```

這也是為什麼發布邊界要同時看：

```text
files
.npmignore
npm 預設規則
main
typings
實際 npm tarball
```

---

## 11. 實際 npm 安裝後大概會看到什麼？

從目前公開 CDN / npm 套件檔案觀察，View UI Plus 套件主要包含：

```text
dist/
src/
types/
LICENSE
package.json
README.md
```

這和 `package.json.files` 的設計是吻合的：

```text
files 白名單：
  dist/
  src/
  types/

npm 特殊保留：
  package.json
  README.md
  LICENSE
```

所以你要建立一個重要的工程判斷：

> **npm 套件的內容，不是根目錄所有內容，而是「files 白名單 + npm 必保留檔案 + 相關入口檔案」共同形成的結果。**

---

## 12. `dist/` 在發布邊界中的角色

`dist/` 是 View UI Plus 的打包產物目錄。

對使用者來說，它通常承擔：

```text
完整引入入口
UMD 產物
ESM 產物
樣式產物
語言包產物
```

對應 `package.json`：

```json
"main": "dist/viewuiplus.min.js"
```

這代表：

```text
當使用者用預設方式引入 view-ui-plus 時，
最主要的 JS 入口會落在 dist/viewuiplus.min.js。
```

但這裡先不要深入 `dist/` 內部，因為後面有：

```text
05_dist_打包產物分析
```

---

## 13. `src/` 在發布邊界中的角色

`src/` 是元件庫原始碼。

View UI Plus 把 `src/` 放進 `files`，代表它允許 npm 使用者取得原始碼結構。

這對以下場景有幫助：

1. 讀碼學習。
2. 元件二次封裝。
3. 按需引用。
4. Debug。
5. 對照 `types/` 與實際元件實作。
6. 對照 `dist/` 看 build 前後差異。

但也要注意：

```text
發布 src/ 不代表使用者應該任意依賴所有內部實作。
```

因為如果沒有 `exports` 明確定義公開 API，深層引用雖然可能能用，但不一定是穩定契約。

---

## 14. `types/` 在發布邊界中的角色

`types/` 是型別宣告。

對應 `package.json`：

```json
"typings": "types/index.d.ts"
```

這代表 TypeScript / IDE 會從這裡找型別資訊。

你可以理解成：

```text
dist/   解決執行期入口
src/    解決原始碼可讀性與進階引用
types/  解決 TypeScript 型別提示
```

這三個資料夾合起來，才是元件庫比較完整的發布形態。

---

## 15. 為什麼 `build/` 不發布？

`build/` 裡通常放建置腳本，例如樣式打包、語言包打包等。

使用者安裝元件庫時，通常不需要知道：

```text
你是怎麼把 Less 打成 CSS 的。
你是怎麼把語言包打進 dist 的。
你是怎麼安排 gulp 任務的。
```

他只需要拿到結果：

```text
dist/
src/
types/
```

所以 `build/` 應該是維護者關心的資料夾，不是一般使用者的主要消費內容。

這也是 `.npmignore` 中排除 `build/` 的合理性。

---

## 16. 為什麼 `test/` 不發布？

`test/` 是專案維護者確認元件品質的資料。

它的目的通常是：

```text
在開發階段驗證元件是否符合規格。
```

而不是：

```text
讓 npm 使用者在自己的專案裡執行 View UI Plus 的測試。
```

所以 `test/` 不屬於元件庫對外 API，也不屬於執行期依賴。

因此它不應該進入 npm 套件主體。

---

## 17. 為什麼 `examples/` 沒有在 `.npmignore` 中出現？

這是很好的讀碼問題。

你可能會想：

```text
.npmignore 沒有排除 examples/
那 examples/ 會不會被發布？
```

答案要回到 `files`。

因為 `package.json.files` 只寫：

```json
[
  "dist",
  "src",
  "types"
]
```

所以 `examples/` 不在白名單中，正常不會被發布。

這也說明：

> 當專案有 `files` 白名單時，不能只看 `.npmignore` 判斷發布內容。

---

## 18. 為什麼 `.github/`、`.travis.yml`、`preview.yml` 不應發布？

這些屬於倉庫協作與 CI/CD 設定。

它們服務的是：

```text
維護者
GitHub
CI 平台
預覽部署平台
```

不是服務：

```text
npm 套件使用者
```

所以它們應該留在 Git 倉庫，不需要出現在 npm 套件裡。

`.npmignore` 中的：

```gitignore
.*
*.yml
```

大致就是在排除這類資料。

---

## 19. 使用者視角：`npm install view-ui-plus` 後，這些欄位如何生效？

假設使用者安裝：

```bash
npm install view-ui-plus
```

大致會發生：

```text
node_modules/view-ui-plus/
│
├─ package.json
├─ README.md
├─ LICENSE
├─ dist/
├─ src/
└─ types/
```

然後使用者寫：

```js
import ViewUIPlus from 'view-ui-plus'
```

打包器會看 `package.json` 裡的入口欄位，例如：

```json
"main": "dist/viewuiplus.min.js"
```

TypeScript / IDE 則會看：

```json
"typings": "types/index.d.ts"
```

所以從消費者視角看，發布邊界就是：

```text
安裝時：
  files 決定拿到哪些內容

寫 JS 時：
  main 決定預設 JS 入口

寫 TS / Vue 時：
  typings 決定型別提示入口
```

---

## 20. 維護者視角：發布前要確認什麼？

如果你是 View UI Plus 的維護者，發布前至少要確認：

| 檢查項目 | 問題 |
|---|---|
| `dist/` 是否已產生？ | `main` 指向的檔案是否存在？ |
| `types/` 是否完整？ | `typings` 指向的 `types/index.d.ts` 是否存在？ |
| `src/` 是否可被使用者理解？ | 是否有不該曝光的內部實驗碼？ |
| `README.md` 是否正確？ | npm 頁面會顯示 README |
| `LICENSE` 是否存在？ | 開源授權需要被清楚帶出 |
| `files` 是否過寬？ | 是否把不該發布的東西帶出去？ |
| `.npmignore` 是否過時？ | 是否有多餘或誤導性的排除規則？ |
| `npm pack` 結果是否符合預期？ | 實際 tarball 才是最終答案 |

最重要的是最後一項：

```bash
npm pack --dry-run
```

或：

```bash
npm pack
```

因為「你以為會發布什麼」不一定等於「npm 實際打包了什麼」。

---

## 21. 讀碼時建議怎麼看這類設定？

看元件庫根目錄時，我建議用這個順序：

### 第一步：先看 `package.json.files`

問：

```text
這個套件想發布哪些資料夾？
```

View UI Plus：

```json
"files": [
  "dist",
  "src",
  "types"
]
```

結論：

```text
發布主體是 dist + src + types。
```

### 第二步：看 `main`

問：

```text
預設 JS 入口在哪？
```

View UI Plus：

```json
"main": "dist/viewuiplus.min.js"
```

結論：

```text
預設入口是 dist 裡的 UMD 產物。
```

### 第三步：看 `typings` / `types`

問：

```text
TypeScript 型別入口在哪？
```

View UI Plus：

```json
"typings": "types/index.d.ts"
```

結論：

```text
型別入口是 types/index.d.ts。
```

### 第四步：看 `.npmignore`

問：

```text
有沒有額外排除不該發布的檔案？
```

View UI Plus：

```gitignore
.*
*.md
*.yml
build/
node_modules/
test/
gulpfile.js
```

結論：

```text
排除點檔、Markdown、YAML、build、node_modules、test、gulpfile.js。
```

### 第五步：看實際 npm tarball

問：

```text
實際發布結果是否符合 package.json 和 .npmignore 的推論？
```

你可以用：

```bash
npm pack --dry-run
```

或觀察 CDN / npm 檔案列表。

---

## 22. 本專案的發布邊界判斷表

| 路徑 / 檔案 | 是否屬於 npm 發布主體 | 判斷理由 |
|---|---:|---|
| `dist/` | 是 | 在 `files` 中，且 `main` 指向 `dist/viewuiplus.min.js` |
| `src/` | 是 | 在 `files` 中 |
| `types/` | 是 | 在 `files` 中，且 `typings` 指向 `types/index.d.ts` |
| `package.json` | 是 | npm 套件必要檔案 |
| `README.md` | 通常是 | npm 特殊保留檔案，且 npm 頁面需要顯示說明 |
| `LICENSE` | 通常是 | npm 特殊保留檔案 |
| `build/` | 否 | `.npmignore` 排除，且不在 `files` |
| `test/` | 否 | `.npmignore` 排除，且不在 `files` |
| `examples/` | 否 | 不在 `files` 白名單 |
| `.github/` | 否 | 點開頭資料夾通常會被排除，且不在 `files` |
| `.travis.yml` | 否 | YAML / CI 設定，不屬於 npm 使用者需要 |
| `gulpfile.js` | 否 | `.npmignore` 明確排除 |
| `node_modules/` | 否 | 不應發布，npm 也會預設處理依賴 |

---

## 23. 與前後章節的分工

這篇只負責「發布邊界」。

| 章節 | 負責問題 | 本篇是否深入？ |
|---|---|---|
| `02-03_根目錄設定檔分類地圖` | 設定檔如何分類 | 只沿用分類，不重新展開 |
| `02-05_打包入口設定_vite-config` | Vite 如何打包 JS 入口 | 不深入 |
| `03_package與依賴分析` | dependencies / devDependencies / scripts | 不深入 |
| `04_build_打包腳本與建置流程` | build、gulp、Vite 打包流程 | 不深入 |
| `05_dist_打包產物分析` | dist 裡的 JS/CSS/lang 產物 | 不深入 |
| `24_types_型別宣告` | types 內部型別設計 | 不深入 |
| `06_src_入口與插件機制` | src/index.js 如何安裝元件庫 | 不深入 |

本篇的責任是：

```text
先知道哪些東西會被送到 npm 使用者手上。
```

不是：

```text
分析這些東西怎麼被產生。
```

---

## 24. 常見誤解

### 誤解 1：`.npmignore` 決定所有發布內容

不精準。

更精準是：

```text
package.json.files + .npmignore + npm 預設規則 + 特殊保留檔案
```

共同決定發布內容。

在 View UI Plus 中，`files` 的權重很高。

---

### 誤解 2：有 `dist/` 就不需要 `src/`

不一定。

元件庫發布 `src/` 很常見，尤其當它想支援：

- 按需引入。
- 原始碼引用。
- 二次封裝。
- 讀碼與 debug。
- 樣式或子模組彈性引用。

---

### 誤解 3：`main` 指向哪裡，就只會發布哪個檔案

錯。

`main` 是入口欄位，不是發布白名單。

發布白名單是 `files`。

例如 View UI Plus：

```json
"main": "dist/viewuiplus.min.js",
"files": [
  "dist",
  "src",
  "types"
]
```

代表預設入口是 `dist/viewuiplus.min.js`，但發布內容不只這個檔案。

---

### 誤解 4：`.npmignore` 有 `*.md`，所以 README 一定不會發布

不精準。

npm 對 README、LICENSE、package.json 這類檔案有特殊處理。

所以發布邊界不能只靠 `.npmignore` 推論。

---

### 誤解 5：原始碼倉庫有什麼，npm 套件就有什麼

錯。

GitHub 倉庫是維護者視角；npm 套件是使用者視角。

例如：

```text
GitHub 倉庫需要 build/、test/、examples/、CI 設定。
npm 套件使用者主要需要 dist/、src/、types/。
```

這兩個邊界不應混為一談。

---

## 25. 如果你仿寫迷你元件庫，可以怎麼設計？

假設你以後做自己的迷你 Vue 元件庫，可以先採用這種設計：

```json
{
  "name": "mini-ui",
  "version": "0.1.0",
  "main": "dist/mini-ui.umd.js",
  "module": "dist/mini-ui.es.js",
  "types": "dist/index.d.ts",
  "files": [
    "dist"
  ]
}
```

如果你希望使用者也能看原始碼，可以改成：

```json
{
  "name": "mini-ui",
  "version": "0.1.0",
  "main": "dist/mini-ui.umd.js",
  "module": "dist/mini-ui.es.js",
  "types": "types/index.d.ts",
  "files": [
    "dist",
    "src",
    "types"
  ]
}
```

如果是學 View UI Plus 的模式，重點是：

```text
dist  → 打包後入口
src   → 原始碼與進階引用
types → 型別宣告
```

但如果你是新專案，我會建議再補上更現代的 `exports`：

```json
{
  "exports": {
    ".": {
      "types": "./types/index.d.ts",
      "import": "./dist/mini-ui.es.js",
      "require": "./dist/mini-ui.umd.js"
    }
  }
}
```

這樣公開 API 邊界會更清楚。

---

## 26. 讀碼練習：請你自己回答這 8 題

### 題目 1

View UI Plus 的 npm 發布主體是哪三個資料夾？

<details>
<summary>參考答案</summary>

`dist/`、`src/`、`types/`。

</details>

---

### 題目 2

`main` 和 `files` 的差異是什麼？

<details>
<summary>參考答案</summary>

`main` 指定預設 JS 入口；`files` 指定 npm 發布白名單。

</details>

---

### 題目 3

`.npmignore` 中排除 `build/` 的原因是什麼？

<details>
<summary>參考答案</summary>

`build/` 是維護者建置腳本，不是一般 npm 使用者消費元件庫時需要的內容。

</details>

---

### 題目 4

`.npmignore` 沒有排除 `examples/`，為什麼它仍然通常不會被發布？

<details>
<summary>參考答案</summary>

因為 `package.json.files` 白名單只有 `dist`、`src`、`types`，`examples/` 不在白名單中。

</details>

---

### 題目 5

`typings: "types/index.d.ts"` 是給誰用的？

<details>
<summary>參考答案</summary>

主要給 TypeScript、IDE、語言服務使用，用於型別提示與型別解析。

</details>

---

### 題目 6

為什麼 `README.md` 可能不受 `*.md` 完全排除？

<details>
<summary>參考答案</summary>

因為 npm 對 README 這類檔案有特殊保留規則，通常會把它保留在套件中。

</details>

---

### 題目 7

View UI Plus 的 `vite.config.js` 產生 ESM 檔，是否代表 package.json 一定用 `module` 指向它？

<details>
<summary>參考答案</summary>

不一定。要實際檢查 `package.json`。View UI Plus 目前主要看到的是 `main` 與 `typings`，沒有明確 `module` / `exports` 欄位。

</details>

---

### 題目 8

如果你要確認實際發布內容，最可靠的本地指令是什麼？

<details>
<summary>參考答案</summary>

`npm pack --dry-run` 或 `npm pack`。

</details>

---

## 27. 9.5 分檢核表

讀完這篇後，你應該能做到：

- [ ] 能分清楚 Git 邊界、Build 邊界、npm 發布邊界。
- [ ] 能說明 `package.json.files` 是發布白名單。
- [ ] 能說明 `.npmignore` 是發布黑名單 / 輔助排除規則。
- [ ] 能說出 View UI Plus 發布主體是 `dist`、`src`、`types`。
- [ ] 能說明 `main` 指向 `dist/viewuiplus.min.js` 的意義。
- [ ] 能說明 `typings` 指向 `types/index.d.ts` 的意義。
- [ ] 能解釋為什麼 `examples/` 沒出現在 `.npmignore`，也不代表會被發布。
- [ ] 能解釋為什麼 `README.md` 可能仍會出現在 npm 套件中。
- [ ] 能知道 `vite.config.js` 的輸出檔不等於 package.json 的入口契約。
- [ ] 能用 `npm pack --dry-run` 檢查實際 tarball。
- [ ] 能把這套發布邊界分析方法套用到其他元件庫。

---

## 28. 本篇最終摘要

View UI Plus 的 npm 發布設計可以濃縮成這張表：

| 層次 | 設定 | 目的 |
|---|---|---|
| 發布內容 | `files: ["dist", "src", "types"]` | 決定 npm 套件主體 |
| JS 入口 | `main: "dist/viewuiplus.min.js"` | 決定預設 JS 載入入口 |
| 型別入口 | `typings: "types/index.d.ts"` | 決定 TypeScript 型別入口 |
| 排除規則 | `.npmignore` | 排除建置、測試、點檔、CI 等非使用者必要內容 |
| 實際檢查 | `npm pack --dry-run` | 驗證最終 tarball 是否符合預期 |

你真正要學到的不是 `.npmignore` 的語法，而是：

> **元件庫工程裡，原始碼倉庫是維護者邊界，npm 套件是使用者邊界；`package.json.files`、`.npmignore`、`main`、`typings` 共同決定這個邊界。**

---

## 29. 後續閱讀建議

接下來建議銜接：

1. `03_package與依賴分析`
   - 深入看 `dependencies`、`devDependencies`、`scripts`。
2. `04_build_打包腳本與建置流程`
   - 看 `build:prod`、`build:style`、`build:lang` 如何產生發布內容。
3. `05_dist_打包產物分析`
   - 看 `dist/` 中每個產物的責任。
4. `24_types_型別宣告`
   - 看 `types/index.d.ts` 如何對外描述元件庫 API。
5. `06_src_入口與插件機制`
   - 看 `src/index.js` 如何把元件庫組裝成 Vue Plugin。

---

## 30. 本篇參考來源

> 以下為撰寫本筆記時核對的主要資料來源。實際讀碼時仍建議以當前倉庫內容與 `npm pack --dry-run` 結果為準。

- View UI Plus GitHub：`https://github.com/view-design/ViewUIPlus`
- View UI Plus `package.json`：`https://github.com/view-design/ViewUIPlus/blob/master/package.json`
- View UI Plus `.npmignore`：`https://github.com/view-design/ViewUIPlus/blob/master/.npmignore`
- View UI Plus `vite.config.js`：`https://github.com/view-design/ViewUIPlus/blob/master/vite.config.js`
- npm package.json files 官方文件：`https://docs.npmjs.com/cli/v10/configuring-npm/package-json/#files`
- npm developers 官方文件：`https://docs.npmjs.com/cli/v10/using-npm/developers/#keeping-files-out-of-your-package`
- jsDelivr npm package 檔案列表：`https://cdn.jsdelivr.net/npm/view-ui-plus/`
