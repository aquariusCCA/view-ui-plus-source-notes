# Badge 原始碼閱讀總覽：從展示規則到樣式分工

## 0. 原始筆記問題分析

原始 `README.md` 已經具備一份目錄導讀應有的基本骨架：它明確指出本目錄聚焦 View UI Plus 的 `Badge` 元件，也已經整理出 source baseline、reading focus、notes index、learning outcome 與 self check。這些內容很適合放在 `Badge` 筆記包的根目錄，用來幫助讀者先建立整體閱讀方向。

不過，如果這份 README 要作為長期學習用的「教材型導讀」，仍然可以補強幾個面向。

第一，原始筆記已經說明 `Badge` 是低互動展示型元件，但還可以再補充：低互動不代表沒有閱讀價值。`Badge` 的價值不在事件處理，而在它如何把多個 props、slots 與 computed 收斂成固定的 DOM 與樣式模式。這正是閱讀 UI 元件庫時很重要的一種能力。

第二，原始筆記已經列出 `props / slots -> template branch -> computed -> DOM -> badge.less` 的轉換鏈，但可以再把這條鏈補成更清楚的閱讀模型。對初學者來說，這條鏈不是單純流程，而是一種分析展示型元件的方法：先看輸入，再看模式選擇，再看顯示條件，最後回到樣式實作。

第三，原始筆記的 source baseline 表格已經很完整，但可以補上「為什麼要看這些檔案」與「每個檔案在整個元件閱讀中扮演什麼角色」。只列路徑容易變成索引表；補上閱讀目的與關聯後，才能成為 source map。

第四，原始筆記有整理三篇子筆記的閱讀順序，但還可以補成更像學習路線的安排：先建立入口地圖，再理解 public contract，最後對照 class/style/position。這樣讀者會知道每一篇筆記要解決什麼問題，而不是只是照順序打開檔案。

第五，原始筆記已經有 self check，但可以補充更多題型，讓它同時檢查概念理解、branch 優先序、computed 分工、slot override、style source 與原始碼閱讀路線。

---

## 1. 本章定位

本章是 `Badge` 元件筆記包的 **README 導讀筆記**。它不是要深入逐行分析 `badge.vue` 或 `badge.less`，而是先回答三個問題：

1. `Badge` 是什麼類型的元件？
2. 閱讀 `Badge` 時應該先抓住哪些主線？
3. 本目錄中的幾篇筆記應該如何串起來閱讀？

換句話說，本章是整個 `Badge` 筆記包的入口。讀完本章後，應該能先建立一個完整地圖，知道後續閱讀 `01-source-map.md`、`02-public-contract-and-display-rules.md`、`03-class-style-and-position.md` 時，各自要解決什麼問題。

`Badge` 的元件規模不大，但它很適合用來練習閱讀 UI 元件庫，原因是它同時包含：

| 面向 | 在 `Badge` 中的表現 |
| --- | --- |
| Public API | `count`、`dot`、`status`、`color`、`text`、`type`、`offset` 等 props。 |
| Slot override | default slot、`#count`、`#text`。 |
| Template branch | `dot`、`status || color`、一般 count 三段互斥分支。 |
| Computed rule | `badge`、`hasCount`、`finalCount`、`alone`、`styles` 等顯示與樣式邏輯。 |
| Style source | `badge.less` 定義 count、dot、status、custom count、processing 動畫。 |
| Public export | runtime export、typed export、component registry、plugin install。 |

因此，`Badge` 看起來只是「角標元件」，但實際上可以用來練習從 API、runtime、template、style 到安裝流程的完整閱讀方法。

---

## 2. 元件定位：`Badge` 是低互動展示型元件

`Badge` 在 View UI Plus 中屬於低互動展示型元件。它主要負責把狀態、數量或提示訊息以小型視覺標記呈現出來。

所謂「低互動」，指的是它本身不負責處理使用者互動流程。根據原始筆記整理，`Badge`：

1. 不處理 click。
2. 不宣告 emits。
3. 沒有 mixin。
4. 不維護複雜內部狀態。
5. 主要透過 props、slots、computed 與 CSS 產生視覺結果。

這種元件的閱讀重點和表單元件、彈窗元件、選單元件不同。對 `Input`、`Select`、`Modal` 這類元件來說，事件、狀態同步、焦點管理與使用者操作流程很重要；但對 `Badge` 來說，最重要的是展示規則與樣式分工。

可以把 `Badge` 的核心任務理解成：

> 把使用者傳入的展示輸入，轉換成幾種固定的 DOM 結構與樣式形態。

這也是為什麼閱讀 `Badge` 時，不應只把它理解成「右上角數字」。它其實有多種模式：

| 模式 | 說明 |
| --- | --- |
| 一般 count | 顯示數字或文字角標，通常附著在 default slot 的右上角。 |
| custom count | 使用 `#count` 接管整個角標內容，例如放 icon。 |
| dot | 顯示小紅點，不顯示數字。 |
| status / color | 顯示 inline 狀態點與文字，不是右上角角標。 |
| alone count | 沒有 default slot 時，數字角標獨立顯示。 |

這些模式雖然都叫 `Badge`，但 DOM 結構、class、position 與樣式路徑不同。這正是本組筆記要釐清的核心。

---

## 3. `Badge` 的核心轉換鏈

閱讀 `Badge` 時，可以用一條轉換鏈來理解整個元件：

```txt
props / slots
  -> template branch: dot / status-color / count
  -> computed rules: badge / hasCount / finalCount / alone / styles
  -> DOM output: sup / status span / wrapped default slot
  -> badge.less: positioning / color / size / animation
```

這條鏈可以拆成五層。

### 3.1 第一層：props / slots 是輸入

`Badge` 的輸入主要來自 props 與 slots。

Props 負責描述使用者想要什麼樣的展示效果，例如：

| 類型 | Props | 說明 |
| --- | --- | --- |
| 數量內容 | `count`、`overflowCount`、`showZero` | 決定數字角標顯示內容與 0 是否顯示。 |
| 模式選擇 | `dot`、`status`、`color` | 決定走 dot、status/color 或一般 count 模式。 |
| 文字內容 | `text` | 可覆蓋一般 count 文字，也可作為 status 文字。 |
| 樣式修飾 | `type`、`className`、`offset` | 修飾一般角標顏色、class 或位置。 |

Slots 則提供更高層次的覆蓋能力：

| Slot | 作用 |
| --- | --- |
| default slot | 提供被 badge 附著的內容。 |
| `#count` | 接管整個 count 角標內容。 |
| `#text` | 接管 count 或 status 的文字內容。 |

### 3.2 第二層：template branch 決定模式

`Badge` 不是單一 template，而是三段互斥分支：

```txt
dot === true
  -> dot branch
else if status || color
  -> status / color branch
else
  -> count branch
```

這個優先序是閱讀 `Badge` 最重要的規則之一。很多 prop 不是疊加效果，而是會被 branch 優先序擋掉。例如：

| 組合 | 實際結果 |
| --- | --- |
| `dot status="success"` | 進入 dot branch，status 不會形成 status layout。 |
| `dot color="blue"` | 進入 dot branch，color 不會啟用 status color。 |
| `color="blue"` | 進入 status / color branch，不是改 count 背景色。 |
| 沒有 `dot`、`status`、`color` | 才會進入一般 count branch。 |

### 3.3 第三層：computed 補上顯示與樣式規則

template branch 決定模式後，computed 會進一步決定內容、可見性與 class / style。

常見 computed 可以先分成三類：

| 類型 | Computed | 責任 |
| --- | --- | --- |
| 顯示內容 | `finalCount` | 決定顯示 `text`、原始 `count` 或封頂後的 `${overflowCount}+`。 |
| 顯示條件 | `badge`、`hasCount` | 決定角標是否顯示、一般 count `sup` 是否渲染。 |
| 樣式輸出 | `classes`、`countClasses`、`customCountClasses`、`dotClasses`、`statusClasses`、`styles`、`statusStyles` | 產生 class 與 inline style。 |

這些 computed 是 `Badge` 的閱讀核心。它們把 public API 轉換成 runtime 需要的 class、style 與顯示條件。

### 3.4 第四層：DOM output 形成畫面骨架

不同 branch 會輸出不同 DOM 形狀：

| Branch | DOM 概念 | Layout 意義 |
| --- | --- | --- |
| dot branch | wrapper + default slot + `sup.ivu-badge-dot` | 附著在內容右上角的小紅點。 |
| status branch | wrapper + `span.ivu-badge-status-dot` + `span.ivu-badge-status-text` | inline 狀態點與文字。 |
| count branch | wrapper + default slot + `sup.ivu-badge-count` | 附著在內容右上角的數字角標。 |

這裡要特別注意：status branch 不渲染 default slot。它不是「包住內容的角標」，而是「狀態點 + 文字」。

### 3.5 第五層：`badge.less` 決定真正的視覺

最後，`badge.less` 把 runtime 產生的 class 轉成畫面。例如：

| Class | 視覺責任 |
| --- | --- |
| `ivu-badge` | 建立 relative wrapper 與 inline-block 容器。 |
| `ivu-badge-count` | 一般數字角標的定位、尺寸、背景、文字與陰影。 |
| `ivu-badge-count-custom` | 取消 custom count 的預設背景與陰影。 |
| `ivu-badge-count-alone` | 沒有 default slot 時，讓 count 獨立顯示。 |
| `ivu-badge-dot` | 小紅點的尺寸、定位、顏色與陰影。 |
| `ivu-badge-status-dot` | inline 狀態點的基本樣式。 |
| `ivu-badge-status-processing` | processing 狀態色與擴散動畫。 |
| `ivu-badge-status-text` | status 文字的字體與間距。 |

所以完整理解 `Badge` 必須同時讀 runtime 與 style。只看 `badge.vue` 會看不到定位與動畫；只看 `badge.less` 又不知道哪些 class 會在什麼條件下產生。

---

## 4. Source Baseline

本目錄以本地保存的 View UI Plus `v1.3.20` 原始碼為閱讀基準。

| 類型 | 路徑 | 閱讀目的 |
| --- | --- | --- |
| Runtime | `01-origin/source/view-ui-plus-v1.3.20/src/components/badge/badge.vue` | 確認 template branch、props、computed 顯示規則與 slot override。 |
| Runtime entry | `01-origin/source/view-ui-plus-v1.3.20/src/components/badge/index.js` | 確認單元件入口匯出，理解單一元件如何被對外暴露。 |
| Style | `01-origin/source/view-ui-plus-v1.3.20/src/styles/components/badge.less` | 對照數字角標、custom count、dot、status、定位、色彩與 `processing` 動畫。 |
| Style entry | `01-origin/source/view-ui-plus-v1.3.20/src/styles/components/index.less` | 確認 `badge.less` 如何被納入元件樣式集合。 |
| Type declaration | `01-origin/source/view-ui-plus-v1.3.20/types/badge.d.ts` | 確認 public props 與 slot typing。 |
| Type export entry | `01-origin/source/view-ui-plus-v1.3.20/types/viewuiplus.components.d.ts` | 確認 `Badge` 進入 typed public exports。 |
| Example | `01-origin/source/view-ui-plus-v1.3.20/examples/routers/badge.vue` | 確認官方展示的數值、狀態、自訂內容、offset 與色彩場景。 |
| Registry | `01-origin/source/view-ui-plus-v1.3.20/src/components/index.js` | 確認 `Badge` 進入 component public export。 |
| Install | `01-origin/source/view-ui-plus-v1.3.20/src/index.js` | 確認全域安裝時如何透過 component map 間接註冊 `Badge`。 |

這張表的重點不只是路徑索引，而是建立責任分工。閱讀元件庫時，如果不知道某個行為應該去哪個檔案找，很容易在錯誤的地方尋找答案。例如：

1. 想知道 `dot` 和 `status` 哪個優先，要看 `badge.vue` 的 template branch。
2. 想知道 `count=99` 為什麼顯示 `99+`，要看 `finalCount`。
3. 想知道 `processing` 的動畫怎麼做，要看 `badge.less`。
4. 想知道 `Badge` 型別如何對外匯出，要看 `types/viewuiplus.components.d.ts`。
5. 想知道 `Badge` 是否被全域安裝，要看 `src/components/index.js` 與 `src/index.js` 的間接註冊流程。

---

## 5. Reading Focus：閱讀時要拆成四個問題

閱讀 `Badge` 時，建議不要直接逐行看完整原始碼，而是把問題拆成四類。這樣可以避免被 props、computed、template、less selector 混在一起干擾。

### 5.1 Public contract：使用者可以傳入什麼？

第一個問題是 public contract，也就是 `Badge` 對使用者開放了哪些能力。

在 `Badge` 中，props 都是展示輸入，沒有事件輸出。可以先分成：

| 分組 | Props / Slots | 閱讀重點 |
| --- | --- | --- |
| 內容輸入 | `count`、`overflowCount`、`showZero`、`text`、`#text` | 決定角標或 status text 顯示什麼。 |
| 模式選擇 | `dot`、`status`、`color` | 決定 template branch。 |
| 樣式修飾 | `type`、`className`、`offset` | 修飾一般角標色彩、class 與位置。 |
| 結構覆蓋 | default slot、`#count` | 提供被附著內容，或接管整個角標內容。 |

這裡最容易誤解的是 `color`。在 `Badge` 中，`color` 不是一般 count badge 的背景色設定，而是會讓元件進入 status / color branch。

### 5.2 Template branch：實際會走哪一種 DOM？

第二個問題是 template branch。這是 `Badge` 的顯示規則核心。

`Badge` 的三段分支不是平行疊加，而是互斥優先序：

```txt
dot
  -> status || color
    -> count
```

只要 `dot` 成立，就不會走 status branch；只要 `status || color` 成立，就不會走一般 count branch。

因此讀 props 時不能只看單個 prop 的名稱，而要看它在 template 中的位置。

### 5.3 Computed：哪些條件決定內容與可見性？

第三個問題是 computed。`Badge` 的 runtime 很短，但 computed 承擔了大部分判斷。

| Computed | 主要問題 |
| --- | --- |
| `finalCount` | 最後顯示的是 `text`、原始 `count`，還是 `${overflowCount}+`？ |
| `badge` | 角標本體是否透過 `v-show` 顯示？ |
| `hasCount` | 一般 count branch 是否渲染 `sup`？ |
| `alone` | 是否沒有 default slot，因此要改成獨立角標？ |
| `styles` | `offset` 是否轉成 inline style？ |
| `statusStyles` | 自訂 `color` 是否轉成 `backgroundColor`？ |

閱讀這些 computed 時，要特別注意它們的責任不同。`hasCount` 是「要不要渲染節點」，`badge` 是「節點渲染後要不要顯示」，這兩者不是同一件事。

### 5.4 Style source：畫面效果在哪裡實作？

第四個問題是 style source。

一般數字角標與 dot 都是相對 wrapper 的 absolute positioning；status 模式則是 inline status dot 加文字。這個差異不只影響 CSS，也影響你如何理解 API。

| 模式 | Style 模型 |
| --- | --- |
| 一般 count | `sup.ivu-badge-count`，absolute 右上角定位。 |
| custom count | `sup.ivu-badge-count.ivu-badge-count-custom`，保留定位但取消預設外觀。 |
| dot | `sup.ivu-badge-dot`，absolute 小紅點。 |
| status / color | `span.ivu-badge-status-dot` + text，inline-block 狀態顯示。 |
| alone | `ivu-badge-count-alone` 改變 positioning，使 count 獨立顯示。 |

這裡最重要的是分清楚：

```txt
count / dot 是附著型角標
status 是 inline 狀態顯示
```

---

## 6. Notes Index：本目錄建議閱讀順序

本目錄目前可以依照下列順序閱讀。

| 筆記 | 主題 | 建議閱讀目的 |
| --- | --- | --- |
| `01-source-map.md` | 原始碼入口與責任分工 | 先知道 runtime、style、type、example、registry、install 分別在哪裡。 |
| `02-public-contract-and-display-rules.md` | public contract 與顯示規則 | 對照 props、slots、三段 template branch、`badge` / `hasCount` / `finalCount`。 |
| `03-class-style-and-position.md` | class、style 與定位系統 | 理解一般 count、custom count、dot、status、offset、alone 與 less 的分工。 |

這個順序背後有明確的學習邏輯。

### 6.1 第一階段：先建立 source map

先讀 `01-source-map.md`，目標是知道「答案應該去哪裡找」。這一階段不要急著理解每個 computed，也不要一開始就鑽進 Less selector，而是先建立檔案之間的關係。

讀完後應該能回答：

1. `badge.vue` 負責什麼？
2. `badge.less` 負責什麼？
3. `types/badge.d.ts` 能看到什麼，不能看到什麼？
4. example 的閱讀價值是什麼？
5. `Badge` 如何被 export 與 install？

### 6.2 第二階段：理解 public contract 與顯示規則

再讀 `02-public-contract-and-display-rules.md`，目標是理解「使用者傳入 props / slots 後，畫面會如何被決定」。

這一階段要抓住三個優先序：

```txt
dot 優先於 status/color
status/color 優先於一般 count
#count 優先於 numeric count
```

同時要理解：

1. `text` 如何覆蓋一般 count。
2. `finalCount` 如何處理 `overflowCount`。
3. `showZero` 如何影響 `count=0`。
4. `hasCount` 和 `badge` 的分工。
5. status branch 為什麼不渲染 default slot。

### 6.3 第三階段：對照 class、style 與 position

最後讀 `03-class-style-and-position.md`，目標是理解「runtime 產生的 class 如何被 less 轉成畫面」。

這一階段要分清楚三個 class 邊界：

```txt
ivu-badge-count       -> 數字角標，absolute right-top
ivu-badge-dot         -> 小紅點，absolute right-top
ivu-badge-status-dot  -> 狀態點，inline-block
```

讀完後應該能回答：

1. 為什麼 `ivu-badge` root 要 `position: relative`？
2. `alone` 如何改變 count 的定位模型？
3. `#count` 為什麼會取消背景與陰影？
4. `offset` 實際寫入哪兩個 CSS property？
5. `processing` 動畫為什麼必須看 `badge.less`？

---

## 7. `Badge` 最容易誤判的幾個規則

`Badge` 的程式碼不長，但有幾個規則很容易誤判。這些規則應該放在 README 中，作為後續閱讀前的提醒。

### 7.1 `dot` 優先於 `status` 與 `color`

如果同時傳入：

```vue
<Badge dot status="success" />
```

實際上會進入 dot branch，而不是 status branch。因為 template 優先判斷 `dot`。

### 7.2 `color` 不是一般 count 的背景色

如果使用：

```vue
<Badge color="blue" text="processing" />
```

它會進入 status / color branch，形成 inline 狀態點與文字，而不是把一般 count badge 的背景改成藍色。

要改一般 count 的語意色，應該看 `type`，例如：

```vue
<Badge :count="5" type="primary" />
```

### 7.3 `#count` 會接管整個角標

`#count` 不是只改數字文字，而是接管整個 count 角標內容。它會使用 custom count 樣式，取消預設背景、邊框與陰影。

如果只是想改角標中的文字，應該理解 `#text` 或 `text` 的路徑。

### 7.4 `text` 會覆蓋一般數字

在一般 count branch 中，`finalCount` 會先看 `text`。只要 `text` 不為空，就會顯示 `text`，而不是顯示數字 count。

### 7.5 `overflowCount` 使用 `>=`

根據原始筆記整理，`finalCount` 使用的是 `parseInt(count) >= parseInt(overflowCount)`。因此：

```txt
count = 99
overflowCount = 99
```

會顯示：

```txt
99+
```

不是只有大於 99 才顯示加號。

### 7.6 `offset` 改的是 margin，不是 top/right

`offset` 會被轉成：

```txt
margin-top
margin-right
```

它不是直接改 `top`、`right`，也不是改變 wrapper 或 default slot 的位置。

---

## 8. Learning Outcome

讀完本目錄後，應該建立以下理解。

1. `Badge` 是低互動展示元件，沒有 emits，也不主動處理使用者互動。
2. `Badge` 的閱讀價值在於展示規則、slot override、computed class 與 style source 對照。
3. `dot`、`status/color`、一般 `count` 是三種互斥 template 模式，且有固定優先序。
4. `text` 會覆蓋一般數字顯示。
5. `#count` 會覆蓋整個數字角標內容，不只是改文字。
6. `#text` 只覆蓋文字內容，仍保留原本 count 或 status 的結構。
7. `color` 會讓元件進入 status layout，不是一般數字角標的顏色設定。
8. `type` 只作用在一般 count badge 的 `ivu-badge-count-{type}` class。
9. `offset` 寫入角標本體的 margin，不改變 wrapper 的布局模型。
10. `alone` 是根據 default slot 是否存在推導出的內部狀態，不是 public prop。
11. `processing` 狀態的動畫不是 Vue runtime 實作，而是在 `badge.less` 中透過 pseudo-element 與 animation 實作。
12. 想完整理解 `Badge`，必須同時看 runtime computed、template branch、type declaration、example 與 `badge.less`。
13. 想理解 `Badge` 如何被全域安裝，不能只在 `src/index.js` 搜尋 `Badge`，還要看 component map 的間接註冊流程。

---

## 9. 適合練習的原始碼閱讀能力

`Badge` 雖然不是大型元件，但它很適合練習幾種元件庫閱讀能力。

### 9.1 從 public API 回推 runtime 行為

你可以先看 `types/badge.d.ts` 或官方 example，知道使用者能傳哪些 props，再回到 `badge.vue` 看這些 props 實際如何影響 template branch 與 computed。

這種能力適合用在閱讀任何 UI 元件庫，因為 public API 往往只是表面，真正的行為邊界要看 runtime。

### 9.2 從 template branch 判斷互斥模式

`Badge` 的 `dot`、`status || color`、count 是典型的互斥分支。這可以訓練你不要只看 props 名稱，而要看 template 的條件順序。

很多元件庫都有類似情況：同一個元件看似支援很多 props，但某些 props 其實只在特定 branch 中生效。

### 9.3 從 computed class 對照 Less selector

`countClasses`、`customCountClasses`、`dotClasses`、`statusClasses` 都是很典型的 class computed。閱讀時可以練習：

```txt
computed 產生什麼 class
  -> less 是否有對應 selector
  -> selector 定義什麼視覺行為
```

這是閱讀 Vue 元件庫樣式系統非常常用的方法。

### 9.4 分辨 runtime 行為與 CSS 行為

例如 `processing` 狀態，runtime 只產生 class；真正動畫在 less。這可以訓練你分辨：

```txt
Vue 負責決定狀態
CSS 負責呈現效果
```

這種分工在 UI 元件庫中非常常見。

---

## 10. Self Check

以下問題可以用來確認是否已經掌握本目錄的閱讀主線。

### 10.1 概念理解題

1. 為什麼說 `Badge` 是低互動展示型元件？
2. 低互動元件的閱讀重點，和 `Input`、`Select`、`Modal` 這類元件有什麼不同？
3. 為什麼不能只把 `Badge` 理解成「右上角數字」？
4. `Badge` 的核心轉換鏈可以分成哪五層？

### 10.2 Public API 題

5. `Badge` 的 props 可以分成哪幾組？
6. `count`、`overflowCount`、`showZero` 分別處理什麼問題？
7. `text` 在一般 count branch 和 status branch 中分別扮演什麼角色？
8. `type` 和 `color` 的作用範圍有什麼不同？

### 10.3 Template branch 題

9. `Badge` 的三段 template branch 優先序是什麼？
10. `dot` 和 `status` 同時存在時，哪一個生效？
11. 為什麼 `color="blue"` 會進入 status / color branch？
12. status branch 為什麼不應被理解成右上角角標？

### 10.4 Computed 題

13. `finalCount` 負責決定什麼？
14. `hasCount` 和 `badge` 的分工有什麼不同？
15. `alone` 是如何被推導出來的？
16. `offset` 會被轉成哪兩個 CSS property？

### 10.5 Slot 題

17. default slot 在一般 count 與 dot branch 中扮演什麼角色？
18. `#count` 和 `#text` 的覆蓋層級有什麼差異？
19. 為什麼使用 `#count` 後，數值 `count` 會失去主要顯示作用？

### 10.6 Style 題

20. `ivu-badge-count`、`ivu-badge-dot`、`ivu-badge-status-dot` 的 layout model 有什麼不同？
21. 為什麼 `ivu-badge` root wrapper 需要 `position: relative`？
22. `processing` 動畫在哪裡定義？
23. 內建 `color` 和自訂 `color` 在樣式路徑上有什麼差異？

### 10.7 原始碼閱讀題

24. 如果你想確認 `Badge` 的 public props typing，應該看哪個檔案？
25. 如果你想確認 `Badge` 是否被全域安裝，應該看哪幾個檔案？
26. 如果你想知道 `offset` 的實際 CSS 輸出，應該看哪個 computed？
27. 如果你想知道 `Badge` 的官方使用場景，應該看哪個 example 檔案？

---

## 11. 本章總結

`Badge` 是一個很適合入門閱讀 View UI Plus 原始碼的展示型元件。它沒有複雜互動，也沒有大型狀態管理，但它完整呈現了 UI 元件庫中常見的幾個設計重點：public API、template branch、slot override、computed class、inline style、Less selector、typed export 與 plugin install。

閱讀 `Badge` 時，最重要的是不要只看單一檔案，也不要只背 props。正確的閱讀方式是先建立 source map，再理解 props 與 slots 如何進入 template branch，接著看 computed 如何決定內容與可見性，最後回到 `badge.less` 對照定位、色彩、尺寸與動畫。

這組筆記的主線可以簡化成：

```txt
先知道檔案在哪裡
再理解 API 怎麼決定 branch
最後對照 class / style 怎麼形成畫面
```

掌握這條主線後，後續閱讀其他 View UI Plus 展示型元件，例如 `Tag`、`Avatar`、`Badge` 類似元件時，也可以使用同樣的方法。

---

## 12. 後續延伸方向

這份 README 是 `Badge` 筆記包的總覽。後續可以再延伸幾個方向。

### 12.1 補一篇 `04-examples-and-edge-cases.md`

可以專門整理官方 example 與邊界組合，例如：

1. `count=0` 與 `showZero`。
2. `dot` 搭配 `count=0`。
3. `dot` 搭配 `status`。
4. `color` 搭配 `text`。
5. `#count` 與 default slot 是否存在。
6. `count=overflowCount` 的顯示結果。

這篇可以用表格方式做成行為測試筆記。

### 12.2 補一篇 `05-badge-vs-tag.md`

`Badge` 和 `Tag` 都有展示狀態、文字、顏色的功能，但設計目的不同。可以比較：

1. `Badge` 的角標定位與 status dot。
2. `Tag` 的標籤語意與可關閉互動。
3. 兩者 color 系統是否相似。
4. 兩者 slot 與 public API 的設計差異。

### 12.3 補一篇 `06-component-library-reading-method.md`

可以把 `Badge` 的閱讀方法抽象成一套通用流程，用於閱讀其他 View UI Plus 元件：

```txt
type declaration
  -> example
  -> runtime template
  -> props / computed / methods
  -> style source
  -> index export
  -> install path
```

這會讓單一元件筆記升級成元件庫原始碼閱讀方法論。

### 12.4 補一篇 `07-implementation-practice.md`

可以根據 `Badge` 的設計，練習自己實作一個簡化版 `MiniBadge`，包含：

1. `count`。
2. `dot`。
3. `showZero`。
4. `overflowCount`。
5. `#count`。
6. `offset`。
7. 基礎 Less / CSS 樣式。

這能幫助讀者把「看懂原始碼」轉成「能自己實作」。

