# 導航元件 API 模式

## 學習目標

這篇把本章元件抽象成可重複使用的 API 閱讀框架。讀完後，要能看到一個新導航元件時，快速拆出 active 狀態、子元件協作、link/trigger 行為、事件 payload、slot fallback、class 狀態與型別漂移。

## 狀態模式

導航元件通常都有一個「目前位置」：

| 元件 | 外部 API | 內部狀態 | 說明 |
| --- | --- | --- | --- |
| `Menu` | `activeName`、`openNames` | `currentActiveName`、`openedNames` | 選中項與展開項 |
| `Tabs` | `modelValue` | `activeKey`、`focusedKey` | active tab 與鍵盤焦點 |
| `Page` | `modelValue`、`pageSize` | `currentPage`、`currentPageSize` | 目前頁與每頁筆數 |
| `Anchor` | URL hash / click | `currentLink`、`currentId` | 目前錨點 |
| `Steps` | `current`、`status` | 子 `Step.currentStatus` | 目前流程步驟 |

閱讀時先畫出：

```txt
prop / route / click / scroll
  -> internal state
  -> computed class/style
  -> emit
```

## 父子協作模式

| 模式 | 元件 | 重點 |
| --- | --- | --- |
| 父層 provide instance | `Menu`、`Tabs`、`Steps`、`Anchor` | 子元件可註冊、讀狀態、呼叫父方法 |
| 子元件 mounted 註冊 | `Submenu`、`MenuItem`、`TabPane`、`AnchorLink` | 父層不需要解析 slot |
| 子元件 beforeUnmount 移除 | 同上 | 動態渲染時避免 stale instance |
| 父層統一渲染 nav | `Tabs` | 子元件只提供資料，header 由父層產生 |
| 子層自行渲染 | `BreadcrumbItem`、`Step` | 父層只提供設定或狀態 |

只要元件需要知道子項順序、索引或批次更新，就很可能需要註冊機制。

## Link 與 Trigger 模式

| 類型 | 元件 | 設計重點 |
| --- | --- | --- |
| router link | `MenuItem`、`BreadcrumbItem` | 支援 `to`、`replace`、`target`、`append`，並處理 ctrl/meta click |
| hash link | `AnchorLink` | 點擊後更新 hash、router 或 window location |
| hover trigger | `Dropdown`、水平 `Submenu` | 需要延遲開關，避免滑動時閃爍 |
| click trigger | `Dropdown`、垂直 `Submenu` | click 切換 visible/opened |
| custom trigger | `Dropdown` | 外部完全控制 visible |
| keyboard trigger | `Tabs`、`Page` | 鍵盤切換焦點、頁碼或輸入 |

link 和 trigger 不只是事件處理，也會影響狀態是否更新。例如 `MenuItem` 新視窗打開時只 emit select，不改 active state。

## Props 設計模式

| 類型 | 建議 | 例子 |
| --- | --- | --- |
| 有限變體 | validator + union type | `mode`、`theme`、`type`、`placement`、`direction` |
| 位置狀態 | 命名成 active/current/open | `activeName`、`openNames`、`current`、`tabActiveKey` |
| 受控值 | `modelValue` + `update:modelValue` | `Tabs`、`Page` |
| 行為開關 | Boolean | `accordion`、`closable`、`simple`、`showInk` |
| DOM/浮層設定 | 明確傳到底層依賴 | `transfer`、`eventsEnabled`、`container`、`offsetTop` |

導航 API 要避免讓使用者直接操作內部 DOM 或子元件 instance。公開 API 應描述「我要哪個項目被選中」或「我要怎麼觸發」。

## Emits 模式

| 事件 | 元件 | payload |
| --- | --- | --- |
| `on-select` | `Menu`、`Anchor` | name 或 href |
| `on-open-change` | `Menu` | opened names |
| `on-click` | `Tabs`、`Dropdown` | tab name 或 item name |
| `on-change` | `Page`、`Anchor` | page 或 new/old href |
| `on-tab-remove` | `Tabs` | removed tab name |
| `on-page-size-change` | `Page` | pageSize |
| `on-tab-change` | `PageHeader` | tab item copy |

事件 payload 是公開契約。即使型別檔只寫 `any`，筆記也要從 runtime 記下實際 payload。

## Slots 模式

| slot 模式 | 元件 | 說明 |
| --- | --- | --- |
| default 作子項 | `Menu`、`Tabs`、`Steps`、`Anchor` | 放子元件 |
| title/content fallback | `Submenu`、`Step`、`PageHeader` | slot 優先，prop 次之 |
| action/extra 區塊 | `Tabs`、`PageHeader` | 用於複合布局 |
| list slot | `Dropdown` | 把浮層內容交給使用者 |
| separator slot | `BreadcrumbItem` | 覆蓋單一分隔符 |
| contextMenu slot | `Tabs` | 提供右鍵選單內容 |

slot 一旦影響 DOM 結構或狀態 class，就要視為公開 API。

## Class 與 Inline Style 模式

| 狀態 | 表達方式 |
| --- | --- |
| active/selected/opened/disabled | class |
| theme/type/size/direction | class |
| 任意寬度或縮排 | inline style |
| DOM 測量結果 | inline style |
| 浮層 transfer class | class object |

導航元件常見 class：

```txt
ivu-*-active
ivu-*-selected
ivu-*-disabled
ivu-*-opened
ivu-*-focused
ivu-*-status-*
```

## 型別對照重點

本章值得特別追蹤的漂移：

| 元件 | 差異 |
| --- | --- |
| `MenuItem`、`Submenu` | runtime 有 `disabled`，型別未完整描述 |
| `Tabs` | runtime `modelValue` 支援 string/number，型別只寫 string |
| `Tabs` | runtime emits `on-dblclick`，型別未列 |
| `Breadcrumb` | runtime `separator` 是 string，型別寫 `string | Element` |
| `Page` | runtime `placement`、`size` 有 validator，型別寫 string |
| `Anchor` | runtime 為了 SSR 放寬 `container`，型別寫 `string | HTMLElement` |
| `DropdownItem` | runtime `name` 支援 string/number，型別只寫 string |
| `Steps` | runtime 的 `Step` slots 在子元件，型別寫在 `Steps` |
| `PageHeader` | runtime 支援 `breadcrumb` slot，型別未列 |

這些差異不一定是 bug，但都是維護元件庫時需要補文件或修型別的風險點。

## 複習題

1. 導航元件最常見的內部 mirror state 有哪些？
2. 什麼情境需要子元件註冊到父層？
3. link 行為和 active 狀態為什麼不能混在一起看？
4. 為什麼事件 payload 要從 runtime 實作確認？
5. 本章有哪些 `.d.ts` 與 runtime 不一致的案例？
