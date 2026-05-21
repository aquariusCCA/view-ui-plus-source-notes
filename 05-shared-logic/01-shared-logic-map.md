# View UI Plus Shared Logic Map：共用邏輯地圖

## 1. 本章定位

這篇筆記是 `05-shared-logic/` 的入口地圖。

View UI Plus v1.3.20 沒有獨立的 `src/composables/` 或 hooks 分層。它的共用邏輯主要散落在三個地方：

1. `src/mixins/`：把一組元件能力注入到 Options API component。
2. `src/utils/`：提供資料、DOM、元件樹查找、量測、下載、格式化等工具。
3. 部分元件自己的 mixin 或 util：例如 `components/modal/mixins-scrollbar.js`、`components/menu/mixin.js`、`components/color-picker/hsaMixin.js`。

本章不是逐行分析所有工具函式，而是先建立一張閱讀地圖：當你在元件裡看到 mixin 或 util import 時，要知道它大概屬於哪種共用能力。

---

## 2. Source Baseline

| 項目 | 內容 |
| --- | --- |
| Package | `view-ui-plus` |
| Version | `1.3.20` |
| Source root | `01-origin/source/view-ui-plus-v1.3.20/` |
| Mixin source | `src/mixins/` |
| Utility source | `src/utils/` |

本章所有觀察都以 `view-ui-plus@1.3.20` 這份 source snapshot 為基準。

---

## 3. 共用邏輯總覽

`src/mixins/` 內主要有以下檔案：

| 檔案 | 主要角色 |
| --- | --- |
| `form.js` | 讓欄位元件接入 `Form` / `FormItem`，共用 disabled 與驗證事件回報。 |
| `locale.js` | 把 `t()` 翻譯方法注入元件。 |
| `globalConfig.js` | 從 app globalProperties 讀取 `$VIEWUI` 全域設定。 |
| `link.js` | 讓 Button、MenuItem、Cell 等元件共用跳轉能力。 |
| `emitter.js` | Vue 2 風格的父子事件橋接工具，目前在 v1.3.20 source 中未看到實際 import。 |

`src/utils/` 內主要有以下檔案：

| 檔案 | 主要角色 |
| --- | --- |
| `assist.js` | 大雜燴工具：prop validator、資料複製、元件樹查找、class 操作、scroll、download、scrollbar size 等。 |
| `dom.js` | 跨瀏覽器事件綁定與解除：`on` / `off`。 |
| `index.js` | `isClient`，判斷是否可使用 `window`。 |
| `canUseDom.js` | 更完整的 DOM 可用性判斷。 |
| `styleCheck.js` | CSS property/value 與 flex gap 支援偵測。 |
| `transfer-queue.js` | 浮層 z-index / 可見層級的 module-level counter。 |
| `calcTextareaHeight.js` | textarea autosize 量測工具。 |
| `date.js` | 日期 parse / format 工具。 |
| `csv.js` | 將 columns + data 轉成 CSV 文字。 |
| `keyCode.js` | keyboard keyCode 常數表。 |
| `random_str.js` | 產生隨機字串，用於臨時 id/key。 |

---

## 4. 為什麼這些邏輯沒有集中成 hooks？

View UI Plus 是 Vue 3 library，但不少程式形狀仍保留 Vue 2 / Options API 的設計風格。

因此它不會像一些新專案那樣大量出現：

```txt
src/composables/useFormItem.ts
src/composables/useLocale.ts
src/composables/usePopper.ts
```

而是更常看到：

```js
mixins: [ Locale, mixinsForm ]
```

或：

```js
import { oneOf, findComponentUpward } from '../../utils/assist';
```

這代表閱讀本章時，重點不是尋找 Composition API hooks，而是理解 Options API 時代常見的三種復用方式：

| 復用方式 | 特色 |
| --- | --- |
| Mixin | 直接把 props、computed、methods、inject、lifecycle 合併進 component。 |
| Utility function | 保持無狀態或低狀態，讓元件自行呼叫。 |
| Module-level state | 在模組作用域保存共享 counter 或 cache，例如 `transfer-queue.js`。 |

---

## 5. 三類共用能力

### 5.1 元件能力注入

這類通常放在 `src/mixins/`。

例子：

```txt
mixins/form.js
  -> 注入 FormInstance / FormItemInstance
  -> 提供 itemDisabled
  -> 提供 handleFormItemChange()

mixins/locale.js
  -> 提供 t()

mixins/link.js
  -> 提供 linkUrl / handleClick / handleCheckClick
```

它們的共同特徵是：元件使用後，模板、computed 或 methods 可以直接讀到這些能力。好處是使用簡單，缺點是依賴較隱性。

### 5.2 工具型函式

這類通常放在 `src/utils/`。

例子：

```txt
oneOf()
deepCopy()
findComponentUpward()
getStyle()
scrollTop()
on() / off()
```

它們的共同特徵是：由呼叫端明確 import，資料流比較清楚。但 `assist.js` 中混合了太多不同職責，閱讀時應該按能力拆解，而不是把它當成單一主題。

### 5.3 跨實例共享狀態

這類通常不是 Vue reactive state，而是模組層變數。

例子：

```js
let transferIndex = 0;
let lastVisibleIndex = 0;
```

這種設計常見於 UI library 的浮層管理，例如 Modal、Tooltip、Poptip、Select dropdown 需要動態提高 z-index。它的特點是簡單、直接，但也表示狀態跟模組生命週期綁在一起。

---

## 6. 閱讀路線

建議照以下順序讀：

```txt
01 shared logic map
  -> 02 Options API mixin 模型
  -> 03 Form mixin contract
  -> 04 Locale / global config
  -> 05 Link navigation
  -> 06 元件樹查找與事件橋接
  -> 07 DOM 與 client boundary
  -> 08 Overlay shared state
  -> 09 Data / keyboard utils
  -> 10 Measurement utils
  -> 11 設計邊界總結
  -> 12 mini labs
```

這樣讀的原因是：先理解 mixin 這種復用形式，再看最常見的 Form / Locale / Link；接著看元件樹與 DOM 工具；最後回到設計邊界與仿作練習。

---

## 7. 本章結論

`05-shared-logic/` 的重點不是記住每個工具函式，而是理解 View UI Plus 如何在沒有 hooks 分層的情況下，仍然把大量跨元件能力復用起來。

讀這一區時要持續問三個問題：

1. 這段邏輯是透過 mixin 注入，還是透過 util 顯式呼叫？
2. 它有沒有依賴 DOM、`window`、`document` 或瀏覽器能力？
3. 它是純函式、component instance helper，還是 module-level shared state？

能回答這三個問題，後面讀 Form、Overlay、Select、Table、Modal 時會順很多。
