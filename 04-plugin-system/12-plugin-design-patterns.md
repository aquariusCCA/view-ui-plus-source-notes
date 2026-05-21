# Plugin Design Patterns

這篇整理 View UI Plus plugin system 背後的設計模式。它不是逐行 source note，而是把 `src/index.js` 的做法抽象成可以複用的 library 設計觀念。

主要觀察對象：

```txt
01-origin/source/view-ui-plus-v1.3.20/src/index.js
01-origin/source/view-ui-plus-v1.3.20/types/index.d.ts
```

## 1. Default Plugin Export Pattern

View UI Plus 的 default export 是一個 `API` object：

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

這個 pattern 讓同一個 default import 可以支援：

```js
import ViewUIPlus from 'view-ui-plus';

app.use(ViewUIPlus);
```

也讓 package-level runtime APIs 聚合在同一個物件上：

```js
ViewUIPlus.version;
ViewUIPlus.locale;
ViewUIPlus.lang;
```

設計重點：

| Benefit | Cost |
| --- | --- |
| 使用者只要 default import 就能全量安裝 | default object 會變大 |
| plugin install 和 package metadata 放在同一入口 | 需要維護清楚 public surface |
| 可以兼容 Vue plugin protocol | 容易和 named exports 混淆 |

## 2. Named Export + Global Registration Pattern

View UI Plus 同時提供兩種 component 使用方式。

```js
export * from './components';
```

支援：

```js
import { Button } from 'view-ui-plus';
```

而 `install()` 裡的 loop 支援：

```vue
<Button />
```

設計上這是兩條不同路線：

| Pattern | Consumer style | Dependency |
| --- | --- | --- |
| Named export | `import { Button }` | package module export |
| Global registration | `<Button />` after `app.use()` | Vue app install side effect |

這種設計適合 UI library，因為使用者可能有兩種需求：

- 全量安裝，快速在 template 直接用。
- 按需 import，控制 bundle 與註冊範圍。

## 3. Component Map Registration Pattern

View UI Plus 使用 component map 集中註冊：

```js
const ViewUI = {
    ...components,
    iButton: components.Button,
    iTable: components.Table
};

Object.keys(ViewUI).forEach(key => {
    app.component(key, ViewUI[key]);
});
```

這個 pattern 的重點是「registration source of truth」。

| Design point | Meaning |
| --- | --- |
| `components` | 從 component export layer 收集所有 components |
| `ViewUI` | plugin-level registration map |
| alias entries | 額外支援舊命名或相容命名 |
| registration loop | 避免每個 component 手寫 `app.component` |

適合使用 map registration 的情境：

- component 數量多。
- 全量註冊是官方支援用法。
- 需要 alias 或相容命名。
- 想讓新增 component 的流程可預測。

## 4. Directive Map Registration Pattern

directive 也使用 map：

```js
const directives = {
    display: style.display,
    resize,
    'line-clamp': lineClamp
};

Object.keys(directives).forEach(key => {
    app.directive(key, directives[key]);
});
```

這個 pattern 把 directive 的「實作名稱」和「template 使用名稱」分開。

| Source key | Template usage |
| --- | --- |
| `resize` | `v-resize` |
| `'line-clamp'` | `v-line-clamp` |
| `'bg-color'` | `v-bg-color` |

設計重點：

- directive registration name 是 public API。
- 檔名或 import name 可以是 implementation detail。
- 修改 key 會破壞使用者 template。

## 5. Global Config Container Pattern

View UI Plus 將 install options 整理成 `$VIEWUI`：

```js
app.config.globalProperties.$VIEWUI = {
    size: opts.size || '',
    transfer: 'transfer' in opts ? opts.transfer : '',
    modal: {
        maskClosable: opts.modal ? 'maskClosable' in opts.modal ? opts.modal.maskClosable : '' : ''
    },
    select: {
        arrow: opts.select ? opts.select.arrow ? opts.select.arrow : '' : ''
    }
};
```

這是 library-level config container。

| Why not props | Why global config |
| --- | --- |
| 每個 component 都傳一次會很重複 | install 一次後 components 可共用 |
| 適合單一 component instance 的差異 | 適合 library-wide default behavior |
| template 使用者明確控制 | plugin 使用者集中設定 |

使用這個 pattern 時要注意：

- `$VIEWUI` shape 是 public contract。
- falsy value 是否被保留，要看 fallback 寫法。
- runtime config shape 要和 `types/index.d.ts` 對齊。

## 6. GlobalProperties Service Pattern

View UI Plus 將 service-like APIs 掛到 component instance：

```js
app.config.globalProperties.$Message = components.Message;
app.config.globalProperties.$Notice = components.Notice;
app.config.globalProperties.$Modal = components.Modal;
app.config.globalProperties.$Date = dayjs;
```

這個 pattern 適合命令式 API：

```js
this.$Message.info('Saved');
this.$Modal.confirm({ title: 'Confirm' });
this.$Date().format('YYYY-MM-DD');
```

設計上它和 template component 不同：

| Template component | GlobalProperties service |
| --- | --- |
| 宣告式使用 | 命令式呼叫 |
| `<Modal />` | `this.$Modal.confirm()` |
| 主要透過 props/events | 主要透過 method options |
| registration via `app.component` | injection via `globalProperties` |

這個 pattern 的限制：

- 它偏 Options API 的 `this` 使用方式。
- Composition API 若不用 `this`，通常需要直接 import 或另建 composable。
- TypeScript 需要 module augmentation。

## 7. Locale Adapter Pattern

View UI Plus 把 locale 能力提升到 plugin-level：

```js
if (opts.locale) {
    localeFile.use(opts.locale);
}

if (opts.i18n) {
    localeFile.i18n(opts.i18n);
}

export const locale = localeFile.use;
export const i18n = localeFile.i18n;
```

這個 pattern 有兩層：

| Layer | Responsibility |
| --- | --- |
| install options | 初始安裝時指定 locale / i18n adapter |
| named runtime APIs | 安裝後仍可透過 `locale`、`i18n`、`lang` 控制語系 |

適合 UI library 的原因：

- 文案是跨 component concern。
- 不應由每個 component 自己管理語系來源。
- library 要能接入使用者既有 i18n 系統。

## 8. Runtime / Type Contract Pattern

View UI Plus 的 plugin surface 同時存在於 runtime 和 types。

```txt
Runtime:
  src/index.js
    install(app, opts)
    app.config.globalProperties.$VIEWUI
    app.config.globalProperties.$Message

Types:
  types/index.d.ts
    ViewUIPlusInstallOptions
    ViewUIPlusGlobalOptions
    ComponentCustomProperties
```

維護規則：

| Runtime change | Type change |
| --- | --- |
| 新增 install option | 更新 `ViewUIPlusInstallOptions` |
| 新增 `$VIEWUI` key | 更新 `ViewUIPlusGlobalOptions` |
| 新增 global property | 更新 `ComponentCustomProperties` |
| 刪除 runtime API | 移除或 deprecated type declaration |

這是 library 設計很重要的 pattern：public API 不是只有會跑，還要能被 IDE 和 type checker 正確認得。

## 9. Boundary Pattern

View UI Plus 的 plugin system 保持在 orchestration layer：

| Plugin system owns | Other chapters own |
| --- | --- |
| install sequence | component render / behavior |
| component registration | component props/events/slots |
| directive registration | directive hook internals |
| global config injection | component-specific config consumption |
| service API injection | service DOM / queue / destroy logic |
| locale contract | locale bundle build |
| runtime/type alignment | full component declaration tables |

這個 boundary pattern 很重要，因為 UI library 很容易把所有東西都塞進入口檔。View UI Plus 的入口檔主要負責組裝，不應該承擔所有實作細節。

## 10. Design Checklist for Your Own Plugin

如果你要設計自己的 Vue UI library plugin，可以用這張表檢查：

| Question | View UI Plus reference |
| --- | --- |
| default export 是否能被 `app.use()`？ | `API.install` |
| 是否需要 named exports？ | `export * from './components'` |
| 是否需要全域 component registration？ | `ViewUI` map |
| 是否需要 component aliases？ | `iButton`、`iTable` |
| 是否有 global directives？ | `directives` map |
| 是否有 install options？ | `$VIEWUI` |
| 是否有 command-style APIs？ | `$Message`、`$Modal` |
| 是否要接 i18n？ | `localeFile.use`、`localeFile.i18n` |
| runtime surface 是否有 type declaration？ | `types/index.d.ts` |
| 是否清楚區分 plugin orchestration 和 feature internals？ | `08-plugin-system-boundaries.md` |

## Related Notes

- `04-plugin-system/01-install-flow.md`
- `04-plugin-system/02-component-registration.md`
- `04-plugin-system/03-directive-registration.md`
- `04-plugin-system/04-global-options-and-viewui-config.md`
- `04-plugin-system/05-global-properties.md`
- `04-plugin-system/06-locale-plugin-contract.md`
- `04-plugin-system/07-runtime-type-contract.md`
- `04-plugin-system/08-plugin-system-boundaries.md`
