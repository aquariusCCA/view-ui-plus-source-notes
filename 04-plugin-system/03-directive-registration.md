# Directive Registration

本篇說明 View UI Plus plugin 如何註冊全域 directives。核心 source 是 `01-origin/source/view-ui-plus-v1.3.20/src/index.js` 的 directive imports、`directives` map 與 `app.directive` loop。

## 1. Directive Imports

`src/index.js` 從三個檔案引入 directive 實作：

```js
import lineClamp from './directives/line-clamp';
import resize from './directives/resize';
import style from './directives/style';
```

plugin layer 不直接實作 directive 行為，而是決定哪些 directive 會被註冊到 Vue app，以及註冊名稱是什麼。

## 2. Directives Map

`directives` map 定義 plugin 對外暴露的 directive names：

| Registered name | Source |
| --- | --- |
| `display` | `style.display` |
| `width` | `style.width` |
| `height` | `style.height` |
| `margin` | `style.margin` |
| `padding` | `style.padding` |
| `font` | `style.font` |
| `color` | `style.color` |
| `bg-color` | `style.bgColor` |
| `resize` | `resize` |
| `line-clamp` | `lineClamp` |

在 Vue template 中，這些通常會以 `v-*` 形式使用，例如：

```vue
<div v-resize="onResize" />
<p v-line-clamp="2" />
<span v-color="'#333'" />
```

## 3. Registration Loop

install 時執行：

```js
Object.keys(directives).forEach(key => {
    app.directive(key, directives[key]);
});
```

所以 directive 的 public name 就是 `directives` map 的 key。特別要注意 `bg-color` 與 `line-clamp` 這類 kebab-case key，這些名稱是 plugin layer 定義的對外 contract。

## 4. Plugin Responsibility

plugin system 在 directives 上只負責三件事：

- 決定 directive 實作從哪裡 import。
- 決定 directive 的 public registration name。
- 在 `install()` 期間把 directive 掛到 Vue app。

directive 的生命週期 hooks、DOM 操作、參數格式與錯誤處理，不屬於本章，應放到 `11-directives/`。

## 5. Source Checklist

維護這篇時應核對：

- `src/index.js` 的 directive imports 是否改變。
- `directives` map 是否新增、移除或改名。
- `app.directive` loop 是否仍在 install 內執行。
- `types/` 是否有任何 directive 相關型別補充；目前主要 contract 在 runtime registration。

## Related Notes

- `04-plugin-system/01-install-flow.md`
- `11-directives/`
- `12-style-system/`
