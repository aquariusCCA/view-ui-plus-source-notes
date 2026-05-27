# Dropdown、DropdownMenu 與 DropdownItem

## 學習目標

這篇分析 `Dropdown`、`DropdownMenu`、`DropdownItem` 如何形成命令選單。重點是 trigger 模式、visible 狀態、浮層更新、click outside、巢狀 dropdown，以及 item 點擊事件如何往外傳。

## 對照源碼

- `src/components/dropdown/dropdown.vue`
- `src/components/dropdown/dropdown-menu.vue`
- `src/components/dropdown/dropdown-item.vue`
- `types/dropdown.d.ts`
- `src/styles/components/dropdown.less`

## 元件定位

`Dropdown` 是浮層控制器，包住 trigger 區域與 list slot。實際浮層使用 `select/dropdown.vue` 的 `Drop` 元件。`DropdownMenu` 只提供 `<ul>` 容器，`DropdownItem` 負責狀態 class 和點擊通知。

```txt
trigger slot click/hover/contextmenu
  -> Dropdown.currentVisible
  -> Drop.update() / Drop.destroy()
  -> list slot
  -> DropdownItem.click
  -> Dropdown.on-click
```

## Props 與狀態

| props | 作用 |
| --- | --- |
| `trigger` | `hover`、`click`、`custom`、`contextMenu` |
| `visible` | 手動控制顯示，主要給 custom 模式 |
| `placement` | 浮層位置 |
| `transfer`、`transferClassName` | 是否把浮層移到 body，以及附加 class |
| `stopPropagation` | 阻止 item click 往外層 dropdown 傳 |
| `capture` | clickoutside directive 使用的捕獲設定 |
| `eventsEnabled`、`boundariesElement` | 傳給 Popper/Drop |

`currentVisible` 是內部 mirror state。watch `visible` 會同步，watch `currentVisible` 會更新或銷毀浮層，並 emit `on-visible-change`。

## Trigger 行為

| trigger | 開啟方式 | 關閉方式 |
| --- | --- | --- |
| `hover` | mouseenter 延遲 250ms 開啟 | mouseleave 延遲 150ms 關閉 |
| `click` | trigger click 切換 | click outside 關閉 |
| `contextMenu` | 右鍵切換，trigger class 禁止選字 | click outside 關閉 |
| `custom` | 不處理內部互動 | 由外部 `visible` 控制 |

`custom` 模式下，內部 click、hover、右鍵與 close 都會直接返回，避免和外部控制打架。

## 巢狀 Dropdown

`Dropdown.hasParent()` 會往上找父層 `Dropdown`。巢狀情境下：

- 子 dropdown click 不直接切換根 visible。
- `handleHaschildClick()` 會讓父層保持開啟。
- `handleItemClick(key)` 會往父層遞迴，直到最外層 emit `on-click`。
- `handleHoverClick()` 會在點擊 item 後由內往外關閉 hover dropdown。

這讓多層命令選單可以共用同一個 `on-click` 出口。

## DropdownItem

`DropdownItem` props：

| props | class |
| --- | --- |
| `disabled` | `ivu-dropdown-item-disabled` |
| `selected` | `ivu-dropdown-item-selected` |
| `divided` | `ivu-dropdown-item-divided` |
| `name` | 作為 click payload |

點擊 disabled item 時直接返回。否則會找到最近的 `Dropdown`，根據是否還有子 dropdown 決定保持父層開啟或關閉，最後呼叫 `$parent.handleItemClick(name)`。

## Slots 與 Class

| slot | 用途 |
| --- | --- |
| default | 觸發區域 |
| `list` | 浮層內容，通常放 `DropdownMenu` |

主要 class 包括 `ivu-dropdown`、`ivu-dropdown-rel`、`ivu-dropdown-rel-user-select-none`、`ivu-dropdown-transfer`、`ivu-dropdown-menu`、`ivu-dropdown-item`。

`transferClassName` 只在 transfer 浮層 class 上生效。

## Runtime 與型別對照

| 項目 | 觀察 |
| --- | --- |
| `capture` | runtime 有 prop，型別未描述 |
| `DropdownItem.name` | runtime 支援 `String` 或 `Number`，型別只寫 string |
| `on-hover-click`、`on-haschild-click` | runtime emits 有宣告，但主要是內部語意，型別未描述 |
| `visible` | runtime 可在任何 trigger 下同步，但文件語意主要給 custom |
| `boundariesElement` | runtime default 是 `'window'`，型別寫 `string | HTMLElement` |

## 設計啟發

Dropdown 介於導航與浮層之間。作為導航元件時，它提供命令入口；作為浮層元件時，它要處理定位、外部點擊、transfer 和 Popper。

好的 Dropdown 設計要把 trigger 狀態和 item 事件拆開。trigger 決定顯示，item 決定使用者選了什麼，兩者不要互相洩漏過多內部細節。

## 複習題

1. `custom` trigger 為什麼要讓內部互動全部返回？
2. `currentVisible` watch 做了哪些副作用？
3. 巢狀 Dropdown 的 item click 如何傳到最外層？
4. `stopPropagation` 會影響哪一段事件流程？
5. Dropdown 和 Menu 的層級導航設計有什麼不同？
