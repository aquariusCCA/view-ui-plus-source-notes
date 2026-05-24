# Basic Components `$VIEWUI` 全域設定影響筆記：閱讀入口與橫向地圖

## 1. 本章定位

這篇筆記是 `$VIEWUI` 全域設定在 `07-basic-components/` 中的「閱讀入口、章節索引與橫向地圖」。它不是單一元件分析，也不是完整的 plugin system 教學，而是用來回答以下問題：

1. 為什麼 `$VIEWUI` 要獨立成一個目錄來讀？
2. 在基礎元件範圍內，哪些元件真的會讀 `$VIEWUI`？
3. `$VIEWUI.size`、`$VIEWUI.transfer`、`$VIEWUI.cell` 分別影響哪些元件與行為？
4. 閱讀這組筆記時，應該優先看哪些 source path？
5. 哪些結論已由 runtime source 確認，哪些不能過度推論？

讀完本章後，讀者應該能建立一個基本心智模型：

```txt
$VIEWUI 不是 UI 元件
$VIEWUI 不是命令式 API
$VIEWUI 是 plugin install 階段放到 app.config.globalProperties 的全域設定容器
只有實際讀取它的元件，才會受到它影響
```

本章不深入展開每個設定造成的細部畫面差異。例如 `Button` 的 class 如何產生、`Avatar` 的 inline style 何時出現、`AvatarList` 的 `Tooltip` 何時渲染、`Cell` 的 arrow icon 如何計算，這些會留到後續專題筆記處理。

---

## 2. 學習前先建立的基本觀念

### 2.1 `$VIEWUI` 是 runtime config container，不是元件

在 View UI Plus 中，`$VIEWUI` 比較適合理解成「全域預設設定容器」。使用者在安裝 plugin 時傳入 options，例如：

```js
app.use(ViewUIPlus, {
  size: 'large',
  transfer: true,
  cell: {
    arrow: 'ios-arrow-forward'
  }
});
```

plugin install 流程會把這些 options 整理成 `$VIEWUI`，掛到 Vue app 的 `globalProperties` 上。這代表 `$VIEWUI` 不是畫面上的元件，也不是像 `$Message`、`$Modal` 那樣直接呼叫後產生 UI 的命令式服務。它本身不渲染任何 DOM，也不主動改變畫面。

真正造成畫面或行為差異的是「元件在 runtime 讀取 `$VIEWUI`」。如果某個元件沒有讀 `$VIEWUI`，那麼即使 `$VIEWUI` 裡有相關 key，也不代表該元件會被影響。

### 2.2 全域預設值不等於覆蓋 local prop

閱讀 `$VIEWUI` 時最容易犯的錯，是把「全域預設值」理解成「全域強制覆蓋」。實際上，像 `Button`、`ButtonGroup`、`Avatar` 這些元件會在 `size` prop 的 default 中讀 `$VIEWUI.size`。這代表它只在使用者沒有明確傳入 `size` prop 時生效。

可以把它理解成以下優先序：

```txt
使用者明確傳入 prop
  -> 使用 local prop

使用者沒有傳入 prop
  -> 執行 prop default
  -> default 內部讀取 $VIEWUI
  -> 若 $VIEWUI 有設定，就使用全域預設
  -> 若 $VIEWUI 沒設定，就回到元件自己的 local default
```

因此，`$VIEWUI` 是 fallback，不是 override。這個觀念會貫穿整組筆記。

### 2.3 type declaration 描述的是 public shape，不等於 runtime 消費點

`types/index.d.ts` 可以告訴我們使用者在 TypeScript 層面可以傳入哪些 options，例如 `size`、`transfer`、`cell.arrow` 等。但型別宣告只回答「可以傳什麼」，不回答「哪些元件真的使用」。

要確認某個 key 是否真的影響某個元件，必須回到 runtime source 檢查：

```txt
src/index.js
  -> 是否建立該 key

src/components/*
  -> 是否讀取該 key

component render / computed / props default
  -> 讀取結果如何進入 class、style、slot 或子元件 props
```

所以閱讀 `$VIEWUI` 時，不能只看 `types/index.d.ts`，也不能只看 `src/index.js`。真正完整的閱讀方式，是把 install、type declaration、component consumption 三個層次串起來。

### 2.4 本目錄只處理 `07-basic-components/`

本目錄的範圍是 `07-basic-components/` 中的基礎元件。這個範圍很重要，因為 View UI Plus 中其他元件，例如 `Tooltip`、`Poptip`、`Dropdown`、`Select`、`Modal` 等，也可能與 `transfer` 或其他全域設定有關。

但是本目錄的結論不能直接外推到整個 View UI Plus。當筆記說「基礎元件中只有 `AvatarList` 讀 `$VIEWUI.transfer`」時，意思是在 `07-basic-components/` 的範圍內，不是整個框架所有元件都只有 `AvatarList` 使用 transfer。

---

## 3. 整體概覽

### 3.1 本目錄要追蹤的主資料流

本目錄的核心資料流可以整理成：

```txt
app.use(ViewUIPlus, options)
  -> src/index.js 的 install(app, opts)
  -> 建立 app.config.globalProperties.$VIEWUI
  -> component 端透過 props default 或 globalConfig mixin 讀取
  -> 影響基礎元件的 size、transfer、arrow 預設行為
```

這條資料流同時包含三個問題：

| 階段 | 要回答的問題 | 代表檔案 |
| --- | --- | --- |
| Plugin install | `$VIEWUI` 從哪裡被建立？ | `src/index.js` |
| Type declaration | 使用者可以傳入哪些 options？ | `types/index.d.ts` |
| Component consumption | 哪些基礎元件真的讀取 `$VIEWUI`？ | `src/components/*` |

在原始碼閱讀時，這三個階段缺一不可。只讀 install，會知道 `$VIEWUI` 長什麼樣子，但不知道誰使用它。只讀 type declaration，會知道 public API shape，但不知道 runtime default。只讀元件，會看到元件讀了全域設定，但可能不知道這些設定從哪裡來。

### 3.2 本目錄的四篇主題筆記

本目錄目前可以拆成四篇主題筆記：

| 閱讀順序 | 筆記 | 主題 | 對照元件 | 學習目的 |
| --- | --- | --- | --- | --- |
| 1 | `01-viewui-config-entry-and-reading-map.md` | `$VIEWUI` 來源、型別、讀取方式與基礎元件命中矩陣 | 全部基礎元件 | 建立整張閱讀地圖，避免只看單一元件。 |
| 2 | `02-global-size-impact.md` | `$VIEWUI.size` 如何影響預設尺寸 | `Button`、`ButtonGroup`、`Avatar` | 理解全域 size 如何進入 prop default，再轉成 class 或 inline style。 |
| 3 | `03-transfer-impact-in-basic-components.md` | `$VIEWUI.transfer` 在基礎元件中的實際落點 | `AvatarList` | 理解 transfer 在基礎元件中只透過 `AvatarList` 傳給內部 `Tooltip`。 |
| 4 | `04-cell-arrow-global-config.md` | `$VIEWUI.cell` 如何改變 `Cell` 預設箭頭 | `Cell` | 理解 component-specific config 如何透過 `globalConfig` mixin 進入 computed。 |

這四篇筆記不是彼此獨立的碎片，而是同一條主線的四個切面。第一篇負責建立全局地圖，後三篇分別追蹤三種設定 key 的落點。

### 3.3 Source Baseline

本目錄以 View UI Plus v1.3.20 為閱讀基準。閱讀時應固定 source baseline，避免不同版本的實作差異混在一起。

| Source | 用途 | 閱讀重點 |
| --- | --- | --- |
| `01-origin/source/view-ui-plus-v1.3.20/src/index.js` | 確認 `app.use()` options 如何被整理成 `$VIEWUI` | 看 `install(app, opts)` 如何建立 runtime config。 |
| `01-origin/source/view-ui-plus-v1.3.20/src/mixins/globalConfig.js` | 確認 `globalConfig` mixin 如何把 `$VIEWUI` 存到 `this.globalConfig` | 看 component-specific config 如何被元件取得。 |
| `01-origin/source/view-ui-plus-v1.3.20/types/index.d.ts` | 對照 `ViewUIPlusGlobalOptions` 與 runtime `$VIEWUI` shape | 看 public options shape，但不要把它誤解成消費點。 |
| `01-origin/source/view-ui-plus-v1.3.20/src/components/` | 確認哪些基礎元件實際讀取 `$VIEWUI` | 搜尋 `$VIEWUI`、`globalConfig`、`getCurrentInstance()`、prop default。 |

---

## 4. 核心內容逐步講解

### 4.1 為什麼 `$VIEWUI` 需要獨立成一組筆記？

如果只從單一元件角度學習，很容易把 `$VIEWUI` 當成某個元件的補充細節。例如讀 `Button` 時看到 `size` default 讀了 `$VIEWUI.size`，就把它記在 `Button` 筆記裡；讀 `AvatarList` 時看到 `transfer` default 讀了 `$VIEWUI.transfer`，就把它記在 `AvatarList` 筆記裡。

這樣記錄雖然沒有錯，但會造成一個問題：你看不到橫向關係。

`$VIEWUI` 的重點不是某個元件單獨用了什麼，而是它提供了一個框架層級的全域預設值機制。這個機制會分散在不同元件的 `props default`、`computed`、`render` 或子元件傳值中。如果不把它獨立整理，很容易出現以下混淆：

1. 誤以為 `$VIEWUI.size` 會影響所有有 `size` prop 的元件。
2. 誤以為 `$VIEWUI.transfer` 是所有基礎元件都支援的通用設定。
3. 誤以為 `Cell` 有 local arrow props，而忽略它其實走 `$VIEWUI.cell` 與 `#arrow` slot。
4. 誤以為 type declaration 有某個 key，就代表所有相關元件都有使用。

因此，這個 README 的角色不是取代個別元件筆記，而是把分散在不同元件裡的全域設定讀取點收斂成一張地圖。

### 4.2 `$VIEWUI.size`：視覺尺寸預設值

`$VIEWUI.size` 是本目錄最容易理解的全域設定，因為它主要走 prop default。

在基礎元件範圍內，確認會讀 `$VIEWUI.size` 的元件包括：

```txt
Button
ButtonGroup
Avatar
```

這些元件的共同點是：它們都有 `size` prop，而且在使用者沒有傳入 `size` 時，會從 `$VIEWUI.size` 取得 fallback。這代表全域 size 的作用是設定常用尺寸預設值，而不是強制改掉所有元件尺寸。

不過，即使同樣讀 `$VIEWUI.size`，不同元件的後續處理也不完全相同：

| 元件 | 讀取方式 | 後續影響 |
| --- | --- | --- |
| `Button` | `size` prop default 讀 `$VIEWUI.size` | 進入 button class，但 `default` 不產生 size class。 |
| `ButtonGroup` | `size` prop default 讀 `$VIEWUI.size` | 進入 group class，包含 `default` class。 |
| `Avatar` | `size` prop default 讀 `$VIEWUI.size` | 標準尺寸走 class，非標準尺寸可能走 inline style。 |

這裡最值得學習的是「同一個全域設定，不代表每個元件的消費方式相同」。你要追蹤的是：

```txt
$VIEWUI.size
  -> prop default
  -> this.size
  -> class / style mapping
```

### 4.3 `$VIEWUI.transfer`：浮層掛載行為的預設值

`transfer` 在 View UI Plus 裡通常和浮層、彈窗、下拉、提示類元件有關。它的核心概念是：某些浮層內容不一定要掛在原本元件所在的 DOM 位置，而可能被移動到其他容器中，以避免 overflow、z-index 或定位問題。

但在 `07-basic-components/` 範圍內，真正直接讀 `$VIEWUI.transfer` 的基礎元件不是所有元件，而是 `AvatarList`。原因是 `AvatarList` 內部可以用 `Tooltip` 包住每個 avatar item，於是它需要把 `transfer` 傳給內部 `Tooltip`。

它的資料流可以理解成：

```txt
$VIEWUI.transfer
  -> AvatarList.transfer default
  -> Tooltip.transfer prop
  -> Tooltip 決定提示層掛載方式
```

這代表 `$VIEWUI.transfer` 對 `AvatarList` 的影響不是改變 `AvatarList` 本身的 DOM 結構，也不是改變 `Avatar` 的尺寸或內容，而是影響 `Tooltip` 這條 branch 的浮層掛載策略。

還要注意，`transfer` 只有在 `Tooltip` 真正被渲染時才有意義。如果沒有啟用 tooltip，或 item 沒有 `tip`，那麼即使 `$VIEWUI.transfer` 設成 `true`，也不會出現實際的 tooltip transfer 行為。

### 4.4 `$VIEWUI.cell`：component-specific config

`$VIEWUI.cell` 和 `$VIEWUI.size`、`$VIEWUI.transfer` 的消費方式不同。

`size` 和 `transfer` 通常是 top-level option，然後進入某個元件的 prop default。`cell` 則是針對 `Cell` 元件的 component-specific config。它不是被 `Cell` 的 local prop 直接接收，而是透過 `globalConfig` mixin 進入元件 instance，最後由 computed 決定預設 arrow `Icon` 的 props。

它的資料流可以整理成：

```txt
app.use(ViewUIPlus, { cell })
  -> $VIEWUI.cell
  -> globalConfig mixin
  -> Cell.globalConfig
  -> arrowType / customArrowType / arrowSize
  -> 預設 Icon props
```

`Cell` 的預設 arrow 又有兩個重要前提：

```txt
Cell.to 有值
沒有提供 #arrow slot
```

如果 `Cell` 沒有 `to`，arrow 區塊不會出現。如果使用者提供了 `#arrow` slot，預設 `Icon` 會被 slot 覆蓋。

這代表 `$VIEWUI.cell` 只是在「需要預設 arrow icon」的情境下提供全域預設值。它不控制 `Cell` 的 click 行為，不控制 router navigation，也不控制 selected / disabled class。

### 4.5 命中元件與未命中元件要一起讀

列出未直接命中 `$VIEWUI` 的元件，例如：

```txt
Icon
Divider
Tag
Badge
```

這一點很重要。對原始碼閱讀來說，沒有命中並不是沒有價值。它們的價值在於建立邊界：我們不能因為 `$VIEWUI.size` 存在，就推論所有有尺寸概念的元件都會讀它；也不能因為 `$VIEWUI.transfer` 存在，就推論所有元件都能 transfer。

命中元件告訴你「全域設定如何被使用」。未命中元件告訴你「不要推論過頭」。這兩者合起來，才是一張可靠的原始碼閱讀地圖。

### 4.6 Working Rule：筆記維護時要區分三種結論

本目錄的每篇筆記都應遵守一個重要規則：不要把不同證據層級混在一起。

可以把結論分成三類：

| 結論類型 | 來源 | 可信度 | 寫筆記時的表述方式 |
| --- | --- | --- | --- |
| Runtime source 已確認 | `src/index.js`、`src/components/*` 實際程式碼 | 最高 | 可以寫成「實際會」、「確認會」。 |
| Type declaration 描述 | `types/index.d.ts` | 中等 | 應寫成「型別允許」、「public shape 描述」。 |
| 推測或延伸 | 根據命名、慣例、其他元件經驗 | 低 | 應標註「可推測」、「需要後續確認」。 |

這個規則尤其適合用在框架原始碼閱讀。因為開源專案常常會出現 type 寫得比較寬、runtime 實作比較窄，或某些設定在不同元件中的消費方式不一致。如果筆記沒有標註證據層級，未來複習時就容易把推測當成事實。

---

## 5. 表格整理

### 5.1 主題筆記索引表

| 筆記 | 主題 | 對照元件 | 建議閱讀重點 |
| --- | --- | --- | --- |
| `01-viewui-config-entry-and-reading-map.md` | `$VIEWUI` 來源、型別、讀取方式與命中矩陣 | 全部基礎元件 | 先建立 `$VIEWUI` 的總資料流，不要一開始就跳進單一元件。 |
| `02-global-size-impact.md` | `$VIEWUI.size` 如何影響預設尺寸 | `Button`、`ButtonGroup`、`Avatar` | 比較同樣讀 size 時，三個元件如何轉成不同 class / style。 |
| `03-transfer-impact-in-basic-components.md` | `$VIEWUI.transfer` 在基礎元件中的實際落點 | `AvatarList` | 追蹤 `transfer` 如何傳給內部 `Tooltip`，不要誤判成 `Avatar` 行為。 |
| `04-cell-arrow-global-config.md` | `$VIEWUI.cell` 如何改變 `Cell` 預設箭頭 | `Cell` | 理解 `globalConfig` mixin、computed、slot 覆蓋與 `to` 條件。 |

### 5.2 Source Baseline 表

| Source | 用途 | 判斷重點 |
| --- | --- | --- |
| `01-origin/source/view-ui-plus-v1.3.20/src/index.js` | 確認 install options 如何被整理成 `$VIEWUI` | `$VIEWUI` runtime shape 與 default 值。 |
| `01-origin/source/view-ui-plus-v1.3.20/src/mixins/globalConfig.js` | 確認 `globalConfig` mixin 如何讀 `$VIEWUI` | 哪些元件不是走 prop default，而是走 mixin。 |
| `01-origin/source/view-ui-plus-v1.3.20/types/index.d.ts` | 對照 `ViewUIPlusGlobalOptions` | 型別允許什麼，但不能單獨推論 runtime 行為。 |
| `01-origin/source/view-ui-plus-v1.3.20/src/components/` | 搜尋元件實際命中點 | 是否讀 `$VIEWUI`、讀哪個 key、讀完後怎麼消費。 |

### 5.3 基礎元件命中概覽表

| 元件 | `$VIEWUI` 影響 | 消費方式 | 閱讀重點 |
| --- | --- | --- | --- |
| `Button` | `size` prop 未傳時，預設讀 `$VIEWUI.size` | prop default | 注意 `default` size 不產生 `ivu-btn-default` size class。 |
| `ButtonGroup` | `size` prop 未傳時，預設讀 `$VIEWUI.size` | prop default | 注意 group class 規則和 `Button` 不同。 |
| `Avatar` | `size` prop 未傳時，預設讀 `$VIEWUI.size` | prop default | 注意標準尺寸走 class，非標準尺寸可能走 inline style。 |
| `AvatarList` | `transfer` prop 未傳時，預設讀 `$VIEWUI.transfer` | prop default，再傳給子元件 | 注意 transfer 最後傳給 `Tooltip`，不是傳給 `Avatar`。 |
| `Cell` | 預設 arrow icon 讀 `$VIEWUI.cell.arrow`、`customArrow`、`arrowSize` | `globalConfig` mixin + computed | 注意只有 `to` 有值且沒有 `#arrow` slot 時才影響預設 `Icon`。 |
| `Icon` | v1.3.20 中沒有直接讀取 `$VIEWUI` | 無直接命中 | 作為對照組，不要推論全域設定會自動影響它。 |
| `Divider` | v1.3.20 中沒有直接讀取 `$VIEWUI` | 無直接命中 | 作為未命中案例。 |
| `Tag` | v1.3.20 中沒有直接讀取 `$VIEWUI` | 無直接命中 | 作為未命中案例。 |
| `Badge` | v1.3.20 中沒有直接讀取 `$VIEWUI` | 無直接命中 | 作為未命中案例。 |

### 5.4 `$VIEWUI` key 與行為類型比較表

| `$VIEWUI` key | 影響元件 | 行為類型 | 最後落點 |
| --- | --- | --- | --- |
| `size` | `Button`、`ButtonGroup`、`Avatar` | 視覺尺寸預設 | class 或 inline style。 |
| `transfer` | `AvatarList` | 浮層掛載預設 | 內部 `Tooltip.transfer`。 |
| `cell.arrow` | `Cell` | 預設 arrow icon type | `Icon.type`。 |
| `cell.customArrow` | `Cell` | 預設 custom icon | `Icon.custom`，並清空一般 `type`。 |
| `cell.arrowSize` | `Cell` | 預設 arrow icon size | `Icon.size`。 |

---

## 6. 範例或情境說明

### 6.1 情境一：全域設定 size，但只有部分基礎元件受影響

假設使用者在入口這樣設定：

```js
app.use(ViewUIPlus, {
  size: 'large'
});
```

直覺上可能會以為所有基礎元件都會變大，但正確閱讀方式是先問：

```txt
哪些元件真的讀了 $VIEWUI.size？
```

在本目錄的基礎元件範圍內，確認受影響的是：

```txt
Button
ButtonGroup
Avatar
```

因此，`Icon`、`Divider`、`Tag`、`Badge` 不應該因為 `$VIEWUI.size` 存在，就被推論成會受到全域 size 影響。

### 6.2 情境二：全域設定 transfer，但 `AvatarList` 不一定有實際浮層效果

假設使用者設定：

```js
app.use(ViewUIPlus, {
  transfer: true
});
```

這個設定可以作為 `AvatarList.transfer` 的 fallback，但它不代表 `AvatarList` 一定會產生浮層。你還要看 `AvatarList` 是否渲染 `Tooltip` branch，例如是否啟用 tooltip，以及 item 是否有 `tip`。

正確資料流是：

```txt
$VIEWUI.transfer
  -> AvatarList.transfer default
  -> 若 Tooltip branch 存在
  -> 傳給 Tooltip.transfer
```

如果沒有 `Tooltip` branch，`transfer` 就沒有實際作用。

### 6.3 情境三：全域設定 `cell.arrow`，但單一 Cell 使用 slot 覆蓋

假設使用者在全域設定：

```js
app.use(ViewUIPlus, {
  cell: {
    arrow: 'ios-arrow-forward'
  }
});
```

這會影響 `Cell` 的預設 arrow icon。但如果某個 `Cell` 使用了 `#arrow` slot，則該 slot 會覆蓋預設 `Icon`。因此 `$VIEWUI.cell` 適合用來設定整個 app 的預設 arrow 風格，而 `#arrow` slot 適合處理單一 Cell 的特殊視覺需求。

---

## 7. 閱讀路線或學習路線

### 7.1 初次閱讀路線

第一次閱讀本目錄時，建議不要直接從某個元件的細節開始，而是依照以下順序：

1. 先讀 `README.md`。  
   目的是知道本目錄只處理 `$VIEWUI` 對 `07-basic-components/` 的影響，避免把結論外推到整個框架。

2. 再讀 `01-viewui-config-entry-and-reading-map.md`。  
   目的是建立 `$VIEWUI` 的來源、runtime shape、type declaration 與命中矩陣。

3. 接著讀 `02-global-size-impact.md`。  
   目的是理解最常見的 prop default fallback 模式，並比較 `Button`、`ButtonGroup`、`Avatar` 對 size 的不同消費方式。

4. 再讀 `03-transfer-impact-in-basic-components.md`。  
   目的是理解 top-level option 不一定直接改變元件本體，有時只是傳給內部浮層元件。

5. 最後讀 `04-cell-arrow-global-config.md`。  
   目的是理解 component-specific config 如何透過 `globalConfig` mixin 與 computed 進入 render branch。

### 7.2 深入閱讀路線

如果你想把這組筆記和原始碼連起來，可以改用 source-driven 的閱讀方式：

1. 從 `src/index.js` 進入，找出 `$VIEWUI` 被建立的位置。
2. 對照 `types/index.d.ts`，確認 options 的 public shape。
3. 搜尋 `src/components/` 中的 `$VIEWUI`、`globalConfig`、`getCurrentInstance()`。
4. 對每個命中元件追蹤：
   - 它讀哪個 `$VIEWUI` key？
   - 讀取發生在 prop default、computed，還是 lifecycle / mixin？
   - 讀取結果進入 class、style、render，還是子元件 props？
5. 對沒有命中的元件建立對照組，避免過度推論。

### 7.3 可以暫時跳過的部分

如果目前只想建立 `$VIEWUI` 在基礎元件中的地圖，可以暫時跳過以下內容：

1. `Tooltip`、`Modal`、`Select` 等非基礎元件的完整 transfer 行為。
2. `Cell` 的 click、router navigation、`CellGroup` provide/inject 細節。
3. View UI Plus 整體 plugin install 中與 locale、directive、prototype method 相關的其他邏輯。
4. 樣式系統中每個 class 對應的完整 Less 實作。

這些內容不是不重要，而是可以在建立 `$VIEWUI` 主線後再分支深入。

---

## 8. 常見誤區

| 誤區 | 為什麼容易誤解 | 正確理解 |
| --- | --- | --- |
| `$VIEWUI` 是某個元件的 prop | 名稱出現在元件 default 或 computed 裡，容易被誤認成元件 API | `$VIEWUI` 是 plugin install 建立的全域 runtime config container。 |
| `$VIEWUI.size` 會影響所有有尺寸概念的元件 | `size` 是很常見的 prop 名稱 | 只有實際在 prop default 讀 `$VIEWUI.size` 的元件才會受影響。 |
| `$VIEWUI.transfer` 是所有基礎元件的通用設定 | `transfer` 在 UI library 中很常見 | 在本目錄基礎元件範圍內，直接落點是 `AvatarList`，並傳給內部 `Tooltip`。 |
| `types/index.d.ts` 有某個 key，就代表元件一定用它 | 型別宣告看起來像完整 API 文件 | type declaration 只描述 public shape，不代表每個元件都有 runtime consumption。 |
| `Cell` 有 local `arrow`、`customArrow`、`arrowSize` props | `Cell` 確實會出現 arrow icon | v1.3.20 中這些預設值來自 `$VIEWUI.cell` 或被 `#arrow` slot 覆蓋，不是 local props。 |
| 未命中 `$VIEWUI` 的元件可以不用記 | 學習時容易只關注有命中的案例 | 未命中元件是重要對照組，可以防止過度推論。 |
| README 只是一個目錄，不需要詳細寫 | README 常被當成索引 | 這裡的 README 應該作為整組筆記的入口、邊界與閱讀規則。 |

---

## 9. 本章總結

這份 README 的核心價值，是幫助你把 `$VIEWUI` 從「分散在各元件筆記裡的零碎細節」提升成「可以系統閱讀的全域設定主線」。

在 View UI Plus v1.3.20 的 `07-basic-components/` 範圍內，`$VIEWUI` 的影響可以分成三個主要方向：

```txt
$VIEWUI.size
  -> Button / ButtonGroup / Avatar
  -> 預設尺寸
  -> class 或 inline style

$VIEWUI.transfer
  -> AvatarList
  -> 內部 Tooltip
  -> 浮層掛載策略

$VIEWUI.cell
  -> Cell
  -> globalConfig mixin + computed
  -> 預設 arrow Icon
```

閱讀時最重要的不是背誦這些 key，而是建立一個可靠的判斷流程：

```txt
先看 install 建立了什麼
再看 type declaration 描述了什麼
接著看 component 是否真的讀取
最後追蹤讀取結果如何進入畫面或子元件
```

這種閱讀方式不只適用於 `$VIEWUI`，也適合用來分析其他 UI library 的全域設定、plugin option、component default 與 framework-level configuration。

---

## 10. 自我檢查問題

1. `$VIEWUI` 是 UI 元件、命令式 API，還是 runtime config container？
2. 為什麼不能只看 `types/index.d.ts` 就判斷某個 `$VIEWUI` key 會影響哪些元件？
3. 本目錄為什麼只說明 `07-basic-components/` 的影響，而不能直接外推到整個 View UI Plus？
4. `$VIEWUI.size` 在基礎元件範圍內主要影響哪些元件？
5. 為什麼 `Button`、`ButtonGroup`、`Avatar` 同樣讀 `$VIEWUI.size`，但仍需要分開分析？
6. `$VIEWUI.transfer` 在 `AvatarList` 中最後傳給哪個子元件？
7. 為什麼設定 `$VIEWUI.transfer=true` 不代表 `AvatarList` 一定會出現浮層 DOM？
8. `$VIEWUI.cell` 和 `$VIEWUI.size` / `$VIEWUI.transfer` 在消費方式上有什麼差異？
9. 未直接讀取 `$VIEWUI` 的 `Icon`、`Divider`、`Tag`、`Badge` 為什麼仍應列入命中概覽？
10. 寫這類原始碼閱讀筆記時，為什麼要區分 runtime source、type declaration 與推測？

---

## 11. 後續延伸方向

這份 README 之後可以延伸成以下主題筆記：

1. **Plugin install 機制完整分析**  
   深入拆解 `src/index.js` 中除了 `$VIEWUI` 以外的 plugin 註冊流程，例如 component registration、directive、locale、prototype methods。

2. **`globalProperties` 與 Vue 3 plugin 設計模式**  
   以 Vue 3 的 app instance 為主軸，整理 UI library 如何透過 `app.config.globalProperties` 提供全域 API 或全域設定。

3. **`props default` 中讀取全域設定的設計取捨**  
   分析這種設計的優點與限制，例如使用者 prop 優先、default 只在未傳 prop 時執行、測試時如何 mock globalProperties。

4. **`globalConfig` mixin 設計分析**  
   深入比較 prop default 直接讀 `$VIEWUI` 與 mixin 統一注入 `globalConfig` 的差異。

5. **`transfer` 在浮層元件中的完整路線圖**  
   從 `AvatarList` 延伸到 `Tooltip`、`Poptip`、`Dropdown`、`Select`、`Modal` 等元件，建立完整 transfer 筆記。

6. **基礎元件命中矩陣版本追蹤**  
   如果未來 View UI Plus 版本升級，可以建立 v1.3.20、vNext 之間的 `$VIEWUI` 命中差異表。

7. **從 `$VIEWUI` 學習 UI library 全域設定設計**  
   抽象化成自己的元件庫設計筆記，思考哪些設定適合放全域、哪些應該保留在 local prop 或 slot。
