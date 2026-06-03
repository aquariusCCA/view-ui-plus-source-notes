# Atomic 轉正式筆記

把下方模板貼給 AI，並填入本次要處理的章節路徑。完整生成規則、輸出格式、來源限制與驗收標準以 `99-prompts/_drafts/atomic-to-formal-note-draft.md` 為準。

## 用途

用來請 AI 將指定章節的 `<章節>/atomic/*.md` atomic notes，整理成 `<章節>/*.md` 正式筆記。

這份模板採用兩階段流程：

- 第一階段先輸出正式筆記生成提案，不建立、修改或刪除任何檔案。
- 第二階段在使用者確認提案後，才依照確認後的提案產生正式筆記。

## 適用場景

- `<章節>/atomic/*.md` 已完成或大致完成內容審查，準備進入正式筆記生成。
- 需要把多篇 atomic notes 合併成有教學主線的正式筆記。
- 需要判斷 atomic notes 應該合併、拆分或不納入正式筆記。
- 需要產生可供 `20-imitation/`、`21-enterprise-wrappers/`、`22-review-and-practice/` 使用的基準筆記。
- 需要讓正式筆記保留源碼感、型別對照、樣式對照、設計啟發與複習題。
- 需要把正式筆記轉成可實戰使用的場景、實務判斷標準與操作檢查任務。

## 不適用場景

- 直接把 `<章節>/origin/*.md` 切分成 atomic notes。
- 審查或修正 `<章節>/atomic/*.md` 的技術錯誤。
- 修改、刪除或搬移 `<章節>/origin/*.md` 或 `<章節>/origin/assets/`。
- 產生完整仿寫任務、企業封裝練習、面試題或重構練習。
- 整理 `01-origin/` 全域來源資料。
- 同步 `00-roadmap/progress-tracker.md`。

注意：正式筆記內的小型實作檢查任務、實務判斷清單與可轉下游練習的問題是必要內容；它們不等同於產生完整下游材料。

## 使用方式

1. 將「第一階段正式筆記生成提案」貼給具備檔案系統存取能力的 AI。
2. 填入 `章節路徑`、`atomic 輸入範圍`、`origin 對照範圍` 與 `正式筆記輸出範圍`。
3. 第一輪只要求 AI 輸出生成提案，不允許改檔。
4. 檢查 AI 回報的預計正式筆記檔案、主線、對應 atomic、來源依據、實戰使用場景、實作檢查任務與需要人工確認的內容。
5. 確認提案後，再貼「第二階段產生正式筆記」。
6. 第二階段完成後檢查 git diff，確認只建立或更新指定章節的 `<章節>/*.md`，沒有改動 atomic、origin、assets、下游材料或 tracker。
7. 檢查正式筆記是否包含實戰使用場景、實作檢查任務或實務判斷清單，避免只停留在理解型內容。

## 第一階段正式筆記生成提案

```text
請依照 `99-prompts/_drafts/atomic-to-formal-note-draft.md` 的完整規則，協助我為下列章節產生正式筆記生成提案。

1. 章節路徑：
2. atomic 輸入範圍：
3. origin 對照範圍：
4. 正式筆記輸出範圍：
5. 本次限制或補充：
6. 我希望 AI 特別注意：

本輪只執行第一階段：請掃描指定的 `<章節>/atomic/*.md`，並輸出正式筆記生成提案，不要建立、修改或刪除任何檔案。

請只把指定章節的 `<章節>/atomic/*.md` 當作主要輸入來源。
請將同章節的 `<章節>/origin/*.md` 與 `<章節>/origin/assets/` 作為唯讀對照來源，不要修改 origin 或 assets。

必要時可以查閱 atomic 或 origin 明確引用的 View UI Plus 原始碼、官方文件或全域來源，例如 `01-origin/source/` 與 `01-origin/docs/`，但請標明具體路徑，並區分「來源明確支持」與「根據來源推論」。

請不要把既有 `<章節>/*.md` 正式筆記、`20-imitation/`、`21-enterprise-wrappers/`、`22-review-and-practice/`、`99-prompts/` 或 `00-roadmap/` 當作正式筆記技術內容的主要來源。

請不要產生完整正式筆記正文，不要修改下游材料，不要同步 `00-roadmap/progress-tracker.md`。
```

## 第二階段產生正式筆記

```text
我確認以上正式筆記生成提案。請依照已確認的提案，並依照 `99-prompts/_drafts/atomic-to-formal-note-draft.md` 的第二階段完整規則，產生正式筆記。

1. 章節路徑：
2. atomic 輸入範圍：
3. origin 對照範圍：
4. 正式筆記輸出範圍：
5. 已確認的提案範圍：
6. 本次限制或補充：
7. 我希望 AI 回報：

請只建立或更新確認後提案中的 `<章節>/*.md`。
請不要修改 `<章節>/atomic/*.md`。
請不要修改 `<章節>/origin/*.md` 或 `<章節>/origin/assets/`。
請不要修改 `20-imitation/`、`21-enterprise-wrappers/`、`22-review-and-practice/`、`01-origin/`、`00-roadmap/` 或 `99-prompts/`。
請不要同步 `00-roadmap/progress-tracker.md`。

若提案中的目標正式筆記已存在，且我沒有明確允許覆蓋或合併，請先回報既有檔案清單並停止，等待我確認是否覆蓋、合併或改用其他檔名。

若生成正式筆記時發現 atomic 內容有技術錯誤、來源不足或主題邊界問題，請標記為「需要回到 atomic review 處理」，不要自行修改 atomic，也不要把沒有來源支持的內容寫進正式筆記。
```

## 長章節先建立 inventory

如果指定章節的 atomic notes 太多，超過單次上下文可安全處理的範圍，請先使用這段提問。

```text
請依照 `99-prompts/_drafts/atomic-to-formal-note-draft.md` 的長章節處理規則，先為下列章節建立正式筆記生成 inventory。

1. 章節路徑：
2. atomic 掃描範圍：
3. origin 對照範圍：
4. 正式筆記輸出範圍：
5. 本次限制或補充：
6. 我希望 AI 回報：

本輪只建立 inventory 與分批生成建議，不要輸出完整正式筆記生成提案，不要建立、修改或刪除任何檔案。

請列出每個 atomic 檔案的主題、建議對應正式筆記、建議生成批次與需要人工確認的主題邊界。
請提出分批生成順序，等待我確認批次後，再執行第一批正式筆記生成提案。

請不要修改 `<章節>/atomic/*.md`、`<章節>/origin/*.md`、`<章節>/origin/assets/`、正式筆記、下游材料或 `00-roadmap/progress-tracker.md`。
```

## 可替換欄位

| 欄位 | 說明 | 範例 |
| --- | --- | --- |
| `章節路徑` | 要處理的章節根目錄，不含 `atomic` 或 `origin` 子路徑 | `07-basic-components/` |
| `atomic 輸入範圍` | 要使用的 atomic 目錄或單一 Markdown 文件 | `07-basic-components/atomic/` |
| `origin 對照範圍` | 唯讀對照的 origin 目錄或單一 Markdown 文件 | `07-basic-components/origin/` |
| `正式筆記輸出範圍` | 預計建立或更新正式筆記的章節根目錄 | `07-basic-components/` |
| `已確認的提案範圍` | 第二階段要執行的提案範圍；可填全部或指定幾個正式筆記檔案 | `全部提案` |
| `本次限制或補充` | 額外限制，例如只處理單一 atomic、不要覆蓋既有檔案、只輸出 inventory | `只處理 Button 相關 atomic` |
| `我希望 AI 特別注意` | 第一階段需要加強檢查的面向 | `請特別注意 runtime 與 d.ts 型別落差，並為每篇規劃實戰檢查任務` |
| `我希望 AI 回報` | 需要特別注意的結果或後續檢查重點 | `請列出需要回到 atomic review 的問題` |

常見目標路徑範例：

```text
03-architecture/
03-architecture/atomic/
03-architecture/origin/

07-basic-components/
07-basic-components/atomic/
07-basic-components/origin/
07-basic-components/atomic/02-button-props.md
```
