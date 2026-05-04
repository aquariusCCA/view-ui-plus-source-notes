# 02-07_程式碼規範_ESLint_TSLint_EditorConfig

> 章節：`02_根目錄與工程設定`  
> 筆記定位：根目錄工程設定中的「程式碼規範工具鏈」  
> 專案：View UI Plus  
> 建議閱讀順序：先讀本篇，再讀 `03_package與依賴分析`、`24_types_型別宣告`、`26_test_測試`

---

## 0. 本篇先給結論

View UI Plus 根目錄中的程式碼規範相關設定，主要由三層組成：

```text
.editorconfig
    ↓
統一不同編輯器 / IDE 的基礎文字格式

.eslintrc.js + .eslintignore
    ↓
檢查 Vue / JavaScript / 部分工程程式碼規範

tslint.json
    ↓
保留 TypeScript 時代的規範設定，但目前不是主要 lint 入口
```

這一篇要建立的核心觀念是：

> **程式碼規範不是只有「格式化」，而是由「編輯器格式規範」、「語法 / 風格檢查」、「型別相關規範」、「工程流程入口」共同組成。**

在 View UI Plus 裡面，`package.json` 的 lint script 指向：

```bash
vue-cli-service lint --fix
```

所以從工程執行角度看，專案主要 lint 入口是 Vue CLI 的 ESLint 流程。

---

## 1. 本篇學習目標

讀完本篇，你應該可以回答以下問題：

1. 為什麼 `.editorconfig`、`.eslintrc.js`、`.eslintignore`、`tslint.json` 都算工程設定？
2. `.editorconfig` 和 ESLint 的責任有什麼差異？
3. View UI Plus 的 ESLint 設定為什麼看起來很精簡？
4. `.eslintignore` 排除 `src/directives` 與 `src/utils/throttle.js` 代表什麼工程訊號？
5. `tslint.json` 存在，但為什麼不代表整個專案仍以 TSLint 作為主要檢查入口？
6. 如果你要仿寫一個迷你元件庫，應該如何設計自己的程式碼規範工具鏈？

---

## 2. 本篇在 02 章的位置

`02_根目錄與工程設定` 是「工程地圖」章節，不是深入語法規則章節。

本篇負責回答：

```text
這個專案如何約束程式碼風格？
這些約束從哪裡進入？
哪些設定是主要入口？
哪些設定可能是歷史遺留？
```

本篇不負責深入：

| 不深入內容 | 留到哪一章 |
|---|---|
| `package.json` dependencies / devDependencies 全量分析 | `03_package與依賴分析` |
| Vue CLI 與 Vite 的開發 / 打包差異 | `02-04_開發模式設定_Vite與VueCLI.md`、`04_build_打包腳本與建置流程` |
| TypeScript 型別宣告如何設計 | `24_types_型別宣告` |
| 測試工具鏈如何運作 | `26_test_測試` |
| 元件 API 設計規範 | `28_高階專題_元件API設計` |
| 樣式命名與 prefixCls | `33_高階專題_樣式主題與PrefixCls` |

---

## 3. 根目錄規範設定總覽

View UI Plus 根目錄中，和程式碼規範直接相關的檔案主要有：

| 檔案 | 類型 | 責任 |
|---|---|---|
| `.editorconfig` | 編輯器格式規範 | 統一縮排、換行、編碼、行尾空白 |
| `.eslintrc.js` | ESLint 規則設定 | 設定 Vue / JavaScript lint 規則 |
| `.eslintignore` | ESLint 忽略設定 | 指定哪些路徑不進入 ESLint 檢查 |
| `tslint.json` | TSLint 規則設定 | 保留 TypeScript lint 規則，偏歷史設定 |
| `package.json` | 工程腳本入口 | 提供 `lint` script，決定實際執行哪個檢查流程 |

可以用下面這張地圖理解：

```text
開發者寫程式
    │
    ├─ 編輯器讀取 .editorconfig
    │      └─ 統一基本文字格式
    │
    ├─ 執行 npm run lint
    │      └─ package.json scripts.lint
    │              └─ vue-cli-service lint --fix
    │                      └─ 讀取 .eslintrc.js
    │                      └─ 參考 .eslintignore
    │
    └─ TypeScript 相關檔案
           └─ 可能被編輯器 / 舊工具參考 tslint.json
```

---

## 4. 先分清楚三種「規範」

很多人在讀開源專案時，會把 `.editorconfig`、ESLint、Prettier、TSLint 全部混在一起。這樣會導致讀碼時無法判斷：

- 哪些規則真的會被 CI 或 script 執行？
- 哪些只是編輯器輔助？
- 哪些是舊工程留下來但不一定還是主要入口？

建議你用三層模型來看。

---

### 4.1 第一層：文字格式規範

代表檔案：

```text
.editorconfig
```

這一層處理的是「檔案文字層級」問題。

例如：

| 規範 | 解決問題 |
|---|---|
| 編碼 | 避免不同系統出現亂碼 |
| 換行符號 | 避免 Windows / macOS / Linux 換行差異造成大量 diff |
| 縮排 | 避免有人用 tab、有人用 space |
| 檔案結尾換行 | 避免 Git diff 出現不必要變動 |
| 行尾空白 | 避免無意義空白進入版本控制 |

這一層不理解 Vue，也不理解 JavaScript 語法。

它只處理：

```text
這份檔案在文字格式上是否一致？
```

---

### 4.2 第二層：語法與程式碼品質規範

代表檔案：

```text
.eslintrc.js
.eslintignore
```

這一層處理的是 JavaScript / Vue SFC 的語法與規則。

例如：

| 規範 | 解決問題 |
|---|---|
| Vue 語法檢查 | 避免 `.vue` 檔出現不符合 Vue 規範的寫法 |
| ES module 檢查 | 支援 `import` / `export` |
| 全域變數設定 | 避免 `$`、`BMap` 被誤判成未定義 |
| 忽略路徑 | 避免某些歷史程式碼或特殊檔案造成 lint 噪音 |

這一層比 `.editorconfig` 更懂程式語言，但不等於完整型別檢查。

---

### 4.3 第三層：TypeScript 規範

代表檔案：

```text
tslint.json
```

這一層處理的是 TypeScript 程式碼風格與部分型別相關規範。

但在 View UI Plus 中，你要特別注意：

> `tslint.json` 存在，不代表目前主要 lint 指令一定有執行 TSLint。

判斷依據不是「檔案是否存在」，而是要看：

```text
package.json scripts 裡有沒有呼叫 tslint？
CI 裡有沒有呼叫 tslint？
編輯器是否設定使用 tslint？
```

就本章目前觀察到的根目錄工程入口而言，`package.json` 的 `lint` script 是走 `vue-cli-service lint --fix`，不是直接執行 `tslint`。

---

## 5. `package.json`：真正的 lint 入口

在工程專案中，規範檔案本身只是「規則」。真正重要的是：

> 哪個 script 會把規則跑起來？

View UI Plus 的 `package.json` 中有：

```bash
npm run lint
```

對應的指令是：

```bash
vue-cli-service lint --fix
```

這代表：

1. 開發者執行 `npm run lint` 時，會進入 Vue CLI 的 lint 流程。
2. `--fix` 代表能自動修正的問題會被自動修正。
3. 這個 lint 流程主要會讀 ESLint 設定，而不是直接讀 `tslint.json`。
4. 專案中的 ESLint 版本與 Vue CLI ESLint plugin 版本，會共同影響實際 lint 行為。

這裡的重點不是背指令，而是建立讀碼方法：

```text
看到 .eslintrc.js
    ↓
不要急著分析規則
    ↓
先回 package.json 找 scripts
    ↓
確認專案到底怎麼執行 lint
```

---

## 6. `.editorconfig`：跨編輯器的最低共同規範

### 6.1 它負責什麼？

`.editorconfig` 的定位是：

> 不管你用 VS Code、WebStorm、Vim、Sublime，只要編輯器支援 EditorConfig，就盡量套用一致的基礎格式。

它不是 JavaScript 工具，也不是 Vue 工具。

它是更底層的：

```text
檔案文字格式協議
```

---

### 6.2 View UI Plus 的主要設定方向

View UI Plus 的 `.editorconfig` 包含以下方向：

| 規則方向 | 專案採用 |
|---|---|
| 是否為最上層設定 | `root = true` |
| 預設編碼 | UTF-8 |
| 換行格式 | LF |
| 縮排大小 | 4 spaces |
| 縮排風格 | space |
| 檔案結尾 | 插入 final newline |
| 行尾空白 | 預設移除 |
| Markdown | 不移除行尾空白 |
| Makefile | 使用 tab |

你要看懂的是它背後的工程意義。

---

### 6.3 `root = true` 的意義

`root = true` 表示：

```text
編輯器向上尋找 .editorconfig 時，到這個檔案為止。
```

如果沒有這個設定，編輯器可能繼續往父層資料夾找 `.editorconfig`，導致受到更外層設定影響。

對開源專案來說，`root = true` 很重要，因為專案不能假設每個開發者的外層工作區設定都一樣。

---

### 6.4 為什麼預設縮排是 4 spaces？

View UI Plus 的 `.editorconfig` 預設使用 4 spaces。

這代表這個專案在文字層面希望程式碼以 4 空格縮排為基準。

對你讀碼的影響是：

```text
看到 4 spaces 不要急著用自己的 2 spaces 喜好判斷好壞。
先尊重原專案的一致性。
```

在讀開源專案時，第一原則不是馬上改成自己喜歡的格式，而是先理解原專案的風格約束。

---

### 6.5 為什麼 Markdown 不移除行尾空白？

`.editorconfig` 對 Markdown 做了例外處理：

```text
Markdown 檔不強制移除行尾空白
```

這通常是因為 Markdown 中，行尾空白可能被用來表示換行。

所以 `.editorconfig` 不是一刀切，而是針對不同檔案類型做了不同規範。

這是你設計工程規範時可以學的地方：

> 好的規範不是越嚴越好，而是要符合檔案類型的語意。

---

### 6.6 Makefile 使用 tab 的原因

`.editorconfig` 對 Makefile 設定 tab。

這是因為 Makefile 的語法對 tab 有特殊要求。某些位置如果使用 space，可能會直接造成錯誤。

這個設定告訴你：

> 工程規範要尊重工具本身的語法要求，而不是用統一偏好覆蓋所有檔案。

---

## 7. `.eslintrc.js`：Vue / JavaScript 的主要規範入口

### 7.1 它的定位

`.eslintrc.js` 是 ESLint 設定檔。

在 View UI Plus 中，它的設定相當精簡，主要目的不是建立一套非常嚴格的風格規範，而是讓 Vue 3 元件庫在基本規則下可以被檢查。

你可以把它理解成：

```text
最低限度的 Vue 3 + JavaScript lint 設定
```

---

### 7.2 `root: true`

ESLint 的 `root: true` 和 EditorConfig 的概念類似：

```text
告訴 ESLint 不要繼續向父層尋找其他 ESLint 設定。
```

這可以避免開發者本機外層資料夾的 ESLint 設定影響本專案。

對開源專案來說，這是很常見的防護。

---

### 7.3 `env: { node: true }`

這表示 ESLint 檢查時，會把 Node.js 環境中的全域變數視為合法。

這對根目錄設定檔很重要，因為很多設定檔會使用：

```js
module.exports
require
process
__dirname
```

如果沒有設定 Node 環境，ESLint 可能會把這些符號誤判成未定義。

---

### 7.4 `globals`：允許專案中的特殊全域變數

View UI Plus 的 ESLint 設定中有全域變數，例如：

```text
$
BMap
```

這代表專案中可能存在：

1. 使用 jQuery `$` 的歷史或外部整合情境。
2. 使用百度地圖 `BMap` 的外部全域物件情境。

這裡要注意一件事：

> `globals` 不代表推薦到處使用全域變數，它只是告訴 ESLint：這些名稱如果出現，不要當作未定義錯誤。

讀碼時看到 `globals`，你要想到的是：

```text
這個專案可能和某些外部 script / 全域 SDK 有整合。
```

而不是：

```text
這個專案鼓勵大量使用全域變數。
```

---

### 7.5 `extends: ['plugin:vue/vue3-essential']`

這是整份 `.eslintrc.js` 的核心之一。

`plugin:vue/vue3-essential` 表示專案套用 Vue 3 的 essential 規則。

你可以把它理解成：

```text
只開啟 Vue 3 中最基本、最必要的規則。
```

它不是最嚴格的 Vue 規範集。

通常 ESLint Vue plugin 的規則層級可以大致理解為：

```text
essential
    ↓
strongly-recommended
    ↓
recommended
```

View UI Plus 使用 essential，代表它偏向：

```text
保底檢查，不過度干預程式碼風格。
```

這對開源元件庫是可以理解的，尤其是歷史包袱較多、檔案類型混合、需要降低 lint 導入成本的專案。

---

### 7.6 `parserOptions`

View UI Plus 使用的 parser 方向是：

```text
babel-eslint
ECMAScript 6
sourceType: module
```

這表示：

1. 透過 Babel ESLint parser 處理 JavaScript 語法。
2. 支援 ES6 語法。
3. 程式碼以 ES module 形式解析，也就是支援 `import` / `export`。

這和元件庫工程很吻合，因為 View UI Plus 的源碼大量使用模組匯入與匯出。

---

### 7.7 `vue/script-setup-uses-vars`

規則中關閉了：

```text
vue/script-setup-uses-vars
```

這是和 Vue 3 `<script setup>` 相關的規則。

它的存在代表專案需要處理 Vue 3 SFC 的語法環境，但目前設定選擇關閉這條規則。

讀碼時不需要過度解讀成「專案大量使用 script setup」，而應該理解成：

```text
ESLint 規則需要配合 Vue 3 SFC 語法演進。
有些規則在特定版本組合下可能需要調整，避免誤報或相容性問題。
```

---

## 8. `.eslintignore`：不是所有程式碼都進 lint

### 8.1 它負責什麼？

`.eslintignore` 的定位是：

```text
告訴 ESLint 哪些路徑不要檢查。
```

View UI Plus 的 `.eslintignore` 排除了：

```text
src/directives
src/utils/throttle.js
```

這是一個很重要的讀碼訊號。

---

### 8.2 排除 `src/directives` 代表什麼？

`src/directives` 是自訂指令相關目錄。

它被排除 ESLint 檢查，可能代表：

1. 該目錄中有部分程式碼風格和 ESLint 規則不完全一致。
2. 該目錄可能包含歷史程式碼、第三方改寫程式碼或特殊寫法。
3. 專案維護者選擇先讓主要 lint 流程可順利運作，而不是一次修正所有舊程式碼。
4. 自訂指令可能涉及較多 DOM 操作、事件綁定、兼容處理，容易和一般規則產生衝突。

這裡要用「工程現實」理解，不要只用「理想規範」理解。

在大型開源專案或企業舊專案中，常見情況是：

```text
不是所有程式碼一開始都能被規範工具完全接管。
```

---

### 8.3 排除 `src/utils/throttle.js` 代表什麼？

`throttle.js` 這類工具函式經常涉及：

- 函式閉包
- 計時器
- `this` 綁定
- arguments
- 特殊邊界處理
- 早期 JavaScript 寫法

如果這個檔案被排除 lint，可能代表它使用了某些 ESLint 不喜歡、但專案暫時接受的寫法。

讀碼時你可以在心裡標註：

```text
這個檔案可能是特殊工具函式或歷史程式碼。
後續讀到 20_src-utils_工具函式 時再深入。
```

不要在 02 章就陷進去逐行分析。

---

### 8.4 `.eslintignore` 的工程意義

`.eslintignore` 不是單純「偷懶」。

它是一種工程取捨：

```text
先讓 lint 可以覆蓋主要程式碼
再逐步處理特殊目錄
```

在企業專案中也很常見。

例如你在銀行舊系統裡可能看到：

```text
某些 legacy module 暫時不進新規範
某些 vendor code 不做 lint
某些自動生成檔案不檢查
某些過度歷史的檔案只允許編譯，不要求風格一致
```

這不一定漂亮，但很真實。

---

## 9. `tslint.json`：存在，但要判斷是否仍是主流程

### 9.1 它負責什麼？

`tslint.json` 是 TSLint 的設定檔。

TSLint 過去是 TypeScript 常見的 lint 工具，負責檢查 TypeScript 程式碼的規範、風格與部分型別相關問題。

View UI Plus 的 `tslint.json` 包含大量規則，例如：

| 規則方向 | 範例意義 |
|---|---|
| TypeScript 專用規則 | 是否允許 `any`、namespace、non-null assertion |
| 函式規則 | 是否要求 async promise、是否允許傳統 function |
| 控制流程規則 | 是否要求 curly、是否禁止 fall-through |
| 風格規則 | 引號、空白、最大行寬、成員排序 |
| 安全性規則 | 禁止 eval、debugger、某些不安全寫法 |
| Promise 規則 | 檢查 floating promises、await promise |
| import 規則 | 限制 require、side-effect import |

它看起來比 `.eslintrc.js` 複雜很多。

但這不代表它是目前最重要的入口。

---

### 9.2 為什麼不能只看檔案存在？

讀工程設定時有一個重要原則：

> **設定檔存在，不等於它一定被執行。**

你需要檢查三個地方：

```text
1. package.json scripts 有沒有呼叫？
2. CI 設定有沒有呼叫？
3. 編輯器 / IDE 是否會自動讀取？
```

就目前根目錄的 `package.json` 而言，`lint` script 沒有直接呼叫 `tslint`。

所以在本章中，較合理的判斷是：

```text
tslint.json 是專案中保留的 TypeScript lint 設定；
但主要工程 lint 入口是 ESLint / Vue CLI lint。
```

---

### 9.3 TSLint 的歷史訊號

TSLint 現在已經不是新 TypeScript 專案的主流選擇。現代 TypeScript 專案通常會使用 ESLint 搭配 `typescript-eslint`。

所以在 View UI Plus 看到 `tslint.json`，你可以把它視為一個歷史訊號：

```text
這個專案不是從零開始的新式 Vite + TypeScript + ESLint 架構。
它有 Vue CLI、Vite、JavaScript、TypeScript 型別宣告、TSLint 等多個時期的工程痕跡。
```

這和前面幾篇筆記的結論一致：

> View UI Plus 不是一個純粹的新式 Vite 專案，而是一個經歷過多階段演進的 Vue 元件庫工程。

---

## 10. ESLint 與 TSLint 在本專案中的分工判斷

可以用這張表來理解：

| 比較項目 | ESLint | TSLint |
|---|---|---|
| 設定檔 | `.eslintrc.js` | `tslint.json` |
| 是否有 ignore 檔 | 有，`.eslintignore` | 由 `linterOptions.exclude` 控制 |
| package script 是否直接呼叫 | 是，透過 `vue-cli-service lint --fix` | 沒看到直接 script 呼叫 |
| 主要檢查對象 | Vue / JS / 工程源碼 | TypeScript 規則 |
| 在本專案定位 | 主要 lint 入口 | 偏保留 / 歷史 / 輔助設定 |
| 對後續章節影響 | 影響讀 Vue 元件與 JS 工具程式 | 影響理解 `types` 與舊 TS 規範痕跡 |

---

## 11. 這組規範透露出的專案性格

從 `.editorconfig`、`.eslintrc.js`、`.eslintignore`、`tslint.json` 可以看出 View UI Plus 的幾個特徵。

---

### 11.1 它不是強規範型專案

`.eslintrc.js` 很精簡，Vue 規則只使用 essential 等級。

這代表專案不是走：

```text
非常嚴格的格式與風格控制
```

而比較像是：

```text
保留必要檢查，避免基本錯誤，不過度強制程式碼風格
```

---

### 11.2 它有歷史演進痕跡

同時存在：

```text
Vue CLI
Vite
ESLint
TSLint
JavaScript source
TypeScript declaration
```

這代表它不是一次性設計出來的純新架構，而是逐步演進。

這對你讀碼很重要，因為你不能用「2026 年新專案最佳實踐」去要求它每個地方都一致。

讀開源專案要區分：

```text
設計上的選擇
歷史上的遺留
相容性上的妥協
維護成本上的取捨
```

---

### 11.3 它重視可運作性大於完美規範

`.eslintignore` 排除部分路徑，代表專案可能更重視：

```text
讓主要開發流程可以穩定運作
```

而不是追求：

```text
所有檔案 100% 符合同一套 lint 規則
```

這是成熟專案常見的現實取捨。

---

## 12. 讀碼時要避免的誤解

### 誤解一：有 `.editorconfig` 就等於有格式化工具

錯。

`.editorconfig` 只是編輯器格式約定，不是完整格式化器。

它不會像 Prettier 那樣重排 JavaScript 表達式、Vue template、物件字面量、函式參數。

---

### 誤解二：有 `tslint.json` 就代表專案主要使用 TSLint

錯。

要看 script 與 CI 是否真的執行。

在 View UI Plus 目前根目錄的 `package.json` 中，主要 lint script 是 Vue CLI lint。

---

### 誤解三：`.eslintignore` 代表被忽略的程式碼不重要

錯。

被忽略可能只是因為：

- 歷史程式碼太多
- 特殊寫法較多
- 暫時不值得為了 lint 修改
- 可能來自外部或早期實作
- 修正成本高於當前收益

被忽略不代表它在功能上不重要。

---

### 誤解四：ESLint 規則越嚴越好

不一定。

對元件庫、舊專案、大型多人協作專案來說，規則太嚴可能導致：

- 大量歷史錯誤一次爆出
- PR diff 過大
- 維護者不願意改
- 真正的功能修改被格式 diff 淹沒
- 新舊工具鏈相容性問題增加

規範的目的不是「顯得專業」，而是降低協作成本。

---

## 13. 對你學 View UI Plus 的實際讀碼建議

這篇讀完後，你不需要把每條 ESLint / TSLint 規則背起來。

你應該做到的是：

```text
看到程式碼風格不一致時
    ↓
先想到工程設定可能允許這種不一致

看到某些檔案沒被 lint
    ↓
先想到歷史包袱或特殊用途

看到 TSLint 設定很長
    ↓
不要立刻以為它是主流程

看到 npm run lint
    ↓
知道要回到 package.json scripts 找真正入口
```

---

## 14. 和後續章節的銜接

### 14.1 銜接 `03_package與依賴分析`

到 `03_package與依賴分析` 時，你要回頭看：

```text
@vue/cli-plugin-eslint
eslint
eslint-plugin-vue
babel-eslint
tslint
typescript
```

這些 devDependencies 如何支撐本篇提到的規範工具鏈。

本篇只先建立定位，下一章才深入依賴版本與工具關係。

---

### 14.2 銜接 `19_src-directives_自訂指令`

因為 `.eslintignore` 排除了 `src/directives`，所以後面讀自訂指令時要注意：

```text
這個目錄可能沒有被主 lint 流程完整約束。
```

這不代表它不好，而是提醒你：

```text
讀這個目錄時要更靠自己的 JavaScript / DOM / Vue directive 理解能力。
```

---

### 14.3 銜接 `20_src-utils_工具函式`

`src/utils/throttle.js` 被單獨排除，後面讀工具函式時要特別標註它。

建議你在 `20_src-utils_工具函式` 中專門安排一小節：

```text
為什麼 throttle.js 被 ESLint 排除？
它用了哪些特殊寫法？
如果要重構成現代 JS，可以怎麼寫？
```

---

### 14.4 銜接 `24_types_型別宣告`

`tslint.json` 雖然不是主 lint script，但它仍然提醒你：

```text
這個專案不是完全沒有 TypeScript 規範意識。
```

只是 View UI Plus 的 TypeScript 重點更偏向：

```text
types/index.d.ts
元件型別宣告
對外 API 型別支援
```

而不是整個 `src` 都用 TypeScript 重寫。

---

## 15. 如果你要仿寫迷你元件庫，該怎麼設計？

如果你要做自己的迷你 Vue 3 元件庫，不建議完全照抄 View UI Plus 的規範設定。

因為 View UI Plus 有歷史包袱，你的新專案可以更乾淨。

---

### 15.1 建議的現代版工具鏈

```text
.editorconfig
    ↓
Prettier
    ↓
ESLint
    ↓
typescript-eslint
    ↓
husky / lint-staged
```

如果你是新專案，可以這樣分工：

| 工具 | 責任 |
|---|---|
| `.editorconfig` | 統一編輯器基礎格式 |
| Prettier | 統一程式碼排版 |
| ESLint | 檢查 JavaScript / Vue / TypeScript 問題 |
| typescript-eslint | 讓 ESLint 能處理 TypeScript |
| lint-staged | commit 前只檢查改動檔案 |
| husky | 掛 Git hooks |

---

### 15.2 不建議新專案再使用 TSLint

新專案如果使用 TypeScript，建議直接使用：

```text
ESLint + typescript-eslint
```

而不是 TSLint。

原因是 TSLint 已經屬於舊工具線。學 View UI Plus 時，你要能看懂它存在的原因；但自己仿寫時，不必把歷史包袱也搬過來。

---

### 15.3 迷你元件庫可以採用的簡化版

對你的學習專案來說，可以先用：

```json
{
  "scripts": {
    "lint": "eslint . --fix"
  }
}
```

搭配：

```text
.editorconfig
.eslintrc.cjs
.eslintignore
.prettierrc
```

如果使用 Vue 3 + TypeScript，可以再加：

```text
@typescript-eslint/parser
@typescript-eslint/eslint-plugin
eslint-plugin-vue
```

你的重點不是把工具裝滿，而是理解：

```text
每個工具解決什麼問題？
哪個 script 會真的執行？
哪些規則適合目前階段？
```

---

## 16. 建議你實際打開檔案的順序

讀這篇時，建議照這個順序打開根目錄檔案：

```text
1. package.json
2. .editorconfig
3. .eslintrc.js
4. .eslintignore
5. tslint.json
```

為什麼先看 `package.json`？

因為你要先確認：

```text
真正會執行的 script 是什麼？
```

再去看各設定檔，才不會把沒有接到 script 的設定誤認為主流程。

---

## 17. 讀碼檢核表

讀完本篇後，你可以用下面 checklist 確認自己是否真的看懂。

### 17.1 基礎理解

- [ ] 我知道 `.editorconfig` 主要負責編輯器文字格式。
- [ ] 我知道 ESLint 主要負責 JavaScript / Vue 程式碼規範。
- [ ] 我知道 `.eslintignore` 可以排除特定路徑。
- [ ] 我知道 TSLint 是 TypeScript 舊式 lint 工具。
- [ ] 我知道 `package.json scripts` 才是判斷工具是否被執行的重要入口。

---

### 17.2 View UI Plus 專案理解

- [ ] 我知道 View UI Plus 的 lint script 是 `vue-cli-service lint --fix`。
- [ ] 我知道 `.eslintrc.js` 使用 Vue 3 essential 規則。
- [ ] 我知道 ESLint 設定中有 `$` 與 `BMap` 這類全域變數。
- [ ] 我知道 `.eslintignore` 排除了 `src/directives`。
- [ ] 我知道 `.eslintignore` 也排除了 `src/utils/throttle.js`。
- [ ] 我知道 `tslint.json` 雖然存在，但不是目前 package script 的直接主入口。
- [ ] 我知道這些設定呈現出 View UI Plus 的歷史演進痕跡。

---

### 17.3 工程判斷能力

- [ ] 我不會只因為檔案存在，就認定它一定被執行。
- [ ] 我能區分「編輯器規範」、「lint 規範」、「型別規範」。
- [ ] 我能判斷哪些設定是主流程，哪些可能是歷史遺留。
- [ ] 我能理解 `.eslintignore` 是工程取捨，不是單純偷懶。
- [ ] 我能把這套分析方法套用到其他 Vue 開源專案。

---

## 18. 本篇最重要的三句話

第一句：

> **`.editorconfig` 管文字格式，ESLint 管程式碼規範，TSLint 是 TypeScript 舊規範工具。**

第二句：

> **判斷一個工具是否真的生效，不要只看設定檔是否存在，要看 `package.json scripts` 和 CI 是否執行它。**

第三句：

> **View UI Plus 的規範工具鏈呈現出歷史演進痕跡：Vue CLI、Vite、ESLint、TSLint、JavaScript、TypeScript declaration 並存。**

---

## 19. 你可以如何做筆記延伸？

建議你在後續讀碼時補三種註記：

### 19.1 看到被 ESLint 忽略的檔案

記錄格式：

```text
檔案：
被忽略原因推測：
是否有特殊語法：
是否值得重構：
重構風險：
```

---

### 19.2 看到特殊全域變數

記錄格式：

```text
全域變數名稱：
出現位置：
來源 SDK：
是否可改為 import：
是否影響測試：
```

---

### 19.3 看到 TSLint 規則

記錄格式：

```text
規則名稱：
規則目的：
現代 ESLint / typescript-eslint 是否有對應規則：
在本專案中是否真的被執行：
```

---

## 20. 本篇總結

`02-07_程式碼規範_ESLint_TSLint_EditorConfig` 這篇的重點，不是教你背 ESLint 或 TSLint 的每一條規則，而是讓你建立工程讀碼時的判斷能力。

View UI Plus 的規範設定可以總結為：

```text
.editorconfig
    → 統一跨編輯器的基本文字格式

.eslintrc.js
    → 提供 Vue 3 / JavaScript 的基本 ESLint 檢查

.eslintignore
    → 排除特定歷史或特殊路徑

tslint.json
    → 保留 TypeScript 舊式 lint 規則設定

package.json scripts.lint
    → 實際 lint 入口，走 vue-cli-service lint --fix
```

對你學元件庫工程來說，這篇最重要的價值是：

> **你開始能從根目錄設定檔判斷一個專案的工程成熟度、歷史包袱、規範強度與維護取捨。**

這種能力比單純知道 ESLint 怎麼設定更重要。

---

## 21. 資料來源

本筆記依據以下 View UI Plus 根目錄檔案整理：

- `package.json`
- `.editorconfig`
- `.eslintrc.js`
- `.eslintignore`
- `tslint.json`

另參考 TSLint 官方與 typescript-eslint 對 TSLint 現況的說明，用於判斷新專案不建議再以 TSLint 作為主要 TypeScript lint 工具。
