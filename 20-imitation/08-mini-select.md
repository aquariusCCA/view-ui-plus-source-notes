# Mini Select

Select 是第一階段最完整的互動元件練習。它同時包含受控值、選項註冊、浮層開關、單選/多選、filter 與鍵盤操作的雛形。

## 練習目標

- 練習 Select 與 Option 的註冊關係。
- 練習 `modelValue` 如何對應 option。
- 練習單選與多選的值語意。
- 練習 filter 後仍維持選中狀態。
- 練習浮層 open/close 的最小狀態。

## 對照源碼

主要對照：

- `src/components/select/`
- `types/select.d.ts`
- `src/styles/components/select.less`

閱讀時關注：

- Option 如何註冊到 Select。
- Select 如何保存 value、label 與 disabled。
- multiple 模式的值是什麼形狀。
- filterable 如何篩選選項。
- dropdown 顯示與關閉由誰控制。

## 最小實作範圍

仿寫 `MiniSelect` 與 `MiniOption`：

- `MiniSelect` 支援 `modelValue`。
- 支援 `multiple`。
- 支援 `placeholder`。
- 支援 `disabled`。
- 支援 `clearable`。
- 支援 `filterable`。
- `MiniOption` 支援 `value`、`label`、`disabled`。
- Option mount 時註冊到 Select，unmount 時解除。
- 點擊 option 後更新 `modelValue` 並 emit `change`。

先不實作：

- OptionGroup。
- remote search。
- allow-create。
- keyboard navigation 完整版。
- teleport/popper 定位。
- virtual scroll。

## API 設計

`MiniSelect`：

| 類型 | 名稱 | 說明 |
| --- | --- | --- |
| prop | `modelValue?: string \| number \| Array<string \| number>` | 選中值 |
| prop | `multiple?: boolean` | 多選 |
| prop | `placeholder?: string` | placeholder |
| prop | `disabled?: boolean` | 禁用 |
| prop | `clearable?: boolean` | 可清除 |
| prop | `filterable?: boolean` | 可搜尋 |
| emit | `update:modelValue(value)` | 值更新 |
| emit | `change(value)` | 選擇變更 |
| emit | `clear()` | 清除 |
| slot | `default` | Option |

`MiniOption`：

| 類型 | 名稱 | 說明 |
| --- | --- | --- |
| prop | `value: string \| number` | 選項值 |
| prop | `label?: string` | 顯示文字 |
| prop | `disabled?: boolean` | 禁用 |
| slot | `default` | 自訂選項內容 |

## 實作步驟

1. 建立 `select-context.ts`，定義 option 註冊資料與 injection key。
2. `MiniSelect.vue` 保存 options map。
3. `MiniOption.vue` mount 時 register，unmount 時 unregister。
4. Select 點擊控制 dropdown open。
5. 單選時點 option，值改成該 option value 並關閉 dropdown。
6. 多選時點 option，將 value 加入或移出陣列。
7. filterable 時顯示搜尋 input，根據 label 過濾 options。
8. clearable 時清空值並 emit `clear`。

## 驗收案例

- 單選模式點擊 option 後，`modelValue` 更新為該 value，dropdown 關閉。
- 多選模式點擊兩個 option 後，`modelValue` 是兩個 value 組成的陣列。
- disabled option 點擊後不會更新值。
- filterable 輸入關鍵字後，只顯示 label 符合的 options。
- clearable 點擊後，單選值變成 `undefined`，多選值變成空陣列。

## 源碼反思

View UI Plus 的 Select 遠比仿寫版複雜，包含 slot option 掃描、remote、allow-create、鍵盤游標、focus 管理、滾動定位、popper 定位與表單驗證觸發。

仿寫時先掌握選擇器的骨架：Select 管值與浮層，Option 提供可選資料，兩者透過註冊機制建立關係。
