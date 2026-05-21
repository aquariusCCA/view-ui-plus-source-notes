# View UI Plus 全域 Directive 註冊流程：從 `directives` map 到 `app.directive()`

## 1. 本章定位

本篇筆記屬於 **原始碼閱讀筆記 + Vue Plugin 全域註冊機制分析筆記**。

它位於 `04-plugin-system/` 目錄下，主題是 `View UI Plus` 在 plugin install 過程中如何註冊全域 directives。這裡的重點不是某個 directive 如何操作 DOM，而是 plugin system 如何決定：

1. 哪些 directive 會被納入全域安裝。
2. 每個 directive 的 public registration name 是什麼。
3. `install()` 如何把 directive 掛到 Vue app。
4. 使用者在 template 中會看到什麼樣的 `v-*` 使用介面。
5. 這些註冊名稱為什麼屬於 View UI Plus 的 public runtime contract。

讀完本章後，應該能理解以下內容：

- `src/index.js` 為什麼要 import directive implementation。
- `directives` map 在 plugin system 中扮演什麼角色。
- `app.directive(key, directives[key])` 如何把 directive 註冊成全域能力。
- `directives` map 的 key 和 template 中 `v-*` 指令名稱之間的關係。
- 為什麼本章不深入分析 directive hooks、DOM 操作與參數格式。

本章不處理以下內容：

- `line-clamp` directive 的內部實作。
- `resize` directive 如何監聽尺寸變化。
- `style` directive 如何處理 `display`、`width`、`height`、`margin`、`padding`、`font`、`color`、`bgColor`。
- directive lifecycle hooks，例如 `mounted`、`updated`、`unmounted`。
- directive 參數、修飾符、binding value 的完整格式。
- directive 相關 TypeScript 型別是否完整。

這些內容應拆到後續章節，例如：

- `11-directives/`
- `12-style-system/`
- `04-plugin-system/07-runtime-type-contract.md`

---

## 2. 學習前先建立的基本觀念

### 2.1 Vue directive 是什麼

在 Vue 中，directive 是一種用來對 DOM 元素附加特殊行為的機制。元件主要負責封裝 UI 結構與互動邏輯，而 directive 通常更接近「對某個元素追加一段 DOM 行為」。

例如：

```vue
<div v-resize="onResize" />
<p v-line-clamp="2" />
<span v-color="'#333'" />
```

這些寫法的共同特徵是：

1. 它們不是元件。
2. 它們通常附著在某個元素上。
3. 它們會根據 directive 的實作，在元素生命週期中執行某些行為。
4. 它們的名稱以 `v-` 開頭，表示這是 Vue template 裡的 directive 使用語法。

在 plugin system 中，directive 和 component 一樣可以被全域註冊。差別在於：

| 類型 | 註冊 API | Template 使用方式 | 核心角色 |
| --- | --- | --- | --- |
| Component | `app.component(name, component)` | `<Button />`、`<Table />` | 封裝 UI 結構與互動 |
| Directive | `app.directive(name, directive)` | `v-resize`、`v-line-clamp` | 對 DOM 元素附加行為 |

因此，本章要理解的不是 directive 本身的 DOM 細節，而是 View UI Plus 如何透過 plugin install，把多個 directive 一次註冊到 Vue app。

---

### 2.2 `app.directive()` 註冊的是不含 `v-` 的名稱

閱讀這類原始碼時，一個常見混淆點是：template 中看到的是 `v-resize`，但原始碼中註冊的是 `resize`。

例如：

```js
app.directive('resize', resize);
```

使用時則是：

```vue
<div v-resize="onResize" />
```

原因是 Vue 在註冊 directive 時，名稱不需要包含 `v-` 前綴。`v-` 是 template 編譯時的語法標記，而不是 runtime registration name 的一部分。

所以在 `View UI Plus` 的 `directives` map 中：

```js
const directives = {
  resize,
  'line-clamp': lineClamp
};
```

實際對應到 template 使用時會變成：

```vue
<div v-resize />
<p v-line-clamp />
```

也就是說：

```txt
directives map key
  -> app.directive(name, implementation)
    -> template 中使用 v-{name}
```

這個轉換關係是閱讀本篇的基礎。

---

### 2.3 Plugin layer 和 Directive implementation layer 要分開看

本篇所在的 `04-plugin-system/` 主要關注 plugin install、全域註冊、配置注入與插件化設計。因此，本篇只分析「directive 如何被註冊」，不分析「directive 內部如何運作」。

可以先建立這個分層：

```txt
Plugin layer
  負責 import directive
  負責建立 directives map
  負責在 install() 中呼叫 app.directive()

Directive implementation layer
  負責 directive hooks
  負責 DOM 操作
  負責 binding value 處理
  負責事件監聽與清理
```

這種分層有助於避免閱讀原始碼時失焦。當你在看 `src/index.js` 時，應該優先理解它如何把 directive 接到 Vue app，而不是立刻追進 `resize` 或 `line-clamp` 的內部實作。

---

## 3. 整體概覽

本篇追蹤的核心 source 是：

```txt
01-origin/source/view-ui-plus-v1.3.20/src/index.js
```

其中與 directive registration 相關的原始碼可以分成三段：

```txt
src/index.js
  -> import directive implementation
  -> 建立 directives map
  -> install() 中執行 app.directive loop
```

整體流程可以整理如下：

```txt
import lineClamp from './directives/line-clamp'
import resize from './directives/resize'
import style from './directives/style'

建立 directives map
  display     -> style.display
  width       -> style.width
  height      -> style.height
  margin      -> style.margin
  padding     -> style.padding
  font        -> style.font
  color       -> style.color
  bg-color    -> style.bgColor
  resize      -> resize
  line-clamp  -> lineClamp

install(app)
  -> Object.keys(directives).forEach(key => {
       app.directive(key, directives[key])
     })

使用者 template
  -> v-display
  -> v-width
  -> v-height
  -> v-margin
  -> v-padding
  -> v-font
  -> v-color
  -> v-bg-color
  -> v-resize
  -> v-line-clamp
```

這裡的核心觀念是：`directives` map 的 key 就是 View UI Plus 在 plugin layer 對外定義的 directive name。它不是內部實作細節，而是使用者會直接感受到的 template public surface。

---

## 4. 核心內容逐步講解

### 4.1 Directive imports：plugin layer 先取得 directive implementation

`src/index.js` 從三個檔案引入 directive 實作：

```js
import lineClamp from './directives/line-clamp';
import resize from './directives/resize';
import style from './directives/style';
```

這段 import 的意義是：plugin layer 需要取得 directive implementation，才能在後續安裝階段把它們註冊到 Vue app。

不過，要特別注意：這裡只是「取得實作」，不是「執行實作」。

也就是說，`src/index.js` 並不直接處理：

- `lineClamp` 如何限制文字行數。
- `resize` 如何監聽元素尺寸變化。
- `style` 如何處理樣式相關 directive。
- directive hooks 何時被觸發。
- directive binding value 的格式。

這些都屬於 directive implementation layer。本章只需知道：`src/index.js` 透過 import 把這些 directive implementation 收集起來，準備交給 plugin install 流程統一註冊。

---

### 4.2 `style` 是一組 style-related directives 的集合來源

`style` 會提供多個 style-related directive：

| Registered name | Source |
| --- | --- |
| `display` | `style.display` |
| `width` | `style.width` |
| `height` | `style.height` |
| `margin` | `style.margin` |
| `padding` | `style.padding` |
| `font` | `style.font` |
| `color` | `style.color` |
| `bg-color` | `style.bgColor` |

從這個結構可以看出，`./directives/style` 並不是只對應單一 directive，而是像一個 style directive collection。它內部匯出多個與樣式操作有關的 directive implementation。

在 plugin layer 中，`style.bgColor` 被註冊成 `bg-color`，這是一個特別值得注意的命名轉換：

```txt
implementation property: style.bgColor
registered directive name: bg-color
template usage: v-bg-color
```

這代表 plugin layer 不只是「照搬 implementation 的變數名稱」，而是會決定對外公開時的 template 名稱。對使用者來說，`v-bg-color` 是比較符合 template 慣例的 kebab-case 寫法；對 JavaScript implementation 來說，`bgColor` 則比較符合物件屬性命名慣例。

因此，`directives` map 同時扮演了兩種角色：

1. 將 implementation 組織成 Vue 可註冊的形式。
2. 將內部命名轉換成對外 template 使用名稱。

---

### 4.3 `resize` 與 `line-clamp` 是獨立 directive implementation

除了 `style` 這種集合型來源之外，兩個獨立 directive：

```js
import lineClamp from './directives/line-clamp';
import resize from './directives/resize';
```

它們在 `directives` map 中對應為：

| Registered name | Source | Template usage |
| --- | --- | --- |
| `resize` | `resize` | `v-resize` |
| `line-clamp` | `lineClamp` | `v-line-clamp` |

這裡可以觀察到兩種命名情況。

第一種是 `resize`。implementation 變數名稱、registered name、template usage 幾乎一致：

```txt
resize -> resize -> v-resize
```

第二種是 `lineClamp`。implementation 變數在 JavaScript 中是 camelCase，但 registered name 使用 kebab-case：

```txt
lineClamp -> line-clamp -> v-line-clamp
```

這再次說明：`directives` map 的 key 不是隨便取的，它是 plugin layer 提供給使用者的正式名稱。尤其 `line-clamp` 這種名稱會直接成為使用者在 template 中書寫的指令名稱，因此屬於 public contract。

---

### 4.4 `directives` map：定義 plugin 對外暴露的 directive names

`directives` map 可以視為：

```js
const directives = {
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
};
```

這個 map 是本章最重要的結構。它的核心價值不是單純集中資料，而是定義了「View UI Plus 在全域 directive 層面要對外提供哪些名稱」。

換句話說，使用者能不能寫：

```vue
<div v-resize="onResize" />
<p v-line-clamp="2" />
<span v-color="'#333'" />
```

關鍵不是 `resize`、`lineClamp`、`style.color` 這些 implementation 是否存在，而是它們有沒有被放進 `directives` map，並且在 `install()` 中被 `app.directive()` 註冊。

因此，閱讀 `directives` map 時要特別看三件事：

1. map 裡有哪些 key。
2. 每個 key 對應到哪個 implementation。
3. key 是否使用 kebab-case，因為這會影響 template 中的 public name。

---

### 4.5 `app.directive()` loop：把 map 中的每個 directive 掛到 Vue app

在 plugin install 階段，會執行：

```js
Object.keys(directives).forEach(key => {
    app.directive(key, directives[key]);
});
```

這段程式的行為可以拆成三步：

```txt
Object.keys(directives)
  -> 取出所有 registered directive names

forEach(key => ...)
  -> 逐一處理每個 directive name

app.directive(key, directives[key])
  -> 把 directive implementation 註冊到 Vue app
```

例如，當 `key` 是 `resize` 時，實際效果可以理解成：

```js
app.directive('resize', resize);
```

當 `key` 是 `line-clamp` 時，實際效果可以理解成：

```js
app.directive('line-clamp', lineClamp);
```

當 `key` 是 `bg-color` 時，實際效果可以理解成：

```js
app.directive('bg-color', style.bgColor);
```

安裝完成後，這些 directive 會成為 Vue app 的全域 directive，使用者不需要在每個 component 裡個別註冊，就可以直接在 template 中使用。

---

### 4.6 `bg-color` 與 `line-clamp`：kebab-case key 是對外 contract

`bg-color` 與 `line-clamp` 這類 kebab-case key 是 plugin layer 定義的對外 contract。

這點很重要，因為它們不是普通內部變數，而是會出現在使用者 template 裡：

```vue
<div v-bg-color="'#fff'" />
<p v-line-clamp="2" />
```

如果 plugin layer 把 `line-clamp` 改成 `lineClamp`，使用者原本的 `v-line-clamp` 可能就會受到影響。這種改名不只是內部重構，而是 public API 變更。

因此，在維護或閱讀 View UI Plus directive registration 時，不能只看 implementation 是否存在，還要看 registered name 是否穩定。對 UI library 來說，template 名稱就是使用者直接依賴的契約。

---

### 4.7 本章的責任邊界：只看 registration，不看 directive behavior

本章不處理 directive 的生命週期 hooks、DOM 操作、參數格式與錯誤處理。這個邊界應該保留。

本章只關心：

1. directive 從哪裡 import。
2. directive 在 plugin layer 被命名成什麼。
3. directive 是否被放進 `directives` map。
4. directive 是否在 `install()` 中透過 `app.directive()` 註冊。
5. 使用者 template 中會看到哪些 `v-*` 名稱。

本章不關心：

1. directive 的 `mounted`、`updated`、`unmounted` 如何實作。
2. directive 如何操作 DOM style。
3. directive 是否註冊事件監聽器。
4. directive 如何清理副作用。
5. directive binding value 需要什麼格式。
6. directive 是否支援 modifiers 或 arguments。

這些內容應放到 `11-directives/` 或 `12-style-system/`，避免 `04-plugin-system/` 的筆記混入太多實作細節。

---

## 5. 表格整理

### 5.1 Directive imports 表

| Import | Source path | 角色 | 本章閱讀重點 |
| --- | --- | --- | --- |
| `lineClamp` | `./directives/line-clamp` | 獨立 directive implementation | 被註冊成 `line-clamp`，template 使用 `v-line-clamp` |
| `resize` | `./directives/resize` | 獨立 directive implementation | 被註冊成 `resize`，template 使用 `v-resize` |
| `style` | `./directives/style` | style-related directive collection | 提供 `display`、`width`、`height`、`margin`、`padding`、`font`、`color`、`bgColor` 等 implementation |

這張表的重點是區分「來源檔案」與「對外註冊名稱」。`lineClamp`、`resize`、`style` 是 plugin layer 取得 implementation 的方式；真正影響使用者 template 名稱的是後面的 `directives` map。

---

### 5.2 Directives Map 對照表

| Registered name | Source implementation | Template usage | 命名特徵 | 閱讀重點 |
| --- | --- | --- | --- | --- |
| `display` | `style.display` | `v-display` | 一般單字 | style-related directive |
| `width` | `style.width` | `v-width` | 一般單字 | style-related directive |
| `height` | `style.height` | `v-height` | 一般單字 | style-related directive |
| `margin` | `style.margin` | `v-margin` | 一般單字 | style-related directive |
| `padding` | `style.padding` | `v-padding` | 一般單字 | style-related directive |
| `font` | `style.font` | `v-font` | 一般單字 | style-related directive |
| `color` | `style.color` | `v-color` | 一般單字 | style-related directive |
| `bg-color` | `style.bgColor` | `v-bg-color` | kebab-case | 內部 camelCase 對外轉成 kebab-case |
| `resize` | `resize` | `v-resize` | 一般單字 | 獨立 directive |
| `line-clamp` | `lineClamp` | `v-line-clamp` | kebab-case | 內部 camelCase 對外轉成 kebab-case |

這張表是本章最適合回查的內容。閱讀時應注意：`Registered name` 是 `app.directive()` 接收的名稱；`Template usage` 則是使用者實際寫在 template 中的形式。

---

### 5.3 Registration Loop 流程表

| 步驟 | 發生位置 | 主要動作 | 輸入 | 輸出 | 注意事項 |
| --- | --- | --- | --- | --- | --- |
| 1 | `src/index.js` | import directive implementation | `lineClamp`、`resize`、`style` | plugin layer 取得可註冊的 directive implementation | 此時尚未註冊到 Vue app |
| 2 | `src/index.js` | 建立 `directives` map | directive implementation | registered name 到 implementation 的對照表 | map key 是 public registration name |
| 3 | `install()` | 取得所有 directive names | `Object.keys(directives)` | directive name list | 包含 `bg-color`、`line-clamp` 等 kebab-case key |
| 4 | `install()` | 逐一註冊 directive | `key`、`directives[key]` | `app.directive(key, directives[key])` | 註冊名稱不包含 `v-` |
| 5 | 使用者 template | 使用全域 directive | registered name | `v-resize`、`v-line-clamp`、`v-color` 等 | template 使用時才加上 `v-` |

這個流程可以幫你把原始碼和使用者介面連起來：`directives` map 的 key 經過 `app.directive()` 後，會變成使用者 template 中可以使用的 `v-*` 指令。

---

### 5.4 Plugin Layer 與 Directive Implementation Layer 比較表

| 層級 | 負責內容 | 對應檔案 / 位置 | 本章是否深入 |
| --- | --- | --- | --- |
| Plugin layer | import directive、建立 `directives` map、呼叫 `app.directive()` | `src/index.js` | 是，本章主題 |
| Directive implementation layer | directive hooks、DOM 操作、binding value、事件監聽與清理 | `./directives/line-clamp`、`./directives/resize`、`./directives/style` | 否，留到 `11-directives/` |
| Style system layer | 樣式相關 directive 的設計與應用場景 | `./directives/style`、`12-style-system/` | 否，留到 `12-style-system/` |
| Type contract layer | directive 是否有型別補充 | `types/` | 此處需要後續補充 |

---

## 6. 範例或情境說明

假設使用者在專案中安裝 View UI Plus：

```js
import { createApp } from 'vue';
import App from './App.vue';
import ViewUIPlus from 'view-ui-plus';

const app = createApp(App);

app.use(ViewUIPlus);

app.mount('#app');
```

從使用者角度來看，安裝完成後就可以在 template 中使用 View UI Plus 提供的全域 directives：

```vue
<template>
  <div v-resize="handleResize">
    需要監聽尺寸變化的區塊
  </div>

  <p v-line-clamp="2">
    這是一段可能很長的文字，透過 line-clamp directive 限制顯示行數。
  </p>

  <span v-color="'#333'">
    這段文字套用顏色 directive。
  </span>
</template>
```

從 plugin 原始碼角度來看，這背後可以拆解成：

```txt
v-resize
  -> registered name: resize
  -> source implementation: resize
  -> registered by: app.directive('resize', resize)

v-line-clamp
  -> registered name: line-clamp
  -> source implementation: lineClamp
  -> registered by: app.directive('line-clamp', lineClamp)

v-color
  -> registered name: color
  -> source implementation: style.color
  -> registered by: app.directive('color', style.color)
```

這個範例要建立的心智模型是：

```txt
使用者看到的是 v-* 語法，
plugin 註冊的是不含 v- 的 directive name，
真正執行 DOM 行為的是 directive implementation。
```

因此，本章讀懂的是「從 plugin install 到 template public name」的橋接關係。

---

## 7. 閱讀路線或學習路線

### 7.1 初次閱讀路線

第一次閱讀這段原始碼時，建議照以下順序：

1. 先讀 `src/index.js` 的 directive imports  
   目的不是深入 implementation，而是確認 plugin layer 從哪些檔案取得 directive。

2. 再讀 `directives` map  
   這是本章最重要的結構。你要確認有哪些 registered names，以及它們各自對應哪個 implementation。

3. 接著讀 `install()` 裡的 `app.directive()` loop  
   確認所有 `directives` map 的 key 都會被註冊到 Vue app。

4. 最後回到 template 使用形式  
   將 `resize`、`line-clamp`、`color` 等 registered names 對應回 `v-resize`、`v-line-clamp`、`v-color`。

---

### 7.2 深入閱讀路線

當你已經理解 registration flow 後，可以往三個方向深入：

1. `11-directives/`  
   深入分析 `line-clamp`、`resize`、`style` 的 directive hooks、DOM 操作與清理邏輯。

2. `12-style-system/`  
   深入分析 `display`、`width`、`height`、`margin`、`padding`、`font`、`color`、`bg-color` 這些 style-related directive 和樣式系統的關係。

3. `04-plugin-system/07-runtime-type-contract.md`  
   對照 runtime registration 與 `types/` 中是否有 directive 相關型別補充。此處目前需要後續確認，不應直接推論。

---

### 7.3 可以暫時跳過的部分

如果目前目標只是理解 `04-plugin-system/`，可以暫時跳過：

1. `resize` 如何監聽元素尺寸變化。
2. `line-clamp` 如何處理 CSS 或 DOM。
3. `style` directive 如何修改元素樣式。
4. directive binding value 的完整格式。
5. directive lifecycle hooks 的所有細節。
6. directive 是否支援 modifiers 或 arguments。

這些細節都重要，但它們屬於 directive implementation，不是本篇的 plugin registration 主線。

---

## 8. 常見誤區

| 誤區 | 為什麼容易誤解 | 正確理解 |
| --- | --- | --- |
| 以為 `v-resize` 是在 `app.directive()` 中直接註冊的名稱 | template 中看到的是 `v-resize`，容易以為註冊名稱也包含 `v-` | `app.directive()` 註冊的是 `resize`，template 使用時才寫成 `v-resize` |
| 以為 `directives` map 只是一般資料整理 | 看起來只是 object key-value 對照表 | 它定義了 plugin 對外暴露的 directive names，屬於 runtime public contract |
| 以為 plugin layer 會實作 directive 的 DOM 行為 | `src/index.js` import 了 directive，所以容易以為它負責 directive 行為 | plugin layer 只負責註冊；DOM 操作、hooks、binding value 處理屬於 directive implementation layer |
| 忽略 `bg-color` 與 `line-clamp` 這類 kebab-case key | 它們看起來只是命名格式差異 | 這些 key 會直接影響 template public name，例如 `v-bg-color`、`v-line-clamp` |
| 把 component registration 和 directive registration 混在一起 | 兩者都在 `install()` 中進行全域註冊 | component 用 `app.component()`，directive 用 `app.directive()`；template 使用形式和角色都不同 |
| 一開始就追進 `./directives/style` 的細節 | style directive 看起來很多，容易想馬上理解全部行為 | 本篇先讀註冊流程，style 行為應拆到 `12-style-system/` |
| 直接假設 `types/` 已有完整 directive 型別 | 原始筆記提到要檢查 `types/`，但未提供具體內容 | 目前只能標註需要後續確認，不應編造型別契約 |

---

## 9. 本章總結

本章的核心觀念是：`View UI Plus` 在 plugin install 階段，會把多個 directive implementation 透過 `directives` map 統一註冊成 Vue global directives。

整個流程可以從三個層次理解。

第一層是 implementation import。`src/index.js` 從 `./directives/line-clamp`、`./directives/resize`、`./directives/style` 取得 directive implementation。這一步只是讓 plugin layer 擁有可註冊的 directive 實作，還不是正式註冊。

第二層是 public name mapping。`directives` map 把 implementation 對應到 plugin 對外暴露的 registered name，例如 `resize`、`line-clamp`、`color`、`bg-color`。這些 key 很重要，因為它們會直接決定使用者在 template 中能寫哪些 `v-*` 指令。

第三層是 Vue app registration。`install()` 中透過 `Object.keys(directives).forEach(...)` 逐一呼叫 `app.directive(key, directives[key])`，把每個 directive 掛到 Vue app 上。安裝完成後，使用者就可以在任意 component template 中使用 `v-resize`、`v-line-clamp`、`v-color` 等全域 directives。

因此，本章不是在分析 directive 內部如何操作 DOM，而是在分析 View UI Plus 的 plugin system 如何把 directive implementation 包裝成對外可使用的全域 template 能力。這種「implementation 收集 → public name mapping → app 註冊」的流程，是理解 UI library plugin 設計時非常重要的模式。

---

## 10. 自我檢查問題

1. `src/index.js` 為什麼要 import `lineClamp`、`resize` 和 `style`？
2. `directives` map 在 View UI Plus plugin system 中扮演什麼角色？
3. 為什麼 `app.directive('resize', resize)` 在 template 中會寫成 `v-resize`？
4. `bg-color` 和 `line-clamp` 這類 kebab-case key 為什麼特別值得注意？
5. `style.bgColor`、`bg-color`、`v-bg-color` 三者之間的關係是什麼？
6. `app.component()` 和 `app.directive()` 在 plugin install 中的角色有什麼不同？
7. 為什麼本章不應深入分析 directive lifecycle hooks？
8. 如果 View UI Plus 新增一個 directive，應該檢查 `src/index.js` 中哪些位置？
9. `types/` 是否有 directive 相關型別補充，為什麼目前只能標註需要後續確認？
10. 如果你要深入理解 `v-line-clamp` 的實際行為，下一篇應該讀哪個方向的筆記？

---

## 11. 後續延伸方向

本篇是 `04-plugin-system/` 中針對 directive registration 的筆記。後續可以延伸成以下主題：

1. `11-directives/01-line-clamp-directive.md`  
   分析 `line-clamp` directive 的生命週期 hooks、binding value、CSS 或 DOM 處理方式。

2. `11-directives/02-resize-directive.md`  
   分析 `resize` directive 如何監聽元素尺寸變化，以及如何處理事件註冊與清理。

3. `11-directives/03-style-directives.md`  
   分析 `display`、`width`、`height`、`margin`、`padding`、`font`、`color`、`bg-color` 等 style-related directives 的共用設計。

4. `12-style-system/01-style-directive-design.md`  
   從樣式系統角度分析 style directive 是否只是語法糖，或是否承載了 View UI Plus 的樣式控制策略。

5. `04-plugin-system/07-runtime-type-contract.md`  
   對照 runtime registration 與 `types/` 型別宣告，確認 directive 相關能力是否有型別支援。

6. `04-plugin-system/08-plugin-design-pattern.md`  
   將 component registration、directive registration、global properties、global config 放在一起，整理 View UI Plus plugin system 的設計模式。
