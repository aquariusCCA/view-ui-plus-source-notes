# Component Props Contract：從 Runtime Props 到 `DefineComponent`

## 0. 原始筆記問題分析

這份原始筆記已經抓到 `06-type-system/` 中非常重要的一個切入點：View UI Plus 的元件在 runtime 多數透過 Vue Options API 宣告 `props`，但對 TypeScript 使用者暴露出來的型別契約，主要寫在 `types/*.d.ts` 的 `DefineComponent<{ ... }>` 裡。因此，要理解 props 型別，不能只看 Vue SFC，也不能只看 declaration file，而要把 runtime source 與 type surface 放在一起比對。

不過，若要將這份筆記放進長期維護的 `06-type-system/` 目錄，原始版本還可以再補強幾個部分。

第一，原始筆記已有 `Button` 的 runtime / type 對照，但它比較像「觀察紀錄」。本章需要把這些觀察整理成一套可重複使用的閱讀方法，讓後續分析 `Input`、`Table`、`Form` 或其他元件時，也能照同一個框架判斷型別契約是否精準。

第二，原始筆記已經提到 `kebab-case`、validator、default value、mixin props 與弱型別 props，但每一塊還可以補上更清楚的心智模型。例如 `validator` 和 literal union 的關係，不只是「有沒有對齊」，而是牽涉到 TypeScript 是否能提前攔截非法值；`default` 則不一定屬於 type contract，而是 runtime 行為的一部分。

第三，原始筆記提到 `DefineComponent<{ ... }>` 裡同時包含 props 與 listener props，例如 `onClick`。這是後續 `emits` 型別筆記的重要銜接點。本章應明確界定：本章先專注於 props，listener props 只先標註其存在，完整事件型別會留到下一章處理。

第四，原始筆記指出 `Button` 使用 `mixinsLink`、`mixinsForm`，並且 `to`、`replace`、`target`、`append` 這類 props 來自 mixin。這裡需要補充一個重要閱讀原則：元件的 public props 不一定都寫在元件本身的 `props` 區塊中，mixin、全域設定與內部轉接邏輯都可能影響元件對外可用的 props。

第五，部分資訊仍需要後續確認。例如 `mixinsForm` 對 `Button` 的實際影響、其他元件是否也採同樣的 declaration 風格、以及 `shape?: string` 這類寬鬆型別是否是歷史相容、維護成本或文件設計取捨。本章可以先建立閱讀方法，但不應假裝已完整驗證所有元件。

---

## 1. 本章定位

本章是 `06-type-system/` 目錄中的 props 型別專章，用來說明 View UI Plus v1.3.20 如何把 runtime props 轉換成 TypeScript 使用者看到的 props contract。

在前一章 `01-type-system-overview` 中，我們已經建立一個基本觀念：View UI Plus 的 runtime source 主要在 `src/components/**`，而 TypeScript contract 主要在 `types/*.d.ts`。本章接著聚焦其中最常見、也最容易被使用者接觸到的一層：component props。

本章要回答幾個問題：

1. 元件在 runtime 的 `props` 宣告，如何對應到 `types/*.d.ts` 裡的 `DefineComponent<{ ... }>`？
2. 為什麼 runtime 使用 `htmlType`，但 declaration 中會出現 `'html-type'`？
3. props validator 和 TypeScript literal union 有什麼關係？
4. 為什麼 default value、global fallback 不一定會完整出現在 `.d.ts`？
5. mixin 注入的 props 為什麼也屬於元件的 public props？
6. `object`、`Function`、`any[]` 這些弱型別 props 應該如何判讀？

本章不處理所有 TypeScript 型別議題。`emits`、listener props、slots、component instance methods、imperative public API，以及泛型改良機會，會放到後續章節繼續拆解。本章只先建立「如何閱讀 props contract」的主軸。

---

## 2. 學習前先建立的基本觀念

### 2.1 Runtime props 與 Type declaration props 是兩個不同層面

閱讀 View UI Plus 的 props 型別時，第一個要分清楚的是：runtime props 和 type declaration props 並不是同一份資料。

runtime props 是 Vue 元件真正執行時使用的宣告，通常出現在 `src/components/**` 裡。它決定元件在瀏覽器執行時如何接收 props、如何套用 default、如何做 validator 檢查，以及元件內部如何透過 `this.xxx` 或 setup context 使用這些值。

type declaration props 則是 TypeScript 編譯期看到的契約，通常出現在 `types/*.d.ts` 裡。它負責告訴 TypeScript、IDE、Volar 或 TSX 使用者：這個元件可以傳哪些 props，每個 prop 的型別大概是什麼，哪些值是合法的。

兩者回答的問題不同：

| 層面 | 主要位置 | 回答的問題 |
| --- | --- | --- |
| Runtime props | `src/components/**` | 元件實際執行時接收什麼、如何驗證、如何給預設值 |
| Type declaration props | `types/*.d.ts` | TypeScript 使用者在編譯期可以看到哪些 props 型別 |
| Public contract | runtime + declaration 的交集與差異 | 使用者真正能依賴到什麼程度 |

因此，看到 `.d.ts` 有某個 prop，不代表 runtime 一定完全照同樣的限制執行；看到 runtime 有某個 prop，也不代表 TypeScript 一定能完整提示。

---

### 2.2 Options API 的 `props` 是 runtime contract 的入口

View UI Plus v1.3.20 的許多元件仍以 Options API 寫法為主。典型 runtime props 會長得像這樣：

```js
export default {
    props: {
        type: {
            validator (value) {
                return ['default', 'primary'].includes(value);
            },
            default: 'default'
        },
        disabled: Boolean
    }
}
```

這段程式碼包含三類資訊：

1. `type` 代表 prop 名稱。
2. `validator` 代表 runtime 可接受的值。
3. `default` 代表使用者沒有傳值時，runtime 如何決定預設值。
4. `Boolean`、`String`、`Number`、`Object` 等建構子代表基本 runtime 型別檢查。

但 TypeScript 不會自動從這段 JavaScript 裡推導出完整 `.d.ts`。View UI Plus 對外提供的 TypeScript contract，主要仍是由 `types/*.d.ts` 中的 declaration 描述。

---

### 2.3 `DefineComponent<{ ... }>` 是 TypeScript 使用者看到的元件外殼

在 View UI Plus 的 declaration file 中，元件通常會被宣告成：

```ts
import type { DefineComponent } from 'vue';

export declare const Button: DefineComponent<{
    type?: '' | 'default' | 'primary';
    disabled?: boolean;
}>
```

這種寫法的重點不是要完整展示 Vue `DefineComponent` 的所有泛型能力，而是用第一個 object 參數描述使用者可以傳入元件的外部屬性。對閱讀 View UI Plus 型別來說，這個 object 可以先理解成「元件的 public type surface」。

不過要注意，這個 object 不一定只包含 props。原始筆記已指出，`Button` 的 declaration 中也有 `onClick?: (event?: any) => any`。這類 `onXxx` 欄位比較接近事件 listener props，應該放到 `emits` 型別章節繼續分析。本章會先把它視為「出現在同一個 object 裡，但暫時不展開的事件相關欄位」。

---

### 2.4 Public prop name、runtime prop name、instance access 可能不同

Vue template 中常用 `kebab-case` 傳入 props：

```vue
<Button html-type="submit" custom-icon="my-icon" />
```

但元件 runtime source 裡，通常以 `camelCase` 宣告 props：

```js
props: {
    htmlType: { /* ... */ },
    customIcon: String
}
```

元件內部使用時，通常也是 camelCase：

```js
this.htmlType
this.customIcon
```

因此閱讀 props contract 時，要把三種名稱分開：

| 視角 | 名稱形式 | 範例 |
| --- | --- | --- |
| Template / public type | `kebab-case` | `html-type`、`custom-icon` |
| Runtime prop declaration | `camelCase` | `htmlType`、`customIcon` |
| Instance access | `camelCase` | `this.htmlType`、`this.customIcon` |

View UI Plus 的 `.d.ts` 多數採用 template/public 視角，因此會看到 `'html-type'?: ...` 這類帶引號的屬性名稱。

---

### 2.5 Type contract 不等於完整 runtime 行為說明

TypeScript declaration 的主要任務是描述「使用者可以怎麼用」，不是完整描述「元件內部如何運作」。

例如 `Button.size` 的 declaration 可能只寫：

```ts
size?: '' | 'large' | 'small' | 'default';
```

但 runtime default 可能會讀取 `$VIEWUI.size` 作為全域 fallback。這個 fallback 是 runtime 行為，不一定會被完整編碼進 `.d.ts`。

因此閱讀 props 時要分清楚：

| 類型 | 代表意義 |
| --- | --- |
| Prop type | 使用者可以傳入什麼型別或值 |
| Validator | runtime 允許或警告哪些值 |
| Default | 使用者未傳入時 runtime 如何補值 |
| Global fallback | plugin 或全域設定如何影響預設行為 |
| Declaration precision | `.d.ts` 是否精準表達 runtime 限制 |

---

## 3. 整體概覽

View UI Plus 的 component props contract 可以用以下路線理解：

```txt
使用者寫法
  -> <Button html-type="submit" custom-icon="my-icon" />

TypeScript / IDE 看到
  -> types/button.d.ts
  -> export declare const Button: DefineComponent<{ ... }>

Runtime 實際執行
  -> src/components/button/button.vue
  -> props: { htmlType, customIcon, size, shape, ... }

Shared runtime props
  -> src/mixins/link.js
  -> to, replace, target, append

Global default / fallback
  -> app.config.globalProperties.$VIEWUI
  -> 影響 size 等預設值
```

這條路線顯示，props contract 不是單一檔案可以完全回答的問題，而是至少涉及四層：

| 層級 | 代表位置 | 職責 | 閱讀重點 |
| --- | --- | --- | --- |
| Public usage | Vue template / TSX | 使用者實際傳 props 的方式 | 名稱多半使用 kebab-case 或 JSX prop naming |
| Type surface | `types/*.d.ts` | 提供 TypeScript props 型別 | 看 literal union、primitive、object、Function、any |
| Runtime source | `src/components/**` | 真正執行 props、default、validator | 看 `props`、`validator`、`default`、內部使用方式 |
| Shared source | `src/mixins/**`、global config | 補充元件自身沒直接宣告的來源 | mixin props、全域 fallback、共用行為 |

本章的核心任務，就是建立一套對照方法，讓你在閱讀任一元件時都能回答：

> 這個 prop 在 runtime 實際支援什麼？在 TypeScript declaration 中被描述到什麼程度？兩者是否同步？如果不同，是精準度不足、命名轉換、還是 runtime 行為本來就不適合寫進 type contract？

---

## 4. 核心內容逐步講解

### 4.1 `types/button.d.ts` 的基本形狀

以原始筆記中的 `types/button.d.ts` 為例，`Button` declaration 大致如下：

```ts
import type { DefineComponent } from 'vue';

export declare const Button: DefineComponent<{
    type?: '' | 'default' | 'primary' | 'dashed' | 'text' | 'info' | 'success' | 'warning' | 'error';
    ghost?: boolean;
    size?: '' | 'large' | 'small' | 'default';
    shape?: string;
    long?: boolean;
    'html-type'?: 'button' | 'submit' | 'reset';
    disabled?: boolean;
    loading?: boolean;
    icon?: string;
    'custom-icon'?: string;
    to?: string | object;
    replace?: boolean;
    target?: '_blank' | '_self' | '_parent' | '_top';
    append?: boolean;
    onClick?: (event?: any) => any;
}>
```

這段 declaration 可以拆成幾種不同類型的資訊。

第一類是一般 props，例如 `type`、`ghost`、`size`、`shape`、`long`、`disabled`、`loading`、`icon`。這些是使用者最直覺會傳給元件的屬性。

第二類是命名被轉成 public template 視角的 props，例如 `'html-type'` 與 `'custom-icon'`。它們對應到 runtime 的 `htmlType` 與 `customIcon`。

第三類是來自 mixin 的 props，例如 `to`、`replace`、`target`、`append`。它們不一定直接寫在 `button.vue` 的 `props` 區塊，但對使用者來說仍然是 `Button` 可使用的 props。

第四類是 listener props，例如 `onClick`。它被放在同一個 `DefineComponent<{ ... }>` object 裡，但語意上更接近事件監聽器。這部分本章先不深入，後續會在 `emits` contract 中處理。

---

### 4.2 `Button` 的 runtime props 與 type declaration 對照

`Button` 是觀察 props contract 的好例子，因為它同時包含 primitive props、literal union props、validator props、kebab-case props、mixin props，以及寬鬆型別 props。

| Runtime prop | Runtime 寫法 / 來源 | Type declaration | 對齊觀察 |
| --- | --- | --- | --- |
| `type` | validator: `default`、`primary`、`dashed`、`text`、`info`、`success`、`warning`、`error` | `'' | 'default' | 'primary' | 'dashed' | 'text' | 'info' | 'success' | 'warning' | 'error'` | declaration 用 literal union 表達可選值，並額外包含空字串 |
| `shape` | validator: `circle`、`circle-outline` | `string` | declaration 比 runtime validator 更寬，TypeScript 無法提前攔截非法值 |
| `size` | validator: `small`、`large`、`default`，default 會讀 `$VIEWUI.size` | `'' | 'large' | 'small' | 'default'` | declaration 表達可傳值，但不描述 global fallback |
| `loading` | `Boolean` | `boolean` | 基本對齊 |
| `disabled` | `Boolean` | `boolean` | 基本對齊 |
| `htmlType` | validator: `button`、`submit`、`reset` | `'html-type'?: 'button' | 'submit' | 'reset'` | runtime 是 camelCase，public type 用 kebab-case |
| `customIcon` | `String` | `'custom-icon'?: string` | runtime 是 camelCase，public type 用 kebab-case |
| `to` | 來自 `mixins/link.js` | `to?: string | object` | declaration 展開 mixin props |
| `replace` | 來自 `mixins/link.js` | `replace?: boolean` | declaration 展開 mixin props |
| `target` | 來自 `mixins/link.js` | `target?: '_blank' | '_self' | '_parent' | '_top'` | declaration 用 literal union 限制可選值 |
| `append` | 來自 `mixins/link.js` | `append?: boolean` | declaration 展開 mixin props |

這個表格的價值不只是整理 `Button`，而是建立一個閱讀模板。之後遇到任何 View UI Plus 元件時，都可以用同樣角度比對：

1. `.d.ts` 是否列出所有 public props？
2. runtime props 是否有 validator？
3. validator 是否被轉成 literal union？
4. `.d.ts` 是否比 runtime 更寬或更窄？
5. props 是否來自 mixin？
6. default value 是否受到全域設定影響？
7. 命名是否從 camelCase 轉成 kebab-case？

---

### 4.3 Kebab-case public props：為什麼 `.d.ts` 寫 `'html-type'`

Vue template 中，使用者通常會以 kebab-case 使用多字 props：

```vue
<Button html-type="submit" custom-icon="my-icon" />
```

但元件內部 runtime source 通常是 camelCase：

```js
props: {
    htmlType: {
        validator (value) {
            return ['button', 'submit', 'reset'].includes(value);
        }
    },
    customIcon: String
}
```

因此 `types/button.d.ts` 使用以下寫法：

```ts
'html-type'?: 'button' | 'submit' | 'reset';
'custom-icon'?: string;
```

這種 declaration 是站在 public usage 的角度，而不是元件內部實作的角度。它讓 template 使用者在閱讀型別時更直覺，也讓型別提示貼近文件或 template 寫法。

不過，閱讀 source 時必須在腦中完成名稱轉換：

```txt
Public type / template:  html-type
Runtime prop:            htmlType
Instance access:         this.htmlType
```

這個轉換非常重要。若只在 `button.vue` 裡搜尋 `html-type`，可能找不到 props 宣告；若只在 `.d.ts` 裡搜尋 `htmlType`，也可能以為 declaration 漏寫。正確做法是同時理解 Vue 的 prop naming convention，以及 View UI Plus declaration 採用的 public naming strategy。

---

### 4.4 Validator 與 literal union：型別精準度的核心判斷

props validator 是 runtime 的值域限制，TypeScript literal union 則是 compile-time 的值域限制。理想情況下，兩者可以互相對齊。

例如 `htmlType` runtime validator 只接受：

```txt
button / submit / reset
```

而 declaration 寫成：

```ts
'html-type'?: 'button' | 'submit' | 'reset';
```

這種情況屬於相對精準的 type contract。TypeScript 可以在開發階段提示合法值，也能在部分情境中提前攔截明顯錯誤。

相反地，`Button.shape` 的 runtime validator 只接受：

```txt
circle / circle-outline
```

但 declaration 寫成：

```ts
shape?: string;
```

這就代表 type surface 比 runtime 寬。TypeScript 只知道 `shape` 是字串，卻不知道哪些字串合法。因此使用者可能寫出：

```vue
<Button shape="square" />
```

從 TypeScript declaration 角度看，`square` 是 `string`，可能不會被攔截；但從 runtime validator 角度看，它不一定是合法值。

這種落差可以整理成四種判斷：

| 對照結果 | 意義 | 對使用者的影響 |
| --- | --- | --- |
| validator 與 literal union 一致 | 型別契約精準 | IDE 可提示合法值，TypeScript 可提前攔截錯誤 |
| declaration 比 validator 寬 | 型別契約寬鬆 | TS 可能放過非法值，runtime 才警告或 fallback |
| declaration 比 runtime 窄 | 型別契約過嚴 | TS 可能阻止 runtime 實際支援的值 |
| runtime 沒 validator，但 declaration 有 union | 型別比 runtime 嚴格 | 需要確認是否來自文件承諾或歷史 API 設計 |

閱讀 View UI Plus props 時，最有價值的工作不是單純記住每個 prop，而是判斷這個 prop 的 declaration 精準度屬於哪一種。

---

### 4.5 Default value 不一定屬於 type contract

`Button.size` 是理解 default 與 type contract 差異的好例子。原始筆記指出，runtime default 會讀取全域設定：

```js
default () {
    const global = getCurrentInstance().appContext.config.globalProperties;
    return !global.$VIEWUI || global.$VIEWUI.size === '' ? 'default' : global.$VIEWUI.size;
}
```

但 `.d.ts` 只描述：

```ts
size?: '' | 'large' | 'small' | 'default';
```

這不是矛盾，而是兩者負責的事情不同。

`size?: ...` 表示使用者可以傳哪些值，以及這個 prop 是 optional。它不需要完整描述「使用者不傳時，runtime 會如何從 `$VIEWUI.size` 推導預設值」。因為 default value 是 runtime 行為，通常屬於元件內部初始化邏輯，而不是 props 型別本身。

可以把這幾個層次分開看：

| 層次 | 例子 | 負責回答 |
| --- | --- | --- |
| Type declaration | `size?: '' | 'large' | 'small' | 'default'` | 使用者可以傳什麼 |
| Runtime validator | `small`、`large`、`default` | runtime 接受什麼 |
| Runtime default | 讀 `$VIEWUI.size`，否則回到 `default` | 使用者不傳時用什麼 |
| Global fallback | plugin 全域設定 `$VIEWUI.size` | 全域設定如何影響元件預設值 |

因此，閱讀 props contract 時，不應要求 `.d.ts` 完整承載所有 runtime default 邏輯。真正要檢查的是：`.d.ts` 是否正確描述「使用者可以主動傳入的值」。

---

### 4.6 Mixin props 也屬於元件的 public props

原始筆記指出，`Button` runtime 使用：

```js
mixins: [ mixinsLink, mixinsForm ]
```

這表示 `Button` 的 props 不一定全部直接寫在 `button.vue` 裡。像 `to`、`replace`、`target`、`append` 這些 props，原始筆記判斷它們來自 `mixins/link.js`，但它們仍然出現在 `types/button.d.ts` 中：

```ts
to?: string | object;
replace?: boolean;
target?: '_blank' | '_self' | '_parent' | '_top';
append?: boolean;
```

這裡要建立一個重要觀念：

> Public props 是使用者能傳給元件的 props，不等於元件單一檔案中直接宣告的 props。

如果一個元件透過 mixin 合併 props，對使用者來說，那些 props 仍然是元件 API 的一部分。TypeScript declaration 必須把這些 props 展開到 component declaration，否則使用者在 TypeScript 或 IDE 中就看不到完整的 public contract。

閱讀時要避免只做這件事：

```txt
只打開 src/components/button/button.vue
只搜尋 props: { ... }
看到沒有 to / replace / target / append
就以為 Button 不支援這些 props
```

正確做法是：

```txt
1. 先看 component 本身 props
2. 再看 mixins
3. 再看 declaration 是否把 mixin props 展開
4. 最後判斷 type surface 是否完整反映 public props
```

關於 `mixinsForm` 的實際 props 或行為，原始筆記沒有提供完整內容，因此本章只標註它是 `Button` runtime mixin 之一。此處需要後續補充：應回到 `src/mixins/form` 或實際專案 source，確認它是否提供 props、方法、表單上下文注入，或只是提供共用行為。

---

### 4.7 弱型別 props：不是一定錯，但要知道失去什麼

View UI Plus 的 `.d.ts` 中，有些 props 使用 `object`、`Function`、`any[]` 或單純 `string`。這些型別不一定代表錯誤，但代表 TypeScript contract 的精準度有限。

常見弱型別寫法如下：

| 寫法 | 例子 | 失去的資訊 |
| --- | --- | --- |
| `object` | `styles?: object`、`model?: object` | 不知道物件有哪些欄位、哪些欄位必填 |
| `any[]` | `data?: any[]`、`columns?: any[]` | 不知道陣列元素 shape，無法保護欄位名稱 |
| `Function` | `render?: Function`、`before-close?: Function` | 不知道參數、this 綁定、回傳值 |
| `string` | 某些實際有枚舉語意的 prop | 無法限制合法字串集合 |

這通常是 UI library declaration 的維護取捨。精準型別可以提供更好的 IDE 提示與錯誤檢查，但也會增加維護成本，尤其是像 `Table.columns`、`Form.rules`、`render` function 這種 shape 複雜、版本演進容易變動的 API。

因此看到弱型別時，可以用以下方式判斷：

| 判斷問題 | 說明 |
| --- | --- |
| 這個 prop 是否真的有固定 shape？ | 如果有，理論上可以進一步抽成 interface |
| 這個 prop 是否高度動態？ | 如果是，使用 `object` 或 `any[]` 可能是相容性取捨 |
| 這個 prop 是否影響使用者體驗很大？ | 若是核心 API，弱型別會降低 IDE 幫助 |
| 是否適合後續重構成泛型？ | 例如 `Table` 的 `data` 與 `columns` 可能有泛型改善空間 |

本章只先建立判讀方法，不直接重構 View UI Plus 的 declaration。後續如果要研究泛型設計，可以把這些弱型別 props 當作改善候選點。

---

### 4.8 Props contract 的精準度分級

閱讀元件 props 時，可以把每個 prop 的 type contract 分成四個層級。

| 層級 | 特徵 | 例子 | 閱讀重點 |
| --- | --- | --- | --- |
| 精準契約 | runtime validator 與 declaration union 大致對齊 | `'html-type'?: 'button' | 'submit' | 'reset'` | 可以信任 TypeScript 提供合法值提示 |
| 半精準契約 | declaration 描述大類型，但不描述全部語意 | `to?: string | object` | 知道值的大方向，但不知道 object shape |
| 寬鬆提示 | declaration 明顯比 runtime 寬 | `shape?: string` | TS 只提示型別，不限制合法值 |
| 弱契約 | 使用 `any`、`any[]`、`Function`、`object` | `data?: any[]`、`render?: Function` | 幾乎放棄細節保護，需要看文件或 source |

這個分級能幫助你在筆記中避免只寫「有型別」或「沒型別」這種二分法。更準確的說法應該是：

> 這個 prop 有 declaration，但它的契約強度是高、中、低，還是幾乎只提供存在提示。

---

### 4.9 建議的 props 閱讀紀錄模板

之後分析每個元件時，可以用固定格式記錄 props contract。

```md
## Component：元件名稱

### 1. Type declaration 位置

- `types/xxx.d.ts`

### 2. Runtime source 位置

- `src/components/xxx/xxx.vue`
- 相關 mixins：`src/mixins/...`

### 3. Props 對照表

| Public prop | Runtime prop | Type declaration | Runtime validator / default | 來源 | 精準度 |
| --- | --- | --- | --- | --- | --- |
| 此處填入 | 此處填入 | 此處填入 | 此處填入 | component / mixin / global | 精準 / 半精準 / 寬鬆 / 弱 |

### 4. 觀察結論

- 哪些 props 型別精準？
- 哪些 props 比 runtime 寬？
- 哪些 props 來自 mixin？
- 哪些 props 受到 global config 影響？
- 哪些 props 適合後續型別重構？
```

這個模板可以放到 `06-type-system/` 後續元件案例中重複使用，讓你的筆記不只是紀錄單點觀察，而是逐漸形成一套 View UI Plus 型別閱讀方法。

---

## 5. 表格整理

### 5.1 Props contract 閱讀總表

| 閱讀項目 | 要看的位置 | 要回答的問題 | 注意事項 |
| --- | --- | --- | --- |
| Public props | `types/<component>.d.ts` | TypeScript 使用者可以看到哪些 props？ | 同一個 object 裡可能也混有 listener props |
| Runtime props | `src/components/<component>/**` | 元件實際接收哪些 props？ | 要看 `props`、`validator`、`default` |
| Mixin props | `src/mixins/**` | 有哪些 props 不是元件本身直接宣告？ | public type 應展開 mixin props |
| Naming mapping | `.d.ts` 與 runtime source | kebab-case 和 camelCase 如何對應？ | `html-type` 對應 `htmlType` |
| Validator mapping | runtime validator 與 literal union | TypeScript 是否能限制合法值？ | declaration 可能更寬或更窄 |
| Default / fallback | runtime default、global config | 沒傳 prop 時 runtime 如何補值？ | 不一定會完整出現在 `.d.ts` |
| Weak types | `.d.ts` 中的 `any`、`object`、`Function` | 型別保護失去到什麼程度？ | 可作為後續泛型或 interface 改良候選 |

---

### 5.2 `Button` props 對照重點表

| Prop 群組 | 代表 props | 來源 | 型別特徵 | 閱讀重點 |
| --- | --- | --- | --- | --- |
| 基本狀態 props | `disabled`、`loading`、`long`、`ghost` | component runtime props | `boolean` | declaration 與 runtime 通常容易對齊 |
| 外觀枚舉 props | `type`、`size`、`shape` | component runtime props | union 或 `string` | 要檢查 validator 是否完整轉成 literal union |
| HTML 行為 props | `htmlType` / `'html-type'` | component runtime props | `'button' | 'submit' | 'reset'` | 注意 camelCase 與 kebab-case 對應 |
| icon props | `icon`、`customIcon` / `'custom-icon'` | component runtime props | `string` | 注意 public type name 與 runtime name |
| link mixin props | `to`、`replace`、`target`、`append` | `mixins/link.js` | `string | object`、boolean、literal union | public props 不一定直接寫在 component 本身 |
| event listener | `onClick` | declaration 中同 object | `(event?: any) => any` | 屬於事件型別議題，後續章節再分析 |

---

### 5.3 命名轉換表

| Public usage | Declaration 寫法 | Runtime prop | Instance access | 說明 |
| --- | --- | --- | --- | --- |
| `<Button html-type="submit" />` | `'html-type'?: ...` | `htmlType` | `this.htmlType` | 多字 prop 在 template 常用 kebab-case |
| `<Button custom-icon="x" />` | `'custom-icon'?: string` | `customIcon` | `this.customIcon` | declaration 偏向 public template 視角 |
| `<Button disabled />` | `disabled?: boolean` | `disabled` | `this.disabled` | 單字 prop 命名一致 |
| `<Button target="_blank" />` | `target?: ...` | `target` | `this.target` | 來自 link mixin 的 public prop |

---

### 5.4 型別強度表

| 型別寫法 | 強度 | 優點 | 缺點 | 適合如何記錄 |
| --- | --- | --- | --- | --- |
| Literal union | 高 | 能限制合法值，IDE 提示明確 | 需要維護合法值清單 | 記錄是否與 validator 對齊 |
| Primitive union | 中 | 能限制大致型別 | 無法描述語意或 shape | 記錄是否仍需查文件 |
| `object` | 低 | 彈性高、相容性好 | 不知道欄位結構 | 標註「此處需要後續補 interface」 |
| `Function` | 低 | 可接受任意 callback | 不知道參數與回傳值 | 標註 callback contract 不明 |
| `any[]` | 很低 | 幾乎不限制使用者 | 陣列元素沒有保護 | 適合作為泛型改善候選 |
| `any` | 最低 | 最大彈性 | 幾乎放棄型別檢查 | 需回 source 或文件確認實際 shape |

---

## 6. 範例或情境說明

### 6.1 情境一：為什麼 `html-type` 能得到較好的型別提示

假設使用者在 template 中寫：

```vue
<Button html-type="submit" />
```

對應的 declaration 是：

```ts
'html-type'?: 'button' | 'submit' | 'reset';
```

這種寫法可以讓 IDE 知道 `html-type` 只應該接受 `button`、`submit`、`reset` 這幾種值。若開發環境支援 Vue template type checking，這類 literal union 就能提供更好的補全與檢查。

這也說明為什麼 View UI Plus 的 declaration 使用 `'html-type'` 而不是 `htmlType`：它想描述的是使用者在 template/public API 層看到的 prop，而不是元件內部的變數名稱。

---

### 6.2 情境二：為什麼 `shape?: string` 是寬鬆 contract

假設 runtime validator 只接受：

```txt
circle / circle-outline
```

但 declaration 寫成：

```ts
shape?: string;
```

那麼從 type surface 角度，下面寫法可能被視為合法字串：

```vue
<Button shape="square" />
```

可是從 runtime validator 角度，`square` 不一定是合法值。這就是 declaration 比 runtime 更寬的典型案例。

這種情況在筆記中不應只寫「`shape` 是 string」，而應補充：

> `shape` 在 runtime 具有枚舉語意，但 declaration 寫成 `string`，因此 TypeScript 只能確認它是字串，無法提前限制合法值。若要改善，可考慮將 declaration 收斂成 `'circle' | 'circle-outline'`，但需要先確認這是否符合 View UI Plus 的公開文件與相容性要求。

---

### 6.3 情境三：如何判斷一個 prop 是不是來自 mixin

假設你在 `types/button.d.ts` 看到：

```ts
to?: string | object;
replace?: boolean;
target?: '_blank' | '_self' | '_parent' | '_top';
append?: boolean;
```

但在 `src/components/button/button.vue` 的 `props` 區塊沒有直接看到這些欄位，這時不要急著判斷 `.d.ts` 寫錯。下一步應該檢查 component 是否有 mixin：

```js
mixins: [ mixinsLink, mixinsForm ]
```

如果 `mixinsLink` 中宣告了這些 props，那 declaration 把它們放進 `Button` type surface 就是合理的。因為對使用者而言，這些 props 的來源不重要；只要可以傳給 `<Button />`，它們就是 `Button` 的 public props。

---

## 7. 閱讀路線或學習路線

### 7.1 初次閱讀路線

第一次閱讀某個元件的 props contract 時，建議按以下順序：

1. 先打開 `types/<component>.d.ts`，找出 `DefineComponent<{ ... }>` 中列出的 public props。
2. 將明顯屬於事件的 `onXxx` 欄位先標記出來，暫時不要和 props 混在一起分析。
3. 回到 `src/components/<component>/**`，找到 runtime `props` 宣告。
4. 對照 prop 名稱，特別注意 kebab-case 與 camelCase 的轉換。
5. 檢查每個 prop 是否有 validator、default 或 global fallback。
6. 檢查元件是否使用 mixins，並追蹤 mixin 是否提供額外 props。
7. 最後判斷 `.d.ts` 的型別精準度：精準、半精準、寬鬆或弱契約。

---

### 7.2 深入閱讀路線

當你已經能看懂單一元件 props 後，可以進一步做三種分析。

第一種是橫向比較。選擇多個元件，例如 `Button`、`Input`、`Select`、`Table`，比較它們的 declaration 風格是否一致。這能幫助你判斷 View UI Plus 的 `.d.ts` 是否有統一規則，還是不同元件各自維護。

第二種是精準度分類。把所有 props 分成 literal union、primitive、object、Function、any[] 等類型，觀察哪些元件型別比較強，哪些元件型別比較弱。這會對後續泛型改良特別有幫助。

第三種是 runtime/type drift 檢查。對照 runtime validator 與 `.d.ts`，找出 declaration 比 runtime 寬、比 runtime 窄，或漏掉某些 public props 的地方。這類差異就是 type surface 與 runtime surface 可能不同步的證據。

---

### 7.3 可以暫時跳過的部分

本章階段可以先暫時跳過以下內容：

1. Vue `DefineComponent` 的完整泛型參數設計。
2. 所有元件的 props 完整盤點。
3. `emits`、slots、instance methods 的細節。
4. `Table`、`Form` 這類高度複雜元件的泛型重構。
5. View UI Plus 是否自動產生 `.d.ts` 的完整建置流程。

這些都值得研究，但如果一開始就全部展開，會讓 props contract 的主線變得模糊。此階段先掌握「如何讀單一元件 props」即可。

---

## 8. 常見誤區

| 誤區 | 為什麼容易誤解 | 正確理解 |
| --- | --- | --- |
| 看到 `.d.ts` 有 prop，就以為 runtime 一定完全一樣 | declaration 看起來像最終答案 | `.d.ts` 是 type surface，仍需回 runtime source 對照 |
| 只看 `button.vue` 的 `props`，沒看到 `to` 就以為 Button 不支援 link props | 忽略 mixin 合併機制 | mixin props 也是 public props，應追蹤 `mixins/link.js` |
| 以為 `default` value 一定要完整出現在 `.d.ts` | 把 runtime 初始化邏輯和 type contract 混在一起 | `.d.ts` 主要描述使用者可傳值，不一定描述 default 推導過程 |
| 以為 `shape?: string` 代表 runtime 接受任何字串 | 把 TypeScript 型別當成 runtime 真相 | declaration 可能比 validator 寬，合法值仍要看 runtime validator |
| 以為 kebab-case 和 camelCase 是兩個不同 props | 名稱形式不同造成混淆 | `html-type`、`htmlType`、`this.htmlType` 是不同視角下的同一個 prop |
| 看到 `object`、`Function`、`any[]` 就直接判斷是錯誤 | 沒考慮 UI library 維護成本與相容性 | 它們代表弱契約，可能是取捨，但要知道失去哪些保護 |
| 把 `onClick` 和一般 props 混在一起分析 | `DefineComponent<{ ... }>` object 中混有 listener props | 事件 listener 應在 emits contract 中獨立分析 |

---

## 9. 本章總結

View UI Plus 的 component props contract 需要同時從 runtime source 和 TypeScript declaration 兩邊閱讀。runtime source 告訴你元件實際接收什麼 props、如何驗證值、如何套用 default，以及是否透過 mixin 或全域設定影響行為；`types/*.d.ts` 則告訴你 TypeScript 使用者在編譯期能看到什麼型別提示與限制。

`Button` 是一個很好的入門案例。它展示了幾個典型現象：`htmlType` 在 runtime 中是 camelCase，但在 declaration 中以 `'html-type'` 呈現；`type`、`html-type`、`target` 這類 props 使用 literal union，因此型別契約相對精準；`shape` 雖然 runtime 有 validator，但 declaration 寫成 `string`，所以屬於較寬鬆的契約；`to`、`replace`、`target`、`append` 這類 props 來自 mixin，但仍然屬於 `Button` 的 public props。

本章最重要的收穫不是背下 `Button` 的所有 props，而是建立一套可重複使用的閱讀方法：先看 `types/*.d.ts` 找 public props，再回到 `src/components/**` 對照 runtime `props`，接著追蹤 mixins、default、global fallback，最後判斷 declaration 的精準度。這套方法會成為後續分析 `emits`、instance、public API 與泛型改良的基礎。

---

## 10. 自我檢查問題

1. 為什麼閱讀 View UI Plus props 型別時，不能只看 `types/*.d.ts`？
2. `runtime props` 和 `type declaration props` 分別回答什麼問題？
3. 為什麼 `.d.ts` 裡會出現 `'html-type'`，但 runtime source 裡是 `htmlType`？
4. `Button.shape` 的 runtime validator 和 type declaration 有什麼落差？
5. declaration 比 runtime validator 更寬時，對 TypeScript 使用者有什麼影響？
6. `Button.size` 的 default 會讀 `$VIEWUI.size`，為什麼這不一定要完整寫進 `.d.ts`？
7. 為什麼 `to`、`replace`、`target`、`append` 這類 mixin props 也必須出現在 `Button` 的 public type contract？
8. `object`、`Function`、`any[]` 分別會失去哪些型別資訊？
9. 如何判斷一個 prop 的 contract 是精準、半精準、寬鬆還是弱契約？
10. 如果你要分析 `Input` 或 `Table` 的 props contract，會按照哪些步驟閱讀？

---

## 11. 後續延伸方向

本章建立的是 props contract 的閱讀方法。後續可以延伸成以下主題：

1. **`03-component-emits-contract`**：分析 runtime `emits` 如何對應到 declaration 中的 `onXxx` listener props。
2. **`04-component-slots-contract`**：整理 `v-slots` 在 `.d.ts` 中的表示方式，以及 slots 型別是否精準。
3. **`05-component-instance-methods`**：分析像 `Input.focus()`、`Input.blur()` 這類 instance public methods 是否出現在型別中。
4. **`06-global-plugin-api-contract`**：分析 `install`、`$Message`、`$Modal`、`$Notice`、`$VIEWUI` 等 plugin/global API 的型別設計。
5. **`07-table-form-generic-opportunities`**：以 `Table`、`Form` 為案例，研究 `any[]`、`object`、`Function` 是否能改成泛型或更精準的 interface。
6. **`08-runtime-type-drift-checklist`**：建立一份檢查表，用來系統性比對 runtime surface 與 type surface 是否不同步。
7. **`09-declaration-maintenance-strategy`**：研究 View UI Plus 的 `.d.ts` 是手寫、產生，還是混合維護，並整理維護型別契約的實務取捨。
