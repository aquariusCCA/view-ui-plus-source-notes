# Type System Overview：從 Runtime Source 到 TypeScript Declaration

## 0. 原始筆記問題分析

這份原始筆記屬於 `06-type-system/` 目錄下的入口型筆記，主要性質是「原始碼閱讀筆記」與「架構分析筆記」的混合。它已經整理出 View UI Plus v1.3.20 型別系統的幾個關鍵入口，例如 `package.json`、`types/index.d.ts`、`types/viewuiplus.components.d.ts`、`types/*.d.ts` 與 `src/components/**`，也已經意識到 runtime source 與 type surface 需要對照閱讀。

目前筆記的核心方向是正確的，但若要作為長期學習用的教材型筆記，還可以補強以下幾點：

1. **整體結構偏向地圖型速查**  
   原始筆記已經列出重要檔案與路徑，但對於「為什麼 TypeScript 要從這些檔案開始理解套件」以及「每一層型別檔案在整個型別系統中扮演什麼角色」還可以補得更完整。

2. **runtime surface 與 type surface 的差異可以再教學化**  
   原始筆記已經指出 runtime source 與 `.d.ts` declaration files 可能不同步，但還可以進一步說明：runtime surface 是「實際執行時存在的能力」，type surface 是「TypeScript 編譯期可見的合約」。兩者不一致時，會影響 IDE 提示、型別檢查、TSX 使用與元件封裝。

3. **Component Declaration 的形狀需要拆成 props、events、slots、instance 四個面向理解**  
   原始筆記已經用 `DefineComponent<{ ... }>` 說明 props、listener props、slot hints 與 weak contract，但還可以補上這種寫法和 Vue 使用者實際使用元件時的關係。

4. **型別強度表可以補上閱讀判斷方式**  
   原始筆記有整理 literal union、primitive union、object、Function、any 等型別強度，但還可以進一步說明：閱讀型別時不只是看「有沒有型別」，而是要判斷這個型別能不能提供足夠的約束力。

5. **後續章節銜接可以再明確**  
   由於這篇是 `06-type-system/` 的入口筆記，因此除了說明本章內容，也應該明確指出後續可以拆成 props、emits、instance、public API、component registry、service API 與泛型改良等筆記。

6. **資訊不足處需要標註**  
   原始筆記沒有提供完整的 `types/index.d.ts`、`types/viewuiplus.components.d.ts` 或各元件 `.d.ts` 原始碼，因此本筆記只根據目前已提供的筆記內容進行整理。若要做更深入的精準分析，後續仍需要打開實際原始碼逐檔確認。

---

## 1. 本章定位

本章是 `06-type-system/` 目錄的入口地圖，用來建立閱讀 View UI Plus TypeScript 型別系統時的基本心智模型。

View UI Plus v1.3.20 的型別系統有一個很重要的特徵：**執行時原始碼主要位於 JavaScript / Vue SFC，TypeScript 使用者看到的型別合約則主要來自 `types/**` 底下的 `.d.ts` declaration files**。

也就是說，讀 View UI Plus 的型別設計時，不能只看 `src/components/**`，也不能只看 `types/**`。前者回答「實際執行時會發生什麼」，後者回答「TypeScript 與 IDE 認為這個套件提供什麼」。兩邊必須對照，才不會誤判元件實際能力與型別支援程度。

本章主要解決以下問題：

1. TypeScript 使用者從哪個檔案進入 View UI Plus 的型別系統。
2. `package.json`、`types/index.d.ts`、`types/viewuiplus.components.d.ts` 與 `types/*.d.ts` 分別扮演什麼角色。
3. component props、emits、slots、instance、public API 在型別上可能出現在哪些位置。
4. runtime surface 與 type surface 為什麼可能不同步。
5. 後續閱讀 props、emits、instance、plugin global API 與泛型設計時，應該先建立哪些基本分類。

本章不會逐一解析每個元件的 props，也不會完整分析 Table、Form、Modal、Message 等複雜元件的型別細節。這些內容會留到後續獨立筆記中展開。

---

## 2. 學習前先建立的基本觀念

### 2.1 Runtime Source：真正執行的程式碼

runtime source 指的是套件在瀏覽器或 JavaScript 執行環境中真正被執行的程式碼。

在 View UI Plus 中，runtime source 主要包含：

- `src/index.js`
- `src/components/index.js`
- `src/components/**/*.vue`
- `src/components/**/*.js`

這些檔案決定了元件實際有哪些 props、emits、methods、slots、plugin install 行為，以及像 `$Message`、`$Modal` 這類全域 API 實際如何掛載或呼叫。

runtime source 回答的是：

> 使用者在執行時真的可以 import 什麼、安裝什麼、呼叫什麼、從元件 instance 上拿到什麼。

例如 `src/components/input/input.vue` 如果真的宣告了 `emits: ['on-change', 'update:modelValue']`，那代表這些事件在執行時確實是元件設計的一部分。至於 TypeScript 是否知道這些事件，則要看 `.d.ts` 是否有同步描述。

### 2.2 Type Surface：TypeScript 看到的型別合約

type surface 指的是 TypeScript 編譯器、IDE、Volar、TSX 使用者看到的型別描述。

在 View UI Plus 中，type surface 主要來自：

- `types/index.d.ts`
- `types/viewuiplus.components.d.ts`
- `types/button.d.ts`
- `types/input.d.ts`
- `types/table.d.ts`
- `types/form.d.ts`
- `types/message.d.ts`
- `types/modal.d.ts`

這些 `.d.ts` 檔案本身不負責執行元件邏輯，而是對外宣告「這個套件有哪些型別、元件、方法、參數與回傳值」。

type surface 回答的是：

> TypeScript 是否知道這個 API？知道到多精準？能不能幫使用者做 autocomplete、型別檢查與錯誤提示？

因此，`.d.ts` 可以被視為 library 對 TypeScript 使用者提供的「外部合約」。合約寫得精準，使用者體驗就好；合約寫得寬鬆，使用者仍然可以使用功能，但 IDE 與型別檢查提供的保護會變弱。

### 2.3 Declaration File 不是實作，而是合約

`.d.ts` declaration file 並不是實際執行的程式碼。它的作用是描述既有 JavaScript 程式碼的型別形狀。

這一點在閱讀 View UI Plus 時非常重要，因為 View UI Plus v1.3.20 的 runtime source 主要不是 TypeScript 原始碼，而是 JavaScript 與 Vue SFC。也就是說，型別並不是從完整 TypeScript source 自然推導出來，而是透過 declaration files 對外補上。

因此閱讀時要避免兩種誤解：

1. 看到 `.d.ts` 沒寫某個 API，就立刻認為 runtime 沒有這個 API。
2. 看到 runtime 有某個 API，就立刻認為 TypeScript 一定能精準提示它。

比較穩定的閱讀方式是：先看 type entry 找到 TypeScript 對外合約，再回到 runtime source 驗證實際行為，最後比較兩邊是否一致。

### 2.4 元件型別可以分成 props、emits、slots、instance 與 public API

在 `06-type-system/` 這個目錄中，後續筆記應該盡量把型別問題拆成幾個面向，而不是把所有型別都混在一起看。

| 面向 | 主要問題 | 常見出現位置 |
| --- | --- | --- |
| props | 使用者可以傳入哪些屬性？值的型別與可選值是什麼？ | `types/*.d.ts`、`src/components/**/*.vue` |
| emits / listener props | 元件會發出哪些事件？事件 payload 是否有型別？ | `emits`、`onXxx` listener props |
| slots | 元件支援哪些 slot？slot props 是否有型別？ | `'v-slots'?: { ... }` 或 runtime slots |
| instance | 透過 `ref` 拿到元件時，可以呼叫哪些方法？ | component methods、instance declaration |
| public API | 套件層級或 plugin 層級暴露哪些 API？ | `src/index.js`、`types/index.d.ts`、service declarations |
| generics | 型別是否能根據使用者資料結構自動推導？ | Table、Form、Select 等高資料關聯元件 |

這種分類可以幫助你在後續閱讀時更有方向。例如讀 `Input` 時，可以先分成 `modelValue` 相關 props、輸入事件、focus / blur instance method、slot hints；讀 `Table` 時，則要特別觀察資料列型別、欄位設定型別與事件 payload 是否能被泛型化。

---

## 3. 整體概覽

View UI Plus 的 type surface 可以先分成四層：package type entry、component export registry、component declaration、runtime source。

| 層級 | 代表檔案 | 責任 |
| --- | --- | --- |
| package type entry | `types/index.d.ts` | 作為 TypeScript 進入整個套件型別系統的入口 |
| component export registry | `types/viewuiplus.components.d.ts` | 統一重新匯出所有 public component declarations |
| component declaration | `types/*.d.ts` | 描述單一元件的 props、events、slots、options 或 service API |
| runtime source | `src/index.js`、`src/components/**` | 決定 JavaScript 執行時的真正行為 |

可以用以下文字圖理解整體關係：

```txt
package.json
  └─ typings: types/index.d.ts
       │
       ├─ export * from './viewuiplus.components'
       │
       ├─ ViewUIPlusGlobalOptions
       │
       ├─ ViewUIPlusInstallOptions
       │
       ├─ declare module '@vue/runtime-core'
       │
       └─ install(app, options)
              │
              ▼
types/viewuiplus.components.d.ts
  ├─ export { Button } from './button'
  ├─ export { Table, TableColumnConfig } from './table'
  ├─ export { Modal, ModalInstance } from './modal'
  └─ ...
              │
              ▼
types/button.d.ts / input.d.ts / table.d.ts / form.d.ts
  └─ DefineComponent<{
       props
       listener props
       slot hints
       weak contracts
     }>
              │
              ▼
src/index.js / src/components/**/*.vue / src/components/**/*.js
  └─ runtime props、emits、methods、slots、install、globalProperties
```

這張圖的重點不是背路徑，而是理解「TypeScript 入口」和「runtime 實作入口」是兩條不同路線。

TypeScript 使用者安裝 `view-ui-plus` 後，編譯器會先根據 `package.json` 的 `"typings": "types/index.d.ts"` 找到型別入口。接著透過 `types/index.d.ts` 取得元件匯出、plugin install 型別、全域屬性補充與其他公共型別。

但實際執行時，Vue app 使用的 install 行為、元件註冊、全域 API 掛載與元件內部互動，仍然要回到 `src/index.js` 與 `src/components/**` 才能確認。

---

## 4. 核心內容逐步講解

### 4.1 `package.json`：TypeScript 如何找到型別入口

在原始筆記中，`package.json` 的型別入口是：

```json
{
  "typings": "types/index.d.ts"
}
```

這個欄位告訴 TypeScript：當使用者安裝並 import `view-ui-plus` 時，這個 package 的型別描述要從 `types/index.d.ts` 開始讀。

這裡的重點是，`typings` 指向的是 declaration file，而不是 runtime entry。runtime entry 可能由 `main`、`module`、`exports` 或建置產物決定；但 TypeScript 的型別理解會優先看 `typings` 或 `types` 指定的位置。

因此，閱讀 View UI Plus 型別系統時，第一步不是直接打開 `src/components/button/button.vue`，而是先從 `package.json` 確認 TypeScript 的入口在哪裡。

### 4.2 `types/index.d.ts`：整個 type surface 的總入口

`types/index.d.ts` 可以視為 View UI Plus 對 TypeScript 使用者提供的總入口。

根據原始筆記，它至少包含或關聯以下內容：

```txt
types/index.d.ts
  -> export * from './viewuiplus.components'
  -> ViewUIPlusGlobalOptions
  -> ViewUIPlusInstallOptions
  -> declare module '@vue/runtime-core'
  -> install(app, options)
```

這些內容各自負責不同層級的型別合約。

| 項目 | 角色 | 閱讀重點 |
| --- | --- | --- |
| `export * from './viewuiplus.components'` | 將元件型別統一向外匯出 | 使用者能否從 package 層級取得元件型別 |
| `ViewUIPlusGlobalOptions` | 描述全域設定選項 | 例如 locale、i18n 或其他 plugin-level options |
| `ViewUIPlusInstallOptions` | 描述 `app.use()` 安裝時可傳入的 options | 需對照 `src/index.js` 的 install 實作 |
| `declare module '@vue/runtime-core'` | 補強 Vue instance 的全域屬性型別 | 例如 `$Message`、`$Modal` 等是否能被 TypeScript 認得 |
| `install(app, options)` | 描述 plugin install 的呼叫方式 | 需確認 app、options 與回傳型別是否精準 |

這一層的閱讀重點是：它不是在描述某一個元件，而是在描述整個 library 對外可見的型別邊界。

### 4.3 `types/viewuiplus.components.d.ts`：元件型別登記表

`types/viewuiplus.components.d.ts` 可以理解成 component type registry，也就是元件型別的集中匯出表。

原始筆記中的例子如下：

```txt
types/viewuiplus.components.d.ts
  -> export { Button } from './button'
  -> export { Table, TableColumnConfig } from './table'
  -> export { Modal, ModalInstance } from './modal'
  -> ...
```

這個檔案本身通常不負責詳細描述每個元件的 props，而是把散落在 `types/button.d.ts`、`types/table.d.ts`、`types/modal.d.ts` 等檔案中的型別重新集中匯出。

它的價值在於建立「public components 的型別清單」。如果某個元件有 runtime source，但沒有出現在這個 registry 中，TypeScript 使用者就可能無法從 package 層級正常取得該元件型別。反過來，如果某個 declaration 被匯出，但 runtime 不再提供對應元件，也會造成型別與實作不一致。

### 4.4 `types/*.d.ts`：單一元件的型別合約

單一元件的 declaration file 通常會描述這個元件的 props、listener props、slots，以及部分額外型別。

原始筆記以 `Button` 為例：

```ts
import type { DefineComponent } from 'vue';

export declare const Button: DefineComponent<{
    type?: '' | 'default' | 'primary' | 'dashed' | 'text' | 'info' | 'success' | 'warning' | 'error';
    disabled?: boolean;
    loading?: boolean;
    onClick?: (event?: any) => any;
}>
```

這段型別可以拆成幾個部分看：

| 類型 | 範例 | 意義 |
| --- | --- | --- |
| props | `disabled?: boolean`、`loading?: boolean` | 使用者可以傳入元件的屬性 |
| literal union props | `type?: '' \| 'default' \| 'primary'` | 限制 prop 只能使用特定字串 |
| listener props | `onClick?: (event?: any) => any` | 對應 Vue 事件監聽器的型別 |
| weak payload | `event?: any` | 表示事件存在，但事件參數型別不精準 |

這種寫法的優點是簡單，能讓使用者在 IDE 中看到元件 props 與事件名稱。缺點是事件 payload、slot props、instance methods 與複雜資料結構通常不夠精準。

因此閱讀 `types/*.d.ts` 時，不要只問「它有沒有型別」，還要問「這個型別能提供多少約束力」。

### 4.5 Runtime Surface：實際存在的執行能力

runtime surface 是 JavaScript 執行時真正存在的 API。對 View UI Plus 來說，典型來源包括：

| Runtime source | 代表內容 |
| --- | --- |
| `src/index.js` | `install`、default API、`version`、`locale`、`i18n`、`lang`、`globalProperties` |
| `src/components/index.js` | package-level named component exports |
| `src/components/button/button.vue` | `Button` 的 runtime props、emits、render、methods |
| `src/components/input/input.vue` | `Input` 的 `modelValue`、`update:modelValue`、`focus()`、`blur()` |
| `src/components/message/index.js` | `Message.info()`、`success()`、`config()`、`destroy()` |
| `src/components/modal/index.js` | `Modal.info()`、`confirm()`、`remove()` |

runtime surface 的閱讀重點是確認「實際行為」。例如：

- 元件實際支援哪些 props？
- 元件實際 emit 哪些事件？
- 使用 `ref` 拿到元件後，實際有哪些方法？
- plugin 安裝時是否把 API 掛到 `app.config.globalProperties`？
- service 類 API 是否真的提供 `info()`、`success()`、`config()`、`destroy()` 等方法？

這些問題不能只靠 `.d.ts` 判斷，因為 `.d.ts` 可能落後、過度簡化，或與 runtime source 不同步。

### 4.6 Type Surface：TypeScript 編譯期可見的合約

type surface 是 TypeScript 編譯器能看到的 API。對 View UI Plus 來說，典型來源包括：

| Type source | 代表內容 |
| --- | --- |
| `types/index.d.ts` | package type entry、install signature、global properties |
| `types/viewuiplus.components.d.ts` | component named export declaration registry |
| `types/button.d.ts` | `Button` / `ButtonGroup` 的 props 與 click listener |
| `types/input.d.ts` | `Input` 的 `model-value`、slots、`onOnChange` 等 |
| `types/table.d.ts` | `Table` props 與 `TableColumnConfig` |
| `types/message.d.ts` | `Message` component props 與 `MessageConfig` |
| `types/modal.d.ts` | `Modal` component props 與 `ModalInstance` options |

type surface 的閱讀重點是確認「型別合約」。例如：

- 使用者能不能從 `view-ui-plus` import 到元件型別？
- props 是否有明確型別？
- 事件 listener 是否有對應的 `onXxx` 型別？
- slot 是否有提示？
- `this.$Message` 或 `app.config.globalProperties.$Message` 是否有型別？
- service API 的 options 是否有獨立 interface？
- Table / Form 這類元件是否有泛型支援？

如果 runtime 有某個功能，但 type surface 沒有描述，TypeScript 使用者仍然可能可以執行它，但 IDE 不一定會提示，甚至可能出現型別錯誤。

### 4.7 `Input` 範例：從 runtime emits 對照 declaration listener props

以 `Input` 為例，原始筆記提到 runtime 在 `src/components/input/input.vue` 中宣告：

```js
emits: [
  'on-enter',
  'on-search',
  'on-keydown',
  'on-keypress',
  'on-keyup',
  'on-click',
  'on-focus',
  'on-blur',
  'on-change',
  'on-input-change',
  'on-clear',
  'update:modelValue'
]
```

而 type 在 `types/input.d.ts` 中出現類似：

```ts
'model-value'?: string | number;
onOnChange?: (event?: any) => any;
onOnSearch?: (event?: any) => any;
onOnClear?: (event?: any) => any;
```

這個例子可以看出幾個重要現象。

第一，runtime prop 與 type prop 的命名形式可能不同。runtime 可能使用 camelCase 的 `modelValue`，但 declaration 裡可能出現 kebab-case 的 `'model-value'`。這和 Vue template 中 prop 可以使用 kebab-case 有關，但閱讀時仍要注意兩者是否都被正確支援。

第二，runtime event `on-change` 在 declaration 中可能對應成 listener prop `onOnChange`。這種名稱看起來有點不直覺，是因為事件本身已經叫做 `on-change`，再轉成 listener prop 形式時，又被加上 `on` 前綴，於是形成 `onOnChange`。

第三，runtime 有 `update:modelValue`，但原始筆記指出多數 `.d.ts` 沒有明確看到 `onUpdate:modelValue` 這類 listener declaration。這代表使用者在 Vue template 中使用 `v-model` 可能能正常運作，但在 TSX 或更精準的型別檢查情境下，事件型別可能不夠完整。

第四，事件 payload 多數被寫成 `event?: any`。這代表 declaration 只表達「這個事件存在」，但沒有精準描述事件參數。例如它沒有明確告訴你 `onOnChange` 的參數到底是 DOM Event、value，還是其他格式。

這種對照方式正是閱讀 View UI Plus 型別系統的核心方法：**先看 runtime 有什麼，再看 `.d.ts` 知不知道；先看 `.d.ts` 宣告什麼，再回 runtime 驗證是否真的存在。**

### 4.8 型別強度：不是有型別就代表精準

View UI Plus 的 `.d.ts` 中可以看到不同強度的型別寫法。

| 型別寫法 | 強度 | 例子 | 閱讀判斷 |
| --- | --- | --- | --- |
| literal union | 高 | `'left' \| 'right' \| 'center'` | 能限制可用值，對 IDE 提示與錯誤檢查很有幫助 |
| primitive union | 中 | `number \| string` | 能限制大類型，但不限制語意 |
| object | 低 | `styles?: object` | 只知道是物件，不知道欄位結構 |
| Function | 低 | `render?: Function` | 只知道可呼叫，不知道參數與回傳 |
| any / any[] | 最低 | `data?: any[]` | 幾乎放棄細節檢查，只保留最低限度相容性 |

閱讀型別時，最重要的不是計算某個檔案裡「有多少型別」，而是判斷這些型別的約束力。

例如 `type?: 'primary' | 'success' | 'error'` 是強型別，因為它能阻止使用者傳入錯誤字串。相反地，`render?: Function` 雖然也是型別，但它沒有告訴使用者函式參數、回傳值與上下文，因此只能算是弱合約。

在原始碼閱讀筆記中，可以把型別強度當成評估 library 型別品質的維度：

1. 是否能限制錯誤值？
2. 是否能推導事件 payload？
3. 是否能描述 slot props？
4. 是否能描述 instance methods？
5. 是否能根據使用者傳入資料做泛型推導？

### 4.9 Runtime Surface 與 Type Surface 不同步的風險

當 runtime surface 與 type surface 不同步時，可能出現以下問題：

| 不同步情況 | 可能結果 |
| --- | --- |
| runtime 有 API，但 `.d.ts` 沒有 | 可以執行，但 TypeScript 報錯或 IDE 沒提示 |
| `.d.ts` 有 API，但 runtime 沒有 | TypeScript 不報錯，但執行時可能失敗 |
| runtime event payload 與 `.d.ts` payload 不一致 | 型別檢查通過，但實際處理資料時出錯 |
| props runtime validator 與 declaration union 不一致 | template 可用值與 TS 可用值出現落差 |
| service API options 實作已改，但 declaration 未更新 | 使用者照型別寫仍可能得到不符合預期的行為 |

因此，讀 View UI Plus 型別系統時，應該養成一個固定檢查流程：

```txt
1. 從 package.json 找到 typings
2. 進入 types/index.d.ts
3. 找到 component registry 或 global API declaration
4. 進入單一 types/*.d.ts
5. 回到 src/components/** 或 src/index.js 驗證 runtime
6. 比對 props、emits、slots、methods、service API 是否一致
7. 標註型別精準、型別寬鬆或疑似不同步的位置
```

這個流程比單純背每個元件的 props 更重要，因為它可以套用到後續所有元件分析。

---

## 5. 表格整理

### 5.1 Type System 入口與責任表

| 項目 | 位置 / 寫法 | 角色 | 閱讀重點 |
| --- | --- | --- | --- |
| Package | `view-ui-plus` | 套件名稱 | 確認使用者 import 的 package 對應到哪一組型別 |
| Version | `1.3.20` | 分析基準版本 | 型別與 runtime 行為都應以此版本為基準 |
| Type entry | `types/index.d.ts` | TypeScript 型別入口 | 先從這裡理解整個 package 的 type surface |
| Package pointer | `package.json` 的 `"typings": "types/index.d.ts"` | 告訴 TypeScript 型別入口位置 | 注意它和 runtime entry 不是同一件事 |
| Component type registry | `types/viewuiplus.components.d.ts` | 元件型別集中匯出表 | 檢查 public components 是否都有對應型別 |
| Component declaration files | `types/button.d.ts`、`types/table.d.ts`、`types/form.d.ts` | 單一元件型別合約 | 觀察 props、events、slots、options、instance |
| Runtime plugin entry | `src/index.js` | plugin 安裝與全域 API 實作 | 對照 `types/index.d.ts` 的 install 與 global properties |
| Runtime component source | `src/components/**` | 元件實際行為 | 對照 `types/*.d.ts` 的 props、emits、methods、slots |

這張表的閱讀方式是：先從 package 層級確認 TypeScript 入口，再往下追元件 registry 與單一 declaration file，最後回到 runtime source 驗證實作。

### 5.2 Runtime Surface 與 Type Surface 對照表

| 面向 | Runtime Surface | Type Surface | 檢查重點 |
| --- | --- | --- | --- |
| plugin install | `src/index.js` | `types/index.d.ts` | `app.use(ViewUIPlus, options)` 的 options 是否一致 |
| global properties | `app.config.globalProperties` | `declare module '@vue/runtime-core'` | `$Message`、`$Modal` 等是否有型別 |
| component exports | `src/components/index.js` | `types/viewuiplus.components.d.ts` | runtime export 與 type export 是否同步 |
| props | `props` option | `DefineComponent<{ ... }>` | prop 名稱、型別、可選值是否一致 |
| emits | `emits` option | `onXxx?: (...) => any` | event 名稱與 payload 是否完整 |
| slots | `$slots` / render 使用 | `'v-slots'?: { ... }` | slot 名稱與 slot props 是否可被 IDE 提示 |
| instance methods | component methods / exposed methods | instance declaration 或 component type | `ref` 取得後能否得到方法提示 |
| service API | `Message.info()`、`Modal.confirm()` | `MessageConfig`、`ModalInstance` 等 | options 型別與實作支援項目是否一致 |

### 5.3 Component Declaration 內容分類表

| 類型 | 範例 | 代表意義 | 閱讀重點 |
| --- | --- | --- | --- |
| 普通 props | `disabled?: boolean` | 使用者可傳入的元件屬性 | 是否與 runtime props 一致 |
| 字串聯合 props | `type?: 'primary' \| 'success'` | 限制可用字串值 | 是否涵蓋 runtime 實際可用值 |
| listener props | `onClick?: (event?: any) => any` | 事件監聽器型別 | payload 是否過度寬鬆 |
| v-model props | `'model-value'?: string \| number` | 對應 `v-model` 或 model prop | 是否有對應 `update:modelValue` listener |
| slot hints | `'v-slots'?: { default?: () => any }` | 描述可用 slots | 是否有 slot props 型別 |
| service options | `MessageConfig`、`ModalInstance` | 命令式 API 的 options | 是否可對照 runtime service 實作 |
| weak contract | `Function`、`any`、`object` | 只給大概形狀 | 需要後續評估是否能改良 |

---

## 6. 範例或情境說明

### 6.1 情境：你想分析 `Input` 的型別是否完整

假設你正在閱讀 `Input` 元件，想知道它的型別是否完整，可以按照以下路線進行。

第一步，先到 `types/viewuiplus.components.d.ts` 確認 `Input` 是否有被 public export。這一步是確認使用者是否能從 package 層級取得 `Input` 型別。

第二步，進入 `types/input.d.ts`，觀察它用 `DefineComponent<{ ... }>` 描述了哪些 props、listener props 與 slots。此時要特別注意 `model-value`、`onOnChange`、`onOnSearch`、`onOnClear` 這類欄位。

第三步，回到 `src/components/input/input.vue`，檢查 runtime props 與 emits。原始筆記提到 runtime emits 包含：

```js
emits: [
  'on-enter',
  'on-search',
  'on-keydown',
  'on-keypress',
  'on-keyup',
  'on-click',
  'on-focus',
  'on-blur',
  'on-change',
  'on-input-change',
  'on-clear',
  'update:modelValue'
]
```

第四步，比對 `.d.ts` 是否完整描述這些事件。例如 `on-change` 是否有對應 `onOnChange`，`on-search` 是否有對應 `onOnSearch`，`update:modelValue` 是否有對應 listener declaration。

第五步，判斷型別強度。即使事件有被宣告，如果 payload 都是 `event?: any`，仍然代表這只是一種弱合約。後續若要重構或補強，就可以把事件 payload 型別列為改善方向。

### 6.2 情境：你想判斷一個元件能不能被泛型化

不是所有元件都需要泛型。泛型通常適合用在「使用者傳入資料結構，元件內其他設定需要跟著資料結構變動」的情境。

例如 `Button` 的 `type`、`disabled`、`loading` 通常不需要泛型，因為它們和外部資料結構沒有強關聯。

但 `Table` 就可能適合泛型化，因為它通常會有：

- `data`：資料列陣列。
- `columns`：欄位設定。
- `render`：根據 row 產生內容。
- `on-selection-change`：回傳被選取的 row。
- `on-row-click`：回傳目前點擊的 row。

如果這些型別都寫成 `any[]` 或 `Function`，元件仍然可以使用，但 TypeScript 無法幫使用者檢查 row 的欄位名稱與事件 payload。這就是後續 `Table` 型別改良可以深入分析的方向。

---

## 7. 閱讀路線或學習路線

### 7.1 初次閱讀路線

第一次閱讀 View UI Plus 型別系統時，建議不要直接跳進最複雜的 `Table` 或 `Form`。可以先按照以下順序建立基本地圖：

1. **先讀 `package.json`**  
   目的是確認 TypeScript type entry，也就是 `"typings": "types/index.d.ts"`。

2. **再讀 `types/index.d.ts`**  
   重點是理解 package 層級的型別入口、install signature、global options、Vue runtime-core augmentation。

3. **接著讀 `types/viewuiplus.components.d.ts`**  
   重點是建立 public component type registry 的概念，理解元件型別如何被集中匯出。

4. **選一個簡單元件，例如 `Button`**  
   重點是理解 `DefineComponent<{ ... }>` 裡如何混合 props 與 listener props。

5. **再選一個有 v-model 與 emits 的元件，例如 `Input`**  
   重點是理解 `modelValue`、`model-value`、`update:modelValue`、`onOnChange` 之間的對照。

6. **最後再看複雜元件，例如 `Table`、`Form`、`Modal`、`Message`**  
   重點是觀察 service API、options 型別、weak contract 與泛型改良空間。

### 7.2 深入閱讀路線

當你已經理解入口結構後，可以進一步按照型別面向拆解：

1. **props 型別設計**  
   檢查 runtime props 與 `.d.ts` props 是否一致，並觀察 literal union 是否完整。

2. **emits 與 listener props 型別設計**  
   檢查 runtime emits 如何轉成 `onXxx` listener props，並判斷 payload 是否精準。

3. **slots 型別設計**  
   檢查 declaration 中是否有 `'v-slots'`，以及是否能描述 slot props。

4. **instance 與 exposed methods 型別設計**  
   檢查使用者透過 `ref` 拿到元件時，是否能取得 `focus()`、`blur()` 等方法提示。

5. **plugin global API 型別設計**  
   檢查 `declare module '@vue/runtime-core'` 是否補上 `$Message`、`$Modal` 等全域屬性。

6. **service API 型別設計**  
   檢查 `MessageConfig`、`ModalInstance` 等 options 型別是否能對照 runtime 實作。

7. **泛型改良機會**  
   特別檢查 `Table`、`Form`、`Select` 等資料關聯較強的元件，判斷是否能從 `any` / `Function` 改成泛型或更精準的 interface。

### 7.3 可以暫時跳過的部分

初學階段可以暫時跳過以下內容：

- 所有元件 declaration 的逐行背誦。
- 過早重構全部 `.d.ts`。
- 一開始就追求完整泛型化設計。
- 尚未對照 runtime 前，就判斷某個 declaration 是錯的。

這些內容不是不重要，而是應該放在建立完整地圖之後再處理。

---

## 8. 常見誤區

| 誤區 | 為什麼容易誤解 | 正確理解 |
| --- | --- | --- |
| 只看 `src/components/**` 就以為理解型別系統 | runtime source 能看到實作，但看不到 TypeScript 對外合約是否完整 | 需要同時看 `types/**`，確認 TS 使用者實際看到什麼 |
| 只看 `.d.ts` 就以為理解元件行為 | declaration file 可能是手寫、產生或未同步更新 | 需要回到 runtime source 驗證 props、emits、methods 與 service API |
| 有 `.d.ts` 就代表型別很精準 | `any`、`Function`、`object` 也是型別，但約束力很弱 | 要評估型別強度，而不是只看是否有型別 |
| `onOnChange` 看起來奇怪就認為是錯誤 | event 名稱本身可能是 `on-change`，轉成 listener prop 後會形成 `onOnChange` | 需要對照 Vue listener prop 命名規則與實際 declaration |
| runtime 有 `update:modelValue` 就認為 `.d.ts` 一定有 `onUpdate:modelValue` | runtime emits 與 declaration 不一定同步 | 要在 `types/input.d.ts` 中確認是否真的有對應 listener |
| `modelValue` 和 `'model-value'` 是完全不同的 prop | Vue template 中 camelCase 與 kebab-case 有對應關係 | 閱讀時要理解命名轉換，但仍需確認 declaration 是否支援使用情境 |
| `TableColumnConfig` 有宣告就代表 Table 型別已經完整 | 欄位設定型別可能仍使用 `any` 或 `Function` | 要進一步檢查 row data、render、events 是否能被泛型約束 |
| service API 可以和 component props 混在一起看 | `Message.info()`、`Modal.confirm()` 屬於命令式 API，和 template component props 不完全相同 | 應拆成 component declaration 與 service options 兩種型別面向 |

---

## 9. 本章總結

`06-type-system/` 的核心不是背下 View UI Plus 每個元件有哪些 props，而是建立一套能反覆使用的型別閱讀方法。

View UI Plus v1.3.20 的型別系統可以先從兩條線理解：一條是 runtime source，另一條是 type surface。runtime source 主要位於 `src/index.js` 與 `src/components/**`，負責真正的 JavaScript 執行行為；type surface 則主要位於 `types/index.d.ts`、`types/viewuiplus.components.d.ts` 與 `types/*.d.ts`，負責 TypeScript 使用者看到的外部合約。

閱讀時應該先從 `package.json` 的 `"typings": "types/index.d.ts"` 找到型別入口，再追到 `types/index.d.ts` 了解 package 層級的型別邊界，接著透過 `types/viewuiplus.components.d.ts` 找到元件型別 registry，最後進入單一元件的 `types/*.d.ts` 分析 props、listener props、slots、service options 或其他 public API。

完成 type surface 閱讀後，還要回到 runtime source 對照實際行為。這一步可以避免兩種常見誤判：第一，只看 runtime 而以為 TypeScript 一定知道所有 API；第二，只看 `.d.ts` 而以為 declaration 一定完整反映實作。

從型別品質角度來看，View UI Plus 的 declaration files 中同時存在強型別與弱型別。像 literal union 能提供良好的值約束；但 `any`、`Function`、`object` 則只能提供很粗略的合約。後續如果要深入學習或改良型別設計，就應該特別觀察事件 payload、slot props、instance methods、service options 與 Table / Form 這類資料關聯元件的泛型化可能性。

---

## 10. 自我檢查問題

1. `package.json` 中哪個欄位決定 TypeScript type entry？它和 runtime entry 有什麼不同？
2. 為什麼閱讀 View UI Plus 型別系統時，不能只看 `src/components/**`？
3. `types/index.d.ts` 在整個型別系統中扮演什麼角色？
4. `types/viewuiplus.components.d.ts` 和 `types/button.d.ts` 這類單一元件 declaration file 有什麼差別？
5. runtime surface 和 type surface 分別回答什麼問題？
6. 為什麼 `DefineComponent<{ ... }>` 裡可能同時出現 props、listener props 與 `'v-slots'`？
7. `Input` 的 runtime event `on-change` 為什麼可能在 declaration 中變成 `onOnChange`？
8. 為什麼 `event?: any` 代表事件型別存在，但不代表 payload 精準？
9. literal union、primitive union、object、Function、any 的型別強度有什麼差別？
10. 如果 runtime 有 `update:modelValue`，但 `.d.ts` 沒有對應 listener declaration，可能會造成什麼影響？
11. 為什麼 `Table`、`Form` 這類元件比 `Button` 更適合討論泛型改良？
12. 當你懷疑某個 `.d.ts` 與 runtime 不同步時，應該按照什麼流程確認？

---

## 11. 後續延伸方向

這篇筆記是 `06-type-system/` 的入口地圖，後續可以拆成以下主題繼續深入。

1. **Props 型別設計分析**  
   專門分析 runtime props 與 declaration props 的對照方式，包含 camelCase / kebab-case、literal union、Boolean props、default value 與 validator。

2. **Emits 與 Listener Props 型別設計分析**  
   專門分析 runtime `emits` 如何對應到 `onXxx` listener props，以及 `on-change` 變成 `onOnChange` 這類命名現象。

3. **Slots 型別設計分析**  
   專門分析 `'v-slots'` 在 declaration 中的使用方式，以及 View UI Plus 是否能描述 slot props。

4. **Instance Methods 與 Ref 型別分析**  
   專門分析像 `Input` 的 `focus()`、`blur()` 這類 instance method，使用者透過 `ref` 是否能得到型別提示。

5. **Plugin Global API 型別分析**  
   專門分析 `declare module '@vue/runtime-core'` 如何補強 Vue instance properties，例如 `$Message`、`$Modal` 等。

6. **Component Registry 型別分析**  
   專門分析 `types/viewuiplus.components.d.ts` 與 runtime component exports 是否同步。

7. **Message / Modal 命令式 API 型別分析**  
   專門分析 `Message.info()`、`Message.config()`、`Modal.confirm()`、`Modal.remove()` 這類 service API 的 options 型別。

8. **Table 型別與泛型改良機會**  
   專門分析 `TableColumnConfig`、`data`、`columns`、`render`、selection events 是否能用泛型提升型別精準度。

9. **Form 型別與欄位模型推導**  
   專門分析 `Form`、`FormItem`、rules、model、validate callback 是否能根據表單資料模型做型別推導。

10. **View UI Plus 型別品質評估報告**  
   從型別覆蓋率、型別精準度、runtime/type 同步程度、泛型支援程度等面向，整理一份整體評估筆記。
