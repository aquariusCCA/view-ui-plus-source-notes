# Avatar Public Contract And Content Priority：從 props 到內容分支

## 0. 原始筆記問題分析

原本筆記已經指出要整理 `src`、`icon` 與 slot 文字的 fallback 順序，但還沒有把 runtime props、type declaration、template branch 與圖片錯誤事件放在同一張圖裡。

`Avatar` 很適合用來練習「內容來源優先序」的閱讀，因為它同時支援：

1. 圖片頭像：`src`。
2. 圖標頭像：`icon`、`customIcon`。
3. 文字頭像：default slot。
4. 形狀與尺寸：`shape`、`size`。
5. 錯誤事件：`on-error`。

其中最容易誤判的是圖片錯誤處理。`Avatar` 不會在 `img error` 後自動改成下一個 fallback branch；它只 emit 事件，讓外部自行處理。

## 1. 本章定位

本章是一篇 public API 與內容優先序對照筆記，專門分析 `Avatar` 對外可以接收哪些 props，以及這些輸入如何決定渲染圖片、圖標或文字。

本章不深入講尺寸 mixin、文字縮放和列表聚合。尺寸與縮放會放到 `03-avatar-size-style-and-text-scaling.md`；`AvatarList` 會放到 `04-avatar-list-aggregation-tooltip-and-excess.md`。

## 2. Runtime Props 對照表

`avatar.vue` 自身宣告的 props 如下。

| Runtime prop | Runtime 限制 / default | Type declaration | 閱讀重點 |
| --- | --- | --- | --- |
| `shape` | `circle`、`square`，預設 `circle` | `shape?: 'circle' \| 'square'` | 決定根節點形狀 class。 |
| `size` | `String` 或 `Number`，預設讀 `$VIEWUI.size` 或 `default` | `size?: 'large' \| 'small' \| 'default'` | runtime 支援自訂數字尺寸，但 `.d.ts` 沒有表達。 |
| `src` | `String` | `src?: string` | 圖片頭像來源；只要存在就進入圖片 branch。 |
| `icon` | `String` | `icon?: string` | 傳給內部 `Icon` 的 `type`。 |
| `customIcon` | `String`，預設 `''` | `'custom-icon'?: string` | 傳給內部 `Icon` 的 `custom`。 |

`Avatar` 宣告的 emit：

| Runtime emit | Type declaration | 觸發時機 |
| --- | --- | --- |
| `on-error` | `onOnError?: (event?: any) => any` | `<img>` 觸發 `error` 時，透過 `handleError(e)` emit。 |

這張表最重要的是：`src`、`icon`、`customIcon`、default slot 都是內容輸入，但它們不是平行組合，而是由 template branch 決定優先序。

## 3. Props 分組理解

`Avatar` 的 props 可以分成三組。

| 分組 | Props / slot | 責任 |
| --- | --- | --- |
| 內容來源 | `src`、`icon`、`customIcon`、default slot | 決定頭像內部渲染圖片、圖標或文字。 |
| 視覺修飾 | `shape`、`size` | 決定形狀、預設尺寸 class 或自訂 inline size。 |
| 事件邊界 | `on-error` | 告知外部圖片載入失敗，但不改變內部 branch。 |

閱讀 `Avatar` 時應先判斷內容來源，再判斷形狀與尺寸，最後才看錯誤事件如何交給外部。

## 4. Template Branch 優先序

`Avatar` 的 template 是三段互斥分支：

```vue
<span :class="classes" :style="styles">
    <img :src="src" v-if="src" @error="handleError">
    <Icon :type="icon" :custom="customIcon" v-else-if="icon || customIcon"></Icon>
    <span ref="children" :class="[prefixCls + '-string']" :style="childrenStyle" v-else><slot></slot></span>
</span>
```

優先序可以整理成：

```txt
src 有值
  -> image branch
else if icon || customIcon
  -> icon branch
else
  -> default slot text branch
```

因此幾個組合要特別注意：

| 組合 | 實際結果 |
| --- | --- |
| `src` + `icon` | 渲染 `<img>`，`icon` 不使用。 |
| `src` + default slot | 渲染 `<img>`，slot 不渲染。 |
| `icon` + default slot | 渲染 `Icon`，slot 不渲染。 |
| `custom-icon` + default slot | 渲染 `Icon`，slot 不渲染。 |
| 沒有 `src/icon/customIcon` | 才會渲染 default slot。 |

這裡的「fallback」是初始內容選擇，不是圖片失敗後自動改走下一個分支。

## 5. 圖片錯誤事件邊界

圖片 branch 只有一個事件處理：

```vue
<img :src="src" v-if="src" @error="handleError">
```

對應 methods：

```js
handleError (e) {
    this.$emit('on-error', e);
}
```

這表示圖片載入失敗時，`Avatar` 只做一件事：emit `on-error`。它不會：

1. 把 `src` 清空。
2. 改用 `icon`。
3. 改用 default slot。
4. 內部記錄錯誤狀態。

官方 example 的錯誤處理是外部改變 `src`：

```vue
<Avatar :src="src" size="large" @on-error="handleError" />
```

```js
handleError () {
    this.src = '.../avatar';
}
```

所以這裡的控制邊界很清楚：`Avatar` 負責通知錯誤，父層負責決定 fallback 策略。

## 6. `Icon` 作為內容分支

`Avatar` 內部直接組合 `Icon`：

```vue
<Icon :type="icon" :custom="customIcon" v-else-if="icon || customIcon"></Icon>
```

這裡有兩個閱讀重點。

第一，`Avatar` 不自己處理 icon class，而是把 `icon` / `customIcon` 交給 `Icon` 元件。這延續了 `Icon` 作為基礎視覺原子的角色。

第二，`icon` 與 `customIcon` 都會讓根節點產生 `ivu-avatar-icon` class：

```js
[`ivu-avatar-icon`]: !!this.icon || !!this.customIcon
```

所以 icon 模式的視覺大小，既來自 `Avatar` 的根 class，也來自內部 `Icon` 元件的 class system。

## 7. Class 與內容狀態

`classes` computed 會產生以下 class：

```js
[
    'ivu-avatar',
    `ivu-avatar-${this.shape}`,
    {
        'ivu-avatar-image': !!this.src,
        'ivu-avatar-icon': !!this.icon || !!this.customIcon,
        [`ivu-avatar-${this.size}`]: oneOf(this.size, sizeList)
    }
]
```

整理成表格：

| Class | 觸發條件 | 用途 |
| --- | --- | --- |
| `ivu-avatar` | 永遠存在 | 根樣式。 |
| `ivu-avatar-circle` | `shape="circle"` | 圓形語意 class；實際圓形主要由 size mixin 的 `border-radius: 50%` 支撐。 |
| `ivu-avatar-square` | `shape="square"` | 方形小圓角樣式。 |
| `ivu-avatar-image` | `src` 有值 | 圖片模式背景透明。 |
| `ivu-avatar-icon` | `icon` 或 `customIcon` 有值 | icon 模式字體尺寸。 |
| `ivu-avatar-large` / `small` / `default` | `size` 是預設尺寸字串 | 套用 less 中的預設尺寸。 |

這裡可以看出 runtime branch 與 class 並不是完全一樣的層次：template branch 決定渲染哪種內容，class 則讓 style system 知道目前是圖片、icon、形狀與尺寸狀態。

## 8. Type Declaration 落差

`types/avatar.d.ts` 對 `Avatar` 的描述大致完整，但 `size` 有重要落差。

runtime：

```js
size: {
    type: [String, Number],
    default () {
        const global = getCurrentInstance().appContext.config.globalProperties;
        return !global.$VIEWUI || global.$VIEWUI.size === '' ? 'default' : global.$VIEWUI.size;
    }
}
```

type declaration：

```ts
size?: 'large' | 'small' | 'default';
```

官方 example：

```vue
<Avatar src="..." size="64" shape="square" />
<Avatar size="42">U</Avatar>
```

這代表 runtime 實際允許自訂數字尺寸，但 TypeScript contract 沒有完整表達。閱讀筆記時應把這種差異記下來，因為它會影響使用者在 TS 專案中的實際體驗。

## 9. Public Contract 常見誤區

| 誤區 | 正確理解 |
| --- | --- |
| `Avatar` 圖片失敗會自動 fallback 到 icon 或文字 | runtime 只 emit `on-error`，fallback 要由外部更新 props。 |
| `src`、`icon`、slot 會疊加 | 三者是互斥 template branch。 |
| `customIcon` 是單獨渲染路徑 | 它和 `icon` 一樣都進入內部 `Icon` 分支。 |
| `.d.ts` 完整描述了 `size` | runtime 支援 `String | Number`，`.d.ts` 只寫三個預設字串。 |
| `Avatar` 有互動狀態 | 它沒有 click handler，也沒有內部錯誤狀態；主要是展示與錯誤通知。 |

## 10. 本章總結

`Avatar` 的 public contract 可以用一句話概括：它根據 `src`、`icon/customIcon`、default slot 的固定優先序選擇內容，根據 `shape` 與 `size` 產生樣式，並在圖片錯誤時把事件交回外部。

理解這個元件的關鍵，是不要把「內容 fallback」誤讀成「圖片失敗自動 fallback」。source 裡沒有這個內部降級流程。

## 11. 自我檢查問題

1. `Avatar` 的 template branch 優先序是什麼？
2. 同時傳入 `src` 與 `icon` 時，`Icon` 會不會渲染？
3. 圖片載入錯誤時，`Avatar` 內部會做哪些事、不會做哪些事？
4. `customIcon` 最後是交給哪個子元件處理？
5. `size` 的 runtime contract 和 `.d.ts` contract 有什麼差異？
