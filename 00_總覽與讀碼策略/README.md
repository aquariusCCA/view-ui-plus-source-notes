# README

> 本 README 是 `00_總覽與讀碼策略` 的入口頁。  
> 它不是單純說明「這個資料夾有哪些檔案」，而是要告訴你：**這套 View UI Plus 源碼筆記系統怎麼用、先讀哪裡、怎麼產出筆記、怎麼回查問題、怎麼避免筆記變成空殼。**

---

## 0. 一句話定位

`00_總覽與讀碼策略` 是整套 **View UI Plus 源碼筆記系統的導航層**。

它負責解決四個問題：

```txt
1. View UI Plus 是什麼類型的專案？
2. 原始碼應該從哪裡開始讀？
3. 每一篇筆記應該產出到什麼程度才算合格？
4. 之後遇到問題時，要怎麼用 AI 與索引快速回查？
```

這一層不是用來深入分析 Button、Form、Table 的細節，而是用來建立讀碼地圖。  
真正的逐檔深讀應該放到後續專題筆記中，例如：

```txt
03_src_入口與插件機制/
04_src-components_元件總覽/
05_components_基礎通用元件/Button/
06_components_表單與輸入元件/Form/
07_components_資料展示元件/Table/
08_styles_樣式系統/
09_types_型別契約/
```

---

## 1. 這套筆記系統的核心目標

學 View UI Plus 原始碼，不是為了背它有幾個元件，也不是為了把每一行程式碼翻譯成中文。

真正目標是看懂一套企業級 Vue 3 元件庫如何完成以下事情：

| 能力 | 要看懂的源碼主線 | 學到的工程能力 |
|---|---|---|
| 套件定位 | `README.md`、`package.json` | 判斷一個 repo 是業務系統、元件庫、工具庫還是工程模板 |
| 插件安裝 | `src/index.js` | Vue Plugin 如何註冊元件、指令、全域設定與全域 API |
| 元件出口 | `src/components/index.js` | public component surface 如何集中管理 |
| 單一元件設計 | `src/components/*` | Props、Emits、Slots、computed、render、class 組裝、狀態與互動 |
| 共用抽象 | `src/mixins`、`src/utils`、`src/directives` | 跨元件邏輯如何複用與隔離 |
| 樣式系統 | `src/styles` | Less 變數、mixin、元件樣式與主題入口如何組織 |
| 國際化 | `src/locale` | 語系包、locale 設定與元件文案如何串接 |
| 型別契約 | `types` | TypeScript 使用者側 API 如何描述 |
| 使用驗證 | `examples` | 從 demo 反推元件 API 與真實使用情境 |
| 工程交付 | `vite.config.js`、`build`、`dist` | library build、樣式建置、語系建置、發版產物如何形成 |

一句話：

> **這套筆記不是只學 View UI Plus，而是借 View UI Plus 練習讀懂一個成熟前端基礎設施專案。**

---

## 2. 本資料夾文件地圖

目前 `00_總覽與讀碼策略` 應包含下列文件：

```txt
00_總覽與讀碼策略/
├─ README.md
├─ 00_完整目錄樹.md
├─ 01_ViewUIPlus_專案定位.md
├─ 02_源碼總目錄地圖.md
├─ 03_建議閱讀順序.md
├─ 04_元件庫核心問題清單.md
├─ 05_如何用_AI_輔助讀源碼.md
├─ 06_AI_提問模板.md
├─ 07_源碼覆蓋對照表.md
└─ 99_問題回查索引.md
```

各文件分工如下：

| 文件 | 角色 | 你什麼時候看它 | 合格標準 |
|---|---|---|---|
| `README.md` | 整套總覽入口 | 第一次打開資料夾、不知道從哪裡開始時 | 能在 5 分鐘內知道整套筆記怎麼用 |
| `00_完整目錄樹.md` | 筆記系統架構 | 想建立後續深讀筆記、專題筆記、元件筆記時 | 能知道每類筆記應該放哪裡 |
| `01_ViewUIPlus_專案定位.md` | 專案類型判斷 | 開始讀碼前，先判斷它不是業務系統 | 能說清楚 View UI Plus 是 Vue 3 元件庫與前端基礎設施 |
| `02_源碼總目錄地圖.md` | repo 目錄導航 | 想知道 `src`、`examples`、`types`、`build` 各負責什麼 | 能把真實目錄轉成讀碼地圖 |
| `03_建議閱讀順序.md` | 執行路線 | 不知道要先讀 Button、Table 還是 `src/index.js` 時 | 能照著分階段讀，不亂跳重型元件 |
| `04_元件庫核心問題清單.md` | 問題框架 | 讀源碼時不知道該問什麼 | 每個問題都能對應源碼位置與筆記產出 |
| `05_如何用_AI_輔助讀源碼.md` | AI 讀碼 SOP | 想用 AI 解釋源碼，但怕 AI 亂講時 | 能用「源碼事實 / 合理推論 / 待驗證」控管品質 |
| `06_AI_提問模板.md` | prompt 模板庫 | 要把某段源碼丟給 AI 分析時 | 能直接複製模板，要求 AI 回扣真實源碼 |
| `07_源碼覆蓋對照表.md` | 覆蓋追蹤儀表板 | 想知道目前讀過哪些檔案、讀多深時 | 能追蹤 S0～S5 狀態與 0～5 分深度 |
| `99_問題回查索引.md` | 問題資料庫 | 之後遇到類似問題，要快速回查答案時 | 能用問題 ID、分類、源碼位置、狀態找回答案 |

---

## 3. 第一次使用時的建議順序

第一次打開這套筆記，不建議從 `99_問題回查索引.md` 或 `07_源碼覆蓋對照表.md` 開始。

建議順序是：

```txt
README.md
  ↓
01_ViewUIPlus_專案定位.md
  ↓
02_源碼總目錄地圖.md
  ↓
03_建議閱讀順序.md
  ↓
04_元件庫核心問題清單.md
  ↓
05_如何用_AI_輔助讀源碼.md
  ↓
06_AI_提問模板.md
  ↓
07_源碼覆蓋對照表.md
  ↓
99_問題回查索引.md
```

如果時間很少，只讀三篇：

```txt
01_ViewUIPlus_專案定位.md
03_建議閱讀順序.md
06_AI_提問模板.md
```

如果你已經開始讀源碼，只需要維護狀態，優先看：

```txt
07_源碼覆蓋對照表.md
99_問題回查索引.md
```

如果你準備讓 AI 幫你分析某個檔案，優先看：

```txt
05_如何用_AI_輔助讀源碼.md
06_AI_提問模板.md
04_元件庫核心問題清單.md
```

---

## 4. View UI Plus 源碼閱讀主線

View UI Plus 不是一般頁面型 Vue 專案，所以不要用「找 router → 找 page → 找 API → 找 store」這種業務系統讀法。

這類元件庫的主線應該是：

```txt
package.json
  ↓
vite.config.js / vite.config.dev.js
  ↓
src/index.js
  ↓
src/components/index.js
  ↓
examples/main.js
  ↓
src/components/button/
  ↓
src/mixins / src/utils / src/directives / src/styles
  ↓
Form / Input / Select / Modal / Message
  ↓
Table / DatePicker / Tree / Upload
  ↓
types / test / build / dist
```

### 4.1 為什麼先讀 `package.json`

因為它回答：

```txt
這個專案如何被安裝？
對外入口在哪裡？
型別入口在哪裡？
哪些檔案會被發布？
有哪些建置命令？
```

如果你不先看 `package.json`，就容易把 View UI Plus 當成一般 Vue App，而不是 npm library。

---

### 4.2 為什麼先讀 `src/index.js`

因為它是元件庫真正的 Vue Plugin 入口。

你要在這裡看懂：

```txt
export * from './components'
import * as components from './components'
install(app, opts)
app.component(...)
app.directive(...)
app.config.globalProperties.$VIEWUI
app.config.globalProperties.$Message / $Modal / $Notice / $Spin / $Loading
```

如果你不讀 `src/index.js`，你只會看到一堆單一元件，卻不知道它們如何變成 `app.use(ViewUIPlus)` 可以安裝的整套庫。

---

### 4.3 為什麼讀 `src/components/index.js`

因為它是元件庫的 public component surface。

你要在這裡回答：

```txt
哪些元件是對外 export？
元件命名是否和資料夾一致？
哪些元件是成對出現，例如 Form / FormItem、Menu / MenuItem？
哪些是命令式元件，例如 Message、Modal、Notice、LoadingBar？
哪些是重型元件，例如 Table、DatePicker、Tree、Upload？
```

---

### 4.4 為什麼第一個元件建議讀 Button

Button 適合作為第一個深讀元件，因為它通常具備完整但不過度複雜的元件結構：

```txt
props
computed classes
mixin
icon
loading
disabled
click event
button / a 動態渲染
render function
樣式 class 命名
```

讀完 Button，你可以建立一套之後讀 Input、Tag、Alert、FormItem 的分析模板。

---

### 4.5 為什麼不要一開始讀 Table

Table 這類元件通常同時牽涉：

```txt
資料結構
欄位配置
排序
篩選
展開行
固定欄
slot
render function
父子元件協作
滾動與尺寸計算
複雜狀態同步
```

如果一開始讀 Table，很容易卡在細節，看不到整套元件庫的架構主線。

建議等你已經讀過：

```txt
src/index.js
src/components/index.js
Button
Input
Form / FormItem
Select / Option
Modal / Message
mixins / utils / styles
```

再進入 Table。

---

## 5. 讀碼優先級

整套筆記使用 P0～P3 標記閱讀優先級。

| 優先級 | 意義 | 代表源碼 / 筆記 |
|---|---|---|
| P0 | 第一輪必讀，不讀會看不懂整套架構 | `src/index.js`、`src/components/index.js`、Button、`01`、`02`、`03` |
| P1 | 第二輪重要，會影響元件深讀品質 | `mixins`、`utils`、`styles`、`examples`、Form、Input、Select、Modal、Message |
| P2 | 第三輪擴展，適合建立進階能力 | Table、DatePicker、Tree、Upload、types、test、build |
| P3 | 暫時不作為源碼學習入口 | `dist`、靜態資源、CI 設定、歷史相容細節 |

判斷原則：

```txt
先讀會影響整體理解的檔案。
再讀能建立元件模式感的檔案。
最後讀大型、工程配套、發版與邊界案例。
```

---

## 6. 每一篇源碼筆記的最低標準

正式源碼筆記不能只有「這個元件是按鈕」、「這裡使用 props」、「這裡做 class 判斷」這種描述。

每一篇至少要包含：

```md
# 檔案 / 元件名稱

## 1. 原始碼位置
- src/components/button/button.vue
- src/components/button/index.js
- src/styles/components/button.less

## 2. 這個檔案負責什麼
用 3～5 句話說明它在 View UI Plus 中的角色。

## 3. 對外 API
整理 props、emits、slots、methods、全域 API 或 export。

## 4. 內部結構
整理 data、computed、methods、watch、render、composition function、mixin。

## 5. 核心流程
用條列或流程圖說明事件如何觸發、狀態如何變化、畫面如何渲染。

## 6. 依賴關係
說明它 import 了哪些元件、工具函式、mixin、directive、locale、style。

## 7. 和整套元件庫的關係
說明它如何被 components/index.js 匯出，如何被 src/index.js 安裝或暴露。

## 8. 可學走的設計
整理你可以放進自己專案的設計方式。

## 9. 待驗證問題
列出目前還不能從這個檔案單獨確認的問題。
```

如果缺少 `原始碼位置`、`核心流程`、`依賴關係`、`可學走的設計`，就只能算草稿，不能算正式深讀筆記。

---

## 7. AI 輔助讀碼的固定流程

使用 AI 時，不要只問：

```txt
請解釋 Button 原始碼。
```

要改成：

```txt
【專案】View UI Plus
【目前目標】讀懂 Button 元件的核心設計
【源碼位置】src/components/button/button.vue
【我已知背景】Button 會經由 src/components/index.js 匯出，再由 src/index.js 全域註冊
【希望輸出】請整理成「源碼事實 / 設計意圖 / 可學走的寫法 / 待驗證問題」

回答限制：
1. 只根據我貼上的源碼回答。
2. 每個結論都要指出對應的 import、export、props、computed、method、render 或 class name。
3. 無法確認的內容請標記為「待驗證」。
4. 請區分「源碼事實」、「合理推論」、「待驗證」。
5. 不要只逐行翻譯，請說明它在整套元件庫中的角色。
```

AI 的角色是：

```txt
讀碼助教
索引器
流程整理器
疑點追蹤器
筆記格式化工具
```

AI 不是：

```txt
原始碼本身
權威答案
可以替你驗證所有細節的工具
```

任何 AI 回答都要回到源碼確認。

---

## 8. 問題回查閉環

讀碼時，問題不要只留在腦中，也不要分散在聊天記錄裡。

建議流程：

```txt
讀到問題
  ↓
寫進 99_問題回查索引.md
  ↓
標記問題分類與狀態
  ↓
找到對應源碼位置
  ↓
用 04 的問題框架追問
  ↓
用 05 / 06 的 AI SOP 分析
  ↓
將答案回填到 99
  ↓
如果答案對應某個檔案，更新 07_源碼覆蓋對照表.md
```

### 8.1 問題狀態

`99_問題回查索引.md` 建議使用 Q0～Q5 狀態：

| 狀態 | 意義 |
|---|---|
| Q0 | 只是想到問題，還沒定位源碼 |
| Q1 | 已定位相關源碼，但還沒回答 |
| Q2 | 有初步答案，但還沒驗證 |
| Q3 | 已根據源碼回答 |
| Q4 | 已整理成正式筆記 |
| Q5 | 已抽象成可複用知識或仿寫練習 |

---

### 8.2 問題分類

建議分類代碼：

| 代碼 | 類型 | 例子 |
|---|---|---|
| ARCH | 架構 / 插件入口 | `app.use(ViewUIPlus)` 背後做什麼？ |
| EXPORT | 匯出 / 對外 API | 哪些元件被 components/index.js export？ |
| COMP | 單一元件 | Button 的 class 怎麼組裝？ |
| FORM | 表單協作 | Form 和 FormItem 怎麼共享狀態？ |
| CMD | 命令式 API | Message 如何不用 template 就顯示？ |
| STYLE | 樣式系統 | Less 入口與元件樣式如何串接？ |
| I18N | 國際化 | locale 如何影響元件文案？ |
| DIR | 指令 | resize、line-clamp 如何註冊？ |
| BUILD | 建置與發布 | library build 如何產生 dist？ |
| TYPE | 型別契約 | types 如何描述元件 API？ |

---

## 9. 覆蓋追蹤規則

`07_源碼覆蓋對照表.md` 不是裝飾用，它要回答：

```txt
我到底讀過哪些源碼？
每個檔案讀到多深？
有沒有對應正式筆記？
下一個要補哪裡？
```

建議狀態：

| 狀態 | 意義 |
|---|---|
| S0 | 尚未閱讀 |
| S1 | 已定位路徑 |
| S2 | 粗讀過 |
| S3 | 已整理核心流程 |
| S4 | 已完成正式筆記 |
| S5 | 已完成仿寫 / 重構 / 可複用總結 |

深度分數：

| 分數 | 判斷 |
|---|---|
| 0 | 只知道檔案存在 |
| 1 | 知道大概用途 |
| 2 | 能說出主要 import / export |
| 3 | 能說出核心流程 |
| 4 | 能說出設計原因與依賴關係 |
| 5 | 能抽象成自己可複用的設計或仿寫實作 |

---

## 10. 不同目標的使用方式

### 10.1 如果目標是快速建立全局感

讀：

```txt
README.md
01_ViewUIPlus_專案定位.md
02_源碼總目錄地圖.md
03_建議閱讀順序.md
```

產出：

```txt
我知道 View UI Plus 是什麼。
我知道 src/index.js 是插件入口。
我知道 components/index.js 是元件出口。
我知道第一輪不該從 Table 開始。
```

---

### 10.2 如果目標是開始深讀第一個元件

讀：

```txt
03_建議閱讀順序.md
04_元件庫核心問題清單.md
05_如何用_AI_輔助讀源碼.md
06_AI_提問模板.md
```

然後開始：

```txt
src/components/button/button.vue
src/components/button/index.js
src/styles/components/button.less
```

產出：

```txt
Button 元件深讀筆記
Button 可學走的設計
Button 待驗證問題
07 覆蓋表更新
99 問題索引更新
```

---

### 10.3 如果目標是學元件庫架構

優先看：

```txt
package.json
vite.config.js
vite.config.dev.js
src/index.js
src/components/index.js
src/directives
src/locale
src/styles/index.less
```

要能回答：

```txt
這套庫如何被 build？
如何被 app.use 安裝？
如何註冊元件與指令？
如何暴露全域 API？
如何接樣式與語系？
```

---

### 10.4 如果目標是學高互動前端

第一輪不要急著讀所有樣式與建置，優先讀：

```txt
Button
Input
Select
Dropdown
Modal
Message
Table
Tree
Upload
DatePicker
```

但順序要由簡到難：

```txt
Button / Tag / Alert
  ↓
Input / InputNumber
  ↓
Form / FormItem
  ↓
Select / Option / Dropdown
  ↓
Modal / Message / Notice
  ↓
Table / Tree / Upload / DatePicker
```

---

## 11. 不建議的讀法

### 11.1 不建議從 `dist` 開始

`dist` 是打包後產物，適合確認最終輸出，不適合作為第一輪讀碼入口。

第一輪應該讀：

```txt
src/index.js
src/components/index.js
src/components/button/
```

---

### 11.2 不建議只看元件，不看入口

如果只看 Button、Input、Table，會漏掉：

```txt
app.use 如何安裝
components 如何集中匯出
directives 如何註冊
$VIEWUI 如何提供全域配置
$Message / $Modal 如何掛到 globalProperties
```

元件庫讀碼必須同時看：

```txt
單一元件實作
對外匯出表
插件安裝入口
examples 使用方式
樣式與型別支撐
```

---

### 11.3 不建議讓 AI 直接總結整個 repo

這種問法太大：

```txt
請幫我分析 View UI Plus 原始碼。
```

更好的問法是：

```txt
我貼給你 src/index.js，請只根據這個檔案分析 install 流程。
如果需要 components/index.js 才能確認，請標記為待驗證。
```

---

### 11.4 不建議建立大量空資料夾

筆記的完整性不是看資料夾多不多，而是看每篇筆記是否能回答：

```txt
對應哪個源碼？
解決哪個問題？
是否能回查？
是否能學走？
```

還沒讀的元件，不需要先建立空 README。

---

## 12. 9.5 分 README 的判斷標準

這份 README 要達到 9.5 分，必須符合下列標準：

| 標準 | 是否滿足 |
|---|---|
| 能說明整套筆記系統定位 | 是 |
| 能讓第一次使用者知道從哪裡開始 | 是 |
| 能說明 00～99 每篇文件用途 | 是 |
| 能回扣 View UI Plus 真實源碼主線 | 是 |
| 能區分入口、元件、共用層、樣式、型別、建置 | 是 |
| 能提供讀碼優先級 | 是 |
| 能提供正式筆記最低標準 | 是 |
| 能串起 AI 提問、覆蓋追蹤、問題回查 | 是 |
| 能避免空殼筆記與 AI 幻覺 | 是 |
| 能作為整套筆記的長期入口 | 是 |

---

## 13. 後續維護規則

### 13.1 新增筆記時

新增任何筆記，至少要更新：

```txt
07_源碼覆蓋對照表.md
99_問題回查索引.md
```

如果新增的是一整類筆記，例如 `Form`、`Table`、`styles`，也要檢查是否需要更新：

```txt
00_完整目錄樹.md
03_建議閱讀順序.md
04_元件庫核心問題清單.md
```

---

### 13.2 源碼結構變動時

如果 View UI Plus repo 結構變了，優先更新：

```txt
02_源碼總目錄地圖.md
07_源碼覆蓋對照表.md
README.md
```

如果 `src/index.js` 或 `src/components/index.js` 改動，還要更新：

```txt
01_ViewUIPlus_專案定位.md
03_建議閱讀順序.md
04_元件庫核心問題清單.md
99_問題回查索引.md
```

---

### 13.3 AI 回答回填時

任何 AI 產生的內容，正式寫入筆記前都要經過三步：

```txt
1. 找到對應源碼位置
2. 判斷是源碼事實、合理推論還是待驗證
3. 寫入 07 覆蓋表或 99 問題索引
```

不要把 AI 的一般性解釋直接寫成源碼結論。

---

## 14. 目前這一層完成後，下一步要做什麼

`00_總覽與讀碼策略` 完成後，下一步不是繼續美化總覽，而是開始進入逐檔深讀。

建議下一組正式筆記：

```txt
03_src_入口與插件機制/
├─ 01_src-index_install流程.md
├─ 02_全域元件註冊流程.md
├─ 03_全域指令註冊流程.md
├─ 04_$VIEWUI_全域配置.md
└─ 05_$Message_$Modal_$Notice_掛載方式.md

04_src-components_元件總覽/
├─ 01_components-index_匯出清單.md
├─ 02_元件分類與命名規則.md
├─ 03_對外元件與內部支撐目錄.md
└─ 04_第一輪深讀元件選擇.md

05_components_基礎通用元件/
└─ Button/
   ├─ 01_Button_元件定位.md
   ├─ 02_Button_props與class設計.md
   ├─ 03_Button_render流程.md
   ├─ 04_Button_與link_form_mixins關係.md
   └─ 05_Button_可仿寫設計.md
```

優先順序：

```txt
src/index.js
  ↓
src/components/index.js
  ↓
Button
  ↓
mixins/link.js + mixins/form.js
  ↓
styles/components/button.less
```

---

## 15. 最終提醒

這套筆記最重要的精神是：

```txt
不要追求一次看完全部源碼。
要追求每次讀完一個檔案，都能留下可驗證、可回查、可複用的知識。
```

讀 View UI Plus 的正確節奏應該是：

```txt
定位問題
  ↓
找到源碼
  ↓
餵給 AI 協助拆解
  ↓
回到源碼驗證
  ↓
整理正式筆記
  ↓
更新覆蓋表
  ↓
更新問題索引
  ↓
抽象成自己的設計能力
```

如果這套流程能持續執行，你學到的就不只是 View UI Plus，而是：

> **如何系統性讀懂一個大型前端開源專案，並把源碼經驗轉成自己的工程能力。**
