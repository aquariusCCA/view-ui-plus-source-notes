# Layout and Containers 章節範圍與閱讀地圖

## 0. 原始筆記問題分析

這份原始筆記已經具備很清楚的章節總覽功能：它明確指出 `08-layout-and-containers/` 這一章要閱讀的是 View UI Plus 中負責「頁面結構、區塊排列、內容容器、收合、分割、固定定位與頁尾操作區」的元件，並且已經把相關元件分成 `Grid system`、`Layout shell`、`Content containers`、`Collapsible containers`、`Spacing and split`、`Positioning containers`、`Page footer containers` 等群組。

不過，從長期學習與原始碼閱讀的角度來看，原始筆記仍有幾個可以補強的地方。

第一，原始筆記比較接近「閱讀地圖」與「速查表」的混合型筆記。它已經列出要讀哪些元件、閱讀順序與通用心智模型，但對於「為什麼 layout/container 類元件要這樣讀」的背景說明還可以更完整。對初次系統性閱讀 View UI Plus 原始碼的人來說，如果只看到目錄與元件清單，可能知道接下來要看什麼，卻不一定知道這一章在整個元件庫中的位置。

第二，原始筆記已經指出本章不處理表單、導航、資料展示、彈層與全局服務，但這些邊界可以再補成更明確的分類邏輯。因為元件庫中很多元件表面上都會處理「畫面呈現」，但真正的閱讀主軸不同：有些元件重點在資料結構，有些重點在互動狀態，有些重點在 DOM 定位，而本章的核心是「內容如何被放入穩定的版面結構」。

第三，原始筆記已經提供一條很好的閱讀順序，但可以再補充「初次閱讀」、「深入閱讀」與「可以暫時跳過」三種路線，讓讀者能依照自己的熟悉程度安排閱讀深度。

第四，原始筆記提到 `runtime source`、`Less source`、`type declaration`、`official example`、`registry / install` 等閱讀對象，但沒有提供具體來源材料索引。因為這篇筆記被放在 `08-layout-and-containers/00-overview/`，而該目錄也負責「來源材料索引」，所以需要新增一個「待補充來源材料索引」章節，提醒後續要把每組元件對應的 source、style、types、examples、tests、install entry 補齊。由於原始筆記沒有提供實際檔案路徑，這些路徑不能任意編造，應標註為「此處需要後續補充」。

第五，原始筆記已經有表格，但表格偏向分類摘要。重構後應保留原有表格，並補上「閱讀重點」、「容易忽略的線索」、「後續筆記應拆分方向」，讓表格不只是清單，而是能支援後續原始碼閱讀與筆記拆分。

---

## 1. 本章定位

這篇筆記是 `08-layout-and-containers/00-overview/` 底下的章節導讀與閱讀地圖。它不是要深入分析某一個元件的原始碼，也不是要整理所有 props 的 API 表，而是要先幫讀者建立一個清楚的閱讀框架：接下來在 `08-layout-and-containers/` 這一章中，要讀哪些元件、用什麼順序讀、閱讀時要觀察哪些層次，以及哪些主題不屬於本章主軸。

`08-layout-and-containers/` 這一章的核心問題是：

> View UI Plus 如何透過一組 layout 與 container 類元件，把頁面內容放進穩定、可組合、可控制的版面結構中？

這裡的「layout」偏向頁面或區塊的排列方式，例如欄格系統、頁面骨架、間距容器與分割容器；「container」偏向承載內容的外框或區域，例如卡片、收合面板、固定定位區塊與頁尾操作區。這些元件通常不是用來管理複雜資料，也不是用來處理表單驗證或彈層生命週期，而是負責決定內容在畫面中的位置、尺寸、結構、狀態與視覺承載方式。

讀完這篇筆記後，讀者應該能理解三件事。

第一，理解本章要收斂哪些 View UI Plus 元件，以及它們為什麼可以被歸在同一個章節中。這包括 `Row`、`Col`、`Layout`、`Header`、`Sider`、`Content`、`Footer`、`Card`、`Grid`、`GridItem`、`Collapse`、`Panel`、`Space`、`Split`、`Affix`、`FooterToolbar`、`GlobalFooter` 等。

第二，理解本章的閱讀順序。原則上應該先讀靜態布局，再讀頁面骨架，接著讀內容容器，再進入父子狀態、拖曳互動、DOM 定位與偏業務場景的容器組裝。

第三，理解閱讀 layout/container 元件時不能只看 props 表，而要同時觀察 `public props / slots / events`、runtime source、computed class、inline style、父子關係、DOM utility、Less 樣式、TypeScript declaration、official examples 與 registry/install。

這篇筆記不會深入分析每一個元件的完整原始碼。像 `Row` / `Col` 的 gutter 計算、`Sider` 的 collapse 與 breakpoint、`Collapse` / `Panel` 的 active keys、`Split` 的拖曳計算、`Affix` 的 scroll/resize 監聽等細節，會留到後續各子章節處理。

---

## 2. 學習前先建立的基本觀念

在正式進入 `08-layout-and-containers/` 之前，需要先建立幾個基本觀念。這些觀念會影響你接下來閱讀 View UI Plus 原始碼時的判斷方式。

### 2.1 layout/container 元件不是資料模型元件

layout/container 類元件的主軸通常不是「資料如何被查詢、轉換、排序或渲染成資料列」。它們更關心的是內容在畫面上的承載方式，例如：

- 內容要放在幾欄中的哪一欄。
- 內容外層是否需要卡片邊框、標題或額外操作區。
- 多個子區塊之間要如何保留間距。
- 某個區塊是否可以收合或展開。
- 某個容器是否要固定在視窗中的某個位置。
- 頁面底部操作區是否要維持穩定的視覺位置。

因此，閱讀這類元件時，不應一開始就期待看到複雜的資料流。很多時候，你看到的是 props 如何影響 class、style、slot 結構與 DOM 行為。

### 2.2 public API 與 runtime 實作要一起讀

元件庫的使用者通常先接觸的是 public API，例如 props、events、slots、component name 與 TypeScript declaration。但對原始碼閱讀來說，只看 public API 不夠，因為你還需要知道這些 API 在 runtime 中如何被消化。

例如某個 props 可能會被轉成 class，某個 slot 可能決定 DOM 結構，某個狀態可能會透過 provide/inject 傳給子元件，某個事件可能代表父子元件之間的狀態同步契約。這些內容通常分散在 component source、style source、type declaration 與 examples 中。

所以本章會把「API 層」與「runtime 層」放在同一條閱讀主線上，而不是把它們分開看。

### 2.3 樣式系統是 layout/container 元件的重要一半

layout/container 元件的很多能力不是只靠 Vue component source 完成，而是靠 class 與 Less 樣式共同完成。尤其像 `Row` / `Col` 這類欄格系統，原始筆記已經提醒：完整樣式不只在 component source 中，24 欄 class 主要由 Less mixin 產生。

這代表你閱讀這類元件時，不能只問「script 裡寫了什麼」，還要問：

- runtime 會產生哪些 class？
- 這些 class 在 Less 中如何被定義？
- 哪些 class 是固定存在的？
- 哪些 class 是根據 props 動態組合出來的？
- 哪些 responsive class 或尺寸 class 不是手寫，而是由 mixin 或迴圈產生？

對 layout/container 元件來說，忽略 style source 會導致你只看懂一半。

### 2.4 父子關係比單一元件更重要

本章很多元件不是孤立存在的，而是成組使用。

例如：

- `Row` 與 `Col` 是欄格系統中的父子組合。
- `Layout`、`Header`、`Sider`、`Content`、`Footer` 一起形成頁面骨架。
- `Collapse` 與 `Panel` 需要透過父層狀態與子層名稱協作。
- `Grid` 與 `GridItem` 形成內容容器內的格狀承載。
- `FooterToolbar` 與 `GlobalFooter` 偏向頁面尾端場景的內容組裝。

因此，閱讀時不能只打開單一元件檔案。你需要觀察父層如何辨識子層、子層如何回報自己、狀態是否集中在父層，以及 slot 結構如何建立使用者可組合的 API。

### 2.5 DOM utility、resize 與 scroll 代表元件進入互動布局層

部分 layout/container 元件會依賴 DOM 尺寸、視窗滾動、resize 事件或第三方 resize detector。這類元件已經不只是「把內容包起來」，而是會根據瀏覽器環境動態調整自己的樣式或狀態。

原始筆記特別指出 `Split`、`Affix`、`Grid` 這類元件不能只看 props 表，因為它們會依賴 DOM 尺寸、scroll、resize 或第三方 resize detector。這是本章從「靜態結構」走向「互動結構」的重要分界。

---

## 3. 整體概覽

`08-layout-and-containers/` 可以被視為 View UI Plus 中「畫面結構層」的閱讀章節。這一層不直接處理表單輸入、不主導資料展示，也不負責彈層生命週期，而是提供應用頁面常見的空間結構與內容承載方式。

本章可以用以下流程理解：

```txt
頁面骨架
  -> 區塊排列
  -> 內容容器
  -> 收合與展開
  -> 間距與分割
  -> 固定定位
  -> 頁尾操作區
```

這條流程不是 runtime 的實際呼叫鏈，而是一條學習路線。它代表從最基礎的版面分欄開始，逐步進入更接近真實業務頁面的容器組裝。

如果把它對應到元件群組，可以整理成以下結構：

```txt
08-layout-and-containers/
  00-overview/
    -> 本章總覽、閱讀方法、來源材料索引
  01-grid-system/
    -> Row / Col
  02-layout-shell/
    -> Layout / Header / Sider / Content / Footer
  03-content-containers/
    -> Card / Grid / GridItem
  04-collapsible-containers/
    -> Collapse / Panel
  05-spacing-and-split/
    -> Space / Split
  06-positioning-containers/
    -> Affix
  07-page-footer-containers/
    -> FooterToolbar / GlobalFooter
  08-style-system/
    -> Less、mixin、runtime class 與樣式生成規則
  09-type-contracts/
    -> TypeScript declaration 與 runtime props / emits 對照
  10-labs/
    -> 小型閱讀實驗、重構練習與案例整合
```

這個章節規劃的價值在於，它把「元件怎麼用」轉成「元件為什麼這樣設計」。對使用者來說，`Row` / `Col`、`Card`、`Collapse` 只是日常使用的 UI 元件；但對原始碼閱讀者來說，它們是觀察元件庫設計能力的切入點，例如 props 設計、slot contract、父子協作、class 生成、樣式系統、DOM 計算與型別契約。

---

## 4. 核心內容逐步講解

### 4.1 本章為什麼要獨立成 layout/container 章節

在元件庫中，並不是所有元件都值得用同一種方式閱讀。表單元件的重點通常是 value、validation、controlled/uncontrolled state；資料展示元件的重點通常是資料結構、render strategy、column definition 或 item rendering；彈層元件的重點可能是 z-index、portal、focus、transfer 與生命週期。

layout/container 元件則不同。它們的核心不是資料本身，而是「空間」。這裡的空間包含頁面骨架、欄格比例、外層容器、子區塊間距、分割比例、固定位置與底部操作區。這些能力表面上看起來只是 CSS，但在一個成熟元件庫中，通常會被封裝成可組合、可型別化、可維護的 component API。

因此，本章的閱讀重點不是只看某個元件有幾個 props，而是要觀察 View UI Plus 如何把常見版面需求抽象成元件，並且如何讓這些元件可以和 slot、class、style、Less、TypeScript declaration 與 examples 協同運作。

### 4.2 本章收斂的元件範圍

本章收斂的元件可以分成七個群組。這些群組的共通點是：它們通常不擁有複雜資料模型，而是管理「內容在哪裡、以什麼尺寸、什麼結構、什麼狀態被展示」。

| 分組 | 元件 | 核心問題 | 閱讀時優先觀察 |
| --- | --- | --- | --- |
| Grid system | `Row` / `Col` | 24 欄、gutter、flex、responsive props 如何共同形成欄格系統。 | class 生成、gutter 傳遞、responsive props、Less mixin。 |
| Layout shell | `Layout` / `Header` / `Sider` / `Content` / `Footer` | 頁面骨架如何識別 `Sider`，以及 `Sider` 如何收合與響應 breakpoint。 | 父子結構、slot children、collapse 狀態、breakpoint 行為。 |
| Content containers | `Card` / `Grid` / `GridItem` | 內容容器如何處理 title、extra、border、hover、padding、square 與 resize。 | header/extra slot、視覺結構、容器樣式、resize 依賴。 |
| Collapsible containers | `Collapse` / `Panel` | 父層 active names、accordion、panel name 與內容 slot 如何協作。 | active keys、accordion、父子狀態同步、事件回傳。 |
| Spacing and split | `Space` / `Split` | 間距容器與拖曳分割容器分別如何控制布局。 | 靜態間距 vs. 拖曳互動、inline style、DOM 尺寸計算。 |
| Positioning containers | `Affix` | scroll / resize 監聽、fixed 樣式、placeholder slot 如何保持位置。 | scroll/resize listener、fixed style、placeholder 尺寸維持。 |
| Page footer containers | `FooterToolbar` / `GlobalFooter` | 業務頁底部操作區與全局頁尾如何組裝內容。 | 偏業務頁面的組裝方式、slot、內容結構與樣式。 |

這張表不是要取代後續元件筆記，而是用來建立章節地圖。後續每一組元件都可以獨立拆成一篇或多篇筆記，分別追蹤 public API、runtime 實作、style source、type declaration 與 examples。

### 4.3 本章不主要處理的範圍

本章需要明確劃出邊界，因為 View UI Plus 的很多元件都會影響畫面呈現，但不代表它們都屬於 layout/container 章節。

| 主題 | 不作為本章核心的原因 | 建議放置章節 |
| --- | --- | --- |
| 表單校驗、輸入狀態 | 重點是資料輸入、校驗規則、value 狀態與錯誤訊息，不是版面結構。 | form/input 相關章節。 |
| 導航選中、路由跳轉 | 重點是目前選中狀態、路由關係、menu tree 或 navigation behavior。 | navigation 相關章節。 |
| `Table` / `List` 等資料展示 | 這些元件有自己的資料結構、渲染策略與效能議題。 | data display 相關章節。 |
| `Modal` / `Drawer` / `Tooltip` 等彈層生命週期 | 這些元件涉及 transfer、z-index、portal、focus、overlay 與生命週期控制。 | overlay / popup 相關章節。 |
| `$Message`、`$Modal` 等全局服務 | 這類元件偏命令式 API 與全局服務註冊，不是頁面結構元件。 | global service 相關章節。 |

有些 layout/container 元件可能會使用 `Icon`、`Tooltip` 或 DOM utility，但這些依賴在本章中只作為輔助來源處理。換句話說，本章可以說明某個容器為什麼需要它們，但不會展開分析 `Icon` 或 `Tooltip` 自身的完整實作。

### 4.4 建議閱讀順序：從靜態結構到互動結構

本章建議從靜態結構讀到互動結構，再讀定位與業務容器：

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

這個順序的邏輯是：先從最基本的空間分配開始，再進入頁面級骨架，接著處理內容外框，然後才進入狀態協作、拖曳互動、固定定位與業務容器。

| 順序 | 目的 | 你應該觀察什麼 |
| --- | --- | --- |
| `Row` / `Col` | 先理解最基礎的 layout class、gutter 與 responsive style generation。 | 欄格 class、gutter 來源、responsive props 如何轉成樣式。 |
| `Layout` / `Sider` | 再看頁面骨架與 slot children 對父層 class 的影響。 | 父層是否偵測 `Sider`、`Sider` 收合與 breakpoint 如何影響結構。 |
| `Card` / `Grid` | 進入內容容器，觀察 header、extra、padding、border、hover 等視覺結構。 | slot 區塊、外框樣式、容器尺寸與 resize 行為。 |
| `Collapse` / `Panel` | 開始追蹤父子狀態、active keys 與事件回傳。 | `Panel` name、父層 active names、accordion 與事件同步。 |
| `Space` / `Split` | 觀察純間距容器與高互動拖曳容器的差異。 | 靜態 spacing vs. 動態 split ratio，是否有 DOM 尺寸計算。 |
| `Affix` | 閱讀 scroll / resize 監聽與 fixed 定位的 DOM 計算。 | fixed style、placeholder、scroll container、resize 更新。 |
| `FooterToolbar` / `GlobalFooter` | 最後看偏業務頁面的容器組裝。 | 頁尾內容如何被 slot 或 props 組裝，是否偏上層業務場景。 |

如果你是第一次閱讀這一章，不建議一開始就跳到 `Affix` 或 `Split`。因為這類元件通常會牽涉 DOM 尺寸、事件監聽與動態 style，閱讀成本較高。先讀 `Row` / `Col` 與 `Layout`，能幫你建立 class 與結構層的基本感覺。

### 4.5 本章通用心智模型

layout/container 元件通常可以用同一條主線閱讀：

```txt
public props / slots / events
  -> runtime source
  -> computed class / inline style
  -> parent-child relationship
  -> DOM utility / resize / scroll dependency
  -> Less source
  -> type declaration
  -> official example
  -> registry / install
```

這條主線可以拆成幾個層次。

第一層是 public API，也就是使用者在文件中會看到的 props、slots、events 與 component name。這一層回答的是「元件對外怎麼用」。

第二層是 runtime source，也就是 Vue component 實作。這一層回答的是「使用者傳進來的 props、slots 與 events，在元件內部如何被轉成實際行為」。

第三層是 class 與 inline style。layout/container 元件很常把 props 轉成 class 或 style，因此你要追蹤 computed class、style object、條件 class、尺寸 style 與狀態 class。

第四層是父子關係。很多容器類元件不是單體元件，而是由父層與子層共同完成行為。此時需要觀察 provide/inject、slot contract、children inspection、event emit 或狀態同步。

第五層是 DOM dependency。只要元件需要測量尺寸、監聽 scroll、監聽 resize 或維持 placeholder，就要進一步閱讀 DOM utility 與生命週期處理。

第六層是 Less source。元件的視覺規則、spacing、border、hover、responsive class、mixin 生成規則，通常都在 style source 中。

第七層是 type declaration。成熟元件庫需要讓 TypeScript declaration 與 runtime public props 保持一致，否則使用者在開發時會遇到型別提示與實際行為不一致的問題。

第八層是 official example。examples 不只是展示用法，也常常揭示官方預期的組合方式。閱讀 examples 可以幫你判斷哪些 props 是主用法，哪些只是補充或邊界用法。

第九層是 registry / install。元件最後如何被 export、install、掛到套件入口，會影響使用者能否正確引入，也會影響子元件是否有自己的 public export。

### 4.6 本章最容易漏掉的三個細節

原始筆記中特別提醒了三個很重要的細節，這三點應該成為後續閱讀時的檢查清單。

第一，`Row` / `Col` 的完整樣式不只在 component source 中，24 欄 class 主要由 Less mixin 產生。這代表如果你只看 `Row` 或 `Col` 的 Vue 檔，可能只會看到 props 如何組 class，卻看不到這些 class 最終如何對應到寬度、間距與 responsive 規則。

第二，`Header`、`Footer`、`Content`、`Sider`、`Panel`、`GridItem` 雖然有自己的 public export，但 runtime source 實際放在主元件目錄下。這代表你不能看到 public component name 就立刻假設它一定有獨立完整的 source 目錄。閱讀時要回到實際 source 結構確認。

第三，像 `Split`、`Affix`、`Grid` 這類元件會依賴 DOM 尺寸、scroll、resize 或第三方 resize detector，不能只看 props 表。這類元件的真正難點通常在生命週期、事件監聽、尺寸同步與樣式更新，而不只是在 API 命名。

### 4.7 後續每組元件筆記應固定回答的問題

為了讓整個 `08-layout-and-containers/` 章節的筆記風格一致，後續每組元件可以固定回答以下問題：

1. 這組元件的 public components 有哪些？
2. 它們是否存在父子關係、provide/inject、slot contract 或內部輔助元件？
3. props 如何影響 class、inline style、DOM 結構或事件？
4. style source 在哪裡，哪些 class 是 runtime 動態生成，哪些 class 是 Less 生成？
5. type declaration 是否與 runtime props / emits 一致？
6. 官方 examples 展示了哪些主要場景？
7. 是否有測試或外部依賴可以驗證行為？

這些問題可以視為本章的「通用分析模板」。後續不管是讀 `Row` / `Col`、`Collapse` / `Panel`，還是 `Affix`，都可以用同一套問題拆解，只是不同元件的重點會不同。

---

## 5. 表格整理

### 5.1 章節元件群組總表

| 群組 | 元件 | 在本章中的角色 | 主要閱讀角度 | 後續筆記方向 |
| --- | --- | --- | --- | --- |
| Grid system | `Row` / `Col` | 建立基礎欄格與 responsive layout。 | props -> class、gutter、flex、Less mixin。 | 拆成欄格系統、gutter 傳遞、responsive class 生成。 |
| Layout shell | `Layout` / `Header` / `Sider` / `Content` / `Footer` | 建立頁面骨架與側邊欄結構。 | 父子結構、`Sider` 偵測、collapse、breakpoint。 | 拆成頁面骨架、`Sider` 收合、breakpoint 行為。 |
| Content containers | `Card` / `Grid` / `GridItem` | 承載內容並提供標題、額外操作區、邊框與 hover 等視覺結構。 | slot、class、padding、border、resize。 | 拆成 `Card` 結構、`Grid` 容器、`GridItem` 子項。 |
| Collapsible containers | `Collapse` / `Panel` | 管理可收合內容區塊。 | active names、accordion、panel name、事件回傳。 | 拆成父子狀態、單開/多開、slot contract。 |
| Spacing and split | `Space` / `Split` | 處理子元素間距與拖曳分割布局。 | 靜態 spacing、動態 split、DOM 尺寸。 | 拆成 `Space` 間距策略與 `Split` 拖曳流程。 |
| Positioning containers | `Affix` | 讓元素根據 scroll/resize 固定在指定位置。 | scroll listener、fixed style、placeholder。 | 拆成定位計算、placeholder 機制、事件監聽。 |
| Page footer containers | `FooterToolbar` / `GlobalFooter` | 組裝業務頁尾操作區與全局頁尾。 | slot、內容結構、樣式與業務場景。 | 拆成頁尾操作區組裝與全局頁尾設計。 |

這張表的閱讀方式是：先看「角色」，確認每組元件要解決哪一類布局問題；再看「主要閱讀角度」，決定打開原始碼後要優先追哪一條線；最後看「後續筆記方向」，決定未來每組元件要如何拆成更細的教材型筆記。

### 5.2 本章排除範圍表

| 排除主題 | 為什麼不放在本章主軸 | 本章仍可能碰到的情況 | 處理方式 |
| --- | --- | --- | --- |
| 表單校驗與輸入狀態 | 主軸是 value、validation、error state，不是空間結構。 | 容器內可能放表單元件。 | 只討論容器如何承載，不展開表單邏輯。 |
| 導航與路由 | 主軸是選中狀態、路由跳轉與 menu tree。 | `Layout` 可能搭配側邊導航使用。 | 只討論 layout shell，不展開 navigation 元件。 |
| 資料展示 | 主軸是資料結構與渲染策略。 | `Card` 或 `Grid` 中可能放資料展示內容。 | 只討論容器結構，不展開資料展示實作。 |
| 彈層與浮層 | 主軸是 portal、z-index、focus、transfer。 | 容器可能搭配 `Tooltip` 或其他浮層元件。 | 只說明依賴，不展開浮層生命週期。 |
| 全局服務 | 主軸是命令式 API 與全局註冊。 | 本章元件可能也經過 install/registry。 | 只追 component install，不分析 `$Message` 類服務。 |

這張表的目的不是把知識切得很死，而是避免閱讀時失焦。當你在 layout/container 元件中看到其他類型的依賴時，要先判斷它是「本章主角」還是「輔助依賴」。

### 5.3 通用閱讀流程表

| 步驟 | 閱讀對象 | 主要問題 | 觀察重點 | 注意事項 |
| --- | --- | --- | --- | --- |
| 1 | public props / slots / events | 元件對使用者暴露什麼能力？ | props、events、slots、component name。 | 不要只停在 API 表，要追 runtime 如何實作。 |
| 2 | runtime source | API 如何被轉成實際行為？ | computed、render、setup、methods、emits。 | 注意父子關係與狀態同步。 |
| 3 | computed class / inline style | props 如何影響畫面結構？ | class name、style object、條件 class。 | layout 元件常把核心邏輯藏在 class 組合中。 |
| 4 | parent-child relationship | 父子元件如何協作？ | provide/inject、slot、children inspection、event emit。 | 成組元件不能只讀其中一個。 |
| 5 | DOM utility / resize / scroll dependency | 是否依賴瀏覽器環境？ | scroll、resize、尺寸測量、placeholder。 | 這類邏輯通常是 bug 與邊界情境來源。 |
| 6 | Less source | runtime class 最終如何生效？ | Less 變數、mixin、巢狀 class、responsive 規則。 | 不要忽略由 Less 生成的 class。 |
| 7 | type declaration | 型別契約是否與 runtime 一致？ | props type、emits type、component export。 | 注意 public API 是否和實作不同步。 |
| 8 | official example | 官方預期怎麼組合使用？ | 基本用法、進階用法、常見情境。 | examples 可反推設計意圖。 |
| 9 | registry / install | 元件如何被使用者引入？ | export、install、子元件註冊。 | 特別注意子元件是否有 public export。 |

這個流程表可以直接複製到後續每篇元件分析筆記中，作為固定檢查清單。

### 5.4 來源材料索引模板

原始筆記沒有提供 View UI Plus 具體原始碼路徑，因此此處先建立來源材料索引模板。後續閱讀實際 repo 時，應把每一組元件的 source、style、types、examples、tests 與 install entry 補齊。

| 群組 | runtime source | style source | type declaration | official examples | tests / 外部依賴 | registry / install |
| --- | --- | --- | --- | --- | --- | --- |
| `Row` / `Col` | 此處需要後續補充 | 此處需要後續補充 | 此處需要後續補充 | 此處需要後續補充 | 此處需要後續補充 | 此處需要後續補充 |
| `Layout` / `Header` / `Sider` / `Content` / `Footer` | 此處需要後續補充 | 此處需要後續補充 | 此處需要後續補充 | 此處需要後續補充 | 此處需要後續補充 | 此處需要後續補充 |
| `Card` / `Grid` / `GridItem` | 此處需要後續補充 | 此處需要後續補充 | 此處需要後續補充 | 此處需要後續補充 | 此處需要後續補充 | 此處需要後續補充 |
| `Collapse` / `Panel` | 此處需要後續補充 | 此處需要後續補充 | 此處需要後續補充 | 此處需要後續補充 | 此處需要後續補充 | 此處需要後續補充 |
| `Space` / `Split` | 此處需要後續補充 | 此處需要後續補充 | 此處需要後續補充 | 此處需要後續補充 | 此處需要後續補充 | 此處需要後續補充 |
| `Affix` | 此處需要後續補充 | 此處需要後續補充 | 此處需要後續補充 | 此處需要後續補充 | 此處需要後續補充 | 此處需要後續補充 |
| `FooterToolbar` / `GlobalFooter` | 此處需要後續補充 | 此處需要後續補充 | 此處需要後續補充 | 此處需要後續補充 | 此處需要後續補充 | 此處需要後續補充 |

這張表很重要，因為 `00-overview/` 不只要放閱讀方法，也應該成為後續整章的材料入口。每當你完成一組元件的閱讀，都可以回來補上這張表，讓整個章節從「閱讀計畫」逐步變成「來源索引」。

---

## 6. 範例或情境說明

### 6.1 以 `Row` / `Col` 為例：為什麼不能只看 props

假設你看到如下使用方式：

```vue
<Row :gutter="16">
  <Col :span="12">Left</Col>
  <Col :span="12">Right</Col>
</Row>
```

從使用者角度來看，這只是把畫面切成左右兩欄，並在欄之間加入間距。但從原始碼閱讀角度來看，你至少要追四件事。

第一，`Row` 的 `gutter` 如何影響子層 `Col`。這可能涉及父子關係、provide/inject 或其他傳遞方式；實際方式需要回到原始碼確認，不能只憑使用方式判斷。

第二，`Col` 的 `span` 如何轉成 class 或 style。`span=12` 通常代表 24 欄系統中的一半寬度，但最終是由 runtime class 與 Less 樣式共同完成。

第三，responsive props 是否會產生不同 breakpoint 的 class。這會牽涉 props 設計與樣式生成規則。

第四，Less mixin 是否負責產生 24 欄 class。原始筆記已提醒這是 `Row` / `Col` 的重要閱讀點，所以後續不能只讀 component source。

這個例子說明：layout 元件的 API 看起來很簡單，但背後其實是 public API、runtime class 與 style system 的合作。

### 6.2 以 `Collapse` / `Panel` 為例：為什麼父子狀態是閱讀重點

`Collapse` / `Panel` 這類元件不是單純的外框容器，它們還涉及「哪一個 panel 目前是展開狀態」。因此閱讀時不能只看 `Panel` 如何渲染內容，也要看父層 `Collapse` 如何管理 active names。

你需要追蹤：

- `Panel` 如何被命名。
- `Collapse` 如何知道目前哪些 `Panel` 展開。
- `accordion` 是否改變 active names 的規則。
- 使用者點擊 `Panel` 時，事件如何回到父層。
- 父層狀態變更後，如何再影響子層內容顯示。

這類元件的本質是「容器 + 狀態協作」。它仍然屬於 layout/container 章節，但比 `Card` 更接近互動容器。

### 6.3 以 `Affix` 為例：為什麼 DOM 計算不能跳過

`Affix` 的目標是讓某個內容在滾動時固定在指定位置。這種行為不可能只靠 props 名稱理解，因為真正的行為與瀏覽器環境高度相關。

閱讀時要問：

- 它監聽哪個 scroll container？
- 何時進入 fixed 狀態？
- fixed 後原本的位置是否需要 placeholder 維持高度？
- resize 時是否重新計算位置？
- 元件卸載時是否清除 listener？

這些問題都屬於 DOM 行為，而不是 API 表可以完整回答的內容。這也是為什麼本章會把 `Affix` 放在較後面的原因。

---

## 7. 閱讀路線或學習路線

### 7.1 初次閱讀路線

如果你是第一次閱讀 `08-layout-and-containers/`，建議使用以下路線：

1. 先讀 `01-grid-system/`，目的是建立 layout 元件最基本的 class、gutter、flex 與 responsive 概念。
2. 再讀 `02-layout-shell/`，目的是理解頁面骨架如何由多個子元件組成，以及父層如何受到子層影響。
3. 接著讀 `03-content-containers/`，目的是觀察內容容器如何透過 title、extra、border、hover、padding 等視覺結構承載內容。
4. 再讀 `04-collapsible-containers/`，開始接觸父子狀態與 active names。
5. 接著讀 `05-spacing-and-split/`，比較純 spacing 容器與拖曳 split 容器的差異。
6. 最後讀 `06-positioning-containers/` 與 `07-page-footer-containers/`，分別理解 DOM 定位與偏業務場景的容器組裝。

初次閱讀時，不需要一開始就把每個 props 都背下來。更重要的是建立「這組元件解決什麼 layout/container 問題」的分類能力。

### 7.2 深入閱讀路線

當你已經看完初次閱讀路線後，可以進入深入閱讀：

1. 回頭補 `08-style-system/`，追蹤 Less source、mixin、class 命名規則與 runtime class 的對應。
2. 補 `09-type-contracts/`，檢查 TypeScript declaration 是否與 runtime props / emits 一致。
3. 補 `registry / install` 相關資料，確認每組元件如何被 export、install，以及子元件是否有 public export。
4. 建立每組元件的 source index，把 runtime source、style source、type declaration、examples、tests 全部整理到 `00-overview/` 的來源材料索引。
5. 在 `10-labs/` 中做小型實驗，例如重現 `Row` / `Col` 的 gutter 行為、模擬 `Collapse` active keys、或拆解 `Affix` 的 fixed/placeholder 機制。

深入閱讀的目標不是只會使用元件，而是理解元件庫作者如何把常見 UI layout 問題封裝成穩定 API。

### 7.3 可以暫時跳過的部分

如果你目前的目標是先建立整體感，可以暫時跳過以下內容：

- 非核心邊界 props 的完整列表。
- 少見 examples 的每一個變體。
- 與本章無關的依賴元件完整實作，例如 `Icon`、`Tooltip`。
- 測試細節中的每一個 edge case。
- 尚未確認路徑的 source index。

但以下內容不建議跳過：

- 每組元件的 public components。
- props 如何影響 class、style、DOM 結構或事件。
- 父子元件關係。
- Less source 與 runtime class 的關係。
- type declaration 與 runtime public props 的一致性。

---

## 8. 常見誤區

| 誤區 | 為什麼容易誤解 | 正確理解 |
| --- | --- | --- |
| 以為 layout/container 元件只是 CSS 包裝。 | 很多元件看起來只是排版，容易被低估。 | 在元件庫中，layout/container 是 API、slot、class、style、型別與 examples 的整合設計。 |
| 只看 props 表就以為懂了元件。 | props 是最容易看到的文件內容。 | 對本章元件而言，props 往往只是入口，真正行為要追 runtime class、inline style、父子關係與 Less。 |
| 看到 public export 就以為每個子元件都有獨立 source。 | 使用者引入時看到的是 component name。 | 原始筆記已提醒，部分子元件雖然有 public export，但 runtime source 實際放在主元件目錄下。 |
| 忽略 Less mixin 產生的 class。 | 初學者常把重點放在 Vue component source。 | 尤其 `Row` / `Col` 這類欄格系統，24 欄 class 主要由 Less mixin 產生，必須讀 style source。 |
| 把 `Space` 與 `Split` 都當成單純排版元件。 | 它們都和空間分配有關。 | `Space` 偏靜態間距容器，`Split` 偏拖曳互動與 DOM 尺寸計算，閱讀難度不同。 |
| 把 `Affix` 當成普通 fixed class。 | 表面效果像 CSS `position: fixed`。 | `Affix` 還涉及 scroll/resize 監聽、位置計算與 placeholder 維持，不只是加一個 class。 |
| 把 `FooterToolbar` / `GlobalFooter` 當成底層通用 layout。 | 它們也屬於頁面結構的一部分。 | 這兩者更偏業務頁面容器組裝，閱讀時要注意其抽象層級可能高於基礎 layout 元件。 |
| 在本章展開分析 `Tooltip`、`Icon` 或 `$Message`。 | layout/container 元件可能依賴它們。 | 這些依賴在本章只作為輔助來源，不應偏離主軸。 |

---

## 9. 本章總結

`08-layout-and-containers/` 是 View UI Plus 原始碼閱讀中負責「畫面結構層」的章節。這一章的重點不是表單資料流、資料展示策略、彈層生命週期或全局服務，而是理解元件庫如何把頁面骨架、欄格系統、內容容器、收合結構、間距分割、固定定位與頁尾操作區封裝成可組合的元件 API。

閱讀這一章時，要先建立一個核心心智模型：layout/container 元件通常是由 public props、slots、events 開始，進入 runtime source，再轉成 computed class、inline style、DOM 結構與事件；如果存在父子關係，還要追 provide/inject、slot contract 或 active state；如果涉及尺寸、滾動或拖曳，還要追 DOM utility、resize、scroll 與生命週期；最後還要回到 Less source、TypeScript declaration、official examples 與 registry/install 驗證整體設計。

這篇總覽筆記的作用，是讓後續每一篇元件分析都不會變成零散速查表。當你閱讀 `Row` / `Col` 時，要想到它是欄格系統；閱讀 `Layout` / `Sider` 時，要想到頁面骨架與父子結構；閱讀 `Card` / `Grid` 時，要想到內容承載與視覺結構；閱讀 `Collapse` / `Panel` 時，要想到父子狀態協作；閱讀 `Split` / `Affix` 時，要想到 DOM 尺寸與事件監聽；閱讀 `FooterToolbar` / `GlobalFooter` 時，要想到偏業務頁面的容器組裝。

換句話說，本章不是單純介紹「有哪些元件」，而是建立一套閱讀 layout/container 元件的固定方法。只要這套方法建立起來，後續讀任何類似元件時，都能用同樣的問題拆解：它對外暴露什麼 API？它如何轉成 class/style/DOM？它是否有父子關係？它依賴哪些樣式規則？它的型別契約是否和 runtime 一致？官方 examples 又揭示了哪些預期用法？

---

## 10. 自我檢查問題

1. 為什麼 `08-layout-and-containers/` 這一章的核心不是表單資料流，也不是資料展示邏輯？
2. layout/container 元件通常負責管理哪些畫面問題？
3. 為什麼閱讀 `Row` / `Col` 時不能只看 component source，還要看 Less source？
4. `Layout` / `Header` / `Sider` / `Content` / `Footer` 這組元件的閱讀重點為什麼是父子結構與頁面骨架？
5. `Card` / `Grid` / `GridItem` 和 `Collapse` / `Panel` 的閱讀重點有什麼不同？
6. 為什麼 `Split` 與 `Affix` 的閱讀成本通常高於純靜態容器？
7. 什麼情況下本章可以提到 `Icon`、`Tooltip` 或 DOM utility？什麼情況下不應展開？
8. 請用自己的話說明 `public props / slots / events -> runtime source -> computed class / inline style -> Less source` 這條閱讀線的意義。
9. 為什麼 type declaration 需要和 runtime public props / emits 對照？
10. 如果你要寫 `01-grid-system/` 的下一篇筆記，你會優先回答哪五個問題？

---

## 11. 後續延伸方向

後續 `08-layout-and-containers/` 可以拆成以下主題筆記：

1. `01-grid-system/01-row-col-source-map.md`：整理 `Row` / `Col` 的 public API、runtime source、style source 與 examples。
2. `01-grid-system/02-gutter-and-responsive-class.md`：專門分析 gutter、24 欄 class、responsive props 與 Less mixin。
3. `02-layout-shell/01-layout-family-source-map.md`：整理 `Layout`、`Header`、`Sider`、`Content`、`Footer` 的父子結構與 public export。
4. `02-layout-shell/02-sider-collapse-and-breakpoint.md`：深入分析 `Sider` 的收合、breakpoint 與事件。
5. `03-content-containers/01-card-structure.md`：分析 `Card` 的 title、extra、border、hover、padding 與 slot 結構。
6. `03-content-containers/02-grid-and-grid-item.md`：分析 `Grid` / `GridItem` 的容器結構、square、hover、resize 等行為。
7. `04-collapsible-containers/01-collapse-panel-state.md`：分析 `Collapse` / `Panel` 的 active names、accordion 與事件回傳。
8. `05-spacing-and-split/01-space-layout-strategy.md`：分析 `Space` 如何處理子元素間距。
9. `05-spacing-and-split/02-split-dragging-flow.md`：分析 `Split` 的拖曳流程、DOM 尺寸與 inline style。
10. `06-positioning-containers/01-affix-scroll-resize.md`：分析 `Affix` 的 scroll / resize 監聽、fixed 樣式與 placeholder 機制。
11. `07-page-footer-containers/01-footer-toolbar-and-global-footer.md`：分析 `FooterToolbar` / `GlobalFooter` 的業務頁面容器組裝。
12. `08-style-system/01-layout-less-system.md`：整理本章相關 Less source、mixin、class 命名與 responsive class。
13. `09-type-contracts/01-layout-type-contracts.md`：對照本章元件的 TypeScript declaration 與 runtime props / emits。
14. `10-labs/01-rebuild-mini-grid-system.md`：練習重建一個簡化版 `Row` / `Col` 欄格系統。
15. `10-labs/02-rebuild-mini-collapse.md`：練習重建一個簡化版 `Collapse` / `Panel` 父子狀態模型。

以上延伸方向可以讓這篇 `00-overview` 不只是章節介紹，而是成為後續整個 `08-layout-and-containers/` 筆記包的索引入口。
