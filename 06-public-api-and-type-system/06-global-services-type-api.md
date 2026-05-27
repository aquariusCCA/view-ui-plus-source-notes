# 全域服務型別 API

## 學習目標

這篇分析 View UI Plus 的全域服務 API。重點是理解 `$Message`、`$Modal`、`$Notice`、`$Loading` 這類能力如何在 runtime 掛到 Vue app 上，以及 TypeScript 如何透過 `ComponentCustomProperties` 補上使用者側型別。

## 源碼位置

主要閱讀：

- `01-origin/source/view-ui-plus-v1.3.20/src/index.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/message/index.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/modal/index.js`
- `01-origin/source/view-ui-plus-v1.3.20/types/index.d.ts`
- `01-origin/source/view-ui-plus-v1.3.20/types/message.d.ts`
- `01-origin/source/view-ui-plus-v1.3.20/types/modal.d.ts`

## Runtime 掛載

插件安裝時，View UI Plus 會把服務掛到：

```js
app.config.globalProperties.$Message = components.Message;
app.config.globalProperties.$Modal = components.Modal;
```

這讓 Options API 元件中可以使用：

```js
this.$Message.success('Saved');
this.$Modal.confirm({ title: 'Confirm' });
```

runtime 掛載只保證程式執行時有這些屬性，不保證 TypeScript 編譯器知道它們存在。

## TypeScript 擴充

`types/index.d.ts` 透過 module augmentation 擴充 Vue：

```ts
declare module '@vue/runtime-core' {
    interface ComponentCustomProperties {
        $Message: any;
        $Modal: any;
        $Notice: any;
        $Loading: any;
    }
}
```

這段宣告的作用是告訴 TypeScript：元件 instance 的 `this` 上有這些全域屬性。

## 全域服務與一般元件的差異

| 類型 | 一般元件 | 全域服務 |
| --- | --- | --- |
| 使用方式 | `<Message />` 或具名匯入 | `this.$Message.success(...)` |
| 建立方式 | Vue template/render | service 函數命令式建立 |
| 型別重點 | props、emits、slots | 方法簽名、options、回傳值 |
| 風險 | props 型別不準 | service object 被標成 `any` |

全域服務的型別不應只描述內部元件 props，還應描述使用者實際呼叫的方法。

## Message API

`Message` runtime 提供：

- `info(options)`
- `success(options)`
- `warning(options)`
- `error(options)`
- `loading(options)`
- `config(options)`
- `destroy()`

`options` 可以是字串，也可以是物件。物件中常見欄位包含 `content`、`duration`、`onClose`、`closable`、`render`、`background`。

型別檔中的 `Message` 與 `MessageConfig` 能描述部分 options，但 `$Message` 在 `ComponentCustomProperties` 中仍是 `any`，所以使用者透過 `this.$Message` 呼叫時不會得到完整方法提示。

## Modal API

`Modal` runtime 提供：

- `info(props)`
- `success(props)`
- `warning(props)`
- `error(props)`
- `confirm(props)`
- `remove()`

這些方法會建立命令式 Modal，而不是渲染 `<Modal />` component。它們需要的型別重點是 props 物件的欄位與回呼，例如 `title`、`content`、`render`、`onOk`、`onCancel`、`loading`。

## 設計啟發

全域服務型別要處理三件事：

1. 全域屬性存在：擴充 `ComponentCustomProperties`。
2. 方法可提示：不要只寫 `any`，應定義 service interface。
3. options 可檢查：把 `MessageOptions`、`ModalOptions`、`NoticeOptions` 抽成可重用型別。

更理想的寫法會像：

```ts
interface MessageService {
    success(options: string | MessageOptions): () => void;
    loading(options: string | MessageOptions): () => void;
    config(options: MessageConfig): void;
    destroy(): void;
}
```

這樣使用者在 `this.$Message.success(...)` 時可以同時得到方法、參數與回傳值提示。

## 檢查問題

1. 為什麼 runtime 掛到 `globalProperties` 後，TypeScript 仍然需要額外宣告？
2. `$Message: any` 解決了什麼問題，又犧牲了什麼？
3. 全域服務的型別重點為什麼不是 slots？
4. Message 的 options 支援字串和物件，型別應該如何表達？
5. `Modal.confirm` 和 `<Modal />` 的 API 型別重點有什麼不同？
