# Avatar / AvatarList 原始碼閱讀總覽：從單一頭像到列表聚合

## 1. 本章定位

本章是 `Avatar / AvatarList` 筆記包的總覽導讀，也是整組原始碼閱讀的入口 README。

它不是單篇細節分析，不會逐一展開每個 computed、watcher、Less selector 或 slot 實作；它的任務是先幫你建立整體閱讀地圖，讓你知道這組元件應該從哪裡讀、讀的時候要觀察什麼、哪些問題應該放到後續專章解決。

讀完本章後，你應該能理解：

1. 為什麼 `Avatar` 不只是「一個圓形圖片」，而是一個有內容分支、尺寸分流、錯誤事件與文字縮放的基礎展示元件。
2. 為什麼 `AvatarList` 不只是「多個 Avatar 排在一起」，而是一個由 `list` 資料驅動的聚合型元件。
3. runtime source、style、type declaration、example、registry 與 install 各自負責什麼。
4. 後續四篇筆記應該按照什麼順序閱讀。
5. 哪些地方要特別回到 `.vue` runtime source 驗證，而不能只相信 `.d.ts`。

本章不深入處理以下主題：

- `Avatar` 的完整內容分支與 `on-error` 細節，留到 `02-avatar-public-contract-and-content-priority.md`。
- `Avatar` 的尺寸、Less、inline style 與文字縮放，留到 `03-avatar-size-style-and-text-scaling.md`。
- `AvatarList` 的 `currentList`、Tooltip、`extra` / `excess` 與列表重疊樣式，留到 `04-avatar-list-aggregation-tooltip-and-excess.md`。
- 原始碼逐行導讀，此處需要後續補充實際 source 片段或行號。

---

## 2. 學習前先建立的基本觀念

在正式閱讀 `Avatar` 與 `AvatarList` 之前，需要先建立幾個基本觀念。這些觀念能幫你避免把元件看得太表面，也能讓你在讀原始碼時知道每個檔案的角色。

### 2.1 `Avatar` 是展示原子，不只是圖片容器

`Avatar` 表面上看起來像一個圖片元件，但它其實是一個「展示原子」。所謂展示原子，是指它負責把外部輸入轉成穩定的 UI 表現，而且通常會被其他元件重複組合。

在這個元件中，外部輸入可能來自：

- `src`：圖片來源。
- `icon`：內建 icon 類型。
- `customIcon`：自訂 icon class。
- default slot：文字或其他簡單內容。
- `shape`：形狀。
- `size`：尺寸。
- `on-error`：圖片錯誤事件。

因此，讀 `Avatar` 時不要只找 `<img>`，而要觀察它如何在「圖片、Icon、文字」之間做內容選擇，並且如何把尺寸和形狀轉成 class 或 inline style。

### 2.2 `AvatarList` 是聚合元件，不是任意 slot 容器

`AvatarList` 的本質不是讓使用者自己傳入一堆 `<Avatar>` children，而是由它接收 `list` 陣列，再主動產生多個子 `Avatar`。這種元件通常稱為聚合型元件，因為它的價值不在單一項目，而在「如何把一組資料轉成一組有規則的 UI」。

在 `AvatarList` 裡，重要問題不是「怎麼畫一個 Avatar」，而是：

- `list` 裡每個 item 需要哪些欄位。
- `max` 如何決定顯示幾個頭像。
- `Tooltip` 什麼時候包住子 `Avatar`。
- `extra` 與 `excess` slot 誰的優先序較高。
- `avatar-list.less` 如何讓頭像重疊排列。

### 2.3 內容 branch 不等於錯誤 fallback

這組元件最容易誤會的地方，是把 `src / icon / slot` 的 template branch 看成「圖片錯誤後自動 fallback」。

實際上，`Avatar` 的內容選擇是初始渲染時的分支：

```txt
有 src
  -> 顯示圖片
否則，有 icon 或 customIcon
  -> 顯示 Icon
否則
  -> 顯示 default slot
```

這是一種「輸入優先序」，不是「圖片失敗後的降級流程」。圖片載入失敗時，`Avatar` 只會 emit `on-error`，真正要換成另一張圖、icon 或文字，要由父層更新 props 來完成。

### 2.4 `.d.ts` 是 public surface，但不是永遠等於 runtime

元件庫通常會同時有 runtime source 和 type declaration。理想情況下，兩者應該一致；但在真實專案中，`.d.ts` 可能落後、缺漏或複製錯誤。

這組元件剛好提供了很好的案例：

- `Avatar` runtime 的 `size` 支援 `String | Number`，但 `.d.ts` 只描述 `large | small | default`。
- `AvatarList` 的 `.d.ts` 沒有完整描述 `list`、`max`、`tooltip`、`placement`、`transfer` 等 runtime props，反而出現較像 `Avatar` 的 props。

所以閱讀這組元件時，不能只看 type declaration；必須回到 `.vue` source 確認實際行為。

---

## 3. 整體概覽

這組元件可以用兩條主線理解：一條是 `Avatar` 的單一頭像轉換鏈，另一條是 `AvatarList` 的列表聚合轉換鏈。

### 3.1 `Avatar` 的單一頭像轉換鏈

`Avatar` 的核心流程可以整理成：

```txt
props / default slot
  -> 內容 branch：src / icon / text
  -> 樣式分流：class / inline size style
  -> 圖片錯誤：emit on-error
  -> 文字頭像：DOM measurement and scale
```

這條鏈說明了一件事：`Avatar` 的複雜度不在 template 很長，而在它同時把多種輸入轉成統一的頭像表現。

對初學者來說，應該按照以下順序理解：

1. 先看 props 有哪些。
2. 再看 template 如何決定圖片、Icon 或 slot。
3. 再看 `classes` 和 `styles` 如何產生樣式。
4. 最後才看文字縮放的 DOM measurement。

### 3.2 `AvatarList` 的列表聚合轉換鏈

`AvatarList` 的核心流程可以整理成：

```txt
list / max / tooltip / slots
  -> currentList slice
  -> Avatar + optional Tooltip
  -> extra / excess avatar
  -> avatar-list.less overlap layout
```

這條鏈說明 `AvatarList` 的價值不是單一頭像，而是「資料如何被整理、截斷、包裹並排列」。

對初學者來說，閱讀重點應該是：

1. `list` item 的資料 contract。
2. `currentList` 如何根據 `max` 產生。
3. Tooltip 是否存在是由 `tooltip && item.tip` 決定。
4. `extra` slot 優先於 `excess` slot。
5. 重疊效果主要來自 `avatar-list.less` 的負 margin。

### 3.3 原始碼閱讀的五種檔案角色

這組筆記的閱讀不應只看 `.vue`。真正完整的元件行為，是由多種檔案共同組成。

| 檔案類型 | 負責內容 | 閱讀價值 |
| --- | --- | --- |
| Runtime `.vue` | props、template branch、computed、watcher、methods、slot 結構 | 確認元件實際行為。 |
| Runtime entry `index.js` | 單元件匯出 | 確認元件如何被外部 import。 |
| Style `.less` | 尺寸、形狀、圖片、Icon、重疊排列 | 確認畫面效果如何被 CSS 支撐。 |
| Type declaration `.d.ts` | TypeScript 使用者看到的 public contract | 對照型別與 runtime 是否一致。 |
| Example / registry / install | 官方用法、元件集合匯出、全域安裝 | 確認元件如何被使用與註冊。 |

---

## 4. 核心內容逐步講解

### 4.1 先讀 source baseline，建立檔案地圖

`View UI Plus v1.3.20` 原始碼作為閱讀基準。這一點很重要，因為元件庫版本不同時，runtime props、Less token、type declaration 或 example 都可能變動。

本目錄的 source baseline 可以整理如下：

| 類型 | 路徑 | 負責職責 | 初次閱讀重點 |
| --- | --- | --- | --- |
| Runtime | `01-origin/source/view-ui-plus-v1.3.20/src/components/avatar/avatar.vue` | 定義 `Avatar` 的 props、template branch、computed class/style、圖片錯誤事件與文字縮放 | 先看 template branch，再看 `classes`、`styles`、`setScale()`。 |
| Runtime entry | `01-origin/source/view-ui-plus-v1.3.20/src/components/avatar/index.js` | 匯出單一 `Avatar` 元件 | 確認單元件入口。 |
| Runtime | `01-origin/source/view-ui-plus-v1.3.20/src/components/avatar-list/avatar-list.vue` | 定義 `AvatarList` 的列表切片、Tooltip 包裹、extra / excess slot 與子 `Avatar` 傳值 | 先看 `list`、`max`、`currentList`，再看 slot 優先序。 |
| Runtime entry | `01-origin/source/view-ui-plus-v1.3.20/src/components/avatar-list/index.js` | 匯出單一 `AvatarList` 元件 | 確認單元件入口。 |
| Style | `01-origin/source/view-ui-plus-v1.3.20/src/styles/components/avatar.less` | 定義頭像尺寸、形狀、圖片、文字與 icon 樣式 | 對照 `classes` 產出的 class。 |
| Style | `01-origin/source/view-ui-plus-v1.3.20/src/styles/components/avatar-list.less` | 定義列表重疊、邊框與 excess 樣式 | 理解負 margin 與白色邊框。 |
| Style entry | `01-origin/source/view-ui-plus-v1.3.20/src/styles/components/index.less` | 將 `avatar.less` 與 `avatar-list.less` 納入元件樣式集合 | 確認樣式是否被入口引入。 |
| Type declaration | `01-origin/source/view-ui-plus-v1.3.20/types/avatar.d.ts` | 描述 `Avatar` TypeScript public API | 對照 runtime 支援的數字尺寸。 |
| Type declaration | `01-origin/source/view-ui-plus-v1.3.20/types/avatar-list.d.ts` | 描述 `AvatarList` TypeScript contract | 對照 `.d.ts` 與 runtime props 的落差。 |
| Type export entry | `01-origin/source/view-ui-plus-v1.3.20/types/viewuiplus.components.d.ts` | 匯出 `Avatar` / `AvatarList` 型別 | 確認 typed public exports。 |
| Example | `01-origin/source/view-ui-plus-v1.3.20/examples/routers/avatar.vue` | 展示單一頭像官方用法、錯誤處理與數字尺寸 | 看官方如何觸發 public API。 |
| Example | `01-origin/source/view-ui-plus-v1.3.20/examples/routers/avatar-list.vue` | 展示列表、`max` 與 `excessStyle` 用法 | 看官方資料格式與列表場景。 |
| Registry | `01-origin/source/view-ui-plus-v1.3.20/src/components/index.js` | 將 `Avatar` / `AvatarList` 放入 component public export | 確認元件庫層級匯出。 |
| Install | `01-origin/source/view-ui-plus-v1.3.20/src/index.js` | 全域安裝時透過 component map 間接註冊 | 確認 plugin install 流程。 |

這張表的閱讀方式是：先看 runtime 行為，再回到 style 和 type 對照，最後用 example 和 registry 驗證 public usage。

### 4.2 `Avatar` 的閱讀主線：內容、樣式、錯誤、測量

閱讀 `Avatar` 時，可以用四個問題拆解。

第一，內容從哪裡來？  
`Avatar` 接收 `src`、`icon`、`customIcon` 和 default slot，但這些輸入不是一起渲染，而是由固定優先序決定。只要有 `src`，就會進入圖片 branch；沒有 `src` 才可能進入 icon branch；前兩者都沒有才會渲染 default slot。

第二，樣式怎麼產生？  
`Avatar` 的樣式不是全部寫在 Less 裡。預設尺寸如 `small`、`default`、`large` 主要透過 class 對應 `avatar.less`；自訂尺寸則會由 runtime computed 產生 inline style，例如 width、height、line-height 和 font-size。

第三，圖片錯誤誰處理？  
`Avatar` 自己不做錯誤 fallback。圖片錯誤時，它只 emit `on-error`，父層要自己決定要不要換圖片、改成 icon 或改成文字。

第四，文字為什麼需要測量？  
default slot 文字可能比頭像寬，所以元件需要在 mounted / updated 後取得實際 DOM 寬度，再計算 `scale`。這是 runtime 和 DOM measurement 共同完成的行為，不是單純 CSS。

### 4.3 `AvatarList` 的閱讀主線：資料、截斷、包裹、額外項

閱讀 `AvatarList` 時，也可以用四個問題拆解。

第一，資料 contract 是什麼？  
`AvatarList` 不是接收任意 children，而是接收 `list`。每個 list item runtime 實際會用到的欄位主要是 `src` 和 `tip`。`src` 傳給子 `Avatar`，`tip` 則在需要 Tooltip 時作為提示內容。

第二，如何控制顯示數量？  
`currentList` 會根據 `max` 產生實際渲染的列表。如果 `list.length > max`，只顯示前 `max` 個，剩餘數量由 `excess` 顯示。

第三，Tooltip 是不是必然存在？  
不是。Tooltip 的條件是 `tooltip && item.tip`。也就是說，即使 `tooltip` 預設為 true，只要 item 沒有 `tip`，仍然會直接渲染 `Avatar`。

第四，列表尾端怎麼處理額外項？  
`extra` slot 優先於 `excess` slot。只要提供 `#extra`，就會顯示自訂額外頭像，而且會讓 `excess` 分支失效；只有沒有 `extra` 且列表超過 `max` 時，才會顯示 `excess`。

### 4.4 樣式閱讀主線：從單一頭像到重疊列表

`avatar.less` 和 `avatar-list.less` 的責任不同。

`avatar.less` 負責單一頭像本身，包括：

- 根節點尺寸與排列。
- 圓形或方形樣式。
- 圖片模式背景。
- icon 模式字體尺寸。
- slot 文字容器的基礎樣式。

`avatar-list.less` 負責多個頭像排列，包括：

- 列表根容器。
- 每個列表項的 inline-block 排列。
- 負 margin 造成重疊。
- 第一個 item 取消負 margin。
- 每個子 `Avatar` 加白色邊框，讓重疊時仍有分隔感。
- 不同 size 對應不同重疊距離。

這裡可以看到一個元件庫常見設計：單一元件樣式與聚合元件樣式分開維護。`Avatar` 不需要知道自己是否在列表裡；`AvatarList` 透過外層 item 與 descendant selector 補上列表場景需要的視覺效果。

### 4.5 型別閱讀主線：把 `.d.ts` 當成對照，不要當成唯一真相

這組元件特別適合拿來練習 runtime 與 type declaration 的對照。

對 `Avatar` 來說，`.d.ts` 大致能描述 public API，但 `size` 的描述不完整。runtime 支援數字或非預設字串尺寸，官方 example 也展示了數字尺寸，但 type declaration 只描述 `large | small | default`。

對 `AvatarList` 來說，`.d.ts` 和 runtime 的差距更明顯。runtime 真正重要的 props 是 `list`、`max`、`excessStyle`、`tooltip`、`placement`、`transfer`，但 `.d.ts` 沒有完整描述這些 props，反而保留了像 `src`、`icon`、`custom-icon` 這些較像 `Avatar` 的 props。

因此，這裡的學習重點不是批評型別檔，而是建立正確閱讀習慣：在元件庫原始碼閱讀中，`.d.ts` 是 public contract 的一部分，但它必須和 runtime source 互相驗證。

---

## 5. 表格整理

### 5.1 四篇子筆記索引

| 筆記 | 類型 | 主題 | 建議閱讀目的 |
| --- | --- | --- | --- |
| `01-source-map.md` | 原始碼閱讀地圖 | 原始碼入口與責任分工 | 先知道 runtime、style、type、example、registry、consumer 分別在哪裡。 |
| `02-avatar-public-contract-and-content-priority.md` | API / runtime 對照筆記 | `Avatar` public contract 與內容優先序 | 對照 props、template branch、`on-error` 與 type declaration。 |
| `03-avatar-size-style-and-text-scaling.md` | 視覺系統筆記 | `Avatar` 尺寸、樣式與文字縮放 | 理解 class、inline style、Less 與 DOM measurement 的分工。 |
| `04-avatar-list-aggregation-tooltip-and-excess.md` | 聚合元件筆記 | `AvatarList` 列表聚合、Tooltip 與 excess | 理解 `currentList`、Tooltip、`extra` / `excess` slot 與型別落差。 |

這四篇筆記的關係是由外到內、由單一到聚合。第一篇建立地圖，第二篇讀懂 `Avatar` 的內容契約，第三篇補上視覺與測量細節，第四篇才把單一 `Avatar` 放進 `AvatarList` 的資料驅動場景中理解。

### 5.2 閱讀焦點總表

| 閱讀焦點 | 對應元件 | 核心問題 | 主要檔案 |
| --- | --- | --- | --- |
| 內容優先序 | `Avatar` | `src`、`icon/customIcon`、default slot 誰優先？ | `avatar.vue` |
| 圖片錯誤邊界 | `Avatar` | 圖片錯誤時元件內部做什麼？外部要做什麼？ | `avatar.vue`、`examples/routers/avatar.vue` |
| 尺寸分流 | `Avatar` | 預設尺寸與自訂尺寸分別走哪條樣式路徑？ | `avatar.vue`、`avatar.less` |
| 文字縮放 | `Avatar` | slot 文字太寬時如何透過 DOM measurement 縮放？ | `avatar.vue` |
| 列表聚合 | `AvatarList` | `list` 如何轉成多個子 `Avatar`？ | `avatar-list.vue` |
| Tooltip 包裹 | `AvatarList` | 哪些 item 會被 `Tooltip` 包住？ | `avatar-list.vue` |
| 額外頭像 | `AvatarList` | `extra` 與 `excess` 誰優先？ | `avatar-list.vue` |
| 重疊樣式 | `AvatarList` | 多個頭像如何形成重疊效果？ | `avatar-list.less` |
| 型別落差 | 兩者 | `.d.ts` 是否完整描述 runtime？ | `types/avatar.d.ts`、`types/avatar-list.d.ts` |

### 5.3 學習成果對照表

| 學習成果 | 你應該能說明的內容 |
| --- | --- |
| 理解 `Avatar` 是展示原子 | 它根據 `src`、`icon/customIcon`、default slot 選擇內容，並把形狀與尺寸轉成樣式。 |
| 理解圖片錯誤邊界 | `Avatar` 只 emit `on-error`，不會自動改成 icon 或文字。 |
| 理解尺寸行為 | `size="large"` 走 class + Less；`size="64"` 或 `:size="42"` 走 inline style。 |
| 理解文字縮放 | slot 文字需要在 DOM 渲染後測量寬度，再透過 transform scale 縮放。 |
| 理解 `AvatarList` 是資料驅動列表 | 它根據 `list` 主動產生子 `Avatar`，不是讓使用者傳入任意 children。 |
| 理解 Tooltip 條件 | 只有 `tooltip && item.tip` 時才包 `Tooltip`。 |
| 理解 slot 優先序 | `extra` 優先於 `excess`，且 `extra` 不依賴是否超出 `max`。 |
| 理解 type declaration 落差 | 需要回到 runtime source 驗證 `.d.ts` 是否完整。 |

---

## 6. 範例或情境說明

### 6.1 如果你是第一次讀這組元件

第一次讀時，不建議直接從 `avatar-list.vue` 開始。因為 `AvatarList` 會產生子 `Avatar`，如果你還不懂 `Avatar` 的 props 與內容分支，就很難判斷 `AvatarList` 到底傳了哪些資訊給子元件。

比較穩定的閱讀方式是：

```txt
examples/routers/avatar.vue
  -> avatar.vue
  -> avatar.less
  -> types/avatar.d.ts
  -> examples/routers/avatar-list.vue
  -> avatar-list.vue
  -> avatar-list.less
  -> types/avatar-list.d.ts
```

這條路線的好處是先從官方使用方式建立直覺，再回到 runtime source 驗證實際行為，最後用 type declaration 檢查 public contract 是否一致。

### 6.2 如果你想理解圖片錯誤 fallback

你應該先看 `examples/routers/avatar.vue` 裡官方怎麼使用 `@on-error`，再回到 `avatar.vue` 的 `handleError()`。

閱讀時要問自己兩個問題：

1. `Avatar` 內部有沒有保存圖片錯誤狀態？
2. `handleError()` 除了 emit 事件以外，有沒有修改 `src` 或切換 branch？

如果答案是否定的，就代表 fallback 策略不在 `Avatar` 內部，而是在父層。

### 6.3 如果你想理解列表超出數量

你應該先看 `AvatarList` 的 `currentList`，再看 template 尾端的 `extra` / `excess` 分支。

可以用這個情境檢查：

```txt
list.length = 5
max = 3
沒有提供 #extra
```

此時 `currentList` 應該只渲染前三個 item，尾端顯示預設 `+2`。

如果改成：

```txt
list.length = 5
max = 3
有提供 #extra
```

此時會顯示自訂 `extra` avatar，而不是預設 `+2`。這就是 `extra` 優先於 `excess` 的具體結果。

---

## 7. 閱讀路線或學習路線

### 7.1 初次閱讀路線

第一次閱讀時，目標不是掌握所有細節，而是建立元件心智模型。

1. 先讀 `README.md`  
   目的：知道整組元件的閱讀主線與筆記順序。

2. 再讀 `01-source-map.md`  
   目的：掌握 runtime、style、type、example、registry、install 和 consumer 的位置。

3. 接著讀 `02-avatar-public-contract-and-content-priority.md`  
   目的：理解 `Avatar` 的 public props、內容 branch 和圖片錯誤事件。

4. 再讀 `03-avatar-size-style-and-text-scaling.md`  
   目的：理解 `Avatar` 的尺寸分流、Less 樣式與文字縮放。

5. 最後讀 `04-avatar-list-aggregation-tooltip-and-excess.md`  
   目的：理解 `AvatarList` 如何把資料轉成多個頭像，並處理 Tooltip 與超出項。

### 7.2 深入閱讀路線

當你已經知道整體流程後，可以進一步做交叉對照。

1. 對照 `avatar.vue` 和 `avatar.less`  
   觀察 `classes` 產出的 class 如何被 Less selector 接住。

2. 對照 `avatar.vue` 和 `examples/routers/avatar.vue`  
   觀察官方 example 如何觸發 `src`、`icon`、slot、`on-error` 和數字尺寸。

3. 對照 `avatar-list.vue` 和 `examples/routers/avatar-list.vue`  
   觀察官方 example 的 `list` item 是否只使用 `src` 與 `tip`。

4. 對照 runtime source 和 `.d.ts`  
   觀察 public type 是否完整描述 runtime props，特別是 `size` 和 `AvatarList` props。

5. 對照 registry 和 install  
   確認元件如何從單一檔案進入整個 View UI Plus 的 public export 與全域安裝流程。

### 7.3 可以暫時跳過的部分

如果你是第一次讀，可以先暫時跳過：

- `src/index.js` 的完整 plugin install 細節。
- `types/viewuiplus.components.d.ts` 的完整型別匯出清單。
- Less 變數來源的完整 theme token 系統。
- 其他 consumer 的所有業務邏輯。

這些內容不是不重要，而是它們比較適合在你理解 `Avatar` / `AvatarList` 本身之後，再拿來補完整元件庫層級的理解。

---

## 8. 常見誤區

| 誤區 | 為什麼容易誤解 | 正確理解 |
| --- | --- | --- |
| 把 `Avatar` 當成單純圖片元件 | 元件名稱和常見 UI 都讓人先想到圖片頭像 | `Avatar` 是展示原子，支援圖片、Icon、文字、尺寸、形狀與錯誤事件。 |
| 以為 `src`、`icon`、slot 會自動 fallback | template branch 看起來像 fallback chain | 它是初始內容優先序；圖片錯誤後不會自動切到 icon 或 slot。 |
| 以為圖片錯誤由 `Avatar` 內部處理 | `@error="handleError"` 容易讓人以為內部有降級策略 | `handleError()` 只 emit `on-error`，fallback 策略由父層決定。 |
| 以為 `size` 只有三種字串 | `.d.ts` 只描述 `large`、`small`、`default` | runtime 支援 `String | Number`，非預設尺寸會走 inline style。 |
| 以為文字縮放是純 CSS | 樣式檔中有很多尺寸相關設定 | slot 文字縮放依賴 DOM measurement，需要 mounted / updated 後計算。 |
| 把 `AvatarList` 當成 slot layout 容器 | 名稱看起來像列表容器 | 它根據 `list` 主動產生子 `Avatar`，不是渲染任意 children。 |
| 以為每個 item 都一定有 Tooltip | `AvatarList` 有 `tooltip` prop | 只有 `tooltip && item.tip` 時才包 `Tooltip`。 |
| 以為 `extra` 只在超出 `max` 時顯示 | 容易把 `extra` 和 `excess` 都理解成超出項 | `extra` 只要提供就顯示，且優先於 `excess`。 |
| 完全相信 `.d.ts` | TypeScript 使用者容易把型別視為唯一契約 | 真實元件行為仍要回到 `.vue` runtime source 驗證。 |

---

## 9. 本章總結

`Avatar / AvatarList` 是一組很適合練習元件庫原始碼閱讀的小型案例。它們的 runtime 不算長，但剛好涵蓋了幾個元件庫常見主題：public props、template branch、class 與 Less 的對照、inline style、事件邊界、DOM measurement、資料驅動列表、slot 優先序、Tooltip 包裹，以及 runtime 與 type declaration 的落差。

`Avatar` 的核心心智模型是：它根據 `src`、`icon/customIcon` 與 default slot 的優先序選擇內容，再根據 `shape` 與 `size` 產生樣式。如果圖片失敗，它只通知外部，不主動改變內容分支。當內容是文字時，它還會透過 DOM measurement 計算縮放比例，確保文字能放進頭像中。

`AvatarList` 的核心心智模型是：它是一個資料驅動的聚合元件。它接收 `list`，透過 `currentList` 控制實際渲染項目，根據 `tooltip && item.tip` 決定是否包 `Tooltip`，並在尾端透過 `extra` 或 `excess` 顯示額外頭像。它的重疊視覺不是由子 `Avatar` 自己處理，而是由 `avatar-list.less` 在列表層級完成。

因此，讀這組元件時最重要的不是記住每個 API 名稱，而是學會一種元件庫閱讀方法：先看官方 example 建立使用情境，再看 runtime source 確認實際行為，接著對照 style 和 type declaration，最後回到 registry / install 觀察它如何進入整個元件庫。

---

## 10. 自我檢查問題

1. 為什麼本目錄建議把 `Avatar / AvatarList` 放在 `Badge` 之後閱讀？
2. `Avatar` 為什麼不能只理解成「一個圓形圖片」？
3. `Avatar` 的內容來源優先序是什麼？
4. 圖片載入失敗時，`Avatar` 內部會不會自動 fallback 到 icon 或文字？為什麼？
5. `size="large"` 和 `size="64"` 分別會走哪一種樣式路徑？
6. 為什麼 default slot 文字縮放需要 DOM measurement，而不是只靠 Less？
7. `AvatarList` 為什麼不是任意 slot 容器？
8. `AvatarList` 的 list item runtime contract 主要包含哪些欄位？
9. `Tooltip` 在 `AvatarList` 中的出現條件是什麼？
10. `extra` 和 `excess` 的優先序有什麼差異？
11. 為什麼閱讀這組元件時不能只依賴 `.d.ts`？
12. 如果你要向別人解釋這組元件的原始碼閱讀順序，你會怎麼安排？

---

## 11. 後續延伸方向

這份 README 是整個 `Avatar / AvatarList` 筆記包的入口。後續可以延伸成以下主題：

1. `Avatar` template branch 逐行導讀  
   深入分析 `src`、`icon/customIcon`、default slot 的互斥關係，以及它們如何影響 class state。

2. `Avatar` 圖片錯誤策略設計  
   從 `on-error` 出發，討論為什麼元件只 emit 事件，而不內建 fallback 狀態。

3. `Avatar` 尺寸系統與 Less token  
   對照 `avatar.vue`、`avatar.less` 與 theme variables，整理預設尺寸與自訂尺寸的設計。

4. `Avatar` 文字縮放演算法  
   針對 `setScale()`、`childrenWidth`、`avatarWidth`、`transform: scale()` 做更細的流程分析。

5. `AvatarList` 資料 contract 設計  
   分析為什麼 list item 只讀 `src` 與 `tip`，以及如果要支援更多 item-level props 應如何擴充。

6. `AvatarList` slot 優先序設計  
   深入比較 `extra` 與 `excess` 的職責差異，並討論這種 API 設計在元件庫中的可維護性。

7. Runtime 與 Type Declaration 差異修正筆記  
   針對 `types/avatar.d.ts` 與 `types/avatar-list.d.ts` 的落差，設計一份修正方案與型別測試案例。

8. 元件庫閱讀方法論  
   把本組元件抽象成通用閱讀流程：example → runtime → style → type → registry → consumer，作為之後閱讀其他 View UI Plus 元件的模板。
