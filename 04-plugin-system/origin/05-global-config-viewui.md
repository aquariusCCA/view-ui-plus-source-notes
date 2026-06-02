# 全域設定 $VIEWUI

## 學習目標

這篇分析 `$VIEWUI`。它是 View UI Plus 把安裝選項傳給內部元件的主要方式，也是理解「元件庫全域設定」的核心案例。

## 對照源碼

- `01-origin/source/view-ui-plus-v1.3.20/src/index.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/mixins/globalConfig.js`
- `01-origin/source/view-ui-plus-v1.3.20/types/index.d.ts`
- 多個元件內的 `getCurrentInstance().appContext.config.globalProperties`

## 設定來源

使用者安裝插件時可以傳入：

```js
app.use(ViewUIPlus, {
    size: 'small',
    transfer: true,
    modal: {
        maskClosable: false
    },
    select: {
        arrow: 'ios-arrow-down'
    }
});
```

這些選項會在 `install` 中被整理到：

```js
app.config.globalProperties.$VIEWUI = {
    size: opts.size || '',
    capture: 'capture' in opts ? opts.capture : true,
    transfer: 'transfer' in opts ? opts.transfer : '',
    // ...
};
```

## $VIEWUI 的角色

`$VIEWUI` 不是一個方法服務，而是一份全域設定物件。它提供元件預設值，例如：

- `size`：全域尺寸。
- `capture`：事件捕獲相關預設值。
- `transfer`：彈層或浮層是否轉移到外層容器。
- `cell`、`menu`、`select`、`tree`：箭頭 icon 與尺寸設定。
- `modal.maskClosable`：Modal 遮罩點擊關閉設定。
- `typography`：複製、編輯、省略等預設設定。
- `space.size`：Space 間距預設值。
- `image.toolbar`：圖片預覽工具列設定。

## 元件如何讀取

部分 Options API 元件透過 mixin 讀取：

```js
created () {
    const instance = getCurrentInstance();
    this.globalConfig = instance.appContext.config.globalProperties.$VIEWUI;
}
```

也有元件直接在 computed 或 setup 相關邏輯內讀：

```js
const global = getCurrentInstance().appContext.config.globalProperties;
```

這表示 `$VIEWUI` 是 app 層級設定，所有元件都從同一個 app context 取得。

## 預設值策略

原始碼大量使用這種寫法：

```js
opts.select ? opts.select.arrow ? opts.select.arrow : '' : ''
```

這表示如果使用者沒有傳設定，就回到空字串或預設值。閱讀時要注意：

- `capture` 的預設值是 `true`。
- 多數 icon、size、config 欄位預設為空字串。
- `transfer` 的型別在型別檔中是 `boolean | string`，runtime 預設為空字串。

## 設計重點

- 元件庫需要一個集中位置保存全域預設值。
- `app.config.globalProperties` 是 Vue 3 app 層級共享狀態，不是瀏覽器全域變數。
- `$VIEWUI` 只適合放設定，不適合放會產生副作用的服務方法。

## 最小模仿

```js
export const install = (app, opts = {}) => {
    app.config.globalProperties.$MY_UI = {
        size: opts.size || 'default',
        modal: {
            maskClosable: opts.modal?.maskClosable ?? true
        }
    };
};
```

元件內讀取：

```js
import { getCurrentInstance } from 'vue';

const instance = getCurrentInstance();
const config = instance.appContext.config.globalProperties.$MY_UI;
```

## 複習題

1. `$VIEWUI` 和 `opts` 的關係是什麼？
2. 為什麼元件不直接讀取使用者傳給 `app.use()` 的 `opts`？
3. `$VIEWUI` 適合放服務方法嗎？為什麼？
