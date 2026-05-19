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
| `02-notes/` | 依主題/模組的來源範圍生成教書型筆記，例如由 Button 相關來源整理成 `02-notes/07-components/button/`，是整個筆記包的主幹知識。 |
| `02-notes/indexes/` | 主題索引，例如元件索引、API 索引、模式索引與閱讀入口。 |
| `03-architecture/` | 組件庫整體架構、模組分層、目錄組織、依賴關係與設計思想。 |
| `04-plugin-system/` | Vue plugin 安裝流程、全局註冊、配置注入與插件化設計。 |
| `05-composables/` | composables/hooks 的抽象方式、復用策略、狀態管理與事件封裝。 |
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
| `17-demos/` | 根據 `notes/` 生成可執行或可參考的範例程式。 |
| `18-practice/` | 根據 `notes/` 生成練習題、實作任務、改錯題、重構題。 |
| `19-review/` | 根據 `notes/` 生成重點摘要、問答題、填空題、複習卡片。 |
| `20-supplements/` | 根據 `notes/` 延伸補充底層原理、進階觀念、相關比較與實務案例。 |
| `21-prompts/` | 用於源碼閱讀、筆記整理、仿作實作、重構分析的提示詞集合。 |
| `21-prompts/system/` | 系統規則提示詞，存放穩定的 AI 角色設定與總體規則，例如語言、教學風格與輸出原則。 |
| `21-prompts/workflows/` | 工作流程提示詞，存放完整生成流程，例如依主題/模組來源範圍生成對應的 `02-notes/` 筆記，或從 `02-notes/` 生成練習與複習材料。 |
| `21-prompts/formats/` | 輸出格式提示詞，存放固定輸出格式，例如教書型筆記、練習題、複習卡與 API 表格格式。 |
| `21-prompts/requests/` | 實際提問範例，存放可直接使用或參考的具體提問，例如針對某章節、某份原始資料或某個任務的問題。 |
| `22-appendix/` | 根據 `notes/` 生成查表型資料，方便快速查找名詞、API、設定與實作對照。 |
| `22-appendix/glossary/` | 名詞表，例如 plugin、provide/inject、teleport、composable。 |
| `22-appendix/api-tables/` | API 查表，例如全局 API、命令式 API、方法參數與回傳值。 |
| `22-appendix/component-tables/` | 元件查表，例如 props、events、slots、expose。 |
| `22-appendix/type-tables/` | 型別查表，例如 props type、emit type、instance type 與 public type。 |
| `22-appendix/command-tables/` | 指令與命令查表，例如 npm scripts、build、test、release 指令。 |
| `22-appendix/config-examples/` | 設定檔範例，例如 Vite、tsconfig、package exports、按需載入設定。 |
| `22-appendix/style-tables/` | 樣式查表，例如 class 命名、CSS variables、尺寸、狀態與 theme token。 |

## 內容分層原則

- `origin/`：未消化或半結構化的來源材料。
- `notes/`：依主題/模組消化來源材料後形成的教書型主線筆記，是整個筆記包的知識主幹。
- 專題目錄：針對某一類組件庫能力進行深入拆解。
- `demos/`、`practice/`、`review/`：根據 `notes/` 生成展示、練習與複習材料。
- `supplements/`：根據 `notes/` 延伸補充底層原理、進階觀念、相關比較與實務案例。
- `appendix/`：根據 `notes/` 生成查表型資料，例如名詞表、API 表、指令表與設定檔範例。
