# Card Runtime：Title、Extra、Body、Link 與 Padding

## 1. 本章定位

本篇聚焦 `Card` runtime source：

```txt
01-origin/source/view-ui-plus-v1.3.20/src/components/card/card.vue
```

同時需要對照：

```txt
01-origin/source/view-ui-plus-v1.3.20/src/mixins/link.js
01-origin/source/view-ui-plus-v1.3.20/src/styles/components/card.less
```

`Card` 不是單純的一層 wrapper。它同時處理卡片分區、可點擊 root、hover / shadow 狀態與 body padding。

---

## 2. Template 結構

`Card` template 的骨架可以整理成：

```txt
root component: div or a
  -> head div, optional
       -> title slot fallback
  -> extra div, optional
       -> extra slot
  -> body div
       -> default slot
```

對應 class：

| DOM 區塊 | class | 來源 |
| --- | --- | --- |
| root | `ivu-card` + state classes | `classes` computed。 |
| head | `ivu-card-head` | `headClasses` computed。 |
| extra | `ivu-card-extra` | `extraClasses` computed。 |
| body | `ivu-card-body` | `bodyClasses` computed。 |

這代表 `Card` 的視覺結構由 runtime DOM 和 `card.less` 共同完成。

---

## 3. Root class 狀態

`classes` computed 固定包含：

```txt
ivu-card
```

並依 props 加上狀態 class：

| 條件 | class |
| --- | --- |
| `bordered && !shadow` | `ivu-card-bordered` |
| `disHover || shadow` | `ivu-card-dis-hover` |
| `shadow` | `ivu-card-shadow` |

這裡最容易漏看的是 `shadow` 的雙重效果：

```txt
shadow = true
  -> ivu-card-shadow
  -> ivu-card-dis-hover
  -> 不加 ivu-card-bordered
```

也就是說，`shadow` 不只是加陰影，也會讓 card 進入固定陰影、停用一般 hover shadow 的狀態。

---

## 4. Head 顯示條件

`Card` data 初始值是：

```txt
showHead: true
showExtra: true
```

但 mounted 後會重新判斷：

```txt
showHead = title || $slots.title !== undefined
showExtra = $slots.extra !== undefined
```

因此 head 的實際顯示規則是：

| 條件 | head 是否顯示 |
| --- | --- |
| 有 `title` prop | 顯示。 |
| 有 `title` slot | 顯示。 |
| 兩者都沒有 | mounted 後隱藏。 |

title slot 的 fallback 是：

```txt
<p>
  <Icon v-if="icon" />
  <span>{{ title }}</span>
</p>
```

也就是說，`icon` 只服務預設 title 結構；如果使用者提供 `title` slot，就由 slot 自己決定內容。

---

## 5. Extra 顯示條件

extra 區塊只看 slot：

```txt
showExtra = $slots.extra !== undefined
```

| 條件 | extra 是否顯示 |
| --- | --- |
| 有 `extra` slot | 顯示。 |
| 沒有 `extra` slot | mounted 後隱藏。 |

`Card` 沒有 `extra` prop。右上角操作區完全由具名 slot 提供。

---

## 6. Body 與 padding

body 永遠存在：

```txt
<div :class="bodyClasses" :style="bodyStyles">
  <slot></slot>
</div>
```

預設 padding 來自兩處：

| 來源 | 責任 |
| --- | --- |
| `defaultPadding = 16` | runtime 判斷是否需要輸出 inline style。 |
| `card.less` 的 `ivu-card-body` | 預設 `padding: 16px`。 |

`bodyStyles` 的邏輯是：

```txt
padding === 16
  -> 回傳空字串，不輸出 inline style

padding !== 16
  -> { padding: `${padding}px` }
```

因此 `padding` 只影響 body，不影響 head 或 extra。這是卡片內容間距，不是整張卡片的外距或 root padding。

---

## 7. Link 模式

`Card` 混入：

```txt
mixinsLink from '../../mixins/link'
```

link 模式的判斷來自：

```txt
isHrefPattern = !!to
```

root tag 對照：

| 條件 | `tagName` | `tagProps` |
| --- | --- | --- |
| 沒有 `to` | `div` | `{}` |
| 有 `to` | `a` | `{ href: linkUrl, target }` |

這裡的 `linkUrl` 和 `target` 都來自 link mixin。

### 7.1 `linkUrl`

`linkUrl` 只在 `to` 是 string 時回傳字串：

| `to` 型態 / 內容 | `linkUrl` 結果 |
| --- | --- |
| 非 string，例如 route object | `null`。 |
| string 且包含 `//` | 視為 absolute URL，直接回傳。 |
| string 且有 router | 使用 `router.resolve()` 得到 `href`。 |
| string 且沒有 router | 直接回傳 `to`。 |

因此，當 `to` 是 object 時，root 仍會是 `a`，但 `href` 可能是 `null`，真正跳轉由 click handler 接管。

### 7.2 click handling

`Card` root 綁定：

```txt
@click="handleClickLink"
```

流程可以整理成：

```txt
handleClickLink(event)
  -> 如果不是 link 模式，直接 return
  -> 判斷 ctrlKey / metaKey
  -> handleCheckClick(event, openInNewWindow)
```

`handleCheckClick()` 來自 link mixin：

| 條件 | 行為 |
| --- | --- |
| 沒有 `to` | 不處理。 |
| `target === '_blank'` | 呼叫 `handleOpenTo()`。 |
| 其他 target | `event.preventDefault()` 後呼叫 `handleClick()`。 |

`handleClick()` 再依 router、外部 URL、`replace` 決定用 `router.push()`、`router.replace()` 或 `window.location.href`。

---

## 8. 與 Less 的關係

`card.less` 接住 runtime class：

| class | Less 責任 |
| --- | --- |
| `ivu-card` | block、背景、border radius、字級、position、transition。 |
| `ivu-card-bordered` | border。 |
| `ivu-card-shadow` | 固定 card shadow。 |
| `ivu-card-dis-hover` | 停用 hover shadow 或保留 bordered hover border。 |
| `ivu-card-head` | 套用 `.content-header`。 |
| `ivu-card-extra` | 絕對定位到右上角。 |
| `ivu-card-body` | 預設 `padding: 16px`。 |

所以 runtime 負責「產生什麼結構與 class」，Less 負責「這些 class 的視覺效果」。

---

## 9. 官方 example 對照

`examples/routers/card.vue` 展示了幾個主線用法：

| Example 寫法 | 對應 source 重點 |
| --- | --- |
| `<Card style="width:350px" to="/button">` | root 進入 link 模式，寬度由 attr / style fallthrough 到 root。 |
| `#title` slot | head 由 title slot 顯示，覆蓋預設 title fallback。 |
| `#extra` slot | extra 區塊顯示右上角操作。 |
| default slot 放 `ul` | body 承載主內容。 |

example 沒有展示 `bordered`、`dis-hover`、`shadow`、`padding` 的所有分支，所以這些行為仍要回到 runtime 與 Less 判斷。

---

## 10. 本篇小結

`Card` 的 runtime 可以用下面這條鏈記住：

```txt
props / slots / link mixin
  -> root class and root tag
  -> optional head / extra
  -> body padding style
  -> card.less visual rules
```

讀 `Card` 時最重要的是不要把它看成純靜態容器。它同時是內容分區元件，也是可透過 `to` 變成可點擊入口的容器。
