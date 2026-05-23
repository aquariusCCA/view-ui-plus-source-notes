# Basic Components：View UI Plus 基礎元件源碼閱讀地圖

## 1. 本章定位

本章是一份 View UI Plus 基礎元件的「源碼閱讀地圖」。它不是 API 手冊，也不是逐行註解，而是協助讀者第一次系統性閱讀 `07-basic-components/` 時，先建立完整框架。

`07-basic-components/` 收斂 View UI Plus 中最小、最常被其他元件或業務畫面組合使用的 UI 元件。這些元件通常不像 `Table`、`Form`、`Modal` 那樣牽涉大型資料流、複雜校驗或彈層生命週期，但它們會反覆出現在整個元件庫中，是理解 View UI Plus 元件設計風格的入口。

讀完本章後，讀者應該能理解三件事。

第一，基礎元件不是只看畫面長什麼樣子，而是要看 public props、computed class、slot 結構、事件輸出、shared utility、style source、type declaration、registry 與 install 如何共同形成元件契約。

第二，不同基礎元件的閱讀難度不同。`Icon`、`Divider` 適合建立閱讀方法；`Button`、`Tag`、`Badge` 適合觀察互動狀態；`Avatar`、`Cell` 則適合觀察內容 fallback、聚合元件與父子關係。

第三，README 只負責建立總覽與路線。每個元件的實際 props 表、事件表、slot 表、class 對照與型別差異，應回到對應子筆記與 `01-origin/source/view-ui-plus-v1.3.20/` 原始碼確認。

本章不主要處理大型容器、導航結構、表單輸入、資料展示、彈層回饋、業務元件或全域服務。這些主題會放在其他目錄中獨立整理。

---

## 2. 學習前先建立的基本觀念

### 2.1 基礎元件是元件庫的最小設計單位

在元件庫中，基礎元件通常同時扮演兩種角色。

第一種角色是「直接被業務頁面使用」。例如按鈕、標籤、角標、頭像、分隔線，都是業務畫面中常見的 UI 元素。這些元件看似簡單，但它們的 API 設計會直接影響使用者寫頁面的體驗。

第二種角色是「被其他高階元件組合使用」。例如 `Button` 可能出現在表單、彈窗、確認框與操作區；`Icon` 可能出現在導航、選單、提示與狀態展示；`Badge` 可能出現在通知、選單或頭像上。基礎元件雖然小，卻是整個元件庫一致性的來源。

因此，閱讀基礎元件時，不應只問「這個元件怎麼畫出來」，而要問：「它如何定義穩定的 public contract，讓其他元件與業務頁面可以放心組合？」

### 2.2 元件契約不是單一檔案決定的

很多初學者閱讀元件庫時，只打開 `.vue` 檔案，試圖從 template、props、computed、methods 中理解一切。但在元件庫中，單看 runtime source 通常不夠。

一個元件真正的設計，至少需要對照這幾類來源：

```txt
src/components/<component>/
src/styles/components/<component>.less
types/<component>.d.ts
examples/routers/<component>.vue
src/components/index.js
src/index.js
```

runtime source 告訴你元件實際如何接收 props、計算 class、渲染 slot、處理事件；style source 告訴你 class 名稱背後的視覺規則、尺寸規則、狀態樣式與主題色；type declaration 代表 TypeScript 使用者看到的 public contract；example 則用來驗證官方希望使用者怎麼用。

registry 與 install 檔案也很重要。某個檔案存在於 `src/components/`，不代表它一定是 public component。只有確認它進入 `src/components/index.js`、`types/viewuiplus.components.d.ts` 與 install 流程，才能判斷它是否屬於穩定對外表面。

### 2.3 props 是 public contract，不只是內部變數

在元件庫中，`props` 不是單純的資料入口，而是元件對外提供的使用契約。使用者不會關心元件內部如何計算 class，但會關心 `type`、`size`、`shape`、`loading`、`closable`、`checkable`、`count`、`dot`、`status`、`src`、`icon` 這類屬性是否穩定、可預期、容易理解。

因此閱讀基礎元件時，第一步通常不是直接看 methods，而是先看 public props。你要先建立一個問題：「這個元件希望使用者透過哪些 props 控制它？」接著再回頭看 runtime source 如何把 props 轉成 class、style、slot 結構或事件行為。

### 2.4 class 與 style 是元件狀態的視覺投影

元件狀態最後通常會反映到 class 或 inline style 上。例如尺寸、顏色、狀態、形狀、是否禁用、是否 loading、是否可關閉，最後都會進入樣式系統。

所以閱讀基礎元件時，不要把 computed class 當成瑣碎細節。它通常是元件設計的核心轉換層：

```txt
props / slot / global config
  -> computed class / computed style
  -> template / render output
  -> less style rules
```

如果只看 props，不看 class，你會不知道狀態如何被渲染。如果只看 `.less`，不看 runtime source，你會不知道哪些 class 是動態生成的。runtime 與 style 必須對照閱讀。

### 2.5 slot 代表內容擴充點，也代表元件邊界

基礎元件通常需要在「預設行為」與「可自訂內容」之間取得平衡。slot 的作用，是讓元件在維持外層結構與樣式一致的同時，允許使用者替換部分內容。

例如 `Divider` 透過 default slot 承載分隔線文字；`Badge` 透過 default slot 包裹被標記的內容，也透過 `count` / `text` slot 覆寫角標內容；`Avatar` 在沒有 `src` 與 icon 類輸入時才使用 default slot；`Cell` 則透過 slot 組合 icon、label、extra 與 arrow。

slot 不是附屬細節。它往往決定元件是固定展示元件，還是可被業務畫面深度組合的基礎元件。

---

## 3. 整體概覽

### 3.1 本區核心閱讀主線

閱讀 View UI Plus 基礎元件時，可以固定使用下列主線：

```txt
public props / slots / events
  -> runtime branch
  -> computed class / computed style
  -> template / render output
  -> shared mixin / utility
  -> style source
  -> type declaration
  -> example / test / consumer
  -> registry / install
```

這條主線的重點是：先理解元件對外提供什麼能力，再理解元件內部如何把這些能力轉成畫面結構、互動行為與樣式規則。

`public props / slots / events` 是入口，因為它決定使用者能控制什麼。`runtime branch` 與 `computed class / style` 是轉換層，負責把 props、slot、全域設定轉成實際輸出。`shared mixin / utility` 用來補上元件本身沒有直接宣告、但仍會進入 public contract 的能力。最後再用 style、type、example、registry 與 install 交叉驗證。

### 3.2 本區元件範圍

本區先收斂在 10 個 public component，閱讀時合併成 7 組。這樣安排的原因，是部分元件本來就不是獨立存在，而是和主元件形成父子、聚合或輔助關係。

| 分組 | 元件 | 定位 | 適合觀察的重點 |
| --- | --- | --- | --- |
| 操作元件 | `Button` / `ButtonGroup` | 最典型的互動基礎元件 | `type`、`size`、`shape`、`loading`、link 行為、Form disabled、group 樣式。 |
| 圖標元件 | `Icon` | 最小視覺原子 | class 命名、inline style、icon font / custom class 系統。 |
| 分隔元件 | `Divider` | 低互動的結構型元件 | default slot、方向、文字位置、虛線、plain 與 pseudo-elements。 |
| 標籤元件 | `Tag` | 小型狀態與互動元件 | `closable`、`checkable`、自定義顏色、內部 checked 狀態、事件輸出。 |
| 角標元件 | `Badge` | 小型數值 / 狀態展示元件 | `count`、`dot`、`status`、`color`、slot override、互斥 template branch。 |
| 頭像元件 | `Avatar` / `AvatarList` | 圖片、圖標、文字 fallback 與列表聚合 | 內容優先序、圖片錯誤、文字縮放、Tooltip、`max` 與 excess 顯示。 |
| 單元格元件 | `Cell` / `CellGroup` | 介於展示與列表行容器之間的邊界元件 | `CellItem` 內部結構、link branch、arrow、provide/inject、group click。 |

`ButtonGroup`、`AvatarList`、`CellGroup` 不建議孤立閱讀。它們的重點不是單一元件 props，而是父子關係、slot 包裹、聚合策略、樣式繼承與事件傳遞。

### 3.3 Source Baseline

本區以 View UI Plus `v1.3.20` 作為閱讀基準。固定版本很重要，因為元件庫會隨版本調整 props、樣式、型別宣告或 example 寫法。如果沒有指定版本，之後回看筆記時很容易出現筆記內容與目前原始碼對不上的問題。

| 項目 | 路徑 | 閱讀重點 |
| --- | --- | --- |
| Runtime components | `01-origin/source/view-ui-plus-v1.3.20/src/components/` | 元件實際 props、computed、methods、template / render、emit、slot。 |
| Component styles | `01-origin/source/view-ui-plus-v1.3.20/src/styles/components/` | BEM class、尺寸、狀態、主題色與結構樣式。 |
| Style mixins / common | `01-origin/source/view-ui-plus-v1.3.20/src/styles/mixins/`、`src/styles/common/` | button mixin、select item mixin、icon font 等共用樣式來源。 |
| Shared mixins | `01-origin/source/view-ui-plus-v1.3.20/src/mixins/` | link、form、global config 等跨元件邏輯。 |
| Type declarations | `01-origin/source/view-ui-plus-v1.3.20/types/` | 對外 TypeScript public contract，以及 runtime / type 是否一致。 |
| Component registry | `01-origin/source/view-ui-plus-v1.3.20/src/components/index.js` | 元件是否被 public export。 |
| Plugin install | `01-origin/source/view-ui-plus-v1.3.20/src/index.js` | 元件如何被全域註冊，以及 `$VIEWUI` 全域設定如何影響元件。 |
| Examples | `01-origin/source/view-ui-plus-v1.3.20/examples/routers/` | 使用方式、slot 寫法與互動案例。 |
| Unit tests | `01-origin/source/view-ui-plus-v1.3.20/test/unit/specs/` | 若存在測試，可用來確認核心行為是否被保護。 |

這張表不是單純的路徑索引，而是一個閱讀順序提示。一般來說，可以先看 `types/` 或 example 建立對外 API 印象，再回到 runtime source 看實作，最後對照 style source 驗證 class 與狀態樣式。

---

## 4. 核心內容逐步講解

### 4.1 用「元件契約」開始閱讀，而不是用 template 開始閱讀

閱讀基礎元件時，最常見的錯誤是打開 `.vue` 檔後立刻從 template 或 render 開始看。這樣做雖然能看到畫面結構，但很容易迷失在 class 名稱、條件判斷與 slot 分支中。

更好的方式是先建立元件契約。所謂元件契約，是指元件對外承諾使用者可以怎麼控制它、它會產生什麼效果、它會在什麼時機對外發出事件。

對每個元件，可以先問以下問題：

1. 這個元件有哪些 public props？
2. 哪些 props 是視覺控制，例如尺寸、顏色、形狀？
3. 哪些 props 是行為控制，例如 `loading`、`closable`、`checkable`？
4. 這個元件是否會 emit 事件？事件代表什麼使用者操作？
5. 這個元件是否支援 slot？slot 是主要內容，還是局部覆寫點？
6. 這個元件是否依賴全域設定、mixin、style mixin 或 shared utility？
7. type declaration 與 runtime props 是否完全一致？

當這些問題有初步答案後，再去看 template / render，就會知道每個條件分支背後的設計目的。

### 4.2 從低狀態元件建立閱讀方法：`Icon` 與 `Divider`

`Icon` 與 `Divider` 適合放在最前面閱讀，原因不是它們最重要，而是它們的狀態相對少，干擾因素少，適合拿來建立基本閱讀方法。

`Icon` 是最小視覺原子。`src/components/icon/icon.vue` 的主要任務，是把 `type`、`size`、`color`、`custom` 轉成 `<i>` 節點上的 class 與 inline style。真正的字形來源不是 component 本身，而是 `src/styles/common/iconfont/` 裡的 icon font 樣式。因此閱讀 `Icon` 時，要把它理解成「class 轉接器」：runtime 產生 `ivu-icon-*`，樣式系統負責讓 class 顯示成圖標。

`Divider` 是低互動的結構型元件。它接收 `type`、`orientation`、`dashed`、`plain`、`size`，並透過 default slot 決定是否渲染文字節點。真正的線條畫法需要回到 `src/styles/components/divider.less`：普通水平線、垂直線、虛線、帶文字分隔線與 pseudo-elements 都在 style source 中完成。

先讀這兩個元件，可以建立一套最小閱讀流程：

```txt
type declaration
  -> example
  -> runtime props / computed
  -> template / slot
  -> style source
  -> registry / install
```

這套流程建立後，再讀互動較多的元件，會比較不容易被細節淹沒。

### 4.3 再讀操作與狀態元件：`Button`、`Tag`、`Badge`

`Button`、`Tag`、`Badge` 開始出現比較多狀態與互動，是從「靜態展示元件」進入「可互動元件」的轉折點。

`Button` 是最典型的互動基礎元件。`button.vue` 決定 props、computed、render output 與 click 流程；`mixins/link.js` 補上 `to`、`replace`、`target`、`append` 與 navigation；`mixins/form.js` 讓 `Button` 可受到上層 `Form` disabled 狀態影響。`ButtonGroup` 的 runtime 很薄，主要只是輸出父層 class，真正的排列、邊框與圓角效果要回到 `button.less` 與 `styles/mixins/button.less`。

`Tag` 是小型狀態元件，適合觀察 `closable`、`checkable`、自定義顏色與事件輸出。它的重點是「一個看似簡單的標籤，如何同時支援展示、關閉、選取與自訂顏色」。自定義顏色不能只看 `.less`，因為部分顏色行為會走 runtime inline style；互動狀態也不能只看 props，因為 `Tag` 內部有 `isChecked` 與 watcher 同步。

`Badge` 是小型數值 / 狀態展示元件。它的 template branch 有明確優先序：`dot`、`status || color`、一般 count 不是彼此疊加，而是互斥分支。閱讀 `Badge` 時，要特別理解「被包裹內容」與「角標本體」的關係，以及 `count`、`text`、`count` slot、`text` slot、`showZero`、`overflowCount` 如何共同決定顯示內容。

這組元件的共同閱讀重點是：props 不再只影響外觀，也會影響互動流程、內部狀態與事件輸出。因此閱讀時應同時追蹤「狀態來源」、「畫面變化」與「事件回傳」。

### 4.4 最後讀組合與邊界元件：`Avatar`、`AvatarList`、`Cell`、`CellGroup`

`Avatar` 與 `Cell` 這組元件適合放在後面，因為它們不只是單一 UI 原子，而是開始涉及內容優先序、聚合邏輯與父子邊界。

`Avatar` 的重點是內容 fallback。`avatar.vue` 的內容 branch 以 `src`、`icon/customIcon`、default slot 為互斥優先序：只要有 `src`，就渲染圖片；沒有 `src` 但有 icon 類輸入，才渲染 `Icon`；前兩者都沒有時，才使用 default slot。除此之外，`Avatar` 還會處理圖片錯誤事件與 slot 文字縮放。

`AvatarList` 是聚合型元件。它不是單純顯示任意子節點，而是根據 `list` 主動產生子 `Avatar`，並依照 `tooltip` 與 `item.tip` 決定是否包裹 `Tooltip`。當 `extra` slot 存在時，會優先顯示 extra avatar；否則在 `list.length > max` 時顯示 excess avatar。

`Cell` 是邊界型基礎元件，介於基礎展示與列表行容器之間。`cell.vue` 接收 public props / slots，決定 link branch、arrow 與 click 行為；`cell-item.vue` 是內部展示結構，負責 icon、title、label、extra 的 DOM 組裝；`cell-group.vue` 透過 provide/inject 讓子 `Cell` 把 click 回報成 group 的 `on-click` 事件。`CellItem` 不應被視為 public component。

這一組元件的閱讀重點是「元件邊界」。你要觀察哪些責任放在主元件，哪些責任拆到 group 或 internal item，哪些行為透過 provide/inject 傳遞，哪些內容交給 slot。

### 4.5 對照 type declaration，確認真正的 public API

對元件庫而言，`types/<component>.d.ts` 不是附屬品，而是 TypeScript 使用者理解元件 API 的重要來源。

閱讀 `types/` 時，不只是看有哪些欄位，而是要把它和 runtime source 交叉驗證：

```txt
types/<component>.d.ts
  -> 使用者看得到的 props / events / slots 型別
src/components/<component>/
  -> runtime 實際接收與處理的 props
examples/routers/<component>.vue
  -> 官方展示的主要使用方式
```

這裡要特別注意：type declaration 不一定完全等於 runtime contract。子筆記中已經觀察到一些落差，例如 `Avatar` runtime 的 `size` 支援數字尺寸，但 `.d.ts` 只描述預設字串；`AvatarList` 的 `.d.ts` 與 runtime props 也有明顯差異。這類差異不能靠猜測修正，應在個別元件筆記中逐項標註來源。

### 4.6 對照 style source，理解狀態如何被視覺化

`src/styles/components/<component>.less` 是理解元件狀態的另一半。runtime source 會產生 class，但真正的視覺效果藏在 style source 中。

閱讀 style source 時，可以觀察幾個方向：

1. 元件根 class 是什麼。
2. 是否使用 BEM 或類 BEM 命名。
3. 尺寸、顏色、狀態、禁用、loading、active 等 class 如何命名。
4. group 類元件是否透過父層 class 影響子元件樣式。
5. 是否有主題變數、顏色變數或 style mixin。
6. 是否有 pseudo-elements、animation、absolute positioning 等 runtime 看不到的視覺邏輯。

不要把 `.less` 當成最後才看的附錄。對元件庫來說，runtime 與 style 共同定義元件行為：runtime 負責決定「現在是什麼狀態」，style 負責決定「這個狀態看起來如何」。

### 4.7 對照 registry 與 plugin install，確認元件是否進入 public surface

`src/components/index.js` 與 `src/index.js` 的閱讀目的，和單一元件 source 不一樣。

`src/components/index.js` 可以幫助你確認元件是否被 public export。某個檔案存在於 `src/components/` 不代表它一定是對外公開元件；有些可能只是內部輔助元件，例如 `CellItem`。

`src/index.js` 則用來理解 plugin install 流程。View UI Plus 會收集 components map，並在 install 時透過 `app.component(key, ViewUI[key])` 註冊。部分元件還可能有歷史 alias 或全域設定影響，例如 `Button` 有 `iButton` alias，`Cell` 會受到 `$VIEWUI.cell` 的 arrow 設定影響。具體影響範圍應回到對應子筆記與 source code 確認。

---

## 5. 表格整理

### 5.1 元件原始碼入口表

| 筆記分組 | Runtime source | Style source | Type source | Example | 補充來源 |
| --- | --- | --- | --- | --- | --- |
| `Icon` | `src/components/icon/icon.vue` | `src/styles/common/iconfont/` | `types/icon.d.ts` | `examples/routers/icon.vue` | `src/components/icon/index.js`、`src/styles/common/index.less` |
| `Divider` | `src/components/divider/divider.vue` | `src/styles/components/divider.less` | `types/divider.d.ts` | `examples/routers/divider.vue` | `src/components/divider/index.js` |
| `Button` / `ButtonGroup` | `src/components/button/button.vue`、`src/components/button/button-group.vue` | `src/styles/components/button.less`、`src/styles/mixins/button.less` | `types/button.d.ts` | `examples/routers/button.vue` | `src/components/button/index.js`、`src/components/button-group/index.js`、`src/mixins/link.js`、`src/mixins/form.js` |
| `Tag` | `src/components/tag/tag.vue` | `src/styles/components/tag.less` | `types/tag.d.ts` | `examples/routers/tag.vue` | `src/components/tag/index.js`、`src/components/tag-select/tag-select-option.vue` |
| `Badge` | `src/components/badge/badge.vue` | `src/styles/components/badge.less` | `types/badge.d.ts` | `examples/routers/badge.vue` | `src/components/badge/index.js` |
| `Avatar` / `AvatarList` | `src/components/avatar/avatar.vue`、`src/components/avatar-list/avatar-list.vue` | `src/styles/components/avatar.less`、`src/styles/components/avatar-list.less` | `types/avatar.d.ts`、`types/avatar-list.d.ts` | `examples/routers/avatar.vue`、`examples/routers/avatar-list.vue` | `src/components/avatar/index.js`、`src/components/avatar-list/index.js` |
| `Cell` / `CellGroup` | `src/components/cell/cell.vue`、`src/components/cell/cell-group.vue`、`src/components/cell/cell-item.vue` | `src/styles/components/cell.less`、`src/styles/mixins/select.less` | `types/cell.d.ts` | `examples/routers/cell.vue` | `src/components/cell/index.js`、`src/components/cell-group/index.js`、`src/mixins/link.js`、`src/mixins/globalConfig.js` |

這張表應作為每篇子筆記的起點。每閱讀一組元件，都不要只打開 runtime source，而是要同時打開 style、type 與 example。尤其是 `Button`、`Tag`、`Badge` 這類具有狀態與事件的元件，只看 `.vue` 很容易忽略 public API 與實際使用方式之間的關係。

### 5.2 元件閱讀重點表

| 元件組 | 主要問題 | 第一輪閱讀重點 | 第二輪深入重點 |
| --- | --- | --- | --- |
| `Icon` | 圖標如何被渲染與控制外觀？ | `type`、`size`、`color`、`custom` 如何轉成 class / style。 | icon font / custom class 系統如何接入。 |
| `Divider` | 分隔線如何承載 slot 與結構樣式？ | default slot、方向、class 組合。 | 不同方向、文字位置、虛線、plain 的樣式規則。 |
| `Button` / `ButtonGroup` | 操作元件如何整合視覺狀態與互動？ | `type`、`size`、`shape`、`loading`、click、link branch。 | link / form mixin、group 對子按鈕樣式的影響。 |
| `Tag` | 小型狀態元件如何支援關閉、選取與顏色？ | `closable`、`checkable`、`color`、事件。 | 內部 `isChecked`、自定義色、`TagSelectOption` 控制邊界。 |
| `Badge` | 角標如何附著在內容上展示數值或狀態？ | `count`、`dot`、`status`、`color`、slot override。 | template branch 優先序、數值格式、status inline layout。 |
| `Avatar` / `AvatarList` | 頭像如何處理圖片、圖標、文字與列表聚合？ | `src`、`icon/customIcon`、default slot、`list`、`max`。 | 圖片失敗處理、文字縮放、Tooltip、extra / excess 優先序。 |
| `Cell` / `CellGroup` | 列表行容器如何拆分結構並傳遞事件？ | `Cell`、`CellItem`、`CellGroup` 分工。 | provide/inject、點擊事件、link branch、arrow 全域設定。 |

這張表的用途，是幫助你在閱讀時避免平均用力。不同元件要觀察的問題不同：讀 `Icon` 時不需要期待複雜狀態管理；讀 `Cell` 時則不能只看單一檔案，必須把 group、internal item、事件傳遞一起看。

### 5.3 來源檔案角色表

| 檔案類型 | 位置 | 負責職責 | 閱讀重點 |
| --- | --- | --- | --- |
| Runtime source | `src/components/<component>/` | 定義元件實際行為 | props、computed、methods、template / render、emit、slot。 |
| Component entry | `src/components/<component>/index.js` | 單元件出口 | 這個目錄如何把 runtime component 對外匯出。 |
| Component registry | `src/components/index.js` | 統一輸出 public components | 元件是否被 public export，內部元件是否未被匯出。 |
| Plugin install | `src/index.js` | 安裝與全域註冊 | 全域註冊流程、alias、`$VIEWUI` 設定影響。 |
| Style source | `src/styles/components/<component>.less` | 定義元件視覺規格 | BEM class、尺寸、狀態、主題色、結構樣式。 |
| Style mixin / common | `src/styles/mixins/`、`src/styles/common/` | 提供共用樣式能力 | button group、select item、icon font 等共用規則。 |
| Shared mixin | `src/mixins/` | 提供跨元件 runtime 能力 | link、form、global config 是否進入元件 public contract。 |
| Type declaration | `types/<component>.d.ts` | 定義對外 TypeScript 契約 | props 型別、事件型別、slot 型別，以及與 runtime 的落差。 |
| Examples | `examples/routers/<component>.vue` | 展示官方使用方式 | 常見 props、slot 寫法、互動案例。 |
| Tests | `test/unit/specs/*.spec.js` | 驗證核心行為 | 哪些行為被測試保護，哪些沒有測試覆蓋。 |

---

## 6. 範例或情境說明

### 6.1 閱讀 `Button` 的建議流程

假設你要開始閱讀 `Button`，不要一開始就鑽進所有 render 條件分支。可以按照以下流程進行。

第一步，先看 `types/button.d.ts`，建立使用者可以傳入哪些 props 的印象。這裡不只要看 `Button` 自己的 props，也要注意 `ButtonGroup` 是否在同一份型別中出現。

第二步，再看 `examples/routers/button.vue`，觀察官方如何展示 `Button`。這一步能幫助你判斷哪些 props 是主要使用場景，哪些只是補充功能。

第三步，回到 `src/components/button/button.vue`，追蹤 props 如何被轉成 class、tag、slot 與事件。這時要特別注意 `loading` 狀態、click handler、link branch 與 Form disabled。

第四步，補讀 `src/mixins/link.js` 與 `src/mixins/form.js`。`Button` 的 public contract 不只來自 `button.vue`，mixin 也會把可傳入 props 與行為帶進元件。

第五步，閱讀 `src/components/button/button-group.vue`、`src/styles/components/button.less` 與 `src/styles/mixins/button.less`。`ButtonGroup` 不應孤立閱讀，因為它的主要效果在父層 class 與 less selector。

最後，回到自己的筆記中整理一張對照表，把 public props、runtime 行為、class 對應、事件輸出與 example 寫法對齊。這樣才能形成可複習的元件閱讀筆記。

### 6.2 閱讀 `Badge` 時先抓 template branch

`Badge` 很適合用來練習「props 優先序」閱讀。它看起來有很多展示模式，但 runtime 其實先把畫面拆成三個互斥分支：

```txt
dot
  -> 顯示 dot badge
else if status || color
  -> 顯示 inline status badge
else
  -> 顯示一般 count badge
```

這個分支順序很重要。只要 `dot` 為 true，就不會進入 `status` 或 count 模式；只要 `status` 或 `color` 有值，就不會進入一般數字角標。理解這一點後，再讀 `finalCount`、`hasCount`、`showZero`、`overflowCount`、`count` slot 與 `text` slot，才不會把所有 props 當成可同時疊加。

### 6.3 閱讀 `Cell` 時先分清 public 與 internal

`Cell` 不適合只看單一檔案，它包含 `cell.vue`、`cell-group.vue` 與 `cell-item.vue`。

閱讀時應先弄清楚三者分工：

```txt
CellGroup
  -> public component
  -> wrapper + provide + on-click emit

Cell
  -> public component
  -> props / slots / link branch / arrow / click

CellItem
  -> internal component
  -> icon / title / label / extra DOM 結構
```

接著觀察 provide/inject。`CellGroup` 透過 provide/inject 接收子項 click，這代表它不是單純樣式容器，而承擔父子溝通責任。閱讀時要追蹤：誰 provide？誰 inject？子項 click 後如何回到 group？group 是否再向外 emit？這些問題會幫助你理解 Vue 元件庫中父子協作的常見模式。

---

## 7. 閱讀路線或學習路線

### 7.1 初次閱讀路線

初次閱讀本區時，建議採用「由低狀態到高組合」的順序。

第一階段先讀 `Icon` 與 `Divider`。這一階段的目的，是建立基礎元件閱讀方法。你要熟悉如何從 props 看到 computed class，如何從 slot 看到 template 結構，如何從 style source 驗證畫面規則。

第二階段讀 `Button` / `ButtonGroup`、`Tag`、`Badge`。這一階段的目的，是理解基礎元件如何處理互動狀態。你要開始追蹤事件、狀態切換、loading、closable、checkable、dot、status 與 slot override 等行為。

第三階段讀 `Avatar` / `AvatarList`、`Cell` / `CellGroup`。這一階段的目的，是理解元件組合與邊界設計。你要觀察 fallback、列表聚合、父子元件、provide/inject、事件傳遞與 group 對子元件的影響。

### 7.2 深入閱讀路線

當第一輪閱讀完成後，可以進入第二輪深入閱讀。第二輪不再只是理解每個元件做什麼，而是比較不同元件之間的設計一致性。

第一，可以比較 `Button`、`Tag`、`Badge` 的狀態 class 命名方式是否一致。這能幫助你理解 View UI Plus 在狀態樣式上的設計風格。

第二，可以比較 `ButtonGroup`、`AvatarList`、`CellGroup` 的 group / list / parent 設計。這三者都不是單純主元件本身，但它們的父子協作方式不同。

第三，可以比較 runtime props 與 `types/*.d.ts` 是否一致。這對元件庫維護很重要，因為型別宣告如果落後於 runtime source，使用者會在 TypeScript 中得到錯誤或不完整的提示。

第四，可以比較 examples 中展示的 API 與 source code 中支援的 API。這能幫助你判斷哪些能力是主要推薦用法，哪些只是相容或補充功能。

### 7.3 可以暫時跳過的部分

初次閱讀時，可以先暫時跳過過細的樣式變數、所有瀏覽器相容細節、完整 icon 清單、完整 CSS animation 參數，以及和大型元件高度耦合的案例。這些內容不是不重要，而是它們會讓初學者在還沒建立元件閱讀主線前，就陷入過多細節。

比較好的策略是先建立「public contract -> runtime branch -> class / style 對照 -> type 對照 -> example 驗證 -> public surface」這條主線。等主線穩定後，再回頭補細節。

---

## 8. 常見誤區

| 誤區 | 為什麼容易誤解 | 正確理解 |
| --- | --- | --- |
| 只看 `.vue` 檔就認為讀完元件 | runtime source 最直觀，所以容易忽略 style、type 與 example | 元件庫的完整設計必須同時看 runtime、style、type、registry、install、example，必要時還要看 tests 與 consumers。 |
| 把基礎元件當成很簡單，不需要深讀 | `Icon`、`Divider`、`Tag` 等元件畫面上很小 | 基礎元件是元件庫一致性的來源，props、class、slot、event 設計都值得研究。 |
| 把 `ButtonGroup`、`AvatarList`、`CellGroup` 拆開孤立閱讀 | group / list 元件看似只是容器 | 這些元件的價值在於父子關係、資料聚合、slot 包裹、樣式繼承或事件傳遞，應與主元件一起讀。 |
| 只背路徑，不理解檔案角色 | README 中有大量路徑表，容易變成查表 | 路徑表應服務於閱讀流程：先建立 API，再看 runtime，接著對照 style、type、example 與 public surface。 |
| 看到 props 就直接記 API | props 很容易被當成速查表 | props 是 public contract，要理解它如何影響 class、style、slot、事件與外部使用方式。 |
| 忽略 type declaration | JavaScript runtime 看起來已經足夠 | 元件庫面向 TypeScript 使用者時，`types/*.d.ts` 是 public API 的重要一部分，但仍要和 runtime 交叉驗證。 |
| 忽略 example | source code 看起來比 example 更底層 | example 能反映官方希望使用者怎麼使用元件，是理解主要場景的重要入口。 |
| 以為 `.d.ts` 一定完全正確 | 型別宣告看起來像正式契約 | 本區已有元件出現 runtime 與 type 落差，應逐項標註來源，不要只相信其中一邊。 |
| 在沒有 source code 的情況下推測細節 | 元件庫模式常見，容易根據經驗腦補 | 未提供或未查證的實作細節只能標註「需要後續補充」，不能假裝已確認。 |

---

## 9. 本章總結

`07-basic-components/` 的價值，不只是整理 View UI Plus 的幾個小元件，而是提供一個理解元件庫設計風格的入口。基礎元件雖然畫面上不一定複雜，但它們集中呈現了元件庫最重要的設計能力：public props 如何設計、class 與 style 如何計算、slot 如何提供彈性、event 如何向外溝通、mixin 與 shared utility 如何復用、style source 與 type declaration 如何共同定義元件契約。

本區應採用由淺入深的閱讀順序。先從 `Icon`、`Divider` 這類低狀態元件建立基本閱讀方法，再進入 `Button`、`Tag`、`Badge` 這類具有操作與狀態的元件，最後閱讀 `Avatar`、`Cell` 這類具有 fallback、聚合與父子關係的元件。

閱讀時要避免只把 README 當成路徑索引。真正有效的源碼閱讀，是把每個元件放回元件庫整體設計中理解：它對外提供什麼 API，它內部如何轉換狀態，它的樣式如何命名，它的型別如何描述，它的 example 如何示範，以及它是否被 registry 與 plugin install 納入 public surface。

這樣整理後，`07-basic-components/README.md` 就不只是「有哪些元件可以讀」，而是一份能引導後續每篇元件筆記的閱讀地圖。

---

## 10. 自我檢查問題

1. 為什麼閱讀 View UI Plus 基礎元件時，不應只看 `src/components/<component>/`，還要對照 style、type、example、registry 與 install？
2. `public props / slots / events -> runtime branch -> computed class / style -> template / render output -> shared mixin / utility -> style source -> type declaration` 這條主線中，每一步各自負責什麼？
3. 為什麼建議先讀 `Icon` 與 `Divider`，再讀 `Button`、`Tag`、`Badge`？
4. `ButtonGroup`、`AvatarList`、`CellGroup` 為什麼不建議單獨孤立閱讀？
5. 對一個基礎元件來說，`types/<component>.d.ts` 的價值是什麼？它和 runtime source 有什麼關係？
6. 閱讀 `Button` 時，為什麼需要補看 `mixins/link.js` 與 `mixins/form.js`？
7. 閱讀 `Badge` 時，為什麼要先理解 `dot`、`status || color`、一般 count 的 template branch 優先序？
8. 閱讀 `Cell` / `CellGroup` 時，provide/inject 代表什麼樣的父子溝通模式？
9. 如果 example 中展示的 API 與 type declaration 中看到的 API 不一致，你會如何進一步確認？
10. 在沒有實際 source code 或尚未查證的情況下，哪些內容可以合理說明，哪些內容必須標註「需要後續補充」？

---

## 11. 後續延伸方向

這份 README 是 `07-basic-components/` 的總覽筆記。後續閱讀可以分成「元件個別閱讀」與「橫向主題整理」兩條線。

### 11.1 元件個別閱讀筆記

本目錄已經拆出多組子筆記，可以作為下一步閱讀入口：

1. `07-basic-components/01-icon/`：聚焦 class、inline style、icon font / custom class 系統。
2. `07-basic-components/02-divider/`：聚焦 slot、方向、文字位置、虛線與結構樣式。
3. `07-basic-components/03-button-and-button-group/`：聚焦 props contract、loading、link 行為、Form disabled、事件與 group 樣式。
4. `07-basic-components/04-tag/`：聚焦 `closable`、`checkable`、`color`、事件與狀態控制。
5. `07-basic-components/05-badge/`：聚焦 `count`、`dot`、`status`、slot override 與角標定位。
6. `07-basic-components/06-avatar-and-avatar-list/`：聚焦 fallback、文字縮放、列表聚合與 Tooltip 關係。
7. `07-basic-components/07-cell-and-cell-group/`：聚焦 `CellItem`、provide/inject、點擊事件、link branch 與 arrow。
8. `07-basic-components/08-cross-cutting-topics/`：聚焦全域設定、global size、transfer 與 cell arrow 等橫向議題。

### 11.2 橫向主題筆記

除了逐一閱讀元件，也可以整理橫向主題：

1. View UI Plus 基礎元件的 props 設計模式。
2. View UI Plus 的 class 命名與 BEM 風格整理。
3. View UI Plus 的 slot 設計模式。
4. View UI Plus 元件事件 emit 設計整理。
5. View UI Plus type declaration 與 runtime props 對照筆記。
6. View UI Plus group 類元件設計：`ButtonGroup`、`AvatarList`、`CellGroup` 比較。
7. View UI Plus link/navigation mixin 使用位置與設計分析。
8. View UI Plus `$VIEWUI` 全域設定如何影響基礎元件。

### 11.3 待補充清單

以下內容應放在個別子筆記或橫向主題筆記中逐步補齊，不建議全部塞回 README。

| 待補充項目 | 需要對照的檔案 | 補充目的 |
| --- | --- | --- |
| 每個元件完整 props 表 | `types/*.d.ts`、`src/components/*/*.vue`、相關 mixin | 確認 public API 與 runtime props 是否一致。 |
| 每個元件完整事件表 | `src/components/*/*.vue`、`examples/routers/*.vue`、tests | 確認事件名稱、觸發時機與 payload。 |
| 每個元件 slot 表 | `src/components/*/*.vue`、`types/*.d.ts`、`examples/routers/*.vue` | 確認 default slot 與 named slot 支援情況。 |
| class 命名與樣式狀態表 | `src/styles/components/*.less`、`src/styles/mixins/*.less` | 建立 props 到 class / style 的對照。 |
| shared utility / mixin 表 | `src/mixins/*.js`、使用該 mixin 的 component | 確認 `Button`、`Cell` 等元件如何復用 link、form 或 global config 行為。 |
| `$VIEWUI` 影響範圍 | `src/index.js`、`src/mixins/globalConfig.js`、各元件 runtime source | 確認全域設定如何影響基礎元件。 |
| type 與 runtime 落差表 | `types/*.d.ts`、runtime source、examples | 標註型別宣告不完整或與 runtime 不一致的位置。 |
