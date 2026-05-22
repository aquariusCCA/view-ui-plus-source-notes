# Type System：View UI Plus TypeScript 型別系統閱讀指南

## 0. 原始 README 問題分析

這份原始 README 已經具備良好的目錄雛形，能快速交代 `06-type-system/` 目錄的用途、View UI Plus v1.3.20 的 source baseline、12 篇筆記索引，以及建議閱讀順序。不過，如果把它當成長期知識庫的入口，仍有幾個可以補強的地方。

第一，原始 README 偏向「索引型目錄」，能告訴讀者有哪些筆記，卻還沒有充分說明「為什麼要這樣讀」。例如它列出 `types/index.d.ts`、`types/viewuiplus.components.d.ts`、`types/*.d.ts`、`src/components/**` 等位置，但初學者可能還不清楚這些檔案在型別系統中分別扮演什麼角色。

第二，原始 README 已經提出核心心智模型：`src/**/*.vue / src/**/*.js` 代表 runtime behavior，而 `types/*.d.ts` 代表 TypeScript public contract。但這個模型可以進一步展開，說明為什麼兩邊需要對照閱讀，以及單看其中一邊會造成什麼誤判。

第三，原始 README 的筆記索引已經列出 12 篇筆記，但每篇筆記之間的關係還可以更明確。例如 `01` 到 `06` 是建立型別地圖與基礎契約，`07` 到 `09` 是複雜元件與泛型改良機會，`10` 到 `12` 則是總結、檢查清單與小型實作練習。若能把這些分組說清楚，讀者會更容易知道自己目前讀到哪一層。

第四，這份 README 是整個 `06-type-system/` 目錄的入口，因此它不應只像檔案列表，而應該像「導讀章」。它需要幫讀者建立閱讀目標、閱讀方法、判斷標準與後續使用方式。

---

## 1. 本區定位

`06-type-system/` 用來整理 View UI Plus 的 TypeScript 型別設計。這裡的重點不是研究 View UI Plus 內部是否全部使用 TypeScript 寫成，而是研究它如何把 Vue SFC / JavaScript Options API 寫成的 runtime 行為，整理成 TypeScript 使用者看得到的 public contract。

換句話說，這個目錄關心的是：

```txt
runtime 實際能做什麼
  -> declaration file 對外承諾什麼
  -> 使用者在 TypeScript 專案中得到什麼提示與保護
```

本區要解決的問題包括：

1. 如何從 `src/**/*.vue`、`src/**/*.js` 對照 `types/*.d.ts`。
2. 如何判斷 props、emits、slots、methods 是否被正確整理成型別。
3. 如何理解 `types/index.d.ts` 作為 package type entry 的角色。
4. 如何理解 `types/viewuiplus.components.d.ts` 作為 public component registry 的角色。
5. 如何看懂 plugin install、globalProperties、imperative APIs 在型別上的表達。
6. 如何區分精準契約與弱契約，例如 literal union、`any`、`Function`、`object`。
7. 如何判斷哪些資料型元件適合導入泛型設計。

本區不主要解決元件的視覺樣式、DOM 結構、CSS 架構、完整互動流程或業務使用案例。這些內容可以放在其他目錄，例如 component implementation、style system、shared logic 或 interaction behavior。

---

## 2. 學習前先建立的基本觀念

### 2.1 Runtime source 不等於 TypeScript public contract

View UI Plus v1.3.20 的元件實作主要是 Vue SFC / JavaScript Options API，而 TypeScript 對外契約集中在 `types/*.d.ts`。這代表 source code 和型別宣告是分離維護的。

因此閱讀時不能只問：

```txt
這個元件 runtime 有沒有這個功能？
```

還要問：

```txt
這個功能有沒有被 declaration file 正確描述？
```

例如 runtime 可能真的支援某個 prop，但如果 `types/<component>.d.ts` 沒有宣告，TypeScript 使用者就可能沒有 autocomplete，也可能在模板或 TSX 中拿不到正確型別提示。反過來，`.d.ts` 宣告了某個屬性，也不必然代表 runtime 一定完整支援，仍需要回到原始碼確認。

### 2.2 `.d.ts` 是 library 對 TypeScript 使用者的契約

`types/*.d.ts` 不只是補充文件，而是 library 對外公開 API 的型別承諾。對使用者而言，它決定了：

1. props 可不可以被提示。
2. event listener 的 payload 是否清楚。
3. `v-model` 是否能推導 model value。
4. template ref 能不能取得 instance method。
5. `$Message`、`$Modal` 這類 global API 是否可被 TypeScript 承認。
6. named import 是否有對應型別。

所以讀型別系統時，重點不是「有沒有 `.d.ts`」而已，而是要判斷這份 `.d.ts` 精準到哪一層。

### 2.3 型別精準度有層級

View UI Plus 的型別系統不是全有或全無，而是存在不同精準度：

```txt
props-level
  -> 能提示 prop 名稱與基本型別

event-level
  -> 能提示 listener 名稱與 payload

instance-level
  -> 能描述 template ref 上可用的方法

service-level
  -> 能描述 Message / Modal / Notice 這類命令式 API

data-flow-level
  -> 能用泛型串起 row、model、option、rules、slot props
```

如果某個元件只做到 props-level，代表它已經能提供基本使用體驗，但不代表事件、slot、ref、資料流都已經精準型別化。

### 2.4 弱型別不是錯誤，而是取捨

在 View UI Plus 的 `.d.ts` 中，常見 `any`、`Function`、`object` 這類寬鬆型別。這不一定代表設計錯誤，而可能是歷史相容性、維護成本、JS codebase 過渡到 TS declaration 的結果。

閱讀時要避免二分法。比較好的問法是：

```txt
這個位置為什麼使用弱型別？
它是為了相容性，還是因為型別尚未補強？
如果要改良，改良成本與破壞性有多高？
```

### 2.5 泛型通常應該優先用在資料型元件

不是所有元件都適合優先泛型化。像 Button、Icon、Divider 這類元件，通常 props 型別和 literal union 已經能提供足夠價值。相對地，Table、Form、Select、Tree、Transfer、Upload 這類元件會接收使用者資料、回傳資料、傳遞 slot props 或綁定 model，因此更有泛型設計價值。

---

## 3. Source Baseline

本區以 View UI Plus v1.3.20 作為閱讀基準。所有筆記在理解時，都應盡量回到這份 baseline，避免把其他版本、其他 UI library 或現代 Vue 3 library 的設計混進來。

| 項目 | 內容 | 角色 | 閱讀重點 |
| --- | --- | --- | --- |
| Package | `view-ui-plus` | 套件名稱 | 確認本區筆記聚焦的 library。 |
| Version | `1.3.20` | 版本基準 | 型別宣告與 runtime 行為可能會因版本不同而變動。 |
| Source root | `01-origin/source/view-ui-plus-v1.3.20/` | 原始碼根目錄 | 閱讀 runtime 與 types 時都應以此版本為準。 |
| Type entry | `types/index.d.ts` | package 型別入口 | 觀察 `typings`、`install`、global properties 與主要 export。 |
| Component registry types | `types/viewuiplus.components.d.ts` | 元件型別註冊表 | 觀察 named exports 與各元件 `.d.ts` 的連接方式。 |
| Component declarations | `types/*.d.ts` | 單一元件宣告 | 分析 props、listener props、slots、instance、service API。 |
| Runtime components | `src/components/**` | 元件 runtime 實作 | 對照 props、emits、methods、slots 實際行為。 |
| Runtime plugin entry | `src/index.js` | plugin 安裝入口 | 對照 `install`、component registration、globalProperties。 |

這張表的重點不是背路徑，而是建立「查證順序」。當你讀到某個型別宣告時，應該回到 runtime source 確認它是否真的存在；當你在 runtime source 看到某個 public 行為時，也應該回到 `.d.ts` 確認它是否被 TypeScript 使用者看見。

---

## 4. 整體概覽

### 4.1 本區的核心閱讀對象

本區的閱讀對象可以分成五類：

| 對象 | 主要位置 | 關心問題 |
| --- | --- | --- |
| Package 型別入口 | `types/index.d.ts` | TypeScript 從哪裡進入 View UI Plus 的型別系統？ |
| 元件宣告 | `types/*.d.ts` | 每個元件的 props、events、slots、instance 如何表達？ |
| 元件註冊表 | `types/viewuiplus.components.d.ts` | public named exports 如何集中管理？ |
| Runtime 元件 | `src/components/**` | 實際 props、emits、methods、slots 是什麼？ |
| Plugin 入口 | `src/index.js` | install 與 globalProperties 如何掛載？ |

這五類檔案應該一起閱讀。若只看 `types/*.d.ts`，你會知道 TypeScript 宣告了什麼，但不一定知道 runtime 是否一致；若只看 `src/components/**`，你會知道元件實際行為，但不一定知道使用者能不能得到型別提示。

### 4.2 本區的核心心智模型

可以用下面的流程理解整個型別系統：

```txt
src/**/*.vue / src/**/*.js
  -> 定義 runtime behavior
  -> 包含 props、emits、slots、methods、plugin install、service objects

types/*.d.ts
  -> 定義 TypeScript public contract
  -> 對外暴露 props、listener props、instance types、service interfaces

types/index.d.ts
  -> 定義 package-level type entry
  -> 承認 install、global properties、主要 API

types/viewuiplus.components.d.ts
  -> 定義 component named exports
  -> 讓使用者可以 import component 與相關型別
```

這個模型的核心是「對照」。View UI Plus 的型別系統不是從 runtime 自動推導出來的，因此你必須把 runtime 與 declaration file 放在一起看。

---

## 5. 筆記索引與章節角色

原始 README 已經列出 12 篇筆記。這裡進一步把它們整理成「學習階段」，幫助你理解每篇筆記在整個 `06-type-system/` 中的角色。

| 階段 | 筆記 | 主題 | 解決的問題 | 閱讀重點 |
| --- | --- | --- | --- | --- |
| 基礎地圖 | `01-type-system-overview.md` | 型別系統總覽 | 建立 runtime source 與 `.d.ts` type surface 的整體地圖。 | 先理解有哪些型別入口、宣告檔與 runtime 對照點。 |
| Props 契約 | `02-component-props-contract.md` | Component props | 分析 component props 如何在 `DefineComponent<{ ... }>` 中表達。 | 觀察 kebab-case、literal union、validator 與 default 的關係。 |
| Emits 與 v-model | `03-emits-and-v-model-types.md` | Emits / `v-model` | 分析 emits、`v-model`、`onOnChange` 事件監聽器型別。 | 特別注意 `on-change` 為何會變成 `onOnChange`。 |
| Instance / Ref | `04-component-instance-and-ref-api.md` | Component instance | 理解 component instance、template ref、method exposure 的型別邊界。 | 區分 public ref API 與內部 `handleXxx` 方法。 |
| Plugin Global Types | `05-global-plugin-types.md` | Plugin 與全域屬性 | 分析 `install` options、`$VIEWUI`、`ComponentCustomProperties`。 | 觀察 globalProperties 是否只做到 property-level。 |
| Public Registry | `06-public-component-registry.md` | Component registry | 解析 `types/viewuiplus.components.d.ts` 的 component export registry。 | 檢查 runtime named export 與 type named export 是否一致。 |
| 複雜案例 | `07-table-and-form-as-type-case-studies.md` | Table / Form | 用 Table 與 Form 觀察複雜元件的型別取捨。 | 觀察資料型元件為何容易需要泛型。 |
| 命令式 API | `08-overlay-and-imperative-api-types.md` | Modal / Message / Notice | 分析命令式 API 的型別形狀。 | 區分 component declaration 與 service API contract。 |
| 泛型機會 | `09-generic-design-opportunities.md` | Generic opportunities | 標記可泛型化的改良設計機會。 | 判斷哪些元件值得引入 `TRecord`、`TModel`、`TValue`。 |
| 邊界與取捨 | `10-type-system-boundaries-and-tradeoffs.md` | 型別系統邊界 | 總結這套型別系統的成本與取捨。 | 用精準度層級理解型別，不用「好 / 壞」二分。 |
| 閱讀清單 | `11-type-reading-checklist.md` | 單一元件檢查表 | 提供閱讀單一元件型別時的檢查清單。 | 把 runtime、types、registry、plugin 放在一起查。 |
| 小型仿作 | `12-mini-reimplementation-labs.md` | Mini labs | 用小型仿作練習 props、emits、plugin、泛型設計。 | 把閱讀能力轉成可實作的型別設計能力。 |

這份索引可以視為一條由淺入深的學習路線：先建立地圖，再拆 props、events、instance、plugin，接著分析複雜元件和命令式 API，最後總結邊界並透過練習驗證理解。

---

## 6. 核心內容逐步講解

### 6.1 為什麼要先讀 `01-type-system-overview.md`

閱讀任何 source code 之前，最容易犯的錯是直接跳進單一檔案，然後迷失在細節裡。`01-type-system-overview.md` 的作用是先建立地圖：哪些檔案屬於 runtime，哪些檔案屬於 type declaration，哪些檔案是 package-level entry，哪些檔案是 component registry。

對 View UI Plus 這類 runtime 與 `.d.ts` 分離的專案來說，地圖比單一 API 更重要。因為你看到一個 prop 或 method 時，必須知道它可能分散在三個位置：runtime component、component declaration、registry export。

### 6.2 Props 是最容易入門的型別契約

`02-component-props-contract.md` 適合作為第一個深入主題。Props 通常是 component public API 中最直觀的一層，因為使用者會直接在 template 中寫：

```vue
<Button type="primary" html-type="submit" />
```

在型別宣告中，這可能對應到：

```ts
'html-type'?: 'button' | 'submit' | 'reset';
type?: 'default' | 'primary' | 'success' | 'warning' | 'error';
```

閱讀 props 時，要特別注意 runtime 和 public type 的命名差異。Vue runtime 可能使用 camelCase，例如 `htmlType`；template 與 declaration 則可能使用 kebab-case，例如 `'html-type'`。這不是隨意命名，而是元件庫要兼顧 Vue template 使用習慣與 TypeScript 提示體驗的結果。

### 6.3 Emits 與 `v-model` 是型別契約的第二層

`03-emits-and-v-model-types.md` 會進入事件。事件比 props 複雜，因為你不能只看事件名稱，還要看 payload。

例如：

```txt
click -> onClick
on-change -> onOnChange
update:modelValue -> 'onUpdate:modelValue'
```

`onOnChange` 這種命名看起來不自然，但它反映了 View UI Plus 為了相容既有事件命名，例如 `@on-change`，而在 TypeScript listener prop 上產生的結果。這一點很適合拿來理解 library API 相容性與型別美觀之間的取捨。

### 6.4 Instance 與 ref API 要區分 public method 與內部 method

`04-component-instance-and-ref-api.md` 的重點是 template ref。使用者可能希望這樣使用元件：

```ts
inputRef.value?.focus();
```

這就牽涉到 declaration file 是否導出 `InputInstance`，以及該 instance 是否描述了 `focus()`、`blur()` 這類方法。

但不是 runtime `methods` 裡的所有方法都應該被視為 public API。像 `handleInput()`、`setCurrentValue()` 這類方法，通常比較像內部實作細節。閱讀時要判斷：這個 method 是使用者應該透過 ref 呼叫的 API，還是元件內部為了處理事件與狀態而存在的 helper method。

### 6.5 Plugin global types 代表 Options API 使用體驗

`05-global-plugin-types.md` 會處理 `install`、`$VIEWUI`、`$Message`、`$Modal` 等全域屬性。這些 API 對 Options API 使用者尤其重要，因為他們可能會寫：

```ts
this.$Message.success('saved');
```

若 `ComponentCustomProperties` 沒有宣告 `$Message`，TypeScript 會認為 `this.$Message` 不存在。若宣告成 `any`，TypeScript 會承認它存在，但不會精準檢查 `success()` 的參數與回傳值。因此 global API 也有精準度層級：property-level 只是承認屬性存在，method-level 才能描述方法契約。

### 6.6 Public component registry 決定 named import 體驗

`06-public-component-registry.md` 對應 `types/viewuiplus.components.d.ts`。這個檔案的功能是集中管理 public components 的 named exports，例如：

```ts
export { Button, ButtonGroup } from './button';
export { Table, TableColumnConfig } from './table';
export { Modal, ModalInstance } from './modal';
```

這個 registry 的價值在於：使用者可以從 View UI Plus 的型別入口取得元件與相關型別，而不必直接知道每個 component declaration 的檔案位置。

閱讀 registry 時，要對照 runtime named export。若 runtime 匯出了某元件，但 type registry 沒有匯出，就會造成使用者在 TypeScript 中無法取得對應型別。若 type registry 匯出了 runtime 不存在的項目，也會造成錯誤期待。

### 6.7 Table 與 Form 是觀察複雜型別取捨的核心案例

`07-table-and-form-as-type-case-studies.md` 是本區從基礎型別進入資料流型別的轉折點。Table 和 Form 不只是接收幾個簡單 props，而是會接收資料結構，並把資料傳到 columns、events、slots、rules 或 validators 裡。

例如 Table 可能牽涉：

```txt
data row
  -> column key
  -> render params
  -> row click event
  -> scoped slot props
```

Form 可能牽涉：

```txt
model shape
  -> FormItem prop
  -> rules
  -> validator value
  -> validate callback
```

這些都是泛型能發揮價值的地方。若沒有泛型，型別通常只能停留在 `any[]`、`object`、`string` 這類寬鬆層級。

### 6.8 Modal、Message、Notice 要用 service API 角度閱讀

`08-overlay-and-imperative-api-types.md` 處理的是命令式 API。這類 API 和普通 component declaration 不同，因為使用者不一定只透過 template 使用它們，也可能直接呼叫：

```ts
Message.success('saved');
Modal.confirm({ title: 'Confirm', content: 'Are you sure?' });
Notice.open({ title: 'Info' });
```

這時候型別重點不再只是 `DefineComponent<{ ... }>`，而是 service object 有哪些 methods、每個 method 接收什麼 options、是否支援 string shortcut、回傳值是 close function 還是 void。

### 6.9 泛型設計要從資料流關聯開始

`09-generic-design-opportunities.md` 不是要求把所有元件都改成泛型，而是要找出泛型真正能提升型別安全的地方。判斷標準通常是：使用者傳入的資料是否會在其他 API 中被再次使用。

例如 Table 的 `TRecord` 可以讓 `data`、`columns`、`render params.row`、`on-row-click` 共享同一個 row type。Form 的 `TModel` 可以讓 `model`、`rules`、`FormItem.prop`、validator value 建立關聯。

如果某個元件沒有明顯資料流關係，泛型可能只會增加複雜度，而不一定帶來足夠收益。

### 6.10 邊界、清單與練習是最後的整合

`10-type-system-boundaries-and-tradeoffs.md`、`11-type-reading-checklist.md`、`12-mini-reimplementation-labs.md` 是整個目錄的整合階段。

`10` 幫你用「邊界與取捨」的角度理解 View UI Plus 的型別系統，不再只問它好不好，而是問它精準到哪裡、弱在哪裡、為什麼這樣設計。

`11` 把閱讀流程整理成檢查清單，讓你未來讀單一元件時可以照表操作。

`12` 則把前面讀到的概念轉成小型仿作練習，讓你不只會看別人的型別，也能設計自己的 component public contract。

---

## 7. 表格整理

### 7.1 檔案角色表

| 檔案 / 目錄 | 類型 | 負責職責 | 初次閱讀重點 |
| --- | --- | --- | --- |
| `src/components/**` | Runtime source | 定義元件實際 props、emits、slots、methods。 | 不要只看 declaration，要回來確認實際行為。 |
| `src/index.js` | Runtime plugin entry | 安裝元件、掛載 globalProperties、提供 plugin API。 | 對照 `types/index.d.ts` 的 `install` 與 module augmentation。 |
| `types/index.d.ts` | Type entry | 定義 package 層級的型別入口。 | 檢查 `typings`、global properties、main exports。 |
| `types/viewuiplus.components.d.ts` | Component registry type | 集中匯出 public components 與部分 helper types。 | 對照 runtime named exports 是否一致。 |
| `types/<component>.d.ts` | Component declaration | 描述單一元件的 props、events、slots、instance 或 service API。 | 判斷精準契約與弱契約的位置。 |
| `package.json` | Package metadata | 指定 type entry，例如 `typings`。 | 確認 TypeScript 從哪個 `.d.ts` 進入。 |

### 7.2 型別閱讀面向表

| 面向 | 要問的問題 | 常見檢查位置 | 判斷標準 |
| --- | --- | --- | --- |
| Props | public prop 名稱與 runtime prop 是否對齊？ | `src/components/**`、`types/<component>.d.ts` | literal union 是否與 validator 一致。 |
| Emits | event 名稱與 payload 是否被描述？ | `$emit`、`emits`、listener props | 是否只寫 `any`，還是能表達 payload。 |
| `v-model` | model prop 與 update listener 是否成對？ | `modelValue`、`update:modelValue` | 是否有 `'model-value'` 與 `'onUpdate:modelValue'`。 |
| Slots | slot 名稱與 slot props 是否被型別化？ | template `<slot>`、`'v-slots'` | 是否只提示 slot name，或能描述 scoped slot props。 |
| Instance | ref 可呼叫的方法是否明確？ | runtime `methods`、`XxxInstance` | 是否區分 public method 與 internal method。 |
| Service API | 命令式 API 是否有 method-level contract？ | `src/components/<name>/index.js`、`types/<name>.d.ts` | 是否避免只用 `any`。 |
| Global API | `this.$Xxx` 是否可被 TypeScript 承認？ | `types/index.d.ts` 的 `ComponentCustomProperties` | 是 property-level 還是 method-level。 |
| 泛型 | 資料流是否能被同一個 type parameter 串起來？ | Table、Form、Select、Tree 等 | 是否能建立 row / model / option 關聯。 |

---

## 8. 範例或情境說明

### 8.1 情境一：閱讀 Button 型別

Button 適合作為入門元件，因為它主要考驗 props 與事件 listener。

閱讀順序可以是：

```txt
1. 找 `src/components/button/**`
2. 找 `types/button.d.ts`
3. 對照 props，例如 type、size、disabled、loading、htmlType
4. 檢查 public type 是否使用 `'html-type'`
5. 檢查 click event 是否對應 `onClick`
6. 檢查 `types/viewuiplus.components.d.ts` 是否 export Button
```

Button 這類元件通常不需要優先泛型化，因為它沒有複雜資料流。它的重點是 props union 是否精準、事件是否命名合理、runtime 與 `.d.ts` 是否一致。

### 8.2 情境二：閱讀 Input 型別

Input 比 Button 多了 `v-model` 與多種事件，因此適合用來理解 emits。

閱讀時要問：

```txt
modelValue 對應哪個 public prop？
update:modelValue 是否有 listener type？
on-change 是不是被整理成 onOnChange？
clear event 有沒有 payload？
```

這個情境的重點是事件 payload，不是只確認事件名稱。若 `.d.ts` 只寫 `(event?: any) => any`，代表它能提示事件存在，但 payload 契約仍不夠精準。

### 8.3 情境三：閱讀 Table 型別

Table 是資料型元件，應該用資料流角度閱讀。不能只看 `data?: any[]` 和 `columns?: any[]`，而要追問：

```txt
row type 能不能傳到 column render？
column key 能不能限制為 row key？
row click event 能不能拿到同一個 row type？
slot props 是否描述 row、column、index？
```

如果這些問題都無法由目前 `.d.ts` 精準回答，就代表 Table 有泛型改良空間。

### 8.4 情境四：閱讀 Message 型別

Message 是 service-style API，閱讀時不應只看它是不是一個 component。你需要檢查：

```txt
Message.success(options) 接收 string 還是 object？
Message.success() 回傳 close function 還是 void？
Message.config() 的 options 是否和 success() options 分開？
this.$Message 和 named import Message 是否應該共用同一個 interface？
```

這類 API 的型別重點是 method-level contract，而不是 template props。

---

## 9. 閱讀路線或學習路線

### 9.1 初次閱讀路線

第一次讀本區時，建議照原始主線閱讀：

```txt
01 overview
  -> 02 props
  -> 03 emits / v-model
  -> 04 instance / ref
  -> 05 plugin global types
  -> 06 component registry
  -> 07 Table / Form cases
  -> 08 imperative APIs
  -> 09 generic opportunities
  -> 10 boundaries
  -> 11 checklist
  -> 12 labs
```

這條路線的目的，是先建立完整地圖，再逐步拆解各種型別契約，最後透過 checklist 和 lab 轉成自己的分析能力。

### 9.2 如果你只想快速分析單一元件

可以走壓縮路線：

```txt
01 overview
  -> 11 checklist
  -> 對照目標元件的 `src/components/**`
  -> 對照 `types/<component>.d.ts`
  -> 對照 `types/viewuiplus.components.d.ts`
```

這條路線適合你正在讀某個具體元件，例如 Button、Input、Table、Modal，想快速判斷 runtime 和 type 是否一致。

### 9.3 如果你想練習設計自己的 component library 型別

可以走實作路線：

```txt
02 props
  -> 03 emits / v-model
  -> 05 plugin global types
  -> 08 imperative APIs
  -> 09 generic opportunities
  -> 12 labs
```

這條路線的目標不是讀完所有 View UI Plus 細節，而是把 props、events、plugin、service、generic 這幾種型別設計能力拿出來練。

### 9.4 可以暫時跳過的部分

如果你剛開始讀，可以先暫時跳過泛型改良細節。泛型需要對 props、events、slots、data flow 都有一定理解後，才比較容易看出價值。建議先掌握 runtime/type 對照，再回頭讀 `09-generic-design-opportunities.md` 和 `12-mini-reimplementation-labs.md`。

---

## 10. 常見誤區

| 誤區 | 為什麼容易誤解 | 正確理解 |
| --- | --- | --- |
| 看到 `types/*.d.ts` 就以為 runtime 一定一致 | `.d.ts` 是人工維護的 declaration layer，不一定自動從 runtime 產生。 | 要對照 `src/components/**` 和 `types/*.d.ts`，確認兩邊是否同步。 |
| 只看 props，不看 emits、slots、instance | Props 最直觀，容易讓人以為型別閱讀只到 props 為止。 | 完整 public contract 包含 props、events、slots、ref methods、global API、service API。 |
| 看到 `any` 就認為設計很差 | `any` 可能是相容性與維護成本下的取捨。 | 要判斷它是合理彈性，還是可改善的弱契約。 |
| 把 `onOnChange` 當成命名錯誤 | 從現代 Vue API 看起來不自然。 | 它通常來自保留 `on-change` 事件命名後轉成 listener prop 的結果。 |
| 認為所有元件都應該泛型化 | 泛型會增加 declaration 複雜度。 | 優先泛型化資料流明顯的元件，例如 Table、Form、Select、Tree。 |
| 只看 `ComponentCustomProperties` 有沒有 `$Message` | 看到 property 存在就以為 global API 型別完整。 | 還要檢查 `$Message.success()`、`$Modal.confirm()` 等 method contract 是否精準。 |
| 把 README 當成普通索引 | README 看起來只是目錄列表。 | 在知識庫中，README 應該是導讀章，用來建立閱讀策略與心智模型。 |

---

## 11. 本章總結

`06-type-system/` 是用來理解 View UI Plus TypeScript public contract 的專門目錄。它的核心不是研究元件內部如何用 TypeScript 寫成，而是研究一個以 Vue SFC / JavaScript Options API 為主的元件庫，如何透過 `types/*.d.ts` 對 TypeScript 使用者提供型別支援。

本區的閱讀主線可以概括成三句話：

```txt
runtime source 定義實際行為
declaration files 定義對外型別契約
兩者必須對照閱讀，不能任選一邊當作完整事實
```

讀這套型別系統時，應該逐層觀察：props 是否有 literal union，emits 是否有 payload，`v-model` 是否有 update listener，slots 是否有 scoped props，instance methods 是否被描述，service API 是否有 method-level contract，global properties 是否只是 `any`，資料型元件是否值得泛型化。

這個 README 的價值，是讓你在進入 12 篇筆記前先建立完整地圖。當你知道每篇筆記負責哪一層，就不會把型別系統看成零散的 `.d.ts` 檔案，而能把它理解成一套由 runtime behavior、public contract、developer experience 與維護取捨共同組成的設計系統。

---

## 12. 自我檢查問題

1. 為什麼 `06-type-system/` 的重點不是「View UI Plus 內部是否全部用 TypeScript 寫成」？
2. `src/**/*.vue / src/**/*.js` 和 `types/*.d.ts` 分別代表什麼？
3. 為什麼閱讀 View UI Plus 型別時不能只看 `.d.ts`？
4. `types/index.d.ts` 和 `types/viewuiplus.components.d.ts` 的角色有什麼不同？
5. Props 型別、event listener 型別、instance 型別、service API 型別分別解決什麼問題？
6. 為什麼 `$Message: any` 只能算 property-level support，而不是完整 service contract？
7. 哪些元件比較值得優先泛型化？原因是什麼？
8. 如果 runtime 新增一個 prop，哪些型別檔案可能需要同步檢查？
9. 為什麼 `README.md` 在這個目錄中不應只是一張筆記清單？
10. 如果你要分析一個新元件的型別設計，應該從哪幾個檔案開始？

---

## 13. 後續延伸方向

這份 README 後續可以延伸出幾種更細的筆記或維護文件：

1. **型別閱讀 SOP**：把 `11-type-reading-checklist.md` 進一步改成可以複製使用的元件檢查模板。
2. **元件型別成熟度表**：針對每個 View UI Plus 元件標記 props、emits、slots、instance、service、generic 的完整度。
3. **Runtime / Type Gap Tracker**：記錄 runtime 支援但 `.d.ts` 缺漏的 API，或 `.d.ts` 宣告但 runtime 需要確認的 API。
4. **泛型改良設計草案**：針對 Table、Form、Select、Tree 等元件設計現代 TypeScript 版本的 helper types。
5. **Service API 型別重構筆記**：專門整理 Message、Modal、Notice、LoadingBar 的命令式 API interface。
6. **Component Registry 同步規則**：建立新增元件時 runtime registry 與 type registry 必須同步修改的規則。
7. **型別測試策略**：補充如何用 `tsd`、`expect-type` 或 TypeScript compile test 驗證 `.d.ts` 的 public contract。

---

## 14. 使用本目錄的建議方式

未來你回來使用這個目錄時，可以依照目的選路線。

如果你是要重新建立完整理解，從 `01` 讀到 `12`。如果你是要分析某個具體元件，先讀 `11-type-reading-checklist.md`，再回到該元件的 runtime 與 `.d.ts`。如果你是要訓練自己的型別設計能力，直接進入 `12-mini-reimplementation-labs.md`，再回頭查 `02`、`03`、`05`、`08`、`09` 的說明。

最重要的是：不要把這個目錄當成背誦型筆記，而要把它當成一套「閱讀元件庫 public contract 的方法」。只要掌握 runtime 與 declaration 的對照方式，你之後閱讀其他 Vue component library、設計自己的 component library，或重構舊有 UI 元件型別時，都可以沿用同一套方法。
