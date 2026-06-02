# Props 設計與 runtime 驗證

## 學習目標

這篇分析 View UI Plus 的 props 設計。重點不是列出所有 props，而是學會從 runtime props 看出元件庫如何設計命名、預設值、驗證規則、全域設定覆蓋，以及這些內容如何被轉成 TypeScript 宣告。

## 源碼位置

主要閱讀：

- `01-origin/source/view-ui-plus-v1.3.20/src/components/button/button.vue`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/modal/modal.vue`
- `01-origin/source/view-ui-plus-v1.3.20/src/mixins/link.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/mixins/form.js`
- `01-origin/source/view-ui-plus-v1.3.20/types/button.d.ts`
- `01-origin/source/view-ui-plus-v1.3.20/types/modal.d.ts`

## Prop 的四種角色

| 角色 | 例子 | 設計重點 |
| --- | --- | --- |
| 外觀控制 | `type`、`size`、`shape`、`ghost` | 通常會影響 class、圖示、尺寸 |
| 行為控制 | `disabled`、`loading`、`draggable`、`maskClosable` | 通常會改變互動流程 |
| 資料控制 | `modelValue`、`data`、`columns` | 通常和事件、watcher、內部狀態同步有關 |
| 擴展控制 | `render`、`styles`、`className`、`customIcon` | 讓使用者插入自訂內容或樣式 |

閱讀 props 時，要先判斷它是控制「看起來如何」、「能不能互動」、「資料來源」還是「自訂擴展」。不同角色會影響型別精準度與破壞性變更風險。

## 命名轉換

View UI Plus runtime 多用 camelCase：

```js
htmlType
customIcon
maskClosable
modelValue
```

使用者在模板中多用 kebab-case：

```vue
<Button html-type="submit" custom-icon="iconfont icon-save" />
<Modal v-model="visible" mask-closable />
```

所以型別檔常寫成：

```ts
'html-type'?: 'button' | 'submit' | 'reset';
'custom-icon'?: string;
'mask-closable'?: boolean;
'model-value'?: boolean;
```

這是 Vue 模板 API 的常見設計：runtime 實作用 JavaScript 友善命名，使用者模板與 d.ts 則偏向模板語法。

## Runtime 驗證

`Button` 的 `type` 使用 `validator` 搭配 `oneOf`：

```js
validator (value) {
    return oneOf(value, ['default', 'primary', 'dashed', 'text', 'info', 'success', 'warning', 'error']);
}
```

這種 validator 在 runtime 解決「不合法值警告」問題；在 TypeScript 端，理想上應對應成 union type：

```ts
type?: '' | 'default' | 'primary' | 'dashed' | 'text' | 'info' | 'success' | 'warning' | 'error';
```

讀 props 時可以特別找 validator，因為它通常就是型別收窄的來源。

## 預設值與全域設定

有些 prop 的 default 不是固定值，而是讀全域設定。`Button.size` 會讀 `$VIEWUI.size`，`Modal.transfer` 會讀 `$VIEWUI.transfer`，`Modal.maskClosable` 會讀 `$VIEWUI.modal.maskClosable`。

這代表 prop API 背後還有一層優先級：

1. 使用者直接傳入 prop。
2. 沒傳 prop 時讀全域設定。
3. 全域設定不存在時使用元件預設值。

這種設計讓元件庫可以提供全域一致體驗，但型別檔也必須同時描述安裝選項與元件 prop，否則使用者只知道單一元件怎麼傳，卻不知道全域設定怎麼配。

## Object 與 Array 預設值

Vue props 中的 object / array default 要用 factory function：

```js
styles: {
    type: Object,
    default () {
        return {};
    }
}
```

這不是 API 表面問題，但會影響元件實例之間是否共享同一個引用。閱讀元件庫時，這類 default 寫法可以看出作者是否避免了跨實例污染。

## 對照型別宣告

對照 `.vue` 與 `.d.ts` 時，可以用這張表檢查：

| 檢查項 | 例子 | 風險 |
| --- | --- | --- |
| runtime 有 prop，d.ts 沒有 | emit 或 mixin prop 漏列 | 使用者能跑但沒有型別提示 |
| d.ts 型別太寬 | `shape?: string` | IDE 不能提示合法值 |
| d.ts 型別太窄 | `Modal.width` runtime 接受 `number | string` | 使用者傳合法值卻被型別擋住 |
| validator 與 union 不一致 | runtime 新增值但 d.ts 沒同步 | 版本漂移 |
| prop 來自 mixin | link、form mixin | 容易漏看公開 API 來源 |

## 設計啟發

好的 props 設計應該同時回答：

- 這個 prop 是外觀、行為、資料還是擴展？
- 名稱在 JavaScript 與模板中是否一致可推導？
- runtime validator 能不能轉成明確 union type？
- default 是否依賴全域設定？
- d.ts 是否描述了使用者真正會傳入的格式？

## 檢查問題

1. 為什麼 `htmlType` 在型別檔裡會寫成 `'html-type'`？
2. `oneOf` validator 和 TypeScript union type 分別解決什麼問題？
3. 全域設定會如何改變 prop default 的判斷方式？
4. 如果 runtime 接受 `number | string`，但 d.ts 只寫 `number`，會造成什麼使用者體驗問題？
5. 為什麼分析 props 時不能只看單一 `.vue`，還要看 mixin？
