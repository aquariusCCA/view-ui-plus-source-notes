# `$VIEWUI.transfer` 在基礎元件中的實際落點：從全域設定到 `AvatarList` 內部 `Tooltip`

## 0. 原始筆記問題分析

這份原始筆記已經抓到 `$VIEWUI.transfer` 在 `07-basic-components/` 範圍內最重要的結論：它不是所有基礎元件都會使用的通用設定，而是目前集中落在 `AvatarList`，再由 `AvatarList` 傳給內部的 `Tooltip`。

不過，如果要把這份筆記放進長期學習用的知識庫，仍然可以再補強幾個面向。

第一，原始筆記雖然有列出 `$VIEWUI.transfer` 的來源與 `AvatarList.transfer` 的 default 邏輯，但還需要更清楚說明為什麼 `transfer` 這類設定通常會出現在浮層元件中。對初學者來說，若不先理解「浮層掛載位置」這個背景，就容易把 `transfer` 誤解成一般 CSS layout 設定。

第二，原始筆記已經指出 `AvatarList` 會把 `transfer` 傳給 `Tooltip`，但還可以補成更完整的資料流：`install options` 如何進入 `$VIEWUI.transfer`，`AvatarList.transfer` 如何用它當 fallback，最後又在什麼條件下才真的渲染 `Tooltip`。

第三，原始筆記中的命中矩陣非常重要，但目前偏向結論表。為了讓筆記更適合複習，應該補上「為什麼其他基礎元件不算命中」的判斷方法。閱讀 View UI Plus 原始碼時，不能看到全域 options 存在就推論所有元件都會受影響，而是要回到元件是否實際讀取該 key。

第四，這份筆記可以和 `$VIEWUI.size` 做比較。`size` 最後通常會進入 class 或 inline style；`transfer` 則是傳給浮層元件，改變 DOM 掛載策略。兩者都是 top-level global options，但語意完全不同。

第五，原始筆記沒有展開 `Tooltip` 內部如何根據 `transfer` 決定掛載位置。由於目前提供的筆記只涵蓋 `AvatarList` 到 `Tooltip` 的傳遞，不應編造 `Tooltip` 內部細節；這一段應標註為後續可獨立閱讀的主題。

---

## 1. 本章定位

本章是一篇「原始碼閱讀筆記」加上「全域設定行為分析筆記」。它的目標不是教你如何使用 `AvatarList` 做完整 UI，也不是深入分析 `Tooltip` 的浮層掛載實作，而是建立一張清楚的 `$VIEWUI.transfer` 影響地圖。

讀完本章後，你應該能回答四個問題：

1. `$VIEWUI.transfer` 是在 View UI Plus 的哪個階段建立的。
2. 在 `07-basic-components/` 範圍內，哪個基礎元件會直接讀取 `$VIEWUI.transfer`。
3. `AvatarList.transfer` 如何把全域設定轉交給內部的 `Tooltip`。
4. 為什麼 `$VIEWUI.transfer` 不應該被理解成所有基礎元件的通用行為開關。

本章處理的核心路徑如下：

```txt
app.use(ViewUIPlus, { transfer })
  -> install(app, opts)
  -> app.config.globalProperties.$VIEWUI.transfer
  -> AvatarList.transfer prop default
  -> Tooltip.transfer prop
  -> Tooltip 的浮層掛載策略
```

本章不深入處理以下內容：

- `Tooltip` 元件內部如何根據 `transfer` 選擇掛載容器。
- `Poptip`、`Dropdown`、`Select`、`Modal` 等其他浮層類元件的 `transfer` 行為。
- 非 `07-basic-components/` 目錄中的全域 `transfer` 命中情況。

這些主題適合在後續的「浮層系統」、「Portal / Teleport 機制」或「Overlay 類元件架構」筆記中獨立展開。

---

## 2. 學習前先建立的基本觀念

### 2.1 `transfer` 不是一般樣式設定，而是浮層掛載策略

在 UI 元件庫中，`transfer` 這類設定通常和「浮層」有關。所謂浮層，指的是那些視覺上會浮在一般內容上方的 UI，例如：

- `Tooltip`
- `Poptip`
- `Dropdown`
- `Select` 的下拉選單
- `Modal`
- `DatePicker` 的面板

這些元件常常會遇到一個問題：浮層如果直接渲染在原本元件所在的 DOM 層級，可能會被父層的 `overflow: hidden`、`z-index`、`position` 或 stacking context 影響，導致畫面被裁切或層級錯亂。

因此，許多元件庫會提供類似 `transfer` 的功能，讓浮層內容可以被移動到更高層級的容器，例如 `body` 或某個指定容器。這樣做的目的不是改變元件本身的外觀，而是改變浮層在 DOM 中的掛載位置。

所以在閱讀 `$VIEWUI.transfer` 時，要先建立一個關鍵觀念：

```txt
transfer 關心的不是「元件長什麼樣子」，
而是「浮層內容掛載在哪裡」。
```

### 2.2 `$VIEWUI.transfer` 是全域預設值，不是強制覆蓋

View UI Plus 透過 plugin install 階段建立 `$VIEWUI`，並把它掛到 Vue app 的 `globalProperties` 上。這讓元件可以在 runtime 讀取全域設定。

但 `$VIEWUI.transfer` 並不是用來覆蓋所有元件的本地 prop。它比較像一個 fallback default：當元件本身沒有明確傳入 `transfer` prop 時，才有機會讀取全域設定作為預設值。

因此，閱讀 `$VIEWUI.transfer` 時要分清楚兩種層次：

| 層次 | 說明 |
| --- | --- |
| 全域設定 | 使用者在 `app.use(ViewUIPlus, { transfer })` 傳入的預設值。 |
| 元件 prop | 使用者在個別元件上傳入的本地設定，通常優先於全域預設值。 |

這個優先序是理解 `$VIEWUI` 類設定的核心。全域設定的價值在於提供一致的預設行為，而不是取消元件本身的可配置性。

### 2.3 基礎元件不等於都會接入全域設定

`07-basic-components/` 中包含許多基礎元件，例如 `Button`、`Avatar`、`Icon`、`Divider`、`Tag`、`Badge`、`Cell` 等。這些元件雖然都屬於基礎層，但並不代表它們都會讀取 `$VIEWUI.transfer`。

判斷一個元件是否受 `$VIEWUI.transfer` 影響，不能只看它是否位於基礎元件目錄，也不能只看 View UI Plus 是否有提供 `transfer` 全域設定。正確判斷方式是：

```txt
該元件的 source 是否實際讀取 globalProperties.$VIEWUI.transfer？
該元件是否把讀到的 transfer 傳給浮層子元件？
該元件是否在某些條件下才渲染浮層？
```

這也是本章要建立的原始碼閱讀方法。

---

## 3. 整體概覽

### 3.1 本章 Source Baseline

本章主要關注以下 source：

| Source | 閱讀重點 |
| --- | --- |
| `src/index.js` | `install(app, opts)` 如何建立 `$VIEWUI.transfer`。 |
| `src/components/avatar-list/avatar-list.vue` | `AvatarList.transfer` 如何讀取 `$VIEWUI.transfer`，以及如何傳給內部 `Tooltip`。 |
| `Tooltip` 相關 source | 此處需要後續補充。本章只追蹤到 `AvatarList` 把 `transfer` 傳入 `Tooltip`，不展開 `Tooltip` 內部實作。 |

完整路徑依原始筆記脈絡可對應到：

```txt
01-origin/source/view-ui-plus-v1.3.20/src/index.js
01-origin/source/view-ui-plus-v1.3.20/src/components/avatar-list/avatar-list.vue
```

### 3.2 `$VIEWUI.transfer` 的宏觀資料流

本章可以用一條資料流理解：

```txt
使用者安裝 View UI Plus
  -> 傳入 install options
  -> install 建立 $VIEWUI.transfer
  -> AvatarList 未傳 transfer prop 時讀取全域預設
  -> AvatarList 根據 tooltip 條件決定是否渲染 Tooltip
  -> 若 Tooltip 被渲染，transfer 被傳給 Tooltip
```

換成更接近程式碼閱讀的角度：

```txt
app.use(ViewUIPlus, { transfer: true })
  -> src/index.js
  -> app.config.globalProperties.$VIEWUI.transfer = true
  -> avatar-list.vue props.transfer.default()
  -> this.transfer
  -> <Tooltip :transfer="transfer">
```

這裡要注意，`AvatarList` 自己不是浮層元件。它只是「可能會使用浮層」的聚合型基礎元件。真正接收 `transfer` 並負責浮層掛載策略的是內部的 `Tooltip`。

### 3.3 本章的核心判斷

本章最重要的結論是：

```txt
在 07-basic-components/ 範圍內，
$VIEWUI.transfer 的直接命中點是 AvatarList，
而且它的實際落點是 AvatarList 內部的 Tooltip。
```

這句話包含三層意思：

1. `AvatarList` 會直接讀取 `$VIEWUI.transfer`。
2. `AvatarList` 讀取後不是改變自己的根 DOM，而是把值傳給 `Tooltip`。
3. 如果 `Tooltip` 沒有被渲染，`transfer` 就沒有實際畫面效果。

---

## 4. 核心內容逐步講解

### 4.1 `$VIEWUI.transfer` 的建立：為什麼使用 key-existence 判斷

在 `src/index.js` 中，`$VIEWUI.transfer` 的建立方式如下：

```js
transfer: 'transfer' in opts ? opts.transfer : ''
```

這段程式碼看起來很短，但它和 `$VIEWUI.size` 的寫法有明顯差異。`size` 常見寫法是：

```js
size: opts.size || ''
```

而 `transfer` 沒有使用 `opts.transfer || ''`，而是使用：

```js
'transfer' in opts ? opts.transfer : ''
```

這是因為 `transfer` 是布林語意設定，`false` 是有意義的值。如果使用 `opts.transfer || ''`，那麼當使用者明確設定：

```js
app.use(ViewUIPlus, {
    transfer: false
});
```

`false` 會因為是 falsy value 而被轉成空字串 `''`。這樣就無法分辨「使用者沒有設定」與「使用者明確設定 false」。

因此，這裡使用 key-existence 判斷，是為了保留三種狀態：

| install option | `$VIEWUI.transfer` | 語意 |
| --- | --- | --- |
| 未傳 `transfer` | `''` | 沒有全域 transfer 設定，交給元件本地預設值。 |
| `transfer: true` | `true` | 全域預設啟用 transfer。 |
| `transfer: false` | `false` | 全域預設明確停用 transfer。 |

這個設計對布林設定很重要。因為在元件庫中，`false` 往往不是「沒有值」，而是一個明確的使用者選擇。

### 4.2 `AvatarList.transfer`：從全域設定取得本地 prop default

在 `src/components/avatar-list/avatar-list.vue` 中，`AvatarList` 定義了自己的 `transfer` prop：

```js
transfer: {
    type: Boolean,
    default () {
        const global = getCurrentInstance().appContext.config.globalProperties;
        return !global.$VIEWUI || global.$VIEWUI.transfer === '' ? false : global.$VIEWUI.transfer;
    }
}
```

這段 default function 的工作是：當使用者沒有在 `AvatarList` 上明確傳入 `transfer` 時，才去讀取 `$VIEWUI.transfer`。

它可以整理成以下流程：

```txt
使用者有傳 AvatarList.transfer
  -> Vue 使用使用者傳入的 prop 值

使用者沒有傳 AvatarList.transfer
  -> 執行 default()
  -> 讀取 globalProperties.$VIEWUI.transfer
      -> 如果沒有 $VIEWUI，使用 false
      -> 如果 $VIEWUI.transfer === ''，使用 false
      -> 否則使用 $VIEWUI.transfer
```

換句話說，`AvatarList` 的本地預設值是 `false`。全域設定只有在它存在且不等於空字串時，才會成為 `AvatarList.transfer` 的預設值。

這裡要特別注意：`AvatarList.transfer` 的型別是 `Boolean`。也就是說，雖然 `$VIEWUI.transfer` 在 install 階段可能是 `boolean | string` 這類較寬鬆的值，但進入 `AvatarList` prop 後，語意上應被視為布林開關。

### 4.3 `AvatarList` 不自己實作浮層，而是把 `transfer` 傳給 `Tooltip`

`AvatarList` 的核心不是浮層本身，而是頭像列表。當每個頭像項目需要顯示提示文字時，它會透過 `Tooltip` 包住 `Avatar`：

```vue
<Tooltip
    :content="item.tip"
    v-if="tooltip && item.tip"
    :placement="placement"
    :transfer="transfer">
    <Avatar :src="item.src" :size="size" :shape="shape"></Avatar>
</Tooltip>
```

這段 template 是理解 `$VIEWUI.transfer` 實際落點的關鍵。

資料流可以整理成：

```txt
$VIEWUI.transfer
  -> AvatarList.transfer default
  -> this.transfer
  -> <Tooltip :transfer="transfer">
  -> Tooltip 決定提示層掛載方式
```

因此，`$VIEWUI.transfer` 對 `AvatarList` 的影響不是改變 `AvatarList` 本身的排列方式，也不是改變 `Avatar` 的尺寸或形狀。它真正影響的是：

```txt
AvatarList 內部 Tooltip 的浮層是否使用 transfer 掛載策略。
```

這種關係在元件庫中很常見：某個基礎元件本身不是浮層元件，但因為它內部組合了浮層子元件，所以會把某些浮層設定傳遞下去。

### 4.4 `Tooltip` 出現條件：不是有 `transfer` 就一定有浮層效果

原始筆記中特別指出，`transfer` 只有在 `Tooltip` 被渲染時才有實際效果。這一點非常重要。

`Tooltip` 的渲染條件是：

```txt
tooltip && item.tip
```

也就是說，需要同時滿足兩個條件：

1. `AvatarList` 的 `tooltip` 功能是啟用的。
2. 當前 item 具有 `tip` 內容。

整理成表格：

| 條件 | 結果 | `transfer` 是否有實際效果 |
| --- | --- | --- |
| `tooltip=true` 且 `item.tip` 有值 | 會渲染 `Tooltip` | 有機會產生實際效果 |
| `tooltip=false` | 不渲染 `Tooltip` | 沒有實際效果 |
| `item.tip` 是空值 | 不渲染 `Tooltip` | 沒有實際效果 |

所以即使全域設定是：

```js
app.use(ViewUIPlus, {
    transfer: true
});
```

如果 `AvatarList` 沒有開啟 tooltip，或 item 沒有 `tip`，那麼畫面上就不會出現 `Tooltip`，`transfer` 也沒有實際作用。

這也是閱讀原始碼時要特別注意的地方：讀到 prop 傳遞還不夠，還要看承接該 prop 的子元件是否真的被渲染。

### 4.5 `AvatarList` 與 `Avatar` 的分工：`transfer` 不會傳給 `Avatar`

`AvatarList` 內部也會渲染 `Avatar`：

```vue
<Avatar :src="item.src" :size="size" :shape="shape"></Avatar>
```

但是，`transfer` 不會傳給 `Avatar`。`Avatar` 接收的是和頭像本身相關的資訊，例如：

- `src`
- `size`
- `shape`

而 `transfer` 是傳給 `Tooltip`：

```vue
<Tooltip :transfer="transfer">
```

因此，`AvatarList` 內部的分工可以這樣理解：

```txt
AvatarList
  -> Avatar：負責單顆頭像的內容、尺寸、形狀。
  -> Tooltip：負責提示文字與浮層掛載行為。
```

這也是為什麼本章要把 `$VIEWUI.transfer` 歸類成 `AvatarList` 的「聚合提示行為」，而不是歸類成 `Avatar` 的行為。

如果只從元件名稱看，很容易誤以為 `AvatarList` 的設定都會影響 `Avatar`；但從 template 來看，`transfer` 的實際接收者是 `Tooltip`。

---

## 5. 表格整理

### 5.1 `$VIEWUI.transfer` 來源與預設值表

| 使用者安裝寫法 | `$VIEWUI.transfer` runtime 值 | 語意 |
| --- | --- | --- |
| `app.use(ViewUIPlus)` | `''` | 未設定全域 transfer，由元件 local default 決定。 |
| `app.use(ViewUIPlus, { transfer: true })` | `true` | 全域預設啟用 transfer。 |
| `app.use(ViewUIPlus, { transfer: false })` | `false` | 全域預設明確停用 transfer。 |

這張表的閱讀重點是：`false` 必須被保留下來，不能被當成「沒有設定」。因此 `src/index.js` 使用 `'transfer' in opts` 判斷，而不是使用 truthy fallback。

### 5.2 `AvatarList.transfer` default 判斷表

| 狀況 | `AvatarList.transfer` 結果 | 說明 |
| --- | --- | --- |
| 使用者直接傳 `transfer` prop | 使用 prop 值 | 個別元件設定優先於全域預設。 |
| 未傳 prop，且沒有 `$VIEWUI` | `false` | 沒有全域設定時，使用本地預設。 |
| 未傳 prop，且 `$VIEWUI.transfer === ''` | `false` | 全域未設定時，使用本地預設。 |
| 未傳 prop，且 `$VIEWUI.transfer === true` | `true` | 讀取全域預設。 |
| 未傳 prop，且 `$VIEWUI.transfer === false` | `false` | 讀取使用者明確設定的全域 false。 |

這張表要搭配 Vue prop default 機制一起看。只有「未傳 prop」時，default function 才會執行；如果使用者在 `<AvatarList>` 上明確傳入 `transfer`，就不需要再讀 `$VIEWUI.transfer` 作為 fallback。

### 5.3 基礎元件範圍內的 `$VIEWUI.transfer` 命中矩陣

| 元件 | 是否直接讀 `$VIEWUI.transfer` | 實際落點 | 閱讀重點 |
| --- | --- | --- | --- |
| `AvatarList` | 是 | 傳給內部 `Tooltip.transfer` | `AvatarList` 本身不是浮層，實際效果發生在 `Tooltip`。 |
| `Avatar` | 否 | 無 | `Avatar` 負責頭像內容、尺寸、形狀，不處理浮層掛載。 |
| `Button` | 否 | 無 | 不處理浮層，也沒有讀取 `$VIEWUI.transfer`。 |
| `ButtonGroup` | 否 | 無 | 處理按鈕群組樣式，不處理浮層掛載。 |
| `Cell` | 否 | 無 | 讀 `$VIEWUI.cell`，不是 `$VIEWUI.transfer`。 |
| `Icon` | 否 | 無 | 單純圖示元件，不處理浮層。 |
| `Divider` | 否 | 無 | 分隔線元件，不處理浮層。 |
| `Tag` | 否 | 無 | 標籤元件，不處理浮層。 |
| `Badge` | 否 | 無 | 徽章元件，不處理浮層掛載。 |

這張命中矩陣的價值在於建立「正例」與「反例」。`AvatarList` 是正例，因為它直接讀 `$VIEWUI.transfer`；其他元件是反例，提醒我們不要把全域設定推論成所有基礎元件的共同能力。

### 5.4 `$VIEWUI.size` 與 `$VIEWUI.transfer` 的比較

| 設定 | 基礎元件影響 | 最後流向 | 行為類型 |
| --- | --- | --- | --- |
| `$VIEWUI.size` | `Button`、`ButtonGroup`、`Avatar` | class 或 inline style | 視覺尺寸預設。 |
| `$VIEWUI.transfer` | `AvatarList` | `Tooltip.transfer` | 浮層掛載策略預設。 |

這個比較能幫助你建立 `$VIEWUI` 的閱讀模型：同樣是 top-level global option，不代表它們的作用方式相同。`size` 多半會走向元件樣式；`transfer` 則會走向浮層元件的掛載策略。

---

## 6. 範例或情境說明

### 6.1 情境一：全域啟用 transfer，`AvatarList` 未傳 prop

假設使用者在安裝 View UI Plus 時設定：

```js
app.use(ViewUIPlus, {
    transfer: true
});
```

然後使用 `AvatarList`：

```vue
<AvatarList
    :list="users"
    tooltip />
```

如果 `users` 中的 item 有 `tip` 欄位，流程會是：

```txt
$VIEWUI.transfer = true
  -> AvatarList 未傳 transfer prop
  -> AvatarList.transfer default 讀到 true
  -> Tooltip 被渲染
  -> Tooltip 收到 transfer=true
```

在這種情境下，`$VIEWUI.transfer` 才會真正影響 `Tooltip` 的掛載策略。

### 6.2 情境二：全域啟用 transfer，但 item 沒有 `tip`

假設全域仍然是：

```js
app.use(ViewUIPlus, {
    transfer: true
});
```

但 `AvatarList` 的 item 沒有 `tip`：

```js
const users = [
    { src: '/user-a.png' },
    { src: '/user-b.png' }
];
```

此時即使 `$VIEWUI.transfer` 是 `true`，`Tooltip` 也不會被渲染，因為條件 `tooltip && item.tip` 不成立。

流程可以理解成：

```txt
$VIEWUI.transfer = true
  -> AvatarList.transfer = true
  -> item.tip 不存在
  -> Tooltip 不渲染
  -> transfer 沒有實際畫面效果
```

這個例子說明：全域設定存在，不代表畫面一定會發生可見變化。還要看使用該設定的分支是否真的執行。

### 6.3 情境三：全域啟用 transfer，但局部關閉

假設全域設定是：

```js
app.use(ViewUIPlus, {
    transfer: true
});
```

但某個 `AvatarList` 明確傳入：

```vue
<AvatarList
    :list="users"
    tooltip
    :transfer="false" />
```

此時局部 prop 會優先：

```txt
使用者明確傳入 AvatarList.transfer=false
  -> 不執行 default fallback
  -> 不讀 $VIEWUI.transfer 作為預設
  -> Tooltip 收到 transfer=false
```

這個情境可以幫助你理解 `$VIEWUI` 的定位：它是全域預設值，不是不可覆蓋的強制規則。

---

## 7. 閱讀路線或學習路線

### 7.1 初次閱讀路線

第一次閱讀這條線時，建議按照以下順序：

1. 先讀 `src/index.js`  
   目的是確認 `$VIEWUI.transfer` 是如何從 install options 進入 runtime config。這裡要特別觀察 `'transfer' in opts ? opts.transfer : ''` 的寫法，理解為什麼它要保留 `false`。

2. 再讀 `src/components/avatar-list/avatar-list.vue` 的 `props`  
   目的是確認 `AvatarList.transfer` 是否真的讀取 `$VIEWUI.transfer`。閱讀時要注意 default function 的 fallback 條件。

3. 接著讀 `AvatarList` 的 template  
   目的是確認 `transfer` 最後傳給誰。你會看到它不是傳給 `Avatar`，而是傳給 `Tooltip`。

4. 最後回到命中矩陣  
   目的是建立範圍意識：在 `07-basic-components/` 中，目前直接命中 `$VIEWUI.transfer` 的基礎元件是 `AvatarList`，不能擴大推論到所有基礎元件。

### 7.2 深入閱讀路線

如果要深入理解 `transfer` 的完整行為，後續可以繼續讀：

1. `Tooltip` 元件內部實作  
   觀察 `Tooltip.transfer` 如何影響浮層掛載。此處需要後續補充。

2. 其他浮層類元件  
   例如 `Poptip`、`Dropdown`、`Select`、`Modal`。這些元件是否也讀取 `$VIEWUI.transfer`，需要回到各自 source 驗證。

3. Vue 3 的掛載與傳送機制  
   如果 View UI Plus 的實作涉及類似 `Teleport`、手動 DOM 搬移或 portal pattern，應該另外整理成獨立筆記。

### 7.3 可以暫時跳過的部分

如果你目前只在整理 `07-basic-components/`，可以暫時跳過：

- `Tooltip` 內部完整定位演算法。
- 浮層的動畫、事件監聽與銷毀流程。
- 所有高階業務元件的 `transfer` 行為。

本章只需要先掌握「`AvatarList` 如何接入 `$VIEWUI.transfer` 並傳給 `Tooltip`」即可。

---

## 8. 常見誤區

| 誤區 | 為什麼容易誤解 | 正確理解 |
| --- | --- | --- |
| `AvatarList` 自己實作了浮層 | 因為 `transfer` prop 出現在 `AvatarList` 上，看起來像是 `AvatarList` 自己處理浮層。 | `AvatarList` 是把 `transfer` 傳給內部 `Tooltip`，浮層能力來自 `Tooltip`。 |
| 設定 `$VIEWUI.transfer=true` 一定會讓 `AvatarList` DOM 改變 | 容易把全域設定理解成必然生效的開關。 | 只有 `Tooltip` branch 被渲染時，`transfer` 才有實際效果。 |
| `Avatar` 也會受 `transfer` 影響 | `AvatarList` 內部會渲染 `Avatar`，所以容易誤以為所有設定都傳給 `Avatar`。 | `Avatar` 接收的是 `src`、`size`、`shape`，不是 `transfer`。 |
| 所有基礎元件都有 `transfer` | 因為 `transfer` 是全域設定，容易被過度泛化。 | 在 v1.3.20 的基礎元件範圍內，原始筆記只確認 `AvatarList` 直接讀取。 |
| `transfer: false` 等同於沒有設定 | 因為 JavaScript 中 `false` 是 falsy value。 | `false` 是明確設定，所以 `src/index.js` 用 key-existence 判斷保留它。 |
| 只要看到 type declaration 有 `transfer`，就代表所有元件都使用 | 型別宣告描述 public option shape，不能代表 runtime 命中情況。 | 必須回到元件 source，確認是否實際讀取 `$VIEWUI.transfer`。 |

---

## 9. 本章總結

`$VIEWUI.transfer` 在基礎元件中的落點很窄，但它非常適合用來訓練原始碼閱讀時的「資料流追蹤能力」。

從 install 階段來看，`transfer` 被寫入：

```txt
app.config.globalProperties.$VIEWUI.transfer
```

而且它使用 key-existence 判斷，是為了保留 `false` 這個有效設定值。這一點和 `$VIEWUI.size` 使用 truthy fallback 的行為不同。

從基礎元件範圍來看，直接讀取 `$VIEWUI.transfer` 的重點元件是 `AvatarList`。但 `AvatarList` 本身不是浮層元件，它只是把 `transfer` 傳給內部的 `Tooltip`：

```txt
$VIEWUI.transfer
  -> AvatarList.transfer
  -> Tooltip.transfer
```

因此，`$VIEWUI.transfer` 不應被理解成基礎元件的通用 layout 設定，也不應被理解成會影響所有 `Avatar`。它真正控制的是：當 `AvatarList` 需要顯示 `Tooltip` 時，內部 `Tooltip` 是否採用 transfer 掛載策略。

這份筆記的核心心智模型可以濃縮成一句話：

```txt
$VIEWUI.transfer 是浮層掛載策略的全域預設值；
在基礎元件範圍內，它透過 AvatarList 傳遞給 Tooltip，而不是直接改變所有基礎元件。
```

---

## 10. 自我檢查問題

1. `$VIEWUI.transfer` 是在哪個階段被建立的？它被存放在哪個物件上？
2. 為什麼 `src/index.js` 中的 `transfer` 使用 `'transfer' in opts` 判斷，而不是 `opts.transfer || ''`？
3. 如果使用者完全沒有設定 `transfer`，`$VIEWUI.transfer` 的 runtime 值是什麼？
4. `AvatarList.transfer` 的 local default 是什麼？它在什麼條件下會讀取 `$VIEWUI.transfer`？
5. `AvatarList` 中 `Tooltip` 的渲染條件是什麼？
6. `transfer` 最後是傳給 `Avatar` 還是 `Tooltip`？這代表什麼設計分工？
7. 為什麼 `$VIEWUI.transfer=true` 不一定會讓畫面出現可見變化？
8. 在 `07-basic-components/` 範圍內，哪些元件不應被列為 `$VIEWUI.transfer` 的直接命中元件？
9. `$VIEWUI.size` 和 `$VIEWUI.transfer` 在基礎元件中的作用方式有什麼差異？
10. 如果你要繼續追蹤 `transfer` 的完整行為，下一個應該閱讀哪個元件或模組？

---

## 11. 後續延伸方向

這份筆記後續可以拆成以下主題：

1. **`Tooltip.transfer` 內部實作分析**  
   追蹤 `Tooltip` 如何根據 `transfer` 決定浮層掛載位置、事件處理與銷毀流程。

2. **View UI Plus 浮層系統總覽**  
   比較 `Tooltip`、`Poptip`、`Dropdown`、`Select`、`Modal` 等元件如何處理浮層掛載與 z-index。

3. **`$VIEWUI.transfer` 在其他元件目錄中的命中矩陣**  
   把範圍從 `07-basic-components/` 擴展到表單元件、資料展示元件與彈窗元件。

4. **Vue 3 中的全域設定與元件 default 設計模式**  
   分析 `globalProperties`、`getCurrentInstance()`、prop default function 之間的關係。

5. **全域預設值與局部 prop 的優先序設計**  
   以 `$VIEWUI.size`、`$VIEWUI.transfer`、`$VIEWUI.cell` 為案例，比較不同全域設定如何被元件消化。

6. **元件組合中的 prop forwarding 模式**  
   以 `AvatarList -> Tooltip`、`AvatarList -> Avatar` 為例，分析聚合元件如何把不同 prop 分派給不同子元件。
