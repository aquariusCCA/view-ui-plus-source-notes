# 完整安裝與按需引入

## 學習目標

這篇比較 View UI Plus 的完整安裝和按需引入。重點是理解同一個入口如何同時支援 `app.use(ViewUIPlus)` 與 `import { Button } from 'view-ui-plus'`。

## 對照源碼

- `01-origin/source/view-ui-plus-v1.3.20/src/index.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/index.js`
- 各元件目錄下的 `index.js`

## 完整安裝

完整安裝寫法：

```js
import ViewUIPlus from 'view-ui-plus';

app.use(ViewUIPlus);
```

這會執行 `install`，並做完：

- 註冊全部元件。
- 註冊全部內建指令。
- 寫入 `$VIEWUI`。
- 寫入 `$Message`、`$Modal`、`$Loading` 等服務。
- 寫入 `$Date`。

優點是快速、簡單、適合原型或後台系統。缺點是所有能力都被接進 app，使用邊界較粗。

## 按需引入

按需引入依賴入口的具名匯出：

```js
import { Button, Table } from 'view-ui-plus';

app.component('Button', Button);
app.component('Table', Table);
```

`src/index.js` 的這行是關鍵：

```js
export * from './components';
```

而 `src/components/index.js` 負責列出每個元件：

```js
export { default as Button } from './button';
export { default as Table } from './table';
```

## 差異比較

| 面向 | 完整安裝 | 按需引入 |
| --- | --- | --- |
| 入口 | `app.use(ViewUIPlus)` | `import { Button }` |
| 元件註冊 | 插件自動註冊全部 | 使用者自行註冊需要的元件 |
| 指令 | 插件自動註冊全部內建指令 | 不會自動取得插件指令，除非另行註冊 |
| 全域服務 | 自動掛 `$Message`、`$Modal` 等 | 不會因只匯入元件而自動掛全域服務 |
| 全域設定 | 自動建立 `$VIEWUI` | 若不執行 `install`，元件讀全域設定時要注意預設來源 |

## 實務判斷

使用完整安裝時，應該把它視為「整套 UI 框架接入」。適合：

- 專案大多數頁面都會使用這套元件庫。
- 需要 `$Message`、`$Modal`、內建指令等全域能力。
- 團隊重視一致性和開發速度。

使用按需引入時，應該把它視為「挑選單一元件」。適合：

- 只需要少量元件。
- 對 bundle size 比較敏感。
- 想讓每個元件來源更明確。

## 容易混淆的點

只做：

```js
import { Button } from 'view-ui-plus';
```

不等於執行了插件安裝。它只拿到 `Button` 這個元件物件，不會自動註冊全域指令，也不會建立 `$VIEWUI` 和 `$Message`。

## 最小模仿

```js
// components/index.js
export { default as Button } from './button';
export { default as Modal } from './modal';

// index.js
export * from './components';
import * as components from './components';

export const install = (app) => {
    Object.keys(components).forEach((name) => {
        app.component(name, components[name]);
    });
};

export default {
    install,
    ...components
};
```

## 複習題

1. 為什麼具名匯出不等於插件安裝？
2. 按需引入時，`$Message` 會自動存在嗎？
3. `export * from './components'` 和 `install` 之間是什麼關係？
