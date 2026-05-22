# Type Reading Checklist：閱讀單一元件型別的檢查清單

## 1. 本章定位

本章是 View UI Plus 型別系統閱讀的「單一元件檢查流程」筆記，適合放在 `06-type-system/` 目錄下。這個目錄的主題是 View UI Plus 的 TypeScript 型別設計，包含 props、emits、instance、public API 與泛型；而本章的功能，是把這些主題整理成一套可重複使用的閱讀方法。

讀完本章後，你應該能做到三件事。

第一，你能在閱讀某個元件時，不只看 `types/<component>.d.ts`，而是知道要同步檢查 runtime source、type declaration、export registry、plugin install、global properties 與可能的文件化意圖。

第二，你能判斷某個元件的型別支援目前做到哪一層。例如它可能只做到 props autocomplete，也可能有 event listener 型別，也可能進一步提供 instance type 或 service method contract。

第三，你能把閱讀結果整理成一張判斷表，標記哪些地方是強契約、哪些地方只是弱提示、哪些地方 runtime/type 不一致、哪些地方值得後續泛型化。

本章不負責深入改寫 View UI Plus 的型別宣告，也不會直接設計完整的 `TableColumn<T>`、`FormRules<TModel>` 或 `Select<TValue>` 型別。這些屬於後續「型別改良方案」或「泛型設計」筆記。本章的核心任務是先建立閱讀方法。

---

## 2. 學習前先建立的基本觀念

### 2.1 `.d.ts` 是型別契約，不等於 runtime 真相

閱讀 View UI Plus 的型別時，第一個重要觀念是：`.d.ts` 檔案描述的是 TypeScript 看到的 public contract，但真正執行的行為仍然來自 runtime source。

換句話說，`types/<component>.d.ts` 告訴 TypeScript「使用者可以怎麼寫」，但 `src/components/<name>/**` 才告訴你「元件實際怎麼跑」。如果這兩邊沒有同步，就可能出現幾種情況：

```txt
runtime 有 prop，但 .d.ts 沒有宣告
.d.ts 有 prop，但 runtime 不存在
runtime validator 限制很窄，但 .d.ts 型別寫得很寬
runtime emit 有 payload，但 .d.ts listener 寫成 any
```

因此，閱讀型別不能只打開 declaration file 看一眼。你真正要做的是「對帳」：把 runtime 實作和 type declaration 一項一項比對。

### 2.2 型別閱讀的核心不是找錯，而是判斷契約層級

在 View UI Plus 這類由 JS runtime 搭配 `.d.ts` 的元件庫中，型別系統通常不是一次到位的完整模型，而是一層 declaration layer。它可能先提供 props autocomplete，再逐步補上 event payload、service methods、instance methods 或泛型。

所以閱讀時不要只用「有型別 / 沒型別」二分法，而要問：

```txt
這個元件的型別契約精準到哪一層？
```

常見層級如下：

| 契約層級 | 代表意思 | 範例 |
| --- | --- | --- |
| property-level | 只承認某個 property 存在 | `this.$Message` 存在，但型別是 `any` |
| props-level | 能提示 props 名稱與基本型別 | `'html-type'?: 'button' \| 'submit' \| 'reset'` |
| event-level | 能提示事件 listener 與 payload | `onOnChange?: (value: string) => void` |
| slot-level | 能提示 slot 名稱 | `'v-slots'?: { header?: () => any }` |
| scoped-slot-level | 能描述 slot props | `default?: (props: { row: T }) => any` |
| instance-level | 能描述 ref 上可呼叫的方法 | `focus(): void`、`blur(): void` |
| service-level | 能描述 `$Message.success()` 等 API | `success(options): () => void` |
| data-flow-level | 能用泛型串起資料、欄位、事件、slot | `TableColumn<TRecord>`、`FormRules<TModel>` |

本章的 checklist，就是幫你判斷一個元件目前落在哪些層級。

### 2.3 要同時看四個面向：runtime、type、registry、plugin

閱讀單一元件型別時，至少要看四個面向。

第一是 runtime source，也就是元件真正的實作。你要在這裡找 props、emits、methods、slots、mixins、service object 與實際 payload。

第二是 type declaration，也就是 `types/<name>.d.ts`。你要在這裡確認 public props、listener props、instance type、slot hints、service interface 是否存在。

第三是 registry，也就是元件是否有被集中匯出。runtime 的 named export 與 type 的 named export 都要檢查，否則使用者可能無法正常 import 或無法拿到正確型別。

第四是 plugin 與 globalProperties。像 `$Message`、`$Modal`、`$Notice` 這種全域服務，不只要看元件自己的型別，還要看 `ComponentCustomProperties` 中是否有補上對應屬性。

---

## 3. 整體概覽

### 3.1 單一元件型別閱讀流程

讀任一元件時，可以把流程想成下面這條路線：

```txt
指定元件
  ↓
找 runtime source
  ↓
找 type declaration
  ↓
檢查 export registry
  ↓
對照 props
  ↓
對照 emits / v-model
  ↓
對照 slots
  ↓
對照 instance methods
  ↓
如果是 service-style API，再檢查 service object / globalProperties
  ↓
標記 any / Function / object 等弱型別
  ↓
判斷是否有泛型改良價值
  ↓
填寫最終判斷表
```

這條流程的重點不是一次看完所有細節，而是避免漏掉型別系統中最常出現落差的地方。對 View UI Plus 這類元件庫來說，props 通常比較容易被宣告出來；真正容易缺口出現在 event payload、scoped slot props、ref instance methods、service API 與資料型元件的泛型關聯。

### 3.2 檢查面向總表

| 面向 | 主要問題 | 對應檔案 | 閱讀目標 |
| --- | --- | --- | --- |
| runtime source | 元件實際支援什麼？ | `src/components/<name>/**` | 找出 props、emits、slots、methods、mixins |
| type declaration | TypeScript 使用者看到什麼？ | `types/<name>.d.ts` | 檢查 public contract 是否完整 |
| runtime registry | runtime 是否能 named import？ | `src/components/index.js` | 檢查元件是否被實際匯出 |
| type registry | type 是否能 named import？ | `types/viewuiplus.components.d.ts` | 檢查型別匯出是否對齊 |
| package type entry | 套件型別入口是否正確？ | `types/index.d.ts` | 確認 package 對 TS 的入口 |
| plugin install | 是否有掛到 app 或 globalProperties？ | `src/index.js` | 檢查全域 API 安裝行為 |
| global property type | Options API 的 `this.$Xxx` 是否有型別？ | `types/index.d.ts` 的 `ComponentCustomProperties` | 檢查 `$Message`、`$Modal` 等全域屬性 |

這張表可以當作閱讀任何元件時的起點。你不一定每次都需要深入研究全部檔案，但至少要知道當你看到某種 API 型態時，應該往哪個檔案追。

---

## 4. 核心內容逐步講解

### 4.1 第一步：先確認元件屬於哪一種 API 型態

在開始查檔案前，先判斷你讀的元件是哪一種類型。不同型態的元件，檢查重點不同。

| 元件型態 | 例子 | 主要檢查重點 |
| --- | --- | --- |
| 一般 UI 元件 | `Button`、`Icon`、`Divider` | props、class/style、slot、named export |
| 表單輸入元件 | `Input`、`Select`、`Checkbox` | props、`v-model`、`update:modelValue`、event payload、instance methods |
| 資料型元件 | `Table`、`Tree`、`Transfer` | data、columns、row/node/option、scoped slots、泛型價值 |
| 表單結構元件 | `Form`、`FormItem` | model、rules、prop path、validate instance API、泛型價值 |
| service-style API | `Message`、`Modal`、`Notice`、`LoadingBar` | service object methods、options overload、return type、globalProperties |
| 複合元件 | `Table`、`Upload`、`TreeSelect` | props、events、slots、instance、資料流關聯 |

這一步很重要，因為不是每個元件都值得用同樣深度研究。例如 `Button` 的型別重點多半是 props 與 slot；但 `Table` 的重點就不只是 props，還包含 row data、column config、render function、selection/change payload、scoped slot props 與泛型設計空間。

### 4.2 第二步：找 runtime component source

runtime source 是型別閱讀的事實來源。通常你會先從下面位置開始：

```txt
src/components/<name>/**
```

在 runtime source 中，你要找的不是所有細節，而是和 public API 有關的內容：

| 要找的內容 | 為什麼重要 | 閱讀方式 |
| --- | --- | --- |
| `props` | 決定元件公開可傳入的參數 | 看 prop 名稱、型別、default、validator |
| `emits` | 決定元件宣告的事件 | 先看事件名，再搜尋 `$emit` |
| `$emit(...)` | 決定事件實際 payload | 不要只看 `emits` 名稱 |
| `<slot>` | 決定 runtime slot 名稱與 slot props | 搜尋 template 中的 slot 使用 |
| `methods` | 可能包含 public ref API，也可能只是內部方法 | 判斷是否應暴露成 instance type |
| `mixins` | props 或 methods 可能來自共用邏輯 | 避免只看本檔漏掉 shared props |
| service object | service-style API 的方法來源 | 對 Message / Modal / Notice 特別重要 |

這裡要特別注意：runtime source 中出現的方法，不代表全部都是 public API。像 `handleXxx()`、`setCurrentValue()`、`updateStatus()` 這類方法通常比較像內部流程；而 `focus()`、`blur()`、`validate()`、`resetFields()` 這類方法比較可能是給外部透過 ref 呼叫的 public instance API。

### 4.3 第三步：找 type declaration 與 export registry

找到 runtime source 後，接著要找對應的型別宣告：

```txt
types/<name>.d.ts
```

這個檔案通常是 TypeScript 使用者最直接接觸到的元件型別。你需要檢查它是否有宣告：

```txt
props
event listener props
v-slots
instance type
service interface
helper types
```

但只看 `types/<name>.d.ts` 還不夠，因為使用者通常會從套件入口 import 元件或型別。因此你還要檢查 registry：

| 要找什麼 | 位置 | 檢查目的 |
| --- | --- | --- |
| runtime named export | `src/components/index.js` | 確認元件 runtime 有被匯出 |
| type named export | `types/viewuiplus.components.d.ts` | 確認 TypeScript named import 有型別 |
| package type entry | `types/index.d.ts` | 確認套件型別入口包含必要匯出 |
| global property type | `types/index.d.ts` 的 `ComponentCustomProperties` | 確認 `$Message`、`$Modal` 等 this 屬性 |

如果某個元件 runtime 有匯出，但 type registry 沒有匯出，使用者就可能在 import 時失去型別支援。如果 `.d.ts` 有型別，但 runtime registry 沒有匯出，則可能產生「型別看起來存在，但實際 import 不到」的落差。

### 4.4 Props Checklist：從名稱、限制、預設值到弱型別

props 是最容易開始閱讀的部分，但也最容易只停留在表面。讀 props 時，不要只問「`.d.ts` 有沒有這個 prop」，而要逐層比對。

| 檢查問題 | 目的 | 可能發現的問題 |
| --- | --- | --- |
| runtime prop 名稱是 camelCase 還是 kebab-case？ | 對照實作名稱與 template 使用名稱 | runtime 是 `htmlType`，public type 可能是 `'html-type'` |
| `.d.ts` 是否使用 kebab-case？ | 確認 template 使用體驗 | 型別可能偏向 Vue template 使用者 |
| runtime 有沒有 validator？ | 判斷是否能收斂成 literal union | runtime 限定三種值，但 type 寫成 `string` |
| type union 是否和 validator 一致？ | 找出過寬或過窄 | union 少值、多值或拼字不一致 |
| runtime default 是否依賴 `$VIEWUI`？ | 連到 global config | prop 預設值可能不是固定值 |
| prop 是否來自 mixin？ | 不漏掉 shared props | 只看本元件會漏掉共用 props |
| prop 是否是 `any` / `object` / `Function`？ | 標記弱契約 | callback、data、rules 可能缺少結構型別 |

以 `Button.htmlType` 為例：

```txt
Button.htmlType
  runtime: htmlType
  public type: 'html-type'
  validator: button / submit / reset
  type: 'button' | 'submit' | 'reset'
```

這個例子代表一個理想狀態：runtime validator 的允許值可以對應到 `.d.ts` 裡的 literal union。這樣使用者在 TypeScript 中傳錯值時，IDE 或編譯器就有機會提前提醒。

閱讀 props 時可以用下面這句話作為判斷標準：

```txt
如果 runtime 已經知道允許值，.d.ts 是否也把這個知識交給 TypeScript？
```

如果答案是否定的，通常就是一個可以改良的型別點。

### 4.5 Emits Checklist：不要只看事件名，要看實際 payload

events 是 View UI Plus 型別閱讀中很容易出現落差的地方。因為 `emits` 可能只列出事件名稱，但真正對使用者有價值的是 payload 型別。

讀 emits 時要問：

| 檢查問題 | 目的 | 注意事項 |
| --- | --- | --- |
| runtime `emits` 有列出嗎？ | 確認正式事件 | 有些舊寫法可能沒有完整宣告 |
| `$emit` 實際 payload 是什麼？ | 找出事件真正傳出的資料 | 必須搜尋 `$emit(...)` |
| `.d.ts` 是否有 `onXxx` / `onOnXxx`？ | 確認 listener prop 是否存在 | View UI Plus 可能保留 `on-change` 命名 |
| event 是 `click` 還是 `on-click`？ | 判斷 listener 命名形式 | 會影響 `onClick` 或 `onOnClick` |
| 是否有 `update:modelValue`？ | 判斷是否支援 `v-model` | Vue 3 的雙向綁定核心 |
| 是否有對應 `'model-value'` prop？ | 判斷 model prop type | prop 與 event 要一起看 |
| 是否有 `onUpdate:modelValue` type？ | 判斷 update listener 精準度 | 需要確認 `.d.ts` 是否支援 |
| payload 是否是 `any`？ | 標記改良空間 | 事件存在不等於 payload 精準 |

事件命名常見對照如下：

```txt
click -> onClick
on-change -> onOnChange
on-visible-change -> onOnVisibleChange
update:modelValue -> 理想上可對應 'onUpdate:modelValue'
```

`onOnChange` 這種命名看起來不美觀，但它通常不是單純設計錯誤，而是相容性取捨。View UI Plus 延續 iView / View UI 的事件命名習慣，保留 `@on-change` 這類 API，TypeScript listener prop 自然就可能變成 `onOnChange`。

閱讀 emits 時的核心問題是：

```txt
使用者監聽這個事件時，TypeScript 知不知道 payload 是什麼？
```

如果 `.d.ts` 只寫：

```ts
onOnChange?: (event?: any) => any;
```

那它至少提示了事件存在，但沒有真正建立 payload contract。這類型別支援屬於「事件名稱層級」而不是「事件資料層級」。

### 4.6 v-model Checklist：把 model prop 和 update event 一起看

在 Vue 3 中，`v-model` 通常牽涉兩個部分：

```txt
modelValue prop
update:modelValue event
```

而在 View UI Plus 的 public type 中，template prop 可能會以 kebab-case 寫成：

```txt
'model-value'
```

因此閱讀支援 `v-model` 的元件時，要一起檢查：

| 檢查項目 | 要確認什麼 |
| --- | --- |
| 是否有 `modelValue` 或對應 model prop | runtime 是否真的接收 model 值 |
| `.d.ts` 是否有 `'model-value'` | template 使用時是否有型別提示 |
| 是否有 `$emit('update:modelValue', value)` | runtime 是否真的更新 model |
| `.d.ts` 是否有 `onUpdate:modelValue` | listener 是否被型別化 |
| value 型別是否一致 | prop、event payload、option value 是否對齊 |

對 `Input`、`Select`、`Checkbox`、`Radio` 這類輸入型元件來說，`v-model` 是資料流的核心。如果 prop 型別是 `string | number`，但 event payload 寫成 `any`，代表 TypeScript 無法保護「輸入值傳出」這一段資料流。

### 4.7 Slots Checklist：先分清楚 slot 名稱提示與 scoped slot props

slots 型別也是常見弱點。declaration 形式如下：

```ts
'v-slots'?: {
  header?: () => any;
  footer?: () => any;
  default?: () => any;
}
```

這種寫法有價值，因為它至少讓使用者知道元件有哪些 slot 名稱。但它通常只做到「slot 名稱提示」，沒有完整描述 scoped slot props。

讀 slots 時要問：

| 檢查問題 | 目的 |
| --- | --- |
| template 中有哪些 `<slot>`？ | 找 runtime slot 名稱 |
| `.d.ts` 是否有 `'v-slots'`？ | 找 type slot hints |
| slot 是普通 slot 還是 scoped slot？ | 判斷是否需要 payload |
| slot props 是否被型別化？ | 判斷精準度 |
| slot 名稱和文件是否一致？ | 避免 runtime/type/docs gap |

普通 slot 只需要知道 slot 名稱就已經有基本價值；但 scoped slot 不同。像 `Table`、`Tree`、`Select` 這種元件，slot 可能會傳入：

```txt
row
column
index
option
node
```

如果 `.d.ts` 只寫 `() => any`，TypeScript 就無法提示 `row` 有哪些欄位，也無法檢查你使用的 `column.key` 是否正確。這類缺口通常和泛型高度相關，因為 `row`、`node`、`option` 的型別往往來自使用者傳入的資料。

### 4.8 Instance Methods Checklist：區分 public ref API 與內部方法

component instance type 是使用者透過 `ref` 操作元件時會用到的型別。例如：

```txt
Input.focus()
Input.blur()
```

這類方法通常比較像 public ref API；而下面這種方法通常比較像元件內部實作：

```txt
handleInput()
setCurrentValue()
updateStatus()
```

判斷某個 runtime method 是否應該出現在 `XxxInstance` 中，可以用以下標準：

| 判斷標準 | 說明 |
| --- | --- |
| 方法名稱是否像 public action？ | `focus`、`blur`、`validate` 比 `handleXxx` 更像 public API |
| 是否可能被父元件透過 ref 呼叫？ | 使用者是否有實際操作需求 |
| 是否有文件或使用案例提到？ | 文件化通常代表 public contract |
| 方法參數與回傳值是否穩定？ | 不穩定的內部方法不適合暴露 |
| `.d.ts` 是否有導出 `XxxInstance`？ | 判斷目前型別系統是否支援 ref API |
| `InstanceType<typeof Xxx>` 是否可用？ | 判斷使用者能否取得元件 instance type |

閱讀 instance methods 時要避免兩種錯誤。第一種是把所有 runtime methods 都當成 public API；第二種是忽略真正應該提供給 ref 使用的 public methods。比較好的做法是先標記「疑似 public」，再回頭對照文件、使用案例與 `.d.ts` 是否已有 instance type。

### 4.9 Service API Checklist：Message / Modal / Notice 要另外處理

`Message`、`Modal`、`Notice`、`LoadingBar` 這類 API 和一般 SFC 元件不同。它們常常是透過 service object 暴露方法，例如：

```txt
Message.success(options) -> close function
Message.config(options) -> void
Modal.confirm(options) -> runtime opens modal
Modal.remove() -> removes modal
```

這類 API 的型別閱讀要另外處理，因為它們的 public contract 不只存在於元件 props，而是存在於 service methods。

如果是 service-style API，要檢查：

| 檢查問題 | 目的 |
| --- | --- |
| runtime object 有哪些 methods？ | 找 service API 清單 |
| options 可以是 string shortcut 嗎？ | 找 overload 或 union 設計需求 |
| method 回傳什麼？ | 找 close function / void / instance |
| `.d.ts` 是否有 service interface？ | 判斷 method-level contract |
| `ComponentCustomProperties` 是否只是 `any`？ | 判斷 global property 精準度 |
| named import 與 `this.$Xxx` 是否應同型別？ | 維護一致性 |

service API 最常見的型別落差是：named import 可能有一部分型別，但 `this.$Message` 在 `ComponentCustomProperties` 中仍然是 `any`。這表示 Options API 使用者可以寫 `this.$Message`，但 TypeScript 不會幫他檢查 `success()` 的 options、回傳值或 method name。

閱讀 service API 時的核心問題是：

```txt
這個 service 只是 property 存在，還是每個 method 都有精準 contract？
```

如果只是 `$Message: any`，那就是 property-level；如果能描述 `success`、`warning`、`config`、`destroy` 等方法與參數，才是 service-level contract。

### 4.10 弱型別 Checklist：把 `any` / `Function` / `object` 當成改良標記

在 View UI Plus 的 `.d.ts` 中看到 `any`、`Function`、`object` 時，不應該立刻判斷為錯誤。它們有時代表維護者在相容性、開發成本與型別精準度之間做出的取捨。

但它們一定值得標記，因為它們代表 TypeScript 在該位置無法提供完整保護。

| 弱型別 | 常見位置 | 風險 | 可能改良方向 |
| --- | --- | --- | --- |
| `any` | event payload、data、service options、slot props | TypeScript 幾乎不檢查 | 改成明確 interface、union 或 generic |
| `Function` | render、formatter、callback | 無法知道參數與回傳值 | 改成具名 function type |
| `object` | form model、rules、config | 無法描述欄位結構 | 改成 `Record<string, unknown>` 或泛型 |
| `any[]` | table data、options、tree nodes | 無法串起 row/node 型別 | 改成 `TRecord[]`、`TNode[]` |
| `() => any` | slot declaration | slot props 與回傳內容不清楚 | 改成 scoped slot function type |

弱型別的改良優先順序要看它是否位於「資料流交會處」。如果一個 `any` 只影響低頻 config，優先度可能不高；但如果它影響 `Table.data`、`TableColumn.render`、`Select.modelValue`、`Form.model` 或 scoped slot props，就更值得優先處理。

### 4.11 泛型價值 Checklist：判斷資料是否需要被串起來

泛型不是越多越好。對 UI 元件庫來說，泛型會提高型別能力，也會提高 declaration 複雜度與使用門檻。因此要先判斷這個元件是否真的有泛型價值。

一個元件是否值得泛型化，可以看它是否有「同一份使用者資料」流過多個 API 面向。

| 檢查問題 | 若答案是 yes | 可能的泛型 |
| --- | --- | --- |
| 是否接收使用者資料陣列？ | row / item 型別需要被保存 | `TRecord` / `TItem` |
| callback payload 是否回傳同一種資料？ | callback 參數應與資料陣列一致 | `(row: TRecord) => void` |
| option value 是否和 modelValue 對齊？ | value 型別應一致 | `TValue` |
| rules / prop 是否依賴 model shape？ | 欄位路徑應受 model 保護 | `TModel` / `FieldPath<TModel>` |
| slot props 是否包含 row/node/option？ | scoped slot props 應有資料型別 | `TNode` / `TOption` |

高優先元件通常是資料型或表單型元件：

```txt
Table
Form
Select
Tree
TreeSelect
Transfer
Upload
```

低優先元件通常是展示型或簡單互動元件：

```txt
Button
Icon
Divider
Badge
Alert
```

這不是說低優先元件完全不需要好型別，而是它們通常不需要泛型。像 `Button` 的型別重點在 literal union props 與 event listener；像 `Table` 的型別重點則是能不能把 `data`、`columns`、`render`、`selection`、`scoped slots` 串成同一個 `TRecord`。

---

## 5. 表格整理

### 5.1 檔案位置與角色總表

| 要找什麼 | 位置 / 寫法 | 角色 | 閱讀重點 |
| --- | --- | --- | --- |
| runtime component | `src/components/<name>/**` | 元件實際執行邏輯 | 找 props、emits、slots、methods、mixins |
| component declaration | `types/<name>.d.ts` | TypeScript public contract | 檢查 props、listener、slot、instance、service |
| runtime named export | `src/components/index.js` | runtime 匯出入口 | 確認使用者是否能 import 元件 |
| type named export | `types/viewuiplus.components.d.ts` | 型別匯出入口 | 確認 named import 是否有型別 |
| package type entry | `types/index.d.ts` | 套件型別總入口 | 檢查 package 對外暴露的型別範圍 |
| plugin install / globalProperties | `src/index.js` | Vue plugin 安裝與全域掛載 | 檢查 `$Message`、`$Modal` 等 runtime 行為 |
| global property type | `types/index.d.ts` 的 `ComponentCustomProperties` | Options API 的 `this.$Xxx` 型別 | 判斷 global API 是 `any` 還是精準 interface |
| service runtime | `src/components/<name>/index.js` | service-style API 的方法來源 | 對 Message / Modal / Notice 類 API 特別重要 |

### 5.2 單一元件型別檢查表

| 面向 | 要確認的問題 | 狀態填寫 | 備註範例 |
| --- | --- | --- | --- |
| runtime source 找到 | 是否找到元件主要實作檔？ | `yes/no` | `src/components/input/**` |
| type declaration 找到 | 是否找到對應 `.d.ts`？ | `yes/no` | `types/input.d.ts` |
| registry 對齊 | runtime export 與 type export 是否一致？ | `good/gap` | runtime 有匯出但 type 未匯出 |
| props 對齊 | runtime props 與 `.d.ts` 是否一致？ | `good/gap/weak` | validator 可收斂但 type 寫成 `string` |
| emits 對齊 | `$emit` payload 是否有 listener 型別？ | `good/gap/weak` | `onOnChange?: (...args: any[]) => any` |
| v-model 對齊 | model prop 與 update event 是否同型別？ | `good/gap/none` | `model-value` 有型別，但 update payload 是 `any` |
| slots 對齊 | runtime slot 與 `'v-slots'` 是否一致？ | `good/gap/weak` | 只有 slot name，沒有 scoped props |
| instance methods 有無型別 | public ref API 是否被描述？ | `good/gap/none` | `focus()` 有，但 `blur()` 缺 |
| global service 有無型別 | `$Xxx` 是否有 method-level contract？ | `good/gap/any` | `$Message: any` |
| 弱型別位置 | 哪些地方用了 `any` / `Function` / `object`？ | `list` | `data?: any[]`、`render?: Function` |
| 泛型價值 | 是否值得用泛型改良？ | `high/medium/low` | `Table` high，`Button` low |
| 後續處理 | 應該補型別、留註記或暫不處理？ | `fix/later/skip` | 高頻資料流優先補 |

### 5.3 型別缺口分級表

| 分級 | 意思 | 例子 | 處理建議 |
| --- | --- | --- | --- |
| `good` | runtime 與 type 對齊，型別足夠精準 | validator 與 literal union 一致 | 保留，必要時補註解 |
| `weak` | 有型別入口，但過度寬鬆 | `any`、`Function`、`() => any` | 標記改良空間 |
| `gap` | runtime 有能力，但 `.d.ts` 未描述 | 有 `$emit` payload 但 listener 缺型別 | 優先補 declaration |
| `mismatch` | runtime 與 type 不一致 | type 有值但 runtime validator 不接受 | 需要回查版本與實作 |
| `unknown` | 原始資料不足，無法判斷 | 文件未提供、程式碼未讀完 | 標註「此處需要後續補充」 |
| `not public` | runtime 有，但不應視為 public API | `handleInput()` | 不建議暴露到 instance type |

這張分級表可以避免你在閱讀時把所有問題都視為同等嚴重。真正高優先的通常是 `gap` 與 `mismatch`，其次才是高頻資料流位置的 `weak`。

---

## 6. 範例或情境說明

### 6.1 情境一：閱讀 `Button` 這類簡單 UI 元件

假設你要閱讀 `Button` 的型別，重點通常不是泛型，而是 props 與事件命名是否清楚。

你可以先到 runtime source 找 `props`，確認像 `htmlType` 這類 prop 是否有 validator。接著到 `types/button.d.ts` 檢查 public prop 是否使用 template 常見的 kebab-case，例如 `'html-type'`。如果 runtime validator 限定 `button / submit / reset`，而 `.d.ts` 也寫成 `'button' | 'submit' | 'reset'`，這就是一個良好的 props-level contract。

對 `Button` 來說，泛型價值通常很低。它不接收使用者資料陣列，也沒有 row、node、option 這類需要被串起來的資料。因此閱讀重點應放在 literal union、event listener、slot 名稱與 export registry。

### 6.2 情境二：閱讀 `Input` 這類表單輸入元件

假設你要閱讀 `Input`，除了 props 之外，還要特別檢查 `v-model` 和 instance methods。

你可以先找 runtime 是否有 `modelValue` 或對應 model prop，並搜尋 `$emit('update:modelValue', ...)`。接著到 `.d.ts` 檢查是否有 `'model-value'` prop，以及是否有 `onUpdate:modelValue` 或類似 listener 型別。

再來要看 instance methods。像 `focus()`、`blur()` 這類方法通常很可能是 public ref API，應該確認 `.d.ts` 是否有 `InputInstance` 或可透過 `InstanceType<typeof Input>` 取得方法型別。相反地，`handleInput()`、`setCurrentValue()` 比較可能是內部方法，不應急著列入 public instance type。

### 6.3 情境三：閱讀 `Message` 這類 service-style API

假設你要閱讀 `Message`，就不能只看一般 component declaration。你需要另外檢查：

```txt
src/components/message/index.js
types/message.d.ts
types/index.d.ts 的 ComponentCustomProperties
```

runtime 的 `Message.success(options)`、`Message.config(options)` 等方法，代表使用者真正會呼叫的 service API。你要確認 `.d.ts` 是否有 service interface 描述 method、options 與 return type。

如果 `ComponentCustomProperties` 中只寫 `$Message: any`，那代表 Options API 的 `this.$Message` 只做到 property-level。使用者可以寫 `this.$Message.success(...)`，但 TypeScript 不一定能檢查參數或 method name。這就是 service API 型別閱讀時要特別標記的弱契約。

### 6.4 情境四：閱讀 `Table` 這類資料型元件

假設你要閱讀 `Table`，你不應只記錄 `data?: any[]` 或 `columns?: any[]`，而要追問：

```txt
data 裡的 row 型別，有沒有傳到 columns？
columns 裡的 key，有沒有和 row 的欄位關聯？
render function 的 row / column / index 是否有型別？
selection / sort / filter event 的 payload 是否有 row 型別？
scoped slot props 是否包含 row / column / index？
```

如果這些地方都使用 `any`，代表它可能仍然能提供 props autocomplete，但還沒有進入 data-flow-level typing。這類元件通常具有高泛型改良價值，適合後續拆成獨立筆記分析。

---

## 7. 閱讀路線或學習路線

### 7.1 初次閱讀路線

第一次閱讀某個元件型別時，建議不要一開始就鑽進所有實作細節，而是先建立地圖。

1. 先找 `src/components/<name>/**`，確認元件的 runtime source 在哪裡。
2. 再找 `types/<name>.d.ts`，確認 TypeScript public contract 在哪裡。
3. 接著檢查 `src/components/index.js` 與 `types/viewuiplus.components.d.ts`，確認 runtime export 與 type export 是否對齊。
4. 最後快速掃描 props、emits、slots、instance methods，先標記明顯缺口，不急著修正。

這條路線的目的是先知道「這個元件型別大概完整到什麼程度」。

### 7.2 深入閱讀路線

當你要深入分析一個高頻元件，例如 `Input`、`Select`、`Table`、`Form`，可以按以下順序。

1. 先讀 props，確認 public prop 名稱、literal union、default、validator、mixin。
2. 再讀 emits，搜尋所有 `$emit`，記錄 event name 與 payload。
3. 接著讀 `v-model`，確認 model prop、update event、listener type 是否一致。
4. 再讀 slots，確認普通 slot 與 scoped slot 是否被型別化。
5. 接著讀 instance methods，判斷哪些是 public ref API。
6. 如果是 service-style API，另外讀 service runtime 與 `ComponentCustomProperties`。
7. 最後判斷泛型價值，標記資料流是否能被 `TRecord`、`TModel`、`TValue`、`TNode` 串起來。

這條路線適合用來寫完整原始碼閱讀筆記。

### 7.3 可以暫時跳過的部分

初期閱讀時，可以暫時跳過以下內容：

| 可以先跳過的內容 | 原因 |
| --- | --- |
| 過細的 DOM 操作細節 | 和 type contract 未必直接相關 |
| 純樣式 class 計算 | 通常屬於樣式系統筆記 |
| 非 public 的內部 method | 不一定應該暴露到 instance type |
| 邊界案例很多的泛型設計 | 可以先標記，後續獨立分析 |
| 未讀 runtime 就直接重寫 `.d.ts` | 容易產生錯誤型別 |

先掌握 public contract，再處理內部細節，會比較符合原始碼閱讀的節奏。

---

## 8. 常見誤區

| 誤區 | 為什麼容易誤解 | 正確理解 |
| --- | --- | --- |
| 只看 `types/<component>.d.ts` 就判斷型別完整度 | `.d.ts` 看起來像完整契約，但可能和 runtime 不同步 | 必須對照 runtime source、export registry、plugin 與 globalProperties |
| 看到 `emits` 就以為事件型別完整 | `emits` 可能只列事件名，沒有 payload 型別 | 要搜尋 `$emit`，確認 payload 是否在 `.d.ts` 中被描述 |
| 看到 `'v-slots'` 就以為 scoped slot 完整型別化 | `() => any` 只能提示 slot 名稱 | scoped slot 需要描述 `row`、`node`、`option` 等 props |
| 把所有 runtime methods 都當成 public instance API | 元件內部也會有很多 `handleXxx` 方法 | 只有穩定、可被外部 ref 呼叫、具文件化意圖的方法才適合列入 instance type |
| 看到 `$Message: any` 就以為 service API 已完整 | `any` 只代表 property 被承認存在 | 要有 method-level interface 才能檢查 `success`、`config`、`confirm` 等方法 |
| 認為所有元件都應該泛型化 | 泛型會提高複雜度 | 只有資料流跨 props、events、slots、callbacks 的元件才有高泛型價值 |
| 把 `any` 一律視為錯誤 | 有些 `any` 是相容性或維護成本取捨 | 應標記位置與風險，再依使用頻率與資料流重要性排序 |
| 忽略 mixins | props 或 methods 可能來自共用邏輯 | 讀 props 時要檢查 mixins，避免漏掉 shared props |

---

## 9. 本章總結

閱讀 View UI Plus 的單一元件型別，不能停留在「打開 `.d.ts` 看 props」這個層次。`.d.ts` 是 TypeScript 使用者看到的 public contract，但 runtime source 才是元件真正執行的來源。真正可靠的閱讀方式，是把 runtime、type declaration、export registry、plugin install 與 global properties 放在一起對照。

這套 checklist 的核心價值，是幫你把型別閱讀從零散觀察變成可重複流程。你先確認元件型態，再找 runtime source 和 type declaration，接著對照 props、emits、v-model、slots、instance methods、service API，最後標記弱型別與泛型價值。這樣讀完一個元件後，你得到的不是一堆分散筆記，而是一份可判斷、可比較、可延伸的型別契約分析。

在 View UI Plus 這種 JS runtime 搭配 `.d.ts` 的元件庫中，型別系統常常不是完整資料模型，而是漸進式 declaration layer。有些地方已經做到 literal union，有些地方只做到 `any`，有些地方能提示 slot 名稱但無法描述 scoped slot props，有些 service API 只在 `ComponentCustomProperties` 中被宣告為 property。閱讀時要避免用「好或壞」二分，而要判斷它目前精準到哪一層。

最後，泛型改良不是閱讀型別的第一步，而是閱讀後的判斷結果。當你發現同一份使用者資料會流經 props、callbacks、events、slots 與 instance API 時，才代表這個元件可能值得設計泛型。`Table`、`Form`、`Select`、`Tree` 這類元件通常比 `Button`、`Icon`、`Divider` 更有泛型化價值，因為它們承載的是資料流，而不只是 UI 狀態。

---

## 10. 自我檢查問題

1. 為什麼閱讀 View UI Plus 的型別時，不能只看 `types/<component>.d.ts`？
2. runtime source、type declaration、runtime registry、type registry 各自解決什麼問題？
3. 讀 props 時，為什麼要檢查 runtime validator？它和 literal union 有什麼關係？
4. 讀 props 時，為什麼要注意 mixins？如果忽略 mixins，可能漏掉什麼？
5. 讀 emits 時，為什麼要搜尋 `$emit`，而不能只看 `emits` 陣列？
6. `on-change -> onOnChange` 背後代表哪種相容性取捨？
7. `v-slots` 中的 `header?: () => any` 能不能代表 scoped slot props 已完整型別化？為什麼？
8. 如何判斷 runtime method 是 public instance API，還是元件內部方法？
9. 為什麼 `Message`、`Modal`、`Notice` 這類 service-style API 要另外檢查 `src/components/<name>/index.js`？
10. 哪些條件代表一個元件具有高泛型改良價值？

---

## 11. 後續延伸方向

這篇筆記建立的是「閱讀單一元件型別」的方法。後續可以延伸成以下主題：

1. **`Button` 型別閱讀實戰**：用簡單元件練習 props、literal union、event listener 與 registry 對照。
2. **`Input` 型別閱讀實戰**：聚焦 `v-model`、`update:modelValue`、instance methods 與輸入事件 payload。
3. **`Table` 型別系統分析**：分析 `data`、`columns`、`render`、selection events、scoped slots 與 `TableColumn<TRecord>` 的設計可能性。
4. **`Form` / `FormItem` 泛型設計**：研究 `model`、`rules`、`prop` 與 `FieldPath<TModel>` 的關係。
5. **Service API 型別改良**：為 `$Message`、`$Modal`、`$Notice` 補 service interface，避免 `ComponentCustomProperties` 只停在 `any`。
6. **View UI Plus event payload 精準化策略**：整理常見 `onOnXxx` listener，判斷哪些事件值得優先補 payload 型別。
7. **Slots 與 scoped slot 型別設計**：針對 `Table`、`Tree`、`Select` 這類元件，補強 slot props 型別。
8. **Runtime/type gap 檢查報告模板**：把本章最終判斷表整理成固定格式，用於逐一審查 View UI Plus 元件。
