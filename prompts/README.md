# prompts/

`prompts/` 是 View UI Plus Learning Notes 的 **AI 協作規則管理區**。

它不存放正式學習內容，也不存放 View UI Plus 原始碼、章節狀態或進度規劃；它只負責管理 AI 在整理來源、閱讀源碼、生成筆記、檢查內容、設計練習與製作複習材料時應遵守的規則、流程、格式、範例與品質標準。

---

## 1. 目錄目標

`prompts/` 的目標不是保存單次提問，而是建立一套可長期使用、可組合、可維護的 AI 協作系統。

它需要做到：

1. **支援源碼學習**：讓 AI 回答與生成內容時能回到 View UI Plus 原始碼、API、型別、樣式與測試依據。
2. **支援資料流**：協助 `origin -> atomic -> 正式筆記 -> 練習/複習材料` 的轉換與檢查。
3. **支援任務拆分**：把源碼分析、筆記生成、仿寫任務、企業封裝與複習題生成分成可重複執行的流程。
4. **支援品質檢查**：避免內容只停留在 API 摘要、表面整理或無來源推論。
5. **支援長期維護**：讓 Prompt 規則能拆分、引用與更新，而不是累積成單一大型提示詞。

---

## 2. 建議目錄結構

```text
prompts/
  README.md
  _drafts/
  core/
  workflows/
  formats/
  examples/
  criteria/
  requests/
```

| 目錄 | 定位 | 主要用途 |
| --- | --- | --- |
| `_drafts/` | 草稿設計區 | 存放尚未穩定、尚未拆分的大型混合 Prompt 草稿。 |
| `core/` | 核心規則區 | 存放長期穩定的角色定位、教學原則、源碼閱讀原則、回答風格與通用限制。 |
| `workflows/` | 任務流程區 | 存放可重複執行的任務步驟，例如源碼追蹤、`origin` 轉 `atomic`、正式筆記生成、仿寫任務生成。 |
| `formats/` | 輸出格式區 | 存放固定輸出結構，例如元件分析模板、API 表格、正式筆記格式、練習題格式。 |
| `examples/` | 範例模仿區 | 存放 Few-shot 範例，讓 AI 模仿固定語氣、結構、源碼分析方式與題目設計方式。 |
| `criteria/` | 品質標準區 | 存放可檢查的品質清單、驗收標準、評分規則與常見錯誤檢查。 |
| `requests/` | 實際提問區 | 存放可以直接送給 AI 使用的入口提問模板，負責引用或組合其他 Prompt 資源。 |

目前若某個 workflow 尚未拆分完成，可以先放在 `_drafts/`；穩定後應拆到正式目錄，並讓 `requests/` 只負責組合與套用。

---

## 3. Prompt 拆分觀念

Prompt 常見的七個元素是：

```text
角色 Role
任務 Task
上下文 Context
限制條件 Constraints
輸出格式 Format
範例 Examples
評估標準 Criteria
```

`prompts/` 的子目錄不是和這七個元素一對一對應，而是依照 **Prompt 的維護生命週期** 拆分。

| Prompt 元素 | 建議放置位置 |
| --- | --- |
| 初期混合草稿 | `_drafts/` |
| 角色 Role | `core/` 或 `requests/` |
| 任務 Task | `workflows/` 或 `requests/` |
| 上下文 Context | `requests/`，必要時抽到 `core/` |
| 限制條件 Constraints | 通用限制放 `core/`；任務限制放 `workflows/` 或 `requests/` |
| 輸出格式 Format | `formats/` |
| 範例 Examples | `examples/` |
| 評估標準 Criteria | `criteria/` |

可以這樣理解：

```text
七個 Prompt 元素 = 單一 Prompt 的內容骨架
七個 prompts/ 子目錄 = 管理 Prompt 資源的資料夾架構
```

---

## 4. 從草稿到正式 Prompt

建議先在 `_drafts/` 試寫完整 Prompt，等規則穩定後再拆分。

```text
_drafts/
  ↓ 設計與試寫大型混合 Prompt
core/
  ↓ 抽出長期穩定規則
workflows/
  ↓ 抽出任務處理步驟
formats/
  ↓ 抽出固定輸出結構
examples/
  ↓ 抽出可模仿範例
criteria/
  ↓ 抽出品質檢查標準
requests/
  ↓ 組合成可直接使用的入口提問模板
```

範例：設計一套「分析 Button 源碼並生成正式筆記」的 Prompt。

草稿階段可以先建立：

```text
_drafts/analyze-button-source-draft.md
```

草稿中可以暫時放入角色、任務、來源、處理步驟、輸出格式與檢查清單。穩定後建議拆成：

```text
core/source-reading-principles.md
workflows/component-source-analysis.md
workflows/atomic-to-formal-note.md
formats/component-analysis-note-format.md
examples/button-analysis-example.md
criteria/source-backed-note-checklist.md
requests/generate-component-note.md
```

拆分後，各檔案責任如下：

| 檔案 | 負責內容 |
| --- | --- |
| `core/source-reading-principles.md` | 定義源碼閱讀時必須保留路徑、依據與推論邊界。 |
| `workflows/component-source-analysis.md` | 定義如何從元件入口追到 props、events、slots、樣式與共用邏輯。 |
| `workflows/atomic-to-formal-note.md` | 定義如何把 atomic 候選稿生成教書型正式筆記。 |
| `formats/component-analysis-note-format.md` | 定義元件分析筆記的固定結構。 |
| `examples/button-analysis-example.md` | 提供可模仿的高品質元件分析樣本。 |
| `criteria/source-backed-note-checklist.md` | 定義筆記完成後的來源、主線、正確性與可遷移性檢查。 |
| `requests/generate-component-note.md` | 組合上述規則，形成可直接使用的入口 Prompt。 |

---

## 5. Prompt 文件建議格式

不同類型的 Prompt 文件不必硬套同一種格式，但每份文件至少建議包含以下欄位。

```md
# 提示詞名稱

## 用途

說明這份 Prompt 的主要用途。

## 適用場景

說明什麼情況下應該使用這份 Prompt。

## 不適用場景

說明什麼情況下不應該使用這份 Prompt。

## 使用方式

說明這份 Prompt 應該如何單獨使用，或如何搭配其他 Prompt 使用。
```

若文件屬於 `workflows/`、`formats/` 或 `criteria/`，可以再加入任務步驟、輸入欄位、輸出結構、檢查清單或失敗案例。

---

## 6. 放置規則

| 目錄 | 適合放 | 不適合放 |
| --- | --- | --- |
| `_drafts/` | 尚未穩定的大型混合 Prompt、正在試寫的任務設計、尚未拆分完成的過渡期 workflow | 已確認穩定且可拆分的正式規則、正式筆記、原始碼內容 |
| `core/` | AI 角色定位、教學原則、源碼閱讀原則、回答風格、通用限制、品質方向 | 單次任務、某篇筆記內容、完整輸出版型、具體驗收清單 |
| `workflows/` | 任務目標、輸入要求、處理步驟、檢查步驟 | 長期角色設定、完整輸出版型、實際可直接送出的完整提問 |
| `formats/` | 標題層級、區塊順序、表格欄位、程式碼呈現規則 | 任務處理流程、AI 角色設定、大量背景說明 |
| `examples/` | 高品質輸出範例、Few-shot 範例、好的源碼分析或練習題範例 | 大量正式筆記、原始碼副本、完整任務流程 |
| `criteria/` | 可檢查的品質清單、驗收標準、評分規則、常見錯誤檢查 | 具體章節筆記、單次任務資料、完整輸出格式、通用教學原則 |
| `requests/` | 實際提問文字、任務背景、輸入欄位、可替換變數、其他 Prompt 資源的引用方式 | 所有長期規則、所有輸出格式細節、大量正式筆記內容 |

---

## 7. 命名規則

Prompt 檔案建議使用小寫英文與連字號。

| 類型 | 命名模式 | 範例 |
| --- | --- | --- |
| 草稿 | `<task>-draft.md` | `component-source-analysis-draft.md` |
| 核心規則 | `<domain>-principles.md` | `source-reading-principles.md` |
| 任務流程 | `<source>-to-<target>.md` 或 `<task>.md` | `origin-to-atomic.md`、`component-source-analysis.md` |
| 輸出格式 | `<output>-format.md` | `component-analysis-note-format.md` |
| 輸出範例 | `<output>-example.md` | `button-analysis-example.md` |
| 驗收標準 | `<output>-quality-checklist.md` | `source-backed-note-checklist.md` |
| 實際提問 | `<action>-<target>.md` | `generate-component-note.md`、`review-formal-note.md`、`judge-note-package-update.md` |

建議使用：

```text
source-reading-principles.md
component-source-analysis.md
origin-to-atomic.md
atomic-to-formal-note.md
note-to-imitation-task.md
note-to-review-practice.md
component-analysis-note-format.md
component-api-checklist.md
generate-component-note.md
review-formal-note.md
judge-note-package-update.md
```

避免使用：

```text
prompt1.md
test.md
new.md
note.md
ai.md
```

---

## 8. 維護原則

1. **先草稿，後拆分**：Prompt 尚未穩定時先放 `_drafts/`；穩定後再拆到正式目錄。
2. **一份文件只負責一件事**：避免同一份文件同時負責規則、流程、格式、範例與驗收。
3. **長期規則不要重複複製**：會反覆使用的規則應抽到 `core/`、`workflows/`、`formats/` 或 `criteria/`，`requests/` 只負責引用與組合。
4. **流程與格式分開管理**：`workflows/` 描述「怎麼做」；`formats/` 描述「結果長什麼樣」。
5. **範例只放少量高品質樣本**：`examples/` 是 Few-shot 範例區，不是正式筆記倉庫。
6. **驗收標準要可檢查**：避免「內容要很好」這種空泛標準，改用明確檢查項目。
7. **Prompt 不取代正式筆記**：正式知識內容應放在對應章節、仿寫、企業封裝或複習目錄，不要放在 `prompts/`。
8. **Prompt 不取代 roadmap 規格**：學習路線、資料流、章節狀態與進度規劃應放在 `00-roadmap/`。
9. **Prompt 不複製原始碼**：View UI Plus 原始碼與來源材料應放在 `01-origin/`，Prompt 只引用路徑與使用方式。
10. **過渡期引用要收斂**：`requests/` 可以暫時引用 `_drafts/`，但穩定後應逐步改引用正式目錄中的規則資源。

---

## 9. 新增 Prompt 前檢查清單

新增一份 Prompt 前，請確認：

- [ ] 這份 Prompt 的用途是否清楚？
- [ ] 它應該放在 `_drafts/`、`core/`、`workflows/`、`formats/`、`examples/`、`criteria/` 還是 `requests/`？
- [ ] 是否和既有 Prompt 重複？
- [ ] 是否只負責一個明確任務？
- [ ] 是否有說明適用場景與不適用場景？
- [ ] 是否有清楚的使用方式？
- [ ] 如果是源碼分析任務，是否要求標明來源路徑與推論邊界？
- [ ] 如果是流程，是否有明確步驟？
- [ ] 如果是格式，是否有清楚輸出結構？
- [ ] 如果是範例，是否值得讓 AI 模仿？
- [ ] 如果是驗收標準，是否可以被檢查？
- [ ] 如果會影響資料流、閱讀順序或進度規格，是否需要同步檢查 `00-roadmap/`？
- [ ] 檔名是否清楚、可搜尋、可長期維護？

---

## 10. 總結

`prompts/` 的價值不在於把 Prompt 拆得越細越好，而在於讓 View UI Plus 的 AI 輔助學習流程更穩定、更可控、更容易維護。

```text
_drafts/   = Prompt 草稿在哪裡設計
core/      = AI 長期要遵守什麼規則
workflows/ = 任務應該怎麼處理
formats/   = 最終輸出長什麼樣
examples/  = AI 應該模仿什麼範例
criteria/  = 怎樣才算合格
requests/  = 實際要怎麼問 AI
```

當這七類資源能夠清楚分工，就可以穩定地把 View UI Plus 的原始碼、來源材料與正式筆記轉換成適合源碼閱讀、元件設計、仿寫實作、企業封裝與複習訓練的內容。
