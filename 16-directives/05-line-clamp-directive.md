# line-clamp 指令

## 學習目標

這篇分析 `v-line-clamp`。它是一個很小但很典型的 DOM 樣式指令：掛載時加 class、寫入 `-webkit-line-clamp`，更新時同步行數，卸載時清理。

讀完後，要能說清楚它適合處理哪種文字省略場景，以及它和 Ellipsis 元件、Typography ellipsis 的差異。

## 對照源碼

- `01-origin/source/view-ui-plus-v1.3.20/src/directives/line-clamp.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/styles/`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/ellipsis/`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/typography/`

## 核心實作

`line-clamp.js` 很短：

```js
import { addClass, removeClass } from '../utils/assist.js';

export default {
    mounted (el, binding) {
        if (binding.value) {
            addClass(el, 'ivu-line-clamp');
            el.style['-webkit-line-clamp'] = binding.value;
        }
    },
    updated (el, binding) {
        if (binding.value) {
            el.style['-webkit-line-clamp'] = binding.value;
        }
    },
    unmounted (el) {
        removeClass(el, 'ivu-line-clamp');
        el.style['-webkit-line-clamp'] = null;
    }
}
```

使用方式：

```vue
<p v-line-clamp="2">
    很長很長的文字內容
</p>
```

## class 與 inline style 分工

這個指令做了兩件事：

- 加上 `ivu-line-clamp` class，讓樣式表提供多行省略的基礎 CSS。
- 寫入 `-webkit-line-clamp`，讓行數可以由 binding value 動態控制。

這是合理分工。固定樣式放在 class，動態數值放在 inline style。這比把所有 CSS 都寫在 directive 裡更容易維護。

## 生命週期設計

| hook | 做的事 |
| --- | --- |
| `mounted` | 有 value 時加 class 並設定行數 |
| `updated` | value 改變後更新行數 |
| `unmounted` | 移除 class 並清掉行數 |

這個指令不需要事件 listener，也不需要 observer，所以清理很簡單。只要把自己加過的 class 和 style 移除即可。

## 適用場景

`v-line-clamp` 適合：

- 單純多行省略。
- 不需要 tooltip。
- 不需要展開/收合。
- 不需要按字數或寬度精準裁切。
- 不需要複製、編輯、suffix、symbol 等文字互動。

它的目標是便宜、直接、宣告式。

## 和 Ellipsis / Typography 的差異

| 能力 | `v-line-clamp` | Ellipsis | Typography ellipsis |
| --- | --- | --- | --- |
| 多行省略 | 有 | 有 | 有 |
| Tooltip | 無 | 可做 | 可配置 |
| 展開/收合 | 無 | 可設計 | 可能由配置承接 |
| 複製/編輯 | 無 | 無 | 和 copyable/editable 整合 |
| DOM 測量 | 無 | 可能需要 | 可能需要 resize detector |
| 使用成本 | 最低 | 中 | 最高 |

如果只是把一段卡片描述限制成兩行，`v-line-clamp` 很適合。如果要做完整文字互動，應該使用 Typography 或專門的 Ellipsis 元件。

## 瀏覽器限制

原註解已經說明它主要依賴 webkit line clamp。這代表它不是通用文字排版引擎，而是基於瀏覽器 CSS 能力的輕量封裝。

文件應該讓使用者知道：

- 它依賴 CSS 支援。
- 它不計算文字長度。
- 它不提供 tooltip 或展開行為。
- 它不保證在所有排版情境中都精準。

## 設計啟發

`v-line-clamp` 是很好的小指令案例，因為它只做一件事。它沒有把文字省略能力擴張成完整元件，也沒有處理所有邊界。

仿寫時可以學它的分工：

- class 提供固定樣式。
- binding value 提供動態參數。
- `updated` 同步參數。
- `unmounted` 清理 class 和 style。

## 最小模仿

```js
const opacity = {
    mounted(el, binding) {
        el.classList.add('is-opacity-controlled');
        el.style.opacity = binding.value;
    },
    updated(el, binding) {
        el.style.opacity = binding.value;
    },
    unmounted(el) {
        el.classList.remove('is-opacity-controlled');
        el.style.opacity = null;
    }
};
```

這和 `v-line-clamp` 是同一類模式：class 承接基礎樣式，value 承接動態值。

## 複習題

1. `v-line-clamp` 為什麼需要同時加 class 和寫 inline style？
2. 它和 Typography ellipsis 的能力差異在哪裡？
3. 什麼情況下不應該使用 `v-line-clamp`？
4. 為什麼卸載時要移除 `ivu-line-clamp`？
5. 如果 value 從 `2` 變成 `0`，目前實作會發生什麼？
