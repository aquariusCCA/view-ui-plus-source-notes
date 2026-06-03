# 元件分類與閱讀順序

> 來源：03-architecture/origin/03-component-taxonomy.md / # 元件分類地圖

## 學習目標

這篇筆記建立 View UI Plus 的元件分類地圖。分類的目的不是背清單，而是幫助你判斷每一類元件常見的設計問題，以及後續應該到哪個章節深入閱讀。

## 源碼位置

主要閱讀：

- `01-origin/source/view-ui-plus-v1.3.20/src/components/index.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/`

補充參考：

- `README.md`
- `00-roadmap/source-reading-order.md`：僅用來對齊後續學習路線，不作為 View UI Plus 元件分類或技術行為判斷的主要依據。

## 元件分類地圖

View UI Plus 的 `src/components/index.js` 把所有公開元件集中匯出。從架構學習角度，可以把它們分成以下類型：

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

## 分類判斷方式

分類時可以用三個問題判斷：

1. 這個元件主要解決「畫面結構」還是「使用者輸入」？
2. 這個元件是否需要管理複雜狀態、父子通訊或浮層？
3. 這個元件是否能作為命令式服務從 `this.$Message`、`this.$Modal` 這類 API 被呼叫？

例如：

- `Button` 主要是基礎互動元件，閱讀重點是 props 如何映射 class、loading、disabled、事件。
- `Form` 是表單系統核心，閱讀重點是欄位收集、校驗、狀態傳遞。
- `Table` 是資料展示高複雜元件，閱讀重點是 columns、data、slot、排序、展開、固定欄等。
- `Message` 是命令式全域服務，閱讀重點不是模板，而是如何建立、更新與銷毀通知實例。

## 閱讀順序建議

不要按 `src/components/index.js` 的字母順序閱讀。比較合適的方式，是先依 `src/components/index.js` 與 `src/components/` 建立分類，再參考 `00-roadmap/source-reading-order.md` 對齊後續學習路線，並在每個階段內部依複雜度由低到高閱讀。

1. **基礎元件**：先讀 `Icon`、`Button`、`Divider`、`Space`、`Tag`、`Badge`，建立最小元件模型。
2. **容器與導航元件**：先讀 `Row`、`Col`、`Layout`、`Card`，理解容器和排版；再讀 `Breadcrumb`、`Dropdown`、`Menu`、`Tabs`、`Page`，理解導航狀態、父子通訊與選中邏輯。
3. **表單與輸入元件**：先讀 `Input`、`Checkbox`、`Radio`、`Switch`、`Form`，理解輸入、受控狀態與校驗；再讀 `Select`、`DatePicker`、`Upload`，處理彈層、鍵盤、非同步與複雜互動。
4. **資料展示與回饋浮層**：先讀 `List`、`Timeline`、`Tree`、`Table`，理解資料結構、渲染與狀態管理；再讀 `Tooltip`、`Poptip`、`Modal`、`Drawer`、`Message`、`Notice`，理解浮層、命令式服務與全域回饋。

這樣可以避免把所有高複雜度元件混成同一組。先按元件類型分段，再把每段中的複雜元件放後面，會更接近實際學習路線。

## 設計啟發

元件分類會影響元件庫的文件、測試、範例與學習路線。成熟元件庫通常不是只把元件平鋪成一份清單，而是會按使用場景與複雜度組織。

對企業後台二次封裝來說，分類也能幫助你決定哪些能力應該直接使用 View UI Plus，哪些能力應該封裝成更高階的業務元件。

## 檢查問題

1. 為什麼不建議一開始閱讀 `Table` 或 `DatePicker`？
2. `Message` 和 `Modal` 都和回饋有關，但它們的架構型態有什麼差異？
3. `Login`、`GlobalFooter` 這類元件為什麼更接近業務型元件？
4. 如果你要新增一個 `SearchForm`，它應該放在元件庫基礎元件層，還是企業封裝層？
5. 元件分類如何影響測試案例設計？
