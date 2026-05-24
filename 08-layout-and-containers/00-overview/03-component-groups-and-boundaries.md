# Layout and Containers 元件分組與責任邊界

## 0. 原始筆記問題分析

這篇原始筆記屬於「原始碼閱讀筆記」與「架構分析筆記」的混合型筆記。它不是要深入分析單一元件的每一行實作，而是要在進入 `Row`、`Col`、`Layout`、`Sider`、`Card`、`Collapse`、`Space`、`Split`、`Affix` 等元件之前，先建立整章的元件分組方式與責任邊界。

原始筆記已經有幾個重要優點：它清楚列出各組元件、指出哪些元件是父子關係、哪些元件偏樣式 wrapper、哪些元件依賴 DOM 尺寸或 scroll，也提醒讀者不要把 layout/container 元件誤解成「只是一層 `div` 加 class」。

不過，若要放進長期學習用的知識庫，原始筆記仍有幾個可以補強的地方：

1. **分組邏輯可以再教學化**：原文已經列出分組，但還可以補充「為什麼要這樣分組」，讓讀者理解這不是單純依元件名稱分類，而是依照責任、資料流、父子關係與 DOM 依賴程度分類。
2. **責任邊界可以再系統化**：原文有提到 public component、internal helper、父子狀態、樣式 class、DOM 計算等概念，但尚未形成一套可重複使用的閱讀框架。
3. **各組元件的比較可以更完整**：例如 `Card` 和 `Grid` 都是 content container，但一個是獨立容器，另一個是父子容器；`Space` 和 `Split` 都與布局有關，但一個偏靜態間距，一個偏高互動拖曳。這些差異適合用表格重新整理。
4. **需要補上初學者閱讀方式**：讀者在看這類元件時，容易不知道該先看 props、slot、provide/inject、style 還是 examples，因此需要明確閱讀路線。
5. **需要補上常見誤區與自我檢查問題**：原始筆記目前偏總結，缺少用來驗證理解的問題設計。

本次重構會保留原始筆記中對各組元件責任的判斷，並將其補強成一篇適合作為 `08-layout-and-containers/00-overview/` 入口的教材型筆記。

---

## 1. 本章定位

本篇筆記放在：

```txt
08-layout-and-containers/00-overview/
```

它的主題是 **Layout and Containers 元件分組與責任邊界**。

這篇筆記要解決的問題不是「某個元件怎麼實作」，而是先回答：

1. 本章有哪些元件？
2. 這些元件為什麼可以被放在同一章？
3. 每一組元件的主要責任是什麼？
4. 哪些元件只是樣式 wrapper？
5. 哪些元件有父子狀態協作？
6. 哪些元件需要觀察 DOM 尺寸、scroll、resize 或拖曳事件？
7. 哪些元件是 public component，哪些只是 internal helper？

換句話說，這篇筆記是後續閱讀單一元件原始碼前的「地圖」。如果沒有先建立這張地圖，讀者很容易在閱讀時陷入兩種問題：

- 把所有 layout/container 元件都看成一樣的「容器元件」。
- 一開始就深入某個元件的 props 或樣式細節，卻不知道它在整章中的角色。

本篇不會詳細展開每個元件的所有 props、slot、emits、Less class 或完整 source code。這些內容應該放到後續子章節，例如：

```txt
01-grid-system/
02-layout-shell/
03-content-containers/
04-collapsible-containers/
05-spacing-and-split/
06-positioning-containers/
07-page-footer-containers/
08-style-system/
09-type-contracts/
10-labs/
```

---

## 2. 學習前先建立的基本觀念

### 2.1 Layout / Container 元件不是只有外層結構

在 UI library 中，layout/container 元件常被誤解成「只是包一層 HTML 結構」。這種理解只對一部分元件成立，例如某些 header、footer、content wrapper 的確主要負責輸出固定 class 與 slot。

但 View UI Plus 的 layout/container 元件並不全部如此。本章中有些元件會處理：

- 父子元件上下文，例如 `Row` / `Col`、`Grid` / `GridItem`、`Collapse` / `Panel`。
- 響應式 class 與 Less 生成規則，例如 `Row` / `Col`。
- 收合狀態與事件回傳，例如 `Sider`、`Collapse`。
- DOM 尺寸、scroll、resize、拖曳事件，例如 `Grid`、`Split`、`Affix`。
- 業務頁面操作區或全局頁尾，例如 `FooterToolbar`、`GlobalFooter`。

因此，閱讀本章元件時，不能只看 template 裡有幾層 `div`。更重要的是理解：**這個元件的責任邊界在哪裡，它和其他元件如何協作，以及它的行為是否需要對照 style、type declaration、examples 或 test。**

### 2.2 Public component、runtime source 與 internal helper

閱讀 View UI Plus 原始碼時，要先區分三個概念：

| 概念 | 說明 | 閱讀重點 |
| --- | --- | --- |
| Public component | 使用者可以在專案中直接使用或由套件公開匯出的元件 | 需要對照 entry、type declaration、examples 與 runtime props |
| Runtime source | 元件實際執行邏輯所在的 `.vue` 或輔助檔案 | 需要閱讀 props、computed、watch、methods、provide/inject、emit |
| Internal helper | 只服務某個主元件內部，不應視為獨立公開元件 | 應放在主元件實作筆記中說明，不必建立完整 public contract 筆記 |

例如 `Split` 是 public component，而 `Split` 內部使用的 `trigger.vue` 是 internal helper。`trigger.vue` 的作用是支撐 `Split` 拖曳分割線的 UI 與互動，不應被當成獨立對外元件分析。

### 2.3 樣式責任不一定在 runtime source 裡

layout/container 元件有一個共同特性：很多視覺結果不是直接寫在 `.vue` 檔案裡，而是由 Less 樣式系統決定。

例如 `Col` 可能產生：

```txt
ivu-col-span-12
ivu-col-span-md-8
```

但是這些 class 真正如何對應 width、offset、push、pull、order，通常需要回到：

```txt
src/styles/mixins/layout.less
src/styles/common/layout.less
```

也就是說，runtime source 告訴你「產生了什麼 class」，Less source 才告訴你「這些 class 最後造成什麼布局效果」。

### 2.4 父子狀態是本章的重要線索

本章不少元件不是單獨運作，而是透過父子關係協作。常見形式包括：

| 關係類型 | 代表元件 | 說明 |
| --- | --- | --- |
| 父層提供上下文，子層注入使用 | `Row` / `Col`、`Grid` / `GridItem`、`Collapse` / `Panel` | 子元件的行為會受到父層 props 或狀態影響 |
| 父層檢查 slot children | `Layout` / `Sider` | 父層不是 provide 狀態，而是判斷子元件是否存在 |
| 主元件使用內部 helper | `Split` / `trigger.vue` | helper 不對外公開，只支撐主元件內部互動 |

閱讀時要先問：「這個元件是獨立運作，還是必須和父層或子層一起看？」這會直接影響閱讀順序。

---

## 3. 整體概覽

本章的 layout/container 元件可以依責任分成七組：

| 分組 | 元件 | 責任類型 | 核心閱讀問題 |
| --- | --- | --- | --- |
| Grid System | `Row` / `Col` | 欄格系統、父子上下文、Less 生成 class | 24 欄、gutter、flex、responsive class 如何共同形成布局？ |
| Layout Shell | `Layout` / `Header` / `Sider` / `Content` / `Footer` | 頁面骨架、側邊欄收合、slot child 判斷 | 頁面骨架如何識別 `Sider`，`Sider` 如何處理收合與 breakpoint？ |
| Content Containers | `Card` / `Grid` / `GridItem` | 內容容器、卡片語意、宮格父子協作 | 哪些是獨立容器，哪些需要父子注入與 resize？ |
| Collapsible Containers | `Collapse` / `Panel` | 父子狀態容器、active key 管理 | active key 如何從父層傳到 panel，點擊後如何回傳事件？ |
| Spacing and Split | `Space` / `Split` | 間距容器、拖曳分割容器 | 靜態間距與高互動拖曳布局有什麼不同？ |
| Positioning Containers | `Affix` | 固定定位、scroll / resize 監聽、placeholder | 元素如何從一般流切換成 fixed，並維持原本佔位？ |
| Page Footer Containers | `FooterToolbar` / `GlobalFooter` | 業務頁尾容器、固定操作區、全局頁尾 | 框架提供的容器能力和業務組裝習慣如何區分？ |

這些元件的共同點是：它們都在處理「內容如何被放在頁面上」。但它們處理的層級不同：

```txt
頁面骨架
  -> 欄格與區塊排列
  -> 內容容器
  -> 收合與展開
  -> 間距與分割
  -> 固定定位
  -> 頁尾操作區
```

因此，本章不是資料展示章節，也不是表單章節，更不是彈層服務章節。它的核心是 **結構、空間、位置與容器關係**。

---

## 4. 核心內容逐步講解

### 4.1 為什麼要先看分組與邊界

layout/container 元件最容易被低估，因為它們表面上看起來常常只是包了一層結構。例如：

```vue
<Layout>
  <Sider />
  <Content />
</Layout>
```

或者：

```vue
<Row>
  <Col span="12" />
</Row>
```

初學者可能會以為這些元件只是在輸出固定 DOM 結構，但實際閱讀原始碼時會發現，真正重要的是它們背後的責任分配。

本章元件至少涉及以下幾種邊界：

```txt
誰是 public component
誰是 internal helper
誰負責父子狀態
誰只負責樣式 class
誰依賴 DOM 尺寸或 scroll
誰的行為必須對照 Less 才能理解
```

這些問題會直接決定你要看哪些檔案，以及要用什麼順序閱讀。例如：

- 看 `Col` 時，如果不看 `Row`，就不容易理解 `gutter` 來源。
- 看 `Col` 時，如果不看 Less mixin，就不容易理解 `ivu-col-span-*` class 的實際寬度。
- 看 `Panel` 時，如果不看 `Collapse`，就無法理解 active key 的來源。
- 看 `Split` 時，如果只看 props，不追蹤 mousemove / mouseup，就無法理解拖曳如何改變布局。
- 看 `Affix` 時，如果只看 class，不追蹤 scroll 計算，就無法理解 fixed 狀態切換。

因此，分組與責任邊界不是筆記目錄上的分類，而是閱讀原始碼時的導航系統。

---

### 4.2 Grid System：`Row` / `Col`

`Row` / `Col` 是本章最基礎的 layout system。它們負責建立 View UI Plus 的欄格系統，也就是讓頁面可以依照 24 欄、gutter、flex、responsive props 進行區塊排列。

| 元件 | 主要責任 | 閱讀重點 |
| --- | --- | --- |
| `Row` | 建立 row wrapper、提供 `RowInstance`、處理 `gutter`、`align`、`justify`、`wrap` | 看它如何提供父層上下文與 row class |
| `Col` | 注入 `RowInstance` 取得 gutter，處理 span、order、offset、push、pull、responsive props、flex | 看它如何把 props 轉成 class 與 style |

這組元件的核心邊界可以整理成：

```txt
Row 提供上下文與 row class
  -> Col 注入 RowInstance
  -> Col 根據 gutter 產生左右 padding
  -> Less mixin 產生 24 欄與 responsive class
```

這裡有兩層要分開理解。

第一層是 runtime 邏輯。`Row` 提供上下文，`Col` 取得父層的 `gutter` 後，根據 gutter 設定左右 padding。這部分可以從 `row.vue` 與 `col.vue` 理解。

第二層是 style 系統。`Col` 產生的 `ivu-col-span-12`、`ivu-col-span-md-8` 等 class，真正的欄寬、位移、順序效果，需要回到 Less mixin 與 layout 樣式檔確認。這也是為什麼讀 `Row` / `Col` 不能只看 component source。

對初學者來說，這組元件最適合作為本章第一組閱讀對象，因為它同時示範了：

- 父子上下文。
- props 轉 class。
- runtime 與 Less source 的配合。
- responsive layout 的產生方式。

---

### 4.3 Layout Shell：`Layout` / `Header` / `Sider` / `Content` / `Footer`

Layout shell 是頁面骨架。它的任務不是承載某一小塊內容，而是建立整個頁面的結構，例如上方 header、左側 sider、中間 content、下方 footer。

| 元件 | 主要責任 | 複雜度判斷 |
| --- | --- | --- |
| `Layout` | 輸出 `ivu-layout`，mounted 後檢查 default slot 是否含 `Sider`，決定 `ivu-layout-has-sider` | 中等，重點在 slot child 判斷 |
| `Header` | 輸出 header 區域結構與 class | 較低，多半是薄 wrapper |
| `Sider` | 管理側邊欄寬度、收合、breakpoint、trigger、`modelValue` 更新與 `on-collapse` | 較高，是互動與狀態集中點 |
| `Content` | 輸出內容區域結構與 class | 較低，多半是薄 wrapper |
| `Footer` | 輸出 footer 區域結構與 class | 較低，多半是薄 wrapper |

這組元件的閱讀重點並不平均。`Header`、`Content`、`Footer` 通常是薄 wrapper，主要負責輸出語意化區域與對應 class；`Sider` 才是狀態與互動最集中的元件。

`Sider` 的責任邊界可以整理成：

```txt
props: width / collapsedWidth / collapsible / breakpoint / hideTrigger / reverseArrow
  -> computed siderWidth
  -> inline width / minWidth / maxWidth / flex
  -> trigger 顯示策略
  -> update:modelValue
  -> on-collapse
```

這代表 `Sider` 不只是「側邊欄容器」。它會根據 props 計算實際寬度，控制收合狀態，處理響應式 breakpoint，並透過事件把狀態變化回傳給使用者。

特別要注意的是：`Layout` 與 `Sider` 之間不是透過 provide/inject 建立關係。`Layout` 是透過 default slot child 的 component name 判斷是否存在 `Sider`，進而決定是否加上 `ivu-layout-has-sider`。這類關係和 `Row` / `Col`、`Collapse` / `Panel` 的父子注入不同，閱讀時不能混在一起。

---

### 4.4 Content Containers：`Card` / `Grid` / `GridItem`

Content containers 的共同點是「承載內容」，但它們的責任差異很大。

| 元件 | 主要責任 | 關係類型 |
| --- | --- | --- |
| `Card` | 卡片外框、title、extra、icon、padding、border、shadow、loading 等卡片語意 | 獨立內容容器 |
| `Grid` | 宮格父容器，提供 `GridInstance`，控制 col、square、padding、center、border、hover，並監聽 resize | 父層容器 |
| `GridItem` | 宮格子項，注入 `GridInstance`，根據父層設定計算 width、padding、height | 子層項目 |

`Card` 是比較直觀的內容容器。它主要負責建立卡片語意與視覺結構，例如 header、body、extra、shadow、border、padding 等。閱讀 `Card` 時，可以從 props、slots、class 結構與 Less 樣式切入。

`Grid` / `GridItem` 則是父子協作型容器。`Grid` 負責提供宮格設定，例如欄數、是否 square、padding、center、border、hover 等；`GridItem` 注入父層提供的狀態後，計算自己的寬度、padding 與高度。

這組元件的關鍵在於：`Grid` 不是單純排版 class 容器，它還會使用 `element-resize-detector` 與 `lodash.throttle`，透過 resize count 觸發子項重新計算。也就是說，閱讀 `GridItem` 時不能只看自己的 props，還要看父層 `Grid` 何時通知子項重新計算。

這種設計提醒我們：content container 不一定都很簡單。只要它涉及尺寸計算、父子注入或 resize 監聽，就必須把 runtime source 與 DOM 行為一起看。

---

### 4.5 Collapsible Containers：`Collapse` / `Panel`

`Collapse` / `Panel` 是本章中最典型的父子狀態容器。它的核心不是版面尺寸，而是「哪一個 panel 處於展開狀態」。

| 元件 | 主要責任 | 閱讀重點 |
| --- | --- | --- |
| `Collapse` | 保存 active key 狀態，提供 `CollapseInstance`，處理 accordion、`update:modelValue`、`on-change` | 看父層如何管理狀態與事件 |
| `Panel` | 注入父層，註冊 panel index，判斷自身 active，處理 header click 與內容顯示 | 看子層如何根據父層狀態決定展開 |

這組元件的主資料流可以整理成：

```txt
Collapse.modelValue
  -> currentValue
  -> getActiveKey()
  -> Panel 判斷 isActive
  -> Panel click 呼叫 Collapse.toggle()
  -> update:modelValue / on-change
```

這條資料流很適合用來練習閱讀 Vue 元件的父子狀態設計。

首先，使用者從外部傳入 `modelValue`。接著 `Collapse` 內部將它轉成自己的 `currentValue`，並透過 `getActiveKey()` 等邏輯供 `Panel` 判斷是否 active。當使用者點擊某個 `Panel` header 時，`Panel` 不直接修改外部資料，而是呼叫父層的 `toggle()`，最後由 `Collapse` emit `update:modelValue` 與 `on-change`。

需要特別注意的是：`modelValue` 可以是 array 或 string，但 `Collapse` 內部會把 active key 正規化成 string array。這個正規化動作是父子狀態對齊的核心，因為它讓後續判斷 `Panel` 是否 active 時可以使用一致的資料結構。

---

### 4.6 Spacing and Split：`Space` / `Split`

`Space` 與 `Split` 都與布局有關，但它們的複雜度差異非常大。

| 元件 | 主要責任 | 複雜度來源 |
| --- | --- | --- |
| `Space` | 對子內容加間距，處理方向、對齊、尺寸、wrap、split separator | slot children 包裹與 class / style 控制 |
| `Split` | 建立左右或上下 pane，處理拖曳、min/max、px/percent value、move events | document mousemove / mouseup、window resize、拖曳狀態 |

`Space` 的閱讀重點是：slot children 如何被包裹，以及每個 child 之間如何產生間距。它通常不需要複雜 DOM 事件，也不需要像 `Split` 一樣追蹤拖曳狀態。

`Split` 則是高互動布局元件。它不只是把畫面分成左右或上下兩塊，而是允許使用者拖曳分隔線，並動態改變兩個 pane 的尺寸。因此要追蹤：

```txt
使用者按下 trigger
  -> 開始拖曳
  -> 監聽 document mousemove
  -> 計算新的 modelValue
  -> emit update:modelValue / on-moving
  -> mouseup 後 emit on-move-end
```

`Split` 會 emit：

```txt
update:modelValue
on-move-start
on-moving
on-move-end
```

因此閱讀順序上，應該先看 `Space`，理解簡單間距容器如何包裹 slot children；再看 `Split`，理解拖曳事件、尺寸計算、px / percent value 與 move events 如何協作。這樣比較不會一開始就被拖曳細節分散注意力。

---

### 4.7 Positioning Containers：`Affix`

`Affix` 是固定定位容器。它的核心問題是：當使用者 scroll 或 resize 時，某個元素是否應該從一般文檔流中脫離，切換成 fixed 定位。

它的主流程可以整理成：

```txt
window scroll / resize
  -> handleScroll()
  -> 計算元素 offset、scrollTop、windowHeight
  -> 判斷 top 或 bottom 模式
  -> 設定 affix class 與 inline style
  -> 顯示 placeholder slot
  -> emit on-change
```

`Affix` 的 class 可能不多，但 DOM 計算很多。這是閱讀它時最容易誤判的地方。

對 `Affix` 來說，真正重要的是：

1. 元素原本在頁面中的位置。
2. 目前 scrollTop 是多少。
3. windowHeight 或容器高度是多少。
4. 使用 top 模式還是 bottom 模式。
5. 切換成 fixed 後，原本位置是否需要 placeholder 保持佔位。
6. 狀態改變時是否 emit `on-change`。

因此，閱讀 `Affix` 時建議順序是：

```txt
props / events
  -> handleScroll()
  -> getScroll()
  -> getOffset()
  -> fixed 狀態與 inline style
  -> placeholder
  -> affix.less
```

這樣會比一開始只看 template 或 class 更容易抓住它的重點。

---

### 4.8 Page Footer Containers：`FooterToolbar` / `GlobalFooter`

`FooterToolbar` / `GlobalFooter` 是偏業務頁面容器的一組元件。

| 元件 | 主要責任 | 使用場景 |
| --- | --- | --- |
| `FooterToolbar` | 固定在頁面底部的操作區，通常承載表單提交、取消、批量操作等命令 | 後台管理頁、表單頁、批量操作頁 |
| `GlobalFooter` | 全局頁尾，承載 links、copyright 等網站級資訊 | 入口頁、管理系統外框、網站底部 |

這一組元件不像 `Row` / `Col` 那樣建立通用布局算法，也不像 `Split` / `Affix` 那樣依賴大量 DOM 計算。它們更接近「框架提供的頁面組裝容器」。

它們的閱讀重點可以整理成：

```txt
props / slots
  -> class 結構
  -> fixed 或 footer style
  -> example 中的業務使用方式
```

這裡要特別區分兩件事：

1. **框架提供的容器能力**：例如是否固定在底部、如何分左右區塊、如何套用 class。
2. **example 中的業務組裝習慣**：例如按鈕怎麼放、links 怎麼排、copyright 怎麼寫。

筆記中不能把 example 的業務內容誤認為元件本身的硬性限制。example 是官方主推使用方式的參考，但真正的 public contract 仍要回到 runtime props、slots、events 與 type declaration 確認。

---

### 4.9 Public Component 與 Internal Helper 的區分

本章最後需要特別建立一個分類：哪些元件是 public component，哪些只是 internal helper。

| 類型 | 例子 | 閱讀方式 | 筆記處理方式 |
| --- | --- | --- | --- |
| public component runtime 在同名目錄 | `Row`、`Card`、`Affix` | entry 與 runtime 路徑相對直觀 | 可以建立獨立元件筆記 |
| public component runtime 在父組目錄 | `Header`、`Sider`、`Panel`、`GridItem` | 要從 entry file 追到實際 `.vue` | 需要在筆記中標註 public export 與 runtime source 的差異 |
| internal helper | `Split` 的 `trigger.vue` | 只作為主元件實作的一部分 | 不應建立成獨立 public contract 筆記，應放在 `Split` 實作中說明 |

這個區分會影響後續筆記命名。

例如 `Panel` 是 public component，雖然 runtime source 放在 `collapse` 目錄下，但使用者仍可能以 `Panel` 的形式使用它，因此需要對照 type declaration、examples 與 runtime source。相反地，`Split` 的 `trigger.vue` 只是內部輔助元件，它不應被當成獨立 public component 處理。

---

## 5. 表格整理

### 5.1 元件分組與責任邊界總表

| 分組 | 元件 | 主要責任 | 關係類型 | 初次閱讀重點 |
| --- | --- | --- | --- | --- |
| Grid System | `Row` / `Col` | 24 欄、gutter、flex、responsive props | 父層提供上下文，子層注入使用 | 先看 `Row` 如何提供 gutter，再看 `Col` 如何產生 class / style |
| Layout Shell | `Layout` / `Header` / `Sider` / `Content` / `Footer` | 頁面骨架、側邊欄收合、breakpoint | slot child 判斷 + 部分互動狀態 | 先區分薄 wrapper 與互動核心 `Sider` |
| Content Containers | `Card` / `Grid` / `GridItem` | 卡片、宮格、內容承載 | `Card` 獨立；`Grid` / `GridItem` 父子協作 | 注意 `Grid` resize 如何影響 `GridItem` |
| Collapsible Containers | `Collapse` / `Panel` | active key、accordion、收合展開 | 父子狀態容器 | 追蹤 `modelValue` 到 `Panel.isActive` 的資料流 |
| Spacing and Split | `Space` / `Split` | 間距與分割 | `Space` 偏靜態；`Split` 偏互動 | 先看 slot 包裹，再看拖曳事件 |
| Positioning Containers | `Affix` | fixed 定位、placeholder、scroll / resize | DOM 計算型容器 | 先看 scroll 計算，再對照 class |
| Page Footer Containers | `FooterToolbar` / `GlobalFooter` | 頁尾操作區與全局頁尾 | 業務頁面容器 | 區分元件能力與 example 組裝習慣 |

這張表的用途是幫助你在閱讀每一組元件前，先判斷它屬於哪一種複雜度。不要用同一種方式閱讀所有容器元件，否則會浪費時間在薄 wrapper 上，卻忽略真正需要追蹤狀態與 DOM 的元件。

### 5.2 邊界判斷表

| 邊界問題 | 代表元件 | 判斷方式 | 閱讀提醒 |
| --- | --- | --- | --- |
| 誰是 public component？ | `Row`、`Panel`、`GridItem` | 檢查 entry、registry、type declaration | public component 應該有完整 contract 對照 |
| 誰是 internal helper？ | `Split` 的 `trigger.vue` | 檢查是否只被主元件內部引用 | 不要把 helper 當成對外元件 |
| 誰負責父子狀態？ | `Collapse` / `Panel` | 看 provide/inject、父層 method、子層 click | 要追蹤事件如何回到父層 |
| 誰只負責樣式 class？ | `Header`、`Content`、`Footer` | 看是否主要輸出 slot 與 class | 不必過度展開成複雜狀態分析 |
| 誰依賴 DOM 尺寸或 scroll？ | `Grid`、`Split`、`Affix` | 看 resize、scroll、mousemove、offset 計算 | 需要搭配生命週期與事件監聽閱讀 |
| 誰必須對照 Less？ | `Row` / `Col`、`Layout`、`Collapse` | 看 runtime 是否只產生 class | Less 才能回答實際視覺效果 |

---

## 6. 範例或情境說明

### 6.1 情境一：閱讀 `Col` 時為什麼不能只看 `col.vue`

假設你看到 `Col` 根據 props 產生了以下 class：

```txt
ivu-col-span-12
ivu-col-span-md-8
```

如果你只看 `col.vue`，你大概只能知道「這些 class 被組出來了」。但是你不會知道：

- `span-12` 實際寬度是多少。
- `md-8` 對應哪個 responsive breakpoint。
- `push`、`pull`、`offset`、`order` 如何影響布局。
- 這些 class 是否由 Less mixin 自動生成。

因此，`Col` 的完整閱讀路徑應該是：

```txt
col.vue
  -> row.vue
  -> RowInstance / gutter
  -> src/styles/mixins/layout.less
  -> src/styles/common/layout.less
  -> examples/routers/grid.vue
```

這就是本篇筆記所謂的「責任邊界」：runtime source 只負責一部分，style source 也負責一部分。

### 6.2 情境二：閱讀 `Collapse` 時要從父層開始

如果你直接打開 `panel.vue`，你可能會看到 panel 判斷自己是否 active，並在點擊時呼叫某個父層方法。但如果沒有先看 `collapse.vue`，你會不知道：

- active key 是誰保存的。
- accordion 模式如何影響 active key。
- `modelValue` 是 array 還是 string。
- `update:modelValue` 與 `on-change` 何時 emit。
- `Panel` 的 name 或 index 如何被父層識別。

因此，`Collapse` / `Panel` 的閱讀路徑應該是：

```txt
collapse.vue
  -> provide CollapseInstance
  -> currentValue / getActiveKey()
  -> panel.vue inject
  -> Panel click
  -> Collapse.toggle()
  -> update:modelValue / on-change
```

這類父子狀態容器不能從子元件孤立閱讀。

### 6.3 情境三：閱讀 `Split` 時要把滑鼠事件當成主線

`Split` 是高互動布局元件，閱讀時不應只看 `modelValue` 的型別。更重要的是使用者拖曳時發生什麼：

```txt
mousedown
  -> on-move-start
  -> document mousemove
  -> 計算新位置
  -> update:modelValue
  -> on-moving
  -> document mouseup
  -> on-move-end
```

這條線索會幫你理解：為什麼 `Split` 需要 internal trigger，為什麼要監聽 document 事件，以及為什麼它的複雜度高於 `Space`。

---

## 7. 閱讀路線或學習路線

### 7.1 初次閱讀路線

第一次讀本章時，建議依照「從靜態布局到互動布局」的順序：

1. **先讀 `Row` / `Col`**  
   目的：理解本章最基礎的欄格系統，練習把 props、class 與 Less source 串起來。

2. **再讀 `Layout` / `Sider`**  
   目的：理解頁面骨架與側邊欄收合。特別注意 `Layout` 如何判斷 slot children 中是否存在 `Sider`。

3. **接著讀 `Card` / `Grid` / `GridItem`**  
   目的：比較獨立內容容器與父子宮格容器的差異。`Card` 可先快速讀，`Grid` / `GridItem` 則要注意 resize 與父子注入。

4. **再讀 `Collapse` / `Panel`**  
   目的：練習父子狀態容器的資料流，追蹤 `modelValue`、active key、`toggle()` 與事件回傳。

5. **接著讀 `Space` / `Split`**  
   目的：先理解簡單間距容器，再進入拖曳分割容器。`Split` 要把滑鼠事件與尺寸計算當成主線。

6. **再讀 `Affix`**  
   目的：理解 scroll / resize 與 fixed 定位的 DOM 計算，建立閱讀定位型元件的能力。

7. **最後讀 `FooterToolbar` / `GlobalFooter`**  
   目的：理解偏業務頁面容器如何提供結構能力，並區分元件能力與 example 組裝方式。

### 7.2 深入閱讀路線

如果要從「看懂」進一步到「能模仿設計」，建議依照以下主題重新閱讀：

1. **父子上下文設計**  
   對照 `Row` / `Col`、`Grid` / `GridItem`、`Collapse` / `Panel`，整理 provide/inject 或父子協作模式。

2. **props 到 class / inline style 的轉換**  
   對照 `Col`、`Sider`、`GridItem`、`Space`、`Affix`，整理哪些 props 會影響 class，哪些會影響 inline style。

3. **DOM 事件與尺寸計算**  
   對照 `Grid`、`Split`、`Affix`，整理 resize、scroll、mousemove、offset 這類 DOM 依賴如何被封裝。

4. **runtime 與 Less 的分工**  
   對照 `Row` / `Col`、`Layout`、`Collapse`、`Split`、`Affix`，整理 runtime 產生 class 後，Less 如何承接視覺效果。

5. **public contract 對照**  
   對照 `.vue` source、`types/*.d.ts`、examples，確認 public props、emits、slots 是否一致。

### 7.3 可以暫時跳過的部分

初次閱讀時，可以先暫時跳過以下內容：

- 每個 Less class 的完整視覺細節。
- 所有 edge case 的 DOM 計算。
- example 中與元件本身無關的業務內容。
- internal helper 的完整實作細節，例如 `Split` 的 `trigger.vue` 可以等讀 `Split` 主流程時再看。

---

## 8. 常見誤區

| 誤區 | 為什麼容易誤解 | 正確理解 |
| --- | --- | --- |
| 把 layout/container 元件都當成 `div` wrapper | 很多元件 template 看起來確實只是外層包裝 | 有些元件有父子上下文、DOM 計算、事件回傳與 Less 生成規則 |
| 只看 `.vue`，不看 Less | runtime source 比較容易打開閱讀 | `Row` / `Col` 等元件的實際布局效果大量依賴 Less class |
| 把 `Header`、`Content`、`Footer` 和 `Sider` 視為同等複雜 | 它們都屬於 Layout shell | `Sider` 才是狀態與互動核心，其他多半是薄 wrapper |
| 只看 `Panel`，不看 `Collapse` | 子元件看起來有自己的 active 判斷 | active key 由父層管理，`Panel` 需要注入父層狀態 |
| 把 `Space` 和 `Split` 都當成簡單布局元件 | 名稱都和空間布局有關 | `Space` 偏靜態間距，`Split` 是高互動拖曳容器 |
| 把 `Affix` 當成純 CSS fixed | fixed 看起來像樣式問題 | `Affix` 需要 scroll / resize 計算與 placeholder 維持佔位 |
| 把 internal helper 當成 public component | helper 也是 `.vue` 檔 | 是否 public 要看 entry、registry、type declaration，而不是只看檔案存在 |
| 把 example 寫法當成元件限制 | 官方 example 通常展示主要用法 | example 是使用方式參考，真正限制要回到 runtime 與 type declaration |

---

## 9. 本章總結

本篇筆記的核心目標，是在正式進入單一元件原始碼之前，先建立 `08-layout-and-containers/` 這一章的元件分類與責任邊界。

Layout and Containers 元件的共同主題是「內容如何被安置在頁面中」。但是不同元件處理的問題不同：`Row` / `Col` 解決欄格與 responsive layout；`Layout` / `Sider` 解決頁面骨架與側邊欄收合；`Card`、`Grid`、`GridItem` 解決內容承載；`Collapse` / `Panel` 解決收合狀態；`Space` / `Split` 解決間距與分割；`Affix` 解決 fixed 定位；`FooterToolbar` / `GlobalFooter` 則解決業務頁尾容器。

閱讀這些元件時，最重要的不是背下每個 props，而是先判斷它的責任邊界：

- 它是不是 public component？
- 它有沒有 internal helper？
- 它是獨立元件，還是父子協作元件？
- 它主要輸出 class，還是會計算 inline style？
- 它是否需要監聽 resize、scroll、mousemove？
- 它的視覺行為是否必須對照 Less？
- 它的 public contract 是否需要對照 type declaration 與 examples？

只要建立這套心智模型，後續閱讀單一元件時就不會迷失在細節中。你會知道哪些元件可以快速掃過，哪些元件需要追蹤資料流，哪些元件需要搭配 Less，哪些元件要特別注意 DOM 計算與事件生命週期。

---

## 10. 自我檢查問題

1. 為什麼不能把 layout/container 元件都理解成「一層 `div` 加 class」？
2. `Row` / `Col` 的責任邊界如何分工？為什麼 `Col` 的完整效果必須對照 Less？
3. `Layout` 與 `Sider` 之間為什麼不是典型 provide/inject 關係？
4. 在 Layout shell 中，為什麼 `Sider` 的閱讀優先級高於 `Header`、`Content`、`Footer`？
5. `Card` 與 `Grid` / `GridItem` 都是 content containers，但它們的責任差異是什麼？
6. `Collapse` / `Panel` 的 active key 資料流大致如何流動？
7. 為什麼 `Collapse` 內部要把 active key 正規化成 string array？
8. `Space` 與 `Split` 都和布局有關，但為什麼 `Split` 的複雜度更高？
9. 閱讀 `Affix` 時，為什麼不能只看 class 或 CSS fixed？
10. public component 與 internal helper 的區分會如何影響後續筆記命名？

---

## 11. 後續延伸方向

這篇筆記是 `08-layout-and-containers/00-overview/` 的總覽型筆記，後續可以拆成以下主題繼續深入：

1. **`Row` / `Col` 欄格系統原始碼分析**  
   深入追蹤 gutter、responsive props、class 產生與 Less mixin。

2. **`Layout` / `Sider` 頁面骨架與收合機制分析**  
   聚焦 slot child 判斷、`ivu-layout-has-sider`、`Sider` width 計算、breakpoint 與 trigger。

3. **`Card` 內容容器結構分析**  
   分析 title、extra、icon、padding、border、shadow、loading 等卡片語意。

4. **`Grid` / `GridItem` 宮格容器與 resize 協作分析**  
   分析 `GridInstance`、resize detector、throttle 與子項尺寸計算。

5. **`Collapse` / `Panel` 父子狀態容器分析**  
   深入追蹤 `modelValue`、active key、accordion、`toggle()`、`update:modelValue` 與 `on-change`。

6. **`Space` 間距容器與 slot children 包裹策略分析**  
   聚焦 direction、align、size、wrap、split separator。

7. **`Split` 拖曳分割容器分析**  
   分析 trigger、mousemove / mouseup、px / percent value、min / max、move events。

8. **`Affix` 固定定位與 scroll 計算分析**  
   聚焦 `getScroll()`、`getOffset()`、`handleScroll()`、placeholder 與 fixed style。

9. **`FooterToolbar` / `GlobalFooter` 業務頁尾容器分析**  
   區分框架容器能力、example 組裝方式與實務頁面使用情境。

10. **Layout and Containers style system 專題**  
    統整本章 runtime class 如何被 Less 承接，特別是 grid、layout、collapse、split、affix 等樣式來源。

11. **Layout and Containers type contracts 專題**  
    對照 `.vue` runtime props / emits / slots 與 `types/*.d.ts`，檢查 public contract 是否一致。
