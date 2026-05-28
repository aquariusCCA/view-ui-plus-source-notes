# 樣式入口與匯入順序

## 學習目標

這篇分析 `src/styles/index.less`。它只有幾行，卻決定整套樣式系統的依賴順序：先有 token，再有基礎工具、mixins、common、animation，最後才是元件樣式。

讀完後，要能判斷一個樣式檔為什麼放在某個匯入位置，以及改動匯入順序可能造成哪些錯誤。

## 對照源碼

- `01-origin/source/view-ui-plus-v1.3.20/src/styles/index.less`
- `01-origin/source/view-ui-plus-v1.3.20/src/styles/custom.less`
- `01-origin/source/view-ui-plus-v1.3.20/src/styles/base.less`
- `01-origin/source/view-ui-plus-v1.3.20/src/styles/mixins/index.less`
- `01-origin/source/view-ui-plus-v1.3.20/src/styles/common/index.less`
- `01-origin/source/view-ui-plus-v1.3.20/src/styles/animation/index.less`
- `01-origin/source/view-ui-plus-v1.3.20/src/styles/components/index.less`

## 入口檔的角色

`index.less` 是樣式世界的根節點。它不是單一元件樣式，而是把所有樣式層串成一個可編譯入口。

匯入順序是：

```less
@import "./custom";
@import "./base";
@import "./mixins/index";
@import "./common/index";
@import "./animation/index";
@import "./components/index";
```

這個順序有明確意義：

| 順序 | 檔案 | 為什麼在這裡 |
| --- | --- | --- |
| 1 | `custom` | 後續所有樣式都會讀 token，必須最早載入 |
| 2 | `base` | 產生全域工具 class，依賴 token 但不依賴元件 |
| 3 | `mixins/index` | 讓後續元件樣式可以呼叫 `.btn()`、`.input()` 等 mixin |
| 4 | `common/index` | 載入 normalize、iconfont、layout、article 等全域基礎樣式 |
| 5 | `animation/index` | 提供全域動畫 class 與 transition mixin 產物 |
| 6 | `components/index` | 最後產出所有元件 class，消耗前面的 token 和 mixin |

## 為什麼 token 要最前面

`custom.less` 定義了大量變數，例如：

- `@css-prefix`
- `@primary-color`
- `@font-size-base`
- `@border-radius-base`
- `@screen-sm`
- `@zindex-modal`
- `@btn-height-base`
- `@input-height-base`

後面的 `base.less`、`mixins/`、`components/` 都會直接引用這些變數。若 `custom.less` 不先載入，Less 編譯會在使用變數時找不到定義。

這也是 token 檔的典型責任：它不應依賴具體元件，反而要被所有元件依賴。

## 為什麼 mixins 要早於 components

元件樣式不是每次都手寫完整 CSS，而是呼叫 mixin。例如：

- Button 使用 `.btn`、`.btn-default`、`.btn-primary`、`.btn-group`
- Input 使用 `.input`、`.input-group`、`.input-error`
- Modal 使用 `.mask`、`.content-header`、`.content-close`
- Table 使用 `.sortable`、`.select-item` 等共用模式

因此 `mixins/index.less` 必須在 `components/index.less` 前面。元件層的工作是把 mixin 套到具體 class，不是重新發明每一種樣式模式。

## common 與 base 的差異

`base.less` 放的是 View UI Plus 自己定義的工具 class，例如：

- `.ivu-block`
- `.ivu-text-center`
- `.ivu-fl`
- `.ivu-m-16`
- `.ivu-p-8`
- `.ivu-line-clamp`

`common/` 則偏向環境基礎：

- `normalize.less` 處理瀏覽器預設差異。
- `base.less` 處理通用 HTML 元素基礎樣式。
- `layout.less` 處理全域布局輔助。
- `article.less` 處理文章內容樣式。
- `iconfont/ionicons.less` 載入字型圖示。

兩者都屬於全域樣式，但 `base.less` 更像工具 class，`common/` 更像樣式地基。

## components/index.less 的意義

`components/index.less` 按清單匯入所有元件樣式。這讓最終使用者只要引入一份 `viewuiplus.css`，就能取得完整元件庫樣式。

這種集中入口有好處：

- 樣式打包簡單。
- 元件樣式順序固定。
- fonts 與 iconfont 可以跟著統一輸出。
- 使用者不用手動管理每個元件的 CSS。

缺點是預設 CSS 體積較大。若要做真正的按需樣式載入，需要額外的打包策略和樣式分包，不是這個入口本身能直接解決。

## 設計啟發

樣式入口的設計原則是「先抽象，後落地」。越早匯入的檔案越應該穩定、通用、低依賴；越晚匯入的檔案越接近具體元件與具體 selector。

合理順序通常是：

1. 設計值。
2. 基礎重置。
3. 共用樣式能力。
4. 動畫與工具 class。
5. 元件樣式。

只要某個底層檔案開始依賴上層元件，就要重新檢查分層是否倒置。

## 複習題

1. `index.less` 為什麼要先匯入 `custom.less`？
2. 如果把 `components/index.less` 放到 `mixins/index.less` 前面，會出現什麼問題？
3. `base.less` 和 `common/base.less` 的定位有什麼差異？
4. 為什麼集中式 `components/index.less` 有利於完整 CSS 打包？
5. 按需載入元件樣式時，這種集中入口會遇到什麼限制？
