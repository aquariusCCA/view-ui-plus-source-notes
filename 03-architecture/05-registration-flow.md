# 全域註冊流程

## 學習目標

這篇筆記追蹤 `app.use(ViewUIPlus)` 背後發生的事情。全域註冊流程是理解 Vue 元件庫的第一條主線。

## 源碼位置

主要閱讀：

- `01-origin/source/view-ui-plus-v1.3.20/src/index.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/index.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/directives/`
- `01-origin/source/view-ui-plus-v1.3.20/src/locale/index.js`
- `01-origin/source/view-ui-plus-v1.3.20/types/index.d.ts`

## 核心概念

Vue 3 的插件安裝核心是 `install(app, options)`。View UI Plus 在 `install` 中完成五件事：

1. 防止重複安裝。
2. 初始化 locale 和 i18n。
3. 批次註冊所有元件。
4. 批次註冊自訂指令。
5. 掛載全域配置與命令式服務。

## 註冊流程圖

```txt
app.use(ViewUIPlus, opts)
  -> default API.install
  -> install(app, opts)
     -> localeFile.use(opts.locale)
     -> localeFile.i18n(opts.i18n)
     -> app.component(name, component)
     -> app.directive(name, directive)
     -> app.config.globalProperties.$VIEWUI = global options
     -> app.config.globalProperties.$Message / $Modal / ...
```

## 元件註冊

`src/index.js` 先建立 `ViewUI`：

```txt
ViewUI = {
  ...components,
  iButton: components.Button,
  iInput: components.Input,
  ...
}
```

接著在 `install` 中批次註冊：

```txt
Object.keys(ViewUI).forEach(key => {
  app.component(key, ViewUI[key])
})
```

這代表 `src/components/index.js` 中匯出的元件，以及 `ViewUI` 裡額外定義的別名，都會成為全域元件。

## 指令註冊

`src/index.js` 匯入三個指令來源：

- `line-clamp`
- `resize`
- `style`

再整理成一個 `directives` 物件，提供：

- `v-display`
- `v-width`
- `v-height`
- `v-margin`
- `v-padding`
- `v-font`
- `v-color`
- `v-bg-color`
- `v-resize`
- `v-line-clamp`

安裝時會透過 `app.directive(key, directives[key])` 註冊。

## 全域配置

`$VIEWUI` 是 View UI Plus 的全域配置物件，來源是 `install(app, opts)` 的第二個參數。它包含：

- 通用尺寸：`size`
- 彈層轉移：`transfer`
- 事件捕獲：`capture`
- 多個元件的 icon、arrow、maskClosable 等預設設定。

這種設計讓單一元件可以讀取全域預設值，同時仍保留 props 覆蓋的空間。

## 全域服務

`install` 會把多個命令式服務掛到 `app.config.globalProperties`：

- `$Spin`
- `$Loading`
- `$Message`
- `$Notice`
- `$Modal`
- `$ImagePreview`
- `$Copy`
- `$ScrollIntoView`
- `$ScrollTop`
- `$Date`

這些 API 讓使用者可以在元件實例中用 `this.$Message.success(...)` 或 `this.$Modal.confirm(...)` 這類方式呼叫服務。

## TypeScript 對應

全域服務掛載後，還需要型別配合。`types/index.d.ts` 透過擴充 `@vue/runtime-core` 的 `ComponentCustomProperties`，讓 TypeScript 知道元件實例上存在 `$Message`、`$Modal`、`$VIEWUI` 等屬性。

這是一個完整元件庫常見的雙線設計：

- runtime：`app.config.globalProperties`
- type：`declare module '@vue/runtime-core'`

## 設計啟發

全域註冊流程要同時考慮使用者便利性與維護成本：

- 批次註冊很方便，但會增加整包安裝的體積與全域命名面。
- 全域服務很好用，但必須搭配型別宣告。
- 全域配置能統一體驗，但要避免讓每個元件都過度依賴隱式狀態。
- 別名能兼容歷史使用方式，但會擴大公開 API。

## 檢查問題

1. `install.installed` 的用途是什麼？
2. `app.component` 和 `app.config.globalProperties` 分別解決什麼問題？
3. `Message` 為什麼不只是普通元件，還需要掛成 `$Message`？
4. `$VIEWUI` 這類全域配置可能帶來什麼好處與風險？
5. 為什麼全域服務需要在 `types/index.d.ts` 補型別？
