# 業務 Modal 與 Drawer

## 學習目標

這篇設計新增、編輯、詳情、審核、指派等後台常見彈窗。重點是把 Modal/Drawer 的可見狀態、表單狀態、非同步提交、關閉攔截與父頁面回刷整理成清楚契約。

## 對照章節

- `12-feedback-and-overlays/03-modal-and-confirm.md`
- `12-feedback-and-overlays/04-drawer.md`
- `12-feedback-and-overlays/09-feedback-overlay-api-patterns.md`
- `10-form-and-input-components/02-form-and-form-item.md`

## 模式分類

| 模式 | 特徵 |
| --- | --- |
| create | 空表單、提交後建立資料 |
| edit | 開啟前或開啟後載入詳情，表單回填 |
| detail | 只讀展示，可能有下一步操作 |
| audit | 有同意/拒絕等流程分支 |
| assign | 選人、選角色、選組織等關聯操作 |

不同模式不一定要做成不同元件，可以用 `mode` 控制，也可以由父頁面傳不同表單 schema。

## 開啟流程

業務彈窗常見流程：

```txt
open(mode, row)
  -> 設定 current row
  -> 設定 visible
  -> create: reset form
  -> edit/detail: load detail
  -> 回填表單或展示資料
```

如果詳情 API 很慢，要決定 Drawer/Modal 先打開顯示 loading，還是等資料載入後再打開。

## 提交流程

```txt
click ok
  -> validate form
  -> submit loading = true
  -> call create/update/audit service
  -> success message
  -> close
  -> emit success
  -> parent refresh list
  -> submit loading = false
```

要特別注意失敗流程：API 失敗時通常不應關閉彈窗，表單資料也不應被重置。

## 關閉攔截

業務彈窗常見關閉入口：

- 右上角 close。
- mask click。
- Esc。
- cancel button。
- submit success。
- route leave。

如果表單已修改，需要考慮是否提示「尚未儲存」。這種攔截不應散落在每個入口，而應該匯到同一個 close guard。

## 複習題

1. create modal 和 edit modal 的資料初始化有什麼差異？
2. 詳情 API 應該在打開前載入，還是打開後載入？
3. submit loading 應該由 Modal 內部持有，還是由父頁面控制？
4. API 失敗時是否應該自動關閉彈窗？
5. 如何設計 close guard，避免 mask click 和 cancel button 行為不一致？
