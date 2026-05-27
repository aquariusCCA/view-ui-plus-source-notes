# Tabs 與 TabPane

## 學習目標

這篇分析 `Tabs` 和 `TabPane` 如何形成頁籤導航。重點是 pane 註冊、`modelValue` 同步、tab bar 位置計算、可關閉頁籤、滾動導航、鍵盤操作、右鍵選單與拖曳事件。

## 對照源碼

- `src/components/tabs/tabs.vue`
- `src/components/tabs/pane.vue`
- `types/tabs.d.ts`
- `src/styles/components/tabs.less`

## 元件定位

`Tabs` 是狀態中心，保存 `activeKey`、`focusedKey`、`navList`、`paneList`、ink bar 尺寸與滾動狀態。`TabPane` 是內容節點，mounted 後註冊到父層，並用自己的 props 產生 nav item。

```txt
TabPane props
  -> Tabs.paneList
  -> Tabs.getTabs()
  -> Tabs.navList
  -> tab header + active content
```

## Props 與狀態

| 元件 | props | 影響 |
| --- | --- | --- |
| `Tabs` | `modelValue` | 目前 active key，可用 `v-model` |
| `Tabs` | `type`、`size`、`animated` | 決定 tab 外觀與內容切換動畫 |
| `Tabs` | `closable`、`beforeRemove` | 控制 card tab 是否可關閉與關閉前攔截 |
| `Tabs` | `name` | 巢狀 Tabs 時篩選對應 `TabPane.tab` |
| `Tabs` | `draggable`、`autoCloseContextmenu` | 控制拖曳與右鍵選單行為 |
| `TabPane` | `name`、`label`、`icon`、`disabled`、`closable` | 轉成 nav item |
| `TabPane` | `tab`、`index`、`contextMenu` | 支援巢狀、條件渲染排序與右鍵選單 |

`Tabs` 內部用 `activeKey` mirror `modelValue`，watch `modelValue` 時同步 `activeKey` 和 `focusedKey`。

## Pane 註冊與排序

`TabPane` mounted 時呼叫 `addPane()`，把 `{ id, pane }` 加入 `Tabs.paneList`，再呼叫 `updateNav()`。

`Tabs.getTabs()` 會：

1. 從 `paneList` 取出 pane 實例。
2. 若 `Tabs.name` 存在，只保留 `pane.tab === Tabs.name` 的項目。
3. 若 pane 設定 `index`，用 `index` 排序，解決 `v-if` 導致渲染順序不穩定的問題。

`updateNav()` 會把 pane 轉成 `navList`，並在第一個 pane 上補預設 active key。

## 切換與事件

點擊 tab 時，`handleChange(index)` 會：

1. 避免 transition 期間重複切換。
2. 忽略不存在或 disabled 的 nav。
3. 更新 `activeKey`。
4. emit `update:modelValue` 和 `on-click`。

`activeKey` watch 會更新 `focusedKey`、ink bar、pane 顯示狀態、內部 Table 可見狀態，並在 nextTick 後把 active tab 滾進可視區。

## 可關閉、右鍵與拖曳

`showClose(item)` 只有在 `type="card"` 時才會顯示 close icon。關閉前如果有 `beforeRemove`，支援 Promise；完成後才呼叫 `handleRemoveTab()`。

關閉 active tab 時，會優先選右側第一個非 disabled tab，否則選左側最後一個非 disabled tab，再沒有就退到第一個 tab。

右鍵選單由內部 `Dropdown trigger="custom"` 承擔。只有 `TabPane.contextMenu` 為 true 的 nav 才會打開 context menu，並 emit `on-contextmenu`。

拖曳只負責 emit `on-drag-drop`，回傳 dragName、dropName、原索引、目標索引與新的 name 順序；實際重排資料由使用者完成。

## DOM 測量

Tabs 需要讀 DOM 來處理兩件事：

| 功能 | DOM 依賴 |
| --- | --- |
| ink bar | 讀 active tab 的 `offsetWidth` 與前面 tab 的寬度累加 |
| nav scroll | 比較 `nav.offsetWidth` 和 `navScroll.offsetWidth`，計算 translateX |

mounted 時會建立 `element-resize-detector` 監聽 nav wrap 尺寸。如果 Tabs 起初在 `display: none` 的父層中，會用 `MutationObserver` 等父層顯示後再更新 bar。

## Slots 與 Class

| slot | 用途 |
| --- | --- |
| `default` | 放置 `TabPane` |
| `extra` | 顯示在 nav 右側 |
| `contextMenu` | 右鍵選單內容，通常放 `DropdownItem` |

主要 class 包括 `ivu-tabs`、`ivu-tabs-card`、`ivu-tabs-mini`、`ivu-tabs-tab-active`、`ivu-tabs-tab-disabled`、`ivu-tabs-ink-bar`、`ivu-tabs-content-animated`。

## Runtime 與型別對照

| 項目 | 觀察 |
| --- | --- |
| `modelValue` | runtime 支援 `String` 或 `Number`，型別只寫 string |
| `TabPane.name` | runtime 只寫 `String`，但未命名時會用 index number 當 fallback |
| `on-dblclick` | runtime emits 有 `on-dblclick`，型別未描述 |
| `update:modelValue` | runtime emits 有宣告，型別檔未明確寫事件 |
| close icon 全域設定 | runtime 讀 `globalConfig.tabs`，型別不會呈現這層能力 |

## 設計啟發

Tabs 是典型的「子元件描述資料，父元件統一渲染導航」模式。`TabPane` 不自己渲染 tab header，而是把 label、icon、disabled、closable 等資訊交給父層，由 `Tabs` 統一控制順序、active、滾動與事件。

這種模式適合需要集中管理焦點、鍵盤、測量與動畫的元件。

## 複習題

1. `TabPane` 為什麼要註冊到 `Tabs.paneList`？
2. `activeKey` watch 觸發了哪些 UI 更新？
3. 關閉 active tab 時，新的 active key 如何決定？
4. `index` prop 解決了哪種渲染順序問題？
5. Tabs 為什麼需要 `element-resize-detector` 和 `MutationObserver`？
