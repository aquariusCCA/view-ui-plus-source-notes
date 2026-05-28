# 指令設計檢查清單

## 學習目標

這篇把本章內容整理成可重複使用的 directive 設計檢查清單。當你要仿寫 `v-permission`、`v-click-outside`、`v-resize`、`v-line-clamp`、`v-focus`、`v-transfer` 這類能力時，可以用這份清單檢查 API、生命週期、副作用、SSR 與測試。

讀完後，要能把 View UI Plus 的指令實作模式轉成自己的工程設計流程。

## 一、先判斷是否適合 directive

設計前先問：

- 能力是否作用在單一 DOM 元素上？
- 使用者是否希望在模板上用 `v-xxx` 宣告？
- 是否不需要額外 UI 結構？
- 是否主要是 DOM style、listener、observer、focus、搬移或權限顯示？
- 是否能在 `unmounted` 明確清理？

如果答案大多是肯定的，可以考慮 directive。如果能力需要複雜畫面、slot、emit、內部狀態或多層 UI 結構，應該考慮 component。

## 二、定義 API 形狀

每個指令至少要定義：

- 指令名稱：註冊名與模板名是否清楚。
- value：主要資料或 callback 是什麼型別。
- arg：是否需要單一動態參數。
- modifiers：是否需要布林開關或事件類型。
- 特殊值：`0`、`false`、空字串、`null`、`undefined` 的語意。
- 錯誤處理：型別不符時忽略、警告還是 throw。

API 要貼近使用者意圖：

```vue
<div v-resize="onResize" />
<p v-line-clamp="2" />
<button v-permission="'user:create'" />
```

不要把底層技術細節暴露成指令名稱。

## 三、規劃生命週期

最基本的生命週期線：

```txt
beforeMount / mounted
  -> read binding
  -> create DOM effect
  -> store cleanup references

updated
  -> compare value if needed
  -> sync DOM effect

unmounted
  -> remove listener / observer / style / class / moved DOM
  -> delete temporary fields
```

常見對照：

| 行為 | 建立位置 | 清理位置 |
| --- | --- | --- |
| 寫 inline style | `mounted`、`updated` | `unmounted` |
| 加 class | `mounted` | `unmounted` |
| document listener | `beforeMount` 或 `mounted` | `unmounted` |
| ResizeObserver | `mounted` | `unmounted` |
| DOM 搬移 | `mounted` | `updated`、`unmounted` |
| 暫存 handler | 建立副作用時 | 清理副作用後 delete |

只要有副作用，就要能說出清理方式。

## 四、處理環境與相容性

directive 很容易碰瀏覽器 API，要檢查：

- 是否在 SSR import 階段存取 `window` 或 `document`。
- 是否用 `isClient` 或等價方式保護 DOM 操作。
- 是否依賴 `Node`、`Element`、`ResizeObserver`、`requestAnimationFrame`。
- target 不存在時是否安全。
- 第三方套件是否需要 destroy 或 removeListener。

像 `clickoutside.js` 使用 `isClient` 是基本做法。凡是 document listener、DOM query、transfer DOM 都應該有類似保護。

## 五、管理副作用

常見副作用和清理：

| 副作用 | 清理 |
| --- | --- |
| `document.addEventListener` | `document.removeEventListener` |
| `window.addEventListener` | `window.removeEventListener` |
| `ResizeObserver.observe` | `disconnect` 或 `unobserve` |
| 第三方 resize detector | `removeListener` |
| 加 class | `classList.remove` 或工具函式 |
| 寫 inline style | 設回 `null` 或保存舊值後還原 |
| 搬移 DOM | 搬回原位置並移除暫存資料 |

保存 handler reference 是事件類指令的基本要求。註冊時和移除時必須是同一個函式。

## 六、考慮更新行為

很多 bug 來自 value 更新後沒有同步。

要決定：

- `updated` 是否需要處理。
- 是否要比較 `binding.value` 和 `binding.oldValue`。
- callback 換成新函式時，舊 listener 是否仍閉包到舊 callback。
- `false` 是否代表停用。
- value 從 truthy 變 falsy 時要清理還是保持原狀。

例如 `v-line-clamp` 更新行數很簡單；`v-resize` 如果要支援 callback 更新，就要重新設計 handler reference。

## 七、測試情境

directive 測試要看 DOM 副作用，而不是只看 Vue 狀態。

基本情境：

- 掛載後是否正確寫入 style、class、listener 或 observer。
- value 更新後 DOM 是否同步。
- value 為 `0`、`false`、空字串時是否符合預期。
- 卸載後 listener、observer、class、style 是否清理。
- callback 是否在正確時機觸發。
- click outside 是否區分內部和外部點擊。
- 多 instance 是否互不干擾。
- SSR 或無 DOM 環境是否安全。

如果是 DOM 搬移指令，再補：

- target 為 body、selector、Node、false 的情境。
- target 切換。
- 卸載後是否回到原位置或安全移除。

## 八、文件要說清楚限制

directive 的限制要直接寫在文件裡：

- `v-line-clamp` 依賴 CSS line clamp，不是完整文字裁切引擎。
- `v-width` 目前適合 number 和 percent，不適合直接傳 `'12px'`。
- `v-resize` 的 value 應該是函式。
- click outside 是否監聽 click、mousedown 還是 touchstart。
- transfer DOM 是否建議在 Vue 3 中改用 Teleport。

文件越清楚，使用者越不會把小指令誤用成大型能力。

## 仿寫練習方向

可以用以下小題練習：

1. 仿寫 `v-focus`：掛載後 focus，支援 `false` 停用。
2. 仿寫 `v-permission`：根據權限值隱藏或移除元素。
3. 仿寫 `v-click-outside`：支援 click 和 mousedown，卸載時清理。
4. 仿寫 `v-resize`：使用 `ResizeObserver`，支援 callback 更新。
5. 仿寫 `v-lock-scroll`：掛載時鎖 body scroll，卸載時恢復。
6. 仿寫 `v-copy`：點擊元素時複製 value，成功後呼叫 callback。

每個練習都要先寫 API 契約，再寫生命週期，再補測試情境。

## 複習題

1. 判斷一個能力適不適合 directive，可以問哪幾個問題？
2. value、arg、modifier 分別適合承載什麼？
3. 為什麼事件類指令一定要保存 handler reference？
4. value 從 truthy 變 falsy 時，指令應該考慮哪些行為？
5. DOM 搬移類指令為什麼比樣式類指令更需要測試？
