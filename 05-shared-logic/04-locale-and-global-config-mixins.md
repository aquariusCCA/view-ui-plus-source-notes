# Locale and Global Config Mixins：語系與全域設定的共用讀取

## 1. 本章定位

本篇分析兩個與全域上下文有關的 mixin：

```txt
src/mixins/locale.js
src/mixins/globalConfig.js
```

它們解決的問題不同：

| Mixin | 解決問題 |
| --- | --- |
| `locale.js` | 元件如何取得翻譯函式 `this.t()`。 |
| `globalConfig.js` | 元件如何取得 plugin install 時寫入的 `$VIEWUI` 全域設定。 |

這兩個 mixin 都不是單一元件邏輯，而是 UI library 的全域能力如何被元件消費的範例。

---

## 2. Locale mixin 的形狀

`src/mixins/locale.js` 很薄：

```js
import { t } from '../locale';

export default {
    methods: {
        t(...args) {
            return t.apply(this, args);
        }
    }
};
```

它只做一件事：把 `src/locale/index.js` 的 `t()` 掛成 component instance method。

因此元件中可以寫：

```js
this.t('i.modal.okText')
```

而不需要每個元件都直接 import locale module。

---

## 3. `t()` 背後的 fallback 流程

`src/locale/index.js` 的 `t(path, options)` 大致有三層 fallback：

```txt
component instance 上的 $t
  -> plugin 注入的 vue-i18n instance
    -> View UI Plus 內部 lang object
```

也就是說，當元件呼叫：

```js
this.t('i.modal.okText')
```

它可能來自：

1. 使用者自己的 Vue i18n `$t`。
2. View UI Plus install 時傳入的 i18n instance。
3. View UI Plus 內建語言包。

這個設計讓元件不用知道使用者是否接了外部 i18n，也不用知道目前語言資料存在哪裡。

---

## 4. Locale mixin 的使用場景

常見使用者：

```txt
Modal
Page
Poptip
Transfer
ColorPicker
Cascader
Table
Tree
DatePicker panels
Image / ImagePreview
Scroll
Rate
```

典型例子是 Modal：

```js
localeOkText () {
    if (this.okText === undefined) {
        return this.t('i.modal.okText');
    } else {
        return this.okText;
    }
}
```

這裡的規則是：

```txt
使用者有傳 prop
  -> 用使用者傳入的文案
沒有傳 prop
  -> 用 locale t() 取得預設文案
```

這是 UI library 很常見的設計：prop override 優先，全域語系作為預設值來源。

---

## 5. Global config mixin 的形狀

`src/mixins/globalConfig.js`：

```js
import { getCurrentInstance } from 'vue';

export default {
    data () {
        return {
            globalConfig: {}
        }
    },
    created () {
        const instance = getCurrentInstance();
        this.globalConfig = instance.appContext.config.globalProperties.$VIEWUI;
    }
}
```

它在 `created()` 中讀取：

```txt
instance.appContext.config.globalProperties.$VIEWUI
```

並存到：

```txt
this.globalConfig
```

---

## 6. `$VIEWUI` 來自 plugin install

`$VIEWUI` 是在 `src/index.js` 的 install 流程中寫入：

```js
app.config.globalProperties.$VIEWUI = {
    size: opts.size || '',
    capture: 'capture' in opts ? opts.capture : true,
    transfer: 'transfer' in opts ? opts.transfer : '',
    select: { ... },
    modal: { ... },
    ...
}
```

因此它代表 library-level config，不是單一元件自己的 props。

元件取設定時常見邏輯是：

```txt
如果 prop 有明確傳入
  -> 用 prop
否則讀 $VIEWUI
如果 $VIEWUI 沒設定
  -> 回到 component default
```

---

## 7. 兩種讀取 `$VIEWUI` 的方式

View UI Plus 中存在兩種常見寫法。

第一種是使用 `globalConfig` mixin：

```js
mixins: [ globalConfig ]
```

例如 `Cascader`、`ColorPicker`、`Tabs`、`Cell` 等部分元件或子元件。

第二種是元件 props default 直接讀：

```js
default () {
    const global = getCurrentInstance().appContext.config.globalProperties;
    return !global.$VIEWUI || global.$VIEWUI.size === '' ? 'default' : global.$VIEWUI.size;
}
```

很多元件的 `size`、`transfer`、`capture`、`maskClosable` 等設定都使用這種模式。

這表示 `$VIEWUI` 是跨整個 library 的設定來源，但消費方式並不完全統一。

---

## 8. Locale 與 global config 的差異

| 面向 | Locale mixin | Global config mixin |
| --- | --- | --- |
| 提供能力 | `this.t()` | `this.globalConfig` |
| 資料來源 | `src/locale/index.js` | `app.config.globalProperties.$VIEWUI` |
| 常見用途 | 預設文案、國際化文字 | size、transfer、capture、元件預設行為 |
| 是否封裝 fallback | 是，`t()` 內部處理 fallback | 否，元件常自己判斷設定是否存在 |
| 與 plugin system 關係 | install 時可設定 locale / i18n | install 時寫入 `$VIEWUI` |

---

## 9. 讀碼提醒

當你在元件中看到：

```js
mixins: [ Locale ]
```

就要補上：

```txt
這個元件有 this.t()
它的文字可能來自外部 i18n 或內建語言包
```

當你看到：

```js
getCurrentInstance().appContext.config.globalProperties.$VIEWUI
```

或：

```js
mixins: [ globalConfig ]
```

就要補上：

```txt
這個元件的預設行為可能受 app.use(ViewUIPlus, options) 影響
```

---

## 10. 本章結論

Locale 與 global config 都是全域能力，但它們解決的是不同層次的問題。

```txt
Locale
  -> 解決「文字從哪裡來」

$VIEWUI
  -> 解決「元件預設行為從哪裡來」
```

讀 View UI Plus 的元件時，如果忽略這兩條線，很容易誤以為某些預設值是寫死在元件裡。實際上，很多元件行為都會受到 plugin install options 影響。
