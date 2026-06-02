# 表單共用邏輯

## 學習目標

這篇分析 `mixins/form.js` 如何讓輸入類元件接入 Form / FormItem。表單是元件庫裡最典型的跨元件協作場景，因為 Input、Select、Checkbox、Radio、Slider、Upload 等元件都要能感知表單禁用狀態，也要在 blur / change 時觸發驗證。

## 對照源碼

- `01-origin/source/view-ui-plus-v1.3.20/src/mixins/form.js`

表單上下文來源：

- `01-origin/source/view-ui-plus-v1.3.20/src/components/form/form.vue`

欄位上下文與驗證：

- `01-origin/source/view-ui-plus-v1.3.20/src/components/form/form-item.vue`

輸入元件接入範例：

- `01-origin/source/view-ui-plus-v1.3.20/src/components/input/input.vue`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/select/select.vue`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/checkbox/checkbox.vue`

這幾個元件不是完整使用清單，而是代表表單共用邏輯的一條完整鏈路：`form.vue` 用來看表單最外層如何提供 `FormInstance`；`form-item.vue` 用來看欄位容器如何注入 `FormInstance` 並提供 `FormItemInstance`；`input.vue` 用來看文字輸入如何回報 blur / change；`select.vue` 用來看選擇型輸入如何回報 change；`checkbox.vue` 用來看勾選型輸入如何套用同一套表單接線。完整有哪些元件混入 `mixins/form.js`，可以看後面的「被哪些元件使用」章節。

## Form 上下文鏈路

表單的上下文傳遞大致是：

```txt
Form
  provide FormInstance
    -> FormItem
       inject FormInstance
       provide FormItemInstance
         -> Input / Select / Checkbox / Radio / Slider ...
            inject FormInstance
            inject FormItemInstance
```

`form.vue` 提供 `FormInstance`，`form-item.vue` 注入它後再提供 `FormItemInstance`。真正的輸入元件透過 `mixins/form.js` 同時注入兩者。

## `mixins/form.js` 提供什麼

這個 mixin 主要提供兩個能力：

| 成員 | 類型 | 作用 |
| --- | --- | --- |
| `FormInstance` | inject | 讀取外層 Form，例如全域 disabled |
| `FormItemInstance` | inject | 回報 blur / change，觸發 FormItem 驗證 |
| `itemDisabled` | computed | 合併元件自己的 `disabled` 與 Form 的 `disabled` |
| `handleFormItemChange` | method | 把輸入事件轉成 FormItem 的 `formBlur` 或 `formChange` |

`itemDisabled` 的設計很實用：如果元件本身沒有 disabled，但外層 Form 被 disabled，輸入元件也會跟著禁用。

## 事件流

以 Input 為例，流程可以整理成：

```txt
使用者輸入或失焦
  -> Input 內部更新 currentValue
  -> 呼叫 handleFormItemChange('change' 或 'blur', value)
  -> mixins/form.js 找到 FormItemInstance
  -> 呼叫 FormItemInstance.formChange 或 formBlur
  -> FormItem 根據 rules 觸發驗證
  -> Form 對外發出 on-validate
```

這讓每個輸入元件不用直接理解完整驗證流程，只要在正確時機呼叫同一個方法。

## 被哪些元件使用

代表元件包含：

- `auto-complete`
- `button`
- `cascader`
- `checkbox`
- `color-picker`
- `date-picker`
- `input`
- `input-number`
- `radio`
- `rate`
- `select`
- `slider`
- `switch`
- `transfer`
- `tree-select`
- `upload`

這說明 `mixins/form.js` 是輸入類元件的共同接線層。

## 設計啟發

表單元件庫最容易出現重複邏輯：每個輸入元件都要處理 disabled、readonly、change、blur、驗證、清空與顯示錯誤。如果每個元件自己處理，行為很快就會不一致。

View UI Plus 的做法是：

- 表單上下文用 `provide/inject` 傳遞。
- 元件自己的 props 仍保留優先權。
- 輸入元件只回報事件，不直接操作 Form rules。
- FormItem 集中負責驗證狀態與錯誤訊息。

這個分工值得仿寫。用 Vue 3 重構時，可以把 mixin 改成 `useFormItem()`，回傳 `itemDisabled` 與 `handleFormItemChange`。

## 複習題

1. `FormInstance` 和 `FormItemInstance` 分別代表什麼？
2. `itemDisabled` 為什麼要同時看元件 prop 和 Form 狀態？
3. 輸入元件為什麼不應該直接執行完整驗證邏輯？
4. `change` 和 `blur` 對表單驗證有什麼差異？
5. 如果改成 Composition API，你會如何設計 `useFormItem()`？
