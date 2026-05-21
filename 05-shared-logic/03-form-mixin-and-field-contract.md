# Form Mixin and Field Contract：欄位元件如何接入 Form 系統

## 1. 本章定位

本篇分析 `src/mixins/form.js`。

這個 mixin 是 View UI Plus 表單系統的重要共用邏輯。它讓 `Input`、`Select`、`Radio`、`Checkbox`、`Switch`、`Slider`、`DatePicker` 等欄位元件，用同一套方式接入 `Form` / `FormItem`。

本篇只看「共用接入契約」，不完整分析表單驗證流程。完整 Form 系統可以放到 `09-form-system/`。

---

## 2. Source 位置

核心檔案：

```txt
01-origin/source/view-ui-plus-v1.3.20/src/mixins/form.js
```

相關檔案：

```txt
src/components/form/form.vue
src/components/form/form-item.vue
src/components/input/input.vue
src/components/button/button.vue
```

---

## 3. Form 接入的三層結構

View UI Plus 的表單接入可以理解成三層：

```txt
iForm
  provide FormInstance
  -> FormItem
      inject FormInstance
      provide FormItemInstance
      -> Input / Select / Checkbox / ...
          mixins/form.js
          inject FormInstance / FormItemInstance
```

`iForm` 提供整個表單實例：

```js
provide () {
    return {
        FormInstance : this
    };
}
```

`FormItem` 注入 `FormInstance`，並向下提供自己：

```js
inject: ['FormInstance'],
provide () {
    return {
        FormItemInstance: this
    }
}
```

欄位元件透過 `mixins/form.js` 同時注入：

```js
inject: {
    FormInstance: {
        default: ''
    },
    FormItemInstance: {
        default: null
    }
}
```

這樣欄位元件就不用自己知道父層元件樹的具體形狀，只要混入 `form.js` 就能接入表單上下文。

---

## 4. `itemDisabled`：欄位 disabled 的共用計算

`form.js` 提供一個 computed：

```js
itemDisabled () {
    let state = this.disabled;
    if (!state && this.FormInstance) state = this.FormInstance.disabled;
    return state ? true : null;
}
```

它的語意是：

1. 先看欄位元件自己的 `disabled`。
2. 如果欄位自己沒有 disabled，再看上層 `FormInstance.disabled`。
3. 最後回傳 `true` 或 `null`。

這裡刻意回傳 `null`，註解中提到：

```js
// todo <a> can not set disabled: false
```

這表示它要避免在某些元素上產生 `disabled="false"` 這種不理想的 DOM attribute。對 UI 元件來說，attribute 是否存在有時比布林值本身更重要。

---

## 5. `handleFormItemChange()`：欄位事件回報契約

`form.js` 的第二個核心能力是：

```js
handleFormItemChange (type, data) {
    if (this.FormItemInstance) {
        if (type === 'blur') this.FormItemInstance.formBlur(data);
        else if (type === 'change') this.FormItemInstance.formChange(data);
    }
}
```

它把欄位元件的內部事件轉成 `FormItem` 可理解的驗證觸發點：

| 欄位事件 | mixin 呼叫 | FormItem 方法 | 常見用途 |
| --- | --- | --- | --- |
| blur | `handleFormItemChange('blur', value)` | `formBlur()` | 觸發 blur rule。 |
| change | `handleFormItemChange('change', value)` | `formChange()` | 觸發 change rule。 |

欄位元件不需要知道 `FormItem` 裡面如何用 `async-validator` 驗證，它只要在適當時機通報 `blur` 或 `change`。

---

## 6. 以 Input 為例

`Input` 混入：

```js
mixins: [ mixinsForm ]
```

在 blur 時：

```js
handleBlur (event) {
    this.$emit('on-blur', event);
    if (!findComponentUpward(this, ['DatePicker', 'TimePicker', 'Cascader', 'Search'])) {
        this.handleFormItemChange('blur', this.currentValue);
    }
}
```

在 value 更新時：

```js
setCurrentValue (value) {
    if (value === this.currentValue) return;
    this.currentValue = value;
    if (!findComponentUpward(this, ['DatePicker', 'TimePicker', 'Cascader', 'Search'])) {
        this.handleFormItemChange('change', value);
    }
}
```

這裡有一個重要細節：`Input` 會先用 `findComponentUpward()` 判斷自己是否包在 `DatePicker`、`TimePicker`、`Cascader`、`Search` 裡。這代表同一個 Input 在複合元件內使用時，不一定要直接回報 FormItem，避免驗證觸發時機重複或錯位。

---

## 7. FormItem 才是真正執行驗證的一層

`FormItem` 提供：

```js
formBlur () {
    this.onFieldBlur();
},
formChange () {
    this.onFieldChange();
}
```

再往下會呼叫：

```js
validate('blur')
validate('change')
```

驗證完成後，`FormItem` 會向 `Form` 發出：

```js
this.FormInstance.$emit('on-validate', this.prop, !errors, this.validateMessage || null);
```

所以整個事件鏈可以整理成：

```txt
Input blur/change
  -> mixins/form.js handleFormItemChange()
    -> FormItem.formBlur() / FormItem.formChange()
      -> FormItem.validate(trigger)
        -> async-validator
        -> FormInstance emit on-validate
```

---

## 8. 這個 mixin 的設計意義

`form.js` 把欄位元件與 FormItem 的互動壓成兩件事：

1. disabled 狀態繼承。
2. blur / change 驗證事件回報。

這讓每個欄位元件不用重複寫：

```js
inject FormInstance
inject FormItemInstance
computed disabled from form
call form item validation methods
```

對元件庫來說，這是很實用的復用方式。缺點是欄位元件會隱性依賴 `FormItemInstance` 的方法名稱，例如 `formBlur`、`formChange`。如果 FormItem 改名，所有欄位都會受影響。

---

## 9. 讀碼提醒

讀任何欄位元件時，只要看到：

```js
mixins: [ mixinsForm ]
```

就要補上以下心智模型：

```txt
這個元件可能會：
  -> 受到 Form disabled 影響
  -> 在 blur / change 時通知 FormItem
  -> 被 FormItem 的 validation trigger 控制
```

接著再檢查它實際在哪些方法中呼叫 `handleFormItemChange()`。不同欄位元件的觸發時機可能不同，這才是各元件差異所在。

---

## 10. 本章結論

`mixins/form.js` 是 View UI Plus 欄位元件接入 Form 系統的最小契約。

它本身不做驗證、不管理 rules、不存錯誤訊息，而是把欄位元件和 `FormItem` 接起來：

```txt
欄位元件只負責回報事件
FormItem 負責解讀事件並驗證
Form 負責收集 field 與提供全域表單設定
```

這種分工是後續深入 `09-form-system/` 時最重要的基礎。
