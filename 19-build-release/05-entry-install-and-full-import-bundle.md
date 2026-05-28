# 入口、install 與全量匯入 bundle

## 學習目標

這篇從 `src/index.js` 追蹤 View UI Plus 的主入口。重點是看 build entry 如何把元件、指令、全域服務、locale 與版本資訊組成對外 API。讀完後，要能說明「全量匯入」和「命名匯出」在這個 package 中各自代表什麼。

## 對照源碼

- `01-origin/source/view-ui-plus-v1.3.20/src/index.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/index.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/directives/`
- `01-origin/source/view-ui-plus-v1.3.20/src/locale/index.js`
- `01-origin/source/view-ui-plus-v1.3.20/package.json`

## build entry 的角色

Vite library build 的入口是 `src/index.js`。這個檔案做了幾件重要的事：

- `export * from './components'`，把所有元件作為 named exports 暴露出去。
- `import * as components from './components'`，取得一份元件集合供 `install()` 註冊。
- 匯入 locale 模組，提供 `locale`、`i18n`、`lang`。
- 匯入 directives，安裝全域指令。
- 匯入 `package.json`，輸出 `version`。
- 建立 default export `API`，包含 `install`、locale API 與所有 components。

這就是為什麼 `src/index.js` 是整個 bundle 的 API 邊界。只要這裡匯出或安裝的內容改變，使用者能 import 或 `app.use()` 的能力就會改變。

## install 的流程

`install(app, opts = {})` 是 Vue plugin 的核心。流程可以拆成五段：

1. 用 `install.installed` 避免重複安裝。
2. 如果傳入 `opts.locale` 或 `opts.i18n`，先設定 locale 系統。
3. 遍歷 `ViewUI`，呼叫 `app.component(key, ViewUI[key])` 全域註冊元件。
4. 遍歷 directives，呼叫 `app.directive(key, directives[key])` 全域註冊指令。
5. 在 `app.config.globalProperties` 上掛載 `$VIEWUI`、`$Message`、`$Modal`、`$Date` 等全域能力。

這代表全量匯入的主要使用方式是：

```js
import ViewUIPlus from 'view-ui-plus'
import 'view-ui-plus/dist/styles/viewuiplus.css'

app.use(ViewUIPlus)
```

JS 插件和 CSS 引入是兩件事。`install()` 註冊元件與服務，但不會自動載入 `dist/styles/viewuiplus.css`。

## ViewUI 元件集合

`src/index.js` 先把 `components` 展開，再補上一些 `i` 開頭的別名：

```js
const ViewUI = {
    ...components,
    iButton: components.Button,
    iCircle: components.Circle,
    iInput: components.Input,
    iSelect: components.Select
}
```

這保留了歷史使用習慣。使用者可以使用 `Button`，也可能依賴 `iButton` 這種別名。對元件庫來說，這些名稱一旦被全域註冊，就成為公開 API。

## 命名匯出與按需使用

`src/components/index.js` 中有大量 named exports，例如：

```js
export { default as Button } from './button';
export { default as Select } from './select';
export { default as Table } from './table';
```

因此使用者可以寫：

```js
import { Button, Select } from 'view-ui-plus'
```

但這不等於 package 已經產生完整的 per-component build 產物。v1.3.20 的 build script 沒有輸出 `es/button` 或 `lib/button` 這類目錄。要評估 tree-shaking 與按需效果，還要看 package metadata、bundle format、side effects 與使用者 bundler 行為。

## 全域服務的發布契約

`install()` 會掛載：

- `$Spin`
- `$Loading`
- `$Message`
- `$Notice`
- `$Modal`
- `$ImagePreview`
- `$Copy`
- `$ScrollIntoView`
- `$ScrollTop`
- `$Date`

這些不是普通元件匯出而已，而是 Vue app instance 上的全域屬性。它們需要同步反映在 `types/index.d.ts` 的 `ComponentCustomProperties` module augmentation，否則 TypeScript 使用者會拿不到正確提示。

## 設計啟發

主入口要同時服務三種使用者：

- 想一次安裝全部元件的使用者。
- 想命名匯入部分元件的使用者。
- 想使用 `$Message`、`$Modal`、locale 等全域能力的使用者。

因此 entry 設計不能只考慮 bundle 輸出，也要考慮 TypeScript、樣式引入、文件示例和舊 API 相容性。

## 複習題

1. 為什麼 `src/index.js` 是 View UI Plus bundle 的 API 邊界？
2. `install()` 做了哪幾類註冊？
3. 為什麼引入 JS 插件不等於已經引入 CSS？
4. `iButton` 這類別名對發布相容性有什麼意義？
5. named exports 和完整 per-component 產物有什麼差異？
