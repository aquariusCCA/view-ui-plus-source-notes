# 元件分類與學習路線

## 學習目標

這篇筆記把 `src/components/index.js` 中的公開元件清單整理成學習地圖。分類的目的不是背元件名稱，而是先判斷每一類元件常見的架構問題，接著決定後續閱讀順序。

讀完後，你應該能做到：

1. 根據元件用途與架構型態，把 View UI Plus 元件放進合理分類。
2. 判斷一個元件應該先看 props、父子狀態、命令式服務，還是浮層行為。
3. 知道後續章節應該如何從簡單元件逐步進入複雜元件。

## 來源與對照

主要 atomic：

- `03-architecture/atomic/03-component-taxonomy-and-learning-order.md`

origin 對照：

- `03-architecture/origin/03-component-taxonomy.md`

對照源碼：

- `01-origin/source/view-ui-plus-v1.3.20/src/components/index.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/`

補充參考：

- `00-roadmap/source-reading-order.md`

`00-roadmap/source-reading-order.md` 只用來對齊後續學習路線，不作為 View UI Plus 元件分類或技術行為判斷的主要來源。元件是否公開、名稱如何匯出，仍以 `src/components/index.js` 與同章節 atomic / origin 為主要依據。

## 為什麼要先分類

`src/components/index.js` 把大量元件集中匯出。這份清單對使用者來說是公開 API 面，對閱讀者來說則是元件庫的入口地圖。

如果直接按照檔案或匯出順序閱讀，會很快碰到複雜度落差：`Button`、`Table`、`DatePicker`、`Message` 都在 components 目錄中，但它們要處理的架構問題完全不同。

分類的價值在於先回答：

1. 這個元件主要解決畫面結構、資料輸入、資料展示、回饋浮層，還是命令式服務。
2. 它是否需要父子元件共享狀態。
3. 它是否會建立、更新或銷毀命令式實例。
4. 它是否牽涉彈層、定位、轉移、遮罩或關閉行為。

這些問題會直接影響閱讀順序。

## 元件分類地圖

從架構學習角度，可以把 View UI Plus 的公開元件整理成以下類型：

| 類型 | 代表元件 | 後續章節 |
| --- | --- | --- |
| 基礎元件 | `Icon`、`Button`、`Divider` | `07-basic-components/` |
| 版面與容器 | `Row`、`Col`、`Layout`、`Card`、`Collapse`、`Space`、`Split` | `08-layout-and-containers/` |
| 導航元件 | `Menu`、`Tabs`、`Breadcrumb`、`Page`、`Anchor`、`Dropdown` | `09-navigation-components/` |
| 表單與輸入 | `Form`、`Input`、`Select`、`Checkbox`、`Radio`、`Switch`、`DatePicker`、`Upload` | `10-form-and-input-components/` |
| 資料展示 | `Table`、`Tree`、`List`、`Timeline`、`Avatar`、`Badge`、`Tag`、`Calendar` | `11-data-display-components/` |
| 回饋與浮層 | `Modal`、`Drawer`、`Tooltip`、`Poptip`、`Message`、`Notice`、`Spin` | `12-feedback-and-overlays/` |
| 文字與排版 | `Typography`、`Title`、`Paragraph`、`Text`、`Ellipsis` | `14-typography-and-text/` |
| 工具型元件與全域服務 | `LoadingBar`、`ImagePreview`、`Copy`、`ScrollTop`、`ScrollIntoView` | `15-utility-components-and-global-services/` |
| Pro 或業務型元件 | `Login`、`FooterToolbar`、`GlobalFooter`、`Exception`、`NumberInfo`、`Trend` | `13-pro-and-business-components/` |

這個分類是為了建立閱讀路線，不是 View UI Plus 原始碼中的唯一分類方式。實際分析某個元件時，仍要回到它在 `src/components/index.js` 的公開匯出、資料夾內部結構、樣式與型別。

## 分類判斷方式

判斷元件類型時，可以先問三個問題：

1. 這個元件主要解決畫面結構還是使用者輸入？
2. 這個元件是否需要管理複雜狀態、父子通訊或浮層？
3. 這個元件是否能作為命令式服務，從 `this.$Message`、`this.$Modal` 這類 API 被呼叫？

幾個例子：

- `Button` 是基礎互動元件，閱讀重點是 props 如何映射 class、loading、disabled、事件與渲染分支。
- `Form` 是表單系統核心，閱讀重點是欄位收集、校驗、狀態傳遞與父子關係。
- `Table` 是高複雜度資料展示元件，閱讀重點是 columns、data、slot、排序、展開、固定欄等資料結構與渲染策略。
- `Message` 是命令式全域服務，閱讀重點不是模板本身，而是如何建立、更新與銷毀通知實例，以及如何掛到全域 API。

這些例子說明，同樣在 `src/components/` 裡，閱讀問題可以完全不同。

## 建議閱讀順序

不建議按照 `src/components/index.js` 的匯出順序或字母順序閱讀。比較穩定的方式是先按元件類型分段，再在每段中由簡單到複雜。

第一步讀基礎元件：

- `Icon`
- `Button`
- `Divider`
- `Space`
- `Tag`
- `Badge`

這一組適合建立最小元件模型：props、slot、class、事件、樣式與型別如何對接。

第二步讀容器與導航：

- 容器：`Row`、`Col`、`Layout`、`Card`
- 導航：`Breadcrumb`、`Dropdown`、`Menu`、`Tabs`、`Page`

這一組開始引入排版結構、父子元件關係、選中狀態與導航狀態。

第三步讀表單與輸入：

- 入門：`Input`、`Checkbox`、`Radio`、`Switch`、`Form`
- 進階：`Select`、`DatePicker`、`Upload`

這一組會碰到受控狀態、校驗、彈層、鍵盤操作、非同步與複雜互動。

第四步讀資料展示與回饋浮層：

- 資料展示：`List`、`Timeline`、`Tree`、`Table`
- 回饋浮層：`Tooltip`、`Poptip`、`Modal`、`Drawer`、`Message`、`Notice`

這一組會集中出現資料結構、渲染策略、浮層定位、遮罩、關閉行為與命令式服務。

## 分類和後續章節的關係

架構章節只建立分類地圖，不提前展開單一元件全部細節。後續章節應該承接這張圖：

| 後續章節 | 承接重點 |
| --- | --- |
| `07-basic-components/` | 從低複雜度元件建立 props、slot、class、style、type 的閱讀能力。 |
| `08-layout-and-containers/` | 理解版面與容器元件如何處理結構與間距。 |
| `09-navigation-components/` | 分析導航選中狀態、父子通訊與使用者互動。 |
| `10-form-and-input-components/` | 深入輸入、受控狀態、表單校驗與資料同步。 |
| `11-data-display-components/` | 分析資料結構、渲染策略與高複雜度狀態。 |
| `12-feedback-and-overlays/` | 深入浮層、回饋、命令式服務與全域 API。 |
| `13-pro-and-business-components/` | 區分基礎元件庫能力與更高階業務封裝。 |
| `14-typography-and-text/` | 閱讀文字語意、排版與省略、複製、編輯等能力。 |
| `15-utility-components-and-global-services/` | 分析工具型元件與全域服務的掛載與生命週期。 |

## Runtime / Type / 樣式落差

這篇筆記不判定單一元件的 runtime 行為，也不展開型別落差。分類本身只是一個閱讀策略。

正式分析某個元件時，要另外檢查：

1. runtime：元件實作檔是否真的存在對應 props、事件、方法或服務 API。
2. type：`types/` 是否有對外型別，名稱是否和 runtime 對應。
3. style：`src/styles/components/` 是否有對應樣式與狀態 class。
4. examples/test：範例與測試是否覆蓋主要使用方式。

因此分類不能直接推出「某元件一定具備某能力」。它只告訴你下一步應該優先查哪些檔案。

## 關鍵設計

元件分類是元件庫設計的一部分。成熟元件庫通常不只是平鋪所有元件，而會按照使用場景、互動複雜度、資料複雜度與服務型態組織文件、範例、測試與學習路線。

對 View UI Plus 這種後台元件庫來說，分類還能幫助你區分兩種工作：

1. 學習基礎元件庫本身的穩定 API 與實作模式。
2. 在企業專案中把基礎元件再封裝成更貼近業務的高階元件。

例如 `Button`、`Input`、`Table` 是基礎元件庫能力；而 `SearchForm` 這類元件更可能屬於企業封裝層，應該在後續 enterprise wrappers 類材料中處理，而不是混進 View UI Plus 的基礎元件分類。

## 設計啟發

如果你要設計自己的元件庫或企業元件體系，可以先建立分類，再決定閱讀、文件、測試與封裝策略：

1. 基礎元件先保證 API 小而穩定。
2. 容器與導航元件要重視父子結構與狀態同步。
3. 表單元件要重視受控狀態、校驗與資料流。
4. 資料展示元件要重視資料結構、渲染與效能邊界。
5. 浮層與服務要重視掛載位置、生命週期與全域 API。
6. 業務型元件要和基礎元件庫能力分層，不要讓基礎 API 被業務情境污染。

## 複習題

1. 為什麼不建議一開始閱讀 `Table` 或 `DatePicker`？
2. `Message` 和 `Modal` 都和回饋有關，但架構型態有什麼不同？
3. 元件分類如何影響後續測試案例與範例設計？
4. 如果要新增一個 `SearchForm`，它應該放在基礎元件庫層，還是企業封裝層？
5. 閱讀一個未知元件時，你會先用哪三個問題判斷它的類型？

