# 表單輸入元件 API 模式

## 學習目標

這篇把本章元件抽象成可重複使用的 API 閱讀框架。讀完後，要能看到一個新輸入元件時，快速拆出值模型、事件、表單驗證、子項註冊、浮層、class 狀態與型別漂移。

## 值模型

| 模式 | 元件 | 說明 |
| --- | --- | --- |
| `modelValue` + `currentValue` | Input、Checkbox、Radio、Switch、AutoComplete | 外部受控值和內部顯示值分開 |
| `modelValue` + option object | Select、TreeSelect | 對外值和顯示 label/節點物件分開 |
| array path | Cascader | value path 與 selected node path 分開 |
| target keys | Transfer | 右側資料以 key 集合描述 |
| file list | Upload | 檔案生命週期不適合單一 v-model |
| panel state | DatePicker、ColorPicker | 暫存選擇和提交值分開 |

先判斷公開值型別，再追內部 mirror state。

## 事件模式

| 事件 | 用途 |
| --- | --- |
| `update:modelValue` | v-model 同步 |
| `on-change` | 對外語意變更 |
| `on-input` | 拖曳或輸入中的即時值 |
| `on-input-change` | Input 原生 input event |
| `on-clear` | 清空操作 |
| `on-open-change` | 下拉或面板開合 |
| `on-select` | 選中某個 option 或建議項 |
| callback props | Upload 上傳生命週期 |

`update:modelValue` 不等於 `on-change`。前者服務受控資料，後者服務業務反應。

## 表單驗證模式

| 觸發 | 常見元件 |
| --- | --- |
| blur | Input、AutoComplete、DatePicker |
| change | Select、CheckboxGroup、RadioGroup、Switch、Upload |
| submit 前整表 validate | Form |
| reset | FormItem |

輸入元件不直接執行 rules，而是通知 `FormItem`。這讓驗證規則集中在表單層。

## 子項註冊模式

| 父元件 | 子元件 | 註冊資料 |
| --- | --- | --- |
| Select | Option、OptionGroup | value、label、disabled、instance |
| CheckboxGroup | Checkbox | label 與 checked 狀態 |
| RadioGroup | Radio | label 與 checked 狀態 |
| Cascader | Caspanel、Casitem | 階層節點與路徑 |
| TagSelect | TagSelectOption | name 與 checked |
| Form | FormItem | prop、validate、reset |

只要父層需要批次驗證、鍵盤導航或由值反查子項，就需要註冊機制。

## Props 設計模式

| 類型 | 建議 |
| --- | --- |
| 受控值 | `modelValue`，型別要和 runtime 一致 |
| 行為開關 | `clearable`、`filterable`、`multiple`、`disabled` |
| 輸入限制 | `maxlength`、`min`、`max`、`step`、`format` |
| 視覺變體 | `size`、`type`、`placement`、`transfer` |
| 表單整合 | `name`、`elementId`、`labelFor` |
| 自訂函式 | `filterMethod`、`remoteMethod`、`beforeUpload` |

有限字串應同時有 runtime validator 和 TypeScript union。

## Slots 模式

| slot | 元件 |
| --- | --- |
| default 作選項或內容 | Select、CheckboxGroup、RadioGroup、TagSelect |
| prefix/suffix | Input、Select、WordCount |
| open/close | Switch |
| 自訂 cell | Calendar |
| upload trigger | Upload |
| list/item render | Transfer、UploadList |

slot 如果會改變值選擇、提示狀態或顯示 label，就要視為公開 API。

## Class 狀態

常見 class 語意：

```txt
ivu-*-disabled
ivu-*-focused
ivu-*-error
ivu-*-validating
ivu-*-checked
ivu-*-selected
ivu-*-visible
ivu-*-multiple
ivu-*-uploading
```

輸入元件的 class 往往同時服務互動狀態、表單狀態和樣式覆蓋，不應隨意改名。

## 型別對照重點

核對 `.d.ts` 時優先看：

| 檢查項 | 常見風險 |
| --- | --- |
| `modelValue` 型別 | runtime 支援 number/null/array，但型別可能過窄 |
| events payload | runtime emit 多參數，型別可能寫成 any |
| callback props | Upload 生命週期參數容易漏 |
| slots | prefix/suffix/custom cell 容易未列 |
| group 子元件 | 子元件在 group 中的 value 語意容易描述不清 |
| methods | Form 的 validate/reset 需要能被 instance 呼叫 |

## 複習題

1. 為什麼 `on-change` 不應被視為 `update:modelValue` 的別名？
2. 哪些輸入元件需要暫存互動狀態？
3. 什麼情境下 callback props 比 emit 更適合？
4. 表單驗證 trigger 應該由誰決定？
5. 型別檔最容易和 runtime 漂移的地方有哪些？
