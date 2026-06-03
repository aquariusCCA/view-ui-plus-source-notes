# 從公開入口追到元件實作的通用閱讀流程

> 來源：
> - 03-architecture/origin/06-source-reading-map.md / ## 核心概念、## 通用追蹤流程、## 設計啟發
> - 03-architecture/origin/01-project-structure.md / ## 源碼追蹤
> - 03-architecture/origin/08-architecture-summary.md / ## 後續閱讀路線

## 學習目標

這篇筆記提供一套可重複使用的 View UI Plus 源碼追蹤流程。之後閱讀任何元件，都可以先用這張地圖定位，再深入細節。

## 源碼位置

主要閱讀：

- `01-origin/source/view-ui-plus-v1.3.20/package.json`
- `01-origin/source/view-ui-plus-v1.3.20/src/index.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/index.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/*/index.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/*/*.vue`
- `01-origin/source/view-ui-plus-v1.3.20/src/styles/`
- `01-origin/source/view-ui-plus-v1.3.20/types/`

## 閱讀源碼時要問的問題

閱讀元件庫源碼，不要只問「這段程式碼做什麼」，而要按層次追問：

1. 它怎麼被使用者引入？
2. 它怎麼被註冊或掛載？
3. 它的公開 API 是什麼？
4. 它的狀態和事件如何流動？
5. 它依賴哪些共用工具？
6. 它的樣式從哪裡來？
7. 它的型別如何暴露給使用者？

## 第一次閱讀主線

建議第一次閱讀時只追蹤主線：

1. 看 `package.json`，確認套件入口、型別入口與建置 scripts。
2. 看 `src/index.js`，確認使用者 `import ViewUIPlus from 'view-ui-plus'` 會進入哪裡。
3. 看 `src/components/index.js`，確認公開元件清單。
4. 隨便挑一個簡單元件，例如 `src/components/button/index.js`，觀察單一元件如何被轉出口。
5. 看 `src/styles/index.less`，確認樣式入口如何串起變數、基礎樣式、動畫與元件樣式。
6. 看 `types/index.d.ts`，確認 TypeScript 使用者看到的是哪一層 API。

## 通用追蹤流程

以任何一個元件 `X` 為例：

```txt
1. src/components/index.js
   -> 找到 export { default as X } from './x'

2. src/components/x/index.js
   -> 確認單一元件入口匯出什麼

3. src/components/x/*.vue 或 *.js
   -> 閱讀 props、emits、data、computed、methods、watch、render/template

4. src/index.js
   -> 確認它是否參與全域註冊、是否有別名、是否掛到 globalProperties

5. src/styles/components/
   -> 找樣式命名、狀態 class、尺寸與主題變數

6. types/
   -> 找對外型別宣告

7. examples/routers/
   -> 看官方範例如何使用

8. test/unit/specs/
   -> 看測試保護哪些行為
```

不是每個元件都有完整的樣式、型別、範例與測試，但這個順序可以避免漏看重要入口。

## 後續閱讀路線

完成架構章節後，建議接著閱讀：

1. `04-plugin-system/`：深入 `install`、全域註冊、按需引入與全域服務。
2. `05-shared-logic/`：整理 `utils/`、`mixins/`、跨元件共用邏輯。
3. `06-public-api-and-type-system/`：分析 Props、Emits、Slots、Instance 與型別宣告。
4. `07-basic-components/`：從 `Icon`、`Button`、`Divider` 建立單一元件閱讀能力。
5. `17-style-system/`：回頭深入 Less、變數、mixins、BEM 與樣式覆蓋策略。

## 設計啟發

源碼閱讀的目標不是逐行翻譯，而是建立一條從公開 API 到內部實作的可驗證路徑。每次閱讀都應該能回答：

- 使用者怎麼用？
- 入口在哪裡？
- 狀態怎麼走？
- DOM 怎麼生成？
- 樣式怎麼套？
- 型別怎麼暴露？

這樣讀完一個元件後，你得到的不是零散知識，而是一個可遷移到其他元件的分析模板。

## 檢查問題

1. 閱讀一個元件時，為什麼要先看 `src/components/index.js`？
2. 為什麼 `examples/` 和 `test/` 也屬於源碼閱讀材料？
3. 讀完一個元件後，你應該能產出哪些結論？
4. 第一次閱讀時，為什麼要先追入口、匯出、樣式與型別？
5. 後續章節中，哪些內容應該優先承接架構章節的閱讀流程？
