# 語系與全域設定

## 學習目標

這篇分析 View UI Plus 如何讓元件讀取語系與全域設定。這類邏輯不屬於單一元件，卻會影響大量元件的顯示文字、圖示方向、尺寸或選單行為。

## 對照源碼

- `01-origin/source/view-ui-plus-v1.3.20/src/mixins/locale.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/mixins/globalConfig.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/locale/index.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/locale/format.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/index.js`

語系文字代表案例：

- `01-origin/source/view-ui-plus-v1.3.20/src/components/select/select.vue`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/modal/modal.vue`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/table/table.vue`

全域設定代表案例：

- `01-origin/source/view-ui-plus-v1.3.20/src/components/cascader/cascader.vue`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/cell/cell.vue`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/menu/submenu.vue`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/tabs/tabs.vue`

這幾個元件不是完整使用清單，而是分別代表語系文字與全域設定兩條線：`select.vue`、`modal.vue`、`table.vue` 用來看元件如何透過 `Locale` mixin 讀取顯示文案；`cascader.vue`、`cell.vue`、`submenu.vue`、`tabs.vue` 用來看元件如何透過 `globalConfig` mixin 讀取 `$VIEWUI` 全域設定。

## Locale mixin

`mixins/locale.js` 很小，只提供一個方法：

```js
t(...args) {
    return t.apply(this, args);
}
```

元件混入後，就能用 `this.t('i.modal.okText')`、`this.t('i.select.placeholder')` 取得文字。

代表使用場景：

- Modal 的 ok / cancel 文案。
- Select 的 placeholder、noMatch、loading。
- Table 的 noDataText、sumText。
- DatePicker 的月份、星期、按鈕文字。
- Transfer、Tree、Image 的空狀態或提示文字。

## `locale/index.js`

語系核心提供三個入口：

| 函數 | 作用 |
| --- | --- |
| `use(l)` | 切換 View UI Plus 內建語言包 |
| `i18n(initI18n)` | 接入外部 i18n 實例 |
| `t(path, options)` | 根據 path 取值並做 template format |

`t` 的順序大致是：

```txt
先嘗試外部 i18n
  -> 如果有值，直接回傳
  -> 如果沒有，從目前內建 lang 物件用 path 逐層取值
  -> 對取出的字串做 format
```

這讓 View UI Plus 可以同時支援自身語言包與使用者專案中的 i18n。

## Global config mixin

`mixins/globalConfig.js` 在 `created` 階段讀取：

```js
instance.appContext.config.globalProperties.$VIEWUI
```

然後存到元件的 `globalConfig` data。

`$VIEWUI` 來自插件安裝階段。使用者呼叫 `app.use(ViewUIPlus, opts)` 後，`opts` 會被整理成全域設定，供元件讀取。

代表使用場景：

- Cascader、Cell、DatePicker、ColorPicker、Menu、Tabs、SelectHead 等元件讀取圖示設定。
- Tree 的 node 內部也會讀取全域設定，只是它直接在元件內呼叫 `getCurrentInstance`，沒有使用 mixin。

## 設計分工

| 能力 | 存放位置 | 元件看到的介面 |
| --- | --- | --- |
| 語系文字 | `src/locale/` | `this.t(path)` |
| 語系接入 | `install(app, opts)` | `opts.locale`、`opts.i18n` |
| 全域設定 | `app.config.globalProperties.$VIEWUI` | `this.globalConfig` |
| 格式化 | `locale/format.js` | `{name}` 這類模板替換 |

這個分工讓元件不用知道語言包如何被設定，也不用知道 `$VIEWUI` 的安裝細節。元件只依賴 mixin 暴露出來的 `t` 與 `globalConfig`。

## 設計啟發

全域設定最怕到處直接讀取。當元件大量散落 `this.$VIEWUI` 或 `appContext.config.globalProperties`，日後很難替換來源。

View UI Plus 用 mixin 包住讀取方式，讓多數元件只接觸 `globalConfig`。這是合理的隔離。不過它仍然有兩個限制：

- `created` 時複製一份設定，如果全域設定之後動態變更，元件不一定會自動同步。
- 這是 Options API 寫法，Composition API 中可以改成 `useGlobalConfig()`。

## 複習題

1. `Locale` mixin 為什麼只需要提供 `t` 方法？
2. `locale.use` 和 `locale.i18n` 分別解決什麼問題？
3. `$VIEWUI` 是在哪個階段寫入 Vue app 的？
4. 元件直接讀 `globalProperties` 和透過 mixin 讀取有什麼差異？
5. 如果要支援動態全域設定更新，現在的 `globalConfig` 寫法有哪些限制？
