# `$VIEWUI.cell` 與 `Cell` 預設箭頭設定：全域設定、Mixin 與 Render 分支閱讀筆記

## 1. 本章定位

本章是一篇「原始碼閱讀筆記」加上「全域設定行為分析筆記」。它要解決的問題不是教你如何使用 `Cell` 的所有功能，而是專門說明 `$VIEWUI.cell` 如何影響 `Cell` 的預設箭頭。

本章主軸如下：

```txt
app.use(ViewUIPlus, { cell })
  -> install 階段建立 $VIEWUI.cell
  -> Cell 透過 globalConfig mixin 取得全域設定
  -> arrowType / customArrowType / arrowSize computed 讀取設定
  -> 預設 Icon 接收到 type / custom / size
  -> Cell link branch 顯示箭頭
```

讀完本章後，你應該能理解四件事。

第一，`$VIEWUI.cell` 是 component-specific config，也就是針對 `Cell` 這類特定元件行為設計的全域預設值，而不是所有基礎元件都會讀取的通用設定。

第二，`Cell` 不是透過 `arrow`、`customArrow`、`arrowSize` 這類 local props 接收箭頭設定，而是透過 `$VIEWUI.cell` 與 `#arrow` slot 提供兩種不同層級的客製方式。

第三，`$VIEWUI.cell` 只影響「有 `to` 的 `Cell`」中的預設 arrow `Icon`，不影響沒有 link 語意的 `Cell`，也不影響 `Cell` 的點擊、路由跳轉、selected、disabled 等其他行為。

第四，你會知道閱讀這類全域設定時，不能只看 install options，也不能只看 component template，而要沿著「設定建立 → 設定取得 → computed 決策 → render 使用」一路追蹤。

本章不重複分析 `Cell` 的 click、router navigation、`CellGroup` provide/inject、class/style 組裝流程。那些內容應放在 `Cell` 元件本身的原始碼閱讀筆記中處理。

---

## 2. 學習前先建立的基本觀念

### 2.1 `$VIEWUI` 是 install 階段建立的全域設定容器

在 View UI Plus 中，`$VIEWUI` 不是一個畫面元件，也不是像 `$Message`、`$Modal` 那樣用來主動觸發 UI 的命令式 API。它比較像是 Vue app 層級的 runtime config container。

當使用者執行：

```js
app.use(ViewUIPlus, {
    cell: {
        arrow: 'ios-arrow-forward',
        customArrow: '',
        arrowSize: 16
    }
});
```

plugin install 流程會把這些設定整理後放進：

```js
app.config.globalProperties.$VIEWUI
```

這代表元件可以在 runtime 透過 app 的 global properties 讀取全域設定。換句話說，`$VIEWUI.cell` 本身不會直接改變畫面；只有當 `Cell` 實際讀取它，並把讀取結果傳給 `Icon` 時，才會對畫面產生影響。

### 2.2 `Cell` 的 arrow 是 link cue，不是每個 `Cell` 都會出現

`Cell` 的 arrow 通常用來提示使用者：「這個項目可以前往另一個位置或執行導向行為」。因此在 render branch 中，arrow 區塊被綁在 `to` 條件上：

```vue
<div class="ivu-cell-arrow" v-if="to">
    <slot name="arrow">
        <Icon :type="arrowType" :custom="customArrowType" :size="arrowSize" />
    </slot>
</div>
```

這裡的重點是：即使你設定了 `$VIEWUI.cell.arrow`，如果該 `Cell` 沒有 `to`，arrow 區塊仍然不會渲染。全域設定只提供「預設箭頭怎麼長」，不負責強制讓所有 `Cell` 都變成 link item。

### 2.3 全域設定與 slot 是兩種不同層級的客製方式

`$VIEWUI.cell` 解決的是「全站預設值」問題，例如整個系統的 `Cell` link arrow 都想改成同一個 icon，或統一 arrow size。

`#arrow` slot 解決的是「單一元件完全自訂」問題，例如某個 `Cell` 想顯示一個徽章、一段文字、loading icon，或完全不同的 arrow 結構。

因此它們不是同一層級的功能。全域設定適合定義預設風格，slot 適合覆寫單次內容。

### 2.4 `Icon.type` 與 `Icon.custom` 的來源語意不同

當 `$VIEWUI.cell.customArrow` 有值時，`arrowType` 會被清空。這個行為很重要，因為 `type` 與 `custom` 通常代表不同的 icon 來源或使用方式。

如果同時傳入 `Icon.type` 與 `Icon.custom`，讀者會很難判斷最後應該以哪一個 icon 來源為準。因此 `Cell` 在 computed 中使用「`customArrow` 優先，並清空 `arrowType`」的策略，讓預設 `Icon` 的來源保持單一且明確。

---

## 3. 整體概覽

### 3.1 Source Baseline

本篇主要來源如下。

| Source | 閱讀重點 |
| --- | --- |
| `src/index.js` | install 階段如何建立 `$VIEWUI.cell` 的 runtime shape。 |
| `types/index.d.ts` | `cell` 在 type declaration 中如何描述。 |
| `src/mixins/globalConfig.js` | `Cell` 如何透過 mixin 取得 `$VIEWUI`。 |
| `src/components/cell/cell.vue` | `Cell` 如何根據 `globalConfig` 計算 arrow 的 `type`、`custom`、`size`。 |
| `Icon` 元件 | 預設 arrow 最後會被轉成 `Icon` 的 props；本篇只追蹤傳入點，不深入分析 `Icon` 內部。 |

這些 source 可以分成三層來讀。

第一層是「設定建立層」，也就是 `src/index.js`。這一層回答 `$VIEWUI.cell` 的 runtime 預設值從哪裡來。

第二層是「設定取得層」，也就是 `globalConfig` mixin。這一層回答 `Cell` 元件內部如何取得 app 層級的 `$VIEWUI`。

第三層是「設定消費層」，也就是 `cell.vue` 中的 computed 與 render branch。這一層回答 `$VIEWUI.cell` 如何真正影響畫面中的預設 arrow。

### 3.2 `$VIEWUI.cell` 的資料流

整體資料流可以整理成：

```txt
使用者傳入 install options
  -> app.use(ViewUIPlus, { cell })
  -> src/index.js 整理 opts.cell
  -> app.config.globalProperties.$VIEWUI.cell
  -> Cell mixins: [mixinsLink, globalConfig]
  -> this.globalConfig
  -> arrowType / customArrowType / arrowSize
  -> <Icon :type="..." :custom="..." :size="..." />
```

這條路線有兩個閱讀重點。

第一，`$VIEWUI.cell` 的資料不是在 `Cell` 的 prop default 階段被讀取，而是在 component instance 已經能透過 mixin 拿到 `globalConfig` 之後，由 computed 決定要傳給 `Icon` 的值。

第二，最後被影響的不是整個 `Cell` 元件，而是 `Cell` link branch 裡的預設 `Icon`。因此你在閱讀時不能把 `$VIEWUI.cell` 想成 `Cell` 的整體設定開關，它的實際作用範圍比這更窄。

---

## 4. 核心內容逐步講解

### 4.1 `$VIEWUI.cell` 在 install 階段的 runtime shape

install 建立邏輯如下：

```js
cell: {
    arrow: opts.cell ? opts.cell.arrow ? opts.cell.arrow : '' : '',
    customArrow: opts.cell ? opts.cell.customArrow ? opts.cell.customArrow : '' : '',
    arrowSize: opts.cell ? opts.cell.arrowSize ? opts.cell.arrowSize : '' : ''
}
```

這段程式碼會保證 `$VIEWUI.cell` 在 runtime 中是一個固定 shape 的物件。即使使用者完全沒有傳入 `cell` option，runtime 仍然會有：

```js
{
    arrow: '',
    customArrow: '',
    arrowSize: ''
}
```

這個設計的好處是，消費端元件可以穩定地讀取 `config.cell.arrow`、`config.cell.customArrow`、`config.cell.arrowSize`，而不必每次都先判斷 `cell` 物件是否存在。不過，從 `arrowType` 寫法來看，`Cell` 仍然會先判斷 `config` 是否存在，這是為了避免某些情境下 `$VIEWUI` 尚未被建立或元件被單獨使用時發生錯誤。

這裡也要注意 fallback 策略：`arrow`、`customArrow`、`arrowSize` 使用的是 truthy 判斷。也就是說，如果傳入空字串，最後仍然會被視為沒有設定。對 `arrowSize` 而言，如果傳入的是 `0`，也會因為 falsy 被轉成空字串。這是否符合實際需求，通常要看元件是否允許 `0` 這種尺寸語意；就本篇筆記範圍而言，只能確定原始碼使用 truthy fallback。

`types/index.d.ts` 中的形狀則是：

```ts
cell?: {
    arrow: string;
    customArrow: string;
    arrowSize: number | string;
};
```

type declaration 回答的是「使用者可以傳入什麼 shape」，runtime install 回答的是「沒有傳入時實際會長什麼樣子」。閱讀 View UI Plus 這類元件庫時，這兩層要分開看，不能只看型別就推論 runtime 行為。

### 4.2 `Cell` 透過 `globalConfig` mixin 取得 `$VIEWUI`

`Cell` 的 source 位於：

```txt
src/components/cell/cell.vue
```

並且混入：

```js
mixins: [ mixinsLink, globalConfig ]
```

其中 `globalConfig` mixin 會把 `$VIEWUI` 存成：

```js
this.globalConfig
```

因此在 `Cell` 的 computed 中，可以透過：

```js
const config = this.globalConfig;
```

取得全域設定。

這個模式和 `$VIEWUI.size` 在 `Button`、`ButtonGroup`、`Avatar` 中的使用方式不同。那些元件通常是在 `size` prop 的 `default()` 中直接讀：

```js
getCurrentInstance().appContext.config.globalProperties
```

而 `Cell` 是透過 mixin 把全域設定掛到 component instance 上，再由 computed 讀取。

這種差異反映出兩種設計模式：

| 模式 | 適用場景 | 典型例子 |
| --- | --- | --- |
| prop default 直接讀 `$VIEWUI` | 全域設定要成為某個 prop 的預設值 | `Button.size`、`ButtonGroup.size`、`Avatar.size`、`AvatarList.transfer` |
| `globalConfig` mixin + computed | 全域設定不是 local prop，而是內部 render 行為的預設值 | `Cell` 的預設 arrow `Icon` |

`Cell` 沒有提供 `arrow`、`customArrow`、`arrowSize` 這些 local props，所以它不適合把 `$VIEWUI.cell` 接到 prop default 上。它需要的是在內部 render 預設 arrow 時，動態決定 `Icon` props。因此使用 `globalConfig` mixin + computed 比較符合這個需求。

### 4.3 Arrow render branch：`$VIEWUI.cell` 生效前的兩個條件

render 片段如下：

```vue
<div class="ivu-cell-arrow" v-if="to">
    <slot name="arrow">
        <Icon :type="arrowType" :custom="customArrowType" :size="arrowSize" />
    </slot>
</div>
```

這段程式碼可以拆成兩個關鍵條件。

第一，`v-if="to"` 決定 arrow 區塊是否存在。也就是說，只有具有 `to` 的 `Cell` 才會渲染 `.ivu-cell-arrow`。如果沒有 `to`，不管 `$VIEWUI.cell` 設定了什麼，arrow 區塊都不會出現。

第二，`<slot name="arrow">...</slot>` 決定預設 `Icon` 是否會被使用。如果使用者沒有提供 `#arrow` slot，slot fallback 才會渲染：

```vue
<Icon :type="arrowType" :custom="customArrowType" :size="arrowSize" />
```

如果使用者提供了 `#arrow` slot，slot 內容會取代 fallback，預設 `Icon` 就不會被渲染。此時 `$VIEWUI.cell` 對預設 `Icon` 的影響自然也不會出現。

因此 `$VIEWUI.cell` 的實際生效條件是：

```txt
Cell.to 有值
  且沒有提供 #arrow slot
  且使用 fallback <Icon>
```

這個條件非常重要。它可以避免你在除錯時誤判：「明明設定了 `$VIEWUI.cell.arrow`，為什麼畫面沒變？」實際上，可能是該 `Cell` 沒有 `to`，或已經用 slot 覆蓋掉預設箭頭。

### 4.4 `arrowType`：內建 icon 與 custom icon 的互斥策略

`arrowType` computed 如下：

```js
arrowType () {
    const config = this.globalConfig;
    let type = 'ios-arrow-forward';

    if (config) {
        if (config.cell.customArrow) {
            type = '';
        } else if (config.cell.arrow) {
            type = config.cell.arrow;
        }
    }
    return type;
}
```

這段邏輯可以用白話理解成：

```txt
預設使用 ios-arrow-forward
  -> 如果設定了 customArrow，就不要使用 type
  -> 否則，如果設定了 arrow，就使用 cell.arrow
  -> 如果都沒設定，就維持 ios-arrow-forward
```

也就是說，`arrowType` 有三種可能結果。

| `$VIEWUI.cell` 狀態 | `arrowType` 結果 | 意義 |
| --- | --- | --- |
| 沒有設定 `arrow` / `customArrow` | `ios-arrow-forward` | 使用 View UI Plus 預設箭頭。 |
| 設定 `cell.arrow` | `cell.arrow` | 使用指定的內建 icon type。 |
| 設定 `cell.customArrow` | `''` | 清空 `Icon.type`，改由 `customArrowType` 提供 custom icon。 |

這裡最容易忽略的是 `customArrow` 的優先權。只要 `customArrow` 有值，就算 `arrow` 也有值，`arrowType` 仍然會被清空。這代表 `customArrow` 的語意高於 `arrow`。

這樣設計的目的是讓 `Icon` 的來源保持清楚。`arrow` 對應的是 `Icon.type`，`customArrow` 對應的是 `Icon.custom`。當 custom icon 已經被指定時，再傳入內建 type 反而會讓行為不夠明確。

### 4.5 `customArrowType`：只在 `customArrow` 有值時生效

`customArrowType` computed 如下：

```js
customArrowType () {
    const config = this.globalConfig;
    let type = '';

    if (config) {
        if (config.cell.customArrow) {
            type = config.cell.customArrow;
        }
    }
    return type;
}
```

這段邏輯很單純：如果有設定 `$VIEWUI.cell.customArrow`，就把它傳給 `Icon.custom`；否則維持空字串。

對應到 render：

```vue
<Icon :type="arrowType" :custom="customArrowType" :size="arrowSize" />
```

當 `customArrow` 有值時，`Icon` 會收到：

```txt
type=""
custom="使用者設定的 customArrow"
```

這和前面 `arrowType` 清空的行為剛好互相配合。它們共同形成一個明確的分流：

```txt
使用內建 icon
  -> Icon.type 有值
  -> Icon.custom 空字串

使用 custom icon
  -> Icon.type 空字串
  -> Icon.custom 有值
```

這種互斥策略讓 `Cell` 的預設 arrow 行為更容易預測，也讓閱讀者可以快速知道 icon 來源到底是 View UI Plus 內建 icon type，還是使用者提供的 custom class / custom icon 設定。

### 4.6 `arrowSize`：只負責傳遞 size，不負責創造 arrow

`arrowSize` computed 如下：

```js
arrowSize () {
    const config = this.globalConfig;
    let size = '';

    if (config) {
        if (config.cell.arrowSize) {
            size = config.cell.arrowSize;
        }
    }
    return size;
}
```

這段邏輯的作用是把 `$VIEWUI.cell.arrowSize` 傳給 `Icon.size`。如果沒有設定，就傳空字串，讓 `Icon` 自己使用預設尺寸。

要注意，`arrowSize` 只負責決定預設 `Icon` 的 size，不負責決定 arrow 是否存在。arrow 是否存在仍然由 `to` 與 `#arrow` slot 共同決定。

因此這段資料流應該理解成：

```txt
$VIEWUI.cell.arrowSize
  -> Cell.arrowSize computed
  -> Icon.size
```

而不是：

```txt
$VIEWUI.cell.arrowSize
  -> 讓 Cell 顯示 arrow
```

這種邊界很重要。很多原始碼閱讀錯誤都來自把「樣式參數」誤解成「渲染開關」。

### 4.7 `$VIEWUI.cell` 與 local props / slots 的責任分工

`Cell` 沒有提供 `arrow`、`customArrow`、`arrowSize` 這些 local props。這是一個值得注意的 API 設計選擇。

使用者若要改變 arrow，有兩條路：

| 方法 | 作用範圍 | 控制粒度 | 適用情境 |
| --- | --- | --- | --- |
| `$VIEWUI.cell` | 全域 | 改預設 `Icon` 的 `type` / `custom` / `size` | 整個 app 的 `Cell` link arrow 想統一風格。 |
| `#arrow` slot | 單一 `Cell` | 完全覆蓋預設 arrow 內容 | 某個 `Cell` 需要特殊圖示、文字、badge 或自訂結構。 |

這個分工可以讓 `Cell` 的 API 保持簡潔。若每個箭頭設定都做成 local prop，元件 API 會變得更細碎；但如果完全沒有自訂能力，又不利於實務使用。因此 View UI Plus 在這裡使用了「全域預設 + slot 完全覆寫」的設計。

這種設計對元件庫很常見：常見需求用全域設定統一，特殊需求用 slot 開放結構，避免為每個小變化都新增 prop。

### 4.8 `$VIEWUI.cell` 和 `$VIEWUI.size` / `$VIEWUI.transfer` 的差異

在 `$VIEWUI` 這組筆記中，`size`、`transfer`、`cell` 都是重要設定，但它們的消費方式不同。

| 設定 | 消費方式 | 影響位置 | 核心語意 |
| --- | --- | --- | --- |
| `$VIEWUI.size` | prop default 直接讀 | `Button`、`ButtonGroup`、`Avatar` 的 `size` | 視覺尺寸預設。 |
| `$VIEWUI.transfer` | prop default 直接讀 | `AvatarList.transfer`，再傳給 `Tooltip` | 浮層掛載策略預設。 |
| `$VIEWUI.cell` | `globalConfig` mixin + computed | `Cell` 預設 arrow `Icon` | 特定元件內部預設 arrow 設定。 |

這張表的重點不是背誦三個設定，而是建立閱讀全域設定的判斷方法。

當全域設定最後要變成某個 prop 的預設值時，你通常會看到它出現在 prop default。當全域設定要影響元件內部某段 render fallback，且沒有對應 local prop 時，就可能會透過 mixin、computed 或其他 shared logic 進入元件內部。

`$VIEWUI.cell` 就是第二種情況。

---

## 5. 表格整理

### 5.1 `$VIEWUI.cell` 欄位對照表

| 欄位 | Runtime default | Type declaration | 最後傳給 | 閱讀重點 |
| --- | --- | --- | --- | --- |
| `cell.arrow` | `''` | `string` | `Icon.type` | 沒有 `customArrow` 時，若有值就取代預設 `ios-arrow-forward`。 |
| `cell.customArrow` | `''` | `string` | `Icon.custom` | 優先權高於 `arrow`；有值時會讓 `arrowType` 清空。 |
| `cell.arrowSize` | `''` | `number \| string` | `Icon.size` | 只影響預設 `Icon` 的尺寸，不決定 arrow 是否渲染。 |

這張表要搭配 render branch 一起讀。這三個欄位都只是預設 `Icon` 的 props 來源，如果 `Cell` 沒有 `to`，或使用者提供了 `#arrow` slot，預設 `Icon` 就不會出現。

### 5.2 `Cell` arrow 決策表

| 條件 | 結果 | `$VIEWUI.cell` 是否有實際影響 |
| --- | --- | --- |
| `to` 無值 | 不渲染 `.ivu-cell-arrow` | 否 |
| `to` 有值，且提供 `#arrow` slot | 使用 slot 內容 | 否，因為預設 `Icon` 被覆蓋 |
| `to` 有值，未提供 `#arrow` slot，未設定 `$VIEWUI.cell` | 使用 `ios-arrow-forward` 預設 arrow | 是，但走預設值 |
| `to` 有值，未提供 `#arrow` slot，設定 `cell.arrow` | 使用 `cell.arrow` 作為 `Icon.type` | 是 |
| `to` 有值，未提供 `#arrow` slot，設定 `cell.customArrow` | 清空 `Icon.type`，使用 `Icon.custom` | 是 |
| `to` 有值，未提供 `#arrow` slot，設定 `cell.arrowSize` | 傳給 `Icon.size` | 是 |

### 5.3 `$VIEWUI.cell` 與其他 `$VIEWUI` 設定比較表

| 設定 | 是否 top-level option | 是否 component-specific | 是否進入 prop default | 主要落點 |
| --- | --- | --- | --- | --- |
| `$VIEWUI.size` | 是 | 否 | 是 | 多個元件的 `size` prop fallback。 |
| `$VIEWUI.transfer` | 是 | 否 | 是 | `AvatarList.transfer`，再傳給 `Tooltip.transfer`。 |
| `$VIEWUI.cell` | 否，位於 `cell` 物件下 | 是 | 否 | `Cell` 預設 arrow `Icon` 的 computed props。 |

這裡的「component-specific」指的是該設定明確服務某個元件或某一類元件內部行為。`$VIEWUI.cell` 不應被理解成基礎元件通用設定，而應理解成 `Cell` 的全域預設 arrow config。

---

## 6. 範例或情境說明

### 6.1 情境一：沒有設定 `$VIEWUI.cell`

假設使用者只安裝 View UI Plus，沒有傳入 `cell`：

```js
app.use(ViewUIPlus);
```

runtime 中仍然會建立：

```js
$VIEWUI.cell = {
    arrow: '',
    customArrow: '',
    arrowSize: ''
}
```

若畫面中有：

```vue
<Cell to="/detail">Detail</Cell>
```

因為 `to` 有值且沒有提供 `#arrow` slot，`Cell` 會使用 fallback `Icon`。此時：

```txt
arrowType       -> ios-arrow-forward
customArrowType -> ''
arrowSize       -> ''
```

最後渲染出 View UI Plus 預設 arrow。

### 6.2 情境二：全域改成另一個內建 arrow type

假設使用者設定：

```js
app.use(ViewUIPlus, {
    cell: {
        arrow: 'ios-arrow-dropright'
    }
});
```

對於沒有提供 `#arrow` slot 的 link `Cell`，computed 會得到：

```txt
arrowType       -> ios-arrow-dropright
customArrowType -> ''
arrowSize       -> ''
```

這代表預設 `Icon.type` 被全域設定取代。這種做法適合整個系統都想使用同一種內建 arrow icon 的情境。

### 6.3 情境三：全域使用 custom arrow

假設使用者設定：

```js
app.use(ViewUIPlus, {
    cell: {
        customArrow: 'my-custom-arrow'
    }
});
```

此時 `arrowType` 會被清空，而 `customArrowType` 會使用 `my-custom-arrow`：

```txt
arrowType       -> ''
customArrowType -> my-custom-arrow
arrowSize       -> ''
```

這代表 `Icon` 會以 custom 來源為主，而不是內建 type。這也是為什麼 `customArrow` 有值時要清空 `arrowType`：避免同時提供兩種 icon 來源。

### 6.4 情境四：單一 `Cell` 使用 `#arrow` slot

如果某個 `Cell` 想完全自訂 arrow，可以使用 slot：

```vue
<Cell to="/detail">
    Detail

    <template #arrow>
        <span class="custom-cell-arrow">GO</span>
    </template>
</Cell>
```

此時 slot 內容會覆蓋 fallback：

```vue
<Icon :type="arrowType" :custom="customArrowType" :size="arrowSize" />
```

因此 `$VIEWUI.cell` 不會再影響這個 `Cell` 的 arrow 內容。這是單一元件客製最乾淨的做法。

### 6.5 情境五：設定了 `$VIEWUI.cell`，但 `Cell` 沒有 `to`

如果畫面中是：

```vue
<Cell>Profile</Cell>
```

即使全域設定了：

```js
app.use(ViewUIPlus, {
    cell: {
        arrow: 'ios-arrow-forward',
        arrowSize: 18
    }
});
```

因為 `v-if="to"` 不成立，`.ivu-cell-arrow` 不會被渲染。這說明 `$VIEWUI.cell` 不是讓 `Cell` 強制出現 arrow 的開關，而只是 link branch 預設 arrow 的設定來源。

---

## 7. 閱讀路線或學習路線

### 7.1 初次閱讀路線

第一次閱讀 `$VIEWUI.cell` 時，建議按照以下順序。

1. 先讀 `src/index.js` 中 `$VIEWUI.cell` 的建立邏輯。  
   目的是確認 runtime shape：即使沒有傳入 `cell`，`arrow`、`customArrow`、`arrowSize` 也會有空字串預設值。

2. 再讀 `types/index.d.ts` 中 `cell` 的 type declaration。  
   目的是區分 public options shape 與 runtime default shape。type declaration 告訴你使用者可以傳什麼，install 邏輯告訴你實際會存什麼。

3. 接著讀 `src/components/cell/cell.vue` 的 `mixins` 設定。  
   目的是確認 `Cell` 不是在 prop default 中直接讀 `$VIEWUI.cell`，而是透過 `globalConfig` mixin 拿到 `this.globalConfig`。

4. 再讀 `arrowType`、`customArrowType`、`arrowSize` computed。  
   目的是看 `$VIEWUI.cell` 三個欄位如何分別轉成 `Icon.type`、`Icon.custom`、`Icon.size`。

5. 最後讀 render branch。  
   目的是確認 `$VIEWUI.cell` 的實際生效條件：必須有 `to`，且沒有被 `#arrow` slot 覆蓋。

### 7.2 深入閱讀路線

如果你想進一步理解這段設計，可以繼續追：

1. `globalConfig` mixin 的完整實作。  
   觀察它在哪個生命週期取得 `$VIEWUI`，以及元件單獨使用時是否有防護。

2. `Icon` 元件對 `type`、`custom`、`size` 的處理。  
   這可以幫助你確認 `arrowType` 清空後，`customArrowType` 如何真正影響 icon 渲染。

3. `Cell` 的 link / router 行為。  
   因為 arrow render 與 `to` 條件有關，所以若想完整理解「什麼是 link Cell」，需要回頭看 `mixinsLink` 與 navigation 流程。

4. `CellGroup` 的 provide/inject 行為。  
   本篇不處理 group 行為，但若你要完整掌握 `Cell` 系列元件，仍然需要理解 group 如何影響 class、樣式或互動語意。

### 7.3 可以暫時跳過的部分

如果你只是要先理解 `$VIEWUI.cell`，可以暫時跳過：

- `Cell` 的 click event 細節。
- router navigation 的完整流程。
- `CellGroup` 的樣式與 provide/inject。
- `Icon` 內部 class 生成細節。

這些內容雖然重要，但不是本章主線。先把 `$VIEWUI.cell -> computed -> Icon props` 這條線讀通，再補其他分支會比較有效率。

---

## 8. 常見誤區

| 誤區 | 為什麼容易誤解 | 正確理解 |
| --- | --- | --- |
| `Cell` 有 `arrow` prop | 因為 `$VIEWUI.cell.arrow` 看起來像某個元件 prop | v1.3.20 範圍中，`Cell` 沒有 local `arrow` prop；arrow 預設來自 `$VIEWUI.cell` 或 `#arrow` slot。 |
| 設定 `$VIEWUI.cell` 後所有 `Cell` 都會出現 arrow | 只看到全域 arrow 設定，忽略 render branch 的 `v-if="to"` | 只有 `to` 有值的 `Cell` 才會渲染 `.ivu-cell-arrow`。 |
| `customArrow` 和 `arrow` 會一起傳給 `Icon` | 看到兩個設定都存在，以為會同時生效 | `customArrow` 有值時，`arrowType` 會被清空，避免同時傳 `Icon.type` 與 `Icon.custom`。 |
| `#arrow` slot 只是改 icon type | 把 slot 想成 prop 的另一種寫法 | `#arrow` slot 會覆蓋整個 fallback `Icon`，可以放入任意自訂結構。 |
| `arrowSize` 可以控制 arrow 是否顯示 | 把 size 設定誤解成顯示開關 | `arrowSize` 只會傳給 `Icon.size`；arrow 是否顯示仍由 `to` 與 slot branch 決定。 |
| `$VIEWUI.cell` 是所有基礎元件共用設定 | `$VIEWUI` 是全域物件，因此容易誤以為所有元件都會讀 | `$VIEWUI.cell` 是 component-specific config，主要服務 `Cell` 的預設 arrow。 |

---

## 9. 本章總結

`$VIEWUI.cell` 是 View UI Plus 中一個很適合拿來學習「全域設定如何進入特定元件內部 render 行為」的案例。它不像 `$VIEWUI.size` 那樣直接成為多個元件的 prop default，也不像 `$VIEWUI.transfer` 那樣傳給浮層元件，而是透過 `globalConfig` mixin 進入 `Cell`，再由 computed 決定預設 `Icon` 的 props。

完整心智模型可以整理成：

```txt
install options
  -> $VIEWUI.cell
  -> globalConfig mixin
  -> this.globalConfig
  -> arrowType / customArrowType / arrowSize
  -> fallback <Icon>
  -> Cell link branch 的預設箭頭
```

這條資料流有三個邊界要記住。

第一，`$VIEWUI.cell` 只影響 `Cell` 預設 arrow 的 `Icon` props，不影響 `Cell` 的 click、router navigation、selected、disabled 或其他互動行為。

第二，arrow 區塊只有在 `to` 有值時才會渲染。沒有 `to` 的 `Cell` 不會因為設定了 `$VIEWUI.cell` 就突然出現 arrow。

第三，`#arrow` slot 的優先權高於預設 `Icon`。只要使用者提供 slot，就會覆蓋 fallback，`$VIEWUI.cell` 對該 `Cell` 的預設 arrow 不再有實際影響。

從元件庫設計角度看，這是一個「全域預設 + slot 完全覆寫」的設計。它讓大多數場景可以透過全域設定統一風格，同時保留單一元件高度客製的能力。

---

## 10. 自我檢查問題

1. `$VIEWUI.cell` 在 runtime 中有哪些欄位？沒有傳入 `cell` option 時，這些欄位的預設值是什麼？
2. `Cell` 是透過哪個 mixin 取得 `$VIEWUI`？這和 `Button.size` 直接在 prop default 中讀 `$VIEWUI` 有什麼不同？
3. 什麼條件下 `Cell` 會渲染 `.ivu-cell-arrow`？
4. 為什麼設定了 `$VIEWUI.cell.arrow`，畫面中的某個 `Cell` 仍然可能不顯示 arrow？
5. `customArrow` 有值時，為什麼 `arrowType` 會被清空？
6. `cell.arrow`、`cell.customArrow`、`cell.arrowSize` 分別會傳給 `Icon` 的哪個 prop？
7. 如果單一 `Cell` 想完全自訂 arrow 內容，應該使用 `$VIEWUI.cell` 還是 `#arrow` slot？為什麼？
8. `$VIEWUI.cell` 和 `$VIEWUI.size` 在消費方式上有什麼差異？
9. `$VIEWUI.cell` 是否會影響 `Cell` 的 router navigation？為什麼？
10. 如果你要除錯 `$VIEWUI.cell` 沒有效果，你會依序檢查哪些條件？

---

## 11. 後續延伸方向

這份筆記可以延伸成以下幾個更深入的主題。

1. **`globalConfig` mixin 原始碼分析**  
   深入閱讀 `src/mixins/globalConfig.js`，確認它如何取得 `appContext.config.globalProperties.$VIEWUI`，以及在 component instance 中如何提供 `this.globalConfig`。

2. **`Cell` render、class、style 與 link branch 完整分析**  
   將 arrow 分支放回整個 `Cell` render 流程中，分析 `to`、click、router navigation、disabled、selected 等行為如何共同構成 `Cell` 的互動語意。

3. **`Icon` 元件的 `type` / `custom` / `size` 行為分析**  
   追蹤 `Cell` 傳出的 `Icon` props 之後，`Icon` 元件如何根據這些 props 產生實際 icon class 或樣式。

4. **`$VIEWUI` component-specific config 設計模式整理**  
   比較 `$VIEWUI.cell` 與其他類似設定，例如 close icon、picker icon、modal icon 等，整理 View UI Plus 如何為特定元件提供全域預設值。

5. **全域預設與 slot 覆寫的 API 設計取捨**  
   從元件庫設計角度，分析什麼情況適合提供 global config，什麼情況適合提供 local prop，什麼情況應該交給 slot。

6. **`Cell` 系列元件閱讀地圖**  
   將 `Cell`、`CellGroup`、link mixin、global config、render branch、slot branch 整合成一張完整閱讀地圖，方便後續回查。
