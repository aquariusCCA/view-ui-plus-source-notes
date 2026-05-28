# List 與 ListItem

## 學習目標

這篇分析 `List`、`ListItem`、`ListItemMeta` 如何組合列表資料。重點是列表容器不直接管理 data，而是透過 slot 讓使用者控制 item 結構；元件本身只負責 layout、loading、header/footer、action、extra 與 meta 的固定語意。

## 對照源碼

- `01-origin/source/view-ui-plus-v1.3.20/src/components/list/list.vue`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/list/list-item.vue`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/list/list-item-meta.vue`
- `01-origin/source/view-ui-plus-v1.3.20/types/list.d.ts`

## 元件定位

| 元件 | 角色 |
| --- | --- |
| `List` | 列表容器，處理尺寸、邊框、分割線、header、footer、loading |
| `ListItem` | 單筆資料容器，處理 action、extra 和 horizontal/vertical layout |
| `ListItemMeta` | 常見列表資訊區塊，組合 avatar、title、description |

`List` 透過 `provide` 提供 `ListInstance`，讓 `ListItem` 能讀取父層 `itemLayout`。

## List 不接收 data

和 Table 不同，List 沒有 `data` prop。它的資料結構完全由 default slot 決定：

```vue
<List>
  <ListItem v-for="item in data" :key="item.id">
    ...
  </ListItem>
</List>
```

這個選擇讓 List 不需要設計 columns、render、rowKey、filter、sort 等 API。它只提供穩定的列表外殼，資料如何迭代交給使用者。

## Props 與 class

| prop | 用途 |
| --- | --- |
| `border` | 是否顯示外框 |
| `itemLayout` | `horizontal` 或 `vertical` |
| `header` | 簡單 header 文字，可被 slot 覆蓋 |
| `footer` | 簡單 footer 文字，可被 slot 覆蓋 |
| `loading` | 是否顯示固定 Spin |
| `size` | `small`、`large`、`default` |
| `split` | 是否顯示項目分割線 |

class 由尺寸、layout 和狀態組成：

```txt
ivu-list
ivu-list-default / ivu-list-small / ivu-list-large
ivu-list-horizontal / ivu-list-vertical
ivu-list-bordered
ivu-list-split
```

## Header、Footer 與 Loading

header/footer 都採用 prop + slot fallback：

```txt
slot header > header prop
slot footer > footer prop
```

loading 使用 `Spin fix size="large"`，並把自訂內容放進 `spin` slot。

這裡有一個型別對照重點：runtime slot 名稱是 `spin`，但 `types/list.d.ts` 的 slot 名稱寫成 `loading`。這會造成使用者照型別提示寫 slot 時，和實際 runtime 不一致。

## ListItem layout

`ListItem` 根據父層 `itemLayout` 和是否存在 `extra` slot 決定 DOM：

| 條件 | 結構 |
| --- | --- |
| `vertical` 且有 `extra` | default/action 包在 main，extra 另放右側或下方區塊 |
| 其他情況 | default、action、extra 平鋪在 item 中 |

`isFlexMode` 會根據 layout、extra 和 default slot 是否含文字節點推導是否加上：

```txt
ivu-list-item-no-flex
```

這表示 ListItem 的 layout 並不只由 prop 決定，也受到 slot 內容形態影響。

## ListItemMeta

`ListItemMeta` 是列表常見資訊密度的封裝：

| 區塊 | prop | slot |
| --- | --- | --- |
| avatar | `avatar` | `avatar` |
| title | `title` | `title` |
| description | `description` | `description` |

avatar prop 會渲染：

```vue
<Avatar :src="avatar" />
```

這讓 List 和 Avatar 形成常見組合：列表資料中的人、團隊、文件或項目，可以用 `ListItemMeta` 固定資訊層級。

## Slots 模式

| 元件 | slot | 用途 |
| --- | --- | --- |
| `List` | default | 所有 `ListItem` |
| `List` | header | 自訂列表頭部 |
| `List` | footer | 自訂列表底部 |
| `List` | spin | 自訂 loading 內容 |
| `ListItem` | default | 主要內容 |
| `ListItem` | action | 操作列表 |
| `ListItem` | extra | 額外內容，例如縮圖、統計、狀態 |
| `ListItemMeta` | avatar/title/description | 覆蓋 meta 各區塊 |

List 是典型 slot first 元件。它把資料迭代權交給使用者，自己只約束視覺語意。

## Runtime 與型別對照

| 項目 | 觀察 |
| --- | --- |
| `List` loading slot | runtime 使用 `spin`，型別宣告為 `loading` |
| `ListItem` default slot | runtime 支援 default slot，但型別只列 `action` 和 `extra` |
| `itemLayout` | runtime validator 收窄成 `horizontal | vertical`，型別寫 string |
| `size` | runtime validator 收窄成 `small | large | default`，型別寫 string |

## 設計啟發

List 的價值在於「適度抽象」。如果元件提供 data prop、render item、pagination、selection，很快就會變成另一個 Table。View UI Plus 的 List 選擇只封裝列表外觀與 item layout，讓使用者保留資料結構自由度。

適合用 List 的場景：

```txt
資料每筆長得不完全一樣
內容以文字、摘要、縮圖、操作為主
不需要欄位對齊
不需要內建排序篩選
```

## 複習題

1. List 為什麼不設計 `data` prop？
2. `itemLayout="vertical"` 時，`extra` slot 會如何改變 DOM 結構？
3. `ListItemMeta` 為什麼要內建 Avatar？
4. List 的 loading slot 在 runtime 和型別中有什麼不一致？
5. 什麼場景應該用 Table，而不是用 List？
