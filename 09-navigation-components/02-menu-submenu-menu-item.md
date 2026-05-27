# Menu、Submenu 與 MenuItem

## 學習目標

這篇分析 `Menu`、`Submenu`、`MenuItem`、`MenuGroup` 如何組成層級導航。重點是 active 狀態、open 狀態、父子註冊、水平與垂直模式差異，以及 `MenuItem` 如何同時支援選中與連結跳轉。

## 對照源碼

- `src/components/menu/menu.vue`
- `src/components/menu/submenu.vue`
- `src/components/menu/menu-item.vue`
- `src/components/menu/menu-group.vue`
- `src/components/menu/mixin.js`
- `types/menu.d.ts`
- `src/styles/components/menu.less`

## 元件定位

| 元件 | 角色 |
| --- | --- |
| `Menu` | 根節點，保存 `currentActiveName`、`openedNames`、子選單與選單項清單 |
| `Submenu` | 可展開節點，負責 title、子項容器、垂直 collapse 或水平 drop |
| `MenuItem` | 可選中項，支援 `to`、`target`、router click 與選中狀態 |
| `MenuGroup` | 分組容器，只提供分組標題與縮排 |

`Menu` 透過 `provide` 提供 `MenuInstance`，`Submenu` 再提供 `SubmenuInstance`。`mixin.js` 讓子元件能取得根選單、父層子選單、模式與巢狀層級。

## Props 與狀態

| 元件 | props | 影響 |
| --- | --- | --- |
| `Menu` | `mode`、`theme`、`activeName`、`openNames`、`accordion`、`width` | 決定方向、主題、目前選中項與展開項 |
| `Submenu` | `name`、`disabled` | 作為 open key，控制是否可展開 |
| `MenuItem` | `name`、`disabled`、link mixin props | 作為 active key，控制是否可選中或跳轉 |
| `MenuGroup` | `title` | 顯示分組標題 |

`Menu` 的內部狀態分成兩條線：

```txt
activeName prop -> currentActiveName -> updateActiveName -> MenuItem.active / Submenu.active
openNames prop -> openedNames -> updateOpened / updateOpenKeys -> Submenu.opened
```

## 父子註冊

`Submenu` 在 mounted 時呼叫 `addSubmenu()`，把 `{ id, submenu }` 推進根 `Menu.submenuList`。如果上層還有 `Submenu`，也會註冊到父層的 `childSubmenuList`。

`MenuItem` 在 mounted 時呼叫 `addMenuItem()`，把 `{ id, menuitem }` 推進根 `Menu.menuItemList`。卸載時兩者都會移除自己。

這種設計讓 `Menu` 不需要直接解析 slot，也能批次通知所有子項更新 active 狀態。

## 展開邏輯

垂直模式下，`Submenu` title click 會切換 `opened`，再呼叫 `Menu.updateOpenKeys(name)`。水平模式下，滑入滑出用 timeout 控制展開，內容交給 `Drop` 浮層。

`accordion` 開啟時，根選單會先關閉其他 `Submenu`，再打開目前分支和它的祖先。收合某個節點時，會保留祖先開啟，並關閉其子孫。

`Menu` 最後從所有 `Submenu.opened` 反推 `openedNames`，並觸發 `on-open-change`。

## 選中邏輯

`MenuItem.handleClickItem()` 的流程：

1. disabled 時直接返回。
2. 若是新視窗或 `target="_blank"`，只處理 link click，並向根 `Menu` emit `on-select`。
3. 若在 `Submenu` 內，呼叫父層 `Submenu.handleMenuItemSelect(name)`。
4. 否則直接呼叫根 `Menu.handleMenuItemSelect(name)`。
5. 根選單更新 `currentActiveName`，emit `on-select`，watch 再觸發 `updateActiveName()`。

`MenuItem.handleUpdateActiveName(name)` 會比對自己的 `name`。命中時設為 active，並通知父 `Submenu` 標記 `active`，讓祖先也能出現子項 active 樣式。

## Class 與 Style

| 狀態 | class 或 style |
| --- | --- |
| 根選單 | `ivu-menu`、`ivu-menu-light`、`ivu-menu-dark`、`ivu-menu-horizontal`、`ivu-menu-vertical` |
| active item | `ivu-menu-item-active`、`ivu-menu-item-selected` |
| opened submenu | `ivu-menu-opened` |
| disabled | `ivu-menu-item-disabled`、`ivu-menu-submenu-disabled` |
| 巢狀縮排 | `paddingLeft: 43 + (parentSubmenuNum - 1) * 24px` |
| 垂直寬度 | `Menu.width` 轉成 inline `width` |

`theme="primary"` 只在水平模式保留；垂直模式下 runtime 會把 primary 改成 light。

## Runtime 與型別對照

| 項目 | 觀察 |
| --- | --- |
| `MenuItem.disabled` | runtime 有宣告，`types/menu.d.ts` 未描述 |
| `Submenu.disabled` | runtime 有宣告，型別未描述 |
| `MenuItem.name` | runtime required，型別寫成可選 |
| link props | `MenuItem` 透過 link mixin 支援 `to`、`replace`、`target`、`append`，型別有描述 |
| event payload | runtime `on-select` 回傳 name，`on-open-change` 回傳 opened names，型別只寫 `any` |

## 設計啟發

Menu 的難點不在 DOM，而在同步多層狀態。好的選單元件要把使用者關心的狀態壓縮成 `activeName` 和 `openNames`，同時讓子元件能自行註冊、移除與通知父層。

水平 Menu 和垂直 Menu 共用同一組資料結構，但互動完全不同：垂直是 collapse，水平是 hover + floating drop。這是用同一 API 支援不同呈現模式的典型案例。

## 複習題

1. `Menu` 為什麼要維護 `submenuList` 和 `menuItemList`？
2. `activeName` 和 `openNames` 的狀態流有什麼差異？
3. `accordion` 模式為什麼需要處理祖先與子孫選單？
4. `MenuItem` 在 `_blank` 情境下為什麼不更新 active 狀態？
5. 垂直模式與水平模式的 `Submenu` 渲染差異是什麼？
