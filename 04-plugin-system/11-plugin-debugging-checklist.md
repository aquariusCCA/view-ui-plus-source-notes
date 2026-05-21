# Plugin Debugging Checklist

這篇整理 View UI Plus plugin system 常見除錯路線。重點是先判斷問題發生在哪一層：使用者安裝、plugin install、global registration、globalProperties、locale，還是 TypeScript declaration。

主要 source：

- `01-origin/source/view-ui-plus-v1.3.20/src/index.js`
- `01-origin/source/view-ui-plus-v1.3.20/types/index.d.ts`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/index.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/locale/index.js`

## 1. First Question

遇到 plugin system 問題，先問：

```txt
這個能力是透過 app.use(ViewUIPlus) 安裝出來的，
還是透過 named import 直接使用的？
```

| 使用方式 | 主要檢查 |
| --- | --- |
| `app.use(ViewUIPlus)` | `install(app, opts)` 是否被執行 |
| `<Button />` 全域使用 | component registration |
| `v-resize` / `v-line-clamp` | directive registration |
| `this.$Message` | `app.config.globalProperties` |
| `import { Button }` | `src/components/index.js` named export |
| TypeScript 沒提示 | `types/index.d.ts` |

## 2. `app.use(ViewUIPlus)` 沒有效果

檢查順序：

| Check | What to inspect |
| --- | --- |
| 是否真的呼叫 `app.use(ViewUIPlus, options)` | application entry，例如 `main.js` |
| default import 是否正確 | `import ViewUIPlus from 'view-ui-plus'` |
| plugin object 是否有 `install` | `src/index.js` 的 default `API` |
| `install` 是否提前 return | `if (install.installed) return` |
| 是否使用多個 Vue app instance | 每個 app 都要個別 install |

View UI Plus source 裡有防重複安裝 guard：

```js
if (install.installed) return;
```

但要注意 source 片段沒有設定 `install.installed = true`。如果你在實作自己的 plugin，應該在第一次安裝後設值，否則 guard 只是意圖，沒有實際防重複效果。

## 3. 全域 Component 不能用

症狀：

```txt
Failed to resolve component: Button
```

檢查順序：

| Check | Source |
| --- | --- |
| component 是否從 `src/components/index.js` export | `export { default as Button } from './button'` |
| `src/index.js` 是否 import `* as components` | `import * as components from './components'` |
| `ViewUI` map 是否包含該 key | `const ViewUI = { ...components, ...aliases }` |
| install 是否有跑 `app.component` loop | `Object.keys(ViewUI).forEach(...)` |
| template 使用名稱是否和註冊 key 對得上 | `Button`、`iButton` 等 |

判斷規則：

- `import { Button }` 成功，不代表全域 `<Button />` 一定成功。
- 全域 component 依賴 `app.use(ViewUIPlus)`。
- named import 依賴 package export surface。

## 4. Component Alias 不能用

View UI Plus 額外提供一些 alias：

```js
iButton: components.Button,
iTable: components.Table,
iInput: components.Input
```

如果 `<i-button />` 不能用，檢查：

| Check | Why |
| --- | --- |
| alias 是否存在於 `ViewUI` map | alias 不是自動從 component name 生成 |
| Vue template casing 是否正確 | `iButton` 註冊後 template 通常可用 `i-button` |
| 是否只使用 named import | named import 不會自動註冊 alias |

## 5. Directive 不能用

症狀：

```txt
Failed to resolve directive: resize
```

檢查順序：

| Check | Source |
| --- | --- |
| directive source 是否被 import | `src/index.js` 的 directive imports |
| directive map key 是否正確 | `resize`、`line-clamp`、`bg-color` |
| install 是否執行 `app.directive` loop | `Object.keys(directives).forEach(...)` |
| template 名稱是否符合 key | `v-resize`、`v-line-clamp`、`v-bg-color` |

directive registration name 來自 `directives` object 的 key，不一定等於檔名。

## 6. `$Message` / `$Modal` 找不到

症狀：

```txt
this.$Message is undefined
this.$Modal is undefined
```

檢查順序：

| Check | Source |
| --- | --- |
| 是否呼叫 `app.use(ViewUIPlus)` | 沒 install 就沒有 globalProperties |
| 是否在 Vue component instance 內使用 `this` | `globalProperties` 是 instance surface |
| `src/index.js` 是否有掛對 key | `$Message`、`$Modal`、`$Notice` |
| runtime value 是否來自 components map | `components.Message`、`components.Modal` |
| TypeScript 有提示但 runtime undefined | 檢查 runtime install |
| runtime 可用但 TypeScript 沒提示 | 檢查 `types/index.d.ts` |

要分清楚兩件事：

```js
import { Message } from 'view-ui-plus';
```

和：

```js
this.$Message.info('Saved');
```

前者是 module-level named export，後者是 Vue app install 後的 instance property。

## 7. `$VIEWUI` 設定沒生效

症狀：

- `transfer` 設了但 component 行為沒有變
- `modal.maskClosable` 設了但 modal 沒照預期
- `select.arrow` 設了但 icon 沒變

檢查順序：

| Check | What to inspect |
| --- | --- |
| options 是否傳給 `app.use` 第二個參數 | `app.use(ViewUIPlus, options)` |
| `$VIEWUI` 是否有對應 key | `src/index.js` 的 `$VIEWUI` object |
| fallback 是否吞掉 false/empty value | 注意 truthy fallback 與 key-existence check |
| component 是否真的讀 `$VIEWUI` 該 key | 跳到對應 component source |
| type 是否允許該 option | `ViewUIPlusGlobalOptions` |

特別注意：

```js
capture: 'capture' in opts ? opts.capture : true
transfer: 'transfer' in opts ? opts.transfer : ''
```

這種 key-existence check 可以保留 `false`。

但像：

```js
arrow: opts.select ? opts.select.arrow ? opts.select.arrow : '' : ''
```

這種 truthy fallback 會把 falsy value 轉成空字串。讀 config bug 時要看清楚是哪一種 fallback。

## 8. Locale 沒切換

檢查順序：

| Check | Source |
| --- | --- |
| 是否傳入 `opts.locale` | `install(app, opts)` |
| 是否傳入 `opts.i18n` | `localeFile.i18n(opts.i18n)` |
| `localeFile.use` 是否收到正確 lang object | `src/locale/index.js` |
| component 是否透過 locale mixin / `t` 讀取文案 | `src/mixins/locale.js` 或 component source |
| 使用 `lang(code)` 時語言包是否已掛到 `window['viewuiplus/locale']` | `src/index.js` |

plugin system 只負責建立 locale contract。語言包如何 build、如何載入，屬於 `14-build-release/`。

## 9. TypeScript 有問題

常見狀況：

| Symptom | Likely layer |
| --- | --- |
| `app.use(ViewUIPlus, { ... })` options 報錯 | `ViewUIPlusInstallOptions` |
| `this.$Message` 沒提示 | `ComponentCustomProperties` |
| runtime 有 `$Copy` 但 types 沒有 | runtime/type contract mismatch |
| types 有 key 但 runtime 沒掛 | stale declaration |
| component named import 沒型別 | component declarations / export declarations |

plugin system 要優先看：

```txt
types/index.d.ts
```

如果問題是單一 component props/events 型別，再跳到 `06-type-system/`。

## 10. Debug Route

可以用這條固定路線排查：

```txt
1. Confirm usage style
   app.use / named import / instance property / directive

2. Confirm runtime source
   src/index.js / src/components/index.js / src/locale/index.js

3. Confirm install side effect
   app.component / app.directive / globalProperties / localeFile.use

4. Confirm consumer access path
   template / this.$... / import / TypeScript

5. Confirm boundary
   plugin system or component/service/directive internals
```

## 11. Quick Symptom Table

| Symptom | First file to inspect | Next note |
| --- | --- | --- |
| `<Button />` not found | `src/index.js` + `src/components/index.js` | `02-component-registration.md` |
| `v-resize` not found | `src/index.js` directives map | `03-directive-registration.md` |
| `this.$Message` undefined | `src/index.js` globalProperties | `05-global-properties.md` |
| `$VIEWUI` value unexpected | `src/index.js` `$VIEWUI` object | `04-global-options-and-viewui-config.md` |
| locale text not changed | `src/index.js` + `src/locale/index.js` | `06-locale-plugin-contract.md` |
| TypeScript does not know `$Modal` | `types/index.d.ts` | `07-runtime-type-contract.md` |

## Related Notes

- `04-plugin-system/01-install-flow.md`
- `04-plugin-system/02-component-registration.md`
- `04-plugin-system/03-directive-registration.md`
- `04-plugin-system/04-global-options-and-viewui-config.md`
- `04-plugin-system/05-global-properties.md`
- `04-plugin-system/06-locale-plugin-contract.md`
- `04-plugin-system/07-runtime-type-contract.md`
- `10-imperative-api/`
- `11-directives/`

