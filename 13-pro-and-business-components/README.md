# 13-pro-and-business-components

本目錄存放 View UI Plus 的進階元件與企業後台業務封裝分析。這一章不只讀單一基礎元件，而是觀察多個元件如何被組合成可交付的業務能力，例如登入表單、權限包裹、複合查詢區、進階表格、CRUD 頁面、業務彈窗、詳情區塊與資料看板。

建議在讀完表單輸入、資料展示、回饋浮層三章後進入本章，因為業務型元件通常會同時依賴 `Form`、`Input`、`Select`、`Table`、`Modal`、`Drawer`、`Message`、`Auth`、slot、render function、schema 設計、權限控制、非同步提交與 TypeScript 型別約束。

## 閱讀順序

| 順序 | 筆記 | 學習重點 |
| --- | --- | --- |
| 1 | [進階與業務型元件總覽](./01-pro-and-business-components-overview.md) | 建立本章分類、源碼閱讀方法與業務封裝判斷標準 |
| 2 | [Login 與帳號表單族](./02-login-and-account-form-family.md) | 分析 Login、UserName、Password、Mobile、Email、Captcha、Submit 的 provide/inject、表單模型與驗證封裝 |
| 3 | [Auth 權限邊界](./03-auth-permission-boundary.md) | 分析權限判斷、noMatch slot、prevent 模式、跳轉與操作攔截 |
| 4 | [複合表單與查詢表單](./04-composite-form-and-query-form.md) | 設計 SearchForm、FilterPanel、AdvancedQuery 的欄位 schema、收合、重置與提交語意 |
| 5 | [進階表格與 TablePaste](./05-advanced-table-and-table-paste.md) | 分析 TablePaste 的貼上解析，並整理 CrudTable、ActionColumn、Toolbar、批量操作封裝 |
| 6 | [CRUD 頁面組合模式](./06-crud-page-composition.md) | 把查詢區、表格、分頁、批量操作、彈窗與服務層組成完整後台頁面 |
| 7 | [業務 Modal 與 Drawer](./07-business-modal-and-drawer.md) | 設計新增/編輯/詳情彈窗、非同步提交、關閉攔截、表單重置與資料回填 |
| 8 | [資料看板與狀態型元件](./08-dashboard-and-status-widgets.md) | 分析 NumberInfo、Trend、AvatarList、CountUp、CountDown、Exception 的業務展示語意 |
| 9 | [詳情區塊與底部操作列](./09-detail-description-and-footer-toolbar.md) | 分析 DescriptionList、FooterToolbar、GlobalFooter，整理詳情頁與流程頁操作區 |
| 10 | [業務元件 API 與 Schema 模式](./10-business-api-and-schema-patterns.md) | 整理 schema、泛型、slots、events、permissions、service adapter 的 API 設計 |
| 11 | [業務封裝邊界](./11-business-component-boundaries.md) | 判斷哪些邏輯應放元件、hooks、service、頁面或 `21-enterprise-wrappers/` |
| 12 | [進階業務元件設計檢查清單](./12-pro-business-component-design-checklist.md) | 建立仿寫與二次封裝時可重複使用的檢查流程 |

## 原始碼主線

主要對照這幾個位置：

- `01-origin/source/view-ui-plus-v1.3.20/src/components/login/`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/user-name/`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/password/`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/mobile/`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/email/`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/captcha/`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/submit/`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/auth/`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/table-paste/`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/number-info/`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/trend/`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/avatar-list/`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/count-up/`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/count-down/`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/exception/`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/description-list/`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/footer-toolbar/`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/global-footer/`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/city/`
- `01-origin/source/view-ui-plus-v1.3.20/types/`

## 本章邊界

本章重點是「用元件庫組合業務能力」，不是重複分析每個基礎元件的內部細節。

- `Form`、`Input`、`Select`、`DatePicker`、`Upload` 的底層行為放在 `10-form-and-input-components/`；本章只分析它們如何被封裝成查詢表單、登入表單與業務表單。
- `Table`、`Tag`、`Badge`、`Avatar` 的資料展示行為放在 `11-data-display-components/`；本章聚焦 CrudTable、ActionColumn、批量操作、貼上轉表格與業務狀態展示。
- `Modal`、`Drawer`、`Message`、`Notice` 的浮層與服務機制放在 `12-feedback-and-overlays/`；本章只討論它們在新增、編輯、詳情、確認與非同步提交流程中的封裝方式。
- `21-enterprise-wrappers/` 適合放實作練習與企業二次封裝成品；本章偏源碼分析、設計原則與封裝模式整理。
- 如果一個元件只是純展示文字排版，優先放 `14-typography-and-text/`；只有當它承載業務頁面結構或後台場景語意時才放進本章。

## 學完後要能回答

- View UI Plus 內建的 Login 家族如何用 `provide/inject` 把多個欄位合併成同一個表單模型？
- Auth 的 `authority`、`access`、`prevent`、`noMatch` 與跳轉行為分別解決哪種權限場景？
- 複合查詢表單應該如何設計欄位 schema、預設值、重置、收合、遠端選項與提交 payload？
- CrudTable 應該把哪些能力留給 Table，哪些能力包到業務層？
- TablePaste 如何把貼上的文字解析成 columns/data，這個模式能給 Excel 匯入、批量建立什麼啟發？
- 新增/編輯 Modal 如何處理資料回填、表單重置、非同步 submit、loading、關閉攔截與成功回刷？
- NumberInfo、Trend、Exception 這類元件為什麼不是單純的資料展示，而是帶有業務語意的狀態表達？
- schema 型業務元件如何設計泛型、slot 擴展、event payload、permission 與 service adapter？
- 什麼邏輯應該放元件內，什麼邏輯應該放 composable、service、頁面或企業封裝章節？
