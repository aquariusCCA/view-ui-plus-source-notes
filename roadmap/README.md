# Roadmap

本目錄用來管理 `View UI Plus` 源碼學習的整體路線、階段規劃與進度追蹤。

`roadmap/` 不是正式筆記區，也不是實作區，而是用來回答：

- 目前學習到哪個階段？
- 下一步應該學什麼？
- 哪些元件已經完成？
- 哪些主題先暫存，不急著處理？

## 目錄定位

```text
roadmap/
  README.md
  00-learning-overview.md
  01-phase-plan.md
  02-component-study-order.md
  03-progress-tracker.md
  06-backlog.md
```

## 使用原則

- 只記錄學習方向、階段規劃、元件順序與進度。
- 不放正式源碼筆記，正式筆記放在 `docs/`。
- 不放實作程式碼，元件仿寫放在 `apps/01-clone-practice/`。
- 不放 AI 協作流程與提示詞，相關內容放在 `prompts/`。
- 不設計過度固定的學習流程，避免讓學習被流程綁住。

## 目前主線

目前優先推進：

```text
01-clone-practice
```

也就是先從 View UI Plus 元件開始仿寫，理解元件結構、props、events、slots、樣式與互動邏輯。

暫時不要急著進入：

```text
02-refactor-practice
03-enterprise-wrapper
```

等完成一批元件仿寫後，再回頭整理共用邏輯與企業級封裝方向。
