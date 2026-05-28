# 資料看板與狀態型元件

## 學習目標

這篇分析 View UI Plus 中帶有業務展示語意的元件：`NumberInfo`、`Trend`、`AvatarList`、`CountUp`、`CountDown`、`Exception`。它們和普通資料展示元件不同，通常出現在儀表板、工作台、異常頁或流程狀態中。

## 對照源碼

- `01-origin/source/view-ui-plus-v1.3.20/src/components/number-info/number-info.vue`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/trend/trend.vue`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/avatar-list/avatar-list.vue`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/count-up/count-up.vue`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/count-down/count-down.vue`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/exception/exception.vue`
- `01-origin/source/view-ui-plus-v1.3.20/types/`

## NumberInfo 與 Trend

`NumberInfo` 將 title、subTitle、total、subTotal 組成一個指標區塊，並用 `Trend` 表達上升或下降。

閱讀重點：

- `total` 和 `subTotal` 支援字串或數字。
- `status` 映射到 `Trend` 的 `flag`。
- title、subTitle、total、subTotal 都保留 slot 覆蓋能力。
- `gap` 控制數值區和標題區的間距。

`Trend` 的重點是 `flag`、`colorful`、`reverseColor`、`textColor`。同樣的上升，在營收場景可能是好事，在錯誤率場景可能是壞事，所以需要反轉顏色。

## AvatarList

AvatarList 解決的是「多人參與者」的展示，而不是單個 Avatar。閱讀時要看：

- 最大顯示數量如何處理。
- 多出的成員是否用 tooltip 或數字提示。
- size、shape、icon、src 等 Avatar props 如何被傳遞。
- slot 是否允許使用者自訂每個 avatar。

## CountUp 與 CountDown

這兩個元件把時間或數字變化封裝成展示狀態：

- CountUp 常用於統計數字的動態呈現。
- CountDown 常用於驗證碼、活動倒數、任務截止。
- CountDown 的 `on-end` 是重要事件，常接續啟用按鈕或觸發下一步。

閱讀時要特別看 timer 建立與銷毀，避免離開頁面後仍持續執行。

## Exception

`Exception` 是業務狀態頁，不只是 Result。它通常對應 403、404、500 等場景。

閱讀時要看：

- type 如何映射預設圖片、標題與描述。
- 是否允許自訂 actions。
- 異常頁應該由路由層、頁面層，還是元件層決定 type。

## 複習題

1. `Trend` 為什麼需要 `reverseColor`？
2. NumberInfo 的 `subTotal` 為什麼可以預設包一層 Trend？
3. CountDown 的 timer 要在哪些生命週期清理？
4. Exception 和 Result 的使用場景有什麼差異？
5. 看板元件如果要接即時資料，元件內應不應該直接發 API？
