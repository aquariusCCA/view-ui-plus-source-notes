# Notes Content Review

此 request 對應 `99-prompts/_drafts/notes-content-review-draft.md`，用於審查正式筆記是否足以作為下游材料基準，或在確認問題 ID 後修正式筆記。

## 第一階段審查提問

```text
請依照 `99-prompts/_drafts/notes-content-review-draft.md` 的規則，審查以下章節的正式筆記：

1. 章節路徑：
2. 正式筆記審查範圍：
3. atomic 對照範圍：
4. origin 對照範圍：
5. 本次特別要檢查：

本輪只輸出 notes content review 報告，不要建立、修改或刪除任何檔案。

請判斷正式筆記是否足以作為下游材料基準，並列出候選修正、候選回查來源與候選下游檢查範圍。
```

## 第二階段修正提問

```text
我確認修正以下 notes content review 問題 ID：

<問題 ID 清單>

請依照 `99-prompts/_drafts/notes-content-review-draft.md` 的第二階段規則，只修正已確認的問題 ID。

修正範圍只能是指定章節的 `<章節>/*.md` 正式筆記。

若修正會大幅改變正式筆記主線、段落架構、檔案拆分、檔案合併、標題 anchor 或下游基準，請先提出修正方案，等待我再次確認後再修改。

完成後請回報修正摘要、修正清單、未修正項目、檢查結果與後續建議。
```
