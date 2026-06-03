# 共用能力、樣式、型別與建置表面

## 學習目標

這篇筆記整理 View UI Plus 中不直接等同於單一元件、但支撐整套元件庫的架構表面：共用能力、樣式系統、型別入口與打包產物。

讀完後，你應該能判斷：

1. 哪些能力不應該放在單一元件內部重複實作。
2. 樣式入口、型別入口與建置產物如何支撐使用者消費體驗。
3. 為什麼分析元件庫必須同時看 runtime、style、type 與 build surface。

## 來源與對照

主要 atomic：

- `03-architecture/atomic/06-shared-style-type-build-surfaces.md`

origin 對照：

- `03-architecture/origin/01-project-structure.md`
- `03-architecture/origin/02-module-layers.md`
- `03-architecture/origin/07-core-design-principles.md`
- `03-architecture/origin/08-architecture-summary.md`

對照源碼：

- `01-origin/source/view-ui-plus-v1.3.20/src/directives/`
- `01-origin/source/view-ui-plus-v1.3.20/src/locale/`
- `01-origin/source/view-ui-plus-v1.3.20/src/mixins/`
- `01-origin/source/view-ui-plus-v1.3.20/src/utils/`
- `01-origin/source/view-ui-plus-v1.3.20/src/styles/index.less`
- `01-origin/source/view-ui-plus-v1.3.20/src/styles/components/`
- `01-origin/source/view-ui-plus-v1.3.20/types/index.d.ts`
- `01-origin/source/view-ui-plus-v1.3.20/dist/`
- `01-origin/source/view-ui-plus-v1.3.20/vite.config.js`

## 非元件層也是架構主體

`src/components/` 是閱讀 View UI Plus 的主線，但成熟元件庫不只由元件組成。除了元件實作，View UI Plus 還有多個支撐層：

| 區域 | 責任 |
| --- | --- |
| `src/directives/` | 自訂指令，例如尺寸、樣式、文字截斷與點擊外部。 |
| `src/locale/` | 語系切換與 i18n 整合入口。 |
| `src/mixins/` | 跨元件共用的 Options API 邏輯。 |
| `src/utils/` | DOM、日期、CSV、鍵盤碼、樣式檢查等工具函數。 |
| `src/styles/` | Less 樣式入口、變數、mixins、動畫與元件樣式。 |
| `types/` | 對外 TypeScript 型別宣告。 |
| `dist/` | 打包後提供給使用者消費的產物。 |

這些區域共同支撐元件庫的一致行為、視覺樣式、型別體驗與發布結果。閱讀單一元件時，只要看到它依賴這些區域，就應該把它視為跨元件架構設計，而不是局部細節。

## 共用能力層

共用能力層包含 `utils/`、`mixins/`、`directives/` 與 `locale/`。

| 區域 | 常見責任 |
| --- | --- |
| `utils/` | DOM 操作、日期處理、CSV、鍵盤碼、樣式檢查、transfer queue 等工具。 |
| `mixins/` | link、form、locale、emitter、globalConfig 等跨元件 Options API 邏輯。 |
| `directives/` | click outside、transfer dom、resize、style、line clamp 等指令能力。 |
| `locale/` | 語系資料、格式化與 i18n 整合。 |

共用層的價值是降低重複，並讓跨元件行為有穩定來源。例如彈層轉移、語系文字、表單關聯、路由跳轉、DOM 操作如果散落在每個元件裡，後續維護會很難追蹤。

這也影響閱讀方式：當某個元件引用 mixin 或 util 時，不應只看元件本檔。那個 mixin 或 util 可能才是多個元件共用行為的真正來源。

## 樣式系統

`src/styles/index.less` 是 View UI Plus 樣式入口。依 source，它透過 Less `@import` 串起：

- `custom`
- `base`
- `mixins/index`
- `common/index`
- `animation/index`
- `components/index`

這代表樣式系統和 JS 入口是分離的：`src/index.js` 負責 JS 匯出與安裝，`src/styles/index.less` 負責樣式入口與 Less 串接。

閱讀樣式時要關注：

1. class prefix 是否一致。
2. 狀態 class 是否和 props、data 或 computed 對應。
3. 變數和 mixins 是否被多個元件重用。
4. 動畫、浮層、尺寸是否有統一模式。
5. 元件樣式是否透過 `src/styles/components/` 集中管理。

這裡不能只從 `.vue` 檔判斷樣式。某個 props 對應的 class 可能在元件檔中生成，但真正的視覺效果在 Less 中。

## 型別入口

`types/index.d.ts` 是 TypeScript 使用者理解 View UI Plus 公開 API 的入口。它提供：

1. 元件型別匯出。
2. `install(app, options)` 型別。
3. 全域安裝 options 型別。
4. `ComponentCustomProperties` 擴充。
5. `$VIEWUI` 與多個全域服務屬性型別。

這說明成熟元件庫的 API 不只存在於 JavaScript runtime。對 TypeScript 使用者來說，型別宣告同樣是公開 API 的一部分。

分析全域服務時尤其要注意：`src/index.js` 掛載 `$Message`、`$Modal` 等 runtime 屬性；`types/index.d.ts` 則讓 TypeScript 知道這些屬性存在。這兩者要分開檢查，不能混為一談。

同時也要反向檢查型別是否漏掉 runtime 公開面。以目前 source 來看，`src/index.js` 匯出 `version`、`locale`、`i18n`、`lang` 與預設 API，但 `types/index.d.ts` 主要宣告元件、`install`、全域 options 與 `ComponentCustomProperties`。`$VIEWUI` runtime 內也有 `capture`，但 `ViewUIPlusGlobalOptions` 未列出這個 key。這些落差不一定影響所有使用方式，但足以提醒我們：d.ts 是要查證的公開表面，不是 runtime 完整性的自動保證。

## 建置產物

`dist/` 是發布產物，不是主要閱讀源碼，但它能幫助理解使用者最後消費到什麼。

從發布角度看，View UI Plus 的源碼會被整理成：

```txt
src/index.js
  -> dist/viewuiplus.min.js
  -> dist/viewuiplus.min.esm.js

src/styles/index.less
  -> dist/styles/viewuiplus.css

types/index.d.ts
  -> 使用者 TypeScript 型別入口
```

`package.json` 的 `main` 與 `typings` 也把使用者消費入口指向 `dist` 與 `types`。因此，雖然正式閱讀不應把 `dist/` 當成主要源碼，但它仍然是架構圖的一部分。

## Runtime / Type / 樣式 / Build 分工

這一篇的核心是把四個表面分清楚：

| 表面 | 代表檔案 | 不應混淆的地方 |
| --- | --- | --- |
| Runtime | `src/index.js`、`src/components/*`、`src/utils/`、`src/mixins/` | 實際安裝、渲染、事件、服務掛載與共用邏輯。 |
| Style | `src/styles/index.less`、`src/styles/components/` | 視覺狀態、Less 變數、mixins、動畫與 class 效果。 |
| Type | `types/index.d.ts`、`types/*.d.ts` | TypeScript 使用者看到的元件、全域屬性與 options。 |
| Build | `package.json`、`vite.config.js`、`dist/` | 打包流程、發布產物與使用者消費入口。 |

例如：

- runtime 掛了 `$Message`，不代表 type 自動有 `$Message`。
- type 有全域 options，不代表已覆蓋 `$VIEWUI` runtime 的每個 key。
- props 產生了某個狀態 class，不代表樣式一定已分析完整。
- `dist/` 有打包產物，不代表應直接把壓縮後程式碼當主要閱讀來源。
- d.ts 裡存在某個型別，不代表 runtime 行為一定和型別完全一致，仍要回源碼確認。

## 關鍵設計

View UI Plus 的非元件層展示了幾個架構重點：

1. 跨元件行為應該收斂到共用能力層，而不是分散在多個元件。
2. 樣式應該有統一入口，讓變數、mixins、動畫與元件樣式可以串起來。
3. 型別宣告應該補足使用者側開發體驗，尤其是全域服務與 install options，但仍要回查是否漏掉 runtime 公開面。
4. 建置產物不是主要閱讀源碼，但它是發布與消費路徑的一部分。
5. 分析元件庫時要明確標示每個結論來自 runtime、style、type 還是 build。

## 設計啟發

如果要設計自己的元件庫，除了寫元件本身，還要回答：

1. 共用工具、mixins、composables 或 directives 應該放在哪裡。
2. 樣式是否有統一入口，狀態 class 是否有命名規則。
3. 全域配置與全域服務是否需要 TypeScript 型別。
4. 打包後的 JS、CSS 與型別使用者如何消費。
5. source、types、styles、dist 之間是否有清楚對應。

新增跨元件能力時，不要先急著塞進某個元件。應該先判斷它屬於元件實作、共用能力、樣式、型別還是建置表面。

## 複習題

1. 為什麼樣式入口不能只從單一 `.vue` 檔理解？
2. `utils/`、`mixins/`、`directives/` 和 `locale/` 各自降低了哪些重複？
3. `types/index.d.ts` 如何補足 runtime API？
4. `dist/` 為什麼不是主要閱讀源碼，但仍然有架構價值？
5. 如果新增一個跨元件能力，你會如何判斷它應該放在哪一層？
