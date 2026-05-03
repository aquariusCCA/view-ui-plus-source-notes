# 00-02_ViewUIPlus專案定位與技術棧總覽

> 筆記定位：本篇是閱讀 View UI Plus 原始碼前的「專案定位圖」與「技術棧地圖」。  
> 目標不是背套件清單，而是先建立判斷框架：這個專案是什麼、它解決什麼問題、它用了哪些技術、哪些地方值得我學、哪些地方不應該盲目照抄。

---

## 0. 本篇筆記的作用

在開始閱讀 View UI Plus 前，最容易犯的錯誤是：

1. 直接打開 `src/components`，從某個元件開始亂讀。
2. 只看自己熟悉的 Vue 寫法，忽略整個元件庫的工程結構。
3. 把「會用元件」誤認為「懂元件庫設計」。
4. 把所有原始碼都當成最佳實踐，沒有區分歷史包袱、版本背景與設計取捨。

所以這篇筆記要先回答五個問題：

```txt
1. View UI Plus 是什麼類型的專案？
2. 它主要服務什麼場景？
3. 它的技術棧大致分成哪些層？
4. 對我學習前端元件庫設計有什麼價值？
5. 哪些部分應該深入學，哪些部分只需要了解即可？
```

---

## 1. 一句話定位

View UI Plus 是一套基於 Vue 3 的企業級 UI 元件庫與前端解決方案，主要用來支援中後台、管理系統、資料表單、資料展示、彈層回饋、導航布局等典型企業前端場景。

如果用我自己的學習語言來描述：

```txt
View UI Plus = Vue 3 元件庫工程 + 企業後台常用元件集合 + 全域安裝機制 + 樣式系統 + 型別宣告 + Demo / 測試 / 打包產物。
```

它不是單純的「幾個 Vue 元件範例」，而是一個可被 npm 安裝、可全域註冊、可打包發布、可在企業專案中被引用的完整元件庫專案。

---

## 2. 專案定位拆解

### 2.1 它首先是一套 UI Component Library

View UI Plus 的核心價值是提供可重複使用的 UI 元件，例如：

```txt
Button / Icon / Input / Select / Form / Table / Modal / Message / Notice / DatePicker / Menu / Tabs / Tooltip ...
```

這些元件不是為單一頁面服務，而是要被不同業務系統反覆引用。因此它關注的重點不是「某個畫面怎麼寫」，而是：

```txt
1. API 如何穩定
2. Props 如何設計
3. Emits 如何定義
4. Slots 如何暴露擴展點
5. 樣式如何統一
6. 狀態如何維護
7. 元件之間如何協作
8. 如何被安裝、匯出與打包
```

這也是我閱讀它的主要目的：學會如何設計「可重複使用、可維護、可擴展」的前端元件。

---

### 2.2 它服務的是企業級中後台場景

View UI Plus 官方定位偏向 enterprise-level component library / front-end solution。這表示它的重點不是炫技動畫，也不是高度客製化的 C 端互動，而是企業系統中大量重複出現的 UI 問題。

典型場景包括：

```txt
1. 表單輸入
2. 表單驗證
3. 查詢條件區
4. 表格資料展示
5. 分頁
6. 彈窗表單
7. 確認提示
8. 錯誤回饋
9. 導航選單
10. 權限後台布局
11. 日期時間選擇
12. 下拉選擇
13. 批次操作
14. Loading / Spin / Skeleton 類回饋
```

所以我讀 View UI Plus 時，應該一直把它跟自己的企業後台能力連起來：

```txt
我不是只學 View UI Plus 怎麼寫 Button，
而是學企業後台元件庫如何設計 Button、Input、Form、Table、Modal、Message 這些基礎能力。
```

---

### 2.3 它同時是一個工程化專案

View UI Plus 不只有 `src/components`。它還包含：

```txt
1. package.json
2. build 腳本
3. dist 打包產物
4. examples 範例
5. test 測試
6. types 型別宣告
7. styles 樣式系統
8. locale 國際化
9. directives 自訂指令
10. utils 工具函式
```

因此，讀這個專案不能只讀元件本身，還要觀察一套元件庫從開發到發布的完整鏈路：

```txt
原始碼 → 元件匯出 → 插件安裝 → 樣式建置 → 型別宣告 → dist 產物 → 使用者安裝 → 專案引用
```

---

## 3. 與我目前學習目標的關係

我目前想先專精前端，並透過開源專案補強 HTML、CSS、JavaScript、TypeScript、Vite、Vue 的實戰能力。View UI Plus 對我的價值主要有以下幾個層次。

### 3.1 補強 Vue 元件設計能力

它可以幫我觀察：

```txt
1. 元件如何命名
2. Props 如何分類
3. Emits 如何設計
4. Slots 如何保留彈性
5. v-model 如何支援
6. 內部狀態如何控制
7. 元件如何與父層協作
8. 元件如何暴露命令式 API
9. 複合元件如何拆分
10. 全域配置如何影響單一元件
```

這些都是一般業務開發很容易用到，但不一定會系統性思考的能力。

---

### 3.2 補強企業後台封裝能力

View UI Plus 的元件類型非常接近企業後台開發會遇到的需求。讀完後，應該能回頭強化自己的封裝能力，例如：

```txt
1. SearchForm 查詢表單
2. CrudTable 增刪改查表格
3. DialogForm 彈窗表單
4. DictSelect 字典下拉選擇
5. PermissionButton 權限按鈕
6. UploadField 檔案上傳欄位
7. DateRangePicker 日期區間封裝
8. StatusTag 狀態標籤
9. ConfirmAction 二次確認操作
10. LayoutShell 後台布局骨架
```

這些才是我把 View UI Plus 讀碼成果轉化為工作能力的重點。

---

### 3.3 補強元件庫工程化視角

一般業務專案通常只需要「使用元件」。但元件庫專案必須解決更多問題：

```txt
1. 如何批量註冊元件？
2. 如何支援 app.use()？
3. 如何產生 dist？
4. 如何維護樣式入口？
5. 如何維護型別宣告？
6. 如何提供 examples？
7. 如何用 tests 反推元件規格？
8. 如何讓使用者按需引入或全量引入？
9. 如何設計全域配置？
10. 如何讓命令式 API 也能融入 Vue 應用？
```

這些問題會直接對應我後面要學的：

```txt
07_元件註冊機制
08_全域配置與globalProperties
09_元件庫整體設計模式
23_src-styles_樣式系統
24_types_型別宣告
28_高階專題_元件API設計
31_高階專題_命令式API設計
38_企業後台元件封裝實戰
```

---

## 4. 技術棧總覽

以下不是逐一背套件，而是從「元件庫工程」角度理解它的技術組成。

---

## 4.1 核心框架層

### Vue 3

View UI Plus 是基於 Vue 3 的 UI 元件庫。這代表我閱讀時要特別關注：

```txt
1. Vue 3 元件定義方式
2. props / emits / slots
3. v-model 設計
4. app.use(plugin)
5. globalProperties
6. provide / inject
7. Teleport 或動態掛載思路
8. Composition API 與 Options API 的混用情況
9. Vue 3 與 Vue 2 元件庫設計差異
```

注意：不要預設整個專案都是現代 Composition API + TypeScript 寫法。很多 Vue 3 元件庫在遷移過程中可能保留 Vue 2 時代的設計習慣，例如 mixin、Options API、JavaScript 寫法、獨立 types 目錄等。讀碼時要先觀察實際檔案，而不是用刻板印象判斷。

---

## 4.2 工程建置層

從套件資訊與 repo 結構來看，View UI Plus 同時出現 Vue CLI、Vite、Gulp 等建置相關工具。

可以先把它理解成三種建置任務：

```txt
1. 開發預覽：啟動 examples / dev server
2. 元件庫打包：產生 dist 中的 JS bundle
3. 樣式建置：處理 Less、CSS、壓縮、重命名
```

### 值得觀察的點

```txt
1. package.json 的 scripts 如何串接 build 流程
2. vite.config.js 負責哪些打包工作
3. build 目錄如何處理 style 與 lang
4. dist 產物與 src 原始碼的關係
5. 為什麼元件庫需要單獨建置 CSS
6. 為什麼 types 會被列入發佈檔案
```

這部分會放到後面的章節深入：

```txt
03_package與依賴分析
04_build_打包腳本與建置流程
05_dist_打包產物分析
```

---

## 4.3 樣式系統層

View UI Plus 使用 Less 相關工具處理樣式。對我來說，這一層不是只看 CSS 怎麼寫，而是要學元件庫如何維持樣式一致性。

我應該關注：

```txt
1. class 命名規則
2. prefixCls 機制
3. Less 變數
4. 元件樣式如何分檔
5. 通用樣式如何抽取
6. 狀態 class 如何設計
7. 尺寸、顏色、禁用、錯誤、active、hover 如何統一
8. 樣式如何被打包到 dist/styles
```

樣式層對我很重要，因為企業後台元件封裝常常不是邏輯難，而是樣式一致性、狀態樣式、可維護 class 命名很難。

---

## 4.4 表單驗證層

View UI Plus 依賴 `async-validator`。這代表表單驗證系統不是簡單地在 input 上寫 if-else，而是有一套 schema rule 驅動的驗證流程。

讀 Form / FormItem 時要特別注意：

```txt
1. Form 如何收集 FormItem
2. FormItem 如何知道自己對應哪個 prop
3. rules 如何傳入
4. validate 何時觸發
5. blur / change 事件如何觸發驗證
6. 錯誤訊息如何保存
7. validate / resetFields / clearValidate 如何暴露
8. async-validator 的錯誤如何轉換成 UI 狀態
```

這會直接對應：

```txt
13_表單與輸入元件
14_表單驗證系統專題
32_高階專題_表單架構設計
38_企業後台元件封裝實戰
```

---

## 4.5 彈層與定位層

View UI Plus 依賴 `popper.js`，這通常與 Tooltip、Popover、Dropdown、Select、DatePicker 等浮層定位有關。

這一層要關注的不是「彈層長什麼樣」，而是：

```txt
1. 浮層如何定位到觸發元素
2. scroll / resize 後位置如何更新
3. 點擊外部如何關閉
4. z-index 如何管理
5. focus / blur 如何影響開關
6. keyboard 操作如何處理
7. 下拉元件與彈層元件如何復用定位能力
```

這會對應：

```txt
17_回饋_彈層_命令式元件
30_高階專題_彈層與定位系統
31_高階專題_命令式API設計
```

---

## 4.6 日期、數字與格式化層

View UI Plus 依賴 `dayjs`、`js-calendar`、`numeral`、`countup.js` 等工具。這代表它不是只有基礎按鈕輸入，也包含日期選擇、數字展示、統計數值動畫等資料展示能力。

需要關注：

```txt
1. DatePicker 如何處理日期格式
2. Calendar 類元件如何生成日期面板
3. 數字顯示元件如何格式化
4. CountUp 類效果如何封裝
5. 格式化邏輯應該放在元件內，還是抽到 utils
```

這對企業後台很實用，因為後台系統經常需要：

```txt
1. 日期區間查詢
2. 金額格式化
3. 百分比展示
4. 數值統計卡片
5. 年月日選擇
6. 報表欄位格式化
```

---

## 4.7 DOM 行為與瀏覽器互動層

View UI Plus 依賴一些與 DOM 行為相關的工具，例如：

```txt
1. v-click-outside-x
2. element-resize-detector
3. select
4. lodash.throttle
```

這些依賴通常用在：

```txt
1. 點擊外部關閉彈層
2. 偵測元素尺寸變化
3. 選取文字或複製類功能
4. resize / scroll / mousemove 等高頻事件節流
```

這對我學前端「互動內功」很重要，因為很多元件表面上只是 UI，實際上是在處理瀏覽器事件、DOM 尺寸、焦點狀態與使用者操作。

---

## 4.8 工具函式層

View UI Plus 使用了一些通用工具依賴，例如：

```txt
1. deepmerge
2. lodash.chunk
3. lodash.throttle
4. tinycolor2
```

這些工具對應的是元件庫常見底層問題：

```txt
1. 全域配置與局部配置如何合併
2. 陣列資料如何切分
3. 高頻事件如何節流
4. 主題色、顏色變體如何計算
```

讀 `src/utils` 時，應該特別觀察：

```txt
1. 哪些工具函式是真正高頻復用的
2. 哪些是為特定元件服務的
3. 哪些可以抽成自己的企業後台工具庫
4. 哪些不適合直接照抄
```

---

## 4.9 型別宣告層

View UI Plus 的 package metadata 中有 `typings: types/index.d.ts`，並且發佈檔案包含 `types` 目錄。這代表它提供 TypeScript 型別宣告。

我閱讀時要注意：

```txt
1. types/index.d.ts 對外暴露了哪些型別
2. 元件 props 是否有對應型別
3. 命令式 API 是否有型別
4. 全域安裝後的型別如何支援
5. 型別宣告與 src 原始碼是否同步
6. 如果我要封裝企業元件，哪些 API 應該補型別
```

但也要注意：有 `types` 不代表整個原始碼都是 TypeScript 編寫。這點要在讀碼時分開判斷。

---

## 4.10 測試層

從套件資訊可以看到測試相關工具，例如 Karma、Mocha、Chai、Sinon 等。這代表它有傳統前端元件庫測試體系的影子。

我不一定要一開始深入測試配置，但後期應該用測試來反推元件規格：

```txt
1. 元件應該支援哪些 props
2. 元件應該觸發哪些事件
3. 哪些邊界情況需要測試
4. 哪些行為是作者認為穩定的對外契約
5. 測試如何幫助我理解元件設計意圖
```

這會對應：

```txt
26_test_測試
35_高階專題_測試反推元件規格
```

---

## 5. 技術棧分層總表

| 層級 | 代表內容 | 我應該學什麼 |
|---|---|---|
| 核心框架層 | Vue 3 | 元件定義、props、emits、slots、v-model、插件安裝 |
| 工程建置層 | Vite、Vue CLI、Gulp | 元件庫如何開發、打包、產出 dist |
| 樣式系統層 | Less、CSS bundle、prefixCls | 元件樣式如何統一、主題如何組織 |
| 表單驗證層 | async-validator | Form / FormItem 驗證架構 |
| 彈層定位層 | popper.js、click outside | Tooltip、Dropdown、Modal、Select 類元件機制 |
| 日期數字層 | dayjs、js-calendar、numeral、countup.js | 日期選擇、數字格式化、資料展示 |
| DOM 互動層 | resize detector、throttle、select | 滑鼠、焦點、尺寸、事件節流 |
| 工具函式層 | deepmerge、lodash、tinycolor2 | 配置合併、陣列處理、顏色計算 |
| 型別宣告層 | types/index.d.ts、TypeScript | 元件 API 型別設計 |
| 測試層 | Karma、Mocha、Chai、Sinon | 用測試反推元件規格 |

---

## 6. Repo 目錄視角

View UI Plus 官方 repo 根目錄可以先粗略理解成以下幾類。

```txt
ViewUIPlus
├── assets       # 靜態資源或文件相關資源
├── build        # 建置腳本，尤其可能與樣式、語言包、打包流程有關
├── dist         # 打包後的發佈產物
├── examples     # 範例、Demo、開發預覽
├── src          # 核心原始碼
├── test         # 測試
├── types        # TypeScript 型別宣告
├── package.json # 套件資訊、依賴、scripts、發佈設定
├── vite.config.js
├── vite.config.dev.js
├── vue.config.js
└── tsconfig.json
```

注意：這裡只是總覽，不在本篇深入每個目錄。後面的筆記會分章分析。

---

## 7. package.json 給我的線索

package.json 是讀元件庫很重要的入口，因為它會揭露這個專案對外發布與內部建置的方式。

目前可以先抓幾個重點：

```txt
name: view-ui-plus
main: dist/viewuiplus.min.js
typings: types/index.d.ts
files: dist / src / types
scripts:
  dev
  dev2
  build
  build:style
  build:prod
  build:lang
  lint
```

這些資訊代表：

```txt
1. 使用者安裝的是 npm package
2. 主要入口指向 dist 中的壓縮 JS
3. 型別入口指向 types/index.d.ts
4. 發佈內容包含 dist、src、types
5. build 流程至少包含 JS 打包、樣式建置、語言包建置
6. 開發模式可能同時保留 Vue CLI 與 Vite 兩套路徑
```

這些都是後續讀 `03_package與依賴分析`、`04_build_打包腳本與建置流程` 時的入口。

---

## 8. 我應該優先讀哪些技術主線？

View UI Plus 內容很多，不應該平均用力。對我目前「專精前端 + 企業後台能力」的目標來說，優先順序如下。

---

### 第一優先：元件 API 設計

必讀內容：

```txt
1. Button
2. Input
3. Select
4. Form
5. FormItem
6. Modal
7. Message
8. Table
```

要學會：

```txt
1. props 如何設計
2. emits 如何設計
3. slots 如何設計
4. v-model 如何支援
5. 元件狀態如何管理
6. 使用者 API 與內部實作如何分離
```

---

### 第二優先：表單與資料元件

必讀內容：

```txt
1. Form
2. FormItem
3. Input
4. Select
5. DatePicker
6. Table
7. Page
8. Upload
```

要學會：

```txt
1. 企業表單如何架構化
2. 驗證規則如何設計
3. 表格欄位如何描述
4. 查詢 / 新增 / 編輯場景如何封裝
5. 資料展示與資料操作如何分離
```

---

### 第三優先：彈層與命令式 API

必讀內容：

```txt
1. Modal
2. Message
3. Notice
4. Tooltip
5. Popover
6. Dropdown
7. Drawer
```

要學會：

```txt
1. 命令式 API 如何建立
2. 彈層如何掛載與銷毀
3. z-index 如何處理
4. click outside 如何處理
5. 定位系統如何復用
6. 元件式用法與函式式用法如何共存
```

---

### 第四優先：工程與樣式系統

必讀內容：

```txt
1. src 入口
2. 元件註冊
3. global config
4. styles
5. build scripts
6. types
```

要學會：

```txt
1. 元件庫如何安裝
2. 元件如何匯出
3. 全域配置如何注入
4. prefixCls 如何影響樣式
5. Less 如何組織
6. 型別宣告如何對外提供
```

---

## 9. 與其他學習專案的分工

我目前規劃的專案包含：

```txt
1. FormKit
2. PPTist
3. View UI Plus
```

它們的學習價值不同。

| 專案 | 核心學習價值 | 不應該期待它教我的事 |
|---|---|---|
| View UI Plus | 企業後台元件庫設計、API 設計、樣式系統、表單、彈層、表格 | 高互動大型應用狀態建模 |
| FormKit | 表單 schema、表單驗證、表單架構設計 | 完整企業 UI 元件庫工程 |
| PPTist | 高互動應用、畫布操作、快捷鍵、拖拉縮放、複雜狀態 | 通用企業元件 API 設計 |

所以 View UI Plus 應該承擔的是：

```txt
學習「企業前端元件庫」與「後台元件封裝」能力。
```

不是用它來學所有前端能力。

---

## 10. 哪些地方值得深挖？

### 10.1 值得深挖

```txt
1. app.use() 安裝流程
2. 元件批量註冊
3. Button / Input / Select / Form / Table / Modal / Message
4. Form / FormItem 協作
5. async-validator 整合
6. Modal / Message 命令式 API
7. Tooltip / Dropdown / Popover 定位機制
8. prefixCls 與樣式系統
9. types/index.d.ts 對外型別設計
10. examples 如何展示元件規格
11. test 如何反推元件行為
```

---

### 10.2 只需要了解，不必一開始深挖

```txt
1. 每個元件的所有邊角 props
2. 每個樣式細節
3. 每個依賴套件的內部實作
4. 所有 build 工具的歷史原因
5. 每個測試工具的配置細節
6. 所有 locale 語言包內容
7. 已經過時或不適合現代專案的工程配置
```

---

## 11. 容易誤解的地方

### 誤解 1：View UI Plus 是 Vue 3，所以全部都是最新 Vue 3 寫法

不一定。Vue 3 專案不代表整個原始碼都使用最新 Composition API、最新 Vite、最新 TypeScript 寫法。開源專案會受到歷史版本、遷移成本、維護成本影響。

正確態度：

```txt
先觀察原始碼實際寫法，再判斷哪些值得學，哪些是歷史包袱。
```

---

### 誤解 2：有 types 目錄，所以它就是 TypeScript 專案

不一定。`types/index.d.ts` 代表它提供型別宣告，但不代表所有原始碼都由 TypeScript 編寫。

正確態度：

```txt
把「原始碼實作語言」和「對外型別宣告」分開看。
```

---

### 誤解 3：元件庫原始碼都值得照抄

不一定。開源元件庫的寫法要服務大量使用者、兼容多種情境，可能比企業內部封裝更複雜。

正確態度：

```txt
讀設計思想，不盲目複製複雜度。
```

---

### 誤解 4：讀完 View UI Plus 就等於會做企業後台

不夠。View UI Plus 提供的是底層 UI 元件能力。真正的企業後台還需要：

```txt
1. 權限設計
2. 路由設計
3. API 串接
4. 表格查詢封裝
5. 業務狀態管理
6. 錯誤處理
7. 欄位權限
8. 操作流程設計
9. 後端資料模型理解
```

所以 View UI Plus 是企業後台能力的一部分，不是全部。

---

## 12. 我自己的學習判斷標準

讀 View UI Plus 時，我應該用以下標準判斷一段程式碼值不值得深入。

### 12.1 如果它能提升元件設計能力，要深入

例如：

```txt
1. props 設計
2. emits 設計
3. slots 設計
4. v-model 設計
5. 受控 / 非受控狀態
6. 父子元件協作
7. 命令式 API
```

---

### 12.2 如果它能提升企業封裝能力，要深入

例如：

```txt
1. Form 驗證
2. Table 欄位設計
3. Modal 表單
4. Select 選項處理
5. DatePicker 日期處理
6. Message / Notice 回饋
```

---

### 12.3 如果它只是歷史工程配置，先了解即可

例如：

```txt
1. 舊版 Vue CLI 配置細節
2. 舊版測試工具配置
3. 特定打包工具的歷史原因
4. 不再常見的依賴版本細節
```

---

## 13. 推薦閱讀順序

本篇讀完後，建議按照以下順序進入後續章節。

```txt
第一步：確認版本與啟動
01_專案啟動與版本選擇
02_根目錄與工程設定
03_package與依賴分析

第二步：理解工程鏈路
04_build_打包腳本與建置流程
05_dist_打包產物分析

第三步：理解元件庫入口
06_src_入口與插件機制
07_元件註冊機制
08_全域配置與globalProperties
09_元件庫整體設計模式

第四步：開始讀核心元件
11_基礎通用元件
13_表單與輸入元件
14_表單驗證系統專題
15_資料展示與資料操作元件
17_回饋_彈層_命令式元件

第五步：整理高階專題與仿寫
28_高階專題_元件API設計
29_高階專題_受控與非受控狀態
30_高階專題_彈層與定位系統
31_高階專題_命令式API設計
36_仿寫與重構
37_迷你元件庫實作
38_企業後台元件封裝實戰
```

---

## 14. 本篇重點總結

如果只保留這篇筆記的核心結論，可以濃縮成以下內容：

```txt
1. View UI Plus 是基於 Vue 3 的企業級 UI 元件庫與前端解決方案。
2. 它最適合用來學習企業後台元件設計，而不是學所有前端技術。
3. 它的學習價值不只在 components，還包含 install、build、styles、types、examples、test。
4. 技術棧可以分為 Vue 核心、工程建置、樣式系統、表單驗證、彈層定位、工具函式、型別宣告、測試幾層。
5. 最值得深挖的是 Button、Input、Select、Form、FormItem、Table、Modal、Message。
6. 讀碼時要區分「值得學的設計思想」與「不一定適合照抄的歷史工程細節」。
7. 我的最終目標不是會用 View UI Plus，而是能把它的設計思想轉化成自己的企業後台元件封裝能力。
```

---

## 15. 本篇檢核表

讀完本篇後，我應該能回答：

```txt
- [ ] View UI Plus 是什麼類型的專案？
- [ ] 它為什麼適合拿來學企業後台元件庫？
- [ ] 它和 FormKit、PPTist 的學習價值有什麼不同？
- [ ] 它的主要技術棧可以分成哪些層？
- [ ] package.json 可以提供哪些讀碼線索？
- [ ] 為什麼不能只從 src/components 開始亂讀？
- [ ] 哪些元件最值得優先閱讀？
- [ ] 哪些工程配置只需要先了解？
- [ ] 我讀這個專案最後要轉化成哪些企業後台能力？
```

---

## 16. 後續待補問題

後續讀碼時，如果發現以下問題，需要回來補充本篇：

```txt
1. 實際 src 入口檔案是哪個？
2. app.use(ViewUIPlus) 的完整流程是什麼？
3. 元件是否全部透過 install 方法註冊？
4. 是否存在全域 config provider？
5. prefixCls 實際在哪裡產生？
6. Form / FormItem 是否透過 provide / inject 或 mixin 協作？
7. Modal / Message 是否使用動態掛載？
8. types/index.d.ts 是否完整描述所有元件 API？
9. dist 產物有哪些格式？
10. examples 是否足以反推完整元件規格？
```

---

## 17. 資料來源與查核基準

查核日期：2026-05-03

主要參考來源：

```txt
1. View UI Plus GitHub Repository
   https://github.com/view-design/ViewUIPlus

2. View UI Plus package on UNPKG
   https://unpkg.com/view-ui-plus/

3. View UI Plus package.json on UNPKG
   https://app.unpkg.com/view-ui-plus@1.3.24/files/package.json

4. View Design / View UI Plus 官方網站
   https://www.iviewui.com/view-ui-plus/
```

注意：GitHub Release、npm / UNPKG 套件版本與 repo README 有可能不同步。實際學習時，應以自己 clone 或安裝的版本為準，並在 `01_專案啟動與版本選擇` 中固定版本。
