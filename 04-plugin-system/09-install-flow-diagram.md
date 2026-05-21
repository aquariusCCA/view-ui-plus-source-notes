# Install Flow Diagram

這篇用圖解方式整理 View UI Plus plugin 安裝流程。它是 `01-install-flow.md` 的視覺化補充，重點是從使用者呼叫一路追到 Vue app 被改動的 public surface。

主要 source：

```txt
01-origin/source/view-ui-plus-v1.3.20/src/index.js
```

## 1. Big Picture

```txt
User code
  app.use(ViewUIPlus, options)
        |
        v
Vue plugin protocol
  ViewUIPlus.install(app, options)
        |
        v
View UI Plus install(app, opts)
  1. guard repeated install
  2. setup locale / i18n
  3. register global components
  4. register global directives
  5. write $VIEWUI global config
  6. write instance APIs and $Date
```

安裝完成後，使用者可以透過三種方式取得能力：

| Surface | 使用方式 | 由 install 哪一步建立 |
| --- | --- | --- |
| Global components | `<Button />`、`<i-button />` | `app.component` loop |
| Global directives | `v-resize`、`v-line-clamp` | `app.directive` loop |
| Instance properties | `this.$Message`、`this.$VIEWUI` | `app.config.globalProperties` |

## 2. Runtime Entry Diagram

`src/index.js` 先組合出 plugin 需要的輸入資料：

```txt
src/index.js
  |
  |-- export * from './components'
  |-- import * as components from './components'
  |-- import localeFile from './locale/index'
  |-- import directives
  |-- import dayjs
  |-- import package version
  |
  |-- build directives map
  |-- build ViewUI component map
  |-- define install(app, opts)
  |-- export locale / i18n / lang / version
  |-- export default API
```

這裡有兩個容易混淆的 surface：

| Surface | Source shape | 用途 |
| --- | --- | --- |
| Named exports | `export * from './components'` | 讓使用者 `import { Button }` |
| Default plugin export | `export default API` | 讓使用者 `app.use(ViewUIPlus)` |

`API` object 同時包含：

```txt
{
  version,
  locale,
  i18n,
  install,
  lang,
  ...components
}
```

## 3. Install Sequence Diagram

```txt
install(app, opts = {})
  |
  |-- if (install.installed) return
  |
  |-- if (opts.locale)
  |     localeFile.use(opts.locale)
  |
  |-- if (opts.i18n)
  |     localeFile.i18n(opts.i18n)
  |
  |-- Object.keys(ViewUI).forEach(key => {
  |     app.component(key, ViewUI[key])
  |   })
  |
  |-- Object.keys(directives).forEach(key => {
  |     app.directive(key, directives[key])
  |   })
  |
  |-- app.config.globalProperties.$VIEWUI = { ...normalized options }
  |
  |-- app.config.globalProperties.$Spin = components.Spin
  |-- app.config.globalProperties.$Loading = components.LoadingBar
  |-- app.config.globalProperties.$Message = components.Message
  |-- app.config.globalProperties.$Notice = components.Notice
  |-- app.config.globalProperties.$Modal = components.Modal
  |-- app.config.globalProperties.$ImagePreview = components.ImagePreview
  |-- app.config.globalProperties.$Copy = components.Copy
  |-- app.config.globalProperties.$ScrollIntoView = components.ScrollIntoView
  |-- app.config.globalProperties.$ScrollTop = components.ScrollTop
  |
  |-- app.config.globalProperties.$Date = dayjs
```

讀這段時要注意：source 裡有 `if (install.installed) return;`，但沒有看到 `install.installed = true`。這代表防重複安裝意圖存在，但目前 source 片段沒有真正設值。這類 runtime/type 或 intent/implementation gap 應該記到 `07-runtime-type-contract.md` 或 maintenance checklist。

## 4. Component Registration Path

```txt
src/components/index.js
  export { default as Button } from './button'
  export { default as Table } from './table'
  ...
        |
        v
src/index.js
  import * as components from './components'
        |
        v
ViewUI = {
  ...components,
  iButton: components.Button,
  iTable: components.Table,
  ...
}
        |
        v
Object.keys(ViewUI).forEach(key => {
  app.component(key, ViewUI[key])
})
```

這條路線回答的是：

- 為什麼所有 named exported components 都能全域註冊？
- 為什麼 `iButton`、`iTable` 這類 alias 也會被註冊？
- 為什麼全量安裝和按需 import 是不同使用模式？

深入讀：

- `04-plugin-system/02-component-registration.md`
- `03-architecture/06-public-surface.md`

## 5. Directive Registration Path

```txt
src/directives/*
  line-clamp
  resize
  style
        |
        v
directives = {
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
}
        |
        v
Object.keys(directives).forEach(key => {
  app.directive(key, directives[key])
})
```

這裡的 key 就是使用者在 template 裡看到的 directive 名稱。

例如：

```txt
directives['line-clamp'] -> v-line-clamp
directives['bg-color']   -> v-bg-color
directives.resize        -> v-resize
```

深入 directive hook 與 DOM 行為時，才跳到 `11-directives/`。

## 6. Global Config Path

```txt
app.use(ViewUIPlus, {
  size: 'large',
  transfer: true,
  modal: {
    maskClosable: false
  },
  select: {
    arrow: 'ios-arrow-down'
  }
})
        |
        v
install(app, opts)
        |
        v
app.config.globalProperties.$VIEWUI = {
  size,
  transfer,
  capture,
  modal,
  select,
  ...
}
        |
        v
Component instance reads:
  this.$VIEWUI
```

`$VIEWUI` 是 install options 的 runtime container。它不是 component prop，也不是 provide/inject。

深入讀：

- `04-plugin-system/04-global-options-and-viewui-config.md`
- `04-plugin-system/07-runtime-type-contract.md`

## 7. GlobalProperties Path

```txt
components.Message
components.Modal
components.Notice
components.LoadingBar
dayjs
        |
        v
app.config.globalProperties
        |
        v
Options API component instance
  this.$Message
  this.$Modal
  this.$Notice
  this.$Loading
  this.$Date
```

這條路線只說明「怎麼被掛上去」。至於 `$Message.info()` 怎麼建立 notice instance、怎麼處理 queue、怎麼 destroy，屬於 `10-imperative-api/`。

## 8. Type Contract Path

```txt
runtime
  src/index.js
    app.config.globalProperties.$Message = components.Message
        |
        | should align with
        v
types
  types/index.d.ts
    interface ComponentCustomProperties {
      $Message: any
    }
```

plugin system 的 public surface 不是只有 runtime 可用，還要讓 TypeScript 知道：

- `install(app, options)` 接受什麼 options
- `this.$VIEWUI` 有哪些 key
- `this.$Message`、`this.$Modal` 等 instance properties 是否存在

如果新增或刪除 globalProperties，只改 `src/index.js` 不夠，也要檢查 `types/index.d.ts`。

## 9. One-Line Summary

```txt
View UI Plus plugin system = package runtime modules -> install orchestration -> Vue app public surface
```

## Related Notes

- `04-plugin-system/01-install-flow.md`
- `04-plugin-system/02-component-registration.md`
- `04-plugin-system/03-directive-registration.md`
- `04-plugin-system/04-global-options-and-viewui-config.md`
- `04-plugin-system/05-global-properties.md`
- `04-plugin-system/07-runtime-type-contract.md`

