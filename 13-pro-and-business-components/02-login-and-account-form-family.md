# Login 與帳號表單族

## 學習目標

這篇分析 View UI Plus 的 Login 家族：`Login`、`UserName`、`Password`、`Mobile`、`Email`、`Captcha`、`Submit`。重點是理解一組業務欄位如何共用同一個表單模型、驗證規則與提交入口。

## 對照源碼

- `01-origin/source/view-ui-plus-v1.3.20/src/components/login/login.vue`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/login/login-item.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/login/user-name.vue`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/login/password.vue`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/login/mobile.vue`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/login/email.vue`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/login/captcha.vue`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/login/submit.vue`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/login/default_validate_message.js`
- `01-origin/source/view-ui-plus-v1.3.20/types/login.d.ts`

## 結構拆解

`Login` 本身是一個包住 `Form` 的容器。它透過 `provide` 暴露 `LoginInstance`，讓子欄位可以把自己的值寫入同一份 `formValidate`。

```txt
Login
  -> Form
  -> slot children
      -> UserName / Password / Mobile / Email
      -> Captcha
      -> Submit
```

`login-item.js` 是欄位族的共用邏輯。它負責：

- 接收 `name`，建立對應的表單欄位。
- 接收 `rules`，沒有傳入時使用預設驗證訊息。
- 把 Input 的 `update:modelValue` 同步到 `LoginInstance.formValidate`。
- 支援 `enterToSubmit`，讓 Enter 鍵觸發整個 Login 的提交。
- 用 render function 組合 `FormItem` 和 `Input`。

## 欄位註冊模式

這組元件值得觀察的一點是：欄位不是由父層一次宣告，而是由每個子元件在 `created` 階段把自己的 `name` 合併進 `formValidate`。

```txt
子欄位 name
  -> 複製 LoginInstance.formValidate
  -> 新增欄位 key
  -> 回寫 formValidate
  -> prop 指向該 key
```

這個設計讓使用者可以自由組合登入欄位，但也帶來限制：欄位生命週期、動態增減與 Form 對 model 的觀察方式必須一起考慮。

## Captcha 與 Submit

`Captcha` 不只是普通 Input，它還多了一個「取得驗證碼」操作。閱讀時要看：

- 驗證碼按鈕如何觸發 `on-get-captcha`。
- 是否需要先驗證 mobile/email 欄位。
- 倒數、禁用、loading 是否由元件內處理，還是交給外部。

`Submit` 則把按鈕點擊匯到 `LoginInstance.handleSubmit()`，最後由 `Login` emit `on-submit`，payload 包含驗證結果與表單資料。

## 設計啟發

Login 家族是一個「slot 組合 + shared context + 表單驗證」的業務元件範例。仿寫時可以抽出幾個問題：

- 共用表單模型由父容器持有，還是由 composable 持有？
- 子欄位是否允許自訂 Input props、rules、prefix、placeholder？
- submit payload 是否回傳深拷貝，避免外部直接改內部狀態？
- 欄位預設驗證文案要放在元件內、locale，還是業務專案？
- 帳號、手機、信箱、驗證碼之間是否需要跨欄位驗證？

## 複習題

1. Login 為什麼用 `provide/inject` 連接子欄位？
2. `login-item.js` 為什麼用 render function，而不是只寫模板？
3. 子欄位在 `created` 時修改 `formValidate` 有什麼風險？
4. `Submit` 為什麼應該觸發父層 Login 的 submit，而不是自己驗證？
5. 如果要支援登入方式切換，表單模型和驗證規則要如何重設？
