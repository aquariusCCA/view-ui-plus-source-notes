# 可編輯文字設計

## 學習目標

這篇分析 Typography 的可編輯能力。`editable` 把原本只讀的文字切換成 textarea，並處理進入編輯、輸入、保存、取消、失焦與 `v-model` 更新。

讀完後，要能設計一個文字原地編輯元件，並清楚定義每個事件的時機。

## 對照源碼

- `01-origin/source/view-ui-plus-v1.3.20/src/components/typography/base.vue`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/typography/props.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/input/input.vue`
- `01-origin/source/view-ui-plus-v1.3.20/src/utils/keyCode.js`
- `01-origin/source/view-ui-plus-v1.3.20/examples/routers/typography.vue`
- `01-origin/source/view-ui-plus-v1.3.20/types/typography.d.ts`

## API 組成

| API | 作用 |
| --- | --- |
| `editable` | 是否允許原地編輯 |
| `editConfig` | 設定 tooltip、初始編輯、maxlength、autosize、triggerType |
| `modelValue` | 受控文字值 |
| `update:modelValue` | 保存後同步新值 |
| `editIcon` slot | 自訂編輯入口 icon |
| `enterIcon` slot | 自訂確認 icon |
| `on-edit-start` | 進入編輯狀態 |
| `on-edit-change` | 編輯內容變更 |
| `on-edit-end` | 保存編輯 |
| `on-edit-cancel` | 取消編輯 |

`editable` 的關鍵不是顯示 textarea，而是把編輯生命週期拆成可追蹤事件。

## editConfig

預設配置包含：

```txt
tooltip: '编辑'
editing: false
maxlength: ''
autosize: true
triggerType: 'icon'
```

`triggerType` 有三種：

| 值 | 行為 |
| --- | --- |
| `icon` | 點 icon 進入編輯 |
| `text` | 點文字進入編輯 |
| `both` | icon 和文字都能進入編輯 |

這個設計把「是否可編輯」和「如何觸發編輯」分開，避免使用者只能接受單一互動方式。

## 狀態模型

核心內部狀態：

| 狀態 | 作用 |
| --- | --- |
| `currentContent` | 目前展示內容，跟隨 `modelValue` |
| `editing` | 是否處於編輯模式 |
| `editContent` | textarea 中的暫存內容 |
| `lastKeyCode` | 配合 keydown/keyup 判斷單鍵操作 |
| `isEditESC` | 避免 Esc 取消後 blur 又保存 |

這裡最重要的分離是：`editContent` 是草稿，`currentContent/modelValue` 是已保存內容。取消編輯時不應把草稿提交出去。

## 進入編輯

`handleEdit()` 做幾件事：

1. 從 `currentContent` 或 slot `innerText` 取得初始文字。
2. 在 `nextTick` 後切到 `editing = true`。
3. 觸發 `on-edit-start`。
4. 再次 `nextTick` 後 focus textarea，游標移到結尾。

兩層 `nextTick` 的目的，是等 DOM 從文字節點切換成 Input 後再執行 focus。

## 保存與取消

保存入口：

- Enter keyup。
- blur。

保存流程：

```txt
editContent
  -> emit update:modelValue
  -> editing = false
  -> emit on-edit-end
```

取消入口：

- Esc keyup。

取消流程：

```txt
isEditESC = true
emit on-edit-cancel
editing = false
blur 時跳過保存
```

`isEditESC` 是這裡的防重入 guard。沒有它，Esc 關閉 textarea 後可能觸發 blur，導致取消又被保存覆蓋。

## change 事件

`handleEditChange()` 從原生事件拿 `event.target.value`，更新 `editContent` 並觸發 `on-edit-change`。

這表示 `on-edit-change` 是草稿變化事件，不代表內容已保存。父層如果要即時保存，需要自己定義策略；Typography 預設只在保存時 `update:modelValue`。

## 與 Input 的邊界

Typography editable 使用 Input 的 textarea 能力：

- `type: 'textarea'`
- `autosize`
- `maxlength`
- blur、keydown、keyup、change 事件

但它不負責表單驗證、錯誤訊息、rules 或 FormItem 狀態。這些應該留在表單章節或業務封裝中處理。

## 設計啟發

可編輯文字的穩定流程應該是：

```txt
展示文字
  -> 觸發編輯
  -> 建立草稿
  -> textarea focus
  -> change 更新草稿
  -> Enter/blur 保存，Esc 取消
  -> 事件通知外部
```

不要在每次輸入時直接覆蓋已保存值，除非 API 明確說明這是即時同步元件。

## 複習題

1. `editContent` 和 `currentContent` 為什麼要分開？
2. Esc 取消後為什麼需要 `isEditESC`？
3. `on-edit-change` 和 `update:modelValue` 的語意差異是什麼？
4. `triggerType` 解決哪種互動差異？
5. Typography editable 為什麼不應承擔表單驗證？
