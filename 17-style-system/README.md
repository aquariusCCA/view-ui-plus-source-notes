# 17-style-system

本目錄存放 View UI Plus 的樣式系統分析。這一章不只看「某個 class 寫了什麼 CSS」，而是整理元件庫如何用 Less 入口、變數、色彩演算法、mixins、全域樣式、元件樣式、動畫與打包流程組成一套可維護的 UI 樣式系統。

View UI Plus v1.3.20 的實作主線是 Less，不是 SCSS。閱讀時可以把 Less 變數視為早期 design token，把 mixins 視為樣式層抽象，把 `ivu-` class prefix 視為樣式 API 的穩定邊界。

## 閱讀順序

| 順序 | 筆記 | 學習重點 |
| --- | --- | --- |
| 1 | [樣式系統總覽](./01-style-system-overview.md) | 建立 Less 入口、全域樣式、元件樣式、mixins、變數與打包產物的整體地圖 |
| 2 | [樣式入口與匯入順序](./02-style-entry-and-import-order.md) | 分析 `index.less` 為什麼先匯入 token，再匯入 mixins、common、animation、components |
| 3 | [Less 變數與 design token](./03-less-variables-and-design-tokens.md) | 分析 `custom.less` 如何承載色彩、字體、間距、圓角、陰影、斷點與 z-index |
| 4 | [色彩系統與色盤生成](./04-color-system-and-palette-generation.md) | 分析 `color/` 目錄如何用主色生成 1 到 10 階色盤與狀態色 |
| 5 | [Prefix 與 BEM-like 命名](./05-prefix-and-bem-naming.md) | 分析 `@css-prefix`、元件 prefix class、修飾 class 與狀態 class 的命名模式 |
| 6 | [Mixins 作為樣式抽象](./06-mixins-as-style-abstractions.md) | 分析 button、input、mask、content、tooltip、size 等 mixin 如何降低重複 |
| 7 | [元件樣式架構](./07-component-style-architecture.md) | 以 Button、Input、Modal、Table 追蹤 props、狀態與 DOM 結構如何落到樣式 |
| 8 | [Common、Reset、Layout 與 Iconfont](./08-common-reset-layout-and-iconfont.md) | 分析 normalize、base、layout、article、ionicons 與工具 class 的分工 |
| 9 | [動畫與轉場系統](./09-animation-and-transition-system.md) | 分析 fade、move、slide、loop、ease 與 Vue transition class 的配合 |
| 10 | [主題客製與樣式覆蓋策略](./10-theme-customization-and-style-overrides.md) | 整理覆寫 Less 變數、覆蓋 class、調整 prefix 與企業二次主題的做法 |
| 11 | [暗色模式與 token 現代化](./11-dark-mode-and-token-modernization.md) | 從現有 Less token 推導暗色模式、CSS variables 與 token pipeline 的演進方向 |
| 12 | [樣式系統設計檢查清單](./12-style-system-design-checklist.md) | 建立仿寫元件庫樣式系統時可重複使用的檢查流程 |

## 原始碼主線

主要對照這幾個位置：

- `01-origin/source/view-ui-plus-v1.3.20/src/styles/index.less`
- `01-origin/source/view-ui-plus-v1.3.20/src/styles/custom.less`
- `01-origin/source/view-ui-plus-v1.3.20/src/styles/base.less`
- `01-origin/source/view-ui-plus-v1.3.20/src/styles/color/`
- `01-origin/source/view-ui-plus-v1.3.20/src/styles/common/`
- `01-origin/source/view-ui-plus-v1.3.20/src/styles/mixins/`
- `01-origin/source/view-ui-plus-v1.3.20/src/styles/animation/`
- `01-origin/source/view-ui-plus-v1.3.20/src/styles/components/`
- `01-origin/source/view-ui-plus-v1.3.20/build/build-style.js`
- `01-origin/source/view-ui-plus-v1.3.20/dist/styles/viewuiplus.css`

## 本章邊界

本章聚焦樣式系統自身的設計，不重複分析每個元件的完整 Vue 實作。

- 元件 props、emits、slots 的完整 API 可回看 `06-public-api-and-type-system/` 與各元件章節；本章只看這些 API 如何影響 class 與樣式。
- 指令中的 `v-width`、`v-color`、`v-line-clamp` 可回看 `16-directives/`；本章只分析它們和全域工具 class、樣式 token 的關係。
- 建置發布流程可回看 `19-build-release/`；本章只分析樣式如何被 Less、autoprefixer、cleanCSS 與字型拷貝流程輸出。
- 暗色模式與 CSS variables 屬於延伸設計。View UI Plus v1.3.20 主要仍是編譯期 Less 變數，不要誤讀成已具備完整 runtime token 系統。

## 學完後要能回答

- View UI Plus 的樣式入口為什麼是 `src/styles/index.less`？
- `custom.less` 中哪些變數可以視為 design token？
- `@css-prefix` 如何影響所有元件 class？
- 元件樣式為什麼通常先宣告 `@xxx-prefix-cls`？
- mixin 和元件樣式檔各自應該放什麼？
- Button、Input、Modal、Table 如何把狀態、尺寸與結構轉成 class？
- `colorPalette` 解決了什麼色彩一致性問題？
- `common/base.less` 的工具 class 和 directive 的樣式快捷能力有什麼差異？
- 動畫 class 如何配合 Vue transition 的 enter / leave 階段？
- 企業專案覆蓋 View UI Plus 樣式時，應該優先覆寫 token 還是直接覆蓋 CSS？
- 如果要把這套 Less token 演進成 CSS variables，需要先拆出哪些 token 層級？
