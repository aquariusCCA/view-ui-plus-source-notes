# Cross-Cutting Concerns：跨元件能力

這篇整理 View UI Plus 中橫跨多個 components 的共用能力。這些能力不是單一 component 的私有邏輯，而是支撐多個 components 維持一致行為、設定、文案、樣式與 DOM 操作的基礎層。

本篇聚焦六類 cross-cutting concerns：

1. locale：跨元件文案與 i18n 接入。
2. global config：跨元件全域設定。
3. shared utils：跨元件工具函式與 DOM helper。
4. mixins：跨元件行為抽取。
5. directives：跨元件或全域可用的 DOM 行為。
6. styles：跨元件設計 token、Less mixins、component styles。

## 1. 總覽圖

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

這些能力的共同特徵是：

- 它們被多個 components 使用，而不是只服務單一 component。
- 它們讓 component 寫法維持一致，例如表單互動、連結跳轉、語系文案、全域 icon 設定、DOM event 綁定。
- 它們多數位於 components 下方，作為支撐層被 components 依賴。
- 它們不應反向依賴具體 component，避免共用能力被單一元件綁死。

## 2. Locale：跨元件文案與 i18n

locale 的 source of truth 位於 `src/locale/`，主要由 `src/locale/index.js` 提供 `use`、`i18n`、`t`，並由 `src/mixins/locale.js` 把 `t()` 掛進 component methods。

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

locale 支撐的 component 類型通常包含：

| 使用類型 | 範例 components | 支撐能力 |
| --- | --- | --- |
| 表單與選擇類 | `Select`、`Cascader`、`Transfer`、`Rate` | placeholder、empty text、操作文案。 |
| 日期時間類 | `DatePicker`、`TimePicker`、`Time` | 日期面板、確認按鈕、時間文案。 |
| 回饋與浮層類 | `Modal`、`Poptip`、`Table` | confirm/cancel、空狀態、提示文案。 |
| 圖片與分頁類 | `Image`、`Page`、`Scroll` | 工具列、分頁與狀態文案。 |

locale 的架構價值是把文案查找集中在一個機制裡。component 不需要知道語系資料如何載入，也不需要直接操作外部 i18n instance；它只需要呼叫 `this.t(...)`。

## 3. Global Config：跨元件全域設定

global config 的入口在 `install(app, opts)`。安裝 plugin 時，`src/index.js` 會把使用者傳入的全域選項整理到 `$VIEWUI`：

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

components 讀取 global config 的主要方式是 `src/mixins/globalConfig.js`：

```txt
src/mixins/globalConfig.js
  -> getCurrentInstance()
  -> instance.appContext.config.globalProperties.$VIEWUI
  -> this.globalConfig
```

典型使用方向如下：

| Config 範圍 | 使用場景 | 支撐的 components |
| --- | --- | --- |
| arrow / customArrow / arrowSize | 統一選單、選擇器、樹、級聯選擇的箭頭 icon 行為。 | `Select`、`Cascader`、`Menu`、`Tree`、`Cell` |
| icon / customIcon / iconSize | 統一日期與時間選擇器 icon。 | `DatePicker`、`TimePicker` |
| closeIcon / customCloseIcon | 統一 tabs 關閉 icon。 | `Tabs` |
| maskClosable | 統一 modal mask 點擊關閉行為。 | `Modal` |
| size / transfer | 統一尺寸與浮層 transfer 行為。 | 多個表單與浮層類 components |

global config 的價值是把「整個 library 的預設行為」集中到 plugin install options，而不是讓每個 component 各自定義一套全域設定入口。

## 4. Shared Utils：跨元件工具函式

`src/utils/` 是 components 最常依賴的共用工具層。它提供 DOM、資料處理、校驗、日期、鍵盤碼、scroll、queue 等低階能力。

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

主要工具角色如下：

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

shared utils 的邊界是「不承載 component 語意」。例如 `oneOf` 不知道它服務的是 Button 或 Select；`dom.on` 不知道事件用在 Modal 還是 Table。這讓 utils 可以被多個 components 重用。

## 5. Mixins：跨元件行為抽取

`src/mixins/` 把常見 component behavior 抽成可混入的單元。相較於 utils 是函式層，mixins 更接近 Vue component 行為層，會帶入 props、computed、methods、inject 或 lifecycle。

```txt
src/mixins/
  -> locale.js
  -> globalConfig.js
  -> form.js
  -> link.js
  -> emitter.js
```

| Mixin | 支撐能力 | 常見使用者 |
| --- | --- | --- |
| `locale.js` | 提供 `this.t(...)`。 | `Select`、`Cascader`、`DatePicker`、`Modal`、`Table`、`Transfer`。 |
| `globalConfig.js` | 從 `$VIEWUI` 讀取全域設定到 `this.globalConfig`。 | `Cell`、`ColorPicker`、`DatePicker`、`Menu`、`Cascader`、`Tabs`、`Select`。 |
| `form.js` | 注入 `FormInstance` / `FormItemInstance`，統一 disabled 與 change/blur 回報。 | `Input`、`Select`、`Checkbox`、`Radio`、`Switch`、`Upload`、`Transfer`。 |
| `link.js` | 統一 `to`、`replace`、`target`、router resolve 與跳轉處理。 | `Button`、`Card`、`Cell`、`BreadcrumbItem`、`Auth`、`Typography` link 類行為。 |
| `emitter.js` | component 之間的事件派發與廣播。 | 需要跨層級通訊的舊式 Vue component 模式。 |

mixins 的價值在於避免同一段 Vue 行為散落在多個 components。以 `form.js` 為例，Input、Select、Radio、Checkbox、Switch 都需要和 FormItem 溝通 change/blur；把它放在 mixin 後，各 component 只需要在自己的事件點呼叫統一方法。

## 6. Directives：跨元件與全域 DOM 行為

directives 位於 `src/directives/`。它們分成兩種角色：

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

directives 的架構角色是把「直接碰 DOM 的跨元件行為」集中起來。component 可以保留自己的狀態與事件語意，但 DOM 操作細節不需要每個 component 各寫一遍。

## 7. Styles：跨元件視覺系統

`src/styles/` 是 library 的視覺支撐層。它不只是 component CSS 清單，也包含設計 token、Less mixins、common style、animation 與 iconfont。

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

styles 支撐多個 components 的方式有兩層：

- design token 層：所有 component 共用同一組顏色、尺寸、字體、border、shadow 變數。
- component style 層：每個 component 對應自己的 Less 檔，但最後由 `src/styles/index.less` 統一輸出成 package CSS。

這代表 component runtime 與 visual system 是分離但協作的。component 負責狀態與 DOM class，styles 負責這些 class 對應的視覺結果。

## 8. Cross-Cutting Concerns 的邊界

```txt
component-specific logic
  -> props / events / slots / state / render

cross-cutting concerns
  -> locale
  -> global config
  -> utils
  -> mixins
  -> directives
  -> styles
```

判斷某段能力是否應該抽到 cross-cutting layer，可以看三個問題：

1. 是否被三個以上 components 重複需要。
2. 是否代表 library 一致性，例如文案、尺寸、icon、DOM event、form 行為、浮層行為。
3. 是否可以不依賴具體 component name 而獨立存在。

如果答案是肯定，它通常適合放在 `src/locale/`、`src/utils/`、`src/mixins/`、`src/directives/` 或 `src/styles/`。如果它只描述單一 component 的特殊 UI 狀態，則應留在該 component 目錄內。

## 9. 閱讀順序

理解跨元件能力時，可以採用下面順序：

1. 先看 `src/index.js`，確認 install 如何建立 `$VIEWUI`、locale setup 與 global directives。
2. 再看 `src/mixins/`，理解 component 如何消費 locale、global config、form、link 等行為。
3. 接著看 `src/utils/`，確認多個 components 共用哪些低階 helper。
4. 再看 `src/directives/`，理解全域或局部 DOM 行為如何封裝。
5. 最後看 `src/styles/index.less` 與 `src/styles/components/index.less`，理解樣式如何由 token、mixins、component styles 聚合輸出。

## 10. 與其他 Architecture Notes 的關係

- `03-architecture/03-layer-model.md`：說明 cross-cutting concerns 在分層模型中屬於共用能力層與樣式層。
- `03-architecture/05-module-dependency-map.md`：說明 components 如何依賴 `utils`、`mixins`、`styles`、`locale`。
- `03-architecture/06-public-surface.md`：說明這些內部共用能力如何透過 plugin install、globalProperties、locale APIs 等形式影響對外 API。
- 本篇：聚焦這些跨元件能力本身，以及它們如何支撐多個 components。
