# Icon 元件分析

## 學習目標

這篇分析 `Icon`。Icon 是很典型的視覺原子元件：沒有內部互動，也沒有 slot，但它負責把圖示名稱、尺寸、顏色與自訂圖示 class 統一成穩定的 DOM 輸出。

讀完後，要能理解圖示元件為什麼通常會設計得很薄，以及它如何成為 Button、Tag、Avatar 等元件的底層依賴。

## 對照源碼

- `01-origin/source/view-ui-plus-v1.3.20/src/components/icon/icon.vue`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/icon/index.js`
- `01-origin/source/view-ui-plus-v1.3.20/types/icon.d.ts`
- `01-origin/source/view-ui-plus-v1.3.20/src/styles/common/iconfont/_ionicons-font.less`
- `01-origin/source/view-ui-plus-v1.3.20/src/styles/common/iconfont/_ionicons-icons.less`

## 公開 API

| API | runtime 來源 | 型別來源 | 說明 |
| --- | --- | --- | --- |
| `type` | `props.type` | `type?: string` | 內建圖示名稱，最後形成 `ivu-icon-${type}` |
| `size` | `props.size` | `size?: number \| string` | 轉成 `font-size: ${size}px` |
| `color` | `props.color` | `color?: string` | 轉成 inline `color` |
| `custom` | `props.custom` | `custom?: string` | 外部自訂圖示 class |

Icon 沒有宣告 emits，也沒有 slot API。這表示它只負責呈現，不負責互動；互動事件應該由使用 Icon 的外層元件負責。

## 渲染結構

Icon 的 template 很小：

```vue
<i :class="classes" :style="styles"></i>
```

它固定渲染 `<i>`，所有變化都從 `classes` 和 `styles` 進來。這種設計讓 Icon 的 DOM 結構非常穩定，外層元件可以放心把它放進 Button、Tag close icon、Avatar icon 等位置。

## class 組裝

`classes` 會固定給出：

```js
`${prefixCls}`
```

也就是 `ivu-icon`。接著根據 props 增加：

| 條件 | class |
| --- | --- |
| `type !== ''` | `ivu-icon-${type}` |
| `custom !== ''` | `custom` 原樣加入 |

這裡有兩條路：

- 使用內建圖示時，傳 `type="ios-loading"` 之類的名稱。
- 使用外部圖示庫時，傳 `custom="my-icon my-icon-user"` 之類的 class。

`custom` 不加 `ivu-icon-` 前綴，代表它是刻意留給外部圖示系統的逃生口。

## style 組裝

`styles` 只處理兩件事：

| prop | style |
| --- | --- |
| `size` | `font-size: ${size}px` |
| `color` | `color: ${color}` |

這裡的設計很直接：圖示大小與顏色常常需要跟隨使用場景局部調整，如果全部做成預設 class，會讓樣式表膨脹。用 inline style 可以保留彈性。

要注意的是，runtime 把 `size` 直接拼成 `${this.size}px`。所以傳入 number 最自然；傳入 string 時，如果使用者傳的是 `'16'` 可以工作，但傳 `'1em'` 會變成 `1empx`。型別雖然允許 `string`，實務上仍應把這個 API 理解成 px 數值。

## 被其他元件使用

Icon 在基礎元件中至少有三個典型使用場景：

| 使用元件 | 用法 |
| --- | --- |
| `Button` | loading 時渲染 `ios-loading`，或根據 `icon/customIcon` 渲染前置圖示 |
| `Tag` | `closable` 時渲染 `ios-close` 關閉圖示 |
| `Avatar` | 沒有 `src` 且有 `icon/customIcon` 時渲染圖示型頭像 |

這說明 Icon 是元件庫裡的基礎依賴。它本身越穩定，其他元件的視覺組合越容易一致。

## Runtime 與 Type 對照

`types/icon.d.ts` 基本完整描述 runtime props，但沒有收窄 `type` 的可用圖示名稱。這是元件庫常見取捨：

- 若把所有 icon name 寫成 union type，IDE 體驗會更精準，但維護成本高。
- 保持 `string`，可以支援內建圖示與未來新增圖示，也能容納外部使用情境。

對 Icon 這種擴展面很大的元件，寬鬆型別是可以理解的設計。

## 設計啟發

設計圖示元件時，可以保留三個層次：

1. 固定基礎 class，例如 `ivu-icon`。
2. 內建圖示入口，例如 `type -> ivu-icon-${type}`。
3. 自訂圖示入口，例如 `custom` 原樣加入 class。

這樣可以同時支援元件庫內建圖示、專案自訂 iconfont、第三方圖示 class，且不需要讓 Icon 知道外部圖示系統的細節。

## 複習題

1. Icon 為什麼適合固定渲染成 `<i>`？
2. `type` 和 `custom` 的差異是什麼？
3. 為什麼 `color` 和 `size` 用 inline style，而不是全部做成 class？
4. `size?: number | string` 和 runtime `${size}px` 之間有什麼落差？
5. Icon 被 Button、Tag、Avatar 使用時，各自扮演什麼角色？
