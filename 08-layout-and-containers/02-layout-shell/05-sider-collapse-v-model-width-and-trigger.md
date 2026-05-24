# Sider Collapse、v-model、Width 與 Trigger

## 1. 本章定位

本篇專注閱讀 `Sider` 的收合、寬度與 trigger 行為。

主要來源：

```txt
01-origin/source/view-ui-plus-v1.3.20/src/components/layout/sider.vue
01-origin/source/view-ui-plus-v1.3.20/src/styles/components/layout.less
01-origin/source/view-ui-plus-v1.3.20/examples/routers/layout.vue
```

`Sider` 是 layout shell 中唯一有明顯互動狀態的元件。它的核心流程可以先理解成：

```txt
modelValue
  -> siderWidth
  -> wrapStyles
  -> trigger visibility
  -> update:modelValue
  -> on-collapse watcher
```

---

## 2. Template 結構

`Sider` template 可以分成四段：

```txt
root div
  -> zero-width trigger span
  -> children wrapper
  -> default slot content
  -> trigger slot fallback
```

對應結構：

| 區塊 | 用途 |
| --- | --- |
| root div | 承載 `wrapClasses` 與 `wrapStyles`，控制整個 Sider 寬度。 |
| zero-width trigger | 在 responsive matched 或 collapsedWidth 為 0 的收合場景顯示。 |
| children wrapper | 包住 default slot 內容，class 為 `ivu-layout-sider-children`。 |
| trigger slot fallback | 沒有自訂 `trigger` slot 時，顯示底部預設 trigger。 |

這表示 `trigger` named slot 只取代底部 trigger fallback，不取代 zero-width trigger。

---

## 3. v-model 與事件流程

`Sider` 使用 Vue 3 的 `modelValue` / `update:modelValue` 模式：

| 部分 | source |
| --- | --- |
| 狀態 prop | `modelValue` |
| 更新事件 | `update:modelValue` |
| 使用方式 | `<Sider v-model="isCollapsed">` |

`toggleCollapse()` 的邏輯是：

```txt
if collapsible:
  next modelValue = !current modelValue
else:
  next modelValue = false

emit update:modelValue(next modelValue)
```

`on-collapse` 不是在 `toggleCollapse()` 裡直接 emit，而是由 watcher 觸發：

```txt
watch modelValue
  -> emit on-collapse(state)
```

因此完整流程是：

```txt
click trigger
  -> toggleCollapse()
  -> emit update:modelValue(next)
  -> parent updates v-model
  -> modelValue prop changes
  -> watch emits on-collapse(state)
```

---

## 4. `defaultCollapsed` 初始化

mounted 時有一段初始化：

```txt
if defaultCollapsed:
  emit update:modelValue(defaultCollapsed)
```

它不是直接改內部 data，因為 `Sider` 沒有自己的 collapsed data。它仍然透過 `update:modelValue` 交給父層更新。

可以理解成：

```txt
defaultCollapsed
  -> mounted emit update:modelValue(true)
  -> parent v-model updates modelValue
  -> watcher emits on-collapse(true)
```

如果外部已經用 `v-model` 控制狀態，最終狀態仍以父層資料為準。

---

## 5. `siderWidth` 計算

`Sider` 的寬度來自 computed `siderWidth`。

核心邏輯：

```txt
if collapsible:
  if modelValue:
    if mediaMatched:
      0
    else:
      parseInt(collapsedWidth)
  else:
    parseInt(width)
else:
  width
```

整理成表格：

| `collapsible` | `modelValue` | `mediaMatched` | `siderWidth` |
| --- | --- | --- | --- |
| `false` | 任意 | 任意 | `width` |
| `true` | `false` | 任意 | `parseInt(width)` |
| `true` | `true` | `false` | `parseInt(collapsedWidth)` |
| `true` | `true` | `true` | `0` |

`wrapStyles` 再把 `siderWidth` 寫成四個 inline style：

```txt
width: siderWidth + px
minWidth: siderWidth + px
maxWidth: siderWidth + px
flex: 0 0 siderWidth + px
```

這四個 style 一起確保 `Sider` 在 flex layout 中使用固定寬度。

---

## 6. Width 型別與實務注意

Runtime props 宣告：

```txt
width: Number / String
collapsedWidth: Number / String
```

但 source 實際上在收合分支使用 `parseInt()`，最後 `wrapStyles` 又會補上 `px`。

因此官方 example 使用：

```vue
<Sider width="200" collapsed-width="0">
```

這類數字字串可以正常轉成 `200px` 或 `0px`。如果傳入帶單位的字串，例如 `width="200px"`，需要特別小心，因為非收合分支可能會被組成 `200pxpx`。筆記中應把 runtime 的 String 支援理解成偏向數字字串，而不是完整 CSS size。

---

## 7. Class mapping

`wrapClasses` 會輸出：

| 條件 | class |
| --- | --- |
| 永遠存在 | `ivu-layout-sider` |
| `siderWidth` 為 0 | `ivu-layout-sider-zero-width` |
| `modelValue` 為 true | `ivu-layout-sider-collapsed` |

其中 `ivu-layout-sider-zero-width` 主要配合 Less：

```txt
zero width
  -> hide overflowing children
  -> position zero-width trigger outside sider
```

`ivu-layout-sider-collapsed` 主要提供 collapsed 狀態 class，實際寬度仍由 inline style 控制。

---

## 8. Bottom trigger

預設底部 trigger 位於 `trigger` slot fallback 中：

```txt
<slot name="trigger">
  default bottom trigger
</slot>
```

顯示條件來自：

```txt
showBottomTrigger =
  collapsible
  && !mediaMatched
  && !hideTrigger
```

也就是：

| 條件 | 結果 |
| --- | --- |
| `collapsible=false` | 不顯示預設 bottom trigger。 |
| `mediaMatched=true` | 不顯示預設 bottom trigger，改用 zero-width responsive 場景。 |
| `hideTrigger=true` | 不顯示預設 bottom trigger。 |
| 以上都不成立 | 顯示預設 bottom trigger。 |

點擊 bottom trigger 會執行：

```txt
toggleCollapse()
```

trigger 寬度使用：

```txt
style width = siderWidth + px
```

因此展開時 trigger 寬度等於展開寬度，收合時等於收合寬度。

---

## 9. Zero-width trigger

zero-width trigger 是 template 中獨立的 `<span>`，顯示條件來自：

```txt
showZeroTrigger =
  collapsible
  && !hideTrigger
  && (
       mediaMatched
       || (parseInt(collapsedWidth) === 0 && modelValue)
     )
```

它會在兩類場景出現：

| 場景 | 說明 |
| --- | --- |
| responsive matched | 進入 breakpoint 命中狀態時，`Sider` 寬度會變成 0。 |
| collapsedWidth 為 0 且已收合 | 手動收合到 0 寬度時，需要露出一個外掛 trigger 讓使用者展開。 |

zero-width trigger 的位置與尺寸主要由 Less 控制：

```txt
ivu-layout-sider-zero-width-trigger
```

`reverseArrow` 會加上：

```txt
ivu-layout-sider-zero-width-trigger-left
```

這會把 trigger 從右側外掛改成左側外掛，常用於右側側邊欄。

---

## 10. Trigger icon

預設 bottom trigger icon class 由 `reverseArrow` 決定：

| `reverseArrow` | icon class |
| --- | --- |
| `false` | `ivu-icon-ios-arrow-back` |
| `true` | `ivu-icon-ios-arrow-forward` |

收合時，`triggerClasses` 會加上：

```txt
ivu-layout-sider-trigger-collapsed
```

Less 再對 icon 做旋轉：

```txt
trigger-collapsed
  -> trigger-icon rotateZ(180deg)
```

zero-width trigger 則固定使用：

```txt
ivu-icon-ios-menu
```

---

## 11. 自訂 trigger slot

如果使用者提供：

```vue
<template #trigger>
    ...
</template>
```

會取代預設 bottom trigger fallback。

需要注意：

1. source 的 `v-show="showBottomTrigger"` 在 fallback div 上，不在 slot 本身上。
2. 自訂 slot 內容的顯示條件需要由使用者自己處理。
3. zero-width trigger 不會被這個 slot 取代。

這是閱讀 template 時很容易漏掉的 slot 邊界。

---

## 12. 本篇小結

`Sider` 的收合行為可以收斂成：

```txt
props define whether collapse is allowed
  -> modelValue controls collapsed state
  -> siderWidth maps state to px width
  -> wrapStyles locks flex width
  -> trigger click emits update:modelValue
  -> modelValue watcher emits on-collapse
```

讀這段 source 時，最重要的是不要把 `Sider` 看成有內部 collapsed data 的元件。它是受控元件，狀態來源是 `modelValue`，內部只負責計算寬度、顯示 trigger，並 emit 更新請求。
