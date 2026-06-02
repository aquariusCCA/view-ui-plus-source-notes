# assist 工具集合

## 學習目標

這篇分析 `src/utils/assist.js`。這個檔案像是一個工具箱，集中放了 View UI Plus 早期累積的共用函數：prop 驗證、型別判斷、深拷貝、DOM class 操作、元件查找、滾動、下載與響應式斷點常數。

閱讀重點不是逐行背 API，而是理解元件庫如何把常見小邏輯抽出，並觀察一個工具檔越長後會帶來什麼維護問題。

## 對照源碼

- `01-origin/source/view-ui-plus-v1.3.20/src/utils/assist.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/button/button.vue`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/table/table.vue`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/input/input.vue`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/anchor/anchor.vue`

這幾個元件不是完整使用清單，而是代表不同類型的對照案例：`button.vue` 用來看 `oneOf` 如何支援 prop validator；`input.vue` 用來看 `oneOf` 與 `findComponentUpward` 如何同時服務輸入元件；`table.vue` 用來看複雜元件如何使用 `getStyle`、`deepCopy`、`getScrollBarSize` 處理資料與 DOM 測量；`anchor.vue` 則用來看 `scrollTop` 與 `sharpMatcherRegx` 如何支援滾動和 hash anchor 行為。

## 工具分類

| 類別 | 函數或常數 | 主要用途 |
| --- | --- | --- |
| prop 與字串 | `oneOf`、`camelcaseToHyphen`、`firstUpperCase`、`warnProp` | prop validator、命名轉換、警告訊息 |
| 型別與資料 | `typeOf`、`deepCopy` | 判斷資料型別、複製資料 |
| DOM 讀取 | `getStyle`、`getScrollBarSize`、`MutationObserver` | 讀取樣式、計算 scrollbar、監聽 DOM 變化 |
| 元件樹查找 | `findComponentUpward`、`findComponentDownward`、`findComponentsDownward`、`findComponentsUpward`、`findBrothersComponents` | 在 Options API 元件樹中找父、子、兄弟元件 |
| class 操作 | `hasClass`、`addClass`、`removeClass` | 過渡動畫與指令中的 class 控制 |
| 視窗與滾動 | `scrollTop`、`dimensionMap`、`setMatchMedia` | 平滑滾動、斷點、`matchMedia` polyfill |
| 其他 | `sharpMatcherRegx`、`downloadFile` | Anchor hash 判斷、圖片或檔案下載 |

`assist.js` 的特點是「使用範圍很廣，但主題不完全單一」。這在元件庫成長初期很常見，後期維護時通常會再拆成更明確的模組。

## `oneOf`：統一 prop validator

大量元件會這樣使用：

```js
validator (value) {
    return oneOf(value, ['default', 'primary', 'dashed', 'text']);
}
```

這種小工具的價值不是技術複雜度，而是讓所有元件的枚舉判斷寫法一致。Button、Alert、Badge、Typography、Progress 等元件都會用到。

設計重點：

- validator 只回傳布林值，不負責錯誤訊息。
- 有效值清單由元件自己決定，工具函數不耦合元件語意。
- 相同模式被大量複用時，抽出小函數可以降低閱讀成本。

## `typeOf` 與 `deepCopy`

`typeOf` 用 `Object.prototype.toString` 建立更穩定的型別名稱，避免 `typeof [] === 'object'` 這類問題。

`deepCopy` 則根據 `typeOf` 遞迴複製 array 與 object。它的使用場景包含 Cascader、DatePicker、Table 等需要保護內部狀態的元件。

限制也很明顯：

- 不處理循環引用。
- 不保留 class instance、Map、Set、Date 等複雜資料結構的語意。
- 適合元件庫內部的普通資料，不適合當成通用深拷貝方案。

## DOM 相關工具

`getStyle` 封裝了樣式名稱轉換、`float` 特例與 `getComputedStyle` 讀取。Table、Carousel、Grid、Slider 等元件會用它讀取實際尺寸或樣式。

`getScrollBarSize` 會建立臨時 DOM，計算 scrollbar 寬度並快取結果。這個值對 Modal、Table 很重要，因為浮層鎖住頁面滾動或表格固定欄時，都需要補償 scrollbar 尺寸。

`scrollTop` 封裝 requestAnimationFrame，讓 Anchor、BackTop、TimeSpinner 這類元件可以共用平滑滾動邏輯。

這些函數都需要注意瀏覽器環境判斷。View UI Plus 透過 `isClient` 避免在非瀏覽器環境直接讀取 `window` 或 `document`。

## 元件樹查找工具

`findComponentUpward`、`findComponentDownward` 這類函數依賴 `$parent`、`$children` 與元件 `name`。例如 Dropdown、Menu、InputNumber、Cascader、Tree 會透過元件名稱找上層容器。

這種做法的好處是快速、直觀，尤其適合 Options API 元件庫。缺點是：

- 依賴元件 `name`，改名會影響查找。
- 依賴元件樹結構，包一層中介元件可能改變結果。
- 在 Vue 3 現代寫法中，很多場景會改用 `provide/inject` 或 composable。

## 設計啟發

`assist.js` 讓我們看到「工具集合」的兩面。

好處是重複邏輯集中管理，元件實作更短；代價是檔案主題會逐漸變雜，純函數、DOM 函數、元件查找函數混在一起。

如果自己設計元件庫，可以先允許小型 `assist` 存在，但當工具數量變多時，應該逐步拆成：

- `utils/props`
- `utils/dom`
- `utils/component-tree`
- `utils/data`
- `utils/browser`

這樣可以讓使用者從檔名看出依賴邊界。

## 複習題

1. `oneOf` 為什麼適合放在共用工具，而不是每個元件自己寫？
2. `deepCopy` 在 View UI Plus 裡適合處理哪些資料？不適合處理哪些資料？
3. `getScrollBarSize` 為什麼需要快取？
4. 元件樹查找工具依賴了哪些隱性條件？
5. 如果要重構 `assist.js`，你會先拆出哪些子模組？
