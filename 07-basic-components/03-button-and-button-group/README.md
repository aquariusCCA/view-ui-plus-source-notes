# Button / ButtonGroup 原始碼閱讀總覽：從操作型元件建立元件庫閱讀主線

## 0. 原始筆記問題分析

這份 `README.md` 已經具備一個總覽入口應有的雛形：它列出 `Button` / `ButtonGroup` 的閱讀範圍、原始碼基準、重點檔案、閱讀主題、筆記索引、學習成果與自我檢查問題。這些內容很適合作為整個 Button 筆記包的入口。

不過，如果要把它放進長期維護的個人知識庫，原始版本仍有幾個可以補強的地方。

第一，原始筆記已經指出 `Button` 是「操作型基礎元件」，但還可以更明確說明：為什麼它不只是樣式元件？它同時跨越 public API、render output、事件流程、表單上下文、router/link navigation 與樣式系統，這正是學習元件庫原始碼時最有價值的地方。

第二，原始筆記列出了 source baseline，但目前比較像「檔案清單」。對初次閱讀 View UI Plus 原始碼的人來說，更需要知道每一類檔案在系統中扮演的角色，以及為什麼不能只看 `button.vue`。

第三，原始筆記列出了五篇子筆記，但還可以補成「閱讀路線」。也就是：先看哪一篇建立地圖，再看哪一篇理解 public contract，最後如何回到 style 與 test 驗證理解。

第四，原始筆記已經有 self check，但可以再補上「常見誤區」與「後續延伸方向」。這樣未來複習時，不只能回答問題，也能知道自己容易在哪些地方誤判。

因此，本篇重構後會把 `README.md` 定位成整個 `Button` / `ButtonGroup` 筆記包的入口章節：它不深入取代後續五篇細節筆記，而是負責建立整體閱讀地圖、學習主線與複習框架。

---

## 1. 本章定位

本章是一篇「原始碼閱讀總覽筆記」，目標是幫助你在正式進入 `Button` / `ButtonGroup` 細節前，先建立完整的閱讀方向。

`Button` 看起來只是元件庫中最基礎的按鈕，但在實際原始碼中，它並不只是把 `type="primary"` 轉成 `ivu-btn-primary`。它同時處理以下幾類問題：

| 面向 | 代表問題 | 對應來源 |
| --- | --- | --- |
| Public API | 使用者可以傳哪些 props？哪些 props 來自 mixin？ | `button.vue`、`mixins/link.js`、`types/button.d.ts` |
| Render output | 最後輸出的是 `<button>` 還是 `<a>`？children 如何組合？ | `button.vue` |
| State | `loading`、`disabled` 如何影響輸出與互動？ | `button.vue`、`mixins/form.js`、`button.less` |
| Event / Navigation | click 先 emit 還是先跳轉？`to` 如何處理？ | `button.vue`、`mixins/link.js` |
| Style system | type、size、shape、ghost、group 樣式如何成立？ | `button.less`、`styles/mixins/button.less` |
| Group behavior | `ButtonGroup` 如何影響一組子按鈕？ | `button-group.vue`、`button.less` |

所以，本章的核心任務不是背 API，而是建立一條操作型元件的閱讀主線：

```txt
public props / mixin props
  -> render tag / children / class
  -> click / loading / disabled / navigation
  -> button.less / ButtonGroup group selector
```

這條主線之後也可以重複用在其他 View UI Plus 元件上，例如 `Input`、`Select`、`Dropdown`、`Menu` 這類同樣牽涉 public API、互動事件與樣式狀態的元件。

---

## 2. 筆記類型判斷

這份筆記主要屬於「原始碼閱讀筆記」，同時帶有一點「架構分析筆記」的特徵。

| 類型 | 本篇是否符合 | 原因 |
| --- | --- | --- |
| 技術概念筆記 | 部分符合 | 會說明操作型元件、public contract、render mapping、group style 等概念。 |
| 原始碼閱讀筆記 | 高度符合 | 主要內容圍繞 View UI Plus `Button` / `ButtonGroup` 的 runtime、mixin、style、type、example、test。 |
| API / 設定筆記 | 部分符合 | 有整理 public props 與 TypeScript declaration，但不是單純 API 速查。 |
| 實作教學筆記 | 較少符合 | 本篇不帶你從零實作 Button，而是帶你閱讀既有元件庫原始碼。 |
| 架構分析筆記 | 部分符合 | 會分析 runtime、shared logic、style、type、test 之間的責任分工。 |

因此，本篇應該採用「總覽 + 閱讀路線 + 責任分工」的寫法。它不需要重複展開每個 props 的細節，也不需要逐行分析 render function；那些內容應該交給後續的專題筆記。

---

## 3. 為什麼 Button / ButtonGroup 值得一起讀？

在元件庫中，`Button` 通常是最早接觸的基礎元件之一。它表面上很簡單：使用者傳入 `type`、`size`、`loading`、`disabled`，元件就輸出一顆按鈕。

但從原始碼角度來看，`Button` 是一個很完整的「操作型元件」範例。它不只處理視覺狀態，還需要回應使用者操作、支援連結跳轉、配合表單禁用狀態，並讓 TypeScript 使用者取得正確的 public contract。

`ButtonGroup` 則是另一種典型：它的 runtime 很薄，但 style 很重。也就是說，`ButtonGroup` 本身不主動管理子 `Button`，而是透過父層 class 讓 less selector 影響子按鈕的排列、邊框、尺寸與圓角。

這兩個元件應該一起讀，原因有三個。

第一，`ButtonGroup` 的存在意義依賴 `Button`。如果沒有子 `Button`，`ButtonGroup` 只是一個包住 slot 的 `div`。

第二，`ButtonGroup` 的主要效果不在 `button-group.vue`，而在 `button.less` 與 `styles/mixins/button.less`。這會訓練你不要只用「Vue component runtime」理解元件庫，而要同時看樣式系統。

第三，這組元件能讓你一次練習元件庫閱讀的多個層次：component、mixin、type declaration、example、test、style、registry 與 plugin install。

---

## 4. Source Baseline：本筆記包的閱讀基準

本筆記包以本地保存的 View UI Plus `v1.3.20` 原始碼為閱讀基準。這一點很重要，因為元件庫在不同版本中可能調整 props、樣式 class、mixin 行為或 TypeScript declaration。

如果之後升級 View UI Plus 版本，應重新比對以下檔案是否有變化。

| 類型 | 路徑 | 閱讀目的 | 初次閱讀重點 |
| --- | --- | --- | --- |
| Runtime | `01-origin/source/view-ui-plus-v1.3.20/src/components/button/button.vue` | 確認 `Button` props、computed、methods、render、loading、click 與 link 行為。 | 先找 `props`、`computed`、`methods`、`render()`。 |
| Runtime | `01-origin/source/view-ui-plus-v1.3.20/src/components/button/button-group.vue` | 確認 `ButtonGroup` 如何包裹 slot 並輸出 group class。 | 注意它是否有 provide/inject、methods、emits。 |
| Runtime entry | `01-origin/source/view-ui-plus-v1.3.20/src/components/button/index.js` | 確認 `Button` 的單元件預設輸出。 | 看它如何 export component。 |
| Runtime entry | `01-origin/source/view-ui-plus-v1.3.20/src/components/button-group/index.js` | 確認 `ButtonGroup` 的單元件預設輸出。 | 注意它實際引用的是 `button/button-group.vue`。 |
| Shared logic | `01-origin/source/view-ui-plus-v1.3.20/src/mixins/link.js` | 確認 `to`、`replace`、`target`、`append` 與 click navigation。 | 找 `linkUrl`、`handleCheckClick()`、`handleClick()`。 |
| Shared logic | `01-origin/source/view-ui-plus-v1.3.20/src/mixins/form.js` | 確認 `Button` 如何接收 Form disabled 狀態。 | 找 `itemDisabled` 與 `FormInstance.disabled`。 |
| Style | `01-origin/source/view-ui-plus-v1.3.20/src/styles/components/button.less` | 對照 type、loading、ghost、group 與 anchor button 樣式。 | 找 `ivu-btn-*` 與 `ivu-btn-group-*`。 |
| Style mixin | `01-origin/source/view-ui-plus-v1.3.20/src/styles/mixins/button.less` | 對照 button base、size、disabled、circle、group、vertical group 規則。 | 找 `.btn()`、`.btn-circle()`、`.btn-group()`、`.btn-group-vertical()`。 |
| Type | `01-origin/source/view-ui-plus-v1.3.20/types/button.d.ts` | 確認 `Button` / `ButtonGroup` 的 public TypeScript contract。 | 對照 runtime props 與 mixin props。 |
| Type entry | `01-origin/source/view-ui-plus-v1.3.20/types/viewuiplus.components.d.ts` | 確認 `Button` / `ButtonGroup` 是否進入 typed public exports。 | 找 `export { Button, ButtonGroup } from './button'` 類似宣告。 |
| Example | `01-origin/source/view-ui-plus-v1.3.20/examples/routers/button.vue` | 確認官方展示的 type、icon、loading、link、group 場景。 | 用範例反推主線 API。 |
| Test | `01-origin/source/view-ui-plus-v1.3.20/test/unit/specs/button.spec.js` | 確認 `<a>` / `<button>`、`htmlType` 與 loading 行為。 | 看哪些行為被測試保護。 |
| Registry | `01-origin/source/view-ui-plus-v1.3.20/src/components/index.js` | 確認 `Button` / `ButtonGroup` 是否被 public export。 | 看它們是否進入元件集合。 |
| Install | `01-origin/source/view-ui-plus-v1.3.20/src/index.js` | 確認全域安裝與 `iButton` alias 註冊方式。 | 看 plugin install 如何註冊元件。 |

這張表的重點不是要求你一次把所有檔案讀完，而是建立「出問題時要去哪裡查」的地圖。元件庫閱讀不是線性讀小說，而是根據問題在 runtime、type、style、example、test 之間來回切換。

---

## 5. 五條閱讀主線

閱讀 `Button` / `ButtonGroup` 時，建議把問題拆成五條主線。這樣可以避免一開始被大量 props、class、less selector 淹沒。

### 5.1 Public contract：使用者能傳什麼？

第一條線是 public contract，也就是使用者可以怎麼使用這個元件。

對 `Button` 來說，public props 不只來自 `button.vue` 自己的 `props` 區塊，也來自 `mixins/link.js`。因此 `to`、`replace`、`target`、`append` 雖然沒有直接寫在 `button.vue` 的 props 區塊，仍然是使用者可以傳入的 public API。

這一點對讀元件庫非常重要。你不能只問：「這個單檔 component 宣告了哪些 props？」還要問：「這個 component 混入了哪些 shared logic？那些 shared logic 是否也注入 props、computed 或 methods？」

建議搭配閱讀：

| 筆記 | 用途 |
| --- | --- |
| `02-public-props-contract.md` | 對照 runtime props、mixin props、`types/button.d.ts`。 |
| `01-source-map.md` | 先知道 mixin 與 type declaration 在哪裡。 |

---

### 5.2 Render output：props 如何變成 DOM？

第二條線是 render output，也就是 `Button` 最後渲染成什麼 DOM 結構。

`Button` 不是單純固定輸出 `<button>`。它會依照 `to` 決定輸出：

| 條件 | DOM tag | 說明 |
| --- | --- | --- |
| 沒有 `to` | `<button>` | 普通操作按鈕，可使用原生 `type` attribute。 |
| 有 `to` | `<a>` | 看起來像按鈕的連結，可能走 URL 或 router navigation。 |

children 的組合也不是固定文字。`Button` 會依照 `loading`、`icon`、`customIcon` 與 default slot 組合出不同內容。當 `loading` 為 true 時，loading icon 會優先於普通 icon，因為此時按鈕最重要的訊息是「正在處理中」。

建議搭配閱讀：

| 筆記 | 用途 |
| --- | --- |
| `03-render-and-class-mapping.md` | 理解 `<button>` / `<a>`、tag props、icon、slot、loading 與 class 如何被組合。 |
| `04-state-events-and-navigation.md` | 補上 click 與 navigation 的後續流程。 |

---

### 5.3 State and events：狀態如何影響互動？

第三條線是狀態與事件。

`loading` 不是只有多顯示一個 icon。它至少牽涉三層：

| 層次 | 影響 |
| --- | --- |
| Render children | 渲染 `ios-loading` icon，並套上 loading loop class。 |
| Class | 加上 `ivu-btn-loading`。 |
| Style / interaction | 樣式層可能加入 overlay 與 `pointer-events: none`。 |

`disabled` 也不是只看 `Button` 自己的 `disabled` prop。因為 `Button` 混入 `mixins/form.js`，所以最終 disabled 狀態可能來自上層 `Form`。

click 的流程也有閱讀價值。`Button` 會先 `$emit('click')`，再把可能的 navigation 交給 link mixin 處理。這代表外部使用者即使在 link button 上，也有機會監聽 click 事件。

建議搭配閱讀：

| 筆記 | 用途 |
| --- | --- |
| `04-state-events-and-navigation.md` | 理解 loading、disabled、click emit、router / link navigation、Form disabled。 |
| `03-render-and-class-mapping.md` | 回頭確認 loading 與 disabled 如何影響 DOM output。 |

---

### 5.4 Style system：class 如何被 less 接住？

第四條線是樣式系統。

在元件庫中，runtime 產生 class 只是第一步。真正的視覺效果要看 less 如何解讀這些 class。

例如：

```txt
Button props
  -> runtime computed classes
  -> ivu-btn / ivu-btn-primary / ivu-btn-loading / ivu-btn-ghost
  -> button.less / style mixins
  -> 實際顏色、尺寸、邊框、hover、active、disabled、loading 效果
```

所以，當你看到 `classes` computed 裡出現 `ivu-btn-loading`，不要只停在「多了一個 class」。你要繼續追到 `button.less`，看這個 class 會如何影響 pointer、overlay、icon、透明度或其他視覺狀態。

建議搭配閱讀：

| 筆記 | 用途 |
| --- | --- |
| `03-render-and-class-mapping.md` | 先知道 runtime 會產生哪些 class。 |
| `05-button-group-and-style-system.md` | 進一步理解 `button.less` 與 `styles/mixins/button.less` 如何接住 class。 |

---

### 5.5 ButtonGroup：runtime 薄，style 重

第五條線是 `ButtonGroup`。

`ButtonGroup` 的核心觀念是：它不是透過 provide/inject、props 傳遞或 slot 遍歷來管理子 `Button`。它主要做的是輸出一個父層 class，讓 less selector 影響底下的 `.ivu-btn`。

概念流程如下：

```txt
<ButtonGroup size="large" vertical>
  -> button-group.vue 產生 group class
  -> ivu-btn-group ivu-btn-group-large ivu-btn-group-vertical
  -> button.less / mixins/button.less 使用父子 selector
  -> 子 Button 視覺尺寸、排列、邊框與圓角被調整
```

這是閱讀元件庫時很重要的一種模式：有些元件的「邏輯」不在 JavaScript，而在 CSS selector。

建議搭配閱讀：

| 筆記 | 用途 |
| --- | --- |
| `05-button-group-and-style-system.md` | 理解 group wrapper 如何透過 less 影響子按鈕排列與視覺。 |
| `01-source-map.md` | 回到 source map 確認 `button-group.vue` 與 style 檔案的位置。 |

---

## 6. Notes Index：本筆記包閱讀順序

本目錄建議依照下列順序閱讀。

| 順序 | 筆記 | 主題 | 建議閱讀目的 |
| --- | --- | --- | --- |
| 1 | `01-source-map.md` | 原始碼入口地圖 | 先知道 runtime、style、type、example、test、mixin、registry 分別在哪裡。 |
| 2 | `02-public-props-contract.md` | public props contract | 對照 runtime props、mixin props 與 `types/button.d.ts`，建立 public API 視角。 |
| 3 | `03-render-and-class-mapping.md` | render 與 class 映射 | 理解 `<button>` / `<a>`、icon、slot、loading 與 class 如何被組合。 |
| 4 | `04-state-events-and-navigation.md` | 狀態、事件與跳轉 | 理解 loading、disabled、click、router / link navigation、Form disabled。 |
| 5 | `05-button-group-and-style-system.md` | ButtonGroup 與樣式系統 | 理解 group wrapper 如何透過 less 影響子按鈕排列與視覺。 |

這個順序的設計邏輯是：先建立地圖，再建立 public API，再看 runtime 輸出，再看互動流程，最後回到 style system。

如果一開始就讀 `button.less`，很容易被大量 selector 影響；如果一開始只讀 `button.vue`，又容易漏掉 mixin props、Form disabled 與 group 樣式。因此，這份閱讀順序刻意讓你先建立整體脈絡，再逐步進入細節。

---

## 7. 建議的三輪閱讀法

如果你的目標不是只整理筆記，而是真正吸收 View UI Plus 的元件設計方式，建議用三輪閱讀法。

### 7.1 第一輪：建立地圖，不追細節

第一輪只需要回答：「哪些檔案負責哪些事情？」

這一輪建議閱讀：

1. `README.md`
2. `01-source-map.md`
3. `types/button.d.ts`
4. `examples/routers/button.vue`

第一輪不要急著理解所有 less selector，也不要逐行追 `handleClick()`。你的目標只是知道：public API、runtime、mixin、style、example、test 分別在哪裡。

### 7.2 第二輪：追一條完整流程

第二輪開始追流程。建議先追最核心的一條線：

```txt
<Button type="primary" loading>Save</Button>
  -> props
  -> classes
  -> children
  -> button.less
  -> 最終視覺狀態
```

接著再追 link button：

```txt
<Button to="/home" target="_blank">Home</Button>
  -> to
  -> tagName = a
  -> tagProps.href / target
  -> click emit
  -> handleCheckClick()
  -> navigation
```

這一輪建議閱讀：

1. `02-public-props-contract.md`
2. `03-render-and-class-mapping.md`
3. `04-state-events-and-navigation.md`

### 7.3 第三輪：回到樣式系統與測試驗證

第三輪再讀 `ButtonGroup` 與 style system。

這一輪你要建立的觀念是：runtime 產生 class，style system 負責把 class 變成實際視覺。尤其 `ButtonGroup` 是典型的「JS 很少、CSS 很重要」的元件。

最後再用 test 回頭驗證哪些行為是被測試保護的。例如：

| 測試方向 | 可驗證的理解 |
| --- | --- |
| 有 `to` 時輸出 `<a>` | `to` 是 tag 切換的分界點。 |
| 沒有 `to` 時輸出 `<button>` | 普通按鈕維持原生 button 語意。 |
| `htmlType` 只在 `<button>` 有效 | link button 不應輸出原生 `type` attribute。 |
| loading state | click 後外部改變 loading，render 應切換 class 與 icon。 |

這一輪建議閱讀：

1. `05-button-group-and-style-system.md`
2. `button.less`
3. `styles/mixins/button.less`
4. `test/unit/specs/button.spec.js`

---

## 8. 完整學習成果

讀完本目錄後，你應該能建立以下理解。

### 8.1 元件定位

你應該能說明：`Button` 是操作型基礎元件，不只是視覺元件。它同時負責操作、連結、狀態、表單上下文與樣式狀態。

### 8.2 Public API 來源

你應該能說明：`Button` 的 public API 由三層共同構成。

| 層次 | 例子 | 說明 |
| --- | --- | --- |
| 自身 props | `type`、`size`、`loading`、`disabled`、`htmlType` | 直接在 `button.vue` 宣告。 |
| mixin props | `to`、`replace`、`target`、`append` | 來自 `mixins/link.js`。 |
| type declaration | `types/button.d.ts` | 從 TypeScript 使用者角度描述 public surface。 |

### 8.3 Render 分界點

你應該能說明：`to` 是 `Button` render tag 的分界點。

```txt
沒有 to
  -> <button>
  -> 可輸出原生 type attribute，例如 type="submit"

有 to
  -> <a>
  -> 透過 href / target / click navigation 處理連結行為
```

### 8.4 Loading 的多層效果

你應該能說明：`loading` 不只是「顯示 loading icon」。它會同時影響 children、class 與 style interaction。

```txt
loading
  -> children 使用 ios-loading icon
  -> class 加上 ivu-btn-loading
  -> style 可能套用 overlay / pointer-events none
```

### 8.5 Form disabled 的來源

你應該能說明：`Button` 最終 disabled 狀態不只來自自身 `disabled` prop，也可能來自上層 `Form`。這是 `mixins/form.js` 提供的上下文能力。

### 8.6 ButtonGroup 的設計模式

你應該能說明：`ButtonGroup` 本身不管理子按鈕狀態。它主要透過父層 group class，讓 less selector 處理排列、尺寸、邊框與圓角。

這個模式可以概括為：

```txt
thin runtime wrapper
  -> parent class
  -> style selector
  -> child visual behavior
```

---

## 9. 常見誤區

| 誤區 | 正確理解 |
| --- | --- |
| `Button` 只是把 props 轉成 class | `Button` 還處理 render tag、children、loading、disabled、click、link navigation 與 Form disabled。 |
| 只看 `button.vue` 就能知道完整 public API | `to`、`replace`、`target`、`append` 來自 `mixins/link.js`，仍然是 public API。 |
| 有 `htmlType` 就一定會輸出 `type` attribute | 只有渲染成 `<button>` 時才應輸出原生 `type` attribute。 |
| `loading` 等於 `disabled` | loading 有自己的 icon、class、overlay 與 pointer 行為，不等於 disabled。 |
| `ButtonGroup` 會把 props 傳給子 `Button` | 此版本主要靠 group class 與 less selector 影響子按鈕視覺，不是 runtime props 傳遞。 |
| `ButtonGroup` 可以單獨理解 | 它的價值依賴子 `Button` 與 `button.less`，應和 `Button` 一起讀。 |
| `.d.ts` 完全等於 runtime source | Type declaration 描述 public surface，可能與 runtime validator 有寬窄落差。 |
| example 只是展示用，不值得讀 | example 可以反推官方主線使用場景與 props 組合。 |
| test 只是在確認功能，不影響閱讀 | test 能告訴你哪些行為是作者認為需要被保護的核心行為。 |

---

## 10. 如何把這組筆記轉成自己的能力？

只讀筆記還不夠。你可以用以下方式把這組內容轉成自己的元件庫閱讀能力。

### 10.1 自己畫一張資料流圖

建議你手動畫出以下流程：

```txt
Button props
  -> computed classes / tagName / tagProps
  -> render output
  -> click handler
  -> link mixin navigation
  -> less style rules
```

如果可以不看筆記畫出這張圖，代表你已經掌握 `Button` 的主線。

### 10.2 自己改一個小功能

可以嘗試設計一個假想需求，例如：

> 如果 `Button` 新增 `danger` prop，應該改哪些地方？

你應該能想到至少需要檢查：

1. runtime props 是否新增。
2. class mapping 是否新增。
3. `types/button.d.ts` 是否新增 public type。
4. `button.less` 是否新增樣式。
5. examples 是否補使用場景。
6. tests 是否補核心行為。

這個練習能幫助你從「看懂元件」進階到「知道元件庫功能應該怎麼補齊」。

### 10.3 對照其他元件

讀完 `Button` 後，可以選一個類似但更複雜的元件，例如 `Input` 或 `Select`，用同樣方法問：

1. public props 來自哪裡？
2. 是否使用 mixin？
3. render output 如何組成？
4. 狀態 class 如何產生？
5. style selector 如何接住 class？
6. example 展示哪些主線場景？
7. test 保護哪些行為？

這樣你就不是只學會 `Button`，而是學會一套元件庫閱讀方法。

---

## 11. 本章總結

`Button` / `ButtonGroup` 是 View UI Plus 中很適合作為原始碼閱讀起點的一組元件。

`Button` 代表一種典型的操作型元件：它不只處理視覺樣式，也整合 public props、mixin props、render tag、children、loading、disabled、click emit、router/link navigation、Form disabled 與 TypeScript declaration。

`ButtonGroup` 則代表另一種重要模式：runtime 很薄，但 style 很重。它本身只包住 slot 並輸出 group class，真正的群組排列、邊框合併、尺寸與圓角處理都在 less selector 中完成。

因此，讀這組元件時，不應只問「有哪些按鈕樣式」，而應該問：「一個元件庫中的基礎操作元件，如何跨 runtime、shared logic、style、type、example 與 test 共同成立？」

當你能回答這個問題，就已經不只是會用 `Button`，而是開始具備閱讀元件庫設計的能力。

---

## 12. 自我檢查問題

1. 為什麼 `Button` 不能只被視為視覺元件？
2. 讀 `Button` 時，為什麼不能只看 `button.vue`？
3. `Button` 的 public props 主要來自哪幾個來源？
4. `to` 在 `Button` 中扮演什麼角色？
5. `Button` 在什麼條件下輸出 `<a>`？在什麼條件下輸出 `<button>`？
6. `htmlType` 和 public template 中的 `html-type` 是什麼關係？
7. `loading` 狀態會同時影響哪些層次？
8. `Button` 的 click handler 為什麼需要先 `$emit('click')`，再處理 navigation？
9. `itemDisabled` 為什麼可能受到上層 `Form` 影響？
10. `ButtonGroup` 為什麼不需要 provide/inject 也能影響子按鈕視覺？
11. 為什麼 `ButtonGroup` 的主要效果不在 `button-group.vue`，而在 less？
12. `button.less` 和 `styles/mixins/button.less` 分別適合觀察什麼？
13. `examples/routers/button.vue` 對原始碼閱讀有什麼價值？
14. `button.spec.js` 可以幫你驗證哪些核心行為？
15. 如果 View UI Plus 升級版本，這組筆記中哪些地方最需要重新比對？

---

## 13. 後續延伸方向

讀完本筆記包後，可以往以下方向延伸。

| 延伸主題 | 學習價值 |
| --- | --- |
| `Input` 元件原始碼閱讀 | 練習表單元件、value binding、composition event、FormItem 整合。 |
| `Icon` 元件原始碼閱讀 | 理解 `Button` 中 icon / customIcon 的底層支援。 |
| `Form` / `FormItem` 原始碼閱讀 | 補齊 `mixins/form.js`、`itemDisabled`、validate event 的上下文。 |
| `mixins/link.js` 獨立筆記 | 深入理解 View UI Plus 如何抽象 router / URL navigation。 |
| View UI Plus style mixin 系統 | 理解 less 變數、mixin、BEM-like class 與元件樣式如何組合。 |
| 元件庫 TypeScript declaration 對照 | 比較 runtime props 與 `.d.ts` 的一致性與落差。 |
| 單元測試閱讀方法 | 從 test 反推元件作者認為重要的 public behavior。 |

如果要繼續深入，我建議下一組可以讀 `Input`。因為 `Input` 會比 `Button` 多出 value 同步、輸入事件、composition event、clearable、password、textarea、FormItem 驗證等問題，很適合在 `Button` 的基礎上繼續擴展元件庫閱讀能力。
