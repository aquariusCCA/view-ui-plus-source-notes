# Layout Shell 原始碼閱讀總覽

## 1. 本目錄定位

`08-layout-and-containers/02-layout-shell/` 用來閱讀 View UI Plus 的頁面骨架元件：

```txt
Layout / Header / Sider / Content / Footer
```

這組元件的重點不是複雜渲染，而是「頁面骨架如何由幾個薄元件組合出來」。閱讀時應優先觀察三件事：

| 主線 | 代表問題 |
| --- | --- |
| 外層骨架 | `Layout` 如何知道自己包含 `Sider`，並切換成左右布局？ |
| 區塊 wrapper | `Header`、`Content`、`Footer` 為什麼幾乎只輸出 class？ |
| 側邊欄狀態 | `Sider` 如何處理收合、v-model、trigger、breakpoint 與寬度？ |

本目錄以 View UI Plus `v1.3.20` 作為 Source Baseline：

```txt
01-origin/source/view-ui-plus-v1.3.20/
```

---

## 2. 核心心智模型

`Layout` shell 可以先用下面這條鏈理解：

```txt
Layout slot
  -> detect direct Sider child after mounted
  -> add ivu-layout-has-sider
  -> layout.less switches flex-direction
  -> Header / Content / Footer provide fixed class wrappers
  -> Sider owns collapse, width, trigger and breakpoint behavior
```

其中最需要分開看的，是 `Layout` 和 `Sider` 的責任：

| 元件 | 核心責任 |
| --- | --- |
| `Layout` | 建立 flex container，根據直屬 `Sider` 切換 row / column 骨架。 |
| `Header` | 輸出 `ivu-layout-header`，樣式由 Less 接管。 |
| `Content` | 輸出 `ivu-layout-content`，承載主要內容並 flex 填滿。 |
| `Footer` | 輸出 `ivu-layout-footer`，樣式由 Less 接管。 |
| `Sider` | 控制側邊欄寬度、收合狀態、trigger、responsive breakpoint。 |

---

## 3. Notes Index

建議依照下列順序閱讀。

| 順序 | 筆記 | 主題 | 閱讀目的 |
| --- | --- | --- | --- |
| 1 | `01-source-map.md` | 原始碼入口地圖 | 先知道 runtime、style、type、example、registry 分別在哪裡。 |
| 2 | `02-public-contract-slots-and-export-boundary.md` | public contract、slot 與匯出邊界 | 建立五個元件對外 API、slot、事件、v-model 與 install alias。 |
| 3 | `03-layout-structure-and-has-sider-detection.md` | `Layout` 骨架與 `hasSider` | 理解 `Layout` 如何偵測 `Sider` 並讓 Less 切換布局方向。 |
| 4 | `04-header-content-footer-thin-shells.md` | `Header` / `Content` / `Footer` 薄殼元件 | 理解三個靜態區塊為什麼 runtime 很薄，真正差異在 class 與 Less。 |
| 5 | `05-sider-collapse-v-model-width-and-trigger.md` | `Sider` 收合、寬度與 trigger | 理解 `modelValue`、`defaultCollapsed`、`width`、`collapsedWidth`、trigger 顯示規則。 |
| 6 | `06-sider-breakpoint-responsive-and-lifecycle.md` | `Sider` breakpoint 與生命週期 | 理解 `matchMedia`、`dimensionMap`、resize listener、`mediaMatched` 與清理流程。 |
| 7 | `07-less-layout-rules-examples-type-gaps-and-self-check.md` | Less、examples、type gap、自我檢查 | 用樣式與官方範例回扣行為，並整理 runtime / `.d.ts` 差異。 |

---

## 4. 三條閱讀主線

### 4.1 `Layout`：骨架方向切換器

`Layout` 自己不管理子元件狀態。它只在 mounted 後檢查 default slot 中是否有直屬 `Sider`：

```txt
has Sider
  -> ivu-layout-has-sider
  -> flex-direction: row
```

這個 class 是 `Layout` 和 Less 之間的關鍵橋梁。

### 4.2 `Header` / `Content` / `Footer`：語意 wrapper

這三個元件的 template 都很薄：

```txt
div class
  -> default slot
```

它們的價值不是 JavaScript 邏輯，而是把頁面區域穩定映射成 `ivu-layout-*` class，交給 `src/styles/components/layout.less` 控制高度、padding、背景與 flex 行為。

### 4.3 `Sider`：Layout shell 中唯一有狀態的元件

`Sider` 是本組元件最值得細讀的部分：

```txt
modelValue
  -> siderWidth
  -> wrapStyles width / minWidth / maxWidth / flex
  -> trigger visibility
  -> update:modelValue / on-collapse
  -> breakpoint matchMedia auto collapse
```

讀 `Sider` 時要同時看 runtime、Less、official example 與 type declaration，否則容易漏掉 trigger、zero-width、breakpoint 這些分支。

---

## 5. 建議三輪閱讀法

### 5.1 第一輪：建立地圖

先讀：

```txt
README.md
01-source-map.md
02-public-contract-slots-and-export-boundary.md
```

這一輪只需要知道五個元件的 source path、對外 API 與 export/install 邊界。

### 5.2 第二輪：追 runtime 流程

再讀：

```txt
03-layout-structure-and-has-sider-detection.md
04-header-content-footer-thin-shells.md
05-sider-collapse-v-model-width-and-trigger.md
06-sider-breakpoint-responsive-and-lifecycle.md
```

這一輪要能說明 class、inline style、v-model、trigger 與 breakpoint 如何產生。

### 5.3 第三輪：回到 Less 與 examples

最後讀：

```txt
07-less-layout-rules-examples-type-gaps-and-self-check.md
```

這一輪要確認 runtime 產生的 class 如何被 Less 接住，並用官方 example 檢查理解是否完整。

---

## 6. 完整學習成果

讀完本目錄後，應該能回答：

1. `Layout` 什麼時候會加上 `ivu-layout-has-sider`？
2. `ivu-layout-has-sider` 在 Less 中會造成什麼布局變化？
3. `Header`、`Content`、`Footer` 的 runtime 為什麼很薄？
4. `Sider.modelValue` 和 `update:modelValue` 如何形成 v-model？
5. `defaultCollapsed` 和外部 `modelValue` 的關係是什麼？
6. `Sider.width`、`collapsedWidth`、`mediaMatched` 如何共同決定 `siderWidth`？
7. bottom trigger 和 zero-width trigger 分別何時顯示？
8. 自訂 `trigger` slot 會取代哪一段預設 DOM？
9. `breakpoint="sm"` 最後會轉成哪個 media query？
10. `on-collapse` 事件是在什麼時機被 emit？
11. runtime source 與 `types/layout.d.ts` 有哪些值得注意的差異？
12. 官方 `layout.vue` example 覆蓋了哪些主線場景？
