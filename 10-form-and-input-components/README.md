# 10-form-and-input-components

本目錄存放 View UI Plus 的表單與輸入類元件分析。這裡的元件負責把使用者輸入、資料選擇、格式化、驗證、錯誤提示與提交前狀態整理成穩定的公開 API。

建議在讀完基礎元件、容器元件與導航元件後進入本章，因為表單輸入元件會同時使用 `v-model`、事件 payload、父子通訊、浮層、鍵盤操作、DOM focus、表單驗證與 TypeScript 宣告。

## 閱讀順序

| 順序 | 筆記 | 學習重點 |
| --- | --- | --- |
| 1 | [表單與輸入類元件總覽](./01-form-and-input-components-overview.md) | 建立本章元件分類、值狀態、驗證與源碼閱讀方法 |
| 2 | [Form 與 FormItem](./02-form-and-form-item.md) | 分析欄位註冊、rules 合併、async-validator、reset 與 validate 事件 |
| 3 | [Input 與 InputNumber](./03-input-and-input-number.md) | 拆解文字輸入、textarea、clearable、search、字數限制與數字輸入 |
| 4 | [Select、Option 與 OptionGroup](./04-select-option-option-group.md) | 分析選項註冊、單選/多選、filter、remote、allow-create 與鍵盤導航 |
| 5 | [Checkbox、Radio 與 Switch](./05-checkbox-radio-switch.md) | 比較單體與 group 模式、true/false value、label/value 與表單觸發 |
| 6 | [DatePicker、TimePicker 與 Calendar](./06-date-time-picker.md) | 分析日期時間值、panel、format/parser、range、confirm 與快捷操作 |
| 7 | [Slider、Rate 與 ColorPicker](./07-slider-rate-color-picker.md) | 分析拖曳、評分、顏色選取、視覺值與提交值的差異 |
| 8 | [Cascader、TreeSelect 與 Transfer](./08-cascader-tree-select-transfer.md) | 分析階層選擇、樹選擇、左右穿梭、filter 與選中狀態 |
| 9 | [Upload](./09-upload.md) | 分析檔案選擇、beforeUpload、XHR、fileList、進度與回呼契約 |
| 10 | [AutoComplete、TagSelect 與 WordCount](./10-auto-complete-tag-select-word-count.md) | 分析輔助輸入、建議選項、標籤選擇與字數統計 |
| 11 | [表單輸入元件 API 模式](./11-form-input-api-patterns.md) | 整理 `modelValue`、form trigger、events、slots、class 與型別對照 |
| 12 | [表單輸入元件設計檢查清單](./12-form-input-component-design-checklist.md) | 整理仿寫輸入元件時可重複使用的設計檢查流程 |

## 原始碼主線

主要對照這幾個位置：

- `01-origin/source/view-ui-plus-v1.3.20/src/components/form/`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/input/`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/input-number/`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/select/`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/checkbox/`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/radio/`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/date-picker/`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/upload/`
- `01-origin/source/view-ui-plus-v1.3.20/types/`
- `01-origin/source/view-ui-plus-v1.3.20/src/styles/components/`

## 本章邊界

本章只分析使用者輸入、資料選擇、表單驗證與提交前狀態管理。

- Table、Tree、List、Timeline 放在 `11-data-display-components/`；TreeSelect 因為語意是表單選擇器，放在本章交叉分析。
- Modal、Drawer、Tooltip、Poptip 放在 `12-feedback-and-overlays/`；本章只在 Select、Picker、Slider、ColorPicker 需要時討論浮層依賴。
- Login、Captcha、Password、Submit 偏業務封裝，可放在 `13-pro-and-business-components/` 或企業封裝章節。
- WordCount 不是輸入框本體，但常和 Input/Textarea 組合，因此放在本章作輔助輸入分析。

## 學完後要能回答

- `Form` 如何收集 `FormItem`，並把 `validate`、`validateField`、`resetFields` 變成公開方法？
- `FormItem` 如何從 `model`、`rules` 和 `prop` 取得要驗證的欄位值？
- `Input` 的 `on-change`、`on-input-change` 和 `update:modelValue` 有什麼差異？
- `InputNumber` 如何把字串輸入、step、min/max、precision 轉成數字值？
- `Select` 為什麼需要 `slotOptions`、`slotOptionsMap` 和 `values`？
- Checkbox/Radio 的單體模式和 group 模式在 value 語意上有什麼差異？
- DatePicker 如何把 `Date`、字串、range array 與顯示文字互相轉換？
- Upload 的 `fileList` 狀態如何跟原生 `File`、XHR 進度、成功/失敗回呼同步？
- 哪些表單輸入元件會主動呼叫 `FormItem` 的 blur/change 驗證？
