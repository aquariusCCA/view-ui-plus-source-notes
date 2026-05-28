# Mini Input

Input 是進入表單元件前最重要的練習。它的核心不是渲染一個 `<input>`，而是把原生輸入事件整理成穩定的 `v-model`、change、clear、focus、blur 語意。

## 練習目標

- 練習 `modelValue` 與 `update:modelValue`。
- 練習區分 input、change、clear、focus、blur。
- 練習 prefix/suffix slot 與 clearable icon。
- 練習 controlled component 的最小狀態設計。

## 對照源碼

主要對照：

- `src/components/input/`
- `types/input.d.ts`
- `src/styles/components/input.less`

閱讀時關注：

- Input 如何處理 `modelValue`。
- `on-change` 與 `on-input-change` 的差異。
- clearable 是否會觸發 change。
- prefix、suffix、prepend、append 在 DOM 結構上如何排列。
- textarea 與 input 是否共用邏輯。

## 最小實作範圍

仿寫一個 `MiniInput`：

- 支援 `modelValue`。
- 支援 `placeholder`。
- 支援 `disabled`。
- 支援 `readonly`。
- 支援 `clearable`。
- 支援 `prefix`、`suffix` slot。
- 支援 `type="text" | "password"`。
- emit `update:modelValue`、`input`、`change`、`clear`、`focus`、`blur`。
- expose `focus()` 與 `blur()`。

先不實作：

- textarea。
- search mode。
- word count。
- prepend/append。
- password visibility toggle。
- form validate trigger。

## API 設計

| 類型 | 名稱 | 說明 |
| --- | --- | --- |
| prop | `modelValue?: string \| number` | 輸入值 |
| prop | `placeholder?: string` | placeholder |
| prop | `disabled?: boolean` | 禁用 |
| prop | `readonly?: boolean` | 唯讀 |
| prop | `clearable?: boolean` | 顯示清除按鈕 |
| prop | `type?: 'text' \| 'password'` | 原生輸入類型 |
| emit | `update:modelValue(value)` | 輸入時同步外部值 |
| emit | `input(value, event)` | 每次輸入觸發 |
| emit | `change(value, event)` | 原生 change 觸發 |
| emit | `clear()` | 點擊清除時觸發 |
| emit | `focus(event)` | focus |
| emit | `blur(event)` | blur |
| slot | `prefix` | 前置內容 |
| slot | `suffix` | 後置內容 |
| expose | `focus()`、`blur()` | 暴露輸入框操作 |

## 實作步驟

1. 建立 `MiniInput.vue`。
2. 用 `ref<HTMLInputElement>()` 保存 input DOM。
3. 建立 `currentValue` computed，直接從 `props.modelValue` 轉字串顯示。
4. input 事件中 emit `update:modelValue` 與 `input`。
5. change 事件中 emit `change`。
6. clear handler emit 空字串、`clear`，並重新 focus input。
7. 用 slot presence 決定 wrapper class。
8. expose `focus`、`blur`。

## 驗收案例

- 使用 `v-model` 時，輸入文字會更新外部值。
- `disabled` 時不能輸入，clear icon 不顯示或不可操作。
- `clearable` 且有值時顯示清除按鈕，點擊後值變成空字串。
- 傳入 prefix slot 時，根節點套用 prefix class。
- 呼叫元件 instance 的 `focus()` 時，原生 input 取得焦點。

## 源碼反思

View UI Plus 的 Input 還要處理 textarea、自動高度、字數限制、search、prepend/append、密碼顯示切換、FormItem 驗證觸發與 IME composition。這些都是真實產品需要的複雜度。

仿寫版先抓住最重要的契約：`v-model` 是值同步，`input/change` 是事件語意，clearable 是由元件主動發起的一次值變更。
