# 14-typography-and-text

本目錄存放 View UI Plus 的文字與排版類內容分析。這一章不只看「文字長什麼樣子」，而是整理文字在元件庫裡如何承載語意、狀態、複製、編輯、省略、計數、時間與數字格式化。

建議在讀完基礎元件、表單輸入、資料展示與回饋浮層後進入本章，因為 Typography 家族會依賴 `Icon`、`Tooltip`、`Input`、`Copy`、全域配置、DOM 測量、resize 監聽與 TypeScript 宣告。

## 閱讀順序

| 順序 | 筆記 | 學習重點 |
| --- | --- | --- |
| 1 | [文字與排版類元件總覽](./01-typography-and-text-overview.md) | 建立本章分類、源碼入口、文字元件邊界與閱讀方法 |
| 2 | [Typography 家族架構](./02-typography-family-architecture.md) | 分析 TypographyBase 如何支撐 Title、Text、Paragraph、Link |
| 3 | [Title、Text、Paragraph 與 Link](./03-title-text-paragraph-link.md) | 比較標題、行內文字、段落與連結的語意差異 |
| 4 | [文字修飾與狀態樣式](./04-text-decoration-and-status.md) | 分析 type、disabled、strong、code、mark、keyboard 等語意修飾 |
| 5 | [可複製文字設計](./05-copyable-text-design.md) | 分析 copyable、copyText、copyConfig、圖示 slot 與複製事件 |
| 6 | [可編輯文字設計](./06-editable-text-design.md) | 分析 editable、editConfig、v-model、鍵盤事件與編輯生命週期 |
| 7 | [Typography 內建省略](./07-typography-ellipsis.md) | 分析 Typography 的 ellipsis、rows、tooltip、resize detector |
| 8 | [Ellipsis 元件與 line-clamp 指令](./08-ellipsis-component-and-line-clamp.md) | 對照獨立 Ellipsis 元件與 v-line-clamp 指令的取捨 |
| 9 | [WordCount、Time 與 Numeral](./09-word-count-time-numeral.md) | 整理文字計數、時間文字與數字格式化元件 |
| 10 | [文字排版 API 模式與檢查清單](./10-typography-api-patterns-and-checklist.md) | 建立仿寫文字類元件時的 API 與設計檢查流程 |

## 原始碼主線

主要對照這幾個位置：

- `01-origin/source/view-ui-plus-v1.3.20/src/components/typography/`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/ellipsis/`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/word-count/`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/time/`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/numeral/`
- `01-origin/source/view-ui-plus-v1.3.20/src/directives/line-clamp.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/copy/`
- `01-origin/source/view-ui-plus-v1.3.20/src/mixins/link.js`
- `01-origin/source/view-ui-plus-v1.3.20/examples/routers/typography.vue`
- `01-origin/source/view-ui-plus-v1.3.20/examples/routers/ellipsis.vue`
- `01-origin/source/view-ui-plus-v1.3.20/types/typography.d.ts`
- `01-origin/source/view-ui-plus-v1.3.20/types/ellipsis.d.ts`
- `01-origin/source/view-ui-plus-v1.3.20/types/word-count.d.ts`
- `01-origin/source/view-ui-plus-v1.3.20/types/time.d.ts`
- `01-origin/source/view-ui-plus-v1.3.20/types/numeral.d.ts`

## 本章邊界

本章聚焦文字內容本身的呈現與互動，不重複分析依賴元件的完整實作。

- `Tooltip` 的定位、transfer、theme 與浮層生命週期放在 `12-feedback-and-overlays/`；本章只說明文字省略為什麼需要 Tooltip。
- `Input` 的表單能力放在 `10-form-and-input-components/`；本章只分析 Typography 編輯狀態如何借用 textarea。
- `Circle` 的 SVG 與進度展示放在 `11-data-display-components/`；本章只分析 WordCount 的 circle 模式。
- `Time`、`Numeral` 雖然也可視為資料展示，但它們輸出的核心是可讀文字格式，所以放在本章。
- `v-line-clamp` 屬於指令系統，也可回看 `16-directives/`；本章從文字省略能力角度交叉整理。
- 真正的字體、字級、SCSS 變數與設計 token 放在 `17-style-system/`；本章只關心元件 API 如何觸發樣式。

## 學完後要能回答

- Typography 為什麼要抽出 `TypographyBase`，而不是讓 Title、Text、Paragraph、Link 各自實作？
- `modelValue`、slot 文字與 DOM `innerText` 在複製、編輯、省略時各自扮演什麼角色？
- `copyable` 如何組合 Copy 工具、Tooltip、圖示狀態與成功/失敗事件？
- `editable` 的 Enter、Esc、blur 與 `v-model` 更新順序如何設計？
- Typography 內建省略和獨立 Ellipsis 元件的能力差異是什麼？
- 為什麼 `ellipsisConfig` 裡有 `suffix`、`expandable`、`symbol`，但閱讀時不能直接假設它們已完整工作？
- Ellipsis 元件如何用 height、lines、length 和 fullWidthRecognition 控制裁切？
- `v-line-clamp` 指令適合什麼簡單場景，什麼場景需要 Ellipsis 或 Typography ellipsis？
- WordCount 如何把字數、溢出、slot 與 Circle 模式整合成一個文字輔助元件？
- Time 和 Numeral 如何把原始值轉為可讀文字，並暴露必要事件或方法？
