# Emits and v-model Types：事件、`update:modelValue` 與 Listener Props

## 1. 本章定位

本章是 `06-type-system/` 目錄中的事件型別專章，主題是 View UI Plus 的 `emits`、`v-model` 與 listener props 型別設計。

在 Vue 3 元件中，事件通常有兩個層次：

1. runtime 層次：元件實際透過 `emits` 宣告哪些事件，並透過 `$emit(...)` 丟出哪些 payload。
2. TypeScript 層次：使用者在 template、TSX 或 IDE 中看到哪些事件監聽器型別。

View UI Plus v1.3.20 的事件型別設計有一個很明顯的特徵：它的 `.d.ts` 檔案通常不是用 Vue 3 `DefineComponent` 的 emits generic 精準描述事件 payload，而是把事件監聽器表達成 component props，例如：

```ts
onOnChange?: (event?: any) => any;
onOnFocus?: (event?: any) => any;
```

這代表閱讀 View UI Plus 的事件型別時，不能只問「runtime 有沒有 emit」，也不能只問「`.d.ts` 有沒有 listener prop」。真正重要的是把三件事放在一起看：

```txt
runtime emits list
  + 實際 $emit(...) payload
  + types/*.d.ts listener props
```

讀完本章後，你應該能理解：

1. `on-change` 為什麼會在 `.d.ts` 中變成 `onOnChange`。
2. `modelValue`、`model-value`、`update:modelValue` 與 `onUpdate:modelValue` 各自代表什麼。
3. 為什麼 View UI Plus 的事件 payload 型別多數偏弱。
4. 如何判斷 runtime emits 與 type declaration 是否同步。
5. 後續閱讀其他元件事件型別時，應該照什麼順序追蹤。

本章不會完整列出所有 View UI Plus 元件的事件。這類內容可以留到後續針對 `Table`、`Form`、`Modal`、`Select` 等元件的專章整理。

---

## 2. 學習前先建立的基本觀念

### 2.1 Runtime emits 是執行時契約

在 Vue 3 元件中，`emits` 用來宣告元件會對外觸發哪些事件。以 Options API 寫法來看，常見形狀如下：

```js
export default {
  emits: ['update:modelValue', 'on-change', 'on-focus']
}
```

這段設定回答的是：

> 這個元件在執行時允許或預期會對外發出哪些事件？

不過，`emits: [...]` 只告訴你事件名稱，通常還不足以知道 payload 型別。要知道事件實際傳了什麼資料，還需要繼續搜尋元件內部的 `$emit(...)` 呼叫。

例如：

```js
this.$emit('update:modelValue', value);
this.$emit('on-change', event);
this.$emit('on-search', this.currentValue);
this.$emit('on-clear');
```

這些呼叫才會讓你看出每個事件的 payload 來源與大致形狀。

---

### 2.2 Type surface 是 TypeScript 使用者看到的契約

Type surface 指的是 TypeScript 編譯器與 IDE 能看到的型別描述。對 View UI Plus 來說，主要來源是 `types/*.d.ts`。

在目前觀察到的寫法中，View UI Plus 會把事件監聽器寫進 `DefineComponent<{ ... }>` 的 object 裡，例如：

```ts
export declare const Input: DefineComponent<{
  'model-value'?: string | number;
  onOnChange?: (event?: any) => any;
  onOnFocus?: (event?: any) => any;
}>
```

這裡要注意：這個 object 裡不只包含 props，也包含 listener props。也就是說，在 View UI Plus 的 declaration 中，`DefineComponent<{ ... }>` 裡面的欄位不一定都是一般 props，還可能是事件監聽器對應的型別。

---

### 2.3 `v-model` 是 prop 與 event 的組合

Vue 3 預設的 `v-model` 可以拆成兩個部分：

```txt
prop: modelValue
event: update:modelValue
```

使用者在 template 中寫：

```vue
<Input v-model="keyword" />
```

大致等價於：

```vue
<Input
  :model-value="keyword"
  @update:modelValue="keyword = $event"
/>
```

因此，閱讀 `v-model` 型別時不能只看 prop，也要看 update event。對 View UI Plus 來說，常見情況是 `.d.ts` 有描述 `'model-value'` prop，但未必有精準描述 `update:modelValue` listener 的 payload 型別。

---

### 2.4 `on-*` 是 View UI Plus 的歷史事件命名風格

View UI Plus 承襲 iView / View UI 系列的 API 風格，常見事件不是 `@change`、`@visible-change`，而是：

```vue
<Input @on-change="handleChange" />
<Modal @on-ok="handleOk" />
```

這種事件命名在 template 中是可讀的，但轉成 TypeScript listener prop 時會變得比較特殊。因為 listener prop 通常會加上 `on` 前綴，而事件本身又已經叫 `on-change`，所以最後會出現：

```txt
on-change -> on + OnChange -> onOnChange
```

這就是 `onOnChange` 看起來像重複命名，但其實是由事件命名規則推導出來的原因。

---

## 3. 整體概覽

本章可以用一張三層對照圖理解：

```txt
src/components/<component>/<component>.vue
  ├─ emits: [...]
  │   └─ 宣告 runtime 支援的事件名稱
  │
  ├─ this.$emit(eventName, payload)
  │   └─ 決定每個事件實際傳出的 payload
  │
  ▼
types/<component>.d.ts
  ├─ 'model-value'?: ...
  │   └─ 描述 v-model 對應的 model prop
  │
  ├─ onOnChange?: (event?: any) => any
  │   └─ 描述 @on-change 對應的 listener prop
  │
  └─ onOnVisibleChange?: (event?: any) => any
      └─ 描述 @on-visible-change 對應的 listener prop
```

這裡的核心問題不是「View UI Plus 有沒有事件」，而是：

> runtime 真的 emit 的事件、實際 payload、TypeScript declaration 看到的 listener prop，三者是否一致？

可以先把事件型別契約拆成四個觀察點：

| 觀察點 | 主要位置 | 回答的問題 |
| --- | --- | --- |
| 事件名稱 | `emits: [...]` | 元件宣告會發出哪些事件？ |
| 實際 payload | `$emit(...)` | 每個事件實際傳什麼資料？ |
| listener prop 名稱 | `types/*.d.ts` | TS / IDE 中要用什麼 listener 名稱？ |
| listener payload 型別 | `types/*.d.ts` | TypeScript 是否知道 payload 的精準型別？ |

如果只看 `emits: [...]`，會知道事件名稱，但不知道 payload 型別。如果只看 `.d.ts`，會知道 TypeScript surface，但不一定知道 runtime 是否真的完整對齊。因此本章的核心方法就是做三方對照。

---

## 4. 核心內容逐步講解

### 4.1 `Input` 的 runtime emits：先找事件清單

以 `Input` 為例，runtime 中可以看到類似以下的 `emits` 宣告：

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

這份清單告訴我們，`Input` 不是只支援一個 `change` 事件，而是同時包含鍵盤事件、焦點事件、搜尋事件、清除事件，以及 Vue 3 `v-model` 所需的 `update:modelValue`。

從命名上可以先分成兩類：

| 類型 | 範例 | 意義 |
| --- | --- | --- |
| Vue 3 model update | `update:modelValue` | 支援 `v-model` 雙向綁定 |
| View UI Plus 歷史事件命名 | `on-change`、`on-search`、`on-clear` | 保留 iView / View UI 風格的事件 API |

這一步的重點是先建立事件目錄。你可以把 `emits: [...]` 看成 runtime 事件的索引表，但它還不是完整型別契約，因為它沒有描述 payload。

---

### 4.2 `$emit(...)` 呼叫：確認實際 payload

接著要搜尋元件內部的 `$emit(...)`，例如：

```js
this.$emit('update:modelValue', value);
this.$emit('on-change', event);
this.$emit('on-search', this.currentValue);
this.$emit('on-clear');
```

這一步比單純看 `emits` 更重要，因為它會揭露每個事件實際傳出的資料。

以這幾個事件來看：

| `$emit` 呼叫 | 可能代表的 payload 語意 |
| --- | --- |
| `this.$emit('update:modelValue', value)` | 把新的輸入值同步給 `v-model` |
| `this.$emit('on-change', event)` | 把 change 事件或類事件物件丟給外部 |
| `this.$emit('on-search', this.currentValue)` | 把目前輸入值作為搜尋值丟出 |
| `this.$emit('on-clear')` | 只通知已清除，不一定帶 payload |

如果只看 `.d.ts` 中的 `(event?: any) => any`，你會以為這些事件都差不多。但從 runtime `$emit(...)` 來看，它們其實有不同語意：有些傳 DOM event，有些傳 value，有些不傳資料。

因此閱讀 emits 型別時，真正可靠的起點通常是：

```txt
emits 宣告事件名稱
  -> $emit 確認 payload
  -> .d.ts 檢查 TypeScript 是否精準表達
```

---

### 4.3 Declaration 中的 listener props：事件被放進 props object

在 `types/input.d.ts` 中，事件通常被寫成 listener props，例如：

```ts
onOnEnter?: (event?: any) => any;
onOnClick?: (event?: any) => any;
onOnChange?: (event?: any) => any;
onOnFocus?: (event?: any) => any;
onOnBlur?: (event?: any) => any;
onOnSearch?: (event?: any) => any;
onOnClear?: (event?: any) => any;
```

這代表 View UI Plus 的 declaration 不是把事件獨立整理成一個明確的 `EmitsOptions` 型別，而是讓 `DefineComponent<{ ... }>` 的 object 同時承載 props 與 listener props。

這種設計對使用者來說有一個實際效果：IDE 可以提示 `onOnChange` 這類 listener prop，TSX 或手動使用 component type 時也能看到事件監聽器欄位。不過它的限制也很明顯：payload 多數被寫成 `any`，所以 TypeScript 只能知道「有這個事件」，但無法精準保護事件參數。

---

### 4.4 `on-change` 為什麼變成 `onOnChange`

`onOnChange` 是本章最容易讓人困惑的名稱。它不是拼字錯誤，也不是單純重複寫了 `on`，而是事件命名轉換後的結果。

可以拆成三步：

```txt
runtime emit name: on-change
事件名稱轉成 PascalCase: OnChange
listener prop 加上 on 前綴: on + OnChange
最後得到: onOnChange
```

因此：

```txt
on-change -> onOnChange
on-visible-change -> onOnVisibleChange
on-open-change -> onOnOpenChange
```

如果事件本身不是 `on-*` 開頭，例如 `click`，就只會變成：

```txt
click -> onClick
```

整理成表格如下：

| Runtime emit | Template 常見寫法 | Declaration listener | 閱讀重點 |
| --- | --- | --- | --- |
| `click` | `@click` | `onClick` | 一般 Vue 事件轉 listener prop |
| `on-change` | `@on-change` | `onOnChange` | 事件本身已有 `on` 前綴 |
| `on-visible-change` | `@on-visible-change` | `onOnVisibleChange` | 多段 kebab-case 轉 PascalCase |
| `on-open-change` | `@on-open-change` | `onOnOpenChange` | 保留歷史事件命名後的結果 |
| `on-page-size-change` | `@on-page-size-change` | `onOnPageSizeChange` | 常見於分頁、表格類元件 |
| `on-clickoutside` | `@on-clickoutside` | `onOnClickoutside` | 實際大小寫需以 `.d.ts` 為準 |

閱讀時要避免用直覺判斷「這名字很怪，所以可能是錯的」。在 View UI Plus 的型別系統中，`onOnXxx` 是由歷史事件命名與 Vue listener prop 命名規則疊加而成的結果。

---

### 4.5 `v-model` 的三個名稱層次

`v-model` 在 View UI Plus 中特別容易混淆，因為你會同時看到三種名稱：

```txt
modelValue
model-value
update:modelValue
```

它們分別位於不同層次：

| 名稱 | 所在層次 | 角色 |
| --- | --- | --- |
| `modelValue` | runtime component props | 元件內部接收的 prop 名稱 |
| `model-value` | template / public type surface | 使用者在 template 或 `.d.ts` 中看到的 kebab-case prop |
| `update:modelValue` | runtime emits | `v-model` 更新資料時發出的事件 |
| `onUpdate:modelValue` | 理論上的 listener prop 型別 | 用來描述 `update:modelValue` listener payload，但在 v1.3.20 中不是普遍主流寫法 |

以 `Input` 為例，runtime prop 可能是：

```js
props: {
  modelValue: {
    type: [String, Number],
    default: ''
  }
}
```

runtime 透過以下事件通知外部更新：

```js
this.$emit('update:modelValue', value);
```

而 `.d.ts` 中通常看到的是：

```ts
'model-value'?: string | number;
```

這表示 TypeScript surface 至少描述了「使用者可以傳入 `model-value`，而且值可以是 `string | number`」。但如果 declaration 沒有同步提供：

```ts
'onUpdate:modelValue'?: (value: string | number) => void;
```

那就代表 `update:modelValue` 的 listener payload 並沒有被完整精準化。

這裡要分清楚：有 `'model-value'` 不等於 `v-model` 型別完整。它只代表 model prop 有型別，不代表 update event 的 listener payload 也被精準描述。

---

### 4.6 Event payload 精準度：有 listener 不代表 payload 精準

`Input` 的不同事件，其 payload 其實可能完全不同：

| Runtime emit | Runtime payload | 語意 |
| --- | --- | --- |
| `on-keydown` | `KeyboardEvent` | 鍵盤按下事件 |
| `on-focus` | `FocusEvent` | 聚焦事件 |
| `on-change` | `event` 或清空時的 `{ target: { value: '' } }` | 值變更事件或類事件物件 |
| `on-search` | `currentValue` | 搜尋時的目前輸入值 |
| `on-clear` | 無 payload | 通知清空動作發生 |
| `update:modelValue` | `string` 或 `number` | `v-model` 的新值 |

但是 declaration 可能只寫成：

```ts
onOnSearch?: (event?: any) => any;
onOnClear?: (event?: any) => any;
```

這樣的型別有一個問題：它把所有事件都模糊化成「可能有一個任意參數」。這對 IDE 提示事件存在有幫助，但對 payload 型別保護幫助有限。

如果要更精準，理論上可以改成：

```ts
onOnSearch?: (value: string | number) => void;
onOnClear?: () => void;
'onUpdate:modelValue'?: (value: string | number) => void;
```

但這只是型別改良方向，不代表 View UI Plus v1.3.20 目前 declaration 已經普遍採用這種設計。閱讀原始碼時必須區分「目前實際型別」與「可以如何改良」。

---

### 4.7 `Modal` 案例：事件對照不只出現在表單元件

`Modal` 也是很適合觀察事件型別的元件。runtime 可能宣告：

```js
emits: [
  'on-cancel',
  'on-ok',
  'on-hidden',
  'on-visible-change',
  'update:modelValue'
]
```

而 `types/modal.d.ts` 中可以看到類似：

```ts
onOnOk?: (event?: any) => any;
onOnCancel?: (event?: any) => any;
onOnVisibleChange?: (event?: any) => any;
```

這裡可以觀察到幾件事：

1. `on-ok` 會對應到 `onOnOk`。
2. `on-cancel` 會對應到 `onOnCancel`。
3. `on-visible-change` 會對應到 `onOnVisibleChange`。
4. `model-value` prop 若有宣告，代表 Modal 可透過 model prop 控制顯示狀態。
5. `update:modelValue` listener 不一定有被精準描述。
6. runtime 的 `on-hidden` 是否也有對應 listener type，需要回到 `types/modal.d.ts` 逐項確認；如果沒有，就是 runtime surface 與 type surface 的落差。

這個案例提醒我們：閱讀事件型別時不能只看有出現的欄位，也要檢查 runtime 有但 type 沒有的欄位。這種缺口通常就是後續型別改善或筆記延伸的重點。

---

### 4.8 為什麼 View UI Plus 保留 `on-*` 事件命名

從 API 歷史來看，iView / View UI 系列常使用 `@on-change`、`@on-visible-change`、`@on-ok` 這種事件命名。View UI Plus 保留這種風格，主要可以降低既有使用者遷移成本。

例如舊有使用者可能習慣：

```vue
<Input @on-change="handleChange" />
<Modal @on-ok="handleOk" />
```

如果 View UI Plus 改成更符合 Vue 3 常見風格的：

```vue
<Input @change="handleChange" />
<Modal @ok="handleOk" />
```

API 會看起來更簡潔，但可能破壞相容性或增加遷移成本。

因此，這裡其實是一個設計取捨：

| 取捨面向 | 保留 `on-*` 風格的效果 |
| --- | --- |
| 使用者遷移 | 對 iView / View UI 舊使用者較友善 |
| template API | 事件名稱較長，但符合既有文件習慣 |
| TypeScript listener prop | 會產生 `onOnXxx` 這種不美觀但可推導的名稱 |
| 型別閱讀成本 | 初學者容易誤以為是重複命名錯誤 |

所以本章的重點不是批評 `onOnXxx` 命名，而是學會從 API 歷史與型別生成規則理解它。

---

## 5. 表格整理

### 5.1 事件型別閱讀總表

| 項目 | 位置 / 寫法 | 角色 | 閱讀重點 |
| --- | --- | --- | --- |
| runtime emits list | `emits: [...]` | 宣告元件會發出的事件名稱 | 只能知道事件名，不一定知道 payload |
| runtime emit call | `this.$emit('on-change', event)` | 實際發出事件與 payload | 要確認 payload 來源、型別與是否可能為空 |
| model prop | `modelValue` / `'model-value'` | 支援 `v-model` 的資料入口 | runtime 通常是 camelCase，public type 常是 kebab-case |
| model update event | `update:modelValue` | 支援 `v-model` 的資料更新事件 | 要確認 `.d.ts` 是否有 `onUpdate:modelValue` 類型 |
| historical event | `on-change`、`on-ok` | View UI Plus / iView 風格事件 | 轉成 listener prop 後會變成 `onOnXxx` |
| listener prop | `onOnChange?: ...` | TypeScript surface 中的事件監聽器 | 有 listener 不代表 payload 精準 |
| weak payload type | `(event?: any) => any` | 寬鬆事件型別 | 只能表示可監聽，不能保證參數型別 |

這張表的讀法是：先從 runtime 找到「事件是否真的存在」，再從 `$emit(...)` 找到「事件到底傳什麼」，最後回到 `.d.ts` 看「TypeScript 是否知道這件事」。三者都對上，事件型別契約才算完整。

---

### 5.2 Runtime emit 到 listener prop 的命名對照

| Runtime emit | Template 寫法 | Declaration listener | 備註 |
| --- | --- | --- | --- |
| `click` | `@click` | `onClick` | 一般事件轉換 |
| `on-click` | `@on-click` | `onOnClick` | View UI Plus 歷史命名 |
| `on-change` | `@on-change` | `onOnChange` | 常見於 Input、Select 等元件 |
| `on-search` | `@on-search` | `onOnSearch` | payload 可能是目前輸入值 |
| `on-clear` | `@on-clear` | `onOnClear` | 可能無 payload |
| `on-visible-change` | `@on-visible-change` | `onOnVisibleChange` | 常見於 Modal、Dropdown 類場景 |
| `on-page-size-change` | `@on-page-size-change` | `onOnPageSizeChange` | 常見於 Page / Table 分頁相關場景 |
| `update:modelValue` | `@update:modelValue` | `onUpdate:modelValue` | 是否存在需逐項檢查 `.d.ts` |

需要注意的是，最後一欄 `onUpdate:modelValue` 是理論上常見的 listener prop 表達方式；在 View UI Plus v1.3.20 的 declaration 中，並不是每個元件都會精準寫出這種 listener 型別。閱讀時要以實際 `.d.ts` 為準。

---

### 5.3 `v-model` 名稱層次表

| 名稱 | 層次 | 範例 | 主要用途 |
| --- | --- | --- | --- |
| `modelValue` | runtime prop | `props: { modelValue: ... }` | 元件內部接收值 |
| `model-value` | template / public type | `'model-value'?: string \| number` | 使用者傳入 model prop |
| `update:modelValue` | runtime emit | `$emit('update:modelValue', value)` | 通知外部更新值 |
| `onUpdate:modelValue` | listener prop type | `'onUpdate:modelValue'?: (...) => ...` | 描述 update listener 型別，需確認是否存在 |

這張表可以幫助你避免把 `modelValue` 和 `model-value` 混在一起。前者是 JavaScript runtime 內部命名，後者是 template 與 declaration 常見的 public prop 命名。

---

### 5.4 Payload 精準度表

| 型別寫法 | 型別強度 | 代表意義 | 問題 |
| --- | --- | --- | --- |
| `onOnSearch?: (value: string \| number) => void` | 高 | 明確知道 payload 是值 | 使用者能得到較好的型別保護 |
| `onOnClear?: () => void` | 高 | 明確知道沒有 payload | 不會誤用不存在的參數 |
| `onOnFocus?: (event: FocusEvent) => void` | 高 | 明確知道是焦點事件 | IDE 能提示 DOM event API |
| `onOnChange?: (event?: any) => any` | 低 | 只知道可監聽 | payload 幾乎無型別保護 |
| `onOnClear?: (event?: any) => any` | 低 | 可能誤導為有 event | 與 runtime 無 payload 可能不一致 |

這裡的核心判斷是：`any` 不代表事件不存在，而是代表型別沒有把 payload 講清楚。因此在做原始碼閱讀或型別改良時，`any` 是需要標記的弱契約位置。

---

## 6. 範例或情境說明

### 6.1 使用者使用 `Input` 的情境

假設使用者寫：

```vue
<template>
  <Input
    v-model="keyword"
    @on-search="handleSearch"
    @on-clear="handleClear"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue';

const keyword = ref('');

function handleSearch(value: string) {
  console.log(value);
}

function handleClear() {
  keyword.value = '';
}
</script>
```

從使用者角度看，這段程式碼涉及三件事：

1. `v-model="keyword"` 需要 `model-value` prop 與 `update:modelValue` event。
2. `@on-search` 需要 runtime 有 `$emit('on-search', ...)`。
3. `@on-clear` 需要 runtime 有 `$emit('on-clear')`。

但是從 View UI Plus v1.3.20 的型別角度看，如果 `.d.ts` 中只寫：

```ts
onOnSearch?: (event?: any) => any;
onOnClear?: (event?: any) => any;
```

那麼 TypeScript 不一定能精準推導 `handleSearch` 的參數應該是 `string | number`，也不一定能提醒 `handleClear` 不應該依賴 event 參數。

這就是 runtime 行為與 type surface 精準度之間的差距。

---

### 6.2 閱讀 `Input` 事件時的完整追蹤方式

如果你要確認 `Input` 的 `on-search` 型別是否精準，可以照以下順序：

```txt
第一步：看 runtime emits
  -> 是否有 'on-search'

第二步：搜尋 $emit('on-search', ...)
  -> 看 payload 是 this.currentValue、event、option 還是其他資料

第三步：看 types/input.d.ts
  -> 是否有 onOnSearch
  -> function 參數是不是 any
  -> 是否能對應 runtime payload

第四步：標記差距
  -> runtime 傳 value
  -> type 寫 event?: any
  -> 可以記成「事件存在，但 payload 型別未精準化」
```

這樣做的好處是，你不會只靠 `.d.ts` 猜 runtime，也不會只靠 runtime 假設 TypeScript 一定知道全部細節。

---

### 6.3 改良型別時可能的寫法

如果未來要補強 `Input` 的事件型別，可以把弱型別：

```ts
onOnSearch?: (event?: any) => any;
onOnClear?: (event?: any) => any;
```

改成更接近 runtime 語意的寫法：

```ts
onOnSearch?: (value: string | number) => void;
onOnClear?: () => void;
'onUpdate:modelValue'?: (value: string | number) => void;
```

不過，這裡要特別注意：這是「型別改良方向」，不是對 View UI Plus v1.3.20 現況的斷言。實際修改時還需要完整檢查元件 runtime source、官方文件、既有測試與向下相容性。

---

## 7. 閱讀路線或學習路線

### 7.1 初次閱讀路線

第一次讀 View UI Plus 的 emits 型別時，不建議一開始就追所有元件。可以先用 `Input` 作為主案例，因為它同時包含：

1. `modelValue` prop。
2. `update:modelValue` event。
3. 多個 `on-*` 歷史事件。
4. DOM event 類 payload。
5. value 類 payload。
6. 無 payload 的事件。

建議順序如下：

1. 先看 `src/components/input/input.vue` 的 `emits: [...]`。
2. 搜尋 `this.$emit(...)`，逐一記錄事件 payload。
3. 再看 `types/input.d.ts` 的 `onOnXxx` listener props。
4. 對照 `'model-value'` 是否存在。
5. 檢查是否有 `onUpdate:modelValue` 類型。
6. 把 payload 為 `any` 的地方標註成弱契約。

---

### 7.2 深入閱讀路線

理解 `Input` 後，可以再讀 `Modal`。`Modal` 的重點不只是輸入值，而是顯示狀態與使用者操作事件：

1. 先看 `Modal` runtime 是否有 `modelValue` 或可控制顯示狀態的 prop。
2. 找出 `on-ok`、`on-cancel`、`on-visible-change`、`on-hidden` 等事件。
3. 對照 `types/modal.d.ts` 是否都有 listener prop。
4. 特別檢查 runtime 有但 type surface 沒有的事件。
5. 判斷這些事件的 payload 是否應該更精準。

這一步會讓你理解：事件型別問題不只發生在表單輸入，也會發生在彈窗、下拉、表格、分頁等互動元件。

---

### 7.3 後續擴展路線

在熟悉 `Input` 與 `Modal` 後，可以延伸到更複雜的元件：

| 元件類型 | 建議觀察重點 |
| --- | --- |
| `Select` | option、value、clear、visible-change 的 payload |
| `Table` | row、column、selection、sort、filter 的事件 payload |
| `Page` | page number、page size change 的型別 |
| `Form` | validate callback、field change、reset 等事件 |
| `Upload` | file、fileList、response、error 的 payload |

這些元件的事件 payload 通常比 `Input` 更複雜，也更適合觀察 View UI Plus 型別系統是否有泛型改良空間。

---

## 8. 常見誤區

| 誤區 | 為什麼容易誤解 | 正確理解 |
| --- | --- | --- |
| `onOnChange` 是命名錯誤 | 看起來像 `on` 重複出現 | 它是 `on-change` 轉成 listener prop 後的結果 |
| 有 `emits: [...]` 就代表型別完整 | runtime 宣告看起來很完整 | `emits` 只宣告事件名，不描述 TypeScript payload |
| `.d.ts` 有 `onOnChange` 就代表 payload 精準 | 有 function type 容易讓人以為已型別化 | 如果參數是 `any`，仍然只是弱型別提示 |
| 有 `'model-value'` 就代表 `v-model` 型別完整 | model prop 已經有型別 | 還要看 `update:modelValue` listener 是否有精準型別 |
| `event?: any` 一定代表 DOM Event | 參數名稱叫 event | 實際 payload 可能是 value、row、option、selection 或無 payload |
| runtime 有的事件 `.d.ts` 一定有 | 直覺上 declaration 應該同步 | View UI Plus 可能存在 runtime/type gap，需要逐項對照 |
| 可以直接把所有 `any` 改成精準型別 | 精準型別看起來一定更好 | 還需要考慮文件承諾、向下相容性與實際 runtime 分支 |

---

## 9. 本章總結

View UI Plus v1.3.20 的 emits 型別設計，核心特徵是把事件監聽器放進 `DefineComponent<{ ... }>` 的 object 裡，用 listener props 的形式暴露給 TypeScript 使用者。由於 View UI Plus 保留 iView / View UI 系列的 `on-*` 事件命名，因此 runtime 中的 `on-change` 會在 `.d.ts` 中形成 `onOnChange`，`on-visible-change` 會形成 `onOnVisibleChange`。這些名稱雖然看起來不直覺，但可以透過固定規則推導。

`v-model` 則需要拆成三個層次理解：runtime prop 是 `modelValue`，public prop / declaration 常寫成 `'model-value'`，runtime update event 是 `update:modelValue`。如果 `.d.ts` 只有描述 `'model-value'`，但沒有精準描述 `onUpdate:modelValue`，那就代表 `v-model` 的 prop 有型別，但 update listener 的 payload 型別可能仍不完整。

讀事件型別時，最重要的方法不是背每個事件，而是建立三方對照習慣：

```txt
看 emits 宣告事件名
  -> 看 $emit(...) 確認 payload
  -> 看 types/*.d.ts 確認 TypeScript 是否精準表達
```

只要掌握這個方法，後續閱讀 `Select`、`Table`、`Page`、`Form`、`Upload` 等更複雜元件時，就能穩定判斷哪些型別是精準 contract，哪些只是寬鬆提示，哪些地方可能存在 runtime surface 與 type surface 的落差。

---

## 10. 自我檢查問題

1. 為什麼 View UI Plus 的 `.d.ts` 中會出現 `onOnChange`，而不是只有 `onChange`？
2. `click`、`on-click`、`on-visible-change` 分別會如何對應到 listener prop？
3. `modelValue`、`model-value`、`update:modelValue`、`onUpdate:modelValue` 分別位於哪個層次？
4. 為什麼只看到 `'model-value'?: string | number`，不能直接判斷 `v-model` 型別已經完整？
5. `emits: [...]` 和 `$emit(...)` 在事件型別閱讀中各自提供什麼資訊？
6. 為什麼 `onOnSearch?: (event?: any) => any` 不算精準描述 `on-search` 的 payload？
7. 如果 runtime 有 `$emit('on-clear')`，但 type 寫成 `onOnClear?: (event?: any) => any`，可能造成什麼誤解？
8. 讀 `Modal` 的事件時，為什麼要特別檢查 `on-hidden` 是否有對應 declaration？
9. 若要改善 `Input` 的 `update:modelValue` 型別，你會優先補哪一種 listener prop？
10. 為什麼把所有 `any` 改成精準型別前，需要先確認 runtime source、官方文件與向下相容性？

---

## 11. 後續延伸方向

這篇筆記是 emits 與 `v-model` 型別的入口章，後續可以拆成以下主題繼續深入：

1. **`Input` 事件型別專章**  
   逐項對照 `on-enter`、`on-search`、`on-keydown`、`on-focus`、`on-clear`、`update:modelValue` 的 runtime payload 與 declaration。

2. **`Modal` public API 與事件型別專章**  
   整理 `on-ok`、`on-cancel`、`on-visible-change`、`on-hidden`、imperative modal API 與 `ModalInstance` 之間的關係。

3. **`Table` 事件 payload 與泛型改良專章**  
   觀察 row、column、selection、sort、filter 等 payload 是否能用泛型描述。

4. **`Form` validate callback 型別專章**  
   分析表單驗證事件、callback、rules、model 與 field name 的型別關係。

5. **`v-model` 型別補強設計筆記**  
   研究如何在現有 declaration 中補上 `onUpdate:modelValue`，並評估是否會影響既有使用者。

6. **runtime surface / type surface / docs 三方一致性檢查表**  
   建立一份檢查模板，用來系統性比對元件 runtime、`.d.ts` 與官方文件是否同步。

7. **View UI Plus 型別弱契約清單**  
   收集所有 `(event?: any) => any`、`Function`、`object`、`any[]` 等弱型別位置，作為後續重構與學習素材。
