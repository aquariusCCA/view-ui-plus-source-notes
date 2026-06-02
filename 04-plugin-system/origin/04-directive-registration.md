# 全域指令註冊

## 學習目標

這篇分析 View UI Plus 如何把內建指令掛到 Vue app。重點是理解指令和元件一樣，也能在插件 `install` 階段集中註冊。

## 對照源碼

- `01-origin/source/view-ui-plus-v1.3.20/src/index.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/directives/style.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/directives/resize.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/directives/line-clamp.js`

## 指令表

`src/index.js` 先匯入指令模組：

```js
import lineClamp from './directives/line-clamp';
import resize from './directives/resize';
import style from './directives/style';
```

再整理成 `directives`：

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

這份表決定完整安裝後會有哪些全域指令。

## 註冊流程

安裝時逐一呼叫：

```js
Object.keys(directives).forEach(key => {
    app.directive(key, directives[key]);
});
```

註冊後，模板中可使用：

```vue
<div v-width="120" />
<div v-bg-color="'#f5f5f5'" />
<div v-resize="onResize" />
<p v-line-clamp="2">...</p>
```

Vue 會把 `v-width` 對應到註冊名 `width`，把 `v-bg-color` 對應到註冊名 `bg-color`。

## style 指令的設計

`style.js` 把多個樣式型指令放在同一個模組內，例如：

- `display`
- `width`
- `height`
- `margin`
- `padding`
- `font`
- `color`
- `bgColor`

每個指令都實作 Vue 3 指令生命週期，如 `mounted`、`updated`、`unmounted`。例如 `width` 會在掛載和更新時寫入 `el.style.width`，卸載時清掉樣式。

## 設計重點

- 指令適合封裝直接操作 DOM 的行為。
- 插件安裝時集中註冊指令，使用者不需要在每個元件局部註冊。
- 多個小型樣式指令可以放在同一個模組，再由入口拆成不同註冊名。

## 最小模仿

```js
const directives = {
    focus: {
        mounted(el) {
            el.focus();
        }
    },
    color: {
        mounted(el, binding) {
            el.style.color = binding.value;
        },
        updated(el, binding) {
            el.style.color = binding.value;
        }
    }
};

export const install = (app) => {
    Object.keys(directives).forEach((name) => {
        app.directive(name, directives[name]);
    });
};
```

## 複習題

1. 指令為什麼適合放在插件 `install` 內集中註冊？
2. `v-bg-color` 為什麼對應到註冊名 `bg-color`？
3. 樣式型指令在 `unmounted` 清理樣式有什麼好處？
