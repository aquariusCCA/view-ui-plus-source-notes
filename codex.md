# 本地資產路徑標準化提問模板

## 用途

用來請 AI 依照 `prompts/_drafts/origin-asset-standardization-draft.md` 的規則，處理指定 `origin/<章節>/` 內 Markdown 文件中的本地資產引用。

## 適用場景

當指定章節的 `assets/` 內已經放入圖片、PDF、Excel、Word、影音、壓縮檔或其他輔助資源，但 Markdown 內的引用路徑或檔名尚未標準化時使用。

建議在整理圖片 alt 與附件連結文字之前先執行本模板。

## 使用方式

1. 將下方「可直接複製的提問」貼給具備檔案系統存取能力的 AI。
2. 將 `<章節路徑>` 替換成實際章節目錄。
3. 一次只處理一個章節，避免跨章節誤改。
4. 執行後檢查 git diff，確認資產檔名與 Markdown 引用已同步更新。

## 可直接複製的提問

```text
請依照 prompts/_drafts/origin-asset-standardization-draft.md 的完整規則，處理以下章節：

<章節路徑>

請只處理上述指定章節，不要處理其他章節或其他資料夾。
```

## 可替換欄位

| 欄位 | 說明 | 範例 |
| --- | --- | --- |
| `<章節路徑>` | 要處理的 `origin/` 章節目錄 | `origin/第17章_圖片標籤/` |
