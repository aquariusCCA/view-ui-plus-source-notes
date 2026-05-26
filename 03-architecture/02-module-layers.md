# 模組分層分析

## 學習目標

這篇筆記把 View UI Plus 拆成幾個架構層次。理解分層後，閱讀源碼時就能判斷目前看到的是公開入口、元件實作、共用邏輯、樣式、型別，還是建置產物。

## 源碼位置

主要閱讀：

- `01-origin/source/view-ui-plus-v1.3.20/src/index.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/index.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/`
- `01-origin/source/view-ui-plus-v1.3.20/src/directives/`
- `01-origin/source/view-ui-plus-v1.3.20/src/styles/index.less`
- `01-origin/source/view-ui-plus-v1.3.20/types/index.d.ts`
- `01-origin/source/view-ui-plus-v1.3.20/vite.config.js`

## 核心概念

View UI Plus 可以用六層來理解：

| 分層 | 代表檔案 | 責任 |
| --- | --- | --- |
| 入口層 | `src/index.js` | 定義套件對外入口、安裝函數、全域 API。 |
| 元件匯出層 | `src/components/index.js` | 將所有元件統一命名匯出。 |
| 元件實作層 | `src/components/*` | 實作畫面、互動、狀態、事件與命令式服務。 |
| 共用能力層 | `src/utils/`、`src/mixins/`、`src/directives/`、`src/locale/` | 提供跨元件共用邏輯。 |
| 樣式層 | `src/styles/`、`dist/styles/` | 管理 Less 原始樣式與打包後 CSS。 |
| 型別與產物層 | `types/`、`dist/`、`vite.config.js` | 提供使用者側型別與可發布產物。 |

## 分層關係

從使用者角度看，最外層是套件入口：

```txt
使用者
  -> import ViewUIPlus from 'view-ui-plus'
  -> src/index.js
  -> src/components/index.js
  -> src/components/*/index.js
  -> src/components/*/*.vue 或 *.js
```

從開發者角度看，元件實作會往下依賴共用能力：

```txt
components
  -> utils / mixins / directives / locale
  -> styles
```

從發布角度看，建置流程把源碼整理成使用者可消費的 JS、CSS 與型別：

```txt
src/index.js
  -> dist/viewuiplus.min.js
  -> dist/viewuiplus.min.esm.js

src/styles/index.less
  -> dist/styles/viewuiplus.css

types/index.d.ts
  -> 使用者 TypeScript 型別入口
```

## 設計重點

### 入口層控制公開表面

`src/index.js` 決定使用者能拿到哪些能力。它不只轉出元件，也提供：

- `install`
- `version`
- `locale`
- `i18n`
- `lang`
- 預設匯出的 `API`

這表示入口層是元件庫的公開門面。

### 元件匯出層維護元件清單

`src/components/index.js` 是公開元件列表。它讓 `src/index.js` 可以用 `import * as components from './components'` 取得所有元件，再交給 `install` 做批次註冊。

### 元件實作層包含兩種型態

`src/components/` 裡不只存在視覺元件，也存在命令式服務。

- 視覺元件：`button`、`input`、`table`、`modal`。
- 命令式服務：`message`、`notice`、`loading-bar`、`image-preview`。
- 內部基礎能力：`base/notification`、`base/popper`、`base/render`。

這提醒我們閱讀元件時，要先判斷它是「模板渲染型元件」還是「JS 建立實例的服務」。

### 共用能力層降低重複

`utils/`、`mixins/`、`directives/`、`locale/` 讓多個元件可以共用能力。例如 DOM 操作、日期處理、語系文字、彈層轉移、尺寸監聽等，不需要散落在每個元件中。

### 樣式層獨立串接

`src/styles/index.less` 是樣式入口，透過 `@import` 串起：

- `custom`
- `base`
- `mixins/index`
- `common/index`
- `animation/index`
- `components/index`

這讓樣式系統和 JS 元件入口保持分離，但又能在發布時一起提供給使用者。

## 設計啟發

元件庫的分層目標不是把檔案分得越細越好，而是讓每層責任可預期：

- 入口層處理公開 API。
- 元件層處理使用者直接接觸的功能。
- 共用層處理跨元件可重用能力。
- 樣式層處理視覺一致性。
- 型別與建置層處理使用者消費體驗。

當你閱讀某個檔案時，先問：「這個檔案屬於哪一層？」答案會直接影響你的閱讀方式。

## 檢查問題

1. `src/index.js` 為什麼不能只做 `export * from './components'`？
2. `src/components/index.js` 為什麼適合集中維護公開元件清單？
3. `message` 這類命令式服務和 `button` 這類元件在架構位置上有什麼不同？
4. 樣式入口和 JS 入口為什麼分開？
5. `types/index.d.ts` 屬於哪一層？它服務的是內部開發者還是使用者？
