# 覆蓋率與測試維護

## 學習目標

這篇分析 coverage 和測試維護。重點是理解覆蓋率報告如何幫助找缺口，也要知道它不能取代測試設計；同時整理如何避免元件庫測試變成脆弱、緩慢、難讀的負擔。

## 對照源碼

- `01-origin/source/view-ui-plus-v1.3.20/test/unit/karma.conf.js`
- `01-origin/source/view-ui-plus-v1.3.20/test/unit/index.js`
- `01-origin/source/view-ui-plus-v1.3.20/test/unit/specs/`
- `01-origin/source/view-ui-plus-v1.3.20/package.json`

## coverage 在這裡怎麼產生

`karma.conf.js` 使用 `coverage` reporter，輸出：

- `lcov`
- `text-summary`

`index.js` 中透過 `require.context()` 載入 spec，並保留一段來源載入邏輯：

```js
const srcContext = require.context('../../src/components/breadcrumb', true, /^\.\/(?!styles.*?(\.less)?$)/);
srcContext.keys().forEach(srcContext);
```

目前這段只載入 breadcrumb 相關 source，旁邊還有 `@todo`。這代表 coverage 的範圍不是整個元件庫。因此不能用目前 coverage 判斷 View UI Plus 全部元件測得夠不夠。

## coverage 能幫什麼

coverage 適合用來：

- 發現完全沒有測到的檔案。
- 發現重要分支沒被走到。
- 比較 PR 前後覆蓋率變化。
- 找出高風險但無測試的元件。
- 驗證 bugfix 是否至少跑過相關路徑。

它是測試地圖，不是測試品質本身。

## coverage 不能保證什麼

coverage 不能保證：

- 斷言有意義。
- payload shape 正確。
- DOM 對使用者可用。
- 邊界條件完整。
- 測試能抓到真實 bug。
- 元件語意符合文件。

一個測試可以執行某行程式碼，卻完全沒有斷言那行的結果。這種 coverage 只是數字，不是保護。

## 脆弱測試

元件庫常見脆弱測試包括：

- 過度依賴完整 DOM 層級。
- 過度依賴 className 完整字串。
- 等待固定時間，而不是等待條件。
- 測 private method，而不看公開結果。
- 多個行為塞在同一個巨大測試。
- 沒清理 DOM 或 timer。
- 使用隨機資料但不固定 seed 或 expected。

Select performance 測試用 `Math.random()` 產生 label，但只驗證數量和時間，不驗證具體 label，因此風險還可控。如果 expected 也依賴隨機值，就會變得難除錯。

## 維護測試的重構原則

測試也需要重構，但要小心不要改掉測試意圖。

可以重構：

- 重複掛載邏輯。
- 重複資料工廠。
- 重複等待條件。
- 重複事件觸發。
- 長 expected fixture。

不應該輕易重構掉：

- 測試名稱中的 bug 情境。
- 明確的 payload shape 斷言。
- 邊界資料。
- 多 instance 隔離測試。
- reset 後再操作測試。

測試重構的目標是讓意圖更清楚，不是讓測試看起來更短。

## 測試命名

好的測試名稱應該描述行為：

- `should render as <a>`
- `should change loading state`
- `should set new options`
- `should create different and independent instances`
- `should export data with commas and line breaks to CSV`
- `should fire on-change when reseting value`

名字可以比實作更重要。當測試失敗時，工程師應該先從名稱知道使用者契約是哪一個。

## 測試資料維護

當測試資料變長，應該抽到 fixture：

- CSV expected。
- locale expected。
- 大量 options。
- 樹狀資料。
- 表單 rules。

但 fixture 不應變成黑盒。測試中仍要保留一兩行說明這份資料在測什麼邊界，例如「包含逗號和換行」或「覆蓋多語月份格式」。

## 設計啟發

元件庫測試維護可以用三個指標判斷：

- 失敗時是否容易定位。
- 重構內部實作時是否不會大量誤報。
- 新增 bugfix 時是否容易補一個最小回歸測試。

如果測試讓工程師不敢改元件，可能是測試太綁實作。如果測試通過但使用者 bug 一直回來，可能是測試沒有對準契約。

## 複習題

1. View UI Plus 現有 coverage 設定有什麼範圍限制？
2. coverage 能提示什麼，不能保證什麼？
3. 哪些測試寫法最容易變脆弱？
4. 測試重構時，哪些內容不應該被抹掉？
5. 好的測試名稱應該描述什麼？
