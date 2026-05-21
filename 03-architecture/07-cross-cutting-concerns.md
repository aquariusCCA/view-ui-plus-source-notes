# Cross-Cutting Concerns：View UI Plus 的跨元件共用能力

## 1. 本章定位

本章是一篇 **架構分析筆記**，主題是 View UI Plus 中跨越多個 components 的共用能力，也就是常見架構語境中的 **Cross-Cutting Concerns**。

所謂 cross-cutting concerns，可以先理解成：

> 不屬於單一 component，但會影響多個 components 行為一致性的基礎能力。

在 View UI Plus 這類 component library 中，很多功能不能只放在單一元件裡處理。例如：

- `Select`、`DatePicker`、`Modal`、`Table` 都需要多語系文案。
- `Input`、`Select`、`Checkbox`、`Radio` 都需要和 `Form` / `FormItem` 溝通。
- `Tooltip`、`Poptip`、`Modal` 這類浮層元件都可能需要 DOM 移動、外部點擊偵測、z-index 或 transfer 行為。
- 所有元件都應該共用同一套顏色、尺寸、字體、間距與動畫規則。

如果每個 component 都各自實作這些能力，整個 library 很快會變得難以維護。因此 View UI Plus 會把這些共用能力集中到幾個支撐層中，讓 components 可以重用它們。

本章要解決的問題是：

1. View UI Plus 有哪些跨元件共用能力？
2. 這些能力分別放在哪些目錄或檔案中？
3. 它們如何支撐 components 維持一致行為？
4. 閱讀原始碼時，應該如何判斷某段邏輯是 component-specific logic，還是 cross-cutting concern？

本章不會深入分析單一 component 的完整實作。例如 `Select` 的下拉邏輯、`Table` 的欄位渲染、`DatePicker` 的日期面板細節，這些應該留到各 component 專篇分析。

---

## 2. 學習前先建立的基本觀念

### 2.1 Component Library 不只是元件集合

對初學者來說，component library 可能看起來只是很多元件的集合，例如：

```txt
Button
Input
Select
Table
Modal
DatePicker
...
```

但真正的 library 架構不只是把元件放在一起。為了讓這些元件像同一套產品，而不是一堆互不相干的元件，它還需要很多橫向支撐能力，例如：

- 統一文案來源。
- 統一全域設定。
- 統一 DOM 操作工具。
- 統一表單溝通方式。
- 統一樣式變數與設計 token。
- 統一 directive 行為。
- 統一浮層、跳轉、鍵盤互動等行為模式。

這些能力本身不是某個元件的私有邏輯，但它們會同時影響多個元件。

### 2.2 Cross-Cutting Concerns 的核心判斷

判斷一段能力是否屬於 cross-cutting concerns，可以用三個問題：

1. 它是不是被多個 components 需要？
2. 它是不是用來維持 library 的一致性？
3. 它是否能在不依賴特定 component name 的情況下獨立存在？

例如：

| 邏輯 | 是否偏向 cross-cutting concern | 原因 |
| --- | --- | --- |
| `Button` 的 loading 狀態 | 否 | 主要是 `Button` 自己的 component-specific logic。 |
| `this.t(...)` 多語系翻譯方法 | 是 | 多個 components 都需要統一文案查找。 |
| `FormItem` 的 change / blur 回報機制 | 是 | 多個表單元件都要用同一種方式通知表單驗證。 |
| `Modal` 的某個特殊動畫狀態 | 不一定 | 如果只服務 `Modal`，通常留在 `Modal`；如果多個浮層共用，才適合抽出。 |
| 顏色、間距、border、shadow 變數 | 是 | 所有 component 都應該遵守同一套 visual system。 |

### 2.3 Runtime、DOM、Vue 行為與 Style 是不同層次

本章列出的六類能力並不在同一個抽象層級：

| 類型 | 層次 | 核心問題 |
| --- | --- | --- |
| `locale` | 文案與語系層 | component 要如何取得目前語系的文案？ |
| `global config` | 全域設定層 | 使用者如何一次改變多個元件的預設行為？ |
| `shared utils` | 函式工具層 | 多個元件共用的低階工具要放在哪裡？ |
| `mixins` | Vue component 行為層 | 多個元件共用的 props、methods、computed、inject 或 lifecycle 如何抽出？ |
| `directives` | DOM 行為層 | 直接碰 DOM 的共用行為如何封裝？ |
| `styles` | 視覺系統層 | 多個元件如何共用設計 token、Less mixins 與 component styles？ |

理解這個分層很重要。否則容易把所有共用能力都混在一起，最後只得到一個模糊的「共用資料夾」印象。

---

## 3. 整體概覽

View UI Plus 的跨元件能力可以從兩個方向觀察：

第一個方向是 **install 階段如何建立全域能力**。`src/index.js` 的 `install(app, opts)` 會處理 locale setup、`$VIEWUI` global config，以及 global directives 註冊。

第二個方向是 **components 如何消費這些能力**。各個 `src/components/*` 內的元件，會依賴 `src/locale/`、`src/mixins/`、`src/utils/`、`src/directives/` 與 `src/styles/` 提供的支撐。

可以整理成下列架構圖：

```txt
src/index.js
  -> install(app, opts)
      -> locale setup
      -> $VIEWUI global config
      -> global directives

src/components/*
  -> src/locale/
  -> src/mixins/
  -> src/utils/
  -> src/directives/
  -> src/styles/
```

這些 cross-cutting concerns 的共同特徵是：

1. 它們被多個 components 使用，而不是只服務單一 component。
2. 它們讓 component 寫法維持一致，例如表單互動、連結跳轉、語系文案、全域 icon 設定、DOM event 綁定。
3. 它們多數位於 components 下方，作為支撐層被 components 依賴。
4. 它們不應反向依賴具體 component，否則共用能力會被單一元件綁死。

用心智模型來看，可以分成兩大區塊：

```txt
component-specific logic
  -> props
  -> events
  -> slots
  -> state
  -> render

cross-cutting concerns
  -> locale
  -> global config
  -> utils
  -> mixins
  -> directives
  -> styles
```

component-specific logic 負責處理某個元件自己的行為；cross-cutting concerns 則負責支撐多個元件共同需要的能力。

---

## 4. 核心內容逐步講解

### 4.1 Locale：跨元件文案與 i18n 接入

`locale` 是跨元件文案的集中管理機制。它解決的問題是：當不同 components 都需要顯示 placeholder、empty text、confirm、cancel、日期文案、分頁文案時，這些文字不應該散落在每個 component 裡硬編碼。

locale 的 source of truth 位於 `src/locale/`，主要由 `src/locale/index.js` 提供 `use`、`i18n`、`t`，並由 `src/mixins/locale.js` 把 `t()` 掛進 component methods。

其使用關係可以整理如下：

```txt
src/index.js
  -> localeFile.use(opts.locale)
  -> localeFile.i18n(opts.i18n)
  -> export locale / i18n / lang

src/mixins/locale.js
  -> import { t } from '../locale'
  -> methods.t(...)

src/components/*
  -> mixins: [ Locale ]
  -> this.t('...')
```

這裡可以看出三個層次：

1. `src/locale/index.js` 負責提供底層語系能力。
2. `src/mixins/locale.js` 負責把語系能力接到 component instance 上。
3. components 只需要呼叫 `this.t(...)`，不必直接知道語系資料如何載入。

這種設計的價值是降低 component 對 locale 實作細節的依賴。對 `Select`、`Cascader`、`DatePicker`、`Modal`、`Table`、`Transfer` 這些元件來說，它們真正關心的是「我要拿到某個 key 對應的文案」，而不是「目前語系物件是從哪裡載入的」。

常見使用類型如下：

| 使用類型 | 範例 components | 支撐能力 |
| --- | --- | --- |
| 表單與選擇類 | `Select`、`Cascader`、`Transfer`、`Rate` | placeholder、empty text、操作文案。 |
| 日期時間類 | `DatePicker`、`TimePicker`、`Time` | 日期面板、確認按鈕、時間文案。 |
| 回饋與浮層類 | `Modal`、`Poptip`、`Table` | confirm / cancel、空狀態、提示文案。 |
| 圖片與分頁類 | `Image`、`Page`、`Scroll` | 工具列、分頁與狀態文案。 |

閱讀這一層時，重點不是先背每個文案 key，而是理解 `locale` 的責任邊界：

```txt
component
  -> 呼叫 this.t(key)
  -> locale mixin 轉接
  -> locale module 查找文案
  -> 回傳目前語系下的文字
```

也就是說，`locale` 是「跨元件文案一致性」的基礎層。

---

### 4.2 Global Config：跨元件全域設定

`global config` 解決的是另一個常見問題：使用者希望在安裝 library 時，一次設定整個 library 的預設行為，而不是每個 component 都重複傳 props。

在 View UI Plus 中，全域設定的入口位於 `install(app, opts)`。安裝 plugin 時，`src/index.js` 會把使用者傳入的全域選項整理到 `$VIEWUI`：

```txt
app.use(ViewUIPlus, opts)
  -> src/index.js install(app, opts)
      -> app.config.globalProperties.$VIEWUI
          -> size
          -> transfer
          -> capture
          -> cell / menu / modal / tabs
          -> select / colorPicker / cascader / tree
          -> datePicker / timePicker / typography / space / image
```

這代表 `$VIEWUI` 是一個 Vue app 層級的全域設定容器。components 可以透過 `src/mixins/globalConfig.js` 讀取這些設定：

```txt
src/mixins/globalConfig.js
  -> getCurrentInstance()
  -> instance.appContext.config.globalProperties.$VIEWUI
  -> this.globalConfig
```

這裡的重點是：`global config` 並不是 component 的 props 替代品，而是 library 層級的預設值來源。

props 通常用來控制單一 component instance，例如某一個 `Select` 的 size 或 disabled 狀態；global config 則用來設定整個 library 的預設行為，例如全域尺寸、浮層 transfer 行為、某些 icon 或 mask 行為。

典型設定方向如下：

| Config 範圍 | 使用場景 | 支撐的 components |
| --- | --- | --- |
| `arrow` / `customArrow` / `arrowSize` | 統一選單、選擇器、樹、級聯選擇的箭頭 icon 行為。 | `Select`、`Cascader`、`Menu`、`Tree`、`Cell` |
| `icon` / `customIcon` / `iconSize` | 統一日期與時間選擇器 icon。 | `DatePicker`、`TimePicker` |
| `closeIcon` / `customCloseIcon` | 統一 tabs 關閉 icon。 | `Tabs` |
| `maskClosable` | 統一 modal mask 點擊關閉行為。 | `Modal` |
| `size` / `transfer` | 統一尺寸與浮層 transfer 行為。 | 多個表單與浮層類 components |

它的架構價值在於集中管理「整套 library 的預設行為」。如果沒有這層，使用者可能需要在每個 component 上重複傳入同樣的設定，元件內部也會出現大量重複的預設值判斷。

---

### 4.3 Shared Utils：跨元件工具函式

`src/utils/` 是 components 最常依賴的共用工具層。它提供的是相對低階、可重用、通常不帶 component 語意的工具函式。

工具包含：

```txt
src/components/*
  -> src/utils/assist.js
  -> src/utils/dom.js
  -> src/utils/date.js
  -> src/utils/csv.js
  -> src/utils/keyCode.js
  -> src/utils/transfer-queue.js
  -> src/utils/calcTextareaHeight.js
  -> src/utils/random_str.js
```

這一層和 `mixins` 的差別是：`utils` 通常是函式層；`mixins` 則接近 Vue component 行為層。

例如：

- `oneOf` 可以拿來做 props validator。
- `dom.on` / `dom.off` 可以拿來處理 DOM event 綁定與解除。
- `date.js` 可以服務日期時間元件。
- `keyCode.js` 可以集中管理鍵盤碼常數。
- `calcTextareaHeight.js` 可以支撐 textarea 自動高度計算。

主要工具角色可以整理如下：

| Utils | 支撐能力 | 常見使用場景 |
| --- | --- | --- |
| `assist.js` | `oneOf`、`getStyle`、`deepCopy`、`scrollTop`、component 查找、class helper。 | props validator、DOM 測量、表格資料處理、父子 component 協作。 |
| `dom.js` | `on`、`off` event helper。 | `Affix`、`BackTop`、`Carousel`、`Modal`、`Table` 等需要 DOM event 的元件。 |
| `date.js` | 日期格式與日期計算工具。 | `DatePicker`、`TimePicker`。 |
| `csv.js` | CSV 匯出能力。 | `Table` export CSV。 |
| `keyCode.js` | keyboard code 常數。 | `Select`、`ImagePreview`、`Typography` 等鍵盤互動。 |
| `transfer-queue.js` | 浮層 z-index / transfer 排隊。 | `Modal`、`Tooltip`、`Poptip`、`Spin`、`ImagePreview`。 |
| `calcTextareaHeight.js` | textarea 自動高度計算。 | `Input` textarea。 |
| `random_str.js` | 產生內部 id。 | `Anchor`、`Carousel`、`Menu`、`Table`、`Select` 等。 |

`utils` 的核心邊界是：它應該盡量不理解特定 component 的業務語意。

例如 `dom.on` 不應該知道自己是服務 `Modal` 還是 `Table`；`random_str.js` 也不應該知道自己產生的 id 是用在 `Anchor` 還是 `Select`。這樣它才可以被多個元件安全重用。

若某個 helper 開始大量依賴某個 component 的 props、slots、內部 state 或 class 命名，它可能就不再適合放在 `src/utils/`，而應該回到該 component 目錄或改成更明確的 feature module。

---

### 4.4 Mixins：跨元件 Vue 行為抽取

`src/mixins/` 把常見 component behavior 抽成可混入的單元。它與 `utils` 最大的差異在於：mixins 通常會帶入 Vue component 層級的概念，例如 props、computed、methods、inject 或 lifecycle。

mixins 包含：

```txt
src/mixins/
  -> locale.js
  -> globalConfig.js
  -> form.js
  -> link.js
  -> emitter.js
```

主要角色如下：

| Mixin | 支撐能力 | 常見使用者 |
| --- | --- | --- |
| `locale.js` | 提供 `this.t(...)`。 | `Select`、`Cascader`、`DatePicker`、`Modal`、`Table`、`Transfer`。 |
| `globalConfig.js` | 從 `$VIEWUI` 讀取全域設定到 `this.globalConfig`。 | `Cell`、`ColorPicker`、`DatePicker`、`Menu`、`Cascader`、`Tabs`、`Select`。 |
| `form.js` | 注入 `FormInstance` / `FormItemInstance`，統一 disabled 與 change / blur 回報。 | `Input`、`Select`、`Checkbox`、`Radio`、`Switch`、`Upload`、`Transfer`。 |
| `link.js` | 統一 `to`、`replace`、`target`、router resolve 與跳轉處理。 | `Button`、`Card`、`Cell`、`BreadcrumbItem`、`Auth`、`Typography` link 類行為。 |
| `emitter.js` | component 之間的事件派發與廣播。 | 需要跨層級通訊的舊式 Vue component 模式。 |

以 `form.js` 為例，它抽出的不是普通工具函式，而是多個表單類 components 都會遇到的 Vue 行為問題：

```txt
Input / Select / Checkbox / Radio / Switch
  -> 使用 form mixin
      -> 注入 Form / FormItem 相關 instance
      -> 統一 disabled 判斷
      -> 在 change / blur 時回報給 FormItem
```

這樣做的好處是，表單類元件不需要各自實作一套和 `FormItem` 溝通的流程。只要遵守 mixin 提供的介面，就能維持一致的驗證與狀態回報方式。

不過閱讀 mixins 時也要注意一個風險：mixin 會把行為「混入」 component，導致某些 method、computed 或 inject 不是直接寫在 component 檔案中。初次閱讀原始碼時，如果只看 component 本身，可能會找不到某些方法從哪裡來。因此讀 component 時要同步檢查它使用了哪些 mixins。

---

### 4.5 Directives：跨元件與全域 DOM 行為

`directives` 是 Vue 對 DOM 行為的一種封裝方式。在 View UI Plus 中，directives 位於 `src/directives/`，主要有兩種角色：

1. package install 時全域註冊的 directives。
2. component 內部直接使用的 directives 或 directive-like DOM 行為。

全域註冊由 `src/index.js` 控制：

```txt
src/index.js
  -> style directives
      -> display / width / height / margin / padding / font / color / bg-color
  -> resize
  -> line-clamp
  -> app.directive(...)
```

主要 directives 如下：

| Directive | 支撐能力 |
| --- | --- |
| `style.js` | 把 display、width、height、margin、padding、font、color、background color 這類常用 inline style 控制抽成 directive。 |
| `resize.js` | 透過 `element-resize-detector` 監聽元素尺寸變化。 |
| `line-clamp.js` | 套用 `ivu-line-clamp` class 與 `-webkit-line-clamp`，支撐多行省略。 |
| `transfer-dom.js` | 把浮層類 DOM 移動到合適容器，支撐 overlay / popup 類元件。 |
| `clickoutside.js` / `v-click-outside-x.js` | 偵測外部點擊，支撐 dropdown、select、tooltip 類交互。 |

directives 的架構角色是把「直接碰 DOM 的跨元件行為」集中起來。這點和 `utils/dom.js` 有相似之處，但它們使用位置不同：

| 類型 | 主要形式 | 使用方式 |
| --- | --- | --- |
| `utils/dom.js` | 普通函式 | component 內部用 JS 呼叫 `on` / `off` 等 helper。 |
| `directives` | Vue directive | 在 template 或 render 中以 directive 形式掛到 DOM element 上。 |

例如外部點擊偵測、浮層 DOM 移動、多行省略、尺寸監聽，都不是某個單一 component 才會遇到的問題。把它們抽成 directive，可以讓多個 components 以一致的方式使用。

閱讀這一層時，重點是觀察：

1. directive 在 install 階段是否被全域註冊。
2. component 是否在內部直接引用某個 directive。
3. directive 是否依賴 DOM、window、document 或第三方 DOM library。
4. directive 是否需要在 mounted / updated / unmounted 階段做資源清理。

---

### 4.6 Styles：跨元件視覺系統

`src/styles/` 是 View UI Plus 的視覺支撐層。它不只是 component CSS 清單，也包含設計 token、Less mixins、common style、animation 與 iconfont。

styles 結構如下：

```txt
src/styles/index.less
  -> custom.less
  -> base.less
  -> mixins/index.less
  -> common/index.less
  -> animation/index.less
  -> components/index.less

build/build-style.js
  -> src/styles/index.less
  -> dist/styles/viewuiplus.css
```

主要分工如下：

| Styles 區塊 | 支撐能力 |
| --- | --- |
| `custom.less` | 顏色、字體、間距、border、shadow、component 尺寸等設計變數。 |
| `mixins/` | button、input、checkbox、tooltip、select、mask、loading、layout 等可重用 Less mixins。 |
| `common/` | base、layout、iconfont、article 等共用樣式。 |
| `animation/` | fade、move、slide、ease、loop 等動效。 |
| `components/` | 各 component 的 Less 樣式入口，由 `components/index.less` 聚合。 |

這一層要理解成 View UI Plus 的 visual system。它讓所有 components 能共享同一套設計語言，包括：

- 顏色。
- 字體。
- 尺寸。
- 間距。
- border。
- shadow。
- 動效。
- iconfont。
- component-specific styles。

可以用兩層模型理解：

```txt
design token layer
  -> custom.less
  -> colors / font / spacing / border / shadow / size

style composition layer
  -> mixins
  -> common
  -> animation
  -> components
  -> index.less
  -> dist/styles/viewuiplus.css
```

component runtime 與 styles 是分離但協作的。component 負責決定 DOM 結構、狀態與 class；styles 負責讓這些 class 產生一致的視覺結果。

例如 component 可能會根據狀態加上某個 class，而該 class 最終如何呈現，則由 `src/styles/` 中的 Less 規則決定。

---

### 4.7 Cross-Cutting Concerns 的邊界判斷

不是所有共用邏輯都應該被抽到 cross-cutting layer。

判斷某段能力是否應該抽出去，可以看三個問題：

1. 是否被三個以上 components 重複需要？
2. 是否代表 library 一致性，例如文案、尺寸、icon、DOM event、form 行為、浮層行為？
3. 是否可以不依賴具體 component name 而獨立存在？

如果答案大多是肯定，通常適合放在：

```txt
src/locale/
src/utils/
src/mixins/
src/directives/
src/styles/
```

如果答案是否定，尤其是該邏輯只描述單一 component 的特殊 UI 狀態，就應該留在該 component 目錄內。

可以用下面的心智模型判斷：

```txt
只影響一個元件的特殊狀態
  -> 留在 component 內

影響多個元件的一致規則
  -> 抽到 cross-cutting layer

低階純函式
  -> utils

Vue component 行為
  -> mixins

DOM 掛載型行為
  -> directives

文案與語系
  -> locale

視覺 token 與樣式聚合
  -> styles

安裝階段的全域預設
  -> install / $VIEWUI global config
```

這個判斷方式對閱讀原始碼與未來重構都很重要。閱讀時可以幫助你知道某段程式碼為什麼不在 component 內；重構時則可以幫助你避免過度抽象或錯誤共用。

---

## 5. 表格整理

### 5.1 六類 Cross-Cutting Concerns 總表

| 類型 | 主要位置 | 負責職責 | Components 如何使用 | 初次閱讀重點 |
| --- | --- | --- | --- | --- |
| `locale` | `src/locale/`、`src/mixins/locale.js` | 管理跨元件文案、語系切換與 i18n 接入。 | component 透過 `this.t(...)` 取得文案。 | 看 `src/locale/index.js` 如何提供 `use`、`i18n`、`t`。 |
| `global config` | `src/index.js`、`src/mixins/globalConfig.js` | 管理安裝 plugin 時傳入的全域預設設定。 | component 透過 `this.globalConfig` 讀取 `$VIEWUI`。 | 看 `install(app, opts)` 如何建立 `$VIEWUI`。 |
| `shared utils` | `src/utils/` | 提供 DOM、日期、資料處理、鍵盤碼、CSV、scroll、id 等低階工具。 | component 直接 import helper。 | 分辨 helper 是否不帶 component 語意。 |
| `mixins` | `src/mixins/` | 抽出多個 components 共用的 Vue 行為。 | component 透過 mixins 取得 methods、computed、inject 等能力。 | 看 component 使用了哪些 mixins，避免漏看隱含行為。 |
| `directives` | `src/directives/` | 封裝跨元件或全域可用的 DOM 行為。 | install 全域註冊，或 component 內部引用。 | 看 directive 是否處理 mounted / updated / unmounted 等 DOM 生命週期。 |
| `styles` | `src/styles/` | 管理設計 token、Less mixins、common styles、animation 與 component styles。 | component 透過 class 與 styles 配合產生視覺結果。 | 看 `src/styles/index.less` 如何聚合樣式並輸出 CSS。 |

---

### 5.2 Cross-Cutting Layer 與 Component Layer 的差異

| 對比面向 | Component-specific logic | Cross-cutting concerns |
| --- | --- | --- |
| 服務對象 | 單一 component。 | 多個 components 或整個 library。 |
| 典型內容 | props、events、slots、state、render、單一元件狀態。 | locale、global config、utils、mixins、directives、styles。 |
| 變更影響 | 通常只影響單一元件。 | 可能影響多個元件甚至整個 library。 |
| 閱讀方式 | 從 component 入口、props、state、事件流程開始看。 | 從使用者、被依賴關係與 install / common layer 開始看。 |
| 重構風險 | 風險集中在單一元件。 | 風險較高，因為可能造成多個元件行為改變。 |

這個表格的重點是提醒：cross-cutting layer 的變更影響範圍通常比單一 component 更大。因此閱讀或修改這些層時，要先確認有哪些 components 依賴它。

---

### 5.3 Utils、Mixins、Directives 的分工比較

| 類型 | 抽象層級 | 適合放什麼 | 不適合放什麼 |
| --- | --- | --- | --- |
| `utils` | 低階函式層 | 純工具、DOM helper、日期處理、資料轉換、鍵盤碼、id 生成。 | 帶有大量 component state 或 lifecycle 的行為。 |
| `mixins` | Vue component 行為層 | methods、computed、inject、props、lifecycle、跨元件互動模式。 | 單純資料處理函式，或只服務單一 component 的特殊邏輯。 |
| `directives` | DOM 掛載行為層 | 外部點擊、resize、transfer DOM、line clamp 等直接碰 DOM 的行為。 | 純資料轉換、與 DOM 無關的邏輯。 |

這三者都可以被多個 components 重用，但重用的層次不同。`utils` 偏函式，`mixins` 偏 component 行為，`directives` 偏 DOM 掛載與操作。

---

## 6. 範例或情境說明

### 6.1 情境一：`Select` 如何消費多個 cross-cutting concerns

以 `Select` 這類元件為例，它可能同時需要多種跨元件能力：

```txt
Select component
  -> locale
      -> placeholder / empty text
  -> globalConfig
      -> arrow / customArrow / arrowSize
  -> form mixin
      -> change / blur 回報給 FormItem
  -> utils
      -> keyboard code / DOM helper / id helper
  -> directives
      -> click outside 或浮層相關 DOM 行為
  -> styles
      -> select 樣式、動畫、設計 token
```

這代表一個 component 的實際行為通常不是只看自己的檔案就能完整理解。它會消費許多橫向支撐能力。

所以閱讀 `Select` 時，除了看 component 本身，也要追：

1. 它用了哪些 mixins？
2. 它 import 了哪些 utils？
3. 它是否依賴 locale 文案？
4. 它是否讀取 `$VIEWUI` global config？
5. 它是否使用 directive 或浮層 DOM 行為？
6. 它的 class 對應到哪些 styles？

這就是 cross-cutting concerns 筆記的價值：它提供一張「閱讀單一 component 時需要回頭看的共用層地圖」。

---

### 6.2 情境二：修改全域 icon 設定時應該追哪些地方

假設你要理解或修改某些元件的全域 icon 設定，不應該只去看單一 component。可能需要追：

```txt
app.use(ViewUIPlus, opts)
  -> opts 裡的 icon / customIcon / iconSize
  -> src/index.js
  -> $VIEWUI
  -> src/mixins/globalConfig.js
  -> component this.globalConfig
  -> DatePicker / TimePicker 等 component 使用位置
```

這個流程說明：全域設定是從 plugin install 進入 library，再透過 `$VIEWUI` 傳到 component。它不是單一 component 自己孤立決定的。

因此如果修改這類行為，至少要檢查：

1. install options 的資料結構是否正確。
2. `$VIEWUI` 是否有保存對應設定。
3. `globalConfig.js` 是否能讀到設定。
4. 相關 components 是否有正確消費這些設定。
5. TypeScript declarations 是否也需要同步補上。  

---

### 6.3 情境三：判斷一段邏輯要不要抽成 utils

假設某個 component 內出現一段函式，用來取得 DOM style 或計算 scrollTop。如果這段邏輯未來也會被 `Table`、`Modal`、`BackTop` 等元件使用，它就可能適合抽到 `src/utils/assist.js` 或 `src/utils/dom.js`。

但如果這段邏輯只服務某個 component 的特殊 UI 狀態，例如只處理某個特殊 slot 的渲染狀態，就不一定適合抽到 utils。

可以這樣判斷：

```txt
這段邏輯是否依賴特定 component 的 props / state / slots？
  -> 是：先留在 component 內

這段邏輯是否可被多個 components 重用？
  -> 是：考慮抽成 utils / mixins / directives

這段邏輯是否需要 Vue lifecycle 或 inject？
  -> 是：可能比較適合 mixin

這段邏輯是否直接綁在 DOM element 上？
  -> 是：可能比較適合 directive
```

---

## 7. 閱讀路線或學習路線

### 7.1 初次閱讀路線

第一次閱讀本主題時，不建議一開始就跳進所有工具函式細節。比較好的順序是先建立整體地圖，再逐層深入。

1. 先讀 `src/index.js`。  
   目的是確認 `install(app, opts)` 如何建立 `$VIEWUI`、locale setup 與 global directives。這是跨元件能力進入 Vue app 的入口。

2. 再讀 `src/mixins/`。  
   目的是理解 components 如何消費 locale、global config、form、link 等共用行為。這一層最能看出共用能力如何實際進入 component。

3. 接著讀 `src/utils/`。  
   目的是確認多個 components 共用了哪些低階 helper。閱讀時要分辨哪些是 DOM helper、哪些是資料處理、哪些是日期或鍵盤互動工具。

4. 再讀 `src/directives/`。  
   目的是理解全域或局部 DOM 行為如何封裝，例如 resize、line-clamp、transfer-dom、clickoutside。

5. 最後讀 `src/styles/index.less` 與 `src/styles/components/index.less`。  
   目的是理解樣式如何由 token、mixins、common styles、animation 與 component styles 聚合輸出。

### 7.2 深入閱讀路線

當你已經知道有哪些 cross-cutting concerns 後，可以改用「從 component 回推共用層」的方式閱讀。

例如選一個複雜元件：

```txt
Select
DatePicker
Table
Modal
```

然後逐一追：

1. 這個 component 引用了哪些 mixins？
2. 這個 component import 了哪些 utils？
3. 這個 component 是否使用 `this.t(...)`？
4. 這個 component 是否讀取 `this.globalConfig`？
5. 這個 component 是否使用 directives？
6. 這個 component 對應哪些 Less 檔案？
7. 這個 component 的某段行為是自己實作，還是來自共用層？

這種讀法可以把架構地圖和實際 component 行為連起來。

### 7.3 可以暫時跳過的部分

初次閱讀時，可以暫時跳過：

- 每一個 utility function 的完整實作細節。
- 每一個 Less mixin 的所有樣式規則。
- 每一個 directive 的完整 edge cases。
- 每一個 component 對 global config 的細部覆蓋邏輯。

先理解「這些層各自負責什麼」比一開始背所有細節更重要。

---

## 8. 常見誤區

| 誤區 | 為什麼容易誤解 | 正確理解 |
| --- | --- | --- |
| 把 cross-cutting concerns 當成單純的 `common` 資料夾。 | 因為它們通常都放在共用目錄，看起來像工具集合。 | 它們不是只有工具函式，而是支撐多個 components 維持一致行為的架構層。 |
| 以為 component 的所有行為都寫在 component 自己檔案裡。 | 閱讀單一元件時，最直覺是只看該元件目錄。 | 很多行為可能來自 mixins、utils、directives、global config 或 locale。 |
| 把 `utils` 和 `mixins` 混為一談。 | 兩者都是共用能力，而且都可能被多個 components import。 | `utils` 偏低階函式；`mixins` 偏 Vue component 行為，會帶入 methods、computed、inject 或 lifecycle。 |
| 以為 global config 可以取代 props。 | 兩者都能控制 component 行為。 | global config 是整個 library 的預設值；props 是單一 component instance 的具體設定。 |
| 修改 shared utils 時只測單一元件。 | utils 看起來可能只是小函式。 | shared utils 可能被多個 components 依賴，修改時要檢查所有使用點。 |
| 只看 runtime，不看 styles。 | 前端原始碼閱讀容易偏重 JS / Vue 邏輯。 | component 的狀態與 class 需要 styles 才能產生實際視覺結果。 |
| 把 directives 當成 component 的內部細節。 | directives 常被某些 components 使用，看起來像局部實作。 | 某些 directives 是跨元件 DOM 行為封裝，甚至會在 install 階段全域註冊。 |

---

## 9. 本章總結

View UI Plus 的 cross-cutting concerns 是理解整個 component library 架構時非常重要的一層。它們不是單一 component 的私有邏輯，而是支撐多個 components 維持一致行為、設定、文案、樣式與 DOM 操作的基礎能力。

本章可以用六個關鍵層來理解：

`locale` 負責跨元件文案與 i18n 接入，讓 components 不需要直接管理語系資料，只需要透過 `this.t(...)` 取得文案。

`global config` 負責 plugin install 階段的全域預設設定，讓使用者可以透過 `app.use(ViewUIPlus, opts)` 一次設定整套 library 的部分行為，並由 `$VIEWUI` 提供給 components 消費。

`shared utils` 負責低階、可重用、不帶 component 語意的工具能力，例如 DOM helper、日期、CSV、鍵盤碼、scroll、id 產生與 textarea 高度計算。

`mixins` 負責抽出多個 components 共用的 Vue 行為，例如 locale、global config、form、link 與跨層級事件溝通。

`directives` 負責封裝跨元件或全域可用的 DOM 行為，例如 resize、line clamp、transfer DOM 與 click outside。

`styles` 則負責整套 library 的 visual system，包含設計 token、Less mixins、common styles、animation 與 component styles 聚合輸出。

閱讀這些層時，最重要的不是背每個檔案，而是建立判斷能力：一段邏輯是單一 component 的特殊行為，還是多個 components 共同依賴的橫向能力？如果能做出這個判斷，就能更準確地閱讀 View UI Plus 原始碼，也能更理解 component library 為什麼需要這些支撐層。

---

## 10. 自我檢查問題

1. 什麼是 cross-cutting concerns？為什麼 component library 需要這一層？
2. `locale` 為什麼不應該散落在每個 component 裡自行處理？
3. `src/index.js` 的 `install(app, opts)` 和 cross-cutting concerns 有什麼關係？
4. `$VIEWUI` 的角色是什麼？它和單一 component props 有什麼差別？
5. `utils` 和 `mixins` 的主要差異是什麼？
6. 為什麼 `form.js` 這類 mixin 適合被多個表單類 components 共用？
7. directives 適合封裝哪一類跨元件行為？
8. `src/styles/` 為什麼不能只被理解成 CSS 檔案集合？
9. 如果你要修改 `transfer-dom.js` 或 `clickoutside.js`，為什麼不能只測一個 component？
10. 閱讀一個複雜 component 時，應該如何回頭追它依賴了哪些 cross-cutting concerns？

---

## 11. 後續延伸方向

這份筆記之後可以延伸成下列更深入的主題：

1. **`locale` 機制原始碼分析**  
   深入閱讀 `src/locale/index.js`、`src/mixins/locale.js`，整理 `use`、`i18n`、`t` 的資料流。

2. **`$VIEWUI` Global Config 設計分析**  
   分析 `install(app, opts)` 如何建立 `$VIEWUI`，以及各 components 如何透過 `globalConfig.js` 消費全域設定。

3. **`form.js` Mixin 與表單驗證協作分析**  
   以 `Input`、`Select`、`Checkbox`、`Radio`、`Switch` 為例，追蹤它們如何和 `FormItem` 溝通。

4. **浮層行為共用層分析**  
   整理 `transfer-dom.js`、`clickoutside.js`、`transfer-queue.js` 如何支撐 `Modal`、`Tooltip`、`Poptip`、`Spin`、`ImagePreview` 等浮層元件。

5. **`src/utils/` 工具層分類筆記**  
   把 `assist.js`、`dom.js`、`date.js`、`csv.js`、`keyCode.js` 等依功能重新分類，建立查找表。

6. **View UI Plus Styles 系統分析**  
   深入整理 `custom.less`、`mixins/`、`common/`、`animation/`、`components/` 與 `build/build-style.js` 的關係。

7. **Component 閱讀實戰：以 `Select` 追蹤 cross-cutting concerns**  
   選一個複雜元件，實際追蹤它如何使用 locale、global config、utils、mixins、directives 與 styles。

8. **Cross-Cutting Concerns 與 Public Surface 的關係**  
   連回 `06-public-surface.md`，分析哪些內部共用能力會透過 plugin install、globalProperties、locale APIs 或 types 影響使用者可見 API。
