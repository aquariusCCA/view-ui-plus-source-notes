# 07-basic-components

本目錄存放 View UI Plus 的基礎元件分析。這裡的「基礎」不是指不重要，而是指它們通常不持有複雜業務狀態，主要負責把 props、slots、events、class、style 和少量共用邏輯轉成穩定的 UI 能力。

建議先從這一章開始讀單一元件，因為 Button、Icon、Divider、Tag、Badge、Avatar 這類元件能用最小成本看懂一套元件庫的常見設計模式。

## 閱讀順序

| 順序 | 筆記 | 學習重點 |
| --- | --- | --- |
| 1 | [基礎元件總覽](./01-basic-components-overview.md) | 建立低複雜度、高復用元件的分類與閱讀方法 |
| 2 | [Icon 元件分析](./02-icon.md) | 分析圖示元件如何把 `type`、`custom`、`size`、`color` 映射成 class 與 inline style |
| 3 | [Button 與 ButtonGroup](./03-button-and-button-group.md) | 拆解按鈕的 props、loading、icon、slot、link mixin、form disabled 與群組樣式 |
| 4 | [Divider 元件分析](./04-divider.md) | 分析分隔線如何透過 slot presence、orientation、dashed、plain 組合 class |
| 5 | [Tag、Badge、Avatar](./05-tag-badge-avatar.md) | 比較狀態展示型小元件如何處理顏色、尺寸、事件、fallback 與 slot |
| 6 | [基礎元件 API 模式](./06-basic-component-api-patterns.md) | 總結 Props、Emits、Slots、class naming、validator 與 `.d.ts` 對照模式 |
| 7 | [基礎元件設計檢查清單](./07-basic-component-design-checklist.md) | 整理仿寫小元件時可重複使用的設計檢查流程 |

## 原始碼主線

主要對照這幾個位置：

- `01-origin/source/view-ui-plus-v1.3.20/src/components/icon/`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/button/`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/divider/`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/tag/`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/badge/`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/avatar/`
- `01-origin/source/view-ui-plus-v1.3.20/types/`
- `01-origin/source/view-ui-plus-v1.3.20/src/styles/components/`

## 本章邊界

本章只分析低複雜度且高復用的基礎 UI 元件。

- Grid、Layout、Card、Space 放在 `08-layout-and-containers/`。
- Menu、Tabs、Breadcrumb、Dropdown 放在 `09-navigation-components/`。
- Input、Select、Checkbox、Radio、Upload 放在 `10-form-and-input-components/`。
- Table、Tree、List、Timeline 放在 `11-data-display-components/`。
- Modal、Drawer、Tooltip、Message、Notice 放在 `12-feedback-and-overlays/`。

## 學完後要能回答

- 為什麼 Icon 這種元件幾乎沒有互動，仍然需要清楚的 props 與型別宣告？
- Button 如何把「原生 button」、「可跳轉連結」、「載入狀態」、「圖示按鈕」放在同一個公開 API 下？
- Divider 如何根據是否存在 default slot 改變 class，而不是新增額外 prop？
- Tag、Badge、Avatar 這類展示元件如何處理預設色、自訂色、slot fallback 與事件？
- 如何從 `.vue` 實作、`types/*.d.ts` 和 less class 一起判斷一個基礎元件的完整契約？
