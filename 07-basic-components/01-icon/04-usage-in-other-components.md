# Icon Usage In Other Components：作為共用視覺原子

## 0. 原始筆記問題分析

原本筆記已經說明 `Icon` 是最小視覺原子，但還沒有展示它如何被其他元件使用。對元件庫來說，`Icon` 的重要性不只在於使用者可以直接寫 `<Icon />`，更在於其他元件會反覆依賴它呈現箭頭、關閉符號、狀態圖標或操作圖標。

這篇筆記補上跨元件視角，幫助讀者理解為什麼一個很小的元件會放在基礎元件閱讀的開頭。

---

## 1. 本章定位

本章是一篇組合關係筆記，觀察 `Icon` 在 View UI Plus 其他元件中的使用方式。它不逐行分析每個父元件，而是整理常見使用模式與閱讀重點。

讀完後，應該能理解：

1. `Icon` 為什麼被大量元件依賴。
2. 父元件如何透過自己的 props 或全域設定決定 icon。
3. `Icon` 在父元件中通常只負責視覺，不負責行為。
4. 閱讀其他元件時，什麼時候需要回頭對照 `Icon`。

---

## 2. 學習前先建立的基本觀念

基礎元件常有兩種價值。

第一種是直接被業務畫面使用，例如使用者直接寫：

```vue
<Icon type="ios-search" />
```

第二種是被更高階的元件組合使用。這才是 `Icon` 在元件庫中的關鍵位置。按鈕、選單、樹、標籤頁、日期選擇器、上傳列表、彈窗關閉按鈕，都可能需要顯示一個圖標。

在這些情境中，`Icon` 不決定「何時展開」、「何時關閉」、「是否 disabled」。它只負責呈現圖標。行為通常留在父元件，父元件再把 `type`、`custom`、`size`、class 或 click listener 傳給 `Icon`。因為 `Icon` 是單根 `<i>`，Vue 3 可以把父層 listener fallthrough 到根節點，但 handler 本身仍由父元件定義。

---

## 3. 常見使用場景

| 父元件 / 場景 | 使用方式 | 閱讀重點 |
| --- | --- | --- |
| `Button` | 根據 `icon`、`customIcon`、`loading` 渲染 `Icon` | `Icon` 是按鈕內容的一部分，click 行為仍由 `Button` 控制。 |
| `Avatar` | 沒有圖片或文字時可用 `icon` / `customIcon` | `Icon` 是頭像 fallback 內容之一。 |
| `Tabs` | 顯示左右滾動箭頭與關閉圖標 | 父元件可能透過全域設定決定 close icon。 |
| `Select` / `Cascader` / `ColorPicker` | 顯示下拉箭頭、清除圖標或操作圖標 | `Icon` 常被加上父元件自己的 class 以配合定位。 |
| `Tree` / `Cell` / `Menu` | 顯示展開箭頭 | icon 類型可能受全域配置或父元件 props 影響。 |
| `Upload` / `Table` / `ImagePreview` | 顯示狀態、操作或導覽圖標 | `Icon` 只提供圖形，具體操作流程在父元件。 |

這些使用方式有共同點：父元件決定語意與互動，`Icon` 提供一致的視覺表現。

---

## 4. `Button`：最典型的組合案例

`Button` 會 import `Icon`，並根據自身 props 決定是否渲染圖標。它支援一般 icon、自訂 icon，也會在 loading 狀態下渲染 loading 圖標。

這裡可以觀察到元件分工：

```txt
Button
  -> 判斷 type / size / loading / disabled / click / link
  -> 決定何時需要 icon
  -> 把 icon name 或 custom class 交給 Icon

Icon
  -> 接收 type / custom
  -> 產生 class / style
  -> 顯示圖標
```

`Button` 的 click 行為不應該下放給 `Icon`。即使使用者點到圖標區域，語意上仍然是點擊按鈕，所以行為應由 `Button` 管理。

這也是元件組合中很重要的邊界：視覺原子負責顯示，互動元件負責狀態與事件。

---

## 5. `Avatar`：作為 fallback 內容

`Avatar` 會在不同內容來源之間做 fallback，例如圖片、圖標、文字。當它使用 `Icon` 時，`Icon` 不是獨立操作元件，而是頭像內容的一種呈現方式。

這種情境下，閱讀重點不是 `Icon` 本身，而是父元件如何決定顯示優先順序。`Icon` 仍然只處理 `type` / `custom` 對應到 class 的工作。

因此讀 `Avatar` 時，可以把 `Icon` 視為已知基礎能力，重點轉向 `Avatar` 如何決定何時顯示圖片、何時顯示 icon、何時顯示 slot 或文字。

---

## 6. 箭頭型 icon：全域設定與父元件 class

在 `Tabs`、`Menu`、`Tree`、`Cell`、`Select`、`Cascader`、`ColorPicker` 這類元件中，`Icon` 常被用來顯示箭頭或關閉符號。

這些元件通常有兩個特點。

第一，icon 類型可能不是固定寫死，而是由父元件 props 或 `$VIEWUI` 全域設定決定。例如某些元件會支援 `arrow`、`customArrow`、`arrowSize` 這類配置，再把結果傳入 `Icon`。

第二，父元件會給 `Icon` 額外 class。這些 class 通常不是為了改變圖標字形，而是為了控制位置、旋轉、hover 狀態、顏色或 transition。

所以閱讀這類父元件時，要分清楚：

```txt
Icon type / custom / size
  -> 決定顯示哪個圖標

父元件 class / style
  -> 決定這個圖標在父元件中的位置與狀態外觀
```

---

## 7. 直接使用 `<i class="ivu-icon ...">` 的情況

原始碼中有些地方沒有使用 `Icon` component，而是直接寫：

```html
<i class="ivu-icon ivu-icon-ios-close"></i>
```

這種寫法通常出現在較早或較底層的實作中。它依然使用同一套 icon font class，只是繞過了 `Icon` component 的 props 映射。

閱讀時不需要把這視為另一套圖標系統。它和 `<Icon type="ios-close" />` 最終依賴的是同一批 `.ivu-icon-*` 樣式。差別只是前者直接寫 class，後者透過 component 產生 class。

---

## 8. 閱讀其他元件時如何處理 `Icon`

當你在其他元件中看到 `Icon`，可以先用以下方式快速判斷：

1. `Icon` 是固定圖標，還是由父元件 props / config 決定？
2. 父元件是否傳入 `custom`，表示支援自訂 icon font？
3. 父元件是否傳入 `size`，表示圖標大小可配置？
4. 父元件是否給 `Icon` 額外 class，表示它要控制定位或狀態樣式？
5. click 或 keyboard 行為是否在父元件，而不是在 `Icon`？

這樣讀可以避免把父元件的互動邏輯誤會成 `Icon` 的責任。

---

## 9. 常見誤區

| 誤區 | 正確理解 |
| --- | --- |
| `Icon` 被放在按鈕裡，所以它也負責 click | click 語意通常屬於 `Button`，`Icon` 只負責視覺。 |
| 父元件給 `Icon` class 就是在換圖標 | `type/custom` 換圖標；父 class 多半控制位置、狀態或動畫。 |
| 直接寫 `<i class="ivu-icon ...">` 是另一套系統 | 它仍然依賴同一套 icon font class，只是沒有走 component。 |
| 看到 `customIcon` 就以為 View UI Plus 內建該圖標 | `customIcon` 通常要求外部提供自訂 icon CSS。 |
| 所有 icon 都應該從 `Icon` component 出現 | 原始碼中可能有直接 class 寫法，閱讀時以最終 class 系統為準。 |

---

## 10. 本章總結

`Icon` 的重要性來自組合能力。它本身很小，但因為 API 穩定、輸出簡單、可被 inline 排版，所以能成為大量元件共用的視覺原子。

閱讀其他元件時，看到 `Icon` 應該先把它當成已知的 class / style 映射層。真正需要深入分析的是父元件如何決定圖標名稱、如何控制圖標位置、以及互動行為是否仍保留在父元件中。

---

## 11. 自我檢查問題

1. 為什麼 `Button` 內的 icon click 行為不應該由 `Icon` 自己處理？
2. `Avatar` 使用 `Icon` 時，閱讀重點應該放在 `Icon` 還是 fallback 流程？
3. 父元件傳給 `Icon` 的額外 class 通常負責什麼？
4. `<Icon type="ios-close" />` 和 `<i class="ivu-icon ivu-icon-ios-close"></i>` 的共同點是什麼？
5. 當父元件支援 `customIcon` 時，為什麼還需要外部 CSS？
6. 讀到 `Tree` 或 `Cell` 的 arrow icon 時，應該檢查哪些父元件設定？
