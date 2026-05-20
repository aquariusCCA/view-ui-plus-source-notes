# Prompts 提示詞使用說明

這個資料夾存放用來整理 View UI Plus 學習資料的提示詞。現階段只先服務一個核心目標：依指定主題與來源範圍，生成 `02-notes/` 下的書本型、教學型、詳細筆記。

## 建議使用順序

1. 先使用 `system/view-ui-plus-note-assistant.md` 作為穩定角色與總體規則。
2. 再使用 `workflows/generate-topic-note.md` 指定完整工作流程。
3. 需要固定輸出結構時，套用 `formats/book-style-note.md`。
4. 實際提問可參考 `requests/generate-topic-note-template.md` 或 `requests/generate-button-note.md`。

## 目前不優先處理

- 練習題、複習卡、查表資料與 demo 生成。
- 自動重構、企業級二次封裝方案與仿作任務。
- 大範圍跨模組總結。

這些內容之後可以從 `02-notes/` 的主幹筆記再延伸生成。
