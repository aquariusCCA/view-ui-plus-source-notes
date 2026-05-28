# Utils 作為公開設計啟發

## 學習目標

這篇從 `src/utils/` 觀察工具函數如何支撐元件庫設計。這些函數大多不是直接給使用者呼叫的公開 API，但它們示範了一套元件庫如何把重複邏輯、瀏覽器差異、資料格式與副作用封裝成穩定能力。

讀完後，要能從低層 utility 反推服務設計時應該保留哪些邊界。

## 對照源碼

- `01-origin/source/view-ui-plus-v1.3.20/src/utils/index.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/utils/assist.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/utils/dom.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/utils/date.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/utils/csv.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/utils/keyCode.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/utils/random_str.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/utils/styleCheck.js`

## 工具函數分類

| 類型 | 代表 | 作用 |
| --- | --- | --- |
| 基礎判斷 | `oneOf`、`typeOf`、`firstUpperCase` | 支撐 props validator、錯誤訊息與資料處理 |
| 深拷貝與格式轉換 | `deepCopy`、`camelcaseToHyphen` | 避免元件內重複寫資料轉換 |
| DOM 能力 | `getScrollBarSize`、`getStyle`、`scrollTop`、`hasClass` | 封裝瀏覽器 API 與兼容處理 |
| 事件封裝 | `on`、`off` | 統一 add/remove event listener |
| 日期與 CSV | `date`、`csv` | 將複雜格式化邏輯集中管理 |
| 環境保護 | `isClient` | 避免 SSR 或測試環境沒有 window/document 時崩潰 |

這些工具的共同點是：它們不關心某個元件長什麼樣子，只提供可重複使用的判斷或副作用能力。

## assist.js 的設計重點

`assist.js` 是混合型工具集合，包含：

- props validator 常用的 `oneOf`。
- DOM 測量用的 `getScrollBarSize`。
- class 操作用的 `hasClass`、`addClass`、`removeClass`。
- 元件樹查找用的 `findComponentUpward`、`findComponentsDownward`。
- 動畫滾動用的 `scrollTop`。
- 檔案下載用的 `downloadFile`。

閱讀時要注意一件事：這些函數的抽象層級不完全一致。因此在自己的元件庫中，不一定要照單全收放在同一個檔案。更好的做法是依用途拆成 `dom`、`tree`、`format`、`download` 等更明確的模組。

## dom.js 的價值

`dom.js` 封裝 `on` 和 `off`：

```txt
on(element, event, handler, useCapture)
off(element, event, handler, useCapture)
```

它的價值不是少寫幾個字，而是讓所有元件用同一套事件註冊策略。BackTop、Affix 這類元件只要遵守 mounted 註冊、beforeUnmount 移除，就能降低 listener 洩漏風險。

## isClient 的邊界

`utils/index.js` 只輸出：

```txt
export const isClient = typeof window !== 'undefined'
```

這個小工具在全域服務中特別重要。LoadingBar、Spin、Copy、ScrollIntoView 都會碰 DOM。如果沒有 `isClient`，SSR、預渲染或某些測試環境會直接報錯。

設計工具服務時，凡是用到 `window`、`document`、`getComputedStyle`、`getBoundingClientRect`、`fetch`、`URL.createObjectURL`，都要先考慮環境保護。

## date 與 csv

`date.js` 和 `csv.js` 提醒我們：工具函數不一定都很小。

- `date.js` 包含日期 parse、format、token、i18n 設定。
- `csv.js` 把 columns、datas、separator、quoted、noHeader 轉成 CSV 文字。

這類工具適合獨立成純函數，因為它們不需要 Vue instance。若要做成全域服務，應該是額外包一層更具產品語意的 API，例如 `$DownloadCsv(columns, data, options)`，而不是讓 UI 元件直接處理所有字串拼接細節。

## 從 utils 到服務

工具函數升級成服務時，通常多了幾件事：

| 層級 | 負責 |
| --- | --- |
| utils | 純邏輯、DOM 操作、格式化、相容性 |
| service | 預設配置、狀態管理、callback、錯誤處理、全域掛載 |
| component | 視覺呈現、slot、事件、props、樣式 |

例如複製能力：

```txt
DOM selection / execCommand
  -> $Copy options + $Message feedback
  -> Typography copyable 圖示與 tooltip
```

每一層都只承擔自己該做的事，才不會讓元件或服務變得過重。

## 複習題

1. `isClient` 為什麼對全域服務比對純資料工具更重要？
2. `on/off` 封裝解決的是什麼工程問題？
3. 為什麼 `csv` 適合是純函數，而不是直接綁定某個 Table 元件？
4. 如果要把 `downloadFile` 做成 `$Download`，需要補哪些服務層能力？
5. `assist.js` 把很多不同用途放在一起，重構時可以怎麼拆？
