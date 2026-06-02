# 元件 d.ts 設計

## 學習目標

這篇閱讀 View UI Plus 的元件型別宣告。重點是理解 `DefineComponent<{ ... }>` 如何描述 props、listener props、slots，以及這種宣告方式的優點與限制。

## 源碼位置

主要閱讀：

- `01-origin/source/view-ui-plus-v1.3.20/types/button.d.ts`
- `01-origin/source/view-ui-plus-v1.3.20/types/modal.d.ts`
- `01-origin/source/view-ui-plus-v1.3.20/types/table.d.ts`
- `01-origin/source/view-ui-plus-v1.3.20/types/viewuiplus.components.d.ts`

## 基本形狀

單一元件 d.ts 通常長這樣：

```ts
import type { DefineComponent } from 'vue';

export declare const Button: DefineComponent<{
    type?: '' | 'default' | 'primary';
    disabled?: boolean;
    onClick?: (event?: any) => any;
}>
```

這裡的核心是把使用者可傳入的 props 與 listener props 放進 `DefineComponent` 的泛型中。

## Props 命名

型別檔偏向描述模板使用者看到的名稱：

- runtime `htmlType` 對應 d.ts `'html-type'`。
- runtime `customIcon` 對應 d.ts `'custom-icon'`。
- runtime `modelValue` 對應 d.ts `'model-value'`。

這種宣告方式對模板使用者友善，但閱讀時要知道它和 `.vue` 內部名稱不是逐字相同。

## Listener props

事件在 d.ts 中會變成 listener props：

```ts
onClick?: (event?: any) => any;
onOnOk?: (event?: any) => any;
onOnSelectionChange?: (event?: any) => any;
```

`click` 變成 `onClick` 很直觀；`on-ok` 變成 `onOnOk` 則是因為事件名稱本身含有 `on`。這是 Vue listener prop 命名規則和 View UI Plus 事件命名疊加後的結果。

## Slots 宣告

部分元件用 `v-slots` 描述 slots：

```ts
'v-slots'?: {
    header?: () => any;
    footer?: () => any;
    default?: () => any;
};
```

這種方式可以讓型別系統知道元件接受哪些 slots，但目前 payload 多半沒有精準型別。對 Table 這種複雜 scoped slot，如果能補上 `row`、`column`、`index` 的型別，使用者體驗會更好。

## 複雜配置型別

`types/table.d.ts` 中除了 `Table` 元件，還宣告了 `TableColumnConfig`。這代表有些公開 API 不是 prop 本身，而是 prop 內部的資料結構。

`columns?: any[]` 本身很寬，但 `TableColumnConfig` 試圖描述每一欄可用欄位，例如：

- `type`
- `title`
- `key`
- `render`
- `sortable`
- `filters`
- `children`

閱讀複雜元件時，要同時看元件 props 型別和配置物件型別。

## 優點與限制

| 面向 | 優點 | 限制 |
| --- | --- | --- |
| props | 能提供基本補全 | 部分型別偏寬或偏窄 |
| events | 能提示事件名稱 | payload 常是 `any` |
| slots | 能列出部分 slot 名稱 | scoped slot payload 不夠完整 |
| instance | 宣告簡單 | ref methods 多半沒有明確型別 |
| service | 可匯出 options 型別 | `$Message`、`$Modal` 仍可能是 `any` |

這種宣告方式能快速覆蓋大量元件，但精準度有限。大型元件庫通常會逐步把高頻 API 的型別補細。

## 設計啟發

如果要仿寫一個元件 d.ts，最少要包含：

- props 名稱與合法值。
- listener props 與 payload。
- slots 名稱與 scoped payload。
- 複雜配置物件的獨立型別。
- 需要對外匯出的輔助型別。

不要只追求「不報錯」。元件庫型別的價值在於讓使用者少查文件、少猜 payload、少傳錯配置。

## 檢查問題

1. `DefineComponent<{ ... }>` 中描述的是 runtime 內部名稱，還是使用者側名稱？
2. 為什麼 `on-ok` 會對應到 `onOnOk`？
3. `v-slots` 能描述哪些 slot 資訊？目前缺少什麼？
4. 為什麼 Table 需要 `TableColumnConfig` 這種獨立型別？
5. 一個 d.ts 能讓程式不報錯，是否就代表使用者體驗足夠好？
