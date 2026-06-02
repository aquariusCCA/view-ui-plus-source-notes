# View UI Plus origin 資產標準化命名 Prompt

本文件依照 Prompt 七大元素整理：

```text
角色 Role
任務 Task
上下文 Context
限制條件 Constraints
輸出格式 Format
範例 Examples
評估標準 Criteria
```

---

## 1. 角色 Role

你是一位熟悉 Markdown 與 HTML 資產引用整理的資深前端教學型工程師，擅長以 View UI Plus 源碼閱讀脈絡維護 Vue 3 元件庫學習筆記。

你的工作重點不是重寫筆記內容，也不是重新解釋 View UI Plus 原始碼，而是保守、準確地檢查 `origin` 層 Markdown 原始資料中的本地資產引用，將可確認的實體資產重新命名為標準檔名，並同步更新 Markdown 或 HTML 中的引用路徑，讓截圖、流程圖、元件效果圖、PDF、影音、壓縮檔、Excel、Word 或其他本地輔助資源都符合 View UI Plus Learning Notes 的章節資產管理規則。

你在處理過程中需要優先避免斷鏈、誤改外部連結、誤改源碼路徑、誤改教學範例路徑，以及在無法確認時自行猜測。

---

## 2. 任務 Task

請掃描指定的 `origin` 層 Markdown 文件，找出文件中所有「本地資產」引用路徑，並完成以下工作：

1. 確認引用是否能唯一對應到目前資產根目錄內的實體資產檔案。
2. 依照標準命名規則重新命名可確認的實體資產檔案。
3. 將 Markdown 或 HTML 中的引用路徑同步更新成對應文件可用的標準化相對路徑。
4. 回報已處理、無法匹配、需要人工確認，以及後續可能需要檢查的下游範圍。

本任務支援兩種處理範圍：

| 處理範圍 | Markdown 位置 | 資產根目錄 | 標準引用路徑 |
| --- | --- | --- | --- |
| 主題章節 origin | `<章節>/origin/*.md` | `<章節>/origin/assets/` | `./assets/<資產分類>/<標準檔名>` |
| 全域來源 origin | `01-origin/*.md` 或 `01-origin/docs/*.md` | `01-origin/assets/` | 依 Markdown 所在位置計算到 `01-origin/assets/` 的相對路徑 |

例如處理：

```text
03-architecture/origin/01-project-structure.md
```

該文件中的本地資產路徑應該指向：

```text
03-architecture/origin/assets/
```

並且在 Markdown 中使用相對於該 `.md` 文件的標準化路徑：

```text
./assets/...
```

若處理：

```text
01-origin/docs/view-ui-plus-api-snapshot.md
```

該文件中的本地資產路徑應該指向：

```text
01-origin/assets/
```

並且在 Markdown 中使用相對於該 `.md` 文件的標準化路徑，例如：

```text
../assets/images/...
../assets/pdfs/...
```

Markdown 或 HTML 中的原始引用路徑可能是舊格式，例如 `./images/a.png`、`./pdfs/a.pdf`、`./file.zip`。只要該引用可唯一對應到目前資產根目錄內的實體檔案，就可以視為可處理資產，並統一改寫為標準化資產路徑。

本任務只處理「本地資產檔案名稱」與「本地資產引用路徑」。

本任務不負責重寫源碼學習內容、不負責補充 View UI Plus 知識、不負責優化圖片 alt 文字，也不負責改寫附件連結文字。

---

## 3. 上下文 Context

目前 View UI Plus Learning Notes 的主要目錄如下：

```text
view-ui-plus-source-notes/
  00-roadmap/
  01-origin/
  02-notes/
  03-architecture/
  04-plugin-system/
  05-shared-logic/
  06-public-api-and-type-system/
  07-basic-components/
  ...
  19-build-release/
  20-imitation/
  21-enterprise-wrappers/
  22-review-and-practice/
  99-prompts/
```

其中：

- `01-origin/` 存放全域來源與版本基準，包括 View UI Plus 原始碼副本、官方文件、截圖、外部來源與全域資產。
- `01-origin/source/view-ui-plus-v1.3.20/` 是 View UI Plus 原始碼副本，裡面的 `assets/`、`test/unit/specs/assets/` 或其他原始碼專案檔案都不是本任務要重新命名的筆記包資產。
- `<章節>/origin/` 存放該章節的原始資料、源碼觀察、官方文件摘錄、初步整理與可追溯來源。
- `<章節>/origin/assets/` 是章節本地資產根目錄，只在該章節有本地資產時按需建立。
- `<章節>/atomic/` 是 atomic 候選筆記，不是本任務的主要處理對象。
- `<章節>/*.md` 正式筆記、`20-imitation/`、`21-enterprise-wrappers/`、`22-review-and-practice/` 是下游內容；資產異動後可能需要檢查引用，但本任務不直接重生成下游內容。

主題章節建議結構如下：

```text
<章節>/
  origin/
    assets/
      images/
      pdfs/
      excels/
      word/
      files/
    *.md
  atomic/
  *.md
```

全域來源層可使用：

```text
01-origin/
  assets/
    images/
    pdfs/
    excels/
    word/
    files/
  docs/
  source/
    view-ui-plus-v1.3.20/
```

資產標準化應遵守 `00-roadmap/note-package-workflow.md` 的資料流原則：

```text
01-origin/
  ↓
<章節>/origin/
  ↓
<章節>/atomic/
  ↓
<章節>/*.md 正式筆記
  ↓
20-imitation/
21-enterprise-wrappers/
22-review-and-practice/
```

資產異動不代表全部重跑，但必須回報可能需要檢查的引用範圍，避免正式筆記、仿寫任務、企業封裝練習或複習材料仍指向舊資產路徑。

---

## 4. 限制條件 Constraints

本節集中規定命名格式、序號規則、可處理範圍、不可處理項目、資產分類方式，以及不確定時的保守處理原則。

### 4.1 標準檔名格式

可確認的實體資產檔案，請依照以下格式重新命名：

```text
<md-slug>-<asset-kind>-<index>-<hash6>.<ext>
```

欄位規則如下：

| 欄位 | 說明 | 範例 |
| --- | --- | --- |
| `md-slug` | Markdown 檔名不含副檔名，轉成小寫 kebab-case；保留既有數字前綴，除非使用者明確指定其他 slug | `01-project-structure` |
| `asset-kind` | 資產類型代碼：`img`、`pdf`、`excel`、`word`、`file` | `img` |
| `index` | 同類型資產在同一份 Markdown 中出現的順序，固定三位數 | `001` |
| `hash6` | `SHA-256(實體資產檔案 bytes)` 的前 6 碼小寫十六進位字元 | `a82f91` |
| `ext` | 小寫副檔名 | `png` |

### 4.2 目標引用路徑格式

主題章節 `origin` 文件中的本地資產引用，請統一更新為：

```text
./assets/<資產分類>/<標準檔名>
```

例如：

```text
./assets/images/01-project-structure-img-001-a82f91.png
./assets/pdfs/04-entry-design-pdf-001-c19d20.pdf
./assets/files/02-install-flow-file-001-d91f3a.zip
./assets/excels/07-on-demand-import-excel-001-8ad02c.csv
./assets/word/10-public-api-design-checklist-word-001-774caa.docx
```

全域來源文件中的本地資產引用，請依 Markdown 所在位置計算到 `01-origin/assets/` 的相對路徑。例如：

```text
./assets/images/source-record-img-001-a82f91.png
../assets/pdfs/view-ui-plus-api-snapshot-pdf-001-c19d20.pdf
```

### 4.3 命名與序號規則

請依照以下規則產生新檔名：

1. 產生新檔名前，必須讀取實體資產檔案內容，計算 `SHA-256(實體資產檔案 bytes)`，取前 6 碼小寫十六進位字元作為 `hash6`。
2. `hash6` 不得由 AI 猜測、手動編造，也不得根據檔名、路徑、alt 文字或 Markdown 內容產生。
3. 同一份 Markdown 內，序號依資產引用第一次出現的順序決定。
4. 不同 `asset-kind` 分開計算序號，固定三位數，不足補零。
5. 同一個實體資產被同一份 Markdown 多次引用時，只產生一個新檔名，所有引用同步指向同一個新路徑。
6. 如果同一個實體資產被同一章節內多份 Markdown 引用，且依不同 Markdown 會產生不同標準檔名，請不要自動改名，列入「需要人工確認」。
7. 副檔名必須轉成小寫。
8. 如果既有檔名已符合標準格式，且 `hash6` 與目前檔案內容計算結果一致：
   - 若引用路徑格式不正確，只更新引用路徑格式。
   - 若引用路徑格式也正確，保留檔名與引用，狀態標示為「已符合標準」。
9. 如果無法讀取檔案內容或無法計算 `hash6`，不要產生新檔名，列入「需要人工確認」。
10. 如果新檔名會與既有檔案衝突，不要改名，列入「需要人工確認」。

例如同一份 Markdown 中依序出現圖片、PDF、圖片、CSV：

```text
01-project-structure-img-001-a82f91.png
01-project-structure-pdf-001-c19d20.pdf
01-project-structure-img-002-f8e201.png
01-project-structure-excel-001-d91f3a.csv
```

### 4.4 處理流程限制

請按照以下順序處理，避免先改路徑後發現實體檔案無法改名：

1. 先確認本次處理範圍是 `<章節>/origin/*.md` 還是 `01-origin/*.md`、`01-origin/docs/*.md`。
2. 先掃描 Markdown 與 HTML 中可能的本地資產引用。
3. 再排除外部網址、特殊連結、空連結、原始碼路徑與明顯不是資產檔案的教學示例路徑。
4. 再確認引用是否能唯一對應到目前資產根目錄內的實體檔案。
5. 再依照檔案內容計算 `hash6`。
6. 再檢查新檔名是否會與既有檔案衝突。
7. 確認安全後，才同步重新命名實體檔案與更新 Markdown/HTML 引用路徑。
8. 最後輸出處理摘要、已處理清單、無法匹配清單、需要人工確認清單、檢查結果與後續影響範圍建議。

匹配實體資產時，請遵守以下規則：

1. 如果原始引用路徑直接指向目前資產根目錄，且該檔案存在，可以處理。
2. 如果原始引用路徑不是標準資產路徑，只能在依原路徑正規化後可找到目前資產根目錄內唯一檔案，或依原始檔名可在對應資產分類目錄中找到唯一檔案時處理。
3. 如果找不到候選檔案，列入「無法匹配的資產」，不得猜測。
4. 如果有多個候選檔案，列入「需要人工確認」，不得自行判斷。
5. 如果引用指向 `01-origin/source/view-ui-plus-v1.3.20/` 內的檔案，視為原始碼副本內容或測試 fixture，不要重新命名，不要更新路徑；若它確實需要被筆記引用，請回報為「原始碼副本資產，不處理」。

### 4.5 不可違反的處理邊界

請遵守以下限制：

1. 必須同步處理實體資產檔名與 Markdown/HTML 引用路徑，不要只改其中一邊。
2. 不改寫源碼學習文字內容。
3. 不改寫 View UI Plus 原始碼副本內的任何檔案。
4. 不重新命名 `01-origin/source/view-ui-plus-v1.3.20/` 內的圖片、測試資料、範例資產或其他專案檔案。
5. 不要改寫外部網址，例如 `http://`、`https://`。
6. 不要改寫特殊連結，例如 `#anchor`、`mailto:`、`tel:`、`javascript:`、`line:`。
7. 不要改寫空連結，例如 `href=""`。
8. 不要改寫明顯不是資產檔案的教學示例路徑、import 路徑、源碼路徑或程式碼片段，除非該路徑可依本文件匹配規則唯一對應到資產根目錄內的實體檔案。
9. 保留原本的 Markdown 與 HTML 語法、縮排、引號風格與 alt/title 文字。
10. 如果找不到對應檔案，不要猜測路徑或新檔名，請列入「無法匹配的資產」清單。
11. 如果無法讀取實體檔案內容或無法計算 `hash6`，不要猜測，請列入「需要人工確認」清單。
12. 如果同一個檔名在多個資產分類中都存在，不要自行判斷，請列入「需要人工確認」清單。
13. 若目前資產根目錄沒有某個資產分類目錄，但檔案類型應屬於該分類，請回報缺少目錄，不要自行建立，除非使用者明確要求建立目錄。
14. 如果實體檔案無法安全改名，不要更新該引用路徑，避免造成斷鏈。
15. 不直接重生成 atomic、正式筆記、仿寫任務、企業封裝練習或複習材料。
16. 不直接同步 `00-roadmap/progress-tracker.md`。

### 4.6 資產分類規則

資產分類請依照檔案副檔名判斷：

| 類型 | 副檔名 | 目標目錄 | `asset-kind` |
| --- | --- | --- | --- |
| 圖片 | `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`, `.svg`, `.bmp`, `.ico` | `assets/images/` | `img` |
| PDF | `.pdf` | `assets/pdfs/` | `pdf` |
| Excel / CSV | `.xls`, `.xlsx`, `.csv` | `assets/excels/` | `excel` |
| Word 文件 | `.doc`, `.docx`, `.odt`, `.rtf` | `assets/word/` | `word` |
| 音訊 | `.mp3`, `.wav`, `.ogg`, `.m4a` | `assets/files/` | `file` |
| 影片 | `.mp4`, `.webm`, `.mov`, `.avi` | `assets/files/` | `file` |
| 壓縮檔 | `.zip`, `.rar`, `.7z`, `.tar`, `.gz` | `assets/files/` | `file` |
| 程式碼或其他本地附件 | 其他可確認存在於資產根目錄內的檔案 | `assets/files/` | `file` |

### 4.7 需要檢查的常見引用形式

需要檢查的常見 Markdown 引用形式包含：

```md
![元件效果圖](./old/path/component.png)
[下載 API 快照](./old/path/api.pdf)
```

需要檢查的常見 HTML 引用形式包含：

```html
<img src="./old/path/component.png">
<a href="./old/path/file.pdf">下載文件</a>
<video src="./old/path/demo.mp4"></video>
<audio src="./old/path/audio.mp3"></audio>
<source src="./old/path/demo.mp4" type="video/mp4">
<iframe src="./old/path/api.pdf"></iframe>
```

也需要檢查 Markdown 連結中指向本地附件的情況：

```md
[Table 匯出測試資料](./files/table-export-case.csv)
[源碼追蹤流程圖](./images/install-flow.png)
```

但以下內容通常不要處理：

```md
- `01-origin/source/view-ui-plus-v1.3.20/src/index.js`
- `import { Button } from 'view-ui-plus'`
- `src/components/button/button.vue`
```

### 4.8 後續影響範圍判斷

資產異動完成後，請依 `00-roadmap/note-package-workflow.md` 回報可能需要檢查的範圍，但不要直接執行下游重生成。

候選檢查範圍包含：

```text
<章節>/origin/ 其他 Markdown 引用
<章節>/atomic/ 引用
<章節>/*.md 正式筆記引用
20-imitation/ 引用
21-enterprise-wrappers/ 引用
22-review-and-practice/ 中的圖片、附件或來源連結
README 或其他索引文件中的連結
```

如果本次只處理 `01-origin/assets/`，請特別回報哪些章節可能引用全域來源資產，需要後續檢查。

---

## 5. 輸出格式 Format

請使用以下格式回報結果：

```md
## 處理摘要

- 掃描範圍：
- 資產根目錄：
- 掃描文件數：
- 已重新命名資產數：
- 已更新引用路徑數：
- 未處理資產數：

## 已處理清單

| Markdown 文件 | 原路徑 | 原檔案 | 新檔名 | 新引用路徑 | 狀態 |
| --- | --- | --- | --- | --- | --- |

## 無法匹配的資產

| Markdown 文件 | 原路徑 | 原因 |
| --- | --- | --- |

## 需要人工確認

| Markdown 文件 | 原路徑 | 問題 |
| --- | --- | --- |

## 檢查結果

- `hash6` 是否由實體檔案內容計算：
- 實體資產檔名是否已同步處理：
- Markdown 圖片語法是否正常：
- Markdown 連結語法是否正常：
- HTML `src` / `href` 是否正常：
- 是否誤改外部連結：
- 是否誤改 View UI Plus 原始碼副本：
- 是否保留原文內容：

## 後續影響範圍建議

| 範圍 | 建議 | 理由 |
| --- | --- | --- |
```

狀態欄位可使用：

```text
已改名
已更新引用
已符合標準
找不到檔案
無法計算 hash
重名衝突
多處引用
多個候選檔案
跨文件共用資產
原始碼副本資產，不處理
缺少資產分類目錄
需人工確認
```

如果沒有某一類問題，請填寫「無」。

---

## 6. 範例 Examples

以下「改寫前」範例中的路徑代表 Markdown/HTML 內的舊引用格式；實體檔案仍須能唯一對應到目前資產根目錄內的檔案，才可自動處理。

### 範例一：專案結構截圖

改寫前：

```md
![View UI Plus 專案結構截圖](./images/project-structure.png)
```

改寫後：

```md
![View UI Plus 專案結構截圖](./assets/images/01-project-structure-img-001-7e5dcd.png)
```

實體檔案同步改名：

```text
改名前：03-architecture/origin/assets/images/project-structure.png
改名後：03-architecture/origin/assets/images/01-project-structure-img-001-7e5dcd.png
```

### 範例二：元件效果圖

改寫前：

```html
<img src="./images/button-primary.JPG" alt="Button primary 狀態" />
```

改寫後：

```html
<img src="./assets/images/01-button-overview-img-001-354aea.jpg" alt="Button primary 狀態" />
```

### 範例三：官方文件快照

改寫前：

```md
[查看 View UI Plus API 快照](./pdfs/view-ui-plus-api.PDF)
```

改寫後：

```md
[查看 View UI Plus API 快照](./assets/pdfs/04-entry-design-pdf-001-78621d.pdf)
```

### 範例四：源碼追蹤流程圖與附件

改寫前：

```md
![install 流程圖](./images/install-flow.png)
[下載 Table 匯出測試資料](./files/table-export-case.csv)
```

改寫後：

```md
![install 流程圖](./assets/images/02-install-flow-img-001-1fa553.png)
[下載 Table 匯出測試資料](./assets/excels/02-install-flow-excel-001-28aaa1.csv)
```

### 範例五：Word 文件

改寫前：

```md
[下載公開 API 檢查表](./public-api-checklist.docx)
```

改寫後：

```md
[下載公開 API 檢查表](./assets/word/10-public-api-design-checklist-word-001-774caa.docx)
```

### 範例六：同一資產多次引用

改寫前：

```md
![入口設計圖](./images/entry-design.png)
[下載入口設計圖](./images/entry-design.png)
```

改寫後：

```md
![入口設計圖](./assets/images/04-entry-design-img-001-a82f91.png)
[下載入口設計圖](./assets/images/04-entry-design-img-001-a82f91.png)
```

### 範例七：全域來源文件引用 `01-origin/assets/`

若處理文件位於：

```text
01-origin/docs/view-ui-plus-api-snapshot.md
```

改寫前：

```md
![API 文件截圖](./images/api-snapshot.png)
```

改寫後：

```md
![API 文件截圖](../assets/images/view-ui-plus-api-snapshot-img-001-8ad02c.png)
```

實體檔案同步改名：

```text
改名前：01-origin/assets/images/api-snapshot.png
改名後：01-origin/assets/images/view-ui-plus-api-snapshot-img-001-8ad02c.png
```

### 範例八：不應處理的連結與源碼路徑

以下內容不要改寫：

```md
[官方網站](https://www.iviewui.com/)
[章節錨點](#install-flow)
`01-origin/source/view-ui-plus-v1.3.20/src/index.js`
`src/components/button/button.vue`
```

```html
<a href="mailto:test@example.com">寄信</a>
<a href="tel:10010">電話聯繫</a>
<a href="javascript:alert('Hello')">點擊</a>
<a href="">刷新本頁面</a>
```

如果 Markdown 連結直接指向原始碼副本內的資產，例如：

```md
[View UI Plus logo](../../01-origin/source/view-ui-plus-v1.3.20/assets/logo.png)
```

不要重新命名該檔案，也不要把它搬到筆記資產目錄；請列為「原始碼副本資產，不處理」。

---

## 7. 評估標準 Criteria

完成後的結果必須符合以下標準：

1. 所有可確認的本地資產檔名都符合 `<md-slug>-<asset-kind>-<index>-<hash6>.<ext>`。
2. 所有可確認的主題章節 `origin` 資產引用都改成 `./assets/<資產分類>/<標準檔名>`。
3. 所有可確認的 `01-origin` 全域資產引用都改成相對於目前 Markdown 的正確路徑。
4. 改寫後的路徑必須能對應到目前資產根目錄。
5. 實體資產改名與 Markdown/HTML 引用更新必須同步完成。
6. `hash6` 必須來自實體檔案內容的 SHA-256 前 6 碼，不得猜測或手動編造。
7. 既有檔名若格式正確但 `hash6` 與目前檔案內容不一致，不得視為已符合標準。
8. Markdown 圖片與連結語法不得被破壞。
9. HTML 標籤、屬性、引號與原本縮排不得被破壞。
10. 外部連結、錨點連結與特殊協議連結不得被誤改。
11. View UI Plus 原始碼副本、測試 fixture、專案內建 assets 不得被重新命名或搬移。
12. import 路徑、源碼路徑、程式碼片段與教學示例路徑不得被誤改。
13. 源碼學習內容不得被重寫、刪除或補充。
14. 找不到資產、無法計算 hash、分類目錄不存在或有多個候選檔案時，必須清楚回報，不能猜測。
15. 回報內容要能讓使用者快速知道哪些檔案被改、哪些問題需要人工處理，以及哪些下游內容可能需要後續檢查。
