# Cascader、TreeSelect 與 Transfer

## 學習目標

這篇分析複合選擇元件如何處理階層資料、樹節點與左右穿梭。重點是資料結構、選中集合、filter、顯示文字、半選/禁用狀態與事件 payload。

## 對照源碼

- `01-origin/source/view-ui-plus-v1.3.20/src/components/cascader/`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/tree-select/tree-select.vue`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/transfer/`
- `01-origin/source/view-ui-plus-v1.3.20/types/cascader.d.ts`
- `01-origin/source/view-ui-plus-v1.3.20/types/tree-select.d.ts`
- `01-origin/source/view-ui-plus-v1.3.20/types/transfer.d.ts`

## Cascader

`Cascader` 把一條階層路徑轉成 array value：

| 狀態 | 說明 |
| --- | --- |
| `data` | 階層選項資料 |
| `modelValue` | 外部選中的 value path |
| `currentValue` | 內部路徑值 |
| `selected` | 選中的節點物件路徑 |
| `query` | filter 查詢字串 |
| `querySelections` | 搜尋結果路徑 |

`Caspanel` 和 `Casitem` 透過 provide/inject 協作，依 hover 或 click 展開下一層。`changeOnSelect` 允許非葉節點也提交。

## TreeSelect

`TreeSelect` 是 Select 和 Tree 的組合：

- 外層用 Select 顯示目前值與下拉。
- 下拉內部使用 Tree 呈現節點。
- 單選時節點 select 會同步 `currentValue`。
- 多選或 checkbox 模式會處理 checked 節點集合。
- 清空時 emit `update:modelValue` 與 `on-change`。

Tree 本體偏資料展示，本篇只看它被包裝成表單選擇器時的值流。

## Transfer

`Transfer` 不使用 `modelValue`，而是以 `targetKeys` 表示右側資料：

| 狀態 | 說明 |
| --- | --- |
| `data` | 全部候選項 |
| `targetKeys` | 已移到右側的 key |
| `leftData` / `rightData` | 依 targetKeys 分割後的資料 |
| `leftCheckedKeys` / `rightCheckedKeys` | 兩側目前勾選項 |
| `filterMethod` | 搜尋過濾 |

移動時會 emit `on-change(newTargetKeys, direction, moveKeys)`；勾選改變則 emit `on-selected-change(sourceSelectedKeys, targetSelectedKeys)`。

## 複合選擇的共同模式

| 模式 | 元件 |
| --- | --- |
| 顯示值和提交值分離 | Cascader、TreeSelect |
| 選中節點物件和 value 分離 | Cascader、TreeSelect |
| filter query 不等於提交值 | Cascader、Transfer |
| disabled item 不能被提交或移動 | 三者皆有 |
| 事件 payload 包含值和原始資料 | Cascader、Transfer |

## 設計啟發

複合選擇元件最怕資料來源和選中集合互相污染。應明確分層：

```txt
原始資料 data
  -> 可見資料 filtered/render tree
  -> 互動狀態 selected/checked
  -> 對外提交 value/targetKeys
```

不要把顯示節點物件直接當作公開值，否則資料更新、遠端載入或 disabled 狀態都會變得難維護。

## 複習題

1. Cascader 的 `currentValue` 和 `selected` 有什麼差異？
2. `changeOnSelect` 會改變什麼提交時機？
3. TreeSelect 為什麼是本章內容，而 Tree 本體放在資料展示章？
4. Transfer 的 `targetKeys` 為什麼比 `modelValue` 更貼近元件語意？
5. `on-change` payload 為什麼需要包含 direction 和 moveKeys？
