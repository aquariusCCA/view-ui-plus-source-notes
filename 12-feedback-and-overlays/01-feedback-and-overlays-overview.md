# 回饋與浮層類元件總覽

## 學習目標

這篇建立 `12-feedback-and-overlays` 的閱讀方法。回饋與浮層元件的核心不是「顯示一塊 UI」，而是把使用者操作後的狀態、下一步選擇、遮罩層、定位層、全域訊息、載入中與關閉行為整理成可預期的互動契約。

讀完後，要能用同一套流程分析 Alert、Modal、Drawer、Tooltip、Poptip、Message、Notice、Spin、LoadingBar，以及它們背後共用的 Popper、Notification、Teleport、滾動鎖定與 z-index 管理。

## 對照源碼

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
- `01-origin/source/view-ui-plus-v1.3.20/src/utils/transfer-queue.js`
- `01-origin/source/view-ui-plus-v1.3.20/types/`

## 元件分類

| 類型 | 代表元件 | 閱讀重點 |
| --- | --- | --- |
| 靜態回饋 | `Alert` | 類型、圖示、描述、關閉狀態、slot 與事件 |
| 模態覆蓋 | `Modal`、`Drawer` | `v-model`、遮罩、Esc、mask click、滾動鎖定、拖拽、transfer |
| 定位浮層 | `Tooltip`、`Poptip` | reference/popper、placement、trigger、Popper.js、click outside |
| 全域訊息 | `Message`、`Notice` | `createApp`、單例實例、通知佇列、duration、close、destroy |
| 載入回饋 | `Spin`、`LoadingBar` | 局部載入、全螢幕服務、進度推進、完成/錯誤收束 |
| 底層機制 | `Popper`、`Notification`、`ScrollbarMixins`、`transfer-queue` | DOM 掛載、定位更新、層級遞增、body scroll side effect |

這類元件有一個共同特徵：它們的生命週期通常比觸發它們的普通 DOM 更複雜。浮層可能被掛到 `body`，通知可能由全域方法動態建立，載入服務可能先顯示再延遲銷毀，Modal 可能在關閉動畫結束後才真正移除可見包裹。

## 閱讀順序

建議每個元件都按照這個順序讀：

1. 看 `index.js`，確認它是普通元件、服務式元件，還是兩者都有。
2. 找可見狀態，例如 `modelValue`、`visible`、`wrapShow`、`show`、`closed`、`notices`。
3. 找開啟入口，例如 click、mouseenter、focus、全域 `show()`、`notice()`、`start()`。
4. 找關閉入口，例如 close button、mask click、Esc、click outside、timer、destroy。
5. 看是否使用 `Teleport` 或 `createApp`，確認 DOM 最後掛在哪裡。
6. 看 z-index 來源，確認是否依賴 `transfer-queue` 或固定偏移。
7. 看是否會修改 `document.body`，特別是 `overflow` 和 `paddingRight`。
8. 看 slots、render function 與 `v-html`，確認內容自訂層級與安全邊界。
9. 看 `.d.ts`，核對 runtime API、服務方法、事件與 slot 宣告是否一致。
10. 看 less，確認 class 如何承載類型、尺寸、狀態、過渡動畫與 transfer 樣式。

## 互動狀態模型

可以先把回饋與浮層畫成：

```txt
觸發來源
  -> 建立或切換可見狀態
  -> 掛載位置與層級計算
  -> 顯示內容、遮罩、定位或載入動畫
  -> 使用者確認、取消、移出、點外部或等待 timer
  -> emit / callback / remove / destroy
```

Modal 是完整的模態案例：

```txt
modelValue / Modal.confirm()
  -> visible + wrapShow + modalIndex
  -> mask + content + footer + body scroll lock
  -> ok / cancel / Esc / mask / beforeClose
  -> update:modelValue / on-ok / on-cancel / on-hidden / remove
```

Message 是完整的服務案例：

```txt
$Message.success(options)
  -> getMessageInstance()
  -> Notification.newInstance()
  -> notices.push()
  -> duration timer / close button / returned close function
  -> notices.splice() / destroy()
```

Tooltip 是完整的定位案例：

```txt
mouseenter reference
  -> delay timer
  -> visible = true
  -> Popper(reference, popper, options)
  -> transfer + z-index
  -> mouseleave timer
  -> visible = false
```

## 和其他章節的關係

- Button、Icon、Tag、Badge 這些基礎元件可回看 `07-basic-components/`，本章會觀察它們如何被放進回饋元件內部。
- Select、DatePicker、ColorPicker 等表單浮層可回看 `10-form-and-input-components/`，本章整理共用的 Popper、transfer 與 click outside 模式。
- Table fixed column、ImagePreview、Skeleton 與資料載入可回看 `11-data-display-components/`，本章只補浮層與回饋依賴。
- 全域方法如何被掛到 app 實例，可回看 `04-plugin-system/`。
- `clickoutside` 指令、DOM 事件工具與 scroll lock 也可以回看 `16-directives/` 與 `05-shared-logic/`。

## 設計啟發

回饋與浮層元件要把「顯示狀態」和「存在狀態」拆開。例如：

- Modal 使用 `visible` 控制顯示，使用 `wrapShow` 保留動畫期間的外層 DOM。
- Drawer 關閉後延遲處理 `wrapShow`，避免動畫未完成就把包裹層隱藏。
- Message 和 Notice 不把每則通知做成全域單例，而是在一個 Notification 容器中維護 `notices` 陣列。
- LoadingBar 用 `percent`、`status`、`show` 三個狀態分開描述進度、成功/失敗與可見性。
- Tooltip 和 Poptip 把定位交給 Popper mixin，元件本身主要處理 trigger 與內容結構。

讀回饋與浮層元件時，重點是分清楚：

```txt
誰負責開啟
誰負責關閉
關閉能不能被阻止
DOM 掛在哪裡
z-index 如何遞增
body scroll 是否被改動
內容能自訂到哪一層
服務實例何時建立與銷毀
```

## 複習題

1. 回饋與浮層元件和資料展示元件最核心的生命週期差異是什麼？
2. 為什麼 Modal 需要同時考慮可見狀態、動畫狀態與滾動副作用？
3. Tooltip 和 Poptip 為什麼不應該手寫 top/left 定位邏輯？
4. Message 和 Notice 的單例容器有什麼好處與風險？
5. 仿寫一個全域 Toast 服務時，至少要設計哪些 remove、duration 與 destroy 行為？
