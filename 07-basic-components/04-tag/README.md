# View UI Plus Tag 原始碼閱讀總覽：從小型標籤元件理解互動、樣式與控制邊界

## 0. 原始筆記問題分析

這份原始 `README.md` 已經具備良好的總覽雛形：它指出本目錄聚焦 View UI Plus 的 `Tag` 元件，也列出了 runtime、style、type declaration、example、registry、install 與 consumer 等重要閱讀入口。原文也已經抓到 `Tag` 的核心價值：它不是單純的視覺標籤，而是一個同時包含展示、關閉、選取、自定義顏色、尺寸與事件輸出的輕量互動元件。

不過，若要作為長期學習用的教材型 README，原始筆記還可以再補強幾個方向。

第一，原文已經列出閱讀焦點，但各焦點之間的層次關係還可以更清楚。對初次閱讀原始碼的人來說，應該先知道 `Tag` 在元件庫中的學習位置，再理解它的 source map，最後才進入 props、render、style、state 與 event 的拆解。

第二，原文的 `Source Baseline` 表格已列出檔案，但可以再補充「為什麼要讀這個檔案」與「讀它時要帶著什麼問題」。這樣讀者不會只是照表打開檔案，而是知道每個檔案在整個元件理解中的角色。

第三，原文已經提到 `props / default slot -> DOM -> class / inline style -> isChecked -> event boundary` 的轉換鏈，但這條鏈很重要，適合補成整章的主軸圖像。因為 `Tag` 的價值正是在於它把外部輸入、內部狀態、樣式分支與事件輸出串成一個小型互動模型。

第四，原文的 `Notes Index` 已經能引導閱讀 01～04 章，但可以再補上「每一章讀完後應該解決什麼問題」。這會讓 README 更像一份學習路線，而不只是目錄索引。

第五，原文的 `Learning Outcome` 和 `Self Check` 已經有複習功能，但仍可補上常見誤區、後續延伸方向與資訊不足標註，讓它更適合放進個人知識庫長期維護。

本筆記因此會把原始 README 重構成「Tag 原始碼閱讀入口頁」。它的目標不是深入重複 01～04 章的所有細節，而是建立完整學習地圖，讓讀者知道為什麼要讀 `Tag`、應該怎麼讀，以及讀完後應該形成哪些理解。

---

## 1. 本章定位

本章是一篇 **原始碼閱讀總覽筆記**，也是整個 `Tag` 筆記目錄的入口頁。

它不會逐行分析 `tag.vue` 的 computed，也不會完整展開 `tag.less` 的 selector 細節。那些內容應該分別放在後續章節中處理：

- `01-source-map.md`：建立檔案入口與責任分工。
- `02-public-props-and-type-contract.md`：對照 runtime props、TypeScript declaration 與事件 payload。
- `03-render-class-and-color-system.md`：分析 template、class、inline style 與 less 的分工。
- `04-state-events-and-control-boundary.md`：分析 `checked`、`isChecked`、`on-change`、`on-close` 與外部控制邊界。

這份 README 要回答的是更上層的問題：**為什麼 `Tag` 值得讀？閱讀它時要看哪些檔案？這些檔案之間如何形成一個完整元件？**

如果把每一篇子筆記想成技術書中的一節，那麼這份 README 就是本章的導讀。它負責先建立全局圖像，避免一開始就陷入零散的 props、class 或事件細節。

---

## 2. 為什麼 `Tag` 適合作為小型互動元件的閱讀案例

`Tag` 表面上看起來只是一個「帶顏色的標籤」。在使用者介面中，它通常用來表示分類、狀態、關鍵字、篩選條件或可移除項目。但從元件實作角度來看，`Tag` 並不是純展示元件。

它至少同時承載了五種責任。

第一，它要處理 **展示內容**。使用者放進 default slot 的文字或內容，會被包進 `Tag` 的 text 節點裡，形成可視化標籤。

第二，它要處理 **視覺變體**。例如普通標籤、`border` 樣式、`dot` 樣式、不同尺寸、內建色與自定義色，這些都會影響 class 或 inline style。

第三，它要處理 **關閉意圖**。當 `closable` 為 true 時，`Tag` 會顯示 close icon，並在點擊時 emit `on-close`。

第四，它要處理 **選取狀態**。當 `checkable` 為 true 時，使用者點擊根節點可以切換內部的 `isChecked` 狀態，並 emit `on-change`。

第五，它要處理 **外部控制邊界**。`Tag` 不擁有列表資料，也不會自行刪除 DOM。它只負責把互動結果通知外部，至於是否移除標籤、是否同步選取結果，必須由使用者或上層元件決定。

因此，`Tag` 是一個很適合練習「小型元件原始碼閱讀」的案例。它不像大型表單元件那樣有複雜依賴，也不像純展示元件那樣只有 class 與 slot。它剛好位在中間：程式碼量不大，但足以練習 public API、render structure、style system、internal state 與 event boundary 的整合閱讀。

---

## 3. `Tag` 的核心轉換鏈

閱讀 `Tag` 時，最重要的不是記住每個 prop，而是理解它如何把外部輸入轉成實際畫面與事件輸出。

整體可以視為以下轉換鏈：

```txt
props / default slot
  -> root / dot / text / close icon structure
  -> class / inline style color path
  -> internal isChecked state
  -> on-change / on-close event boundary
```

這條鏈可以拆成五個階段。

### 3.1 外部輸入：`props` 與 default slot

`Tag` 的外部輸入主要來自 props 與 default slot。props 決定互動能力、視覺樣式、初始選中狀態與事件識別值；default slot 則提供標籤中要顯示的內容。

這裡要特別注意：`name` 不是顯示文字。顯示內容來自 slot，而 `name` 主要用於事件 payload，讓外部在列表場景中知道是哪一顆 `Tag` 被點擊或關閉。

### 3.2 DOM 結構：root、dot、text、close icon

`Tag` 的 template 會產生一個固定的 root `div`。在 root 內部，text 節點永遠存在；dot 節點會在 `type="dot"` 時出現；close `Icon` 會在 `closable=true` 時出現。

因此，`Tag` 的 DOM 結構不是完全固定，也不是完全動態生成。它是一個固定骨架加上少數條件分支的元件。

### 3.3 樣式路徑：class 與 inline style

`Tag` 的樣式系統分成兩條路徑。

內建色會產生 `ivu-tag-*` 相關 class，最後由 `tag.less` 定義具體視覺。這類樣式包含基礎尺寸、語意色、色階色、`border`、`dot`、未選中狀態與 close icon 位置。

自定義色則不會產生對應的內建 class。當 `color` 不是內建色時，runtime 會透過 computed style 產生 inline style，例如 root 背景、邊框、文字顏色或 dot 顏色。

這也是閱讀 `Tag` 時最容易犯錯的地方：只看 `tag.less` 會漏掉自定義色，只看 `tag.vue` 又看不到內建色的完整視覺規則。

### 3.4 內部狀態：`checked` 到 `isChecked`

`checked` prop 會初始化內部狀態 `isChecked`。當外部的 `checked` 改變時，watcher 會把新值同步進 `isChecked`。

但是，`Tag` 沒有使用 Vue 3 標準的 `modelValue` / `update:modelValue`。點擊 `checkable` Tag 時，它會先更新自己的 `isChecked`，再 emit `on-change`。所以它比較像「prop 初始化 + watcher 同步 + 內部可修改」的狀態模型，而不是標準受控元件模型。

### 3.5 事件邊界：`on-change` 與 `on-close`

`on-change` 表示選取狀態變化，`on-close` 表示使用者點擊了關閉 icon。這兩個事件都只是通知外部，並不代表 `Tag` 會自動完成外部資料更新。

對 `Tag` 來說，這是一個很重要的設計邊界：元件本身處理單顆標籤的互動，外部負責資料來源、列表更新與 DOM 是否存在。

---

## 4. Source Baseline：閱讀基準與檔案角色

本目錄以本地保存的 View UI Plus `v1.3.20` 原始碼作為閱讀基準。由於本筆記是原始碼閱讀筆記，所有判斷都應優先回到該版本的原始碼與已整理的子筆記確認。

| 類型 | 路徑 | 角色 | 閱讀時要問的問題 |
| --- | --- | --- | --- |
| Runtime | `01-origin/source/view-ui-plus-v1.3.20/src/components/tag/tag.vue` | `Tag` 的主要行為入口，負責 props、template、computed class/style、`isChecked`、watcher 與事件方法。 | 這個元件接收哪些輸入？如何產生 DOM、class、style 與事件？ |
| Runtime entry | `01-origin/source/view-ui-plus-v1.3.20/src/components/tag/index.js` | 單元件入口，通常用來匯出 `tag.vue`。 | 使用者或元件庫內部如何引用 `Tag`？ |
| Style | `01-origin/source/view-ui-plus-v1.3.20/src/styles/components/tag.less` | `Tag` 的主要視覺來源，定義基礎樣式、尺寸、選中、未選中、關閉、`border`、`dot` 與內建色。 | runtime 產生的 class 最後在畫面上變成什麼效果？ |
| Type declaration | `01-origin/source/view-ui-plus-v1.3.20/types/tag.d.ts` | TypeScript public contract，描述使用者能看到的 props 與事件 listener 型別。 | `.d.ts` 和 runtime props 是否一致？哪些地方比較寬或比較窄？ |
| Type export entry | `01-origin/source/view-ui-plus-v1.3.20/types/viewuiplus.components.d.ts` | 將 `Tag` 放進 typed public exports。 | `Tag` 如何進入元件庫的型別出口？ |
| Example | `01-origin/source/view-ui-plus-v1.3.20/examples/routers/tag.vue` | 官方示範使用場景，包含普通、可選取、可關閉、自定義顏色、尺寸等組合。 | 官方希望使用者怎麼組合這些 props？ |
| Registry | `01-origin/source/view-ui-plus-v1.3.20/src/components/index.js` | 對外匯出元件，讓 `Tag` 進入 components public export。 | `Tag` 是否與 `TagSelect`、`TagSelectOption` 一起對外暴露？ |
| Install | `01-origin/source/view-ui-plus-v1.3.20/src/index.js` | 全域安裝時的註冊流程。 | plugin install 時 `Tag` 如何被註冊成全域元件？ |
| Consumer | `01-origin/source/view-ui-plus-v1.3.20/src/components/tag-select/tag-select-option.vue` | `Tag` 的重要使用者，將 `Tag checkable` 包成選項。 | 單顆 `Tag` 的事件如何被上層接管成列表選取邏輯？ |

這張表不是單純的檔案清單，而是一張 source map。讀原始碼時，應該先知道每個檔案回答哪一類問題，再決定閱讀順序。否則很容易只盯著 `tag.vue`，卻忽略 `tag.less`、`.d.ts` 或 consumer 對理解元件邊界的重要性。

---

## 5. 五個閱讀主軸

閱讀 `Tag` 時，建議把問題拆成五個主軸。這五個主軸也對應後續 01～04 章的拆解方式。

### 5.1 Public Contract：使用者能傳什麼、監聽什麼

public contract 是元件對外承諾的使用方式。對 `Tag` 來說，這包含 `closable`、`checkable`、`checked`、`color`、`type`、`name`、`size` 等 props，也包含 `on-change` 與 `on-close` 事件。

閱讀 public contract 時，不要只背 props 名稱。更重要的是判斷每個 prop 屬於哪一類責任：

| 責任類型 | 相關 props / events | 閱讀重點 |
| --- | --- | --- |
| 互動能力 | `closable`、`checkable` | 是否開啟 close icon 或 click-to-check 行為。 |
| 狀態輸入 | `checked` | 如何初始化與同步內部 `isChecked`。 |
| 視覺輸入 | `color`、`type`、`size` | 如何影響 class、inline style 與 less 分支。 |
| 事件識別 | `name` | 如何讓 `on-change` / `on-close` 帶回識別值。 |
| 事件輸出 | `on-change`、`on-close` | 回報狀態變化或關閉意圖，但不直接更新外部資料。 |

其中最值得注意的是 `color`、`checked` 與 `name`。`color` 在 runtime 和 `.d.ts` 之間存在表達落差；`checked` 看起來像受控值，但不是標準 `v-model`；`name` 不影響畫面，卻會改變事件 payload。

### 5.2 Render Structure：元件實際渲染出什麼

`Tag` 的 render structure 很小，但不能因此忽略。它至少包含 root、text、dot 與 close icon 幾個層次。

讀 template 時，可以帶著以下問題：

1. 哪些節點永遠存在？
2. 哪些節點由 props 控制是否出現？
3. default slot 放在哪裡？
4. close icon 的 click 是否會冒泡到 root？
5. `type="dot"` 是否只改 class，還是也改 DOM 結構？

這些問題能幫助你從「會用元件」進一步提升到「看得懂元件實作」。

### 5.3 Class 與 Inline Style：內建色與自定義色的分流

`Tag` 的顏色系統不能只從一個檔案理解。內建色與自定義色是兩條不同路徑。

| 顏色來源 | 實作路徑 | 閱讀重點 |
| --- | --- | --- |
| 內建色 | runtime 產生 `ivu-tag-*` class，交給 `tag.less` 定義視覺。 | 要回到 less 觀察背景、邊框、文字、dot、border type 的具體規則。 |
| 自定義色 | runtime 透過 computed style 產生 inline style。 | 要看 `wraperStyles`、`textColorStyle`、`bgColorStyle` 如何分別作用。 |

因此，當你看到 `color="#EF6AFF"` 這類自定義色時，不應該去 `tag.less` 找 `ivu-tag-#EF6AFF`。這種 class 不會存在。正確做法是回到 runtime computed style 觀察它如何被寫入 DOM。

### 5.4 State：`checked` 與 `isChecked` 的關係

`Tag` 的內部狀態很少，核心就是 `isChecked`。但這個小狀態牽涉到一個重要觀念：元件可以同時接收外部 prop，又保留內部可變狀態。

`checked` 會初始化 `isChecked`，watcher 會在外部 prop 改變時同步 `isChecked`。但點擊 `checkable` Tag 時，元件會先自己反轉 `isChecked`，再發出 `on-change`。

這種模式對初學者很有價值，因為它可以幫助你比較以下三種元件狀態模型：

| 模型 | 特徵 | `Tag` 是否屬於此類 |
| --- | --- | --- |
| 純展示元件 | 只根據 props / slot 顯示畫面，沒有內部互動狀態。 | 不是。 |
| 標準受控元件 | 外部資料是唯一來源，透過 `modelValue` / `update:modelValue` 同步。 | 不是標準形式。 |
| 內部狀態 + 外部同步 | prop 初始化內部 state，內部可改，外部 prop 改變時再同步。 | 是，比較接近這類。 |

理解這一點後，就不會把 `checked` 直接誤認成 Vue 3 的 `v-model`。

### 5.5 Event Boundary：事件只回報意圖，不替外部改資料

`Tag` 的事件邊界可以用一句話理解：**`Tag` 負責回報互動，外部負責更新資料。**

`on-change` 回報新的 checked 狀態。若有 `name`，會額外帶回識別值。

`on-close` 回報 click event。若有 `name`，也會額外帶回識別值。

但不管是哪一個事件，`Tag` 都不會替外部完成資料更新。尤其是 `closable`，它只代表「顯示 close icon 並 emit close event」，不代表元件會自動消失。是否將該 Tag 從陣列中移除，必須由外部 handler 決定。

---

## 6. Notes Index：建議閱讀順序

本目錄的子筆記建議依照以下順序閱讀。順序不要隨意打亂，因為每一章都在替下一章建立必要背景。

| 順序 | 筆記 | 主題 | 讀完後應該能回答 |
| --- | --- | --- | --- |
| 1 | `01-source-map.md` | 原始碼入口地圖與責任分工 | `Tag` 的 runtime、style、type、example、registry、install、consumer 分別在哪裡？ |
| 2 | `02-public-props-and-type-contract.md` | public props 與 TypeScript contract | runtime props、`.d.ts`、事件 listener 與 payload 之間有什麼一致與落差？ |
| 3 | `03-render-class-and-color-system.md` | render、class 與顏色系統 | `Tag` 如何從 props 產生 DOM、class、inline style？內建色與自定義色如何分流？ |
| 4 | `04-state-events-and-control-boundary.md` | 狀態、事件與控制邊界 | `checked` / `isChecked` 如何同步？`on-change` / `on-close` 的責任邊界在哪裡？ |

這個順序的核心邏輯是：先建立地圖，再看 public API，接著看畫面如何產生，最後看互動與外部控制。這樣讀比較不容易被細節打散。

---

## 7. 建議閱讀方法

### 7.1 第一次閱讀：先建立整體印象

第一次讀 `Tag` 時，不建議直接陷入每個 computed 的細節。你應該先回答三個問題：

1. `Tag` 對外提供哪些能力？
2. 這些能力分別由哪個檔案負責？
3. 它和 `TagSelectOption` 這類 consumer 的邊界在哪裡？

這一輪可以先讀 README 和 `01-source-map.md`，目的只是建立地圖。

### 7.2 第二次閱讀：對照 API 與 runtime

第二次閱讀時，重點放在 `02-public-props-and-type-contract.md`。這時要把 runtime props、`.d.ts` 與 methods 放在一起看。

例如：

- `color` 在 `.d.ts` 中可能比 runtime 窄。
- `size` 在 `.d.ts` 中可能比 runtime 寬。
- `name` 不影響畫面，卻影響事件 payload。
- `checked` 可以同步到內部狀態，但不是標準 `v-model`。

這一輪的目標是建立「元件 public contract 不是只看 props 表」的觀念。

### 7.3 第三次閱讀：對照 DOM、class 與 less

第三次閱讀時，重點放在 `03-render-class-and-color-system.md`。這時要把 template、computed class、computed style 與 `tag.less` 放在一起看。

建議的閱讀方式是選幾個場景逐一追蹤：

```vue
<Tag>Label</Tag>
<Tag closable>Label</Tag>
<Tag type="border" color="primary">Label</Tag>
<Tag type="dot" color="success">Label</Tag>
<Tag color="#EF6AFF">Label</Tag>
```

每個場景都問同樣幾個問題：

1. DOM 會多哪些節點？
2. root 會有哪些 class？
3. 文字節點會有哪些 class 或 style？
4. 顏色由 less 還是 inline style 決定？
5. close icon 或 dot 是否有額外的樣式來源？

這樣可以把 abstract props 轉成具體畫面。

### 7.4 第四次閱讀：追蹤事件與外部控制

第四次閱讀時，重點放在 `04-state-events-and-control-boundary.md`。這時要把 `checked`、`isChecked`、watcher、`check()`、`close()` 與 external handler 串起來。

建議特別追蹤兩條流程：

```txt
root click
  -> check()
  -> if checkable
  -> toggle isChecked
  -> emit on-change
  -> external handler decides whether to sync data
```

```txt
close icon click
  -> close(event)
  -> emit on-close
  -> external handler decides whether to remove item
```

這兩條流程能幫助你建立元件邊界意識：元件回報互動，外部維護資料。

---

## 8. 讀完本目錄後應建立的能力

完成本目錄後，應該不只是知道 `Tag` 怎麼用，而是能建立以下幾種原始碼閱讀能力。

### 8.1 能辨識小型互動元件的組成層次

你應該能看出一個看似簡單的 UI component，實際上可能同時包含 public API、DOM 結構、樣式分支、內部狀態與事件邊界。這種拆解能力之後可以套用到 `Badge`、`Alert`、`Message` 或其他中小型元件上。

### 8.2 能對照 runtime 與 TypeScript declaration

你應該能理解 `.d.ts` 不一定完整等於 runtime 行為。有時 declaration 較窄，例如自定義 `color`；有時 declaration 較寬，例如 `size?: string`。閱讀元件庫時，必須同時看 runtime source 與 type declaration。

### 8.3 能區分 class 樣式與 inline style 樣式

你應該能辨識哪些視覺結果是由 less class 產生，哪些是由 runtime inline style 產生。這對理解元件庫的主題色、動態色、客製化樣式非常重要。

### 8.4 能理解「事件不是資料更新本身」

你應該能清楚說出：`on-change` 與 `on-close` 只是事件通知，不代表資料已經被更新。外部是否回寫 checked、是否 splice 陣列、是否移除 DOM，都不是 `Tag` 本體的責任。

### 8.5 能從 consumer 反推元件邊界

`TagSelectOption` 是非常重要的延伸閱讀入口。它展示了 `Tag` 如何被包裝成列表選項，也讓你看到「單顆標籤互動」和「整組標籤選取狀態」應該分層處理。

---

## 9. 常見誤解整理

| 誤解 | 正確理解 |
| --- | --- |
| `Tag` 只是帶顏色的 `span` | `Tag` 同時處理展示、關閉、選取、自定義顏色、尺寸與事件輸出。 |
| 只看 `tag.vue` 就能理解全部 | 內建色、尺寸、border、dot、未選中狀態與 close icon 視覺都需要回到 `tag.less`。 |
| 只看 `tag.less` 就能理解顏色 | 自定義色主要走 runtime computed inline style，不是 less class。 |
| `closable` 會讓標籤自動消失 | `closable` 只顯示 close icon 並 emit `on-close`，是否移除由外部決定。 |
| `checkable` 就是完整受控選取 | `checkable` 只讓 root click 可以切換內部 `isChecked`，並 emit `on-change`。 |
| `checked` 等於 `v-model` | `Tag` 沒有 `modelValue` / `update:modelValue`，它是 prop 初始化與 watcher 同步模型。 |
| `name` 是顯示文字 | 顯示文字來自 default slot，`name` 主要用於事件 payload 識別。 |
| `.d.ts` 一定完整描述 runtime | `.d.ts` 是 public typing，但可能比 runtime 寬或窄，需要對照原始碼。 |

---

## 10. 後續延伸方向

這份 README 是整個 `Tag` 閱讀目錄的總覽。讀完 01～04 章後，可以往以下方向延伸。

### 10.1 深入 `TagSelect` 與 `TagSelectOption`

`TagSelectOption` 是理解 `Tag` consumer 的入口，但如果要完整理解列表選取、全選、展開與 `modelValue` 同步，就需要繼續閱讀 `TagSelect` 本體。這可以成為下一組筆記。

### 10.2 對照其他小型狀態元件

可以選擇 `Badge`、`Alert`、`Message` 等元件做對照。比較它們是否也有類似的 public contract、style system、internal state 與 event boundary。

### 10.3 補一篇「自定義色與主題色系統」專題

`Tag` 的自定義色是很好的入口，但 View UI Plus 的顏色系統不只存在於 `Tag`。後續可以整理一篇更大的主題：內建色、語意色、色階色、less 變數、mixin 與 runtime inline style 的分工。

### 10.4 補一篇「非標準 v-model 元件狀態模型」專題

`Tag` 的 `checked` / `isChecked` 模型很適合延伸到更一般的元件設計問題：什麼是受控元件？什麼是非受控元件？Vue 3 的 `v-model` contract 和舊式 event contract 有什麼差異？

### 10.5 自己重寫一個 Mini Tag

如果目標是強化前端實作能力，建議在讀完原始碼後自己實作一個簡化版 `MiniTag`。練習內容可以包含：

1. `closable` 與 `on-close`。
2. `checkable`、`checked` 與內部 `isChecked`。
3. `type="border"` / `type="dot"`。
4. 內建色 class 與自定義色 inline style。
5. 有 `name` 與沒有 `name` 時的事件 payload。

這個練習可以幫助你把原始碼閱讀轉換成自己的工程能力。

---

## 11. 本章總結

`Tag` 是一個小而完整的互動元件案例。它的價值不在於程式碼複雜，而在於它把元件庫中常見的幾個核心問題濃縮在一起：public props、TypeScript contract、template 結構、class 與 inline style、less 樣式規則、內部狀態、事件輸出與外部控制邊界。

閱讀 `Tag` 時，不要只把它當成 UI 樣式元件。更好的讀法是把它視為一條資料與行為轉換鏈：

```txt
外部輸入
  -> DOM 結構
  -> class / inline style
  -> 內部狀態
  -> 事件輸出
  -> 外部資料更新
```

只要能看懂這條鏈，就能把 `Tag` 的閱讀方法遷移到其他元件。這也是學習元件庫原始碼最重要的能力：不是背單一元件的實作，而是建立可複用的閱讀框架。

---

## 12. 自我檢查問題

1. 為什麼 `Tag` 不應該只被理解成一個帶顏色的 `span`？
2. `Tag` 的完整理解為什麼必須同時看 runtime、style、type declaration、example 與 consumer？
3. `Tag` 的核心轉換鏈可以分成哪幾個階段？
4. 內建色與自定義色分別走什麼樣式路徑？
5. `checked` 與 `isChecked` 的關係是什麼？為什麼它不是標準 `v-model`？
6. `closable` 為什麼只代表關閉意圖，而不是自動刪除元件？
7. `name` 不影響畫面，為什麼仍然是重要的 public prop？
8. `TagSelectOption` 為什麼是理解 `Tag` 控制邊界的重要 consumer？
9. 如果要閱讀 `Tag`，為什麼建議先看 source map，再看 props contract，接著看 render/style，最後看 state/events？
10. 讀完 `Tag` 後，你可以如何把這套閱讀方法套用到其他 View UI Plus 元件？

---

## 13. 資訊不足與後續確認

本 README 是以目前已整理的 `Tag` 筆記與本地 View UI Plus `v1.3.20` source baseline 為基準。若後續要把它升級成更完整的原始碼導讀章節，建議補充以下資料：

1. `tag.vue` 的完整原始碼段落與行號，方便在筆記中加入更精準的定位。
2. `tag.less` 中內建色、`border`、`dot` 與未選中樣式的實際 selector 區塊。
3. `types/tag.d.ts` 的完整型別宣告，便於更嚴謹地比較 runtime 與 type contract。
4. `examples/routers/tag.vue` 的官方範例截圖或案例分組。
5. `TagSelect` 本體的 source map，用於補完整個 tag-select family 的控制流程。

目前筆記中沒有任意補寫未提供的原始碼行號，也沒有假設未確認的 API 行為。若需要精準到原始碼行級別，應回到本地 `v1.3.20` 原始碼逐段標註。

---

## 14. 品質檢查

- 已保留原始 README 的核心主題：`Tag` 原始碼閱讀總覽。
- 已保留原始 source baseline 中的主要檔案路徑與閱讀目的。
- 已補強 `Tag` 作為小型互動元件的學習價值。
- 已將原始「閱讀焦點」補成五個完整教學主軸。
- 已補上閱讀順序、閱讀方法、常見誤解、自我檢查問題與後續延伸方向。
- 已避免把內容壓縮成單純速查表。
- 已標註需要後續補充的資訊。
- 未編造未提供的原始碼行號或不存在的 API。
