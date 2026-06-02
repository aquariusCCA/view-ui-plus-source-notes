# Slots API 設計

## 學習目標

這篇分析 View UI Plus 的 slots API。重點是理解 slot 不只是「插入內容」，在複雜元件中還會形成穩定的擴展契約，例如 Table 的 scoped slot 會把 `row`、`column`、`index` 暴露給使用者。

## 源碼位置

主要閱讀：

- `01-origin/source/view-ui-plus-v1.3.20/src/components/button/button.vue`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/modal/modal.vue`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/table/table.vue`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/table/slot.js`
- `01-origin/source/view-ui-plus-v1.3.20/types/modal.d.ts`
- `01-origin/source/view-ui-plus-v1.3.20/types/table.d.ts`

## Slot 類型

| 類型 | 例子 | API 特徵 |
| --- | --- | --- |
| default slot | `Button` 文字、`Modal` 主體 | 使用者放主要內容 |
| 具名 slot | `Modal` 的 `header`、`footer`、`close` | 替換特定區域 |
| fallback slot | `Modal` header/footer 預設按鈕 | 沒傳 slot 時元件提供預設內容 |
| scoped slot | `Table` column slot | 元件把資料傳給使用者渲染 |
| 狀態 slot | `Table` 的 `loading`、`contextMenu` | 替換特定狀態或浮層內容 |

slot 的公開程度通常高於內部 DOM 結構。使用者一旦依賴某個 slot 名稱和參數形狀，元件庫就要把它當成穩定 API 維護。

## Button 的最小 slot

`Button` 只判斷 `this.$slots.default`，用來決定是否顯示文字，以及是否套用 icon-only class。

這種 slot 沒有參數，契約很單純：

- 使用者可以傳入按鈕文字或任意子節點。
- 元件會把內容包在內部 `<span>`。
- 是否有 default slot 會影響樣式 class。

即使是最小 slot，也可能影響元件外觀邏輯。

## Modal 的區域替換

`Modal` 提供：

- `default`：對話框主體。
- `header`：自訂頁頭。
- `footer`：自訂底部。
- `close`：自訂右上角關閉內容。

`header` 和 `footer` 都有 fallback。使用者不傳 slot 時，元件會用 `title`、`okText`、`cancelText` 等 props 渲染預設內容；使用者傳入 slot 後，這些預設內容就被替換。

這代表 slot 和 prop 之間有優先級關係。閱讀 slot API 時，要特別注意「slot 存在時哪些 prop 會失效或只保留部分作用」。

## Table 的 scoped slot

`Table` 的 column slot 不是直接出現在 `table.vue` 的模板中，而是透過 `components/table/slot.js` 呼叫：

```js
this.TableInstance.$slots[this.column.slot]({
    row: this.row,
    column: this.column,
    index: this.index
})
```

這形成一個穩定契約：

- column 設定中的 `slot` 指定要使用哪個 slot 名稱。
- slot 會收到 `row`、`column`、`index`。
- 使用者可以根據這些資料自訂儲存格內容。

這類 API 比普通 slot 更需要型別描述，因為使用者會在 slot template 裡直接使用這些資料。

## d.ts 中的 `v-slots`

View UI Plus 在部分元件 d.ts 中用 `v-slots` 描述 slot：

```ts
'v-slots'?: {
    header?: () => any;
    footer?: () => any;
    default?: () => any;
};
```

這能讓 JSX / TSX 或型別工具知道元件接受哪些 slots。不過目前很多 slot payload 還是偏寬鬆，像 Table column slot 的 scoped payload 並沒有被完整型別化。

## 設計啟發

設計 slot API 時，要先決定 slot 是版面插入點還是資料渲染契約。

版面插入點通常只需要穩定名稱，例如 `header`、`footer`。資料渲染契約則需要穩定 payload，例如 `row`、`column`、`index`，而且型別應該跟資料模型保持一致。

## 檢查問題

1. `Button` 的 default slot 除了顯示文字，還影響了哪些樣式判斷？
2. `Modal` 的 `header` slot 和 `title` prop 之間有什麼優先級關係？
3. `Table` column slot 為什麼需要 scoped payload？
4. `v-slots` 在 d.ts 中解決什麼問題？
5. 哪些 slot 變更會被視為破壞性變更？
