# 元件分類與學習路線

## 學習目標

這篇筆記用 `src/components/index.js` 和 `src/components/` 建立 View UI Plus 的元件分類地圖。分類的目的不是背元件清單，而是判斷不同元件類型應該用什麼閱讀方式、會遇到哪些架構問題，以及後續應該接到哪個主題章節。

讀完後，你應該能把一個元件先歸類，再決定要從 props/class、父子狀態、命令式實例、浮層定位、型別或樣式哪個角度切入。

## 對照源碼

- `03-architecture/atomic/03-component-taxonomy-and-learning-order.md`
- `03-architecture/origin/03-component-taxonomy.md`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/index.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/`

## 主線分析

`src/components/index.js` 把 View UI Plus 對外公開的元件集中匯出。從架構學習角度，這份清單可以整理成使用場景與複雜度不同的類型。

| 類型 | 代表元件 | 後續章節 |
| --- | --- | --- |
| 基礎元件 | `Icon`、`Button`、`Divider` | `07-basic-components/` |
| 版面與容器 | `Row`、`Col`、`Layout`、`Card`、`Collapse`、`Space`、`Split` | `08-layout-and-containers/` |
| 導航元件 | `Menu`、`Tabs`、`Breadcrumb`、`Page`、`Anchor`、`Dropdown` | `09-navigation-components/` |
| 表單與輸入 | `Form`、`Input`、`Select`、`Checkbox`、`Radio`、`Switch`、`DatePicker`、`Upload` | `10-form-and-input-components/` |
| 資料展示 | `Table`、`Tree`、`List`、`Timeline`、`Avatar`、`Badge`、`Tag`、`Calendar` | `11-data-display-components/` |
| 回饋與浮層 | `Modal`、`Drawer`、`Tooltip`、`Poptip`、`Message`、`Notice`、`Spin` | `12-feedback-and-overlays/` |
| Pro 或業務型元件 | `Login`、`FooterToolbar`、`GlobalFooter`、`Exception`、`NumberInfo`、`Trend` | `13-pro-and-business-components/` |
| 文字與排版 | `Typography`、`Title`、`Paragraph`、`Text`、`Ellipsis` | `14-typography-and-text/` |
| 工具型元件與全域服務 | `LoadingBar`、`ImagePreview`、`Copy`、`ScrollTop`、`ScrollIntoView` | `15-utility-components-and-global-services/` |

這個分類來自 atomic 對公開元件清單的整理。它是學習路線上的分類，不代表 View UI Plus 原始碼中有對應的資料夾分組。

## 分類判斷標準

遇到一個元件時，可以先問三個問題：

1. 它主要解決畫面結構、使用者輸入、資料展示、回饋通知，還是業務場景？
2. 它是否需要管理複雜狀態、父子通訊、浮層、非同步或鍵盤互動？
3. 它是否能以 `this.$Message`、`this.$Modal` 這類命令式 API 被呼叫？

這些問題會改變閱讀方式。

| 元件 | 建議閱讀重點 |
| --- | --- |
| `Button` | props 如何映射 class、loading、disabled、icon、click。 |
| `Form` | 欄位收集、校驗、狀態傳遞、FormItem 關係。 |
| `Table` | columns、data、slot、排序、展開、固定欄、複雜狀態。 |
| `Message` | 命令式 API 如何建立、更新、銷毀通知實例。 |
| `Modal` | 既有元件形態，也有 confirm 這類命令式服務入口。 |

## 建議閱讀順序

不要按 `src/components/index.js` 的字母順序閱讀。比較穩定的方式是按元件類型和複雜度分段。

1. **基礎元件**：先讀 `Icon`、`Button`、`Divider`、`Space`、`Tag`、`Badge`，建立最小元件模型。
2. **容器與導航元件**：先讀 `Row`、`Col`、`Layout`、`Card`，再讀 `Breadcrumb`、`Dropdown`、`Menu`、`Tabs`、`Page`。
3. **表單與輸入元件**：先讀 `Input`、`Checkbox`、`Radio`、`Switch`、`Form`，再讀 `Select`、`DatePicker`、`Upload`。
4. **資料展示與回饋浮層**：先讀 `List`、`Timeline`、`Tree`、`Table`，再讀 `Tooltip`、`Poptip`、`Modal`、`Drawer`、`Message`、`Notice`。

這個順序的推論基礎是：越早閱讀的元件，越應該能讓你建立 props、slot、class、event、style、type 的共同模型；越晚閱讀的元件，通常越多狀態、父子通訊、浮層或命令式生命週期。

## 來源明確支持

- `src/components/index.js` 明確集中匯出大量元件，包含基礎元件、版面、導航、表單、資料展示、回饋、工具型與業務型元件。
- atomic 03 明確指出分類目的是幫助判斷常見設計問題與後續深入章節，而不是背清單。
- origin 03 明確提供分類判斷方式與閱讀順序建議。

## 根據來源推論

- 把 `Message`、`Notice`、`LoadingBar`、`ImagePreview` 視為命令式服務，是根據 atomic 03/08 與 `src/index.js` 的 `app.config.globalProperties` 掛載關係做出的推論。
- 把 `Login`、`GlobalFooter` 等放入 Pro 或業務型元件，是基於 atomic 分類；它是學習用途的分類，不代表這些元件在 source 中有獨立業務層。
- `SearchForm` 這類企業封裝應放在下游企業封裝層，是基於本專案資料流與 atomic 設計啟發做出的學習判斷，不是 View UI Plus source 的既有能力。

## Runtime / Type / 樣式落差

元件分類本身不直接產生 runtime/type 落差，但它會決定檢查面。

- 基礎元件要檢查 `.vue` props、class、`types/*.d.ts` 與 `src/styles/components/*.less` 是否一致。
- 命令式服務要檢查 `src/index.js` 的 `globalProperties` 與 `types/index.d.ts` 的 `ComponentCustomProperties` 是否一致。
- 浮層與複合元件要額外檢查共用能力，例如 `base/notification`、`base/popper`、directives、utils 或 mixins。

## 設計啟發

成熟元件庫的公開清單不應只被當成字母排序的 export 檔。它可以反推文件架構、測試策略、學習路線與企業封裝邊界。

對企業後台二次封裝來說，分類能幫你決定哪些能力應直接使用 View UI Plus，哪些應該封裝成更高階的業務元件。基礎元件通常不適合重造；業務型流程、查詢表單、CRUD 組合頁則更適合留到企業封裝層。

## 實戰使用場景

- 新人讀源碼時，先按分類選擇低複雜元件，避免一開始進入 `Table` 或 `DatePicker`。
- 設計新元件時，先判斷它是基礎元件、複合元件、命令式服務、浮層元件還是業務封裝，避免把業務流程塞進基礎元件庫。
- Review 測試策略時，用元件分類決定測試重點：普通元件測 props/class/event，複合元件測父子狀態，命令式服務測生命週期與全域掛載。

## 實作檢查任務

1. 打開 `src/components/index.js`，選 5 個元件並歸類，說明分類依據。
2. 對 `Button`、`Form`、`Table`、`Message` 各列出最應優先檢查的三個 source 表面。
3. 找出一個掛到 `app.config.globalProperties` 的服務，確認它是否也出現在 `types/index.d.ts`。
4. 選一個複合元件資料夾，檢查它是否包含父子元件、mixins、utils 或內部 base 模組。

## 複習題

1. 為什麼不建議一開始閱讀 `Table` 或 `DatePicker`？
2. `Message` 和 `Modal` 都和回饋有關，但架構型態可能有什麼差異？
3. `Login`、`GlobalFooter` 這類元件為什麼更接近業務型元件？
4. 如果要新增一個 `SearchForm`，它應該放在基礎元件庫還是企業封裝層？
5. 元件分類如何影響測試案例與 PR review 重點？
