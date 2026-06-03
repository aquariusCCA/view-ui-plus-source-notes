# Atomic 內容審查

把下方模板貼給 AI，並填入本次要審查的章節路徑。完整審查規則、輸出格式、修正限制與驗收標準以 `99-prompts/_drafts/atomic-content-review-draft.md` 為準。

## 用途

用來請 AI 審查指定章節的 `<章節>/atomic/*.md` atomic notes 是否正確、可追溯、主題邊界清楚，並判斷是否足以進入後續 `<章節>/*.md` 正式筆記生成流程。

這份模板採用兩階段流程：

- 第一階段只輸出內容審查報告，不建立、修改或刪除任何檔案。
- 第二階段在使用者確認問題 ID 後，才修正指定章節的 `<章節>/atomic/*.md`。

## 適用場景

- 已有 `<章節>/atomic/*.md`，需要在產生正式筆記前做內容審查。
- 需要比對 `<章節>/origin/*.md`，確認 atomic 是否忠實保留來源重點。
- 需要檢查技術事實、API、Props、Emits、Slots、型別、樣式、事件流程或範例是否可靠。
- 需要檢查 atomic 主題是否過大、過小、混雜、重複或歸屬錯誤。
- 需要檢查 atomic note 內的本地資產引用是否符合 `../origin/assets/...` 規則。

## 不適用場景

- 直接產生 `<章節>/*.md` 正式教學筆記。
- 直接把 origin 筆記切分成 atomic notes。
- 修改、刪除或搬移 `<章節>/origin/*.md` 或 `<章節>/origin/assets/`。
- 產生仿寫任務、企業封裝練習、複習題、面試題或重構練習。
- 整理 `01-origin/` 全域來源資料。
- 同步 `00-roadmap/progress-tracker.md`。

## 使用方式

1. 將「第一階段內容審查報告」貼給具備檔案系統存取能力的 AI。
2. 填入 `章節路徑`、`atomic 審查範圍` 與 `origin 對照範圍`。
3. 第一輪只要求 AI 輸出審查報告，不允許改檔。
4. 檢查 AI 回報的問題 ID，例如 `ACR-001`、`ACR-002`。
5. 確認要修正的問題 ID 後，再貼「第二階段修正 atomic notes」。
6. 第二階段完成後檢查 git diff，確認只修改指定章節的 `<章節>/atomic/*.md`，沒有改動 origin、assets、正式筆記、下游材料或 tracker。

## 第一階段內容審查報告

```text
請依照 `99-prompts/_drafts/atomic-content-review-draft.md` 的完整規則，協助我審查下列章節的 atomic notes。

1. 章節路徑：
2. atomic 審查範圍：
3. origin 對照範圍：
4. 本次限制或補充：
5. 我希望 AI 特別檢查：

本輪只執行第一階段：請輸出內容審查報告，不要建立、修改或刪除任何檔案。

請只把指定章節的 `<章節>/atomic/*.md` 當作主要審查對象。
請將同章節的 `<章節>/origin/*.md` 與 `<章節>/origin/assets/` 作為唯讀對照來源，不要修改 origin 或 assets。

必要時可以查閱 atomic 或 origin 明確引用的 View UI Plus 原始碼、官方文件或全域來源，例如 `01-origin/source/` 與 `01-origin/docs/`，但請標明具體路徑，並區分「來源明確支持」與「根據來源推論」。

請不要把 `<章節>/*.md` 正式筆記、`20-imitation/`、`21-enterprise-wrappers/`、`22-review-and-practice/`、`99-prompts/` 或 `00-roadmap/` 當作 atomic 技術判斷的主要來源。

請不要產生正式筆記，不要修改下游材料，不要同步 `00-roadmap/progress-tracker.md`。

請依照草稿規則輸出審查摘要、問題清單、問題詳情、需要人工確認的問題、可留到正式筆記生成時處理的項目、不建議本輪修正的內容，以及第二階段修正建議。
```

## 第二階段修正 atomic notes

```text
我確認修正以下問題 ID：

<問題 ID 清單>

請依照 `99-prompts/_drafts/atomic-content-review-draft.md` 的第二階段完整規則，只修正已確認的問題 ID。

1. 章節路徑：
2. atomic 修正範圍：
3. 已確認修正問題 ID：
4. 本次限制或補充：
5. 我希望 AI 回報：

請只修改指定章節的 `<章節>/atomic/*.md`。
請不要修改 `<章節>/origin/*.md` 或 `<章節>/origin/assets/`。
請不要產生 `<章節>/*.md` 正式筆記。
請不要修改 `20-imitation/`、`21-enterprise-wrappers/`、`22-review-and-practice/`、`01-origin/`、`00-roadmap/` 或 `99-prompts/`。
請不要同步 `00-roadmap/progress-tracker.md`。

若修正會大幅改變 atomic note 的段落結構、主題邊界、檔案拆分、檔案合併或內容組織，請先提出修正方案，等待我再次確認後再修改。

若修正需要補充 origin 未支持的新技術內容，請標記為「需要人工確認」，不要自行加入。

完成後請回報修正摘要、修正清單與檢查結果，並說明是否建議後續檢查 `00-roadmap/progress-tracker.md`。不要直接同步 tracker。
```

## 長章節先建立 inventory

如果指定章節的 atomic notes 太多，超過單次上下文可安全審查的範圍，請先使用這段提問。

```text
請依照 `99-prompts/_drafts/atomic-content-review-draft.md` 的長章節處理規則，先為下列章節建立 atomic inventory。

1. 章節路徑：
2. atomic 掃描範圍：
3. origin 對照範圍：
4. 本次限制或補充：
5. 我希望 AI 回報：

本輪只建立 inventory 與分批審查建議，不要輸出完整內容審查結論，不要建立、修改或刪除任何檔案。

請列出每個 atomic 檔案的主題、來源標記、疑似問題、assets 引用與建議審查批次。
請提出分批審查順序，等待我確認批次後，再執行第一批內容審查。

請不要修改 `<章節>/atomic/*.md`、`<章節>/origin/*.md`、`<章節>/origin/assets/`、正式筆記、下游材料或 `00-roadmap/progress-tracker.md`。
```

## 可替換欄位

| 欄位 | 說明 | 範例 |
| --- | --- | --- |
| `章節路徑` | 要審查的章節根目錄，不含 `atomic` 或 `origin` 子路徑 | `07-basic-components/` |
| `atomic 審查範圍` | 要審查的 atomic 目錄或單一 Markdown 文件 | `07-basic-components/atomic/` |
| `atomic 修正範圍` | 第二階段允許修改的 atomic 目錄或單一 Markdown 文件 | `07-basic-components/atomic/02-button-props.md` |
| `origin 對照範圍` | 第一階段唯讀對照的 origin 目錄或單一 Markdown 文件 | `07-basic-components/origin/` |
| `已確認修正問題 ID` | 第二階段要修正的問題 ID，可填單一或多個 | `ACR-001、ACR-003` |
| `本次限制或補充` | 額外限制，例如只檢查技術事實、只檢查資產路徑、不要查閱全域來源 | `只檢查 Button 相關 atomic` |
| `我希望 AI 特別檢查` | 第一階段需要加強檢查的面向 | `請特別檢查 props 與 emits 說明是否和源碼一致` |
| `我希望 AI 回報` | 需要特別注意的結果或後續檢查重點 | `請列出需要人工確認的推論` |

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
