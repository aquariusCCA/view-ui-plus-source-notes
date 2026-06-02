目前我將 `03-architecture/` `04-plugin-system/` `05-shared-logic/` `06-public-api-and-type-system/` 目錄下的 **原始資料** 都已經完成了。

我想將目錄調整為

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

規則如下:

| 目錄 | 作用 | 用途 |
|---|---|---|
| `origin/` | 原始資料區 | 只存放 `.md` 原始資料文件。原始資料不直接修改、不直接覆蓋，作為可追溯的來源。文件內容可使用合法 Markdown 語法引用 PDF、Excel、圖片、程式碼檔案、外部連結或其他輔助資源。 |
| `atomic/` | 原子化資料區 | 根據 `origin/` 中的原始資料，透過人工或 AI 重新切分、合併、修正章節後產生的候選原子資料。此區資料尚不等於正式筆記，主要用來解決原始筆記過長、過短、章節切分不合理、內容混雜等問題。 |
| `<章節>/*.md` | 正式筆記區 | 根據 `atomic/` 生成教書型正式筆記，是整個筆記包的主幹知識。 |

筆記包的資料流如下

```text
origin/<章節>/*.md
origin/<章節>/assets/
  ↓
資料整理
  - 資產路徑標準化
  - alt / 連結文字整理
  - origin 內容整理與切分準備
  ↓
atomic/
  ↓
atomic review（atomic 內容審查）
  ↓
notes/
  ↓
notes content review（正式 notes 內容審查）
  ↓
後續的 20-imitation/ 21-enterprise-wrappers/ 22-review-and-practice/ 根據 notes 生成
```

因為目前的筆記內容品質不一，例如:

1. 筆記主要是講 A 主題，但後面展開太遠
2. 源碼感不夠，教學感太重
3. 資訊正確，但教學主線不夠清楚；像整理稿

為了處理這些問題我才想到要將筆記目錄架構做調整，並添加筆記包的資料流。

你認為如何?