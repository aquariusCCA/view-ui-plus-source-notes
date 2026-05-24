# Button / ButtonGroup Public Props Contract：從 Runtime Props 到 TypeScript 對外契約

## 1. 本章定位

本章是一篇 **public API 對照筆記**，專門整理 `View UI Plus` 中 `Button` 與 `ButtonGroup` 的 props contract。

所謂 public props contract，指的是元件對使用者承諾可以接收的輸入介面。使用者不一定關心某個 prop 是在 `button.vue` 宣告，還是在 mixin 裡宣告；使用者只需要知道：「這個元件可以怎麼用？」但對原始碼閱讀者來說，我們必須進一步追問：「這個對外能力到底從哪裡來？」

因此，本章會把 `Button` / `ButtonGroup` 的 props 分成幾個層次來看：

| 層次 | 主要檔案 | 負責回答的問題 |
| --- | --- | --- |
| Runtime component props | `src/components/button/button.vue`、`src/components/button/button-group.vue` | 元件本身直接宣告了哪些 props？runtime validator 與 default 是什麼？ |
| Mixin props | `src/mixins/link.js` | 元件透過 mixin 額外取得哪些 public props？ |
| Type declaration | `types/button.d.ts` | TypeScript 使用者在型別層面看到哪些可傳入 props？ |
| Public template naming | Vue template 使用方式 | `htmlType` / `customIcon` 這類 camelCase prop 在 template 中應如何書寫？ |
| Runtime behavior | component computed / methods / render | props 傳入後會如何影響 class、tag、事件或樣式？ |

本章的重點會放在前四個層次。至於 `Button` 如何決定輸出 `<button>` 或 `<a>`、如何組合 class、如何處理 click navigation，適合放到後續的 `03-render-and-class-mapping.md` 與 `04-state-events-and-navigation.md` 中深入分析。

---

## 2. 為什麼要先讀 Public Props Contract？

閱讀元件庫原始碼時，很多人會習慣直接打開 `button.vue`，從 props、computed、methods、render 一路往下看。這種方式可以理解單一檔案的邏輯，但不一定能完整理解「元件對使用者開放了什麼能力」。

以 `Button` 為例，如果只看 `button.vue` 自己的 `props` 區塊，你會看到 `type`、`size`、`loading`、`disabled`、`icon` 等常見按鈕屬性，但你可能會漏掉 `to`、`replace`、`target`、`append` 這些 navigation props。這些 props 不是寫在 `button.vue` 自己的 props 區塊中，而是來自 `mixins/link.js`。

這說明一件事：**元件的 public contract 不一定等於單一 component 檔案的 props 區塊。**

對一個成熟元件庫來說，public API 通常會散落在以下位置：

| 位置 | 常見內容 | 閱讀風險 |
| --- | --- | --- |
| Component source | props、computed、methods、render | 只能看到元件直接宣告的內容，可能漏掉 mixin 或共用邏輯。 |
| Mixin / composable | 共用 props、共用方法、共用狀態 | 若沒有追進 mixin，會誤判元件能力不足。 |
| Type declaration | 對外型別介面 | 可能與 runtime validator 有細微落差。 |
| Example / docs | 官方建議用法 | 只能代表常見用法，不一定涵蓋所有 runtime 支援能力。 |
| Unit test | 被測試保護的行為 | 測試覆蓋到的是重要行為，但不一定是完整 contract。 |

因此，本章的閱讀目標不是背下每個 prop，而是建立一套判讀方法：當你閱讀一個元件時，要能把 runtime props、mixin props、`.d.ts` 型別宣告與 template public naming 放在同一張圖中對照。

---

## 3. Button 的 Props 來源總覽

`Button` 的 props contract 可以分成三個主要來源。

第一個來源是 `button.vue` 自身宣告的 props。這些 props 直接描述按鈕的外觀、狀態與原生 button 行為，例如 `type`、`size`、`shape`、`loading`、`disabled`、`htmlType`、`icon`、`customIcon`、`long`、`ghost`。

第二個來源是 `mixins/link.js`。因為 `Button` 混入了 link mixin，所以它額外取得了和跳轉有關的 props，例如 `to`、`replace`、`target`、`append`。這些 props 讓 `Button` 不只可以是普通按鈕，也可以在特定條件下成為具有連結語意的按鈕。

第三個來源是 `types/button.d.ts`。這個檔案站在 TypeScript 使用者角度，整理 `Button` / `ButtonGroup` 對外可以接收的 props。它不一定逐字等於 runtime source，但它代表 TypeScript 層面的 public surface。

| Props 來源 | 代表檔案 | 對 `Button` 的意義 |
| --- | --- | --- |
| Component runtime props | `src/components/button/button.vue` | 定義按鈕本身的基礎外觀、狀態與原生行為 props。 |
| Link mixin props | `src/mixins/link.js` | 讓 `Button` 具備 link / router navigation 相關能力。 |
| Type declaration | `types/button.d.ts` | 將使用者可傳入的 props 整理成 TypeScript public contract。 |

這裡要特別注意：`types/button.d.ts` 的責任是描述「使用者可以傳什麼」，而不是描述「某個單一 runtime 檔案自己宣告了什麼」。所以即使 `to` 沒出現在 `button.vue` 的 props 區塊中，它仍然可以出現在 `Button` 的 TypeScript declaration 中，因為它是透過 mixin 成為 `Button` public API 的一部分。

---

## 4. Button Runtime Props 對照表

`button.vue` 自身宣告的 props 主要負責按鈕的外觀、狀態、圖示與原生 button 行為。這些 props 是閱讀 `Button` contract 的第一層。

| Runtime prop | Runtime 限制 / default | Type declaration | 閱讀重點 |
| --- | --- | --- | --- |
| `type` | 可選 `default`、`primary`、`dashed`、`text`、`info`、`success`、`warning`、`error`，預設 `default` | 空字串、`default`、`primary`、`dashed`、`text`、`info`、`success`、`warning`、`error` | `type` 是按鈕視覺語意的核心 prop。declaration 透過 union 表達合法值，並額外允許空字串。 |
| `ghost` | `Boolean`，預設 `false` | `boolean` | 用於透明背景風格。實際視覺效果不在 props 本身，而是在 Less 樣式中。 |
| `size` | 可選 `small`、`large`、`default`，預設讀 `$VIEWUI.size` 或回到 `default` | 空字串、`large`、`small`、`default` | `size` 的 default 會受到全域設定影響；型別宣告只描述可傳值，不描述 default 計算過程。 |
| `shape` | 可選 `circle`、`circle-outline` | `string` | declaration 比 runtime 寬，TypeScript 不會精準限制只能傳 `circle` 或 `circle-outline`。 |
| `long` | `Boolean`，預設 `false` | `boolean` | 用於產生 `ivu-btn-long`，通常代表按鈕寬度會被樣式處理成滿版或長按鈕效果。 |
| `htmlType` | 可選 `button`、`submit`、`reset`，預設 `button` | public prop `html-type`，值為 `button`、`submit`、`reset` | runtime 使用 camelCase，template / declaration 使用 kebab-case。 |
| `disabled` | `Boolean` | `boolean` | 表示按鈕自身 disabled 狀態；實際判斷還會受到 `mixins/form.js` 的 `itemDisabled` 影響。 |
| `loading` | `Boolean` | `boolean` | 影響 loading class、loading icon 與互動狀態。 |
| `icon` | `String`，預設空字串 | `string` | 傳給內部 `Icon` 元件的 `type`，用於一般 View UI Plus icon。 |
| `customIcon` | `String`，預設空字串 | `'custom-icon'?: string` | 傳給內部 `Icon` 元件的 `custom`，用於自訂 icon class 或自訂圖示來源。 |

這張表的重點不只是列出 props，而是要訓練你同時看三件事：

1. runtime 是否有 validator 或 default；
2. `.d.ts` 是否有精準表達這些限制；
3. public template 名稱是否和 runtime 實例名稱不同。

例如 `type` 屬於限制比較清楚的 prop，runtime validator 與 TypeScript union 大致可以對照。相對地，`shape` 在 runtime 中有明確可選值，但 declaration 寫成 `string`，這代表 TypeScript 層面放得比較寬，使用者可能傳入 runtime 不接受的字串而無法在型別階段被阻擋。

---

## 5. Kebab-case 與 CamelCase：Template 名稱轉換

閱讀 Vue 元件 props 時，一定要理解 kebab-case 與 camelCase 的對應關係。這是原始碼閱讀中很常見的誤區。

在 runtime source 中，JavaScript 物件的 key 通常使用 camelCase，例如：

```txt
htmlType
customIcon
```

但在 Vue template 中，使用者通常會用 kebab-case 傳入：

```vue
<Button html-type="submit" custom-icon="my-icon" />
```

因此，特別整理了兩組對照：

```txt
Public template / type:  html-type
Runtime prop:            htmlType
Instance access:         this.htmlType

Public template / type:  custom-icon
Runtime prop:            customIcon
Instance access:         this.customIcon
```

這組對照要牢記，因為它會直接影響你怎麼搜尋原始碼。

如果你在 `button.vue` 中搜尋 `html-type`，可能找不到結果，因為 runtime source 使用的是 `htmlType`。反過來說，如果你在官方文件或 TypeScript declaration 中看到 `'html-type'`，也不要以為 runtime 一定用這個字串作為 props key。Vue 會幫你處理 template kebab-case 與 runtime camelCase 之間的對應。

這個觀念不只適用於 `Button`。之後閱讀其他 View UI Plus 元件時，只要看到類似 `customIcon`、`activeName`、`modelValue`、`showClose` 這類 camelCase prop，都要想到 template 中可能會以 kebab-case 形式出現。

---

## 6. Link Mixin Props：Button 為什麼可以像連結？

`Button` 除了自身 props，還混入了 `mixins/link.js`。這代表 `Button` 的 public props 不只來自 `button.vue`，也包含 link mixin 提供的 navigation props。

| Mixin prop | Runtime 限制 / default | Type declaration | 閱讀重點 |
| --- | --- | --- | --- |
| `to` | `Object` 或 `String` | `string` 或 `object` | 有值時，`Button` 會具備 link navigation 語意，並可能渲染成 `<a>`。 |
| `replace` | `Boolean`，預設 `false` | `boolean` | router navigation 時使用 `replace` 而不是 `push`。 |
| `target` | `_blank`、`_self`、`_parent`、`_top`，預設 `_self` | `_blank`、`_self`、`_parent`、`_top` | runtime validator 與 declaration 對齊。 |
| `append` | `Boolean`，預設 `false` | `boolean` | 傳給 router resolve，用於相對路由附加。 |

這些 props 的關鍵在於：它們雖然不是 `button.vue` 自己直接宣告，但使用者仍然可以把它們傳給 `Button`。因此，從 public API 的角度，它們必須被視為 `Button` contract 的一部分。

這也是閱讀 mixin 型元件時最重要的原則之一：

> 只要 mixin 把 props 混入 component，這些 props 就會成為該 component 可接收的 public props。

所以當你看到 `Button` 的 TypeScript declaration 中出現 `to`、`replace`、`target`、`append` 時，不應該覺得奇怪。它不是憑空多出來的 API，而是來自 link mixin 的 public surface。

---

## 7. Type Declaration 與 Runtime Validator 的關係

`types/button.d.ts` 的角色是提供 TypeScript public contract。它讓使用者在 TypeScript 專案中使用 `Button` / `ButtonGroup` 時，可以獲得 props 提示與基本型別檢查。

但要注意，`.d.ts` 不一定會百分之百等於 runtime validator。兩者的責任不同：

| 層次 | 主要責任 | 常見限制 |
| --- | --- | --- |
| Runtime validator | 在執行期間驗證或限制 props 值 | 只有程式執行時才會生效，且 validator 嚴格度取決於元件實作。 |
| Type declaration | 在開發階段提供型別提示與型別檢查 | 可能比 runtime 寬，也可能比 runtime 窄，取決於 declaration 是否精準維護。 |

在本章最典型的例子是 `shape`。

`Button.shape` 的 runtime validator 只接受：

```txt
circle
circle-outline
```

但 TypeScript declaration 寫成：

```ts
shape?: string
```

這代表 declaration 比 runtime 寬。TypeScript 可能允許你傳入任意字串，但 runtime validator 並不一定接受。

相反地，`ButtonGroup.shape` 的 runtime validator 接受：

```txt
circle
circle-outline
```

但 `types/button.d.ts` 中的 `ButtonGroup.shape` 只寫：

```ts
'' | 'circle'
```

這代表 declaration 比 runtime 窄，至少沒有完整表達 `circle-outline` 這個 runtime 可接受值。

閱讀這種差異時，不要急著判斷哪邊「一定錯」。更精準的說法是：

- runtime validator 表示元件執行時實際接受的值；
- TypeScript declaration 表示型別層面目前宣告給使用者看的值；
- 如果兩者不同，就要記錄為 contract 落差，後續可以查版本、issue、commit 或實際 source 進一步確認。

---

## 8. ButtonGroup Props Contract

`ButtonGroup` 的 props 比 `Button` 少，而且邏輯也比較集中。它主要提供群組外觀控制，而不是單顆按鈕的狀態控制。

| Runtime prop | Runtime 限制 / default | Type declaration | 閱讀重點 |
| --- | --- | --- | --- |
| `size` | 可選 `small`、`large`、`default`，預設讀 `$VIEWUI.size` 或回到 `default` | `large`、`small`、`default` | group size 主要透過父層 class 影響子按鈕樣式，而不是把 prop 傳給每個子按鈕。 |
| `shape` | 可選 `circle`、`circle-outline` | 空字串、`circle` | declaration 沒有完整覆蓋 runtime 的 `circle-outline`。 |
| `vertical` | `Boolean`，預設 `false` | `boolean` | 產生 `ivu-btn-group-vertical`，用於切換縱向排列樣式。 |

理解 `ButtonGroup` 時，要特別注意它和 `Button` 的分工。`ButtonGroup` 本身不是「管理一組 Button 狀態的控制器」，它更像是一個樣式容器。它透過父層 class 讓 Less selector 影響子按鈕的排列、邊框與圓角。

因此，`ButtonGroup.size` 並不是透過 provide / inject 或 props forwarding 主動改寫每個子 `Button` 的 `size` prop。group size 主要是透過父層 class 影響子按鈕樣式。這一點對後續閱讀 `button.less` 很重要，否則會誤以為 `button-group.vue` 應該要主動遍歷 slot children。

---

## 9. 全域 Size Fallback：Type Contract 與 Runtime Default 要分開看

`Button` 與 `ButtonGroup` 的 `size` default 都會讀全域設定。runtime 邏輯如下：

```js
const global = getCurrentInstance().appContext.config.globalProperties;
return !global.$VIEWUI || global.$VIEWUI.size === '' ? 'default' : global.$VIEWUI.size;
```

這段程式代表：當使用者沒有明確傳入 `size` 時，元件可能會參考全域 `$VIEWUI.size`。如果全域設定不存在，或 `$VIEWUI.size` 是空字串，就回到 `default`。

這裡很容易產生一個誤解：既然 default 會讀 `$VIEWUI.size`，那 `.d.ts` 是否也應該描述這段邏輯？

答案是否定的。`.d.ts` 的主要責任是描述「使用者可以傳什麼值」，而不是描述「使用者沒傳時 runtime 怎麼算 default」。

你可以把它拆成兩層理解：

| 層次 | 問題 | 本章例子 |
| --- | --- | --- |
| Type declaration | 使用者可以傳哪些合法值？ | `size` 可傳 `large`、`small`、`default`，部分 declaration 也允許空字串。 |
| Runtime default | 使用者沒有傳值時，元件如何決定初始值？ | 讀取 `global.$VIEWUI.size`，否則回到 `default`。 |

這種拆法很重要。之後閱讀其他元件時，你也會看到很多 default function、global config 或 context fallback。這些都屬於 runtime 初始化行為，不應該和 TypeScript props union 混為一談。

---

## 10. Click Listener Contract：`onClick` 不是普通視覺 Prop

`Button` runtime 宣告：

```js
emits: ['click']
```

而 `types/button.d.ts` 中則出現：

```ts
onClick?: (event?: any) => any;
```

這裡要理解 Vue component declaration 中常見的事件 listener 表達方式。`onClick` 不是用來控制按鈕外觀的普通 prop，而是 TypeScript 層面對事件監聽的描述。

在 Vue template 中，使用者通常會寫：

```vue
<Button @click="handleClick">送出</Button>
```

在型別宣告或 JSX / TSX 語境中，事件可能會被表達成類似 `onClick` 的 listener prop。因此，`types/button.d.ts` 出現 `onClick?: (event?: any) => any`，代表 TypeScript 使用者可以監聽 click 事件。

這裡的 `event` 型別是 `any`，精準度不高。從 runtime 行為來看，click handler 會把 DOM click event emit 出去，因此實務上可以把它理解為原生 click event；但因為 declaration 沒有寫成 `MouseEvent`，所以型別層面並沒有提供更精準的事件物件提示。

閱讀時可以這樣記：

| 觀察點 | 解釋 |
| --- | --- |
| `emits: ['click']` | runtime 宣告此元件會發出 click 事件。 |
| `onClick?: (event?: any) => any` | TypeScript declaration 描述使用者可以監聽 click。 |
| `event?: any` | 事件型別較寬，沒有精準到 `MouseEvent`。 |

---

## 11. 常見誤區整理

以下整理本章最容易出錯的地方。這些誤區不是只針對 `Button`，而是閱讀 Vue 元件庫 props contract 時反覆會遇到的問題。

| 誤區 | 正確理解 |
| --- | --- |
| `button.vue` 沒看到 `to`，所以 `Button` 不支援跳轉 | `to` 來自 `mixins/link.js`，只要 mixin 被混入，就應視為 `Button` 的 public prop。 |
| `.d.ts` 寫 `'html-type'`，runtime props 應該也叫 `html-type` | runtime 使用 `htmlType`，public template / type 層面可使用 kebab-case `html-type`。 |
| `shape?: string` 代表任何 shape 都是合理值 | TypeScript declaration 比 runtime 寬；runtime validator 仍然只接受特定值。 |
| `ButtonGroup.shape` 沒寫 `circle-outline`，所以 runtime 不支援 | runtime validator 支援 `circle-outline`，這裡是 declaration 沒完整表達 runtime。 |
| `size` 的 default 邏輯應該寫進 type union | type union 描述可傳值；全域 fallback 屬於 runtime default 行為。 |
| `ButtonGroup.size` 會直接改每個子 Button 的 `size` prop | 它主要透過父層 class 與 Less selector 影響子按鈕樣式。 |
| `onClick` 是普通 prop | `onClick` 在 declaration 中主要表示 click listener contract。 |

---

## 12. 建議閱讀路線

這份筆記的主題是 props contract，因此閱讀順序應該從「對外介面」開始，而不是直接鑽進 render function。

建議按照以下順序閱讀：

1. 先讀 `types/button.d.ts`，建立 `Button` / `ButtonGroup` 的 public API 地圖。
2. 再讀 `src/components/button/button.vue` 的 props 區塊，確認 `Button` 自身直接宣告了哪些 props。
3. 接著讀 `src/mixins/link.js`，補上 `to`、`replace`、`target`、`append` 這些 navigation props 的來源。
4. 回到 `button.vue`，觀察這些 props 如何被 computed、methods 或 render 使用。
5. 讀 `src/components/button/button-group.vue`，確認 `ButtonGroup` 自身 props 很少，主要輸出 group wrapper class。
6. 對照 `types/button.d.ts`，標記 runtime validator 與 declaration 不一致的地方。
7. 最後再讀 `button.less` 與相關 style mixins，確認 `size`、`shape`、`vertical` 等 props 如何透過 class 影響畫面。

這個順序的好處是：你會先建立 public contract，再回頭看 runtime 如何實作 contract。這比一開始就逐行閱讀 render function 更適合建立元件庫閱讀能力。

---

## 13. 本章總結

`Button` / `ButtonGroup` 的 public props contract 不是單一檔案可以完整回答的問題。`button.vue` 定義了按鈕自身的外觀、狀態與原生 button 行為 props；`mixins/link.js` 讓 `Button` 額外取得 navigation props；`button-group.vue` 定義了 group 層級的 `size`、`shape` 與 `vertical`；`types/button.d.ts` 則把這些能力整理成 TypeScript 使用者看到的 public surface。

本章最重要的學習成果有三個。

第一，要學會把 props 來源分層。component 自身 props、mixin props 與 type declaration 都可能構成 public API。

第二，要學會判讀 runtime 與 `.d.ts` 的差異。當 declaration 比 runtime 寬或窄時，應該記錄為 contract 落差，而不是直接忽略。

第三，要理解 Vue 的 public naming 與 runtime naming。`html-type` / `htmlType`、`custom-icon` / `customIcon` 這類對應，是閱讀 Vue 元件庫不可缺少的基本功。

掌握這套方法後，之後閱讀 `Input`、`Cell`、`MenuItem` 或其他使用 mixin、全域設定、型別宣告的 View UI Plus 元件時，就可以用同一套流程建立 public API 地圖。

---

## 14. 自我檢查問題

1. 為什麼閱讀 `Button` 的 public props contract 不能只看 `button.vue`？
2. `Button` 的 props 可以分成哪三個主要來源？
3. `to`、`replace`、`target`、`append` 是從哪個檔案成為 `Button` public props 的？
4. `htmlType` 在 template 中通常會寫成什麼？為什麼？
5. `customIcon` 在 template 中通常會寫成什麼？它最後會傳給內部 `Icon` 的哪個 prop？
6. `Button.shape` 的 runtime validator 與 TypeScript declaration 有什麼落差？
7. `ButtonGroup.shape` 的 runtime validator 與 TypeScript declaration 有什麼落差？
8. 為什麼 `size` 的全域 fallback 屬於 runtime default，而不是 type contract？
9. `emits: ['click']` 與 `onClick?: (event?: any) => any` 分別代表什麼？
10. 如果 `.d.ts` 和 runtime validator 不一致，閱讀筆記中應該如何記錄？

---

## 15. 後續延伸方向

本章只處理 props contract，還沒有深入展開 props 如何影響畫面與行為。後續可以拆成以下幾篇筆記。

| 延伸主題 | 建議檔名 | 研究重點 |
| --- | --- | --- |
| Render 與 class mapping | `03-render-and-class-mapping.md` | 分析 `classes`、`tagName`、`tagProps`、loading icon、default slot 與 `<button>` / `<a>` 的輸出差異。 |
| 狀態、事件與 navigation | `04-state-events-and-navigation.md` | 分析 click flow、`handleCheckClick()`、router navigation、`replace`、`target` 與 disabled / loading 的互動。 |
| ButtonGroup 樣式機制 | `05-button-group-style-mechanism.md` | 分析 group class 如何透過 Less selector 影響子按鈕的邊框、圓角、排列與尺寸。 |
| Form disabled 整合 | `06-form-disabled-integration.md` | 分析 `mixins/form.js` 的 `itemDisabled` 如何讓上層 Form 狀態影響 Button。 |
| Runtime 與 TypeScript contract 差異盤點 | `07-contract-gap-review.md` | 系統整理 runtime validator 與 `.d.ts` 不一致的地方，並標註需要後續確認的版本或修正可能。 |

---

## 16. 本章關鍵速查表

最後用一張表收斂本章的核心觀念，方便日後回查。

| 主題 | 重點 |
| --- | --- |
| `Button` 自身 props | `type`、`ghost`、`size`、`shape`、`long`、`htmlType`、`disabled`、`loading`、`icon`、`customIcon`。 |
| Link mixin props | `to`、`replace`、`target`、`append`，雖然不在 `button.vue` props 區塊，但仍是 public props。 |
| `ButtonGroup` props | `size`、`shape`、`vertical`，主要透過 group class 影響樣式。 |
| 命名轉換 | `html-type` 對應 `htmlType`，`custom-icon` 對應 `customIcon`。 |
| Runtime vs declaration | runtime validator 表示執行時接受值；`.d.ts` 表示型別層面的 public surface。 |
| 重要落差 | `Button.shape` declaration 比 runtime 寬；`ButtonGroup.shape` declaration 沒完整表達 `circle-outline`。 |
| 全域 size | `$VIEWUI.size` 是 runtime default fallback，不是 type union 的責任。 |
| Click listener | `emits: ['click']` 是 runtime 事件宣告；`onClick?: (event?: any) => any` 是 TypeScript listener contract。 |
