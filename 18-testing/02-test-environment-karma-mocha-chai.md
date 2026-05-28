# Karma、Mocha、Chai 測試環境

## 學習目標

這篇分析 View UI Plus 的舊式瀏覽器測試環境。重點是理解 Karma 如何啟動 ChromeHeadless、webpack 如何打包測試入口、Mocha / Chai 如何提供測試語法，以及 coverage 為什麼只能作為輔助訊號。

## 對照源碼

- `01-origin/source/view-ui-plus-v1.3.20/test/unit/karma.conf.js`
- `01-origin/source/view-ui-plus-v1.3.20/test/unit/index.js`
- `01-origin/source/view-ui-plus-v1.3.20/package.json`
- `01-origin/source/view-ui-plus-v1.3.20/build/webpack.test.config.js`

## 測試環境的角色分工

| 工具 | 責任 |
| --- | --- |
| Karma | 啟動瀏覽器、載入測試檔、收集測試結果 |
| ChromeHeadless | 提供真實 DOM 與瀏覽器事件環境 |
| webpack | 處理 Vue、JS、Less、alias 與測試入口打包 |
| Mocha | 提供 `describe`、`it`、`beforeEach`、`afterEach` |
| Chai | 提供 `expect(...).to.equal(...)` 斷言 |
| sinon-chai | 讓 spy、stub 類斷言可以整合 Chai |
| karma-coverage | 收集覆蓋率報告 |

這套架構的核心思想是：用真瀏覽器跑單元測試，讓 DOM、事件、樣式 class 和元件生命週期更接近使用者實際環境。

## karma.conf.js 的主線

`karma.conf.js` 宣告：

- `browsers: ['ChromeHeadless']`
- `frameworks: ['mocha', 'sinon-chai']`
- `reporters: ['spec', 'coverage']`
- `files: ['./index.js']`
- `preprocessors: { './index.js': ['webpack', 'sourcemap'] }`
- `coverageReporter` 輸出 lcov 和 text-summary

也就是說，Karma 不是直接載入每個 spec。它只載入 `index.js`，再由 `index.js` 自動尋找所有測試檔。

## index.js 的載入策略

`test/unit/index.js` 做兩件事：

1. 關閉 Vue production tip。
2. 用 `require.context('./specs', true, /\.spec$/)` 載入所有 spec。

這種寫法適合早期 webpack 測試環境：新增一個 `xxx.spec.js` 後，不需要手動更新測試入口。

檔案裡也保留 coverage 來源載入：

```js
const srcContext = require.context('../../src/components/breadcrumb', true, /^\.\/(?!styles.*?(\.less)?$)/);
srcContext.keys().forEach(srcContext);
```

這裡目前只針對 breadcrumb 元件載入來源，並帶有 `@todo`。這代表 coverage 設定還不完整，不能把當前覆蓋率解讀成整個元件庫的品質指標。

## 為什麼需要瀏覽器環境

元件庫常依賴瀏覽器能力：

- `document.createElement`
- `document.body.appendChild`
- DOM event dispatch
- focus、click、input
- classList、querySelector
- service API 動態插入 DOM
- Popper、Teleport、transfer DOM 類浮層行為

Node-only 環境雖然較快，但如果沒有 jsdom 或瀏覽器，就不能自然測這些行為。Karma + ChromeHeadless 的優點是直接給一個真瀏覽器；缺點是啟動慢、設定重、除錯成本高。

## coverage 的正確理解

coverage 能回答：

- 哪些檔案被測試執行到？
- 哪些分支完全沒有被跑過？
- 最近改動是否讓某些區域缺少測試？

coverage 不能回答：

- 測試斷言是否有意義。
- 使用者真正依賴的行為是否被測到。
- 複雜互動是否符合產品預期。
- 邊界條件是否完整。

對元件庫來說，coverage 是警報，不是品質保證。高 coverage 搭配空洞斷言仍然沒有價值；低 coverage 則提醒你需要回到 API 契約和高風險元件補測。

## 現代化對照

如果今天重建這套環境，可以把角色改成：

| 舊環境 | 現代替代 |
| --- | --- |
| Karma | Vitest |
| ChromeHeadless | jsdom、happy-dom、Playwright component test |
| Mocha | Vitest test API |
| Chai | Vitest expect |
| karma-coverage | v8 coverage 或 istanbul coverage |
| webpack test config | Vite config |

但遷移時不要只換工具。要保留的是測試意圖：自動載入 spec、可掛載元件、有 DOM 環境、可等待非同步、有清楚 coverage 報告。

## 設計啟發

設計測試環境時，先決定需要模擬到哪個層級：

- 純工具函式：Node 環境即可。
- 普通元件：jsdom 通常足夠。
- 浮層定位、scroll、selection、真實 focus：可能需要瀏覽器。
- 視覺回歸與拖拽：應考慮 Playwright。

View UI Plus 的 Karma 設定選擇了真瀏覽器，因此能比較自然地支撐 DOM 型元件測試，但也帶來維護成本。今天仿寫時可以換工具，但不能忽略環境能力和測試需求的匹配。

## 複習題

1. Karma 在 View UI Plus 測試環境中負責什麼？
2. `files: ['./index.js']` 搭配 `require.context()` 解決了什麼問題？
3. 為什麼元件庫測試常需要 DOM 或瀏覽器環境？
4. coverage 能提醒什麼，不能保證什麼？
5. 如果改用 Vitest，哪些測試能力仍然必須保留？
