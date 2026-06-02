### 6.1 給 AI 使用時的最小輸入

與 AI 協作時，不需要每次貼完整筆記。優先提供以下資訊：

```text
1. 章節名稱
2. 改動位置：origin / origin/<章節>/assets / atomic / notes / appendix / demos / practice / review / supplements
3. 任務 / 改動類型：請優先使用第 2.3 節的常見任務類型；若需要更細，可補充子類型，例如：範例、標題、anchor、下游新增內容判斷
4. 改動摘要
5. 我希望 AI 判斷
```

提問範本：

```text
請依 meta/update-rules.md 協助判斷這次 HTML 筆記包更新的影響範圍。

1. 章節名稱：
2. 改動位置：
3. 任務 / 改動類型：
4. 改動摘要：
5. 我希望 AI 判斷：

請先判斷影響範圍，再說明需要檢查的內容、候選重生成或候選同步範圍，以及 meta/chapter-status.md 建議標記。
```