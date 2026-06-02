# origin 資產標準化

把下方模板貼給 AI，並填入本次要處理的 `origin` 目標路徑。完整資產命名、引用更新、排除項目與輸出格式以 `99-prompts/_drafts/origin-asset-standardization-draft.md` 為準。

## 用途

用來請 AI 標準化 `origin` 層 Markdown 文件中的本地資產引用，包含圖片、PDF、Excel、Word、影音、壓縮檔或其他可確認存在於資產根目錄內的輔助檔案。

## 適用場景

- `<章節>/origin/` 或 `01-origin/` 的本地資產已放入資產根目錄，但檔名或引用路徑尚未標準化。
- Markdown 或 HTML 內仍有舊格式路徑，例如 `./images/a.png`、`./pdfs/a.pdf`、`./file.zip`。
- 需要在整理圖片 alt、附件連結文字、atomic 或正式筆記前，先確保資產不斷鏈。

## 不適用場景

- 重寫源碼學習內容、補充 View UI Plus 知識或改寫教學文字。
- 重新命名 `01-origin/source/view-ui-plus-v1.3.20/` 內的原始碼副本、測試資料或 fixture。
- 重生成 atomic、正式筆記、仿寫任務、企業封裝練習、複習材料或同步 `00-roadmap/progress-tracker.md`。

## 使用方式

1. 將下方「可直接複製的提問」貼給具備檔案系統存取能力的 AI。
2. 填入 `處理範圍`、`目標路徑`，必要時填入 `資產根目錄`。
3. 一次只處理一個章節 origin 或一個明確的 `01-origin` 範圍。
4. 執行後檢查 git diff，確認實體資產檔名與 Markdown/HTML 引用已同步更新。

## 可直接複製的提問

```text
請依照 `99-prompts/_drafts/origin-asset-standardization-draft.md` 的完整規則，協助標準化下列 origin 本地資產。

1. 處理範圍：主題章節 origin / 全域來源 origin
2. 目標路徑：
3. 資產根目錄：
4. 本次限制或補充：
5. 我希望 AI 回報：

請只處理「目標路徑」指定的 Markdown 文件或 origin 目錄，不要處理其他章節、其他資料夾或下游內容。
```

## 可替換欄位

| 欄位 | 說明 | 範例 |
| --- | --- | --- |
| `處理範圍` | 本次要處理主題章節 origin，或 `01-origin` 全域來源 origin | `主題章節 origin` |
| `目標路徑` | 要處理的 origin 目錄或單一 Markdown 文件 | `03-architecture/origin/` |
| `資產根目錄` | 可留空讓 AI 依 draft 推導；需要限制時可明確指定 | `03-architecture/origin/assets/` |
| `本次限制或補充` | 額外限制，例如只處理圖片、只檢查不改檔、只處理單一 Markdown | `只處理 01-project-structure.md` |
| `我希望 AI 回報` | 需要特別注意的結果或後續檢查重點 | `請特別列出可能仍引用舊路徑的正式筆記` |

常見目標路徑範例：

```text
03-architecture/origin/
03-architecture/origin/01-project-structure.md
01-origin/
01-origin/docs/view-ui-plus-api-snapshot.md
```
