# install 流程拆解

## 學習目標

這篇拆解 `install(app, opts)` 的完整流程。讀完後，要能從 `app.use(ViewUIPlus, opts)` 一路追到元件、指令、全域設定與全域服務的註冊。

## 對照源碼

- `01-origin/source/view-ui-plus-v1.3.20/src/index.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/locale/index.js`
- `01-origin/source/view-ui-plus-v1.3.20/types/index.d.ts`

## 主流程

`install` 的執行順序可以整理成：

```txt
app.use(ViewUIPlus, opts)
  -> ViewUIPlus.install(app, opts)
     -> 防止重複安裝
     -> 套用 locale / i18n
     -> 註冊所有元件
     -> 註冊所有指令
     -> 寫入 $VIEWUI 全域設定
     -> 寫入 $Message / $Modal / $Loading 等全域服務
     -> 寫入 $Date
```

原始碼入口是：

```js
export const install = function(app, opts = {}) {
    if (install.installed) return;
    // ...
};
```

`opts` 是使用者傳給 `app.use(ViewUIPlus, opts)` 的第二個參數，也是全域設定與語系設定的來源。

## 1. 防止重複安裝

`install` 一開始檢查：

```js
if (install.installed) return;
```

這是 Vue 插件常見防線，目標是避免同一套插件重複註冊元件、指令與全域方法。

注意：這份源碼只有檢查 `install.installed`，沒有在後面看到明確設定 `install.installed = true`。閱讀時要分清楚「設計意圖」和「實際完成度」。

## 2. 套用語系

接著處理語系：

```js
if (opts.locale) {
    localeFile.use(opts.locale);
}
if (opts.i18n) {
    localeFile.i18n(opts.i18n);
}
```

`localeFile.use` 直接替換目前語言包；`localeFile.i18n` 保存外部 i18n 實例，讓元件內部的 `t()` 可以優先走使用者的翻譯系統。

## 3. 註冊元件

所有元件會集中在 `ViewUI` 物件內，然後逐一註冊：

```js
Object.keys(ViewUI).forEach(key => {
    app.component(key, ViewUI[key]);
});
```

這就是完整安裝後，模板裡可以直接使用 `<Button />`、`<Modal />`、`<i-button />` 的原因。

## 4. 註冊指令

指令同樣先組成 `directives` 物件，再逐一註冊：

```js
Object.keys(directives).forEach(key => {
    app.directive(key, directives[key]);
});
```

註冊後，使用者就能在模板裡使用 `v-resize`、`v-line-clamp`、`v-width` 等指令。

## 5. 寫入全域屬性

最後把設定和服務掛到：

```js
app.config.globalProperties
```

這是 Vue 3 取代 Vue 2 `Vue.prototype` 的位置。Options API 元件可以透過 `this.$Message`、`this.$VIEWUI` 讀取；Composition API 內部則常透過 `getCurrentInstance().appContext.config.globalProperties` 取得。

## 設計重點

- `install` 是「把元件庫接到 Vue app」的集中點。
- `opts` 不直接散落到各元件，而是先整理成 `$VIEWUI`。
- 元件註冊、指令註冊、全域服務註冊都用物件表驅動，方便集中維護。

## 最小模仿

```js
export const install = (app, opts = {}) => {
    app.component('MyButton', MyButton);
    app.directive('focus', focusDirective);

    app.config.globalProperties.$MY_UI = {
        size: opts.size || 'default'
    };

    app.config.globalProperties.$Message = Message;
};
```

## 複習題

1. `app.use(ViewUIPlus, opts)` 的 `opts` 最後流到哪些地方？
2. `app.component` 和 `app.config.globalProperties` 解決的是同一種問題嗎？
3. 為什麼要把指令也放進 `install`？
