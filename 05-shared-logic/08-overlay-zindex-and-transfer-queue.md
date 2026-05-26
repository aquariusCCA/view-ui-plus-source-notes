# 浮層層級與 transfer queue

## 學習目標

這篇分析 `utils/transfer-queue.js` 以及浮層元件如何管理 z-index。Modal、Tooltip、Poptip、Select Dropdown、ImagePreview、Notification、Spin 都會把內容浮在普通頁面之上，因此需要一套簡單的層級遞增策略。

## 對照源碼

- `01-origin/source/view-ui-plus-v1.3.20/src/utils/transfer-queue.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/modal/modal.vue`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/tooltip/tooltip.vue`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/poptip/poptip.vue`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/select/dropdown.vue`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/image/image-preview.vue`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/base/notification/notification.vue`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/spin/spin.js`

這幾個元件與檔案不是完整使用清單，而是代表不同類型的浮層層級需求：`modal.vue` 用來看 Modal 如何同時處理 `transferIndex` 與 `lastVisibleIndex`；`tooltip.vue` 用來看提示浮層如何取得遞增層級；`poptip.vue` 用來看確認型浮層如何共用同一套 z-index 策略；`select/dropdown.vue` 用來看下拉選單如何避免被其他浮層蓋住；`image-preview.vue` 用來看圖片預覽浮層如何取得更高層級；`notification.vue` 用來看命令式通知服務如何管理顯示層級；`spin.js` 用來看全螢幕 Loading 服務如何用 `transferIndex` 計算 wrapper 的 z-index。

## `transfer-queue.js`

這個檔案只有兩組計數器：

```js
let transferIndex = 0;
let lastVisibleIndex = 0;
```

以及對應的遞增方法：

```js
transferIncrease()
lastVisibleIncrease()
```

`transferIndex` 用來讓新開啟的浮層拿到更高層級。`lastVisibleIndex` 主要服務 Modal，用來判斷最後可見的彈窗層級。

## 使用模式

常見模式是：

```txt
浮層需要顯示
  -> 呼叫 transferIncrease()
  -> 讀取 transferIndex
  -> 根據 base z-index + transferIndex 計算實際層級
```

Tooltip、Poptip、Select Dropdown、ImagePreview、Notification、Spin 都有類似行為。這確保後打開的浮層通常會疊在先前浮層之上。

## Modal 的特殊性

Modal 比一般 Tooltip 更複雜，因為它有遮罩、內容、滾動鎖定、多層彈窗與最後可見彈窗判斷。

Modal 會使用：

- `transferIndex as modalIndex`
- `transferIncrease as modalIncrease`
- `lastVisibleIndex`
- `lastVisibleIncrease`

這說明 Modal 不只是要提高 z-index，還要知道目前誰是最後顯示的 Modal，才能處理鍵盤、遮罩或關閉行為。

## 與 TransferDom 的關係

浮層通常還會搭配 `transfer-dom` directive 或 Teleport 類似概念，把 DOM 移到 body 下。原因是如果浮層留在原元件位置，容易被父層的 `overflow: hidden`、`z-index`、`transform` 影響。

因此浮層系統通常有兩件事要處理：

| 問題 | 對應能力 |
| --- | --- |
| DOM 應該掛在哪裡 | transfer dom / teleport |
| 疊層順序誰高誰低 | transfer queue / z-index counter |

兩者缺一不可。只移動 DOM 不管理 z-index，還是可能被其他浮層蓋住；只管理 z-index 但不移動 DOM，也可能被父層 stacking context 限制。

## 設計限制

這套 queue 很簡單，也因此有幾個限制：

- 只遞增不回收，長時間使用會持續變大，但一般 UI 足夠可接受。
- 沒有集中記錄每個浮層 instance，只提供計數器。
- 不處理跨 app 或多個 Vue root 的層級隔離。
- 實際 z-index 還要看各元件樣式如何加上 base 值。

這是元件庫常見的務實設計：用足夠簡單的全域計數器解決 90% 的浮層順序問題。

## 設計啟發

浮層元件最怕各自為政。如果 Tooltip、Modal、Select、Notification 各自寫死 z-index，使用者很快會遇到「下拉選單被 Modal 蓋住」或「Tooltip 蓋不到 Drawer」這類問題。

抽出共同的層級遞增器，可以讓浮層之間至少遵守同一套順序規則。更完整的設計可以進一步做成 `useZIndex()` 或 overlay manager，集中管理 base z-index、instance stack、focus trap 與 scroll lock。

## 複習題

1. `transferIndex` 解決的是什麼問題？
2. 為什麼 Modal 還需要 `lastVisibleIndex`？
3. transfer DOM 和 z-index queue 分別處理浮層系統的哪一部分？
4. 全域計數器只增不減有什麼利弊？
5. 如果設計新版 overlay manager，你會比 `transfer-queue.js` 多保存哪些資訊？
