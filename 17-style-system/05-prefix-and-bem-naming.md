# Prefix 與 BEM-like 命名

## 學習目標

這篇分析 View UI Plus 的 class 命名方式。它不是嚴格 BEM，但大量使用 prefix、元件 block、修飾 class 與狀態 class，形成一套 BEM-like 的樣式 API。

讀完後，要能看懂 `@css-prefix` 如何生成 `.ivu-btn`、`.ivu-input-wrapper`、`.ivu-modal-wrap` 這類 class，也要理解穩定 class 對使用者覆蓋樣式的重要性。

## 對照源碼

- `01-origin/source/view-ui-plus-v1.3.20/src/styles/custom.less`
- `01-origin/source/view-ui-plus-v1.3.20/src/styles/components/button.less`
- `01-origin/source/view-ui-plus-v1.3.20/src/styles/components/input.less`
- `01-origin/source/view-ui-plus-v1.3.20/src/styles/components/modal.less`
- `01-origin/source/view-ui-plus-v1.3.20/src/styles/components/table.less`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/`

## Prefix 的作用

`custom.less` 定義：

```less
@css-prefix: ivu-;
@css-prefix-iconfont: ivu-icon;
```

這兩個變數決定了元件庫 class 的命名空間。大多數元件樣式會先宣告自己的 prefix，例如：

```less
@btn-prefix-cls: ~"@{css-prefix}btn";
@input-prefix-cls: ~"@{css-prefix}input";
@modal-prefix-cls: ~"@{css-prefix}modal";
@table-prefix-cls: ~"@{css-prefix}table";
```

接著透過 Less 插值產出實際 selector：

- `.ivu-btn`
- `.ivu-input`
- `.ivu-modal`
- `.ivu-table`

prefix 讓元件庫 class 不容易和業務系統 class 撞名。

## BEM-like 而非嚴格 BEM

View UI Plus 常見命名是：

- Block：`.ivu-btn`
- Modifier：`.ivu-btn-primary`、`.ivu-btn-large`、`.ivu-btn-loading`
- Element-like：`.ivu-modal-header`、`.ivu-modal-body`、`.ivu-input-icon`
- State：`.ivu-select-visible`、`.ivu-table-row-hover`、`.ivu-form-item-error`

這不是嚴格的 `block__element--modifier`，但精神接近 BEM：用穩定 class 表達元件、部位、狀態與變體。

這種命名對使用者較直觀，也和早期 Vue 元件庫的 CSS 習慣一致。

## Button 的命名模式

Button 使用 `@btn-prefix-cls` 產生 `.ivu-btn`，再透過 `&-xxx` 展開：

- `&-primary` -> `.ivu-btn-primary`
- `&-dashed` -> `.ivu-btn-dashed`
- `&-text` -> `.ivu-btn-text`
- `&-success` -> `.ivu-btn-success`
- `&-circle` -> `.ivu-btn-circle`
- `&-loading` -> `.ivu-btn-loading`
- `&-group` -> `.ivu-btn-group`

這些 class 對應元件 props 或內部狀態。樣式層不直接讀 props，而是讀渲染結果中的 class。

## Input 的命名模式

Input 的 class 更能看出結構：

- `.ivu-input` 是真正輸入框。
- `.ivu-input-wrapper` 是外層容器。
- `.ivu-input-icon` 是 icon 位置。
- `.ivu-input-prefix` 與 `.ivu-input-suffix` 是前後綴。
- `.ivu-input-with-prefix` 與 `.ivu-input-with-suffix` 改變 padding。
- `.ivu-input-group`、`.ivu-input-group-prepend`、`.ivu-input-group-append` 處理複合輸入。

這表示元件 DOM 結構和 class 命名要一起設計。樣式不是事後補上，而是元件渲染結構的一部分。

## 狀態 class 的來源

很多狀態 class 不是使用者手寫，而是元件根據 props 或內部狀態渲染。

例如：

- Form 驗證錯誤會讓外層出現 `.ivu-form-item-error`，Input 樣式再被套用錯誤邊框。
- Table hover row 會出現 `.ivu-table-row-hover`。
- Button loading 會有 `.ivu-btn-loading`，同時阻止 pointer event 並顯示遮罩感。
- Modal hidden 會使用 `.ivu-modal-hidden`。

這讓互動邏輯留在 Vue 元件，視覺呈現交給 CSS。

## Prefix 可客製的代價

理論上，`@css-prefix` 可被覆寫成其他值。這對避免 class 衝突有幫助，但也有成本：

- 元件 JS 中若有硬編碼 class，也必須一起支援。
- 使用者自訂覆蓋 CSS 必須跟著改 prefix。
- 文件和範例中的 class 會和實際輸出不一致。
- 第三方插件若假設 `ivu-`，可能失效。

所以 prefix 是公開樣式 API，一旦釋出就不應輕易變動。

## 設計啟發

元件庫 class 命名要穩定、可推導、可覆蓋。好的命名通常符合這幾點：

- 每個元件有單一 block prefix。
- 元件內部部位用同一個 prefix 延伸。
- 尺寸、狀態、語意變體使用一致 suffix。
- 不把業務語意混進基礎元件 class。
- JS、Less、文件中的 prefix 來源一致。

當使用者看到 `.ivu-modal-footer` 時，應該不需要查文件也能猜到它是 Modal 的 footer。

## 複習題

1. `@css-prefix` 解決什麼問題？
2. 為什麼每個元件樣式通常會先宣告 `@xxx-prefix-cls`？
3. View UI Plus 的命名為什麼是 BEM-like，而不是嚴格 BEM？
4. `.ivu-form-item-error` 如何影響 Input 樣式？
5. 覆寫 `@css-prefix` 可能帶來哪些風險？
