# Origin 原始筆記原子化切分

把下方模板貼給 AI，並填入本次要處理的章節路徑。完整切分規則、輸出格式、資產路徑限制與驗收標準以 `99-prompts/_drafts/origin-to-atomic-notes-draft.md` 為準。

## 用途

用來請 AI 將指定章節的 `<章節>/origin/*.md` 原始 Markdown 筆記，重新切分、合併、排序與輕度修正為 `<章節>/atomic/*.md` atomic notes。

這份模板採用兩階段流程：

- 第一階段先輸出切分提案，不建立、修改或刪除任何檔案。
- 第二階段在使用者確認提案後，才依照確認後的提案產生 atomic notes。

## 適用場景

- `<章節>/origin/*.md` 中有單篇過長、單篇過短、章節切分不合理或內容錯置的情況。
- 多篇 origin 筆記之間主題重疊，需要重新合併為更清楚的 atomic 主題。
- 需要在產生 `<章節>/*.md` 正式筆記前，先建立可追溯、粒度穩定的 atomic 候選稿。
- 該章節的本地資產路徑與 alt / 附件連結文字已大致整理完成，或至少能在 atomic 生成時安全轉換為 `../origin/assets/...`。

## 不適用場景

- 直接產生 `<章節>/*.md` 正式教學筆記。
- 直接產生仿寫任務、企業封裝練習、複習題、面試題或重構練習。
- 整理 `01-origin/` 全域來源資料。
- 重寫源碼學習內容、補充 View UI Plus 新知識或把 origin 深度改寫成正式教材。
- 修改、刪除或搬移 `<章節>/origin/*.md`、`<章節>/origin/assets/` 或任何下游內容。
- 同步 `00-roadmap/progress-tracker.md`。

## 使用方式

1. 將「第一階段切分提案」貼給具備檔案系統存取能力的 AI。
2. 填入 `章節路徑`，必要時填入 `本次限制或補充`。
3. 第一輪只檢查切分提案，不允許 AI 改檔。
4. 人工確認提案後，再貼「第二階段產生 atomic notes」。
5. 第二階段完成後檢查 git diff，確認只建立或更新 `<章節>/atomic/*.md`，沒有改動 origin、assets、正式筆記、下游材料或 tracker。

## 第一階段切分提案

```text
請依照 `99-prompts/_drafts/origin-to-atomic-notes-draft.md` 的完整規則，協助我處理下列章節的 origin 原始筆記原子化切分。

1. 章節路徑：
2. origin 目標路徑：
3. atomic 目標路徑：
4. 本次限制或補充：
5. 我希望 AI 回報：

本輪只執行第一階段：請掃描 `<章節>/origin/*.md` 並輸出切分提案，不要建立、修改或刪除任何檔案。

請只把指定章節的 `<章節>/origin/*.md` 當作原始資料來源；不要把既有 `<章節>/atomic/*.md`、`<章節>/*.md` 正式筆記、`20-imitation/`、`21-enterprise-wrappers/`、`22-review-and-practice/`、`01-origin/`、`00-roadmap/` 或 `99-prompts/` 當作切分依據。

請在提案中列出預計產生的 atomic 檔案、來源位置、拆分 / 合併 / 移動 / 保留 / 刪重理由、需要人工確認的內容、不納入 atomic 的內容與原因，以及涉及的本地資產引用。
```

## 第二階段產生 atomic notes

```text
我確認以上切分提案。請依照已確認的提案，並依照 `99-prompts/_drafts/origin-to-atomic-notes-draft.md` 的第二階段完整規則，產生 atomic notes。

1. 章節路徑：
2. origin 目標路徑：
3. atomic 目標路徑：
4. 已確認的提案範圍：
5. 本次限制或補充：
6. 我希望 AI 回報：

請只建立或更新確認後提案中的 `<章節>/atomic/*.md`；不要修改、刪除或搬移 `<章節>/origin/*.md`、`<章節>/origin/assets/`、`<章節>/*.md` 正式筆記、`20-imitation/`、`21-enterprise-wrappers/`、`22-review-and-practice/`、`01-origin/`、`00-roadmap/` 或 `99-prompts/`。

若提案中的目標 atomic 檔案已存在，請先回報既有檔案清單並停止，等待我確認是否覆蓋或如何合併。

請將 atomic note 內的本地資產引用由 `./assets/...` 轉為 `../origin/assets/...`；不要改寫外部網址、特殊連結、空連結或 fenced code block 內的示例路徑。

完成後請回報處理摘要、建立 / 更新清單、未處理項目、檢查結果，以及是否建議後續檢查 `00-roadmap/progress-tracker.md`。不要直接同步 tracker。
```

## 可替換欄位

| 欄位 | 說明 | 範例 |
| --- | --- | --- |
| `章節路徑` | 要處理的章節根目錄，不含 `origin` 或 `atomic` 子路徑 | `07-basic-components/` |
| `origin 目標路徑` | 要掃描的 origin 目錄或單一 Markdown 文件 | `07-basic-components/origin/` |
| `atomic 目標路徑` | 預計產生 atomic notes 的目錄 | `07-basic-components/atomic/` |
| `已確認的提案範圍` | 第二階段要執行的提案範圍；可填全部或指定幾個 atomic 檔案 | `全部提案` |
| `本次限制或補充` | 額外限制，例如只處理單一 origin 檔、只輸出 inventory、不要寫檔 | `只處理 01-button-source.md` |
| `我希望 AI 回報` | 需要特別注意的結果或後續檢查重點 | `請列出需要人工確認的主題重疊段落` |

常見目標路徑範例：

```text
03-architecture/
03-architecture/origin/
03-architecture/origin/01-project-structure.md
03-architecture/atomic/

07-basic-components/
07-basic-components/origin/
07-basic-components/atomic/
```
