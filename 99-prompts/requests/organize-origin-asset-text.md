# origin 資產 Alt 與連結文字整理

把下方模板貼給 AI，並填入本次要處理的 `origin` 目標路徑。完整 alt、附件連結文字、排除項目與輸出格式以 `99-prompts/_drafts/origin-asset-alt-and-link-text-draft.md` 為準。

## 用途

用來請 AI 整理 `origin` 層 Markdown 文件中的本地資產文字描述，包含圖片 alt、HTML `<img>` 的 `alt` 屬性，以及本地 PDF、Excel、Word、影音、壓縮檔或其他附件的連結文字。

## 適用場景

- `<章節>/origin/` 或 `01-origin/` 的本地資產路徑已完成標準化，但圖片 alt 或附件連結文字仍過於籠統。
- Markdown 或 HTML 內仍有低品質描述，例如 `圖片`、`截圖`、`下載`、`PDF`、`file`。
- 需要在產生 atomic、正式筆記或下游材料前，先讓來源資料中的資產描述更清楚。

## 不適用場景

- 重新命名、搬移、刪除或新增資產檔案。
- 改寫資產路徑、檔名、hash 或目錄名稱。
- 重寫源碼學習內容、補充 View UI Plus 知識或改寫正式教學文字。
- 重新命名 `01-origin/source/view-ui-plus-v1.3.20/` 內的原始碼副本、測試資料或 fixture。
- 重生成 atomic、正式筆記、仿寫任務、企業封裝練習、複習材料或同步 `00-roadmap/progress-tracker.md`。

## 使用方式

1. 將下方「可直接複製的提問」貼給具備檔案系統存取能力的 AI。
2. 填入 `處理範圍`、`目標路徑`，必要時填入 `資產根目錄`。
3. 一次只處理一個章節 origin 或一個明確的 `01-origin` 範圍。
4. 執行後檢查 git diff，確認只改了 alt、HTML `alt` 或本地附件連結文字，沒有改資產路徑或實體檔名。

## 可直接複製的提問

```text
請依照 `99-prompts/_drafts/origin-asset-alt-and-link-text-draft.md` 的完整規則，協助整理下列 origin 本地資產的 alt 與附件連結文字。

1. 處理範圍：主題章節 origin / 全域來源 origin
2. 目標路徑：
3. 資產根目錄：
4. 本次限制或補充：
5. 我希望 AI 回報：

請只處理「目標路徑」指定的 Markdown 文件或 origin 目錄，不要處理其他章節、其他資料夾或下游內容。

請只改寫圖片 alt、HTML `alt` 屬性或本地附件連結文字；不要改資產路徑、不要改實體檔名、不要重寫教材正文、不要同步 `00-roadmap/progress-tracker.md`。
```

## 可替換欄位

| 欄位 | 說明 | 範例 |
| --- | --- | --- |
| `處理範圍` | 本次要處理主題章節 origin，或 `01-origin` 全域來源 origin | `主題章節 origin` |
| `目標路徑` | 要處理的 origin 目錄或單一 Markdown 文件 | `03-architecture/origin/` |
| `資產根目錄` | 可留空讓 AI 依 draft 推導；需要限制時可明確指定 | `03-architecture/origin/assets/` |
| `本次限制或補充` | 額外限制，例如只處理圖片 alt、只檢查不改檔、只處理單一 Markdown | `只處理 01-project-structure.md` |
| `我希望 AI 回報` | 需要特別注意的結果或後續檢查重點 | `請列出需要人工確認的圖片與附件` |

常見目標路徑範例：

```text
03-architecture/origin/
03-architecture/origin/01-project-structure.md
01-origin/
01-origin/docs/view-ui-plus-api-snapshot.md
```
