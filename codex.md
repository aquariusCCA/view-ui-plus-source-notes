# Origin 原始筆記原子化切分提問模板

## 用途

用來請 AI 依照 `prompts/_drafts/origin-to-atomic-notes-draft.md` 的規則，將指定 `origin/<章節>/` 內的原始 Markdown 筆記重新切分、合併、修正為 atomic notes。

這份模板會要求 AI 採用兩階段流程：

- 第一階段先輸出切分提案，不建立檔案。
- 第二階段在使用者確認後，才產生 `atomic/<章節>/*.md`。

## 適用場景

當 `origin/<章節>/*.md` 中出現單篇過長、單篇過短、章節切分不合理、內容錯置或多篇筆記主題重疊時使用。

建議在執行本模板之前，先完成該章節的本地資產路徑標準化，避免 atomic note 生成後仍有大量斷鏈或不一致路徑。

## 不適用場景

不適合用來直接產生正式教學筆記。若 atomic notes 已完成，應改用 atomic-to-notes 類型的 Prompt 產生 `notes/<章節>/` 正式筆記。

## 使用方式

1. 將下方「可直接複製的提問」貼給具備檔案系統存取能力的 AI。
2. 將 `<章節路徑>` 替換成實際章節目錄。
3. 第一輪只要求輸出切分提案，人工確認後再要求產生檔案。
4. 執行後檢查 `atomic/<章節>/`、內容保真、asset 引用路徑與 git diff。

## 第一階段切分用提問

```text
請依照 prompts/_drafts/origin-to-atomic-notes-draft.md 的完整規則，處理以下章節：

<章節路徑>

請依照該 workflow 的第一階段規則，只輸出第一階段切分提案。

本輪只把 origin/<章節>/*.md 當作原始資料來源，不讀取既有 atomic/<章節>/*.md 作為切分依據，也不要建立、修改或刪除任何檔案。

等我確認後，第二階段才依照確認後的提案產生 atomic/<章節>/*.md。
```

## 第二階段確認用提問

```text
我確認以上切分提案，請依照已確認的提案，並依照 prompts/_drafts/origin-to-atomic-notes-draft.md 的第二階段完整規則，產生 atomic notes。

只建立或更新確認後提案中的 atomic files；不得修改 origin/<章節>/*.md、assets/ 或其他正式產出目錄。若目前環境不能直接寫入檔案，請改為輸出每個檔案的完整 Markdown。

若提案中的目標 atomic/<章節>/*.md 已存在，請先回報既有檔案清單並停止，等待我確認是否覆蓋。
```

## 可替換欄位

| 欄位 | 說明 | 範例 |
| --- | --- | --- |
| `<章節路徑>` | 要處理的 `origin/` 章節目錄 | `origin/二分查找/` |
