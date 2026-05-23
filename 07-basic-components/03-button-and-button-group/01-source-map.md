# Button / ButtonGroup Source Map：閱讀入口與責任分工

## 0. 原始筆記問題分析

原本 `README.md` 已經列出 `Button`、`ButtonGroup`、style、type、example 等入口，但還沒有把這些來源之間的責任關係說清楚。對 `Button` 這種操作型基礎元件來說，只列路徑不夠，因為很多行為不是直接寫在 `button.vue` 裡。

最容易漏掉的有三點。

第一，link 行為來自 `mixins/link.js`。如果只看 `button.vue`，會看到 `this.to`、`this.linkUrl`、`this.handleCheckClick()`，但不知道它們從哪裡來。

第二，disabled 的一部分語意來自 `mixins/form.js`。`Button` 不只讀自己的 `disabled` prop，也會讀上層 `FormInstance.disabled`。

第三，`ButtonGroup` 的主要效果不在 `button-group.vue` 內，而在 `button.less` 與 `styles/mixins/button.less` 的父子 selector。

## 1. 本章定位

本章是一篇 source map 筆記。它不深入分析每個 props，也不逐行講解 render function，而是先建立完整閱讀地圖。

讀完後，應該能回答：

1. `Button` / `ButtonGroup` 的 runtime、type、style、example、test 分別在哪裡。
2. 哪些能力由 component 本身提供，哪些能力來自 mixin。
3. 為什麼 `ButtonGroup` 要回到 less 才能理解。
4. 初次閱讀時應該按照什麼順序打開檔案。

## 2. Source Baseline

本章以本地保存的 View UI Plus `v1.3.20` 原始碼為準。

| 類型 | 路徑 | 角色 |
| --- | --- | --- |
| `Button` runtime | `01-origin/source/view-ui-plus-v1.3.20/src/components/button/button.vue` | 定義 props、computed、methods、render output。 |
| `ButtonGroup` runtime | `01-origin/source/view-ui-plus-v1.3.20/src/components/button/button-group.vue` | 定義 group props、computed class 與 slot wrapper。 |
| `Button` entry | `01-origin/source/view-ui-plus-v1.3.20/src/components/button/index.js` | 匯出 `button.vue` 作為單元件入口。 |
| `ButtonGroup` entry | `01-origin/source/view-ui-plus-v1.3.20/src/components/button-group/index.js` | 從 `../button/button-group.vue` 匯出 group 元件。 |
| Link mixin | `01-origin/source/view-ui-plus-v1.3.20/src/mixins/link.js` | 提供 `to`、`replace`、`target`、`append` 與 navigation methods。 |
| Form mixin | `01-origin/source/view-ui-plus-v1.3.20/src/mixins/form.js` | 提供 `itemDisabled` 與 FormItem 事件回報能力。 |
| Component style | `01-origin/source/view-ui-plus-v1.3.20/src/styles/components/button.less` | 定義 `ivu-btn-*` 與 `ivu-btn-group-*` 的具體樣式入口。 |
| Button style mixin | `01-origin/source/view-ui-plus-v1.3.20/src/styles/mixins/button.less` | 定義 button base、variant、size、disabled、circle、group mixins。 |
| Type declaration | `01-origin/source/view-ui-plus-v1.3.20/types/button.d.ts` | 定義 `Button` / `ButtonGroup` 的 TypeScript public contract。 |
| Type export entry | `01-origin/source/view-ui-plus-v1.3.20/types/viewuiplus.components.d.ts` | 透過 `export { Button, ButtonGroup } from './button'` 匯出型別。 |
| Example | `01-origin/source/view-ui-plus-v1.3.20/examples/routers/button.vue` | 展示官方使用場景與 props 組合。 |
| Unit test | `01-origin/source/view-ui-plus-v1.3.20/test/unit/specs/button.spec.js` | 驗證 tag output、`htmlType` 與 loading 行為。 |
| Component registry | `01-origin/source/view-ui-plus-v1.3.20/src/components/index.js` | 對外匯出 `Button` 與 `ButtonGroup`。 |
| Plugin install | `01-origin/source/view-ui-plus-v1.3.20/src/index.js` | 將元件加入全域安裝流程，並提供 `iButton` alias。 |

## 3. Runtime 責任分工

`button.vue` 是主要行為入口。它負責三件事。

第一，宣告按鈕自己的 props，例如 `type`、`shape`、`size`、`loading`、`disabled`、`htmlType`、`icon`、`customIcon`、`long`、`ghost`。

第二，透過 computed 把 props 轉成 render 需要的資料，例如 `classes`、`tagName`、`tagProps`。

第三，在 render function 中決定輸出 `<button>` 或 `<a>`，並組合 loading icon、普通 icon 與 default slot。

`button-group.vue` 則非常薄。它只輸出：

```vue
<div :class="classes">
    <slot></slot>
</div>
```

這代表 `ButtonGroup` 的 runtime 不會主動遍歷子按鈕，也不會把 `size` 或 `shape` 透過 provide/inject 傳給子按鈕。它只是把 group 狀態放到父層 class，後續由樣式規則接手。

## 4. Mixin 責任分工

`Button` 混入：

```js
mixins: [ mixinsLink, mixinsForm ]
```

這一行會讓 `Button` 取得兩組額外能力。

| 來源 | 注入內容 | 在 `Button` 中的用途 |
| --- | --- | --- |
| `mixins/link.js` | `to`、`replace`、`target`、`append`、`linkUrl`、`handleCheckClick()` | 讓 `Button` 可渲染成 `<a>`，並支援 router / URL navigation。 |
| `mixins/form.js` | `FormInstance`、`FormItemInstance`、`itemDisabled`、`handleFormItemChange()` | 讓 `Button` 可受到上層 `Form` disabled 狀態影響。 |

這也是閱讀 `Button` 時最重要的提醒：component 本身沒直接宣告的 props，不代表不是 public API。只要 mixin 進入 component，mixin props 也會成為使用者可以傳入的元件 props。

## 5. Style 責任分工

`button.less` 是樣式入口，它把不同變體套到 `ivu-btn` class 上，例如：

```txt
ivu-btn
ivu-btn-primary
ivu-btn-dashed
ivu-btn-text
ivu-btn-success
ivu-btn-warning
ivu-btn-error
ivu-btn-info
ivu-btn-loading
ivu-btn-ghost
ivu-btn-group
ivu-btn-group-vertical
```

但很多底層規則其實在 `styles/mixins/button.less` 中，例如：

| Style mixin | 責任 |
| --- | --- |
| `.btn()` | button 基礎 display、cursor、border、size、disabled、icon-only。 |
| `.btn-default()` / `.btn-primary()` / `.btn-color()` | 不同 type 的顏色與 hover / active 狀態。 |
| `.btn-circle()` | circle 與 icon-only circle 的尺寸和圓角。 |
| `.btn-group()` | 橫向 group 的負 margin、邊框與圓角處理。 |
| `.btn-group-vertical()` | 縱向 group 的 block 排列、負 margin 與上下圓角處理。 |

因此 `ButtonGroup` 的筆記一定要對照 style source。只看 `button-group.vue`，會誤以為它只是多包一個 `div`。

## 6. Test 與 Example 的閱讀價值

`test/unit/specs/button.spec.js` 的價值在於確認幾個核心行為。

| 測試情境 | 驗證重點 |
| --- | --- |
| 有 `to` | `Button` 應渲染成 `<a>`。 |
| 沒有 `to` | `Button` 應渲染成 `<button>`。 |
| `<button>` 搭配 `htmlType` | 只有 button tag 才應輸出原生 `type` attribute。 |
| loading state | click 後可以進入 `ivu-btn-loading`，並渲染 `ios-loading` icon。 |

`examples/routers/button.vue` 的價值則是補足使用情境。官方範例展示了 type、disabled、ghost、icon-only、custom icon、link、router object、ButtonGroup size / shape / vertical 等組合，適合用來反推哪些 API 是主線能力。

## 7. 建議閱讀順序

第一次閱讀時，建議按照以下順序。

1. 先讀 `types/button.d.ts`，建立 public API 地圖。
2. 再讀 `examples/routers/button.vue`，確認官方實際展示哪些組合。
3. 回到 `button.vue`，理解 props、computed、render 與 click handler。
4. 補讀 `mixins/link.js` 與 `mixins/form.js`，補上 `Button` 自身沒有直接宣告的行為。
5. 讀 `button-group.vue`，確認 group runtime 很薄。
6. 最後讀 `button.less` 與 `styles/mixins/button.less`，理解視覺狀態與 group 效果。
7. 用 `button.spec.js` 回頭檢查哪些行為被測試保護。

這個順序能避免一開始就陷入 less selector，也能避免只看 runtime 而漏掉 public contract。

## 8. 本章總結

`Button` / `ButtonGroup` 的完整行為分散在多個層次。`button.vue` 決定元件輸入、render output 與 click 流程；`link.js` 提供 navigation 能力；`form.js` 補上 Form disabled；`button.less` 與 button style mixins 則定義 type、size、loading、ghost、disabled 與 group 視覺。

這組元件很適合用來學習「元件庫中的一個小元件，實際上如何跨 runtime、shared logic、style、type、example、test 共同成立」。

## 9. 自我檢查問題

1. `Button` 的 `to` prop 來自哪個檔案？
2. `Button` 為什麼會用到 `itemDisabled`？
3. `ButtonGroup` 的 `size` 為什麼不是透過 provide/inject 傳給子按鈕？
4. `button.less` 和 `styles/mixins/button.less` 分別適合看什麼？
5. `button.spec.js` 驗證了哪些核心行為？
6. 如果你只看 `button-group.vue`，會漏掉哪些重要資訊？
