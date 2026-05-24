# Layout Shell Public Contract、Slots 與 Export Boundary

## 1. 本章定位

本篇先從使用者能看到的 public contract 切入，再回到五個 layout shell 元件的 slot、event 與匯出邊界。

這組元件可以分成兩類：

```txt
thin shell:
  Layout / Header / Content / Footer

stateful shell:
  Sider
```

`Layout`、`Header`、`Content`、`Footer` 的 public surface 很薄，主要只有 default slot。`Sider` 則是本組唯一有 props、v-model、event、named slot 和公開 instance method 使用場景的元件。

---

## 2. `Layout` public contract

`Layout` 的 runtime source 來自：

```txt
src/components/layout/layout.vue
```

`Layout` 沒有 runtime props，也沒有 emits。它的 slot 很單純：

| Slot | 用途 |
| --- | --- |
| default | 放置 `Header`、`Content`、`Footer`、`Sider` 或巢狀 `Layout`。 |

`Layout` 的主要輸出是 class：

| 條件 | class |
| --- | --- |
| 永遠存在 | `ivu-layout` |
| mounted 後偵測到直屬 `Sider` | `ivu-layout-has-sider` |

需要注意的是，`Layout` source 沒有 `className` / `class-name` prop。官方 example 中出現的 `class-name="test-class"` 不會被 `Layout` runtime 主動讀取；若要加一般樣式 class，應回到 Vue attribute fallthrough 與原生 `class` 的語意理解。

---

## 3. `Header` / `Content` / `Footer` public contract

這三個元件的 runtime source 分別來自：

```txt
src/components/layout/header.vue
src/components/layout/content.vue
src/components/layout/footer.vue
```

它們都沒有 props、emits、v-model，也沒有具名 slot。

| 元件 | Slot | 輸出 class | 主要用途 |
| --- | --- | --- | --- |
| `Header` | default | `ivu-layout-header` | 頁面頂部區域。 |
| `Content` | default | `ivu-layout-content` | 主要內容區域。 |
| `Footer` | default | `ivu-layout-footer` | 頁面底部區域。 |

它們的 runtime 價值在於穩定輸出語意 class。高度、padding、背景、flex 行為都由 `src/styles/components/layout.less` 接管。

---

## 4. `Sider` public contract

`Sider` 的 runtime source 來自：

```txt
src/components/layout/sider.vue
```

### 4.1 Props

| Prop | Runtime type / validator | 預設值 | 用途 |
| --- | --- | --- | --- |
| `modelValue` | `Boolean` | `false` | 當前是否收合，可用 `v-model` 雙向綁定。 |
| `width` | `Number` / `String` | `200` | 展開時寬度。 |
| `collapsedWidth` | `Number` / `String` | `64` | 收合時寬度，為 `0` 時會進入 zero-width trigger 場景。 |
| `hideTrigger` | `Boolean` | `false` | 隱藏預設 trigger。 |
| `breakpoint` | `xs` / `sm` / `md` / `lg` / `xl` / `xxl` | 無 | 設定 responsive 收合斷點。 |
| `collapsible` | `Boolean` | `false` | 是否允許收合。 |
| `defaultCollapsed` | `Boolean` | `false` | mounted 後要求初始收合。 |
| `reverseArrow` | `Boolean` | `false` | 改變 trigger 箭頭方向，常用於右側 Sider。 |

`width` 與 `collapsedWidth` runtime 都接受 number 或 string，但 source 會在多數收合分支使用 `parseInt()`。實務上應優先理解成 number 或數字字串，而不是帶單位的任意 CSS size。

### 4.2 Emits

`Sider` 宣告：

```txt
emits: ['on-collapse', 'update:modelValue']
```

| Event | 觸發時機 | 用途 |
| --- | --- | --- |
| `update:modelValue` | `toggleCollapse()`、`defaultCollapsed` mounted 初始化、breakpoint match 狀態改變。 | 支援 `v-model`。 |
| `on-collapse` | `modelValue` watcher 觀察到狀態變化。 | 對外通知展開 / 收合結果。 |

`toggleCollapse()` 本身只 emit `update:modelValue`。`on-collapse` 是透過 `modelValue` prop 更新後的 watcher 觸發。

### 4.3 Slots

| Slot | 用途 |
| --- | --- |
| default | 放置側邊欄內容，例如 `Menu`。 |
| `trigger` | 自訂底部 trigger，取代預設 bottom trigger fallback。 |

zero-width trigger 不在 `trigger` slot fallback 裡，它是 template 中獨立的一段 `<span>`。因此自訂 `trigger` slot 主要取代底部 trigger，不會取代 zero-width trigger。

### 4.4 Public method usage

官方 example 使用：

```txt
this.$refs.side.toggleCollapse()
```

這表示 `toggleCollapse()` 雖然不是 `.d.ts` 明確列出的 instance API，但在官方 example 中被當作 ref method 使用。筆記中應記錄這個使用方式，同時標明證據來自 example 與 runtime method。

---

## 5. Type declaration 對照

TypeScript public contract 來自：

```txt
types/layout.d.ts
```

需要注意的差異：

| 項目 | Runtime | `.d.ts` | 筆記結論 |
| --- | --- | --- | --- |
| `Sider.width` | `Number` / `String`。 | `number`。 | type 比 runtime 窄。 |
| `Sider.collapsedWidth` | `Number` / `String`。 | `number`。 | type 比 runtime 窄。 |
| `Sider.modelValue` | `modelValue` prop。 | `'model-value'`。 | Vue template 使用 kebab-case，runtime 使用 camelCase。 |
| `Sider.on-collapse` | emits 宣告 `on-collapse`。 | `onOnCollapse?: (event?: any) => any`。 | `.d.ts` 以 JSX / TS event prop 形式描述。 |
| `toggleCollapse()` | runtime method，example 透過 ref 使用。 | 未列出 instance method。 | 可記錄官方 example 用法，但不要說 type 已暴露。 |
| `Layout.className` | runtime 無此 prop。 | `.d.ts` 無此 prop。 | 不應套用 `Row.className` 的理解。 |

---

## 6. Public export 與 install

五個元件都在 runtime public export 中存在：

```txt
src/components/index.js
  export { default as Content } from './content';
  export { default as Footer } from './footer';
  export { default as Header } from './header';
  export { default as Layout } from './layout';
  export { default as Sider } from './sider';
```

其中 `Header`、`Content`、`Footer`、`Sider` 的單元件入口其實轉接到 `src/components/layout/*.vue`：

```txt
src/components/header/index.js   -> ../layout/header.vue
src/components/content/index.js  -> ../layout/content.vue
src/components/footer/index.js   -> ../layout/footer.vue
src/components/sider/index.js    -> ../layout/sider.vue
```

在 plugin install 的 component map 中，部分元件還有 alias：

```txt
iHeader: components.Header
iContent: components.Content
iFooter: components.Footer
```

目前 source 中未看到 `iLayout` 或 `iSider` alias。筆記中只記錄 source 能證明的 alias，不要自行推論。

Type export 也存在：

```txt
types/viewuiplus.components.d.ts
  export { Sider, Layout, Content, Footer, Header } from './layout'
```

---

## 7. 本篇小結

Layout shell 的 public contract 可以收斂成：

| 元件 | Public surface |
| --- | --- |
| `Layout` | default slot，加上是否有直屬 `Sider` 的 class output。 |
| `Header` | default slot，輸出 header class。 |
| `Content` | default slot，輸出 content class。 |
| `Footer` | default slot，輸出 footer class。 |
| `Sider` | props、v-model、`on-collapse`、default slot、`trigger` slot、ref method 使用場景。 |

讀這組元件時，不要把 `Row` / `Col` 的 parent-child 注入模型套進來。`Layout` 和 `Sider` 之間沒有 provide / inject，只有 slot vnode 偵測與 CSS class 配合。
