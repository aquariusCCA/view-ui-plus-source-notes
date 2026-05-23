# Button / ButtonGroup 原始碼閱讀筆記

本目錄聚焦 View UI Plus 的 `Button` 與 `ButtonGroup`。這一組是基礎元件中最典型的「操作元件」：它不只是把 props 轉成 class，還要處理 loading、disabled、click、link navigation、form disabled 與群組樣式。

讀這組元件時，不應只把重點放在「有哪些按鈕樣式」。更重要的是建立一條操作型元件的閱讀主線：

```txt
public props / mixin props
  -> render tag / children / class
  -> click / loading / disabled / navigation
  -> button.less / ButtonGroup group selector
```

`ButtonGroup` 不適合和 `Button` 分開孤立閱讀。它本身只是一個 slot wrapper，真正的價值在於透過 `ivu-btn-group` 相關 class，讓 `button.less` 影響一組子按鈕的排列、邊框、尺寸與圓角。

## 1. Source Baseline

本目錄以本地保存的 View UI Plus `v1.3.20` 原始碼為閱讀基準。

| 類型 | 路徑 | 閱讀目的 |
| --- | --- | --- |
| Runtime | `01-origin/source/view-ui-plus-v1.3.20/src/components/button/button.vue` | 確認 `Button` props、render、class、loading、click 與 link 行為。 |
| Runtime | `01-origin/source/view-ui-plus-v1.3.20/src/components/button/button-group.vue` | 確認 `ButtonGroup` 如何包裹 slot 並輸出 group class。 |
| Runtime entry | `01-origin/source/view-ui-plus-v1.3.20/src/components/button/index.js` | 確認 `Button` 的單元件預設輸出。 |
| Runtime entry | `01-origin/source/view-ui-plus-v1.3.20/src/components/button-group/index.js` | 確認 `ButtonGroup` 的單元件預設輸出。 |
| Shared logic | `01-origin/source/view-ui-plus-v1.3.20/src/mixins/link.js` | 確認 `to`、`replace`、`target`、`append` 與 click navigation。 |
| Shared logic | `01-origin/source/view-ui-plus-v1.3.20/src/mixins/form.js` | 確認 `Button` 如何接收 Form disabled 狀態。 |
| Style | `01-origin/source/view-ui-plus-v1.3.20/src/styles/components/button.less` | 對照 type、loading、ghost、group 與 anchor button 樣式。 |
| Style mixin | `01-origin/source/view-ui-plus-v1.3.20/src/styles/mixins/button.less` | 對照 button base、size、disabled、circle、group、vertical group 規則。 |
| Type | `01-origin/source/view-ui-plus-v1.3.20/types/button.d.ts` | 確認 `Button` / `ButtonGroup` 的 public TypeScript contract。 |
| Type entry | `01-origin/source/view-ui-plus-v1.3.20/types/viewuiplus.components.d.ts` | 確認 `Button` / `ButtonGroup` 是否進入 typed public exports。 |
| Example | `01-origin/source/view-ui-plus-v1.3.20/examples/routers/button.vue` | 確認官方展示的 type、icon、loading、link、group 場景。 |
| Test | `01-origin/source/view-ui-plus-v1.3.20/test/unit/specs/button.spec.js` | 確認 `<a>` / `<button>`、`htmlType` 與 loading 行為。 |
| Registry | `01-origin/source/view-ui-plus-v1.3.20/src/components/index.js` | 確認 `Button` / `ButtonGroup` 是否被 public export。 |
| Install | `01-origin/source/view-ui-plus-v1.3.20/src/index.js` | 確認全域安裝與 `iButton` alias 註冊方式。 |

## 2. Reading Focus

閱讀這組元件時，建議把問題拆成五類。

第一，public contract。`Button` 的 props 不只來自 `button.vue`，也來自 `mixins/link.js`。因此 `to`、`replace`、`target`、`append` 雖然沒有直接寫在 `button.vue` 的 props 區塊，仍然是使用者可以傳入的 public API。

第二，render output。`Button` 會依照 `to` 決定渲染成 `<button>` 或 `<a>`，並依照 `loading`、`icon`、`customIcon`、default slot 組合 children。

第三，狀態與事件。`loading` 不只是多一個 icon，也會加上 `ivu-btn-loading`；click 事件會先 emit，再交給 link mixin 處理可能的 navigation。

第四，Form disabled。`Button` 混入 `mixins/form.js`，因此自己的 `disabled` prop 和上層 `Form` disabled 都會影響最終 `disabled` attribute。

第五，group 樣式。`ButtonGroup` 不透過 provide/inject 改子元件 runtime，而是輸出 `ivu-btn-group`、`ivu-btn-group-large`、`ivu-btn-group-circle`、`ivu-btn-group-vertical`，讓 less selector 對子按鈕生效。

## 3. Notes Index

建議依照下列順序閱讀。

| 筆記 | 主題 | 建議閱讀目的 |
| --- | --- | --- |
| `01-source-map.md` | 原始碼入口地圖 | 先知道 runtime、style、type、example、test、mixin、registry 分別在哪裡。 |
| `02-public-props-contract.md` | public props contract | 對照 runtime props、mixin props 與 `types/button.d.ts`。 |
| `03-render-and-class-mapping.md` | render 與 class 映射 | 理解 `<button>` / `<a>`、icon、slot、loading 與 class 如何被組合。 |
| `04-state-events-and-navigation.md` | 狀態、事件與跳轉 | 理解 loading、disabled、click、router / link navigation、Form disabled。 |
| `05-button-group-and-style-system.md` | ButtonGroup 與樣式系統 | 理解 group wrapper 如何透過 less 影響子按鈕排列與視覺。 |

## 4. Learning Outcome

讀完本目錄後，應該能建立以下理解。

1. `Button` 是操作型基礎元件，不只是視覺元件。
2. `Button` 的 public API 由自身 props、`link.js` mixin props 與 type declaration 共同構成。
3. `to` 是 `Button` render tag 的分界點：有 `to` 時輸出 `<a>`，否則輸出 `<button>`。
4. `loading` 會改變 icon、class 與 pointer behavior，而不是單純顯示文字。
5. `ButtonGroup` 本身不管理子按鈕狀態，它主要透過 group class 讓樣式層處理排列、邊框與圓角。
6. 想完整理解 `Button`，必須同時看 runtime、mixin、type declaration、example、test 與 less。

## 5. Self Check

1. 為什麼只看 `button.vue` 的 props 會漏掉 `to`、`replace`、`target`、`append`？
2. `Button` 在什麼條件下輸出 `<a>`？在什麼條件下輸出 `<button>`？
3. `htmlType` 和 public `html-type` 是什麼關係？
4. `loading` 狀態會同時影響哪些 render output 與 class？
5. `Button` 的 click handler 為什麼要先 `$emit('click')` 再處理 navigation？
6. `itemDisabled` 為什麼可能來自上層 `Form`？
7. `ButtonGroup` 為什麼不用 provide/inject 也能影響子按鈕視覺？
8. 橫向 `ButtonGroup` 和 `vertical` group 在 less selector 上主要差在哪裡？
