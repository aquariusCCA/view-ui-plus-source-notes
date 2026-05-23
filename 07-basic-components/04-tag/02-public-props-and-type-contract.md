# Tag Public Props And Type Contract：從 runtime props 到 TypeScript contract

## 0. 原始筆記問題分析

原本筆記已經指出要整理 `closable`、`checkable`、`color` 與事件，但還沒有把 runtime props、`.d.ts` 與事件 payload 放在同一張圖裡。

`Tag` 是很適合練習 public contract 對照的元件，因為它同時包含：

1. Boolean props 控制互動能力。
2. validator props 控制有限視覺類型。
3. `color` 這種 runtime 比 type declaration 更寬的 prop。
4. `name` 這種不影響畫面，但會改變事件 payload 的 prop。
5. `checked` 這種看起來像受控值，但 runtime 仍有內部狀態的 prop。

## 1. 本章定位

本章是一篇 public API 對照筆記，專門分析 `Tag` 對外可以接收哪些 props，以及這些 props 在 runtime source 和 `.d.ts` 中是否一致。

本章不深入講 DOM 結構與顏色實作。render、class、style 會放到 `03-render-class-and-color-system.md`，事件流程會放到 `04-state-events-and-control-boundary.md`。

## 2. Runtime Props 對照表

`tag.vue` 自身宣告的 props 如下。

| Runtime prop | Runtime 限制 / default | Type declaration | 閱讀重點 |
| --- | --- | --- | --- |
| `closable` | `Boolean`，預設 `false` | `boolean` | 決定是否渲染 close `Icon`，不負責自動刪除元件。 |
| `checkable` | `Boolean`，預設 `false` | `boolean` | 決定根節點 click 是否能切換 `isChecked`。 |
| `checked` | `Boolean`，預設 `true` | `boolean` | 初始化並同步內部 `isChecked`，但不是 `v-model`。 |
| `color` | `String`，預設 `default` | 內建色 union | runtime 可接收任意字串，自定義色會走 inline style。 |
| `type` | validator：`border`、`dot` | 空字串、`border`、`dot` | runtime 未提供 default；不填時走普通 tag 樣式。 |
| `name` | `String` 或 `Number` | `string` 或 `number` | 不影響畫面，主要用來讓事件帶回識別值。 |
| `size` | validator：`default`、`medium`、`large`，預設 `default` | `string` | runtime 限制較窄，declaration 較寬。 |

這張表最重要的是：`Tag` 的 public contract 不只回答「有哪些 props」，還要回答「這個 prop 影響畫面、狀態，還是事件 payload」。

## 3. Props 分組理解

`Tag` 的 props 可以分成四組。

| 分組 | Props | 責任 |
| --- | --- | --- |
| 互動能力 | `closable`、`checkable` | 開啟 close icon 或 click-to-check 行為。 |
| 狀態輸入 | `checked` | 提供初始與外部同步的選中狀態。 |
| 視覺輸入 | `color`、`type`、`size` | 影響 class、inline style 與 less 視覺分支。 |
| 事件識別 | `name` | 讓 `on-change` / `on-close` 帶回列表項識別值。 |

這個分組比單純照 props 順序背誦更有用。閱讀 `Tag` 的 computed 和 methods 時，可以把每個 prop 放回它真正負責的層次。

## 4. `color` Contract 的落差

runtime 中有兩份顏色清單：

```js
const initColorList = ['default', 'primary', 'success', 'warning', 'error', 'blue', 'green', 'red', 'yellow', 'pink', 'magenta', 'volcano', 'orange', 'gold', 'lime', 'cyan', 'geekblue', 'purple'];
const colorList = ['pink', 'magenta', 'volcano', 'orange', 'gold', 'lime', 'cyan', 'geekblue', 'purple'];
```

`initColorList` 用來判斷某個 color 是否是內建色。內建色會產生：

```txt
ivu-tag-{color}
```

如果不是內建色，runtime 會把它當成自定義 CSS color，透過 inline style 處理背景、邊框、文字或 dot 顏色。

但 `types/tag.d.ts` 的 `color` 只寫成內建色 union，沒有寫成：

```ts
color?: BuiltInColor | string
```

這代表 type declaration 比 runtime 窄。官方註解寫了可以自定義顏色值，但 TypeScript union 沒有完整表達這件事。閱讀時要以 runtime 行為為準，再把 `.d.ts` 視為 public typing 的近似描述。

## 5. `type` Contract 的落差

runtime `type` 只有 validator：

```js
validator (value) {
    return oneOf(value, ['border', 'dot']);
}
```

它沒有 default。不傳 `type` 時，`this.type` 是 `undefined`，元件走普通 Tag 分支。

`.d.ts` 則寫：

```ts
type?: '' | 'border' | 'dot';
```

這裡的空字串比較像 public typing 為了容納 template 寫法或歷史 API 留下的寬鬆值；runtime validator 本身只接受 `border` 與 `dot`。實際閱讀 source 時，應以「不傳 type」作為普通樣式分支，而不是把空字串當成一個有獨立語意的 runtime type。

## 6. `size` Contract 的落差

runtime `size` 限制：

```txt
default / medium / large
```

預設值是 `default`。

`.d.ts` 則是：

```ts
size?: string;
```

這代表 declaration 比 runtime 寬。TypeScript 不會阻止使用者傳入任意字串，但 runtime validator 只接受三個值。讀筆記時要把兩層分清楚：

| 層次 | 負責回答 |
| --- | --- |
| Runtime validator | 實際允許哪些值不產生 Vue validator warning。 |
| Type declaration | TypeScript 使用者在編譯期看到的 public surface。 |

## 7. 事件 Listener Contract

`tag.vue` 宣告：

```js
emits: ['on-change', 'on-close']
```

`.d.ts` 則用 Vue listener prop 的形式表達：

```ts
onOnClose?: (event?: any) => any;
onOnChange?: (event?: any) => any;
```

這裡要注意兩件事。

第一，`onOnChange` / `onOnClose` 是 Vue typing 中對 `on-change` / `on-close` listener 的命名表達，不是普通使用者會在 template 中手寫的 prop 名稱。

第二，`.d.ts` 的 `(event?: any) => any` 很寬，沒有完整描述 runtime payload。真正 payload 要看 methods。

## 8. Runtime Event Payload

`close(event)` 的 payload 取決於 `name` 是否為 `undefined`。

| 條件 | emit |
| --- | --- |
| `name === undefined` | `this.$emit('on-close', event)` |
| `name !== undefined` | `this.$emit('on-close', event, this.name)` |

`check()` 的 payload 也取決於 `name`。

| 條件 | emit |
| --- | --- |
| `name === undefined` | `this.$emit('on-change', checked)` |
| `name !== undefined` | `this.$emit('on-change', checked, this.name)` |

這表示 `name` 的主要價值是在列表場景中讓外部知道哪一顆 Tag 被關閉或切換。例如官方 example 中：

```vue
<Tag v-for="item in count" :key="item" :name="item" closable @on-close="handleClose2">
    标签{{ item + 1 }}
</Tag>
```

外部收到 `name` 後，才能從 `count` 陣列中移除對應項。

## 9. `checked` 不是 `v-model`

`Tag` 的 `checked` prop 容易被誤解成完整受控模型，但 runtime 並沒有：

```txt
modelValue
update:modelValue
```

它實際上是：

```js
data () {
    return {
        isChecked: this.checked
    };
},
watch: {
    checked (val) {
        this.isChecked = val;
    }
}
```

點擊時，`Tag` 會先改自己的 `isChecked`，再 emit `on-change`。如果外部也綁定 `checked`，外部需要自己在 `on-change` 裡更新傳入值，才能讓資料來源與畫面長期一致。

## 10. 常見誤區

| 誤區 | 正確理解 |
| --- | --- |
| `closable` 會讓 Tag 點擊後自動消失 | `closable` 只渲染 close icon 並 emit `on-close`，是否移除由外部決定。 |
| `checkable` 等於外部受控選取 | `checkable` 只是允許內部 click 切換 `isChecked`。 |
| `checked` 等於 `v-model` | `Tag` 沒有 `modelValue` / `update:modelValue`。 |
| `.d.ts` 沒允許自定義 color，所以 runtime 不支援 | runtime 支援任意字串 color，自定義色走 inline style。 |
| `name` 是顯示文字 | 顯示文字來自 default slot；`name` 主要用於事件識別。 |
| `size?: string` 代表任何 size 都有樣式 | runtime validator 與 less 主要只支援 `default`、`medium`、`large`。 |

## 11. 本章總結

`Tag` 的 public contract 要同時看 runtime props、`.d.ts` 與 methods。`closable`、`checkable`、`checked` 建立互動模型；`color`、`type`、`size` 建立視覺模型；`name` 建立事件識別模型。

最值得記住的是兩個落差：自定義 `color` 是 runtime 支援但 type declaration 沒完整表達；`checked` 能同步外部 prop，但它不是 Vue 3 標準的 `v-model` contract。

## 12. 自我檢查問題

1. `closable` 和 `checkable` 分別開啟什麼行為？
2. `checked` 如何進入內部狀態？之後又如何被外部 prop 同步？
3. `name` 不影響畫面，為什麼仍是重要 public prop？
4. `color` 的 runtime contract 和 `.d.ts` 有什麼落差？
5. `size` 的 runtime validator 和 `.d.ts` 有什麼落差？
6. `on-change` 在有 `name` 和沒有 `name` 時 payload 分別是什麼？
