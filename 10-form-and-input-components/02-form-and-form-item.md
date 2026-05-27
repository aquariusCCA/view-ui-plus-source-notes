# Form 與 FormItem

## 學習目標

這篇分析 `Form` 和 `FormItem` 如何把一組輸入元件組成可驗證的表單系統。重點是父子註冊、rules 合併、欄位值讀取、async-validator、錯誤訊息與 reset 流程。

## 對照源碼

- `01-origin/source/view-ui-plus-v1.3.20/src/components/form/form.vue`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/form/form-item.vue`
- `01-origin/source/view-ui-plus-v1.3.20/types/form.d.ts`
- `01-origin/source/view-ui-plus-v1.3.20/src/styles/components/form.less`

## 元件分工

| 元件 | 職責 |
| --- | --- |
| `Form` | 提供 `model`、`rules`、label 設定，收集欄位 instance，暴露 validate/reset 方法 |
| `FormItem` | 對應單一 `prop`，計算 label/error 狀態，執行欄位驗證 |
| 輸入元件 | 更新自己的值，並在 blur/change 時通知 `FormItem` |

`Form` 透過 provide 提供 `FormInstance`，`FormItem` inject 後可讀取父層設定，也會再 provide 自己給 Input、Select、Upload 等子元件使用。

## 欄位註冊

`Form` 內部維護 `fields`：

```txt
Form mounted
  -> FormItem mounted
  -> 如果 FormItem 有 prop，加入 Form.fields
  -> Form validate/reset 時逐一呼叫 field 方法
  -> FormItem beforeUnmount 時移除
```

這個設計讓 `Form` 不需要解析 slot，也能支援動態增減欄位。

## 驗證流程

| 步驟 | 說明 |
| --- | --- |
| 取得 rules | 從 `Form.rules[prop]` 和 `FormItem.rules` 合併 |
| 篩選 trigger | blur/change 只跑對應 trigger 的 rule，整表 validate 則跑全部 |
| 取得欄位值 | 依 `prop` 從 `Form.model` 取值 |
| 建立 validator | 使用 `async-validator` 的 `Schema` |
| 更新狀態 | `validating`、`success`、`error` |
| 回報結果 | callback 與 `Form` 的 `on-validate` |

`FormItem` 的 `validateState` 和 `validateMessage` 是可見 UI 狀態，class 會依 error/validating 更新。

## reset 流程

`resetFields()` 逐一呼叫每個 `FormItem.resetField()`。欄位會清空驗證狀態，並把 `model[prop]` 還原到初始值。這表示初始值快照要在欄位掛載時建立，否則 reset 會變成清空而不是回復。

## 公開 API

| API | 來源 | 說明 |
| --- | --- | --- |
| `validate(callback)` | `Form` method | 驗證所有欄位，callback 接收整體是否通過 |
| `validateField(prop, cb)` | `Form` method | 驗證單一欄位 |
| `resetFields()` | `Form` method | 重設所有欄位值與驗證狀態 |
| `on-validate` | `Form` event | 單欄位驗證完成時回報 prop、是否成功、訊息 |
| `validateStatus` | `FormItem` prop | 外部強制指定欄位狀態 |

## 設計啟發

`Form` 不應知道 Input、Select、Upload 的細節。它只需要知道每個欄位能 `validate` 和 `resetField`，輸入元件則只需要在合適時機觸發 `FormItem` 的 blur/change。

這種分層讓新輸入元件接入表單時，只要遵守：

```txt
值變更 -> handleFormItemChange('change', value)
失焦 -> handleFormItemBlur('blur', value)
```

就能納入同一套驗證系統。

## 複習題

1. `Form` 為什麼要收集 `FormItem` instance，而不是直接掃描 slot？
2. `FormItem` 的 rules 來源有哪些？
3. blur/change trigger 如何影響實際執行的驗證規則？
4. `resetFields` 要正確運作，必須保存什麼資訊？
5. `validateStatus` 和內部 `validateState` 的差異是什麼？
