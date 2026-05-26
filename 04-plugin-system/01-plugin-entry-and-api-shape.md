# 插件入口與 API 形狀

## 學習目標

這篇先看 View UI Plus 的總入口如何設計。重點是理解 `src/index.js` 為什麼同時提供具名匯出、預設匯出、`install`、語系 API 與版本資訊。

## 對照源碼

- `01-origin/source/view-ui-plus-v1.3.20/src/index.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/index.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/locale/index.js`
- `01-origin/source/view-ui-plus-v1.3.20/package.json`

## API 形狀

`src/index.js` 做了兩件大事：

1. `export * from './components'`，把所有元件再匯出一次，支援按需引入。
2. `export default API`，提供可交給 `app.use()` 的完整插件物件。

入口最後整理成這個形狀：

```js
const API = {
    version,
    locale,
    i18n,
    install,
    lang,
    ...components
};

export default API;
```

這代表 View UI Plus 的預設匯出不是單純的 `install` 函式，而是一個帶有 `install` 方法的物件。Vue 3 在執行 `app.use(ViewUIPlus, opts)` 時，會找到這個物件上的 `install` 並呼叫它。

## 具名匯出與預設匯出的差異

具名匯出服務於「只拿我需要的東西」：

```js
import { Button, Modal } from 'view-ui-plus';
```

預設匯出服務於「整套安裝」：

```js
import ViewUIPlus from 'view-ui-plus';

app.use(ViewUIPlus);
```

這兩種入口共用同一批元件來源：`src/components/index.js`。這能避免完整安裝和按需引入維護兩份元件清單。

## 語系與版本 API

入口還匯出了：

- `version`：來自 `package.json`。
- `locale`：對外包裝 `localeFile.use`。
- `i18n`：對外包裝 `localeFile.i18n`。
- `lang(code)`：從全域載入語言包後切換。

這些 API 被放在同一個入口，讓使用者可以用一致的方式拿到插件能力：

```js
import ViewUIPlus, { locale, i18n } from 'view-ui-plus';
```

## 設計重點

- 元件庫入口通常同時服務完整安裝與按需匯入。
- Vue 插件只要暴露 `install`，就能被 `app.use()` 辨識。
- `API` 物件把安裝能力、元件清單與工具 API 包在一起，是元件庫常見設計。

## 最小模仿

```js
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

1. 為什麼 `export * from './components'` 對按需引入很重要？
2. `app.use()` 看到物件和看到函式時，Vue 會怎麼處理？
3. 如果預設匯出只放 `install`，使用體驗會少掉哪些能力？
