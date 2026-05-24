# Sider Breakpoint、Responsive 與生命週期

## 1. 本章定位

本篇專注閱讀 `Sider` 的 responsive breakpoint 與生命週期行為。

主要來源：

```txt
01-origin/source/view-ui-plus-v1.3.20/src/components/layout/sider.vue
01-origin/source/view-ui-plus-v1.3.20/src/utils/assist.js
01-origin/source/view-ui-plus-v1.3.20/src/utils/dom.js
01-origin/source/view-ui-plus-v1.3.20/src/utils/index.js
```

`Sider` 的 breakpoint 能力不是 CSS media query 單獨完成，而是 runtime 透過 `window.matchMedia()` 判斷目前視窗是否命中斷點，並 emit `update:modelValue` 讓父層同步收合狀態。

---

## 2. Breakpoint prop

`Sider.breakpoint` 的 validator 只允許：

```txt
xs / sm / md / lg / xl / xxl
```

對應 px 來自 `src/utils/assist.js`：

| breakpoint | max-width |
| --- | --- |
| `xs` | `480px` |
| `sm` | `576px` |
| `md` | `768px` |
| `lg` | `992px` |
| `xl` | `1200px` |
| `xxl` | `1600px` |

`Sider` 會把它組成：

```txt
(max-width: ${dimensionMap[this.breakpoint]})
```

例如：

```txt
breakpoint="sm"
  -> (max-width: 576px)
```

---

## 3. `setMatchMedia()` fallback

`sider.vue` 在 module scope 呼叫：

```txt
setMatchMedia()
```

`setMatchMedia()` 來自 `assist.js`，作用是：

```txt
if isClient:
  window.matchMedia = window.matchMedia || matchMediaPolyfill
```

fallback 回傳：

```txt
{
  media,
  matches: false,
  on() {},
  off() {},
}
```

也就是說，在不支援 `window.matchMedia` 的瀏覽器中，source 會提供一個不命中的 fallback，避免呼叫時直接報錯。

---

## 4. `matchMedia()` 方法流程

`Sider.methods.matchMedia()` 的流程可以拆成：

```txt
if not isClient:
  return

read old mediaMatched
set mediaMatched = window.matchMedia(query).matches

if mediaMatched changed:
  emit update:modelValue(mediaMatched)
```

對應行為：

| 狀態變化 | emit |
| --- | --- |
| 原本未命中，現在命中 | `update:modelValue(true)` |
| 原本命中，現在未命中 | `update:modelValue(false)` |
| 命中狀態沒變 | 不 emit |

這代表 breakpoint 不是只負責「小螢幕收合」，也負責「離開小螢幕時展開」。

---

## 5. `mediaMatched` 如何影響寬度

`mediaMatched` 本身不直接寫 style，而是進入 `siderWidth`：

```txt
if collapsible and modelValue:
  if mediaMatched:
    siderWidth = 0
  else:
    siderWidth = parseInt(collapsedWidth)
```

因此 responsive 命中後的完整鏈路是：

```txt
window width <= breakpoint
  -> mediaMatched = true
  -> emit update:modelValue(true)
  -> parent updates modelValue
  -> siderWidth = 0
  -> wrapStyles width / flex become 0px
  -> showZeroTrigger = true
```

離開斷點時：

```txt
window width > breakpoint
  -> mediaMatched = false
  -> emit update:modelValue(false)
  -> parent updates modelValue
  -> siderWidth = parseInt(width)
  -> normal bottom trigger may show
```

---

## 6. `collapsible` 與 breakpoint 的關係

文件註解中容易讓人理解成：

```txt
collapsible=false 時 responsive 不觸發
```

但 source 需要更精準地拆開看：

1. 只要 `breakpoint !== undefined`，mounted 就會註冊 resize listener 並執行 `matchMedia()`。
2. `matchMedia()` 命中狀態改變時會 emit `update:modelValue(mediaMatched)`。
3. 但是 `siderWidth` 在 `collapsible=false` 時直接回傳 `width`，不會因為 `modelValue` 改變而視覺收合。

所以比較準確的結論是：

```txt
breakpoint may still update modelValue,
but visual collapse width is gated by collapsible.
```

筆記中應把 event/state 更新與視覺寬度分開描述。

---

## 7. 生命週期：mounted

`Sider.mounted()` 做兩件事。

第一，處理 `defaultCollapsed`：

```txt
if defaultCollapsed:
  emit update:modelValue(defaultCollapsed)
```

第二，處理 breakpoint：

```txt
if breakpoint !== undefined:
  on(window, 'resize', onWindowResize)
  matchMedia()
```

這代表：

| 條件 | mounted 行為 |
| --- | --- |
| `defaultCollapsed=true` | 要求父層把 `modelValue` 設成 `true`。 |
| 有設定 `breakpoint` | 註冊 window resize listener，並立刻檢查一次目前視窗。 |
| 沒有設定 `breakpoint` | 不註冊 resize listener。 |

---

## 8. 生命週期：beforeUnmount

`Sider.beforeUnmount()` 會清理 resize listener：

```txt
if breakpoint !== undefined:
  off(window, 'resize', onWindowResize)
```

這裡只清理由 `breakpoint` 分支註冊的 listener。沒有設定 breakpoint 時不會註冊，也不需要移除。

讀元件庫 source 時，這類 DOM listener 的清理很重要，因為它決定元件反覆掛載 / 卸載時是否會留下全域副作用。

---

## 9. SSR / 非瀏覽器環境

`Sider` 使用：

```txt
isClient
```

`matchMedia()` 一開始就判斷：

```txt
if (!isClient) return;
```

`setMatchMedia()` 也會在非 client 環境直接 return。

這代表在 SSR 或沒有 `window` 的環境下，breakpoint 判斷不會執行。筆記中應把 responsive 行為理解成 client-side 行為。

---

## 10. 與 trigger 顯示的關係

`mediaMatched` 會同時影響兩種 trigger：

| computed | mediaMatched 影響 |
| --- | --- |
| `showBottomTrigger` | `mediaMatched=true` 時不顯示 bottom trigger。 |
| `showZeroTrigger` | `mediaMatched=true` 且可收合、未隱藏 trigger 時顯示 zero-width trigger。 |

所以 responsive 命中後，使用者看到的不是底部固定 trigger，而是貼在 0 寬度側邊欄外側的 zero-width trigger。

---

## 11. 官方 example 對照

`examples/routers/layout.vue` 使用：

```vue
<Sider
    v-model="isCollapsed"
    collapsed-width="0"
    hide-trigger
    breakpoint="sm"
    @on-collapse="changed"
    collapsible
    ref="side"
    width="200">
```

這個 example 同時展示：

| 寫法 | 對應 source |
| --- | --- |
| `v-model="isCollapsed"` | `modelValue` / `update:modelValue`。 |
| `collapsed-width="0"` | 收合到 0 寬度，zero-width 場景。 |
| `hide-trigger` | 隱藏預設 trigger。 |
| `breakpoint="sm"` | 使用 `(max-width: 576px)` 判斷 responsive。 |
| `@on-collapse="changed"` | watch `modelValue` 後 emit。 |
| `collapsible` | 允許收合並讓 `siderWidth` 使用收合邏輯。 |
| `ref="side"` | example 透過 `$refs.side.toggleCollapse()` 手動觸發。 |

注意：因為 example 同時設定了 `hide-trigger`，預設 bottom trigger 與 zero-width trigger 都會被隱藏。它改用 `Header` 裡的按鈕呼叫 ref method 來收合 / 展開。

---

## 12. 本篇小結

`Sider` responsive 行為可以收斂成：

```txt
breakpoint prop
  -> dimensionMap max-width query
  -> window.matchMedia(query).matches
  -> mediaMatched state
  -> emit update:modelValue(mediaMatched)
  -> parent v-model drives modelValue
  -> siderWidth and trigger visibility update
```

它不是純 CSS responsive。runtime 會主動把 viewport 命中結果同步成 `modelValue`，因此讀這段 source 時要同時追 DOM listener、client guard、computed width 與 emit 流程。
