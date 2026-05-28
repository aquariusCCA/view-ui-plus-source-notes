# Copy 與 Scroll 工具服務

## 學習目標

這篇分析 Copy、ScrollTop、ScrollIntoView、BackTop、Affix 這些工具型互動能力。它們不一定負責複雜 UI，卻會直接操作 DOM、選取文字、監聽滾動或計算元素位置。

讀完後，要能判斷一個工具能力應該做成全域函數、普通元件，還是兩者搭配。

## 對照源碼

- `01-origin/source/view-ui-plus-v1.3.20/src/components/copy/index.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/scroll-top/index.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/scroll-into-view/index.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/back-top/back-top.vue`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/affix/affix.vue`
- `01-origin/source/view-ui-plus-v1.3.20/src/utils/assist.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/utils/dom.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/utils/index.js`

## Copy：DOM 工具加回饋服務

`copy/index.js` 的核心流程是：

```txt
$Copy({ text, successTip, errorTip, success, error, showTip })
  -> isClient guard
  -> 建立隱藏 textarea
  -> 寫入 text
  -> select(textarea)
  -> document.execCommand('copy')
  -> 用 $Message 顯示成功或失敗
  -> 移除 textarea
  -> 執行 success / error callback
```

這裡有幾個設計重點：

- 它是函數，不是 Vue 元件，因為任務是一次性 DOM 操作。
- 它依賴 `$Message` 顯示提示，所以工具服務也可能依賴另一個全域服務。
- 它建立暫時 DOM 後一定要移除，否則每次複製都會留下節點。
- 它用 `isClient` 避免在 SSR 或非瀏覽器環境操作 document。

Copy 的邊界是「複製文字」。Typography 的 copyable 會借用它，但 Typography 的圖示、tooltip、文字狀態不應塞回 Copy 服務。

## ScrollTop：容器滾動工具

`scroll-top/index.js` 是一個平滑滾動函數：

```txt
$ScrollTop(el, settings, callback)
  -> from = el.scrollTop
  -> to = settings.to || 0
  -> 根據 time 算 step
  -> requestAnimationFrame 遞迴更新 scrollTop
  -> 到達後執行 callback
```

它適合滾動某個容器，不負責顯示按鈕。BackTop 元件則是另一層封裝：監聽 window scroll，判斷是否顯示，點擊時呼叫 `assist.scrollTop`。

這是「低層函數」和「視覺元件」的分層案例。

## ScrollIntoView：多層父容器滾動

`scroll-into-view/index.js` 比 ScrollTop 複雜，因為它要找到所有可滾動父層：

- `getTargetScrollLocation()` 計算目標元素相對父容器的 x、y。
- `defaultIsScrollable()` 判斷父層是否需要滾動。
- `validTarget` 允許使用者限制哪些父層可以滾。
- `align` 控制目標在視窗或容器中的對齊位置。
- `touchstart` 會取消正在進行的動畫。

這個服務更像「可設定的瀏覽器行為補強」。它適合用在表單驗證失敗後滾到第一個錯誤欄位、列表選中後滾到項目等場景。

## BackTop 與 Affix：元件化的滾動行為

BackTop 和 Affix 是普通元件，但它們也屬於工具型能力：

- BackTop 監聽 window scroll/resize，超過 `height` 後顯示，點擊後滾回頂部。
- Affix 監聽 window scroll/resize，計算元素 offset，符合條件時切到 fixed 樣式。

它們和 `$ScrollTop`、`$ScrollIntoView` 的差異是：元件需要在畫面上佔位、顯示 slot、發出事件；服務函數只完成一次操作。

## 設計啟發

工具型 DOM 能力要檢查：

- 是否需要畫面節點或 slot？需要就偏元件。
- 是否只是一次性副作用？偏全域函數。
- 是否讀寫 `window`、`document`、`getBoundingClientRect`？要有 SSR guard。
- 是否會建立臨時 DOM 或 listener？要有清理邏輯。
- 是否需要 callback 回報完成、取消、成功或失敗？
- 是否應該依賴 `$Message` 這類提示服務，還是把結果交給呼叫端？

## 複習題

1. `$Copy` 為什麼不是一個可見元件？
2. Copy 服務為什麼要建立 textarea，而不是直接複製字串？
3. `$ScrollTop` 和 BackTop 的分工是什麼？
4. ScrollIntoView 為什麼需要 `validTarget` 和 `isScrollable`？
5. Affix 這類滾動元件最容易漏掉哪種清理工作？
