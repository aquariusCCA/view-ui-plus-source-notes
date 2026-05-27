# 表單輸入元件設計檢查清單

## 學習目標

這篇把本章分析整理成檢查清單。未來仿寫 Input、Select、DatePicker、Upload、Cascader 這類表單輸入元件時，可以用這份清單檢查值模型、事件、驗證、浮層、子項註冊、slot 與型別宣告是否完整。

## 1. 元件定位

設計前先回答：

| 問題 | 判斷 |
| --- | --- |
| 它收集的是文字、數字、布林、選項、日期、檔案還是集合？ | 決定公開值型別 |
| 是否有暫存互動狀態？ | 決定是否需要 `currentValue`、query、panel state |
| 是否能被清空？ | 決定空值是 `''`、`null`、`[]` 還是 undefined |
| 是否有子元件？ | 決定 provide/inject 或註冊清單 |
| 是否接入 Form？ | 決定 blur/change 驗證時機 |

先定義提交值，再設計畫面互動。

## 2. 值狀態檢查

| 檢查項 | 說明 |
| --- | --- |
| `modelValue` 型別是否明確 | 單值、array、Date、File list 都要清楚 |
| 內部 mirror state 是否必要 | 顯示值、暫存值、選中物件要分層 |
| prop 變化是否同步 | watcher 是否完整 |
| 清空值是否一致 | clear、reset、外部設空值都要一致 |
| 非法暫存輸入如何處理 | 數字、日期、顏色常會遇到 |

完成後要能寫出：

```txt
modelValue -> internal state -> visual state -> emit value
```

## 3. 事件檢查

| 檢查項 | 說明 |
| --- | --- |
| 是否 emit `update:modelValue` | 受控元件必備 |
| `on-change` payload 是否穩定 | 業務會依賴 |
| 即時預覽和提交是否分開 | Slider、ColorPicker、DatePicker |
| clear 是否有專屬事件 | 方便業務辨識操作來源 |
| open/visible 是否有事件 | 下拉、picker、color picker |
| callback props 是否需要 | Upload 這類副作用流程 |

事件名稱要描述使用者或業務語意，不只是內部方法名。

## 4. Form 整合檢查

| 檢查項 | 說明 |
| --- | --- |
| 是否 inject `FormItemInstance` | 需要驗證就要接入 |
| blur 何時觸發 | 文字輸入、日期輸入 |
| change 何時觸發 | 選項、布林、上傳成功 |
| disabled 時是否阻止驗證 | 避免無效欄位干擾 |
| reset 後 UI 是否同步 | FormItem reset 會改 model |

輸入元件不要自己讀 rules，rules 應留在 FormItem。

## 5. 子項與資料檢查

| 檢查項 | 適用元件 |
| --- | --- |
| 子項是否 mounted 註冊 | Select、Form、TagSelect |
| 子項 beforeUnmount 是否移除 | 動態 option 必備 |
| 是否需要 value -> option 反查 | Select、TreeSelect |
| filter 後焦點是否仍合法 | Select、Transfer |
| disabled 子項是否排除互動 | 所有選擇器 |

有子項註冊時，要同時設計順序、唯一 key、動態移除與空資料。

## 6. 浮層與 DOM 檢查

| 檢查項 | 說明 |
| --- | --- |
| visible 是否可控 | Select、DatePicker、ColorPicker |
| click outside 是否清理 | 防止記憶體洩漏 |
| transfer 後 class/width 是否正確 | 下拉層需要對齊 trigger |
| focus/blur 是否和下拉競爭 | filterable Select、AutoComplete |
| 拖曳 listener 是否清理 | Slider、ColorPicker |

只要讀 DOM 或綁全域事件，就要把 mounted、updated、beforeUnmount 一起看。

## 7. Props 與 Slots 檢查

| 檢查項 | 說明 |
| --- | --- |
| validator 與 union type 是否同步 | `type`、`size`、`placement` |
| `name` / `elementId` 是否傳到原生元素 | 表單與 accessibility |
| prefix/suffix 是否有 prop 與 slot fallback | Input、Select、WordCount |
| default slot 是否承載子元件 | Select、CheckboxGroup、TagSelect |
| 自訂 render 是否影響事件 payload | Transfer、Upload、Calendar |

slot 只要影響可見值、選項文字或提示狀態，就要文件化。

## 8. Runtime 與型別檢查

逐項核對：

| 檢查項 | 常見問題 |
| --- | --- |
| runtime prop type | 支援 `String/Number/Array`，型別只寫 string |
| emit payload | 多參數 event 在型別中被寫成 any |
| callback props | file、fileList、response 參數漏記 |
| exposed methods | Form validate/reset 未完整描述 |
| slots | prefix、suffix、cell、list slot 漏列 |
| value empty state | `null`、`''`、`[]` 描述不一致 |

型別是表單元件的使用體驗，不只是文件補充。

## 最小仿寫流程

1. 定義公開值型別與空值。
2. 定義內部顯示值、暫存值和提交值。
3. 設計 `modelValue` watcher 和 `update:modelValue`。
4. 設計 `on-change`、clear、open、select、input 等事件。
5. 決定是否需要 FormItem blur/change 驗證。
6. 若有子元件，設計註冊、移除、反查與動態更新。
7. 若有浮層或拖曳，補 DOM 測量、全域事件與 cleanup。
8. 補 slots 與 fallback 優先順序。
9. 補 `.d.ts`，核對 props、events、slots、methods、callback payload。
10. 用空值、disabled、外部受控、動態資料、表單 reset 和驗證錯誤測一輪。

## 複習題

1. 仿寫輸入元件時，第一個要決定的是畫面還是提交值？
2. 什麼情境下應該讓即時預覽事件和提交事件分開？
3. 子項註冊最容易漏掉哪個生命週期？
4. 清空值應該由每個元件自由決定，還是寫成公開契約？
5. 為什麼 Upload 的設計檢查和一般 `v-model` 元件不同？
