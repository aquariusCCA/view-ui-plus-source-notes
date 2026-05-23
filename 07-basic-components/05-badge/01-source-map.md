# Badge Source Map：閱讀入口與責任分工

## 0. 原始筆記問題分析

原本 `README.md` 已經列出 `badge.vue`、`badge.less`、`types/badge.d.ts` 與 example，但還沒有把這些來源之間的責任關係說清楚。

對 `Badge` 來說，只列路徑不夠，因為它的行為雖然集中，卻分成三層：

1. `badge.vue` 決定 template branch、props、computed 顯示條件與 slot override。
2. `badge.less` 決定 count、dot、status 的定位、尺寸、色彩與動畫。
3. `types/badge.d.ts` 描述 public API，但無法直接看出 `dot`、`status`、`color`、slot 之間的優先序。

## 1. 本章定位

本章是一篇 source map 筆記。它不逐一分析每個 computed，也不深入展開所有 CSS selector，而是先建立完整閱讀地圖。

讀完後，應該能回答：

1. `Badge` 的 runtime、style、type、example、registry 分別在哪裡。
2. 哪些行為由 `badge.vue` 負責，哪些效果一定要回到 less 才能理解。
3. 為什麼 `src/index.js` 裡看不到 `Badge` 字樣，仍然代表它會被全域安裝流程註冊。
4. 初次閱讀時應該按照什麼順序打開檔案。

## 2. Source Baseline

本章以本地保存的 View UI Plus `v1.3.20` 原始碼為準。

| 類型 | 路徑 | 角色 |
| --- | --- | --- |
| Runtime | `01-origin/source/view-ui-plus-v1.3.20/src/components/badge/badge.vue` | 定義 props、三段 template branch、computed class/style、顯示條件與 slot override。 |
| Runtime entry | `01-origin/source/view-ui-plus-v1.3.20/src/components/badge/index.js` | 匯出 `badge.vue` 作為單元件入口。 |
| Component style | `01-origin/source/view-ui-plus-v1.3.20/src/styles/components/badge.less` | 定義 `ivu-badge`、count、custom count、dot、status、processing animation 與狀態色。 |
| Style entry | `01-origin/source/view-ui-plus-v1.3.20/src/styles/components/index.less` | 透過 `@import "badge";` 將 badge 樣式納入元件樣式集合。 |
| Type declaration | `01-origin/source/view-ui-plus-v1.3.20/types/badge.d.ts` | 定義 `Badge` 的 TypeScript public contract 與 `v-slots`。 |
| Type export entry | `01-origin/source/view-ui-plus-v1.3.20/types/viewuiplus.components.d.ts` | 透過 `export { Badge } from './badge'` 匯出型別。 |
| Example | `01-origin/source/view-ui-plus-v1.3.20/examples/routers/badge.vue` | 展示官方使用場景與 props / slots 組合。 |
| Component registry | `01-origin/source/view-ui-plus-v1.3.20/src/components/index.js` | 對外匯出 `Badge`。 |
| Plugin install | `01-origin/source/view-ui-plus-v1.3.20/src/index.js` | 匯入整個 `components` map，並用 `app.component(key, ViewUI[key])` 註冊，因此 `Badge` 會被間接註冊。 |

## 3. Runtime 責任分工

`badge.vue` 是主要行為入口。它負責三件事。

第一，宣告 public props：

```txt
count / dot / overflowCount / className / showZero / text
status / type / offset / color
```

第二，決定 template branch：

```vue
<span v-if="dot">...</span>
<span v-else-if="status || color">...</span>
<span v-else>...</span>
```

這表示 `dot`、`status/color`、一般 count 不是彼此疊加，而是互斥分支。只要 `dot` 為 true，就不會進入 status 分支；只要 `status` 或 `color` 有值，就不會進入一般 count 分支。

第三，把 props 與 slot 狀態轉成 computed：

| Computed | 責任 |
| --- | --- |
| `classes` | 產生根節點 `ivu-badge`。 |
| `dotClasses` | 產生 dot 模式的 `ivu-badge-dot`。 |
| `countClasses` | 產生一般數字角標 class，包含 `className`、`alone`、`type`。 |
| `customCountClasses` | 產生自訂 count slot 的透明角標 class。 |
| `statusClasses` | 產生 status dot class，包含 `status` 或內建 `color`。 |
| `statusStyles` | 非內建 `color` 時寫入自訂背景色。 |
| `styles` | 將 `offset` 轉成 `margin-top` 與 `margin-right`。 |
| `finalCount` | 決定顯示 `text`、原始 `count` 或 `${overflowCount}+`。 |
| `badge` | 決定角標本體是否顯示。 |
| `hasCount` | 決定一般模式是否渲染 count `sup`。 |
| `alone` | 判斷是否沒有 default slot，進而改變 count 定位。 |

## 4. Style 責任分工

`badge.less` 是視覺行為的主要來源。它把 runtime 產生的 class 轉成具體畫面。

| Less 區塊 | 責任 |
| --- | --- |
| `.ivu-badge` | wrapper 使用 `position: relative` 與 `display: inline-block`，讓角標可以附著在子內容上。 |
| `.ivu-badge-count` | 一般數字角標的 absolute positioning、尺寸、紅底白字、圓角、陰影。 |
| `.ivu-badge-count-custom` | 自訂 `#count` 內容時取消背景、邊框與陰影。 |
| `.ivu-badge-count-alone` | 沒有 default slot 時，讓 count 改成相對定位的獨立展示。 |
| `.ivu-badge-count-{type}` | 一般數字角標的語意色，例如 primary、success、error。 |
| `.ivu-badge-dot` | dot 模式的小紅點 absolute positioning。 |
| `.ivu-badge-status-*` | status 模式的 inline dot、文字、狀態色與 processing 動畫。 |
| `.make-color-classes()` | 產生 blue、green、red、purple 等 status color class。 |

這裡有一個閱讀重點：`Badge` 的 status 模式不是右上角角標，而是 inline 狀態點加文字。只看 props 名稱會容易把 `color` 誤解成一般 count badge 的背景色設定，但 runtime 會因為 `status || color` 直接進入 status template。

## 5. Type 與 Public Export

`types/badge.d.ts` 描述使用者可以傳入的 props，例如：

```txt
count
overflow-count
dot
class-name
type
show-zero
status
text
offset
color
```

它也用 `v-slots` 描述兩個 slot：

| Slot | typing 描述 | Runtime 位置 |
| --- | --- | --- |
| `count` | 自訂角標顯示內容，數值 count 將無效 | 一般 count branch 的第一個 `sup`。 |
| `text` | 自訂角標文字；也可自訂 status text | 一般 count branch 的 count 內容，或 status branch 的狀態文字。 |

runtime 的 public export 在 `src/components/index.js`：

```js
export { default as Badge } from './badge';
```

typed public export 在 `types/viewuiplus.components.d.ts`：

```ts
export { Badge } from './badge'
```

全域安裝則在 `src/index.js` 透過整個 component map 間接完成：

```js
Object.keys(ViewUI).forEach(key => {
    app.component(key, ViewUI[key]);
});
```

所以 `src/index.js` 裡沒有直接出現 `Badge`，不代表它沒有被 install 流程涵蓋。

## 6. Example 的閱讀價值

`examples/routers/badge.vue` 的價值在於把幾種容易混淆的情境放在一起。

| 範例情境 | 驗證重點 |
| --- | --- |
| `:count="count"` 包住方塊 | 一般右上角數字角標。 |
| `:count="0" showZero` | 0 預設隱藏，但 `showZero` 可強制顯示。 |
| `#count` 搭配 `Icon` | 自訂角標內容會覆蓋 numeric count。 |
| `text="new"` 或 `#text` | 一般 count 內容可以被文字覆蓋。 |
| `status="success"` | status dot 與文字是 inline layout。 |
| `dot` 包住連結 | dot 模式只顯示小點，不顯示數字。 |
| `:offset="[-5, -5]"` | offset 直接改變角標本體 margin。 |
| `type="primary"` | type 只作用於一般 count badge 的顏色。 |
| `color="blue"` / `color="#2db7f5"` | color 進入 status 模式，內建色走 class，自訂色走 inline style。 |

範例沒有單元測試那樣精準，但很適合用來反推官方希望使用者怎麼組合 props 與 slots。

## 7. 建議閱讀順序

第一次閱讀時，建議按照以下順序。

1. 先讀 `types/badge.d.ts`，建立 public API 和 slot 名稱。
2. 再讀 `examples/routers/badge.vue`，確認官方實際展示哪些組合。
3. 回到 `badge.vue`，先看三段 template branch，再看 computed。
4. 讀 `badge.less`，對照 count、dot、status、alone、type color 與 processing animation。
5. 最後看 `components/index.js`、`src/index.js`、`viewuiplus.components.d.ts`，確認 public export 與 install 路徑。

這個順序能避免一開始就陷入 CSS selector，也能避免只看 type declaration 而漏掉 template branch 優先序。

## 8. 本章總結

`Badge` 的完整行為由 runtime、style、type 與 example 共同成立。`badge.vue` 定義模式選擇與顯示規則，`badge.less` 定義定位和狀態色，`.d.ts` 描述 public surface，但真正的優先序必須回到 template 與 computed 才能看懂。

這組元件很適合用來學習「展示型元件如何用少量 props 和 slots 建立多種互斥視覺模式」。

## 9. 自我檢查問題

1. `Badge` 的單元件入口是哪個檔案？
2. `Badge` 的 typed public export 由哪個檔案提供？
3. 為什麼 `src/index.js` 裡沒有直接搜尋到 `Badge`，仍然可以被全域註冊？
4. `dot`、`status/color`、一般 count 分別在哪一段 template branch？
5. 為什麼 status 模式一定要回到 `badge.less` 看 processing 動畫？
