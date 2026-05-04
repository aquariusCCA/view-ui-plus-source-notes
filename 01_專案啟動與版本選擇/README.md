# 01_專案啟動與版本選擇

> View UI Plus 源碼閱讀筆記  
> 章節定位：正式讀 View UI Plus 源碼前的版本、環境、資源入口、啟動流程與讀碼基準準備  
> 適用對象：想透過 View UI Plus 學習 Vue 3 元件庫設計、企業後台元件封裝與前端工程化的開發者  
> 建立日期：2026-05-04

---

## 1. 本章定位

`01_專案啟動與版本選擇` 是整個 View UI Plus 讀碼系列的第一個正式準備章。

這一章不急著分析：

```text
Button 怎麼寫
Form 怎麼驗證
Table 怎麼渲染
Message 怎麼命令式呼叫
樣式系統怎麼設計
TypeScript 型別怎麼輸出
```

而是先處理讀開源專案最容易混亂的幾件事：

```text
1. 我為什麼要讀 View UI Plus？
2. 我要讀哪個版本？
3. 官方資料入口在哪裡？
4. 本地環境要怎麼準備？
5. 專案要怎麼 clone 與啟動？
6. 啟動失敗要怎麼排查？
7. 一般使用者怎麼安裝 View UI Plus？
8. 使用者視角和源碼視角有什麼差異？
9. 讀碼版本與 commit hash 要怎麼記錄？
10. 進入下一章前要完成哪些檢核？
```

本章的核心目標是：

> **先把版本、環境、官方資源、啟動流程、使用者鏈路與讀碼基準固定好，再進入真正的源碼分析。**

---

## 2. 為什麼本章很重要？

讀元件庫源碼時，很多人一開始就打開 `src/components`，然後直接開始看元件。

這樣容易遇到幾個問題：

```text
看的是哪個版本不知道
GitHub master 和 npm 版本對不起來
專案跑不起來
不知道 dev 和 dev2 的差異
不知道 CSS 是怎麼引入的
不知道 app.use 背後對應 install
不知道元件 API 和 source 的關係
筆記寫完後無法回溯到當時的 commit
```

本章就是為了避免這些問題。

你完成本章後，後續進入：

```text
02_根目錄與工程設定
03_package與依賴分析
04_build_打包腳本與建置流程
05_dist_打包產物分析
06_src_入口與插件機制
07_元件註冊機制
```

時，才會知道自己正在分析的是：

```text
哪個版本
哪個 commit
哪個環境
哪個入口
哪種視角
哪條使用者鏈路
哪條源碼鏈路
```

---

## 3. 本章目錄

```text
01_專案啟動與版本選擇
├── README.md
├── 01-01_ViewUIPlus專案定位與學習目標.md
├── 01-02_版本選擇策略_讀源碼要選哪個版本.md
├── 01-03_官方倉庫_npm_文檔站_資源入口整理.md
├── 01-04_本地開發環境準備_Node_pnpm_Vue版本.md
├── 01-05_從零Clone與啟動ViewUIPlus源碼.md
├── 01-06_啟動失敗排查清單.md
├── 01-07_使用者視角安裝ViewUIPlus.md
├── 01-08_源碼讀碼視角與使用者視角的差異.md
├── 01-09_版本鎖定與讀碼基準紀錄.md
└── 01-10_本章學習檢核表.md
```

---

## 4. 建議閱讀順序

本章建議按照檔案順序閱讀，不建議跳讀。

原因是這一章有明確的前後依賴：

```text
先知道為什麼讀
再決定讀哪個版本
再整理官方資源
再準備環境
再 clone 與啟動
再處理啟動失敗
再建立使用者視角
再轉成源碼視角
再鎖定讀碼基準
最後做章節檢核
```

推薦順序：

| 順序 | 筆記 | 閱讀目的 |
|---:|---|---|
| 1 | `01-01_ViewUIPlus專案定位與學習目標.md` | 確認為什麼要讀 View UI Plus |
| 2 | `01-02_版本選擇策略_讀源碼要選哪個版本.md` | 確認讀碼版本策略 |
| 3 | `01-03_官方倉庫_npm_文檔站_資源入口整理.md` | 建立官方資源入口地圖 |
| 4 | `01-04_本地開發環境準備_Node_pnpm_Vue版本.md` | 準備 Node、npm、pnpm、Vue、Vite 環境 |
| 5 | `01-05_從零Clone與啟動ViewUIPlus源碼.md` | clone 本體源碼並嘗試啟動 |
| 6 | `01-06_啟動失敗排查清單.md` | 建立錯誤排查流程 |
| 7 | `01-07_使用者視角安裝ViewUIPlus.md` | 建立乾淨 Vue 3 使用者測試專案 |
| 8 | `01-08_源碼讀碼視角與使用者視角的差異.md` | 把使用者 API 轉成源碼問題 |
| 9 | `01-09_版本鎖定與讀碼基準紀錄.md` | 固定版本、commit、Node、啟動結果 |
| 10 | `01-10_本章學習檢核表.md` | 檢查是否能進入下一章 |

---

## 5. 每篇筆記的用途

### 5.1 `01-01_ViewUIPlus專案定位與學習目標.md`

這篇回答：

> 我為什麼要讀 View UI Plus？

重點包含：

```text
View UI Plus 的專案定位
它適合學什麼
它不適合一開始學什麼
本系列的學習目標
讀碼與仿寫的關係
```

完成這篇後，你應該知道：

```text
我不是只要會用 View UI Plus，而是要透過它學 Vue 3 元件庫設計。
```

---

### 5.2 `01-02_版本選擇策略_讀源碼要選哪個版本.md`

這篇回答：

> 讀源碼時應該看 master、npm latest、tag，還是 commit？

重點包含：

```text
為什麼讀源碼前要固定版本
master / main 的優缺點
npm latest 的用途
Git tag 的用途
commit hash 的重要性
第一輪讀碼版本建議
```

完成這篇後，你應該知道：

```text
版本號只是方向，commit hash 才是精準讀碼基準。
```

---

### 5.3 `01-03_官方倉庫_npm_文檔站_資源入口整理.md`

這篇回答：

> View UI Plus 的官方資料要去哪裡查？

重點包含：

```text
GitHub 官方倉庫
npm package
官方文檔站
官方安裝頁
GitHub Releases
GitHub Tags
官方範例專案
jsDelivr CDN
Issues / PR
```

完成這篇後，你應該知道：

```text
源碼問題看 GitHub / 本地 commit
使用方式看官方文檔
版本問題看 npm + package.json + tag
發布產物看 npm / jsDelivr
踩坑問題看 Issues
```

---

### 5.4 `01-04_本地開發環境準備_Node_pnpm_Vue版本.md`

這篇回答：

> 本地環境要怎麼準備？

重點包含：

```text
View UI Plus 本體源碼環境
官方範例專案環境
自建使用者測試專案環境
Node 版本策略
npm / pnpm 選擇
Vue / Vite / TypeScript 版本差異
VS Code 與 Git 設定
本地資料夾結構
```

完成這篇後，你應該知道：

```text
本體源碼第一輪建議用 Node 16.20.x + npm；
自建現代 Vite 測試專案可以用較新的 Node + pnpm。
```

---

### 5.5 `01-05_從零Clone與啟動ViewUIPlus源碼.md`

這篇回答：

> 如何從零 clone 並啟動 View UI Plus 本體源碼？

重點包含：

```text
建立學習資料夾
clone 官方倉庫
確認 branch / tag / commit
確認 package.json
切換 Node
安裝依賴
執行 npm run dev2
執行 npm run dev
執行 npm run build
建立 env / install / run / error log
```

完成這篇後，你應該至少能做到：

```text
clone 成功
記錄 commit hash
安裝依賴
嘗試 dev2 / dev / build
記錄啟動結果
```

---

### 5.6 `01-06_啟動失敗排查清單.md`

這篇回答：

> 如果 View UI Plus 跑不起來，要怎麼排查？

重點包含：

```text
install 階段排查
dev2 / Vite 階段排查
dev / Vue CLI 階段排查
build 階段排查
browser 白畫面排查
CSS 沒載入排查
Windows 路徑與權限問題
npm registry / proxy 問題
錯誤紀錄模板
```

完成這篇後，你應該知道：

```text
不要一遇到錯誤就升級依賴；
先判斷錯誤發生在哪一層，再逐層排查。
```

---

### 5.7 `01-07_使用者視角安裝ViewUIPlus.md`

這篇回答：

> 一般 Vue 3 專案如何使用 View UI Plus？

重點包含：

```text
建立乾淨 Vue 3 + TypeScript + Vite 專案
安裝 view-ui-plus
main.ts 引入 ViewUIPlus
引入 viewuiplus.css
app.use(ViewUIPlus)
測試 Button / Input / Space / Form / Message
檢查 node_modules 中的 dist / types
執行 dev / build / preview
```

完成這篇後，你應該知道：

```text
使用者如何從 npm package 使用 View UI Plus；
這條鏈路會反推後續的 package、dist、install、styles、types 分析。
```

---

### 5.8 `01-08_源碼讀碼視角與使用者視角的差異.md`

這篇回答：

> 會用 View UI Plus 和看懂 View UI Plus 源碼有什麼差別？

重點包含：

```text
使用者視角關心什麼
源碼視角關心什麼
npm install 對應 package.json
import ViewUIPlus 對應 main / dist
app.use 對應 install
Button 對應 props / style / type
Input 對應 v-model / 受控狀態
Form 對應父子通訊與驗證
Message 對應命令式 API
CSS 對應 style build
TypeScript 對應 typings
```

完成這篇後，你應該知道：

```text
使用者看到的是 API；
源碼讀碼要追的是 API 背後的工程設計。
```

---

### 5.9 `01-09_版本鎖定與讀碼基準紀錄.md`

這篇回答：

> 如何讓後續所有筆記都能回溯到同一個版本？

重點包含：

```text
版本號、tag、commit hash 的差異
Git 基準紀錄
package.json 基準紀錄
scripts 基準紀錄
Node / npm / pnpm 基準紀錄
install / dev / build 基準紀錄
dist / types 檢查
使用者 playground 基準紀錄
後續每篇筆記的讀碼基準區塊
```

完成這篇後，你應該知道：

```text
每一篇源碼分析筆記都要標註 version、commit hash、分析檔案與本地環境。
```

---

### 5.10 `01-10_本章學習檢核表.md`

這篇回答：

> 我是否真的完成本章，能不能進入下一章？

重點包含：

```text
本章筆記完成狀態
專案定位檢核
版本選擇檢核
官方資源檢核
本地環境檢核
clone 與啟動檢核
排查能力檢核
使用者視角檢核
源碼視角轉換檢核
讀碼基準檢核
最低通關標準
完整通關標準
```

完成這篇後，你應該能判斷：

```text
我是否可以正式進入 02_根目錄與工程設定。
```

---

## 6. 本章建議產出

完成本章後，建議你至少產出以下內容。

### 6.1 筆記產出

```text
README.md
01-01_ViewUIPlus專案定位與學習目標.md
01-02_版本選擇策略_讀源碼要選哪個版本.md
01-03_官方倉庫_npm_文檔站_資源入口整理.md
01-04_本地開發環境準備_Node_pnpm_Vue版本.md
01-05_從零Clone與啟動ViewUIPlus源碼.md
01-06_啟動失敗排查清單.md
01-07_使用者視角安裝ViewUIPlus.md
01-08_源碼讀碼視角與使用者視角的差異.md
01-09_版本鎖定與讀碼基準紀錄.md
01-10_本章學習檢核表.md
```

### 6.2 本地專案產出

```text
view-ui-plus-study/
├── source/
│   └── ViewUIPlus/
├── experiments/
│   └── view-ui-plus-user-playground/
├── examples/
├── notes/
└── logs/
```

### 6.3 紀錄檔產出

```text
logs/
├── env-record.md
├── git-record.md
├── package-record.md
├── install-log.md
├── run-log.md
├── build-log.md
├── error-log.md
└── playground-record.md
```

---

## 7. 本章最小通關標準

如果時間有限，至少要完成以下項目：

```text
1. 知道 View UI Plus 的專案定位
2. 知道讀碼候選版本
3. 已 clone 官方倉庫
4. 已記錄 commit hash
5. 已確認 package.json 的 name / version / main / typings
6. 已安裝依賴，或已記錄安裝失敗原因
7. 已嘗試 npm run dev2
8. 已嘗試 npm run dev
9. 已建立使用者視角測試專案
10. 已成功在測試專案中使用 Button 或 Input
11. 已知道使用者視角與源碼視角的差異
12. 已建立至少一份讀碼基準紀錄
```

如果以上項目沒有完成，不建議直接進入下一章。

---

## 8. 本章完整通關標準

完整完成本章後，你應該做到：

```text
1. 本章 10 篇筆記全部完成
2. View UI Plus 本體已 clone
3. branch / tag / commit hash 已記錄
4. Node / npm / pnpm 版本已記錄
5. npm install 成功
6. npm run dev2 成功
7. npm run dev 成功或失敗原因明確
8. npm run build 成功或已分段定位失敗
9. dist / types 已檢查
10. 使用者 playground 已建立
11. playground 已安裝 view-ui-plus
12. playground 已測試 Button、Input、Form、Message
13. playground 已執行 dev / build
14. logs 已建立
15. 後續每篇筆記的讀碼基準模板已建立
16. 使用者 API → 源碼問題對照表已建立
17. 已知道下一章要看根目錄結構
```

---

## 9. 本章建立的核心觀念

完成本章後，應該建立以下觀念。

### 9.1 版本觀念

```text
不要只說我讀的是 1.3.24。
要記錄 branch、tag、commit hash。
```

### 9.2 環境觀念

```text
View UI Plus 本體源碼環境、官方範例環境、自建 playground 環境要分開。
```

### 9.3 資料來源觀念

```text
GitHub 看 source
npm 看發布版本
官方文檔看使用方式
CDN 看發布檔案
Issues 看踩坑
PR 看演進
```

### 9.4 使用者視角觀念

```text
使用者關心怎麼裝、怎麼引入、怎麼用、樣式是否正常、打包是否成功。
```

### 9.5 源碼視角觀念

```text
源碼讀碼關心 package、main、install、components、styles、types、build、dist。
```

### 9.6 筆記基準觀念

```text
每篇後續源碼筆記都要有讀碼基準。
```

---

## 10. 常見錯誤提醒

### 10.1 不要直接讀 `src/components`

如果還沒完成版本與環境準備，不建議直接進入元件源碼。

原因：

```text
你會不知道自己讀的是哪個版本，也不知道使用者 API 如何對應 source。
```

---

### 10.2 不要把 GitHub master 當作固定版本

`master` 是流動的。

請記錄：

```bash
git rev-parse HEAD
```

---

### 10.3 不要一遇到錯誤就升級依賴

尤其不要先做：

```bash
npm audit fix --force
npm update
npm install vue@latest
npm install vite@latest
npm install typescript@latest
```

第一輪讀碼目標是還原專案，而不是重構工具鏈。

---

### 10.4 不要混用 npm 與 pnpm

View UI Plus 本體第一輪建議用 npm。  
你自己的 playground 可以用 pnpm。

不要在同一個專案中混用：

```text
package-lock.json
pnpm-lock.yaml
yarn.lock
```

---

### 10.5 不要只會用，不會反推源碼

如果你只知道：

```vue
<Button type="primary" />
```

還不夠。

你要能反推：

```text
Button source 在哪裡？
type prop 如何定義？
primary class 如何生成？
style 在哪裡？
types 如何宣告？
install 如何註冊？
```

---

## 11. 進入下一章前的自問清單

在開始 `02_根目錄與工程設定` 前，請確認你能回答：

```text
1. 我讀的是哪個 View UI Plus 版本？
2. 我本地 source 的 commit hash 是什麼？
3. 我目前使用的 Node / npm 是什麼版本？
4. 我是否已經成功 clone 官方倉庫？
5. 我是否知道 dev 和 dev2 的差異？
6. 我是否知道 build 會分成 build:prod、build:style、build:lang？
7. 我是否建立了使用者 playground？
8. 我是否知道 app.use(ViewUIPlus) 後面要追 install？
9. 我是否知道 CSS import 後面要追 styles / build:style？
10. 我是否知道 TypeScript 提示後面要追 typings / types？
```

如果答不出來，建議先回到本章補齊。

---

## 12. 下一章銜接

完成本章後，下一章是：

```text
02_根目錄與工程設定
```

下一章的重點會開始正式觀察 View UI Plus 根目錄，例如：

```text
ViewUIPlus/
├── package.json
├── src/
├── build/
├── dist/
├── types/
├── examples/
├── vite.config.js
├── vite.config.dev.js
├── babel.config.js
├── vue.config.js
└── 其他工程設定檔
```

你要帶著本章建立的問題意識去看：

```text
哪些是 source？
哪些是 build？
哪些是 dist？
哪些是 types？
哪些是 examples？
哪些是開發工具設定？
哪些會影響 npm 使用者？
哪些只影響元件庫維護者？
```

---

## 13. 本章不深入的內容

本章不深入分析：

```text
package.json 每個依賴
build script 每一步
Vite config 詳細內容
Vue CLI config 詳細內容
src/index 入口源碼
install 方法完整實作
元件註冊細節
Button 元件源碼
Form 驗證流程
Message 命令式 API
styles / Less 架構
types 型別宣告
```

這些都會放到後面的專門章節。

本章只負責：

```text
讀碼前準備
```

---

## 14. 推薦使用方式

建議你按照以下方式使用本章：

```text
第一輪：按順序讀完 01-01 到 01-10
第二輪：一邊操作一邊補 logs
第三輪：確認 01-10 檢核表是否達標
第四輪：把 01-09 的讀碼基準複製到後續章節模板
第五輪：進入 02_根目錄與工程設定
```

---

## 15. 本章一句話總結

> `01_專案啟動與版本選擇` 的任務不是讓你馬上看懂 View UI Plus 源碼，而是先把版本、環境、官方資源、啟動流程、使用者鏈路、源碼視角與讀碼基準全部準備好，讓後續每一篇源碼筆記都能穩定、可回溯、可維護。
