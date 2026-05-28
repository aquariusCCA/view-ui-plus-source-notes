# Mini Tag、Badge、Avatar

Tag、Badge、Avatar 都屬於展示型小元件。它們不複雜，但很適合練習「相似元件如何共用設計語言，又保留各自語意」。

## 練習目標

- 練習顏色、尺寸、狀態 class 的一致設計。
- 練習 close、dot、count、fallback 這類小互動。
- 練習 slot fallback。
- 練習把多個小元件放在同一組設計規則下比較。

## 對照源碼

主要對照：

- `src/components/tag/`
- `src/components/badge/`
- `src/components/avatar/`
- `types/tag.d.ts`
- `types/badge.d.ts`
- `types/avatar.d.ts`
- `src/styles/components/tag.less`
- `src/styles/components/badge.less`
- `src/styles/components/avatar.less`

閱讀時關注：

- 三者如何處理 size。
- Tag 的 close 事件如何設計。
- Badge 的 count 與 dot 語意有何不同。
- Avatar 的 src、icon、slot fallback 優先順序。

## 最小實作範圍

仿寫三個元件：

`MiniTag`：

- 支援 `color`。
- 支援 `size`。
- 支援 `closable`。
- 支援 default slot。
- close 時 emit `close`。

`MiniBadge`：

- 支援 `count`。
- 支援 `dot`。
- 支援 `max`。
- 支援 default slot。

`MiniAvatar`：

- 支援 `src`。
- 支援 `icon`。
- 支援 `size`。
- 支援 default slot。
- 圖片失敗時 fallback 到 icon 或 slot。

先不實作：

- status badge。
- 動畫。
- Avatar group。
- 自動文字縮放。
- 完整預設色板。

## API 設計

`MiniTag`：

| 類型 | 名稱 | 說明 |
| --- | --- | --- |
| prop | `color?: string` | 預設色或自訂色 |
| prop | `size?: 'small' \| 'default' \| 'large'` | 尺寸 |
| prop | `closable?: boolean` | 是否可關閉 |
| emit | `close(event)` | 點擊關閉 |
| slot | `default` | 標籤內容 |

`MiniBadge`：

| 類型 | 名稱 | 說明 |
| --- | --- | --- |
| prop | `count?: number` | 數字 |
| prop | `dot?: boolean` | 小紅點 |
| prop | `max?: number` | 最大顯示值 |
| slot | `default` | 被標記內容 |

`MiniAvatar`：

| 類型 | 名稱 | 說明 |
| --- | --- | --- |
| prop | `src?: string` | 圖片 |
| prop | `icon?: string` | icon fallback |
| prop | `size?: 'small' \| 'default' \| 'large'` | 尺寸 |
| slot | `default` | 文字 fallback |

## 實作步驟

1. 先建立共用 size class 規則：`mini-${name}-${size}`。
2. 實作 `MiniTag`，處理 close icon 與 close event。
3. 實作 `MiniBadge`，計算 display count，`count > max` 時顯示 `${max}+`。
4. 實作 `MiniAvatar`，用 `imageError` 狀態控制圖片 fallback。
5. 建立展示範例，把三個元件放在同一頁比較。

## 驗收案例

- `MiniTag closable` 點擊關閉 icon 時 emit `close`，但不自動移除自己。
- `MiniBadge count={120} max={99}` 顯示 `99+`。
- `MiniBadge dot` 時不顯示 count 文字。
- `MiniAvatar src` 載入失敗後，改顯示 icon 或 default slot。
- 三個元件的 `size="small"` 都有一致的尺寸 class。

## 源碼反思

展示型小元件常被低估，但它們最能看出元件庫設計是否一致。View UI Plus 需要維持顏色、尺寸、狀態、slot fallback 和事件命名的一致性。

仿寫這組元件時，不要只做外觀。要練的是：同一套 API 思維如何落在不同語意的小元件上。
