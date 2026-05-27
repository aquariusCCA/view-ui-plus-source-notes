# 事件與 v-model 契約

## 學習目標

這篇分析 View UI Plus 的事件 API。重點是理解 `emits`、`$emit`、`update:modelValue`、`on-*` 命名與 TypeScript listener prop 之間的關係。

## 源碼位置

主要閱讀：

- `01-origin/source/view-ui-plus-v1.3.20/src/components/button/button.vue`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/modal/modal.vue`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/table/table.vue`
- `01-origin/source/view-ui-plus-v1.3.20/types/button.d.ts`
- `01-origin/source/view-ui-plus-v1.3.20/types/modal.d.ts`
- `01-origin/source/view-ui-plus-v1.3.20/types/table.d.ts`

## 事件來源

事件 API 不能只看 `emits` 陣列，還要看實際 `$emit` 呼叫。

例如 `Modal` 宣告：

```js
emits: ['on-cancel', 'on-ok', 'on-hidden', 'on-visible-change', 'update:modelValue']
```

再從 methods 與 watcher 中可以看到實際 payload：

- `update:modelValue` 會送出 `false`。
- `on-cancel` 沒有 payload。
- `on-ok` 沒有 payload。
- `on-hidden` 沒有 payload。
- `on-visible-change` 會送出目前顯示狀態。

`emits` 告訴你事件名稱，`$emit` 才能告訴你事件參數。

## v-model 契約

Vue 3 的基本 v-model 契約是：

| 部分 | 作用 |
| --- | --- |
| `modelValue` prop | 外部傳入目前值 |
| `update:modelValue` event | 元件要求外部更新值 |

`Modal` 的關閉流程會設定內部 `visible = false`，並 emit `update:modelValue`。這讓使用者可以寫：

```vue
<Modal v-model="visible" />
```

這裡的重點是：元件不能只改自己的內部狀態，還要通知父層更新來源資料，否則下一次 render 可能又被外部值覆蓋。

## `on-*` 事件命名

View UI Plus 延續 iView 系列的事件命名習慣，很多事件叫 `on-ok`、`on-cancel`、`on-sort-change`。

模板中會寫：

```vue
<Modal @on-ok="save" @on-cancel="close" />
<Table @on-sort-change="handleSort" />
```

到了 `DefineComponent` 的 props 型別中，listener 會變成類似：

```ts
onOnOk?: (event?: any) => any;
onOnSortChange?: (event?: any) => any;
```

這個命名看起來重複，是因為 Vue listener prop 本來就以前綴 `on` 表示事件監聽，而事件名稱本身又叫 `on-ok`。

## 事件分類

| 類型 | 例子 | 設計重點 |
| --- | --- | --- |
| 原生互動事件 | `Button` 的 `click` | payload 通常是 DOM event |
| 狀態同步事件 | `update:modelValue` | 必須和 prop 搭配形成雙向契約 |
| 生命週期事件 | `Modal` 的 `on-hidden` | 描述動畫或顯示流程節點 |
| 使用者操作事件 | `Table` 的 `on-row-click`、`on-select` | payload 應穩定，避免破壞外部邏輯 |
| 資料變化事件 | `Table` 的 `on-sort-change`、`on-filter-change` | 常用於遠端查詢或同步狀態 |

複雜元件的事件 API 很容易變成使用者業務程式的核心依賴，所以事件 payload 的穩定性比事件數量更重要。

## 型別宣告的限制

View UI Plus 的很多事件在 `.d.ts` 中寫成：

```ts
onOnSelectionChange?: (event?: any) => any;
```

這能提供事件名稱補全，但不能精準提示 payload。以 `Table` 來說，`on-selection-change` 實際會傳出 selection；`on-sort-change` 會傳出包含排序資訊的物件，但型別沒有完整描述。

如果自己設計元件庫，可以進一步把 payload 型別抽出：

```ts
onOnSortChange?: (payload: TableSortChangePayload) => void;
```

這會讓使用者在處理事件時得到更好的 IDE 提示與重構保護。

## 設計啟發

事件 API 設計時，要避免只討論名稱。完整事件契約至少包含：

- 事件在什麼時機觸發。
- 是否一定觸發，還是只在特定模式下觸發。
- payload 的參數數量、順序與資料形狀。
- 是否會和 v-model 或內部狀態同步產生關聯。
- 型別宣告是否能讓使用者知道 payload。

## 檢查問題

1. 為什麼分析事件不能只看 `emits`？
2. `modelValue` 和 `update:modelValue` 分別負責什麼？
3. 為什麼 `on-ok` 在 d.ts 裡會變成 `onOnOk`？
4. `Table` 的排序事件如果 payload 型別是 `any`，會少掉哪些開發體驗？
5. 事件 payload 的穩定性為什麼會影響破壞性變更？
