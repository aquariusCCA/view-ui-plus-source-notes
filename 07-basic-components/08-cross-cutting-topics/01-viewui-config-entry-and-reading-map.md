# `$VIEWUI`：View UI Plus 全域設定入口與基礎元件命中地圖

## 1. 本章定位

本章是一篇「原始碼地圖型」筆記，主題是 View UI Plus 的 `$VIEWUI` 全域設定入口，以及它在基礎元件中的實際命中範圍。它不是單一元件的使用教學，也不是完整的 plugin system 深入分析，而是用來幫你建立一張閱讀地圖：知道 `$VIEWUI` 從哪裡來、長什麼樣子、哪些元件會讀它、哪些元件不會讀它。

讀完本章後，你應該能理解四件事。

第一，`$VIEWUI` 是在 View UI Plus plugin install 階段寫入 `app.config.globalProperties` 的 runtime config container。它本身不渲染 UI，也不是用來被使用者直接呼叫的命令式方法。

第二，`types/index.d.ts` 中的 `ViewUIPlusGlobalOptions` 只描述使用者可傳入的 public shape；真正執行時 `$VIEWUI` 會長什麼樣子，仍要回到 `src/index.js` 的 install 流程確認。

第三，元件讀取 `$VIEWUI` 主要有兩種模式：一種是在 prop default 中直接讀取 `globalProperties.$VIEWUI`，另一種是透過 `globalConfig` mixin 把 `$VIEWUI` 放到 `this.globalConfig`。

第四，在 `07-basic-components/` 的整理範圍中，不是所有基礎元件都會受到 `$VIEWUI` 影響。只有實際讀取 `$VIEWUI` 的元件才會被全域設定影響；沒有讀取的元件，即使全域設定中存在相關 key，也不應推論它們會跟著改變。

本章不處理三類細節：第一，不深入分析 `$VIEWUI.size` 對每個尺寸 class 的實際差異；第二，不展開 `$VIEWUI.transfer` 對 DOM 掛載位置的完整行為；第三，不逐行分析 `Cell` arrow icon 的 render 細節。這些內容適合拆到後續獨立筆記。

---

## 2. 學習前先建立的基本觀念

### 2.1 Vue plugin install 是全域能力的入口

在 Vue 3 中，UI library 通常會提供一個 plugin，讓使用者透過 `app.use()` 安裝整套元件庫。對 View UI Plus 來說，使用者可能會在 app entry 中這樣安裝：

```js
app.use(ViewUIPlus, {
    size: 'large',
    transfer: true,
    cell: {
        arrow: 'ios-arrow-forward'
    }
});
```

這段程式碼的重點不是單純「註冊元件」，而是把使用者傳入的 options 交給 View UI Plus 的 `install(app, opts)` 流程。`install()` 會在安裝階段整理這些 options，並把它們寫成元件 runtime 可以讀取的全域設定。

換句話說，`app.use(ViewUIPlus, options)` 是使用者提供全域設定的入口；`src/index.js` 則是 View UI Plus 接收並正規化這些設定的地方。

### 2.2 `app.config.globalProperties` 是元件實例可讀取的全域屬性容器

`$VIEWUI` 不是一般 JavaScript module export，也不是某個 component 的本地狀態。它被放在 Vue app 的 `globalProperties` 上：

```js
app.config.globalProperties.$VIEWUI = {
    // normalized global options
};
```

放進 `globalProperties` 的目的，是讓元件在 runtime 可以透過目前 app instance 的 context 讀到同一份全域設定。也就是說，`$VIEWUI` 的作用範圍是「Vue app 層級」，不是「單一元件層級」。

這裡要特別注意：掛在 `globalProperties` 上不代表它一定是命令式 API。`$Message`、`$Modal` 這類 API 通常是讓使用者呼叫來產生某種 UI 行為；但 `$VIEWUI` 是被元件內部讀取的設定容器。它的工作不是被呼叫，而是被查詢。

### 2.3 Type declaration 不等於 runtime behavior

閱讀元件庫時，很容易看到 `types/index.d.ts` 裡有某個 key，就直接推論元件一定會使用它。這是錯誤的閱讀方式。

Type declaration 回答的是：「使用者在 TypeScript 中可以傳入什麼形狀的 options？」Runtime source 回答的是：「真正執行時，這些 options 被整理成什麼資料？哪些元件會讀？」

因此，閱讀 `$VIEWUI` 時不能只看 `types/index.d.ts`，也不能只看 `src/index.js`。正確方式是把三層串起來：

```txt
Type declaration：描述 public API shape
Runtime install：建立實際的 $VIEWUI 物件
Component source：確認哪些元件實際讀取 $VIEWUI
```

### 2.4 全域設定通常只提供預設值，不應覆蓋使用者明確傳入的 prop

在基礎元件中，`Button`、`ButtonGroup`、`Avatar` 的 `size` 會在 prop default 階段讀取 `$VIEWUI.size`。這代表 `$VIEWUI.size` 的角色是「沒有傳 prop 時的 fallback default」，而不是強制覆蓋所有元件的設定。

這個觀念非常重要。UI library 的全域設定通常是為了減少重複配置，例如希望整個系統的 button 預設都是 `large`。但是如果某個特定按鈕明確傳入 `size="small"`，這個元件仍應該尊重局部 prop，不能被全域設定覆蓋。

---

## 3. 整體概覽

### 3.1 Source Baseline

本章以 `view-ui-plus-v1.3.20` 的原始碼整理為基準。閱讀 `$VIEWUI` 時至少要看以下幾類檔案。

| Source | 完整路徑 | 閱讀重點 |
| --- | --- | --- |
| Plugin 入口 | `01-origin/source/view-ui-plus-v1.3.20/src/index.js` | 觀察 `install(app, opts)` 如何接收 options、建立 `$VIEWUI`，並寫入 `app.config.globalProperties`。 |
| 全域設定 mixin | `01-origin/source/view-ui-plus-v1.3.20/src/mixins/globalConfig.js` | 觀察元件如何在生命週期中把 `$VIEWUI` 存到 `this.globalConfig`。 |
| 型別宣告 | `01-origin/source/view-ui-plus-v1.3.20/types/index.d.ts` | 觀察 `ViewUIPlusGlobalOptions` 如何描述 install options 與 `$VIEWUI` 的 public shape。 |
| 元件原始碼 | `01-origin/source/view-ui-plus-v1.3.20/src/components/*` | 逐一確認元件是否實際讀取 `$VIEWUI`，以及讀取後如何影響 props、computed、render 或子元件 props。 |

這張表的用途不是讓你背路徑，而是幫你建立閱讀順序。先看 `src/index.js`，你會知道 `$VIEWUI` 被建立成哪些 key；再看 `types/index.d.ts`，你會知道這些 key 在 public API 中如何被描述；最後看 `src/components/*`，你才能確認它們是否真的被元件使用。

### 3.2 `$VIEWUI` 的資料流

`$VIEWUI` 的資料流可以整理成以下流程：

```txt
app.use(ViewUIPlus, options)
  -> install(app, opts)
  -> normalize opts
  -> app.config.globalProperties.$VIEWUI
  -> component instance 讀取 globalProperties.$VIEWUI
  -> 進入 prop default / mixin / computed / render / 子元件 props
```

這條資料流告訴我們，`$VIEWUI` 是從使用者安裝 View UI Plus 時傳入的 options 來的。它不會憑空出現在元件內部，也不是元件自己建立的本地資料。

更精準地說，`$VIEWUI` 的角色是「全域預設值容器」。元件只有在需要預設值或 component-specific config 時，才會主動讀取它。若某個元件完全沒有讀取 `$VIEWUI`，那它就不會因為 `$VIEWUI` 存在而改變行為。

### 3.3 本章的核心心智模型

閱讀 `$VIEWUI` 時，可以用以下心智模型判斷：

```txt
$VIEWUI 不是畫面
$VIEWUI 不是 prop
$VIEWUI 不是命令式 API
$VIEWUI 是 install 階段建立、component runtime 讀取的全域設定容器
```

這個心智模型可以避免你把 `$VIEWUI` 和 `$Message`、`$Modal` 這類 API 混淆。`$Message`、`$Modal` 的重點通常是「呼叫後產生行為」；`$VIEWUI` 的重點是「被元件讀取後提供預設設定」。

---

## 4. 核心內容逐步講解

### 4.1 `$VIEWUI` 是在 `install(app, opts)` 階段建立的

使用者在 app entry 安裝 View UI Plus 時，可以傳入全域 options：

```js
app.use(ViewUIPlus, {
    size: 'large',
    transfer: true,
    cell: {
        arrow: 'ios-arrow-forward'
    }
});
```

在 `src/index.js` 的 install 流程中，View UI Plus 會把 `opts` 整理後寫入 `app.config.globalProperties.$VIEWUI`。核心片段如下：

```js
app.config.globalProperties.$VIEWUI = {
    size: opts.size || '',
    capture: 'capture' in opts ? opts.capture : true,
    transfer: 'transfer' in opts ? opts.transfer : '',
    cell: {
        arrow: opts.cell ? opts.cell.arrow ? opts.cell.arrow : '' : '',
        customArrow: opts.cell ? opts.cell.customArrow ? opts.cell.customArrow : '' : '',
        arrowSize: opts.cell ? opts.cell.arrowSize ? opts.cell.arrowSize : '' : ''
    },
    // ...
}
```

這段程式碼有三個閱讀重點。

第一，`$VIEWUI` 是安裝階段建立的物件。使用者傳入的 `opts` 不會直接散落到每個元件，而是先被集中整理成 `$VIEWUI`。

第二，install 流程會替部分 key 建立預設值。例如 `size` 沒有傳入時會是空字串 `''`；`capture` 沒有傳入時預設為 `true`；`transfer` 若沒有出現在 `opts` 中，預設為空字串 `''`。

第三，`cell` 即使在使用者 options 中沒有提供完整設定，runtime 中仍會被建立為一個物件，並且其中的 `arrow`、`customArrow`、`arrowSize` 預設為空字串。這代表元件讀取 `$VIEWUI.cell` 時，可以期待它是一個存在的物件；但具體欄位是否有值，仍取決於使用者 options。

### 4.2 Runtime shape 與 Type declaration 要分層閱讀

`types/index.d.ts` 中的 `ViewUIPlusGlobalOptions` 描述了 install options 與 `$VIEWUI` 相關設定的 public shape。和本章基礎元件最相關的 key 可以整理如下：

| Key | Type declaration | Runtime default | 閱讀重點 |
| --- | --- | --- | --- |
| `size` | `size?: string` | `opts.size || ''` | 型別上可不傳；runtime 中沒傳會變成空字串，元件再自行判斷是否 fallback 到自己的預設尺寸。 |
| `transfer` | `transfer?: boolean \| string` | key 存在時用 `opts.transfer`，否則 `''` | 不是所有元件都讀取；在本章範圍中，`AvatarList` 會用它決定內部 `Tooltip` 的 transfer 預設。 |
| `cell.arrow` | `string` | 沒設定時 `''` | 用於 `Cell` 的預設 arrow icon 設定。 |
| `cell.customArrow` | `string` | 沒設定時 `''` | 用於 `Cell` 的自訂 arrow icon 設定。 |
| `cell.arrowSize` | `number \| string` | 沒設定時 `''` | 用於 `Cell` 的 arrow icon size 設定。 |

這裡最重要的觀念是：Type declaration 和 runtime install 解決的是不同問題。

| 層次 | 主要回答的問題 | 你應該怎麼讀 |
| --- | --- | --- |
| Type declaration | 使用者可以傳入什麼 shape？TypeScript 如何提示？ | 看 `ViewUIPlusGlobalOptions` 的欄位、型別、optional 狀態。 |
| Runtime install | 沒傳入時實際值是什麼？options 如何被 normalize？ | 看 `src/index.js` 中 `$VIEWUI` 的建立邏輯。 |
| Component runtime | 哪些元件真的讀取這個 key？讀到後如何影響行為？ | 回到 `src/components/*` 搜尋 `$VIEWUI`、`globalConfig` 或相關 prop default。 |

例如 `cell` 在型別中可以是 optional，表示使用者不一定要傳。但 plugin install 完成後，runtime `$VIEWUI.cell` 會被建立成固定物件。這種差異就是為什麼你不能只看型別宣告就下結論。

### 4.3 元件讀取方式一：Prop default 直接讀 `globalProperties`

第一種讀取模式，是元件在 prop default 中直接讀取目前 app 的 `globalProperties.$VIEWUI`。典型片段如下：

```js
default () {
    const global = getCurrentInstance().appContext.config.globalProperties;
    return !global.$VIEWUI || global.$VIEWUI.size === '' ? 'default' : global.$VIEWUI.size;
}
```

這段邏輯的意思是：當使用者沒有明確傳入該 prop 時，Vue 才會執行 `default()`。在 default function 裡，元件會取得目前 app context 的 `globalProperties`，再讀取 `$VIEWUI.size`。如果 `$VIEWUI` 不存在，或 `$VIEWUI.size` 是空字串，就回到元件自己的 `'default'`。

這可以整理成以下優先順序：

```txt
使用者明確傳入 prop
  -> 使用元件本地 prop 值

使用者沒有傳入 prop
  -> 執行 prop default()
  -> 讀取 globalProperties.$VIEWUI
  -> 若全域設定有效，使用全域預設值
  -> 若全域設定不存在或為空，使用元件自己的 fallback
```

在本章範圍中，`Button`、`ButtonGroup`、`Avatar` 的 `size` 都屬於這種模式。

這種設計的好處是：全域設定可以提供一致的預設值，但不會破壞元件局部配置。使用者若只想讓某一顆按鈕不同，仍然可以在該元件上明確傳入 `size`。

### 4.4 元件讀取方式二：透過 `globalConfig` mixin

第二種讀取模式，是元件透過 `globalConfig` mixin 把 `$VIEWUI` 存到元件實例上。`src/mixins/globalConfig.js` 會在 `created()` 中讀取：

```js
this.globalConfig = instance.appContext.config.globalProperties.$VIEWUI;
```

這代表使用了該 mixin 的元件，可以在元件內透過 `this.globalConfig` 取得 `$VIEWUI`。在本章範圍中，`Cell` 使用這個 mixin：

```txt
mixins: [ mixinsLink, globalConfig ]
```

這種模式通常更適合 component-specific config。也就是設定不是單純的通用 prop default，而是某一類元件自己的全域設定，例如 `Cell` 的 arrow icon、custom arrow icon 或 arrow size。

和 prop default 模式相比，`globalConfig` mixin 的特點是：它先把整個 `$VIEWUI` 掛到元件實例上，後續元件可以在 computed、method、render 或其他內部邏輯中讀取 `this.globalConfig`。不過，`Cell` 會讀取 `$VIEWUI.cell`，尚未提供 `Cell` 內部如何組裝 Icon 的完整細節。

此處需要後續補充：若要完整理解 `Cell` 的 arrow 行為，需要回到 `src/components/cell/cell.vue` 追蹤 `globalConfig.cell.arrow`、`globalConfig.cell.customArrow`、`globalConfig.cell.arrowSize` 最後如何進入 `Icon` 或 render 結構。

### 4.5 `$VIEWUI` 在基礎元件中的命中範圍

`07-basic-components/` 中實際命中 `$VIEWUI` 的位置。這張命中矩陣是本章最重要的索引之一。

| 元件 | Source | `$VIEWUI` key | 影響 |
| --- | --- | --- | --- |
| `Button` | `src/components/button/button.vue` | `size` | 未傳 `size` 時，決定按鈕預設尺寸。 |
| `ButtonGroup` | `src/components/button/button-group.vue` | `size` | 未傳 `size` 時，決定 button group 尺寸 class。 |
| `Avatar` | `src/components/avatar/avatar.vue` | `size` | 未傳 `size` 時，決定頭像尺寸路徑。 |
| `AvatarList` | `src/components/avatar-list/avatar-list.vue` | `transfer` | 未傳 `transfer` 時，決定內部 `Tooltip` 是否 transfer。 |
| `Cell` | `src/components/cell/cell.vue` | `cell.arrow` / `cell.customArrow` / `cell.arrowSize` | 決定預設 arrow `Icon`。 |

這張表要從兩個角度理解。

第一，它說明 `$VIEWUI` 的影響是「被讀取才生效」。例如 `Button` 會讀 `$VIEWUI.size`，所以全域 `size` 可以影響沒有明確傳入 `size` 的 `Button`。但如果某個元件沒有讀 `$VIEWUI.size`，即使全域 `size` 存在，它也不會自動受到影響。

第二，它說明不同 key 的命中方式不同。`size` 比較像共用型預設值，會被多個基礎元件讀取；`transfer` 在本章範圍中只整理到 `AvatarList`；`cell` 則是 `Cell` 自己的 component-specific config。

### 4.6 沒有命中的元件也是閱讀重點

未命中元件如下：

| 元件 | 結論 | 閱讀意義 |
| --- | --- | --- |
| `Icon` | v1.3.20 中沒有直接讀取 `$VIEWUI`。 | 不應因為 `Cell` 的 arrow 最後可能使用 `Icon`，就推論 `Icon` 自己讀取 `$VIEWUI`。 |
| `Divider` | v1.3.20 中沒有直接讀取 `$VIEWUI`。 | 即使是基礎展示元件，也不一定需要全域 config。 |
| `Tag` | v1.3.20 中沒有直接讀取 `$VIEWUI`。 | 不能因為它是基礎元件，就推論會吃 `$VIEWUI.size`。 |
| `Badge` | v1.3.20 中沒有直接讀取 `$VIEWUI`。 | 全域設定影響範圍必須回到 source 確認。 |

這些沒有命中的元件很重要，因為它們可以幫你校正閱讀假設。

初學者常見錯誤是：看到 `$VIEWUI.size` 存在，就以為所有基礎元件都支援全域尺寸。實際上，元件庫的全域設定不是魔法。它必須被某個元件明確讀取，並且把讀取結果接到 props、computed、class、render 或子元件 props 上，才會真正影響畫面。

### 4.7 本章和其他章節的關係

本章只處理 `$VIEWUI` 對基礎元件的實際影響，並把分散在不同元件中的讀取點收斂成一張地圖。

更上層的 plugin install 機制，適合回到以下章節：

```txt
04-plugin-system/04-global-options-and-viewui-config.md
05-shared-logic/04-locale-and-global-config-mixins.md
```

個別元件內部細節，則適合回到以下章節：

```txt
07-basic-components/03-button-and-button-group/
07-basic-components/06-avatar-and-avatar-list/
07-basic-components/07-cell-and-cell-group/
```

因此，本章在整個 View UI Plus 筆記系統中的位置比較像「索引圖」或「導讀地圖」。你先透過本章知道 `$VIEWUI` 命中哪些元件，再到後續元件筆記中深入追蹤它如何影響 class、render、slot 或子元件 props。

---

## 5. 表格整理

### 5.1 `$VIEWUI` 相關檔案表

| 模組 / 檔案 | 所在位置 | 負責職責 | 與其他模組的關係 | 初次閱讀重點 |
| --- | --- | --- | --- | --- |
| `src/index.js` | `01-origin/source/view-ui-plus-v1.3.20/src/index.js` | Plugin install 入口，建立 `$VIEWUI`。 | 接收 `app.use(ViewUIPlus, options)` 傳入的 `opts`，並寫入 `app.config.globalProperties`。 | 找出 `$VIEWUI` 的 key、default value 與 normalize 規則。 |
| `globalConfig.js` | `01-origin/source/view-ui-plus-v1.3.20/src/mixins/globalConfig.js` | 提供元件讀取 `$VIEWUI` 的 mixin。 | 被需要 component-specific global config 的元件混入，例如 `Cell`。 | 看它在 `created()` 階段如何設定 `this.globalConfig`。 |
| `types/index.d.ts` | `01-origin/source/view-ui-plus-v1.3.20/types/index.d.ts` | 描述 install options 與 `$VIEWUI` 相關 public shape。 | 讓 TypeScript 使用者知道可傳入哪些 key。 | 不要把 type declaration 誤當成元件實際行為。 |
| `src/components/*` | `01-origin/source/view-ui-plus-v1.3.20/src/components/*` | 各元件實際使用 `$VIEWUI` 的地方。 | 把全域設定接到 prop default、computed、render 或子元件 props。 | 搜尋 `$VIEWUI`、`globalConfig`、`transfer`、`size`、`cell` 等關鍵字。 |

這張表建議搭配搜尋工具使用。先從 `src/index.js` 建立 key 清單，再回到 `src/components/*` 搜尋這些 key 是否被讀取。不要只做全文搜尋 `$VIEWUI`，也要搜尋 `globalConfig`，因為某些元件可能不是直接寫 `$VIEWUI`，而是透過 mixin 間接讀取。

### 5.2 `$VIEWUI` key 與基礎元件關係表

| `$VIEWUI` key | 來源設定 | Runtime 預設 | 命中元件 | 作用層級 |
| --- | --- | --- | --- | --- |
| `size` | `app.use(ViewUIPlus, { size })` | `opts.size || ''` | `Button`、`ButtonGroup`、`Avatar` | 通用型 prop default。 |
| `transfer` | `app.use(ViewUIPlus, { transfer })` | key 存在時用 `opts.transfer`，否則 `''` | `AvatarList` | 子元件行為預設值，影響內部 `Tooltip`。 |
| `cell.arrow` | `app.use(ViewUIPlus, { cell: { arrow } })` | `''` | `Cell` | component-specific config。 |
| `cell.customArrow` | `app.use(ViewUIPlus, { cell: { customArrow } })` | `''` | `Cell` | component-specific config。 |
| `cell.arrowSize` | `app.use(ViewUIPlus, { cell: { arrowSize } })` | `''` | `Cell` | component-specific config。 |

這張表可以用來快速判斷「某個全域設定會影響哪些基礎元件」。但實務上仍要回到元件原始碼確認最後影響的是哪個 class、props 或 render 結構。

### 5.3 讀取模式比較表

| 讀取模式 | 代表元件 | 讀取位置 | 適合處理的設定 | 判斷重點 |
| --- | --- | --- | --- | --- |
| Prop default 直接讀 `globalProperties` | `Button`、`ButtonGroup`、`Avatar` | prop 的 `default()` function | 通用預設值，例如 `size`。 | 使用者有傳 prop 時，prop 會優先於全域設定。 |
| `globalConfig` mixin | `Cell` | mixin 的 `created()` 階段，後續透過 `this.globalConfig` 使用 | component-specific config，例如 `cell.arrow`。 | 要追蹤元件是否 mixin `globalConfig`，以及後續是否讀取 `this.globalConfig`。 |
| 子元件 props 傳遞 | `AvatarList` | 元件內部傳給 `Tooltip` | 影響內部子元件行為的預設值，例如 `transfer`。 | 要追蹤 `$VIEWUI.transfer` 最後是否傳給子元件。 |

這張比較表的目的，是避免你只用一種方式搜尋 `$VIEWUI`。在元件庫中，同一個全域設定容器可能被不同模式讀取，因此原始碼閱讀時要同時觀察 prop default、mixin、computed、render 與子元件 props。

---

## 6. 範例或情境說明

### 6.1 情境一：設定全域 `size`，但單一元件仍可覆蓋

假設使用者在安裝 View UI Plus 時設定：

```js
app.use(ViewUIPlus, {
    size: 'large'
});
```

當某個 `Button` 沒有明確傳入 `size` 時，`Button` 的 prop default 會讀取 `$VIEWUI.size`。如果 `$VIEWUI.size` 是 `'large'`，這顆按鈕就會使用全域預設尺寸。

但是如果某顆按鈕明確寫了：

```vue
<Button size="small">Submit</Button>
```

那麼這顆按鈕應該使用本地 prop 的 `small`，而不是全域的 `large`。這正是 prop default 模式的設計目的：全域設定只提供「沒有明確設定時」的預設值。

### 6.2 情境二：`AvatarList` 透過 `$VIEWUI.transfer` 影響內部 `Tooltip`

假設使用者在全域設定中提供：

```js
app.use(ViewUIPlus, {
    transfer: true
});
```

在本章整理範圍中，`AvatarList` 會在未傳入 `transfer` 時讀取 `$VIEWUI.transfer`，並用它決定內部 `Tooltip` 是否 transfer。

這裡的重點是，`transfer` 不一定直接改變 `AvatarList` 自己的外觀，而是可能作為內部子元件的行為設定。閱讀這類元件時，不只要看該元件自己的 props，也要看它是否把全域設定繼續傳給子元件。

此處需要後續補充：若要完整理解 `Tooltip` 的 transfer 行為，需要回到 `Tooltip` 元件本身分析 DOM 掛載位置與相關邏輯。

### 6.3 情境三：`Cell` 使用 `$VIEWUI.cell` 作為預設 arrow 設定

假設使用者在全域設定中提供：

```js
app.use(ViewUIPlus, {
    cell: {
        arrow: 'ios-arrow-forward',
        arrowSize: 16
    }
});
```

`Cell` 使用 `globalConfig` mixin，因此可以透過 `this.globalConfig` 取得 `$VIEWUI`。在本章範圍中，已知 `Cell` 會讀取 `cell.arrow`、`cell.customArrow`、`cell.arrowSize`，用來決定預設 arrow `Icon`。

這代表 `$VIEWUI.cell` 不是通用設定，而是 `Cell` 這一類元件自己的全域預設。這種設定適合放在 `cell` namespace 底下，避免和其他元件的設定混在一起。

### 6.4 情境四：設定了 `$VIEWUI.size`，但 `Tag` 不一定會改變

假設使用者設定：

```js
app.use(ViewUIPlus, {
    size: 'large'
});
```

初學者可能會推論：既然 `Tag` 是基礎元件，那它也會使用全域 `size`。`Tag` 在 v1.3.20 中沒有直接讀取 `$VIEWUI`。因此不能只因為 `$VIEWUI.size` 存在，就認定 `Tag` 會跟著變大。

這個情境是閱讀 UI library 原始碼時的典型提醒：全域設定的影響範圍不是靠直覺推論，而是靠 source code 驗證。

---

## 7. 閱讀路線或學習路線

### 7.1 初次閱讀路線

第一次閱讀 `$VIEWUI` 時，建議按照以下順序進行。

第一步，先讀 `src/index.js`。目標是找出 `install(app, opts)` 如何建立 `$VIEWUI`，以及 `$VIEWUI` 中有哪些 key、每個 key 的 runtime default 是什麼。這一步要先建立「全域設定入口」的理解。

第二步，閱讀 `types/index.d.ts`。目標是對照 `ViewUIPlusGlobalOptions` 如何描述這些 options。這一步不是為了推論元件行為，而是為了理解 public API 的 shape。

第三步，回到 `src/components/*` 搜尋 `$VIEWUI`、`globalConfig`、`size`、`transfer`、`cell`。目標是確認哪些元件真的讀取全域設定。

第四步，把命中的元件整理成矩陣。至少要記錄元件名稱、source path、命中的 `$VIEWUI` key，以及它影響的是 prop default、computed、render 還是子元件 props。

第五步，整理沒有命中的元件。這一步很容易被忽略，但它可以防止你過度推論全域設定的影響範圍。

### 7.2 深入閱讀路線

當你已經知道哪些元件命中 `$VIEWUI` 後，可以進一步深入每個元件的內部流程。

對 `Button`、`ButtonGroup`、`Avatar`，應該追蹤 `size` prop default 之後，該 prop 如何進入 computed class 或 render 結果。這樣才能理解全域 `size` 最後如何影響 UI。

對 `AvatarList`，應該追蹤 `$VIEWUI.transfer` 如何成為內部 `Tooltip` 的 props。這可以幫你理解父元件如何把全域預設值傳遞給子元件。

對 `Cell`，應該追蹤 `globalConfig` mixin 如何注入 `this.globalConfig`，以及 `cell.arrow`、`cell.customArrow`、`cell.arrowSize` 最後如何影響 `Icon`。

### 7.3 可以暫時跳過的部分

如果你的目標只是建立 `$VIEWUI` 的閱讀地圖，可以先暫時跳過以下內容。

第一，可以先跳過完整 CSS class 細節。除非你已經開始研究 `$VIEWUI.size` 對實際樣式的影響，否則不需要一開始就追所有樣式檔。

第二，可以先跳過 `Tooltip` transfer 的完整實作。此時只需要知道 `AvatarList` 會把 `transfer` 作為內部 `Tooltip` 的設定即可。

第三，可以先跳過 `Icon` 的完整 render 細節。對本章來說，重點是 `Cell` 會讀取 `$VIEWUI.cell` 來決定預設 arrow `Icon`；至於 Icon 自己如何 render，適合放到元件細節章節。

---

## 8. 常見誤區

| 誤區 | 為什麼容易誤解 | 正確理解 |
| --- | --- | --- |
| 把 `$VIEWUI` 當成元件 prop | 因為它會影響部分元件預設值，看起來像是元件 props 的來源。 | `$VIEWUI` 是 plugin install 寫入 `globalProperties` 的 runtime config container，不是單一元件 prop。 |
| 把 `$VIEWUI` 當成 `$Message`、`$Modal` 一樣的命令式 API | 它同樣以 `$` 開頭，也掛在全域可讀的位置。 | `$VIEWUI` 主要被元件內部讀取；它本身不渲染 UI，也不是讓使用者直接呼叫來產生 UI。 |
| 看到 `size` 存在，就推論所有基礎元件都支援全域尺寸 | UI library 常見全域 size 設定，容易讓人憑經驗推論。 | v1.3.20 中只確認 `Button`、`ButtonGroup`、`Avatar` 等實際讀取者會受影響。 |
| 看到 type declaration 有 key，就認為元件一定使用 | TypeScript 型別看起來像正式 API，容易被誤認為 runtime 行為。 | Type declaration 只描述可傳入 shape；元件是否使用仍要看 runtime source。 |
| 認為 `globalConfig` mixin 是唯一讀取 `$VIEWUI` 的方式 | `Cell` 使用 mixin，容易讓人以為所有元件都照這種模式。 | 很多元件是在 prop default 中直接讀 `globalProperties.$VIEWUI`。 |
| 忽略沒有命中的元件 | 原始碼閱讀時容易只記錄「有用到」的地方。 | 沒有命中的元件是重要對照組，可以防止過度推論全域設定影響範圍。 |

---

## 9. 本章總結

`$VIEWUI` 是 View UI Plus 在 plugin install 階段建立的全域預設值容器。它的來源是使用者呼叫 `app.use(ViewUIPlus, options)` 時傳入的 options，經由 `src/index.js` 的 `install(app, opts)` 流程整理後，寫入 `app.config.globalProperties.$VIEWUI`。

閱讀 `$VIEWUI` 時，不能只看某一層。`types/index.d.ts` 告訴你使用者可以傳入什麼 shape，但不代表元件一定會使用；`src/index.js` 告訴你 runtime `$VIEWUI` 會被建立成什麼樣子，但也不代表所有 key 都會影響所有元件；只有回到 `src/components/*`，確認元件是否真的讀取 `$VIEWUI`，才能判斷全域設定的實際影響範圍。

在本章整理的基礎元件中，`Button`、`ButtonGroup`、`Avatar` 會透過 prop default 讀取 `$VIEWUI.size`；`AvatarList` 會讀取 `$VIEWUI.transfer` 來決定內部 `Tooltip` 的 transfer 預設；`Cell` 會透過 `globalConfig` mixin 讀取 `$VIEWUI.cell` 相關設定。相對地，`Icon`、`Divider`、`Tag`、`Badge` 在 v1.3.20 中沒有直接讀取 `$VIEWUI`，因此不能推論它們會被全域設定直接影響。

可以把本章的完整閱讀順序記成以下流程：

```txt
install 建立了哪些 key
  -> type declaration 如何描述這些 key
  -> 哪些 component 實際讀取這些 key
  -> 讀取結果如何進入 props default、computed、render 或子元件 props
  -> 哪些元件沒有讀取，應作為影響範圍的邊界
```

這套閱讀方式不只適用於 `$VIEWUI`，也適合用來分析其他 UI library 的全域設定系統。

---

## 10. 自我檢查問題

1. `$VIEWUI` 是在哪個檔案、哪個流程中建立的？它最後被寫入哪個 Vue app 層級的位置？
2. 為什麼不能把 `$VIEWUI` 當成某個元件的 prop？它和一般元件 prop 的生命週期與作用範圍有什麼不同？
3. `$VIEWUI` 和 `$Message`、`$Modal` 這類命令式 API 的差異是什麼？
4. `types/index.d.ts` 中的 `ViewUIPlusGlobalOptions` 能告訴你什麼？又不能告訴你什麼？
5. 為什麼 `cell` 在 type declaration 中可以是 optional，但 runtime `$VIEWUI.cell` 仍可能被建立成固定物件？
6. `Button.size` 為什麼要看 prop default，而不是只看 computed class？
7. 當使用者同時設定全域 `size: 'large'`，又在某個 `Button` 上傳入 `size="small"`，應該以哪個值為準？為什麼？
8. `Cell` 為什麼適合透過 `globalConfig` mixin 讀取 `$VIEWUI.cell`，而不是只用通用的 `size` prop default 模式？
9. `AvatarList` 讀取 `$VIEWUI.transfer` 後，實際影響的是自己本身，還是內部子元件？這對閱讀元件原始碼有什麼提醒？
10. 為什麼 `Icon`、`Divider`、`Tag`、`Badge` 應該被列為不受 `$VIEWUI` 直接影響的對照組？

---

## 11. 後續延伸方向

後續可以把本章拆成以下幾篇更深入的筆記。

### 11.1 `$VIEWUI.size` 專題

深入分析 `Button`、`ButtonGroup`、`Avatar` 如何讀取 `$VIEWUI.size`，以及 `size` 最後如何進入 props、computed class、render 結果與 CSS class。

### 11.2 `$VIEWUI.transfer` 專題

深入分析 `AvatarList` 如何使用 `$VIEWUI.transfer`，並延伸到 `Tooltip` 的 transfer 行為、DOM 掛載位置與浮層元件設計。

### 11.3 `$VIEWUI.cell` 專題

深入分析 `Cell` 如何透過 `globalConfig` mixin 取得 `$VIEWUI.cell`，以及 `arrow`、`customArrow`、`arrowSize` 如何影響預設 arrow `Icon`。

### 11.4 Plugin install 與全域設定設計

從 `src/index.js` 出發，完整整理 View UI Plus 的 install 流程，包括元件註冊、全域屬性掛載、locale、config normalize 與其他 plugin-level behavior。

### 11.5 Type declaration 與 runtime source 對照

以 `types/index.d.ts` 和 `src/index.js` 為主，整理 TypeScript public API 和 runtime implementation 之間的差異，建立閱讀元件庫型別宣告的習慣。

### 11.6 全域設定測試案例設計

為 `$VIEWUI.size`、`$VIEWUI.transfer`、`$VIEWUI.cell` 設計測試案例，確認「未傳 prop 時使用全域預設」、「明確傳 prop 時覆蓋全域預設」、「未命中元件不受影響」等行為。
