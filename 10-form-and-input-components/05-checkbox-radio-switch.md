# Checkbox、Radio 與 Switch

## 學習目標

這篇比較布林、單選與多選輸入元件。重點是單體模式與 group 模式、`trueValue` / `falseValue`、`label`、disabled 繼承、事件同步與表單驗證。

## 對照源碼

- `01-origin/source/view-ui-plus-v1.3.20/src/components/checkbox/checkbox.vue`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/checkbox/checkbox-group.vue`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/radio/radio.vue`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/radio/radio-group.vue`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/switch/switch.vue`
- `01-origin/source/view-ui-plus-v1.3.20/types/checkbox.d.ts`
- `01-origin/source/view-ui-plus-v1.3.20/types/radio.d.ts`
- `01-origin/source/view-ui-plus-v1.3.20/types/switch.d.ts`

## 三種值語意

| 元件 | 單體模式 | 群組模式 |
| --- | --- | --- |
| `Checkbox` | `modelValue` 在 `trueValue` / `falseValue` 間切換 | `CheckboxGroup.modelValue` array 包含或移除 `label` |
| `Radio` | 類似布林切換，使用 `trueValue` / `falseValue` | `RadioGroup.modelValue` 等於某個 `label` |
| `Switch` | `currentValue` 在 `trueValue` / `falseValue` 間切換 | 無 group 模式 |

Checkbox/Radio 在 group 中時，子元件自己的 `modelValue` 不再是主要值來源，而是由父層 group 統一管理。

## Group 協作

```txt
CheckboxGroup / RadioGroup provide instance
  -> 子 Checkbox / Radio inject group
  -> 子元件根據 group.modelValue 判斷 checked
  -> 使用者點擊子元件
  -> group.change(...)
  -> group emit update:modelValue + on-change
  -> FormItem change
```

group 的好處是統一 disabled、size、type、name 與表單驗證觸發。

## Label 與 Value

| 欄位 | 說明 |
| --- | --- |
| `label` | 在 group 模式代表此選項的值 |
| default slot | 顯示文字，不一定等於值 |
| `trueValue` | 單體模式 checked 時對外輸出的值 |
| `falseValue` | 單體模式 unchecked 時對外輸出的值 |
| `modelValue` | 外部受控值 |

這裡容易混淆的是：`label` 不是只用來顯示，在 group 模式它就是提交值。

## Switch 特點

`Switch` 沒有 group，但同樣支援：

- `trueValue` / `falseValue`
- `trueColor` / `falseColor`
- `open` / `close` slot
- loading、disabled、size class
- `update:modelValue` 與 `on-change`

Switch 的 UI 是布林，但 API 可輸出自訂值，這讓它能對接後端常見的 `1/0`、`yes/no`。

## 設計啟發

選擇類小元件要先決定「單體值」和「集合值」是不是同一套 API。Checkbox 和 Radio 為了支援 group，子元件必須能切換資料來源：

```txt
有 group -> 使用 group 的 modelValue
無 group -> 使用自己的 modelValue
```

這個判斷會影響 checked class、disabled、name、事件與表單驗證。

## 複習題

1. Checkbox 在單體模式和 group 模式下，`modelValue` 的型別有什麼不同？
2. RadioGroup 為什麼要 provide 自己給 Radio？
3. `label` 和 default slot 的語意差異是什麼？
4. Switch 支援 `trueValue` / `falseValue` 的好處是什麼？
5. disabled 狀態應由子元件、父 group 還是 Form 控制？
