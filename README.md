# View UI Plus Source Notes

這個倉庫用來系統性學習 `View UI Plus`。

重點不是把筆記寫得漂亮，而是透過源碼閱讀、元件仿寫、重構與企業級二次封裝，真正理解一套 Vue 元件庫如何被設計、實作與維護。

## 專案目標

這是一個以 **做中學** 為核心的學習工作區。

學習過程會從 `View UI Plus` 原始碼出發，逐步建立：

- 元件源碼閱讀能力
- Vue 元件仿寫能力
- 元件設計與重構能力
- 面向公司業務場景的二次封裝能力

## 學習策略

整體學習分成三個階段：

1. `01-clone-practice`：先仿寫元件，理解元件的結構、props、events、slots、樣式與互動邏輯。
2. `02-refactor-practice`：累積一批仿寫元件後，複製或抽取出來做重構，練習拆分共用邏輯與改善設計。
3. `03-enterprise-wrapper`：最後封裝更接近公司業務場景的企業級元件，練習二次封裝與實務 API 設計。

目前優先推進第一階段：`01-clone-practice`。

## 目錄結構

```text
view-ui-plus-source-notes/
  roadmap/                  # 學習路線、階段規劃與進度整理
  origin/                   # View UI Plus 原始碼與來源材料
  apps/                     # 預計建立的 Vue 練習專案區
    01-clone-practice/      # 仿寫練習
    02-refactor-practice/   # 重構練習
    03-enterprise-wrapper/  # 企業級二次封裝練習
  docs/                     # 正式學習筆記
  prompts/                  # AI 協作規則、流程、格式、範例與檢查標準
```

> `apps/` 目前是預計建立的練習區。建立後會依照上面的三階段放置各自的 Vue 專案。

## 工作流程

建議每個元件依照以下順序推進：

1. 回到 `origin/` 查看 View UI Plus 原始碼。
2. 整理必要的源碼閱讀筆記到 `docs/`。
3. 在 `apps/01-clone-practice` 仿寫元件。
4. 累積一批元件後，轉入 `apps/02-refactor-practice` 做重構。
5. 最後在 `apps/03-enterprise-wrapper` 設計更接近實務需求的二次封裝版本。

## 維護原則

- `origin/` 保存來源材料，不直接混入個人改寫。
- `docs/` 保存正式筆記，內容應回到源碼依據，而不是只整理 API 表面。
- `prompts/` 保存 AI 協作規則，不取代正式筆記或實作專案。
- `apps/` 保存實作練習，用實際可跑的元件驗證理解是否成立。
- 每個階段都應保留清楚的輸入、輸出與學習重點，避免只留下零散結論。

## 目前重點

現階段先不要急著整理完整筆記系統，也不要直接跳到企業封裝。

優先目標是建立 `01-clone-practice`，從 View UI Plus 的元件開始仿寫，透過實作把源碼中的設計選擇轉成自己的理解。等仿寫出一批元件後，再把成果帶到重構與企業封裝階段。
