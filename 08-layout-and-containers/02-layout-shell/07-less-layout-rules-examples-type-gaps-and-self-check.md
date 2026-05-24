# Layout Shell Less、Examples、Type Gaps 與自我檢查

## 1. 本章定位

本篇用 Less、官方 example、type declaration 回扣 layout shell 的主要行為，並整理 runtime source 與 type declaration 之間需要注意的差異。

主要來源：

```txt
01-origin/source/view-ui-plus-v1.3.20/src/styles/components/layout.less
01-origin/source/view-ui-plus-v1.3.20/src/styles/custom.less
01-origin/source/view-ui-plus-v1.3.20/examples/routers/layout.vue
01-origin/source/view-ui-plus-v1.3.20/types/layout.d.ts
01-origin/source/view-ui-plus-v1.3.20/src/components/layout/*.vue
```

---

## 2. Less 規則總覽

`layout.less` 的主結構圍繞 `@layout-prefix-cls`：

```txt
@layout-prefix-cls: ivu-layout
```

主要 class 可以整理成：

| class | 來源元件 | Less 責任 |
| --- | --- | --- |
| `ivu-layout` | `Layout` | 建立 flex container、column 方向、背景。 |
| `ivu-layout-has-sider` | `Layout` | 切成 row 方向，並處理直屬 layout/content 寬度。 |
| `ivu-layout-header` | `Header` | header 背景、高度、line-height、padding。 |
| `ivu-layout-content` | `Content` | `flex: auto`。 |
| `ivu-layout-footer` | `Footer` | footer 背景、padding、文字樣式。 |
| `ivu-layout-sider` | `Sider` | sider 背景、transition、position、min-width。 |
| `ivu-layout-sider-children` | `Sider` | children wrapper 高度與細微 margin/padding 修正。 |
| `ivu-layout-sider-trigger` | `Sider` | bottom trigger 固定定位、尺寸、背景、互動游標。 |
| `ivu-layout-sider-zero-width` | `Sider` | 0 寬度時隱藏內部 overflow。 |
| `ivu-layout-sider-zero-width-trigger` | `Sider` | 0 寬度 trigger 的絕對定位、尺寸、hover。 |

---

## 3. Layout 基礎 flex

`ivu-layout` 的基礎規則是：

```txt
display: flex
flex-direction: column
flex: auto
background: @layout-body-background
```

所以沒有 `Sider` 時，layout shell 預設是上下排列：

```txt
Header
Content
Footer
```

有 `Sider` 時，`Layout` runtime 會加上：

```txt
ivu-layout-has-sider
```

Less 轉成：

```txt
flex-direction: row
```

這讓直屬 `Sider` 和右側 `Layout` / `Content` 變成左右排列。

---

## 4. Header / Content / Footer 樣式角色

這三個區塊在 Less 中的分工很清楚：

| 區塊 | flex 行為 | 主要樣式 |
| --- | --- | --- |
| `Header` | `flex: 0 0 auto` | 背景、padding、高度、line-height。 |
| `Content` | `flex: auto` | 吃掉剩餘空間。 |
| `Footer` | `flex: 0 0 auto` | 背景、padding、文字色與字級。 |

因此 runtime 沒有複雜 props 是合理的。它們的 public contract 是 slot 和 class，樣式規格由 Less 變數統一控制。

---

## 5. Sider 樣式角色

`Sider` 的視覺行為由 inline style 和 Less 共同完成。

Runtime inline style 控制：

```txt
width
minWidth
maxWidth
flex
```

Less 控制：

```txt
background
transition
position
children height
trigger fixed / absolute positioning
trigger icon rotation
zero-width overflow
```

也就是說：

```txt
Sider width is runtime-driven
Sider visual chrome is Less-driven
```

讀 `Sider` 時不要只看 Less，因為真正的寬度是 computed `siderWidth` 寫進 inline style。

---

## 6. Less 中值得標記的細節

### 6.1 `&&-has-sider`

Less 使用：

```less
&&-has-sider
```

在編譯後對應 `.ivu-layout.ivu-layout-has-sider`，表示同一個元素同時有兩個 class。這和子元素 selector 不同。

### 6.2 `width: 0` for direct layout/content

`has-sider` 裡有：

```less
> .@{layout-prefix-cls},
> .@{layout-prefix-cls}-content {
    width: 0;
}
```

這個規則是為了 row flex 下的巢狀 `Layout` 或直屬 `Content` 能正確收縮。不要誤讀成把內容隱藏，因為它們同時仍可透過 flex 填滿剩餘空間。

### 6.3 `ivu-layout-sider-has-trigger`

Less 中存在：

```txt
ivu-layout-sider-has-trigger
```

對應 padding-bottom trigger 高度。但目前 `sider.vue` 的 `wrapClasses` 沒有看到加上這個 class。筆記中應標記為 style 中存在、runtime 未直接命中的 class，不要假設它一定生效。

### 6.4 zero-width trigger 位置

zero-width trigger 預設放在 sider 右側外面：

```txt
right: -@layout-zero-trigger-width
```

`reverseArrow` 加上 left 變體後，會改到左側：

```txt
left: -@layout-zero-trigger-width
```

這是 `reverseArrow` 除了 icon 方向以外，對 zero-width trigger 位置的實際影響。

---

## 7. 官方 example 覆蓋的主線場景

`examples/routers/layout.vue` 覆蓋了 layout shell 的主要能力。

| 場景 | Example 特徵 | 對應 source 重點 |
| --- | --- | --- |
| 外層左右布局 | 外層 `Layout` 直屬 `Sider` 和內層 `Layout` | `Layout.findSider()` 與 `ivu-layout-has-sider`。 |
| 內層上下布局 | 內層 `Layout` 包 `Header`、`Content`、`Footer` | 預設 `flex-direction: column`。 |
| Sider v-model | `v-model="isCollapsed"` | `modelValue` / `update:modelValue`。 |
| 0 寬度收合 | `collapsed-width="0"` | `siderWidth = 0` 與 zero-width class。 |
| responsive | `breakpoint="sm"` | `dimensionMap.sm = 576px`，`matchMedia()`。 |
| 隱藏 trigger | `hide-trigger` | `showBottomTrigger` / `showZeroTrigger` 都受影響。 |
| 收合事件 | `@on-collapse="changed"` | `watch.modelValue` emit。 |
| ref method | `this.$refs.side.toggleCollapse()` | 官方 example 使用 runtime method。 |
| attr fallthrough style | `Header :style="{background: '#eee'}"` | 非 prop attribute 作用到 root element。 |

examples 的價值是反推官方主推用法，但不能取代 runtime source。若 example 沒展示某個 branch，不代表 runtime 不支援。

---

## 8. Runtime 與 type declaration 差異

`types/layout.d.ts` 是 TypeScript 使用者看到的 public contract，但它不完全等於 runtime source。

### 8.1 `Sider.width`

Runtime：

```txt
Number / String
```

`.d.ts`：

```txt
width?: number
```

筆記中應寫成：

```txt
runtime 支援 number 或 string，type declaration 只描述 number。
```

同時要補充，runtime 最終會補 `px`，所以 string 應優先理解成數字字串。

### 8.2 `Sider.collapsedWidth`

Runtime：

```txt
Number / String
```

`.d.ts`：

```txt
'collapsed-width'?: number
```

差異和 `width` 類似。

### 8.3 `toggleCollapse()`

Runtime method 存在，官方 example 透過 ref 使用：

```txt
this.$refs.side.toggleCollapse()
```

但 `types/layout.d.ts` 沒有列出 instance method。筆記中可以把它記成官方 example 用法，不要寫成 type 已完整描述。

### 8.4 `Layout.class-name`

官方 example 有：

```vue
<Layout class-name="test-class">
```

但 runtime `layout.vue` 沒有 `className` prop，`.d.ts` 也沒有。這和 `Row` 的 `className` 不同。筆記中應把它標成 example 中出現但 Layout source 未消費的 attribute，不要把它整理進 `Layout` public props。

---

## 9. 測試覆蓋狀態

在目前本地 source 的 `test/unit/specs/` 中，未看到直接針對 `Layout` / `Header` / `Sider` / `Content` / `Footer` 的 unit test。

這代表：

1. 不應在筆記中寫「測試保證 layout shell 行為」。
2. 行為證據主要來自 runtime source、Less source、type declaration 與 official example。
3. 若未來要補測試，可優先覆蓋 `hasSider`、`Sider` v-model、trigger 顯示、breakpoint listener。

沒有直接 unit test 不代表行為不存在，只代表筆記中不能把測試覆蓋當成證據。

---

## 10. 可補的測試思路

如果後續要為 mini implementation 或 source reading 補測試，可以從這些場景開始：

| 測試方向 | 驗證內容 |
| --- | --- |
| `Layout` without `Sider` | 只產生 `ivu-layout`，不產生 `ivu-layout-has-sider`。 |
| `Layout` with direct `Sider` | mounted 後產生 `ivu-layout-has-sider`。 |
| `Header` / `Content` / `Footer` | 分別輸出正確 `ivu-layout-*` class 與 default slot。 |
| `Sider` default width | 預設 `width/minWidth/maxWidth/flex` 為 `200px`。 |
| `Sider` collapsed width | `modelValue=true` 且 `collapsedWidth=64` 時寬度為 `64px`。 |
| `Sider` zero width | `collapsedWidth=0` 且已收合時出現 zero-width class / trigger。 |
| `Sider` click trigger | 點擊後 emit `update:modelValue`。 |
| `Sider` watcher | `modelValue` 改變時 emit `on-collapse`。 |
| `Sider` breakpoint match | 模擬 `matchMedia().matches=true` 時 emit `update:modelValue(true)`。 |
| `Sider` beforeUnmount | 設定 breakpoint 時會移除 resize listener。 |

這些測試不需要驗證完整瀏覽器 layout，只要驗證 runtime class / style / emit / listener mapping，就能保護大部分核心邏輯。

---

## 11. 自我檢查問題

讀完 `02-layout-shell/` 後，應該能回答下列問題。

1. `Layout` 的 template 為什麼只有一層 div？
2. `Layout.findSider()` 檢查的是所有後代還是直屬 default slot？
3. `ivu-layout-has-sider` 在 Less 中做了哪兩件事？
4. `Header`、`Content`、`Footer` 的 runtime 差異是什麼？
5. `Content` 為什麼是 `flex: auto`？
6. `Sider` 的 collapsed state 存在哪裡？
7. `toggleCollapse()` 直接改 data 還是 emit update？
8. `on-collapse` 是在 click handler 裡 emit，還是在 watcher 裡 emit？
9. `defaultCollapsed` 在 mounted 時如何影響父層 v-model？
10. `width="200"` 和 `width="200px"` 在目前 source 下有什麼風險差異？
11. `mediaMatched=true` 時，`siderWidth` 為什麼會變成 0？
12. `showBottomTrigger` 和 `showZeroTrigger` 的顯示條件有什麼差異？
13. 自訂 `trigger` slot 會不會取代 zero-width trigger？
14. `breakpoint="sm"` 對應哪個 media query？
15. `collapsible=false` 時，breakpoint 是否仍可能 emit `update:modelValue`？
16. `reverseArrow` 對 icon 與 zero-width trigger 位置分別有什麼影響？
17. `types/layout.d.ts` 和 runtime source 在 `width` / `collapsedWidth` 上是否一致？
18. 官方 example 展示了哪些 layout shell 主線場景？
19. 目前本地 source 是否有直接命中的 layout shell unit test？
20. 如果要仿作 mini layout，最小需要實作哪些 runtime mapping？

---

## 12. 本組筆記總結

`Layout` / `Header` / `Sider` / `Content` / `Footer` 是一組典型頁面骨架元件。

完整理解可以收斂成一條主線：

```txt
Layout detects direct Sider and switches flex direction
  -> Header / Content / Footer provide stable region classes
  -> Sider maps controlled collapsed state to fixed flex width
  -> trigger and breakpoint emit model updates
  -> layout.less turns classes into visual shell
  -> examples confirm official usage patterns
  -> type declaration documents public surface with some gaps
```

掌握這條主線後，再讀 `Card`、`Collapse`、`Split`、`Affix` 等容器元件時，就能更清楚地區分：哪些元件只是語意 wrapper，哪些元件真正包含狀態、事件、DOM listener 或尺寸計算。
