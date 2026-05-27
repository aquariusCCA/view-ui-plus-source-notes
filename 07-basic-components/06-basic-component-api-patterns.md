# 基礎元件 API 模式

## 學習目標

這篇總結基礎元件常見的 API 設計模式。前面幾篇已經分別看過 Icon、Button、Divider、Tag、Badge、Avatar；這篇把它們抽象成可重複使用的閱讀框架。

讀完後，要能看到一個新元件時，快速拆出它的 props、emits、slots、class、style、型別宣告與樣式契約。

## 對照源碼

- `01-origin/source/view-ui-plus-v1.3.20/src/components/icon/icon.vue`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/button/button.vue`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/divider/divider.vue`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/tag/tag.vue`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/badge/badge.vue`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/avatar/avatar.vue`
- `01-origin/source/view-ui-plus-v1.3.20/types/`

## Props 模式

基礎元件的 props 常見四類：

| 類型 | 代表 props | 設計重點 |
| --- | --- | --- |
| 視覺語意 | `type`、`status`、`shape` | 通常應該用 validator 或 union type 限制 |
| 尺寸 | `size` | 可能支援全域預設，也可能支援 number 自訂值 |
| 開關狀態 | `loading`、`disabled`、`dashed`、`plain`、`dot` | Boolean props 應該語意單一 |
| 自訂值 | `color`、`offset`、`src`、`customIcon` | 常需要 inline style 或 fallback 規則 |

閱讀 props 時不要只看名稱，要追到它最後影響：

```txt
prop
  -> computed class/style
  -> template/render output
  -> less 視覺規則
  -> d.ts 使用者提示
```

## Validator 與 Type

View UI Plus 在基礎元件中大量使用 `oneOf`：

```js
validator (value) {
    return oneOf(value, ['small', 'large', 'default']);
}
```

這提供 runtime 防線，但 TypeScript 使用者還要看 `.d.ts` 是否同步收窄：

| 情況 | 影響 |
| --- | --- |
| runtime 和 d.ts 都收窄 | 使用者在開發期和執行期都得到一致約束 |
| runtime 收窄，d.ts 寬鬆 | IDE 允許錯值，執行期才警告 |
| runtime 寬鬆，d.ts 收窄 | 實際可用能力被 TypeScript 擋住 |

例如 Avatar runtime 支援 number size，但 d.ts 只描述預設字串尺寸；Tag runtime 支援自訂 color，但 d.ts 把 color 收窄成預設色 union。這些都是 type API 和 runtime API 漂移。

## Emits 模式

基礎元件的事件通常很少，但要看 payload 是否穩定：

| 元件 | 事件 | payload |
| --- | --- | --- |
| `Button` | `click` | `event` |
| `Tag` | `on-close` | `event` 或 `event, name` |
| `Tag` | `on-change` | `checked` 或 `checked, name` |
| `Avatar` | `on-error` | `event` |

事件設計要避免把內部狀態全部暴露出去。使用者只需要知道「發生了什麼」和「是哪個項目」，不需要知道元件內部如何計算 class 或 style。

## Slots 模式

基礎元件常見 slot 用法：

| 模式 | 代表元件 | 說明 |
| --- | --- | --- |
| default slot 作為內容 | `Button`、`Divider`、`Tag`、`Avatar` | 外部提供主要文字或內容 |
| slot presence 改變樣式 | `Divider`、`Button`、`Badge` | 有沒有 slot 會影響 class 或 layout |
| 具名 slot 覆蓋局部內容 | `Badge` | `count`、`text` 改寫角標內容 |
| fallback chain | `Avatar` | `src -> icon -> default slot` |

slot 是公開 API，不只是渲染細節。只要使用者可以透過 slot 控制內容，就要在筆記中記下 slot 名稱、優先順序與 fallback。

## Class 命名模式

基礎元件通常使用同一個 class 組裝規則：

```txt
prefixCls
prefixCls-variant
prefixCls-size
prefixCls-state
prefixCls-part
```

例子：

| 元件 | class |
| --- | --- |
| Button | `ivu-btn`、`ivu-btn-primary`、`ivu-btn-loading` |
| Divider | `ivu-divider`、`ivu-divider-with-text-left` |
| Tag | `ivu-tag`、`ivu-tag-closable`、`ivu-tag-checked` |
| Badge | `ivu-badge-count`、`ivu-badge-status-dot` |
| Avatar | `ivu-avatar`、`ivu-avatar-image`、`ivu-avatar-icon` |

這種命名讓元件狀態可以被樣式表穩定消化，也讓使用者在 DevTools 中容易追蹤。

## Inline Style 模式

不是所有狀態都適合做成 class。以下情況通常會用 inline style：

| 情況 | 代表元件 |
| --- | --- |
| 任意尺寸 | `Icon.size`、`Avatar.size` |
| 任意顏色 | `Icon.color`、`Tag.color`、`Badge.color` |
| 任意偏移 | `Badge.offset` |
| DOM 測量結果 | `Avatar.childrenStyle` |

判斷原則是：如果值的集合有限且屬於設計系統，優先 class；如果值來自使用者或資料，通常需要 inline style。

## 型別宣告對照表

閱讀基礎元件時，可以建立這張對照表：

| 檢查項 | 要看的位置 |
| --- | --- |
| props 是否完整 | `.vue props` vs `types/*.d.ts` |
| emits 是否完整 | `.vue emits` vs `onXxx` 型別 |
| kebab-case 是否對應 | `htmlType` vs `'html-type'` |
| slots 是否描述 | template slot vs `v-slots` |
| 自訂值是否被型別允許 | runtime validator/style vs d.ts union |
| 全域設定是否反映 | `getCurrentInstance().appContext.config.globalProperties` |

這張表可以重複套到其他章節的元件，例如 Input、Select、Modal、Table。

## 設計啟發

基礎元件 API 的核心是可預測：

- prop 名稱要反映使用者意圖，而不是內部實作。
- validator、default、class、type 要盡量一致。
- Boolean prop 不要一個 prop 承擔多種語意。
- slot fallback 要有清楚優先順序。
- emit payload 要穩定，避免讓使用者依賴內部資料結構。

## 複習題

1. 為什麼要同時看 runtime validator 和 `.d.ts`？
2. 哪些 props 適合收窄成 union type？
3. slot presence 和 Boolean prop 在設計上有什麼差異？
4. class 和 inline style 的分工原則是什麼？
5. 事件 payload 為什麼也是公開 API 的一部分？
