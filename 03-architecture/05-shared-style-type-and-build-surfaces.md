# 共用能力、樣式、型別與建置表面

## 學習目標

這篇筆記整理 View UI Plus 中不直接等同於單一元件、但支撐整套元件庫的非元件表面：共用能力、Less 樣式系統、TypeScript 型別入口與打包產物。

讀完後，你應該能判斷一個問題應該回到 `.vue`、utils/mixins/directives/locale、Less、types 還是 build/dist 檢查，而不是把所有行為都當成單一元件內部細節。

## 對照源碼

- `03-architecture/atomic/06-shared-style-type-build-surfaces.md`
- `03-architecture/origin/01-project-structure.md`
- `03-architecture/origin/02-module-layers.md`
- `03-architecture/origin/07-core-design-principles.md`
- `03-architecture/origin/08-architecture-summary.md`
- `01-origin/source/view-ui-plus-v1.3.20/src/utils/`
- `01-origin/source/view-ui-plus-v1.3.20/src/mixins/`
- `01-origin/source/view-ui-plus-v1.3.20/src/directives/`
- `01-origin/source/view-ui-plus-v1.3.20/src/locale/`
- `01-origin/source/view-ui-plus-v1.3.20/src/styles/index.less`
- `01-origin/source/view-ui-plus-v1.3.20/build/build-style.js`
- `01-origin/source/view-ui-plus-v1.3.20/types/index.d.ts`
- `01-origin/source/view-ui-plus-v1.3.20/dist/`

## 支撐元件庫的非元件層

`src/components/` 是閱讀主線，但成熟元件庫不只由元件組成。View UI Plus 還包含多個支撐表面。

| 區域 | 責任 |
| --- | --- |
| `src/directives/` | 自訂指令，例如尺寸、樣式、文字截斷與尺寸監聽。 |
| `src/locale/` | 語系切換與 i18n 整合入口。 |
| `src/mixins/` | 跨元件共用的 Options API 邏輯。 |
| `src/utils/` | DOM、日期、CSV、鍵盤碼、樣式檢查等工具函數。 |
| `src/styles/` | Less 樣式入口、變數、mixins、動畫與元件樣式。 |
| `types/` | 對外提供 TypeScript 型別宣告。 |
| `dist/` | 打包後提供給使用者消費的產物。 |

這些區域讓元件庫能維持一致行為、視覺、型別與發布體驗。閱讀元件時，如果看到元件依賴這些區域，應該把它視為跨元件架構設計，而不是只看成單一元件自己的程式碼。

## 共用能力層

`utils/`、`mixins/`、`directives/`、`locale/` 的價值在於降低跨元件重複。

| 表面 | 閱讀重點 |
| --- | --- |
| `utils/` | DOM 操作、日期處理、CSV、鍵盤碼、樣式判斷等是否被多個元件使用。 |
| `mixins/` | Options API 共用邏輯如何注入 props、computed、methods 或生命週期。 |
| `directives/` | 指令如何被 `src/index.js` 整理並透過 `app.directive` 全域註冊。 |
| `locale/` | 元件文字如何和語系切換、i18n 函數接上。 |

這些不是「雜物目錄」。當多個元件共享同一類行為時，把它抽到共用能力層，可以讓元件實作更聚焦，也讓後續 review 有固定查找位置。

## 樣式系統

`src/styles/index.less` 是樣式入口，明確透過 `@import` 串起：

```less
@import "./custom";
@import "./base";
@import "./mixins/index";
@import "./common/index";
@import "./animation/index";
@import "./components/index";
```

這代表樣式系統和 JS 元件入口是分離的。閱讀 `.vue` 檔時看到 class，不代表樣式定義就在同一個檔案內；通常要回到 `src/styles/components/` 或整體 Less 入口查對應規則。

樣式閱讀時要關注：

- class prefix 是否一致。
- 狀態 class 是否和 props、data、computed 對應。
- 變數與 mixins 是否被多個元件重用。
- 動畫、浮層、尺寸是否有統一模式。

## 型別體驗

`types/index.d.ts` 和各元件型別檔讓 TypeScript 使用者能取得：

- 元件型別。
- `install` options 型別。
- 全域服務屬性型別。
- `$VIEWUI` 全域配置型別。

這說明成熟元件庫的 API 不只存在於 JavaScript runtime，也存在於 TypeScript 型別層。入口設計、全域註冊和命令式服務都需要在型別層有對應宣告。

## 建置產物

`dist/` 不是主要閱讀源碼，但能幫助理解使用者最終消費結果。

從來源可確認的產物鏈路如下：

```txt
src/index.js
  -> vite.config.js
  -> dist/viewuiplus.min.js
  -> dist/viewuiplus.min.esm.js

src/styles/index.less
  -> build/build-style.js
  -> dist/styles/viewuiplus.css

types/index.d.ts
  -> package.json typings
  -> 使用者 TypeScript 型別入口
```

`build/build-style.js` 使用 `gulp-less`、`autoprefixer`、`cleanCSS`，將 `../src/styles/index.less` 編譯並輸出為 `../dist/styles/viewuiplus.css`，也會拷貝 iconfont 字型到 `dist/styles/fonts`。

## 來源明確支持

- `src/styles/index.less` 明確匯入 `custom`、`base`、`mixins/index`、`common/index`、`animation/index`、`components/index`。
- `build/build-style.js` 明確從 `../src/styles/index.less` 編譯 CSS，輸出 `viewuiplus.css` 到 `../dist/styles`，並拷貝字型檔。
- `types/index.d.ts` 明確匯出元件型別、宣告 install，並擴充 `ComponentCustomProperties`。
- `package.json` 明確有 `build:prod`、`build:style`、`build:lang`，且 `files` 包含 `dist`、`src`、`types`。
- `dist/` 內可見 `viewuiplus.min.js`、`viewuiplus.min.esm.js`，`dist/styles/` 內可見 `viewuiplus.css`。

## 根據來源推論

- 將 `utils/`、`mixins/`、`directives/`、`locale/` 合稱「共用能力層」，是 atomic / origin 基於目錄責任與跨元件用途做出的架構讀法。
- 將 `dist/` 視為消費結果檢查面，是根據 `package.json main`、build scripts 與實際產物位置做出的閱讀策略。
- 目前來源未找到 `dist/package.json`，因此它只能列為來源不足的疑點，不能寫成 View UI Plus 既有消費面。

## Runtime / Type / Style / Build 落差

| 落差類型 | 可能發生的情況 | 檢查檔案 |
| --- | --- | --- |
| Runtime 有能力，type 沒補 | `$Message` 可執行但 TS 沒提示 | `src/index.js`、`types/index.d.ts` |
| `.vue` 有狀態 class，style 沒對應 | class 出現在渲染中但樣式缺失 | `src/components/*/*.vue`、`src/styles/components/` |
| Less 有樣式，但 build 沒產出 | source 樣式存在但使用者消費不到 CSS | `src/styles/index.less`、`build/build-style.js`、`dist/styles/` |
| 元件依賴共用能力但未查 | 誤把跨元件邏輯當成本元件內部行為 | `src/utils/`、`src/mixins/`、`src/directives/`、`src/locale/` |

## 設計啟發

元件庫架構分析不能只看 `.vue`。如果要設計自己的元件庫，除了元件實作，也要回答：

- 共用工具和共用狀態邏輯要放在哪裡？
- 樣式是否有統一入口？
- 全域服務與全域配置是否有型別？
- 打包後的 JS 與 CSS 使用者如何消費？
- 內部共用能力和公開 API 是否有清楚邊界？

## 實戰使用場景

- 新增跨元件能力時，先判斷它屬於 utils、mixins、directives、locale、style 還是 type，不要直接複製到多個元件。
- 排查樣式不生效時，先從 class 回到 `src/styles/components/`，再確認 `src/styles/index.less` 與 `build/build-style.js`。
- 排查型別缺失時，檢查 runtime 入口後，必須比對 `types/index.d.ts` 和各元件型別檔。
- 做發布前 review 時，確認 JS、CSS、types 三個使用者消費面都有對應來源。

## 實作檢查任務

1. 打開 `src/styles/index.less`，列出它匯入的六個 Less 表面。
2. 打開 `build/build-style.js`，確認 CSS 與 fonts 會輸出到哪裡。
3. 在 `types/index.d.ts` 找出 `install`、`ViewUIPlusInstallOptions`、`ComponentCustomProperties`。
4. 選一個全域服務，從 `src/index.js` 查到 type 宣告。
5. 選一個元件 class，從 `.vue` 或 JS 實作追到 `src/styles/components/`。

## 複習題

1. 為什麼樣式入口不能只從單一 `.vue` 檔理解？
2. `utils/`、`mixins/`、`directives/`、`locale/` 各自降低哪些重複？
3. `types/index.d.ts` 如何補足 runtime API？
4. `dist/` 為什麼不是主要閱讀源碼，但仍然有架構價值？
5. 如果新增一個跨元件能力，應如何判斷它屬於元件實作、共用能力、樣式還是型別？
