# Vue Icon 元件開發教學筆記

這篇筆記用 `View UI Plus` 的 `Icon` 元件作為參考，並對照 `apps/01-clone-practice` 裡的仿寫成果，說明一個最小但完整的 Icon 元件應該如何設計。

Icon 元件看起來很簡單，實際上它把三件事串起來：

```text
元件 API
  -> 產生 class / style
  -> 讓 iconfont 樣式顯示正確圖標
```

所以學習重點不是只會寫 `<i>`，而是理解「Vue 元件」和「字型圖標樣式」之間如何配合。

## 來源對照

這次可以先看四組檔案：

| 類型 | View UI Plus 原始碼 | 仿寫練習 |
| --- | --- | --- |
| 元件本體 | `origin/source/view-ui-plus-v1.3.20/src/components/icon/icon.vue` | `apps/01-clone-practice/src/components/icon/icon.vue` |
| 元件入口 | `origin/source/view-ui-plus-v1.3.20/src/components/icon/index.js` | `apps/01-clone-practice/src/components/icon/index.js` |
| 樣式入口 | `origin/source/view-ui-plus-v1.3.20/src/styles/common/index.less` | `apps/01-clone-practice/src/style/common/index.less` |
| iconfont 樣式 | `origin/source/view-ui-plus-v1.3.20/src/styles/common/iconfont/` | `apps/01-clone-practice/src/style/common/iconfont/` |

其中最核心的是 `icon.vue`。View UI Plus 的版本大致可以整理成：

```vue
<template>
    <i :class="classes" :style="styles"></i>
</template>
<script>
    const prefixCls = 'ivu-icon';

    export default {
        name: 'Icon',
        props: {
            type: {
                type: String,
                default: ''
            },
            size: [Number, String],
            color: String,
            custom: {
                type: String,
                default: ''
            }
        },
        computed: {
            classes () {
                return [
                    `${prefixCls}`,
                    {
                        [`${prefixCls}-${this.type}`]: this.type !== '',
                        [`${this.custom}`]: this.custom !== '',
                    }
                ];
            },
            styles () {
                let style = {};

                if (this.size) style['font-size'] = `${this.size}px`;
                if (this.color) style.color = this.color;

                return style;
            }
        }
    };
</script>
```

這段程式的重點有三個：

1. 固定加上基礎 class：`ivu-icon`。
2. 根據 `type` 補上圖標 class：`ivu-icon-${type}`。
3. 根據 `size`、`color` 補上 inline style。

你的仿寫版本把前兩個 props 轉成 Vue 3 `<script setup>` 的寫法：

```vue
<template>
    <i :class="classes" :style="styles"></i>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  type?: string
  size?: number
  color?: string
}>()

const classes = computed(() => [
  'my-icon',
  props.type ? `my-icon-${props.type}` : ''
])

const styles = computed(() => ({
  fontSize: props.size ? `${props.size}px` : undefined,
  color: props.color
}))
</script>
```

這個版本已經抓到 Icon 元件最主要的骨架：props 不是直接渲染內容，而是用來組合 class 與 style。

## 第一步：先定義元件 API

Icon 元件最小可用的 API 通常是：

| prop | 作用 | 範例 |
| --- | --- | --- |
| `type` | 指定要顯示哪個圖標 | `check-circle` |
| `size` | 指定圖標大小，單位 px | `24` |
| `color` | 指定圖標顏色 | `#19be6b` |
| `custom` | 讓使用者傳入外部 icon class | `my-extra-icon` |

在你的練習中，目前先做了 `type`、`size`、`color`：

```vue
<Icon type="check-circle" :size="56" color="#19be6b" />
```

這會被轉成接近下面的 DOM：

```html
<i
  class="my-icon my-icon-check-circle"
  style="font-size: 56px; color: #19be6b;"
></i>
```

這裡要注意：Icon 元件本身並不知道 `check-circle` 長什麼樣。它只負責產生 `my-icon-check-circle` 這個 class。真正的圖形內容，是由 Less 裡的 `:before { content: ... }` 決定。

## 第二步：用 class 接上 iconfont

你的樣式拆分是：

```text
src/style/index.less
  -> common/index.less
    -> iconfont/_variables.less
    -> iconfont/iconfont.less
    -> iconfont/_icons.less
```

`_variables.less` 負責放共用變數：

```less
@my-icon-font-family: "my-iconfont";
```

`iconfont.less` 負責註冊字型和基礎 class：

```less
@font-face {
  font-family: @my-icon-font-family;
  src: url('./fonts/iconfont.ttf?t=1780646724638') format('truetype');
}

.my-icon {
  font-family: @my-icon-font-family !important;
  font-size: 16px;
  font-style: normal;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
```

`_icons.less` 負責每個圖標名稱對應的字型碼位：

```less
.my-icon-check-circle:before {
  content: "\e77d";
}

.my-icon-close-circle:before {
  content: "\e781";
}
```

所以 `<Icon type="check-circle" />` 的完整顯示流程是：

```text
type="check-circle"
  -> my-icon-check-circle
  -> .my-icon-check-circle:before
  -> content: "\e77d"
  -> 使用 my-iconfont 字型顯示對應圖標
```

這也是為什麼下載 Iconfont 之後，不能只把字型檔放進專案，還要保留或整理 class 對應表。沒有 `_icons.less`，元件產生了 class 也不會顯示出圖標。

## 第三步：理解 `type` 和 `custom` 的差異

View UI Plus 的 `Icon` 同時支援 `type` 和 `custom`：

```js
classes () {
    return [
        `${prefixCls}`,
        {
            [`${prefixCls}-${this.type}`]: this.type !== '',
            [`${this.custom}`]: this.custom !== '',
        }
    ];
}
```

這兩個 prop 的設計目的不同。

`type` 是元件庫內建圖標的命名入口：

```vue
<Icon type="ios-add" />
```

它會依照固定前綴產生：

```text
ivu-icon ivu-icon-ios-add
```

`custom` 則是讓使用者繞過內建命名規則，直接傳入外部 class：

```vue
<Icon custom="my-company-icon-user" />
```

它會產生：

```text
ivu-icon my-company-icon-user
```

這個設計讓 Icon 元件更有彈性：元件庫可以有自己的內建 iconfont，使用者也可以接入公司自己的 iconfont。

如果要把你的仿寫版本補得更接近 View UI Plus，可以加入 `custom`：

```ts
const props = defineProps<{
  type?: string
  size?: number | string
  color?: string
  custom?: string
}>()

const classes = computed(() => [
  'my-icon',
  {
    [`my-icon-${props.type}`]: !!props.type,
    [props.custom as string]: !!props.custom
  }
])
```

這裡也可以順手把 `size` 從 `number` 擴充成 `number | string`，因為 View UI Plus 原始碼允許 `size: [Number, String]`。

## 第四步：讓元件能被元件庫匯出

Icon 不只是一個 `.vue` 檔，還要進入元件庫的匯出鏈。

你的結構目前是：

```text
src/components/icon/index.js
src/components/index.js
src/index.js
```

`src/components/icon/index.js`：

```js
import Icon from './icon.vue';
export default Icon;
```

`src/components/index.js`：

```js
export { default as Icon } from './icon';
```

`src/index.js` 會把所有元件整理成 plugin：

```js
import * as components from './components';

export const install = function(app, opts = {}) {
    Object.keys(MyUI).forEach(key => {
        app.component(key, MyUI[key]);
    });
}
```

這代表 Icon 可以透過兩種方式使用：

```js
import MyUI from '../src/index'
app.use(MyUI)
```

或：

```js
import { Icon } from '../src/index'
```

學元件庫時要特別留意這條鏈：單一元件完成後，還要被 `components/index.js` 和 `src/index.js` 接住，才算真正進入元件庫。

## 第五步：整理 Iconfont 檔案

你目前的做法是：

1. 從 Iconfont 下載圖標。
2. 把字型檔放到 `src/style/common/iconfont/fonts/`。
3. 把原本的 `.css` 改成 `.less`。
4. 把 class 前綴改成 `my-` 開頭。
5. 拆成 `_variables.less`、`iconfont.less`、`_icons.less`。

這個方向是合理的，因為它對照了 View UI Plus 的拆分方式：

```text
ionicons.less
  -> _ionicons-variables.less
  -> _ionicons-font.less
  -> _ionicons-icons.less
```

這種拆法的好處是責任清楚：

| 檔案 | 責任 |
| --- | --- |
| `_variables.less` | 管理字型名稱、路徑、前綴等變數 |
| `iconfont.less` | 註冊 `@font-face` 和基礎 `.my-icon` |
| `_icons.less` | 管理每個 icon class 到 content 的映射 |

如果未來 Iconfont 重新下載，最容易變動的是 `_icons.less` 和字型檔；基礎 class 與元件邏輯通常不需要跟著大改。

## 開發檢查清單

完成 Icon 元件時，可以用這份清單檢查：

- `Icon` 是否固定產生基礎 class，例如 `my-icon`。
- `type` 是否會轉成 `my-icon-${type}`。
- `size` 是否會轉成 `font-size: ${size}px`。
- `color` 是否會轉成 inline `color`。
- 樣式入口 `src/style/index.less` 是否有匯入 iconfont 樣式。
- `@font-face` 的字型路徑是否能被 Vite 正確載入。
- `_icons.less` 裡是否存在對應的 class，例如 `.my-icon-check-circle:before`。
- `src/components/index.js` 是否匯出 `Icon`。
- `src/index.js` 的 `install(app)` 是否能註冊 `Icon`。
- demo 是否能正常顯示 `<Icon type="check-circle" :size="56" color="#19be6b" />`。

## 小結

Icon 元件的本質不是「畫圖標」，而是「把元件 API 轉成 iconfont 需要的 class 與 style」。

可以用一句話記住它的設計：

```text
Icon.vue 管 class 和 style，iconfont Less 管圖標內容。
```

View UI Plus 的設計值得學的地方在於：元件邏輯非常薄，但命名規則、樣式入口、字型檔、class 映射和元件庫匯出鏈都很完整。仿寫時先把這些邊界建立起來，比一開始追求大量圖標更重要。
