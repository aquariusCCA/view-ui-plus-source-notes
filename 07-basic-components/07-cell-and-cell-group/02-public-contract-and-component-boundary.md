# View UI Plus Cell / CellGroup：Public Contract 與 Component Boundary 教材型筆記

## 1. 本章定位

本章是一篇 **public contract 與 component boundary 對照筆記**，目標是幫助你理解 `View UI Plus` 的 `Cell / CellGroup` 元件到底對外承諾了什麼，又把哪些細節藏在內部實作中。

在元件庫中，「看得到某個 `.vue` 檔案」不代表它就是 public API。真正能被使用者穩定依賴的內容，通常要同時看幾個來源：

1. 是否在 component registry 對外匯出。
2. 是否有對應的 type declaration。
3. 是否被官方 example 或文件當成使用方式。
4. 是否只是某個 public component 內部使用的 layout helper。

本章的重點不是逐行分析 `handleClickItem()`，也不是深入 `router.push()`、`router.replace()` 或 `_blank` 的處理細節。那些屬於 click、link 與 navigation flow，應該放到後續的流程筆記中分析。本章只回答一個核心問題：

> 從使用者角度看，`Cell / CellGroup` 哪些能力是 public contract？從作者角度看，哪些部分只是內部結構與實作細節？

讀完本章後，你應該能回答以下問題：

1. `CellGroup`、`Cell`、`CellItem` 的元件邊界分別是什麼。
2. `Cell` 對外可用的 props 來自哪些來源。
3. `Cell` 的 slots 如何和 props 形成 fallback 關係。
4. 為什麼 `CellItem` 不應被視為 public component。
5. `disabled` 與 `selected` 在這組元件中真正負責什麼。
6. `.d.ts` 和 runtime 行為不完全精準一致時，應該如何閱讀。

---

## 2. 學習前先建立的基本觀念

### 2.1 Public Contract 是什麼

在元件庫裡，public contract 指的是「使用者可以合理依賴的對外介面」。對 Vue component 來說，常見的 public contract 包含：

| 類型 | 說明 | 在 `Cell / CellGroup` 中的例子 |
| --- | --- | --- |
| Props | 使用者可以傳入的參數 | `title`、`label`、`extra`、`disabled`、`selected`、`to` |
| Slots | 使用者可以覆蓋或插入的內容區域 | default、`icon`、`label`、`extra`、`arrow` |
| Events | 元件對外發出的事件 | `CellGroup` 的 `on-click` |
| Type declaration | TypeScript 使用者看到的型別契約 | `types/cell.d.ts` |
| Export entry | 是否被正式對外匯出 | `Cell`、`CellGroup` 是 public，`CellItem` 不是 |

理解 public contract 的目的是避免把內部細節當成可依賴 API。元件庫未來改版時，public API 通常需要保持相容；但 internal component、DOM 結構、CSS class 細節或 helper component，可能會比較容易被重構。

### 2.2 Component Boundary 是什麼

Component boundary 指的是元件之間的責任分界。它回答的是：

1. 哪個元件負責接收使用者輸入？
2. 哪個元件負責輸出事件？
3. 哪個元件只是排版？
4. 哪些資料會跨元件傳遞？
5. 哪些元件不應該直接溝通？

對 `Cell / CellGroup` 來說，邊界非常清楚：

```txt
使用者
  -> <CellGroup @on-click>
      -> <Cell name title label extra to selected disabled>
          -> <CellItem title label extra>
```

這個結構代表：

- `CellGroup` 面向使用者，提供群組容器與事件輸出。
- `Cell` 面向使用者，承接 item 層級的 props、slots、click、link 與 class。
- `CellItem` 面向 `Cell`，只負責把 title、label、extra、icon 排成固定 DOM 結構。

### 2.3 Fallback Slot 是什麼

`Cell` 的 title、label、extra 同時支援 prop 與 slot。這種設計通常代表：

- prop 是簡單文字場景的快速寫法。
- slot 是進階內容場景的自訂寫法。
- 如果提供 slot，slot 會取代對應 prop 的顯示位置。

例如：

```vue
<Cell title="基本標題" />
```

適合純文字標題。

```vue
<Cell>
  <strong>自訂標題內容</strong>
</Cell>
```

適合自訂 DOM 結構。此時 default slot 會進入 title 位置，而不是和 `title` prop 合併顯示。

---

## 3. 整體概覽

`Cell / CellGroup` 可以被理解成一組小型列表 item 系統。它不是完整的 Menu，也不是完整的 List selection manager，而是提供一個「可點擊、可顯示右側資訊、可導頁、可被 group 收集 click」的 item component。

從責任上看，可以分成五層：

| 層級 | 主要檔案 / 來源 | 責任 |
| --- | --- | --- |
| Public container | `cell-group.vue` | 提供群組容器、`provide` 自己、對外 emit `on-click`。 |
| Public item | `cell.vue` | 接收 item props / slots，處理 click、link branch、arrow、class。 |
| Internal layout | `cell-item.vue` | 渲染 icon、title、label、extra 的固定展示結構。 |
| Shared behavior | `mixins/link.js` | 補上 `to`、`replace`、`target`、`append` 等 link props 與 navigation 行為。 |
| Type contract | `types/cell.d.ts` | 描述 `Cell` / `CellGroup` 的 TypeScript 對外型別。 |

這裡最重要的觀念是：`Cell` 的完整 public contract 不是只看 `cell.vue` 的 `props` 區塊就能得到。因為 `Cell` 混入了 `mixins/link.js`，所以 link props 也是 `Cell` 使用者可以傳入的 public props。

換句話說，閱讀 Vue Options API 元件時，要特別注意：

```js
mixins: [ mixinsLink, globalConfig ]
```

這行代表元件能力被外部 mixin 擴充了。若只讀 component 本身，會漏掉一部分 contract。

---

## 4. 核心內容逐步講解

### 4.1 `CellGroup`：public container 與 event output

`CellGroup` 是 public component。它的 template 本身很簡單：

```vue
<div class="ivu-cell-group">
    <slot></slot>
</div>
```

從畫面結構來看，它只是包住一組 `Cell`。但從 runtime 行為來看，它還有兩個重要責任：

1. 透過 `provide()` 把自己提供給子層 `Cell`。
2. 透過 `handleClick(name)` 對外 emit `on-click`。

可以把 `CellGroup` 想成一個「事件中繼站」。子層 `Cell` 被點擊後，不是自己直接對外發出 group event，而是呼叫父層 `CellGroupInstance.handleClick(this.name)`，再由 `CellGroup` 對外 emit。

這種設計的好處是：所有 item 的 click 都會集中到 group 層輸出，使用者可以在 `CellGroup` 上統一監聽。

```vue
<CellGroup @on-click="handleClick">
  <Cell name="profile" title="個人資料" />
  <Cell name="setting" title="設定" />
</CellGroup>
```

此時使用者通常不需要在每個 `Cell` 上都綁定 click，而是集中處理 group 的 `on-click`。

#### `CellGroup` 的 public contract

| 類型 | 內容 |
| --- | --- |
| Props | 無 |
| Slots | default slot，用來放置 `Cell` |
| Events | `on-click` |
| Event payload | runtime 上是子 `Cell` 的 `name` |

需要注意的是，`.d.ts` 中的 `onOnClick?: (event?: any) => any` 並沒有精準表達 payload 其實是 `name`。因此在這裡閱讀時要以 runtime 行為為準。

---

### 4.2 `Cell`：public item 與主要對外介面

`Cell` 是使用者真正大量使用的 item component。它同時負責三類事情：

1. 接收使用者傳入的 props。
2. 接收使用者提供的 slots。
3. 根據是否有 `to` 決定是否進入 link branch。

`Cell` 自身宣告的 props 包含：

| Runtime prop | Runtime 限制 / default | Type declaration | 閱讀重點 |
| --- | --- | --- | --- |
| `name` | `String` 或 `Number` | `name?: string \| number` | 點擊時傳給 `CellGroup on-click` 的識別值。 |
| `title` | `String`，預設 `''` | `title?: string` | 傳給 `CellItem` 的標題 fallback。 |
| `label` | `String`，預設 `''` | `label?: string` | 傳給 `CellItem` 的描述 fallback。 |
| `extra` | `String`，預設 `''` | `extra?: string` | 傳給 `CellItem` 的右側額外內容 fallback。 |
| `disabled` | `Boolean`，預設 `false` | `disabled?: boolean` | 產生 `ivu-cell-disabled` class，但不阻止 click。 |
| `selected` | `Boolean`，預設 `false` | `selected?: boolean` | 產生 `ivu-cell-selected` class，但不建立內部選取狀態。 |

這張表有兩個閱讀重點。

第一，`name` 是事件識別值。它不控制畫面顯示，而是在點擊時回傳給 `CellGroup`。

第二，`disabled` 和 `selected` 是樣式輸入，不是行為控制器。也就是說，`disabled` 不等於「不能點」，`selected` 也不等於「內部已選取」。它們只會影響 class，最後由 CSS 決定視覺結果。

---

### 4.3 Link mixin：`Cell` 的 public props 不只寫在 `cell.vue`

`Cell` 混入 `mixins/link.js`，因此它還支援 link props：

| Mixin prop | Runtime 限制 / default | Type declaration | 閱讀重點 |
| --- | --- | --- | --- |
| `to` | `Object` 或 `String` | `to?: string \| object` | 有值時切換成 link branch，顯示 arrow，點擊會導頁。 |
| `replace` | `Boolean`，預設 `false` | `replace?: boolean` | router navigation 使用 `replace` 而不是 `push`。 |
| `target` | `_blank`、`_self`、`_parent`、`_top`，預設 `_self` | target union | `_blank` 時走新視窗開啟邏輯。 |
| `append` | `Boolean`，預設 `false` | `append?: boolean` | 傳給 router resolve 相關流程。 |

這裡是閱讀元件庫原始碼時非常關鍵的地方：

> public props 不一定全部寫在該元件的 `props` 區塊中，mixin 也可能提供使用者可傳入的 props。

因此，如果你只看 `cell.vue`，你會誤以為 `Cell` 只有 `name`、`title`、`label`、`extra`、`disabled`、`selected`。但實際上，對使用者來說，`to`、`replace`、`target`、`append` 也屬於 `Cell` 的可用 API。

---

### 4.4 `Cell` Slots：props 是 fallback，slots 是自訂內容

`Cell` 的 slots 大多會轉發給 `CellItem`。default、`icon`、`label`、`extra` 會進入 `CellItem`，只有 `arrow` 留在 `Cell` 自己處理。

| Slot | 對應 fallback prop | Runtime 位置 | 閱讀重點 |
| --- | --- | --- | --- |
| default | `title` | `CellItem` 的 `.ivu-cell-title` | 覆蓋標題內容。 |
| `icon` | 無 | `CellItem` 的 `.ivu-cell-icon` | 標題左側 icon 區。空內容時 CSS 隱藏。 |
| `label` | `label` | `CellItem` 的 `.ivu-cell-label` | 覆蓋描述內容。 |
| `extra` | `extra` | `CellItem` 的 `.ivu-cell-extra` | 覆蓋右側額外內容。 |
| `arrow` | 全域 arrow / 預設 icon | `Cell` 的 `.ivu-cell-arrow` | 只在有 `to` 時渲染，覆蓋整個右側箭頭內容。 |

slot forwarding 的核心結構如下：

```vue
<CellItem :title="title" :label="label" :extra="extra">
    <template #icon><slot name="icon"></slot></template>
    <template #default><slot></slot></template>
    <template #extra><slot name="extra"></slot></template>
    <template #label><slot name="label"></slot></template>
</CellItem>
```

這段程式碼可以讀出一個重要設計：

```txt
使用 prop
  -> 快速填入純文字內容

使用 slot
  -> 覆蓋該區域，改用自訂內容
```

因此，props 和 slots 的關係不是「加總顯示」，而是 fallback 關係。這對閱讀 UI component 非常重要，因為很多元件庫都會採用這種模式。

---

### 4.5 `CellItem`：internal layout，不是 public component

`CellItem` 的 template 固定分成 icon、main、footer 三個區域：

```vue
<div class="ivu-cell-item">
    <div class="ivu-cell-icon">
        <slot name="icon"></slot>
    </div>
    <div class="ivu-cell-main">
        <div class="ivu-cell-title"><slot>{{ title }}</slot></div>
        <div class="ivu-cell-label"><slot name="label">{{ label }}</slot></div>
    </div>
    <div class="ivu-cell-footer">
        <span class="ivu-cell-extra"><slot name="extra">{{ extra }}</slot></span>
    </div>
</div>
```

整理成表格：

| 區塊 | Class | 內容來源 |
| --- | --- | --- |
| Icon | `ivu-cell-icon` | `#icon` slot |
| Title | `ivu-cell-title` | default slot 或 `title` prop |
| Label | `ivu-cell-label` | `#label` slot 或 `label` prop |
| Extra | `ivu-cell-footer` / `ivu-cell-extra` | `#extra` slot 或 `extra` prop |

`CellItem` 沒有 `emits`、沒有 computed、沒有 methods。它只是讓 `Cell` 的展示結構可以被拆開維護。

這裡要特別注意：`CellItem` 雖然是 `.vue` 元件，但它不是使用者應該直接依賴的 public component。判斷原因有三個：

1. 它只被 `Cell` 用來組織內部 DOM。
2. 它沒有列入 public contract summary。
3. 它沒有在對外 export 中成為使用者可直接使用的元件。

因此，學習原始碼時可以理解它；但實作專案時，不應該把它當成 View UI Plus 對外承諾的穩定 API。

---

### 4.6 Provide / Inject：`CellGroup` 與 `Cell` 的父子通訊邊界

`CellGroup` 提供自己：

```js
provide () {
    return {
        CellGroupInstance: this
    }
}
```

`Cell` 注入父層 instance：

```js
inject: ['CellGroupInstance']
```

點擊時，`Cell` 會呼叫：

```js
handleClickItem (event, new_window) {
    this.CellGroupInstance.handleClick(this.name);
    this.handleCheckClick(event, new_window);
}
```

這段邏輯說明了兩件事。

第一，`CellGroup` 與 `Cell` 之間存在父子通訊。`Cell` 並不是完全孤立的 item，它會期待父層能提供 `CellGroupInstance`。

第二，`CellItem` 不參與這個通訊。它只是展示結構，不 inject、不 emit、不知道 group 存在。

這裡沒有 fallback，也沒有 optional inject。也就是說，從 runtime 角度看，`Cell` 預期放在 `CellGroup` 之內。如果脫離 `CellGroup` 使用並觸發 click，就有 `this.CellGroupInstance.handleClick` 的風險。

這個觀察非常重要，因為它提醒我們：元件是否能單獨使用，不能只看它是不是 public component，還要看 runtime 是否假設某個父層存在。

---

### 4.7 State Boundary：`selected` 與 `disabled` 不是狀態管理

`Cell` 有 `selected` 和 `disabled`，但這不代表它內建選取狀態或禁用行為。這兩個 prop 的 runtime 行為如下：

| Prop | Runtime 行為 | 不做的事 |
| --- | --- | --- |
| `selected` | 產生 `ivu-cell-selected` class | 不在 click 後自動切換、不通知 group 選取變化 |
| `disabled` | 產生 `ivu-cell-disabled` class | 不阻止 click、不阻止 group emit、不阻止 navigation |

這代表 `Cell` 是一個偏展示型、外部控制型的 item component。它不負責管理「目前選中哪一列」，也不負責在 disabled 時自動中斷所有互動。

如果使用者要做到真正的選取管理，應該由外部 state 控制：

```vue
<CellGroup @on-click="current = $event">
  <Cell
    name="profile"
    title="個人資料"
    :selected="current === 'profile'"
  />
  <Cell
    name="setting"
    title="設定"
    :selected="current === 'setting'"
  />
</CellGroup>
```

如果使用者要做到 disabled 時完全不可點擊，也需要在外部 handler 中判斷，或確認實際 runtime 是否提供其他阻止機制。`disabled` 在這裡主要是 class 與視覺狀態，不應被誤讀成完整行為封鎖。

---

### 4.8 Type Declaration：`.d.ts` 是 contract 文件，但仍要對照 runtime

`types/cell.d.ts` 的價值在於提供 TypeScript 使用者能看到的 public surface。它會告訴你：

- `Cell` 有哪些 props。
- `Cell` 有哪些 slots。
- `CellGroup` 有哪些 listener。
- 使用者在 TS / IDE 中能取得哪些提示。

不過，type declaration 不一定百分之百精準描述 runtime 細節。

```txt
CellGroup 的 .d.ts 使用 onOnClick?: (event?: any) => any
但 runtime 實際 payload 是 name
```

這種情況在元件庫中並不少見。閱讀時應該採取以下順序：

1. 先看 `.d.ts`，快速建立 public API 地圖。
2. 再看 runtime source，確認實際行為。
3. 如果 `.d.ts` 和 runtime 有落差，記下落差，避免只信其中一邊。

對學習者來說，這是很好的訓練：你不只是讀「文件」，而是在對照「型別承諾」和「真實執行行為」。

---

## 5. 表格整理

### 5.1 Component Boundary 總表

| 元件 | 使用者是否直接使用 | Public / Internal | 主要責任 | 是否參與事件流 |
| --- | --- | --- | --- | --- |
| `CellGroup` | 是 | Public | 提供群組容器、provide instance、emit `on-click` | 是，對外 emit |
| `Cell` | 是 | Public | 接收 props / slots、處理 click、link、arrow、class | 是，呼叫 group 並處理 link |
| `CellItem` | 否 | Internal | 渲染 icon、title、label、extra 的固定展示結構 | 否 |

閱讀這張表時，要特別留意 public 和 internal 的差異。`CellItem` 雖然是元件，但它的角色更接近 `Cell` 的內部 layout helper。

### 5.2 `Cell` Public Props 總表

| Props 類型 | Props | 來源 | 對外意義 |
| --- | --- | --- | --- |
| Identity | `name` | `cell.vue` | 點擊後傳給 `CellGroup on-click` |
| Content fallback | `title`、`label`、`extra` | `cell.vue` | 提供簡單文字內容 |
| Visual state | `disabled`、`selected` | `cell.vue` | 產生 class，交給 CSS 呈現狀態 |
| Link behavior | `to`、`replace`、`target`、`append` | `mixins/link.js` | 讓 `Cell` 具備導頁能力 |

這張表說明 `Cell` 的 props 不是單一來源，而是 component 自身與 mixin 組合後形成的 public contract。

### 5.3 Slots 與 Fallback 對照表

| Slot | Fallback prop | 所在元件 | 是否屬於 `CellItem` | 補充說明 |
| --- | --- | --- | --- | --- |
| default | `title` | `CellItem` | 是 | 進入 title 區域 |
| `icon` | 無 | `CellItem` | 是 | 進入左側 icon 區域 |
| `label` | `label` | `CellItem` | 是 | 進入描述文字區域 |
| `extra` | `extra` | `CellItem` | 是 | 進入右側額外內容區域 |
| `arrow` | 全域 arrow / 預設 icon | `Cell` | 否 | 只在 link branch 中處理 |

`arrow` 是這張表中最容易被忽略的例外。它沒有轉發給 `CellItem`，因為 arrow 的出現與 `to`、link branch、全域設定有關，屬於 `Cell` 本身的行為。

### 5.4 State Boundary 對照表

| Prop | 看起來像什麼 | 實際上負責什麼 | 不負責什麼 |
| --- | --- | --- | --- |
| `selected` | 選取狀態 | 加上 selected class | 不管理目前選中項、不自動切換 |
| `disabled` | 禁用狀態 | 加上 disabled class | 不阻止 click、不阻止 emit、不阻止 navigation |

這張表是本章最重要的實務提醒。很多 UI 元件的 prop 名稱會讓人直覺以為它具備完整行為，但在原始碼中它可能只是樣式輸入。

---

## 6. 範例或情境說明

### 6.1 使用 props 的簡單場景

```vue
<CellGroup @on-click="handleClick">
  <Cell
    name="profile"
    title="個人資料"
    label="查看與修改個人資訊"
    extra="已完成"
  />
</CellGroup>
```

這種寫法使用 `title`、`label`、`extra` prop，適合內容都是純文字的場景。`Cell` 會把這些 prop 轉交給 `CellItem`，由 `CellItem` 放到 title、label、extra 對應區塊中。

### 6.2 使用 slot 的自訂內容場景

```vue
<Cell name="notice">
  <template #icon>
    <Icon type="ios-notifications" />
  </template>

  <span>通知中心</span>

  <template #extra>
    <Badge :count="3" />
  </template>
</Cell>
```

這種寫法使用 slot 取代 prop fallback。default slot 會進入 title 區域，`#icon` 會進入左側 icon 區域，`#extra` 會進入右側 extra 區域。

### 6.3 使用 link props 的導頁場景

```vue
<CellGroup>
  <Cell
    name="button"
    title="Button 元件"
    to="/components/button"
  />
</CellGroup>
```

當 `to` 有值時，`Cell` 會進入 link branch，並顯示 arrow。這個 `to` 不是 `cell.vue` 自身 props 區塊提供的，而是來自 `mixins/link.js`。

### 6.4 外部控制 selected 的場景

```vue
<CellGroup @on-click="current = $event">
  <Cell
    name="basic"
    title="基本資料"
    :selected="current === 'basic'"
  />
  <Cell
    name="security"
    title="安全設定"
    :selected="current === 'security'"
  />
</CellGroup>
```

這個例子表達了正確的 state boundary：`Cell` 不會自己記住誰被選中，選中狀態由外部資料 `current` 控制，再透過 `selected` prop 回灌到對應 `Cell`。

---

## 7. 閱讀路線或學習路線

### 7.1 初次閱讀路線

第一次閱讀本章相關原始碼時，建議按照下面順序：

1. 先讀 `types/cell.d.ts`，建立 `Cell` / `CellGroup` 對外 contract 的粗略地圖。
2. 再讀 `cell-group.vue`，理解 group 的 slot、provide 與 `on-click`。
3. 接著讀 `cell.vue` 的 props、mixins、inject 與 template branch。
4. 再讀 `cell-item.vue`，確認 `Cell` 轉發 slots 後實際進入哪些 DOM 區塊。
5. 回頭對照 `types/cell.d.ts`，標記 type declaration 和 runtime 的差異。
6. 最後再把 `disabled`、`selected`、`to`、`arrow` 等行為分別歸類到樣式、link 或 group event。

這個順序能幫助你先建立對外 API，再理解內部組裝方式。

### 7.2 深入閱讀路線

如果你已經理解 component boundary，可以進一步閱讀：

1. `mixins/link.js`：理解 `to`、`replace`、`target`、`append` 的 navigation 行為。
2. `cell.less`：理解 `ivu-cell-disabled`、`ivu-cell-selected`、`ivu-cell-with-link` 最後如何影響畫面。
3. `globalConfig.js` 與 install 設定：理解 arrow 預設設定與全域設定來源。
4. 官方 example：對照 props、slots、link、selected、disabled 的實際展示方式。

### 7.3 可以暫時跳過的部分

第一次讀這一章時，可以先暫時跳過：

1. router navigation 的完整時序。
2. ctrl / meta click、新視窗開啟等細節。
3. `cell.less` 中過細的 selector。
4. install options 中與 cell arrow 以外的全域設定。

這些內容不是不重要，而是更適合放到後續「click / link flow」或「style system」筆記中拆開分析。

---

## 8. 常見誤區

| 誤區 | 為什麼容易誤解 | 正確理解 |
| --- | --- | --- |
| 只看 `cell.vue` 的 props，就以為那是完整 API | 初學者常把 component 本身的 `props` 區塊等同於所有可用 props | `Cell` 還混入 `mixins/link.js`，所以 `to`、`replace`、`target`、`append` 也是 public props |
| 以為 `CellItem` 可以直接拿來用 | 它是 `.vue` 檔案，而且有明確 template | 它是 internal layout，不是 public component，不應被使用者直接依賴 |
| 以為 `disabled` 會阻止點擊 | 一般 UI 語意中 disabled 通常代表不可互動 | runtime 只加 class，不阻止 click、emit 或 navigation |
| 以為 `selected` 會自動管理選取狀態 | selected 看起來像 state | 它只加 class，不會在 click 後自動切換，也不通知 group |
| 以為 slot 和 prop 會一起顯示 | prop 和 slot 都能描述同一區域內容 | 在這裡 prop 是 fallback，slot 會覆蓋對應顯示位置 |
| 以為 `.d.ts` 一定精準描述 runtime payload | TypeScript declaration 看起來像正式 contract | `onOnClick?: (event?: any) => any` 沒有精準表達 runtime payload 是 `name`，仍要對照 source |
| 以為 public component 一定能完全獨立使用 | `Cell` 有 public export，因此容易以為可 standalone | click handler 期待 `CellGroupInstance`，脫離 `CellGroup` 使用會有風險 |

---

## 9. 本章總結

`Cell / CellGroup` 的 public contract 不只是幾個 props 的集合，而是一套由 component、mixin、slots、event、type declaration 共同組成的對外介面。

`CellGroup` 是群組容器，負責提供父層 instance，並將子 `Cell` 的點擊轉成 `on-click(name)` 對外輸出。它本身不管理 selected，也不改寫子項 props。

`Cell` 是主要 public item，負責接收 `name`、`title`、`label`、`extra`、`disabled`、`selected` 等自身 props，也透過 `mixins/link.js` 接收 `to`、`replace`、`target`、`append` 等 link props。它還負責把 default、`icon`、`label`、`extra` slots 轉發給 `CellItem`，並自行處理 `arrow` slot。

`CellItem` 是 internal layout。它存在的目的不是提供使用者直接使用，而是穩定 `Cell` 內部的 DOM 結構，讓 icon、title、label、extra 可以有清楚的展示位置。

本章最重要的工程觀念是：閱讀元件庫時，要分清楚「對外承諾」和「內部實作」。public component、mixin props、slot fallback、type declaration、runtime behavior 必須一起看，才能真正理解一個元件的邊界。

---

## 10. 自我檢查問題

1. `CellGroup` 對外提供哪些 contract？它有 props 嗎？
2. `Cell` 自身宣告的 props 有哪些？哪些是內容 fallback？哪些是視覺狀態？
3. `Cell` 的 link props 來自哪裡？為什麼不能只看 `cell.vue`？
4. default slot 在 `CellItem` 中進入哪個位置？它和 `title` prop 是什麼關係？
5. `#arrow` slot 為什麼不是轉發給 `CellItem`？
6. `CellItem` 為什麼應該被視為 internal layout，而不是 public component？
7. `CellGroup` 的 `on-click` runtime payload 是什麼？`.d.ts` 是否精準描述了它？
8. `selected` 在 runtime 中會做什麼？不會做什麼？
9. `disabled` 在 runtime 中會做什麼？不會做什麼？
10. 如果 `Cell` 脫離 `CellGroup` 使用並被點擊，會有什麼風險？

---

## 11. 後續延伸方向

這份筆記之後可以延伸成以下主題：

1. **Click / Link / Provide-Inject Flow 分析**  
   深入分析 `Cell` 被點擊後，如何先回報 `CellGroup`，再進入 link navigation。

2. **`mixins/link.js` 導頁邏輯分析**  
   拆解 `to`、`replace`、`target`、`append`、`router.resolve()`、新視窗開啟等細節。

3. **Cell Style System 分析**  
   分析 `ivu-cell-selected`、`ivu-cell-disabled`、`ivu-cell-with-link`、`.ivu-cell-arrow` 等 class 如何影響畫面。

4. **Type Declaration 與 Runtime 對照筆記**  
   專門比較 `types/cell.d.ts` 與實際 runtime source 的一致與落差。

5. **元件庫 Public / Internal Boundary 通用閱讀法**  
   從 `CellItem` 的案例延伸，整理如何判斷一個 component 是否屬於 public API。

6. **受控元件與非受控元件的狀態邊界**  
   以 `selected` 為例，說明為什麼某些 UI 元件只接收外部 state，而不自己管理內部選取狀態。

---

## 12. 本章重點速記

```txt
CellGroup
  -> public container
  -> provide CellGroupInstance
  -> emit on-click(name)

Cell
  -> public item
  -> own props: name / title / label / extra / disabled / selected
  -> mixin props: to / replace / target / append
  -> slots: default / icon / label / extra / arrow

CellItem
  -> internal layout
  -> only render icon / title / label / extra
  -> no emit / no inject / no public contract

核心觀念
  -> props 與 slots 是 fallback 關係
  -> disabled / selected 主要是視覺 class
  -> .d.ts 要和 runtime 對照閱讀
  -> public contract 不只來自單一 .vue 檔案
```
