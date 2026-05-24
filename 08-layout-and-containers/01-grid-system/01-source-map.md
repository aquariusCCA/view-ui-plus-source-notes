# Row / Col Source Map：Grid System 閱讀入口與責任分工

## 1. 本章定位

本篇是 `Row` / `Col` 的 source map。它的目的不是馬上逐行分析 `row.vue` 或 `col.vue`，而是先建立完整閱讀地圖。

`Row` / `Col` 的完整行為分散在多個層次：

```txt
runtime .vue
  -> entry index.js
  -> common layout style
  -> Less grid mixin
  -> type declaration
  -> official example
  -> registry / install
```

如果只看 `row.vue`，會知道 `gutter` 產生負 margin，但不知道欄寬 class 的 CSS 從哪裡來。如果只看 `col.vue`，會看到 `ivu-col-span-6` 這類 class，但不知道 `.make-grid()` 如何產生對應規則。

---

## 2. Source Baseline

本篇以 View UI Plus `v1.3.20` 為基準。

| 類型 | 路徑 | 角色 | 閱讀重點 |
| --- | --- | --- | --- |
| `Row` runtime | `01-origin/source/view-ui-plus-v1.3.20/src/components/row/row.vue` | 定義 `Row` props、provide、class 與 style。 | 看 `gutter`、`align`、`justify`、`wrap` 如何轉成 class / inline style。 |
| `Col` runtime | `01-origin/source/view-ui-plus-v1.3.20/src/components/col/col.vue` | 定義 `Col` props、inject、class 與 style。 | 看欄格 props、responsive props、`flex` 如何轉成 class / inline style。 |
| `Row` entry | `01-origin/source/view-ui-plus-v1.3.20/src/components/row/index.js` | 匯出 `row.vue`。 | 確認單元件入口。 |
| `Col` entry | `01-origin/source/view-ui-plus-v1.3.20/src/components/col/index.js` | 匯出 `col.vue`。 | 確認單元件入口與 runtime source 對應。 |
| Common layout style | `01-origin/source/view-ui-plus-v1.3.20/src/styles/common/layout.less` | 定義 row flex 基礎樣式並呼叫 `.make-grid()`。 | 看 `ivu-row`、`ivu-col` 基礎規則與 breakpoint 入口。 |
| Grid Less mixin | `01-origin/source/view-ui-plus-v1.3.20/src/styles/mixins/layout.less` | 生成 span、push、pull、offset、order class。 | 理解 24 欄與 responsive class 如何批次產生。 |
| Common style entry | `01-origin/source/view-ui-plus-v1.3.20/src/styles/common/index.less` | 匯入 `layout.less`。 | 確認 grid common style 會進入 common style bundle。 |
| Type declaration | `01-origin/source/view-ui-plus-v1.3.20/types/row.d.ts` | 定義 `Row` / `Col` TypeScript public contract。 | 對照 runtime props 與 type declaration 差異。 |
| Type export entry | `01-origin/source/view-ui-plus-v1.3.20/types/viewuiplus.components.d.ts` | 匯出 `Row` / `Col` 型別。 | 確認 typed public export。 |
| Official example | `01-origin/source/view-ui-plus-v1.3.20/examples/routers/grid.vue` | 展示 grid 官方使用方式。 | 觀察基本欄格、gutter、排序、位移、對齊、responsive、flex。 |
| Component registry | `01-origin/source/view-ui-plus-v1.3.20/src/components/index.js` | 對外匯出 `Row` / `Col`。 | 確認元件是否進入 public component set。 |
| Plugin install | `01-origin/source/view-ui-plus-v1.3.20/src/index.js` | 全量安裝時註冊元件與 alias。 | 注意 `iCol: components.Col` alias。 |
| Unit test | `01-origin/source/view-ui-plus-v1.3.20/test/unit/specs/` | 測試來源。 | 目前未看到直接命中的 `row` / `col` unit test。 |

---

## 3. 檔案責任分層

### 3.1 Runtime 層

Runtime 層只負責把 props 轉成 DOM、class 與 inline style：

| 檔案 | 主要責任 |
| --- | --- |
| `row.vue` | 提供 `RowInstance`、產生 row class、計算 gutter 負 margin。 |
| `col.vue` | 注入 `RowInstance`、產生 col class、計算 gutter padding、解析 `flex`。 |

這兩個 component 的 template 都很薄：

```vue
<div :class="classes" :style="styles">
    <slot></slot>
</div>
```

因此，閱讀重點不在 template，而在 `computed classes`、`computed styles` 與父子注入關係。

### 3.2 Style 層

Style 層負責真正讓 class 有效果：

| 檔案 | 主要責任 |
| --- | --- |
| `src/styles/common/layout.less` | row flex、no-wrap、justify、align、col base、breakpoint 呼叫。 |
| `src/styles/mixins/layout.less` | 依照 `@grid-columns` 生成 span、push、pull、offset、order class。 |

`Row` / `Col` 的樣式不在 `src/styles/components/`，而是在 common layout style。這點和 `Card`、`Collapse`、`Split` 這類 component style 不同。

### 3.3 Type 與 public export 層

Type 與 export 層回答的是「使用者能不能用」：

| 檔案 | 主要責任 |
| --- | --- |
| `types/row.d.ts` | 描述 `Row` / `Col` 對 TypeScript 使用者開放的 props。 |
| `types/viewuiplus.components.d.ts` | 集中匯出 `Row` / `Col` 型別。 |
| `src/components/index.js` | runtime public export。 |
| `src/index.js` | plugin install 時的全域註冊集合。 |

閱讀時要注意，type declaration 是 public surface 的描述，但不一定和 runtime 完全一致。

---

## 4. 初次閱讀順序

建議第一次按照下面順序打開 source：

```txt
types/row.d.ts
  -> src/components/row/row.vue
  -> src/components/col/col.vue
  -> src/styles/common/layout.less
  -> src/styles/mixins/layout.less
  -> examples/routers/grid.vue
  -> src/components/index.js
  -> src/index.js
```

這個順序先建立 public API，再看 runtime 如何實作，最後用 Less 和 example 補齊行為證據。

---

## 5. 閱讀時要特別標記的問題

| 問題 | 優先看哪裡 |
| --- | --- |
| `gutter` 如何成立？ | `row.vue` 的 `styles`、`col.vue` 的 `gutter` / `styles`。 |
| `Col` 為什麼知道父層 gutter？ | `row.vue` 的 `provide()` 與 `col.vue` 的 `inject`。 |
| `span` class 有沒有 CSS？ | `layout.less` 與 `mixins/layout.less`。 |
| responsive object 如何轉 class？ | `col.vue` 的 `classes` computed。 |
| breakpoint 在哪裡？ | `layout.less` 的 `@media (min-width: ...)`。 |
| `flex` number 和字串差在哪裡？ | `col.vue` 的 `parseFlex()`。 |
| runtime / type 是否一致？ | `types/row.d.ts` 對照 `row.vue`、`col.vue`。 |
| 官方主要展示哪些場景？ | `examples/routers/grid.vue`。 |

---

## 6. 本組元件的特殊性

`Row` / `Col` 有三個容易漏看的特殊性。

第一，`Row` 在 `v1.3.20` 中實際上固定使用 flex 基礎樣式。`type="flex"` 仍存在於 runtime validator 與 class mapping 中，但 source comment 已標示它帶有歷史相容意味。

第二，`Col` 的完整欄寬不是 JavaScript 計算出百分比 inline style，而是 runtime 產生 class，再由 Less mixin 生成 CSS。

第三，`Col` 對 `RowInstance` 有直接依賴。這代表 `Col` 不是完全獨立的布局單元，正常語境下應放在 `Row` 裡理解。

