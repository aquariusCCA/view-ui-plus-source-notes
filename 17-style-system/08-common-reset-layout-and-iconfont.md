# Common、Reset、Layout 與 Iconfont

## 學習目標

這篇分析 `common/` 與全域工具樣式。元件庫不只需要元件 class，也需要瀏覽器重置、基礎排版、layout helper、文章內容樣式與 iconfont 資源。

讀完後，要能分辨「全域基礎樣式」、「工具 class」與「元件樣式」的邊界。

## 對照源碼

- `01-origin/source/view-ui-plus-v1.3.20/src/styles/base.less`
- `01-origin/source/view-ui-plus-v1.3.20/src/styles/common/index.less`
- `01-origin/source/view-ui-plus-v1.3.20/src/styles/common/normalize.less`
- `01-origin/source/view-ui-plus-v1.3.20/src/styles/common/base.less`
- `01-origin/source/view-ui-plus-v1.3.20/src/styles/common/layout.less`
- `01-origin/source/view-ui-plus-v1.3.20/src/styles/common/article.less`
- `01-origin/source/view-ui-plus-v1.3.20/src/styles/common/iconfont/ionicons.less`
- `01-origin/source/view-ui-plus-v1.3.20/build/build-style.js`

## common/index.less 的組成

`common/index.less` 匯入：

```less
@import "base";
@import "iconfont/ionicons";
@import "layout";
@import "article";
```

它代表元件庫層級的全域基礎樣式。這些樣式不屬於單一元件，但會影響元件庫整體呈現。

## normalize 的角色

`normalize.less` 用來處理不同瀏覽器的預設樣式差異。元件庫需要可預期的基礎環境，否則 Button、Form、Table 在不同瀏覽器上可能出現不一致。

normalize 類樣式的特點是：

- selector 多半是 HTML element。
- 目標是降低瀏覽器預設差異。
- 不應帶有強烈品牌視覺。
- 不應依賴具體元件結構。

它是樣式系統的地基，不是元件設計本身。

## 全域工具 class

`src/styles/base.less` 定義 `.ivu` 命名空間下的工具 class，例如：

- display：`.ivu-block`、`.ivu-inline`、`.ivu-inline-block`
- text align：`.ivu-text-center`、`.ivu-text-left`、`.ivu-text-right`
- float：`.ivu-fl`、`.ivu-fr`、`.ivu-clearfix`
- border：`.ivu-b`、`.ivu-bt`、`.ivu-br`、`.ivu-bb`、`.ivu-bl`
- spacing：`.ivu-m-8`、`.ivu-mt-16`、`.ivu-p-4`
- text：`.ivu-line-clamp`

這些 class 是輔助樣式，適合快速處理簡單排版，但不應取代元件樣式設計。

## 工具 class 與 directive 的差異

View UI Plus 也有樣式快捷指令，例如 `v-width`、`v-height`、`v-margin`、`v-padding`、`v-color`。

兩者差異是：

| 能力 | 工具 class | 樣式 directive |
| --- | --- | --- |
| 使用方式 | 寫 class | 寫 `v-xxx` |
| 值的彈性 | 預設有限，例如 0、4、8、16 | 可以接受 binding value |
| 生命週期 | 純 CSS，無清理 | directive 要在 unmounted 清理 |
| 適用場景 | 常見固定間距與排版 | 動態或模板宣告式 inline style |

工具 class 靠 CSS 命名，directive 靠 Vue 生命週期。兩者都提供便利性，但工程成本不同。

## Iconfont

`common/iconfont/` 保存 Ionicons 相關 Less 與字型檔。`build-style.js` 的 `fonts` task 會把字型檔從 `src/styles/common/iconfont/fonts/*.*` 拷貝到 `dist/styles/fonts`。

這說明 iconfont 不只是 CSS：

- Less 定義 icon class 與 font-face。
- 字型檔必須跟 CSS 一起發布。
- 打包後 CSS 中的 font URL 要能找到對應資源。

如果只複製 CSS 而忘了 fonts，圖示會顯示失敗。

## layout 與 article

`common/layout.less` 和 `common/article.less` 處理更高層的排版語意。它們不像 Button、Input 那樣是單一元件，也不像 normalize 那樣只是瀏覽器重置。

這類樣式通常用在：

- 文件頁面。
- 後台基礎布局。
- 文章內容區。
- 元件庫展示頁或通用排版。

閱讀時要注意它們是否會對業務專案造成全域影響。全域樣式越多，使用者覆蓋成本越高。

## 設計啟發

元件庫可以提供工具 class，但要克制。工具 class 適合提供低風險、高頻、語意明確的能力，例如 margin、padding、clearfix。若工具 class 過多，就會變成另一套 utility CSS framework，增加學習成本。

iconfont 也要被視為發布資產的一部分。樣式系統的交付物不是只有一份 CSS，還包括字型、圖片、可能的 sourcemap 與主題產物。

## 複習題

1. `common/` 和 `components/` 的責任差在哪裡？
2. normalize 類樣式解決什麼問題？
3. `.ivu-m-8` 這類工具 class 和 `v-margin` 有什麼差異？
4. 為什麼 iconfont 需要 build script 複製 fonts？
5. 全域工具 class 太多可能帶來什麼問題？
