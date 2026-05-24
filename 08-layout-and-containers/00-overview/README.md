# Layout and Containers Overview：章節總覽入口

## 0. 原始筆記問題分析

這份原始筆記屬於 `08-layout-and-containers/00-overview/` 的「目錄入口型筆記」。它的主要功能不是深入分析某一個 View UI Plus 元件，而是讓讀者在進入 `Row`、`Col`、`Layout`、`Card`、`Collapse`、`Space`、`Split`、`Affix` 等單一元件筆記之前，先知道本目錄要解決什麼問題、有哪些總覽筆記、後續應該從哪裡開始讀，以及在什麼情境下回查哪一篇筆記。

原始筆記已經具備良好的 README 基礎：它明確說明 `00-overview/` 是 `08-layout-and-containers/` 的前置閱讀區，列出五篇總覽筆記的閱讀順序，也提供了本章元件範圍與後續子目錄對照表。這些資訊對快速定位很有幫助。

不過，如果要把這份 README 放進長期學習用的知識庫，仍有幾個可以補強的地方。

第一，原始版本比較像「目錄清單」，但對初學者來說，還需要更明確說明：為什麼進入單一元件原始碼之前，必須先閱讀 `00-overview/`。如果沒有先建立章節範圍、來源材料、責任邊界與閱讀方法，後面讀 source 時很容易只看到零散的 props、class、Less 檔案與 example，而無法形成完整的元件閱讀模型。

第二，原始筆記列出了五篇 overview 筆記，但每篇之間的關係還可以再教學化。例如 `01-chapter-scope-and-reading-map.md` 負責回答「這章讀什麼」，`02-source-material-index.md` 負責回答「source 在哪裡」，`03-component-groups-and-boundaries.md` 負責回答「元件如何分組與切責任」，`04-reading-method-runtime-style-type.md` 負責回答「要怎麼交叉驗證」，`05-reading-routes-and-checklists.md` 負責回答「不同情境下怎麼讀、怎麼查、怎麼檢查」。這些筆記不是平行清單，而是一條從建立地圖到實際閱讀的流程。

第三，原始筆記已經列出本章元件範圍，但還可以補充每組元件在整章中的學習定位。`Row` / `Col` 是最基礎的欄格系統，`Layout` / `Sider` 是頁面骨架，`Card` / `Grid` / `GridItem` 是內容承載容器，`Collapse` / `Panel` 是父子狀態容器，`Space` / `Split` 是間距與分割布局，`Affix` 是固定定位容器，`FooterToolbar` / `GlobalFooter` 則偏向頁面底部業務容器。這樣讀者才知道後續目錄不是隨意排序，而是由低互動到高互動、由基礎布局到業務容器的閱讀安排。

第四，原始筆記已提到 View UI Plus `v1.3.20` 作為 Source Baseline，但可以再補充它在閱讀中的作用。這個 baseline 代表後續所有 runtime、style、type declaration、example、registry 與 test 的結論都應回到同一版本確認，避免把不同版本的實作細節混在一起。

因此，這次重構會保留原始 README 的入口功能，但把它補強成一篇可以作為整個 `00-overview/` 目錄首頁的教材型筆記。

---

## 1. 本章定位

`08-layout-and-containers/00-overview/` 是 `08-layout-and-containers/` 的前置閱讀區。它的任務是幫讀者在進入單一元件細節之前，先建立本章的閱讀地圖、來源材料索引、元件責任邊界、固定閱讀方法與檢查清單。

這個目錄解決的問題可以整理成三層。

第一層是「範圍問題」：本章到底包含哪些元件？哪些元件屬於 layout/container 類型？哪些主題不應該放進這章？例如表單校驗、路由導航、資料表格、彈層服務等雖然也可能和頁面結構有關，但不是本章的主要分析對象。

第二層是「閱讀問題」：要讀 View UI Plus 的 layout/container 元件時，應該從哪裡開始？是先看 `.vue` runtime source，還是先看 types？是先看 examples，還是先看 Less？本目錄會先定義固定閱讀流程，避免每一組元件都用不同方式分析，導致筆記結構不一致。

第三層是「查核問題」：當你寫完某一組元件筆記後，要如何確認自己沒有漏掉 public export、style source、type declaration、examples、registry、install 或 unit test？本目錄提供檢查清單，讓後續筆記能保持同一套分析標準。

本目錄不負責逐一展開 `Row`、`Col`、`Layout`、`Header`、`Sider`、`Content`、`Footer`、`Card`、`Grid`、`GridItem`、`Collapse`、`Panel`、`Space`、`Split`、`Affix`、`FooterToolbar`、`GlobalFooter` 的完整實作。這些元件的細節會放在後續各自的子目錄中處理。

讀完這篇 README 之後，讀者應該能理解：

1. `00-overview/` 在整個 `08-layout-and-containers/` 中扮演什麼角色。
2. 五篇總覽筆記各自解決什麼問題。
3. 後續閱讀單一元件前，應該先建立哪些共通觀念。
4. 遇到不同情境時，應該回查哪一篇 overview 筆記。
5. 本章所有結論為什麼要固定以 View UI Plus `v1.3.20` 作為基準。

---

## 2. 學習前先建立的基本觀念

### 2.1 `00-overview/` 不是單純目錄清單

README 很容易被誤解成只是「列出有哪些檔案」。但在原始碼閱讀筆記中，`README.md` 的角色更接近一本技術書章節的導讀頁。它不只是告訴你有哪些筆記，而是先替後續筆記建立閱讀順序與使用情境。

對 `08-layout-and-containers/` 來說，這件事尤其重要。因為 layout/container 元件不像表單元件那樣主要圍繞資料輸入，也不像彈層元件那樣主要圍繞浮層生命週期。它們的核心在於「內容如何被放進穩定結構中」。這會同時牽涉 runtime props、slot 結構、computed class、inline style、Less mixin、父子元件關係與 DOM 尺寸計算。

如果只用一般「看 source -> 記 props -> 記 event」的方式閱讀，很容易漏掉布局元件真正的關鍵：樣式系統與 runtime source 之間的分工。

### 2.2 本章以 Source Baseline 固定閱讀範圍

本章以 View UI Plus `v1.3.20` 作為固定閱讀基準：

```txt
01-origin/source/view-ui-plus-v1.3.20/
```

這個設定很重要，因為原始碼閱讀筆記最怕出現「版本混用」。例如某個 props 在新版中新增，但在 `v1.3.20` 中不存在；某個 Less class 在某版本中調整過，但你把新版樣式拿來解釋舊版 runtime；又或者 examples 已經變更，但筆記仍引用舊版行為。這些都會讓筆記結論失準。

因此，後續每一篇元件筆記都應該回到同一個 baseline 確認：

```txt
runtime source
  -> style source
  -> type declaration
  -> official examples
  -> registry / install
  -> tests
```

只有這樣，筆記才會成為可追溯的原始碼閱讀紀錄，而不是混合多個版本的經驗整理。

### 2.3 layout/container 元件的重點是「結構、尺寸、狀態與樣式」

本章元件雖然都可以被歸入「布局與容器」，但它們的責任並不相同。

`Row` / `Col` 解決的是欄格系統問題：如何透過 row wrapper、column class、gutter 與 responsive class 建立 24 欄布局。

`Layout` / `Header` / `Sider` / `Content` / `Footer` 解決的是頁面骨架問題：如何把頁面分成側邊欄、頂部、內容區與底部，並處理 `Sider` 收合與 breakpoint。

`Card`、`Grid`、`GridItem` 解決的是內容容器問題：如何用卡片或宮格結構承載內容，並控制 border、hover、padding、square、resize 等視覺與尺寸行為。

`Collapse` / `Panel` 解決的是收合容器問題：父層如何管理 active key，子層如何判斷自己是否展開，以及事件如何回傳。

`Space` / `Split` 解決的是間距與分割問題：前者偏向靜態間距包裹，後者偏向拖曳互動與尺寸計算。

`Affix` 解決的是固定定位問題：元件如何依據 scroll / resize 計算是否進入 fixed 狀態。

`FooterToolbar` / `GlobalFooter` 則解決頁面底部容器問題：如何組裝操作區與網站級 footer 資訊。

這些元件的共通點是：它們通常不是在處理複雜業務資料，而是在決定內容被放在哪裡、用什麼尺寸顯示、用什麼 class 承接樣式，以及使用者互動後布局狀態如何變化。

### 2.4 overview 筆記是後續元件筆記的「分析規格」

`00-overview/` 的五篇筆記不只是閱讀材料，也應被視為後續每篇元件筆記的分析規格。

寫 `Row` / `Col` 筆記時，要回來看 `02-source-material-index.md` 確認 runtime 與 Less 來源，也要回來看 `04-reading-method-runtime-style-type.md` 確認 props、class、inline style、type declaration 與 examples 是否都有對照。

寫 `Collapse` / `Panel` 筆記時，要回來看 `03-component-groups-and-boundaries.md` 確認這是父子狀態容器，不應把 `Panel` 當成完全獨立元件。

寫 `Split` 或 `Affix` 筆記時，要回來看 `05-reading-routes-and-checklists.md`，確認 DOM event、resize、scroll、placeholder、min / max 等互動細節是否都有被檢查。

也就是說，`00-overview/` 不是讀完就丟到旁邊的導讀，而是後續整章筆記的品質標準。

---

## 3. 整體概覽

`00-overview/` 可以被理解成五層閱讀入口。

```txt
01-chapter-scope-and-reading-map.md
  -> 先回答：這章讀什麼？為什麼這樣讀？

02-source-material-index.md
  -> 再回答：runtime、style、types、examples、registry、tests 在哪裡？

03-component-groups-and-boundaries.md
  -> 接著回答：元件如何分組？誰是 public component？誰是 internal helper？誰負責父子狀態？

04-reading-method-runtime-style-type.md
  -> 然後回答：如何固定用 runtime / style / type / example 交叉驗證？

05-reading-routes-and-checklists.md
  -> 最後回答：初讀、深讀、回查、除錯、仿作時要怎麼走？
```

這五篇筆記的關係不是平行的，而是有明確的學習順序。

第一篇先建立範圍與總地圖，避免讀者一開始就陷入單一元件細節。第二篇補上 source path，讓後續所有分析都能回到實際檔案驗證。第三篇整理元件責任邊界，讓讀者知道哪些元件是父子結構，哪些只是薄 wrapper，哪些有 DOM 依賴，哪些需要對照 Less。第四篇把閱讀方法固定下來，讓每篇元件筆記都能用一致的拆解方式。第五篇則把這些方法轉成實際可操作的路線與檢查清單。

如果用一句話概括，`00-overview/` 的任務就是：

```txt
先建立地圖，再建立 source 索引，再建立責任邊界，最後建立可重複使用的閱讀方法。
```

---

## 4. 核心內容逐步講解

### 4.1 `README.md`：總覽入口

這篇 `README.md` 是 `00-overview/` 的入口頁。它負責告訴讀者：這個目錄存在的原因、應該先讀哪些筆記、每篇筆記用在什麼情境，以及本章後續子目錄會如何展開。

它不應該取代其他五篇 overview 筆記，而應該替它們建立導覽關係。讀者第一次進入 `08-layout-and-containers/` 時，應該先從這篇 README 確認整體結構，再依序閱讀 `01` 到 `05`。

這篇 README 的閱讀重點不是記住所有元件名稱，而是理解：

```txt
00-overview/
  -> 是整章的前置閱讀區
  -> 不是單一元件分析區
  -> 負責建立後續閱讀規則
  -> 會被後續每一組元件筆記反覆回查
```

### 4.2 `01-chapter-scope-and-reading-map.md`：章節範圍與總閱讀地圖

`01-chapter-scope-and-reading-map.md` 負責建立整章的範圍。它回答的是「`08-layout-and-containers/` 到底要讀哪些元件，以及它們為什麼被放在同一章」。

這篇筆記的重點是避免章節邊界模糊。View UI Plus 中很多元件都會出現在頁面上，但不是所有元件都應歸入 layout/container。像 `Table`、`List` 主要關注資料展示；`Modal`、`Drawer`、`Tooltip` 主要關注彈層生命週期；`Form`、`Input` 則關注輸入與校驗。這些主題都不應在本章展開。

因此，`01` 的核心功能是建立分類原則：只要元件主要負責頁面骨架、區塊排列、內容容器、收合展開、間距分割、固定定位或頁尾容器，就可以納入本章。

### 4.3 `02-source-material-index.md`：來源材料索引

`02-source-material-index.md` 負責把 source path 整理出來。對原始碼閱讀來說，這篇筆記非常關鍵，因為它讓後續每一個結論都有可回查的來源。

閱讀 View UI Plus 的 layout/container 元件時，不能只看 `.vue` 檔。舉例來說，`Col` 的 `ivu-col-span-12` class 可能是在 runtime 中組出來，但 class 對應的寬度規則可能來自 Less mixin。`types/*.d.ts` 可以告訴 TypeScript 使用者看到的 public contract，但不能直接代表 runtime 實作。examples 可以展示官方主推用法，但不能保證覆蓋所有 source branch。

因此，這篇 source index 應該被用來建立一個交叉驗證習慣：

```txt
runtime source 判斷實際行為
style source 判斷 class 效果
type declaration 判斷 public contract
examples 判斷官方主推場景
registry / install 判斷是否 public export
tests 判斷是否有行為保護
```

### 4.4 `03-component-groups-and-boundaries.md`：元件分組與責任邊界

`03-component-groups-and-boundaries.md` 負責回答「這些元件彼此之間的關係是什麼」。

layout/container 元件最容易被誤讀成「只是包一層 div 加 class」。但本章很多元件其實有明確責任邊界。例如 `Row` 提供 context，`Col` 注入 `RowInstance`；`Collapse` 保存 active state，`Panel` 依父層狀態判斷是否展開；`Grid` 監聽 resize 並提供父層設定，`GridItem` 依父層設定計算尺寸。

如果沒有先看責任邊界，後續讀單一元件時會很容易犯兩種錯誤：

1. 把子元件當成完全獨立元件分析。
2. 把 internal helper 當成 public component 分析。

因此，這篇筆記可以當作進入每組元件前的「責任地圖」。每次開始寫單一元件筆記前，都應該先確認該元件屬於哪一種角色：

| 類型 | 典型例子 | 閱讀重點 |
| --- | --- | --- |
| 父子結構元件 | `Row` / `Col`、`Grid` / `GridItem`、`Collapse` / `Panel` | 先讀父層如何提供狀態，再讀子層如何消費狀態。 |
| 薄 wrapper 元件 | `Header`、`Content`、`Footer` | 重點通常在 class 結構與 style 承接。 |
| 互動狀態元件 | `Sider`、`Split`、`Affix` | 重點在事件、尺寸計算、DOM listener 與狀態變化。 |
| 業務容器元件 | `FooterToolbar`、`GlobalFooter` | 重點在 slots、props、固定樣式與 example 使用場景。 |
| internal helper | `Split` 的 `trigger.vue` | 應放在主元件實作中分析，不應獨立成 public contract。 |

### 4.5 `04-reading-method-runtime-style-type.md`：runtime / style / type 對照方法

`04-reading-method-runtime-style-type.md` 是本目錄的方法論核心。它定義後續每篇元件筆記應該如何拆解 source。

一般初學者讀 Vue 元件時，常會直接打開 `.vue` 從 template 開始看。但對 View UI Plus 這類元件庫來說，這樣很容易漏掉 public API、style 承接、type declaration 與 examples。更好的方式是先建立 public surface，再進入 runtime source，最後用 style、types、examples 與 tests 交叉驗證。

固定閱讀順序可以整理成：

```txt
public surface
  -> runtime source
  -> parent-child relationship
  -> computed class / inline style
  -> DOM event / resize / scroll dependency
  -> style source
  -> type declaration
  -> official example
  -> registry / install
  -> tests or behavior evidence
```

這個順序的好處是：你不會一開始就被 methods 細節吸走，也不會只看到 `.vue` 中的 class 名稱，卻不知道 Less 中真正產生了什麼 layout 規則。

### 4.6 `05-reading-routes-and-checklists.md`：閱讀路線與檢查清單

`05-reading-routes-and-checklists.md` 負責把前面的方法轉成實際操作。它回答的是：在不同情境下，接下來到底該看哪裡。

例如第一次讀完整章時，應該從 `00-overview/` 開始，接著進入 `01-grid-system/`，再讀 `02-layout-shell/`，再一路讀到 `10-labs/`。這是一條從低互動到高互動、從基礎布局到進階驗證的路線。

但如果你只是要查某個 props 是否存在，就不需要重讀整章，而是先看 `types/*.d.ts` 與對應 `.vue` 的 `props`。如果你要查某個 class 為什麼沒效果，就應該從 runtime class 追到 Less source。若要排查 `Affix` 固定後頁面跳動，就應該查 placeholder style 與 fixed style 的計算。

這篇筆記的價值在於，它把「讀完整章」與「快速回查」分開，讓你在不同任務中使用不同閱讀策略。

### 4.7 本章元件範圍與後續子目錄

`README.md` 中列出的元件範圍，是後續整章筆記的主幹。

| 分組 | 元件 | 後續筆記目錄 | 閱讀定位 |
| --- | --- | --- | --- |
| Grid system | `Row` / `Col` | `../01-grid-system/` | 建立本章最基礎的欄格、gutter、responsive class 與 Less mixin 觀念。 |
| Layout shell | `Layout` / `Header` / `Sider` / `Content` / `Footer` | `../02-layout-shell/` | 理解頁面骨架與 `Sider` 收合、breakpoint、trigger 行為。 |
| Content containers | `Card` / `Grid` / `GridItem` | `../03-content-containers/` | 分析卡片與宮格容器如何承載內容並控制尺寸與視覺狀態。 |
| Collapsible containers | `Collapse` / `Panel` | `../04-collapsible-containers/` | 追蹤父子 active state、accordion、panel name 與事件回傳。 |
| Spacing and split | `Space` / `Split` | `../05-spacing-and-split/` | 比較靜態間距容器與高互動拖曳分割容器。 |
| Positioning containers | `Affix` | `../06-positioning-containers/` | 閱讀 scroll / resize、fixed style 與 placeholder 的 DOM 計算。 |
| Page footer containers | `FooterToolbar` / `GlobalFooter` | `../07-page-footer-containers/` | 分析頁面底部操作區與全局 footer 的組裝方式。 |

這個順序背後有一個很清楚的學習邏輯：先讀最基礎的布局 class，再讀頁面骨架，再讀內容容器，然後進入父子狀態、拖曳互動、固定定位，最後讀偏業務組裝的頁尾容器。這樣安排可以降低閱讀負擔，避免一開始就被 `Split` 或 `Affix` 的 DOM 計算打斷基礎理解。

---

## 5. 表格整理

### 5.1 `00-overview/` 筆記索引

| 閱讀順序 | 筆記 | 核心問題 | 使用時機 | 閱讀後應能回答 |
| --- | --- | --- | --- | --- |
| 1 | `01-chapter-scope-and-reading-map.md` | 這章讀什麼？為什麼這樣分章？ | 第一次進入 `08-layout-and-containers/` 時先讀。 | 哪些元件屬於 layout/container，哪些主題不屬於本章。 |
| 2 | `02-source-material-index.md` | source 在哪裡？要對照哪些材料？ | 要查 runtime、style、types、examples、registry、tests 時使用。 | 某元件的 `.vue`、Less、`.d.ts`、example 與 registry 應去哪裡查。 |
| 3 | `03-component-groups-and-boundaries.md` | 元件怎麼分組？責任怎麼切？ | 需要判斷父子元件、public component、internal helper 時使用。 | 哪些元件是父子狀態容器，哪些是薄 wrapper，哪些依賴 DOM。 |
| 4 | `04-reading-method-runtime-style-type.md` | 如何固定拆解 runtime / style / type？ | 寫單一元件筆記前，用來固定分析順序。 | 如何從 public surface 追到 runtime、style、types、examples 與 tests。 |
| 5 | `05-reading-routes-and-checklists.md` | 不同情境下該怎麼讀、怎麼查？ | 初讀、深讀、除錯、仿作前用來檢查。 | 如何依任務選擇閱讀路線，以及如何判斷自己是否漏看。 |

這張表的閱讀方式不是只看檔名，而是看「每篇筆記解決哪一種問題」。後續寫單一元件筆記時，通常會同時回查多篇 overview 筆記。例如寫 `Grid` / `GridItem` 時，要先從 `02` 確認 source path，再從 `03` 確認父子責任，再用 `04` 的方法對照 runtime / style / type，最後用 `05` 的檢查清單確認沒有漏掉 resize detector 與 square 高度更新。

### 5.2 情境導向使用表

| 使用情境 | 優先閱讀 | 原因 |
| --- | --- | --- |
| 第一次進入本章 | `README.md` -> `01-chapter-scope-and-reading-map.md` | 先建立目錄定位與章節範圍，避免直接陷入 source 細節。 |
| 要查某元件 source path | `02-source-material-index.md` | 這篇負責整理 runtime、style、types、examples、registry 與 test 路徑。 |
| 不確定某元件是否應獨立成筆記 | `03-component-groups-and-boundaries.md` | 這篇能判斷 public component、父子結構與 internal helper 的邊界。 |
| 要寫單一元件原始碼分析 | `04-reading-method-runtime-style-type.md` | 這篇提供固定拆解順序，避免漏掉 style、type 或 examples。 |
| 要確認是否真的理解某組元件 | `05-reading-routes-and-checklists.md` | 這篇提供各組元件的理解檢查問題。 |
| 要準備仿作練習 | `05-reading-routes-and-checklists.md` -> `10-labs/` | 先確認核心資料流，再用 mini implementation 驗證。 |
| 要排查行為不符合預期 | `05-reading-routes-and-checklists.md` -> `02-source-material-index.md` | 先用症狀定位問題類型，再回 source path 查證。 |

### 5.3 本章元件與後續目錄對照

| 分組 | 元件 | 後續筆記目錄 | 核心學習問題 |
| --- | --- | --- | --- |
| Grid system | `Row` / `Col` | `../01-grid-system/` | 24 欄、gutter、responsive props、Less mixin 如何共同形成欄格系統。 |
| Layout shell | `Layout` / `Header` / `Sider` / `Content` / `Footer` | `../02-layout-shell/` | 頁面骨架如何識別 `Sider`，`Sider` 如何收合與響應 breakpoint。 |
| Content containers | `Card` / `Grid` / `GridItem` | `../03-content-containers/` | 內容容器如何處理 header、extra、border、hover、padding、square 與 resize。 |
| Collapsible containers | `Collapse` / `Panel` | `../04-collapsible-containers/` | 父層 active names、accordion、panel name 與內容 slot 如何協作。 |
| Spacing and split | `Space` / `Split` | `../05-spacing-and-split/` | 間距容器與拖曳分割容器如何分別控制布局。 |
| Positioning containers | `Affix` | `../06-positioning-containers/` | scroll / resize 監聽、fixed 樣式、placeholder 如何保持位置。 |
| Page footer containers | `FooterToolbar` / `GlobalFooter` | `../07-page-footer-containers/` | 業務頁底部操作區與全局頁尾如何組裝內容。 |

### 5.4 後續單一元件筆記的標準查核表

| 查核項目 | 要確認的內容 | 對應 overview 筆記 |
| --- | --- | --- |
| 章節定位 | 這個元件為什麼屬於 layout/container？ | `01-chapter-scope-and-reading-map.md` |
| Source path | runtime、style、types、examples、registry、tests 是否都找到？ | `02-source-material-index.md` |
| 元件邊界 | 它是 public component、子元件、父元件、薄 wrapper 還是 internal helper？ | `03-component-groups-and-boundaries.md` |
| Runtime 拆解 | props、slots、events、v-model、provide/inject、computed、watch、methods 是否分析完整？ | `04-reading-method-runtime-style-type.md` |
| Style 對照 | runtime 產生的 class 是否有 Less 規則承接？ | `04-reading-method-runtime-style-type.md` |
| Type 對照 | `.d.ts` 是否與 runtime props / emits 一致？ | `04-reading-method-runtime-style-type.md` |
| Example 對照 | 官方 examples 展示哪些主場景？哪些分支只有 source 支援？ | `04-reading-method-runtime-style-type.md` |
| 理解檢查 | 是否能回答該組元件的核心檢查問題？ | `05-reading-routes-and-checklists.md` |
| 仿作準備 | 是否能用 mini implementation 驗證核心資料流？ | `05-reading-routes-and-checklists.md`、`10-labs/` |

---

## 6. 範例或情境說明

### 6.1 情境一：第一次閱讀 `08-layout-and-containers/`

如果你是第一次進入這一章，不建議直接打開 `Row` 或 `Layout` 的 `.vue` 檔。更好的方式是先讀 `README.md`，確認 `00-overview/` 的角色；接著讀 `01-chapter-scope-and-reading-map.md`，建立整章範圍；再讀 `02-source-material-index.md`，知道 source path 在哪裡；然後讀 `03-component-groups-and-boundaries.md`，理解元件如何分組；最後讀 `04` 與 `05`，建立方法與檢查清單。

這條路線可以避免一開始就把本章誤解成「一堆容器元件的 props 清單」。你會先知道每組元件的責任，再進入具體 source。

### 6.2 情境二：要寫 `Row` / `Col` 的單一元件筆記

寫 `Row` / `Col` 時，可以先回來看 `02-source-material-index.md`，確認 runtime source 與 style source。接著看 `03-component-groups-and-boundaries.md`，確認 `Row` 是父層、`Col` 是子層，兩者透過 provide / inject 連接。再用 `04-reading-method-runtime-style-type.md` 的方法拆解：public surface、runtime props、computed class、inline style、Less mixin、type declaration 與 examples。

最後要用 `05-reading-routes-and-checklists.md` 檢查自己是否能回答：

```txt
Row.gutter 如何影響 Row margin 與 Col padding？
Col 如何透過 inject 取得 RowInstance？
span、offset、push、pull、order 如何變成 class？
24 欄樣式由哪些 Less mixin 產生？
```

如果這些問題答不出來，代表還不能進入 `10-labs/` 仿作。

### 6.3 情境三：要排查 `Affix` 固定定位異常

如果你遇到 `Affix` 固定後頁面跳動，不能只看 `affix.less`。這類問題通常和 scroll / resize 計算、fixed inline style 與 placeholder 尺寸有關。

閱讀路線應該是：

```txt
05-reading-routes-and-checklists.md
  -> 先確認 Affix 常見回查問題
02-source-material-index.md
  -> 找到 Affix runtime / style / test path
04-reading-method-runtime-style-type.md
  -> 按 runtime / style / type 順序拆解
Affix source
  -> 檢查 handleScroll、slotStyle、affixStyle、on-change
```

這個例子說明 README 的價值：它不是直接給你答案，而是告訴你遇到問題時應該用哪條路線回查。

### 6.4 情境四：要準備 `10-labs/` 仿作練習

進入 `10-labs/` 前，不需要完整複製 View UI Plus 的所有細節，但必須能重現每組元件的核心資料流。例如你應該能實作 mini `Row` / `Col` 的 gutter 與欄格 class 映射，能實作 mini `Collapse` 的 active key 與 accordion，能實作 mini `Split` 的拖曳事件與 min / max 限制，也能實作 mini `Affix` 的 scroll 判斷與 placeholder。

這時應該回查 `05-reading-routes-and-checklists.md`，用仿作前檢查清單確認自己的理解是否足夠。如果只是能背出 props，但不能說出 props 如何影響 class、inline style、父子狀態或 DOM 事件，就還不適合進入仿作。

---

## 7. 閱讀路線或學習路線

### 7.1 `00-overview/` 內部閱讀路線

第一次閱讀 `00-overview/` 時，建議按以下順序：

```txt
README.md
  -> 01-chapter-scope-and-reading-map.md
  -> 02-source-material-index.md
  -> 03-component-groups-and-boundaries.md
  -> 04-reading-method-runtime-style-type.md
  -> 05-reading-routes-and-checklists.md
```

這個順序的重點是從「知道這個目錄做什麼」開始，再逐步建立章節範圍、source 索引、責任邊界、閱讀方法與檢查清單。

### 7.2 `08-layout-and-containers/` 整章閱讀路線

讀完整個 `08-layout-and-containers/` 時，建議從低互動到高互動：

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

先讀 `Grid system` 是因為它能建立 layout class、gutter 與 responsive style generation 的基本觀念。接著讀 `Layout shell` 可以理解頁面骨架與 slot children 對父層 class 的影響。然後進入 `Content containers`、`Collapsible containers`、`Spacing and split` 與 `Positioning containers`，逐步增加父子狀態、拖曳互動與 DOM 計算。最後再用 `style-system`、`type-contracts` 與 `labs` 做橫向整理與實作驗證。

### 7.3 寫單一元件筆記時的路線

每次寫單一元件筆記前，可以固定使用：

```txt
README.md
  -> 確認該元件屬於哪個分組與後續目錄

02-source-material-index.md
  -> 確認 runtime、style、types、examples、registry、tests

03-component-groups-and-boundaries.md
  -> 確認 public / parent / child / helper / wrapper 邊界

04-reading-method-runtime-style-type.md
  -> 套用 public surface -> runtime -> style -> type -> example 的拆解順序

05-reading-routes-and-checklists.md
  -> 用該組元件的檢查清單驗證理解
```

這條路線可以讓不同元件筆記保持同一種分析深度，而不是有些筆記只寫 props，有些筆記只寫 source，有些筆記只整理 examples。

### 7.4 可以暫時跳過的部分

初次閱讀本章時，可以暫時不用深入以下內容：

| 可暫時跳過 | 原因 |
| --- | --- |
| 每個 Less 變數的完整來源 | 初讀先理解 runtime class 與 Less 承接關係即可。 |
| 所有 examples 的細節分支 | 初讀先看主場景，進階場景可在深讀時補。 |
| unit test 的完整測試技巧 | 初讀只需要知道是否有測試證據，測試寫法可放到後續測試章節。 |
| install plugin 的所有細節 | 本章先確認是否 public export，完整 install 機制可放到全局註冊章節。 |
| internal helper 的全部實作 | 例如 `Split` 的 `trigger.vue` 可先當作主元件實作的一部分閱讀。 |

---

## 8. 常見誤區

| 誤區 | 為什麼容易誤解 | 正確理解 |
| --- | --- | --- |
| 把 `README.md` 當成單純目錄清單 | README 常被用來列檔案，容易忽略它在學習路線中的導讀功能。 | 這篇 README 是 `00-overview/` 的入口，負責建立整個目錄的閱讀規則與使用情境。 |
| 直接從單一 `.vue` 開始讀 | Vue 元件的 runtime source 很直觀，初學者容易覺得打開 `.vue` 就能理解全部行為。 | layout/container 元件必須對照 runtime、Less、types、examples、registry 與 tests，不能只看 `.vue`。 |
| 把 `00-overview/` 當成只讀一次的前言 | 總覽筆記常被當成前言讀過就跳過。 | 後續寫每一組元件筆記時，都應該回查 overview 的 source index、邊界分析、閱讀方法與檢查清單。 |
| 把 examples 當成完整 API 定義 | examples 是最容易閱讀的材料，所以容易被當成元件能力的全部。 | examples 只能代表官方展示的主要場景，完整能力仍需回到 runtime 與 type declaration 驗證。 |
| 把 type declaration 當成 runtime 行為 | `.d.ts` 看起來正式且清楚，容易被誤認為實作來源。 | type declaration 是 TypeScript 使用者看到的 public contract，不等於 runtime 實際消費點。 |
| 忽略 Less mixin | class 名稱在 runtime 中看得到，但 CSS 規則可能不在同一個 component less 檔。 | `Row` / `Col` 的 24 欄與 responsive class 必須對照 `common/layout.less` 與 `mixins/layout.less`。 |
| 把 internal helper 寫成獨立 public component | 看到獨立 `.vue` 檔就容易以為它應該有完整 public contract。 | 例如 `Split` 的 `trigger.vue` 應視為主元件內部實作的一部分，不應獨立成 public API 筆記。 |
| 只記 props，不追資料流 | 元件庫筆記很容易變成 props 表格。 | 應追蹤 props 如何影響 class、inline style、slot branch、事件、父子狀態與 DOM 計算。 |

---

## 9. 本章總結

`08-layout-and-containers/00-overview/` 是整個 layout/container 章節的閱讀入口。它不是單純列出有哪些筆記，而是先替後續所有元件分析建立共同規則：本章讀哪些元件、source 以哪個版本為基準、runtime / style / type / examples 如何對照、public component 與 internal helper 如何區分，以及不同情境下應該用哪一條閱讀路線。

這個目錄中的五篇筆記各有分工。`01-chapter-scope-and-reading-map.md` 建立章節範圍，`02-source-material-index.md` 建立 source path，`03-component-groups-and-boundaries.md` 建立元件責任邊界，`04-reading-method-runtime-style-type.md` 建立固定拆解方法，`05-reading-routes-and-checklists.md` 則把方法轉成可操作的閱讀路線與檢查清單。

後續閱讀 `Row` / `Col`、`Layout` / `Sider`、`Card` / `Grid` / `GridItem`、`Collapse` / `Panel`、`Space` / `Split`、`Affix`、`FooterToolbar` / `GlobalFooter` 時，都應該回到這個 overview 目錄確認分析方向。這樣寫出的筆記才不會只是零散的 props 表或 source 摘要，而會形成一套可長期維護、可回查、可複習、可延伸到仿作練習的教材型筆記。

---

## 10. 自我檢查問題

1. `08-layout-and-containers/00-overview/` 和後續 `01-grid-system/`、`02-layout-shell/` 等子目錄的責任有什麼差異？
2. 為什麼本章要固定以 View UI Plus `v1.3.20` 作為 Source Baseline？
3. `01-chapter-scope-and-reading-map.md` 主要解決什麼問題？它和 `README.md` 的差異是什麼？
4. `02-source-material-index.md` 為什麼不能只整理 runtime source，還要整理 style、types、examples、registry 與 tests？
5. `03-component-groups-and-boundaries.md` 中的「public component」、「父子結構」與「internal helper」會如何影響後續筆記寫法？
6. 為什麼 layout/container 元件不能只看 `.vue` source？請用 `Row` / `Col` 或 `Affix` 舉例說明。
7. 寫單一元件筆記前，為什麼要先回查 `04-reading-method-runtime-style-type.md`？
8. 如果只是要排查某個 class 沒有效果，應該優先回查哪幾類 source？
9. 為什麼 examples 只能作為使用情境證據，而不能取代 runtime 與 type declaration？
10. 進入 `10-labs/` 仿作前，為什麼要先用 `05-reading-routes-and-checklists.md` 檢查核心資料流？

---

## 11. 後續延伸方向

這篇 README 是 `00-overview/` 的入口。後續可以延伸成以下幾類筆記：

1. **各子目錄 README 模板**  
   例如替 `01-grid-system/`、`02-layout-shell/`、`03-content-containers/` 建立一致的 README 結構，讓每組元件都有自己的入口頁。

2. **單一元件 source map 模板**  
   建立一份固定格式，用來記錄每個元件的 runtime source、style source、type declaration、example、registry 與 test path。

3. **runtime / style / type 對照表模板**  
   將 props、computed class、inline style、Less selector、type declaration 與 example 使用場景整理成可重複套用的表格。

4. **父子元件資料流分析模板**  
   專門用於 `Row` / `Col`、`Grid` / `GridItem`、`Collapse` / `Panel` 這類父子結構元件，固定記錄 provide / inject、父層狀態、子層消費與事件回傳。

5. **DOM 互動元件分析模板**  
   專門用於 `Split`、`Affix`、`Sider` 這類依賴 resize、scroll、mousemove、matchMedia 的元件，固定記錄 listener 綁定、清理流程與尺寸計算。

6. **`10-labs/` 仿作任務清單**  
   將每組元件的核心資料流改寫成 mini implementation 題目，例如 mini grid、mini collapse、mini split、mini affix，讓閱讀不只停留在理解 source，而能進一步轉成實作能力。

7. **橫向主題筆記**  
   後續可以新增 `08-style-system/` 與 `09-type-contracts/` 的 overview，分別整理本章所有元件的 Less class / mixin / variable，以及 runtime props 與 `.d.ts` 的一致性檢查。
