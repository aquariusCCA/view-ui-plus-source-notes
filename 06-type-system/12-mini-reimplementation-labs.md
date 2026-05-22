# Mini Reimplementation Labs：用小型仿作練習 View UI Plus 型別設計

## 0. 原始筆記問題分析

這份原始筆記已經具備很好的實戰方向：它不是只整理 View UI Plus 的 `.d.ts` 檔案，而是把前面讀到的型別設計拆成多個小型 lab，讓讀者可以透過仿作練習，把「看得懂型別」轉成「能設計型別」。

不過，若要放進 `06-type-system/` 作為長期維護的教材型筆記，原始版本還有幾個可以補強的地方。

第一，原始內容偏向練習清單。它列出了 `MiniButton`、`MiniInput`、`MiniPlugin`、`MiniMessage`、`MiniTable`、`MiniForm` 等練習，但每個 lab 背後要訓練的型別設計能力還可以再說明得更清楚。例如 `MiniButton` 不只是 props union 練習，也是在練習「runtime prop 命名」與「public declaration 命名」之間的對齊問題。

第二，原始筆記已經有 runtime API、type 練習與檢查點，但缺少一條完整的學習流程。讀者如果第一次看，可能知道要寫哪些型別，卻不一定知道為什麼要先寫 runtime API 形狀，再寫 TypeScript interface，最後再檢查使用者體驗。

第三，原始筆記對「型別設計的取捨」說明較少。例如 `MiniTableColumn<TRecord = any>` 為什麼要保留 default generic？`MiniForm` 為什麼先只支援一層 `keyof TModel`，不直接處理巢狀 path？這些都涉及元件庫型別設計中很重要的相容性與維護成本。

第四，原始筆記中的程式碼很適合作為練習題，但若要變成教材型筆記，應該補上每個 lab 的「訓練目標」、「設計理由」、「驗證方式」與「常見誤區」。這樣未來複習時，不只知道程式碼怎麼寫，也能知道每種型別設計對應到 View UI Plus 的哪一類 public contract。

因此，本章會保留原始筆記的核心 lab，但補強成一套可操作的型別設計練習流程。

---

## 1. 本章定位

本章是 `06-type-system/` 目錄中的實作練習章節，主題是「用小型仿作練習 View UI Plus 的 TypeScript 型別設計」。

前面的型別系統筆記偏向閱讀與分析，例如：

- View UI Plus 的 `types/` 入口如何組成。
- props、emits、slots、instance、global API 如何被宣告。
- `.d.ts` 與 runtime source 分離後會產生哪些同步成本。
- 哪些地方使用 `any`、`Function`、`object`，哪些地方適合逐步精準化。
- 資料型元件為什麼可以用泛型改善型別保護。

而本章的重點是把這些觀察轉成練習。換句話說，本章不是要你完整重寫 View UI Plus，而是用縮小版 API 練習幾種最重要的型別設計能力：

1. component props declaration。
2. emits listener props。
3. `v-model` 與 `update:modelValue` 型別。
4. Vue plugin 的 module augmentation。
5. imperative service API。
6. data-driven generic types。
7. runtime 與 `.d.ts` 的同步檢查。

讀完本章後，你應該能夠做到三件事。

第一，看到 View UI Plus 某個元件的 `.d.ts` 時，可以判斷它是在描述 props、event listener、global service、instance API，還是資料型泛型契約。

第二，自己設計一個小型 component library 時，可以知道哪些 public API 應該被型別化，而不是只讓 TypeScript 勉強不報錯。

第三，修改或新增元件時，可以建立 runtime / type alignment 的檢查習慣，避免 runtime 已經支援某個功能，但 declaration file 忘記更新。

本章不處理完整的 Vue 元件實作、不處理 View UI Plus 每個元件的真實原始碼細節，也不追求設計出完美泛型系統。這些內容可以留到後續獨立筆記再深入。

---

## 2. 學習前先建立的基本觀念

### 2.1 `.d.ts` 是 public contract，不只是補 autocomplete

在 View UI Plus 這種以 JS runtime 搭配 declaration files 的元件庫中，`.d.ts` 的作用不是單純讓 IDE 能提示，而是在描述「使用者可以怎麼安全地使用這個元件」。

例如：

```ts
export declare const MiniButton: DefineComponent<{
  type?: 'default' | 'primary';
  disabled?: boolean;
}>
```

這段型別真正表達的是：

```txt
MiniButton 對外公開一個 type prop；
這個 prop 只能接受 default 或 primary；
同時也公開 disabled prop；
這個 prop 應該是 boolean。
```

所以閱讀 `.d.ts` 時，不應只問「有沒有型別」，而要問：

```txt
這份型別有沒有準確描述 public API？
它精準到 props-level、event-level、method-level，還是 data-flow-level？
```

這也是本章每個 lab 都會反覆練習的核心。

---

### 2.2 runtime API 形狀要先確定，型別才有依據

型別設計不能脫離 runtime。你要先知道元件實際提供什麼行為，才能決定 declaration 應該怎麼寫。

例如 runtime 如果實際支援：

```txt
prop: modelValue
emit: update:modelValue(value)
emit: on-change(event)
```

那 `.d.ts` 就至少要考慮：

```ts
'model-value'?: string | number;
'onUpdate:modelValue'?: (value: string | number) => void;
onOnChange?: (event: Event) => void;
```

如果只看 `.d.ts`，你可能不知道它是否漏掉某個 emit；如果只看 runtime，你也無法確認 TypeScript 使用者是否有得到正確提示。因此本章 lab 都採用這個順序：

```txt
先定義 runtime API 形狀
再撰寫 TypeScript declaration
最後檢查使用者體驗
```

這個順序非常重要，因為它會讓你養成「型別必須回到 runtime 驗證」的習慣。

---

### 2.3 event listener prop 命名需要理解 Vue 與 View UI Plus 的慣例

Vue 的事件在型別中通常會被轉成 listener prop。

一般事件：

```txt
click
```

對應到：

```ts
onClick?: (event: MouseEvent) => void;
```

但 View UI Plus 這類由 iView / View UI 歷史延伸而來的元件庫，常見事件名稱可能是：

```txt
on-change
on-clear
on-visible-change
```

這類事件在 listener prop 中常會形成比較不直覺的命名：

```ts
onOnChange?: (event: Event) => void;
onOnClear?: () => void;
onOnVisibleChange?: (visible: boolean) => void;
```

這不是單純命名醜，而是相容性取捨。元件庫若要保留既有使用者的 `@on-change` 寫法，型別層就必須承認這個事件名稱。

---

### 2.4 global API 需要 module augmentation

Vue plugin 常會把物件掛到：

```ts
app.config.globalProperties
```

例如：

```ts
app.config.globalProperties.$MiniMessage = MiniMessage;
```

如果要讓 Options API 的 `this.$MiniMessage` 有型別，就需要補：

```ts
declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $MiniMessage: MiniMessageApi;
  }
}
```

這種寫法稱為 module augmentation。它不是建立一個新型別，而是在擴充 Vue runtime core 裡既有的 `ComponentCustomProperties` 介面。

這也是閱讀 View UI Plus 的 global service 型別時一定要看的重點。

---

### 2.5 泛型的價值是建立資料流關聯

泛型不是為了讓型別看起來高級，而是為了把使用者傳入的資料與 callback、slot、column、rules 等 API 串起來。

以 Table 為例，如果資料列是：

```ts
interface User {
  id: number;
  name: string;
}
```

那理想上 `columns` 的 `key` 應該只能使用 `id` 或 `name`，`render()` 裡的 `row.name` 也應該能被推導成 `string`。

這就是：

```ts
MiniTableColumn<TRecord>
```

的價值。

如果沒有泛型，Table 的型別只能寫成：

```ts
data?: any[];
columns?: any[];
```

這樣雖然彈性高，但 TypeScript 幾乎無法保護資料流正確性。

---

## 3. 整體概覽

本章的 lab 可以分成三個層次。

第一層是 component-level 型別，也就是 props、emits、`v-model` 這些元件使用者最常接觸的 API。這一層對應 `MiniButton` 與 `MiniInput`。

第二層是 library-level 型別，也就是 plugin、global properties、service API。這一層對應 `MiniPlugin` 與 `MiniMessage`。

第三層是 data-flow-level 型別，也就是透過泛型把使用者資料、欄位設定、驗證規則、callback payload 串起來。這一層對應 `MiniTable` 與 `MiniForm`。

最後的 `Runtime / Type Alignment Checklist` 則是把所有 lab 收斂成一次修改元件時應該同步檢查的清單。

| Lab | 主題 | 主要訓練能力 | 對應 View UI Plus 型別議題 |
| --- | --- | --- | --- |
| Lab 1 | `MiniButton Props` | props literal union、kebab-case public prop、event listener | Button 類元件的 props contract |
| Lab 2 | `MiniInput v-model 與 Emits` | `modelValue`、`update:modelValue`、legacy event listener | Input 類元件的雙向綁定與事件型別 |
| Lab 3 | `MiniPlugin Global Properties` | plugin install options、globalProperties、module augmentation | `$VIEWUI`、`$Message` 類全域屬性 |
| Lab 4 | `MiniMessage Service API` | imperative API、options overload、close function | Message / Modal / Notice 類 service API |
| Lab 5 | `MiniTable 泛型` | row data、column config、render payload 關聯 | Table 類資料型元件泛型化 |
| Lab 6 | `MiniForm 泛型` | model、rules、prop、validator value 關聯 | Form 類表單模型型別化 |
| Lab 7 | Runtime / Type Alignment | runtime export、type registry、props / emits / global sync | JS runtime 與 `.d.ts` 分離下的同步成本 |

這些 lab 的目的不是把型別寫到最完整，而是幫你掌握一個元件庫型別設計的思考順序：

```txt
這個 API 是元件 props？
是事件？
是 v-model？
是 ref instance method？
是 plugin global property？
是 service method？
還是使用者資料驅動的泛型關聯？
```

只要能先分辨 API 類型，就能選擇正確的型別設計方式。

---

## 4. 核心內容逐步講解

### 4.1 Lab 1：MiniButton Props —— 練習 props contract 與 literal union

`MiniButton` 是最適合入門的 lab，因為 Button 類元件通常不需要複雜資料流，也不太需要泛型。它主要用來練習 props 型別與事件 listener 的基本宣告。

這個 lab 的 runtime API 可以先簡化成：

```ts
type MiniButtonType = 'default' | 'primary' | 'success' | 'warning' | 'error';
type MiniButtonSize = 'small' | 'default' | 'large';
```

這代表 runtime 可能有兩組受限值：

1. `type`：控制按鈕語意或樣式。
2. `size`：控制按鈕尺寸。

在 declaration 中，可以這樣描述 public API：

```ts
import type { DefineComponent } from 'vue';

type MiniButtonType = 'default' | 'primary' | 'success' | 'warning' | 'error';
type MiniButtonSize = 'small' | 'default' | 'large';

export declare const MiniButton: DefineComponent<{
  type?: MiniButtonType;
  size?: MiniButtonSize;
  disabled?: boolean;
  loading?: boolean;
  'html-type'?: 'button' | 'submit' | 'reset';
  onClick?: (event: MouseEvent) => void;
}>
```

這段型別有幾個重點。

第一，`type` 與 `size` 使用 literal union，而不是單純寫成 `string`。這樣可以讓 TypeScript 幫你擋掉錯誤值，例如：

```ts
// 應該報錯：danger 不在 MiniButtonType 裡
const wrongType: MiniButtonType = 'danger';
```

第二，`'html-type'` 使用 kebab-case。這是因為使用者在 template 中常會寫：

```vue
<MiniButton html-type="submit" />
```

如果 runtime 裡實際 prop 是 `htmlType`，那型別設計時就要特別注意 public 使用方式與 runtime 命名之間的對照。對元件庫來說，型別不是只描述內部變數名稱，也要照顧使用者在 template 中看到的 API。

第三，`click` 事件對應 `onClick`，不是 `onOnClick`。因為事件名稱是 `click`，而不是 `on-click`。這一點會和下一個 `MiniInput` lab 形成對照。

這個 lab 的檢查點如下。

| 檢查問題 | 為什麼要檢查 | 正確方向 |
| --- | --- | --- |
| runtime 若是 `htmlType`，public type 是否用 `'html-type'`？ | 避免 runtime 命名與 template API 脫節 | 對外型別應照顧 template 使用方式 |
| `click` event 是否是 `onClick`？ | 避免把普通事件誤寫成 legacy `on-*` 事件 | `click` 對應 `onClick` |
| validator 可選值是否和 union 對齊？ | 避免 runtime 可用但 TS 擋掉，或 runtime 不支援但 TS 放行 | runtime validator 與 literal union 應一致 |

你可以把 `MiniButton` 當作 props-level contract 的練習。它的重點不是複雜，而是讓你養成「runtime 可選值要同步到 TypeScript union」的習慣。

---

### 4.2 Lab 2：MiniInput v-model 與 Emits —— 練習事件與雙向綁定型別

`MiniInput` 比 `MiniButton` 複雜，因為 Input 類元件通常涉及使用者輸入、`v-model`、change 事件、clear 事件等行為。

先定義 runtime 行為：

```txt
prop: modelValue: string | number
emit: update:modelValue(value)
emit: on-change(event)
emit: on-clear()
```

這裡至少有三種型別要處理。

第一是 model prop：

```ts
'model-value'?: string | number;
```

第二是 `update:modelValue`：

```ts
'onUpdate:modelValue'?: (value: string | number) => void;
```

第三是 View UI Plus 風格的 legacy event：

```ts
onOnChange?: (event: Event) => void;
onOnClear?: () => void;
```

完整 declaration 練習如下：

```ts
import type { DefineComponent } from 'vue';

export declare const MiniInput: DefineComponent<{
  'model-value'?: string | number;
  clearable?: boolean;
  onOnChange?: (event: Event) => void;
  onOnClear?: () => void;
  'onUpdate:modelValue'?: (value: string | number) => void;
}>
```

這個 lab 的核心是讓你理解：`v-model` 不是只有一個 prop，而是一組 prop + event 的契約。

在 Vue 3 裡，預設 `v-model` 通常會對應：

```txt
modelValue
update:modelValue
```

若 declaration 只寫了 `'model-value'`，但沒有寫 `'onUpdate:modelValue'`，那使用者雖然可能可以傳入值，但型別層無法完整描述雙向更新事件。

同時，View UI Plus 的事件命名又有自己的歷史習慣。例如 `on-change` 不是現代 Vue 常見的 `change`，因此 listener prop 會變成：

```ts
onOnChange
```

這是閱讀 View UI Plus 型別時最容易混淆的地方之一。

| runtime event | listener prop | 說明 |
| --- | --- | --- |
| `click` | `onClick` | 一般事件名稱 |
| `change` | `onChange` | 一般事件名稱 |
| `on-change` | `onOnChange` | View UI Plus / iView 風格相容事件 |
| `on-clear` | `onOnClear` | 同上，無 payload 可寫 `() => void` |
| `update:modelValue` | `'onUpdate:modelValue'` | Vue 3 `v-model` update listener |

這個 lab 要特別驗證三件事：

1. `on-change` 是否正確對應到 `onOnChange`。
2. `on-clear` 若沒有 payload，是否寫成 `() => void`，而不是 `(event: any) => any`。
3. `update:modelValue` 是否有補 `'onUpdate:modelValue'`，而且 value 型別和 model prop 一致。

如果你未來讀 View UI Plus 的 Input、Select、Switch、Checkbox、Radio 等元件型別，這個 lab 的思路都可以套用。

---

### 4.3 Lab 3：MiniPlugin Global Properties —— 練習 plugin 與 module augmentation

`MiniPlugin` 這個 lab 要處理的不是單一元件，而是元件庫安裝後掛在 Vue app 上的全域能力。

runtime 可能會做這件事：

```ts
app.config.globalProperties.$MiniMessage = MiniMessage;
app.config.globalProperties.$MINI = options;
```

這代表使用者在 Options API 中可能會使用：

```ts
this.$MiniMessage.success('Saved');
this.$MINI.size;
```

如果沒有補型別，TypeScript 不知道 `this` 上有這些屬性。這時就需要 module augmentation：

```ts
import type { App } from 'vue';

interface MiniGlobalOptions {
  size?: 'small' | 'default' | 'large';
  transfer?: boolean;
}

interface MiniInstallOptions extends MiniGlobalOptions {
  locale?: unknown;
}

interface MiniMessageApi {
  success(content: string): () => void;
  error(content: string): () => void;
  destroy(): void;
}

declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $MINI: MiniGlobalOptions;
    $MiniMessage: MiniMessageApi;
  }
}

export declare const install: (app: App, options?: MiniInstallOptions) => void;
```

這段型別要注意兩個邊界。

第一，`MiniInstallOptions` 和 `MiniGlobalOptions` 不一定完全相同。`install()` 接收的是安裝時使用者可以傳入的設定；`$MINI` 則是 runtime 最後掛到全域屬性上的設定結果。簡化練習中可以讓兩者接近，但在真實元件庫中，install options 可能還包含 locale、i18n、zIndex、component prefix 等設定。

第二，`$MiniMessage` 不應該直接寫成 `any`。如果寫成：

```ts
$MiniMessage: any;
```

雖然 TypeScript 不會報錯，但使用者打錯 method 或傳錯參數也不會被發現。更好的做法是抽出：

```ts
interface MiniMessageApi {
  success(content: string): () => void;
  error(content: string): () => void;
  destroy(): void;
}
```

這樣 `$MiniMessage.success()`、`$MiniMessage.error()`、`$MiniMessage.destroy()` 都會有 method-level contract。

這個 lab 的檢查點如下。

| 檢查問題 | 說明 |
| --- | --- |
| `$MiniMessage` 是否避免寫成 `any`？ | service API 應該至少描述 methods |
| install options 和 global options 是否分清楚？ | 安裝參數與 runtime 全域狀態可能不是同一層概念 |
| runtime 掛了什麼，module augmentation 是否同步？ | `globalProperties` 與 `ComponentCustomProperties` 要對齊 |

在 View UI Plus 中，`$Message`、`$Modal`、`$Notice`、`$Loading` 等全域 API 都可以用這個 lab 的角度來讀。

---

### 4.4 Lab 4：MiniMessage Service API —— 練習命令式 API 型別設計

`MiniMessage` 代表的是 service-style API，也就是使用者不是透過 template 使用元件，而是透過方法呼叫開啟某個 UI 行為。

runtime API 可以簡化為：

```txt
MiniMessage.success(options)
MiniMessage.error(options)
MiniMessage.config(options)
MiniMessage.destroy()
```

這類 API 不適合只用 `DefineComponent` 描述，因為它的 public contract 是一組方法，而不是 props。

可以先設計 options 與 config：

```ts
interface MiniMessageOptions {
  content?: string;
  duration?: number;
  closable?: boolean;
  onClose?: () => void;
}

interface MiniMessageConfig {
  top?: number;
  duration?: number;
}

type MiniMessageClose = () => void;

interface MiniMessageApi {
  success(options: string | MiniMessageOptions): MiniMessageClose;
  error(options: string | MiniMessageOptions): MiniMessageClose;
  config(options: MiniMessageConfig): void;
  destroy(): void;
}
```

這裡有三個重要設計點。

第一，`success()` 與 `error()` 可以支援 string shortcut。也就是使用者可能寫：

```ts
MiniMessage.success('Saved successfully');
```

也可能寫：

```ts
MiniMessage.success({
  content: 'Saved successfully',
  duration: 3,
  closable: true,
});
```

所以型別要寫成：

```ts
string | MiniMessageOptions
```

第二，`success()` 與 `error()` 的回傳值可能是一個 close function。若 runtime 確實回傳關閉函式，型別應該寫出來：

```ts
type MiniMessageClose = () => void;
```

這樣使用者才知道可以：

```ts
const close = MiniMessage.success('Saved');
close();
```

第三，`config()` 的 options 不應和 `success()` 的 options 混在一起。`success()` 描述的是單次訊息；`config()` 描述的是全域設定。兩者雖然都可能有 `duration`，但語意不同，應該分開建模。

| API | 型別重點 | 常見錯誤 |
| --- | --- | --- |
| `success()` | 支援 string shortcut 與 options object | 只寫 object，漏掉 string |
| `error()` | 和 `success()` 類似，但語意不同 | 直接寫成 `Function` |
| `config()` | 全域設定型別 | 和 message options 混用 |
| `destroy()` | 無參數、無回傳 | 寫成 `any` 導致契約不明 |
| close function | 描述可手動關閉 | 忘記回傳型別 |

這個 lab 對應到 View UI Plus 的 Message、Notice、Modal、LoadingBar 等命令式 API。閱讀這類型別時，應該先找 runtime object 有哪些 methods，再檢查 `.d.ts` 是否有 service interface，而不是只看 component declaration。

---

### 4.5 Lab 5：MiniTable 泛型 —— 練習 row data 與 column config 關聯

`MiniTable` 是本章第一個真正進入 data-flow-level 的練習。它的重點不是「Table 有哪些 props」，而是「使用者傳進來的資料列型別，是否能一路影響 columns、render callback、row click event」。

先設計 column 型別：

```ts
interface MiniTableColumn<TRecord = any> {
  title?: string;
  key?: keyof TRecord & string;
  width?: number;
  align?: 'left' | 'right' | 'center';
  render?: (params: {
    row: TRecord;
    column: MiniTableColumn<TRecord>;
    index: number;
  }) => unknown;
}
```

再設計 props 型別：

```ts
interface MiniTableProps<TRecord = any> {
  data?: TRecord[];
  columns?: MiniTableColumn<TRecord>[];
  onOnRowClick?: (row: TRecord, index: number) => void;
}
```

這段型別有幾個核心價值。

第一，`key?: keyof TRecord & string` 讓 column key 只能使用資料列存在的欄位。假設：

```ts
interface User {
  id: number;
  name: string;
}
```

那：

```ts
const columns: MiniTableColumn<User>[] = [
  { title: 'Name', key: 'name' },
];
```

是正確的，但：

```ts
const columns: MiniTableColumn<User>[] = [
  // 應該報錯：User 沒有 email
  { title: 'Email', key: 'email' },
];
```

應該要被 TypeScript 擋下來。

第二，`render()` 裡的 `row` 會被推導成 `TRecord`。因此：

```ts
const columns: MiniTableColumn<User>[] = [
  {
    title: 'Name',
    key: 'name',
    render: ({ row }) => row.name,
  },
];
```

`row.name` 應該會被推導成 `string`。

第三，`TRecord = any` 是一個相容性設計。若使用者沒有指定泛型，型別仍然可以退回寬鬆模式：

```ts
const columns: MiniTableColumn[] = [
  { title: 'Anything', key: 'whatever' },
];
```

對元件庫來說，這種 default generic 可以降低破壞性。它讓新使用者可以逐步採用泛型，而不是一升級就被大量型別錯誤擋住。

這個 lab 的檢查點如下。

| 檢查問題 | 預期結果 |
| --- | --- |
| `key: 'email'` 是否會在 `User` 沒有 `email` 時報錯？ | 應該報錯 |
| `render.params.row.name` 是否能被推導成 `string`？ | 應該能推導 |
| `onOnRowClick` 的 `row` 是否和 `data` 使用同一個 `TRecord`？ | 應該一致 |
| default generic 是否保留 `any`？ | 可保留以兼容舊用法 |

這個 lab 對應到 View UI Plus 中最值得改善的類型之一：資料型元件。Table、Tree、Transfer、Upload、Select 都有類似的泛型設計空間。

---

### 4.6 Lab 6：MiniForm 泛型 —— 練習 model、rules、prop 的型別關聯

`MiniForm` 的型別設計重點是把表單資料模型 `model`、驗證規則 `rules`、表單項目 `prop` 連在一起。

先設計欄位路徑。簡化版本可以先只支援第一層 key：

```ts
type FieldPath<TModel> = keyof TModel & string;
```

接著設計單一規則：

```ts
interface MiniFormRule<TValue = unknown> {
  required?: boolean;
  message?: string;
  validator?: (value: TValue) => boolean | Promise<boolean>;
}
```

再用 mapped type 根據 model 建立 rules：

```ts
type MiniFormRules<TModel> = Partial<{
  [K in keyof TModel & string]:
    | MiniFormRule<TModel[K]>
    | Array<MiniFormRule<TModel[K]>>;
}>;
```

最後設計 props：

```ts
interface MiniFormProps<TModel extends Record<string, any> = Record<string, any>> {
  model?: TModel;
  rules?: MiniFormRules<TModel>;
  onOnValidate?: (prop: FieldPath<TModel>, valid: boolean) => void;
}

interface MiniFormItemProps<TModel extends Record<string, any> = Record<string, any>> {
  prop?: FieldPath<TModel>;
}
```

這段型別的核心價值是讓欄位名稱與欄位值型別可以被 TypeScript 追蹤。

例如：

```ts
interface LoginForm {
  username: string;
  age: number;
}

const rules: MiniFormRules<LoginForm> = {
  username: {
    required: true,
    validator: value => value.length > 0,
  },
  age: {
    validator: value => value > 18,
  },
};
```

在這個例子中：

- `username` 的 validator value 應該是 `string`。
- `age` 的 validator value 應該是 `number`。
- `rules.email` 如果 `LoginForm` 沒有 `email`，應該報錯。

不過，這個 lab 也要明確標註限制：目前的 `FieldPath<TModel>` 只支援第一層 key，不支援：

```txt
user.profile.name
addresses[0].city
```

如果要支援巢狀 path，需要更複雜的型別遞迴設計。這可以留到後續延伸，不應在第一版練習中過度展開。

| 檢查問題 | 預期結果 |
| --- | --- |
| `prop` 是否限制為 model key？ | 應限制為 `keyof TModel & string` |
| rule validator 的 `value` 是否跟欄位型別對齊？ | 應依欄位推導 |
| 不存在的 rules key 是否報錯？ | 應報錯 |
| 巢狀 path 是否支援？ | 暫時不支援，需明確標記 |

這個 lab 對應到 View UI Plus 的 Form / FormItem 類元件。它的型別價值不在於 props 多寡，而在於能否把表單資料、欄位名稱與驗證規則串起來。

---

### 4.7 Lab 7：Runtime / Type Alignment Checklist —— 練習修改後同步檢查

最後一個 lab 不是設計某個元件型別，而是建立元件庫維護時的同步檢查流程。

假設你新增一個 `MiniDrawer`，可能會涉及：

```txt
src/components/mini-drawer/mini-drawer.vue
src/components/index.js
types/mini-drawer.d.ts
types/viewuiplus.components.d.ts
types/index.d.ts
```

這裡要檢查的不只是型別是否能編譯，而是 runtime 與 type registry 是否一致。

| 檢查項目 | 目的 |
| --- | --- |
| runtime 是否 export？ | 確保使用者真的能 import 或 install |
| type registry 是否 export？ | 確保 named import 有型別 |
| props 是否 camelCase / kebab-case 對齊？ | 確保 template public API 正確 |
| emits 是否有 listener props？ | 確保事件有型別提示 |
| `v-model` 是否有 model prop 和 update listener？ | 確保雙向綁定契約完整 |
| 若 install 掛 global property，是否補 module augmentation？ | 確保 `this.$Xxx` 有型別 |
| service API 是否有 interface？ | 避免命令式 API 落入 `any` |
| 是否有值得抽出的 helper types？ | 提高重用性與可維護性 |

這個 lab 很重要，因為 View UI Plus v1.3.20 這類 JS runtime + `.d.ts` 的架構，本質上就存在同步成本。你不能期待 runtime 修改後型別自動更新，也不能期待 declaration 存在就代表 runtime 一定支援。

因此每次新增或修改 public API，都要問：

```txt
runtime 有沒有？
type declaration 有沒有？
registry 有沒有？
global augmentation 有沒有？
使用者在 template / TS / Options API 裡是否都能得到正確體驗？
```

---

## 5. 表格整理

### 5.1 Lab 與型別能力對照表

| 能力 | 對應 lab | 主要型別工具 | 閱讀 View UI Plus 時的觀察點 |
| --- | --- | --- | --- |
| props literal union | Lab 1 | string literal union | prop validator 是否和 union 一致 |
| kebab-case public prop | Lab 1、Lab 2 | quoted property key | runtime camelCase 與 template kebab-case 是否對齊 |
| event listener props | Lab 1、Lab 2 | `onXxx` / `onOnXxx` | event 命名是否來自 legacy `on-*` |
| `v-model` update listener | Lab 2 | `'onUpdate:modelValue'` | 是否同時有 model prop 與 update listener |
| module augmentation | Lab 3 | `declare module '@vue/runtime-core'` | `globalProperties` 是否同步到 `ComponentCustomProperties` |
| service interface | Lab 4 | interface、union、return type | `$Message` / `$Modal` 是否只有 `any` |
| data-driven generics | Lab 5、Lab 6 | generic、`keyof`、mapped type | row/model/option 是否能串起 callback payload |
| runtime/type sync | Lab 7 | checklist | source、type、registry 是否一致 |

這張表可以作為你日後閱讀 `types/<component>.d.ts` 的索引。當你看到某種型別寫法時，可以反問它屬於哪一類 contract：props、event、global、service，還是資料流泛型。

---

### 5.2 小型仿作的標準作業流程

| 步驟 | 要做什麼 | 目的 |
| --- | --- | --- |
| 1 | 寫出 runtime API 形狀 | 先確定元件實際支援什麼 |
| 2 | 標出 public API 類型 | 分辨 props、emits、service、global、generic data |
| 3 | 撰寫 TypeScript interface / declaration | 把 public contract 型別化 |
| 4 | 寫使用者測試案例 | 驗證 IDE 提示與錯誤阻擋是否符合預期 |
| 5 | 檢查弱型別位置 | 找出 `any`、`Function`、`object` 是否可以收斂 |
| 6 | 評估相容性 | 判斷是否需要 default generic 或寬鬆 overload |
| 7 | 回到 runtime 對齊 | 確認 declaration 沒有描述不存在的行為 |

這個流程的重點是不要一開始就陷入型別技巧。元件庫型別設計不是比誰寫的泛型複雜，而是要準確描述 public API，並讓使用者在合理成本下獲得足夠保護。

---

### 5.3 最終檢查模板

完成任一 lab 後，可以填下面這張表。

| 面向 | 檢查問題 | 狀態 |
| --- | --- | --- |
| runtime API | 實際支援的 props / emits / methods 是否列清楚？ | yes / no |
| declaration | `.d.ts` 是否有對應 public API？ | yes / no |
| props | literal union 是否和 runtime validator 對齊？ | good / gap |
| emits | listener prop 是否命名正確？ | good / gap |
| `v-model` | model prop 與 update listener 是否同時存在？ | good / gap |
| global API | `globalProperties` 是否同步 module augmentation？ | good / gap |
| service API | 是否有 method-level interface？ | good / gap |
| generics | 是否真的建立資料流關聯？ | high / medium / low |
| compatibility | 是否需要 default generic、`unknown` 或 overload？ | checked / unchecked |
| weak types | 是否標記 `any`、`Function`、`object`？ | list |

---

## 6. 範例或情境說明

### 6.1 情境：新增一個 `MiniSelect`

假設你要在自己的小型元件庫中新增 `MiniSelect`，不要直接開始寫 `.d.ts`。比較好的做法是先描述 runtime API。

```txt
prop: modelValue
prop: options
emit: update:modelValue(value)
emit: on-change(value, option)
slot: option
```

接著判斷它屬於哪一類型別問題。

`MiniSelect` 同時包含：

1. props 型別。
2. `v-model` update listener。
3. event payload。
4. option data 泛型。
5. scoped slot props。

因此它比 `MiniButton` 複雜，也比 `MiniInput` 更需要泛型。

可以先設計：

```ts
interface MiniSelectOption<TValue = string | number> {
  label: string;
  value: TValue;
  disabled?: boolean;
}

interface MiniSelectProps<TValue = string | number> {
  'model-value'?: TValue;
  options?: Array<MiniSelectOption<TValue>>;
  'onUpdate:modelValue'?: (value: TValue) => void;
  onOnChange?: (value: TValue, option: MiniSelectOption<TValue>) => void;
  'v-slots'?: {
    option?: (props: { option: MiniSelectOption<TValue> }) => unknown;
  };
}
```

這個例子說明一件事：你可以先從本章 lab 的基礎能力組合出更複雜的元件型別。

`MiniSelect` 的 `TValue` 類似 `MiniTable` 的 `TRecord`。它把 `modelValue`、`options.value`、`on-change` payload 串起來，讓使用者選項值的型別不會在資料流中遺失。

---

### 6.2 情境：新增一個 `MiniDrawer`

若新增的是 `MiniDrawer`，它可能更偏向 props + emits + instance method。

你可以先列出 runtime API：

```txt
prop: modelValue: boolean
prop: placement: left | right | top | bottom
prop: width: string | number
emit: update:modelValue(value)
emit: on-visible-change(visible)
method: close()
```

接著設計 declaration：

```ts
import type { DefineComponent } from 'vue';

export interface MiniDrawerInstance {
  close(): void;
}

export declare const MiniDrawer: DefineComponent<{
  'model-value'?: boolean;
  placement?: 'left' | 'right' | 'top' | 'bottom';
  width?: string | number;
  'onUpdate:modelValue'?: (value: boolean) => void;
  onOnVisibleChange?: (visible: boolean) => void;
}>;
```

這個情境能練習兩個觀念。

第一，`on-visible-change` 仍然會形成 `onOnVisibleChange`。

第二，如果 `close()` 是希望使用者透過 ref 呼叫的 public API，就應該考慮導出 `MiniDrawerInstance`。但如果某些方法只是內部 `handleClose()`、`doAnimation()`，就不應該誤判成 public instance method。

---

## 7. 閱讀路線或學習路線

### 7.1 初次練習路線

如果你是第一次系統性練習 View UI Plus 型別設計，建議照以下順序。

第一，先做 `MiniButton`。這個 lab 最單純，主要建立 props union、kebab-case prop、普通 event listener 的基本概念。

第二，接著做 `MiniInput`。這個 lab 會把你帶進 View UI Plus 很常見的事件命名問題，也會練習 `v-model` 的 prop + update listener 契約。

第三，再做 `MiniPlugin` 與 `MiniMessage`。這兩個 lab 讓你從 component declaration 走到 library-level API，理解為什麼 `$Message`、`$Modal` 類 API 不能只靠 `DefineComponent` 描述。

第四，再做 `MiniTable`。這是資料型元件泛型的代表，重點是理解 `TRecord` 如何串起 data、columns、render、event payload。

第五，最後做 `MiniForm`。Form 的型別會比 Table 更偏向 model shape 與 mapped type，非常適合練習 `keyof`、mapped type、validator value 推導。

第六，用 `Runtime / Type Alignment Checklist` 收尾。每次新增元件或修改 public API，都用這份 checklist 檢查一次。

---

### 7.2 對應 View UI Plus 原始碼的閱讀路線

完成 lab 後，可以回到 View UI Plus 原始碼中找相似案例。

1. 先讀 Button 類元件，觀察 props validator 與 `.d.ts` union 是否對齊。
2. 再讀 Input 類元件，搜尋 `$emit`，對照 `onOnChange`、`onOnClear`、`onUpdate:modelValue` 類 listener props。
3. 接著讀 Message / Modal / Notice，觀察 service object 與 globalProperties 如何掛載。
4. 再讀 Table，觀察 `data`、`columns`、`render`、row event 的型別是否仍偏寬鬆。
5. 最後讀 Form / FormItem，觀察 `model`、`rules`、`prop` 是否有泛型關聯，或仍以 `object` / `string` 為主。

這條路線可以避免一開始就陷入 Table / Form 的複雜細節。先從 Button、Input 建立基礎，再進入 service API 與泛型設計，會比較穩。

---

### 7.3 可以暫時跳過的部分

如果你的目標是先建立型別設計直覺，可以暫時跳過以下內容：

- 過度完整的巢狀 `FieldPath<T>` 型別遞迴。
- 完整支援所有 scoped slot props 的泛型設計。
- 完整重寫 View UI Plus 所有 service API overload。
- 直接把所有元件 declaration 全面泛型化。

這些不是不重要，而是不適合作為第一輪練習。第一輪重點應該是掌握 public API contract 與 runtime/type alignment。

---

## 8. 常見誤區

| 誤區 | 為什麼容易誤解 | 正確理解 |
| --- | --- | --- |
| 只要 `.d.ts` 能編譯就代表型別完整 | declaration 能編譯不代表和 runtime 對齊 | 要檢查 props、emits、registry、globalProperties 是否同步 |
| 把所有事件都寫成 `onXxx` | Vue 一般事件與 View UI Plus legacy `on-*` 事件命名不同 | `click` 是 `onClick`，`on-change` 才是 `onOnChange` |
| `v-model` 只需要宣告 `'model-value'` | 雙向綁定還需要 update listener | 應同時檢查 `'onUpdate:modelValue'` |
| service API 也用 `DefineComponent` 描述 | Message / Modal 類 API 是命令式方法，不是單純元件 props | 應設計 service interface |
| `$Message: any` 已經足夠 | `any` 只能表示 property 存在，不能保護 method 參數與回傳 | 應逐步補 method-level contract |
| 泛型越多越好 | 過度泛型會提高使用與維護成本 | 只有資料流需要被串起來時才值得泛型化 |
| `keyof TRecord` 一定適合所有情境 | 有些 Table key 可能支援巢狀路徑或自訂 key | 可先支援簡化版，再標註限制 |
| `FieldPath<TModel>` 很容易完整實作 | 巢狀 path、陣列 path、optional path 都會增加複雜度 | 第一版可先支援一層 key |
| default generic 用 `any` 就是壞設計 | 元件庫需要考慮相容性與遷移成本 | `T = any` 可作為漸進式泛型化策略 |
| slot 名稱有型別就代表 slot props 完整 | `'v-slots'` 可能只提示 slot name | scoped slot props 仍需另外設計 payload 型別 |

---

## 9. 本章總結

本章的核心不是要你重寫 View UI Plus，而是把 View UI Plus 型別系統中常見的 public contract 拆成幾種可以練習的小能力。

`MiniButton` 讓你練習 props union 與基本事件。`MiniInput` 讓你理解 `v-model`、`update:modelValue` 與 View UI Plus legacy event 命名。`MiniPlugin` 讓你掌握 plugin globalProperties 與 module augmentation。`MiniMessage` 讓你知道 service API 應該用 method interface 描述，而不是只靠 component declaration。`MiniTable` 和 `MiniForm` 則把練習推進到資料流泛型，讓 row data、column config、model、rules、validator payload 可以互相關聯。

這些 lab 背後共同的心智模型是：

```txt
型別設計不是把所有東西都寫成 TypeScript，
而是精準描述使用者能接觸到的 public API。
```

對 View UI Plus 這種 JS runtime + `.d.ts` 的架構來說，你還要特別注意 runtime 與 type declaration 的同步問題。新增 prop、emit、global property、service method、named export 時，都應該同步檢查 runtime source、type declaration、registry 與 module augmentation。

完成本章練習後，你再回去讀 View UI Plus 的 `types/` 目錄，就不會只是在看一堆型別檔，而是能辨識每段 declaration 正在描述哪一層 public contract，以及哪裡仍有精準化、泛型化或相容性取捨的空間。

---

## 10. 自我檢查問題

1. 為什麼本章 lab 要先寫 runtime API 形狀，再寫 TypeScript declaration？
2. `click` 和 `on-change` 的 listener prop 為什麼分別會是 `onClick` 與 `onOnChange`？
3. `v-model` 的完整型別契約為什麼不只包含 `'model-value'`？
4. 為什麼 `$MiniMessage` 不應該只在 `ComponentCustomProperties` 裡寫成 `any`？
5. `MiniMessage.success(options)` 為什麼要支援 `string | MiniMessageOptions`？
6. `MiniMessage.config()` 的 options 為什麼不應該和 `MiniMessage.success()` 的 options 混在一起？
7. `MiniTableColumn<TRecord>` 如何讓 column key、render row、row click event 互相關聯？
8. `MiniFormRules<TModel>` 如何讓 validator 的 value 型別與 model 欄位型別對齊？
9. 為什麼 `FieldPath<TModel>` 第一版可以只支援一層 key，而不急著支援巢狀 path？
10. 新增一個元件時，為什麼 runtime registry 和 type registry 都要同步檢查？

---

## 11. 後續延伸方向

本章完成後，可以繼續延伸成以下幾類筆記。

### 11.1 `MiniSelect<TValue>` 泛型設計

可以獨立練習 Select 類元件如何把 `modelValue`、`options.value`、`on-change` payload、slot props 串起來。這會比 `MiniInput` 更接近資料驅動型元件，也比 `MiniTable` 更容易入門。

### 11.2 `MiniTree<TNode>` 泛型設計

Tree 類元件可以練習 node data、children、checked keys、selected node、render callback、scoped slot props 的型別關聯。這類元件很適合討論泛型與遞迴資料結構。

### 11.3 scoped slot props 型別化

可以專門研究 `'v-slots'` 的 declaration 寫法，並比較只提示 slot name 與完整描述 slot props 的差異。這會幫助你閱讀 Table、Tree、Select 這類大量依賴 scoped slot 的元件。

### 11.4 service API 精準化策略

可以針對 Message、Notice、Modal、LoadingBar 設計完整 interface，包含 options、config、return close function、shortcut overload、global property augmentation。

### 11.5 `tsd` / `vue-tsc` 型別測試

可以建立一個型別測試專案，用 `tsd` 或 `vue-tsc` 驗證 declaration 是否符合預期。例如確認錯誤 key 會報錯、正確 payload 能推導、錯誤 service method 會被擋下。

### 11.6 View UI Plus runtime/type gap 實戰盤點

可以挑一個真實元件，例如 Button、Input、Message、Table 或 Form，使用本章 checklist 做完整盤點：

```txt
runtime 有什麼？
.d.ts 宣告了什麼？
registry 是否 export？
global augmentation 是否同步？
哪些地方是強契約？
哪些地方只是弱提示？
哪些地方值得泛型改良？
```

這會把本章的仿作練習真正連回 View UI Plus 原始碼閱讀。
