# View UI Plus Source Notes

這是一個用來深入學習 **View UI Plus** 的筆記包。

它不是單純記錄 View UI Plus 的使用方式，而是透過 View UI Plus 反向學習 Vue 3 組件庫的架構設計、源碼組織、核心機制、仿作實作與企業級二次封裝思路。

## 學習主軸

- 從原始碼與官方文件建立第一手材料。
- 按主題拆解 Vue 3 組件庫的設計模式。
- 針對核心機制進行仿作與練習。
- 將筆記、示例、複習與補充資料分層管理。

## 目錄說明

| 目錄 | 作用 |
| --- | --- |
| `00-roadmap/` | 學習路線、階段目標、進度規劃與主題優先級。 |
| `01-origin/` | 原始材料區，存放 View UI Plus 原始碼、官方文件、圖片資源與匯入紀錄。 |
| `01-origin/source/` | View UI Plus 原始碼快照、源碼引用或來源說明。 |
| `01-origin/docs/` | 官方文件、API 文件、版本說明與相關文檔來源。 |
| `01-origin/assets/` | 從來源材料取得或整理出的圖片、截圖、圖表等資源。 |
| `02-notes/` | 存放來自源碼閱讀、Vue/TypeScript/工程化等背景知識補強，或針對不熟悉概念的延伸學習，例如 `app.config.globalProperties`、plugin install、provide/inject、Teleport 等。筆記應以自己的理解重新整理，必要時附上參考來源。 |
| `03-architecture/` | 組件庫整體架構、模組分層、目錄組織、依賴關係與設計思想。 |
| `04-plugin-system/` | Vue plugin 安裝流程、全局註冊、配置注入與插件化設計。 |
| `05-shared-logic/` | View UI Plus 沒有獨立 composables/hooks 層；本區整理 `src/mixins/`、`src/utils/` 的共用邏輯、復用方式與事件/狀態封裝。 |
| `06-type-system/` | TypeScript 型別設計，包含 props、emits、instance、public API 與泛型。 |
| `07-components/` | 通用元件分類、元件源碼閱讀、props 設計、插槽設計與元件模式。 |
| `08-overlay-system/` | Modal、Drawer、Tooltip、Dropdown、Popper 等浮層系統的設計與實作。 |
| `09-form-system/` | Form、FormItem、驗證流程、資料流、欄位狀態與錯誤提示機制。 |
| `10-imperative-api/` | Message、Notice、Modal.confirm 等命令式 API 的建立、掛載與銷毀流程。 |
| `11-directives/` | Vue directives 的設計、生命週期、事件綁定與實際使用場景。 |
| `12-style-system/` | 樣式系統、主題設計、CSS 變數、class 命名、尺寸與狀態樣式。 |
| `13-testing/` | 組件庫測試策略、單元測試、互動測試、邊界案例與測試筆記。 |
| `14-build-release/` | 打包流程、按需載入、型別輸出、發布流程與版本管理。 |
| `15-imitation/` | 仿作 View UI Plus 的核心機制與元件，用實作驗證理解。 |
| `16-enterprise-wrappers/` | 企業級二次封裝思路，例如統一 API、業務元件、設計規範與封裝邊界。 |
| `99-prompts/` | 用於源碼閱讀、筆記整理、仿作實作、重構分析的提示詞集合。 |
| `99-prompts/system/` | 系統規則提示詞，存放穩定的 AI 角色設定與總體規則，例如語言、教學風格與輸出原則。 |
| `99-prompts/workflows/` | 工作流程提示詞，存放完整生成流程，例如依主題/模組來源範圍生成對應的 `02-notes/` 筆記，或從 `02-notes/` 生成練習與複習材料。 |
| `99-prompts/formats/` | 輸出格式提示詞，存放固定輸出格式，例如教書型筆記、練習題、複習卡與 API 表格格式。 |
| `99-prompts/requests/` | 實際提問範例，存放可直接使用或參考的具體提問，例如針對某章節、某份原始資料或某個任務的問題。 |
