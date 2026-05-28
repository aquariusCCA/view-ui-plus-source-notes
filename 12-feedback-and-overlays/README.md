# 12-feedback-and-overlays

本目錄存放 View UI Plus 的回饋與浮層類元件分析。這裡的元件負責把提示、確認、通知、遮罩、定位浮層、載入狀態與全域服務整理成穩定的使用者互動契約。

建議在讀完基礎元件、容器元件、導航元件、表單輸入元件與資料展示元件後進入本章，因為回饋與浮層元件會同時使用 `Teleport`、`createApp`、render function、Popper.js、全域方法、DOM 事件、滾動鎖定、z-index 佇列、計時器與 TypeScript 宣告。

## 閱讀順序

| 順序 | 筆記 | 學習重點 |
| --- | --- | --- |
| 1 | [回饋與浮層類元件總覽](./01-feedback-and-overlays-overview.md) | 建立本章元件分類、互動層級、關閉語意與源碼閱讀方法 |
| 2 | [Alert 警告提示](./02-alert.md) | 分析低狀態回饋元件、圖示映射、slot、關閉狀態與內容層級 |
| 3 | [Modal 與 Confirm 服務](./03-modal-and-confirm.md) | 分析 `v-model`、遮罩、滾動鎖定、拖拽、Esc、確認框服務與非同步關閉 |
| 4 | [Drawer 抽屜](./04-drawer.md) | 分析方向、尺寸、inner 模式、拖拽調寬、多抽屜滾動鎖定與事件語意 |
| 5 | [Tooltip 與 Poptip](./05-tooltip-and-poptip.md) | 分析 Popper 定位、trigger、transfer、confirm 模式、click outside 與 z-index |
| 6 | [Message 與 Notice](./06-message-and-notice.md) | 分析全域通知實例、訊息佇列、duration、name、render、close 與 destroy |
| 7 | [Spin 與 LoadingBar](./07-spin-and-loading-bar.md) | 分析局部/全螢幕載入、全域 `$Spin`、頂部進度條、計時器與狀態收束 |
| 8 | [浮層底層機制](./08-overlay-foundations.md) | 整理 Teleport、Popper mixin、Notification base、Scrollbar mixin、transfer queue |
| 9 | [回饋與浮層 API 模式](./09-feedback-overlay-api-patterns.md) | 整理元件式 API、服務式 API、事件、slots、render、config 與型別對照 |
| 10 | [回饋與浮層元件設計檢查清單](./10-feedback-overlay-component-design-checklist.md) | 整理仿寫回饋與浮層元件時可重複使用的設計檢查流程 |

## 原始碼主線

主要對照這幾個位置：

- `01-origin/source/view-ui-plus-v1.3.20/src/components/alert/`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/modal/`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/drawer/`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/tooltip/`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/poptip/`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/message/`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/notice/`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/spin/`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/loading-bar/`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/base/popper.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/base/notification/`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/modal/mixins-scrollbar.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/utils/transfer-queue.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/directives/clickoutside.js`
- `01-origin/source/view-ui-plus-v1.3.20/types/`
- `01-origin/source/view-ui-plus-v1.3.20/src/styles/components/`

## 本章邊界

本章只分析「使用者操作後的回饋」與「脫離正常文流的浮層互動」。

- Dropdown 在 `09-navigation-components/` 已從導航與選單角度分析；本章只在 Popper、transfer 與 z-index 模式中交叉說明。
- Skeleton、Progress、Circle、Result 放在 `11-data-display-components/`，因為它們主要承載資料展示狀態；Spin 與 LoadingBar 則放在本章，因為它們更像操作回饋與全域載入服務。
- ImagePreview 雖然是浮層，但主體屬於 Image 的媒體預覽流程，放在 `11-data-display-components/`。
- BusinessModal、BusinessDrawer、ConfirmAction 這類企業後台二次封裝，可放在 `13-pro-and-business-components/` 或 `21-enterprise-wrappers/`。
- 全域註冊與 `$Message`、`$Notice`、`$Modal`、`$Spin`、`$Loading` 的掛載方式，可回看 `04-plugin-system/`；本章聚焦服務本身如何建立實例與管理生命週期。

## 學完後要能回答

- Alert 為什麼可以作為低狀態回饋元件的入門案例？
- Modal 的 `modelValue`、內部 `visible`、`wrapShow` 和 `buttonLoading` 分別解決什麼問題？
- Modal 的 `loading`、`beforeClose` 與 `Modal.remove()` 分別對應哪幾種關閉控制？
- Drawer 和 Modal 共享了哪些遮罩、滾動鎖定與 slot 設計，又在哪些地方因方向和尺寸不同而分化？
- Tooltip 和 Poptip 如何透過 Popper mixin 維持 reference、popper、placement 與 offset？
- Poptip 的 `confirm` 模式為什麼會改變 trigger、內容結構與事件語意？
- Message 和 Notice 為什麼不直接是普通元件，而是基於 `Notification.newInstance()` 的全域服務？
- `duration: 0`、`name`、`closable`、`render` 這些選項如何影響通知的生命週期？
- Spin 的局部載入、全螢幕 `$Spin` 與 LoadingBar 的狀態模型有什麼差異？
- `Teleport`、`transfer-queue`、`mixins-scrollbar` 和 `clickoutside` 如何共同支撐浮層互動？
