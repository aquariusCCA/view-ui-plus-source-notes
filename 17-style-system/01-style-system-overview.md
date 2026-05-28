# 樣式系統總覽

## 學習目標

這篇建立 View UI Plus 樣式系統的閱讀框架。重點不是背每個 CSS 宣告，而是看一套元件庫如何把設計規則拆成入口、變數、mixins、全域樣式、動畫、元件樣式與最終打包產物。

讀完後，要能從 `src/styles/index.less` 追到某個元件的 class，也要能反向從畫面上的 `ivu-btn-primary` 推回它依賴哪些 token 和 mixin。

## 對照源碼

- `01-origin/source/view-ui-plus-v1.3.20/src/styles/index.less`
- `01-origin/source/view-ui-plus-v1.3.20/src/styles/custom.less`
- `01-origin/source/view-ui-plus-v1.3.20/src/styles/base.less`
- `01-origin/source/view-ui-plus-v1.3.20/src/styles/common/`
- `01-origin/source/view-ui-plus-v1.3.20/src/styles/mixins/`
- `01-origin/source/view-ui-plus-v1.3.20/src/styles/animation/`
- `01-origin/source/view-ui-plus-v1.3.20/src/styles/components/`
- `01-origin/source/view-ui-plus-v1.3.20/build/build-style.js`

## 樣式系統解決什麼問題

元件庫的樣式不是零散 CSS，而是一套規則集合。它至少要處理：

- 視覺一致性：顏色、字級、間距、圓角、陰影、z-index 要有共同來源。
- 元件隔離：Button、Input、Modal、Table 需要穩定 class，不應互相污染。
- 狀態表達：hover、active、disabled、loading、error、selected 都要有可預期樣式。
- 可客製性：使用者可以改主色、覆蓋變數或用企業 CSS 做二次封裝。
- 可打包性：開發期 Less 最終要輸出成可直接引入的 CSS 與字型資源。

View UI Plus 透過 Less 變數與 mixins 達成前兩層，再透過元件 class 與 build script 輸出給使用者。

## 目錄分工

| 目錄或檔案 | 責任 |
| --- | --- |
| `custom.less` | 設計 token 與元件級變數，例如主色、字級、斷點、z-index |
| `base.less` | 全域工具 class，例如 display、文字對齊、margin、padding、line clamp |
| `common/` | normalize、基礎樣式、layout、article、iconfont |
| `color/` | 色盤生成、tinycolor、Bezier easing、預設色階 |
| `mixins/` | 可復用樣式邏輯，例如 button、input、mask、tooltip、size |
| `animation/` | 動畫 mixin、fade、move、slide、loop、transition class |
| `components/` | 每個元件的實際 class 與狀態樣式 |
| `dist/styles/` | 編譯後給使用者引入的 CSS 與 fonts |

這個分工可以用一句話概括：`custom.less` 給值，`mixins/` 給模式，`components/` 給落地 class。

## Less 而不是 SCSS

這個版本的 View UI Plus 使用 Less。筆記中會偶爾提到 SCSS 或 design token，但那是概念對照，不是源碼事實。

Less 在這裡有幾個關鍵能力：

- 變數：`@primary-color`、`@font-size-base`、`@zindex-modal`
- 字串插值：`@{css-prefix}` 組出 `ivu-` class
- mixin：`.btn()`、`.input()`、`.mask()`
- 函式與色彩操作：`tint()`、`shade()`、`fade()`、`colorPalette()`
- 編譯期 JavaScript：色盤生成依賴 Less 的 `javascriptEnabled: true`

閱讀樣式時要記得：這些能力都發生在編譯期。使用者執行瀏覽器頁面時看到的是普通 CSS。

## 追蹤一個 Button 樣式

以 Button 為例，追蹤路徑大致是：

1. `index.less` 匯入 `custom.less`，取得 `@css-prefix`、`@primary-color`、`@btn-height-base`。
2. `index.less` 匯入 `mixins/index.less`，間接載入 `mixins/button.less`。
3. `components/index.less` 匯入 `components/button.less`。
4. `button.less` 宣告 `@btn-prefix-cls: ~"@{css-prefix}btn"`。
5. `.@{btn-prefix-cls}` 產出 `.ivu-btn`，並套用 `.btn`、`.btn-default` 等 mixin。
6. `&-primary`、`&-loading`、`&-group` 產出狀態與組合 class。

這條路徑說明 View UI Plus 的樣式不是從元件檔內單獨長出來，而是接在全域 token 和 mixin 系統上。

## 設計啟發

如果要仿寫元件庫樣式系統，先不要急著寫每個元件的 CSS。應該先建立這幾個層次：

- token 層：設計值的共同來源。
- mixin 層：可重複的行為與樣式模式。
- component 層：穩定 class 與狀態 class。
- build 層：把開發用 Less 轉成使用者可引入的 CSS。

少了 token，樣式會失去一致性。少了 mixin，元件之間會大量複製。少了穩定 class，使用者無法可靠覆蓋。少了 build，樣式系統就只是內部原始碼，不是可交付能力。

## 複習題

1. View UI Plus 樣式系統的入口檔是哪一個？
2. `custom.less`、`mixins/`、`components/` 分別解決什麼問題？
3. 為什麼說 Less 變數可以視為早期 design token？
4. 從 `.ivu-btn-primary` 反推到 token，大致會經過哪些檔案？
5. 如果企業專案想統一改主色，為什麼不應該先從覆蓋 `.ivu-btn-primary` 開始？
