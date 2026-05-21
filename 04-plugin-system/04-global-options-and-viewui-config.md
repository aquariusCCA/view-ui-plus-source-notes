# View UI Plus 全域 Options 與 `$VIEWUI` 配置注入機制

## 1. 本章定位

本篇筆記屬於 **Vue plugin 配置注入筆記 + View UI Plus runtime contract 分析筆記**。

它位於 `04-plugin-system/` 目錄下是合理的，因為本篇分析的是 plugin install 階段如何處理使用者傳入的全域 options，而不是單一元件的內部實作。

本章主要回答以下問題：

1. `app.use(ViewUIPlus, options)` 傳入的 `options` 最後如何變成 `this.$VIEWUI`？
2. `$VIEWUI` 在 View UI Plus plugin system 中負責什麼？
3. top-level options 和 component-specific config 有什麼差異？
4. 為什麼 source 中有些欄位用 key-existence 判斷，有些欄位用 truthy fallback？
5. runtime `$VIEWUI` 和 `types/index.d.ts` 中的 `ViewUIPlusGlobalOptions` 應該如何一起閱讀？

本章不深入處理以下內容：

1. 不詳細分析各 component 如何實際讀取 `$VIEWUI`。
2. 不展開每個 icon、arrow、toolbar 設定對畫面造成的具體 UI 差異。
3. 不深入分析 `$Message`、`$Modal` 等命令式 API。
4. 不完整分析 `types/index.d.ts` 中所有型別細節。
5. 不討論 tree-shaking、build output 或按需引入策略。

這些內容可以拆到後續筆記，例如：

- `04-plugin-system/05-global-properties.md`
- `04-plugin-system/07-runtime-type-contract.md`
- `06-type-system/`
- `07-components/`
- `10-imperative-api/`

---

## 2. 學習前先建立的基本觀念

### 2.1 `options` 是使用者對整個 UI library 的全域設定

在 Vue 3 中，使用者可以透過 `app.use(plugin, options)` 把設定傳給 plugin。對 View UI Plus 這種 UI library 來說，這些 `options` 通常不是只服務某一個 component，而是影響整套 library 的預設行為。

例如：

```js
app.use(ViewUIPlus, {
  size: 'default',
  transfer: true,
  capture: false,
  modal: {
    maskClosable: false
  }
});
```

這段設定的意思可以理解為：

```txt
我希望 View UI Plus 在整個 Vue App 中，
使用這些預設行為與元件設定。
```

plugin install 階段會接收這份 `options`，再把它轉換成 View UI Plus 內部統一使用的 runtime config，也就是 `$VIEWUI`。

---

### 2.2 `$VIEWUI` 是 plugin system 和 component implementation 的交界

`$VIEWUI` 是被寫入 Vue instance 的全域設定物件：

```js
app.config.globalProperties.$VIEWUI = { ... };
```

這代表 component instance 可以透過 `this.$VIEWUI` 取得這份設定。

從架構角度來看，`$VIEWUI` 是一個「交界層」：

```txt
使用者傳入 options
  -> plugin install 整理 options
  -> 寫入 app.config.globalProperties.$VIEWUI
  -> 各 component 在 runtime 讀取 $VIEWUI
  -> component 根據全域設定調整行為
```

所以，`$VIEWUI` 本身不是 UI component，也不是 service API，而是 View UI Plus 讓各元件共享全域預設值的一個設定容器。

---

### 2.3 `$VIEWUI` 和 `$Message`、`$Modal` 的差異

在 `View UI Plus` 的 plugin install 中，很多東西都可能被掛到 `app.config.globalProperties` 上。這容易讓初學者誤以為它們都是同一類能力。

但實際上，`$VIEWUI` 和 `$Message`、`$Modal` 的用途不同。

| 項目 | 類型 | 用途 | 使用方式 |
| --- | --- | --- | --- |
| `$VIEWUI` | 全域設定物件 | 保存 View UI Plus 的 runtime config | `this.$VIEWUI.size`、`this.$VIEWUI.modal` |
| `$Message` | 命令式 service API | 透過 JavaScript 主動顯示訊息 | `this.$Message.success('操作成功')` |
| `$Modal` | 命令式 service API | 透過 JavaScript 主動開啟彈窗 | `this.$Modal.confirm({...})` |
| `$Date` | 工具物件 | 暴露日期工具，例如 `dayjs` | `this.$Date(...)` |

因此，本篇只聚焦 `$VIEWUI`。至於 `$Message`、`$Modal` 等 service API，應放到 imperative API 相關筆記中分析。

---

## 3. 整體概覽

本篇的核心 source 是：

```txt
01-origin/source/view-ui-plus-v1.3.20/src/index.js
```

重點區塊是 `install(app, opts)` 中寫入：

```js
app.config.globalProperties.$VIEWUI = { ... };
```

可以把整個流程理解成：

```txt
使用者 main.js / main.ts
  -> app.use(ViewUIPlus, options)
    -> ViewUIPlus.install(app, options)
      -> install(app, opts)
        -> 讀取 opts
        -> 建立 $VIEWUI object
        -> 寫入 app.config.globalProperties.$VIEWUI
          -> components runtime 可透過 this.$VIEWUI 讀取
```

`$VIEWUI` 中的設定可以分成兩大類：

1. **Top-level options**  
   這些設定直接影響整體 View UI Plus 行為，例如 `size`、`capture`、`transfer`。

2. **Component-specific config**  
   這些設定針對特定 component 或 component family，例如 `modal.maskClosable`、`select.arrow`、`datePicker.icon`、`typography.copyConfig`、`image.toolbar` 等。

本篇最重要的觀念是：

```txt
plugin install 不負責決定每個元件最後如何渲染，
但它負責建立所有元件可以共同讀取的全域設定結構。
```

也就是說，plugin system 負責「配置注入」，component implementation 負責「讀取並套用配置」。

---

## 4. 核心內容逐步講解

### 4.1 `$VIEWUI` 的角色：全域預設值容器

`$VIEWUI` 的用途不是暴露命令式 API，而是讓 components 在 runtime 讀取全域預設值。

這點很重要，因為 UI library 的很多行為需要有「全域預設」與「單一元件覆寫」兩層設計。

例如一個元件可能有自己的 prop：

```vue
<Select size="large" />
```

但 library 也可能允許使用者在安裝階段設定全域預設：

```js
app.use(ViewUIPlus, {
  size: 'large'
});
```

這樣使用者就不必在每個 component 上重複指定相同設定。

因此，`$VIEWUI` 可以理解成 View UI Plus 在 runtime 中保存全域預設值的地方。各 component 可以根據自己的需要讀取其中的設定，再決定如何和 component-level props 合併。

需要注意的是，本篇沒有提供各 component 讀取 `$VIEWUI` 的具體 source，所以不能直接斷言每個 component 的優先順序一定是「props 優先於 global config」。通常 UI library 會採用這種設計，但實際行為仍需要到各 component 原始碼確認。

此處需要後續補充：

```txt
各 component 實際讀取 $VIEWUI 的 source 位置與優先順序。
```

---

### 4.2 Top-level options：影響整體 library 行為

`$VIEWUI` 的 top-level 設定：

| `$VIEWUI` key | Option source | Default behavior |
| --- | --- | --- |
| `size` | `opts.size` | 沒有設定時為空字串 |
| `capture` | `opts.capture` | key 存在時用使用者值，否則為 `true` |
| `transfer` | `opts.transfer` | key 存在時用使用者值，否則為空字串 |

這些 key 之所以被放在 top-level，是因為它們比較像整個 View UI Plus 的基礎行為設定，而不是只屬於某個單一 component。

#### `size`

`size` 通常用來控制元件尺寸的全域預設。

這代表 runtime config 會保留一個穩定 shape：

```js
$VIEWUI.size
```

即使使用者沒有傳入 `opts.size`，這個 key 仍可能存在，只是值是空字串。這樣 component 端讀取時，可以避免每次都先判斷 `$VIEWUI` 是否有這個 key。

#### `capture`

`capture` 的 default behavior 比較特別：如果 `opts` 中存在 `capture` 這個 key，就使用使用者值；否則預設為 `true`。

這代表：

```js
app.use(ViewUIPlus, {
  capture: false
});
```

應該可以保留 `false`，而不是因為 `false` 是 falsy value 就退回預設值。

這是 key-existence 判斷的典型用途。

#### `transfer`

`transfer` 同樣使用 key-existence 判斷。key 存在時用使用者值，否則為空字串。

這代表使用者傳入 `false` 時，也可能是有意義的設定，不應被一般 truthy fallback 吃掉。

---

### 4.3 Component-specific config：針對特定元件族群的預設設定

除了 top-level options，`$VIEWUI` 還包含多個 component-specific config。這些 config 不一定會影響整個 library，而是影響特定 component 或特定元件族群。

整理如下：

| `$VIEWUI` key | Config fields |
| --- | --- |
| `cell` | `arrow`, `customArrow`, `arrowSize` |
| `menu` | `arrow`, `customArrow`, `arrowSize` |
| `modal` | `maskClosable` |
| `tabs` | `closeIcon`, `customCloseIcon`, `closeIconSize` |
| `select` | `arrow`, `customArrow`, `arrowSize` |
| `colorPicker` | `arrow`, `customArrow`, `arrowSize` |
| `cascader` | `arrow`, `customArrow`, `arrowSize`, `itemArrow`, `customItemArrow`, `itemArrowSize` |
| `tree` | `arrow`, `customArrow`, `arrowSize` |
| `datePicker` | `icon`, `customIcon`, `iconSize` |
| `timePicker` | `icon`, `customIcon`, `iconSize` |
| `typography` | `copyConfig`, `editConfig`, `ellipsisConfig` |
| `space` | `size` |
| `image` | `toolbar` |

這些設定可以分成幾組理解：

#### 1. Arrow 類設定

包含：

- `cell.arrow`
- `menu.arrow`
- `select.arrow`
- `colorPicker.arrow`
- `cascader.arrow`
- `tree.arrow`

這些設定看起來都和元件中的箭頭圖示有關。常見 pattern 是同時提供：

```txt
arrow
customArrow
arrowSize
```

這表示 View UI Plus 可能允許使用者調整預設箭頭、客製箭頭或箭頭尺寸。

不過，具體如何渲染 icon，需要到各 component 實作中確認。本篇只確認 `$VIEWUI` 的 config shape。

#### 2. Icon 類設定

包含：

- `datePicker.icon`
- `datePicker.customIcon`
- `datePicker.iconSize`
- `timePicker.icon`
- `timePicker.customIcon`
- `timePicker.iconSize`

這類設定通常和日期、時間選擇器的觸發圖示或顯示圖示有關。

#### 3. Close icon 類設定

包含：

- `tabs.closeIcon`
- `tabs.customCloseIcon`
- `tabs.closeIconSize`

這代表 Tabs 元件可能允許設定關閉圖示相關行為。

#### 4. Modal 行為設定

包含：

- `modal.maskClosable`

這是比較偏行為型的設定，不是單純 icon 或樣式設定。它通常表示點擊遮罩是否可以關閉 modal。

此欄位需要特別注意，因為它是布林語意很強的設定，`false` 必須能被保留下來。

#### 5. Typography 功能設定

包含：

- `typography.copyConfig`
- `typography.editConfig`
- `typography.ellipsisConfig`

這類設定通常和 Typography 元件的複製、編輯、省略功能有關。

#### 6. Space 與 Image 設定

包含：

- `space.size`
- `image.toolbar`

`space.size` 看起來是 Space 元件的尺寸或間距設定；`image.toolbar` 則看起來和 Image 元件工具列設定有關。具體語意仍需對照 component source。

---

### 4.4 Fallback pattern：空字串、`false` 與 key-existence 的差異

source 中常見的 fallback pattern 類似：

```js
arrow: opts.select ? opts.select.arrow ? opts.select.arrow : '' : ''
```

這個寫法的意思是：

```txt
如果 opts.select 存在，且 opts.select.arrow 是 truthy，就使用 opts.select.arrow；
否則使用空字串。
```

也就是說，缺省時多數欄位會落到空字串，而不是 `undefined`。

這對 component 端有兩個可能好處：

1. `$VIEWUI` 的 shape 較穩定，component 可以預期某些 key 存在。
2. 空字串可以作為「沒有使用者設定，請使用 component 自身預設」的訊號。

不過，這種 truthy fallback 有一個重要限制：如果使用者傳入的是 `false`、`0` 或空字串，這些值都會被視為 falsy，然後 fallback 到預設值。

因此，對布林語意明確的設定，不能隨便用 truthy fallback。

---

### 4.5 key-existence pattern：保留 `false` 的設定語意

`modal.maskClosable` 使用 key-existence 判斷：

```js
maskClosable: opts.modal ? 'maskClosable' in opts.modal ? opts.modal.maskClosable : '' : ''
```

這種寫法和前面的 truthy fallback 不同。它不是判斷 `opts.modal.maskClosable` 是否為 truthy，而是判斷 `maskClosable` 這個 key 是否存在。

因此：

```js
app.use(ViewUIPlus, {
  modal: {
    maskClosable: false
  }
});
```

在語意上就可以保留 `false`。

這是布林設定非常重要的處理方式，因為 `false` 不是「沒有設定」，而是使用者明確表示「不要」。

可以用下表理解：

| 判斷方式 | 使用者傳入 `false` | 結果 | 適合場景 |
| --- | --- | --- | --- |
| truthy fallback | 被視為 falsy | 可能退回預設值 | 字串、icon name、尺寸等非布林值 |
| key-existence | key 存在即可保留值 | `false` 被保留 | 布林開關、明確允許關閉的設定 |

這個差異是閱讀 UI library options 處理邏輯時非常重要的觀察點。

---

### 4.6 `capture` 與 `transfer` 的 key-existence 判斷

`capture` 和 `transfer` 使用 key-existence 判斷，這代表 `false` 是有效值。

這裡可以建立一個閱讀原則：

```txt
只要某個 option 可能需要明確支援 false，
就應該確認 source 是否使用 key-existence 判斷，而不是 truthy fallback。
```

例如：

```js
app.use(ViewUIPlus, {
  capture: false,
  transfer: false
});
```

如果 source 使用：

```js
opts.capture ? opts.capture : true
```

那麼 `false` 會被吃掉，最後回到 `true`。這通常不是使用者期待的行為。

但如果 source 使用類似：

```js
'capture' in opts ? opts.capture : true
```

就能正確保留 `false`。

`capture` 和 `transfer` 使用 key-existence 判斷，代表 `false` 是有效值。

---

### 4.7 `$VIEWUI` 的 runtime shape 與穩定性

`$VIEWUI` 不是隨意把 `opts` 原封不動塞進去，而是重新建立一個有固定 shape 的 object。

這樣做有幾個好處：

1. **component 讀取時比較穩定**  
   component 不需要每次都判斷整個 `opts` 是否存在，而是讀取 `$VIEWUI.xxx`。

2. **可以統一處理 default value**  
   plugin install 階段先處理 fallback，component 端就不需要重複處理。

3. **可以把使用者 options 轉成內部使用格式**  
   外部 API 和內部 config shape 不一定要完全一樣，plugin 可以在中間做轉換。

4. **方便型別契約對齊**  
   runtime `$VIEWUI` 的 shape 可以和 `ViewUIPlusGlobalOptions` 一起維護。

不過，這種設計也有一個維護成本：只要 runtime 新增或刪除 `$VIEWUI` key，就應該同步檢查型別宣告與 component 使用端是否一致。

---

### 4.8 `types/index.d.ts`：使用者 options 的型別契約

`types/index.d.ts` 中的 `ViewUIPlusGlobalOptions` 描述 `$VIEWUI` 和 install options 的主要結構。

這裡要特別分清楚兩種東西：

| 層次 | 負責內容 | 閱讀重點 |
| --- | --- | --- |
| runtime `$VIEWUI` | 程式實際執行時建立的 config object | 真正的 fallback value、實際 key、實際注入結果 |
| `ViewUIPlusGlobalOptions` | TypeScript 對使用者 options 的型別描述 | 使用者傳入 options 時 IDE 與 type-checking 的 contract |

理想情況下，兩者應該對齊。

如果 runtime 支援：

```js
app.use(ViewUIPlus, {
  image: {
    toolbar: ...
  }
});
```

但 type declaration 沒有描述 `image.toolbar`，使用 TypeScript 的使用者就可能遇到型別錯誤。

反過來，如果 type declaration 宣告了某個 option，但 runtime 沒有實際處理，使用者就會以為可以設定，但執行時沒有作用。

因此，讀這類 UI library 原始碼時，不能只看 `src/index.js`，還要對照：

```txt
types/index.d.ts
```

---

## 5. 表格整理

### 5.1 `$VIEWUI` top-level options 表

| `$VIEWUI` key | Option source | Default behavior | 判斷方式 | 閱讀重點 |
| --- | --- | --- | --- | --- |
| `size` | `opts.size` | 沒有設定或為 falsy 時 fallback 到空字串 | truthy fallback | 通常作為全域尺寸預設 |
| `capture` | `opts.capture` | key 存在時用使用者值，否則為 `true` | key-existence | `false` 是有效值，不能被 truthy fallback 吃掉 |
| `transfer` | `opts.transfer` | key 存在時用使用者值，否則為空字串 | key-existence | `false` 是有效值，需保留使用者意圖 |

---

### 5.2 Component-specific config 表

| `$VIEWUI` key | Config fields | 可能影響的元件 | 設定類型 | 閱讀重點 |
| --- | --- | --- | --- | --- |
| `cell` | `arrow`, `customArrow`, `arrowSize` | `Cell` | icon / arrow | 確認 Cell 如何讀取箭頭設定 |
| `menu` | `arrow`, `customArrow`, `arrowSize` | `Menu` | icon / arrow | 確認 Menu 展開箭頭如何套用 |
| `modal` | `maskClosable` | `Modal` | behavior | 注意 `false` 是否能被保留 |
| `tabs` | `closeIcon`, `customCloseIcon`, `closeIconSize` | `Tabs` | close icon | 確認可關閉 Tab 的圖示設定 |
| `select` | `arrow`, `customArrow`, `arrowSize` | `Select` | icon / arrow | 常見於下拉選單箭頭 |
| `colorPicker` | `arrow`, `customArrow`, `arrowSize` | `ColorPicker` | icon / arrow | 確認下拉或面板箭頭設定 |
| `cascader` | `arrow`, `customArrow`, `arrowSize`, `itemArrow`, `customItemArrow`, `itemArrowSize` | `Cascader` | icon / arrow | 同時有整體箭頭與 item 箭頭 |
| `tree` | `arrow`, `customArrow`, `arrowSize` | `Tree` | icon / arrow | 確認節點展開箭頭設定 |
| `datePicker` | `icon`, `customIcon`, `iconSize` | `DatePicker` | icon | 確認日期選擇器觸發圖示 |
| `timePicker` | `icon`, `customIcon`, `iconSize` | `TimePicker` | icon | 確認時間選擇器觸發圖示 |
| `typography` | `copyConfig`, `editConfig`, `ellipsisConfig` | `Typography` | feature config | 複製、編輯、省略等功能設定 |
| `space` | `size` | `Space` | layout / spacing | 確認間距或尺寸如何套用 |
| `image` | `toolbar` | `Image` | toolbar config | 確認預覽或工具列設定 |

---

### 5.3 Fallback pattern 比較表

| Pattern | 範例 | 能否保留 `false` | 適合用途 | 注意事項 |
| --- | --- | --- | --- | --- |
| truthy fallback | `opts.select ? opts.select.arrow ? opts.select.arrow : '' : ''` | 不適合 | icon name、custom icon、size 等非布林設定 | `false`、`0`、空字串都會被視為缺省 |
| key-existence fallback | `'maskClosable' in opts.modal ? opts.modal.maskClosable : ''` | 可以 | 布林開關、允許明確關閉的行為 | 要先確保父層物件存在 |
| default true with key-existence | key 存在用使用者值，否則 `true` | 可以 | 預設開啟，但允許使用者關閉 | `capture` 屬於此類 |

---

### 5.4 Runtime 與 Type Surface 對照表

| 面向 | Runtime `$VIEWUI` | `ViewUIPlusGlobalOptions` |
| --- | --- | --- |
| 所在位置 | `src/index.js` 的 `install(app, opts)` | `types/index.d.ts` |
| 主要責任 | 實際建立執行時 config object | 描述使用者可傳入 options 的型別 |
| 決定內容 | fallback value、config shape、globalProperties 注入 | IDE 提示、TypeScript type-checking |
| 維護風險 | 新增 key 但 component 沒讀取 | 型別宣告與 runtime 不一致 |
| 閱讀方式 | 看實際行為 | 看對外契約 |

---

## 6. 範例或情境說明

假設使用者這樣安裝 View UI Plus：

```js
import { createApp } from 'vue';
import ViewUIPlus from 'view-ui-plus';
import App from './App.vue';

const app = createApp(App);

app.use(ViewUIPlus, {
  size: 'large',
  capture: false,
  transfer: true,
  modal: {
    maskClosable: false
  },
  select: {
    arrow: 'ios-arrow-down',
    arrowSize: 16
  },
  image: {
    toolbar: ['zoomIn', 'zoomOut', 'rotate']
  }
});

app.mount('#app');
```

從 plugin install 的角度看，這些 options 會被整理進 `$VIEWUI`。

概念上可以理解成：

```txt
opts.size
  -> $VIEWUI.size

opts.capture
  -> $VIEWUI.capture

opts.transfer
  -> $VIEWUI.transfer

opts.modal.maskClosable
  -> $VIEWUI.modal.maskClosable

opts.select.arrow
  -> $VIEWUI.select.arrow

opts.select.arrowSize
  -> $VIEWUI.select.arrowSize

opts.image.toolbar
  -> $VIEWUI.image.toolbar
```

之後，各 component 在 runtime 中可以依照自己的需求讀取設定。例如：

```txt
Select component
  -> 讀取 $VIEWUI.select.arrow
  -> 決定下拉箭頭圖示

Modal component
  -> 讀取 $VIEWUI.modal.maskClosable
  -> 決定點擊遮罩是否關閉

Image component
  -> 讀取 $VIEWUI.image.toolbar
  -> 決定工具列項目
```

需要注意的是，上述 component 讀取流程是根據 `$VIEWUI` 設計目的所做的閱讀方向整理；實際讀取位置與優先順序仍需要到各 component source 補充確認。

---

## 7. 閱讀路線或學習路線

### 7.1 初次閱讀路線

第一次閱讀這部分原始碼時，建議按照以下順序：

1. **先讀 `src/index.js` 中 `install(app, opts)` 的 `$VIEWUI` 區塊**  
   目的是確認 `$VIEWUI` object 的完整 shape。

2. **整理 top-level options**  
   先抓出 `size`、`capture`、`transfer` 這類直接掛在 `$VIEWUI` 第一層的設定。

3. **整理 component-specific config**  
   再整理 `cell`、`menu`、`modal`、`tabs`、`select`、`image` 等 nested config。

4. **標記每個欄位的 fallback 行為**  
   特別注意哪些欄位用 truthy fallback，哪些欄位用 key-existence。

5. **對照 `types/index.d.ts`**  
   檢查 `ViewUIPlusGlobalOptions` 是否描述了 runtime 中實際支援的設定。

---

### 7.2 深入閱讀路線

理解 `$VIEWUI` 結構後，可以往三個方向深入。

第一個方向是 **component usage**。也就是追各 component 是否有讀取 `this.$VIEWUI` 或類似 global config 的邏輯，確認設定如何真的影響畫面或行為。

第二個方向是 **type contract**。也就是對照 `types/index.d.ts`，確認 runtime 支援的 options 是否都有完整型別宣告。

第三個方向是 **設計模式與重構分析**。也就是思考 View UI Plus 是否可以把重複的 fallback pattern 抽成 helper，降低 `opts.xxx ? opts.xxx.yyy ? ...` 這類巢狀判斷的重複程度。

---

### 7.3 可以暫時跳過的部分

如果本章目標只是理解 `$VIEWUI` 的配置注入流程，可以暫時跳過：

1. 各 component 的完整 template 或 render function。
2. icon 實際如何渲染。
3. toolbar 每個按鈕的具體功能。
4. Typography 的 copy / edit / ellipsis 內部實作。
5. service API 的命令式渲染流程。

這些內容都可以等 `$VIEWUI` 的整體結構理解後，再分別放到 component 筆記中分析。

---

## 8. 常見誤區

| 誤區 | 為什麼容易誤解 | 正確理解 |
| --- | --- | --- |
| 以為 `$VIEWUI` 是命令式 API | 它和 `$Message`、`$Modal` 一樣掛在 `globalProperties` 上 | `$VIEWUI` 是全域設定物件，不是用來主動呼叫 UI 的 service API |
| 以為 `options` 會原封不動變成 `$VIEWUI` | 從使用者角度看，兩者名稱與結構可能相似 | plugin install 會建立 runtime config shape，並處理 default / fallback |
| 以為所有 fallback 都一樣 | source 中很多欄位看起來都在做缺省處理 | truthy fallback 和 key-existence fallback 對 `false` 的處理完全不同 |
| 忽略 `false` 是有效設定 | JavaScript 中 `false` 是 falsy，容易被寫法不小心吃掉 | 對布林設定應確認是否使用 key-existence 判斷 |
| 只看 `src/index.js`，不看 `types/index.d.ts` | runtime source 已經能看出實際行為 | TypeScript 使用者還依賴型別契約，兩者應一起檢查 |
| 以為 component-specific config 的存在代表 component 一定有使用 | `$VIEWUI` shape 中有該 key，容易直接推論 | 還需要追 component source，確認是否讀取與如何套用 |
| 把空字串當成沒有意義 | 多數 fallback 會落到空字串 | 空字串可能是 component 端判斷「使用自身預設」的訊號 |

---

## 9. 本章總結

本章的核心觀念是：`$VIEWUI` 是 View UI Plus 在 plugin install 階段建立的 runtime global config object。

使用者透過：

```js
app.use(ViewUIPlus, options);
```

傳入全域設定後，`install(app, opts)` 會讀取 `opts`，建立 `$VIEWUI`，並寫入：

```js
app.config.globalProperties.$VIEWUI
```

這使得 View UI Plus 的 components 可以在 runtime 中透過 component instance 讀取全域設定。

`$VIEWUI` 的設定可以分成兩層。第一層是 top-level options，例如 `size`、`capture`、`transfer`，它們偏向整體 library 行為。第二層是 component-specific config，例如 `modal.maskClosable`、`select.arrow`、`datePicker.icon`、`typography.copyConfig`、`image.toolbar`，它們偏向特定元件或功能族群。

閱讀這段 source 時，最重要的不是只記住有哪些 key，而是理解三件事：

第一，`$VIEWUI` 是 plugin system 和 component implementation 的交界。

第二，fallback pattern 會影響使用者傳入值的語意，尤其是 `false` 是否能被保留。

第三，runtime `$VIEWUI` 應該和 `types/index.d.ts` 中的 `ViewUIPlusGlobalOptions` 一起閱讀，才能同時掌握「實際執行行為」與「對外型別契約」。

---

## 10. 自我檢查問題

1. `$VIEWUI` 是什麼？它和 `$Message`、`$Modal` 有什麼不同？
2. 為什麼 View UI Plus 需要把 `options` 轉成 `$VIEWUI`，而不是讓各 component 自己直接讀 `opts`？
3. `size`、`capture`、`transfer` 為什麼可以視為 top-level options？
4. component-specific config 是什麼？請舉三個 `$VIEWUI` 中的 nested config 例子。
5. truthy fallback 和 key-existence fallback 對 `false` 的處理有什麼差異？
6. 為什麼 `modal.maskClosable` 需要使用 key-existence 判斷？
7. 如果 runtime 新增 `$VIEWUI.image.toolbar`，但 `types/index.d.ts` 沒有同步更新，可能會造成什麼問題？
8. 為什麼不能只看到 `$VIEWUI.select.arrow` 就斷言 Select component 一定有正確套用它？
9. 如果要確認 `$VIEWUI` 的某個設定是否真的影響 UI，下一步應該閱讀哪一類 source？
10. 如果要重構這段 options fallback code，你會優先觀察哪些重複 pattern？

---

## 11. 後續延伸方向

本篇主要建立 `$VIEWUI` 的配置注入心智模型。後續可以延伸成以下筆記：

1. `04-plugin-system/05-global-properties.md`  
   系統整理 View UI Plus 寫入 `app.config.globalProperties` 的所有屬性，區分 `$VIEWUI`、service APIs、工具物件等不同類型。

2. `04-plugin-system/07-runtime-type-contract.md`  
   對照 runtime `$VIEWUI` 和 `types/index.d.ts` 的 `ViewUIPlusGlobalOptions`，檢查實際行為與型別宣告是否一致。

3. `07-components/select-global-config.md`  
   追蹤 Select component 是否讀取 `$VIEWUI.select`，以及 `arrow`、`customArrow`、`arrowSize` 如何套用。

4. `07-components/modal-global-config.md`  
   追蹤 Modal component 如何讀取 `$VIEWUI.modal.maskClosable`，並確認 `false` 是否能正確關閉遮罩點擊關閉行為。

5. `07-components/date-time-picker-global-config.md`  
   分析 DatePicker / TimePicker 如何使用 `icon`、`customIcon`、`iconSize`。

6. `07-components/typography-global-config.md`  
   分析 Typography 的 `copyConfig`、`editConfig`、`ellipsisConfig` 如何與元件功能結合。

7. `12-style-system/global-icon-config.md`  
   從 icon / arrow / closeIcon / toolbar 的角度整理 View UI Plus 的全域視覺設定策略。

8. `13-refactor-notes/global-options-fallback-helper.md`  
   分析 `$VIEWUI` 建立邏輯中重複的 fallback pattern，思考是否可以抽出 helper function 降低維護成本。
