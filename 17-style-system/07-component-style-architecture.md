# 元件樣式架構

## 學習目標

這篇用 Button、Input、Modal、Table 四個元件觀察 View UI Plus 的元件樣式架構。重點是理解 props、狀態、DOM 結構與 class 如何一起決定最終樣式。

讀完後，要能從一個元件樣式檔看出它的狀態模型與結構設計，而不只是看 CSS 宣告。

## 對照源碼

- `01-origin/source/view-ui-plus-v1.3.20/src/styles/components/button.less`
- `01-origin/source/view-ui-plus-v1.3.20/src/styles/components/input.less`
- `01-origin/source/view-ui-plus-v1.3.20/src/styles/components/modal.less`
- `01-origin/source/view-ui-plus-v1.3.20/src/styles/components/table.less`
- `01-origin/source/view-ui-plus-v1.3.20/src/styles/components/index.less`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/button/`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/input/`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/modal/`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/table/`

## 元件樣式檔的基本形狀

常見模式是：

1. 宣告元件 prefix class。
2. 使用根 selector。
3. 套用基礎 mixin。
4. 展開尺寸、狀態、變體、內部結構 class。
5. 補充媒體查詢或跨元件狀態。

例如 Button：

```less
@btn-prefix-cls: ~"@{css-prefix}btn";

.@{btn-prefix-cls} {
    .btn;
    .btn-default;

    &-primary {
        .btn-primary;
    }
}
```

元件樣式檔的任務是把抽象 token 和 mixin 落到具體 selector。

## Button：變體與狀態

Button 的樣式由多個維度組成：

- type：default、primary、dashed、text、success、warning、error、info。
- shape：circle、circle-outline。
- size：large、small、base。
- state：loading、disabled、active、focus。
- composition：button group、vertical group。
- ghost：透明背景與不同語意色組合。

這些維度大多轉成 class，例如 `.ivu-btn-primary`、`.ivu-btn-small`、`.ivu-btn-loading`。樣式層只認 class，不直接認 props。

Button 的重點是「狀態組合」。例如 primary button 在 group 裡還要修正左右邊框；ghost primary 又要處理透明背景下的 hover。這些組合是元件樣式複雜度的主要來源。

## Input：結構與外層狀態

Input 的樣式不只作用在 `<input>` 本身，還作用在 wrapper、icon、prefix、suffix、group。

常見 class 包含：

- `.ivu-input`
- `.ivu-input-wrapper`
- `.ivu-input-icon`
- `.ivu-input-prefix`
- `.ivu-input-suffix`
- `.ivu-input-with-prefix`
- `.ivu-input-with-suffix`
- `.ivu-input-group`
- `.ivu-input-word-count`

Input 還會被 Form 狀態影響。當外層有 `.ivu-form-item-error`，內部 `.ivu-input` 會套用 `.input-error`。這是一種跨元件樣式關係：Form 不直接改 Input CSS，而是透過外層狀態 class 讓 Input 樣式響應。

## Modal：浮層結構與 z-index

Modal 樣式表達的是一組浮層結構：

- `.ivu-modal-wrap`：fixed 容器與 `@zindex-modal`。
- `.ivu-modal-mask`：遮罩。
- `.ivu-modal-content`：內容盒子、圓角與陰影。
- `.ivu-modal-header`、`.ivu-modal-body`、`.ivu-modal-footer`：內容區段。
- `.ivu-modal-close`：關閉按鈕。
- `.ivu-modal-fullscreen`：全螢幕模式。
- `.ivu-modal-hidden`：隱藏狀態。

Modal 也有響應式規則，在小螢幕時用 `@screen-sm` 調整寬度與 margin。

這說明浮層元件的樣式不只處理視覺，還處理滾動、遮罩、層級、全螢幕、拖曳狀態與小螢幕可用性。

## Table：複雜資料元件的樣式組合

Table 是樣式複雜度最高的類型之一。它同時處理：

- header、body、footer、summary。
- border、stripe、hover、highlight。
- large、small 尺寸。
- fixed column、fixed header。
- sort、filter、selection、expand、tree。
- overflow x / y。
- empty tip。
- context menu。

Table 樣式大量使用 `&-xxx` 展開，例如 `.ivu-table-cell-ellipsis`、`.ivu-table-row-hover`、`.ivu-table-fixed-right`。

這類元件的關鍵不是單一 selector，而是 class 狀態組合。Vue 元件必須準確輸出 class，CSS 才能根據狀態做出正確視覺。

## props 到 class 的轉換

元件 props 通常不直接進入 CSS，而是先轉成 class 或 inline style：

- `size="small"` -> `.ivu-btn-small` 或 `.ivu-table-small`
- `type="primary"` -> `.ivu-btn-primary`
- `disabled` -> disabled attribute 或 disabled class
- `loading` -> `.ivu-btn-loading`
- `fullscreen` -> `.ivu-modal-fullscreen`
- `stripe` -> `.ivu-table-stripe`

這是元件庫常見設計：props 是使用者 API，class 是樣式 API，中間由 Vue render 邏輯連接。

## 設計啟發

設計元件樣式前要先畫出狀態矩陣：

- 有哪些尺寸？
- 有哪些語意變體？
- 有哪些互動狀態？
- 哪些狀態可以疊加？
- 哪些 class 由父元件控制？
- 哪些樣式需要依賴 DOM 結構？

如果這些問題沒釐清，CSS 很容易變成補丁集合。View UI Plus 的元件樣式雖然有歷史痕跡，但整體仍遵守「prefix class + 狀態 class + mixin」的主線。

## 複習題

1. 元件樣式檔通常包含哪些步驟？
2. Button 的複雜度主要來自哪些狀態組合？
3. Input 為什麼需要 wrapper、prefix、suffix、group 等 class？
4. Modal 樣式為什麼需要 z-index 與小螢幕 media query？
5. Table 樣式為什麼比 Button 更依賴狀態 class 組合？
