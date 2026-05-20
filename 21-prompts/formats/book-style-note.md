# 書本型教學筆記格式

這份格式用於 `02-notes/` 的主幹筆記。每篇筆記應該像一個技術書章節，能獨立閱讀，也能回到來源檔案查證。

## 建議檔案命名

```txt
02-notes/<主題分類>/<主題名稱>/<章節序號>-<英文短名>.md
```

例如：

```txt
02-notes/07-components/button/01-button-overview.md
```

## 標準結構

```md
# <主題名稱> <章節名稱>

這篇筆記說明......讀完後應該能理解......

## 1. Learning Goal 學習目標

- ...
- ...
- ...

## 2. Source Scope 來源範圍

| 類型 | 路徑 | 閱讀目的 |
| --- | --- | --- |
| Component | `...` | ... |
| Style | `...` | ... |
| Type | `...` | ... |
| Test | `...` | ... |

## 3. Concept First 先建立概念

先用自然語言說明這個主題在組件庫中的位置、責任與要解決的問題。

## 4. Structure Map 結構地圖

用表格或簡短流程圖說明檔案之間的關係。

## 5. Public API 對外介面

整理 props、events、slots、expose、全域 API 或 install API。若該主題沒有某類 API，明確說明沒有從來源看到。

## 6. Implementation Walkthrough 實作拆解

依照讀者理解順序拆解核心程式碼，不要只照檔案順序逐行摘要。

## 7. Data and Event Flow 資料與事件流

說明資料如何進入、如何轉換、如何影響渲染，以及事件如何對外通知。

## 8. Style and State 樣式與狀態

說明 class、狀態樣式、尺寸、主題或 Less mixin 如何對應實作。

## 9. Type and Test Notes 型別與測試觀察

整理型別宣告與測試案例如何補充理解 public surface 與邊界行為。

## 10. Design Patterns 設計模式

抽出可複用的組件庫設計模式，例如：

- props 驅動 class。
- wrapper component 與 group component。
- public API 與內部實作分離。
- 樣式 mixin 與 component style 分層。

## 11. Common Pitfalls 常見誤解

列出閱讀或仿作時容易混淆的地方。

## 12. Summary 總結

用 3 到 6 點整理這篇筆記最重要的理解。

## 13. Follow-up 後續分流

列出應該放到其他主題或之後再寫的內容。
```

## 寫作要求

- 每個大章節都要有教學目的，不要只貼表格。
- 程式碼片段只放能支撐解釋的最小片段。
- 對於來源沒有提供的內容，不要補成肯定句。
- 若某章節不適用，保留標題並用一小段說明原因。
- 總結要回扣「這個主題教會我們什麼組件庫設計能力」。
