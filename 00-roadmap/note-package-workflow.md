# 筆記包資料流規則

這份文件定義 View UI Plus Learning Notes 的資料流、目錄責任與筆記生成規則。它是整份筆記包的主規格；README 只保留摘要與導覽。

## 核心資料流

```text
origin/
  ↓
資料整理
  - 資產路徑標準化
  - alt / 連結文字整理
  - origin 內容整理與切分準備
  ↓
atomic/
  ↓
atomic review
  ↓
正式筆記
  ↓
notes content review
  ↓
20-imitation/、21-enterprise-wrappers/、22-review-and-practice/
```

對於主題章節，建議使用以下結構：

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

## 目錄責任

| 目錄 | 作用 | 規則 |
| --- | --- | --- |
| `origin/` | 原始資料區 | 保存可追溯來源。內容不直接覆蓋成正式筆記，可以整理連結、補充資產引用與修正明顯格式問題。 |
| `origin/assets/images/` | 圖片資產 | 存放截圖、圖解、流程圖、元件效果圖。Markdown 需提供可理解的 alt 文字。 |
| `origin/assets/pdfs/` | PDF 資產 | 存放 PDF 文件與外部文件快照。筆記中引用時需說明文件用途。 |
| `origin/assets/excels/` | 試算表資產 | 存放 Excel 或 CSV 類表格資料。引用時需說明資料欄位或分析目的。 |
| `origin/assets/word/` | Word 類文件 | 存放 Word、ODT、RTF 類材料。 |
| `origin/assets/files/` | 其他資產 | 存放無法歸到前面類別的輔助檔案。 |
| `atomic/` | 原子化資料區 | 根據 `origin/` 重新切分、合併與修正主題邊界，作為正式筆記候選稿。 |
| `<章節>/*.md` | 正式筆記區 | 根據通過 review 的 atomic 內容生成教書型正式筆記，是後續練習與複習材料的基準。 |

## 內容規則

- `origin/` 要保留來源感：盡量保留原始脈絡、來源路徑、相關程式碼位置與尚未整理的觀察。
- `atomic/` 要解決主題邊界：每篇只處理一個清楚問題，不把多個主題硬塞在一起。
- 正式筆記要建立教學主線：用問題意識串起源碼、設計原因、實作流程與可遷移的設計原則。
- 正式筆記不能只像整理稿：每個關鍵結論都應該能回到原始碼、型別檔、範例或明確推論。
- 後續 `20-imitation/`、`21-enterprise-wrappers/`、`22-review-and-practice/` 只根據正式筆記生成，不直接依賴未審查的 `origin/` 或 `atomic/`。

## Review 標準

atomic review 主要檢查：

- 主題是否單一。
- 是否有明確來源。
- 是否有過度發散、重複或混入其他章節內容。
- 是否足以生成一篇正式筆記。

notes content review 主要檢查：

- 教學主線是否清楚。
- 源碼依據是否足夠。
- 是否避免只背 API 或只做表面整理。
- 是否能支援後續仿寫、企業封裝、複習題與重構練習。

## 目前套用範圍

第一階段先套用在：

- `03-architecture/`
- `04-plugin-system/`
- `05-shared-logic/`
- `06-public-api-and-type-system/`

這四章目前的 numbered notes 先視為 `origin/` 原始資料；正式筆記會在 atomic review 後再回到章節根目錄產生。
