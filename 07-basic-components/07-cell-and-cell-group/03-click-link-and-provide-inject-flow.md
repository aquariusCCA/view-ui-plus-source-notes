# View UI Plus Cell / CellGroup：Click、Link 與 Provide / Inject 事件流程解析

## 1. 本章定位

本章是 `View UI Plus` 中 `Cell / CellGroup` 的 **click flow 與 link navigation 筆記**。

它要解決的問題是：

- `Cell` 被點擊時，為什麼 `CellGroup` 能收到子項的 `name`？
- `CellGroup` 的 `on-click` 是怎麼被觸發的？
- `Cell` 有 `to` 時，點擊事件如何進入 `mixins/link.js`？
- `on-click` 和導頁之間是什麼關係？
- `disabled`、`target="_blank"`、ctrl / meta click 對流程有什麼影響？
- `linkUrl` 和真正的 navigation 是否是同一件事？

本章不深入分析以下內容：

- `Cell` / `CellItem` 的 DOM 展示結構。
- `Cell` 的 CSS selector、arrow positioning、selected / disabled 的樣式細節。
- `$VIEWUI.cell` 全域 arrow 設定。
- `Cell` 的完整 public props / slots 合約。

這些內容可以放到其他章節，例如：

- `02-public-contract-and-component-boundary.md`
- `04-render-style-arrow-and-global-config.md`

---

## 2. 學習前先建立的基本觀念

在閱讀 `Cell` 的點擊流程前，需要先建立四個基本觀念。

### 2.1 `CellGroup` 不是狀態管理器，而是事件出口

`CellGroup` 的角色不是管理哪一個 `Cell` 被選中，也不是幫每個子項注入 props。它的核心職責很單純：

> 接收子 `Cell` 回報的 `name`，再對外觸發 `on-click(name)`。

也就是說，`CellGroup` 比較像一個事件收斂層，而不是完整的 list state manager。

### 2.2 `Cell` 是點擊流程的主角

真正綁定 click handler 的是 `Cell`，不是 `CellGroup`，也不是 `CellItem`。

`Cell` 在 click 時會做兩件事：

1. 通知 `CellGroup`：這個 `Cell` 被點到了。
2. 如果存在 `to`，交給 link mixin 處理導頁。

所以閱讀事件流程時，應該以 `Cell.handleClickItem()` 為中心往外展開。

### 2.3 `provide / inject` 是父子通訊捷徑

在 Vue 中，父子元件通訊常見方式是：

```txt
子元件 $emit
  -> 父元件監聽事件
```

但 `Cell / CellGroup` 這裡採用的是：

```txt
CellGroup provide 自己
  -> Cell inject CellGroupInstance
  -> Cell 直接呼叫 CellGroupInstance.handleClick(name)
  -> CellGroup 再 emit on-click(name)
```

這種設計讓 `Cell` 不需要一層層 emit，也不需要由中間元件轉發事件。

### 2.4 `to` 決定是否進入 link navigation，但不影響 group event

`to` 的存在只影響 link navigation，不影響 `CellGroup` 是否收到 `on-click`。

因此：

```txt
沒有 to：
  click -> on-click(name)

有 to：
  click -> on-click(name) -> navigation
```

這是本章最重要的心智模型。

---

## 3. 整體概覽：一次 click 的雙流程模型

`Cell` 的一次 click 可以拆成兩條責任鏈：

```txt
點擊 Cell
  |
  |-- 流程 A：通知 CellGroup
  |     -> CellGroupInstance.handleClick(name)
  |     -> CellGroup emit on-click(name)
  |     -> 使用者的 @on-click handler 收到 name
  |
  |-- 流程 B：處理 link navigation
        -> handleCheckClick(event, new_window)
        -> 根據 to / target / router / replace / ctrl / meta 決定導頁方式
```

這兩條流程不是平行亂跑，而是按照 `handleClickItem()` 中的程式碼順序執行：

```js
handleClickItem (event, new_window) {
    this.CellGroupInstance.handleClick(this.name);
    this.handleCheckClick(event, new_window);
}
```

也就是：

```txt
先通知 group
再處理 navigation
```

這個順序會影響實務判斷。例如外部如果在 `@on-click` 中做 logging、埋點、選中狀態同步，這些動作會早於 navigation 嘗試執行。

---

## 4. 核心內容逐步講解

### 4.1 `CellGroup` 如何把自己提供給子 `Cell`

`CellGroup` 使用 `provide()` 將自己暴露出去：

```js
provide () {
    return {
        CellGroupInstance: this
    }
}
```

這代表在 `CellGroup` 之下的後代元件，只要使用對應 key，就可以取得這個 instance。

`Cell` 端則使用：

```js
inject: ['CellGroupInstance']
```

取得父層提供的 instance。

這段設計有兩個閱讀重點：

1. `Cell` 點擊時不是自己 `$emit('on-click')`。
2. `Cell` 也不是透過 DOM event bubble 讓 `CellGroup` 捕捉 click。

它是直接呼叫父層 instance 的方法：

```js
this.CellGroupInstance.handleClick(this.name);
```

因此，`CellGroup` 對 `Cell` 提供的是一個「可呼叫的父層 API」，而不是單純資料。

---

### 4.2 `CellGroup.handleClick()` 如何轉成 public event

`CellGroup` 真正對外公開的事件來自：

```js
handleClick (name) {
    this.$emit('on-click', name);
}
```

整理成流程：

```txt
Cell 被點擊
  -> Cell.handleClickItem(event, new_window)
  -> CellGroupInstance.handleClick(Cell.name)
  -> CellGroup emit on-click(name)
  -> 使用者的 @on-click handler 收到 name
```

這裡有一個重要細節：`CellGroup` 只收到 `name`。

它沒有收到：

- 原始 DOM event。
- 被點擊的 `Cell` instance。
- `selected` 狀態。
- `disabled` 狀態。
- link navigation 結果。

因此 `on-click` 的語意應該理解為：

> 某個 `Cell` 被點擊，且它的識別值是 `name`。

不應理解為：

> 這個 `Cell` 已成功導頁，或這個 `Cell` 已經被選中。

---

### 4.3 `Cell` 的 click binding 如何依照 `to` 分支

`Cell` template 依照是否存在 `to` 分成兩個 wrapper。

有 `to` 時，使用 `<a>`：

```vue
<a
    v-if="to"
    :href="linkUrl"
    :target="target"
    class="ivu-cell-link"
    @click.exact="handleClickItem($event, false)"
    @click.ctrl="handleClickItem($event, true)"
    @click.meta="handleClickItem($event, true)">
```

沒有 `to` 時，使用 `<div>`：

```vue
<div class="ivu-cell-link" v-else @click="handleClickItem">
```

可以整理成：

| 條件 | Wrapper | Click binding | 主要目的 |
| --- | --- | --- | --- |
| 有 `to` | `<a>` | `@click.exact`、`@click.ctrl`、`@click.meta` | 支援一般導頁與 ctrl / meta 新視窗行為。 |
| 無 `to` | `<div>` | `@click` | 只作為可點擊的列表項目，不具備 link 語意。 |

兩個分支都會進入 `handleClickItem()`，因此不管有沒有 `to`，`CellGroup` 都能收到 `on-click`。

---

### 4.4 `handleClickItem()` 的真正時序

`handleClickItem()` 是本章最關鍵的方法：

```js
handleClickItem (event, new_window) {
    this.CellGroupInstance.handleClick(this.name);
    this.handleCheckClick(event, new_window);
}
```

這個方法做了兩件事：

1. `this.CellGroupInstance.handleClick(this.name)`
   - 把自己的 `name` 回報給 `CellGroup`。
   - 由 `CellGroup` 對外 emit `on-click(name)`。

2. `this.handleCheckClick(event, new_window)`
   - 進入 link mixin。
   - 根據 `to`、`target`、router、`replace`、`new_window` 決定是否導頁。

這裡的時序不能反過來理解。它不是先導頁成功後才通知 group，而是先通知 group，再嘗試處理導頁。

所以一次有 `to` 的點擊可以理解成：

```txt
使用者點擊 <Cell to="/button" name="button">
  -> 先觸發 CellGroup 的 on-click('button')
  -> 再交給 link mixin 判斷要 push、replace、window.location 或 window.open
```

---

### 4.5 `disabled` 在事件流程中的邊界

`handleClickItem()` 沒有檢查 `disabled`：

```js
handleClickItem (event, new_window) {
    this.CellGroupInstance.handleClick(this.name);
    this.handleCheckClick(event, new_window);
}
```

因此從目前筆記提供的 runtime 片段來看，`disabled` 不會中止事件流程。

| 情境 | Runtime 結果 |
| --- | --- |
| `<Cell disabled name="a" />` 被點擊 | 仍會呼叫 `CellGroupInstance.handleClick('a')`。 |
| `<Cell disabled to="/button" />` 被點擊 | 仍會進入 `handleCheckClick()`，有機會導頁。 |
| `disabled` 的直接作用 | 產生 `ivu-cell-disabled` class，影響樣式。 |

這是閱讀 `Cell` 時非常重要的邊界。

在很多 UI library 中，`disabled` 常常同時代表：

```txt
樣式變灰 + 阻止互動
```

但從這份筆記整理的 source 來看，`Cell` 的 `disabled` 更接近：

```txt
樣式狀態
```

而不是完整行為 guard。

如果使用者想要 disabled 時完全不可點擊，需要在外部 handler 中自行判斷，或在封裝層補上行為控制。

---

### 4.6 link mixin 的入口：`handleCheckClick()`

`Cell` 混入：

```js
mixins: [ mixinsLink, globalConfig ]
```

因此它可以呼叫 link mixin 提供的方法。

點擊後進入的 link 方法是：

```js
handleCheckClick (event, new_window = false) {
    if (this.to) {
        if (this.target === '_blank') {
            this.handleOpenTo();
            return false;
        } else {
            event.preventDefault();
            this.handleClick(new_window);
        }
    }
}
```

這段可以拆成三種情況：

| 條件 | 行為 |
| --- | --- |
| 沒有 `to` | 不做 navigation。 |
| 有 `to` 且 `target === '_blank'` | 呼叫 `handleOpenTo()`，然後 `return false`。 |
| 有 `to` 且 `target !== '_blank'` | `event.preventDefault()`，再呼叫 `handleClick(new_window)`。 |

這裡要注意：

- `handleCheckClick()` 只在有 `to` 時才會做導頁處理。
- 一般 link click 會先 `preventDefault()`，再交給 JavaScript navigation。
- `_blank` 分支沒有明確呼叫 `event.preventDefault()`，因此要搭配 `<a target="_blank">` 的瀏覽器預設行為一起理解。

---

### 4.7 `linkUrl` 的責任：只決定 `<a href>`

有 `to` 時，`Cell` 會把 `<a>` 的 `href` 設為 `linkUrl`。

`linkUrl` 的邏輯如下：

```js
linkUrl () {
    const type = typeof this.to;
    if (type !== 'string') {
        return null;
    }
    if (this.to.includes('//')) {
        return this.to;
    }
    const router = this.$router;
    if (router) {
        const current = this.$route;
        const route = router.resolve(this.to, current, this.append);
        return route ? route.href : this.to;
    }
    return this.to;
}
```

整理成表格：

| `to` 型態 / 內容 | router 是否存在 | `linkUrl` 結果 | 閱讀重點 |
| --- | --- | --- | --- |
| object | 任意 | `null` | object route 無法直接形成 href 字串。 |
| string，且包含 `//` | 任意 | 原始 URL | 被視為 absolute URL。 |
| route string | 有 router | `router.resolve(...).href` 或原始 `to` | 讓 `<a href>` 對應 router 解析後的路徑。 |
| route string | 無 router | 原始 `to` | 沒有 router 時只能保留原始字串。 |

這裡很容易誤會：`linkUrl` 不是完整 navigation 流程。

它的主要責任是：

```txt
產生 <a href="..."> 需要的 href 值
```

真正 click 後要不要 `router.push()`、`router.replace()`、`window.location.href` 或 `window.open()`，仍由 `handleCheckClick()`、`handleClick()`、`handleOpenTo()` 決定。

---

### 4.8 一般點擊時的 `handleClick()` 導頁規則

當 `target !== '_blank'` 且存在 `to` 時，`handleCheckClick()` 會執行：

```js
event.preventDefault();
this.handleClick(new_window);
```

`handleClick()` 的主要規則可以整理如下：

```js
if (new_window) {
    this.handleOpenTo();
} else {
    if (router) {
        if ((typeof this.to === 'string') && this.to.includes('//')) {
            window.location.href = this.to;
        } else {
            this.replace ? this.$router.replace(this.to, () => {}) : this.$router.push(this.to, () => {});
        }
    } else {
        window.location.href = this.to;
    }
}
```

換成流程表：

| 條件 | 導頁方式 |
| --- | --- |
| `new_window === true` | 呼叫 `handleOpenTo()`。 |
| 有 router，且 `to` 是 absolute URL | `window.location.href = this.to`。 |
| 有 router，且不是 absolute URL，`replace === false` | `router.push(this.to)`。 |
| 有 router，且不是 absolute URL，`replace === true` | `router.replace(this.to)`。 |
| 無 router | `window.location.href = this.to`。 |

這代表 `replace` 只有在特定條件下才會生效：

```txt
有 router
且 to 不是 absolute URL
且不是 new_window
```

如果是 absolute URL 或沒有 router，就不會走 `router.replace()`。

---

### 4.9 ctrl / meta click 如何影響 `new_window`

有 `to` 的 `<a>` branch 綁定了：

```vue
@click.ctrl="handleClickItem($event, true)"
@click.meta="handleClickItem($event, true)"
```

所以：

```txt
一般點擊
  -> new_window = false

Ctrl + click
  -> new_window = true

Meta + click
  -> new_window = true
```

`new_window = true` 最後會讓 `handleClick()` 進入：

```js
this.handleOpenTo();
```

這個設計是為了模擬使用者在瀏覽器中對 link 使用 ctrl / meta click 時的常見預期：在新分頁或新視窗開啟。

不過，`handleOpenTo()` 裡對 string `to` 有提前 return 的註解，提到避免跳轉兩次，並且有 Vue 3 行為待驗證的註記。這表示這裡不能單純用「按住 ctrl 一定會由 JavaScript window.open」來理解，還要考慮 `<a>` 原生行為與 source 中的防重複跳轉設計。

---

### 4.10 `target="_blank"` 的特殊分支

`target="_blank"` 由 `handleCheckClick()` 優先處理：

```js
if (this.target === '_blank') {
    this.handleOpenTo();
    return false;
}
```

同時，template 中 `<a>` 也有：

```vue
:target="target"
```

因此 `_blank` 情境需要同時考慮兩件事：

1. JavaScript 呼叫 `handleOpenTo()`。
2. `<a target="_blank">` 的瀏覽器原生行為。

source 註解：

```js
if (typeof this.to === 'string') return; // 會跳轉兩次 // todo Vue3这里不跳2次，待验证
```

這段註解提醒我們：作者知道手動 `window.open()` 與 `<a>` 預設跳轉之間可能有重複風險。

因此這裡的正確閱讀方式不是直接下結論說「一定開一次」或「一定開兩次」，而是要理解：

- source 有意識地處理重複跳轉問題。
- string `to` 與 object route 可能走不同處理。
- 若要精準確認 Vue 3 實際行為，需要搭配完整 source 與瀏覽器實測。

---

### 4.11 SSR / Client Boundary

`link.js` 會從工具模組引入：

```js
import { isClient } from '../utils/index';
```

並在 navigation 方法裡檢查：

```js
if (!isClient) return;
```

這代表 navigation 行為只會在 client environment 執行。

對 `Cell` 來說，這是一個來自 mixin 的邊界：`Cell` 本身沒有自己處理 SSR，而是借用 link mixin 的通用設計。

閱讀元件庫 source 時，這是一個值得注意的模式：

```txt
元件本身不一定直接處理所有環境問題
共用 mixin / utility 可能會集中處理跨元件邊界
```

---

## 5. 表格整理

### 5.1 click flow 責任分工表

| 角色 / 方法 | 所在位置 | 主要責任 | 閱讀重點 |
| --- | --- | --- | --- |
| `CellGroup.provide()` | `cell-group.vue` | 對後代提供 `CellGroupInstance`。 | 讓子 `Cell` 可以直接呼叫父層方法。 |
| `Cell.inject` | `cell.vue` | 注入 `CellGroupInstance`。 | `Cell` 預期能取得 group instance。 |
| `CellGroup.handleClick(name)` | `cell-group.vue` | 將子項 click 轉成 `on-click(name)`。 | 只接收 `name`，不處理 navigation。 |
| `Cell.handleClickItem(event, new_window)` | `cell.vue` | click flow 入口。 | 先通知 group，再處理 link。 |
| `handleCheckClick(event, new_window)` | `mixins/link.js` | 判斷是否導頁與如何進入導頁流程。 | 根據 `to`、`target` 分支。 |
| `linkUrl` | `mixins/link.js` / `Cell` 可用的 computed | 產生 `<a href>`。 | 只決定 href，不等同完整 navigation。 |
| `handleClick(new_window)` | `mixins/link.js` | 一般 click navigation。 | 根據 router、absolute URL、replace、new_window 分支。 |
| `handleOpenTo()` | `mixins/link.js` | 新視窗 / 新分頁開啟流程。 | 需要注意 string `to` 與重複跳轉註解。 |

---

### 5.2 `to` 與 navigation 結果表

| 情境 | 是否 emit `on-click` | Navigation 行為 |
| --- | --- | --- |
| 沒有 `to` | 會 | 不導頁。 |
| 有 `to`，一般點擊，沒有 router | 會 | `window.location.href = this.to`。 |
| 有 `to`，一般點擊，有 router，非 absolute URL | 會 | `router.push()` 或 `router.replace()`。 |
| 有 `to`，一般點擊，有 router，absolute URL | 會 | `window.location.href = this.to`。 |
| 有 `to`，ctrl / meta click | 會 | 進入 `handleOpenTo()` 或受 `<a>` 原生行為影響。 |
| 有 `to`，`target="_blank"` | 會 | 進入 `handleOpenTo()`，同時需考慮 `<a target>` 原生行為。 |

---

### 5.3 容易誤解的 prop 邊界

| Prop | 容易誤解 | 實際閱讀重點 |
| --- | --- | --- |
| `disabled` | 以為會阻止 click。 | 從提供的 `handleClickItem()` 來看，沒有 disabled guard。 |
| `selected` | 以為 click 後會自動變 selected。 | selected 是 class 輸入，不是內部狀態管理。 |
| `to` | 以為只控制 href。 | 它同時決定 wrapper branch 與 navigation flow。 |
| `replace` | 以為所有導頁都能 replace。 | 只有走 router navigation 時才有意義。 |
| `target` | 以為只影響 `<a target>`。 | 也會影響 `handleCheckClick()` 分支。 |
| `append` | 以為由 `Cell` 自己處理。 | 主要傳給 router resolve 使用。 |

---

## 6. 範例或情境說明

### 6.1 無 `to`：只作為可點擊列表項

```vue
<CellGroup @on-click="handleClick">
    <Cell name="profile" title="Profile" />
</CellGroup>
```

點擊後流程是：

```txt
click Cell
  -> CellGroupInstance.handleClick('profile')
  -> CellGroup emit on-click('profile')
  -> handleClick('profile')
  -> handleCheckClick()
  -> 因為沒有 to，不導頁
```

這種情境中，`Cell` 像是一個列表選項。實際要做什麼由外部 `handleClick` 決定。

---

### 6.2 有 `to`：先通知 group，再導頁

```vue
<CellGroup @on-click="handleClick">
    <Cell name="button-page" title="Button" to="/button" />
</CellGroup>
```

點擊後流程是：

```txt
click Cell
  -> emit on-click('button-page')
  -> handleCheckClick(event, false)
  -> preventDefault()
  -> router.push('/button') 或其他 navigation 分支
```

這裡的重點是：`on-click` 不是導頁完成事件，而是 click 被 group 收到的事件。

---

### 6.3 disabled + to：樣式 disabled，不代表阻止導頁

```vue
<CellGroup @on-click="handleClick">
    <Cell name="danger" title="Danger" disabled to="/danger" />
</CellGroup>
```

從目前提供的 runtime 片段來看，點擊後仍可能發生：

```txt
on-click('danger')
navigation to /danger
```

所以如果業務需求是「disabled 時不能點擊」，外部應該補上 guard，例如：

```js
function handleClick(name) {
    if (name === 'danger') return;
    // other logic
}
```

更完整的封裝也可以避免在 disabled 狀態下傳入 `to`，但這屬於使用者端設計，`Cell` runtime 已經提供的行為。

---

### 6.4 ctrl / meta click：一樣先 emit，再處理新視窗

```vue
<CellGroup @on-click="handleClick">
    <Cell name="docs" title="Docs" to="/docs" />
</CellGroup>
```

使用者按住 Ctrl 或 Meta 點擊時：

```txt
click.ctrl / click.meta
  -> handleClickItem(event, true)
  -> CellGroup emit on-click('docs')
  -> handleCheckClick(event, true)
  -> handleClick(true)
  -> handleOpenTo()
```

不過，實際新視窗行為仍需搭配 `<a>` 原生行為和 `handleOpenTo()` 內部防重複跳轉邏輯一起理解。

---

## 7. 閱讀路線或學習路線

第一次閱讀這段 source 時，建議不要直接從 `link.js` 開始，因為 link mixin 會讓流程看起來很分散。比較好的順序是：

1. **先讀 `cell-group.vue`**
   - 目標是理解 `provide()` 和 `handleClick(name)`。
   - 先知道父層只負責轉發 `on-click`。

2. **再讀 `cell.vue` 的 inject 與 click binding**
   - 觀察有 `to` 和沒有 `to` 時 wrapper 分別是 `<a>` 和 `<div>`。
   - 注意兩個 branch 都會進入 `handleClickItem()`。

3. **接著讀 `handleClickItem()`**
   - 這是整個 click flow 的核心。
   - 記住順序是：先 group event，再 link navigation。

4. **再讀 `mixins/link.js` 的 `handleCheckClick()`**
   - 目標是理解 `to`、`target`、`preventDefault()` 如何分支。

5. **再讀 `handleClick()`**
   - 觀察 router、absolute URL、`replace`、`new_window` 的分支。

6. **最後讀 `handleOpenTo()` 與註解**
   - 特別注意 string `to` 的提前 return，以及 source 中對 Vue 3 重複跳轉的待確認註記。

這個順序能避免一開始就被導頁細節困住，先建立事件主幹，再補分支。

---

## 8. 常見誤區

| 誤區 | 為什麼容易誤解 | 正確理解 |
| --- | --- | --- |
| 以為 `on-click` 代表導頁完成。 | `Cell` 有 `to`，容易把 click 與 navigation 綁在一起看。 | `on-click` 只代表 group 收到子項 click，發生在 navigation 前。 |
| 以為 `disabled` 會阻止 click。 | 多數 UI 元件的 disabled 都會阻止互動。 | 從目前 `handleClickItem()` 看，沒有 disabled guard；disabled 主要是 class / style。 |
| 以為 `CellGroup` 管理 selected 狀態。 | 名稱像 group，容易聯想到 RadioGroup / CheckboxGroup。 | `CellGroup` 只提供容器與事件出口，不管理 selected state。 |
| 以為 `linkUrl` 就是導頁邏輯。 | 它看起來會 resolve router path。 | `linkUrl` 主要提供 `<a href>`，真正 click navigation 在 `handleCheckClick()` 後續方法。 |
| 以為 `replace` 永遠會生效。 | `replace` 是 public prop，容易直覺認為所有導頁都用它。 | 只有有 router、非 absolute URL、一般 navigation 時才會走 `router.replace()`。 |
| 以為 `target="_blank"` 只有瀏覽器原生行為。 | template 上有 `:target="target"`。 | `handleCheckClick()` 也會偵測 `_blank` 並呼叫 `handleOpenTo()`。 |
| 以為 `Cell` 可以安全脫離 `CellGroup` 點擊。 | `Cell` 本身是 public component，直覺上可單獨使用。 | `handleClickItem()` 直接呼叫 `this.CellGroupInstance.handleClick()`，若沒有注入會有風險。 |

---

## 9. 本章總結

`Cell / CellGroup` 的 click flow 可以用一句話總結：

> `Cell` 被點擊時，先透過 inject 取得的 `CellGroupInstance` 回報 `name`，由 `CellGroup` 對外 emit `on-click(name)`；接著，如果 `Cell` 帶有 `to`，再交給 link mixin 根據 `target`、router、`replace`、ctrl / meta click 等條件處理 navigation。

這個設計讓 `CellGroup` 的職責保持簡單：它只負責事件收斂，不負責導頁，也不管理選中狀態。`Cell` 則同時扮演 public item 與 link item 的角色，因此它的 click handler 會連接兩個系統：父子通訊系統與導頁系統。

閱讀這段 source 時，最重要的不是背每一個分支，而是掌握三個邊界：

1. `on-click` 早於 navigation。
2. `disabled` 不在 `handleClickItem()` 裡做行為阻擋。
3. `<a href>`、`target`、router navigation、`window.location`、`window.open()` 共同組成 link 行為，不能只看其中一段。

掌握這三個邊界後，再去閱讀 View UI Plus 其他混入 `mixins/link.js` 的元件，就會更容易辨識「元件本身的 click 行為」與「共用 link 行為」之間的分工。

---

## 10. 自我檢查問題

1. `Cell` 點擊時，為什麼可以直接呼叫 `CellGroupInstance.handleClick()`？
2. `CellGroup.handleClick(name)` 對外 emit 的事件名稱與 payload 是什麼？
3. `handleClickItem()` 中，group event 和 link navigation 的執行順序是什麼？
4. 有 `to` 和沒有 `to` 時，`Cell` 的 wrapper 分別是什麼？
5. `linkUrl` 的責任是什麼？它是否等同於真正的導頁行為？
6. 為什麼說 `disabled` 在這裡比較像視覺狀態，而不是行為 guard？
7. `target="_blank"` 和 ctrl / meta click 都會和哪個方法產生關聯？
8. `replace` 在什麼條件下才會影響 navigation？
9. 如果 `to` 是 absolute URL 且存在 router，runtime 會使用 router 還是 `window.location.href`？
10. 為什麼 `Cell` 脫離 `CellGroup` 使用時，click handler 可能有風險？

---

## 11. 後續延伸方向

這份筆記可以繼續延伸成以下主題：

1. **`Cell` render / style / arrow 與 global config 分析**
   - 延伸閱讀 `04-render-style-arrow-and-global-config.md`。
   - 分析 `cell.less`、arrow slot、`$VIEWUI.cell` 設定來源。

2. **`mixins/link.js` 共用設計分析**
   - 比較 `Cell`、`Button`、其他可導頁元件是否共用相同 link 行為。
   - 分析 `to`、`replace`、`append`、`target` 在不同元件中的一致性。

3. **`provide / inject` 在 View UI Plus 中的使用模式**
   - 找出其他 group / item 類元件是否也用 provide / inject。
   - 比較它和 `$emit`、`v-model`、controlled state 的差異。

4. **disabled 行為一致性分析**
   - 比較 `Cell`、`Button`、`MenuItem` 等元件的 disabled 是否都會阻止 click。
   - 這可以幫助理解元件庫中「視覺 disabled」與「行為 disabled」是否一致。

5. **router navigation 與瀏覽器原生 link 行為比較**
   - 分析 `<a href>`、`router.push()`、`window.location.href`、`window.open()` 的不同使用場景。
   - 特別適合補強前端路由與瀏覽器行為的底層理解。
