# Instance 方法與暴露行為

## 學習目標

這篇分析元件 instance 方法與公開暴露行為。重點是分辨：Options API 的 `methods` 雖然可能透過 template ref 被呼叫，但不代表每個 method 都是元件庫承諾支援的公開 API。

## 源碼位置

主要閱讀：

- `01-origin/source/view-ui-plus-v1.3.20/src/components/button/button.vue`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/modal/modal.vue`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/modal/index.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/message/index.js`
- `01-origin/source/view-ui-plus-v1.3.20/types/modal.d.ts`
- `01-origin/source/view-ui-plus-v1.3.20/types/message.d.ts`

## 不是所有 methods 都是公開 API

`Button` 有 `handleClickLink`，`Modal` 有 `close`、`handleClose`、`handleMask`、`EscClose`、`addModal`、`removeModal` 等方法。

這些方法大多是內部流程的一部分。判斷它是否公開，可以看：

- 文件或範例是否鼓勵使用者呼叫。
- d.ts 是否描述 instance method。
- 方法命名是否面向使用者，而不是內部事件流程。
- 方法參數與副作用是否穩定。
- 是否被全域 service 或外部入口包裝後暴露。

只要這些條件不成立，就不要在自己的業務程式中依賴它。

## Component instance 與 service instance

View UI Plus 有兩種容易混淆的 instance：

| 類型 | 例子 | 使用方式 |
| --- | --- | --- |
| 元件實例 | `<Modal ref="modalRef" />` | 透過 template ref 存取元件內部 instance |
| 服務實例 | `this.$Modal.confirm(...)` | 透過全域服務建立命令式 UI |

元件實例的 methods 常是內部實作；服務實例則通常是公開 API，因為使用者就是透過它命令式打開 Modal、Message、Notice。

## Modal service 的暴露方式

`src/components/modal/index.js` 會在 Modal 物件上掛方法：

- `Modal.info`
- `Modal.success`
- `Modal.warning`
- `Modal.error`
- `Modal.confirm`
- `Modal.remove`

這些方法比 `modal.vue` 內部的 `handleClose` 更像公開 API，因為它們出現在元件入口與全域服務中，使用者可以透過 `$Modal` 或具名匯入使用。

## Message service 的暴露方式

`Message` 提供：

- `info`
- `success`
- `warning`
- `error`
- `loading`
- `config`
- `destroy`

其中 `info/success/...` 會回傳一個關閉函數。這也是公開契約的一部分，因為使用者可能依賴它手動移除 loading message。

## d.ts 的描述落差

`types/message.d.ts` 主要描述 Message options 與 MessageConfig，`types/modal.d.ts` 主要描述 Modal component props 與 ModalInstance options。對 service 方法本身的函數簽名描述相對有限。

這代表使用者雖然能在 runtime 呼叫 service，但 TypeScript 不一定能完整提示所有方法與回傳值。閱讀時要把這種落差記錄下來，因為它直接影響使用者側型別體驗。

## 公開程度分級

| 等級 | 判斷 | 例子 |
| --- | --- | --- |
| 明確公開 | 入口匯出、文件使用、型別描述 | `Message.success`、`Modal.confirm` |
| 半公開 | 可透過 ref 呼叫，但缺少型別或文件承諾 | 部分元件 methods |
| 內部細節 | 只被 watcher、事件處理、生命週期呼叫 | `handleMask`、`addModal` |

做企業封裝時，應優先依賴明確公開 API。半公開能力如果一定要用，最好在自己的封裝層隔離，不要散落在業務頁面。

## 設計啟發

如果自己設計元件庫，要明確決定哪些行為要暴露：

- 需要 ref 呼叫的 method，要在文件與型別中明確列出。
- 不希望使用者呼叫的方法，命名與文件都不要暗示它是 API。
- 命令式服務要有穩定 options 型別、方法簽名與回傳值。
- service object 的 runtime 掛載與 TypeScript 宣告要同步。

## 檢查問題

1. 為什麼 Options API 的 `methods` 不等於公開 API？
2. `Modal.confirm` 和 `modal.vue` 裡的 `handleClose` 公開程度有什麼差異？
3. Message 的 `loading` 回傳關閉函數，為什麼也是 API 契約？
4. 如果 service 方法沒有完整型別，使用者會遇到什麼問題？
5. 企業二次封裝時，為什麼要避免直接依賴半公開 instance methods？
