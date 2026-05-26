# 全域服務

## 學習目標

這篇分析 View UI Plus 的全域服務。重點是分清楚「全域元件註冊」和「全域方法服務」的差異，並看懂 `$Message`、`$Modal`、`$Loading` 這類 API 為什麼要掛到 `globalProperties`。

## 對照源碼

- `01-origin/source/view-ui-plus-v1.3.20/src/index.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/message/index.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/modal/index.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/notice/index.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/loading-bar/index.js`

## 註冊位置

`install` 內把服務掛到：

```js
app.config.globalProperties.$Spin = components.Spin;
app.config.globalProperties.$Loading = components.LoadingBar;
app.config.globalProperties.$Message = components.Message;
app.config.globalProperties.$Notice = components.Notice;
app.config.globalProperties.$Modal = components.Modal;
app.config.globalProperties.$ImagePreview = components.ImagePreview;
app.config.globalProperties.$Copy = components.Copy;
app.config.globalProperties.$ScrollIntoView = components.ScrollIntoView;
app.config.globalProperties.$ScrollTop = components.ScrollTop;
app.config.globalProperties.$Date = dayjs;
```

這讓 Options API 可以這樣使用：

```js
this.$Message.success('Saved');
this.$Modal.confirm({ title: 'Confirm' });
this.$Loading.start();
```

## 服務和元件的差異

全域元件註冊解決的是模板可用性：

```vue
<Button>Save</Button>
```

全域服務解決的是命令式呼叫：

```js
this.$Message.success('Saved');
```

像 Message、Notice、Modal confirm、LoadingBar 這類功能通常不只是一個普通模板元件，而是需要在任意業務邏輯中主動觸發，所以會提供方法式 API。

## Message 的服務形狀

`Message` 預設匯出一個物件，包含：

- `info`
- `success`
- `warning`
- `error`
- `loading`
- `config`
- `destroy`

它內部會透過 `Notification.newInstance()` 建立通知容器，然後用 `notice()` 插入訊息。這種設計把 DOM 建立、動畫、排隊、關閉等細節藏在服務背後。

## Modal 的服務形狀

`Modal` 會在原本的 confirm 模組上補方法：

- `Modal.info`
- `Modal.success`
- `Modal.warning`
- `Modal.error`
- `Modal.confirm`
- `Modal.remove`

`$Modal.confirm()` 本質上不是註冊一個全域元件，而是呼叫服務去建立並顯示一個 Modal 實例。

## LoadingBar 與 Notice

`LoadingBar` 提供：

- `start`
- `update`
- `finish`
- `error`
- `config`
- `destroy`

`Notice` 提供：

- `open`
- `info`
- `success`
- `warning`
- `error`
- `config`
- `close`
- `destroy`

這些 API 都適合在路由切換、請求回應、表單提交後以命令式方式觸發。

## 設計重點

- 全域服務適合放「業務邏輯中主動觸發」的 UI 行為。
- 服務掛到 `globalProperties` 後，Options API 使用體驗接近 Vue 2 的 `Vue.prototype`。
- Composition API 中不會自動有 `this`，通常要透過 `getCurrentInstance()` 或自行封裝 composable 取得。

## 最小模仿

```js
const Message = {
    success(content) {
        console.log(`success: ${content}`);
    },
    error(content) {
        console.log(`error: ${content}`);
    }
};

export const install = (app) => {
    app.config.globalProperties.$Message = Message;
};
```

## 複習題

1. `$Message.success()` 和 `<Message />` 是同一種使用模型嗎？
2. 為什麼 LoadingBar 適合做成全域服務？
3. Composition API 中要如何取得 `globalProperties`？
