# Tree 樹

## 學習目標

這篇分析 `Tree` 和 `TreeNode` 如何呈現階層資料。重點是 `flatState`、父子勾選同步、半選狀態、單選/多選、非同步載入、自訂渲染、節點右鍵選單與事件 payload。

## 對照源碼

- `01-origin/source/view-ui-plus-v1.3.20/src/components/tree/tree.vue`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/tree/node.vue`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/tree/render.js`
- `01-origin/source/view-ui-plus-v1.3.20/types/tree.d.ts`

## 元件定位

| 元件 | 角色 |
| --- | --- |
| `Tree` | 根節點，保存 `stateTree`、`flatState`、右鍵選單狀態與公開方法 |
| `TreeNode` | 遞迴節點，渲染箭頭、checkbox、title、custom render 與 children |
| `Render` | 包裝 render function，傳入 root、node、data |

`Tree` 透過 `provide` 暴露 `TreeInstance`，讓所有遞迴的 `TreeNode` 都能把 select、check、expand、contextmenu 行為回傳給根節點處理。

## 資料結構

Tree 接收巢狀 `data`，但會編譯成 `flatState`：

```txt
data
  -> stateTree
  -> flatState[nodeKey] = {
       node,
       nodeKey,
       parent,
       childrenKey: [childNodeKey...]
     }
```

`compileFlatState()` 會替每個節點寫入 `nodeKey`，並記錄 parent/children 關係。這讓勾選狀態可以往上找父節點，也可以往下更新子節點。

## Props 與互動語意

| prop | 用途 |
| --- | --- |
| `data` | 巢狀節點資料 |
| `multiple` | select 是否允許多選 |
| `showCheckbox` | 是否顯示 checkbox |
| `checkStrictly` | 勾選時父子節點是否互不影響 |
| `checkDirectly` | showCheckbox 模式下，點 title 是否轉成 check 行為 |
| `childrenKey` | 自訂子節點欄位，預設 `children` |
| `loadData` | 非同步載入子節點 |
| `render` | 全域自訂節點渲染 |
| `selectNode` | 點 title 是否選中節點 |
| `expandNode` | 點 title 是否展開節點，優先於 `selectNode` |
| `autoCloseContextmenu` | 點右鍵選單項後是否自動關閉 |

`expandNode` 和 `selectNode` 是互斥語意。`TreeNode.handleClickNode()` 會先判斷 `expandNode`，再判斷 `selectNode`。

## 選中狀態

`handleSelect(nodeKey)` 會找到 `flatState[nodeKey].node`，再切換 `selected`。

非多選模式會先找出目前 selected 的節點並清掉：

```txt
multiple=false
  -> reset previous selected
  -> toggle current node.selected
  -> emit on-select-change
```

事件 payload：

```txt
on-select-change -> (selectedNodes, node)
```

`getSelectedNodes()` 是公開方法，會從 `flatState` 過濾 `node.selected`。

## 勾選與半選

`handleCheck({ checked, nodeKey })` 會先更新目前節點：

```txt
node.checked = checked
node.indeterminate = false
```

接著分成兩個方向：

| 方向 | 方法 | 說明 |
| --- | --- | --- |
| 向上 | `updateTreeUp(nodeKey)` | 根據兄弟節點計算父節點 checked/indeterminate |
| 向下 | `updateTreeDown(node, changes)` | 將 checked/indeterminate 同步到所有子節點 |

`checkStrictly` 為 true 時，父子節點互不聯動，這兩個方法都會提早返回。

事件 payload：

```txt
on-check-change -> (checkedNodes, node)
```

Tree 另有 `getCheckedAndIndeterminateNodes()`，適合需要同時取出半選節點的業務場景。

## TreeNode 渲染

TreeNode 的可見結構：

```txt
arrow / loading icon
checkbox
title
children collapse
```

title 的渲染優先順序：

```txt
data.render
  -> Tree.render
  -> data.title
```

`render.js` 傳入的 params：

```txt
{
  root: flatState,
  node: currentFlatStateNode,
  data: currentNodeData
}
```

這讓使用者能自訂節點內容，同時保留對整棵樹狀態的存取能力。

## 展開與非同步載入

TreeNode 的箭頭由 `showArrow` 控制。若有 children，或節點帶有 `loading` 欄位且不在 loading 中，就會顯示箭頭。

`handleExpand()` 的流程：

1. 標記 `appearByClickArrow`，讓點擊展開時有 transition。
2. 如果 children 為空且根 Tree 有 `loadData`，先把 `data.loading` 設為 true。
3. 呼叫 `loadData(item, callback)`。
4. callback 有 children 時寫回 `data[childrenKey]`。
5. nextTick 後再次展開。
6. 切換 `data.expand`，並呼叫 `TreeInstance.handleToggleExpand(data)`。

事件 payload：

```txt
on-toggle-expand -> node
```

## 右鍵選單

只有節點資料有 `contextmenu` 時，TreeNode 才會阻止原生右鍵選單並交給 Tree 處理。

Tree 會根據 tree wrapper 的 bounding rect 計算相對座標：

```txt
on-contextmenu -> (data, event, position)
```

右鍵選單內容由 `contextMenu` slot 提供，浮層由 `Dropdown trigger="custom"` 負責。

## Runtime 與型別對照

| 項目 | 觀察 |
| --- | --- |
| `data` | runtime 會直接在節點上寫入 `nodeKey`、`checked`、`indeterminate`、`expand`、`loading` 等欄位 |
| `childrenKey` | runtime 支援自訂 children key，型別的 `TreeChildConfig` 仍主要描述 `children` |
| methods | runtime 有 `getSelectedNodes`、`getCheckedNodes`、`getCheckedAndIndeterminateNodes`，型別沒有清楚描述 instance method |
| render params | runtime 傳 `{ root, node, data }`，型別只寫 `Function` |
| context menu | runtime 需要節點上有 `contextmenu` 才啟用，型別有描述節點欄位 |

## 設計啟發

Tree 的關鍵不是遞迴 template，而是資料索引。只靠巢狀資料也能渲染，但勾選、半選、查父節點、查子節點、取得已選資料都會變得麻煩。

比較穩定的設計是：

```txt
巢狀資料負責渲染
flatState 負責狀態查找
根元件負責 select/check/expand/contextmenu
節點元件只負責觸發互動
```

## 複習題

1. Tree 為什麼要把巢狀資料編譯成 `flatState`？
2. `checkStrictly` 會改變哪兩個方向的狀態更新？
3. `checkDirectly` 會改變 title click 的語意，這對使用者體驗有什麼影響？
4. Tree 的自訂 render 為什麼要同時傳 root、node 和 data？
5. 右鍵選單為什麼要把 position 一起 emit 出去？
