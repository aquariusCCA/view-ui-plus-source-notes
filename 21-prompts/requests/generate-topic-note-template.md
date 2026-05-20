# 通用主題筆記生成請求模板

請依以下設定，協助我生成一篇 View UI Plus 的書本型、教學型、詳細筆記。

## 搭配使用的提示詞檔案

執行本請求時，請依序搭配以下提示詞檔案：

1. `21-prompts/system/view-ui-plus-note-assistant.md`
2. `21-prompts/workflows/generate-topic-note.md`
3. `21-prompts/formats/book-style-note.md`
4. 本檔案：`21-prompts/requests/generate-topic-note-template.md`

## 任務

將指定來源整理成 `02-notes/` 下的主幹學習筆記。請使用繁體中文，寫成技術書章節風格，不要只做摘要或 API 清單。

## 主題

- 主題名稱：`<填入主題名稱>`
- 目標輸出路徑：`02-notes/<分類>/<主題>/<章節序號>-<英文短名>.md`
- 筆記深度：書本型、教學型、詳細

## 來源範圍

請閱讀並整理以下來源：

```txt
<填入來源檔案路徑 1>
<填入來源檔案路徑 2>
<填入來源檔案路徑 3>
```

## 閱讀重點

請特別說明：

1. 這個主題在 View UI Plus 中的責任與位置。
2. 主要檔案之間的關係。
3. 對外 API 與內部實作如何分層。
4. props、events、slots、狀態、樣式與型別之間的對應。
5. 這個主題能學到哪些 Vue 3 組件庫設計模式。

## 邊界

- 不要生成練習題。
- 不要生成複習卡。
- 不要生成 demo。
- 不要延伸到企業級二次封裝，除非來源中直接相關。
- 對來源無法確認的內容，請明確標示。

## 輸出格式

請套用 `21-prompts/formats/book-style-note.md` 的格式。
