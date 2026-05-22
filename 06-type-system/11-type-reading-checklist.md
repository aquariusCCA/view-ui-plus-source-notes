# Type Reading Checklist：閱讀單一元件型別的檢查清單

## 1. 本章定位

本章提供一份實戰檢查表。

當你要讀 View UI Plus 的某個元件型別時，不要只打開 `types/<component>.d.ts` 看一眼 props。正確做法是把 runtime、type、plugin、registry、文件化意圖放在一起檢查。

---

## 2. 快速檢查流程

讀任一元件時，照這個順序：

```txt
1. 找 runtime component source
2. 找 type declaration
3. 找 export registry
4. 對照 props
5. 對照 emits / v-model
6. 對照 slots
7. 對照 instance methods
8. 對照 service / globalProperties
9. 標記 any / Function / object
10. 判斷是否有泛型改良價值
```

---

## 3. 檔案位置檢查

| 要找什麼 | 位置 |
| --- | --- |
| runtime component | `src/components/<name>/**` |
| component declaration | `types/<name>.d.ts` |
| runtime named export | `src/components/index.js` |
| type named export | `types/viewuiplus.components.d.ts` |
| package type entry | `types/index.d.ts` |
| plugin install / globalProperties | `src/index.js` |
| global property type | `types/index.d.ts` 的 `ComponentCustomProperties` |

如果某個元件是 service-style API，例如 Message / Modal / Notice，還要檢查：

```txt
src/components/<name>/index.js
types/<name>.d.ts
types/index.d.ts 的 $Name
```

---

## 4. Props Checklist

對每個 prop 問：

| 問題 | 目的 |
| --- | --- |
| runtime prop 名稱是 camelCase 還是 kebab-case？ | 對照 public type |
| `.d.ts` 是否使用 kebab-case？ | 確認 template 使用體驗 |
| runtime 有 validator 嗎？ | 判斷能否轉 literal union |
| type union 是否和 validator 一致？ | 找出過寬或過窄 |
| runtime default 是否依賴 `$VIEWUI`？ | 連到 global config |
| prop 是否來自 mixin？ | 不漏掉 shared props |
| prop 是否是 `any` / `object` / `Function`？ | 標記弱契約 |

範例：

```txt
Button.htmlType
  runtime: htmlType
  public type: 'html-type'
  validator: button / submit / reset
  type: 'button' | 'submit' | 'reset'
```

---

## 5. Emits Checklist

對每個 event 問：

| 問題 | 目的 |
| --- | --- |
| runtime `emits` 有列出嗎？ | 確認正式事件 |
| `$emit` 實際 payload 是什麼？ | 不只看事件名 |
| `.d.ts` 是否有 `onXxx` / `onOnXxx`？ | 確認 type listener |
| event 是 `click` 還是 `on-click`？ | 判斷 listener 命名 |
| 是否有 `update:modelValue`？ | 判斷 v-model |
| 是否有對應 `'model-value'` prop？ | 判斷 model prop type |
| 是否有 `onUpdate:modelValue` type？ | 判斷 update listener 精準度 |
| payload 是否是 `any`？ | 標記改良空間 |

命名對照：

```txt
click -> onClick
on-change -> onOnChange
on-visible-change -> onOnVisibleChange
update:modelValue -> 理想上可對應 'onUpdate:modelValue'
```

---

## 6. Slots Checklist

對 slots 問：

| 問題 | 目的 |
| --- | --- |
| template 中有哪些 `<slot>`？ | 找 runtime slot |
| `.d.ts` 是否有 `'v-slots'`？ | 找 type slot hints |
| slot 是普通 slot 還是 scoped slot？ | 判斷是否需要 payload |
| slot props 是否被型別化？ | 判斷精準度 |
| slot 名稱和文件是否一致？ | 避免 runtime/type/docs gap |

常見 declaration：

```ts
'v-slots'?: {
  header?: () => any;
  footer?: () => any;
  default?: () => any;
}
```

這代表 slot 名稱有提示，但 slot props 通常沒有精準化。

---

## 7. Instance Methods Checklist

對 component methods 問：

| 問題 | 目的 |
| --- | --- |
| runtime `methods` 中哪些可能是 public？ | 找 ref API |
| 哪些只是 `handleXxx` 內部方法？ | 避免誤認 public API |
| `.d.ts` 是否導出 `XxxInstance`？ | 判斷 ref type |
| `InstanceType<typeof Xxx>` 是否可用？ | 使用者如何取得 instance type |
| method 參數與回傳值是否描述？ | 判斷完整度 |

例子：

```txt
Input.focus()
Input.blur()
```

這類比較像 public ref API；`handleInput()`、`setCurrentValue()` 則比較像內部方法。

---

## 8. Service API Checklist

如果是 Message / Modal / Notice / LoadingBar：

| 問題 | 目的 |
| --- | --- |
| runtime object 有哪些 methods？ | 找 service API |
| options 可以是 string shortcut 嗎？ | 找 overload |
| method 回傳什麼？ | 找 close function / void |
| `.d.ts` 是否有 service interface？ | 判斷 method-level contract |
| `ComponentCustomProperties` 是否只是 `any`？ | 判斷 global property 精準度 |
| named import 與 `this.$Xxx` 是否應同型別？ | 維護一致性 |

例子：

```txt
Message.success(options) -> close function
Message.config(options) -> void
Modal.confirm(options) -> runtime opens modal
Modal.remove() -> removes modal
```

---

## 9. 泛型價值 Checklist

問這個元件是否值得泛型化：

| 問題 | 若答案是 yes |
| --- | --- |
| 是否接收使用者資料陣列？ | 考慮 `TRecord` / `TItem` |
| callback payload 是否回傳同一種資料？ | 泛型可串起事件 |
| option value 是否和 modelValue 對齊？ | 考慮 `TValue` |
| rules / prop 是否依賴 model shape？ | 考慮 `TModel` |
| slot props 是否包含 row/node/option？ | 考慮 scoped slot generics |

高優先元件：

```txt
Table
Form
Select
Tree
TreeSelect
Transfer
Upload
```

低優先元件：

```txt
Button
Icon
Divider
Badge
Alert
```

---

## 10. 最終判斷表

讀完後可以填一張表：

| 面向 | 狀態 | 備註 |
| --- | --- | --- |
| runtime source 找到 | yes/no | |
| type declaration 找到 | yes/no | |
| registry 對齊 | yes/no | |
| props 對齊 | good/gap | |
| emits 對齊 | good/gap | |
| v-model 對齊 | good/gap | |
| slots 對齊 | good/gap | |
| instance methods 有無型別 | good/gap | |
| global service 有無型別 | good/gap | |
| 弱型別位置 | list | `any` / `Function` / `object` |
| 泛型價值 | high/medium/low | |

---

## 11. 本章結論

View UI Plus 的型別閱讀不能停在 `.d.ts`。真正可靠的做法是把 runtime source、type declaration、export registry、plugin globalProperties 一起看。

這份 checklist 的目的不是要求每個元件都完美，而是幫你快速定位：

```txt
哪裡已經是強契約
哪裡只是弱提示
哪裡 runtime/type 不一致
哪裡值得泛型改良
```

---

## 12. 自我檢查問題

1. 讀 props 時，為什麼要檢查 mixins？
2. 讀 emits 時，為什麼要搜尋 `$emit` 而不只看 `emits`？
3. `v-slots` 能不能代表 scoped slot props 已完整型別化？
4. 為什麼 service API 要另外檢查 `src/components/<name>/index.js`？
5. 哪三類元件最值得優先泛型化？

