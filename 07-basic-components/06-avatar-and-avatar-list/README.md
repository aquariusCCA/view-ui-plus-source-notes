# Avatar / AvatarList 原始碼閱讀筆記

本目錄聚焦 View UI Plus 的 `Avatar` 與 `AvatarList`。這一組元件適合放在 `Badge` 之後閱讀，因為它從單一展示元件進一步延伸到內容 fallback、尺寸測量、列表聚合與子元件包裹。

閱讀 `Avatar` 時不要只把它理解成「一個圓形圖片」。它真正的轉換鏈是：

```txt
props / default slot
  -> src / icon / text branch
  -> class / inline size style
  -> image error emit
  -> text width measurement and scale
```

閱讀 `AvatarList` 時也不要只把它理解成「多個 Avatar 排在一起」。它真正值得觀察的是：

```txt
list / max / tooltip / slots
  -> currentList slice
  -> Avatar + optional Tooltip
  -> extra / excess avatar
  -> avatar-list.less overlap layout
```

這組元件的 runtime 不長，但有幾個容易誤判的地方：`Avatar` 圖片載入失敗不會自動 fallback，只會 emit `on-error`；`Avatar` runtime 支援數字尺寸，但 `.d.ts` 沒有完整描述；`AvatarList` 的 `.d.ts` 和實際 props 明顯不一致。

## 1. Source Baseline

本目錄以本地保存的 View UI Plus `v1.3.20` 原始碼為閱讀基準。

| 類型 | 路徑 | 閱讀目的 |
| --- | --- | --- |
| Runtime | `01-origin/source/view-ui-plus-v1.3.20/src/components/avatar/avatar.vue` | 確認 props、內容 branch、computed class/style、圖片錯誤事件與文字縮放。 |
| Runtime entry | `01-origin/source/view-ui-plus-v1.3.20/src/components/avatar/index.js` | 確認單元件入口匯出。 |
| Runtime | `01-origin/source/view-ui-plus-v1.3.20/src/components/avatar-list/avatar-list.vue` | 確認列表切片、Tooltip 包裹、extra / excess slot 與子 `Avatar` 傳值。 |
| Runtime entry | `01-origin/source/view-ui-plus-v1.3.20/src/components/avatar-list/index.js` | 確認單元件入口匯出。 |
| Style | `01-origin/source/view-ui-plus-v1.3.20/src/styles/components/avatar.less` | 對照尺寸、形狀、圖片、文字與 icon 樣式。 |
| Style | `01-origin/source/view-ui-plus-v1.3.20/src/styles/components/avatar-list.less` | 對照列表重疊、邊框與 excess 樣式。 |
| Style entry | `01-origin/source/view-ui-plus-v1.3.20/src/styles/components/index.less` | 確認 `avatar.less` 與 `avatar-list.less` 進入元件樣式集合。 |
| Type declaration | `01-origin/source/view-ui-plus-v1.3.20/types/avatar.d.ts` | 確認 `Avatar` public API，並對照 runtime 支援的數字尺寸。 |
| Type declaration | `01-origin/source/view-ui-plus-v1.3.20/types/avatar-list.d.ts` | 確認 `AvatarList` `.d.ts` 與 runtime props 的落差。 |
| Type export entry | `01-origin/source/view-ui-plus-v1.3.20/types/viewuiplus.components.d.ts` | 確認 `Avatar` / `AvatarList` 進入 typed public exports。 |
| Example | `01-origin/source/view-ui-plus-v1.3.20/examples/routers/avatar.vue` | 確認單一頭像的官方使用方式、錯誤處理與數字尺寸。 |
| Example | `01-origin/source/view-ui-plus-v1.3.20/examples/routers/avatar-list.vue` | 確認頭像列表、`max` 與 `excessStyle` 的官方使用方式。 |
| Registry | `01-origin/source/view-ui-plus-v1.3.20/src/components/index.js` | 確認 `Avatar` / `AvatarList` 進入 component public export。 |
| Install | `01-origin/source/view-ui-plus-v1.3.20/src/index.js` | 確認全域安裝時透過 component map 間接註冊。 |

## 2. Reading Focus

閱讀這組元件時，建議把問題拆成四類。

第一，內容優先序。`Avatar` 的 template 不是 fallback chain 自動降級，而是固定分支：有 `src` 就渲染圖片，有 `icon/customIcon` 才渲染 `Icon`，否則才渲染 default slot。

第二，錯誤邊界。圖片載入錯誤時，`Avatar` 只 emit `on-error`，不會把 `src` 清掉，也不會自動改成 icon 或文字。官方 example 的 fallback 是外部在 `handleError` 中更換 `src`。

第三，尺寸與文字縮放。預設尺寸走 `avatar.less` 的 class 與 mixin；非預設尺寸走 inline style。slot 文字則透過 DOM measurement 計算 `scale`，讓長文字縮進頭像內。

第四，列表聚合。`AvatarList` 不是單純 slot 容器，而是根據 `list`、`max` 產生多個子 `Avatar`，可選擇用 `Tooltip` 包裹，並用 `extra` / `excess` slot 處理額外頭像。

## 3. Notes Index

建議依照下列順序閱讀。

| 筆記 | 主題 | 建議閱讀目的 |
| --- | --- | --- |
| `01-source-map.md` | 原始碼入口與責任分工 | 先知道 runtime、style、type、example、registry、consumer 分別在哪裡。 |
| `02-avatar-public-contract-and-content-priority.md` | `Avatar` public contract 與內容優先序 | 對照 props、template branch、`on-error` 與 type declaration。 |
| `03-avatar-size-style-and-text-scaling.md` | `Avatar` 尺寸、樣式與文字縮放 | 理解 class / inline style / less / DOM measurement 的分工。 |
| `04-avatar-list-aggregation-tooltip-and-excess.md` | `AvatarList` 列表聚合、Tooltip 與 excess | 理解 `currentList`、`Tooltip`、`extra` / `excess` slot 與型別落差。 |

## 4. Learning Outcome

讀完本目錄後，應該能建立以下理解。

1. `Avatar` 是展示元件，但它有明確的內容來源優先序：`src` 高於 `icon/customIcon`，再高於 default slot。
2. `Avatar` 圖片載入失敗只 emit `on-error`，真正的 fallback 需要外部更新 props。
3. `Avatar` 的 `size` runtime 支援預設尺寸與自訂數字尺寸，但 type declaration 只描述預設字串尺寸。
4. `Avatar` 的文字縮放依賴 mounted / updated 後的 DOM measurement，不是純 CSS 行為。
5. `AvatarList` 會主動建立子 `Avatar`，因此 list item 的 runtime contract 主要是 `src` 與可選的 `tip`。
6. `Tooltip` 是 `AvatarList` 的可選包裹層，只在 `tooltip && item.tip` 時出現。
7. `extra` slot 優先於 `excess` slot；一旦提供 `extra`，不論是否超出 `max` 都會顯示額外頭像。
8. `types/avatar-list.d.ts` 沒有完整反映 runtime props，閱讀時必須回到 `.vue` source 確認實際契約。

## 5. Self Check

1. `Avatar` 同時提供 `src`、`icon` 與 default slot 時，實際會渲染哪一種內容？
2. `Avatar` 圖片載入失敗時，元件內部會不會自動改成 icon 或文字？
3. `size="64"` 和 `size="large"` 分別走哪一條樣式路徑？
4. slot 文字過長時，`setScale()` 如何計算 `scale`？
5. `AvatarList` 的 `currentList` 如何根據 `max` 產生？
6. `tooltip=false` 或 item 沒有 `tip` 時，列表項會如何渲染？
7. `#extra` 和 `#excess` 的優先序有什麼差異？
8. `types/avatar-list.d.ts` 和 runtime props 有哪些不一致？
