# 導航類元件總覽

## 學習目標

這篇建立 `09-navigation-components` 的閱讀方法。導航元件負責回答三個問題：使用者目前在哪裡、接下來可以去哪裡，以及切換位置時狀態如何同步。

讀完後，要能用同一套流程分析 Menu、Tabs、Breadcrumb、Page、Anchor、Dropdown、Steps、PageHeader 這類元件，並分辨它們各自處理的是層級選單、頁籤切換、路徑提示、分頁、錨點、命令選單、流程進度，還是頁面頭部導航。

## 對照源碼

- `01-origin/source/view-ui-plus-v1.3.20/src/components/menu/`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/tabs/`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/breadcrumb/`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/page/`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/anchor/`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/dropdown/`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/steps/`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/page-header/`
- `01-origin/source/view-ui-plus-v1.3.20/types/`
- `01-origin/source/view-ui-plus-v1.3.20/src/styles/components/`

## 元件分類

| 類型 | 代表元件 | 閱讀重點 |
| --- | --- | --- |
| 層級選單 | `Menu`、`Submenu`、`MenuItem`、`MenuGroup` | active/open 狀態、父子註冊、手風琴、水平浮層 |
| 頁籤導航 | `Tabs`、`TabPane` | pane 註冊、`v-model`、可關閉 tab、滾動 nav、鍵盤與右鍵選單 |
| 路徑提示 | `Breadcrumb`、`BreadcrumbItem` | separator、link mixin、slot 覆蓋 |
| 分頁導航 | `Page`、`Options` | current/pageSize/total 同步、快速跳頁、每頁條數 |
| 錨點導航 | `Anchor`、`AnchorLink` | hash、scroll container、active link、ink 位置 |
| 命令選單 | `Dropdown`、`DropdownMenu`、`DropdownItem` | trigger、浮層、click outside、巢狀選單 |
| 流程導航 | `Steps`、`Step` | current/status 推導、步驟註冊、slot fallback |
| 頁頭導航 | `PageHeader` | breadcrumb、back、tabs、action/content/extra 區塊 |

導航元件的共同特徵是：它們都有「目前位置」或「目前選中項」。閱讀時要先找到狀態來源，再追它如何變成 class、事件、DOM 與對外 API。

## 閱讀順序

建議每組元件都按照這個順序讀：

1. 看 `index.js`，確認主元件導出和子元件是否另有獨立入口。
2. 看父元件，整理提供的狀態、方法、props、emits。
3. 看子元件，確認 inject、註冊、移除、點擊事件和 slot fallback。
4. 看 link、dropdown、affix、select 等跨元件依賴。
5. 看 `.d.ts`，核對 runtime API 和型別描述是否一致。
6. 看 less，確認 active、disabled、opened、selected 等狀態 class 的樣式語意。

## 導航元件的共同模式

| 模式 | 說明 |
| --- | --- |
| active state | `Menu.currentActiveName`、`Tabs.activeKey`、`Anchor.currentLink`、`Page.currentPage` |
| child registration | 子元件 mounted 時註冊到父元件，beforeUnmount 時移除 |
| link behavior | `MenuItem`、`BreadcrumbItem` 使用 link mixin 支援 router 或原生連結 |
| trigger behavior | `Dropdown`、水平 `Submenu` 需要 hover、click、context menu 或 custom 控制 |
| controlled state | `Tabs` 和 `Page` 用 `modelValue` + `update:modelValue` 同步外部狀態 |
| visual state class | active、opened、disabled、selected、finish、error 都轉成穩定 class |
| DOM measurement | `Tabs` nav bar、`Anchor` scroll offset、水平 `Submenu` drop width 依賴 DOM |

## 和其他章節的關係

- 父子通訊可回看 `05-shared-logic/04-component-tree-communication.md`。
- link mixin 可回看 `05-shared-logic/07-link-behavior.md`。
- `oneOf`、`findComponentUpward`、`scrollTop` 可回看 `05-shared-logic/02-assist-utils.md`。
- Props、Events、Slots、`.d.ts` 的完整判讀方法放在 `06-public-api-and-type-system/`。
- 浮層、click outside、Popper 行為也會在 `12-feedback-and-overlays/` 交叉出現。

## 設計啟發

導航元件 API 的核心不是顯示文字，而是穩定管理「位置」。例如：

- `Menu` 把多層巢狀選單壓縮成 `activeName` 和 `openNames`。
- `Tabs` 把 pane 順序、active key、關閉、拖曳和右鍵選單整合成頁籤系統。
- `Breadcrumb` 讓頁面路徑可被 slot 和 router link 同時控制。
- `Page` 把資料總數、頁碼、每頁筆數與跳頁輸入收斂成少量事件。
- `Anchor` 把 hash、滾動容器和目標標題位置轉成 active link。

讀導航元件時，重點是畫出：

```txt
外部狀態 / 使用者操作
  -> 內部 current state
  -> 子元件或 DOM 更新
  -> class/style
  -> emit 給使用者
```

## 複習題

1. 導航元件和容器元件最大的差異是什麼？
2. 為什麼 Menu、Tabs、Steps 都需要子元件註冊？
3. `activeName`、`activeKey`、`currentPage`、`currentLink` 分別代表哪種位置狀態？
4. 哪些導航元件依賴 DOM 測量或全域事件？
5. 閱讀導航元件時，為什麼要同時看事件 payload 和 class 狀態？
