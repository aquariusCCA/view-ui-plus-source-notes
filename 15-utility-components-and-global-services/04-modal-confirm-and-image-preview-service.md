# Modal Confirm 與 ImagePreview 服務

## 學習目標

這篇分析命令式浮層服務。Modal、Confirm、ImagePreview 都可以被看成「臨時建立一個浮層任務」，使用者不需要在當前 template 裡預先寫元件。

讀完後，要能說清楚命令式 Modal 和普通 `<Modal v-model>` 的控制權差異，以及一次性浮層服務如何處理 show、remove、callback、locale 和 DOM 清理。

## 對照源碼

- `01-origin/source/view-ui-plus-v1.3.20/src/components/modal/index.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/modal/confirm.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/modal/modal.vue`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/image-preview/index.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/image/image-preview.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/mixins/locale.js`
- `01-origin/source/view-ui-plus-v1.3.20/types/modal.d.ts`

## 普通 Modal 與命令式 Modal

普通 Modal 的狀態由呼叫端持有：

```txt
parent state
  -> <Modal v-model="visible">
  -> on-ok / on-cancel
  -> parent 更新 visible
```

命令式 Modal 的狀態由服務持有：

```txt
$Modal.confirm(options)
  -> getModalInstance()
  -> instance.show(options)
  -> Modal 子 app visible = true
  -> onOk / onCancel / remove
  -> onRemove 清掉外層 modalInstance
```

差異不只是語法。普通 Modal 是父元件流程的一部分；命令式 Modal 是服務自己建立、自己銷毀的一次性任務。

## Confirm 服務入口

`modal/index.js` 把語意方法掛到 Modal 上：

```txt
Modal.info()
Modal.success()
Modal.warning()
Modal.error()
Modal.confirm()
Modal.remove()
```

每個方法補上 `icon` 和 `showCancel` 後進入 `confirm(options)`。`confirm()` 會處理兩件事：

- 用 `render` 和 `lockScroll` 建立或取得 `modalInstance`。
- 注入 `options.onRemove`，讓內部 destroy 後把 `modalInstance` 設回 `null`。

`onRemove` 是這個服務的關鍵。如果沒有它，外層單例會指向已經被 unmount 的 instance，下一次呼叫就可能操作失效引用。

## Confirm 子 app

`modal/confirm.js` 使用 `createApp` 建立一個臨時 Vue 應用，掛到 `document.body`。它內部保存：

- `visible`：控制 Modal 顯示。
- `title`、`body`、`render`：控制內容。
- `iconType`、`iconName`：控制語意圖示。
- `okText`、`cancelText`：可覆蓋，也可透過 locale 取得。
- `loading`、`buttonLoading`：處理非同步確認。
- `closing`：避免關閉動畫期間重複點擊。

`ok()` 裡如果 `loading` 為 true，不會立即移除，而是把按鈕切成 loading，等待外部呼叫 `Modal.remove()`。這讓命令式 confirm 可以支援「確認後送 API，成功後才關閉」。

## Locale 依賴

Confirm 子 app 混入 `Locale`，並透過：

```txt
this.t('i.modal.okText')
this.t('i.modal.cancelText')
```

取得預設按鈕文字。這提醒我們：命令式服務不是脫離元件系統的純函數。它仍然可能需要 i18n、全域設定、Button 元件、Modal 元件與樣式系統。

## ImagePreview 服務

`image-preview/index.js` 的結構和 Modal confirm 類似：

```txt
let imagePreviewInstance

getImagePreviewInstance()
  -> ImagePreview.newInstance()

ImagePreview.show(props)
  -> props.onRemove = () => imagePreviewInstance = null
  -> instance.show(props)
```

它的重點同樣是單例生命週期。圖片預覽是一個臨時任務，關閉後要釋放 instance，避免下一次 show 操作舊狀態。

## 設計啟發

命令式浮層服務適合這些場景：

- 呼叫點很多，不想在每個頁面都放一個 `<Modal>`。
- 任務是一次性的，例如確認刪除、預覽圖片、顯示錯誤詳情。
- 內容可以用 options 描述，或用 render function 提供。
- 關閉結果透過 callback 回到業務流程。

但命令式服務也有成本：

- 狀態不在父元件模板中，可追蹤性較弱。
- render function 和 innerHTML 需要注意內容來源。
- 服務必須自己處理 unmount、DOM remove、滾動鎖定與重複關閉。
- TypeScript 要另外描述 options，否則使用者很難知道可傳欄位。

## 複習題

1. `$Modal.confirm()` 和 `<Modal v-model>` 的狀態持有者分別是誰？
2. `onRemove` 為什麼要由服務層注入？
3. Confirm 的 `loading` 模式為什麼需要 `Modal.remove()`？
4. 命令式浮層為什麼仍然需要 locale mixin？
5. ImagePreview 和 Modal confirm 的單例清理模式有什麼共通點？
