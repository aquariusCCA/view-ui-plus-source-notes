# Steps 與 Step

## 學習目標

這篇分析 `Steps` 和 `Step` 如何表示流程導航。重點是 step 註冊、序號計算、`current` 與 `status` 的推導、錯誤狀態傳遞，以及 title/content/icon 的 prop 與 slot fallback。

## 對照源碼

- `src/components/steps/steps.vue`
- `src/components/steps/step.vue`
- `types/steps.d.ts`
- `src/styles/components/steps.less`

## 元件定位

`Steps` 是流程容器，提供目前步驟與整體狀態。`Step` 是單一節點，根據自己在父層中的索引推導序號和狀態。

```txt
Step beforeMount
  -> Steps.addStep(id, step)
  -> Step.stepNumber / currentStatus
  -> class + icon + title/content
```

## Props 與狀態

| 元件 | props | 作用 |
| --- | --- | --- |
| `Steps` | `current` | 目前步驟，從 0 開始 |
| `Steps` | `status` | 目前步驟狀態：`wait`、`process`、`finish`、`error` |
| `Steps` | `size` | 只支援 `small` |
| `Steps` | `direction` | `horizontal` 或 `vertical` |
| `Step` | `status` | 覆蓋單一 step 狀態 |
| `Step` | `title`、`content`、`icon` | 文字與 icon fallback |

`Steps` 內部維護 `steps` 陣列，每個元素是 `{ id, step }`。

## 註冊與序號

`Step` 在 beforeMount 呼叫 `StepsInstance.addStep(this.id, this)`，beforeUnmount 時移除。`stepNumber` 每次透過 id 在父層 `steps` 陣列中找索引，再加 1。

這表示 Step 的順序依賴實際掛載順序。若動態插入或移除 Step，序號會隨父層陣列重新計算。

## 狀態推導

`currentStatus` 的優先順序：

1. 如果 `Step.status` 存在，直接使用它。
2. 否則取得自己在 `Steps.steps` 中的 index。
3. index 等於 `Steps.current` 時，若父層 `status` 不是 `error`，顯示 `process`；若父層是 `error`，顯示 `error`。
4. index 小於 current 顯示 `finish`。
5. index 大於 current 顯示 `wait`。

`nextError` 的設計意圖是檢查下一個 step 是否為 error，並在目前 step 上加 `ivu-steps-next-error`，讓連接線能呈現錯誤樣式。不過源碼中的 `steps` 陣列元素是 `{ id, step }`，而 `nextError` 讀的是 `nextStep.currentStatus`，這裡值得在維護時回頭確認是否應該讀 `nextStep.step.currentStatus`。

## Icon 與 Slot Fallback

Step head 內容的優先順序：

| 條件 | 顯示 |
| --- | --- |
| 沒有 `icon`、沒有 `icon` slot，且狀態不是 finish/error | 步驟序號 |
| 有 `icon` slot | slot 內容 |
| 有 `icon` prop 或 finish/error | icon class |

title 和 content 也有 prop + slot fallback：

```txt
slot title -> title prop
slot content -> content prop
```

content 沒有 prop 且沒有 slot 時，不渲染 content 區塊。

## Class 與結構

| 狀態 | class |
| --- | --- |
| 根容器 | `ivu-steps`、`ivu-steps-horizontal`、`ivu-steps-vertical`、`ivu-steps-small` |
| step item | `ivu-steps-item` |
| 狀態 | `ivu-steps-status-wait`、`process`、`finish`、`error` |
| 自訂 icon | `ivu-steps-custom` |
| 下一步錯誤 | `ivu-steps-next-error` |

每個 Step 都固定包含 tail、head、main 三個區塊，樣式靠 less 控制流程線與圓點。

## Runtime 與型別對照

| 項目 | 觀察 |
| --- | --- |
| `Step.status` | runtime validator 限制四種狀態，型別寫 string |
| slots 歸屬 | runtime 的 `title`、`content`、`icon` slot 在 `Step` 上，型別卻寫在 `Steps` 的 `v-slots` |
| `Steps.children` | runtime 有 computed children，但目前主要供內部讀取 |
| `nextError` | runtime 讀 `nextStep.currentStatus`，但 `steps` 陣列包了一層 `{ id, step }`，可能需要核對 |
| events | Steps 沒有 emits，使用者要自己控制 `current` |

## 設計啟發

Steps 是由父層狀態推導子層狀態的典型元件。使用者只需要設定目前進度，子項就能自動得到 finish/process/wait/error。

單一 Step 仍保留 `status` 覆蓋能力，讓特殊流程可以標記局部錯誤或自訂狀態。這種設計兼顧預設推導與手動控制。

## 複習題

1. `Step` 為什麼在 beforeMount 註冊，而不是 mounted？
2. `currentStatus` 的推導優先順序是什麼？
3. `nextError` 影響的是哪個視覺區塊？
4. Step 的 icon 顯示優先順序是什麼？
5. `Steps` 為什麼不需要 emit 事件？
