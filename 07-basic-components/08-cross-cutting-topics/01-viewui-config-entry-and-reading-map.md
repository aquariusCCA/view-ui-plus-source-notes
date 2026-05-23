# `$VIEWUI` Config Entry And Reading Map：全域設定入口與基礎元件命中地圖

## 0. 原始筆記問題分析

`$VIEWUI` 很容易被誤解成某個元件的 prop，或被當成和 `$Message`、`$Modal` 一樣的命令式 API。

實際上，`$VIEWUI` 是 View UI Plus plugin install 階段建立的 runtime config container。它本身不渲染 UI，也不主動改變畫面；只有當元件在 runtime 讀取它時，才會影響元件的預設行為。

本篇先建立整張閱讀地圖，後面三篇再分別展開：

```txt
$VIEWUI.size
$VIEWUI.transfer
$VIEWUI.cell
```

## 1. 本章定位

本章回答四個問題：

1. `$VIEWUI` 從哪裡來？
2. `$VIEWUI` 的 runtime shape 和 type declaration 如何對照？
3. 基礎元件用哪些方式讀取 `$VIEWUI`？
4. `07-basic-components/` 中哪些元件真的受 `$VIEWUI` 影響？

本章不深入講每個設定造成的畫面差異。那些內容拆到後續筆記。

## 2. Source Baseline

| Source | 閱讀重點 |
| --- | --- |
| `src/index.js` | `install(app, opts)` 如何建立 `$VIEWUI`。 |
| `src/mixins/globalConfig.js` | 元件如何把 `$VIEWUI` 存到 `this.globalConfig`。 |
| `types/index.d.ts` | `ViewUIPlusGlobalOptions` 如何描述 install options 與 `$VIEWUI`。 |
| `src/components/*` | 各元件是否實際讀取 `$VIEWUI`。 |

完整路徑：

```txt
01-origin/source/view-ui-plus-v1.3.20/src/index.js
01-origin/source/view-ui-plus-v1.3.20/src/mixins/globalConfig.js
01-origin/source/view-ui-plus-v1.3.20/types/index.d.ts
```

## 3. `$VIEWUI` 產生流程

使用者在 app entry 可能這樣安裝：

```js
app.use(ViewUIPlus, {
    size: 'large',
    transfer: true,
    cell: {
        arrow: 'ios-arrow-forward'
    }
});
```

`src/index.js` 的 install 流程會把 `opts` 整理後寫入：

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

資料流可以整理成：

```txt
app.use(ViewUIPlus, options)
  -> install(app, opts)
  -> normalize opts
  -> app.config.globalProperties.$VIEWUI
  -> component instance 讀取 globalProperties.$VIEWUI
```

這代表 `$VIEWUI` 是 Vue app 層級的全域設定，不是單一元件的本地狀態。

## 4. Runtime Shape 與 Type Declaration

`types/index.d.ts` 中的 `ViewUIPlusGlobalOptions` 描述了 `$VIEWUI` / install options 的 public shape。

和基礎元件最相關的是：

| Key | Type declaration | Runtime default |
| --- | --- | --- |
| `size` | `size?: string` | `opts.size || ''` |
| `transfer` | `transfer?: boolean \| string` | key 存在時用 `opts.transfer`，否則 `''` |
| `cell.arrow` | `string` | 沒設定時 `''` |
| `cell.customArrow` | `string` | 沒設定時 `''` |
| `cell.arrowSize` | `number \| string` | 沒設定時 `''` |

這裡要分清楚兩件事：

| 層次 | 負責回答 |
| --- | --- |
| Type declaration | 使用者可以傳入什麼 shape。 |
| Runtime install | 沒傳入時 `$VIEWUI` 實際長什麼樣子。 |

例如 `cell` 在 type 中是 optional，但 plugin install 完成後，runtime `$VIEWUI.cell` 會被建立成一個固定物件。

## 5. 元件讀取 `$VIEWUI` 的兩種方式

### 5.1 Prop default 直接讀 globalProperties

多數全域預設值會在 prop default 中直接讀：

```js
default () {
    const global = getCurrentInstance().appContext.config.globalProperties;
    return !global.$VIEWUI || global.$VIEWUI.size === '' ? 'default' : global.$VIEWUI.size;
}
```

基礎元件中，`Button`、`ButtonGroup`、`Avatar` 的 `size` 都是這種模式。

這種模式的重點是：

```txt
使用者有傳 prop
  -> 用 prop
使用者沒有傳 prop
  -> 執行 default()
  -> 讀 $VIEWUI
```

所以 `$VIEWUI` 只提供預設值，不會覆蓋使用者明確傳入的 prop。

### 5.2 `globalConfig` mixin

`src/mixins/globalConfig.js` 會在 `created()` 中讀取：

```js
this.globalConfig = instance.appContext.config.globalProperties.$VIEWUI;
```

基礎元件中，`Cell` 使用這個 mixin 讀取 `$VIEWUI.cell`：

```txt
mixins: [ mixinsLink, globalConfig ]
```

這種模式通常用在 component-specific config，例如 arrow icon、close icon、picker icon 等。

## 6. 基礎元件命中矩陣

`07-basic-components/` 目前整理的基礎元件中，實際命中 `$VIEWUI` 的位置如下。

| 元件 | Source | `$VIEWUI` key | 影響 |
| --- | --- | --- | --- |
| `Button` | `src/components/button/button.vue` | `size` | 未傳 `size` 時決定預設尺寸。 |
| `ButtonGroup` | `src/components/button/button-group.vue` | `size` | 未傳 `size` 時決定 group 尺寸 class。 |
| `Avatar` | `src/components/avatar/avatar.vue` | `size` | 未傳 `size` 時決定頭像尺寸路徑。 |
| `AvatarList` | `src/components/avatar-list/avatar-list.vue` | `transfer` | 未傳 `transfer` 時決定內部 `Tooltip` 是否 transfer。 |
| `Cell` | `src/components/cell/cell.vue` | `cell.arrow` / `cell.customArrow` / `cell.arrowSize` | 決定預設 arrow `Icon`。 |

沒有直接命中 `$VIEWUI` 的基礎元件：

| 元件 | 結論 |
| --- | --- |
| `Icon` | v1.3.20 中沒有直接讀取 `$VIEWUI`。 |
| `Divider` | v1.3.20 中沒有直接讀取 `$VIEWUI`。 |
| `Tag` | v1.3.20 中沒有直接讀取 `$VIEWUI`。 |
| `Badge` | v1.3.20 中沒有直接讀取 `$VIEWUI`。 |

這些沒有命中的元件也很重要。它們提醒我們不能因為 `$VIEWUI.size` 存在，就推論所有基礎元件都會讀取全域 size。

## 7. 與其他章節的關係

本目錄只處理 `$VIEWUI` 對基礎元件的實際影響。更上層的 plugin install 機制，請回看：

```txt
04-plugin-system/04-global-options-and-viewui-config.md
05-shared-logic/04-locale-and-global-config-mixins.md
```

個別元件內部細節，則回看：

```txt
07-basic-components/03-button-and-button-group/
07-basic-components/06-avatar-and-avatar-list/
07-basic-components/07-cell-and-cell-group/
```

本目錄的價值是把這些分散在不同元件中的全域設定讀取點收斂成一張地圖。

## 8. 常見誤區

| 誤區 | 正確理解 |
| --- | --- |
| `$VIEWUI` 是元件 prop | `$VIEWUI` 是 plugin install 寫入 `globalProperties` 的 runtime config。 |
| 設定 `$VIEWUI.size` 會影響所有基礎元件 | v1.3.20 中只確認影響 `Button`、`ButtonGroup`、`Avatar` 等實際讀取者。 |
| type declaration 有某個 key，就代表所有相關元件都會使用 | 仍要回到 runtime source 確認元件是否讀取該 key。 |
| `globalConfig` mixin 是唯一讀取方式 | 很多元件是在 prop default 中直接讀 `globalProperties.$VIEWUI`。 |

## 9. 本章總結

`$VIEWUI` 是 View UI Plus 在 plugin install 階段建立的全域預設值容器。閱讀它對基礎元件的影響時，不能只看 `types/index.d.ts`，也不能只看 `src/index.js`。

正確閱讀順序是：

```txt
install 建立了哪些 key
  -> type declaration 如何描述這些 key
  -> 哪些 component 實際讀取這些 key
  -> 讀取結果如何進入 props default、computed、render 或子元件 props
```

## 10. 自我檢查問題

1. `$VIEWUI` 是在哪個檔案、哪個流程中建立的？
2. `Button.size` 為什麼要看 prop default，而不是只看 class computed？
3. `Cell` 為什麼需要 `globalConfig` mixin？
4. `AvatarList` 讀取 `$VIEWUI.transfer` 後，實際把值傳給哪個子元件？
5. 為什麼 `Icon`、`Divider`、`Tag`、`Badge` 應該被列為不受 `$VIEWUI` 直接影響的對照組？
