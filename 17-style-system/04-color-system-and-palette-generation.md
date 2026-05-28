# 色彩系統與色盤生成

## 學習目標

這篇分析 `src/styles/color/`。View UI Plus 不只定義幾個固定顏色，還用色盤生成函式從基準色推導出 1 到 10 階色彩，讓 hover、active、背景與邊框有一致的明暗變化。

讀完後，要能理解主色、狀態色、色盤與 Less 色彩函式如何一起支撐元件樣式。

## 對照源碼

- `01-origin/source/view-ui-plus-v1.3.20/src/styles/color/colors.less`
- `01-origin/source/view-ui-plus-v1.3.20/src/styles/color/colorPalette.less`
- `01-origin/source/view-ui-plus-v1.3.20/src/styles/color/tinyColor.less`
- `01-origin/source/view-ui-plus-v1.3.20/src/styles/color/bezierEasing.less`
- `01-origin/source/view-ui-plus-v1.3.20/src/styles/custom.less`
- `01-origin/source/view-ui-plus-v1.3.20/build/build-style.js`

## 色彩分層

View UI Plus 的色彩可以分成三層。

第一層是色盤基準色，例如：

- `@blue-6`
- `@green-6`
- `@red-6`
- `@orange-6`
- `@purple-6`

第二層是語意色，例如：

- `@primary-color`
- `@info-color`
- `@success-color`
- `@warning-color`
- `@error-color`

第三層是元件使用色，例如：

- `@btn-primary-bg`
- `@input-hover-border-color`
- `@table-td-hover-bg`
- `@tooltip-bg`
- `@menu-dark-active-bg`

這種分層讓色彩既能有系統性，也能針對元件做微調。

## 1 到 10 階色盤

`colors.less` 會針對每個色相定義 1 到 10 階，例如 blue：

- `@blue-1` 到 `@blue-5` 是偏淺色。
- `@blue-6` 是基準色。
- `@blue-7` 到 `@blue-10` 是偏深色。

除了基準色，其他階層透過 `colorPalette()` 生成。這表示元件在需要淺色背景、深色 active、hover 顏色時，可以使用一致規則，而不是手動挑色。

## colorPalette 的作用

`colorPalette.less` 透過 tinycolor 與 HSV 操作調整 hue、saturation、value。它的目標是：給一個基準色，產出一組視覺上合理的淺色與深色。

這裡有兩個重點：

- 它依賴 Less 的 JavaScript 執行能力。
- `build-style.js` 編譯 Less 時需要設定 `javascriptEnabled: true`。

如果關閉 Less JavaScript，色盤函式會無法正常執行。這是 View UI Plus 樣式建置的一個隱含依賴。

## 元件中的色彩使用

Button 是最清楚的例子：

- default button hover 會使用主色的淺色變化。
- primary button 背景使用 `@primary-color`。
- success、warning、error、info 透過 `.btn-color(@color)` 套入語意色。
- focus 使用 `fade(@color, 20%)` 做外框陰影。

Input 則把主色用在 hover 和 focus：

- hover border 使用 `tint(@input-hover-border-color, 20%)`。
- focus box-shadow 使用 `fade(@color, 20%)`。
- error 狀態使用 `@error-color`。

Table 則用較淡的背景色表達 hover、stripe、highlight：

- `@table-td-hover-bg`
- `@table-td-stripe-bg`
- `@table-td-highlight-bg`

## tint、shade、fade 的語意

Less 內建或擴充的色彩操作常見於元件狀態：

| 函式 | 用途 |
| --- | --- |
| `tint(color, amount)` | 讓顏色變淺，常用於 hover |
| `shade(color, amount)` | 讓顏色變深，常用於 active |
| `fade(color, amount)` | 調整透明度，常用於 focus ring、disabled、陰影 |

這些函式讓互動狀態可以從同一個基準色推導，而不是為每種狀態重新命名一個變數。

## 與 Ant Design 色盤思路的關係

`color/` 目錄的結構與色盤生成思路接近 Ant Design 生態常見做法：用一個基準色推導出完整色階，再用語意 token 對接元件狀態。

閱讀時重點不是記住演算法細節，而是理解它解決的工程問題：保持大量元件在 hover、active、背景、邊框、提示色上的視覺一致性。

## 設計啟發

色彩系統不要只列出品牌色。元件庫至少需要回答：

- 主色如何生成 hover / active？
- success / warning / error 是否有一致的狀態變化？
- 淺色背景是否來自同一套色盤？
- disabled、border、split、text secondary 是否有固定語意？
- 暗色模式時哪些語意需要反轉，哪些只是調整亮度？

一旦色彩被語意化，元件樣式就能用 `@error-color` 這種名稱表達意圖，而不是把 `#ed4014` 散落在各處。

## 複習題

1. `@blue-6` 在色盤中扮演什麼角色？
2. `colorPalette()` 為什麼需要 Less JavaScript 支援？
3. `tint()`、`shade()`、`fade()` 常分別用在哪些互動狀態？
4. 語意色和基礎色盤有什麼差異？
5. 為什麼元件庫需要系統性生成 hover 和 active 色，而不是手動指定？
