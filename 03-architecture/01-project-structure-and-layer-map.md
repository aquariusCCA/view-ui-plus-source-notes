# 專案結構與架構分層地圖

## 學習目標

這篇筆記用 View UI Plus v1.3.20 建立一張工程地圖：先知道每個目錄負責哪一層，再判斷閱讀某個檔案時應該追公開入口、元件實作、共用能力、樣式、型別還是建置產物。

讀完後，你應該能從 `package.json` 追到 `src/index.js`、`src/components/index.js`、單一元件入口、Less 入口、型別入口與 `dist/` 產物，並用這張地圖檢查新增元件或 review 元件庫 PR 時是否漏掉必要表面。

## 對照源碼

- `03-architecture/atomic/01-project-structure-overview.md`
- `03-architecture/atomic/02-module-layer-boundaries.md`
- `03-architecture/origin/01-project-structure.md`
- `03-architecture/origin/02-module-layers.md`
- `03-architecture/origin/08-architecture-summary.md`
- `01-origin/source/view-ui-plus-v1.3.20/package.json`
- `01-origin/source/view-ui-plus-v1.3.20/src/index.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/index.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/styles/index.less`
- `01-origin/source/view-ui-plus-v1.3.20/types/index.d.ts`
- `01-origin/source/view-ui-plus-v1.3.20/vite.config.js`

## 專案責任分區

View UI Plus 不是一批孤立的 `.vue` 檔，而是由多個面向共同形成的元件庫。根據 atomic 與 origin 的整理，專案可以先分成五個主要區域。

| 區域 | 主要責任 |
| --- | --- |
| `src/` | 元件庫開發原始碼，是源碼閱讀主線。 |
| `types/` | 對外提供 TypeScript 型別宣告。 |
| `dist/` | 打包後給使用者消費的 JS、CSS 與語系產物。 |
| `examples/` | 元件展示與開發時的使用範例。 |
| `test/` | 單元測試與測試設定。 |

`src/` 是最重要的閱讀入口，但它不只放元件。它同時包含套件入口、元件、指令、語系、樣式、mixins 與工具函數。

| `src/` 內部表面 | 責任 |
| --- | --- |
| `src/index.js` | 套件總入口，負責匯出、Vue plugin install、全域配置與全域服務掛載。 |
| `src/components/` | 所有元件、複合元件與命令式服務的主要實作。 |
| `src/components/index.js` | 公開元件集中匯出清單。 |
| `src/directives/` | 全域可註冊的自訂指令。 |
| `src/locale/` | 語系切換與 i18n 整合入口。 |
| `src/mixins/` | 跨元件共用的 Options API 邏輯。 |
| `src/styles/` | Less 樣式入口、變數、mixins、動畫與元件樣式。 |
| `src/utils/` | DOM、日期、CSV、鍵盤碼、樣式檢查等工具函數。 |

## 六層架構

把目錄責任再往架構層次收斂，可以得到六層：

| 分層 | 代表檔案 | 責任 |
| --- | --- | --- |
| 入口層 | `src/index.js` | 定義套件對外入口、安裝函數、全域 API。 |
| 元件匯出層 | `src/components/index.js` | 將公開元件統一命名匯出。 |
| 元件實作層 | `src/components/*` | 實作畫面、互動、狀態、事件與命令式服務。 |
| 共用能力層 | `src/utils/`、`src/mixins/`、`src/directives/`、`src/locale/` | 提供跨元件共用能力。 |
| 樣式層 | `src/styles/`、`dist/styles/` | 管理 Less 原始樣式與打包後 CSS。 |
| 型別與產物層 | `types/`、`dist/`、`vite.config.js` | 提供使用者側型別與可發布產物。 |

這個分層的價值不是把檔案分類而已，而是讓閱讀方式可預期。看到 `src/index.js` 時要問公開 API 和 install；看到 `src/components/index.js` 時要問哪些元件被公開；看到 `types/index.d.ts` 時要問 TypeScript 使用者能看到哪些 API。

## 從使用者入口到內部實作

從使用者角度看，最外層是套件消費入口：

```txt
使用者
  -> import ViewUIPlus from 'view-ui-plus'
  -> package.json main / typings
  -> dist/viewuiplus.min.js
  -> types/index.d.ts
```

從原始碼角度追完整包元件入口：

```txt
src/index.js
  -> export * from './components'
  -> import * as components from './components'
  -> src/components/index.js
  -> src/components/*/index.js
  -> src/components/*/*.vue 或 *.js
```

從開發者角度看，元件實作會往下依賴共用能力與樣式：

```txt
src/components/*
  -> src/utils / src/mixins / src/directives / src/locale
  -> src/styles/index.less
```

從發布角度看，建置流程把源碼整理成使用者可消費的產物：

```txt
src/index.js
  -> dist/viewuiplus.min.js
  -> dist/viewuiplus.min.esm.js

src/styles/index.less
  -> dist/styles/viewuiplus.css

types/index.d.ts
  -> 使用者 TypeScript 型別入口
```

## 來源明確支持

- `package.json` 明確宣告 `main` 為 `dist/viewuiplus.min.js`，`typings` 為 `types/index.d.ts`，`files` 包含 `dist`、`src`、`types`。
- `src/index.js` 明確同時做 `export * from './components'`、`import * as components from './components'`、`install(app, opts)`、directives 註冊與 `app.config.globalProperties` 掛載。
- `src/components/index.js` 明確集中匯出公開元件，例如 `Button`、`Input`、`Table`、`Modal`、`Message`。
- `src/styles/index.less` 明確串起 `custom`、`base`、`mixins/index`、`common/index`、`animation/index`、`components/index`。
- `vite.config.js` 明確以 `src/index.js` 作為 library entry，輸出 `viewuiplus.min.js` 與 `viewuiplus.min.esm.js`。

## 根據來源推論

- 將 View UI Plus 拆成六層是 atomic / origin 基於目錄責任與入口關係做出的架構讀法，不是原始碼中存在的正式分層 API。
- `src/components/index.js` 可視為公開元件清單，是因為它被 `src/index.js` 批次匯出與批次註冊使用；這是根據入口關係做出的設計判斷。
- `dist/` 不適合作為主要閱讀源碼，但能檢查使用者最終消費結果；這是根據發布產物位置與 `package.json` 指向做出的閱讀策略。

## Runtime / Type / 樣式 / 建置表面

View UI Plus 的架構不能只看 runtime。

| 表面 | 代表檔案 | 要檢查的問題 |
| --- | --- | --- |
| Runtime | `src/index.js`、`src/components/*` | 使用者如何引入、註冊、呼叫服務。 |
| Type | `types/index.d.ts`、`types/*.d.ts` | 使用者側是否有元件、install options、全域服務型別。 |
| Style | `src/styles/index.less`、`src/styles/components/` | class、狀態、變數、動畫是否經過統一入口。 |
| Build | `package.json`、`vite.config.js`、`build/build-style.js`、`dist/` | JS、CSS、語系與型別如何被發布。 |

目前來源未找到 `dist/package.json`。因此正式筆記不能把 `dist/package.json` 寫成已存在的消費面；只能說根層 `package.json` 指向 `dist` JS 與 `types` 入口，CSS 由 `build/build-style.js` 產出到 `dist/styles/viewuiplus.css`。

## 設計啟發

如果要設計自己的 Vue 元件庫，專案結構至少要回答四個問題：

- 使用者從哪個入口引入 runtime 與型別。
- 內部元件如何集中管理與對外匯出。
- JS、CSS、型別、語系、指令、全域服務是否有清楚邊界。
- 打包產物是否能對應到使用者實際消費方式。

View UI Plus 的結構不是最小化範例，而是一套成熟元件庫的工程結構。它讓單一元件可以逐步增加功能，也保留集中安裝、統一樣式、全域服務與型別支援。

## 實戰使用場景

- 新增元件時，先確認它要出現在 `src/components/`、`src/components/index.js`、`types/`、`src/styles/components/`、`examples/` 或 `test/` 哪些表面。
- Review 元件庫 PR 時，不只看 `.vue` 是否正確，也要檢查入口匯出、型別宣告、樣式入口與建置產物是否一致。
- 排查使用者側「runtime 可用但型別缺失」時，優先比對 `src/index.js` 與 `types/index.d.ts`。

## 實作檢查任務

1. 打開 `package.json`，確認 `main`、`typings`、`files` 與 build scripts 指向哪些消費表面。
2. 打開 `src/index.js`，列出它除了匯出元件以外還負責哪些全域能力。
3. 打開 `src/components/index.js`，確認任一元件是否被納入公開清單。
4. 打開 `src/styles/index.less`，確認元件樣式是否經過統一入口。
5. 打開 `types/index.d.ts`，確認全域服務是否有 `ComponentCustomProperties` 型別擴充。

## 複習題

1. `src/index.js` 和 `src/components/index.js` 的責任差異是什麼？
2. 為什麼元件庫需要同時有 `src/`、`types/` 與 `dist/`？
3. `src/styles/index.less` 在架構中扮演什麼角色？
4. `types/index.d.ts` 服務的是內部開發者還是使用者側開發體驗？
5. 為什麼不能只從單一 `.vue` 檔理解一套元件庫？
