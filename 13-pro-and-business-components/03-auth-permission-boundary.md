# Auth 權限邊界

## 學習目標

這篇分析 `Auth` 元件如何把權限判斷包成 UI 邊界。重點不是權限系統本身，而是元件如何在「顯示、替代內容、阻止操作、跳轉」之間提供穩定 API。

## 對照源碼

- `01-origin/source/view-ui-plus-v1.3.20/src/components/auth/auth.vue`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/auth/index.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/mixins/link.js`
- `01-origin/source/view-ui-plus-v1.3.20/types/auth.d.ts`

## 權限輸入

`Auth` 的權限來源分成兩端：

| API | 語意 |
| --- | --- |
| `authority` | 元件需要的權限，可以是 string、array、function、boolean |
| `access` | 使用者目前擁有的權限，可以是 string 或 array |

閱讀 `isPermission` 時要注意幾種判斷：

- `authority` 是 boolean 時，直接作為結果。
- `authority` 是 function 時，呼叫函式取得結果。
- `authority` 是 string 或 array 時，和 `access` 做交集判斷。

## 顯示模式

權限通過時，`Auth` 回傳 default slot。權限不通過時，會依照場景選擇不同結果：

| 場景 | 行為 |
| --- | --- |
| 有 `to` | 建立 redirect 樣式並在 created 時觸發跳轉 |
| `prevent` 為 true | 保留原本內容，但包上一層阻止點擊 |
| 一般無權限 | 顯示 `noMatch` slot |

這表示 `Auth` 不是單純的 `v-if`，而是把「無權限時要做什麼」也變成 API。

## prevent 模式

`prevent` 常用在按鈕操作上。使用者看得到按鈕，但點擊時不執行原操作，而是提示沒有權限。

閱讀時要看：

- 點擊事件如何被包裹層攔截。
- 預設提示如何透過 `$Message.info` 出現。
- `customTip` 開啟後，提示責任如何交給外部。
- 元件仍然 emit `click`，讓外部可以記錄或自訂處理。

## 設計啟發

權限元件最重要的是把「不可見」和「不可操作」分開。常見策略有：

```txt
無權限直接隱藏
無權限顯示替代內容
無權限顯示但禁用
無權限顯示且攔截點擊
無權限跳轉到指定頁
```

不要把所有情境都寫成 `v-if="hasPermission"`，否則業務頁面會散落大量權限分支。

## 複習題

1. `authority` 為什麼支援 boolean、function、string、array 多種型態？
2. `noMatch` slot 和 `prevent` 模式解決的場景有什麼差異？
3. 權限元件使用 `$Message` 會帶來什麼全域服務依賴？
4. 如果權限來自非同步 API，`Auth` 應該如何處理 loading 和未知狀態？
5. 什麼情況下權限邏輯應該放 route guard，而不是放 Auth 元件？
