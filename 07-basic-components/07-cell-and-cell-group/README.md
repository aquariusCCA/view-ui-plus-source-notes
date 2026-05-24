# View UI Plus Cell / CellGroup 原始碼閱讀筆記包 README

## 0. 原始筆記問題分析

原始 README 已經具備清楚的方向：它指出本目錄聚焦 `Cell`、`CellItem` 與 `CellGroup`，並且提醒讀者不要只把 `Cell` 理解成普通列表項，而要看到它背後串起的 `CellGroup`、`Cell`、`CellItem`、`link mixin`、`cell.less` 與 `globalConfig` 轉換鏈。

不過，作為整個筆記包的入口文件，原始版本還可以再補強幾個地方：

1. **定位可以更明確**：原始 README 已經像總覽，但還沒有清楚說明它與 `01` 到 `04` 四篇筆記之間的分工。對初學者來說，容易不知道應該先把 README 當導讀，還是當完整內容閱讀。
2. **心智模型可以更完整**：原文列出轉換鏈，但還可以進一步解釋每一層在整個元件系統中的角色，例如 public component、internal layout、shared mixin、style system、global config 各自解決什麼問題。
3. **Source Baseline 表格已經有價值，但需要補閱讀方式**：原文列出 runtime、style、type、example、registry、install 等檔案，但可以再補充「這些檔案應該怎麼搭配閱讀」，避免表格只變成路徑索引。
4. **Reading Focus 已經抓到重點，但可以轉成學習路線**：原文把問題拆成元件邊界、public contract、展示結構、事件導頁、樣式箭頭五類，這很好；但若補上初次閱讀、深入閱讀與回查閱讀路線，會更適合作為 README。
5. **Self Check 可以更有層次**：原始問題已經能檢查理解，但可以分成概念理解、流程推理、原始碼閱讀與實務判斷，讓讀者知道自己在測哪一種能力。
6. **資訊邊界需要標註**：目前 README 以本地保存的 View UI Plus `v1.3.20` 為基準。若未來版本更新，`disabled`、`link mixin`、`globalConfig` 或 class 行為可能改變，因此本 README 的結論應以該版本 source 為準。

---

## 1. 本章定位

這份 README 是 `Cell / CellGroup` 原始碼閱讀筆記包的**入口導讀**。它的任務不是逐行解釋 `cell.vue`，也不是取代後續四篇細節筆記，而是先幫讀者建立一張總地圖。

讀完這份 README 後，你應該能回答三個問題：

1. `Cell / CellGroup` 這組元件在 View UI Plus 中大致解決什麼問題？
2. 閱讀這組元件時，應該同時觀察哪些來源：runtime、internal component、mixin、style、type declaration、example、registry 與 install？
3. 後續四篇筆記應該按照什麼順序閱讀，各自要解決什麼問題？

這份 README 不深入展開以下內容：

- 不逐行分析 `Cell` 的 click handler。
- 不逐行分析 `mixins/link.js` 的 navigation 分支。
- 不完整展開 `cell.less` 與 `.select-item()` 的每一個 selector。
- 不詳細分析 `types/cell.d.ts` 的完整型別宣告。
- 不處理其他 View UI Plus 元件和 `Cell` 的共用設計模式。

這些內容會分別留到 `01-source-map.md`、`02-public-contract-and-component-boundary.md`、`03-click-link-and-provide-inject-flow.md`、`04-render-style-arrow-and-global-config.md` 逐步拆解。

---

## 2. 學習前先建立的基本觀念

### 2.1 `Cell / CellGroup` 不是單純的列表樣式

`Cell / CellGroup` 表面上像是一組列表行元件。你可能會直覺地認為它只是把 `title`、`label`、`extra` 排成一行，但這樣理解會漏掉它真正值得學習的地方。

這組元件同時連接了幾種前端元件開發中常見的能力：

| 能力 | 在 `Cell / CellGroup` 中的表現 |
| --- | --- |
| 容器與子項分工 | `CellGroup` 是群組容器，`Cell` 是 public item。 |
| 內部展示封裝 | `CellItem` 負責固定 DOM 結構，但不對外匯出。 |
| 父子通訊 | `CellGroup` provide 自己，`Cell` inject 後回報 click。 |
| 導頁能力重用 | `Cell` 透過 `mixins/link.js` 取得 `to`、`replace`、`target`、`append` 與 navigation 行為。 |
| 樣式狀態分離 | `disabled`、`selected`、`with-link` 先轉成 class，再由 Less 決定視覺。 |
| 全域設定 | 箭頭 icon 可由 `$VIEWUI.cell` 的全域設定影響。 |
| 型別契約 | `types/cell.d.ts` 描述 public props、slots 與事件。 |

所以，這組元件雖然 runtime 不長，但它是一個很適合練習「小型元件如何串接 public API、internal layout、父子通訊、mixin 與樣式系統」的案例。

### 2.2 讀元件不能只看 `.vue`

閱讀 View UI Plus 這類元件庫時，如果只打開 `cell.vue`，你會看到部分 props、template 與 click handler，但仍然會漏掉很多 public 行為。

例如：

- `to`、`replace`、`target`、`append` 來自 `mixins/link.js`，不是 `cell.vue` 自己宣告的 props。
- `disabled` 與 `selected` 的視覺效果需要看 `cell.less` 與 `mixins/select.less`。
- `Cell` / `CellGroup` 是否為 public component，要看 registry、entry 與 type export。
- 箭頭預設值與全域設定來源，要看 `globalConfig.js` 與 `src/index.js`。
- 使用者實際會怎麼使用，要看 example。

因此，本筆記包不是只讀一個檔案，而是讀一組互相支撐的檔案。

### 2.3 public component 與 internal component 要分清楚

這組元件中有三個 runtime component：

```txt
CellGroup
  -> Cell
      -> CellItem
```

但不是每一個 component 都是使用者應該依賴的 public API。

| 元件 | 對使用者是否 public | 說明 |
| --- | --- | --- |
| `CellGroup` | 是 | 對外提供群組容器與 `on-click` 事件。 |
| `Cell` | 是 | 對外提供列表項能力，接收 props、slots、link props 與 click。 |
| `CellItem` | 否 | 只作為 `Cell` 的內部展示結構，負責 icon、title、label、extra 的 DOM 排版。 |

分清楚這個邊界非常重要。`CellItem` 存在的目的不是讓使用者直接使用，而是讓 `Cell` 的 template 不要承擔所有展示結構。

---

## 3. 整體概覽

### 3.1 這組元件的核心轉換鏈

閱讀 `Cell` 時，可以把整體行為想成一條由外到內、再由內回到外的流程：

```txt
使用者撰寫 <CellGroup>
  -> <CellGroup> 包住 slot
  -> CellGroup provide CellGroupInstance
  -> 使用者撰寫 <Cell>
  -> Cell 接收 props / slots / link props
  -> Cell 根據 to 決定輸出 <a> 或 <div>
  -> Cell 把 title / label / extra / icon 交給 CellItem
  -> CellItem 產生固定展示結構
  -> Cell 被點擊
  -> Cell 呼叫 CellGroupInstance.handleClick(name)
  -> CellGroup 對外 emit on-click(name)
  -> 若 Cell 有 to，交給 link mixin 處理 router / window navigation
  -> class、cell.less、select.less、globalConfig 共同決定視覺與箭頭
```

這條線可以幫助你避免兩種常見誤讀：

1. **只從畫面理解 `Cell`**：你會以為它只是 title / label / extra 的排版。
2. **只從 props 理解 `Cell`**：你會漏掉父子通訊、mixin 導頁、Less 樣式、全域 arrow 設定與 type declaration。

### 3.2 本筆記包的四篇主文

這個 README 之後，建議依序閱讀四篇筆記：

| 順序 | 筆記 | 主題 | 主要解決的問題 |
| --- | --- | --- | --- |
| 1 | `01-source-map.md` | 原始碼入口與責任分工 | 先建立 runtime、style、type、example、mixin、registry、install 的來源地圖。 |
| 2 | `02-public-contract-and-component-boundary.md` | public contract 與元件邊界 | 釐清 `Cell` props / slots、`CellGroup` event、`CellItem` internal layout 與 inject 邊界。 |
| 3 | `03-click-link-and-provide-inject-flow.md` | click、link 與 provide/inject 流程 | 理解一次 click 如何同時觸發 group event 與 link navigation。 |
| 4 | `04-render-style-arrow-and-global-config.md` | render、樣式、箭頭與全域設定 | 理解 `<a>` / `<div>` branch、class mapping、Less、arrow slot 與 `$VIEWUI.cell`。 |

這四篇不是彼此獨立的零散筆記，而是從「先找地圖」到「理解契約」，再到「理解流程」，最後到「對照畫面」的漸進式閱讀路線。

---

## 4. 核心內容逐步講解

### 4.1 先看 Source Baseline：確認自己正在讀哪個版本

本目錄以本地保存的 View UI Plus `v1.3.20` 原始碼為閱讀基準。這一點很重要，因為元件庫的內部實作可能會隨版本調整。

例如，未來版本可能修改：

- `disabled` 是否阻止 click。
- `Cell` 是否仍直接 inject `CellGroupInstance`。
- `mixins/link.js` 對 `target="_blank"` 的處理。
- `$VIEWUI.cell` 全域 arrow 設定方式。
- `cell.less` 或 `.select-item()` 的 selector 結構。

因此，本筆記包的細節結論都應該先回到 `v1.3.20` source 驗證。

### 4.2 Runtime 檔案：理解元件實際行為

Runtime 是這組元件的第一層核心，主要包含三個 component：

| Runtime 檔案 | 負責角色 | 初次閱讀重點 |
| --- | --- | --- |
| `src/components/cell/cell.vue` | `Cell` public item | 看 props、slots、`to` branch、click handler、arrow 與 class。 |
| `src/components/cell/cell-item.vue` | internal layout | 看 icon、main、title、label、footer、extra 的固定 DOM 結構。 |
| `src/components/cell/cell-group.vue` | `CellGroup` public container | 看 `provide()`、`handleClick()` 與 `on-click` emit。 |

這三個檔案要一起讀。`CellGroup` 負責提供父層 instance，`Cell` 負責接收使用者輸入並處理 click / link，`CellItem` 負責展示結構。如果只讀 `Cell`，你會知道它引用 `CellItem`，但不會知道每個 slot 最後落到哪個 DOM 區域；如果只讀 `CellGroup`，你會看到 `on-click`，但不知道子項何時呼叫它。

### 4.3 Entry、Registry 與 Install：確認什麼是 public component

元件庫和一般業務專案不同。對元件庫來說，「檔案存在」不代表它是 public API；要看它有沒有被對外匯出、註冊與宣告型別。

本組元件中：

| 檔案 | 閱讀目的 |
| --- | --- |
| `src/components/cell/index.js` | 確認 `Cell` 的單元件入口匯出。 |
| `src/components/cell-group/index.js` | 確認 `CellGroup` 的單元件入口匯出。 |
| `src/components/index.js` | 確認 `Cell` / `CellGroup` 進入 component public export。 |
| `src/index.js` | 確認全域安裝、元件註冊與 `$VIEWUI.cell` 預設值。 |
| `types/viewuiplus.components.d.ts` | 確認 TypeScript public export。 |

這些檔案的閱讀價值在於幫你判斷邊界：`Cell` 與 `CellGroup` 是 public component，`CellItem` 則只是 runtime internal component。這也是為什麼筆記中不應把 `CellItem` 當成使用者可直接依賴的元件來介紹。

### 4.4 Public Contract：理解使用者能傳什麼、聽什麼、插入什麼

`Cell` 的 public contract 不能只看 `cell.vue` 的 props，因為它混入了 `mixins/link.js`。因此，完整的對外能力至少包含三塊：

```txt
Cell own props
  -> name / title / label / extra / disabled / selected

Link mixin props
  -> to / replace / target / append

Slots
  -> default / icon / label / extra / arrow
```

`CellGroup` 則相對單純：

```txt
CellGroup
  props: none
  slots: default
  events: on-click(name)
```

這裡最容易誤會的是 `disabled` 與 `selected`。在這份 source 中，它們主要是「視覺輸入」，也就是產生 class 後交給樣式層處理。`selected` 不會建立內部選取狀態，`disabled` 也不會自動阻止 click、`on-click` 或 navigation。

### 4.5 Event Flow：理解一次 click 有兩段流程

點擊 `Cell` 時，不是只有導頁，也不是只有 emit event。更準確地說，它包含兩段流程：

```txt
第一段：回報 group
Cell click
  -> CellGroupInstance.handleClick(name)
  -> CellGroup emit on-click(name)

第二段：處理 link
Cell click
  -> handleCheckClick(event, new_window)
  -> 根據 to / target / router / replace / ctrl / meta 決定 navigation
```

對有 `to` 的 `Cell` 來說，這兩段流程會出現在同一次點擊中，而且 group event 會先於 navigation。這個時序對實務很重要，因為你可能會在 `@on-click` 中做選中狀態同步、log、埋點或其他業務處理。

### 4.6 Render 與 Style：理解畫面不是 template 單獨決定的

`Cell` 的畫面由多層共同決定：

```txt
Cell props / slots / globalConfig
  -> computed classes
  -> to branch: <a> 或 <div>
  -> CellItem DOM
  -> optional arrow
  -> cell.less 結構樣式
  -> select.less item 共用樣式
```

其中幾個重要規則是：

- 有 `to` 時，中間 wrapper 是 `<a>`，並且會顯示 arrow。
- 沒有 `to` 時，中間 wrapper 是 `<div>`，不顯示 arrow。
- `selected`、`disabled`、`with-link` 先變成根 class。
- footer 與 arrow 的位置由 `cell.less` absolute positioning 處理。
- padding、hover、disabled、selected 的部分行為來自 `.select-item()` mixin。
- arrow 可以由 `#arrow` slot 直接覆蓋，也可以由 `$VIEWUI.cell.arrow/customArrow/arrowSize` 改變預設 Icon。

這表示你不能只看 template，也不能只看 Less。正確做法是把 render branch、class mapping 與 Less selector 對照起來看。

---

## 5. 表格整理

### 5.1 原始碼來源地圖

| 類型 | 路徑 | 角色 | 閱讀重點 |
| --- | --- | --- | --- |
| Runtime | `01-origin/source/view-ui-plus-v1.3.20/src/components/cell/cell.vue` | `Cell` 的主要實作 | 看 props、slots、class、click、link wrapper 與 arrow。 |
| Runtime internal | `01-origin/source/view-ui-plus-v1.3.20/src/components/cell/cell-item.vue` | `Cell` 的內部展示結構 | 看 icon、title、label、extra 如何被固定排版。 |
| Runtime group | `01-origin/source/view-ui-plus-v1.3.20/src/components/cell/cell-group.vue` | `CellGroup` 的容器與事件出口 | 看 provide `CellGroupInstance` 與 emit `on-click`。 |
| Runtime entry | `01-origin/source/view-ui-plus-v1.3.20/src/components/cell/index.js` | `Cell` 單元件入口 | 確認 `Cell` 如何被單獨匯出。 |
| Runtime entry | `01-origin/source/view-ui-plus-v1.3.20/src/components/cell-group/index.js` | `CellGroup` 單元件入口 | 確認 `CellGroup` 如何被單獨匯出。 |
| Shared logic | `01-origin/source/view-ui-plus-v1.3.20/src/mixins/link.js` | 導頁能力來源 | 看 `to`、`replace`、`target`、`append` 與 router / window navigation。 |
| Shared logic | `01-origin/source/view-ui-plus-v1.3.20/src/mixins/globalConfig.js` | 全域設定來源 | 看 `Cell` 如何讀取 `$VIEWUI.cell`。 |
| Style | `01-origin/source/view-ui-plus-v1.3.20/src/styles/components/cell.less` | `Cell` 專屬樣式 | 看 icon、main、label、footer、arrow、selected、disabled。 |
| Style mixin | `01-origin/source/view-ui-plus-v1.3.20/src/styles/mixins/select.less` | item 共用樣式 | 看 hover、disabled、selected、padding 等共用 item 規則。 |
| Type declaration | `01-origin/source/view-ui-plus-v1.3.20/types/cell.d.ts` | public TypeScript contract | 看 `Cell` / `CellGroup` props、slots、listener 型別。 |
| Global options type | `01-origin/source/view-ui-plus-v1.3.20/types/index.d.ts` | install options 型別 | 看 `cell.arrow/customArrow/arrowSize` 的設定形狀。 |
| Example | `01-origin/source/view-ui-plus-v1.3.20/examples/routers/cell.vue` | 官方使用場景 | 看 group、selected、disabled、extra、link、`on-click` 的示例。 |
| Registry | `01-origin/source/view-ui-plus-v1.3.20/src/components/index.js` | public component registry | 確認 `Cell` / `CellGroup` 進入對外 component export。 |
| Install | `01-origin/source/view-ui-plus-v1.3.20/src/index.js` | plugin install | 確認全域註冊與 `$VIEWUI.cell` 預設值。 |

這張表不是用來一次背完所有檔案，而是讓你在閱讀時知道「某個問題應該回到哪裡查」。例如：想確認 `disabled` 會不會阻止 click，要看 runtime；想確認 disabled 畫面變化，要看 style；想確認使用者能不能傳 `target`，要看 mixin 和 `.d.ts`。

### 5.2 五大閱讀焦點

| 焦點 | 要回答的問題 | 對應筆記 |
| --- | --- | --- |
| 元件邊界 | `CellGroup`、`Cell`、`CellItem` 誰是 public？誰是 internal？ | `01-source-map.md`、`02-public-contract-and-component-boundary.md` |
| Public contract | 使用者可以傳哪些 props、slots、event？ | `02-public-contract-and-component-boundary.md` |
| 展示結構 | title、label、extra、icon 最後落在哪個 DOM 區塊？ | `02-public-contract-and-component-boundary.md`、`04-render-style-arrow-and-global-config.md` |
| 事件與導頁 | click 時 group event 與 navigation 的順序是什麼？ | `03-click-link-and-provide-inject-flow.md` |
| 樣式與箭頭 | class、Less、arrow slot、global config 如何共同決定畫面？ | `04-render-style-arrow-and-global-config.md` |

---

## 6. 範例或情境說明

### 6.1 使用者如何使用這組元件

一個典型使用情境可能長這樣：

```vue
<CellGroup @on-click="handleCellClick">
    <Cell
        name="profile"
        title="個人資料"
        label="查看帳號與基本資訊"
        extra="已完成"
        to="/profile"
    />

    <Cell
        name="settings"
        title="設定"
        label="偏好設定與通知管理"
        selected
    />

    <Cell
        name="disabled-item"
        title="暫不可用"
        disabled
    />
</CellGroup>
```

從使用者角度看，這只是一組列表行。但從 source 角度看，這段 template 會牽動多個機制：

1. `CellGroup` 提供 `CellGroupInstance`。
2. 每個 `Cell` 被點擊時回報自己的 `name`。
3. 有 `to="/profile"` 的 `Cell` 會走 link branch，輸出 `<a>` 並顯示 arrow。
4. `selected` 只轉成 selected class，不會自動管理選中狀態。
5. `disabled` 只轉成 disabled class，不會自動阻止 click。
6. `title`、`label`、`extra` 會被交給 `CellItem` 渲染到固定區塊。

### 6.2 初學者應該怎麼讀這段範例

讀這段範例時，不要只問「畫面長怎樣」，要改問以下問題：

| 問題 | 要回 source 查哪裡 |
| --- | --- |
| `@on-click` 是誰 emit 的？ | `cell-group.vue` |
| `name` 是怎麼傳出去的？ | `cell.vue` 的 click handler 與 `CellGroupInstance.handleClick()` |
| `to` 為什麼會導頁？ | `mixins/link.js` |
| 有 `to` 為什麼會出現 arrow？ | `cell.vue` render branch 與 `cell.less` |
| `disabled` 為什麼看起來不可用但仍可能觸發 click？ | `cell.vue` runtime 與 `.select-item()` disabled style |
| `extra` 最後在哪裡顯示？ | `cell-item.vue` 的 footer / extra 結構 |

這種讀法能把「使用方式」和「原始碼責任」連起來，這也是閱讀元件庫 source 的核心能力。

---

## 7. 閱讀路線或學習路線

### 7.1 第一次閱讀路線

第一次讀時，建議不要直接鑽進 `mixins/link.js` 或 Less selector。先建立整體輪廓，再逐步深入。

1. **先讀 README**  
   目的：建立這組元件的總地圖，知道後面四篇筆記分別解決什麼問題。

2. **再讀 `01-source-map.md`**  
   目的：知道 runtime、style、type、example、registry、install 分別在哪裡，避免只讀單一 `.vue` 檔。

3. **接著讀 `02-public-contract-and-component-boundary.md`**  
   目的：先確定 `CellGroup`、`Cell`、`CellItem` 的 public / internal 邊界，並理解 props、slots、event 的表面契約。

4. **再讀 `03-click-link-and-provide-inject-flow.md`**  
   目的：理解 click 時序，尤其是 group event 先發生，再處理 link navigation。

5. **最後讀 `04-render-style-arrow-and-global-config.md`**  
   目的：對照 DOM、class、Less、arrow slot、global config 如何共同生成畫面。

### 7.2 深入閱讀路線

如果你已經熟悉基礎結構，可以反過來用問題驅動閱讀。

| 你想研究的問題 | 建議閱讀順序 |
| --- | --- |
| 為什麼 `disabled` 不阻止 click？ | `02` 的 state boundary → `03` 的 click flow → `04` 的 disabled style。 |
| 為什麼有 `to` 會顯示 arrow？ | `04` 的 render branch → `04` 的 arrow source priority → `03` 的 link navigation。 |
| 為什麼只看 `cell.vue` 會漏 API？ | `02` 的 link mixin props → `types/cell.d.ts` → `mixins/link.js`。 |
| `CellItem` 為什麼不算 public component？ | `01` 的 runtime export → `02` 的 component boundary → registry / type export。 |
| 樣式是怎麼從 class 變成畫面的？ | `04` 的 class mapping → `cell.less` → `mixins/select.less`。 |

### 7.3 可以暫時跳過的部分

初次閱讀時，可以暫時跳過以下細節：

- `mixins/link.js` 中較細的 SSR / `window.open()` / router resolve 分支。
- `cell.less` 中所有顏色變數與 Less palette 函數細節。
- `types/index.d.ts` 中與 `Cell` 無關的其他全域 option。
- `src/index.js` 中其他 component 的 install 流程。

這些細節不是不重要，而是可以等你掌握 `Cell / CellGroup` 的主流程後再回來補。

---

## 8. 常見誤區

| 誤區 | 為什麼容易誤解 | 正確理解 |
| --- | --- | --- |
| 把 `Cell` 當成單純列表項 | 畫面上看起來只是 title、label、extra 的一行資料 | `Cell` 同時承接 public props、slots、click、link navigation、arrow 與 class 狀態。 |
| 以為 `CellItem` 也是 public component | 它是實際存在的 `.vue` component | 是否 public 要看 entry、registry 與 type export；`CellItem` 只是 internal layout。 |
| 只看 `cell.vue` 的 props 來判斷 API | `cell.vue` 自身 props 確實只有一部分 | `to`、`replace`、`target`、`append` 來自 `mixins/link.js`，也是 `Cell` public API 的一部分。 |
| 以為 `disabled` 會阻止 click | 一般元件直覺上 disabled 應該不可點擊 | 在這份 source 中，`disabled` 主要產生 class；click handler 沒有因 disabled return。 |
| 以為 `selected` 是內部狀態 | 名稱像是選取狀態 | `selected` 只是 prop-driven class，不會在 click 後自動切換。 |
| 以為 `on-click` 和導頁是二選一 | 點擊列表項通常要嘛 emit，要嘛導頁 | 有 `to` 的 `Cell` 會先回報 group，再處理 navigation。 |
| 以為所有樣式都在 `cell.less` 裡 | 元件專屬樣式檔名稱很明顯 | padding、hover、disabled、selected 的部分規則來自 `mixins/select.less` 的 `.select-item()`。 |
| 以為 arrow 是 `Cell` prop | arrow 看起來像每個 item 的屬性 | arrow 來自 `#arrow` slot、`$VIEWUI.cell` global config 或預設 `Icon`，不是 `Cell` 自身 prop。 |

---

## 9. 本章總結

這份 README 的核心作用，是幫你在閱讀 `Cell / CellGroup` 前先建立完整地圖。`Cell / CellGroup` 雖然是小型元件，但它串起了元件庫中很典型的幾種設計：public container、public item、internal layout、mixin-based API、provide/inject 父子通訊、type declaration、Less 樣式系統與 global config。

閱讀這組元件時，最重要的不是背出每個檔案路徑，而是理解「一個使用者寫下 `<Cell>` 後，資料與行為會經過哪些層」。使用者傳入 props 與 slots，`Cell` 將展示內容交給 `CellItem`；使用者點擊 `Cell`，`Cell` 先回報 `CellGroup`，再交給 link mixin 處理導頁；使用者設定 `selected`、`disabled` 或 `to`，這些狀態會轉成 class，最後由 `cell.less` 與 `.select-item()` 轉成畫面。

掌握這條主線後，再讀 `01` 到 `04` 四篇筆記，就不會被單一細節困住。你會知道每一篇筆記在整體學習路線中的位置，也會知道遇到問題時應該回到哪個 source 檔案確認。

---

## 10. 自我檢查問題

1. 為什麼 `Cell / CellGroup` 不應只被理解成列表樣式元件？
2. `CellGroup`、`Cell`、`CellItem` 三者的責任分工是什麼？
3. 為什麼 `CellItem` 是 internal layout，而不是 public component？
4. 為什麼只看 `cell.vue` 的 props 會漏掉 `to`、`replace`、`target`、`append`？
5. 點擊 `Cell` 時，`CellGroup on-click` 和 link navigation 的順序是什麼？
6. `disabled` 在這組元件中主要影響什麼？它不會自動做什麼？
7. 有 `to` 與沒有 `to` 時，`Cell` 的 render branch 有什麼差異？
8. `#arrow` slot、`$VIEWUI.cell.arrow`、`$VIEWUI.cell.customArrow` 與預設 `Icon` 之間大致是什麼關係？
9. 為什麼理解 `Cell` 的樣式需要同時看 `cell.less` 與 `mixins/select.less`？
10. 如果你要確認 `Cell` 和 `CellGroup` 是否對外匯出，應該看哪些檔案？

---

## 11. 後續延伸方向

這份 README 之後，可以延伸成以下主題筆記：

1. **`Cell / CellGroup` 與其他列表型元件比較**  
   可以比較 `Cell`、`MenuItem`、`DropdownItem`、`SelectOption` 等元件在 item style、selected、disabled、click 行為上的共通設計。

2. **View UI Plus 的 link mixin 共用設計**  
   可以整理哪些元件共用 `mixins/link.js`，並比較它們如何處理 `to`、`target`、`replace`、`append`。

3. **View UI Plus 的 provide/inject 使用模式**  
   可以整理 `CellGroup` 這類父層 provide instance、子層 inject 後呼叫父層方法的設計，並比較優缺點。

4. **View UI Plus 的 internal component 設計**  
   可以分析哪些 component 會再拆 internal layout component，以及這種拆法如何降低 template 複雜度。

5. **View UI Plus 樣式系統與 Less mixin 筆記**  
   可以從 `.select-item()` 開始，整理 View UI Plus 如何抽出共用 item 狀態樣式。

6. **元件庫 public API 與 type declaration 對照方法**  
   可以建立一套閱讀流程：runtime props、mixin props、slots、emits、`.d.ts`、registry、install 如何互相驗證。

7. **`disabled` 行為邊界的實務重構筆記**  
   可以討論如果要讓 `disabled` 真正阻止 click / navigation，應該如何修改 runtime、type、文件與測試。
