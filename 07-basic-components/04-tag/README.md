# Tag 原始碼閱讀筆記

本目錄聚焦 View UI Plus 的 `Tag`。它表面上是很小的標籤元件，但實作上同時承載展示、關閉、選取、自定義顏色、尺寸與事件輸出，因此很適合放在 `Divider` 之後、`Badge` 之前閱讀。

閱讀 `Tag` 時不要只把它當成「一個帶顏色的 span」。它真正值得觀察的是這條轉換鏈：

```txt
props / default slot
  -> root / dot / text / close icon structure
  -> class / inline style color path
  -> internal isChecked state
  -> on-change / on-close event boundary
```

`Tag` 沒有複雜 mixin，也沒有表單依賴；它的重點是小型互動元件如何在 runtime、style、type declaration 與外部控制之間取得分工。

## 1. Source Baseline

本目錄以本地保存的 View UI Plus `v1.3.20` 原始碼為閱讀基準。

| 類型 | 路徑 | 閱讀目的 |
| --- | --- | --- |
| Runtime | `01-origin/source/view-ui-plus-v1.3.20/src/components/tag/tag.vue` | 確認 props、template、computed class/style、內部 checked 狀態與事件。 |
| Runtime entry | `01-origin/source/view-ui-plus-v1.3.20/src/components/tag/index.js` | 確認單元件入口匯出。 |
| Style | `01-origin/source/view-ui-plus-v1.3.20/src/styles/components/tag.less` | 對照尺寸、選中、未選中、關閉、border、dot、內建色樣式。 |
| Type declaration | `01-origin/source/view-ui-plus-v1.3.20/types/tag.d.ts` | 確認 public props 與事件 listener contract。 |
| Type export entry | `01-origin/source/view-ui-plus-v1.3.20/types/viewuiplus.components.d.ts` | 確認 `Tag` 進入 typed public exports。 |
| Example | `01-origin/source/view-ui-plus-v1.3.20/examples/routers/tag.vue` | 確認官方展示的普通、可選取、可關閉、自定義顏色、尺寸場景。 |
| Registry | `01-origin/source/view-ui-plus-v1.3.20/src/components/index.js` | 確認 `Tag` 進入 components public export。 |
| Install | `01-origin/source/view-ui-plus-v1.3.20/src/index.js` | 確認全域安裝時的註冊流程。 |
| Consumer | `01-origin/source/view-ui-plus-v1.3.20/src/components/tag-select/tag-select-option.vue` | 觀察 `Tag` 如何被包成可選項。 |

## 2. Reading Focus

閱讀這組元件時，建議把問題拆成五類。

第一，public contract。`Tag` 的 props 很少，但 `color`、`type`、`checked`、`name` 都會影響後續資料流或樣式分支。特別是 `color` 在 runtime 支援自定義字串，但 `.d.ts` 沒有完整表達這件事。

第二，render structure。`Tag` 固定輸出根 `div`，內容由 dot span、text span、close `Icon` 組成。`type="dot"` 會額外渲染圓點，`closable` 會額外渲染 close icon。

第三，class 與 inline style。內建色走 `ivu-tag-*` class，再由 `tag.less` 定義視覺；自定義色不會產生內建色 class，而是透過 `wraperStyles`、`textColorStyle`、`bgColorStyle` 寫 inline style。

第四，選取狀態。`checked` 不是 `v-model`，runtime 會把它初始化成內部 `isChecked`，點擊時先改內部狀態，再透過 watcher 接收外部 prop 更新。

第五，事件邊界。`on-change` 只負責告知選取狀態變化，`on-close` 只負責告知關閉意圖。真正移除標籤或同步選取結果，都要由外部完成。

## 3. Notes Index

建議依照下列順序閱讀。

| 筆記 | 主題 | 建議閱讀目的 |
| --- | --- | --- |
| `01-source-map.md` | 原始碼入口地圖 | 先知道 runtime、style、type、example、registry、consumer 分別在哪裡。 |
| `02-public-props-and-type-contract.md` | public props 與 type contract | 對照 runtime props、`.d.ts` 與事件 payload。 |
| `03-render-class-and-color-system.md` | render、class 與顏色系統 | 理解 DOM 結構、內建色 class、自定義色 inline style 與 less 分工。 |
| `04-state-events-and-control-boundary.md` | 狀態、事件與控制邊界 | 理解 `isChecked`、`checked` watcher、`on-change`、`on-close` 與外部控制責任。 |

## 4. Learning Outcome

讀完本目錄後，應該能建立以下理解。

1. `Tag` 是小型互動狀態元件，不只是靜態視覺標籤。
2. `closable` 只顯示 close icon 並 emit `on-close`，不會自動刪除自己。
3. `checkable` 讓根節點 click 可以切換內部 `isChecked`，並 emit `on-change`。
4. `checked` 透過 watcher 同步到 `isChecked`，但 `Tag` 沒有 `modelValue` 或 `update:modelValue`。
5. 內建色與自定義色走不同樣式路徑，不能只看 `tag.less` 或只看 computed style。
6. `name` 主要用來讓列表場景的 `on-change` / `on-close` 帶回識別值。
7. 想完整理解 `Tag`，必須同時看 runtime、style、type declaration、example 與至少一個 consumer。

## 5. Self Check

1. `Tag` 的根節點固定輸出什麼元素？哪些 props 會改變內部子節點？
2. `type="dot"` 和 `type="border"` 分別改變哪些 class、DOM 或 style？
3. 為什麼自定義 `color="#EF6AFF"` 不能只靠 `ivu-tag-*` class 理解？
4. `closable` 為什麼不代表元件會自行消失？
5. `checkable` 與 `checked` 分別負責什麼？
6. `on-change` 和 `on-close` 在有 `name` 與沒有 `name` 時 payload 有什麼差異？
