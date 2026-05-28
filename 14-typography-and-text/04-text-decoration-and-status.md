# 文字修飾與狀態樣式

## 學習目標

這篇分析 Typography 家族中的文字修飾能力。這些 props 看起來只是開關，但背後其實分成兩類：一類是狀態色與可用性，一類是語意標籤包裹。

讀完後，要能判斷哪些能力應該用 class 表達，哪些能力應該用 HTML 語意標籤表達。

## 對照源碼

- `01-origin/source/view-ui-plus-v1.3.20/src/components/typography/props.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/typography/base.vue`
- `01-origin/source/view-ui-plus-v1.3.20/types/typography.d.ts`
- `01-origin/source/view-ui-plus-v1.3.20/src/styles/components/`

## 修飾分類

| 類型 | API | 實作方向 |
| --- | --- | --- |
| 狀態色 | `type` | 產生 `ivu-typography-*` class |
| 可用性 | `disabled` | 產生 disabled class 並影響互動語意 |
| 語意強調 | `strong`、`italic` | 用 `strong`、`i` 包裹 |
| 文本標記 | `underline`、`delete`、`mark` | 用 `u`、`del`、`mark` 包裹 |
| 技術文字 | `code`、`keyboard` | 用 `code`、`kbd` 包裹 |

狀態色通常交給 class，語意修飾則在 `wrapperDecorations()` 中改變內容節點結構。

## type 狀態色

`type` 支援：

- `secondary`
- `success`
- `warning`
- `danger`
- 空字串

這組值和 Alert、Message、Tag 等元件的狀態語意相似，但 Typography 裡只表示文字語氣，不代表有完整回饋流程。

閱讀時要注意：

- `props.js` 用 `oneOf` 做 runtime 驗證。
- `.d.ts` 也宣告相同 union。
- class 命名是 `ivu-typography-${type}`。
- 實際顏色要回到樣式系統確認。

## disabled

`disabled` 在 Typography 中至少有兩層意義：

1. 視覺上呈現不可用文字。
2. 互動上應該限制點擊、連結、複製或編輯。

閱讀源碼時要分開檢查「class 是否存在」和「互動是否真的被 guard」。只做 disabled class 並不等於所有操作都被禁止。

## wrapperDecorations

`wrapperDecorations()` 的設計是從基礎內容開始，一層一層包裹語意標籤：

```txt
content
  -> strong
  -> underline
  -> delete
  -> code
  -> mark
  -> keyboard
  -> italic
```

這表示多個修飾可以同時成立。閱讀時要注意包裹順序，因為最後產生的 DOM 會影響 CSS selector、可讀性與複製出來的文字。

## modelValue 與 slot 的差異

修飾內容來源有兩種：

- `modelValue`：明確字串，適合可編輯與受控內容。
- default slot：可以包含其他元件或 VNode，適合富文字片段。

當 `wrapperDecorations()` 處理 slot 時，內容可能不是純字串。後續如果要複製或編輯，`handleGetContent()` 會建立臨時 app 讀取 `innerText`，把 VNode 轉回純文字。

這是 Typography 的一個重要設計點：渲染可以是 VNode，但複製和編輯通常需要純文字。

## 樣式系統連動

文字修飾 props 本身不應硬編碼大量 style。合理分工是：

```txt
props
  -> class 或語意 tag
  -> less/scss 決定視覺
```

這樣做的好處是：

- 主題覆蓋集中在樣式系統。
- runtime 邏輯只決定狀態，不決定設計 token。
- `.d.ts` 可以清楚描述公開 API。

## 設計啟發

仿寫文字修飾元件時，可以用這幾條規則：

- 狀態色用有限 union，不要讓使用者任意傳色值。
- 強調、刪除、標記、鍵盤、程式碼優先用語意標籤。
- 多個修飾可同時存在時，要明確包裹順序。
- 修飾後仍要確認 copy、edit、ellipsis 取得的內容符合預期。
- disabled 要同時檢查樣式與互動，不只加 class。

## 複習題

1. `type` 和 `strong` 的實作方式為什麼不同？
2. `wrapperDecorations()` 為什麼不能只回傳字串？
3. 多個文字修飾同時存在時，包裹順序可能影響什麼？
4. `disabled` 只加 class 會留下哪些風險？
5. slot 內容在複製或編輯前為什麼需要轉成 `innerText`？
