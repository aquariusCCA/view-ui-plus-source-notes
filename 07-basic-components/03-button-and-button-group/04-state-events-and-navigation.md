# Button State Events And Navigation：loading、disabled、click 與跳轉流程

## 1. 本章定位

本章是一篇 `Button` / `ButtonGroup` 系列中的「狀態與事件流程」筆記，專門分析 `Button` 在互動時如何處理狀態、事件與跳轉。

本章主要回答以下問題：

1. `loading` 如何同時影響 class、icon 與樣式互動？
2. `disabled` 為什麼不是只看 `Button` 自己的 `disabled` prop？
3. `click` 發生時，`Button` 內部的執行順序是什麼？
4. 有 `to` 時，`Button` 如何從普通按鈕變成 link button？
5. `target="_blank"` 與 Ctrl / Cmd click 為什麼都會進入新視窗邏輯？
6. `mixins/link.js` 與 `mixins/form.js` 分別在互動流程中扮演什麼角色？

本章不重複整理所有 props contract，也不深入分析 `ButtonGroup` 的樣式系統。若要回查 props 對照，應閱讀 `02-public-props-contract.md`；若要理解 DOM render 與 class mapping，應閱讀 `03-render-and-class-mapping.md`；若要深入 group 與 less，則應閱讀後續的 `05-button-group-and-style-system.md`。

---

## 2. 閱讀前提：Button 不是單純的原生 button

在 UI 元件庫中，`Button` 通常不是對 `<button>` 做一層簡單包裝而已。它需要同時滿足多種使用場景：

| 使用場景 | 使用者期待 | 元件需要處理的事情 |
| --- | --- | --- |
| 表單提交 | 可以輸出 `<button type="submit">` | 支援 `htmlType`，並只在非 link button 時輸出原生 `type`。 |
| 一般操作 | 點擊後觸發外部事件 | `$emit('click', event)`，讓使用者接管業務邏輯。 |
| 載入狀態 | 顯示 spinner，避免重複點擊 | 加上 loading class、替換 icon，並透過樣式限制 pointer 行為。 |
| 禁用狀態 | 按鈕不可使用 | 結合自身 `disabled` 與上層 `Form` disabled。 |
| 連結跳轉 | 看起來像按鈕，但行為像連結 | 有 `to` 時渲染成 `<a>`，並交給 link mixin 處理跳轉。 |
| Router 導航 | 支援 Vue Router object / push / replace | 透過 `mixins/link.js` 處理 router navigation。 |

因此，閱讀 `Button` 時不能只問「它最後輸出什麼 DOM」，還要問：

- 這個狀態是 component 自己決定的，還是 mixin 提供的？
- 這個行為是 runtime 層處理，還是 style 層處理？
- 這個 prop 是用來影響 DOM attribute、class、children，還是 navigation？
- 對 `<button>` 和 `<a>` 來說，這個行為語意是否完全相同？

---

## 3. 四條互動主線總覽

本章可以先用四條線建立整體地圖。

```txt
loading
  -> class
  -> loading icon
  -> style pointer behavior

Button disabled / Form disabled
  -> itemDisabled
  -> disabled attribute
  -> disabled style / 原生 button 行為

DOM click
  -> emit click
  -> 判斷 Ctrl / Cmd click
  -> handleCheckClick()

Link navigation
  -> to / target / append / replace
  -> linkUrl / href
  -> router.push / router.replace / window.location / window.open
```

這四條線雖然可以分開學，但實際使用時常常會交疊。例如：

```vue
<Button
  type="primary"
  :loading="submitting"
  :disabled="!formValid"
  @click="submitForm"
>
  Submit
</Button>
```

在這個例子中：

- `loading` 控制送出中的視覺狀態。
- `disabled` 控制表單未完成時是否可操作。
- `@click` 接收使用者操作。
- 若按鈕放在 `Form` 裡，還可能被上層 `FormInstance.disabled` 影響。

再看另一個例子：

```vue
<Button to="/dashboard" target="_blank">
  Open Dashboard
</Button>
```

這時 `Button` 不再只是操作按鈕，而會進入 link button 的行為模式：輸出 `<a>`，計算 `href`，並在 click 時處理跳轉。

---

## 4. Loading 狀態：不是 disabled 的別名

### 4.1 loading 的基本角色

`loading` 是一個 `Boolean` prop。它通常表示「這個按鈕觸發的操作正在進行中」。例如送出表單、查詢資料、呼叫 API、儲存設定時，都可能讓按鈕進入 loading 狀態。

從使用者體驗來看，loading button 需要傳達兩個訊息：

1. 使用者剛才的操作已經被接收。
2. 系統正在處理，請不要重複點擊。

因此在 `View UI Plus` 的 `Button` 中，`loading` 不只是多一個 prop，而是會同時影響 class、children 與樣式層行為。

---

### 4.2 loading 對 class 的影響

當 `loading` 為 true 時，`classes` computed 會加入：

```txt
ivu-btn-loading
```

這個 class 是 runtime 與 style 的橋樑。runtime 不直接處理所有 loading 的視覺效果，而是把目前狀態轉成 class，再讓 `button.less` 接手。

可以把它理解成：

```txt
props.loading = true
  -> classes 中加入 ivu-btn-loading
  -> less 根據 .ivu-btn-loading 套用樣式
```

這種設計在元件庫中很常見。元件本身負責「狀態判斷」，樣式系統負責「視覺呈現」。

---

### 4.3 loading 對 children 的影響

當 `loading` 為 true 時，`Button` 會優先渲染 loading icon：

```js
h(Icon, {
    class: 'ivu-load-loop',
    type: 'ios-loading'
})
```

這裡有兩個重點。

第一，loading icon 使用固定的 `ios-loading`。也就是說，當按鈕進入 loading 狀態時，原本的 `icon` 或 `customIcon` 不再是主要資訊，載入中的 spinner 才是視覺焦點。

第二，loading icon 會加上 `ivu-load-loop` class。這個 class 通常用來讓 icon 產生旋轉動畫，使使用者能明確感覺到「正在處理中」。

因此如果使用者寫：

```vue
<Button icon="ios-search" loading>
  Search
</Button>
```

概念上應理解為：

```txt
loading 為 true
  -> 不顯示一般 icon
  -> 顯示 ios-loading spinner
  -> 文字仍然可以保留
```

---

### 4.4 loading 對樣式與互動的影響

`button.less` 中 loading 相關樣式大致如下：

```less
&&-loading {
    pointer-events: none;
    position: relative;

    &:before {
        display: block;
    }
}
```

這段樣式代表 loading 狀態至少有兩個效果。

| 樣式 | 作用 |
| --- | --- |
| `pointer-events: none` | 避免 loading 狀態下繼續用滑鼠觸發互動。 |
| `position: relative` | 讓內部 overlay 或 pseudo-element 可以相對定位。 |
| `&:before { display: block; }` | 顯示一層 loading 狀態使用的半透明遮罩。 |

這裡要特別注意：避免重複點擊的主要邏輯是在樣式層，而不是 `handleClickLink()` 裡面寫一段 `if (this.loading) return`。也就是說，runtime handler 本身不是 loading guard 的主要來源。

這種設計的優點是簡潔，因為只要 class 切換，視覺與 pointer 行為就會一起變化。但閱讀時也要知道：它和真正的原生 `disabled` 語意仍然不同。

---

### 4.5 loading 與測試的關係

`button.spec.js` 有驗證 loading 行為：click 後外部把 `loading` 改成 true，下一個 tick 中應該出現 `ivu-btn-loading`，並且只渲染一個 `ios-loading` icon。

這代表測試保護的是「外部狀態變化後，Button render 是否正確反映 loading」。

可以整理成：

```txt
click
  -> 外部 handler 修改 loading
  -> Vue re-render
  -> class 出現 ivu-btn-loading
  -> children 出現 ios-loading icon
```

這也提醒我們：`Button` 本身不會自動把 `loading` 從 false 改成 true。`loading` 是受控狀態，通常由外部業務邏輯控制。

---

## 5. Disabled 狀態與 Form disabled

### 5.1 disabled 不是只看自身 prop

`Button` render 時不是直接使用：

```js
this.disabled
```

而是使用：

```js
disabled: this.itemDisabled
```

`itemDisabled` 來自 `mixins/form.js`。整理的邏輯如下：

```js
itemDisabled () {
    let state = this.disabled;
    if (!state && this.FormInstance) state = this.FormInstance.disabled;
    return state ? true : null;
}
```

這代表 `Button` 的 disabled 狀態有兩個來源：

| 來源 | 優先順序 | 說明 |
| --- | --- | --- |
| `Button` 自己的 `disabled` prop | 第一優先 | 使用者直接在按鈕上設定禁用。 |
| 上層 `FormInstance.disabled` | 第二優先 | 若按鈕本身沒有 disabled，會讀取表單層級 disabled。 |

換句話說，`Button` 不是孤立的元件。它可以感知表單上下文，並配合整個表單進入禁用狀態。

---

### 5.2 itemDisabled 的判斷流程

可以把 `itemDisabled` 的判斷寫成流程：

```txt
先看 Button 自己是否 disabled
  -> 如果是 true，itemDisabled = true
  -> 如果不是 true，繼續看是否存在 FormInstance
      -> 如果 FormInstance.disabled 是 true，itemDisabled = true
      -> 否則 itemDisabled = null
```

這裡最值得注意的是最後回傳 `null`，而不是 `false`。

原因是 HTML 中很多布林 attribute 的語意不是靠值本身，而是靠 attribute 是否存在。例如：

```html
<button disabled="false">Click</button>
```

這在直覺上看起來像「沒有禁用」，但對 HTML 來說，`disabled` attribute 存在就可能產生禁用語意。因此在不需要 disabled 時回傳 `null`，可以避免 DOM 上出現不必要或誤導性的 attribute。

---

### 5.3 disabled 與 `<button>` / `<a>` 的差異

`Button` 可能輸出兩種 tag：

| 條件 | tag |
| --- | --- |
| 沒有 `to` | `<button>` |
| 有 `to` | `<a>` |

對 `<button>` 來說，`disabled` 是原生支援的 attribute。當 `<button disabled>` 存在時，瀏覽器會提供一部分原生禁用行為。

但對 `<a>` 來說，`disabled` 不是標準 anchor 禁用能力。即使 View UI Plus 把 disabled 相關 class 或 attribute 套到 `<a class="ivu-btn">` 上，也不能把它完全等同於原生 `<button disabled>`。

runtime click handler 本身沒有額外寫：

```js
if (this.itemDisabled) return;
```

因此閱讀時應該分成兩層：

| 層次 | 對 disabled 的理解 |
| --- | --- |
| `<button>` 原生層 | `disabled` attribute 有瀏覽器原生語意。 |
| `<a>` link button 層 | 主要依賴 class、樣式與元件設計；不能完全視為原生 disabled。 |

這個差異在實作業務功能時很重要。若一個 link button 在 disabled 狀態下仍有特殊導航風險，應該回頭確認實際 DOM、樣式與 click 行為是否符合預期。

---

## 6. Click handler：先 emit，再處理 navigation

### 6.1 handleClickLink 的基本流程

`Button` 的主要 click handler 是：

```js
handleClickLink (event) {
    this.$emit('click', event);
    const openInNewWindow = event.ctrlKey || event.metaKey;

    this.handleCheckClick(event, openInNewWindow);
}
```

這段程式碼可以拆成三步：

```txt
DOM click
  -> this.$emit('click', event)
  -> 判斷是否 Ctrl / Cmd click
  -> 呼叫 handleCheckClick(event, openInNewWindow)
```

這個順序非常重要，因為它表示 `Button` 會先把 click 事件交給使用者，再處理 link navigation。

---

### 6.2 為什麼要先 emit click？

先 emit click 的好處是，外部使用者不需要關心這顆按鈕最後是 `<button>` 還是 `<a>`，都可以用一致的方式監聽：

```vue
<Button @click="handleClick">
  Save
</Button>

<Button to="/profile" @click="trackClick">
  Profile
</Button>
```

這兩種寫法都能收到 click event。

對元件庫設計來說，這是一種一致性設計：

| 使用方式 | 使用者是否能監聽 click |
| --- | --- |
| 普通 button | 可以。 |
| link button | 可以。 |
| Ctrl / Cmd click | 仍然會先 emit click。 |
| `target="_blank"` | 仍然會先 emit click。 |

這讓使用者可以做統計、埋點、表單檢查或其他業務邏輯。

---

### 6.3 Ctrl / Cmd click 的判斷

`openInNewWindow` 的判斷是：

```js
const openInNewWindow = event.ctrlKey || event.metaKey;
```

其中：

| event 欄位 | 常見平台語意 |
| --- | --- |
| `ctrlKey` | Windows / Linux 常見的 Ctrl + click。 |
| `metaKey` | macOS 常見的 Command + click。 |

這個設計是為了讓自定義的 Button link 行為接近瀏覽器原生 `<a>` 的操作習慣。使用者在連結上按 Ctrl / Cmd click 時，通常期待用新分頁或新視窗開啟。

---

## 7. Link navigation 的來源：`mixins/link.js`

### 7.1 Button 自己不完整實作 navigation

在 `button.vue` 裡，navigation 的關鍵不是完整寫在 component 本身，而是委派給：

```js
this.handleCheckClick(event, openInNewWindow);
```

`handleCheckClick()` 來自 `mixins/link.js`。這也是閱讀 `Button` 時最容易漏掉的地方。

可以把分工整理成：

| 檔案 | 責任 |
| --- | --- |
| `button.vue` | 接收 click、emit click、判斷 Ctrl / Cmd click。 |
| `mixins/link.js` | 判斷是否有 `to`、處理 `target`、router navigation、window navigation。 |
| `mixins/form.js` | 提供 `itemDisabled`，讓 disabled 可受 Form 影響。 |

因此，若只讀 `button.vue`，會理解 click 的入口，但看不到完整 navigation 策略。

---

### 7.2 to 是 navigation 是否啟動的關鍵

`Button` 是否進入 link navigation，核心取決於 `to`。

| `to` 狀態 | 結果 |
| --- | --- |
| 沒有 `to` | 普通 button，不處理 navigation。 |
| 有 string `to` | 可能成為 URL 或 router path。 |
| 有 object `to` | 通常交給 router 當 route location 處理。 |

在 render 層，有 `to` 時 `Button` 會輸出 `<a>`；在事件層，有 `to` 時 click 才會進入 link navigation 檢查。

所以 `to` 同時影響兩個層面：

```txt
to
  -> render 層：決定 tagName 是否為 a
  -> event 層：決定 handleCheckClick 是否需要處理 navigation
```

---

## 8. `linkUrl` 與 `href`：渲染階段的連結資訊

### 8.1 linkUrl 的基本角色

`linkUrl` 來自 `mixins/link.js`，用來提供 `<a>` 的 `href`。

在 `Button` 的 `tagProps` 中，若是 link button，會輸出類似：

```js
{
    href: linkUrl,
    target
}
```

這表示 `linkUrl` 是 render 階段的資料，而不是 click 當下才出現的資料。

---

### 8.2 linkUrl 的判斷規則

整理的規則如下：

```txt
to 不是 string
  -> linkUrl = null

to 是 absolute URL，包含 //
  -> linkUrl = to

有 router
  -> router.resolve(to, current, append).href

沒有 router
  -> linkUrl = to
```

可以整理成表格：

| `to` 類型 / 情境 | `linkUrl` 結果 | 說明 |
| --- | --- | --- |
| `to` 不是 string | `null` | 例如 route object，render 階段不直接產出 href。 |
| `to` 是 absolute URL | `to` 本身 | 例如外部網址。 |
| `to` 是 string 且有 router | `router.resolve(...).href` | 讓 router 計算出對應 href。 |
| `to` 是 string 且沒有 router | `to` 本身 | 退回普通 URL/path。 |

這裡最值得注意的是 route object：

```vue
<Button :to="{ path: '/home' }">
  Home
</Button>
```

對非 string `to` 來說，`linkUrl` 可能是 `null`。這不代表它不能跳轉，而是 render 階段不一定直接生成 href；實際 navigation 會在 click 時交給 router 相關邏輯處理。

---

## 9. `handleCheckClick()`：navigation 的檢查入口

### 9.1 核心流程

`handleCheckClick()` 的核心流程整理成：

```txt
如果沒有 to
  -> 不處理 navigation

如果 target 是 _blank
  -> handleOpenTo()
  -> return false

其他情況
  -> event.preventDefault()
  -> handleClick(new_window)
```

這裡可以看到三個判斷重點。

第一，沒有 `to` 就不需要 navigation。這時 `Button` 只需要完成 click emit。

第二，`target="_blank"` 是特殊情況，會直接走 `handleOpenTo()`。

第三，其他 link button 會先 `event.preventDefault()`，避免瀏覽器使用 `<a href="...">` 的預設行為，改由元件內部的 `handleClick()` 接管跳轉策略。

---

### 9.2 為什麼要 preventDefault？

對 link button 來說，render 出 `<a>` 可以保留連結語意與 `href`，但若使用 Vue Router，實際跳轉通常希望由 router 控制，而不是讓瀏覽器整頁刷新。

因此在一般情況下，`handleCheckClick()` 會：

```txt
先阻止 anchor 預設跳轉
  -> 再依據 router / replace / absolute URL / new window 決定跳轉方式
```

這是 SPA 元件庫中常見的設計：外觀看起來像 `<a>`，但導航策略交給 router 或元件封裝。

---

## 10. `handleClick()`：實際跳轉策略

### 10.1 handleClick 的角色

`handleClick(new_window)` 來自 `mixins/link.js`，負責實際執行跳轉。

整理的分支如下：

| 條件 | 行為 |
| --- | --- |
| 非瀏覽器環境 | `isClient` guard，直接 return。 |
| `new_window` 為 true | 呼叫 `handleOpenTo()`。 |
| 有 router 且 `to` 是 absolute URL | `window.location.href = this.to`。 |
| 有 router 且 `to` 是 route location | `router.replace()` 或 `router.push()`。 |
| 沒有 router | `window.location.href = this.to`。 |

這張表可以看出，`Button` 的 navigation 策略其實同時考慮了四件事：

1. 目前是否在瀏覽器環境。
2. 是否要開新視窗。
3. 是否有 router。
4. `to` 是外部網址還是 router location。

---

### 10.2 router.push 與 router.replace

`replace` prop 主要影響 router navigation。

| `replace` | router 行為 | 使用語意 |
| --- | --- | --- |
| `false` | `router.push()` | 新增一筆瀏覽紀錄。 |
| `true` | `router.replace()` | 取代目前瀏覽紀錄。 |

例如：

```vue
<Button to="/login" replace>
  Login
</Button>
```

概念上表示跳轉到 `/login` 時，不希望使用者按上一頁回到目前頁面。

但要注意，`replace` 的主要意義是在 router navigation 分支中。如果沒有 router，最後可能退回 `window.location.href = this.to`，這時就不是 `router.replace()` 的語意。

---

### 10.3 absolute URL 與內部路由的差異

如果有 router 且 `to` 是 absolute URL，會使用：

```js
window.location.href = this.to
```

而不是交給 router。

這個分支的意義是：外部網址不應由 Vue Router 當成內部 route location 處理。若 `to` 指向外部網站，最合理的行為通常是交給瀏覽器跳轉。

可以分成：

| `to` 類型 | 適合處理者 |
| --- | --- |
| `/dashboard` | Vue Router。 |
| `{ name: 'dashboard' }` | Vue Router。 |
| `https://example.com` | 瀏覽器 / window location。 |

---

## 11. `target="_blank"` 與 Ctrl / Cmd click

### 11.1 兩種新視窗入口

有兩種情境會走新視窗邏輯。

第一種是明確設定 `target="_blank"`：

```vue
<Button to="/icon" target="_blank">
  Open
</Button>
```

這時 `handleCheckClick()` 會因為 `target === '_blank'` 呼叫 `handleOpenTo()`。

第二種是使用者按 Ctrl / Cmd click：

```txt
event.ctrlKey || event.metaKey
  -> openInNewWindow = true
  -> handleClick(true)
  -> handleOpenTo()
```

---

### 11.2 為什麼要支援 Ctrl / Cmd click？

因為 `Button` 在有 `to` 時雖然是元件庫按鈕，但使用者心理模型更接近「連結」。如果一個元件看起來像連結、行為像連結，它就應該盡量保留原生連結的常見操作習慣。

支援 Ctrl / Cmd click 的價值是：

- 使用者可以用熟悉方式開新分頁。
- 元件不會因為封裝而破壞瀏覽器慣用操作。
- `Button` 作為 link button 時更接近原生 `<a>` 的互動體驗。

---

## 12. 狀態與事件整合情境

### 12.1 普通操作按鈕

```vue
<Button type="primary" @click="save">
  Save
</Button>
```

流程：

```txt
沒有 to
  -> render 成 button
  -> click 時 emit click
  -> handleCheckClick() 發現沒有 to，不處理 navigation
```

這是最單純的操作按鈕。

---

### 12.2 loading 操作按鈕

```vue
<Button type="primary" :loading="saving" @click="save">
  Save
</Button>
```

流程：

```txt
saving = false
  -> 普通 button
  -> click emit click
  -> 外部 save() 將 saving 改成 true
  -> Button re-render
  -> 加上 ivu-btn-loading
  -> 顯示 ios-loading icon
  -> 樣式層限制 pointer interaction
```

重點是：`Button` 不會自己管理 saving 狀態；外部使用者要控制 `loading` prop。

---

### 12.3 Form disabled 影響 Button

```vue
<Form :disabled="true">
  <Button>Submit</Button>
</Form>
```

概念流程：

```txt
Button 自己 disabled 不是 true
  -> 讀取 FormInstance.disabled
  -> itemDisabled = true
  -> render 時輸出 disabled
```

這種設計讓表單可以整體進入禁用狀態，不必每顆按鈕都手動傳 `disabled`。

---

### 12.4 link button：內部路由

```vue
<Button to="/dashboard">
  Dashboard
</Button>
```

流程：

```txt
有 to
  -> render 成 a
  -> href 由 linkUrl 提供
  -> click 時先 emit click
  -> handleCheckClick() preventDefault
  -> handleClick(false)
  -> 有 router 時走 router.push 或 router.replace
```

這種情境是 SPA 中最常見的 link button。

---

### 12.5 link button：新視窗

```vue
<Button to="/dashboard" target="_blank">
  Dashboard
</Button>
```

流程：

```txt
有 to
  -> render 成 a
  -> click 時先 emit click
  -> handleCheckClick() 發現 target 是 _blank
  -> handleOpenTo()
```

如果使用者沒有設定 `target="_blank"`，但用 Ctrl / Cmd click，也可能進入類似的新視窗流程。

---

## 13. 官方測試對應

`button.spec.js` 和本章有關的測試主要保護以下行為。

| 測試 | 對應理解 |
| --- | --- |
| `should render as <a>` | 只要有 `to`，`Button` 應輸出 anchor。 |
| `should render as <button>` | 沒有 `to` 時，`Button` 應輸出 button。 |
| `handle with type attribute` | `htmlType` 只應用在 `<button>`，link button 不輸出原生 `type` attribute。 |
| `should change loading state` | click 可以觸發外部 handler 改變 loading，render 應切換到 loading class 與 loading icon。 |

這些測試覆蓋了 `Button` 最核心、最容易壞掉的行為：tag 切換、原生 type attribute、loading render。

不過，測試沒有完整覆蓋所有 navigation 分支，例如：

- route object。
- `target="_blank"`。
- Ctrl / Cmd click。
- `replace` 對 router navigation 的影響。
- absolute URL 與 router URL 的差異。

因此在閱讀原始碼時，不應把測試檔當成完整規格文件。測試能告訴你哪些行為被保護，但沒有測到的分支仍然需要回到 source code 確認。

---

## 14. 常見誤區

| 誤區 | 正確理解 |
| --- | --- |
| `loading` 就是另一種 `disabled` | `loading` 有自己的 class、icon、overlay 與 pointer 行為，不等於 disabled。 |
| `disabled` 只看 `Button` 自己的 prop | `itemDisabled` 還會讀取 `FormInstance.disabled`。 |
| `Button` click 只負責 `$emit` | click 會先 emit，再交給 link mixin 檢查 navigation。 |
| 有 `to` 時仍然是 `<button>` | 有 `to` 時會渲染成 `<a>`。 |
| `htmlType` 對 link button 也有效 | `htmlType` 只在非 link button 時輸出成原生 `type` attribute。 |
| route object 一定會直接生成 href | 非 string `to` 的 `linkUrl` 可能是 `null`，click 時再走 router。 |
| `target="_blank"` 和 Ctrl / Cmd click 是兩套完全無關的邏輯 | 兩者最後都可能導向 `handleOpenTo()`。 |
| `replace` 對所有跳轉方式都有效 | `replace` 主要影響 router navigation 的 `replace()` / `push()` 選擇。 |
| `<a disabled>` 等同 `<button disabled>` | `<a>` 沒有標準 disabled 語意，不能完全等同。 |

---

## 15. 建議閱讀路線

若要重新閱讀這一組原始碼，建議按照以下順序。

### 15.1 第一輪：先看 Button 的互動入口

先讀 `src/components/button/button.vue` 中與互動有關的部分：

1. `props` 中的 `loading`、`disabled`、`htmlType`。
2. `mixins: [ mixinsLink, mixinsForm ]`。
3. `classes` computed 對 `loading` 的處理。
4. `tagName` / `tagProps` 對 `to` 與 `htmlType` 的處理。
5. `handleClickLink(event)`。
6. render function 中 `disabled: this.itemDisabled` 與 `onClick: this.handleClickLink`。

這一輪的目標是先知道事件從哪裡進入。

---

### 15.2 第二輪：追 link mixin

接著讀 `src/mixins/link.js`：

1. `to`、`replace`、`target`、`append` props。
2. `linkUrl` computed。
3. `handleCheckClick()`。
4. `handleClick(new_window)`。
5. `handleOpenTo()`。

這一輪的目標是補上 `Button` 自己沒有直接寫完的 navigation 策略。

---

### 15.3 第三輪：追 form mixin

再讀 `src/mixins/form.js`：

1. `FormInstance` 如何取得。
2. `itemDisabled` 如何合併自身與 Form disabled。
3. 為什麼回傳 `true` 或 `null`。

這一輪的目標是理解 `Button` 為什麼會受到表單上下文影響。

---

### 15.4 第四輪：回到 less 與 test

最後讀：

- `src/styles/components/button.less`
- `src/styles/mixins/button.less`
- `test/unit/specs/button.spec.js`

這一輪的目標是確認 runtime 狀態如何被樣式消化，以及哪些行為被測試保護。

---

## 16. 本章總結

`Button` 的狀態與事件流程由三個層次共同完成。

第一層是 `button.vue`。它負責接收 click、emit click、判斷 Ctrl / Cmd click，並把 navigation 交給 `handleCheckClick()`。它也負責根據 `loading`、`disabled`、`to` 等資料產生 DOM、class 與 children。

第二層是 `mixins/link.js`。它提供 `to`、`target`、`replace`、`append`、`linkUrl` 與 navigation methods，讓 `Button` 可以從普通操作按鈕延伸成 link button，並支援 router、absolute URL、新視窗與 Ctrl / Cmd click。

第三層是 `mixins/form.js` 與樣式系統。`mixins/form.js` 讓 `Button` 可以受到上層 `Form` disabled 狀態影響；`button.less` 則負責 loading、disabled、overlay、pointer behavior 等視覺與互動呈現。

讀懂這一章後，`Button` 就不再只是「一顆會變色的按鈕」，而是一個整合操作、表單上下文、連結導航與狀態回饋的基礎元件。

---

## 17. 自我檢查問題

1. `loading` 會同時影響哪些輸出？請至少說出 class、children 與樣式層行為。
2. 為什麼不能把 `loading` 直接理解成 `disabled`？
3. `itemDisabled` 的判斷順序是什麼？
4. 為什麼 `itemDisabled` 在不禁用時回傳 `null`，而不是回傳 `false`？
5. `<button disabled>` 和 `<a disabled>` 的語意差異是什麼？
6. `handleClickLink()` 的執行順序是什麼？
7. 為什麼 `Button` 要先 `$emit('click', event)`，再處理 link navigation？
8. `to` 同時影響 render 層與 event 層，分別是什麼？
9. `linkUrl` 對非 string `to` 為什麼可能是 `null`？
10. `handleCheckClick()` 什麼時候會呼叫 `event.preventDefault()`？
11. `target="_blank"` 和 Ctrl / Cmd click 分別如何進入新視窗邏輯？
12. `replace` prop 在什麼情境下才有主要作用？
13. `button.spec.js` 保護了哪些與本章有關的行為？又有哪些 navigation 分支沒有完整覆蓋？

---

## 18. 後續延伸方向

這份筆記後續可以再拆成幾個更深入的主題。

### 18.1 `mixins/link.js` 獨立解析

可以獨立整理一篇筆記，專門分析 `mixins/link.js` 的 public props、computed、methods 與使用者情境。因為這個 mixin 不只可能服務 `Button`，也可能影響其他具有 link 能力的元件。

### 18.2 `mixins/form.js` 與表單上下文

可以進一步研究 `Form` / `FormItem` 如何透過上下文影響子元件，例如 disabled、validation、change event 等。這有助於理解元件庫如何設計表單系統。

### 18.3 `Button` 的可及性檢查

後續可以針對 link button、disabled anchor、loading 狀態是否需要 `aria-disabled`、`aria-busy` 等方向做專門分析。

### 18.4 Router navigation 測試補強

現有測試沒有完整覆蓋 route object、`target="_blank"`、Ctrl / Cmd click 等分支。後續可以練習為這些情境補 unit tests，將閱讀原始碼轉化為測試設計能力。

### 18.5 與其他元件的互動模式比較

可以比較 `Button`、`MenuItem`、`Cell` 等支援 link 行為的元件，觀察它們是否使用類似 mixin，以及 public props / render / navigation 是否一致。這有助於建立 View UI Plus 的共用設計模式地圖。
