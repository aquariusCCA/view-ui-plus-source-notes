# Layout Shell Source Map：閱讀入口與責任分工

## 1. 本章定位

本篇是 `Layout` / `Header` / `Sider` / `Content` / `Footer` 的 source map。它的目的不是馬上逐行分析每個 `.vue`，而是先建立完整閱讀地圖。

Layout shell 的行為分散在幾個層次：

```txt
runtime .vue
  -> component entry index.js
  -> layout component style
  -> breakpoint utility
  -> type declaration
  -> official example
  -> registry / install
```

如果只看 `layout.vue`，會看到 `hasSider`，但不知道 `ivu-layout-has-sider` 如何改變 flex 方向。如果只看 `sider.vue`，會看到 `mediaMatched` 與 trigger class，但不知道對應 Less 如何讓 trigger 固定在底部或貼在 zero-width sider 外側。

---

## 2. Source Baseline

本篇以 View UI Plus `v1.3.20` 為基準。

| 類型 | 路徑 | 角色 | 閱讀重點 |
| --- | --- | --- | --- |
| `Layout` runtime | `01-origin/source/view-ui-plus-v1.3.20/src/components/layout/layout.vue` | 定義外層 flex container 與 `hasSider` 偵測。 | 看 `findSider()`、`mounted()`、`ivu-layout-has-sider`。 |
| `Header` runtime | `01-origin/source/view-ui-plus-v1.3.20/src/components/layout/header.vue` | 輸出 header class wrapper。 | 看 `ivu-layout-header` 與 default slot。 |
| `Content` runtime | `01-origin/source/view-ui-plus-v1.3.20/src/components/layout/content.vue` | 輸出 content class wrapper。 | 看 `ivu-layout-content` 與 default slot。 |
| `Footer` runtime | `01-origin/source/view-ui-plus-v1.3.20/src/components/layout/footer.vue` | 輸出 footer class wrapper。 | 看 `ivu-layout-footer` 與 default slot。 |
| `Sider` runtime | `01-origin/source/view-ui-plus-v1.3.20/src/components/layout/sider.vue` | 定義側邊欄收合、寬度、trigger、breakpoint。 | 看 `modelValue`、`siderWidth`、`matchMedia()`、trigger 顯示條件。 |
| Component entries | `src/components/{layout,header,content,footer,sider}/index.js` | 對外提供單元件入口。 | 注意 `Header` / `Content` / `Footer` / `Sider` 都轉接到 `components/layout/*.vue`。 |
| Component style | `src/styles/components/layout.less` | 定義 layout shell 全部樣式。 | 看 `ivu-layout`、`has-sider`、header/footer/content、sider trigger。 |
| Style entry | `src/styles/components/index.less` | 匯入 `layout.less`。 | 確認 layout component style 會進入 component style bundle。 |
| Breakpoint utility | `src/utils/assist.js` | 提供 `oneOf`、`dimensionMap`、`setMatchMedia()`。 | 看 breakpoint 名稱、px 對照與 `matchMedia` fallback。 |
| DOM utility | `src/utils/dom.js` | 提供 `on` / `off`。 | 看 `Sider` resize listener 的註冊與移除。 |
| Client utility | `src/utils/index.js` | 提供 `isClient`。 | 看 SSR / 非瀏覽器環境下如何跳過 matchMedia。 |
| Type declaration | `types/layout.d.ts` | 定義五個元件的 TypeScript public contract。 | 對照 runtime props、emits、slots 與 type gap。 |
| Type export entry | `types/viewuiplus.components.d.ts` | 匯出 layout shell 型別。 | 確認 `Sider, Layout, Content, Footer, Header` typed export。 |
| Official example | `examples/routers/layout.vue` | 展示 layout 官方使用方式。 | 觀察 nested `Layout`、`Sider v-model`、breakpoint、hide trigger、ref method。 |
| Component registry | `src/components/index.js` | runtime public export。 | 確認五個元件是否進入 public component set。 |
| Plugin install | `src/index.js` | 全量安裝時註冊元件與 alias。 | 注意 `iHeader`、`iContent`、`iFooter` alias。 |
| Unit test | `test/unit/specs/` | 測試來源。 | 目前未看到直接命中的 layout shell unit test。 |

---

## 3. 檔案責任分層

### 3.1 Runtime 層

Runtime 層負責輸出 DOM、class、inline style 與事件：

| 檔案 | 主要責任 |
| --- | --- |
| `layout.vue` | 建立 `ivu-layout`，mounted 後偵測直屬 `Sider`。 |
| `header.vue` | 建立 `ivu-layout-header` wrapper。 |
| `content.vue` | 建立 `ivu-layout-content` wrapper。 |
| `footer.vue` | 建立 `ivu-layout-footer` wrapper。 |
| `sider.vue` | 建立 `ivu-layout-sider`，處理收合、寬度、trigger、responsive。 |

`Header` / `Content` / `Footer` 幾乎沒有邏輯，真正需要深讀的是 `Layout` 的 `hasSider` 和 `Sider` 的狀態流程。

### 3.2 Style 層

Style 層負責讓 class 變成實際頁面骨架：

| 檔案 | 主要責任 |
| --- | --- |
| `src/styles/components/layout.less` | 定義 layout flex 基礎、has-sider row 布局、header/footer/content、sider trigger。 |
| `src/styles/custom.less` | 提供 layout 相關 Less 變數，例如 header 高度、sider 背景、trigger 尺寸。 |

這組元件不像 `Row` / `Col` 那樣依賴 grid mixin。它主要依賴單一 component style 檔案。

### 3.3 Type 與 public export 層

Type 與 export 層回答的是「使用者能不能用」：

| 檔案 | 主要責任 |
| --- | --- |
| `types/layout.d.ts` | 描述 `Sider` props / event / trigger slot，以及其他四個元件的 default slot。 |
| `types/viewuiplus.components.d.ts` | 集中匯出 layout shell 型別。 |
| `src/components/index.js` | runtime public export。 |
| `src/index.js` | plugin install 時的全域註冊集合與 alias。 |

閱讀時要注意，type declaration 是 public surface 的描述，但不一定和 runtime 完全一致。

---

## 4. 初次閱讀順序

建議第一次按照下面順序打開 source：

```txt
types/layout.d.ts
  -> src/components/layout/layout.vue
  -> src/components/layout/header.vue
  -> src/components/layout/content.vue
  -> src/components/layout/footer.vue
  -> src/components/layout/sider.vue
  -> src/styles/components/layout.less
  -> src/utils/assist.js
  -> examples/routers/layout.vue
  -> src/components/index.js
  -> src/index.js
```

這個順序先建立 public API，再看 runtime 如何實作，最後用 Less、utility、example 與 install entry 補齊行為證據。

---

## 5. 閱讀時要特別標記的問題

| 問題 | 優先看哪裡 |
| --- | --- |
| `Layout` 什麼時候有 `hasSider`？ | `layout.vue` 的 `findSider()` 與 `mounted()`。 |
| `hasSider` 如何影響布局？ | `layout.less` 的 `&&-has-sider`。 |
| `Header` / `Content` / `Footer` 有沒有 props？ | 三個 runtime `.vue` 與 `types/layout.d.ts`。 |
| `Sider` 如何形成 v-model？ | `sider.vue` 的 `modelValue`、`update:modelValue`、watch。 |
| `on-collapse` 何時 emit？ | `sider.vue` 的 `watch.modelValue`。 |
| `width` 與 `collapsedWidth` 如何轉 inline style？ | `sider.vue` 的 `siderWidth` 與 `wrapStyles`。 |
| zero-width trigger 何時出現？ | `showZeroTrigger` computed 與 `layout.less` 的 `zero-width-trigger`。 |
| bottom trigger 何時出現？ | `showBottomTrigger` computed 與 `triggerClasses`。 |
| breakpoint 對應哪些 px？ | `assist.js` 的 `dimensionMap`。 |
| resize listener 有沒有清理？ | `mounted()`、`beforeUnmount()` 與 `utils/dom`。 |
| runtime / type 是否一致？ | `types/layout.d.ts` 對照 `sider.vue`。 |
| 官方主要展示哪些場景？ | `examples/routers/layout.vue`。 |

---

## 6. 本組元件的特殊性

Layout shell 有三個容易漏看的特殊性。

第一，`Layout` 不是透過 provide / inject 知道子元件，而是在 mounted 後檢查 default slot 的直屬 vnode。這代表它只負責 layout class，不管理 `Sider` 狀態。

第二，`Header`、`Content`、`Footer` 幾乎是純 class wrapper。閱讀時不要在 runtime 裡找不存在的行為，應把主要精力放到 Less。

第三，`Sider` 是本組唯一有明顯互動狀態的元件。它同時涉及 v-model、watch emit、DOM resize listener、responsive breakpoint 與 trigger slot，所以需要獨立拆成兩篇讀。
