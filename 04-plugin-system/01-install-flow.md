# Install Flow

本篇追蹤 View UI Plus 作為 Vue plugin 被安裝時的完整流程。核心 source 是 `01-origin/source/view-ui-plus-v1.3.20/src/index.js`，特別是 `install(app, opts)`。

## 1. Entry Point

使用者通常透過 Vue 的 plugin API 安裝：

```js
import ViewUIPlus from 'view-ui-plus';

app.use(ViewUIPlus, options);
```

在 runtime 裡，default export 是 `API` object，內含：

- `version`
- `locale`
- `i18n`
- `install`
- `lang`
- `...components`

因此 `app.use(ViewUIPlus, options)` 最終會呼叫 `API.install(app, options)`。

## 2. Install Sequence

`install(app, opts = {})` 的流程可以分成六段：

```txt
install(app, opts)
  -> guard repeated install
  -> apply locale / i18n options
  -> register global components
  -> register global directives
  -> write $VIEWUI global config
  -> write imperative APIs and $Date
```

對應 source：

| Step | Source behavior |
| --- | --- |
| 防重複安裝檢查 | `if (install.installed) return` |
| locale | `opts.locale` 時呼叫 `localeFile.use(opts.locale)` |
| i18n | `opts.i18n` 時呼叫 `localeFile.i18n(opts.i18n)` |
| components | `Object.keys(ViewUI).forEach(key => app.component(key, ViewUI[key]))` |
| directives | `Object.keys(directives).forEach(key => app.directive(key, directives[key]))` |
| global config | 寫入 `app.config.globalProperties.$VIEWUI` |
| service APIs | 寫入 `$Spin`、`$Loading`、`$Message`、`$Notice`、`$Modal` 等 |
| date helper | 寫入 `$Date = dayjs` |

## 3. What Gets Installed

plugin install 後，Vue app 會得到三種 public surface：

| Surface | Access pattern | Installed by |
| --- | --- | --- |
| Global components | template 直接使用 `Button`、`Table`、`iButton` 等 | `app.component` |
| Global directives | template 使用 `v-resize`、`v-line-clamp`、`v-color` 等 | `app.directive` |
| Instance properties | component instance 使用 `this.$Message`、`this.$VIEWUI` 等 | `app.config.globalProperties` |

這裡的重點是：`install()` 不只是 component registration。它同時建立了全域設定、命令式 API、locale adapter 與 dayjs helper。

Source detail：這份 `src/index.js` 有讀取 `install.installed`，但沒有看到 `install.installed = true` 的賦值。因此筆記中應把它描述為「防重複安裝檢查」，不要直接假設它在目前版本能完整阻止重複安裝。

## 4. Install Options

`opts` 會影響三類行為：

| Option group | Effect |
| --- | --- |
| `locale`, `i18n` | 初始化語系與翻譯函式 |
| `size`, `transfer`, `capture` | 寫入 `$VIEWUI` 的全域行為設定 |
| component-specific options | 寫入 `$VIEWUI.cell`、`$VIEWUI.menu`、`$VIEWUI.select` 等 component config |

詳細 `$VIEWUI` 結構見 `04-plugin-system/04-global-options-and-viewui-config.md`。

## 5. Reading Notes

閱讀 `install()` 時要注意它扮演的是 orchestration layer：

- 它不實作 component 本身，只把 `src/components/index.js` 匯出的 modules 註冊到 app。
- 它不實作 directive 本身，只定義 directive 的 public registration names。
- 它不實作 `$Message`、`$Modal` 等 service API，只把 component service object 掛到 Vue instance。
- 它不定義完整 TypeScript surface，型別契約在 `types/index.d.ts`。

## Related Notes

- `04-plugin-system/02-component-registration.md`
- `04-plugin-system/03-directive-registration.md`
- `04-plugin-system/04-global-options-and-viewui-config.md`
- `04-plugin-system/05-global-properties.md`
- `04-plugin-system/06-locale-plugin-contract.md`
- `04-plugin-system/07-runtime-type-contract.md`
