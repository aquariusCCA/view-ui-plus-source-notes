# View UI Plus Icon 圖標元件：在其他元件中的組合使用與責任邊界

## 0. 原始筆記分析

### 0.1 筆記類型判斷

這份原始筆記主要屬於「組合關係筆記」，同時帶有「原始碼閱讀筆記」與「架構分析筆記」的性質。它不是在逐行分析 `Icon` 元件本身的 runtime，也不是在拆解 icon font 樣式系統，而是在回答另一個更偏工程架構的問題：

> `Icon` 這種很小的基礎元件，為什麼會在 View UI Plus 其他元件中被大量依賴？

從元件庫的角度來看，`Icon` 的價值不只在於讓使用者直接寫 `<Icon type="ios-search" />`，更重要的是它能被 `Button`、`Avatar`、`Tabs`、`Select`、`Tree`、`Upload` 等高階元件重複組合使用。這使它成為 View UI Plus 中非常典型的「共用視覺原子」。

### 0.2 原始筆記目前的問題

原始筆記已經整理出 `Icon` 在其他元件中的多種使用場景，也有提醒「`Icon` 只負責視覺，不負責行為」。不過若要作為長期學習用的教材型筆記，仍可以進一步補強以下幾點。

第一，原始筆記偏向整理結論，對於「為什麼視覺原子應該和互動邏輯分離」的說明還可以更完整。這個觀念對閱讀元件庫非常重要，因為很多初學者看到 `Icon` 出現在 `Button`、`Tabs` 或 `Tree` 裡，就會誤以為 `Icon` 本身也參與了 click、expand、close 等互動語意。

第二，原始筆記列出了多個父元件場景，但還可以補上更明確的閱讀方法。當你在其他元件原始碼中看到 `Icon` 時，應該先判斷它是「固定圖標」、「由父元件 prop 決定的圖標」、「由全域設定決定的圖標」，還是「支援自訂 icon font 的圖標」。這樣可以避免一開始就陷入細節。

第三，`Button`、`Avatar`、箭頭類元件、直接 `<i class="ivu-icon ...">` 這幾種情境其實代表不同的組合模式。原始筆記有提到，但可以再拆成教材章節，讓讀者知道每種模式背後的元件分工。

第四，原始筆記沒有提供每個父元件的具體 source path 與逐行程式碼，因此本章不應編造未提供的檔案路徑或實作細節。以下內容會以原始筆記已提供的使用模式為主，必要時使用「通常」、「可能」、「需要回到原始碼確認」標註資訊邊界。

---

## 1. 本章定位

本章專門整理 `Icon` 在 View UI Plus 其他元件中的組合方式。前面幾篇筆記若已經理解 `Icon` 本身的 props、render output 與 icon font 系統，那這一章要把視角從「元件內部」拉到「元件之間的協作」。

`Icon` 本身很小，runtime 大致只是接收 `type`、`custom`、`size`、`color`，然後輸出帶有 class 與 inline style 的 `<i>` 節點。但在元件庫中，小元件不代表不重要。越基礎、越穩定、越容易被組合的元件，越容易成為高階元件的共同依賴。

讀完本章後，你應該能回答以下問題：

1. 為什麼 `Icon` 會被大量元件依賴？
2. 父元件如何透過自己的 props、狀態或全域設定決定 icon？
3. `Icon` 在父元件中通常負責什麼、不負責什麼？
4. 為什麼 click、close、expand、loading 等互動語意應該留在父元件？
5. 讀其他元件原始碼時，什麼時候需要回頭對照 `Icon`？

---

## 2. 前置觀念：基礎元件的兩種價值

基礎元件通常有兩種價值。第一種是「直接使用價值」，也就是業務畫面或文件範例直接使用它。第二種是「組合價值」，也就是它被其他更高階的元件拿來當作內部零件。

以 `Icon` 為例，直接使用價值很容易理解。使用者可以在頁面中直接寫：

```vue
<Icon type="ios-search" />
```

這種用法讓使用者快速顯示一個圖標。它的心智模型很簡單：傳入 `type`，元件產生對應的 `ivu-icon-*` class，再由 icon font 樣式顯示圖標。

但 `Icon` 在元件庫中更重要的是第二種價值：它可以被高階元件組合。像 `Button` 需要按鈕前置圖標，`Avatar` 需要 fallback icon，`Tabs` 需要關閉圖標，`Tree` 需要展開箭頭，`Select` 需要下拉箭頭或清除圖標。這些功能的業務語意不同，但它們都需要一個穩定的圖標呈現層。

可以把 `Icon` 理解成 View UI Plus 中的「共用視覺原子」：

```txt
高階元件
  -> 決定語意、狀態與互動
  -> 選擇要顯示哪個 icon
  -> 把 type / custom / size / class 傳給 Icon

Icon
  -> 接收圖標相關 props
  -> 產生 class 與 style
  -> 輸出可被 CSS icon font 顯示的 <i>
```

這個分工是閱讀元件庫時非常重要的基本觀念。`Icon` 不應該知道自己是在按鈕裡、標籤頁裡、樹節點裡，還是圖片預覽工具列裡。它只需要把圖標顯示好。

---

## 3. 核心設計模型：父元件決定語意，`Icon` 負責視覺

閱讀 `Icon` 在其他元件中的使用時，最重要的判斷原則是：

> 父元件負責語意與行為，`Icon` 負責視覺呈現。

所謂「語意」，是指這個圖標在父元件中代表什麼意思。例如在 `Button` 中，它可能是搜尋、下載、新增；在 `Tabs` 中，它可能代表關閉；在 `Tree` 中，它可能代表展開或收合；在 `Upload` 中，它可能代表檔案狀態或操作按鈕。

所謂「行為」，是指使用者操作後實際發生什麼事情。例如 click、close、expand、collapse、clear、preview、remove 等。這些行為通常依賴父元件自己的狀態與資料流，不應該放進 `Icon`。

`Icon` 的責任比較單純：根據父元件給它的資料，顯示一個符合設計系統的圖標。它可以被點到，但不代表它擁有點擊語意。尤其在 Vue 3 中，因為 `Icon` 是單根節點元件，父層傳入的非 prop attributes 與 event listeners 可以 fallthrough 到根節點 `<i>`，所以你可能會看到類似：

```vue
<Icon type="ios-close" @click.stop="handleClose" />
```

概念上，click listener 會掛到 `Icon` 的根節點上。不過這不代表 `Icon` 自己管理 close 行為。`handleClose` 仍然是父元件提供的處理函式，資料狀態也仍然由父元件管理。

這個責任邊界可以整理如下：

| 責任 | 應由誰負責 | 說明 |
| --- | --- | --- |
| 決定圖標代表的語意 | 父元件 | 例如 close、expand、loading、clear。 |
| 決定何時顯示圖標 | 父元件 | 例如 loading 時顯示 loading icon。 |
| 決定點擊後做什麼 | 父元件 | 例如關閉 tab、展開節點、清除選項。 |
| 把 `type` / `custom` 轉成 class | `Icon` | 這是 `Icon` 的核心映射責任。 |
| 把 `size` / `color` 轉成 inline style | `Icon` | 控制圖標大小與顏色。 |
| 定義具體 glyph 字形 | icon font CSS | 由 `.ivu-icon-${type}:before` 與字體檔負責。 |

---

## 4. 常見使用場景總覽

`Icon` 在其他元件中的使用方式可以分成幾類。這裡的目的不是背每個元件，而是建立閱讀模式。未來你讀任何元件，只要看到 `Icon`，都可以先判斷它屬於哪一種模式。

| 父元件 / 場景 | 常見使用方式 | 閱讀重點 |
| --- | --- | --- |
| `Button` | 根據 `icon`、`customIcon`、`loading` 等狀態渲染 `Icon` | `Icon` 是按鈕內容的一部分，click 與 disabled 語意仍由 `Button` 控制。 |
| `Avatar` | 在沒有圖片或文字時，使用 `icon` / `customIcon` 作為 fallback 內容 | 重點是父元件的 fallback 優先順序，而不是 `Icon` 本身。 |
| `Tabs` | 顯示左右滾動箭頭、關閉圖標 | 父元件可能透過 props 或全域設定決定 close icon。 |
| `Select` / `Cascader` / `ColorPicker` | 顯示下拉箭頭、清除圖標、操作圖標 | `Icon` 常搭配父元件 class 來控制定位、旋轉、hover 狀態。 |
| `Tree` / `Cell` / `Menu` | 顯示展開箭頭或項目前置圖標 | 需要區分圖標名稱由 props、slot、config 還是固定規則決定。 |
| `Upload` / `Table` / `ImagePreview` | 顯示檔案狀態、表格操作、圖片預覽導覽或關閉圖標 | `Icon` 只提供圖形，具體操作流程在父元件中。 |
| 直接 `<i class="ivu-icon ...">` | 不透過 `Icon` component，直接寫 icon font class | 仍然使用同一套 icon font 系統，只是沒有走 props 映射。 |

這張表的重點不是記住哪些元件用了 `Icon`，而是理解每一種情境下的分工。你應該優先問：「這個圖標在父元件中代表什麼？」其次才是問：「`Icon` 收到了什麼 `type` 或 `custom`？」

---

## 5. `Button`：最典型的組合案例

`Button` 是理解 `Icon` 組合價值的最佳案例。按鈕通常是有互動語意的元件，它可能有 `type`、`size`、`loading`、`disabled`、`htmlType`、click handler 等邏輯。相比之下，`Icon` 不知道按鈕是否 disabled，也不應該知道按鈕 click 後要送出表單、發 API，還是切換頁面。

在 `Button` 中，`Icon` 扮演的是「按鈕內容的一部分」。父元件會根據自己的 props 或狀態決定是否渲染圖標。例如一般狀態可能根據 `icon` 或 `customIcon` 顯示指定圖標；loading 狀態可能顯示 loading icon。這些判斷都屬於 `Button` 的語意層。

可以用下列流程理解：

```txt
Button props / state
  -> 判斷是否 loading
  -> 判斷是否有 icon 或 customIcon
  -> 決定要顯示哪個圖標
  -> 將 type / custom 傳給 Icon

Icon
  -> 接收 type / custom
  -> 產生 ivu-icon 與對應 class
  -> 顯示圖標
```

這裡的重點是：即使圖標出現在按鈕內，點擊語意仍然屬於按鈕。使用者點到圖標時，語意上仍是在點擊整顆按鈕，而不是點擊一個獨立的圖標控制項。因此 click、loading 防重複提交、disabled 阻擋互動等邏輯都應由 `Button` 管理。

這種設計讓 `Icon` 保持乾淨，也讓 `Button` 可以完整控制自己的互動邏輯。若反過來讓 `Icon` 處理按鈕行為，元件責任就會混亂，`Icon` 也會變得難以在其他元件中重用。

---

## 6. `Avatar`：作為 fallback 內容的一種選項

`Avatar` 的重點通常不是互動，而是「當不同內容來源存在時，應該顯示哪一種內容」。例如使用者可能提供圖片、文字、slot，或者只提供一個 icon。原始筆記提到 `Avatar` 在沒有圖片或文字時可以使用 `icon` / `customIcon`，這表示 `Icon` 在這裡是一種 fallback 內容。

在這個情境中，閱讀重點不應該放在 `Icon` 如何映射 class，因為那是已知能力。真正值得讀的是 `Avatar` 如何決定內容優先順序。通常你需要關心：

| 問題 | 閱讀意義 |
| --- | --- |
| 有圖片時是否優先顯示圖片？ | 決定 avatar 的主要內容來源。 |
| 圖片載入失敗時是否退回文字或 icon？ | 影響 fallback 行為。 |
| `icon` 和 `customIcon` 誰優先？ | 影響內建圖標與自訂圖標的選擇。 |
| 父元件是否調整 icon 大小？ | 影響圖標是否符合 avatar 尺寸。 |
| 是否允許 slot 覆蓋內容？ | 影響使用者自訂能力。 |

由於原始筆記沒有提供 `Avatar` 的完整 source path 與逐行實作，這裡不應斷言它的具體優先順序。正確做法是把 `Icon` 視為 fallback 候選內容之一，然後回到 `Avatar` 原始碼確認實際判斷流程。

這種閱讀方式也很適合套用到其他元件。當 `Icon` 出現在高階元件內部時，通常不需要重新研究 `Icon`，而是要研究父元件如何把它放進自己的內容決策中。

---

## 7. 箭頭、關閉與狀態圖標：父元件 class 的重要性

在 `Tabs`、`Select`、`Cascader`、`ColorPicker`、`Tree`、`Cell`、`Menu` 這類元件中，`Icon` 常被用來呈現箭頭、關閉符號、展開符號或清除符號。這些圖標通常有一個共同特色：它們不只是單純顯示圖形，還必須和父元件的狀態外觀配合。

例如下拉箭頭可能需要在展開時旋轉，關閉圖標可能需要 hover 顏色，樹節點箭頭可能要根據 expanded 狀態改變方向，Tabs 的關閉圖標可能要在特定狀態下顯示或隱藏。這些效果通常不是由 `Icon` 自己處理，而是由父元件傳入額外 class 或包在特定 DOM 結構裡，再由父元件樣式控制。

因此，看到父元件給 `Icon` 額外 class 時，不要立刻以為這是在換圖標。你應該先區分兩種 class：

```txt
Icon 的 type / custom
  -> 決定是哪一個圖標

父元件額外 class
  -> 決定這個圖標在父元件中的位置、狀態、動畫與互動外觀
```

舉例來說，概念上可能會出現這樣的結構：

```vue
<Icon
  type="ios-arrow-down"
  class="select-arrow"
/>
```

在這裡，`ios-arrow-down` 才是決定字形的資訊；`select-arrow` 則更可能負責定位、顏色、旋轉或 transition。當元件處於開啟狀態時，父元件可能切換某個狀態 class，讓箭頭旋轉，而不是改動 `Icon` 本身的實作。

原始筆記也提到某些圖標可能由父元件 props 或 `$VIEWUI` 全域設定決定。這表示閱讀時不能只看 `Icon` 的呼叫點，還要往上追設定來源。例如某個元件的 arrow icon 可能來自：

1. 元件自己的 prop。
2. 父層傳入的配置。
3. View UI Plus 的全域設定。
4. 元件內部的預設值。

如果沒有追這些來源，容易誤判圖標為固定值。

---

## 8. `customIcon` 與 `custom`：支援自訂 icon font 的責任邊界

原始筆記多次提到 `customIcon`。在高階元件中，`customIcon` 通常表示父元件願意把自訂 class 傳給 `Icon` 的 `custom` prop，讓使用者接入自己的 icon font。

這裡要區分三個層次：

| 層次 | 例子 | 責任 |
| --- | --- | --- |
| 父元件 API | `customIcon` | 讓使用者從父元件層級指定自訂圖標。 |
| `Icon` API | `custom` | 把自訂 class 原樣加到 `<i>` 上。 |
| 使用者專案 CSS | `.i-icon`, `.i-icon-search` | 提供自訂 icon font 的字體、class 與 `content`。 |

這表示 `customIcon` 或 `custom` 並不等於 View UI Plus 內建了該圖標。它只是提供一個 class 接口。真正的字體檔、`font-family`、`:before content`、class 命名，都需要使用者或專案自己準備。

例如概念上可能會有：

```vue
<Button custom-icon="i-icon i-icon-search">
  Search
</Button>
```

父元件可能再把它轉交給 `Icon`：

```vue
<Icon custom="i-icon i-icon-search" />
```

最後輸出：

```html
<i class="ivu-icon i-icon i-icon-search"></i>
```

但如果專案沒有定義 `.i-icon` 與 `.i-icon-search:before`，畫面仍然不會顯示正確的自訂圖標。這正是 `Icon` 的責任邊界：它可以幫你掛 class，但不會替你產生外部 icon font 系統。

---

## 9. 直接使用 `<i class="ivu-icon ...">` 的情況

原始筆記提到，有些地方不一定透過 `Icon` component，而是直接寫：

```html
<i class="ivu-icon ivu-icon-ios-close"></i>
```

這種寫法看起來像另一套系統，但本質上仍然依賴同一套 icon font 樣式。它和下列寫法的最終視覺依賴是相同的：

```vue
<Icon type="ios-close" />
```

兩者差別在於中間是否經過 Vue component 的 props 映射。

| 寫法 | 優點 | 代價 |
| --- | --- | --- |
| `<Icon type="ios-close" />` | API 統一，容易接 `size`、`color`、`custom`，語意更明確 | 多一層 component 抽象。 |
| `<i class="ivu-icon ivu-icon-ios-close"></i>` | 直接、簡短，適合某些底層或舊實作 | 少了 `Icon` 的 props 映射與統一 API。 |

閱讀時不需要把直接 `<i>` 視為另一套圖標系統。真正要關注的是它最後有沒有掛上 `ivu-icon` 和對應的 `ivu-icon-*` class。只要依賴同一套 icon font class，它就和 `Icon` component 共享同一個樣式系統。

不過，從元件庫維護角度來看，直接寫 `<i>` 也代表一些風格上的取捨。它可能是歷史實作、底層優化、或只是局部簡化。若你要改造或重構元件，應該確認該處是否需要改成 `Icon` component，以換取一致的 API 與可維護性。

---

## 10. 閱讀其他元件時的實戰方法

當你在 View UI Plus 其他元件中看到 `Icon`，不要急著展開 `Icon` 的 source。你可以先用以下步驟判斷它在父元件中的角色。

### 10.1 第一步：判斷圖標來源

先看這個圖標是固定寫死，還是由外部設定決定。

| 圖標來源 | 典型特徵 | 閱讀重點 |
| --- | --- | --- |
| 固定圖標 | `type="ios-close"` 這類直接字串 | 檢查它在父元件中代表的語意。 |
| 父元件 prop | `:type="icon"`、`:custom="customIcon"` | 回頭看父元件 props contract。 |
| 父元件狀態 | loading、expanded、active 等狀態決定 icon | 追父元件的 computed 或 render 條件。 |
| 全域設定 | 可能從 `$VIEWUI` 或 config 讀取 | 追全域配置來源與預設值。 |
| slot 或外部自訂 | 使用者可覆蓋 icon | 檢查 fallback 與覆蓋順序。 |

### 10.2 第二步：判斷 `Icon` 是否只負責顯示

接著要看這個 `Icon` 是否被綁定事件。如果有 `@click`，也不要立刻把行為歸到 `Icon`。你應該追 handler 在哪裡定義、會修改哪個父元件狀態、是否會 emit 父元件事件。

例如關閉圖標可能寫成：

```vue
<Icon type="ios-close" @click.stop="handleClose" />
```

真正值得讀的是 `handleClose`。它可能會更新父元件內部狀態、emit `on-close`、移除項目、或觸發外部回調。`Icon` 只是一個事件落點，並不是行為管理者。

### 10.3 第三步：檢查父元件 class 與樣式

如果父元件替 `Icon` 加了額外 class，要回到父元件樣式檔查看這個 class 做了什麼。它可能控制：

1. 圖標位置。
2. 圖標顏色。
3. hover 狀態。
4. transition 動畫。
5. expanded / active 狀態下的旋轉。
6. disabled 狀態下的透明度或 cursor。

這一步很重要，因為許多圖標的「動態效果」不在 `Icon` 元件，而在父元件樣式。

### 10.4 第四步：只有在必要時回頭對照 `Icon`

當你已經知道父元件如何決定圖標，通常不需要反覆閱讀 `Icon`。只有在以下情況才需要回頭對照：

1. 你不確定 `type` 如何變成 class。
2. 你不確定 `custom` 是否會取代 `type`。
3. 你不確定 `size` 或 `color` 如何轉成 inline style。
4. 你懷疑圖標不顯示是因為 class 或 icon font 樣式問題。
5. 你要新增或重構父元件的圖標 API。

---

## 11. 圖標不顯示或行為異常時的排查路線

當你閱讀或修改其他元件時，如果遇到圖標沒有顯示、樣式不對、點擊行為異常，可以用以下順序排查。

### 11.1 圖標沒有顯示

先確認 `Icon` 最終是否輸出正確 class。

```html
<i class="ivu-icon ivu-icon-ios-search"></i>
```

如果 `ivu-icon-${type}` 不存在，可能是父元件傳錯 `type`，或使用者誤把完整 class 傳進 `type`。如果 class 正確但仍不顯示，就要檢查 icon font CSS 與字體檔是否載入。

### 11.2 自訂圖標沒有顯示

如果使用的是 `customIcon` 或 `custom`，要確認外部 CSS 是否存在。例如：

```html
<i class="ivu-icon i-icon i-icon-search"></i>
```

這時不只要有 `ivu-icon`，還要有專案自訂的 `.i-icon` 與 `.i-icon-search` 樣式。`Icon` 不會自動產生第三方 icon font。

### 11.3 圖標位置或旋轉不對

位置、旋轉、動畫通常是父元件 class 控制的。這時應該回到父元件樣式，而不是修改 `Icon`。例如下拉箭頭旋轉不對，通常要檢查父元件是否在 open 狀態加上對應 class，或 CSS transform 是否生效。

### 11.4 點擊圖標沒有反應

先看 listener 是否正確落在 `Icon` 或包裹節點上，再追父元件 handler 是否執行。由於 `Icon` 不管理行為，真正的問題多半在父元件事件綁定、狀態條件或 disabled 邏輯。

---

## 12. 常見誤區

| 誤區 | 為什麼容易誤解 | 正確理解 |
| --- | --- | --- |
| `Icon` 被放在 `Button` 裡，所以它也負責 click | 使用者視覺上點到的是圖標 | click 語意通常屬於 `Button`，`Icon` 只負責視覺。 |
| 父元件給 `Icon` class 就是在換圖標 | class 看起來都掛在同一個節點上 | `type/custom` 通常決定字形；父元件 class 多半控制位置、狀態或動畫。 |
| 直接寫 `<i class="ivu-icon ...">` 是另一套圖標系統 | 它沒有使用 `Icon` component | 它仍然依賴同一套 `ivu-icon` icon font class，只是繞過 props 映射。 |
| 看到 `customIcon` 就以為 View UI Plus 內建該圖標 | API 名稱看起來像內建能力 | `customIcon` 通常只是讓使用者傳自訂 class，外部 CSS 與字體檔仍要自行提供。 |
| 所有圖標都應該從 `Icon` component 出現 | 統一 component 看起來更理想 | 原始碼中可能存在直接 class 寫法，閱讀時要以最終 class 系統為準。 |
| `Icon` 有 click listener 就代表它是互動元件 | Vue 3 listener 可以 fallthrough 到根節點 | handler 與狀態仍由父元件決定，`Icon` 只是事件落點。 |

---

## 13. 本章總結

`Icon` 的重要性不在於它本身有複雜邏輯，而在於它提供了一個穩定、輕量、可重複組合的圖標呈現層。它把 `type`、`custom`、`size`、`color` 轉成 DOM class 與 style，讓高階元件不用重複處理圖標 class 映射。

在其他元件中，`Icon` 通常只負責視覺，不負責互動語意。`Button` 決定按鈕 click，`Tabs` 決定關閉 tab，`Tree` 決定展開節點，`Select` 決定下拉與清除狀態。`Icon` 只是這些元件用來呈現圖標的一個視覺原子。

閱讀 View UI Plus 原始碼時，看到 `Icon` 應該先判斷父元件如何決定圖標來源、是否支援自訂 icon、是否透過父元件 class 控制位置與狀態，以及互動行為是否仍由父元件管理。這樣才能避免把父元件責任誤判成 `Icon` 的責任。

---

## 14. 自我檢查問題

1. 為什麼說 `Icon` 是 View UI Plus 中的「共用視覺原子」？
2. `Button` 內部使用 `Icon` 時，為什麼 click 行為不應該由 `Icon` 自己處理？
3. `Avatar` 使用 `Icon` 時，閱讀重點應該放在 `Icon` 還是 fallback 流程？為什麼？
4. 父元件傳給 `Icon` 的額外 class 通常負責哪些事情？
5. `<Icon type="ios-close" />` 和 `<i class="ivu-icon ivu-icon-ios-close"></i>` 的共同點與差異是什麼？
6. 當父元件支援 `customIcon` 時，為什麼還需要外部 CSS 或 icon font？
7. 讀到 `Tree` 或 `Cell` 的 arrow icon 時，應該檢查哪些父元件設定？
8. 如果圖標可以點擊，如何判斷行為是由 `Icon` 管理，還是由父元件管理？
9. 為什麼圖標的旋轉、hover、active 狀態通常應該回到父元件樣式檔檢查？
10. 什麼情況下需要回頭重看 `Icon` 的 props 與 render 實作？

---

## 15. 後續延伸方向

這份筆記可以作為閱讀 View UI Plus 其他元件的基礎。後續可以拆成以下幾個更深入的主題。

### 15.1 `Button` 與 `Icon` 的組合實作

可以獨立閱讀 `Button` 如何處理 `icon`、`customIcon`、`loading`，並分析 loading 狀態下圖標與文字的排列方式。這會幫助你理解「互動元件如何組合視覺原子」。

### 15.2 `Select` / `Cascader` / `ColorPicker` 的箭頭與清除圖標

這類元件適合觀察圖標和狀態樣式的關係，例如展開時的箭頭旋轉、hover 時的清除 icon、disabled 狀態下的顏色變化。

### 15.3 `Tree` / `Menu` / `Cell` 的展開圖標

這類元件適合觀察 icon 如何承載結構狀態，例如 expanded、selected、active、disabled。閱讀重點應放在父元件的資料結構與狀態轉換。

### 15.4 `customIcon` API 設計

可以進一步整理 View UI Plus 中哪些元件支援 `customIcon` 或類似 prop，並比較它們如何把自訂 class 傳給 `Icon`。這有助於理解元件庫如何在「內建設計系統」和「使用者自訂能力」之間取得平衡。

### 15.5 直接 `<i>` 寫法的重構評估

如果在原始碼中看到大量直接 `<i class="ivu-icon ...">`，可以思考是否需要統一改成 `Icon` component。評估時應考量可讀性、一致性、效能、歷史相容性與重構風險。

---

## 16. 本章閱讀重點回收

讀完本章後，請把重點收斂成一句話：

> `Icon` 在其他元件中的角色不是管理互動，而是提供穩定的圖標呈現能力；父元件負責語意、狀態與行為，`Icon` 負責把圖標相關 props 轉成 class 與 style。

只要掌握這個原則，之後閱讀 `Button`、`Avatar`、`Tabs`、`Select`、`Tree` 等元件時，就能更清楚地拆分責任邊界，不會把高階元件的狀態邏輯誤認為 `Icon` 的邏輯。
