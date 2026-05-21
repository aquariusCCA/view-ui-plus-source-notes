# Measurement Utils：textarea、scrollbar 與 style 量測

## 1. 本章定位

本篇整理 View UI Plus 中需要真實 DOM 量測的工具。

主要來源：

```txt
src/utils/calcTextareaHeight.js
src/utils/assist.js
  -> getScrollBarSize()
  -> getStyle()
  -> scrollTop()
src/utils/styleCheck.js
```

這類工具和純資料工具不同。它們必須依賴實際瀏覽器 layout 結果，因此會碰到 client guard、快取、hidden element、box model 等問題。

---

## 2. `calcTextareaHeight.js`：autosize textarea

`calcTextareaHeight(uiTextNode, minRows, maxRows, useCache)` 的目標是：

```txt
根據 textarea 內容與樣式，計算應該設定的 height / minHeight / maxHeight / overflowY。
```

它的核心做法：

1. 建立一個隱藏的 textarea。
2. 複製會影響高度的 CSS properties。
3. 把目標 textarea 的 value 或 placeholder 放進隱藏 textarea。
4. 讀取 `scrollHeight`。
5. 根據 `box-sizing`、padding、border 修正高度。
6. 套用 `minRows` / `maxRows`。

---

## 3. 為什麼不能只看字數算高度？

textarea 高度受很多因素影響：

```txt
font-size
font-family
line-height
letter-spacing
width
padding
border
box-sizing
text-transform
wrap
```

同樣 100 個字，在不同寬度、字體、line-height 下會換成不同列數。所以它必須用真實 DOM 量測，而不是用字串長度推估。

---

## 4. Input 如何使用 textarea autosize

`Input` 中：

```js
import calcTextareaHeight from '../../utils/calcTextareaHeight';
```

當 `autosize` 且 `type === 'textarea'` 時：

```js
resizeTextarea () {
    const autosize = this.autosize;
    if (!autosize || this.type !== 'textarea') {
        return false;
    }

    const minRows = autosize.minRows;
    const maxRows = autosize.maxRows;

    this.textareaStyles = calcTextareaHeight(this.$refs.textarea, minRows, maxRows);
}
```

計算結果會回到 template：

```html
<textarea :style="textareaStyles">
```

所以 data flow 是：

```txt
使用者輸入
  -> Input setCurrentValue()
  -> nextTick resizeTextarea()
  -> calcTextareaHeight($refs.textarea)
  -> textareaStyles 更新
  -> DOM 高度更新
```

---

## 5. `getScrollBarSize()`：計算 scrollbar 寬度

`assist.js` 的 `getScrollBarSize(fresh)` 會：

1. 建立外層 hidden div。
2. 建立內層 div。
3. 先測量無 scroll 時的寬度。
4. 將外層設為 `overflow: scroll`。
5. 再測量有 scroll 時的寬度。
6. 兩者相減得到 scrollbar width。
7. 快取結果。

這個工具主要用於 Modal scroll lock。當 body scrollbar 被隱藏時，需要用 paddingRight 補回 scrollbar 寬度，避免頁面左右跳動。

---

## 6. `getStyle()`：讀取 computed style

`assist.js` 的 `getStyle(element, styleName)` 做幾件事：

1. client guard。
2. 將 hyphen style name 轉成 camelCase。
3. 特別處理 `float` -> `cssFloat`。
4. 優先讀 `document.defaultView.getComputedStyle()`。
5. try/catch fallback 到 `element.style[styleName]`。

常見用途：

```txt
Grid item
Slider
Table
Submenu
Select dropdown
Carousel
Ellipsis
```

這類工具通常用於需要知道元素實際尺寸或樣式值的元件。

---

## 7. `scrollTop()`：動畫捲動

`assist.js` 的 `scrollTop(el, from, to, duration, endCallback)` 使用 `requestAnimationFrame` 做簡單的 scroll animation。

常見使用者：

```txt
Anchor
BackTop
DatePicker time spinner
```

它會根據 `from` / `to` / `duration` 算出 step，持續更新：

```txt
window.scrollTo()
或
el.scrollTop
```

這種工具看起來像動畫，但本質上仍是 DOM measurement / DOM mutation。

---

## 8. 量測工具的共同特徵

| 特徵 | 說明 |
| --- | --- |
| 依賴 browser layout | 必須在有 DOM 的環境才準確。 |
| 常需要 hidden element | 不想影響畫面，但要讓瀏覽器幫忙計算。 |
| 需要考慮 box model | padding、border、box-sizing 都會影響結果。 |
| 可能需要快取 | scrollbar width、computed style 等不一定每次都要重算。 |
| 需要清理 DOM | 建立測試元素後要移除。 |

---

## 9. 讀碼提醒

讀量測工具時，要特別檢查：

1. 是否有 `isClient` 或 `canUseDom()` guard？
2. 建立的 DOM element 是否會移除？
3. 快取 key 是否可靠？
4. 是否在 `mounted` / `nextTick` 後才量測？
5. 是否處理 `box-sizing: border-box` 與 `content-box`？
6. 動畫或 requestAnimationFrame 是否可能在 unmount 後繼續執行？

---

## 10. 本章結論

量測型工具是 UI library 裡最容易被低估的一層。

它們通常不是業務邏輯，但會直接影響元件體驗：

```txt
textarea 是否自然長高
Modal 開啟時頁面是否跳動
Dropdown / Slider / Table 是否能正確讀尺寸
Anchor / BackTop 是否平滑捲動
```

讀這些工具時，要把它們看成「用瀏覽器 layout engine 幫元件算資料」的共用封裝。
