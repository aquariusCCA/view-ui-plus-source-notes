# Button Public Props Contract：從 runtime props 到 TypeScript contract

## 0. 原始筆記問題分析

原本筆記已經指出要整理 `Button` / `ButtonGroup` 的 public props，但還沒有把 runtime props、mixin props 與 `types/button.d.ts` 放在同一張圖裡。

`Button` 是很適合練習 props contract 的元件，因為它同時包含：

1. 自身宣告的 primitive props。
2. validator 限制的 literal value。
3. 來自 mixin 的 public props。
4. public kebab-case 名稱與 runtime camelCase 名稱的轉換。
5. declaration 比 runtime 寬或窄的小落差。

## 1. 本章定位

本章是一篇 public API 對照筆記，專門分析 `Button` / `ButtonGroup` 對外可以接收哪些 props，以及這些 props 在 runtime source 和 `.d.ts` 中是否一致。

本章不深入講 render output，也不展開 click navigation 流程。render 會放到 `03-render-and-class-mapping.md`，事件與跳轉會放到 `04-state-events-and-navigation.md`。

## 2. 先建立 props 來源觀念

閱讀 View UI Plus 的 props contract 時，不能只看 component 自己的 `props` 區塊。對 `Button` 來說，public props 有三個來源。

| 來源 | 代表檔案 | 對 `Button` 的影響 |
| --- | --- | --- |
| Component runtime props | `src/components/button/button.vue` | 提供 type、shape、size、loading、disabled、htmlType、icon、customIcon、long、ghost。 |
| Link mixin props | `src/mixins/link.js` | 提供 to、replace、target、append。 |
| Type declaration | `types/button.d.ts` | 把使用者可傳入的 props 整理成 TypeScript public surface。 |

`ButtonGroup` 比較單純，主要 props 都直接寫在 `button-group.vue`，再由 `types/button.d.ts` 宣告。

## 3. Button runtime props 對照表

`button.vue` 自身宣告的 props 如下。

| Runtime prop | Runtime 限制 / default | Type declaration | 閱讀重點 |
| --- | --- | --- | --- |
| `type` | `default`、`primary`、`dashed`、`text`、`info`、`success`、`warning`、`error`，預設 `default` | 空字串、`default`、`primary`、`dashed`、`text`、`info`、`success`、`warning`、`error` | declaration 用 union 表達可選值，並額外允許空字串。 |
| `ghost` | `Boolean`，預設 `false` | `boolean` | 透明背景風格，實際視覺在 `button.less`。 |
| `size` | `small`、`large`、`default`，預設讀 `$VIEWUI.size` 或 `default` | 空字串、`large`、`small`、`default` | default 受全域設定影響，但 type 只描述可傳值。 |
| `shape` | `circle`、`circle-outline` | `string` | declaration 比 runtime 寬，TypeScript 不會完整限制合法值。 |
| `long` | `Boolean`，預設 `false` | `boolean` | 產生 `ivu-btn-long`，讓寬度變成 `100%`。 |
| `htmlType` | `button`、`submit`、`reset`，預設 `button` | public prop `html-type`，值為 `button`、`submit`、`reset` | runtime 是 camelCase，public type 使用 kebab-case。 |
| `disabled` | `Boolean` | `boolean` | 會被 `mixins/form.js` 的 `itemDisabled` 再包一層。 |
| `loading` | `Boolean` | `boolean` | 同時影響 class、icon 與 pointer behavior。 |
| `icon` | `String`，預設空字串 | `string` | 傳給內部 `Icon` 的 `type`。 |
| `customIcon` | `String`，預設空字串 | `'custom-icon'?: string` | 傳給內部 `Icon` 的 `custom`。 |

這張表要特別注意兩個命名轉換。

```txt
Public template / type:  html-type
Runtime prop:            htmlType
Instance access:         this.htmlType

Public template / type:  custom-icon
Runtime prop:            customIcon
Instance access:         this.customIcon
```

如果只在 `button.vue` 搜尋 `html-type` 或 `custom-icon`，會以為 runtime 沒有這些 props。正確做法是同時理解 Vue prop 的 kebab-case / camelCase 對應。

## 4. Link mixin props 對照表

`Button` 混入 `mixins/link.js`，所以還會取得下列 props。

| Mixin prop | Runtime 限制 / default | Type declaration | 閱讀重點 |
| --- | --- | --- | --- |
| `to` | `Object` 或 `String` | `string` 或 `object` | 有值時 `Button` 會渲染成 `<a>`。 |
| `replace` | `Boolean`，預設 `false` | `boolean` | router navigation 時使用 `replace` 而不是 `push`。 |
| `target` | `_blank`、`_self`、`_parent`、`_top`，預設 `_self` | `_blank`、`_self`、`_parent`、`_top` | declaration 與 runtime validator 對齊。 |
| `append` | `Boolean`，預設 `false` | `boolean` | 傳給 router resolve，用於相對路由附加。 |

這些 props 不在 `button.vue` 的 props 區塊裡，但對使用者而言仍然是 `Button` 的 public props。`types/button.d.ts` 把它們列進 `Button` declaration 是合理的，因為型別應描述使用者能傳什麼，而不是只描述某個單檔直接宣告了什麼。

## 5. ButtonGroup props 對照表

`ButtonGroup` 的 runtime props 比 `Button` 少。

| Runtime prop | Runtime 限制 / default | Type declaration | 閱讀重點 |
| --- | --- | --- | --- |
| `size` | `small`、`large`、`default`，預設讀 `$VIEWUI.size` 或 `default` | `large`、`small`、`default` | group size 主要透過父層 class 影響子按鈕樣式。 |
| `shape` | `circle`、`circle-outline` | 空字串、`circle` | declaration 漏掉或弱化了 runtime 的 `circle-outline` 可能性。 |
| `vertical` | `Boolean`，預設 `false` | `boolean` | 產生 `ivu-btn-group-vertical`，切換縱向排列。 |

這裡最值得注意的是 `shape`。runtime validator 接受 `circle` 與 `circle-outline`，但 `types/button.d.ts` 中 `ButtonGroup.shape` 只寫 `'' | 'circle'`。這代表 type surface 比 runtime 窄，至少沒有完整表達 runtime validator。

## 6. 全域 size fallback

`Button` 與 `ButtonGroup` 的 `size` default 都會讀：

```js
const global = getCurrentInstance().appContext.config.globalProperties;
return !global.$VIEWUI || global.$VIEWUI.size === '' ? 'default' : global.$VIEWUI.size;
```

這表示使用者不傳 `size` 時，元件可能受全域 `$VIEWUI.size` 影響。

但 `.d.ts` 不會描述這段 default 邏輯，只會描述 `size` 可以傳哪些值。這不是矛盾，因為 type declaration 的責任是描述 public input shape；全域 default 是 runtime 初始化行為。

閱讀時可以分成兩層：

| 層次 | 負責回答 |
| --- | --- |
| Type declaration | 使用者可以傳入哪些合法值。 |
| Runtime default | 使用者沒有傳值時，元件如何決定初始值。 |

## 7. 事件 listener contract

`Button` runtime 宣告：

```js
emits: ['click']
```

`types/button.d.ts` 中則出現：

```ts
onClick?: (event?: any) => any;
```

這是 Vue component declaration 中常見的 listener 表達方式。它不是普通視覺 prop，而是讓 TypeScript 使用者知道可以監聽 click。

需要注意的是，這裡的 `event` 是 `any`，型別精準度不高。從 runtime 看，`handleClickLink(event)` 直接把 DOM click event emit 出去，因此實務上可以把它理解成原生 click event，但 declaration 沒有精準寫成 `MouseEvent`。

## 8. 常見誤區

| 誤區 | 正確理解 |
| --- | --- |
| `button.vue` 沒看到 `to`，所以 `Button` 不支援跳轉 | `to` 來自 `mixins/link.js`，仍然是 public prop。 |
| `.d.ts` 寫 `'html-type'`，runtime 應該也叫 `html-type` | runtime 使用 `htmlType`，public template/type 使用 kebab-case。 |
| `shape?: string` 代表任何 shape 都合理 | runtime validator 只接受特定值，declaration 比 runtime 寬。 |
| `size` 的 default 應該寫進 type union | type union 描述可傳值；全域 default 是 runtime 行為。 |
| `ButtonGroup.size` 會改子元件 props | runtime 沒有傳值給子元件，主要是 group class 讓樣式層套用尺寸規則。 |

## 9. 本章總結

`Button` 的 public props contract 不是單一檔案可以完整回答的問題。`button.vue` 給出自身 props，`mixins/link.js` 擴充 navigation props，`types/button.d.ts` 則站在使用者角度整理 public surface。

閱讀 `Button` 時，最重要的是建立「runtime source、mixin source、type declaration、template naming」之間的對照能力。這比背下每個 prop 更有價值，因為之後閱讀 `Input`、`Cell`、`MenuItem` 這些同樣使用 mixin 或 kebab-case props 的元件時，可以重複使用同一套方法。

## 10. 自我檢查問題

1. `Button` 的 props 可以分成哪三個來源？
2. `htmlType` 在 public template 中通常會寫成什麼？
3. `customIcon` 最後會傳給 `Icon` 的哪個 prop？
4. `Button.shape` 的 runtime validator 和 declaration 有什麼落差？
5. `ButtonGroup.shape` 的 runtime validator 和 declaration 有什麼落差？
6. 為什麼 `to`、`replace`、`target`、`append` 應該被視為 `Button` 的 public props？
7. `size` default 讀 `$VIEWUI.size`，這屬於 type contract 還是 runtime 行為？
