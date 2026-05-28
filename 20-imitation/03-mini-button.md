# Mini Button

Button 是基礎元件中最值得反覆拆解的案例。它看起來只是按鈕，但實際上會同時處理狀態樣式、原生屬性、loading、防重複點擊、icon、slot 與事件。

## 練習目標

- 練習把 props 映射成多組狀態 class。
- 練習 `loading` 與 `disabled` 對互動的影響。
- 練習 default slot、icon prop 與 Icon 元件組合。
- 練習保留原生 button 的基本語意。

## 對照源碼

主要對照：

- `src/components/button/`
- `src/components/icon/`
- `types/button.d.ts`
- `src/styles/components/button.less`

閱讀時關注：

- Button 有哪些 type、shape、size、htmlType。
- `loading` 是否會阻止 click。
- icon 與 default slot 如何排列。
- class 命名如何表達狀態。

## 最小實作範圍

仿寫一個 `MiniButton`：

- 支援 `type`：`default`、`primary`、`dashed`、`text`。
- 支援 `size`：`small`、`default`、`large`。
- 支援 `shape`：`default`、`circle`。
- 支援 `disabled`。
- 支援 `loading`。
- 支援 `icon`，搭配 `MiniIcon`。
- 支援 default slot。
- 點擊時 emit `click`。

先不實作：

- link mode。
- long、ghost、to、replace、target。
- 完整表單 disabled 注入。
- ripple 或複雜動效。

## API 設計

| 類型 | 名稱 | 說明 |
| --- | --- | --- |
| prop | `type?: 'default' \| 'primary' \| 'dashed' \| 'text'` | 視覺類型 |
| prop | `size?: 'small' \| 'default' \| 'large'` | 尺寸 |
| prop | `shape?: 'default' \| 'circle'` | 外形 |
| prop | `disabled?: boolean` | 禁用 |
| prop | `loading?: boolean` | 載入中 |
| prop | `icon?: string` | 前置 icon |
| prop | `htmlType?: 'button' \| 'submit' \| 'reset'` | 原生 button type |
| emit | `click(event: MouseEvent)` | 非 disabled/loading 時觸發 |
| slot | `default` | 按鈕文字或自訂內容 |

class 規則：

```text
mini-btn
mini-btn-${type}
mini-btn-${size}
mini-btn-${shape}
mini-btn-loading
mini-btn-disabled
mini-btn-icon-only
```

`mini-btn-icon-only` 只在有 icon 且沒有 default slot 時套用。

## 實作步驟

1. 建立 `MiniButton.vue`。
2. 定義 props、emits 與預設值。
3. 使用 `useSlots()` 判斷是否存在 default slot。
4. 建立 class computed。
5. click handler 中若 `disabled` 或 `loading`，直接 return。
6. loading 時顯示 loading icon，否則顯示 `icon` 指定的 icon。
7. 補上基本樣式：類型、尺寸、禁用、載入、icon spacing。

## 驗收案例

- `type="primary"` 時套用 primary class。
- `loading` 時顯示 loading icon，且點擊不 emit `click`。
- `disabled` 時原生 `disabled` 屬性為 true，且點擊不 emit `click`。
- 只有 `icon` 沒有文字時，套用 `mini-btn-icon-only`。
- `htmlType="submit"` 時，原生 button type 為 `submit`。

## 源碼反思

View UI Plus 的 Button 不只是樣式元件，它還要和表單、路由、Icon、ButtonGroup、全域 prefix class 一起工作。仿寫版先保留最常用的 button 行為，等 ButtonGroup 練習後再處理父子協作。

如果一開始就把 link、route、ghost、long 全部加進來，容易失去這篇的重點：掌握按鈕的 API 狀態矩陣與互動保護。
