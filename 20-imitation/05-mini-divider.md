# Mini Divider

Divider 是一個小但很適合訓練細節判斷的元件。它的視覺結果不只由 props 決定，也會因為 default slot 是否存在而改變。

## 練習目標

- 練習根據 slot presence 改變 class。
- 練習水平與垂直分隔線的結構差異。
- 練習 `orientation`、`dashed`、`plain` 這類純視覺 props。
- 練習讓簡單元件保持 API 精準。

## 對照源碼

主要對照：

- `src/components/divider/`
- `types/divider.d.ts`
- `src/styles/components/divider.less`

閱讀時關注：

- horizontal 與 vertical 使用同一個元件還是不同結構。
- 沒有 slot 時是否仍輸出文字容器。
- orientation 是否只在有文字時有效。
- plain 對文字樣式有什麼影響。

## 最小實作範圍

仿寫一個 `MiniDivider`：

- 支援 `type`：`horizontal`、`vertical`。
- 支援 `orientation`：`left`、`center`、`right`。
- 支援 `dashed`。
- 支援 `plain`。
- 支援 default slot。
- 有 default slot 時顯示文字。
- 沒有 default slot 時只顯示線。

先不實作：

- orientation margin 自訂。
- 所有排版細節。
- RTL。
- 文字過長的完整處理。

## API 設計

| 類型 | 名稱 | 說明 |
| --- | --- | --- |
| prop | `type?: 'horizontal' \| 'vertical'` | 分隔線方向 |
| prop | `orientation?: 'left' \| 'center' \| 'right'` | 文字位置，只對 horizontal 有效 |
| prop | `dashed?: boolean` | 是否虛線 |
| prop | `plain?: boolean` | 文字是否使用普通樣式 |
| slot | `default` | 分隔線文字 |

class 規則：

```text
mini-divider
mini-divider-horizontal
mini-divider-vertical
mini-divider-with-text
mini-divider-with-text-left
mini-divider-with-text-center
mini-divider-with-text-right
mini-divider-dashed
mini-divider-plain
```

## 實作步驟

1. 建立 `MiniDivider.vue`。
2. 用 `useSlots()` 判斷是否有 default slot。
3. 建立 class computed。
4. template 中 vertical 只輸出根節點。
5. horizontal 且有 slot 時，輸出文字容器。
6. 補上基本 CSS：水平線、垂直線、虛線、文字左右線段。

## 驗收案例

- 預設輸出 horizontal divider。
- 沒有 default slot 時，不應該出現文字容器。
- 有 default slot 且 `orientation="left"` 時，套用 left class。
- `type="vertical"` 時，不顯示 slot 文字。
- `dashed` 時線條使用 dashed border。

## 源碼反思

Divider 的重點是「不用多餘 props 表達可從 slot 推導的狀態」。是否有文字，不需要使用者傳 `withText`，元件可以自己從 slot 判斷。

這種設計很常見：元件 API 越少，越要善用 Vue 提供的結構資訊，例如 slots、attrs、provide/inject 與子元件註冊。
