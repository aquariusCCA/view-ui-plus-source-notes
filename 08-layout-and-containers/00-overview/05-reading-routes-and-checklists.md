# Layout and Containers 閱讀路線與檢查清單

## 0. 原始筆記問題分析

這篇原始筆記的主題很清楚：它不是要介紹某一個元件的完整原始碼，而是要替 `08-layout-and-containers/` 建立一份實際可執行的閱讀路線與檢查清單。原文已經整理出初次閱讀路線、單組元件深讀路線、source 回查方向、各組元件檢查問題、仿作前檢查項目，以及常見回查問題。這些內容很適合作為本章的操作指南。

不過，原始筆記目前仍偏向「清單型索引」，適合快速回查，但對初學者來說，還缺少幾個教學層面的補強：

1. **閱讀路線背後的原因還可以更明確**  
   原文列出了從 `00-overview/` 到 `10-labs/` 的順序，但還可以進一步說明為什麼要從低互動元件讀到高互動元件，以及為什麼最後才進入 style、type contract 與 labs。

2. **不同閱讀情境的使用方式可以再拆清楚**  
   原文提到第一次讀完整章、深入分析單組元件、回查 props / class / event、準備仿作與排查問題，但可以再補成「什麼情境應該用哪一條路線」的判斷方式。

3. **檢查清單需要轉成理解標準**  
   原文列出的問題很實用，但若只是逐題回答，容易變成考題清單。重構後應補充：這些問題其實是在檢查你是否掌握了 public contract、runtime data flow、style mapping、type contract 與行為證據。

4. **回查路線需要和 `runtime / style / type` 對照方法串起來**  
   本篇筆記應該承接前一篇 `04-reading-method-runtime-style-type.md`，把「如何閱讀」轉成「不同需求下該去哪裡查」。

5. **仿作前檢查清單可以補上學習目的**  
   原文已經列出 mini `Row` / `Col`、mini `Layout`、mini `Collapse`、mini `Split`、mini `Affix` 等仿作前要求，但應強調：仿作不是複製完整 View UI Plus，而是驗證自己是否理解核心資料流。

因此，重構後的筆記會保留原始清單的完整性，並補強為一份「可以指導整章閱讀、回查與練習安排」的教材型筆記。

---

## 1. 本章定位

這篇筆記放在 `08-layout-and-containers/00-overview/`，定位是本章的「閱讀路線與檢查清單」。它的主要任務不是列出所有 source path，也不是深入分析某一個元件，而是幫助讀者在不同學習情境下判斷：

```txt
現在我應該先看哪裡？
看到什麼程度才算理解？
遇到問題時應該回查哪一類 source？
進入仿作前要先確認哪些能力？
```

因此，本篇筆記可以視為整個 `08-layout-and-containers/` 的操作手冊。前面的 overview 筆記負責回答「本章有哪些內容」與「source 分布在哪裡」，而這篇筆記則負責回答「實際閱讀時應該怎麼走」。

本篇筆記會解決以下問題：

1. 第一次讀完整章時，應該依照什麼順序。
2. 深入分析某一組元件時，應該先看 public contract 還是 source implementation。
3. 只想回查 props、class、inline style、event、public export 或測試時，應該快速定位到哪裡。
4. 準備寫 `10-labs/` 仿作練習前，應該具備哪些最低理解。
5. 排查 layout/container 行為不符合預期時，應該從哪個層面切入。

本篇不會展開每個元件的完整 source analysis。像 `Row` / `Col` 的 gutter 計算、`Sider` 的 breakpoint、`Split` 的拖曳演算法、`Affix` 的 fixed 判斷，都會留到後續對應子章節詳細分析。

---

## 2. 學習前先建立的基本觀念

閱讀 layout/container 類元件時，最重要的觀念是：這類元件的行為通常不是只存在於 `.vue` 檔案中，而是分散在 runtime、style、type、example、registry 與 test 之間。

一個看似簡單的 layout class，可能經過以下流程才形成真正的畫面效果：

```txt
props
  -> computed class
  -> Less selector 或 Less mixin
  -> 實際 CSS
  -> DOM layout
```

一個看似簡單的互動狀態，也可能經過以下流程才對外產生效果：

```txt
user interaction
  -> component method
  -> internal state
  -> computed class / inline style
  -> emit event
  -> v-model update
```

因此，本章閱讀時不要只問「這個元件 template 長什麼樣子」，而要問：

1. 使用者能透過哪些 props、slots、events 操作它？
2. runtime 如何把這些輸入轉成 class、inline style 或 internal state？
3. style source 是否真的承接了 runtime 產生的 class？
4. type declaration 是否和 runtime props / events 一致？
5. official examples 展示的是主推用法，還是只覆蓋其中一小部分？
6. tests 是否能作為行為存在的證據？

本篇筆記中的閱讀路線與檢查清單，就是為了讓你在每一組元件中重複套用這套思考方式。

### 2.1 低互動到高互動的閱讀原則

原始筆記建議第一次閱讀時使用「從低互動到高互動」的順序。這個原則很重要，因為 layout/container 元件的難度通常不是取決於畫面複雜度，而是取決於它是否涉及狀態同步、DOM measurement、事件監聽與父子協作。

例如：

- `Row` / `Col` 主要是 class、gutter、responsive style generation。
- `Card` 主要是內容容器與視覺分支。
- `Collapse` / `Panel` 開始涉及父子狀態與 `v-model`。
- `Split` 涉及拖曳事件、限制範圍與尺寸轉換。
- `Affix` 涉及 scroll / resize、固定定位與 placeholder。

如果一開始就讀 `Split` 或 `Affix`，容易被 DOM 細節打散；先讀 `Row` / `Col`、`Layout`、`Card` 這類較基礎的結構元件，可以先建立 class、style、slot 與容器責任的閱讀習慣。

### 2.2 檢查清單不是背誦題，而是理解標準

本篇後面列出的檢查清單，不是要求你死背答案，而是用來確認自己是否真的讀懂 source。

例如，當你能回答：

```txt
Row.gutter 如何影響 Row margin 與 Col padding？
```

代表你不只是知道 `gutter` 是間距，而是已經看懂：

```txt
Row 提供 gutter
  -> Col 注入 RowInstance
  -> Row 計算 margin
  -> Col 計算 padding
  -> style 系統承接排版效果
```

同樣地，當你能回答：

```txt
Affix 的 placeholder div 為什麼存在？
```

代表你不只是知道 `Affix` 會 fixed，而是已經理解 fixed positioning 會讓元素脫離原本 normal flow，因此需要 placeholder 補回原本的寬高，避免頁面跳動。

---

## 3. 整體概覽

這篇筆記可以分成五種使用情境。

| 使用情境 | 你正在做什麼 | 建議使用的章節 |
| --- | --- | --- |
| 初次閱讀 | 第一次系統性讀完整個 `08-layout-and-containers/` | `2. 初次閱讀路線`、`7. 閱讀路線或學習路線` |
| 單組深讀 | 正在分析 `Row / Col`、`Collapse / Panel` 等某一組元件 | `3. 單組元件深讀路線`、`5. 各組元件檢查清單` |
| 快速回查 | 想查 props、class、event、style、types、export、example 或 test | `4. Source 回查路線`、`7. 常見回查問題` |
| 仿作準備 | 準備進入 `10-labs/` 寫 mini implementation | `6. 仿作前檢查清單` |
| 問題排查 | 畫面或互動行為不符合預期 | `7. 常見回查問題`、各組元件檢查清單 |

整體上，本篇筆記的主軸可以整理成：

```txt
先建立完整閱讀順序
  -> 再掌握單組元件深讀方法
  -> 再學會依問題類型快速回查 source
  -> 最後用檢查清單驗證理解與準備仿作
```

這樣安排的好處是：你不會只停留在「看過原始碼」，而是能逐步建立「知道該去哪裡查、知道如何驗證、知道如何仿作」的能力。

---

## 4. 核心內容逐步講解

### 4.1 初次閱讀路線：先建立整章地圖

第一次讀本章時，建議使用從低互動到高互動的路線：

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

這條路線的目的不是讓你一次記住所有細節，而是逐步建立三種能力：

1. **先看懂結構型元件**  
   從 `Grid system`、`Layout shell`、`Content containers` 開始，可以先理解 layout/container 元件如何透過 props、class、slots 與 Less 形成頁面結構。

2. **再看懂狀態型與互動型元件**  
   `Collapse`、`Split`、`Affix` 等元件開始牽涉父子狀態、拖曳事件、scroll / resize 與 DOM measurement。這些內容更適合在前面基礎建立後再閱讀。

3. **最後橫向整理 style、type 與 labs**  
   當你讀完各組元件後，再回頭看 `08-style-system/` 與 `09-type-contracts/`，可以把先前分散在各元件中的 class、Less、type declaration 做橫向對照。最後進入 `10-labs/`，用仿作驗證理解。

各目錄的初次閱讀目的如下：

| 目錄 | 先掌握什麼 | 閱讀重點 |
| --- | --- | --- |
| `00-overview/` | 章節範圍、source path、閱讀方法 | 先建立本章不處理什麼，以及後續 source 要去哪裡查。 |
| `01-grid-system/` | 24 欄、gutter、responsive props、Less mixin | 建立 runtime class 與 Less mixin 的對照習慣。 |
| `02-layout-shell/` | 頁面骨架、Sider 收合、breakpoint、trigger | 理解 Layout shell 與 Sider 互動責任的差異。 |
| `03-content-containers/` | 卡片、宮格、內容容器與父子尺寸 | 比較獨立容器 `Card` 與父子容器 `Grid / GridItem`。 |
| `04-collapsible-containers/` | active names、accordion、panel 父子狀態 | 學會追蹤父層狀態如何影響子層顯示。 |
| `05-spacing-and-split/` | 間距與拖曳分割兩種布局控制方式 | 區分低互動的 `Space` 與高互動的 `Split`。 |
| `06-positioning-containers/` | fixed 定位、scroll / resize、placeholder | 觀察 DOM measurement 與 fixed positioning 的處理方式。 |
| `07-page-footer-containers/` | 業務頁 footer 容器與全局 footer | 理解偏業務型容器如何組裝 slots 與 style。 |
| `08-style-system/` | class、Less、變數、mixin 的橫向整理 | 把各組元件的 style 規則集中對照。 |
| `09-type-contracts/` | runtime props 與 type declaration 對照 | 檢查 public contract 與 runtime source 是否一致。 |
| `10-labs/` | 用 mini implementation 驗證理解 | 用小型仿作確認是否掌握核心資料流。 |

初次閱讀時，不建議一開始就停在某個 method 裡深挖所有細節。比較好的方式是先建立「每一組元件在本章的位置」，再回到單組元件深讀。

---

### 4.2 單組元件深讀路線：從 public contract 到 design takeaway

當你開始分析任一組元件時，可以固定使用以下路線：

```txt
README / overview
  -> source map
  -> public props / slots / events
  -> runtime implementation
  -> style source
  -> type declaration
  -> official example
  -> registry / install
  -> design takeaway
```

這條路線背後的邏輯是：先確認使用者看得到什麼，再理解內部如何實作，最後整理這組元件的設計重點。

| 步驟 | 閱讀目標 | 不應該犯的錯 |
| --- | --- | --- |
| README / overview | 先知道這組元件要解決什麼問題 | 不要直接跳進 methods。 |
| source map | 找到 runtime、style、type、example、test | 不要只看 `.vue`。 |
| public props / slots / events | 建立 public surface | 不要把 type declaration 直接當成行為實作。 |
| runtime implementation | 追蹤 props 如何變成 state、class、style、event | 不要只貼 source，要整理資料流。 |
| style source | 對照 runtime class 是否有 CSS 承接 | 不要忽略 Less mixin 產生的 class。 |
| type declaration | 檢查 TypeScript 使用者看到的 contract | 不要擅自把 runtime 與 type 補成一致。 |
| official example | 觀察官方展示的主場景 | 不要用 example 反推所有能力。 |
| registry / install | 確認是否為 public component | 不要把 internal helper 誤當 public component。 |
| design takeaway | 抽出設計重點與可學習做法 | 不要只停留在 API 表格。 |

這條路線適合用在所有本章元件，但如果該組元件有明顯父子關係，就應該改成父子協作路線。

---

### 4.3 父子元件深讀路線：先拆清楚責任流向

如果該組元件有父子關係，閱讀順序應改成：

```txt
父元件 public contract
  -> 子元件 public contract
  -> provide / inject 或 slot relationship
  -> 父層狀態如何影響子層
  -> 子層事件如何回到父層
  -> class / style 如何分布在父子節點
```

適用於：

```txt
Row / Col
Grid / GridItem
Collapse / Panel
Layout / Sider
```

這類元件不能把子元件孤立起來看。以 `Row` / `Col` 為例，`Col` 的 gutter padding 並不是完全由自己決定，而是來自 `Row` 提供的 gutter context。以 `Collapse` / `Panel` 為例，`Panel` 是否 active 不是只看自己，而是要回到 `Collapse` 的 active key 狀態。

父子元件閱讀時可以固定回答四個問題：

1. 父層提供什麼？
2. 子層讀取什麼？
3. 子層如何通知父層？
4. 父層狀態如何再影響子層？

這四個問題可以幫助你把 `provide / inject`、slot child inspection、事件回傳、class/style 分布串成完整資料流。

---

### 4.4 Source 回查路線：依問題類型決定去哪裡查

當你不是完整閱讀，而只是想查某個行為時，不需要從頭讀完整組元件。這時可以依照問題類型快速定位。

| 問題 | 優先看 | 為什麼 |
| --- | --- | --- |
| props 是否存在 | `types/*.d.ts` 與對應 `.vue` 的 `props` | type 代表使用者看到的 contract，runtime 代表實際接收點，兩者都要確認。 |
| class 從哪裡來 | `.vue` 的 `computed classes` | runtime class 通常在 computed 中集中產生。 |
| class 有什麼效果 | `src/styles/common/layout.less`、`src/styles/mixins/layout.less` 或 `src/styles/components/*.less` | class 本身不代表效果，真正效果在 Less / CSS。 |
| inline style 如何計算 | `.vue` 的 `computed styles` 或 methods | 動態尺寸、位置、padding、flex 通常落在 inline style。 |
| 父子狀態如何傳遞 | `provide` / `inject`、slot child inspection、父層 methods | layout/container 常透過父子協作完成行為。 |
| 事件何時 emit | `.vue` 的 `emits`、methods、watch | 事件通常在 method、watch 或狀態切換後觸發。 |
| 是否 public export | `src/components/index.js`、`src/index.js`、`types/viewuiplus.components.d.ts` | 這決定元件是否屬於公開使用範圍。 |
| 官方怎麼用 | `examples/routers/*.vue` | examples 可以確認官方主推場景與常見組合方式。 |
| 是否有測試 | `test/unit/specs/` | tests 可作為行為證據，但沒有測試不代表行為不存在。 |

這張表是本篇最重要的回查工具。當你遇到某個疑問時，先分類問題，再決定 source，不要每次都從 `.vue` 第一行開始重讀。

---

### 4.5 各組元件檢查清單：用問題驗證理解程度

原始筆記列出的各組元件檢查問題，可以視為「讀完該組元件後的最低理解標準」。每一組檢查清單都對應一個不同的閱讀重點。

#### 4.5.1 `Row` / `Col`

`Row` / `Col` 的檢查重點是：你是否看懂 gutter、欄格 class、responsive props 與 Less mixin 的分工。

閱讀完成後應能回答：

1. `Row.gutter` 如何影響 `Row` margin 與 `Col` padding？
2. `Col` 如何透過 `inject` 取得 `RowInstance`？
3. `span`、`offset`、`push`、`pull`、`order` 如何變成 class？
4. `xs`、`sm`、`md`、`lg`、`xl`、`xxl` 的 number / object 寫法如何轉成 class？
5. `flex` prop 如何轉成 inline `flex`？
6. 24 欄樣式由哪些 Less mixin 產生？

如果這組問題答不出來，通常代表你只看了 `row.vue` / `col.vue`，但還沒有把 runtime class 與 Less source 串起來。

#### 4.5.2 `Layout` / `Header` / `Sider` / `Content` / `Footer`

`Layout` 這組元件的檢查重點是：你是否能區分薄 wrapper 與真正有狀態的 `Sider`。

閱讀完成後應能回答：

1. `Layout` 如何判斷是否包含 `Sider`？
2. `Header`、`Content`、`Footer` 是否只是薄 wrapper？
3. `Sider.modelValue`、`defaultCollapsed`、`collapsible` 如何共同決定收合狀態？
4. `breakpoint` 如何透過 `matchMedia` 影響 `mediaMatched`？
5. `collapsedWidth` 為 0 時 trigger 顯示有什麼特殊情況？
6. `on-collapse` 與 `update:modelValue` 分別何時觸發？

這組元件不要平均用力。`Header`、`Content`、`Footer` 主要確認 class 與 slot 結構；`Sider` 才是行為分析重點。

#### 4.5.3 `Card` / `Grid` / `GridItem`

這組檢查重點是：你是否能區分獨立內容容器與父子尺寸容器。

閱讀完成後應能回答：

1. `Card` 的 title、extra、icon、loading、padding 如何影響 template branch？
2. `Card` 的 shadow、border、dis-hover 類 props 如何映射到 class？
3. `Grid` 如何 provide 父層設定？
4. `GridItem` 如何依據 `Grid.col` 計算寬度？
5. `square` 與 resize detector 如何影響高度？
6. `grid.less` 中 border、hover、center 樣式如何依賴父層 class？

`Card` 的重點通常是 template branch 與視覺 props；`Grid` / `GridItem` 則要追蹤父層設定如何影響子層尺寸。

#### 4.5.4 `Collapse` / `Panel`

這組檢查重點是：你是否能看懂 active key 的正規化、父子狀態與事件回傳。

閱讀完成後應能回答：

1. `Collapse.modelValue` 可以接受哪些型別？
2. `getActiveKey()` 為什麼要把 active key 轉成 string array？
3. `accordion` 如何改變 toggle 結果？
4. `Panel` 的 name 來源是什麼？
5. `Panel` 如何判斷自己是否 active？
6. `update:modelValue` 與 `on-change` 的 payload 是否一致？

這組元件很適合用來練習 `v-model` 與父子 component state 的閱讀方式。重點不是只知道 panel 可以展開，而是要知道展開狀態如何被父層保存、轉換、回傳與同步。

#### 4.5.5 `Space` / `Split`

這組元件放在一起，但複雜度差異很大。`Space` 偏向 slot children 包裹與間距控制；`Split` 則偏向拖曳與布局計算。

閱讀完成後應能回答：

1. `Space` 如何包裹 slot children？
2. `Space.size` 的 number / string / array 寫法如何影響間距？
3. `Space.size` 的預設值是否可能來自 `$VIEWUI.space.size`？
4. `Space.split` 如何插入分隔內容？
5. `Split.mode` 如何決定 left/right 或 top/bottom slot？
6. `Split.modelValue` 的 number 與 px string 如何分別處理？
7. `Split.min` / `max` 如何限制拖曳結果？
8. `on-move-start`、`on-moving`、`on-move-end` 分別何時 emit？

如果你只想先建立低成本理解，可以先讀 `Space`；如果要練習高互動元件，就應該深入 `Split` 的 mouse event、offset 計算與 min/max 限制。

#### 4.5.6 `Affix`

`Affix` 的檢查重點是：你是否理解 fixed positioning 不是單純加上 `position: fixed`，還需要處理原始位置、寬高、scroll / resize 與事件通知。

閱讀完成後應能回答：

1. `offsetTop` 與 `offsetBottom` 如何決定 top / bottom 模式？
2. `handleScroll()` 如何判斷是否進入 fixed 狀態？
3. placeholder div 為什麼存在？
4. fixed 狀態下 inline style 包含哪些尺寸與位置？
5. `on-change` 何時 emit `true` 或 `false`？
6. `useCapture` 如何傳入 scroll / resize listener？

`Affix` 的 class 不一定多，但 DOM 計算很重要。讀這組元件時要特別注意尺寸與位置資料如何被取得、保存與更新。

#### 4.5.7 `FooterToolbar` / `GlobalFooter`

這組檢查重點是：你是否能區分框架提供的容器能力與 example 中的業務組裝習慣。

閱讀完成後應能回答：

1. `FooterToolbar` 的主要 slot 與右側操作區如何組裝？
2. `FooterToolbar` 如何透過 fixed positioning、左右浮動與 button spacing 形成操作區？
3. `GlobalFooter` 如何渲染 links？
4. link item 的 key、title、href、blankTarget 等資料如何進入 DOM？
5. copyright 如何作為內容區塊呈現？
6. examples 中這兩個元件主要被放在什麼業務場景？

這組元件不像 `Row` / `Col` 那樣是通用布局算法，也不像 `Split` / `Affix` 那樣有大量互動細節。它們更偏向業務頁面容器，因此要把 source 能力與 example 場景分開記錄。

---

### 4.6 仿作前檢查清單：確認自己不是只看懂表面

進入 `10-labs/` 前，至少確認：

1. 已能手寫 mini `Row` / `Col` 的 gutter 與 24 欄 class 映射。
2. 已能說明 mini `Layout` 如何處理 `has-sider`。
3. 已能實作 mini `Collapse` 的 active key 與 accordion。
4. 已能實作 mini `Split` 的拖曳事件與 min / max 限制。
5. 已能實作 mini `Affix` 的 scroll 判斷與 placeholder。
6. 已能把 runtime props、class、Less style、type declaration 分開記錄。

仿作練習的目標不是複製全部 View UI Plus 細節，而是驗證自己是否真的理解每組元件的核心資料流。

以 mini `Collapse` 為例，你不一定需要完整複製官方的所有 props，但至少應該能做出：

```txt
modelValue
  -> internal active keys
  -> panel isActive
  -> click panel header
  -> toggle active keys
  -> emit update:modelValue
```

以 mini `Affix` 為例，你也不一定需要處理所有邊界條件，但至少應該能做出：

```txt
scroll event
  -> calculate element position
  -> enter fixed state
  -> apply inline style
  -> render placeholder
  -> emit change
```

如果連 mini implementation 的主資料流都說不出來，代表前面的閱讀可能還停留在「看過 API」，但尚未真正吸收成自己的實作能力。

---

### 4.7 常見回查問題：從症狀反推 source

實務閱讀或仿作時，最常遇到的情況不是「我要完整讀一個元件」，而是「某個行為看起來怪怪的」。這時要學會從症狀反推 source。

| 問題 | 回查方向 | 可能代表的理解缺口 |
| --- | --- | --- |
| `Col` 寬度 class 看不到 CSS | 查 `src/styles/mixins/layout.less` 與 `src/styles/common/layout.less`。 | 只看 runtime，沒有對照 Less mixin。 |
| `Layout` 沒有 `has-sider` | 查 `Layout.findSider()` 與 slot child component name。 | 忽略 `Layout` 是透過 slot child inspection 判斷。 |
| `Sider` breakpoint 沒反應 | 查 `setMatchMedia()`、`dimensionMap`、mounted listener。 | 忽略 responsive 行為依賴 browser API 與生命週期註冊。 |
| `GridItem` square 高度不更新 | 查 `Grid` resize detector 與 `GridItem` 對父層 resize count 的依賴。 | 忽略父層 resize 狀態會影響子層尺寸。 |
| `Collapse` active key 對不上 | 查 name 是否被轉成 string，以及 accordion 是否限制只保留一個 key。 | 忽略 active key 正規化與 accordion 邏輯。 |
| `Split` 拖曳結果超出範圍 | 查 `computedMin`、`computedMax`、`getAnotherOffset()`。 | 忽略拖曳結果需要經過 min/max 邊界限制。 |
| `Affix` 固定後頁面跳動 | 查 placeholder slotStyle 是否補上原本寬高。 | 忽略 fixed 會使元素脫離 normal flow。 |
| footer 類元件樣式不符合預期 | 查 component Less 與 example 中的外層頁面結構。 | 忽略業務容器常依賴外層頁面布局。 |

這張表可以作為排查時的第一層索引。真正修正問題時，仍然要回到對應 source 檢查具體 props、computed、methods、style selector 與 example 組裝方式。

---

## 5. 表格整理

### 5.1 閱讀情境對照表

| 情境 | 主要問題 | 建議路線 | 輸出成果 |
| --- | --- | --- | --- |
| 第一次讀完整章 | 不知道本章有哪些元件與先後順序 | `00-overview/` → `01-grid-system/` → `10-labs/` | 建立章節地圖與元件難度順序。 |
| 深入分析單組元件 | 想看懂某組元件的完整設計 | overview → source map → public contract → runtime → style → types → examples | 產出單組元件教材筆記。 |
| 快速查 props / class / event | 只想確認某個 API 或行為 | 依問題類型查 `.vue`、Less、types、examples、tests | 產出精準回查結論。 |
| 準備仿作 | 想確認是否能自己實作核心行為 | 各組檢查清單 → mini implementation | 產出可驗證理解的小型實作。 |
| 排查異常行為 | 畫面或互動不符合預期 | 從症狀查對應 source | 找出 runtime、style 或 usage 層面的原因。 |

這張表的閱讀方式是：先判斷自己目前的學習任務，再選擇對應路線。不要把所有筆記都用同一種讀法處理，否則容易浪費時間在不必要的 source 細節上。

### 5.2 Source 類型與查核重點表

| Source 類型 | 主要用途 | 適合回答的問題 |
| --- | --- | --- |
| `.vue` runtime source | 看實際 props、emits、state、computed、methods、lifecycle | 元件如何把輸入轉成 DOM、class、style、event？ |
| `src/styles/**/*.less` | 看 class 背後的樣式效果 | runtime 產生的 class 到底有什麼 CSS 效果？ |
| `types/*.d.ts` | 看 TypeScript 使用者看到的 public contract | props / events 是否對外暴露？型別是否與 runtime 一致？ |
| `examples/routers/*.vue` | 看官方主推用法 | 官方希望使用者如何組合這些元件？ |
| `src/components/index.js`、`src/index.js` | 看元件是否 public export 與 install | 這個元件是否屬於公開元件？ |
| `test/unit/specs/` | 看是否有行為證據 | 某行為是否有測試覆蓋？ |

這張表要和前面的 source 回查路線一起使用。當你只查某個問題時，不要把所有 source 都重讀一遍，而是選擇最能回答問題的 source 類型。

### 5.3 各組元件閱讀重點總表

| 元件組 | 首要閱讀重點 | 容易漏掉的地方 |
| --- | --- | --- |
| `Row` / `Col` | gutter、欄格 class、responsive props、Less mixin | 24 欄 class 主要靠 Less mixin 承接。 |
| `Layout` / `Sider` | 頁面骨架、has-sider、收合、breakpoint | `Header` / `Content` / `Footer` 與 `Sider` 的複雜度差異很大。 |
| `Card` / `Grid` / `GridItem` | 內容容器、宮格父子尺寸、resize | `GridItem` 的尺寸會受父層設定與 resize count 影響。 |
| `Collapse` / `Panel` | active key、accordion、父子狀態同步 | active key 可能會被正規化為 string array。 |
| `Space` / `Split` | 子節點間距、拖曳分割、min/max | `Space` 與 `Split` 都是布局元件，但互動複雜度差很多。 |
| `Affix` | scroll / resize、fixed style、placeholder | fixed 後需要 placeholder 避免頁面跳動。 |
| `FooterToolbar` / `GlobalFooter` | 業務 footer 容器、links、操作區 | 要區分框架能力與 example 的頁面組裝習慣。 |

這張表適合在讀完整章後回頭複習。它不是取代各組元件筆記，而是提醒你每組元件最應該抓住的核心問題。

---

## 6. 範例或情境說明

### 6.1 情境一：你查不到 `Col` 的寬度 CSS

如果你在 `col.vue` 裡看到類似 `ivu-col-span-12` 的 class，但在 component source 中找不到真正的寬度規則，這不是 source 缺漏，而是你查錯層級。

正確回查路線是：

```txt
Col props / computed class
  -> 產生 ivu-col-span-* class
  -> 回查 src/styles/mixins/layout.less
  -> 回查 src/styles/common/layout.less
  -> 確認 24 欄與 responsive class 如何生成
```

這個情境說明：runtime source 只能告訴你 class 怎麼產生，不能單獨告訴你 class 有什麼效果。layout 元件尤其需要對照 Less。

### 6.2 情境二：你發現 `Collapse` 的 active key 對不上

如果使用 `Collapse` 時，傳入的 `modelValue` 和 `Panel` 的開合狀態對不上，優先不要只看 template，而應該查 active key 的正規化流程。

正確回查路線是：

```txt
Collapse.modelValue
  -> getActiveKey()
  -> currentValue
  -> Panel name
  -> Panel isActive
  -> accordion toggle
  -> update:modelValue / on-change
```

這個情境說明：父子狀態容器要從資料流讀，不要只從畫面結果倒推。

### 6.3 情境三：你準備仿作 `Split`

如果你要寫 mini `Split`，不要一開始就追求完整還原官方所有細節，而應先確認核心互動鏈路：

```txt
mousedown trigger
  -> isMoving = true
  -> document mousemove
  -> calculate new offset
  -> apply min / max
  -> emit on-moving
  -> document mouseup
  -> isMoving = false
  -> emit on-move-end
```

這個情境說明：仿作練習要先抓主資料流，再補邊界條件。否則容易被細節淹沒，反而看不出元件設計重點。

---

## 7. 閱讀路線或學習路線

本章建議用三輪閱讀法。

### 7.1 第一輪：建立地圖

第一輪只需要知道每個目錄在整章中的位置，不需要深挖所有 methods。

建議順序：

```txt
00-overview/
  -> 01-grid-system/
  -> 02-layout-shell/
  -> 03-content-containers/
  -> 04-collapsible-containers/
  -> 05-spacing-and-split/
  -> 06-positioning-containers/
  -> 07-page-footer-containers/
```

第一輪完成後，你應該能說出：

1. 本章包含哪些元件組。
2. 哪些元件是低互動結構型元件。
3. 哪些元件涉及父子狀態。
4. 哪些元件涉及 DOM measurement、scroll、resize 或 drag。
5. 哪些元件偏業務頁容器。

### 7.2 第二輪：深入 source 對照

第二輪開始用 `runtime / style / type / example / test` 的方式深讀。

建議順序：

```txt
單組元件 overview
  -> runtime source
  -> style source
  -> type declaration
  -> official example
  -> registry / install
  -> tests or behavior evidence
```

第二輪完成後，你應該能針對每組元件寫出：

1. public props / slots / events。
2. 主要 runtime data flow。
3. props 到 class / inline style 的映射。
4. style source 如何承接 class。
5. type declaration 是否與 runtime 一致。
6. example 展示哪些場景。
7. 是否有測試保護。

### 7.3 第三輪：仿作與回查

第三輪進入 `10-labs/`，用 mini implementation 驗證理解。

建議練習順序：

```txt
mini Row / Col
  -> mini Layout
  -> mini Collapse
  -> mini Split
  -> mini Affix
```

這個順序從靜態布局、slot 結構、父子狀態、拖曳互動，到 scroll / fixed 計算逐步加深。每個 mini implementation 都不必追求完整，但要能驗證核心資料流。

---

## 8. 常見誤區

| 誤區 | 為什麼容易誤解 | 正確理解 |
| --- | --- | --- |
| 只看 `.vue` 就以為讀完元件 | runtime source 最直觀，所以容易被當成全部 | layout/container 元件必須同時對照 Less、types、examples、registry 與 tests。 |
| 把 checklist 當成背誦題 | 清單形式看起來像考前整理 | checklist 是理解標準，目的是確認你能說出資料流與設計邊界。 |
| 一開始就讀高互動元件 | `Split`、`Affix` 看起來比較有趣 | 應先讀低互動 layout 元件建立 class/style 對照能力，再讀 drag、scroll、resize。 |
| 把子元件當成完全獨立 | 子元件有自己的檔案與 public name | `Col`、`GridItem`、`Panel` 等行為都依賴父層提供的 context 或狀態。 |
| 用 example 反推完整 API | examples 很容易閱讀 | example 只能證明官方展示過哪些場景，不能取代 runtime 與 type declaration。 |
| 看到沒有 test 就以為行為不存在 | tests 是明確證據 | 沒有測試只代表不能說「測試已保證」，不代表 source 沒有該行為。 |
| 仿作時想一次複製全部細節 | 原始碼很多，容易想完整搬運 | labs 的目的應是驗證核心資料流，而不是重寫完整 View UI Plus。 |

---

## 9. 本章總結

這篇筆記的核心價值，是把 `08-layout-and-containers/` 的閱讀方式從「看到哪裡讀到哪裡」改成「依情境選擇路線，依清單驗證理解」。

第一次閱讀時，應該先從 `00-overview/` 建立本章地圖，再依序進入 `Grid`、`Layout`、`Card`、`Collapse`、`Space / Split`、`Affix`、footer 類容器。這個順序刻意從低互動走向高互動，讓你先掌握 class、style、slot、container structure，再處理父子狀態、拖曳、scroll / resize 與 fixed positioning。

深入單組元件時，應該從 public contract 開始，再看 runtime source，接著對照 style source、type declaration、official examples、registry / install 與 tests。這樣可以避免只看 `.vue` 就下結論，也能避免把 `.d.ts` 或 example 誤當成實際行為。

當你只想回查某個問題時，不需要完整重讀元件，而應該依問題類型定位 source：props 查 types 與 runtime，class 查 computed 與 Less，事件查 emits / methods / watch，父子狀態查 provide / inject 或 slot child inspection，public export 查 registry / install，行為證據查 tests。

最後，仿作練習是檢驗理解的關鍵。能手寫 mini `Row` / `Col`、mini `Collapse`、mini `Split`、mini `Affix`，代表你已經不只是看懂筆記，而是能把 View UI Plus 的布局容器設計轉化成自己的實作能力。

---

## 10. 自我檢查問題

1. 為什麼第一次閱讀 `08-layout-and-containers/` 時，建議從低互動元件讀到高互動元件？
2. `00-overview/`、`08-style-system/`、`09-type-contracts/`、`10-labs/` 在整章中各自負責什麼？
3. 分析單組元件時，為什麼要先建立 public props / slots / events，而不是直接讀 methods？
4. 如果某個 class 在 `.vue` 中出現，但你找不到它的 CSS 效果，應該回查哪些 source？
5. 為什麼 `Row / Col`、`Grid / GridItem`、`Collapse / Panel` 不適合把子元件當成完全獨立的元件來讀？
6. `Collapse` 的 active key 為什麼需要特別檢查 string array 正規化？
7. `Split` 的仿作練習至少要掌握哪一條拖曳資料流？
8. `Affix` 的 placeholder div 解決了什麼 layout 問題？
9. official examples 可以證明什麼？又不能證明什麼？
10. 為什麼「沒有 unit test」不等於「source 沒有該行為」？
11. 進入 `10-labs/` 前，為什麼要能把 runtime props、class、Less style、type declaration 分開記錄？
12. 如果 footer 類元件樣式不符合預期，為什麼除了 component Less 之外，也要看 example 中的外層頁面結構？

---

## 11. 後續延伸方向

這篇筆記後續可以延伸成以下主題：

1. **`Row` / `Col` 閱讀路線專章**  
   專門分析 gutter、responsive props、24 欄 class 與 Less mixin 生成規則。

2. **`Layout` / `Sider` 閱讀路線專章**  
   專門分析 `has-sider`、slot child inspection、收合狀態、breakpoint 與 trigger。

3. **`Collapse` / `Panel` 父子狀態專章**  
   專門分析 `modelValue`、active key 正規化、accordion、panel name 與事件回傳。

4. **`Split` 拖曳互動專章**  
   專門分析 mouse event、offset 計算、min/max 限制、px / percent value 與 move events。

5. **`Affix` DOM 計算專章**  
   專門分析 scroll / resize listener、fixed style、placeholder、top / bottom 模式與 `on-change`。

6. **Layout and Containers Debug Cookbook**  
   把本篇的「常見回查問題」擴充成錯誤排查手冊，針對每種症狀補上 source 追蹤流程與修正方向。

7. **Layout and Containers Labs Roadmap**  
   將仿作前檢查清單擴充成 `10-labs/` 的練習順序、任務拆解與驗收標準。
