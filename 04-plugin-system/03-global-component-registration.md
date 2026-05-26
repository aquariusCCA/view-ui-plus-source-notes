# 全域元件註冊

## 學習目標

這篇聚焦完整安裝時的元件註冊。重點是看懂 `components/index.js` 如何提供元件清單，以及 `src/index.js` 為什麼又建立一個 `ViewUI` 物件。

## 對照源碼

- `01-origin/source/view-ui-plus-v1.3.20/src/components/index.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/index.js`
- 各元件目錄下的 `index.js`

## 元件清單來源

`src/components/index.js` 是全元件匯出表：

```js
export { default as Button } from './button';
export { default as Modal } from './modal';
export { default as Table } from './table';
// ...
```

這份清單同時支援兩種場景：

- 入口 `src/index.js` 可以 `import * as components from './components'`。
- 使用者可以從套件根入口具名匯入元件。

## ViewUI 物件

`src/index.js` 不是直接註冊 `components`，而是先組成 `ViewUI`：

```js
const ViewUI = {
    ...components,
    iButton: components.Button,
    iInput: components.Input,
    iTable: components.Table
};
```

這樣做有兩個效果：

- 原始元件名如 `Button`、`Input`、`Table` 會被註冊。
- 舊版或避免命名衝突的別名如 `iButton`、`iInput`、`iTable` 也會被註冊。

## 註冊流程

完整安裝時會跑：

```js
Object.keys(ViewUI).forEach(key => {
    app.component(key, ViewUI[key]);
});
```

Vue 會把這些名字註冊到目前 app 的全域元件表。註冊後，該 app 底下所有元件模板都能直接使用。

## 命名觀察

View UI Plus 同時註冊 `Button` 與 `iButton`，表示它在兼顧兩種使用習慣：

- 新使用者可以用一般元件名。
- 舊專案或需要避免原生標籤衝突的地方，可以用 `i` 前綴。

這也是元件庫在演進時常見的相容策略。

## 風險與取捨

完整安裝很方便，但代價是：

- 所有元件都會進入全域註冊流程。
- 模板中元件來源比較不明確。
- 對 bundle size 與 tree-shaking 的期待，要看建置工具與實際匯入方式。

按需引入能降低這些成本，但需要使用者自己註冊或依賴自動匯入工具。

## 最小模仿

```js
import * as components from './components';

const MyUI = {
    ...components,
    MyButton: components.Button
};

export const install = (app) => {
    Object.keys(MyUI).forEach((name) => {
        app.component(name, MyUI[name]);
    });
};
```

## 複習題

1. `components/index.js` 為什麼適合當作全域註冊清單？
2. `iButton` 這類別名解決了什麼相容問題？
3. 完整安裝和按需引入的取捨是什麼？
