# 主題客製與樣式覆蓋策略

## 學習目標

這篇整理 View UI Plus 的主題客製與樣式覆蓋方式。重點不是列出所有可改變數，而是建立判斷順序：能改 token 就不要硬覆蓋 CSS，能使用穩定 class 就不要依賴脆弱 DOM，能局部封裝就不要污染全域。

讀完後，要能為企業專案選擇合理的樣式覆蓋策略。

## 對照源碼

- `01-origin/source/view-ui-plus-v1.3.20/src/styles/custom.less`
- `01-origin/source/view-ui-plus-v1.3.20/src/styles/index.less`
- `01-origin/source/view-ui-plus-v1.3.20/src/styles/components/`
- `01-origin/source/view-ui-plus-v1.3.20/build/build-style.js`
- `01-origin/source/view-ui-plus-v1.3.20/dist/styles/viewuiplus.css`

## 覆蓋策略分層

覆蓋樣式可以分成四個層級，優先順序通常是：

1. 覆寫 Less token。
2. 使用元件 props 或既有 class 變體。
3. 在業務封裝元件中局部覆蓋 class。
4. 全域覆蓋 View UI Plus CSS。

越往下風險越高。全域覆蓋最直接，但最容易破壞其他頁面與未來升級。

## 覆寫 Less token

最理想的主題客製是從 `custom.less` 的變數開始。例如：

- 改主色：`@primary-color`
- 改圓角：`@border-radius-base`
- 改字級：`@font-size-base`
- 改 Button 高度：`@btn-height-base`
- 改 z-index：`@zindex-modal`

這種方式讓相關元件一起變化，維持系統一致性。

限制是：它發生在編譯期。專案必須有 Less 編譯流程，並且能在引入 View UI Plus 樣式時注入或覆蓋變數。

## 使用既有 props 與 class

有些視覺需求不需要覆蓋 CSS，可以先檢查元件是否已有 props：

- Button type、size、shape、ghost。
- Table border、stripe、size。
- Modal fullscreen、width、footer。
- Input prefix、suffix、search、clearable。

props 會轉成元件庫支援的 class。這比手寫覆蓋穩定，因為它走的是官方設計路徑。

## 業務封裝中的局部覆蓋

企業專案常會封裝 `SearchForm`、`CrudTable`、`BusinessModal`。這時可以在封裝元件外層加自己的 namespace，再局部覆蓋 View UI Plus class：

```less
.app-crud-table {
    .ivu-table-cell {
        padding-left: 12px;
        padding-right: 12px;
    }
}
```

這種做法比直接全域改 `.ivu-table-cell` 安全，因為影響範圍被限制在業務元件內。

## 全域覆蓋的風險

全域覆蓋看起來簡單：

```less
.ivu-btn {
    border-radius: 2px;
}
```

但它可能造成：

- 影響所有 Button，包括第三方頁面或舊頁面。
- 被元件更高優先級 selector 覆蓋。
- 升級元件庫時 selector 變動導致失效。
- 和 disabled、loading、group、ghost 等狀態衝突。

因此全域覆蓋應該是最後手段，且要有明確註解和測試頁驗證。

## Prefix 客製

理論上 `@css-prefix` 可以改變元件 class prefix。這能降低和既有系統 class 衝突的機率。

但這是高成本客製：

- 所有覆蓋 CSS 都要跟著換 prefix。
- 文件中的 `.ivu-` class 不再直接適用。
- 若元件 JS 或第三方擴充硬編碼 `ivu-`，會出現不一致。

除非有強烈命名衝突，否則不建議在一般專案中改 prefix。

## 打包與交付

`build-style.js` 將 `src/styles/index.less` 編譯成 `dist/styles/viewuiplus.css`，並使用：

- `gulp-less`
- `javascriptEnabled: true`
- `gulp-autoprefixer`
- `gulp-clean-css`
- `gulp-rename`
- fonts copy task

主題客製若要產出一份企業 CSS，也應該走類似流程：編譯 Less、加瀏覽器前綴、壓縮、確認字型資源路徑。

## 覆蓋策略建議

可以用這個順序決策：

1. 這是設計系統級變更嗎？是就改 token。
2. 這是元件已支援的變體嗎？是就用 props。
3. 這是某個業務場景專用嗎？是就在業務封裝 namespace 下覆蓋。
4. 這是全站元件預設行為變更嗎？才考慮全域覆蓋，並建立回歸案例。

不要用 CSS 覆蓋去修正應該由 props 或封裝元件表達的需求。

## 複習題

1. 為什麼覆寫 token 通常優於直接覆蓋 selector？
2. 全域覆蓋 `.ivu-btn` 有哪些風險？
3. 業務封裝元件如何降低覆蓋樣式的影響範圍？
4. 改 `@css-prefix` 可能造成哪些相容問題？
5. 主題客製後為什麼要確認 fonts 是否正確輸出？
