# Button 與 ButtonGroup

## 學習目標

這篇分析 `Button` 和 `ButtonGroup`。Button 是基礎元件中最值得優先閱讀的案例，因為它同時包含 props validator、全域 size、form disabled、link mixin、loading、icon、slot、事件與 render function。

讀完後，要能理解一個看似簡單的按鈕，如何把多種使用情境收斂成同一個公開 API。

## 對照源碼

- `01-origin/source/view-ui-plus-v1.3.20/src/components/button/button.vue`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/button/button-group.vue`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/button/index.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/button-group/index.js`
- `01-origin/source/view-ui-plus-v1.3.20/types/button.d.ts`
- `01-origin/source/view-ui-plus-v1.3.20/src/styles/components/button.less`
- `01-origin/source/view-ui-plus-v1.3.20/src/styles/mixins/button.less`

## Button 公開 API

| API | runtime 來源 | 型別來源 | 說明 |
| --- | --- | --- | --- |
| `type` | `props.type` | `type?: ...` | 視覺語意：`default`、`primary`、`success` 等 |
| `shape` | `props.shape` | `shape?: string` | 圓形或圓角輪廓 |
| `size` | `props.size` | `size?: ...` | 支援全域 `$VIEWUI.size` 預設值 |
| `loading` | `props.loading` | `loading?: boolean` | 顯示 loading icon 並加上 loading class |
| `disabled` | `props.disabled` | `disabled?: boolean` | 和 form mixin 的 `itemDisabled` 一起決定禁用 |
| `htmlType` | `props.htmlType` | `'html-type'?: ...` | 原生 `<button type>` |
| `icon` | `props.icon` | `icon?: string` | 內建 Icon type |
| `customIcon` | `props.customIcon` | `'custom-icon'?: string` | 自訂 Icon class |
| `long` | `props.long` | `long?: boolean` | 100% 寬度 |
| `ghost` | `props.ghost` | `ghost?: boolean` | 透明背景視覺狀態 |
| `to/replace/target/append` | `mixinsLink` | d.ts 中的 link props | 讓 Button 支援跳轉 |
| `click` | `emits: ['click']` | `onClick?: ...` | 點擊事件 |

Button 的 API 不是只來自本檔 props。`mixinsLink` 和 `mixinsForm` 也會把公開能力帶進來，所以閱讀時要同時看 mixin。

## class 狀態

Button 使用 `prefixCls = 'ivu-btn'`，`classes` 會組合：

| 狀態 | class |
| --- | --- |
| 基礎 class | `ivu-btn` |
| 類型 | `ivu-btn-${type}` |
| 長按鈕 | `ivu-btn-long` |
| 形狀 | `ivu-btn-${shape}` |
| 尺寸 | `ivu-btn-small` / `ivu-btn-large` |
| 載入中 | `ivu-btn-loading` |
| 純圖示 | `ivu-btn-icon-only` |
| ghost | `ivu-btn-ghost` |

這是典型的元件庫 class 設計：props 不直接操作 DOM 樣式，而是先轉成穩定 class，再由 less 決定視覺。

## 渲染流程

Button 使用 render function 而不是 template，主要流程可以整理成：

```txt
判斷 tagName
  to 存在 -> a
  to 不存在 -> button

組 slots
  loading -> Icon(type="ios-loading")
  icon/customIcon 且非 loading -> Icon
  default slot 存在 -> span 包住 slot

回傳 h(tag, props, slots)
```

這裡有幾個重要細節：

- `loading` 優先於一般 icon，所以載入時不會同時顯示兩個圖示。
- default slot 被包在 `<span ref="slot">`，方便樣式處理圖示和文字間距。
- `to` 存在時切成 `<a>`，否則是 `<button>`。
- `tagProps` 會在 `<a>` 時提供 `href/target`，在 `<button>` 時提供 `type`。

## link mixin 的接入

Button 的跳轉能力不是自己完整實作，而是透過 `mixinsLink` 取得：

- `to`
- `replace`
- `target`
- `append`
- `linkUrl`
- `handleCheckClick`

Button 自己只決定「什麼時候要渲染成 `<a>`」以及「點擊後先 emit click，再交給 link mixin 判斷是否跳轉」。

這是很重要的分工：Button 關心按鈕外觀與點擊入口，路由解析與外部連結細節交給共用邏輯。

## form disabled 的接入

Button 同時混入 `mixinsForm`。render 時真正寫到 DOM 的 disabled 是：

```js
disabled: this.itemDisabled
```

這代表 Button 的禁用狀態可能來自自身 `disabled`，也可能來自外層 Form/FormItem 的共用狀態。基礎元件雖然簡單，但仍需要能接進元件庫的整體表單規則。

## ButtonGroup

ButtonGroup 的職責比 Button 更單純：它只提供包裹容器與群組 class。

| API | runtime 來源 | 型別來源 | 說明 |
| --- | --- | --- | --- |
| `size` | `props.size` | `size?: ...` | 群組尺寸，也讀取全域 `$VIEWUI.size` |
| `shape` | `props.shape` | `shape?: ...` | 群組內按鈕形狀 |
| `vertical` | `props.vertical` | `vertical?: boolean` | 垂直排列 |
| default slot | `<slot>` | 未特別宣告 | 放入多個 Button |

ButtonGroup 不主動改寫子 Button props，而是透過外層 class 讓 less 控制群組邊框、圓角與排列。這讓 Button 和 ButtonGroup 保持鬆耦合。

## Runtime 與 Type 落差

值得注意幾個落差：

- runtime `shape` 允許 `circle`、`circle-outline`，但 Button d.ts 寫成 `string`，ButtonGroup d.ts 則只寫 `'' | 'circle'`。
- runtime `htmlType` 是 camelCase，模板型別用 `'html-type'`。
- runtime `customIcon` 是 camelCase，模板型別用 `'custom-icon'`。
- `click` 在 runtime 是 `emits: ['click']`，型別中是 `onClick`。

這些落差不是都會造成 runtime 錯誤，但會影響 IDE 補全與使用者對 API 的理解。閱讀元件庫時，要把 `.vue` 和 `.d.ts` 一起看。

## 設計啟發

Button 的設計重點是把多種情境收斂成一個穩定入口：

- 普通操作：`<Button @click="save">`
- 視覺語意：`type="primary"`
- 載入狀態：`loading`
- 圖示按鈕：`icon="ios-search"`
- 表單提交：`html-type="submit"`
- 路由跳轉：`to="/users"`
- 群組排列：`<ButtonGroup>`

一個好的 Button 不只是樣式好看，而是能成為整套產品中一致的行動語彙。

## 複習題

1. Button 為什麼需要同時支援 `<button>` 和 `<a>`？
2. `loading` 和 `icon` 同時存在時，為什麼 loading 優先？
3. `itemDisabled` 和 `disabled` 的差異是什麼？
4. ButtonGroup 為什麼只包 slot，而不直接操作子 Button？
5. runtime `shape` 和 d.ts `shape` 的差異會造成什麼使用者體驗問題？
