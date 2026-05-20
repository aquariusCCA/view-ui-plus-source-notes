# Locale Plugin Contract

本篇說明 View UI Plus plugin 和 locale/i18n 的 runtime contract。核心 source 是 `01-origin/source/view-ui-plus-v1.3.20/src/index.js` 中的 `localeFile` import、install options handling、`locale` / `i18n` / `lang` exports。

## 1. Locale Source

`src/index.js` 引入：

```js
import localeFile from './locale/index';
```

plugin layer 使用 `localeFile` 的三種能力：

| Runtime API | Source behavior |
| --- | --- |
| install option `locale` | `localeFile.use(opts.locale)` |
| install option `i18n` | `localeFile.i18n(opts.i18n)` |
| named export `locale` | `export const locale = localeFile.use` |
| named export `i18n` | `export const i18n = localeFile.i18n` |

## 2. Install-Time Locale Setup

`install(app, opts)` 會先處理 locale，再註冊 components 和 directives：

```js
if (opts.locale) {
    localeFile.use(opts.locale);
}
if (opts.i18n) {
    localeFile.i18n(opts.i18n);
}
```

這代表使用者可以在安裝 plugin 時設定語系與翻譯 adapter：

```js
app.use(ViewUIPlus, {
    locale,
    i18n
});
```

此設定發生在 component registration 前，讓後續 component runtime 可以讀到已設定的 locale 狀態。

## 3. Named Locale APIs

除了 install options，package 也暴露：

```js
export const locale = localeFile.use;
export const i18n = localeFile.i18n;
```

這提供 module-level 控制方式：

```js
import { locale, i18n } from 'view-ui-plus';

locale(langObject);
i18n(translateFn);
```

## 4. lang(code)

`lang(code)` 是另一個 named export：

```js
export const lang = (code) => {
    const langObject = window['viewuiplus/locale'].default;
    if (code === langObject.i.locale) localeFile.use(langObject);
    else console.log(`The ${code} language pack is not loaded.`);
};
```

這個 API 依賴 runtime global：

```txt
window['viewuiplus/locale'].default
```

因此 `lang(code)` 的 contract 是：

- 頁面必須已載入對應的 locale bundle。
- locale bundle 需要把語系物件放在 `window['viewuiplus/locale'].default`。
- 傳入的 `code` 必須等於 `langObject.i.locale`。
- 不符合時只輸出 console message，不 throw error。

## 5. Build Relationship

`lang(code)` 和 `dist/locale/*` 這類 build artifact 有關，但本篇只記 runtime contract。locale bundle 如何被建置，應放到 `14-build-release/`。

## 6. Type Surface

`types/index.d.ts` 的 `ViewUIPlusInstallOptions` 包含：

```ts
interface ViewUIPlusInstallOptions extends ViewUIPlusGlobalOptions {
    locale?: any;
    i18n?: any;
}
```

目前 locale 與 i18n 都是 `any`，所以型別沒有描述 locale object 或 i18n function 的精確 shape。若後續補型別，應從 `src/locale/` 的實作與 locale bundles 回推。

## Related Notes

- `04-plugin-system/01-install-flow.md`
- `04-plugin-system/07-runtime-type-contract.md`
- `14-build-release/`
- `20-supplements/`
