# Avatar Public Contract And Content Priority：從 Props 到內容分支

## 0. 原始筆記問題分析

這份原始筆記的主題已經相當明確：它想整理 `Avatar` 元件的 public contract，也就是使用者可以透過哪些 props、slot 與事件來控制頭像內容。原始筆記也已經抓到這個元件最重要的閱讀重點：`src`、`icon`、`customIcon` 與 default slot 並不是平行顯示，而是依照 template branch 形成固定的內容優先序。

不過，若要把這份筆記放進長期學習用的個人知識庫，還可以再補強幾個面向。

第一，原始筆記雖然列出了 props 與 branch，但還需要更明確地建立「public contract」的閱讀框架。閱讀元件庫時，不能只看 `props` 表格，而要同時對照 runtime source、template、emit、type declaration 與官方 example。這樣才能知道某個 API 到底只是型別上存在，還是真正在 runtime 中被使用。

第二，原始筆記提到圖片錯誤不會自動 fallback，但這個觀念值得獨立強化。因為很多使用者看到 `src + icon + slot` 會直覺以為它們形成一套「圖片失敗後改用 icon，再失敗後改用文字」的降級鏈。但從目前筆記摘錄的 template 與 `handleError()` 來看，`Avatar` 只是根據初始輸入選擇渲染分支，圖片錯誤時只 emit `on-error`，不負責改變內容來源。

第三，原始筆記已經指出 `size` 的 runtime contract 和 `.d.ts` 存在落差，但還可以補上「這種落差對使用者與元件庫維護者各自代表什麼」。對使用者來說，這會影響 TypeScript 使用體驗；對元件庫維護者來說，這是 runtime 行為和型別聲明需要同步維護的例子。

第四，原始筆記目前偏向 source note，已經很精準，但還可以進一步改寫成教學型章節：先說明 `Avatar` 是什麼，再建立 public contract 的閱讀方法，最後把 template branch、事件邊界、class 狀態與型別落差串成一個完整心智模型。

---

## 1. 本章定位

本章是一篇 `View UI Plus` 的 `Avatar` 元件 public contract 閱讀筆記，重點是理解「使用者傳入的 props / slot / event 如何對應到元件內部的渲染分支與行為邊界」。

這篇筆記屬於 **原始碼閱讀筆記 + API 行為分析筆記**。它不只是列出 `Avatar` 有哪些 props，而是要回答以下問題：

1. `Avatar` 對外暴露哪些輸入？
2. 這些輸入可以分成哪些責任類型？
3. `src`、`icon`、`customIcon`、default slot 之間的優先序是什麼？
4. 圖片載入失敗時，元件內部會做什麼，又不會做什麼？
5. runtime source、template branch、style class 與 `.d.ts` 之間是否一致？
6. 使用者在 Vue / TypeScript 專案中應該如何正確理解這個元件？

本章不深入分析三個主題：

- `size` 如何轉成 inline style、Less class 與文字縮放。
- `childrenStyle`、`setScale()` 與 DOM measurement 的實作細節。
- `AvatarList` 如何聚合多個 `Avatar`、包裹 Tooltip 與處理超出數量。

這些內容適合拆到後續筆記，例如：

- `03-avatar-size-style-and-text-scaling.md`
- `04-avatar-list-aggregation-tooltip-and-excess.md`

---

## 2. 學習前先建立的基本觀念

### 2.1 什麼是 public contract？

在元件庫裡，public contract 指的是「使用者可以穩定依賴的對外介面」。以 Vue 元件來說，常見的 public contract 包含：

| 類型 | 在 Vue 元件中的形式 | 對使用者的意義 |
| --- | --- | --- |
| Props | `shape`、`size`、`src`、`icon`、`customIcon` | 使用者可以傳入資料控制元件狀態。 |
| Slots | default slot | 使用者可以放入自訂內容。 |
| Events | `on-error` | 元件在特定情境下通知父層。 |
| Type declaration | `types/avatar.d.ts` | TypeScript 專案中的型別提示與限制。 |
| Example | 官方範例 | 展示作者預期的使用方式。 |

閱讀元件庫時，不能只看其中一個來源。`props` 代表 runtime 接收能力，`.d.ts` 代表 TypeScript 對外描述，example 代表官方展示的使用方式。三者理想上應該一致，但實務上可能有落差。因此，閱讀 public contract 時要同時比對：

```txt
runtime props
  -> template branch
  -> methods / emit
  -> computed class / style
  -> type declaration
  -> official examples
```

### 2.2 什麼是內容來源優先序？

`Avatar` 是展示型元件，但它支援多種內容來源：

1. 圖片頭像：`src`
2. 圖標頭像：`icon`
3. 自訂圖標頭像：`customIcon`
4. 文字頭像：default slot

這些內容來源不會同時顯示在同一個頭像中。`Avatar` 的 template 會按照固定順序選擇其中一種。這就是本章的核心：**你要先理解內容分支的優先序，才能正確理解 props 的效果。**

### 2.3 fallback 不等於 error fallback

初學者容易把「內容優先序」理解成「錯誤 fallback 機制」。這兩者不同。

內容優先序是指元件在 render 時根據目前 props 決定使用哪個 branch。例如：

```txt
有 src -> 顯示圖片
沒有 src 但有 icon/customIcon -> 顯示 Icon
前兩者都沒有 -> 顯示 slot 文字
```

錯誤 fallback 則是指圖片載入失敗之後，元件是否自動改用下一個內容來源。根據目前筆記整理的 runtime 行為，`Avatar` 沒有內建這種自動降級流程。圖片錯誤時，它只 emit `on-error`，由父層決定下一步要改 `src`、改成 icon，或顯示其他內容。

---

## 3. 整體概覽

本章可以把 `Avatar` 的 public contract 整理成四層。

```txt
使用者輸入
  -> props / default slot / event listener

內容選擇
  -> src branch
  -> icon/customIcon branch
  -> default slot branch

狀態樣式
  -> ivu-avatar
  -> ivu-avatar-image
  -> ivu-avatar-icon
  -> ivu-avatar-circle / ivu-avatar-square
  -> ivu-avatar-large / small / default

事件邊界
  -> img error
  -> handleError(e)
  -> emit on-error
  -> 父層決定 fallback 策略
```

這裡可以看出 `Avatar` 的設計非常典型：它是一個基礎展示元件，不主動管理複雜狀態，而是根據輸入決定渲染結果，並在圖片失敗時把控制權交還給父層。

從元件作者視角來看，這樣的設計有兩個好處：

1. `Avatar` 本身保持簡單，不需要內建太多業務判斷。
2. 父層可以根據不同場景決定圖片錯誤後要換圖、顯示 icon、顯示縮寫，或記錄錯誤。

---

## 4. 核心內容逐步講解

### 4.1 Runtime props：`Avatar` 對外接收什麼？

根據原始筆記整理，`avatar.vue` 自身宣告的 props 主要有五個：

| Runtime prop | Runtime 限制 / default | Type declaration | 閱讀重點 |
| --- | --- | --- | --- |
| `shape` | `circle`、`square`，預設 `circle` | `shape?: 'circle' \| 'square'` | 決定根節點形狀 class。 |
| `size` | `String` 或 `Number`，預設讀 `$VIEWUI.size` 或 `default` | `size?: 'large' \| 'small' \| 'default'` | runtime 支援自訂數字尺寸，但 `.d.ts` 沒有完整表達。 |
| `src` | `String` | `src?: string` | 圖片頭像來源；只要存在就進入圖片 branch。 |
| `icon` | `String` | `icon?: string` | 傳給內部 `Icon` 的 `type`。 |
| `customIcon` | `String`，預設 `''` | `'custom-icon'?: string` | 傳給內部 `Icon` 的 `custom`。 |

這張表不能只當成 API 清單來背，而要看出它背後的責任分工。

`shape` 與 `size` 是視覺修飾類 props。它們不直接決定頭像內部要顯示圖片、圖標還是文字，而是決定外層容器的形狀與尺寸。

`src`、`icon`、`customIcon` 則是內容來源類 props。它們會直接影響 template branch。尤其是 `src`，只要有值，就會優先進入圖片分支。

default slot 雖然不是 prop，但它也是內容來源之一。不過 slot 的優先級最低，只有在沒有 `src`、沒有 `icon`、也沒有 `customIcon` 時才會被渲染。

### 4.2 Props 分組：先看內容，再看樣式，最後看事件

可以把 `Avatar` 的對外輸入分成三組：

| 分組 | Props / slot / event | 責任 |
| --- | --- | --- |
| 內容來源 | `src`、`icon`、`customIcon`、default slot | 決定頭像內部渲染圖片、圖標或文字。 |
| 視覺修飾 | `shape`、`size` | 決定形狀、預設尺寸 class 或自訂 inline size。 |
| 事件邊界 | `on-error` | 告知外部圖片載入失敗，但不改變內部 branch。 |

這個分組很重要，因為它會影響你的閱讀順序。

閱讀 `Avatar` 時，不建議一開始就陷入 `classes` 或 `styles` 的細節，而是應該先問：

1. 這次頭像內容來源是什麼？
2. 它會走圖片、Icon 還是 slot branch？
3. 外層 shape / size 會如何影響視覺？
4. 如果圖片錯誤，控制權在哪裡？

這樣閱讀會比單純逐行看 code 更有效率。

### 4.3 Template branch：三段互斥內容分支

原始筆記摘錄的 template 如下：

```vue
<span :class="classes" :style="styles">
    <img :src="src" v-if="src" @error="handleError">
    <Icon :type="icon" :custom="customIcon" v-else-if="icon || customIcon"></Icon>
    <span ref="children" :class="[prefixCls + '-string']" :style="childrenStyle" v-else><slot></slot></span>
</span>
```

這段 template 是本章最核心的程式碼。它代表 `Avatar` 的內容選擇不是透過複雜方法完成，而是直接透過 Vue 的 `v-if / v-else-if / v-else` 建立三段互斥分支。

可以整理成以下流程：

```txt
src 有值
  -> 渲染 <img>
else if icon 或 customIcon 有值
  -> 渲染 <Icon>
else
  -> 渲染 default slot 文字容器
```

也就是說，只要 `src` 有值，`icon` 與 slot 都不會參與渲染。只要沒有 `src`，但有 `icon` 或 `customIcon`，slot 也不會參與渲染。slot 是最後一層 fallback，但這個 fallback 只發生在 render 條件判斷階段，不代表圖片載入錯誤後會自動切換。

### 4.4 常見組合的實際渲染結果

將 branch 優先序套用到常見使用方式，可以得到以下結果：

| 使用方式 | 實際渲染結果 | 說明 |
| --- | --- | --- |
| `<Avatar src="..." />` | 渲染 `<img>` | 圖片 branch 優先。 |
| `<Avatar src="..." icon="ios-person" />` | 渲染 `<img>` | `icon` 被忽略，因為 `src` 優先。 |
| `<Avatar src="...">U</Avatar>` | 渲染 `<img>` | default slot 不會渲染。 |
| `<Avatar icon="ios-person">U</Avatar>` | 渲染 `Icon` | slot 不會渲染。 |
| `<Avatar custom-icon="custom-user" />` | 渲染 `Icon` | `customIcon` 交給內部 `Icon`。 |
| `<Avatar>U</Avatar>` | 渲染 default slot | 沒有圖片與 icon 時才使用文字。 |

這些例子可以幫你建立一個很實用的判斷方式：**先看 `src`，再看 `icon/customIcon`，最後才看 slot。**

### 4.5 圖片錯誤事件：只通知，不接管 fallback

圖片 branch 上只有一個錯誤事件：

```vue
<img :src="src" v-if="src" @error="handleError">
```

對應的 method 是：

```js
handleError (e) {
    this.$emit('on-error', e);
}
```

這段邏輯非常簡潔，也很容易被誤讀。它只做一件事：把原生圖片錯誤事件往外 emit 成 `on-error`。

它不會做以下事情：

1. 不會把 `src` 清空。
2. 不會把 branch 改成 `Icon`。
3. 不會改用 default slot。
4. 不會在內部維護 `isError` 或 `hasError` 狀態。
5. 不會自動替換成預設圖片。

因此，`Avatar` 的錯誤處理邊界非常明確：元件負責通知，父層負責決策。

如果父層希望圖片錯誤後改用另一張圖，可以在 `on-error` 中修改 `src`。如果父層希望圖片錯誤後改用文字或 icon，則需要調整傳給 `Avatar` 的 props，例如移除或清空 `src`，並提供 `icon` 或 slot。

### 4.6 官方 example 展示的控制邊界

原始筆記整理到官方 example 的錯誤處理模式：

```vue
<Avatar :src="src" size="large" @on-error="handleError" />
```

```js
handleError () {
    this.src = '.../avatar';
}
```

這個 example 的重點不是「錯誤時一定要換成另一張圖片」，而是展示控制權的位置：圖片錯誤後，`Avatar` 不自己決定怎麼 fallback，而是讓父層在 `handleError()` 中修改資料。

這種設計在元件庫裡很常見。基礎元件通常不應該假設業務需求，因為不同產品對圖片失敗的處理可能不同：

| 場景 | 圖片失敗後可能策略 |
| --- | --- |
| 使用者頭像 | 改成姓名縮寫、預設人像或重新請求 CDN。 |
| 團隊 Logo | 改成公司名稱縮寫或預設 Logo。 |
| 通知列表 | 改成 icon，例如 warning、info、success。 |
| 後台管理系統 | 顯示破圖提示、記錄錯誤或使用預設圖。 |

如果 `Avatar` 內部硬寫 fallback 規則，反而會限制使用者。

### 4.7 `Icon` 作為內容分支：`Avatar` 不自己實作圖標系統

當沒有 `src`，但有 `icon` 或 `customIcon` 時，template 會渲染：

```vue
<Icon :type="icon" :custom="customIcon" v-else-if="icon || customIcon"></Icon>
```

這表示 `Avatar` 並不自己處理 icon class 的完整邏輯，而是把圖標渲染責任交給 `Icon` 元件。

這裡有兩層責任分工：

| 層級 | 負責內容 |
| --- | --- |
| `Avatar` | 判斷現在是否進入 icon branch，並提供頭像容器樣式。 |
| `Icon` | 根據 `type` 或 `custom` 實際渲染圖標。 |

另外，`Avatar` 的 `classes` computed 會根據 `icon` 或 `customIcon` 加上 icon 狀態 class：

```js
[`ivu-avatar-icon`]: !!this.icon || !!this.customIcon
```

所以 icon 模式的視覺結果不是只靠 `Icon`，也不是只靠 `Avatar`，而是兩者共同形成：

```txt
Avatar root class
  -> 提供頭像容器、形狀、尺寸、icon 模式樣式

Icon component
  -> 提供具體圖標渲染
```

這種組合方式是元件庫常見的設計：基礎展示元件彼此組合，而不是每個元件都重複實作相同能力。

### 4.8 Class 與內容狀態：branch 決定內容，class 決定樣式語意

原始筆記整理到 `classes` computed 大致產生以下 class：

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

可以整理成表格：

| Class | 觸發條件 | 用途 |
| --- | --- | --- |
| `ivu-avatar` | 永遠存在 | 頭像根節點基礎樣式。 |
| `ivu-avatar-circle` | `shape="circle"` | 圓形語意 class。 |
| `ivu-avatar-square` | `shape="square"` | 方形小圓角樣式。 |
| `ivu-avatar-image` | `src` 有值 | 圖片模式樣式，例如背景透明。 |
| `ivu-avatar-icon` | `icon` 或 `customIcon` 有值 | icon 模式樣式，例如 icon 字體尺寸。 |
| `ivu-avatar-large` / `ivu-avatar-small` / `ivu-avatar-default` | `size` 是預設尺寸字串 | 套用 Less 中預設尺寸。 |

這裡要注意一個閱讀技巧：template branch 和 class computed 是兩個層次。

template branch 回答的是：

> 這個頭像內部到底渲染 `<img>`、`Icon`，還是 slot？

class computed 回答的是：

> 根節點應該具有哪些樣式狀態，讓 Less 可以渲染出正確視覺？

兩者互相配合，但不能混為一談。例如 `ivu-avatar-image` 不是渲染圖片本身的原因；真正渲染圖片的是 template 裡的 `<img v-if="src">`。`ivu-avatar-image` 則是讓圖片模式的外觀正確。

### 4.9 Type declaration 落差：`size` 是最值得記錄的地方

原始筆記指出 `types/avatar.d.ts` 對 `Avatar` 的描述大致完整，但 `size` 有重要落差。

runtime 中 `size` 支援 `String` 或 `Number`：

```js
size: {
    type: [String, Number],
    default () {
        const global = getCurrentInstance().appContext.config.globalProperties;
        return !global.$VIEWUI || global.$VIEWUI.size === '' ? 'default' : global.$VIEWUI.size;
    }
}
```

但 type declaration 寫的是：

```ts
size?: 'large' | 'small' | 'default';
```

官方 example 又展示了：

```vue
<Avatar src="..." size="64" shape="square" />
<Avatar size="42">U</Avatar>
```

這代表 runtime 實際允許自訂尺寸，但 `.d.ts` 沒有完整描述這件事。

對使用者來說，這會造成一個情境：runtime 可以跑，但 TypeScript 可能不認。也就是說，使用者在 Vue template 或 TSX 中傳入自訂數字尺寸時，可能會遇到型別提示不完整或型別限制過窄的問題。

對元件庫維護者來說，這是一個型別同步問題。當 runtime contract 支援更寬的輸入時，`.d.ts` 應該要反映出來，否則會造成「文件、example、runtime、type declaration」之間的不一致。

---

## 5. 表格整理

### 5.1 Public contract 總表

| 類型 | 名稱 | 對外用法 | Runtime 行為 | 閱讀重點 |
| --- | --- | --- | --- | --- |
| Prop | `shape` | `<Avatar shape="circle" />`、`<Avatar shape="square" />` | 產生形狀 class | 控制外觀，不控制內容來源。 |
| Prop | `size` | `<Avatar size="large" />`、`<Avatar :size="42" />` | 預設尺寸走 class，自訂尺寸走 inline style | runtime 和 `.d.ts` 有落差。 |
| Prop | `src` | `<Avatar src="..." />` | 進入圖片 branch | 內容優先序最高。 |
| Prop | `icon` | `<Avatar icon="ios-person" />` | 傳給內部 `Icon` 的 `type` | 只有沒有 `src` 時才會渲染。 |
| Prop | `customIcon` / `custom-icon` | `<Avatar custom-icon="..." />` | 傳給內部 `Icon` 的 `custom` | 和 `icon` 共用 Icon branch。 |
| Slot | default slot | `<Avatar>U</Avatar>` | 進入文字 branch | 優先序最低。 |
| Event | `on-error` | `@on-error="handleError"` | 圖片 error 時 emit | 只通知父層，不自動 fallback。 |

### 5.2 內容優先序表

| 優先序 | 條件 | 渲染內容 | 是否繼續檢查下一層 |
| --- | --- | --- | --- |
| 1 | `src` 有值 | `<img :src="src">` | 否 |
| 2 | 沒有 `src`，但有 `icon` 或 `customIcon` | `<Icon :type="icon" :custom="customIcon">` | 否 |
| 3 | 沒有 `src/icon/customIcon` | default slot 文字容器 | 最後分支 |

這張表是本章最重要的速查表。只要遇到 `Avatar` 顯示結果和預期不同，就先回來檢查這張表。

### 5.3 錯誤處理責任分工表

| 階段 | 責任方 | 動作 | 說明 |
| --- | --- | --- | --- |
| 圖片載入 | 瀏覽器 / `<img>` | 嘗試載入 `src` | 原生圖片行為。 |
| 圖片失敗 | `<img>` | 觸發 `error` | template 綁定 `@error="handleError"`。 |
| 事件轉發 | `Avatar` | `$emit('on-error', e)` | 元件只負責通知。 |
| fallback 決策 | 父層元件 | 修改 `src`、改傳 `icon`、顯示文字等 | 業務策略留給外部。 |

---

## 6. 範例或情境說明

### 6.1 圖片優先於 icon

```vue
<Avatar
  src="https://example.com/user.png"
  icon="ios-person"
/>
```

這個寫法最後會顯示圖片，不會顯示 `ios-person`。原因是 template 的第一個 branch 是：

```vue
<img :src="src" v-if="src" @error="handleError">
```

只要 `src` 有值，後面的 `v-else-if="icon || customIcon"` 就不會執行。

### 6.2 圖片失敗時由父層替換圖片

```vue
<template>
  <Avatar :src="avatarSrc" size="large" @on-error="handleAvatarError" />
</template>

<script>
export default {
  data () {
    return {
      avatarSrc: 'https://example.com/broken.png'
    };
  },
  methods: {
    handleAvatarError () {
      this.avatarSrc = 'https://example.com/default-avatar.png';
    }
  }
};
</script>
```

這個例子中，fallback 策略寫在父層。`Avatar` 不知道也不需要知道「預設圖片」是哪一張，它只負責在錯誤發生時通知父層。

### 6.3 圖片失敗後改成 icon 的思路

如果父層希望圖片失敗後改用 icon，概念上需要讓 `src` 不再有值，並提供 `icon`。

```vue
<template>
  <Avatar
    :src="avatarSrc"
    icon="ios-person"
    @on-error="handleAvatarError"
  />
</template>

<script>
export default {
  data () {
    return {
      avatarSrc: 'https://example.com/broken.png'
    };
  },
  methods: {
    handleAvatarError () {
      this.avatarSrc = '';
    }
  }
};
</script>
```

當 `avatarSrc` 變成空字串後，`src` branch 不成立，template 才有機會進入 `icon || customIcon` branch。

這個例子也再次說明：`icon` 不是圖片錯誤時自動出現，而是父層改變 props 後，下一次 render 才進入 icon branch。

### 6.4 使用 slot 顯示姓名縮寫

```vue
<Avatar>SL</Avatar>
```

這種寫法會進入 default slot branch，適合做文字頭像。但只要加入 `src` 或 `icon`，slot 就不會被渲染。

```vue
<Avatar src="https://example.com/user.png">SL</Avatar>
```

上面這段最後顯示圖片，不會顯示 `SL`。

---

## 7. 閱讀路線或學習路線

### 7.1 第一次閱讀路線

第一次閱讀這個主題時，建議不要從 `styles` 或 Less 開始，而是按以下順序：

1. 先讀 `types/avatar.d.ts`，建立 `Avatar` 對外 API 的第一印象。
2. 再讀官方 example，觀察實際展示了哪些使用方式，例如圖片、icon、文字、錯誤處理與自訂尺寸。
3. 回到 `avatar.vue` 的 `props`，確認 runtime 實際支援哪些輸入。
4. 閱讀 template branch，理解 `src`、`icon/customIcon`、slot 的優先序。
5. 閱讀 `handleError()`，確認圖片錯誤時元件只 emit 事件。
6. 最後閱讀 `classes` computed，將內容分支和樣式狀態連起來。

### 7.2 深入閱讀路線

當你已經理解 public contract 後，可以進一步往下讀：

1. 讀 `size` 的 runtime 實作，確認預設尺寸、自訂尺寸與 `$VIEWUI.size` 的關係。
2. 讀 `styles` computed，確認自訂數字尺寸如何轉成 inline style。
3. 讀 `childrenStyle` 與 `setScale()`，理解文字頭像如何根據寬度自動縮放。
4. 讀 `avatar.less`，把 class 對應到實際 CSS。
5. 對照 `.d.ts`，記錄 runtime 和型別宣告是否一致。
6. 讀 consumer，例如其他元件如何把 `Avatar` 當成展示原子使用。

### 7.3 可以暫時跳過的部分

如果本章目標只是理解 public contract，可以先跳過：

- `AvatarList` 的列表聚合邏輯。
- Tooltip 包裹邏輯。
- `avatar-list.less` 的重疊樣式。
- 文字縮放的 DOM measurement 細節。
- 全域 install 與 component registry。

這些內容不是不重要，而是屬於後續章節。先建立 `Avatar` 單元件的內容優先序，後面再看 `AvatarList` 會更順。

---

## 8. 常見誤區

| 誤區 | 為什麼容易誤解 | 正確理解 |
| --- | --- | --- |
| `Avatar` 圖片失敗會自動 fallback 到 icon 或文字 | 因為 template 裡同時有 `img`、`Icon`、slot，容易被誤讀成錯誤降級鏈 | runtime 只 emit `on-error`，fallback 要由父層更新 props。 |
| `src`、`icon`、slot 會疊加顯示 | 使用者可能以為這些都是內容插槽的一部分 | 三者是互斥 branch，`src` 優先級最高，slot 最低。 |
| `customIcon` 是另一套獨立渲染流程 | 名稱看起來像獨立功能 | `customIcon` 和 `icon` 一樣都進入內部 `Icon` 分支。 |
| `.d.ts` 一定完整描述 runtime 能力 | TypeScript 使用者通常依賴型別檔理解 API | `size` runtime 支援 `String | Number`，但 `.d.ts` 只寫三個預設字串。 |
| `Avatar` 是互動元件 | 頭像在產品中常可點擊，所以容易以為元件內建互動 | 根據本章筆記整理，`Avatar` 主要是展示與錯誤通知，沒有內建 click handler。 |
| `ivu-avatar-image` 負責渲染圖片 | class 名稱容易讓人以為它是圖片渲染來源 | 圖片由 template 的 `<img v-if="src">` 渲染，class 只負責圖片模式樣式。 |

---

## 9. 本章總結

`Avatar` 的 public contract 可以用一條主線理解：

```txt
使用者提供內容來源
  -> src / icon / customIcon / default slot

template 根據固定優先序選擇內容
  -> src 優先
  -> 其次 icon/customIcon
  -> 最後 default slot

computed class 補上樣式狀態
  -> image / icon / shape / size

圖片錯誤時只 emit 事件
  -> 父層自行決定 fallback 策略
```

這個元件的學習價值不在於程式碼多複雜，而在於它展示了一個元件庫常見的設計原則：**基礎元件應該提供清楚、可組合的介面，但不要擅自接管業務決策。**

`Avatar` 不主動判斷圖片失敗後要顯示什麼，因為這屬於父層應用場景。它只把錯誤事件向外拋出，讓使用者決定要換圖、改 icon、顯示文字或做其他處理。

另一個重要收穫是：閱讀元件庫時，`.d.ts` 很重要，但不能取代 runtime source。`Avatar` 的 `size` 就是一個典型例子。runtime 實際支援自訂尺寸，但 type declaration 沒有完整表達，因此要同時對照 source、type 與 example，才能建立正確的 public contract。

---

## 10. 自我檢查問題

1. `Avatar` 的內容來源有哪些？請按照優先序排列。
2. 同時傳入 `src` 和 `icon` 時，最後會渲染圖片還是 icon？為什麼？
3. 同時傳入 `icon` 和 default slot 時，slot 會不會被渲染？為什麼？
4. `customIcon` 最後是由 `Avatar` 自己渲染，還是交給其他子元件？
5. 圖片載入錯誤時，`Avatar` 內部會做什麼？
6. 圖片載入錯誤時，`Avatar` 內部不會做哪些事情？
7. 如果想讓圖片失敗後改成 icon，父層應該怎麼處理？
8. `ivu-avatar-image` 和 `<img v-if="src">` 的責任差異是什麼？
9. `size` 的 runtime contract 和 `.d.ts` contract 有什麼落差？
10. 為什麼閱讀元件庫時不能只看 `.d.ts`？

---

## 11. 後續延伸方向

這份筆記之後可以延伸成以下主題。

### 11.1 `Avatar` 尺寸系統與文字縮放

可以進一步分析：

- `sizeList` 如何判斷預設尺寸。
- `styles` 如何處理自訂數字尺寸。
- `childrenStyle` 如何控制文字縮放。
- `setScale()` 如何讀取 DOM 寬度並計算 scale。
- `mounted()`、`updated()` 與 watcher 為什麼都可能需要重新計算。

### 11.2 `Avatar` 樣式系統與 Less 對照

可以進一步分析：

- `ivu-avatar` 根樣式。
- `ivu-avatar-circle` 和 `ivu-avatar-square` 的差異。
- `ivu-avatar-image` 如何處理圖片背景。
- `ivu-avatar-icon` 如何調整 icon 尺寸。
- 預設尺寸 class 和 Less mixin 的關係。

### 11.3 `AvatarList` 聚合邏輯

可以進一步分析：

- `AvatarList` 如何根據 `list` 產生多個 `Avatar`。
- `currentList` 如何處理 `max`。
- `tooltip`、`placement`、`transfer` 如何影響列表項。
- `extra` slot 和 `excess` avatar 的優先序。
- `avatar-list.less` 如何製造重疊頭像效果。

### 11.4 Runtime 與 Type Declaration 同步問題

可以進一步整理：

- `Avatar` 的 `.d.ts` 哪些地方和 runtime 一致。
- `Avatar` 的 `size` 型別應如何修正。
- `AvatarList` 是否也有 runtime props 和 `.d.ts` 落差。
- 元件庫維護時如何建立 type review checklist。

### 11.5 從 `Avatar` 學習元件庫 API 設計

可以把本章抽象成元件設計原則：

- 內容來源要有清楚優先序。
- 基礎元件不要過度接管業務 fallback。
- runtime、type、example、document 應保持一致。
- slot、props、event 的責任邊界要清楚。
- 樣式狀態 class 應對應明確語意。
