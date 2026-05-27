# Select、Option 與 OptionGroup

## 學習目標

這篇分析 `Select` 如何管理選項、顯示 label、實際 value、filter query、remote loading 與多選 tag。重點是子選項註冊、`values` 狀態、鍵盤導航與事件 payload。

## 對照源碼

- `01-origin/source/view-ui-plus-v1.3.20/src/components/select/select.vue`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/select/select-head.vue`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/select/option.vue`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/select/option-group.vue`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/select/dropdown.vue`
- `01-origin/source/view-ui-plus-v1.3.20/types/select.d.ts`
- `01-origin/source/view-ui-plus-v1.3.20/src/styles/components/select.less`

## 結構分工

| 元件 | 職責 |
| --- | --- |
| `Select` | 管理值、query、visible、option 清單、事件與表單驗證 |
| `SelectHead` | 渲染單選文字、多選 tag、filter input、clear/arrow icon |
| `Option` | 提供 value、label、disabled，註冊到 Select |
| `OptionGroup` | 提供分組 label 與 disabled 狀態 |
| `Drop` | 包裝下拉層、寬度與定位更新 |

`Select` 不只看 slot，它會維護 `slotOptions` 與 `slotOptionsMap`，讓動態 option、鍵盤焦點、filter 與 value 反查都能穩定運作。

## 值與選項狀態

| 狀態 | 說明 |
| --- | --- |
| `modelValue` | 外部 v-model 值，單選是單值，多選是 array |
| `values` | 內部選中 option 資料，包含 label/value/tag 等 |
| `publicValue` | 對外事件使用的簡化值 |
| `query` | filter 或 remote 查詢字串 |
| `focusIndex` | 鍵盤上下鍵目前焦點 option |
| `visible` | 下拉層開合 |

單選和多選的分歧集中在 `onOptionClick` 與 watcher：單選選中後關閉下拉，多選則要維持下拉並更新 tag。

## Option 註冊

```txt
Option mounted
  -> inject SelectInstance
  -> addOption()
  -> Select.slotOptions / slotOptionsMap 更新
  -> Select.lazyUpdateValue()

Option beforeUnmount
  -> removeOption()
  -> 清理 slotOptions / slotOptionsMap
```

這個流程解決了「外部 modelValue 先到，Option 後渲染」或「Option 被 v-if 移除」時的同步問題。

## Filter 與 Remote

| 模式 | 行為 |
| --- | --- |
| local filter | `Option.isShow` 根據 query 與 label/value 判斷 |
| remote | `remoteMethod(query)` 負責取得資料，可回填 options |
| allow-create | query 沒有匹配項時可建立新 option |
| defaultLabel | remote 初始值沒有 option 時仍能顯示文字 |

filterable Select 的輸入框不是最終值，而是查詢狀態。這是 Select 和 Input 最大的差異。

## 事件

| 事件 | payload |
| --- | --- |
| `update:modelValue` | 單值、多選 array 或清空值 |
| `on-change` | 變更後的公開值 |
| `on-select` | 被點選的 option 資料 |
| `on-query-change` | filter query |
| `on-open-change` | 下拉開合狀態 |
| `on-clear` | 清空時觸發 |
| `on-create` | allow-create 建立選項 |

## 設計啟發

Select 的難點不是「選中一個 option」，而是維持三種資料一致：

```txt
外部 value
內部 option object
畫面顯示 label/tag/query
```

只要支援 remote、多選或動態 option，就需要明確的 option registry，而不能只依賴目前 DOM。

## 複習題

1. `Select` 為什麼需要 `slotOptionsMap`？
2. 單選和多選的 `modelValue` 型別與關閉下拉行為有什麼差異？
3. filterable 的 `query` 為什麼不等於選中值？
4. remote Select 初始值為什麼需要 `defaultLabel`？
5. `on-select` 和 `on-change` 的 payload 語意有什麼不同？
