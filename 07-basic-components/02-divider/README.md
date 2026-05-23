# Divider 原始碼閱讀筆記

本目錄聚焦 View UI Plus 的 `Divider` 分隔元件。它是基礎元件中狀態很少、互動很少，但很適合用來觀察「結構型元件」的例子：使用者只傳入少量 props 與 default slot，元件就會把它們轉成穩定的 DOM 結構、class 組合與分隔線樣式。

`Divider` 不處理 click、不宣告 emits，也沒有複雜 methods。它的核心不是資料流，而是這條轉換鏈：

```txt
props / default slot
  -> hasSlot
  -> classes / slotClasses
  -> root div / inner text span
  -> divider.less 視覺規則
```

因此它很適合接在 `Icon` 後面閱讀。`Icon` 幫助建立 props-to-class 的最小模型；`Divider` 則多了一層 slot 與 pseudo-elements，能觀察元件如何用固定結構承載可變內容。

## 1. Source Baseline

本目錄以本地保存的 View UI Plus `v1.3.20` 原始碼為閱讀基準。

| 類型 | 路徑 | 閱讀目的 |
| --- | --- | --- |
| Runtime | `01-origin/source/view-ui-plus-v1.3.20/src/components/divider/divider.vue` | 確認 props、`hasSlot`、class 計算與 slot DOM 結構。 |
| Type | `01-origin/source/view-ui-plus-v1.3.20/types/divider.d.ts` | 對照 `Divider` 對外公開的 TypeScript contract。 |
| Example | `01-origin/source/view-ui-plus-v1.3.20/examples/routers/divider.vue` | 確認官方展示的水平、垂直、帶文字、虛線與 plain 用法。 |
| Style | `01-origin/source/view-ui-plus-v1.3.20/src/styles/components/divider.less` | 對照方向、文字位置、虛線、尺寸與 plain 的視覺規則。 |
| Registry | `01-origin/source/view-ui-plus-v1.3.20/src/components/index.js` | 確認 `Divider` 是否進入 public export。 |
| Install | `01-origin/source/view-ui-plus-v1.3.20/src/index.js` | 確認全域安裝時如何註冊 `Divider`。 |

## 2. Reading Focus

閱讀 `Divider` 時不要只把它理解成一條線。原始碼筆記更應該回答三個問題。

第一，`Divider` 如何用很小的 public API 表達多種視覺情境。`type` 決定水平或垂直，`orientation` 決定文字位置，`dashed` 決定線條樣式，`size` 影響帶文字分隔線的尺寸，`plain` 讓文字回到普通正文樣式。

第二，default slot 如何改變元件結構。沒有 slot 時，`Divider` 只輸出根節點；有 slot 時，才會額外渲染 `ivu-divider-inner-text`，並加上 `with-text` 相關 class。官方範例把帶文字用法放在水平分隔線中，垂直分隔線主要用在行內內容之間。

第三，線條真正的畫法需要看 less。普通水平線主要來自根節點背景，虛線來自 `border-top`，帶文字分隔線則透過 `:before` 與 `:after` 畫出左右線。

## 3. Notes Index

建議依照下列順序閱讀。

| 筆記 | 主題 | 建議閱讀目的 |
| --- | --- | --- |
| `01-source-map.md` | 原始碼入口地圖 | 先知道 `Divider` 的 runtime、type、style、example、registry 分別在哪裡。 |
| `02-props-slot-and-structure.md` | props、slot 與 DOM 結構 | 理解 `type / orientation / dashed / size / plain` 如何影響 `hasSlot`、class 與 DOM。 |
| `03-class-and-style.md` | class 與 less 對照 | 理解普通線、帶文字線、虛線、plain 與 small 尺寸如何被樣式化。 |

## 4. Learning Outcome

讀完本目錄後，應該能建立以下理解。

1. `Divider` 是低互動結構型元件，不主動管理事件與外部資料流。
2. `orientation` 只有在有 default slot 時才真正產生文字位置效果。
3. `plain` 主要改變帶文字分隔線的文字樣式，不是改變分隔線方向。
4. `Divider` 的線條可能由 root background、`border-top` 或 pseudo-elements 產生，要依情境判斷。
5. 想完整理解 `Divider`，必須同時看 runtime、type declaration、style source 與 example。

## 5. Self Check

1. 為什麼 `Divider` 適合被歸類為低互動結構型元件？
2. `hasSlot` 會影響哪些 class 與 DOM 結構？
3. `orientation="left"` 在沒有 default slot 時為什麼幾乎沒有可見意義？
4. 普通水平分隔線、虛線分隔線、帶文字分隔線分別主要由哪種 CSS 技術畫出？
5. `size="small"` 主要影響哪一類分隔線情境？
