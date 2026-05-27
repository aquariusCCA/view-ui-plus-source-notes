# Upload

## 學習目標

這篇分析 `Upload` 如何把原生檔案選擇、拖曳、貼上、上傳前檢查、XHR 請求、進度、成功/失敗與檔案列表整合成一個元件。

## 對照源碼

- `01-origin/source/view-ui-plus-v1.3.20/src/components/upload/upload.vue`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/upload/upload-list.vue`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/upload/ajax.js`
- `01-origin/source/view-ui-plus-v1.3.20/types/upload.d.ts`
- `01-origin/source/view-ui-plus-v1.3.20/src/styles/components/upload.less`

## 輸入入口

`Upload` 支援多種檔案來源：

| 入口 | 方法 |
| --- | --- |
| 點擊 | `handleClick` 觸發隱藏 file input |
| 原生選檔 | `handleChange` 讀取 `input.files` |
| 拖曳 | `handleDrop` 讀取 `dataTransfer.files` |
| 貼上 | `handlePaste` 讀取 `clipboardData.files` |

這些入口最後都收斂到 `uploadFiles(files)`。

## 上傳流程

```txt
uploadFiles(files)
  -> multiple 限制
  -> beforeUpload(file)
  -> format / maxSize 檢查
  -> handleStart(file)
  -> ajax(...)
  -> handleProgress / handleSuccess / handleError
  -> fileList 更新
```

`beforeUpload` 可以回傳 `false` 阻止上傳，也可以回傳 Promise 轉換檔案。

## fileList 狀態

`Upload` 會把原生 `File` 包裝成內部檔案物件：

| 欄位 | 說明 |
| --- | --- |
| `uid` | 內部唯一識別 |
| `name` | 檔名 |
| `size` | 檔案大小 |
| `status` | `uploading`、`finished`、`fail` |
| `percentage` | 上傳進度 |
| `response` | 成功回應 |
| `url` | 顯示或預覽用 |

`UploadList` 只負責渲染列表、預覽與移除事件，不負責真正上傳。

## 回呼契約

| 回呼 | 時機 |
| --- | --- |
| `onProgress(event, file, fileList)` | XHR progress |
| `onSuccess(response, file, fileList)` | 請求成功 |
| `onError(error, response, file)` | 請求失敗 |
| `onRemove(file, fileList)` | 使用者移除 |
| `onPreview(file)` | 使用者預覽 |
| `onFormatError(file, fileList)` | 副檔名不符 |
| `onExceededSize(file, fileList)` | 超過大小 |

Upload 使用 callback props，而不是只靠 emit，這是它和一般 `v-model` 輸入元件最大的差異。

## 表單整合

Upload 沒有標準 `modelValue`。它在成功上傳後會觸發 `FormItem` 的 change，讓表單能驗證「是否已上傳」這類條件。業務層若需要真正的表單值，通常會從 `fileList`、成功 response 或自訂 callback 中整理。

## 設計啟發

檔案上傳是帶副作用的輸入元件。仿寫時必須把三件事分清楚：

```txt
選到檔案
開始傳輸
業務上可提交
```

這三者不是同一個時間點，也不應由同一個事件表示。

## 複習題

1. Upload 為什麼不適合只用 `modelValue` 描述狀態？
2. `beforeUpload` 可以如何改變上傳流程？
3. `fileList` 裡的 `status` 和 `percentage` 分別服務什麼 UI？
4. `UploadList` 為什麼不直接發送請求？
5. 成功上傳後觸發 FormItem change 的意義是什麼？
