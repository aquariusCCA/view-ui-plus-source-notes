# Title、Text、Paragraph 與 Link

## 學習目標

這篇比較 Typography 家族中四個主要公開元件：`Title`、`Text`、`Paragraph`、`Link`。它們共享同一套文字能力，但語意、預設標籤與使用場景不同。

讀完後，要能判斷何時應該使用標題、段落、行內文字或文字連結，而不是只用 `div` 和 class 拼出效果。

## 對照源碼

- `01-origin/source/view-ui-plus-v1.3.20/src/components/typography/title.vue`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/typography/text.vue`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/typography/paragraph.vue`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/typography/link.vue`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/typography/base.vue`
- `01-origin/source/view-ui-plus-v1.3.20/src/mixins/link.js`
- `01-origin/source/view-ui-plus-v1.3.20/types/typography.d.ts`

## 元件語意

| 元件 | 典型 tag | 使用場景 | 主要差異 |
| --- | --- | --- | --- |
| `Title` | `h1` 到 `h5` | 頁面、區塊、卡片標題 | 有 `level`，需要形成資訊層級 |
| `Text` | `span` | 行內文字、狀態文字、短片段 | 不打斷文流，適合嵌入段落或表格 |
| `Paragraph` | `div` 或段落容器 | 長文字、多行內容、可編輯段落 | 常搭配 ellipsis、copyable、editable |
| `Link` | `a` | 導航、外部連結、路由連結 | 額外支援 link mixin 與點擊跳轉 |

這四個元件的差異不是「樣式名稱不同」，而是內容在文件結構與互動語意中的角色不同。

## Title

`Title` 的核心是 `level`。使用者傳入 `level` 後，元件應該能產生對應的標題層級與 class。

閱讀時要注意：

- `.d.ts` 宣告 `level` 支援 `1 | 2 | 3 | 4 | 5`。
- examples 中出現 `level="6"`，但型別契約沒有把 6 視為正式支援值。
- `Title` 仍能使用 copy、edit、ellipsis 等共用能力。
- 編輯模式下，標題層級仍會影響 class，例如 `ivu-typography-h*`。

設計標題元件時，不應只追求字體大小，也要維持文件層級與可讀性。

## Text

`Text` 適合短文字或行內狀態，例如：

- 表格欄位中的狀態文字。
- 段落中的 code、mark、strong 片段。
- 和其他 inline 元素混排的內容。
- 單行省略搭配固定寬度容器。

`Text` 的風險是容易被拿來承載過長段落。如果內容需要多行、可編輯或明確段落間距，通常應該使用 `Paragraph`。

## Paragraph

`Paragraph` 是 Typography 家族中最常搭配進階能力的元件：

- 長文字複製。
- 多行文字編輯。
- 多行省略與 Tooltip。
- 內容說明、詳情描述、可讀文字區塊。

閱讀 `examples/routers/typography.vue` 時，`Paragraph` 覆蓋了大多數 copy、edit、ellipsis 案例，因為這些行為更容易在長內容中成立。

## Link

`Link` 的特殊之處在於它不是單純的文字樣式，而是會處理跳轉語意。

需要追蹤：

- `to` 是否存在，決定是否走 href/router 模式。
- `target`、`replace`、`append` 等 link mixin 能力。
- `handleClickContent()` 如何在文字編輯與連結點擊之間分流。
- ctrl/meta click 是否被視為新視窗開啟意圖。
- `disabled` 時是否應阻止跳轉。

`Link` 仍繼承 copy、edit、ellipsis，但實務上要小心：可編輯連結和可點擊連結都使用 click 作為入口時，互動衝突會變多。

## 選型原則

可以用這個順序判斷：

```txt
內容是頁面或區塊標題
  -> Title

內容是多行說明或段落
  -> Paragraph

內容會導向其他位置
  -> Link

內容只是行內片段或狀態文字
  -> Text
```

如果只是想要顏色、粗體或刪除線，優先使用這些元件的修飾 props，而不是額外包一層無語意 DOM。

## 複習題

1. `Title` 的 `level` 除了字級外，還代表什麼語意？
2. `Text` 和 `Paragraph` 的使用邊界是什麼？
3. `Link` 為什麼需要和一般文字 click 行為分流？
4. 為什麼可編輯連結是需要謹慎設計的互動？
5. examples 和 `.d.ts` 不一致時，筆記應該如何標註？
