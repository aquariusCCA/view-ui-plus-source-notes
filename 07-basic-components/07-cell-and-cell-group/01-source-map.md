# Cell / CellGroup Source Map：閱讀入口與責任分工

## 0. 原始筆記問題分析

原本 `README.md` 已經列出 `cell.vue`、`cell-item.vue`、`cell-group.vue`、`cell.less`、`types/cell.d.ts` 與 example，但還沒有把這些來源之間的責任關係說清楚。

對 `Cell` 來說，只列路徑不夠，因為它的行為分散在五層：

1. `cell.vue` 決定 public item 的 props、slots、click、link branch 與 arrow。
2. `cell-item.vue` 決定 title、label、extra、icon 的內部 DOM 結構。
3. `cell-group.vue` 透過 provide/inject 收集子項 click，並對外 emit `on-click`。
4. `mixins/link.js` 與 `mixins/globalConfig.js` 補上 link props、navigation 與全域 arrow 設定。
5. `cell.less` 與 `.select-item()` mixin 決定 selected、disabled、hover、footer、arrow 的視覺結果。

## 1. 本章定位

本章是一篇 source map 筆記。它不逐行分析 click handler，也不深入展開所有 CSS selector，而是先建立完整閱讀地圖。

讀完後，應該能回答：

1. `Cell`、`CellItem`、`CellGroup` 的 runtime 分別在哪裡。
2. 哪些行為由 `Cell` 自身負責，哪些行為來自 mixin 或父層 group。
3. 為什麼 `CellItem` 是內部結構，不是 public component。
4. 為什麼 `Cell` 的完整 public contract 不能只看 `cell.vue`。
5. 初次閱讀時應該按照什麼順序打開檔案。

## 2. Source Baseline

本章以本地保存的 View UI Plus `v1.3.20` 原始碼為準。

| 類型 | 路徑 | 角色 |
| --- | --- | --- |
| Runtime | `01-origin/source/view-ui-plus-v1.3.20/src/components/cell/cell.vue` | 定義 `Cell` props、slots、class、click、link wrapper 與 arrow。 |
| Runtime internal | `01-origin/source/view-ui-plus-v1.3.20/src/components/cell/cell-item.vue` | 定義內部展示結構：icon、main、title、label、footer、extra。 |
| Runtime group | `01-origin/source/view-ui-plus-v1.3.20/src/components/cell/cell-group.vue` | 定義 group wrapper、provide `CellGroupInstance` 與 `on-click` emit。 |
| Runtime entry | `01-origin/source/view-ui-plus-v1.3.20/src/components/cell/index.js` | 匯出 `cell.vue` 作為 `Cell` 單元件入口。 |
| Runtime entry | `01-origin/source/view-ui-plus-v1.3.20/src/components/cell-group/index.js` | 從 `cell/cell-group.vue` 匯出 `CellGroup` 單元件入口。 |
| Shared logic | `01-origin/source/view-ui-plus-v1.3.20/src/mixins/link.js` | 提供 `to`、`replace`、`target`、`append` props 與 navigation 方法。 |
| Shared logic | `01-origin/source/view-ui-plus-v1.3.20/src/mixins/globalConfig.js` | 從 Vue app globalProperties 讀取 `$VIEWUI`。 |
| Component style | `01-origin/source/view-ui-plus-v1.3.20/src/styles/components/cell.less` | 定義 `ivu-cell`、link、icon、main、label、footer、arrow、selected、disabled。 |
| Style mixin | `01-origin/source/view-ui-plus-v1.3.20/src/styles/mixins/select.less` | 透過 `.select-item()` 補上共用 item padding、hover、disabled、selected 規則。 |
| Style entry | `01-origin/source/view-ui-plus-v1.3.20/src/styles/components/index.less` | 透過 `@import "cell";` 將 cell 樣式納入元件樣式集合。 |
| Type declaration | `01-origin/source/view-ui-plus-v1.3.20/types/cell.d.ts` | 定義 `Cell` / `CellGroup` 的 public props、slots 與 event listener contract。 |
| Global options type | `01-origin/source/view-ui-plus-v1.3.20/types/index.d.ts` | 定義 install options 裡的 `cell.arrow`、`cell.customArrow`、`cell.arrowSize`。 |
| Type export entry | `01-origin/source/view-ui-plus-v1.3.20/types/viewuiplus.components.d.ts` | 透過 `export { Cell, CellGroup } from './cell'` 匯出型別。 |
| Example | `01-origin/source/view-ui-plus-v1.3.20/examples/routers/cell.vue` | 展示 `CellGroup`、`Cell`、`on-click`、selected、disabled、extra、to、target。 |
| Component registry | `01-origin/source/view-ui-plus-v1.3.20/src/components/index.js` | 對外匯出 `Cell` 與 `CellGroup`。 |
| Plugin install | `01-origin/source/view-ui-plus-v1.3.20/src/index.js` | 註冊所有 components，並建立 `$VIEWUI.cell` 的 arrow 預設設定。 |

## 3. Runtime 責任分工

三個 runtime component 的責任不同。

| 元件 | 是否 public export | 責任 |
| --- | --- | --- |
| `CellGroup` | 是 | 包住 slot、provide 自己、把子項 click 轉成 `on-click`。 |
| `Cell` | 是 | 接收 public props / slots、產生 link 或 div wrapper、呼叫 group click 與 navigation。 |
| `CellItem` | 否 | 單純排版，負責 icon、title、label、extra 的展示結構。 |

這個分工代表 `CellItem` 不應被當成使用者可直接依賴的 public API。它存在的目的，是讓 `Cell` 的 template 不直接承擔所有展示區塊。

## 4. `CellGroup` 的閱讀重點

`cell-group.vue` 的 template 很短：

```vue
<div class="ivu-cell-group">
    <slot></slot>
</div>
```

真正的行為在 `provide()` 與 `handleClick()`：

```js
provide () {
    return {
        CellGroupInstance: this
    }
},
methods: {
    handleClick (name) {
        this.$emit('on-click', name);
    }
}
```

所以 `CellGroup` 的責任不是改變子項的 props，也不是管理 selected 狀態，而是提供一個父層 instance，讓子 `Cell` 可以把自己的 `name` 回報上來。

## 5. `Cell` 的閱讀重點

`cell.vue` 同時混入：

```js
mixins: [ mixinsLink, globalConfig ]
```

因此 `Cell` 的 public contract 來自三個來源：

| 來源 | 提供內容 |
| --- | --- |
| `cell.vue` | `name`、`title`、`label`、`extra`、`disabled`、`selected`。 |
| `mixins/link.js` | `to`、`replace`、`target`、`append` 與 link navigation 方法。 |
| `types/cell.d.ts` | 對外文件化 props、slots 與 `CellGroup` listener。 |

template 則以 `to` 為分界：

```txt
有 to
  -> 渲染 <a class="ivu-cell-link">
  -> 顯示右側 arrow
沒有 to
  -> 渲染 <div class="ivu-cell-link">
  -> 不顯示 arrow
```

兩個 branch 都會包同一個 `CellItem`，所以展示內容的結構不因 link 與否而改變。

## 6. `CellItem` 的閱讀重點

`cell-item.vue` 只宣告三個 props：

```txt
title / label / extra
```

template 固定分成三塊：

| DOM 區塊 | 內容 |
| --- | --- |
| `.ivu-cell-icon` | `#icon` slot。空內容時由 CSS 隱藏。 |
| `.ivu-cell-main` | `.ivu-cell-title` 與 `.ivu-cell-label`。 |
| `.ivu-cell-footer` | `.ivu-cell-extra`，放右側額外內容。 |

它沒有事件、沒有 inject、沒有 link 行為。這讓 `CellItem` 可以被理解成 `Cell` 的純展示子元件。

## 7. Style 責任分工

`cell.less` 定義 Cell 專屬結構，例如：

| Selector | 責任 |
| --- | --- |
| `.ivu-cell` | 根節點定位與 overflow。 |
| `.ivu-cell-link` | 繼承文字顏色，避免 link 改變視覺。 |
| `.ivu-cell-icon` | icon 區塊與空 slot 隱藏。 |
| `.ivu-cell-main` | title / label 的主要內容容器。 |
| `.ivu-cell-footer` | 右側 extra 的 absolute positioning。 |
| `.ivu-cell-with-link .ivu-cell-footer` | 有 arrow 時把 footer 往左移。 |
| `.ivu-cell-arrow` | 右側箭頭的 absolute positioning。 |
| `.ivu-cell-selected` | selected 背景與 label / footer 色彩。 |

但 hover、disabled、selected 等 item 共用規則來自：

```less
.select-item(@cell-prefix-cls, @cell-prefix-cls);
```

所以讀樣式時不能只看 `cell.less` 上半段，也要打開 `src/styles/mixins/select.less`。

## 8. Type 與 Public Export

`types/cell.d.ts` 匯出兩個 component declaration：

```ts
export declare const Cell: DefineComponent<...>
export declare const CellGroup: DefineComponent<...>
```

其中 `Cell` 的 `.d.ts` 包含：

```txt
name / title / label / extra / disabled / selected
to / replace / target / append
v-slots: default / icon / label / extra / arrow
```

`CellGroup` 的 `.d.ts` 包含：

```txt
onOnClick?: (event?: any) => any
```

runtime public export 在 `src/components/index.js`：

```js
export { default as Cell } from './cell';
export { default as CellGroup } from './cell-group';
```

typed public export 在 `types/viewuiplus.components.d.ts`：

```ts
export { Cell, CellGroup } from './cell'
```

全域安裝則由 `src/index.js` 透過整個 component map 完成：

```js
Object.keys(ViewUI).forEach(key => {
    app.component(key, ViewUI[key]);
});
```

所以 `Cell` 與 `CellGroup` 都會被全域註冊，而 `CellItem` 不會。

## 9. Example 的閱讀價值

`examples/routers/cell.vue` 的價值在於把多種使用場景放在同一個 `CellGroup` 裡：

| 範例情境 | 驗證重點 |
| --- | --- |
| `<CellGroup @on-click="handleClick">` | group 收集子項 click 並傳回 `name`。 |
| `<Cell title="..." label="..." extra="...">` | props 直接填入 `CellItem` 對應區塊。 |
| `<Cell to="/button">` | 有 link，會顯示 arrow 並走 link mixin。 |
| `<Cell selected>` | 只改變 selected class 與樣式。 |
| `<Cell disabled>` | 只改變 disabled class，example 沒有阻止 click 邏輯。 |
| `<Cell target="_blank">` | 交給 link mixin 處理新視窗開啟。 |

example 裡也有一些被註解的 `Badge`、`Icon`、`i-switch` slot 用法，剛好對應 `#extra` 與 `#icon` 的擴充位置。

## 10. 建議閱讀順序

第一次閱讀時，建議按照以下順序。

1. 先讀 `types/cell.d.ts`，建立 public props、slots 與 group event 的表面契約。
2. 再讀 `examples/routers/cell.vue`，確認官方實際展示哪些組合。
3. 回到 `cell-group.vue`，理解 provide / emit 的父層角色。
4. 讀 `cell.vue`，先看 `to` branch 與 `CellItem` slot 轉發，再看 click handler。
5. 讀 `mixins/link.js`，補上 router、target、ctrl/meta click 的 navigation 規則。
6. 讀 `globalConfig.js` 與 `src/index.js`，確認 arrow 全域設定來源。
7. 最後讀 `cell.less` 與 `mixins/select.less`，對照 class 如何轉成畫面。

這個順序能避免一開始就陷入 link mixin 或 CSS，也能避免只看 type declaration 而漏掉 disabled 不阻止 click 這類 runtime 邊界。

## 11. 本章總結

`Cell / CellGroup` 的完整行為由 runtime、shared mixins、style、type 與 example 共同成立。`CellGroup` 提供事件匯出口，`Cell` 負責 public item 行為，`CellItem` 負責內部展示結構，`link.js` 與 `$VIEWUI.cell` 則補上導頁與箭頭設定。

這組元件很適合用來學習「小型列表行元件如何同時連接父子通訊、導頁 mixin 與樣式系統」。

## 12. 自我檢查問題

1. `CellItem` 為什麼不應被視為 public component？
2. `Cell` 的 link props 是在哪個檔案宣告的？
3. `CellGroup` 透過什麼 key provide 自己？
4. `Cell` 被點擊時，為什麼可以呼叫父層的 `handleClick()`？
5. `Cell` 與 `CellGroup` 分別在哪裡進入 runtime public export？
6. `Cell` 的樣式為什麼需要同時看 `cell.less` 與 `mixins/select.less`？
7. `$VIEWUI.cell` 的預設值在哪裡建立？
