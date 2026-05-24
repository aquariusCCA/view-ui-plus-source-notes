# View UI Plus Cell / CellGroup：Render、樣式、箭頭與全域設定

## 1. 本章定位

本章是一篇 **Render / Style / Arrow / Global Config 對照筆記**，目標是幫助你理解 `View UI Plus` 的 `Cell` 如何把 props、slots、link 狀態與全域設定轉成實際畫面。

本章要解決的問題是：

1. `Cell` 的根 class 是如何由 `disabled`、`selected`、`to` 決定的。
2. 有 `to` 與沒有 `to` 時，render branch、wrapper、arrow 與 footer positioning 有什麼差異。
3. `CellItem` 為什麼能讓 title、label、extra、icon 的 DOM 結構保持穩定。
4. `cell.less` 與 `.select-item()` mixin 分別負責哪些樣式。
5. `#arrow` slot、`$VIEWUI.cell.arrow`、`$VIEWUI.cell.customArrow`、`$VIEWUI.cell.arrowSize` 的優先關係是什麼。
6. 為什麼 `.d.ts` 只能告訴你 public shape，不能取代閱讀 runtime 與 Less。

本章不重複展開 `Cell` 的 click flow、`provide / inject`、router navigation 與 ctrl / meta click。那些內容應放在 `03-click-link-and-provide-inject-flow.md` 中閱讀。

---

## 2. 學習前先建立的基本觀念

在閱讀 `Cell` 的 render 與 style 前，需要先建立四個基本觀念。

### 2.1 Runtime 不直接等於畫面結果

`cell.vue` 負責產生 DOM、class 與 slot 結構，但畫面最後長什麼樣子，還要看 Less。舉例來說，`cell.vue` 只會根據 `selected` 產生 `ivu-cell-selected` class；真正的背景色、文字色、label 顏色、footer 顏色，是由樣式檔接手處理。

因此閱讀元件庫時，不應只看 Vue template。template 只能回答「會輸出哪些 DOM 與 class」，不能完整回答「畫面為什麼這樣顯示」。

### 2.2 Class 是 runtime 與 style 的契約

`Cell` 的 props 不會直接產生視覺效果，而是先轉成 class。例如：

- `disabled=true` 轉成 `ivu-cell-disabled`。
- `selected=true` 轉成 `ivu-cell-selected`。
- `to` 有值轉成 `ivu-cell-with-link`。

這些 class 就像 runtime 交給 style layer 的訊號。Less 只要根據這些 class 寫規則，就能控制 disabled、selected、with-link 等狀態的視覺結果。

### 2.3 Slot fallback 是元件庫常見的彈性設計

`Cell` 同時支援 props 與 slots。例如 `title` prop 可以顯示標題，但 default slot 也可以覆蓋標題位置。這種設計可以讓簡單使用者直接傳文字，進階使用者則用 slot 放更複雜的節點。

在本章中，`#arrow` slot 是最特別的 slot，因為它不是轉發給 `CellItem`，而是留在 `Cell` 本身控制右側箭頭區域。

### 2.4 全域設定不是單一元件 prop

`Cell` 的箭頭可以透過 `$VIEWUI.cell` 全域設定控制。這代表 arrow 的預設 icon 並不是每個 `Cell` 自己的 prop，而是元件庫 install options / global property 層級的能力。

這種設計適合元件庫提供「全站一致預設值」。例如整個系統想統一更換列表箭頭 icon，就不需要每個 `<Cell>` 都手動傳入設定。

---

## 3. 整體概覽

`Cell` 的畫面生成可以整理成以下流程：

```txt
Cell props / slots / globalConfig
  -> computed classes
       -> ivu-cell
       -> ivu-cell-disabled
       -> ivu-cell-selected
       -> ivu-cell-with-link
  -> render branch
       -> 有 to：<a class="ivu-cell-link">
       -> 無 to：<div class="ivu-cell-link">
  -> CellItem layout
       -> icon / main / title / label / footer / extra
  -> optional arrow
       -> #arrow slot
       -> default Icon(type/custom/size)
  -> styles
       -> cell.less：結構、footer、arrow、selected 補充規則
       -> select.less：padding、hover、disabled、selected 共用規則
```

這條線可以幫你把 `Cell` 拆成三個層面來讀。

第一層是 **runtime layer**。它負責把 props、slots、globalConfig 轉成 DOM、class 與 computed 值。

第二層是 **style layer**。它負責解釋這些 class 的視覺意義，例如 padding、hover、disabled、selected、footer 與 arrow 定位。

第三層是 **public contract layer**。它由 `.d.ts` 與實際 export 決定，告訴使用者哪些 props、slots、global options 是可依賴的，哪些元件只是內部實作。

---

## 4. 核心內容逐步講解

### 4.1 從 props 到 root class

`Cell` 的根 class 由 computed `classes` 產生。原始碼邏輯可以整理成：

```js
classes () {
    return [
        `${prefixCls}`,
        {
            [`${prefixCls}-disabled`]: this.disabled,
            [`${prefixCls}-selected`]: this.selected,
            [`${prefixCls}-with-link`]: this.to
        }
    ];
}
```

這段程式碼的重點不是語法，而是設計方式：`Cell` 不在 JavaScript 裡直接控制樣式，而是透過 class 把狀態交給 CSS / Less。

| 條件 | 產生的 class | 代表意義 | 後續交給誰處理 |
| --- | --- | --- | --- |
| 固定存在 | `ivu-cell` | 每一列 Cell 的基礎樣式入口 | `cell.less` 與 `.select-item()` |
| `disabled=true` | `ivu-cell-disabled` | disabled 視覺狀態 | `.select-item()` |
| `selected=true` | `ivu-cell-selected` | selected 視覺狀態 | `.select-item()` 與 `cell.less` selected 規則 |
| `to` 有值 | `ivu-cell-with-link` | 代表這列有 link 與 arrow | `cell.less` 的 footer / arrow positioning |

這裡要特別注意：`disabled`、`selected`、`with-link` 都不是內部 state，而是由外部 props 或 link 狀態直接決定。`Cell` 沒有自己的 active state、focused state 或 checked state。

### 4.2 `to` 決定 render branch

`Cell` 會根據 `to` 決定中間 wrapper。

有 `to` 時，使用 `<a>`：

```vue
<a
    v-if="to"
    :href="linkUrl"
    :target="target"
    class="ivu-cell-link">
    <CellItem ... />
</a>
```

沒有 `to` 時，使用 `<div>`：

```vue
<div class="ivu-cell-link" v-else>
    <CellItem ... />
</div>
```

這個分支有三層效果。

第一，DOM wrapper 不同。有 `to` 時是 `<a>`，沒有 `to` 時是 `<div>`。

第二，arrow 是否渲染不同。有 `to` 時會渲染 `.ivu-cell-arrow`，沒有 `to` 時不會顯示 arrow。

第三，根 class 不同。有 `to` 時會產生 `ivu-cell-with-link`，讓 footer 右移，替 arrow 留出位置。

| 條件 | Wrapper | 是否有 arrow | 根節點是否有 `ivu-cell-with-link` | 閱讀重點 |
| --- | --- | --- | --- | --- |
| 有 `to` | `<a>` | 有 | 有 | 同時影響 navigation 與視覺排版 |
| 無 `to` | `<div>` | 無 | 無 | 仍使用同一個 `CellItem` 內容結構 |

這也是閱讀 `Cell` 時最重要的分界：`to` 不是單純的導頁參數，它也會改變渲染結構與樣式布局。

### 4.3 `CellItem` 提供穩定的內部展示骨架

不論 `Cell` 最外層是 `<a>` 還是 `<div>`，內部都會渲染同一個 `CellItem`。`CellItem` 固定輸出以下結構：

```txt
ivu-cell-item
  ivu-cell-icon
  ivu-cell-main
    ivu-cell-title
    ivu-cell-label
  ivu-cell-footer
    ivu-cell-extra
```

這個結構把一列 Cell 拆成左、中、右三個主要區域。

| 區域 | class | 內容來源 | 責任 |
| --- | --- | --- | --- |
| Icon | `ivu-cell-icon` | `#icon` slot | 顯示標題左側 icon |
| Main | `ivu-cell-main` | title / label 區域 | 放主要文字內容 |
| Title | `ivu-cell-title` | default slot 或 `title` prop | 顯示主標題 |
| Label | `ivu-cell-label` | `#label` slot 或 `label` prop | 顯示副描述 |
| Footer | `ivu-cell-footer` | extra 區域容器 | 把右側內容定位到右邊 |
| Extra | `ivu-cell-extra` | `#extra` slot 或 `extra` prop | 顯示右側附加內容 |

這樣設計的好處是：`Cell` 可以專心處理 public props、link、click、arrow 與 class；`CellItem` 則專心維持內部展示結構。

從元件作者視角來看，這是一種很常見的拆分：public component 負責對外能力，internal component 負責穩定的 DOM layout。

### 4.4 `cell.less` 定義結構定位

`cell.less` 對 `CellItem` 的各個區塊提供具體視覺規則。例如：

| Selector | 樣式重點 | 教學理解 |
| --- | --- | --- |
| `.ivu-cell-icon` | `inline-block`、右距、空內容隱藏 | icon 是可選區塊，沒有 slot 時不應佔位 |
| `.ivu-cell-main` | `inline-block`、`vertical-align: middle` | main 內容和其他 inline 區塊垂直對齊 |
| `.ivu-cell-title` | `line-height: 24px`、基礎字級 | 控制主標題的行高與基本文字樣式 |
| `.ivu-cell-label` | 小字級、次要文字色 | 表示 label 是描述性輔助資訊 |
| `.ivu-cell-footer` | absolute 定位、垂直置中、預設 `right: 16px` | extra 不跟 main 一起流動，而是固定貼右 |
| `.ivu-cell-extra` | 位於 footer 內 | 承接 extra prop 或 slot 的內容 |

最需要注意的是 `.ivu-cell-footer` 使用 absolute positioning。這代表 footer 不在一般文件流中，不會自然把 main 內容往左擠開。若 extra 內容過長，可能會造成視覺重疊或壓縮感，這不是 runtime 會自動解決的問題，而是使用者在內容設計上要注意。

### 4.5 Footer 與 Arrow 的定位關係

有 `to` 時，`Cell` 會額外渲染 arrow：

```vue
<div class="ivu-cell-arrow" v-if="to">
    <slot name="arrow">
        <Icon :type="arrowType" :custom="customArrowType" :size="arrowSize" />
    </slot>
</div>
```

Less 中 footer 與 arrow 的定位邏輯可以簡化成：

```less
&-footer {
    position: absolute;
    top: 50%;
    right: 16px;
    transform: translateY(-50%);
}

&-with-link &-footer {
    right: 32px;
}

&-arrow {
    position: absolute;
    top: 50%;
    right: 16px;
    transform: translateY(-50%);
}
```

整理如下：

| 狀態 | Footer 位置 | Arrow 位置 | 設計目的 |
| --- | --- | --- | --- |
| 無 `to` | `right: 16px` | 不渲染 | extra 可以靠近右側 |
| 有 `to` | `right: 32px` | `right: 16px` | extra 往左讓位，避免和 arrow 重疊 |

這裡的關鍵 class 是 `ivu-cell-with-link`。它不是直接控制 arrow，而是讓 footer 因為「有 link / 有 arrow」而右移。

### 4.6 Arrow 的來源優先序

箭頭內容有兩層來源。

第一層是使用者提供的 `#arrow` slot：

```vue
<template #arrow>
    <!-- 自訂箭頭內容 -->
</template>
```

只要提供 `#arrow` slot，預設的 `<Icon>` 就會被整個覆蓋。

第二層是預設 `<Icon>`：

```vue
<Icon :type="arrowType" :custom="customArrowType" :size="arrowSize" />
```

這三個值由 computed 取得，背後讀的是 `$VIEWUI.cell` 全域設定。

優先序可以整理成：

```txt
有 #arrow slot
  -> 使用 slot 內容
  -> 不使用預設 Icon

沒有 #arrow slot
  -> 使用預設 Icon
      -> customArrow 優先
      -> arrow 次之
      -> arrowSize 控制 size
      -> 都沒有設定時，使用預設 ios-arrow-forward 與 Icon 預設大小
```

| 優先層級 | 來源 | 結果 |
| --- | --- | --- |
| 1 | `#arrow` slot | 覆蓋整個 arrow 內容 |
| 2 | `$VIEWUI.cell.customArrow` | 傳給 `Icon` 的 `custom`，並清空 `type` |
| 3 | `$VIEWUI.cell.arrow` | 傳給 `Icon` 的 `type` |
| 4 | 預設值 | `ios-arrow-forward` |
| 補充 | `$VIEWUI.cell.arrowSize` | 傳給 `Icon` 的 `size` |

這裡要特別注意：`customArrow` 與 `arrow` 不是並列同時生效。當 `customArrow` 存在時，`arrowType` 會被清空，避免 `Icon` 同時吃到一般 icon type 與 custom icon。

### 4.7 `$VIEWUI.cell` 全域設定來源

`Cell` 混入 `globalConfig`，在 created 階段從 app context 取出：

```js
created () {
    const instance = getCurrentInstance();
    this.globalConfig = instance.appContext.config.globalProperties.$VIEWUI;
}
```

install 時則建立 `$VIEWUI.cell`：

```js
app.config.globalProperties.$VIEWUI = {
    cell: {
        arrow: opts.cell ? opts.cell.arrow ? opts.cell.arrow : '' : '',
        customArrow: opts.cell ? opts.cell.customArrow ? opts.cell.customArrow : '' : '',
        arrowSize: opts.cell ? opts.cell.arrowSize ? opts.cell.arrowSize : '' : ''
    }
}
```

Type declaration 也描述了 install options 的形狀：

```ts
cell?: {
    arrow: string;
    customArrow: string;
    arrowSize: number | string;
};
```

這說明 arrow 設定屬於元件庫全域選項，而不是 `<Cell>` 本身的 prop。

如果從使用者角度理解，這代表你可以用兩種方式改 arrow：

1. 單一 `Cell` 客製：使用 `#arrow` slot。
2. 全站預設調整：使用 install options 裡的 `cell.arrow`、`cell.customArrow`、`cell.arrowSize`。

前者適合局部客製，後者適合系統層級統一風格。

### 4.8 Arrow computed 規則

`arrowType` 的邏輯可以翻譯成：

```txt
預設使用 ios-arrow-forward
如果有 globalConfig.cell.customArrow
  -> type 清空
否則如果有 globalConfig.cell.arrow
  -> type 改成 cell.arrow
```

對照表如下：

| 全域設定狀態 | `arrowType` | `customArrowType` | 說明 |
| --- | --- | --- | --- |
| 無 `$VIEWUI.cell` 設定 | `ios-arrow-forward` | `''` | 使用預設 icon type |
| 設定 `cell.arrow` | `cell.arrow` | `''` | 改用指定內建 icon |
| 設定 `cell.customArrow` | `''` | `cell.customArrow` | 改用 custom icon，並清空一般 type |
| 設定 `cell.arrowSize` | 不影響 type | 不影響 custom | 只影響傳給 `Icon` 的 size |

`arrowSize` 的規則相對單純：有全域設定就傳給 `Icon`，沒有就回傳空字串，讓 `Icon` 自己使用預設大小。

### 4.9 Link visual rules

`cell.less` 對 `.ivu-cell-link` 的規則很簡單：

```less
&-link,
&-link:hover,
&-link:active {
    color: inherit;
}
```

這段的目的，是避免 `<a>` 使用瀏覽器預設連結樣式，例如藍色文字或 active 狀態變色。

也就是說，`Cell` 雖然在有 `to` 時使用 `<a>`，但它不希望畫面看起來像一般超連結。它仍然希望看起來像列表行，hover、selected、disabled 這些視覺狀態都交給 `.ivu-cell` 與 `.select-item()` 控制。

### 4.10 `.select-item()` mixin 補上列表行共用規則

`cell.less` 最後呼叫了 `.select-item()`：

```less
.select-item(@cell-prefix-cls, @cell-prefix-cls);
```

`@cell-prefix-cls` 對應到：

```less
@cell-prefix-cls: ~"@{css-prefix}cell";
```

因此 mixin 會針對 `.ivu-cell` 產生列表項共用規則。

| Mixin 規則 | 對 `Cell` 的效果 | 為什麼重要 |
| --- | --- | --- |
| padding | 產生每列內距 | 解釋為什麼 `cell.less` 上半段看不到 padding，但畫面仍有 spacing |
| cursor | 讓 `Cell` 看起來可點擊 | 讓列表行具備互動感 |
| transition | hover 背景有過渡 | 增加互動細緻度 |
| hover | 滑過時背景變化 | 統一 item hover 規則 |
| disabled | disabled 顏色與 cursor | 形成 disabled 視覺，但不阻止 runtime click |
| selected | selected 文字色 | 與 `cell.less` 的 selected 背景規則搭配 |

這也是為什麼讀樣式時不能只搜尋 `.ivu-cell` 在 `cell.less` 上方的規則。部分真正影響畫面的規則是由 mixin 展開產生的。

### 4.11 Selected 的視覺邊界

`selected` 會產生 `ivu-cell-selected` class。樣式層除了使用 `.select-item()` 的 selected 規則外，`cell.less` 又補了幾條 selected 專屬規則：

```less
&-selected &-label {
    color: inherit;
}

&-selected,
&&-selected:hover {
    background: ~`colorPalette("@{primary-color}", 1)`;
}

&-selected &-footer {
    color: inherit;
}

&-selected:focus {
    background: shade(@selected-color, 10%);
}
```

這些規則的效果是：

1. selected 背景變成 primary color 的淺色。
2. label 不再維持次要灰色，而是繼承 selected 狀態的文字色。
3. footer 也繼承 selected 狀態的文字色。
4. focus 時背景再變深。

不過，`selected` 仍然只是視覺狀態。它不會：

- 自動在 click 後切換。
- 通知 `CellGroup` 哪一列被選中。
- 新增 ARIA selected attribute。
- 建立受控或非受控的選取模型。

如果要做真正的選中狀態管理，需要由外部資料控制 `selected` prop。

### 4.12 Disabled 的視覺與行為差異

`disabled` 會產生 `ivu-cell-disabled` class，樣式主要由 `.select-item()` 處理。其效果大致是：

- 文字變成 disabled color。
- cursor 變成 disabled cursor。
- hover 時不套一般 hover 背景。

但 runtime 的 click handler 沒有因為 `disabled` 而 return，所以 disabled 不會阻止：

- `CellGroup` 收到 `on-click`。
- link navigation。
- `handleClickItem()` 執行。

這是閱讀 `Cell` 時非常容易誤解的地方。很多元件的 `disabled` 會同時控制視覺與行為，但這裡從原始碼來看，`disabled` 的直接效果主要在視覺層。

所以若你的使用場景需要「disabled 時完全不可點」，你必須在外部 handler 或包裝層自行處理。

### 4.13 Type declaration 與 runtime 細節落差

`.d.ts` 可以告訴你 `Cell` 有哪些 props / slots，例如：

```txt
disabled?: boolean
selected?: boolean
to?: string | object
target?: '_blank' | '_self' | '_parent' | '_top'
v-slots.arrow
```

但 `.d.ts` 無法完整告訴你這些 API 的 runtime 與 style 細節。

| `.d.ts` 可看到的資訊 | `.d.ts` 看不到的資訊 |
| --- | --- |
| `disabled` 是 boolean | disabled 不阻止 click |
| `selected` 是 boolean | selected 不建立內部選取狀態 |
| `to` 可以是 string / object | `to` 會讓 wrapper 變 `<a>`，並使 footer 右移 |
| 有 `arrow` slot | `arrow` slot 會覆蓋整個預設 `Icon` |
| 有 global `cell.arrow` shape | `customArrow` 會讓 `arrowType` 清空 |

因此閱讀元件庫時，`.d.ts` 適合先建立 public API 地圖，但不能取代 runtime 與 style source。

---

## 5. 表格整理

### 5.1 檔案與責任分工表

| 檔案 / 模組 | 負責職責 | 閱讀重點 |
| --- | --- | --- |
| `src/components/cell/cell.vue` | 產生 root class、`to` render branch、arrow、slot forwarding、global config computed | 先看 `classes`、`to` branch、arrow slot、computed rules |
| `src/components/cell/cell-item.vue` | 提供 icon、main、title、label、footer、extra 的內部展示結構 | 它是 internal layout，不是 public API |
| `src/styles/components/cell.less` | 定義 Cell 結構、footer、arrow、selected 補充樣式 | 注意 footer / arrow absolute positioning |
| `src/styles/mixins/select.less` | 補上 item padding、hover、disabled、selected 共用規則 | 不讀這個檔案會漏掉大量列表行視覺規則 |
| `src/mixins/globalConfig.js` | 從 `appContext.config.globalProperties.$VIEWUI` 讀全域設定 | arrow computed 的資料來源 |
| `src/index.js` | install 時建立 `$VIEWUI.cell` 預設設定 | 理解 `cell.arrow/customArrow/arrowSize` 從哪裡來 |
| `types/index.d.ts` | 描述 install options 裡的 `cell` 設定 | 只能描述 shape，不能描述 computed 優先序 |
| `types/cell.d.ts` | 描述 `Cell` props、slots 與相關型別 | 建立 public contract，但不能取代 source 閱讀 |

### 5.2 Render branch 對照表

| 條件 | Wrapper | `href` | `target` | Arrow | Footer 位置 | 視覺意義 |
| --- | --- | --- | --- | --- | --- | --- |
| 無 `to` | `<div>` | 無 | 無 | 無 | `right: 16px` | 一般列表行 |
| 有 `to` | `<a>` | `linkUrl` | `target` | 有 | `right: 32px` | 可導頁列表行 |

### 5.3 Arrow 優先序表

| 情境 | 使用內容 | 說明 |
| --- | --- | --- |
| 使用者提供 `#arrow` slot | slot 內容 | 完全覆蓋預設 `Icon` |
| 未提供 slot，且設定 `customArrow` | `<Icon custom="...">` | `arrowType` 會清空 |
| 未提供 slot，且設定 `arrow` | `<Icon type="...">` | 使用全域指定 icon type |
| 未提供 slot，也無全域設定 | `<Icon type="ios-arrow-forward">` | 使用預設箭頭 |
| 設定 `arrowSize` | 傳入 `Icon size` | 控制預設 Icon 大小，不影響 slot |

### 5.4 State class 邊界表

| Prop / 條件 | 產生 class | 視覺效果 | 不負責的事情 |
| --- | --- | --- | --- |
| `disabled` | `ivu-cell-disabled` | disabled 色彩、disabled cursor、hover 視覺調整 | 不阻止 click、不阻止 navigation |
| `selected` | `ivu-cell-selected` | selected 背景、label/footer 繼承 selected 色彩 | 不自動切換、不管理選中狀態 |
| `to` | `ivu-cell-with-link` | footer 右移、顯示 arrow | 不代表 navigation 一定成功，只代表有 link 分支 |

---

## 6. 範例或情境說明

### 6.1 一般文字 Cell

```vue
<Cell title="帳戶設定" extra="已完成" />
```

這種情境沒有 `to`，所以 wrapper 是 `<div class="ivu-cell-link">`，不會渲染 arrow。`extra` 會進入 `CellItem` 的 `.ivu-cell-extra`，並透過 `.ivu-cell-footer` 定位在右側。

### 6.2 可導頁 Cell

```vue
<Cell title="個人資料" to="/profile" extra="編輯" />
```

這種情境因為有 `to`，所以：

1. wrapper 變成 `<a>`。
2. 根節點多出 `ivu-cell-with-link`。
3. 右側顯示 arrow。
4. footer 從 `right: 16px` 變成 `right: 32px`，避免和 arrow 重疊。

從閱讀角度看，這個例子最能說明 `to` 同時影響 DOM、class、style 與 navigation。

### 6.3 局部自訂 arrow

```vue
<Cell title="更多設定" to="/settings">
    <template #arrow>
        <span>›</span>
    </template>
</Cell>
```

這種情境中，`#arrow` slot 會覆蓋整個預設 `Icon`。也就是說，即使全域設定有 `cell.arrow` 或 `cell.customArrow`，這個 Cell 的箭頭區域仍以 slot 內容為準。

### 6.4 全域調整 arrow

以下只是概念示意，實際寫法需以專案中的 View UI Plus 安裝方式為準：

```js
app.use(ViewUIPlus, {
    cell: {
        arrow: 'ios-arrow-forward',
        customArrow: '',
        arrowSize: 16
    }
});
```

這種方式適合統一調整整個系統中所有 `Cell` 的預設箭頭。它不需要每個 `<Cell>` 都寫 `#arrow` slot。

---

## 7. 閱讀路線或學習路線

第一次閱讀本章相關 source 時，建議按照以下順序。

1. 先讀 `cell.vue` 的 `classes` computed，確認 `disabled`、`selected`、`to` 會產生哪些 class。
2. 再讀 `cell.vue` 的 template，觀察 `to` 如何切換 `<a>` 與 `<div>`，以及 arrow 只在有 `to` 時渲染。
3. 接著讀 `cell-item.vue`，把 icon、title、label、extra、footer 的 DOM 骨架記起來。
4. 再讀 `cell.less`，對照 `CellItem` 的 class 如何被定位與排版，尤其是 footer 與 arrow。
5. 接著讀 `mixins/select.less`，補齊 padding、hover、disabled、selected 這些共用 item 規則。
6. 再讀 `globalConfig.js` 與 `src/index.js`，理解 `$VIEWUI.cell` 如何建立。
7. 最後讀 `types/index.d.ts` 與 `types/cell.d.ts`，回頭確認 public API shape 與 runtime 細節之間的落差。

如果只是初步理解，可以先跳過 Less 中較細的顏色變數與 `colorPalette()` 實作。那些屬於樣式系統更深層的主題，可以放到後續獨立筆記。

---

## 8. 常見誤區

| 誤區 | 為什麼容易誤解 | 正確理解 |
| --- | --- | --- |
| 以為 `to` 只影響導頁 | `to` 常被視為 router 參數 | 在 `Cell` 中，`to` 同時影響 wrapper、arrow、`ivu-cell-with-link` 與 footer positioning |
| 以為 `disabled` 會阻止 click | 許多元件庫的 disabled 都會阻止行為 | 這裡從 runtime 來看，disabled 主要產生樣式 class，不阻止 `handleClickItem()` |
| 以為 `selected` 是內部狀態 | `selected` 名稱看起來像可選中狀態 | 它只是外部傳入的視覺 prop，不會自動切換 |
| 只看 `cell.less` 就以為看完樣式 | Cell 樣式檔名稱很明確，容易忽略 mixin | padding、hover、disabled、selected 的部分規則來自 `.select-item()` |
| 以為 arrow 是 `Cell` prop | 箭頭看起來是 Cell 自己的配置 | arrow 來自 `#arrow` slot 或 `$VIEWUI.cell` 全域設定，不是 `Cell` own prop |
| 以為 `.d.ts` 可以理解全部行為 | Type declaration 很適合查 API | `.d.ts` 不描述 render branch、Less positioning、computed 優先序與 disabled 行為邊界 |
| 以為 `CellItem` 是可公開使用的元件 | 它有獨立 `.vue` 檔 | 它是 internal layout，真正 public component 是 `Cell` 與 `CellGroup` |

---

## 9. 本章總結

`Cell` 的畫面生成不是單一檔案完成的，而是一條跨越 runtime、style、mixin、global config 與 type declaration 的鏈條。

在 runtime 層，`cell.vue` 根據 `disabled`、`selected`、`to` 產生 class，並根據 `to` 決定使用 `<a>` 或 `<div>`。不論哪個 branch，內容骨架都交給 `CellItem`，所以 title、label、extra、icon 的 DOM 結構保持穩定。

在 style 層，`cell.less` 負責 icon、main、label、footer、arrow 的定位與 selected 補充規則；`.select-item()` 則補上 padding、hover、disabled、selected 等列表項共用樣式。這說明閱讀樣式時不能只看元件自己的 Less 檔，也要追到 mixin。

在 arrow 層，使用者可以透過 `#arrow` slot 局部覆蓋箭頭，也可以透過 `$VIEWUI.cell.arrow`、`$VIEWUI.cell.customArrow`、`$VIEWUI.cell.arrowSize` 調整全域預設。優先序上，slot 最高，`customArrow` 會優先於 `arrow`，預設值則是 `ios-arrow-forward`。

最後，`.d.ts` 能幫助你快速掌握 public API，但它無法完整描述 runtime 和 style 的細節。對元件庫原始碼閱讀來說，最好的方式是把 `.vue`、`.less`、mixin、install options、type declaration 一起讀，才不會把視覺狀態誤解成完整行為控制。

---

## 10. 自我檢查問題

1. `Cell` 的根 class 由哪些條件決定？請說明 `disabled`、`selected`、`to` 分別會產生什麼 class。
2. 有 `to` 與沒有 `to` 時，`Cell` 的 wrapper、arrow、footer positioning 有什麼差異？
3. 為什麼 `CellItem` 可以被理解成 internal layout component，而不是 public API？
4. `.ivu-cell-footer` 使用 absolute positioning 會帶來什麼閱讀重點？
5. 有 link 時，footer 的 `right` 為什麼要從 `16px` 變成 `32px`？
6. `#arrow` slot、`$VIEWUI.cell.customArrow`、`$VIEWUI.cell.arrow`、預設 `ios-arrow-forward` 的優先序是什麼？
7. `customArrow` 為什麼會讓 `arrowType` 變成空字串？
8. `Cell` 的 padding、hover、disabled 視覺主要來自哪個 Less mixin？
9. `selected` 在這個元件中做了哪些事，又沒有做哪些事？
10. 為什麼只看 `types/cell.d.ts` 無法理解 disabled 與 arrow 的完整行為？

---

## 11. 後續延伸方向

這份筆記後續可以拆成以下延伸主題：

1. **`Cell` click flow 與 link mixin 深入分析**：完整分析 `handleClickItem()`、`handleCheckClick()`、router、`target="_blank"`、ctrl / meta click。
2. **View UI Plus Less 架構與 mixin 系統**：整理 `select.less`、變數、色彩函數與共用 item 樣式如何被多個元件重用。
3. **元件庫 global config 設計模式**：分析 `$VIEWUI` 如何提供全域預設值，以及這種設計和 props / provide / app config 的差異。
4. **Slot fallback 設計筆記**：以 `Cell` 的 title、label、extra、arrow 為例，整理元件庫如何同時支援簡單 props 與進階 slots。
5. **Type declaration 與 runtime 對照方法**：建立一套閱讀 `.d.ts`、`.vue`、`.less`、example 的流程，避免只靠型別理解元件行為。
6. **List item component 設計模式**：從 `Cell` 延伸比較 MenuItem、SelectOption、DropdownItem 等列表行元件的 class、state、disabled 與 selected 設計。
