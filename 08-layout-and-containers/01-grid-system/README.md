# Row / Col Grid System 原始碼閱讀總覽

## 1. 本目錄定位

`08-layout-and-containers/01-grid-system/` 用來閱讀 View UI Plus 的 `Row` / `Col` 欄格系統。

這組元件看起來只是 24 欄切分，但從元件庫原始碼角度來看，它其實同時展示了三種能力：

| 能力 | 代表問題 |
| --- | --- |
| 父子協作 | `Row.gutter` 如何透過 provide / inject 影響 `Col` padding？ |
| runtime 映射 | `span`、`offset`、`push`、`pull`、`order`、`flex` 如何轉成 class 或 inline style？ |
| Less 生成 | 24 欄與 responsive class 為什麼不在 `.vue` 裡逐一寫出？ |

所以，讀 `Row` / `Col` 時不要只看 template。真正完整的 grid system 由 runtime、Less mixin、type declaration、official example 與 public export 共同成立。

本目錄以 View UI Plus `v1.3.20` 作為 Source Baseline：

```txt
01-origin/source/view-ui-plus-v1.3.20/
```

---

## 2. 核心心智模型

`Row` / `Col` 可以先用下面這條鏈理解：

```txt
Row props
  -> Row class / negative margin
  -> provide RowInstance
  -> Col inject RowInstance.gutter
  -> Col class / padding / flex style
  -> layout.less and mixins/layout.less
  -> 24 column responsive CSS
```

其中最重要的是：`Row` 負責外層排列與 gutter 負 margin，`Col` 負責欄寬 class、左右 padding 與 flex inline style，真正的欄寬 CSS 則由 Less mixin 產生。

---

## 3. Notes Index

建議依照下列順序閱讀。

| 順序 | 筆記 | 主題 | 閱讀目的 |
| --- | --- | --- | --- |
| 1 | `01-source-map.md` | 原始碼入口地圖 | 先知道 runtime、style、type、example、registry 分別在哪裡。 |
| 2 | `02-public-contract-and-parent-child-boundary.md` | public contract 與父子邊界 | 先建立 `Row` / `Col` 對外 API、slot、無事件設計與 provide / inject 關係。 |
| 3 | `03-row-gutter-alignment-and-wrap.md` | `Row` runtime | 理解 gutter、align、justify、wrap、className 如何影響 class 與 inline style。 |
| 4 | `04-col-span-responsive-and-flex-mapping.md` | `Col` runtime | 理解 span、offset、push、pull、order、responsive props、flex 如何映射。 |
| 5 | `05-less-grid-mixins-and-breakpoints.md` | Less grid system | 理解 24 欄 class、responsive class 與 breakpoint 如何由 Less 生成。 |
| 6 | `06-official-examples-type-gaps-and-self-check.md` | examples、type gap、自我檢查 | 用官方範例回扣行為，並整理 runtime / `.d.ts` 差異與檢查題。 |

---

## 4. 三條閱讀主線

### 4.1 `Row`：父層布局容器

`Row` 的 runtime 很薄，但它負責 grid system 的外層語意：

```txt
gutter
  -> Row margin-left / margin-right = -gutter / 2
  -> Col padding-left / padding-right = gutter / 2
```

除此之外，`Row` 也透過 class 控制 flex 對齊與換行：

| Prop | 影響 |
| --- | --- |
| `align` | 產生 `ivu-row-top`、`ivu-row-middle`、`ivu-row-bottom`。 |
| `justify` | 產生 `ivu-row-start`、`ivu-row-center`、`ivu-row-end` 等。 |
| `wrap` | `false` 時產生 `ivu-row-no-wrap`。 |
| `className` | 追加自訂 class。 |

### 4.2 `Col`：欄位與 responsive class 轉換器

`Col` 的核心任務是把 props 轉成 class：

```txt
span="6"
  -> ivu-col-span-6

:xs="{ span: 5, offset: 1 }"
  -> ivu-col-span-xs-5
  -> ivu-col-xs-offset-1
```

同時，`Col` 也會根據 `Row.gutter` 產生 padding，並根據 `flex` prop 產生 inline `flex` style。

### 4.3 Less：真正產生欄格 CSS 的地方

`.vue` 只產生 class 名稱。欄寬百分比、位移、排序與 responsive breakpoint 的 CSS 主要在：

```txt
src/styles/common/layout.less
src/styles/mixins/layout.less
```

閱讀這組元件時，一定要把 runtime class 與 Less 生成規則對起來，否則只能看到 class 名稱，看不到 grid system 為什麼真正生效。

---

## 5. 建議三輪閱讀法

### 5.1 第一輪：建立地圖

先讀：

```txt
README.md
01-source-map.md
02-public-contract-and-parent-child-boundary.md
```

這一輪只需要知道各檔案負責什麼，不需要追完 Less 遞迴 mixin。

### 5.2 第二輪：追 runtime 流程

再讀：

```txt
03-row-gutter-alignment-and-wrap.md
04-col-span-responsive-and-flex-mapping.md
```

這一輪要能說明 props 如何變成 class、inline style 與父子關係。

### 5.3 第三輪：回到 Less 與 examples

最後讀：

```txt
05-less-grid-mixins-and-breakpoints.md
06-official-examples-type-gaps-and-self-check.md
```

這一輪要確認 Less 如何接住 runtime class，並用官方範例檢查理解是否完整。

---

## 6. 完整學習成果

讀完本目錄後，應該能回答：

1. `Row` / `Col` 為什麼必須一起讀？
2. `Row.gutter` 如何同時影響父層 margin 與子層 padding？
3. `Col` 為什麼透過 inject 讀取 `RowInstance`？
4. `span`、`offset`、`push`、`pull`、`order` 分別會產生什麼 class？
5. responsive props 的 number 寫法與 object 寫法差在哪裡？
6. `Col.flex` 的 number、尺寸字串與一般 flex 字串如何被處理？
7. 24 欄 class 是由哪些 Less mixin 產生？
8. `types/row.d.ts` 與 runtime source 有哪些值得注意的差異？
9. 官方 `grid.vue` example 覆蓋了哪些主線場景？
10. 這組元件目前是否有直接 unit test 可以作為行為證據？

