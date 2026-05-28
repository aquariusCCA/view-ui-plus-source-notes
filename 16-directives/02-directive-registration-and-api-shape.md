# 指令註冊與 API 形狀

## 學習目標

這篇分析 View UI Plus 如何把內建指令掛到 Vue app，以及指令名稱、binding value、arg、modifier 如何共同形成 API。

讀完後，要能從 `src/index.js` 看出哪些指令會變成使用者可直接使用的 `v-xxx`，也能判斷一個新指令應該設計成值、參數還是 modifier。

## 對照源碼

- `01-origin/source/view-ui-plus-v1.3.20/src/index.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/directives/style.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/directives/resize.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/directives/line-clamp.js`

## 全域指令表

`src/index.js` 先匯入指令：

```js
import lineClamp from './directives/line-clamp';
import resize from './directives/resize';
import style from './directives/style';
```

再整理成一張 `directives` 表：

```js
const directives = {
    display: style.display,
    width: style.width,
    height: style.height,
    margin: style.margin,
    padding: style.padding,
    font: style.font,
    color: style.color,
    'bg-color': style.bgColor,
    resize,
    'line-clamp': lineClamp
};
```

這張表就是全量安裝時的公開指令清單。

## 註冊流程

`install(app)` 內逐一註冊：

```js
Object.keys(directives).forEach(key => {
    app.directive(key, directives[key]);
});
```

註冊後，模板可使用：

```vue
<div v-width="120" />
<div v-bg-color="'#f5f5f5'" />
<div v-resize="onResize" />
<p v-line-clamp="2">...</p>
```

Vue 會把 `v-bg-color` 對應到註冊名 `bg-color`，把 `v-line-clamp` 對應到註冊名 `line-clamp`。

## 指令 API 的三個入口

一個 directive 的模板 API 主要由三個部分組成：

| 部分 | 範例 | 適合承載 |
| --- | --- | --- |
| value | `v-width="120"` | 主要資料或 callback |
| arg | `v-click-outside:[capture]="close"` | 單一可變參數 |
| modifiers | `v-click-outside.mousedown.stop="close"` | 布林選項、事件類型、行為開關 |

View UI Plus 的公開樣式指令大多只使用 value，因為它們只需要一個值。進階 click outside 則使用 arg 與 modifiers，因為它要同時描述 capture、事件類型、`stop`、`prevent`。

## API 要保持模板可讀

指令名稱應該描述行為，而不是描述實作。

好的方向：

```vue
<p v-line-clamp="2" />
<div v-resize="handleResize" />
```

不好的方向：

```vue
<p v-webkit-box-orient="'vertical'" />
<div v-element-resize-detector="handleResize" />
```

使用者需要的是能力，不是底層套件名稱。

## 全域與局部註冊

`style`、`resize`、`line-clamp` 透過插件全域註冊，代表它們是 View UI Plus 願意公開的工具型能力。

click outside 則常在元件內局部註冊：

```js
import clickOutside from '../../directives/clickoutside';

export default {
    directives: { clickOutside }
};
```

這種方式讓元件內部可以使用 DOM 行為，但不一定把它變成使用者公共 API。元件庫設計時，要避免把所有內部工具都暴露成全域能力。

## 指令名稱設計

命名時要注意：

- 註冊名不要加 `v-`，使用時才會變成 `v-name`。
- 多字名稱用 kebab-case，例如 `line-clamp`、`bg-color`。
- 指令名稱應該穩定，因為模板 API 改名就是 breaking change。
- 內部局部指令可以比較具體，全域公開指令要更克制。

## 型別與文件

Vue directive 本身不像 component props 那樣自然產出完整型別提示，所以文件要更明確描述：

- value 支援哪些型別。
- `0`、`false`、空字串是否有效。
- arg 的語意。
- modifier 的語意。
- callback 何時被呼叫。
- 指令是否會操作 DOM、註冊事件或建立 observer。

例如 `v-resize` 的 value 應該是函式；`v-line-clamp` 的 value 應該是行數；`v-width` 的 value 在目前實作中比較適合傳 number 或百分比字串。

## 最小模仿

```js
const directives = {
    focus: {
        mounted(el) {
            el.focus();
        }
    },
    permission: {
        mounted(el, binding) {
            if (!binding.value) {
                el.style.display = 'none';
            }
        },
        updated(el, binding) {
            el.style.display = binding.value ? '' : 'none';
        }
    }
};

export const install = (app) => {
    Object.keys(directives).forEach((name) => {
        app.directive(name, directives[name]);
    });
};
```

這段示範了全域指令表和集中註冊方式。真正的權限指令還要補上可訪問性、卸載清理與狀態更新策略。

## 複習題

1. `v-bg-color` 為什麼對應到註冊名 `bg-color`？
2. value、arg、modifier 分別適合放什麼資訊？
3. 為什麼 click outside 可以局部註冊，而不一定要全域註冊？
4. 指令名稱改名為什麼是 breaking change？
5. 設計 `v-copy` 時，你會把要複製的文字放在 value、arg 還是 modifier？
