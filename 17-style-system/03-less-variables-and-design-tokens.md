# Less 變數與 design token

## 學習目標

這篇分析 `custom.less`。它是 View UI Plus 樣式系統最重要的檔案之一，集中放置顏色、字體、尺寸、間距、圓角、陰影、斷點、z-index 與元件級變數。

讀完後，要能把 Less 變數看成編譯期 design token，並理解 token 如何流向元件樣式。

## 對照源碼

- `01-origin/source/view-ui-plus-v1.3.20/src/styles/custom.less`
- `01-origin/source/view-ui-plus-v1.3.20/src/styles/color/colors.less`
- `01-origin/source/view-ui-plus-v1.3.20/src/styles/components/button.less`
- `01-origin/source/view-ui-plus-v1.3.20/src/styles/components/input.less`
- `01-origin/source/view-ui-plus-v1.3.20/src/styles/components/modal.less`
- `01-origin/source/view-ui-plus-v1.3.20/src/styles/components/table.less`

## token 的角色

design token 是設計決策的命名化資料。View UI Plus 沒有用現代 token JSON 或 CSS variables，而是用 Less 變數保存這些設計值。

例如：

| 類型 | 代表變數 | 意義 |
| --- | --- | --- |
| Prefix | `@css-prefix`、`@css-prefix-iconfont` | 控制 class 命名空間 |
| 品牌與狀態色 | `@primary-color`、`@success-color`、`@warning-color`、`@error-color` | 統一互動與回饋語意 |
| 文字 | `@font-family`、`@font-size-base`、`@title-color`、`@text-color` | 統一閱讀體驗 |
| 間距 | `@padding-lg`、`@padding-md`、`@padding-sm`、`@padding-xs` | 統一容器與控制項內距 |
| 邊框 | `@border-color-base`、`@border-radius-base` | 統一線條與形狀 |
| 陰影 | `@shadow-down`、`@shadow-card` | 統一浮層與卡片深度 |
| 斷點 | `@screen-xs` 到 `@screen-xxl` | 統一響應式判斷 |
| 層級 | `@zindex-modal`、`@zindex-tooltip`、`@zindex-loading-bar` | 統一浮層堆疊 |

這些變數讓不同元件使用同一套設計語言，而不是各自硬編碼。

## 全域 token 與元件 token

`custom.less` 同時存在兩種 token。

第一種是全域 token，例如：

- `@primary-color`
- `@text-color`
- `@font-size-base`
- `@border-radius-base`
- `@transition-time`

這些變數會被許多元件共享。

第二種是元件 token，例如：

- `@btn-height-base`
- `@btn-padding-base`
- `@input-height-base`
- `@layout-header-height`
- `@slider-height`
- `@avatar-size-base`
- `@skeleton-base-color`

這些變數仍放在全域檔案中，但語意已經綁定某類元件。它們讓使用者可以改單一元件族群的尺寸與外觀。

## token 如何流向元件

以 Button 為例：

1. `@primary-color` 定義品牌主色。
2. `@btn-primary-bg` 指向 `@primary-color`。
3. `mixins/button.less` 的 `.btn-primary()` 讀取 `@btn-primary-bg`。
4. `components/button.less` 的 `&-primary` 呼叫 `.btn-primary`。
5. 最終產出 `.ivu-btn-primary` 的背景、邊框、hover、active、focus 樣式。

這條鏈路的好處是：修改品牌主色可以影響 Button、Input focus、Table hover、Link 等多處樣式，而不需要逐一修改 selector。

## z-index 是特殊 token

浮層元件很容易互相蓋住。`custom.less` 把層級集中定義，例如：

- `@zindex-select: 900`
- `@zindex-modal: 1000`
- `@zindex-message: 1010`
- `@zindex-tooltip: 1060`
- `@zindex-loading-bar: 2000`
- `@zindex-spin-fullscreen: 2010`

這代表 z-index 不是臨時數字，而是跨元件協調結果。Modal、Drawer、Message、Tooltip、LoadingBar 都要在同一張層級表中排序。

企業專案覆蓋浮層樣式時，如果直接隨手寫 `z-index: 99999`，短期能解決遮擋，長期會破壞整套層級秩序。

## 斷點 token 的用途

`@screen-xs` 到 `@screen-xxl` 提供響應式基準。像 Modal 就使用 `@screen-sm` 在小螢幕調整寬度與 margin。

斷點集中管理有兩個價值：

- 元件之間響應式行為更一致。
- 未來如果企業設計系統改斷點，只需要改 token，而不是全域搜尋 media query。

## Less token 的限制

Less 變數是編譯期能力。它有幾個限制：

- runtime 不能直接切換主題，除非重新載入另一份 CSS。
- token 不能被瀏覽器 DevTools 當作 CSS custom properties 檢視與覆寫。
- 暗色模式需要另編一份變數或額外 class 策略。
- 變數沒有型別，也沒有 token 分層 metadata。

因此它適合傳統元件庫的編譯期主題客製，但不是現代動態主題的完整答案。

## 設計啟發

好的 token 命名要表達語意，而不是只描述顏色值。例如 `@error-color` 比 `@red-color` 更能表示用途，`@zindex-modal` 比 `@zindex-1000` 更能表示層級角色。

仿寫時可以先分三層：

- 基礎值：色彩、字級、間距、圓角。
- 語意值：primary、success、warning、error、disabled。
- 元件值：button height、input padding、modal z-index。

這樣設計值才會從底層穩定流向元件，而不是在每個 selector 中散落。

## 複習題

1. 為什麼 `custom.less` 可以視為 View UI Plus 的 token 中心？
2. 全域 token 和元件 token 的差異是什麼？
3. `@primary-color` 如何影響 `.ivu-btn-primary`？
4. 為什麼 z-index 應該集中管理？
5. Less token 和 CSS variables 在 runtime 主題能力上有什麼差異？
