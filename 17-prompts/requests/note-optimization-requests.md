# AI 筆記優化：實際提問範例

## 使用定位

> 檔案位置：`17-prompts/prompts/request/note-optimization-requests.md`
>
> 用途：存放實際向 AI 發問時，可以直接複製使用的提問內容。
>
> 建議搭配：
>
> - `17-prompts/system/ai-note-optimizer-system.md`
> - `17-prompts\workflows\note-optimization-workflow.md`
> - `17-prompts/formats/note-output-formats.md`

---

# 一、通用筆記優化請求

```md
請套用我的 AI 筆記優化規範，將以下原始筆記整理成一份適合長期學習與複習的教材型筆記。

請套用以下規則：

- 基本規則：`17-prompts/system/ai-note-optimizer-system.md`
- 工作流程：`17-prompts\workflows\note-optimization-workflow.md`
- 輸出格式：`17-prompts/formats/note-output-formats.md`

請遵守以下要求：

1. 先分析原始筆記目前的問題。
2. 再輸出優化後的完整版本。
3. 使用繁體中文與 Markdown。
4. 保留原始筆記中的重要名詞、流程、API、檔案路徑與技術含義。
5. 如果資訊不足，請標註「此處需要後續補充」，不要編造不存在的細節。
6. 請使用教書型、書本型、詳細、循序漸進的寫法。

## 原始筆記

```md
在這裡貼上我的原始筆記
```

---

# 二、原始碼閱讀筆記優化請求

```md
請將以下原始碼閱讀筆記整理成「第一次系統性閱讀該專案原始碼的人」也能理解的教材型筆記。

請套用以下規則：

- 基本規則：`17-prompts/system/ai-note-optimizer-system.md`
- 工作流程：`17-prompts\workflows\note-optimization-workflow.md`
- 輸出格式：`17-prompts/formats/note-output-formats.md`

請特別補強：

1. 這個模組或檔案在整個專案中的位置。
2. 入口檔、核心檔案與支撐檔案的角色。
3. 主要呼叫流程或資料流。
4. 每個重要 API、類別、方法、設定的責任。
5. 初次閱讀路線、深入閱讀路線，以及可以暫時跳過的細節。
6. 常見誤區，例如把入口檔和實作檔混為一談、只看 API 不看背後流程。

如果原始筆記沒有提供足夠原始碼細節，請用「可推測」、「通常」、「需要後續確認」標註，不要假裝看過未提供的原始碼。

## 原始筆記

```md
在這裡貼上我的原始碼閱讀筆記
```

---

# 三、技術概念筆記優化請求

```md
請將以下技術概念筆記整理成教材型筆記。

請套用以下規則：

- 基本規則：`17-prompts/system/ai-note-optimizer-system.md`
- 工作流程：`17-prompts\workflows\note-optimization-workflow.md`
- 輸出格式：`17-prompts/formats/note-output-formats.md`

請不要只整理定義，請補上：

1. 這個概念要解決什麼問題。
2. 初學者應該先建立哪些背景知識。
3. 這個概念和其他概念的關係。
4. 實務上什麼時候會用到。
5. 常見誤解與正確理解。
6. 5 到 10 題自我檢查問題。

請使用繁體中文與 Markdown，語氣像技術書或教學講義。

## 原始筆記

```md
在這裡貼上我的技術概念筆記
```

---

# 四、API / 設定表格整理請求

```md
請將以下 API、設定或指令筆記整理成適合回查的表格型筆記。

請套用以下規則：

- 基本規則：`17-prompts/system/ai-note-optimizer-system.md`
- 工作流程：`17-prompts\workflows\note-optimization-workflow.md`
- 輸出格式：`17-prompts/formats/note-output-formats.md`

請至少整理：

1. API / 設定 / 指令名稱。
2. 所在位置或寫法。
3. 主要用途。
4. 重要參數或欄位。
5. 使用情境。
6. 注意事項與常見錯誤。
7. 如果適合，補上簡短範例。

請保留原始筆記中的精確名稱，不要任意改名。如果資訊不足，請標註「此處需要後續補充」。

## 原始筆記

```md
在這裡貼上我的 API / 設定 / 指令筆記
```

---

# 五、產生練習題請求

```md
請根據以下筆記內容，幫我設計一組練習題，用來確認我是否真的理解這個主題。

請套用以下規則：

- 基本規則：`17-prompts/system/ai-note-optimizer-system.md`
- 工作流程：`17-prompts\workflows\note-optimization-workflow.md`
- 輸出格式：`17-prompts/formats/note-output-formats.md`

題目請包含：

1. 概念理解題。
2. 流程理解題。
3. 原始碼閱讀題。
4. 比較題。
5. 實務應用題。

請先不要直接給完整答案，但可以提供作答方向。題目難度請由基礎到進階排列。

## 筆記內容

```md
在這裡貼上筆記內容
```

---

# 六、產生複習卡請求

```md
請根據以下筆記內容，幫我產生適合放進個人知識庫或 Anki 的複習卡。

請套用以下規則：

- 基本規則：`17-prompts/system/ai-note-optimizer-system.md`
- 工作流程：`17-prompts\workflows\note-optimization-workflow.md`
- 輸出格式：`17-prompts/formats/note-output-formats.md`

請使用表格格式，欄位包含：

| 編號 | 題目 / 正面 | 答案 / 背面 | 類型 | 難度 | 備註 |
| --- | --- | --- | --- | --- | --- |

請注意：

1. 每張卡只測一個概念。
2. 題目要能幫助我主動回想，而不是只看關鍵字。
3. 答案要精準，但不要過度冗長。
4. 類型可包含：概念理解、流程理解、比較題、實務應用、原始碼閱讀。

## 筆記內容

```md
在這裡貼上筆記內容
```

---

# 七、將速查表改成教材型筆記請求

```md
以下筆記目前比較像速查表，請幫我改寫成教材型筆記。

請套用以下規則：

- 基本規則：`17-prompts/system/ai-note-optimizer-system.md`
- 工作流程：`17-prompts\workflows\note-optimization-workflow.md`
- 輸出格式：`17-prompts/formats/note-output-formats.md`

請特別注意：

1. 不要只重新排版。
2. 請補上每個重點背後的原因與理解方式。
3. 請把零散條列改成有前後邏輯的章節。
4. 如果有多個概念，請補比較表。
5. 如果有流程，請補流程說明。
6. 最後請補上本章總結與自我檢查問題。

## 原始筆記

```md
在這裡貼上速查型筆記
```

---

# 八、針對既有筆記補強請求

```md
以下是我已經整理過的筆記。請不要整篇重寫，而是幫我指出還能補強的地方，並針對需要補強的段落提出具體修改建議。

請套用以下規則：

- 基本規則：`17-prompts/system/ai-note-optimizer-system.md`
- 工作流程：`17-prompts\workflows\note-optimization-workflow.md`
- 輸出格式：`17-prompts/formats/note-output-formats.md`

請檢查：

1. 哪些地方背景不足。
2. 哪些地方只有結論，缺少原因。
3. 哪些地方可以補表格。
4. 哪些地方可以補範例。
5. 哪些地方可以拆成後續獨立筆記。
6. 哪些地方可能有技術含義不精確的風險。

## 既有筆記

```md
在這裡貼上既有筆記
```

---

# 九、搭配四層 Prompt Package 的建議用法

實際使用時，可以依任務複雜度組合不同提示詞。

| 使用情境 | 建議組合 |
| --- | --- |
| 一般筆記優化 | `system` + `workflow` + `format` + 通用請求 |
| 原始碼閱讀筆記 | `system` + `workflow` + `format` + 原始碼閱讀請求 |
| 只要格式穩定 | `system` + `format` + 對應請求 |
| 只產生練習題 | `system` + 練習題格式 + 練習題請求 |
| 只產生複習卡 | `system` + 複習卡格式 + 複習卡請求 |
| 檢查既有筆記 | `system` + workflow 的分析流程 + 補強請求 |
