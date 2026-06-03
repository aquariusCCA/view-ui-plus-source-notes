# 專案結構與分層地圖

## 學習目標

這篇筆記先建立 View UI Plus 的工程骨架。閱讀元件庫時，不應該一開始就跳進某個 `.vue` 檔，而要先知道每個目錄在整套元件庫中負責哪一層工作。

讀完後，你應該能回答三個問題：

1. View UI Plus 的主要目錄分別服務什麼責任。
2. `src/index.js`、`src/components/index.js`、`src/styles/index.less`、`types/index.d.ts` 分別位於哪一層。
3. 之後閱讀單一元件時，應該如何把元件實作放回入口、樣式、型別與建置產物的脈絡中。

## 來源與對照

主要 atomic：

- `03-architecture/atomic/01-project-structure-overview.md`
- `03-architecture/atomic/02-module-layer-boundaries.md`

origin 對照：

- `03-architecture/origin/01-project-structure.md`
- `03-architecture/origin/02-module-layers.md`
- `03-architecture/origin/08-architecture-summary.md`

對照源碼：

- `01-origin/source/view-ui-plus-v1.3.20/package.json`
- `01-origin/source/view-ui-plus-v1.3.20/src/`
- `01-origin/source/view-ui-plus-v1.3.20/src/index.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/index.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/styles/index.less`
- `01-origin/source/view-ui-plus-v1.3.20/types/index.d.ts`
- `01-origin/source/view-ui-plus-v1.3.20/dist/`
- `01-origin/source/view-ui-plus-v1.3.20/vite.config.js`

## 專案責任分區

View UI Plus 是一套 Vue 3 元件庫，它不是由一批孤立元件組成，而是由原始碼、型別、樣式、範例、測試與打包產物共同組成。

| 區域 | 主要責任 | 閱讀定位 |
| --- | --- | --- |
| `src/` | 元件庫開發原始碼 | 主要閱讀主線 |
| `types/` | 對外 TypeScript 型別宣告 | 使用者側型別入口 |
| `dist/` | 打包後 JS、CSS、locale 產物 | 發布與消費結果 |
| `examples/` | 元件展示與開發時範例 | 使用方式對照 |
| `test/` | 單元測試與測試設定 | 行為保護對照 |

其中 `src/` 是閱讀重心，但 `src/` 本身也不是單一層。它同時包含入口、元件、指令、語系、樣式、共用 mixins 與工具函數。

| `src/` 目錄或檔案 | 責任 |
| --- | --- |
| `src/index.js` | 套件總入口，處理匯出、安裝、全域配置與全域服務掛載。 |
| `src/components/` | 所有元件、命令式服務與部分內部基礎能力的主要實作區。 |
| `src/components/index.js` | 公開元件集中匯出清單。 |
| `src/directives/` | 自訂指令，例如尺寸、樣式、文字截斷與點擊外部。 |
| `src/locale/` | 語系切換與 i18n 整合入口。 |
| `src/mixins/` | 跨元件共用的 Options API 邏輯。 |
| `src/styles/` | Less 樣式入口、變數、mixins、動畫與元件樣式。 |
| `src/utils/` | DOM、日期、CSV、鍵盤碼、樣式檢查等工具函數。 |

這個分區帶出的第一個結論是：閱讀元件庫不能只讀 `.vue`。一個元件最後能被使用者安裝、引入、顯示樣式、取得型別提示，背後需要多個目錄一起支撐。

## 六層架構

從架構角度看，View UI Plus 可以拆成六層：

| 分層 | 代表檔案 | 責任 |
| --- | --- | --- |
| 入口層 | `src/index.js` | 定義套件對外入口、安裝函數、全域 API。 |
| 元件匯出層 | `src/components/index.js` | 將所有公開元件統一命名匯出。 |
| 元件實作層 | `src/components/*` | 實作畫面、互動、狀態、事件與命令式服務。 |
| 共用能力層 | `src/utils/`、`src/mixins/`、`src/directives/`、`src/locale/` | 提供跨元件共用邏輯。 |
| 樣式層 | `src/styles/`、`dist/styles/` | 管理 Less 原始樣式與打包後 CSS。 |
| 型別與產物層 | `types/`、`dist/`、`vite.config.js` | 提供使用者側型別與可發布產物。 |

這六層不是為了把目錄切得更細，而是為了讓責任可預期。看到一個檔案時，先判斷它屬於哪一層，再決定閱讀方式。

## 三種視角的架構路徑

從套件消費角度看，使用者先碰到的是 `package.json` 指向的發布入口，而不是直接讀到原始碼入口：

```txt
使用者
  -> import ViewUIPlus from 'view-ui-plus'
  -> package.json
     -> main: dist/viewuiplus.min.js
     -> typings: types/index.d.ts
```

如果目標是閱讀原始碼或理解建置流程，才從 source entry 往內追：

```txt
vite.config.js
  -> build.lib.entry: src/index.js

src/index.js
  -> src/components/index.js
  -> src/components/*/index.js
  -> src/components/*/*.vue 或 *.js
```

從元件庫內部開發者的角度看，元件實作會往下依賴共用能力：

```txt
src/components/*
  -> src/utils/
  -> src/mixins/
  -> src/directives/
  -> src/locale/
  -> src/styles/
```

從發布角度看，源碼最後會變成使用者可消費的 JS、CSS 與型別：

```txt
src/index.js
  -> dist/viewuiplus.min.js
  -> dist/viewuiplus.min.esm.js

src/styles/index.less
  -> dist/styles/viewuiplus.css

types/index.d.ts
  -> 使用者 TypeScript 型別入口
```

## 分層閱讀方式

入口層要看公開表面。`src/index.js` 不只轉出元件，也提供 `install`、`version`、`locale`、`i18n`、`lang` 與預設匯出的 API 物件。它是使用者接觸整套元件庫的主要門面。

元件匯出層要看公開清單。`src/components/index.js` 讓 `src/index.js` 可以集中取得所有元件，再交給 `install` 批次註冊。對元件庫來說，公開匯出清單不是普通內部細節，而是使用者可能依賴的 API 契約。

元件實作層要先判斷型態。`src/components/` 中同時存在普通視覺元件、複合元件、命令式服務與內部基礎能力。它們都在 components 目錄下，但閱讀重點不同。

共用能力層要看重用邏輯。`utils/`、`mixins/`、`directives/`、`locale/` 讓 DOM 操作、日期處理、語系文字、彈層轉移、尺寸監聽等能力不必散落在每個元件中。

樣式層要從入口讀起。`src/styles/index.less` 透過 Less `@import` 串起 `custom`、`base`、`mixins/index`、`common/index`、`animation/index` 與 `components/index`，說明 View UI Plus 的樣式不是每個元件各自孤立維護。

型別與產物層要從使用者側思考。`types/index.d.ts` 對應 TypeScript 使用者看到的 API，`dist/` 對應套件發布後的消費結果。它們不是單一元件內部邏輯，但會影響使用者如何安裝、引入與取得補全。

## Runtime / Type / 樣式 / 建置表面

這一章的重點不是深入某個 runtime 細節，而是先把不同表面分清楚：

| 表面 | 代表來源 | 閱讀重點 |
| --- | --- | --- |
| Runtime | `src/index.js`、`src/components/*` | 安裝、註冊、渲染、事件、服務掛載。 |
| Type | `types/index.d.ts`、`types/*.d.ts` | 使用者側型別、全域屬性、元件型別。 |
| Style | `src/styles/index.less`、`src/styles/components/` | 樣式入口、狀態 class、變數、動畫。 |
| Build | `package.json`、`vite.config.js`、`dist/` | 入口欄位、打包腳本、發布產物。 |

如果把這些表面混在一起，後續閱讀元件時容易誤判。例如 runtime 有全域服務掛載，不代表 TypeScript 自動知道這些屬性；樣式有狀態 class，也不等於 props 一定存在同名欄位。正式筆記後續分析單一元件時，應該明確標示每個結論來自哪一個表面。

## 關鍵設計

View UI Plus 的架構重點是用清楚的入口與分層，把一套元件庫拆成可閱讀、可維護、可發布的系統。

1. 使用者入口集中到 `package.json`、`src/index.js` 與 `types/index.d.ts`。
2. 公開元件清單集中到 `src/components/index.js`。
3. 單一元件可以在 `src/components/*` 中按複雜度逐步拆分。
4. 共用能力不必重複塞進每個元件，而是放在 `utils`、`mixins`、`directives`、`locale`。
5. 樣式入口與 JS 入口分離，但發布時共同支撐使用者體驗。
6. 型別與打包產物屬於使用者消費體驗的一部分，不應被視為附屬文件。

## 設計啟發

如果要設計自己的 Vue 元件庫，目錄結構至少要回答以下問題：

1. 使用者從哪個入口引入。
2. 公開元件如何集中管理與匯出。
3. 單一元件如何在內部逐步拆分。
4. 共用工具、mixins、directives、locale 放在哪裡。
5. 樣式是否有統一入口。
6. TypeScript 使用者如何取得安裝、元件與全域服務型別。
7. 打包後的 JS、CSS 與型別如何被使用者消費。

這些問題比「每個資料夾叫什麼名字」更重要。View UI Plus 的目錄不是最小化範例，而是一套成熟元件庫為了入口穩定、樣式一致、型別可見與發布可用所形成的工程結構。

## 複習題

1. `src/index.js` 和 `src/components/index.js` 的責任差異是什麼？
2. 為什麼閱讀 View UI Plus 不能只看 `src/components/`？
3. `types/index.d.ts` 為什麼屬於架構分析的一部分？
4. `src/styles/index.less` 和單一元件 `.vue` 內的 class 有什麼關係？
5. 如果新增一個元件，至少需要檢查哪些入口、樣式、型別與範例位置？
