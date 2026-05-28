# 業務封裝邊界

## 學習目標

這篇整理業務封裝的邊界判斷。企業後台最容易出問題的不是沒有封裝，而是把頁面、元件、service、hooks、權限、樣式、後端欄位全部塞進同一個「通用元件」。

## 分層判斷

| 層級 | 適合放什麼 |
| --- | --- |
| 基礎元件 | 無業務語意的 UI 能力，例如 Button、Input、Table |
| 進階元件 | 多個基礎元件組成的通用場景，例如 Login、DescriptionList、FooterToolbar |
| 業務元件 | 後台常見但仍可抽象的流程，例如 SearchForm、CrudTable、BusinessModal |
| composable | 狀態機、請求、分頁、selection、modal open/close |
| service | API 呼叫、response 轉換、錯誤碼處理 |
| page | 具體業務規則、路由參數、一次性組合 |

## 應該留在頁面的邏輯

以下邏輯通常不適合放進通用元件：

- 某個業務 API 的特殊欄位命名。
- 某個頁面的路由參數解析。
- 某個角色才有的例外顯示規則。
- 單一頁面才使用的複雜 if/else。
- 需要跨多個模組協調的流程狀態。

這些邏輯可以由頁面傳入 schema、adapter、slot 或 callback。

## 適合抽成 composable 的邏輯

如果邏輯不直接渲染 UI，但在多個業務元件或頁面重複出現，就適合抽成 composable：

```txt
usePagination
useSelection
useRequest
useCrud
useModalForm
useQueryForm
usePermission
```

composable 可以持有狀態和方法，元件則專注於渲染與事件契約。

## 本章與 21 章的界線

`13-pro-and-business-components/` 偏「分析與設計」：

- 讀 View UI Plus 內建 pro 元件。
- 整理 SearchForm、CrudTable、BusinessModal 的設計問題。
- 建立 API、schema、事件與邊界判斷。

`21-enterprise-wrappers/` 偏「實作練習」：

- 實際封裝一個 SearchForm。
- 實際封裝一個 CrudTable。
- 實際封裝一個 BusinessModal。
- 實際寫型別、測試與使用範例。

## 複習題

1. 為什麼業務元件不應直接依賴特定後端 response 格式？
2. 哪些狀態適合放 composable，而不是元件內？
3. 什麼情況下「通用元件」反而會降低維護性？
4. 13 章和 21 章的內容應該如何分工？
5. 如果兩個頁面只有 60% 相似，應該抽通用元件還是抽 composable？
