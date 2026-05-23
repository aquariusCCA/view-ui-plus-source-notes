# View UI Plus Icon 原始碼閱讀指南

## 0. 原始筆記問題分析

### 0.1 筆記類型判斷

這份原始筆記比較接近「原始碼閱讀目錄型筆記」，同時具有「架構導讀筆記」的性質。它不是要逐行分析 `icon.vue`，也不是要列出所有內建圖標名稱，而是要幫助讀者先建立一張閱讀地圖：理解 `Icon` 這個元件在 View UI Plus 中的位置、需要對照哪些來源檔案，以及後續幾篇細節筆記應該按照什麼順序閱讀。

因此，重構時不應把它改成單純 API 文件，也不應把所有 `Icon` 細節塞進 README。README 的責任應該是：先建立閱讀方向，再說明每一篇子筆記各自負責哪一段知識，最後提供複習與回查方式。

### 0.2 原始筆記已有的優點

原始筆記已經抓到 `Icon` 的核心特徵：

1. `Icon` 是 View UI Plus 中低狀態、低互動、低分支的基礎元件。
2. 它的重點不是複雜邏輯，而是 public props 如何穩定映射到 class 與 inline style。
3. 圖標字形本身不在 Vue component 裡，而是在 icon font 樣式系統中。
4. 想完整理解 `Icon`，需要同時對照 runtime、type declaration、style、example、registry 與 install。
5. `Icon` 不只會被使用者直接使用，也會被 `Button`、`Avatar`、`Tabs`、`Select`、`Tree` 等其他元件組合使用。

這些資訊都應該保留，因為它們構成整個 `Icon` 目錄的學習主軸。

### 0.3 需要補強的地方

原始筆記目前已經像一份清楚的 README，但如果要變成長期學習用的教材型入口，還可以補強幾個方向。

第一，原始筆記直接進入結論，對「為什麼 `Icon` 適合作為第一個基礎元件閱讀案例」說明還可以更完整。對初學者來說，需要先知道：低狀態元件雖然簡單，但最適合拿來練習元件庫閱讀的基本方法。

第二，原始筆記列出 source baseline，但可以進一步說明每一類檔案回答的問題。例如 runtime 回答「如何輸出 DOM」，type declaration 回答「對外承諾什麼 API」，style 回答「class 如何變成圖標」，registry / install 回答「它如何進入 public surface」。

第三，原始筆記有 Notes Index，但可以補成「初次閱讀路線、深入閱讀路線、回查路線」。這樣之後複習或除錯時，不需要從頭讀完全部筆記，而是可以依照問題快速跳轉。

第四，原始筆記有 Self Check，但題目偏少。可以補成不同類型的問題：概念理解、流程追蹤、原始碼定位、實務排錯與比較題。

第五，README 應該標註資訊邊界。這份筆記以本地保存的 View UI Plus `v1.3.20` 原始碼為閱讀基準；如果未來版本切換成 SVG icon、改變 prefix、或調整 Vue component 實作，就需要重新對照新版本 source。

---

## 1. 本章定位

本章是 View UI Plus `Icon` 圖標元件閱讀目錄的入口文件。它的目的不是把 `Icon` 的每一段原始碼全部講完，而是先回答一個更前置的問題：

> 如果我要系統性理解 View UI Plus 的 `Icon`，應該先看什麼、再看什麼、最後如何把 runtime、型別、樣式與其他元件使用情境串起來？

`Icon` 是一個很適合拿來練習元件庫閱讀方法的元件。它的 Vue component 很小，沒有複雜狀態機，也沒有自己的事件流程；但它又不是沒有價值。它剛好展示了元件庫中非常常見的一種模式：

```txt
public props
  -> computed class / inline style
  -> template / DOM output
  -> CSS rule / icon font
  -> 被其他高階元件重複組合
```

這條線看似簡單，卻是閱讀 UI 元件庫時非常重要的基本功。許多元件的外觀、尺寸、狀態與語意，最後都會落在 class、style、slot、子元件組合與 CSS 規則之間的協作。`Icon` 剛好把這件事壓縮到最小範圍，適合作為第一個閱讀樣本。

---

## 2. 讀者背景與學習目標

這份目錄假設讀者已經具備基本前端開發能力，知道 Vue component、props、class binding、inline style、CSS class、pseudo-element 與 font icon 的基本概念，但不一定熟悉 View UI Plus 的原始碼結構。

讀完本目錄以及後續四篇筆記後，應該能建立以下能力：

1. 能說明 `Icon` 在 View UI Plus 元件庫中的定位。
2. 能知道要從哪些檔案理解 `Icon` 的完整行為。
3. 能追蹤 `type`、`custom`、`size`、`color` 如何影響最後的 DOM、class 與 style。
4. 能理解 `Icon` component 本身不保存圖標字形，真正的字形來源在 icon font 樣式系統。
5. 能在閱讀 `Button`、`Avatar`、`Tabs`、`Select`、`Tree` 等元件時，把 `Icon` 視為共用視覺原子，而不是把父元件行為誤判成 `Icon` 的責任。
6. 能在圖標不顯示、圖標樣式錯誤、或自訂 icon font 失效時，知道應該往 runtime、class、style import、font files 或父元件 class 哪個方向排查。

---

## 3. 為什麼先讀 `Icon`

### 3.1 `Icon` 是低狀態元件

在 UI 元件庫中，有些元件需要處理複雜狀態，例如 `Select` 要管理下拉狀態、選項狀態、清除、搜尋與鍵盤操作；`Table` 要處理欄位、資料、排序、篩選、固定欄與展開列。這類元件雖然重要，但一開始閱讀容易被大量細節淹沒。

`Icon` 則不同。它沒有自己的資料流程，也沒有複雜事件語意。它的核心任務是接收 props，然後輸出一個帶有 class 與 inline style 的 `<i>` 節點。這種低狀態特性讓讀者可以把注意力放在元件庫最基本的幾個問題上：

- public API 如何定義？
- runtime source 如何使用這些 API？
- component 輸出的 class 如何接到 CSS？
- 樣式系統如何讓 class 變成畫面上的圖標？
- 其他元件如何重複組合這個基礎能力？

### 3.2 `Icon` 是 class / style 映射元件

`Icon` 的核心不是演算法，而是穩定的映射關係。

```txt
type   -> ivu-icon-${type}
custom -> 使用者提供的自訂 class
size   -> font-size: ${size}px
color  -> color: ${color}
```

這種映射是元件庫設計中很常見的技巧。元件本身不一定要保存所有視覺資料，而是透過命名規則、樣式前綴、class binding 與 CSS 系統合作。只要命名規則穩定，父元件與使用者就可以用簡單 API 取得一致的視覺表現。

### 3.3 `Icon` 是其他元件的視覺原子

`Icon` 不只是一個可以被使用者直接寫在頁面上的元件。它也會被其他元件使用，例如按鈕中的圖標、頭像 fallback、下拉箭頭、關閉按鈕、樹節點展開箭頭等。

在這些場景中，`Icon` 通常只負責「顯示哪個圖標」，而不負責「什麼時候點擊、什麼時候展開、什麼時候關閉」。互動語意通常由父元件管理。理解這個責任邊界，對後續閱讀更複雜的元件非常重要。

---

## 4. Source Baseline

本目錄以本地保存的 View UI Plus `v1.3.20` 原始碼為閱讀基準。閱讀時應該把下列來源視為一組，而不是只看單一 `.vue` 檔。

| 類型 | 路徑 | 回答的問題 | 閱讀目的 |
| --- | --- | --- | --- |
| Runtime | `01-origin/source/view-ui-plus-v1.3.20/src/components/icon/icon.vue` | `Icon` 實際如何渲染？ | 確認 props、computed class、inline style 與最終 DOM。 |
| Component Entry | `01-origin/source/view-ui-plus-v1.3.20/src/components/icon/index.js` | 單一元件如何被匯出？ | 確認 `icon.vue` 如何作為 `Icon` 元件入口。 |
| Type | `01-origin/source/view-ui-plus-v1.3.20/types/icon.d.ts` | 對外承諾哪些 API？ | 對照 `type`、`size`、`color`、`custom` 是否屬於 public contract。 |
| Example | `01-origin/source/view-ui-plus-v1.3.20/examples/routers/icon.vue` | 官方如何展示使用方式？ | 確認官方範例主要展示內建圖標名稱與基本用法。 |
| Style Import | `01-origin/source/view-ui-plus-v1.3.20/src/styles/common/index.less` | icon font 樣式如何被匯入？ | 追蹤 common style 如何接到 `iconfont/ionicons`。 |
| Icon Font | `01-origin/source/view-ui-plus-v1.3.20/src/styles/common/iconfont/` | class 如何變成圖標字形？ | 確認 Ionicons 字體、`.ivu-icon` 基礎樣式與 `ivu-icon-*` 對應表。 |
| Public Registry | `01-origin/source/view-ui-plus-v1.3.20/src/components/index.js` | `Icon` 是否進入元件庫對外匯出？ | 確認 `Icon` 是否被納入 public export。 |
| Plugin Install | `01-origin/source/view-ui-plus-v1.3.20/src/index.js` | 完整安裝時如何註冊？ | 確認全域安裝時 `Icon` 如何被註冊成可使用元件。 |

這張表的核心不是背路徑，而是理解每個來源檔案的責任。如果只看 `icon.vue`，你會知道它輸出 `<i>`；但如果不看 icon font 樣式，就不知道 `ivu-icon-ios-add` 為什麼能顯示圖標。如果只看 icon font 樣式，則不知道使用者傳入的 `type` prop 如何變成對應 class。

---

## 5. `Icon` 的核心心智模型

閱讀 `Icon` 時，可以先把它理解成「props 到 icon font class 的轉接層」。它不是真正存放圖標資料的地方，也不是負責互動行為的地方。它的責任是把使用者或父元件傳入的資料，穩定轉換成瀏覽器可以套用的 DOM、class 與 inline style。

完整鏈路可以整理如下：

```txt
使用者或父元件傳入 props
  -> Icon computed 產生 class / style
  -> template 輸出 <i>
  -> CSS 套用 .ivu-icon 基礎樣式
  -> CSS 套用 .ivu-icon-${type}:before
  -> icon font glyph 被瀏覽器渲染成圖標
```

用一個具體例子來看：

```vue
<Icon type="ios-add" size="24" color="#ff6600" />
```

概念上可以拆成下列階段：

| 階段 | 發生的事情 | 重點 |
| --- | --- | --- |
| Props | 傳入 `type="ios-add"`、`size="24"`、`color="#ff6600"` | 使用者只描述想要哪個圖標與基本樣式。 |
| Class Mapping | 產生 `ivu-icon ivu-icon-ios-add` | `type` 不需要自己寫 `ivu-icon-` 前綴。 |
| Style Mapping | 產生 `font-size: 24px; color: #ff6600;` | `size` 會被視為 px 單位。 |
| DOM Output | 輸出 `<i>` 節點 | `Icon` 固定輸出單根 `<i>`。 |
| CSS Icon Font | `.ivu-icon-ios-add:before` 指定 `content` | 實際圖標字形由 icon font 系統決定。 |
| Browser Render | 瀏覽器載入 Ionicons font 並顯示 glyph | 字體檔與 CSS 必須正確載入。 |

這個模型能幫助你把 `Icon` 的責任切清楚：`Icon` 做的是映射，不是保存圖形；父元件做的是語意與互動，不是讓 `Icon` 自己決定業務行為。

---

## 6. Notes Index：建議閱讀順序

本目錄建議按照下列順序閱讀。這個順序是從「看地圖」到「看 runtime」，再到「看樣式系統」，最後回到「看組合場景」。

| 順序 | 筆記 | 主題 | 建議閱讀目的 |
| --- | --- | --- | --- |
| 1 | `01-source-map.md` | 原始碼入口地圖 | 先知道 `Icon` 的 runtime、type、style、example、registry、install 分別在哪裡。 |
| 2 | `02-props-and-render.md` | props 到 render output | 理解 `type / custom / size / color` 如何轉成 class、inline style 與 `<i>`。 |
| 3 | `03-icon-font-system.md` | icon font 系統 | 理解 `.ivu-icon`、Ionicons 字體、`:before content` 與實際圖標字形的關係。 |
| 4 | `04-usage-in-other-components.md` | 跨元件使用 | 觀察 `Icon` 如何成為 `Button`、`Avatar`、`Tabs`、`Select`、`Tree` 等元件的共用視覺原子。 |

### 6.1 初次閱讀路線

初次閱讀時，建議不要一開始就深入完整 icon 清單，也不要急著查每個圖標名稱。你應該先建立整體架構：

```txt
01-source-map.md
  -> 02-props-and-render.md
  -> 03-icon-font-system.md
  -> 04-usage-in-other-components.md
```

這條路線能讓你先知道檔案在哪裡，再理解 props 如何輸出 DOM，接著補上 CSS icon font，最後看它在其他元件中的實際角色。

### 6.2 深入閱讀路線

如果你已經知道 `Icon` 的基本 API，可以改用深入路線：

```txt
icon.vue
  -> types/icon.d.ts
  -> src/styles/common/iconfont/
  -> examples/routers/icon.vue
  -> Button / Avatar / Tabs / Select / Tree 等父元件
```

這條路線適合用來訓練「從 runtime source 對照 public contract，再回到使用場景」的能力。

### 6.3 回查與除錯路線

如果遇到圖標顯示問題，可以依照問題類型回查：

| 問題 | 優先檢查 |
| --- | --- |
| class 沒有出現 | 回看 `02-props-and-render.md`，確認 `type` / `custom` 是否正確傳入。 |
| class 有出現但圖標不顯示 | 回看 `03-icon-font-system.md`，確認 `.ivu-icon-${type}:before` 與字體檔是否存在。 |
| 自訂 icon 不顯示 | 檢查 `custom` 只會追加 class，外部 icon font CSS 是否已載入。 |
| 圖標大小不對 | 檢查 `size` 是否被轉成 `font-size: ${size}px`。 |
| 圖標顏色不對 | 檢查 inline `color`、父元件樣式與 CSS 優先權。 |
| 點擊圖標沒有反應 | 回看父元件，確認 listener 是否掛在正確位置，以及互動語意是否由父元件管理。 |

---

## 7. 四篇筆記各自負責什麼

### 7.1 `01-source-map.md`：先建立原始碼地圖

這篇的價值是幫你避免只盯著 `icon.vue`。在元件庫中，public component 的完整行為通常不是單一檔案決定的，而是 runtime、type、style、example、registry 與 install 共同組成。

閱讀這篇時，應該特別關注每個檔案回答的問題。例如：

- `icon.vue` 回答「如何渲染」。
- `types/icon.d.ts` 回答「對外 API 是什麼」。
- `src/styles/common/iconfont/` 回答「class 如何變成圖標」。
- `src/components/index.js` 和 `src/index.js` 回答「它如何進入對外使用面」。

### 7.2 `02-props-and-render.md`：理解 runtime 映射

這篇是理解 `Icon` component 本身的核心。你要從這裡掌握四個 props 的責任：

| Prop | 類型 | 責任 |
| --- | --- | --- |
| `type` | class prop | 接內建 `ivu-icon-*` 圖標系統。 |
| `custom` | class prop | 接外部自訂 icon font class。 |
| `size` | style prop | 轉成 inline `font-size`。 |
| `color` | style prop | 轉成 inline `color`。 |

這篇的閱讀重點不是 `Icon` 有多複雜，而是它如何把 API 設計得足夠小、足夠穩定，讓其他元件可以重複依賴。

### 7.3 `03-icon-font-system.md`：理解圖標字形來源

這篇補上 `icon.vue` 看不到的部分。`Icon` component 只產生 class，但圖標能不能顯示，要看 icon font 樣式系統是否提供：

- `@font-face`
- `.ivu-icon` 基礎樣式
- `.ivu-icon-${type}:before`
- 對應的 `content`
- 正確載入的字體檔

閱讀這篇時，要特別建立一個觀念：`Icon` 不是圖標資料庫，它只是把 public props 接到 icon font class 系統。

### 7.4 `04-usage-in-other-components.md`：理解組合與責任邊界

這篇用來觀察 `Icon` 如何被其他元件重複使用。在更高階元件中，`Icon` 通常不是主角，而是視覺組成的一部分。

例如 `Button` 可能根據 `icon`、`customIcon`、`loading` 決定要顯示什麼圖標；`Avatar` 可能把 `Icon` 當成 fallback 內容；`Tabs`、`Select`、`Tree` 等元件可能用 `Icon` 顯示箭頭、關閉或狀態圖標。

這裡最重要的是責任邊界：

```txt
父元件
  -> 決定語意、狀態、互動與使用情境

Icon
  -> 負責把圖標名稱或自訂 class 顯示成視覺圖標
```

---

## 8. 閱讀時要抓住的三個核心問題

### 8.1 Public API 有多小？

`Icon` 對外主要就是 `type`、`size`、`color`、`custom` 四個 props。這代表它不追求在 component 內部處理大量行為，而是提供一個穩定、可組合的視覺介面。

對元件庫閱讀來說，public API 是第一個要確認的東西。因為 public API 代表使用者與其他元件可以依賴的契約。runtime source 可以改寫，內部變數可以調整，但 public API 一旦被大量使用，就會影響整個元件庫的相容性。

### 8.2 Runtime 如何把 props 轉成輸出？

`Icon` 的 runtime 幾乎都集中在 class 與 style 計算：

```txt
type/custom -> classes
size/color  -> styles
classes/styles -> <i>
```

這種元件在閱讀時不應尋找複雜演算法，而要確認映射是否清楚、命名是否穩定、邊界情況是否容易理解。

例如 `type="ios-add"` 不是直接輸出文字，而是組成 `ivu-icon-ios-add`；`size="24"` 不是保留原字串，而是轉成 `font-size: 24px`。這些小規則會直接影響使用方式與排錯方式。

### 8.3 圖標字形到底在哪裡？

這是閱讀 `Icon` 最容易誤解的地方。圖標字形不在 `icon.vue` 中，而是在 `src/styles/common/iconfont/` 中。

可以用這條鏈路理解：

```txt
<Icon type="ios-add" />
  -> <i class="ivu-icon ivu-icon-ios-add"></i>
  -> .ivu-icon-ios-add:before { content: ... }
  -> .ivu-icon 指定 Ionicons font-family
  -> 瀏覽器顯示對應 glyph
```

如果圖標沒有顯示，不能只檢查 Vue component，也要檢查 CSS 是否載入、class 是否存在、字體檔是否可取得、以及 `type` 是否真的有對應的 `.ivu-icon-${type}:before`。

---

## 9. 常見誤區

| 誤區 | 為什麼容易發生 | 正確理解 |
| --- | --- | --- |
| 以為 `Icon` 裡面保存所有圖標 | 範例頁展示大量圖標名稱，容易誤以為 component 內有圖標資料 | `Icon` 只產生 class，圖標字形在 icon font 樣式與字體檔中。 |
| 只看 `icon.vue` 就以為讀完 `Icon` | runtime 很短，容易低估樣式系統的重要性 | 還要看 type declaration、icon font、example、registry 與 install。 |
| 把 `type` 和 `custom` 當成同一個功能 | 兩者都會影響 class | `type` 接內建 `ivu-icon-*`；`custom` 接使用者自訂 class。 |
| 以為 `size` 可以任意傳 CSS 單位 | `size` 型別接受 `number | string` | runtime 會補 `px`，較適合傳數字或數字字串。 |
| 以為 `Icon` 負責點擊行為 | `Icon` 可以被掛上 click listener | 互動語意通常由父元件決定，`Icon` 只提供視覺節點。 |
| 看到父元件額外 class 就以為是在換圖標 | class 同時可能控制定位、顏色、旋轉、狀態 | 換圖標主要看 `type/custom`，父元件 class 多半控制外觀位置或狀態。 |
| 以為 `custom` 會自動支援所有第三方圖標 | `custom` 看起來像萬用入口 | `custom` 只追加 class，外部 CSS 與 font files 仍需要專案自行提供。 |

---

## 10. 如何把這份目錄用於長期複習

### 10.1 第一次學習

第一次學習時，建議以理解為主，不要背圖標名稱。你應該能用自己的話說出：

- `Icon` 為什麼輸出 `<i>`。
- `type` 為什麼會變成 `ivu-icon-${type}`。
- `custom` 為什麼需要外部 CSS。
- `size` 與 `color` 為什麼能控制 icon font。
- 為什麼 icon font 樣式系統是完整理解 `Icon` 的必要部分。

### 10.2 第二次複習

第二次複習時，可以開始練習從使用方式反推 source：

```vue
<Icon type="ios-search" size="20" color="#333" />
```

你應該能反推：

1. `type` 會組出什麼 class。
2. `size` 會產生什麼 inline style。
3. `color` 會產生什麼 inline style。
4. 對應的 icon font 樣式要去哪個目錄找。
5. 如果沒有顯示圖標，應該從哪裡開始排查。

### 10.3 閱讀其他元件時回查

之後閱讀 `Button`、`Avatar`、`Tabs`、`Select`、`Tree` 等元件時，只要看到 `Icon`，可以快速問自己：

1. 這個 icon 是固定寫死，還是由父元件 props / config 決定？
2. 父元件傳的是 `type` 還是 `custom`？
3. 父元件是否控制 `size`？
4. 父元件額外 class 是控制圖標字形，還是控制定位、旋轉、顏色與 transition？
5. 點擊或鍵盤行為是否仍由父元件處理？

這樣就能避免把父元件的語意誤判成 `Icon` 的責任。

---

## 11. 資訊邊界與後續確認

這份目錄以 View UI Plus `v1.3.20` 的本地原始碼為閱讀基準。若後續閱讀的是不同版本，需要重新確認以下事項：

1. `Icon` 是否仍然輸出 `<i>`。
2. `type`、`size`、`color`、`custom` 是否仍然是主要 public props。
3. `size` 是否仍然被轉成 px。
4. icon font 是否仍然使用 Ionicons。
5. class prefix 是否仍然是 `ivu-icon` / `ivu-icon-*`。
6. 樣式入口與 icon font 檔案路徑是否改變。
7. registry 與 install 的元件註冊方式是否改變。

如果以上任何一點改變，README 與後續幾篇筆記都應該同步更新，避免用舊版本的閱讀結論解釋新版本的原始碼。

---

## 12. 本章總結

`Icon` 是 View UI Plus 中很小但很適合訓練原始碼閱讀能力的基礎元件。它本身沒有複雜狀態、沒有 methods、沒有 emits，也沒有 slot；它的價值在於把 `type`、`custom`、`size`、`color` 穩定映射到一個 `<i>` 節點的 class 與 inline style 上。

理解 `Icon` 不能只看 `icon.vue`。完整閱讀需要同時對照 runtime source、type declaration、icon font style、examples、public registry、plugin install，以及其他元件中的組合使用情境。這些來源共同回答了 `Icon` 的完整問題：它對外承諾什麼 API、內部如何輸出 DOM、class 如何變成圖標字形、以及它如何成為其他元件的共用視覺原子。

從這份 README 開始閱讀，可以先建立整體地圖，再進入四篇細節筆記。讀完後，你不只是知道怎麼使用 `<Icon />`，也應該能掌握一種可複用的元件庫閱讀方法。

---

## 13. 自我檢查問題

1. 為什麼 `Icon` 適合作為閱讀 View UI Plus 基礎元件的第一個案例？
2. `Icon` 的 public props 主要有哪些？它們可以分成哪兩類？
3. 為什麼說 `Icon` 的核心不是 template，而是 props 到 class / style 的映射？
4. `type="ios-add"` 最後會產生哪個內建 icon class？
5. `custom="i-icon i-icon-search"` 和 `type="ios-search"` 的責任有什麼不同？
6. 為什麼 `Icon` 的圖標字形不在 `icon.vue` 裡？
7. 如果 `<Icon type="ios-add" />` 沒有顯示圖標，你會依序檢查哪些來源？
8. 為什麼 `Icon` 可以沒有 slot，仍然能顯示圖標？
9. `Icon` 被放在 `Button` 裡時，為什麼 click 語意通常仍由 `Button` 負責？
10. 如果未來 View UI Plus 改用 SVG icon，這份筆記中哪些結論需要重新確認？

---

## 14. 後續延伸方向

讀完 `Icon` 之後，可以延伸到以下幾個方向：

1. **閱讀 `Button`**：觀察 `Button` 如何組合 `Icon`、loading 狀態、disabled 狀態、click 行為與不同 button type。
2. **閱讀 `Avatar`**：理解圖片、icon、文字與 slot 之間的 fallback 順序。
3. **閱讀 `Select` 或 `Cascader`**：觀察下拉箭頭、清除圖標、狀態 class 與互動邏輯如何分工。
4. **閱讀 `Tree`**：理解展開箭頭、節點狀態、父子資料結構與 icon 顯示如何配合。
5. **整理 icon font 與 SVG icon 的差異**：比較 icon font 模型和 SVG component 模型在 tree-shaking、可存取性、樣式控制與效能上的差異。
6. **建立元件庫閱讀模板**：把這次 `Icon` 的閱讀方式抽象成通用流程：source map、props contract、runtime output、style system、examples、cross-component usage。
