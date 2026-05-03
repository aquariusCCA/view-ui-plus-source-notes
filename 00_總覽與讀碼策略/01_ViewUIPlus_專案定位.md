# 01_ViewUIPlus_專案定位

> 本篇任務：先建立「View UI Plus 這個專案到底是什麼」的讀碼定位。  
> 它不是逐行源碼解析，而是之後閱讀 `src/index.js`、`src/components/index.js`、單一元件、樣式系統、型別宣告與建置流程時的前置地圖。

---

## 0. 本篇結論

View UI Plus 可以定位成：

> **基於 Vue 3 的企業級 UI 元件庫與前端基礎設施。**

從源碼角度看，它不是一個「有頁面、有路由、有業務流程」的後台系統，而是一個提供下列能力的公共元件庫：

1. **可重用元件**：例如 Button、Input、Select、Table、Modal、Tree、DatePicker。
2. **插件安裝能力**：透過 `app.use(ViewUIPlus)` 把元件、指令、全域配置與命令式 API 接進 Vue App。
3. **全域命令式能力**：例如 `$Message`、`$Modal`、`$Notice`、`$Spin`、`$Loading`。
4. **樣式與主題能力**：透過 `src/styles` 管理 Less 變數、mixin、元件樣式與入口樣式。
5. **國際化能力**：透過 `src/locale` 管理語系與格式化邏輯。
6. **型別宣告能力**：透過 `types` 讓 TypeScript 使用者取得元件與 API 型別。
7. **建置與發布能力**：透過 `package.json`、`build`、`dist` 將源碼打包成可被專案安裝與引用的套件。

所以閱讀這個專案時，核心問題不是「某個頁面做了什麼業務」，而是：

> **這套元件庫如何把大量 UI 能力整理成一組穩定、可重用、可安裝、可客製化、可發布的公共介面？**

---

## 1. 本篇源碼核對依據

以下是判斷專案定位時，優先對照的源碼與專案檔案。

| 源碼位置 | 可以觀察到什麼 | 對專案定位的意義 |
|---|---|---|
| `README.md` | 官方將 View UI Plus 定位為 Vue 3 之上的 enterprise-level UI component library 與 front-end solution | 它不是業務系統，而是 UI 元件庫與前端解決方案 |
| `package.json` | 套件名稱為 `view-ui-plus`，入口指向 `dist/viewuiplus.min.js`，型別入口指向 `types/index.d.ts`，發布檔案包含 `dist`、`src`、`types` | 它是可發布、可安裝、可被其他專案引用的 npm library |
| `package.json` scripts | 包含 `build:prod`、`build:style`、`build:lang` | 專案同時處理 JS 打包、樣式打包與語系包建置 |
| `src/index.js` | 匯出 components、定義 `install(app, opts)`、註冊全域元件、註冊指令、掛載全域 API | 這是整個元件庫的 Vue Plugin 入口 |
| `src/components/index.js` | 集中匯出大量元件 | 這是元件庫的 public component surface |
| `src/components/*` | 各元件的具體實作 | 這是讀碼主戰場，但不適合作為第一個入口 |
| `src/directives` | 包含 `clickoutside`、`line-clamp`、`resize`、`style`、`transfer-dom` 等指令或 DOM 行為能力 | 元件庫不只提供 component，也提供跨元件的 DOM 行為抽象 |
| `src/locale` | 包含語系目錄與格式化、語系切換入口 | 元件庫需要處理跨語系使用場景 |
| `src/styles` | 包含 `animation`、`color`、`common`、`components`、`mixins`、`base.less`、`custom.less`、`index.less` | 元件庫有自己的樣式系統與主題組織方式 |
| `types` | 大量 `.d.ts` 型別檔 | 元件庫需要對 TypeScript 使用者提供穩定型別介面 |
| `build` | 樣式、語系、Vite 建置相關腳本 | 元件庫需要額外處理發布與產物生成，不只是本地開發 |

> 讀碼規則：之後每篇筆記只要做出定位判斷，都應盡量回扣到具體檔案路徑，而不是只寫抽象觀念。

---

## 2. 它在前端生態中的位置

View UI Plus 位在「應用層」之下、「Vue 框架層」之上。

```text
業務專案 / 後台系統 / 表單系統 / 管理平台
        ↓ 使用
View UI Plus
        ↓ 基於
Vue 3
        ↓ 操作
Browser DOM / CSSOM
```

換句話說，View UI Plus 不是直接解決某間公司的業務流程，而是讓其他 Vue 專案可以更快、更一致地建立 UI。

### 2.1 一般業務專案關心什麼？

一般 Vue 業務專案通常關心：

- 這個頁面對應什麼功能？
- 使用者點按後要呼叫哪支 API？
- 資料從哪裡來？
- 狀態放在 local state、Pinia、Vuex 還是 URL？
- 成功、失敗、權限、流程分支如何處理？

這類專案通常會看到：

```text
src/views
src/pages
src/router
src/api
src/store
src/modules
src/layout
src/permission
```

### 2.2 View UI Plus 關心什麼？

View UI Plus 作為元件庫，主要關心：

- 元件 API 是否好用？
- Props / Emits / Slots 是否穩定？
- 全域註冊是否方便？
- 樣式是否一致？
- 複雜互動是否可重用？
- 國際化、型別、打包、發布是否完整？
- 使用者升級版本時是否不容易破壞既有程式？

所以讀 View UI Plus 時，不應該先用「業務系統讀法」去找頁面流程，而應該用「元件庫讀法」去看它如何建立公共 UI 能力。

---

## 3. 它主要解決的問題

### 3.1 重複 UI 的封裝問題

如果每個專案都自己寫 Button、Input、Select、Modal、Table，會出現大量重複實作。

元件庫的價值是把常見 UI 能力整理成：

- 穩定的元件名稱
- 穩定的 Props
- 穩定的事件
- 穩定的插槽
- 穩定的樣式規則
- 穩定的互動行為

這就是 `src/components` 存在的理由。

讀碼時要問：

```text
這個元件對外承諾了什麼 API？
這個元件內部如何支撐這些 API？
哪些行為是元件自己處理？
哪些行為交給 mixins、utils、directives 或子元件處理？
```

---

### 3.2 UI 一致性的問題

大型前端專案最怕每個開發者都自己寫一套 UI 規則，最後變成：

- Button 尺寸不一致
- 表單錯誤提示不一致
- Modal 關閉行為不一致
- 下拉選單定位不一致
- 顏色、間距、字級、動畫不一致

View UI Plus 透過元件 API、樣式系統、全域配置與共用邏輯，建立一致性。

源碼上可以優先觀察：

| 一致性類型 | 優先看哪裡 |
|---|---|
| 元件命名一致性 | `src/components/index.js` |
| 全域設定一致性 | `src/index.js` 的 `$VIEWUI` 設定 |
| 樣式一致性 | `src/styles` |
| 互動一致性 | `src/directives`、`src/mixins`、`src/utils` |
| 語系一致性 | `src/locale` |
| 型別一致性 | `types` |

---

### 3.3 複雜互動的複用問題

像 Select、DatePicker、Cascader、Tree、Table、Upload 這類元件，通常不只是畫出 HTML。

它們還可能包含：

- 開啟與關閉
- 選取與反選
- 多選狀態
- 鍵盤操作
- 滾動定位
- 遮罩與浮層
- 點擊外部關閉
- 資料格式轉換
- 表單驗證整合
- 動畫與過渡
- 國際化文字

這些能力如果全部寫在單一元件裡會很難維護，所以元件庫通常會把共用能力拆到不同層次。

讀碼時要特別注意：

```text
這段邏輯是元件專屬，還是跨元件共用？
如果是共用，它被抽到 utils、mixins、directives、base 還是子元件？
抽出去之後，其他元件如何復用？
```

---

### 3.4 Vue Plugin 安裝問題

View UI Plus 不是只提供很多 `.vue` 檔案而已，它還要讓使用者可以這樣使用：

```js
app.use(ViewUIPlus)
```

因此 `src/index.js` 是非常重要的入口。

從 `src/index.js` 可以看出它大致負責：

1. 匯出所有 components。
2. 建立整個 ViewUI 物件。
3. 定義 `install(app, opts)`。
4. 根據 `opts.locale` 與 `opts.i18n` 設定語系。
5. 將元件註冊到 Vue app。
6. 將指令註冊到 Vue app。
7. 掛載 `$VIEWUI` 全域配置。
8. 掛載 `$Message`、`$Modal`、`$Notice`、`$Spin`、`$Loading` 等全域 API。
9. 匯出 `version`、`locale`、`i18n`、`lang` 等輔助能力。

這代表 View UI Plus 的定位不是「元件檔案集合」，而是「Vue 3 可安裝的 UI 能力集合」。

---

### 3.5 發布與消費問題

元件庫最後不是只給作者自己跑，而是要給其他專案安裝使用。

所以它需要處理：

- npm package metadata
- JS 打包產物
- CSS 打包產物
- 語系包產物
- 型別宣告
- source files 發布
- 文件與範例

這些可以從 `package.json`、`build`、`types`、`dist`、`examples` 等位置觀察。

讀這一層時要問：

```text
這個專案如何從源碼變成可安裝套件？
使用者 import 的入口是哪裡？
CSS 是怎麼輸出的？
型別是怎麼提供的？
語系包是怎麼建置的？
```

---

## 4. 從源碼角度拆解 View UI Plus

View UI Plus 可以拆成六個主要層次。

---

### 4.1 套件與發布層

代表位置：

```text
package.json
build/
dist/
types/
```

這一層回答：

- 套件名稱是什麼？
- npm 使用者安裝的是什麼？
- 打包入口在哪裡？
- CSS 如何建置？
- 語系包如何建置？
- TypeScript 型別如何暴露？

對學習者的意義：

> 這一層可以讓你理解「開源元件庫不是只寫 Vue 元件，還要把元件變成可發布、可安裝、可維護的產品」。

---

### 4.2 入口與插件層

代表位置：

```text
src/index.js
```

這一層回答：

- `app.use(ViewUIPlus)` 背後做了什麼？
- 全部元件如何被註冊？
- 全域指令如何被註冊？
- `$Message`、`$Modal` 這類命令式 API 如何掛到 Vue instance？
- 全域配置 `$VIEWUI` 如何建立？
- `locale`、`i18n`、`version` 這類 API 如何暴露？

這是最應該優先閱讀的檔案之一。

原因：

> 它是整個元件庫的總開關。先理解入口，就不會在單一元件裡迷路。

---

### 4.3 元件公開介面層

代表位置：

```text
src/components/index.js
```

這一層回答：

- 哪些元件被公開匯出？
- 元件名稱和資料夾名稱如何對應？
- 哪些是主元件？
- 哪些是子元件？
- 哪些命名可能帶有舊版 iView / View UI 相容性痕跡？

這份檔案很適合拿來建立元件總表。

例如可以整理成：

| 類型 | 代表元件 |
|---|---|
| 基礎 | Button、Icon、Divider、Tag、Typography |
| 表單 | Input、InputNumber、Select、DatePicker、Form、Upload |
| 資料展示 | Table、Tree、Timeline、List、Card、Descriptions |
| 回饋 | Message、Notice、Modal、Spin、LoadingBar |
| 導航 | Menu、Tabs、Breadcrumb、Page、Anchor |
| 佈局 | Row、Col、Layout、Header、Content、Footer、Sider |
| 高階場景 | Login、Captcha、Result、Exception、GlobalFooter |

> 注意：`src/components` 中不是每個資料夾都等同於「獨立對外元件」。有些可能是內部輔助、有些是子元件、有些是高階場景封裝。後續要靠 `src/components/index.js` 判斷是否真的對外 export。

---

### 4.4 單一元件實作層

代表位置：

```text
src/components/button
src/components/input
src/components/select
src/components/table
src/components/modal
...
```

這一層回答：

- 元件對外提供哪些 Props？
- 元件觸發哪些 Events？
- 元件支援哪些 Slots？
- 元件如何管理內部狀態？
- 元件如何呼叫子元件？
- 元件如何接入表單、浮層、動畫、樣式與全域配置？

這是最接近「實作能力」的地方，但不建議一開始就直接讀重型元件。

建議順序：

```text
Button / Icon / Divider / Space
        ↓
Input / Radio / Checkbox / Tag
        ↓
Form / Select / Modal / Tabs
        ↓
Table / Tree / DatePicker / Cascader / Upload
```

原因：

> 簡單元件可以先讓你熟悉這套專案的命名、props、render/template、class 組裝、樣式接法；重型元件則適合在建立基本模式後再讀。

---

### 4.5 共用基礎能力層

代表位置：

```text
src/utils
src/mixins
src/directives
src/components/base
```

這一層回答：

- 哪些邏輯是多個元件共用的？
- DOM 行為如何抽象？
- 點擊外部、resize、transfer-dom、line-clamp 這類能力如何復用？
- 共同 props、共同方法、共同表單行為是否被抽離？
- 元件之間如何避免重複寫同樣的判斷？

這一層是學習「元件庫工程化」很重要的地方。

讀碼時可以特別標記：

```text
元件本體：負責對外 API 與主要渲染
共用能力：負責跨元件重複使用的底層邏輯
樣式系統：負責一致的視覺與狀態表達
```

---

### 4.6 樣式、語系、型別與範例層

代表位置：

```text
src/styles
src/locale
types
examples
test
```

這一層回答：

- 樣式如何集中管理？
- 每個元件的 Less 檔案如何被匯入？
- 主題客製化入口在哪裡？
- 語系如何切換？
- TypeScript 使用者拿到的型別從哪裡來？
- 官方範例如何展示元件用法？
- 測試如何保護行為不被破壞？

這些不是單一元件的核心邏輯，但會決定元件庫是否能被真實專案穩定使用。

---

## 5. View UI Plus 不是什麼

在開始讀碼之前，要先排除錯誤期待。

View UI Plus 不是：

- 不是後台管理系統
- 不是 CRM / ERP / 銀行業務系統
- 不是 CRUD 範例專案
- 不是以 router 為核心的頁面應用
- 不是以 API 串接為主的資料流專案
- 不是拿來示範前後端整合的全端專案
- 不是像 RuoYi 那種包含權限、選單、部門、角色、登入流程的應用框架

所以讀這個專案時，不要優先追問：

```text
這個頁面的業務目的是什麼？
資料庫表在哪裡？
API service 在哪裡？
router 怎麼切頁？
權限怎麼控制？
某個按鈕最後寫入哪張表？
```

這些問題在業務系統很重要，但不是 View UI Plus 的主線。

更應該追問：

```text
這個元件的公共 API 怎麼設計？
它如何做到可重用？
它如何接入 Vue plugin？
它如何跟樣式、語系、指令、型別協作？
它的共用邏輯抽在哪裡？
它如何兼顧易用性與擴充性？
```

---

## 6. 讀 View UI Plus 應該建立的五種視角

### 6.1 公共 API 視角

元件庫最重要的是對外承諾。

每個元件都應該用這些問題閱讀：

```text
使用者如何引入它？
使用者可以傳哪些 props？
使用者可以監聽哪些 events？
使用者可以放哪些 slots？
使用者可以透過全域配置影響它嗎？
使用者升級版本時，哪些行為不應該被破壞？
```

這個視角對應：

```text
src/components/index.js
types/*.d.ts
examples
官方文件
```

---

### 6.2 內部實作視角

公共 API 背後一定要有實作支撐。

閱讀單一元件時，要追：

```text
props 如何轉成 class？
props 如何轉成 DOM 屬性？
狀態如何初始化？
狀態如何更新？
事件何時 emit？
slot 如何插入？
子元件如何協作？
```

這個視角對應：

```text
src/components/某元件
src/utils
src/mixins
src/directives
```

---

### 6.3 共用抽象視角

元件庫的品質不只看單一元件寫得好不好，還要看共用邏輯是否抽得合理。

閱讀時要問：

```text
這段邏輯是否在多個元件重複出現？
作者有沒有把它抽出來？
抽出來後是否降低耦合？
抽象是否過度？
哪些地方保留在元件內反而比較清楚？
```

這個視角對你學設計模式、開閉原則、元件封裝會很有幫助。

---

### 6.4 樣式系統視角

元件庫不是只有功能，也要保證視覺一致。

閱讀樣式時，不要只看某個 CSS 屬性，而要看：

```text
class 命名規則是否一致？
狀態 class 如何設計？
尺寸 class 如何設計？
顏色變數在哪裡？
元件樣式如何被統一匯入？
custom.less 扮演什麼角色？
```

這個視角對應：

```text
src/styles/index.less
src/styles/base.less
src/styles/custom.less
src/styles/components
src/styles/mixins
```

---

### 6.5 發布產品視角

開源元件庫最後要被別人安裝，所以不能只看開發階段。

閱讀時要補問：

```text
打包後的入口是什麼？
CSS 產物在哪裡？
型別宣告怎麼提供？
語系包怎麼產出？
哪些檔案會被 npm package 帶出去？
```

這個視角對應：

```text
package.json
build
dist
types
```

---

## 7. 用一句話區分「業務專案讀法」與「元件庫讀法」

| 類型 | 閱讀主線 | 你要追的問題 |
|---|---|---|
| 業務專案 | 頁面 → 狀態 → API → 業務流程 | 使用者做了什麼？資料怎麼流？業務規則在哪裡？ |
| UI 元件庫 | 入口 → 匯出 → 元件 API → 共用抽象 → 樣式 / 型別 / 建置 | 元件如何被安裝、使用、客製化、復用與發布？ |

View UI Plus 應該用第二種讀法。

---

## 8. 這篇筆記如何指導後續閱讀

讀完這篇後，接下來不要直接衝進 `Table` 或 `DatePicker`。

建議順序是：

### Step 1：先讀入口

```text
src/index.js
```

目標：理解整個元件庫如何安裝到 Vue App。

產出筆記：

```text
app.use(ViewUIPlus) 流程圖
全域元件註冊清單
全域指令註冊清單
$VIEWUI 設定項目表
全域 API 掛載清單
```

---

### Step 2：再讀元件公開清單

```text
src/components/index.js
```

目標：建立「有哪些對外元件」的全景。

產出筆記：

```text
元件分類表
主元件 / 子元件 / 高階場景元件標記
每個元件對應的資料夾路徑
優先閱讀順序
```

---

### Step 3：讀簡單元件建立模式

建議先讀：

```text
Button
Icon
Divider
Tag
Space
```

目標：掌握這套專案的基本元件寫法。

產出筆記：

```text
Props 表
Emits 表
Slots 表
class 組裝方式
樣式檔對應
共用 mixin / util 使用情況
```

---

### Step 4：讀中型元件理解互動

建議讀：

```text
Input
Radio
Checkbox
Tabs
Modal
Form
```

目標：理解狀態同步、事件、表單、彈窗、插槽與子元件協作。

---

### Step 5：最後讀重型元件

建議後讀：

```text
Table
Select
Tree
DatePicker
Cascader
Upload
```

目標：理解複雜互動、資料結構、跨元件協作與工程抽象。

---

## 9. 容易誤解的地方

### 9.1 誤解一：看到 `components` 就以為每個資料夾都是獨立元件

不一定。

判斷是否對外元件，應優先看：

```text
src/components/index.js
```

有被集中 export 的，才是明確的 public component surface。

---

### 9.2 誤解二：一開始就讀 Table 才叫深入

不建議。

Table 很重要，但通常牽涉資料結構、渲染、欄位、排序、選取、固定欄、展開列、樣式與複雜狀態。

如果還沒理解入口、元件匯出、基礎 props/class/slot 模式，直接讀 Table 容易只看到細節，看不到系統設計。

---

### 9.3 誤解三：只看 `.vue` 檔就等於讀完元件庫

不夠。

元件庫至少還要看：

```text
入口：src/index.js
公開清單：src/components/index.js
樣式：src/styles
指令：src/directives
工具：src/utils
混入：src/mixins
語系：src/locale
型別：types
建置：package.json / build
```

只看 `.vue`，會漏掉「元件庫如何被整體安裝與發布」。

---

### 9.4 誤解四：把它當作業務系統找 router / API

View UI Plus 的主線不是 router 或 API。

如果你一直找：

```text
views
router
api
store
permission
```

你會很容易覺得它不像完整專案。

但這正是因為它不是業務專案，而是元件庫。

---

### 9.5 誤解五：只學使用方式，不讀設計取捨

如果只是學會：

```vue
<Button type="primary">提交</Button>
```

那只是使用者視角。

讀源碼時更重要的是理解：

```text
type 這個 prop 如何影響 class？
loading 狀態如何改變互動？
disabled 如何處理事件？
icon 如何插入？
樣式如何對應？
型別如何描述？
```

這才是從「會用」進到「會設計元件」的關鍵。

---

## 10. 這篇筆記的完成標準

如果這篇筆記要算真正完成，讀完後應該能回答以下問題。

### 10.1 定位問題

- View UI Plus 是什麼？
- 它在 Vue 生態中扮演什麼角色？
- 它和一般後台業務專案有什麼不同？
- 它主要解決哪些工程問題？

### 10.2 源碼問題

- 哪個檔案是整個元件庫的入口？
- 哪個檔案集中匯出所有元件？
- 樣式系統主要在哪裡？
- 語系系統主要在哪裡？
- 型別宣告主要在哪裡？
- 建置與發布資訊主要在哪裡？

### 10.3 讀碼策略問題

- 為什麼不建議一開始直接讀 Table？
- 為什麼應該先讀 `src/index.js`？
- 為什麼要區分 public API 和 internal implementation？
- 讀元件庫時，應該如何判斷「這段設計值得學走」？

---

## 11. 後續筆記應遵守的寫法

為了讓後續筆記真正貼近 View UI Plus 原始碼，每篇都建議固定包含：

```text
1. 原始碼位置
2. 這個檔案 / 元件負責什麼
3. 對外 API
4. 內部流程
5. 依賴哪些共用模組
6. 樣式對應位置
7. 型別對應位置
8. 可以學走的設計
9. 我還沒看懂的問題
10. 待回查索引
```

最重要的是：

> 不要只寫「這是一個 Button 元件」，要寫「Button 對外承諾哪些 API，內部如何把這些 API 轉成 DOM、class、事件與樣式」。

---

## 12. 本篇總結

View UI Plus 的正確讀碼定位是：

> **它是一個 Vue 3 UI 元件庫，也是一套前端 UI 基礎設施。它的核心不是業務流程，而是元件 API、插件安裝、全域能力、共用抽象、樣式系統、語系、型別與發布流程。**

因此後續讀碼應該從：

```text
src/index.js
        ↓
src/components/index.js
        ↓
簡單元件
        ↓
共用能力
        ↓
中型元件
        ↓
重型元件
        ↓
樣式 / 型別 / 語系 / 建置
```

逐步推進。

如果能保持這個視角，你讀 View UI Plus 時就不會只是在看零散 `.vue` 檔，而是在學一套成熟 UI 元件庫如何被設計、組織、安裝、發布與維護。
