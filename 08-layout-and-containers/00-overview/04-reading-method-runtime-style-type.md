# Layout and Containers runtime / style / type 對照方法

## 0. 原始筆記問題分析

這份原始筆記屬於「原始碼閱讀方法筆記」，同時帶有「架構分析筆記」的性質。它不是在解釋某一個單一元件，而是在定義閱讀 `08-layout-and-containers/` 章節時應該採用的固定方法：如何把 runtime source、style source、type declaration、examples、registry 與 tests 放在同一張查核地圖中理解。

原始筆記已經有很清楚的主軸，也已列出建議閱讀順序、父子關係、class / inline style 對照、style source、type declaration、examples 與 registry / test 的檢查點。不過若要作為長期學習筆記，仍有幾個地方可以補強：

1. **目前比較像閱讀清單，尚未完全說明每一步背後的判斷理由**  
   原始筆記列出了 `public surface -> runtime source -> style source -> type declaration -> example` 的順序，但還可以補充「為什麼不能跳步」、「每一步應該產生什麼結論」。

2. **runtime、style、type 三者的責任邊界可以再講清楚**  
   初學者容易把 `.vue` source 當成完整答案，或把 `.d.ts` 當成實際行為。這篇筆記應強調：runtime 回答行為，style 回答視覺規則，type 回答 TypeScript 使用者可見的 public contract。

3. **父子關係與 DOM 依賴應該被提升為閱讀主線**  
   Layout/container 元件常常不是「單一元件自己完成所有事」，而是透過 `provide / inject`、slot child inspection、resize、scroll、document mouse events 共同完成布局行為。這些關係應被視為閱讀重點，而不是補充細節。

4. **需要補上可重複使用的閱讀產出模板**  
   這篇筆記不只要告訴讀者「看哪些檔案」，還應該幫讀者建立產出格式，例如 props 對 class / style 映射表、父子關係表、style 對照表、type 差異表、example 覆蓋情境表。

5. **需要避免把 examples 與 tests 解讀過度**  
   examples 可以證明官方展示的使用方式，但不能反推完整 API。tests 可以證明某些行為有測試保護，但沒有 test 不代表行為不存在。這種證據層級需要在筆記中明確寫出。

因此，重構後的筆記會將原始內容整理成一套可重複套用的「runtime / style / type 三方對照閱讀法」，作為後續閱讀 `Row / Col`、`Layout / Sider`、`Card / Grid`、`Collapse / Panel`、`Space / Split`、`Affix`、`FooterToolbar / GlobalFooter` 的通用方法。

---

## 1. 本章定位

這篇筆記放在：

```txt
08-layout-and-containers/00-overview/
```

它的定位是 `08-layout-and-containers/` 章節的「閱讀方法總覽」。本篇不負責深入分析某一個元件的每一行 source，而是提供後續閱讀所有 layout/container 元件時都可以套用的查核流程。

本章要解決的核心問題是：

> 當一個 View UI Plus 元件的行為分散在 `.vue`、`index.js`、Less、`.d.ts`、examples、registry 與 tests 中時，應該如何有順序地閱讀，才能避免誤判元件的 public API、runtime 行為、樣式來源與型別契約？

讀完本篇後，讀者應該能夠理解：

1. 為什麼 layout/container 元件不能只看 `.vue` source。
2. 為什麼需要同時對照 runtime、style 與 type declaration。
3. 如何先建立 public surface，再進入 runtime 實作。
4. 如何追蹤父子關係、computed class、inline style、DOM listener、resize 與 scroll dependency。
5. 如何使用 official examples 與 tests 作為行為證據，但不過度解讀。
6. 如何將閱讀結果整理成後續單一元件筆記。

本篇不主要處理以下內容：

| 不處理的內容 | 原因 |
| --- | --- |
| 單一元件完整 source walkthrough | 會留到各元件章節，例如 `01-grid-system/`、`02-layout-shell/`。 |
| View UI Plus 全部元件的通用閱讀法 | 本篇聚焦 layout/container 類元件，不涵蓋表單、彈層、資料展示等完整差異。 |
| 完整 Less 變數系統 | 本篇只說明如何對照 style source，變數與主題系統可另外拆成獨立筆記。 |
| 完整測試框架分析 | 本篇只說明 tests 如何作為行為證據，不展開測試工具鏈。 |

---

## 2. 學習前先建立的基本觀念

在閱讀 View UI Plus 的 layout/container 元件前，需要先建立幾個基本觀念。這些觀念會影響你如何判斷一個元件到底「做了什麼」。

### 2.1 runtime source：元件實際執行的邏輯

runtime source 通常是 `.vue` 檔案。它回答的是：

- 元件有哪些 props。
- 內部有哪些 state。
- 是否透過 `provide / inject` 建立父子關係。
- 是否使用 `computed` 產生 class 或 inline style。
- 是否監聽 scroll、resize、mousemove、mouseup 等 DOM event。
- 是否在生命週期中註冊或清理資源。
- 什麼時候 emit event。

換句話說，runtime source 主要回答「元件如何把使用者輸入轉成實際 DOM、狀態與事件」。

但是，runtime source 不是完整答案。因為 `.vue` 中產生的 class 通常要回到 Less 才能知道真正的視覺效果。例如 `Col` 可能產生 `ivu-col-span-12`，但這個 class 的寬度規則不是寫在 `col.vue` 裡，而是由 Less mixin 產生。

### 2.2 style source：class 背後的視覺規則

style source 包含 component style、common style 與 mixin style。它回答的是：

- runtime 產生的 class 是否有樣式承接。
- 哪些 class 是 Less mixin 批量生成的。
- layout、spacing、border、hover、fixed positioning 等視覺效果在哪裡定義。
- 某些父子 class 結構如何共同影響樣式。

對 layout/container 元件而言，style source 特別重要，因為這類元件常常把「結構與狀態」放在 runtime，把「實際布局效果」放在 Less。

例如：

```txt
Col runtime 產生 ivu-col-span-12
  -> Less mixin 產生 .ivu-col-span-12 的 width 規則
  -> 瀏覽器最後看到的是 50% 欄寬
```

如果只看 runtime，你只能知道 class 名稱；如果只看 style，你不知道 class 何時被產生。兩者必須對照。

### 2.3 type declaration：TypeScript 使用者看到的契約

type declaration 通常在 `types/*.d.ts`。它回答的是：

- 使用者在 TypeScript 中能看到哪些 props。
- 元件的型別是否被匯出。
- global component declaration 是否包含該元件。
- public contract 是否與 runtime props / emits 一致。

但 type declaration 不等於 runtime 行為。它是「對 TypeScript 使用者宣告的契約」，不是實作本身。

因此閱讀時要做雙向檢查：

```txt
types 有宣告，runtime 是否真的支援？
runtime 有支援，types 是否也有宣告？
```

如果兩者不一致，筆記中應該記錄差異，而不是擅自把它們補成一致。

### 2.4 examples：官方展示的使用方式

examples 不是完整 API 文件，也不是完整測試。它主要回答：

- 官方希望使用者如何使用這個元件。
- 哪些場景是主要展示場景。
- 哪些進階功能被官方展示過。
- 哪些 runtime branch 只是 source 支援，但 examples 沒有展示。

因此 examples 是「使用方式證據」，不是「完整能力定義」。

### 2.5 registry、install 與 tests：public export 與行為證據

最後還需要檢查：

```txt
src/components/index.js
src/index.js
types/viewuiplus.components.d.ts
test/unit/specs/
```

這些來源分別回答：

| 來源 | 主要回答的問題 |
| --- | --- |
| `src/components/index.js` | 元件是否進入元件集合匯出。 |
| `src/index.js` | 全量安裝時是否會註冊該元件。 |
| `types/viewuiplus.components.d.ts` | TypeScript global component 是否可見。 |
| `test/unit/specs/` | 某些行為是否有 unit test 直接保護。 |

這些來源不是一開始就讀，而是用來做最後確認。因為你必須先知道元件做什麼，才能判斷 registry、type global declaration 與 tests 是否覆蓋正確。

---

## 3. 整體概覽

本章的閱讀方法可以濃縮成一句話：

> 先看使用者能接觸到的 public surface，再看 runtime 如何實作，接著用 style、type、example、registry 與 tests 交叉驗證。

完整流程如下：

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

這個順序背後有三個理由。

第一，先看 public surface，可以避免一開始就被實作細節帶偏。元件最終是提供給使用者使用的，所以要先確認使用者能傳什麼、放什麼、監聽什麼、用什麼 component name。

第二，再看 runtime source，可以確認 public input 如何轉成內部狀態、DOM 結構、class、inline style 與事件。這是理解實際行為的核心。

第三，最後對照 style、type、example、registry 與 tests，可以避免單一來源造成誤判。例如 `.vue` 有某個 prop，但 `.d.ts` 沒有宣告，代表 TypeScript 使用者可能無法正常看到；或者 example 沒展示某個 branch，代表它可能不是官方主推用法。

可以把整個方法理解成三層：

```txt
第一層：public contract
  props / slots / events / v-model / public export

第二層：runtime implementation
  data / computed / watch / provide / inject / lifecycle / methods / DOM dependency

第三層：cross-check evidence
  Less / types / examples / registry / install / tests
```

後續每一篇元件筆記，都可以按照這三層整理。

---

## 4. 核心內容逐步講解

### 4.1 為什麼本章需要固定閱讀方法

layout/container 元件的特殊性在於：它們通常不是在處理複雜資料模型，而是在決定「內容如何被放進頁面結構中」。

這類元件的行為常常分散在多個地方：

```txt
component .vue
  -> entry index.js
  -> Less component style
  -> Less common style / mixin
  -> type declaration
  -> example
  -> registry / install
  -> DOM utility or external dependency
```

如果只看 `.vue`，你可能會漏掉 class 背後的樣式規則。例如 `Row` / `Col` 的欄寬不是單靠 Vue component 完成，而是需要 Less 產生的 grid class。

如果只看 Less，你會知道有哪些樣式，但不知道哪些 class 是 runtime 會產生的、哪些只是預先準備的樣式。

如果只看 types，你會知道 TypeScript 使用者能看到什麼，但不一定知道 runtime 是否真的用相同方式消費 props。

因此，本章固定採用「runtime / style / type 三方對照」的閱讀方式。這不是為了增加閱讀成本，而是為了降低誤判風險。

---

### 4.2 Step 1：先建立 public surface

進入元件 source 前，第一件事不是讀 methods，而是建立 public surface。

public surface 指的是「使用者能直接接觸到的元件外觀」。它至少包含：

| 項目 | 要回答的問題 |
| --- | --- |
| props | 使用者可以控制哪些視覺、結構或行為？ |
| slots | 哪些內容由使用者提供？slot 是主要內容還是局部覆寫點？ |
| events | 元件在什麼時候對外通知？事件值代表什麼？ |
| v-model | 是否使用 `modelValue` / `update:modelValue`？內部是否另有 current state？ |
| public export | 元件是否進入 `src/components/index.js` 與 install 流程？ |

這一步的價值是建立「問題意識」。例如閱讀 `Collapse` 時，入口問題不應只是「template 長什麼樣子」，而應該先問：

```txt
accordion 如何改變 active key？
modelValue 是 string 還是 array？
Panel 的 name 如何對應父層 active key？
on-change 與 update:modelValue 的差異是什麼？
```

這些問題會引導你後續看 runtime 時知道要找什麼。如果沒有先建立 public surface，很容易一開始就陷入 template 或 methods 的局部細節，最後反而不知道元件對外提供了什麼能力。

---

### 4.3 Step 2：閱讀 runtime source

runtime source 主要回答：

> 元件如何把 public input 轉成實際 DOM、狀態、class、inline style 與事件？

閱讀 `.vue` 時，建議按照以下順序：

1. `name`：確認 component name，尤其是 `Layout` 會用 child 的 component name 判斷是否存在 `Sider`。
2. `props`：記錄 props 的 default、validator、type。
3. `emits`：記錄事件名稱與事件資料。
4. `provide / inject`：確認父子關係。
5. `data`：找內部狀態，例如 `Collapse.currentValue`、`Split.isMoving`、`Affix.affix`。
6. `computed`：追蹤 class、inline style 與 derived state。
7. `watch`：追蹤 controlled / uncontrolled 邊界。
8. `mounted / beforeUnmount`：確認 DOM listener、resize observer、清理流程。
9. `methods`：在前面資訊建立後，再讀核心行為。

這個順序的重點是「先建立骨架，再讀行為」。很多初學者會直接從 methods 開始看，結果遇到一堆變數時不知道來源，也不知道哪些是 props、哪些是 data、哪些是 computed。先看 `props`、`data`、`computed`、`watch`，再看 methods，會更容易理解資料流。

例如 `Split` 如果一開始就讀 drag method，很容易被 mousemove 細節卡住。但如果先知道它有 `modelValue`、`mode`、`min`、`max`、`isMoving`、pane style，再去看拖曳事件，就會比較容易理解使用者拖動 trigger 時如何改變 layout value。

---

### 4.4 Step 3：追蹤父子關係

本章多個元件不是單獨運作，而是透過父子關係完成狀態或布局協作。

| 父元件 | 子元件 | 關係方式 | 重點 |
| --- | --- | --- | --- |
| `Row` | `Col` | provide / inject | `Col` 從 `RowInstance` 取得 gutter。 |
| `Grid` | `GridItem` | provide / inject | `GridItem` 依賴父層 col、square、padding 與 resize count。 |
| `Collapse` | `Panel` | provide / inject | `Panel` 呼叫父層 toggle，並根據 active key 判斷開合。 |
| `Layout` | `Sider` | slot child name inspection | `Layout` mounted 後判斷是否有 `Sider`，決定 `has-sider` class。 |

閱讀這類元件時，不要把子元件寫成完全獨立。應該明確標出：

```txt
父層提供什麼
  -> 子層讀取什麼
  -> 子層如何回報父層
  -> 父層狀態如何再影響子層
```

例如 `Row` / `Col` 的主線不是「Row 是 div，Col 也是 div」，而是：

```txt
Row 接收 gutter
  -> Row 提供 RowInstance
  -> Col 注入 RowInstance
  -> Col 根據 gutter 產生左右 padding
  -> Row 同時用負 margin 抵消外側間距
```

再例如 `Collapse` / `Panel` 的主線不是「Panel 點擊後展開」，而是：

```txt
Collapse 接收 modelValue
  -> 內部正規化成 currentValue
  -> Panel 根據 name 判斷自己是否 active
  -> Panel click 呼叫 Collapse.toggle()
  -> Collapse emit update:modelValue / on-change
  -> 父層更新 modelValue 後再影響 Panel
```

這樣寫，讀者才會真正理解父子狀態如何閉環，而不是只記住某個 method 名稱。

---

### 4.5 Step 4：對照 computed class 與 inline style

layout/container 元件的狀態通常會落在兩個地方：

```txt
computed class
inline style
```

class 常用來表達「可枚舉狀態」。例如：

```txt
ivu-row-center
ivu-layout-has-sider
ivu-collapse-simple
ivu-grid-hover
ivu-split-pane-moving
```

這些 class 通常代表某種 mode、variant、active state 或結構狀態。閱讀時要追蹤：

```txt
哪個 prop / state 產生這個 class？
這個 class 在 Less 中是否有對應規則？
這個 class 是否需要搭配父層 class 才有效？
```

inline style 則常用來表達「動態尺寸或位置」。例如：

```txt
Row gutter -> margin-left / margin-right
Col gutter -> padding-left / padding-right
Sider width -> width / minWidth / maxWidth / flex
Split offset -> left / right / top / bottom
Affix fixed -> top / bottom / left / width
GridItem size -> width / padding / height
```

這類值通常來自 props、DOM 計算、拖曳行為、scroll position 或 resize result。它們不能只靠 Less 預先定義，必須在 runtime 動態計算。

因此後續筆記應該建立「props / state 到 class / style」的映射表，而不是只貼 source。這種表格更適合回查，也更能幫助你理解元件的設計。

---

### 4.6 Step 5：檢查 DOM event、resize 與 scroll dependency

不是所有 layout/container 元件都只是產生 class。有些元件需要讀取 DOM 尺寸或監聽瀏覽器事件。

常見類型包括：

| 類型 | 代表元件 | 閱讀重點 |
| --- | --- | --- |
| scroll dependency | `Affix` | 根據 scrollTop、元素 offset、windowHeight 判斷固定定位。 |
| resize dependency | `Grid`、`Affix`、`Split` | 視窗或元素尺寸改變時重新計算布局。 |
| document mouse event | `Split` | 拖曳過程需要監聽 document mousemove / mouseup。 |
| external dependency | `Grid` | 例如 resize detector 或 throttle 類工具協助降低計算成本。 |

閱讀這類元件時，要特別確認兩件事。

第一，事件在哪裡註冊，在哪裡清理。若有 `mounted` 註冊 listener，通常應該在 `beforeUnmount` 或對應生命週期中移除，避免記憶體洩漏或重複監聽。

第二，事件觸發後如何改變狀態或 style。以 `Affix` 為例，scroll / resize 不是目的，真正要追的是事件觸發後如何計算 fixed 狀態、placeholder 與 inline style。

---

### 4.7 Step 6：對照 style source

讀 style 時不要只看 `src/styles/components/`，因為本章有兩類重要 style source。

| 類型 | 代表檔案 | 用途 |
| --- | --- | --- |
| common / mixin style | `src/styles/common/layout.less`、`src/styles/mixins/layout.less` | `Row` / `Col` 的 24 欄與 responsive class。 |
| component style | `src/styles/components/*.less` | Layout、Card、Grid、Collapse、Space、Split、Affix、FooterToolbar、GlobalFooter 樣式。 |

對照 style 時要回答以下問題：

1. runtime 產生的 class 是否有 Less 規則承接？
2. Less 是否有 runtime 沒有直接出現、但由 mixin 生成的 class？
3. 哪些樣式由變數控制，例如 layout header height、affix z-index、grid columns？
4. 樣式是否依賴父子 class 結構，例如 `.ivu-grid-border .ivu-grid-item`？
5. 某個視覺效果是 runtime inline style 完成，還是 Less class 完成？

以 `Row` / `Col` 為例，`Col` 的 span、push、pull、offset、order 等 class，不能只在 `col.vue` 裡找寬度規則。你必須回到 `src/styles/mixins/layout.less` 與 `src/styles/common/layout.less`，才能理解 24 欄與 responsive class 是如何產生的。

以 `Grid` / `GridItem` 為例，runtime 可能提供 col、padding、square 等資料，但 border、hover、center 等視覺規則需要對照 `grid.less`。如果沒有對照 style，就無法完整理解使用者看到的結果。

---

### 4.8 Step 7：對照 type declaration

type declaration 代表 TypeScript 使用者看到的 public contract。它很重要，但不能直接等同 runtime。

閱讀時要做雙向檢查：

```txt
types/*.d.ts 有，runtime 是否真的有？
runtime 有，types 是否也有？
```

本章尤其要注意合併型別檔：

| Type file | 內容 |
| --- | --- |
| `types/row.d.ts` | 同時包含 `Row` 與 `Col`。 |
| `types/layout.d.ts` | 同時包含 `Sider`、`Layout`、`Content`、`Footer`、`Header`。 |
| `types/grid.d.ts` | 同時包含 `Grid` 與 `GridItem`。 |
| `types/collapse.d.ts` | 同時包含 `Collapse` 與 `Panel`。 |

這些合併型別檔提醒我們：public component 不一定一個元件對應一個 type file。閱讀時應該以「元件組」為單位對照型別，而不是只用檔名直覺判斷。

如果 type 與 runtime 不一致，筆記中應該明確寫出差異。例如：

| 情況 | 筆記應如何處理 |
| --- | --- |
| runtime 有 prop，但 `.d.ts` 沒有 | 標註 TypeScript public contract 可能未覆蓋該 runtime prop。 |
| `.d.ts` 有 prop，但 runtime 沒看到 | 回查是否在 mixin、繼承、其他 wrapper 或版本差異中；若仍找不到，標註需要後續確認。 |
| event 名稱在 runtime 與 type 表達不同 | 分別記錄 runtime emit 名稱與 TypeScript 使用者看到的事件型別。 |
| slot 在 examples 中常用，但 type 沒明確描述 | 標註 slot 使用主要來自 template / examples 觀察。 |

這樣可以避免把 source、types 與 examples 混成單一結論。

---

### 4.9 Step 8：對照 official examples

examples 用來回答：

> 官方希望使用者怎麼用這個元件？

它們不一定覆蓋所有 runtime branch，但可以幫助判斷主要場景。

閱讀 example 時可以標記三類資訊：

| 類型 | 說明 |
| --- | --- |
| 主場景 | example 明確展示的常見用法。 |
| 進階場景 | example 有展示但不是最基本的用法，例如 `Sider` collapse、`Split` vertical。 |
| source-only branch | runtime 支援但 example 未展示的分支，需要在筆記中另外標註。 |

例如 `Split` 可能在 runtime 中支援多種 mode、min/max 與拖曳事件，但 examples 只展示其中一部分。這時筆記應該區分：

```txt
官方 example 展示：
  -> 使用者最容易接觸的主推場景

runtime source 支援：
  -> 元件內部實際可處理的分支

尚未由 example 證明：
  -> 需要標註 source-only branch 或後續確認
```

不要用 example 反推所有能力。example 是使用方式證據，不是完整 API 定義。

---

### 4.10 Step 9：確認 registry、install 與 tests

最後才回查 registry、install 與 tests：

```txt
src/components/index.js
src/index.js
types/viewuiplus.components.d.ts
test/unit/specs/
```

這一步回答：

1. 元件是否 public export？
2. 全量 install 是否會註冊？
3. TypeScript global component 是否可見？
4. 是否有 unit test 直接保護該行為？

目前本章直接命中的測試主要是：

```txt
affix.spec.js
```

這代表 `Affix` 的部分行為可以回到 unit test 交叉確認。其他元件如果沒有找到測試，不代表行為不存在，只代表筆記中不能寫成「測試已保證」。

比較精準的寫法是：

```txt
目前在本地 source 中，尚未找到與此行為直接對應的 unit test。
因此本段結論主要來自 runtime source、style source 與 official example 的交叉觀察。
```

這樣可以保持筆記的可信度。

---

### 4.11 Step 10：把閱讀結果整理成元件筆記

完成上述閱讀後，單一元件筆記不應只貼 source，而應該整理成可複習的結構。

建議每篇元件筆記至少包含：

1. public surface：props、slots、events、v-model、public export。
2. runtime 主流程：狀態、computed、watch、methods、lifecycle。
3. 父子關係：是否 `provide / inject`、slot inspection 或 internal helper。
4. class / inline style 映射：哪些 props 或 state 影響 class / style。
5. style source 對照：runtime class 如何被 Less 承接。
6. type declaration 對照：runtime 與 `.d.ts` 是否一致。
7. examples 場景：官方展示哪些主場景與進階場景。
8. registry / install：是否 public export 與 global component 可見。
9. tests：是否有 unit test 支援行為判斷。
10. 常見誤區與閱讀提醒。

這樣整理後，筆記才會從「看過 source」升級成「建立可回查的原始碼理解模型」。

---

## 5. 表格整理

### 5.1 通用閱讀流程表

| 步驟 | 閱讀對象 | 核心問題 | 產出結果 |
| --- | --- | --- | --- |
| 1 | public surface | 使用者可以傳什麼、放什麼、監聽什麼？ | props / slots / events / v-model 表。 |
| 2 | runtime source | public input 如何轉成 DOM、狀態、事件？ | runtime 主流程與 state flow。 |
| 3 | parent-child relationship | 元件是否依賴父層或子層協作？ | 父子資料流與責任切分表。 |
| 4 | computed class / inline style | 哪些狀態變成 class，哪些變成 style？ | props/state 到 class/style 映射表。 |
| 5 | DOM dependency | 是否依賴 scroll、resize、mousemove 等？ | DOM listener 與清理流程表。 |
| 6 | style source | runtime class 如何被 Less 承接？ | class 對 Less source 對照表。 |
| 7 | type declaration | TypeScript public contract 是否一致？ | runtime / type 差異表。 |
| 8 | official example | 官方展示哪些使用場景？ | 主場景、進階場景、source-only branch 表。 |
| 9 | registry / install | 元件是否 public export 與可全量安裝？ | export / install / global component 確認表。 |
| 10 | tests | 行為是否有測試保護？ | test evidence 或「未找到直接測試」標註。 |

---

### 5.2 runtime / style / type 分工表

| 來源 | 主要用途 | 不能單獨得出的結論 |
| --- | --- | --- |
| `.vue` runtime source | 判斷 props、state、computed、watch、events、DOM listener。 | 不能單獨得出所有 class 的視覺效果。 |
| `index.js` entry source | 判斷 public component 如何被匯出與安裝。 | 不能代表元件實際行為。 |
| Less style source | 判斷 class、layout、spacing、border、hover、fixed 等視覺規則。 | 不能知道 class 何時由 runtime 產生。 |
| `types/*.d.ts` | 判斷 TypeScript 使用者看到的 public contract。 | 不能直接代表 runtime 實作一定一致。 |
| examples | 判斷官方展示的使用場景。 | 不能反推完整 API 或所有 runtime branch。 |
| tests | 判斷某些行為是否有測試保護。 | 沒有 test 不代表行為不存在。 |

---

### 5.3 props / state 到 class / style 映射表模板

| props / state | 影響位置 | 產生結果 | 需要對照的 style source | 閱讀重點 |
| --- | --- | --- | --- | --- |
| `Row.gutter` | `Row`、`Col` | `Row` margin 與 `Col` padding | `layout.less` | 父子如何共同完成欄距。 |
| `Sider.width` / `collapsedWidth` | `Sider` | width、minWidth、maxWidth、flex | `layout.less` | inline style 如何控制側欄尺寸。 |
| `Collapse.modelValue` | `Collapse`、`Panel` | active panel 狀態與內容顯示 | `collapse.less` | modelValue 如何被正規化與回寫。 |
| `Grid.col` / `square` / `padding` | `Grid`、`GridItem` | item width、height、padding | `grid.less` | 父層狀態與 resize count 如何影響子項。 |
| `Split.modelValue` / drag state | `Split` | pane offset、moving class | `split.less` | 拖曳事件如何改變布局比例或尺寸。 |
| `Affix.affix` / position data | `Affix` | fixed class、top/bottom/left/width | `affix.less` | scroll / resize 計算如何落到 fixed 樣式。 |

---

### 5.4 父子關係查核表

| 元件組 | 父層提供 | 子層讀取 | 子層回報 | 父層再影響 |
| --- | --- | --- | --- | --- |
| `Row` / `Col` | `RowInstance`、`gutter` | `Col` 取得 gutter | 通常不需要回報 | `Row` 與 `Col` 共同形成 gutter 效果。 |
| `Grid` / `GridItem` | col、square、padding、resize count | `GridItem` 計算 width / height / padding | 通常不直接回報 | resize count 促使子項重新計算。 |
| `Collapse` / `Panel` | active keys、toggle 方法 | `Panel` 判斷自身 active | `Panel` click 呼叫 toggle | `Collapse` 更新 currentValue 並 emit。 |
| `Layout` / `Sider` | default slot children | `Sider` 不透過 inject 接收 | 無直接回報 | `Layout` 根據 child name 決定 has-sider class。 |

---

### 5.5 examples 證據分層表

| 分層 | 判斷方式 | 筆記寫法 |
| --- | --- | --- |
| 官方主場景 | example 明確、反覆展示 | 「官方 example 主要展示……」 |
| 官方進階場景 | example 有展示，但不是最基本用法 | 「example 也展示……，可視為進階用法。」 |
| source-only branch | runtime 有邏輯，但 example 未展示 | 「runtime 支援此分支，但 examples 未看到對應展示。」 |
| 需要後續確認 | source、types、examples 之間出現不一致 | 「此處需要後續補充或回查版本差異。」 |

---

## 6. 範例或情境說明

### 6.1 以 `Collapse` / `Panel` 為例：不要直接從 template 開始

如果要閱讀 `Collapse` / `Panel`，不建議一開始就看 template。更好的順序是：

```txt
public surface
  -> modelValue / accordion / events
  -> runtime currentValue
  -> provide CollapseInstance
  -> Panel inject parent
  -> Panel name / index / isActive
  -> Panel click 呼叫 parent.toggle()
  -> update:modelValue / on-change
  -> collapse.less
  -> types/collapse.d.ts
  -> examples/routers/collapse.vue
```

這樣讀的好處是，你會先理解「父層 active state 如何控制子層開合」，再去看視覺呈現。否則你可能只看到 Panel 有 header 與 content，卻沒理解它和 `Collapse.modelValue` 的關係。

整理成筆記時，可以寫成：

```txt
Collapse 的核心不是「顯示或隱藏內容」而已，而是建立一套父子狀態協議：
父層保存 active keys，子層根據 name 判斷自己是否 active，使用者點擊子層 header 後再回到父層更新狀態。
```

---

### 6.2 以 `Row` / `Col` 為例：不要只看 `.vue`

如果要閱讀 `Row` / `Col`，只看 `row.vue` 與 `col.vue` 會不完整。因為 24 欄 class 與 responsive class 的寬度規則主要來自 Less。

建議閱讀線如下：

```txt
Row public props
  -> Row provide gutter
  -> Col inject gutter
  -> Col span / offset / push / pull / order / responsive props
  -> Col computed class
  -> Row / Col gutter inline style
  -> src/styles/common/layout.less
  -> src/styles/mixins/layout.less
  -> types/row.d.ts
  -> examples/routers/grid.vue
```

這樣才能回答完整問題：

```txt
Row / Col 如何從 props 變成 class？
class 的寬度規則在哪裡產生？
gutter 為什麼需要 Row margin 與 Col padding 共同完成？
responsive props 如何對應 responsive class？
```

這也是 runtime / style 對照最典型的例子。

---

### 6.3 以 `Affix` 為例：DOM 計算比 class 更重要

`Affix` 的 style source 通常不複雜，但 runtime DOM 計算比較重要。閱讀時應該先確認：

```txt
props: offsetTop / offsetBottom / target / container
events: on-change
state: affix / styles / slotStyle
dependency: scroll / resize
methods: getScroll() / getOffset() / handleScroll()
```

接著再看：

```txt
scroll / resize
  -> handleScroll()
  -> 計算元素位置
  -> 判斷 top 或 bottom 模式
  -> 設定 fixed style
  -> 顯示 placeholder
  -> emit on-change
```

這裡的重點不是「有沒有 `ivu-affix` class」，而是「scroll 位置如何轉成 fixed 狀態與 placeholder 尺寸」。

---

## 7. 閱讀路線或學習路線

### 7.1 初次閱讀路線：先練習方法，不追求細節完整

第一次讀本章元件時，建議先用以下順序：

1. **先讀 public surface**  
   每個元件先列出 props、slots、events、v-model。這一步是建立使用者視角。

2. **再讀 runtime 主流程**  
   只抓核心 state、computed、watch 與主要 methods，不急著追每個分支。

3. **接著對照 class / inline style**  
   把「props / state 影響哪個 class 或 style」整理出來。

4. **最後對照 examples**  
   用 examples 確認官方主推使用方式，不要一開始就把所有 runtime branch 都當成主要功能。

初次閱讀的目標不是掌握每個細節，而是建立每個元件的「責任地圖」。

---

### 7.2 深入閱讀路線：針對互動與 DOM 依賴加深

第二輪閱讀時，開始深入：

1. **追蹤父子關係**  
   尤其是 `Row / Col`、`Grid / GridItem`、`Collapse / Panel`。

2. **追蹤 DOM listener 與清理流程**  
   尤其是 `Split`、`Affix`、`Grid` 這類依賴 resize、scroll、drag 的元件。

3. **對照 Less mixin 與 component style**  
   尤其是 grid system 與 layout shell，不能只看 component style。

4. **對照 type declaration**  
   檢查 `.d.ts` 與 runtime props / emits 是否一致。

5. **對照 tests**  
   確認哪些行為有測試保護，哪些只是 source 推導。

深入閱讀的目標是建立「證據鏈」，讓筆記中的每個結論都知道來自哪一類來源。

---

### 7.3 可以暫時跳過的部分

初學者第一次閱讀時，可以暫時跳過以下內容：

| 可暫時跳過 | 原因 |
| --- | --- |
| Less 變數完整來源 | 初次只需要知道 class 是否被承接，不必展開整個主題系統。 |
| 所有 responsive class 的完整生成細節 | 可先理解 mixin 會產生 span、push、pull、offset、order class。 |
| 所有 tests 的工具細節 | 先知道有無直接行為測試即可。 |
| external dependency 的內部實作 | 例如 resize detector 或 throttle 的內部原理可後續補充。 |

但以下內容不建議跳過：

| 不建議跳過 | 原因 |
| --- | --- |
| public surface | 這是理解元件對外能力的入口。 |
| runtime state / computed | 這是理解行為的核心。 |
| class / inline style 對照 | layout/container 元件大量依賴這一層。 |
| style source 對照 | 不對照 Less 會誤判實際視覺效果。 |
| type declaration 對照 | 會影響 TypeScript 使用者真正能使用的 public contract。 |

---

## 8. 常見誤區

| 誤區 | 為什麼容易誤解 | 正確理解 |
| --- | --- | --- |
| 只看 `.vue` 就判斷元件完整行為 | `.vue` 確實是 runtime 核心，但 class 背後的樣式規則可能在 Less。 | runtime 只能回答「何時產生 class / style」，樣式效果要回到 style source。 |
| 把 `.d.ts` 當成實作 | Type declaration 看起來像 API 清單，容易被誤認為完整來源。 | `.d.ts` 是 TypeScript public contract，仍需回到 runtime 確認實作。 |
| 用 examples 反推所有功能 | examples 通常只展示主場景，並不覆蓋所有 branch。 | examples 是使用方式證據，不是完整 API 定義。 |
| 沒有 test 就說行為不存在 | 很多元件可能沒有完整 unit test，但 runtime 仍存在該行為。 | 沒有 test 只能說「未找到測試保護」，不能說功能不存在。 |
| 把子元件當成完全獨立 | `Col`、`GridItem`、`Panel` 等都依賴父層狀態或上下文。 | 應從父子資料流理解元件，而不是只看子元件 props。 |
| 忽略 inline style | layout 元件常用 inline style 表達動態尺寸與位置。 | class 與 inline style 要一起看，尤其是 gutter、width、offset、fixed positioning。 |
| 忽略 DOM listener 清理 | `Split`、`Affix` 等會註冊 document / window listener。 | 必須檢查 mounted 與 beforeUnmount，確認資源是否正確清理。 |
| 把 public export 與 runtime 檔案位置混在一起 | 有些 public component 的 runtime source 不在同名目錄。 | 先看 entry，再追 runtime target，區分 public component 與 internal helper。 |

---

## 9. 本章總結

這篇筆記建立了 `08-layout-and-containers/` 章節的通用閱讀方法。對 View UI Plus 的 layout/container 元件來說，最重要的不是記住某個元件有幾個 props，而是理解它的行為如何分散在多種來源中。

runtime source 負責回答元件如何運作，style source 負責回答 class 與 layout 規則如何生效，type declaration 負責回答 TypeScript 使用者看到的 public contract。examples、registry、install 與 tests 則提供使用方式、公開註冊與行為證據。

因此，閱讀順序應該從 public surface 開始，先確認使用者能傳入什麼、放入什麼、監聽什麼，再進入 runtime source 追蹤 state、computed、watch、methods 與 lifecycle。接著要把 computed class 與 inline style 對照到 Less，把 runtime props / emits 對照到 `.d.ts`，再用 examples 判斷官方展示場景，最後用 registry / install / tests 進行公開性與行為證據確認。

這套方法的價值在於，它能避免三種常見誤判：只看 runtime 而漏掉樣式，只看 type 而誤認為實作，只看 examples 而低估或高估元件能力。後續閱讀 `Row / Col`、`Layout / Sider`、`Grid / GridItem`、`Collapse / Panel`、`Split`、`Affix` 等元件時，都可以用這套流程產出穩定、可回查、適合長期維護的原始碼筆記。

---

## 10. 自我檢查問題

1. 為什麼 layout/container 元件不能只看 `.vue` source？
2. runtime source、style source、type declaration 分別主要回答什麼問題？
3. 為什麼進入 methods 前，應該先看 `props`、`data`、`computed`、`watch`？
4. `Row / Col` 為什麼需要同時對照 runtime 與 Less mixin？
5. `Collapse / Panel` 的父子狀態流程應該如何描述？
6. class 與 inline style 在 layout/container 元件中通常分別負責什麼？
7. official examples 能證明什麼？又不能證明什麼？
8. 如果 `.d.ts` 有宣告某個 prop，但 runtime source 沒看到，筆記應該如何處理？
9. 為什麼「沒有 unit test」不代表「行為不存在」？
10. 閱讀 `Split` 或 `Affix` 這類元件時，為什麼要特別檢查 DOM listener 與清理流程？

---

## 11. 後續延伸方向

這篇筆記後續可以延伸成以下主題：

1. **`Row / Col` runtime-style 對照筆記**  
   聚焦 gutter、span、responsive props、Less mixin 與 24 欄 class 的生成關係。

2. **`Layout / Sider` public surface 與互動流程筆記**  
   聚焦 `Layout` 如何判斷 `Sider`、`Sider` 如何處理收合、breakpoint、trigger 與 `modelValue`。

3. **`Grid / GridItem` resize dependency 筆記**  
   聚焦父子 provide/inject、resize count、square、padding、col 與 DOM 尺寸計算。

4. **`Collapse / Panel` 父子狀態模型筆記**  
   聚焦 `modelValue`、active keys、accordion、Panel click、`update:modelValue` 與 `on-change`。

5. **`Space / Split` 的布局複雜度比較筆記**  
   對比純間距容器與拖曳分割容器在 runtime、DOM event、style 上的差異。

6. **`Affix` scroll / resize 行為證據筆記**  
   聚焦 fixed positioning、placeholder、scroll calculation、resize listener 與 `affix.spec.js`。

7. **runtime / type declaration 差異檢查表**  
   建立每個 layout/container 元件的 runtime props / emits 與 `.d.ts` 對照表。

8. **official examples 覆蓋範圍索引**  
   整理每個元件 examples 展示了哪些主場景、進階場景，以及哪些是 source-only branch。

9. **registry / install / global component declaration 對照筆記**  
   檢查每個 public component 是否被正確 export、install 與宣告為 TypeScript global component。

10. **Layout and Containers 閱讀模板**  
   將本篇方法整理成固定 Markdown 模板，後續每篇元件筆記都可以套用同一格式。
