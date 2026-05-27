# AutoComplete、TagSelect 與 WordCount

## 學習目標

這篇分析輔助型輸入元件。它們不是完整表單系統的核心，但常用來提升輸入效率、提供快速選項或補充輸入狀態。

## 對照源碼

- `01-origin/source/view-ui-plus-v1.3.20/src/components/auto-complete/auto-complete.vue`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/tag-select/tag-select.vue`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/tag-select/tag-select-option.vue`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/word-count/word-count.vue`
- `01-origin/source/view-ui-plus-v1.3.20/types/auto-complete.d.ts`
- `01-origin/source/view-ui-plus-v1.3.20/types/tag-select.d.ts`
- `01-origin/source/view-ui-plus-v1.3.20/types/word-count.d.ts`

## AutoComplete

`AutoComplete` 透過 Select 和 Option 組合出建議輸入：

| 狀態 | 說明 |
| --- | --- |
| `modelValue` | 外部輸入值 |
| `currentValue` | 內部輸入值 |
| `data` | 建議清單 |
| `filterMethod` | 本地過濾 |
| `remoteMethod` | 實際上 emit `on-search`，由外部取得資料 |

它的事件包括 `update:modelValue`、`on-change`、`on-search`、`on-select`、`on-focus`、`on-blur`、`on-clear`。選到建議項和輸入文字變化是兩件事。

## TagSelect

`TagSelect` 把 `Tag` 變成可勾選的篩選器：

- 父層維護 `currentValue` array。
- `TagSelectOption` inject 父層並以 `name` 判斷是否 checked。
- `multiple` 決定是否可多選。
- `showCheckAll` 顯示全部選項。
- `hideCheckAll` 或 limit 類 props 控制折疊顯示。
- 變更時 emit `update:modelValue`、`on-change`、`on-checked-all`。

它和 CheckboxGroup 類似，但 UI 語意更偏篩選條件。

## WordCount

`WordCount` 是顯示型輔助元件：

| prop | 說明 |
| --- | --- |
| `value` | 要統計的字串 |
| `total` | 上限 |
| `overflow` | 超過上限時是否顯示超出數 |
| prefix/suffix slots | 正常與 overflow 狀態可分別自訂 |

它不修改輸入值，只負責提示目前長度與超限狀態。

## 共同設計模式

| 元件 | 主輸入 | 輔助能力 |
| --- | --- | --- |
| `AutoComplete` | 文字 | 建議清單與搜尋 |
| `TagSelect` | array | tag UI 和全選 |
| `WordCount` | string | 字數提示 |

這些元件常和 Input、Select、Tag 組合。閱讀時要先找出誰是真正的值來源。

## 設計啟發

輔助輸入元件不一定都要控制資料提交。好的設計會讓它們只負責一件事：

```txt
AutoComplete -> 幫助輸入
TagSelect -> 快速選擇條件
WordCount -> 提示輸入狀態
```

這樣它們就能和 Form、Input、Select 保持鬆耦合。

## 複習題

1. AutoComplete 的 `on-search` 和 `on-select` 分別代表什麼？
2. TagSelect 和 CheckboxGroup 的值語意有什麼相似與差異？
3. WordCount 為什麼不應該直接限制輸入？
4. 輔助輸入元件如何判斷誰是真正的 model owner？
5. 哪些 slot 是狀態提示的一部分，應視為公開 API？
