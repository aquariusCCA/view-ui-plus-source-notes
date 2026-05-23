# View UI Plus `Badge` 組件原始碼閱讀筆記：Source Map 與責任分工

## 0. 原始筆記問題分析

這份原始筆記屬於「原始碼閱讀筆記」為主，「API / 型別筆記」為輔的內容。它的核心目的不是教使用者如何單純使用 `Badge`，而是帶讀者建立 `Badge` 在 View UI Plus 原始碼中的閱讀地圖，理解 runtime、style、type、example、registry 與 plugin install 之間的責任分工。

原始筆記已經整理出許多重要資訊，例如 `badge.vue`、`badge.less`、`types/badge.d.ts`、`examples/routers/badge.vue`、`src/components/index.js` 與 `src/index.js` 等檔案路徑，也已經指出 `dot`、`status/color`、一般 count 是互斥的 template branch。這些都是閱讀 `Badge` 原始碼時不可遺失的核心資訊。

不過，如果要把這份筆記放進長期知識庫，原始版本還可以再補強幾個地方。

第一，原始筆記已經列出檔案與角色，但對初學者來說，還需要先理解為什麼一個看似簡單的 `Badge` 元件會被拆成 runtime、style、type、example 與 registry 多個來源。這部分如果沒有補背景，讀者容易把 source map 看成一張檔案清單，而不是一張閱讀路線圖。

第二，原始筆記已經指出 `badge.vue` 有三段 template branch，但還可以更清楚地說明這種 branch 設計對使用者行為的影響。尤其是 `dot`、`status`、`color` 與一般 `count` 不會同時疊加，這不是單純語法問題，而是 `Badge` 的模式選擇規則。

第三，`badge.less` 的說明目前偏向 selector 對照表。這對回查很有用，但對學習者來說，還需要補上「為什麼定位、尺寸、顏色與動畫要放在 less 裡理解」，以及「只看 `.vue` 為什麼無法完整理解視覺結果」。

第四，`types/badge.d.ts` 與 runtime 的關係可以再加強。型別檔描述的是 public contract，也就是元件對使用者公開的使用方式；但它不一定能完整呈現 runtime 的 branch 優先序與 computed 細節。因此閱讀型別檔之後，仍然需要回到 `badge.vue` 驗證實際行為。

第五，原始筆記已有總結與自我檢查問題，但可以再補上常見誤解、後續延伸方向，以及哪些資訊需要回到實際原始碼繼續確認。

> 此處需要後續補充：本章目前根據既有筆記所整理的 source map 重構，尚未逐行展開 `badge.vue`、`badge.less` 與 `types/badge.d.ts` 的完整原始碼。若後續要寫成深度原始碼解析，應另外建立「runtime computed 詳解」、「template branch 詳解」與「less selector 詳解」等獨立筆記。

---

## 1. 本章定位

本章是一篇 `Badge` 組件的 source map 筆記。所謂 source map，不是瀏覽器 sourcemap，而是「原始碼閱讀地圖」：它負責告訴讀者，要理解一個元件，應該從哪些檔案開始讀、每個檔案負責什麼，以及這些檔案之間如何共同構成元件的完整行為。

`Badge` 是一個展示型元件。它的功能表面上很小：顯示數字角標、小紅點、狀態點或自訂內容。但從元件庫作者的角度來看，這類元件反而很適合用來學習「元件行為如何被拆分到不同層次」：

- `badge.vue` 負責 runtime 行為，例如 props、template branch、computed class、顯示條件與 slot override。
- `badge.less` 負責視覺行為，例如定位、尺寸、顏色、狀態樣式與動畫。
- `types/badge.d.ts` 負責 TypeScript public contract，讓使用者知道可以傳入哪些 props 與 slots。
- `examples/routers/badge.vue` 負責展示官方預期的使用情境。
- `src/components/index.js` 與 `src/index.js` 負責元件對外匯出與全域安裝。

讀完本章後，你應該能回答以下問題：

1. `Badge` 的 runtime、style、type、example、registry 與 plugin install 分別在哪些檔案。
2. 哪些行為應該回到 `badge.vue` 理解，哪些視覺結果一定要回到 `badge.less` 驗證。
3. 為什麼 `src/index.js` 裡即使沒有直接出現 `Badge` 字樣，`Badge` 仍然會被全域安裝流程註冊。
4. 第一次閱讀 `Badge` 原始碼時，應該按照什麼順序打開檔案。
5. `dot`、`status`、`color`、`count`、`text`、`type`、`offset` 與 slot 之間大致如何分工。

---

## 2. Source Baseline：本章使用的原始碼範圍

本章以本地保存的 View UI Plus `v1.3.20` 原始碼為準。這一點很重要，因為元件庫在不同版本中可能調整檔案結構、props 行為、樣式 class 或型別宣告。閱讀原始碼筆記時，必須先記錄版本基準，否則之後回查容易發生「筆記內容和目前程式碼對不起來」的問題。

以下表格整理本章涉及的核心檔案。

| 類型 | 路徑 | 角色 |
| --- | --- | --- |
| Runtime | `01-origin/source/view-ui-plus-v1.3.20/src/components/badge/badge.vue` | 定義 props、三段 template branch、computed class/style、顯示條件與 slot override。 |
| Runtime entry | `01-origin/source/view-ui-plus-v1.3.20/src/components/badge/index.js` | 匯出 `badge.vue`，作為 `Badge` 單一元件資料夾的入口。 |
| Component style | `01-origin/source/view-ui-plus-v1.3.20/src/styles/components/badge.less` | 定義 `ivu-badge`、count、custom count、dot、status、processing animation 與狀態色。 |
| Style entry | `01-origin/source/view-ui-plus-v1.3.20/src/styles/components/index.less` | 透過 `@import "badge";` 將 badge 樣式納入元件樣式集合。 |
| Type declaration | `01-origin/source/view-ui-plus-v1.3.20/types/badge.d.ts` | 定義 `Badge` 的 TypeScript public contract 與 `v-slots`。 |
| Type export entry | `01-origin/source/view-ui-plus-v1.3.20/types/viewuiplus.components.d.ts` | 透過 `export { Badge } from './badge'` 匯出 `Badge` 型別。 |
| Example | `01-origin/source/view-ui-plus-v1.3.20/examples/routers/badge.vue` | 展示官方使用場景與 props / slots 組合。 |
| Component registry | `01-origin/source/view-ui-plus-v1.3.20/src/components/index.js` | 對外匯出 `Badge`，使其進入元件集合。 |
| Plugin install | `01-origin/source/view-ui-plus-v1.3.20/src/index.js` | 匯入整個 `components` map，並透過 `app.component(key, ViewUI[key])` 完成全域註冊。 |

從這張表可以看出，`Badge` 不只是一個 `.vue` 檔案。若只讀 `badge.vue`，你會知道它如何決定要渲染什麼；但你不會完整知道這些 class 最後如何變成畫面。若只讀 `badge.less`，你會知道 class 的視覺效果；但你不會知道哪些 props 會觸發哪些 class。若只讀 `types/badge.d.ts`，你會知道使用者可以怎麼寫；但你不一定看得出 props 之間的優先序。

因此，source map 的核心價值就是先把這些來源放回同一張地圖中，避免閱讀時只看單點而失去整體脈絡。

---

## 3. 整體責任分工：`Badge` 為什麼需要多個檔案共同理解

在元件庫中，一個元件通常會被拆成幾個層次。`Badge` 是很典型的例子。

第一層是 runtime，也就是 `badge.vue`。runtime 關心的是「資料如何變成 DOM」：使用者傳入 props，元件根據 props 與 slots 判斷要進入哪一種模式，再把結果轉換成 template、class 與 style。

第二層是 style，也就是 `badge.less`。style 關心的是「DOM 與 class 如何變成畫面」：同樣是一個 `sup` 或 `span`，只要 class 不同，就可能變成右上角數字角標、小紅點、inline 狀態點或 processing 動畫。

第三層是 type，也就是 `types/badge.d.ts`。type 關心的是「使用者在 TypeScript 或 IDE 中看到的 public API」。這一層不負責執行行為，而是描述使用者可以傳哪些 props，以及有哪些 slots 可以使用。

第四層是 example，也就是 `examples/routers/badge.vue`。example 關心的是「官方希望使用者如何組合這些能力」。它通常不是最精準的規格來源，但很適合用來理解元件的常見使用情境。

第五層是 export / install，也就是 `src/components/index.js`、`src/components/badge/index.js` 與 `src/index.js`。這一層關心的是「元件如何被元件庫對外暴露，以及如何在 Vue app 中註冊」。

可以用以下方式理解：

```txt
使用者寫法
  ↓
types/badge.d.ts：描述可以怎麼用
  ↓
examples/routers/badge.vue：展示官方怎麼用
  ↓
badge.vue：決定實際進入哪個 template branch
  ↓
badge.less：決定 class 對應的視覺效果
  ↓
components/index.js + src/index.js：決定元件如何被匯出與安裝
```

這條路線也對應到閱讀順序：先看 public surface，再看官方案例，再回到 runtime 與 style，最後確認它如何被元件庫整合。

---

## 4. Runtime 責任分工：`badge.vue` 如何決定元件行為

`badge.vue` 是 `Badge` 的主要行為入口。它不是單純負責畫出一個紅點，而是負責把使用者傳入的 props 與 slots 轉換成具體渲染分支。

### 4.1 Public props：使用者可以控制哪些行為

根據原始筆記，`badge.vue` 宣告的 public props 包含：

```txt
count / dot / overflowCount / className / showZero / text
status / type / offset / color
```

這些 props 可以大致分成幾組：

| 類別 | Props | 主要用途 |
| --- | --- | --- |
| 數字角標 | `count`、`overflowCount`、`showZero` | 控制一般 count badge 顯示數字、是否超過上限、是否顯示 0。 |
| 模式切換 | `dot`、`status`、`color` | 決定是否進入 dot 模式或 status/color 模式。 |
| 內容替換 | `text` | 用文字取代一般數字顯示，或搭配 status 顯示狀態文字。 |
| 視覺語意 | `type` | 改變一般 count badge 的語意色，例如 `primary`、`success`、`error`。 |
| 位置微調 | `offset` | 改變角標本體的 `margin-top` 與 `margin-right`。 |
| 自訂 class | `className` | 讓使用者額外加入 class，通常用於客製化樣式。 |

這裡要注意，這些 props 不是全部同時作用在同一個畫面上。`Badge` 的設計是先判斷模式，再根據模式決定哪些 props 有意義。例如 `type` 主要作用在一般 count badge；但如果元件已經進入 status/color 模式，就不能把 `type` 理解成 status dot 的顏色控制來源。

### 4.2 Template branch：`dot`、`status/color`、一般 count 是互斥模式

原始筆記指出，`badge.vue` 的 template 可以先抓住三段 branch：

```vue
<span v-if="dot">...</span>
<span v-else-if="status || color">...</span>
<span v-else>...</span>
```

這段分支是理解 `Badge` 的第一個核心。它代表 `Badge` 並不是把所有 props 疊加後一起渲染，而是先選出一種主要模式。

| 優先序 | 條件 | 模式 | 行為理解 |
| --- | --- | --- | --- |
| 1 | `dot` | dot 模式 | 只顯示小點，不顯示一般數字 count，也不進入 status branch。 |
| 2 | `status || color` | status/color 模式 | 顯示 inline 狀態點與文字，不是右上角數字角標。 |
| 3 | 其他情況 | 一般 count 模式 | 根據 `count`、`text`、`showZero`、`overflowCount`、slot 等決定是否顯示角標內容。 |

這個優先序很容易被忽略。很多初學者看到 `Badge` 有 `dot`、`status`、`color`、`count`，會直覺以為它們可以自由組合。例如可能會以為可以同時指定 `dot` 和 `status`，讓右上角小點套用狀態色。但依照 template branch，只要 `dot` 為 true，後面的 `status || color` branch 就不會被執行。

同樣地，只要傳入 `status` 或 `color`，就會進入 status/color 模式，不會進入一般 count 模式。因此 `color` 在這裡不能被簡單理解成「一般數字角標的背景色」。它會影響的是 status 模式中的狀態點。

### 4.3 Computed：把 props 與 slot 狀態轉成 class、style 與顯示條件

`badge.vue` 的 computed 可以看成 runtime 的轉換層。使用者傳入的 props 通常不能直接丟進 template，而要先經過 computed 整理成 class、style 或布林條件。

| Computed | 責任 | 閱讀重點 |
| --- | --- | --- |
| `classes` | 產生根節點 `ivu-badge`。 | 先確認元件根節點的基礎 class，後續 less 都會以這個命名空間展開。 |
| `dotClasses` | 產生 dot 模式的 `ivu-badge-dot`。 | 對照 `badge.less` 中小紅點定位與尺寸。 |
| `countClasses` | 產生一般數字角標 class，包含 `className`、`alone`、`type`。 | 判斷一般 count badge 如何套用自訂 class、獨立顯示與語意色。 |
| `customCountClasses` | 產生自訂 count slot 的透明角標 class。 | 搭配 `#count` slot 時使用，通常會取消預設背景、邊框與陰影。 |
| `statusClasses` | 產生 status dot class，包含 `status` 或內建 `color`。 | 判斷 status 模式會使用哪種狀態色 class。 |
| `statusStyles` | 非內建 `color` 時寫入自訂背景色。 | 例如 `color="#2db7f5"` 這種自訂色通常不走固定 class，而走 inline style。 |
| `styles` | 將 `offset` 轉成 `margin-top` 與 `margin-right`。 | `offset` 是位置微調，不是 layout 結構重算。 |
| `finalCount` | 決定顯示 `text`、原始 `count` 或 `${overflowCount}+`。 | 一般 count 模式中用來計算最後顯示文字。 |
| `badge` | 決定角標本體是否顯示。 | 應和 `count`、`showZero`、slot 等條件一起讀。 |
| `hasCount` | 決定一般模式是否渲染 count `sup`。 | 控制 DOM 是否出現，而不只是 CSS 隱藏。 |
| `alone` | 判斷是否沒有 default slot，進而改變 count 定位。 | 沒有包住內容時，badge 會從附著式角標變成獨立展示。 |

閱讀 computed 時，不建議一開始就逐行細看每一個條件。比較好的方式是先把 computed 分成三類：

1. 產生 class：例如 `classes`、`dotClasses`、`countClasses`、`customCountClasses`、`statusClasses`。
2. 產生 style：例如 `statusStyles`、`styles`。
3. 控制內容與顯示條件：例如 `finalCount`、`badge`、`hasCount`、`alone`。

這樣做可以避免初次閱讀時被細節淹沒，也能更快把 runtime 行為與 style 檔案對起來。

---

## 5. Style 責任分工：`badge.less` 如何決定畫面結果

`badge.less` 是 `Badge` 視覺行為的主要來源。`badge.vue` 只會輸出 DOM、class 與部分 inline style，但真正的定位、尺寸、顏色、陰影、圓角與動畫，都必須回到 less 檔案才能看懂。

這也是讀元件庫原始碼時很重要的觀念：Vue 檔案通常只告訴你「會產生哪些 class」，但不一定告訴你「這些 class 最後長什麼樣子」。如果你只讀 `badge.vue`，你可能知道 `dotClasses` 會產生 `ivu-badge-dot`，但你不知道這個 dot 是幾 px、放在哪裡、是不是 absolute positioning。

### 5.1 Less 區塊與責任

| Less 區塊 | 責任 | 閱讀重點 |
| --- | --- | --- |
| `.ivu-badge` | wrapper 使用 `position: relative` 與 `display: inline-block`，讓角標可以附著在子內容上。 | 這是所有附著式 badge 定位的基礎。 |
| `.ivu-badge-count` | 一般數字角標的 absolute positioning、尺寸、紅底白字、圓角、陰影。 | 對應一般 count 模式。 |
| `.ivu-badge-count-custom` | 自訂 `#count` 內容時取消背景、邊框與陰影。 | 避免自訂內容被預設紅色膠囊樣式限制。 |
| `.ivu-badge-count-alone` | 沒有 default slot 時，讓 count 改成相對定位的獨立展示。 | 對應 runtime 的 `alone` 判斷。 |
| `.ivu-badge-count-{type}` | 一般數字角標的語意色，例如 `primary`、`success`、`error`。 | 對應 `type` prop，但主要作用於一般 count badge。 |
| `.ivu-badge-dot` | dot 模式的小紅點 absolute positioning。 | 對應 `dot` branch。 |
| `.ivu-badge-status-*` | status 模式的 inline dot、文字、狀態色與 processing 動畫。 | 對應 `status || color` branch。 |
| `.make-color-classes()` | 產生 blue、green、red、purple 等 status color class。 | 對應內建 color 名稱。 |

這裡最重要的觀察是：`Badge` 的「一般 count badge」和「status badge」不是同一種 layout。一般 count badge 多半是附著在子內容右上角；status badge 則是 inline 狀態點加文字。這也是為什麼 `status` 相關行為一定要回到 `badge.less` 看，因為它不只是顏色不同，而是整個視覺形態不同。

### 5.2 為什麼 `color` 容易被誤解

在很多元件中，`color` 可能被直覺理解成「設定元件主色」。但在 `Badge` 中，原始筆記已經指出：只要 `status || color` 成立，就會進入 status template。

這代表：

```vue
<Badge color="blue" />
```

更接近「使用 blue 狀態點」的概念，而不是「把一般 count badge 的背景改成 blue」。如果希望改變一般數字角標的語意色，應該看 `type` 對應的 `.ivu-badge-count-{type}`，而不是直接把 `color` 當成 count badge 的背景色設定。

### 5.3 `offset` 的本質是角標位置微調

原始筆記指出，`styles` 會將 `offset` 轉成 `margin-top` 與 `margin-right`。這代表 `offset` 主要是對角標本體做視覺上的位置微調，而不是改變整個 wrapper 的 layout 結構。

因此閱讀 `offset` 時，要把它理解成「在既有定位規則上加一層偏移」。真正的基本定位仍然要回到 `.ivu-badge-count` 或 `.ivu-badge-dot` 等 selector 看。

---

## 6. Type 與 Public API：`types/badge.d.ts` 告訴使用者可以怎麼用

`types/badge.d.ts` 的角色是描述 `Badge` 對外公開的使用契約。它不一定是理解 runtime 優先序的最佳入口，但它非常適合拿來建立 public API 的第一層輪廓。

根據原始筆記，`types/badge.d.ts` 描述的 props 包含：

```txt
count
overflow-count
dot
class-name
type
show-zero
status
text
offset
color
```

這裡要注意 kebab-case 與 camelCase 的差異。Vue template 中使用者常寫 `overflow-count`、`class-name`，但在 Vue component 內部 props 通常會以 `overflowCount`、`className` 這類 camelCase 形式處理。閱讀型別與 runtime 時，需要知道它們指向的是同一組概念。

### 6.1 Slot contract

`Badge` 的型別也描述了 slots。原始筆記指出有兩個重要 slot：

| Slot | typing 描述 | Runtime 位置 | 使用理解 |
| --- | --- | --- | --- |
| `count` | 自訂角標顯示內容，數值 count 將無效。 | 一般 count branch 的第一個 `sup`。 | 適合放入 `Icon` 或自訂 DOM，覆蓋預設 numeric count。 |
| `text` | 自訂角標文字；也可自訂 status text。 | 一般 count branch 的 count 內容，或 status branch 的狀態文字。 | 適合替換一般顯示文字，或自訂 status 旁邊的文字。 |

slot 是 `Badge` 擴充性的關鍵。props 通常用來控制常見情境，slot 則讓使用者在不改元件內部邏輯的情況下替換部分內容。對元件庫來說，這是一種常見設計：用 props 覆蓋大部分使用場景，用 slots 保留進階客製化能力。

### 6.2 型別檔不能取代 runtime 閱讀

雖然 `types/badge.d.ts` 可以讓你快速知道 `Badge` 有哪些 props 與 slots，但它無法完整回答以下問題：

- `dot` 和 `status` 同時存在時誰優先？
- `color` 是影響一般 count badge，還是讓元件進入 status/color branch？
- `#count` slot 出現時，`count` prop 是否還會決定顯示內容？
- `showZero` 在哪些條件下影響 `hasCount` 或 `badge`？

這些問題都必須回到 `badge.vue` 的 template branch 與 computed 去確認。因此，型別檔適合當作閱讀入口，但不能當作完整行為規格。

---

## 7. Example 的閱讀價值：從官方使用場景反推設計意圖

`examples/routers/badge.vue` 的價值在於把多種容易混淆的情境放在一起。範例通常不會像測試一樣列出所有 edge cases，但它可以告訴我們官方預期使用者會怎麼使用這個元件。

| 範例情境 | 驗證重點 | 對應原始碼閱讀方向 |
| --- | --- | --- |
| `:count="count"` 包住方塊 | 一般右上角數字角標。 | 看一般 count branch、`countClasses`、`.ivu-badge-count`。 |
| `:count="0" showZero` | 0 預設隱藏，但 `showZero` 可強制顯示。 | 看 `badge`、`hasCount` 與 `showZero` 條件。 |
| `#count` 搭配 `Icon` | 自訂角標內容會覆蓋 numeric count。 | 看 `customCountClasses` 與一般 count branch 的 slot 判斷。 |
| `text="new"` 或 `#text` | 一般 count 內容可以被文字覆蓋。 | 看 `finalCount` 與 `text` slot。 |
| `status="success"` | status dot 與文字是 inline layout。 | 看 `statusClasses`、status branch、`.ivu-badge-status-*`。 |
| `dot` 包住連結 | dot 模式只顯示小點，不顯示數字。 | 看 `dot` branch 與 `.ivu-badge-dot`。 |
| `:offset="[-5, -5]"` | offset 直接改變角標本體 margin。 | 看 `styles` computed。 |
| `type="primary"` | type 只作用於一般 count badge 的顏色。 | 看 `countClasses` 與 `.ivu-badge-count-{type}`。 |
| `color="blue"` / `color="#2db7f5"` | color 進入 status 模式，內建色走 class，自訂色走 inline style。 | 看 `statusClasses`、`statusStyles` 與 `.make-color-classes()`。 |

閱讀 example 時，不要只把它當成「怎麼用」的展示，而要把它當作「反向搜尋原始碼」的索引。例如看到 `:count="0" showZero`，下一步就應該回到 `badge.vue` 找 `showZero` 如何影響顯示條件；看到 `color="#2db7f5"`，下一步就應該回到 `statusStyles` 觀察自訂色如何被轉成 inline style。

---

## 8. Export、Registry 與 Plugin Install：`Badge` 如何進入 View UI Plus

理解單一元件時，很多人只會停在 `badge.vue`。但如果你想理解元件庫，就必須繼續追蹤它如何被匯出、如何被整合到元件集合，以及如何被 Vue app 註冊。

### 8.1 單元件入口：`src/components/badge/index.js`

`Badge` 的單元件入口位於：

```txt
01-origin/source/view-ui-plus-v1.3.20/src/components/badge/index.js
```

它的角色是把 `badge.vue` 包裝成該元件資料夾的預設出口。這種設計讓其他地方可以透過資料夾路徑匯入元件，而不必直接指定 `badge.vue`。

### 8.2 元件集合出口：`src/components/index.js`

runtime 的 public export 在 `src/components/index.js`：

```js
export { default as Badge } from './badge';
```

這行程式碼代表 `Badge` 被加入 View UI Plus 的元件集合中。當 `src/index.js` 匯入整個 `components` map 時，`Badge` 就會成為其中一個 key。

### 8.3 全域安裝：`src/index.js`

原始筆記指出，全域安裝在 `src/index.js` 中透過整個 component map 間接完成：

```js
Object.keys(ViewUI).forEach(key => {
    app.component(key, ViewUI[key]);
});
```

這裡有一個重要觀念：`src/index.js` 裡沒有直接搜尋到 `Badge`，不代表 `Badge` 沒有被安裝。因為 `Badge` 是先在 `src/components/index.js` 中被 export，然後跟其他元件一起進入 `ViewUI` 這個集合，最後再被 `Object.keys(ViewUI)` 迴圈註冊。

也就是說，註冊路徑可以理解成：

```txt
src/components/badge/badge.vue
  ↓
src/components/badge/index.js
  ↓
src/components/index.js
  ↓
src/index.js
  ↓
app.component('Badge', Badge)
```

這種間接註冊方式是元件庫常見做法。它的好處是 install 流程不需要針對每個元件手寫一次註冊邏輯，只要元件被加入 components map，就能被統一處理。

### 8.4 Type export：`types/viewuiplus.components.d.ts`

typed public export 則位於：

```ts
export { Badge } from './badge'
```

這代表 `Badge` 的型別也被納入 View UI Plus 的 components 型別出口中。runtime export 與 type export 是兩條不同但互相對應的路線：前者讓程式能執行，後者讓 TypeScript 與 IDE 能理解使用者怎麼寫。

---

## 9. 建議閱讀順序與常見誤解

### 9.1 第一次閱讀順序

第一次閱讀 `Badge` 時，建議不要直接從 `badge.less` 開始，也不要一開始就逐行分析 computed。比較穩定的順序如下：

1. 先讀 `types/badge.d.ts`，建立 public API 與 slot 名稱。
2. 再讀 `examples/routers/badge.vue`，確認官方實際展示哪些 props / slots 組合。
3. 回到 `badge.vue`，先看三段 template branch，再看 computed。
4. 讀 `badge.less`，對照 count、dot、status、alone、type color 與 processing animation。
5. 最後看 `components/index.js`、`src/index.js`、`viewuiplus.components.d.ts`，確認 public export、typed export 與 install 路徑。

這個順序的好處是先建立「使用者視角」，再回到「作者視角」。先知道外部怎麼用，才比較容易理解內部為什麼要這樣分支、命名與封裝。

### 9.2 常見誤解

#### 誤解一：`dot`、`status`、`count` 可以自由疊加

依照 template branch，`dot`、`status/color` 與一般 count 是互斥分支。`dot` 的優先序最高，只要 `dot` 成立，就不會進入 status 或一般 count。

#### 誤解二：`color` 是一般數字角標的背景色

原始筆記指出，只要 `status || color` 成立，就會進入 status template。因此 `color` 更接近 status/color 模式的狀態點設定，而不是一般 count badge 的背景色。

#### 誤解三：只看 `types/badge.d.ts` 就能完整理解行為

型別檔可以描述 public API，但不一定能表達 runtime 優先序。props 之間的互斥關係、slot override、`finalCount` 計算與 `showZero` 顯示條件，都應回到 `badge.vue` 確認。

#### 誤解四：`src/index.js` 找不到 `Badge` 就代表沒有全域註冊

`Badge` 是透過 `src/components/index.js` 進入 component map，再由 `src/index.js` 的 `Object.keys(ViewUI)` 統一註冊。因此這是一種間接註冊，不是遺漏。

#### 誤解五：`Badge` 的視覺行為只要看 template 就夠

template 只告訴你渲染哪個 DOM 與 class。真正的定位、尺寸、顏色、陰影與動畫，都要回到 `badge.less` 才能完整理解。

---

## 10. 本章總結、複習問題與後續延伸

### 10.1 本章總結

`Badge` 的完整行為由 runtime、style、type、example、registry 與 plugin install 共同成立。`badge.vue` 負責決定模式選擇與顯示規則，`badge.less` 負責把 class 轉成實際視覺效果，`types/badge.d.ts` 描述 public API，`examples/routers/badge.vue` 展示官方使用方式，而 `src/components/index.js` 與 `src/index.js` 則讓 `Badge` 進入元件庫的匯出與安裝流程。

本章最重要的理解是：`Badge` 不是單純的「一個紅色數字角標」，而是一個展示型元件如何用少量 props、slots、computed class 與 less selector 組合出多種互斥視覺模式的案例。

對學習 View UI Plus 原始碼來說，`Badge` 很適合作為入門元件。它的功能不算龐大，但已經涵蓋元件庫常見的幾個閱讀重點：public API、template branch、computed class、style coupling、slot override、example-driven reading、registry 與 install flow。

### 10.2 自我檢查問題

1. `Badge` 的主要 runtime 檔案是哪一個？它主要負責哪些事情？
2. `Badge` 的單元件入口是哪個檔案？它和 `badge.vue` 的關係是什麼？
3. `Badge` 的 typed public export 由哪個檔案提供？
4. 為什麼 `src/index.js` 裡沒有直接搜尋到 `Badge`，仍然可以被全域註冊？
5. `dot`、`status/color`、一般 count 分別對應哪一段 template branch？
6. 為什麼 `color` 不應直接理解成一般 count badge 的背景色？
7. `type="primary"` 主要作用在哪一種 badge 模式？
8. `#count` slot 出現時，為什麼 numeric count 可能不再是主要顯示內容？
9. 為什麼 status 模式一定要回到 `badge.less` 看 processing animation？
10. 如果你要確認 `:offset="[-5, -5]"` 如何影響畫面，應該先看哪個 computed，再對照哪一類 less selector？

### 10.3 後續延伸方向

這份 source map 筆記只負責建立閱讀地圖。後續可以拆成以下獨立筆記：

1. `Badge Runtime 深入解析`：逐段分析 `badge.vue` 的 props、template branch、computed 與 slot override。
2. `Badge 樣式系統解析`：逐段分析 `badge.less` 的定位、尺寸、狀態色、processing animation 與 `.make-color-classes()`。
3. `Badge Public API 與 Type Declaration 對照`：比較 `types/badge.d.ts`、官方 example 與 runtime props 的對應關係。
4. `Badge 使用案例與邊界條件整理`：整理 `count=0`、`showZero`、`overflowCount`、`text`、`#count`、`#text`、`dot`、`status`、`color` 的組合行為。
5. `View UI Plus 元件註冊流程`：從 `src/components/index.js` 到 `src/index.js`，整理單元件如何進入全域 install 流程。
6. `展示型元件設計模式`：以 `Badge` 為案例，總結展示型元件常見的 props 分層、slot 擴充、class computed 與樣式責任分離。

### 10.4 後續需要確認的資訊

本章根據目前提供的筆記重構，以下內容若要寫成更精準的原始碼解析，需要回到實際檔案逐行確認：

| 待確認項目 | 為什麼需要確認 |
| --- | --- |
| `count`、`overflowCount`、`showZero` 等 props 的完整型別與預設值 | 目前筆記有列 props 名稱，但未完整展開每個 prop 的型別、default 與 validator。 |
| `badge`、`hasCount`、`finalCount` 的完整條件 | 這些 computed 直接影響 DOM 是否渲染與最後顯示文字，適合獨立深挖。 |
| `status` 與 `color` 的內建值範圍 | 目前已知道內建色與自訂色處理不同，但完整可用值仍應回到型別與 less 確認。 |
| `processing` 動畫的 selector 與觸發條件 | 原始筆記提到 status processing animation，但未展開動畫細節。 |
| `offset` 陣列的邊界處理 | 目前只知道會轉成 `margin-top` 與 `margin-right`，但尚未確認非法值或缺值處理。 |

