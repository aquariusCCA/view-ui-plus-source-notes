# Tag State Events And Control Boundary：選取、關閉與外部控制

## 0. 原始筆記問題分析

原本筆記已經指出要整理關閉與選取事件，但還沒有把 `checked`、`isChecked`、watcher、root click、close icon click 與外部控制責任串成完整流程。

`Tag` 的事件模型很小，但很容易誤解：

```txt
closable 不會自動刪除
checkable 不等於 v-model
checked 不是唯一資料來源
name 只改變事件 payload
```

本章會專門處理這些控制邊界。

## 1. 本章定位

本章是一篇狀態與事件筆記，專門分析 `Tag` 如何處理選中狀態、關閉意圖與事件輸出。

本章不深入講顏色與 less 規則。視覺對照請看 `03-render-class-and-color-system.md`。

## 2. 狀態模型

`Tag` 的內部狀態只有一個：

```js
data () {
    return {
        isChecked: this.checked
    };
}
```

它由 `checked` prop 初始化。預設 `checked` 是 `true`，所以普通 Tag 一開始會帶有：

```txt
ivu-tag-checked
```

當外部傳入的 `checked` 改變時，watcher 會同步內部狀態：

```js
watch: {
    checked (val) {
        this.isChecked = val;
    }
}
```

這是一種「prop 初始化 + watcher 同步 + 內部可修改」的模型，不是 Vue 3 標準 `v-model`。

## 3. 選取流程

root 節點綁定：

```vue
<div @click.stop="check">
```

點擊根節點時會進入 `check()`：

```js
check () {
    if (!this.checkable) return;
    const checked = !this.isChecked;
    this.isChecked = checked;
    if (this.name === undefined) {
        this.$emit('on-change', checked);
    } else {
        this.$emit('on-change', checked, this.name);
    }
}
```

這段流程可以拆成四步。

1. 如果 `checkable` 是 false，直接結束。
2. 如果 `checkable` 是 true，反轉目前的 `isChecked`。
3. 立即把反轉後的值寫回內部狀態。
4. emit `on-change`，有 `name` 時多帶一個識別值。

因此 `checkable` 是互動開關，`checked` 是狀態輸入，兩者不是同一件事。

## 4. `on-change` Payload

`on-change` 的 payload 由 `name` 是否存在決定。

| 使用方式 | emit payload | 外部 handler 形狀 |
| --- | --- | --- |
| `<Tag checkable />` | `checked` | `handleChange(checked)` |
| `<Tag checkable name="a" />` | `checked, 'a'` | `handleChange(checked, name)` |
| `<Tag checkable :name="0" />` | `checked, 0` | `handleChange(checked, name)` |

runtime 使用的是：

```js
this.name === undefined
```

所以 `name={0}`、`name=""` 都會被視為有 name，仍會放進 payload。這對列表索引或數字 id 很重要。

## 5. 關閉流程

close icon 綁定：

```vue
<Icon v-if="closable" @click.stop="close"></Icon>
```

點擊 close icon 時會進入 `close(event)`：

```js
close (event) {
    if (this.name === undefined) {
        this.$emit('on-close', event);
    } else {
        this.$emit('on-close', event, this.name);
    }
}
```

這段流程只 emit 事件，沒有任何內部狀態修改，也沒有把自己從 DOM 移除。

官方 example 的單顆關閉是外部控制：

```vue
<Tag v-if="show" closable @on-close="handleClose">标签三</Tag>
```

```js
handleClose () {
    this.show = false;
}
```

列表關閉也是外部控制：

```js
handleClose2 (event, name) {
    const index = this.count.indexOf(name);
    this.count.splice(index, 1);
}
```

這就是 `Tag` 的控制邊界：它只通知關閉意圖，不擁有列表資料。

## 6. `on-close` Payload

`on-close` 的 payload 也由 `name` 是否存在決定。

| 使用方式 | emit payload | 外部 handler 形狀 |
| --- | --- | --- |
| `<Tag closable />` | `event` | `handleClose(event)` |
| `<Tag closable name="a" />` | `event, 'a'` | `handleClose(event, name)` |
| `<Tag closable :name="0" />` | `event, 0` | `handleClose(event, name)` |

第一個參數是 click event，不是 checked 值。這和 `on-change` 不同。

## 7. Close 與 Check 的事件隔離

root click 使用：

```vue
@click.stop="check"
```

close icon click 也使用：

```vue
@click.stop="close"
```

這代表兩個效果。

第一，點擊 Tag 根節點不會把 click 繼續冒泡到外層。這讓 Tag 在列表或篩選區中比較像一個獨立互動單元。

第二，點擊 close icon 不會冒泡回 root，所以 `closable + checkable` 同時存在時，點關閉不會順便切換選中狀態。

這是 `Tag` 事件設計裡最重要的小細節。

## 8. 受控與非受控用法

### 8.1 非受控式 checkable

輸入：

```vue
<Tag checkable>Label</Tag>
```

這種用法不綁定 `checked`。Tag 會用預設 `checked=true` 初始化，之後每次點擊都自行切換 `isChecked`，並 emit `on-change`。

外部可以聽事件，但不一定要回寫狀態。

### 8.2 類受控式 checked

輸入：

```vue
<Tag :checked="checked" checkable @on-change="checked = $event">Label</Tag>
```

這種用法把外部資料當成主要狀態來源。Tag 點擊後會先改內部 `isChecked`，再 emit `on-change`。外部收到事件後更新 `checked`，watcher 再把 prop 值同步回內部。

它看起來像受控元件，但不是標準 `v-model`，因為事件名稱不是 `update:checked` 或 `update:modelValue`。

### 8.3 外部強制同步

官方 example 中有：

```vue
<Tag :checked="checked" checkable>test</Tag>
<Button @click="toggle">Toggle</Button>
```

外部按鈕改變 `checked` 後，watcher 會讓 Tag 的 `isChecked` 跟著變。這證明 `checked` prop 是可以從外部重新同步內部狀態的。

## 9. Consumer：TagSelectOption

`TagSelectOption` 把 `Tag` 包成可選項：

```vue
<Tag checkable :checked="checked" @on-change="handleChange" :color="color" v-bind="tagProps">
    <slot></slot>
</Tag>
```

它收到 `on-change` 後：

```js
handleChange (checked) {
    this.checked = checked;
    this.TagSelectInstance.handleChangeTag(this.name);
}
```

這裡可以看到清楚分工：

| 層次 | 責任 |
| --- | --- |
| `Tag` | 切換單顆標籤，emit `on-change`。 |
| `TagSelectOption` | 保存自己的 checked，通知 `TagSelect` 哪個 name 改變。 |
| `TagSelect` | 收集所有 option，更新 `modelValue`，處理全選與展開。 |

也就是說，列表狀態不屬於 `Tag` 本體。`Tag` 只是一顆可互動標籤。

## 10. 邊界與注意事項

| 情境 | 閱讀提醒 |
| --- | --- |
| `closable` without `on-close` | close icon 會出現，但點擊只 emit；沒有人處理就不會消失。 |
| `checkable=false` 且 `checked=false` | 不能點擊切換，但仍可能呈現未選中樣式。 |
| `closable + checkable` | close icon click 不會觸發 root check，因為 icon click 使用 `.stop`。 |
| `name=0` | 在 `Tag` 本身會被視為有效 name，因為判斷是 `name === undefined`。 |
| 外部綁定 `checked` 但不更新 | Tag 會先內部切換；之後若外部 prop 再變動，watcher 會覆蓋內部狀態。 |

## 11. 本章總結

`Tag` 的狀態與事件模型可以用一句話概括：`Tag` 管單顆標籤的即時互動，外部管資料來源與是否移除。

`checkable` 開啟選取互動，`checked` 提供初始與外部同步狀態，`on-change` 回報新狀態；`closable` 開啟 close icon，`on-close` 回報關閉意圖。`name` 則讓列表場景能識別是哪一顆 Tag 發生事件。

## 12. 自我檢查問題

1. `isChecked` 在什麼時候初始化？又在什麼時候被外部 prop 同步？
2. `checkable=false` 時，點擊 root 會發生什麼？
3. `on-change` 第一個參數是什麼？`on-close` 第一個參數又是什麼？
4. 為什麼 `closable` 不代表 Tag 會自動消失？
5. `closable + checkable` 時，為什麼點 close icon 不會切換 checked？
6. `TagSelectOption` 如何證明列表選取狀態不屬於 `Tag` 本體？
