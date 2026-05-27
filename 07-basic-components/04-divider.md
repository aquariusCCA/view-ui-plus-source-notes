# Divider 元件分析

## 學習目標

這篇分析 `Divider`。Divider 是非常適合練習基礎元件閱讀的案例：它的功能單純，但同時包含 props validator、slot presence、條件 class 與型別對照。

讀完後，要能理解一個元件如何根據「是否有內容」自動調整視覺，而不是要求使用者額外傳更多 prop。

## 對照源碼

- `01-origin/source/view-ui-plus-v1.3.20/src/components/divider/divider.vue`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/divider/index.js`
- `01-origin/source/view-ui-plus-v1.3.20/types/divider.d.ts`
- `01-origin/source/view-ui-plus-v1.3.20/src/styles/components/divider.less`

## 公開 API

| API | runtime 來源 | 型別來源 | 說明 |
| --- | --- | --- | --- |
| `type` | `props.type` | `type?: 'horizontal' \| 'vertical'` | 水平或垂直分隔線 |
| `orientation` | `props.orientation` | `orientation?: 'left' \| 'right' \| 'center'` | 有文字時的文字位置 |
| `dashed` | `props.dashed` | `dashed?: boolean` | 虛線樣式 |
| `size` | `props.size` | `size?: string` | `small` 或 `default` |
| `plain` | `props.plain` | `plain?: boolean` | 文字使用普通正文樣式 |
| default slot | `<slot>` | d.ts 未特別宣告 | 分隔線中間的文字內容 |

Divider 沒有 emits，也沒有 methods。它的公開契約主要是 props + default slot + class 視覺狀態。

## DOM 結構

Divider 的 template 是：

```vue
<div :class="classes">
    <span v-if="hasSlot" :class="slotClasses">
        <slot></slot>
    </span>
</div>
```

這裡的設計很清楚：

- 外層 `div` 永遠存在，代表分隔線本體。
- 只有 default slot 存在時，才渲染內層 `span`。
- 文字節點不直接裸露在 `div` 裡，而是包在 `ivu-divider-inner-text`，讓樣式可以控制文字與線的位置。

## slot presence

`hasSlot` 只做一件事：

```js
return !!this.$slots.default;
```

這個 computed 會影響兩個地方：

1. 是否渲染文字容器。
2. 是否加上 `with-text` 相關 class。

也就是說，使用者只要寫：

```vue
<Divider>Title</Divider>
```

元件就會自動進入「帶文字分隔線」模式；不需要另外傳 `with-text` 之類的 prop。這是 slot 驅動視覺狀態的簡潔設計。

## class 狀態

`classes` 會組合：

| 狀態 | class |
| --- | --- |
| 基礎 class | `ivu-divider` |
| 方向 | `ivu-divider-horizontal` / `ivu-divider-vertical` |
| 尺寸 | `ivu-divider-small` / `ivu-divider-default` |
| 置中文字 | `ivu-divider-with-text` |
| 文字方向 | `ivu-divider-with-text-left/right/center` |
| 虛線 | `ivu-divider-dashed` |
| 普通文字 | `ivu-divider-plain` |

其中 `orientation` 只有在 `hasSlot` 成立時才有實際視覺意義。沒有文字的 Divider 即使傳了 `orientation`，也不應該影響畫面。

## Runtime 與 Type 對照

`types/divider.d.ts` 大致對齊 runtime props，但有一個小差異：

- runtime `size` validator 限制為 `small`、`default`。
- d.ts 寫成 `size?: string`，沒有收窄成 union type。

這代表 TypeScript 可能允許使用者傳入 runtime 不接受的字串。閱讀這類元件時，可以把它記成「runtime 比 type 更嚴格」。

## 設計啟發

Divider 的設計可以抽出幾個原則：

- 元件能從 slot 判斷的狀態，不一定要新增 prop。
- 視覺狀態應該集中在 computed class，而不是散落在 template 上。
- 沒有互動的元件也需要清楚的 API 邊界，否則樣式變體會越加越亂。
- 型別應盡量對齊 validator，避免 runtime 和 IDE 提示不一致。

## 複習題

1. Divider 為什麼要用 `hasSlot` 判斷是否渲染文字容器？
2. `orientation` 在沒有 default slot 時是否有意義？
3. `dashed`、`plain`、`size` 分別影響哪一類視覺狀態？
4. runtime `size` validator 和 d.ts `size?: string` 有什麼差異？
5. 如果要自己設計 Divider，哪些狀態應該交給 slot，哪些狀態應該交給 prop？
