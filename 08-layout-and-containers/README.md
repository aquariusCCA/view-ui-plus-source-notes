# Layout and Containers：View UI Plus 版面與容器元件源碼閱讀地圖

## 1. 本章定位

`08-layout-and-containers/` 用來整理 View UI Plus 中負責頁面結構、區塊排列與內容容器的元件。

這一組元件的重點不是單一視覺樣式，而是「如何承載、排列、收合、固定或分割內容」。閱讀時應優先觀察父子元件關係、slot 邊界、class 結構、響應式規則、尺寸計算與 TypeScript public contract。

本章以 View UI Plus `v1.3.20` 作為 Source Baseline：

```txt
01-origin/source/view-ui-plus-v1.3.20/
```

## 2. 元件範圍

本章涵蓋下列元件：

| 分組 | 元件 | 閱讀重點 |
| --- | --- | --- |
| Grid system | `Row` / `Col` | 24 欄、gutter、flex、responsive props。 |
| Layout shell | `Layout` / `Header` / `Sider` / `Content` / `Footer` | 頁面骨架、Sider 收合、breakpoint、slot 結構。 |
| Content containers | `Card` / `Grid` / `GridItem` | 卡片容器、宮格內容、border / hover / padding。 |
| Collapsible containers | `Collapse` / `Panel` | 父子狀態、active names、accordion、panel slot。 |
| Spacing and split | `Space` / `Split` | 間距組合、可拖曳分割、尺寸與方向。 |
| Positioning containers | `Affix` | fixed 定位、滾動監聽、容器邊界。 |
| Page footer containers | `FooterToolbar` / `GlobalFooter` | 偏業務頁面的底部操作區與全局頁尾。 |

## 3. 目錄說明

| 目錄 | 作用 |
| --- | --- |
| `00-overview/` | 本章總覽、閱讀方法、來源材料索引。 |
| `01-grid-system/` | `Row`、`Col` 的 grid system 筆記。 |
| `02-layout-shell/` | `Layout`、`Header`、`Sider`、`Content`、`Footer` 的頁面骨架筆記。 |
| `03-content-containers/` | `Card`、`Grid`、`GridItem` 的內容容器筆記。 |
| `04-collapsible-containers/` | `Collapse`、`Panel` 的可收合容器筆記。 |
| `05-spacing-and-split/` | `Space`、`Split` 的間距與分割布局筆記。 |
| `06-positioning-containers/` | `Affix` 的定位容器與 scroll 邊界筆記。 |
| `07-page-footer-containers/` | `FooterToolbar`、`GlobalFooter` 的頁尾容器筆記。 |
| `08-style-system/` | layout/container 相關 Less、class 命名、尺寸與狀態樣式整理。 |
| `09-type-contracts/` | layout/container 元件的 TypeScript public contract 對照。 |
| `10-labs/` | mini grid、mini layout、mini collapse、mini affix 等仿作練習。 |

## 4. 建議閱讀順序

建議先從結構最穩定、依賴最少的布局能力開始，再進入狀態與互動容器：

```txt
01-grid-system/
  -> 02-layout-shell/
  -> 03-content-containers/
  -> 04-collapsible-containers/
  -> 05-spacing-and-split/
  -> 06-positioning-containers/
  -> 07-page-footer-containers/
  -> 08-style-system/
  -> 09-type-contracts/
  -> 10-labs/
```

每組元件可使用同一套閱讀主線：

```txt
public props / slots / events
  -> runtime source
  -> computed class / inline style
  -> parent-child relationship
  -> style source
  -> type declaration
  -> example usage
  -> design takeaway
```

## 5. 來源材料對照

| 類型 | 路徑 | 用途 |
| --- | --- | --- |
| Runtime source | `01-origin/source/view-ui-plus-v1.3.20/src/components/` | props、computed、methods、template、emit、slot。 |
| Component styles | `01-origin/source/view-ui-plus-v1.3.20/src/styles/components/` | Less、class、尺寸、狀態樣式、布局規則。 |
| Type declarations | `01-origin/source/view-ui-plus-v1.3.20/types/` | TypeScript 使用者看到的 public contract。 |
| Examples | `01-origin/source/view-ui-plus-v1.3.20/examples/routers/` | 官方示例、slot 寫法與主要使用場景。 |
| Component registry | `01-origin/source/view-ui-plus-v1.3.20/src/components/index.js` | 確認元件是否進入 public export。 |
| Plugin install | `01-origin/source/view-ui-plus-v1.3.20/src/index.js` | 確認全局註冊名稱與 install 行為。 |
