# Layout 與 Sider 頁框結構

## 學習目標

這篇分析 `Layout`、`Header`、`Content`、`Footer`、`Sider` 如何組成頁面骨架。這組元件不像 `Row` / `Col` 那樣追求精細欄寬，而是提供常見後台與文件頁的外框結構，尤其是側邊欄收合與響應式斷點。

讀完後，要能說明 `Layout` 如何判斷是否有 `Sider`，以及 `Sider` 如何用 `v-model`、`breakpoint`、trigger slot 和 inline style 控制寬度。

## 對照源碼

- `01-origin/source/view-ui-plus-v1.3.20/src/components/layout/layout.vue`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/layout/header.vue`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/layout/content.vue`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/layout/footer.vue`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/layout/sider.vue`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/layout/index.js`
- `01-origin/source/view-ui-plus-v1.3.20/types/layout.d.ts`
- `01-origin/source/view-ui-plus-v1.3.20/src/styles/components/layout.less`

## 結構定位

`Layout` 是外層結構容器，`Header`、`Content`、`Footer` 是薄包裝元件，`Sider` 是最複雜的子結構。

典型組合是：

```txt
Layout
  Sider
  Layout
    Header
    Content
    Footer
```

這種巢狀結構讓頁面可以同時有側邊欄和主內容區。元件本身不負責資料，只負責輸出穩定 class 和尺寸 style。

## Layout 如何判斷 Sider

`Layout` 有一個內部狀態 `hasSider`。它在 `mounted` 時呼叫 `findSider()`，檢查 default slot 中是否有子節點的 `child.type.name === 'Sider'`。

流程是：

```txt
mounted
  -> findSider()
  -> hasSider = true / false
  -> wrapClasses 加上 ivu-layout-has-sider
```

這個 class 讓樣式可以針對含有側邊欄的 layout 調整 flex 方向。它不是使用者可直接控制的 prop，而是由 slot 結構推導出的內部狀態。

閱讀這段時要注意限制：`findSider` 只在 `mounted` 執行一次。如果 slot 結構動態改變，這個狀態不會自動重新掃描。

## Header / Content / Footer

`Header`、`Content`、`Footer` 是薄包裝元件，主要價值是提供語意化元件名稱和固定 class：

| 元件 | 角色 |
| --- | --- |
| `Header` | 頁首或主內容上方工具列 |
| `Content` | 主內容區 |
| `Footer` | 頁尾 |

這類元件的程式碼通常很短，但在元件庫中仍然重要，因為它們讓使用者可以用一致的元件語彙拼頁面骨架，而不是手寫一堆 class。

## Sider 的狀態模型

`Sider` 的核心 props：

| Prop | 預設值 | 說明 |
| --- | --- | --- |
| `modelValue` | `false` | 是否收合，支援 `v-model` |
| `width` | `200` | 展開寬度 |
| `collapsedWidth` | `64` | 收合寬度 |
| `collapsible` | `false` | 是否允許收合 |
| `defaultCollapsed` | `false` | 初始是否收合 |
| `hideTrigger` | `false` | 是否隱藏預設 trigger |
| `breakpoint` | 無 | 響應式斷點：`xs`、`sm`、`md`、`lg`、`xl`、`xxl` |
| `reverseArrow` | `false` | 反轉箭頭方向，常用於右側側邊欄 |

`Sider` 不直接修改 `modelValue`，而是透過事件通知外部：

```txt
toggleCollapse()
  -> emit update:modelValue

watch modelValue
  -> emit on-collapse
```

這是 Vue 3 元件中常見的受控狀態模式。

## 寬度與 trigger

`siderWidth` 是最重要的 computed：

```txt
collapsible
  ? modelValue
    ? mediaMatched ? 0 : collapsedWidth
    : width
  : width
```

接著 `wrapStyles` 把寬度同步到四個 CSS 屬性：

```txt
width
minWidth
maxWidth
flex: 0 0 {siderWidth}px
```

這能避免 flex layout 中側邊欄被壓縮或拉伸。

trigger 分成兩種：

| Trigger | 條件 | 位置 |
| --- | --- | --- |
| bottom trigger | 非斷點命中、未 hideTrigger | 側邊欄底部 |
| zero-width trigger | 斷點命中或 collapsedWidth 為 0 且已收合 | 側邊欄外側 |

`trigger` slot 可以覆蓋底部 trigger，但 zero-width trigger 是內建特殊狀態。

## breakpoint 與 resize

`Sider` 使用 `dimensionMap` 和 `window.matchMedia` 判斷目前是否命中斷點。流程是：

```txt
mounted
  -> 如果 defaultCollapsed，emit update:modelValue
  -> 如果有 breakpoint，監聽 window resize
  -> matchMedia()

resize
  -> mediaMatched = matchMedia(max-width).matches
  -> 若 mediaMatched 變化，emit update:modelValue(mediaMatched)
```

這表示斷點命中時，`Sider` 會把外部 `modelValue` 推成斷點狀態。使用者如果用 `v-model`，要理解 responsive collapse 也是狀態來源之一。

`beforeUnmount` 會移除 resize listener，這是所有 window listener 元件都要檢查的清理點。

## Runtime 與 Type 對照

`types/layout.d.ts` 宣告 `Sider`、`Layout`、`Content`、`Footer`、`Header`。幾個值得注意的點：

| 項目 | runtime | type |
| --- | --- | --- |
| `width` | `Number` 或 `String` | `number` |
| `collapsedWidth` | `Number` 或 `String` | `number` |
| `modelValue` | camelCase prop | 型別中是 `'model-value'` |
| `on-collapse` | emit 名稱 | 型別中是 `onOnCollapse` |
| `trigger` slot | 可自訂 trigger | 型別有宣告 |

如果仿寫時想讓寬度支援 CSS 字串，型別也應該跟著支援。否則使用者在 runtime 可用，但 TypeScript 會報錯。

## 設計啟發

`Layout` / `Sider` 的重點是把頁框結構和狀態控制分開：

- `Layout` 判斷結構，輸出結構 class。
- `Header` / `Content` / `Footer` 只提供語意和 class。
- `Sider` 管理寬度、收合、斷點和 trigger。
- `v-model` 讓外部能控制收合狀態。
- responsive 行為會主動回寫 `modelValue`。

仿寫頁框元件時，要先決定哪些狀態是結構推導，哪些狀態是使用者可控，哪些狀態會由環境事件產生。

## 複習題

1. `Layout` 如何判斷自己是否包含 `Sider`？
2. `Sider` 為什麼要同時設定 `width`、`minWidth`、`maxWidth` 和 `flex`？
3. `modelValue` 和 `defaultCollapsed` 在職責上有什麼差異？
4. 斷點命中時，`Sider` 如何影響外部 `v-model`？
5. `trigger` slot 覆蓋的是哪一種 trigger？zero-width trigger 的用途是什麼？
