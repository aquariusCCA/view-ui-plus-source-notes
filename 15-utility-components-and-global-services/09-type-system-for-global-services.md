# 全域服務型別系統

## 學習目標

這篇分析 View UI Plus 如何用 TypeScript 描述全域服務。Runtime 掛到 `app.config.globalProperties` 只是第一步；如果型別沒有同步，使用者在 `this.$Message`、`this.$Loading`、`this.$Modal` 上仍然得不到可靠提示。

讀完後，要能檢查 runtime API、`.d.ts` 宣告與文件描述是否一致。

## 對照源碼

- `01-origin/source/view-ui-plus-v1.3.20/types/index.d.ts`
- `01-origin/source/view-ui-plus-v1.3.20/types/message.d.ts`
- `01-origin/source/view-ui-plus-v1.3.20/types/notice.d.ts`
- `01-origin/source/view-ui-plus-v1.3.20/types/loading-bar.d.ts`
- `01-origin/source/view-ui-plus-v1.3.20/types/spin.d.ts`
- `01-origin/source/view-ui-plus-v1.3.20/types/modal.d.ts`
- `01-origin/source/view-ui-plus-v1.3.20/src/index.js`

## GlobalProperties 補強

`types/index.d.ts` 透過 module augmentation 補強 Vue instance：

```txt
declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $VIEWUI: ViewUIPlusGlobalOptions
    $Spin: any
    $Loading: any
    $Message: any
    $Notice: any
    $Modal: any
    $ImagePreview: any
    $Copy: any
    $ScrollIntoView: any
    $ScrollTop: any
    $Date: any
  }
}
```

這讓 Options API 裡的 `this.$Message` 不會被 TypeScript 視為不存在。缺點是目前多數服務仍宣告為 `any`，型別提示只解決「存在性」，沒有完整描述方法簽名。

## Install Options 型別

同一個檔案也描述 `ViewUIPlusGlobalOptions` 和 `ViewUIPlusInstallOptions`：

- `size`
- `transfer`
- `select`、`cell`、`menu`、`tree`、`cascader` 等圖示設定
- `modal.maskClosable`
- `typography.copyConfig`、`editConfig`、`ellipsisConfig`
- `space.size`
- `image.toolbar`
- `locale`
- `i18n`

這部分要和 `src/index.js` 的 `$VIEWUI` 結構對照。若 runtime 支援新 options，但型別沒補，使用者安裝時就得不到提示；反之，型別宣告了 runtime 不讀的欄位，也會造成錯誤期待。

## 單一服務宣告

服務 `.d.ts` 描述了部分 API：

- `message.d.ts` 宣告 Message options：`content`、`render`、`duration`、`onClose`、`closable`、`background`。
- `notice.d.ts` 宣告 Notice options：`title`、`desc`、`render`、`duration`、`name`、`onClose`。
- `loading-bar.d.ts` 宣告 LoadingBar 方法：`start`、`finish`、`error`、`update`。
- `modal.d.ts` 同時宣告普通 Modal props 和 `ModalInstance` options。
- `spin.d.ts` 主要描述 Spin 元件 props。

閱讀時要注意，這些宣告不一定等於全域屬性的精準型別。因為 `$Message` 在 `ComponentCustomProperties` 裡仍是 `any`，所以使用者透過 `this.$Message` 不一定能享受這些細節。

## Runtime 與型別漂移

檢查全域服務型別時，可以問：

- Runtime 是否有 `config()`，型別是否描述了 config options？
- Runtime 方法是否會回傳 close function，型別是否描述回傳值？
- Runtime 是否接受 string shorthand，例如 `$Message.success('ok')`？
- Runtime 是否有 `destroy()`、`close(name)`、`remove()`？
- Runtime options 是否保留 `duration: 0`、`top: 0` 這類特殊值？
- 全域 `$X` 是否使用精準 interface，而不是 `any`？

例如 Message runtime 支援字串 shorthand，並回傳手動關閉函數；型別若只描述 options object，就會低估 API 形狀。

## 更理想的型別設計

仿寫元件庫時，可以把服務型別拆成：

```txt
interface MessageOptions { ... }
type MessageContent = string | MessageOptions
type MessageClose = () => void

interface MessageService {
  info(options: MessageContent): MessageClose
  success(options: MessageContent): MessageClose
  warning(options: MessageContent): MessageClose
  error(options: MessageContent): MessageClose
  loading(options: MessageContent): MessageClose
  config(options: MessageConfig): void
  destroy(): void
}
```

然後在 `ComponentCustomProperties` 中使用：

```txt
$Message: MessageService
```

這樣 runtime、具名匯出與全域屬性的型別就能對齊。

## 複習題

1. 為什麼 runtime 掛了 `$Message`，TypeScript 還需要 module augmentation？
2. `$Message: any` 解決了什麼，又失去了什麼？
3. 檢查 install options 型別時，為什麼要回到 `src/index.js`？
4. Message 的字串 shorthand 應該如何用型別描述？
5. 如果要讓 `$Loading` 有完整提示，應該新增哪些 interface？
