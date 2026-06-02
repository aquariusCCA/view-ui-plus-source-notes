# 元件樹通信與查找

## 學習目標

這篇分析 View UI Plus 在 Options API 元件樹中進行跨層查找與事件通信的方式。

元件庫裡很多元件不是孤立存在，而是成組協作：Menu / Submenu / MenuItem、Dropdown / DropdownItem、Cascader / CasPanel / CasItem、Form / FormItem / Input。這些元件需要找到彼此、傳遞狀態或觸發事件。

## 對照源碼

- `01-origin/source/view-ui-plus-v1.3.20/src/utils/assist.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/mixins/emitter.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/dropdown/dropdown.vue`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/menu/menu-item.vue`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/cascader/caspanel.vue`

這幾個元件不是完整使用清單，而是代表不同類型的元件樹查找場景：`dropdown.vue` 用來看同類型 Dropdown 巢狀時如何往上找父層 `Dropdown`；`menu-item.vue` 用來看選單子項如何找到外層 `Menu` 與最近的 `Submenu`；`caspanel.vue` 則用來看 Cascader 多層面板如何同時找外層 `Cascader` 與父層 `Caspanel`，協調複雜選項面板的狀態。

## 元件查找工具

`assist.js` 提供一組元件樹查找函數：

| 函數 | 方向 | 用途 |
| --- | --- | --- |
| `findComponentUpward` | 往父層找第一個指定元件 | 子元件找容器元件 |
| `findComponentsUpward` | 往父層找所有指定元件 | 判斷多層嵌套狀態 |
| `findComponentDownward` | 往子層找第一個指定元件 | 容器找內部指定子元件 |
| `findComponentsDownward` | 往子層找所有指定元件 | 收集所有子項 |
| `findBrothersComponents` | 找同層兄弟元件 | 群組內互斥或同步 |

這些工具都依賴 Vue instance 的 `$parent`、`$children` 與 `child.$options.name`。

## 使用模式

典型流程是：

```txt
目前元件
  -> 讀取 this.$parent 或 this.$children
  -> 檢查 $options.name
  -> 找到目標元件 instance
  -> 呼叫目標元件方法或讀取狀態
```

例如 DropdownItem 需要知道自己屬於哪個 Dropdown；MenuItem 需要找到上層 Menu 或 Submenu；Cascader 面板需要回到外層 Cascader 協調選取狀態。

這種方式的優點是直接，缺點是耦合元件名稱和結構。

## `emitter.js`

`mixins/emitter.js` 提供兩個方法：

```js
dispatch(componentName, eventName, params)
broadcast(componentName, eventName, params)
```

`dispatch` 往父層找指定 componentName，找到後用 `$emit` 觸發事件。

`broadcast` 往子層遞迴找指定 componentName，找到後同樣用 `$emit` 觸發事件。

這是 Vue 2 時代元件庫常見的跨層通信模式，用來彌補 `$emit` 只能向直接父層傳遞的限制。

## 與 `provide/inject` 的差異

| 方式 | 適合場景 | 風險 |
| --- | --- | --- |
| `findComponentUpward` | 子元件偶爾需要找到上層容器 instance | 依賴元件 `name` 與樹結構 |
| `dispatch/broadcast` | 需要跨層觸發事件，且仍維持事件語意 | 事件名稱與參數不容易追蹤 |
| `provide/inject` | 容器穩定提供上下文，例如 Form / FormItem | 注入 key 要穩定，過度使用會隱藏資料來源 |
| composable | Composition API 下共享狀態與方法 | 需要設計清楚生命週期與作用域 |

View UI Plus 同時使用這幾種方式。表單系統主要用 `provide/inject`，部分樹狀或選單關係仍使用元件查找工具。

## 設計啟發

元件樹通信要避免「看似方便，實際不可追蹤」。如果子元件透過 `$parent.$parent` 直接呼叫方法，短期能工作，長期很難維護。

相對好的做法是把查找邏輯集中成工具函數，至少讓依賴方式固定。更現代的做法是用明確的 `provide/inject` contract，例如：

```txt
Form provide FormInstance
FormItem inject FormInstance and provide FormItemInstance
Input inject FormItemInstance
```

這樣資料來源和協作關係會比任意查找更清楚。

## 複習題

1. `findComponentUpward` 依賴哪些條件才能正確工作？
2. `dispatch` 和一般 `$emit` 的差異是什麼？
3. `broadcast` 可能帶來哪些追蹤困難？
4. 為什麼 Form 系統更適合用 `provide/inject`？
5. 如果用 Vue 3 重構 Menu，你會保留元件查找，還是改成 provide/inject？
