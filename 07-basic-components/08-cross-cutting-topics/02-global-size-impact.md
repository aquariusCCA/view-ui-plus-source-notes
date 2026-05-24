# Global Size Impact：`$VIEWUI.size` 對基礎元件預設尺寸的影響

## 1. 本章定位

本章是一篇「原始碼閱讀筆記 + 全域設定行為分析筆記」。它專門分析 View UI Plus 的 `$VIEWUI.size` 如何從 plugin install options 進入基礎元件，並最終影響元件的 class 或 inline style。

本章要解決的核心問題是：

```txt
app.use(ViewUIPlus, { size })
  -> $VIEWUI.size
  -> 元件的 size prop default
  -> this.size
  -> class / inline style
```

讀完本章後，你應該能理解三件事。

第一，`$VIEWUI.size` 是全域預設值，不是強制覆蓋機制。只要使用者在元件上明確傳入 `size` prop，元件就會以 prop 為準，而不是以 `$VIEWUI.size` 為準。

第二，同樣讀取 `$VIEWUI.size`，不同元件的落地方式不一定相同。`Button` 會把非 `default` 的 size 轉成 button size class；`ButtonGroup` 則會把包含 `default` 在內的 size 轉成 group class；`Avatar` 則可能走預設尺寸 class，也可能走自訂 inline style。

第三，不是所有基礎元件都受 `$VIEWUI.size` 影響。閱讀全域設定時，一定要回到元件 source 確認它是否真的讀取該 key，而不能只因為 `$VIEWUI.size` 存在就推論所有元件都會套用。

本章不處理表單、輸入、資料展示、彈層、選擇器等其他類別元件。那些元件也可能有自己的 `size` 設計，但不屬於本篇整理的 `07-basic-components/` 範圍。

---

## 2. 學習前先建立的基本觀念

### 2.1 `$VIEWUI` 是 runtime config container，不是元件本身

在 View UI Plus 中，`$VIEWUI` 是 plugin install 階段寫入 Vue app 的全域設定容器。它通常會被掛到：

```js
app.config.globalProperties.$VIEWUI
```

這代表 `$VIEWUI` 本身不渲染 UI，也不是某個具體元件。它只是保存 install options 正規化後的 runtime config。真正會影響畫面的，是那些在 runtime 主動讀取 `$VIEWUI` 的元件。

因此，閱讀 `$VIEWUI.size` 時不能只停在 `src/index.js`，還要繼續追到元件內部：

```txt
install 階段建立 $VIEWUI.size
  -> component prop default 讀取 $VIEWUI.size
  -> component computed / render / template 使用 this.size
  -> class 或 style 改變畫面
```

### 2.2 `prop default` 只在 prop 沒有被傳入時才會派上用場

`Button`、`ButtonGroup`、`Avatar` 都不是直接在 computed 中硬讀 `$VIEWUI.size` 來覆蓋目前尺寸，而是在 `size` prop 的 `default()` 中讀取全域設定。

這個位置非常重要。因為 prop default 的角色是「缺省值」：當使用者沒有傳入 prop 時，元件才會需要 default。如果使用者已經傳入 `size`，就應該以使用者明確傳入的值為準。

所以本章的第一個心智模型是：

```txt
明確 prop > 全域預設值 > 元件內建 default
```

這也是為什麼 `$VIEWUI.size` 應該被理解為 fallback，而不是 override。

### 2.3 `size` 的資料流要追到 class / style 才算讀完

在原始碼閱讀中，只看到元件拿到了 `this.size` 還不夠。你還要繼續看 `this.size` 最後怎麼被使用。

對 View UI Plus 的基礎元件來說，常見落地方式有兩種：

| 落地方式 | 說明 | 例子 |
| --- | --- | --- |
| class mapping | 把 `this.size` 組成 class name，再交給 CSS / Less 控制尺寸 | `Button`、`ButtonGroup`、`Avatar` 的標準尺寸 |
| inline style | 直接把 `this.size` 轉成 `width`、`height`、`lineHeight`、`fontSize` 等 style | `Avatar` 的自訂尺寸 |

也就是說，閱讀 `$VIEWUI.size` 的完整路線不是「看它有沒有被讀」，而是：

```txt
有沒有被讀
  -> 在哪裡被讀
  -> 讀到後變成什麼 prop 值
  -> prop 值最後如何映射到畫面
```

### 2.4 全域尺寸設定不等於 theme system

`$VIEWUI.size` 很容易被誤解成一種 theme 設定，例如「我設成 large，整個 UI 就全部變大」。它只影響實際在 `size` prop default 中讀取 `$VIEWUI.size` 的元件。

因此，`$VIEWUI.size` 更精準的定義是：

```txt
部分元件的 size prop 缺省值來源
```

它不是全域 CSS 變數，不是 design token，也不是會自動掃描所有元件並套用的尺寸系統。

---

## 3. 整體概覽

### 3.1 本章資料流

本章可以先用一張資料流來看全局：

```txt
使用者安裝 View UI Plus
  |
  | app.use(ViewUIPlus, { size: 'large' })
  v
src/index.js
  |
  | app.config.globalProperties.$VIEWUI = { size: opts.size || '' }
  v
$VIEWUI.size
  |
  | 被部分基礎元件的 size prop default 讀取
  v
Button / ButtonGroup / Avatar
  |
  | 各自把 this.size 轉成 class 或 inline style
  v
最終影響尺寸呈現
```

這條路線中最需要注意的是中間這一段：

```txt
$VIEWUI.size
  -> size prop default
```

如果某個元件沒有在 `size` prop default 中讀 `$VIEWUI.size`，或者父層元件已經主動把 `size` 傳給子元件，那麼 `$VIEWUI.size` 就不一定會生效。

### 3.2 Source Baseline

下列 source 觀察結果整理。

| Source | 在本章中的角色 | 閱讀重點 |
| --- | --- | --- |
| `src/index.js` | 全域設定建立入口 | 確認 `$VIEWUI.size` 如何由 install options 建立 |
| `src/components/button/button.vue` | `Button` 尺寸行為來源 | 確認 `size` prop default、validator 與 button class mapping |
| `src/components/button/button-group.vue` | `ButtonGroup` 尺寸行為來源 | 確認 `size` prop default 與 group class mapping |
| `src/components/avatar/avatar.vue` | `Avatar` 尺寸行為來源 | 確認標準尺寸 class 與自訂尺寸 inline style |
| `src/components/avatar-list/avatar-list.vue` | 反例與父子傳值案例 | 確認 `AvatarList` 自己不讀 `$VIEWUI.size`，且會把自己的 `size` 傳給子 `Avatar` |

這張表的閱讀價值在於：它不是只列出檔案，而是提醒你每個檔案要回答哪一個問題。閱讀原始碼時，最好不要一開始就陷入所有細節，而是帶著問題去讀。

### 3.3 本章核心結論先覽

`$VIEWUI.size` 在基礎元件中的直接命中對象是：

```txt
Button
ButtonGroup
Avatar
```

不應該列入 `$VIEWUI.size` 直接影響的基礎元件包括：

```txt
AvatarList
Icon
Divider
Tag
Badge
Cell
```

其中 `AvatarList` 是特別重要的案例，因為它內部雖然使用 `Avatar`，但自己的 `size` prop default 固定為 `default`，並且會把 `size` 傳給子 `Avatar`。當子 `Avatar` 已經收到明確的 `size` prop 時，就不會再使用自己的 `$VIEWUI.size` default。

---

## 4. 核心內容逐步講解

### 4.1 `$VIEWUI.size` 的來源：從 install options 到 runtime config

使用者可能會在 app entry 中這樣安裝 View UI Plus：

```js
app.use(ViewUIPlus, {
    size: 'large'
});
```

在 `src/index.js` 的 install 流程中，`opts.size` 會被整理後寫入 `$VIEWUI`：

```js
app.config.globalProperties.$VIEWUI = {
    size: opts.size || '',
    // ...
}
```

這段程式碼的重點在於 `opts.size || ''`。它代表如果使用者沒有傳入 `size`，或傳入的是 falsy value，runtime 中的 `$VIEWUI.size` 會變成空字串 `''`。

可以整理成下表：

| install option | runtime `$VIEWUI.size` | 說明 |
| --- | --- | --- |
| 未傳 `size` | `''` | 沒有全域尺寸設定，後續元件 default 會回到自身的 `default` |
| `size: 'large'` | `'large'` | 提供全域 large 預設值 |
| `size: 'small'` | `'small'` | 提供全域 small 預設值 |
| `size: 'default'` | `'default'` | 明確指定全域 default |
| `size: ''` | `''` | 因為是 falsy value，結果仍是空字串 |
| `size: null` / `undefined` | `''` | 因為是 falsy value，結果仍是空字串 |

這裡要特別和其他全域設定區分。`transfer`、`capture` 的處理方式不是單純 `opts.xxx || ''`，而可能使用 key-existence 判斷。因此你不能把 `$VIEWUI.size` 的 fallback 規則直接套到所有 `$VIEWUI` key 上。

對 `$VIEWUI.size` 來說，目前能確定的規則是：

```txt
只要 opts.size 是 falsy，runtime $VIEWUI.size 就會是 ''
```

---

### 4.2 共用讀取模式：在 `size` prop default 中讀 `$VIEWUI.size`

`Button`、`ButtonGroup`、`Avatar` 的共同點，是它們都在 `size` prop 的 default function 中讀取全域設定：

```js
const global = getCurrentInstance().appContext.config.globalProperties;
return !global.$VIEWUI || global.$VIEWUI.size === '' ? 'default' : global.$VIEWUI.size;
```

這段程式碼可以拆成三層理解。

第一層是取得 Vue app 的全域屬性：

```js
getCurrentInstance().appContext.config.globalProperties
```

這裡取得的是目前元件所在 Vue app 的 `globalProperties`。因為 `$VIEWUI` 是 plugin install 階段掛上去的，所以元件可以從這裡讀到它。

第二層是判斷 `$VIEWUI` 是否存在，以及 `$VIEWUI.size` 是否為空字串：

```js
!global.$VIEWUI || global.$VIEWUI.size === ''
```

如果 `$VIEWUI` 不存在，或 `$VIEWUI.size` 是 `''`，元件就回傳 `'default'`。

第三層是如果全域 size 有值，就把它當作 prop default：

```js
global.$VIEWUI.size
```

所以完整優先序是：

```txt
使用者傳入 size prop
  -> 使用使用者傳入的 size

使用者沒有傳入 size prop
  -> 執行 size.default()
  -> 讀取 $VIEWUI.size

$VIEWUI.size === ''
  -> 回到元件的 default

$VIEWUI.size 有值
  -> 使用全域 size
```

這裡的關鍵觀念是：`$VIEWUI.size` 不是在元件渲染過程中強制覆蓋 `this.size`，而只是提供 prop 缺省值。因此它不會覆蓋使用者明確寫在元件上的 prop。

---

### 4.3 `Button`：全域 size 進入 button size class

`Button` 的 source 位於：

```txt
src/components/button/button.vue
```

在 `Button` 中，`size` prop 有 validator：

```js
validator (value) {
    return oneOf(value, ['small', 'large', 'default']);
}
```

這表示 `Button` 對 `size` 的標準值預期是：

```txt
small
large
default
```

當 `this.size` 決定後，`Button` 會透過 class mapping 把尺寸轉成 class：

```js
[`ivu-btn-${this.size}`]: this.size !== 'default'
```

這段 class mapping 的設計很重要。它表示：

| 實際 `this.size` | Button size class | 說明 |
| --- | --- | --- |
| `default` | 不產生 size class | `default` 尺寸走基礎樣式，不額外產生 `ivu-btn-default` 作為 size class |
| `small` | `ivu-btn-small` | 小尺寸按鈕 |
| `large` | `ivu-btn-large` | 大尺寸按鈕 |

這裡最容易混淆的是 `ivu-btn-default`。在 `Button` 中，`default` 也可能出現在 button type 的語意裡，例如預設按鈕類型；size class mapping 來看，`Button` 不會因為 `size === 'default'` 而產生 `ivu-btn-default` 這個 size class。

因此閱讀 `Button` 時要把兩件事分開：

| 概念 | 說明 |
| --- | --- |
| button type default | 按鈕類型或視覺語意上的 default |
| button size default | 尺寸上的 default，不會透過 `ivu-btn-default` size class 表達 |

如果混在一起看，就很容易誤以為 `Button` 和 `ButtonGroup` 的 class 規則相同。

---

### 4.4 `ButtonGroup`：全域 size 進入 group class

`ButtonGroup` 的 source 位於：

```txt
src/components/button/button-group.vue
```

它的 `size` default 同樣會讀 `$VIEWUI.size`。但和 `Button` 最大的差異是 class mapping：

```js
[`ivu-btn-group-${this.size}`]: !!this.size
```

這代表只要 `this.size` 有值，就會產生對應的 group class。因為 prop default 最終通常會回傳 `'default'`，所以 `ButtonGroup` 會為 default size 產生 class。

整理如下：

| 實際 `this.size` | ButtonGroup class | 說明 |
| --- | --- | --- |
| `default` | `ivu-btn-group-default` | default 也會形成 group class |
| `small` | `ivu-btn-group-small` | 小尺寸群組 |
| `large` | `ivu-btn-group-large` | 大尺寸群組 |

這和 `Button` 的規則不同：

```txt
Button:
  default -> 不產生 size class

ButtonGroup:
  default -> 產生 ivu-btn-group-default
```

另外，`ButtonGroup` 沒有把 `size` prop 直接傳給子 `Button`。它是透過 group class 和 less selector 影響群組內按鈕的視覺。

這個設計代表 `ButtonGroup` 的尺寸行為是「群組容器主導」，而不是「把 size prop 分發給每一個 Button」。因此閱讀它時，不能只找子元件 props，也要追 CSS / Less selector 如何針對 group class 改變內部按鈕樣式。

---

### 4.5 `Avatar`：全域 size 可能進入 class，也可能進入 inline style

`Avatar` 的 source 位於：

```txt
src/components/avatar/avatar.vue
```

和 `Button` 相比，`Avatar` 的 `size` 支援範圍比較寬。支援形式包括：

```txt
small / default / large
自訂 String
自訂 Number
```

`Avatar` 對尺寸的處理可以分成兩條路線。

第一條路線是標準尺寸 class：

```js
[`ivu-avatar-${this.size}`]: oneOf(this.size, sizeList)
```

當 `this.size` 屬於標準尺寸清單時，`Avatar` 會產生對應 class。

第二條路線是自訂尺寸 inline style：

```js
if (this.size && !oneOf(this.size, sizeList)) {
    style.width = `${this.size}px`;
    style.height = `${this.size}px`;
    style.lineHeight = `${this.size}px`;
    style.fontSize = `${this.size/2}px`;
}
```

也就是說，當 `this.size` 有值，但不屬於標準尺寸清單時，`Avatar` 會把它當成自訂像素尺寸處理。

整理如下：

| 實際 `this.size` | Avatar 行為 | 尺寸來源 |
| --- | --- | --- |
| `default` | 產生 `ivu-avatar-default` | 預設 class 樣式 |
| `small` | 產生 `ivu-avatar-small` | 小尺寸 class 樣式 |
| `large` | 產生 `ivu-avatar-large` | 大尺寸 class 樣式 |
| 非預設尺寸 | 產生 inline `width` / `height` / `lineHeight` / `fontSize` | 依照 `this.size` 計算 |

這裡有一個設計上的細節需要特別注意：`$VIEWUI.size` 的 type 被視為 `string`，所以理論上使用者可能在 install 階段傳入非標準字串，例如：

```js
app.use(ViewUIPlus, {
    size: '48'
});
```

對 `Avatar` 來說，這類值可能會進入 inline style 路徑。但如果同一份 `$VIEWUI.size` 也會被 `Button` 讀取，就會碰到 `Button` validator 只接受 `small`、`large`、`default` 的問題。

因此，從整個元件庫一致性的角度來看，全域 `$VIEWUI.size` 不適合拿來放只對某個元件有意義的自訂尺寸。比較安全的使用方式是：

```txt
全域 $VIEWUI.size:
  使用 small / default / large

單一 Avatar 自訂尺寸:
  在 Avatar 上直接傳 size
```

例如：

```vue
<Avatar :size="48" />
```

這樣可以避免把 Avatar 專屬的自訂尺寸擴散到其他元件。

---

### 4.6 `AvatarList`：內部使用 `Avatar`，但不代表會吃到 `$VIEWUI.size`

`AvatarList` 是本章最適合用來訓練原始碼閱讀判斷力的案例。

直覺上，你可能會想：

```txt
AvatarList 裡面用了 Avatar
Avatar 會讀 $VIEWUI.size
所以 AvatarList 應該也會受到 $VIEWUI.size 影響
```

但這個推論是錯的。

原因是 `AvatarList` 自己的 `size` prop default 固定為 `default`，它不讀 `$VIEWUI.size`。更重要的是，它會把自己的 `size` 傳給子 `Avatar`。

這代表流程會變成：

```txt
app.use(ViewUIPlus, { size: 'large' })
  -> $VIEWUI.size = 'large'

<AvatarList />
  -> AvatarList.size = 'default'
  -> 子 Avatar 收到 size="default"
  -> 子 Avatar 不再執行自己的 size.default()
  -> 子 Avatar 不會讀 $VIEWUI.size
```

這裡的重點是 Vue props 的優先序。對子 `Avatar` 來說，只要父元件已經傳入 `size`，即使傳入的是 `'default'`，那也是明確 prop 值。既然 prop 已經有值，子元件就不需要執行自己的 default function。

因此，`AvatarList` 的案例提醒我們：閱讀全域設定時不能只看「某個子元件本身會不會讀 `$VIEWUI.size`」，還要看「父元件是否提前把 prop 傳給它」。

這種判斷方式在讀元件庫原始碼時很常見。很多表面上看似會繼承全域設定的元件，實際上可能因為父層有預設 prop 傳遞，而阻斷了子層的 global default。

---

### 4.7 受影響與不受影響的基礎元件

根據 `07-basic-components/` 範圍內的 `$VIEWUI.size` 命中情況如下。

| 元件 | 是否直接讀 `$VIEWUI.size` | 結論 | 閱讀重點 |
| --- | --- | --- | --- |
| `Button` | 是 | 受影響 | `size` prop default 讀取 `$VIEWUI.size`，再轉成 button size class |
| `ButtonGroup` | 是 | 受影響 | `size` prop default 讀取 `$VIEWUI.size`，再轉成 group class |
| `Avatar` | 是 | 受影響 | `size` prop default 讀取 `$VIEWUI.size`，可能走 class 或 inline style |
| `AvatarList` | 否 | 不直接受影響 | 自己的 `size` default 固定為 `default`，並傳給子 `Avatar` |
| `Icon` | 否 | 不直接受影響 | 沒有直接讀取 `$VIEWUI` |
| `Divider` | 否 | 不直接受影響 | 沒有直接讀取 `$VIEWUI` |
| `Tag` | 否 | 不直接受影響 | 沒有直接讀取 `$VIEWUI` |
| `Badge` | 否 | 不直接受影響 | 沒有直接讀取 `$VIEWUI` |
| `Cell` | 否 | 不受 top-level `size` 影響 | 它讀的是 `$VIEWUI.cell`，不是 `$VIEWUI.size` |

這張表的價值不只是告訴你哪些元件有影響，也是在訓練一個原始碼閱讀習慣：要同時整理「命中者」與「未命中者」。未命中者可以防止你做過度推論，例如誤以為 `Icon`、`Tag`、`Badge` 也會跟著全域 size 改變。

---

## 5. 表格整理

### 5.1 `$VIEWUI.size` 到畫面的轉換總表

| 階段 | 位置 / 寫法 | 負責事情 | 閱讀重點 |
| --- | --- | --- | --- |
| install option | `app.use(ViewUIPlus, { size })` | 使用者提供全域尺寸設定 | 這只是輸入，不代表所有元件都會套用 |
| runtime config | `app.config.globalProperties.$VIEWUI.size = opts.size || ''` | 建立 runtime 全域設定值 | falsy value 會變成 `''` |
| prop default | `size.default()` | 使用者未傳 `size` 時提供缺省值 | `$VIEWUI.size` 在這裡是 fallback |
| component state | `this.size` | 元件實際使用的尺寸值 | 可能來自 prop，也可能來自 `$VIEWUI.size` |
| visual mapping | class / inline style | 把尺寸值轉成畫面效果 | 不同元件 mapping 規則不同 |

這張表可以當作你之後讀其他 `$VIEWUI` key 的方法模板。全域設定不是讀到就結束，而是要一路追到畫面如何變化。

### 5.2 三個直接受影響元件比較表

| 元件 | 讀取方式 | `default` 尺寸行為 | `small` / `large` 行為 | 特殊注意 |
| --- | --- | --- | --- | --- |
| `Button` | `size` prop default 讀 `$VIEWUI.size` | 不產生 `ivu-btn-default` 作為 size class | 產生 `ivu-btn-small` / `ivu-btn-large` | `ivu-btn-default` 容易和 type class 混淆 |
| `ButtonGroup` | `size` prop default 讀 `$VIEWUI.size` | 產生 `ivu-btn-group-default` | 產生 `ivu-btn-group-small` / `ivu-btn-group-large` | 不直接把 `size` 傳給子 `Button` |
| `Avatar` | `size` prop default 讀 `$VIEWUI.size` | 產生 `ivu-avatar-default` | 產生 `ivu-avatar-small` / `ivu-avatar-large` | 非標準尺寸會走 inline style |

這三個元件的共同點是都讀 `$VIEWUI.size`，但差異在於「讀完之後怎麼使用」。這也是本章最重要的閱讀重點。

### 5.3 優先序表

| 使用情境 | 最終尺寸來源 | 說明 |
| --- | --- | --- |
| 元件明確傳入 `size` | 元件 prop | 使用者明確傳入 prop 時，prop 優先 |
| 元件未傳 `size`，且 `$VIEWUI.size` 有值 | `$VIEWUI.size` | 使用全域預設尺寸 |
| 元件未傳 `size`，且 `$VIEWUI.size === ''` | 元件 default | 回到 `default` |
| 父元件明確傳 `size` 給子元件 | 父元件傳入值 | 子元件不再執行自己的 prop default |
| 元件根本沒有讀 `$VIEWUI.size` | 元件自身邏輯 | 全域 size 不會自動生效 |

這張優先序表特別適合用來判斷 bug。當你發現某個元件沒有被全域 size 影響時，不要立刻判定是 `$VIEWUI.size` 失效，而要先確認它是否符合「元件未傳 `size` 且 prop default 有讀 `$VIEWUI.size`」這個條件。

---

## 6. 範例或情境說明

### 6.1 情境一：設定全域 large，Button 未傳 size

```js
app.use(ViewUIPlus, {
    size: 'large'
});
```

```vue
<Button>Save</Button>
```

此時 `Button` 沒有明確傳入 `size`，所以它會執行 `size.default()`。因為 `$VIEWUI.size` 是 `'large'`，所以 `Button` 的 `this.size` 會是 `'large'`，最後產生：

```txt
ivu-btn-large
```

這是 `$VIEWUI.size` 最典型的使用情境：用 install option 統一設定常見尺寸。

### 6.2 情境二：設定全域 large，但 Button 明確傳入 small

```js
app.use(ViewUIPlus, {
    size: 'large'
});
```

```vue
<Button size="small">Save</Button>
```

此時 `Button` 已經有明確的 `size="small"`，所以不會用 `$VIEWUI.size` 當 default。最後 `this.size` 會是 `'small'`，並產生：

```txt
ivu-btn-small
```

這個案例說明 `$VIEWUI.size` 不會覆蓋元件上的顯式 prop。

### 6.3 情境三：設定全域 large，但 AvatarList 不跟著變大

```js
app.use(ViewUIPlus, {
    size: 'large'
});
```

```vue
<AvatarList />
```

直覺上可能以為 `AvatarList` 內部使用 `Avatar`，所以它應該跟著變大。但 `AvatarList.size` default 固定為 `default`，而且會把 `size` 傳給內部 `Avatar`。

所以實際流程是：

```txt
AvatarList.size = 'default'
  -> 子 Avatar 收到 size="default"
  -> 子 Avatar 使用父層傳入值
  -> 不讀自己的 $VIEWUI.size default
```

因此，`AvatarList` 不應被列為 `$VIEWUI.size` 的直接影響元件。

### 6.4 情境四：想讓 Avatar 用 48px，不建議透過全域 size

如果你想讓單一 `Avatar` 變成 48px，比較合理的寫法是：

```vue
<Avatar :size="48" />
```

不建議寫成：

```js
app.use(ViewUIPlus, {
    size: '48'
});
```

原因是 `$VIEWUI.size` 會被多個元件讀取。`Avatar` 可能可以把非標準值轉成 inline style，但 `Button` 的 `size` validator 預期是 `small`、`large`、`default`。把 `48` 這種 Avatar 專用尺寸放到全域設定，容易造成跨元件語意不一致。

---

## 7. 閱讀路線或學習路線

### 7.1 初次閱讀路線

第一次讀這組原始碼時，建議照下面順序：

1. 先讀 `src/index.js`  
   目的不是看完整 plugin install，而是確認 `$VIEWUI.size` 如何建立，以及沒有傳入 `size` 時 runtime 值為什麼是 `''`。

2. 再讀 `src/components/button/button.vue`  
   先用 `Button` 當作最小案例，理解 `size.default()` 如何讀 `$VIEWUI.size`，以及 `this.size` 如何轉成 class。

3. 接著讀 `src/components/button/button-group.vue`  
   觀察它和 `Button` 的差異，特別是 `default` 也會產生 `ivu-btn-group-default`，以及它不直接傳 `size` 給子 `Button`。

4. 再讀 `src/components/avatar/avatar.vue`  
   補上另一種 mapping：同樣是 `size`，但 `Avatar` 可能走 class，也可能走 inline style。

5. 最後讀 `src/components/avatar-list/avatar-list.vue`  
   用它來理解「內部使用某個元件」不代表「會繼承該子元件的 global default」。

### 7.2 深入閱讀路線

如果要深入到更接近作者視角，可以再補讀以下方向：

1. `Button`、`ButtonGroup` 對應的 Less / CSS source  
   目標是確認 `ivu-btn-small`、`ivu-btn-large`、`ivu-btn-group-default`、`ivu-btn-group-small`、`ivu-btn-group-large` 實際如何控制 padding、高度、字體或邊框。

2. `Avatar` 對應樣式 source  
   目標是確認 `ivu-avatar-default`、`ivu-avatar-small`、`ivu-avatar-large` 的尺寸定義，以及 inline style 和 class style 的優先關係。

3. 其他類別元件的 `size` 設計  
   本章只看基礎元件，後續可以對表單元件、輸入元件、選擇器元件做同樣的命中矩陣。

4. Type declaration 與 runtime validator 的落差  
   若 `ViewUIPlusGlobalOptions.size` 的 type 較寬，但部分元件 validator 較窄，就需要思考全域設定對不同元件的相容性。

### 7.3 可以暫時跳過的部分

初學時可以先暫時跳過完整的樣式細節，例如所有 Less 變數、mixin、theme token。因為本章的第一目標是理解 `$VIEWUI.size` 的資料流，不是一次讀完樣式系統。

但當你要真正理解「尺寸差異長什麼樣子」時，就需要回頭補樣式 source。否則你只能知道 class 產生了，還不知道 class 對畫面造成什麼效果。

---

## 8. 常見誤區

| 誤區 | 為什麼容易誤解 | 正確理解 |
| --- | --- | --- |
| `$VIEWUI.size` 會覆蓋所有元件上的 `size` prop | 因為它叫全域設定，容易被理解成最高優先級 | 它只是在部分元件的 prop default 中提供 fallback；明確 prop 優先 |
| 所有基礎元件都會吃到 `$VIEWUI.size` | 因為 `$VIEWUI.size` 是全域 key | 只有實際讀取 `$VIEWUI.size` 的元件才會受影響 |
| `Button` 和 `ButtonGroup` 的 size class 規則相同 | 兩者都在 button 目錄下，也都讀 `size` | `Button` 不為 `default` size 產生 size class；`ButtonGroup` 會產生 `ivu-btn-group-default` |
| `AvatarList` 會跟著全域 size 改變 | 因為它內部使用 `Avatar` | `AvatarList` 自己的 `size` default 固定為 `default`，並把 `size` 傳給子 `Avatar` |
| `Avatar` 的 size 只會走 class | 標準尺寸確實是 class mapping | 非標準尺寸會走 inline style |
| 可以把任意自訂尺寸放進 `$VIEWUI.size` | `Avatar` 支援自訂尺寸，容易推論全域也可以這樣用 | 全域 size 會被多個元件讀取，應優先使用 `small` / `default` / `large` 這類跨元件安全值 |
| 看到 `ivu-btn-default` 就以為是 Button size class | `default` 同時可能出現在 type 和 size 語意中 | `Button` size mapping 不會為 `default` 產生 `ivu-btn-default` size class |

---

## 9. 本章總結

`$VIEWUI.size` 是 View UI Plus 在 plugin install 階段建立的全域尺寸預設值。它的 runtime 來源是 `src/index.js` 中的 `opts.size || ''`，因此未設定或傳入 falsy value 時，`$VIEWUI.size` 會是空字串。

在基礎元件範圍內，`$VIEWUI.size` 主要影響 `Button`、`ButtonGroup`、`Avatar`。這三個元件的共同點，是它們都在 `size` prop default 中讀取 `$VIEWUI.size`。因此，只有當使用者沒有明確傳入 `size` prop 時，全域 size 才會生效。

但這三個元件的落地方式並不相同。`Button` 只在 `small` / `large` 時產生 size class，不會為 `default` 產生 `ivu-btn-default` 作為 size class。`ButtonGroup` 則只要 `this.size` 有值，就會產生 group class，包括 `ivu-btn-group-default`。`Avatar` 則支援標準尺寸 class 與非標準尺寸 inline style 兩條路線。

本章最重要的心智模型可以整理成：

```txt
$VIEWUI.size
  -> 只是一個全域預設值
  -> 只有被元件 prop default 讀取時才生效
  -> 不會覆蓋使用者明確傳入的 size prop
  -> 不同元件會用不同方式轉成 class / style
```

閱讀元件庫原始碼時，不能只看全域設定有沒有某個 key，也不能只看元件名稱是否相關。正確做法是追完整資料流：

```txt
install options
  -> runtime $VIEWUI
  -> prop default
  -> this.size
  -> class / style
  -> 最終畫面
```

---

## 10. 自我檢查問題

1. `$VIEWUI.size` 是在哪個流程中建立的？沒有傳入 `size` 時，runtime 值是什麼？
2. 為什麼 `$VIEWUI.size` 應該被理解為 fallback，而不是 override？
3. `Button.size` 未傳時，元件如何決定最後的 `this.size`？
4. `Button` 為什麼不會因為 `size === 'default'` 而產生 `ivu-btn-default` size class？
5. `ButtonGroup` 和 `Button` 在 `default` size 的 class mapping 上有什麼差異？
6. `ButtonGroup` 為什麼不能只從「是否傳 prop 給子 Button」來理解尺寸效果？
7. `Avatar` 的標準尺寸和自訂尺寸分別走哪兩條處理路徑？
8. 為什麼不建議把只適合 `Avatar` 的自訂尺寸放到全域 `$VIEWUI.size`？
9. `AvatarList` 內部使用 `Avatar`，為什麼仍然不應被列為 `$VIEWUI.size` 的直接影響元件？
10. 如果你發現某個基礎元件沒有跟著全域 size 改變，你會依序檢查哪些地方？

---

## 11. 後續延伸方向

這份筆記之後可以延伸成幾個更深入的主題。

第一，可以拆出一篇 `Button` 與 `ButtonGroup` 的尺寸樣式分析，專門追蹤 `ivu-btn-small`、`ivu-btn-large`、`ivu-btn-group-default`、`ivu-btn-group-small`、`ivu-btn-group-large` 在 Less / CSS 中如何影響按鈕高度、padding、字體與排列。

第二，可以拆出一篇 `Avatar` 尺寸系統分析，深入比較標準尺寸 class 與自訂尺寸 inline style 的優先關係，以及 `fontSize = size / 2` 這類計算規則對文字頭像的影響。

第三，可以擴充成整個 View UI Plus 的 `size` 設定命中矩陣，從基礎元件擴展到表單元件、輸入元件、選擇器元件與資料展示元件，確認哪些元件使用 `$VIEWUI.size`，哪些元件只使用自己的 prop default。

第四，可以補一篇「全域設定與元件 prop 優先序」的通用閱讀筆記，用 `$VIEWUI.size`、`$VIEWUI.transfer`、`$VIEWUI.cell` 做比較，整理不同全域設定 key 的讀取模式與設計取捨。

第五，可以補一篇「Type declaration、runtime default、prop validator 的三方對照」筆記，用來理解為什麼 type 宣告能傳某些值，不代表每個元件都適合使用那些值。
