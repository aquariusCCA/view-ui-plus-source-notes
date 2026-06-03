# 元件庫核心設計原則與取捨

## 學習目標

這篇筆記把前面幾篇架構事實收斂成 View UI Plus 作為元件庫的核心設計原則。這些不是單一檔案中的語法細節，而是整套專案反覆出現的工程取向。

讀完後，你應該能用這些原則做元件庫設計判斷：入口是否穩定、公開清單是否集中、全域能力是否同步型別、樣式是否有統一入口，以及相容性設計是否值得擴大公開 API。

## 對照源碼

- `03-architecture/atomic/09-core-design-principles.md`
- `03-architecture/origin/07-core-design-principles.md`
- `01-origin/source/view-ui-plus-v1.3.20/src/index.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/index.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/`
- `01-origin/source/view-ui-plus-v1.3.20/src/styles/`
- `01-origin/source/view-ui-plus-v1.3.20/types/`
- `01-origin/source/view-ui-plus-v1.3.20/examples/`

## 六個設計原則

View UI Plus 的架構可以用六個設計原則理解：

1. 對使用者提供簡單入口。
2. 對內部維持可拆分結構。
3. 用集中匯出管理公開元件面。
4. 用全域配置統一跨元件體驗。
5. 用樣式系統維持視覺一致性。
6. 用型別宣告補足使用者側開發體驗。

這些原則不是抽象口號，都能回到前面筆記中的具體 source 表面。

## 簡單入口

使用者可以整包安裝：

```js
app.use(ViewUIPlus)
```

也可以具名匯入：

```js
import { Button, Modal } from 'view-ui-plus'
```

這兩種使用方式背後依賴 `src/index.js` 和 `src/components/index.js`。設計重點是：使用者入口要簡單，但內部結構可以複雜。

## 可拆分結構

每個元件通常有自己的資料夾與 `index.js`，複雜元件會再拆成子元件、工具檔或 mixin。

這種結構讓元件可以按複雜度成長：

- 簡單元件可以只有 `index.js` 與 `.vue`。
- 複合元件可以拆成父子元件。
- 命令式服務可以拆出 JS 控制器。
- 複雜元件可以有 util、mixin、panel、base 等內部模組。

設計判斷重點是：拆分應該服務於清楚的責任邊界，而不是讓檔案數變多。

## 集中匯出

`src/components/index.js` 是公開元件清單。只要某個元件被集中匯出，使用者就可能依賴它的名稱、用法與型別。

集中匯出的價值包括：

- 讓具名匯入有穩定來源。
- 讓整包安裝可以批次拿到 components。
- 讓公開 API 面可被 review。
- 讓新增或移除元件時有固定檢查點。

## 全域配置

`$VIEWUI` 把多個跨元件預設值集中在一起，例如尺寸、transfer、箭頭圖示、Modal 行為、Typography 設定等。

這種設計可以提供一致體驗：

- 同一套預設尺寸。
- 同一種彈層掛載策略。
- 同一種 icon 或 arrow 配置。
- 同一種服務 API 掛載位置。

但它也讓元件和全域環境產生關聯。閱讀元件時，要注意它是否讀取 `$VIEWUI`，以及 props 是否能覆蓋全域預設。

## 樣式一致性

`src/styles/index.less` 把變數、基礎樣式、mixins、動畫與元件樣式串起來。這代表元件庫不是每個元件各寫各的 CSS，而是有統一樣式入口。

閱讀樣式時要關注：

- class prefix 是否一致。
- 狀態 class 是否和 props、data 對應。
- 變數和 mixins 是否被多個元件重用。
- 動畫、浮層、尺寸是否有統一模式。

## 型別體驗

`types/index.d.ts` 和各元件型別檔讓 TypeScript 使用者能取得元件型別、install options、全域服務屬性型別與 `$VIEWUI` 全域配置型別。

這說明成熟元件庫的 API 不只存在於 runtime，也存在於 TypeScript 型別層。全域服務、全域配置、元件 props 和 install options 都需要分別檢查 runtime 與 type。

## 相容性意識

`src/index.js` 中的 `iButton`、`iInput`、`iTable` 等別名，顯示元件庫需要考慮既有使用者習慣。這類設計通常不是技術必要，而是產品與生態相容性的選擇。

閱讀源碼時，不要把所有設計都理解成最佳抽象。有些設計是為了相容歷史 API，有些是為了降低遷移成本。真正要 review 的問題是：這個相容性是否值得擴大公開 API 與維護面。

## 來源明確支持

- `src/index.js` 明確支援整包安裝、具名匯出、別名、全域配置與全域服務。
- `src/components/index.js` 明確提供集中公開元件清單。
- `src/styles/index.less` 明確提供統一 Less 入口。
- `types/index.d.ts` 明確提供 install options 與全域屬性型別。
- atomic 09 與 origin 07 明確整理了簡單入口、可拆分結構、集中匯出、全域配置、樣式一致性、型別體驗與相容性意識。

## 根據來源推論

- 將 `i` 前綴別名解讀為相容性設計，是根據 source 中手動別名與 atomic 09 的說明做出的推論；source 未直接描述歷史原因。
- 將六個設計原則用於企業封裝與 PR review，是從架構事實延伸出的實務判斷，不是 View UI Plus 原始碼中的註解。

## Runtime / Type / 樣式落差

核心設計原則需要同時落到三個面：

| 原則 | Runtime 檢查 | Type 檢查 | Style 檢查 |
| --- | --- | --- | --- |
| 簡單入口 | `src/index.js`、`package.json` | `types/index.d.ts` | 不直接涉及 |
| 集中匯出 | `src/components/index.js` | `viewuiplus.components` | 不直接涉及 |
| 全域配置 | `$VIEWUI` runtime | `ViewUIPlusGlobalOptions` | 元件樣式是否承接 size/status |
| 全域服務 | `globalProperties` | `ComponentCustomProperties` | 服務元件樣式入口 |
| 樣式一致性 | class 生成 | 型別通常不描述 class | `src/styles/index.less` |

如果任一面缺失，設計原則就只停留在概念，不能直接寫成完整能力。

目前可確認的一個具體落差是：`src/index.js` 會把 `opts.capture` 寫入 `$VIEWUI.capture`，但 `types/index.d.ts` 的 `ViewUIPlusGlobalOptions` 目前未列出 `capture`。因此全域配置不能只看 runtime，也要逐項比對 type 是否同步。

## 設計啟發

從 View UI Plus 可以帶走的元件庫設計方法：

- 入口要穩定，不要讓使用者依賴深層內部路徑。
- 公開元件清單要集中，方便匯入、註冊、review。
- 元件內部可以漸進拆分，但外部入口應保持穩定。
- 樣式要有統一入口，否則狀態 class 難以追蹤。
- 全域服務要同時考慮 runtime 與 type。
- 相容性也是架構設計的一部分，但需要明確承擔維護成本。

## 實戰使用場景

- 設計新元件庫入口時，用「整包安裝、具名匯入、型別入口、樣式入口」四項檢查公開面。
- Review 新增元件時，確認它是否被集中匯出、是否有型別、是否有樣式入口、是否需要全域配置。
- 討論是否提供別名時，把它當成公開 API 決策，而不是小型程式碼便利。
- 封裝企業元件時，判斷應該沿用 View UI Plus 基礎能力，還是新增業務層組合。

## 實作檢查任務

1. 在 `src/index.js` 找出能支持「簡單入口」的程式碼。
2. 在 `src/components/index.js` 選一個元件，追到它的單一元件入口與實作檔。
3. 比對 `$VIEWUI` runtime 設定與 `types/index.d.ts` 中的 `ViewUIPlusGlobalOptions`。
4. 從任一元件 class 回查 `src/styles/index.less` 是否能串到元件樣式。
5. 找出所有 `i` 前綴別名，說明它們帶來的相容性價值與公開 API 成本。

## 複習題

1. 為什麼「使用者入口簡單」不代表「內部結構簡單」？
2. 集中匯出元件有哪些好處？
3. `$VIEWUI` 這種全域配置和 props 配置應該如何分工？
4. 樣式系統為什麼需要統一入口？
5. 如何判斷某個設計是技術抽象，還是相容性選擇？
