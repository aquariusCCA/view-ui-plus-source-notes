# Timeline 時間軸

## 學習目標

這篇分析 `Timeline` 和 `TimelineItem`。它們是低狀態資料展示元件，重點不是複雜資料處理，而是如何用很小的 API 表達時間序列、節點狀態、待完成節點與自訂 dot。

## 對照源碼

- `01-origin/source/view-ui-plus-v1.3.20/src/components/timeline/timeline.vue`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/timeline/timeline-item.vue`
- `01-origin/source/view-ui-plus-v1.3.20/types/timeline.d.ts`

## 元件定位

| 元件 | 角色 |
| --- | --- |
| `Timeline` | 根容器，提供 `pending` class |
| `TimelineItem` | 單個時間節點，處理顏色、dot slot 與內容 slot |

Timeline 不管理資料，也不註冊子項。時間軸順序完全由 default slot 的 `TimelineItem` 順序決定。

## Timeline props

| prop | 用途 |
| --- | --- |
| `pending` | 指定最後節點為待完成樣式 |

`pending` 只轉成 class：

```txt
ivu-timeline-pending
```

這是低狀態元件的典型設計：元件不推導業務流程，只提供樣式語意。

## TimelineItem props

| prop | 用途 |
| --- | --- |
| `color` | 節點顏色，預設 `blue` |

內建顏色：

```txt
blue
red
green
```

內建顏色走 class：

```txt
ivu-timeline-item-head-blue
ivu-timeline-item-head-red
ivu-timeline-item-head-green
```

自訂顏色走 inline style：

```txt
color
border-color
```

這和 Tag、Badge、Progress 的顏色策略一致：主題色交給 class，自訂色交給 inline style。

## Dot slot

`TimelineItem` 有 `dot` slot：

```vue
<TimelineItem>
  <template #dot>...</template>
  content
</TimelineItem>
```

元件在 mounted 後用 `$refs.dot.innerHTML.length` 判斷 dot slot 是否有內容，若有則加上：

```txt
ivu-timeline-item-head-custom
```

這裡的設計重點是 slot presence 會改變 class。自訂 dot 不只是插入內容，也會改變節點頭部的樣式模式。

## DOM 結構

每個 TimelineItem 大致輸出：

```txt
li.ivu-timeline-item
  div.ivu-timeline-item-tail
  div.ivu-timeline-item-head
  div.ivu-timeline-item-content
```

tail、head、content 分開，讓線條、節點與內容能獨立控制。

## Runtime 與型別對照

| 項目 | 觀察 |
| --- | --- |
| `color` | runtime 接受任意 string，型別寫 `blue | red | green | string`，和實作一致 |
| `dot` slot | runtime 支援，型別有列 |
| default slot | runtime 支援，型別有列在 `TimelineItem` |
| `Timeline` default slot | runtime 支援，但型別沒有明確列 default slot |

## 設計啟發

Timeline 說明一個重要原則：不是所有資料展示元件都需要 data API。對時間軸來說，使用者常需要在節點內容中放文字、連結、Tag、Avatar、圖片或按鈕。如果強行設計成 `data + renderItem`，API 反而更重。

低狀態展示元件的設計方向：

```txt
容器只提供整體語意
子項只提供必要變體
內容交給 default slot
特殊視覺節點交給具名 slot
```

## 複習題

1. Timeline 為什麼不需要像 Tree 一樣註冊子節點？
2. `pending` 為什麼只需要 class，而不需要內部狀態？
3. TimelineItem 的內建顏色和自訂顏色分別走什麼路徑？
4. dot slot presence 為什麼會影響 class？
5. 什麼情境下 Timeline 應該維持 slot API，而不是增加 data API？
