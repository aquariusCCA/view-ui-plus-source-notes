# Layout and Containers 來源材料索引

## 0. 原始筆記問題分析

這份原始筆記屬於「原始碼閱讀筆記」與「來源材料索引」的混合型筆記。它已經整理出 View UI Plus `08-layout-and-containers/` 章節會用到的 runtime source、entry source、style source、type declaration、official examples、registry / install 與 test source，因此資料基礎相當完整。

不過，如果要把它放進 `08-layout-and-containers/00-overview/` 作為本章總覽材料，原始版本仍有幾個可以補強的地方。

第一，原始筆記目前比較像「路徑清單」。它能快速告訴讀者檔案在哪裡，但還沒有充分說明「為什麼要看這些檔案」、「這些檔案彼此如何驗證」以及「讀原始碼時應該怎麼建立結論」。

第二，原始筆記已經指出 `public component` 的 entry file 和實際 runtime source 可能不在同一個目錄，但這個觀念對第一次讀 View UI Plus 原始碼的人非常重要，應該補成一個明確的閱讀模型。否則讀者可能只看 `src/components/header/index.js`，卻沒有追到真正的 `src/components/layout/header.vue`。

第三，style source、type declaration、examples 與 tests 在原始筆記中已經列出，但仍需要補上它們的「證據角色」。例如 `.d.ts` 代表 TypeScript 使用者看到的 public contract，但不等於 runtime 一定真的消費該 props；examples 可以驗證官方展示的主要場景，但不能取代 runtime source；unit test 可以提供行為證據，但沒有測試不代表行為不存在。

第四，這篇筆記應該補成「後續閱讀每組 layout/container 元件時的查核地圖」。也就是說，未來閱讀 `Row` / `Col`、`Layout` / `Sider`、`Card`、`Collapse`、`Space`、`Split`、`Affix` 等元件時，都可以回到本篇確認應該從哪些來源材料交叉驗證。

第五，原始筆記中已經明確提供的路徑資訊應完整保留；但對於沒有提供的實作細節，例如某個 props 實際如何計算 class、某個事件何時 emit、某個 slot 的完整渲染結構，不能在本篇任意推測，應留到後續元件筆記中根據 runtime source 實際確認。

---

## 1. 本章定位

這篇筆記放在 `08-layout-and-containers/00-overview/`，用途是作為 `08-layout-and-containers/` 全章的「來源材料索引」與「原始碼查核地圖」。

`08-layout-and-containers/` 這一章關注 View UI Plus 中負責頁面結構、區塊排列與內容容器的元件，例如 `Row`、`Col`、`Layout`、`Sider`、`Card`、`Grid`、`Collapse`、`Space`、`Split`、`Affix`、`FooterToolbar`、`GlobalFooter` 等。這些元件的共同點是：它們主要負責內容如何被排列、承載、收合、分割、固定或放置在頁面結構中，而不是負責表單資料校驗、表格資料渲染或彈層生命週期。

本篇筆記要解決的問題不是「逐一分析每個元件的 props 和行為」，而是先回答一個更基礎的問題：

> 當我要閱讀 View UI Plus 的 layout/container 元件時，應該去哪裡找 runtime、樣式、型別、範例、註冊入口與測試證據？

讀完本篇後，讀者應該能理解：

1. 本章固定以 View UI Plus `v1.3.20` 作為閱讀基準。
2. 每個 layout/container 元件的 runtime source 主要分布在哪些目錄。
3. 哪些 public component 的 entry file 只是轉接到其他 runtime source。
4. style source、type declaration、official examples、registry / install 與 test source 分別提供什麼證據。
5. 後續分析單一元件時，應如何交叉驗證 runtime 行為、樣式類別、公開型別與官方示例。

本篇不深入分析每個元件的內部實作細節。像是 `Row` / `Col` 如何產生 gutter、`Sider` 如何響應 breakpoint、`Collapse` 如何同步 active panel、`Split` 如何處理拖曳、`Affix` 如何計算 fixed 位置，這些都應該留到後續對應元件筆記中逐步展開。

---

## 2. 學習前先建立的基本觀念

在使用這份來源材料索引之前，需要先建立幾個原始碼閱讀觀念。

### 2.1 Source Baseline：固定版本才有穩定結論

本章以 View UI Plus `v1.3.20` 作為固定閱讀基準：

```txt
01-origin/source/view-ui-plus-v1.3.20/
```

這代表本章所有 runtime、style、type declaration、example、registry 與 test 結論，都應回到這個版本確認。這一點非常重要，因為 UI 元件庫的 source code 可能會隨版本調整，例如 props 名稱、class 生成方式、Less 檔案拆分、examples 展示方式或 type declaration 內容都可能改變。

如果在閱讀時混入其他版本的實作細節，就會讓筆記失去一致性。尤其是原始碼閱讀筆記，最怕的不是少寫，而是把不同版本的行為混成同一套結論。

因此，本章後續筆記應遵守一個基本原則：

> 凡是涉及具體檔案路徑、props、event、slot、class、Less mixin、type declaration 或 test 的結論，都應以 `v1.3.20` source 為準。

### 2.2 Runtime Source：真正決定元件行為的地方

`runtime source` 指的是元件真正執行時使用的 `.vue` 或相關程式碼。它是理解元件行為的第一手材料。

例如 `Row` 的 runtime source 是：

```txt
01-origin/source/view-ui-plus-v1.3.20/src/components/row/row.vue
```

`Sider` 的 runtime source 是：

```txt
01-origin/source/view-ui-plus-v1.3.20/src/components/layout/sider.vue
```

當你想知道某個 props 是否真的被使用、某個事件是否真的 emit、某個 slot 是否真的存在，不能只看文件或 `.d.ts`，而應該回到 runtime source 確認。

### 2.3 Entry Source：公開元件名稱的入口不一定等於實作檔案

在元件庫中，`entry source` 通常負責匯出元件，讓使用者可以透過 public component name 使用它。但是 entry source 不一定包含真正的元件實作。

例如 `Header` 的 public entry 是：

```txt
src/components/header/index.js
```

但它的 runtime target 是：

```txt
src/components/layout/header.vue
```

這表示 `Header` 作為公開元件存在於 `src/components/header/` 目錄下，但實際 runtime 實作放在 `src/components/layout/` 目錄中。這種設計常見於成組元件，例如 `Layout`、`Header`、`Sider`、`Content`、`Footer` 這一組本質上是 layout shell 的子元件。

閱讀時要區分：

| 概念 | 作用 | 閱讀重點 |
| --- | --- | --- |
| Public component name | 使用者在模板或全局註冊中看到的元件名稱 | 確認它是否被公開 export |
| Entry source | 元件被 import / install 的入口 | 確認它轉接到哪個 runtime target |
| Runtime target | 真正的元件實作檔案 | 分析 props、computed、render、slot、event、DOM 結構 |

### 2.4 Style Source：layout/container 元件不能只看 `.vue`

layout/container 元件通常高度依賴 class 與 Less。許多元件的核心不只是「渲染了什麼 DOM」，還包含「這些 DOM 套上哪些 class 後會形成什麼布局效果」。

例如 `Row` / `Col` 的 grid class 不應只從 component source 判斷，還要回到：

```txt
src/styles/common/layout.less
src/styles/mixins/layout.less
```

其中 `src/styles/mixins/layout.less` 的 `.make-grid()` 會產生 span、push、pull、offset、order 等 class。這類 Less mixin 生成的 class，往往是 runtime source 看不到完整展開結果的地方。

因此，閱讀 layout/container 元件時，要把 runtime source 和 style source 視為一組：

```txt
runtime props / computed class
  -> 對應 class name
  -> Less source 定義 class 行為
  -> 最終形成版面效果
```

### 2.5 Type Declaration：公開型別是 contract，但不是 runtime 證據

`types/*.d.ts` 代表 TypeScript 使用者看到的 public contract，也就是元件對外宣告的 props、events 或 instance 型別。

但是 type declaration 不等於 runtime 實際行為。實務上可能出現幾種情況：

1. `.d.ts` 有宣告某個 props，但 runtime source 實際沒有使用。
2. runtime source 支援某個 props，但 `.d.ts` 沒有完整描述。
3. `.d.ts` 的型別較寬或較窄，與 runtime 實際容忍值不完全一致。
4. event、slot 或方法在型別層與 runtime 層需要交叉確認。

因此，本章後續筆記在寫出「這個元件支援某個 public API」之前，應該同時檢查 runtime source 和 type declaration。

### 2.6 Official Examples：官方示例用來判斷主推場景

`examples/routers/*.vue` 的作用不是取代 source，而是幫助讀者理解官方希望使用者如何使用該元件。

當 runtime source 支援某個分支，但 examples 從未展示時，筆記中應該區分：

| 判斷類型 | 意義 |
| --- | --- |
| Source 支援 | runtime source 中存在該 props、class、event 或分支 |
| 官方主推用法 | examples 中有清楚展示，代表文件或示例層面常見 |
| 需要後續確認 | source 中可能支援，但缺少 examples 或 tests 佐證 |

這樣寫筆記可以避免把所有 source 分支都誤解成官方推薦用法。

### 2.7 Registry / Install：確認元件是否真的公開

有些檔案存在於 source 中，不代表它就是 public component。要確認某個元件是否屬於 View UI Plus 對外公開的元件，至少應檢查：

```txt
01-origin/source/view-ui-plus-v1.3.20/src/components/index.js
01-origin/source/view-ui-plus-v1.3.20/src/index.js
01-origin/source/view-ui-plus-v1.3.20/types/viewuiplus.components.d.ts
```

這三類資料可以幫助你回答：

1. 元件是否被納入 components registry。
2. 元件是否能透過套件入口被安裝或使用。
3. TypeScript 是否知道這個 component name。

### 2.8 Test Source：測試是行為證據，但不是唯一證據

目前原始筆記指出，與本章直接命中的 unit test 主要是：

```txt
01-origin/source/view-ui-plus-v1.3.20/test/unit/specs/affix.spec.js
```

這代表 `Affix` 有直接對應的 unit test 可以作為行為判斷材料。但要注意：沒有測試不代表行為不存在，只代表你不能把「測試覆蓋」當成該行為的證據。

後續筆記如果要判斷某個行為是否有測試保護，應先搜尋：

```txt
test/unit/specs/
```

---

## 3. 整體概覽

這份索引可以用一條查核鏈來理解：

```txt
固定版本 baseline
  -> runtime source
  -> component entry
  -> style source
  -> type declaration
  -> official examples
  -> registry / install
  -> test source
```

它們各自扮演不同角色。

| 來源材料 | 主要作用 | 適合回答的問題 |
| --- | --- | --- |
| Source baseline | 固定閱讀版本 | 本章結論到底基於哪個 View UI Plus 版本？ |
| Runtime source | 分析元件實際行為 | props、computed、class、slot、event、DOM 結構如何運作？ |
| Component entry | 確認 public component 入口 | 使用者 import / install 的元件名稱對應到哪個實作？ |
| Style source | 分析 class 與版面效果 | runtime 產生的 class 最後如何影響布局？ |
| Type declaration | 確認 TypeScript public contract | TS 使用者能看到哪些 props、元件與型別？ |
| Official examples | 理解官方展示場景 | 官方示例如何組合元件？哪些用法是主流展示？ |
| Registry / install | 確認是否公開註冊 | 該元件是否真的屬於 public component？ |
| Test source | 補充行為驗證證據 | 哪些行為有 unit test 保護？ |

對初學者來說，最重要的是不要把這些來源材料混為一談。runtime source 是行為核心，style source 解釋視覺與布局效果，type declaration 說明 public contract，examples 告訴你官方展示情境，registry / install 確認元件是否公開，tests 則提供特定行為的驗證證據。

---

## 4. 核心內容逐步講解

### 4.1 Source Baseline：所有結論先回到固定版本

本章固定使用以下 source baseline：

```txt
01-origin/source/view-ui-plus-v1.3.20/
```

這是後續所有筆記的根目錄。當你在筆記中寫出「`Row` 的 runtime source 在哪裡」、「`Collapse` 的型別宣告在哪裡」、「`Affix` 是否有 unit test」等結論時，都應該以這個目錄下的檔案為準。

這個 baseline 的價值在於建立可重現性。未來如果 View UI Plus 升級到新版本，原始碼可能發生變動，但這一章仍然可以清楚說明：目前筆記基於 `v1.3.20`，不是基於最新版本，也不是混合版本。

因此，如果後續要做版本升級比較，應另外建立一份版本差異筆記，而不是直接改寫本章既有結論。

### 4.2 Runtime Source Index：先找到真正的元件實作

runtime source 是本章最重要的索引。它告訴你每個元件真正的 `.vue` 實作檔案在哪裡。

| 分組 | 元件 | Runtime source | 初次閱讀重點 |
| --- | --- | --- | --- |
| Grid system | `Row` | `01-origin/source/view-ui-plus-v1.3.20/src/components/row/row.vue` | 觀察 gutter、flex、align、justify、class 與 style 如何生成。 |
| Grid system | `Col` | `01-origin/source/view-ui-plus-v1.3.20/src/components/col/col.vue` | 觀察 span、order、offset、push、pull 與 responsive props 如何轉成 class。 |
| Layout shell | `Layout` | `01-origin/source/view-ui-plus-v1.3.20/src/components/layout/layout.vue` | 觀察父層如何辨識是否包含 `Sider`，並影響 layout class。 |
| Layout shell | `Header` | `01-origin/source/view-ui-plus-v1.3.20/src/components/layout/header.vue` | 觀察 header 作為 layout 子元件的 DOM 與 class 結構。 |
| Layout shell | `Sider` | `01-origin/source/view-ui-plus-v1.3.20/src/components/layout/sider.vue` | 觀察收合、breakpoint、trigger 與 layout 父層關係。 |
| Layout shell | `Content` | `01-origin/source/view-ui-plus-v1.3.20/src/components/layout/content.vue` | 觀察 content 如何作為主要內容區容器。 |
| Layout shell | `Footer` | `01-origin/source/view-ui-plus-v1.3.20/src/components/layout/footer.vue` | 觀察 footer 在 layout shell 中的容器角色。 |
| Content containers | `Card` | `01-origin/source/view-ui-plus-v1.3.20/src/components/card/card.vue` | 觀察 title、extra、border、hover、padding、slot 結構。 |
| Content containers | `Grid` | `01-origin/source/view-ui-plus-v1.3.20/src/components/grid/grid.vue` | 觀察 grid 容器與 `GridItem` 的協作方式。 |
| Content containers | `GridItem` | `01-origin/source/view-ui-plus-v1.3.20/src/components/grid/grid-item.vue` | 觀察單一 grid item 的 class、slot 與可能的尺寸處理。 |
| Collapsible containers | `Collapse` | `01-origin/source/view-ui-plus-v1.3.20/src/components/collapse/collapse.vue` | 觀察 active names、accordion、事件回傳與 panel 管理。 |
| Collapsible containers | `Panel` | `01-origin/source/view-ui-plus-v1.3.20/src/components/collapse/panel.vue` | 觀察 panel name、header、content slot 與父層狀態關係。 |
| Spacing and split | `Space` | `01-origin/source/view-ui-plus-v1.3.20/src/components/space/space.vue` | 觀察間距、方向與 item wrapper 如何生成。 |
| Spacing and split | `Split` | `01-origin/source/view-ui-plus-v1.3.20/src/components/split/split.vue` | 觀察拖曳分割、pane 尺寸、事件與方向處理。 |
| Spacing and split | `Split` internal trigger | `01-origin/source/view-ui-plus-v1.3.20/src/components/split/trigger.vue` | 觀察 split trigger 作為內部輔助元件的角色。 |
| Positioning containers | `Affix` | `01-origin/source/view-ui-plus-v1.3.20/src/components/affix/affix.vue` | 觀察 scroll / resize、fixed style、placeholder 與定位計算。 |
| Page footer containers | `FooterToolbar` | `01-origin/source/view-ui-plus-v1.3.20/src/components/footer-toolbar/footer-toolbar.vue` | 觀察頁面底部操作區的固定定位與內容組裝。 |
| Page footer containers | `GlobalFooter` | `01-origin/source/view-ui-plus-v1.3.20/src/components/global-footer/global-footer.vue` | 觀察全局頁尾 links、copyright 與文字排版。 |

這張表的使用方式不是一次把所有 source 都讀完，而是作為後續元件筆記的起點。當你要分析 `Collapse`，就先進入 `collapse.vue` 與 `panel.vue`；當你要分析 `Layout`，就先進入 `layout.vue`、`sider.vue` 與相關 layout child components。

### 4.3 Component Entry Index：分清楚公開入口與實作位置

這一組元件中，有些 public component 的 entry file 只是轉接到其他目錄中的 runtime source。這個特徵在 layout/container 元件中特別明顯，因為有些元件是「概念上獨立公開」，但「實作上屬於同一組父子結構」。

| Public component | Entry source | Runtime target | 閱讀重點 |
| --- | --- | --- | --- |
| `Row` | `src/components/row/index.js` | `src/components/row/row.vue` | entry 和 runtime 位於同一元件目錄，閱讀較直覺。 |
| `Col` | `src/components/col/index.js` | `src/components/col/col.vue` | entry 和 runtime 位於同一元件目錄，重點在 grid props 與 style class。 |
| `Layout` | `src/components/layout/index.js` | `src/components/layout/layout.vue` | layout 主元件本身就在 layout 目錄下。 |
| `Header` | `src/components/header/index.js` | `src/components/layout/header.vue` | public entry 獨立，但 runtime 屬於 layout 子元件。 |
| `Sider` | `src/components/sider/index.js` | `src/components/layout/sider.vue` | public entry 獨立，但 runtime 屬於 layout shell。 |
| `Content` | `src/components/content/index.js` | `src/components/layout/content.vue` | public entry 獨立，但 runtime 屬於 layout shell。 |
| `Footer` | `src/components/footer/index.js` | `src/components/layout/footer.vue` | public entry 獨立，但 runtime 屬於 layout shell。 |
| `Panel` | `src/components/panel/index.js` | `src/components/collapse/panel.vue` | public entry 獨立，但 runtime 屬於 `Collapse` 子元件。 |
| `GridItem` | `src/components/grid-item/index.js` | `src/components/grid/grid-item.vue` | public entry 獨立，但 runtime 屬於 `Grid` 子元件。 |

其他元件如 `Card`、`Collapse`、`Space`、`Split`、`Affix`、`FooterToolbar`、`GlobalFooter`，則在各自目錄下有直接 entry。

這裡最需要建立的心智模型是：

```txt
public component name
  -> entry source
  -> runtime target
  -> style source
  -> type declaration
  -> example
  -> registry / install
```

如果只看 entry source，通常只能知道它匯出了什麼；如果要知道元件如何渲染、如何接 props、如何 emit 事件，就必須追到 runtime target。

### 4.4 Style Source Index：用 Less 補齊 runtime 看不到的布局效果

layout/container 元件的樣式來源非常重要，因為很多行為並不是透過 JavaScript 完成，而是透過 class 與 Less 規則完成。

| 分組 | Style source | 閱讀重點 |
| --- | --- | --- |
| `Row` / `Col` | `src/styles/common/layout.less` | row flex、no-wrap、alignment、responsive grid class 入口。 |
| `Row` / `Col` | `src/styles/mixins/layout.less` | `.make-grid()` 如何產生 span、push、pull、offset、order class。 |
| Layout shell | `src/styles/components/layout.less` | `ivu-layout`、`ivu-layout-has-sider`、header、sider、content、footer、trigger 樣式。 |
| `Card` | `src/styles/components/card.less` | card header、body、extra、shadow、border、padding、dis-hover。 |
| `Grid` / `GridItem` | `src/styles/components/grid.less` | grid item float、border、hover、center、main padding。 |
| `Collapse` / `Panel` | `src/styles/components/collapse.less` | header、content、active、simple、arrow、border。 |
| `Space` | `src/styles/components/space.less` | flex layout、vertical direction、item wrapper。 |
| `Split` | `src/styles/components/split.less` | pane、trigger、moving state、horizontal / vertical layout。 |
| `Affix` | `src/styles/components/affix.less` | fixed positioning 與 z-index。 |
| `FooterToolbar` | `src/styles/components/footer-toolbar.less` | fixed footer operation area、left / right content、button spacing。 |
| `GlobalFooter` | `src/styles/components/global-footer.less` | links、copyright、text alignment。 |

style import 入口可從以下檔案確認：

```txt
01-origin/source/view-ui-plus-v1.3.20/src/styles/common/index.less
01-origin/source/view-ui-plus-v1.3.20/src/styles/components/index.less
```

閱讀 style source 時，不要只問「這裡有哪些 CSS」。更重要的是問：

1. runtime source 產生的 class 是否能在 Less 中找到對應規則？
2. 某些 class 是由元件動態產生，還是由 Less mixin 預先生成？
3. 元件的 props 是直接產生 inline style，還是只切換 class？
4. responsive、hover、active、fixed、collapsed、moving 等狀態是由 JS 控制，還是由 class 控制？
5. style import 入口是否確保這些 Less 會被打包進最終樣式中？

### 4.5 Type Declaration Index：檢查 TypeScript 使用者看到的 public contract

type declaration 主要用來確認 TypeScript 使用者在使用元件時能看到什麼型別資訊。

| Type source | 包含元件 | 閱讀重點 |
| --- | --- | --- |
| `types/row.d.ts` | `Row`、`Col` | 檢查 grid system 的 props 型別是否涵蓋 row 與 col。 |
| `types/layout.d.ts` | `Sider`、`Layout`、`Content`、`Footer`、`Header` | 檢查 layout shell 的 public contract 是否和 runtime 組件對應。 |
| `types/card.d.ts` | `Card` | 檢查 title、border、padding、hover 等容器 props 的型別描述。 |
| `types/grid.d.ts` | `Grid`、`GridItem` | 檢查 grid 容器與 item 的型別邊界。 |
| `types/collapse.d.ts` | `Collapse`、`Panel` | 檢查 active name、accordion、panel name 與 event 型別。 |
| `types/space.d.ts` | `Space` | 檢查間距、方向、尺寸等 props 型別。 |
| `types/split.d.ts` | `Split` | 檢查分割方向、尺寸、事件與可拖曳行為的型別。 |
| `types/affix.d.ts` | `Affix` | 檢查 offset、target、scroll / change 類事件型別。 |
| `types/footer-toolbar.d.ts` | `FooterToolbar` | 檢查頁尾操作區 public props 與 slot 型別。 |
| `types/global-footer.d.ts` | `GlobalFooter` | 檢查 links、copyright 等 public contract。 |

閱讀 `.d.ts` 時，建議使用「對照表」方式記錄：

```txt
runtime props
  -> type declaration props
  -> official example 實際用法
  -> 是否一致
  -> 不一致處需要後續補充
```

如果發現 runtime source 與 type declaration 不一致，不要直接判斷誰對誰錯。比較穩健的寫法是：

> 此處 runtime source 與 type declaration 需要交叉確認；目前只能確定 runtime 有某分支，或 type declaration 有某宣告，但實際 public contract 是否完整一致，需要後續補充。

### 4.6 Official Examples Index：用示例理解官方使用情境

official examples 是閱讀元件時非常重要的輔助材料。它們能回答：「官方希望使用者如何組合這些元件？」

| Example source | 對照元件 | 閱讀重點 |
| --- | --- | --- |
| `examples/routers/grid.vue` | `Row` / `Col` grid system | 觀察 grid 的基本欄格、gutter、responsive 或 flex 使用場景。 |
| `examples/routers/layout.vue` | `Layout` / `Header` / `Sider` / `Content` / `Footer` | 觀察頁面骨架如何組合，以及 sider / header / content / footer 的典型位置。 |
| `examples/routers/card.vue` | `Card` | 觀察 title、extra、border、hover、padding 等展示方式。 |
| `examples/routers/grid-component.vue` | `Grid` / `GridItem` | 觀察 grid container 與 grid item 的內容排列方式。 |
| `examples/routers/collapse.vue` | `Collapse` / `Panel` | 觀察 accordion、active panel 與 panel slot 的使用方式。 |
| `examples/routers/space.vue` | `Space` | 觀察水平 / 垂直間距與 item wrapper 用法。 |
| `examples/routers/split.vue` | `Split` | 觀察水平 / 垂直分割與拖曳互動示例。 |
| `examples/routers/affix.vue` | `Affix` | 觀察 fixed 定位與 scroll 場景。 |
| `examples/routers/footer-toolbar.vue` | `FooterToolbar` | 觀察頁面底部操作列的組裝方式。 |
| `examples/routers/global-footer.vue` | `GlobalFooter` | 觀察全局頁尾 links 與 copyright 的配置方式。 |

examples 的閱讀方式應該是「從使用場景反推 source」。例如看到 `examples/routers/split.vue` 使用 `Split` 做水平分割，就可以回到 `split.vue` 找出 direction、pane size、trigger 與事件如何對應，再回到 `split.less` 看 class 如何處理 horizontal / vertical layout。

### 4.7 Registry、Install 與 Public Export：確認元件是否真的對外公開

要確認本章元件是否屬於 public component，至少檢查以下三個檔案：

```txt
01-origin/source/view-ui-plus-v1.3.20/src/components/index.js
01-origin/source/view-ui-plus-v1.3.20/src/index.js
01-origin/source/view-ui-plus-v1.3.20/types/viewuiplus.components.d.ts
```

本章範圍中的元件在 `src/components/index.js` 中均有 public export，包括：

```txt
Affix
Card
Col
Collapse
Content
Footer
FooterToolbar
GlobalFooter
Grid
GridItem
Header
Layout
Panel
Row
Sider
Space
Split
```

這裡要注意的是，public export 和 runtime source 是兩個不同層次的問題。

public export 回答的是：

> 使用者是否能透過 View UI Plus 對外入口使用這個元件？

runtime source 回答的是：

> 這個元件內部到底怎麼運作？

type declaration 回答的是：

> TypeScript 使用者看到的 component contract 是什麼？

三者必須交叉檢查，才能建立完整結論。

### 4.8 Test Source：用測試補強行為判斷

目前在本地 source 中，與本章直接命中的 unit test 主要是：

```txt
01-origin/source/view-ui-plus-v1.3.20/test/unit/specs/affix.spec.js
```

這表示如果後續要分析 `Affix` 的 scroll、resize、fixed positioning 或 change event，就應該把這份 spec 納入閱讀材料。

不過，對其他元件來說，如果暫時沒有直接命中的 unit test，筆記中應避免寫成「此元件沒有測試，所以沒有該行為」。比較準確的說法應該是：

> 目前在已知索引中尚未列出直接對應的 unit test；若後續需要確認測試覆蓋，應重新搜尋 `test/unit/specs/`。

測試的角色是提供額外證據，而不是替代 runtime source。

### 4.9 建立單一元件的交叉驗證流程

後續每篇元件筆記都可以套用同一套交叉驗證流程：

```txt
1. 先確認 public component name
2. 找到 entry source
3. 追到 runtime source
4. 讀 props、computed、methods、watch、slot、event
5. 找出 runtime 產生的 class 或 inline style
6. 回到 style source 確認 class 的布局效果
7. 回到 type declaration 確認 public contract
8. 回到 official example 確認官方展示場景
9. 檢查 registry / install 是否公開
10. 搜尋 test source 是否有行為保護
```

這條流程能讓筆記避免只看單一來源而下結論。尤其是 layout/container 元件，單看 `.vue` 往往看不到完整布局效果；單看 Less 又看不到 props 如何控制 class；單看 examples 則容易只看到最常見用法，而忽略 source 支援的其他分支。

---

## 5. 表格整理

### 5.1 來源材料總表

| 項目 | 位置 / 寫法 | 角色 | 閱讀重點 |
| --- | --- | --- | --- |
| Source baseline | `01-origin/source/view-ui-plus-v1.3.20/` | 固定版本基準 | 所有結論都應回到此版本確認，避免混入其他版本。 |
| Runtime source | `src/components/**/**/*.vue` | 元件實際行為來源 | 分析 props、computed、slot、event、DOM 結構。 |
| Component entry | `src/components/*/index.js` | public component 入口 | 確認 public name 如何轉接到 runtime target。 |
| Style source | `src/styles/common/*.less`、`src/styles/components/*.less`、`src/styles/mixins/*.less` | class 與版面效果來源 | 補齊 runtime class 對應的 CSS / Less 行為。 |
| Type declaration | `types/*.d.ts` | TypeScript public contract | 對照 runtime props / emits / slots 是否一致。 |
| Official examples | `examples/routers/*.vue` | 官方示例場景 | 判斷官方主推的使用方式與組合模式。 |
| Registry / install | `src/components/index.js`、`src/index.js`、`types/viewuiplus.components.d.ts` | 公開註冊與安裝證據 | 確認元件是否屬於 public component。 |
| Test source | `test/unit/specs/` | 行為測試證據 | 檢查特定行為是否有 unit test 保護。 |

這張表是本篇最核心的查核表。後續閱讀任何 layout/container 元件時，都應回到這張表檢查自己是否只看了 runtime，卻忘了 style；只看了 `.d.ts`，卻忘了 runtime；只看了 examples，卻誤以為那就是完整規格。

### 5.2 Runtime Source 總表

| 分組 | 元件 | Runtime source |
| --- | --- | --- |
| Grid system | `Row` | `01-origin/source/view-ui-plus-v1.3.20/src/components/row/row.vue` |
| Grid system | `Col` | `01-origin/source/view-ui-plus-v1.3.20/src/components/col/col.vue` |
| Layout shell | `Layout` | `01-origin/source/view-ui-plus-v1.3.20/src/components/layout/layout.vue` |
| Layout shell | `Header` | `01-origin/source/view-ui-plus-v1.3.20/src/components/layout/header.vue` |
| Layout shell | `Sider` | `01-origin/source/view-ui-plus-v1.3.20/src/components/layout/sider.vue` |
| Layout shell | `Content` | `01-origin/source/view-ui-plus-v1.3.20/src/components/layout/content.vue` |
| Layout shell | `Footer` | `01-origin/source/view-ui-plus-v1.3.20/src/components/layout/footer.vue` |
| Content containers | `Card` | `01-origin/source/view-ui-plus-v1.3.20/src/components/card/card.vue` |
| Content containers | `Grid` | `01-origin/source/view-ui-plus-v1.3.20/src/components/grid/grid.vue` |
| Content containers | `GridItem` | `01-origin/source/view-ui-plus-v1.3.20/src/components/grid/grid-item.vue` |
| Collapsible containers | `Collapse` | `01-origin/source/view-ui-plus-v1.3.20/src/components/collapse/collapse.vue` |
| Collapsible containers | `Panel` | `01-origin/source/view-ui-plus-v1.3.20/src/components/collapse/panel.vue` |
| Spacing and split | `Space` | `01-origin/source/view-ui-plus-v1.3.20/src/components/space/space.vue` |
| Spacing and split | `Split` | `01-origin/source/view-ui-plus-v1.3.20/src/components/split/split.vue` |
| Spacing and split | `Split` internal trigger | `01-origin/source/view-ui-plus-v1.3.20/src/components/split/trigger.vue` |
| Positioning containers | `Affix` | `01-origin/source/view-ui-plus-v1.3.20/src/components/affix/affix.vue` |
| Page footer containers | `FooterToolbar` | `01-origin/source/view-ui-plus-v1.3.20/src/components/footer-toolbar/footer-toolbar.vue` |
| Page footer containers | `GlobalFooter` | `01-origin/source/view-ui-plus-v1.3.20/src/components/global-footer/global-footer.vue` |

這張表適合在撰寫每一篇元件筆記時作為入口。例如分析 `Grid` / `GridItem` 時，不應只讀 `grid.vue`，也要讀 `grid-item.vue`，因為它們是容器與子項目的關係。

### 5.3 Component Entry 對照表

| Public component | Entry source | Runtime target |
| --- | --- | --- |
| `Row` | `src/components/row/index.js` | `src/components/row/row.vue` |
| `Col` | `src/components/col/index.js` | `src/components/col/col.vue` |
| `Layout` | `src/components/layout/index.js` | `src/components/layout/layout.vue` |
| `Header` | `src/components/header/index.js` | `src/components/layout/header.vue` |
| `Sider` | `src/components/sider/index.js` | `src/components/layout/sider.vue` |
| `Content` | `src/components/content/index.js` | `src/components/layout/content.vue` |
| `Footer` | `src/components/footer/index.js` | `src/components/layout/footer.vue` |
| `Panel` | `src/components/panel/index.js` | `src/components/collapse/panel.vue` |
| `GridItem` | `src/components/grid-item/index.js` | `src/components/grid/grid-item.vue` |

這張表主要用來提醒讀者：有些元件的 public export name 與 runtime source 所在目錄不同。後續寫筆記時，應同時記錄「對外入口」和「實際實作」。

### 5.4 Style Source 對照表

| 分組 | Style source | 閱讀重點 |
| --- | --- | --- |
| `Row` / `Col` | `src/styles/common/layout.less` | row flex、no-wrap、alignment、responsive grid class 入口。 |
| `Row` / `Col` | `src/styles/mixins/layout.less` | `.make-grid()` 如何產生 span、push、pull、offset、order class。 |
| Layout shell | `src/styles/components/layout.less` | `ivu-layout`、`ivu-layout-has-sider`、header、sider、content、footer、trigger 樣式。 |
| `Card` | `src/styles/components/card.less` | card header、body、extra、shadow、border、padding、dis-hover。 |
| `Grid` / `GridItem` | `src/styles/components/grid.less` | grid item float、border、hover、center、main padding。 |
| `Collapse` / `Panel` | `src/styles/components/collapse.less` | header、content、active、simple、arrow、border。 |
| `Space` | `src/styles/components/space.less` | flex layout、vertical direction、item wrapper。 |
| `Split` | `src/styles/components/split.less` | pane、trigger、moving state、horizontal / vertical layout。 |
| `Affix` | `src/styles/components/affix.less` | fixed positioning 與 z-index。 |
| `FooterToolbar` | `src/styles/components/footer-toolbar.less` | fixed footer operation area、left / right content、button spacing。 |
| `GlobalFooter` | `src/styles/components/global-footer.less` | links、copyright、text alignment。 |

### 5.5 Type Declaration 對照表

| Type source | 包含元件 |
| --- | --- |
| `types/row.d.ts` | `Row`、`Col` |
| `types/layout.d.ts` | `Sider`、`Layout`、`Content`、`Footer`、`Header` |
| `types/card.d.ts` | `Card` |
| `types/grid.d.ts` | `Grid`、`GridItem` |
| `types/collapse.d.ts` | `Collapse`、`Panel` |
| `types/space.d.ts` | `Space` |
| `types/split.d.ts` | `Split` |
| `types/affix.d.ts` | `Affix` |
| `types/footer-toolbar.d.ts` | `FooterToolbar` |
| `types/global-footer.d.ts` | `GlobalFooter` |

### 5.6 Official Examples 對照表

| Example source | 對照元件 |
| --- | --- |
| `examples/routers/grid.vue` | `Row` / `Col` grid system |
| `examples/routers/layout.vue` | `Layout` / `Header` / `Sider` / `Content` / `Footer` |
| `examples/routers/card.vue` | `Card` |
| `examples/routers/grid-component.vue` | `Grid` / `GridItem` |
| `examples/routers/collapse.vue` | `Collapse` / `Panel` |
| `examples/routers/space.vue` | `Space` |
| `examples/routers/split.vue` | `Split` |
| `examples/routers/affix.vue` | `Affix` |
| `examples/routers/footer-toolbar.vue` | `FooterToolbar` |
| `examples/routers/global-footer.vue` | `GlobalFooter` |

---

## 6. 範例或情境說明

### 6.1 情境一：閱讀 `Row` / `Col` grid system

如果要閱讀 `Row` / `Col`，不要只從 `row.vue` 和 `col.vue` 開始。比較完整的閱讀順序應該是：

```txt
src/components/row/index.js
src/components/row/row.vue
src/components/col/index.js
src/components/col/col.vue
src/styles/common/layout.less
src/styles/mixins/layout.less
types/row.d.ts
examples/routers/grid.vue
src/components/index.js
types/viewuiplus.components.d.ts
```

這組元件的重點是 runtime props 如何轉成 class 或 inline style，而這些 class 又如何被 Less 中的 grid rules 或 mixins 承接。尤其是 span、push、pull、offset、order、responsive props 這類欄格能力，通常不能只從 `.vue` 看出完整樣式效果。

### 6.2 情境二：閱讀 `Header` / `Sider` / `Content` / `Footer`

如果要閱讀 layout shell 的子元件，應先注意 public entry 和 runtime target 的差異。

以 `Header` 為例：

```txt
src/components/header/index.js
  -> src/components/layout/header.vue
```

這代表你在使用者視角看到的是 `Header` 這個 public component，但實際 source 實作放在 `layout` 目錄下。`Sider`、`Content`、`Footer` 也有類似特徵。

因此，閱讀 layout shell 時應把它們當成一組：

```txt
Layout
Header
Sider
Content
Footer
```

然後再回到 `src/styles/components/layout.less` 看 `ivu-layout`、`ivu-layout-has-sider`、trigger、header、sider、content、footer 的 class 如何共同形成頁面骨架。

### 6.3 情境三：閱讀 `Affix`

`Affix` 是本章中比較接近「定位與 DOM 計算」的元件。閱讀它時，除了看 runtime source，也要特別納入 style、example 和 test：

```txt
src/components/affix/affix.vue
src/styles/components/affix.less
types/affix.d.ts
examples/routers/affix.vue
test/unit/specs/affix.spec.js
```

這裡的重點是：`Affix` 不只是把內容包起來，它還涉及 scroll / resize 監聽、fixed positioning、placeholder、offset 與可能的 change event。因此，`Affix` 比 `Card` 這類靜態容器更需要結合 DOM 行為與測試證據來閱讀。

---

## 7. 閱讀路線或學習路線

### 7.1 初次閱讀路線

第一次使用這份索引時，不建議一口氣細讀所有 source。建議先用「全局定位」的方式閱讀：

1. 先確認 source baseline：`01-origin/source/view-ui-plus-v1.3.20/`。
2. 再看 runtime source 總表，知道本章包含哪些元件。
3. 接著看 component entry 對照表，理解 public component name 與 runtime target 的差異。
4. 再看 style source 表，知道每組元件對應的 Less 來源。
5. 最後看 type declaration、examples、registry / install 與 test source，建立完整查核鏈。

這一輪的目的不是記住每個路徑，而是建立「我要分析某個元件時，應該去哪幾個地方找證據」的能力。

### 7.2 單一元件深入閱讀路線

當你要寫某個元件的獨立筆記時，可以使用以下順序：

```txt
public component
  -> entry source
  -> runtime source
  -> style source
  -> type declaration
  -> official example
  -> registry / install
  -> test source
```

每個步驟要回答不同問題：

| 步驟 | 要回答的問題 |
| --- | --- |
| public component | 這個元件對外名稱是什麼？ |
| entry source | 它從哪裡被 export / install？ |
| runtime source | 它實際如何接收 props、渲染 DOM、處理事件？ |
| style source | runtime 產生的 class 對應到哪些 Less 規則？ |
| type declaration | TS 使用者看到的 public contract 是什麼？ |
| official example | 官方如何示範這個元件的使用情境？ |
| registry / install | 它是否真的被納入 public component？ |
| test source | 哪些行為有測試保護？ |

### 7.3 本章後續筆記銜接路線

這篇索引筆記應該和 `08-layout-and-containers/` 內後續目錄銜接：

```txt
00-overview/
  -> 01-grid-system/
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

`00-overview/` 負責建立範圍、閱讀方法與來源索引。後續目錄則逐步展開每組元件的 runtime、style、types、examples 與實務閱讀練習。

---

## 8. 常見誤區

| 誤區 | 為什麼容易誤解 | 正確理解 |
| --- | --- | --- |
| 只看 `index.js` 就以為讀完元件 | entry source 往往很短，看起來像是元件入口 | `index.js` 多半只是 public export，真正行為要追到 runtime target。 |
| 把 public component 目錄誤認為 runtime 目錄 | `Header`、`Sider`、`Panel`、`GridItem` 有獨立 entry 目錄 | 實作可能放在 `layout/`、`collapse/`、`grid/` 等主元件目錄中。 |
| 只看 `.vue` 不看 Less | runtime source 可以看到 class name，但看不到 class 的完整布局效果 | layout/container 元件必須把 runtime class 和 Less source 一起看。 |
| 把 `.d.ts` 當成 runtime 真相 | Type declaration 是 public contract，不是元件執行流程 | props、events、slots 結論應回到 runtime source 交叉確認。 |
| 把 examples 當成完整規格 | examples 通常只展示主要場景 | examples 可判斷官方主推用法，但不能取代 source。 |
| 沒看到 test 就說功能不存在 | 測試覆蓋不完整是常見情況 | 沒有測試只能說缺少測試證據，不能否定 runtime 行為。 |
| 混用不同版本 source | UI library 版本差異可能影響 props、style、types | 本章所有結論都應固定回到 `v1.3.20` baseline。 |
| 只記路徑不理解證據角色 | 索引表容易變成速查表 | 每個來源材料都要知道它能證明什麼、不能證明什麼。 |

---

## 9. 本章總結

這篇筆記的核心價值，是把 `08-layout-and-containers/` 章節需要用到的來源材料整理成一套可重複使用的原始碼查核地圖。

對 layout/container 元件來說，單一來源通常不足以建立完整理解。runtime source 可以告訴你元件如何接 props、渲染 DOM、處理事件與產生 class；style source 才能解釋這些 class 如何形成實際布局；type declaration 則代表 TypeScript 使用者看到的 public contract；official examples 告訴你官方示範的主要使用場景；registry / install 確認元件是否屬於 public component；test source 則提供特定行為的驗證證據。

因此，後續閱讀 `Row` / `Col`、`Layout` / `Sider`、`Card`、`Grid`、`Collapse`、`Space`、`Split`、`Affix`、`FooterToolbar`、`GlobalFooter` 時，都不應只看單一檔案，而應沿著：

```txt
entry
  -> runtime
  -> style
  -> types
  -> examples
  -> registry
  -> tests
```

這條路線進行交叉驗證。

本篇不負責分析每個元件的完整行為，而是負責建立「要去哪裡查」、「每個來源材料代表什麼證據」、「哪些地方不能過度推論」的閱讀基礎。只要先掌握這份索引，後續進入單一元件分析時，就比較不容易迷失在檔案路徑與 source 結構中。

---

## 10. 自我檢查問題

1. 本章為什麼要固定以 View UI Plus `v1.3.20` 作為 source baseline？
2. `runtime source` 和 `component entry` 的差異是什麼？
3. 為什麼 `Header`、`Sider`、`Content`、`Footer` 的 public entry 和 runtime source 可能在不同目錄？
4. 閱讀 `Row` / `Col` 時，為什麼不能只看 `row.vue` 和 `col.vue`？
5. `src/styles/mixins/layout.less` 對 grid system 的閱讀有什麼重要性？
6. `types/*.d.ts` 可以證明什麼？又不能單獨證明什麼？
7. official examples 在原始碼閱讀中扮演什麼角色？
8. 如果某個元件沒有對應 unit test，可以得出什麼結論？不能得出什麼結論？
9. 要確認某個元件是否屬於 public component，至少應檢查哪些檔案？
10. 後續分析單一 layout/container 元件時，應如何依序交叉驗證 entry、runtime、style、types、examples、registry 與 tests？

---

## 11. 後續延伸方向

這篇來源材料索引之後，可以延伸成以下主題筆記：

1. **Grid system source reading**
   - 分析 `Row` / `Col` 的 runtime props、gutter、flex、responsive class 與 Less mixin 生成規則。

2. **Layout shell source reading**
   - 分析 `Layout`、`Header`、`Sider`、`Content`、`Footer` 的 public entry、runtime target、父子關係與 sider 收合行為。

3. **Content containers source reading**
   - 分析 `Card`、`Grid`、`GridItem` 如何處理 title、extra、border、hover、padding 與內容容器結構。

4. **Collapsible containers source reading**
   - 分析 `Collapse` / `Panel` 的 active names、accordion、panel name、slot 與事件回傳。

5. **Spacing and split source reading**
   - 比較 `Space` 作為間距容器與 `Split` 作為拖曳分割容器的差異。

6. **Positioning containers source reading**
   - 深入分析 `Affix` 的 scroll / resize 監聽、fixed style、placeholder 與 unit test。

7. **Style system reading**
   - 專門整理 `src/styles/common/`、`src/styles/components/`、`src/styles/mixins/` 如何支撐 layout/container 元件。

8. **Type contract audit**
   - 對照 runtime props / emits / slots 與 `types/*.d.ts`，整理 public contract 是否一致。

9. **Official examples reading**
   - 從 `examples/routers/*.vue` 反推官方主推用法，區分 source 支援與文件展示場景。

10. **Registry and install mechanism**
    - 分析 `src/components/index.js`、`src/index.js`、`types/viewuiplus.components.d.ts` 如何共同形成 public export 與安裝機制。
