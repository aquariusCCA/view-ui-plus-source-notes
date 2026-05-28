# Mixins 作為樣式抽象

## 學習目標

這篇分析 `src/styles/mixins/`。mixins 是 View UI Plus 樣式系統的抽象層，負責把重複出現的尺寸、狀態、排列、浮層、關閉按鈕、輸入框、按鈕等樣式模式集中管理。

讀完後，要能分辨哪些樣式應該做成 mixin，哪些應該留在元件樣式檔。

## 對照源碼

- `01-origin/source/view-ui-plus-v1.3.20/src/styles/mixins/index.less`
- `01-origin/source/view-ui-plus-v1.3.20/src/styles/mixins/button.less`
- `01-origin/source/view-ui-plus-v1.3.20/src/styles/mixins/input.less`
- `01-origin/source/view-ui-plus-v1.3.20/src/styles/mixins/mask.less`
- `01-origin/source/view-ui-plus-v1.3.20/src/styles/mixins/content.less`
- `01-origin/source/view-ui-plus-v1.3.20/src/styles/mixins/tooltip.less`
- `01-origin/source/view-ui-plus-v1.3.20/src/styles/mixins/size.less`
- `01-origin/source/view-ui-plus-v1.3.20/src/styles/components/button.less`
- `01-origin/source/view-ui-plus-v1.3.20/src/styles/components/input.less`

## mixin 的責任

mixin 適合封裝「多個 selector 都會用到的樣式邏輯」。它不是單純少打幾行 CSS，而是把設計模式命名化。

View UI Plus 的 mixins 可以分成幾類：

| 類型 | 代表檔案 | 解決問題 |
| --- | --- | --- |
| 控制項 | `button.less`、`input.less`、`checkbox.less` | 尺寸、hover、focus、disabled、error |
| 版面與尺寸 | `size.less`、`layout.less`、`clearfix.less` | 方形、尺寸、清除浮動、layout helper |
| 浮層 | `mask.less`、`content.less`、`tooltip.less` | 遮罩、header、close、tooltip arrow |
| 互動元件 | `select.less`、`caret.less`、`loading.less` | 下拉項、箭頭、載入狀態 |

這些樣式模式會被不同元件反覆使用。

## Button mixin

`mixins/button.less` 是最完整的範例。它把 Button 的抽象拆成：

- `.button-size()`：高度、padding、font-size、border-radius。
- `.button-color()`：文字、背景、邊框顏色。
- `.button-variant()`：hover、active、disabled 狀態。
- `.btn()`：Button 基礎結構。
- `.btn-default()`、`.btn-primary()`、`.btn-text()`：語意變體。
- `.btn-group()`、`.btn-group-vertical()`：群組排列。

`components/button.less` 則負責把這些 mixin 套到 `.ivu-btn`、`.ivu-btn-primary` 等 class。

這種設計讓 Button 的狀態規則集中在一處。新增一個 Button 變體時，可以直接呼叫現有 mixin，而不是複製 hover / active / disabled。

## Input mixin

`mixins/input.less` 封裝輸入框常見狀態：

- `.hover()`：hover border。
- `.active()`：focus border 與 box-shadow。
- `.disabled()`：disabled 背景、游標與文字色。
- `.input-large()`、`.input-small()`：尺寸變體。
- `.input()`：基礎 input 外觀。
- `.input-error()`：錯誤狀態。
- `.input-group()`：prepend、append、group 排列。

Input、Form error、Transfer 中的 Input 特例都能復用這些規則。

## content、mask、close 的浮層抽象

Modal、Drawer、Poptip、Tooltip 這類元件常有共同結構：

- mask 遮罩。
- header / body / footer。
- close icon。
- content box。

把這些樣式抽成 mixin 可以讓浮層元件看起來像同一套系統，而不是每個元件有自己的 close 按鈕和 header 間距。

例如 Modal 使用 `.mask`、`.content-header`、`.content-close`，這些比單純複製 CSS 更能表達「這是浮層內容結構」。

## mixin 與元件樣式的邊界

適合放 mixin 的內容：

- 多個元件會共用的視覺模式。
- 同一元件內多個變體都會使用的狀態規則。
- 帶參數的尺寸、顏色、方向、prefix class。
- 不直接綁定單一 DOM 結構細節的樣式。

適合留在元件樣式的內容：

- 某個元件特有的 DOM 結構。
- 某個元件特有的 bug 修正。
- 和元件 class 強綁定的 selector。
- 只有一處使用且抽象後不更清楚的樣式。

過度抽象會讓閱讀成本變高。mixin 的價值是讓重複模式有名字，而不是把所有 CSS 都藏起來。

## 參數化 mixin 的價值

Button group 的 mixin 接收 class name 參數，例如 `@btnClassName`。這讓 mixin 不必硬編碼 `.ivu-btn`，可以在不同 prefix 或類似元件中復用。

參數化 mixin 適合處理：

- class prefix。
- 尺寸值。
- 顏色值。
- 動畫 class name。
- 方向或位置。

這是 Less mixin 比純 CSS 更像程式抽象的地方。

## 設計啟發

仿寫元件庫時，可以用這句話判斷是否需要 mixin：如果一段樣式包含「狀態邏輯」而且會重複出現，就值得抽成 mixin。

例如 hover / active / disabled 幾乎不該散落在每個 Button 變體裡。反過來，某個 Table fixed column 的一行修正，不一定要抽象。

好的 mixin 名稱要描述模式，例如 `.input-error()`，而不是描述它裡面剛好有紅色邊框。

## 複習題

1. mixin 和元件樣式檔的責任差在哪裡？
2. Button 的 `.button-variant()` 解決什麼重複問題？
3. Input 的 hover、focus、disabled 為什麼適合集中在 mixin？
4. 哪些樣式不適合抽成 mixin？
5. 參數化 mixin 對 class prefix 有什麼幫助？
