# 元件庫核心設計原則

## 學習目標

這篇筆記把前面幾篇架構筆記收斂成 View UI Plus 作為元件庫的核心設計原則。這些原則不是單一檔案中的語法細節，而是入口、元件拆分、集中匯出、全域配置、樣式系統、型別宣告與相容性一起形成的工程取向。

讀完後，你應該能把 View UI Plus 的架構事實轉成可遷移的元件庫設計判斷。

## 來源與對照

主要 atomic：

- `03-architecture/atomic/09-core-design-principles.md`

origin 對照：

- `03-architecture/origin/07-core-design-principles.md`

對照源碼：

- `01-origin/source/view-ui-plus-v1.3.20/src/index.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/index.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/`
- `01-origin/source/view-ui-plus-v1.3.20/src/styles/`
- `01-origin/source/view-ui-plus-v1.3.20/types/index.d.ts`
- `01-origin/source/view-ui-plus-v1.3.20/examples/`

## 六個設計原則

View UI Plus 的架構可以用六個設計原則來理解：

1. 對使用者提供簡單入口。
2. 對內部維持可拆分結構。
3. 用集中匯出管理公開元件面。
4. 用全域配置統一跨元件體驗。
5. 用樣式系統維持視覺一致性。
6. 用型別宣告補足使用者側開發體驗。

另外，`src/index.js` 中的 `i` 前綴別名也顯示 View UI Plus 需要處理相容性與既有使用習慣。這提醒我們：元件庫設計不只追求抽象，也要面對使用者遷移與生態成本。

## 原則一：使用者入口要簡單

使用者可以整包安裝：

```js
app.use(ViewUIPlus)
```

也可以具名匯入：

```js
import { Button, Modal } from 'view-ui-plus'
```

這兩種用法背後依賴 `src/index.js` 與 `src/components/index.js` 的協作。對使用者來說入口簡單；對元件庫內部來說，入口要同時支撐模組匯出、插件安裝、locale/i18n、指令、全域配置與命令式服務。

設計重點是：簡單入口不代表內部結構簡單。好的元件庫會把內部複雜度收斂到穩定入口後面。

## 原則二：內部結構要能按複雜度拆分

每個元件通常有自己的資料夾與 `index.js`。簡單元件可以只有入口和 `.vue`；複雜元件可以拆成父子元件、工具檔、mixin、panel 或 base 能力；命令式服務可以拆出 JS 控制器。

這種結構讓元件有成長空間：

| 元件型態 | 可能拆分方式 |
| --- | --- |
| 簡單元件 | `index.js` + `.vue` |
| 複合元件 | 父元件、子元件、group、item |
| 命令式服務 | 服務入口、實例管理、基礎通知能力 |
| 浮層元件 | popup、popper、transfer、mask、trigger |
| 複雜資料元件 | util、mixin、子面板、內部 base 模組 |

內部可拆分的目標不是讓檔案變多，而是讓每個檔案的責任可追蹤。

## 原則三：公開元件清單要集中

`src/components/index.js` 是公開元件清單。這份清單的價值在於讓「哪些元件對外可用」變得明確。

對元件庫來說，公開匯出不是普通內部細節，而是 API 契約。只要某個元件被匯出，使用者就可能依賴：

1. 具名匯入名稱。
2. 全域註冊名稱。
3. 文件與範例中的元件名稱。
4. TypeScript 型別中的對應名稱。

因此集中匯出不是單純管理方便，而是公開 API 面的治理方式。

## 原則四：全域配置統一跨元件體驗

`$VIEWUI` 把多個跨元件預設值集中在一起，例如：

- 通用尺寸。
- 彈層 transfer。
- 事件捕獲。
- arrow / customArrow / icon / maskClosable 等元件預設值。
- Typography、Space、Image 等元件配置。

這讓元件庫可以提供一致體驗，例如同一套預設尺寸、同一種彈層掛載策略、同一種 icon 或 arrow 配置。

代價是單一元件可能依賴全域環境。閱讀元件時，如果它讀取 `$VIEWUI`，就要把 `install(app, opts)` 的全域配置一起納入分析，而不能只看 props。

## 原則五：樣式系統要有統一入口

`src/styles/index.less` 透過 Less `@import` 串起 `custom`、`base`、`mixins/index`、`common/index`、`animation/index` 與 `components/index`。

這代表 View UI Plus 不是每個元件各寫各的樣式，而是有統一樣式入口。閱讀樣式時要關注：

1. class prefix 是否一致。
2. 狀態 class 是否和 props、data 或 computed 對應。
3. 變數和 mixins 是否被多個元件重用。
4. 動畫、浮層、尺寸是否有統一模式。
5. JS 入口與樣式入口是否各自清楚。

樣式一致性是元件庫使用體驗的一部分，不能只在 runtime 層分析。

## 原則六：型別宣告補足使用者側體驗

`types/index.d.ts` 和各元件型別檔讓 TypeScript 使用者取得：

1. 元件型別。
2. `install` options 型別。
3. 全域服務屬性型別。
4. `$VIEWUI` 全域配置型別。

這說明元件庫的公開 API 不只存在於 JavaScript runtime，也存在於 TypeScript 型別層。

尤其對全域服務來說，runtime 與 type 必須成對檢查：

| 表面 | 來源 |
| --- | --- |
| runtime 掛載 | `src/index.js` 的 `app.config.globalProperties` |
| type 補充 | `types/index.d.ts` 的 `ComponentCustomProperties` 擴充 |

如果其中一邊缺失，使用者體驗就會不完整。

成對檢查不代表目前 source 已完整對齊。依 `src/index.js`，runtime 還有 `version`、`locale`、`i18n`、`lang` 與預設 API 匯出；依 `types/index.d.ts`，型別入口主要覆蓋元件、`install`、全域 options 與全域服務屬性。`$VIEWUI` 的 runtime options 也包含 `capture`，但型別中的 `ViewUIPlusGlobalOptions` 未列出。這些都應被視為後續分析型別系統時的檢查點。

## 相容性也是設計的一部分

`src/index.js` 中的 `iButton`、`iInput`、`iTable` 等別名顯示 View UI Plus 需要考慮既有使用者習慣。

這類設計不一定是最佳抽象，也不一定是技術必要。它可能是為了：

1. 相容歷史 API。
2. 降低遷移成本。
3. 符合既有使用者模板習慣。

閱讀源碼時，不要把所有設計都理解成純技術抽象。有些選擇是產品、生態與相容性共同作用的結果。

## Runtime / Type / 樣式落差

這篇的落差重點不是列出單一元件差異，而是提醒每個設計原則都可能跨表面：

1. 簡單入口：runtime 在 `src/index.js`，型別入口在 `types/index.d.ts`，打包入口在 `package.json`。
2. 集中匯出：runtime 由 `src/components/index.js` 提供，型別還要看 `types/`。
3. 全域配置：runtime 由 `$VIEWUI` 提供，type 由 `ViewUIPlusGlobalOptions` 支撐，但需檢查 key 是否完整對應。
4. 樣式一致性：class 由元件 runtime 生成，視覺效果由 Less 系統承接。
5. 相容性別名：runtime 註冊後就是公開名稱，後續型別與文件是否完整需要另行查證。

正式分析具體元件時，應把這些表面分開寫清楚。

## 關鍵設計

View UI Plus 值得學的不是某一段語法，而是一套元件庫如何讓公開 API、內部拆分、全域能力、樣式與型別互相支撐。

可以濃縮成幾條設計判斷：

1. 入口要穩定，內部可以拆分。
2. 公開元件清單要集中，避免 API 面散落。
3. 全域配置要服務一致體驗，但不能讓元件過度依賴隱式狀態。
4. 樣式要有統一入口，讓狀態 class 有視覺承接。
5. 全域服務與入口匯出要同時考慮 runtime 與 type。
6. 相容性選擇要被辨識出來，不能誤讀成最佳抽象。

## 設計啟發

設計自己的元件庫時，可以用以下清單檢查：

1. 使用者入口是否簡單且穩定？
2. 內部元件是否能隨複雜度自然拆分？
3. 公開匯出清單是否集中？
4. 全域配置是否有明確邊界與型別？
5. 樣式入口是否統一？
6. 全域服務是否同時有 runtime 掛載與 TypeScript 宣告？
7. 任何別名或相容性 API 是否真的必要？

這些原則能幫助你從 View UI Plus 的源碼閱讀，遷移到自己的元件庫設計與企業封裝決策。

## 複習題

1. 為什麼「使用者入口簡單」不代表「內部結構簡單」？
2. `src/components/index.js` 作為集中匯出清單有哪些價值？
3. `$VIEWUI` 這種全域配置和單一 props 配置應該如何分工？
4. 樣式系統為什麼需要統一入口？
5. 如何判斷某個設計是技術抽象，還是相容性選擇？
