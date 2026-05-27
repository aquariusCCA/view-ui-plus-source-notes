# Input 與 InputNumber

## 學習目標

這篇分析文字與數字輸入元件如何包裝原生輸入行為。重點是 `modelValue` 同步、原生事件轉發、clear/search、字數限制、textarea 與數字格式化。

## 對照源碼

- `01-origin/source/view-ui-plus-v1.3.20/src/components/input/input.vue`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/input-number/input-number.vue`
- `01-origin/source/view-ui-plus-v1.3.20/types/input.d.ts`
- `01-origin/source/view-ui-plus-v1.3.20/types/input-number.d.ts`
- `01-origin/source/view-ui-plus-v1.3.20/src/styles/components/input.less`
- `01-origin/source/view-ui-plus-v1.3.20/src/styles/components/input-number.less`

## Input 的值流

`Input` 以 `modelValue` 作外部值，內部用 `currentValue` 作顯示值：

```txt
modelValue prop
  -> currentValue
  -> input/textarea value
  -> handleInput / handleChange
  -> update:modelValue + on-input-change / on-change
  -> FormItem change/blur
```

`update:modelValue` 用於 `v-model` 同步；`on-change` 仍保留原生 change event 語意；`on-input-change` 則對應輸入中的 event。

## Input 功能分層

| 功能 | 閱讀重點 |
| --- | --- |
| text / textarea | 依 `type` 切換原生元素與 class |
| clearable | 點擊 icon 後輸出空字串，並觸發 `on-clear` |
| search | enter 或 search icon 觸發 `on-search` |
| prefix/suffix | prop icon 與具名 slot 的 fallback |
| show-word-limit | 根據 `modelValue` 長度與 `maxlength` 顯示統計 |
| disabled/readonly | 阻止互動並傳給原生元素 |
| form integration | blur/change 時通知 `FormItem` |

值得注意的是，clear 不是單純改 DOM value，它也要同步 `v-model`、change event、clear event 和表單驗證。

## InputNumber 的值流

`InputNumber` 面對的問題是：使用者輸入的是字串，但公開值應該是數字或 `null`。

```txt
輸入字串 / step button
  -> parse number
  -> min/max/step/precision 修正
  -> currentValue
  -> update:modelValue
  -> on-change
```

它還要處理長按加減、focus/blur、鍵盤輸入、formatter/parser、precision 和空值。

## Input 與 InputNumber 的差異

| 面向 | `Input` | `InputNumber` |
| --- | --- | --- |
| 主要值 | string/number | number/null |
| 原生事件 | 轉發較多鍵盤與 focus 事件 | 主要關注 change、focus、blur |
| 顯示值 | 幾乎等於輸入值 | 可能經 formatter 顯示 |
| 合法性 | maxlength、disabled、readonly | min/max、step、precision |
| 操作入口 | typing、clear、search | typing、up/down handler、keyboard |

## 設計啟發

文字輸入要保留原生事件彈性，數字輸入要保護資料型別。仿寫時不要只看畫面，應先決定：

```txt
DOM value 是什麼型別
對外 modelValue 是什麼型別
暫時非法輸入是否允許存在
何時格式化
何時觸發 change
```

## 複習題

1. `Input` 為什麼同時有 `update:modelValue`、`on-change` 和 `on-input-change`？
2. clearable 點擊後需要觸發哪些狀態與事件？
3. `InputNumber` 為什麼不能直接把原生 input value 當成公開值？
4. formatter/parser 會改變顯示值還是提交值？
5. blur 事件在表單驗證中扮演什麼角色？
