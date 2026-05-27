# Space 間距容器

## 學習目標

這篇分析 `Space`。它是一個看起來簡單、實作卻很有代表性的容器元件：不使用 template，而是用 render function 過濾 VNode、包裝每個子節點、套用 gap，並在需要時插入分隔符。

讀完後，要能說明 `Space` 為什麼需要過濾空節點，`size` 如何轉成 gap style，以及 `split` slot 如何插入到子項目之間。

## 對照源碼

- `01-origin/source/view-ui-plus-v1.3.20/src/components/space/space.vue`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/space/index.js`
- `01-origin/source/view-ui-plus-v1.3.20/types/space.d.ts`
- `01-origin/source/view-ui-plus-v1.3.20/src/styles/components/space.less`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/divider/divider.vue`

## 結構定位

`Space` 的目標是處理元素之間的間距。它不關心子元素是 Button、Tag、Input 還是任意 DOM，只負責把有效子節點包成 item，並讓 item 之間有穩定 gap。

輸出結構大致是：

```txt
div.ivu-space
  div.ivu-space-item
    child
  div.ivu-space-split
    split
  div.ivu-space-item
    child
```

如果沒有有效子節點，render function 直接回傳 `null`。

## API

`Space` 的 props：

| Prop | 預設值 | 說明 |
| --- | --- | --- |
| `size` | 全域設定或 `'small'` | 間距大小，可是字串、數字或陣列 |
| `direction` | `'horizontal'` | 排列方向：`horizontal`、`vertical` |
| `align` | 依情境推導 | 對齊方式 |
| `wrap` | `false` | 是否換行 |
| `split` | `false` | 是否使用預設分隔符 |
| `type` | `'inline-flex'` | flex 容器類型：`inline-flex`、`flex` |

`size` 的字串對應：

| 值 | px |
| --- | --- |
| `small` | `8` |
| `default` | `16` |
| `large` | `24` |

`size` 預設值會讀全域設定：

```txt
global.$VIEWUI.space.size
  -> 若不存在或為空，使用 small
```

這是本章中少數直接讀全域設定的容器元件。

## align 推導

`mergedAlign` 負責處理未傳 `align` 時的預設值：

```txt
沒有 align 且 direction = horizontal -> center
沒有 align 且 type = flex -> stretch
否則使用 align
```

這表示水平排列預設會垂直置中；如果是 `flex` 且沒有指定 align，則預設拉伸。這些規則最後都會變成 class：

```txt
ivu-space-center
ivu-space-stretch
```

## size 與 gap style

`styles` 會把 `size` 轉成 CSS gap：

| `size` 形式 | style |
| --- | --- |
| 字串或數字 | `gap` |
| 陣列長度 1 | `columnGap` |
| 陣列長度大於 1 | `columnGap` + `rowGap` |

`getSize()` 負責把值轉成 px：

```txt
string -> 查 spaceSize
number -> 直接加 px
空值 -> 0px
```

這裡的設計讓 `Space` 可以同時支援設計系統尺寸和任意數字尺寸。

## VNode 過濾

`Space` 不直接使用 `$slots.default()` 的結果，而是先呼叫 `filterEmpty()`。

它會處理三種情況：

| 情況 | 行為 |
| --- | --- |
| 子節點是陣列 | 展開 |
| 子節點是 `Fragment` | 展開 fragment children |
| 子節點是有效節點 | 保留 |

接著 `isEmptyElement()` 會過濾：

| 空節點 | 判斷 |
| --- | --- |
| `Comment` | 直接視為空 |
| 空 `Fragment` | children 長度為 0 |
| 空白文字 | `Text` 且 trim 後為空 |

這很重要，因為 Vue template 中的條件渲染、註解、空白文字都可能成為 VNode。如果不過濾，`Space` 會替空節點也產生間距。

## split 插入規則

`Space` 支援兩種分隔符：

| 使用方式 | 結果 |
| --- | --- |
| `split=true` 且沒有 `split` slot | 使用垂直 `Divider` |
| 有 `split` slot | 使用自訂分隔符 |

分隔符只會插在 item 之間：

```txt
items.map((child, index) => {
  if (split && index + 1 < len) {
    return [item, split]
  }
  return item
})
```

最後一個 item 後面不會插入 split，這是所有分隔型容器都應該遵守的基本規則。

## Runtime 與 Type 對照

`types/space.d.ts` 宣告 `size` 為：

```ts
'small' | 'large' | 'default' | number | []
```

但 runtime 實際允許陣列中放數字或尺寸字串：

```txt
size = [8, 16]
size = ['small', 'large']
```

所以型別中的 `[]` 過窄，沒有完整表達 runtime 支援的陣列形式。這是很適合放進型別漂移筆記的案例。

slot 宣告包括：

| Slot | 說明 |
| --- | --- |
| `default` | 需要加間距的元素 |
| `split` | 自訂分隔符 |

## 設計啟發

`Space` 的價值在於把原本散落在 CSS 中的 margin 規則變成元件：

- 使用者不用替每個子元素手動加 margin。
- 空節點不會產生意外間距。
- gap 由父容器控制，不污染子元件樣式。
- 分隔符由容器插入，使用者不用手動判斷最後一項。
- 全域設定可以統一調整預設間距。

仿寫這類容器時，要特別注意 slot 內容不是乾淨的 DOM 陣列，而是 VNode 樹；先過濾再包裝，通常比直接渲染更可靠。

## 複習題

1. `Space` 為什麼使用 render function，而不是一般 template？
2. 哪些 VNode 會被視為空節點？
3. `size` 是字串、數字、陣列時，分別會產生什麼 style？
4. `split=true` 且沒有 `split` slot 時，預設插入什麼元件？
5. `types/space.d.ts` 對 `size` 的描述和 runtime 有什麼差異？
