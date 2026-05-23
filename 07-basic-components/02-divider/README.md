# Divider 原始碼閱讀總覽：從結構型元件理解 props、slot 與樣式系統

## 0. 原始筆記問題分析

原本的 `README.md` 已經清楚指出本目錄聚焦 View UI Plus 的 `Divider` 分隔元件，也整理出 runtime、type declaration、example、style、registry 與 install 等主要閱讀入口。它的優點是能快速讓讀者知道「要看哪些檔案」以及「這個元件大致要理解什麼」。

不過，作為一份放在筆記目錄最前面的總覽型 README，它還可以再補強幾個面向。

第一，原本筆記偏向目錄導覽，對「為什麼 `Divider` 適合作為結構型元件的閱讀範例」說明還可以更完整。`Divider` 雖然程式碼短，但它剛好串起 props、default slot、computed class、DOM 結構與 Less selector，這對學習元件庫原始碼非常有價值。

第二，原本筆記已經列出 source baseline，但還可以把每個入口檔放進更明確的閱讀任務中。讀者不只要知道檔案路徑，也要知道進入該檔案時要觀察什麼、不要被哪些細節分散注意力。

第三，原本筆記有 Notes Index，但各篇筆記之間的知識依賴關係還可以更清楚。例如 `01-source-map.md` 是建立全局地圖，`02-props-slot-and-structure.md` 是理解 runtime 轉換，`03-class-and-style.md` 則是對照 class 與 Less 視覺規則。這三篇不是並列速查，而是有明確閱讀順序。

第四，原本的 Self Check 問題方向正確，但可以擴充成「學完本目錄後應該具備哪些判斷能力」。這樣 README 不只是入口，也能作為學習完成後的驗收清單。

本次重構會將這份 README 改寫成一份「Divider 原始碼閱讀導讀」，讓它同時具備目錄索引、學習定位、閱讀路線與複習檢查的功能。

---

## 1. 本目錄定位

本目錄聚焦 View UI Plus 的 `Divider` 分隔元件。`Divider` 是一個基礎元件，表面上只是在畫一條分隔線，但它很適合用來觀察元件庫如何把簡單 API 轉換成穩定的 DOM 結構與可維護的樣式規則。

`Divider` 不屬於高互動元件。它不處理 `click`，不宣告 `emits`，也沒有複雜的 methods 或非同步流程。它的主要任務不是管理資料流，而是根據使用者傳入的 props 與 default slot，產生對應的 DOM 與 class，再交給 Less 樣式系統完成視覺呈現。

可以先用下面這條轉換鏈理解整個元件：

```txt
props / default slot
  -> hasSlot
  -> classes / slotClasses
  -> root div / inner text span
  -> divider.less 視覺規則
```

這條鏈是閱讀 `Divider` 的主軸。只要掌握這條主軸，就能理解為什麼 `Divider` 的 runtime source 很短，卻仍然需要同時對照 type declaration、example 與 style source。

---

## 2. 為什麼 `Divider` 適合接在 `Icon` 後面閱讀？

如果前一個元件是 `Icon`，那麼 `Divider` 是很自然的下一個閱讀對象。

`Icon` 可以幫助建立最基礎的 props-to-class 模型：使用者傳入某些 props，元件根據 props 產生 class，最後由 CSS 或 icon font 呈現圖示。這是一種非常小而清楚的元件閱讀單位。

`Divider` 在這個模型上多了兩個重要觀察點。

第一，`Divider` 多了 default slot。這代表它不是只根據 props 決定樣式，還會根據「使用者是否放入內容」改變 DOM 結構。沒有 slot 時，它只是一條線；有 slot 時，它會多渲染一個 `span`，並加上帶文字分隔線相關 class。

第二，`Divider` 的樣式實作不只依靠單一 class。普通水平線、垂直線、虛線與帶文字分隔線背後使用的 CSS 技術不同。普通水平線主要靠 root background 與 `height: 1px`，虛線改用 `border-top`，帶文字分隔線則需要 `:before` 與 `:after` 產生左右線段。

因此，閱讀 `Divider` 可以讓你從「props 產生 class」進一步走到「slot 改變結構」與「class 組合驅動複合樣式」這兩個更接近元件庫實務的主題。

---

## 3. Source Baseline

本目錄以本地保存的 View UI Plus `v1.3.20` 原始碼為閱讀基準。以下路徑是理解 `Divider` 時需要互相對照的主要檔案。

| 類型 | 路徑 | 主要閱讀任務 |
| --- | --- | --- |
| Runtime | `01-origin/source/view-ui-plus-v1.3.20/src/components/divider/divider.vue` | 確認 props、`hasSlot`、`classes`、`slotClasses` 與 template 結構。 |
| Type | `01-origin/source/view-ui-plus-v1.3.20/types/divider.d.ts` | 對照 `Divider` 對外公開的 TypeScript contract，確認 public API。 |
| Example | `01-origin/source/view-ui-plus-v1.3.20/examples/routers/divider.vue` | 觀察官方示範的水平、垂直、帶文字、虛線、尺寸與 plain 用法。 |
| Style | `01-origin/source/view-ui-plus-v1.3.20/src/styles/components/divider.less` | 對照 `ivu-divider-*` class 如何被 Less selector 轉成實際視覺規則。 |
| Registry | `01-origin/source/view-ui-plus-v1.3.20/src/components/index.js` | 確認 `Divider` 是否被納入元件庫的 public export。 |
| Install | `01-origin/source/view-ui-plus-v1.3.20/src/index.js` | 確認完整安裝 View UI Plus 時，`Divider` 是否會被全域註冊。 |

這張表不只是檔案索引，而是提醒你：元件庫中的一個 public component 通常不是只靠單一 `.vue` 檔就能完整理解。runtime source 告訴你邏輯與結構，type declaration 告訴你公開契約，example 告訴你官方希望使用者怎麼用，style source 則告訴你畫面真正如何被呈現。

---

## 4. 核心閱讀模型

閱讀 `Divider` 時，建議先把注意力集中在「輸入如何變成輸出」。

### 4.1 使用者輸入：props 與 default slot

`Divider` 的 public API 很小，主要由五個 props 與一個 default slot 組成。

| 輸入 | 角色 | 主要影響 |
| --- | --- | --- |
| `type` | 決定分隔線方向 | 產生水平或垂直分隔線 class。 |
| `orientation` | 決定帶文字分隔線的文字位置 | 在有 default slot 時影響 `with-text-left`、`with-text-right` 或置中樣式。 |
| `dashed` | 決定是否使用虛線 | 加上 dashed class，讓 Less 改變線條畫法。 |
| `size` | 決定尺寸樣式 | 主要影響帶文字分隔線的字級與上下間距。 |
| `plain` | 決定文字是否回到普通正文樣式 | 主要影響帶文字分隔線的文字色、字重與字級。 |
| default slot | 決定是否有分隔文字 | 影響是否渲染 inner text span，並改變 root class 組合。 |

這裡最容易被誤解的是 `orientation`。它不是用來控制水平或垂直方向，方向由 `type` 控制；`orientation` 控制的是帶文字分隔線中的文字位置，而且要有 default slot 才有主要視覺意義。

### 4.2 Runtime 判斷：`hasSlot`

`Divider` 的核心分岔點是 `hasSlot`。它判斷使用者是否傳入 default slot，並進一步影響兩件事：

1. template 是否渲染內層文字節點。
2. root class 是否加上 `with-text` 相關 class。

換句話說，`hasSlot` 是 `Divider` 從「純線條」進入「帶文字分隔線」的入口。這也是閱讀 `Divider` 時最重要的 runtime 判斷。

### 4.3 DOM 輸出：root div 與 inner text span

`Divider` 的 template 可以概念化成兩種形態。

沒有 default slot 時：

```html
<div class="ivu-divider ivu-divider-horizontal ivu-divider-default"></div>
```

有 default slot 時：

```html
<div class="ivu-divider ivu-divider-horizontal ivu-divider-default ivu-divider-with-text ivu-divider-with-text-center">
  <span class="ivu-divider-inner-text">Text</span>
</div>
```

這個差異看似很小，但對樣式層非常重要。因為帶文字分隔線不是單純在一條線上放文字，而是透過 root class、inner text span、`:before` 與 `:after` 一起組合出來。

### 4.4 Style 呈現：Less selector 接手視覺規則

runtime 並不直接用 inline style 畫線，而是輸出 `ivu-divider-*` class。真正的視覺效果由 `divider.less` 決定。

你可以把 Less 視為第二層邏輯：runtime 負責說「現在是水平線、垂直線、帶文字、虛線或 plain」，Less 負責決定這些狀態在 CSS 上要如何呈現。

---

## 5. Notes Index 與建議閱讀順序

本目錄目前包含三篇主要筆記，建議按照以下順序閱讀。

| 順序 | 筆記 | 主題 | 建議閱讀目的 |
| --- | --- | --- | --- |
| 1 | `01-source-map.md` | 原始碼入口地圖 | 先建立全局視角，知道 runtime、type、style、example、registry 與 install 各自在哪裡。 |
| 2 | `02-props-slot-and-structure.md` | props、slot 與 DOM 結構 | 理解 `type / orientation / dashed / size / plain` 如何影響 `hasSlot`、class 與 DOM。 |
| 3 | `03-class-and-style.md` | class 與 Less 對照 | 理解普通水平線、垂直線、虛線、帶文字線、plain 與 small 尺寸如何被樣式化。 |

這三篇的關係不是單純並列，而是從外到內、再從 runtime 走向 style。

```txt
01-source-map.md
  -> 建立檔案地圖與閱讀入口

02-props-slot-and-structure.md
  -> 理解 props / slot 如何變成 DOM 與 class

03-class-and-style.md
  -> 理解 class 如何命中 Less selector 並形成畫面
```

如果你是第一次閱讀 View UI Plus 的 `Divider`，不要一開始就跳進 `divider.less`。比較好的方式是先知道有哪些檔案，再理解 runtime class 的來源，最後才看樣式規則如何吃掉這些 class。

---

## 6. 閱讀時要抓住的三個核心問題

### 6.1 `Divider` 如何用很小的 public API 表達多種視覺情境？

`Divider` 的 public API 不多，但能表達常見的分隔線需求。例如：

```vue
<Divider />
<Divider dashed />
<Divider>Title</Divider>
<Divider orientation="left">Title</Divider>
<Divider type="vertical" />
<Divider plain>Title</Divider>
```

這些用法看起來差異不大，但對 runtime 與 Less 來說會產生不同 class 組合。閱讀時要觀察的不是「它有多少 API」，而是「少量 API 如何被轉譯成穩定的 class contract」。

### 6.2 default slot 如何改變元件結構？

沒有 default slot 時，`Divider` 只是根節點加上一組方向與修飾 class。

有 default slot 時，元件會額外渲染 `ivu-divider-inner-text`，並讓 root class 進入帶文字分隔線模式。這代表 default slot 不只是填內容，它會改變樣式系統命中的 selector。

因此，閱讀 slot 時不能只看 `<slot></slot>` 本身，而要追蹤它如何影響 `hasSlot`、`classes` 與 template。

### 6.3 線條真正是怎麼畫出來的？

`Divider` 的線條不一定由同一種 CSS 技術產生。

| 情境 | 主要 CSS 技術 | 理解重點 |
| --- | --- | --- |
| 普通水平線 | root background + `height: 1px` | 根節點本身就是線。 |
| 垂直線 | `inline-block` + `width: 1px` + `height: 0.9em` | 適合放在行內內容或操作項之間。 |
| 普通虛線 | `border-top: 1px dashed` | 改用 border 畫線，而不是 background。 |
| 帶文字線 | `:before` / `:after` + border | 左右線段由 pseudo-elements 產生。 |
| 帶文字虛線 | pseudo-elements 的 border style 改成 dashed | 不能只改 root border，否則會和帶文字結構不一致。 |

這也是為什麼 `Divider` 雖然 runtime 很短，卻仍然值得獨立閱讀 style source。

---

## 7. 學習完成後應建立的理解

讀完本目錄後，你應該能建立以下判斷能力。

| 能力 | 具體表現 |
| --- | --- |
| 辨識低互動結構型元件 | 能說明 `Divider` 為什麼不是事件型元件，而是 props / slot / class / style 轉換型元件。 |
| 拆解 public API | 能說明 `type`、`orientation`、`dashed`、`size`、`plain` 各自負責什麼。 |
| 追蹤 slot 影響 | 能說明 default slot 如何影響 `hasSlot`、inner text span 與 `with-text` class。 |
| 連接 runtime 與 style | 能從 Vue 使用方式推導可能出現的 `ivu-divider-*` class，再回到 Less 找對應 selector。 |
| 判斷 CSS 畫線方式 | 能區分普通線、虛線、帶文字線分別主要由 background、border 或 pseudo-elements 產生。 |
| 閱讀元件庫 public surface | 能理解 registry 與 install 檔案為什麼也屬於元件閱讀範圍。 |

這些能力不只適用於 `Divider`。之後閱讀 `Button`、`Tag`、`Alert`、`Timeline` 或其他基礎元件時，也可以用類似方式拆解：先找 public API，再看 runtime 結構，最後對照 style source。

---

## 8. 常見誤區

| 誤區 | 為什麼容易誤解 | 正確理解 |
| --- | --- | --- |
| `Divider` 只是畫一條線，不值得讀 | runtime source 很短，表面上看起來沒有邏輯 | 它適合練習 props、slot、class 與 style source 的串接閱讀。 |
| 只看 `divider.vue` 就等於讀完元件 | `.vue` 檔確實包含 props 與 template | 真正的線條畫法在 `divider.less`，public contract 還要看 type 與 example。 |
| `orientation` 控制水平或垂直 | 名稱容易被理解成方向 | 水平 / 垂直由 `type` 控制，`orientation` 控制帶文字分隔線的文字位置。 |
| 有 `orientation` 就一定有可見效果 | prop 可以單獨傳入 | 沒有 default slot 時，不會渲染 inner text，文字位置幾乎沒有可見意義。 |
| `plain` 是另一種分隔線類型 | plain 聽起來像整體樣式模式 | 它主要讓帶文字分隔線的文字回到普通正文樣式。 |
| 所有線條都由 background 畫出 | 普通水平線確實使用 background | 虛線與帶文字線使用不同 CSS 技術，需要回到 Less 對照。 |

---

## 9. 建議的實際閱讀方法

閱讀 `Divider` 時，可以按照以下步驟進行。

### 9.1 第一輪：先建立地圖

先讀 `01-source-map.md`。這一輪不要深入每個 selector，也不要急著背所有 class。目標只是知道：

1. runtime 在哪裡。
2. type declaration 在哪裡。
3. examples 在哪裡。
4. style source 在哪裡。
5. registry 與 install 如何確認元件被公開。

第一輪讀完後，你應該能畫出 `Divider` 的 source map。

### 9.2 第二輪：追蹤 runtime 輸出

接著讀 `02-props-slot-and-structure.md`。這一輪要把注意力放在：

1. props 的預設值與 validator。
2. `hasSlot` 的判斷。
3. `classes` 如何組合。
4. `slotClasses` 如何產生。
5. 有 slot 與沒有 slot 時的 DOM 差異。

這一輪讀完後，你應該能從一段 Vue 使用方式推導出大致 DOM 與 class。

### 9.3 第三輪：對照 Less 命中規則

最後讀 `03-class-and-style.md`。這一輪要把 runtime 產生的 class 帶回 `divider.less`，觀察它們如何命中 selector。

例如：

```vue
<Divider orientation="left" dashed>Title</Divider>
```

你應該能推導它至少會涉及：

```txt
ivu-divider-horizontal
ivu-divider-with-text-left
ivu-divider-dashed
ivu-divider-inner-text
```

接著再回到 Less 看：

1. 帶文字線的基本規則。
2. left 位置如何調整 `:before` 與 `:after` 的寬度。
3. dashed 如何改 pseudo-elements 的 border style。
4. inner text padding 如何被設定。

這樣閱讀就不會停留在「看過程式碼」，而是能建立 runtime 與 style 的連接能力。

---

## 10. 後續延伸方向

`Divider` 本身是一個小元件，但它可以延伸出幾個值得獨立整理的主題。

| 延伸主題 | 可以深入的問題 |
| --- | --- |
| 結構型元件設計 | 什麼樣的元件主要負責輸出穩定 DOM 與 class，而不是管理事件或資料？ |
| Slot 對 DOM 結構的影響 | default slot 何時只是內容插槽，何時會改變元件的結構與樣式模式？ |
| Class contract | 元件庫如何把 runtime class 當成 Vue component 與 Less source 之間的契約？ |
| Pseudo-elements | 為什麼帶文字分隔線適合使用 `:before` 與 `:after` 畫左右線？ |
| Type declaration 與 runtime validator | 為什麼 `.d.ts` 與 runtime validator 可能存在寬窄差異？閱讀時應以什麼方式對照？ |
| Public surface | `components/index.js` 與 `src/index.js` 如何影響元件是否對使用者可用？ |

如果後續要繼續閱讀 View UI Plus 的其他元件，可以把 `Divider` 的閱讀方法當作模板：先建立 source map，再拆 props 與 slot，最後把 class 帶回 style source。

---

## 11. 本章總結

`Divider` 是一個很適合作為元件庫原始碼閱讀練習的基礎元件。它的 runtime source 不複雜，但能完整展示低互動結構型元件的核心設計：使用者提供 props 與 default slot，元件透過 `hasSlot` 與 computed class 產生穩定 DOM 結構，最後交給 `divider.less` 實作水平線、垂直線、虛線、帶文字線與 plain 文字樣式。

閱讀這個目錄時，不應只把 `Divider` 理解成「一條線」。更重要的是透過它練習一套可重複使用的原始碼閱讀方法：看 public API、看 runtime 結構、看 class contract、看 style source、看 examples 與 public registration。

掌握這套方法後，之後閱讀更複雜的元件時，就比較不會被大量程式碼淹沒，而能先抓住「輸入、轉換、輸出、樣式落地」這條主線。

---

## 12. 自我檢查問題

1. 為什麼 `Divider` 適合被歸類為低互動結構型元件？
2. `Divider` 的核心轉換鏈可以如何描述？
3. `type` 與 `orientation` 的責任差異是什麼？
4. `hasSlot` 會同時影響哪些 DOM 與 class 行為？
5. 沒有 default slot 時，`orientation="left"` 為什麼幾乎沒有主要可見意義？
6. 普通水平分隔線、普通虛線、帶文字分隔線分別主要由哪種 CSS 技術畫出？
7. 為什麼帶文字虛線不能只依靠 root element 的 `border-top`？
8. `plain` 主要改變的是線條本身，還是帶文字分隔線的文字樣式？
9. 為什麼閱讀 public component 時，除了 `.vue` 檔，也要看 `.d.ts`、examples、style source、registry 與 install？
10. 如果給你 `<Divider orientation="right" dashed plain>Title</Divider>`，你能推導出它大致會涉及哪些 class 與哪些 Less 規則嗎？
