# Divider Source Map：分隔元件原始碼入口

## 0. 原始筆記問題分析

原本的 `README.md` 已經列出 `Divider` 的主要入口，但還偏向索引型筆記。它告訴你要看哪些檔案，卻還沒有說明每個檔案在 `Divider` 這個元件中扮演什麼角色，也沒有把 runtime、樣式、型別與官方範例串成完整閱讀路線。

這篇筆記的目標，是把入口表整理成可以實際帶路的 source map。讀者第一次打開 `Divider` 原始碼時，可以先用這篇建立全局視角，再進入 props、slot、class 與 less 的細節。

---

## 1. 本章定位

本章是一份 `Divider` 元件的原始碼地圖，不負責逐行講解每個樣式規則。它要先回答一個問題：如果要理解 View UI Plus 的 `Divider`，到底要看哪些檔案，並且每個檔案各自補上哪一塊資訊？

`Divider` 的 runtime source 很短，但元件庫中的 public component 不能只看 `.vue`。真正的對外行為需要同時對照：

```txt
runtime component
  -> type declaration
  -> style source
  -> examples
  -> component registry
  -> plugin install
```

如果只看 `divider.vue`，你會知道它輸出一個根 `div`，但不知道帶文字分隔線的左右線其實來自 pseudo-elements。如果只看 `divider.less`，則不知道哪些 class 是由 props 與 slot 動態產生的。

---

## 2. 學習前先建立的基本觀念

`Divider` 是一個低互動結構型元件。它不像 `Button` 需要處理 click、loading、disabled，也不像 `Tag` 需要處理 close 或 check 狀態。它的主要任務是把分隔線這個視覺結構穩定輸出。

這裡要先區分兩個層次。

第一個層次是 Vue component。`src/components/divider/divider.vue` 負責接收 `type`、`orientation`、`dashed`、`size`、`plain`，判斷是否有 default slot，並組合出根節點與內層文字節點。

第二個層次是 Less style。`src/styles/components/divider.less` 負責把 `ivu-divider-horizontal`、`ivu-divider-vertical`、`ivu-divider-with-text-left`、`ivu-divider-dashed`、`ivu-divider-plain` 等 class 轉成實際視覺效果。

因此閱讀 `Divider` 時，要把它當成「props / slot 到結構與樣式的轉接器」來看，而不是只看它畫了一條線。

---

## 3. Source Entry

| 類型 | 路徑 | 角色 | 閱讀重點 |
| --- | --- | --- | --- |
| Runtime | `01-origin/source/view-ui-plus-v1.3.20/src/components/divider/divider.vue` | 元件實作 | props 定義、`hasSlot`、`classes`、`slotClasses`、template。 |
| Type | `01-origin/source/view-ui-plus-v1.3.20/types/divider.d.ts` | 對外型別契約 | `type`、`orientation`、`dashed`、`plain`、`size` 的 public API。 |
| Example | `01-origin/source/view-ui-plus-v1.3.20/examples/routers/divider.vue` | 官方使用範例 | 水平線、垂直線、帶文字、左右位置、虛線、plain。 |
| Style | `01-origin/source/view-ui-plus-v1.3.20/src/styles/components/divider.less` | 視覺規則 | 水平 / 垂直尺寸、文字位置、pseudo-elements、虛線與 plain。 |
| Public Registry | `01-origin/source/view-ui-plus-v1.3.20/src/components/index.js` | public export | 確認 `Divider` 是否被元件庫公開匯出。 |
| Plugin Install | `01-origin/source/view-ui-plus-v1.3.20/src/index.js` | 全域註冊 | 確認完整安裝 View UI Plus 時是否註冊 `Divider`。 |

這張表的重點不是背路徑，而是建立閱讀順序。先看 type 與 example 會知道使用者可以怎麼用；再看 runtime 會知道 props 和 slot 如何轉成 class；最後看 style source 才能理解這些 class 如何變成畫面。

---

## 4. 核心內容逐步講解

### 4.1 `divider.vue` 是 runtime 轉換層

`Divider` 的 template 很短：

```vue
<div :class="classes">
    <span v-if="hasSlot" :class="slotClasses">
        <slot></slot>
    </span>
</div>
```

這代表它的 DOM 結構只有兩層可能性。

沒有 default slot 時，只會輸出根 `div`。這種情境適合普通水平分隔線或垂直分隔線。

有 default slot 時，根 `div` 裡會多一個 `span`，用來承載分隔線文字。這時 `classes` 也會加上 `with-text` 相關 class，讓 less 可以切換成帶文字的分隔線樣式。

### 4.2 `types/divider.d.ts` 定義 public contract

型別宣告中，`Divider` 對外公開五個 props：

| Prop | Type | 說明 |
| --- | --- | --- |
| `type` | `'horizontal' \| 'vertical'` | 水平或垂直分隔線。 |
| `orientation` | `'left' \| 'right' \| 'center'` | 分隔線文字位置。 |
| `dashed` | `boolean` | 是否使用虛線。 |
| `plain` | `boolean` | 文字是否顯示為普通正文樣式。 |
| `size` | `string` | 尺寸，註解說明可選 `small` 或 `default`。 |

型別檔的價值在於確認這些欄位是 public API，而不是 `divider.vue` 內部偶然使用的變數。不過閱讀時要注意，`size` 在型別上是 `string`，runtime validator 實際只接受 `small` 與 `default`。

### 4.3 `examples/routers/divider.vue` 展示主要使用情境

官方範例集中展示六種情境：

| 情境 | 範例寫法 | 閱讀重點 |
| --- | --- | --- |
| 普通水平線 | `<Divider/>` | 沒有 slot，只輸出一條水平線。 |
| 帶文字水平線 | `<Divider>iView</Divider>` | default slot 觸發 `hasSlot`。 |
| small 尺寸 | `<Divider size="small">iView</Divider>` | 主要影響帶文字分隔線的字級與 margin。 |
| 虛線 | `<Divider dashed/>` | 透過 `dashed` class 切換線條。 |
| 左右文字位置 | `<Divider orientation="left">iView</Divider>` | 必須有 slot 才看得出位置差異。 |
| 垂直線 | `<Divider type="vertical" />` | 用於行內文字或連結之間。 |

example 的作用是幫助判斷哪些 props 組合是元件作者想主推的使用方式。`Divider` 沒有展示事件，這也呼應它的定位：它不是互動元件，而是結構與視覺元件。

### 4.4 `divider.less` 才定義真正的線條畫法

`Divider` 的線條不是永遠用同一種 CSS 畫出來。

普通水平線主要依靠根節點背景色與 `height: 1px`。垂直線則依靠 `display: inline-block`、`width: 1px`、`height: 0.9em`。虛線會改用 `border-top: 1px dashed`。帶文字分隔線更特殊，會透過 `:before` 與 `:after` 產生左右兩段線。

這也是為什麼 `Divider` 一定要對照 less。runtime 只產生 class，真正的視覺行為在 style source 中完成。

### 4.5 registry 與 install 確認 public surface

`src/components/index.js` 用來確認 `Divider` 是否被元件庫公開匯出。`src/index.js` 則用來確認完整安裝 View UI Plus 時，`Divider` 是否會被註冊成全域元件。

這兩個檔案通常不包含 `Divider` 的核心邏輯，但它們能回答 public surface 的問題：這個元件不是只存在於 source tree，而是真的進入使用者可用的元件集合。

---

## 5. 建議閱讀路線

初次閱讀時，建議照這個順序：

1. 先看 `types/divider.d.ts`，確認 public props 只有五個。
2. 再看 `examples/routers/divider.vue`，建立官方使用情境印象。
3. 接著看 `src/components/divider/divider.vue`，理解 props 與 slot 如何轉成 class。
4. 再看 `src/styles/components/divider.less`，理解 class 如何對應到線條與文字樣式。
5. 最後看 `src/components/index.js` 與 `src/index.js`，確認它如何進入 public surface。

深入閱讀時，可以特別追蹤 `with-text`、`with-text-left`、`with-text-right`、`dashed`、`plain` 這幾組 class 在 runtime 與 less 之間的對應。

---

## 6. 常見誤區

| 誤區 | 為什麼容易誤解 | 正確理解 |
| --- | --- | --- |
| 只看 `divider.vue` 就以為讀完了 | runtime source 很短 | 帶文字線、虛線與 plain 的關鍵都在 less。 |
| 以為 `orientation` 永遠有效 | prop 看起來像獨立控制文字位置 | 沒有 default slot 時，不會渲染 inner text，位置差異幾乎沒有可見意義。 |
| 以為 `plain` 會改變分隔線方向 | plain 名稱容易被理解成整體樣式模式 | plain 主要讓帶文字分隔線的文字變成普通正文樣式。 |
| 以為所有線條都由背景色畫出 | 普通水平線確實使用 background | 虛線使用 `border-top`，帶文字線使用 pseudo-elements。 |

---

## 7. 本章總結

`Divider` 的 source map 要從多個檔案一起看。`divider.vue` 定義 props、slot 判斷與 class 映射，`types/divider.d.ts` 定義 public contract，`examples/routers/divider.vue` 展示主要使用情境，`divider.less` 則負責把 class 轉成實際線條與文字位置。

理解這張地圖後，後續閱讀 `Divider` 就不會停留在「它是一條線」這種表面結論，而能看出元件庫如何用很小的 runtime source，搭配樣式系統完成多種分隔線情境。

---

## 8. 自我檢查問題

1. `Divider` 的 runtime、type declaration、style source 各自回答什麼問題？
2. 為什麼 `examples/routers/divider.vue` 對理解 `orientation` 很重要？
3. `Divider` 的 default slot 會改變哪些輸出？
4. 為什麼帶文字分隔線必須回到 `divider.less` 才能完整理解？
5. registry 與 install 檔案對理解 public component 有什麼作用？
