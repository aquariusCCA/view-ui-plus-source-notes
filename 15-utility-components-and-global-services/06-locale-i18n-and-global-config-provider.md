# Locale、i18n 與全域設定

## 學習目標

這篇整理 View UI Plus 的語系與全域設定。它們不是普通服務，卻會影響大量元件的預設文案、尺寸、圖示、transfer、maskClosable、Typography 行為與其他跨元件偏好。

讀完後，要能分辨 `locale`、`i18n`、`$VIEWUI`、`globalConfig`、`mixins/locale` 各自負責什麼，以及元件如何從安裝選項讀到這些設定。

## 對照源碼

- `01-origin/source/view-ui-plus-v1.3.20/src/index.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/locale/index.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/locale/format.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/locale/lang/`
- `01-origin/source/view-ui-plus-v1.3.20/src/mixins/locale.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/mixins/globalConfig.js`
- `01-origin/source/view-ui-plus-v1.3.20/types/index.d.ts`

## 安裝期設定

`src/index.js` 的 `install(app, opts)` 先處理語系：

```txt
if (opts.locale) localeFile.use(opts.locale)
if (opts.i18n) localeFile.i18n(opts.i18n)
```

接著建立 `$VIEWUI`：

```txt
app.config.globalProperties.$VIEWUI = {
  size,
  capture,
  transfer,
  cell,
  menu,
  modal,
  tabs,
  select,
  colorPicker,
  cascader,
  tree,
  datePicker,
  timePicker,
  typography,
  space,
  image
}
```

這代表安裝選項不是只影響插件入口，而是會變成所有元件可讀取的全域設定物件。

## Locale 流程

`locale/index.js` 維護幾個模組級狀態：

- `lang`：目前使用的 View UI Plus 語系物件。
- `langs`：內建語系集合，預設含 zh。
- `vuei18n`：外部傳入的 i18n 實例。
- `merged`、`nowLang`：避免重複合併同一語系。

`t(path, options)` 的流程是：

```txt
t(path, options)
  -> 先交給 i18nHandler
  -> 如果外部 i18n 有結果，直接回傳
  -> 否則沿著 path 從 lang 取值
  -> 用 format(value, options) 替換模板參數
```

因此元件呼叫 `this.t('i.modal.okText')` 時，不需要知道使用者是否接了 vue-i18n。

## i18n 整合

`i18nHandler` 支援幾種情況：

- 元件實例上有 `$t`，就呼叫 `$t`。
- `vuei18n.global` 存在時，使用 `vuei18n.global.t`。
- 舊式 i18n 實例有 `locale` 時，合併 View UI Plus 語系和使用者 locale message。

這裡的設計重點是「元件庫提供預設語系，但允許宿主應用接管翻譯」。對企業系統來說，這讓 UI 元件庫能跟業務文案共用同一套 i18n。

## mixins/locale

`mixins/locale.js` 很薄：

```txt
methods: {
  t(...args) {
    return t.apply(this, args)
  }
}
```

它的價值是讓元件內統一使用 `this.t()`，而不是每個元件自己 import `t` 並處理 this 綁定。

Confirm Modal 就用這個 mixin 讀取 `okText` 和 `cancelText`。其他需要內建文案的元件也可以沿用同樣模式。

## mixins/globalConfig

`mixins/globalConfig.js` 在 `created()` 中透過 `getCurrentInstance()` 取得：

```txt
instance.appContext.config.globalProperties.$VIEWUI
```

然後寫入元件資料 `globalConfig`。這讓元件可以讀取安裝期設定，例如：

- 統一的 size。
- 是否 transfer。
- Select、Tree、Cascader 的箭頭圖示。
- Modal 的 maskClosable 預設。
- Typography 的 copy/edit/ellipsis 預設配置。

閱讀元件時，如果看到 `globalConfig`，要回到 `src/index.js` 核對它來自哪個 options 欄位。

## 設計啟發

全域設定和全域服務不一樣：

- 全域服務是「呼叫一個動作」，例如 `$Message.success()`。
- 全域設定是「影響一群元件的預設行為」，例如 `$VIEWUI.size`。
- locale 是「把內建文案轉成可替換資源」。

設計全域設定時要避免過度集中。只有真正跨多個元件、具有一致預設語意的項目，才適合放進 `$VIEWUI`。單一元件的少量偏好，應該優先保留在 props。

## 複習題

1. `locale` 和 `i18n` 在 install options 裡的角色差在哪裡？
2. `this.t()` 為什麼需要保留 this 綁定？
3. `$VIEWUI` 為什麼適合放尺寸、transfer、圖示偏好，而不是放每個元件的所有 props？
4. `globalConfig` mixin 和直接 import 設定物件相比，有什麼差異？
5. 如果要新增全域 `emptyText` 設定，應該放在哪一層，哪些元件會讀取？
