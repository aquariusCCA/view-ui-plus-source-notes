# Mini Form

Form 是第一階段最重要的父子協作練習。它讓你看懂元件庫如何把多個欄位收集起來，對外提供 `validate`、`resetFields` 這類高階方法。

## 練習目標

- 練習 Form 與 FormItem 之間的 provide/inject。
- 練習欄位註冊與解除註冊。
- 練習從 `model`、`rules`、`prop` 取得欄位值與規則。
- 練習 promise-based validate API。
- 練習 expose 公開方法。

## 對照源碼

主要對照：

- `src/components/form/`
- `types/form.d.ts`
- `src/styles/components/form.less`

閱讀時關注：

- FormItem 如何註冊到 Form。
- `prop` 如何對應 `model` 的欄位。
- rules 如何合併。
- validate、validateField、resetFields 的回傳語意。
- input 元件如何觸發 FormItem 驗證。

## 最小實作範圍

仿寫 `MiniForm` 與 `MiniFormItem`：

- `MiniForm` 支援 `model`、`rules`。
- `MiniFormItem` 支援 `prop`、`label`。
- FormItem mount 時註冊到 Form，unmount 時解除。
- Form expose `validate()`、`validateField(prop)`、`resetFields()`。
- FormItem expose 或內部提供 `validate()`、`resetField()`。
- 只實作 required 驗證。

先不實作：

- async-validator 完整規則。
- nested path。
- validate trigger。
- label width 自動計算。
- inline layout。
- scrollToField。

## API 設計

`MiniForm`：

| 類型 | 名稱 | 說明 |
| --- | --- | --- |
| prop | `model: Record<string, any>` | 表單資料 |
| prop | `rules?: Record<string, MiniFormRule[]>` | 驗證規則 |
| slot | `default` | FormItem |
| expose | `validate()` | 驗證全部欄位 |
| expose | `validateField(prop)` | 驗證指定欄位 |
| expose | `resetFields()` | 重置全部欄位 |

`MiniFormItem`：

| 類型 | 名稱 | 說明 |
| --- | --- | --- |
| prop | `prop?: string` | 欄位 key |
| prop | `label?: string` | 欄位標籤 |
| slot | `default` | 表單控制項 |

規則型別：

```ts
interface MiniFormRule {
  required?: boolean
  message?: string
}
```

## 實作步驟

1. 建立 `form-context.ts`，定義 Form context、FormItem context 與 injection key。
2. `MiniForm.vue` 建立 `fields` 陣列，提供 `addField`、`removeField`。
3. `MiniFormItem.vue` 在 mount 註冊自己，在 unmount 解除。
4. FormItem 保存 initialValue，用於 reset。
5. FormItem 的 `validate` 只檢查 required。
6. Form 的 `validate` 對所有 fields 執行 validate，回傳 Promise。
7. Form 的 `validateField` 找到指定 prop 的 field 後驗證。
8. 補上錯誤訊息與 basic class。

## 驗收案例

- 空值欄位有 required rule 時，`validate()` rejected 或回傳 false。
- 填入值後，`validate()` 通過。
- `validateField('name')` 只驗證 name 欄位。
- `resetFields()` 會把欄位值還原成初始值。
- FormItem unmount 後，不應該再被 Form validate。

## 源碼反思

View UI Plus 的 Form 真正複雜處在驗證規則合併、trigger、nested model path、async-validator、錯誤狀態同步、label 排版與各種輸入元件的協作。

仿寫版先建立最核心的 mental model：Form 不直接知道每個 input，它只管理 FormItem；FormItem 再透過 prop 把 model、rules 與錯誤訊息串起來。
