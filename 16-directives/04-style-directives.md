# 樣式快捷指令

## 學習目標

這篇分析 View UI Plus 的 `style.js`。它把幾個常見 inline style 操作包成 directive，讓使用者可以在模板上用 `v-width`、`v-height`、`v-color` 這類語法快速寫入樣式。

讀完後，要能理解這類指令的適用範圍、生命週期、單位處理與限制。

## 對照源碼

- `01-origin/source/view-ui-plus-v1.3.20/src/directives/style.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/index.js`

## 提供哪些指令

`style.js` 匯出一組小指令，入口檔再把它們拆成不同註冊名。

| 註冊名 | 來源 | 寫入的 style |
| --- | --- | --- |
| `display` | `style.display` | `el.style.display` |
| `width` | `style.width` | `el.style.width` |
| `height` | `style.height` | `el.style.height` |
| `margin` | `style.margin` | `el.style.margin` |
| `padding` | `style.padding` | `el.style.padding` |
| `font` | `style.font` | `el.style.fontSize` |
| `color` | `style.color` | `el.style.color` |
| `bg-color` | `style.bgColor` | `el.style.backgroundColor` |

使用方式：

```vue
<div v-width="240" />
<div v-height="64" />
<div v-margin="16" />
<div v-color="'#17233d'" />
<div v-bg-color="'#f8f8f9'" />
```

## 單位處理

`style.js` 有一個很小的 `unit` 函式：

```js
function unit(value) {
    return String(value).endsWith('%') ? '' : 'px';
}
```

因此：

- `v-width="120"` 會得到 `120px`。
- `v-width="'50%'"` 會得到 `50%`。
- `v-width="'120px'"` 會得到 `120pxpx`，這不是安全輸入。

這說明文件要講清楚 value 的期待格式。這類指令雖然方便，但不能取代完整 CSS 系統。

## 生命週期

以 `width` 為例：

```js
mounted (el, binding) {
    if (binding.value) {
        el.style.width = binding.value + unit(binding.value);
    }
},
updated (el, binding) {
    if (binding.value) {
        el.style.width = binding.value + unit(binding.value);
    }
},
unmounted (el) {
    el.style.width = null;
}
```

這裡有三個動作：

- 掛載時根據 value 寫入樣式。
- 更新時重新寫入樣式。
- 卸載時清除這個指令寫過的樣式。

清理很重要，因為 directive 是對 DOM 的直接修改。如果元素被重用或指令被條件渲染移除，殘留 inline style 會讓後續畫面難以判斷。

## value 判斷的限制

目前多數樣式指令使用：

```js
if (binding.value) {
    // write style
}
```

這代表 `0`、空字串、`false` 不會被寫入。對 `display` 來說這通常沒問題，但對 `width` 或 `margin` 來說，`0` 可能是有效值。

仿寫時可以改成更精準的判斷：

```js
const hasValue = binding.value !== undefined && binding.value !== null;
```

這能讓 `0` 成為有效輸入。

## 指令與 CSS class 的取捨

樣式指令適合少量、動態、局部的 inline style，例如根據資料決定寬高或顏色。

如果是穩定設計樣式，應該優先用 class：

```vue
<div class="profile-card" />
```

不要把大量設計 token 全部變成 `v-xxx`。指令越多，模板就越像另一套 CSS 語法，維護成本會變高。

## 設計啟發

樣式指令的設計檢查點：

- value 是否允許 number、string、percent。
- 是否需要支援 `0`。
- 單位是否自動補 `px`。
- 更新時是否要比較 `oldValue`。
- 卸載時要清除哪個 style。
- 是否會覆蓋使用者原本手寫的 inline style。

最後一點特別重要。現在的實作在 `unmounted` 直接設為 `null`，如果元素原本就有 inline style，會被一併清掉。這是簡單實作的取捨。

## 最小模仿

```js
function withPx(value) {
    if (typeof value === 'number') return `${value}px`;
    return value;
}

const minWidth = {
    mounted(el, binding) {
        if (binding.value !== undefined && binding.value !== null) {
            el.style.minWidth = withPx(binding.value);
        }
    },
    updated(el, binding) {
        if (binding.value !== binding.oldValue) {
            el.style.minWidth = withPx(binding.value);
        }
    },
    unmounted(el) {
        el.style.minWidth = null;
    }
};
```

這個版本保留 `0`，並且用 `oldValue` 避免不必要的重寫。

## 複習題

1. 為什麼樣式型指令要在 `unmounted` 清理 style？
2. `unit(value)` 為什麼會讓 `'120px'` 變成錯誤輸入？
3. `if (binding.value)` 對 `0` 有什麼影響？
4. 什麼情況應該用 CSS class，而不是樣式指令？
5. 如果要仿寫 `v-z-index`，你會如何設計 value 與清理行為？
