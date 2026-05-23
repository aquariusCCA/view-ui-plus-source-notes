# Icon 原始碼閱讀筆記

本目錄聚焦 View UI Plus 的 `Icon` 圖標元件。它是基礎元件中狀態最少、最適合用來建立原始碼閱讀方法的元件之一：先看 public props，再看 props 如何轉成 class / inline style，最後回到樣式系統確認圖標字體如何被渲染。

`Icon` 本身不宣告 emits、methods，也沒有 slot。它的核心價值在於把使用者提供的圖標名稱、自訂 class、尺寸與顏色，穩定映射到一個 `<i>` 節點上。由於 Vue 3 會把非 prop attributes / listeners fallthrough 到單根節點，父元件仍可在需要時把 `@click` 掛到這個 `<i>`，但互動語意通常仍由父元件負責。這個小元件會被 `Button`、`Avatar`、`Tabs`、`Select`、`Tree` 等大量元件重複使用，所以它很適合作為理解 View UI Plus 基礎視覺原子的入口。

## 1. Source Baseline

本目錄以本地保存的 View UI Plus `v1.3.20` 原始碼為閱讀基準。

| 類型 | 路徑 | 閱讀目的 |
| --- | --- | --- |
| Runtime | `01-origin/source/view-ui-plus-v1.3.20/src/components/icon/icon.vue` | 確認 props、computed class、inline style 與最終 DOM。 |
| Type | `01-origin/source/view-ui-plus-v1.3.20/types/icon.d.ts` | 對照 `Icon` 對外公開的 TypeScript contract。 |
| Example | `01-origin/source/view-ui-plus-v1.3.20/examples/routers/icon.vue` | 確認官方範例主要展示哪些內建圖標名稱。 |
| Style | `01-origin/source/view-ui-plus-v1.3.20/src/styles/common/iconfont/` | 確認 Ionicons 字體、`.ivu-icon` 基礎樣式與 `ivu-icon-*` 對應表。 |
| Registry | `01-origin/source/view-ui-plus-v1.3.20/src/components/index.js` | 確認 `Icon` 是否進入 public export。 |
| Install | `01-origin/source/view-ui-plus-v1.3.20/src/index.js` | 確認全域安裝時如何註冊 `Icon`。 |

## 2. Reading Focus

閱讀 `Icon` 時不要把重點放在「有哪些圖標」而已。圖標清單可以查文件或範例，但原始碼筆記更應該回答三個問題。

第一，`Icon` 的 public API 有多小。它只提供 `type`、`size`、`color`、`custom` 四個 props，沒有內部狀態機，也沒有事件流程。

第二，`Icon` 的 runtime 只負責建立 class / style 映射。`type` 會變成 `ivu-icon-${type}`，`custom` 會把外部自訂 class 加到同一個 `<i>` 節點，`size` 和 `color` 則變成 inline style。

第三，真正的圖標形狀不在 Vue component 裡，而是在 icon font 樣式裡。`Icon` 只把 class 掛上去，`src/styles/common/iconfont/` 才定義 `.ivu-icon` 的字體、平滑、垂直對齊，以及每個 `ivu-icon-*` 的 `:before content`。

## 3. Notes Index

建議依照下列順序閱讀。

| 筆記 | 主題 | 建議閱讀目的 |
| --- | --- | --- |
| `01-source-map.md` | 原始碼入口地圖 | 先知道 `Icon` 的 runtime、type、style、example、registry 分別在哪裡。 |
| `02-props-and-render.md` | props 到 render output | 理解 `type / custom / size / color` 如何轉成 class 與 style。 |
| `03-icon-font-system.md` | icon font 系統 | 理解 `.ivu-icon`、Ionicons 字體與 `:before content` 的關係。 |
| `04-usage-in-other-components.md` | 跨元件使用 | 觀察 `Icon` 如何成為其他元件的共用視覺原子。 |

## 4. Learning Outcome

讀完本目錄後，應該能建立以下理解。

1. `Icon` 是低狀態元件，不主動管理互動語意。
2. `Icon` 的 component source 只處理 DOM、class 與 inline style，不定義圖標字形本身。
3. `type` 對應 View UI Plus 內建的 `ivu-icon-*` class；`custom` 對應使用者自己提供的 icon font class。
4. `size` 在 runtime 中會被轉成 `${size}px`，因此它實際上適合傳入數字或數字字串。
5. 想理解 `Icon` 的完整行為，必須同時看 runtime、type declaration、style source、example 與其他元件中的使用情境。

## 5. Self Check

1. 為什麼 `Icon` 的核心不是 template，而是 computed class / style？
2. `type="ios-add"` 最後會產生哪個 class？
3. `custom="i-icon i-icon-search"` 和 `type="ios-search"` 的責任有什麼不同？
4. `Icon` 的圖標形狀為什麼不在 `icon.vue` 裡？
5. 為什麼 `Icon` 很適合作為閱讀基礎元件的第一個例子？
